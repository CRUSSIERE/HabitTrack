import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Habit } from "../types";
import { HabitCard } from "./HabitCard";

const baseHabit: Habit = {
  id: "h1",
  name: "Read",
  frequency: "DAILY",
  createdAt: "2026-01-01T00:00:00.000Z",
  streak: 1,
  completionRate30d: 0.5,
  checkedToday: false,
};

describe("HabitCard", () => {
  it("uses singular 'streak' for a streak of 1", () => {
    render(<HabitCard habit={baseHabit} onToggle={vi.fn()} onDelete={vi.fn()} onOpenCalendar={vi.fn()} />);
    expect(screen.getByText("1 streak")).toBeInTheDocument();
  });

  it("uses plural 'streaks' for a streak greater than 1", () => {
    render(<HabitCard habit={{ ...baseHabit, streak: 5 }} onToggle={vi.fn()} onDelete={vi.fn()} onOpenCalendar={vi.fn()} />);
    expect(screen.getByText("5 streaks")).toBeInTheDocument();
  });

  it("reflects checkedToday in the toggle button's pressed state", () => {
    render(<HabitCard habit={{ ...baseHabit, checkedToday: true }} onToggle={vi.fn()} onDelete={vi.fn()} onOpenCalendar={vi.fn()} />);
    expect(screen.getByRole("button", { name: /mark as not done today/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("calls onToggle with the flipped checked state when clicked", async () => {
    const onToggle = vi.fn().mockResolvedValue(undefined);
    render(<HabitCard habit={baseHabit} onToggle={onToggle} onDelete={vi.fn()} onOpenCalendar={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /mark as done today/i }));
    expect(onToggle).toHaveBeenCalledWith("h1", true);
  });

  it("calls onDelete with the habit id when the delete button is clicked", () => {
    const onDelete = vi.fn();
    render(<HabitCard habit={baseHabit} onToggle={vi.fn()} onDelete={onDelete} onOpenCalendar={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /delete habit/i }));
    expect(onDelete).toHaveBeenCalledWith("h1");
  });
});
