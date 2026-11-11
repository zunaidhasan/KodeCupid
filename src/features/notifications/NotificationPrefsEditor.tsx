import { BellOff, Moon, Sun } from "lucide-react";
import type { NotificationPrefs, WorkSchedule } from "@/types";
import { QUIET_PRESETS } from "@/lib/quietHours";
import { cn } from "@/lib/cn";
import { Toggle } from "@/components/ui/Toggle";
import { Badge } from "@/components/ui/Badge";

const timeInput = "h-12 w-full rounded-2xl border border-cream-200 bg-white px-4 text-[15px] focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";

/** Notification toggles + shift-aware quiet hours (night-shift vs standard presets). */
export function NotificationPrefsEditor({ value, onChange, schedule }: { value: NotificationPrefs; onChange: (v: NotificationPrefs) => void; schedule: WorkSchedule }) {
  const q = value.quietHours;
  const setQ = (patch: Partial<typeof q>) => onChange({ ...value, quietHours: { ...q, ...patch } });
  const suggested = schedule === "nights" ? "night_shift" : "standard";
  return (
    <div className="space-y-6">
      <div className="divide-y divide-cream-100">
        <Toggle label="Push notifications (mock)" description="Prototype only — shown as in-app banners, never real OS notifications." checked={value.push} onChange={(push) => onChange({ ...value, push })} />
        <Toggle label="New matches" checked={value.matches} onChange={(matches) => onChange({ ...value, matches })} />
        <Toggle label="Messages" checked={value.messages} onChange={(messages) => onChange({ ...value, messages })} />
        <Toggle label="Likes" checked={value.likes} onChange={(likes) => onChange({ ...value, likes })} />
        <Toggle label="Micro-date invitations" checked={value.dates} onChange={(dates) => onChange({ ...value, dates })} />
      </div>

      <div className="rounded-3xl border border-cream-200 bg-cream p-5">
        <Toggle label="Quiet hours" description="Notifications are held and delivered after your quiet window ends." checked={q.enabled} onChange={(enabled) => setQ({ enabled })} />
        <div className={cn("mt-3 space-y-4", !q.enabled && "pointer-events-none opacity-50")}>
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Quiet hours preset">
            {(["night_shift", "standard"] as const).map((k) => {
              const p = QUIET_PRESETS[k];
              const on = q.preset === k;
              return (
                <button key={k} type="button" role="radio" aria-checked={on} onClick={() => setQ({ preset: k, start: p.start, end: p.end })} className={cn("rounded-2xl border p-3 text-left transition-all", on ? "border-brand-600 bg-white ring-2 ring-brand-200" : "border-cream-200 bg-white hover:border-brand-300")}>
                  <span className="flex items-center gap-1.5 text-sm font-semibold">{k === "night_shift" ? <Moon className="h-4 w-4 text-brand-600" aria-hidden /> : <Sun className="h-4 w-4 text-amber-500" aria-hidden />}{p.label}</span>
                  <span className="mt-0.5 block text-xs text-ink-mute">{p.start} – {p.end}</span>
                  {k === suggested && <Badge tone="brand" size="sm" className="mt-1.5">Suggested for you</Badge>}
                </button>
              );
            })}
            <button type="button" role="radio" aria-checked={q.preset === "custom"} onClick={() => setQ({ preset: "custom" })} className={cn("rounded-2xl border p-3 text-left transition-all", q.preset === "custom" ? "border-brand-600 bg-white ring-2 ring-brand-200" : "border-cream-200 bg-white hover:border-brand-300")}>
              <span className="flex items-center gap-1.5 text-sm font-semibold"><BellOff className="h-4 w-4 text-coral-500" aria-hidden />Custom</span>
              <span className="mt-0.5 block text-xs text-ink-mute">Pick your own window</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="qh-start" className="mb-1.5 block text-sm font-semibold">Quiet from</label><input id="qh-start" type="time" className={timeInput} value={q.start} onChange={(e) => setQ({ start: e.target.value, preset: "custom" })} /></div>
            <div><label htmlFor="qh-end" className="mb-1.5 block text-sm font-semibold">Until</label><input id="qh-end" type="time" className={timeInput} value={q.end} onChange={(e) => setQ({ end: e.target.value, preset: "custom" })} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
