-- Phase E: dedupe suggested OSM imports per stop (optional but recommended).

alter table public.trip_activities
  add column if not exists external_ref text null;

create unique index if not exists trip_activities_stop_external_ref_uidx
  on public.trip_activities (trip_stop_id, external_ref)
  where external_ref is not null;

comment on column public.trip_activities.external_ref is 'External id for dedupe (e.g. OSM node:123).';
