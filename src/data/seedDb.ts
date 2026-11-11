import type {
  AdminAction, Conversation, Db, MemberRecord, Match, Message, MicroDate, Notification, Payment, Report, Subscription,
} from "@/types";
import { addDays, hashString, toISODate } from "@/lib/format";
import { matchScore } from "@/lib/matchScore";
import { screenshotArt } from "@/lib/placeholderArt";
import { DEFAULT_CONTENT } from "./content";
import { DEMO_USER_ID, SEED_MEMBERS } from "./profiles";

export const DB_VERSION = 3;
export const DEFAULT_SETTINGS = {
  matchExpiryDays: 7, videoEnabled: true, contentFilter: "standard" as const,
  blurImages: true, filterWords: true, simulatedTime: null,
};

const H = 3600_000;
const DAY = 24 * H;

/**
 * Builds the initial mock database. In production this entire file disappears: the data
 * lives in your backend (Supabase / Firebase / Postgres) and services/* call it instead.
 */
export function createSeedDb(): Db {
  const now = Date.now();
  const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();
  const members: MemberRecord[] = SEED_MEMBERS;
  const byId = (id: string) => members.find((m) => m.user.id === id)!;
  const me = byId(DEMO_USER_ID);
  const day = (n: number) => toISODate(addDays(new Date(), n));

  /* ---- demo member's matches, conversations, messages ---- */
  const mk = (other: string, ageMs: number, status: Match["status"] = "active"): Match => ({
    id: `match_${other}`, userIds: [DEMO_USER_ID, other], score: matchScore(me, byId(other)).total, status,
    createdAt: iso(-ageMs), expiresAt: iso(-ageMs + 7 * DAY),
  });
  const matches: Match[] = [
    mk("u_12", 3 * DAY), mk("u_17", 5 * DAY), mk("u_07", 1 * DAY), mk("u_14", 9 * DAY, "expired"),
  ];
  const conversations: Conversation[] = matches.map((m) => ({
    id: `conv_${m.userIds[1]}`, matchId: m.id, participantIds: m.userIds, preMatch: false,
    createdAt: m.createdAt, expiresAt: m.expiresAt, lastMessageAt: m.createdAt,
  }));
  const msg = (conv: string, from: string, body: string, ago: number, read = true): Message => ({
    id: `msg_${conv}_${ago}`, conversationId: `conv_${conv}`, senderId: from, body, createdAt: iso(-ago * H),
    readAt: read ? iso(-ago * H + 600_000) : undefined,
  });
  const messages: Message[] = [
    msg("u_12", "u_12", "Hi Taylor! Fellow shift worker here 🙂 How was last night?", 70),
    msg("u_12", DEMO_USER_ID, "Ha — three admissions and a very sweet 90-year-old who flirted with me. Yours?", 69),
    msg("u_12", "u_12", "A marathon runner with a tight IT band. I live for those.", 68),
    msg("u_12", DEMO_USER_ID, "Of course you do 😄 Coffee near St. Aldric on your next day off?", 30),
    msg("u_12", "u_12", "Yes! I'm off Thursday. Want to set up a micro-date?", 2, false),
    msg("u_17", "u_17", "Hi! Your icebreaker answer made me laugh — weighted blanket is a lifestyle.", 118),
    msg("u_17", "u_17", "Also: do you like dogs? I have two and a very judgy cat.", 117),
    msg("u_14", "u_14", "Hello! Great to match with a fellow healthcare person.", 200),
  ];
  conversations.forEach((c) => {
    const last = messages.filter((m) => m.conversationId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (last) c.lastMessageAt = last.createdAt;
  });

  const microDates: MicroDate[] = [
    { id: "md_1", matchId: "match_u_12", fromId: DEMO_USER_ID, toId: "u_12", date: day(3), blockIds: ["evening"], startLabel: "5 PM – 7 PM", venueId: "v_bean", venueName: "Bean & Compass Café", status: "pending", createdAt: iso(-3 * H) },
    { id: "md_2", matchId: "match_u_12", fromId: "u_12", toId: DEMO_USER_ID, date: day(6), blockIds: ["early"], startLabel: "6 AM – 8 AM", venueId: "v_sunrise", venueName: "Sunrise Bakery", status: "accepted", createdAt: iso(-26 * H), respondedAt: iso(-20 * H), note: "Post-shift pastry run?" },
    { id: "md_3", matchId: "match_u_17", fromId: "u_17", toId: DEMO_USER_ID, date: day(4), blockIds: ["lunch"], startLabel: "12 PM – 2 PM", venueId: "v_greentable", venueName: "Green Table Lunch Bar", status: "pending", createdAt: iso(-5 * H), note: "Bring photos of your dog (or tell me you don't have one!)" },
    { id: "md_4", matchId: "match_u_17", fromId: DEMO_USER_ID, toId: "u_17", date: day(2), blockIds: ["dinner"], startLabel: "7 PM – 9 PM", venueId: "v_washpark", venueName: "Wash Park Boathouse Café", status: "declined", createdAt: iso(-30 * H), respondedAt: iso(-24 * H) },
    { id: "md_5", matchId: "match_u_07", fromId: DEMO_USER_ID, toId: "u_07", date: day(-2), blockIds: ["morning"], startLabel: "9 AM – 11 AM", venueId: "v_quietmug", venueName: "The Quiet Mug", status: "pending", createdAt: iso(-90 * H) },
  ];

  const n = (id: string, type: Notification["type"], title: string, body: string, agoH: number, link?: string, read = false): Notification => ({
    id: `n_${id}`, userId: DEMO_USER_ID, type, title, body, link, read, createdAt: iso(-agoH * H),
  });
  const notifications: Notification[] = [
    n("1", "match", "It's a match with Dr. Sofia Marin! 🎉", "You both liked each other. Say hello before the match expires.", 24, "/app/chat/conv_u_07"),
    n("2", "message", "Theo sent you a message", "Yes! I'm off Thursday. Want to set up a micro-date?", 2, "/app/chat/conv_u_12"),
    n("3", "like", "Someone new liked you", "A verified educator near Golden liked your profile.", 6, "/app"),
    n("4", "date", "Carlos sent a micro-date invitation", "Lunch at Green Table Lunch Bar · 12 PM – 2 PM", 5, "/app/dates"),
    n("5", "verification", "You're verified ✅", "Your professional verification was approved. Your badge is now live.", 48, "/app/me", true),
    n("6", "billing", "Silver renews in 3 days", "Prototype reminder — no real charge will be made.", 12, "/app/subscription"),
    n("7", "safety", "Safety tip: meet in public first", "Your micro-date venues are all public places near workplaces you choose.", 72, "/safety-tips", true),
  ];

  const reportBase = (r: Partial<Report> & Pick<Report, "id" | "reporterId" | "reportedId" | "category" | "details" | "targetType">): Report => ({
    evidence: [], status: "new", createdAt: iso(-10 * H), updatedAt: iso(-10 * H), ...r,
  });
  const reports: Report[] = [
    reportBase({ id: "rep_1", reporterId: "u_09", reportedId: "u_23", targetType: "message", messageText: "Hey, skip the small talk — send me pics from your shift 😉", category: "inappropriate_message", details: "Pushy message right after matching.", evidence: [screenshotArt("rep1")], createdAt: iso(-5 * H), updatedAt: iso(-5 * H) }),
    reportBase({ id: "rep_2", reporterId: "u_16", reportedId: "u_22", targetType: "profile", category: "fake_profile", details: "Photos look generic and she wouldn't answer questions about her license.", status: "in_review", createdAt: iso(-30 * H), updatedAt: iso(-20 * H) }),
    reportBase({ id: "rep_3", reporterId: "u_13", reportedId: "u_04", targetType: "message", messageText: "Can you help with a quick gift card for a charity I'm running? I'll pay you back!", category: "scam", details: "Asked for a gift card within the first day.", evidence: [screenshotArt("rep3")], createdAt: iso(-52 * H), updatedAt: iso(-52 * H) }),
    reportBase({ id: "rep_4", reporterId: "u_20", reportedId: "u_18", targetType: "profile", category: "other", details: "Profile photo may be copied from somewhere else.", status: "resolved", resolution: "Dismissed — reviewed photos, no violation found.", createdAt: iso(-120 * H), updatedAt: iso(-100 * H) }),
  ];

  const providers = ["stripe", "square", "paypal"] as const;
  const price = { free: 0, silver: 3999, premium: 4999 } as const;
  const subscriptions: Subscription[] = members
    .filter((m) => m.user.plan !== "free")
    .map((m, i) => ({
      id: `sub_${m.user.id}`, userId: m.user.id, plan: m.user.plan, provider: providers[hashString(m.user.id) % 3],
      status: m.user.id === "u_05" ? "canceled" : m.user.id === "u_14" ? "past_due" : "active",
      priceCents: price[m.user.plan], startedAt: iso(-(20 + i * 9) * DAY), renewsAt: iso((3 + i * 4) * DAY),
      canceledAt: m.user.id === "u_05" ? iso(-4 * DAY) : undefined,
    }));
  const payments: Payment[] = [
    ...subscriptions.map((s, i): Payment => ({
      id: `pay_${s.id}`, userId: s.userId, kind: "subscription", description: `${s.plan === "silver" ? "Silver" : "Premium"} — monthly`,
      amountCents: s.priceCents, provider: s.provider, status: s.status === "past_due" ? "failed" : "succeeded", createdAt: iso(-(5 + i * 3) * DAY),
    })),
    { id: "pay_x1", userId: "u_10", kind: "pass", description: "Daily access", amountCents: 999, provider: "stripe", status: "succeeded", createdAt: iso(-2 * DAY) },
    { id: "pay_x2", userId: "u_05", kind: "subscription", description: "Silver — monthly", amountCents: 3999, provider: "paypal", status: "refunded", createdAt: iso(-34 * DAY) },
  ];

  const adminActions: AdminAction[] = [
    { id: "aa_1", adminId: "admin@kodecupid.test", targetUserId: "u_18", action: "Verification review", note: "Asked for a clearer license photo", createdAt: iso(-26 * H) },
    { id: "aa_2", adminId: "admin@kodecupid.test", targetUserId: "u_20", action: "Report dismissed", note: "No violation found (rep_4)", createdAt: iso(-100 * H) },
    { id: "aa_3", adminId: "admin@kodecupid.test", targetUserId: "u_06", action: "Verification approved", note: "Badge photo matches employer directory", createdAt: iso(-140 * H) },
  ];

  return {
    version: DB_VERSION,
    session: { userId: null, onboardingComplete: false, adminEmail: null },
    members, likes: [
      { id: "l_1", fromId: "u_10", toId: DEMO_USER_ID, kind: "like", createdAt: iso(-8 * H) },
      { id: "l_2", fromId: "u_19", toId: DEMO_USER_ID, kind: "like", createdAt: iso(-9 * H) },
      { id: "l_3", fromId: "u_20", toId: DEMO_USER_ID, kind: "super", createdAt: iso(-12 * H) },
    ],
    passes: [], matches, conversations, messages, microDates, notifications, reports, blocks: [],
    subscriptions, payments, coinPurchases: [], consults: [],
    deletionRequests: [
      { id: "del_1", contact: "avery.test@example.com", reason: "I found a partner — thank you!", status: "new", notes: "", createdAt: iso(-20 * H), updatedAt: iso(-20 * H) },
      { id: "del_2", contact: "(303) 555-0187", reason: "Privacy concerns about workplace visibility", status: "processing", notes: "Identity confirmed via email.", createdAt: iso(-70 * H), updatedAt: iso(-40 * H) },
    ],
    adminActions, content: DEFAULT_CONTENT,
    settings: { [DEMO_USER_ID]: { ...DEFAULT_SETTINGS } },
    wallets: { [DEMO_USER_ID]: { coins: 120, preMatchCredits: 1, superLikes: 2 } },
  };
}
