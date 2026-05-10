"use client";

import { getCountryOptions } from "@/lib/places/countries";
import type { PlaceFieldDefaults, PlaceSearchHit } from "@/lib/places/types";
import { useEffect, useMemo, useRef, useState } from "react";

const fieldClass =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-[var(--travel-accent)] focus:ring-1 focus:ring-[var(--travel-accent)]/40";

export type PlaceSearchLabels = {
  country: string;
  city: string;
  countryHint: string;
};

const defaultLabels: PlaceSearchLabels = {
  country: "Country filter",
  city: "City or place",
  countryHint: "Narrows search results. You can still type any city name.",
};

type PlaceSearchFieldsProps = {
  inputId: string;
  countrySelectId: string;
  defaults: PlaceFieldDefaults;
  /** Form field name for the main text input (default `city_name`; use `place` on new/edit trip forms). */
  cityNameField?: string;
  /** Replaces styling for country `<select>` and city `<input>` (e.g. new trip wireframe borders). */
  controlClassName?: string;
  /** Override visible labels / hint copy. */
  labels?: Partial<PlaceSearchLabels>;
};

export function PlaceSearchFields({
  inputId,
  countrySelectId,
  defaults,
  cityNameField = "city_name",
  controlClassName,
  labels: labelsProp,
}: PlaceSearchFieldsProps) {
  const countryOptions = useMemo(() => getCountryOptions(), []);
  const ctl = controlClassName ?? fieldClass;
  const labels = { ...defaultLabels, ...labelsProp };
  const [countryVal, setCountryVal] = useState(() => defaults.country ?? "");
  const [cityDraft, setCityDraft] = useState(() => defaults.city_name);
  const [meta, setMeta] = useState(() => ({
    region: defaults.region,
    lat: defaults.lat,
    lng: defaults.lng,
    external_place_id: defaults.external_place_id,
  }));
  const [hits, setHits] = useState<PlaceSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  useEffect(() => {
    const q = cityDraft.trim();
    if (q.length < 2) {
      const clearId = window.setTimeout(() => {
        setHits([]);
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(clearId);
    }

    const t = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q });
        if (countryVal) params.set("country", countryVal);
        const res = await fetch(`/api/places/search?${params.toString()}`);
        if (!res.ok) {
          setHits([]);
          return;
        }
        const data = (await res.json()) as { results?: PlaceSearchHit[] };
        setHits(Array.isArray(data.results) ? data.results : []);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 320);

    return () => window.clearTimeout(t);
  }, [cityDraft, countryVal]);

  function applyHit(hit: PlaceSearchHit) {
    setCityDraft(hit.city_name);
    if (hit.country) setCountryVal(hit.country);
    setMeta({
      region: hit.region,
      lat: hit.lat,
      lng: hit.lng,
      external_place_id: hit.external_place_id,
    });
    setOpen(false);
  }

  function onCityInput(v: string) {
    setCityDraft(v);
    setOpen(true);
    setMeta((m) =>
      m.external_place_id
        ? { region: null, lat: null, lng: null, external_place_id: null }
        : { ...m }
    );
  }

  return (
    <div ref={wrapRef} className="space-y-3">
      <div>
        <label className="text-xs font-medium text-stone-600" htmlFor={countrySelectId}>
          {labels.country}
        </label>
        <select
          id={countrySelectId}
          name="country"
          value={countryVal}
          onChange={(e) => {
            setCountryVal(e.target.value);
            setOpen(true);
          }}
          className={ctl}
        >
          <option value="">All countries</option>
          {countryOptions.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-stone-500">{labels.countryHint}</p>
      </div>

      <div className="relative">
        <label className="text-xs font-medium text-stone-600" htmlFor={inputId}>
          {labels.city}
        </label>
        <input
          id={inputId}
          name={cityNameField}
          required
          maxLength={200}
          autoComplete="off"
          value={cityDraft}
          onChange={(e) => onCityInput(e.target.value)}
          onFocus={() => setOpen(true)}
          className={ctl}
        />
        <input type="hidden" name="region" value={meta.region ?? ""} readOnly />
        <input
          type="hidden"
          name="lat"
          value={meta.lat != null && Number.isFinite(meta.lat) ? String(meta.lat) : ""}
          readOnly
        />
        <input
          type="hidden"
          name="lng"
          value={meta.lng != null && Number.isFinite(meta.lng) ? String(meta.lng) : ""}
          readOnly
        />
        <input type="hidden" name="external_place_id" value={meta.external_place_id ?? ""} readOnly />

        {open && cityDraft.trim().length >= 2 ? (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
            {loading ? (
              <p className="px-3 py-2 text-xs text-stone-500">Searching…</p>
            ) : hits.length === 0 ? (
              <p className="px-3 py-2 text-xs text-stone-500">No matches — keep typing or adjust country.</p>
            ) : (
              hits.map((h, i) => (
                <button
                  key={`${h.external_place_id}-${i}`}
                  type="button"
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-stone-50"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyHit(h)}
                >
                  <span className="font-medium text-stone-900">{h.city_name}</span>
                  {h.subtitle ? (
                    <span className="text-xs text-stone-500">{h.subtitle}</span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
