import { isValidIso3166Alpha2 } from "@/lib/places/countries";

function parseOptionalCountryIso2(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toUpperCase();
  if (!s) return null;
  if (!isValidIso3166Alpha2(s)) return null;
  return s;
}

function parseOptionalRegion(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  return t.slice(0, 200);
}

function parseOptionalCoord(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

function parseOptionalExternalPlaceId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  return t.slice(0, 200);
}

export type ParsedGeocoderFields = {
  country: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  external_place_id: string | null;
};

/** Reads Photon/geo hidden fields from a FormData (same shape as builder stop forms). */
export function parseGeocoderFields(formData: FormData): ParsedGeocoderFields {
  const country = parseOptionalCountryIso2(formData.get("country"));
  const region = parseOptionalRegion(formData.get("region"));
  const latRaw = parseOptionalCoord(formData.get("lat"));
  const lngRaw = parseOptionalCoord(formData.get("lng"));
  const external_place_id = parseOptionalExternalPlaceId(formData.get("external_place_id"));
  const coordsOk =
    latRaw != null &&
    lngRaw != null &&
    Math.abs(latRaw) <= 90 &&
    Math.abs(lngRaw) <= 180;
  return {
    country: country ?? null,
    region: coordsOk ? region ?? null : null,
    lat: coordsOk ? latRaw : null,
    lng: coordsOk ? lngRaw : null,
    external_place_id: coordsOk ? external_place_id : null,
  };
}
