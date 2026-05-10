"use client";

import { addSuggestedActivity } from "@/lib/trips/build-actions";
import type {
  ActivitySuggestion,
  ActivitySuggestionFamily,
  SuggestionsApiResponse,
} from "@/lib/activities/suggestion-types";
import Link from "next/link";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";

const FAMILY_LABEL: Record<ActivitySuggestionFamily, string> = {
  culture: "Culture",
  outdoors: "Outdoors",
  food_drink: "Food & drink",
  other: "Other",
};

type GroupMode = "none" | "family";
type SortKey = "distance" | "name" | "kind";

function useDebouncedValue<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function DiscoverClient({
  tripId,
  stopId,
  tripTitle,
  stopCityName,
  initialError,
}: {
  tripId: string;
  stopId: string;
  tripTitle: string;
  stopCityName: string;
  initialError: string | null;
}) {
  const [raw, setRaw] = useState<ActivitySuggestion[]>([]);
  const [centroidNote, setCentroidNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 120);
  const [groupMode, setGroupMode] = useState<GroupMode>("none");
  const [filterFamily, setFilterFamily] = useState<ActivitySuggestionFamily | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("distance");

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(
        `/api/activities/suggestions?trip_id=${encodeURIComponent(tripId)}&stop_id=${encodeURIComponent(stopId)}`,
        { credentials: "same-origin" }
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setFetchError(j.error ?? `Request failed (${res.status})`);
        setRaw([]);
        setCentroidNote(null);
        return;
      }
      const body = (await res.json()) as SuggestionsApiResponse;
      setRaw(body.suggestions);
      setCentroidNote(body.centroidNote ?? null);
    } catch {
      setFetchError("Network error while loading suggestions.");
      setRaw([]);
      setCentroidNote(null);
    } finally {
      setLoading(false);
    }
  }, [tripId, stopId]);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  const filtered = useMemo(() => {
    let list = [...raw];
    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (filterFamily !== "all") {
      list = list.filter((s) => s.family === filterFamily);
    }
    list.sort((a, b) => {
      if (sortKey === "distance") {
        return a.distanceM - b.distanceM || a.name.localeCompare(b.name);
      }
      if (sortKey === "name") {
        return a.name.localeCompare(b.name);
      }
      return a.primaryKind.localeCompare(b.primaryKind) || a.distanceM - b.distanceM;
    });
    return list;
  }, [raw, debouncedSearch, filterFamily, sortKey]);

  const groupedSections = useMemo(() => {
    if (groupMode === "none") {
      return [{ key: "all", label: null as string | null, items: filtered }];
    }
    const keys: ActivitySuggestionFamily[] = ["culture", "outdoors", "food_drink", "other"];
    return keys.map((k) => ({
      key: k,
      label: FAMILY_LABEL[k],
      items: filtered.filter((s) => s.family === k),
    }));
  }, [filtered, groupMode]);

  const fieldClass =
    "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-[var(--travel-accent)] focus:ring-1 focus:ring-[var(--travel-accent)]/40";

  const alertError = initialError || fetchError;

  return (
    <div className="space-y-6">
      {alertError ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {alertError}
        </p>
      ) : null}

      {centroidNote ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {centroidNote}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border-2 border-stone-800/12 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[12rem] flex-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-500" htmlFor="disc-search">
            Search
          </label>
          <input
            id="disc-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name…"
            className={fieldClass}
            autoComplete="off"
          />
        </div>
        <div className="w-full min-w-[10rem] sm:w-40">
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-500" htmlFor="disc-group">
            Group by
          </label>
          <select
            id="disc-group"
            value={groupMode}
            onChange={(e) => setGroupMode(e.target.value as GroupMode)}
            className={fieldClass}
          >
            <option value="none">None</option>
            <option value="family">Category family</option>
          </select>
        </div>
        <div className="w-full min-w-[10rem] sm:w-44">
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-500" htmlFor="disc-filter">
            Filter
          </label>
          <select
            id="disc-filter"
            value={filterFamily}
            onChange={(e) => setFilterFamily(e.target.value as ActivitySuggestionFamily | "all")}
            className={fieldClass}
          >
            <option value="all">All categories</option>
            <option value="culture">{FAMILY_LABEL.culture}</option>
            <option value="outdoors">{FAMILY_LABEL.outdoors}</option>
            <option value="food_drink">{FAMILY_LABEL.food_drink}</option>
            <option value="other">{FAMILY_LABEL.other}</option>
          </select>
        </div>
        <div className="w-full min-w-[10rem] sm:w-40">
          <label className="text-xs font-semibold uppercase tracking-wide text-stone-500" htmlFor="disc-sort">
            Sort
          </label>
          <select
            id="disc-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className={fieldClass}
          >
            <option value="distance">Distance</option>
            <option value="name">Name A–Z</option>
            <option value="kind">Kind</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-stone-600">Loading nearby ideas from OpenStreetMap…</p>
      ) : fetchError && raw.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-5 text-sm text-amber-950">
          <p className="font-medium">We couldn&apos;t load suggestions.</p>
          <p className="mt-2 text-amber-900/90">{fetchError}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg bg-[var(--travel-accent)] px-3 py-2 text-xs font-semibold text-stone-900 hover:brightness-[0.98]"
            >
              Try again
            </button>
            <Link
              href={`/trips/${tripId}/build`}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50"
            >
              Add manually in builder
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-5 text-sm text-stone-700">
          <p className="font-medium text-stone-900">No matches in this area.</p>
          <p className="mt-2">Try clearing filters, widening your search text, or add an activity manually.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50"
            >
              Refresh list
            </button>
            <Link
              href={`/trips/${tripId}/build`}
              className="rounded-lg bg-[var(--travel-accent)] px-3 py-2 text-xs font-semibold text-stone-900 hover:brightness-[0.98]"
            >
              Add manually in builder
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedSections.map((sec) =>
            sec.items.length === 0 && groupMode !== "none" ? null : (
              <section key={sec.key} className="space-y-3">
                {sec.label ? (
                  <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">{sec.label}</h2>
                ) : null}
                <ul className="space-y-3">
                  {sec.items.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-2xl border-2 border-stone-800/10 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-bold tracking-tight text-[var(--travel-charcoal)]">{s.name}</p>
                          {s.wikipediaTitle ? (
                            <p className="mt-1 text-xs text-stone-500">
                              Wikipedia: <span className="font-medium text-stone-700">{s.wikipediaTitle}</span>
                            </p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            <span className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 font-semibold text-stone-700">
                              {s.primaryKind}
                            </span>
                            <span className="text-stone-500">{s.distanceM} m</span>
                          </div>
                        </div>
                        <form action={addSuggestedActivity} className="shrink-0">
                          <input type="hidden" name="trip_id" value={tripId} />
                          <input type="hidden" name="stop_id" value={stopId} />
                          <input type="hidden" name="title" value={s.name} />
                          <input type="hidden" name="category" value={s.primaryKind} />
                          <input type="hidden" name="external_ref" value={s.externalRef} />
                          <button
                            type="submit"
                            className="rounded-xl bg-[var(--travel-accent)] px-4 py-2 text-sm font-bold text-stone-900 shadow-[2px_2px_0_0_rgb(41,37,36)] hover:brightness-[0.98] active:translate-x-px active:translate-y-px active:shadow-none"
                          >
                            Add to itinerary
                          </button>
                        </form>
                      </div>
                      <p className="mt-3 text-[11px] leading-relaxed text-stone-400">
                        Map data ©{" "}
                        <a
                          href="https://www.openstreetmap.org/copyright"
                          className="underline underline-offset-2"
                          target="_blank"
                          rel="noreferrer"
                        >
                          OpenStreetMap
                        </a>{" "}
                        contributors, ODbL.
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )
          )}
        </div>
      )}

      <p className="text-center text-xs text-stone-500">
        Trip: <span className="font-medium text-stone-700">{tripTitle}</span>
        {" · "}
        Stop: <span className="font-medium text-stone-700">{stopCityName}</span>
      </p>
    </div>
  );
}
