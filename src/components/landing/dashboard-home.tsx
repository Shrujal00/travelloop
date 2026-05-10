"use client";

import { TripItineraryCollapsible, type DashboardTripForCollapsible } from "@/components/trip-itinerary-collapsible";
import { REGIONAL_PICKS } from "@/lib/landing/regional-picks";
import type { TripLifecycle } from "@/lib/trips/trip-lifecycle";
import { tripLifecycleBucket, tripLifecycleLabel } from "@/lib/trips/trip-lifecycle";
import Link from "next/link";
import { useMemo, useState } from "react";

type GroupBy = "none" | "status" | "month";
type LifecycleFilter = "all" | "upcoming" | "ongoing" | "completed" | "undated";
type SortKey = "recent" | "startAsc" | "title";

function padMonthLabel(iso: string | null): string {
  if (!iso) return "Undated";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "Undated";
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

export function DashboardHome({
  trips,
  welcomeName,
  todayIso,
}: {
  trips: DashboardTripForCollapsible[];
  welcomeName: string;
  todayIso: string;
}) {
  const [query, setQuery] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");

  const filtered = useMemo(() => {
    let list = trips.slice();
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => {
        const place = (t.place ?? "").toLowerCase();
        const title = (t.title ?? "").toLowerCase();
        return place.includes(q) || title.includes(q);
      });
    }
    if (lifecycleFilter !== "all") {
      list = list.filter(
        (t) => tripLifecycleBucket(t.start_date, t.end_date, todayIso) === lifecycleFilter,
      );
    }
    list.sort((a, b) => {
      if (sortKey === "title") return (a.title ?? "").localeCompare(b.title ?? "");
      if (sortKey === "startAsc") {
        const as = a.start_date ?? "";
        const bs = b.start_date ?? "";
        if (!as && !bs) return 0;
        if (!as) return 1;
        if (!bs) return -1;
        return as.localeCompare(bs);
      }
      const ac = a.created_at ?? "";
      const bc = b.created_at ?? "";
      return bc.localeCompare(ac);
    });
    return list;
  }, [trips, query, lifecycleFilter, sortKey, todayIso]);

  const previousTrips = useMemo(
    () =>
      trips.filter((t) => tripLifecycleBucket(t.start_date, t.end_date, todayIso) === "completed"),
    [trips, todayIso],
  );

  const chip =
    "rounded-full border border-stone-300/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm backdrop-blur-sm transition hover:border-[var(--travel-accent)]/80 hover:bg-white";

  const grouped = useMemo(() => {
    if (groupBy === "none") return null;
    const map = new Map<string, DashboardTripForCollapsible[]>();
    for (const t of filtered) {
      let key: string;
      if (groupBy === "status") key = tripLifecycleBucket(t.start_date, t.end_date, todayIso);
      else key = padMonthLabel(t.start_date);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    const order =
      groupBy === "status"
        ? ["ongoing", "upcoming", "completed", "undated"]
        : Array.from(map.keys()).sort((a, b) => {
            if (a === "Undated") return 1;
            if (b === "Undated") return -1;
            return a.localeCompare(b);
          });
    return { map, order };
  }, [filtered, groupBy, todayIso]);

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-stone-200 bg-[var(--travel-charcoal)] px-4 pb-14 pt-12 text-stone-100 sm:px-6 sm:pb-16">
        <div className="travel-hero-mesh pointer-events-none absolute inset-0 opacity-75" aria-hidden />
        <div className="travel-noise pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" aria-hidden />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="travel-animate-in travel-delay-1 max-w-xl space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--travel-accent)]">
              Welcome back
            </p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
              <span className="[font-family:var(--font-travel-display)] text-[var(--travel-accent)]">{welcomeName}</span>
              , your loops are warming up.
            </h1>
            <p className="text-sm leading-relaxed text-stone-300">
              Banner snapshot · search across trips, then glide into day-by-day detail without losing place context.
            </p>
          </div>
          <div className="travel-animate-in travel-delay-2 grid grid-cols-3 gap-3 text-center text-xs font-semibold uppercase tracking-wide text-stone-900 sm:max-w-sm">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur-md">
              <p className="text-[10px] text-stone-300">Active</p>
              <p className="mt-1 text-lg text-[var(--travel-accent)]">
                {
                  trips.filter(
                    (t) =>
                      tripLifecycleBucket(t.start_date, t.end_date, todayIso) !== "completed",
                  ).length
                }
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur-md">
              <p className="text-[10px] text-stone-300">Archived</p>
              <p className="mt-1 text-lg text-white">{previousTrips.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur-md">
              <p className="text-[10px] text-stone-300">Ideas</p>
              <p className="mt-1 text-lg text-white">{REGIONAL_PICKS.length}</p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto mt-10 max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-black/25 shadow-2xl shadow-black/35 backdrop-blur-md">
          <div className="relative aspect-[21/9] min-h-[120px] w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-700/40 via-stone-900/30 to-amber-600/35" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="text-sm font-medium text-white/95">Your itineraries · cinematic overview</p>
              <p className="max-w-md text-xs text-stone-300">
                Drag inspiration from regional picks, drop notes mid-trip, share only what guests should see.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200 bg-[var(--travel-paper)] px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="travel-animate-in travel-delay-2 flex flex-1 flex-col gap-2">
            <span className="sr-only">Search trips</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search bar · city or trip title"
              className="w-full rounded-2xl border border-stone-300/90 bg-white px-4 py-3 text-sm text-stone-800 shadow-inner shadow-stone-900/5 outline-none ring-[var(--travel-accent)]/0 transition focus:border-[var(--travel-accent)] focus:ring-4 focus:ring-[var(--travel-accent)]/25"
            />
          </label>
          <div className="travel-animate-in travel-delay-3 flex flex-wrap gap-2 lg:justify-end">
            <div className="relative">
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                className={`${chip} appearance-none pr-8`}
                aria-label="Group by"
              >
                <option value="none">Group by · none</option>
                <option value="status">Group by · status</option>
                <option value="month">Group by · month</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-stone-500">
                ▾
              </span>
            </div>
            <div className="relative">
              <select
                value={lifecycleFilter}
                onChange={(e) => setLifecycleFilter(e.target.value as LifecycleFilter)}
                className={`${chip} appearance-none pr-8`}
                aria-label="Filter trips"
              >
                <option value="all">Filter · all</option>
                <option value="upcoming">Filter · upcoming</option>
                <option value="ongoing">Filter · ongoing</option>
                <option value="completed">Filter · completed</option>
                <option value="undated">Filter · undated</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-stone-500">
                ▾
              </span>
            </div>
            <div className="relative">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className={`${chip} appearance-none pr-8`}
                aria-label="Sort trips"
              >
                <option value="recent">Sort by · newest</option>
                <option value="startAsc">Sort by · start date</option>
                <option value="title">Sort by · title</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-stone-500">
                ▾
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200 bg-[color-mix(in_oklab,var(--travel-paper)_94%,white)] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="travel-animate-in travel-delay-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--travel-charcoal)]">
                Top regional selections
              </h2>
              <p className="mt-2 max-w-lg text-sm text-stone-600">
                Borrow palettes — your stops stay editable inside each loop.
              </p>
            </div>
            <Link href="/trips/new" className={`${chip} hidden sm:inline-flex`}>
              Spin a fresh loop
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden">
            {REGIONAL_PICKS.map((r, i) => (
              <article
                key={r.city}
                style={{ animationDelay: `${80 + i * 60}ms` }}
                className={`travel-card-lift travel-animate-in relative flex w-[min(100%,12rem)] shrink-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg shadow-stone-900/5`}
              >
                <div className={`relative aspect-square bg-gradient-to-br ${r.hue}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgba(255,255,255,0.35),transparent_52%)]" />
                  <span className="absolute left-3 top-3 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                    {r.tag}
                  </span>
                </div>
                <div className="space-y-1 p-3">
                  <p className="font-semibold text-[var(--travel-charcoal)]">{r.city}</p>
                  <p className="text-[11px] leading-snug text-stone-600">{r.blurb}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200 bg-[var(--travel-paper)] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="travel-animate-in travel-delay-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--travel-charcoal)]">
                Previous trips
              </h2>
              <p className="mt-2 max-w-lg text-sm text-stone-600">
                Completed loops · taller cards for quick revisits.
              </p>
            </div>
          </div>
          {previousTrips.length === 0 ? (
            <p className="travel-animate-in rounded-2xl border border-dashed border-stone-300 bg-white/80 px-4 py-8 text-center text-sm text-stone-600">
              No completed trips yet — finish a loop to archive it here.
            </p>
          ) : (
            <div className="flex gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {previousTrips.slice(0, 8).map((t, i) => (
                <Link
                  key={t.id}
                  href={`/trips/${t.id}`}
                  style={{ animationDelay: `${100 + i * 55}ms` }}
                  className={`travel-card-lift travel-animate-in flex w-[min(85vw,15rem)] shrink-0 flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl shadow-stone-900/10`}
                >
                  <div className="relative min-h-[11rem] flex-1 bg-gradient-to-br from-stone-800 via-stone-700 to-amber-900/70">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(250,204,21,0.35),transparent_55%)]" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--travel-accent)]">
                        Archived
                      </p>
                      <p className="mt-1 line-clamp-2 text-lg font-semibold text-white">
                        {(t.place ?? "").trim() || t.title}
                      </p>
                      <p className="mt-1 text-[11px] text-stone-200">{t.title}</p>
                    </div>
                  </div>
                  <div className="space-y-1 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-stone-500">
                      {t.start_date && t.end_date ? `${t.start_date} → ${t.end_date}` : "Dates TBC"}
                    </p>
                    <p className="text-xs text-stone-600 line-clamp-3">
                      Open the trip for activities, budget, and notes.
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[color-mix(in_oklab,var(--travel-paper)_94%,white)] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="travel-animate-in travel-delay-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--travel-charcoal)]">
                Your itinerary snapshots
              </h2>
              <p className="mt-2 max-w-lg text-sm text-stone-600">
                Filtered list respects search, lifecycle, grouping, and sort — expand any row for full detail.
              </p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-300 bg-white/80 px-4 py-8 text-center text-sm text-stone-600">
              Nothing matches — loosen filters or start a new loop.
            </p>
          ) : grouped ? (
            <div className="space-y-10">
              {grouped.order.map((key) => {
                const rows = grouped.map.get(key);
                if (!rows?.length) return null;
                return (
                  <div key={key} className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">
                      {groupBy === "status"
                        ? tripLifecycleLabel(key as TripLifecycle)
                        : key}
                    </h3>
                    <div className="space-y-5">
                      {rows.map((trip) => (
                        <TripItineraryCollapsible key={trip.id} trip={trip} todayIso={todayIso} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-5">
              {filtered.map((trip) => (
                <TripItineraryCollapsible key={trip.id} trip={trip} todayIso={todayIso} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Link
        href="/trips/new"
        className="travel-fab fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-[var(--travel-accent)] px-5 py-3 text-sm font-bold uppercase tracking-wide text-stone-900 shadow-2xl shadow-amber-900/35 outline-none ring-[var(--travel-charcoal)]/10 transition hover:-translate-y-1 hover:brightness-105 focus-visible:ring-4 active:translate-y-0"
      >
        <span className="text-lg leading-none">+</span>
        Plan a trip
      </Link>
    </>
  );
}
