"use server";

import { getVerifiedSession } from "@/lib/auth/session";
import type { TripExpenseCategory } from "@/lib/trips/budget-rollups";
import { createClient } from "@/lib/supabase/server";
import { revalidateTripPaths } from "@/lib/trips/revalidate-trip";
import { redirect } from "next/navigation";

function parseTripId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const id = raw.trim();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  ) {
    return null;
  }
  return id;
}

function parseExpenseId(raw: unknown): string | null {
  return parseTripId(raw);
}

function parseISODate(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  return t;
}

const ALLOWED: TripExpenseCategory[] = ["transport", "stay", "meals", "activities", "other"];

function parseCategory(raw: unknown): TripExpenseCategory | null {
  if (typeof raw !== "string") return null;
  const c = raw.trim().toLowerCase();
  return ALLOWED.includes(c as TripExpenseCategory) ? (c as TripExpenseCategory) : null;
}

function parseAmount(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export async function addTripExpense(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/login?next=/trips");
  }

  const tripId = parseTripId(formData.get("trip_id"));
  if (!tripId) {
    redirect("/trips?error=" + encodeURIComponent("Invalid trip."));
  }

  const category = parseCategory(formData.get("category"));
  const amount = parseAmount(formData.get("amount"));
  const expense_date = parseISODate(formData.get("expense_date"));
  const notesRaw = formData.get("notes");
  const notes =
    typeof notesRaw === "string" && notesRaw.trim() ? notesRaw.trim().slice(0, 500) : null;

  if (!category || amount === null || !expense_date) {
    redirect(`/trips/${tripId}/budget?error=` + encodeURIComponent("Category, amount, and date are required."));
  }

  const supabase = await createClient();
  const { data: trip, error: tripErr } = await supabase
    .from("trips")
    .select("id, start_date, end_date")
    .eq("id", tripId)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (tripErr || !trip?.start_date || !trip?.end_date) {
    redirect(`/trips/${tripId}/budget?error=` + encodeURIComponent("Trip dates required before logging expenses."));
  }

  const ts = String(trip.start_date).slice(0, 10);
  const te = String(trip.end_date).slice(0, 10);
  if (expense_date < ts || expense_date > te) {
    redirect(
      `/trips/${tripId}/budget?error=` +
        encodeURIComponent("Expense date must fall within the trip date range.")
    );
  }

  const { error } = await supabase.from("trip_expenses").insert({
    trip_id: tripId,
    category,
    amount,
    expense_date,
    notes,
  });

  if (error) {
    redirect(`/trips/${tripId}/budget?error=` + encodeURIComponent(error.message));
  }

  revalidateTripPaths(tripId);
  redirect(`/trips/${tripId}/budget`);
}

export async function deleteTripExpense(formData: FormData) {
  const session = await getVerifiedSession();
  if (!session) {
    redirect("/login?next=/trips");
  }

  const tripId = parseTripId(formData.get("trip_id"));
  const expenseId = parseExpenseId(formData.get("expense_id"));
  if (!tripId || !expenseId) {
    redirect("/trips?error=" + encodeURIComponent("Invalid trip or expense."));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("trip_expenses")
    .delete()
    .eq("id", expenseId)
    .eq("trip_id", tripId);

  if (error) {
    redirect(`/trips/${tripId}/budget?error=` + encodeURIComponent(error.message));
  }

  revalidateTripPaths(tripId);
  redirect(`/trips/${tripId}/budget`);
}
