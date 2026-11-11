import type { GeoPoint } from "@/types";

const EARTH_RADIUS_MILES = 3958.8;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Great-circle (haversine) distance in miles between two points.
 * PRODUCTION NOTE: replace with PostGIS `ST_DistanceSphere` / `ST_DWithin` queries so
 * filtering happens in the database, not in the client.
 */
export function distanceMiles(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

export function formatDistance(miles: number): string {
  if (miles < 0.5) return "Less than a mile away";
  if (miles < 10) return `${miles.toFixed(1)} mi away`;
  return `${Math.round(miles)} mi away`;
}

/** Approximate privacy "fuzzing" — never show exact distances for very close members. */
export function fuzzyDistance(miles: number): number {
  return miles < 1 ? 1 : Math.round(miles);
}
