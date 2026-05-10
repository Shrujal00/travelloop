import { getVerifiedSession } from "@/lib/auth/session";
import { fetchOverpassActivitySuggestions } from "@/lib/activities/overpass-suggestions";
import { resolveSuggestionCentroid } from "@/lib/activities/suggestion-centroid";
import type { SuggestionsApiResponse } from "@/lib/activities/suggestion-types";
import { fetchWikipediaGeosearch, mergeWikipediaTitles } from "@/lib/activities/wikipedia-geosearch";
import { isUuidTripParam } from "@/lib/trips/trip-id";
import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

function parseUuid(raw: string | null): string | null {
  if (!raw) return null;
  const id = raw.trim();
  return isUuidTripParam(id) ? id : null;
}

const loadSuggestionsCached = unstable_cache(
  async (latKey: string, lngKey: string) => {
    const lat = Number(latKey);
    const lng = Number(lngKey);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return [];
    }
    const osm = await fetchOverpassActivitySuggestions(lat, lng);
    const wiki = await fetchWikipediaGeosearch(lat, lng, 1000, 10);
    return mergeWikipediaTitles(osm, wiki);
  },
  ["activity-suggestions-overpass"],
  { revalidate: 86400 }
);

export async function GET(req: Request) {
  const session = await getVerifiedSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tripId = parseUuid(searchParams.get("trip_id"));
  const stopId = parseUuid(searchParams.get("stop_id"));
  if (!tripId || !stopId) {
    return Response.json({ error: "Invalid trip_id or stop_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: stop, error } = await supabase
    .from("trip_stops")
    .select("id, trip_id, city_name, country, lat, lng")
    .eq("id", stopId)
    .eq("trip_id", tripId)
    .maybeSingle();

  if (error || !stop) {
    return Response.json({ error: "Stop not found" }, { status: 404 });
  }

  const centroid = await resolveSuggestionCentroid({
    lat: stop.lat != null ? Number(stop.lat) : null,
    lng: stop.lng != null ? Number(stop.lng) : null,
    city_name: String(stop.city_name ?? ""),
    country:
      stop.country != null && /^[A-Z]{2}$/i.test(String(stop.country).trim())
        ? String(stop.country).trim().toUpperCase()
        : null,
  });

  if (!centroid.ok) {
    const body: SuggestionsApiResponse = {
      suggestions: [],
      centroid: null,
      centroidNote:
        "No coordinates for this stop and we could not geocode the city. Save a place match on the stop first.",
    };
    return Response.json(body);
  }

  const latKey = centroid.lat.toFixed(3);
  const lngKey = centroid.lng.toFixed(3);
  const suggestions = await loadSuggestionsCached(latKey, lngKey);

  const body: SuggestionsApiResponse = {
    suggestions,
    centroid: {
      lat: centroid.lat,
      lng: centroid.lng,
      source: centroid.source,
    },
    centroidNote:
      centroid.source === "photon"
        ? "Using approximate map center from your city name (save a place pick on the stop for tighter results)."
        : null,
  };

  return Response.json(body);
}
