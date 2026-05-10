import type { DashboardTripForCollapsible } from "@/components/trip-itinerary-collapsible";
import Link from "next/link";

function dateLabel(raw: string | null): string {
  if (!raw) return "—";
  const s = String(raw).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : s.slice(0, 10);
}

export function TripSummaryCard({ trip }: { trip: DashboardTripForCollapsible }) {
  const headline = trip.place?.trim() || trip.title;
  const range =
    trip.start_date && trip.end_date
      ? `${dateLabel(trip.start_date)} → ${dateLabel(trip.end_date)}`
      : "Dates not set";

  return (
    <div className="flex h-full min-h-[10rem] flex-col rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">Trip</p>
      <p className="mt-1 line-clamp-2 font-semibold text-stone-900">{headline}</p>
      <p className="mt-1 line-clamp-2 text-xs text-stone-600">{trip.title}</p>
      <p className="mt-2 text-xs text-stone-500">{range}</p>
      <div className="mt-auto pt-4">
        <Link
          href={`/trips/${trip.id}`}
          className="inline-flex w-full justify-center rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-900 hover:bg-stone-100"
        >
          View
        </Link>
      </div>
    </div>
  );
}
