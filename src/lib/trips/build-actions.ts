"use server";

import { getVerifiedSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseGeocoderFields } from "@/lib/trips/place-form-parse";
import { redirect } from "next/navigation";
import { revalidateTripPaths } from "@/lib/trips/revalidate-trip";

function parseUuid(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const id = raw.trim();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id
    )
  ) {
    return null;
  }
  return id;
}

function parseISODate(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  return t;
}

function parseOptionalCost(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

function parseOptionalDateTime(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

async function loadOwnedTrip(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tripId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("trips")
    .select("id, start_date, end_date")
    .eq("id", tripId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return { ok: false as const, message: "Trip not found." };
  return { ok: true as const, trip: data };
}

function validateStopAgainstTrip(
  tripStart: string | null,
  tripEnd: string | null,
  stopStart: string | null,
  stopEnd: string | null
): string | null {
  if (!tripStart || !tripEnd) {
    return "Set the trip start and end dates on Edit trip before adding stops.";
  }
  if (!stopStart || !stopEnd) {
    return "Stop start and end dates are required.";
  }
  if (stopEnd < stopStart) {
    return "Stop end date must be on or after the stop start date.";
  }
  if (stopStart < tripStart) {
    return "Stop dates must fall within the trip window (start is too early).";
  }
  if (stopEnd > tripEnd) {
    return "Stop dates must fall within the trip window (end is too late).";
  }
  return null;
}

export async function addTripStop(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/login?next=/trips");
  }

  const tripId = parseUuid(formData.get("trip_id"));
  if (!tripId) {
    redirect("/trips?error=" + encodeURIComponent("Invalid trip."));
  }

  const cityRaw = formData.get("city_name");
  const city_name =
    typeof cityRaw === "string" ? cityRaw.trim().slice(0, 200) : "";
  if (!city_name) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent("City name is required."));
  }

  const stopStart = parseISODate(formData.get("start_date"));
  const stopEnd = parseISODate(formData.get("end_date"));

  const supabase = await createClient();
  const owned = await loadOwnedTrip(supabase, tripId, session.userId);
  if (!owned.ok) {
    redirect("/trips?error=" + encodeURIComponent(owned.message));
  }

  const rangeErr = validateStopAgainstTrip(
    owned.trip.start_date,
    owned.trip.end_date,
    stopStart,
    stopEnd
  );
  if (rangeErr) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent(rangeErr));
  }

  const { data: rows } = await supabase
    .from("trip_stops")
    .select("sort_order")
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (rows?.[0]?.sort_order ?? -1) + 1;

  const geo = parseGeocoderFields(formData);

  const { error } = await supabase.from("trip_stops").insert({
    trip_id: tripId,
    sort_order: nextOrder,
    city_name,
    start_date: stopStart,
    end_date: stopEnd,
    country: geo.country,
    region: geo.region,
    lat: geo.lat,
    lng: geo.lng,
    external_place_id: geo.external_place_id,
  });

  if (error) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent(error.message));
  }

  revalidateTripPaths(tripId);
  redirect(`/trips/${tripId}/build`);
}

export async function updateTripStop(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/login?next=/trips");
  }

  const tripId = parseUuid(formData.get("trip_id"));
  const stopId = parseUuid(formData.get("stop_id"));
  if (!tripId || !stopId) {
    redirect("/trips?error=" + encodeURIComponent("Invalid trip or stop."));
  }

  const cityRaw = formData.get("city_name");
  const city_name =
    typeof cityRaw === "string" ? cityRaw.trim().slice(0, 200) : "";
  if (!city_name) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent("City name is required."));
  }

  const stopStart = parseISODate(formData.get("start_date"));
  const stopEnd = parseISODate(formData.get("end_date"));

  const supabase = await createClient();
  const owned = await loadOwnedTrip(supabase, tripId, session.userId);
  if (!owned.ok) {
    redirect("/trips?error=" + encodeURIComponent(owned.message));
  }

  const rangeErr = validateStopAgainstTrip(
    owned.trip.start_date,
    owned.trip.end_date,
    stopStart,
    stopEnd
  );
  if (rangeErr) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent(rangeErr));
  }

  const geo = parseGeocoderFields(formData);

  const { error } = await supabase
    .from("trip_stops")
    .update({
      city_name,
      start_date: stopStart,
      end_date: stopEnd,
      country: geo.country,
      region: geo.region,
      lat: geo.lat,
      lng: geo.lng,
      external_place_id: geo.external_place_id,
    })
    .eq("id", stopId)
    .eq("trip_id", tripId);

  if (error) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent(error.message));
  }

  revalidateTripPaths(tripId);
  redirect(`/trips/${tripId}/build`);
}

export async function deleteTripStop(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/login?next=/trips");
  }

  const tripId = parseUuid(formData.get("trip_id"));
  const stopId = parseUuid(formData.get("stop_id"));
  if (!tripId || !stopId) {
    redirect("/trips?error=" + encodeURIComponent("Invalid trip or stop."));
  }

  const supabase = await createClient();
  const owned = await loadOwnedTrip(supabase, tripId, session.userId);
  if (!owned.ok) {
    redirect("/trips?error=" + encodeURIComponent(owned.message));
  }

  const { count, error: countErr } = await supabase
    .from("trip_stops")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", tripId);

  if (countErr) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent(countErr.message));
  }
  if (count !== null && count <= 1) {
    redirect(
      `/trips/${tripId}/build?error=` +
        encodeURIComponent("Keep at least one stop on the itinerary.")
    );
  }

  const { error } = await supabase.from("trip_stops").delete().eq("id", stopId).eq("trip_id", tripId);

  if (error) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent(error.message));
  }

  revalidateTripPaths(tripId);
  redirect(`/trips/${tripId}/build`);
}

export async function reorderTripStops(
  tripId: string,
  orderedStopIds: string[]
): Promise<{ error?: string }> {
  const session = await getVerifiedSession();
  if (!session) {
    return { error: "Not signed in." };
  }

  const tid = parseUuid(tripId);
  if (!tid) {
    return { error: "Invalid trip." };
  }

  const supabase = await createClient();
  const owned = await loadOwnedTrip(supabase, tid, session.userId);
  if (!owned.ok) {
    return { error: owned.message };
  }

  const { data: existing, error: listErr } = await supabase
    .from("trip_stops")
    .select("id")
    .eq("trip_id", tid);

  if (listErr) {
    return { error: listErr.message };
  }

  const existingIds = new Set((existing ?? []).map((r) => r.id));
  if (orderedStopIds.length !== existingIds.size) {
    return { error: "Stop order does not match saved stops." };
  }
  for (const id of orderedStopIds) {
    if (!existingIds.has(id)) {
      return { error: "Unknown stop in order payload." };
    }
  }

  for (let i = 0; i < orderedStopIds.length; i++) {
    const { error } = await supabase
      .from("trip_stops")
      .update({ sort_order: i })
      .eq("id", orderedStopIds[i])
      .eq("trip_id", tid);

    if (error) {
      return { error: error.message };
    }
  }

  revalidateTripPaths(tid);
  return {};
}

export async function addTripActivity(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/login?next=/trips");
  }

  const tripId = parseUuid(formData.get("trip_id"));
  const stopId = parseUuid(formData.get("stop_id"));
  if (!tripId || !stopId) {
    redirect("/trips?error=" + encodeURIComponent("Invalid trip or stop."));
  }

  const titleRaw = formData.get("title");
  const title = typeof titleRaw === "string" ? titleRaw.trim().slice(0, 300) : "";
  if (!title) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent("Activity title is required."));
  }

  const starts_at = parseOptionalDateTime(formData.get("starts_at"));
  const cost = parseOptionalCost(formData.get("cost"));
  const catRaw = formData.get("category");
  const category =
    typeof catRaw === "string" && catRaw.trim() ? catRaw.trim().slice(0, 120) : null;

  const supabase = await createClient();
  const owned = await loadOwnedTrip(supabase, tripId, session.userId);
  if (!owned.ok) {
    redirect("/trips?error=" + encodeURIComponent(owned.message));
  }

  const { data: stopRow, error: stopErr } = await supabase
    .from("trip_stops")
    .select("id")
    .eq("id", stopId)
    .eq("trip_id", tripId)
    .maybeSingle();

  if (stopErr || !stopRow) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent("Stop not found for this trip."));
  }

  const { error } = await supabase.from("trip_activities").insert({
    trip_stop_id: stopId,
    title,
    starts_at,
    cost,
    category,
  });

  if (error) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent(error.message));
  }

  revalidateTripPaths(tripId, stopId);
  redirect(`/trips/${tripId}/build`);
}

export async function addSuggestedActivity(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/login?next=/trips");
  }

  const tripId = parseUuid(formData.get("trip_id"));
  const stopId = parseUuid(formData.get("stop_id"));
  if (!tripId || !stopId) {
    redirect("/trips?error=" + encodeURIComponent("Invalid trip or stop."));
  }

  const titleRaw = formData.get("title");
  const title = typeof titleRaw === "string" ? titleRaw.trim().slice(0, 300) : "";
  if (!title) {
    redirect(
      `/trips/${tripId}/stops/${stopId}/discover?error=` +
        encodeURIComponent("Activity title is required.")
    );
  }

  const catRaw = formData.get("category");
  const category =
    typeof catRaw === "string" && catRaw.trim() ? catRaw.trim().slice(0, 120) : null;

  const extRaw = formData.get("external_ref");
  const external_ref =
    typeof extRaw === "string" && extRaw.trim() ? extRaw.trim().slice(0, 120) : null;

  const supabase = await createClient();
  const owned = await loadOwnedTrip(supabase, tripId, session.userId);
  if (!owned.ok) {
    redirect("/trips?error=" + encodeURIComponent(owned.message));
  }

  const { data: stopRow, error: stopErr } = await supabase
    .from("trip_stops")
    .select("id")
    .eq("id", stopId)
    .eq("trip_id", tripId)
    .maybeSingle();

  if (stopErr || !stopRow) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent("Stop not found for this trip."));
  }

  if (external_ref) {
    const { data: dup } = await supabase
      .from("trip_activities")
      .select("id")
      .eq("trip_stop_id", stopId)
      .eq("external_ref", external_ref)
      .maybeSingle();

    if (dup) {
      redirect(
        `/trips/${tripId}/stops/${stopId}/discover?error=` +
          encodeURIComponent("This place is already on your itinerary for this stop.")
      );
    }
  }

  const { error } = await supabase.from("trip_activities").insert({
    trip_stop_id: stopId,
    title,
    starts_at: null,
    cost: null,
    category,
    external_ref,
  });

  if (error) {
    redirect(
      `/trips/${tripId}/stops/${stopId}/discover?error=` + encodeURIComponent(error.message)
    );
  }

  revalidateTripPaths(tripId, stopId);
  redirect(`/trips/${tripId}/build`);
}

export async function updateTripActivity(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/login?next=/trips");
  }

  const tripId = parseUuid(formData.get("trip_id"));
  const activityId = parseUuid(formData.get("activity_id"));
  if (!tripId || !activityId) {
    redirect("/trips?error=" + encodeURIComponent("Invalid trip or activity."));
  }

  const titleRaw = formData.get("title");
  const title = typeof titleRaw === "string" ? titleRaw.trim().slice(0, 300) : "";
  if (!title) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent("Activity title is required."));
  }

  const starts_at = parseOptionalDateTime(formData.get("starts_at"));
  const cost = parseOptionalCost(formData.get("cost"));
  const catRaw = formData.get("category");
  const category =
    typeof catRaw === "string" && catRaw.trim() ? catRaw.trim().slice(0, 120) : null;

  const supabase = await createClient();
  const owned = await loadOwnedTrip(supabase, tripId, session.userId);
  if (!owned.ok) {
    redirect("/trips?error=" + encodeURIComponent(owned.message));
  }

  const { data: act, error: actErr } = await supabase
    .from("trip_activities")
    .select("id, trip_stop_id")
    .eq("id", activityId)
    .maybeSingle();

  if (actErr || !act) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent("Activity not found."));
  }

  const { data: stopRow } = await supabase
    .from("trip_stops")
    .select("trip_id")
    .eq("id", act.trip_stop_id)
    .maybeSingle();

  if (stopRow?.trip_id !== tripId) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent("Activity does not belong to this trip."));
  }

  const { error } = await supabase
    .from("trip_activities")
    .update({ title, starts_at, cost, category })
    .eq("id", activityId);

  if (error) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent(error.message));
  }

  revalidateTripPaths(tripId);
  redirect(`/trips/${tripId}/build`);
}

export async function deleteTripActivity(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/login?next=/trips");
  }

  const tripId = parseUuid(formData.get("trip_id"));
  const activityId = parseUuid(formData.get("activity_id"));
  if (!tripId || !activityId) {
    redirect("/trips?error=" + encodeURIComponent("Invalid trip or activity."));
  }

  const supabase = await createClient();
  const owned = await loadOwnedTrip(supabase, tripId, session.userId);
  if (!owned.ok) {
    redirect("/trips?error=" + encodeURIComponent(owned.message));
  }

  const { data: act, error: actErr } = await supabase
    .from("trip_activities")
    .select("id, trip_stop_id")
    .eq("id", activityId)
    .maybeSingle();

  if (actErr || !act) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent("Activity not found."));
  }

  const { data: stopRow } = await supabase
    .from("trip_stops")
    .select("trip_id")
    .eq("id", act.trip_stop_id)
    .maybeSingle();

  if (stopRow?.trip_id !== tripId) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent("Activity does not belong to this trip."));
  }

  const { error } = await supabase.from("trip_activities").delete().eq("id", activityId);

  if (error) {
    redirect(`/trips/${tripId}/build?error=` + encodeURIComponent(error.message));
  }

  revalidateTripPaths(tripId);
  redirect(`/trips/${tripId}/build`);
}
