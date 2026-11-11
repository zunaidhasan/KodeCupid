import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export function PageHeader({ title, subtitle, back, action, className }: { title: string; subtitle?: string; back?: string; action?: ReactNode; className?: string }) {
  return (
    <header className={cn("mb-6 flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {back && (
          <Link to={back} className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            <ChevronLeft className="h-4 w-4" aria-hidden />Back
          </Link>
        )}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft sm:text-base">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

/** Standard page container for member screens. */
export function Page({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return <div className={cn("mx-auto w-full px-4 py-6 sm:px-6 md:py-8", wide ? "max-w-5xl" : "max-w-3xl", className)}>{children}</div>;
}
