import { useEffect, useState } from "react";

export function XpToast({ xp, onDone }: { xp: number; onDone: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => setVisible(false), 900);
    const done = setTimeout(onDone, 1200);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(hide);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div
      className={`pointer-events-none fixed right-6 top-6 z-50 rounded-full bg-accent-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      +{xp} XP
    </div>
  );
}
