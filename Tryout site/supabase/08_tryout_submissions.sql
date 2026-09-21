-- ============================================================================
-- San Jac Ravens Esports
-- Tryout Submissions
-- ============================================================================
--
-- Purpose:
--   1. Allow the public captain tryout form to INSERT one evaluation.
--   2. Prevent anonymous/public users from reading submitted evaluations.
--   3. Allow verified portal admins to SELECT/UPDATE/DELETE evaluations.
--
-- IMPORTANT:
-- This assumes your existing portal has:
--   public.profiles
--   profiles.id = auth.uid()
--   profiles.role = 'admin'
--   profiles.verified = true
--
-- If your profiles table uses a different user-id column, adjust the admin
-- policy before running this file.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists public.tryout_submissions (
  id uuid primary key default gen_random_uuid(),

  -- Tryout/session information
  game text not null,
  evaluator text not null,
  tryout_date date not null,

  -- Player information
  player_first_name text not null,
  player_last_initial text not null,
  discord_name text not null,
  in_game_name text,
  primary_role text not null,
  current_rank text,

  -- Performance ratings: 1 through 5
  mechanics smallint not null check (mechanics between 1 and 5),
  game_knowledge smallint not null check (game_knowledge between 1 and 5),
  communication smallint not null check (communication between 1 and 5),
  teamwork smallint not null check (teamwork between 1 and 5),
  adaptability smallint not null check (adaptability between 1 and 5),
  coachability smallint not null check (coachability between 1 and 5),
  overall_performance smallint not null check (overall_performance between 1 and 5),

  -- Captain observations
  strengths text not null,
  improvement_areas text,
  captain_notes text,

  -- Final roster recommendation
  recommendation text not null check (
    recommendation in ('recommend', 'consider', 'not-recommended')
  ),

  -- Recordkeeping
  created_at timestamptz not null default now()
);

-- Basic data-length checks at the database layer.
alter table public.tryout_submissions
  drop constraint if exists tryout_player_last_initial_length;

alter table public.tryout_submissions
  add constraint tryout_player_last_initial_length
  check (char_length(trim(player_last_initial)) between 1 and 1);

alter table public.tryout_submissions
  drop constraint if exists tryout_evaluator_length;

alter table public.tryout_submissions
  add constraint tryout_evaluator_length
  check (char_length(trim(evaluator)) between 1 and 100);

alter table public.tryout_submissions
  drop constraint if exists tryout_discord_name_length;

alter table public.tryout_submissions
  add constraint tryout_discord_name_length
  check (char_length(trim(discord_name)) between 1 and 100);

-- Helpful indexes for the admin page.
create index if not exists tryout_submissions_tryout_date_idx
  on public.tryout_submissions (tryout_date desc);

create index if not exists tryout_submissions_game_idx
  on public.tryout_submissions (game);

create index if not exists tryout_submissions_recommendation_idx
  on public.tryout_submissions (recommendation);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.tryout_submissions enable row level security;

-- Remove old versions if this migration is re-run intentionally.
drop policy if exists "Public can submit tryout evaluations"
  on public.tryout_submissions;

drop policy if exists "Admins can read tryout evaluations"
  on public.tryout_submissions;

drop policy if exists "Admins can update tryout evaluations"
  on public.tryout_submissions;

drop policy if exists "Admins can delete tryout evaluations"
  on public.tryout_submissions;

-- --------------------------------------------------------------------------
-- PUBLIC INSERT
-- --------------------------------------------------------------------------
-- The tryout page has no login, so anon/authenticated browser users may INSERT.
-- There is intentionally NO public SELECT policy.
--
-- This means a captain can submit an evaluation but cannot query the database
-- and download everyone else's evaluations.
-- --------------------------------------------------------------------------
create policy "Public can submit tryout evaluations"
on public.tryout_submissions
for insert
to anon, authenticated
with check (
  mechanics between 1 and 5
  and game_knowledge between 1 and 5
  and communication between 1 and 5
  and teamwork between 1 and 5
  and adaptability between 1 and 5
  and coachability between 1 and 5
  and overall_performance between 1 and 5
  and recommendation in ('recommend', 'consider', 'not-recommended')
);

-- --------------------------------------------------------------------------
-- ADMIN READ
-- --------------------------------------------------------------------------
create policy "Admins can read tryout evaluations"
on public.tryout_submissions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.verified = true
  )
);

-- --------------------------------------------------------------------------
-- ADMIN UPDATE
-- --------------------------------------------------------------------------
create policy "Admins can update tryout evaluations"
on public.tryout_submissions
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.verified = true
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.verified = true
  )
);

-- --------------------------------------------------------------------------
-- ADMIN DELETE
-- --------------------------------------------------------------------------
create policy "Admins can delete tryout evaluations"
on public.tryout_submissions
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.verified = true
  )
);

-- Explicit grants used by the Supabase API.
grant insert on public.tryout_submissions to anon;
grant insert, select, update, delete on public.tryout_submissions to authenticated;
