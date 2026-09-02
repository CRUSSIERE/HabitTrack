import { useEffect, useState } from "react";
import { checkIn, getCompletions, todayISO, uncheckIn } from "../api";
import type { CheckinResult, Habit } from "../types";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function monthRange(year: number, month: number): { from: Date; to: Date } {
  return { from: new Date(Date.UTC(year, month, 1)), to: new Date(Date.UTC(year, month + 1, 0)) };
}

// Grid cells for a full month view, padded to start on Monday and end on Sunday.
function buildGridDays(year: number, month: number): Date[] {
  const { from, to } = monthRange(year, month);
  const leadingEmpty = (from.getUTCDay() + 6) % 7; // days since Monday
  const start = new Date(from);
  start.setUTCDate(start.getUTCDate() - leadingEmpty);

  const trailingEmpty = (7 - ((to.getUTCDay() + 6) % 7) - 1) % 7;
  const end = new Date(to);
  end.setUTCDate(end.getUTCDate() + trailingEmpty);

  const days: Date[] = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

export function CalendarView({
  habit,
  onClose,
  onCheckin,
  onUncheck,
}: {
  habit: Habit;
  onClose: () => void;
  onCheckin: (result: CheckinResult) => void;
  onUncheck: () => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getUTCFullYear());
  const [month, setMonth] = useState(today.getUTCMonth());
  const [checkedDates, setCheckedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const { from, to } = monthRange(year, month);
    getCompletions(habit.id, toISO(from), toISO(to))
      .then((res) => setCheckedDates(new Set(res.dates)))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [habit.id, year, month]);

  function goMonth(delta: number) {
    const next = new Date(Date.UTC(year, month + delta, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth());
  }

  async function toggleDay(iso: string) {
    if (iso > todayISO() || pendingDate) return;
    setPendingDate(iso);
    setError(null);
    const wasChecked = checkedDates.has(iso);
    try {
      if (wasChecked) {
        await uncheckIn(habit.id, iso);
        onUncheck();
      } else {
        onCheckin(await checkIn(habit.id, iso));
      }
      setCheckedDates((prev) => {
        const next = new Set(prev);
        if (wasChecked) next.delete(iso);
        else next.add(iso);
        return next;
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPendingDate(null);
    }
  }

  const days = buildGridDays(year, month);
  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-stone-900/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="truncate text-sm font-semibold text-stone-900">{habit.name}</h2>
          <button onClick={onClose} aria-label="Close calendar" className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600">
            ✕
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => goMonth(-1)} aria-label="Previous month" className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100">
            ‹
          </button>
          <span className="text-sm font-medium text-stone-700">{monthLabel}</span>
          <button onClick={() => goMonth(1)} aria-label="Next month" className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100">
            ›
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600">{error}</div>
        )}

        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="text-center text-[11px] font-medium text-stone-400">
              {label}
            </div>
          ))}
        </div>

        <div className={`grid grid-cols-7 gap-1 ${loading ? "opacity-50" : ""}`}>
          {days.map((day) => {
            const iso = toISO(day);
            const inMonth = day.getUTCMonth() === month;
            const isFuture = iso > todayISO();
            const isChecked = checkedDates.has(iso);
            return (
              <button
                key={iso}
                onClick={() => toggleDay(iso)}
                disabled={isFuture || pendingDate !== null}
                aria-pressed={isChecked}
                aria-label={`${iso}${isChecked ? ", completed" : ""}`}
                className={`aspect-square rounded-md text-[11px] transition disabled:cursor-not-allowed ${
                  !inMonth ? "text-stone-300" : "text-stone-600"
                } ${
                  isChecked
                    ? "bg-accent-500 text-white hover:bg-accent-600"
                    : isFuture
                      ? "bg-stone-50"
                      : "bg-stone-100 hover:bg-stone-200"
                }`}
              >
                {day.getUTCDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
