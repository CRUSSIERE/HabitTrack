import { Router } from "express";
import { prisma } from "../db.ts";
import { weekStart } from "../streak.ts";
import { BADGES, CHALLENGE_TARGET, levelForXp, xpForLevel } from "../gamification.ts";

export const gamificationRouter = Router();

const PROFILE_ID = "main";

export function currentWeekStartDate(today: Date = new Date()): Date {
  return new Date(weekStart(today));
}

export async function getProfile() {
  return prisma.profile.upsert({ where: { id: PROFILE_ID }, create: { id: PROFILE_ID }, update: {} });
}

// Distinct habits checked in during the current week, for the weekly challenge.
export async function getWeeklyProgress(today: Date = new Date()) {
  const ws = currentWeekStartDate(today);
  const completions = await prisma.completion.findMany({
    where: { date: { gte: ws } },
    select: { habitId: true },
    distinct: ["habitId"],
  });
  return { weekStart: ws, progress: completions.length };
}

gamificationRouter.get("/", async (_req, res) => {
  const profile = await getProfile();
  const level = levelForXp(profile.totalXp);

  const unlocked = await prisma.unlockedBadge.findMany();
  const unlockedMap = new Map(unlocked.map((b) => [b.key, b.unlockedAt]));

  const { weekStart: ws, progress } = await getWeeklyProgress();
  const challenge = await prisma.weeklyChallenge.findUnique({ where: { weekStart: ws } });

  res.json({
    totalXp: profile.totalXp,
    level,
    xpForCurrentLevel: xpForLevel(level),
    xpToNextLevel: xpForLevel(level + 1),
    badges: BADGES.map((b) => ({
      key: b.key,
      unlocked: unlockedMap.has(b.key),
      unlockedAt: unlockedMap.get(b.key) ?? null,
    })),
    weeklyChallenge: {
      weekStart: ws.toISOString().slice(0, 10),
      target: CHALLENGE_TARGET,
      progress,
      completed: progress >= CHALLENGE_TARGET,
      xpAwarded: challenge?.xpAwarded ?? false,
    },
  });
});
