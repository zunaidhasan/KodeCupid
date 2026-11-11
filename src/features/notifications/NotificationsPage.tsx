import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, Bell, BellOff, CalendarHeart, CreditCard, Heart, MessageCircle, Settings, ShieldCheck, Sparkles } from "lucide-react";
import type { Notification, NotificationType } from "@/types";
import { cn } from "@/lib/cn";
import { formatClock, timeAgo } from "@/lib/format";
import { isQuietNow, notificationService } from "@/services/notificationService";
import { useApp, useMe } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useDocumentTitle, useSimulatedLoading } from "@/hooks";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { SkeletonList } from "@/components/ui/SkeletonLoader";
import { Page, PageHeader } from "@/components/PageHeader";

const ICONS: Record<NotificationType, { icon: typeof Bell; bg: string }> = {
  match: { icon: Heart, bg: "bg-coral-100 text-coral-600" },
  message: { icon: MessageCircle, bg: "bg-brand-100 text-brand-700" },
  like: { icon: Sparkles, bg: "bg-amber-100 text-amber-700" },
  date: { icon: CalendarHeart, bg: "bg-emerald-100 text-emerald-700" },
  verification: { icon: BadgeCheck, bg: "bg-brand-100 text-brand-700" },
  billing: { icon: CreditCard, bg: "bg-cream-200 text-ink-soft" },
  safety: { icon: ShieldCheck, bg: "bg-blue-100 text-blue-700" },
};
const TYPE_OPTIONS = (Object.keys(ICONS) as NotificationType[]).map((t) => ({ value: t, label: { match: "New match", message: "New message", like: "New like", date: "Micro-date invitation", verification: "Verification update", billing: "Payment reminder", safety: "Safety / moderation update" }[t] }));

export function NotificationsPage() {
  useDocumentTitle("Alerts");
  const me = useMe();
  const { db } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const loading = useSimulatedLoading(450);
  const [simType, setSimType] = useState<NotificationType>("match");
  const q = me.profile.notificationPrefs.quietHours;
  const quiet = isQuietNow(me.user.id);
  const items = db.notifications.filter((n) => n.userId === me.user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const held = items.filter((n) => n.held);
  const visible = items.filter((n) => !n.held);
  const open = async (n: Notification) => { await notificationService.markRead(n.id); if (n.link) navigate(n.link.startsWith("/app") || n.link.startsWith("/") ? n.link : "/app"); };

  return (
    <Page>
      <PageHeader title="Alerts" subtitle="Matches, messages, dates and account updates." action={<div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => notificationService.markAllRead(me.user.id)}>Mark all read</Button><Link to="/app/settings/notifications" aria-label="Notification settings" className="rounded-full p-2.5 text-ink-soft hover:bg-cream-100"><Settings className="h-5 w-5" /></Link></div>} />

      {quiet && (
        <div role="status" className="mb-5 flex items-start gap-3 rounded-3xl border border-brand-200 bg-brand-50 p-4">
          <BellOff className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
          <div className="flex-1 text-sm text-brand-900"><p className="font-bold">Notifications paused during quiet hours</p><p>Quiet until {formatClock(q.end)}. {held.length > 0 ? `${held.length} held — they'll arrive when your quiet hours end.` : "New alerts will be held and delivered afterwards."}</p></div>
          {held.length > 0 && <Button size="sm" variant="secondary" onClick={async () => { const n = await notificationService.releaseHeld(me.user.id); toast.success(`Delivered ${n} held`, "Demo: quiet hours ended."); }}>Deliver now (demo)</Button>}
        </div>
      )}

      {loading ? <SkeletonList rows={5} /> : items.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications yet" description="When something happens — a match, a message, a date invitation — you'll see it here." />
      ) : (
        <ul className="space-y-2.5">
          {held.map((n) => (
            <li key={n.id} className="flex items-center gap-3 rounded-3xl border border-dashed border-brand-200 bg-white/60 p-4"><BellOff className="h-5 w-5 text-brand-600" aria-hidden /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{n.title}</p><p className="text-xs text-ink-mute">Held until {formatClock(q.end)} · quiet hours</p></div><Badge tone="brand" size="sm">Held</Badge></li>
          ))}
          {visible.map((n) => {
            const { icon: I, bg } = ICONS[n.type];
            return (
              <li key={n.id}>
                <button onClick={() => open(n)} className={cn("flex w-full items-start gap-3 rounded-3xl border bg-white p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card", n.read ? "border-cream-200" : "border-coral-200")}>
                  <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", bg)}><I className="h-5 w-5" aria-hidden /></span>
                  <span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className={cn("text-sm", n.read ? "font-medium" : "font-bold")}>{n.title}</span><span className="shrink-0 text-xs text-ink-mute">{timeAgo(n.createdAt)}</span></span><span className="mt-0.5 block text-sm text-ink-soft">{n.body}</span></span>
                  {!n.read && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-coral-500" aria-label="Unread" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Card tone="cream" className="mt-8 space-y-3">
        <h2 className="font-display text-base font-semibold">Developer tools · mock push</h2>
        <p className="text-sm text-ink-soft">Trigger a fake incoming notification. It appears as an in-app banner — or is held if you're in quiet hours.</p>
        <div className="flex items-end gap-2"><Select wrapperClassName="flex-1" label="Event type" value={simType} onChange={(v) => setSimType(v as NotificationType)} options={TYPE_OPTIONS} /><Button onClick={() => notificationService.simulate(me.user.id, simType)}>Send</Button></div>
      </Card>
    </Page>
  );
}
