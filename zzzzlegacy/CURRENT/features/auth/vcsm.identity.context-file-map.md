VCSM Identity Context — Complete File Map & Call Graph
=======================================================


1. Identity Context Core Files
-------------------------------

  apps/VCSM/src/state/identity/identityContext.jsx        — IdentityProvider, useIdentity, switchActor, resolve effect, commit guards
  apps/VCSM/src/state/identity/identity.controller.js     — loadDefaultIdentityForUser, hydrateIdentityActor, loadIdentityForActorId
  apps/VCSM/src/state/identity/identity.read.dal.js       — readIdentityActorByIdDAL, readProfileIdentityDAL, readVportIdentityDAL, realm DALs
  apps/VCSM/src/state/identity/identityStorage.js         — saveIdentity, loadIdentity, clearIdentity, clearAllIdentityStorage (userId-scoped)
  apps/VCSM/src/state/identity/identitySwitcher.jsx       — floating actor switch widget
  apps/VCSM/src/state/identity/useIdentitySync.js         — dead code, not imported
  apps/VCSM/src/state/identity/IdentityDebugger.jsx       — legacy debug panel, not primary


2. Auth → Identity Bridge Files
---------------------------------

  apps/VCSM/src/app/providers/AuthProvider.jsx             — session hydration, onAuthStateChange, logout, setUser/setSession
  apps/VCSM/src/features/auth/hooks/useLogin.js            — handleLogin, signInWithPassword, navigate to /feed
  apps/VCSM/src/features/auth/controllers/login.controller.js — dalSignInWithPassword wrapper
  apps/VCSM/src/features/auth/controllers/authSession.controller.js — hydrateAuthSession
  apps/VCSM/src/features/auth/dal/login.dal.js             — supabase.auth.signInWithPassword
  apps/VCSM/src/features/auth/dal/authSession.read.dal.js  — supabase.auth.getSession
  apps/VCSM/src/features/auth/controllers/onboarding.controller.js — completeOnboarding, calls ensureVcsmPlatformBootstrap

  Bridge point: AuthProvider sets user → IdentityProvider effect fires on [user?.id]


3. Identity Engine Files
--------------------------

  Controllers:
    engines/identity/src/controller/resolveAuthenticatedContext.controller.js — main orchestrator
    engines/identity/src/controller/switchActiveActor.controller.js          — preference write
    engines/identity/src/controller/logoutCleanup.controller.js              — logout

  Services:
    engines/identity/src/services/sessionService.js     — resolveSessionUser (getUser, network-verified)
    engines/identity/src/services/accessService.js      — resolveUserAppAccess
    engines/identity/src/services/accountService.js     — resolveUserAppAccount
    engines/identity/src/services/actorService.js       — resolveAvailableActors, resolveActiveActor
    engines/identity/src/services/roleService.js        — resolveRoleKeys
    engines/identity/src/services/capabilityService.js  — resolveCapabilityKeys
    engines/identity/src/services/destinationService.js — resolveDefaultDestination

  DAL:
    engines/identity/src/dal/session.read.dal.js        — dalGetCurrentUser, dalGetSession
    engines/identity/src/dal/app.read.dal.js            — dalGetAppByKey (platform.apps)
    engines/identity/src/dal/access.read.dal.js         — dalGetUserAppAccess (platform.user_app_access)
    engines/identity/src/dal/account.read.dal.js        — dalGetUserAppContextByKey (platform.v_user_app_context)
    engines/identity/src/dal/preferences.read.dal.js    — dalGetPreferencesForAccount (platform.user_app_preferences)
    engines/identity/src/dal/state.read.dal.js          — dalGetStateForAccount (platform.user_app_state)
    engines/identity/src/dal/state.write.dal.js         — dalRecordLogin, dalFinalizeAccountState
    engines/identity/src/dal/actorLinks.read.dal.js     — dalGetActorLinksForAccount, dalGetActorLinkById
    engines/identity/src/dal/actorLinks.write.dal.js    — dalSetActiveActorLink (platform.user_app_preferences UPSERT)
    engines/identity/src/dal/roles.read.dal.js          — role/capability reads
    engines/identity/src/dal/capabilities.read.dal.js   — capability reads

  Models:
    engines/identity/src/model/App.model.js
    engines/identity/src/model/Access.model.js
    engines/identity/src/model/Account.model.js
    engines/identity/src/model/Preferences.model.js
    engines/identity/src/model/State.model.js
    engines/identity/src/model/ActorLink.model.js

  Config/Events/Types:
    engines/identity/src/config.js
    engines/identity/src/events.js
    engines/identity/src/types/index.js
    engines/identity/src/adapters/index.js


4. Hydration Files
--------------------

  engines/hydration/src/config.js                                — hydration engine config
  engines/hydration/src/controller/hydrateActor.controller.js    — hydrateActor dispatcher
  engines/hydration/src/adapters/index.js                        — public API
  apps/VCSM/src/features/hydration/vcsmActorHydrator.js          — VCSM-specific hydrator (citizen + vport)
  apps/VCSM/src/features/hydration/setup.js                      — setupVcsmHydration, registers hydrator


5. Database DAL Files (Tables Touched)
----------------------------------------

  platform.apps                    → engines/identity/src/dal/app.read.dal.js
  platform.user_app_access         → engines/identity/src/dal/access.read.dal.js
  platform.user_app_accounts       → engines/identity/src/dal/account.read.dal.js
  platform.v_user_app_context      → engines/identity/src/dal/account.read.dal.js
  platform.user_app_preferences    → engines/identity/src/dal/preferences.read.dal.js + actorLinks.write.dal.js
  platform.user_app_state          → engines/identity/src/dal/state.read.dal.js + state.write.dal.js
  platform.user_app_actor_links    → engines/identity/src/dal/actorLinks.read.dal.js
  vc.actors                        → apps/VCSM/src/state/identity/identity.read.dal.js
  vc.actor_owners                  → apps/VCSM/src/state/identity/identity.read.dal.js
  vc.vports                        → apps/VCSM/src/state/identity/identity.read.dal.js
  vc.actor_privacy_settings        → apps/VCSM/src/state/identity/identity.read.dal.js
  vc.realms                        → apps/VCSM/src/state/identity/identity.read.dal.js
  public.profiles                  → apps/VCSM/src/state/identity/identity.read.dal.js
  platform.provision_vcsm_identity → apps/VCSM/src/features/identity/dal/provision.rpc.dal.js


6. Identity Commit Location
------------------------------

  SINGLE LOCATION: apps/VCSM/src/state/identity/identityContext.jsx

  setIdentity(nextIdentity) — line ~437

  Guards before commit:
    1. Version guard: myVersion !== _resolveVersion → rejected
    2. Ownership guard: _engineMeta.userId !== user.id → rejected
    3. Null identity → committed as null (no actor found)


7. Feed Viewer Dependency Files
---------------------------------

  apps/VCSM/src/features/feed/screens/CentralFeedScreen.jsx    — reads useIdentity() → actorId, realmId
  apps/VCSM/src/features/feed/hooks/useFeed.js                 — receives viewerActorId, realmId as params
  apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js   — uses actorId for moderation/report
  apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js — passes viewerActorId to all DALs
  apps/VCSM/src/features/feed/controllers/getFeedViewerContext.controller.js — reads viewer adult flag
  apps/VCSM/src/features/feed/dal/feed.read.viewerContext.dal.js — queries vc.actors + public.profiles for viewer

  Identity → Feed bridge:
    CentralFeedScreen: const actorId = identity?.actorId ?? null
    Then: useFeed(actorId, realmId)


8. Full Runtime Call Graph
----------------------------

  USER CLICKS LOGIN
    |
    +-- useLogin.handleLogin()
    |     +-- supabase.auth.signInWithPassword()
    |     +-- hydrateAuthSession() → supabase.auth.getSession()
    |     +-- navigate('/feed')                                    ← REDIRECT
    |
    +-- supabase.auth.onAuthStateChange(SIGNED_IN)
    |     +-- AuthProvider: setUser(newUser)
    |
    +-- IdentityProvider useEffect([user?.id])
    |     +-- setIdentity(null), setLoading(true)                 ← CLEAR
    |
    +-- IdentityProvider resolve effect
          +-- _resolveVersion++
          +-- loadDefaultIdentityForUser({ userId, savedActorId })
          |     +-- resolveAuthenticatedContext({ appKey: 'vcsm' })
          |     |     +-- resolveSessionUser()                      [supabase.auth.getUser]
          |     |     +-- dalGetAppByKey({ appKey })                [platform.apps]
          |     |     +-- resolveUserAppAccess({ userId, appId })   [platform.user_app_access]
          |     |     +-- resolveUserAppAccount({ userId, appKey }) [platform.v_user_app_context]
          |     |     +-- dalGetStateForAccount({ uaaId })          [platform.user_app_state]
          |     |     +-- dalGetPreferencesForAccount({ uaaId })    [platform.user_app_preferences]
          |     |     +-- resolveAvailableActors({ uaaId })         [platform.user_app_actor_links]
          |     |     +-- resolveActiveActor({ actors, prefs })     [pure logic]
          |     |
          |     +-- readIdentityActorByIdDAL(actorId)               [vc.actors — RLS!]
          |     +-- hydrateIdentityActor(actorRow)
          |           +-- hydrateActor({ appKey:'vcsm', actorId })
          |                 +-- vcsmActorHydrator
          |                       +-- readProfileIdentityDAL        [public.profiles]
          |                       +-- OR readVportIdentityDAL       [vc.vports]
          |                       +-- resolveRealmId                [vc.realms]
          |
          +-- (If null: SELF-HEAL)
          |     +-- query vc.actors for citizen actor
          |     +-- ensureVcsmPlatformBootstrap → provision_vcsm_identity RPC
          |     +-- retry loadDefaultIdentityForUser
          |     +-- engineSwitchActiveActor → write preferences
          |     +-- finalizeAccountState → write state
          |
          +-- VERSION GUARD: myVersion === _resolveVersion?
          +-- OWNERSHIP GUARD: _engineMeta.userId === user.id?
          +-- setIdentity(hydratedIdentity)                         ← COMMIT
          +-- setLoading(false)


9. All Null-Identity Paths
----------------------------

  FILE: identity.controller.js
    Line 123: if (!ctx?.activeActor?.actorId) return null    — engine found no active actor
    Line 158: } catch (actorReadErr) { return null }         — vc.actors read failed (RLS/PGRST116)
    Line 167: if (!actorRow) return null                     — vc.actors returned empty
    Line 186: catch (error) { return null }                  — any engine/hydration error

  FILE: identityContext.jsx
    Line 239: setIdentity(null) [!user?.id]                  — no auth user
    Line 397: setIdentity(null) [ownership mismatch]         — wrong user's identity
    Line 437: setIdentity(nextIdentity) where nextIdentity=null — null from controller

  FILE: engines/identity/src/services/actorService.js
    Line 44: if (!availableActors.length) return null        — no actor links


10. Self-Heal / Bootstrap Files
---------------------------------

  apps/VCSM/src/state/identity/identityContext.jsx                    — self-heal trigger + finalization
  apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js — orchestrator
  apps/VCSM/src/features/identity/dal/provision.rpc.dal.js            — platform.provision_vcsm_identity RPC
  apps/VCSM/src/features/identity/dal/actorLink.dal.js                — legacy repair utilities
  apps/VCSM/src/features/auth/controllers/onboarding.controller.js    — calls bootstrap during onboarding
  engines/identity/src/dal/actorLinks.write.dal.js                    — dalSetActiveActorLink (prefs write)
  engines/identity/src/dal/state.write.dal.js                         — dalFinalizeAccountState


11. Potential Identity Breakpoints — STATUS AS OF 2026-04-05
---------------------------------------------------------------

  A. vc.actors RLS via can_view_actor() — returns NULL when actor_privacy_settings row is missing
     SEVERITY: HIGH — CONFIRMED ROOT CAUSE (database fix needed)
     STATUS: IDENTIFIED, NOT YET FIXED (requires ALTER FUNCTION on can_view_actor)

  B. resolveSessionUser — FIXED (uses getUser, network-verified)
     SEVERITY: LOW — transient network failures only

  C. provision_vcsm_identity does not create actor links
     STATUS: KNOWN GAP — self-heal creates account but not links
     MITIGATED BY: vc.create_vport now creates links; self-heal finalization persists prefs

  D. Version guard — IMPLEMENTED, working
  E. Profiles .single() — LATENT, profiles always exist for auth users

  RESOLVED THIS SESSION:
  - VCSM resolver .maybeSingle() → array query (multi-actor support)
  - Preferences .upsert() → .update() (no more 403)
  - switchActor fail-open → fail-closed
  - Identity ownership + version guards added
  - Logout clears all identity storage
  - Debug stores scoped by user/cycle


Debugger Files
----------------

  debuggers/identity/store.js              — login/resolve event store
  debuggers/identity/helpers.js            — debugLoginEvent, debugLoginError
  debuggers/identity/IdentityDebugPanel.jsx — floating timeline panel
  debuggers/actor-switch/store.js          — switch attempt store
  debuggers/actor-switch/helpers.js        — createSwitchDebugSession
  debuggers/actor-switch/ActorSwitchDebugPanel.jsx — switch pipeline panel
  debuggers/feed/store.js                  — feed query/visibility store
  debuggers/feed/helpers.js                — debugFeedEvent, debugFeedViewer
  debuggers/feed/FeedDebugPanel.jsx        — feed visibility panel
  debuggers/global/store.js                — unified snapshot store
  debuggers/global/fetchDbTruth.js         — live DB truth fetcher
  debuggers/global/GlobalDebugPanel.jsx    — global auth+identity+DB panel
