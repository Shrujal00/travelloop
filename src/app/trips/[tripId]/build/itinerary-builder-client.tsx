"use client";

import { PlaceSearchFields } from "@/components/place-search-fields";
import {
  addTripActivity,
  addTripStop,
  deleteTripActivity,
  deleteTripStop,
  reorderTripStops,
  updateTripActivity,
  updateTripStop,
} from "@/lib/trips/build-actions";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

export type BuilderActivityRow = {
  id: string;
  title: string;
  starts_at: string | null;
  cost: number | null;
  category: string | null;
};

export type BuilderStopRow = {
  id: string;
  sort_order: number;
  city_name: string;
  country: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  external_place_id: string | null;
  start_date: string | null;
  end_date: string | null;
  trip_activities: BuilderActivityRow[];
};

export type BuilderTripPayload = {
  id: string;
  title: string;
  place: string | null;
  start_date: string | null;
  end_date: string | null;
  trip_stops: BuilderStopRow[];
};

/** `input type="date"` min/max/value must be `yyyy-MM-dd`; ISO timestamps break some browsers. */
function toDateInputValue(raw: string | null | undefined): string | undefined {
  if (raw == null) return undefined;
  const s = String(raw).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m && /^\d{4}-\d{2}-\d{2}$/.test(m[1]) ? m[1] : undefined;
}

function sumActivityCosts(activities: BuilderActivityRow[]): number {
  return activities.reduce((acc, a) => {
    const c = a.cost;
    const n = typeof c === "number" ? c : typeof c === "string" ? Number(c) : NaN;
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
}

function formatForDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const fieldClass =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-[var(--travel-accent)] focus:ring-1 focus:ring-[var(--travel-accent)]/40";

function SortableStopCard({
  stop,
  tripId,
  tripStart,
  tripEnd,
  canDeleteStop,
  sectionIndex,
}: {
  stop: BuilderStopRow;
  tripId: string;
  tripStart: string | undefined;
  tripEnd: string | undefined;
  canDeleteStop: boolean;
  sectionIndex: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stop.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
  };

  const ds = toDateInputValue(stop.start_date) ?? "—";
  const de = toDateInputValue(stop.end_date) ?? "—";
  const sectionBudget = sumActivityCosts(stop.trip_activities);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`list-none ${isDragging ? "opacity-95" : ""}`}
    >
      <div className="flex flex-wrap items-start gap-3">
        <button
          type="button"
          className="mt-2 flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-xl border-2 border-dashed border-stone-800/20 text-stone-500 hover:bg-stone-50 active:cursor-grabbing"
          aria-label="Reorder section"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <details
          className={`min-w-0 flex-1 rounded-2xl border-2 border-stone-800/12 bg-white shadow-[4px_4px_0_0_rgb(214,211,209)] ${isDragging ? "ring-2 ring-[var(--travel-accent)]/40" : ""}`}
          open={sectionIndex === 1}
        >
          <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between [&::-webkit-details-marker]:hidden">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">
                Section {sectionIndex}
              </p>
              <p className="mt-1 text-lg font-bold tracking-tight text-[var(--travel-charcoal)]">
                {stop.city_name}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <span className="inline-flex rounded-xl border-2 border-stone-800/12 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800">
                Date range: {ds} to {de}
              </span>
              <span className="inline-flex rounded-xl border-2 border-stone-800/12 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800">
                {sectionBudget > 0
                  ? `Budget (activities): $${sectionBudget.toFixed(2)}`
                  : "Budget: add activity costs"}
              </span>
            </div>
          </summary>
          <div className="space-y-4 border-t-2 border-stone-100 px-4 py-4">
          <form action={updateTripStop} className="space-y-3 border-b border-stone-100 pb-4">
            <input type="hidden" name="trip_id" value={tripId} />
            <input type="hidden" name="stop_id" value={stop.id} />
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              City & dates
            </p>
            <PlaceSearchFields
              key={`${stop.id}-${stop.city_name}-${stop.country ?? ""}-${stop.external_place_id ?? ""}-${stop.lat ?? ""}-${stop.lng ?? ""}`}
              inputId={`city-${stop.id}`}
              countrySelectId={`country-${stop.id}`}
              defaults={{
                city_name: stop.city_name,
                country: stop.country,
                region: stop.region,
                lat: stop.lat,
                lng: stop.lng,
                external_place_id: stop.external_place_id,
              }}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-stone-600" htmlFor={`sd-${stop.id}`}>
                  Start
                </label>
                <input
                  id={`sd-${stop.id}`}
                  name="start_date"
                  type="date"
                  required
                  min={tripStart}
                  max={tripEnd}
                  defaultValue={toDateInputValue(stop.start_date) ?? ""}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600" htmlFor={`ed-${stop.id}`}>
                  End
                </label>
                <input
                  id={`ed-${stop.id}`}
                  name="end_date"
                  type="date"
                  required
                  min={tripStart}
                  max={tripEnd}
                  defaultValue={toDateInputValue(stop.end_date) ?? ""}
                  className={fieldClass}
                />
              </div>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-[var(--travel-accent)] px-3 py-1.5 text-xs font-semibold text-stone-900 hover:brightness-[0.98]"
            >
              Save stop
            </button>
          </form>
          {canDeleteStop ? (
            <form
              action={deleteTripStop}
              className="flex border-b border-stone-100 pb-4"
              onSubmit={(e) => {
                if (!confirm("Remove this stop and its activities?")) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="trip_id" value={tripId} />
              <input type="hidden" name="stop_id" value={stop.id} />
              <button
                type="submit"
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                Remove stop
              </button>
            </form>
          ) : null}

          {canDeleteStop ? null : (
            <p className="text-xs text-stone-500">At least one stop is required for each trip.</p>
          )}

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Activities
              </p>
              <Link
                href={`/trips/${tripId}/stops/${stop.id}/discover`}
                className="text-xs font-bold text-[var(--travel-charcoal)] underline-offset-4 hover:underline"
              >
                Browse activity ideas
              </Link>
            </div>
            {stop.trip_activities.length === 0 ? (
              <p className="mt-2 text-sm text-stone-500">No activities yet — add one below.</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {stop.trip_activities.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-xl border border-stone-100 bg-stone-50/80 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-medium text-stone-800">{a.title}</span>
                        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-stone-500">
                          {a.starts_at ? (
                            <span>{new Date(a.starts_at).toLocaleString()}</span>
                          ) : (
                            <span>No time set</span>
                          )}
                          {a.cost != null ? <span>${Number(a.cost).toFixed(2)}</span> : null}
                          {a.category ? <span>{a.category}</span> : null}
                        </div>
                      </div>
                      <form
                        action={deleteTripActivity}
                        className="shrink-0"
                        onSubmit={(e) => {
                          if (!confirm("Remove this activity?")) e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="trip_id" value={tripId} />
                        <input type="hidden" name="activity_id" value={a.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium text-stone-600 hover:text-stone-900">
                        Edit activity
                      </summary>
                      <form action={updateTripActivity} className="mt-2 space-y-2 border-t border-stone-200 pt-2">
                        <input type="hidden" name="trip_id" value={tripId} />
                        <input type="hidden" name="activity_id" value={a.id} />
                        <input
                          name="title"
                          required
                          maxLength={300}
                          defaultValue={a.title}
                          className={fieldClass}
                          placeholder="Title"
                        />
                        <input
                          name="starts_at"
                          type="datetime-local"
                          defaultValue={formatForDatetimeLocal(a.starts_at)}
                          className={fieldClass}
                        />
                        <input
                          name="cost"
                          type="number"
                          min={0}
                          step="0.01"
                          defaultValue={a.cost != null ? String(a.cost) : ""}
                          className={fieldClass}
                          placeholder="Cost (optional)"
                        />
                        <input
                          name="category"
                          maxLength={120}
                          defaultValue={a.category ?? ""}
                          className={fieldClass}
                          placeholder="Category (optional)"
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-800 hover:bg-stone-50"
                        >
                          Save activity
                        </button>
                      </form>
                    </details>
                  </li>
                ))}
              </ul>
            )}

            <form action={addTripActivity} className="mt-3 space-y-2 rounded-xl border border-dashed border-stone-300 bg-white/60 p-3">
              <input type="hidden" name="trip_id" value={tripId} />
              <input type="hidden" name="stop_id" value={stop.id} />
              <p className="text-xs font-medium text-stone-600">Add activity</p>
              <input name="title" required maxLength={300} className={fieldClass} placeholder="Title" />
              <input name="starts_at" type="datetime-local" className={fieldClass} />
              <input
                name="cost"
                type="number"
                min={0}
                step="0.01"
                className={fieldClass}
                placeholder="Cost (optional)"
              />
              <input name="category" maxLength={120} className={fieldClass} placeholder="Category (optional)" />
              <button
                type="submit"
                className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-700"
              >
                Add activity
              </button>
            </form>
          </div>
          </div>
        </details>
      </div>
    </li>
  );
}

export function ItineraryBuilderClient({ trip }: { trip: BuilderTripPayload }) {
  const router = useRouter();
  const sorted = useMemo(
    () => [...trip.trip_stops].sort((a, b) => a.sort_order - b.sort_order),
    [trip.trip_stops]
  );

  const stopsVersion = useMemo(
    () =>
      sorted
        .map(
          (s) =>
            `${s.id}:${s.sort_order}:${s.city_name}:${s.country ?? ""}:${s.external_place_id ?? ""}:${s.trip_activities.map((a) => a.id).join(".")}`
        )
        .join("|"),
    [sorted]
  );

  const [items, setItems] = useState<BuilderStopRow[]>(sorted);

  useEffect(() => {
    startTransition(() => {
      setItems([...trip.trip_stops].sort((a, b) => a.sort_order - b.sort_order));
    });
  }, [stopsVersion, trip.trip_stops]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((s) => s.id === active.id);
    const newIndex = items.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const previous = items;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    const res = await reorderTripStops(trip.id, next.map((s) => s.id));
    if (res.error) {
      setItems(previous);
      window.alert(res.error);
    }
    router.refresh();
  }

  const tripStart = toDateInputValue(trip.start_date);
  const tripEnd = toDateInputValue(trip.end_date);
  const canAddStop = Boolean(tripStart && tripEnd && tripEnd >= tripStart);

  return (
    <div className="space-y-8">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-4">
            {items.map((stop, idx) => (
              <SortableStopCard
                key={stop.id}
                stop={stop}
                tripId={trip.id}
                tripStart={tripStart}
                tripEnd={tripEnd}
                canDeleteStop={items.length > 1}
                sectionIndex={idx + 1}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <section className="rounded-2xl border-2 border-dashed border-stone-800/18 bg-stone-50/60 p-6 shadow-[4px_4px_0_0_rgb(214,211,209)]">
        <h2 className="text-center text-xs font-bold uppercase tracking-widest text-stone-500">
          Add another section
        </h2>
        {!canAddStop ? (
          <p className="mt-3 text-center text-sm text-stone-600">
            Set trip start and end dates on{" "}
            <Link href={`/trips/${trip.id}/edit`} className="font-medium underline underline-offset-2">
              Edit trip
            </Link>{" "}
            before adding another stop.
          </p>
        ) : (
          <form action={addTripStop} className="mx-auto mt-5 max-w-md space-y-4">
            <input type="hidden" name="trip_id" value={trip.id} />
            <PlaceSearchFields
              inputId="new-city"
              countrySelectId="new-country"
              defaults={{
                city_name: "",
                country: null,
                region: null,
                lat: null,
                lng: null,
                external_place_id: null,
              }}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-stone-600" htmlFor="new-sd">
                  Start
                </label>
                <input
                  id="new-sd"
                  name="start_date"
                  type="date"
                  required
                  min={tripStart}
                  max={tripEnd}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600" htmlFor="new-ed">
                  End
                </label>
                <input
                  id="new-ed"
                  name="end_date"
                  type="date"
                  required
                  min={tripStart}
                  max={tripEnd}
                  className={fieldClass}
                />
              </div>
            </div>
            <div className="flex justify-center pt-1">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-stone-800/15 bg-[var(--travel-accent)] px-8 py-3 text-sm font-bold text-stone-900 shadow-[3px_3px_0_0_rgb(41,37,36)] transition hover:brightness-[0.98] active:translate-x-px active:translate-y-px active:shadow-none"
              >
                <span className="text-lg leading-none">+</span>
                Add another section
              </button>
            </div>
          </form>
        )}
      </section>

      <p className="text-center text-sm text-stone-500">
        <Link href={`/trips/${trip.id}`} className="font-medium text-stone-700 underline-offset-4 hover:underline">
          ← Trip overview
        </Link>
        {" · "}
        <Link
          href={`/trips/${trip.id}/itinerary`}
          className="font-medium text-stone-700 underline-offset-4 hover:underline"
        >
          Itinerary view
        </Link>
        {" · "}
        <Link
          href={`/trips/${trip.id}/budget`}
          className="font-medium text-stone-700 underline-offset-4 hover:underline"
        >
          Budget
        </Link>
        {" · "}
        <Link
          href={`/trips/${trip.id}/packing`}
          className="font-medium text-stone-700 underline-offset-4 hover:underline"
        >
          Packing
        </Link>
      </p>
    </div>
  );
}
