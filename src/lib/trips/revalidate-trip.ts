import { revalidatePath } from "next/cache";

export function revalidateTripPaths(
  tripId: string,
  stopId?: string | null,
  publicSlug?: string | null
) {
  revalidatePath("/trips");
  revalidatePath("/trips/new");
  revalidatePath("/");
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/edit`);
  revalidatePath(`/trips/${tripId}/build`);
  revalidatePath(`/trips/${tripId}/itinerary`);
  revalidatePath(`/trips/${tripId}/budget`);
  revalidatePath(`/trips/${tripId}/packing`);
  if (stopId) {
    revalidatePath(`/trips/${tripId}/stops/${stopId}/discover`);
  }
  if (publicSlug) {
    revalidatePath(`/p/${publicSlug}`);
  }
}
