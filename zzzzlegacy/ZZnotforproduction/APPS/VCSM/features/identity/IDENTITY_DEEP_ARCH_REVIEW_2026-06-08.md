# IDENTITY FEATURE — DEEP ARCHITECTURAL REVIEW
**Date:** 2026-06-08
**Status:** FAIL
**Compliance Score:** 42 / 100
**Risk Score:** HIGH
**Highest-Risk Issue:** `useIdentity()` surfaces `blockedVport` (authorization state) and the core identity implementation is split between two unrelated directories, bypassing the entire adapter boundary system.

---

## A. EXECUTIVE SUMMARY

The identity feature **fails** architectural compliance on multiple dimensions. The review uncovered 20 distinct violations, classified as: 5 CRITICAL, 7 HIGH, 6 MEDIUM, 2 LOW.

The two structural problems that drive all other violations are:

1. **Split Implementation** — The actual identity implementation (context, model, controller, DAL, hooks, Zustand store, queries) lives in `src/state/identity/` — outside the feature folder. The declared feature folder `src/features/identity/` is only a thin DI bootstrap plus a leaky adapter shell. This makes the adapter boundary meaningless.

2. **Identity Surface Breach** — `useIdentity()` returns eight fields. Only one (`identity: { actorId, kind }`) complies with §1.3. The others — especially `blockedVport`, `switchActor`, `availableActors`, and `setIdentity` — violate the identity surface rule and the owner meaning rule (§1.4).

---

## B. IDENTITY ARCHITECTURE DIAGRAM

```
                    ┌──────────────────────────────────────────────────────────────┐
                    │   DECLARED FEATURE (features/identity/) — 10 files           │
                    │                                                              │
                    │  setup.js → vcsmIdentity.resolver.js → configureIdentityEngine│
                    │  adapters/identity.adapter.js                                │
                    │  adapters/identityOps.adapter.js ← EXPORTS CONTROLLERS ❌   │
                    │  controllers/ensureVcsmPlatformBootstrap.controller.js       │
                    │  controllers/refreshActorDirectory.controller.js ← STUB ❌  │
                    │  dal/provision.rpc.dal.js                                   │
                    │  dal/refreshActorDirectory.dal.js                           │
                    │  hooks/useActiveActorState.js                               │
                    │  hooks/useIdentityOps.js                                    │
                    └──────────────────────────────────────────────────────────────┘
                              ↕ adapter re-exports reach outside feature ❌
                    ┌──────────────────────────────────────────────────────────────┐
                    │   REAL IMPLEMENTATION (state/identity/) — 15 files ❌        │
                    │                                                              │
                    │  identityContext.jsx        ← IdentityProvider, useIdentity │
                    │  identity.controller.js     ← 339 lines (EXCEEDS LIMIT)     │
                    │  identity.model.js          ← pure mapping functions        │
                    │  identity.read.dal.js       ← actor_owners lookup ❌        │
                    │  identitySelectors.js       ← canCitizenBook() ❌          │
                    │  identitySelection.store.js ← Zustand store                │
                    │  identitySelectors.js                                       │
                    │  identitySelfHeal.controller.js                             │
                    │  identityResolutionSelfHeal.helper.js                       │
                    │  identityStorage.js                                         │
                    │  useIdentityResolutionEffect.hook.js ← 305 lines ❌        │
                    │  identitySwitcher.jsx       ← Component calls controller ❌ │
                    │  IdentityDebugger.jsx       ← Wrong location ❌            │
                    │  controller/switchActor.controller.js                       │
                    │  queries/identityEngineQuery.js                             │
                    └──────────────────────────────────────────────────────────────┘
                                        ↑
                    External consumers import state/identity/ internals directly ❌
                    (chat, vportDashboard, AuthProvider, hydration, profiles)
```

---

## C. FOLDER MAP

```
src/features/identity/           (DECLARED FEATURE — 10 files)
├── adapters/
│   ├── identity.adapter.js        (7 lines)
│   └── identityOps.adapter.js     (2 lines)
├── controllers/
│   ├── ensureVcsmPlatformBootstrap.controller.js  (52 lines)
│   └── refreshActorDirectory.controller.js        (6 lines) ← STUB
├── dal/
│   ├── provision.rpc.dal.js       (43 lines)
│   └── refreshActorDirectory.dal.js (61 lines)
├── hooks/
│   ├── useActiveActorState.js     (37 lines)
│   └── useIdentityOps.js          (6 lines)
├── resolvers/
│   └── vcsmIdentity.resolver.js   (148 lines)
└── setup.js                       (45 lines)

src/state/identity/              (REAL IMPLEMENTATION — 15 files) ← WRONG LOCATION
├── controller/
│   └── switchActor.controller.js  (253 lines)
├── queries/
│   └── identityEngineQuery.js     (52 lines)
├── IdentityDebugger.jsx           (83 lines) ← WRONG LOCATION
├── identity.controller.inflight.js (18 lines)
├── identity.controller.js         (339 lines) ← EXCEEDS 300 LIMIT
├── identity.model.js              (78 lines)
├── identity.read.dal.js           (169 lines)
├── identityContext.jsx            (211 lines)
├── identityResolutionSelfHeal.helper.js (42 lines)
├── identitySelection.store.js     (11 lines)
├── identitySelectors.js           (18 lines)
├── identitySelfHeal.controller.js (88 lines)
├── identityStorage.js             (53 lines)
├── identitySwitcher.jsx           (54 lines)
└── useIdentityResolutionEffect.hook.js (305 lines) ← EXCEEDS 300 LIMIT

TOTAL: 25 files, 1,869 lines across both directories
```

---

## D. MODULE MAP

| Module | Owner | Layer Files | Notes |
|---|---|---|---|
| DI Bootstrap | `features/identity/setup.js` | Resolver | Correct pattern |
| App Context Resolver | `features/identity/resolvers/` | Resolver | Correct pattern |
| Platform Bootstrap | `features/identity/controllers/ensure*` | Controller | Correct |
| Actor Directory Refresh | `features/identity/dal/refresh*` | DAL | Functions correct; controller is stub |
| Identity Context | `state/identity/identityContext.jsx` | Hook/Context | Outside feature folder |
| Identity Resolution | `state/identity/identity.controller.js` | Controller | Outside feature folder, oversize |
| Actor Model Mapping | `state/identity/identity.model.js` | Model | Outside feature folder |
| Identity DAL | `state/identity/identity.read.dal.js` | DAL | Outside feature folder; contains actor_owners |
| Actor Switching | `state/identity/controller/switchActor.controller.js` | Controller | Outside feature folder |
| Zustand Store | `state/identity/identitySelection.store.js` | State | Outside feature folder |
| Identity Selectors | `state/identity/identitySelectors.js` | Utility | Contains booking permission |
| Self-Heal | `state/identity/identitySelfHeal.controller.js` | Controller | Uses profileId lookup |
| localStorage Persistence | `state/identity/identityStorage.js` | Utility | Correct function |
| React Query Bridge | `state/identity/queries/identityEngineQuery.js` | Query | Outside feature folder |
| Actor Switcher UI | `state/identity/identitySwitcher.jsx` | Component | Calls controller directly |

---

## E. IDENTITY CONTRACT VIOLATIONS

### E1. Canonical Identity Surface — VIOLATED (§1.3)

**Contract:** `useIdentity()` must only expose `{ actorId, kind }`.

**Reality:** `useIdentity()` returns the full IdentityContext value:

```js
// identityContext.jsx line 187-197
{
  identity,              // ✅ { actorId, kind } — correct
  loading,               // ⚠️ infrastructure — tolerable
  identityLoading: loading, // ⚠️ duplicate of loading
  setIdentity: setIdentityCompat, // ❌ exposes identity mutation
  switchActor,           // ❌ actor switching is business logic
  availableActors,       // ❌ full actor link list — not part of identity surface
  refreshAvailableActors, // ❌ management operation
  blockedVport,          // ❌ CRITICAL — authorization state
}
```

`blockedVport` is computed from `isBlockedVportIdentity(identityDetails)` which evaluates `isDeleted`, `isVoid`, `isActive` — these are authorization status checks. Identity is answering "can this actor operate?" which is forbidden.

### E2. Owner Meaning Rule — VIOLATED (§1.4)

**Contract:** Identity must never determine "Can actor do this?" It only determines "Who is actor?"

**Violations:**

- `isBlockedVportIdentity()` in `identity.model.js` — evaluates actor operational status
- `blockedVport` surfaced through `useIdentity()` — auto-switch on blocked VPORT is authorization management
- `canCitizenBook()` in `identitySelectors.js` — booking permission logic living inside identity

### E3. Actor Identity Model — Partial Violation

**Canonical identity (`actorId = vc.actors.id`):** Correctly enforced in resolver and model.

**Non-canonical identifiers present inside identity:**
- `readUserActorByProfileIdDAL(profileId)` — resolves actor via `profile_id` — non-canonical lookup
- `readActorOwnerUserDAL(actorId)` — queries `vc.actor_owners.user_id` — ownership table inside identity DAL

---

## F. LAYER CONTRACT VIOLATIONS

### F1. DAL Layer — VIOLATED

**File:** `src/state/identity/identity.read.dal.js`

**Violation 1 — Ownership table access:**
```js
// line 144-155
export async function readActorOwnerUserDAL(actorId) {
  ...
  .from("actor_owners")
  .select("user_id")
  ...
}
```
The identity contract explicitly states ownership is resolved through `vc.actor_owners` and that "ownership must never be inferred" from identity lookup. Having this function in the identity DAL places ownership data access inside the identity boundary. Used by `hydration/vcsmActorHydrator.js`.

**Violation 2 — Non-canonical actor resolution:**
```js
// line 157-169
export async function readUserActorByProfileIdDAL(profileId) {
  // looks up vc.actors by profile_id
}
```
Uses `profileId` (a non-canonical identifier) to resolve actor. Contract: "actorId refers exclusively to vc.actors.id. No other identifier may be used as actor identity."

**Violation 3 — Three Supabase schemas in one DAL:**
`identity.read.dal.js` imports and uses `supabase` (default), `vc`, and `vportSchema` — three different schema clients. DAL files should be focused on one schema/domain.

### F2. Controller Layer — VIOLATED

**File:** `src/features/identity/controllers/refreshActorDirectory.controller.js`

```js
// 6 lines total — entire file:
import {
  refreshVcActorDirectory,
  refreshActorDirectoryRow,
} from '@/features/identity/dal/refreshActorDirectory.dal'
export { refreshVcActorDirectory, refreshActorDirectoryRow }
```

This is a dead pass-through. A controller must: "enforce actor rules, enforce ownership, enforce permissions, enforce idempotency." This file does none of that. It is not a controller — it is a re-export alias.

The exported `refreshActorDirectoryRow` is also a dead public export — nothing outside the feature consumes it.

**File:** `src/state/identity/identity.controller.js` — **339 lines — exceeds 300-line limit (§4.1)**

Contains multiple responsibilities: `resolveRealmId`, `hydrateIdentityActor`, `loadIdentityForActorId`, `loadDefaultIdentityForUser`, `loadOwnedActorChoices`. These should be split by behavior.

### F3. Hook Layer — VIOLATED

**File:** `src/state/identity/useIdentityResolutionEffect.hook.js` — **305 lines — exceeds 300-line limit (§4.1)**

**File:** `src/state/identity/identitySwitcher.jsx`

```js
// line 4
import { loadOwnedActorChoices } from "@/state/identity/identity.controller";
```
This JSX component imports and directly calls a controller function inside a `useEffect`. Components must not call controllers directly — §2.5: "Components must not import DAL; call controllers directly."

### F4. Adapter Layer — VIOLATED (§5.3)

**File:** `src/features/identity/adapters/identityOps.adapter.js`

```js
export { ensureVcsmPlatformBootstrap } from '@/features/identity/controllers/ensureVcsmPlatformBootstrap.controller.js'
export { refreshVcActorDirectory } from '@/features/identity/controllers/refreshActorDirectory.controller'
```

**Contract:** "Adapters must never export: DAL, models, controllers." This adapter directly re-exports controller functions. These are business operations, not hooks or components.

**File:** `src/features/identity/adapters/identity.adapter.js`

```js
export { useIdentity, IdentityProvider } from '@/state/identity/identityContext'
```

The adapter is importing from outside its feature folder (`state/identity/` instead of `features/identity/`). This means the adapter boundary is a facade over a different location — the adapter is not actually owning its own surface.

---

## G. RESOLVER AUDIT

### vcsmIdentity.resolver.js — PASS with notes

| Check | Result |
|---|---|
| Lives in `resolvers/` subfolder | ✅ |
| Ends with `.resolver.js` | ✅ |
| Wired exclusively through `setup.js` | ✅ |
| Uses explicit column projections | ✅ |
| No `.select('*')` | ✅ |
| No business rules | ✅ |
| No UI logic | ✅ |
| Not imported at runtime by hooks/components | ✅ |
| No ownership logic | ✅ |

**Notes:**
- Uses `captureVcsmError` in error paths — monitoring is appropriate here
- Returns `actorLinks`, `roleKeys`, `capabilityKeys`, `isSuspended`, `defaultDestination` — these are engine-contract fields, not identity surface fields. Correct.

### setup.js — PASS

Singleton guard (`_configured`) is correct. Single call at startup per engine contract. Clean DI wiring.

---

## H. DEPENDENCY AUDIT

### Inbound (consumers of identity adapter):

**Total consumers: ~93 import sites across the codebase**

Breakdown:
- `useIdentity` — 74 import sites
- `IdentityProvider` — 2 import sites (main.jsx, providers/index.js)
- `useActiveActorState` — 6 import sites
- `useIdentityOps` — 4 import sites
- `ensureVcsmPlatformBootstrap` / `refreshVcActorDirectory` — via identityOps

All inbound imports correctly use `@/features/identity/adapters/identity.adapter` — ADAPTER BOUNDARY IS RESPECTED by the majority of the codebase.

**Exception — Direct imports of state/identity/ internals (bypassing adapter):**

| Importer | Imported Internal | Violation |
|---|---|---|
| `src/app/providers/AuthProvider.jsx` | `state/identity/identityStorage` | Bypasses adapter |
| `src/features/chat/setup.js` | `state/identity/identitySelection.store` | Bypasses adapter |
| `src/features/vportDashboard/dashboard/cards/team/controller/vportTeamAccess.controller.js` | `state/identity/identitySelection.store` | Bypasses adapter |
| `src/features/profiles/.../useVportBookingView.js` | `state/identity/identitySelectors` | Bypasses adapter + permission logic |
| `src/features/hydration/vcsmActorHydrator.js` | `state/identity/identity.read.dal.js` | Cross-feature DAL import |
| `src/features/hydration/vcsmActorHydrator.js` | `state/identity/identity.model.js` | Cross-feature model import |
| `src/state/identity/identitySwitcher.jsx` | `state/identity/identity.controller` | Component calls controller |

### Outbound (identity imports from other features):

`features/identity/` — 0 outbound feature imports ✅

`state/identity/` — outbound imports:
- `@identity` engine — correct (engine alias)
- `@hydration` engine — correct (engine alias)
- `@/features/identity/adapters/identityOps.adapter` — self-reference through adapter (identitySelfHeal.controller.js)
- `@/services/monitoring/vcsmMonitoring` — service import, acceptable
- `@debuggers/identity` — dev-only debugger, acceptable

---

## I. AUTHORIZATION LEAKAGE AUDIT

### Search: `actor_owners` inside identity

**Found:** `state/identity/identity.read.dal.js` line 148

```js
export async function readActorOwnerUserDAL(actorId) {
  ...
  .from("actor_owners")
  .select("user_id")
```

This function is consumed by `hydration/vcsmActorHydrator.js` which uses it to look up the `owner_user_id` of a VPORT actor for hydration context. The function crosses the ownership/identity boundary — ownership data access lives inside the identity DAL.

**Finding severity: HIGH** — ownership lookup in identity layer.

### Search: `blockedVport`, `isBlocked`, `canManage`, `permissions`, `authorized`

**Found:** `identityContext.jsx`

```js
const blockedVport = isBlockedVportIdentity(identityDetails)
// ...
value={{ ..., blockedVport }}
```

`isBlockedVportIdentity` checks `isDeleted`, `isVoid`, `isActive` to determine if the current VPORT actor should be force-switched. This is authorization management logic inside the identity context.

**Finding severity: CRITICAL** — identity is determining actor operational status.

### Search: `canCitizenBook` in `identitySelectors.js`

```js
export const canCitizenBook = (identity) => {
  if (!identity) return false;
  return identity.kind === "user";
};
```

This is a booking permission function inside the identity selectors file. Identity must not determine "can actor book?" That belongs in the booking feature.

**Finding severity: HIGH** — permission decision inside identity boundary.

---

## J. ACTOR RESOLUTION FLOW

```
User authenticates via AuthProvider (auth feature)
    ↓
IdentityProvider.useIdentityResolutionEffect (state/identity/)
    ↓ calls
identity.controller.loadDefaultIdentityForUser
    ↓ calls
@identity engine → resolveAuthenticatedContext (engine)
    ↓ returns
ctx { activeActor, availableActors, userAppAccountId, userId }
    ↓ then
identity.controller: readIdentityActorByIdDAL(ctx.activeActor.actorId)
    ↓ queries
vc.actors { id, kind, profile_id, vport_id, is_void, is_deleted }
    ↓ then
identity.controller: hydrateIdentityActor(actorRow)
    ↓ calls
@hydration → hydrateActor(appKey='vcsm', actorId, context)
    ↓ calls (in hydration feature)
vcsmActorHydrator → reads profile/vport data + maps via identity.model
    ↓ returns
hydratedIdentity { actorId, kind, displayName, username, avatar, realmId, ... }
    ↓
identityContext: commitIdentity(hydratedIdentity)
    ↓ calls
toPublicIdentity → { actorId, kind }  (public surface)
identity.model.isBlockedVportIdentity → blockedVport   ← VIOLATION
useIdentitySelectionStore.setActiveActor(...)           ← Zustand sync

PUBLIC useIdentity() SURFACE:
  identity.actorId ✅
  identity.kind    ✅
  loading          ⚠️ (infrastructure, tolerable)
  setIdentity      ❌ (mutation)
  switchActor      ❌ (business operation)
  availableActors  ❌ (not identity — actor list)
  refreshAvailableActors ❌ (management)
  blockedVport     ❌ (authorization state)
```

**Actor Switching Flow:**

```
Caller invokes useIdentity().switchActor(actorId)
    ↓
identityContext.switchActor
    ↓ calls
switchActorController { actorId, ctx, currentActorId }
    ↓
1. Validate ctx (engine cache)
2. Find actorId in ctx.availableActors
3. engineSwitchActiveActor (platform preference write)
4. hydrateActor (load VCSM domain data)
    ↓ returns
nextIdentity → commitIdentity → public identity updated
```

---

## K. STATE MANAGEMENT REVIEW

### React Context: IdentityContext + IdentityDetailsContext

**Two parallel contexts for one actor:**

- `IdentityContext` — public surface `{ identity: { actorId, kind }, loading, setIdentity, switchActor, availableActors, refreshAvailableActors, blockedVport }`
- `IdentityDetailsContext` — full internal details object (accessed via `useIdentityDetailsDeprecated`)

The `IdentityDetailsContext` is explicitly named "Deprecated" but has no timeline for removal and is actively consumed by `useActiveActorState.js` which is exported through the adapter.

**Duplicate state concerns:**

| Store | Tracks | Overlap |
|---|---|---|
| `IdentityContext.identity` | `{ actorId, kind }` | Public identity |
| `IdentityContext.identityDetails` | Full hydrated actor details | Internal |
| `identitySelection.store.js` (Zustand) | `{ activeActorId, activeActorKind, activeActorLinkId }` | Duplicates identity |

The Zustand `identitySelection.store` duplicates `actorId` and `kind` already held in the React context. This is parallel state with potential staleness risk if `commitIdentity` fails to call `setActiveActor`. The store is consumed directly (bypassing adapter) by `chat/setup.js` and `vportTeamAccess.controller.js`.

**Race condition risk:** `useIdentityResolutionEffect` and `switchActor` both call `commitIdentity` with monotonic version guards. The version-guard pattern is correct, but `explicitSwitchAbortedRef` is set and then checked across two separate async flows — if `switchActor` wins after a background resolution starts but hasn't committed yet, the guards may interact unexpectedly.

**Stale identity risk:** `identityStorage.js` persists `actorId` to localStorage. If a VPORT actor is deleted between sessions, the stored actorId will resolve on the next session and then `isBlockedVportIdentity` triggers auto-switch. The auto-switch path is correct, but the initial load will briefly expose a deleted-VPORT identity before the switch fires.

---

## L. STRUCTURAL INTEGRITY REVIEW

| File | Lines | Status |
|---|---|---|
| `state/identity/identity.controller.js` | 339 | ❌ EXCEEDS 300-line limit |
| `state/identity/useIdentityResolutionEffect.hook.js` | 305 | ❌ EXCEEDS 300-line limit |
| `state/identity/identityContext.jsx` | 211 | ⚠️ Approaching limit |
| `features/identity/resolvers/vcsmIdentity.resolver.js` | 148 | ✅ |
| `state/identity/controller/switchActor.controller.js` | 253 | ⚠️ Approaching limit |
| `state/identity/identity.read.dal.js` | 169 | ✅ |
| All other files | <100 | ✅ |

### Controller Fan-Out Check

`identity.controller.js` collaborators:
1. `identity.read.dal.js` (readActorPrivacyDiagnosticDAL, readIdentityActorByIdDAL, readIdentityActorsByIdsDAL)
2. `@identity` engine (resolveAuthenticatedContext)
3. `@hydration` engine (hydrateActor)
4. `@debuggers/identity`
5. `@/services/monitoring/vcsmMonitoring`
6. `identity.controller.inflight.js`

**Fan-out: 6 collaborators — exceeds limit of 5 (§4.3)**

### Naming Violations

| File | Expected Pattern | Actual | Status |
|---|---|---|---|
| `identityContext.jsx` | Hook or screen | JSX context provider | ⚠️ Non-standard name |
| `identitySwitcher.jsx` | Component or view | Component UI | ⚠️ OK but not declared in feature |
| `identityResolutionSelfHeal.helper.js` | No "helper" convention | Helper util | ⚠️ Non-standard suffix |
| `identity.controller.inflight.js` | Single responsibility | Utility | ⚠️ Non-standard name |
| `refreshActorDirectory.controller.js` | Controller behavior | Re-export stub | ❌ Name lies about responsibility |

### Folder Depth

Maximum depth in `state/identity/`: `controller/switchActor.controller.js` = 2 levels below feature root. ✅

Maximum depth in `features/identity/`: `resolvers/vcsmIdentity.resolver.js` = 2 levels. ✅ No folder depth violations.

### Test Coverage

**Zero tests across all 25 files.** Identity is the most critical platform primitive (41-93 import sites). Zero test coverage is a HIGH governance risk.

---

## M. FILES THAT DO NOT BELONG

| File | Violation | Contract Violated | Recommended Destination |
|---|---|---|---|
| `state/identity/IdentityDebugger.jsx` | Debugger in wrong location | Workspace rule: all debuggers in `ZZnotforproduction/debuggers/` | `ZZnotforproduction/_ACTIVE/debuggers/identity/IdentityDebugger.jsx` |
| `state/identity/identitySelectors.js` | `canCitizenBook` is booking permission logic in identity | §1.4 Owner Meaning Rule | `canCitizenBook` → `features/booking/` or `shared/` |
| `state/identity/identity.read.dal.js` | `readActorOwnerUserDAL` — ownership table in identity DAL | §1.4, §2.1 DAL Contract | Move to a dedicated ownership DAL |
| `features/identity/controllers/refreshActorDirectory.controller.js` | Dead pass-through — not a controller | §2.3 Controller Contract | Delete and import DAL directly where needed |
| The entire `state/identity/` directory | Feature implementation outside feature folder | §5.1 Feature Containment | Migrate all files into `features/identity/` sub-layers |

---

## N. PRIORITY FIX LIST

---

### CRITICAL-1: Feature Implementation Lives Outside Feature Folder

**File:** `src/state/identity/` (entire directory — 15 files)
**Contract:** §5.1 Feature Containment Rule
**Why it's wrong:** The real identity implementation — context, model, controller, DAL, hooks, Zustand store — lives in `state/identity/` outside the feature folder. This makes the `features/identity/` adapter boundary a facade that obscures the true implementation location. All 6 external bypass violations (see H) are symptoms of this root cause.
**Blast radius:** 93 import sites. Massive — must be planned carefully.
**Recommended fix:** Migrate all `state/identity/` files into `features/identity/` sub-layers. The target structure:
```
features/identity/
  adapters/identity.adapter.js     (thin re-export — hooks only)
  adapters/identityOps.adapter.js  (thin re-export — hooks only, not controllers)
  controllers/
    identity.controller.js
    switchActor.controller.js
    identitySelfHeal.controller.js
  dal/
    identity.read.dal.js
    provision.rpc.dal.js
    refreshActorDirectory.dal.js
  hooks/
    useIdentityOps.js
    useActiveActorState.js
    useIdentityResolutionEffect.hook.js
  model/
    identity.model.js
  resolvers/
    vcsmIdentity.resolver.js
  state/
    identityContext.jsx
    identitySelection.store.js
    identityStorage.js
    identitySelectors.js
    queries/identityEngineQuery.js
  setup.js
```
**DB/RLS follow-up:** None for the move itself.

---

### CRITICAL-2: `useIdentity()` Surfaces `blockedVport` — Authorization State Leak

**File:** `src/state/identity/identityContext.jsx` lines 175, 187
**Contract:** §1.3 Identity Surface Rule, §1.4 Owner Meaning Rule
**Why it's wrong:** `blockedVport` is computed by `isBlockedVportIdentity()` which checks `isDeleted`, `isVoid`, `isActive`. Identity is answering "can this actor operate?" not "who is this actor?" Authorization management logic (auto-switch on blocked VPORT) must live in a controller, not in the identity context.
**Blast radius:** All 93 consumers of `useIdentity()`. The consumers that read `blockedVport` must be found and their logic moved to the appropriate feature controller.
**Recommended fix:**
1. Remove `blockedVport` from the context value.
2. Move `isBlockedVportIdentity` check to `switchActor.controller.js` or a VPORT state management controller.
3. The auto-switch logic belongs in the VPORT feature or a dedicated actor-state manager, not in identity.
**DB/RLS follow-up:** None.

---

### CRITICAL-3: `identityOps.adapter.js` Exports Controllers

**File:** `src/features/identity/adapters/identityOps.adapter.js`
**Contract:** §5.3 Adapter Contract — "Adapters must never export: DAL, models, controllers"
**Why it's wrong:** The adapter directly re-exports two controller functions (`ensureVcsmPlatformBootstrap`, `refreshVcActorDirectory`). Controllers are not part of the adapter's permitted export set.
**Blast radius:** 5 consumers — `useIdentityOps.js` (hook), `identitySelfHeal.controller.js`, `vport.core.dal.js`, `AuthOnboarding.js`, `useUpdateVportVisibility.js`.
**Recommended fix:** Wrap the controllers in hooks: `useIdentityOps()` already exists and is the correct boundary. Expose only the hook. Remove direct controller exports from the adapter. Consumers should use `useIdentityOps()` which wraps the controllers correctly.
**DB/RLS follow-up:** None.

---

### CRITICAL-4: `useIdentity()` Exposes Actor List and Business Operations

**File:** `src/state/identity/identityContext.jsx`
**Contract:** §1.3 Identity Surface Rule
**Why it's wrong:** `availableActors`, `setIdentity`, `refreshAvailableActors`, `switchActor` are not part of the identity surface. `availableActors` exposes all actor links — a full platform data set. `setIdentity` is a mutation. `switchActor` is a business operation.
**Blast radius:** All 93 `useIdentity()` consumers. Changing the surface is a large refactor.
**Recommended fix:** Split `useIdentity()` into two hooks:
- `useIdentity()` → `{ identity: { actorId, kind }, loading }` — pure identity surface
- `useActorSwitcher()` → `{ switchActor, availableActors, refreshAvailableActors }` — actor management surface
**DB/RLS follow-up:** None.

---

### CRITICAL-5: `identity.controller.js` — 339 Lines, Exceeds Limit

**File:** `src/state/identity/identity.controller.js` (339 lines)
**Contract:** §4.1 File Size & Decomposition Rule (300-line maximum)
**Why it's wrong:** 5 distinct behaviors in one file: `resolveRealmId`, `hydrateIdentityActor`, `loadIdentityForActorId`, `loadDefaultIdentityForUser`, `loadOwnedActorChoices`.
**Blast radius:** Internal only — imported by identityContext and identitySwitcher.
**Recommended fix:** Split into:
- `resolveIdentity.controller.js` — `loadDefaultIdentityForUser`, `resolveRealmId`
- `loadActorChoices.controller.js` — `loadOwnedActorChoices`
- `hydrateIdentity.controller.js` — `hydrateIdentityActor`, `loadIdentityForActorId`
**DB/RLS follow-up:** None.

---

### HIGH-1: `vport.core.dal.js` Imports Feature Adapter

**File:** `src/features/vport/dal/vport.core.dal.js` line 6
**Contract:** §2.1 DAL Import Boundary Rule — DAL files may only import Supabase clients, schema constants, low-level query utilities
**Why it's wrong:** A DAL file in the `vport` feature imports `refreshVcActorDirectory` from an identity feature adapter. DAL files must not import feature adapters. This couples a data-access layer to a business operation from another feature.
**Blast radius:** `vport.core.dal.js` — any VPORT write that triggers actor directory refresh.
**Recommended fix:** Move `refreshVcActorDirectory` call out of the DAL and into the controller that calls this DAL. The controller is responsible for post-write side effects.
**DB/RLS follow-up:** None.

---

### HIGH-2: `identitySwitcher.jsx` Component Calls Controller Directly

**File:** `src/state/identity/identitySwitcher.jsx` line 3
**Contract:** §2.5 Component Contract — "Components must not call controllers directly"
**Why it's wrong:** `loadOwnedActorChoices` is a controller function. It is imported and called inside a `useEffect` within a JSX component.
**Blast radius:** `identitySwitcher.jsx` only.
**Recommended fix:** Extract `useEffect` + `loadOwnedActorChoices` into a `useActorChoices` hook. Component calls the hook.
**DB/RLS follow-up:** None.

---

### HIGH-3: `readActorOwnerUserDAL` — Ownership Table in Identity DAL

**File:** `src/state/identity/identity.read.dal.js` lines 144-155
**Contract:** §1.4 Owner Meaning Rule — "Identity and ownership are separate concerns"
**Why it's wrong:** `readActorOwnerUserDAL` queries `vc.actor_owners` — an ownership table — from inside the identity DAL. Ownership resolution belongs in the feature that owns the ownership concern (hydration or profiles), not in identity.
**Blast radius:** `hydration/vcsmActorHydrator.js` is the only consumer.
**Recommended fix:** Move `readActorOwnerUserDAL` to the hydration feature's DAL. It belongs to the hydration feature's responsibility to look up owner context during hydration.
**DB/RLS follow-up:** None — no DB changes required.

---

### HIGH-4: `canCitizenBook` in `identitySelectors.js` — Permission Logic in Identity

**File:** `src/state/identity/identitySelectors.js` lines 9-13
**Contract:** §1.4 Owner Meaning Rule — "Identity must never perform permission decisions"
**Why it's wrong:** `canCitizenBook(identity)` evaluates booking eligibility. This is a booking-feature permission, not an identity concern. Its consumer `useVportBookingView.js` also bypasses the adapter to import it directly from `state/identity/`.
**Blast radius:** 1 consumer — `profiles/kinds/vport/screens/booking/hooks/useVportBookingView.js`
**Recommended fix:** Move `canCitizenBook` to `features/booking/` or declare it inline in `useVportBookingView.js` — it's a one-line check (`identity.kind === 'user'`).
**DB/RLS follow-up:** None.

---

### HIGH-5: External Direct Imports of `state/identity/` Internals

**Files:** Listed in Section H (6 files)
**Contract:** §5.2 Cross-Feature Boundary Rule, §5.4 Adapter Import Rule
**Why it's wrong:** `chat/setup.js`, `vportTeamAccess.controller.js`, `AuthProvider.jsx`, `useVportBookingView.js`, `vcsmActorHydrator.js` import from `state/identity/` internals directly, bypassing the adapter boundary.
**Blast radius:** Each of these will require rerouting imports through an adapter or extracting shared primitives.
**Recommended fix:**
- `chat/setup.js` → `useIdentitySelectionStore` should be accessible via a dedicated hook exported from the adapter, OR the Zustand store should be extracted to `shared/`
- `vportTeamAccess.controller.js` → same pattern
- `AuthProvider.jsx` → `clearAllIdentityStorage` should be exported through the adapter
- `useVportBookingView.js` → move `canCitizenBook` to booking feature
- `vcsmActorHydrator.js` → hydration should not reach into identity DAL/model directly
**DB/RLS follow-up:** None.

---

### HIGH-6: `useIdentityResolutionEffect.hook.js` — 305 Lines, Exceeds Limit

**File:** `src/state/identity/useIdentityResolutionEffect.hook.js` (305 lines)
**Contract:** §4.1 File Size & Decomposition Rule (300-line maximum)
**Why it's wrong:** Concentrates self-heal logic, version guards, debug logging, and identity commit in one function.
**Blast radius:** Internal — only imported by `identityContext.jsx`.
**Recommended fix:** Extract self-heal branch into `runIdentitySelfHeal()` helper (already partially done in `identityResolutionSelfHeal.helper.js`). Move debug logging into a separate `identityResolutionDebug.js` utility.
**DB/RLS follow-up:** None.

---

### MEDIUM-1: `hydration` Feature Imports Identity DAL and Model Directly

**File:** `src/features/hydration/vcsmActorHydrator.js` lines 2, 6, 10, 11
**Contract:** §5.2 Cross-Feature Boundary Rule — features may not import another feature's internal files
**Why it's wrong:** The hydration feature imports `readActorOwnerUserDAL`, `readUserActorByProfileIdDAL`, `mapProfileActor`, `mapVportActor` from identity's internal DAL and model. These are cross-feature internal imports — a significant boundary violation.
**Blast radius:** `vcsmActorHydrator.js` — all hydration flows.
**Recommended fix:** Move `readActorOwnerUserDAL` and `readUserActorByProfileIdDAL` to the hydration feature's own DAL. Move `mapProfileActor` and `mapVportActor` to the hydration feature's model (they are used only by hydration).
**DB/RLS follow-up:** None.

---

### MEDIUM-2: `refreshActorDirectory.controller.js` Is a Dead Pass-Through

**File:** `src/features/identity/controllers/refreshActorDirectory.controller.js` (6 lines)
**Contract:** §2.3 Controller Contract — controllers must "enforce actor rules, enforce ownership, enforce idempotency"
**Why it's wrong:** Adds zero value. Just re-exports two DAL functions. The exported `refreshActorDirectoryRow` has no external consumers.
**Blast radius:** `identityOps.adapter.js` and `useIdentityOps.js` consume `refreshVcActorDirectory` through this stub.
**Recommended fix:** Delete the controller stub. Have `identityOps.adapter.js` export a hook that wraps the DAL call directly, or expose via `useIdentityOps()`.
**DB/RLS follow-up:** None.

---

### MEDIUM-3: `readUserActorByProfileIdDAL` Uses Non-Canonical Identifier

**File:** `src/state/identity/identity.read.dal.js` lines 157-169
**Contract:** §1.1 Canonical Identity — "actorId refers exclusively to vc.actors.id. No other identifier may be used as actor identity."
**Why it's wrong:** This function resolves an actor via `profile_id`, which is a non-canonical identifier. It is used by `identitySelfHeal.controller.js` to find the fallback actor during self-heal.
**Blast radius:** Self-heal code path only.
**Recommended fix:** The self-heal lookup is a recovery path — it is explicitly trying to find an actor when the platform link is missing. Document why the non-canonical lookup is needed here as a DB AUDIT NOTE. The function should exist in the hydration feature DAL, not in identity DAL. Contract review required if profileId-based actor lookup is needed outside self-heal.
**DB/RLS follow-up:** DB AUDIT NOTE — RPC `find_actor_by_profile_id` would be safer and more controlled than a direct DAL query. Evaluate whether self-heal should use a SECURITY DEFINER RPC.

---

### MEDIUM-4: `IdentityDebugger.jsx` in Wrong Location

**File:** `src/state/identity/IdentityDebugger.jsx`
**Contract:** Workspace rule — all debuggers must live in `ZZnotforproduction/debuggers/[feature]/`
**Why it's wrong:** Debug component in source directory rather than designated debuggers directory.
**Blast radius:** Development only.
**Recommended fix:** Move to `ZZnotforproduction/_ACTIVE/debuggers/identity/IdentityDebugger.jsx`.
**DB/RLS follow-up:** None.

---

### MEDIUM-5: Identity Feature Contract Document Is Stale

**File:** `ZZnotforproduction/CONTRACTS/App/VCSM/features/identity.md`
**Why it's wrong:** States "9 files" and "0 violations." Reality is 25 files and 20 violations. States "No standard DAL or Controller layer exists in identity" — incorrect, both exist in `state/identity/`. States "TODO: Confirm whether identity/adapters/ exists" — it does.
**Blast radius:** Governance tooling will produce false-clean reports.
**Recommended fix:** Update after the structural violations are resolved. Do not update the document before the code is corrected — the document should describe reality, not aspiration.

---

### MEDIUM-6: `useIdentityDetailsDeprecated` Has No Deprecation Plan

**File:** `src/state/identity/identityContext.jsx` line 209
**Why it's wrong:** Exported as `Deprecated` but actively consumed by `useActiveActorState.js` which is exported through the adapter. The deprecation signal has no timeline and no migration path defined.
**Blast radius:** `useActiveActorState.js` and all its consumers (6 sites).
**Recommended fix:** Either define a migration path (what replaces this?) and open a ticket, or rename to remove the `Deprecated` signal if it is actually the correct API. Current state: signals known debt without resolution.

---

### LOW-1: `useActiveActorState` Exposes Extended Actor State Through Adapter

**File:** `src/features/identity/hooks/useActiveActorState.js`
**Contract:** §1.3 Identity Surface Rule — identity must only expose `actorId`, `kind`
**Why it's wrong:** Exposes `realmId`, `isAdult`, `isVoid`, `isDeleted` through the adapter. These are not part of the canonical identity surface, though the hook documents clearly that they are intentionally extended fields for specific use cases.
**Assessment:** Partial violation. The intent is documented and the hook is explicitly named `useActiveActorState` (not `useIdentity`), which distinguishes it from the canonical identity surface. However, `isDeleted` is borderline — it is an actor status field, not an identity field.
**Recommended fix:** Low urgency. Confirm that `isDeleted` is not being used for authorization decisions in any consumer. If so, document that explicitly in the hook.
**DB/RLS follow-up:** None.

---

### LOW-2: `identity.controller.js` Contains Raw `console.warn` Calls

**File:** `src/state/identity/identity.controller.js` lines 36, 44
**Contract:** Workspace rule — no console.log; debug output must use debugger pattern
**Why it's wrong:** Two `console.warn` calls exist in non-dev-gated branches. These will fire in production.
**Blast radius:** Development/monitoring noise.
**Recommended fix:** Replace with `captureVcsmError` or gate behind `IS_DEV`. Both locations already have proper monitoring paths nearby.
**DB/RLS follow-up:** None.

---

## FEATURE HEALTH METRICS

| Metric | Count | Status |
|---|---|---|
| Total files | 25 | ⚠️ Feature fragmented across 2 directories |
| Controller files | 4 | OK |
| DAL files | 3 | OK |
| Model files | 1 | OK (but misplaced) |
| Hook files | 5 | OK |
| Resolver files | 1 | OK |
| Adapter files | 2 | VIOLATED |
| Test files | 0 | ❌ CRITICAL GAP |
| Files > 300 lines | 2 | ❌ |
| Files > 250 lines | 3 | ⚠️ |
| Average file size | ~75 lines | OK |
| Largest file | 339 lines | ❌ |
| Deepest folder | depth 2 | ✅ |
| Inbound import sites | ~93 | Expected for platform primitive |
| Direct adapter bypass sites | 6 | ❌ |

---

## ARCHITECTURE CLASSIFICATION

**Identity is correctly classified as:** Actor Resolution Feature + Identity Provider

**It is NOT:** Hydration feature, Authorization feature, Actor Registry feature

**Scope creep present:**
- `blockedVport` — authorization state → remove
- `canCitizenBook` — permission decision → move to booking
- `readActorOwnerUserDAL` — ownership data → move to hydration
- Actor switcher UI (`identitySwitcher.jsx`) — should be in shell or a dedicated actor-switcher feature
- Available actors list — actor management, not identity

**What stays:**
- Actor resolution via engine (setup.js + resolver)
- `useIdentity()` returning `{ actorId, kind }`
- Actor switching logic (belongs in identity domain)
- Self-heal bootstrap
- Actor directory refresh

**What moves:**
- `canCitizenBook` → booking feature
- `readActorOwnerUserDAL` → hydration DAL
- `mapProfileActor`, `mapVportActor` → hydration model (they are only used there)
- `IdentityDebugger.jsx` → ZZnotforproduction/debuggers/identity/
- All of `state/identity/` → inside `features/identity/`

**What must never be added:**
- Ownership checks
- Permission evaluation
- Role-based access control
- Feature flags based on actor type (actor.kind-based access rules belong in feature controllers)
- Dashboard scope decisions (belongs in shell or dashboard feature)
