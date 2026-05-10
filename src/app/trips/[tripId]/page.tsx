import { TripDeleteForm } from "@/app/trips/trip-delete-form";
import { createClient } from "@/lib/supabase/server";
import { isUuidTripParam } from "@/lib/trips/trip-id";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type TripStopCount = { count: number };

type TripDetail = {
  id: string;
  title: string;
  place: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  trip_stops?: TripStopCount[] | null;
};

export default async function TripOverviewPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  if (!isUuidTripParam(tripId)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .select("id, title, place, start_date, end_date, created_at, trip_stops(count)")
    .eq("id", tripId)
    .maybeSingle();

  if (error) {
    const msg = error.message ?? "";
    if (
      msg.includes("trip_stops") ||
      msg.includes("schema cache") ||
      error.code === "PGRST200"
    ) {
      redirect(
        "/trips?error=" +
          encodeURIComponent(
            "Run the trip_stops_activities migration in Supabase (see README), then open this trip again."
          )
      );
    }
    notFound();
  }

  if (!trip) {
    notFound();
  }

  const row = trip as TripDetail;
  const stopCountRaw = row.trip_stops?.[0]?.count;
  const stopCount =
    typeof stopCountRaw === "number"
      ? stopCountRaw
      : typeof stopCountRaw === "string"
        ? Number(stopCountRaw)
        : row.place
          ? 1
          : 0;

  const displayName = row.place?.trim() || row.title;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
        Trip overview
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
        {displayName}
      </h1>

      <dl className="mt-8 grid gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Date range
          </dt>
          <dd className="mt-1 text-stone-800">
            {row.start_date && row.end_date
              ? `${row.start_date} → ${row.end_date}`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Destinations
          </dt>
          <dd className="mt-1 text-stone-800">
            {stopCount} {stopCount === 1 ? "stop" : "stops"}
          </dd>
        </div>
      </dl>

      <nav className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href={`/trips/${tripId}/edit`}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--travel-accent)] px-4 py-2 text-sm font-semibold text-stone-900 shadow-sm transition hover:brightness-[0.97]"
        >
          Edit trip
        </Link>
        <Link
          href={`/trips/${tripId}/build`}
          className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
        >
          Itinerary builder
        </Link>
      </nav>

      <div className="mt-10 border-t border-stone-200 pt-8">
        <p className="text-sm font-medium text-stone-700">Danger zone</p>
        <div className="mt-3">
          <TripDeleteForm tripId={tripId} variant="danger" />
        </div>
      </div>
    </main>
  );
}
