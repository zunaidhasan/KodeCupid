import { useState } from "react";
import type { AccountDeletionRequest } from "@/types";
import { formatDateTime } from "@/lib/format";
import { adminService } from "@/services/adminService";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useDocumentTitle, useSimulatedLoading } from "@/hooks";
import { SkeletonList } from "@/components/ui/SkeletonLoader";
import { AdminEmpty, AdminHeader, StatusPill, adminBtn, adminCard, adminInput } from "./AdminUI";

function Row({ r }: { r: AccountDeletionRequest }) {
  const toast = useToast();
  const [notes, setNotes] = useState(r.notes);
  return (
    <li className={`${adminCard} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-lg font-bold text-slate-900">{r.contact}</p><p className="text-sm text-slate-500">#{r.id.slice(-6).toUpperCase()} · received {formatDateTime(r.createdAt)}</p><p className="mt-2 text-sm text-slate-700"><span className="font-semibold">Reason:</span> {r.reason}</p></div>
        <StatusPill status={r.status} />
      </div>
      <div className="mt-4">
        <label htmlFor={`n-${r.id}`} className="mb-1.5 block text-sm font-bold text-slate-700">Internal notes</label>
        <textarea id={`n-${r.id}`} rows={2} className={`${adminInput} h-auto py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. identity verified by email, data export sent…" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className={adminBtn.secondary} onClick={async () => { await adminService.updateDeletion(r.id, { notes }); toast.success("Notes saved"); }}>Save notes</button>
        <button className={adminBtn.warn} disabled={r.status !== "new"} onClick={async () => { await adminService.updateDeletion(r.id, { status: "processing", notes }); toast.success("Marked as processing"); }}>Mark as processing</button>
        <button className={adminBtn.primary} disabled={r.status === "completed"} onClick={async () => { await adminService.updateDeletion(r.id, { status: "completed", notes }); toast.success("Marked as completed"); }}>Mark as completed</button>
      </div>
    </li>
  );
}

export function DeletionsPage() {
  useDocumentTitle("Admin · Deletion requests");
  const { db } = useApp();
  const loading = useSimulatedLoading(400);
  return (
    <div>
      <AdminHeader title="Account closure & deletion requests" subtitle="Submitted from the public /account-closure form." />
      {loading ? <SkeletonList rows={3} /> : db.deletionRequests.length === 0 ? <AdminEmpty title="No requests" text="New submissions from the public form appear here." /> : <ul className="space-y-4">{db.deletionRequests.map((r) => <Row key={r.id} r={r} />)}</ul>}
    </div>
  );
}
