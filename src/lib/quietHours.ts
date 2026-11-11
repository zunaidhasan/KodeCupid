import type { QuietHours } from "@/types";

export const QUIET_PRESETS: Record<"night_shift" | "standard", { start: string; end: string; label: string; hint: string }> = {
  night_shift: { start: "08:00", end: "16:00", label: "Night-shift sleep", hint: "Silence alerts while you sleep after a night shift." },
  standard: { start: "22:00", end: "07:00", label: "Standard overnight", hint: "Silence alerts overnight (great for educators and regular-hours roles)." },
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** True when `nowHHMM` falls inside the quiet window. Handles windows that cross midnight. */
export function isWithinQuietHours(q: QuietHours, nowHHMM: string): boolean {
  if (!q.enabled) return false;
  const now = toMinutes(nowHHMM);
  const s = toMinutes(q.start);
  const e = toMinutes(q.end);
  if (s === e) return false;
  return s < e ? now >= s && now < e : now >= s || now < e;
}

export function currentHHMM(date = new Date(), simulated?: string | null): string {
  if (simulated) return simulated;
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
