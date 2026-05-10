import { getVerifiedEmail } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TripsPage() {
  const email = await getVerifiedEmail();
  if (!email) {
    redirect("/login?next=/trips");
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
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
          Your trips
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
          Itineraries
        </h1>
        <p className="mt-3 max-w-xl text-stone-600">
          This is where multi-city stops, dates, and budgets will live. Create
          your first trip in a later milestone.
        </p>
        <div className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white/80 px-6 py-16 text-center text-stone-500">
          No trips yet — planner UI coming soon.
        </div>
        <Link
          href="/"
          className="mt-8 inline-block text-sm font-semibold text-[var(--travel-charcoal)] underline-offset-4 hover:underline"
        >
          ← Back to home
        </Link>
      </main>
    </div>
  );
}
