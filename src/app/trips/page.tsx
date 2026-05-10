import { TripsBoardClient } from "@/components/trips-board-client";
import type { DashboardTripForCollapsible } from "@/components/trip-itinerary-collapsible";
import { getVerifiedEmail } from "@/lib/auth/session";
import { getPublicSiteUrl } from "@/lib/app-origin";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { todayIsoUtc } from "@/lib/trips/trip-lifecycle";
import Link from "next/link";
import { redirect } from "next/navigation";

function decodeParam(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function enrichDashboardTrip(row: unknown): DashboardTripForCollapsible {
  const r = row as Record<string, unknown>;
  const is_public = Boolean(r.is_public);
  const slug =
    typeof r.public_slug === "string" && r.public_slug.trim()
      ? String(r.public_slug).trim().toLowerCase()
      : "";
  const share_url = is_public && slug ? `${getPublicSiteUrl()}/p/${slug}` : null;
  return {
    id: String(r.id ?? ""),
    title: String(r.title ?? ""),
    place: r.place != null ? String(r.place) : null,
    start_date: r.start_date != null ? String(r.start_date) : null,
    end_date: r.end_date != null ? String(r.end_date) : null,
    created_at: String(r.created_at ?? ""),
    trip_stops: r.trip_stops,
    is_public,
    public_slug: slug || null,
    share_url,
  };
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    share?: string;
    share_error?: string;
    for_trip?: string;
  }>;
}) {
  const sp = await searchParams;
  const decodedError = decodeParam(sp.error);
  const shareStatus = decodeParam(sp.share);
  const shareError = decodeParam(sp.share_error);
  const highlightTripId = decodeParam(sp.for_trip);

  const email = await getVerifiedEmail();
  if (!email) {
    redirect("/login?next=/trips");
  }

  const supabase = await createClient();
  const { data: tripsRaw, error: listError } = await supabase
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
        trip_activities ( cost )
      )
    `
    )
    .order("created_at", { ascending: false });

  const trips = (tripsRaw ?? []).map(enrichDashboardTrip);
  const listFailed = Boolean(listError);
  const todayIso = todayIsoUtc();

  const shareBanner =
    shareStatus === "enabled"
      ? "Public link is on — copy it from the Share plan strip on this trip’s card (or open Trip overview for full controls)."
      : shareStatus === "disabled"
        ? "Sharing is off. Guests can no longer open the old link."
        : shareStatus === "rotated"
          ? "New share link generated — copy it from the trip card."
          : null;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            href="/"
            className="[font-family:var(--font-travel-display)] text-2xl text-[var(--travel-charcoal)]"
          >
            Traveloop
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
            <Link
              href="/community"
              className="font-medium text-stone-600 underline-offset-4 hover:text-[var(--travel-charcoal)] hover:underline"
            >
              Community
            </Link>
            <Link
              href="/profile"
              className="font-medium text-stone-600 underline-offset-4 hover:text-[var(--travel-charcoal)] hover:underline"
            >
              Profile
            </Link>
            <Link
              href="/settings"
              className="font-medium text-stone-600 underline-offset-4 hover:text-[var(--travel-charcoal)] hover:underline"
            >
              Settings
            </Link>
            <span className="hidden text-stone-600 sm:inline">{email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-stone-300 px-3 py-1.5 font-medium text-stone-700 transition hover:bg-stone-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-stone-500">Your trips</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
              Itineraries
            </h1>
          </div>
          <Link
            href="/trips/new"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[var(--travel-accent)] px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm transition hover:brightness-[0.97]"
          >
            New trip
          </Link>
        </div>

        {decodedError ? (
          <p
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {decodedError}
          </p>
        ) : null}

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

        {listFailed ? (
          <p
            className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            Could not load trips. Run migrations in{" "}
            <code className="rounded bg-amber-100/80 px-1">supabase/migrations/</code>{" "}
            (see README), then refresh.
          </p>
        ) : null}

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-[var(--travel-charcoal)]">Trip board</h2>
          {!listFailed && trips.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white/80 px-6 py-14 text-center text-stone-500">
              No trips yet —{" "}
              <Link
                href="/trips/new"
                className="font-semibold text-[var(--travel-charcoal)] underline-offset-4 hover:underline"
              >
                create one
              </Link>
              .
            </div>
          ) : null}
          {!listFailed && trips.length > 0 ? (
            <div className="mt-4">
              <TripsBoardClient trips={trips} todayIso={todayIso} highlightTripId={highlightTripId} />
            </div>
          ) : null}
        </section>

        <Link
          href="/"
          className="mt-10 inline-block text-sm font-semibold text-[var(--travel-charcoal)] underline-offset-4 hover:underline"
        >
          ← Back to home
        </Link>
      </main>
    </div>
  );
}
