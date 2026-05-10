import { DiscoverClient } from "./discover-client";
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

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
        Phase E · Activity discover
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
        Browse activity ideas
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        Free points of interest from OpenStreetMap around this stop (with optional Wikipedia
        titles). Filter and sort on your device — then add anything you like to your itinerary.
      </p>
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
          initialError={initialError}
        />
      </div>

      <p className="mt-10 text-center text-[11px] leading-relaxed text-stone-400">
        Data ©{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          className="underline underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap
        </a>{" "}
        contributors,{" "}
        <a href="https://opendatacommons.org/licenses/odbl/" className="underline underline-offset-2" target="_blank" rel="noreferrer">
          ODbL
        </a>
        . Please use results fairly; queries are cached on the server.
      </p>
    </main>
  );
}
