import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import type { MemberRecord, Message, ReportCategory } from "@/types";
import { REPORT_CATEGORIES } from "@/data/options";
import { screenshotArt } from "@/lib/placeholderArt";
import { safetyService } from "@/services/safetyService";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

/** Report a profile or a specific message. Ends on a clear "Your report has been submitted" confirmation. */
export function ReportModal({ open, onClose, reporterId, target, message, onBlocked }: {
  open: boolean; onClose: () => void; reporterId: string; target: MemberRecord; message?: Message; onBlocked?: () => void;
}) {
  const toast = useToast();
  const [category, setCategory] = useState<ReportCategory | "">("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ ref: string } | null>(null);

  useEffect(() => { if (open) { setCategory(message ? "inappropriate_message" : ""); setDetails(""); setError(""); setDone(null); } }, [open, message]);

  const submit = async () => {
    if (!category) { setError("Please choose a category so we can route your report."); return; }
    setBusy(true);
    try {
      const r = await safetyService.report({
        reporterId, reportedId: target.user.id, targetType: message ? "message" : "profile", messageId: message?.id, messageText: message?.body,
        category, details: details.trim(), evidence: message?.imageUrl ? [message.imageUrl] : message ? [screenshotArt(message.id)] : [],
      });
      setDone({ ref: r.id.slice(-6).toUpperCase() });
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  const name = target.profile.displayName;
  return (
    <Modal open={open} onClose={onClose} title={done ? "Report submitted" : message ? "Report this message" : `Report ${name}`} description={done ? undefined : "Reports are confidential. The member won't be told who reported them."} size="md"
      footer={done ? undefined : <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="accent" loading={busy} onClick={submit}>Submit report</Button></div>}>
      {done ? (
        <div className="flex flex-col items-center py-4 text-center" role="status">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-9 w-9" aria-hidden /></span>
          <h3 className="font-display text-xl font-semibold">Your report has been submitted</h3>
          <p className="mt-2 max-w-sm text-sm text-ink-soft">Thank you for helping keep KodeCupid safe. Our moderators review reports within 24 hours. Reference <strong>#{done.ref}</strong>.</p>
          <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            {onBlocked && <Button variant="danger" onClick={async () => { await safetyService.block(reporterId, target.user.id); toast.success(`${name} blocked`); onBlocked(); onClose(); }}>Also block {name.split(" ")[0]}</Button>}
            <Button onClick={onClose}>Done</Button>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-mute"><ShieldCheck className="h-3.5 w-3.5" aria-hidden />If you're in immediate danger, call 911.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {message && <blockquote className="rounded-2xl bg-cream-100 p-3 text-sm italic text-ink-soft">“{message.body || "Shared image"}”</blockquote>}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">What happened?</legend>
            <div role="radiogroup" className="space-y-2">
              {REPORT_CATEGORIES.map((c) => (
                <button key={c.value} type="button" role="radio" aria-checked={category === c.value} onClick={() => { setCategory(c.value); setError(""); }}
                  className={cn("flex w-full flex-col rounded-2xl border p-3 text-left transition-all", category === c.value ? "border-coral-400 bg-coral-50 ring-2 ring-coral-100" : "border-cream-200 hover:border-coral-200")}>
                  <span className="text-sm font-semibold">{c.label}</span>
                  <span className="text-xs text-ink-mute">{c.hint}</span>
                </button>
              ))}
            </div>
            {error && <p role="alert" className="mt-2 text-xs font-medium text-coral-700">{error}</p>}
          </fieldset>
          <Textarea label="Anything else we should know?" optional value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} counter={500} placeholder="Add context that helps our team." />
        </div>
      )}
    </Modal>
  );
}
