import type { ID, Notification, NotificationType } from "@/types";
import { nowISO, uid } from "@/lib/format";
import { currentHHMM, isWithinQuietHours } from "@/lib/quietHours";
import { db, latency, settingsFor } from "./db";
import { getMember } from "./selectors";
import { pushProvider } from "./providers";

/** True when `userId` is currently inside their quiet hours (uses the demo "simulated time" if set). */
export function isQuietNow(userId: ID): boolean {
  const d = db.get();
  const member = getMember(d, userId);
  if (!member) return false;
  return isWithinQuietHours(member.profile.notificationPrefs.quietHours, currentHHMM(new Date(), settingsFor(d, userId).simulatedTime));
}

const PREF_KEY: Partial<Record<NotificationType, "matches" | "messages" | "likes" | "dates">> = {
  match: "matches", message: "messages", like: "likes", date: "dates",
};

/**
 * Create an in-app notification and (mock) push it.
 * Shift-aware quiet hours: during quiet hours the push is HELD and delivered later.
 */
export function notify(userId: ID, n: { type: NotificationType; title: string; body: string; link?: string }): Notification | null {
  const d = db.get();
  const member = getMember(d, userId);
  const prefs = member?.profile.notificationPrefs;
  const key = PREF_KEY[n.type];
  if (prefs && key && !prefs[key]) return null; // user turned this category off
  const held = isQuietNow(userId);
  const record: Notification = { id: uid("n"), userId, ...n, read: false, held: held || undefined, createdAt: nowISO() };
  db.update((s) => { s.notifications.unshift(record); });
  if (!held && prefs?.push !== false) pushProvider.send({ title: n.title, body: n.body, link: n.link });
  return record;
}

export const notificationService = {
  async markRead(id: ID) {
    db.update((s) => { const n = s.notifications.find((x) => x.id === id); if (n) n.read = true; });
  },
  async markAllRead(userId: ID) {
    db.update((s) => { s.notifications.forEach((n) => { if (n.userId === userId) n.read = true; }); });
  },
  async clear(userId: ID) {
    db.update((s) => { s.notifications = s.notifications.filter((n) => n.userId !== userId); });
  },
  /** Demo helper: trigger a mock incoming event so stakeholders can see push + quiet hours behaviour. */
  async simulate(userId: ID, type: NotificationType) {
    const samples: Record<NotificationType, { title: string; body: string; link: string }> = {
      match: { title: "New match! 🎉", body: "Dr. Zoe Alvarez liked you back.", link: "/app/matches" },
      message: { title: "New message from Theo", body: "Sunrise Bakery after your shift?", link: "/app/matches" },
      like: { title: "Someone new liked you", body: "A verified scientist nearby liked your profile.", link: "/app" },
      date: { title: "Micro-date invitation", body: "Carlos suggested a lunch break coffee.", link: "/app/dates" },
      verification: { title: "Verification update", body: "Your credential is under review.", link: "/app/me/verify" },
      billing: { title: "Payment reminder", body: "Prototype reminder — no real charge.", link: "/app/subscription" },
      safety: { title: "Safety update", body: "Thanks for reporting — our team has reviewed it.", link: "/app/safety" },
    };
    notify(userId, { type, ...samples[type] });
    return latency(true, 100);
  },
  /** Demo helper: quiet hours ended → deliver everything that was held. */
  async releaseHeld(userId: ID) {
    const held = db.get().notifications.filter((n) => n.userId === userId && n.held);
    db.update((s) => { s.notifications.forEach((n) => { if (n.userId === userId) n.held = undefined; }); });
    held.forEach((n) => pushProvider.send({ title: n.title, body: n.body, link: n.link }));
    return held.length;
  },
};
