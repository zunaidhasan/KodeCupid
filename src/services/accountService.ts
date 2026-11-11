import type { AccountDeletionRequest } from "@/types";
import { nowISO, uid } from "@/lib/format";
import { db, latency } from "./db";

export const accountService = {
  /**
   * Public data-deletion request (no login needed). Stored in mock state and surfaced in the admin console.
   * PRODUCTION: create a ticket, verify ownership (OTP / email link) and trigger the deletion pipeline.
   */
  async submitDeletionRequest(input: { contact: string; reason: string }): Promise<AccountDeletionRequest> {
    const contact = input.contact.trim();
    const isEmail = /^\S+@\S+\.\S+$/.test(contact);
    const isPhone = contact.replace(/\D/g, "").length >= 10;
    if (!isEmail && !isPhone) throw new Error("Enter the email address or phone number connected to your account.");
    if (!input.reason) throw new Error("Please choose a reason — it helps us improve.");
    const now = nowISO();
    const req: AccountDeletionRequest = { id: uid("del"), contact, reason: input.reason, status: "new", notes: "", createdAt: now, updatedAt: now };
    db.update((s) => { s.deletionRequests.unshift(req); });
    return latency(req, 600);
  },
};
