import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Photo } from "@/types";
import { cn } from "@/lib/cn";

/** Photo gallery with tap zones, arrows and segmented progress. Keyboard: ←/→ when focused. */
export function PhotoCarousel({ photos, name, className, children, blur }: { photos: Photo[]; name: string; className?: string; children?: React.ReactNode; blur?: boolean }) {
  const [i, setI] = useState(0);
  const count = photos.length;
  const go = (d: number) => setI((cur) => (cur + d + count) % count);
  return (
    <div
      className={cn("relative select-none overflow-hidden bg-cream-100", className)}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${name}'s photos`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}
    >
      <img src={photos[i]?.url} alt={photos[i]?.alt ?? `${name}'s photo`} draggable={false} className={cn("h-full w-full object-cover", blur && "blur-xl")} />
      {count > 1 && (
        <>
          <div className="pointer-events-none absolute inset-x-3 top-3 flex gap-1.5" aria-hidden>
            {photos.map((p, idx) => <span key={p.id} className={cn("h-1 flex-1 rounded-full", idx === i ? "bg-white" : "bg-white/40")} />)}
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous photo" className="absolute inset-y-10 left-0 flex w-1/4 items-center justify-start pl-2 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100">
            <span className="rounded-full bg-black/35 p-1.5 text-white"><ChevronLeft className="h-5 w-5" /></span>
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next photo" className="absolute inset-y-10 right-0 flex w-1/4 items-center justify-end pr-2 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100">
            <span className="rounded-full bg-black/35 p-1.5 text-white"><ChevronRight className="h-5 w-5" /></span>
          </button>
          <span className="sr-only" aria-live="polite">Photo {i + 1} of {count}</span>
        </>
      )}
      {children}
    </div>
  );
}
