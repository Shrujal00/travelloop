import { BudgetTripClient, type BudgetExpenseRow } from "./budget-trip-client";
import {
  breakdownRows,
  computeBudgetRollup,
  computeDailySpendByDay,
  tripInclusiveDayCount,
  type BudgetStopForDaily,
  type TripExpenseCategory,
} from "@/lib/trips/budget-rollups";
import { createClient } from "@/lib/supabase/server";
import { isUuidTripParam } from "@/lib/trips/trip-id";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

function decodeErr(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function sumActivityCosts(stopsUnknown: unknown): number {
  if (!Array.isArray(stopsUnknown)) return 0;
  let sum = 0;
  for (const row of stopsUnknown) {
    const r = row as Record<string, unknown>;
    const acts = r.trip_activities;
    if (!Array.isArray(acts)) continue;
    for (const a of acts) {
      const ar = a as Record<string, unknown>;
      const costRaw = ar.cost;
      if (costRaw == null || costRaw === "") continue;
      const n = typeof costRaw === "number" ? costRaw : Number(costRaw);
      if (Number.isFinite(n)) sum += n;
    }
  }
  return Math.round(sum * 100) / 100;
}

export default async function TripBudgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { tripId } = await params;
  const { error: errParam } = await searchParams;
  const initialError = decodeErr(errParam);

  if (!isUuidTripParam(tripId)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .select(
      `
      id,
      title,
      place,
      start_date,
      end_date,
      daily_budget_cap,
      trip_stops (
        start_date,
        end_date,
        trip_activities ( cost, starts_at )
      ),
      trip_expenses (
        id,
        category,
        amount,
        expense_date,
        notes,
        created_at
      )
    `
    )
    .eq("id", tripId)
    .maybeSingle();

  if (error) {
    const msg = error.message ?? "";
    if (
      msg.includes("trip_expenses") ||
      msg.includes("daily_budget_cap") ||
      msg.includes("schema cache") ||
      error.code === "PGRST200"
    ) {
      redirect(
        "/trips?error=" +
          encodeURIComponent(
            "Run the trip_budget migration in Supabase (see README), then open Budget again."
          )
      );
    }
    notFound();
  }

  if (!trip) {
    notFound();
  }

  const row = trip as {
    id: string;
    title: string;
    place: string | null;
    start_date: string | null;
    end_date: string | null;
    daily_budget_cap: unknown;
    trip_stops?: unknown;
    trip_expenses?: unknown;
  };

  const displayTitle = row.place?.trim() || row.title;
  const ts = row.start_date?.trim().slice(0, 10) ?? "";
  const te = row.end_date?.trim().slice(0, 10) ?? "";

  const capRaw = row.daily_budget_cap;
  const dailyBudgetCap =
    capRaw == null || capRaw === ""
      ? null
      : typeof capRaw === "number"
        ? capRaw
        : Number(capRaw);
  const dailyBudgetCapNorm =
    dailyBudgetCap != null && Number.isFinite(dailyBudgetCap) && dailyBudgetCap >= 0
      ? Math.round(dailyBudgetCap * 100) / 100
      : null;

  const activityCostsTotal = sumActivityCosts(row.trip_stops);
  const expRaw = row.trip_expenses;
  const expenseRows: BudgetExpenseRow[] = [];
  const expenseRollupInput: { category: TripExpenseCategory; amount: number }[] = [];

  if (Array.isArray(expRaw)) {
    for (const e of expRaw) {
      const er = e as Record<string, unknown>;
      const cat = String(er.category ?? "").trim().toLowerCase();
      const amtRaw = er.amount;
      const amt =
        typeof amtRaw === "number" ? amtRaw : amtRaw != null ? Number(amtRaw) : NaN;
      if (!Number.isFinite(amt)) continue;
      const amount = Math.round(amt * 100) / 100;
      if (
        cat !== "transport" &&
        cat !== "stay" &&
        cat !== "meals" &&
        cat !== "activities" &&
        cat !== "other"
      ) {
        continue;
      }
      expenseRollupInput.push({ category: cat as TripExpenseCategory, amount });
      expenseRows.push({
        id: String(er.id ?? ""),
        category: cat as TripExpenseCategory,
        amount,
        expense_date: String(er.expense_date ?? "").slice(0, 10),
        notes: er.notes != null ? String(er.notes) : null,
      });
    }
  }

  expenseRows.sort((a, b) => {
    const c = b.expense_date.localeCompare(a.expense_date);
    return c !== 0 ? c : b.id.localeCompare(a.id);
  });

  const tripDays =
    ts.length >= 10 && te.length >= 10 ? tripInclusiveDayCount(ts, te) : 1;

  const rollup = computeBudgetRollup({
    activityCostsTotal,
    expenses: expenseRollupInput,
    tripDays,
  });

  const breakdown = breakdownRows(rollup);

  const stopsForDaily: BudgetStopForDaily[] = [];
  const stopsRaw = row.trip_stops;
  if (Array.isArray(stopsRaw)) {
    for (const s of stopsRaw) {
      const sr = s as Record<string, unknown>;
      const acts = sr.trip_activities;
      const activities: BudgetStopForDaily["activities"] = [];
      if (Array.isArray(acts)) {
        for (const a of acts) {
          const ar = a as Record<string, unknown>;
          const costRaw = ar.cost;
          const cost =
            costRaw == null || costRaw === ""
              ? null
              : typeof costRaw === "number"
                ? costRaw
                : Number(costRaw);
          activities.push({
            cost: Number.isFinite(cost ?? NaN) ? (cost as number) : null,
            starts_at: ar.starts_at != null ? String(ar.starts_at) : null,
          });
        }
      }
      stopsForDaily.push({
        start_date: sr.start_date != null ? String(sr.start_date).slice(0, 10) : null,
        end_date: sr.end_date != null ? String(sr.end_date).slice(0, 10) : null,
        activities,
      });
    }
  }

  const dailySpend =
    ts.length >= 10 && te.length >= 10
      ? computeDailySpendByDay({
          tripStartYmd: ts,
          tripEndYmd: te,
          stops: stopsForDaily,
          expenses: expenseRows.map((e) => ({
            expense_date: e.expense_date,
            amount: e.amount,
          })),
        })
      : [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">Budget</h1>
      <p className="mt-4 text-sm">
        <Link href={`/trips/${tripId}`} className="font-semibold text-stone-800 underline-offset-4 hover:underline">
          ← Trip overview
        </Link>
        {" · "}
        <Link
          href={`/trips/${tripId}/build`}
          className="font-semibold text-stone-800 underline-offset-4 hover:underline"
        >
          Itinerary builder
        </Link>
        {" · "}
        <Link
          href={`/trips/${tripId}/packing`}
          className="font-semibold text-stone-800 underline-offset-4 hover:underline"
        >
          Packing
        </Link>
      </p>

      {!ts || !te ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Set trip start and end dates on{" "}
          <Link href={`/trips/${tripId}/edit`} className="font-semibold underline underline-offset-2">
            Edit trip
          </Link>{" "}
          for accurate per-day averages.
        </p>
      ) : null}

      <div className="mt-8">
        <BudgetTripClient
          tripId={tripId}
          tripTitle={displayTitle}
          dailyBudgetCap={dailyBudgetCapNorm}
          rollup={rollup}
          breakdown={breakdown}
          dailySpend={dailySpend}
          expenses={expenseRows}
          initialError={initialError}
        />
      </div>
    </main>
  );
}
