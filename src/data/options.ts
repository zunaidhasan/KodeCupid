import type {
  DrinkingHabit, EducationLevel, ExerciseHabit, FamilyPlans, GenderIdentity, InterestedIn,
  ProfessionCategory, RelationshipGoal, ReportCategory, SmokingHabit,
} from "@/types";

type Opt<T extends string> = { value: T; label: string };

export const GENDER_OPTIONS: Opt<GenderIdentity>[] = [
  { value: "man", label: "Man" },
  { value: "woman", label: "Woman" },
  { value: "non-binary", label: "Non-binary" },
  { value: "transgender", label: "Transgender" },
  { value: "agender", label: "Agender" },
  { value: "genderfluid", label: "Genderfluid" },
  { value: "custom", label: "Custom" },
];

export const INTERESTED_OPTIONS: Opt<InterestedIn>[] = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "non-binary", label: "Non-binary people" },
  { value: "everyone", label: "Everyone" },
];

export const CATEGORY_OPTIONS: (Opt<ProfessionCategory> & { hint: string; emoji: string })[] = [
  { value: "healthcare", label: "Healthcare", hint: "Physicians, nurses, PAs, pharmacists, therapists, EMTs, vets, administrators", emoji: "🩺" },
  { value: "education", label: "Education", hint: "Teachers, principals, superintendents, school staff", emoji: "🍎" },
  { value: "college", label: "College / University", hint: "Professors, deans, researchers, university staff", emoji: "🎓" },
  { value: "science", label: "Science / Public Health", hint: "Researchers, epidemiologists, lab and field scientists", emoji: "🔬" },
  { value: "other", label: "Other eligible professional", hint: "Related roles reviewed by our team", emoji: "✨" },
];

export const ALL_GOALS: Opt<RelationshipGoal>[] = [
  { value: "marriage", label: "Marriage" },
  { value: "serious", label: "Serious relationship" },
  { value: "partner", label: "Partner" },
  { value: "long_term", label: "Long-term relationship" },
  { value: "companion", label: "Companion" },
  { value: "casual", label: "Dating casually" },
  { value: "short_term", label: "Short-term fun" },
  { value: "friend", label: "Friend" },
  { value: "new_friends", label: "New friends" },
  { value: "travel", label: "Travel companion" },
  { value: "lunch", label: "Lunch buddy" },
  { value: "work_friend", label: "Work friend" },
  { value: "figuring_out", label: "Still figuring it out" },
];

export const FAMILY_OPTIONS: Opt<FamilyPlans>[] = [
  { value: "want", label: "Want kids someday" },
  { value: "have_want_more", label: "Have kids, want more" },
  { value: "have_done", label: "Have kids, done" },
  { value: "dont_want", label: "Don't want kids" },
  { value: "open", label: "Open to kids" },
  { value: "unsure", label: "Not sure yet" },
];

export const EDUCATION_OPTIONS: Opt<EducationLevel>[] = [
  { value: "high_school", label: "High school" },
  { value: "some_college", label: "Some college" },
  { value: "bachelors", label: "Bachelor's degree" },
  { value: "masters", label: "Master's degree" },
  { value: "doctorate", label: "Doctorate (PhD, EdD…)" },
  { value: "professional", label: "Professional degree (MD, DO, PharmD…)" },
];

export const CREDENTIAL_OPTIONS = [
  "MD", "DO", "PhD", "MBA", "DHA", "DPT", "PharmD", "DNP", "NP", "RN", "BSN", "PA-C", "MS", "MSN", "MPH", "M.Ed", "EdD", "LMFT", "PsyD", "DVM", "EMT-P",
];

export const BODY_TYPES = ["Slim", "Athletic", "Average", "Curvy", "Muscular", "A few extra pounds", "Prefer not to say"];
export const HAIR_COLORS = ["Black", "Brown", "Blonde", "Red", "Auburn", "Gray / silver", "Dyed", "Bald / shaved"];
export const EYE_COLORS = ["Brown", "Hazel", "Green", "Blue", "Gray", "Amber"];
export const LANGUAGES = ["English", "Spanish", "Mandarin", "Hindi", "Arabic", "French", "Russian", "Japanese", "Korean", "Portuguese", "ASL", "Tagalog"];
export const RELIGIONS = ["Agnostic", "Atheist", "Buddhist", "Christian", "Hindu", "Jewish", "Muslim", "Spiritual", "Sikh", "Other", "Prefer not to say"];
export const POLITICAL_VIEWS = ["Liberal", "Moderate", "Conservative", "Apolitical", "Other", "Prefer not to say"];

export const DRINKING_OPTIONS: Opt<DrinkingHabit>[] = [
  { value: "never", label: "Never" }, { value: "rarely", label: "Rarely" },
  { value: "socially", label: "Socially" }, { value: "regularly", label: "Regularly" },
];
export const SMOKING_OPTIONS: Opt<SmokingHabit>[] = [
  { value: "never", label: "Never" }, { value: "quitting", label: "Trying to quit" },
  { value: "socially", label: "Socially" }, { value: "regularly", label: "Regularly" },
];
export const EXERCISE_OPTIONS: Opt<ExerciseHabit>[] = [
  { value: "rarely", label: "Rarely" }, { value: "sometimes", label: "Sometimes" },
  { value: "regularly", label: "Regularly" }, { value: "daily", label: "Daily" },
];

export const INTERESTS = [
  "Hiking", "Cooking", "Live music", "Board games", "Running", "Yoga", "Travel", "Reading", "Podcasts", "Dogs",
  "Cats", "Coffee", "Climbing", "Photography", "Gardening", "Baking", "Sci-fi", "Skiing", "Art museums", "Trivia",
];

export const SPECIALTY_FILTERS = [
  "Any", "Emergency Medicine", "Critical Care", "Internal Medicine", "Pediatrics", "Mental health", "Pharmacy", "Elementary education",
  "Secondary education", "School leadership", "Higher education", "Research", "Public health",
];

export const REPORT_CATEGORIES: (Opt<ReportCategory> & { hint: string })[] = [
  { value: "harassment", label: "Harassment or hate speech", hint: "Bullying, slurs, or targeted insults" },
  { value: "sexual_content", label: "Sexual content", hint: "Explicit photos or unwanted sexual messages" },
  { value: "scam", label: "Scam or impersonation", hint: "Asking for money, or pretending to be someone else" },
  { value: "fake_profile", label: "Fake profile", hint: "Profile doesn't seem to be a real professional" },
  { value: "inappropriate_message", label: "Inappropriate message", hint: "A message that made you uncomfortable" },
  { value: "threat", label: "Threat or violence", hint: "Threats of harm to you or anyone else" },
  { value: "other", label: "Other", hint: "Something else we should know about" },
];

export const REPORT_LABEL: Record<ReportCategory, string> = Object.fromEntries(
  REPORT_CATEGORIES.map((c) => [c.value, c.label])
) as Record<ReportCategory, string>;

export const HOURS = Array.from({ length: 24 }, (_, h) => ({
  value: String(h),
  label: `${h % 12 === 0 ? 12 : h % 12}:00 ${h >= 12 ? "PM" : "AM"}`,
}));
