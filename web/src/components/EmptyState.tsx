export function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-stone-200 bg-white/60 px-8 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 text-2xl">
        ✦
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-stone-900">No habits yet</h2>
        <p className="max-w-xs text-sm text-stone-500">
          Start with one small habit you want to track every day or week.
        </p>
      </div>
      <button
        onClick={onCreateClick}
        className="mt-2 rounded-full bg-accent-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-700 active:scale-95"
      >
        Create your first habit
      </button>
    </div>
  );
}
