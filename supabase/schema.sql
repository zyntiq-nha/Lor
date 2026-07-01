-- Run in Supabase SQL editor
create extension if not exists "pgcrypto";

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department text not null,
  tenure text,
  template_content text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lor_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text not null,
  tenure text not null,
  template_id uuid not null references public.templates(id) on delete restrict,
  token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists lor_users_email_name_uq
on public.lor_users (lower(email), lower(name));

create table if not exists public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('super_admin', 'admin'))
);

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (select 1 from public.admins a where a.id = uid);
$$;

alter table public.templates enable row level security;
alter table public.lor_users enable row level security;
alter table public.admins enable row level security;

drop policy if exists "templates read for admin" on public.templates;
create policy "templates read for admin"
on public.templates for select
using (public.is_admin(auth.uid()));

drop policy if exists "templates write for admin" on public.templates;
create policy "templates write for admin"
on public.templates for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "lor_users read for admin" on public.lor_users;
create policy "lor_users read for admin"
on public.lor_users for select
using (public.is_admin(auth.uid()));

drop policy if exists "lor_users write for admin" on public.lor_users;
create policy "lor_users write for admin"
on public.lor_users for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "admins self read" on public.admins;
create policy "admins self read"
on public.admins for select
using (id = auth.uid());

drop policy if exists "admins managed by super_admin" on public.admins;
create policy "admins managed by super_admin"
on public.admins for all
using (
  exists (
    select 1 from public.admins a
    where a.id = auth.uid() and a.role = 'super_admin'
  )
)
with check (
  exists (
    select 1 from public.admins a
    where a.id = auth.uid() and a.role = 'super_admin'
  )
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_templates_updated_at on public.templates;
create trigger trg_templates_updated_at
before update on public.templates
for each row execute function public.touch_updated_at();

drop trigger if exists trg_lor_users_updated_at on public.lor_users;
create trigger trg_lor_users_updated_at
before update on public.lor_users
for each row execute function public.touch_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- Seed: LOR Templates for new roles (Marketing & Business Development)
-- Run once after initial schema setup. Uses ON CONFLICT DO NOTHING so it is
-- safe to re-run the full script without creating duplicates.
-- ────────────────────────────────────────────────────────────────────────────

insert into public.templates (name, department, tenure, template_content, is_active)
values (
  'Zyntiq Marketing LOR',
  'Marketing',
  '1-2 Months',
  'It is a pleasure to write this letter of recommendation for {{Name}}. During the {{Tenure}} {{Role}} internship with us, {{Name}} demonstrated a strong grasp of digital marketing principles, brand communication, and audience engagement strategies. They approached every task with creativity and a results-driven mindset.

Throughout the internship, {{Name}} contributed meaningfully to our marketing initiatives — from content creation and social media management to campaign planning and analytics review. Their ability to translate ideas into compelling narratives was evident in the quality of work they delivered consistently and on time.

We found {{Name}} to be a motivated, proactive, and collaborative team member who brought genuine enthusiasm to every project. Their professionalism and eagerness to learn made them a valued addition to our Marketing team at Zyntiq.

I wholeheartedly recommend {{Name}} for any future academic or professional opportunities in the field of Marketing. We are confident they will continue to excel and make a meaningful impact wherever they go.

Sincerely,
Atul Kumar
Founder Zyntiq.',
  true
)
on conflict do nothing;

insert into public.templates (name, department, tenure, template_content, is_active)
values (
  'Zyntiq Business Development LOR',
  'Business Development',
  '1-2 Months',
  'It is a pleasure to write this letter of recommendation for {{Name}}. During the {{Tenure}} {{Role}} internship with us, {{Name}} displayed exceptional aptitude for identifying business opportunities, building professional relationships, and contributing to our growth strategy with maturity beyond their experience level.

{{Name}} actively participated in market research, lead generation activities, and client outreach efforts, demonstrating a clear understanding of business dynamics and sales fundamentals. Their analytical thinking and communication skills were consistently impressive, and they delivered every assignment with diligence and precision.

We at Zyntiq found {{Name}} to be a driven, goal-oriented, and reliable individual who adapted quickly to real-world business challenges. They were a true asset to our Business Development team and left a positive impression on everyone they worked with.

I wholeheartedly recommend {{Name}} for any future academic or professional pursuits in Business Development or related fields. We are certain they have a bright and successful career ahead.

Sincerely,
Atul Kumar
Founder Zyntiq.',
  true
)
on conflict do nothing;