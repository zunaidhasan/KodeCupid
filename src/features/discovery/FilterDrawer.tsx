import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import type { MemberRecord, ProfessionCategory } from "@/types";
import { ALL_GOALS, CATEGORY_OPTIONS, DRINKING_OPTIONS, EDUCATION_OPTIONS, EXERCISE_OPTIONS, LANGUAGES, SMOKING_OPTIONS, SPECIALTY_FILTERS } from "@/data/options";
import { DEFAULT_FILTERS, discoveryCandidates, type DiscoveryFilters } from "@/services/selectors";
import { useApp } from "@/context/AppContext";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { ChipGroup, ChipSelect } from "@/components/ui/Choice";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { UpgradePrompt } from "@/features/billing/UpgradePrompt";

export function FilterDrawer({ open, onClose, me, filters, onApply }: { open: boolean; onClose: () => void; me: MemberRecord; filters: DiscoveryFilters; onApply: (f: DiscoveryFilters) => void }) {
  const { db, entitlements } = useApp();
  const [f, setF] = useState(filters);
  useEffect(() => { if (open) setF(filters); }, [open, filters]);
  const set = (p: Partial<DiscoveryFilters>) => setF((cur) => ({ ...cur, ...p }));
  const count = useMemo(() => (open ? discoveryCandidates(db, me, f).candidates.length : 0), [open, db, me, f]);
  const opt = <T extends string>(list: { value: T; label: string }[]) => list;

  return (
    <BottomSheet open={open} onClose={onClose} title="Filters" description="Refine who you see in Discovery."
      footer={entitlements.canBrowse ? <div className="flex gap-2"><Button variant="ghost" onClick={() => setF(DEFAULT_FILTERS)}>Reset</Button><Button className="flex-1" variant="accent" onClick={() => { onApply(f); onClose(); }}>Show {count} {count === 1 ? "profile" : "profiles"}</Button></div> : undefined}>
      {!entitlements.canBrowse ? (
        <UpgradePrompt compact title="Search and filters are a Silver feature" description="Free members get one curated weekly pick and can't search member profiles. Upgrade to browse and filter everyone." />
      ) : (
        <div className="space-y-6 pb-2">
          <Slider label="Distance" value={f.maxDistance} min={5} max={100} step={5} onChange={(maxDistance) => set({ maxDistance })} format={(v) => `${v} mi`} />
          <div className="space-y-3">
            <Slider label="Min age" value={f.ageMin} min={18} max={80} onChange={(ageMin) => set({ ageMin, ageMax: Math.max(ageMin, f.ageMax) })} />
            <Slider label="Max age" value={f.ageMax} min={18} max={90} onChange={(ageMax) => set({ ageMax, ageMin: Math.min(ageMax, f.ageMin) })} />
          </div>
          <ChipGroup<ProfessionCategory> label="Profession category" options={CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: c.label }))} value={f.categories} onChange={(categories) => set({ categories })} />
          <Select label="Specialty" value={f.specialty} onChange={(specialty) => set({ specialty })} options={SPECIALTY_FILTERS.map((s) => ({ value: s, label: s }))} />
          <Select label="Relationship goal" value={f.goal} onChange={(goal) => set({ goal: goal as DiscoveryFilters["goal"] })} placeholder="Any" options={ALL_GOALS} />
          <ChipSelect label="Schedule compatibility" value={f.schedule === "any" ? "" : f.schedule} onChange={(v) => set({ schedule: (v || "any") as DiscoveryFilters["schedule"] })} clearable options={[{ value: "some", label: "Some overlap or better" }, { value: "great", label: "Great overlap only" }]} hint="Shift-aware: compares work patterns and free hours." />
          <Select label="Education" value={f.education} onChange={(education) => set({ education: education as DiscoveryFilters["education"] })} placeholder="Any" options={EDUCATION_OPTIONS} />
          <div className="space-y-4 rounded-3xl bg-cream-100 p-4">
            <p className="text-sm font-semibold">Lifestyle</p>
            <ChipSelect label="Drinking" clearable options={opt(DRINKING_OPTIONS)} value={f.drinking} onChange={(drinking) => set({ drinking })} />
            <ChipSelect label="Smoking / vaping" clearable options={opt(SMOKING_OPTIONS)} value={f.smoking} onChange={(smoking) => set({ smoking })} />
            <ChipSelect label="Exercise" clearable options={opt(EXERCISE_OPTIONS)} value={f.exercise} onChange={(exercise) => set({ exercise })} />
          </div>
          <Select label="Language spoken" optional value={f.language} onChange={(language) => set({ language })} placeholder="Any" options={LANGUAGES.map((l) => ({ value: l, label: l }))} />
          <Toggle label="Verified professionals only" checked={f.verifiedOnly} onChange={(verifiedOnly) => set({ verifiedOnly })} />
          <p className="flex items-start gap-2 rounded-2xl bg-brand-50 p-3 text-xs text-brand-900"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />KodeCupid doesn't offer filters for race, ethnicity or religion. Those fields are optional self-expression only.</p>
        </div>
      )}
    </BottomSheet>
  );
}
