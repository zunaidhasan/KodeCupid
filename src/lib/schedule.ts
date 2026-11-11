import type { ISODate, ProfessionalProfile, WorkSchedule } from "@/types";
import { hashString, parseISODate } from "./format";

/**
 * Shift-aware "Schedule Compatibility" engine (prototype rules).
 * Everything here is pure and unit-tested (see schedule.test.ts).
 */

export const SCHEDULE_META: Record<
  WorkSchedule,
  { label: string; description: string; start: number; end: number; emoji: string }
> = {
  days: { label: "Days", description: "Daytime shifts, e.g. 7a–7p", start: 7, end: 19, emoji: "☀️" },
  nights: { label: "Nights", description: "Overnight shifts, e.g. 7p–7a", start: 19, end: 7, emoji: "🌙" },
  swings: { label: "Swings", description: "Afternoon / evening, e.g. 3p–11p", start: 15, end: 23, emoji: "🌆" },
  weekday: { label: "Regular weekday", description: "Standard Mon–Fri hours", start: 8, end: 17, emoji: "🗓️" },
  variable: { label: "Variable", description: "Rotating or unpredictable", start: 9, end: 17, emoji: "🔀" },
};

export type ScheduleLevel = "great" | "some" | "different";
export interface ScheduleCompat {
  level: ScheduleLevel;
  /** 0..1 */
  score: number;
  label: string;
  reason: string;
  sharedFreeHours: number;
}

export const LEVEL_LABEL: Record<ScheduleLevel, string> = {
  great: "Great schedule overlap",
  some: "Some overlap",
  different: "Different schedules",
};

type SchedLike = Pick<ProfessionalProfile, "schedule" | "shiftStart" | "shiftEnd" | "category" | "userId">;
type HourState = "work" | "sleep" | "free";

/** Educators (K-12 + college) keep school-calendar hours; they're treated differently from rotating clinical staff. */
export const isEducator = (p: Pick<SchedLike, "category">) => p.category === "education" || p.category === "college";
/** Clinical shift worker = rotating pattern (days/nights/swings). Admin/regular-hours staff are NOT clinical shift workers. */
export const isClinicalShiftWorker = (p: Pick<SchedLike, "schedule">) =>
  p.schedule === "days" || p.schedule === "nights" || p.schedule === "swings";

/** Base compatibility between two work patterns, 0..1. Keyed by sorted pair. */
const PATTERN_BASE: Record<string, { score: number; reason: string }> = {
  "days|days": { score: 1, reason: "You both work days" },
  "nights|nights": { score: 1, reason: "You're both on night shifts — your sleep and free time line up" },
  "swings|swings": { score: 1, reason: "You both work swing shifts" },
  "weekday|weekday": { score: 1, reason: "You both keep regular weekday hours" },
  "variable|variable": { score: 0.8, reason: "Both flexible — you'll plan around each other's calendars" },
  "days|weekday": { score: 0.7, reason: "Both daytime, but one of you may work weekends and holidays" },
  "days|nights": { score: 0.6, reason: "Opposite shifts that can meet around shift change (breakfast or early dinner)" },
  "days|swings": { score: 0.6, reason: "Partly overlapping — evenings and days off will be your windows" },
  "nights|swings": { score: 0.6, reason: "Late evenings overlap before one of you heads to bed" },
  "nights|weekday": { score: 0.2, reason: "One sleeps while the other works — hard to find shared time" },
  "swings|weekday": { score: 0.4, reason: "Evening shifts clash with after-work hours; weekends are the window" },
};

function pairKey(a: WorkSchedule, b: WorkSchedule): string {
  if (a === "variable" && b !== "variable") return `variable|${b}`;
  return [a, b].sort().join("|");
}

export function patternCompatibility(a: SchedLike, b: SchedLike): { score: number; reason: string } {
  // Variable schedules are flexible — treat as a medium-high match with anything
  if ((a.schedule === "variable") !== (b.schedule === "variable")) {
    return { score: 0.65, reason: "One flexible schedule — easy to plan around each other" };
  }
  const base = PATTERN_BASE[pairKey(a.schedule, b.schedule)] ?? { score: 0.5, reason: "Partial overlap" };
  let { score } = base;
  let reason = base.reason;
  // Educators on school hours vs clinical shift workers: weekends/holidays & rotating shifts reduce overlap
  if ((isEducator(a) && isClinicalShiftWorker(b)) || (isEducator(b) && isClinicalShiftWorker(a))) {
    score = Math.max(0, score - 0.08);
    reason += " · school hours rarely match rotating clinical shifts";
  }
  // Administrative / regular-hours staff are not penalised against clinical days
  return { score, reason };
}

/** Typical-day hour map (24 entries): when someone works, sleeps, or is free. */
export function hourlyStates(p: Pick<SchedLike, "schedule" | "shiftStart" | "shiftEnd">, working = true): HourState[] {
  const states: HourState[] = Array(24).fill("free");
  if (working) {
    for (let h = p.shiftStart % 24; h !== p.shiftEnd % 24; h = (h + 1) % 24) states[h] = "work";
  }
  let sleepStart = 23;
  if (p.schedule === "nights") sleepStart = working ? (p.shiftEnd + 1) % 24 : 3;
  else if (p.schedule === "swings") sleepStart = working ? (p.shiftEnd + 2) % 24 : 1;
  for (let i = 0; i < 8; i++) {
    const h = (sleepStart + i) % 24;
    if (states[h] !== "work") states[h] = "sleep";
  }
  return states;
}

export function sharedFreeHours(a: SchedLike, b: SchedLike): { shared: number; ratio: number } {
  const sa = hourlyStates(a);
  const sb = hourlyStates(b);
  let shared = 0;
  let freeA = 0;
  let freeB = 0;
  for (let h = 0; h < 24; h++) {
    if (sa[h] === "free") freeA++;
    if (sb[h] === "free") freeB++;
    if (sa[h] === "free" && sb[h] === "free") shared++;
  }
  const denom = Math.min(freeA, freeB) || 1;
  return { shared, ratio: Math.min(1, shared / denom) };
}

/**
 * Overall schedule compatibility.
 *  final = 75% pattern rules + 25% shared free hours on a typical work day
 *  ≥ 0.75 → Great schedule overlap · ≥ 0.42 → Some overlap · else Different schedules
 */
export function scheduleCompatibility(a: SchedLike, b: SchedLike): ScheduleCompat {
  const pattern = patternCompatibility(a, b);
  const free = sharedFreeHours(a, b);
  const score = Math.max(0, Math.min(1, pattern.score * 0.75 + free.ratio * 0.25));
  const level: ScheduleLevel = score >= 0.75 ? "great" : score >= 0.42 ? "some" : "different";
  return { level, score, label: LEVEL_LABEL[level], reason: pattern.reason, sharedFreeHours: free.shared };
}

/* ------------------------- Micro-date availability ------------------------ */
export interface TimeBlock { id: string; label: string; start: number; end: number }
export interface TimeBlockAvailability extends TimeBlock { aFree: boolean; bFree: boolean; both: boolean }

export const TIME_BLOCKS: TimeBlock[] = [
  { id: "early", label: "Early coffee", start: 6, end: 8 },
  { id: "morning", label: "Morning walk", start: 9, end: 11 },
  { id: "lunch", label: "Lunch break", start: 12, end: 14 },
  { id: "afternoon", label: "Afternoon tea", start: 15, end: 17 },
  { id: "evening", label: "Early evening", start: 17, end: 19 },
  { id: "dinner", label: "Dinner", start: 19, end: 21 },
  { id: "late", label: "Late-night bite", start: 21, end: 23 },
];

/** Mock shift rotation: is this person at work on a given date? (Real app: read their shared calendar.) */
export function isWorkingDay(p: SchedLike, date: ISODate): boolean {
  const d = parseISODate(date);
  const dow = d.getDay();
  switch (p.schedule) {
    case "weekday":
      return dow >= 1 && dow <= 5;
    case "variable":
      return hashString(p.userId + date) % 100 < 55;
    default: {
      const dayNum = Math.floor(d.getTime() / 86400000);
      const offset = hashString(p.userId) % 7;
      const onDays = p.schedule === "swings" ? 4 : 3;
      return (dayNum + offset) % 7 < onDays;
    }
  }
}

function blockIsFree(states: HourState[], block: TimeBlock): boolean {
  for (let h = block.start; h < block.end; h++) if (states[h % 24] !== "free") return false;
  return true;
}

export function timeBlocksForDate(a: SchedLike, b: SchedLike, date: ISODate): TimeBlockAvailability[] {
  const sa = hourlyStates(a, isWorkingDay(a, date));
  const sb = hourlyStates(b, isWorkingDay(b, date));
  return TIME_BLOCKS.map((block) => {
    const aFree = blockIsFree(sa, block);
    const bFree = blockIsFree(sb, block);
    return { ...block, aFree, bFree, both: aFree && bFree };
  });
}

export function bothFreeCount(a: SchedLike, b: SchedLike, date: ISODate): number {
  return timeBlocksForDate(a, b, date).filter((t) => t.both).length;
}
