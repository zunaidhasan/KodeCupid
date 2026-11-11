import { useEffect, useRef } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, CalendarHeart, Download, Heart, LogOut, MessageCircle, Sparkles, UserRound } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { TabBar, type TabItem } from "@/components/ui/TabBar";
import { useApp } from "@/context/AppContext";
import { useInstallPrompt } from "@/hooks";
import { cn } from "@/lib/cn";
import { authService } from "@/services/authService";
import { conversationsFor } from "@/services/selectors";

/** Authenticated shell: sidebar on desktop, persistent bottom tab bar on mobile. */
export function MemberLayout() {
  const { session, me, unreadCount, entitlements, db } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);
  const { canInstall, install } = useInstallPrompt();
  useEffect(() => { mainRef.current?.scrollTo({ top: 0 }); }, [pathname]);

  if (!session.userId) return <Navigate to="/signup" replace state={{ from: pathname }} />;
  if (!session.onboardingComplete || !me) return <Navigate to="/onboarding" replace />;
  if (me.user.accountStatus !== "active") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream p-6">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-card">
          <h1 className="font-display text-2xl font-semibold">Your account is {me.user.accountStatus.replace("_", " ")}</h1>
          <p className="mt-2 text-sm text-ink-soft">Please contact support if you think this is a mistake. Your data is handled according to our Privacy Policy.</p>
          <Button className="mt-5" onClick={() => { authService.signOut(); navigate("/"); }}>Sign out</Button>
        </div>
      </div>
    );
  }

  const unreadChats = conversationsFor(db, me.user.id).reduce((n, c) => n + (c.unread > 0 ? 1 : 0), 0);
  const items: TabItem[] = [
    { to: "/app", label: "Discover", icon: Heart, end: true },
    { to: "/app/matches", label: "Matches", icon: MessageCircle, badge: unreadChats },
    { to: "/app/dates", label: "Dates", icon: CalendarHeart },
    { to: "/app/notifications", label: "Alerts", icon: Bell, badge: unreadCount },
    { to: "/app/me", label: "Me", icon: UserRound },
  ];

  return (
    <div className="flex h-dvh flex-col bg-cream md:flex-row">
      <a href="#main" className="sr-only z-50 rounded-full bg-white px-4 py-2 font-semibold text-brand-700 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-cream-200 bg-white px-4 py-6 md:flex">
        <Link to="/app" className="mb-8 px-2" aria-label="KodeCupid home"><Logo /></Link>
        <nav aria-label="Primary" className="flex-1 space-y-1">
          {items.map(({ to, label, icon: Icon, badge, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors", isActive ? "bg-brand-50 text-brand-800" : "text-ink-soft hover:bg-cream-100 hover:text-ink")}>
              <Icon className="h-5 w-5" aria-hidden />
              <span className="flex-1">{label}</span>
              {!!badge && <span className="rounded-full bg-coral-500 px-2 py-0.5 text-[11px] font-bold text-white" aria-label={`${badge} new`}>{badge}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-3">
          {entitlements.tier === "free" && (
            <Link to="/app/subscription" className="block rounded-3xl bg-gradient-to-br from-coral-50 to-coral-100 p-4 text-sm transition-shadow hover:shadow-soft">
              <span className="flex items-center gap-1.5 font-bold text-coral-700"><Sparkles className="h-4 w-4" aria-hidden />Upgrade</span>
              <span className="mt-1 block text-xs text-ink-soft">Unlock discovery, filters and real-time chat.</span>
            </Link>
          )}
          {canInstall && <Button variant="secondary" size="sm" full leftIcon={<Download className="h-4 w-4" />} onClick={install}>Install app</Button>}
          <div className="flex items-center gap-3 rounded-2xl border border-cream-200 p-3">
            <Avatar src={me.profile.photos[0]?.url} name={me.profile.displayName} size="sm" verified={me.verification.status === "verified"} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{me.profile.displayName.split(" ")[0]}</p>
              <Badge tone={entitlements.tier === "free" ? "neutral" : "gold"} size="sm">{entitlements.planLabel}</Badge>
            </div>
            <button aria-label="Sign out" title="Sign out" onClick={() => { authService.signOut(); navigate("/"); }} className="rounded-full p-2 text-ink-mute hover:bg-cream-100 hover:text-ink"><LogOut className="h-4 w-4" /></button>
          </div>
          <Link to="/" className={cn(buttonStyles({ variant: "ghost", size: "sm", full: true }), "text-xs")}>Marketing site</Link>
        </div>
      </aside>

      <main id="main" ref={mainRef} className="min-h-0 flex-1 overflow-y-auto pt-safe">
        <Outlet />
      </main>

      <TabBar items={items} />
    </div>
  );
}
