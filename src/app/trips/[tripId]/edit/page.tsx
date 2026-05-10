import { updateTrip } from "@/lib/trips/actions";
import { getVerifiedSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isUuidTripParam } from "@/lib/trips/trip-id";
import Link from "next/link";
import { notFound } from "next/navigation";

function decodeErr(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function EditTripPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { tripId } = await params;
  const { error: errParam } = await searchParams;
  const errorMessage = decodeErr(errParam);

  if (!isUuidTripParam(tripId)) {
    notFound();
  }

  const session = await getVerifiedSession();
  if (!session) {
    notFound();
  }

  const supabase = await createClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .select("id, title, place, start_date, end_date")
    .eq("id", tripId)
    .maybeSingle();

  if (error || !trip) {
    notFound();
  }

  const place = trip.place?.trim() || trip.title;
  const fieldClass =
    "mt-2 w-full rounded-xl border-2 border-stone-800/15 bg-white px-3 py-2.5 text-stone-900 outline-none transition focus:border-[var(--travel-accent)] focus:ring-2 focus:ring-[var(--travel-accent)]/30";

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
        Edit trip
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
        Update details
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        Changes sync to your primary stop for itinerary planning.
      </p>

      {errorMessage ? (
        <p
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <form action={updateTrip} className="mt-8 space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="trip_id" value={tripId} />

        <div>
          <label htmlFor="start_date" className="block text-sm font-semibold text-stone-800">
            Start date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            defaultValue={trip.start_date ?? ""}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="place" className="block text-sm font-semibold text-stone-800">
            Place (destination)
          </label>
          <input
            id="place"
            name="place"
            type="text"
            required
            maxLength={200}
            defaultValue={place}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-semibold text-stone-800">
            End date
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            required
            defaultValue={trip.end_date ?? ""}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={`/trips/${tripId}`}
            className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-stone-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--travel-accent)] px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm transition hover:brightness-[0.97]"
          >
            Save changes
          </button>
        </div>
      </form>
    </main>
  );
}
