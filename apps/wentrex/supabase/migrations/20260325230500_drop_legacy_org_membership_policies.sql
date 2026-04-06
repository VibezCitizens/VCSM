-- Drop legacy organization_memberships policies that were left behind in the
-- database outside the tracked migrations.
--
-- Why:
-- - RLS SELECT policies are combined during evaluation.
-- - The legacy org_memberships_* policies are still active alongside the newer
--   organization_memberships_* policies.
-- - The recursive legacy select policy is what is triggering:
--     42P17: infinite recursion detected in policy for relation
--     "organization_memberships"
--
-- Scope:
-- - Only remove the legacy short-named policy set shown in Supabase UI.
-- - Keep the tracked organization_memberships_* policies in place.

begin;

drop policy if exists org_memberships_select
  on learning.organization_memberships;

drop policy if exists org_memberships_insert
  on learning.organization_memberships;

drop policy if exists org_memberships_update
  on learning.organization_memberships;

drop policy if exists org_memberships_delete
  on learning.organization_memberships;

commit;
