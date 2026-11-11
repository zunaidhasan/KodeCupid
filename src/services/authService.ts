import { db, latency } from "./db";
import { smsProvider } from "./providers";
import { uid } from "@/lib/format";
import { DEMO_USER_ID } from "@/data/profiles";

const digits = (s: string) => s.replace(/\D/g, "");
export const ADMIN_EMAIL = "admin@kodecupid.test";
export const ADMIN_PASSWORD = "admin123";

export const authService = {
  async sendOtp(phone: string) {
    if (digits(phone).length < 10) throw new Error("Enter a valid 10-digit phone number.");
    return smsProvider.sendCode(phone);
  },

  /** Accepts any 6-digit code (prototype). Returns whether onboarding is still needed. */
  async verifyOtp(phone: string, code: string): Promise<{ isNew: boolean }> {
    if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code we sent you.");
    const ok = await smsProvider.verifyCode(phone, code);
    if (!ok) throw new Error("That code didn't work. Please try again.");
    const existing = db.get().members.find((m) => digits(m.user.phone) === digits(phone));
    if (existing) {
      if (existing.user.accountStatus === "suspended" || existing.user.accountStatus === "removed") {
        throw new Error("This account is currently unavailable. Contact support for help.");
      }
      db.update((s) => { s.session = { userId: existing.user.id, onboardingComplete: true, adminEmail: s.session.adminEmail }; });
      return { isNew: false };
    }
    db.update((s) => { s.session = { userId: uid("u"), phone, onboardingComplete: false, adminEmail: s.session.adminEmail }; });
    return { isNew: true };
  },

  async signInDemo() {
    db.update((s) => { s.session = { userId: DEMO_USER_ID, onboardingComplete: true, adminEmail: s.session.adminEmail }; });
    return latency(true, 250);
  },

  signOut() {
    db.update((s) => { s.session = { userId: null, onboardingComplete: false, adminEmail: s.session.adminEmail }; });
  },

  async adminLogin(email: string, password: string) {
    await latency(null, 400);
    if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      throw new Error("That email or password isn't right. Use the demo credentials shown below.");
    }
    db.update((s) => { s.session.adminEmail = ADMIN_EMAIL; });
  },
  adminLogout() {
    db.update((s) => { s.session.adminEmail = null; });
  },

  /** Wipes browser storage and reseeds the mock database. */
  resetPrototype() {
    try { localStorage.removeItem("kodecupid.onboarding"); localStorage.removeItem("kodecupid.filters"); } catch { /* ignore */ }
    db.reset();
  },
};
