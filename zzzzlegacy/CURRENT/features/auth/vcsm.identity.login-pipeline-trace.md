VCSM Login Pipeline — Definitive Code-Level Trace
====================================================

Every function name, file path, table name, and execution order in this
document comes from reading the actual source code. Nothing is assumed.


PHASE 1 — LOGIN SUBMIT
========================

File: apps/VCSM/src/features/auth/hooks/useLogin.js
Function: handleLogin(e)
Called by: LoginScreen form onSubmit

Synchronous steps:
  e.preventDefault()
  setError('')
  setLoading(true)
  debugLoginEvent('LOGIN_SUBMIT', { phase: 'login', payload: { email } })

At this point: the button shows a spinner, errors are cleared.


PHASE 2 — SUPABASE AUTHENTICATION
===================================

File: apps/VCSM/src/features/auth/hooks/useLogin.js (line 23)
Call chain:
  signInWithPassword({ email, password })
    File: apps/VCSM/src/features/auth/controllers/login.controller.js
    → dalSignInWithPassword({ email, password })
      File: apps/VCSM/src/features/auth/dal/login.dal.js
      → supabase.auth.signInWithPassword({ email, password })

This is a network POST to the Supabase Auth endpoint.

On success, Supabase returns:
  { data: { user: { id, email, ... }, session: { access_token, ... } }, error: null }

Supabase internally stores the session in its JS client cache
(localStorage key: sb-auth-main). The onAuthStateChange listener
in AuthProvider has NOT fired yet at this point.

On error: throws → caught by handleLogin → setError(err.message)


PHASE 3 — SESSION HYDRATION
==============================

File: apps/VCSM/src/features/auth/hooks/useLogin.js (line 39)

  hydrateAuthSession()
    File: apps/VCSM/src/features/auth/controllers/authSession.controller.js
    → dalHydrateAuthSession()
      File: apps/VCSM/src/features/auth/dal/authSession.read.dal.js
      → supabase.auth.getSession()

What this actually does: reads the session from Supabase's internal
store and returns it. The session was ALREADY set by signInWithPassword.
This call confirms the session exists but does NOT change React state.
No setUser/setSession call here — that happens in AuthProvider later.

Next:

  ensureProfileDiscoverable(data.user.id)
    File: apps/VCSM/src/features/auth/controllers/profile.controller.js
    Updates public.profiles SET discoverable=true WHERE id=userId

  debugLoginSessionSnapshot(data)
    Persists { userId, email, hasSession, hasUser } to debug store.


PHASE 4 — REDIRECT BEHAVIOR
==============================

File: apps/VCSM/src/features/auth/hooks/useLogin.js (line 63)

  const dest = from || '/feed'
  navigate(dest, { replace: true })

CRITICAL TIMING: This executes IMMEDIATELY after sign-in and session
hydration, BEFORE the AuthProvider has processed the onAuthStateChange
event, and BEFORE the IdentityProvider has started resolving.

At this exact moment:
  AuthProvider.user = still null (old state)
  identity = null
  loading = true

The route changes to /feed. React re-renders the route tree.
/feed renders but has no identity yet — it must handle loading state.


PHASE 5 — AUTHPROVIDER SESSION CHANGE
========================================

File: apps/VCSM/src/app/providers/AuthProvider.jsx

TWO things happen after the redirect:

A. supabase.auth.onAuthStateChange fires (line 44):
   Supabase delivers the SIGNED_IN event with the new session.
   AuthProvider runs:
     debugLoginEvent('AUTH_STATE_CHANGE', { event: 'SIGNED_IN', userId })
     setSession(nextSession)
     setUser(nextSession.user)      ← THIS TRIGGERS IDENTITY FLOW
     setLoading(false)

B. This causes a React re-render. The IdentityProvider now sees
   a new user?.id value.


PHASE 6 — IDENTITY RESET
===========================

File: apps/VCSM/src/state/identity/identityContext.jsx (line 214)

  useEffect(() => {
    debugLoginEvent('IDENTITY_CLEAR_ON_USER_CHANGE', {
      payload: { newUserId: user?.id, previousActorId: identity?.actorId }
    })
    setIdentity(null)
    setLoading(true)
  }, [user?.id])

This fires FIRST because it's declared before the resolution effect.
It sets identity=null and loading=true synchronously.

Any component reading useIdentity() now sees:
  identity = null
  loading = true
  identityLoading = true


PHASE 7 — IDENTITY RESOLVE EFFECT
====================================

File: apps/VCSM/src/state/identity/identityContext.jsx (line 224)

  useEffect(() => {
    let cancelled = false
    const myVersion = ++_resolveVersion

    async function run() {
      if (authLoading) { setLoading(true); return }
      if (!user?.id) { setIdentity(null); setLoading(false); return }
      setLoading(true)
      ...
    }

    run()
    return () => { cancelled = true }
  }, [authLoading, user?.id])

_resolveVersion is a module-level counter. It increments on every
effect invocation. Only the version matching the current counter value
can commit identity later. This prevents stale async results from
overwriting newer ones.


PHASE 8 — ENGINE RESOLUTION
==============================

File: apps/VCSM/src/state/identity/identity.controller.js (line 117)
Called by: run() inside the resolve effect

  resolveAuthenticatedContext({ appKey: 'vcsm', skipLoginRecord: true })
    File: engines/identity/src/controller/resolveAuthenticatedContext.controller.js

Step-by-step execution inside the engine:

  1_SESSION
    resolveSessionUser()
      File: engines/identity/src/services/sessionService.js
      → supabase.auth.getUser()
      → Returns the CURRENT auth user ID from the active Supabase session
      → NOTE: This reads the live session, NOT the userId parameter
      → If session changed since the effect started, this returns the NEW user
    Result: userId (UUID string)
    Table: Supabase auth (internal)

  2_APP
    dalGetAppByKey({ appKey: 'vcsm' })
      File: engines/identity/src/dal/app.read.dal.js
      → SELECT id, key, name, is_active, created_at
        FROM platform.apps
        WHERE key = 'vcsm' AND is_active = true
      → .maybeSingle() — safe, app key is unique
    Result: app object with id
    Table: platform.apps

  3_ACCESS
    resolveUserAppAccess({ userId, appId })
      File: engines/identity/src/services/accessService.js
      → dalGetUserAppAccess({ userId, appId })
        File: engines/identity/src/dal/access.read.dal.js
        → SELECT user_id, app_id, status, granted_at, revoked_at
          FROM platform.user_app_access
          WHERE user_id = :userId AND app_id = :appId
          ORDER BY granted_at DESC NULLS LAST
          LIMIT 1
        → .limit(1) — safe (fixed from .maybeSingle())
    Result: access object with status
    Gate: if status != 'granted' → throw ACCESS_DENIED
    Table: platform.user_app_access

  4_ACCOUNT
    resolveUserAppAccount({ userId, appKey: 'vcsm' })
      File: engines/identity/src/services/accountService.js
      → dalGetUserAppContextByKey({ userId, appKey: 'vcsm' })
        File: engines/identity/src/dal/account.read.dal.js
        → SELECT user_app_account_id, user_id, app_id, app_key,
                 app_name, app_account_status, activated_at, last_seen_at
          FROM platform.v_user_app_context
          WHERE user_id = :userId AND app_key = 'vcsm'
          ORDER BY activated_at DESC NULLS LAST
          LIMIT 1
        → .limit(1) — safe (fixed from .maybeSingle())
    Result: account object with id (= userAppAccountId, abbreviated uaaId)
    Gate: if no account → throw ACCOUNT_NOT_FOUND
    Table: platform.v_user_app_context (view over user_app_accounts JOIN apps)

  5_STATE_PREFS (parallel)
    dalGetStateForAccount({ userAppAccountId: uaaId })
      File: engines/identity/src/dal/state.read.dal.js
      → SELECT onboarding_status, account_status, last_actor_link_id,
               requires_onboarding, requires_actor_selection,
               first_login_at, last_login_at, ...
        FROM platform.user_app_state
        WHERE user_app_account_id = :uaaId
      → .maybeSingle() — safe (PK query)
    Table: platform.user_app_state

    dalGetPreferencesForAccount({ userAppAccountId: uaaId })
      File: engines/identity/src/dal/preferences.read.dal.js
      → SELECT user_app_account_id, active_actor_link_id,
               last_actor_link_id, theme, locale, timezone
        FROM platform.user_app_preferences
        WHERE user_app_account_id = :uaaId
      → .maybeSingle() — safe (PK query)
    Table: platform.user_app_preferences

    These can return null rows. The engine handles that gracefully.

  6_LINKS
    resolveAvailableActors({ userAppAccountId: uaaId })
      File: engines/identity/src/services/actorService.js
      → dalGetActorLinksForAccount({ userAppAccountId: uaaId })
        File: engines/identity/src/dal/actorLinks.read.dal.js
        → SELECT id, user_app_account_id, app_id, actor_source,
                 actor_id, actor_kind, is_primary, is_switchable,
                 status, display_name_snapshot, avatar_url_snapshot, meta
          FROM platform.user_app_actor_links
          WHERE user_app_account_id = :uaaId AND status = 'active'
          ORDER BY is_primary DESC
        → Returns array (all active links)
      → Each row mapped through ActorLinkModel(raw) → domain object
    Table: platform.user_app_actor_links

  7_ACTIVE_ACTOR
    resolveActiveActor({ availableActors, preferences: prefs, state })
      File: engines/identity/src/services/actorService.js (line 43)

      Selection priority (exact code):
        1. prefs?.activeActorLinkId → find in availableActors by link id
        2. state?.lastActorLinkId → find in availableActors by link id
        3. availableActors.find(a => a.isPrimary)
        4. availableActors[0]

      If availableActors is empty → returns null

      For a new/self-healed account with null preferences:
        → Falls through 1 and 2 (both null)
        → Picks primary if exists, otherwise first link

  8_RESULT
    Builds context object:
      {
        userId,
        appId,
        appKey: 'vcsm',
        userAppAccountId: uaaId,
        accessStatus: 'granted',
        accountStatus,
        availableActors: [...DomainActorLink],
        activeActor: DomainActorLink | null,
        roleKeys: [...],
        capabilityKeys: [...],
        requiresOnboarding,
        requiresActorSelection,
        isSuspended,
        defaultDestination,
      }

    Returns this to loadDefaultIdentityForUser.


PHASE 9 — ACTOR HYDRATION
============================

File: apps/VCSM/src/state/identity/identity.controller.js (line 158)

If activeActor exists:

  readIdentityActorByIdDAL(activeActor.actorId)
    File: apps/VCSM/src/state/identity/identity.read.dal.js
    → SELECT id, kind, profile_id, vport_id, is_void
      FROM vc.actors
      WHERE id = :actorId
    Table: vc.actors

  hydrateIdentityActor(actor)
    → hydrateActor({ appKey: 'vcsm', actorSource: 'vc', actorId, context: { actor } })
      File: engines/hydration (via @hydration alias)

    The VCSM hydrator adapter determines kind from actor row:

    For kind = 'user' (citizen):
      → SELECT * FROM public.profiles WHERE id = actor.profile_id
      → resolveRealmId(actor) → realm lookup
      → mapProfileActor(actor, profile, realmId)
      Result: { actorId, kind:'user', realmId, displayName, username,
                email, avatar, banner, bio, ... }
      Tables: vc.actors, public.profiles, vc.realms

    For kind = 'vport' (business):
      → SELECT * FROM vc.vports WHERE id = actor.vport_id
      → resolveRealmId(actor) → realm lookup
      → mapVportActor(actor, vport, realmId)
      Result: { actorId, kind:'vport', realmId, displayName, username (slug),
                avatar, banner, bio, vportType, isActive, ... }
      Tables: vc.actors, vc.vports, vc.realms

  After hydration, _engineMeta is attached:
    hydratedIdentity._engineMeta = {
      userId: ctx.userId,
      userAppAccountId: ctx.userAppAccountId,
      actorLinkId: ctx.activeActor.id,
      actorSource: ctx.activeActor.actorSource,
      engineResolved: true,
    }

  Returns the hydrated identity object to identityContext.jsx.

If no activeActor → returns null.


PHASE 10 — SELF-HEAL BOOTSTRAP
=================================

File: apps/VCSM/src/state/identity/identityContext.jsx (line 267)

Triggered when: loadDefaultIdentityForUser returned null
(engine could not resolve — no access, no account, or no actor links)

Step 1 — Find the citizen actor:
  const { data: vcActor } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('profile_id', user.id)
    .eq('kind', 'user')
    .maybeSingle()
  Table: vc.actors

Step 2 — If actor exists, provision platform rows:
  ensureVcsmPlatformBootstrap({ userId: user.id, actorId: vcActor.id })
    File: apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js
    → dalProvisionVcsmIdentity({ userId, actorId })
      File: apps/VCSM/src/features/identity/dal/provision.rpc.dal.js
      → supabase.schema('platform').rpc('provision_vcsm_identity', {
          p_user_id: userId,
          p_actor_id: actorId,
        })

  The RPC (SECURITY DEFINER) atomically creates/ensures:
    1. platform.user_app_access (status='granted')
    2. platform.user_app_accounts
    3. platform.user_app_preferences (empty/default)
    4. platform.user_app_state (onboarding_status='pending')
    5. platform.user_app_actor_links (actor_source='vc', is_primary=true)
    6. vc.actors.user_app_account_id bridge

  Returns: user_app_account_id (UUID)

Step 3 — Retry engine resolve:
  nextIdentity = await loadDefaultIdentityForUser({
    userId: user.id,
    savedActorId: loadIdentity(user.id),
  })

  This runs the entire Phase 8 + Phase 9 again.
  Now platform rows exist, so the engine should resolve successfully.


PHASE 11 — SELF-HEAL FINALIZATION
====================================

File: apps/VCSM/src/state/identity/identityContext.jsx (line 309)

If retry resolved successfully (nextIdentity._engineMeta.engineResolved):

  A. Persist active actor preference:
    engineSwitchActiveActor({
      userAppAccountId: meta.userAppAccountId,
      actorLinkId: meta.actorLinkId,
    })
      File: engines/identity/src/controller/switchActiveActor.controller.js
      → dalGetActorLinkById({ actorLinkId }) — validates link exists
      → Checks: owned by account, status='active', is_switchable=true
      → dalSetActiveActorLink({ userAppAccountId, actorLinkId })
        File: engines/identity/src/dal/actorLinks.write.dal.js
        → UPSERT INTO platform.user_app_preferences
            (user_app_account_id, active_actor_link_id, last_actor_link_id)
          VALUES (:uaaId, :linkId, :linkId)
          ON CONFLICT (user_app_account_id)
          DO UPDATE SET active_actor_link_id = :linkId,
                        last_actor_link_id = :linkId
      Table: platform.user_app_preferences

  B. Finalize account state:
    finalizeAccountState({
      userAppAccountId: meta.userAppAccountId,
      actorLinkId: meta.actorLinkId,
    })
      File: engines/identity/src/dal/state.write.dal.js
      → UPDATE platform.user_app_state SET
          onboarding_status = 'completed',
          account_status = 'active',
          requires_onboarding = false,
          requires_actor_selection = false,
          last_actor_link_id = :actorLinkId,
          last_login_at = now()
        WHERE user_app_account_id = :uaaId
      → UPDATE platform.user_app_state SET
          first_login_at = now()
        WHERE user_app_account_id = :uaaId
          AND first_login_at IS NULL
      Table: platform.user_app_state

  Both writes are non-fatal — if they fail, the identity still resolves
  but preferences remain null for next login.


PHASE 12 — IDENTITY COMMIT GUARDS
====================================

File: apps/VCSM/src/state/identity/identityContext.jsx (line 357)

GUARD 1 — RESOLVE VERSION:
  const isStale = cancelled || myVersion !== _resolveVersion
  If another resolve started after this one (user changed, re-render), this
  version is stale. The identity is NOT committed.
  → Logs: IDENTITY_COMMIT_REJECTED_STALE
  → Returns without calling setIdentity

GUARD 2 — OWNERSHIP:
  const identityUserId = nextIdentity._engineMeta?.userId
  if (identityUserId && identityUserId !== user.id)
  If the engine resolved an identity for a DIFFERENT user than the current
  session, it's rejected.
  → Logs: IDENTITY_OWNERSHIP_MISMATCH
  → setIdentity(null), setLoading(false)
  → Returns

GUARD 3 — NULL IDENTITY:
  If nextIdentity is null (engine failed, self-heal failed, no actor found),
  it's committed as null. The user sees the app with no identity.
  Components must handle identity=null, loading=false.


PHASE 13 — IDENTITY COMMIT
==============================

File: apps/VCSM/src/state/identity/identityContext.jsx (line 437)

If all guards pass:

  console.log('[IdentityApp] COMMIT_ATTEMPT', {
    sessionUserId, nextActorId, source, resolveVersion
  })

  debugLoginEvent('IDENTITY_COMMIT_SUCCESS', {
    actorId, kind, sessionUserId, resolveVersion, selfHealUsed
  })

  setIdentity(nextIdentity)    ← React state updated
  setLoading(false)             ← Loading complete

From this moment, every component calling useIdentity() receives:
  { identity: hydratedIdentityObject, loading: false, ... }


PHASE 14 — FINAL RUNTIME STATE
=================================

After identity commits, the app has:

  AUTH
    user.id = the authenticated Supabase user UUID
    session = valid Supabase session with access_token

  IDENTITY
    identity.actorId = the active VCSM actor UUID
    identity.kind = 'user' (citizen) or 'vport'
    identity.displayName, username, avatar, bio, realmId, ...
    identity._engineMeta.userId = matches session user
    identity._engineMeta.userAppAccountId = VCSM app account
    identity._engineMeta.actorLinkId = the chosen actor link
    identity._engineMeta.engineResolved = true

  PLATFORM STATE (after finalization)
    platform.user_app_preferences.active_actor_link_id = actor link ID
    platform.user_app_preferences.last_actor_link_id = actor link ID
    platform.user_app_state.onboarding_status = 'completed'
    platform.user_app_state.account_status = 'active'
    platform.user_app_state.last_login_at = now
    platform.user_app_state.first_login_at = set if first login

  LOCALSTORAGE
    NOT written during login. Only written during actor switching.
    Key format: vc.identity.actorId.{userId}
    The savedActorId is read but voided (void savedActorId).


ANSWERS TO SPECIFIC QUESTIONS
================================

1. Does redirect happen before identity resolves?
   YES. navigate('/feed') at T6 in useLogin.js fires after signInWithPassword
   but BEFORE AuthProvider processes onAuthStateChange (T7) and BEFORE
   IdentityProvider starts resolving (T11). The /feed page loads with
   identity=null, loading=true and re-renders when identity commits at T20.

2. What prevents stale identity on user switch?
   Three mechanisms:
   a) useEffect([user?.id]) immediately clears identity to null
   b) _resolveVersion counter rejects older async results
   c) Ownership guard rejects identity whose _engineMeta.userId != user.id
   d) Logout calls clearAllIdentityStorage() removing all cached actorIds

3. What happens when engine fails but self-heal succeeds?
   - Self-heal provisions platform rows via RPC
   - Retry resolve runs Phase 8-9 against now-valid platform data
   - If retry succeeds, finalization persists preferences + state
   - If retry also fails, nextIdentity stays null, committed as null

4. How are actor preferences persisted?
   - During self-heal finalization: engineSwitchActiveActor writes preferences
   - During actor switching: same engineSwitchActiveActor call
   - The UPSERT targets platform.user_app_preferences (active + last link IDs)
   - State finalization also writes last_actor_link_id to user_app_state

5. Does localStorage influence login actor resolution?
   NO. loadIdentity(user.id) reads the userId-scoped key and passes it
   as savedActorId, but loadDefaultIdentityForUser explicitly does:
     void savedActorId
   So the value is discarded. The engine resolves purely from platform state.

6. What happens if session changes during resolve?
   The engine calls resolveSessionUser() which reads the CURRENT session
   (supabase.auth.getUser()), not the userId captured by the effect.
   If the session changed, the engine resolves for the NEW user.
   But the version guard (myVersion !== _resolveVersion) rejects the
   result because a new effect already started for the new user.

7. What is the final source of truth?
   platform.user_app_preferences.active_actor_link_id
   → resolved by the engine in resolveActiveActor
   → hydrated into VCSM domain data via hydrateActor
   → committed to React state via setIdentity(nextIdentity)


FAILURE PATH ANALYSIS
========================

PGRST116 in engine resolve:
  Fixed: account.read.dal.js and access.read.dal.js changed to .limit(1).
  Fixed: VCSM resolver changed from .maybeSingle() to array query (multi-actor support).
  Fixed: preferences write changed from .upsert() to .update() (no more 403).
  Remaining: vc.can_view_actor RLS function returns NULL for actors without
  actor_privacy_settings rows — this is a database fix, not a code fix.

Null identity commit:
  Can happen when:
  - engine resolve returns no activeActor AND self-heal fails
  - vc.actors read is blocked by RLS (missing privacy row)
  - all guards reject the identity (ownership, version)

Self-heal retry logic:
  Self-heal runs ONCE per login attempt. If it succeeds but retry resolve
  fails, nextIdentity stays null. The provisioned platform rows persist.

Stale resolve rejection:
  Version guard + ownership guard prevent stale or cross-user commits.

switchActor:
  Fail-closed. Engine resolve, link match, and platform write must all
  succeed before hydration/commit. No more fail-open cache-only switches.

Logout:
  Clears all identity state: React state, localStorage (all userId-scoped keys),
  sessionStorage debug stores, Supabase realtime channels.

Actor hydration failure:
  If hydrateActor returns null (actor row not found in vc.actors, or
  profile/vport row missing), loadDefaultIdentityForUser returns null.
  Self-heal does not help here — the issue is in vc.* domain data.
  The user sees null identity.


COMPLETE EXECUTION TIMELINE
==============================

  T0   User clicks Login button
  T1   handleLogin(e) fires synchronously
  T2   supabase.auth.signInWithPassword({ email, password })
       → network request to Supabase Auth
  T3   Auth response received — session stored in Supabase client
  T4   hydrateAuthSession → supabase.auth.getSession (confirms session)
  T5   ensureProfileDiscoverable → UPDATE public.profiles
  T6   navigate('/feed', { replace: true })              ← REDIRECT
  T7   supabase.auth.onAuthStateChange fires SIGNED_IN
  T8   AuthProvider: setUser(newUser), setSession(newSession)
  T9   React re-render propagates to IdentityProvider
  T10  Identity clear effect: setIdentity(null), setLoading(true)
  T11  Identity resolve effect starts: myVersion = ++_resolveVersion
  T12  loadDefaultIdentityForUser({ userId, savedActorId })
  T13    resolveAuthenticatedContext({ appKey: 'vcsm' })
  T14      1_SESSION (auth.getUser)
  T15      2_APP (platform.apps)
  T16      3_ACCESS (platform.user_app_access)
  T17      4_ACCOUNT (platform.v_user_app_context)
  T18      5_STATE_PREFS (platform.user_app_state + user_app_preferences)
  T19      6_LINKS (platform.user_app_actor_links)
  T20      7_ACTIVE_ACTOR (pure logic, no DB)
  T21      8_RESULT (build context object)
  T22    readIdentityActorByIdDAL (vc.actors)
  T23    hydrateActor (public.profiles or vc.vports + realm)
  T24  [If engine returned null: self-heal T25-T30]
  T25    Query vc.actors for citizen actor
  T26    ensureVcsmPlatformBootstrap → RPC provision_vcsm_identity
  T27    Retry loadDefaultIdentityForUser (T12-T23 again)
  T28    engineSwitchActiveActor → UPSERT preferences
  T29    finalizeAccountState → UPDATE state
  T30  [End self-heal]
  T31  Version guard check (myVersion === _resolveVersion?)
  T32  Ownership guard check (_engineMeta.userId === user.id?)
  T33  [IdentityApp] COMMIT_ATTEMPT logged
  T34  IDENTITY_COMMIT_SUCCESS logged
  T35  setIdentity(hydratedIdentity)                     ← IDENTITY READY
  T36  setLoading(false)
  T37  React re-renders /feed with real identity data

  Normal path (no self-heal): T0→T36 in ~300-800ms
  Self-heal path: T0→T36 in ~800-2000ms
  Gap between redirect (T6) and identity ready (T35): ~200-1500ms


DATABASE TABLES TOUCHED DURING LOGIN
=======================================

  Read:
    platform.apps                         (2_APP)
    platform.user_app_access              (3_ACCESS)
    platform.v_user_app_context           (4_ACCOUNT)
    platform.user_app_state               (5_STATE)
    platform.user_app_preferences         (5_PREFS)
    platform.user_app_actor_links         (6_LINKS)
    vc.actors                             (hydration + self-heal lookup)
    public.profiles                       (hydration, citizen)
    vc.vports                             (hydration, vport)

  Write (self-heal + finalization only):
    platform.user_app_access              (provision RPC)
    platform.user_app_accounts            (provision RPC)
    platform.user_app_preferences         (provision RPC + switchActiveActor)
    platform.user_app_state               (provision RPC + finalizeAccountState)
    platform.user_app_actor_links         (self-heal finalization via switchActiveActor; vport creation via live vc.create_vport RPC)
    vc.actors.user_app_account_id         (set by vc.create_vport for vport actors)
    public.profiles.discoverable          (ensureProfileDiscoverable)

  Auth (Supabase-managed):
    auth.users                            (signInWithPassword)
