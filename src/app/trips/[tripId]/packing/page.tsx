import { PackingTripClient, type PackingItemRow } from "./packing-trip-client";
import {
  PACKING_CATEGORY_ORDER,
  type PackingCategory,
} from "@/lib/trips/packing-categories";
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

function normalizeCategory(raw: string): PackingCategory | null {
  const c = raw.trim().toLowerCase();
  return PACKING_CATEGORY_ORDER.includes(c as PackingCategory) ? (c as PackingCategory) : null;
}

export default async function TripPackingPage({
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
      packing_items (
        id,
        category,
        label,
        packed,
        sort_order,
        created_at
      )
    `
    )
    .eq("id", tripId)
    .maybeSingle();

  if (error) {
    const msg = error.message ?? "";
    if (
      msg.includes("packing_items") ||
      msg.includes("schema cache") ||
      error.code === "PGRST200"
    ) {
      redirect(
        "/trips?error=" +
          encodeURIComponent(
            "Run the packing_items migration in Supabase (see README), then open Packing again."
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
    packing_items?: unknown;
  };

  const displayTitle = row.place?.trim() || row.title;
  const rawItems = row.packing_items;
  const items: PackingItemRow[] = [];

  if (Array.isArray(rawItems)) {
    for (const r of rawItems) {
      const o = r as Record<string, unknown>;
      const cat = normalizeCategory(String(o.category ?? ""));
      if (!cat) continue;
      const label = String(o.label ?? "").trim();
      if (!label) continue;
      const sortRaw = o.sort_order;
      const sort_order =
        typeof sortRaw === "number"
          ? sortRaw
          : sortRaw != null && Number.isFinite(Number(sortRaw))
            ? Number(sortRaw)
            : 0;
      items.push({
        id: String(o.id ?? ""),
        category: cat,
        label,
        packed: Boolean(o.packed),
        sort_order,
      });
    }
  }

  items.sort((a, b) => {
    const c = a.sort_order - b.sort_order;
    return c !== 0 ? c : a.id.localeCompare(b.id);
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--travel-charcoal)]">Packing</h1>
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
          href={`/trips/${tripId}/itinerary`}
          className="font-semibold text-stone-800 underline-offset-4 hover:underline"
        >
          Itinerary view
        </Link>
        {" · "}
        <Link
          href={`/trips/${tripId}/budget`}
          className="font-semibold text-stone-800 underline-offset-4 hover:underline"
        >
          Budget
        </Link>
      </p>

      <div className="mt-8">
        <PackingTripClient tripId={tripId} tripTitle={displayTitle} items={items} initialError={initialError} />
      </div>
    </main>
  );
}
