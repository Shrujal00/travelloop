"use client";

import { createCommunityPost } from "@/lib/community/actions";
import { COMMUNITY_TOPICS } from "@/lib/community/topics";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export type CommunityPostVM = {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  topic: string | null;
  related_trip_title: string | null;
  related_trip_place: string | null;
  created_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
};

type TripPicker = { id: string; title: string };

type GroupMode = "none" | "trip" | "topic";
type SortMode = "newest" | "oldest" | "title";
type FilterMode = "all" | "mine" | "with_trip";

function displayNameFor(post: CommunityPostVM): string {
  const dn = post.profiles?.display_name?.trim();
  if (dn) return dn;
  const em = post.profiles?.email?.trim();
  if (em) return em.split("@")[0] ?? "Traveler";
  return "Traveler";
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const fieldClass =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-[var(--travel-accent)] focus:ring-1 focus:ring-[var(--travel-accent)]/40";

const selectClass =
  "rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 outline-none focus:border-[var(--travel-accent)] focus:ring-1 focus:ring-[var(--travel-accent)]/40";

export function CommunityFeedClient({
  posts,
  myTrips,
  currentUserId,
  headerAvatarUrl,
  headerDisplayName,
}: {
  posts: CommunityPostVM[];
  myTrips: TripPicker[];
  currentUserId: string;
  headerAvatarUrl: string | null;
  headerDisplayName: string;
}) {
  const [query, setQuery] = useState("");
  const [groupMode, setGroupMode] = useState<GroupMode>("none");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [topicFilter, setTopicFilter] = useState<string>("");

  const filteredSorted = useMemo(() => {
    let list = [...posts];

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const blob = [
          p.body,
          p.title ?? "",
          p.topic ?? "",
          p.related_trip_title ?? "",
          p.related_trip_place ?? "",
          displayNameFor(p),
        ]
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }

    if (filterMode === "mine") {
      list = list.filter((p) => p.user_id === currentUserId);
    } else if (filterMode === "with_trip") {
      list = list.filter((p) => p.related_trip_title != null);
    }

    if (topicFilter) {
      list = list.filter((p) => (p.topic ?? "General") === topicFilter);
    }

    list.sort((a, b) => {
      if (sortMode === "title") {
        const ta = (a.title?.trim() || a.body.slice(0, 40)).toLowerCase();
        const tb = (b.title?.trim() || b.body.slice(0, 40)).toLowerCase();
        return ta.localeCompare(tb);
      }
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortMode === "newest" ? db - da : da - db;
    });

    return list;
  }, [posts, query, filterMode, topicFilter, sortMode, currentUserId]);

  const grouped = useMemo(() => {
    if (filteredSorted.length === 0) {
      return [
        { key: "__empty__", label: null as string | null, items: [] as CommunityPostVM[] },
      ];
    }
    if (groupMode === "none") {
      return [{ key: "__all__", label: null as string | null, items: filteredSorted }];
    }
    const buckets = new Map<string, CommunityPostVM[]>();
    for (const p of filteredSorted) {
      let key: string;
      if (groupMode === "trip") {
        key = p.related_trip_title?.trim() || "__general__";
      } else {
        key = p.topic?.trim() || "General";
      }
      const prev = buckets.get(key);
      if (prev) prev.push(p);
      else buckets.set(key, [p]);
    }
    const labels = Array.from(buckets.keys()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
    return labels.map((key) => {
      const items = buckets.get(key) ?? [];
      let label: string | null = key;
      if (groupMode === "trip" && key === "__general__") {
        label = "Not tied to a trip";
      }
      return { key, label, items };
    });
  }, [filteredSorted, groupMode]);

  const hi = initialsFor(headerDisplayName);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <Link
          href="/"
          className="[font-family:var(--font-travel-display)] text-2xl text-[var(--travel-charcoal)]"
        >
          Traveloop
        </Link>
        <Link
          href="/profile"
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-stone-200 bg-white shadow-sm outline-none ring-[var(--travel-accent)]/40 transition hover:ring-2"
          aria-label="Profile"
        >
          {headerAvatarUrl ? (
            <Image
              src={headerAvatarUrl}
              alt=""
              width={44}
              height={44}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-stone-800">{hi}</span>
          )}
        </Link>
      </header>

      <section className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
        <label className="min-w-0 flex-1 text-xs font-medium text-stone-600">
          <span className="sr-only">Search posts</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search experiences, places, topics…"
            className={fieldClass}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <label className="flex flex-col text-[10px] font-bold uppercase tracking-wide text-stone-500">
            Group by
            <select
              className={`${selectClass} mt-1`}
              value={groupMode}
              onChange={(e) => setGroupMode(e.target.value as GroupMode)}
            >
              <option value="none">None</option>
              <option value="trip">Trip</option>
              <option value="topic">Topic</option>
            </select>
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase tracking-wide text-stone-500">
            Filter
            <select
              className={`${selectClass} mt-1`}
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as FilterMode)}
            >
              <option value="all">All posts</option>
              <option value="mine">My posts</option>
              <option value="with_trip">Has trip context</option>
            </select>
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase tracking-wide text-stone-500">
            Topic
            <select
              className={`${selectClass} mt-1 min-w-[8.5rem]`}
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
            >
              <option value="">Any topic</option>
              {COMMUNITY_TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase tracking-wide text-stone-500">
            Sort
            <select
              className={`${selectClass} mt-1`}
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title / preview A–Z</option>
            </select>
          </label>
        </div>
      </section>

      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--travel-charcoal)]">
          Community
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Share trip wins, budgets, and activity ideas — authors show the{" "}
          <Link href="/profile" className="font-medium underline-offset-4 hover:underline">
            display name &amp; avatar
          </Link>{" "}
          from your profile.
        </p>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
          Share an experience
        </h2>
        <form action={createCommunityPost} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-stone-600" htmlFor="post-title">
                Title{" "}
                <span className="font-normal text-stone-400">— optional</span>
              </label>
              <input id="post-title" name="title" maxLength={200} className={fieldClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600" htmlFor="post-topic">
                Topic
              </label>
              <select id="post-topic" name="topic" defaultValue="General" className={fieldClass}>
                {COMMUNITY_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600" htmlFor="post-trip">
                Related trip{" "}
                <span className="font-normal text-stone-400">— optional snapshot</span>
              </label>
              <select id="post-trip" name="trip_id" defaultValue="" className={fieldClass}>
                <option value="">None</option>
                {myTrips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-stone-600" htmlFor="post-body">
                Your story
              </label>
              <textarea
                id="post-body"
                name="body"
                required
                rows={4}
                maxLength={8000}
                placeholder="What worked, what you’d skip next time, a hidden gem…"
                className={fieldClass}
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-[var(--travel-accent)] px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm transition hover:brightness-[0.97]"
          >
            Post to community
          </button>
        </form>
      </section>

      <section className="space-y-8">
        {grouped.map(({ key, label, items }) => (
          <div key={key}>
            {label ? (
              <h3 className="mb-3 border-b border-stone-200 pb-2 text-sm font-bold uppercase tracking-wide text-stone-500">
                {label}
              </h3>
            ) : null}
            {items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50/80 px-4 py-10 text-center text-sm text-stone-600">
                No posts match your filters yet — adjust search or be the first to share.
              </p>
            ) : (
              <ul className="space-y-5">
                {items.map((post) => (
                  <li key={post.id} className="flex gap-3 sm:gap-4">
                    <div className="shrink-0 pt-1">
                      {post.profiles?.avatar_url ? (
                        <Image
                          src={post.profiles.avatar_url}
                          alt=""
                          width={44}
                          height={44}
                          unoptimized
                          className="h-11 w-11 rounded-full border border-stone-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-[var(--travel-accent)]/35 text-xs font-bold text-stone-900">
                          {initialsFor(displayNameFor(post))}
                        </div>
                      )}
                    </div>
                    <article className="min-w-0 flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-sm">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-[var(--travel-charcoal)]">
                          {displayNameFor(post)}
                          {post.user_id === currentUserId ? (
                            <span className="ml-2 text-xs font-normal text-stone-400">(you)</span>
                          ) : null}
                        </p>
                        <time
                          className="text-xs text-stone-500"
                          dateTime={post.created_at}
                        >
                          {formatDate(post.created_at)}
                        </time>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {post.topic ? (
                          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                            {post.topic}
                          </span>
                        ) : null}
                        {post.related_trip_title ? (
                          <span className="rounded-full bg-[var(--travel-accent)]/25 px-2.5 py-0.5 text-[11px] font-semibold text-stone-800">
                            Trip: {post.related_trip_title}
                            {post.related_trip_place
                              ? ` · ${post.related_trip_place}`
                              : ""}
                          </span>
                        ) : null}
                      </div>
                      {post.title ? (
                        <h4 className="mt-3 text-base font-semibold text-stone-900">
                          {post.title}
                        </h4>
                      ) : null}
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                        {post.body}
                      </p>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
