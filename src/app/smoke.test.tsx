// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import App from "@/App";
import { db } from "@/services/db";

/**
 * Route smoke test: renders every screen (guest, member, onboarding, admin) and asserts nothing crashes.
 * It exists to catch runtime errors that TypeScript can't (bad data access, missing providers…).
 */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function visit(path: string, settle = 700) {
  window.location.hash = `#${path}`;
  render(<App />);
  await act(async () => { await wait(settle); });
  const text = document.body.textContent ?? "";
  expect(text).not.toContain("Something went wrong");
  expect(text.length).toBeGreaterThan(40);
  return text;
}

beforeAll(() => {
  Element.prototype.scrollIntoView = () => undefined;
  (Element.prototype as unknown as { scrollTo: () => void }).scrollTo = () => undefined;
  window.scrollTo = (() => undefined) as typeof window.scrollTo;
  window.confirm = () => true;
});
beforeEach(() => db.reset());
afterEach(cleanup);

describe("guest routes", () => {
  const routes = ["/", "/pricing", "/terms", "/privacy-policy", "/faqs", "/community-pledge", "/safety-tips", "/contact", "/account-closure", "/signup", "/signup?mode=login", "/nope"];
  routes.forEach((r) => it(`renders ${r}`, async () => {
    const text = await visit(r, 400);
    if (r === "/") expect(text).toContain("Where verified professionals make real connections");
    if (r === "/pricing") expect(text).toContain("$39.99");
    if (r === "/account-closure") expect(text).toContain("Account closure");
  }));
  it("redirects guests away from the member app", async () => {
    await visit("/app", 300);
    expect(window.location.hash).toContain("/signup");
  });
});

describe("member routes (demo member)", () => {
  beforeEach(() => db.update((s) => { s.session = { userId: "u_demo", onboardingComplete: true, adminEmail: null }; }));
  const routes = [
    "/app", "/app/matches", "/app/chat/conv_u_12", "/app/chat/conv_u_14", "/app/chat/conv_u_07", "/app/dates", "/app/notifications",
    "/app/settings/notifications", "/app/me", "/app/me/edit", "/app/me/verify", "/app/schedule", "/app/privacy", "/app/consult",
    "/app/safety", "/app/subscription", "/app/checkout?item=silver", "/app/checkout?item=coins_100", "/app/payment/success", "/app/payment/failed",
    "/app/coins", "/app/profile/u_01", "/app/profile/u_12", "/app/profile/u_demo",
  ];
  routes.forEach((r) => it(`renders ${r}`, async () => {
    const text = await visit(r);
    if (r === "/app") expect(text).toMatch(/% match/);
    if (r === "/app/matches") expect(text).toContain("Theo");
  }));
});

describe("free-tier member", () => {
  beforeEach(() => db.update((s) => { s.session = { userId: "u_demo", onboardingComplete: true, adminEmail: null }; s.members.find((m) => m.user.id === "u_demo")!.user.plan = "free"; }));
  it("sees the upgrade prompt on Discover once the weekly limit is reached", async () => {
    const text = await visit("/app");
    expect(text).toContain("Free plan");
    expect(text).toMatch(/Upgrade/);
  });
});

describe("onboarding", () => {
  beforeEach(() => db.update((s) => { s.session = { userId: "u_new", phone: "(303) 555-0111", onboardingComplete: false, adminEmail: null }; localStorage.removeItem("kodecupid.onboarding"); }));
  it("renders step 1 with only the low-friction fields", async () => {
    const text = await visit("/onboarding", 300);
    expect(text).toContain("About you");
    expect(text).toContain("Date of birth");
  });
  for (let step = 2; step <= 7; step++) {
    it(`renders wizard step ${step}`, async () => {
      localStorage.setItem("kodecupid.onboarding", JSON.stringify({ step, draft: { displayName: "Test Person", dob: "1992-04-01", genderIdentity: "woman", interestedIn: "everyone", neighborhoodId: "lohi", category: "healthcare", facilityId: "f_aldric" } }));
      await visit("/onboarding", 300);
    });
  }
});

describe("admin console", () => {
  it("redirects to login when signed out", async () => {
    await visit("/admin", 300);
    expect(window.location.hash).toContain("/admin/login");
  });
  describe("signed in", () => {
    beforeEach(() => db.update((s) => { s.session.adminEmail = "admin@kodecupid.test"; }));
    ["/admin", "/admin/users", "/admin/verifications", "/admin/reports", "/admin/deletions", "/admin/billing", "/admin/content"].forEach((r) => it(`renders ${r}`, async () => { await visit(r, 600); }));
  });
});
