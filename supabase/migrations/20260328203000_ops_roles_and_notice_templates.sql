create table if not exists public.club_admin_memberships (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  club_id text not null references public.clubs(id) on delete cascade,
  role text not null check (role in ('owner', 'manager')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (email, club_id)
);

create table if not exists public.platform_admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('super_admin', 'operator')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.recruitment_cycles
  add column if not exists interview_notice_template text not null default '你已进入{{clubName}}的面试环节，请关注以下安排：{{note}}';

insert into public.club_admin_memberships (email, club_id, role, is_active)
values
  ('media-admin@campus.edu', 'club-media', 'owner', true),
  ('public-admin@campus.edu', 'club-public', 'owner', true)
on conflict (email, club_id) do update set
  role = excluded.role,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

insert into public.platform_admin_users (email, role, is_active)
values
  ('admin@campus.edu', 'super_admin', true)
on conflict (email) do update set
  role = excluded.role,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());
