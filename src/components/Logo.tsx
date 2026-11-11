import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={cn("h-8 w-8", className)} role="img" aria-label="KodeCupid logo">
      <defs>
        <linearGradient id="kc-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0F5E67" /><stop offset="1" stopColor="#0B3B4A" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#kc-g)" />
      <path d="M256 408 C118 316 84 232 84 182 C84 130 126 98 172 98 C208 98 240 118 256 150 C272 118 304 98 340 98 C386 98 428 130 428 182 C428 232 394 316 256 408 Z" fill="#FF6B6B" />
      <polyline points="104,258 196,258 222,206 266,312 296,236 316,258 408,258" fill="none" stroke="#fff" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className={cn("font-display text-xl font-semibold tracking-tight", light ? "text-white" : "text-brand-800")}>
        Kode<span className={light ? "text-coral-300" : "text-coral-500"}>Cupid</span>
      </span>
    </span>
  );
}
