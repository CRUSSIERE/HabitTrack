import type { Frequency } from "./streak.ts";

export const XP_FOR_FREQUENCY: Record<Frequency, number> = {
  DAILY: 10,
  WEEKLY: 15,
};

export const CHALLENGE_TARGET = 5;
export const CHALLENGE_BONUS_XP = 50;

export type BadgeType = "streak" | "checkins";

export interface BadgeDef {
  key: string;
  type: BadgeType;
  threshold: number;
}

export const BADGES: BadgeDef[] = [
  { key: "streak_7", type: "streak", threshold: 7 },
  { key: "streak_30", type: "streak", threshold: 30 },
  { key: "streak_100", type: "streak", threshold: 100 },
  { key: "checkins_10", type: "checkins", threshold: 10 },
  { key: "checkins_50", type: "checkins", threshold: 50 },
  { key: "checkins_200", type: "checkins", threshold: 200 },
];

// level 1 at 0 xp, each level needs progressively more xp (50 * (level-1)^2)
export function levelForXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

export function xpForLevel(level: number): number {
  return 50 * (level - 1) ** 2;
}

// badges newly crossed by going from `previousMax` to `newMax` for a given badge type
export function newlyCrossedBadges(type: BadgeType, previousMax: number, newMax: number): BadgeDef[] {
  return BADGES.filter((b) => b.type === type && previousMax < b.threshold && newMax >= b.threshold);
}
