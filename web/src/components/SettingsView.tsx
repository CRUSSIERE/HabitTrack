import { useEffect, useState } from "react";
import { listHabits, reorderHabits, resetAllData, updateHabit } from "../api";
import type { Frequency, Habit } from "../types";
import type { Theme } from "../hooks/useTheme";
import { SettingsHabitRow } from "./SettingsHabitRow";

export function SettingsView({
  onClose,
  onHabitsChanged,
  theme,
  onToggleTheme,
  onDataReset,
}: {
  onClose: () => void;
  onHabitsChanged: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onDataReset: () => void;
}) {
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    listHabits(true)
      .then(setHabits)
      .catch((e) => setError((e as Error).message));
  }, []);

  async function refresh() {
    try {
      setHabits(await listHabits(true));
      onHabitsChanged();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleSave(id: string, name: string, frequency: Frequency) {
    setError(null);
    try {
      await updateHabit(id, { name, frequency });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleToggleArchive(id: string) {
    setError(null);
    const habit = habits?.find((h) => h.id === id);
    if (!habit) return;
    try {
      await updateHabit(id, { archived: !habit.archived });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleMove(id: string, direction: -1 | 1) {
    if (!habits || reordering) return;
    const index = habits.findIndex((h) => h.id === id);
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= habits.length) return;

    const reordered = [...habits];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
    setHabits(reordered);
    setError(null);
    setReordering(true);
    try {
      await reorderHabits(reordered.map((h) => h.id));
      onHabitsChanged();
    } catch (e) {
      setError((e as Error).message);
      await refresh();
    } finally {
      setReordering(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    setError(null);
    try {
      await resetAllData();
      setConfirmingReset(false);
      onDataReset();
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setResetting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-stone-900/40 px-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-lg dark:border-stone-700 dark:bg-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mb-5 flex items-center justify-between rounded-xl border border-stone-200 p-4 dark:border-stone-700">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-200">Appearance</span>
          <button
            onClick={onToggleTheme}
            aria-pressed={theme === "dark"}
            className="rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600"
          >
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>

        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Habits</h3>
        <div className="mb-5 flex flex-1 flex-col gap-2 overflow-y-auto">
          {habits === null ? (
            <p className="text-sm text-stone-400">Loading…</p>
          ) : habits.length === 0 ? (
            <p className="text-sm text-stone-400">No habits yet.</p>
          ) : (
            habits.map((habit, i) => (
              <SettingsHabitRow
                key={habit.id}
                habit={habit}
                isFirst={i === 0}
                isLast={i === habits.length - 1}
                moveDisabled={reordering}
                onSave={handleSave}
                onMove={handleMove}
                onToggleArchive={handleToggleArchive}
              />
            ))
          )}
        </div>

        <div className="rounded-xl border border-red-200 p-4 dark:border-red-900/50">
          <p className="mb-3 text-sm font-medium text-red-600">Danger zone</p>
          {confirmingReset ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-stone-600 dark:text-stone-300">
                This permanently deletes every habit, completion, and gamification record. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="flex-1 rounded-full bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resetting ? "Resetting…" : "Yes, delete everything"}
                </button>
                <button
                  onClick={() => setConfirmingReset(false)}
                  disabled={resetting}
                  className="rounded-full px-3 py-2 text-sm font-medium text-stone-500 transition hover:bg-stone-100 dark:hover:bg-stone-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingReset(true)}
              className="rounded-full border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
            >
              Reset all data…
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
