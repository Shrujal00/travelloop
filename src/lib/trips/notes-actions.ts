"use server";

import { getVerifiedSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { revalidateTripPaths } from "@/lib/trips/revalidate-trip";
import { redirect } from "next/navigation";

function parseTripId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const id = raw.trim();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  ) {
    return null;
  }
  return id;
}

function parseNoteId(raw: unknown): string | null {
  return parseTripId(raw);
}

function parseOptionalUuid(raw: unknown): string | null {
  if (raw === "" || raw == null) return null;
  return parseTripId(raw);
}

function parseNoteDate(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  return t;
}

function parseBody(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  return s.slice(0, 10000);
}

async function verifyStopBelongsToTrip(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tripId: string,
  stopId: string | null
): Promise<boolean> {
  if (!stopId) return true;
  const { data } = await supabase
    .from("trip_stops")
    .select("id")
    .eq("id", stopId)
    .eq("trip_id", tripId)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function createTripNote(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) redirect("/login");

  const tripId = parseTripId(formData.get("trip_id"));
  if (!tripId) redirect("/trips?error=" + encodeURIComponent("Invalid trip."));

  const body = parseBody(formData.get("body"));
  if (!body) {
    redirect(`/trips/${tripId}/notes?error=` + encodeURIComponent("Note cannot be empty."));
  }

  const trip_stop_id = parseOptionalUuid(formData.get("trip_stop_id"));
  const note_date = parseNoteDate(formData.get("note_date"));

  const supabase = await createClient();

  const okStop = await verifyStopBelongsToTrip(supabase, tripId, trip_stop_id);
  if (!okStop) {
    redirect(`/trips/${tripId}/notes?error=` + encodeURIComponent("Invalid stop for this trip."));
  }

  const { error } = await supabase.from("trip_notes").insert({
    trip_id: tripId,
    trip_stop_id,
    note_date,
    body,
  });

  if (error) {
    redirect(`/trips/${tripId}/notes?error=` + encodeURIComponent(error.message));
  }

  revalidateTripPaths(tripId);
  redirect(`/trips/${tripId}/notes`);
}

export async function updateTripNote(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) redirect("/login");

  const tripId = parseTripId(formData.get("trip_id"));
  const noteId = parseNoteId(formData.get("note_id"));
  if (!tripId || !noteId) redirect("/trips");

  const body = parseBody(formData.get("body"));
  if (!body) {
    redirect(`/trips/${tripId}/notes?error=` + encodeURIComponent("Note cannot be empty."));
  }

  const trip_stop_id = parseOptionalUuid(formData.get("trip_stop_id"));
  const note_date = parseNoteDate(formData.get("note_date"));

  const supabase = await createClient();
  const okStop = await verifyStopBelongsToTrip(supabase, tripId, trip_stop_id);
  if (!okStop) {
    redirect(`/trips/${tripId}/notes?error=` + encodeURIComponent("Invalid stop for this trip."));
  }

  const { error } = await supabase
    .from("trip_notes")
    .update({
      body,
      trip_stop_id,
      note_date,
    })
    .eq("id", noteId)
    .eq("trip_id", tripId);

  if (error) {
    redirect(`/trips/${tripId}/notes?error=` + encodeURIComponent(error.message));
  }

  revalidateTripPaths(tripId);
  redirect(`/trips/${tripId}/notes`);
}

export async function deleteTripNote(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) redirect("/login");

  const tripId = parseTripId(formData.get("trip_id"));
  const noteId = parseNoteId(formData.get("note_id"));
  if (!tripId || !noteId) redirect("/trips");

  const supabase = await createClient();
  const { error } = await supabase
    .from("trip_notes")
    .delete()
    .eq("id", noteId)
    .eq("trip_id", tripId);

  if (error) {
    redirect(`/trips/${tripId}/notes?error=` + encodeURIComponent(error.message));
  }

  revalidateTripPaths(tripId);
  redirect(`/trips/${tripId}/notes`);
}
