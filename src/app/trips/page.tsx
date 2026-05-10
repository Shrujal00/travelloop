import { createTrip } from "@/lib/trips/actions";
import { getVerifiedEmail } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import Link from "next/link";
import { redirect } from "next/navigation";

type TripRow = {
  id: string;
  title: string;
  created_at: string;
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
    .select("id, title, created_at")
    .order("created_at", { ascending: false });

  const trips = (tripsRaw ?? []) as TripRow[];
  const listFailed = Boolean(listError);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
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
        <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
          Your trips
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
          Itineraries
        </h1>
        <p className="mt-3 max-w-xl text-stone-600">
          Name a trip to get started. Stops, dates, and budgets will attach here
          in a later milestone.
        </p>

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
            Could not load trips. Run the <code className="rounded bg-amber-100/80 px-1">trips</code>{" "}
            migration in Supabase (see README), then refresh.
          </p>
        ) : null}

        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--travel-charcoal)]">
            New trip
          </h2>
          <form action={createTrip} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="trip-title" className="sr-only">
                Trip name
              </label>
              <input
                id="trip-title"
                name="title"
                type="text"
                required
                maxLength={200}
                placeholder="e.g. Japan spring 2026"
                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 shadow-sm outline-none ring-[var(--travel-accent)] focus:border-[var(--travel-accent)] focus:ring-2"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-[var(--travel-accent)] px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm hover:brightness-95"
            >
              Create trip
            </button>
          </form>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-[var(--travel-charcoal)]">
            Your list
          </h2>
          {!listFailed && trips.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white/80 px-6 py-14 text-center text-stone-500">
              No trips yet — add one above.
            </div>
          ) : null}
          {!listFailed && trips.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {trips.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
                >
                  <span className="min-w-0 truncate font-medium text-stone-800">
                    {t.title}
                  </span>
                  <time
                    dateTime={t.created_at}
                    className="shrink-0 text-xs text-stone-500"
                  >
                    {new Date(t.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
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
