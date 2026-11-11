import { Check, Crown } from "lucide-react";
import type { PlanId } from "@/types";
import { PLANS } from "@/data/catalog";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function PlanCards({ current, onSelect, ctaLabel, disableCurrent = true }: { current?: PlanId; onSelect: (id: PlanId) => void; ctaLabel?: (id: PlanId) => string; disableCurrent?: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PLANS.map((p) => {
        const isCurrent = current === p.planId;
        return (
          <article key={p.id} className={cn("relative flex flex-col rounded-3xl border bg-white p-6 shadow-soft", p.highlight ? "border-coral-300 ring-2 ring-coral-200" : "border-cream-200")}>
            {p.highlight && <Badge tone="coral" className="absolute -top-3 left-6" icon={<Crown className="h-3 w-3" aria-hidden />}>Full service</Badge>}
            <h3 className="font-display text-xl font-semibold">{p.name}</h3>
            <p className="mt-1 text-sm text-ink-soft">{p.blurb}</p>
            <p className="mt-4 flex items-baseline gap-1"><span className="font-display text-4xl font-semibold text-ink">{p.priceCents === 0 ? "$0" : formatCurrency(p.priceCents)}</span><span className="text-sm text-ink-mute">{p.cadence}</span></p>
            <ul className="mt-5 flex-1 space-y-2.5">
              {p.features!.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink-soft"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />{f}</li>
              ))}
            </ul>
            <Button className="mt-6" full variant={p.highlight ? "accent" : p.planId === "free" ? "secondary" : "primary"} disabled={disableCurrent && isCurrent} onClick={() => onSelect(p.planId)}>
              {isCurrent ? "Current plan" : ctaLabel?.(p.planId) ?? (p.planId === "free" ? "Start free" : `Choose ${p.name}`)}
            </Button>
          </article>
        );
      })}
    </div>
  );
}
