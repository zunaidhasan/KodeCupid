import type { AccountDeletionRequest, ID, Report, VerificationStatus } from "@/types";
import { nowISO, uid } from "@/lib/format";
import { db, latency } from "./db";
import { notify } from "./notificationService";

/**
 * Admin / moderator operations. Every action writes an AdminAction (audit trail).
 * PRODUCTION: enforce admin roles server-side, use immutable audit logs and 2FA.
 */
const adminId = () => db.get().session.adminEmail ?? "admin";
const log = (action: string, note: string, targetUserId?: ID, targetRef?: string) =>
  db.update((s) => { s.adminActions.unshift({ id: uid("aa"), adminId: adminId(), action, note, targetUserId, targetRef, createdAt: nowISO() }); });

export type ReportAction = "dismiss" | "warn" | "suspend" | "remove_content" | "escalate";
const REPORT_RESULT: Record<ReportAction, { label: string; status: Report["status"] }> = {
  dismiss: { label: "Dismissed — no violation found", status: "resolved" },
  warn: { label: "User warned", status: "resolved" },
  suspend: { label: "User suspended", status: "resolved" },
  remove_content: { label: "Content removed", status: "resolved" },
  escalate: { label: "Escalated to Trust & Safety lead", status: "in_review" },
};

export const adminService = {
  async setAccountStatus(userId: ID, status: "active" | "suspended" | "removed", note = "") {
    db.update((s) => { const u = s.members.find((m) => m.user.id === userId)?.user; if (u) { u.accountStatus = status; u.updatedAt = nowISO(); } });
    log(status === "active" ? "Account reinstated" : status === "suspended" ? "Account suspended" : "Account removed", note || "—", userId);
    return latency(true, 200);
  },

  async saveNotes(userId: ID, notes: string) {
    db.update((s) => { const u = s.members.find((m) => m.user.id === userId)?.user; if (u) u.adminNotes = notes; });
    log("Admin note saved", notes.slice(0, 80) || "(cleared)", userId);
    return latency(true, 150);
  },

  async reviewVerification(userId: ID, status: Extract<VerificationStatus, "verified" | "denied" | "needs_info">, note: string) {
    const now = nowISO();
    db.update((s) => {
      const v = s.members.find((m) => m.user.id === userId)?.verification;
      if (!v) return;
      v.status = status; v.reviewedAt = now; v.reviewerNote = note || undefined;
      v.history.push({ at: now, status, note: note || (status === "verified" ? "Approved" : status === "denied" ? "Denied" : "More information requested"), by: adminId() });
    });
    log(status === "verified" ? "Verification approved" : status === "denied" ? "Verification denied" : "Verification: more info requested", note || "—", userId);
    notify(userId, {
      type: "verification",
      title: status === "verified" ? "You're verified ✅" : status === "denied" ? "Verification update" : "We need a bit more information",
      body: status === "verified" ? "Your verified badge is now live on your profile." : note || "Please review your verification details.",
      link: "/app/me/verify",
    });
    return latency(true, 250);
  },

  async actOnReport(reportId: ID, action: ReportAction, note: string) {
    const report = db.get().reports.find((r) => r.id === reportId);
    if (!report) return;
    const res = REPORT_RESULT[action];
    db.update((s) => {
      const r = s.reports.find((x) => x.id === reportId);
      if (!r) return;
      r.status = res.status; r.resolution = `${res.label}${note ? ` — ${note}` : ""}`; r.updatedAt = nowISO();
      if (action === "suspend") { const u = s.members.find((m) => m.user.id === r.reportedId)?.user; if (u) u.accountStatus = "suspended"; }
      if (action === "remove_content" && r.messageId) { const m = s.messages.find((x) => x.id === r.messageId); if (m) m.removedByModerator = true; }
    });
    log(`Report: ${res.label}`, note || report.category, report.reportedId, reportId);
    if (action === "warn") notify(report.reportedId, { type: "safety", title: "Community guideline reminder", body: "A report about your activity was reviewed. Please follow the Community Pledge.", link: "/community-pledge" });
    notify(report.reporterId, { type: "safety", title: "Update on your report", body: action === "dismiss" ? "We reviewed your report and found no violation." : "Thanks — we've taken action.", link: "/app/safety" });
    return latency(true, 250);
  },

  async setReportStatus(reportId: ID, status: Report["status"]) {
    db.update((s) => { const r = s.reports.find((x) => x.id === reportId); if (r) { r.status = status; r.updatedAt = nowISO(); } });
    log(`Report marked ${status.replace("_", " ")}`, reportId, undefined, reportId);
  },

  async updateDeletion(id: ID, patch: Partial<Pick<AccountDeletionRequest, "status" | "notes">>) {
    db.update((s) => { const r = s.deletionRequests.find((x) => x.id === id); if (r) { Object.assign(r, patch); r.updatedAt = nowISO(); } });
    if (patch.status) log(`Deletion request ${patch.status}`, id, undefined, id);
  },

  async refundPayment(paymentId: ID) {
    db.update((s) => { const p = s.payments.find((x) => x.id === paymentId); if (p) p.status = "refunded"; });
    log("Payment refunded (mock)", paymentId, undefined, paymentId);
    return latency(true, 300);
  },

  async cancelSubscription(subId: ID) {
    db.update((s) => { const sub = s.subscriptions.find((x) => x.id === subId); if (sub) { sub.status = "canceled"; sub.canceledAt = nowISO(); } });
    log("Subscription canceled (mock)", subId, undefined, subId);
    return latency(true, 300);
  },

  async saveContent(slug: string, title: string, body: string) {
    db.update((s) => {
      const p = s.content.find((c) => c.slug === slug);
      if (p) { p.title = title; p.body = body; p.updatedAt = nowISO(); }
    });
    log("Content updated", title, undefined, slug);
    return latency(true, 250);
  },
};
