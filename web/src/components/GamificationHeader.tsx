import type { GamificationState } from "../types";

export function GamificationHeader({ gamification }: { gamification: GamificationState }) {
  const { level, totalXp, xpForCurrentLevel, xpToNextLevel } = gamification;
  const span = xpToNextLevel - xpForCurrentLevel;
  const pct = span > 0 ? Math.min(100, Math.round(((totalXp - xpForCurrentLevel) / span) * 100)) : 100;

  return (
    <div className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-4 py-2 dark:border-stone-700 dark:bg-stone-800">
      <span className="shrink-0 rounded-full bg-accent-600 px-2.5 py-1 text-xs font-semibold text-white">
        Lv {level}
      </span>
      <div className="flex w-28 flex-col gap-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-700">
          <div className="h-full rounded-full bg-accent-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] text-stone-400">
          {totalXp} / {xpToNextLevel} XP
        </span>
      </div>
    </div>
  );
}
