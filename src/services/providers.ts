import type { GeoPoint, PaymentProvider } from "@/types";
import { NEIGHBORHOODS } from "@/data/facilities";
import { sleep } from "./db";

/**
 * MOCKED THIRD-PARTY INTEGRATIONS
 * ------------------------------------------------------------------
 * Each external dependency is hidden behind a small interface so a real SDK can be dropped in:
 *   SmsProvider      → Twilio Verify / Firebase Phone Auth / Supabase Auth OTP
 *   PaymentGateway   → Stripe / Square / PayPal server-side checkout sessions
 *   NpiRegistry      → NPPES NPI Registry API (https://npiregistry.cms.hhs.gov/api)
 *   VideoProvider    → Daily / Twilio Video / LiveKit
 *   PushProvider     → Web Push (VAPID) via the service worker / FCM
 *   GeoProvider      → Browser Geolocation + PostGIS (NOT used in this prototype)
 */

/* ----------------------------------- SMS ---------------------------------- */
export interface SmsProvider {
  sendCode(phone: string): Promise<{ mockCode: string }>;
  verifyCode(phone: string, code: string): Promise<boolean>;
}
export const MOCK_OTP = "123456";
export const smsProvider: SmsProvider = {
  async sendCode() {
    await sleep(350);
    return { mockCode: MOCK_OTP };
  },
  async verifyCode(_phone, code) {
    await sleep(350);
    return /^\d{6}$/.test(code); // prototype: any 6-digit code is accepted
  },
};

/* --------------------------------- Payments -------------------------------- */
export interface ChargeRequest { amountCents: number; description: string; cardNumber?: string; forceFail?: boolean }
export interface ChargeResult { ok: boolean; reference: string; failureReason?: string }
export interface PaymentGateway { id: PaymentProvider; label: string; charge(req: ChargeRequest): Promise<ChargeResult> }

const makeGateway = (id: PaymentProvider, label: string): PaymentGateway => ({
  id,
  label,
  async charge({ cardNumber = "", forceFail }) {
    await sleep(900);
    const digits = cardNumber.replace(/\D/g, "");
    const ref = `${id}_mock_${Math.random().toString(36).slice(2, 10)}`;
    if (forceFail || digits.endsWith("0002")) return { ok: false, reference: ref, failureReason: "Your card was declined (mock). Try another payment method." };
    if (digits.endsWith("9995")) return { ok: false, reference: ref, failureReason: "Insufficient funds (mock)." };
    return { ok: true, reference: ref }; // NO REAL CHARGE IS EVER MADE
  },
});
export const paymentGateways: Record<PaymentProvider, PaymentGateway> = {
  stripe: makeGateway("stripe", "Stripe"),
  square: makeGateway("square", "Square"),
  paypal: makeGateway("paypal", "PayPal"),
};

/* ----------------------------------- NPI ----------------------------------- */
export interface NpiResult { found: boolean; name?: string; taxonomy?: string; state?: string; active?: boolean; message?: string }
export interface NpiRegistry { lookup(npi: string): Promise<NpiResult> }

/** The real NPI check digit: Luhn over "80840" + first 9 digits. */
export function isValidNpiChecksum(npi: string): boolean {
  if (!/^\d{10}$/.test(npi)) return false;
  const digits = `80840${npi}`.split("").map(Number).reverse();
  const sum = digits.reduce((acc, d, i) => {
    if (i % 2 === 1) {
      const dbl = d * 2;
      return acc + (dbl > 9 ? dbl - 9 : dbl);
    }
    return acc + d;
  }, 0);
  return sum % 10 === 0;
}

const TAXONOMIES = [
  "Registered Nurse", "Physician (Internal Medicine)", "Physician Assistant", "Pharmacist", "Physical Therapist",
  "Psychologist", "Nurse Practitioner", "Emergency Medicine", "Clinical Social Worker", "Paramedic",
];
export const npiRegistry: NpiRegistry = {
  async lookup(npi) {
    await sleep(900);
    if (!/^\d{10}$/.test(npi)) return { found: false, message: "NPI numbers have exactly 10 digits." };
    if (!isValidNpiChecksum(npi) || npi.startsWith("0")) {
      return { found: false, message: "We couldn't find that NPI in the registry (mock). Double-check the number or upload a credential instead." };
    }
    const last = Number(npi.slice(-1));
    return { found: true, name: "Registry match (mock)", taxonomy: TAXONOMIES[last % TAXONOMIES.length], state: "CO", active: true };
  },
};

/* ---------------------------------- Video ---------------------------------- */
export interface VideoProvider { startCall(conversationId: string): Promise<{ available: false; message: string }> }
export const videoProvider: VideoProvider = {
  async startCall() {
    await sleep(400);
    return { available: false, message: "Video calling coming soon. Your match will be notified when it launches." };
  },
};

/* ----------------------------------- Push ---------------------------------- */
export interface PushPayload { title: string; body: string; link?: string }
type PushListener = (p: PushPayload) => void;
const pushListeners = new Set<PushListener>();
export interface PushProvider {
  requestPermission(): Promise<"granted">;
  send(payload: PushPayload): void;
  subscribe(listener: PushListener): () => void;
}
export const pushProvider: PushProvider = {
  async requestPermission() {
    await sleep(200);
    return "granted"; // never prompts the browser
  },
  send(payload) {
    pushListeners.forEach((l) => l(payload));
  },
  subscribe(listener) {
    pushListeners.add(listener);
    return () => pushListeners.delete(listener);
  },
};

/* ------------------------------------ Geo ---------------------------------- */
export interface GeoProvider { getCurrentLocation(): Promise<GeoPoint & { neighborhoodId: string }> }
export const geoProvider: GeoProvider = {
  async getCurrentLocation() {
    await sleep(500);
    const n = NEIGHBORHOODS[0]; // fixed mock location — browser geolocation is never called
    return { lat: n.lat, lng: n.lng, neighborhoodId: n.id };
  },
};
