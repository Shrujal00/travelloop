import { ItineraryViewClient } from "@/app/trips/[tripId]/itinerary/itinerary-view-client";
import { PublicTripToolbar } from "@/components/public-trip-toolbar";
import { getPublicSiteUrl } from "@/lib/app-origin";
import { getVerifiedSession } from "@/lib/auth/session";
import {
  buildCalendarCells,
  buildItineraryDays,
} from "@/lib/trips/itinerary-day-buckets";
import { normalizeStopsForItinerary } from "@/lib/trips/normalize-itinerary-stops";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type TripPublicRow = {
  title: string;
  place: string | null;
  start_date: string | null;
  end_date: string | null;
  trip_stops?: unknown;
};

function slugOk(slug: string): boolean {
  return /^[a-z0-9]{12,40}$/.test(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slugOk(slug)) return { title: "Trip · Traveloop" };

  const supabase = await createClient();
  const { data } = await supabase
    .from("trips")
    .select("title, place")
    .eq("public_slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  const label =
    data && typeof data === "object"
      ? String((data as { place?: string | null }).place ?? "").trim() ||
        String((data as { title?: string }).title ?? "").trim()
      : "";
  return { title: label ? `${label} · Traveloop` : "Trip · Traveloop" };
}

export default async function PublicTripPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ copy_error?: string }>;
}) {
  const { slug } = await params;
  const { copy_error: copyErrorRaw } = await searchParams;

  if (!slugOk(slug)) {
    notFound();
  }

  const copyError =
    typeof copyErrorRaw === "string"
      ? (() => {
          try {
            return decodeURIComponent(copyErrorRaw);
          } catch {
            return copyErrorRaw;
          }
        })()
      : null;

  const supabase = await createClient();
  const session = await getVerifiedSession();

  const { data: trip, error } = await supabase
    .from("trips")
    .select(
      `
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
    .eq("public_slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (error) {
    const msg = error.message ?? "";
    if (
      msg.includes("is_public") ||
      msg.includes("public_slug") ||
      msg.includes("schema cache") ||
      error.code === "PGRST200"
    ) {
      return (
        <main className="mx-auto max-w-3xl px-6 py-16">
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Public sharing is not set up yet. Run{" "}
            <code className="rounded bg-amber-100/80 px-1">
              supabase/migrations/20260519000000_trip_public_share.sql
            </code>{" "}
            in Supabase (see README), then refresh.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm font-semibold text-[var(--travel-charcoal)] underline-offset-4 hover:underline">
            ← Home
          </Link>
        </main>
      );
    }
    notFound();
  }

  if (!trip) {
    notFound();
  }

  const row = trip as TripPublicRow;
  const stops = normalizeStopsForItinerary(row.trip_stops);
  const displayName = row.place?.trim() || row.title;
  const ts = row.start_date?.trim().slice(0, 10) ?? null;
  const te = row.end_date?.trim().slice(0, 10) ?? null;

  const siteUrl = getPublicSiteUrl();
  const shareUrl = `${siteUrl}/p/${slug}`;

  if (!ts || !te) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
          Shared itinerary
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
          {displayName}
        </h1>
        <p className="mt-4 text-stone-600">
          This trip does not include full dates yet, so there is no day-by-day view to display.
        </p>
        <div className="mt-8">
          <PublicTripToolbar slug={slug} signedIn={!!session} shareUrl={shareUrl} />
        </div>
        {copyError ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {copyError}
          </p>
        ) : null}
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
    <main className="mx-auto max-w-3xl px-6 py-10 pb-16">
      <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
        Shared itinerary
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
        {displayName}
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        Read-only schedule · {ts} → {te}
      </p>

      <div className="mt-6">
        <PublicTripToolbar slug={slug} signedIn={!!session} shareUrl={shareUrl} />
      </div>

      {copyError ? (
        <p
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {copyError}
        </p>
      ) : null}

      <div className="mt-10">
        <ItineraryViewClient
          tripId="__public__"
          tripTitle={displayName}
          tripStart={ts}
          tripEnd={te}
          days={days}
          calendarCells={calendarCells}
          showFooterLinks={false}
        />
      </div>
    </main>
  );
}
