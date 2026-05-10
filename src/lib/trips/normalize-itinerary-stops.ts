import type { SourceActivity, SourceStop } from "@/lib/trips/itinerary-day-buckets";

/** Normalize nested `trip_stops` / `trip_activities` from Supabase trip rows. */
export function normalizeStopsForItinerary(raw: unknown): SourceStop[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const r = row as Record<string, unknown>;
      const actsRaw = r.trip_activities;
      const actsArr = Array.isArray(actsRaw) ? actsRaw : [];
      const activities: SourceActivity[] = actsArr.map((a) => {
        const ar = a as Record<string, unknown>;
        const costRaw = ar.cost;
        const cost =
          costRaw == null || costRaw === ""
            ? null
            : typeof costRaw === "number"
              ? costRaw
              : Number(costRaw);
        return {
          id: String(ar.id ?? ""),
          title: String(ar.title ?? ""),
          starts_at: ar.starts_at != null ? String(ar.starts_at) : null,
          cost: Number.isFinite(cost as number) ? (cost as number) : null,
        };
      });
      return {
        id: String(r.id ?? ""),
        sort_order: typeof r.sort_order === "number" ? r.sort_order : Number(r.sort_order ?? 0),
        city_name: String(r.city_name ?? "").trim() || "Untitled stop",
        start_date: r.start_date != null ? String(r.start_date) : null,
        end_date: r.end_date != null ? String(r.end_date) : null,
        activities,
      };
    })
    .filter((s) => s.id.length > 0)
    .sort((a, b) => a.sort_order - b.sort_order);
}
