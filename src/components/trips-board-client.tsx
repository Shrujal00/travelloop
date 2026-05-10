"use client";

import { TripDeleteForm } from "@/app/trips/trip-delete-form";
import {
  TripItineraryCollapsible,
  type DashboardTripForCollapsible,
} from "@/components/trip-itinerary-collapsible";
import { tripLifecycleBucket, type TripLifecycle } from "@/lib/trips/trip-lifecycle";
import Link from "next/link";
import { useMemo, useState } from "react";

const controlClass =
  "rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-[var(--travel-accent)] focus:ring-1 focus:ring-[var(--travel-accent)]/40";

type SortKey = "created_desc" | "start_asc" | "start_desc" | "title_asc";
type GroupKey = "status" | "list";
type FilterKey = "all" | TripLifecycle;

function stopCities(trip: DashboardTripForCollapsible): string {
  const raw = trip.trip_stops;
  if (!Array.isArray(raw)) return "";
  return raw
    .map((row) => {
      const r = row as Record<string, unknown>;
      return String(r.city_name ?? "").toLowerCase();
    })
    .join(" ");
}

function matchesSearch(trip: DashboardTripForCollapsible, q: string): boolean {
  if (!q.trim()) return true;
  const n = q.trim().toLowerCase();
  const title = (trip.title ?? "").toLowerCase();
  const place = (trip.place ?? "").toLowerCase();
  return title.includes(n) || place.includes(n) || stopCities(trip).includes(n);
}

function sortTrips(trips: DashboardTripForCollapsible[], sort: SortKey): DashboardTripForCollapsible[] {
  const copy = [...trips];
  switch (sort) {
    case "start_asc":
      return copy.sort((a, b) => {
        const as = a.start_date ?? "";
        const bs = b.start_date ?? "";
        const c = as.localeCompare(bs);
        return c !== 0 ? c : a.title.localeCompare(b.title);
      });
    case "start_desc":
      return copy.sort((a, b) => {
        const as = a.start_date ?? "";
        const bs = b.start_date ?? "";
        const c = bs.localeCompare(as);
        return c !== 0 ? c : a.title.localeCompare(b.title);
      });
    case "title_asc":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "created_desc":
    default:
      return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}

function TripRowActions({ tripId }: { tripId: string }) {
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 px-3 py-2">
      <Link
        href={`/trips/${tripId}`}
        className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-800 transition hover:bg-stone-50"
      >
        View
      </Link>
      <Link
        href={`/trips/${tripId}/edit`}
        className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-800 transition hover:bg-stone-50"
      >
        Edit
      </Link>
      <TripDeleteForm tripId={tripId} />
    </div>
  );
}

function Column({
  title,
  subtitle,
  trips,
  todayIso,
}: {
  title: string;
  subtitle: string;
  trips: DashboardTripForCollapsible[];
  todayIso: string;
}) {
  return (
    <div className="flex min-h-[12rem] flex-col rounded-2xl border-2 border-stone-800/10 bg-white shadow-sm">
      <div className="border-b border-stone-100 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{title}</p>
        <p className="mt-0.5 text-xs text-stone-500">{subtitle}</p>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        {trips.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50/80 px-3 py-6 text-center text-sm text-stone-500">
            No trips here yet.
          </p>
        ) : (
          trips.map((t) => (
            <div key={t.id} className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50/40">
              <TripItineraryCollapsible trip={t} todayIso={todayIso} />
              <TripRowActions tripId={t.id} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function TripsBoardClient({
  trips,
  todayIso,
}: {
  trips: DashboardTripForCollapsible[];
  todayIso: string;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("created_desc");
  const [group, setGroup] = useState<GroupKey>("status");
  const [filter, setFilter] = useState<FilterKey>("all");

  const filteredSorted = useMemo(() => {
    let list = trips.filter((t) => matchesSearch(t, search));
    if (filter !== "all") {
      list = list.filter((t) => tripLifecycleBucket(t.start_date, t.end_date, todayIso) === filter);
    }
    return sortTrips(list, sort);
  }, [trips, search, sort, filter, todayIso]);

  const buckets = useMemo(() => {
    const ongoing: DashboardTripForCollapsible[] = [];
    const upcoming: DashboardTripForCollapsible[] = [];
    const completed: DashboardTripForCollapsible[] = [];
    const undated: DashboardTripForCollapsible[] = [];
    for (const t of filteredSorted) {
      const b = tripLifecycleBucket(t.start_date, t.end_date, todayIso);
      if (b === "ongoing") ongoing.push(t);
      else if (b === "upcoming") upcoming.push(t);
      else if (b === "completed") completed.push(t);
      else undated.push(t);
    }
    return { ongoing, upcoming, completed, undated };
  }, [filteredSorted, todayIso]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="min-w-0 flex-1">
          <label className="text-xs font-medium text-stone-600" htmlFor="trip-search">
            Search
          </label>
          <input
            id="trip-search"
            type="search"
            placeholder="Title, destination, or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${controlClass} mt-1 w-full`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div>
            <label className="text-xs font-medium text-stone-600" htmlFor="trip-group">
              Group by
            </label>
            <select
              id="trip-group"
              value={group}
              onChange={(e) => setGroup(e.target.value as GroupKey)}
              className={`${controlClass} mt-1 min-w-[9.5rem]`}
            >
              <option value="status">Status (columns)</option>
              <option value="list">Single list</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600" htmlFor="trip-filter">
              Filter
            </label>
            <select
              id="trip-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterKey)}
              className={`${controlClass} mt-1 min-w-[9.5rem]`}
            >
              <option value="all">All</option>
              <option value="ongoing">Ongoing</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="undated">Dates TBD</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-600" htmlFor="trip-sort">
              Sort by
            </label>
            <select
              id="trip-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className={`${controlClass} mt-1 min-w-[10.5rem]`}
            >
              <option value="created_desc">Newest first</option>
              <option value="start_asc">Trip start (earliest)</option>
              <option value="start_desc">Trip start (latest)</option>
              <option value="title_asc">Title A–Z</option>
            </select>
          </div>
        </div>
      </div>

      {group === "status" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Column
            title="Ongoing"
            subtitle="Today falls inside the trip window."
            trips={buckets.ongoing}
            todayIso={todayIso}
          />
          <Column
            title="Upcoming"
            subtitle="Trip starts in the future."
            trips={[...buckets.upcoming, ...buckets.undated]}
            todayIso={todayIso}
          />
          <Column title="Completed" subtitle="Trip ended before today." trips={buckets.completed} todayIso={todayIso} />
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredSorted.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-stone-300 bg-white/80 px-6 py-12 text-center text-stone-500">
              No trips match your search or filters.
            </li>
          ) : (
            filteredSorted.map((t) => (
              <li key={t.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <TripItineraryCollapsible trip={t} todayIso={todayIso} />
                <TripRowActions tripId={t.id} />
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
