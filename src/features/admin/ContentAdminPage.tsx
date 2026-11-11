import { useEffect, useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { adminService } from "@/services/adminService";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useDocumentTitle } from "@/hooks";
import { Markup } from "@/components/Markup";
import { AdminHeader, adminBtn, adminCard, adminInput } from "./AdminUI";

/** Placeholder CMS. Content here is NOT legal language — counsel must supply final copy. */
export function ContentAdminPage() {
  useDocumentTitle("Admin · Content");
  const { db } = useApp();
  const toast = useToast();
  const pages = db.content;
  const [slug, setSlug] = useState(pages[0]?.slug ?? "");
  const page = pages.find((p) => p.slug === slug);
  const [title, setTitle] = useState(page?.title ?? "");
  const [body, setBody] = useState(page?.body ?? "");
  const [preview, setPreview] = useState(false);
  useEffect(() => { const p = db.content.find((c) => c.slug === slug); if (p) { setTitle(p.title); setBody(p.body); } }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = !!page && (page.title !== title || page.body !== body);

  return (
    <div>
      <AdminHeader title="Content management" subtitle="Edit the public pages. Changes appear on the live site immediately." />
      <p role="note" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">Placeholder content only — not legal advice. Do not publish without review by qualified counsel.</p>
      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <ul className={`${adminCard} divide-y divide-slate-100 self-start`} aria-label="Pages">
          {pages.map((p) => <li key={p.slug}><button onClick={() => setSlug(p.slug)} className={cn("block w-full px-4 py-3 text-left", slug === p.slug ? "bg-teal-50 font-semibold text-teal-800" : "hover:bg-slate-50")}><span className="block text-sm">{p.title}</span><span className="text-xs text-slate-400">/{p.slug} · {formatDateTime(p.updatedAt)}</span></button></li>)}
        </ul>
        {page && (
          <section className={`${adminCard} space-y-4 p-5`} aria-label={`Edit ${page.title}`}>
            <div><label htmlFor="c-title" className="mb-1.5 block text-sm font-bold text-slate-700">Page title</label><input id="c-title" className={adminInput} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div>
              <div className="mb-1.5 flex items-center justify-between"><label htmlFor="c-body" className="text-sm font-bold text-slate-700">Content</label>
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold"><button onClick={() => setPreview(false)} aria-pressed={!preview} className={cn("inline-flex items-center gap-1 rounded-md px-3 py-1.5", !preview && "bg-white shadow-sm")}><Pencil className="h-3 w-3" aria-hidden />Edit</button><button onClick={() => setPreview(true)} aria-pressed={preview} className={cn("inline-flex items-center gap-1 rounded-md px-3 py-1.5", preview && "bg-white shadow-sm")}><Eye className="h-3 w-3" aria-hidden />Preview</button></div></div>
              {preview ? <div className="min-h-64 rounded-xl border border-slate-200 p-4"><Markup text={body} /></div> : <textarea id="c-body" rows={16} className={`${adminInput} h-auto py-3 font-mono text-[13px] leading-relaxed`} value={body} onChange={(e) => setBody(e.target.value)} />}
              <p className="mt-1 text-xs text-slate-400">Formatting: <code>## Heading</code> · <code>- bullet</code> · <code>&gt; callout</code> · blank line = new paragraph</p>
            </div>
            <div className="flex gap-2"><button className={adminBtn.primary} disabled={!dirty} onClick={async () => { await adminService.saveContent(page.slug, title, body); toast.success("Content saved"); }}>Save changes</button><button className={adminBtn.secondary} disabled={!dirty} onClick={() => { setTitle(page.title); setBody(page.body); }}>Discard</button></div>
          </section>
        )}
      </div>
    </div>
  );
}
