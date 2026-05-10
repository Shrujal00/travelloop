"use client";

import type { CalendarCell, ItineraryDayVM } from "@/lib/trips/itinerary-day-buckets";
import Link from "next/link";
import { useMemo, useState } from "react";

type ViewMode = "list" | "calendar";

export function ItineraryViewClient({
  tripId,
  tripTitle,
  tripStart,
  tripEnd,
  days,
  calendarCells,
}: {
  tripId: string;
  tripTitle: string;
  tripStart: string;
  tripEnd: string;
  days: ItineraryDayVM[];
  calendarCells: CalendarCell[];
}) {
  const [mode, setMode] = useState<ViewMode>("list");

  const monthHeading = useMemo(() => {
    const s = new Date(`${tripStart}T12:00:00.000Z`);
    const e = new Date(`${tripEnd}T12:00:00.000Z`);
    const same =
      s.getUTCFullYear() === e.getUTCFullYear() && s.getUTCMonth() === e.getUTCMonth();
    if (same) {
      return s.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
    }
    return `${s.toLocaleDateString(undefined, { month: "short", year: "numeric", timeZone: "UTC" })} – ${e.toLocaleDateString(undefined, { month: "short", year: "numeric", timeZone: "UTC" })}`;
  }, [tripStart, tripEnd]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600">
          <span className="font-semibold text-stone-800">{tripTitle}</span>
          <span className="mx-1.5 text-stone-400">·</span>
          {tripStart} → {tripEnd}
        </p>
        <div
          className="inline-flex rounded-xl border-2 border-stone-800/12 bg-stone-100/80 p-1"
          role="tablist"
          aria-label="Itinerary view mode"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "list"}
            className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
              mode === "list"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
            onClick={() => setMode("list")}
          >
            List view
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "calendar"}
            className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
              mode === "calendar"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
            onClick={() => setMode("calendar")}
          >
            Calendar view
          </button>
        </div>
      </div>

      {mode === "list" ? (
        <ol className="relative space-y-0 border-l-2 border-stone-200 pl-6 sm:pl-8">
          {days.map((day) => (
            <li key={day.date} className="relative pb-10 last:pb-0">
              <span
                className="absolute -left-[calc(0.5rem+5px)] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--travel-accent)] shadow sm:-left-[calc(1rem+5px)]"
                aria-hidden
              />
              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
                      {day.weekdayLabel}
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-[var(--travel-charcoal)]">{day.date}</p>
                  </div>
                  <p className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                    {day.cityHeader}
                  </p>
                </div>
                {day.activities.length === 0 ? (
                  <p className="mt-3 text-sm text-stone-500">
                    No activities on this day — add some in the builder (times optional).
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {day.activities.map((a) => (
                      <li
                        key={a.id}
                        className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-stone-100 bg-stone-50/90 px-3 py-2.5 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900">{a.title}</p>
                          <p className="mt-0.5 text-xs text-stone-500">
                            {a.stopCity}
                            {a.starts_at ? (
                              <>
                                {" · "}
                                {new Date(a.starts_at).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </>
                            ) : null}
                          </p>
                        </div>
                        {a.cost != null && Number.isFinite(a.cost) ? (
                          <span className="shrink-0 text-sm font-semibold text-stone-800">
                            ${a.cost.toFixed(2)}
                          </span>
                        ) : (
                          <span className="shrink-0 text-xs text-stone-400">—</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-stone-800">{monthHeading}</h2>
          <p className="mt-1 text-xs text-stone-500">
            Sunday-start week grid. Dots reflect activities on that day (including items without a time,
            placed on the stop start date).
          </p>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-stone-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarCells.map((cell, i) => {
              if (cell.kind === "empty") {
                return <div key={`e-${i}`} className="aspect-square rounded-lg bg-stone-50/50" />;
              }
              const dayNum = cell.date.slice(8, 10).replace(/^0/, "");
              return (
                <div
                  key={cell.date}
                  className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-xs font-semibold ${
                    cell.inTrip
                      ? "border-stone-200 bg-white text-stone-900 shadow-sm"
                      : "border-transparent text-stone-400"
                  }`}
                >
                  <span>{dayNum}</span>
                  {cell.activityCount > 0 ? (
                    <span className="mt-0.5 flex h-1.5 w-1.5 rounded-full bg-[var(--travel-charcoal)]" title={`${cell.activityCount} activities`} />
                  ) : (
                    <span className="mt-0.5 h-1.5 w-1.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-center text-sm text-stone-500">
        <Link href={`/trips/${tripId}`} className="font-medium text-stone-700 underline-offset-4 hover:underline">
          ← Trip overview
        </Link>
        {" · "}
        <Link
          href={`/trips/${tripId}/build`}
          className="font-medium text-stone-700 underline-offset-4 hover:underline"
        >
          Edit in builder
        </Link>
      </p>
    </div>
  );
}
