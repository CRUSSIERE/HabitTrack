import { Router, type NextFunction, type Request, type Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.ts";
import { calcStreak, calcCompletionRate, type Frequency } from "../streak.ts";

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

habitsRouter.delete("/:id", async (req, res, next) => {
  try {
    await prisma.habit.delete({ where: { id: req.params.id } });
  } catch (err) {
    if (!isNotFoundError(err)) return next(err);
  }
  res.status(204).end();
});

habitsRouter.post(
  "/:id/completions",
  ah(async (req, res) => {
    const dateStr: string = req.body?.date ?? new Date().toISOString().slice(0, 10);
    const date = new Date(`${dateStr}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      res.status(400).json({ error: "invalid date" });
      return;
    }

    const habit = await prisma.habit.findUnique({ where: { id: req.params.id } });
    if (!habit) {
      res.status(404).json({ error: "not found" });
      return;
    }

    await prisma.completion.upsert({
      where: { habitId_date: { habitId: habit.id, date } },
      create: { habitId: habit.id, date },
      update: {},
    });

    const updated = await prisma.habit.findUniqueOrThrow({ where: { id: habit.id }, include: { completions: true } });
    res.status(201).json(serialize(updated));
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
