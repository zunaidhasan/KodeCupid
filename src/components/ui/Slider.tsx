import { useId } from "react";

export function Slider({ label, value, min, max, step = 1, onChange, format, hint, disabled }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void;
  format?: (v: number) => string; hint?: string; disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-ink">{label}</label>
        <output htmlFor={id} className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-800">{format ? format(value) : value}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="h-2 w-full cursor-pointer" aria-valuetext={format ? format(value) : String(value)} />
      {hint && <p className="text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}
