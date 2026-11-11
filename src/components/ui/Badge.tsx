import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "brand" | "coral" | "success" | "warning" | "danger" | "gold" | "dark";
const tones: Record<BadgeTone, string> = {
  neutral: "bg-cream-100 text-ink-soft",
  brand: "bg-brand-50 text-brand-800",
  coral: "bg-coral-50 text-coral-700",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-700",
  gold: "bg-amber-100 text-amber-900",
  dark: "bg-brand-900/80 text-white backdrop-blur",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon?: ReactNode;
  size?: "sm" | "md";
}

export function Badge({ tone = "neutral", icon, size = "md", className, children, ...rest }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap", size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs", tones[tone], className)} {...rest}>
      {icon}
      {children}
    </span>
  );
}
