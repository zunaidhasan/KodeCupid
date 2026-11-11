import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/** Friendly upsell shown when a free-tier limit is reached. */
export function UpgradePrompt({ title, description, compact, className, cta = "See plans" }: { title: string; description: string; compact?: boolean; className?: string; cta?: string }) {
  return (
    <div role="region" aria-label="Upgrade prompt" className={cn("rounded-3xl border border-coral-200 bg-gradient-to-br from-coral-50 to-white p-5", compact ? "" : "text-center sm:p-8", className)}>
      <div className={cn("flex gap-4", compact ? "items-start" : "flex-col items-center")}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-coral-100 text-coral-600"><Lock className="h-5 w-5" aria-hidden /></span>
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{description}</p>
          <div className={cn("mt-4 flex flex-wrap gap-2", !compact && "justify-center")}>
            <Link to="/app/subscription" className={buttonStyles({ variant: "accent" })}><Sparkles className="h-4 w-4" aria-hidden />{cta}</Link>
            <Link to="/app/subscription#passes" className={buttonStyles({ variant: "secondary" })}>Try a day pass · $9.99</Link>
          </div>
          <p className="mt-3 text-[11px] text-ink-mute">Prototype — no real charge.</p>
        </div>
      </div>
    </div>
  );
}
