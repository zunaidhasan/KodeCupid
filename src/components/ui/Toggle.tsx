import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/** Accessible switch (role="switch"), operable with Space/Enter. */
export function Toggle({ checked, onChange, label, description, disabled, className }: ToggleProps) {
  const id = useId();
  return (
    <div className={cn("flex items-start justify-between gap-4 py-2", disabled && "opacity-60", className)}>
      <div className="min-w-0">
        <label id={`${id}-l`} htmlFor={id} className="block cursor-pointer text-sm font-semibold text-ink">{label}</label>
        {description && <p id={`${id}-d`} className="mt-0.5 text-xs leading-relaxed text-ink-mute">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-l`}
        aria-describedby={description ? `${id}-d` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200",
          checked ? "bg-brand-600" : "bg-cream-200"
        )}
      >
        <span className={cn("inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200", checked ? "translate-x-6" : "translate-x-1")} />
      </button>
    </div>
  );
}
