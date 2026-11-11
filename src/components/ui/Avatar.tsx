import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

const sizes = { xs: "h-7 w-7 text-[10px]", sm: "h-9 w-9 text-xs", md: "h-12 w-12 text-sm", lg: "h-16 w-16 text-lg", xl: "h-24 w-24 text-2xl" };

export interface AvatarProps {
  src?: string;
  name: string;
  size?: keyof typeof sizes;
  verified?: boolean;
  ring?: boolean;
  className?: string;
}

export function Avatar({ src, name, size = "md", verified, ring, className }: AvatarProps) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {src ? (
        <img src={src} alt={`${name}'s photo`} className={cn("rounded-full object-cover bg-cream-100", sizes[size], ring && "ring-2 ring-coral-400 ring-offset-2")} />
      ) : (
        <span aria-hidden className={cn("inline-flex items-center justify-center rounded-full bg-brand-100 font-bold text-brand-800", sizes[size])}>{initials(name)}</span>
      )}
      {verified && (
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-px" title="Verified professional">
          <BadgeCheck className="h-4 w-4 fill-brand-600 text-white" aria-label="Verified" />
        </span>
      )}
    </span>
  );
}
