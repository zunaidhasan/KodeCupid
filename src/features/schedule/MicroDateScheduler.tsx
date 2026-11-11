import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Check, Clock, MapPin } from "lucide-react";
import type { MemberRecord } from "@/types";
import { VENUES, facilityById } from "@/data/facilities";
import { distanceMiles } from "@/lib/geo";
import { toISODate, formatDate } from "@/lib/format";
import { bothFreeCount, timeBlocksForDate, scheduleCompatibility } from "@/lib/schedule";
import { cn } from "@/lib/cn";
import { dateService } from "@/services/dateService";
import { useToast } from "@/context/ToastContext";
import { CalendarGrid } from "@/components/CalendarGrid";
import { ScheduleBadge } from "@/components/Badges";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { formatHour } from "@/lib/format";

/** Micro-date scheduler: calendar → shared free time blocks → suggested public venue → send invitation. */
export function MicroDateScheduler({ open, onClose, me, other, matchId }: { open: boolean; onClose: () => void; me: MemberRecord; other: MemberRecord; matchId: string }) {
  const toast = useToast();
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [date, setDate] = useState("");
  const [blocks, setBlocks] = useState<string[]>([]);
  const [venueId, setVenueId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => { if (open) { setDate(""); setBlocks([]); setVenueId(""); setNote(""); setError(""); setSent(false); } }, [open]);

  const markers = useMemo(() => {
    const m: Record<string, number> = {};
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= days; d++) { const iso = toISODate(new Date(month.getFullYear(), month.getMonth(), d)); m[iso] = bothFreeCount(me.professional, other.professional, iso); }
    return m;
  }, [month, me.professional, other.professional]);

  const dayBlocks = useMemo(() => (date ? timeBlocksForDate(me.professional, other.professional, date) : []), [date, me.professional, other.professional]);
  const venues = useMemo(() => {
    const pts = [facilityById(me.professional.facilityId), facilityById(other.professional.facilityId)].filter(Boolean) as { lat: number; lng: number }[];
    const dist = (v: { lat: number; lng: number }) => (pts.length ? Math.min(...pts.map((p) => distanceMiles(p, v))) : 0);
    return VENUES.map((v) => ({ v, d: dist(v) })).sort((a, b) => a.d - b.d).slice(0, 4);
  }, [me.professional.facilityId, other.professional.facilityId]);
  const compat = scheduleCompatibility(me.professional, other.professional);
  const first = other.profile.displayName.split(" ")[0].replace(/^Dr\.?$/, "them");

  const send = async () => {
    setError("");
    if (!date) return setError("Pick a date on the calendar.");
    if (!blocks.length) return setError("Choose at least one time block you're both free.");
    if (!venueId) return setError("Choose a suggested location.");
    setBusy(true);
    try { await dateService.sendInvite({ matchId, fromId: me.user.id, toId: other.user.id, date, blockIds: blocks, venueId, note }); setSent(true); toast.success("Invitation sent", "Status: Pending"); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={sent ? "Invitation sent!" : `Plan a micro-date with ${other.profile.displayName.split(" ")[0]}`} description={sent ? undefined : "A quick, public meetup near work — coffee, a walk, or lunch."}
      footer={sent ? undefined : <div className="flex items-center justify-between gap-3"><p className="hidden text-xs text-ink-mute sm:block">Mock availability · local state only</p><div className="flex gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="accent" loading={busy} onClick={send} leftIcon={<CalendarCheck className="h-4 w-4" />}>Send invitation</Button></div></div>}>
      {sent ? (
        <div className="py-4 text-center" role="status">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600"><Clock className="h-8 w-8" aria-hidden /></span>
          <p className="font-display text-lg font-semibold">{formatDate(date, { weekday: "long", month: "long", day: "numeric" })}</p>
          <p className="text-ink-soft">{VENUES.find((v) => v.id === venueId)?.name}</p>
          <p className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">Pending</p>
          <p className="mx-auto mt-3 max-w-sm text-sm text-ink-soft">{first} will be notified. In this prototype they reply automatically in a few seconds — you'll get a notification.</p>
          <div className="mt-6 flex justify-center gap-2"><Button variant="secondary" onClick={onClose}>Close</Button><Link to="/app/dates" onClick={onClose} className={buttonStyles()}>View my dates</Link></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2"><ScheduleBadge compat={compat} /><span className="text-xs text-ink-mute">{compat.reason}</span></div>
          <section aria-labelledby="md-date"><h3 id="md-date" className="mb-2 font-display text-base font-semibold">1 · Pick a date</h3><CalendarGrid month={month} onMonthChange={setMonth} selected={date} onSelect={(d) => { setDate(d); setBlocks([]); }} markers={markers} /></section>
          {date && (
            <section aria-labelledby="md-time" className="animate-fade-in">
              <h3 id="md-time" className="mb-2 font-display text-base font-semibold">2 · Choose time blocks <span className="text-sm font-normal text-ink-mute">— {formatDate(date, { weekday: "long", month: "short", day: "numeric" })}</span></h3>
              {dayBlocks.every((b) => !b.both) && <p className="mb-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">No shared free time this day. Try another date — green dots on the calendar show the best days.</p>}
              <ul className="grid gap-2 sm:grid-cols-2">
                {dayBlocks.map((b) => {
                  const on = blocks.includes(b.id);
                  return (
                    <li key={b.id}>
                      <button type="button" disabled={!b.both} aria-pressed={on} onClick={() => setBlocks(on ? blocks.filter((x) => x !== b.id) : [...blocks, b.id])}
                        className={cn("flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-all", on ? "border-brand-600 bg-brand-50 ring-2 ring-brand-200" : b.both ? "border-cream-200 bg-white hover:border-brand-300" : "border-cream-100 bg-cream-100/60 opacity-60")}>
                        <span><span className="block text-sm font-semibold">{b.label}</span><span className="text-xs text-ink-mute">{formatHour(b.start)} – {formatHour(b.end)}</span></span>
                        <span className="text-xs font-semibold">{on ? <Check className="h-5 w-5 text-brand-700" aria-label="Selected" /> : b.both ? <span className="text-emerald-700">Both free</span> : <span className="text-ink-mute">{!b.aFree && !b.bFree ? "Both busy" : !b.aFree ? "You're busy" : `${first} is busy`}</span>}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          <section aria-labelledby="md-venue">
            <h3 id="md-venue" className="mb-2 font-display text-base font-semibold">3 · Suggested public spots near work</h3>
            <div role="radiogroup" aria-label="Suggested locations" className="grid gap-2 sm:grid-cols-2">
              {venues.map(({ v, d }) => (
                <button key={v.id} type="button" role="radio" aria-checked={venueId === v.id} onClick={() => setVenueId(v.id)} className={cn("rounded-2xl border p-3 text-left transition-all", venueId === v.id ? "border-brand-600 bg-brand-50 ring-2 ring-brand-200" : "border-cream-200 bg-white hover:border-brand-300")}>
                  <span className="flex items-center gap-1.5 text-sm font-semibold"><MapPin className="h-4 w-4 text-coral-500" aria-hidden />{v.name}</span>
                  <span className="mt-0.5 block text-xs text-ink-mute">{v.kind} · {v.blurb}</span>
                  <span className="mt-1 block text-[11px] font-semibold text-ink-soft">{d < 0.3 ? "Steps from a workplace" : `${d.toFixed(1)} mi from a workplace`}</span>
                </button>
              ))}
            </div>
          </section>
          <Textarea label="Add a note" optional value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} counter={140} className="min-h-20" placeholder="Looking forward to meeting you!" />
          {error && <p role="alert" className="rounded-2xl bg-coral-50 p-3 text-sm font-medium text-coral-700">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
