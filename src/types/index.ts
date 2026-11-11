/**
 * KodeCupid data model (prototype).
 * These interfaces map 1:1 to tables/collections you would create in Postgres / Supabase / Firebase.
 * See DATA_MODEL.md for relationships.
 */

export type ID = string;
export type ISODateTime = string;
export type ISODate = string; // YYYY-MM-DD

/* ------------------------------ Enumerations ------------------------------ */
export type ProfessionCategory = "healthcare" | "education" | "college" | "science" | "other";
export type WorkSchedule = "days" | "nights" | "swings" | "weekday" | "variable";
export type GenderIdentity = "man" | "woman" | "non-binary" | "transgender" | "agender" | "genderfluid" | "custom";
export type InterestedIn = "women" | "men" | "non-binary" | "everyone";
export type VerificationStatus = "unverified" | "pending" | "needs_info" | "verified" | "denied";
export type VerificationMethod = "npi" | "manual" | "demo";
export type AccountStatus = "active" | "suspended" | "removed" | "pending_deletion";
export type UserRole = "member" | "moderator" | "admin";
export type PlanId = "free" | "silver" | "premium";
export type PaymentProvider = "stripe" | "square" | "paypal";
export type RelationshipGoal =
  | "marriage" | "serious" | "companion" | "friend" | "travel" | "lunch" | "work_friend"
  | "partner" | "long_term" | "short_term" | "casual" | "new_friends" | "figuring_out";
export type FamilyPlans = "want" | "dont_want" | "have_want_more" | "have_done" | "open" | "unsure";
export type EducationLevel = "high_school" | "some_college" | "bachelors" | "masters" | "doctorate" | "professional";
export type DrinkingHabit = "never" | "rarely" | "socially" | "regularly";
export type SmokingHabit = "never" | "socially" | "regularly" | "quitting";
export type ExerciseHabit = "rarely" | "sometimes" | "regularly" | "daily";
export type ReportCategory =
  | "harassment" | "sexual_content" | "scam" | "fake_profile" | "inappropriate_message" | "threat" | "other";
export type NotificationType = "match" | "message" | "like" | "date" | "verification" | "billing" | "safety";

/* ------------------------------- Value types ------------------------------ */
export interface GeoPoint { lat: number; lng: number }
export interface LocationInfo extends GeoPoint { city: string; neighborhood: string; neighborhoodId: string }

export interface Photo {
  id: ID;
  url: string; // data URI (placeholder art or resized upload) — replace with CDN URL in production
  alt: string;
  kind: "placeholder" | "upload";
}

export interface IcebreakerAnswer { promptId: string; answer: string }

export interface PrivacyToggles {
  showGender: boolean;
  showAge: boolean;
  showHeight: boolean;
  showLocation: boolean; // neighborhood + distance
  showReligion: boolean;
  showPolitics: boolean;
  showEthnicity: boolean;
  showWorkplace: boolean; // workplace name (type is always shown)
  showLifestyle: boolean;
}

export interface WorkplacePrivacy {
  enabled: boolean;
  radiusMiles: number; // default 1
  hiddenFacilityIds: string[];
}

export interface QuietHours {
  enabled: boolean;
  start: string; // HH:MM
  end: string; // HH:MM
  preset: "night_shift" | "standard" | "custom";
}

export interface NotificationPrefs {
  push: boolean;
  matches: boolean;
  messages: boolean;
  likes: boolean;
  dates: boolean;
  quietHours: QuietHours;
}

export interface Lifestyle {
  drinking?: DrinkingHabit;
  smoking?: SmokingHabit;
  cannabis?: SmokingHabit;
  exercise?: ExerciseHabit;
}

/* ---------------------------------- Core ---------------------------------- */
export interface User {
  id: ID;
  phone: string;
  email?: string;
  displayName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  plan: PlanId;
  /** Daily / prime-time hourly pass (temporary access) */
  pass?: { kind: "daily" | "hourly"; expiresAt: ISODateTime };
  adminNotes: string;
  lastActiveAt: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Profile {
  userId: ID;
  displayName: string;
  dateOfBirth: ISODate;
  age: number;
  genderIdentity: GenderIdentity;
  genderCustom?: string;
  interestedIn: InterestedIn;
  location: LocationInfo;
  photos: Photo[];
  bio: string;
  heightCm?: number;
  bodyType?: string;
  hairColor?: string;
  eyeColor?: string;
  languages: string[];
  educationLevel?: EducationLevel;
  credentials: string[]; // MD, DO, PhD, RN ...
  religion?: string;
  ethnicity?: string;
  politicalViews?: string;
  lifestyle: Lifestyle;
  interests: string[];
  icebreakers: IcebreakerAnswer[];
  privacy: PrivacyToggles;
  workplacePrivacy: WorkplacePrivacy;
  notificationPrefs: NotificationPrefs;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface ProfessionalProfile {
  userId: ID;
  category: ProfessionCategory;
  jobTitle: string;
  specialty: string;
  workplaceName: string;
  facilityId?: string;
  workplaceType: string; // Hospital, Clinic, School, Campus ...
  schedule: WorkSchedule;
  shiftStart: number; // 0-23
  shiftEnd: number; // 0-23
  updatedAt: ISODateTime;
}

export interface VerificationEvent { at: ISODateTime; status: VerificationStatus; note: string; by: string }

export interface VerificationRecord {
  id: ID;
  userId: ID;
  status: VerificationStatus;
  method?: VerificationMethod;
  npiNumber?: string;
  npiLookup?: { name: string; taxonomy: string; state: string; active: boolean };
  uploadedCredential?: { label: string; url: string };
  submittedAt?: ISODateTime;
  reviewedAt?: ISODateTime;
  reviewerNote?: string;
  history: VerificationEvent[];
}

export interface Preference {
  userId: ID;
  lookingFor: RelationshipGoal[];
  familyPlans?: FamilyPlans;
  ageMin: number;
  ageMax: number;
  maxDistanceMiles: number;
  preferredProfessions: ProfessionCategory[];
  updatedAt: ISODateTime;
}

/** A fully-joined member (one row per user across the profile tables). */
export interface MemberRecord {
  user: User;
  profile: Profile;
  professional: ProfessionalProfile;
  preference: Preference;
  verification: VerificationRecord;
}

/* ------------------------------ Interactions ------------------------------ */
export interface Like { id: ID; fromId: ID; toId: ID; kind: "like" | "super"; createdAt: ISODateTime }
export interface Pass { id: ID; fromId: ID; toId: ID; createdAt: ISODateTime }
export interface Match {
  id: ID;
  userIds: [ID, ID];
  score: number;
  status: "active" | "expired" | "unmatched";
  createdAt: ISODateTime;
  expiresAt: ISODateTime;
}
export interface Message {
  id: ID;
  conversationId: ID;
  senderId: ID;
  body: string;
  imageUrl?: string;
  createdAt: ISODateTime;
  readAt?: ISODateTime;
  removedByModerator?: boolean;
}
export interface Conversation {
  id: ID;
  matchId?: ID;
  participantIds: [ID, ID];
  preMatch: boolean; // paid pre-match message thread
  createdAt: ISODateTime;
  expiresAt: ISODateTime;
  lastMessageAt: ISODateTime;
}
export interface MicroDate {
  id: ID;
  matchId: ID;
  fromId: ID;
  toId: ID;
  date: ISODate;
  blockIds: string[];
  startLabel: string;
  venueId: string;
  venueName: string;
  note?: string;
  status: "pending" | "accepted" | "declined" | "expired";
  createdAt: ISODateTime;
  respondedAt?: ISODateTime;
}
export interface Notification {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  /** true when the push was held because the user was in quiet hours */
  held?: boolean;
  createdAt: ISODateTime;
}

/* ------------------------------ Trust & safety ---------------------------- */
export interface Report {
  id: ID;
  reporterId: ID;
  reportedId: ID;
  targetType: "profile" | "message";
  messageId?: ID;
  messageText?: string;
  category: ReportCategory;
  details: string;
  evidence: string[]; // image URLs
  status: "new" | "in_review" | "resolved";
  resolution?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
export interface BlockRecord { userId: ID; blockedId: ID; createdAt: ISODateTime }
export interface AdminAction {
  id: ID;
  adminId: string;
  targetUserId?: ID;
  targetRef?: string;
  action: string;
  note: string;
  createdAt: ISODateTime;
}

/* -------------------------------- Commerce -------------------------------- */
export interface Subscription {
  id: ID;
  userId: ID;
  plan: PlanId;
  status: "active" | "canceled" | "past_due";
  provider: PaymentProvider;
  priceCents: number;
  startedAt: ISODateTime;
  renewsAt: ISODateTime;
  canceledAt?: ISODateTime;
}
export interface Payment {
  id: ID;
  userId: ID;
  kind: "subscription" | "pass" | "coins" | "gift" | "consult" | "prematch";
  description: string;
  amountCents: number;
  provider: PaymentProvider;
  status: "succeeded" | "failed" | "refunded";
  createdAt: ISODateTime;
}
export interface CoinOrGiftPurchase {
  id: ID;
  userId: ID;
  item: string;
  coins: number; // positive for packs, 0 for gifts
  quantity: number;
  amountCents: number;
  createdAt: ISODateTime;
}
export interface CurbsideConsultRequest {
  id: ID;
  userId: ID;
  question: string;
  context?: string;
  screenshotUrl?: string;
  priceCents: number;
  status: "submitted" | "in_review" | "answered";
  createdAt: ISODateTime;
  respondBy: ISODateTime;
  response?: string;
  respondedAt?: ISODateTime;
}
export interface AccountDeletionRequest {
  id: ID;
  contact: string;
  reason: string;
  status: "new" | "processing" | "completed";
  notes: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/* ------------------------------ Content / CMS ----------------------------- */
export interface CmsPage { slug: string; title: string; body: string; updatedAt: ISODateTime }

/* --------------------------------- Settings -------------------------------- */
export interface AppSettings {
  matchExpiryDays: number;
  videoEnabled: boolean;
  contentFilter: "standard" | "strict" | "off";
  blurImages: boolean;
  filterWords: boolean;
  /** Developer control: pretend it is this time (HH:MM) to demo quiet hours */
  simulatedTime: string | null;
}
export interface Wallet { coins: number; preMatchCredits: number; superLikes: number }

/* ----------------------------- Database snapshot --------------------------- */
export interface Session { userId: ID | null; phone?: string; onboardingComplete: boolean; adminEmail: string | null }

export interface Db {
  version: number;
  session: Session;
  members: MemberRecord[];
  likes: Like[];
  passes: Pass[];
  matches: Match[];
  conversations: Conversation[];
  messages: Message[];
  microDates: MicroDate[];
  notifications: Notification[];
  reports: Report[];
  blocks: BlockRecord[];
  subscriptions: Subscription[];
  payments: Payment[];
  coinPurchases: CoinOrGiftPurchase[];
  consults: CurbsideConsultRequest[];
  deletionRequests: AccountDeletionRequest[];
  adminActions: AdminAction[];
  content: CmsPage[];
  settings: Record<ID, AppSettings>;
  wallets: Record<ID, Wallet>;
}
