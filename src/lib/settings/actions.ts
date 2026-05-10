"use server";

import { getVerifiedSession } from "@/lib/auth/session";
import {
  parseSavedDestinations,
  type SavedDestination,
} from "@/lib/profiles/saved-destination";
import { createServiceRoleClient } from "@/lib/supabase/admin";
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

function parsePreferredLanguage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (!/^[a-z]{2}(-[a-z]{2,8})?$/.test(s)) return null;
  return s.slice(0, 16);
}

function parseSavedFromForm(raw: unknown): SavedDestination[] | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return [];
  try {
    const parsed = JSON.parse(t) as unknown;
    return parseSavedDestinations(parsed);
  } catch {
    return null;
  }
}

export async function saveAccountSettings(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) redirect("/login?next=/settings");

  const display_name = parseDisplayName(formData.get("display_name"));
  const avatar_url = parseAvatarUrl(formData.get("avatar_url"));
  const preferred_language = parsePreferredLanguage(formData.get("preferred_language"));
  const savedRaw = parseSavedFromForm(formData.get("saved_destinations"));
  if (savedRaw === null) {
    redirect("/settings?error=" + encodeURIComponent("Saved destinations JSON was invalid."));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name,
      avatar_url,
      preferred_language,
      saved_destinations: savedRaw,
    })
    .eq("id", session.userId);

  if (error) {
    redirect("/settings?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/settings");
  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/community");
  redirect("/settings?saved=1");
}

export async function requestEmailChange(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) redirect("/login?next=/settings");

  const raw = formData.get("new_email");
  if (typeof raw !== "string") {
    redirect("/settings?error=" + encodeURIComponent("Enter a valid email address."));
  }
  const newEmail = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    redirect("/settings?error=" + encodeURIComponent("Enter a valid email address."));
  }
  if (newEmail === session.email.toLowerCase()) {
    redirect("/settings?error=" + encodeURIComponent("That is already your email."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) {
    redirect("/settings?error=" + encodeURIComponent(error.message));
  }

  redirect("/settings?email_pending=1");
}

const avatarMimeToExt: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function uploadAvatarFile(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) redirect("/login?next=/settings");

  const file = formData.get("avatar_file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/settings?error=" + encodeURIComponent("Choose an image file."));
  }
  if (file.size > 2 * 1024 * 1024) {
    redirect("/settings?error=" + encodeURIComponent("Image must be 2 MB or smaller."));
  }
  const ext = avatarMimeToExt[file.type];
  if (!ext) {
    redirect("/settings?error=" + encodeURIComponent("Use JPEG, PNG, WebP, or GIF."));
  }

  const supabase = await createClient();
  const path = `${session.userId}/avatar.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage.from("avatars").upload(path, buf, {
    contentType: file.type,
    upsert: true,
  });

  if (upErr) {
    redirect(
      "/settings?error=" +
        encodeURIComponent(
          upErr.message.includes("Bucket not found")
            ? "Avatar bucket missing — run storage migration (see README)."
            : upErr.message
        )
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: dbErr } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", session.userId);

  if (dbErr) {
    redirect("/settings?error=" + encodeURIComponent(dbErr.message));
  }

  revalidatePath("/settings");
  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/community");
  redirect("/settings?avatar_uploaded=1");
}

export async function deleteMyAccount(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) redirect("/login");

  const rawConfirm = formData.get("confirm_email");
  const confirm = typeof rawConfirm === "string" ? rawConfirm.trim() : "";
  if (confirm.toLowerCase() !== session.email.toLowerCase()) {
    redirect("/settings?error=" + encodeURIComponent("Type your email exactly to confirm deletion."));
  }

  try {
    const admin = createServiceRoleClient();
    const { error } = await admin.auth.admin.deleteUser(session.userId);
    if (error) {
      redirect("/settings?error=" + encodeURIComponent(error.message));
    }
  } catch (e) {
    redirect(
      "/settings?error=" +
        encodeURIComponent(
          e instanceof Error && e.message.includes("SUPABASE_SERVICE_ROLE_KEY")
            ? "Account deletion is not configured (missing SUPABASE_SERVICE_ROLE_KEY on the server)."
            : e instanceof Error
              ? e.message
              : "Could not delete account."
        )
    );
  }

  try {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "global" });
  } catch {
    /* session may already be invalid after delete */
  }

  redirect("/login?deleted=1");
}
