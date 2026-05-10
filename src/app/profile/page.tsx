import { TripSummaryCard } from "@/components/trip-summary-card";
import type { DashboardTripForCollapsible } from "@/components/trip-itinerary-collapsible";
import { getVerifiedSession } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { updateProfile } from "@/lib/profiles/actions";
import { createClient } from "@/lib/supabase/server";
import { tripLifecycleBucket, todayIsoUtc } from "@/lib/trips/trip-lifecycle";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

const fieldClass =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-[var(--travel-accent)] focus:ring-1 focus:ring-[var(--travel-accent)]/40";

function decodeErr(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/login?next=/profile");
  }

  const { error: errParam } = await searchParams;
  const errorMessage = decodeErr(errParam);

  const supabase = await createClient();
  const todayIso = todayIsoUtc();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name, avatar_url")
    .eq("id", session.userId)
    .maybeSingle();

  const { data: tripsRaw } = await supabase
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

  const preplanned: DashboardTripForCollapsible[] = [];
  const previous: DashboardTripForCollapsible[] = [];
  for (const t of trips) {
    const life = tripLifecycleBucket(t.start_date, t.end_date, todayIso);
    if (life === "completed") previous.push(t);
    else preplanned.push(t);
  }

  const email = profile?.email ?? session.email;
  const displayName = profile?.display_name?.trim() || email?.split("@")[0] || "Traveler";
  const avatarUrl = profile?.avatar_url?.trim() || null;
  const initials = displayName
    .split(/\s+/)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link
            href="/"
            className="[font-family:var(--font-travel-display)] text-2xl text-[var(--travel-charcoal)]"
          >
            Traveloop
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/trips"
              className="font-medium text-stone-600 underline-offset-4 hover:text-[var(--travel-charcoal)] hover:underline"
            >
              All trips
            </Link>
            <Link
              href="/community"
              className="font-medium text-stone-600 underline-offset-4 hover:text-[var(--travel-charcoal)] hover:underline"
            >
              Community
            </Link>
            <Link
              href="/"
              className="font-medium text-stone-600 underline-offset-4 hover:text-[var(--travel-charcoal)] hover:underline"
            >
              Dashboard
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-stone-300 px-3 py-1.5 font-medium text-stone-700 transition hover:bg-stone-50"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm font-medium uppercase tracking-wide text-stone-500">Profile</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
          Your profile
        </h1>

        {errorMessage ? (
          <p
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,14rem)_1fr]">
          <div className="flex flex-col items-center gap-3 lg:items-start">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={112}
                height={112}
                unoptimized
                className="h-28 w-28 rounded-full border-2 border-stone-200 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-stone-200 bg-[var(--travel-accent)]/40 text-xl font-bold text-stone-900 shadow-sm">
                {initials}
              </div>
            )}
            <p className="text-center text-xs text-stone-500 lg:text-left">Image optional — HTTPS URL below.</p>
          </div>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">User details</h2>
            <p className="mt-1 text-sm text-stone-600">
              Signed in as <span className="font-medium text-stone-900">{email}</span>
            </p>
            <form action={updateProfile} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-stone-600" htmlFor="display_name">
                  Display name
                </label>
                <input
                  id="display_name"
                  name="display_name"
                  maxLength={120}
                  defaultValue={profile?.display_name ?? ""}
                  placeholder="How we greet you on the dashboard"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600" htmlFor="avatar_url">
                  Avatar URL (https only)
                </label>
                <input
                  id="avatar_url"
                  name="avatar_url"
                  type="url"
                  defaultValue={profile?.avatar_url ?? ""}
                  placeholder="https://…"
                  className={fieldClass}
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-[var(--travel-accent)] px-4 py-2 text-sm font-semibold text-stone-900 shadow-sm hover:brightness-[0.97]"
              >
                Save profile
              </button>
            </form>
          </section>
        </div>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-[var(--travel-charcoal)]">Preplanned trips</h2>
          {preplanned.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center text-sm text-stone-500">
              No preplanned trips yet.{" "}
              <Link href="/trips/new" className="font-semibold text-[var(--travel-charcoal)] underline-offset-4 hover:underline">
                Plan new trip
              </Link>
            </div>
          ) : (
            <ul className="mt-4 flex gap-4 overflow-x-auto pb-2 pt-1">
              {preplanned.map((t) => (
                <li key={t.id} className="w-64 shrink-0 sm:w-72">
                  <TripSummaryCard trip={t} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-[var(--travel-charcoal)]">Previous trips</h2>
          <p className="mt-1 text-sm text-stone-500">Completed trips (end date before today).</p>
          {previous.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center text-sm text-stone-500">
              No completed trips yet.
            </div>
          ) : (
            <ul className="mt-4 flex gap-4 overflow-x-auto pb-2 pt-1">
              {previous.map((t) => (
                <li key={t.id} className="w-64 shrink-0 sm:w-72">
                  <TripSummaryCard trip={t} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link
          href="/"
          className="mt-10 inline-block text-sm font-semibold text-[var(--travel-charcoal)] underline-offset-4 hover:underline"
        >
          ← Back to dashboard
        </Link>
      </main>
    </div>
  );
}
