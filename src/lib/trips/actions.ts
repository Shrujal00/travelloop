"use server";

import { getVerifiedSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTrip(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/login?next=/trips/new");
  }

  const titleRaw = formData.get("title");
  const title =
    typeof titleRaw === "string" ? titleRaw.trim().slice(0, 200) : "";
  if (!title) {
    redirect(
      "/trips/new?error=" + encodeURIComponent("Add a trip name.")
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("trips").insert({
    user_id: session.userId,
    title,
  });

  if (error) {
    redirect("/trips/new?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/trips");
  revalidatePath("/trips/new");
  revalidatePath("/");
  redirect("/trips");
}
