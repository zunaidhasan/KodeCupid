import type { GeoPoint } from "@/types";

/**
 * Fictional facilities, neighborhoods and venues around a mock "Front Range" metro area.
 * Coordinates are mock values used ONLY for the distance + workplace-privacy demo.
 * No real geolocation is ever requested.
 */
export interface Facility {
  id: string;
  name: string;
  type: "Hospital" | "Clinic" | "School" | "Campus" | "Research lab" | "Public agency" | "Private practice" | "District office";
  area: string;
  lat: number;
  lng: number;
}

export const FACILITIES: Facility[] = [
  { id: "f_aldric", name: "St. Aldric Medical Center", type: "Hospital", area: "Capitol Hill", lat: 39.7392, lng: -104.9847 },
  { id: "f_mercy", name: "Mercy Valley Hospital", type: "Hospital", area: "Cherry Creek", lat: 39.7275, lng: -104.956 },
  { id: "f_lakeview", name: "Lakeview Children's Clinic", type: "Clinic", area: "LoHi", lat: 39.7686, lng: -105.0186 },
  { id: "f_northfield", name: "Northfield University", type: "Campus", area: "Downtown West", lat: 39.742, lng: -105.004 },
  { id: "f_cedar", name: "Cedar Ridge High School", type: "School", area: "Lakewood", lat: 39.704, lng: -105.081 },
  { id: "f_willow", name: "Willow Creek Elementary", type: "School", area: "Littleton", lat: 39.615, lng: -105.015 },
  { id: "f_mountain", name: "Mountain State College", type: "Campus", area: "Golden", lat: 39.755, lng: -105.221 },
  { id: "f_aurora", name: "Aurora Health Pavilion", type: "Hospital", area: "Aurora", lat: 39.7294, lng: -104.8319 },
  { id: "f_riverbend", name: "Riverbend Research Institute", type: "Research lab", area: "Northside", lat: 39.796, lng: -105.002 },
  { id: "f_pubhealth", name: "Metro Public Health Department", type: "Public agency", area: "Civic Center", lat: 39.738, lng: -104.97 },
  { id: "f_ccanimal", name: "Cherry Creek Animal Hospital", type: "Clinic", area: "Cherry Creek", lat: 39.717, lng: -104.953 },
  { id: "f_district", name: "Front Range School District Office", type: "District office", area: "Wash Park", lat: 39.7, lng: -104.99 },
  { id: "f_practice", name: "Wash Park Wellness Studio", type: "Private practice", area: "Wash Park", lat: 39.698, lng: -104.976 },
  { id: "f_flatiron", name: "Flatiron Labs", type: "Research lab", area: "Boulder", lat: 40.017, lng: -105.265 },
  { id: "f_boulderu", name: "Boulder Peaks University", type: "Campus", area: "Boulder", lat: 40.0076, lng: -105.2659 },
];

export const facilityById = (id?: string) => FACILITIES.find((f) => f.id === id);

export interface Neighborhood extends GeoPoint { id: string; name: string; city: string }

export const NEIGHBORHOODS: Neighborhood[] = [
  { id: "capitol-hill", name: "Capitol Hill", city: "Denver", lat: 39.7311, lng: -104.9805 },
  { id: "five-points", name: "Five Points", city: "Denver", lat: 39.75, lng: -104.976 },
  { id: "lohi", name: "LoHi", city: "Denver", lat: 39.7608, lng: -105.01 },
  { id: "highlands", name: "Highlands", city: "Denver", lat: 39.7662, lng: -105.0285 },
  { id: "cherry-creek", name: "Cherry Creek", city: "Denver", lat: 39.718, lng: -104.953 },
  { id: "wash-park", name: "Washington Park", city: "Denver", lat: 39.699, lng: -104.974 },
  { id: "aurora", name: "Aurora", city: "Aurora", lat: 39.7294, lng: -104.8319 },
  { id: "lakewood", name: "Lakewood", city: "Lakewood", lat: 39.7047, lng: -105.0814 },
  { id: "golden", name: "Golden", city: "Golden", lat: 39.7555, lng: -105.2211 },
  { id: "littleton", name: "Littleton", city: "Littleton", lat: 39.6133, lng: -105.0166 },
  { id: "englewood", name: "Englewood", city: "Englewood", lat: 39.6478, lng: -104.9878 },
  { id: "boulder", name: "Boulder", city: "Boulder", lat: 40.015, lng: -105.2705 },
];

export const neighborhoodById = (id: string) => NEIGHBORHOODS.find((n) => n.id === id) ?? NEIGHBORHOODS[0];

export interface Venue { id: string; name: string; kind: string; blurb: string; nearFacilityId: string; lat: number; lng: number }

/** Suggested micro-date spots — always public, short, and close to a workplace. */
export const VENUES: Venue[] = [
  { id: "v_bean", name: "Bean & Compass Café", kind: "Coffee", blurb: "Quiet corner tables, 4 min from St. Aldric", nearFacilityId: "f_aldric", lat: 39.7405, lng: -104.983 },
  { id: "v_greentable", name: "Green Table Lunch Bar", kind: "Lunch", blurb: "Fast, fresh bowls near Mercy Valley", nearFacilityId: "f_mercy", lat: 39.7262, lng: -104.9575 },
  { id: "v_quietmug", name: "The Quiet Mug", kind: "Coffee", blurb: "Student-free mornings by Northfield campus", nearFacilityId: "f_northfield", lat: 39.7432, lng: -105.0028 },
  { id: "v_lakeview", name: "Lakeview Pocket Park", kind: "Walk", blurb: "Benches and a duck pond by the clinic", nearFacilityId: "f_lakeview", lat: 39.7695, lng: -105.0172 },
  { id: "v_sunrise", name: "Sunrise Bakery", kind: "Breakfast", blurb: "Open early for post-night-shift pastries", nearFacilityId: "f_aurora", lat: 39.7285, lng: -104.8335 },
  { id: "v_maple", name: "Maple Street Tea House", kind: "Tea", blurb: "Calm, grown-up tea and scones near Cedar Ridge", nearFacilityId: "f_cedar", lat: 39.7052, lng: -105.0795 },
  { id: "v_commons", name: "Campus Commons Courtyard", kind: "Walk", blurb: "Open-air courtyard at Mountain State", nearFacilityId: "f_mountain", lat: 39.7541, lng: -105.2198 },
  { id: "v_riverwalk", name: "Riverwalk Picnic Lawn", kind: "Picnic", blurb: "Grab-and-go picnic by the research campus", nearFacilityId: "f_riverbend", lat: 39.7948, lng: -105.0033 },
  { id: "v_cctrail", name: "Cherry Creek Trail Loop", kind: "Walk", blurb: "20-minute riverside stroll", nearFacilityId: "f_ccanimal", lat: 39.7165, lng: -104.955 },
  { id: "v_willow", name: "Willow Creek Coffee", kind: "Coffee", blurb: "Teacher-approved lattes by the elementary", nearFacilityId: "f_willow", lat: 39.6141, lng: -105.0131 },
  { id: "v_civic", name: "Civic Center Food Hall", kind: "Lunch", blurb: "Lots of options near the health department", nearFacilityId: "f_pubhealth", lat: 39.7371, lng: -104.9712 },
  { id: "v_washpark", name: "Wash Park Boathouse Café", kind: "Coffee", blurb: "Lakeside patio, easy parking", nearFacilityId: "f_practice", lat: 39.699, lng: -104.9712 },
  { id: "v_pearl", name: "Pearl Street Gelato", kind: "Dessert", blurb: "Stroll-friendly gelato in Boulder", nearFacilityId: "f_boulderu", lat: 40.0185, lng: -105.2778 },
];
