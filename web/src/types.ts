export type Frequency = "DAILY" | "WEEKLY";

export interface Habit {
  id: string;
  name: string;
  frequency: Frequency;
  order: number;
  archived: boolean;
  createdAt: string;
  streak: number;
  completionRate30d: number;
  checkedToday: boolean;
}

export interface CheckinResult {
  habit: Habit;
  xpGained: number;
  newBadges: string[];
}

export interface Badge {
  key: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface WeeklyChallenge {
  weekStart: string;
  target: number;
  progress: number;
  completed: boolean;
  xpAwarded: boolean;
}

export interface GamificationState {
  totalXp: number;
  level: number;
  xpForCurrentLevel: number;
  xpToNextLevel: number;
  badges: Badge[];
  weeklyChallenge: WeeklyChallenge;
}
