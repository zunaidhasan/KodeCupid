import type { Conversation, ID, Like, Match, MemberRecord } from "@/types";
import { EXTEND_MATCH_COINS, SUPER_LIKE_COINS } from "@/data/catalog";
import { promptById } from "@/data/icebreakers";
import { getEntitlements } from "@/lib/entitlements";
import { hashString, nowISO, uid } from "@/lib/format";
import { matchScore } from "@/lib/matchScore";
import { db, latency, settingsFor, sleep, walletFor } from "./db";
import { notify } from "./notificationService";
import { getMember, matchBetween, matchesThisWeek } from "./selectors";

export type LikeResult =
  | { status: "liked" }
  | { status: "matched"; match: Match; conversation: Conversation; other: MemberRecord }
  | { status: "limit" }
  | { status: "no_credits" };

/** Mock "did they like me back?" — deterministic so demos are repeatable. PRODUCTION: real mutual-like check. */
function likesBack(me: MemberRecord, other: MemberRecord, kind: Like["kind"]): boolean {
  const d = db.get();
  if (d.likes.some((l) => l.fromId === other.user.id && l.toId === me.user.id)) return true;
  const score = matchScore(me, other).total;
  const threshold = Math.max(25, Math.min(80, score - 25)) + (kind === "super" ? 25 : 0);
  return hashString(other.user.id + me.user.id) % 100 < threshold;
}

export const matchService = {
  async like(meId: ID, targetId: ID, kind: Like["kind"] = "like"): Promise<LikeResult> {
    const d = db.get();
    const me = getMember(d, meId);
    const other = getMember(d, targetId);
    if (!me || !other) throw new Error("That profile isn't available anymore.");
    const ent = getEntitlements(me.user);

    if (kind === "super") {
      const w = walletFor(d, meId);
      if (!ent.canSuperLike) return { status: "no_credits" };
      if (w.superLikes <= 0 && w.coins < SUPER_LIKE_COINS) return { status: "no_credits" };
    }

    const mutual = likesBack(me, other, kind);
    const limitHit = mutual && ent.weeklyMatchLimit !== null && matchesThisWeek(d, meId) >= ent.weeklyMatchLimit;
    const like: Like = { id: uid("l"), fromId: meId, toId: targetId, kind, createdAt: nowISO() };

    db.update((s) => {
      s.likes.push(like);
      if (kind === "super") {
        const w = (s.wallets[meId] ??= { coins: 0, preMatchCredits: 0, superLikes: 0 });
        if (w.superLikes > 0) w.superLikes -= 1; else w.coins -= SUPER_LIKE_COINS;
      }
    });
    await latency(null, 200);
    if (limitHit) return { status: "limit" };
    if (!mutual) return { status: "liked" };

    const settings = settingsFor(db.get(), meId);
    const created = Date.now();
    const match: Match = {
      id: uid("match"), userIds: [meId, targetId], score: matchScore(me, other).total, status: "active",
      createdAt: new Date(created).toISOString(), expiresAt: new Date(created + settings.matchExpiryDays * 86400000).toISOString(),
    };
    const existingPre = db.get().conversations.find((c) => c.preMatch && c.participantIds.includes(meId) && c.participantIds.includes(targetId));
    const conversation: Conversation = existingPre
      ? { ...existingPre, preMatch: false, matchId: match.id, expiresAt: match.expiresAt }
      : { id: uid("conv"), matchId: match.id, participantIds: [meId, targetId], preMatch: false, createdAt: match.createdAt, expiresAt: match.expiresAt, lastMessageAt: match.createdAt };
    db.update((s) => {
      s.matches.push(match);
      s.conversations = s.conversations.filter((c) => c.id !== conversation.id).concat(conversation);
    });
    notify(meId, { type: "match", title: `It's a match with ${other.profile.displayName}! 🎉`, body: "Say hello before the match expires.", link: `/app/chat/${conversation.id}` });
    matchService.scheduleGreeting(conversation.id, other, me);
    return { status: "matched", match, conversation, other };
  },

  async pass(meId: ID, targetId: ID) {
    db.update((s) => { s.passes.push({ id: uid("p"), fromId: meId, toId: targetId, createdAt: nowISO() }); });
    return latency(true, 80);
  },

  /** Undo the last pass (premium "rewind" could live here). */
  async unmatch(matchId: ID) {
    db.update((s) => { const m = s.matches.find((x) => x.id === matchId); if (m) m.status = "unmatched"; });
    return latency(true, 200);
  },

  /** Spend coins to extend an expiring/expired match by another window. */
  async extendMatch(meId: ID, matchId: ID): Promise<{ ok: boolean; reason?: string }> {
    const d = db.get();
    if (walletFor(d, meId).coins < EXTEND_MATCH_COINS) return { ok: false, reason: "You need more coins to extend this match." };
    const days = settingsFor(d, meId).matchExpiryDays;
    const until = new Date(Date.now() + days * 86400000).toISOString();
    db.update((s) => {
      s.wallets[meId].coins -= EXTEND_MATCH_COINS;
      const m = s.matches.find((x) => x.id === matchId);
      if (m) { m.status = "active"; m.expiresAt = until; }
      const c = s.conversations.find((x) => x.matchId === matchId);
      if (c) c.expiresAt = until;
    });
    return latency({ ok: true }, 300);
  },

  /** The other person says hi a few seconds after a match (mock). */
  scheduleGreeting(conversationId: ID, other: MemberRecord, me: MemberRecord) {
    (async () => {
      await sleep(3500);
      const d = db.get();
      if (d.messages.some((m) => m.conversationId === conversationId)) return;
      const prompt = other.profile.icebreakers[0] ? promptById(other.profile.icebreakers[0].promptId)?.text : undefined;
      const body = `Hi ${me.profile.displayName.split(" ")[0]}! 👋 Glad we matched.${prompt ? ` ${prompt}` : " How's your week going?"}`;
      db.update((s) => {
        s.messages.push({ id: uid("msg"), conversationId, senderId: other.user.id, body, createdAt: nowISO() });
        const c = s.conversations.find((x) => x.id === conversationId);
        if (c) c.lastMessageAt = nowISO();
      });
      notify(me.user.id, { type: "message", title: `${other.profile.displayName.split(" ")[0]} said hi`, body, link: `/app/chat/${conversationId}` });
    })();
  },

  existingMatch: matchBetween,
};
