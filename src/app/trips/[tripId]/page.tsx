import { TripDeleteForm } from "@/app/trips/trip-delete-form";
import {
  TripOverviewSections,
  type OverviewStopRow,
} from "@/components/trip-overview-sections";
import { TripSharingPanel } from "@/components/trip-sharing-panel";
import { getPublicSiteUrl } from "@/lib/app-origin";
import { createClient } from "@/lib/supabase/server";
import { isUuidTripParam } from "@/lib/trips/trip-id";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type TripDetailRaw = {
  id: string;
  title: string;
  place: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  is_public?: boolean | null;
  public_slug?: string | null;
  trip_stops?: unknown;
};

function normalizeOverviewStops(raw: unknown): OverviewStopRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const r = row as Record<string, unknown>;
      const actsRaw = r.trip_activities;
      const actsArr = Array.isArray(actsRaw) ? actsRaw : [];
      const activities = actsArr.map((a) => {
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
          cost: Number.isFinite(cost as number) ? (cost as number) : null,
          starts_at: ar.starts_at != null ? String(ar.starts_at) : null,
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

function decodeParam(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function TripOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ share?: string; share_error?: string }>;
}) {
  const { tripId } = await params;
  const sp = await searchParams;
  const shareStatus = decodeParam(sp.share);
  const shareError = decodeParam(sp.share_error);
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
      created_at,
      is_public,
      public_slug,
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

  if (error) {
    const msg = error.message ?? "";
    if (
      msg.includes("trip_stops") ||
      msg.includes("trip_activities") ||
      msg.includes("is_public") ||
      msg.includes("public_slug") ||
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

  const row = trip as TripDetailRaw;
  const stops = normalizeOverviewStops(row.trip_stops);
  const displayName = row.place?.trim() || row.title;
  const isPublic = Boolean(row.is_public);
  const publicSlug =
    typeof row.public_slug === "string" && row.public_slug.trim()
      ? row.public_slug.trim()
      : null;
  const shareUrl =
    isPublic && publicSlug ? `${getPublicSiteUrl()}/p/${publicSlug}` : null;

  const shareBanner =
    shareStatus === "enabled"
      ? "Sharing is on — copy the link below for guests."
      : shareStatus === "disabled"
        ? "Sharing is off. Guests can no longer open the old link."
        : shareStatus === "rotated"
          ? "Share link rotated — share the new URL below."
          : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
        Trip overview
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
        {displayName}
      </h1>

      {shareBanner ? (
        <p
          className="mt-6 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900"
          role="status"
        >
          {shareBanner}
        </p>
      ) : null}

      {shareError ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {shareError}
        </p>
      ) : null}

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
            {stops.length} {stops.length === 1 ? "stop" : "stops"}
          </dd>
        </div>
      </dl>

      <TripSharingPanel tripId={tripId} isPublic={isPublic} shareUrl={shareUrl} />

      <TripOverviewSections tripId={tripId} stops={stops} />

      <nav className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href={`/trips/${tripId}/itinerary`}
          className="inline-flex items-center justify-center rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
        >
          Itinerary view
        </Link>
        <Link
          href={`/trips/${tripId}/budget`}
          className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
        >
          Budget
        </Link>
        <Link
          href={`/trips/${tripId}/packing`}
          className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
        >
          Packing
        </Link>
        <Link
          href={`/trips/${tripId}/notes`}
          className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
        >
          Notes
        </Link>
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
