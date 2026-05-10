import { NewTripPlaceFields } from "@/app/trips/new/new-trip-place-fields";
import { createTrip } from "@/lib/trips/actions";
import { getVerifiedEmail } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import Link from "next/link";
import { redirect } from "next/navigation";

function decodeErr(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

const SUGGESTION_SLOTS = Array.from({ length: 6 }, (_, i) => i);

export default async function NewTripPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorParam } = await searchParams;
  const errorMessage = decodeErr(errorParam);

  const email = await getVerifiedEmail();
  if (!email) {
    redirect("/login?next=/trips/new");
  }

  const initial = email.split("@")[0]?.charAt(0).toUpperCase() ?? "?";

  const fieldClass =
    "mt-2 w-full rounded-xl border-2 border-stone-800/15 bg-white px-3 py-2.5 text-stone-900 outline-none transition focus:border-[var(--travel-accent)] focus:ring-2 focus:ring-[var(--travel-accent)]/30";

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b-2 border-stone-800/10 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="[font-family:var(--font-travel-display)] text-2xl text-[var(--travel-charcoal)]"
          >
            Traveloop
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-stone-800/20 bg-amber-50 text-sm font-bold text-stone-800 shadow-sm"
              title={email}
            >
              {initial}
            </span>
            <form action={signOut} className="hidden sm:block">
              <button
                type="submit"
                className="text-xs font-medium text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-[1.75rem] border-2 border-stone-800/15 bg-white p-5 shadow-[5px_5px_0_0_rgb(214,211,209)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Screen 4 · New trip
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--travel-charcoal)] sm:text-3xl">
            Plan a new trip
          </h1>

          {errorMessage ? (
            <p
              className="mt-5 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <form action={createTrip} className="mt-8 space-y-6">
            <div>
              <label
                htmlFor="start_date"
                className="block text-sm font-semibold text-stone-800"
              >
                Start date
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                required
                className={fieldClass}
              />
            </div>

            <div>
              <p className="block text-sm font-semibold text-stone-800">Destination</p>
              <p className="mt-1 text-xs text-stone-600">
                Same country + city search as Build itinerary (Photon). Your first stop inherits these
                coordinates.
              </p>
              <div className="mt-3">
                <NewTripPlaceFields />
              </div>
            </div>

            <div>
              <label
                htmlFor="end_date"
                className="block text-sm font-semibold text-stone-800"
              >
                End date
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                required
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Link
                href="/trips"
                className="inline-flex items-center justify-center rounded-xl border-2 border-stone-800/15 bg-stone-50 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl border-2 border-stone-800/20 bg-[var(--travel-accent)] px-6 py-2.5 text-sm font-bold text-stone-900 shadow-[3px_3px_0_0_rgb(41,37,36)] transition hover:brightness-[0.98] active:translate-x-px active:translate-y-px active:shadow-none"
              >
                Save trip
              </button>
            </div>
          </form>

          <section className="mt-12 border-t-2 border-dashed border-stone-300 pt-10">
            <h2 className="text-base font-bold leading-snug text-[var(--travel-charcoal)] sm:text-lg">
              Suggestions for places to visit / activities to perform
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SUGGESTION_SLOTS.map((i) => (
                <div
                  key={i}
                  className="aspect-[4/3] rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50/80"
                  aria-hidden
                />
              ))}
            </div>
          </section>
        </div>

        <p className="mt-6 text-center text-sm text-stone-500">
          <Link href="/trips" className="font-medium text-stone-700 hover:underline">
            ← Back to all trips
          </Link>
        </p>

        <form action={signOut} className="mt-4 text-center sm:hidden">
          <button
            type="submit"
            className="text-xs font-medium text-stone-500 underline-offset-2 hover:text-stone-800"
          >
            Sign out
          </button>
        </form>
      </main>
    </div>
  );
}
