-- Traveloop: place + dates on trips (Screen 4). Run after 20260511000000_trips.sql.

alter table public.trips
  add column if not exists place text,
  add column if not exists start_date date,
  add column if not exists end_date date;
