import type {
  DrinkingHabit, EducationLevel, ExerciseHabit, FamilyPlans, GenderIdentity, IcebreakerAnswer, InterestedIn,
  MemberRecord, NotificationPrefs, Photo, PrivacyToggles, ProfessionCategory, RelationshipGoal, SmokingHabit,
  VerificationMethod, VerificationStatus, WorkplacePrivacy, WorkSchedule,
} from "@/types";
import { facilityById, neighborhoodById } from "@/data/facilities";
import { defaultNotificationPrefs } from "@/data/profiles";
import { calcAge, nowISO } from "./format";
import { photoSet } from "./placeholderArt";
import { SCHEDULE_META } from "./schedule";

/** Flat, form-friendly shape used by the onboarding wizard and the edit-profile screen. */
export interface OnboardingDraft {
  displayName: string; dob: string; genderIdentity: GenderIdentity | ""; genderCustom: string; showGender: boolean;
  interestedIn: InterestedIn | ""; neighborhoodId: string;
  category: ProfessionCategory | ""; jobTitle: string; specialty: string; workplaceName: string; facilityId: string;
  schedule: WorkSchedule; shiftStart: number; shiftEnd: number;
  verification: {
    method?: VerificationMethod; npi: string; npiLookup?: { name: string; taxonomy: string; state: string; active: boolean };
    credentialUrl?: string; credentialLabel: string; status: VerificationStatus;
  };
  photos: Photo[]; bio: string; heightCm: number | ""; bodyType: string; hairColor: string; eyeColor: string;
  languages: string[]; educationLevel: EducationLevel | ""; credentials: string[]; religion: string; ethnicity: string;
  politicalViews: string; drinking: DrinkingHabit | ""; smoking: SmokingHabit | ""; cannabis: SmokingHabit | "";
  exercise: ExerciseHabit | ""; interests: string[]; icebreakers: IcebreakerAnswer[];
  lookingFor: RelationshipGoal[]; familyPlans: FamilyPlans | ""; ageMin: number; ageMax: number; maxDistanceMiles: number;
  preferredProfessions: ProfessionCategory[];
  privacy: PrivacyToggles; workplacePrivacy: WorkplacePrivacy; notificationPrefs: NotificationPrefs;
}

export const DEFAULT_PRIVACY: PrivacyToggles = {
  showGender: true, showAge: true, showHeight: true, showLocation: true, showReligion: false,
  showPolitics: false, showEthnicity: false, showWorkplace: true, showLifestyle: true,
};

export function emptyDraft(): OnboardingDraft {
  return {
    displayName: "", dob: "", genderIdentity: "", genderCustom: "", showGender: true, interestedIn: "", neighborhoodId: "",
    category: "", jobTitle: "", specialty: "", workplaceName: "", facilityId: "", schedule: "days", shiftStart: 7, shiftEnd: 19,
    verification: { npi: "", credentialLabel: "Work ID badge", status: "unverified" },
    photos: [], bio: "", heightCm: "", bodyType: "", hairColor: "", eyeColor: "", languages: ["English"], educationLevel: "",
    credentials: [], religion: "", ethnicity: "", politicalViews: "", drinking: "", smoking: "", cannabis: "", exercise: "",
    interests: [], icebreakers: [], lookingFor: [], familyPlans: "", ageMin: 25, ageMax: 45, maxDistanceMiles: 25,
    preferredProfessions: [], privacy: { ...DEFAULT_PRIVACY },
    workplacePrivacy: { enabled: false, radiusMiles: 1, hiddenFacilityIds: [] },
    notificationPrefs: defaultNotificationPrefs("days"),
  };
}

export type StepErrors = Record<string, string>;

/** Validation for the only REQUIRED fields: name, age, location, gender, preference (+ profession category). */
export function validateStep(step: number, d: OnboardingDraft): StepErrors {
  const e: StepErrors = {};
  if (step === 1) {
    if (d.displayName.trim().length < 2) e.displayName = "Please enter the name you'd like others to see.";
    const age = calcAge(d.dob);
    if (!d.dob) e.dob = "Enter your date of birth.";
    else if (Number.isNaN(age)) e.dob = "That date doesn't look right.";
    else if (age < 18) e.dob = "KodeCupid is for adults 18 and over.";
    else if (age > 110) e.dob = "Please double-check the year.";
    if (!d.genderIdentity) e.genderIdentity = "Choose the option that fits you best.";
    if (d.genderIdentity === "custom" && !d.genderCustom.trim()) e.genderCustom = "Tell us how you describe your gender.";
    if (!d.interestedIn) e.interestedIn = "Tell us who you'd like to meet.";
    if (!d.neighborhoodId) e.neighborhoodId = "Pick your neighborhood (a mock location).";
  }
  if (step === 2) {
    if (!d.category) e.category = "Choose the profession category that fits you best.";
  }
  if (step === 5) {
    if (d.ageMin > d.ageMax) e.ageMin = "Minimum age can't be higher than maximum age.";
  }
  return e;
}

export function draftToMember(d: OnboardingDraft, userId: string, phone: string): MemberRecord {
  const now = nowISO();
  const hood = neighborhoodById(d.neighborhoodId);
  const fac = facilityById(d.facilityId);
  const age = calcAge(d.dob);
  const photos = d.photos.length
    ? d.photos
    : photoSet(userId, 1).map((url, i) => ({ id: `${userId}_p${i}`, url, alt: `${d.displayName} placeholder photo`, kind: "placeholder" as const }));
  const v = d.verification;
  const status: VerificationStatus = v.method === "demo" ? "verified" : v.method ? "pending" : "unverified";
  return {
    user: {
      id: userId, phone, displayName: d.displayName.trim(), role: "member", accountStatus: "active", plan: "free",
      adminNotes: "", lastActiveAt: now, createdAt: now, updatedAt: now,
    },
    profile: {
      userId, displayName: d.displayName.trim(), dateOfBirth: d.dob, age, genderIdentity: d.genderIdentity as GenderIdentity,
      genderCustom: d.genderCustom || undefined, interestedIn: d.interestedIn as InterestedIn,
      location: { city: hood.city, neighborhood: hood.name, neighborhoodId: hood.id, lat: hood.lat, lng: hood.lng },
      photos, bio: d.bio, heightCm: d.heightCm === "" ? undefined : d.heightCm, bodyType: d.bodyType || undefined,
      hairColor: d.hairColor || undefined, eyeColor: d.eyeColor || undefined, languages: d.languages,
      educationLevel: d.educationLevel || undefined, credentials: d.credentials, religion: d.religion || undefined,
      ethnicity: d.ethnicity || undefined, politicalViews: d.politicalViews || undefined,
      lifestyle: {
        drinking: d.drinking || undefined, smoking: d.smoking || undefined, cannabis: d.cannabis || undefined, exercise: d.exercise || undefined,
      },
      interests: d.interests, icebreakers: d.icebreakers.filter((i) => i.answer.trim()),
      privacy: { ...d.privacy, showGender: d.showGender }, workplacePrivacy: d.workplacePrivacy,
      notificationPrefs: d.notificationPrefs, createdAt: now, updatedAt: now,
    },
    professional: {
      userId, category: (d.category || "other") as ProfessionCategory, jobTitle: d.jobTitle, specialty: d.specialty,
      workplaceName: d.workplaceName || fac?.name || "", facilityId: d.facilityId || undefined,
      workplaceType: fac?.type ?? "Workplace", schedule: d.schedule, shiftStart: d.shiftStart, shiftEnd: d.shiftEnd, updatedAt: now,
    },
    preference: {
      userId, lookingFor: d.lookingFor, familyPlans: d.familyPlans || undefined, ageMin: d.ageMin, ageMax: d.ageMax,
      maxDistanceMiles: d.maxDistanceMiles, preferredProfessions: d.preferredProfessions, updatedAt: now,
    },
    verification: {
      id: `ver_${userId}`, userId, status, method: v.method, npiNumber: v.method === "npi" ? v.npi : undefined,
      npiLookup: v.method === "npi" ? v.npiLookup : undefined,
      uploadedCredential: v.method === "manual" && v.credentialUrl ? { label: v.credentialLabel, url: v.credentialUrl } : undefined,
      submittedAt: v.method ? now : undefined, reviewedAt: status === "verified" ? now : undefined,
      history: v.method
        ? [
            { at: now, status: "pending", note: v.method === "npi" ? "NPI lookup submitted" : v.method === "manual" ? "Credential uploaded" : "Demo verification requested", by: "member" },
            ...(status === "verified" ? [{ at: now, status: "verified" as const, note: "Demo verification (prototype)", by: "system" }] : []),
          ]
        : [],
    },
  };
}

export function memberToDraft(m: MemberRecord): OnboardingDraft {
  const p = m.profile;
  return {
    displayName: p.displayName, dob: p.dateOfBirth, genderIdentity: p.genderIdentity, genderCustom: p.genderCustom ?? "",
    showGender: p.privacy.showGender, interestedIn: p.interestedIn, neighborhoodId: p.location.neighborhoodId,
    category: m.professional.category, jobTitle: m.professional.jobTitle, specialty: m.professional.specialty,
    workplaceName: m.professional.workplaceName, facilityId: m.professional.facilityId ?? "", schedule: m.professional.schedule,
    shiftStart: m.professional.shiftStart, shiftEnd: m.professional.shiftEnd,
    verification: {
      method: m.verification.method, npi: m.verification.npiNumber ?? "", npiLookup: m.verification.npiLookup,
      credentialUrl: m.verification.uploadedCredential?.url, credentialLabel: m.verification.uploadedCredential?.label ?? "Work ID badge",
      status: m.verification.status,
    },
    photos: p.photos, bio: p.bio, heightCm: p.heightCm ?? "", bodyType: p.bodyType ?? "", hairColor: p.hairColor ?? "",
    eyeColor: p.eyeColor ?? "", languages: p.languages, educationLevel: p.educationLevel ?? "", credentials: p.credentials,
    religion: p.religion ?? "", ethnicity: p.ethnicity ?? "", politicalViews: p.politicalViews ?? "",
    drinking: p.lifestyle.drinking ?? "", smoking: p.lifestyle.smoking ?? "", cannabis: p.lifestyle.cannabis ?? "",
    exercise: p.lifestyle.exercise ?? "", interests: p.interests, icebreakers: p.icebreakers,
    lookingFor: m.preference.lookingFor, familyPlans: m.preference.familyPlans ?? "", ageMin: m.preference.ageMin,
    ageMax: m.preference.ageMax, maxDistanceMiles: m.preference.maxDistanceMiles,
    preferredProfessions: m.preference.preferredProfessions, privacy: p.privacy, workplacePrivacy: p.workplacePrivacy,
    notificationPrefs: p.notificationPrefs,
  };
}

/** Apply edited draft values to an existing member (verification/account stay untouched). */
export function applyDraft(m: MemberRecord, d: OnboardingDraft): MemberRecord {
  const next = draftToMember(d, m.user.id, m.user.phone);
  const now = nowISO();
  return {
    user: { ...m.user, displayName: next.user.displayName, updatedAt: now },
    profile: { ...next.profile, createdAt: m.profile.createdAt, updatedAt: now },
    professional: next.professional,
    preference: next.preference,
    verification: m.verification,
  };
}

export const defaultShiftFor = (s: WorkSchedule) => ({ shiftStart: SCHEDULE_META[s].start, shiftEnd: SCHEDULE_META[s].end });

/** Profile-completion nudges (progressive disclosure: optional detail is requested later). */
export function profileCompletion(m: MemberRecord): { percent: number; todo: { id: string; label: string; to: string }[] } {
  const p = m.profile;
  const checks: { id: string; label: string; done: boolean; to: string }[] = [
    { id: "photos", label: "Add 3+ photos", done: p.photos.length >= 3, to: "/app/me/edit" },
    { id: "bio", label: "Write a short bio", done: p.bio.trim().length >= 20, to: "/app/me/edit" },
    { id: "verify", label: "Get verified", done: m.verification.status === "verified", to: "/app/me/verify" },
    { id: "ice", label: "Answer an icebreaker", done: p.icebreakers.length > 0, to: "/app/me/edit" },
    { id: "work", label: "Add job title and workplace", done: !!m.professional.jobTitle && !!m.professional.workplaceName, to: "/app/me/edit" },
    { id: "goals", label: "Share what you're looking for", done: m.preference.lookingFor.length > 0, to: "/app/me/edit" },
    { id: "life", label: "Add lifestyle details", done: !!p.lifestyle.drinking || !!p.lifestyle.exercise, to: "/app/me/edit" },
    { id: "int", label: "Pick a few interests", done: p.interests.length >= 3, to: "/app/me/edit" },
  ];
  const done = checks.filter((c) => c.done).length;
  return { percent: Math.round((done / checks.length) * 100), todo: checks.filter((c) => !c.done).map(({ id, label, to }) => ({ id, label, to })) };
}
