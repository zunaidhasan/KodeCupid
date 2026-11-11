import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, CalendarClock, EyeOff, Phone, Terminal } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { useDocumentTitle } from "@/hooks";
import { formatPhone } from "@/lib/format";
import { authService } from "@/services/authService";
import { MOCK_OTP } from "@/services/providers";
import { OtpInput } from "./OtpInput";

export function SignupPage() {
  const [params] = useSearchParams();
  const login = params.get("mode") === "login";
  useDocumentTitle(login ? "Log in" : "Create your profile");
  const { session } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState(false);
  const [adult, setAdult] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (session.userId) return <Navigate to={session.onboardingComplete ? "/app" : "/onboarding"} replace />;

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const errs: Record<string, string> = {};
    if (phone.replace(/\D/g, "").length < 10) errs.phone = "Enter a valid 10-digit mobile number.";
    if (!login && !terms) errs.terms = "Please accept the Terms of Service and Community Guidelines to continue.";
    if (!login && !adult) errs.adult = "You must confirm that you are 18 or older.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try { await authService.sendOtp(phone); setStep("otp"); setOtp(""); setCooldown(20); }
    catch (err) { setErrors({ phone: (err as Error).message }); }
    finally { setBusy(false); }
  };

  const verify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length !== 6) { setErrors({ otp: "Enter all 6 digits of your code." }); return; }
    setBusy(true);
    try { await authService.verifyOtp(phone, otp); setErrors({}); }
    catch (err) { setErrors({ otp: (err as Error).message }); setBusy(false); }
  };

  const demo = async () => { await authService.signInDemo(); navigate("/app"); };

  return (
    <div className="grid min-h-dvh bg-cream lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-900 p-12 text-white lg:flex">
        <div aria-hidden className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-coral-500/20 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <Link to="/" className="relative"><Logo light /></Link>
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-tight">Dating that understands your schedule.</h2>
          <ul className="mt-8 space-y-5 text-brand-100">
            {[[BadgeCheck, "Verified professionals only", "NPI lookup or credential review."], [CalendarClock, "Shift-aware matching", "Days, nights, swings, or school hours."], [EyeOff, "Workplace privacy", "Hide your profile near your hospital, school or campus."]].map(([Icon, t, d]) => {
              const I = Icon as typeof BadgeCheck;
              return <li key={t as string} className="flex gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10"><I className="h-5 w-5" aria-hidden /></span><span><span className="block font-semibold text-white">{t as string}</span><span className="text-sm">{d as string}</span></span></li>;
            })}
          </ul>
        </div>
        <p className="relative text-xs text-brand-300">Prototype · fictional members · no real SMS or payments</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))] sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden"><Link to="/" aria-label="Home"><Logo /></Link></div>
          {step === "phone" ? (
            <form onSubmit={sendCode} noValidate className="space-y-6">
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight">{login ? "Welcome back" : "Create your profile"}</h1>
                <p className="mt-2 text-ink-soft">{login ? "Log in with your mobile number — we'll text you a code." : "Start with your mobile number. We'll text you a 6-digit code to keep the community real."}</p>
              </div>
              <Input label="Mobile number" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(303) 555-0100" prefix={<Phone className="h-4 w-4" aria-hidden />} value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} error={errors.phone} />
              {!login && (
                <div className="space-y-3">
                  <div>
                    <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
                      <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 rounded accent-brand-700" aria-invalid={!!errors.adult} />
                      <span>I confirm that I am <strong className="text-ink">18 years or older</strong>.</span>
                    </label>
                    {errors.adult && <p role="alert" className="mt-1 pl-8 text-xs font-medium text-coral-700">{errors.adult}</p>}
                  </div>
                  <div>
                    <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
                      <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 rounded accent-brand-700" aria-invalid={!!errors.terms} />
                      <span>I agree to the <Link to="/terms" target="_blank" className="font-semibold text-brand-700 underline">Terms of Service</Link> and <Link to="/community-pledge" target="_blank" className="font-semibold text-brand-700 underline">Community Guidelines</Link>.</span>
                    </label>
                    {errors.terms && <p role="alert" className="mt-1 pl-8 text-xs font-medium text-coral-700">{errors.terms}</p>}
                  </div>
                </div>
              )}
              <Button type="submit" size="lg" variant="accent" full loading={busy}>Send my code</Button>
              <div className="relative text-center text-xs text-ink-mute"><span className="relative z-10 bg-cream px-3">or explore the prototype</span><span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-cream-200" /></div>
              <Button type="button" variant="secondary" size="lg" full onClick={demo}>Try the demo member (Taylor, ICU nurse)</Button>
              <p className="text-center text-sm text-ink-soft">{login ? <>New here? <Link to="/signup" className="font-semibold text-brand-700 underline">Create your profile</Link></> : <>Already a member? <Link to="/signup?mode=login" className="font-semibold text-brand-700 underline">Log in</Link></>}</p>
            </form>
          ) : (
            <form onSubmit={verify} noValidate className="space-y-6">
              <button type="button" onClick={() => { setStep("phone"); setErrors({}); }} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700"><ArrowLeft className="h-4 w-4" aria-hidden />Change number</button>
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight">Enter your code</h1>
                <p className="mt-2 text-ink-soft">We sent a 6-digit code to <strong className="text-ink">{phone}</strong>.</p>
              </div>
              <OtpInput value={otp} onChange={(v) => { setOtp(v); setErrors({}); }} error={!!errors.otp} />
              {errors.otp && <p role="alert" className="text-sm font-medium text-coral-700">{errors.otp}</p>}
              <div role="note" className="flex gap-3 rounded-2xl border border-dashed border-brand-300 bg-brand-50 p-4 text-sm text-brand-900">
                <Terminal className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">Developer note · SMS is mocked</p>
                  <p className="mt-0.5">No text message is sent. Any 6-digit code works — try <code className="rounded bg-white px-1.5 py-0.5 font-bold">{MOCK_OTP}</code>.</p>
                  <button type="button" onClick={() => setOtp(MOCK_OTP)} className="mt-2 font-semibold underline">Fill it in for me</button>
                </div>
              </div>
              <Button type="submit" size="lg" variant="accent" full loading={busy}>Verify and continue</Button>
              <p className="text-center text-sm text-ink-soft">
                {cooldown > 0 ? `Resend code in ${cooldown}s` : <button type="button" className="font-semibold text-brand-700 underline" onClick={() => sendCode()}>Resend code</button>}
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
