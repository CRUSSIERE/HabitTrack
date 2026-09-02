import { useEffect, useState } from "react";
import { checkIn, createHabit, deleteHabit, getGamification, listHabits, todayISO, uncheckIn } from "./api";
import { BadgeList } from "./components/BadgeList";
import { CalendarView } from "./components/CalendarView";
import { EmptyState } from "./components/EmptyState";
import { GamificationHeader } from "./components/GamificationHeader";
import { HabitList } from "./components/HabitList";
import { NewHabitForm } from "./components/NewHabitForm";
import { SettingsView } from "./components/SettingsView";
import { WeeklyChallengeCard } from "./components/WeeklyChallengeCard";
import { XpToast } from "./components/XpToast";
import { useTheme } from "./hooks/useTheme";
import type { CheckinResult, Frequency, GamificationState, Habit } from "./types";

export default function App() {
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [gamification, setGamification] = useState<GamificationState | null>(null);
  const [xpToast, setXpToast] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarHabitId, setCalendarHabitId] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    listHabits()
      .then(setHabits)
      .catch((e) => setError(e.message));
    getGamification()
      .then(setGamification)
      .catch((e) => setError(e.message));
  }, []);

  async function handleCreate(name: string, frequency: Frequency) {
    setError(null);
    try {
      const habit = await createHabit(name, frequency);
      setHabits((prev) => [...(prev ?? []), habit]);
      setShowForm(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function applyCheckinResult(result: CheckinResult) {
    setHabits((prev) => prev?.map((h) => (h.id === result.habit.id ? result.habit : h)) ?? prev);
    if (result.xpGained > 0) {
      setXpToast(result.xpGained);
      setGamification(await getGamification());
    }
  }

  async function handleToggle(id: string, checked: boolean) {
    setError(null);
    setHabits((prev) => prev?.map((h) => (h.id === id ? { ...h, checkedToday: checked } : h)) ?? prev);
    try {
      if (checked) {
        await applyCheckinResult(await checkIn(id));
      } else {
        await uncheckIn(id, todayISO());
        setHabits(await listHabits());
      }
    } catch (e) {
      setError((e as Error).message);
      setHabits(await listHabits().catch(() => habits));
    }
  }

  async function refreshHabits() {
    try {
      setHabits(await listHabits());
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function refreshAll() {
    await refreshHabits();
    try {
      setGamification(await getGamification());
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setHabits((prev) => prev?.filter((h) => h.id !== id) ?? prev);
    try {
      await deleteHabit(id);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      {xpToast !== null && <XpToast xp={xpToast} onDone={() => setXpToast(null)} />}
      <div className="mx-auto max-w-xl px-6 py-16">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">HabitTrack</h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Small habits, tracked daily.</p>
          </div>
          <div className="flex items-center gap-3">
            {gamification && <GamificationHeader gamification={gamification} />}
            {habits && habits.length > 0 && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="rounded-full bg-accent-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-700 active:scale-95"
              >
                + New habit
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              aria-label="Open settings"
              className="shrink-0 rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-200"
            >
              ⚙️
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-6">
            <NewHabitForm onCreate={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {habits === null ? (
          <p className="text-sm text-stone-400">Loading…</p>
        ) : habits.length === 0 && !showForm ? (
          <EmptyState onCreateClick={() => setShowForm(true)} />
        ) : (
          <>
            <HabitList habits={habits} onToggle={handleToggle} onDelete={handleDelete} onOpenCalendar={setCalendarHabitId} />
            {gamification && (
              <div className="mt-8 flex flex-col gap-4">
                <WeeklyChallengeCard challenge={gamification.weeklyChallenge} />
                <BadgeList badges={gamification.badges} />
              </div>
            )}
          </>
        )}
      </div>

      {calendarHabitId &&
        (() => {
          const habit = habits?.find((h) => h.id === calendarHabitId);
          return habit ? (
            <CalendarView
              habit={habit}
              onClose={() => setCalendarHabitId(null)}
              onCheckin={applyCheckinResult}
              onUncheck={refreshHabits}
            />
          ) : null;
        })()}

      {showSettings && (
        <SettingsView
          onClose={() => setShowSettings(false)}
          onHabitsChanged={refreshHabits}
          theme={theme}
          onToggleTheme={toggleTheme}
          onDataReset={refreshAll}
        />
      )}
    </div>
  );
}
