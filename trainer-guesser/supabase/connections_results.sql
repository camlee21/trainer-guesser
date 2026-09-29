-- Daily Connections results, one row per user per day (mirrors daily_results for Daily mode).
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.

create table if not exists public.connections_results (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  date        date        not null,            -- UTC date of the puzzle, e.g. 2026-09-29
  day_number  integer     not null,            -- same numbering as Daily mode (Day #1 = 2026-06-10)
  start_id    text        not null,            -- trainer ids from trainers.json
  goal_id     text        not null,
  won         boolean     not null,            -- false = the player pressed "Show answer"
  connections integer     not null check (connections >= 0),  -- trainer-to-trainer steps in the final route
  undos       integer     not null default 0 check (undos >= 0),
  score       integer,                         -- connections + undos; null when the answer was revealed
  best_score  integer,                         -- shortest possible route for that pair
  route_json  jsonb       not null,            -- { "trainers": [ids...], "pokemon": [pokedexIds...] }
  created_at  timestamptz not null default now(),
  primary key (user_id, date)                  -- the app upserts on (user_id, date)
);

-- Only let people read and write their own results, like daily_results
alter table public.connections_results enable row level security;

create policy "Users can read their own connections results"
  on public.connections_results for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own connections results"
  on public.connections_results for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own connections results"
  on public.connections_results for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
