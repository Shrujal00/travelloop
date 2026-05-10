import { getVerifiedEmail } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type TripRow = { id: string; title: string; created_at: string };

const RECOMMENDED = [
  {
    city: "Kyoto",
    blurb: "Temples, gardens, and slow days between trains.",
    tag: "Culture",
  },
  {
    city: "Lisbon",
    blurb: "Hills, tiles, and Atlantic sunsets without breaking the bank.",
    tag: "Coastal",
  },
  {
    city: "Vancouver",
    blurb: "City, sea, and mountains in one long weekend.",
    tag: "Outdoors",
  },
] as const;

export default async function Home() {
  const email = await getVerifiedEmail();

  let recentTrips: TripRow[] = [];
  if (email) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("trips")
        .select("id, title, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      recentTrips = (data ?? []) as TripRow[];
    } catch {
      recentTrips = [];
    }
  }

  const welcomeName = email?.split("@")[0] ?? "traveler";

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="[font-family:var(--font-travel-display)] text-2xl text-[var(--travel-charcoal)]"
          >
            Traveloop
          </Link>
          <nav className="flex items-center gap-3 text-sm sm:gap-4">
            {email ? (
              <>
                <Link
                  href="/trips"
                  className="font-medium text-stone-600 underline-offset-4 hover:text-[var(--travel-charcoal)] hover:underline"
                >
                  All trips
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="rounded-lg border border-stone-300 px-3 py-1.5 font-medium text-stone-700 transition hover:bg-stone-50"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-[var(--travel-accent)] px-4 py-2 font-semibold text-stone-900 hover:brightness-95"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      {!email ? (
        <main className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
            Personalized travel planning made easy
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)] sm:text-4xl">
            Plan multi-city trips with confidence
          </h1>
          <p className="mt-6 max-w-md text-stone-600">
            Sign in to save itineraries, share plans, and track budgets.
          </p>
          <Link
            href="/login"
            className="mt-10 inline-flex rounded-lg bg-[var(--travel-accent)] px-6 py-3 text-base font-semibold text-stone-900 shadow-sm hover:brightness-95"
          >
            Continue to login
          </Link>
        </main>
      ) : (
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:py-12">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
                Dashboard
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)] sm:text-4xl">
                Welcome back, {welcomeName}
              </h1>
              <p className="mt-2 max-w-2xl text-stone-600">
                Pick up where you left off, or start a new route. Upcoming legs
                and budgets will show here as you build them out.
              </p>
            </div>
            <Link
              href="/trips#new-trip"
              className="mt-4 inline-flex shrink-0 items-center justify-center rounded-lg bg-[var(--travel-accent)] px-5 py-3 text-sm font-semibold text-stone-900 shadow-sm transition hover:brightness-[0.97] sm:mt-0"
            >
              Plan new trip
            </Link>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            <section className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-[var(--travel-charcoal)]">
                Recent trips
              </h2>
              {recentTrips.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center text-stone-500">
                  No trips yet. Use{" "}
                  <strong className="text-stone-700">Plan new trip</strong> to
                  add your first one.
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {recentTrips.map((t) => (
                    <li key={t.id}>
                      <Link
                        href="/trips"
                        className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-stone-300 hover:shadow"
                      >
                        <span className="min-w-0 truncate font-medium text-stone-800">
                          {t.title}
                        </span>
                        <time
                          dateTime={t.created_at}
                          className="shrink-0 text-xs text-stone-500"
                        >
                          {new Date(t.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </time>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <aside className="flex flex-col gap-8">
              <section>
                <h2 className="text-lg font-semibold text-[var(--travel-charcoal)]">
                  Budget highlights
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Estimates roll up once you add stops and nightly rates.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                      This month (sample)
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-[var(--travel-charcoal)]">
                      —
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      Connect trips to see totals
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                      Next trip (sample)
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-[var(--travel-charcoal)]">
                      —
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      Per-diem preview coming soon
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-[var(--travel-charcoal)]">
                  Recommended destinations
                </h2>
                <ul className="mt-4 space-y-3">
                  {RECOMMENDED.map((d) => (
                    <li
                      key={d.city}
                      className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-stone-800">{d.city}</p>
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                          {d.tag}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-stone-600">
                        {d.blurb}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
        </main>
      )}
    </div>
  );
}
