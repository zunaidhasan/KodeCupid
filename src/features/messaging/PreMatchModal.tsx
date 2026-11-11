import { useState } from "react";
import { Send } from "lucide-react";
import type { MemberRecord } from "@/types";
import { PREMATCH_PRICE_CENTS } from "@/data/catalog";
import { formatCurrency } from "@/lib/format";
import { chatService, PREMATCH_MAX_CHARS } from "@/services/chatService";
import { paymentService } from "@/services/paymentService";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { MockPaymentForm } from "@/features/billing/MockPaymentForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";

/** One limited message before matching, gated behind a MOCK credit purchase. */
export function PreMatchModal({ open, onClose, me, target, onSent }: { open: boolean; onClose: () => void; me: MemberRecord; target: MemberRecord; onSent: (convId: string) => void }) {
  const { wallet } = useApp();
  const toast = useToast();
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const hasCredit = wallet.preMatchCredits > 0;
  const first = target.profile.displayName.split(" ")[0];

  const send = async () => {
    setBusy(true); setErr("");
    try { const c = await chatService.sendPreMatchMessage(me.user.id, target.user.id, body); toast.success("Message sent", `${first} will see it. Chat opens if you match.`); onSent(c.id); onClose(); setBody(""); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={hasCredit ? `Message ${first}` : "Send a pre-match message"} description={hasCredit ? "You get one message. Make it count — a thoughtful opener works best." : `One limited message before you match · ${formatCurrency(PREMATCH_PRICE_CENTS)} (prototype payment flow)`}
      footer={hasCredit ? <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="accent" loading={busy} onClick={send} leftIcon={<Send className="h-4 w-4" />}>Send message</Button></div> : undefined}>
      {hasCredit ? (
        <div className="space-y-3">
          <Textarea label="Your message" value={body} onChange={(e) => setBody(e.target.value)} maxLength={PREMATCH_MAX_CHARS} counter={PREMATCH_MAX_CHARS} error={err} placeholder={`Hi ${first}, your icebreaker answer made me smile…`} />
          <p className="text-xs text-ink-mute">Credits left: {wallet.preMatchCredits}. Text only. Prototype — no real charge was made.</p>
        </div>
      ) : (
        <MockPaymentForm amountCents={PREMATCH_PRICE_CENTS} submitLabel={`Pay ${formatCurrency(PREMATCH_PRICE_CENTS)} (mock)`}
          onPay={async ({ provider, cardNumber, forceFail }) => { const r = await paymentService.buyPreMatchCredit(me.user.id, provider, PREMATCH_PRICE_CENTS, { cardNumber, forceFail }); return { ok: r.ok, reason: r.failureReason }; }} />
      )}
    </Modal>
  );
}
