# Traveloop

Personalized travel planning made easy — **Next.js 16** (App Router) and **Supabase** auth.

## Setup

1. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Keep secrets only in **`.env.local`** (gitignored). Avoid typo filenames like `e.nv`; this repo ignores `e.nv` so it is never committed by mistake.

2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) from your [Supabase project API settings](https://supabase.com/dashboard/project/_/settings/api).

3. In Supabase **Authentication → URL configuration**, add:

   - Site URL: `http://localhost:3000` (and your production URL when deployed)
   - Redirect URLs: `http://localhost:3000/**`

4. **Database (run in Supabase SQL Editor):** open each file under `supabase/migrations/` **in filename order** (`profiles` → `trips` → `trip_place_dates` → `trip_stops_activities` → `profiles_display_avatar` → `trip_activities_external_ref` → `trip_budget` → `community_posts` → `packing_items` → `trip_public_share`) and execute the SQL once per project so RLS-backed tables and columns exist.

5. Install and run:

   ```bash
   npm install
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Auth: `/login`, `/signup`, `/forgot-password`. After sign-in, `/trips` lists trips once the `trips` migration has been applied.

**Phase D (places):** static ISO country list + server-side city search via [Photon](https://photon.komoot.io) (OpenStreetMap data) on **Build itinerary**, **New trip**, and **Edit trip** (first stop stores `country` / `region` / `lat` / `lng` / `external_place_id` when you pick a result). Results are cached on the server; you must be signed in to call `/api/places/search`. Optional env vars: `PHOTON_API_BASE_URL`, `PHOTON_USER_AGENT` (see `.env.example`).

**Phase E (activity discover):** per-stop **Browse activity ideas** opens `/trips/[tripId]/stops/[stopId]/discover` — server-cached POI hints from a public [Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API) interpreter (tiny radius queries; identify your app via `OVERPASS_USER_AGENT`), optional nearby [Wikipedia](https://en.wikipedia.org/wiki/Wikipedia:API) titles (geosearch only; no extracts), and one-tap add into `trip_activities`. If a stop has no saved coordinates, Photon geocodes the city name once, then Overpass runs from that centroid. Apply migration `20260515000000_trip_activities_external_ref.sql` so `external_ref` can dedupe OSM imports per stop. Fair use: do not hammer public instances; defaults use long server cache (`revalidate: 86400`).

**Phase F (budget):** `/trips/[tripId]/budget` rolls up **activity costs** from the builder plus **`trip_expenses`** rows you log (transport, stay, meals, activities, other). Optional **`daily_budget_cap`** on **Edit trip** sets a soft daily average threshold — Budget warns when spend/day exceeds it. Apply migration `20260516000000_trip_budget.sql`.

**Phase G (packing):** `/trips/[tripId]/packing` is a per-trip checklist (**documents**, **clothing**, **toiletries**, **electronics**, **other**): add/remove rows, mark packed, **Uncheck all** (sets every row unpacked without deleting), or **Clear list** (delete all rows). Apply migration `20260518000000_packing_items.sql`.

**Public itinerary (roadmap Phase H / spec 11):** **`/p/[slug]`** is a read-only, login-optional view of stops and activities for trips you mark **shared** from the trip overview. **`trips.is_public`** + **`trips.public_slug`** drive access (RLS allows `anon`/`authenticated` reads only when `is_public`). Guests get **Copy link / Share / Copy to my trips** (copy duplicates stops + activities into a new private trip). Budget, packing, and manual expenses stay private. Apply migration `20260519000000_trip_public_share.sql`. For stable absolute URLs in production, set **`NEXT_PUBLIC_SITE_URL`** (see `.env.example`).

**Community feed:** **`/community`** — search, group-by, filters, composer; authors use **`profiles.display_name`** / **`profiles.avatar_url`**. Migration `20260517000000_community_posts.sql`.

## Contributors (commit attribution)

| Area | GitHub | Git `user.name` / `user.email` |
| ---- | ------ | ------------------------------ |
| Frontend (auth UI, styling) | [Shrujal00](https://github.com/Shrujal00) | `Shrujal00` / `shrujal000@gmail.com` |
| Backend (Supabase clients, `proxy.ts`, auth routes, env/migrations) | [Teesha-Gokulgandhi](https://github.com/Teesha-Gokulgandhi) | `Teesha-Gokulgandhi` / `tishagokulgandhi@gmail.com` |

## Remote

```bash
git remote add origin https://github.com/Shrujal00/travelloop.git
git push -u origin main
```
