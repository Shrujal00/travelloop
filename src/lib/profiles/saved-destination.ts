import type { PlaceSearchHit } from "@/lib/places/types";

export type SavedDestination = {
  city_name: string;
  country: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  external_place_id: string | null;
};

export function hitToSaved(hit: PlaceSearchHit): SavedDestination {
  return {
    city_name: hit.city_name.slice(0, 200),
    country: hit.country,
    region: hit.region,
    lat: Number.isFinite(hit.lat) ? hit.lat : null,
    lng: Number.isFinite(hit.lng) ? hit.lng : null,
    external_place_id: hit.external_place_id || null,
  };
}

/** Parse stored JSON (profiles.saved_destinations); returns [] on invalid input. */
export function parseSavedDestinations(raw: unknown): SavedDestination[] {
  if (!Array.isArray(raw)) return [];
  const out: SavedDestination[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const city = typeof r.city_name === "string" ? r.city_name.trim().slice(0, 200) : "";
    if (!city) continue;
    const lat = r.lat == null ? null : Number(r.lat);
    const lng = r.lng == null ? null : Number(r.lng);
    out.push({
      city_name: city,
      country: typeof r.country === "string" ? r.country.slice(0, 80) : null,
      region: typeof r.region === "string" ? r.region.slice(0, 120) : null,
      lat: lat != null && Number.isFinite(lat) ? lat : null,
      lng: lng != null && Number.isFinite(lng) ? lng : null,
      external_place_id:
        typeof r.external_place_id === "string" ? r.external_place_id.slice(0, 120) : null,
    });
    if (out.length >= 24) break;
  }
  return out;
}

export function stringifySavedDestinations(list: SavedDestination[]): string {
  return JSON.stringify(list.slice(0, 24));
}
