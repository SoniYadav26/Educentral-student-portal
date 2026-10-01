create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('PYQ', 'Syllabus', 'Notes')),
  semester text not null,
  subject text not null,
  branch text not null check (branch in ('CSE', 'IT', 'ECE', 'ME')),
  file_url text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.resources add column if not exists file_url text;
alter table public.resources add column if not exists uploaded_by uuid references auth.users(id) on delete set null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'resources'
      and column_name = 'public_url'
  ) then
    execute 'update public.resources set file_url = coalesce(file_url, public_url) where file_url is null';
    execute 'alter table public.resources drop column public_url';
  end if;
end
$$;

alter table public.resources alter column file_url set not null;
alter table public.resources alter column uploaded_by drop not null;
alter table public.resources drop constraint if exists resources_uploaded_by_fkey;
alter table public.resources
  add constraint resources_uploaded_by_fkey
  foreign key (uploaded_by) references auth.users(id) on delete set null;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(message) between 8 and 2000),
  created_at timestamptz not null default now()
);

alter table public.resources enable row level security;
alter table public.feedback enable row level security;

drop policy if exists "Anyone can read resources" on public.resources;
create policy "Anyone can read resources"
  on public.resources for select to anon, authenticated
  using (true);

drop policy if exists "Admins can add resources" on public.resources;
create policy "Admins can add resources"
  on public.resources for insert to authenticated
  with check (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    and (uploaded_by is null or uploaded_by = auth.uid())
  );

drop policy if exists "Users can submit their own feedback" on public.feedback;
create policy "Users can submit their own feedback"
  on public.feedback for insert to authenticated
  with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('study-materials', 'study-materials', true, 20971520, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read study materials" on storage.objects;
create policy "Anyone can read study materials"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'study-materials');

drop policy if exists "Admins can upload study materials" on storage.objects;
create policy "Admins can upload study materials"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'study-materials'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can remove study materials" on storage.objects;
create policy "Admins can remove study materials"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'study-materials'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );