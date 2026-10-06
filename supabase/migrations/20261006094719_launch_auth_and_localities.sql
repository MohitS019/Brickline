-- Explicit privileges are required on hosted projects with automatic exposure off.
grant usage on schema public to anon, authenticated, service_role;
grant all on public.profiles, public.builders, public.projects, public.introductions,
  public.area_signals, public.audit_events, public.panel_content, public.privacy_requests
  to service_role;

create table public.localities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  state text not null,
  latitude double precision not null,
  longitude double precision not null,
  is_demo_record boolean not null default false,
  unique (name, city)
);
alter table public.localities enable row level security;
revoke all on public.localities from anon, authenticated;
grant select on public.localities to anon, authenticated;
grant all on public.localities to service_role;
create policy localities_public_read on public.localities for select
  to anon, authenticated using (true);

-- Use reviewed panel flags, not user-editable metadata, for authorization.
create or replace function private.has_approved_role(required_role public.brickline_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.status = 'approved' and (
    p.is_admin or case required_role
      when 'Agent' then p.agent_access
      when 'Builder' then p.builder_access
      when 'Client' then p.client_access
    end
  ) from public.profiles p where p.id = (select auth.uid())), false)
$$;

create or replace function private.owns_builder(target_builder uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_admin() or (
    private.has_approved_role('Builder') and exists (
      select 1 from public.builders b
      where b.id = target_builder and b.profile_id = (select auth.uid())
    )
  )
$$;

-- Public discovery exposes published records only; owners can inspect drafts.
drop policy projects_public_read on public.projects;
create policy projects_public_read on public.projects for select to anon
  using (published);
create policy projects_member_read on public.projects for select to authenticated
  using (published or private.owns_builder(builder_id));

-- Expired/revoked grants cannot be read directly by their clients.
-- The server's participant-checked API returns history metadata for the list.
drop policy introductions_read_participant on public.introductions;
create policy introductions_read_participant on public.introductions for select to authenticated
  using ((select auth.uid()) = agent_id or private.is_admin() or (
    (select auth.uid()) = client_id and revoked_at is null and expires_at > now()
  ));

-- Capture consent only when the user explicitly checked the notice.
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare requested_role public.brickline_role;
begin
  requested_role := case new.raw_user_meta_data ->> 'role'
    when 'Builder' then 'Builder'::public.brickline_role
    when 'Client' then 'Client'::public.brickline_role
    else 'Agent'::public.brickline_role
  end;
  insert into public.profiles (
    id, email, full_name, role, company_name, city, rera_number, gst_number,
    consent_at, consent_version
  ) values (
    new.id, coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120), requested_role,
    left(coalesce(new.raw_user_meta_data ->> 'company_name', ''), 120),
    left(coalesce(new.raw_user_meta_data ->> 'city', ''), 120),
    nullif(left(coalesce(new.raw_user_meta_data ->> 'rera_number', ''), 80), ''),
    nullif(upper(left(coalesce(new.raw_user_meta_data ->> 'gst_number', ''), 15)), ''),
    case when new.raw_user_meta_data ->> 'privacy_consent' = 'true' then now() end,
    '2026-09-23'
  );
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
drop trigger on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure private.handle_new_user();
drop function public.handle_new_user();

-- Users created before installation also need a reviewable pending profile.
insert into public.profiles (id, email, full_name, role, company_name, city)
select id, email, left(coalesce(raw_user_meta_data ->> 'full_name', ''), 120),
  case raw_user_meta_data ->> 'role'
    when 'Builder' then 'Builder'::public.brickline_role
    when 'Client' then 'Client'::public.brickline_role
    else 'Agent'::public.brickline_role
  end,
  left(coalesce(raw_user_meta_data ->> 'company_name', ''), 120),
  left(coalesce(raw_user_meta_data ->> 'city', ''), 120)
from auth.users where email is not null
on conflict (id) do nothing;

update public.profiles p
set is_admin = true, status = 'approved', agent_access = true,
  builder_access = true, client_access = true, reviewed_at = coalesce(p.reviewed_at, now())
from auth.users u where u.id = p.id
  and lower(u.email) = 'mohitsonje4@gmail.com' and u.email_confirmed_at is not null;
