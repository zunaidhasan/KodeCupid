import { Link, NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { BadgeCheck, CreditCard, FileText, Flag, LayoutDashboard, LogOut, Trash2, Users } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/cn";
import { authService } from "@/services/authService";

/** Separate, operations-friendly console for admins & moderators. */
export function AdminLayout() {
  const { isAdmin, db, session } = useApp();
  const navigate = useNavigate();
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const pendingVer = db.members.filter((m) => m.verification.status === "pending" || m.verification.status === "needs_info").length;
  const openReports = db.reports.filter((r) => r.status !== "resolved").length;
  const openDel = db.deletionRequests.filter((r) => r.status !== "completed").length;
  const items = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/verifications", label: "Verification queue", icon: BadgeCheck, badge: pendingVer },
    { to: "/admin/reports", label: "Reports", icon: Flag, badge: openReports },
    { to: "/admin/deletions", label: "Deletion requests", icon: Trash2, badge: openDel },
    { to: "/admin/billing", label: "Subscriptions", icon: CreditCard },
    { to: "/admin/content", label: "Content", icon: FileText },
  ];
  const signOut = () => { authService.adminLogout(); navigate("/admin/login"); };

  return (
    <div className="flex min-h-dvh flex-col bg-[#F3F5F6] md:flex-row">
      <aside className="shrink-0 bg-brand-950 text-brand-100 md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:flex-col">
        <div className="flex items-center justify-between px-4 py-4 md:block md:px-5 md:py-6">
          <Link to="/admin"><Logo light /></Link>
          <p className="hidden pt-1 text-[11px] font-semibold uppercase tracking-widest text-brand-400 md:block">Admin console</p>
          <button onClick={signOut} className="rounded-full p-2 text-brand-200 hover:bg-brand-800 md:hidden" aria-label="Sign out"><LogOut className="h-5 w-5" /></button>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 scrollbar-hide md:flex-1 md:flex-col md:overflow-visible md:pb-0">
          {items.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cn("flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors", isActive ? "bg-brand-700 text-white" : "text-brand-200 hover:bg-brand-900 hover:text-white")}>
              <Icon className="h-4.5 w-4.5" aria-hidden />
              <span className="md:flex-1">{label}</span>
              {!!badge && <span className="rounded-full bg-coral-500 px-2 py-0.5 text-[11px] font-bold text-white">{badge}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-brand-800 p-4 md:block">
          <p className="truncate text-xs text-brand-300">{session.adminEmail}</p>
          <button onClick={signOut} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand-100 hover:text-white"><LogOut className="h-4 w-4" />Sign out</button>
          <Link to="/" className="mt-2 block text-xs text-brand-300 hover:text-white">← Back to site</Link>
        </div>
      </aside>
      <main id="main" className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8"><Outlet /></main>
    </div>
  );
}
