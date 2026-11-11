import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";

export interface TabItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  end?: boolean;
}

/** Persistent bottom navigation for mobile (hidden ≥ md, where the sidebar takes over). */
export function TabBar({ items }: { items: TabItem[] }) {
  return (
    <nav aria-label="Primary" className="shrink-0 border-t border-cream-200 bg-white/95 pb-safe backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ to, label, icon: Icon, badge, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn("relative flex flex-col items-center gap-0.5 px-1 py-2.5 text-[11px] font-semibold transition-colors", isActive ? "text-brand-700" : "text-ink-mute hover:text-ink")
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon className={cn("h-6 w-6", isActive && "fill-brand-100")} strokeWidth={isActive ? 2.3 : 1.9} aria-hidden />
                    {!!badge && (
                      <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white" aria-label={`${badge} new`}>
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </span>
                  {label}
                  {isActive && <span aria-hidden className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-brand-600" />}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
