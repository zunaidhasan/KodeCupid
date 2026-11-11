import type { ProfessionalProfile } from "@/types";
import { hourlyStates } from "@/lib/schedule";
import { cn } from "@/lib/cn";

/** 24-hour strip showing when someone works, sleeps and is free (typical work day). */
export function ScheduleTimeline({ p, label, compact }: { p: Pick<ProfessionalProfile, "schedule" | "shiftStart" | "shiftEnd">; label?: string; compact?: boolean }) {
  const states = hourlyStates(p);
  const free = states.filter((s) => s === "free").length;
  return (
    <div>
      {label && <p className="mb-1.5 text-xs font-semibold text-ink-soft">{label}</p>}
      <div className="flex h-7 overflow-hidden rounded-full border border-cream-200" role="img" aria-label={`Typical day: ${states.filter((s) => s === "work").length} hours working, ${free} hours free`}>
        {states.map((s, h) => (
          <span key={h} title={`${h}:00 — ${s}`} className={cn("flex-1", s === "work" ? "bg-brand-700" : s === "sleep" ? "bg-brand-200" : "bg-coral-200")} />
        ))}
      </div>
      {!compact && (
        <>
          <div className="mt-1 flex justify-between text-[10px] font-medium text-ink-mute" aria-hidden><span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>12a</span></div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-brand-700" />Work</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-brand-200" />Sleep</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-coral-200" />Free ({free}h)</span>
          </div>
        </>
      )}
    </div>
  );
}
