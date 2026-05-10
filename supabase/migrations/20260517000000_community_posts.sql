-- Traveloop: Screen 10 community feed (Phase H — ties to profiles display_name / avatar_url).
-- Run after profiles + trips migrations.

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  body text not null,
  topic text,
  related_trip_title text,
  related_trip_place text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_posts_title_len check (title is null or char_length(title) <= 200),
  constraint community_posts_body_len check (char_length(body) <= 8000),
  constraint community_posts_topic_len check (topic is null or char_length(topic) <= 80),
  constraint community_posts_rel_title_len check (
    related_trip_title is null or char_length(related_trip_title) <= 200
  ),
  constraint community_posts_rel_place_len check (
    related_trip_place is null or char_length(related_trip_place) <= 120
  )
);

create index if not exists community_posts_created_at_idx
  on public.community_posts (created_at desc);

alter table public.community_posts enable row level security;

create policy "community_posts_select_authenticated"
  on public.community_posts for select
  to authenticated
  using (true);

create policy "community_posts_insert_own"
  on public.community_posts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "community_posts_update_own"
  on public.community_posts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "community_posts_delete_own"
  on public.community_posts for delete
  to authenticated
  using ((select auth.uid()) = user_id);
