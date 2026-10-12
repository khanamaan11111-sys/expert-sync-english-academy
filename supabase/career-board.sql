-- Expert Sync English Academy — Career Board
create extension if not exists pgcrypto;
create table if not exists public.career_jobs (
 id uuid primary key default gen_random_uuid(), title text not null, company text not null,
 location text not null, job_type text not null, category text not null, salary text,
 apply_to text not null, description text not null,
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 submitted_by uuid references auth.users(id) on delete set null, submitter_email text,
 created_at timestamptz not null default now(), reviewed_at timestamptz
);
create index if not exists career_jobs_status_idx on public.career_jobs(status);
create index if not exists career_jobs_created_at_idx on public.career_jobs(created_at desc);
create index if not exists career_jobs_submitted_by_idx on public.career_jobs(submitted_by);
alter table public.career_jobs enable row level security;
create or replace function public.is_career_admin() returns boolean language sql stable security definer set search_path=public as $$ select coalesce((auth.jwt()->'app_metadata'->>'role')='admin',false); $$;
drop policy if exists career_public_read on public.career_jobs;
create policy career_public_read on public.career_jobs for select to anon,authenticated using (status='approved' or submitted_by=auth.uid() or public.is_career_admin());
drop policy if exists career_insert on public.career_jobs;
create policy career_insert on public.career_jobs for insert to authenticated with check (submitted_by=auth.uid());
drop policy if exists career_admin_update on public.career_jobs;
create policy career_admin_update on public.career_jobs for update to authenticated using (public.is_career_admin()) with check (public.is_career_admin());
drop policy if exists career_admin_delete on public.career_jobs;
create policy career_admin_delete on public.career_jobs for delete to authenticated using (public.is_career_admin());
