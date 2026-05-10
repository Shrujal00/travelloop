import type { DashboardTripForCollapsible } from "@/components/trip-itinerary-collapsible";
import { getPublicSiteUrl } from "@/lib/app-origin";

/** Adds derived fields used by dashboard components from raw Supabase rows. */
export function enrichDashboardTrip(row: unknown): DashboardTripForCollapsible {
  const r = row as Record<string, unknown>;
  const is_public = Boolean(r.is_public);
  const slug =
    typeof r.public_slug === "string" && r.public_slug.trim()
      ? String(r.public_slug).trim().toLowerCase()
      : "";
  const share_url = is_public && slug ? `${getPublicSiteUrl()}/p/${slug}` : null;
  return {
    id: String(r.id ?? ""),
    title: String(r.title ?? ""),
    place: r.place != null ? String(r.place) : null,
    start_date: r.start_date != null ? String(r.start_date) : null,
    end_date: r.end_date != null ? String(r.end_date) : null,
    created_at: String(r.created_at ?? ""),
    trip_stops: r.trip_stops,
    is_public,
    public_slug: slug || null,
    share_url,
  };
}
