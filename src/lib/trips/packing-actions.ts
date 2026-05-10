"use server";

import { getVerifiedSession } from "@/lib/auth/session";
import {
  type PackingCategory,
  PACKING_CATEGORY_ORDER,
} from "@/lib/trips/packing-categories";
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

function parseItemId(raw: unknown): string | null {
  return parseTripId(raw);
}

function parseCategory(raw: unknown): PackingCategory | null {
  if (typeof raw !== "string") return null;
  const c = raw.trim().toLowerCase();
  return PACKING_CATEGORY_ORDER.includes(c as PackingCategory) ? (c as PackingCategory) : null;
}

function parseLabel(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s || s.length > 200) return null;
  return s;
}

function parsePacked(raw: unknown): boolean | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "on") return true;
  if (v === "false" || v === "0") return false;
  return null;
}

function packingRedirect(tripId: string, message: string) {
  redirect(`/trips/${tripId}/packing?error=` + encodeURIComponent(message));
}

export async function addPackingItem(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) redirect("/login?next=/trips");

  const tripId = parseTripId(formData.get("trip_id"));
  const category = parseCategory(formData.get("category"));
  const label = parseLabel(formData.get("label"));
  if (!tripId || !category || !label) {
    if (tripId) packingRedirect(tripId, "Category and item name are required.");
    redirect("/trips?error=" + encodeURIComponent("Invalid packing item."));
  }

  const supabase = await createClient();

  const { data: maxRow } = await supabase
    .from("packing_items")
    .select("sort_order")
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prev =
    maxRow?.sort_order != null && Number.isFinite(Number(maxRow.sort_order))
      ? Number(maxRow.sort_order)
      : -1;
  const nextOrder = prev + 1;

  const { error } = await supabase.from("packing_items").insert({
    trip_id: tripId,
    category,
    label,
    packed: false,
    sort_order: nextOrder,
  });

  if (error) packingRedirect(tripId, error.message);

  revalidateTripPaths(tripId);
  redirect(`/trips/${tripId}/packing`);
}

export async function setPackingItemPacked(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) redirect("/login?next=/trips");

  const tripId = parseTripId(formData.get("trip_id"));
  const itemId = parseItemId(formData.get("item_id"));
  const packed = parsePacked(formData.get("packed"));
  if (!tripId || !itemId || packed === null) {
    redirect("/trips?error=" + encodeURIComponent("Invalid packing update."));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("packing_items")
    .update({ packed })
    .eq("id", itemId)
    .eq("trip_id", tripId);

  if (error) packingRedirect(tripId, error.message);

  revalidateTripPaths(tripId);
  redirect(`/trips/${tripId}/packing`);
}

export async function deletePackingItem(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) redirect("/login?next=/trips");

  const tripId = parseTripId(formData.get("trip_id"));
  const itemId = parseItemId(formData.get("item_id"));
  if (!tripId || !itemId) {
    redirect("/trips?error=" + encodeURIComponent("Invalid item."));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("packing_items").delete().eq("id", itemId).eq("trip_id", tripId);

  if (error) packingRedirect(tripId, error.message);

  revalidateTripPaths(tripId);
  redirect(`/trips/${tripId}/packing`);
}

/** Uncheck every item (keep rows). */
export async function resetPackingProgress(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) redirect("/login?next=/trips");

  const tripId = parseTripId(formData.get("trip_id"));
  if (!tripId) redirect("/trips?error=" + encodeURIComponent("Invalid trip."));

  const supabase = await createClient();
  const { error } = await supabase.from("packing_items").update({ packed: false }).eq("trip_id", tripId);

  if (error) packingRedirect(tripId, error.message);

  revalidateTripPaths(tripId);
  redirect(`/trips/${tripId}/packing`);
}

/** Remove every checklist row for the trip. */
export async function clearPackingList(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) redirect("/login?next=/trips");

  const tripId = parseTripId(formData.get("trip_id"));
  if (!tripId) redirect("/trips?error=" + encodeURIComponent("Invalid trip."));

  const supabase = await createClient();
  const { error } = await supabase.from("packing_items").delete().eq("trip_id", tripId);

  if (error) packingRedirect(tripId, error.message);

  revalidateTripPaths(tripId);
  redirect(`/trips/${tripId}/packing`);
}
