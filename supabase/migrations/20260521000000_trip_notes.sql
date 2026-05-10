-- Phase J: per-trip journal notes (spec 13). Run after trip_stops_activities.sql.

create table if not exists public.trip_notes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  trip_stop_id uuid null references public.trip_stops (id) on delete set null,
  note_date date null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_notes_body_len check (char_length(body) <= 10000)
);

create index if not exists trip_notes_trip_created_idx
  on public.trip_notes (trip_id, created_at desc);

alter table public.trip_notes enable row level security;

create policy "trip_notes_select_own"
  on public.trip_notes for select
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = trip_notes.trip_id
        and (select auth.uid()) = t.user_id
    )
  );

create policy "trip_notes_insert_own"
  on public.trip_notes for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = trip_notes.trip_id
        and (select auth.uid()) = t.user_id
    )
  );

create policy "trip_notes_update_own"
  on public.trip_notes for update
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = trip_notes.trip_id
        and (select auth.uid()) = t.user_id
    )
  )
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = trip_notes.trip_id
        and (select auth.uid()) = t.user_id
    )
  );

create policy "trip_notes_delete_own"
  on public.trip_notes for delete
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = trip_notes.trip_id
        and (select auth.uid()) = t.user_id
    )
  );
