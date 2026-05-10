import type { PlaceSearchHit } from "@/lib/places/types";

type PhotonProps = {
  name?: string;
  city?: string;
  country?: string;
  countrycode?: string;
  state?: string;
  county?: string;
  osm_key?: string;
  osm_value?: string;
  osm_id?: number;
  /** OSM type letter: N / W / R */
  osm_type?: string;
  type?: string;
};

type PhotonFeature = {
  geometry?: { type?: string; coordinates?: number[] };
  properties?: PhotonProps;
};

type PhotonResponse = { features?: PhotonFeature[] };

const PLACE_RANK: Record<string, number> = {
  city: 0,
  town: 1,
  locality: 2,
  village: 3,
  suburb: 4,
  neighbourhood: 5,
  hamlet: 6,
  quarter: 7,
  municipality: 8,
  administrative: 9,
};

function rankOsmValue(v: string | undefined): number {
  if (!v) return 50;
  return PLACE_RANK[v] ?? 40;
}

function buildSubtitle(p: PhotonProps, cityName: string): string {
  const parts: string[] = [];
  if (p.state && p.state !== cityName) parts.push(p.state);
  if (p.country) parts.push(p.country);
  return parts.join(" · ") || (p.country ?? "");
}

function featureToHit(f: PhotonFeature): PlaceSearchHit | null {
  const coords = f.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const p = f.properties ?? {};
  const osmKey = p.osm_key ?? "";
  const osmValue = p.osm_value ?? "";
  if (osmKey !== "place" && osmKey !== "boundary") {
    return null;
  }
  if (osmKey === "boundary" && osmValue !== "administrative") {
    return null;
  }

  const rawName = (p.name ?? p.city ?? "").trim();
  if (!rawName) return null;

  const countryCode = p.countrycode?.trim().toUpperCase() || null;
  const osmId = p.osm_id;
  const osmTypeLetter = (p.osm_type ?? "").trim().toUpperCase();
  const external =
    typeof osmId === "number" && /^[NWR]$/.test(osmTypeLetter)
      ? `${osmTypeLetter}:${osmId}`
      : `photon:${rawName}:${countryCode ?? "?"}`;

  const city_name = rawName.slice(0, 200);
  const region = (p.state ?? p.county ?? null)?.toString().trim().slice(0, 200) || null;

  return {
    city_name,
    country: countryCode,
    region,
    lat,
    lng,
    external_place_id: external.slice(0, 200),
    subtitle: buildSubtitle(p, city_name),
  };
}

const DEFAULT_PHOTON = "https://photon.komoot.io/api/";

function photonBaseUrl(): string {
  const raw = process.env.PHOTON_API_BASE_URL?.trim();
  if (!raw) return DEFAULT_PHOTON;
  try {
    const u = new URL(raw.endsWith("/") ? raw : `${raw}/`);
    return u.toString();
  } catch {
    return DEFAULT_PHOTON;
  }
}

/**
 * Forward geocode search via Komoot Photon (OpenStreetMap).
 * Call only from the server. Respect usage policies: cache responses, identify the app in User-Agent.
 */
export async function searchPlacesPhoton(
  query: string,
  countryFilter: string | null,
  limit = 12
): Promise<PlaceSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const base = photonBaseUrl();
  const url = new URL(base);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(Math.min(30, Math.max(5, limit * 2))));
  url.searchParams.set("lang", "en");

  const ua =
    process.env.PHOTON_USER_AGENT?.trim() ||
    "Traveloop/1.0 (city search; https://github.com/Shrujal00/travelloop)";

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": ua },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return [];
  }

  const json = (await res.json()) as PhotonResponse;
  const features = Array.isArray(json.features) ? json.features : [];
  const cc = countryFilter?.trim().toUpperCase() || null;
  const queryLower = q.toLowerCase();

  const pairs: { hit: PlaceSearchHit; rank: number }[] = [];
  for (const f of features) {
    const p = f.properties ?? {};
    if (cc && p.countrycode?.trim().toUpperCase() !== cc) continue;
    const hit = featureToHit(f);
    if (!hit) continue;
    pairs.push({ hit, rank: rankOsmValue(p.osm_value) });
  }

  pairs.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    const aq = a.hit.city_name.toLowerCase() === queryLower ? 0 : 1;
    const bq = b.hit.city_name.toLowerCase() === queryLower ? 0 : 1;
    if (aq !== bq) return aq - bq;
    return a.hit.city_name.localeCompare(b.hit.city_name);
  });

  const seen = new Set<string>();
  const deduped: PlaceSearchHit[] = [];
  for (const { hit } of pairs) {
    const key = `${hit.city_name}|${hit.country ?? ""}|${hit.lat.toFixed(4)},${hit.lng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(hit);
    if (deduped.length >= limit) break;
  }

  return deduped;
}
