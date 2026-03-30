alter table public.club_admin_memberships
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.platform_admin_users
  add column if not exists user_id uuid references auth.users(id) on delete set null;

update public.club_admin_memberships
set
  email = lower(trim(email)),
  updated_at = timezone('utc', now())
where email <> lower(trim(email));

update public.platform_admin_users
set
  email = lower(trim(email)),
  updated_at = timezone('utc', now())
where email <> lower(trim(email));

create unique index if not exists club_admin_memberships_user_id_club_id_key
  on public.club_admin_memberships (user_id, club_id)
  where user_id is not null;

create unique index if not exists platform_admin_users_user_id_key
  on public.platform_admin_users (user_id)
  where user_id is not null;

create index if not exists club_admin_memberships_user_id_idx
  on public.club_admin_memberships (user_id)
  where user_id is not null;

create index if not exists platform_admin_users_email_idx
  on public.platform_admin_users (email);

create index if not exists club_admin_memberships_email_idx
  on public.club_admin_memberships (email);
