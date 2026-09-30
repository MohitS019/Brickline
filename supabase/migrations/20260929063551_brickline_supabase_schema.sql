create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.brickline_role as enum ('Agent', 'Builder', 'Client');
create type public.account_status as enum ('pending', 'approved', 'suspended', 'rejected');
create type public.verification_status as enum ('rera-verified', 'pending', 'unverified');
create type public.project_status as enum ('New construction', 'Redevelopment', 'Approval stage', 'Construction started');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.brickline_role not null,
  status public.account_status not null default 'pending',
  company_name text not null default '',
  city text not null default '',
  rera_number text,
  gst_number text,
  phone text,
  business_address text,
  contact_person text,
  agency_name text,
  verification_status public.verification_status not null default 'pending',
  rejection_reason text,
  is_admin boolean not null default false,
  agent_access boolean not null default false,
  builder_access boolean not null default false,
  client_access boolean not null default false,
  consent_version text not null default '2026-09-23',
  consent_at timestamptz,
  consent_withdrawn_at timestamptz,
  deletion_requested_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_format check (position('@' in email) > 1),
  constraint profiles_gst_format check (gst_number is null or gst_number ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$')
);

create unique index profiles_email_unique on public.profiles (lower(email));
create unique index profiles_rera_unique on public.profiles (upper(rera_number)) where rera_number is not null;
create unique index profiles_gst_unique on public.profiles (upper(gst_number)) where gst_number is not null;
create index profiles_status_created_idx on public.profiles (status, created_at desc);

create table public.builders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete cascade,
  name text not null,
  verification_status public.verification_status not null default 'pending',
  locality text not null default '',
  city text not null default '',
  is_demo_record boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index builders_profile_idx on public.builders(profile_id);
create index builders_city_idx on public.builders(city, locality);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  builder_id uuid not null references public.builders(id) on delete restrict,
  locality text not null,
  city text not null,
  country text not null default 'India',
  site_address text,
  currency text not null default 'INR',
  rera_number text,
  status public.project_status not null,
  est_value numeric(14,2) not null default 0,
  homes integer not null default 0 check (homes >= 0),
  completion_date text not null default '',
  description text not null default '',
  latitude double precision,
  longitude double precision,
  published boolean not null default false,
  view_count integer not null default 0 check (view_count >= 0),
  verification_status public.verification_status not null default 'pending',
  is_demo_record boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_builder_idx on public.projects(builder_id);
create index projects_city_status_idx on public.projects(city, status);
create index projects_created_idx on public.projects(created_at desc);
create unique index projects_rera_unique on public.projects(upper(rera_number)) where rera_number is not null;

create table public.introductions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  builder_id uuid not null references public.builders(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  duration_minutes integer not null check (duration_minutes in (15, 30, 60, 120)),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  opened_at timestamptz,
  last_opened_at timestamptz,
  revoked_at timestamptz,
  expiry_logged_at timestamptz,
  open_count integer not null default 0 check (open_count between 0 and 5),
  bound_device_hash text,
  last_country text,
  device_label text,
  constraint introductions_expiry_matches_duration check (
    expires_at >= created_at + make_interval(mins => duration_minutes)
    and expires_at <= created_at + make_interval(mins => duration_minutes) + interval '5 seconds'
  )
);

create index introductions_agent_created_idx on public.introductions(agent_id, created_at desc);
create index introductions_client_expiry_idx on public.introductions(client_id, expires_at desc);

create table public.area_signals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  status_tag public.project_status not null,
  locality text not null,
  city text not null,
  state text not null default '',
  source_label text not null,
  event_date date not null default current_date,
  is_demo_record boolean not null default false,
  created_at timestamptz not null default now()
);

create index area_signals_city_created_idx on public.area_signals(city, created_at desc);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_actor_created_idx on public.audit_events(actor_id, created_at desc);
create index audit_events_type_created_idx on public.audit_events(event_type, created_at desc);

create table public.panel_content (
  role public.brickline_role primary key,
  headline text not null,
  accent text not null,
  description text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_type text not null check (request_type in ('export', 'correction', 'deletion', 'withdraw-consent')),
  details text not null default '',
  status text not null default 'pending' check (status in ('pending', 'completed', 'rejected')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete set null
);

create index privacy_requests_status_created_idx on public.privacy_requests(status, requested_at desc);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false)
$$;

create or replace function private.has_approved_role(required_role public.brickline_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select p.status = 'approved' and (p.role = required_role or p.is_admin)
    from public.profiles p
    where p.id = (select auth.uid())
  ), false)
$$;

create or replace function private.owns_builder(target_builder uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin() or exists (
    select 1 from public.builders b
    join public.profiles p on p.id = b.profile_id
    where b.id = target_builder
      and b.profile_id = (select auth.uid())
      and p.status = 'approved'
      and p.role = 'Builder'
  )
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.has_approved_role(public.brickline_role) from public;
revoke all on function private.owns_builder(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.has_approved_role(public.brickline_role) to authenticated;
grant execute on function private.owns_builder(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.brickline_role;
begin
  requested_role := case new.raw_user_meta_data ->> 'role'
    when 'Builder' then 'Builder'::public.brickline_role
    when 'Client' then 'Client'::public.brickline_role
    else 'Agent'::public.brickline_role
  end;

  insert into public.profiles (
    id, email, full_name, role, company_name, city, rera_number, gst_number,
    phone, business_address, contact_person, agency_name, consent_at
  ) values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    requested_role,
    left(coalesce(new.raw_user_meta_data ->> 'company_name', ''), 120),
    left(coalesce(new.raw_user_meta_data ->> 'city', ''), 120),
    nullif(left(coalesce(new.raw_user_meta_data ->> 'rera_number', ''), 80), ''),
    nullif(upper(left(coalesce(new.raw_user_meta_data ->> 'gst_number', ''), 15)), ''),
    nullif(left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 24), ''),
    nullif(left(coalesce(new.raw_user_meta_data ->> 'business_address', ''), 300), ''),
    nullif(left(coalesce(new.raw_user_meta_data ->> 'contact_person', ''), 120), ''),
    nullif(left(coalesce(new.raw_user_meta_data ->> 'agency_name', ''), 120), ''),
    now()
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.builders enable row level security;
alter table public.projects enable row level security;
alter table public.introductions enable row level security;
alter table public.area_signals enable row level security;
alter table public.audit_events enable row level security;
alter table public.panel_content enable row level security;
alter table public.privacy_requests enable row level security;

revoke all on public.profiles, public.builders, public.projects, public.introductions,
  public.area_signals, public.audit_events, public.panel_content, public.privacy_requests
  from anon, authenticated;

grant select on public.builders, public.projects, public.area_signals, public.panel_content to anon, authenticated;
grant select on public.profiles, public.introductions, public.audit_events, public.privacy_requests to authenticated;
grant update (full_name, company_name, city, rera_number, gst_number, phone, business_address, contact_person, agency_name, updated_at) on public.profiles to authenticated;
grant insert (profile_id, name, locality, city) on public.builders to authenticated;
grant update (name, locality, city, updated_at) on public.builders to authenticated;
grant insert (name, builder_id, locality, city, country, site_address, currency, rera_number, status, est_value, homes, completion_date, description, latitude, longitude, published) on public.projects to authenticated;
grant update (name, locality, city, country, site_address, currency, rera_number, status, est_value, homes, completion_date, description, latitude, longitude, published, updated_at) on public.projects to authenticated;
grant insert (agent_id, client_id, builder_id, project_id, duration_minutes, created_at, expires_at) on public.introductions to authenticated;
grant update (revoked_at) on public.introductions to authenticated;
grant insert on public.privacy_requests to authenticated;
grant insert, update on public.area_signals, public.panel_content to authenticated;
grant update (status, completed_at, completed_by) on public.privacy_requests to authenticated;

create policy profiles_select_own_or_admin on public.profiles for select to authenticated
using ((select auth.uid()) = id or private.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
create policy profiles_update_admin on public.profiles for update to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy builders_public_read on public.builders for select to anon, authenticated using (true);
create policy builders_insert_owner on public.builders for insert to authenticated
with check (profile_id = (select auth.uid()) and private.has_approved_role('Builder'));
create policy builders_insert_admin on public.builders for insert to authenticated
with check (private.is_admin());
create policy builders_update_owner on public.builders for update to authenticated
using (profile_id = (select auth.uid()) or private.is_admin())
with check (profile_id = (select auth.uid()) or private.is_admin());

create policy projects_public_read on public.projects for select to anon, authenticated using (true);
create policy projects_insert_owner on public.projects for insert to authenticated
with check (private.owns_builder(builder_id));
create policy projects_update_owner on public.projects for update to authenticated
using (private.owns_builder(builder_id))
with check (private.owns_builder(builder_id));

create policy introductions_read_participant on public.introductions for select to authenticated
using ((select auth.uid()) in (agent_id, client_id) or private.is_admin());
create policy introductions_insert_agent on public.introductions for insert to authenticated
with check (
  agent_id = (select auth.uid())
  and private.has_approved_role('Agent')
  and exists (select 1 from public.profiles c where c.id = client_id and c.role = 'Client' and c.status = 'approved')
);
create policy introductions_update_agent on public.introductions for update to authenticated
using (agent_id = (select auth.uid()) or private.is_admin())
with check (agent_id = (select auth.uid()) or private.is_admin());

create policy area_signals_public_read on public.area_signals for select to anon, authenticated using (true);
create policy area_signals_admin_insert on public.area_signals for insert to authenticated with check (private.is_admin());
create policy area_signals_admin_update on public.area_signals for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy audit_events_admin_read on public.audit_events for select to authenticated using (private.is_admin());
create policy panel_content_public_read on public.panel_content for select to anon, authenticated using (true);
create policy panel_content_admin_insert on public.panel_content for insert to authenticated with check (private.is_admin());
create policy panel_content_admin_update on public.panel_content for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy privacy_requests_read_own_or_admin on public.privacy_requests for select to authenticated
using (user_id = (select auth.uid()) or private.is_admin());
create policy privacy_requests_insert_own on public.privacy_requests for insert to authenticated
with check (user_id = (select auth.uid()));
create policy privacy_requests_admin_update on public.privacy_requests for update to authenticated
using (private.is_admin())
with check (private.is_admin());

insert into public.panel_content (role, headline, accent, description) values
  ('Agent', 'From discovery to', 'a trusted introduction.', 'Find a builder on the map, prepare a client-specific invitation, then choose an access window from 15 minutes to 2 hours when secure sharing is connected.'),
  ('Builder', 'Keep your profile', 'in your control.', 'Project summaries and their map locations help agents and clients discover your work. Your builder profile stays behind an agent introduction for clients.'),
  ('Client', 'Research first.', 'Meet the right builder second.', 'Browse the public map and projects, then open private builder details only when your agent shares a time-limited introduction.');

insert into public.builders (id, name, verification_status, locality, city, is_demo_record) values
  ('10000000-0000-4000-8000-000000000001', 'Meridian Habitat', 'rera-verified', 'Bandra East', 'Mumbai', true),
  ('10000000-0000-4000-8000-000000000002', 'Northstar Realty', 'rera-verified', 'Baner', 'Pune', true),
  ('10000000-0000-4000-8000-000000000003', 'Cedarline Developments', 'rera-verified', 'Whitefield', 'Bengaluru', true),
  ('10000000-0000-4000-8000-000000000004', 'Deccan Urbanworks', 'pending', 'Gachibowli', 'Hyderabad', true),
  ('10000000-0000-4000-8000-000000000005', 'Aster Districts', 'pending', 'Wakad', 'Pune', true);

insert into public.projects (id, name, builder_id, locality, city, site_address, status, est_value, homes, completion_date, description, latitude, longitude, published, view_count, verification_status, is_demo_record) values
  ('20000000-0000-4000-8000-000000000001', 'Meridian One BKC', '10000000-0000-4000-8000-000000000001', 'Bandra East', 'Mumbai', 'Plot C-18, G Block, Bandra Kurla Complex', 'Construction started', 920, 312, 'Q4 2028', 'Illustrative premium mixed-use district with office, retail, and residential phases.', 19.0596, 72.8656, true, 184, 'rera-verified', true),
  ('20000000-0000-4000-8000-000000000002', 'Powai Lake Terraces', '10000000-0000-4000-8000-000000000001', 'Powai', 'Mumbai', 'Saki Vihar Road, Powai', 'Approval stage', 680, 224, 'Q2 2029', 'Illustrative lakeside residential project planned around pedestrian courtyards.', 19.1176, 72.9060, true, 97, 'rera-verified', true),
  ('20000000-0000-4000-8000-000000000003', 'Kothrud Commons', '10000000-0000-4000-8000-000000000002', 'Kothrud', 'Pune', 'Paud Road, Kothrud', 'Redevelopment', 410, 146, 'Q1 2028', 'Illustrative cooperative-housing redevelopment with phased resident handover.', 18.5074, 73.8077, true, 151, 'rera-verified', true),
  ('20000000-0000-4000-8000-000000000004', 'Hinjawadi Square', '10000000-0000-4000-8000-000000000002', 'Hinjawadi', 'Pune', 'Phase 2 Road, Rajiv Gandhi Infotech Park', 'New construction', 560, 410, 'Q3 2029', 'Illustrative transit-oriented residential and neighbourhood retail development.', 18.5913, 73.7389, true, 83, 'rera-verified', true),
  ('20000000-0000-4000-8000-000000000005', 'Whitefield Grove', '10000000-0000-4000-8000-000000000003', 'Whitefield', 'Bengaluru', 'ITPL Main Road, Whitefield', 'Construction started', 740, 520, 'Q4 2028', 'Illustrative family housing campus with shared work and recreation spaces.', 12.9698, 77.7500, true, 226, 'rera-verified', true),
  ('20000000-0000-4000-8000-000000000006', 'Sarjapur Exchange', '10000000-0000-4000-8000-000000000003', 'Sarjapur Road', 'Bengaluru', 'Outer Ring Road junction, Sarjapur', 'Approval stage', 630, 468, 'Q2 2030', 'Illustrative mixed-use community proposed around a new mobility corridor.', 12.8600, 77.7860, true, 74, 'rera-verified', true),
  ('20000000-0000-4000-8000-000000000007', 'Gachibowli Central', '10000000-0000-4000-8000-000000000004', 'Gachibowli', 'Hyderabad', 'Financial District Road, Gachibowli', 'New construction', 810, 390, 'Q1 2030', 'Illustrative high-density residential project near the financial district.', 17.4401, 78.3489, true, 119, 'pending', true),
  ('20000000-0000-4000-8000-000000000008', 'Kokapet Vista', '10000000-0000-4000-8000-000000000004', 'Kokapet', 'Hyderabad', 'Neopolis Road, Kokapet', 'Construction started', 950, 610, 'Q3 2029', 'Illustrative multi-tower development with active construction milestones.', 17.3948, 78.3375, true, 207, 'pending', true),
  ('20000000-0000-4000-8000-000000000009', 'Wakad Yards', '10000000-0000-4000-8000-000000000005', 'Wakad', 'Pune', 'Datta Mandir Road, Wakad', 'Redevelopment', 360, 180, 'Q4 2027', 'Illustrative neighbourhood renewal project with upgraded community facilities.', 18.5980, 73.7620, true, 138, 'pending', true),
  ('20000000-0000-4000-8000-000000000010', 'Thanisandra Park', '10000000-0000-4000-8000-000000000005', 'Thanisandra', 'Bengaluru', 'Thanisandra Main Road', 'New construction', 495, 330, 'Q2 2029', 'Illustrative mid-rise housing development connected to emerging social infrastructure.', 13.0550, 77.6330, true, 92, 'pending', true);

insert into public.area_signals (id, title, description, status_tag, locality, city, state, source_label, event_date, is_demo_record) values
  ('30000000-0000-4000-8000-000000000001', 'Construction activity expands near BKC', 'Two major phases in the demo workspace now show active construction milestones.', 'Construction started', 'Bandra East', 'Mumbai', 'Maharashtra', 'Illustrative demo activity feed', '2026-09-12', true),
  ('30000000-0000-4000-8000-000000000002', 'Redevelopment cluster forming in Kothrud', 'The demo dataset shows multiple renewal opportunities around established residential corridors.', 'Redevelopment', 'Kothrud', 'Pune', 'Maharashtra', 'Illustrative demo activity feed', '2026-09-08', true),
  ('30000000-0000-4000-8000-000000000003', 'Whitefield delivery pipeline advances', 'Recorded demo milestones indicate growing residential supply near employment hubs.', 'Construction started', 'Whitefield', 'Bengaluru', 'Karnataka', 'Illustrative demo activity feed', '2026-09-03', true),
  ('30000000-0000-4000-8000-000000000004', 'Kokapet pipeline gains momentum', 'The demo workspace highlights a growing mix of planned and active high-density projects.', 'New construction', 'Kokapet', 'Hyderabad', 'Telangana', 'Illustrative demo activity feed', '2026-08-29', true);
