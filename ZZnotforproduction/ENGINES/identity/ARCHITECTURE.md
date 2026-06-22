# ARCHITECTURE — engines/identity

**Last ARCHITECT Run:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001
**Status:** COMPLETE
**Independence:** FULLY INDEPENDENT

---

## Engine Purpose

Shared domain engine for authenticated user context resolution. The single source of truth for session identity, app access, account status, actor selection, roles, and capabilities. Framework-agnostic (no React). All dependencies injected at startup. Consumed by both VCSM and Wentrex.

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/identity/`

## Public API Alias

Imported directly from `engines/identity` — both VCSM and Wentrex configure and consume this engine.

## DI Configuration

| App | File |
|-----|------|
| VCSM | `apps/VCSM/src/features/identity/setup.js` |
| Wentrex | `apps/wentrex/src/features/identity/setup.js` |

Injection points: `supabaseClient` (required), `debugReporter`, `enrichActorLinks`, `resolveAppContext` (all optional)

## Layer Structure

```
config.js         — dependency injection (no freeze guard)
events.js         — domain event emitter (6 events)
resolveTrace.js   — structured debug trace utility
types/index.js    — JSDoc domain types (no runtime code)
dal/              — 11 DAL files, platform schema exclusively + supabase.auth.*
model/            — 6 pure row mappers
services/         — 7 domain services (session, access, account, actor, roles, capabilities, destination)
controller/       — 3 controllers (resolveAuthenticatedContext, switchActiveActor, logoutCleanup)
adapters/         — public API surface (15 exported symbols)
```

## DB Access

Platform schema exclusively. No vc, vport, or learning schema queries inside the engine.
App-specific schema queries delegated to `enrichActorLinks` and `resolveAppContext` injectors.

| Table | Access |
|-------|--------|
| platform.apps | READ |
| platform.user_app_access | READ |
| platform.user_app_accounts + v_user_app_context | READ |
| platform.user_app_actor_links | READ/WRITE |
| platform.user_app_preferences | READ/WRITE |
| platform.app_roles, user_app_account_roles, role_capabilities | READ |
| platform.capabilities, user_capabilities | READ |
| platform.user_app_state | READ/WRITE |
| supabase.auth.* | getUser (network), getSession (cached), signOut, onAuthStateChange |

## Resolution Pipeline

8-step sequential/parallel chain with 2-minute in-memory cache:
```
1. Session (network-verified getUser)
2. App lookup (platform.apps)
3. Access gate (platform.user_app_access)
4. Account (platform.v_user_app_context)
5. State + Preferences [parallel]
6. Actors + Roles + Capabilities [parallel, or via resolveAppContext injector]
7. Active actor selection (prefs → state → primary → first)
8. Context build + cache + login record + event emit
```

## App Consumers

| App | Files | Role |
|-----|-------|------|
| VCSM | 6 files (identity.controller.js, switchActor.controller.js, identityContext.jsx, identityEngineQuery.js, identitySelfHeal.controller.js, setup.js) | Primary consumer |
| Wentrex | 4 files (WentrexIdentityContext.jsx, provisionWentrexIdentity.controller.js, setup.js, useWentrexIdentity.js) | Secondary consumer; uses resolveAppContext injector for learning schema |

## Critical Architecture Gaps

- **No DI freeze guard** — `configureIdentityEngine()` can be called multiple times (unlike booking engine's ELEK-007 pattern). A rogue call after startup could swap the supabaseClient.
- **App resolver output not validated** — `resolveAppContext` injector returns roleKeys/capabilityKeys with no engine-level schema check.
- **BEHAVIOR.md MISSING** — Blue Team blocked for BOTH apps.
- **SECURITY.md MISSING** — VENOM/ELEKTRA blocked.
- **Zero tests** — Foundation layer for both apps with no test coverage.

## Full Report

`ZZnotforproduction/ENGINES/identity/outputs/2026/06/05/ARCHITECT/engine.identity.architecture.md`
