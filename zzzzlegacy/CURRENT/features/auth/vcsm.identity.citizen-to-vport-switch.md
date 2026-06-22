Citizen-to-Vport Switch — Full Pipeline
========================================

Overview
--------
When a VCSM user switches from their personal citizen identity to one of their
Vport (business storefront) identities, the system:

  1. Resolves the current authenticated context from the identity engine
  2. Validates and writes the actor preference at the platform level
  3. Hydrates the new actor with VCSM domain data
  4. Updates React state so the entire app re-renders as the vport

Authority model:
  - Engine owns the preference (which actor is active)
  - App owns the hydration (what domain data that actor carries)
  - localStorage is a secondary cache only — never authoritative


Phase 1: UI Trigger
--------------------
Two entry points funnel into the same function:

  Entry Point 1 — IdentitySwitcher
    File: apps/VCSM/src/state/identity/identitySwitcher.jsx

    A floating widget rendered when the user owns more than one actor.
    On mount it calls:

      loadOwnedActorChoices(userId)

    Which calls the engine:

      resolveAuthenticatedContext({ appKey: 'vcsm', skipLoginRecord: true })

    And returns ctx.availableActors — all actor links for this account.
    Each actor link appears as a button. Clicking one calls:

      switchActor(row.actor_id)

  Entry Point 2 — useVportSwitcher
    File: apps/VCSM/src/features/settings/vports/hooks/useVportSwitcher.js

    Used in the Vport settings screen.

      switchToVport(v, setBusy)
        → calls switchActor(v.actor_id)
        → navigates to /vport/notifications?actor=vport:{v.id}

      switchToProfile(profileActorId, setBusy)
        → calls switchActor(profileActorId)
        → navigates to /notifications?actor=profile:{meId}

Both entry points call the same function:

  switchActor(actorId)  from useIdentity()

  Defined in: apps/VCSM/src/state/identity/identityContext.jsx  (lines 22-55)


Phase 2: Resolve Current Context
----------------------------------
File: apps/VCSM/src/state/identity/identityContext.jsx  (lines 22-54)

  async function switchActor(actorId) {
    if (!actorId) return

The function first resolves the current authenticated context from the engine:

  const ctx = await resolveAuthenticatedContext({
    appKey: 'vcsm',
    skipLoginRecord: true,
  })

This call goes through the identity engine pipeline:

  session → app → access → account → actor links → preferences → active actor

What comes back:

  ctx.userAppAccountId    — the user's account row in platform.user_app_accounts
  ctx.availableActors     — array of DomainActorLink objects from
                            platform.user_app_actor_links
  ctx.activeActor         — the currently active link (before switch)

Next, find the actor link that matches the target actorId:

  const link = ctx.availableActors.find(a => a.actorId === actorId)

Each actor link row in platform.user_app_actor_links contains:

  Column                  | Example for Vport
  ------------------------|---------------------------
  id                      | uuid (the link row ID)
  user_app_account_id     | uuid (account FK)
  app_id                  | uuid (VCSM app)
  actor_source            | 'vc'
  actor_id                | uuid (vc.actors.id)
  actor_kind              | 'vport'
  is_primary              | false
  is_switchable           | true
  status                  | 'active'
  display_name_snapshot   | 'My Coffee Shop'
  avatar_url_snapshot     | 'https://...'

The model that maps this row:

  File: engines/identity/src/model/ActorLink.model.js

  ActorLinkModel(raw) returns:
    {
      id, userAppAccountId, appId, actorSource, actorId,
      actorKind, isPrimary, isSwitchable, status,
      displayName, avatarUrl, meta
    }


Phase 3: Engine Preference Write
----------------------------------
File: engines/identity/src/controller/switchActiveActor.controller.js

  await engineSwitchActiveActor({
    userAppAccountId: ctx.userAppAccountId,
    actorLinkId: link.id,
  })

The engine controller performs 4 validation checks:

  Check 1 — EXISTS
    dalGetActorLinkById({ actorLinkId })
    Fetches the row from platform.user_app_actor_links
    Throws ACTOR_LINK_NOT_FOUND if missing

  Check 2 — OWNERSHIP
    row.user_app_account_id === userAppAccountId
    The link must belong to this specific account
    Throws ACTOR_LINK_FORBIDDEN if mismatched

  Check 3 — ACTIVE STATUS
    row.status === 'active'
    Suspended or revoked links cannot be switched to
    Throws ACTOR_LINK_INACTIVE if not active

  Check 4 — SWITCHABLE
    row.is_switchable === true
    Some actors may be locked (e.g., during moderation)
    Throws ACTOR_NOT_SWITCHABLE if locked

If all 4 checks pass, the engine writes the preference:

  File: engines/identity/src/dal/actorLinks.write.dal.js

  dalSetActiveActorLink({ userAppAccountId, actorLinkId })

  SQL equivalent:

    INSERT INTO platform.user_app_preferences
      (user_app_account_id, active_actor_link_id, last_actor_link_id)
    VALUES
      (:userAppAccountId, :actorLinkId, :actorLinkId)
    ON CONFLICT (user_app_account_id)
    DO UPDATE SET
      active_actor_link_id = :actorLinkId,
      last_actor_link_id   = :actorLinkId

  This is the AUTHORITATIVE record.
  Next time resolveAuthenticatedContext runs (next page load, session restore,
  or tab reactivation), the engine reads this preference row to determine
  which actor link is active.

After writing the preference, the engine immediately calls:

  invalidateIdentityResultCache()
    File: engines/identity/src/controller/resolveAuthenticatedContext.controller.js
    Busts the 120s in-memory result cache. This ensures the next call to
    resolveAuthenticatedContext (Phase 4's loadIdentityForActorId) re-reads
    platform state from DB with the new active actor — it does NOT serve
    the stale cached result for the old actor.

After the cache bust, the engine emits a domain event:

  emit(EVENTS.ACTOR_SWITCHED, {
    userAppAccountId,
    actorLinkId,
    actorId: activeActor.actorId,
  })

Error handling in identityContext.jsx:
  If the engine switch fails (network, RLS, etc.), the catch block swallows
  the error and continues to Phase 4 anyway — for UX continuity. The local
  hydration still happens so the user sees the switch immediately. The
  preference will be stale, but the next successful engine call will reconcile.


Phase 4: VCSM Domain Hydration
--------------------------------
File: apps/VCSM/src/state/identity/identity.controller.js  (lines 88-94)

Back in identityContext.jsx, after the engine preference write:

  const nextIdentity = await loadIdentityForActorId(actorId)

Which calls the shared hydration engine:

  hydrateActor({
    appKey: 'vcsm',
    actorSource: 'vc',
    actorId,
  })

The VCSM hydrator adapter (registered at app startup) fetches domain data:

  For kind: 'user' (citizen):
    vc.actors → base actor row (id, kind, profile_id, is_void)
    public.profiles → display_name, username, email, avatar (photo_url),
                  banner_url, bio, birthdate, age, sex, is_adult,
                  discoverable, publish, last_seen, created_at, updated_at

  For kind: 'vport' (business):
    vc.actors → base actor row
    vc.vports → name, slug, avatar_url, banner_url, bio,
                is_active, vport_type, created_at, updated_at

  For both:
    Realm resolution via resolveRealmId(actor)
      → readPreferredRealmByVoidStateDAL(actor.is_void)
      → fallback: readFallbackRealmDAL()

The mapping functions that shape the final object:

  mapProfileActor(actor, profile, realmId) → citizen identity shape
  mapVportActor(actor, vport, realmId) → vport identity shape

  Both defined in: apps/VCSM/src/state/identity/identity.controller.js


Phase 5: State Update
-----------------------
File: apps/VCSM/src/state/identity/identityContext.jsx  (lines 47-51)

  if (nextIdentity) {
    saveIdentity(actorId, user?.id)  // localStorage — userId-scoped cache only
    setIdentity(nextIdentity)        // React state update
  }

  saveIdentity(actorId, user?.id)
    File: apps/VCSM/src/state/identity/identityStorage.js
    Writes actorId to localStorage under a userId-scoped key:
      vc.identity.actorId.{userId}
    This ensures different auth users never share cached actorIds.
    NOT authoritative — the engine preference in platform.user_app_preferences
    is the source of truth. This is a convenience cache only.

  setIdentity(nextIdentity)
    Updates the React state in IdentityProvider.
    Triggers a re-render of every component consuming useIdentity().

After the switch, every consumer of useIdentity() sees:

  identity.actorId       → the vport's actor ID (vc.actors.id)
  identity.kind          → 'vport'
  identity.realmId       → resolved realm
  identity.isVoid        → from vc.actors.is_void
  identity.displayName   → vport name
  identity.username      → vport slug
  identity.avatar        → vport avatar_url
  identity.banner        → vport banner_url
  identity.bio           → vport bio
  identity.isActive      → vport is_active
  identity.vportType     → vport type
  identity.createdAt     → vport created_at
  identity.updatedAt     → vport updated_at

The entire app now operates as the vport:
  - Posts are authored by the vport actor
  - Chat messages are sent as the vport
  - Bookings are managed under the vport
  - Social interactions (follows, reactions) are from the vport
  - Navigation may redirect to vport-specific routes


Pipeline Diagram
-----------------

  User taps "Switch to Vport"
    |
    v
  switchActor(vportActorId)
    |
    +-- resolveAuthenticatedContext({ appKey: 'vcsm' })
    |     \-- engine returns ctx.availableActors
    |          \-- find link where actorId === vportActorId
    |
    +-- engineSwitchActiveActor({ userAppAccountId, actorLinkId })
    |     +-- validate: exists
    |     +-- validate: owned by this account
    |     +-- validate: status === 'active'
    |     +-- validate: is_switchable === true
    |     +-- UPSERT platform.user_app_preferences.active_actor_link_id
    |     \-- emit ACTOR_SWITCHED domain event
    |
    +-- loadIdentityForActorId(vportActorId)
    |     \-- hydrateActor({ appKey: 'vcsm', actorSource: 'vc', actorId })
    |          +-- fetch vc.actors (base row)
    |          +-- fetch vc.vports (domain data)
    |          \-- resolveRealmId (realm assignment)
    |
    +-- saveIdentity(actorId)        [localStorage cache]
    |
    \-- setIdentity(hydratedVport)   [React state update]
          \-- entire app re-renders as the vport


Database Tables Involved
-------------------------

  Table                              | Role in Switch
  -----------------------------------|--------------------------------------
  platform.user_app_accounts         | Account FK for the user in VCSM app
  platform.user_app_actor_links      | All actor links (citizen + vports)
  platform.user_app_preferences      | Authoritative active actor preference
  vc.actors                          | Base actor row (id, kind, is_void)
  vc.vports                          | Vport domain data (name, slug, etc.)
  public.profiles                        | Profile domain data (for citizen)


Key Files Reference
--------------------

  File                                                           | Role
  ---------------------------------------------------------------|---------------------------
  apps/VCSM/src/state/identity/identityContext.jsx               | switchActor orchestration
  apps/VCSM/src/state/identity/identity.controller.js            | loadIdentityForActorId, hydration
  apps/VCSM/src/state/identity/identitySwitcher.jsx              | Floating actor switch UI
  apps/VCSM/src/features/settings/vports/hooks/useVportSwitcher.js | Vport settings switch
  apps/VCSM/src/state/identity/identityStorage.js               | localStorage cache
  engines/identity/src/controller/switchActiveActor.controller.js | Engine validation + preference write
  engines/identity/src/dal/actorLinks.read.dal.js                | Read actor links from platform
  engines/identity/src/dal/actorLinks.write.dal.js               | Write active preference
  engines/identity/src/model/ActorLink.model.js                  | Row-to-domain mapping
  engines/identity/src/adapters/index.js                         | Engine public API


Design Principle
-----------------

  The engine owns the PREFERENCE — which actor link is active.
  The app owns the HYDRATION — what domain data that actor carries.

  The engine never queries vc.* or any app-specific schema.
  It records "this link is now active" in platform.user_app_preferences.
  VCSM then enriches the selected actor with its own domain data from vc.*.

  This separation means the same engine serves both VCSM and Wentrex
  without knowing anything about either app's domain model.
