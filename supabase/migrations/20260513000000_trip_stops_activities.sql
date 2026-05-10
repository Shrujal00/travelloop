-- Traveloop: itinerary stops and activities. Run after 20260512000001_trip_place_dates.sql.

create table if not exists public.trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  sort_order int not null default 0,
  city_name text not null,
  external_place_id text null,
  country text null,
  region text null,
  lat double precision null,
  lng double precision null,
  start_date date null,
  end_date date null,
  created_at timestamptz not null default now(),
  constraint trip_stops_city_name_len check (char_length(city_name) <= 200)
);

create index if not exists trip_stops_trip_id_sort_idx
  on public.trip_stops (trip_id, sort_order);

create table if not exists public.trip_activities (
  id uuid primary key default gen_random_uuid(),
  trip_stop_id uuid not null references public.trip_stops (id) on delete cascade,
  title text not null,
  starts_at timestamptz null,
  cost numeric(12, 2) null,
  category text null,
  created_at timestamptz not null default now(),
  constraint trip_activities_title_len check (char_length(title) <= 300)
);

create index if not exists trip_activities_stop_id_idx
  on public.trip_activities (trip_stop_id);

alter table public.trip_stops enable row level security;
alter table public.trip_activities enable row level security;

create policy "trip_stops_select_own"
  on public.trip_stops for select
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = trip_stops.trip_id
        and (select auth.uid()) = t.user_id
    )
  );

create policy "trip_stops_insert_own"
  on public.trip_stops for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = trip_stops.trip_id
        and (select auth.uid()) = t.user_id
    )
  );

create policy "trip_stops_update_own"
  on public.trip_stops for update
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = trip_stops.trip_id
        and (select auth.uid()) = t.user_id
    )
  )
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = trip_stops.trip_id
        and (select auth.uid()) = t.user_id
    )
  );

create policy "trip_stops_delete_own"
  on public.trip_stops for delete
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = trip_stops.trip_id
        and (select auth.uid()) = t.user_id
    )
  );

create policy "trip_activities_select_own"
  on public.trip_activities for select
  to authenticated
  using (
    exists (
      select 1
      from public.trip_stops s
      join public.trips t on t.id = s.trip_id
      where s.id = trip_activities.trip_stop_id
        and (select auth.uid()) = t.user_id
    )
  );

create policy "trip_activities_insert_own"
  on public.trip_activities for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.trip_stops s
      join public.trips t on t.id = s.trip_id
      where s.id = trip_activities.trip_stop_id
        and (select auth.uid()) = t.user_id
    )
  );

create policy "trip_activities_update_own"
  on public.trip_activities for update
  to authenticated
  using (
    exists (
      select 1
      from public.trip_stops s
      join public.trips t on t.id = s.trip_id
      where s.id = trip_activities.trip_stop_id
        and (select auth.uid()) = t.user_id
    )
  )
  with check (
    exists (
      select 1
      from public.trip_stops s
      join public.trips t on t.id = s.trip_id
      where s.id = trip_activities.trip_stop_id
        and (select auth.uid()) = t.user_id
    )
  );

create policy "trip_activities_delete_own"
  on public.trip_activities for delete
  to authenticated
  using (
    exists (
      select 1
      from public.trip_stops s
      join public.trips t on t.id = s.trip_id
      where s.id = trip_activities.trip_stop_id
        and (select auth.uid()) = t.user_id
    )
  );

-- One default stop per existing trip (idempotent).
insert into public.trip_stops (trip_id, sort_order, city_name, start_date, end_date)
select
  t.id,
  0,
  left(coalesce(nullif(trim(t.place), ''), t.title), 200),
  t.start_date,
  t.end_date
from public.trips t
where not exists (select 1 from public.trip_stops s where s.trip_id = t.id);
