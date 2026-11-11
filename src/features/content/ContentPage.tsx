import { Link } from "react-router-dom";
import { Markup } from "@/components/Markup";
import { buttonStyles } from "@/components/ui/Button";
import { SkeletonText } from "@/components/ui/SkeletonLoader";
import { useApp } from "@/context/AppContext";
import { useDocumentTitle, useSimulatedLoading } from "@/hooks";
import { formatDate } from "@/lib/format";

/** Renders an admin-editable CMS page (Terms, Privacy, FAQs, Pledge, Safety Tips, Contact). */
export function ContentPage({ slug }: { slug: string }) {
  const { db } = useApp();
  const page = db.content.find((c) => c.slug === slug);
  const loading = useSimulatedLoading(250);
  useDocumentTitle(page?.title ?? "Page");
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
      {loading ? <SkeletonText lines={8} /> : !page ? <p>This page isn't available.</p> : (
        <>
          <p className="text-sm font-semibold uppercase tracking-widest text-coral-600">KodeCupid</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">{page.title}</h1>
          <p className="mt-2 text-sm text-ink-mute">Last updated {formatDate(page.updatedAt)}</p>
          <div className="mt-6"><Markup text={page.body} /></div>
          {slug === "safety-tips" && (
            <p className="mt-6 rounded-2xl bg-coral-50 p-4 text-sm text-ink-soft">
              Need immediate help? Call <strong>911</strong>. For emotional crisis support in the US, call or text <a className="font-semibold text-brand-700 underline" href="https://988lifeline.org" target="_blank" rel="noreferrer">988</a>.
            </p>
          )}
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/signup" className={buttonStyles({ variant: "accent" })}>Create your profile</Link>
            <Link to="/" className={buttonStyles({ variant: "secondary" })}>Back to home</Link>
          </div>
        </>
      )}
    </article>
  );
}
