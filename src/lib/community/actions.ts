"use server";

import { getVerifiedSession } from "@/lib/auth/session";
import { COMMUNITY_TOPICS } from "@/lib/community/topics";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseBody(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  return s.slice(0, 8000);
}

function parseTitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  return s.slice(0, 200);
}

function parseTopic(raw: unknown): string {
  if (typeof raw !== "string") return "General";
  const s = raw.trim();
  if (!s) return "General";
  return COMMUNITY_TOPICS.includes(s as (typeof COMMUNITY_TOPICS)[number])
    ? s
    : "General";
}

export async function createCommunityPost(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) redirect("/login?next=/community");

  const body = parseBody(formData.get("body"));
  if (!body) {
    redirect(
      "/community?error=" + encodeURIComponent("Add some text to share with the community.")
    );
  }

  const title = parseTitle(formData.get("title"));
  const topic = parseTopic(formData.get("topic"));

  let relatedTripTitle: string | null = null;
  let relatedTripPlace: string | null = null;

  const tripRaw = formData.get("trip_id");
  if (typeof tripRaw === "string" && tripRaw.trim()) {
    const tripId = tripRaw.trim();
    const supabase = await createClient();
    const { data: trip } = await supabase
      .from("trips")
      .select("title, place")
      .eq("id", tripId)
      .eq("user_id", session.userId)
      .maybeSingle();
    if (trip) {
      relatedTripTitle =
        typeof trip.title === "string" ? trip.title.slice(0, 200) : null;
      relatedTripPlace =
        typeof trip.place === "string" ? trip.place.slice(0, 120) : null;
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("community_posts").insert({
    user_id: session.userId,
    title,
    body,
    topic,
    related_trip_title: relatedTripTitle,
    related_trip_place: relatedTripPlace,
  });

  if (error) {
    redirect("/community?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/community");
  redirect("/community");
}
