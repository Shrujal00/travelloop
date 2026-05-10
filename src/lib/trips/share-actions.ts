"use server";

import { getVerifiedSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { revalidateTripPaths } from "@/lib/trips/revalidate-trip";
import { newShareSlug } from "@/lib/trips/share-slug";
import { redirect } from "next/navigation";

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

function parseSlug(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase();
  if (!/^[a-z0-9]{12,40}$/.test(s)) return null;
  return s;
}

async function fetchTripSlug(supabase: Awaited<ReturnType<typeof createClient>>, tripId: string, userId: string) {
  const { data } = await supabase
    .from("trips")
    .select("public_slug")
    .eq("id", tripId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.public_slug as string | null | undefined;
}

/** Hidden field `share_return=dashboard` redirects to `/trips?…` (trip board); otherwise trip overview. */
function redirectAfterShareAction(formData: FormData, tripId: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const suffix = qs ? `?${qs}` : "";
  if (formData.get("share_return") === "dashboard") {
    redirect(`/trips${suffix}`);
  }
  redirect(`/trips/${tripId}${suffix}`);
}

export async function enablePublicTripSharing(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) redirect("/login");

  const tripId = parseTripId(formData.get("trip_id"));
  if (!tripId) redirect("/trips?error=" + encodeURIComponent("Invalid trip."));

  const supabase = await createClient();

  for (let attempt = 0; attempt < 10; attempt++) {
    const slug = newShareSlug();
    const { data: updated, error } = await supabase
      .from("trips")
      .update({ is_public: true, public_slug: slug })
      .eq("id", tripId)
      .eq("user_id", session.userId)
      .select("id")
      .maybeSingle();

    if (!error && updated?.id) {
      revalidateTripPaths(tripId, null, slug);
      redirectAfterShareAction(formData, tripId, {
        share: "enabled",
        for_trip: tripId,
      });
    }

    if (error?.code !== "23505") {
      redirectAfterShareAction(formData, tripId, {
        share_error: error?.message ?? "Could not enable sharing.",
      });
    }
  }

  redirectAfterShareAction(formData, tripId, {
    share_error: "Could not allocate a unique link — try again.",
  });
}

export async function disablePublicTripSharing(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) redirect("/login");

  const tripId = parseTripId(formData.get("trip_id"));
  if (!tripId) redirect("/trips?error=" + encodeURIComponent("Invalid trip."));

  const supabase = await createClient();
  const oldSlug = await fetchTripSlug(supabase, tripId, session.userId);

  const { data: updated, error } = await supabase
    .from("trips")
    .update({ is_public: false })
    .eq("id", tripId)
    .eq("user_id", session.userId)
    .select("id")
    .maybeSingle();

  if (error) {
    redirectAfterShareAction(formData, tripId, {
      share_error: error.message ?? "Could not update sharing.",
    });
  }

  if (!updated?.id) {
    redirectAfterShareAction(formData, tripId, {
      share_error: "Trip not found or access denied.",
    });
  }

  revalidateTripPaths(tripId, null, oldSlug ?? null);
  redirectAfterShareAction(formData, tripId, { share: "disabled", for_trip: tripId });
}

export async function regeneratePublicTripSlug(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) redirect("/login");

  const tripId = parseTripId(formData.get("trip_id"));
  if (!tripId) redirect("/trips?error=" + encodeURIComponent("Invalid trip."));

  const supabase = await createClient();

  const { data: row, error: readErr } = await supabase
    .from("trips")
    .select("public_slug, is_public")
    .eq("id", tripId)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (readErr || !row?.is_public) {
    redirectAfterShareAction(formData, tripId, {
      share_error: "Turn sharing on before rotating the link.",
    });
  }

  const ownerRow = row!;
  const previousSlug = ownerRow.public_slug as string | null;

  for (let attempt = 0; attempt < 10; attempt++) {
    const slug = newShareSlug();
    const { data: updated, error } = await supabase
      .from("trips")
      .update({ public_slug: slug })
      .eq("id", tripId)
      .eq("user_id", session.userId)
      .eq("is_public", true)
      .select("id")
      .maybeSingle();

    if (!error && updated?.id) {
      revalidateTripPaths(tripId, null, previousSlug);
      revalidateTripPaths(tripId, null, slug);
      redirectAfterShareAction(formData, tripId, {
        share: "rotated",
        for_trip: tripId,
      });
    }

    if (error?.code !== "23505") {
      redirectAfterShareAction(formData, tripId, {
        share_error: error?.message ?? "Could not rotate link.",
      });
    }
  }

  redirectAfterShareAction(formData, tripId, {
    share_error: "Could not allocate a unique link — try again.",
  });
}

type StopRow = {
  id: string;
  sort_order: number;
  city_name: string;
  external_place_id: string | null;
  country: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  start_date: string | null;
  end_date: string | null;
  trip_activities?: Array<{
    title: string;
    starts_at: string | null;
    cost: number | null;
    category: string | null;
    external_ref: string | null;
  }>;
};

export async function copySharedTrip(formData: FormData) {
  const session = await getVerifiedSession();
  const slug = parseSlug(formData.get("slug"));
  if (!slug) {
    redirect("/trips?error=" + encodeURIComponent("Invalid share link."));
  }

  if (!session) {
    redirect(`/login?next=/p/${slug}`);
  }

  const supabase = await createClient();

  const { data: src, error: fetchErr } = await supabase
    .from("trips")
    .select(
      `
      title,
      place,
      start_date,
      end_date,
      daily_budget_cap,
      trip_stops (
        id,
        sort_order,
        city_name,
        external_place_id,
        country,
        region,
        lat,
        lng,
        start_date,
        end_date,
        trip_activities (
          title,
          starts_at,
          cost,
          category,
          external_ref
        )
      )
    `
    )
    .eq("public_slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (fetchErr || !src) {
    redirect(`/p/${slug}?copy_error=` + encodeURIComponent("That itinerary is no longer available."));
  }

  const stopsRaw = src.trip_stops;
  const stopsArr = Array.isArray(stopsRaw) ? stopsRaw : [];
  const stops: StopRow[] = stopsArr
    .map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id ?? ""),
        sort_order:
          typeof r.sort_order === "number" ? r.sort_order : Number(r.sort_order ?? 0),
        city_name: String(r.city_name ?? ""),
        external_place_id:
          r.external_place_id != null ? String(r.external_place_id) : null,
        country: r.country != null ? String(r.country) : null,
        region: r.region != null ? String(r.region) : null,
        lat: typeof r.lat === "number" ? r.lat : r.lat != null ? Number(r.lat) : null,
        lng: typeof r.lng === "number" ? r.lng : r.lng != null ? Number(r.lng) : null,
        start_date: r.start_date != null ? String(r.start_date).slice(0, 10) : null,
        end_date: r.end_date != null ? String(r.end_date).slice(0, 10) : null,
        trip_activities: Array.isArray(r.trip_activities)
          ? (r.trip_activities as StopRow["trip_activities"])
          : [],
      };
    })
    .filter((s) => s.id.length > 0)
    .sort((a, b) => a.sort_order - b.sort_order);

  const capRaw = src.daily_budget_cap;
  const capNum =
    capRaw != null && capRaw !== ""
      ? typeof capRaw === "number"
        ? capRaw
        : Number(capRaw)
      : null;

  const { data: newTrip, error: tripErr } = await supabase
    .from("trips")
    .insert({
      user_id: session.userId,
      title: String(src.title ?? "Imported trip").slice(0, 500),
      place: src.place != null ? String(src.place).slice(0, 200) : null,
      start_date: src.start_date != null ? String(src.start_date).slice(0, 10) : null,
      end_date: src.end_date != null ? String(src.end_date).slice(0, 10) : null,
      daily_budget_cap: capNum != null && Number.isFinite(capNum) ? capNum : null,
      is_public: false,
      public_slug: null,
    })
    .select("id")
    .single();

  if (tripErr || !newTrip?.id) {
    redirect(
      `/p/${slug}?copy_error=` +
        encodeURIComponent(tripErr?.message ?? "Could not copy trip.")
    );
  }

  const newTripId = newTrip.id as string;

  try {
    for (const stop of stops) {
      const { data: newStop, error: stopErr } = await supabase
        .from("trip_stops")
        .insert({
          trip_id: newTripId,
          sort_order: stop.sort_order,
          city_name: (stop.city_name.trim().slice(0, 200) || "Stop"),
          external_place_id: stop.external_place_id,
          country: stop.country,
          region: stop.region,
          lat: Number.isFinite(stop.lat as number) ? stop.lat : null,
          lng: Number.isFinite(stop.lng as number) ? stop.lng : null,
          start_date: stop.start_date,
          end_date: stop.end_date,
        })
        .select("id")
        .single();

      if (stopErr || !newStop?.id) {
        throw new Error(stopErr?.message ?? "Stop insert failed");
      }

      const newStopId = newStop.id as string;
      const acts = stop.trip_activities ?? [];
      for (const act of acts) {
        const costRaw = act.cost;
        const cost =
          costRaw == null ? null : typeof costRaw === "number" ? costRaw : Number(costRaw);

        const { error: actErr } = await supabase.from("trip_activities").insert({
          trip_stop_id: newStopId,
          title: String(act.title ?? "Activity").slice(0, 300),
          starts_at: act.starts_at,
          cost:
            cost != null && Number.isFinite(cost) ? Math.round(cost * 100) / 100 : null,
          category: act.category != null ? String(act.category).slice(0, 120) : null,
          external_ref:
            act.external_ref != null ? String(act.external_ref).slice(0, 200) : null,
        });

        if (actErr) throw new Error(actErr.message);
      }
    }
  } catch (e) {
    await supabase.from("trips").delete().eq("id", newTripId).eq("user_id", session.userId);
    redirect(
      `/p/${slug}?copy_error=` +
        encodeURIComponent(e instanceof Error ? e.message : "Copy failed.")
    );
  }

  revalidateTripPaths(newTripId);
  redirect(`/trips/${newTripId}/build?copied=1`);
}
