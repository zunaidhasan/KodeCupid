import { describe, expect, it } from "vitest";
import type { ProfessionalProfile, WorkSchedule } from "@/types";
import { bothFreeCount, hourlyStates, isWorkingDay, scheduleCompatibility, SCHEDULE_META, timeBlocksForDate } from "./schedule";

const p = (schedule: WorkSchedule, category: ProfessionalProfile["category"] = "healthcare", userId = "u1"): Pick<ProfessionalProfile, "schedule" | "shiftStart" | "shiftEnd" | "category" | "userId"> => ({
  schedule, category, userId, shiftStart: SCHEDULE_META[schedule].start, shiftEnd: SCHEDULE_META[schedule].end,
});

describe("scheduleCompatibility", () => {
  it("same shift pattern → great overlap", () => {
    for (const s of ["days", "nights", "swings", "weekday"] as WorkSchedule[]) {
      expect(scheduleCompatibility(p(s), p(s)).level).toBe("great");
    }
  });

  it("opposite but complementary patterns (days vs nights) → some overlap", () => {
    const r = scheduleCompatibility(p("days"), p("nights"));
    expect(r.level).toBe("some");
    expect(r.reason).toMatch(/shift change/i);
  });

  it("conflicting schedules (nights vs regular weekday) → different schedules", () => {
    const r = scheduleCompatibility(p("nights"), p("weekday", "education"));
    expect(r.level).toBe("different");
    expect(r.label).toBe("Different schedules");
  });

  it("treats educators distinctly from clinical shift workers", () => {
    const clinicalDays = p("days", "healthcare");
    const educator = scheduleCompatibility(clinicalDays, p("weekday", "education"));
    const adminStaff = scheduleCompatibility(clinicalDays, p("weekday", "healthcare"));
    expect(adminStaff.score).toBeGreaterThan(educator.score);
  });

  it("educators and administrators on regular hours overlap greatly", () => {
    expect(scheduleCompatibility(p("weekday", "education"), p("weekday", "healthcare")).level).toBe("great");
  });

  it("variable schedules are flexible with anyone (at least some overlap)", () => {
    expect(scheduleCompatibility(p("variable", "college"), p("nights")).level).not.toBe("different");
  });

  it("is symmetric", () => {
    const a = p("swings");
    const b = p("weekday", "education");
    expect(scheduleCompatibility(a, b).score).toBeCloseTo(scheduleCompatibility(b, a).score, 5);
  });
});

describe("hourlyStates", () => {
  it("marks night-shift hours across midnight as work and sleeps in the daytime", () => {
    const s = hourlyStates(p("nights"));
    expect(s[22]).toBe("work");
    expect(s[3]).toBe("work");
    expect(s[10]).toBe("sleep");
    expect(s[17]).toBe("free");
  });
  it("has exactly 24 entries", () => expect(hourlyStates(p("days"))).toHaveLength(24));
});

describe("micro-date availability", () => {
  it("weekday workers are free on weekends, off on Mondays they work", () => {
    const wd = p("weekday", "education");
    expect(isWorkingDay(wd, "2030-01-07")).toBe(true); // Monday
    expect(isWorkingDay(wd, "2030-01-05")).toBe(false); // Saturday
  });
  it("offers more shared blocks on a weekend for two weekday workers", () => {
    const a = p("weekday", "education", "a");
    const b = p("weekday", "healthcare", "b");
    expect(bothFreeCount(a, b, "2030-01-05")).toBeGreaterThan(bothFreeCount(a, b, "2030-01-07"));
  });
  it("returns every time block with who is free", () => {
    const blocks = timeBlocksForDate(p("days", "healthcare", "a"), p("days", "healthcare", "b"), "2030-01-05");
    expect(blocks.length).toBeGreaterThan(3);
    blocks.forEach((b) => expect(b.both).toBe(b.aFree && b.bFree));
  });
});
