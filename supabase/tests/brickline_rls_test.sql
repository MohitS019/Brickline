begin;
select plan(32);

select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.builders'::regclass), 'builders RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.projects'::regclass), 'projects RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.introductions'::regclass), 'introductions RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.area_signals'::regclass), 'area_signals RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.audit_events'::regclass), 'audit_events RLS enabled');

select ok(has_table_privilege('anon', 'public.projects', 'select'), 'anon can select projects');
select ok(not has_table_privilege('anon', 'public.projects', 'insert'), 'anon cannot insert projects');
select ok(not has_table_privilege('anon', 'public.projects', 'update'), 'anon cannot update projects');
select ok(not has_table_privilege('anon', 'public.projects', 'delete'), 'anon cannot delete projects');

select ok(has_table_privilege('anon', 'public.builders', 'select'), 'anon can select builders');
select ok(not has_table_privilege('anon', 'public.builders', 'insert'), 'anon cannot insert builders');
select ok(has_table_privilege('anon', 'public.area_signals', 'select'), 'anon can select area signals');
select ok(not has_table_privilege('anon', 'public.area_signals', 'insert'), 'anon cannot insert area signals');

select ok(not has_table_privilege('anon', 'public.profiles', 'select'), 'anon cannot select profiles');
select ok(has_table_privilege('authenticated', 'public.profiles', 'select'), 'authenticated role can reach profile select policies');
select ok(not has_table_privilege('authenticated', 'public.profiles', 'delete'), 'authenticated users cannot delete profiles');
select ok(not has_table_privilege('anon', 'public.introductions', 'select'), 'anon cannot select introductions');
select ok(has_table_privilege('authenticated', 'public.introductions', 'select'), 'authenticated role can reach introduction select policies');
select ok(has_table_privilege('authenticated', 'public.introductions', 'insert'), 'authenticated role can reach introduction insert policies');
select ok(not has_table_privilege('authenticated', 'public.introductions', 'delete'), 'authenticated users cannot delete introductions');
select ok(not has_table_privilege('anon', 'public.audit_events', 'select'), 'anon cannot read audit events');
select ok(has_table_privilege('authenticated', 'public.audit_events', 'select'), 'authenticated role can reach admin audit policy');
select ok(not has_table_privilege('authenticated', 'public.audit_events', 'insert'), 'authenticated users cannot forge audit events');

select ok(not has_function_privilege('anon', 'private.promote_brickline_admin()', 'execute'), 'anon cannot execute admin promotion');
select ok(not has_function_privilege('authenticated', 'private.promote_brickline_admin()', 'execute'), 'authenticated users cannot execute admin promotion');
select ok(exists(select 1 from pg_trigger where tgname = 'zz_promote_brickline_admin' and not tgisinternal), 'verified-owner promotion trigger exists');

select ok((select relrowsecurity from pg_class where oid = 'public.localities'::regclass), 'localities RLS enabled');
select ok(has_table_privilege('anon', 'public.localities', 'select'), 'anon can discover localities');
select ok(not has_table_privilege('authenticated', 'public.localities', 'insert'), 'members cannot forge locality data');
select ok(not has_function_privilege('authenticated', 'private.handle_new_user()', 'execute'), 'members cannot invoke signup trigger');
select ok(has_table_privilege('service_role', 'public.profiles', 'update'), 'server admin can review pending profiles');

select * from finish();
rollback;
