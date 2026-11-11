import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import type { PaymentProvider } from "@/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/Input";

export interface PayAttempt { provider: PaymentProvider; cardNumber: string; forceFail: boolean }
export interface PayOutcome { ok: boolean; reason?: string }

const PROVIDERS: { id: PaymentProvider; label: string; chip: string; button: string }[] = [
  { id: "stripe", label: "Stripe", chip: "bg-[#635BFF] text-white", button: "bg-[#635BFF] text-white hover:bg-[#4B44E0]" },
  { id: "square", label: "Square", chip: "bg-black text-white", button: "bg-black text-white hover:bg-neutral-800" },
  { id: "paypal", label: "PayPal", chip: "bg-[#FFC439] text-[#003087]", button: "bg-[#FFC439] text-[#003087] hover:bg-[#f5b800]" },
];

/**
 * MOCK checkout. Looks like Stripe / Square / PayPal but never contacts them.
 * Test cards: …4242 succeeds · …0002 is declined · …9995 insufficient funds.
 * PRODUCTION: replace the inner form with Stripe Elements / Square Web Payments SDK / PayPal Buttons.
 */
export function MockPaymentForm({ amountCents, onPay, submitLabel }: { amountCents: number; onPay: (a: PayAttempt) => Promise<PayOutcome>; submitLabel?: string }) {
  const [provider, setProvider] = useState<PaymentProvider>("stripe");
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [exp, setExp] = useState("12/29");
  const [cvc, setCvc] = useState("123");
  const [name, setName] = useState("");
  const [ppEmail, setPpEmail] = useState("demo.buyer@paypal.test");
  const [forceFail, setForceFail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState("");
  const current = PROVIDERS.find((p) => p.id === provider)!;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (provider === "paypal") {
      if (!/^\S+@\S+\.\S+$/.test(ppEmail)) errs.pp = "Enter a valid email for the mock PayPal login.";
    } else {
      const digits = card.replace(/\D/g, "");
      if (digits.length < 13 || digits.length > 19) errs.card = "Card numbers have 13–19 digits.";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) errs.exp = "Use MM/YY, like 08/28.";
      if (!/^\d{3,4}$/.test(cvc)) errs.cvc = "3 or 4 digits.";
      if (name.trim().length < 2) errs.name = "Enter the name on the card.";
    }
    setErrors(errs);
    setFailure("");
    if (Object.keys(errs).length) return;
    setBusy(true);
    const res = await onPay({ provider, cardNumber: provider === "paypal" ? "4242" : card, forceFail });
    setBusy(false);
    if (!res.ok) setFailure(res.reason ?? "The payment didn't go through. Please try again.");
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div role="note" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <p><strong>Prototype — no real charge.</strong> This is a mocked {current.label} checkout. Don't enter real card details.</p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Pay with</legend>
        <div role="radiogroup" className="grid grid-cols-3 gap-2">
          {PROVIDERS.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={provider === p.id} onClick={() => setProvider(p.id)} className={cn("flex h-14 items-center justify-center rounded-2xl border-2 text-sm font-bold transition-all", provider === p.id ? "border-brand-600 bg-brand-50" : "border-cream-200 bg-white hover:border-brand-300")}>
              <span className={cn("rounded-md px-2 py-1 text-xs", p.chip)}>{p.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {provider === "paypal" ? (
        <div className="space-y-3 rounded-2xl bg-cream-100 p-4">
          <p className="text-sm text-ink-soft">You'd normally be redirected to PayPal to log in. Here we simulate it:</p>
          <Input label="PayPal email (mock)" type="email" value={ppEmail} onChange={(e) => setPpEmail(e.target.value)} error={errors.pp} autoComplete="off" />
        </div>
      ) : (
        <div className="space-y-3">
          <Input label="Card number" inputMode="numeric" autoComplete="off" value={card} onChange={(e) => setCard(e.target.value.replace(/[^\d ]/g, "").slice(0, 23))} error={errors.card} hint="Use 4242 4242 4242 4242 for success." prefix={<Lock className="h-4 w-4" aria-hidden />} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Expiry" placeholder="MM/YY" value={exp} onChange={(e) => setExp(e.target.value.slice(0, 5))} error={errors.exp} autoComplete="off" />
            <Input label="CVC" inputMode="numeric" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} error={errors.cvc} autoComplete="off" />
          </div>
          <Input label="Name on card" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="off" placeholder="Test Cardholder" />
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
        <input type="checkbox" checked={forceFail} onChange={(e) => setForceFail(e.target.checked)} className="h-4 w-4 rounded accent-coral-500" />
        Simulate a failed payment (demo)
      </label>

      {failure && <p role="alert" className="rounded-2xl bg-coral-50 p-3 text-sm font-medium text-coral-700">{failure}</p>}

      <button type="submit" disabled={busy} className={cn("flex h-12 w-full items-center justify-center rounded-full text-base font-bold shadow-soft transition-colors disabled:opacity-60", current.button)}>
        {busy ? "Processing (mock)…" : (submitLabel ?? `Pay ${formatCurrency(amountCents)}`)}
      </button>
    </form>
  );
}
