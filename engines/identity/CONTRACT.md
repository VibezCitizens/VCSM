# Identity Engine — Public Contract

**Status:** FROZEN (2026-03-31)
**Owner:** Platform infrastructure
**Consumers:** apps/VCSM, apps/wentrex (via app-owned adapters)

---

## Purpose

Resolves the full authenticated context for any app on the platform:

```
session -> app -> access -> account -> actors -> roles -> capabilities -> destination
```

The engine is **app-agnostic**. It does not know what Wentrex, VCSM, or any specific app means. Apps inject their own resolvers and enrichers via configuration.

---

## Public API

### Configuration
- `configureIdentityEngine(config)` — must be called once at startup

### Controllers (orchestration)
- `resolveAuthenticatedContext({ appKey, skipLoginRecord })` — full context resolution
- `switchActiveActor({ userAppAccountId, actorLinkId })` — change active actor
- `logoutCleanup()` — sign out and emit event

### Services (granular resolution)
- `resolveSessionUser()` — extract user ID from session
- `resolveUserAppAccess({ userId, appId })` — check app access gate
- `resolveUserAppAccount({ userId, appKey })` — resolve account record
- `resolveAvailableActors({ userAppAccountId })` — list actor links
- `resolveActiveActor({ actors, preferences, state })` — select active actor
- `resolveRoleKeys({ userAppAccountId })` — aggregate role keys
- `resolveCapabilityKeys({ userAppAccountId })` — aggregate capabilities
- `resolveDefaultDestination({ state })` — post-login routing

### Auth State
- `onAuthStateChange(callback)` — subscribe to auth events

### Events
- `EVENTS` — event name constants
- `onIdentityEvent(event, callback)` — subscribe to domain events

### Temporary (pending VCSM migration)
- `createVcsmActorEnricher()` — VCSM actor link enricher (will move to apps/VCSM)

---

## Database Schema

The engine reads/writes ONLY from `platform.*`:

```
platform.apps
platform.user_app_access
platform.user_app_accounts
platform.v_user_app_context (view)
platform.user_app_actor_links
platform.user_app_preferences
platform.user_app_state
platform.app_roles
platform.user_app_account_roles
platform.role_capabilities
platform.capabilities
platform.user_capabilities
```

**The engine MUST NOT query:**
- `learning.*` — belongs to Wentrex app
- `vc.*` — belongs to VCSM app
- `chat.*` — belongs to chat engine
- Any app-specific schema

---

## Dependency Injection

Apps configure the engine at startup:

```javascript
configureIdentityEngine({
  supabaseClient,                // required
  enrichActorLinks,              // optional — live actor data enrichment
  resolveAppContext,             // optional — all-in-one app resolver
})
```

When `resolveAppContext` is provided, the engine delegates actor/role/capability resolution to the app's resolver instead of reading from platform tables.

---

## Forbidden Dependencies

- No imports from `apps/`
- No imports from `engines/chat/`
- No imports from `shared/`
- No React components, providers, or context
- No HTTP handlers or WebSocket logic
- No `learning.*` schema queries
- No `vc.*` schema queries
- No Wentrex-named exports (removed 2026-03-31)
- No app-specific role interpretation

---

## Canonical Output Shape

```javascript
AuthenticatedContext {
  userId,
  appId,
  userAppAccountId,
  activeActor: {
    id, actorId, actorKind, actorSource,
    isPrimary, isSwitchable,
    displayName, avatarUrl, meta
  },
  actors: ActorLink[],
  roleKeys: string[],
  capabilityKeys: string[],
  isSuspended: boolean,
  defaultDestination: string | null,
  state: DomainState,
  preferences: DomainPreferences
}
```

Apps interpret `roleKeys`, `meta`, and `defaultDestination` in their own adapter layer.

---

## Change Policy

- Public API additions require review
- Public API removals are breaking changes
- Internal refactors (DAL, model, service) are safe if public API is unchanged
- App-specific code must NEVER be added to this engine
