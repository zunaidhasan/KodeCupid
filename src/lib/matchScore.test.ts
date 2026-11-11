import { describe, expect, it } from "vitest";
import { MATCH_WEIGHTS, matchScore } from "./matchScore";
import { SEED_MEMBERS } from "@/data/profiles";
import type { MemberRecord } from "@/types";

const byId = (id: string): MemberRecord => structuredClone(SEED_MEMBERS.find((m) => m.user.id === id)!);

describe("matchScore", () => {
  it("weights add up to exactly 100", () => {
    expect(Object.values(MATCH_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("returns a bounded total and an explainable breakdown", () => {
    const r = matchScore(byId("u_demo"), byId("u_12"));
    expect(r.total).toBeGreaterThanOrEqual(0);
    expect(r.total).toBeLessThanOrEqual(100);
    expect(r.factors).toHaveLength(Object.keys(MATCH_WEIGHTS).length);
    r.factors.forEach((f) => {
      expect(f.ratio).toBeGreaterThanOrEqual(0);
      expect(f.ratio).toBeLessThanOrEqual(1);
      expect(f.points).toBeCloseTo(f.ratio * f.weight, 5);
    });
    expect(Math.round(r.factors.reduce((s, f) => s + f.points, 0))).toBe(r.total);
  });

  it("is symmetric enough to rank a better fit higher than a poor one", () => {
    const me = byId("u_demo"); // night-shift ICU nurse seeking serious/long-term
    const good = byId("u_09"); // night-shift L&D nurse nearby
    const poor = byId("u_21"); // Boulder professor, far away, different schedule
    expect(matchScore(me, good).total).toBeGreaterThan(matchScore(me, poor).total);
  });

  it("rewards shared goals and penalises conflicting ones", () => {
    const a = byId("u_01");
    const b = byId("u_02");
    b.preference.lookingFor = ["serious"];
    a.preference.lookingFor = ["serious", "long_term"];
    const shared = matchScore(a, b).factors.find((f) => f.key === "goals")!.ratio;
    a.preference.lookingFor = ["short_term"];
    const conflict = matchScore(a, b).factors.find((f) => f.key === "goals")!.ratio;
    expect(shared).toBeGreaterThan(0.8);
    expect(conflict).toBeLessThan(0.2);
  });

  it("scores same-specialty higher than same-field higher than unrelated", () => {
    const a = byId("u_demo");
    const b = byId("u_09");
    const prof = (x: MemberRecord, y: MemberRecord) => matchScore(x, y).factors.find((f) => f.key === "profession")!.ratio;
    b.professional.specialty = a.professional.specialty;
    const same = prof(a, b);
    b.professional.specialty = "Something else";
    const field = prof(a, b);
    b.professional.category = "education";
    const unrelated = prof(a, b);
    expect(same).toBeGreaterThan(field);
    expect(field).toBeGreaterThan(unrelated);
  });

  it("includes schedule compatibility as a weighted factor", () => {
    const f = matchScore(byId("u_demo"), byId("u_09")).factors.find((x) => x.key === "schedule")!;
    expect(f.weight).toBe(MATCH_WEIGHTS.schedule);
    expect(f.ratio).toBeGreaterThan(0.8); // both nights
  });
});
