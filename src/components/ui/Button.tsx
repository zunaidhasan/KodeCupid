import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "danger" | "soft";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-700 text-white shadow-soft hover:bg-brand-800 active:bg-brand-900",
  accent: "bg-coral-500 text-white shadow-soft hover:bg-coral-600 active:bg-coral-700",
  secondary: "bg-white text-ink border border-cream-200 hover:bg-cream-100 active:bg-cream-200",
  ghost: "text-ink-soft hover:bg-cream-100 hover:text-ink",
  danger: "bg-white text-coral-700 border border-coral-200 hover:bg-coral-50",
  soft: "bg-brand-50 text-brand-800 hover:bg-brand-100",
};
const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2",
  icon: "h-10 w-10 justify-center",
};

/** Class helper so <Link> and <a> can look exactly like buttons. */
export function buttonStyles({ variant = "primary", size = "md", full = false }: { variant?: ButtonVariant; size?: ButtonSize; full?: boolean } = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap transition-colors duration-150",
    "disabled:opacity-50 disabled:pointer-events-none select-none",
    variants[variant], sizes[size], full && "w-full"
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({ variant, size, full, loading, leftIcon, rightIcon, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={cn(buttonStyles({ variant, size, full }), className)} {...rest}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
