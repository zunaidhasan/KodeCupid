import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { itemById } from "@/data/catalog";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { paymentService } from "@/services/paymentService";
import { useApp, useMe } from "@/context/AppContext";
import { useDocumentTitle } from "@/hooks";
import { Page } from "@/components/PageHeader";
import { buttonStyles } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MockPaymentForm } from "./MockPaymentForm";

export function CheckoutPage() {
  useDocumentTitle("Checkout");
  const me = useMe();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const item = itemById(params.get("item") ?? "");
  if (!item) return <Page><EmptyState icon="🛒" title="Nothing to check out" description="Choose a plan, pass or coin pack first." action={<Link to="/app/subscription" className={buttonStyles()}>See plans</Link>} /></Page>;

  return (
    <Page>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden />Back</button>
      <h1 className="font-display text-3xl font-semibold">Checkout</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <Card className="order-2 md:order-1">
          <MockPaymentForm amountCents={item.priceCents}
            onPay={async ({ provider, cardNumber, forceFail }) => {
              const r = await paymentService.purchaseItem(me.user.id, item.id, provider, { cardNumber, forceFail });
              if (r.ok) navigate(`/app/payment/success?pid=${r.payment.id}`, { replace: true });
              else navigate(`/app/payment/failed?item=${item.id}&reason=${encodeURIComponent(r.failureReason ?? "")}`, { replace: true });
              return { ok: r.ok, reason: r.failureReason };
            }} />
        </Card>
        <aside className="order-1 md:order-2"><Card tone="cream" className="space-y-3 md:sticky md:top-6">
          <h2 className="font-display text-lg font-semibold">Order summary</h2>
          <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.emoji} {item.name}</p><p className="text-xs text-ink-mute">{item.blurb}</p></div><p className="font-bold">{formatCurrency(item.priceCents)}</p></div>
          <hr className="border-cream-200" />
          <div className="flex justify-between font-bold"><span>Total today</span><span>{formatCurrency(item.priceCents)}</span></div>
          {item.kind === "plan" && <p className="text-xs text-ink-mute">Then {formatCurrency(item.priceCents)}/month. Cancel anytime (mock).</p>}
          <p className="flex items-center gap-1.5 text-xs text-ink-mute"><Lock className="h-3.5 w-3.5" aria-hidden />Prototype — no real charge.</p>
        </Card></aside>
      </div>
    </Page>
  );
}

export function PaymentSuccessPage() {
  useDocumentTitle("Payment successful");
  const [params] = useSearchParams();
  const { db } = useApp();
  const pay = db.payments.find((p) => p.id === params.get("pid"));
  return (
    <Page><Card className="mx-auto max-w-lg text-center" role="status">
      <span className="mx-auto mb-4 flex h-20 w-20 animate-pop items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-11 w-11" aria-hidden /></span>
      <h1 className="font-display text-3xl font-semibold">Payment successful 🎉</h1>
      <p className="mt-2 text-ink-soft">{pay ? <>You bought <strong>{pay.description}</strong> for {formatCurrency(pay.amountCents)} via {pay.provider}.</> : "Your purchase is complete."}</p>
      {pay && <p className="mt-1 text-xs text-ink-mute">Receipt #{pay.id.slice(-8).toUpperCase()} · {formatDateTime(pay.createdAt)}</p>}
      <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-semibold text-amber-900">Prototype — no real charge was made.</p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row"><Link to="/app" className={buttonStyles({ variant: "accent" })}>Start discovering</Link><Link to="/app/subscription" className={buttonStyles({ variant: "secondary" })}>Manage subscription</Link></div>
    </Card></Page>
  );
}

export function PaymentFailedPage() {
  useDocumentTitle("Payment failed");
  const [params] = useSearchParams();
  const item = params.get("item");
  return (
    <Page><Card className="mx-auto max-w-lg text-center" role="alert">
      <span className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-coral-50 text-coral-600"><AlertTriangle className="h-10 w-10" aria-hidden /></span>
      <h1 className="font-display text-3xl font-semibold">Payment didn't go through</h1>
      <p className="mt-2 text-ink-soft">{params.get("reason") || "The payment couldn't be completed."}</p>
      <p className="mt-1 text-sm text-ink-mute">You haven't been charged. (Prototype — no real charge either way.)</p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row"><Link to={item ? `/app/checkout?item=${item}` : "/app/subscription"} className={buttonStyles({ variant: "accent" })}>Try again</Link><Link to="/app/subscription" className={buttonStyles({ variant: "secondary" })}>Back to plans</Link></div>
      <Link to="/contact" className="mt-4 inline-block text-sm font-semibold text-brand-700 underline">Contact support</Link>
    </Card></Page>
  );
}
