import type {
  EducationLevel, MemberRecord, RelationshipGoal, SmokingHabit, DrinkingHabit, ExerciseHabit,
} from "@/types";
import { distanceMiles } from "./geo";
import { scheduleCompatibility } from "./schedule";

/**
 * PROTOTYPE MATCH ESTIMATE — explainable, weighted scoring.
 * ---------------------------------------------------------------
 * `matchScore(a, b)` returns 0–100 plus a per-factor breakdown so the UI can explain "why".
 * Weights sum to 100. Each factor produces a `ratio` in 0..1; points = ratio × weight.
 *
 * PRODUCTION NOTE: replace this module with a call to a backend ranking service
 * (e.g. Postgres + PostGIS candidate query → feature store → ML ranker). Keep the
 * `MatchScoreResult` shape so the UI doesn't change.
 */
export const MATCH_WEIGHTS = {
  proximity: 20, // closer is better, scaled by both members' max-distance preferences
  age: 10, // do both ages fall inside the other's preferred range?
  goals: 20, // relationship goals (exact overlap > same family of goals > undecided)
  profession: 10, // same specialty > same category > adjacent / preferred categories
  education: 5, // similar education level
  lifestyle: 10, // drinking, smoking, cannabis, exercise closeness
  schedule: 15, // shift-aware schedule compatibility
  interests: 10, // shared interests + same icebreaker prompts answered
} as const;
export type MatchFactorKey = keyof typeof MATCH_WEIGHTS;

export interface MatchFactor {
  key: MatchFactorKey;
  label: string;
  weight: number;
  ratio: number;
  points: number;
  note: string;
}
export interface MatchScoreResult {
  total: number; // 0..100 rounded
  band: "excellent" | "strong" | "good" | "explore";
  headline: string;
  factors: MatchFactor[];
}

const GOAL_FAMILY: Record<RelationshipGoal, "committed" | "casual" | "friendship" | "undecided"> = {
  marriage: "committed", serious: "committed", partner: "committed", long_term: "committed",
  short_term: "casual", casual: "casual",
  companion: "friendship", friend: "friendship", travel: "friendship", lunch: "friendship",
  work_friend: "friendship", new_friends: "friendship",
  figuring_out: "undecided",
};

const EDU_RANK: Record<EducationLevel, number> = {
  high_school: 0, some_college: 1, bachelors: 2, masters: 3, doctorate: 4, professional: 4,
};
const DRINK_RANK: Record<DrinkingHabit, number> = { never: 0, rarely: 1, socially: 2, regularly: 3 };
const SMOKE_RANK: Record<SmokingHabit, number> = { never: 0, quitting: 1, socially: 2, regularly: 3 };
const EX_RANK: Record<ExerciseHabit, number> = { rarely: 0, sometimes: 1, regularly: 2, daily: 3 };

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function closeness<T extends string>(a: T | undefined, b: T | undefined, rank: Record<T, number>): number {
  if (!a || !b) return 0.5; // unknown → neutral
  const maxGap = Math.max(...Object.values<number>(rank));
  return 1 - Math.abs(rank[a] - rank[b]) / maxGap;
}

export function proximityFactor(a: MemberRecord, b: MemberRecord) {
  const d = distanceMiles(a.profile.location, b.profile.location);
  const limit = Math.max(1, Math.min(a.preference.maxDistanceMiles, b.preference.maxDistanceMiles));
  let ratio: number;
  if (d <= 3) ratio = 1;
  else if (d <= limit) ratio = 1 - 0.6 * ((d - 3) / Math.max(1, limit - 3));
  else ratio = Math.max(0, 0.25 - (d - limit) / (limit * 4));
  return { ratio: clamp01(ratio), note: `${d < 1 ? "<1" : Math.round(d)} mi apart (limit ${limit} mi)` };
}

export function ageFactor(a: MemberRecord, b: MemberRecord) {
  const aOk = b.profile.age >= a.preference.ageMin && b.profile.age <= a.preference.ageMax;
  const bOk = a.profile.age >= b.preference.ageMin && a.profile.age <= b.preference.ageMax;
  if (aOk && bOk) return { ratio: 1, note: "Inside each other's preferred age range" };
  if (aOk || bOk) return { ratio: 0.5, note: "Inside one preferred range" };
  return { ratio: 0.1, note: "Outside both preferred age ranges" };
}

export function goalsFactor(a: MemberRecord, b: MemberRecord) {
  const ga = a.preference.lookingFor;
  const gb = b.preference.lookingFor;
  if (!ga.length || !gb.length) return { ratio: 0.4, note: "Goals not shared yet" };
  const exact = ga.filter((g) => gb.includes(g));
  if (exact.length) return { ratio: clamp01(0.8 + 0.1 * exact.length), note: `Shared goal${exact.length > 1 ? "s" : ""}` };
  const famA = new Set(ga.map((g) => GOAL_FAMILY[g]));
  const famB = new Set(gb.map((g) => GOAL_FAMILY[g]));
  if ([...famA].some((f) => f !== "undecided" && famB.has(f))) return { ratio: 0.65, note: "Similar intentions" };
  if (famA.has("undecided") || famB.has("undecided")) return { ratio: 0.45, note: "One of you is still figuring it out" };
  return { ratio: 0.05, note: "Different relationship goals" };
}

export function professionFactor(a: MemberRecord, b: MemberRecord) {
  const pa = a.professional;
  const pb = b.professional;
  let ratio = 0.15;
  let note = "Different fields";
  const specialtyMatch =
    pa.specialty && pb.specialty && pa.specialty.toLowerCase() === pb.specialty.toLowerCase();
  if (specialtyMatch) { ratio = 1; note = "Same specialty"; }
  else if (pa.category === pb.category) { ratio = 0.6; note = "Same professional field"; }
  else if (
    (pa.category === "healthcare" && pb.category === "science") ||
    (pa.category === "science" && pb.category === "healthcare") ||
    (pa.category === "education" && pb.category === "college") ||
    (pa.category === "college" && pb.category === "education")
  ) { ratio = 0.45; note = "Neighbouring fields"; }
  const prefersB = a.preference.preferredProfessions.includes(pb.category);
  const prefersA = b.preference.preferredProfessions.includes(pa.category);
  if (prefersB) { ratio = clamp01(ratio + 0.3); note += " · matches your preferred professions"; }
  if (prefersA) ratio = clamp01(ratio + 0.1);
  return { ratio, note };
}

export function educationFactor(a: MemberRecord, b: MemberRecord) {
  const ea = a.profile.educationLevel;
  const eb = b.profile.educationLevel;
  if (!ea || !eb) return { ratio: 0.5, note: "Education not shared yet" };
  const gap = Math.abs(EDU_RANK[ea] - EDU_RANK[eb]);
  const ratio = [1, 0.8, 0.5, 0.3, 0.2][gap] ?? 0.2;
  return { ratio, note: gap === 0 ? "Similar education" : "Different education levels" };
}

export function lifestyleFactor(a: MemberRecord, b: MemberRecord) {
  const la = a.profile.lifestyle;
  const lb = b.profile.lifestyle;
  const parts = [
    closeness(la.drinking, lb.drinking, DRINK_RANK),
    closeness(la.smoking, lb.smoking, SMOKE_RANK),
    closeness(la.cannabis, lb.cannabis, SMOKE_RANK),
    closeness(la.exercise, lb.exercise, EX_RANK),
  ];
  const ratio = parts.reduce((s, n) => s + n, 0) / parts.length;
  return { ratio, note: ratio > 0.8 ? "Very similar lifestyles" : ratio > 0.55 ? "Compatible lifestyles" : "Different habits" };
}

export function interestsFactor(a: MemberRecord, b: MemberRecord) {
  const shared = a.profile.interests.filter((i) => b.profile.interests.includes(i));
  const promptsA = new Set(a.profile.icebreakers.map((i) => i.promptId));
  const sharedPrompts = b.profile.icebreakers.filter((i) => promptsA.has(i.promptId)).length;
  const ratio = clamp01(Math.min(1, shared.length / 3) * 0.8 + (sharedPrompts > 0 ? 0.2 : 0));
  const note = shared.length ? `Shared: ${shared.slice(0, 3).join(", ")}` : "No shared interests yet";
  return { ratio: shared.length || sharedPrompts ? ratio : 0.15, note };
}

export function scheduleFactor(a: MemberRecord, b: MemberRecord) {
  const c = scheduleCompatibility(a.professional, b.professional);
  return { ratio: c.score, note: c.label };
}

const LABELS: Record<MatchFactorKey, string> = {
  proximity: "Distance",
  age: "Age preferences",
  goals: "Relationship goals",
  profession: "Profession",
  education: "Education",
  lifestyle: "Lifestyle",
  schedule: "Schedule overlap",
  interests: "Interests & icebreakers",
};

export function matchScore(a: MemberRecord, b: MemberRecord): MatchScoreResult {
  const raw: Record<MatchFactorKey, { ratio: number; note: string }> = {
    proximity: proximityFactor(a, b),
    age: ageFactor(a, b),
    goals: goalsFactor(a, b),
    profession: professionFactor(a, b),
    education: educationFactor(a, b),
    lifestyle: lifestyleFactor(a, b),
    schedule: scheduleFactor(a, b),
    interests: interestsFactor(a, b),
  };
  const factors: MatchFactor[] = (Object.keys(MATCH_WEIGHTS) as MatchFactorKey[]).map((key) => ({
    key,
    label: LABELS[key],
    weight: MATCH_WEIGHTS[key],
    ratio: raw[key].ratio,
    points: raw[key].ratio * MATCH_WEIGHTS[key],
    note: raw[key].note,
  }));
  const total = Math.round(factors.reduce((s, f) => s + f.points, 0));
  const band = total >= 85 ? "excellent" : total >= 72 ? "strong" : total >= 58 ? "good" : "explore";
  const headline = {
    excellent: "Excellent fit",
    strong: "Strong fit",
    good: "Good fit",
    explore: "Worth exploring",
  }[band];
  return { total, band, headline, factors };
}
