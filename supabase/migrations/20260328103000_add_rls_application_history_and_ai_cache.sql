alter table public.applications
  add column if not exists updated_at timestamptz not null default timezone('utc', now()),
  add column if not exists last_status_changed_at timestamptz not null default timezone('utc', now()),
  add column if not exists withdrawn_at timestamptz;

update public.applications
set
  updated_at = coalesce(updated_at, submitted_at, timezone('utc', now())),
  last_status_changed_at = coalesce(last_status_changed_at, submitted_at, timezone('utc', now()))
where updated_at is null
   or last_status_changed_at is null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'applications_status_check'
      and conrelid = 'public.applications'::regclass
  ) then
    alter table public.applications drop constraint applications_status_check;
  end if;
end $$;

alter table public.applications
  add constraint applications_status_check
  check (status in ('已提交', '待筛选', '待面试', '已录取', '未通过', '已放弃'));

create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  student_id text not null,
  from_status text check (from_status in ('已提交', '待筛选', '待面试', '已录取', '未通过', '已放弃')),
  to_status text not null check (to_status in ('已提交', '待筛选', '待面试', '已录取', '未通过', '已放弃')),
  operator_type text not null check (operator_type in ('student', 'club_admin', 'school_admin', 'system')),
  operator_id text,
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_application_status_history_application_id
  on public.application_status_history(application_id, created_at desc);

create index if not exists idx_application_status_history_student_id
  on public.application_status_history(student_id, created_at desc);

insert into public.application_status_history (
  application_id,
  student_id,
  from_status,
  to_status,
  operator_type,
  operator_id,
  note,
  created_at
)
select
  applications.id,
  applications.student_id,
  null,
  applications.status,
  'system',
  null,
  applications.note,
  applications.submitted_at
from public.applications
where not exists (
  select 1
  from public.application_status_history history
  where history.application_id = applications.id
);

alter table public.match_runs
  add column if not exists profile_snapshot_hash text,
  add column if not exists source text not null default 'ai';

update public.match_runs
set source = coalesce(source, 'ai')
where source is null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'match_runs_source_check'
      and conrelid = 'public.match_runs'::regclass
  ) then
    alter table public.match_runs drop constraint match_runs_source_check;
  end if;
end $$;

alter table public.match_runs
  add constraint match_runs_source_check
  check (source in ('ai', 'cache'));

create index if not exists idx_match_runs_student_profile_hash
  on public.match_runs(student_id, profile_snapshot_hash, created_at desc);

alter table public.clubs enable row level security;
alter table public.student_profiles enable row level security;
alter table public.favorite_clubs enable row level security;
alter table public.applications enable row level security;
alter table public.match_runs enable row level security;
alter table public.application_status_history enable row level security;

drop policy if exists clubs_read_active on public.clubs;
create policy clubs_read_active
  on public.clubs
  for select
  to authenticated
  using (is_active = true);

drop policy if exists student_profiles_select_own on public.student_profiles;
create policy student_profiles_select_own
  on public.student_profiles
  for select
  to authenticated
  using (student_id = auth.uid()::text);

drop policy if exists student_profiles_insert_own on public.student_profiles;
create policy student_profiles_insert_own
  on public.student_profiles
  for insert
  to authenticated
  with check (student_id = auth.uid()::text);

drop policy if exists student_profiles_update_own on public.student_profiles;
create policy student_profiles_update_own
  on public.student_profiles
  for update
  to authenticated
  using (student_id = auth.uid()::text)
  with check (student_id = auth.uid()::text);

drop policy if exists favorite_clubs_select_own on public.favorite_clubs;
create policy favorite_clubs_select_own
  on public.favorite_clubs
  for select
  to authenticated
  using (student_id = auth.uid()::text);

drop policy if exists favorite_clubs_insert_own on public.favorite_clubs;
create policy favorite_clubs_insert_own
  on public.favorite_clubs
  for insert
  to authenticated
  with check (student_id = auth.uid()::text);

drop policy if exists favorite_clubs_delete_own on public.favorite_clubs;
create policy favorite_clubs_delete_own
  on public.favorite_clubs
  for delete
  to authenticated
  using (student_id = auth.uid()::text);

drop policy if exists applications_select_own on public.applications;
create policy applications_select_own
  on public.applications
  for select
  to authenticated
  using (student_id = auth.uid()::text);

drop policy if exists applications_insert_own on public.applications;
create policy applications_insert_own
  on public.applications
  for insert
  to authenticated
  with check (student_id = auth.uid()::text);

drop policy if exists applications_update_own on public.applications;
create policy applications_update_own
  on public.applications
  for update
  to authenticated
  using (student_id = auth.uid()::text)
  with check (student_id = auth.uid()::text);

drop policy if exists match_runs_select_own on public.match_runs;
create policy match_runs_select_own
  on public.match_runs
  for select
  to authenticated
  using (student_id = auth.uid()::text);

drop policy if exists match_runs_insert_own on public.match_runs;
create policy match_runs_insert_own
  on public.match_runs
  for insert
  to authenticated
  with check (student_id = auth.uid()::text);

drop policy if exists application_status_history_select_own on public.application_status_history;
create policy application_status_history_select_own
  on public.application_status_history
  for select
  to authenticated
  using (student_id = auth.uid()::text);

drop policy if exists application_status_history_insert_own on public.application_status_history;
create policy application_status_history_insert_own
  on public.application_status_history
  for insert
  to authenticated
  with check (student_id = auth.uid()::text);
