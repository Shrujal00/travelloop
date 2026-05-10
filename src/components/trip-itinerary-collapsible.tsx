import Link from "next/link";

/** Shape returned from Supabase nested `trip_stops` + `trip_activities` selects. */
export type DashboardTripForCollapsible = {
  id: string;
  title: string;
  place: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  trip_stops?: unknown;
};

type NormalizedStop = {
  id: string;
  sort_order: number;
  city_name: string;
  start_date: string | null;
  end_date: string | null;
  budget: number;
};

function dateLabel(raw: string | null): string {
  if (!raw) return "—";
  const s = String(raw).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : s.slice(0, 10);
}

function normalizeStops(raw: unknown): NormalizedStop[] {
  if (!Array.isArray(raw)) return [];
  const rows = raw
    .map((row) => {
      const r = row as Record<string, unknown>;
      const actsRaw = r.trip_activities;
      const acts = Array.isArray(actsRaw) ? actsRaw : [];
      let budget = 0;
      for (const a of acts) {
        const ar = a as Record<string, unknown>;
        const c = ar.cost;
        const n = typeof c === "string" ? Number(c) : typeof c === "number" ? c : NaN;
        if (Number.isFinite(n)) budget += n as number;
      }
      return {
        id: String(r.id ?? ""),
        sort_order: typeof r.sort_order === "number" ? r.sort_order : Number(r.sort_order ?? 0),
        city_name: String(r.city_name ?? "").trim() || "Untitled stop",
        start_date: r.start_date != null ? String(r.start_date) : null,
        end_date: r.end_date != null ? String(r.end_date) : null,
        budget,
      };
    })
    .filter((s) => s.id.length > 0);
  return rows.sort((a, b) => a.sort_order - b.sort_order);
}

export function TripItineraryCollapsible({ trip }: { trip: DashboardTripForCollapsible }) {
  const stops = normalizeStops(trip.trip_stops);
  const displayName = trip.place?.trim() || trip.title;
  const tripRange =
    trip.start_date && trip.end_date
      ? `${dateLabel(trip.start_date)} to ${dateLabel(trip.end_date)}`
      : "Dates not set";

  return (
    <details className="group rounded-2xl border border-stone-200 bg-white shadow-sm open:shadow-md">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Trip</p>
          <p className="mt-0.5 truncate font-semibold text-stone-900">{displayName}</p>
          <p className="mt-1 text-xs text-stone-500">
            Trip window: <span className="font-medium text-stone-700">{tripRange}</span>
            {" · "}
            <span className="font-medium text-stone-700">
              {stops.length} {stops.length === 1 ? "section" : "sections"}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <time
            dateTime={trip.created_at}
            className="text-xs text-stone-400"
          >
            {new Date(trip.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          <span
            className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500 transition group-open:bg-[var(--travel-accent)]/25 group-open:text-stone-800"
            aria-hidden
          >
            Menu
          </span>
        </div>
      </summary>
      <div className="border-t border-stone-100 px-4 py-3">
        {stops.length === 0 ? (
          <p className="text-sm text-stone-500">
            No itinerary sections yet.{" "}
            <Link
              href={`/trips/${trip.id}/build`}
              className="font-medium text-[var(--travel-charcoal)] underline underline-offset-2"
            >
              Build itinerary
            </Link>
          </p>
        ) : (
          <ol className="space-y-3">
            {stops.map((s, i) => (
              <li
                key={s.id}
                className="rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2.5 text-sm"
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">
                  Section {i + 1}
                </p>
                <p className="font-medium text-stone-800">{s.city_name}</p>
                <p className="mt-1 text-xs text-stone-600">
                  Travel, hotels, and activities for this leg.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700">
                    Date range: {dateLabel(s.start_date)} → {dateLabel(s.end_date)}
                  </span>
                  <span className="inline-flex rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700">
                    {s.budget > 0
                      ? `Budget (activities): $${s.budget.toFixed(2)}`
                      : "Budget: —"}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
          <Link
            href={`/trips/${trip.id}`}
            className="inline-flex rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50"
          >
            Overview
          </Link>
          <Link
            href={`/trips/${trip.id}/itinerary`}
            className="inline-flex rounded-lg border border-stone-300 bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800"
          >
            Itinerary view
          </Link>
          <Link
            href={`/trips/${trip.id}/build`}
            className="inline-flex rounded-lg bg-[var(--travel-accent)] px-3 py-1.5 text-xs font-semibold text-stone-900 shadow-sm hover:brightness-[0.97]"
          >
            Build itinerary
          </Link>
          <Link
            href="/trips"
            className="inline-flex rounded-lg px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900"
          >
            All trips
          </Link>
        </div>
      </div>
    </details>
  );
}
