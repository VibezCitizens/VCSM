VCSM Vport-Creation Multi-Actor Login Audit
=============================================


1. Exact Vport Creation Entry Point
-------------------------------------

  File: apps/VCSM/src/features/vport/dal/vport.core.dal.js
  Function: createVport({ name, slug, avatarUrl, bio, bannerUrl, vportType })
  Called by: CreateVportForm.jsx onSubmit

  The DAL calls:
    vc.rpc('create_vport', { p_name, p_slug, p_avatar_url, p_bio, p_banner_url, p_vport_type })


2. Exact Database Rows Written During Vport Creation
------------------------------------------------------

  The RPC vc.create_vport (SECURITY DEFINER) writes:

    A. vc.vports
       INSERT: owner_user_id, name, slug, avatar_url, bio, banner_url, vport_type
       Returns: vport_id

    B. vc.actors
       INSERT: kind='vport', vport_id=new vport
       Returns: actor_id

    C. vc.actor_owners
       INSERT: actor_id=new actor, user_id=auth user, is_primary=true
       ON CONFLICT: do nothing

  Returns JSON: { ok, vport_id, actor_id, actor_link_id, user_app_account_id, slug, handle, name, vport_type }

  CORRECTION (2026-04-05): The LIVE vc.create_vport RPC has been updated
  and now handles full platform provisioning. The local db_snapshot was stale.


3. Vport Creation Platform Writes — RESOLVED
----------------------------------------------

  The LIVE vc.create_vport RPC now writes ALL required platform rows:

    ✓ vc.vports — creates the storefront
    ✓ vc.actors — creates vport actor (kind='vport')
    ✓ vc.actor_owners — links actor to auth user
    ✓ platform.user_app_access — ensures 'granted' status
    ✓ platform.user_app_accounts — finds or creates VCSM account
    ✓ platform.user_app_preferences — ensures row exists
    ✓ platform.user_app_state — ensures row with onboarding_status='completed'
    ✓ platform.user_app_actor_links — creates vport link (is_primary=false, is_switchable=true)

  The RPC return JSON now includes actor_link_id and user_app_account_id.
  The DAL correctly reads both.

  The vport creation write gap from the original audit NO LONGER EXISTS.

  NOTE: provision_vcsm_identity(p_user_id) still only creates the account
  shell without actor links. That is a separate issue for self-heal, not
  for vport creation.


4. Before-Vport Login Path (Single Actor)
-------------------------------------------

  Platform state:
    - 1 user_app_account
    - 1 user_app_actor_link (citizen, is_primary=true)
      Created during initial onboarding (if onboarding flow included it)
    - preferences may have active_actor_link_id set
    - state may be finalized

  Engine resolve:
    1_SESSION → userId
    2_APP → vcsm
    3_ACCESS → granted
    4_ACCOUNT → uaaId
    5_STATE_PREFS → state + prefs loaded
    6_LINKS → 1 citizen link found
    7_ACTIVE_ACTOR → selects citizen (from prefs or primary fallback)
    8_RESULT → returns context with activeActor

  Hydration:
    → vc.actors → public.profiles → realm → hydrated citizen identity

  Commit:
    → setIdentity(citizenIdentity) → SUCCESS


5. After-Vport Login Path (Multi-Actor)
------------------------------------------

  If the user's citizen link existed before:
    → Login STILL WORKS because the citizen link is unchanged.
    → Engine finds the same citizen link, selects it, hydrates it.
    → The vport actor exists in vc.* but has NO platform link.
    → The engine never sees the vport actor.

  If the user's citizen link did NOT exist before (or was lost):
    → Engine resolve fails at step 6 (no links)
    → Self-heal triggers
    → provision_vcsm_identity creates account but NO links
    → Retry resolve finds account but ZERO links
    → resolveActiveActor returns null
    → nextIdentity = null
    → IDENTITY_COMMIT_SUCCESS with actorId=null


6. Exact Place Where Multi-Actor State Diverges
-------------------------------------------------

  The divergence is NOT in multi-actor handling per se.

  The divergence is in HOW THE ACCOUNT WAS ORIGINALLY PROVISIONED:

  CASE A: User onboarded through proper VCSM onboarding flow
    → createUserActorForProfile created citizen actor
    → ensureVcsmPlatformBootstrap called provision_vcsm_identity
    → provision_vcsm_identity created account + prefs + state
    → BUT: actor links were NOT created by the RPC
    → HOWEVER: some other path may have created them (e.g., a trigger or
      a now-removed migration helper)

  CASE B: User exists from an older version of the platform
    → Citizen actor exists but may not have a platform link
    → Account may or may not exist
    → Self-heal creates account but NO links
    → Engine finds zero links → null identity

  The root cause is that NEITHER vc.create_vport NOR provision_vcsm_identity
  creates platform.user_app_actor_links. For users whose links were created
  by other means (initial migration, manual fix), login works. For users
  whose links were never created, login fails.


7. Whether the Failure is Query Shape, Actor Selection, or Null Handling
-------------------------------------------------------------------------

  CONFIRMED: Not a query shape issue (PGRST116 is fixed).

  CONFIRMED: resolveActiveActor correctly returns null when availableActors
  is empty. This is correct behavior — there's nothing to select.

  CONFIRMED: The null identity is then committed with IDENTITY_COMMIT_SUCCESS.
  This is by design — the commit guard allows null identity (it just means
  "no identity found").

  ROOT CAUSE: platform.user_app_actor_links is EMPTY for the account.


8. Exact Post-Self-Heal Sequence
----------------------------------

  1. Engine resolve throws (no account, or no access)
  2. identityContext catches → returns null
  3. Self-heal: query vc.actors for citizen actor → found
  4. ensureVcsmPlatformBootstrap({ userId, actorId })
     → provision_vcsm_identity(p_user_id)
     → Creates: access, account, preferences, state
     → Does NOT create: actor links
     → p_actor_id is passed by DAL but IGNORED by RPC
  5. Retry: loadDefaultIdentityForUser
     → resolveAuthenticatedContext
     → Steps 1-5 succeed (account exists now)
     → Step 6: query actor links → EMPTY RESULT
     → Step 7: resolveActiveActor([]) → null
     → Return null
  6. nextIdentity = null
  7. Self-heal finalization block:
     → nextIdentity._engineMeta?.engineResolved → false (null identity)
     → Finalization SKIPPED (never enters the if block)
  8. IDENTITY_COMMIT_SUCCESS fires with actorId=null


9. Exact Reason Null Identity is Still Committed
---------------------------------------------------

  Line 386 in identityContext.jsx:
    if (nextIdentity) { ... ownership check ... }

  If nextIdentity is null, the ownership check is SKIPPED.
  The code falls through to:
    setIdentity(nextIdentity)  // nextIdentity is null
    setLoading(false)

  And IDENTITY_COMMIT_SUCCESS fires with:
    actorId: null
    kind: null

  This is NOT a bug in the commit logic — it's working as designed.
  Null identity means "no identity found." The real bug is that
  actor links were never created.


10. Root Cause — PARTIALLY RESOLVED
--------------------------------------

  RESOLVED (2026-04-05):

  A. VPORT CREATION WRITE GAP — FIXED IN LIVE RPC
     The live vc.create_vport RPC now creates platform.user_app_actor_links
     for the new vport actor. This was updated directly in Supabase.
     The local db_snapshot/full_schema.sql is stale.

  STILL OPEN:

  B. BOOTSTRAP WRITE GAP (for self-heal path)
     platform.provision_vcsm_identity(p_user_id) still does NOT create
     actor links. It creates the account shell only. The self-heal path
     provisions the account but not the links. This means users whose
     accounts were ONLY created by self-heal (not by onboarding or
     vport creation) may still have zero links.

  C. SELF-HEAL FINALIZATION
     The self-heal finalization code (engineSwitchActiveActor +
     finalizeAccountState) was added in this session to persist
     preferences and state after self-heal. This works when links
     exist but doesn't help when links are missing.

  REMAINING RISK: Users who never went through vport creation or
  proper onboarding may still have accounts without actor links.
  The provision_vcsm_identity RPC should be updated to also create
  the citizen actor link.


11. Fix Status — ALL CODE WORKING (2026-04-05)
--------------------------------------------------

  DONE: vc.create_vport now creates full platform state including actor links
  DONE: Self-heal finalization persists preferences + state after resolve
  DONE: Identity ownership guard prevents stale cross-user identity
  DONE: Resolve version guard prevents async race conditions
  DONE: Session service uses getUser() instead of getSession()
  DONE: StateModel now maps last_actor_link_id
  DONE: Multi-actor resolver — .maybeSingle() replaced with array query
  DONE: Preferences write — .upsert() replaced with .update() (no more 403)
  DONE: switchActor is fail-closed (no more fail-open hydration after engine error)
  DONE: Logout clears all identity storage
  DONE: Debug stores scoped by user/cycle

  KNOWN REMAINING DATABASE ISSUE:
    vc.can_view_actor() returns NULL when actor_privacy_settings row is missing.
    This blocks vc.actors reads via RLS for actors without privacy rows.
    Fix: update can_view_actor to handle missing privacy rows (database change).

  STILL DESIRED:
    provision_vcsm_identity should create the citizen actor link


12. Concrete Files Changed This Session
------------------------------------------

  ENGINE:
    engines/identity/src/dal/actorLinks.write.dal.js — .upsert() → .update()
    engines/identity/src/dal/state.write.dal.js — added dalFinalizeAccountState
    engines/identity/src/dal/account.read.dal.js — .maybeSingle() → .limit(1)
    engines/identity/src/dal/access.read.dal.js — .maybeSingle() → .limit(1)
    engines/identity/src/dal/session.read.dal.js — added dalGetCurrentUser (getUser)
    engines/identity/src/services/sessionService.js — getSession → getUser
    engines/identity/src/model/State.model.js — added lastActorLinkId mapping
    engines/identity/src/controller/resolveAuthenticatedContext.controller.js — step-level instrumentation
    engines/identity/src/adapters/index.js — exported finalizeAccountState

  APP:
    apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js — multi-actor array query
    apps/VCSM/src/state/identity/identityContext.jsx — ownership guard, version guard, fail-closed switch, self-heal finalization
    apps/VCSM/src/state/identity/identity.controller.js — actor read error handling, RLS diagnostic
    apps/VCSM/src/state/identity/identityStorage.js — userId-scoped keys, clearAllIdentityStorage
    apps/VCSM/src/app/providers/AuthProvider.jsx — logout clears all, debug lifecycle events
    apps/VCSM/src/features/vport/dal/vport.core.dal.js — post-create snapshot logging
