import { DashboardHome } from "@/components/landing/dashboard-home";
import { MarketingHome } from "@/components/landing/marketing-home";
import { SiteHeader } from "@/components/site-header";
import type { DashboardTripForCollapsible } from "@/components/trip-itinerary-collapsible";
import { getVerifiedEmail, getVerifiedSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { enrichDashboardTrip } from "@/lib/trips/enrich-dashboard-trip";
import { todayIsoUtc } from "@/lib/trips/trip-lifecycle";

export default async function Home() {
  const email = await getVerifiedEmail();
  const session = await getVerifiedSession();
  const todayIso = todayIsoUtc();

  let recentTrips: DashboardTripForCollapsible[] = [];
  let welcomeName = email?.split("@")[0] ?? "traveler";
  let avatarUrl: string | null | undefined;

  if (email && session) {
    try {
      const supabase = await createClient();
      const { data: profileRow, error: profileErr } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", session.userId)
        .maybeSingle();
      if (!profileErr && profileRow) {
        const dn = profileRow.display_name?.trim();
        if (dn) welcomeName = dn;
        const au = profileRow.avatar_url?.trim();
        avatarUrl = au || null;
      }

      const { data } = await supabase
        .from("trips")
        .select(
          `
          id,
          title,
          place,
          start_date,
          end_date,
          created_at,
          is_public,
          public_slug,
          trip_stops (
            id,
            sort_order,
            city_name,
            start_date,
            end_date,
            trip_activities ( cost )
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(36);

      recentTrips = (data ?? []).map(enrichDashboardTrip);
    } catch {
      recentTrips = [];
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--travel-paper)] text-stone-900">
      <SiteHeader
        email={email}
        avatarUrl={avatarUrl ?? null}
        displayName={welcomeName}
        variant={email ? "light" : "dark"}
      />

      {!email ? (
        <main className="flex flex-1 flex-col">
          <MarketingHome />
        </main>
      ) : (
        <main className="flex flex-1 flex-col">
          <DashboardHome trips={recentTrips} welcomeName={welcomeName} todayIso={todayIso} />
        </main>
      )}
    </div>
  );
}
