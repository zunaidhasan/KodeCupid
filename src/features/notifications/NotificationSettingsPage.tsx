import { BellOff, BellRing } from "lucide-react";
import { formatClock } from "@/lib/format";
import { isQuietNow } from "@/services/notificationService";
import { memberService } from "@/services/memberService";
import { useApp, useMe } from "@/context/AppContext";
import { useDocumentTitle } from "@/hooks";
import { Page, PageHeader } from "@/components/PageHeader";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { NotificationPrefsEditor } from "./NotificationPrefsEditor";

export function NotificationSettingsPage() {
  useDocumentTitle("Notification settings");
  const me = useMe();
  const { settings } = useApp();
  const q = me.profile.notificationPrefs.quietHours;
  const quiet = isQuietNow(me.user.id);
  return (
    <Page>
      <PageHeader title="Notification settings" subtitle="Shift-aware quiet hours keep your sleep protected." back="/app/notifications" />
      <div className={`mb-5 flex items-start gap-3 rounded-3xl p-4 ${quiet ? "bg-brand-50 text-brand-900" : "bg-emerald-50 text-emerald-900"}`} role="status">
        {quiet ? <BellOff className="mt-0.5 h-5 w-5" aria-hidden /> : <BellRing className="mt-0.5 h-5 w-5" aria-hidden />}
        <p className="text-sm"><strong>{quiet ? "Notifications paused during quiet hours" : "Notifications are active"}</strong>{q.enabled ? ` · quiet ${formatClock(q.start)} – ${formatClock(q.end)}` : " · quiet hours are off"}{settings.simulatedTime ? ` · simulated clock ${formatClock(settings.simulatedTime)}` : ""}</p>
      </div>
      <Card>
        <NotificationPrefsEditor value={me.profile.notificationPrefs} schedule={me.professional.schedule} onChange={(v) => memberService.update(me.user.id, (m) => { m.profile.notificationPrefs = v; })} />
      </Card>
      <Card tone="cream" className="mt-6 space-y-3">
        <SectionHeading title="Developer tool · simulate the clock" description="Pretend it's a different time to see quiet hours in action." />
        <div className="flex flex-wrap items-end gap-3">
          <div><label htmlFor="sim-time" className="mb-1.5 block text-sm font-semibold">Simulated time</label><input id="sim-time" type="time" value={settings.simulatedTime ?? ""} onChange={(e) => memberService.updateSettings(me.user.id, { simulatedTime: e.target.value || null })} className="h-12 rounded-2xl border border-cream-200 bg-white px-4 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100" /></div>
          <Button variant="secondary" onClick={() => memberService.updateSettings(me.user.id, { simulatedTime: q.start })}>Jump into quiet hours</Button>
          <Button variant="ghost" onClick={() => memberService.updateSettings(me.user.id, { simulatedTime: null })}>Use real time</Button>
        </div>
      </Card>
    </Page>
  );
}
