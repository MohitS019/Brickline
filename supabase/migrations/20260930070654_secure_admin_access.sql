-- Keep the administrator identity in the database, not in client-side state.
-- The trigger runs when the allowlisted email becomes verified and also covers
-- accounts that were already confirmed before this migration was applied.
create or replace function private.promote_brickline_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(coalesce(new.email, '')) = 'mohitsonje4@gmail.com'
     and new.email_confirmed_at is not null then
    update public.profiles
    set is_admin = true,
        status = 'approved',
        agent_access = true,
        builder_access = true,
        client_access = true,
        reviewed_at = coalesce(reviewed_at, now()),
        updated_at = now()
    where id = new.id;
  elsif tg_op = 'UPDATE'
        and lower(coalesce(old.email, '')) = 'mohitsonje4@gmail.com' then
    update public.profiles
    set is_admin = false,
        updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function private.promote_brickline_admin() from public, anon, authenticated;

drop trigger if exists zz_promote_brickline_admin on auth.users;
create trigger zz_promote_brickline_admin
  after insert or update of email, email_confirmed_at on auth.users
  for each row execute procedure private.promote_brickline_admin();

update public.profiles p
set is_admin = true,
    status = 'approved',
    agent_access = true,
    builder_access = true,
    client_access = true,
    reviewed_at = coalesce(p.reviewed_at, now()),
    updated_at = now()
from auth.users u
where u.id = p.id
  and lower(coalesce(u.email, '')) = 'mohitsonje4@gmail.com'
  and u.email_confirmed_at is not null;
