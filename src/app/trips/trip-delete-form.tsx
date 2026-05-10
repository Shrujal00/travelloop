"use client";

import { deleteTrip } from "@/lib/trips/actions";

type Props = {
  tripId: string;
  /** compact list row vs detail page */
  variant?: "inline" | "danger";
};

export function TripDeleteForm({ tripId, variant = "inline" }: Props) {
  const btnClass =
    variant === "danger"
      ? "rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
      : "rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 transition hover:border-red-200 hover:text-red-700";

  return (
    <form
      action={deleteTrip}
      onSubmit={(e) => {
        if (
          !confirm(
            "Delete this trip? Stops and activities will be removed. This cannot be undone."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="trip_id" value={tripId} />
      <button type="submit" className={btnClass}>
        Delete
      </button>
    </form>
  );
}
