import { Router, type NextFunction, type Request, type Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.ts";
import { calcStreak, calcCompletionRate, type Frequency } from "../streak.ts";
import { XP_FOR_FREQUENCY, CHALLENGE_TARGET, CHALLENGE_BONUS_XP, newlyCrossedBadges } from "../gamification.ts";
import { getProfile, getWeeklyProgress } from "./gamification.ts";

export const habitsRouter = Router();

// Express 4 doesn't forward a rejected promise from an async handler to
// next() on its own — left unguarded, a thrown error becomes an unhandled
// rejection that crashes the whole process. This wraps a handler so any
// rejection reaches the error middleware instead.
function ah(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

const MAX_NAME_LENGTH = 200;

// Prisma's "record to delete/update not found" error — expected for an
// already-gone/idempotent delete, safe to treat as a no-op 204.
function isNotFoundError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025";
}

function isToday(date: Date): boolean {
  return date.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function serialize(habit: { id: string; name: string; frequency: Frequency; createdAt: Date; completions: { date: Date }[] }) {
  const dates = habit.completions.map((c) => c.date);
  return {
    id: habit.id,
    name: habit.name,
    frequency: habit.frequency,
    createdAt: habit.createdAt,
    streak: calcStreak(habit.frequency, dates),
    completionRate30d: calcCompletionRate(habit.frequency, dates),
    checkedToday: dates.some(isToday),
  };
}

habitsRouter.post(
  "/",
  ah(async (req, res) => {
    const { name, frequency } = req.body ?? {};
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > MAX_NAME_LENGTH ||
      (frequency !== "DAILY" && frequency !== "WEEKLY")
    ) {
      res.status(400).json({
        error: `name (non-empty string, max ${MAX_NAME_LENGTH} chars) and frequency (DAILY|WEEKLY) are required`,
      });
      return;
    }
    const habit = await prisma.habit.create({ data: { name, frequency }, include: { completions: true } });
    res.status(201).json(serialize(habit));
  }),
);

habitsRouter.get(
  "/",
  ah(async (_req, res) => {
    const habits = await prisma.habit.findMany({ include: { completions: true }, orderBy: { createdAt: "asc" } });
    res.json(habits.map(serialize));
  }),
);

habitsRouter.get(
  "/:id",
  ah(async (req, res) => {
    const habit = await prisma.habit.findUnique({ where: { id: req.params.id }, include: { completions: true } });
    if (!habit) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json(serialize(habit));
  }),
);

const MAX_RANGE_DAYS = 366;

habitsRouter.get(
  "/:id/completions",
  ah(async (req, res) => {
    const { from, to } = req.query;
    if (typeof from !== "string" || typeof to !== "string") {
      res.status(400).json({ error: "from and to (YYYY-MM-DD) are required" });
      return;
    }
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDate = new Date(`${to}T00:00:00.000Z`);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) {
      res.status(400).json({ error: "invalid date range" });
      return;
    }
    if ((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000) > MAX_RANGE_DAYS) {
      res.status(400).json({ error: `range must not exceed ${MAX_RANGE_DAYS} days` });
      return;
    }

    const habit = await prisma.habit.findUnique({ where: { id: req.params.id } });
    if (!habit) {
      res.status(404).json({ error: "not found" });
      return;
    }

    const completions = await prisma.completion.findMany({
      where: { habitId: habit.id, date: { gte: fromDate, lte: toDate } },
      select: { date: true },
    });
    res.json({ dates: completions.map((c) => c.date.toISOString().slice(0, 10)) });
  }),
);

habitsRouter.delete("/:id", async (req, res, next) => {
  try {
    await prisma.habit.delete({ where: { id: req.params.id } });
  } catch (err) {
    if (!isNotFoundError(err)) return next(err);
  }
  res.status(204).end();
});

// Awards XP/badges/weekly-challenge bonus for a genuinely new completion.
// Must be called after the completion row exists (weekly progress reads it back).
async function applyCheckinGamification(
  frequency: Frequency,
  priorDates: Date[],
  totalBefore: number,
  date: Date,
): Promise<{ xpGained: number; newBadges: string[] }> {
  const prevStreak = calcStreak(frequency, priorDates);
  const newStreak = calcStreak(frequency, [...priorDates, date]);
  const badgesCrossed = [
    ...newlyCrossedBadges("streak", prevStreak, newStreak),
    ...newlyCrossedBadges("checkins", totalBefore, totalBefore + 1),
  ];

  for (const badge of badgesCrossed) {
    await prisma.unlockedBadge.upsert({ where: { key: badge.key }, create: { key: badge.key }, update: {} });
  }

  let xpGained = XP_FOR_FREQUENCY[frequency];

  const { weekStart: ws, progress } = await getWeeklyProgress();
  if (progress >= CHALLENGE_TARGET) {
    const challenge = await prisma.weeklyChallenge.findUnique({ where: { weekStart: ws } });
    if (!challenge?.xpAwarded) {
      xpGained += CHALLENGE_BONUS_XP;
      await prisma.weeklyChallenge.upsert({
        where: { weekStart: ws },
        create: { weekStart: ws, xpAwarded: true },
        update: { xpAwarded: true },
      });
    }
  }

  const profile = await getProfile();
  await prisma.profile.update({ where: { id: profile.id }, data: { totalXp: profile.totalXp + xpGained } });

  return { xpGained, newBadges: badgesCrossed.map((b) => b.key) };
}

habitsRouter.post(
  "/:id/completions",
  ah(async (req, res) => {
    const dateStr: string = req.body?.date ?? new Date().toISOString().slice(0, 10);
    const date = new Date(`${dateStr}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      res.status(400).json({ error: "invalid date" });
      return;
    }

    const habit = await prisma.habit.findUnique({ where: { id: req.params.id }, include: { completions: true } });
    if (!habit) {
      res.status(404).json({ error: "not found" });
      return;
    }

    const priorDates = habit.completions.map((c) => c.date);
    const alreadyCheckedIn = priorDates.some((d) => d.getTime() === date.getTime());
    const totalBefore = alreadyCheckedIn ? 0 : await prisma.completion.count();

    await prisma.completion.upsert({
      where: { habitId_date: { habitId: habit.id, date } },
      create: { habitId: habit.id, date },
      update: {},
    });

    let xpGained = 0;
    let newBadges: string[] = [];
    if (!alreadyCheckedIn) {
      const result = await applyCheckinGamification(habit.frequency, priorDates, totalBefore, date);
      xpGained = result.xpGained;
      newBadges = result.newBadges;
    }

    const updated = await prisma.habit.findUniqueOrThrow({ where: { id: habit.id }, include: { completions: true } });
    res.status(201).json({ habit: serialize(updated), xpGained, newBadges });
  }),
);

habitsRouter.delete("/:id/completions/:date", async (req, res, next) => {
  const date = new Date(`${req.params.date}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return res.status(400).json({ error: "invalid date" });

  try {
    await prisma.completion.delete({ where: { habitId_date: { habitId: req.params.id, date } } });
  } catch (err) {
    if (!isNotFoundError(err)) return next(err);
  }
  res.status(204).end();
});
