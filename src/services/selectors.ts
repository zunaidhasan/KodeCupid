import type {
  Conversation, Db, DrinkingHabit, EducationLevel, ExerciseHabit, GenderIdentity, ID, InterestedIn, MemberRecord, Match,
  Message, MicroDate, ProfessionCategory, RelationshipGoal, SmokingHabit,
} from "@/types";
import { facilityById } from "@/data/facilities";
import { countdown } from "@/lib/format";
import { distanceMiles } from "@/lib/geo";
import { matchScore, type MatchScoreResult } from "@/lib/matchScore";
import { scheduleCompatibility, type ScheduleCompat } from "@/lib/schedule";

/** Read-side helpers over the db snapshot. In production these become SQL views / API queries. */
export const getMember = (d: Db, id?: ID | null) => (id ? d.members.find((m) => m.user.id === id) : undefined);
export const getMe = (d: Db) => (d.session.onboardingComplete ? getMember(d, d.session.userId) : undefined);

export const isBlockedBetween = (d: Db, a: ID, b: ID) =>
  d.blocks.some((x) => (x.userId === a && x.blockedId === b) || (x.userId === b && x.blockedId === a));

export function genderMatchesInterest(g: GenderIdentity, i: InterestedIn): boolean {
  if (i === "everyone") return true;
  if (i === "women") return g === "woman";
  if (i === "men") return g === "man";
  return ["non-binary", "agender", "genderfluid", "custom", "transgender"].includes(g);
}

/** Is `other` inside the workplace-privacy radius of `owner`'s hidden facilities? (mock coordinates only) */
function nearOwnersWorkplace(owner: MemberRecord, other: MemberRecord): boolean {
  const wp = owner.profile.workplacePrivacy;
  if (!wp.enabled) return false;
  return wp.hiddenFacilityIds.some((fid) => {
    const f = facilityById(fid);
    return !!f && distanceMiles(f, other.profile.location) <= wp.radiusMiles;
  });
}
/** Privacy is mutual: neither person appears in the other's discovery when either is protected. */
export const isHiddenByWorkplacePrivacy = (viewer: MemberRecord, candidate: MemberRecord) =>
  nearOwnersWorkplace(viewer, candidate) || nearOwnersWorkplace(candidate, viewer);

export interface DiscoveryFilters {
  maxDistance: number;
  ageMin: number;
  ageMax: number;
  categories: ProfessionCategory[];
  specialty: string;
  goal: RelationshipGoal | "";
  schedule: "any" | "some" | "great";
  education: EducationLevel | "";
  drinking: DrinkingHabit | "";
  smoking: SmokingHabit | "";
  exercise: ExerciseHabit | "";
  language: string;
  verifiedOnly: boolean;
}
export const DEFAULT_FILTERS: DiscoveryFilters = {
  maxDistance: 50, ageMin: 21, ageMax: 65, categories: [], specialty: "Any", goal: "", schedule: "any",
  education: "", drinking: "", smoking: "", exercise: "", language: "", verifiedOnly: false,
};
export function activeFilterCount(f: DiscoveryFilters): number {
  const d = DEFAULT_FILTERS;
  return [
    f.maxDistance !== d.maxDistance, f.ageMin !== d.ageMin || f.ageMax !== d.ageMax, f.categories.length > 0,
    f.specialty !== "Any", !!f.goal, f.schedule !== "any", !!f.education, !!f.drinking, !!f.smoking, !!f.exercise,
    !!f.language, f.verifiedOnly,
  ].filter(Boolean).length;
}

export interface Candidate {
  member: MemberRecord;
  score: MatchScoreResult;
  schedule: ScheduleCompat;
  distance: number;
}

const SCHEDULE_RANK = { different: 0, some: 1, great: 2 } as const;

export function discoveryCandidates(
  d: Db, me: MemberRecord, filters: DiscoveryFilters, ignoreFilters = false
): { candidates: Candidate[]; hiddenByPrivacy: number } {
  const acted = new Set([...d.likes.filter((l) => l.fromId === me.user.id).map((l) => l.toId), ...d.passes.filter((p) => p.fromId === me.user.id).map((p) => p.toId)]);
  const matched = new Set(d.matches.filter((m) => m.userIds.includes(me.user.id) && m.status !== "unmatched").flatMap((m) => m.userIds));
  let hiddenByPrivacy = 0;
  const candidates: Candidate[] = [];
  for (const m of d.members) {
    if (m.user.id === me.user.id || m.user.accountStatus !== "active" || m.user.role !== "member") continue;
    if (acted.has(m.user.id) || matched.has(m.user.id) || isBlockedBetween(d, me.user.id, m.user.id)) continue;
    if (!genderMatchesInterest(m.profile.genderIdentity, me.profile.interestedIn)) continue;
    if (isHiddenByWorkplacePrivacy(me, m)) { hiddenByPrivacy++; continue; }
    const distance = distanceMiles(me.profile.location, m.profile.location);
    const schedule = scheduleCompatibility(me.professional, m.professional);
    if (!ignoreFilters) {
      if (distance > filters.maxDistance) continue;
      if (m.profile.age < filters.ageMin || m.profile.age > filters.ageMax) continue;
      if (filters.categories.length && !filters.categories.includes(m.professional.category)) continue;
      if (filters.specialty !== "Any" && !(`${m.professional.specialty} ${m.professional.jobTitle}`.toLowerCase().includes(filters.specialty.toLowerCase()))) continue;
      if (filters.goal && !m.preference.lookingFor.includes(filters.goal)) continue;
      if (filters.schedule !== "any" && SCHEDULE_RANK[schedule.level] < SCHEDULE_RANK[filters.schedule]) continue;
      if (filters.education && m.profile.educationLevel !== filters.education) continue;
      if (filters.drinking && m.profile.lifestyle.drinking !== filters.drinking) continue;
      if (filters.smoking && m.profile.lifestyle.smoking !== filters.smoking) continue;
      if (filters.exercise && m.profile.lifestyle.exercise !== filters.exercise) continue;
      if (filters.language && !m.profile.languages.includes(filters.language)) continue;
      if (filters.verifiedOnly && m.verification.status !== "verified") continue;
    }
    candidates.push({ member: m, score: matchScore(me, m), schedule, distance });
  }
  candidates.sort((a, b) => b.score.total - a.score.total);
  return { candidates, hiddenByPrivacy };
}

export const matchesThisWeek = (d: Db, meId: ID) =>
  d.matches.filter((m) => m.userIds.includes(meId) && m.status !== "unmatched" && Date.now() - new Date(m.createdAt).getTime() < 7 * 86400000).length;

export const otherId = (c: { participantIds: [ID, ID] }, meId: ID) => (c.participantIds[0] === meId ? c.participantIds[1] : c.participantIds[0]);
export const matchBetween = (d: Db, a: ID, b: ID): Match | undefined =>
  d.matches.find((m) => m.status !== "unmatched" && m.userIds.includes(a) && m.userIds.includes(b));

export type ConvState =
  | { kind: "active" }
  | { kind: "expiring"; label: string }
  | { kind: "expired" }
  | { kind: "prematch" };

export function conversationState(d: Db, conv: Conversation): ConvState {
  if (conv.preMatch) return { kind: "prematch" };
  const senders = new Set(d.messages.filter((m) => m.conversationId === conv.id).map((m) => m.senderId));
  const bothSpoke = conv.participantIds.every((p) => senders.has(p));
  const match = d.matches.find((m) => m.id === conv.matchId);
  if (bothSpoke && match?.status !== "expired") return { kind: "active" };
  const left = countdown(conv.expiresAt);
  if (!left || match?.status === "expired") return { kind: "expired" };
  return { kind: "expiring", label: left };
}

export interface ConversationSummary {
  conv: Conversation;
  other: MemberRecord;
  last?: Message;
  unread: number;
  state: ConvState;
}
export function conversationsFor(d: Db, meId: ID): ConversationSummary[] {
  return d.conversations
    .filter((c) => c.participantIds.includes(meId))
    .map((conv) => {
      const other = getMember(d, otherId(conv, meId));
      if (!other) return null;
      if (isBlockedBetween(d, meId, other.user.id)) return null;
      const match = d.matches.find((m) => m.id === conv.matchId);
      if (match?.status === "unmatched") return null;
      const msgs = d.messages.filter((m) => m.conversationId === conv.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return {
        conv, other, last: msgs[msgs.length - 1],
        unread: msgs.filter((m) => m.senderId !== meId && !m.readAt && !m.removedByModerator).length,
        state: conversationState(d, conv),
      } as ConversationSummary;
    })
    .filter((x): x is ConversationSummary => !!x)
    .sort((a, b) => b.conv.lastMessageAt.localeCompare(a.conv.lastMessageAt));
}

/** Pending invitations whose date has passed are shown as Expired. */
export function effectiveDateStatus(md: MicroDate): MicroDate["status"] {
  if (md.status === "pending" && md.date < new Date().toISOString().slice(0, 10)) return "expired";
  return md.status;
}
