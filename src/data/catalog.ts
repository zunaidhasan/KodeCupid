import type { PlanId } from "@/types";

export interface CatalogItem {
  id: string;
  kind: "plan" | "pass" | "coins" | "gift";
  name: string;
  priceCents: number;
  cadence?: string;
  blurb: string;
  features?: string[];
  coins?: number;
  emoji?: string;
  highlight?: boolean;
  comingSoon?: boolean;
}

export const PLANS: (CatalogItem & { planId: PlanId })[] = [
  {
    id: "free", planId: "free", kind: "plan", name: "Free", priceCents: 0, cadence: "forever",
    blurb: "Create a profile and get a taste of KodeCupid.",
    features: ["Create and verify your profile", "Up to 1 match per week", "Weekly curated pick", "Cannot search member profiles"],
  },
  {
    id: "silver", planId: "silver", kind: "plan", name: "Silver", priceCents: 3999, cadence: "/month",
    blurb: "Everything you need to meet someone great.",
    features: ["Matching and discovery", "Search and filter members", "Communication tools", "Real-time chat and micro-dates"],
  },
  {
    id: "premium", planId: "premium", kind: "plan", name: "Premium", priceCents: 4999, cadence: "/month", highlight: true,
    blurb: "Full service — all features, no limits.",
    features: ["Everything in Silver", "Super Likes and profile boosts", "Video chat (when launched)", "Advanced schedule filters", "Priority verification and support"],
  },
];

export const PASSES: CatalogItem[] = [
  { id: "daily", kind: "pass", name: "Daily access", priceCents: 999, cadence: "one day", blurb: "Full Silver access for 24 hours.", emoji: "☀️" },
  { id: "prime_hourly", kind: "pass", name: "Prime-time hourly access", priceCents: 699, cadence: "one hour", blurb: "One hour of access during evening prime time.", emoji: "⏱️" },
];

export const COIN_PACKS: CatalogItem[] = [
  { id: "coins_100", kind: "coins", name: "100 coins", coins: 100, priceCents: 499, blurb: "Starter pack", emoji: "🪙" },
  { id: "coins_500", kind: "coins", name: "500 coins", coins: 500, priceCents: 1999, blurb: "Most popular", emoji: "💰", highlight: true },
  { id: "coins_1200", kind: "coins", name: "1,200 coins", coins: 1200, priceCents: 3999, blurb: "Best value", emoji: "🏆" },
];

export const GIFTS: CatalogItem[] = [
  { id: "gift_coffee", kind: "gift", name: "Break-room coffee", priceCents: 399, blurb: "A virtual latte for their next shift", emoji: "☕", comingSoon: true },
  { id: "gift_rose", kind: "gift", name: "Digital rose", priceCents: 499, blurb: "A classic, with a little pulse line", emoji: "🌹", comingSoon: true },
  { id: "gift_apple", kind: "gift", name: "Teacher's apple", priceCents: 299, blurb: "For the educators in your life", emoji: "🍎", comingSoon: true },
  { id: "gift_flask", kind: "gift", name: "Lab-flask toast", priceCents: 399, blurb: "Cheers to a good experiment", emoji: "🧪", comingSoon: true },
];

export const ALL_ITEMS: CatalogItem[] = [...PLANS, ...PASSES, ...COIN_PACKS, ...GIFTS];
export const itemById = (id: string) => ALL_ITEMS.find((i) => i.id === id);

export const CONSULT_PRICE_CENTS = 4500;
export const PREMATCH_PRICE_CENTS = 299;
export const EXTEND_MATCH_COINS = 50;
export const SUPER_LIKE_COINS = 30;
