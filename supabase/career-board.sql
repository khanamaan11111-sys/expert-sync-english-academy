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


-- ================= APPLICATIONS =================
create table if not exists public.career_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.career_jobs(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  applicant_name text,
  applicant_email text,
  message text not null,
  resume_link text,
  status text not null default 'submitted'
    check (status in ('submitted','shortlisted','rejected','hired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, applicant_id)
);

create index if not exists career_applications_job_idx on public.career_applications(job_id);
create index if not exists career_applications_applicant_idx on public.career_applications(applicant_id);

alter table public.career_applications enable row level security;

drop policy if exists career_apps_read on public.career_applications;
create policy career_apps_read on public.career_applications
for select to authenticated
using (
  applicant_id = auth.uid()
  or public.is_career_admin()
  or exists (
    select 1 from public.career_jobs j
    where j.id = career_applications.job_id
      and j.submitted_by = auth.uid()
  )
);

drop policy if exists career_apps_insert on public.career_applications;
create policy career_apps_insert on public.career_applications
for insert to authenticated
with check (applicant_id = auth.uid());

drop policy if exists career_apps_update on public.career_applications;
create policy career_apps_update on public.career_applications
for update to authenticated
using (
  public.is_career_admin()
  or exists (
    select 1 from public.career_jobs j
    where j.id = career_applications.job_id
      and j.submitted_by = auth.uid()
  )
)
with check (
  public.is_career_admin()
  or exists (
    select 1 from public.career_jobs j
    where j.id = career_applications.job_id
      and j.submitted_by = auth.uid()
  )
);


-- ================= TRUST, VERIFICATION & EXPIRY =================
alter table public.career_jobs add column if not exists expires_at timestamptz;
alter table public.career_jobs add column if not exists employer_verified boolean not null default false;
alter table public.career_jobs add column if not exists is_suspended boolean not null default false;
alter table public.career_jobs add column if not exists reports_count integer not null default 0;
alter table public.career_jobs add column if not exists moderation_note text;

create index if not exists career_jobs_expiry_idx on public.career_jobs(expires_at);

create table if not exists public.career_job_reports (
 id uuid primary key default gen_random_uuid(),
 job_id uuid not null references public.career_jobs(id) on delete cascade,
 reporter_id uuid references auth.users(id) on delete set null,
 reason text not null,
 created_at timestamptz not null default now(),
 resolved_at timestamptz
);
create index if not exists career_job_reports_job_idx on public.career_job_reports(job_id);
alter table public.career_job_reports enable row level security;

drop policy if exists career_reports_insert on public.career_job_reports;
create policy career_reports_insert on public.career_job_reports
for insert to authenticated with check (reporter_id = auth.uid());

drop policy if exists career_reports_read on public.career_job_reports;
create policy career_reports_read on public.career_job_reports
for select to authenticated using (public.is_career_admin());

drop policy if exists career_reports_update on public.career_job_reports;
create policy career_reports_update on public.career_job_reports
for update to authenticated using (public.is_career_admin()) with check (public.is_career_admin());

-- Publicly visible means approved, not suspended, and not expired.
drop policy if exists career_public_read on public.career_jobs;
create policy career_public_read on public.career_jobs for select to anon,authenticated
using (
  (status='approved' and is_suspended=false and (expires_at is null or expires_at > now()))
  or submitted_by=auth.uid()
  or public.is_career_admin()
);
