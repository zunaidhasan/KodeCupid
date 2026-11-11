import { useRef, useState } from "react";
import { BadgeCheck, Clock, FileUp, Hash, Info, Search, ShieldCheck, SkipForward } from "lucide-react";
import type { VerificationMethod, VerificationRecord, VerificationStatus } from "@/types";
import { credentialArt } from "@/lib/placeholderArt";
import { fileToDataUrl } from "@/lib/image";
import { formatDateTime } from "@/lib/format";
import { npiRegistry } from "@/services/providers";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SegmentedTabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";

export interface VerificationSubmission {
  method: VerificationMethod;
  npi?: string;
  npiLookup?: VerificationRecord["npiLookup"];
  credentialUrl?: string;
  credentialLabel?: string;
}

const CREDENTIAL_TYPES = ["Work ID badge", "Professional license", "Certification", "Faculty / staff ID", "Other credential"].map((v) => ({ value: v, label: v }));

/**
 * Two verification paths: automated NPI lookup (mock) or manual credential upload (reviewed by a moderator).
 * Shared by the onboarding wizard and Me → Verification.
 */
export function VerificationPanel({ status, method, history, reviewerNote, onSubmit, onDemoSkip, onReset }: {
  status: VerificationStatus; method?: VerificationMethod; history?: VerificationRecord["history"]; reviewerNote?: string;
  onSubmit: (s: VerificationSubmission) => Promise<void> | void; onDemoSkip: () => Promise<void> | void; onReset?: () => void;
}) {
  const [tab, setTab] = useState<"npi" | "manual">("npi");
  const [npi, setNpi] = useState("");
  const [lookup, setLookup] = useState<{ found: boolean; name?: string; taxonomy?: string; state?: string; active?: boolean; message?: string } | null>(null);
  const [looking, setLooking] = useState(false);
  const [npiErr, setNpiErr] = useState("");
  const [label, setLabel] = useState("Work ID badge");
  const [file, setFile] = useState<string>("");
  const [fileErr, setFileErr] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (status === "verified") {
    return (
      <div role="status" className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <BadgeCheck className="mx-auto h-12 w-12 fill-emerald-600 text-white" aria-hidden />
        <h3 className="mt-2 font-display text-xl font-semibold text-emerald-900">You're verified</h3>
        <p className="mt-1 text-sm text-emerald-800">Your badge shows on your profile. Other members never see your documents.</p>
        <History history={history} />
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div role="status" className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center">
        <Clock className="mx-auto h-12 w-12 text-amber-600" aria-hidden />
        <h3 className="mt-2 font-display text-xl font-semibold text-amber-900">Pending review</h3>
        <p className="mt-1 text-sm text-amber-800">{method === "npi" ? "We're confirming your NPI record." : "A moderator is reviewing your credential."} This usually takes 1–2 business days. You can keep using KodeCupid meanwhile.</p>
        <History history={history} />
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={onDemoSkip} leftIcon={<SkipForward className="h-4 w-4" />}>Skip for demo — mark verified</Button>
          {onReset && <Button variant="ghost" size="sm" onClick={onReset}>Change method</Button>}
        </div>
      </div>
    );
  }

  const doLookup = async () => {
    const digits = npi.replace(/\D/g, "");
    if (digits.length !== 10) { setNpiErr("NPI numbers have exactly 10 digits."); return; }
    setNpiErr(""); setLooking(true); setLookup(null);
    setLookup(await npiRegistry.lookup(digits));
    setLooking(false);
  };
  const submitNpi = async () => {
    if (!lookup?.found) return;
    setBusy(true);
    await onSubmit({ method: "npi", npi: npi.replace(/\D/g, ""), npiLookup: { name: lookup.name ?? "", taxonomy: lookup.taxonomy ?? "", state: lookup.state ?? "", active: !!lookup.active } });
    setBusy(false);
  };
  const submitManual = async () => {
    if (!file) { setFileErr("Please add a photo of your credential first."); return; }
    setBusy(true);
    await onSubmit({ method: "manual", credentialUrl: file, credentialLabel: label });
    setBusy(false);
  };

  return (
    <div className="space-y-5">
      {(status === "needs_info" || status === "denied") && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden /><p><strong>{status === "needs_info" ? "We need a bit more information." : "We couldn't verify you yet."}</strong> {reviewerNote}</p></div>
      )}
      <SegmentedTabs label="Verification method" value={tab} onChange={setTab} items={[{ id: "npi", label: "NPI number (automatic)" }, { id: "manual", label: "Upload credential" }]} />

      {tab === "npi" ? (
        <div className="space-y-4" role="tabpanel">
          <p className="text-sm text-ink-soft">For licensed clinicians. Enter your 10-digit NPI. <span className="text-ink-mute">(Prototype: try <code className="rounded bg-cream-100 px-1 font-bold">1234567893</code> for a match.)</span></p>
          <div className="flex gap-2">
            <Input wrapperClassName="flex-1" label="NPI number" inputMode="numeric" maxLength={10} value={npi} onChange={(e) => { setNpi(e.target.value.replace(/\D/g, "")); setLookup(null); }} error={npiErr} prefix={<Hash className="h-4 w-4" aria-hidden />} placeholder="1234567893" />
            <Button className="mt-[26px]" variant="secondary" loading={looking} onClick={doLookup} leftIcon={<Search className="h-4 w-4" />}>Look up</Button>
          </div>
          {lookup && (lookup.found ? (
            <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-emerald-900"><ShieldCheck className="h-5 w-5" aria-hidden />Registry match found (mock)</p>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-sm text-emerald-900"><div><dt className="text-xs text-emerald-700">Specialty</dt><dd className="font-semibold">{lookup.taxonomy}</dd></div><div><dt className="text-xs text-emerald-700">State</dt><dd className="font-semibold">{lookup.state}</dd></div><div><dt className="text-xs text-emerald-700">Status</dt><dd className="font-semibold">{lookup.active ? "Active" : "Inactive"}</dd></div></dl>
              <Button className="mt-4" full loading={busy} onClick={submitNpi}>Submit for verification</Button>
            </div>
          ) : <p role="alert" className="rounded-2xl bg-coral-50 p-3 text-sm font-medium text-coral-700">{lookup.message}</p>)}
        </div>
      ) : (
        <div className="space-y-4" role="tabpanel">
          <p className="text-sm text-ink-soft">Upload a clear photo of a badge, license, work ID or other credential. Cover anything you don't want us to see — we only need your name and employer or license type. Only moderators can view it.</p>
          <Select label="Credential type" value={label} onChange={setLabel} options={CREDENTIAL_TYPES} />
          <div className={cn("rounded-3xl border-2 border-dashed p-5 text-center", file ? "border-emerald-300 bg-emerald-50" : fileErr ? "border-coral-300" : "border-cream-200 bg-white")}>
            {file ? <img src={file} alt="Your uploaded credential preview" className="mx-auto max-h-48 rounded-2xl shadow" /> : <FileUp className="mx-auto h-10 w-10 text-ink-mute" aria-hidden />}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" id="cred-file" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { setFile(await fileToDataUrl(f, 900)); setFileErr(""); } catch (err) { setFileErr((err as Error).message); } }} />
              <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>{file ? "Choose a different photo" : "Choose a photo"}</Button>
              <Button variant="ghost" size="sm" onClick={() => { setFile(credentialArt(label, "Sample Member", label)); setFileErr(""); }}>Use sample image</Button>
            </div>
            {fileErr && <p role="alert" className="mt-2 text-xs font-medium text-coral-700">{fileErr}</p>}
          </div>
          <Button full loading={busy} onClick={submitManual}>Submit for review</Button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-cream-100 pt-4">
        <p className="text-xs text-ink-mute">Verification is not a background check. It confirms you work in an eligible profession.</p>
        <Button variant="soft" size="sm" onClick={onDemoSkip} leftIcon={<SkipForward className="h-4 w-4" />} className="shrink-0">Skip for demo</Button>
      </div>
    </div>
  );
}

function History({ history }: { history?: VerificationRecord["history"] }) {
  if (!history?.length) return null;
  return (
    <ol className="mx-auto mt-4 max-w-sm space-y-1.5 text-left text-xs text-ink-soft" aria-label="Status history">
      {history.slice().reverse().map((h, i) => (
        <li key={i} className="flex items-start gap-2"><Badge size="sm" tone={h.status === "verified" ? "success" : h.status === "pending" ? "warning" : "neutral"}>{h.status.replace("_", " ")}</Badge><span>{formatDateTime(h.at)} — {h.note}</span></li>
      ))}
    </ol>
  );
}
