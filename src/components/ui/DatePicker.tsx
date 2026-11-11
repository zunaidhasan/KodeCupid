import { useId } from "react";
import { cn } from "@/lib/cn";
import { FieldShell, controlClass } from "./Input";

export interface DatePickerProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
}

/** Accessible, labelled date input (native picker = best mobile UX + keyboard support). */
export function DatePicker({ label, value, onChange, min, max, hint, error, optional, className }: DatePickerProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(controlClass(error), "h-12")}
      />
    </FieldShell>
  );
}
