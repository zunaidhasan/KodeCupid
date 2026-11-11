import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  hideLabel?: boolean;
  children: ReactNode;
  className?: string;
}

/** Shared label + hint + error wrapper used by Input, Textarea, Select and DatePicker. */
export function FieldShell({ id, label, hint, error, optional, hideLabel, children, className }: FieldShellProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className={cn("flex items-center gap-2 text-sm font-semibold text-ink", hideLabel && "sr-only")}>
        {label}
        {optional && <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[11px] font-medium text-ink-mute">Optional</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-ink-mute">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-xs font-medium text-coral-700">{error}</p>}
    </div>
  );
}

export const controlClass = (error?: string) =>
  cn(
    "w-full rounded-2xl border bg-white px-4 text-[15px] text-ink placeholder:text-ink-mute shadow-sm transition-colors",
    "focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:bg-cream-100 disabled:text-ink-mute",
    error ? "border-coral-400 focus:border-coral-500 focus:ring-coral-100" : "border-cream-200 hover:border-brand-200"
  );

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  hideLabel?: boolean;
  prefix?: ReactNode;
  wrapperClassName?: string;
}

export function Input({ label, hint, error, optional, hideLabel, prefix, className, wrapperClassName, id, ...rest }: InputProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} optional={optional} hideLabel={hideLabel} className={wrapperClassName}>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute">{prefix}</span>}
        <input
          id={fid}
          aria-invalid={!!error}
          aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
          className={cn(controlClass(error), "h-12", prefix && "pl-11", className)}
          {...rest}
        />
      </div>
    </FieldShell>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  counter?: number;
}

export function Textarea({ label, hint, error, optional, counter, className, id, value, ...rest }: TextareaProps) {
  const auto = useId();
  const fid = id ?? auto;
  const len = typeof value === "string" ? value.length : 0;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} optional={optional}>
      <textarea
        id={fid}
        value={value}
        aria-invalid={!!error}
        aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
        className={cn(controlClass(error), "min-h-28 resize-y py-3 leading-relaxed", className)}
        {...rest}
      />
      {counter && <p className={cn("text-right text-xs", len > counter ? "text-coral-700" : "text-ink-mute")}>{len}/{counter}</p>}
    </FieldShell>
  );
}
