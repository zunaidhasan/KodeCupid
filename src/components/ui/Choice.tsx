import { useId, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

type Opt<T extends string> = { value: T; label: string };

function Chip({ selected, onClick, children, disabled }: { selected: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all",
        selected ? "border-brand-600 bg-brand-700 text-white shadow-soft" : "border-cream-200 bg-white text-ink-soft hover:border-brand-300 hover:bg-brand-50",
        disabled && "opacity-40"
      )}
    >
      {selected && <Check className="h-3.5 w-3.5" aria-hidden />}
      {children}
    </button>
  );
}

interface Base { label: string; hint?: string; error?: string; optional?: boolean; className?: string }

/** Multi-select chips (fieldset + legend for screen readers). */
export function ChipGroup<T extends string>({ label, hint, error, optional, className, options, value, onChange, max }: Base & { options: Opt<T>[]; value: T[]; onChange: (v: T[]) => void; max?: number }) {
  const id = useId();
  const toggle = (v: T) => onChange(value.includes(v) ? value.filter((x) => x !== v) : max && value.length >= max ? value : [...value, v]);
  return (
    <fieldset className={cn("space-y-2", className)} aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined}>
      <legend className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        {label}
        {optional && <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[11px] font-medium text-ink-mute">Optional</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => <Chip key={o.value} selected={value.includes(o.value)} onClick={() => toggle(o.value)} disabled={!!max && !value.includes(o.value) && value.length >= max}>{o.label}</Chip>)}
      </div>
      {hint && !error && <p id={`${id}-h`} className="text-xs text-ink-mute">{hint}</p>}
      {error && <p id={`${id}-e`} role="alert" className="text-xs font-medium text-coral-700">{error}</p>}
    </fieldset>
  );
}

/** Single-select chips. Clicking the selected chip clears it when `clearable`. */
export function ChipSelect<T extends string>({ label, hint, error, optional, className, options, value, onChange, clearable }: Base & { options: Opt<T>[]; value: T | ""; onChange: (v: T | "") => void; clearable?: boolean }) {
  const id = useId();
  return (
    <fieldset className={cn("space-y-2", className)} aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined}>
      <legend className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        {label}
        {optional && <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[11px] font-medium text-ink-mute">Optional</span>}
      </legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => <Chip key={o.value} selected={value === o.value} onClick={() => onChange(clearable && value === o.value ? "" : o.value)}>{o.label}</Chip>)}
      </div>
      {hint && !error && <p id={`${id}-h`} className="text-xs text-ink-mute">{hint}</p>}
      {error && <p id={`${id}-e`} role="alert" className="text-xs font-medium text-coral-700">{error}</p>}
    </fieldset>
  );
}

/** Large selectable cards (profession category, work pattern, payment provider). */
export function CardChoice<T extends string>({ label, options, value, onChange, columns = 2, error, className }: {
  label: string; value: T | ""; onChange: (v: T) => void; columns?: 1 | 2 | 3; error?: string; className?: string;
  options: { value: T; title: string; description?: string; icon?: ReactNode }[];
}) {
  return (
    <fieldset className={cn("space-y-2", className)}>
      <legend className="mb-2 text-sm font-semibold text-ink">{label}</legend>
      <div role="radiogroup" aria-label={label} className={cn("grid gap-2.5", columns === 1 ? "grid-cols-1" : columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3")}>
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o.value)}
              className={cn("flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all", selected ? "border-brand-600 bg-brand-50 ring-2 ring-brand-200" : "border-cream-200 bg-white hover:border-brand-300")}
            >
              {o.icon && <span className="text-2xl leading-none" aria-hidden>{o.icon}</span>}
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{o.title}</span>
                {o.description && <span className="mt-0.5 block text-xs leading-snug text-ink-mute">{o.description}</span>}
              </span>
            </button>
          );
        })}
      </div>
      {error && <p role="alert" className="text-xs font-medium text-coral-700">{error}</p>}
    </fieldset>
  );
}
