-- Traveloop: optional profile fields for Screen 7 (display name, avatar URL).
-- Run after 20260510000000_profiles.sql. Length validation is enforced in the app.

alter table public.profiles
  add column if not exists display_name text;

alter table public.profiles
  add column if not exists avatar_url text;
