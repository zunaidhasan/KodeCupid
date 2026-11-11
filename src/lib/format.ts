import type { ISODate, ISODateTime } from "@/types";

/** Deterministic string hash (djb2) — used to make mock data and mock "responses" stable. */
export function hashString(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h;
}

let counter = 0;
export function uid(prefix = "id"): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const nowISO = (): ISODateTime => new Date().toISOString();

export function addDays(date: Date | string, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
export const addHours = (date: Date | string, h: number) => new Date(new Date(date).getTime() + h * 3600_000);

export function toISODate(d: Date): ISODate {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Age in whole years for a YYYY-MM-DD date of birth. Returns NaN for invalid input. */
export function calcAge(dob: ISODate, now: Date = new Date()): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return NaN;
  const birth = parseISODate(dob);
  if (Number.isNaN(birth.getTime())) return NaN;
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Build a plausible date of birth for a given age (mock data helper). */
export function dobForAge(age: number, salt = 0): ISODate {
  const now = new Date();
  const d = new Date(now.getFullYear() - age, (salt * 5) % 12, 1 + ((salt * 7) % 27));
  if (d > now) d.setFullYear(d.getFullYear() - 1);
  return toISODate(d);
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function formatHour(h: number): string {
  const hh = ((h % 24) + 24) % 24;
  const suffix = hh >= 12 ? "PM" : "AM";
  const n = hh % 12 === 0 ? 12 : hh % 12;
  return `${n} ${suffix}`;
}

export function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const n = h % 12 === 0 ? 12 : h % 12;
  return `${n}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatDate(iso: ISODateTime | ISODate, opts?: Intl.DateTimeFormatOptions): string {
  const d = iso.length === 10 ? parseISODate(iso) : new Date(iso);
  return d.toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(iso: ISODateTime): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function timeAgo(iso: ISODateTime, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return formatDate(iso, { month: "short", day: "numeric" });
}

/** "6d 4h" style countdown. Returns null once the deadline has passed. */
export function countdown(iso: ISODateTime, now = Date.now()): string | null {
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function heightLabel(cm?: number): string {
  if (!cm) return "";
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)}′${inches % 12}″ (${cm} cm)`;
}

export function initials(name: string): string {
  return name
    .replace(/^(Dr\.?|Prof\.?)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `•••-•••-${digits.slice(-4)}` : phone;
}

/** Normalise any US-looking input to (555) 123-4567 */
export function formatPhone(input: string): string {
  const d = input.replace(/\D/g, "").slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export const pluralize = (n: number, word: string, plural = `${word}s`) => `${n} ${n === 1 ? word : plural}`;

export function labelOf<T extends string>(options: { value: T; label: string }[], value?: T | string): string {
  return options.find((o) => o.value === value)?.label ?? "";
}
