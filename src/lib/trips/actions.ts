"use server";

import { getVerifiedSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseISODate(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  return t;
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
  const { error } = await supabase.from("trips").insert({
    user_id: session.userId,
    title,
    place,
    start_date: start,
    end_date: end,
  });

  if (error) {
    redirect("/trips/new?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/trips");
  revalidatePath("/trips/new");
  revalidatePath("/");
  redirect("/trips");
}
