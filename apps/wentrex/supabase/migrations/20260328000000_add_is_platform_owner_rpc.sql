-- Helper RPC callable from edge functions via the learning schema (which IS exposed).
-- Queries core.platform_owners internally without requiring core to be a PostgREST-exposed schema.
create or replace function learning.is_platform_owner(p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from core.platform_owners
    where user_id = p_user_id
  );
$$;

grant execute on function learning.is_platform_owner(uuid) to service_role;
grant execute on function learning.is_platform_owner(uuid) to authenticated;
