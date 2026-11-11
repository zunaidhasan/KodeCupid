import type { ID } from "@/types";
import { PREMATCH_PRICE_CENTS } from "@/data/catalog";
import { getEntitlements } from "@/lib/entitlements";
import { hashString, nowISO, uid } from "@/lib/format";
import { db, latency, sleep, walletFor } from "./db";
import { notify } from "./notificationService";
import { conversationState, getMember, otherId } from "./selectors";

/* Mock "typing…" indicator as a tiny external store (consumed with useSyncExternalStore). */
const typing = new Set<ID>();
const typingListeners = new Set<() => void>();
const setTyping = (id: ID, on: boolean) => {
  if (on) typing.add(id); else typing.delete(id);
  typingListeners.forEach((l) => l());
};
export const typingStore = {
  isTyping: (convId: ID) => typing.has(convId),
  subscribe(l: () => void) { typingListeners.add(l); return () => typingListeners.delete(l); },
};

let activeConversation: ID | null = null;
export const setActiveConversation = (id: ID | null) => { activeConversation = id; };

const REPLIES = [
  "Ha, that made my day 😄",
  "Okay, I like your energy. Tell me more!",
  "Honestly same. Shift work humbles you, right?",
  "I'd love to — want to pick a time with the micro-date calendar? 📅",
  "That's such a good answer. Mine would be a very long nap.",
  "Okay but now I need to know the story behind that.",
  "You seem like exactly the kind of person I'd want to grab coffee with ☕",
];

export const PREMATCH_MAX_CHARS = 200;

export const chatService = {
  async sendMessage(convId: ID, senderId: ID, input: { body?: string; imageUrl?: string }) {
    const body = (input.body ?? "").trim();
    if (!body && !input.imageUrl) throw new Error("Type a message first.");
    const d = db.get();
    const conv = d.conversations.find((c) => c.id === convId);
    if (!conv) throw new Error("This conversation isn't available.");
    const me = getMember(d, senderId);
    if (!me) throw new Error("Please sign in.");
    if (!conv.preMatch) {
      const st = conversationState(d, conv);
      if (st.kind === "expired") throw new Error("This match has expired. Extend it to keep chatting.");
      if (!getEntitlements(me.user).canChat) throw new Error("Chat is part of Silver and Premium. Upgrade to send messages.");
    } else {
      throw new Error("You've already used your pre-match message. Chat opens when you both like each other.");
    }
    const message = { id: uid("msg"), conversationId: convId, senderId, body, imageUrl: input.imageUrl, createdAt: nowISO() };
    db.update((s) => {
      s.messages.push(message);
      const c = s.conversations.find((x) => x.id === convId);
      if (c) c.lastMessageAt = message.createdAt;
    });
    chatService.simulateReply(convId, senderId, !!input.imageUrl);
    return message;
  },

  /** Mock partner: read receipt → typing indicator → reply. PRODUCTION: realtime channel (Supabase Realtime / WebSocket). */
  simulateReply(convId: ID, senderId: ID, withImage: boolean) {
    (async () => {
      const d = db.get();
      const conv = d.conversations.find((c) => c.id === convId);
      if (!conv) return;
      const partnerId = otherId(conv, senderId);
      await sleep(1100);
      db.update((s) => { s.messages.forEach((m) => { if (m.conversationId === convId && m.senderId === senderId && !m.readAt) m.readAt = nowISO(); }); });
      await sleep(900);
      setTyping(convId, true);
      await sleep(2200);
      setTyping(convId, false);
      const count = db.get().messages.filter((m) => m.conversationId === convId).length;
      const body = withImage ? "Love that photo! 😍" : REPLIES[(hashString(partnerId) + count) % REPLIES.length];
      db.update((s) => {
        s.messages.push({ id: uid("msg"), conversationId: convId, senderId: partnerId, body, createdAt: nowISO(), readAt: activeConversation === convId ? nowISO() : undefined });
        const c = s.conversations.find((x) => x.id === convId);
        if (c) c.lastMessageAt = nowISO();
      });
      if (activeConversation !== convId) {
        const partner = getMember(db.get(), partnerId);
        notify(senderId, { type: "message", title: `New message from ${partner?.profile.displayName.split(" ")[0] ?? "your match"}`, body, link: `/app/chat/${convId}` });
      }
    })();
  },

  async markRead(convId: ID, readerId: ID) {
    const unread = db.get().messages.some((m) => m.conversationId === convId && m.senderId !== readerId && !m.readAt);
    if (!unread) return;
    db.update((s) => {
      s.messages.forEach((m) => { if (m.conversationId === convId && m.senderId !== readerId && !m.readAt) m.readAt = nowISO(); });
      s.notifications.forEach((n) => { if (n.userId === readerId && n.link === `/app/chat/${convId}`) n.read = true; });
    });
  },

  /** One paid, limited pre-match message. Needs a credit (bought via the mock payment flow). */
  async sendPreMatchMessage(meId: ID, targetId: ID, body: string) {
    const text = body.trim();
    if (!text) throw new Error("Write a short message first.");
    if (text.length > PREMATCH_MAX_CHARS) throw new Error(`Keep it under ${PREMATCH_MAX_CHARS} characters.`);
    const d = db.get();
    if (walletFor(d, meId).preMatchCredits < 1) throw new Error("You need a pre-match credit first.");
    if (d.conversations.some((c) => c.participantIds.includes(meId) && c.participantIds.includes(targetId))) {
      throw new Error("You already have a conversation with this person.");
    }
    const now = nowISO();
    const conv = { id: uid("conv"), participantIds: [meId, targetId] as [ID, ID], preMatch: true, createdAt: now, expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), lastMessageAt: now };
    db.update((s) => {
      s.wallets[meId].preMatchCredits -= 1;
      s.conversations.push(conv);
      s.messages.push({ id: uid("msg"), conversationId: conv.id, senderId: meId, body: text, createdAt: now });
    });
    return latency(conv, 300);
  },

  PREMATCH_PRICE_CENTS,
};
