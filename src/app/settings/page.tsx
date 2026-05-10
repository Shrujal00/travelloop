import { SavedDestinationsEditor } from "@/components/saved-destinations-editor";
import { getVerifiedSession } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { parseSavedDestinations } from "@/lib/profiles/saved-destination";
import {
  deleteMyAccount,
  requestEmailChange,
  saveAccountSettings,
  uploadAvatarFile,
} from "@/lib/settings/actions";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

const fieldClass =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-[var(--travel-accent)] focus:ring-1 focus:ring-[var(--travel-accent)]/40";

const LANG_OPTIONS = [
  { value: "", label: "Default (browser)" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese (generic)" },
  { value: "hi", label: "Hindi" },
  { value: "pt", label: "Portuguese" },
  { value: "it", label: "Italian" },
] as const;

function decodeParam(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    saved?: string;
    email_pending?: string;
    avatar_uploaded?: string;
  }>;
}) {
  const session = await getVerifiedSession();
  if (!session) redirect("/login?next=/settings");

  const sp = await searchParams;
  const errorMessage = decodeParam(sp.error);
  const savedBanner = sp.saved === "1";
  const emailPending = sp.email_pending === "1";
  const avatarUploaded = sp.avatar_uploaded === "1";

  const supabase = await createClient();
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("email, display_name, avatar_url, preferred_language, saved_destinations")
    .eq("id", session.userId)
    .maybeSingle();

  const msg = profileErr?.message ?? "";
  const schemaGap =
    msg.includes("preferred_language") ||
    msg.includes("saved_destinations") ||
    msg.includes("schema cache") ||
    profileErr?.code === "PGRST200";

  const email = profile?.email ?? session.email;
  const initialSaved = parseSavedDestinations(profile?.saved_destinations);
  const preferredLang =
    typeof profile?.preferred_language === "string" ? profile.preferred_language : "";

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link
            href="/"
            className="[font-family:var(--font-travel-display)] text-2xl text-[var(--travel-charcoal)]"
          >
            Traveloop
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/trips"
              className="font-medium text-stone-600 underline-offset-4 hover:text-[var(--travel-charcoal)] hover:underline"
            >
              All trips
            </Link>
            <Link
              href="/community"
              className="font-medium text-stone-600 underline-offset-4 hover:text-[var(--travel-charcoal)] hover:underline"
            >
              Community
            </Link>
            <Link
              href="/profile"
              className="font-medium text-stone-600 underline-offset-4 hover:text-[var(--travel-charcoal)] hover:underline"
            >
              Profile
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-stone-300 px-3 py-1.5 font-medium text-stone-700 transition hover:bg-stone-50"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm font-medium uppercase tracking-wide text-stone-500">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
          Settings
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Profile fields, email updates, avatar upload, saved cities, and account deletion.
        </p>

        {schemaGap ? (
          <p
            className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            Settings columns are missing. Run{" "}
            <code className="rounded bg-amber-100/80 px-1">
              supabase/migrations/20260520000000_profiles_settings_extensions.sql
            </code>{" "}
            (see README), then refresh.
          </p>
        ) : null}

        {savedBanner ? (
          <p className="mt-6 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
            Settings saved.
          </p>
        ) : null}

        {emailPending ? (
          <p className="mt-6 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
            Check your inbox — confirm the link from Supabase to finish changing your email.
          </p>
        ) : null}

        {avatarUploaded ? (
          <p className="mt-6 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
            Avatar uploaded from file — profile picture URL was updated.
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <section className="mt-10 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">Sign-in email</h2>
          <p className="mt-2 text-sm text-stone-600">
            Current address: <span className="font-medium text-stone-900">{email}</span>
          </p>
          <form action={requestEmailChange} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1 text-xs font-medium text-stone-600">
              New email
              <input
                name="new_email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className={fieldClass}
              />
            </label>
            <button
              type="submit"
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm hover:bg-stone-50"
            >
              Request change
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
            Profile & preferences
          </h2>
          <form action={saveAccountSettings} className="mt-6 space-y-5">
            <div>
              <label className="text-xs font-medium text-stone-600" htmlFor="display_name">
                Display name
              </label>
              <input
                id="display_name"
                name="display_name"
                maxLength={120}
                defaultValue={profile?.display_name ?? ""}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600" htmlFor="avatar_url">
                Avatar URL (https only)
              </label>
              <input
                id="avatar_url"
                name="avatar_url"
                type="url"
                defaultValue={profile?.avatar_url ?? ""}
                placeholder="https://… or upload a file below"
                className={fieldClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600" htmlFor="preferred_language">
                Preferred language
              </label>
              <select
                id="preferred_language"
                name="preferred_language"
                defaultValue={preferredLang}
                className={fieldClass}
              >
                {LANG_OPTIONS.map((o) => (
                  <option key={o.value || "default"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-stone-500">
                Stored for future localized UI; most screens stay English today.
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-stone-600">Saved destinations</p>
              <p className="mt-1 text-xs text-stone-500">
                Quick-reference cities (same search as trip planning). Used for personalization later.
              </p>
              <div className="mt-3">
                <SavedDestinationsEditor initial={initialSaved} />
              </div>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-[var(--travel-accent)] px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm hover:brightness-[0.97]"
            >
              Save settings
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">Avatar file upload</h2>
          <p className="mt-2 text-sm text-stone-600">
            JPEG, PNG, WebP, or GIF — max 2 MB. Stored in Supabase Storage{" "}
            <code className="rounded bg-stone-100 px-1">avatars</code> bucket (run storage migration in README).
          </p>
          <form action={uploadAvatarFile} encType="multipart/form-data" className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-xs font-medium text-stone-600">
              Choose image
              <input name="avatar_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={fieldClass} />
            </label>
            <button
              type="submit"
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm hover:bg-stone-50"
            >
              Upload &amp; set avatar
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-red-200 bg-red-50/40 p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-red-900">Delete account</h2>
          <p className="mt-2 text-sm text-red-900/90">
            Permanently removes your auth user and cascades trips, notes, and profile data. Requires{" "}
            <code className="rounded bg-white/80 px-1">SUPABASE_SERVICE_ROLE_KEY</code> on this server (never expose to
            the browser).
          </p>
          <form action={deleteMyAccount} className="mt-4 space-y-3">
            <label className="block text-xs font-medium text-red-900">
              Type your email to confirm
              <input
                name="confirm_email"
                type="email"
                required
                autoComplete="off"
                placeholder={email}
                className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-300/50"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-800"
            >
              Delete my account forever
            </button>
          </form>
        </section>

        <Link
          href="/profile"
          className="mt-10 inline-block text-sm font-semibold text-[var(--travel-charcoal)] underline-offset-4 hover:underline"
        >
          ← Back to profile
        </Link>
      </main>
    </div>
  );
}
