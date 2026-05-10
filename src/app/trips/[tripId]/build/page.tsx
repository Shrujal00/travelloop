import { isUuidTripParam } from "@/lib/trips/trip-id";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function TripBuildPlaceholderPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  if (!isUuidTripParam(tripId)) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
        Itinerary builder
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
        Coming next
      </h1>
      <p className="mt-3 max-w-xl text-stone-600">
        Add stops, reorder cities, and attach activities per stop (Phase B). This placeholder route
        is wired so navigation and deploy previews stay consistent.
      </p>
      <Link
        href={`/trips/${tripId}`}
        className="mt-8 inline-block text-sm font-semibold text-[var(--travel-charcoal)] underline-offset-4 hover:underline"
      >
        ← Back to trip overview
      </Link>
    </main>
  );
}
