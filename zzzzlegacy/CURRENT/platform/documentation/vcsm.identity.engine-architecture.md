# Identity Engine — Neutral Architecture

Updated: 2026-04-09
Engine path: `/Users/vcsm/Desktop/VCSM/engines/identity/`
Status: FROZEN (2026-03-31), fully isolated (2026-04-09 audit clean)

---

## 1. Neutral Engine Architecture Summary

### What the engine does

The identity engine resolves the full authenticated context for any app on the platform:

```
session -> app -> access -> account -> actors -> roles -> capabilities -> destination
```

It answers one question: **"Who is this user, what can they do, and where should they go?"**

Concrete responsibilities:
- Extract authenticated user from Supabase session
- Look up the platform app by key
- Enforce the app access gate (granted / suspended / revoked / pending)
- Resolve the user's app account
- Resolve available actor links (identities the user can operate as)
- Select the active actor based on preferences and state history
- Aggregate role keys and capability keys
- Determine onboarding state and post-login destination
- Record login timestamps
- Provide actor switching between available identities
- Provide logout cleanup with event emission

### What the engine does NOT do

- Interpret what roles mean (teacher, admin, barber, citizen)
- Query app-specific schemas (vc.*, learning.*, chat.*)
- Render any UI or React code
- Handle user signup or provisioning
- Enrich actor data with domain-specific fields
- Route users to specific pages
- Determine product-level identity rules (e.g. "only citizens can book")

### How it achieves neutrality

The engine reads/writes ONLY from `platform.*` schema tables. All app-specific behavior enters through dependency injection at startup via `configureIdentityEngine(config)`. The engine calls app-injected resolver functions — it never branches on `appKey` values or contains app-specific conditionals.

---

## 2. Boundary Rules

### Inside the engine (allowed)

- `platform.*` schema reads/writes
- Supabase auth session access
- Pure domain models for platform entities
- Actor link selection algorithms
- Role/capability aggregation from platform tables
- Event emission (identity.context_resolved, identity.actor_switched, etc.)
- DI config storage and accessor functions

### Must stay in apps/ (forbidden inside engine)

- App-specific resolver implementations
- App-specific schema queries (vc.*, learning.*)
- App-specific provisioning RPCs
- React providers, hooks, context, components
- Route/navigation logic
- App-specific role interpretation
- App-specific actor enrichment logic
- UI for identity switching or onboarding
- Debug reporter implementations

### Forbidden inside engine core (non-negotiable)

- Imports from `apps/`
- Imports from `engines/chat/`, `engines/hydration/`
- Imports from `shared/`
- `.schema("vc")`, `.schema("learning")`, `.schema("chat")` queries
- App-named exports (VCSM, Wentrex, barber, citizen, vport, learning)
- Conditional logic branching on `appKey` values
- React imports (`react`, `useState`, `useEffect`)
- HTTP handlers or WebSocket logic
- Resolver implementation files

---

## 3. Folder Structure

```
engines/identity/
  index.js                         <- re-exports adapters/index.js
  CONTRACT.md                      <- frozen public API + schema rules
  BOUNDARY.md                      <- anti-leak rules + review checklist
  CLAUDE.md                        <- AI scope rules
  src/
    config.js                      <- DI: configureIdentityEngine, getSupabaseClient, getAppContextResolver
    events.js                      <- domain event bus (emit, on, EVENTS)
    resolveTrace.js                <- debug tracing utility
    types/
      index.js                     <- JSDoc typedefs for all domain types
    dal/
      session.read.dal.js          <- supabase.auth.getUser()
      app.read.dal.js              <- platform.apps
      access.read.dal.js           <- platform.user_app_access
      account.read.dal.js          <- platform.user_app_accounts, v_user_app_context
      actorLinks.read.dal.js       <- platform.user_app_actor_links (read)
      actorLinks.write.dal.js      <- platform.user_app_actor_links + preferences (write)
      roles.read.dal.js            <- app_roles, user_app_account_roles, role_capabilities
      capabilities.read.dal.js     <- capabilities, user_capabilities
      preferences.read.dal.js      <- platform.user_app_preferences
      state.read.dal.js            <- platform.user_app_state
      state.write.dal.js           <- login timestamps, destination, account state
    model/
      App.model.js                 <- platform.apps row -> DomainApp
      Access.model.js              <- platform.user_app_access row -> DomainAccess
      Account.model.js             <- platform.user_app_accounts row -> DomainAccount
      ActorLink.model.js           <- platform.user_app_actor_links row -> DomainActorLink
      Preferences.model.js         <- platform.user_app_preferences row -> DomainPreferences
      State.model.js               <- platform.user_app_state row -> DomainState
    services/
      sessionService.js            <- resolveSessionUser
      accessService.js             <- resolveUserAppAccess, isAccessGranted
      accountService.js            <- resolveUserAppAccount
      actorService.js              <- resolveAvailableActors, resolveActiveActor
      roleService.js               <- resolveRoleKeys
      capabilityService.js         <- resolveCapabilityKeys
      destinationService.js        <- resolveDefaultDestination
    controller/
      resolveAuthenticatedContext.controller.js    <- full orchestration
      switchActiveActor.controller.js              <- actor switching
      logoutCleanup.controller.js                  <- sign out + event
    adapters/
      index.js                     <- public API surface (ONLY export point)
```

---

## 4. Public API

All exports come through `engines/identity/src/adapters/index.js`:

### Configuration

| Export | Signature | Purpose |
| --- | --- | --- |
| `configureIdentityEngine` | `(config) => void` | Must be called once at app startup before any engine use |

### Controllers (primary use-cases)

| Export | Signature | Purpose |
| --- | --- | --- |
| `resolveAuthenticatedContext` | `({ appKey, skipLoginRecord? }) => AuthenticatedContext` | Full identity resolution pipeline |
| `switchActiveActor` | `({ userAppAccountId, actorLinkId }) => void` | Persist active actor switch |
| `logoutCleanup` | `() => void` | Sign out and emit logged_out event |

### Services (granular resolution)

| Export | Signature | Purpose |
| --- | --- | --- |
| `resolveSessionUser` | `() => userId \| null` | Extract user from Supabase session |
| `resolveUserAppAccess` | `({ userId, appId }) => DomainAccess` | Check app access gate |
| `resolveUserAppAccount` | `({ userId, appKey }) => DomainAccount` | Resolve account record |
| `resolveAvailableActors` | `({ userAppAccountId }) => DomainActorLink[]` | List available actor links |
| `resolveActiveActor` | `({ availableActors, preferences, state }) => DomainActorLink \| null` | Select active actor |
| `resolveRoleKeys` | `({ userAppAccountId }) => string[]` | Aggregate role keys |
| `resolveCapabilityKeys` | `({ userAppAccountId }) => string[]` | Aggregate capability keys |
| `resolveDefaultDestination` | `(state) => string \| null` | Post-login destination |

### State

| Export | Signature | Purpose |
| --- | --- | --- |
| `finalizeAccountState` | `({ userAppAccountId, actorLinkId }) => void` | Bootstrap self-heal finalization |

### Auth

| Export | Signature | Purpose |
| --- | --- | --- |
| `onAuthStateChange` | `(callback) => unsubscribe` | Subscribe to Supabase auth state changes |

### Events

| Export | Signature | Purpose |
| --- | --- | --- |
| `EVENTS` | `{ CONTEXT_RESOLVED, ACTOR_SWITCHED, ACCESS_DENIED, SESSION_MISSING, ACCOUNT_SUSPENDED, LOGGED_OUT }` | Event name constants |
| `onIdentityEvent` | `(eventName, callback) => unsubscribe` | Subscribe to identity domain events |

---

## 5. Dependency Injection Contract

### Config shape

```javascript
configureIdentityEngine({
  // Required
  supabaseClient: SupabaseClient,

  // Optional — app-owned debug sink
  debugReporter: ({ step, phase, status, message, payload, error }) => void,

  // Optional — override actor link snapshot data with live reads
  enrichActorLinks: async (actorLinkRows: ActorLinkRow[]) => ActorLinkRow[],

  // Optional — all-in-one app resolver (replaces platform-schema queries)
  resolveAppContext: async ({ userAppAccountId, userId }) => {
    actorLinks: ActorLinkRow[],      // platform-shaped rows
    roleKeys: string[],              // app-interpreted role keys
    capabilityKeys: string[],        // app-interpreted capabilities
    isSuspended: boolean,            // app-level suspension flag
    defaultDestination: string|null, // post-login route
  },
})
```

### Resolver behavior

When `resolveAppContext` is provided:
- Engine skips `resolveAvailableActors`, `resolveRoleKeys`, `resolveCapabilityKeys`
- Engine calls the app's resolver instead
- App resolver queries its own schemas (vc.*, learning.*, etc.)
- Engine maps returned actorLinks through `ActorLinkModel` for normalization
- Engine uses returned roleKeys/capabilityKeys as-is (no interpretation)

When `resolveAppContext` is NOT provided:
- Engine reads actors from `platform.user_app_actor_links`
- Engine reads roles from `platform.app_roles` + `platform.user_app_account_roles`
- Engine reads capabilities from `platform.capabilities` + `platform.user_capabilities`
- This is the "pure platform" path — no app-specific data

### Enricher behavior

When `enrichActorLinks` is provided:
- Called after actor link rows are fetched
- Receives platform-shaped rows
- Returns platform-shaped rows with updated fields (displayName, avatarUrl, etc.)
- Used to override snapshot data with live data from app schemas

---

## 6. Data Flow

### Full resolution flow (resolveAuthenticatedContext)

```
App startup:
  configureIdentityEngine({ supabaseClient, resolveAppContext: appResolver })

User action / session restore:
  const ctx = await resolveAuthenticatedContext({ appKey: 'vcsm' })

Engine internal pipeline:
  1. resolveSessionUser()
     -> supabase.auth.getUser()
     -> userId

  2. dalGetAppByKey({ appKey })
     -> platform.apps WHERE key = appKey
     -> AppModel(row)

  3. resolveUserAppAccess({ userId, appId })
     -> platform.user_app_access
     -> isAccessGranted(access) check

  4. resolveUserAppAccount({ userId, appKey })
     -> platform.v_user_app_context
     -> account.id (userAppAccountId)

  5. Promise.all([dalGetState, dalGetPreferences])
     -> platform.user_app_state
     -> platform.user_app_preferences

  6. Actor/role/capability resolution:
     IF resolveAppContext injected:
       -> appResolver({ userAppAccountId, userId })
       -> { actorLinks, roleKeys, capabilityKeys, isSuspended, defaultDestination }
     ELSE:
       -> Promise.all([resolveAvailableActors, resolveRoleKeys, resolveCapabilityKeys])
       -> platform.user_app_actor_links + platform.app_roles + platform.capabilities

  7. resolveActiveActor({ availableActors, preferences, state })
     -> selection algorithm (prefs > state > primary > first)

  8. dalRecordLogin (non-fatal, skippable)

  9. emit(EVENTS.CONTEXT_RESOLVED)

  10. Return AuthenticatedContext
```

### Actor switching flow

```
User switches identity:
  await switchActiveActor({ userAppAccountId, actorLinkId })

Engine internal:
  1. dalUpdateActiveActorLink({ userAppAccountId, actorLinkId })
     -> UPDATE platform.user_app_preferences SET active_actor_link_id = actorLinkId
  2. emit(EVENTS.ACTOR_SWITCHED)
```

### App consumption pattern (VCSM)

```
Boot:
  1. setupVcsmIdentityEngine()                       [main.jsx:14]
  2. IdentityProvider mounts                          [identityContext.jsx]
  3. resolveAuthenticatedContext({ appKey: 'vcsm' })  [engine]
  4. loadIdentityForActorId(activeActor.actorId)      [identity.controller.js]
  5. hydrateIdentityActor() → vc.actors + profiles    [app enrichment]
  6. setIdentity(hydratedIdentity)                    [React state commit]
  7. debugFeedViewer({ user, identity })              [global sync effect]
  8. 59 useIdentity() consumers re-render             [React context propagation]

Switch:
  1. switchActor(actorId)                             [identityContext.jsx:28]
  2. resolveAuthenticatedContext (skip login record)   [engine]
  3. engineSwitchActiveActor (platform write)          [engine]
  4. loadIdentityForActorId (hydrate)                  [app enrichment]
  5. setIdentity(nextIdentity)                         [React state commit]
  6. All 59 consumers re-render with new identity
```

### Actor switch health (audited 2026-04-09)

- 59 `useIdentity()` consumers — all healthy, zero stale patterns
- `useActorConsistencyCheck` guards on feed, booking, reviews, profile screens
- `FEED_VIEWER_SYNC` event logging on every identity change
- See `logan/VCSM_ACTOR_SWITCH_PIPELINE.md` for full consumer audit

---

## 7. VCSM Integration Example

### Setup (apps/VCSM/src/features/identity/setup.js)

```javascript
import { configureIdentityEngine } from '@identity'
import { supabase } from '@/services/supabase/supabaseClient'
import { createVcsmAppContextResolver } from './resolvers/vcsmIdentity.resolver'

export function setupVcsmIdentityEngine() {
  configureIdentityEngine({
    supabaseClient: supabase,
    resolveAppContext: createVcsmAppContextResolver(supabase),
    debugReporter({ step, phase, status, message, payload, error }) {
      // app-owned debug instrumentation
    },
  })
}
```

### Resolver (apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js)

```javascript
export function createVcsmAppContextResolver(supabase) {
  return async function resolveVcsmAppContext({ userAppAccountId, userId }) {
    // Query platform actor links filtered by vc actor source
    const { data: links } = await supabase
      .schema('platform')
      .from('user_app_actor_links')
      .select('id, user_app_account_id, app_id, actor_source, actor_id, actor_kind, is_primary, is_switchable, status, display_name, avatar_url, meta')
      .eq('user_app_account_id', userAppAccountId)
      .eq('actor_source', 'vc')
      .eq('status', 'active')

    return {
      actorLinks: links ?? [],
      roleKeys: [],             // VCSM doesn't use LMS roles
      capabilityKeys: [],
      isSuspended: false,
      defaultDestination: '/feed',
    }
  }
}
```

### Context provider (apps/VCSM/src/state/identity/identityContext.jsx)

Wraps engine output into the app-level `useIdentity()` hook:
- Calls `resolveAuthenticatedContext({ appKey: 'vcsm' })`
- Maps `ctx.activeActor` to the VCSM identity shape
- Hydrates with vc.* actor data (display_name, avatar, vport info)
- Exposes `{ identity, loading, switchActor }`

### Startup (apps/VCSM/src/main.jsx)

```javascript
import { setupVcsmIdentityEngine } from '@/features/identity/setup'
setupVcsmIdentityEngine()
// then render app
```

---

## 8. Wentrex Integration Example

### Setup (apps/wentrex/src/features/identity/setup.js)

```javascript
import { configureIdentityEngine } from '@identity'
import { supabase } from '@/lib/supabase'
import { createWentrexAppContextResolver } from './resolvers/wentrexIdentity.resolver'

export function setupWentrexIdentityEngine() {
  configureIdentityEngine({
    supabaseClient: supabase,
    resolveAppContext: createWentrexAppContextResolver(supabase),
  })
}
```

### Resolver (apps/wentrex/src/features/identity/resolvers/wentrexIdentity.resolver.js)

```javascript
export function createWentrexAppContextResolver(supabase) {
  return async function resolveWentrexAppContext({ userAppAccountId, userId }) {
    // Get platform actor link
    const { data: links } = await supabase
      .schema('platform')
      .from('user_app_actor_links')
      .select('...')
      .eq('user_app_account_id', userAppAccountId)
      .eq('actor_source', 'learning')
      .limit(1)

    const link = links?.[0] ?? null
    const actorId = link?.actor_id ?? null

    // Derive roles from learning.* schema
    const roleKeys = await deriveWentrexRoleKeys(supabase, actorId)

    // Check access gate
    const isSuspended = await checkWentrexAccessGate(supabase, actorId)

    return {
      actorLinks: links ?? [],
      roleKeys,                        // e.g. ['admin', 'teacher']
      capabilityKeys: [],
      isSuspended,
      defaultDestination: wentrexDestinationFromRoleKeys(roleKeys),
    }
  }
}
```

### Context provider (apps/wentrex/src/features/identity/WentrexIdentityContext.jsx)

- Calls `resolveAuthenticatedContext({ appKey: 'wentrex' })`
- Maps to `useWentrexIdentity()` hook
- Provides `{ loading, context, error }` and lightweight `useWentrexActorId()`

---

## 9. VCSM Engine-Backed Status

### Current state (confirmed 2026-04-09)

VCSM **IS engine-backed**. `setupVcsmIdentityEngine()` is called in `main.jsx` line 14 before render. The identity engine resolves the full context on login and actor switch.

```javascript
// apps/VCSM/src/main.jsx
setupVcsmIdentityEngine()   // ← active, called before render
setupVcsmHydration()
setupVcsmChatEngine()
```

### What is engine-backed

- `resolveAuthenticatedContext({ appKey: 'vcsm' })` — called on boot and actor switch
- `switchActiveActor({ userAppAccountId, actorLinkId })` — called during actor switch
- `finalizeAccountState()` — called for bootstrap self-heal
- App resolver (`vcsmIdentity.resolver.js`) queries `platform.user_app_actor_links` filtered by `actor_source='vc'`
- Debug reporter wired via `debugReporter` config

### What remains app-owned (correct location)

- `hydrateIdentityActor()` in `identity.controller.js` — enriches with vc.* data (profiles, vports)
- `identityContext.jsx` — React provider wrapping engine output into `useIdentity()` hook
- `ensureVcsmPlatformBootstrap()` — self-heal RPC for missing platform rows
- `IdentitySwitcher.jsx` — UI trigger for actor switching

### Known issue: switchActor race condition

`switchActor()` in `identityContext.jsx` lacks a version guard. During rapid switches (A→B→C), earlier async results can overwrite later ones. The boot-time resolve path has `_resolveVersion` protection but the switch path does not. Minimal fix: add `_switchVersion` counter (~5 lines). See `logan/VCSM_ACTOR_SWITCH_PIPELINE.md` for full analysis.

### Remaining migration cleanup (optional)

- `features/identity/dal/platformIdentity.read.dal.js` — duplicates engine DAL reads, can be deleted
- Some direct platform reads in `identity.controller.js` could be replaced with engine service calls

---

## 10. Contract and Guardrail Checklist

### Engine contract (CONTRACT.md)

- [x] Public API is frozen and documented
- [x] Schema boundary is explicit (platform.* only)
- [x] Forbidden dependencies are listed
- [x] DI contract shape is documented
- [x] Output shape (AuthenticatedContext) is documented
- [x] Change policy is defined

### Boundary protections (BOUNDARY.md)

- [x] Forbidden imports listed (apps/, engines/chat/, shared/)
- [x] Forbidden schema references listed (vc.*, learning.*, chat.*)
- [x] Forbidden naming patterns listed (VCSM, Wentrex, etc.)
- [x] Forbidden patterns documented (app resolvers inside engine, appKey conditionals)
- [x] DI injection points enumerated
- [x] Code review checklist provided
- [x] ESLint no-restricted-imports recommendation provided
- [x] "What belongs where" table provided
- [x] Regression detection signals listed

### Anti-leak verification

- [x] No files in `engines/identity/src/resolvers/` (directory removed)
- [x] No app-named exports in `engines/identity/src/adapters/index.js`
- [x] No `.schema("vc")` or `.schema("learning")` in any engine DAL file
- [x] No imports from `apps/` in any engine file
- [x] No React imports in any engine file
- [x] No conditional branching on appKey in engine controllers

### Documentation

- [x] CONTRACT.md — public API and schema boundary
- [x] BOUNDARY.md — anti-leak rules and review checklist
- [x] CLAUDE.md — AI scope rules
- [x] engines.identity.boundary-audit.md — audit trail with resolved violations
- [x] This file — full architecture reference
