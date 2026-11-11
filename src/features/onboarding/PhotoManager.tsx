import { useRef, useState } from "react";
import { ImagePlus, Sparkles, Trash2 } from "lucide-react";
import type { Photo } from "@/types";
import { fileToDataUrl } from "@/lib/image";
import { uid } from "@/lib/format";
import { portraitArt } from "@/lib/placeholderArt";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

/** Mock photo upload: choose a local image (downscaled in the browser) or pick generated placeholder art. */
export function PhotoManager({ photos, onChange, seed, max = 6 }: { photos: Photo[]; onChange: (p: Photo[]) => void; seed: string; max?: number }) {
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    setError("");
    const next = [...photos];
    for (const f of Array.from(files)) {
      if (next.length >= max) break;
      try { next.push({ id: uid("ph"), url: await fileToDataUrl(f), alt: "Your uploaded photo", kind: "upload" }); }
      catch (e) { setError((e as Error).message); }
    }
    onChange(next);
  };
  const addPlaceholder = () => {
    if (photos.length >= max) return;
    const n = photos.length;
    onChange([...photos, { id: uid("ph"), url: portraitArt(`${seed}-${n}-${Math.random()}`, n % 4), alt: "Placeholder photo", kind: "placeholder" }]);
  };
  const remove = (id: string) => onChange(photos.filter((p) => p.id !== id));
  const makePrimary = (id: string) => onChange([photos.find((p) => p.id === id)!, ...photos.filter((p) => p.id !== id)]);

  return (
    <div>
      <ul className="grid grid-cols-3 gap-3" aria-label="Your photos">
        {photos.map((p, i) => (
          <li key={p.id} className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-cream-100">
            <img src={p.url} alt={`${p.alt} ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && <Badge tone="dark" size="sm" className="absolute left-2 top-2">Main</Badge>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2">
              {i !== 0 && <button type="button" onClick={() => makePrimary(p.id)} className="rounded-full bg-white/90 px-2 py-1 text-[11px] font-bold text-ink">Make main</button>}
              <button type="button" onClick={() => remove(p.id)} aria-label={`Remove photo ${i + 1}`} className="ml-auto rounded-full bg-white/90 p-1.5 text-coral-700"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </li>
        ))}
        {photos.length < max && (
          <li>
            <button type="button" onClick={() => ref.current?.click()} className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-cream-200 bg-white text-ink-mute transition-colors hover:border-brand-300 hover:text-brand-700">
              <ImagePlus className="h-6 w-6" aria-hidden /><span className="text-xs font-semibold">Add photo</span>
            </button>
          </li>
        )}
      </ul>
      <input ref={ref} type="file" accept="image/*" multiple className="sr-only" aria-label="Upload photos" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={addPlaceholder} disabled={photos.length >= max} leftIcon={<Sparkles className="h-4 w-4" />}>Use a placeholder</Button>
        <p className="text-xs text-ink-mute">Mock upload — images stay on this device. {photos.length}/{max}</p>
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-medium text-coral-700">{error}</p>}
    </div>
  );
}
