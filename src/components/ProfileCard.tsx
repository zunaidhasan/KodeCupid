import { useRef, useState } from "react";
import { Briefcase, Building2, Heart, MapPin, Quote } from "lucide-react";
import type { MemberRecord } from "@/types";
import { ALL_GOALS } from "@/data/options";
import { promptById } from "@/data/icebreakers";
import { cn } from "@/lib/cn";
import { formatDistance, fuzzyDistance } from "@/lib/geo";
import { labelOf } from "@/lib/format";
import type { Candidate } from "@/services/selectors";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { CompatPill, ScheduleBadge, VerificationBadge } from "./Badges";
import { PhotoCarousel } from "./PhotoCarousel";

/** Respect each member's privacy toggles when displaying fields. */
export function displayAge(m: MemberRecord) { return m.profile.privacy.showAge ? m.profile.age : undefined; }

export function compatHighlights(c: Candidate): string[] {
  const out: string[] = [];
  const f = Object.fromEntries(c.score.factors.map((x) => [x.key, x]));
  if (f.profession.ratio >= 0.95) out.push("Same specialty");
  if (f.goals.ratio >= 0.8) out.push("Shared goals");
  if (f.interests.ratio >= 0.5 && f.interests.note.startsWith("Shared")) out.push(f.interests.note);
  if (f.lifestyle.ratio >= 0.8) out.push("Similar lifestyle");
  if (f.proximity.ratio >= 0.95) out.push("Lives nearby");
  return out.slice(0, 3);
}

interface ProfileCardProps {
  candidate: Candidate;
  onOpen?: () => void;
  /** Hide inner details for stacked "behind" cards */
  className?: string;
}

/** Full discovery card: photo carousel, headline facts, compatibility, schedule indicator and icebreaker. */
export function ProfileCard({ candidate, onOpen, className }: ProfileCardProps) {
  const { member: m, score, schedule, distance } = candidate;
  const p = m.profile;
  const pro = m.professional;
  const ice = p.icebreakers[0];
  const age = displayAge(m);
  const goals = m.preference.lookingFor.slice(0, 2).map((g) => labelOf(ALL_GOALS, g));
  const highlights = compatHighlights(candidate);
  return (
    <article className={cn("overflow-hidden rounded-[2rem] border border-cream-200 bg-white shadow-card", className)} aria-label={`${p.displayName}, profile card`}>
      <PhotoCarousel photos={p.photos} name={p.displayName} className="aspect-[4/3.7] sm:aspect-[4/3.2]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/80 via-transparent to-brand-950/10" />
        <div className="pointer-events-none absolute left-4 right-4 top-8 flex items-start justify-between gap-2">
          <VerificationBadge status={m.verification.status} size="sm" />
          <CompatPill score={score} dark />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-white">
          <h2 className="font-display text-3xl font-semibold leading-tight">
            {p.displayName.replace(/^Dr\.\s*/, "")}{age ? <span className="font-sans text-2xl font-medium">, {age}</span> : null}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/90">
            <Briefcase className="h-4 w-4" aria-hidden />
            {pro.jobTitle}{pro.specialty && pro.specialty !== pro.jobTitle ? ` · ${pro.specialty}` : ""}
          </p>
          {p.privacy.showLocation && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/80">
              <MapPin className="h-4 w-4" aria-hidden />
              {p.location.neighborhood} · {fuzzyDistance(distance) <= 1 ? "Less than a mile away" : formatDistance(Math.round(distance))}
            </p>
          )}
        </div>
      </PhotoCarousel>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral" icon={<Building2 className="h-3.5 w-3.5" aria-hidden />}>{pro.workplaceType}{p.privacy.showWorkplace && pro.workplaceName ? ` · ${pro.workplaceName}` : ""}</Badge>
          {goals.map((g) => <Badge key={g} tone="coral" icon={<Heart className="h-3 w-3" aria-hidden />}>{g}</Badge>)}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ScheduleBadge compat={schedule} />
          {highlights.map((h) => <Badge key={h} tone="brand">{h}</Badge>)}
        </div>

        {ice && (
          <blockquote className="rounded-2xl bg-cream p-4">
            <p className="flex items-start gap-2 text-xs font-semibold text-ink-mute"><Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral-500" aria-hidden />{promptById(ice.promptId)?.text}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink">“{ice.answer}”</p>
          </blockquote>
        )}

        {onOpen && (
          <button onClick={onOpen} className="w-full rounded-full border border-cream-200 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50">
            Open full profile
          </button>
        )}
      </div>
    </article>
  );
}

/** Compact row/tile used in lists (schedule matches, likes, search). */
export function ProfileMini({ candidate, onClick }: { candidate: Candidate; onClick?: () => void }) {
  const { member: m, score, schedule } = candidate;
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-3xl border border-cream-200 bg-white p-3 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
      <Avatar src={m.profile.photos[0]?.url} name={m.profile.displayName} size="lg" verified={m.verification.status === "verified"} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{m.profile.displayName}{displayAge(m) ? `, ${displayAge(m)}` : ""}</span>
        <span className="block truncate text-sm text-ink-soft">{m.professional.jobTitle}</span>
        <span className="mt-1.5 flex flex-wrap gap-1.5"><ScheduleBadge compat={schedule} size="sm" /></span>
      </span>
      <span className="shrink-0 text-right"><span className="block text-lg font-bold text-coral-600">{score.total}%</span><span className="text-[10px] uppercase tracking-wide text-ink-mute">match</span></span>
    </button>
  );
}

/* ----------------------------- Swipe interaction ---------------------------- */
export type SwipeDir = "like" | "pass";

/**
 * Pointer-drag wrapper. Drag right = like, left = pass. The parent owns the decision:
 * it receives `onSwipe` and plays the exit animation via the `leaving` prop.
 */
export function SwipeableCard({ children, onSwipe, leaving, disabled }: { children: React.ReactNode; onSwipe: (d: SwipeDir) => void; leaving: "like" | "pass" | "super" | null; disabled?: boolean }) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const THRESHOLD = 110;

  const exit = leaving === "like" ? 600 : leaving === "pass" ? -600 : 0;
  const x = leaving ? exit : dx;
  const rot = x / 28;
  return (
    <div
      className={cn("relative touch-pan-y", !dragging && "transition-transform duration-300 ease-out", leaving === "super" && "-translate-y-[120%] opacity-0 transition-all duration-300")}
      style={{ transform: leaving === "super" ? undefined : `translateX(${x}px) rotate(${rot}deg)`, opacity: leaving && leaving !== "super" ? 0.2 : 1, transitionProperty: dragging ? "none" : undefined }}
      onPointerDown={(e) => {
        if (disabled || (e.target as HTMLElement).closest("button,a,input")) return;
        start.current = { x: e.clientX, y: e.clientY };
        setDragging(true);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => { if (start.current) setDx(e.clientX - start.current.x); }}
      onPointerUp={() => {
        if (!start.current) return;
        const final = dx;
        start.current = null; setDragging(false); setDx(0);
        if (final > THRESHOLD) onSwipe("like");
        else if (final < -THRESHOLD) onSwipe("pass");
      }}
      onPointerCancel={() => { start.current = null; setDragging(false); setDx(0); }}
    >
      {(dx > 30 || leaving === "like") && <span className="pointer-events-none absolute left-6 top-16 z-10 -rotate-12 rounded-xl border-4 border-emerald-500 bg-white/80 px-3 py-1 text-2xl font-extrabold tracking-wider text-emerald-600">LIKE</span>}
      {(dx < -30 || leaving === "pass") && <span className="pointer-events-none absolute right-6 top-16 z-10 rotate-12 rounded-xl border-4 border-coral-500 bg-white/80 px-3 py-1 text-2xl font-extrabold tracking-wider text-coral-600">PASS</span>}
      {children}
    </div>
  );
}

