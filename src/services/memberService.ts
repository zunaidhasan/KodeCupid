import type { MemberRecord, VerificationMethod, ID } from "@/types";
import { applyDraft, draftToMember, type OnboardingDraft } from "@/lib/draft";
import { nowISO } from "@/lib/format";
import { db, latency } from "./db";
import { notify } from "./notificationService";

export const memberService = {
  /** Creates the member rows from the onboarding wizard and signs the new user in. */
  async completeOnboarding(draft: OnboardingDraft): Promise<MemberRecord> {
    const { userId, phone } = db.get().session;
    if (!userId) throw new Error("Please sign in first.");
    const member = draftToMember(draft, userId, phone ?? "");
    db.update((s) => {
      s.members = s.members.filter((m) => m.user.id !== userId).concat(member);
      s.session.onboardingComplete = true;
      s.wallets[userId] = { coins: 25, preMatchCredits: 0, superLikes: 0 };
    });
    notify(userId, {
      type: "safety", title: "Welcome to KodeCupid 👋",
      body: "Complete your profile to unlock better matches. Add photos, a bio and an icebreaker when you're ready.", link: "/app/me/edit",
    });
    if (member.verification.status === "pending") {
      notify(userId, { type: "verification", title: "Verification submitted", body: "Pending review — we'll let you know within 1–2 business days.", link: "/app/me/verify" });
    }
    return latency(member, 500);
  },

  async saveProfile(userId: ID, draft: OnboardingDraft) {
    db.update((s) => {
      const i = s.members.findIndex((m) => m.user.id === userId);
      if (i >= 0) s.members[i] = applyDraft(s.members[i], draft);
    });
    return latency(true, 350);
  },

  /** Generic partial update used by the privacy, schedule and notification settings screens. */
  update(userId: ID, mutator: (m: MemberRecord) => void) {
    db.update((s) => {
      const m = s.members.find((x) => x.user.id === userId);
      if (!m) return;
      mutator(m);
      m.profile.updatedAt = nowISO();
    });
  },

  /** Submit NPI or manual credential for review (status → pending). */
  async submitVerification(
    userId: ID,
    input: { method: VerificationMethod; npi?: string; npiLookup?: MemberRecord["verification"]["npiLookup"]; credentialUrl?: string; credentialLabel?: string }
  ) {
    const now = nowISO();
    const verified = input.method === "demo";
    db.update((s) => {
      const m = s.members.find((x) => x.user.id === userId);
      if (!m) return;
      const v = m.verification;
      v.method = input.method;
      v.npiNumber = input.method === "npi" ? input.npi : undefined;
      v.npiLookup = input.method === "npi" ? input.npiLookup : undefined;
      v.uploadedCredential = input.method === "manual" && input.credentialUrl ? { label: input.credentialLabel ?? "Credential", url: input.credentialUrl } : undefined;
      v.status = verified ? "verified" : "pending";
      v.submittedAt = now;
      v.reviewedAt = verified ? now : undefined;
      v.history.push({ at: now, status: "pending", note: input.method === "npi" ? "NPI lookup submitted" : input.method === "manual" ? "Credential uploaded" : "Demo skip requested", by: "member" });
      if (verified) v.history.push({ at: now, status: "verified", note: "Demo verification (prototype)", by: "system" });
    });
    notify(userId, verified
      ? { type: "verification", title: "You're verified ✅ (demo)", body: "Prototype shortcut applied. In production a moderator or the NPI registry confirms this.", link: "/app/me/verify" }
      : { type: "verification", title: "Verification submitted", body: "Pending review — we'll notify you as soon as there's an update.", link: "/app/me/verify" });
    return latency(true, 400);
  },

  async updateSettings(userId: ID, patch: Partial<import("@/types").AppSettings>) {
    db.update((s) => {
      s.settings[userId] = { ...(s.settings[userId] ?? { matchExpiryDays: 7, videoEnabled: true, contentFilter: "standard", blurImages: true, filterWords: true, simulatedTime: null }), ...patch };
    });
  },
};
