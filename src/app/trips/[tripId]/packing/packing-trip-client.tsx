"use client";

import {
  clearPackingList,
  deletePackingItem,
  addPackingItem,
  resetPackingProgress,
  setPackingItemPacked,
} from "@/lib/trips/packing-actions";
import {
  PACKING_CATEGORY_LABELS,
  PACKING_CATEGORY_ORDER,
  type PackingCategory,
} from "@/lib/trips/packing-categories";
import Link from "next/link";

export type PackingItemRow = {
  id: string;
  category: PackingCategory;
  label: string;
  packed: boolean;
  sort_order: number;
};

const fieldClass =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-[var(--travel-accent)] focus:ring-1 focus:ring-[var(--travel-accent)]/40";

export function PackingTripClient({
  tripId,
  tripTitle,
  items,
  initialError,
}: {
  tripId: string;
  tripTitle: string;
  items: PackingItemRow[];
  initialError: string | null;
}) {
  const packedCount = items.filter((i) => i.packed).length;
  const total = items.length;

  const byCat = new Map<PackingCategory, PackingItemRow[]>();
  for (const c of PACKING_CATEGORY_ORDER) byCat.set(c, []);
  for (const row of items) {
    const list = byCat.get(row.category);
    if (list) list.push(row);
  }

  return (
    <div className="space-y-8">
      {initialError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {initialError}
        </p>
      ) : null}

      <p className="text-sm text-stone-600">
        Packing list for <span className="font-semibold text-stone-900">{tripTitle}</span>
      </p>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Progress</p>
            <p className="mt-1 text-2xl font-bold text-[var(--travel-charcoal)]">
              {packedCount}
              <span className="text-lg font-semibold text-stone-500"> / {total}</span>
            </p>
            <p className="mt-1 text-xs text-stone-600">
              Items marked packed stay saved until you reset progress or remove them.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={resetPackingProgress}>
              <input type="hidden" name="trip_id" value={tripId} />
              <button
                type="submit"
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow-sm hover:bg-stone-50 disabled:opacity-50"
                disabled={total === 0}
              >
                Uncheck all
              </button>
            </form>
            <form
              action={clearPackingList}
              onSubmit={(ev) => {
                if (!confirm("Remove every packing item for this trip?")) ev.preventDefault();
              }}
            >
              <input type="hidden" name="trip_id" value={tripId} />
              <button
                type="submit"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-900 hover:bg-red-100 disabled:opacity-50"
                disabled={total === 0}
              >
                Clear list
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">Add item</h2>
        <form action={addPackingItem} className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <input type="hidden" name="trip_id" value={tripId} />
          <div className="sm:min-w-[160px]">
            <label className="text-xs font-medium text-stone-600" htmlFor="pk-cat">
              Category
            </label>
            <select id="pk-cat" name="category" required className={fieldClass}>
              {PACKING_CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {PACKING_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-1 sm:min-w-[200px]">
            <label className="text-xs font-medium text-stone-600" htmlFor="pk-label">
              Item
            </label>
            <input
              id="pk-label"
              name="label"
              required
              maxLength={200}
              placeholder="e.g. Passport, chargers…"
              className={fieldClass}
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-[var(--travel-accent)] px-4 py-2 text-sm font-bold text-stone-900 shadow-sm hover:brightness-[0.97]"
          >
            Add
          </button>
        </form>
      </section>

      <section className="space-y-6">
        {total === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-6 py-10 text-center text-sm text-stone-600">
            Nothing packed yet — add items above or reuse this list trip after trip with{' '}
            <strong>Uncheck all</strong>.
          </p>
        ) : (
          PACKING_CATEGORY_ORDER.map((cat) => {
            const rows = byCat.get(cat) ?? [];
            if (rows.length === 0) return null;
            return (
              <div key={cat} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wide text-stone-500">
                  {PACKING_CATEGORY_LABELS[cat]}
                </h3>
                <ul className="mt-4 divide-y divide-stone-100">
                  {rows.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
                      <form action={setPackingItemPacked} className="flex shrink-0 items-center">
                        <input type="hidden" name="trip_id" value={tripId} />
                        <input type="hidden" name="item_id" value={item.id} />
                        <input type="hidden" name="packed" value={item.packed ? "false" : "true"} />
                        <button
                          type="submit"
                          aria-label={item.packed ? `Mark ${item.label} unpacked` : `Mark ${item.label} packed`}
                          className="flex size-9 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-900 shadow-sm hover:bg-stone-50"
                        >
                          <span
                            className={
                              item.packed
                                ? "flex size-5 items-center justify-center rounded bg-[var(--travel-accent)] text-xs font-bold text-stone-900"
                                : "size-5 rounded border-2 border-stone-300"
                            }
                            aria-hidden
                          >
                            {item.packed ? "✓" : ""}
                          </span>
                        </button>
                      </form>
                      <span
                        className={`min-w-0 flex-1 text-sm font-medium text-stone-900 ${item.packed ? "text-stone-500 line-through" : ""}`}
                      >
                        {item.label}
                      </span>
                      <form
                        action={deletePackingItem}
                        onSubmit={(ev) => {
                          if (!confirm(`Remove “${item.label}”?`)) ev.preventDefault();
                        }}
                        className="shrink-0"
                      >
                        <input type="hidden" name="trip_id" value={tripId} />
                        <input type="hidden" name="item_id" value={item.id} />
                        <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                          Remove
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>

      <p className="text-center text-sm text-stone-500">
        <Link href={`/trips/${tripId}`} className="font-medium text-stone-700 underline-offset-4 hover:underline">
          ← Trip overview
        </Link>
        {" · "}
        <Link href={`/trips/${tripId}/budget`} className="font-medium text-stone-700 underline-offset-4 hover:underline">
          Budget
        </Link>
      </p>
    </div>
  );
}
