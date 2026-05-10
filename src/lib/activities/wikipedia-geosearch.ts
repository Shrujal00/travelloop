type WikiGeoHit = { title: string; lat: number; lon: number; dist: number };

type WikiGeoResponse = {
  query?: {
    geosearch?: { title: string; lat: number; lon: number; dist: number }[];
  };
};

const WIKI_API = "https://en.wikipedia.org/w/api.php";

/**
 * Nearby Wikipedia article titles (no extracts — keeps calls minimal).
 * Server-only; respect caching at the caller.
 */
export async function fetchWikipediaGeosearch(
  lat: number,
  lng: number,
  radiusM = 1000,
  limit = 10
): Promise<WikiGeoHit[]> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];

  const ua =
    process.env.WIKIPEDIA_USER_AGENT?.trim() ||
    "Traveloop/1.0 (activity suggestions; https://github.com/Shrujal00/travelloop)";

  const url = new URL(WIKI_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "geosearch");
  url.searchParams.set("gscoord", `${lat}|${lng}`);
  url.searchParams.set("gsradius", String(radiusM));
  url.searchParams.set("gslimit", String(limit));
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": ua },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return [];

  const json = (await res.json()) as WikiGeoResponse;
  const raw = json.query?.geosearch;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((r) => ({
      title: String(r.title ?? ""),
      lat: Number(r.lat),
      lon: Number(r.lon),
      dist: Number(r.dist),
    }))
    .filter((r) => r.title && Number.isFinite(r.lat) && Number.isFinite(r.lon));
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

function tokenOverlap(a: string, b: string): boolean {
  const stop = new Set(["the", "and", "of", "de", "la", "el", "in", "at", "a", "an"]);
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !stop.has(t));
  const ta = norm(a);
  const tb = new Set(norm(b));
  return ta.some((t) => tb.has(t));
}

/**
 * Attach best Wikipedia title to each suggestion when within ~250 m or title tokens overlap.
 */
export function mergeWikipediaTitles<T extends { name: string; lat: number; lng: number; wikipediaTitle?: string | null }>(
  suggestions: T[],
  wikiHits: WikiGeoHit[]
): T[] {
  if (wikiHits.length === 0) return suggestions;

  return suggestions.map((s) => {
    let best: WikiGeoHit | null = null;
    let bestScore = 0;

    for (const w of wikiHits) {
      const d = haversineMeters(s.lat, s.lng, w.lat, w.lon);
      const near = d <= 250;
      const overlap = tokenOverlap(s.name, w.title);
      const score = (near ? 2 : 0) + (overlap ? 1 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = w;
      }
    }

    if (best && bestScore > 0) {
      return { ...s, wikipediaTitle: best.title };
    }
    return s;
  });
}
