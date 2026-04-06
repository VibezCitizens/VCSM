-- Platform schema RLS — identity engine user-scoped hardening.
--
-- Scope: platform schema tables read and written by the identity engine
-- running in the browser (authenticated user JWT, NOT service_role).
--
-- Principle:
--   User-scoped tables  — authenticated users can read/write only their own rows.
--   Catalog tables      — authenticated users can read (app/role/capability config).
--   Admin-write tables  — INSERT/UPDATE/DELETE requires service_role only.
--   service_role        — bypasses RLS everywhere; used by edge functions only.
--
-- Identity engine write operations that run with the user JWT:
--   dalEnsureUserAppAccess    → platform.user_app_access     (INSERT ON CONFLICT DO NOTHING)
--   dalEnsureUserAppAccount   → platform.user_app_accounts   (INSERT ON CONFLICT DO NOTHING + SELECT)
--   dalUpsertActorLink        → platform.user_app_actor_links (INSERT ON CONFLICT DO UPDATE)
--   dalSetActiveActorLink     → platform.user_app_preferences (INSERT ON CONFLICT DO UPDATE)
--   dalEnsureAppPreferences   → platform.user_app_preferences (INSERT ON CONFLICT DO NOTHING)
--   dalEnsureAppState         → platform.user_app_state       (INSERT ON CONFLICT DO NOTHING)
--   dalRecordLogin            → platform.user_app_state       (INSERT ON CONFLICT DO UPDATE)
--   dalUpdateLastDestination  → platform.user_app_state       (UPDATE)
--
-- Identity engine read operations that run with the user JWT:
--   dalGetAppByKey                  → platform.apps
--   dalGetUserAppAccess             → platform.user_app_access
--   dalGetUserAppAccount            → platform.user_app_accounts
--   dalGetUserAppContextByKey       → platform.v_user_app_context (view)
--   dalGetActorLinksForAccount      → platform.user_app_actor_links
--   dalGetActorLinkById             → platform.user_app_actor_links
--   dalGetPreferencesForAccount     → platform.user_app_preferences
--   dalGetStateForAccount           → platform.user_app_state
--   dalGetRoleKeysForAccount        → platform.user_app_account_roles, platform.app_roles
--   dalGetCapabilityKeysByRoleIds   → platform.role_capabilities, platform.capabilities
--   dalGetDirectCapabilitiesForAccount → platform.user_capabilities

begin;

-- ============================================================
-- Helper: check whether a user_app_account_id belongs to the
-- current authenticated user. Used in RLS policies for tables
-- that do not carry user_id directly.
--
-- Security definer so it can read user_app_accounts without
-- recursing into its own RLS policy during evaluation.
-- ============================================================

create or replace function platform.is_account_owner(p_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = platform, auth
as $$
  select exists (
    select 1
    from platform.user_app_accounts
    where id = p_account_id
      and user_id = auth.uid()
  )
$$;

revoke all on function platform.is_account_owner(uuid) from public;
grant execute on function platform.is_account_owner(uuid) to authenticated, service_role;

-- ============================================================
-- platform.apps
-- Catalog — read by identity engine to look up app config.
-- Writes are backend-only (service_role).
-- ============================================================

alter table platform.apps enable row level security;

drop policy if exists apps_select_authenticated on platform.apps;
create policy apps_select_authenticated
on platform.apps
for select
to authenticated
using (is_active = true);

-- ============================================================
-- platform.app_roles
-- Catalog — read by role service to resolve role keys.
-- ============================================================

alter table platform.app_roles enable row level security;

drop policy if exists app_roles_select_authenticated on platform.app_roles;
create policy app_roles_select_authenticated
on platform.app_roles
for select
to authenticated
using (true);

-- ============================================================
-- platform.capabilities
-- Catalog — read by capability service to resolve capability keys.
-- ============================================================

alter table platform.capabilities enable row level security;

drop policy if exists capabilities_select_authenticated on platform.capabilities;
create policy capabilities_select_authenticated
on platform.capabilities
for select
to authenticated
using (true);

-- ============================================================
-- platform.role_capabilities
-- Catalog join table — read by capability service.
-- ============================================================

alter table platform.role_capabilities enable row level security;

drop policy if exists role_capabilities_select_authenticated on platform.role_capabilities;
create policy role_capabilities_select_authenticated
on platform.role_capabilities
for select
to authenticated
using (true);

-- ============================================================
-- platform.user_app_access
-- User-scoped — one row per (user_id, app_id).
-- Users can read and provisionally insert their own row.
-- Revocation (status change) is backend-only.
-- ============================================================

alter table platform.user_app_access enable row level security;

drop policy if exists user_app_access_select_own on platform.user_app_access;
create policy user_app_access_select_own
on platform.user_app_access
for select
to authenticated
using (user_id = auth.uid());

-- INSERT only — ON CONFLICT DO NOTHING prevents any change to existing rows.
-- This means a revoked row is never overwritten by the engine insert.
drop policy if exists user_app_access_insert_own on platform.user_app_access;
create policy user_app_access_insert_own
on platform.user_app_access
for insert
to authenticated
with check (user_id = auth.uid());

-- No UPDATE/DELETE for authenticated — status changes are service_role only.

-- ============================================================
-- platform.user_app_accounts
-- User-scoped — one row per (user_id, app_id).
-- Engine inserts on first login (ignoreDuplicates), then selects.
-- ============================================================

alter table platform.user_app_accounts enable row level security;

drop policy if exists user_app_accounts_select_own on platform.user_app_accounts;
create policy user_app_accounts_select_own
on platform.user_app_accounts
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists user_app_accounts_insert_own on platform.user_app_accounts;
create policy user_app_accounts_insert_own
on platform.user_app_accounts
for insert
to authenticated
with check (user_id = auth.uid());

-- No UPDATE/DELETE for authenticated — account status changes are service_role only.

-- ============================================================
-- platform.user_app_actor_links
-- Account-scoped — linked to user_app_accounts.
-- Engine upserts on every login (full DO UPDATE on conflict).
-- ============================================================

alter table platform.user_app_actor_links enable row level security;

drop policy if exists user_app_actor_links_select_own on platform.user_app_actor_links;
create policy user_app_actor_links_select_own
on platform.user_app_actor_links
for select
to authenticated
using (platform.is_account_owner(user_app_account_id));

-- INSERT needed: dalUpsertActorLink inserts on first provision.
drop policy if exists user_app_actor_links_insert_own on platform.user_app_actor_links;
create policy user_app_actor_links_insert_own
on platform.user_app_actor_links
for insert
to authenticated
with check (platform.is_account_owner(user_app_account_id));

-- UPDATE needed: dalUpsertActorLink does full DO UPDATE on conflict (status, meta).
drop policy if exists user_app_actor_links_update_own on platform.user_app_actor_links;
create policy user_app_actor_links_update_own
on platform.user_app_actor_links
for update
to authenticated
using (platform.is_account_owner(user_app_account_id))
with check (platform.is_account_owner(user_app_account_id));

-- ============================================================
-- platform.user_app_preferences
-- Account-scoped — active actor selection, theme, locale.
-- Engine upserts and updates (DO UPDATE for active_actor_link_id).
-- ============================================================

alter table platform.user_app_preferences enable row level security;

drop policy if exists user_app_preferences_select_own on platform.user_app_preferences;
create policy user_app_preferences_select_own
on platform.user_app_preferences
for select
to authenticated
using (platform.is_account_owner(user_app_account_id));

drop policy if exists user_app_preferences_insert_own on platform.user_app_preferences;
create policy user_app_preferences_insert_own
on platform.user_app_preferences
for insert
to authenticated
with check (platform.is_account_owner(user_app_account_id));

-- UPDATE needed: dalSetActiveActorLink does DO UPDATE on conflict.
drop policy if exists user_app_preferences_update_own on platform.user_app_preferences;
create policy user_app_preferences_update_own
on platform.user_app_preferences
for update
to authenticated
using (platform.is_account_owner(user_app_account_id))
with check (platform.is_account_owner(user_app_account_id));

-- ============================================================
-- platform.user_app_state
-- Account-scoped — onboarding, account status, login timestamps.
-- Engine inserts defaults (ignoreDuplicates) then updates login timestamps.
-- ============================================================

alter table platform.user_app_state enable row level security;

drop policy if exists user_app_state_select_own on platform.user_app_state;
create policy user_app_state_select_own
on platform.user_app_state
for select
to authenticated
using (platform.is_account_owner(user_app_account_id));

drop policy if exists user_app_state_insert_own on platform.user_app_state;
create policy user_app_state_insert_own
on platform.user_app_state
for insert
to authenticated
with check (platform.is_account_owner(user_app_account_id));

-- UPDATE needed:
--   dalRecordLogin       → upsert with DO UPDATE (last_login_at, first_login_at)
--   dalUpdateLastDestination → UPDATE (last_destination_key)
drop policy if exists user_app_state_update_own on platform.user_app_state;
create policy user_app_state_update_own
on platform.user_app_state
for update
to authenticated
using (platform.is_account_owner(user_app_account_id))
with check (platform.is_account_owner(user_app_account_id));

-- account_status and onboarding_status must remain immutable from the client.
-- The UPDATE policy is required for dalRecordLogin (last_login_at) and
-- dalUpdateLastDestination (last_destination_key), but must not allow a
-- user to change protected fields. A trigger enforces this at the row level.

create or replace function platform.guard_user_app_state_update()
returns trigger
language plpgsql
security definer
set search_path = platform, auth
as $$
begin
  -- service_role requests have no JWT user context (auth.uid() is null).
  -- Authenticated user requests always have auth.uid() set.
  -- Only allow protected field changes from service_role (backend operations).
  if auth.uid() is not null then
    if NEW.account_status is distinct from OLD.account_status then
      raise exception 'account_status can only be changed by service_role';
    end if;
    if NEW.onboarding_status is distinct from OLD.onboarding_status then
      raise exception 'onboarding_status can only be changed by service_role';
    end if;
    if NEW.requires_onboarding is distinct from OLD.requires_onboarding then
      raise exception 'requires_onboarding can only be changed by service_role';
    end if;
    if NEW.requires_actor_selection is distinct from OLD.requires_actor_selection then
      raise exception 'requires_actor_selection can only be changed by service_role';
    end if;
    if NEW.suspended_reason is distinct from OLD.suspended_reason then
      raise exception 'suspended_reason can only be changed by service_role';
    end if;
    if NEW.suspended_until is distinct from OLD.suspended_until then
      raise exception 'suspended_until can only be changed by service_role';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_user_app_state_update on platform.user_app_state;
create trigger trg_guard_user_app_state_update
  before update on platform.user_app_state
  for each row
  execute function platform.guard_user_app_state_update();

-- ============================================================
-- platform.user_app_account_roles
-- Account-scoped — role assignments.
-- Engine reads only; writes are backend-only.
-- ============================================================

alter table platform.user_app_account_roles enable row level security;

drop policy if exists user_app_account_roles_select_own on platform.user_app_account_roles;
create policy user_app_account_roles_select_own
on platform.user_app_account_roles
for select
to authenticated
using (platform.is_account_owner(user_app_account_id));

-- No INSERT/UPDATE/DELETE for authenticated — role assignments are service_role only.

-- ============================================================
-- platform.user_capabilities
-- Account-scoped — per-user capability grants and revocations.
-- Engine reads only; writes are backend-only.
-- ============================================================

alter table platform.user_capabilities enable row level security;

drop policy if exists user_capabilities_select_own on platform.user_capabilities;
create policy user_capabilities_select_own
on platform.user_capabilities
for select
to authenticated
using (platform.is_account_owner(user_app_account_id));

-- No INSERT/UPDATE/DELETE for authenticated — capability overrides are service_role only.

commit;
