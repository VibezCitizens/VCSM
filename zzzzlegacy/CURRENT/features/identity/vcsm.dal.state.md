# VCSM DAL — `state`

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · `apps/VCSM/src/features/state/dal/`  
_Confidence:_ STATICALLY\_TRACED  

---

## Summary

| Item | Count |
|---|---|
| DAL files | 1 |
| Exported functions | 10 |
| Tables accessed | 6 |
| RPCs called | 0 |
| Risk findings | 0 |

## DAL Files

### `identity.read.dal.js`

**Path:** `state/identity/identity.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readActorOwnerUserDAL` | `read` | `actor_privacy_settings`, `profiles`, `actor_owners`, `actors`, `profile_categories`, `realms` |
| `readActorPrivacyDAL` | `read` | `actor_privacy_settings`, `profiles`, `actor_owners`, `actors`, `profile_categories`, `realms` |
| `readActorPrivacyDiagnosticDAL` | `read` | `actor_privacy_settings`, `profiles`, `actor_owners`, `actors`, `profile_categories`, `realms` |
| `readFallbackRealmDAL` | `read` | `actor_privacy_settings`, `profiles`, `actor_owners`, `actors`, `profile_categories`, `realms` |
| `readIdentityActorByIdDAL` | `read` | `actor_privacy_settings`, `profiles`, `actor_owners`, `actors`, `profile_categories`, `realms` |
| `readIdentityActorsByIdsDAL` | `read` | `actor_privacy_settings`, `profiles`, `actor_owners`, `actors`, `profile_categories`, `realms` |
| `readPreferredRealmByVoidStateDAL` | `read` | `actor_privacy_settings`, `profiles`, `actor_owners`, `actors`, `profile_categories`, `realms` |
| `readProfileIdentityDAL` | `read` | `actor_privacy_settings`, `profiles`, `actor_owners`, `actors`, `profile_categories`, `realms` |
| `readUserActorByProfileIdDAL` | `read` | `actor_privacy_settings`, `profiles`, `actor_owners`, `actors`, `profile_categories`, `realms` |
| `readVportIdentityDAL` | `read` | `actor_privacy_settings`, `profiles`, `actor_owners`, `actors`, `profile_categories`, `realms` |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `actor_owners` | READ | `readActorOwnerUserDAL`, `readActorPrivacyDAL`, `readActorPrivacyDiagnosticDAL`, `readFallbackRealmDAL`, `readIdentityActorByIdDAL`, `readIdentityActorsByIdsDAL`, `readPreferredRealmByVoidStateDAL`, `readProfileIdentityDAL`, `readUserActorByProfileIdDAL`, `readVportIdentityDAL` |
| `actor_privacy_settings` | READ | `readActorOwnerUserDAL`, `readActorPrivacyDAL`, `readActorPrivacyDiagnosticDAL`, `readFallbackRealmDAL`, `readIdentityActorByIdDAL`, `readIdentityActorsByIdsDAL`, `readPreferredRealmByVoidStateDAL`, `readProfileIdentityDAL`, `readUserActorByProfileIdDAL`, `readVportIdentityDAL` |
| `actors` | READ | `readActorOwnerUserDAL`, `readActorPrivacyDAL`, `readActorPrivacyDiagnosticDAL`, `readFallbackRealmDAL`, `readIdentityActorByIdDAL`, `readIdentityActorsByIdsDAL`, `readPreferredRealmByVoidStateDAL`, `readProfileIdentityDAL`, `readUserActorByProfileIdDAL`, `readVportIdentityDAL` |
| `profile_categories` | READ | `readActorOwnerUserDAL`, `readActorPrivacyDAL`, `readActorPrivacyDiagnosticDAL`, `readFallbackRealmDAL`, `readIdentityActorByIdDAL`, `readIdentityActorsByIdsDAL`, `readPreferredRealmByVoidStateDAL`, `readProfileIdentityDAL`, `readUserActorByProfileIdDAL`, `readVportIdentityDAL` |
| `profiles` | READ | `readActorOwnerUserDAL`, `readActorPrivacyDAL`, `readActorPrivacyDiagnosticDAL`, `readFallbackRealmDAL`, `readIdentityActorByIdDAL`, `readIdentityActorsByIdsDAL`, `readPreferredRealmByVoidStateDAL`, `readProfileIdentityDAL`, `readUserActorByProfileIdDAL`, `readVportIdentityDAL` |
| `realms` | READ | `readActorOwnerUserDAL`, `readActorPrivacyDAL`, `readActorPrivacyDiagnosticDAL`, `readFallbackRealmDAL`, `readIdentityActorByIdDAL`, `readIdentityActorsByIdsDAL`, `readPreferredRealmByVoidStateDAL`, `readProfileIdentityDAL`, `readUserActorByProfileIdDAL`, `readVportIdentityDAL` |

---

## Risk Findings

No risk findings for this feature.

---

## Pending Reviews

No pending reviews — feature DAL is clean.

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `identity.read.dal.js`

**Direct callers:**

- `vcsmActorHydrator.js` _Other_
- `identity.controller.js` _Controller_
- `identitySelfHeal.controller.js` _Controller_

**Full call chain to screen:**

```
`identity.read.dal.js` → `identity.controller.js` → `switchActor.controller.js` → `identityContext.jsx` → `VportAdsSettingsScreen.jsx`
```
```
`identity.read.dal.js` → `identity.controller.js` → `switchActor.controller.js` → `identityContext.jsx` → `VportActorMenuFlyerEditorScreen.jsx`
```
```
`identity.read.dal.js` → `identity.controller.js` → `switchActor.controller.js` → `identityContext.jsx` → `BarberTeamRequestsScreen.jsx`
```
```
`identity.read.dal.js` → `identity.controller.js` → `switchActor.controller.js` → `identityContext.jsx` → `VportDashboardBookingHistoryScreen.jsx`
```

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✗ MISSING | — |
| **Controller** | ✗ MISSING | — |
| **Adapter** | ✗ MISSING | — |
| **Service** | ✗ MISSING | — |
| **Hook** | ✗ MISSING | — |
| **Component** | ✗ MISSING | — |
| **View Screen** | ✗ MISSING | — |
| **Final Screen** | ✗ MISSING | — |

### Missing Layers

- 🔴 **Model** — not detected in static scan
- 🔴 **Controller** — not detected in static scan
- 🟡 **Adapter** — not detected in static scan
- 🟡 **Service** — not detected in static scan
- 🟡 **Hook** — not detected in static scan
- 🟡 **Component** — not detected in static scan
- 🟡 **View Screen** — not detected in static scan
- 🟡 **Final Screen** — not detected in static scan

> Missing layers may exist but use naming patterns not detected by static scan, or may be delegated to engines.

---

## Dead Code Audit

_Audited:_ 2026-05-11  
_Method:_ Static import trace — grep across all `.js`/`.jsx` in `apps/VCSM/src/`  
_Auditor:_ ARCHITECT

---

### Verdict: No Confirmed Dead Code — 1 Dev-Only Function + 2 Structural Findings

| Function | Status | Callers |
|---|---|---|
| `readActorOwnerUserDAL` | LIVE | `vcsmActorHydrator.js` |
| `readActorPrivacyDAL` | LIVE | `vcsmActorHydrator.js` (×2) |
| `readActorPrivacyDiagnosticDAL` | LIVE (dev-only, double-gated) | `identity.controller.js` — behind `IS_DEV && VITE_DEBUG_RLS_DIAGNOSTIC === '1'` |
| `readFallbackRealmDAL` | LIVE | `identity.controller.js` |
| `readIdentityActorByIdDAL` | LIVE | `vcsmActorHydrator.js`, `identity.controller.js` |
| `readIdentityActorsByIdsDAL` | LIVE | `identity.controller.js` |
| `readPreferredRealmByVoidStateDAL` | LIVE | `identity.controller.js` |
| `readProfileIdentityDAL` | LIVE | `vcsmActorHydrator.js` |
| `readUserActorByProfileIdDAL` | LIVE — but see finding below | `vcsmActorHydrator.js`, `identitySelfHeal.controller.js` |
| `readVportIdentityDAL` | LIVE | `vcsmActorHydrator.js` |

---

### Finding #1 — `readActorPrivacyDiagnosticDAL` is dev-only, never runs in production

**File:** `state/identity/identity.read.dal.js`  
**Function:** `readActorPrivacyDiagnosticDAL`  
**Classification:** DEV-ONLY DIAGNOSTIC — double-gated, zero production execution

**Evidence:**
In `state/identity/identity.controller.js` the call site is:
```js
if (IS_DEV && import.meta.env.VITE_DEBUG_RLS_DIAGNOSTIC === '1') {
    const privRow = await readActorPrivacyDiagnosticDAL(selectedActorId)
```
- `IS_DEV` is `import.meta.env.DEV` — already strips the code path in production builds
- The additional `VITE_DEBUG_RLS_DIAGNOSTIC === '1'` env var gate means it does not even run in dev unless explicitly opted in
- The controller comment above the gate reads: *"RLS diagnostic: check if actor has a privacy row (can_view_actor depends on it)"*

**Risk:** NONE at runtime — tree-shaken in production by Vite's DEV flag. The function and its import will not be included in the production bundle.  
**Recommended action:** KEEP — this is intentional, well-gated diagnostic tooling. No action required.

---

### Finding #2 — `readUserActorByProfileIdDAL` receives `userId` from both callers — parameter type mismatch

**File:** `state/identity/identity.read.dal.js`  
**Function:** `readUserActorByProfileIdDAL`  
**Classification:** POSSIBLE BUG — parameter named `profileId` but both callers pass a `userId`

**Evidence:**

Function signature and query:
```js
export async function readUserActorByProfileIdDAL(profileId) {
  ...
  .eq("profile_id", profileId)   // filters actors.profile_id
```

Caller 1 — `identitySelfHeal.controller.js`:
```js
export async function findSelfHealActorForUser(userId) {
  const row = await readUserActorByProfileIdDAL(userId);  // passing auth userId
```

Caller 2 — `vcsmActorHydrator.js`:
```js
const ownerActor = await readUserActorByProfileIdDAL(ownerRow.user_id);  // passing actor_owners.user_id
```

**The conflict:** `actors.profile_id` is a FK to `profiles.id` — a profile UUID. Auth user UUIDs (`auth.users.id`) and `actor_owners.user_id` are not the same type. If either caller is passing a raw auth user UUID where a profile UUID is expected, the query will silently return `null` and the self-heal/hydration path will fail silently.

**Risk:** HIGH — `findSelfHealActorForUser` in `identitySelfHeal.controller.js` may always return `null` when called with an auth `userId`, silently defeating the self-heal flow. The function is named "ByProfileId" but the entire caller contract treats it as "ByUserId".

Two possible explanations:
1. The function is **misnamed** — it should be `readUserActorByUserIdDAL` and the filter should be on a user-level column, not `profile_id`
2. `actor_owners.user_id` in the hydrator context **is** a profile UUID despite the column name — which would be a schema naming problem

**Recommended action:** VERIFY — read `actor_owners.user_id` column type against `profiles.id`. If mismatched, this is a silent bug in the self-heal path. If the column is actually a profile ID, rename the column and the function parameter for clarity.  
**Handoffs:** DEADPOOL (root cause trace — is self-heal returning null silently?), VENOM (identity self-heal path with a silent null return is a trust boundary risk), CARNAGE (schema rename if `actor_owners.user_id` is actually a profile reference)

---

### Structural Finding #1 — Architecture Pipeline marks all layers MISSING — inaccurate

**Classification:** DOC INACCURACY — scanner missed controllers outside `features/state/`

**Evidence:**
The pipeline table lists Controller, Hook, Adapter, Service, Component, View Screen, and Final Screen all as MISSING. But the call chain section of the same doc correctly identifies two controllers:
- `state/identity/identity.controller.js`
- `state/identity/identitySelfHeal.controller.js`

The pipeline scanner only searched in `features/state/` and missed files living directly at `state/identity/`. The actual active layers are:

| Layer | Actual Status | Files |
|---|---|---|
| DAL | PRESENT | `state/identity/identity.read.dal.js` |
| Controller | PRESENT (undetected) | `state/identity/identity.controller.js`, `state/identity/identitySelfHeal.controller.js` |
| Hydrator | PRESENT (cross-feature) | `features/hydration/vcsmActorHydrator.js` |

**Recommended action:** Correct the Architecture Pipeline table.  
**Handoffs:** LOGAN (doc correction)

---

### Structural Finding #2 — `vcsmActorHydrator.js` directly imports the state DAL — cross-feature boundary

**File:** `features/hydration/vcsmActorHydrator.js`  
**Classification:** CROSS-FEATURE DAL IMPORT — possible boundary violation

**Evidence:**
```js
import {
  readActorOwnerUserDAL,
  readActorPrivacyDAL,
  readIdentityActorByIdDAL,
  readProfileIdentityDAL,
  readUserActorByProfileIdDAL,
  readVportIdentityDAL,
} from '@/state/identity/identity.read.dal'
```
The `features/hydration/` feature imports 6 functions directly from the `state/identity/` DAL — bypassing any controller or adapter layer. Per the architecture contract, cross-feature access must go through adapters only.

**Risk:** MEDIUM — the hydration feature is tightly coupled to the state DAL. If the identity DAL changes, the hydrator breaks directly. This also means the hydration feature performs its own identity reads in parallel with the identity controller, creating two independent query paths over the same tables.  
**Recommended action:** The hydrator should consume a controller or adapter from `state/identity/`, not the raw DAL.  
**Handoffs:** SENTRY (boundary violation), IRONMAN (confirm intentional or needs adapter)

---

### Audit Summary

| Finding | Classification | Priority |
|---|---|---|
| `readActorPrivacyDiagnosticDAL` — dev-only, double-gated, never runs in production | DEV-ONLY (intentional) | KEEP |
| `readUserActorByProfileIdDAL` — both callers pass `userId`, function filters on `profile_id` | POSSIBLE BUG — silent null in self-heal path | P0 — DEADPOOL trace |
| Architecture Pipeline marks all layers MISSING — controllers exist but outside scan path | DOC INACCURACY | P3 |
| `vcsmActorHydrator.js` imports 6 DAL functions directly from `state/identity/` | CROSS-FEATURE DAL IMPORT | P2 — SENTRY |

**Confirmed dead functions:** 0  
**Dev-only functions (intentional):** 1 (`readActorPrivacyDiagnosticDAL`)  
**Doc function count:** ACCURATE (10 — all referenced)  
**Critical flag:** Self-heal path may silently return `null` if `readUserActorByProfileIdDAL` is receiving an auth `userId` where a `profileId` is expected — needs DEADPOOL verification

---

## Layer Consumer Map

_Audited:_ 2026-05-11  
_Method:_ Static import trace — full upward traversal from DAL through Controller → Model → Hook → Context → Adapter → App Root  
_Auditor:_ ARCHITECT

---

### Important: This DAL Has No Screens

`state/identity/identity.read.dal.js` is infrastructure, not a feature. It does not terminate at screens — it terminates at two separate system endpoints:

1. **`identityContext.jsx`** — the global React context provider mounted at the app root, consumed by every screen that calls `useIdentity()`
2. **`features/hydration/setup.js`** → `main.jsx` — the app bootstrap hydrator that runs once at startup

This means all 40+ screens that read actor identity state are downstream consumers of this DAL, but none of them import it directly.

---

### Architecture Pipeline — Corrected

The original pipeline scan marked all non-DAL layers MISSING because files live under `state/identity/` (not `features/state/`). The actual layers are all present:

| Layer | Actual Status | Files |
|---|---|---|
| DAL | PRESENT | `state/identity/identity.read.dal.js` |
| Model | **PRESENT (undetected by scanner)** | `state/identity/identity.model.js` |
| Controller | **PRESENT (undetected by scanner)** | `state/identity/identity.controller.js`, `state/identity/identitySelfHeal.controller.js`, `state/identity/controller/switchActor.controller.js` |
| Hook | **PRESENT (undetected by scanner)** | `state/identity/useIdentityResolutionEffect.hook.js`, `state/identity/useIdentitySync.js` |
| Component | **PRESENT (undetected by scanner)** | `state/identity/identitySwitcher.jsx` (actor switcher UI), `state/identity/IdentityDebugger.jsx` (dev only) |
| Context Provider | **PRESENT** | `state/identity/identityContext.jsx` |
| Store | **PRESENT** | `state/identity/identitySelection.store.js` (Zustand) |
| Selectors | **PRESENT** | `state/identity/identitySelectors.js` |
| Storage | **PRESENT** | `state/identity/identityStorage.js` (persistence) |
| Query | **PRESENT** | `state/identity/queries/identityEngineQuery.js` |
| Helper | **PRESENT** | `state/identity/identityResolutionSelfHeal.helper.js`, `state/identity/identity.controller.inflight.js` |
| Adapter | PRESENT (cross-feature) | `features/identity/adapters/identity.adapter.js` |
| Hydrator | PRESENT (cross-feature) | `features/hydration/vcsmActorHydrator.js` |
| Route / Screen | NONE | This is infrastructure — no screens of its own |

---

### DAL → Direct Callers

| DAL Function | Direct Caller | Notes |
|---|---|---|
| `readActorOwnerUserDAL` | `vcsmActorHydrator.js` | Hydration bootstrap |
| `readActorPrivacyDAL` | `vcsmActorHydrator.js` (×2) | Called for both user and vport actor reads |
| `readActorPrivacyDiagnosticDAL` | `identity.controller.js` | Dev-only — behind `IS_DEV && VITE_DEBUG_RLS_DIAGNOSTIC === '1'` |
| `readFallbackRealmDAL` | `identity.controller.js` | Realm fallback resolution |
| `readIdentityActorByIdDAL` | `identity.controller.js`, `vcsmActorHydrator.js` | Two independent read paths to same function |
| `readIdentityActorsByIdsDAL` | `identity.controller.js` | Batch actor load |
| `readPreferredRealmByVoidStateDAL` | `identity.controller.js` | Void realm resolution |
| `readProfileIdentityDAL` | `vcsmActorHydrator.js` | Profile-to-actor hydration |
| `readUserActorByProfileIdDAL` | `vcsmActorHydrator.js`, `identitySelfHeal.controller.js` | **P0 — parameter mismatch documented in Dead Code Audit** |
| `readVportIdentityDAL` | `vcsmActorHydrator.js` | VPORT actor hydration |

---

### Path A — Identity Controller Chain (Global Context Provider)

```
identity.read.dal.js
  → identity.controller.js
    → useIdentityResolutionEffect.hook.js
      → identityContext.jsx (React context + switchActor.controller.js + identityStorage.js)
        → features/identity/adapters/identity.adapter.js (re-exports IdentityProvider + useIdentity)
          → app/providers/index.js
            → main.jsx (app root — wraps entire app)
```

**Trigger context:** Called during identity resolution — resolving which actor the authenticated user should be seen as on each session start or actor switch.

**Downstream reach:** Every screen that calls `useIdentity()` is downstream of this path. 40+ files across chat, feed, profiles, settings, dashboard, notifications, onboarding consume `useIdentity` from `identity.adapter.js`.

---

### Path B — Self-Heal Chain

```
identity.read.dal.js
  → identitySelfHeal.controller.js
    → identityResolutionSelfHeal.helper.js
      → useIdentityResolutionEffect.hook.js
        → identityContext.jsx → (same as Path A from here)
```

**Trigger context:** Called when identity resolution fails — attempts to recover a valid actor state from a partial or broken session. The `readUserActorByProfileIdDAL` P0 finding applies here — see Dead Code Audit.

---

### Path C — Hydrator Chain (App Bootstrap)

```
identity.read.dal.js  ←— direct cross-feature DAL import (P2 — boundary violation)
  → features/hydration/vcsmActorHydrator.js  [also imports identity.model.js directly]
    → features/hydration/setup.js
      → main.jsx (app bootstrap — runs once at startup)
```

**Trigger context:** App startup hydration — loads actor identity data into the Zustand store before the app renders. Bypasses all controller and adapter layers (documented as P2 boundary violation in Dead Code Audit).

---

### Path D — Switch Actor

```
state/identity/controller/switchActor.controller.js
  → identityContext.jsx (imported directly — actor switch triggered from context actions)
    → (same as Path A from here)
```

**Trigger context:** When the user switches between actors (personal profile ↔ VPORT). `switchActor.controller.js` is not a DAL consumer — it operates on already-hydrated state. Included here for completeness of the identity controller topology.

---

### Model Layer

`state/identity/identity.model.js` is consumed by exactly two files:

| Consumer | Role |
|---|---|
| `features/hydration/vcsmActorHydrator.js` | Shapes raw DAL rows into the actor identity model |
| `state/identity/identityContext.jsx` | Uses model types for actor state management |

The model is the shape contract between the DAL and the rest of the identity system. Its existence was missed by the Architecture Pipeline scanner — the pipeline should be corrected.

---

### Store / Selector / Persistence Layer

These files form the Zustand state management layer below `identityContext.jsx`:

| File | Role | Consumers |
|---|---|---|
| `identitySelection.store.js` | Zustand store — holds selected actor state | `identityContext.jsx`, `identitySelectors.js` |
| `identitySelectors.js` | Derived selectors from store | `identityContext.jsx` |
| `identityStorage.js` | Persistence layer — serializes/deserializes actor selection | `identityContext.jsx` |
| `identity.controller.inflight.js` | Inflight dedup — prevents concurrent identity resolution | `identity.controller.js` |

---

### Full Consumer Summary

| Layer | File | Role in Chain |
|---|---|---|
| DAL | `state/identity/identity.read.dal.js` | Raw Supabase reads — 6 tables |
| Model | `state/identity/identity.model.js` | Actor shape definition |
| Controller (main) | `state/identity/identity.controller.js` | Identity resolution orchestration |
| Controller (self-heal) | `state/identity/identitySelfHeal.controller.js` | Recovery path for broken sessions |
| Controller (switch) | `state/identity/controller/switchActor.controller.js` | Actor switch actions |
| Helper | `state/identity/identityResolutionSelfHeal.helper.js` | Self-heal logic impl |
| Inflight tracker | `state/identity/identity.controller.inflight.js` | Concurrency guard |
| Hook | `state/identity/useIdentityResolutionEffect.hook.js` | Wires resolution to React lifecycle |
| Hook | `state/identity/useIdentitySync.js` | Syncs identity state across tabs/sessions |
| Component | `state/identity/identitySwitcher.jsx` | Actor switcher UI (inside identityContext) |
| Component | `state/identity/IdentityDebugger.jsx` | Dev-only identity state inspector |
| Query | `state/identity/queries/identityEngineQuery.js` | Query abstraction for identity engine |
| Context Provider | `state/identity/identityContext.jsx` | Global React context — root of `useIdentity()` |
| Store | `state/identity/identitySelection.store.js` | Zustand — persisted actor selection |
| Selectors | `state/identity/identitySelectors.js` | Store-derived computed values |
| Storage | `state/identity/identityStorage.js` | Actor selection persistence |
| Hydrator (cross-feature) | `features/hydration/vcsmActorHydrator.js` | Startup hydration — direct DAL import |
| Adapter (cross-feature) | `features/identity/adapters/identity.adapter.js` | Public surface for `useIdentity` + `IdentityProvider` |
| App Providers | `app/providers/index.js` | Re-exports `IdentityProvider` |
| App Root | `main.jsx` | Mounts `IdentityProvider` + hydration bootstrap |

---

### Findings Summary

| Finding | Classification | Priority |
|---|---|---|
| Architecture Pipeline marks all layers MISSING — full implementation exists under `state/identity/` not `features/state/` | DOC INACCURACY | P3 |
| `vcsmActorHydrator.js` imports 6 DAL functions directly, bypassing controller/adapter layer | CROSS-FEATURE DAL IMPORT | P2 — SENTRY |
| `readIdentityActorByIdDAL` called by both `identity.controller.js` and `vcsmActorHydrator.js` independently | DUPLICATE READ PATH | P2 — two uncoordinated reads over the same table |
| `identity.model.js` exists but not registered in Architecture Pipeline | DOC INACCURACY | P3 — LOGAN |

**No screens owned by this feature.** The identity DAL is a platform infrastructure layer — its reach is the entire app via `identityContext.jsx` and `IdentityProvider`.

## Codex Fix Pass — 2026-05-11

### Files Changed
| File | Change |
|---|---|
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.state.md` | Appended this fix-pass record only; no prior audit content was removed. |

### Findings Addressed
| Finding | Status | Notes |
|---|---|---|
| `readActorPrivacyDiagnosticDAL` dev-only diagnostic | VERIFIED KEEP | Current controller call remains double-gated by `import.meta.env.DEV` and `VITE_DEBUG_RLS_DIAGNOSTIC === '1'`. |
| `readUserActorByProfileIdDAL` possible parameter mismatch | BLOCKED | Verified both current callers pass a value named `userId`/`ownerRow.user_id` while the DAL filters `actors.profile_id`. No code change was made because confirming whether `actor_owners.user_id` is auth user ID or profile ID requires schema/root-cause ownership. |
| Architecture Pipeline all-layers-missing scanner drift | DOCUMENTED CURRENT STATE | Current repo confirms layers exist under `state/identity/`, not `features/state/`. No older section was edited because this pass is append-only. |
| `vcsmActorHydrator.js` direct state DAL imports | DEFERRED | Verified hydrator imports six state identity DAL functions directly. No code change was made because this is hydration/bootstrap infrastructure and requires SENTRY/IRONMAN boundary review. |
| Duplicate identity read paths | DEFERRED | Verified `readIdentityActorByIdDAL` is called by both identity controller and hydrator. No consolidation attempted. |

### Verification
- Commands/searches run:
  - `wc -l zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.state.md`
  - `sed -n '1,280p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.state.md`
  - `sed -n '281,620p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.state.md`
  - `rg -n "readUserActorByProfileIdDAL|readActorPrivacyDiagnosticDAL|readIdentityActorByIdDAL|readActorOwnerUserDAL|readActorPrivacyDAL|readProfileIdentityDAL|readVportIdentityDAL|identity\\.read\\.dal|vcsmActorHydrator|VITE_DEBUG_RLS_DIAGNOSTIC|identity\\.model" apps/VCSM/src --glob '*.js' --glob '*.jsx'`
  - `sed -n '1,260p' apps/VCSM/src/state/identity/identity.read.dal.js`
  - `sed -n '1,160p' apps/VCSM/src/state/identity/identitySelfHeal.controller.js`
  - `sed -n '1,180p' apps/VCSM/src/features/hydration/vcsmActorHydrator.js`
- Production callers checked:
  - `readActorPrivacyDiagnosticDAL`: dev-gated caller in `state/identity/identity.controller.js`.
  - `readUserActorByProfileIdDAL`: callers in `identitySelfHeal.controller.js` and `features/hydration/vcsmActorHydrator.js`.
  - `vcsmActorHydrator.js`: direct imports from `state/identity/identity.read.dal.js` confirmed.
  - `identity.model.js`: consumed by `identityContext.jsx` and `vcsmActorHydrator.js`.
- Remaining risks:
  - P0 parameter-contract question remains unresolved pending DEADPOOL/VENOM/CARNAGE or schema confirmation.
  - Hydration direct DAL boundary remains pending SENTRY/IRONMAN.
  - No source changes were made for this doc; build was not rerun after this append-only documentation pass. The previous social build passed.

### Status
BLOCKED
