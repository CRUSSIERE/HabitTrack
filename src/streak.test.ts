import { test } from "node:test";
import assert from "node:assert/strict";
import { calcStreak, calcCompletionRate } from "./streak.ts";

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);
const today = d("2026-09-02"); // Wednesday

test("daily streak counts consecutive days ending today", () => {
  const dates = [d("2026-08-31"), d("2026-09-01"), d("2026-09-02")];
  assert.equal(calcStreak("DAILY", dates, today), 3);
});

test("daily streak still counts if today not yet checked in", () => {
  const dates = [d("2026-08-31"), d("2026-09-01")];
  assert.equal(calcStreak("DAILY", dates, today), 2);
});

test("daily streak breaks on a gap", () => {
  const dates = [d("2026-08-29"), d("2026-09-01"), d("2026-09-02")];
  assert.equal(calcStreak("DAILY", dates, today), 2);
});

test("weekly streak counts consecutive ISO weeks", () => {
  // weeks starting 2026-08-17 (Mon) and 2026-08-24 (Mon), plus this week
  const dates = [d("2026-08-18"), d("2026-08-25"), d("2026-09-01")];
  assert.equal(calcStreak("WEEKLY", dates, today), 3);
});

test("daily completion rate over 30 days", () => {
  const dates: Date[] = [];
  for (let i = 0; i < 15; i++) {
    dates.push(new Date(today.getTime() - i * 86400000));
  }
  assert.equal(calcCompletionRate("DAILY", dates, today), 15 / 30);
});

test("completion rate caps at 1", () => {
  const dates: Date[] = [];
  for (let i = 0; i < 40; i++) {
    dates.push(new Date(today.getTime() - i * 86400000));
  }
  assert.equal(calcCompletionRate("DAILY", dates, today), 1);
});
