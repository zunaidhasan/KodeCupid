import { useNavigate } from "react-router-dom";
import { CoinPackCards, GiftCards, PassCards } from "./PricingSections";
import { PlanCards } from "./PlanCards";
import { useApp } from "@/context/AppContext";
import { useDocumentTitle } from "@/hooks";
import type { PlanId } from "@/types";

/** Public pricing page. Guests are routed to sign-up; members go straight to the mock checkout. */
export function PricingPage() {
  useDocumentTitle("Pricing");
  const navigate = useNavigate();
  const { isMember, me } = useApp();
  const go = (item: string) => navigate(isMember ? `/app/checkout?item=${item}` : "/signup");
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-coral-600">Pricing</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Find the plan that fits your shift.</h1>
        <p className="mt-3 text-ink-soft">Prototype — no real charge. All prices are for demonstration.</p>
      </div>
      <div className="mt-12"><PlanCards current={me?.user.plan} onSelect={(id: PlanId) => (id === "free" ? navigate(isMember ? "/app" : "/signup") : go(id))} /></div>
      <h2 className="mt-16 font-display text-2xl font-semibold">Just need a little time?</h2>
      <p className="mb-4 mt-1 text-sm text-ink-soft">Pay-as-you-go access for busy schedules.</p>
      <PassCards onBuy={go} cta={isMember ? "Buy (mock)" : "Get started"} />
      <h2 className="mt-12 font-display text-2xl font-semibold">Coins</h2>
      <p className="mb-4 mt-1 text-sm text-ink-soft">Use coins for Super Likes and extending matches. Mock purchase flow.</p>
      <CoinPackCards onBuy={go} cta={isMember ? "Buy (mock)" : "Get started"} />
      <h2 className="mt-12 font-display text-2xl font-semibold">Gifts <span className="ml-2 rounded-full bg-cream-200 px-2.5 py-1 align-middle text-xs font-semibold text-ink-soft">Coming soon</span></h2>
      <p className="mb-4 mt-1 text-sm text-ink-soft">Small gestures for a match. You can buy them now in the prototype; sending arrives later.</p>
      <GiftCards onBuy={go} cta={isMember ? "Buy (mock)" : "Get started"} />
    </div>
  );
}
