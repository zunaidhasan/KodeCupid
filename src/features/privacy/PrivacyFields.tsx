import type { PrivacyToggles } from "@/types";
import { Toggle } from "@/components/ui/Toggle";

const FIELDS: { key: keyof PrivacyToggles; label: string; description: string }[] = [
  { key: "showAge", label: "Show my age", description: "Hide it and people just see your name." },
  { key: "showGender", label: "Show my gender identity", description: "You'll still be matched by your preferences." },
  { key: "showHeight", label: "Show my height", description: "" },
  { key: "showLocation", label: "Show my neighborhood and distance", description: "We never show exact locations." },
  { key: "showWorkplace", label: "Show my workplace name", description: "Your workplace type (e.g. Hospital) always stays visible." },
  { key: "showLifestyle", label: "Show lifestyle badges", description: "Drinking, smoking, cannabis, exercise." },
  { key: "showReligion", label: "Show religion and beliefs", description: "Sensitive — off unless you choose." },
  { key: "showPolitics", label: "Show political views", description: "Sensitive — off unless you choose." },
  { key: "showEthnicity", label: "Show ethnicity / cultural background", description: "Sensitive and optional — self-expression only, never used as a filter." },
];

export function PrivacyFields({ value, onChange }: { value: PrivacyToggles; onChange: (v: PrivacyToggles) => void }) {
  return (
    <div className="divide-y divide-cream-100" role="group" aria-label="Profile field visibility">
      {FIELDS.map((f) => (
        <Toggle key={f.key} label={f.label} description={f.description || undefined} checked={value[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} />
      ))}
    </div>
  );
}
