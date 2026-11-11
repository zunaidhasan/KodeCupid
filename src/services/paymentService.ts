import type { ID, Payment, PaymentProvider, PlanId, Subscription } from "@/types";
import { itemById } from "@/data/catalog";
import { addHours, nowISO, uid } from "@/lib/format";
import { db, latency } from "./db";
import { notify } from "./notificationService";
import { paymentGateways } from "./providers";

export interface PayInput {
  userId: ID;
  amountCents: number;
  description: string;
  kind: Payment["kind"];
  provider: PaymentProvider;
  cardNumber?: string;
  forceFail?: boolean;
}
export interface PayResult { ok: boolean; payment: Payment; failureReason?: string }

/** Runs the (mock) gateway and records a Payment row. NO REAL CHARGE is ever made. */
async function charge(input: PayInput): Promise<PayResult> {
  const res = await paymentGateways[input.provider].charge({
    amountCents: input.amountCents, description: input.description, cardNumber: input.cardNumber, forceFail: input.forceFail,
  });
  const payment: Payment = {
    id: uid("pay"), userId: input.userId, kind: input.kind, description: input.description, amountCents: input.amountCents,
    provider: input.provider, status: res.ok ? "succeeded" : "failed", createdAt: nowISO(),
  };
  db.update((s) => { s.payments.unshift(payment); });
  return { ok: res.ok, payment, failureReason: res.failureReason };
}

export const paymentService = {
  charge,

  /** Buy a catalog item (plan, pass, coin pack, gift) and apply its effect on success. */
  async purchaseItem(userId: ID, itemId: string, provider: PaymentProvider, opts: { cardNumber?: string; forceFail?: boolean } = {}): Promise<PayResult> {
    const item = itemById(itemId);
    if (!item) throw new Error("That item isn't available.");
    const kind: Payment["kind"] = item.kind === "plan" ? "subscription" : item.kind === "pass" ? "pass" : item.kind;
    const result = await charge({ userId, amountCents: item.priceCents, description: item.name, kind, provider, ...opts });
    if (!result.ok) return result;

    db.update((s) => {
      const user = s.members.find((m) => m.user.id === userId)?.user;
      if (!user) return;
      if (item.kind === "plan") {
        const plan = item.id as PlanId;
        user.plan = plan;
        s.subscriptions = s.subscriptions.filter((x) => x.userId !== userId);
        const sub: Subscription = {
          id: uid("sub"), userId, plan, status: "active", provider, priceCents: item.priceCents,
          startedAt: nowISO(), renewsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        };
        s.subscriptions.push(sub);
      } else if (item.kind === "pass") {
        user.pass = { kind: item.id === "daily" ? "daily" : "hourly", expiresAt: addHours(new Date(), item.id === "daily" ? 24 : 1).toISOString() };
      } else {
        const w = (s.wallets[userId] ??= { coins: 0, preMatchCredits: 0, superLikes: 0 });
        w.coins += item.coins ?? 0;
        s.coinPurchases.push({ id: uid("cp"), userId, item: item.name, coins: item.coins ?? 0, quantity: 1, amountCents: item.priceCents, createdAt: nowISO() });
      }
    });
    notify(userId, { type: "billing", title: `Payment received — ${item.name}`, body: "Prototype receipt: no real charge was made.", link: "/app/subscription" });
    return result;
  },

  /** Paid pre-match message credit. */
  async buyPreMatchCredit(userId: ID, provider: PaymentProvider, amountCents: number, opts: { cardNumber?: string; forceFail?: boolean } = {}) {
    const result = await charge({ userId, amountCents, description: "Pre-match message credit", kind: "prematch", provider, ...opts });
    if (result.ok) db.update((s) => { const w = (s.wallets[userId] ??= { coins: 0, preMatchCredits: 0, superLikes: 0 }); w.preMatchCredits += 1; });
    return result;
  },

  /** Prototype shortcut: switch plan instantly (no payment) so stakeholders can compare tiers. */
  async setPlanDemo(userId: ID, plan: PlanId) {
    db.update((s) => {
      const u = s.members.find((m) => m.user.id === userId)?.user;
      if (u) { u.plan = plan; u.pass = undefined; }
      s.subscriptions = s.subscriptions.filter((x) => x.userId !== userId);
      if (plan !== "free") {
        s.subscriptions.push({
          id: uid("sub"), userId, plan, status: "active", provider: "stripe", priceCents: plan === "silver" ? 3999 : 4999,
          startedAt: nowISO(), renewsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        });
      }
    });
    return latency(true, 150);
  },

  async cancelSubscription(userId: ID) {
    db.update((s) => {
      const sub = s.subscriptions.find((x) => x.userId === userId && x.status === "active");
      if (sub) { sub.status = "canceled"; sub.canceledAt = nowISO(); }
    });
    notify(userId, { type: "billing", title: "Subscription canceled", body: "You'll keep your plan until the end of the billing period (prototype).", link: "/app/subscription" });
    return latency(true, 300);
  },
};
