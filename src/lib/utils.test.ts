import { describe, expect, it } from "vitest";
import { calcAge, countdown, dobForAge, formatCurrency, formatPhone, toISODate } from "./format";
import { isWithinQuietHours } from "./quietHours";
import { getEntitlements } from "./entitlements";
import { distanceMiles } from "./geo";
import { emptyDraft, validateStep } from "./draft";
import { isValidNpiChecksum } from "@/services/providers";

describe("age calculation + onboarding validation", () => {
  it("calculates age on and around the birthday", () => {
    const now = new Date(2025, 5, 15);
    expect(calcAge("2000-06-15", now)).toBe(25);
    expect(calcAge("2000-06-16", now)).toBe(24);
    expect(Number.isNaN(calcAge("nope"))).toBe(true);
  });
  it("dobForAge round-trips", () => expect(calcAge(dobForAge(34, 3))).toBe(34));
  it("blocks users under 18", () => {
    const d = emptyDraft();
    d.displayName = "Sam";
    d.genderIdentity = "man";
    d.interestedIn = "women";
    d.neighborhoodId = "lohi";
    const seventeen = new Date(); seventeen.setFullYear(seventeen.getFullYear() - 17);
    d.dob = toISODate(seventeen);
    expect(validateStep(1, d).dob).toMatch(/18/);
    const adult = new Date(); adult.setFullYear(adult.getFullYear() - 30);
    d.dob = toISODate(adult);
    expect(validateStep(1, d)).toEqual({});
  });
  it("requires only the low-friction fields in step 1", () => {
    expect(Object.keys(validateStep(1, emptyDraft())).sort()).toEqual(["displayName", "dob", "genderIdentity", "interestedIn", "neighborhoodId"]);
  });
});

describe("quiet hours", () => {
  const night = { enabled: true, start: "08:00", end: "16:00", preset: "night_shift" as const };
  const standard = { enabled: true, start: "22:00", end: "07:00", preset: "standard" as const };
  it("handles same-day windows (night-shift sleep)", () => {
    expect(isWithinQuietHours(night, "10:30")).toBe(true);
    expect(isWithinQuietHours(night, "17:00")).toBe(false);
  });
  it("handles windows that cross midnight", () => {
    expect(isWithinQuietHours(standard, "23:30")).toBe(true);
    expect(isWithinQuietHours(standard, "03:00")).toBe(true);
    expect(isWithinQuietHours(standard, "12:00")).toBe(false);
  });
  it("is off when disabled", () => expect(isWithinQuietHours({ ...night, enabled: false }, "10:00")).toBe(false));
});

describe("entitlements", () => {
  it("free members cannot browse and are capped at one match per week", () => {
    const e = getEntitlements({ plan: "free" });
    expect(e.canBrowse).toBe(false);
    expect(e.weeklyMatchLimit).toBe(1);
  });
  it("silver can chat; premium unlocks video + super like", () => {
    expect(getEntitlements({ plan: "silver" })).toMatchObject({ canBrowse: true, canChat: true, canVideo: false });
    expect(getEntitlements({ plan: "premium" })).toMatchObject({ canVideo: true, canSuperLike: true });
  });
  it("a day pass temporarily behaves like silver", () => {
    const soon = new Date(Date.now() + 3600_000).toISOString();
    const past = new Date(Date.now() - 3600_000).toISOString();
    expect(getEntitlements({ plan: "free", pass: { kind: "daily", expiresAt: soon } }).canBrowse).toBe(true);
    expect(getEntitlements({ plan: "free", pass: { kind: "daily", expiresAt: past } }).canBrowse).toBe(false);
  });
});

describe("helpers", () => {
  it("formats currency and phone", () => {
    expect(formatCurrency(3999)).toBe("$39.99");
    expect(formatPhone("3035550100")).toBe("(303) 555-0100");
  });
  it("haversine distance is sensible", () => {
    const denver = { lat: 39.7392, lng: -104.9903 };
    const boulder = { lat: 40.015, lng: -105.2705 };
    const d = distanceMiles(denver, boulder);
    expect(d).toBeGreaterThan(20);
    expect(d).toBeLessThan(30);
    expect(distanceMiles(denver, denver)).toBe(0);
  });
  it("countdown returns null once the deadline has passed", () => {
    expect(countdown(new Date(Date.now() - 1000).toISOString())).toBeNull();
    expect(countdown(new Date(Date.now() + 2 * 86400000 + 3600_000).toISOString())).toMatch(/^2d/);
  });
  it("validates NPI check digits (mock registry)", () => {
    expect(isValidNpiChecksum("1234567893")).toBe(true);
    expect(isValidNpiChecksum("1234567890")).toBe(false);
    expect(isValidNpiChecksum("12345")).toBe(false);
  });
});
