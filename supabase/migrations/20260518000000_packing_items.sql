-- Phase G: per-trip packing checklist (spec 10).

create table if not exists public.packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  category text not null,
  label text not null,
  packed boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint packing_items_category_chk check (
    category in ('clothing', 'documents', 'toiletries', 'electronics', 'other')
  ),
  constraint packing_items_label_len check (char_length(label) >= 1 and char_length(label) <= 200)
);

create index if not exists packing_items_trip_id_sort_idx
  on public.packing_items (trip_id, sort_order, created_at);

alter table public.packing_items enable row level security;

create policy "packing_items_select_own"
  on public.packing_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = packing_items.trip_id
        and (select auth.uid()) = t.user_id
    )
  );

create policy "packing_items_insert_own"
  on public.packing_items for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = packing_items.trip_id
        and (select auth.uid()) = t.user_id
    )
  );

create policy "packing_items_update_own"
  on public.packing_items for update
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = packing_items.trip_id
        and (select auth.uid()) = t.user_id
    )
  )
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = packing_items.trip_id
        and (select auth.uid()) = t.user_id
    )
  );

create policy "packing_items_delete_own"
  on public.packing_items for delete
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = packing_items.trip_id
        and (select auth.uid()) = t.user_id
    )
  );
