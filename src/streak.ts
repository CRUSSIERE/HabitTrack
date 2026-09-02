export type Frequency = "DAILY" | "WEEKLY";

const DAY_MS = 24 * 60 * 60 * 1000;

function toUTCDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

// ISO week start (Monday), as a UTC-day timestamp.
export function weekStart(date: Date): number {
  const day = toUTCDay(date);
  const weekday = new Date(day).getUTCDay(); // 0=Sun..6=Sat
  const offset = weekday === 0 ? 6 : weekday - 1; // days since Monday
  return day - offset * DAY_MS;
}

function bucketKeys(dates: Date[], frequency: Frequency): Set<number> {
  const keyOf = frequency === "DAILY" ? toUTCDay : weekStart;
  return new Set(dates.map(keyOf));
}

const step = (frequency: Frequency) => (frequency === "DAILY" ? DAY_MS : 7 * DAY_MS);

/**
 * Consecutive daily/weekly buckets with a completion, walking back from
 * today's bucket. Today's own bucket is allowed to still be empty (in
 * progress) without breaking the streak.
 */
export function calcStreak(frequency: Frequency, dates: Date[], today: Date = new Date()): number {
  const buckets = bucketKeys(dates, frequency);
  const bucketStep = step(frequency);
  const keyOf = frequency === "DAILY" ? toUTCDay : weekStart;

  let cursor = keyOf(today);
  if (!buckets.has(cursor)) cursor -= bucketStep;

  let streak = 0;
  while (buckets.has(cursor)) {
    streak++;
    cursor -= bucketStep;
  }
  return streak;
}

/**
 * Fraction (0..1) of expected check-ins completed in the trailing window.
 * Expected count is 1/day for DAILY, 1/distinct-ISO-week for WEEKLY.
 */
export function calcCompletionRate(
  frequency: Frequency,
  dates: Date[],
  today: Date = new Date(),
  windowDays = 30,
): number {
  const windowStart = toUTCDay(today) - (windowDays - 1) * DAY_MS;
  const inWindow = dates.filter((d) => toUTCDay(d) >= windowStart && toUTCDay(d) <= toUTCDay(today));

  if (frequency === "DAILY") {
    const completed = new Set(inWindow.map(toUTCDay)).size;
    return Math.min(1, completed / windowDays);
  }

  const completedWeeks = new Set(inWindow.map(weekStart)).size;
  const expectedWeeks = new Set<number>();
  for (let d = windowStart; d <= toUTCDay(today); d += DAY_MS) {
    expectedWeeks.add(weekStart(new Date(d)));
  }
  return Math.min(1, completedWeeks / expectedWeeks.size);
}
