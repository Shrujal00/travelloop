-- Phase F: trip-level optional daily budget cap + manual expenses (non-activity spend).

alter table public.trips
  add column if not exists daily_budget_cap numeric(12, 2) null;

comment on column public.trips.daily_budget_cap is 'Optional soft cap per calendar trip day for budget alerts (USD-style numeric).';

create table if not exists public.trip_expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  category text not null,
  amount numeric(12, 2) not null,
  expense_date date not null,
  notes text null,
  created_at timestamptz not null default now(),
  constraint trip_expenses_category_chk check (
    category in ('transport', 'stay', 'meals', 'activities', 'other')
  ),
  constraint trip_expenses_amount_nonneg check (amount >= 0),
  constraint trip_expenses_notes_len check (notes is null or char_length(notes) <= 500)
);

create index if not exists trip_expenses_trip_id_idx
  on public.trip_expenses (trip_id);

alter table public.trip_expenses enable row level security;

create policy "trip_expenses_select_own"
  on public.trip_expenses for select
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = trip_expenses.trip_id
        and (select auth.uid()) = t.user_id
    )
  );

create policy "trip_expenses_insert_own"
  on public.trip_expenses for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.trips t
      where t.id = trip_expenses.trip_id
        and (select auth.uid()) = t.user_id
    )
  );

create policy "trip_expenses_delete_own"
  on public.trip_expenses for delete
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      where t.id = trip_expenses.trip_id
        and (select auth.uid()) = t.user_id
    )
  );
