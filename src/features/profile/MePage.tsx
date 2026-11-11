import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, Bell, CalendarClock, ChevronRight, Coins, CreditCard, Download, EyeOff, Headset, HeartHandshake, LifeBuoy, LogOut, RotateCcw, ShieldCheck, Trash2, UserPen, type LucideIcon } from "lucide-react";
import { profileCompletion } from "@/lib/draft";
import { authService } from "@/services/authService";
import { useApp, useMe } from "@/context/AppContext";
import { useDocumentTitle, useInstallPrompt } from "@/hooks";
import { Page } from "@/components/PageHeader";
import { VerificationBadge } from "@/components/Badges";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Row { to: string; icon: LucideIcon; label: string; sub: string; badge?: string }

export function MePage() {
  useDocumentTitle("My profile");
  const me = useMe();
  const { entitlements: ent, wallet } = useApp();
  const navigate = useNavigate();
  const { canInstall, install } = useInstallPrompt();
  const comp = profileCompletion(me);
  const groups: { title: string; rows: Row[] }[] = [
    { title: "Profile", rows: [
      { to: "/app/me/edit", icon: UserPen, label: "Edit profile", sub: "Photos, bio, details and preferences" },
      { to: "/app/me/verify", icon: BadgeCheck, label: "Verification", sub: "NPI lookup or credential upload", badge: me.verification.status.replace("_", " ") },
    ] },
    { title: "Matching & privacy", rows: [
      { to: "/app/schedule", icon: CalendarClock, label: "Schedule compatibility", sub: "Work pattern and shift hours" },
      { to: "/app/privacy", icon: EyeOff, label: "Privacy & workplace", sub: me.profile.workplacePrivacy.enabled ? `Hiding within ${me.profile.workplacePrivacy.radiusMiles} mi of work` : "Workplace privacy is off" },
      { to: "/app/settings/notifications", icon: Bell, label: "Notifications & quiet hours", sub: me.profile.notificationPrefs.quietHours.enabled ? `Quiet ${me.profile.notificationPrefs.quietHours.start}–${me.profile.notificationPrefs.quietHours.end}` : "Quiet hours off" },
    ] },
    { title: "Account", rows: [
      { to: "/app/subscription", icon: CreditCard, label: "Subscription & billing", sub: ent.planLabel },
      { to: "/app/coins", icon: Coins, label: "Coins & gifts", sub: `${wallet.coins} coins` },
      { to: "/app/consult", icon: Headset, label: "Curbside Consult", sub: "Feedback on a potential match · $45" },
    ] },
    { title: "Safety", rows: [
      { to: "/app/safety", icon: ShieldCheck, label: "Safety Center", sub: "Blocked members, filters, reports" },
      { to: "/safety-tips", icon: LifeBuoy, label: "Safety tips", sub: "Meeting people safely" },
      { to: "/community-pledge", icon: HeartHandshake, label: "Community Pledge", sub: "How we treat each other" },
    ] },
  ];

  return (
    <Page>
      <Card className="mb-6 text-center sm:text-left">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Avatar src={me.profile.photos[0]?.url} name={me.profile.displayName} size="xl" verified={me.verification.status === "verified"} ring />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-semibold">{me.profile.displayName}</h1>
            <p className="text-ink-soft">{me.professional.jobTitle || "Add your profession"}{me.professional.workplaceName ? ` · ${me.professional.workplaceName}` : ""}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start"><VerificationBadge status={me.verification.status} /><Badge tone={ent.tier === "free" ? "neutral" : "gold"}>{ent.planLabel}</Badge></div>
          </div>
          <Link to={`/app/profile/${me.user.id}`} className={buttonStyles({ variant: "secondary", size: "sm" })}>Preview</Link>
        </div>
        <div className="mt-5 rounded-2xl bg-cream-100 p-4 text-left">
          <div className="flex items-center justify-between text-sm"><strong>Profile strength</strong><span className="font-bold text-brand-700">{comp.percent}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuenow={comp.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion"><div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-coral-500" style={{ width: `${comp.percent}%` }} /></div>
          {comp.todo.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{comp.todo.slice(0, 4).map((t) => <li key={t.id}><Link to={t.to} className="inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm hover:bg-brand-50">+ {t.label}</Link></li>)}</ul>}
        </div>
      </Card>

      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.title} aria-labelledby={`g-${g.title}`}>
            <h2 id={`g-${g.title}`} className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-ink-mute">{g.title}</h2>
            <ul className="divide-y divide-cream-100 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-soft">
              {g.rows.map(({ to, icon: I, label, sub, badge }) => (
                <li key={to + label}><Link to={to} className="flex items-center gap-4 p-4 transition-colors hover:bg-cream/70"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><I className="h-5 w-5" aria-hidden /></span><span className="min-w-0 flex-1"><span className="block font-semibold">{label}</span><span className="block truncate text-sm text-ink-mute">{sub}</span></span>{badge && <Badge tone={badge === "verified" ? "success" : "warning"} size="sm" className="capitalize">{badge}</Badge>}<ChevronRight className="h-5 w-5 text-ink-mute" aria-hidden /></Link></li>
              ))}
            </ul>
          </section>
        ))}

        <section className="space-y-2">
          {canInstall && <Button full variant="secondary" leftIcon={<Download className="h-4 w-4" />} onClick={install}>Install KodeCupid on this device</Button>}
          <Button full variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => { if (confirm("Reset all prototype data and start over?")) { authService.resetPrototype(); navigate("/"); } }}>Reset prototype data</Button>
          <Button full variant="ghost" leftIcon={<LogOut className="h-4 w-4" />} onClick={() => { authService.signOut(); navigate("/"); }}>Sign out</Button>
          <Link to="/account-closure" className={buttonStyles({ variant: "ghost", full: true })}><Trash2 className="h-4 w-4" aria-hidden />Account closure / data deletion</Link>
        </section>
      </div>
    </Page>
  );
}
