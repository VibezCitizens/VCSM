-- Add SELECT policy for learning.realms
-- Currently RLS is enabled but no SELECT policy exists,
-- so all authenticated users get zero rows back.
-- Realms are not sensitive data — any authenticated user
-- needs to resolve their realm slug to navigate the app.

begin;

-- Ensure RLS is enabled (idempotent)
alter table learning.realms enable row level security;

-- Allow any authenticated user to read active realms
drop policy if exists realms_select_authenticated on learning.realms;
create policy realms_select_authenticated
on learning.realms
for select
to authenticated
using (is_active = true);

-- Service role always has full access (bypasses RLS by default,
-- but explicit grant for clarity)
drop policy if exists realms_select_service_role on learning.realms;
create policy realms_select_service_role
on learning.realms
for select
to service_role
using (true);

-- Write operations remain restricted to platform admins
drop policy if exists realms_insert_platform_admin on learning.realms;
create policy realms_insert_platform_admin
on learning.realms
for insert
to authenticated
with check (learning.is_current_user_platform_admin());

drop policy if exists realms_update_platform_admin on learning.realms;
create policy realms_update_platform_admin
on learning.realms
for update
to authenticated
using (learning.is_current_user_platform_admin())
with check (learning.is_current_user_platform_admin());

drop policy if exists realms_delete_platform_admin on learning.realms;
create policy realms_delete_platform_admin
on learning.realms
for delete
to authenticated
using (learning.is_current_user_platform_admin());

commit;
