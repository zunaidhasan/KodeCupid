import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, CalendarHeart, CalendarClock, Check, EyeOff, HeartHandshake, MailCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PlanCards } from "@/features/billing/PlanCards";
import { useDocumentTitle } from "@/hooks";
import { authService } from "@/services/authService";
import { COIN_PACKS, GIFTS, PASSES } from "@/data/catalog";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";

const AUDIENCE = [
  { emoji: "🩺", title: "Healthcare professionals", text: "Physicians, nurses, PAs, pharmacists, therapists, EMTs, veterinarians and administrators." },
  { emoji: "🍎", title: "Educators", text: "Teachers, principals, superintendents and the school staff who hold communities together." },
  { emoji: "🎓", title: "College & university", text: "Professors, deans, registrars, advisors and campus staff." },
  { emoji: "🔬", title: "Scientists", text: "Researchers, lab leads and field scientists who love a good question." },
  { emoji: "🛡️", title: "Public-health workers", text: "Epidemiologists, health educators and community-health teams." },
  { emoji: "✨", title: "Related roles", text: "Allied professionals reviewed by our team for eligibility." },
];

const BENEFITS = [
  { icon: BadgeCheck, title: "Verified professional community", text: "Every member verifies with an NPI lookup or a reviewed work credential. Documents are never shown to other members." },
  { icon: CalendarClock, title: "Shift-aware matching", text: "We compare days, nights, swings and school hours so you meet people whose free time actually lines up." },
  { icon: EyeOff, title: "Workplace privacy controls", text: "Hide your profile within a radius of your hospital, clinic, school or campus. Default: 1 mile." },
  { icon: ShieldCheck, title: "Safety & moderation", text: "Report profiles or messages, block anyone, and rely on a human moderation team reviewing every report." },
  { icon: CalendarHeart, title: "Micro-date scheduling", text: "Skip the endless texting. Pick a shared free window and a public spot near work for a quick coffee." },
];

export function LandingPage() {
  useDocumentTitle("Where verified professionals make real connections");
  const navigate = useNavigate();
  const [waitlist, setWaitlist] = useState(false);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [joined, setJoined] = useState(false);

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr("Please enter a valid email address."); return; }
    try { localStorage.setItem("kodecupid.waitlist", JSON.stringify([...(JSON.parse(localStorage.getItem("kodecupid.waitlist") || "[]") as string[]), email])); } catch { /* ignore */ }
    setJoined(true); setErr("");
  };
  const demo = async () => { await authService.signInDemo(); navigate("/app"); };

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-coral-100 blur-3xl" />
        <div aria-hidden className="absolute -left-24 top-40 h-80 w-80 rounded-full bg-brand-100 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-2">
          <div>
            <Badge tone="coral" icon={<Sparkles className="h-3.5 w-3.5" aria-hidden />}>Verified community · Prototype preview</Badge>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-brand-900 sm:text-5xl lg:text-6xl">
              Where verified professionals make <span className="text-coral-500">real connections.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              KodeCupid is a dating and social community for people in healthcare, education, universities and science. We match on what matters — values, goals, and a schedule that actually works with yours.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/signup" className={buttonStyles({ variant: "accent", size: "lg" })}>Create your profile <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              <Button size="lg" variant="secondary" onClick={() => { setJoined(false); setWaitlist(true); }}>Join the waitlist</Button>
            </div>
            <p className="mt-4 text-sm text-ink-mute">Want a look around first? <button onClick={demo} className="font-semibold text-brand-700 underline underline-offset-2">Try the demo member</button></p>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink-soft">
              {["18+ only", "Verified members", "No coworkers by surprise"].map((t) => <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-brand-600" aria-hidden />{t}</li>)}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <img src="/images/hero.jpg" alt="Illustration of a nurse in scrubs and a teacher laughing together over coffee" className="w-full rounded-[2.5rem] object-cover shadow-card" />
            <div className="absolute -left-3 top-8 animate-pop rounded-2xl bg-white p-3 shadow-card sm:-left-8">
              <p className="flex items-center gap-1.5 text-sm font-bold text-brand-800"><BadgeCheck className="h-4 w-4 fill-brand-600 text-white" aria-hidden />Verified professional</p>
              <p className="text-xs text-ink-mute">NPI confirmed</p>
            </div>
            <div className="absolute -right-2 bottom-24 animate-pop rounded-2xl bg-white p-3 shadow-card sm:-right-6">
              <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-700"><CalendarClock className="h-4 w-4" aria-hidden />Great schedule overlap</p>
              <p className="text-xs text-ink-mute">Night shift ↔ Night shift</p>
            </div>
            <div className="absolute -bottom-4 left-6 animate-pop rounded-2xl bg-brand-900 p-3 text-white shadow-card">
              <p className="flex items-center gap-1.5 text-sm font-bold"><EyeOff className="h-4 w-4" aria-hidden />Hidden near St. Aldric</p>
              <p className="text-xs text-brand-200">Workplace privacy · 1 mile</p>
            </div>
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="who">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-coral-600">Who it's for</p>
          <h2 id="who" className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">People who care for, teach and discover.</h2>
          <p className="mt-3 text-ink-soft">Your job shapes your hours, your stress and your sense of humor. KodeCupid is built for the professionals who get that.</p>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCE.map((a) => (
            <li key={a.title} className="rounded-3xl border border-cream-200 bg-white p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card">
              <span className="text-3xl" aria-hidden>{a.emoji}</span>
              <h3 className="mt-3 font-display text-lg font-semibold">{a.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{a.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* BENEFITS */}
      <section className="bg-brand-900 py-16 text-white" aria-labelledby="benefits">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-coral-300">Why KodeCupid</p>
          <h2 id="benefits" className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">Dating built around real professional lives.</h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-coral-500 text-white"><Icon className="h-5 w-5" aria-hidden /></span>
                <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-brand-100">{text}</p>
              </li>
            ))}
            <li className="rounded-3xl bg-gradient-to-br from-coral-500 to-coral-600 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-coral-100">Schedule compatibility</p>
              <div className="mt-4 space-y-2" aria-label="Example: a night-shift nurse and an evening-swing paramedic share two free hours">
                {[["Night RN", [19, 7]], ["Swing EMT", [15, 23]]].map(([label, [s, e]]) => (
                  <div key={label as string} className="flex items-center gap-2 text-xs">
                    <span className="w-16 shrink-0 text-coral-50">{label as string}</span>
                    <div className="flex h-5 flex-1 overflow-hidden rounded-full bg-white/20">
                      {Array.from({ length: 24 }, (_, h) => {
                        const work = (s as number) < (e as number) ? h >= (s as number) && h < (e as number) : h >= (s as number) || h < (e as number);
                        return <span key={h} className={cn("flex-1", work ? "bg-brand-900/70" : "bg-white/70")} />;
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm font-semibold text-white">White = free time. We highlight the overlap.</p>
            </li>
          </ul>
        </div>
      </section>

      {/* HOW IT WORKS + COMMUNITY */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2" aria-labelledby="how">
        <img src="/images/community.jpg" alt="Illustration of a nurse, teacher, scientist and professor standing together" className="w-full rounded-[2.5rem] object-cover shadow-card" loading="lazy" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-coral-600">How it works</p>
          <h2 id="how" className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">From “hello” to a coffee between shifts.</h2>
          <ol className="mt-8 space-y-6">
            {[["Verify who you are", "Enter your NPI number or upload a badge. A moderator reviews manual submissions."], ["Match on more than looks", "See a transparent compatibility estimate and whether your schedules overlap."], ["Plan a micro-date", "Choose a shared free window and a public venue near your workplace."]].map(([t, d], i) => (
              <li key={t} className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral-100 font-bold text-coral-700">{i + 1}</span><div><h3 className="font-semibold">{t}</h3><p className="text-sm text-ink-soft">{d}</p></div></li>
            ))}
          </ol>
          <Link to="/community-pledge" className="mt-8 inline-flex items-center gap-2 font-semibold text-brand-700 hover:underline"><HeartHandshake className="h-5 w-5" aria-hidden />Read our Community Pledge</Link>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section className="bg-cream-100 py-16" aria-labelledby="pricing">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-coral-600">Pricing preview</p>
            <h2 id="pricing" className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Simple plans. Pause anytime.</h2>
            <p className="mt-3 text-ink-soft">Prototype pricing — no real charges. Free members receive up to one match per week and cannot search member profiles.</p>
          </div>
          <div className="mt-10"><PlanCards onSelect={() => navigate("/signup")} ctaLabel={(id) => (id === "free" ? "Start free" : "Create profile")} /></div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {PASSES.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-3xl border border-cream-200 bg-white p-5">
                <span className="text-3xl" aria-hidden>{p.emoji}</span>
                <div><h3 className="font-semibold">{p.name}</h3><p className="text-sm text-ink-soft">{p.blurb}</p></div>
                <span className="ml-auto text-xl font-bold">{formatCurrency(p.priceCents)}</span>
              </div>
            ))}
            <div className="flex items-center gap-4 rounded-3xl border border-dashed border-coral-300 bg-coral-50 p-5">
              <span className="text-3xl" aria-hidden>🪙</span>
              <div><h3 className="font-semibold">Gifts & coins</h3><p className="text-sm text-ink-soft">From {formatCurrency(COIN_PACKS[0].priceCents)} · {GIFTS.length} gifts · mock purchase, coming soon.</p></div>
            </div>
          </div>
          <div className="mt-8 text-center"><Link to="/pricing" className={buttonStyles({ variant: "secondary" })}>Compare everything</Link></div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">Ready to meet someone who gets it?</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">Create your profile in about two minutes. You only need your name, age, location, gender and who you'd like to meet — everything else can wait.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/signup" className={buttonStyles({ variant: "accent", size: "lg" })}>Create your profile</Link>
          <Button size="lg" variant="secondary" onClick={() => { setJoined(false); setWaitlist(true); }}>Join the waitlist</Button>
        </div>
      </section>

      <Modal open={waitlist} onClose={() => setWaitlist(false)} title={joined ? "You're on the list! 🎉" : "Join the waitlist"} description={joined ? undefined : "We'll email you when KodeCupid opens in your area."}>
        {joined ? (
          <div className="py-4 text-center"><MailCheck className="mx-auto h-12 w-12 text-brand-600" aria-hidden /><p className="mt-3 text-ink-soft">Thanks! We'll be in touch at <strong>{email}</strong>. (Prototype: stored locally only.)</p><Button className="mt-5" onClick={() => setWaitlist(false)}>Close</Button></div>
        ) : (
          <form onSubmit={join} noValidate className="space-y-4">
            <Input label="Email address" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={err} placeholder="you@hospital-or-school.org" />
            <Button type="submit" variant="accent" full size="lg">Join the waitlist</Button>
          </form>
        )}
      </Modal>
    </>
  );
}
