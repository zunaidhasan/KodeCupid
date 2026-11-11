import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Briefcase, CalendarHeart, ChevronLeft, Flag, GraduationCap, Heart, Info, Languages, Lock, MapPin, MessageCircle, Send, ShieldBan, Sparkles, X } from "lucide-react";
import { ALL_GOALS, DRINKING_OPTIONS, EDUCATION_OPTIONS, EXERCISE_OPTIONS, FAMILY_OPTIONS, SMOKING_OPTIONS } from "@/data/options";
import { promptById } from "@/data/icebreakers";
import { formatDistance, fuzzyDistance } from "@/lib/geo";
import { heightLabel, labelOf, formatCurrency } from "@/lib/format";
import { matchScore } from "@/lib/matchScore";
import { scheduleCompatibility, SCHEDULE_META } from "@/lib/schedule";
import { distanceMiles } from "@/lib/geo";
import { PREMATCH_PRICE_CENTS } from "@/data/catalog";
import { cn } from "@/lib/cn";
import { getMember, isBlockedBetween, matchBetween } from "@/services/selectors";
import { useApp, useMe } from "@/context/AppContext";
import { useDocumentTitle, useSimulatedLoading } from "@/hooks";
import { Page } from "@/components/PageHeader";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { CompatPill, ScheduleBadge, VerificationBadge } from "@/components/Badges";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonProfileDetail } from "@/components/ui/SkeletonLoader";
import { useDecision } from "@/features/discovery/useDecision";
import { ScheduleTimeline } from "@/features/schedule/ScheduleTimeline";
import { MicroDateScheduler } from "@/features/schedule/MicroDateScheduler";
import { PreMatchModal } from "@/features/messaging/PreMatchModal";
import { ReportModal } from "@/features/safety/ReportModal";
import { BlockModal } from "@/features/safety/BlockModal";

function Block({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <Card as="section" className="space-y-3">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">{icon}{title}</h2>
      {children}
    </Card>
  );
}

export function ProfileDetailPage() {
  const { id } = useParams();
  const me = useMe();
  const { db } = useApp();
  const navigate = useNavigate();
  const loading = useSimulatedLoading(450);
  const member = getMember(db, id);
  const { decide, busy, dialogs } = useDecision(me);
  const [report, setReport] = useState(false);
  const [block, setBlock] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [pre, setPre] = useState(false);
  const [explain, setExplain] = useState(false);
  useDocumentTitle(member?.profile.displayName ?? "Profile");

  if (loading) return <Page wide><SkeletonProfileDetail /></Page>;
  const isSelf = member?.user.id === me.user.id;
  if (!member || (!isSelf && (member.user.accountStatus !== "active" || isBlockedBetween(db, me.user.id, member.user.id)))) {
    return <Page><EmptyState icon="🔍" title="This profile isn't available" description="The member may have left KodeCupid or been blocked." action={<Button onClick={() => navigate("/app")}>Back to Discover</Button>} /></Page>;
  }

  const p = member.profile;
  const pro = member.professional;
  const priv = p.privacy;
  const score = matchScore(me, member);
  const compat = scheduleCompatibility(me.professional, member.professional);
  const dist = distanceMiles(me.profile.location, p.location);
  const match = matchBetween(db, me.user.id, member.user.id);
  const conv = db.conversations.find((c) => c.participantIds.includes(me.user.id) && c.participantIds.includes(member.user.id));
  const acted = db.likes.some((l) => l.fromId === me.user.id && l.toId === member.user.id) || db.passes.some((x) => x.fromId === me.user.id && x.toId === member.user.id);
  const first = p.displayName.replace(/^Dr\.\s*/, "").split(" ")[0];
  const age = priv.showAge ? p.age : undefined;
  const lifestyle = [
    p.lifestyle.drinking && `Drinks: ${labelOf(DRINKING_OPTIONS, p.lifestyle.drinking)}`,
    p.lifestyle.smoking && `Smoking: ${labelOf(SMOKING_OPTIONS, p.lifestyle.smoking)}`,
    p.lifestyle.cannabis && `Cannabis: ${labelOf(SMOKING_OPTIONS, p.lifestyle.cannabis)}`,
    p.lifestyle.exercise && `Exercise: ${labelOf(EXERCISE_OPTIONS, p.lifestyle.exercise)}`,
  ].filter(Boolean) as string[];
  const sensitive = [
    priv.showReligion && p.religion && ["Religion & beliefs", p.religion],
    priv.showEthnicity && p.ethnicity && ["Cultural background", p.ethnicity],
    priv.showPolitics && p.politicalViews && ["Political views", p.politicalViews],
  ].filter(Boolean) as [string, string][];

  const swipe = async (kind: "like" | "pass") => { const ok = await decide(kind, member); if (ok && kind === "pass") navigate("/app"); };

  return (
    <Page wide className="pb-28">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"><ChevronLeft className="h-4 w-4" aria-hidden />Back</button>
        {!isSelf && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" leftIcon={<Flag className="h-4 w-4" />} onClick={() => setReport(true)}>Report</Button>
            <Button variant="ghost" size="sm" leftIcon={<ShieldBan className="h-4 w-4" />} onClick={() => setBlock(true)}>Block</Button>
          </div>
        )}
      </div>
      {isSelf && <p className="mb-4 rounded-2xl bg-brand-50 p-3 text-sm font-medium text-brand-900">This is how other members see your profile. <Link to="/app/me/edit" className="underline">Edit profile</Link></p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <PhotoCarousel photos={p.photos} name={p.displayName} className="aspect-[4/5] rounded-[2rem] shadow-card" />
        </div>

        <div className="min-w-0 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2"><VerificationBadge status={member.verification.status} />{!isSelf && <CompatPill score={score} />}</div>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight">{p.displayName}{age ? <span className="font-sans text-3xl font-medium">, {age}</span> : null}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-ink-soft"><Briefcase className="h-4 w-4" aria-hidden />{pro.jobTitle}{pro.specialty && pro.specialty !== pro.jobTitle ? ` · ${pro.specialty}` : ""}</p>
            {priv.showLocation && <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-mute"><MapPin className="h-4 w-4" aria-hidden />{p.location.neighborhood}, {p.location.city}{!isSelf && ` · ${fuzzyDistance(dist) <= 1 ? "Less than a mile away" : formatDistance(Math.round(dist))}`}</p>}
            {priv.showGender && <p className="mt-0.5 text-sm text-ink-mute">{p.genderIdentity === "custom" ? p.genderCustom : p.genderIdentity.replace("-", " ")}{priv.showHeight && p.heightCm ? ` · ${heightLabel(p.heightCm)}` : ""}</p>}
          </div>

          {!isSelf && (
            <Card tone="cream" className="space-y-2">
              <button className="flex w-full items-center justify-between text-left" onClick={() => setExplain((e) => !e)} aria-expanded={explain}>
                <span className="font-semibold">{score.headline} · {score.total}%</span><span className="text-sm font-semibold text-brand-700">{explain ? "Hide" : "Why?"}</span>
              </button>
              {explain && (
                <ul className="animate-fade-in space-y-2.5 pt-1">
                  {score.factors.map((f) => (
                    <li key={f.key}><div className="flex justify-between text-xs"><span className="font-semibold">{f.label}</span><span className="text-ink-mute">{f.note} · {Math.round(f.points)}/{f.weight}</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-brand-500" style={{ width: `${f.ratio * 100}%` }} /></div></li>
                  ))}
                </ul>
              )}
              <p className="flex items-start gap-1.5 text-[11px] text-ink-mute"><Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />Prototype matching estimate based on simple weighted rules — not a guarantee of compatibility.</p>
            </Card>
          )}

          {p.bio && <Block title={`About ${first}`}><p className="leading-relaxed text-ink-soft">{p.bio}</p></Block>}

          {p.icebreakers.length > 0 && (
            <Block title="Icebreakers" icon={<Sparkles className="h-5 w-5 text-coral-500" aria-hidden />}>
              <ul className="space-y-3">{p.icebreakers.map((i) => <li key={i.promptId} className="rounded-2xl bg-cream p-4"><p className="text-xs font-semibold text-ink-mute">{promptById(i.promptId)?.text}</p><p className="mt-1.5 text-ink">“{i.answer}”</p></li>)}</ul>
            </Block>
          )}

          <Block title="Work" icon={<Briefcase className="h-5 w-5 text-brand-600" aria-hidden />}>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-ink-mute">Profession</dt><dd className="font-semibold">{pro.jobTitle || "—"}</dd></div>
              <div><dt className="text-xs text-ink-mute">Specialty</dt><dd className="font-semibold">{pro.specialty || "—"}</dd></div>
              <div><dt className="text-xs text-ink-mute">Workplace</dt><dd className="font-semibold">{pro.workplaceType}{priv.showWorkplace && pro.workplaceName ? ` · ${pro.workplaceName}` : ""}</dd></div>
              <div><dt className="text-xs text-ink-mute">Schedule</dt><dd className="font-semibold">{SCHEDULE_META[pro.schedule].emoji} {SCHEDULE_META[pro.schedule].label}</dd></div>
            </dl>
            <div className="flex flex-wrap items-center gap-2 pt-1"><ScheduleBadge compat={compat} /><span className="text-xs text-ink-mute">{compat.reason}</span></div>
            {!isSelf && <div className="space-y-3 rounded-2xl bg-cream-100 p-4"><ScheduleTimeline p={me.professional} label="You" compact /><ScheduleTimeline p={pro} label={first} /></div>}
          </Block>

          {(p.educationLevel || p.credentials.length > 0) && (
            <Block title="Education & credentials" icon={<GraduationCap className="h-5 w-5 text-brand-600" aria-hidden />}>
              {p.educationLevel && <p className="text-sm font-semibold">{labelOf(EDUCATION_OPTIONS, p.educationLevel)}</p>}
              <div className="flex flex-wrap gap-2">{p.credentials.map((c) => <Badge key={c} tone="brand">{c}</Badge>)}</div>
            </Block>
          )}

          <Block title="Looking for" icon={<Heart className="h-5 w-5 text-coral-500" aria-hidden />}>
            <div className="flex flex-wrap gap-2">{member.preference.lookingFor.map((g) => <Badge key={g} tone="coral">{labelOf(ALL_GOALS, g)}</Badge>)}{!member.preference.lookingFor.length && <span className="text-sm text-ink-mute">Not shared yet</span>}</div>
            {member.preference.familyPlans && <p className="text-sm text-ink-soft"><span className="font-semibold text-ink">Family plans:</span> {labelOf(FAMILY_OPTIONS, member.preference.familyPlans)}</p>}
          </Block>

          {(lifestyle.length > 0 && priv.showLifestyle) || p.languages.length > 0 || p.interests.length > 0 ? (
            <Block title="Lifestyle & interests">
              {priv.showLifestyle && lifestyle.length > 0 && <div className="flex flex-wrap gap-2">{lifestyle.map((l) => <Badge key={l} tone="neutral">{l}</Badge>)}</div>}
              {p.interests.length > 0 && <div className="flex flex-wrap gap-2">{p.interests.map((i) => <Badge key={i} tone={me.profile.interests.includes(i) ? "success" : "brand"}>{i}{me.profile.interests.includes(i) && !isSelf ? " · shared" : ""}</Badge>)}</div>}
              {p.languages.length > 0 && <p className="flex items-center gap-2 text-sm text-ink-soft"><Languages className="h-4 w-4" aria-hidden />{p.languages.join(", ")}</p>}
            </Block>
          ) : null}

          {sensitive.length > 0 && (
            <Block title="Background (shared by choice)">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">{sensitive.map(([k, v]) => <div key={k}><dt className="text-xs text-ink-mute">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>
            </Block>
          )}

          {!isSelf && (
            match ? (
              <Card tone="brand" className="space-y-3">
                <p className="font-display text-lg font-semibold">You're matched with {first} 🎉</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="accent" leftIcon={<MessageCircle className="h-4 w-4" />} onClick={() => conv && navigate(`/app/chat/${conv.id}`)}>Message</Button>
                  <Button variant="secondary" leftIcon={<CalendarHeart className="h-4 w-4" />} onClick={() => setDateOpen(true)}>Plan a micro-date</Button>
                </div>
              </Card>
            ) : (
              <Card tone="cream" className="space-y-3" aria-label="Messaging locked">
                <p className="flex items-center gap-2 font-semibold"><Lock className="h-5 w-5 text-ink-mute" aria-hidden />Messaging is locked until you both like each other</p>
                <p className="text-sm text-ink-soft">Matched members chat freely. Want to reach out first? You can send one limited pre-match message.</p>
                {conv?.preMatch ? <Badge tone="success">Pre-match message sent ✓</Badge> : <Button variant="secondary" leftIcon={<Send className="h-4 w-4" />} onClick={() => setPre(true)}>Send one pre-match message · {formatCurrency(PREMATCH_PRICE_CENTS)}</Button>}
                <p className="text-[11px] text-ink-mute">Prototype payment flow — no real charge.</p>
              </Card>
            )
          )}
        </div>
      </div>

      {!isSelf && !match && !acted && (
        <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 flex justify-center gap-4 px-4 md:bottom-6 md:left-64">
          <div className="flex items-center gap-4 rounded-full bg-white/95 px-5 py-3 shadow-card backdrop-blur">
            <button disabled={busy} onClick={() => swipe("pass")} aria-label={`Pass on ${first}`} className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-cream-200 bg-white text-ink-soft hover:border-coral-300 hover:text-coral-600"><X className="h-7 w-7" /></button>
            <button disabled={busy} onClick={() => swipe("like")} aria-label={`Like ${first}`} className={cn("flex h-16 w-16 items-center justify-center rounded-full bg-coral-500 text-white shadow-card hover:bg-coral-600")}><Heart className="h-8 w-8 fill-white" /></button>
          </div>
        </div>
      )}

      {!isSelf && <>
        <ReportModal open={report} onClose={() => setReport(false)} reporterId={me.user.id} target={member} onBlocked={() => navigate("/app")} />
        <BlockModal open={block} onClose={() => setBlock(false)} meId={me.user.id} target={member} onBlocked={() => navigate("/app")} />
        {match && <MicroDateScheduler open={dateOpen} onClose={() => setDateOpen(false)} me={me} other={member} matchId={match.id} />}
        <PreMatchModal open={pre} onClose={() => setPre(false)} me={me} target={member} onSent={(cid) => navigate(`/app/chat/${cid}`)} />
      </>}
      {dialogs}
    </Page>
  );
}
