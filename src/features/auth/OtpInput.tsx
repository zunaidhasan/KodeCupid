import { useRef } from "react";
import { cn } from "@/lib/cn";

/** 6-digit one-time-code input: auto-advance, backspace, arrow keys and paste support. */
export function OtpInput({ value, onChange, error, length = 6 }: { value: string; onChange: (v: string) => void; error?: boolean; length?: number }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const setAt = (i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join(""));
  };
  return (
    <div role="group" aria-label={`${length}-digit verification code`} className="flex justify-between gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={error}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(-1);
            setAt(i, v);
            if (v) focus(i + 1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !d) { focus(i - 1); }
            if (e.key === "ArrowLeft") focus(i - 1);
            if (e.key === "ArrowRight") focus(i + 1);
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (text) { onChange(text); focus(text.length); }
          }}
          onFocus={(e) => e.target.select()}
          className={cn("h-14 w-full min-w-0 rounded-2xl border bg-white text-center text-2xl font-bold text-ink shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100", error ? "border-coral-400" : "border-cream-200")}
        />
      ))}
    </div>
  );
}
