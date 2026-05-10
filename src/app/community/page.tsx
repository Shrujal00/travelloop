import {
  CommunityFeedClient,
  type CommunityPostVM,
} from "@/components/community-feed-client";
import { getVerifiedSession } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

function decodeErr(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/login?next=/community");
  }

  const { error: errParam } = await searchParams;
  const errorMessage = decodeErr(errParam);

  const supabase = await createClient();

  const [{ data: postsRaw, error: postsError }, { data: profile }, { data: tripsRaw }] =
    await Promise.all([
      supabase
        .from("community_posts")
        .select(
          `
          id,
          user_id,
          title,
          body,
          topic,
          related_trip_title,
          related_trip_place,
          created_at,
          profiles ( display_name, avatar_url, email )
        `
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("display_name, avatar_url, email")
        .eq("id", session.userId)
        .maybeSingle(),
      supabase.from("trips").select("id, title").order("created_at", { ascending: false }),
    ]);

  const posts: CommunityPostVM[] = (postsRaw ?? []).map((row) => {
    const rawProf = row.profiles as
      | CommunityPostVM["profiles"]
      | CommunityPostVM["profiles"][]
      | null
      | undefined;
    const prof = Array.isArray(rawProf) ? rawProf[0] ?? null : rawProf ?? null;
    return {
      id: row.id as string,
      user_id: row.user_id as string,
      title: (row.title as string | null) ?? null,
      body: row.body as string,
      topic: (row.topic as string | null) ?? null,
      related_trip_title: (row.related_trip_title as string | null) ?? null,
      related_trip_place: (row.related_trip_place as string | null) ?? null,
      created_at: row.created_at as string,
      profiles: prof,
    };
  });

  const myTrips = (tripsRaw ?? []).map((t) => ({
    id: t.id as string,
    title: (t.title as string) || "Untitled trip",
  }));

  const email = profile?.email ?? session.email;
  const headerDisplayName =
    profile?.display_name?.trim() || email.split("@")[0] || "Traveler";
  const headerAvatarUrl = profile?.avatar_url?.trim() || null;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-3xl px-6 py-8 pb-16">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <nav className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="font-medium text-stone-600 underline-offset-4 hover:text-[var(--travel-charcoal)] hover:underline"
            >
              Dashboard
            </Link>
            <Link
              href="/trips"
              className="font-medium text-stone-600 underline-offset-4 hover:text-[var(--travel-charcoal)] hover:underline"
            >
              All trips
            </Link>
          </nav>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-stone-300 px-3 py-1.5 font-medium text-stone-700 transition hover:bg-stone-50"
            >
              Sign out
            </button>
          </form>
        </div>

        {errorMessage ? (
          <p
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        {postsError ? (
          <p
            className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            Could not load community posts. Run{" "}
            <code className="rounded bg-amber-100/80 px-1">
              supabase/migrations/20260517000000_community_posts.sql
            </code>{" "}
            (see README), then refresh.
          </p>
        ) : null}

        <CommunityFeedClient
          posts={postsError ? [] : posts}
          myTrips={myTrips}
          currentUserId={session.userId}
          headerAvatarUrl={headerAvatarUrl}
          headerDisplayName={headerDisplayName}
        />
      </div>
    </div>
  );
}
