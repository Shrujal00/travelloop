import type { ActivitySuggestionFamily } from "@/lib/activities/suggestion-types";

const FOOD_AMENITY = new Set([
  "marketplace",
  "food_court",
  "restaurant",
  "cafe",
  "bar",
  "pub",
  "fast_food",
  "ice_cream",
]);

const OUTDOOR_LEISURE = new Set([
  "park",
  "nature_reserve",
  "playground",
  "stadium",
  "sports_centre",
  "water_park",
  "garden",
  "marina",
  "pitch",
  "track",
  "dog_park",
]);

const CULTURE_TOURISM = new Set([
  "museum",
  "gallery",
  "theme_park",
  "artwork",
  "information",
  "attraction",
]);

const OUTDOOR_TOURISM = new Set(["viewpoint", "zoo", "aquarium"]);

export function familyFromOsmTags(tags: Record<string, string>): ActivitySuggestionFamily {
  const tourism = tags.tourism?.trim().toLowerCase() ?? "";
  const historic = tags.historic?.trim().toLowerCase() ?? "";
  const leisure = tags.leisure?.trim().toLowerCase() ?? "";
  const amenity = tags.amenity?.trim().toLowerCase() ?? "";

  if (historic) return "culture";

  if (tourism) {
    if (OUTDOOR_TOURISM.has(tourism)) return "outdoors";
    if (CULTURE_TOURISM.has(tourism)) return "culture";
    return "culture";
  }

  if (leisure) {
    if (OUTDOOR_LEISURE.has(leisure)) return "outdoors";
    return "other";
  }

  if (amenity) {
    if (FOOD_AMENITY.has(amenity)) return "food_drink";
    if (
      ["theatre", "cinema", "arts_centre", "library", "community_centre", "events_venue", "fountain"].includes(
        amenity
      )
    ) {
      return "culture";
    }
    return "other";
  }

  return "other";
}

export function labelForPrimaryKind(tags: Record<string, string>): string {
  const pairs: [string, string][] = [
    ["tourism", tags.tourism ?? ""],
    ["historic", tags.historic ?? ""],
    ["leisure", tags.leisure ?? ""],
    ["amenity", tags.amenity ?? ""],
  ];
  for (const [, v] of pairs) {
    const t = v.trim();
    if (!t) continue;
    const words = t.replace(/_/g, " ").split(" ");
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }
  return "Place";
}
