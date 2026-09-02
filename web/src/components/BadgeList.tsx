import type { Badge } from "../types";

const BADGE_LABELS: Record<string, { icon: string; label: string }> = {
  streak_7: { icon: "🔥", label: "7-day streak" },
  streak_30: { icon: "🔥", label: "30-day streak" },
  streak_100: { icon: "🔥", label: "100-day streak" },
  checkins_10: { icon: "✅", label: "10 check-ins" },
  checkins_50: { icon: "✅", label: "50 check-ins" },
  checkins_200: { icon: "✅", label: "200 check-ins" },
};

export function BadgeList({ badges }: { badges: Badge[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {badges.map((badge) => {
        const meta = BADGE_LABELS[badge.key] ?? { icon: "⭐", label: badge.key };
        return (
          <div
            key={badge.key}
            title={badge.unlocked ? `Unlocked ${new Date(badge.unlockedAt!).toLocaleDateString()}` : "Locked"}
            className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition ${
              badge.unlocked
                ? "border-accent-200 bg-accent-50 dark:border-accent-500/30 dark:bg-accent-500/10"
                : "border-stone-200 bg-stone-50 opacity-40 grayscale dark:border-stone-700 dark:bg-stone-800"
            }`}
          >
            <span className="text-xl">{meta.icon}</span>
            <span className="text-[11px] font-medium text-stone-600 dark:text-stone-300">{meta.label}</span>
          </div>
        );
      })}
    </div>
  );
}
