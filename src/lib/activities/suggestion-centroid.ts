import { searchPlacesPhoton } from "@/lib/places/photon-search";

export type CentroidResult =
  | { ok: true; lat: number; lng: number; source: "stop" | "photon" }
  | { ok: false; reason: "no_coords" };

/**
 * Uses stop coordinates when present; otherwise geocodes `city_name` (+ optional ISO country) via Photon.
 */
export async function resolveSuggestionCentroid(input: {
  lat: number | null;
  lng: number | null;
  city_name: string;
  country: string | null;
}): Promise<CentroidResult> {
  const { lat, lng, city_name, country } = input;
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return { ok: true, lat, lng, source: "stop" };
  }

  const q = city_name.trim();
  if (q.length < 2) {
    return { ok: false, reason: "no_coords" };
  }

  const hits = await searchPlacesPhoton(q, country, 3);
  const first = hits[0];
  if (!first || !Number.isFinite(first.lat) || !Number.isFinite(first.lng)) {
    return { ok: false, reason: "no_coords" };
  }

  return { ok: true, lat: first.lat, lng: first.lng, source: "photon" };
}
