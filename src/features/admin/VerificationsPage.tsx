import { useMemo, useState } from "react";
import { Check, FileSearch, HelpCircle, X } from "lucide-react";
import { formatDateTime, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import { adminService } from "@/services/adminService";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useDocumentTitle, useSimulatedLoading } from "@/hooks";
import { Avatar } from "@/components/ui/Avatar";
import { SkeletonList } from "@/components/ui/SkeletonLoader";
import { AdminEmpty, AdminHeader, StatusPill, adminBtn, adminCard, adminInput } from "./AdminUI";

const FILTERS = [["queue", "Needs review"], ["verified", "Verified"], ["denied", "Denied"], ["all", "All"]] as const;

export function VerificationsPage() {
  useDocumentTitle("Admin · Verifications");
  const { db } = useApp();
  const toast = useToast();
  const loading = useSimulatedLoading(400);
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("queue");
  const [selId, setSelId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const list = useMemo(() => db.members.filter((m) => m.user.role === "member" && m.verification.method).filter((m) => {
    const s = m.verification.status;
    return filter === "all" || (filter === "queue" ? s === "pending" || s === "needs_info" : s === filter);
  }).sort((a, b) => (b.verification.submittedAt ?? "").localeCompare(a.verification.submittedAt ?? "")), [db.members, filter]);
  const sel = list.find((m) => m.user.id === selId) ?? list[0];
  const v = sel?.verification;

  const act = async (status: "verified" | "denied" | "needs_info") => {
    if (!sel) return;
    if (status !== "verified" && !note.trim()) { setErr(status === "denied" ? "Please add a reason for denying." : "Please say what information is needed."); return; }
    setErr("");
    await adminService.reviewVerification(sel.user.id, status, note.trim());
    toast.success(status === "verified" ? "Verification approved" : status === "denied" ? "Verification denied" : "Requested more information");
    setNote("");
  };

  return (
    <div>
      <AdminHeader title="Verification queue" subtitle="Review NPI lookups and uploaded credentials." />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Queue filter">
        {FILTERS.map(([id, label]) => <button key={id} role="tab" aria-selected={filter === id} onClick={() => { setFilter(id); setSelId(null); }} className={cn("rounded-full px-4 py-2 text-sm font-semibold", filter === id ? "bg-teal-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50")}>{label}</button>)}
      </div>
      {loading ? <SkeletonList rows={4} /> : list.length === 0 ? <AdminEmpty title="Queue is clear 🎉" text="No verification submissions match this filter." /> : (
        <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
          <ul className={`${adminCard} max-h-[70vh] divide-y divide-slate-100 overflow-y-auto`} aria-label="Submissions">
            {list.map((m) => (
              <li key={m.user.id}><button onClick={() => { setSelId(m.user.id); setNote(""); setErr(""); }} className={cn("flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50", sel?.user.id === m.user.id && "bg-teal-50")}>
                <Avatar src={m.profile.photos[0]?.url} name={m.profile.displayName} size="sm" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{m.profile.displayName}</span><span className="block truncate text-xs text-slate-500">{m.verification.method === "npi" ? "NPI lookup" : m.verification.method === "manual" ? "Manual upload" : "Demo"} · {m.verification.submittedAt ? timeAgo(m.verification.submittedAt) : "—"}</span></span><StatusPill status={m.verification.status} />
              </button></li>
            ))}
          </ul>

          {sel && v && (
            <section className={`${adminCard} space-y-5 p-5`} aria-label={`Review ${sel.profile.displayName}`}>
              <div className="flex flex-wrap items-center gap-3"><Avatar src={sel.profile.photos[0]?.url} name={sel.profile.displayName} size="lg" /><div className="min-w-0 flex-1"><h2 className="text-xl font-bold">{sel.profile.displayName}</h2><p className="text-sm text-slate-500">{sel.professional.jobTitle} · {sel.professional.workplaceName}</p></div><StatusPill status={v.status} /></div>
              {v.uploadedCredential ? (
                <figure><img src={v.uploadedCredential.url} alt={`${v.uploadedCredential.label} uploaded by ${sel.profile.displayName}`} className="w-full max-w-lg rounded-xl border border-slate-200" /><figcaption className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><FileSearch className="h-3.5 w-3.5" aria-hidden />{v.uploadedCredential.label} · confidential, moderators only</figcaption></figure>
              ) : v.npiNumber ? (
                <div className="rounded-xl bg-slate-50 p-4 text-sm"><p className="font-semibold">NPI registry result (mock)</p><dl className="mt-2 grid grid-cols-2 gap-2"><div><dt className="text-xs text-slate-400">NPI</dt><dd className="font-mono font-semibold">{v.npiNumber}</dd></div><div><dt className="text-xs text-slate-400">Name on record</dt><dd className="font-semibold">{v.npiLookup?.name}</dd></div><div><dt className="text-xs text-slate-400">Taxonomy</dt><dd className="font-semibold">{v.npiLookup?.taxonomy}</dd></div><div><dt className="text-xs text-slate-400">State / status</dt><dd className="font-semibold">{v.npiLookup?.state} · {v.npiLookup?.active ? "Active" : "Inactive"}</dd></div></dl></div>
              ) : <p className="text-sm text-slate-500">No document attached (demo verification).</p>}

              <div>
                <label htmlFor="v-note" className="mb-1.5 block text-sm font-bold text-slate-700">Note to member / audit log</label>
                <textarea id="v-note" rows={3} className={`${adminInput} h-auto py-2`} value={note} onChange={(e) => { setNote(e.target.value); setErr(""); }} placeholder="Required for “Request info” and “Deny”." />
                {err && <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{err}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className={adminBtn.primary} onClick={() => act("verified")}><Check className="h-4 w-4" aria-hidden />Approve</button>
                  <button className={adminBtn.warn} onClick={() => act("needs_info")}><HelpCircle className="h-4 w-4" aria-hidden />Request more info</button>
                  <button className={adminBtn.danger} onClick={() => act("denied")}><X className="h-4 w-4" aria-hidden />Deny</button>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold text-slate-700">Audit trail</h3>
                <ol className="space-y-2 border-l-2 border-slate-200 pl-4">
                  {v.history.slice().reverse().map((h, i) => <li key={i} className="text-sm"><StatusPill status={h.status} /> <span className="text-slate-700">{h.note}</span><p className="text-xs text-slate-400">{formatDateTime(h.at)} · {h.by}</p></li>)}
                </ol>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
