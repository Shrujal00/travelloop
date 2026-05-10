"use client";

import { addTripExpense, deleteTripExpense } from "@/lib/trips/budget-actions";
import type { BudgetBreakdownRow, BudgetRollup, TripExpenseCategory } from "@/lib/trips/budget-rollups";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/trips/budget-rollups";
import Link from "next/link";
import { useMemo } from "react";

export type BudgetExpenseRow = {
  id: string;
  category: TripExpenseCategory;
  amount: number;
  expense_date: string;
  notes: string | null;
};

function fmtUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

const fieldClass =
  "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-[var(--travel-accent)] focus:ring-1 focus:ring-[var(--travel-accent)]/40";

export function BudgetTripClient({
  tripId,
  tripTitle,
  dailyBudgetCap,
  rollup,
  breakdown,
  expenses,
  initialError,
}: {
  tripId: string;
  tripTitle: string;
  dailyBudgetCap: number | null;
  rollup: BudgetRollup;
  breakdown: BudgetBreakdownRow[];
  expenses: BudgetExpenseRow[];
  initialError: string | null;
}) {
  const maxBar = useMemo(() => Math.max(...breakdown.map((r) => r.amount), 1), [breakdown]);

  const overCap =
    dailyBudgetCap != null &&
    dailyBudgetCap > 0 &&
    rollup.dailyAverage > dailyBudgetCap + 0.005;

  const expenseCats = Object.keys(EXPENSE_CATEGORY_LABELS) as TripExpenseCategory[];

  return (
    <div className="space-y-8">
      {initialError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {initialError}
        </p>
      ) : null}

      {overCap ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Average spend per trip day ({fmtUsd(rollup.dailyAverage)}) is above your soft cap (
          {fmtUsd(dailyBudgetCap)}).
        </p>
      ) : null}

      <p className="text-sm text-stone-600">
        Trip <span className="font-semibold text-stone-900">{tripTitle}</span>
        {dailyBudgetCap != null && dailyBudgetCap > 0 ? (
          <>
            {" "}
            · Soft cap {fmtUsd(dailyBudgetCap)} / day (set on{" "}
            <Link href={`/trips/${tripId}/edit`} className="font-medium underline underline-offset-2">
              Edit trip
            </Link>
            )
          </>
        ) : null}
      </p>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Total spend</p>
          <p className="mt-1 text-2xl font-bold text-[var(--travel-charcoal)]">{fmtUsd(rollup.grandTotal)}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Per day (avg)</p>
          <p className="mt-1 text-2xl font-bold text-[var(--travel-charcoal)]">{fmtUsd(rollup.dailyAverage)}</p>
          <p className="mt-1 text-xs text-stone-500">{rollup.tripDays} trip days</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Activity costs</p>
          <p className="mt-1 text-2xl font-bold text-[var(--travel-charcoal)]">
            {fmtUsd(rollup.activityCostsTotal)}
          </p>
          <p className="mt-1 text-xs text-stone-500">From itinerary builder</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Logged expenses</p>
          <p className="mt-1 text-2xl font-bold text-[var(--travel-charcoal)]">
            {fmtUsd(rollup.grandTotal - rollup.activityCostsTotal)}
          </p>
          <p className="mt-1 text-xs text-stone-500">Manual rows below</p>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">By category</h2>
        {breakdown.length === 0 ? (
          <p className="mt-4 text-sm text-stone-600">
            No costs yet — add prices to activities in the builder or log an expense.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {breakdown.map((row) => (
              <li key={row.key}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-stone-800">{row.label}</span>
                  <span className="font-semibold text-stone-900">{fmtUsd(row.amount)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-[var(--travel-accent)]"
                    style={{ width: `${Math.min(100, (row.amount / maxBar) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">Log expense</h2>
        <p className="mt-1 text-xs text-stone-600">Transport, stay, meals, and other trip spend.</p>
        <form action={addTripExpense} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <input type="hidden" name="trip_id" value={tripId} />
          <div className="lg:col-span-3">
            <label className="text-xs font-medium text-stone-600" htmlFor="exp-cat">
              Category
            </label>
            <select id="exp-cat" name="category" required className={fieldClass}>
              {expenseCats.map((c) => (
                <option key={c} value={c}>
                  {EXPENSE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="text-xs font-medium text-stone-600" htmlFor="exp-amt">
              Amount
            </label>
            <input
              id="exp-amt"
              name="amount"
              type="number"
              min={0}
              step="0.01"
              required
              className={fieldClass}
              placeholder="0.00"
            />
          </div>
          <div className="lg:col-span-3">
            <label className="text-xs font-medium text-stone-600" htmlFor="exp-date">
              Date
            </label>
            <input id="exp-date" name="expense_date" type="date" required className={fieldClass} />
          </div>
          <div className="lg:col-span-3">
            <label className="text-xs font-medium text-stone-600" htmlFor="exp-notes">
              Notes (optional)
            </label>
            <input
              id="exp-notes"
              name="notes"
              maxLength={500}
              className={fieldClass}
              placeholder="Flight confirmation, hotel…"
            />
          </div>
          <div className="lg:col-span-1">
            <button
              type="submit"
              className="w-full rounded-lg bg-[var(--travel-accent)] px-4 py-2 text-sm font-bold text-stone-900 shadow-sm hover:brightness-[0.97]"
            >
              Add
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">Expense log</h2>
        {expenses.length === 0 ? (
          <p className="mt-4 text-sm text-stone-600">No manual expenses yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {expenses.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <span className="font-semibold text-stone-900">{EXPENSE_CATEGORY_LABELS[e.category]}</span>
                  <span className="text-stone-500"> · {e.expense_date}</span>
                  {e.notes ? (
                    <p className="mt-0.5 truncate text-xs text-stone-600">{e.notes}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold text-stone-900">{fmtUsd(e.amount)}</span>
                  <form
                    action={deleteTripExpense}
                    onSubmit={(ev) => {
                      if (!confirm("Remove this expense?")) ev.preventDefault();
                    }}
                  >
                    <input type="hidden" name="trip_id" value={tripId} />
                    <input type="hidden" name="expense_id" value={e.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
