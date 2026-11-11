import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { adminService } from "@/services/adminService";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useDocumentTitle, useSimulatedLoading } from "@/hooks";
import { Modal } from "@/components/ui/Modal";
import { SkeletonList } from "@/components/ui/SkeletonLoader";
import { AdminEmpty, AdminHeader, StatusPill, adminBtn, adminCard } from "./AdminUI";

type Confirm = { kind: "refund" | "cancel"; id: string; label: string } | null;

export function BillingPage() {
  useDocumentTitle("Admin · Subscriptions");
  const { db } = useApp();
  const toast = useToast();
  const loading = useSimulatedLoading(400);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const name = (id: string) => db.members.find((m) => m.user.id === id)?.profile.displayName ?? id;
  const active = db.subscriptions.filter((s) => s.status === "active");
  const mrr = active.reduce((n, s) => n + s.priceCents, 0);

  const run = async () => {
    if (!confirm) return;
    if (confirm.kind === "refund") await adminService.refundPayment(confirm.id); else await adminService.cancelSubscription(confirm.id);
    toast.success(confirm.kind === "refund" ? "Refund issued (mock)" : "Subscription canceled (mock)");
    setConfirm(null);
  };

  return (
    <div>
      <AdminHeader title="Subscriptions & payments" subtitle="Mock data — refunds and cancellations don't contact any provider." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className={`${adminCard} p-5`}><p className="text-3xl font-bold">{active.length}</p><p className="text-sm text-slate-500">Active subscribers</p></div>
        <div className={`${adminCard} p-5`}><p className="text-3xl font-bold">{formatCurrency(mrr)}</p><p className="text-sm text-slate-500">Monthly recurring revenue (mock)</p></div>
        <div className={`${adminCard} p-5`}><p className="text-sm font-semibold text-slate-700">By provider</p><p className="mt-1 text-sm text-slate-500">{(["stripe", "square", "paypal"] as const).map((p) => `${p[0].toUpperCase() + p.slice(1)} ${db.subscriptions.filter((s) => s.provider === p).length}`).join(" · ")}</p></div>
      </div>

      <h2 className="mb-3 text-lg font-bold">Subscribers</h2>
      {loading ? <SkeletonList rows={5} /> : db.subscriptions.length === 0 ? <AdminEmpty title="No subscribers yet" /> : (
        <div className={`${adminCard} overflow-x-auto`}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Renews</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {db.subscriptions.map((s) => {
                const lastPay = db.payments.find((p) => p.userId === s.userId && p.kind === "subscription" && p.status === "succeeded");
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-semibold">{name(s.userId)}</td>
                    <td className="px-4 py-3 capitalize">{s.plan} · {formatCurrency(s.priceCents)}</td>
                    <td className="px-4 py-3"><StatusPill status={s.status} /></td>
                    <td className="px-4 py-3 capitalize">{s.provider}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(s.renewsAt)}</td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-2">
                      <button className={adminBtn.secondary} disabled={!lastPay} onClick={() => lastPay && setConfirm({ kind: "refund", id: lastPay.id, label: `Refund ${formatCurrency(lastPay.amountCents)} to ${name(s.userId)}` })}>Refund</button>
                      <button className={adminBtn.secondary} disabled={s.status !== "active"} onClick={() => setConfirm({ kind: "cancel", id: s.id, label: `Cancel ${name(s.userId)}'s ${s.plan} subscription` })}>Cancel</button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mb-3 mt-8 text-lg font-bold">Recent payments</h2>
      <div className={`${adminCard} overflow-x-auto`}>
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Item</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{db.payments.slice(0, 12).map((p) => <tr key={p.id}><td className="px-4 py-3 font-semibold">{name(p.userId)}</td><td className="px-4 py-3">{p.description}</td><td className="px-4 py-3">{formatCurrency(p.amountCents)}</td><td className="px-4 py-3 capitalize">{p.provider}</td><td className="px-4 py-3"><StatusPill status={p.status} /></td><td className="px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td></tr>)}</tbody>
        </table>
      </div>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Please confirm" description="Mocked only — no real money moves." size="sm"
        footer={<div className="flex justify-end gap-2"><button className={adminBtn.secondary} onClick={() => setConfirm(null)}>Back</button><button className={adminBtn.danger} onClick={run}>Confirm</button></div>}>
        <p className="text-sm text-slate-700">{confirm?.label}</p>
      </Modal>
    </div>
  );
}
