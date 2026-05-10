import { EditTripPlaceFields } from "@/app/trips/[tripId]/edit/edit-trip-place-fields";
import { updateTrip } from "@/lib/trips/actions";
import { getVerifiedSession } from "@/lib/auth/session";
import type { PlaceFieldDefaults } from "@/lib/places/types";
import { createClient } from "@/lib/supabase/server";
import { isUuidTripParam } from "@/lib/trips/trip-id";
import Link from "next/link";
import { notFound } from "next/navigation";

function decodeErr(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function EditTripPage({
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

  const session = await getVerifiedSession();
  if (!session) {
    notFound();
  }

  const supabase = await createClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .select(
      `
      id,
      title,
      place,
      start_date,
      end_date,
      daily_budget_cap,
      trip_stops (
        id,
        sort_order,
        city_name,
        country,
        region,
        lat,
        lng,
        external_place_id
      )
    `
    )
    .eq("id", tripId)
    .maybeSingle();

  if (error || !trip) {
    notFound();
  }

  const place = trip.place?.trim() || trip.title;
  const stopsRaw = (trip as { trip_stops?: unknown }).trip_stops;
  const stopsArr = Array.isArray(stopsRaw) ? stopsRaw : [];
  type Prim = {
    sort_order: number;
    city_name: string;
    country: string | null;
    region: string | null;
    lat: number | null;
    lng: number | null;
    external_place_id: string | null;
  };
  const normalized: Prim[] = stopsArr.map((row) => {
    const r = row as Record<string, unknown>;
    const latRaw = r.lat;
    const lngRaw = r.lng;
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
    const cc = r.country != null ? String(r.country).trim().toUpperCase() : "";
    return {
      sort_order: typeof r.sort_order === "number" ? r.sort_order : Number(r.sort_order ?? 0),
      city_name: String(r.city_name ?? "").trim(),
      country: /^[A-Z]{2}$/.test(cc) ? cc : null,
      region: r.region != null ? String(r.region) : null,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      external_place_id: r.external_place_id != null ? String(r.external_place_id) : null,
    };
  });
  const primary = [...normalized].sort((a, b) => a.sort_order - b.sort_order)[0];
  const placeDefaults: PlaceFieldDefaults = {
    city_name: primary?.city_name || place,
    country: primary?.country ?? null,
    region: primary?.region ?? null,
    lat: primary?.lat ?? null,
    lng: primary?.lng ?? null,
    external_place_id: primary?.external_place_id ?? null,
  };
  const fieldClass =
    "mt-2 w-full rounded-xl border-2 border-stone-800/15 bg-white px-3 py-2.5 text-stone-900 outline-none transition focus:border-[var(--travel-accent)] focus:ring-2 focus:ring-[var(--travel-accent)]/30";

  const capRaw = (trip as { daily_budget_cap?: unknown }).daily_budget_cap;
  const capDefault =
    capRaw != null && capRaw !== "" ? String(capRaw) : "";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
        Edit trip
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
        Update details
      </h1>

      {errorMessage ? (
        <p
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <form action={updateTrip} className="mt-8 space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="trip_id" value={tripId} />

        <div>
          <label htmlFor="start_date" className="block text-sm font-semibold text-stone-800">
            Start date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            defaultValue={trip.start_date ?? ""}
            className={fieldClass}
          />
        </div>

        <div>
          <p className="block text-sm font-semibold text-stone-800">Place (destination)</p>
          <div className="mt-3">
            <EditTripPlaceFields defaults={placeDefaults} />
          </div>
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-semibold text-stone-800">
            End date
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            required
            defaultValue={trip.end_date ?? ""}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="daily_budget_cap" className="block text-sm font-semibold text-stone-800">
            Soft budget cap per day (optional)
          </label>
          <input
            id="daily_budget_cap"
            name="daily_budget_cap"
            type="number"
            min={0}
            step="0.01"
            defaultValue={capDefault}
            placeholder="e.g. 150"
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-stone-500">
            Leave blank for no alert. Compared to average spend per calendar trip day on Budget.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={`/trips/${tripId}`}
            className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--travel-accent)] px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm transition hover:brightness-[0.97]"
          >
            Save changes
          </button>
        </div>
      </form>
    </main>
  );
}
