import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Headset, ImagePlus, Phone, Sparkles } from "lucide-react";
import { CONSULT_PRICE_CENTS } from "@/data/catalog";
import { fileToDataUrl } from "@/lib/image";
import { screenshotArt } from "@/lib/placeholderArt";
import { formatCurrency, formatDateTime, timeAgo } from "@/lib/format";
import { consultService } from "@/services/consultService";
import { sleep } from "@/services/db";
import { useApp, useMe } from "@/context/AppContext";
import { useDocumentTitle, useSimulatedLoading } from "@/hooks";
import { MockPaymentForm } from "@/features/billing/MockPaymentForm";
import { Page, PageHeader } from "@/components/PageHeader";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { SkeletonCard } from "@/components/ui/SkeletonLoader";
import { SegmentedTabs } from "@/components/ui/Tabs";
import { getMember } from "@/services/selectors";

const STATUS: Record<string, { label: string; tone: BadgeTone }> = { submitted: { label: "Submitted", tone: "warning" }, in_review: { label: "In review", tone: "brand" }, answered: { label: "Answered", tone: "success" } };

export function ConsultPage() {
  useDocumentTitle("Curbside Consult");
  const me = useMe();
  const { db } = useApp();
  const loading = useSimulatedLoading(450);
  const [tab, setTab] = useState<"new" | "history">("new");
  const [about, setAbout] = useState("");
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [shot, setShot] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pay, setPay] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mine = db.consults.filter((c) => c.userId === me.user.id);
  const matches = db.matches.filter((m) => m.userIds.includes(me.user.id) && m.status !== "unmatched").map((m) => getMember(db, m.userIds.find((u) => u !== me.user.id))!);

  const proceed = () => {
    const e: Record<string, string> = {};
    if (question.trim().length < 10) e.question = "Tell us a bit more about your question (at least 10 characters).";
    setErrors(e);
    if (!Object.keys(e).length) setPay(true);
  };

  return (
    <Page>
      <PageHeader title="Curbside Consult" subtitle="A friendly second opinion on a potential match — from a real counselor." back="/app/me" />
      <Card tone="coral" className="mb-5 flex gap-3" role="note">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-coral-600" aria-hidden />
        <div className="text-sm text-ink-soft"><p className="font-bold text-ink">Not emergency or crisis support</p><p className="mt-0.5">Curbside Consult is general dating feedback only. If you're in danger call <strong>911</strong>. For emotional crisis support in the US call or text <a href="https://988lifeline.org" target="_blank" rel="noreferrer" className="font-semibold text-brand-700 underline">988</a>. <a href="https://988lifeline.org/get-help/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-700 underline"><Phone className="h-3.5 w-3.5" aria-hidden />Emergency resources</a></p></div>
      </Card>
      <SegmentedTabs label="Consult tabs" value={tab} onChange={setTab} className="mb-5" items={[{ id: "new", label: "New request" }, { id: "history", label: "Request history", count: mine.length }]} />

      {tab === "new" ? (
        submittedId ? (
          <Card className="text-center" role="status">
            <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-9 w-9" aria-hidden /></span>
            <h2 className="font-display text-2xl font-semibold">Request submitted</h2>
            <p className="mt-2 text-ink-soft">Expected response within <strong>48 hours</strong>. (Prototype: a counselor reply arrives in about 20 seconds.)</p>
            <div className="mt-5 flex justify-center gap-2"><Button onClick={() => { setTab("history"); setSubmittedId(null); }}>View request history</Button><Button variant="secondary" onClick={() => { setSubmittedId(null); setQuestion(""); setContext(""); setShot(""); }}>New request</Button></div>
          </Card>
        ) : (
          <Card className="space-y-5">
            <div className="flex items-center justify-between rounded-2xl bg-brand-50 p-4"><p className="flex items-center gap-2 font-semibold text-brand-900"><Headset className="h-5 w-5" aria-hidden />One consult</p><p className="text-xl font-bold text-brand-800">{formatCurrency(CONSULT_PRICE_CENTS)}</p></div>
            <Select label="About which match?" optional value={about} onChange={setAbout} placeholder="Someone I haven't matched with" options={matches.map((m) => ({ value: m.user.id, label: m.profile.displayName }))} />
            <Textarea label="Your question" value={question} onChange={(e) => setQuestion(e.target.value)} error={errors.question} maxLength={600} counter={600} placeholder="e.g. They replied warmly for days, then went quiet after I suggested coffee. How should I read that?" />
            <Textarea label="Context" optional value={context} onChange={(e) => setContext(e.target.value)} maxLength={600} counter={600} className="min-h-24" placeholder="Anything that helps — how you met, schedules, what you're hoping for." />
            <div>
              <p className="mb-2 text-sm font-semibold">Screenshot of the conversation <span className="ml-1 rounded-full bg-cream-100 px-2 py-0.5 text-[11px] font-medium text-ink-mute">Optional</span></p>
              {shot ? <div className="flex items-center gap-3"><img src={shot} alt="Screenshot preview" className="h-24 rounded-2xl border border-cream-200" /><Button variant="ghost" size="sm" onClick={() => setShot("")}>Remove</Button></div> : (
                <div className="flex flex-wrap gap-2">
                  <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label="Upload screenshot" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) { try { setShot(await fileToDataUrl(f, 800)); } catch (err) { setErrors({ ...errors, shot: (err as Error).message }); } } }} />
                  <Button variant="secondary" size="sm" leftIcon={<ImagePlus className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>Upload image</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShot(screenshotArt(String(Date.now())))}>Use sample screenshot</Button>
                </div>
              )}
              {errors.shot && <p role="alert" className="mt-1 text-xs font-medium text-coral-700">{errors.shot}</p>}
              <p className="mt-2 text-xs text-ink-mute">Please crop out phone numbers, addresses and anything identifying.</p>
            </div>
            <Button size="lg" variant="accent" full onClick={proceed}>Continue to payment · {formatCurrency(CONSULT_PRICE_CENTS)}</Button>
          </Card>
        )
      ) : loading ? <SkeletonCard /> : mine.length === 0 ? (
        <EmptyState icon="🩺" title="No consult requests yet" description="Ask about a conversation, a mixed signal, or whether to plan that first date." action={<Button onClick={() => setTab("new")}>Start a request</Button>} />
      ) : (
        <ul className="space-y-4">
          {mine.map((r) => (
            <li key={r.id}><Card className="space-y-3">
              <div className="flex items-start justify-between gap-2"><div><p className="text-xs text-ink-mute">{formatDateTime(r.createdAt)} · {formatCurrency(r.priceCents)}</p><p className="mt-1 font-semibold">{r.question}</p></div><Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge></div>
              {r.screenshotUrl && <img src={r.screenshotUrl} alt="Submitted screenshot" className="h-20 rounded-xl border border-cream-200" />}
              {r.status === "answered" ? (
                <div className="rounded-2xl bg-brand-50 p-4"><p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-700"><Sparkles className="h-3.5 w-3.5" aria-hidden />Counselor response · {timeAgo(r.respondedAt!)}</p><p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{r.response}</p></div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-cream-100 p-3 text-sm text-ink-soft"><span className="flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden />Expected by {formatDateTime(r.respondBy)}</span><Button size="sm" variant="secondary" onClick={() => consultService.answer(r.id)}>Fast-forward response (demo)</Button></div>
              )}
            </Card></li>
          ))}
        </ul>
      )}

      <Modal open={pay} onClose={() => setPay(false)} title="Pay for Curbside Consult" description={`${formatCurrency(CONSULT_PRICE_CENTS)} · prototype payment`}>
        <MockPaymentForm amountCents={CONSULT_PRICE_CENTS} onPay={async ({ provider, cardNumber, forceFail }) => {
          const res = await consultService.submit({ userId: me.user.id, question, context, screenshotUrl: shot || undefined, provider, cardNumber, forceFail });
          if (!res.ok) return { ok: false, reason: res.reason };
          await sleep(100); setPay(false); setSubmittedId(res.request.id); return { ok: true };
        }} />
      </Modal>
    </Page>
  );
}
