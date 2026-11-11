import { useMemo } from "react";
import { BadgeCheck, CreditCard, Flag, Heart, Trash2, Users } from "lucide-react";
import { timeAgo } from "@/lib/format";
import { useApp } from "@/context/AppContext";
import { useDocumentTitle, useSimulatedLoading } from "@/hooks";
import { Skeleton } from "@/components/ui/SkeletonLoader";
import { REPORT_LABEL } from "@/data/options";
import { AdminHeader, StatCard, adminCard } from "./AdminUI";

export function DashboardPage() {
  useDocumentTitle("Admin dashboard");
  const { db } = useApp();
  const loading = useSimulatedLoading(400);
  const members = db.members.filter((m) => m.user.role === "member");
  const name = (id?: string) => members.find((m) => m.user.id === id)?.profile.displayName ?? "A member";

  const feed = useMemo(() => {
    const items: { at: string; text: string; tone: string }[] = [];
    db.adminActions.forEach((a) => items.push({ at: a.createdAt, text: `${a.action}${a.targetUserId ? ` — ${name(a.targetUserId)}` : ""}`, tone: "bg-teal-500" }));
    db.reports.forEach((r) => items.push({ at: r.createdAt, text: `New report: ${REPORT_LABEL[r.category]} (${name(r.reportedId)})`, tone: "bg-rose-500" }));
    db.deletionRequests.forEach((r) => items.push({ at: r.createdAt, text: `Deletion request from ${r.contact}`, tone: "bg-slate-500" }));
    members.forEach((m) => m.verification.history.filter((h) => h.status === "pending").forEach((h) => items.push({ at: h.at, text: `${m.profile.displayName} submitted verification`, tone: "bg-amber-500" })));
    db.payments.slice(0, 8).forEach((p) => items.push({ at: p.createdAt, text: `${p.status === "failed" ? "Failed payment" : "Payment"}: ${p.description} (${name(p.userId)})`, tone: p.status === "failed" ? "bg-rose-500" : "bg-emerald-500" }));
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  return (
    <div>
      <AdminHeader title="Dashboard" subtitle="What needs attention today." />
      {loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Total users" value={members.length} icon={Users} to="/admin/users" hint={`${members.filter((m) => m.user.accountStatus === "active").length} active`} />
            <StatCard label="Pending verifications" value={members.filter((m) => m.verification.status === "pending" || m.verification.status === "needs_info").length} icon={BadgeCheck} to="/admin/verifications" tone="amber" />
            <StatCard label="Open reports" value={db.reports.filter((r) => r.status !== "resolved").length} icon={Flag} to="/admin/reports" tone="coral" />
            <StatCard label="Active matches" value={db.matches.filter((m) => m.status === "active").length} icon={Heart} tone="coral" />
            <StatCard label="Active subscriptions" value={db.subscriptions.filter((s) => s.status === "active").length} icon={CreditCard} to="/admin/billing" />
            <StatCard label="Account-deletion requests" value={db.deletionRequests.filter((r) => r.status !== "completed").length} icon={Trash2} to="/admin/deletions" tone="slate" hint="awaiting action" />
          </div>
          <section className={`${adminCard} mt-6 p-5`} aria-labelledby="feed">
            <h2 id="feed" className="text-lg font-bold text-slate-900">Recent activity</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {feed.map((f, i) => <li key={i} className="flex items-center gap-3 py-3 text-sm"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${f.tone}`} aria-hidden /><span className="flex-1 text-slate-700">{f.text}</span><span className="shrink-0 text-xs text-slate-400">{timeAgo(f.at)}</span></li>)}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
