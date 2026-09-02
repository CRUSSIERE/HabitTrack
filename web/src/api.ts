import type { CheckinResult, Frequency, GamificationState, Habit } from "./types";

const BASE = "/api/habits";
const GAMIFICATION_BASE = "/api/gamification";
const SETTINGS_BASE = "/api/settings";

async function request<T>(path: string, init?: RequestInit, base = BASE): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const listHabits = (includeArchived = false) =>
  request<Habit[]>(includeArchived ? "?includeArchived=true" : "");

export const createHabit = (name: string, frequency: Frequency) =>
  request<Habit>("", { method: "POST", body: JSON.stringify({ name, frequency }) });

export const updateHabit = (id: string, changes: Partial<Pick<Habit, "name" | "frequency" | "archived">>) =>
  request<Habit>(`/${id}`, { method: "PATCH", body: JSON.stringify(changes) });

export const reorderHabits = (ids: string[]) =>
  request<void>("/reorder", { method: "POST", body: JSON.stringify({ ids }) });

export const deleteHabit = (id: string) => request<void>(`/${id}`, { method: "DELETE" });

export const checkIn = (id: string, date?: string) =>
  request<CheckinResult>(`/${id}/completions`, { method: "POST", body: JSON.stringify({ date }) });

export const uncheckIn = (id: string, date: string) =>
  request<void>(`/${id}/completions/${date}`, { method: "DELETE" });

export const getCompletions = (id: string, from: string, to: string) =>
  request<{ dates: string[] }>(`/${id}/completions?from=${from}&to=${to}`);

export const getGamification = () => request<GamificationState>("", undefined, GAMIFICATION_BASE);

export const resetAllData = () => request<void>("/reset", { method: "POST" }, SETTINGS_BASE);

export const todayISO = () => new Date().toISOString().slice(0, 10);
