import { useState, type ReactNode } from "react";
import { Crosshair, Lightbulb, MapPin } from "lucide-react";
import type { ProfessionCategory } from "@/types";
import {
  ALL_GOALS, BODY_TYPES, CATEGORY_OPTIONS, CREDENTIAL_OPTIONS, DRINKING_OPTIONS, EDUCATION_OPTIONS, EXERCISE_OPTIONS, EYE_COLORS,
  FAMILY_OPTIONS, GENDER_OPTIONS, HAIR_COLORS, HOURS, INTERESTED_OPTIONS, INTERESTS, LANGUAGES, POLITICAL_VIEWS, RELIGIONS, SMOKING_OPTIONS,
} from "@/data/options";
import { FACILITIES, NEIGHBORHOODS, facilityById } from "@/data/facilities";
import { ICEBREAKERS } from "@/data/icebreakers";
import { calcAge, formatHour, toISODate } from "@/lib/format";
import { defaultShiftFor, type OnboardingDraft, type StepErrors } from "@/lib/draft";
import { SCHEDULE_META } from "@/lib/schedule";
import { geoProvider } from "@/services/providers";
import { Button } from "@/components/ui/Button";
import { CardChoice, ChipGroup, ChipSelect } from "@/components/ui/Choice";
import { DatePicker } from "@/components/ui/DatePicker";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { PrivacyFields } from "@/features/privacy/PrivacyFields";
import { WorkplacePrivacyEditor } from "@/features/privacy/WorkplacePrivacyEditor";
import { NotificationPrefsEditor } from "@/features/notifications/NotificationPrefsEditor";
import { ScheduleTimeline } from "@/features/schedule/ScheduleTimeline";
import { PhotoManager } from "./PhotoManager";

export interface StepProps { draft: OnboardingDraft; set: (patch: Partial<OnboardingDraft>) => void; errors: StepErrors }
const opts = (list: string[]) => list.map((v) => ({ value: v, label: v }));

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl border border-cream-200 bg-white p-5 shadow-soft">
      <header><h3 className="font-display text-lg font-semibold">{title}</h3>{hint && <p className="text-sm text-ink-mute">{hint}</p>}</header>
      {children}
    </section>
  );
}

/* ---------------------------- Step 1 · Basic identity --------------------------- */
export function BasicsStep({ draft, set, errors }: StepProps) {
  const age = calcAge(draft.dob);
  const valid = !!draft.dob && !Number.isNaN(age);
  const [locating, setLocating] = useState(false);
  const hood = NEIGHBORHOODS.find((n) => n.id === draft.neighborhoodId);
  return (
    <div className="space-y-6">
      <Input label="First name or display name" value={draft.displayName} onChange={(e) => set({ displayName: e.target.value })} error={errors.displayName} autoComplete="given-name" maxLength={40} placeholder="What should people call you?" />
      <div>
        <DatePicker label="Date of birth" value={draft.dob} onChange={(dob) => set({ dob })} max={toISODate(new Date())} min="1920-01-01" error={errors.dob} hint="We use this to calculate your age. KodeCupid is for adults 18+." />
        {valid && age >= 18 && <p role="status" className="mt-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-800">Your age: {age}</p>}
        {valid && age < 18 && <p role="alert" className="mt-2 rounded-2xl bg-coral-50 p-3 text-sm font-medium text-coral-700">Sorry — KodeCupid is only for people 18 and older, so we can't create this account.</p>}
      </div>
      <ChipSelect label="Gender identity" options={GENDER_OPTIONS} value={draft.genderIdentity} onChange={(genderIdentity) => set({ genderIdentity })} error={errors.genderIdentity} />
      {draft.genderIdentity === "custom" && <Input label="How do you describe your gender?" value={draft.genderCustom} onChange={(e) => set({ genderCustom: e.target.value })} error={errors.genderCustom} maxLength={30} />}
      <Toggle label="Show my gender on my profile" description="If off, your gender isn't displayed — you'll still be matched using your preferences." checked={draft.showGender} onChange={(showGender) => set({ showGender })} />
      <ChipSelect label="Interested in" options={INTERESTED_OPTIONS} value={draft.interestedIn} onChange={(interestedIn) => set({ interestedIn })} error={errors.interestedIn} />
      <div className="space-y-3">
        <Select label="Your neighborhood" value={draft.neighborhoodId} onChange={(neighborhoodId) => set({ neighborhoodId })} placeholder="Choose where you're based" options={NEIGHBORHOODS.map((n) => ({ value: n.id, label: `${n.name}, ${n.city}` }))} error={errors.neighborhoodId} hint="Mock locations only — we never use your real GPS in this prototype." />
        <Button variant="soft" size="sm" loading={locating} leftIcon={<Crosshair className="h-4 w-4" />} onClick={async () => { setLocating(true); const g = await geoProvider.getCurrentLocation(); set({ neighborhoodId: g.neighborhoodId }); setLocating(false); }}>Use mock location permission</Button>
        {hood && <p className="flex items-center gap-1.5 text-sm text-ink-soft"><MapPin className="h-4 w-4 text-coral-500" aria-hidden />{hood.name}, {hood.city}</p>}
      </div>
    </div>
  );
}

/* -------------------------- Step 2 · Professional identity ------------------------- */
export function ProfessionalStep({ draft, set, errors }: StepProps) {
  const fac = facilityById(draft.facilityId);
  const sched = SCHEDULE_META[draft.schedule];
  const hint: Record<ProfessionCategory, string> = { healthcare: "e.g. ICU Registered Nurse", education: "e.g. 5th Grade Teacher", college: "e.g. Associate Professor", science: "e.g. Research Scientist", other: "e.g. Program Coordinator" };
  return (
    <div className="space-y-6">
      <CardChoice label="Profession category" value={draft.category} onChange={(category) => set({ category })} error={errors.category}
        options={CATEGORY_OPTIONS.map((c) => ({ value: c.value, title: c.label, description: c.hint, icon: c.emoji }))} />
      <Input label="Job title / specialty" optional value={draft.jobTitle} onChange={(e) => set({ jobTitle: e.target.value })} placeholder={draft.category ? hint[draft.category] : "What do you do?"} />
      <Input label="Focus or subspecialty" optional value={draft.specialty} onChange={(e) => set({ specialty: e.target.value })} placeholder="e.g. Critical Care, Microbiology, School leadership" />
      <Select label="Workplace" optional value={draft.facilityId} onChange={(id) => { const f = facilityById(id); set({ facilityId: id, workplaceName: f?.name ?? draft.workplaceName }); }} placeholder="Pick from the mock directory" options={FACILITIES.map((f) => ({ value: f.id, label: `${f.name} — ${f.type}` }))} hint="Used for workplace privacy and suggesting micro-date spots." />
      <Input label="Workplace or organization name" optional value={draft.workplaceName} onChange={(e) => set({ workplaceName: e.target.value, facilityId: fac && e.target.value !== fac.name ? "" : draft.facilityId })} placeholder="Not in the list? Type it here" />

      <CardChoice label="Work schedule" columns={2} value={draft.schedule} onChange={(schedule) => set({ schedule, ...defaultShiftFor(schedule) })}
        options={(Object.keys(SCHEDULE_META) as (keyof typeof SCHEDULE_META)[]).map((k) => ({ value: k, title: SCHEDULE_META[k].label, description: SCHEDULE_META[k].description, icon: SCHEDULE_META[k].emoji }))} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Typical shift start" value={String(draft.shiftStart)} onChange={(v) => set({ shiftStart: Number(v) })} options={HOURS} />
        <Select label="Typical shift end" value={String(draft.shiftEnd)} onChange={(v) => set({ shiftEnd: Number(v) })} options={HOURS} />
      </div>
      <div className="rounded-3xl bg-cream-100 p-4">
        <p className="mb-3 text-sm text-ink-soft"><strong>{sched.label}</strong> · {formatHour(draft.shiftStart)} – {formatHour(draft.shiftEnd)}. Here's what a typical day looks like — we use it to find people whose free time overlaps yours.</p>
        <ScheduleTimeline p={draft} />
      </div>
    </div>
  );
}

/* ------------------------------ Step 4 · Profile details ----------------------------- */
const HEIGHTS = Array.from({ length: 36 }, (_, i) => 140 + i * 2).map((cm) => { const inch = Math.round(cm / 2.54); return { value: String(cm), label: `${Math.floor(inch / 12)}′${inch % 12}″ (${cm} cm)` }; });

export function DetailsStep({ draft, set }: StepProps) {
  const [open, setOpen] = useState<string | null>(null);
  const answer = (id: string) => draft.icebreakers.find((i) => i.promptId === id)?.answer ?? "";
  const setAnswer = (id: string, text: string) => set({ icebreakers: [...draft.icebreakers.filter((i) => i.promptId !== id), { promptId: id, answer: text }].filter((i) => i.answer !== "" || i.promptId === id) });
  return (
    <div className="space-y-5">
      <p className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-900">Everything on this page is <strong>optional</strong>. Add what feels right now — you can always come back from your profile.</p>
      <Section title="Photos" hint="Profiles with 3+ photos get more matches. Upload or pick placeholders.">
        <PhotoManager photos={draft.photos} onChange={(photos) => set({ photos })} seed={draft.displayName || "me"} />
      </Section>
      <Section title="About you">
        <Textarea label="Bio" optional value={draft.bio} onChange={(e) => set({ bio: e.target.value })} maxLength={500} counter={500} placeholder="What's a perfect day off? What are you looking for?" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Height" optional value={draft.heightCm === "" ? "" : String(draft.heightCm)} onChange={(v) => set({ heightCm: v ? Number(v) : "" })} placeholder="Choose" options={HEIGHTS} />
          <Select label="Body type" optional value={draft.bodyType} onChange={(bodyType) => set({ bodyType })} placeholder="Choose" options={opts(BODY_TYPES)} />
          <Select label="Hair color" optional value={draft.hairColor} onChange={(hairColor) => set({ hairColor })} placeholder="Choose" options={opts(HAIR_COLORS)} />
          <Select label="Eye color" optional value={draft.eyeColor} onChange={(eyeColor) => set({ eyeColor })} placeholder="Choose" options={opts(EYE_COLORS)} />
        </div>
        <ChipGroup label="Languages spoken" options={opts(LANGUAGES)} value={draft.languages} onChange={(languages) => set({ languages })} />
      </Section>
      <Section title="Education & credentials">
        <Select label="Education level" optional value={draft.educationLevel} onChange={(v) => set({ educationLevel: v as OnboardingDraft["educationLevel"] })} placeholder="Choose" options={EDUCATION_OPTIONS} />
        <ChipGroup label="Degrees and credentials" optional options={opts(CREDENTIAL_OPTIONS)} value={draft.credentials} onChange={(credentials) => set({ credentials })} />
      </Section>
      <Section title="Beliefs & background" hint="Optional and self-expressive. These are never used to filter or exclude anyone, and you control whether they're visible.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Religion and beliefs" optional value={draft.religion} onChange={(religion) => set({ religion })} placeholder="Choose" options={opts(RELIGIONS)} />
          <Select label="Political views" optional value={draft.politicalViews} onChange={(politicalViews) => set({ politicalViews })} placeholder="Choose" options={opts(POLITICAL_VIEWS)} />
        </div>
        <Input label="Ethnicity / cultural background" optional value={draft.ethnicity} onChange={(e) => set({ ethnicity: e.target.value })} maxLength={60} placeholder="In your own words" hint="Shown only if you turn it on in Privacy settings." />
      </Section>
      <Section title="Lifestyle">
        <ChipSelect label="Drinking" optional clearable options={DRINKING_OPTIONS} value={draft.drinking} onChange={(drinking) => set({ drinking })} />
        <ChipSelect label="Smoking / vaping" optional clearable options={SMOKING_OPTIONS} value={draft.smoking} onChange={(smoking) => set({ smoking })} />
        <ChipSelect label="Cannabis" optional clearable options={SMOKING_OPTIONS} value={draft.cannabis} onChange={(cannabis) => set({ cannabis })} />
        <ChipSelect label="Exercise" optional clearable options={EXERCISE_OPTIONS} value={draft.exercise} onChange={(exercise) => set({ exercise })} />
        <ChipGroup label="Interests" optional max={8} hint="Pick up to 8 — they power your compatibility estimate." options={opts(INTERESTS)} value={draft.interests} onChange={(interests) => set({ interests })} />
      </Section>
      <Section title="Icebreakers" hint="Answer one or more. They show on your profile and give matches an easy way to start chatting.">
        <ul className="space-y-3">
          {ICEBREAKERS.map((p) => {
            const a = answer(p.id);
            const shown = open === p.id || !!a;
            return (
              <li key={p.id} className="rounded-2xl border border-cream-200 p-4">
                <p className="flex items-start gap-2 text-sm font-semibold"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" aria-hidden />{p.text}</p>
                {shown ? (
                  <div className="mt-3"><Textarea label="Your answer" className="min-h-20" value={a} onChange={(e) => setAnswer(p.id, e.target.value)} maxLength={160} counter={160} onBlur={() => { if (!a) { setOpen(null); set({ icebreakers: draft.icebreakers.filter((i) => i.promptId !== p.id) }); } }} autoFocus={open === p.id} /></div>
                ) : <Button variant="soft" size="sm" className="mt-3" onClick={() => setOpen(p.id)}>Answer this</Button>}
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}

/* ------------------------- Step 5 · Relationship preferences ------------------------- */
export function PreferencesStep({ draft, set, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <ChipGroup label="I'm looking for" hint="Choose as many as fit. Friendship counts!" options={ALL_GOALS} value={draft.lookingFor} onChange={(lookingFor) => set({ lookingFor })} />
      <Select label="Family plans / kids" optional value={draft.familyPlans} onChange={(v) => set({ familyPlans: v as OnboardingDraft["familyPlans"] })} placeholder="Choose" options={FAMILY_OPTIONS} />
      <div className="space-y-4 rounded-3xl bg-cream-100 p-4">
        <Slider label="Minimum age" value={draft.ageMin} min={18} max={80} onChange={(ageMin) => set({ ageMin, ageMax: Math.max(ageMin, draft.ageMax) })} />
        <Slider label="Maximum age" value={draft.ageMax} min={18} max={90} onChange={(ageMax) => set({ ageMax, ageMin: Math.min(ageMax, draft.ageMin) })} />
        {errors.ageMin && <p role="alert" className="text-xs font-medium text-coral-700">{errors.ageMin}</p>}
      </div>
      <Slider label="Maximum distance" value={draft.maxDistanceMiles} min={5} max={100} step={5} onChange={(maxDistanceMiles) => set({ maxDistanceMiles })} format={(v) => `${v} miles`} />
      <ChipGroup<ProfessionCategory> label="Preferred professions" optional hint="Leave empty to see everyone eligible." options={CATEGORY_OPTIONS.filter((c) => c.value !== "other").map((c) => ({ value: c.value, label: c.label }))} value={draft.preferredProfessions} onChange={(preferredProfessions) => set({ preferredProfessions })} />
    </div>
  );
}

/* ------------------------ Step 6 · Privacy & notifications --------------------------- */
export function PrivacyStep({ draft, set, userId }: StepProps & { userId?: string }) {
  return (
    <div className="space-y-5">
      <Section title="What others can see" hint="Sensitive fields are off by default. You can change this any time.">
        <PrivacyFields value={{ ...draft.privacy, showGender: draft.showGender }} onChange={(privacy) => set({ privacy, showGender: privacy.showGender })} />
      </Section>
      <Section title="Workplace privacy"><WorkplacePrivacyEditor value={draft.workplacePrivacy} onChange={(workplacePrivacy) => set({ workplacePrivacy })} workplaceFacilityId={draft.facilityId || undefined} selfId={userId} /></Section>
      <Section title="Notifications & quiet hours"><NotificationPrefsEditor value={draft.notificationPrefs} onChange={(notificationPrefs) => set({ notificationPrefs })} schedule={draft.schedule} /></Section>
    </div>
  );
}
