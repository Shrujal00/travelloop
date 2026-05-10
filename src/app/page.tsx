import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import Link from "next/link";

export default async function Home() {
  let email: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (claims && typeof claims.email === "string") {
      email = claims.email;
    }
  } catch {
    /* Missing env during local setup */
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="[font-family:var(--font-travel-display)] text-2xl text-[var(--travel-charcoal)]"
          >
            Traveloop
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {email ? (
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-lg border border-stone-300 px-3 py-1.5 font-medium text-stone-700 transition hover:bg-stone-50"
                >
                  Sign out
                </button>
              </form>
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
      <main className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
          Personalized travel planning made easy
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)] sm:text-4xl">
          Plan multi-city trips with confidence
        </h1>
        {email ? (
          <p className="mt-6 max-w-md text-stone-600">
            Signed in as <span className="font-medium text-stone-800">{email}</span>.
            Trip planning UI comes next.
          </p>
        ) : (
          <p className="mt-6 max-w-md text-stone-600">
            Sign in to save itineraries, share plans, and track budgets.
          </p>
        )}
        {!email ? (
          <Link
            href="/login"
            className="mt-10 inline-flex rounded-lg bg-[var(--travel-accent)] px-6 py-3 text-base font-semibold text-stone-900 shadow-sm hover:brightness-95"
          >
            Continue to login
          </Link>
        ) : null}
      </main>
    </div>
  );
}
