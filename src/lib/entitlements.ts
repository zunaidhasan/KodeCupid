import type { PlanId, User } from "@/types";

export type Tier = "free" | "silver" | "premium";

export interface Entitlements {
  tier: Tier;
  planLabel: string;
  /** Can browse / search member profiles (swipe stack, filters) */
  canBrowse: boolean;
  canChat: boolean;
  canVideo: boolean;
  canSuperLike: boolean;
  canUseScheduleFilter: boolean;
  /** Free members receive at most one match per rolling week */
  weeklyMatchLimit: number | null;
  passActive: boolean;
  passExpiresAt?: string;
}

export const PLAN_LABEL: Record<PlanId, string> = { free: "Free", silver: "Silver", premium: "Premium" };

/**
 * Feature gating. PRODUCTION NOTE: enforce the same rules server-side (RLS / API middleware);
 * client checks are only for UX.
 */
export function getEntitlements(user: Pick<User, "plan" | "pass">, now = Date.now()): Entitlements {
  const passActive = !!user.pass && new Date(user.pass.expiresAt).getTime() > now;
  // A day / hourly pass behaves like Silver for its duration
  const tier: Tier = user.plan === "free" && passActive ? "silver" : user.plan;
  const paid = tier !== "free";
  return {
    tier,
    planLabel: user.plan === "free" && passActive ? (user.pass!.kind === "daily" ? "Day pass" : "Prime-time pass") : PLAN_LABEL[user.plan],
    canBrowse: paid,
    canChat: paid,
    canVideo: tier === "premium",
    canSuperLike: tier === "premium",
    canUseScheduleFilter: paid,
    weeklyMatchLimit: paid ? null : 1,
    passActive,
    passExpiresAt: passActive ? user.pass!.expiresAt : undefined,
  };
}
