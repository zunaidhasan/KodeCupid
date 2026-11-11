import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Coins, CreditCard, Sparkles, Zap } from "lucide-react";
import type { PlanId } from "@/types";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { paymentService } from "@/services/paymentService";
import { useApp, useMe } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useDocumentTitle, useSimulatedLoading } from "@/hooks";
import { Page, PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { SkeletonCard } from "@/components/ui/SkeletonLoader";
import { PlanCards } from "./PlanCards";
import { PassCards } from "./PricingSections";

export function SubscriptionPage() {
  useDocumentTitle("Subscription");
  const me = useMe();
  const { db, entitlements: ent, wallet } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const { hash } = useLocation();
  const loading = useSimulatedLoading(450);
  const [cancel, setCancel] = useState(false);
  const sub = db.subscriptions.find((s) => s.userId === me.user.id);
  const payments = db.payments.filter((p) => p.userId === me.user.id);

  useEffect(() => { if (!loading && hash) document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }); }, [loading, hash]);

  const choose = async (id: PlanId) => { if (id === "free") { await paymentService.setPlanDemo(me.user.id, "free"); toast.success("Switched to Free"); } else navigate(`/app/checkout?item=${id}`); };

  return (
    <Page wide>
      <PageHeader title="Subscription" subtitle="Manage your plan, passes and payments." back="/app/me" />
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-center text-sm font-semibold text-amber-900">Prototype — no real charge. All payments are mocked.</div>

      {loading ? <SkeletonCard /> : (
        <>
          <Card className="mb-8 grid gap-5 sm:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink-mute">Current plan</p>
              <h2 className="mt-1 flex flex-wrap items-center gap-2 font-display text-3xl font-semibold">{ent.planLabel}{sub?.status === "canceled" && <Badge tone="warning">Cancels {formatDate(sub.renewsAt)}</Badge>}{sub?.status === "past_due" && <Badge tone="danger">Payment past due</Badge>}</h2>
              <p className="mt-1 text-sm text-ink-soft">{me.user.plan === "free" ? (ent.passActive ? `Pass active until ${formatDateTime(ent.passExpiresAt!)}` : "Free: 1 match per week · no member search") : sub ? `${formatCurrency(sub.priceCents)}/month · ${sub.status === "canceled" ? "ends" : "renews"} ${formatDate(sub.renewsAt)} via ${sub.provider}` : "Active"}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <Link to="/app/coins" className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-3 py-1.5 font-semibold"><Coins className="h-4 w-4 text-amber-600" aria-hidden />{wallet.coins} coins</Link>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-3 py-1.5 font-semibold"><Sparkles className="h-4 w-4 text-coral-500" aria-hidden />{wallet.superLikes} Super Likes</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-3 py-1.5 font-semibold"><Zap className="h-4 w-4 text-brand-600" aria-hidden />{wallet.preMatchCredits} pre-match credits</span>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-2">{sub?.status === "active" && <Button variant="danger" onClick={() => setCancel(true)}>Cancel subscription</Button>}{me.user.plan === "free" && <Button variant="accent" onClick={() => navigate("/app/checkout?item=silver")}>Upgrade to Silver</Button>}</div>
          </Card>

          <h2 className="mb-3 font-display text-xl font-semibold">Plans</h2>
          <PlanCards current={me.user.plan} onSelect={choose} />

          <Card tone="cream" className="mt-6">
            <SectionHeading title="Prototype · compare tiers instantly" description="Skip checkout and flip your plan to see how the app changes." />
            <div className="flex flex-wrap gap-2">{(["free", "silver", "premium"] as PlanId[]).map((p) => <Button key={p} size="sm" variant={me.user.plan === p ? "primary" : "secondary"} onClick={async () => { await paymentService.setPlanDemo(me.user.id, p); toast.success(`Now on ${p[0].toUpperCase() + p.slice(1)} (demo)`); }}>{p[0].toUpperCase() + p.slice(1)}</Button>)}</div>
          </Card>

          <h2 id="passes" className="mb-3 mt-10 scroll-mt-6 font-display text-xl font-semibold">Passes</h2>
          <PassCards onBuy={(id) => navigate(`/app/checkout?item=${id}`)} />

          <div className="mt-10 flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Payment history</h2><Link to="/app/coins" className={buttonStyles({ variant: "secondary", size: "sm" })}>Coins & gifts</Link></div>
          {payments.length === 0 ? <p className="mt-3 text-sm text-ink-mute">No payments yet.</p> : (
            <ul className="mt-3 divide-y divide-cream-100 rounded-3xl border border-cream-200 bg-white">
              {payments.map((p) => <li key={p.id} className="flex items-center gap-3 p-4"><CreditCard className="h-5 w-5 text-ink-mute" aria-hidden /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{p.description}</p><p className="text-xs text-ink-mute">{formatDateTime(p.createdAt)} · {p.provider}</p></div><div className="text-right"><p className="font-bold">{formatCurrency(p.amountCents)}</p><Badge size="sm" tone={p.status === "succeeded" ? "success" : p.status === "failed" ? "danger" : "neutral"}>{p.status}</Badge></div></li>)}
            </ul>
          )}
        </>
      )}

      <Modal open={cancel} onClose={() => setCancel(false)} title="Cancel your subscription?" description="You'll keep your benefits until the end of the billing period. (Prototype — nothing is actually billed.)"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setCancel(false)}>Keep my plan</Button><Button variant="danger" onClick={async () => { await paymentService.cancelSubscription(me.user.id); setCancel(false); toast.success("Subscription canceled"); }}>Cancel subscription</Button></div>}>
        <p className="text-sm text-ink-soft">Before you go: you can also pause with a day pass ($9.99) whenever you need a little time.</p>
      </Modal>
    </Page>
  );
}
