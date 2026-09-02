import type { Habit } from "../types";
import { HabitCard } from "./HabitCard";

export function HabitList({
  habits,
  onToggle,
  onDelete,
  onOpenCalendar,
}: {
  habits: Habit[];
  onToggle: (id: string, checked: boolean) => Promise<void>;
  onDelete: (id: string) => void;
  onOpenCalendar: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {habits.map((habit) => (
        <HabitCard key={habit.id} habit={habit} onToggle={onToggle} onDelete={onDelete} onOpenCalendar={onOpenCalendar} />
      ))}
    </div>
  );
}
