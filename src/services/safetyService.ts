import type { ID, Report, ReportCategory } from "@/types";
import { nowISO, uid } from "@/lib/format";
import { db, latency } from "./db";
import { notify } from "./notificationService";

export interface ReportInput {
  reporterId: ID;
  reportedId: ID;
  targetType: "profile" | "message";
  messageId?: ID;
  messageText?: string;
  category: ReportCategory;
  details: string;
  evidence?: string[];
}

export const safetyService = {
  async report(input: ReportInput): Promise<Report> {
    if (!input.category) throw new Error("Choose a category so we can route your report.");
    const now = nowISO();
    const report: Report = { id: uid("rep"), ...input, evidence: input.evidence ?? [], status: "new", createdAt: now, updatedAt: now };
    db.update((s) => { s.reports.unshift(report); });
    notify(input.reporterId, {
      type: "safety", title: "Your report has been submitted",
      body: `Reference ${report.id.slice(-6).toUpperCase()}. Our moderators review reports within 24 hours.`, link: "/app/safety",
    });
    return latency(report, 450);
  },

  async block(userId: ID, blockedId: ID) {
    db.update((s) => {
      if (!s.blocks.some((b) => b.userId === userId && b.blockedId === blockedId)) s.blocks.push({ userId, blockedId, createdAt: nowISO() });
    });
    return latency(true, 200);
  },

  async unblock(userId: ID, blockedId: ID) {
    db.update((s) => { s.blocks = s.blocks.filter((b) => !(b.userId === userId && b.blockedId === blockedId)); });
    return latency(true, 150);
  },
};
