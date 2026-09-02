import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkIn, createHabit, deleteHabit, getCompletions, listHabits, todayISO, uncheckIn } from "./api";

const mockHabit = {
  id: "h1",
  name: "Read",
  frequency: "DAILY" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  streak: 3,
  completionRate30d: 0.5,
  checkedToday: true,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("listHabits GETs /api/habits and returns parsed JSON", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([mockHabit]));
    const habits = await listHabits();
    expect(fetch).toHaveBeenCalledWith(
      "/api/habits",
      expect.objectContaining({ headers: { "Content-Type": "application/json" } }),
    );
    expect(habits).toEqual([mockHabit]);
  });

  it("createHabit POSTs name and frequency", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(mockHabit, 201));
    await createHabit("Read", "DAILY");
    expect(fetch).toHaveBeenCalledWith(
      "/api/habits",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ name: "Read", frequency: "DAILY" }) }),
    );
  });

  it("checkIn POSTs to the completions endpoint", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ habit: mockHabit, xpGained: 10, newBadges: [] }, 201));
    const result = await checkIn("h1", "2026-01-02");
    expect(fetch).toHaveBeenCalledWith(
      "/api/habits/h1/completions",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ date: "2026-01-02" }) }),
    );
    expect(result).toEqual({ habit: mockHabit, xpGained: 10, newBadges: [] });
  });

  it("uncheckIn and deleteHabit return undefined on 204", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(uncheckIn("h1", "2026-01-02")).resolves.toBeUndefined();

    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(deleteHabit("h1")).resolves.toBeUndefined();
  });

  it("getCompletions GETs the range endpoint with from/to query params", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ dates: ["2026-01-02"] }));
    const result = await getCompletions("h1", "2026-01-01", "2026-01-31");
    expect(fetch).toHaveBeenCalledWith(
      "/api/habits/h1/completions?from=2026-01-01&to=2026-01-31",
      expect.objectContaining({ headers: { "Content-Type": "application/json" } }),
    );
    expect(result).toEqual({ dates: ["2026-01-02"] });
  });

  it("throws the server's error message on a non-2xx response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404));
    await expect(checkIn("missing")).rejects.toThrow("not found");
  });

  it("falls back to a generic message when the error body isn't JSON", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("oops", { status: 500 }));
    await expect(listHabits()).rejects.toThrow("Request failed (500)");
  });

  it("todayISO returns a YYYY-MM-DD string", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
