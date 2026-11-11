import { useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useDialog } from "@/hooks";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  hideTitle?: boolean;
  dismissible?: boolean;
  className?: string;
}
const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-xl", xl: "max-w-3xl" };

/** Accessible dialog: focus trap, Esc to close, scroll lock, restores focus. */
export function Modal({ open, onClose, title, description, children, footer, size = "md", hideTitle, dismissible = true, className }: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const ref = useDialog(open, dismissible ? onClose : () => undefined);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade-in bg-brand-950/55 backdrop-blur-sm" onClick={dismissible ? onClose : undefined} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn("relative flex max-h-[92dvh] w-full animate-pop flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-card outline-none sm:rounded-[2rem]", widths[size], className)}
      >
        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
          <div className={cn(hideTitle && "sr-only")}>
            <h2 id={titleId} className="font-display text-xl font-semibold text-ink">{title}</h2>
            {description && <p id={descId} className="mt-1 text-sm text-ink-soft">{description}</p>}
          </div>
          {dismissible && (
            <button onClick={onClose} aria-label="Close dialog" className="-mr-2 -mt-1 rounded-full p-2 text-ink-mute hover:bg-cream-100 hover:text-ink">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">{children}</div>
        {footer && <div className="border-t border-cream-100 bg-cream/60 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
