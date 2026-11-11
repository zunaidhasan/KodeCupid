import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { buttonStyles } from "@/components/ui/Button";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/cn";

const NAV = [
  { to: "/pricing", label: "Pricing" },
  { to: "/safety-tips", label: "Safety" },
  { to: "/community-pledge", label: "Community" },
  { to: "/faqs", label: "FAQs" },
];

const FOOTER_LINKS = [
  { to: "/terms", label: "Terms" },
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/faqs", label: "FAQs" },
  { to: "/community-pledge", label: "Community Pledge" },
  { to: "/safety-tips", label: "Safety Tips" },
  { to: "/contact", label: "Contact" },
  { to: "/account-closure", label: "Account Closure / Data Deletion" },
];

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { isMember } = useApp();
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <a href="#main" className="sr-only z-50 rounded-full bg-white px-4 py-2 font-semibold text-brand-700 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-cream-200 bg-cream/90 pt-safe backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="KodeCupid home"><Logo /></Link>
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => cn("rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-cream-100", isActive ? "text-brand-700" : "text-ink-soft")}>{n.label}</NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {isMember ? (
              <Link to="/app" className={buttonStyles({ variant: "primary", size: "sm" })}>Open app</Link>
            ) : (
              <>
                <Link to="/signup?mode=login" className={buttonStyles({ variant: "ghost", size: "sm" })}>Log in</Link>
                <Link to="/signup" className={buttonStyles({ variant: "accent", size: "sm" })}>Create your profile</Link>
              </>
            )}
          </div>
          <button className="rounded-full p-2 text-ink hover:bg-cream-100 md:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {open && (
          <nav id="mobile-nav" aria-label="Mobile" className="animate-fade-in space-y-1 border-t border-cream-200 bg-cream px-4 pb-4 pt-2 md:hidden">
            {NAV.map((n) => <Link key={n.to} to={n.to} className="block rounded-2xl px-4 py-3 text-base font-semibold text-ink hover:bg-cream-100">{n.label}</Link>)}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link to="/signup?mode=login" className={buttonStyles({ variant: "secondary" })}>Log in</Link>
              <Link to={isMember ? "/app" : "/signup"} className={buttonStyles({ variant: "accent" })}>{isMember ? "Open app" : "Join now"}</Link>
            </div>
          </nav>
        )}
      </header>

      <main id="main" className="flex-1"><Outlet /></main>

      <footer className="border-t border-cream-200 bg-brand-950 text-brand-100 pb-safe">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo light />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-brand-200">A verified community for the people who care for, teach, and discover. Prototype build — fictional members and mock integrations only.</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            {FOOTER_LINKS.map((l) => <Link key={l.to + l.label} to={l.to} className="text-brand-100 hover:text-white hover:underline">{l.label}</Link>)}
            <Link to="/admin" className="text-brand-300 hover:text-white hover:underline">Admin console</Link>
          </nav>
        </div>
        <div className="border-t border-brand-800 px-4 py-4 text-center text-xs text-brand-300">© {new Date().getFullYear()} KodeCupid prototype · Not a real service · No real payments or data</div>
      </footer>
    </div>
  );
}
