import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Cloud } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ProfileCard } from "@/components/ProfileCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useDocumentTitle, useLocalStorage } from "@/hooks";
import { draftToMember, emptyDraft, profileCompletion, validateStep, type OnboardingDraft, type StepErrors } from "@/lib/draft";
import { matchScore } from "@/lib/matchScore";
import { scheduleCompatibility } from "@/lib/schedule";
import { distanceMiles } from "@/lib/geo";
import { memberService } from "@/services/memberService";
import { VerificationPanel } from "./VerificationPanel";
import { BasicsStep, DetailsStep, PreferencesStep, PrivacyStep, ProfessionalStep } from "./steps";
import { cn } from "@/lib/cn";

const STEPS = [
  { title: "About you", subtitle: "Just the basics — about a minute.", optional: false },
  { title: "Your profession", subtitle: "What you do and when you work.", optional: false },
  { title: "Get verified", subtitle: "Verified members earn more trust.", optional: true },
  { title: "Profile details", subtitle: "Optional — add now or later.", optional: true },
  { title: "What you're looking for", subtitle: "Goals, ages and distance.", optional: true },
  { title: "Privacy & notifications", subtitle: "You're in control.", optional: true },
  { title: "Preview", subtitle: "One last look before you enter.", optional: false },
];

interface Saved { step: number; draft: OnboardingDraft }

export function OnboardingPage() {
  useDocumentTitle("Set up your profile");
  const { session, db } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const [saved, setSaved, clear] = useLocalStorage<Saved>("kodecupid.onboarding", { step: 1, draft: emptyDraft() });
  const [errors, setErrors] = useState<StepErrors>({});
  const [busy, setBusy] = useState(false);
  const { step } = saved;
  // Merge with defaults so drafts saved by older versions (or partial drafts) never crash the wizard
  const draft = useMemo<OnboardingDraft>(() => ({ ...emptyDraft(), ...saved.draft }), [saved.draft]);

  const preview = useMemo(() => (step === 7 && session.userId ? draftToMember(draft, session.userId, session.phone ?? "") : null), [step, draft, session.userId, session.phone]);

  if (!session.userId) return <Navigate to="/signup" replace />;
  if (session.onboardingComplete) return <Navigate to="/app" replace />;

  const set = (patch: Partial<OnboardingDraft>) => { setSaved((s) => ({ ...s, draft: { ...emptyDraft(), ...s.draft, ...patch } })); setErrors({}); };
  const go = (n: number) => { setSaved((s) => ({ ...s, step: n })); setErrors({}); window.scrollTo({ top: 0 }); };
  const next = () => {
    const errs = validateStep(step, draft);
    if (Object.keys(errs).length) { setErrors(errs); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    go(step + 1);
  };
  const finish = async () => {
    setBusy(true);
    try { await memberService.completeOnboarding(draft); clear(); toast.success("Welcome to KodeCupid! 🎉", "Your profile is live."); navigate("/app", { replace: true }); }
    catch (e) { toast.error("Something went wrong", (e as Error).message); setBusy(false); }
  };

  const meta = STEPS[step - 1];
  const pct = Math.round((step / STEPS.length) * 100);
  const verStatus = draft.verification.status;

  return (
    <div className="min-h-dvh bg-cream pb-32">
      <header className="sticky top-0 z-20 border-b border-cream-200 bg-cream/95 pt-safe backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3"><Logo /><span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-mute"><Cloud className="h-3.5 w-3.5" aria-hidden />Progress saved on this device</span></div>
        <div className="h-1.5 bg-cream-200" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step} aria-label={`Step ${step} of ${STEPS.length}`}><div className="h-full bg-gradient-to-r from-brand-600 to-coral-500 transition-all duration-500" style={{ width: `${pct}%` }} /></div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-coral-600">Step {step} of {STEPS.length}{meta.optional && step < 7 ? " · Optional" : ""}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{meta.title}</h1>
        <p className="mt-1 text-ink-soft">{meta.subtitle}</p>
        {step <= 2 && <ol className="mt-4 flex gap-1.5" aria-hidden>{STEPS.map((_, i) => <li key={i} className={cn("h-1.5 flex-1 rounded-full", i < step ? "bg-brand-600" : "bg-cream-200")} />)}</ol>}
        {Object.keys(errors).length > 0 && <p role="alert" className="mt-4 rounded-2xl bg-coral-50 p-3 text-sm font-semibold text-coral-700">Almost there — please check the highlighted fields below.</p>}

        <div className="mt-6">
          {step === 1 && <Card><BasicsStep draft={draft} set={set} errors={errors} /></Card>}
          {step === 2 && <Card><ProfessionalStep draft={draft} set={set} errors={errors} /></Card>}
          {step === 3 && (
            <Card>
              <VerificationPanel
                status={verStatus} method={draft.verification.method}
                onSubmit={(s) => set({ verification: { ...draft.verification, method: s.method, npi: s.npi ?? "", npiLookup: s.npiLookup, credentialUrl: s.credentialUrl, credentialLabel: s.credentialLabel ?? "Work ID badge", status: "pending" } })}
                onDemoSkip={() => set({ verification: { ...draft.verification, method: "demo", status: "verified" } })}
                onReset={() => set({ verification: { ...draft.verification, method: undefined, status: "unverified" } })}
                history={verStatus !== "unverified" ? [{ at: new Date().toISOString(), status: verStatus, note: verStatus === "verified" ? "Demo verification" : "Submitted", by: "member" }] : []}
              />
            </Card>
          )}
          {step === 4 && <DetailsStep draft={draft} set={set} errors={errors} />}
          {step === 5 && <Card><PreferencesStep draft={draft} set={set} errors={errors} /></Card>}
          {step === 6 && <PrivacyStep draft={draft} set={set} errors={errors} userId={session.userId} />}
          {step === 7 && preview && (() => {
            const demo = db.members[0];
            const cand = { member: preview, score: matchScore(preview, demo), schedule: scheduleCompatibility(preview.professional, demo.professional), distance: distanceMiles(preview.profile.location, demo.profile.location) };
            const comp = profileCompletion(preview);
            return (
              <div className="space-y-5">
                <ProfileCard candidate={cand} />
                <Card tone="cream">
                  <div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Profile strength</h2><span className="text-xl font-bold text-brand-700">{comp.percent}%</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-brand-600" style={{ width: `${comp.percent}%` }} /></div>
                  {comp.todo.length > 0 && <><p className="mt-3 text-sm text-ink-soft">You can finish these later — we'll nudge you gently:</p><ul className="mt-2 flex flex-wrap gap-2">{comp.todo.map((t) => <li key={t.id} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-soft">{t.label}</li>)}</ul></>}
                </Card>
                <p className="flex items-center gap-2 text-sm text-ink-soft"><CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />This is how your profile appears in Discovery (respecting your privacy choices).</p>
              </div>
            );
          })()}
        </div>
      </main>

      <nav aria-label="Wizard navigation" className="fixed inset-x-0 bottom-0 z-20 border-t border-cream-200 bg-white/95 pb-safe backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4">
          <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 1} aria-label="Back" leftIcon={<ArrowLeft className="h-4 w-4" />}><span className="hidden sm:inline">Back</span></Button>
          {step < 7 ? (
            <div className="flex items-center gap-2">
              {meta.optional && !(step === 3 && verStatus !== "unverified") && <Button variant="secondary" onClick={() => go(step + 1)}>Skip for now</Button>}
              <Button variant="accent" onClick={next} rightIcon={<ArrowRight className="h-4 w-4" />}>Continue</Button>
            </div>
          ) : <Button variant="accent" size="lg" loading={busy} onClick={finish}>Enter KodeCupid</Button>}
        </div>
      </nav>
    </div>
  );
}
