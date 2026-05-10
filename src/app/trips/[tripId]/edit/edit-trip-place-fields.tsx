"use client";

import { PlaceSearchFields } from "@/components/place-search-fields";
import type { PlaceFieldDefaults } from "@/lib/places/types";

const editControlClass =
  "mt-2 w-full rounded-xl border-2 border-stone-800/15 bg-white px-3 py-2.5 text-stone-900 outline-none transition focus:border-[var(--travel-accent)] focus:ring-2 focus:ring-[var(--travel-accent)]/30";

export function EditTripPlaceFields({ defaults }: { defaults: PlaceFieldDefaults }) {
  return (
    <PlaceSearchFields
      key={`${defaults.city_name}|${defaults.country ?? ""}|${defaults.external_place_id ?? ""}|${defaults.lat ?? ""}|${defaults.lng ?? ""}`}
      inputId="edit-trip-place"
      countrySelectId="edit-trip-country"
      cityNameField="place"
      controlClassName={editControlClass}
      labels={{
        country: "Country filter",
        city: "Place (destination)",
        countryHint: "Narrows Photon search. Pick a result to refresh coordinates on your primary stop.",
      }}
      defaults={defaults}
    />
  );
}
