export type Frequency = "DAILY" | "WEEKLY";

export interface Habit {
  id: string;
  name: string;
  frequency: Frequency;
  createdAt: string;
  streak: number;
  completionRate30d: number;
  checkedToday: boolean;
}
