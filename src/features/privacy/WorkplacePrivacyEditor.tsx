import { useMemo } from "react";
import { EyeOff, Info } from "lucide-react";
import type { WorkplacePrivacy } from "@/types";
import { FACILITIES, facilityById } from "@/data/facilities";
import { distanceMiles } from "@/lib/geo";
import { cn } from "@/lib/cn";
import { MockMap } from "@/components/MockMap";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { useApp } from "@/context/AppContext";

/**
 * Workplace privacy + mock geofence: choose facilities to hide from and a radius (default 1 mile).
 * Everything runs on mock coordinates — no real geolocation, no real geofencing.
 */
export function WorkplacePrivacyEditor({ value, onChange, workplaceFacilityId, selfId }: {
  value: WorkplacePrivacy; onChange: (v: WorkplacePrivacy) => void; workplaceFacilityId?: string; selfId?: string;
}) {
  const { db } = useApp();
  const selected = value.hiddenFacilityIds.length ? value.hiddenFacilityIds : workplaceFacilityId ? [workplaceFacilityId] : [];
  const center = facilityById(selected[0]) ?? facilityById(workplaceFacilityId) ?? FACILITIES[0];

  const points = useMemo(() => db.members.filter((m) => m.user.id !== selfId && m.user.role === "member").map((m) => ({
    id: m.user.id, lat: m.profile.location.lat, lng: m.profile.location.lng,
    hidden: value.enabled && selected.some((fid) => { const f = facilityById(fid); return !!f && distanceMiles(f, m.profile.location) <= value.radiusMiles; }),
  })), [db.members, selfId, value.enabled, value.radiusMiles, selected.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  const hidden = points.filter((p) => p.hidden).length;

  const toggleFacility = (id: string) => {
    const base = value.hiddenFacilityIds;
    onChange({ ...value, hiddenFacilityIds: base.includes(id) ? base.filter((x) => x !== id) : [...base, id] });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-2xl bg-brand-50 p-4 text-sm text-brand-900">
        <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <p><strong>Hide your profile near your workplace to protect your professional privacy.</strong> People who live inside the radius won't see you in Discovery — and you won't see them.</p>
      </div>
      <Toggle label="Enable workplace privacy" description="You can turn this off any time." checked={value.enabled} onChange={(enabled) => onChange({ ...value, enabled, hiddenFacilityIds: enabled && !value.hiddenFacilityIds.length && workplaceFacilityId ? [workplaceFacilityId] : value.hiddenFacilityIds })} />

      <div className={cn("space-y-5 transition-opacity", !value.enabled && "pointer-events-none opacity-50")} aria-disabled={!value.enabled}>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Workplaces and facility areas to hide from</legend>
          <div className="flex flex-wrap gap-2">
            {FACILITIES.map((f) => {
              const on = selected.includes(f.id);
              return (
                <button key={f.id} type="button" aria-pressed={on} onClick={() => toggleFacility(f.id)} className={cn("rounded-full border px-3.5 py-2 text-left text-xs font-semibold transition-all", on ? "border-coral-400 bg-coral-50 text-coral-700" : "border-cream-200 bg-white text-ink-soft hover:border-coral-200")}>
                  {on && <EyeOff className="mr-1 inline h-3 w-3" aria-hidden />}{f.name}{f.id === workplaceFacilityId && <span className="ml-1 text-ink-mute">(your workplace)</span>}
                </button>
              );
            })}
          </div>
        </fieldset>
        <Slider label="Privacy radius" value={value.radiusMiles} min={0.25} max={5} step={0.25} onChange={(radiusMiles) => onChange({ ...value, radiusMiles })} format={(v) => `${v} mile${v === 1 ? "" : "s"}`} hint="Default is 1 mile. Larger radii hide more people near work." />
      </div>

      <MockMap center={center} radiusMiles={value.radiusMiles} points={points} label={center.name} />
      <p role="status" className="text-center text-sm font-semibold text-ink-soft">
        {value.enabled ? <>{hidden} nearby {hidden === 1 ? "member is" : "members are"} hidden by your current radius</> : "Workplace privacy is off — you're visible everywhere."}
      </p>
    </div>
  );
}
