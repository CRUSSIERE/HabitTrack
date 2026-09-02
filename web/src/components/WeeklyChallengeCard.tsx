import type { WeeklyChallenge } from "../types";

export function WeeklyChallengeCard({ challenge }: { challenge: WeeklyChallenge }) {
  const pct = Math.min(100, Math.round((challenge.progress / challenge.target) * 100));

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-700 dark:bg-stone-800">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Weekly challenge</h3>
        {challenge.completed && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-500/20">
            {challenge.xpAwarded ? "Completed" : "Complete!"}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
        Check in on {challenge.target} habits this week — bonus 50 XP
      </p>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-700">
          <div className="h-full rounded-full bg-accent-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="shrink-0 text-xs text-stone-400">
          {challenge.progress}/{challenge.target}
        </span>
      </div>
    </div>
  );
}
