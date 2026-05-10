"use client";

import {
  hitToSaved,
  stringifySavedDestinations,
  type SavedDestination,
} from "@/lib/profiles/saved-destination";
import { getCountryOptions } from "@/lib/places/countries";
import type { PlaceSearchHit } from "@/lib/places/types";
import { useCallback, useEffect, useMemo, useState } from "react";

const ctl =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-[var(--travel-accent)] focus:ring-1 focus:ring-[var(--travel-accent)]/40";

export function SavedDestinationsEditor({
  initial,
}: {
  initial: SavedDestination[];
}) {
  const [list, setList] = useState<SavedDestination[]>(() => initial.slice(0, 24));
  const [country, setCountry] = useState("");
  const [draft, setDraft] = useState("");
  const [hits, setHits] = useState<PlaceSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const countryOptions = useMemo(() => getCountryOptions(), []);

  function removeAt(i: number) {
    setList((prev) => prev.filter((_, idx) => idx !== i));
  }

  function pickHit(hit: PlaceSearchHit) {
    const row = hitToSaved(hit);
    setList((prev) => {
      const key = row.external_place_id || `${row.city_name}|${row.country}|${row.lat}|${row.lng}`;
      const deduped = prev.filter((p) => {
        const k = p.external_place_id || `${p.city_name}|${p.country}|${p.lat}|${p.lng}`;
        return k !== key;
      });
      return [...deduped, row].slice(0, 24);
    });
    setOpen(false);
    setHits([]);
  }

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: q.trim().slice(0, 120) });
      if (country) params.set("country", country);
      const res = await fetch(`/api/places/search?${params}`, { credentials: "include" });
      const data = (await res.json()) as { results?: PlaceSearchHit[] };
      setHits(Array.isArray(data.results) ? data.results : []);
    } catch {
      setHits([]);
    } finally {
      setLoading(false);
    }
  }, [country]);

  useEffect(() => {
    const q = draft.trim();
    if (q.length < 2) {
      const id = window.setTimeout(() => {
        setHits([]);
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => {
      void runSearch(q);
    }, 280);
    return () => window.clearTimeout(id);
  }, [draft, runSearch]);

  return (
    <div className="space-y-3">
      <input type="hidden" name="saved_destinations" value={stringifySavedDestinations(list)} readOnly />

      {list.length === 0 ? (
        <p className="text-sm text-stone-500">No saved cities yet — search below to pin destinations.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {list.map((d, i) => (
            <li
              key={`${d.external_place_id ?? d.city_name}-${i}`}
              className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-800"
            >
              <span>{d.city_name}</span>
              {d.country ? <span className="text-stone-500">{d.country}</span> : null}
              <button
                type="button"
                className="ml-1 rounded-full px-1 text-stone-400 hover:bg-stone-200 hover:text-stone-800"
                aria-label={`Remove ${d.city_name}`}
                onClick={() => removeAt(i)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative space-y-2 rounded-xl border border-stone-200 bg-stone-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Add a city</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-stone-600">
            Country filter
            <select className={ctl} value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">Any</option>
              {countryOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-stone-600">
            Search
            <input
              className={ctl}
              value={draft}
              placeholder="Type at least 2 characters…"
              onChange={(e) => {
                setDraft(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              autoComplete="off"
            />
          </label>
        </div>
        {loading ? <p className="text-xs text-stone-500">Searching…</p> : null}
        {open && hits.length > 0 ? (
          <ul className="absolute left-4 right-4 top-full z-20 mt-1 max-h-56 overflow-auto rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
            {hits.map((h) => (
              <li key={h.external_place_id}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-stone-50"
                  onClick={() => pickHit(h)}
                >
                  <span className="font-medium text-stone-900">{h.city_name}</span>
                  <span className="text-xs text-stone-500">{h.subtitle}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
