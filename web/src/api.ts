import type { Frequency, Habit } from "./types";

const BASE = "/api/habits";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
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

export const listHabits = () => request<Habit[]>("");

export const createHabit = (name: string, frequency: Frequency) =>
  request<Habit>("", { method: "POST", body: JSON.stringify({ name, frequency }) });

export const deleteHabit = (id: string) => request<void>(`/${id}`, { method: "DELETE" });

export const checkIn = (id: string, date?: string) =>
  request<Habit>(`/${id}/completions`, { method: "POST", body: JSON.stringify({ date }) });

export const uncheckIn = (id: string, date: string) =>
  request<void>(`/${id}/completions/${date}`, { method: "DELETE" });

export const todayISO = () => new Date().toISOString().slice(0, 10);
