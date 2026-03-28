alter table public.student_profiles
  add column if not exists major text;

update public.student_profiles
set major = coalesce(nullif(major, ''), '计算机科学与技术')
where major is null
   or major = '';

alter table public.student_profiles
  alter column major set not null;

alter table public.applications
  add column if not exists attachment_path text;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  type text not null check (type in ('application_submitted', 'application_withdrawn', 'application_status_changed', 'system')),
  title text not null,
  content text not null,
  related_application_id uuid references public.applications(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_notifications_student_id_created_at
  on public.notifications(student_id, created_at desc);

create index if not exists idx_notifications_student_id_is_read
  on public.notifications(student_id, is_read, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
  on public.notifications
  for select
  to authenticated
  using (student_id = auth.uid()::text);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
  on public.notifications
  for update
  to authenticated
  using (student_id = auth.uid()::text)
  with check (student_id = auth.uid()::text);

drop policy if exists notifications_insert_own on public.notifications;
create policy notifications_insert_own
  on public.notifications
  for insert
  to authenticated
  with check (student_id = auth.uid()::text);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-resumes',
  'application-resumes',
  false,
  5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists application_resumes_insert_own on storage.objects;
create policy application_resumes_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'application-resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists application_resumes_select_own on storage.objects;
create policy application_resumes_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'application-resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists application_resumes_update_own on storage.objects;
create policy application_resumes_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'application-resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'application-resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists application_resumes_delete_own on storage.objects;
create policy application_resumes_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'application-resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
