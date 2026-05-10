import {
  ItineraryBuilderClient,
  type BuilderActivityRow,
  type BuilderStopRow,
  type BuilderTripPayload,
} from "./itinerary-builder-client";
import { createClient } from "@/lib/supabase/server";
import { isUuidTripParam } from "@/lib/trips/trip-id";
import { notFound } from "next/navigation";

function decodeErr(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function sortActivities(rows: BuilderActivityRow[]): BuilderActivityRow[] {
  return [...rows].sort((a, b) => {
    if (!a.starts_at && !b.starts_at) {
      return a.id.localeCompare(b.id);
    }
    if (!a.starts_at) return 1;
    if (!b.starts_at) return -1;
    const c = a.starts_at.localeCompare(b.starts_at);
    return c !== 0 ? c : a.id.localeCompare(b.id);
  });
}

export default async function TripBuildPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { tripId } = await params;
  const { error: errParam } = await searchParams;
  const errorMessage = decodeErr(errParam);

  if (!isUuidTripParam(tripId)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: raw, error } = await supabase
    .from("trips")
    .select(
      `
      id,
      title,
      place,
      start_date,
      end_date,
      trip_stops (
        id,
        sort_order,
        city_name,
        country,
        region,
        lat,
        lng,
        external_place_id,
        start_date,
        end_date,
        trip_activities (
          id,
          title,
          starts_at,
          cost,
          category,
          created_at
        )
      )
    `
    )
    .eq("id", tripId)
    .maybeSingle();

  if (error) {
    const msg = error.message ?? "";
    if (
      msg.includes("trip_stops") ||
      msg.includes("trip_activities") ||
      msg.includes("schema cache") ||
      error.code === "PGRST200"
    ) {
      notFound();
    }
    notFound();
  }

  if (!raw) {
    notFound();
  }

  const tripStopsRaw = (raw as { trip_stops?: unknown }).trip_stops;
  const stopsUnknown = Array.isArray(tripStopsRaw) ? tripStopsRaw : [];

  const trip_stops: BuilderStopRow[] = stopsUnknown
    .map((row) => {
      const s = row as Record<string, unknown>;
      const actsRaw = s.trip_activities;
      const actsArr = Array.isArray(actsRaw) ? actsRaw : [];
      const trip_activities: BuilderActivityRow[] = actsArr.map((a) => {
        const ar = a as Record<string, unknown>;
        return {
          id: String(ar.id),
          title: String(ar.title ?? ""),
          starts_at: ar.starts_at != null ? String(ar.starts_at) : null,
          cost: (() => {
            if (ar.cost == null || ar.cost === "") return null;
            const n = typeof ar.cost === "string" ? Number(ar.cost) : Number(ar.cost);
            return Number.isFinite(n) ? n : null;
          })(),
          category: ar.category != null ? String(ar.category) : null,
        };
      });
      const latRaw = s.lat;
      const lngRaw = s.lng;
      const lat =
        latRaw == null || latRaw === ""
          ? null
          : typeof latRaw === "number"
            ? latRaw
            : Number(latRaw);
      const lng =
        lngRaw == null || lngRaw === ""
          ? null
          : typeof lngRaw === "number"
            ? lngRaw
            : Number(lngRaw);

      return {
        id: String(s.id),
        sort_order: typeof s.sort_order === "number" ? s.sort_order : Number(s.sort_order ?? 0),
        city_name: String(s.city_name ?? ""),
        country: (() => {
          const c = s.country != null ? String(s.country).trim().toUpperCase() : "";
          return /^[A-Z]{2}$/.test(c) ? c : null;
        })(),
        region: s.region != null ? String(s.region) : null,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        external_place_id: s.external_place_id != null ? String(s.external_place_id) : null,
        start_date: s.start_date != null ? String(s.start_date) : null,
        end_date: s.end_date != null ? String(s.end_date) : null,
        trip_activities: sortActivities(trip_activities),
      };
    })
    .sort((a, b) => a.sort_order - b.sort_order);

  const trip: BuilderTripPayload = {
    id: String((raw as { id: unknown }).id),
    title: String((raw as { title: unknown }).title ?? ""),
    place: (raw as { place: string | null }).place ?? null,
    start_date: (raw as { start_date: string | null }).start_date ?? null,
    end_date: (raw as { end_date: string | null }).end_date ?? null,
    trip_stops,
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
        Screen 5 · Build itinerary
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
        Stops & activities
      </h1>
      <p className="mt-2 max-w-xl text-sm text-stone-600">
        Drag the handle to reorder stops. Pick a country to narrow search, type a city, then choose
        a match to save coordinates (OpenStreetMap via Photon). Dates must stay inside the trip
        window. Each stop can list activities with optional time, cost, and category.
      </p>

      {errorMessage ? (
        <p
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-8">
        <ItineraryBuilderClient trip={trip} />
      </div>
    </main>
  );
}
