"use server";

import { getVerifiedSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseGeocoderFields } from "@/lib/trips/place-form-parse";
import { revalidateTripPaths } from "@/lib/trips/revalidate-trip";

function parseISODate(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  return t;
}

function parseTripId(raw: unknown): string | null {
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

export async function createTrip(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/login?next=/trips/new");
  }

  const placeRaw = formData.get("place");
  const place = typeof placeRaw === "string" ? placeRaw.trim().slice(0, 200) : "";
  if (!place) {
    redirect(
      "/trips/new?error=" + encodeURIComponent("Select a place (destination).")
    );
  }

  const start = parseISODate(formData.get("start_date"));
  const end = parseISODate(formData.get("end_date"));
  if (!start || !end) {
    redirect(
      "/trips/new?error=" + encodeURIComponent("Start date and end date are required.")
    );
  }
  if (end < start) {
    redirect(
      "/trips/new?error=" + encodeURIComponent("End date must be on or after start date.")
    );
  }

  const title = place.slice(0, 200);

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("trips")
    .insert({
      user_id: session.userId,
      title,
      place,
      start_date: start,
      end_date: end,
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    redirect("/trips/new?error=" + encodeURIComponent(error?.message ?? "Could not create trip."));
  }

  const geo = parseGeocoderFields(formData);

  const { error: stopError } = await supabase.from("trip_stops").insert({
    trip_id: inserted.id,
    sort_order: 0,
    city_name: title,
    start_date: start,
    end_date: end,
    country: geo.country,
    region: geo.region,
    lat: geo.lat,
    lng: geo.lng,
    external_place_id: geo.external_place_id,
  });

  if (stopError) {
    await supabase.from("trips").delete().eq("id", inserted.id).eq("user_id", session.userId);
    redirect(
      "/trips/new?error=" +
        encodeURIComponent(
          stopError.message.includes("trip_stops")
            ? "Run the trip_stops_activities migration in Supabase, then try again."
            : stopError.message
        )
    );
  }

  revalidateTripPaths(inserted.id);
  redirect("/trips");
}

export async function updateTrip(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/login?next=/trips");
  }

  const tripId = parseTripId(formData.get("trip_id"));
  if (!tripId) {
    redirect("/trips?error=" + encodeURIComponent("Invalid trip."));
  }

  const placeRaw = formData.get("place");
  const place = typeof placeRaw === "string" ? placeRaw.trim().slice(0, 200) : "";
  if (!place) {
    redirect(
      `/trips/${tripId}/edit?error=` + encodeURIComponent("Place (destination) is required.")
    );
  }

  const start = parseISODate(formData.get("start_date"));
  const end = parseISODate(formData.get("end_date"));
  if (!start || !end) {
    redirect(
      `/trips/${tripId}/edit?error=` +
        encodeURIComponent("Start date and end date are required.")
    );
  }
  if (end < start) {
    redirect(
      `/trips/${tripId}/edit?error=` +
        encodeURIComponent("End date must be on or after start date.")
    );
  }

  const title = place.slice(0, 200);
  const supabase = await createClient();

  const { error: tripErr } = await supabase
    .from("trips")
    .update({
      title,
      place,
      start_date: start,
      end_date: end,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tripId)
    .eq("user_id", session.userId);

  if (tripErr) {
    redirect(`/trips/${tripId}/edit?error=` + encodeURIComponent(tripErr.message));
  }

  const { data: primaryStop } = await supabase
    .from("trip_stops")
    .select("id")
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (primaryStop?.id) {
    const geo = parseGeocoderFields(formData);
    await supabase
      .from("trip_stops")
      .update({
        city_name: title,
        start_date: start,
        end_date: end,
        country: geo.country,
        region: geo.region,
        lat: geo.lat,
        lng: geo.lng,
        external_place_id: geo.external_place_id,
      })
      .eq("id", primaryStop.id);
  }

  revalidateTripPaths(tripId);
  redirect(`/trips/${tripId}`);
}

export async function deleteTrip(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/login?next=/trips");
  }

  const tripId = parseTripId(formData.get("trip_id"));
  if (!tripId) {
    redirect("/trips?error=" + encodeURIComponent("Invalid trip."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("trips").delete().eq("id", tripId).eq("user_id", session.userId);

  if (error) {
    redirect("/trips?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/trips");
  revalidatePath("/trips/new");
  revalidatePath("/");
  redirect("/trips");
}
