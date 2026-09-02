import { useState } from "react";
import type { Habit } from "../types";

export function HabitCard({
  habit,
  onToggle,
  onDelete,
}: {
  habit: Habit;
  onToggle: (id: string, checked: boolean) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const pct = Math.round(habit.completionRate30d * 100);
  const [toggling, setToggling] = useState(false);

  async function handleToggleClick() {
    if (toggling) return;
    setToggling(true);
    try {
      await onToggle(habit.id, !habit.checkedToday);
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-stone-300 hover:shadow-sm">
      <button
        onClick={handleToggleClick}
        disabled={toggling}
        aria-pressed={habit.checkedToday}
        aria-label={habit.checkedToday ? "Mark as not done today" : "Mark as done today"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 disabled:cursor-wait disabled:opacity-60 ${
          habit.checkedToday
            ? "border-accent-500 bg-accent-500 text-white"
            : "border-stone-300 text-transparent hover:border-accent-400"
        }`}
      >
        ✓
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-stone-900">{habit.name}</h3>
          <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
            {habit.frequency === "DAILY" ? "Daily" : "Weekly"}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs font-medium text-stone-500">
            <span className="text-amber-500">🔥</span>
            {habit.streak} {habit.streak === 1 ? "streak" : "streaks"}
          </span>
          <div className="flex flex-1 items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-accent-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs text-stone-400">{pct}%</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onDelete(habit.id)}
        aria-label="Delete habit"
        className="shrink-0 rounded-full p-2 text-stone-300 opacity-0 transition hover:bg-stone-100 hover:text-stone-500 group-hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
