alter table public.clubs
  add column if not exists leader_name text,
  add column if not exists contact_email text,
  add column if not exists review_status text,
  add column if not exists review_note text not null default '';

update public.clubs
set
  leader_name = coalesce(nullif(leader_name, ''), '待补充负责人'),
  contact_email = coalesce(nullif(contact_email, ''), concat(id, '@campus.edu')),
  review_status = coalesce(nullif(review_status, ''), case when is_active then 'approved' else 'pending_review' end),
  review_note = coalesce(review_note, '')
where leader_name is null
   or contact_email is null
   or review_status is null
   or review_note is null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'clubs_review_status_check'
      and conrelid = 'public.clubs'::regclass
  ) then
    alter table public.clubs drop constraint clubs_review_status_check;
  end if;
end $$;

alter table public.clubs
  alter column leader_name set not null,
  alter column contact_email set not null,
  alter column review_status set not null,
  add constraint clubs_review_status_check
    check (review_status in ('draft', 'pending_review', 'approved', 'rejected'));

alter table public.applications
  add column if not exists student_email text;

update public.applications
set student_email = coalesce(nullif(student_email, ''), concat(student_id, '@campus.local'))
where student_email is null
   or student_email = '';

create table if not exists public.recruitment_cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  apply_enabled boolean not null default true,
  notice_template text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.recruitment_cycles (
  name,
  start_date,
  end_date,
  apply_enabled,
  notice_template
)
values (
  '2026春秋统一招新周期',
  '2026-03-01',
  '2026-10-31',
  true,
  '招新周期已开放，请社团及时处理报名并同步结果通知。'
)
on conflict do nothing;
