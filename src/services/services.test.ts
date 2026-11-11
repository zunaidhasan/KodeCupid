// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { matchService } from "./matchService";
import { paymentService } from "./paymentService";
import { accountService } from "./accountService";
import { safetyService } from "./safetyService";
import { adminService } from "./adminService";
import { dateService } from "./dateService";
import { notify } from "./notificationService";
import { memberService } from "./memberService";
import { DEFAULT_FILTERS, discoveryCandidates, getMember, matchesThisWeek } from "./selectors";

const me = () => getMember(db.get(), "u_demo")!;

beforeEach(() => { db.reset(); db.update((s) => { s.session = { userId: "u_demo", onboardingComplete: true, adminEmail: "admin@kodecupid.test" }; }); });

describe("matching + free-tier limits", () => {
  it("creates a match + conversation on a mutual like", async () => {
    const res = await matchService.like("u_demo", "u_10"); // u_10 already liked the demo member
    expect(res.status).toBe("matched");
    expect(db.get().conversations.some((c) => c.participantIds.includes("u_10"))).toBe(true);
  });
  it("free members hit the one-match-per-week limit", async () => {
    expect(matchesThisWeek(db.get(), "u_demo")).toBeGreaterThanOrEqual(1);
    await paymentService.setPlanDemo("u_demo", "free");
    const res = await matchService.like("u_demo", "u_10");
    expect(res.status).toBe("limit");
  });
  it("super likes are a Premium perk", async () => {
    await paymentService.setPlanDemo("u_demo", "silver");
    expect((await matchService.like("u_demo", "u_20", "super")).status).toBe("no_credits");
  });
});

describe("workplace privacy (mock geofence)", () => {
  it("hides members inside the radius and reveals them when the radius shrinks", () => {
    const inside = discoveryCandidates(db.get(), me(), DEFAULT_FILTERS, true);
    expect(inside.hiddenByPrivacy).toBeGreaterThan(0);
    expect(inside.candidates.some((c) => c.member.user.id === "u_19")).toBe(false); // lives ~0.6mi from St. Aldric
    memberService.update("u_demo", (m) => { m.profile.workplacePrivacy.radiusMiles = 0.25; });
    const smaller = discoveryCandidates(db.get(), me(), DEFAULT_FILTERS, true);
    expect(smaller.candidates.some((c) => c.member.user.id === "u_19")).toBe(true);
    expect(smaller.candidates.some((c) => c.member.user.id === "u_01")).toBe(false); // u_01 also protects their own workplace
    memberService.update("u_demo", (m) => { m.profile.workplacePrivacy.enabled = false; });
    // Turning mine off still leaves members who protect their own workplace hidden (privacy is mutual)
    expect(discoveryCandidates(db.get(), me(), DEFAULT_FILTERS, true).hiddenByPrivacy).toBeLessThan(inside.hiddenByPrivacy);
  });
  it("never shows blocked members", async () => {
    await safetyService.block("u_demo", "u_02");
    expect(discoveryCandidates(db.get(), me(), DEFAULT_FILTERS, true).candidates.some((c) => c.member.user.id === "u_02")).toBe(false);
    await safetyService.unblock("u_demo", "u_02");
    expect(discoveryCandidates(db.get(), me(), DEFAULT_FILTERS, true).candidates.some((c) => c.member.user.id === "u_02")).toBe(true);
  });
});

describe("shift-aware quiet hours", () => {
  it("holds push notifications during quiet hours and delivers them afterwards", async () => {
    await memberService.updateSettings("u_demo", { simulatedTime: "10:00" }); // inside the night-shift 08:00–16:00 window
    const held = notify("u_demo", { type: "message", title: "Hi", body: "Test" });
    expect(held?.held).toBe(true);
    await memberService.updateSettings("u_demo", { simulatedTime: "18:00" });
    const live = notify("u_demo", { type: "message", title: "Hi again", body: "Test" });
    expect(live?.held).toBeUndefined();
  });
});

describe("micro-dates, deletion requests, reports and payments", () => {
  it("sends a pending invitation that later resolves", async () => {
    const md = await dateService.sendInvite({ matchId: "match_u_12", fromId: "u_demo", toId: "u_12", date: "2031-01-05", blockIds: ["evening"], venueId: "v_bean" });
    expect(md.status).toBe("pending");
    dateService.resolve(md.id);
    expect(["accepted", "declined"]).toContain(db.get().microDates.find((m) => m.id === md.id)!.status);
  });
  it("stores account deletion requests for the admin console and validates input", async () => {
    await expect(accountService.submitDeletionRequest({ contact: "bad", reason: "x" })).rejects.toThrow();
    const req = await accountService.submitDeletionRequest({ contact: "someone@example.com", reason: "Taking a break" });
    expect(db.get().deletionRequests[0].id).toBe(req.id);
    await adminService.updateDeletion(req.id, { status: "processing" });
    expect(db.get().deletionRequests[0].status).toBe("processing");
  });
  it("report → admin action → resolved + suspension", async () => {
    const r = await safetyService.report({ reporterId: "u_demo", reportedId: "u_23", targetType: "profile", category: "harassment", details: "test" });
    await adminService.actOnReport(r.id, "suspend", "repeat offender");
    expect(db.get().reports.find((x) => x.id === r.id)!.status).toBe("resolved");
    expect(getMember(db.get(), "u_23")!.user.accountStatus).toBe("suspended");
  });
  it("mock payments: success upgrades the plan, declined card does not", async () => {
    await paymentService.setPlanDemo("u_demo", "free");
    const bad = await paymentService.purchaseItem("u_demo", "silver", "stripe", { cardNumber: "4000 0000 0000 0002" });
    expect(bad.ok).toBe(false);
    expect(me().user.plan).toBe("free");
    const ok = await paymentService.purchaseItem("u_demo", "premium", "paypal", { cardNumber: "4242 4242 4242 4242" });
    expect(ok.ok).toBe(true);
    expect(me().user.plan).toBe("premium");
    const coins = db.get().wallets["u_demo"].coins;
    await paymentService.purchaseItem("u_demo", "coins_100", "square", { cardNumber: "4242" });
    expect(db.get().wallets["u_demo"].coins).toBe(coins + 100);
  });
});
