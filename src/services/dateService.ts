import type { ID, MicroDate } from "@/types";
import { VENUES } from "@/data/facilities";
import { formatHour, hashString, nowISO, uid } from "@/lib/format";
import { TIME_BLOCKS } from "@/lib/schedule";
import { db, latency, sleep } from "./db";
import { notify } from "./notificationService";
import { getMember } from "./selectors";

export function blocksLabel(blockIds: string[]): string {
  const blocks = TIME_BLOCKS.filter((b) => blockIds.includes(b.id)).sort((a, b) => a.start - b.start);
  if (!blocks.length) return "";
  return `${formatHour(blocks[0].start)} – ${formatHour(blocks[blocks.length - 1].end)}`;
}

export const dateService = {
  /** Micro-date = short, public, near-workplace meetup. Sends a Pending invitation. */
  async sendInvite(input: { matchId: ID; fromId: ID; toId: ID; date: string; blockIds: string[]; venueId: string; note?: string }) {
    if (!input.date) throw new Error("Pick a date first.");
    if (!input.blockIds.length) throw new Error("Choose at least one time block.");
    const venue = VENUES.find((v) => v.id === input.venueId);
    if (!venue) throw new Error("Choose a suggested location.");
    const md: MicroDate = {
      id: uid("md"), ...input, startLabel: blocksLabel(input.blockIds), venueName: venue.name, status: "pending", createdAt: nowISO(),
    };
    db.update((s) => { s.microDates.push(md); });
    dateService.scheduleAutoResponse(md.id);
    return latency(md, 350);
  },

  async respond(id: ID, status: "accepted" | "declined") {
    db.update((s) => { const m = s.microDates.find((x) => x.id === id); if (m) { m.status = status; m.respondedAt = nowISO(); } });
    return latency(true, 150);
  },

  async cancel(id: ID) {
    db.update((s) => { s.microDates = s.microDates.filter((m) => m.id !== id); });
  },

  /** Mock: the invitee replies a few seconds later (≈70% accept). PRODUCTION: real invitee action + push. */
  scheduleAutoResponse(id: ID) {
    (async () => {
      await sleep(7000);
      dateService.resolve(id);
    })();
  },

  resolve(id: ID) {
    const d = db.get();
    const md = d.microDates.find((m) => m.id === id);
    if (!md || md.status !== "pending") return;
    const toMember = getMember(d, md.toId);
    if (!toMember || toMember.user.role !== "member" || md.toId === d.session.userId) return;
    const accept = hashString(md.id) % 10 < 7;
    db.update((s) => { const m = s.microDates.find((x) => x.id === id); if (m) { m.status = accept ? "accepted" : "declined"; m.respondedAt = nowISO(); } });
    notify(md.fromId, {
      type: "date",
      title: accept ? `${toMember.profile.displayName.split(" ")[0]} accepted your micro-date 🎉` : `${toMember.profile.displayName.split(" ")[0]} can't make it`,
      body: `${md.venueName} · ${md.startLabel}`, link: "/app/dates",
    });
  },

  /** On app load: resolve invitations that were sent >7s ago (timers don't survive a page refresh). */
  resolveStale() {
    const d = db.get();
    d.microDates
      .filter((m) => m.status === "pending" && m.fromId === d.session.userId && Date.now() - new Date(m.createdAt).getTime() > 8000 && m.id.length > 6)
      .forEach((m) => dateService.resolve(m.id));
  },
};
