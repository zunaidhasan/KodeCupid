import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { accountService } from "@/services/accountService";
import { useDocumentTitle } from "@/hooks";
import { formatDateTime } from "@/lib/format";
import type { AccountDeletionRequest } from "@/types";

const REASONS = ["I found a partner", "I'm taking a break", "Privacy concerns", "Not enough matches", "It's too expensive", "A safety concern", "Something else"].map((r) => ({ value: r, label: r }));

/** Public (no login) account closure / data deletion form → shows up in the admin console. */
export function AccountClosurePage() {
  useDocumentTitle("Account closure & data deletion");
  const [contact, setContact] = useState("");
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<AccountDeletionRequest | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!contact.trim()) errs.contact = "Enter the email or phone number on your account.";
    if (!reason) errs.reason = "Please choose a reason.";
    if (!confirm) errs.confirm = "Please confirm you understand this request is permanent.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try { setDone(await accountService.submitDeletionRequest({ contact, reason })); }
    catch (err) { setErrors({ contact: (err as Error).message }); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 md:py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-coral-600">Your data, your choice</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Account closure & data deletion</h1>
      <p className="mt-3 text-ink-soft">You don't need to log in. Tell us which account to close and we'll review your request and process removal of your personal data.</p>

      {done ? (
        <Card className="mt-8 text-center" role="status">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-9 w-9" aria-hidden /></span>
          <h2 className="font-display text-2xl font-semibold">Request received</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">Thanks. Your request <strong>#{done.id.slice(-6).toUpperCase()}</strong> was submitted on {formatDateTime(done.createdAt)}. Our team will review it and personal data removal will be processed. We may contact <strong>{done.contact}</strong> to confirm it's you.</p>
          <p className="mt-3 text-xs text-ink-mute">Prototype: this request is stored locally and visible in the Admin console under “Deletion requests”.</p>
          <div className="mt-6 flex justify-center gap-2"><Link to="/" className={buttonStyles()}>Back to home</Link><Link to="/admin/deletions" className={buttonStyles({ variant: "secondary" })}>See in admin console</Link></div>
        </Card>
      ) : (
        <Card className="mt-8">
          <form onSubmit={submit} noValidate className="space-y-5">
            <Input label="Email or phone number on your account" value={contact} onChange={(e) => setContact(e.target.value)} error={errors.contact} autoComplete="email" placeholder="you@example.com or (555) 123-4567" />
            <Select label="Reason for closing" value={reason} onChange={setReason} options={REASONS} placeholder="Choose a reason" error={errors.reason} />
            <div>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
                <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-1 h-5 w-5 rounded accent-brand-700" aria-invalid={!!errors.confirm} />
                <span>I understand that closing my account will remove my profile, matches and messages, and that this can't be undone.</span>
              </label>
              {errors.confirm && <p role="alert" className="mt-1.5 text-xs font-medium text-coral-700">{errors.confirm}</p>}
            </div>
            <Button type="submit" variant="accent" size="lg" full loading={busy}>Submit closure request</Button>
            <p className="flex items-start gap-2 text-xs text-ink-mute"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />We only use this information to find and close your account.</p>
          </form>
        </Card>
      )}
    </div>
  );
}
