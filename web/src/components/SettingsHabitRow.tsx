import { useState } from "react";
import type { Frequency, Habit } from "../types";

export function SettingsHabitRow({
  habit,
  isFirst,
  isLast,
  moveDisabled,
  onSave,
  onMove,
  onToggleArchive,
}: {
  habit: Habit;
  isFirst: boolean;
  isLast: boolean;
  moveDisabled: boolean;
  onSave: (id: string, name: string, frequency: Frequency) => Promise<void>;
  onMove: (id: string, direction: -1 | 1) => void;
  onToggleArchive: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(habit.name);
  const [frequency, setFrequency] = useState<Frequency>(habit.frequency);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(habit.id, name.trim(), frequency);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setName(habit.name);
    setFrequency(habit.frequency);
    setEditing(false);
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition dark:border-stone-700 dark:bg-stone-800 ${
        habit.archived ? "opacity-50" : ""
      }`}
    >
      {!editing && (
        <div className="flex shrink-0 flex-col">
          <button
            onClick={() => onMove(habit.id, -1)}
            disabled={isFirst || moveDisabled}
            aria-label="Move up"
            className="rounded p-1 text-stone-400 transition hover:bg-stone-100 disabled:opacity-30 dark:hover:bg-stone-700"
          >
            ▲
          </button>
          <button
            onClick={() => onMove(habit.id, 1)}
            disabled={isLast || moveDisabled}
            aria-label="Move down"
            className="rounded p-1 text-stone-400 transition hover:bg-stone-100 disabled:opacity-30 dark:hover:bg-stone-700"
          >
            ▼
          </button>
        </div>
      )}

      {editing ? (
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            autoFocus
            className="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-accent-400 focus:ring-2 focus:ring-accent-100 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          />
          <div role="radiogroup" aria-label="Frequency" className="flex gap-2">
            {(["DAILY", "WEEKLY"] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={frequency === f}
                onClick={() => setFrequency(f)}
                className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  frequency === f
                    ? "border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-500/20 dark:text-accent-300"
                    : "border-stone-200 text-stone-600 hover:border-stone-300 dark:border-stone-600 dark:text-stone-300"
                }`}
              >
                {f === "DAILY" ? "Daily" : "Weekly"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="flex-1 rounded-full bg-accent-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={handleCancel}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-stone-500 transition hover:bg-stone-100 dark:hover:bg-stone-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">{habit.name}</h3>
              <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500 dark:bg-stone-700 dark:text-stone-300">
                {habit.frequency === "DAILY" ? "Daily" : "Weekly"}
              </span>
              {habit.archived && (
                <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500 dark:bg-stone-700 dark:text-stone-300">
                  Archived
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            aria-label="Edit habit"
            className="shrink-0 rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-700"
          >
            ✎
          </button>
          <button
            onClick={() => onToggleArchive(habit.id)}
            aria-label={habit.archived ? "Unarchive habit" : "Archive habit"}
            className="shrink-0 rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-700"
          >
            {habit.archived ? "↺" : "🗄"}
          </button>
        </>
      )}
    </div>
  );
}
