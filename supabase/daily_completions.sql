-- Anonymous count of finished daily puzzles, plus a push notification with the totals every 6 hours.
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Before running, replace YOUR-NTFY-TOPIC below with your own hard-to-guess ntfy topic name.

-- 1. The counter: one row per UTC day per mode. No user ids, IPs or anything else about the player.
create table if not exists public.daily_completions (
  date   date    not null,                        -- UTC date of the puzzle, e.g. 2026-09-30
  mode   text    not null check (mode in ('trainer', 'connections')),
  count  integer not null default 0,
  primary key (date, mode)
);

-- No policies, so nobody can read or edit the table directly. The app only adds to it
-- through record_completion below.
alter table public.daily_completions enable row level security;

-- Called by the app (guests and signed-in players) each time a daily puzzle is finished
create or replace function public.record_completion(p_mode text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.daily_completions (date, mode, count)
  values ((now() at time zone 'utc')::date, p_mode, 1)
  on conflict (date, mode) do update set count = daily_completions.count + 1;
$$;

revoke all on function public.record_completion(text) from public;
grant execute on function public.record_completion(text) to anon, authenticated;

-- 2. The notification. pg_net sends web requests from the database, pg_cron runs things on a schedule.
create extension if not exists pg_net;
create extension if not exists pg_cron;

create or replace function public.send_completion_update()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Looking 5 minutes back means the 00:00 UTC run (8am GMT+8) reports the day that just
  -- ended as final, instead of the one that started seconds ago
  v_day         date := ((now() at time zone 'utc') - interval '5 minutes')::date;
  v_final       boolean := v_day < (now() at time zone 'utc')::date;
  v_day_number  integer := v_day - date '2026-06-10' + 1;  -- same numbering as the app (Day #1 = 2026-06-10)
  v_trainer     integer;
  v_connections integer;
begin
  select coalesce(sum(count) filter (where mode = 'trainer'), 0),
         coalesce(sum(count) filter (where mode = 'connections'), 0)
    into v_trainer, v_connections
    from public.daily_completions
   where date = v_day;

  perform net.http_post(
    url  := 'https://ntfy.sh',
    body := jsonb_build_object(
      'topic',   'YOUR-NTFY-TOPIC',
      'title',   format('Day #%s %s', v_day_number, case when v_final then 'final' else 'so far' end),
      'message', format('Daily Trainer: %s' || chr(10) || 'Daily Connections: %s', v_trainer, v_connections)
    )
  );
end;
$$;

-- Only the scheduled job may send notifications, not visitors to the site
revoke all on function public.send_completion_update() from public, anon, authenticated;

-- pg_cron uses UTC: 00:00, 06:00, 12:00, 18:00 UTC = 8am (final), 2pm, 8pm, 2am GMT+8
select cron.schedule('completion-update', '0 */6 * * *', 'select public.send_completion_update()');


-- FOR LATER

-- Change the times (reusing the same name replaces the old schedule), e.g. 2am/8am/2pm/8pm UTC:
--select cron.schedule('completion-update', '0 2,8,14,20 * * *', 'select public.send_completion_update()');

-- Stop the updates:
--select cron.unschedule('completion-update');

-- Check whether recent runs succeeded:
--select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;