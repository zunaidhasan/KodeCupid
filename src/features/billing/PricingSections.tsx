import { COIN_PACKS, GIFTS, PASSES, type CatalogItem } from "@/data/catalog";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

function ItemCard({ item, onBuy, cta = "Buy (mock)" }: { item: CatalogItem; onBuy: (id: string) => void; cta?: string }) {
  return (
    <article className={cn("flex flex-col rounded-3xl border bg-white p-5 shadow-soft", item.highlight ? "border-coral-300 ring-2 ring-coral-100" : "border-cream-200")}>
      <div className="flex items-start justify-between">
        <span className="text-3xl" aria-hidden>{item.emoji}</span>
        {item.comingSoon ? <Badge tone="neutral" size="sm">Sending coming soon</Badge> : item.highlight ? <Badge tone="coral" size="sm">Popular</Badge> : null}
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold">{item.name}</h3>
      <p className="text-sm text-ink-soft">{item.blurb}</p>
      <p className="mt-3 text-2xl font-bold text-ink">{formatCurrency(item.priceCents)}<span className="ml-1 text-xs font-medium text-ink-mute">{item.cadence}</span></p>
      <Button className="mt-4" variant="secondary" size="sm" onClick={() => onBuy(item.id)}>{cta}</Button>
    </article>
  );
}

export const PassCards = ({ onBuy, cta }: { onBuy: (id: string) => void; cta?: string }) => (
  <div className="grid gap-4 sm:grid-cols-2">{PASSES.map((p) => <ItemCard key={p.id} item={p} onBuy={onBuy} cta={cta} />)}</div>
);
export const CoinPackCards = ({ onBuy, cta }: { onBuy: (id: string) => void; cta?: string }) => (
  <div className="grid gap-4 sm:grid-cols-3">{COIN_PACKS.map((p) => <ItemCard key={p.id} item={p} onBuy={onBuy} cta={cta} />)}</div>
);
export const GiftCards = ({ onBuy, cta }: { onBuy: (id: string) => void; cta?: string }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{GIFTS.map((p) => <ItemCard key={p.id} item={p} onBuy={onBuy} cta={cta} />)}</div>
);
