import { AlertCircle, BellRing, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastTone = "success" | "error" | "info" | "push";
export interface ToastItem { id: string; title: string; description?: string; tone: ToastTone; link?: string }

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />,
  error: <AlertCircle className="h-5 w-5 text-coral-600" aria-hidden />,
  info: <Info className="h-5 w-5 text-brand-600" aria-hidden />,
  push: <BellRing className="h-5 w-5 text-coral-500" aria-hidden />,
};

export function ToastViewport({ items, onDismiss, onOpen }: { items: ToastItem[]; onDismiss: (id: string) => void; onOpen: (link: string) => void }) {
  return (
    <div role="region" aria-label="Notifications" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-end sm:p-5">
      {items.map((t) => (
        <div key={t.id} role="status" className={cn("pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-white p-4 shadow-card animate-slide-up", t.tone === "push" ? "border-coral-200" : "border-cream-200")}>
          <span className="mt-0.5">{icons[t.tone]}</span>
          <div className="min-w-0 flex-1">
            {t.tone === "push" && <p className="text-[10px] font-bold uppercase tracking-wider text-coral-600">Push notification · mock</p>}
            <p className="text-sm font-semibold text-ink">{t.title}</p>
            {t.description && <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{t.description}</p>}
            {t.link && (
              <button onClick={() => { onOpen(t.link!); onDismiss(t.id); }} className="mt-1.5 text-sm font-semibold text-brand-700 hover:underline">
                Open
              </button>
            )}
          </div>
          <button onClick={() => onDismiss(t.id)} aria-label="Dismiss notification" className="rounded-full p-1 text-ink-mute hover:bg-cream-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
