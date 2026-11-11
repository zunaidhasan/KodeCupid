import { Link, useNavigate } from "react-router-dom";
import { Clock, Lock } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/SkeletonLoader";
import { Page, PageHeader } from "@/components/PageHeader";
import { useApp, useMe } from "@/context/AppContext";
import { useDocumentTitle, useSimulatedLoading } from "@/hooks";
import { timeAgo } from "@/lib/format";
import { conversationsFor } from "@/services/selectors";
import { cn } from "@/lib/cn";
import { UpgradePrompt } from "@/features/billing/UpgradePrompt";

export function MatchesPage() {
  useDocumentTitle("Matches");
  const me = useMe();
  const { db, entitlements } = useApp();
  const navigate = useNavigate();
  const loading = useSimulatedLoading(500);
  const convs = conversationsFor(db, me.user.id);
  const newMatches = convs.filter((c) => !c.conv.preMatch && !c.last && c.state.kind !== "expired");

  return (
    <Page>
      <PageHeader title="Matches" subtitle="Chat opens once you both like each other." />
      {!entitlements.canChat && <UpgradePrompt compact className="mb-5" title="Chat is a Silver feature" description="You can see your match, but real-time chat starts with Silver or Premium." />}
      {loading ? <SkeletonList rows={4} /> : convs.length === 0 ? (
        <EmptyState icon="💌" title="No matches yet" description="When you and someone else both like each other, you'll see them here. Keep exploring — great connections take a little time." action={<Link to="/app" className={buttonStyles({ variant: "accent" })}>Discover people</Link>} />
      ) : (
        <>
          {newMatches.length > 0 && (
            <section aria-labelledby="new-matches" className="mb-6">
              <h2 id="new-matches" className="mb-3 font-display text-lg font-semibold">New matches</h2>
              <ul className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {newMatches.map(({ conv, other, state }) => (
                  <li key={conv.id} className="shrink-0">
                    <button onClick={() => navigate(`/app/chat/${conv.id}`)} className="flex w-20 flex-col items-center gap-1.5 text-center">
                      <Avatar src={other.profile.photos[0]?.url} name={other.profile.displayName} size="lg" ring verified={other.verification.status === "verified"} />
                      <span className="w-full truncate text-xs font-semibold">{other.profile.displayName.replace(/^Dr\.\s*/, "").split(" ")[0]}</span>
                      {state.kind === "expiring" && <span className="text-[10px] font-semibold text-coral-600">{state.label} left</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section aria-labelledby="msgs">
            <h2 id="msgs" className="mb-3 font-display text-lg font-semibold">Messages</h2>
            <ul className="space-y-2.5">
              {convs.map(({ conv, other, last, unread, state }) => (
                <li key={conv.id}>
                  <Link to={`/app/chat/${conv.id}`} className={cn("flex items-center gap-3 rounded-3xl border bg-white p-3.5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card", unread ? "border-coral-200" : "border-cream-200", state.kind === "expired" && "opacity-70")}>
                    <Avatar src={other.profile.photos[0]?.url} name={other.profile.displayName} size="lg" verified={other.verification.status === "verified"} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2"><span className={cn("truncate font-semibold", unread && "text-ink")}>{other.profile.displayName}</span><span className="shrink-0 text-xs text-ink-mute">{last ? timeAgo(last.createdAt) : "New"}</span></span>
                      <span className={cn("block truncate text-sm", unread ? "font-semibold text-ink" : "text-ink-soft")}>{last ? (last.removedByModerator ? "Message removed by moderator" : last.body || "📷 Photo") : "Say hello 👋"}</span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {state.kind === "expiring" && <Badge tone="coral" size="sm" icon={<Clock className="h-3 w-3" aria-hidden />}>Expires in {state.label}</Badge>}
                        {state.kind === "expired" && <Badge tone="neutral" size="sm">Expired</Badge>}
                        {state.kind === "prematch" && <Badge tone="gold" size="sm" icon={<Lock className="h-3 w-3" aria-hidden />}>Pre-match message</Badge>}
                        {unread > 0 && <Badge tone="coral" size="sm">{unread} new</Badge>}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </Page>
  );
}
