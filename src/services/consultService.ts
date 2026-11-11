import type { CurbsideConsultRequest, ID, PaymentProvider } from "@/types";
import { CONSULT_PRICE_CENTS } from "@/data/catalog";
import { addHours, nowISO, uid } from "@/lib/format";
import { db, sleep } from "./db";
import { notify } from "./notificationService";
import { paymentService } from "./paymentService";

const CANNED_RESPONSE = `Thanks for trusting us with this. Here's our read (prototype response):

• What's going well: they respond thoughtfully and ask questions back — that's a genuinely good sign.
• One thing to watch: mixed signals about timing. A kind, direct check-in ("I'd love to plan something — what does your week look like?") usually clears this up.
• Suggested next step: propose a short, public micro-date near one of your workplaces and see how it feels in person.

Trust your instincts, and remember you can pause or block at any time. This is general dating feedback — not therapy, medical advice, or crisis support.`;

export const consultService = {
  async submit(input: { userId: ID; question: string; context?: string; screenshotUrl?: string; provider: PaymentProvider; cardNumber?: string; forceFail?: boolean }) {
    if (input.question.trim().length < 10) throw new Error("Tell us a bit more about your question (at least 10 characters).");
    const pay = await paymentService.charge({
      userId: input.userId, amountCents: CONSULT_PRICE_CENTS, description: "Curbside Consult", kind: "consult",
      provider: input.provider, cardNumber: input.cardNumber, forceFail: input.forceFail,
    });
    if (!pay.ok) return { ok: false as const, reason: pay.failureReason };
    const req: CurbsideConsultRequest = {
      id: uid("cc"), userId: input.userId, question: input.question.trim(), context: input.context?.trim() || undefined,
      screenshotUrl: input.screenshotUrl, priceCents: CONSULT_PRICE_CENTS, status: "submitted", createdAt: nowISO(),
      respondBy: addHours(new Date(), 48).toISOString(),
    };
    db.update((s) => { s.consults.unshift(req); });
    consultService.scheduleResponse(req.id);
    return { ok: true as const, request: req };
  },

  /** Mock counselor: moves to "in review" after 6s and answers after ~20s. PRODUCTION: human counselor workflow. */
  scheduleResponse(id: ID) {
    (async () => {
      await sleep(6000);
      db.update((s) => { const r = s.consults.find((x) => x.id === id); if (r && r.status === "submitted") r.status = "in_review"; });
      await sleep(14000);
      consultService.answer(id);
    })();
  },

  answer(id: ID) {
    const req = db.get().consults.find((r) => r.id === id);
    if (!req || req.status === "answered") return;
    db.update((s) => { const r = s.consults.find((x) => x.id === id); if (r) { r.status = "answered"; r.response = CANNED_RESPONSE; r.respondedAt = nowISO(); } });
    notify(req.userId, { type: "safety", title: "Your Curbside Consult has a response", body: "A counselor replied to your question.", link: "/app/consult" });
  },

  /** On load, finish any request that should already have been answered. */
  resolveStale() {
    db.get().consults.filter((r) => r.status !== "answered" && Date.now() - new Date(r.createdAt).getTime() > 25000).forEach((r) => consultService.answer(r.id));
  },
};
