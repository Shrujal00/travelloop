/** Pure helpers for Phase C itinerary view (day buckets, UTC date strings). */

export type SourceActivity = {
  id: string;
  title: string;
  starts_at: string | null;
  cost: number | null;
};

export type SourceStop = {
  id: string;
  sort_order: number;
  city_name: string;
  start_date: string | null;
  end_date: string | null;
  activities: SourceActivity[];
};

function ymdFromAny(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const m = String(raw).trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

export function parseISODateOnly(ymd: string): Date {
  const m = ymd.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return new Date(NaN);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export function formatISODateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function clampYmd(day: string, min: string, max: string): string {
  if (day < min) return min;
  if (day > max) return max;
  return day;
}

export function eachDateInclusiveUTC(startYmd: string, endYmd: string): string[] {
  const out: string[] = [];
  const s = parseISODateOnly(startYmd);
  const e = parseISODateOnly(endYmd);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || s > e) return out;
  for (let t = s.getTime(); t <= e.getTime(); t += 86_400_000) {
    out.push(formatISODateOnly(new Date(t)));
  }
  return out;
}

function activityBucketYmd(
  activity: SourceActivity,
  stop: SourceStop,
  tripStart: string,
  tripEnd: string
): string {
  if (activity.starts_at) {
    const d = new Date(activity.starts_at);
    if (!Number.isNaN(d.getTime())) {
      return clampYmd(d.toISOString().slice(0, 10), tripStart, tripEnd);
    }
  }
  const stopStart = ymdFromAny(stop.start_date) ?? tripStart;
  return clampYmd(stopStart, tripStart, tripEnd);
}

/** Calendar day (yyyy-mm-dd) an activity’s cost attributes to for budget (matches itinerary day buckets). */
export function tripBudgetDayForActivity(
  activity: Pick<SourceActivity, "starts_at">,
  stop: Pick<SourceStop, "start_date" | "end_date">,
  tripStart: string,
  tripEnd: string
): string {
  return activityBucketYmd(activity as SourceActivity, stop as SourceStop, tripStart, tripEnd);
}

function stopCoversDay(day: string, stop: SourceStop, tripStart: string, tripEnd: string): boolean {
  const s = clampYmd(ymdFromAny(stop.start_date) ?? tripStart, tripStart, tripEnd);
  const e = clampYmd(ymdFromAny(stop.end_date) ?? tripEnd, tripStart, tripEnd);
  return s <= day && day <= e;
}

export type ItineraryActivityVM = {
  id: string;
  title: string;
  starts_at: string | null;
  cost: number | null;
  stopCity: string;
  stop_sort_order: number;
};

export type ItineraryDayVM = {
  date: string;
  weekdayLabel: string;
  cityHeader: string;
  activities: ItineraryActivityVM[];
};

export function buildItineraryDays(
  tripStart: string | null,
  tripEnd: string | null,
  tripPlace: string | null,
  stops: SourceStop[]
): ItineraryDayVM[] {
  const ts = ymdFromAny(tripStart);
  const te = ymdFromAny(tripEnd);
  if (!ts || !te) return [];

  const sortedStops = [...stops].sort((a, b) => a.sort_order - b.sort_order);

  const enriched: (ItineraryActivityVM & { bucket: string })[] = [];
  for (const stop of sortedStops) {
    for (const a of stop.activities) {
      const bucket = activityBucketYmd(a, stop, ts, te);
      enriched.push({
        id: a.id,
        title: a.title,
        starts_at: a.starts_at,
        cost: a.cost,
        stopCity: stop.city_name,
        stop_sort_order: stop.sort_order,
        bucket,
      });
    }
  }

  const days = eachDateInclusiveUTC(ts, te);
  const fallbackCity = tripPlace?.trim() || "Trip";

  return days.map((date) => {
    const d = parseISODateOnly(date);
    const weekdayLabel = d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });

    const covering = sortedStops.filter((s) => stopCoversDay(date, s, ts, te));
    const cityHeader =
      covering.length > 0
        ? [...covering].sort((a, b) => a.sort_order - b.sort_order)[0]!.city_name
        : fallbackCity;

    const acts = enriched
      .filter((x) => x.bucket === date)
      .sort((a, b) => {
        if (a.starts_at && b.starts_at) {
          return a.starts_at.localeCompare(b.starts_at) || a.title.localeCompare(b.title);
        }
        if (a.starts_at) return -1;
        if (b.starts_at) return 1;
        return a.stop_sort_order - b.stop_sort_order || a.title.localeCompare(b.title);
      })
      .map((row) => {
        const { bucket, ...rest } = row;
        void bucket;
        return rest;
      });

    return {
      date,
      weekdayLabel,
      cityHeader,
      activities: acts,
    };
  });
}

export type CalendarCell =
  | { kind: "empty" }
  | { kind: "day"; date: string; activityCount: number; inTrip: boolean };

/** Sunday-first month-style grid covering trip start → end (pads leading/trailing cells). */
export function buildCalendarCells(
  tripStart: string | null,
  tripEnd: string | null,
  activityCountByDay: Map<string, number>
): CalendarCell[] {
  const ts = ymdFromAny(tripStart);
  const te = ymdFromAny(tripEnd);
  if (!ts || !te) return [];

  const days = eachDateInclusiveUTC(ts, te);
  const startDow = parseISODateOnly(days[0]!).getUTCDay();
  const cells: CalendarCell[] = [];
  for (let i = 0; i < startDow; i++) {
    cells.push({ kind: "empty" });
  }
  for (const date of days) {
    cells.push({
      kind: "day",
      date,
      activityCount: activityCountByDay.get(date) ?? 0,
      inTrip: true,
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ kind: "empty" });
  }
  return cells;
}
