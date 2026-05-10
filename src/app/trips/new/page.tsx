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

      <main className="mx-auto max-w-3xl px-6 py-10">
        <nav className="text-sm text-stone-500">
          <Link href="/" className="hover:text-stone-800">
            Home
          </Link>
          <span className="mx-2 text-stone-400">/</span>
          <Link href="/trips" className="hover:text-stone-800">
            Trips
          </Link>
          <span className="mx-2 text-stone-400">/</span>
          <span className="font-medium text-stone-700">New</span>
        </nav>

        <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-stone-500">
          Create trip
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
          Start a plan
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
          Like a full wireframe, you might expect dates, notes, and a cover
          image here — this build only saves the{" "}
          <strong className="text-stone-800">trip name</strong> to match the
          current database. The other blocks are placeholders for what comes
          next.
        </p>

        {errorMessage ? (
          <p
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <form action={createTrip} className="mt-10 space-y-10">
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Trip name
            </h2>
            <label htmlFor="trip-title" className="mt-3 block text-sm font-medium text-stone-700">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              id="trip-title"
              name="title"
              type="text"
              required
              maxLength={200}
              autoComplete="off"
              placeholder="e.g. Japan spring 2026"
              className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[var(--travel-accent)] focus:ring-2 focus:ring-[var(--travel-accent)]/35"
            />
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            <section className="rounded-2xl border border-dashed border-stone-300 bg-stone-100/60 p-5">
              <h2 className="text-sm font-semibold text-stone-700">
                Start &amp; end dates
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-stone-500">
                Wireframe: date pickers. Not wired yet — needs new columns in
                Supabase.
              </p>
              <p className="mt-4 rounded-md bg-white/80 px-2 py-1.5 text-center text-xs font-medium text-stone-400">
                Planned
              </p>
            </section>
            <section className="rounded-2xl border border-dashed border-stone-300 bg-stone-100/60 p-5">
              <h2 className="text-sm font-semibold text-stone-700">
                Description
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-stone-500">
                Wireframe: long text. Not saved in this milestone.
              </p>
              <p className="mt-4 rounded-md bg-white/80 px-2 py-1.5 text-center text-xs font-medium text-stone-400">
                Planned
              </p>
            </section>
            <section className="rounded-2xl border border-dashed border-stone-300 bg-stone-100/60 p-5">
              <h2 className="text-sm font-semibold text-stone-700">
                Cover photo
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-stone-500">
                Wireframe: optional upload. Storage hook-up comes later.
              </p>
              <p className="mt-4 rounded-md bg-white/80 px-2 py-1.5 text-center text-xs font-medium text-stone-400">
                Planned
              </p>
            </section>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/trips"
              className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--travel-accent)] px-6 py-3 text-sm font-semibold text-stone-900 shadow-sm transition hover:brightness-[0.97]"
            >
              Save trip
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
