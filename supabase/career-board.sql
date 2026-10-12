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


-- ================= CAREER PROFILES =================
create table if not exists public.career_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  headline text,
  phone text,
  city text,
  summary text,
  skills text,
  education text,
  experience text,
  languages text,
  resume_link text,
  updated_at timestamptz not null default now()
);
alter table public.career_profiles enable row level security;

drop policy if exists career_profiles_read on public.career_profiles;
create policy career_profiles_read on public.career_profiles
for select to authenticated
using (user_id = auth.uid() or public.is_career_admin());

drop policy if exists career_profiles_insert on public.career_profiles;
create policy career_profiles_insert on public.career_profiles
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists career_profiles_update on public.career_profiles;
create policy career_profiles_update on public.career_profiles
for update to authenticated
using (user_id = auth.uid() or public.is_career_admin())
with check (user_id = auth.uid() or public.is_career_admin());


-- ================= SAVED JOBS & JOB ALERTS =================
create table if not exists public.career_saved_jobs (
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.career_jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);
alter table public.career_saved_jobs enable row level security;
drop policy if exists career_saved_jobs_read on public.career_saved_jobs;
create policy career_saved_jobs_read on public.career_saved_jobs for select to authenticated using (user_id=auth.uid());
drop policy if exists career_saved_jobs_insert on public.career_saved_jobs;
create policy career_saved_jobs_insert on public.career_saved_jobs for insert to authenticated with check (user_id=auth.uid());
drop policy if exists career_saved_jobs_delete on public.career_saved_jobs;
create policy career_saved_jobs_delete on public.career_saved_jobs for delete to authenticated using (user_id=auth.uid());

create table if not exists public.career_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text,
  category text,
  location text,
  job_type text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists career_alerts_user_idx on public.career_alerts(user_id);
alter table public.career_alerts enable row level security;
drop policy if exists career_alerts_read on public.career_alerts;
create policy career_alerts_read on public.career_alerts for select to authenticated using (user_id=auth.uid());
drop policy if exists career_alerts_insert on public.career_alerts;
create policy career_alerts_insert on public.career_alerts for insert to authenticated with check (user_id=auth.uid());
drop policy if exists career_alerts_update on public.career_alerts;
create policy career_alerts_update on public.career_alerts for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists career_alerts_delete on public.career_alerts;
create policy career_alerts_delete on public.career_alerts for delete to authenticated using (user_id=auth.uid());


-- ================= ALERT DELIVERY QUEUE =================
create table if not exists public.career_alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.career_alerts(id) on delete cascade,
  job_id uuid not null references public.career_jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null default 'in_app' check (channel in ('in_app','email','push')),
  status text not null default 'unread' check (status in ('unread','read')),
  created_at timestamptz not null default now(),
  unique(alert_id, job_id, channel)
);
create index if not exists career_alert_deliveries_user_idx on public.career_alert_deliveries(user_id,created_at desc);
alter table public.career_alert_deliveries enable row level security;
drop policy if exists career_alert_delivery_read on public.career_alert_deliveries;
create policy career_alert_delivery_read on public.career_alert_deliveries for select to authenticated using (user_id=auth.uid());
drop policy if exists career_alert_delivery_update on public.career_alert_deliveries;
create policy career_alert_delivery_update on public.career_alert_deliveries for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());


-- ================= COMPANY PROFILES & VERIFICATION =================
create table if not exists public.career_company_profiles (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null,
  legal_name text,
  industry text,
  website text,
  city text,
  description text,
  contact_email text,
  logo_url text,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','pending','verified','suspended')),
  verification_note text,
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.career_company_profiles enable row level security;
drop policy if exists company_profile_read on public.career_company_profiles;
create policy company_profile_read on public.career_company_profiles
for select to authenticated
using (owner_id=auth.uid() or verification_status='verified' or public.is_career_admin());
drop policy if exists company_profile_insert on public.career_company_profiles;
create policy company_profile_insert on public.career_company_profiles
for insert to authenticated with check (owner_id=auth.uid());
drop policy if exists company_profile_update on public.career_company_profiles;
create policy company_profile_update on public.career_company_profiles
for update to authenticated using (owner_id=auth.uid() or public.is_career_admin())
with check (owner_id=auth.uid() or public.is_career_admin());

alter table public.career_jobs add column if not exists company_owner_id uuid references public.career_company_profiles(owner_id) on delete set null;
create index if not exists career_jobs_company_owner_idx on public.career_jobs(company_owner_id);


-- Require a verified company for new public career submissions.
drop policy if exists career_insert on public.career_jobs;
create policy career_insert on public.career_jobs
for insert to authenticated
with check (
  submitted_by = auth.uid()
  and exists (
    select 1 from public.career_company_profiles cp
    where cp.owner_id = auth.uid()
      and cp.verification_status = 'verified'
  )
);

drop policy if exists company_profile_admin_update on public.career_company_profiles;
create policy company_profile_admin_update on public.career_company_profiles
for update to authenticated
using (owner_id=auth.uid() or public.is_career_admin())
with check (owner_id=auth.uid() or public.is_career_admin());


-- ================= CANDIDATE / EMPLOYER MESSAGING =================
create table if not exists public.career_messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.career_applications(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists career_messages_application_idx on public.career_messages(application_id,created_at);
create index if not exists career_messages_recipient_idx on public.career_messages(recipient_id,created_at desc);
alter table public.career_messages enable row level security;

drop policy if exists career_messages_read on public.career_messages;
create policy career_messages_read on public.career_messages for select to authenticated
using (
 sender_id=auth.uid() or recipient_id=auth.uid() or public.is_career_admin()
);

drop policy if exists career_messages_insert on public.career_messages;
create policy career_messages_insert on public.career_messages for insert to authenticated
with check (
 sender_id=auth.uid()
 and (
   recipient_id=auth.uid()
   or exists (
     select 1 from public.career_applications a
     where a.id=career_messages.application_id
       and (a.applicant_id=auth.uid() or exists (
         select 1 from public.career_jobs j
         where j.id=a.job_id and j.submitted_by=auth.uid()
       ))
   )
 )
);

drop policy if exists career_messages_update on public.career_messages;
create policy career_messages_update on public.career_messages for update to authenticated
using (recipient_id=auth.uid() or public.is_career_admin())
with check (recipient_id=auth.uid() or public.is_career_admin());


-- ================= INTERVIEW MANAGEMENT =================
create table if not exists public.career_interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.career_applications(id) on delete cascade,
  organizer_id uuid not null references auth.users(id) on delete cascade,
  candidate_id uuid not null references auth.users(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes between 15 and 180),
  mode text not null default 'online' check (mode in ('online','phone','in_person')),
  meeting_link text,
  location text,
  notes text,
  status text not null default 'proposed' check (status in ('proposed','confirmed','declined','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists career_interviews_candidate_idx on public.career_interviews(candidate_id,scheduled_at);
create index if not exists career_interviews_organizer_idx on public.career_interviews(organizer_id,scheduled_at);
alter table public.career_interviews enable row level security;

drop policy if exists career_interviews_read on public.career_interviews;
create policy career_interviews_read on public.career_interviews for select to authenticated
using (candidate_id=auth.uid() or organizer_id=auth.uid() or public.is_career_admin());

drop policy if exists career_interviews_insert on public.career_interviews;
create policy career_interviews_insert on public.career_interviews for insert to authenticated
with check (
 organizer_id=auth.uid()
 and exists (
   select 1 from public.career_applications a
   join public.career_jobs j on j.id=a.job_id
   where a.id=career_interviews.application_id
     and a.applicant_id=career_interviews.candidate_id
     and j.submitted_by=auth.uid()
 )
);

drop policy if exists career_interviews_update on public.career_interviews;
create policy career_interviews_update on public.career_interviews for update to authenticated
using (candidate_id=auth.uid() or organizer_id=auth.uid() or public.is_career_admin())
with check (candidate_id=auth.uid() or organizer_id=auth.uid() or public.is_career_admin());


-- ================= APPLICATION STATUS HISTORY =================
create table if not exists public.career_application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.career_applications(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists career_application_events_app_idx on public.career_application_events(application_id,created_at);
alter table public.career_application_events enable row level security;
drop policy if exists career_application_events_read on public.career_application_events;
create policy career_application_events_read on public.career_application_events for select to authenticated
using (
 actor_id=auth.uid() or
 exists (select 1 from public.career_applications a join public.career_jobs j on j.id=a.job_id where a.id=career_application_events.application_id and (a.applicant_id=auth.uid() or j.submitted_by=auth.uid()))
 or public.is_career_admin()
);
drop policy if exists career_application_events_insert on public.career_application_events;
create policy career_application_events_insert on public.career_application_events for insert to authenticated
with check (
 actor_id=auth.uid() and
 exists (select 1 from public.career_applications a join public.career_jobs j on j.id=a.job_id where a.id=career_application_events.application_id and (a.applicant_id=auth.uid() or j.submitted_by=auth.uid()))
);


-- ================= CAREER STATUS NOTIFICATIONS =================
create table if not exists public.career_status_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.career_applications(id) on delete cascade,
  event_id uuid references public.career_application_events(id) on delete cascade,
  title text not null,
  body text not null,
  status text not null default 'unread' check (status in ('unread','read')),
  created_at timestamptz not null default now()
);
create index if not exists career_status_notifications_user_idx on public.career_status_notifications(user_id,created_at desc);
alter table public.career_status_notifications enable row level security;
drop policy if exists career_status_notifications_read on public.career_status_notifications;
create policy career_status_notifications_read on public.career_status_notifications for select to authenticated using (user_id=auth.uid());
drop policy if exists career_status_notifications_update on public.career_status_notifications;
create policy career_status_notifications_update on public.career_status_notifications for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists career_status_notifications_insert on public.career_status_notifications;
create policy career_status_notifications_insert on public.career_status_notifications for insert to authenticated with check (user_id=auth.uid() or public.is_career_admin());
