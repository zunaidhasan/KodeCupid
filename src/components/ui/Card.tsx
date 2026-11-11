import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article" | "li";
  padded?: boolean;
  tone?: "white" | "cream" | "brand" | "coral";
  interactive?: boolean;
}
const tones = {
  white: "bg-white border-cream-200",
  cream: "bg-cream-100 border-cream-200",
  brand: "bg-brand-800 text-white border-brand-700",
  coral: "bg-coral-50 border-coral-100",
};

export function Card({ as: Tag = "div", padded = true, tone = "white", interactive, className, ...rest }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-3xl border shadow-soft", tones[tone], padded && "p-5 sm:p-6",
        interactive && "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card",
        className
      )}
      {...rest}
    />
  );
}

export function SectionHeading({ title, action, description, className }: { title: string; action?: ReactNode; description?: string; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {description && <p className="text-sm text-ink-mute">{description}</p>}
      </div>
      {action}
    </div>
  );
}
