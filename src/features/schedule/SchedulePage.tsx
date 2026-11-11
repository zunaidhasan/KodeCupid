import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { ProfessionalProfile, WorkSchedule } from "@/types";
import { HOURS } from "@/data/options";
import { cn } from "@/lib/cn";
import { formatHour } from "@/lib/format";
import { defaultShiftFor } from "@/lib/draft";
import { LEVEL_LABEL, SCHEDULE_META, scheduleCompatibility, type ScheduleLevel } from "@/lib/schedule";
import { discoveryCandidates, DEFAULT_FILTERS } from "@/services/selectors";
import { memberService } from "@/services/memberService";
import { useApp, useMe } from "@/context/AppContext";
import { useDocumentTitle } from "@/hooks";
import { ProfileMini } from "@/components/ProfileCard";
import { Page, PageHeader } from "@/components/PageHeader";
import { Card, SectionHeading } from "@/components/ui/Card";
import { CardChoice } from "@/components/ui/Choice";
import { Select } from "@/components/ui/Select";
import { ScheduleTimeline } from "./ScheduleTimeline";

const PATTERNS = Object.keys(SCHEDULE_META) as WorkSchedule[];
const mock = (schedule: WorkSchedule, category: ProfessionalProfile["category"]): ProfessionalProfile => ({ userId: "x", category, jobTitle: "", specialty: "", workplaceName: "", workplaceType: "", schedule, ...defaultShiftFor(schedule), updatedAt: "" });
const LEVEL_STYLE: Record<ScheduleLevel, string> = { great: "bg-emerald-100 text-emerald-800", some: "bg-amber-100 text-amber-800", different: "bg-coral-100 text-coral-700" };

export function SchedulePage() {
  useDocumentTitle("Schedule compatibility");
  const me = useMe();
  const { db } = useApp();
  const navigate = useNavigate();
  const pro = me.professional;
  const setPro = (patch: Partial<ProfessionalProfile>) => memberService.update(me.user.id, (m) => { Object.assign(m.professional, patch); });

  const ranked = useMemo(() => discoveryCandidates(db, me, DEFAULT_FILTERS, true).candidates.sort((a, b) => b.schedule.score - a.schedule.score).slice(0, 5), [db, me]);

  return (
    <Page wide>
      <PageHeader title="Schedule compatibility" subtitle="Your work pattern shapes who you can actually meet. Tell us yours and we'll find the overlap." back="/app/me" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <Card className="space-y-5">
            <CardChoice label="My work pattern" columns={1} value={pro.schedule} onChange={(schedule) => setPro({ schedule, ...defaultShiftFor(schedule) })} options={PATTERNS.map((k) => ({ value: k, title: SCHEDULE_META[k].label, description: SCHEDULE_META[k].description, icon: SCHEDULE_META[k].emoji }))} />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Shift start" value={String(pro.shiftStart)} onChange={(v) => setPro({ shiftStart: Number(v) })} options={HOURS} />
              <Select label="Shift end" value={String(pro.shiftEnd)} onChange={(v) => setPro({ shiftEnd: Number(v) })} options={HOURS} />
            </div>
            <div className="rounded-3xl bg-cream-100 p-4"><p className="mb-3 text-sm text-ink-soft"><strong>Typical day:</strong> {SCHEDULE_META[pro.schedule].label} · {formatHour(pro.shiftStart)} – {formatHour(pro.shiftEnd)}</p><ScheduleTimeline p={pro} /></div>
            <p className="text-xs text-ink-mute">Changes save automatically and update your discovery results.</p>
          </Card>

          <Card>
            <SectionHeading title="How we score overlap" />
            <ul className="space-y-2 text-sm text-ink-soft">
              <li><strong className="text-emerald-700">Great:</strong> same pattern, or both on regular hours.</li>
              <li><strong className="text-amber-700">Some:</strong> opposite-but-complementary shifts (days ↔ nights meet around shift change), or one flexible schedule.</li>
              <li><strong className="text-coral-700">Different:</strong> conflicting patterns, like nights vs school hours.</li>
              <li>Educators and administrative staff on regular hours are treated differently from rotating clinical shift workers.</li>
            </ul>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <SectionHeading title="Top schedule matches" description="Highest overlap with you right now" />
            <ul className="space-y-2.5">{ranked.map((c) => <li key={c.member.user.id}><ProfileMini candidate={c} onClick={() => navigate(`/app/profile/${c.member.user.id}`)} /></li>)}</ul>
          </Card>
          <Card className="overflow-x-auto">
            <SectionHeading title="Pattern compatibility chart" description="Clinical staff vs educators on regular hours" />
            <table className="w-full min-w-[420px] border-separate border-spacing-1 text-center text-xs">
              <caption className="sr-only">Compatibility between each pair of work patterns</caption>
              <thead><tr><td />{PATTERNS.map((p) => <th key={p} scope="col" className="pb-1 font-semibold text-ink-soft">{SCHEDULE_META[p].emoji}<br />{SCHEDULE_META[p].label.replace("Regular ", "")}</th>)}</tr></thead>
              <tbody>
                {PATTERNS.map((row) => (
                  <tr key={row}>
                    <th scope="row" className="pr-1 text-left font-semibold text-ink-soft">{SCHEDULE_META[row].emoji} {SCHEDULE_META[row].label.replace("Regular ", "")}</th>
                    {PATTERNS.map((col) => { const l = scheduleCompatibility(mock(row, "healthcare"), mock(col, "healthcare")).level; return <td key={col} title={LEVEL_LABEL[l]} className={cn("rounded-lg py-2 font-bold", LEVEL_STYLE[l])}>{l === "great" ? "●●●" : l === "some" ? "●●" : "●"}</td>; })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[11px] text-ink-mute">●●● great · ●● some · ● different — for administrative/clinical staff. Educators on school hours score a little lower against rotating shifts.</p>
          </Card>
        </div>
      </div>
    </Page>
  );
}
