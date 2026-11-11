import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import { memberToDraft, validateStep, type OnboardingDraft, type StepErrors } from "@/lib/draft";
import { memberService } from "@/services/memberService";
import { useMe } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useDocumentTitle } from "@/hooks";
import { Page, PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SegmentedTabs } from "@/components/ui/Tabs";
import { BasicsStep, DetailsStep, PreferencesStep, PrivacyStep, ProfessionalStep } from "@/features/onboarding/steps";

type Tab = "basics" | "work" | "details" | "prefs" | "privacy";

/** Edit-profile reuses the onboarding step components (progressive disclosure: finish optional fields any time). */
export function EditProfilePage() {
  useDocumentTitle("Edit profile");
  const me = useMe();
  const navigate = useNavigate();
  const toast = useToast();
  const [draft, setDraft] = useState<OnboardingDraft>(() => memberToDraft(me));
  const [tab, setTab] = useState<Tab>("basics");
  const [errors, setErrors] = useState<StepErrors>({});
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<OnboardingDraft>) => { setDraft((d) => ({ ...d, ...patch })); setErrors({}); };
  const dirty = JSON.stringify(memberToDraft(me)) !== JSON.stringify(draft);

  const save = async () => {
    const e1 = validateStep(1, draft); const e2 = validateStep(2, draft); const e5 = validateStep(5, draft);
    const errs = { ...e1, ...e2, ...e5 };
    if (Object.keys(errs).length) { setErrors(errs); setTab(Object.keys(e1).length ? "basics" : Object.keys(e2).length ? "work" : "prefs"); toast.error("Please check your details", "Some required fields need attention."); return; }
    setBusy(true);
    await memberService.saveProfile(me.user.id, draft);
    setBusy(false);
    toast.success("Profile saved");
    navigate("/app/me");
  };

  return (
    <Page className="pb-28">
      <PageHeader title="Edit profile" subtitle="Everything beyond the basics is optional." back="/app/me" />
      <div className="-mx-4 mb-5 overflow-x-auto px-4 scrollbar-hide"><SegmentedTabs label="Profile sections" value={tab} onChange={setTab} items={[{ id: "basics", label: "Basics" }, { id: "work", label: "Work" }, { id: "details", label: "Details" }, { id: "prefs", label: "Preferences" }, { id: "privacy", label: "Privacy" }]} /></div>
      {tab === "basics" && <Card><BasicsStep draft={draft} set={set} errors={errors} /></Card>}
      {tab === "work" && <Card><ProfessionalStep draft={draft} set={set} errors={errors} /></Card>}
      {tab === "details" && <DetailsStep draft={draft} set={set} errors={errors} />}
      {tab === "prefs" && <Card><PreferencesStep draft={draft} set={set} errors={errors} /></Card>}
      {tab === "privacy" && <PrivacyStep draft={draft} set={set} errors={errors} userId={me.user.id} />}

      <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 border-t border-cream-200 bg-white/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-64">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3"><p className="text-sm text-ink-mute">{dirty ? "You have unsaved changes" : "No changes yet"}</p><div className="flex gap-2"><Button variant="ghost" onClick={() => navigate("/app/me")}>Cancel</Button><Button variant="accent" loading={busy} disabled={!dirty} onClick={save} leftIcon={<Save className="h-4 w-4" />}>Save changes</Button></div></div>
      </div>
    </Page>
  );
}
