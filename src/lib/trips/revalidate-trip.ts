import { revalidatePath } from "next/cache";

export function revalidateTripPaths(tripId: string) {
  revalidatePath("/trips");
  revalidatePath("/trips/new");
  revalidatePath("/");
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}/edit`);
  revalidatePath(`/trips/${tripId}/build`);
  revalidatePath(`/trips/${tripId}/itinerary`);
}
