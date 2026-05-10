import { ItineraryViewClient } from "@/app/trips/[tripId]/itinerary/itinerary-view-client";
import {
  buildCalendarCells,
  buildItineraryDays,
  type SourceActivity,
  type SourceStop,
} from "@/lib/trips/itinerary-day-buckets";
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

function normalizeStops(raw: unknown): SourceStop[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const r = row as Record<string, unknown>;
      const actsRaw = r.trip_activities;
      const actsArr = Array.isArray(actsRaw) ? actsRaw : [];
      const activities: SourceActivity[] = actsArr.map((a) => {
        const ar = a as Record<string, unknown>;
        const costRaw = ar.cost;
        const cost =
          costRaw == null || costRaw === ""
            ? null
            : typeof costRaw === "number"
              ? costRaw
              : Number(costRaw);
        return {
          id: String(ar.id ?? ""),
          title: String(ar.title ?? ""),
          starts_at: ar.starts_at != null ? String(ar.starts_at) : null,
          cost: Number.isFinite(cost as number) ? (cost as number) : null,
        };
      });
      return {
        id: String(r.id ?? ""),
        sort_order: typeof r.sort_order === "number" ? r.sort_order : Number(r.sort_order ?? 0),
        city_name: String(r.city_name ?? "").trim() || "Untitled stop",
        start_date: r.start_date != null ? String(r.start_date) : null,
        end_date: r.end_date != null ? String(r.end_date) : null,
        activities,
      };
    })
    .filter((s) => s.id.length > 0)
    .sort((a, b) => a.sort_order - b.sort_order);
}

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
  const stops = normalizeStops(row.trip_stops);
  const displayName = row.place?.trim() || row.title;
  const ts = row.start_date?.trim().slice(0, 10) ?? null;
  const te = row.end_date?.trim().slice(0, 10) ?? null;

  if (!ts || !te) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm font-medium uppercase tracking-wide text-stone-500">Itinerary view</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
          Day-by-day plan
        </h1>
        <p className="mt-4 max-w-xl text-stone-600">
          Add a trip start and end date first — then this page shows every day in range with activities
          grouped under each stop&apos;s city.
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
      <p className="text-sm font-medium uppercase tracking-wide text-stone-500">Phase C · Itinerary view</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
        Day-by-day plan
      </h1>
      <p className="mt-2 max-w-xl text-sm text-stone-600">
        List view walks each day in order with a city header. Calendar view is a compact week grid with
        dots for days that have activities. Activities without a time use the stop start date.
      </p>

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
