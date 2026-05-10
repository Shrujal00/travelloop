"use server";

import { getVerifiedSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseDisplayName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  return s.slice(0, 120);
}

function parseAvatarUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  if (s.length > 500) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return null;
    return s;
  } catch {
    return null;
  }
}

export async function updateProfile(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/login?next=/profile");
  }

  const display_name = parseDisplayName(formData.get("display_name"));
  const avatar_url = parseAvatarUrl(formData.get("avatar_url"));

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name,
      avatar_url,
    })
    .eq("id", session.userId);

  if (error) {
    redirect("/profile?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/profile");
  revalidatePath("/");
  redirect("/profile");
}
