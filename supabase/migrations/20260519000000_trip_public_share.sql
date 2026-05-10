-- Traveloop: public read-only itinerary links (roadmap Phase H / spec 11).
-- Run after trips + trip_stops_activities + trip_budget migrations.

alter table public.trips
  add column if not exists is_public boolean not null default false;

alter table public.trips
  add column if not exists public_slug text null;

-- Safe to re-run: plain ADD CONSTRAINT fails if the object already exists (e.g. partial run in SQL Editor).
alter table public.trips
  drop constraint if exists trips_public_slug_fmt;

alter table public.trips
  add constraint trips_public_slug_fmt check (
    public_slug is null or public_slug ~ '^[a-z0-9]{12,40}$'
  );

alter table public.trips
  drop constraint if exists trips_public_requires_slug;

alter table public.trips
  add constraint trips_public_requires_slug check (
    not is_public or public_slug is not null
  );

create unique index if not exists trips_public_slug_uidx
  on public.trips (public_slug)
  where public_slug is not null;

comment on column public.trips.is_public is 'When true, anon/authenticated users may read this trip row and nested stops/activities via RLS.';
comment on column public.trips.public_slug is 'Opaque URL segment for /p/[slug]; unique when set.';

-- Anyone can read public trips (omit user_id in API selects for privacy).
drop policy if exists "trips_select_public" on public.trips;

create policy "trips_select_public"
  on public.trips for select
  to anon, authenticated
  using (is_public = true);

-- Stops for public trips
drop policy if exists "trip_stops_select_public" on public.trip_stops;

create policy "trip_stops_select_public"
  on public.trip_stops for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = trip_stops.trip_id
        and t.is_public = true
    )
  );

-- Activities on stops belonging to public trips
drop policy if exists "trip_activities_select_public" on public.trip_activities;

create policy "trip_activities_select_public"
  on public.trip_activities for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.trip_stops s
      join public.trips t on t.id = s.trip_id
      where s.id = trip_activities.trip_stop_id
        and t.is_public = true
    )
  );
