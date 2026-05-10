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

4. **Database (run in Supabase SQL Editor):** open each file under `supabase/migrations/` in order (profiles, then trips) and execute the SQL once per project so RLS-backed tables exist.

5. Install and run:

   ```bash
   npm install
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Auth: `/login`, `/signup`, `/forgot-password`. After sign-in, `/trips` lists trips once the `trips` migration has been applied.

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
