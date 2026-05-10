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

4. **Database (run in Supabase SQL Editor):** open each file under `supabase/migrations/` **in filename order** (`profiles` → `trips` → `trip_place_dates` → `trip_stops_activities` → `profiles_display_avatar` → `trip_activities_external_ref` for Phase E) and execute the SQL once per project so RLS-backed tables and columns exist.

5. Install and run:

   ```bash
   npm install
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Auth: `/login`, `/signup`, `/forgot-password`. After sign-in, `/trips` lists trips once the `trips` migration has been applied.

**Phase D (places):** static ISO country list + server-side city search via [Photon](https://photon.komoot.io) (OpenStreetMap data) on **Build itinerary**, **New trip**, and **Edit trip** (first stop stores `country` / `region` / `lat` / `lng` / `external_place_id` when you pick a result). Results are cached on the server; you must be signed in to call `/api/places/search`. Optional env vars: `PHOTON_API_BASE_URL`, `PHOTON_USER_AGENT` (see `.env.example`).

**Phase E (activity discover):** per-stop **Browse activity ideas** opens `/trips/[tripId]/stops/[stopId]/discover` — server-cached POI hints from a public [Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API) interpreter (tiny radius queries; identify your app via `OVERPASS_USER_AGENT`), optional nearby [Wikipedia](https://en.wikipedia.org/wiki/Wikipedia:API) titles (geosearch only; no extracts), and one-tap add into `trip_activities`. If a stop has no saved coordinates, Photon geocodes the city name once, then Overpass runs from that centroid. Apply migration `20260515000000_trip_activities_external_ref.sql` so `external_ref` can dedupe OSM imports per stop. Attribution: **ODbL** for OSM data (shown in the UI). Fair use: do not hammer public instances; defaults use long server cache (`revalidate: 86400`).

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
