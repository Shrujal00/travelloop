export type PlaceSearchHit = {
  city_name: string;
  country: string | null;
  region: string | null;
  lat: number;
  lng: number;
  external_place_id: string;
  subtitle: string;
};

export type PlaceFieldDefaults = {
  city_name: string;
  country: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  external_place_id: string | null;
};
