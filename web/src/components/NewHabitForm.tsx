import { useState, type FormEvent } from "react";
import type { Frequency } from "../types";

export function NewHabitForm({
  onCreate,
  onCancel,
}: {
  onCreate: (name: string, frequency: Frequency) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("DAILY");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onCreate(name.trim(), frequency);
      setName("");
      setFrequency("DAILY");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-700 dark:bg-stone-800"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="habit-name" className="text-sm font-medium text-stone-700 dark:text-stone-300">
          Habit name
        </label>
        <input
          id="habit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Drink water"
          maxLength={200}
          autoFocus
          className="rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 outline-none transition focus:border-accent-400 focus:ring-2 focus:ring-accent-100 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span id="frequency-label" className="text-sm font-medium text-stone-700 dark:text-stone-300">
          Frequency
        </span>
        <div role="radiogroup" aria-labelledby="frequency-label" className="flex gap-2">
          {(["DAILY", "WEEKLY"] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={frequency === f}
              onClick={() => setFrequency(f)}
              className={`flex-1 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
                frequency === f
                  ? "border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-500/20 dark:text-accent-300"
                  : "border-stone-200 text-stone-600 hover:border-stone-300 dark:border-stone-600 dark:text-stone-300"
              }`}
            >
              {f === "DAILY" ? "Daily" : "Weekly"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-1 flex gap-2">
        <button
          type="submit"
          disabled={!name.trim() || submitting}
          className="flex-1 rounded-full bg-accent-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Adding…" : "Add habit"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-4 py-2.5 text-sm font-medium text-stone-500 transition hover:bg-stone-100 dark:hover:bg-stone-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
