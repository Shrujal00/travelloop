import { TripDeleteForm } from "@/app/trips/trip-delete-form";
import {
  TripItineraryCollapsible,
  type DashboardTripForCollapsible,
} from "@/components/trip-itinerary-collapsible";
import { getVerifiedEmail } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorParam } = await searchParams;
  const decodedError = errorParam
    ? (() => {
        try {
          return decodeURIComponent(errorParam);
        } catch {
          return errorParam;
        }
      })()
    : null;

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

  const trips = (tripsRaw ?? []) as DashboardTripForCollapsible[];
  const listFailed = Boolean(listError);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link
            href="/"
            className="[font-family:var(--font-travel-display)] text-2xl text-[var(--travel-charcoal)]"
          >
            Traveloop
          </Link>
          <div className="flex items-center gap-3 text-sm">
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
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
              Your trips
            </p>
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
          <h2 className="text-lg font-semibold text-[var(--travel-charcoal)]">
            Your list
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Each trip is a collapsible card so new stops show up here after you save.
          </p>
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
            <ul className="mt-4 space-y-4">
              {trips.map((t) => (
                <li key={t.id} className="space-y-2">
                  <TripItineraryCollapsible trip={t} />
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/trips/${t.id}`}
                      className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-800 transition hover:bg-stone-50"
                    >
                      View
                    </Link>
                    <Link
                      href={`/trips/${t.id}/edit`}
                      className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-800 transition hover:bg-stone-50"
                    >
                      Edit
                    </Link>
                    <TripDeleteForm tripId={t.id} />
                  </div>
                </li>
              ))}
            </ul>
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
