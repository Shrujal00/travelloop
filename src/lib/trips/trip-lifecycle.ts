/** Trip bucket from trip-level start/end dates (YYYY-MM-DD), compared to `todayIso` (UTC date). */
export type TripLifecycle = "ongoing" | "upcoming" | "completed" | "undated";

export function tripLifecycleBucket(
  start_date: string | null,
  end_date: string | null,
  todayIso: string
): TripLifecycle {
  const t = todayIso.slice(0, 10);
  if (!start_date || !end_date) return "undated";
  const s = String(start_date).slice(0, 10);
  const e = String(end_date).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !/^\d{4}-\d{2}-\d{2}$/.test(e)) return "undated";
  if (e < t) return "completed";
  if (s > t) return "upcoming";
  if (s <= t && e >= t) return "ongoing";
  return "completed";
}

export function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function tripLifecycleLabel(life: TripLifecycle): string {
  switch (life) {
    case "ongoing":
      return "Ongoing";
    case "upcoming":
      return "Upcoming";
    case "completed":
      return "Completed";
    case "undated":
      return "Dates TBD";
  }
}
