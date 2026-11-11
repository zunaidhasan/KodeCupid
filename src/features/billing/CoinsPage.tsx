import { useNavigate } from "react-router-dom";
import { Coins } from "lucide-react";
import { EXTEND_MATCH_COINS, SUPER_LIKE_COINS } from "@/data/catalog";
import { formatCurrency, formatDate } from "@/lib/format";
import { useApp, useMe } from "@/context/AppContext";
import { useDocumentTitle } from "@/hooks";
import { Page, PageHeader } from "@/components/PageHeader";
import { Card, SectionHeading } from "@/components/ui/Card";
import { CoinPackCards, GiftCards } from "./PricingSections";

export function CoinsPage() {
  useDocumentTitle("Coins & gifts");
  const me = useMe();
  const { db, wallet } = useApp();
  const navigate = useNavigate();
  const buy = (id: string) => navigate(`/app/checkout?item=${id}`);
  const history = db.coinPurchases.filter((c) => c.userId === me.user.id);
  return (
    <Page wide>
      <PageHeader title="Coins & gifts" subtitle="Mock purchase flow — no real charge." back="/app/me" />
      <Card className="mb-8 flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600"><Coins className="h-7 w-7" aria-hidden /></span><div><p className="text-xs font-bold uppercase tracking-widest text-ink-mute">Your balance</p><p className="font-display text-3xl font-semibold">{wallet.coins} coins</p></div>
        <ul className="ml-auto hidden gap-4 text-sm text-ink-soft sm:flex"><li>⭐ Super Like · {SUPER_LIKE_COINS}</li><li>⏳ Extend a match · {EXTEND_MATCH_COINS}</li></ul></Card>
      <SectionHeading title="Coin packs" description="Use coins for Super Likes and match extensions." />
      <CoinPackCards onBuy={buy} />
      <SectionHeading className="mt-10" title="Gifts" description="Sending gifts is coming soon — you can stock up in the prototype." />
      <GiftCards onBuy={buy} />
      {history.length > 0 && <><SectionHeading className="mt-10" title="Purchases" /><ul className="divide-y divide-cream-100 rounded-3xl border border-cream-200 bg-white">{history.map((h) => <li key={h.id} className="flex justify-between p-4 text-sm"><span className="font-semibold">{h.item}</span><span className="text-ink-mute">{formatDate(h.createdAt)} · {formatCurrency(h.amountCents)}</span></li>)}</ul></>}
    </Page>
  );
}
