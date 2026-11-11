import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, EyeOff, Heart, Lock, SlidersHorizontal, Sparkles, Star, X, Zap } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ProfileCard, SwipeableCard, type SwipeDir } from "@/components/ProfileCard";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonProfileCard } from "@/components/ui/SkeletonLoader";
import { useApp, useMe } from "@/context/AppContext";
import { useDocumentTitle, useLocalStorage, useSimulatedLoading } from "@/hooks";
import { profileCompletion } from "@/lib/draft";
import { activeFilterCount, DEFAULT_FILTERS, discoveryCandidates, matchesThisWeek, type DiscoveryFilters } from "@/services/selectors";
import { paymentService } from "@/services/paymentService";
import { sleep } from "@/services/db";
import { UpgradePrompt } from "@/features/billing/UpgradePrompt";
import { FilterDrawer } from "./FilterDrawer";
import { useDecision } from "./useDecision";

const WEEK = 7 * 86400000;

export function DiscoverPage() {
  useDocumentTitle("Discover");
  const me = useMe();
  const navigate = useNavigate();
  const { db, entitlements: ent, unreadCount, wallet } = useApp();
  const loading = useSimulatedLoading(650);
  const [filters, setFilters] = useLocalStorage<DiscoveryFilters>("kodecupid.filters", DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [leaving, setLeaving] = useState<"like" | "pass" | "super" | null>(null);
  const { decide, busy, dialogs } = useDecision(me);

  const { candidates, hiddenByPrivacy } = useMemo(() => discoveryCandidates(db, me, filters, !ent.canBrowse), [db, me, filters, ent.canBrowse]);
  const picksUsed = db.likes.filter((l) => l.fromId === me.user.id && Date.now() - +new Date(l.createdAt) < WEEK).length + db.passes.filter((p) => p.fromId === me.user.id && Date.now() - +new Date(p.createdAt) < WEEK).length;
  const freeLocked = !ent.canBrowse && (picksUsed >= 1 || matchesThisWeek(db, me.user.id) >= 1);
  const top = freeLocked ? undefined : candidates[0];
  const next = !ent.canBrowse ? undefined : candidates[1];
  const filterCount = activeFilterCount(filters);
  const comp = profileCompletion(me);

  const act = async (kind: "like" | "pass" | "super") => {
    if (!top || leaving || busy) return;
    if (kind === "super" && !ent.canSuperLike) { await decide("super", top.member); return; }
    setLeaving(kind);
    await sleep(280);
    const ok = await decide(kind, top.member);
    setLeaving(null);
    if (!ok) return;
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-8 sm:px-6">
      <header className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-cream/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Link to="/app" className="md:invisible" aria-label="KodeCupid"><Logo /></Link>
        <h1 className="sr-only">Discover</h1>
        <div className="flex items-center gap-1">
          <button onClick={() => setFilterOpen(true)} aria-label={`Filters${filterCount ? `, ${filterCount} active` : ""}`} className="relative rounded-full bg-white p-2.5 text-ink shadow-soft transition-colors hover:bg-brand-50">
            <SlidersHorizontal className="h-5 w-5" />
            {filterCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-coral-500 text-[10px] font-bold text-white">{filterCount}</span>}
          </button>
          <button onClick={() => navigate("/app/notifications")} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} className="relative ml-2 rounded-full bg-white p-2.5 text-ink shadow-soft transition-colors hover:bg-brand-50">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white">{unreadCount}</span>}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-3">
        {ent.tier === "free" && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm">
            <Lock className="h-4 w-4 text-coral-600" aria-hidden />
            <span className="flex-1 font-medium text-ink-soft"><strong className="text-ink">Free plan</strong> · 1 match per week · no member search</span>
            <Link to="/app/subscription" className="font-bold text-coral-700 hover:underline">Upgrade</Link>
            <button onClick={() => paymentService.setPlanDemo(me.user.id, "premium")} className="w-full text-left text-xs font-semibold text-brand-700 underline underline-offset-2 sm:w-auto">Prototype: switch to Premium</button>
          </div>
        )}
        {ent.passActive && <Badge tone="gold" icon={<Zap className="h-3.5 w-3.5" aria-hidden />}>{ent.planLabel} active until {new Date(ent.passExpiresAt!).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</Badge>}
        {hiddenByPrivacy > 0 && me.profile.workplacePrivacy.enabled && (
          <Link to="/app/privacy" className="flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-900 hover:bg-brand-100"><EyeOff className="h-4 w-4" aria-hidden />{hiddenByPrivacy} {hiddenByPrivacy === 1 ? "profile is" : "profiles are"} hidden near your workplace · Manage</Link>
        )}
        {comp.percent < 80 && (
          <Link to={comp.todo[0]?.to ?? "/app/me/edit"} className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-white px-4 py-3 shadow-soft">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-800">{comp.percent}%</span>
            <span className="min-w-0 flex-1 text-sm"><strong className="block">Strengthen your profile</strong><span className="text-ink-soft">Next: {comp.todo[0]?.label.toLowerCase()}</span></span>
          </Link>
        )}
      </div>

      <div className="mx-auto mt-4 max-w-md">
        {loading ? <SkeletonProfileCard /> : freeLocked ? (
          <UpgradePrompt title={matchesThisWeek(db, me.user.id) >= 1 ? "You've reached your weekly match" : "You've used this week's pick"} description="Free members receive one curated pick and up to one match per week, and can't search member profiles. Upgrade to keep discovering." />
        ) : !top ? (
          <EmptyState icon="🌿" title={filterCount ? "No one matches these filters" : "You're all caught up"} description={filterCount ? "Try widening your distance or age range." : "New verified members join every day. Check back soon, or adjust your filters."}
            action={filterCount ? <Button onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</Button> : <Link to="/app/matches" className={buttonStyles({ variant: "secondary" })}>See your matches</Link>} />
        ) : (
          <>
            {!ent.canBrowse && <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-coral-700"><Sparkles className="h-4 w-4" aria-hidden />Your weekly pick — chosen for compatibility</p>}
            <div className="relative">
              {next && <div aria-hidden className="pointer-events-none absolute inset-x-3 top-3 -z-0 h-full scale-[0.96] overflow-hidden rounded-[2rem] opacity-70"><ProfileCard candidate={next} className="h-[60%] overflow-hidden" /></div>}
              <div className="relative z-10">
                <SwipeableCard leaving={leaving} onSwipe={(d: SwipeDir) => act(d)}>
                  <ProfileCard candidate={top} onOpen={() => navigate(`/app/profile/${top.member.user.id}`)} />
                </SwipeableCard>
              </div>
            </div>

            <div className="sticky bottom-3 z-10 mt-5 flex items-center justify-center gap-4 rounded-full bg-white/90 px-5 py-3 shadow-card backdrop-blur" role="group" aria-label="Decision actions">
              <button onClick={() => act("pass")} disabled={!!leaving || busy} aria-label={`Pass on ${top.member.profile.displayName}`} className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-cream-200 bg-white text-ink-soft shadow-soft transition-all hover:scale-105 hover:border-coral-300 hover:text-coral-600 disabled:opacity-50"><X className="h-7 w-7" /></button>
              <button onClick={() => act("super")} disabled={!!leaving || busy} aria-label={ent.canSuperLike ? "Super Like" : "Super Like (Premium)"} title={ent.canSuperLike ? `Super Like · ${wallet.superLikes} left` : "Premium feature"} className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-soft transition-all hover:scale-105 disabled:opacity-50"><Star className="h-6 w-6 fill-white" />{!ent.canSuperLike && <Lock className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-white p-0.5 text-ink" />}</button>
              <button onClick={() => act("like")} disabled={!!leaving || busy} aria-label={`Like ${top.member.profile.displayName}`} className="flex h-16 w-16 items-center justify-center rounded-full bg-coral-500 text-white shadow-card transition-all hover:scale-105 hover:bg-coral-600 disabled:opacity-50"><Heart className="h-8 w-8 fill-white" /></button>
            </div>
            <p className="mt-3 text-center text-[11px] text-ink-mute">Drag the card or use the buttons. Match % is a prototype estimate. {ent.canBrowse && `${candidates.length} ${candidates.length === 1 ? "profile" : "profiles"} left.`}</p>
          </>
        )}
      </div>

      <FilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} me={me} filters={filters} onApply={setFilters} />
      {dialogs}
    </div>
  );
}
