import { cn } from "@/lib/cn";

/** Shimmering placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-shimmer rounded-xl bg-[linear-gradient(90deg,#f4eee6_25%,#fbf8f4_50%,#f4eee6_75%)] bg-[length:200%_100%]", className)}
    />
  );
}

const Wrap = ({ children, label = "Loading" }: { children: React.ReactNode; label?: string }) => (
  <div role="status" aria-busy="true" aria-live="polite">
    <span className="sr-only">{label}…</span>
    {children}
  </div>
);

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <Wrap>
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, i) => <Skeleton key={i} className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")} />)}
      </div>
    </Wrap>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <Wrap>
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-3xl border border-cream-200 bg-white p-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-3/4" /></div>
          </div>
        ))}
      </div>
    </Wrap>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <Wrap>
      <div className={cn("space-y-3 rounded-3xl border border-cream-200 bg-white p-5", className)}>
        <Skeleton className="h-5 w-1/3" /><Skeleton className="h-3.5 w-full" /><Skeleton className="h-3.5 w-5/6" /><Skeleton className="h-10 w-1/2 rounded-full" />
      </div>
    </Wrap>
  );
}

/** Skeleton for the swipe card on Discover. */
export function SkeletonProfileCard() {
  return (
    <Wrap label="Loading profiles">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-cream-200 bg-white shadow-card">
        <Skeleton className="aspect-[4/5] w-full rounded-none" />
        <div className="space-y-3 p-5"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-2/3" /><div className="flex gap-2"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-24 rounded-full" /></div></div>
      </div>
    </Wrap>
  );
}

export function SkeletonProfileDetail() {
  return (
    <Wrap label="Loading profile">
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="aspect-[4/3] w-full rounded-[2rem]" />
        <Skeleton className="h-8 w-1/2" /><SkeletonText lines={4} /><SkeletonCard />
      </div>
    </Wrap>
  );
}
