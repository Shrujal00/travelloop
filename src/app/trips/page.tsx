import { TripDeleteForm } from "@/app/trips/trip-delete-form";
import { getVerifiedEmail } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import Link from "next/link";
import { redirect } from "next/navigation";

type TripStopCount = { count: number };

type TripRow = {
  id: string;
  title: string;
  place: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  trip_stops?: TripStopCount[] | null;
};

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
    .select("id, title, place, start_date, end_date, created_at, trip_stops(count)")
    .order("created_at", { ascending: false });

  const trips = (tripsRaw ?? []) as TripRow[];
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
            <p className="mt-3 max-w-xl text-stone-600">
              Open a trip for details, edit dates and place, or remove a plan. Run
              migrations through <code className="rounded bg-stone-100 px-1">trip_stops_activities</code>{" "}
              if lists fail to load.
            </p>
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
            <ul className="mt-4 space-y-3">
              {trips.map((t) => {
                const rawCount = t.trip_stops?.[0]?.count;
                const stopCount =
                  typeof rawCount === "number"
                    ? rawCount
                    : typeof rawCount === "string"
                      ? Number(rawCount)
                      : t.place
                        ? 1
                        : 0;
                return (
                  <li
                    key={t.id}
                    className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-stretch sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-stone-800">
                        {t.place || t.title}
                      </span>
                      {t.start_date && t.end_date ? (
                        <span className="mt-0.5 block text-xs text-stone-500">
                          {t.start_date} → {t.end_date}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-xs text-stone-500">
                        {stopCount} destination{stopCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                      <time
                        dateTime={t.created_at}
                        className="text-xs text-stone-500 sm:text-right"
                      >
                        {new Date(t.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                      <div className="flex flex-wrap items-center gap-2">
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
                    </div>
                  </li>
                );
              })}
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
