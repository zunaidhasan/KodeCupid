import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { MemberRecord } from "@/types";
import { formatDate, formatDateTime } from "@/lib/format";
import { adminService } from "@/services/adminService";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useDocumentTitle, useSimulatedLoading } from "@/hooks";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { SkeletonList } from "@/components/ui/SkeletonLoader";
import { AdminEmpty, AdminHeader, StatusPill, adminBtn, adminCard, adminInput } from "./AdminUI";

export function UsersPage() {
  useDocumentTitle("Admin · Users");
  const { db } = useApp();
  const toast = useToast();
  const loading = useSimulatedLoading(400);
  const [q, setQ] = useState("");
  const [ver, setVer] = useState("");
  const [acct, setAcct] = useState("");
  const [selId, setSelId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);

  const users = useMemo(() => {
    const term = q.trim().toLowerCase();
    return db.members.filter((m) => m.user.role === "member").filter((m) => {
      if (ver && m.verification.status !== ver) return false;
      if (acct && m.user.accountStatus !== acct) return false;
      if (!term) return true;
      return [m.profile.displayName, m.user.phone, m.user.email, m.professional.jobTitle, m.professional.specialty, m.professional.workplaceName, m.verification.status, m.user.accountStatus].filter(Boolean).join(" ").toLowerCase().includes(term);
    });
  }, [db.members, q, ver, acct]);

  const sel = db.members.find((m) => m.user.id === selId);
  const open = (m: MemberRecord) => { setSelId(m.user.id); setNotes(m.user.adminNotes); };
  const history = sel ? db.adminActions.filter((a) => a.targetUserId === sel.user.id) : [];

  return (
    <div>
      <AdminHeader title="User management" subtitle={`${users.length} ${users.length === 1 ? "user" : "users"}`} />
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_200px_200px]">
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden /><label htmlFor="user-search" className="sr-only">Search users</label><input id="user-search" className={`${adminInput} pl-9`} placeholder="Search name, phone, email, profession, status…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div><label htmlFor="f-ver" className="sr-only">Verification status</label><select id="f-ver" className={adminInput} value={ver} onChange={(e) => setVer(e.target.value)}><option value="">All verification</option>{["verified", "pending", "needs_info", "denied", "unverified"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></div>
        <div><label htmlFor="f-acct" className="sr-only">Account status</label><select id="f-acct" className={adminInput} value={acct} onChange={(e) => setAcct(e.target.value)}><option value="">All accounts</option>{["active", "suspended", "removed", "pending_deletion"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></div>
      </div>

      {loading ? <SkeletonList rows={6} /> : users.length === 0 ? <AdminEmpty title="No users found" text="Try a different search or clear the filters." /> : (
        <div className={`${adminCard} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Profession</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Verification</th><th className="px-4 py-3">Account</th><th className="px-4 py-3">Plan</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((m) => (
                  <tr key={m.user.id} className="cursor-pointer hover:bg-slate-50" onClick={() => open(m)}>
                    <td className="px-4 py-3"><button className="flex items-center gap-3 text-left font-semibold text-slate-900 hover:underline" onClick={(e) => { e.stopPropagation(); open(m); }}><Avatar src={m.profile.photos[0]?.url} name={m.profile.displayName} size="sm" />{m.profile.displayName}</button></td>
                    <td className="px-4 py-3 text-slate-600">{m.professional.jobTitle || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{m.user.phone}<br />{m.user.email}</td>
                    <td className="px-4 py-3"><StatusPill status={m.verification.status} /></td>
                    <td className="px-4 py-3"><StatusPill status={m.user.accountStatus} /></td>
                    <td className="px-4 py-3 capitalize text-slate-600">{m.user.plan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sel && (
        <Modal open onClose={() => setSelId(null)} title={sel.profile.displayName} description={`${sel.professional.jobTitle || "No title"} · ${sel.professional.workplaceName || "No workplace"}`} size="xl">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3"><Avatar src={sel.profile.photos[0]?.url} name={sel.profile.displayName} size="lg" /><div className="flex flex-wrap gap-2"><StatusPill status={sel.user.accountStatus} /><StatusPill status={sel.verification.status} /><StatusPill status={sel.user.plan} label={`${sel.user.plan} plan`} /></div></div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[["Age", sel.profile.age], ["Location", `${sel.profile.location.neighborhood}, ${sel.profile.location.city}`], ["Phone", sel.user.phone], ["Email", sel.user.email ?? "—"], ["Joined", formatDate(sel.user.createdAt)], ["Last active", formatDate(sel.user.lastActiveAt)], ["Schedule", sel.professional.schedule], ["User ID", sel.user.id]].map(([k, v]) => <div key={k as string}><dt className="text-xs text-slate-400">{k}</dt><dd className="break-words font-medium text-slate-800">{v}</dd></div>)}
              </dl>
              <div>
                <h3 className="mb-2 text-sm font-bold text-slate-700">Verification documents</h3>
                {sel.verification.uploadedCredential ? <figure><img src={sel.verification.uploadedCredential.url} alt={`${sel.verification.uploadedCredential.label} uploaded by ${sel.profile.displayName}`} className="w-full rounded-xl border border-slate-200" /><figcaption className="mt-1 text-xs text-slate-500">{sel.verification.uploadedCredential.label} · visible to moderators only</figcaption></figure>
                  : sel.verification.npiNumber ? <p className="rounded-xl bg-slate-50 p-3 text-sm">NPI <strong>{sel.verification.npiNumber}</strong> · {sel.verification.npiLookup?.taxonomy} · {sel.verification.npiLookup?.state}</p>
                  : <p className="text-sm text-slate-500">No documents submitted.</p>}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-bold text-slate-700">Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {sel.verification.status !== "verified" && <button className={adminBtn.primary} onClick={async () => { await adminService.reviewVerification(sel.user.id, "verified", "Approved from user profile"); toast.success("Verification approved"); }}>Approve verification</button>}
                  {sel.verification.status !== "denied" && <button className={adminBtn.secondary} onClick={async () => { await adminService.reviewVerification(sel.user.id, "denied", "Denied from user profile"); toast.success("Verification denied"); }}>Deny verification</button>}
                  {sel.user.accountStatus === "active" ? <button className={adminBtn.warn} onClick={async () => { await adminService.setAccountStatus(sel.user.id, "suspended", "Suspended by admin"); toast.success("Account suspended"); }}>Suspend account</button> : sel.user.accountStatus !== "removed" && <button className={adminBtn.primary} onClick={async () => { await adminService.setAccountStatus(sel.user.id, "active", "Reinstated"); toast.success("Account reinstated"); }}>Reinstate</button>}
                  {sel.user.accountStatus !== "removed" && <button className={adminBtn.danger} onClick={() => setConfirmRemove(true)}>Remove account</button>}
                </div>
              </div>
              <div>
                <label htmlFor="admin-notes" className="mb-1.5 block text-sm font-bold text-slate-700">Admin notes (internal)</label>
                <textarea id="admin-notes" rows={4} className={`${adminInput} h-auto py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add context for other moderators…" />
                <button className={`${adminBtn.secondary} mt-2`} onClick={async () => { await adminService.saveNotes(sel.user.id, notes); toast.success("Notes saved"); }}>Save notes</button>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-bold text-slate-700">History</h3>
                {history.length === 0 && sel.verification.history.length === 0 ? <p className="text-sm text-slate-500">No admin activity yet.</p> : (
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {history.map((h) => <li key={h.id}><strong>{h.action}</strong> — {h.note} <span className="text-slate-400">· {formatDateTime(h.createdAt)}</span></li>)}
                    {sel.verification.history.map((h, i) => <li key={i}>Verification <strong>{h.status.replace("_", " ")}</strong> — {h.note} <span className="text-slate-400">· {formatDateTime(h.at)}</span></li>)}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
      <Modal open={confirmRemove} onClose={() => setConfirmRemove(false)} title="Remove this account?" description="The member will lose access and disappear from discovery. (Mock — reversible by reinstating.)" size="sm"
        footer={<div className="flex justify-end gap-2"><button className={adminBtn.secondary} onClick={() => setConfirmRemove(false)}>Cancel</button><button className={adminBtn.danger} onClick={async () => { if (sel) await adminService.setAccountStatus(sel.user.id, "removed", "Removed by admin"); setConfirmRemove(false); toast.success("Account removed"); }}>Remove account</button></div>}>
        <p className="text-sm text-slate-600">{sel?.profile.displayName} will be marked as removed.</p>
      </Modal>
    </div>
  );
}
