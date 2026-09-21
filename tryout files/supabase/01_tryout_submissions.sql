-- Standalone San Jac Ravens Tryout Site
-- This is the same standalone structure you already successfully created.

create extension if not exists pgcrypto;

create table if not exists public.tryout_submissions (
  id uuid primary key default gen_random_uuid(),
  game text not null,
  evaluator text not null,
  tryout_date date not null,
  player_first_name text not null,
  player_last_initial text not null,
  discord_name text not null,
  in_game_name text,
  primary_role text not null,
  current_rank text,
  mechanics smallint not null check (mechanics between 1 and 5),
  game_knowledge smallint not null check (game_knowledge between 1 and 5),
  communication smallint not null check (communication between 1 and 5),
  teamwork smallint not null check (teamwork between 1 and 5),
  adaptability smallint not null check (adaptability between 1 and 5),
  coachability smallint not null check (coachability between 1 and 5),
  overall_performance smallint not null check (overall_performance between 1 and 5),
  strengths text not null,
  improvement_areas text,
  captain_notes text,
  recommendation text not null check (recommendation in ('recommend','consider','not-recommended')),
  created_at timestamptz not null default now()
);

alter table public.tryout_submissions enable row level security;

drop policy if exists "Public can submit tryout evaluations" on public.tryout_submissions;
drop policy if exists "Authenticated users can read tryout evaluations" on public.tryout_submissions;

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
  and recommendation in ('recommend','consider','not-recommended')
);

create policy "Authenticated users can read tryout evaluations"
on public.tryout_submissions
for select
to authenticated
using (true);

grant insert on public.tryout_submissions to anon;
grant insert, select on public.tryout_submissions to authenticated;
