import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ISODate } from "@/types";
import { cn } from "@/lib/cn";
import { toISODate } from "@/lib/format";

/** Month calendar with availability dots. `markers[date]` = number of mutually free time blocks. */
export function CalendarGrid({ month, onMonthChange, selected, onSelect, markers }: {
  month: Date; onMonthChange: (d: Date) => void; selected?: ISODate; onSelect: (d: ISODate) => void; markers?: Record<ISODate, number>;
}) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const today = toISODate(new Date());
  const cells: (ISODate | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => toISODate(new Date(month.getFullYear(), month.getMonth(), i + 1)))];
  const title = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const canPrev = first > new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  return (
    <div className="rounded-3xl border border-cream-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" disabled={!canPrev} onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month" className="rounded-full p-2 text-ink-soft hover:bg-cream-100 disabled:opacity-30"><ChevronLeft className="h-5 w-5" /></button>
        <h3 className="font-display text-base font-semibold" aria-live="polite">{title}</h3>
        <button type="button" onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month" className="rounded-full p-2 text-ink-soft hover:bg-cream-100"><ChevronRight className="h-5 w-5" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-mute" aria-hidden>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1" role="grid" aria-label={title}>
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const past = d < today;
          const count = markers?.[d] ?? 0;
          const isSel = d === selected;
          const dayNum = Number(d.slice(8));
          const full = new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
          return (
            <button
              key={d}
              type="button"
              disabled={past}
              onClick={() => onSelect(d)}
              aria-label={`${full}${count ? `, ${count} shared free time blocks` : ", no shared free time"}`}
              aria-pressed={isSel}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm font-semibold transition-colors",
                past ? "text-ink-mute/40" : isSel ? "bg-brand-700 text-white shadow-soft" : d === today ? "bg-coral-50 text-coral-700 hover:bg-coral-100" : "text-ink hover:bg-brand-50"
              )}
            >
              {dayNum}
              {!past && count > 0 && <span className={cn("absolute bottom-1.5 h-1.5 rounded-full", isSel ? "bg-white" : count >= 3 ? "bg-emerald-500" : "bg-amber-400")} style={{ width: 6 + Math.min(count, 4) * 3 }} aria-hidden />}
            </button>
          );
        })}
      </div>
      <p className="mt-3 flex items-center gap-3 text-[11px] text-ink-mute"><span className="inline-flex items-center gap-1"><i className="h-1.5 w-3 rounded-full bg-emerald-500" />3+ shared blocks</span><span className="inline-flex items-center gap-1"><i className="h-1.5 w-3 rounded-full bg-amber-400" />1–2 shared blocks</span></p>
    </div>
  );
}
