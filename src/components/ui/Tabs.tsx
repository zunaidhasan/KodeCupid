import { cn } from "@/lib/cn";

export function SegmentedTabs<T extends string>({ items, value, onChange, label, className }: {
  items: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; label: string; className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn("inline-flex w-full gap-1 rounded-full bg-cream-100 p-1 sm:w-auto", className)}>
      {items.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn("flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all sm:flex-none", value === t.id ? "bg-white text-brand-800 shadow-sm" : "text-ink-soft hover:text-ink")}
        >
          {t.label}
          {t.count !== undefined && t.count > 0 && <span className={cn("ml-1.5 rounded-full px-1.5 py-0.5 text-[11px]", value === t.id ? "bg-coral-100 text-coral-700" : "bg-cream-200 text-ink-soft")}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
