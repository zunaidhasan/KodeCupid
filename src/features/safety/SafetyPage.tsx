import { Link } from "react-router-dom";
import { HeartHandshake, LifeBuoy, ShieldCheck, UserX } from "lucide-react";
import { REPORT_LABEL } from "@/data/options";
import { formatDate } from "@/lib/format";
import { memberService } from "@/services/memberService";
import { safetyService } from "@/services/safetyService";
import { getMember } from "@/services/selectors";
import { useApp, useMe } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useDocumentTitle } from "@/hooks";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, SectionHeading } from "@/components/ui/Card";
import { ChipSelect } from "@/components/ui/Choice";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { Page, PageHeader } from "@/components/PageHeader";

export function SafetyPage() {
  useDocumentTitle("Safety Center");
  const me = useMe();
  const { db, settings } = useApp();
  const toast = useToast();
  const blocks = db.blocks.filter((b) => b.userId === me.user.id);
  const reports = db.reports.filter((r) => r.reporterId === me.user.id);
  const save = (patch: Parameters<typeof memberService.updateSettings>[1]) => memberService.updateSettings(me.user.id, patch);

  return (
    <Page>
      <PageHeader title="Safety Center" subtitle="Tools that keep you in control." back="/app/me" />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[{ to: "/safety-tips", icon: ShieldCheck, label: "Safety tips", sub: "Meet-up and privacy advice" }, { to: "/community-pledge", icon: HeartHandshake, label: "Community Pledge", sub: "Our shared promises" }].map(({ to, icon: I, label, sub }) => (
          <Link key={to} to={to} className="rounded-3xl border border-cream-200 bg-white p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"><I className="h-6 w-6 text-brand-600" aria-hidden /><p className="mt-2 font-semibold">{label}</p><p className="text-xs text-ink-mute">{sub}</p></Link>
        ))}
        <a href="https://988lifeline.org/get-help/" target="_blank" rel="noreferrer" className="rounded-3xl border border-coral-200 bg-coral-50 p-4 transition-all hover:-translate-y-0.5 hover:shadow-card"><LifeBuoy className="h-6 w-6 text-coral-600" aria-hidden /><p className="mt-2 font-semibold">Emergency resources</p><p className="text-xs text-ink-soft">Call 911 · call/text 988</p></a>
      </div>

      <div className="space-y-6">
        <Card>
          <SectionHeading title="Content filter preferences" description="Control what you see in messages and photos." />
          <ChipSelect label="Filter level" value={settings.contentFilter} onChange={(v) => v && save({ contentFilter: v })} options={[{ value: "standard", label: "Standard" }, { value: "strict", label: "Strict" }, { value: "off", label: "Off" }]} hint="Strict also hides messages from members with unresolved reports." />
          <div className="mt-3 divide-y divide-cream-100">
            <Toggle label="Blur images in chat until I tap" description="Photos sent by matches start blurred." checked={settings.blurImages} onChange={(blurImages) => save({ blurImages })} />
            <Toggle label="Mask offensive words" description="Replace flagged language with asterisks." checked={settings.filterWords} onChange={(filterWords) => save({ filterWords })} />
          </div>
        </Card>

        <Card>
          <SectionHeading title="Chat settings" />
          <Toggle label="Allow video chat" description="Turn off to hide the video call button and decline all calls." checked={settings.videoEnabled} onChange={(videoEnabled) => save({ videoEnabled })} />
          <Select label="Unmatched conversations expire after" value={String(settings.matchExpiryDays)} onChange={(v) => save({ matchExpiryDays: Number(v) })} options={[3, 5, 7, 14].map((d) => ({ value: String(d), label: `${d} days` }))} hint="Applies to new matches. Once you've both chatted, a match stays open." wrapperClassName="mt-3" />
        </Card>

        <Card>
          <SectionHeading title="Blocked members" description="They can't see or contact you." />
          {blocks.length === 0 ? <EmptyState icon={<UserX className="h-7 w-7" />} title="No blocked members" description="If someone makes you uncomfortable, use Block on their profile or in chat." className="border-0 py-6" /> : (
            <ul className="divide-y divide-cream-100">
              {blocks.map((b) => { const m = getMember(db, b.blockedId); return (
                <li key={b.blockedId} className="flex items-center gap-3 py-3"><Avatar src={m?.profile.photos[0]?.url} name={m?.profile.displayName ?? "Member"} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{m?.profile.displayName ?? "Member"}</p><p className="text-xs text-ink-mute">Blocked {formatDate(b.createdAt)}</p></div><Button size="sm" variant="secondary" onClick={async () => { await safetyService.unblock(me.user.id, b.blockedId); toast.success("Unblocked"); }}>Unblock</Button></li>
              ); })}
            </ul>
          )}
        </Card>

        <Card>
          <SectionHeading title="My reports" description="Reports are reviewed within 24 hours." />
          {reports.length === 0 ? <p className="text-sm text-ink-mute">You haven't submitted any reports. Use Report on a profile or a specific message.</p> : (
            <ul className="space-y-2">{reports.map((r) => <li key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-cream-100 p-3 text-sm"><span><strong>{REPORT_LABEL[r.category]}</strong> · {r.targetType} · {formatDate(r.createdAt)}<br /><span className="text-xs text-ink-mute">Reference #{r.id.slice(-6).toUpperCase()}</span></span><Badge tone={r.status === "resolved" ? "success" : r.status === "in_review" ? "brand" : "warning"}>{r.status === "new" ? "Submitted" : r.status.replace("_", " ")}</Badge></li>)}</ul>
          )}
        </Card>
      </div>
    </Page>
  );
}
