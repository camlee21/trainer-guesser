-- Medal progress that can't be worked out from daily_results or connections_results
-- (Infinite mode sessions, custom Connections puzzles and Triple Threat), plus when each medal was earned.
-- One row per user per medal.
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.
--
-- ALREADY RAN AN EARLIER VERSION OF THIS FILE? Only run this line instead:
--   alter table public.user_medals add column if not exists earned_at timestamptz;

create table if not exists public.user_medals (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  medal_id    smallint    not null check (medal_id between 1 and 1000),  -- IDs from src/lib/medals.js
  progress    integer     not null check (progress >= 0),               -- best value so far, e.g. longest streak
  earned_at   timestamptz,                                              -- set once the player has been told they earned it;
                                                                        -- an earned medal stays earned
  primary key (user_id, medal_id)                                       -- the app upserts on (user_id, medal_id)
);

-- Only let people read and write their own medals, like daily_results
alter table public.user_medals enable row level security;

create policy "Users can read their own medals"
  on public.user_medals for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own medals"
  on public.user_medals for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own medals"
  on public.user_medals for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
