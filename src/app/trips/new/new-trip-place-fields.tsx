"use client";

import { PlaceSearchFields } from "@/components/place-search-fields";

const newTripControlClass =
  "mt-2 w-full rounded-xl border-2 border-stone-800/15 bg-white px-3 py-2.5 text-stone-900 outline-none transition focus:border-[var(--travel-accent)] focus:ring-2 focus:ring-[var(--travel-accent)]/30";

export function NewTripPlaceFields() {
  return (
    <PlaceSearchFields
      inputId="new-trip-place"
      countrySelectId="new-trip-country"
      cityNameField="place"
      controlClassName={newTripControlClass}
      labels={{
        country: "Country filter",
        city: "Destination (city or place)",
        countryHint: "Narrows Photon search. Pick a result to save map data on your first stop.",
      }}
      defaults={{
        city_name: "",
        country: null,
        region: null,
        lat: null,
        lng: null,
        external_place_id: null,
      }}
    />
  );
}
