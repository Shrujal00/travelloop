import { DiscoverClient } from "./discover-client";
import { englishOfficialCountryName } from "@/lib/places/countries";
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

type TripEmbed = { id: string; title: string };

export default async function StopDiscoverPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string; stopId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { tripId, stopId } = await params;
  const { error: errParam } = await searchParams;
  const initialError = decodeErr(errParam);

  if (!isUuidTripParam(tripId) || !isUuidTripParam(stopId)) {
    notFound();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trip_stops")
    .select(
      `
      id,
      city_name,
      country,
      trips (
        id,
        title
      )
    `
    )
    .eq("id", stopId)
    .eq("trip_id", tripId)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const tripsRel = data.trips as TripEmbed | TripEmbed[] | null;
  const tripRow = Array.isArray(tripsRel) ? tripsRel[0] : tripsRel;
  if (!tripRow?.title) {
    notFound();
  }

  const cityName = String(data.city_name ?? "").trim() || "Stop";
  const stopCountry =
    data.country != null && String(data.country).trim()
      ? englishOfficialCountryName(String(data.country))
      : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
        Browse activity ideas
      </h1>
      <p className="mt-4 text-sm">
        <Link
          href={`/trips/${tripId}/build`}
          className="font-semibold text-stone-800 underline-offset-4 hover:underline"
        >
          ← Back to itinerary builder
        </Link>
        {" · "}
        <Link
          href={`/trips/${tripId}`}
          className="font-semibold text-stone-800 underline-offset-4 hover:underline"
        >
          Trip overview
        </Link>
      </p>

      <div className="mt-8">
        <DiscoverClient
          tripId={tripId}
          stopId={stopId}
          tripTitle={tripRow.title}
          stopCityName={cityName}
          stopCountryLabel={stopCountry}
          initialError={initialError}
        />
      </div>
    </main>
  );
}
