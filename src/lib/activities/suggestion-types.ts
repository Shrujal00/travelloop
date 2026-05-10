/** High-level buckets for UI group/filter (maps from OSM tags). */
export type ActivitySuggestionFamily =
  | "culture"
  | "outdoors"
  | "food_drink"
  | "other";

/** View-model returned by `/api/activities/suggestions` and consumed by Discover UI. */
export type ActivitySuggestion = {
  /** Stable OSM reference, e.g. `node:123` or `way:456`. */
  id: string;
  /** Human-readable place name. */
  name: string;
  /** Short kind label derived from OSM tags (e.g. "Museum", "Park"). */
  primaryKind: string;
  family: ActivitySuggestionFamily;
  distanceM: number;
  lat: number;
  lng: number;
  /** Optional Wikipedia article title (no extract in v1). */
  wikipediaTitle?: string | null;
  wikidata?: string | null;
  attribution: "osm";
  /** Same as `id` when sourced from OSM; stored on `trip_activities.external_ref`. */
  externalRef: string;
};

export type SuggestionsApiResponse = {
  suggestions: ActivitySuggestion[];
  /** Present when a map center could be resolved (stop coords or Photon fallback). */
  centroid: { lat: number; lng: number; source: "stop" | "photon" } | null;
  /** Short note for UI (e.g. Photon fallback or missing coords). */
  centroidNote?: string | null;
};
