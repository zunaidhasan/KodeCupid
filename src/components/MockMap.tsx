import { useMemo } from "react";
import { Building2, EyeOff } from "lucide-react";
import type { GeoPoint } from "@/types";
import { hashString } from "@/lib/format";

export interface MapPoint extends GeoPoint { id: string; hidden: boolean }

const MI_PER_DEG_LAT = 69.17;
const MI_PER_DEG_LNG = 53.1; // at ~39.7°N

/**
 * Mock map: a stylised SVG, NOT a real map and NOT real geolocation.
 * Shows a facility, the privacy radius, and anonymised member dots (hidden vs visible).
 * PRODUCTION: swap for Mapbox / Google Maps with PostGIS `ST_DWithin` results.
 */
export function MockMap({ center, radiusMiles, points, label }: { center: GeoPoint; radiusMiles: number; points: MapPoint[]; label: string }) {
  const W = 360;
  const H = 280;
  const viewMiles = Math.max(4, radiusMiles * 1.6);
  const ppm = W / 2 / viewMiles;
  const project = (g: GeoPoint) => ({ x: W / 2 + (g.lng - center.lng) * MI_PER_DEG_LNG * ppm, y: H / 2 - (g.lat - center.lat) * MI_PER_DEG_LAT * ppm });
  const streets = useMemo(() => {
    const seed = hashString(label);
    return Array.from({ length: 9 }, (_, i) => {
      const o = ((seed >> i) % 60) - 30;
      return i % 2 === 0
        ? `M0 ${30 + i * 28 + o / 4} Q ${W / 2} ${30 + i * 28 + o} ${W} ${30 + i * 28 - o / 3}`
        : `M${40 + i * 36 + o / 4} 0 Q ${40 + i * 36 + o} ${H / 2} ${40 + i * 36 - o / 3} ${H}`;
    });
  }, [label]);
  const c = project(center);
  const r = radiusMiles * ppm;
  const hiddenCount = points.filter((p) => p.hidden).length;
  return (
    <figure className="overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-soft">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={`Mock map showing a ${radiusMiles} mile privacy radius around ${label}. ${hiddenCount} nearby members hidden.`}>
        <rect width={W} height={H} fill="#F4EEE6" />
        <path d={`M-10 ${H * 0.72} C ${W * 0.3} ${H * 0.55}, ${W * 0.55} ${H * 0.95}, ${W + 10} ${H * 0.62}`} stroke="#BFE0E4" strokeWidth="22" fill="none" opacity=".8" />
        <ellipse cx={W * 0.82} cy={H * 0.2} rx="52" ry="30" fill="#D5E8D0" />
        <ellipse cx={W * 0.14} cy={H * 0.3} rx="40" ry="26" fill="#D5E8D0" />
        {streets.map((d, i) => <path key={i} d={d} stroke="#fff" strokeWidth={i % 3 === 0 ? 5 : 3} fill="none" />)}
        <circle cx={c.x} cy={c.y} r={r} fill="#F9625A" fillOpacity=".14" stroke="#E24A45" strokeWidth="2" strokeDasharray="6 5" />
        {points.map((p) => {
          const { x, y } = project(p);
          if (x < 4 || y < 4 || x > W - 4 || y > H - 4) return null;
          return p.hidden
            ? <g key={p.id}><circle cx={x} cy={y} r="6" fill="#fff" stroke="#E24A45" strokeWidth="2" /><path d={`M${x - 3} ${y - 3} L${x + 3} ${y + 3} M${x + 3} ${y - 3} L${x - 3} ${y + 3}`} stroke="#E24A45" strokeWidth="1.6" /></g>
            : <circle key={p.id} cx={x} cy={y} r="5" fill="#1B6A74" stroke="#fff" strokeWidth="1.5" />;
        })}
        <g transform={`translate(${c.x - 14} ${c.y - 14})`}>
          <circle cx="14" cy="14" r="15" fill="#0F5E67" stroke="#fff" strokeWidth="3" />
          <path d="M9 20V9h10v11M12 12h1M15 12h1M12 15h1M15 15h1M13 20v-2h2v2" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
        <g transform={`translate(14 ${H - 24})`}>
          <rect width={ppm} height="4" fill="#263238" rx="2" />
          <text x={ppm + 6} y="6" fontSize="11" fill="#55616B" fontFamily="sans-serif">1 mile</text>
        </g>
      </svg>
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-cream-100 px-4 py-2.5 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-brand-700" aria-hidden />{label}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-600" aria-hidden />Visible member</span>
        <span className="inline-flex items-center gap-1.5"><EyeOff className="h-3.5 w-3.5 text-coral-600" aria-hidden />Hidden inside radius</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-ink-mute">Mock map</span>
      </figcaption>
    </figure>
  );
}
