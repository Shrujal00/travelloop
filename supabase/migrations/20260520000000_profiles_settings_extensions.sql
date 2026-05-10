-- Phase I: profile preferences (spec 12). Run after profiles_display_avatar.sql.

alter table public.profiles
  add column if not exists preferred_language text;

alter table public.profiles
  add column if not exists saved_destinations jsonb not null default '[]'::jsonb;

alter table public.profiles
  add constraint profiles_preferred_language_len check (
    preferred_language is null or char_length(preferred_language) <= 16
  );

alter table public.profiles
  add constraint profiles_saved_destinations_is_array check (
    jsonb_typeof(saved_destinations) = 'array'
  );

comment on column public.profiles.preferred_language is 'Optional BCP47-style tag (e.g. en, es-ES); UI may ignore until localized.';
comment on column public.profiles.saved_destinations is 'Saved city snapshots [{city_name, country, region, lat, lng, external_place_id}]';
