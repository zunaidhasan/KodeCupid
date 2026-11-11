import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export const adminCard = "rounded-2xl border border-slate-200 bg-white shadow-sm";

export function AdminHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>
      {action}
    </header>
  );
}

export function StatCard({ label, value, to, icon: Icon, tone = "teal", hint }: { label: string; value: number | string; to?: string; icon: LucideIcon; tone?: "teal" | "coral" | "amber" | "slate"; hint?: string }) {
  const tones = { teal: "bg-teal-50 text-teal-700", coral: "bg-rose-50 text-rose-600", amber: "bg-amber-50 text-amber-700", slate: "bg-slate-100 text-slate-600" };
  const body = (
    <div className={cn(adminCard, "flex items-center gap-4 p-5 transition-shadow", to && "hover:shadow-md")}>
      <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl", tones[tone])}><Icon className="h-6 w-6" aria-hidden /></span>
      <div><p className="text-3xl font-bold leading-none text-slate-900">{value}</p><p className="mt-1 text-sm font-medium text-slate-500">{label}</p>{hint && <p className="text-xs text-slate-400">{hint}</p>}</div>
    </div>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
}

const PILL: Record<string, string> = {
  verified: "bg-emerald-100 text-emerald-800", active: "bg-emerald-100 text-emerald-800", succeeded: "bg-emerald-100 text-emerald-800", completed: "bg-emerald-100 text-emerald-800", resolved: "bg-emerald-100 text-emerald-800", accepted: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800", needs_info: "bg-amber-100 text-amber-800", in_review: "bg-sky-100 text-sky-800", processing: "bg-sky-100 text-sky-800", past_due: "bg-amber-100 text-amber-800",
  new: "bg-rose-100 text-rose-700", denied: "bg-rose-100 text-rose-700", suspended: "bg-rose-100 text-rose-700", failed: "bg-rose-100 text-rose-700", removed: "bg-slate-200 text-slate-700",
  canceled: "bg-slate-200 text-slate-700", refunded: "bg-slate-200 text-slate-700", unverified: "bg-slate-100 text-slate-600", pending_deletion: "bg-slate-200 text-slate-700",
};
export function StatusPill({ status, label }: { status: string; label?: string }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold capitalize", PILL[status] ?? "bg-slate-100 text-slate-700")}>{label ?? status.replace(/_/g, " ")}</span>;
}

export const adminInput = "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-100";
export const adminBtn = {
  primary: "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50",
  secondary: "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50",
  danger: "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50",
  warn: "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50",
};

export function AdminEmpty({ title, text }: { title: string; text?: string }) {
  return <div className={cn(adminCard, "px-6 py-14 text-center")}><p className="text-lg font-semibold text-slate-700">{title}</p>{text && <p className="mt-1 text-sm text-slate-500">{text}</p>}</div>;
}
