import { ItineraryViewClient } from "@/app/trips/[tripId]/itinerary/itinerary-view-client";
import { buildCalendarCells, buildItineraryDays } from "@/lib/trips/itinerary-day-buckets";
import { normalizeStopsForItinerary } from "@/lib/trips/normalize-itinerary-stops";
import { createClient } from "@/lib/supabase/server";
import { isUuidTripParam } from "@/lib/trips/trip-id";
import Link from "next/link";
import { notFound } from "next/navigation";

type TripRaw = {
  id: string;
  title: string;
  place: string | null;
  start_date: string | null;
  end_date: string | null;
  trip_stops?: unknown;
};

export default async function ItineraryViewPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  if (!isUuidTripParam(tripId)) {
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
      trip_stops (
        id,
        sort_order,
        city_name,
        start_date,
        end_date,
        trip_activities (
          id,
          title,
          cost,
          starts_at
        )
      )
    `
    )
    .eq("id", tripId)
    .maybeSingle();

  if (error || !trip) {
    notFound();
  }

  const row = trip as TripRaw;
  const stops = normalizeStopsForItinerary(row.trip_stops);
  const displayName = row.place?.trim() || row.title;
  const ts = row.start_date?.trim().slice(0, 10) ?? null;
  const te = row.end_date?.trim().slice(0, 10) ?? null;

  if (!ts || !te) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
          Day-by-day plan
        </h1>
        <p className="mt-4 max-w-xl text-stone-600">
          Add trip start and end dates to see your schedule here.
        </p>
        <Link
          href={`/trips/${tripId}/edit`}
          className="mt-6 inline-flex rounded-lg bg-[var(--travel-accent)] px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm hover:brightness-[0.97]"
        >
          Edit trip dates
        </Link>
      </main>
    );
  }

  const days = buildItineraryDays(ts, te, row.place, stops);
  const activityCountByDay = new Map<string, number>();
  for (const d of days) {
    activityCountByDay.set(d.date, d.activities.length);
  }
  const calendarCells = buildCalendarCells(ts, te, activityCountByDay);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
        Day-by-day plan
      </h1>

      <div className="mt-8">
        <ItineraryViewClient
          tripId={tripId}
          tripTitle={displayName}
          tripStart={ts}
          tripEnd={te}
          days={days}
          calendarCells={calendarCells}
        />
      </div>
    </main>
  );
}
