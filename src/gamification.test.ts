import { test } from "node:test";
import assert from "node:assert/strict";
import { levelForXp, xpForLevel, newlyCrossedBadges, BADGES } from "./gamification.ts";

test("level 1 at 0 xp", () => {
  assert.equal(levelForXp(0), 1);
});

test("xpForLevel and levelForXp round-trip at level boundaries", () => {
  for (let level = 1; level <= 10; level++) {
    const xp = xpForLevel(level);
    assert.equal(levelForXp(xp), level);
  }
});

test("level increases as xp grows", () => {
  assert.ok(levelForXp(500) > levelForXp(50));
});

test("newlyCrossedBadges finds thresholds crossed by a streak increase", () => {
  const crossed = newlyCrossedBadges("streak", 5, 8);
  assert.deepEqual(
    crossed.map((b) => b.key),
    ["streak_7"],
  );
});

test("newlyCrossedBadges finds multiple thresholds crossed at once", () => {
  const crossed = newlyCrossedBadges("checkins", 5, 60);
  assert.deepEqual(
    crossed.map((b) => b.key),
    ["checkins_10", "checkins_50"],
  );
});

test("newlyCrossedBadges returns nothing when no threshold is crossed", () => {
  assert.deepEqual(newlyCrossedBadges("streak", 8, 9), []);
});

test("BADGES has exactly the 6 required thresholds", () => {
  assert.deepEqual(
    BADGES.map((b) => `${b.type}:${b.threshold}`),
    ["streak:7", "streak:30", "streak:100", "checkins:10", "checkins:50", "checkins:200"],
  );
});
