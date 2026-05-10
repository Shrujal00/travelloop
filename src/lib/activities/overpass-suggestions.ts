import { familyFromOsmTags, labelForPrimaryKind } from "@/lib/activities/family-from-tags";
import type { ActivitySuggestion } from "@/lib/activities/suggestion-types";

const DEFAULT_OVERPASS = "https://overpass-api.de/api/interpreter";
const RADIUS_M = 1400;
const MAX_FEATURES = 55;

function overpassBaseUrl(): string {
  const raw = process.env.OVERPASS_API_URL?.trim();
  if (!raw) return DEFAULT_OVERPASS;
  try {
    const u = new URL(raw);
    return u.toString().replace(/\/?$/, "");
  } catch {
    return DEFAULT_OVERPASS;
  }
}

function overpassUserAgent(): string {
  return (
    process.env.OVERPASS_USER_AGENT?.trim() ||
    "Traveloop/1.0 (activity suggestions; https://github.com/Shrujal00/travelloop)"
  );
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function buildOverpassQuery(lat: number, lng: number): string {
  const r = RADIUS_M;
  const tourism =
    "^(museum|attraction|viewpoint|gallery|theme_park|zoo|aquarium|artwork|information)$";
  const historic = "^(monument|memorial|archaeological_site|castle|ruins|wayside_shrine|fort)$";
  const leisure = "^(park|nature_reserve|playground|stadium|sports_centre|water_park|garden|marina)$";
  const amenity = "^(theatre|cinema|arts_centre|library|community_centre|marketplace|events_venue|fountain)$";

  return `[out:json][timeout:25];
(
  node["tourism"~"${tourism}"](around:${r},${lat},${lng});
  way["tourism"~"${tourism}"](around:${r},${lat},${lng});
  node["historic"~"${historic}"](around:${r},${lat},${lng});
  way["historic"~"${historic}"](around:${r},${lat},${lng});
  node["leisure"~"${leisure}"](around:${r},${lat},${lng});
  way["leisure"~"${leisure}"](around:${r},${lat},${lng});
  node["amenity"~"${amenity}"](around:${r},${lat},${lng});
  way["amenity"~"${amenity}"](around:${r},${lat},${lng});
);
out center tags;`;
}

type OsmElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

type OverpassJson = { elements?: OsmElement[] };

function pickName(tags: Record<string, string>): string {
  const n =
    tags.name?.trim() ||
    tags["name:en"]?.trim() ||
    tags["name:de"]?.trim() ||
    tags.ref?.trim() ||
    "";
  return n || "Unnamed place";
}

function elementToSuggestion(el: OsmElement, originLat: number, originLng: number): ActivitySuggestion | null {
  const t = el.type;
  if (t !== "node" && t !== "way") return null;

  let lat: number;
  let lng: number;
  if (t === "node" && typeof el.lat === "number" && typeof el.lon === "number") {
    lat = el.lat;
    lng = el.lon;
  } else if (el.center && typeof el.center.lat === "number" && typeof el.center.lon === "number") {
    lat = el.center.lat;
    lng = el.center.lon;
  } else {
    return null;
  }

  const tags = el.tags ?? {};
  const name = pickName(tags);
  const primaryKind = labelForPrimaryKind(tags);
  const family = familyFromOsmTags(tags);
  const distanceM = Math.round(haversineMeters(originLat, originLng, lat, lng));
  const id = `${t}:${el.id}`;
  const wikidata = tags.wikidata?.trim() || null;
  const wikipediaRaw = tags.wikipedia?.trim();
  let wikipediaTitle: string | null = null;
  if (wikipediaRaw) {
    const idx = wikipediaRaw.indexOf(":");
    wikipediaTitle = idx >= 0 ? wikipediaRaw.slice(idx + 1).trim() : wikipediaRaw;
  }

  return {
    id,
    name,
    primaryKind,
    family,
    distanceM,
    lat,
    lng,
    wikipediaTitle,
    wikidata,
    attribution: "osm",
    externalRef: id,
  };
}

/**
 * Fetch and normalize nearby POIs from a public Overpass interpreter.
 * Call only from the server. Uses bounded radius, small element cap, and HTTP cache hints.
 */
export async function fetchOverpassActivitySuggestions(
  lat: number,
  lng: number,
  opts?: { signal?: AbortSignal }
): Promise<ActivitySuggestion[]> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];

  const query = buildOverpassQuery(lat, lng);
  const url = overpassBaseUrl();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": overpassUserAgent(),
    },
    body: new URLSearchParams({ data: query }),
    next: { revalidate: 86400 },
    signal: opts?.signal,
  });

  if (!res.ok) {
    return [];
  }

  const json = (await res.json()) as OverpassJson;
  const elements = Array.isArray(json.elements) ? json.elements : [];
  const mapped: ActivitySuggestion[] = [];

  for (const el of elements) {
    const s = elementToSuggestion(el, lat, lng);
    if (s) mapped.push(s);
  }

  mapped.sort((a, b) => a.distanceM - b.distanceM || a.name.localeCompare(b.name));
  const seen = new Set<string>();
  const deduped: ActivitySuggestion[] = [];
  for (const s of mapped) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    deduped.push(s);
    if (deduped.length >= MAX_FEATURES) break;
  }

  return deduped;
}
