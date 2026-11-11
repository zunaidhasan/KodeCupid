import type { AppSettings, Db, ID, Wallet } from "@/types";
import { createSeedDb, DB_VERSION, DEFAULT_SETTINGS } from "@/data/seedDb";

/**
 * Tiny browser-storage-backed store that plays the role of "the backend database".
 * Services (src/services/*) are the ONLY code that calls `db.update`. UI reads via `useDb()`.
 *
 * PRODUCTION NOTE: swap this module (and the services that use it) for Supabase / Firebase /
 * Postgres calls. Components never import this file directly.
 */
const STORAGE_KEY = "kodecupid.db";

function load(): Db {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as Db;
      if (parsed.version === DB_VERSION) return parsed;
    }
  } catch {
    /* corrupted storage → reseed */
  }
  return createSeedDb();
}

let state: Db = load();
const listeners = new Set<() => void>();
let persistTimer: ReturnType<typeof setTimeout> | undefined;

function schedulePersist() {
  if (typeof localStorage === "undefined") return;
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota exceeded — prototype keeps working in memory */
    }
  }, 150);
}

export const db = {
  get: (): Db => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Immutable update: mutate a deep copy, then publish it. */
  update(mutator: (draft: Db) => void) {
    const next = structuredClone(state);
    mutator(next);
    state = next;
    schedulePersist();
    listeners.forEach((l) => l());
  },
  reset() {
    state = createSeedDb();
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    listeners.forEach((l) => l());
  },
};

/** Simulated network latency so loading states are visible and realistic. */
export const latency = <T>(value: T, ms = 220): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function settingsFor(d: Db, userId: ID | null): AppSettings {
  return (userId && d.settings[userId]) || DEFAULT_SETTINGS;
}
export function walletFor(d: Db, userId: ID | null): Wallet {
  return (userId && d.wallets[userId]) || { coins: 0, preMatchCredits: 0, superLikes: 0 };
}
