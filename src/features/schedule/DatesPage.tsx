import { useState } from "react";
import { CalendarHeart, Check, MapPin, Plus, X } from "lucide-react";
import type { MicroDate } from "@/types";
import { formatDate, formatDateTime } from "@/lib/format";
import { dateService } from "@/services/dateService";
import { effectiveDateStatus, getMember, matchBetween } from "@/services/selectors";
import { useApp, useMe } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useDocumentTitle, useSimulatedLoading } from "@/hooks";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { SkeletonList } from "@/components/ui/SkeletonLoader";
import { SegmentedTabs } from "@/components/ui/Tabs";
import { Page, PageHeader } from "@/components/PageHeader";
import { MicroDateScheduler } from "./MicroDateScheduler";

const STATUS: Record<MicroDate["status"], { label: string; tone: BadgeTone }> = {
  pending: { label: "Pending", tone: "warning" },
  accepted: { label: "Accepted", tone: "success" },
  declined: { label: "Declined", tone: "danger" },
  expired: { label: "Expired", tone: "neutral" },
};

export function DatesPage() {
  useDocumentTitle("Micro-dates");
  const me = useMe();
  const { db } = useApp();
  const toast = useToast();
  const loading = useSimulatedLoading(450);
  const [tab, setTab] = useState<"upcoming" | "invites" | "past">("upcoming");
  const [pick, setPick] = useState(false);
  const [pickId, setPickId] = useState("");
  const [planFor, setPlanFor] = useState<string | null>(null);

  const mine = db.microDates.filter((d) => d.fromId === me.user.id || d.toId === me.user.id)
    .map((d) => ({ d, status: effectiveDateStatus(d) }))
    .sort((a, b) => b.d.date.localeCompare(a.d.date));
  const groups = {
    upcoming: mine.filter((x) => x.status === "accepted"),
    invites: mine.filter((x) => x.status === "pending"),
    past: mine.filter((x) => x.status === "declined" || x.status === "expired"),
  };
  const activeMatches = db.matches.filter((m) => m.status === "active" && m.userIds.includes(me.user.id));
  const partnerOf = (d: MicroDate) => getMember(db, d.fromId === me.user.id ? d.toId : d.fromId)!;
  const planOther = planFor ? getMember(db, planFor) : undefined;
  const planMatch = planFor ? matchBetween(db, me.user.id, planFor) : undefined;

  const respond = async (id: string, s: "accepted" | "declined") => { await dateService.respond(id, s); toast.success(s === "accepted" ? "Micro-date accepted 🎉" : "Invitation declined"); };

  return (
    <Page>
      <PageHeader title="Micro-dates" subtitle="Short, public meetups scheduled around your shifts."
        action={<Button variant="accent" leftIcon={<Plus className="h-4 w-4" />} onClick={() => { setPickId(activeMatches[0] ? activeMatches[0].userIds.find((u) => u !== me.user.id)! : ""); setPick(true); }}>Plan</Button>} />
      <SegmentedTabs label="Micro-date filter" value={tab} onChange={setTab} className="mb-5" items={[{ id: "upcoming", label: "Upcoming", count: groups.upcoming.length }, { id: "invites", label: "Invitations", count: groups.invites.length }, { id: "past", label: "Past" }]} />

      {loading ? <SkeletonList rows={3} /> : groups[tab].length === 0 ? (
        <EmptyState icon={<CalendarHeart className="h-8 w-8" />} title={tab === "upcoming" ? "No upcoming micro-dates" : tab === "invites" ? "No pending invitations" : "Nothing here yet"} description="Plan a coffee between shifts with one of your matches. We'll show you the times you're both free." action={<Button variant="accent" onClick={() => { setPickId(activeMatches[0]?.userIds.find((u) => u !== me.user.id) ?? ""); setPick(true); }}>Plan a micro-date</Button>} />
      ) : (
        <ul className="space-y-3">
          {groups[tab].map(({ d, status }) => {
            const partner = partnerOf(d);
            const incoming = d.toId === me.user.id;
            return (
              <li key={d.id} className="rounded-3xl border border-cream-200 bg-white p-4 shadow-soft">
                <div className="flex items-start gap-3">
                  <Avatar src={partner.profile.photos[0]?.url} name={partner.profile.displayName} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2"><p className="truncate font-semibold">{partner.profile.displayName}</p><Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge></div>
                    <p className="text-sm font-semibold text-brand-800">{formatDate(d.date, { weekday: "long", month: "short", day: "numeric" })} · {d.startLabel}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-soft"><MapPin className="h-3.5 w-3.5 text-coral-500" aria-hidden />{d.venueName}</p>
                    {d.note && <p className="mt-2 rounded-2xl bg-cream p-2.5 text-sm italic text-ink-soft">“{d.note}”</p>}
                    <p className="mt-1.5 text-[11px] text-ink-mute">{incoming ? "Invited you" : "You invited"} · {formatDateTime(d.createdAt)}</p>
                  </div>
                </div>
                {status === "pending" && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-cream-100 pt-3">
                    {incoming ? <><Button size="sm" leftIcon={<Check className="h-4 w-4" />} onClick={() => respond(d.id, "accepted")}>Accept</Button><Button size="sm" variant="danger" leftIcon={<X className="h-4 w-4" />} onClick={() => respond(d.id, "declined")}>Decline</Button></>
                      : <><span className="self-center text-xs text-ink-mute">Waiting for {partner.profile.displayName.split(" ")[0]} to reply…</span><Button size="sm" variant="ghost" className="ml-auto" onClick={() => dateService.cancel(d.id)}>Cancel invitation</Button></>}
                  </div>
                )}
                {status === "expired" && <p className="mt-3 border-t border-cream-100 pt-3 text-xs text-ink-mute">This invitation expired because the date passed without a response.</p>}
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={pick} onClose={() => setPick(false)} title="Who would you like to meet?" size="sm"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setPick(false)}>Cancel</Button><Button disabled={!pickId} onClick={() => { setPick(false); setPlanFor(pickId); }}>Choose a time</Button></div>}>
        {activeMatches.length === 0 ? <p className="text-sm text-ink-soft">You need an active match first — micro-dates are for people you've matched with.</p> : (
          <Select label="Match" value={pickId} onChange={setPickId} options={activeMatches.map((m) => { const o = getMember(db, m.userIds.find((u) => u !== me.user.id))!; return { value: o.user.id, label: o.profile.displayName }; })} />
        )}
      </Modal>
      {planOther && planMatch && <MicroDateScheduler open onClose={() => setPlanFor(null)} me={me} other={planOther} matchId={planMatch.id} />}
    </Page>
  );
}
