-- Security definer RPC for super admin realm listing.
-- Bypasses RLS entirely — authorization is enforced by checking core.platform_owners
-- and learning.platform_admins before returning data.
create or replace function learning.list_all_realms_admin(p_caller_user_id uuid)
returns table (
  id uuid,
  slug text,
  name text,
  vc_realm_id uuid,
  owner_actor_id uuid,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, core, learning
as $$
begin
  -- Only platform owners may list all realms
  if not exists (
    select 1 from core.platform_owners where user_id = p_caller_user_id
  ) then
    raise exception 'Only platform owners can list all realms';
  end if;

  return query
  select
    r.id,
    r.slug,
    r.name,
    r.vc_realm_id,
    r.owner_actor_id,
    r.is_active,
    r.created_at,
    r.updated_at
  from learning.realms r
  order by r.created_at asc;
end;
$$;

grant execute on function learning.list_all_realms_admin(uuid) to authenticated;
grant execute on function learning.list_all_realms_admin(uuid) to service_role;
