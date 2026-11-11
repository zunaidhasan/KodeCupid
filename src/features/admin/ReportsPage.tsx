import { useMemo, useState } from "react";
import { AlertTriangle, Ban, EyeOff, MessageSquareWarning, Siren, XCircle } from "lucide-react";
import type { Report } from "@/types";
import { REPORT_LABEL } from "@/data/options";
import { formatDateTime, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import { adminService, type ReportAction } from "@/services/adminService";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useDocumentTitle, useSimulatedLoading } from "@/hooks";
import { SkeletonList } from "@/components/ui/SkeletonLoader";
import { AdminEmpty, AdminHeader, StatusPill, adminBtn, adminCard, adminInput } from "./AdminUI";

const TABS: ["all" | Report["status"], string][] = [["all", "All"], ["new", "New"], ["in_review", "In review"], ["resolved", "Resolved"]];

export function ReportsPage() {
  useDocumentTitle("Admin · Reports");
  const { db } = useApp();
  const toast = useToast();
  const loading = useSimulatedLoading(400);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("all");
  const [selId, setSelId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const name = (id: string) => db.members.find((m) => m.user.id === id)?.profile.displayName ?? "Unknown member";
  const list = useMemo(() => db.reports.filter((r) => tab === "all" || r.status === tab).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [db.reports, tab]);
  const sel = list.find((r) => r.id === selId) ?? list[0];

  const act = async (a: ReportAction, msg: string) => { if (!sel) return; await adminService.actOnReport(sel.id, a, note.trim()); toast.success(msg); setNote(""); };

  return (
    <div>
      <AdminHeader title="Reports & moderation" subtitle="Review reported profiles and messages." />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Report status">
        {TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setSelId(null); }} className={cn("rounded-full px-4 py-2 text-sm font-semibold", tab === id ? "bg-teal-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50")}>{label} <span className="opacity-70">{id === "all" ? db.reports.length : db.reports.filter((r) => r.status === id).length}</span></button>)}
      </div>
      {loading ? <SkeletonList rows={4} /> : list.length === 0 ? <AdminEmpty title="No reports here" text="Nothing matches this status." /> : (
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <ul className={`${adminCard} max-h-[72vh] divide-y divide-slate-100 overflow-y-auto`} aria-label="Reports">
            {list.map((r) => (
              <li key={r.id}><button onClick={() => { setSelId(r.id); setNote(""); }} className={cn("block w-full p-4 text-left hover:bg-slate-50", sel?.id === r.id && "bg-teal-50")}>
                <span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{REPORT_LABEL[r.category]}</span><StatusPill status={r.status} /></span>
                <span className="mt-1 block text-xs text-slate-500">{r.targetType === "message" ? "Message" : "Profile"} · {name(r.reportedId)} · {timeAgo(r.createdAt)}</span>
              </button></li>
            ))}
          </ul>

          {sel && (
            <section className={`${adminCard} space-y-5 p-5`} aria-label="Report detail">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{REPORT_LABEL[sel.category]}</h2><p className="text-sm text-slate-500">#{sel.id.slice(-6).toUpperCase()} · {formatDateTime(sel.createdAt)} · {sel.targetType === "message" ? "Reported message" : "Reported profile"}</p></div>
                <div className="flex items-center gap-2"><label htmlFor="r-status" className="sr-only">Status</label><select id="r-status" className={`${adminInput} w-40`} value={sel.status} onChange={(e) => adminService.setReportStatus(sel.id, e.target.value as Report["status"])}><option value="new">New</option><option value="in_review">In review</option><option value="resolved">Resolved</option></select></div></div>
              <dl className="grid gap-4 text-sm sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs text-slate-400">Reporter</dt><dd className="font-semibold">{name(sel.reporterId)}</dd></div><div className="rounded-xl bg-rose-50 p-3"><dt className="text-xs text-rose-400">Reported user</dt><dd className="font-semibold text-rose-800">{name(sel.reportedId)}</dd></div></dl>
              {sel.details && <div><h3 className="mb-1 text-sm font-bold text-slate-700">Reporter's details</h3><p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{sel.details}</p></div>}
              {(sel.messageText || sel.evidence.length > 0) && (
                <div><h3 className="mb-1 text-sm font-bold text-slate-700">Evidence</h3>
                  {sel.messageText && <blockquote className="rounded-xl border-l-4 border-rose-300 bg-rose-50 p-3 text-sm italic text-slate-700">“{sel.messageText}”</blockquote>}
                  <div className="mt-2 flex flex-wrap gap-3">{sel.evidence.map((e, i) => <img key={i} src={e} alt={`Evidence ${i + 1}`} className="h-36 rounded-xl border border-slate-200" />)}</div>
                </div>
              )}
              {sel.resolution && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Resolution: {sel.resolution}</p>}

              <div>
                <label htmlFor="r-note" className="mb-1.5 block text-sm font-bold text-slate-700">Moderator note</label>
                <textarea id="r-note" rows={2} className={`${adminInput} h-auto py-2`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional context for the audit log" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className={adminBtn.secondary} onClick={() => act("dismiss", "Report dismissed")}><XCircle className="h-4 w-4" aria-hidden />Dismiss</button>
                  <button className={adminBtn.warn} onClick={() => act("warn", "Warning sent to user")}><AlertTriangle className="h-4 w-4" aria-hidden />Warn user</button>
                  <button className={adminBtn.danger} onClick={() => act("suspend", "User suspended")}><Ban className="h-4 w-4" aria-hidden />Suspend user</button>
                  <button className={adminBtn.secondary} disabled={sel.targetType !== "message"} onClick={() => act("remove_content", "Content removed")} title={sel.targetType !== "message" ? "Only available for reported messages" : undefined}><EyeOff className="h-4 w-4" aria-hidden />Remove content</button>
                  <button className={adminBtn.primary} onClick={() => act("escalate", "Escalated to Trust & Safety lead")}><Siren className="h-4 w-4" aria-hidden />Escalate</button>
                </div>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-slate-400"><MessageSquareWarning className="h-3.5 w-3.5" aria-hidden />All actions are written to the audit log (mock).</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
