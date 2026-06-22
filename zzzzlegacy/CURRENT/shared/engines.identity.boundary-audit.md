# Identity Engine Boundary Audit

**Date:** 2026-04-05
**Source:** Real code inspection of engine core, both app adapters, and startup wiring

---

## 1. Engine Contract Audit

### Public API (from `engines/identity/src/adapters/index.js`)
- `configureIdentityEngine(config)` — DI setup
- `resolveAuthenticatedContext({ appKey, skipLoginRecord })` — full context resolution
- `switchActiveActor({ userAppAccountId, actorLinkId })` — change active actor
- `logoutCleanup()` — sign out
- 7 granular services (session, access, account, actors, roles, capabilities, destination)
- `finalizeAccountState({ userAppAccountId, actorLinkId })` — bootstrap self-heal
- `onAuthStateChange(callback)` — auth events
- `EVENTS`, `onIdentityEvent` — domain events

### Forbidden Dependencies (from CONTRACT.md)
- No imports from `apps/`
- No imports from `engines/chat/`
- No `learning.*` schema queries
- No `vc.*` schema queries
- No app-specific role interpretation

### Isolation Model
- Engine reads/writes `platform.*` only
- Apps inject resolvers via `configureIdentityEngine({ resolveAppContext })`
- App resolvers handle domain-specific tables (vc.*, learning.*)
- Engine returns `AuthenticatedContext` — apps interpret it

---

## 2. Engine Isolation Findings

**Re-audited: 2026-04-09**

| File | Issue | Severity |
|------|-------|----------|
| `src/resolvers/` directory | **RESOLVED** — removed (was: vcsmIdentity.resolver.js querying vc.actors) | **Fixed** |
| `src/adapters/index.js` | **RESOLVED** — no app-named exports remain (was: createVcsmActorEnricher) | **Fixed** |
| `src/config.js` lines 19, 25 | Comments mention "vc.actors", "learning.actors" as examples | **Clean** — comments only, no code |
| `src/services/actorService.js` line 27 | Comment mentions "vc.actors" | **Clean** — comment only |
| All engine files | Zero app-specific queries | **Clean** |
| Engine → apps/ imports | None found | **Clean** |
| Engine → engines/chat/ imports | None found | **Clean** |

### Engine Isolation Judgment
**Fully isolated.** Previous contract violations (vcsmIdentity.resolver.js, createVcsmActorEnricher export) have been resolved. The resolvers/ directory has been removed. All engine code is app-agnostic. Boundary protections documented in BOUNDARY.md.

---

## 3. Wentrex Engine Usage Audit

### Startup Wiring
- **File:** `apps/wentrex/src/main.jsx` line 10
- **Call:** `setupWentrexIdentityEngine()` — **YES, called before render**
- **Setup file:** `apps/wentrex/src/features/identity/setup.js`
- **Configures:** `configureIdentityEngine({ supabaseClient, resolveAppContext: createWentrexAppContextResolver(supabase) })`

### Login/Session Flow
- **File:** `apps/wentrex/src/features/identity/WentrexIdentityContext.jsx`
- **On SIGNED_IN:** Calls `provisionWentrexIdentity()` → `resolveAuthenticatedContext({ appKey: 'wentrex' })`
- **On INITIAL_SESSION:** Calls `resolveAuthenticatedContext({ appKey: 'wentrex', skipLoginRecord: true })`
- **Self-heal:** If `ACCOUNT_NOT_FOUND` → `provisionWentrexIdentity()` → retry

### Identity Resolution
- **Engine controller:** `resolveAuthenticatedContext` (from `@identity`)
- **App resolver:** `createWentrexAppContextResolver()` (from `features/identity/resolvers/`)
- **Resolver queries:** `platform.user_app_actor_links`, `learning.actor_access`, `learning.organization_memberships`, `learning.parent_student_links`, `learning.course_memberships`
- **Final hook:** `useWentrexIdentity()` → `{ loading, context, error }`

### End-to-End Judgment
**Fully engine-backed.** Identity resolution goes through `resolveAuthenticatedContext`. Platform reads happen inside the engine. App-specific resolver handles learning.* enrichment. No platform DAL bypasses.

### Bypasses
None found. All platform resolution goes through the engine. Learning.* queries are in the app-owned resolver (acceptable adapter logic per contract).

---

## 4. VCSM Engine Usage Audit

### Startup Wiring
- **File:** `apps/VCSM/src/main.jsx`
- **Call:** `setupVcsmIdentityEngine()` — **NOT CALLED. Not imported.**
- **Setup file:** `apps/VCSM/src/features/identity/setup.js` — exists but dead code
- **Result:** Engine is configured but never initialized at runtime

### Login/Session Flow
- **File:** `apps/VCSM/src/state/identity/identityContext.jsx`
- **On user.id change:** Calls `loadDefaultIdentityForUser()` — **NOT engine-backed**
- **Resolution:** Direct platform DAL reads (`dalGetVcsmAppAccount`, `dalListVcActorLinks`, `dalGetVcsmPreferences`)
- **Self-heal:** Queries `vc.actors` directly, then calls `ensureVcsmPlatformBootstrap()`

### Identity Resolution
- **Engine controller:** `resolveAuthenticatedContext` — **NOT CALLED**
- **Platform reads:** Via app DALs in `features/identity/dal/platformIdentity.read.dal.js` (duplicates engine logic)
- **Hydration:** Via `identity.controller.js` → `hydrateIdentityActor()` (vc.* enrichment)
- **Final hook:** `useIdentity()` → `{ identity, loading, switchActor }`

### End-to-End Judgment
**Not engine-backed.** Engine scaffold exists (setup.js, resolver stub) but is never initialized. All platform resolution happens through app-local DALs that duplicate engine services. The app is platform-first but engine-absent.

### Migration Status
**Prepared but not migrated.** The following exist but are not wired:
- `features/identity/setup.js` — `configureIdentityEngine()` call ready
- `features/identity/resolvers/vcsmIdentity.resolver.js` — resolver stub with `createVcsmAppContextResolver()`
- `@identity` Vite alias — resolves to `engines/identity/index.js`

Missing pieces to complete migration:
1. Call `setupVcsmIdentityEngine()` in `main.jsx`
2. Replace `loadDefaultIdentityForUser()` with `resolveAuthenticatedContext({ appKey: 'vcsm' })`
3. Keep `hydrateIdentityActor()` as app-specific enrichment layer
4. Remove direct platform DAL reads from identity.controller.js

### Exact Bypass Points

| File | Function | What it bypasses | Acceptable? |
|------|----------|-----------------|-------------|
| `state/identity/identity.controller.js` | `loadDefaultIdentityForUser()` | Reads `platform.user_app_accounts`, `platform.user_app_actor_links`, `platform.user_app_preferences` directly instead of through engine | **Migration gap** — engine does this already |
| `state/identity/identity.controller.js` | `loadOwnedActorChoices()` | Same direct platform reads | **Migration gap** |
| `state/identity/identityContext.jsx` | Self-heal effect | Queries `vc.actors` directly + calls `ensureVcsmPlatformBootstrap()` | **Acceptable temporary** — self-heal needs actorId before engine can resolve |
| `features/identity/dal/platformIdentity.read.dal.js` | All functions | Duplicate engine DAL functionality | **Migration gap** — will be unnecessary once engine is wired |

---

## 5. Contract Compliance Comparison

### Wentrex
- **Respects contract?** YES
- **Evidence:** Uses `configureIdentityEngine()` at startup, `resolveAuthenticatedContext()` for resolution, app-owned resolver for learning.* enrichment
- **Violations:** None
- **Acceptable adapter logic:** Wentrex resolver queries learning.* tables — this is the intended adapter pattern

### VCSM
- **Respects contract?** PARTIALLY
- **Evidence:** Has `@identity` alias and setup.js file, but never calls the engine. All platform resolution duplicated in app DALs.
- **Violations:** Not a violation per se — VCSM simply doesn't use the engine yet. The engine contract allows apps to exist without using it.
- **Acceptable temporary logic:** Direct platform DAL reads are acceptable during migration. They don't break the engine — they just duplicate it.

### Engine Core
- **Contract respected internally?** MOSTLY
- **Evidence:** All engine files query `platform.*` only. Comments reference app schemas but code doesn't.
- **Violation:** `vcsmIdentity.resolver.js` queries `vc.actors` from inside the engine (should be in apps/VCSM)

---

## 6. Migration State

### Wentrex
- **Status:** FULLY MIGRATED
- **Why:** Engine is initialized at startup, all identity resolution goes through `resolveAuthenticatedContext`, app resolver handles domain enrichment, no platform DAL bypasses
- **Missing pieces:** None for core identity. Edge function provisioning (create-student) could benefit from atomic RPC wrapping.

### VCSM
- **Status:** PREPARED BUT NOT MIGRATED
- **Why:** Engine scaffold exists (setup.js, resolver, alias) but `setupVcsmIdentityEngine()` is never called. All runtime identity resolution uses app-local DALs that duplicate engine services. Platform provisioning works via RPC. Identity is platform-first but engine-absent.
- **Missing pieces:**
  1. Call `setupVcsmIdentityEngine()` in `main.jsx`
  2. Replace `loadDefaultIdentityForUser` with engine's `resolveAuthenticatedContext`
  3. Keep `hydrateIdentityActor` for vc.* enrichment
  4. Remove `platformIdentity.read.dal.js` (engine handles those reads)
  5. Move `vcsmIdentity.resolver.js` out of engine into app

---

## 7. End-to-End Engine Paths

### Wentrex
| Flow | Engine-backed? |
|------|---------------|
| Signup through engine? | No — admin-provisioned via edge functions, platform rows via self-heal on first login |
| Login through engine? | **Yes** — `resolveAuthenticatedContext({ appKey: 'wentrex' })` |
| Hydration through engine? | **Yes** — engine provides actor links, app resolver provides role enrichment |
| Logout coupled to engine? | Partially — `logoutCleanup()` available but WentrexIdentityContext clears state directly |

### VCSM
| Flow | Engine-backed? |
|------|---------------|
| Signup through engine? | **No** — provisioning via RPC, but engine not used for resolution |
| Login through engine? | **No** — `loadDefaultIdentityForUser()` reads platform DALs directly |
| Hydration through engine? | **No** — app-local `hydrateIdentityActor()` with direct vc.* reads |
| Logout coupled to engine? | **No** — `AuthProvider.logout()` handles it independently |

---

## 8. Top Coupling Findings

| # | File | Issue | Severity |
|---|------|-------|----------|
| 1 | `engines/identity/src/resolvers/` | **RESOLVED** — directory removed, resolver files moved to apps/ | ~~Contract violation~~ Fixed |
| 2 | `engines/identity/src/adapters/index.js` | **RESOLVED** — VCSM-named export removed | ~~Minor leak~~ Fixed |
| 3 | `apps/VCSM/src/features/identity/dal/platformIdentity.read.dal.js` | Duplicates engine's platform DAL reads | Migration gap |
| 4 | `apps/VCSM/src/state/identity/identity.controller.js` | Platform resolution without engine | Migration gap |
| 5 | `apps/VCSM/src/main.jsx` | `setupVcsmIdentityEngine()` not called | Migration incomplete |

---

## 9. Final Judgment

- **Is the engine isolated?** Mostly — one known violation (`vcsmIdentity.resolver.js`), tagged for migration
- **Are we respecting the contract?** Wentrex: yes. VCSM: partially (doesn't use the engine, but doesn't break it)
- **Is Wentrex end-to-end on the engine?** **Yes** — fully engine-backed for login and identity resolution
- **Is VCSM end-to-end on the engine?** **No** — platform-first but engine-absent. Scaffold exists, never wired.
- **Is VCSM already migrated?** **No** — prepared but not migrated. Setup file and resolver exist as dead code.

**Wentrex identity state:** Fully engine-backed. Identity resolution, actor selection, and role derivation all go through `engines/identity` with a Wentrex-owned resolver for learning.* enrichment.

**VCSM identity state:** Platform-first, engine-absent. Reads platform tables directly via app DALs. Engine scaffold exists but `setupVcsmIdentityEngine()` is never called. One call in `main.jsx` + one controller swap would complete the migration.

**Top 10 files for identity migration work:**
1. `apps/VCSM/src/main.jsx` — add `setupVcsmIdentityEngine()` call
2. `apps/VCSM/src/features/identity/setup.js` — already ready, just needs to be imported
3. `apps/VCSM/src/state/identity/identity.controller.js` — swap to `resolveAuthenticatedContext`
4. `apps/VCSM/src/state/identity/identityContext.jsx` — restructure around engine
5. `apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js` — fill with real resolver
6. `engines/identity/src/resolvers/vcsmIdentity.resolver.js` — move to apps/VCSM, delete from engine
7. `engines/identity/src/adapters/index.js` — remove `createVcsmActorEnricher` export
8. `apps/VCSM/src/features/identity/dal/platformIdentity.read.dal.js` — remove after engine wired
9. `engines/identity/src/controller/resolveAuthenticatedContext.controller.js` — understand engine flow
10. `apps/wentrex/src/features/identity/WentrexIdentityContext.jsx` — reference pattern for VCSM

**Safest next step for VCSM:** Add `import { setupVcsmIdentityEngine } from '@/features/identity/setup'` and call `setupVcsmIdentityEngine()` in `main.jsx` before render. This enables the engine without changing any resolution logic — the engine is configured but not yet called by the identity controller.

**Safest next step for Wentrex:** Move `vcsmIdentity.resolver.js` out of the engine into `apps/VCSM/` and remove the `createVcsmActorEnricher` export from the engine public API. This eliminates the last contract violation.
