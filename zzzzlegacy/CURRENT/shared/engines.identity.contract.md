# Identity Engine — Public Contract

**Status:** FROZEN (2026-03-31)
**Last audit:** 2026-04-09
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

## What the engine does

- Resolves the authenticated user from the Supabase session
- Resolves the app by key from the platform registry
- Enforces the app access gate (granted / suspended / revoked)
- Resolves the user-app account
- Resolves actor links (available identities) for the account
- Selects the active actor based on preferences and state
- Aggregates role keys and capability keys
- Determines onboarding state and default destination
- Records login timestamps
- Emits domain events for lifecycle transitions
- Provides actor switching across available actor links
- Provides logout cleanup

## What the engine does NOT do

- Interpret app-specific roles (e.g. "teacher", "barber", "admin")
- Query app-specific schemas (vc.*, learning.*, chat.*)
- Render UI, routes, or components
- Handle signup or provisioning (apps own this)
- Enrich actor data with domain-specific fields (apps inject enrichers)
- Determine what "citizen" or "vport" means in product terms

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

### State
- `finalizeAccountState({ userAppAccountId, actorLinkId })` — bootstrap self-heal

### Auth State
- `onAuthStateChange(callback)` — subscribe to auth events

### Events
- `EVENTS` — event name constants
- `onIdentityEvent(event, callback)` — subscribe to domain events

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

---

## Schema Boundary (Non-Negotiable)

**The engine MUST NOT query:**
- `learning.*` — belongs to Wentrex app
- `vc.*` — belongs to VCSM app
- `chat.*` — belongs to chat engine
- `moderation.*` — belongs to chat engine
- `wanders.*` — belongs to VCSM app
- Any app-specific schema, past or future

If an app needs data from its own schema during identity resolution,
the app provides a `resolveAppContext` function that the engine calls.
The engine never reads app schemas directly.

---

## Dependency Injection

Apps configure the engine at startup:

```javascript
configureIdentityEngine({
  supabaseClient,                // required — Supabase client instance
  debugReporter,                 // optional — ({ step, phase, status, message, payload, error }) => void
  enrichActorLinks,              // optional — async (actorLinks[]) => actorLinks[] (live data override)
  resolveAppContext,             // optional — async ({ userAppAccountId, userId }) => AppContext
})
```

### resolveAppContext contract

When provided, the engine delegates actor/role/capability resolution to the app:

```javascript
async function resolveAppContext({ userAppAccountId, userId }) {
  return {
    actorLinks: [],              // ActorLinkRow[] — platform-shaped actor link rows
    roleKeys: [],                // string[] — app-interpreted role keys
    capabilityKeys: [],          // string[] — app-interpreted capability keys
    isSuspended: false,          // boolean — app-level suspension flag
    defaultDestination: null,    // string|null — post-login route
  }
}
```

Apps own the implementation. The engine owns the contract shape.

---

## Canonical Output Shape

```javascript
AuthenticatedContext {
  userId,
  appId,
  appKey,
  userAppAccountId,
  accessStatus,
  accountStatus,
  availableActors: ActorLink[],
  activeActor: ActorLink | null,
  roleKeys: string[],
  capabilityKeys: string[],
  requiresOnboarding: boolean,
  requiresActorSelection: boolean,
  isSuspended: boolean,
  defaultDestination: string | null,
}
```

Apps interpret `roleKeys`, `activeActor.meta`, and `defaultDestination` in their own adapter layer.

---

## Forbidden Dependencies

- No imports from `apps/`
- No imports from `engines/chat/`
- No imports from `engines/hydration/`
- No imports from `shared/`
- No React components, providers, or context
- No HTTP handlers or WebSocket logic
- No `learning.*` schema queries
- No `vc.*` schema queries
- No `chat.*` schema queries
- No app-named exports (no VCSM, Wentrex, or app-specific names in public API)
- No app-specific role interpretation
- No app-specific resolver implementations inside the engine

---

## Event Names

```
identity.context_resolved
identity.actor_switched
identity.access_denied
identity.session_missing
identity.account_suspended
identity.logged_out
```

---

## Change Policy

- Public API additions require review
- Public API removals are breaking changes
- Internal refactors (DAL, model, service) are safe if public API is unchanged
- App-specific code must NEVER be added to this engine
- New DI injection points may be added if they follow the resolver pattern
- All changes must be verified against BOUNDARY.md guardrails
