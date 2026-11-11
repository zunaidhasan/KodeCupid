import { useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useDialog } from "@/hooks";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** On md+ screens the sheet becomes a right-hand drawer */
  className?: string;
}

/** Bottom sheet on mobile, side drawer on desktop. Same a11y behaviour as <Modal>. */
export function BottomSheet({ open, onClose, title, description, children, footer, className }: BottomSheetProps) {
  const titleId = useId();
  const ref = useDialog(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-end md:items-stretch">
      <div className="absolute inset-0 animate-fade-in bg-brand-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn("relative flex max-h-[90dvh] w-full animate-slide-up flex-col rounded-t-[2rem] bg-white shadow-card outline-none md:max-h-none md:w-[440px] md:rounded-l-[2rem] md:rounded-tr-none", className)}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-cream-200 md:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-4 px-6 pb-3 pt-4">
          <div>
            <h2 id={titleId} className="font-display text-xl font-semibold text-ink">{title}</h2>
            {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="-mr-2 rounded-full p-2 text-ink-mute hover:bg-cream-100 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        {footer && <div className="border-t border-cream-100 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
