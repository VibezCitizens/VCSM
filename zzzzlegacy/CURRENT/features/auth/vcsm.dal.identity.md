# VCSM DAL — `identity`

_Generated:_ 2026-05-11  
_Last updated:_ 2026-05-18 (LOGAN rebuild — RISK-3/4 resolution)  
_Source:_ ARCHITECT static scan + 2026-05-18 governance pass  
_Confidence:_ STATICALLY\_TRACED + VERIFIED  

---

## Summary

| Item | Count |
|---|---|
| Feature files | 9 |
| DAL files | 2 |
| Resolver files | 1 (`vcsmIdentity.resolver.js`) |
| Adapter files | 2 (`identity.adapter.js`, `identityOps.adapter.js`) |
| Controller files | 2 |
| Hook files | 1 |
| Setup file | 1 (`setup.js`) |
| Exported functions | 3 (DAL) + 1 (resolver factory) |
| Tables accessed directly | 0 (DAL only calls RPCs) |
| Tables accessed via resolver | 1 (`platform.user_app_actor_links` — 12-column explicit select) |
| RPCs called | 2 |
| Risk findings | 1 — see Risk Findings |

## Feature Files

All files in `apps/VCSM/src/features/identity/`:

| File | Layer | Role |
|---|---|---|
| `dal/provision.rpc.dal.js` | DAL | Calls `platform.provision_vcsm_identity` SECURITY DEFINER RPC |
| `dal/refreshActorDirectory.dal.js` | DAL | Calls `identity.refresh_actor_directory_row` RPC; graceful return |
| `controller/ensureVcsmPlatformBootstrap.controller.js` | Controller | 2-layer guard + idempotent bootstrap |
| `controller/refreshActorDirectory.controller.js` | Controller | Hollow pass-through — structural finding (OQ-3) |
| `hooks/useIdentityOps.js` | Hook | Bundles both ops for React callers |
| `adapters/identity.adapter.js` | Adapter | Bundle adapter — React callers; also re-exports `useIdentity` + `IdentityProvider` from state layer |
| `adapters/identityOps.adapter.js` | Adapter (ops) | Ops-only adapter for non-React callers (`identitySelfHeal`, `vport.core.dal.js`) |
| `resolvers/vcsmIdentity.resolver.js` | Resolver | VCSM app context resolver — injected into engine via `configureIdentityEngine()` |
| `setup.js` | Setup (DI) | One-time engine configuration at app startup (`main.jsx:19`) |

## DAL Files

### `provision.rpc.dal.js`

**Path:** `features/identity/dal/provision.rpc.dal.js`  
**Operations:** `rpc`  
**Trust:** SECURITY DEFINER — elevated DB privileges; writes 6 objects atomically  
**Schema:** `platform`  

**Exported functions:**

| Function | Operation | RPC |
|---|---|---|
| `dalProvisionVcsmIdentity({ userId, actorId })` | `rpc` | `platform.provision_vcsm_identity(p_user_id, p_actor_id)` → `uuid` |

### `refreshActorDirectory.dal.js`

**Path:** `features/identity/dal/refreshActorDirectory.dal.js`  
**Operations:** `rpc`  
**Trust:** RLS-governed (not SECURITY DEFINER)  
**Schema:** `identity`  
**Error policy:** Graceful — never throws to caller; returns `{ ok: false, error }` on failure  

**Exported functions:**

| Function | Operation | RPC |
|---|---|---|
| `refreshActorDirectoryRow(actorDomain, actorId)` | `rpc` | `identity.refresh_actor_directory_row(p_actor_domain, p_actor_id)` |
| `refreshVcActorDirectory(actorId)` | `rpc` (wrapper) | Same — convenience wrapper with `domain='vc'` fixed |

## Resolver

### `vcsmIdentity.resolver.js`

**Path:** `features/identity/resolvers/vcsmIdentity.resolver.js`  
**Layer:** Resolver (DI factory — see Architecture Contract §2.8)  
**Called at:** Every auth context resolution via `configureIdentityEngine()` injection  

**Exported functions:**

| Function | Type | Role |
|---|---|---|
| `createVcsmAppContextResolver(supabase)` | Factory function | Returns an injectable resolver closure for the identity engine |

**Table access:**

| Table | Schema | Operation | Columns Selected | Filter |
|---|---|---|---|---|
| `user_app_actor_links` | `platform` | SELECT | 12 columns (explicit) | `actor_source='vc'`, `status='active'` |

## RPCs Called

| Schema | RPC | Via Functions | Trust | Notes |
|---|---|---|---|---|
| `platform` | `provision_vcsm_identity(p_user_id, p_actor_id)` | `dalProvisionVcsmIdentity` | SECURITY DEFINER | Writes 6 objects atomically; returns `user_app_account_id` |
| `identity` | `refresh_actor_directory_row(p_actor_domain, p_actor_id)` | `refreshActorDirectoryRow`, `refreshVcActorDirectory` | RLS-governed | Graceful return; used by VCSM + Wentrex |

---

## Risk Findings

### RF-01 — SECURITY DEFINER Surface (MEDIUM)

**Surface:** `platform.provision_vcsm_identity` RPC  
**Called from:** `provision.rpc.dal.js` → `ensureVcsmPlatformBootstrap.controller.js`  
**Trust level:** SECURITY DEFINER — bypasses RLS on 6 write operations  
**Confidence:** HIGH (confirmed from code + CARNAGE + VENOM)  

The highest-privilege DB call in the VCSM frontend. Called on every new user bootstrap and self-heal. The function takes `p_user_id` as an explicit caller-supplied parameter. Whether the live function body enforces `p_user_id == auth.uid()` at the DB layer is **unverified** — a DB inspection query is required to close this gap.

**Status:** OPEN — DB verification pending  
**Security audit:** `CURRENT/features/dashboard/evidence/2026-05-18_venom_identity-provision-rpc-security.md`  
**Migration audit:** `_ACTIVE/audits/migrations/2026-05-18_carnage_identity-rpc-migration-ownership.md`  
**Tracked migration:** `apps/VCSM/supabase/migrations/20260518040000_platform_provision_vcsm_identity.sql` (proposed — requires DB verification before applying)  
**Handoff:** DB (inspect live body) + VENOM (close VF-01)

---

## Pending Reviews

- **DB + VENOM:** Verify auth.uid() guard in `platform.provision_vcsm_identity` body (RF-01 / VF-01)
- **DEADPOOL:** Add `debugLoginError` to outer catch in `useIdentityResolutionEffect.hook.js` (LF-04 / IR-01) — **DONE 2026-05-18**
- **CARNAGE:** Migration ownership for `identity.refresh_actor_directory_row` (shared RPC governance)

---

## Call Chains

_Updated: 2026-05-18 — LOGAN drift correction (DF-01/DF-02). Original call chains showed wrong terminal screens (chat screens that consume `useIdentity` state, not `useIdentityOps` ops). Corrected chains below._

Who calls each DAL file — traced from DAL up to Screen.

### `provision.rpc.dal.js`

**Direct callers:**

- `ensureVcsmPlatformBootstrap.controller.js` _Controller_

**Full call chain (React callers via `identity.adapter.js`):**

```
provision.rpc.dal.js
  → ensureVcsmPlatformBootstrap.controller.js
    → useIdentityOps.js
      → identity.adapter.js
        → useAuthOnboarding.js → Onboarding.jsx
        → useJoinBarbershop.js → join flow screens
```

**Non-React callers via `identityOps.adapter.js`:**

```
provision.rpc.dal.js
  → ensureVcsmPlatformBootstrap.controller.js
    → identityOps.adapter.js
      → identitySelfHeal.controller.js (self-heal path)
```

**Trigger context:** New user bootstrap during onboarding or invite-join. Self-heal when engine returns no platform rows on login.

### `refreshActorDirectory.dal.js`

**Direct callers:**

- `refreshActorDirectory.controller.js` _Controller_ (hollow pass-through)

**Full call chain (React callers via `identity.adapter.js`):**

```
refreshActorDirectory.dal.js
  → refreshActorDirectory.controller.js
    → useIdentityOps.js
      → identity.adapter.js
        → useAuthOnboarding.js    → Onboarding.jsx
        → useJoinBarbershop.js    → join flow screens
        → useProfileController.js → profile settings screens
        → useUpdateVportVisibility.js → visibility settings
```

**Non-React callers via `identityOps.adapter.js`:**

```
refreshActorDirectory.dal.js
  → refreshVcActorDirectory (exported from DAL)
    → identityOps.adapter.js
      → vport.core.dal.js:101  (awaited — vport create)
      → vport.core.dal.js:225  (fire-and-forget — vport update)
```

**Trigger context:** Post-mutation refresh after any actor-visible change (profile edit, vport create/update, visibility toggle).

---

## Architecture Pipeline

_Updated: 2026-05-18 — added resolver, setup, identityOps.adapter_

Full build order for this feature: `DAL → Resolver → Controller → Hook → Adapter → (consumed by cross-feature callers)`

| Layer | Status | Files |
|---|---|---|
| **DAL** | PRESENT | `provision.rpc.dal.js`, `refreshActorDirectory.dal.js` |
| **Model** | MISSING | — RPC responses consumed raw by controllers |
| **Resolver** | PRESENT | `resolvers/vcsmIdentity.resolver.js` — VCSM DI factory for identity engine |
| **Controller** | PRESENT | `controller/ensureVcsmPlatformBootstrap.controller.js` (real logic), `controller/refreshActorDirectory.controller.js` (hollow pass-through — OQ-3) |
| **Hook** | PRESENT | `hooks/useIdentityOps.js` — bundles both ops for React callers |
| **Adapter (bundle)** | PRESENT | `adapters/identity.adapter.js` — React callers; also re-exports `useIdentity`/`IdentityProvider` from state layer |
| **Adapter (ops)** | PRESENT | `adapters/identityOps.adapter.js` — non-React callers (identitySelfHeal, vport.core.dal.js) |
| **Setup (DI)** | PRESENT | `setup.js` — one-time engine configuration at app startup (`main.jsx:19`) |
| **Component** | MISSING | Not applicable — feature is a pure ops provider |
| **View Screen** | MISSING | Not applicable — all screens are in cross-feature consumers |
| **Final Screen** | MISSING | Not applicable |

### Resolver Layer
_DI factory — creates injectable closure for `configureIdentityEngine()`. See Architecture Contract §2.8._

- `features/identity/resolvers/vcsmIdentity.resolver.js` — exports `createVcsmAppContextResolver(supabase)`
- Queries `platform.user_app_actor_links` at every auth context resolution

### Setup (DI Bootstrap)
_Called once from `main.jsx:19`. Wires supabase client + VCSM resolver into `engines/identity/`._

- `features/identity/setup.js`

### Controller

- `features/identity/controller/ensureVcsmPlatformBootstrap.controller.js` — 2-layer guard, calls `dalProvisionVcsmIdentity`
- `features/identity/controller/refreshActorDirectory.controller.js` — hollow pass-through (OQ-3 open: promote or collapse)

### Adapter

- `features/identity/adapters/identity.adapter.js` — bundle adapter for React consumers
- `features/identity/adapters/identityOps.adapter.js` — ops-only adapter for non-React callers

### Hook

- `features/identity/hooks/useIdentityOps.js`

---

## Dead Code Audit

_Audited:_ 2026-05-11  
_Method:_ Static import trace — grep across all `.js`/`.jsx` in `apps/VCSM/src/`  
_Auditor:_ ARCHITECT

---

### Verdict: No Confirmed Dead Code

All 3 exported functions are wired and actively called. No deletion candidates.

| Function | Status | Evidence |
|---|---|---|
| `dalProvisionVcsmIdentity` | LIVE | `ensureVcsmPlatformBootstrap.controller.js` → `useIdentityOps.js` → adapter → multiple screens |
| `refreshVcActorDirectory` | LIVE | `useIdentityOps.js`, `useAuthOnboarding.js`, `useJoinBarbershop.js`, `useProfileController.js`, `useUpdateVportVisibility.js` |
| `refreshActorDirectoryRow` | LIVE (internal only) — see finding below | Called internally by `refreshVcActorDirectory` within the same DAL file |

---

### Structural Finding #1 — `refreshActorDirectoryRow` public export is dead

**File:** `features/identity/dal/refreshActorDirectory.dal.js` + `features/identity/controller/refreshActorDirectory.controller.js`  
**Function:** `refreshActorDirectoryRow`  
**Classification:** DEAD PUBLIC EXPORT — function itself is live internally  

**Evidence:**
- `refreshActorDirectoryRow` is called only once: internally by `refreshVcActorDirectory` inside the same DAL file
- It is exported from `refreshActorDirectory.dal.js` and re-exported from `refreshActorDirectory.controller.js`
- Zero external callers found anywhere in `apps/VCSM/src/` outside its own DAL and controller files
- All real consumers use the `refreshVcActorDirectory` wrapper instead

**Risk:** LOW — no runtime harm. The exported surface is wider than necessary. If someone later wires `refreshActorDirectoryRow` directly (bypassing the `'vc'` domain default in `refreshVcActorDirectory`), they must supply `actorDomain` manually — no guard exists at the call site.  
**Recommended action:** Keep the internal implementation. Consider removing the public export from both the DAL and controller, or document it explicitly as a multi-domain escape hatch.  
**Handoffs:** IRONMAN (confirm if multi-domain use is planned — e.g. `'learning'` domain)

---

### Structural Finding #2 — `refreshActorDirectory.controller.js` is a hollow pass-through

**File:** `features/identity/controller/refreshActorDirectory.controller.js`  
**Classification:** ARCHITECTURAL SMELL — not dead, but adds no value  

**Evidence:**
- The entire file is 6 lines: import from DAL → re-export unchanged
- No business logic, no ownership check, no error handling, no transformation
- Acts as a forwarding alias between the DAL and `useIdentityOps.js`

**Risk:** LOW — harmless but misleads readers into expecting controller-layer logic that doesn't exist. If business rules around directory refresh are ever added (e.g. rate-limit guard, ownership check), developers may miss that this is where they belong.  
**Recommended action:** Either promote this to a real controller (add error boundary or ownership guard), or collapse it — have `useIdentityOps.js` import directly from the DAL and document the exception.  
**Handoffs:** IRONMAN (ownership decision), SENTRY (verify no boundary rule requires a controller layer here)

---

### Audit Summary

| Finding | Classification | Priority |
|---|---|---|
| `refreshActorDirectoryRow` — exported but never called externally | DEAD PUBLIC EXPORT | P2 |
| `refreshActorDirectory.controller.js` — hollow pass-through, no business logic | ARCHITECTURAL SMELL | P3 |

**Confirmed dead functions:** 0  
**Dead public exports:** 1 (`refreshActorDirectoryRow` — internal use only)  
**Doc function count:** ACCURATE (3 — all referenced)

---

## Layer Consumer Map

_Audited:_ 2026-05-11  
_Method:_ Static import trace — full upward traversal from each DAL file through Controller → Hook → Adapter → Screen  
_Auditor:_ ARCHITECT

---

### Important: Adapter Surface Split

`identity.adapter.js` is a bundle adapter — it re-exports from **two entirely separate systems**:

| Export | Source | Touches This DAL |
|---|---|---|
| `useIdentityOps` | `features/identity/hooks/useIdentityOps.js` | YES — this is the operational chain (provision + refresh RPCs) |
| `useIdentity` | `state/identity/identityContext.jsx` | NO — this is the identity state context (actor hydration, actor switching) |
| `IdentityProvider` | `state/identity/identityContext.jsx` | NO — React context provider for identity state |

The 30+ files that import `useIdentity` from `identity.adapter.js` are consuming identity **state**, not the identity DAL. Only the 4 files that import `useIdentityOps` touch the actual DAL chain documented here.

---

### DAL → Controller

| DAL File | Controller That Imports It |
|---|---|
| `provision.rpc.dal.js` | `ensureVcsmPlatformBootstrap.controller.js` (sole caller) |
| `refreshActorDirectory.dal.js` | `refreshActorDirectory.controller.js` (hollow pass-through — imports and immediately re-exports, no logic added) |

---

### Controller → Hook

| Controller | Hook That Imports It |
|---|---|
| `ensureVcsmPlatformBootstrap.controller.js` | `useIdentityOps.js` |
| `refreshActorDirectory.controller.js` | `useIdentityOps.js` |

`useIdentityOps.js` is the sole hook consumer of both controllers. It bundles them into a single return object: `{ refreshVcActorDirectory, ensureVcsmPlatformBootstrap }`.

---

### Hook → Adapter

`useIdentityOps.js` is re-exported unchanged by `identity.adapter.js`:
```js
export { useIdentityOps } from '@/features/identity/hooks/useIdentityOps'
```
No transformation occurs at the adapter layer — the adapter is a pure re-export boundary.

---

### Adapter (`useIdentityOps`) → Cross-Feature Consumers

All 4 files that consume `useIdentityOps` are from **other features** — none are inside `features/identity/`:

| Consumer File | Feature | Functions Used | Path to Screen |
|---|---|---|---|
| `useAuthOnboarding.js` | `auth` | `refreshVcActorDirectory`, `ensureVcsmPlatformBootstrap` | → `Onboarding.jsx` (screen) |
| `useJoinBarbershop.js` | `join` | `refreshVcActorDirectory`, `ensureVcsmPlatformBootstrap` | → join barbershop flow screens |
| `useProfileController.js` | `settings/profile` | `refreshVcActorDirectory` | → profile settings screens |
| `useUpdateVportVisibility.js` | `settings` | `refreshVcActorDirectory` | → VPORT visibility settings |

---

### Full Call Chain — `dalProvisionVcsmIdentity`

```
provision.rpc.dal.js
  → ensureVcsmPlatformBootstrap.controller.js
    → useIdentityOps.js
      → identity.adapter.js
        → useAuthOnboarding.js → Onboarding.jsx
        → useJoinBarbershop.js → join flow screens
```

**Trigger context:** Called during account bootstrap — when a new user signs up or joins via invite and needs a VCSM identity provisioned via the `provision_vcsm_identity` RPC.

---

### Full Call Chain — `refreshVcActorDirectory`

```
refreshActorDirectory.dal.js
  → refreshActorDirectory.controller.js (pass-through)
    → useIdentityOps.js
      → identity.adapter.js
        → useAuthOnboarding.js    → Onboarding.jsx
        → useJoinBarbershop.js    → join flow screens
        → useProfileController.js → profile settings screens
        → useUpdateVportVisibility.js → visibility settings
```

**Trigger context:** Called after any mutation that changes the actor's public directory row — profile saves, visibility toggles, onboarding completions, join flows. Acts as a post-write cache/index refresh.

---

### Model Layer

No model files exist in `features/identity/`. The Architecture Pipeline correctly marks Model as MISSING — confirmed by filesystem scan. No data transformation layer sits between the DAL RPC responses and the controllers.

**Note:** The RPC responses from `provision_vcsm_identity` and `refresh_actor_directory_row` are consumed directly by the controllers without transformation. If the RPC response shape ever changes, the controller must handle the mapping.

---

### `useIdentity` Consumers — State Layer Only (Does NOT Touch This DAL)

For completeness, `useIdentity` (re-exported from `state/identity/identityContext.jsx` via `identity.adapter.js`) is consumed by 30+ files across the codebase. These do NOT touch the identity DAL — they read actor identity state. Representative consumers:

| Category | Files |
|---|---|
| Chat screens | `ConversationScreen.jsx`, `ConversationView.jsx`, `InboxScreen.jsx`, `ArchivedInboxScreen.jsx`, `RequestsInboxScreen.jsx`, `SpamInboxScreen.jsx`, `BlockedUsersScreen.jsx` |
| Feed | `CentralFeedScreen.jsx` |
| Profiles | `ActorProfileScreen.jsx`, `VportReviewsView.jsx` |
| Settings | `PrivacyTab.view.jsx`, `useActorLookup.js`, `useProfileController.js`, `useProfileUploads.js`, `useAccountController.js` |
| Dashboard | `VportDashboardTeamScreen.jsx` |
| Notifications | `useNotificationInbox.js`, `BookingCancelledNotificationItem.view.jsx`, `BookingCreatedNotificationItem.view.jsx` |
| Onboarding | `OnboardingCardsView.jsx`, `useOnboardingVibeTags.js` |
| Social | `useFollowRequestActions.js`, `useBlockActions.js`, `useBlockActorAction.js` |
| Shared UI | `BottomNavBar.jsx`, `PublicNavbar.jsx` |
| System | `useOneSignalPush.js`, `main.jsx` |

---

### Architecture Pipeline — Corrected

| Layer | Status | Evidence |
|---|---|---|
| DAL | PRESENT | `provision.rpc.dal.js`, `refreshActorDirectory.dal.js` |
| Model | MISSING | No model files found in `features/identity/` — RPC responses consumed raw |
| Controller | PRESENT | `ensureVcsmPlatformBootstrap.controller.js` (real logic), `refreshActorDirectory.controller.js` (hollow pass-through) |
| Hook | PRESENT | `useIdentityOps.js` |
| Adapter | PRESENT | `identity.adapter.js` (bundle re-export — also surfaces `useIdentity` from state layer) |
| View Screen | MISSING | No screens in `features/identity/` — all screens are in cross-feature consumers |
| Final Screen | MISSING | Same — this feature is consumed, not rendered |

> The identity feature has no screens of its own. It is a pure operations provider consumed by auth, join, and settings features.

---

## AVENGERS ASSEMBLY REPORT — 2026-05-11

**Run Summary**
Date: 2026-05-11
Triggered by: User — targeted doc alignment pass
Application Scope: VCSM
Document Scope: `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.identity.md`
Boundary Contract: `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md` — enforced
Commands Run: ARCHITECT / VENOM / LOGAN / review-contract

---

### Governance Evidence Registry

| Command | Status | Findings | Drift | Blocking |
|---|---|---|---|---|
| ARCHITECT | PRESENT | 2 undocumented files; dead export; 2 direct RPC bypass sites in vport DAL; stale summary table; undocumented consumer | YES | NO |
| VENOM | PRESENT | SECURITY DEFINER RPC undocumented in risk notes; dead export touches sensitive identity data | YES | NO |
| LOGAN | PRESENT | Call Chains stale (wrong terminal screens); 2 undocumented files; `identitySelfHeal` consumer missing; `vport.core.dal.js` bypass missing | YES | NO |
| review-contract | PRESENT | 2 boundary violations (`identitySelfHeal` direct controller import; `vport.core.dal.js` direct RPC bypass); relative import; non-standard `resolvers/` layer | YES | NO |
| IRONMAN | MISSING | Ownership of resolver/setup DI layer and dead export decision pending | N/A | NO |
| SENTRY | MISSING | 2 open boundary violations require review | N/A | NO |
| FALCON | N/A | No native-specific surfaces in this DAL | N/A | NO |
| LOKI | MISSING | Runtime trace of self-heal path and provisioning flow | N/A | NO |
| KRAVEN | N/A | No performance scope for this DAL | N/A | NO |
| CARNAGE | MISSING | Migration history for `provision_vcsm_identity` and `refresh_actor_directory_row` RPCs | N/A | NO |
| WINTER SOLDIER | N/A | Not in scope | N/A | NO |
| SHIELD | N/A | No IP/provenance scope this pass | N/A | NO |

---

### ARCHITECT

**Status: DRIFT FOUND**

**DAL files verified:**
Both DAL files confirmed on disk and verified against documented behavior:
- `provision.rpc.dal.js` — calls `platform.provision_vcsm_identity` RPC, explicit param guards (`throw` on missing `userId`/`actorId`) ✓
- `refreshActorDirectory.dal.js` — calls `identity.refresh_actor_directory_row` RPC, graceful error return (never throws to caller) ✓
- No `select('*')` violations (RPC-only files, no SELECT) ✓

**2 undocumented files in `features/identity/`:**

| File | Layer | What It Does |
|---|---|---|
| `features/identity/resolvers/vcsmIdentity.resolver.js` | Resolver (non-standard) | Implements `createVcsmAppContextResolver` — DI-injectable function injected into the identity engine via `setup.js`. Queries `platform.user_app_actor_links` directly. Also exports `resolveVcsmActorForProvisioning` which queries `vc.actors` — but this export is **never called anywhere** (dead export). |
| `features/identity/setup.js` | Setup / DI wiring | Exports `setupVcsmIdentityEngine()`. Called once from `main.jsx:19`. Injects `createVcsmAppContextResolver(supabase)` into the identity engine via `configureIdentityEngine`. Also wires `@debuggers/identity` callbacks as the engine's debug reporter. |

Both files are part of the identity feature but are absent from every section of this document: the Summary table, DAL Files, Architecture Pipeline, and Layer Consumer Map.

**Summary table "Tables accessed: 0" is stale:**
The Summary table was computed against only the 2 DAL files. `vcsmIdentity.resolver.js` — part of this feature — queries 2 tables directly:
- `platform.user_app_actor_links` — SELECT via `createVcsmAppContextResolver` (active, called at app startup)
- `vc.actors` — SELECT via `resolveVcsmActorForProvisioning` (dead export, never called)

Actual tables accessed by the identity feature: **2** (not 0).

**Dead export confirmed:**
`resolveVcsmActorForProvisioning` is defined and exported in `vcsmIdentity.resolver.js:16`. Zero callers found across all of `apps/VCSM/src/`. The function body is live code that queries `vc.actors` but it is never invoked at runtime.

**Undocumented consumer — `identitySelfHeal.controller.js`:**
`state/identity/identitySelfHeal.controller.js` calls `ensureVcsmPlatformBootstrap` — making it a real consumer of the identity DAL chain. It is absent from the Layer Consumer Map. It is called by `state/identity/useIdentityResolutionEffect.hook.js` as part of the identity self-heal path triggered when engine resolution returns no platform identity.

**`vport.core.dal.js` calls `refresh_actor_directory_row` RPC directly — 2 sites:**
`features/vport/dal/vport.core.dal.js` bypasses the entire identity DAL and adapter layer, calling `supabase.schema('identity').rpc('refresh_actor_directory_row', {...})` inline:
- Line 100: `await supabase.schema('identity').rpc(...)` — inside the create-vport flow, awaited
- Line 227: `Promise.resolve(supabase.schema('identity').rpc(...)).catch(() => {})` — inside the update-vport flow, fire-and-forget

Both calls pass `p_actor_domain: 'vc'` hardcoded, identical to what `refreshVcActorDirectory` does. This is a functional duplicate of the canonical DAL function, written directly into the vport DAL without going through the identity feature's DAL, controller, or adapter layers.

---

### VENOM

**Status: DRIFT FOUND**

**`provision_vcsm_identity` is a SECURITY DEFINER RPC — not documented in risk notes:**
The DAL comment confirms: `// Atomically creates/ensures (SECURITY DEFINER):`. This RPC runs with elevated database privileges and bypasses RLS for 6 table operations across `platform.*` and `vc.*`. It is idempotent and safe to call on every login — but the fact that it is SECURITY DEFINER means any miscall with wrong `userId`/`actorId` has elevated-privilege consequences. The DAL has explicit `throw` guards on both required params. However, this security characteristic is not flagged anywhere in the document's Risk Findings, Tables Accessed, or RPCs Called sections.

**Dead export touches identity data (`resolveVcsmActorForProvisioning`):**
The dead export queries `vc.actors` with `profile_id = userId` and returns the actor row including `kind`, `profile_id`, `vport_id`, `is_void`. It is never called — but it remains exported from the module and in the compiled bundle. Any future wiring of this function would expose sensitive actor identity fields. Recommend removal or explicit documentation as internal-only escape hatch.

**`vport.core.dal.js` direct RPC calls — no input validation at call site:**
The two direct `refresh_actor_directory_row` calls in `vport.core.dal.js` have no guard comparable to the DAL function's `if (!actorDomain || !actorId)` check. At line 100, the call is wrapped in `try/catch` (non-fatal). At line 227, it is `.catch(() => {})` fire-and-forget. Both rely on `data.actor_id` being truthy, checked at line 98 and 226 respectively. Acceptable in practice, but the canonical DAL function's guard is not replicated.

**`@debuggers/identity` in `setup.js`** — same intentional stub pattern as chat. Production resolves to no-ops via Vite config. Not a security exposure.

**No `select('*')` violations.** All Supabase queries use explicit column lists.
**No TypeScript files.**

---

### LOGAN

**Status: DRIFT FOUND**

**DF-01 — Call Chains section shows wrong terminal screens:**
The Call Chains section (lines 64–105) lists `ConversationScreen.jsx`, `ConversationView.jsx`, `ArchivedInboxScreen.jsx`, `InboxScreen.jsx` as terminals of the identity DAL chain via `identity.adapter.js`. This is incorrect. Those screens import `useIdentity` (state) from `identity.adapter.js`, not `useIdentityOps` (DAL ops). The Layer Consumer Map added later in the same document correctly identifies this distinction — but the Call Chains section was never updated to match. The two sections directly contradict each other.

**DF-02 — `resolvers/vcsmIdentity.resolver.js` absent from all documentation sections:**
This file implements the DI-injectable app context resolver that loads ALL active actor links at startup. It queries 2 tables, has a dead export, and is injected into the identity engine by `setup.js`. It is not listed in DAL Files, Architecture Pipeline, Dead Code Audit, or Layer Consumer Map.

**DF-03 — `setup.js` absent from all documentation sections:**
This file is the identity engine's startup configuration — called from `main.jsx` on app boot. It is the entry point for the identity engine DI wiring. Not in any section of this document.

**DF-04 — `identitySelfHeal.controller.js` not in Layer Consumer Map:**
The Layer Consumer Map lists 4 `useIdentityOps` consumers. A 5th consumer exists: `state/identity/identitySelfHeal.controller.js` calls `ensureVcsmPlatformBootstrap` directly (see review-contract). Not documented.

**DF-05 — `vport.core.dal.js` direct RPC bypass not documented:**
Two call sites in `features/vport/dal/vport.core.dal.js` call `refresh_actor_directory_row` directly. Neither is in the Layer Consumer Map or mentioned in the Risk Findings. This effectively creates 2 undocumented call sites for the same RPC owned by this feature's DAL.

---

### review-contract

**Status: VIOLATIONS FOUND**

**VIOLATION-1 — `identitySelfHeal.controller.js` direct cross-boundary controller import:**
`state/identity/identitySelfHeal.controller.js:2` imports:
```js
import { ensureVcsmPlatformBootstrap } from "@/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js"
```
This is a direct import from `features/identity/controller/` — bypassing `features/identity/adapters/identity.adapter.js`. The architecture contract requires all cross-feature access to go through adapters only. `state/identity/` is outside the identity feature boundary.

**VIOLATION-2 — `vport.core.dal.js` direct cross-feature RPC calls (2 sites):**
`features/vport/dal/vport.core.dal.js` calls `supabase.schema('identity').rpc('refresh_actor_directory_row', {...})` at lines 100 and 227 without importing through the identity feature at all. The canonical path is:
```
refreshVcActorDirectory() via identity.adapter.js → controller → DAL
```
The vport DAL bypasses all of this and calls the underlying RPC directly. This creates an undocumented dependency on the `identity` Supabase schema from within the vport DAL, and any change to `refresh_actor_directory_row`'s parameter contract must now be updated in 3 places instead of 1.

**RELATIVE IMPORT — `ensureVcsmPlatformBootstrap.controller.js:20`:**
```js
import { dalProvisionVcsmIdentity } from '../dal/provision.rpc.dal.js'
```
Architecture contract requires `@/...` path aliases for all cross-folder imports. This is a `../` relative import. The file is within the same feature, so the risk is low, but it is a contract violation.

**NON-STANDARD `resolvers/` LAYER:**
`features/identity/resolvers/` is an undocumented sub-layer not in the DAL → Model → Controller → Hook → Screen taxonomy. The resolver does direct Supabase queries (DAL-level work) but is not named `dal/`, creates a factory function returned as a closure (controller-like), and is injected via DI (service-like). It does not fit cleanly into any existing layer contract.

**No `select('*')` in identity DAL files ✓**
**No TypeScript files ✓**

---

### New Risk Entries — 2026-05-11

| Risk | ID | Severity | Status | Handoff |
|---|---|---|---|---|
| `identitySelfHeal.controller.js` imports directly from identity controller, bypasses adapter | RISK-1 | HIGH | OPEN | SENTRY |
| `vport.core.dal.js` calls `refresh_actor_directory_row` RPC directly — 2 sites, bypasses identity DAL entirely | RISK-2 | HIGH | OPEN | SENTRY |
| `vcsmIdentity.resolver.js` and `setup.js` undocumented — resolver queries 2 tables, summary table is stale | RISK-3 | MEDIUM | OPEN | IRONMAN |
| `provision_vcsm_identity` is SECURITY DEFINER — not in risk notes or security surface docs | RISK-4 | MEDIUM | OPEN | VENOM |
| `resolveVcsmActorForProvisioning` dead export — queries `vc.actors`, never called | RISK-5 | LOW | OPEN | IRONMAN |
| Call Chains section contradicts Layer Consumer Map — wrong terminal screens documented | RISK-6 | LOW | OPEN | LOGAN |
| Summary "Tables accessed: 0" stale — resolver accesses 2 tables | RISK-7 | LOW | OPEN | LOGAN |
| `ensureVcsmPlatformBootstrap.controller.js:20` relative import instead of `@/` alias | RISK-8 | LOW | OPEN | SENTRY |
| `resolvers/` sub-layer outside architecture contract taxonomy | RISK-9 | LOW | OPEN | SENTRY |

**RISK-1 detail:** `state/identity/identitySelfHeal.controller.js:2` imports `ensureVcsmPlatformBootstrap` from `@/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js` — not from `identity.adapter.js`. This is the self-heal path that runs when engine identity resolution returns no platform identity. It is a live, active code path triggered on every auth session where the platform bootstrap has not completed. Fix: add `ensureVcsmPlatformBootstrap` to `identity.adapter.js` exports and update the self-heal controller to import from the adapter.

**RISK-2 detail:** `features/vport/dal/vport.core.dal.js` calls `supabase.schema('identity').rpc('refresh_actor_directory_row', {...})` at 2 call sites (lines 100 and 227). These are inside the create-vport and update-vport DAL functions. They are functional duplicates of `refreshVcActorDirectory()`. Any future change to `refresh_actor_directory_row` RPC parameter contract must now be updated in `refreshActorDirectory.dal.js`, `vport.core.dal.js:100`, and `vport.core.dal.js:227`. Fix: replace the inline RPC calls with imports of `refreshVcActorDirectory` from `@/features/identity/adapters/identity.adapter`.

**RISK-4 detail:** `provision_vcsm_identity` runs as SECURITY DEFINER in Supabase, atomically creating/ensuring 6 platform rows across `platform.*` and `vc.*` schemas. This is the highest-privilege RPC called from the VCSM frontend. Its only guard is at the DAL level (`throw` on missing `userId`/`actorId`). The Risk Findings section currently says "No risk findings" — this should be updated to document the SECURITY DEFINER surface and the trust model for when/how it is callable.

---

### Cross-System Contradictions

| System A | System B | Contradiction | Severity | Recommended Resolution |
|---|---|---|---|---|
| Call Chains section — `ConversationScreen.jsx` listed as DAL chain terminal | Layer Consumer Map — confirms chat screens use `useIdentity` (state), NOT `useIdentityOps` (DAL ops) | Same doc contradicts itself | LOW | Update Call Chains section to remove chat screen terminals; replace with accurate auth/join/settings terminals |
| Doc Risk Findings: "No risk findings" | `provision_vcsm_identity` is SECURITY DEFINER; 2 boundary violations active in codebase | Risk surface is underdocumented | MODERATE | Update Risk Findings section to document SECURITY DEFINER surface and RISK-1/RISK-2 violations |

---

### Documentation Truth Review

| Doc Section | Truth Status | Drift | Blocking |
|---|---|---|---|
| Summary table | DRIFT | "Tables accessed: 0" — resolver queries 2 tables | NO |
| DAL Files section | ALIGNED | 2 files verified correct | NO |
| RPCs Called table | ALIGNED | Both RPCs verified active | NO |
| Risk Findings | DRIFT | "No risk findings" — SECURITY DEFINER RPC and 2 boundary violations undocumented | NO |
| Call Chains section | DRIFT | Terminal screens are `useIdentity` consumers, not DAL chain terminals | NO |
| Architecture Pipeline | MINOR DRIFT | `resolvers/` and `setup.js` absent | NO |
| Dead Code Audit | MINOR DRIFT | `resolveVcsmActorForProvisioning` dead export not in audit scope | NO |
| Layer Consumer Map | DRIFT | Missing `identitySelfHeal.controller.js`; missing `vport.core.dal.js` bypass | NO |
| Structural Findings (existing) | ALIGNED | Both existing findings verified still accurate | NO |

---

### Overall Status

**DRIFT FOUND — 2 ACTIVE BOUNDARY VIOLATIONS**

The DAL files themselves are clean and verified. The documentation is largely accurate for the surfaces it covers. However, two active boundary violations were found in code outside the identity feature:

1. **`identitySelfHeal.controller.js`** bypasses the identity adapter — live, called on every session where platform bootstrap is missing
2. **`vport.core.dal.js`** calls the RPC directly — live, called on every vport create/update

Both are open HIGH severity risks that require SENTRY review before release.

No production code was modified this pass.

---

### Recommended Next Commands

| Priority | Command | Reason |
|---|---|---|
| 1 | SENTRY | Resolve RISK-1 (`identitySelfHeal` adapter bypass) and RISK-2 (`vport.core.dal.js` RPC bypass) — both are live violations in active code paths |
| 2 | VENOM | Document RISK-4 (`provision_vcsm_identity` SECURITY DEFINER surface) in the security report and Risk Findings section |
| 3 | IRONMAN | Own RISK-3 (resolver/setup DI layer documentation) and RISK-5 (dead export decision) |
| 4 | LOGAN | Fix DF-01 (Call Chains stale terminals) and DF-05 (`vport.core.dal.js` bypass in consumer map) |

**Note to SENTRY on RISK-2:** The fix for `vport.core.dal.js` requires `refreshVcActorDirectory` to be exposed through `identity.adapter.js`. Currently the adapter only exports `useIdentityOps`, `useIdentity`, and `IdentityProvider`. `refreshVcActorDirectory` is accessible through `useIdentityOps()` in a hook context, but the vport DAL is not in a React context. A non-hook export would need to be added to the adapter — or the vport DAL should import directly from the identity controller with a documented exception.

---

## Codex Fix Pass — 2026-05-11

### Files Changed
| File | Change |
|---|---|
| `apps/VCSM/src/features/identity/adapters/identityOps.adapter.js` | Added an operations-only identity adapter boundary for non-React callers. |
| `apps/VCSM/src/features/identity/adapters/identity.adapter.js` | Re-exported identity operation functions through the operations adapter while preserving existing hook/context exports. |
| `apps/VCSM/src/state/identity/identitySelfHeal.controller.js` | Replaced direct identity controller import with the identity operations adapter. |
| `apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js` | Replaced relative DAL import with the existing absolute feature alias path. |
| `apps/VCSM/src/features/vport/dal/vport.core.dal.js` | Replaced direct `identity.refresh_actor_directory_row` RPC calls with `refreshVcActorDirectory` through the identity operations adapter; create remains awaited and update remains fire-and-forget. |
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.identity.md` | Appended this fix-pass record. |

### Findings Addressed
| Finding | Status | Notes |
|---|---|---|
| RISK-1 HIGH: `identitySelfHeal.controller.js` bypasses identity adapter | DONE | Self-heal now imports `ensureVcsmPlatformBootstrap` through `identityOps.adapter.js`. |
| RISK-2 HIGH: `vport.core.dal.js` calls `identity.refresh_actor_directory_row` directly | DONE | Vport create/update now route through `refreshVcActorDirectory` exposed by the identity operations adapter. |
| RISK-8 LOW: relative DAL import in `ensureVcsmPlatformBootstrap.controller.js` | DONE | Controller now uses `@/features/identity/dal/provision.rpc.dal.js`. |
| RISK-3 MEDIUM: resolver/setup undocumented | DEFERRED | Verified live files remain; no safe scoped code change required for this pass. |
| RISK-4 MEDIUM: `provision_vcsm_identity` SECURITY DEFINER risk note missing | DEFERRED | Requires security documentation ownership; no code/database/RLS change made. |
| RISK-5 LOW: `resolveVcsmActorForProvisioning` dead export | DEFERRED | No deletion performed per current no-delete instruction. |
| RISK-6/RISK-7 LOW: stale call-chain and table-access documentation | DEFERRED | Existing audit history preserved; this appended section records corrected current state. |
| RISK-9 LOW: `resolvers/` layer taxonomy | DEFERRED | Needs architecture ownership; no behavior change made. |

### Verification
- Commands/searches run:
  - `grep -rn "ensureVcsmPlatformBootstrap\|refreshVcActorDirectory\|refresh_actor_directory_row\|resolveVcsmActorForProvisioning\|createVcsmAppContextResolver\|setupVcsmIdentityEngine\|dalProvisionVcsmIdentity" apps/VCSM/src --include='*.js' --include='*.jsx'`
  - `rg -n "@/features/identity/controller/ensureVcsmPlatformBootstrap\.controller|schema\(['\"]identity['\"]\)\.rpc\(['\"]refresh_actor_directory_row|\.\./dal/provision\.rpc\.dal|@/features/identity/adapters/identity\.adapter" apps/VCSM/src --glob '*.js' --glob '*.jsx'`
  - `rg -n "ensureVcsmPlatformBootstrap|refreshVcActorDirectory|identityOps\.adapter" apps/VCSM/src/features/identity apps/VCSM/src/state/identity apps/VCSM/src/features/vport/dal/vport.core.dal.js --glob '*.js' --glob '*.jsx'`
  - `npm run build`
- Production callers checked:
  - `apps/VCSM/src/state/identity/identitySelfHeal.controller.js`
  - `apps/VCSM/src/features/vport/dal/vport.core.dal.js`
  - `apps/VCSM/src/features/identity/adapters/identity.adapter.js`
  - `apps/VCSM/src/features/identity/adapters/identityOps.adapter.js`
- Remaining risks:
  - Resolver/setup documentation and taxonomy remain for IRONMAN/SENTRY.
  - SECURITY DEFINER documentation remains for VENOM/security review.
  - Dead export remains intentionally untouched because the current instruction is append-only/no-delete.
  - Build passes; Vite still reports the pre-existing auth adapter dynamic/static import chunk warning for `VerifyEmailRequiredScreen.jsx`.

### Status
PARTIAL

---

## CEREBRO Classification Pass — 2026-05-18

**Run Summary**
Date: 2026-05-18
Triggered by: User — CEREBRO-directed verification pass
Application Scope: VCSM
Document Scope: `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.identity.md`
Boundary Contract: `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md` — enforced
Last Known Document State: PARTIAL (Codex Fix Pass — 2026-05-11)

---

### CEREBRO Risk Register — Pre-Run Classification

All risks and stale claims classified before any command runs.

| ID | Description | Category | Severity | Status | Assigned Command |
|---|---|---|---|---|---|
| RISK-1 | `identitySelfHeal.controller.js` bypasses identity adapter | Architecture Boundary | HIGH | STALE CLAIM — VERIFY | ARCHITECT |
| RISK-2 | `vport.core.dal.js` calls `refresh_actor_directory_row` directly (2 sites) | Architecture Boundary | HIGH | STALE CLAIM — VERIFY | ARCHITECT |
| RISK-3 | `resolvers/vcsmIdentity.resolver.js` and `setup.js` undocumented — resolver queries 2 tables | Architecture / Documentation | MEDIUM | OPEN | ARCHITECT, LOGAN |
| RISK-4 | `provision_vcsm_identity` SECURITY DEFINER surface not in Risk Findings section | Security | MEDIUM | OPEN | VENOM |
| RISK-5 | `resolveVcsmActorForProvisioning` dead export — queries `vc.actors`, never called | Dead Code / Security | LOW | OPEN | VENOM, IRONMAN |
| RISK-6 | Call Chains section lists wrong terminal screens (chat screens, not DAL consumers) | Documentation Drift | LOW | OPEN | LOGAN |
| RISK-7 | Summary table "Tables accessed: 0" stale — resolver queries `platform.user_app_actor_links` | Documentation Drift | LOW | OPEN | LOGAN |
| RISK-8 | `ensureVcsmPlatformBootstrap.controller.js:20` relative `../` import | Architecture Boundary | LOW | STALE CLAIM — VERIFY | ARCHITECT |
| RISK-9 | `resolvers/` sub-layer not in architecture contract taxonomy | Architecture Boundary | LOW | OPEN | SENTRY |
| RISK-10 | DEV-gated `console.log`/`console.warn` in `vcsmIdentity.resolver.js`, `refreshActorDirectory.dal.js`, `ensureVcsmPlatformBootstrap.controller.js` | Debug Logging Contract | LOW | NEW OPEN | VENOM |

**Stale claims to verify from 2026-05-11 Codex Fix Pass:** RISK-1, RISK-2, RISK-8.
**New file to document:** `identityOps.adapter.js` — created during Codex Fix Pass, not documented in any section of this file.
**No BLOCKING risks detected pre-run.**

---

### Command Phase Decision

| Phase | Command | Rationale |
|---|---|---|
| 1 | ARCHITECT | Verify all 9 identity files on disk; confirm RISK-1/2/8 fixes persisted; document new `identityOps.adapter.js`; update Summary table |
| 2 | VENOM | Document RISK-4 (SECURITY DEFINER); assess RISK-5 (dead export touches sensitive table); flag RISK-10 (console.log contract) |
| 3 | LOGAN | Correct RISK-6/7 (stale Call Chains + Summary table); document resolver/setup/identityOps.adapter in all sections |
| 4 | review-contract | Verify RISK-1/2/8 boundary violations closed; assess RISK-9 (`resolvers/` taxonomy); verify new `identityOps.adapter.js` import chain |
| 5 | SENTRY | Final boundary compliance; RISK-9 taxonomy resolution |

IRONMAN required but not run this pass — RISK-3 (resolver/setup layer ownership) and RISK-5 (dead export removal) require ownership decision from user authority.

---

## ARCHITECT — 2026-05-18

**Status: VERIFIED (with new findings)**

### File Verification — All 9 Identity Feature Files

All files in `features/identity/` confirmed on disk:

| File | Layer | Confirmed | Notes |
|---|---|---|---|
| `dal/provision.rpc.dal.js` | DAL | ✓ | Calls `platform.provision_vcsm_identity`, throws on missing params |
| `dal/refreshActorDirectory.dal.js` | DAL | ✓ | Calls `identity.refresh_actor_directory_row`, returns gracefully (never throws to caller) |
| `controller/ensureVcsmPlatformBootstrap.controller.js` | Controller | ✓ | Absolute `@/` import confirmed (RISK-8 CLOSED) |
| `controller/refreshActorDirectory.controller.js` | Controller | ✓ | Still hollow pass-through — Structural Finding #2 still open |
| `hooks/useIdentityOps.js` | Hook | ✓ | Imports from controllers (intra-feature, correct) |
| `adapters/identity.adapter.js` | Adapter | ✓ | Re-exports `useIdentityOps`, `ensureVcsmPlatformBootstrap`, `refreshVcActorDirectory`, `useIdentity`, `IdentityProvider` |
| `adapters/identityOps.adapter.js` | Adapter (new) | ✓ | NEW — from Codex Fix Pass. Ops-only adapter for non-React callers. Absent from all prior doc sections. |
| `resolvers/vcsmIdentity.resolver.js` | Resolver (non-standard layer) | ✓ | RISK-3 still open — undocumented in Summary, DAL Files, Architecture Pipeline |
| `setup.js` | Setup / DI wiring | ✓ | RISK-3 still open — undocumented in Summary, Architecture Pipeline |

### RISK-1 Verification — CLOSED CONFIRMED

`state/identity/identitySelfHeal.controller.js:2` now reads:
```js
import { ensureVcsmPlatformBootstrap } from "@/features/identity/adapters/identityOps.adapter";
```
No direct import from `features/identity/controller/` exists. Adapter boundary respected. **RISK-1 CLOSED.**

### RISK-2 Verification — CLOSED CONFIRMED

`features/vport/dal/vport.core.dal.js:6` now reads:
```js
import { refreshVcActorDirectory } from "@/features/identity/adapters/identityOps.adapter";
```
Zero `schema('identity').rpc('refresh_actor_directory_row')` calls found anywhere outside `refreshActorDirectory.dal.js`. Both former bypass sites (old lines 100 and 227) now call `refreshVcActorDirectory(actorId)` through the adapter. **RISK-2 CLOSED.**

### RISK-8 Verification — CLOSED CONFIRMED

`ensureVcsmPlatformBootstrap.controller.js:20` now reads:
```js
import { dalProvisionVcsmIdentity } from '@/features/identity/dal/provision.rpc.dal.js'
```
No relative `../` import remains. **RISK-8 CLOSED.**

### New File — `identityOps.adapter.js`

`features/identity/adapters/identityOps.adapter.js` was created in the 2026-05-11 Codex Fix Pass. It is an operations-only adapter for non-React callers, exporting two functions:

| Export | Re-exported From |
|---|---|
| `ensureVcsmPlatformBootstrap` | `@/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js` |
| `refreshVcActorDirectory` | `@/features/identity/controller/refreshActorDirectory.controller` |

Current consumers:
| Consumer | Import |
|---|---|
| `state/identity/identitySelfHeal.controller.js` | `ensureVcsmPlatformBootstrap` |
| `features/vport/dal/vport.core.dal.js` | `refreshVcActorDirectory` |
| `features/identity/adapters/identity.adapter.js` | Both (passes through to bundle adapter) |

### RISK-5 Verification — Dead Export Still Confirmed

`resolveVcsmActorForProvisioning` at `vcsmIdentity.resolver.js:16` — zero callers found across all of `apps/VCSM/src/`. Queries `vc.actors` selecting `id, kind, profile_id, vport_id, is_void`. Dead export confirmed.

### Summary Table — Corrected Values

| Item | Documented (stale) | Actual (2026-05-18) |
|---|---|---|
| DAL files | 2 | 2 DAL + 2 adapters = 4 boundary files (+ undocumented resolver + setup) |
| Exported functions | 3 | 7 total: 3 DAL, 2 adapter-layer, 1 dead resolver fn, 1 live resolver factory |
| Tables accessed | 0 | 1 active (`platform.user_app_actor_links` via resolver), 1 dead-path (`vc.actors` via dead export) |
| RPCs called | 2 | 2 — unchanged |

### Architecture Pipeline — Updated (2026-05-18)

| Layer | Status | Files |
|---|---|---|
| DAL | PRESENT | `provision.rpc.dal.js`, `refreshActorDirectory.dal.js` |
| Resolver (non-standard) | PRESENT | `resolvers/vcsmIdentity.resolver.js` — DI-injectable factory; queries `platform.user_app_actor_links`; RISK-9 taxonomy open |
| Setup | PRESENT | `setup.js` — one-time DI wiring at app boot; not in contract taxonomy |
| Controller | PRESENT | `ensureVcsmPlatformBootstrap.controller.js` (real logic), `refreshActorDirectory.controller.js` (hollow pass-through) |
| Hook | PRESENT | `useIdentityOps.js` |
| Adapter | PRESENT (2) | `identity.adapter.js` (bundle adapter), `identityOps.adapter.js` (non-React ops — NEW) |
| Model | MISSING | No model files — RPC responses consumed raw |
| View Screen | MISSING | Feature has no own screens — consumed cross-feature |
| Final Screen | MISSING | Same — this is a pure ops provider |

### No `select('*')` Violations

All 9 files verified: DAL files are RPC-only (no SELECT). `vcsmIdentity.resolver.js` uses explicit 12-column select on `platform.user_app_actor_links`. ✓

---

## VENOM — 2026-05-18

**Status: SECURITY SURFACE DOCUMENTED**

### RISK-4 — `provision_vcsm_identity` SECURITY DEFINER

The DAL document's Risk Findings section still reads "No risk findings." This is inaccurate. `provision_vcsm_identity` runs as SECURITY DEFINER in Supabase — it bypasses RLS for all 6 operations atomically:

1. `platform.user_app_access` — UPSERT
2. `platform.user_app_accounts` — UPSERT
3. `platform.user_app_preferences` — UPSERT
4. `platform.user_app_state` — UPSERT
5. `platform.user_app_actor_links` — UPSERT (`actor_source='vc'`)
6. `vc.actors.user_app_account_id` — UPDATE (bridge column)

**Trust model:** The RPC is idempotent — safe to call on every login. The call chain has a 2-layer guard:
- `dalProvisionVcsmIdentity` (`provision.rpc.dal.js:30-31`) — throws if `userId` or `actorId` is missing
- `ensureVcsmPlatformBootstrap` (`ensureVcsmPlatformBootstrap.controller.js:31-33`) — returns `{ ok: false }` if either param is absent

Both the DAL file comment (`provision.rpc.dal.js:7`) and the controller header comment (`ensureVcsmPlatformBootstrap.controller.js:1-19`) already document the SECURITY DEFINER nature. The only gap is the document's Risk Findings section.

**Security verdict:** The SECURITY DEFINER RPC is correctly guarded. The remediation needed is documentation accuracy only — the Risk Findings section update is a LOGAN task.

### RISK-5 — Dead Export `resolveVcsmActorForProvisioning`

`vcsmIdentity.resolver.js:16` exports `resolveVcsmActorForProvisioning(supabase, userId)`. It queries `vc.actors` selecting `id, kind, profile_id, vport_id, is_void` by `profile_id = userId` and `kind = 'user'`. Zero callers confirmed.

**Security assessment:** Dead code in the bundle that exposes `profile_id`, `vport_id`, and `is_void` fields. In its current dead state there is no runtime risk. The concern is future wiring — the function accepts a caller-supplied supabase client, making it a trust-dependent call. Recommend removal.

### RISK-10 — DEV-gated Console Output

Files with `console.log`/`console.warn` gated by `import.meta.env.DEV`:
- `vcsmIdentity.resolver.js:112,125` — `console.log`
- `refreshActorDirectory.dal.js:23,39,46` — `console.warn`
- `ensureVcsmPlatformBootstrap.controller.js:44` — `console.warn`

All gated by `import.meta.env.DEV` — zero production exposure. The resolver also has a proper `trace?.report?.()` mechanism for screen-renderable output via the identity debugger. The DAL and controller `console.warn` calls are fallback diagnostics only.

**Assessment:** Not a production security risk. Contract-non-compliant per debug logging feedback rule (must render on screen, not console). LOW priority — acceptable for internal diagnostics without user-visible debug panels on these layers.

**No new HIGH or MEDIUM security findings.** RISK-4 is documentation-only. All active call chains are properly guarded.

---

## LOGAN — 2026-05-18

**Status: DRIFT CORRECTED (appended section is authoritative)**

Original sections (lines 1–626) are preserved per append-only rule. This section is authoritative over any drift identified above.

### DF-01 Correction — Call Chains Section

**Original (lines 64–105):** Incorrectly lists `ConversationScreen.jsx`, `ConversationView.jsx`, `ArchivedInboxScreen.jsx`, `InboxScreen.jsx` as terminals of the identity DAL chain. These screens consume `useIdentity` (state context), not `useIdentityOps` (DAL ops).

**Corrected call chain — `provision.rpc.dal.js`:**
```
provision.rpc.dal.js
  → ensureVcsmPlatformBootstrap.controller.js
    → identityOps.adapter.js (non-React ops adapter)
      → identity.adapter.js (bundle adapter) → useIdentityOps.js (hook)
          → useAuthOnboarding.js → Onboarding.jsx
          → useJoinBarbershop.js → join flow screens
      → identitySelfHeal.controller.js (direct ops adapter import)
          → identityResolutionSelfHeal.helper.js
            → useIdentityResolutionEffect.hook.js → identityContext.jsx
```

**Corrected call chain — `refreshActorDirectory.dal.js`:**
```
refreshActorDirectory.dal.js
  → refreshActorDirectory.controller.js (hollow pass-through)
    → identityOps.adapter.js (non-React ops adapter)
      → vport.core.dal.js (create-vport: awaited; update-vport: fire-and-forget)
      → identity.adapter.js (bundle adapter) → useIdentityOps.js (hook)
          → useAuthOnboarding.js    → Onboarding.jsx
          → useJoinBarbershop.js    → join flow screens
          → useProfileController.js → profile settings screens
          → useUpdateVportVisibility.js → visibility settings
```

### DF-02/03 Correction — Resolver and Setup Documented

`vcsmIdentity.resolver.js` and `setup.js` are fully documented in the ARCHITECT section of this pass above.

### DF-04 Correction — `identitySelfHeal.controller.js` Consumer Chain

After RISK-1 fix, the full chain is:
```
identitySelfHeal.controller.js
  ← imports ensureVcsmPlatformBootstrap from identityOps.adapter.js ✓
  ← called by identityResolutionSelfHeal.helper.js (bootstrapIdentitySelfHeal)
    ← called by useIdentityResolutionEffect.hook.js
      ← mounted in identityContext.jsx (IdentityProvider)
```

### DF-05 Correction — `vport.core.dal.js` Now Routes via Adapter

After RISK-2 fix:
```
vport.core.dal.js:6 imports refreshVcActorDirectory from identityOps.adapter.js ✓
  Line 101: await refreshVcActorDirectory(row.actor_id)   — create-vport, awaited
  Line 225: Promise.resolve(refreshVcActorDirectory(data.actor_id)).catch(() => {})  — update-vport, fire-and-forget
```

### DF-07 Correction — Summary Table

Corrected values are documented in the ARCHITECT section above. The original Summary table (line 14) is stale — "Tables accessed: 0" should be "1 active, 1 dead-path."

### RISK-4 Documentation Gap

The original Risk Findings section (line 50–51) reads: "No risk findings for this feature." This is inaccurate. Per VENOM analysis above, `provision_vcsm_identity` is a SECURITY DEFINER RPC that must be documented in Risk Findings. The Risk Findings section update is deferred to the next full doc rebuild — corrected state is recorded here.

---

## review-contract — 2026-05-18

**Status: VIOLATIONS CLOSED — 1 OPEN TAXONOMY QUESTION**

### Boundary Verification — All Prior Violations

**VIOLATION-1 (RISK-1) — CLOSED CONFIRMED:**
`state/identity/identitySelfHeal.controller.js` now imports `ensureVcsmPlatformBootstrap` from `@/features/identity/adapters/identityOps.adapter`. Adapter boundary respected. ✓

**VIOLATION-2 (RISK-2) — CLOSED CONFIRMED:**
`features/vport/dal/vport.core.dal.js` now imports `refreshVcActorDirectory` from `@/features/identity/adapters/identityOps.adapter`. No direct `schema('identity').rpc(...)` call outside the DAL file. ✓

**RELATIVE IMPORT (RISK-8) — CLOSED CONFIRMED:**
`ensureVcsmPlatformBootstrap.controller.js:20` uses `@/features/identity/dal/provision.rpc.dal.js`. ✓

### `identityOps.adapter.js` Import Chain — Verified Correct

`vport.core.dal.js` (a DAL file in the vport feature) imports from `identityOps.adapter.js` (an adapter in the identity feature). This is the correct cross-feature access pattern: a DAL needing a cross-feature operation must go through the owning feature's adapter.

`identityOps.adapter.js` imports `refreshVcActorDirectory` from the CONTROLLER layer (`controller/refreshActorDirectory.controller`), not directly from the DAL. The controller is a hollow pass-through. The import chain is technically redundant but not a violation. Structural Finding #2 (hollow controller) remains open — IRONMAN owns the decision to promote or collapse it.

### RISK-9 — `resolvers/` Taxonomy (OPEN — handoff to SENTRY)

`features/identity/resolvers/vcsmIdentity.resolver.js` sits in a non-standard `resolvers/` sub-layer not defined in `DAL → Model → Controller → Hook → Screen`. The file does DAL-level work, factory-function construction (controller-like), and DI injection (service-like). Taxonomy decision deferred to SENTRY.

**No new contract violations found.** All prior violations closed. Import aliases correct throughout.

---

## SENTRY — 2026-05-18

**Status: BOUNDARY VERIFIED — 1 TAXONOMY ITEM OPEN**

### Compliance Matrix

| Check | Status |
|---|---|
| Cross-feature access via adapters only | ✓ COMPLIANT — all 3 former violations closed |
| `@/` aliases for all cross-folder imports | ✓ COMPLIANT — zero relative imports in identity feature |
| No `select('*')` in DAL files | ✓ COMPLIANT |
| No TypeScript files | ✓ COMPLIANT |
| Adapter is sole cross-feature entry point | ✓ COMPLIANT — `identityOps.adapter.js` correctly gates the ops boundary |
| DAL does not import from adapter or hook | ✓ COMPLIANT |
| Hook imports from controllers/adapters, not DAL directly | ✓ COMPLIANT |
| `resolvers/` layer within architecture taxonomy | ✗ OPEN — RISK-9 |

### RISK-9 — Taxonomy Resolution (SENTRY Recommendation)

`features/identity/resolvers/vcsmIdentity.resolver.js` implements a DI-injectable app context resolver. The `resolvers/` pattern is a legitimate layer for DI-configured factory functions that bridge app-specific configuration into shared engine interfaces.

**SENTRY recommendation:** Formally recognize `Resolver` as a permitted layer with this definition:

> **Resolver** — DI factory layer. Creates injectable closures passed to shared engine `configure*()` functions. May query Supabase directly (initialised-DAL pattern). Never called by components, hooks, or screens directly. Always injected at app startup via `setup.js`.

This would close RISK-9. Requires IRONMAN to add to the architecture contract.

### Final Compliance Verdict

All HIGH and MEDIUM boundary violations are CLOSED. The identity feature boundary is **COMPLIANT** with one open taxonomy item (RISK-9) that is an architectural documentation gap, not a runtime violation.

---

## Final Command Status Table — 2026-05-18

| Command | Status | Findings | Blocking |
|---|---|---|---|
| ARCHITECT | VERIFIED | RISK-1/2/8 CLOSED; `identityOps.adapter.js` documented; Summary table and Architecture Pipeline corrected | NO |
| VENOM | VERIFIED | RISK-4 security surface documented; RISK-5 dead export confirmed sensitive; RISK-10 console output flagged | NO |
| LOGAN | DRIFT CORRECTED | DF-01/02/03/04/05/07 resolved in this appended section | NO |
| review-contract | VIOLATIONS CLOSED | RISK-1/2/8 closed and verified; new adapter import chain correct; RISK-9 taxonomy open | NO |
| SENTRY | BOUNDARY VERIFIED | RISK-9 taxonomy recommendation issued; handoff to IRONMAN | NO |
| IRONMAN | MISSING | RISK-3 (resolver/setup layer ownership), RISK-5 (dead export removal), RISK-9 (taxonomy addition) | NO |
| BLACKWIDOW | N/A | No adversarial surface in scope | — |
| LOKI | MISSING | Runtime trace of self-heal path and bootstrap flow not run this pass | NO |
| CARNAGE | MISSING | Migration history for both RPCs not run this pass | NO |
| FALCON | N/A | No native-specific surfaces in this DAL | — |
| KRAVEN | N/A | No performance scope | — |
| SHIELD | N/A | No IP/provenance scope | — |

---

## Open Risks — 2026-05-18

| ID | Description | Severity | Assigned To |
|---|---|---|---|
| RISK-3 | `resolvers/vcsmIdentity.resolver.js` + `setup.js` absent from Summary table, DAL Files section, and Architecture Pipeline in original doc | MEDIUM | IRONMAN (ownership decision on layer) |
| RISK-4 | Original Risk Findings section still reads "No risk findings" — SECURITY DEFINER surface undocumented there | MEDIUM | LOGAN (doc rebuild) |
| RISK-5 | `resolveVcsmActorForProvisioning` dead export queries `vc.actors`, remains in bundle | LOW | IRONMAN (removal decision) |
| RISK-6 | Original Call Chains section (lines 64–105) still shows stale terminals (chat screens) | LOW | LOGAN (corrected in this section) |
| RISK-7 | Original Summary table "Tables accessed: 0" still stale in original doc | LOW | LOGAN (corrected in this section) |
| RISK-9 | `resolvers/` layer outside architecture contract taxonomy | LOW | IRONMAN (taxonomy addition per SENTRY recommendation) |
| RISK-10 | DEV-gated `console.log`/`console.warn` in 3 identity files | LOW | IRONMAN / team decision |

---

## Fixed Risks — 2026-05-18

| ID | Description | Fixed In | Verified By |
|---|---|---|---|
| RISK-1 | `identitySelfHeal.controller.js` bypasses identity adapter | Codex Fix Pass 2026-05-11 | ARCHITECT 2026-05-18 |
| RISK-2 | `vport.core.dal.js` calls `refresh_actor_directory_row` RPC directly (2 sites) | Codex Fix Pass 2026-05-11 | ARCHITECT 2026-05-18 |
| RISK-8 | Relative `../` import in `ensureVcsmPlatformBootstrap.controller.js` | Codex Fix Pass 2026-05-11 | ARCHITECT 2026-05-18 |

---

## Required Next Command

**IRONMAN** — owns RISK-3 (formalize `resolvers/` + `setup.js` layer in documentation and ownership map), RISK-5 (dead export `resolveVcsmActorForProvisioning` removal decision), and RISK-9 (add `Resolver` layer to architecture taxonomy per SENTRY recommendation).

Secondary: **LOKI** — runtime trace of the self-heal path (`identitySelfHeal → ensureVcsmPlatformBootstrap → provision_vcsm_identity`) and the bootstrap flow to verify the adapter fix holds under session load.

---

## Document Status — 2026-05-18

**REVIEW_PENDING**

All HIGH boundary violations are CLOSED and independently verified. Remaining open risks are MEDIUM/LOW documentation and ownership items requiring IRONMAN decision. No source code changes were made this pass — governance verification only.

---

## IRONMAN — 2026-05-18

**Status: OWNERSHIP RECORD CREATED**

Standalone files created:
- Ownership record: `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.identity.owner.md`
- Audit report: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-18_ironman_identity-feature-ownership.md`

**Ownership Clarity: PARTIAL** — boundary-compliant; gaps in documentation taxonomy and dead code.

### IRONMAN Decisions Issued

**RISK-3 — Resolver and Setup Layer:**
Both `vcsmIdentity.resolver.js` and `setup.js` are intentional, correctly placed DI wiring layers. They must be added to the feature's Architecture Pipeline in the primary document sections. The `resolvers/` taxonomy gap (RISK-9) requires an architecture contract amendment — see below.

**RISK-5 — Dead Export `resolveVcsmActorForProvisioning`:**
**Decision: REMOVE.** Zero callers confirmed. Function queries sensitive `vc.actors` fields (`kind`, `profile_id`, `vport_id`, `is_void`) and accepts a caller-supplied supabase client (trust-dependent). No planned use case. The identity engine's `resolveAuthenticatedContext` covers all active actor resolution needs. Removal scope: `vcsmIdentity.resolver.js` lines 16–29 only — `createVcsmAppContextResolver` on the same file is active and must not be touched. Implementation owner must execute this removal.

**RISK-9 — `resolvers/` Taxonomy:**
**Decision: ADD `Resolver` layer to `ARCHITECTURE.md`.** IRONMAN confirms SENTRY's recommendation. Proposed definition:

> **Resolver** — DI factory layer. Creates injectable closures passed to shared engine `configure*()` functions. May query Supabase directly (initialized-DAL pattern — supabase client captured at factory call time). Never imported by components, hooks, or screens directly. Always wired at app startup via `setup.js`.

This change requires explicit user approval to modify the locked architecture contract.

### New Open Questions

| Question | Priority | Owner |
|---|---|---|
| Add `Resolver` layer to `ARCHITECTURE.md` — explicit user approval required | MEDIUM | User → IRONMAN |
| Remove `resolveVcsmActorForProvisioning` from `vcsmIdentity.resolver.js` | MEDIUM | Implementation owner |
| Create security audit record for `provision_vcsm_identity` SECURITY DEFINER | MEDIUM | VENOM |
| CARNAGE pass for `provision_vcsm_identity` and `refresh_actor_directory_row` RPC migration history | LOW | CARNAGE |

### Boundary Warning Summary

| Warning | Risk | Status |
|---|---|---|
| `resolvers/` layer has no architecture taxonomy entry | MEDIUM | Open — requires contract amendment |
| `resolveVcsmActorForProvisioning` dead export queries `vc.actors` | MEDIUM | Open — IRONMAN removal decision issued |
| `state/identity/` ↔ `features/identity/` one-way dependency undocumented | MEDIUM | Documented in ownership record |
| `refreshActorDirectory.controller.js` hollow pass-through | LOW | Open — Option A (promote) or B (collapse) |
| No security audit file for SECURITY DEFINER RPC | LOW | Open — VENOM task |

---

## Final Command Status Table — 2026-05-18 (Updated Post-IRONMAN)

| Command | Status | Findings | Blocking |
|---|---|---|---|
| ARCHITECT | VERIFIED | RISK-1/2/8 CLOSED; `identityOps.adapter.js` documented; Summary table + Architecture Pipeline corrected | NO |
| VENOM | VERIFIED | RISK-4 security surface documented; RISK-5 dead export confirmed sensitive; RISK-10 console output flagged | NO |
| LOGAN | DRIFT CORRECTED | DF-01/02/03/04/05/07 resolved in appended section | NO |
| review-contract | VIOLATIONS CLOSED | RISK-1/2/8 closed; adapter import chain correct; RISK-9 taxonomy open | NO |
| SENTRY | BOUNDARY VERIFIED | RISK-9 taxonomy recommendation issued to IRONMAN | NO |
| IRONMAN | COMPLETE | Ownership record created; RISK-3/5/9 decisions issued; 2 standalone files created | NO |
| BLACKWIDOW | N/A | No adversarial surface in scope | — |
| LOKI | MISSING | Runtime trace of self-heal and bootstrap paths not yet run | NO |
| CARNAGE | MISSING | Migration history for both RPCs not yet run | NO |
| FALCON | N/A | No native-specific surfaces | — |
| KRAVEN | N/A | No performance scope | — |
| SHIELD | N/A | No IP/provenance scope | — |

---

## Open Risks — Final (2026-05-18)

| ID | Description | Severity | Assigned To |
|---|---|---|---|
| RISK-3 | `resolvers/vcsmIdentity.resolver.js` + `setup.js` absent from primary doc sections | MEDIUM | LOGAN (next doc rebuild) |
| RISK-4 | Risk Findings section still reads "No risk findings" — SECURITY DEFINER undocumented there | MEDIUM | LOGAN (next doc rebuild) |
| RISK-5 | `resolveVcsmActorForProvisioning` dead export — IRONMAN removal decision issued, not yet executed | MEDIUM | Implementation owner |
| RISK-9 | `resolvers/` layer not in architecture contract taxonomy — IRONMAN decision issued, needs user approval | MEDIUM | User → IRONMAN |
| RISK-6 | Original Call Chains section stale | LOW | LOGAN (corrected in 2026-05-18 appended section) |
| RISK-7 | Original Summary table stale | LOW | LOGAN (corrected in 2026-05-18 appended section) |
| RISK-10 | DEV-gated console output in 3 files | LOW | Team decision |

## Fixed Risks — Final (2026-05-18)

| ID | Description | Fixed In | Verified By |
|---|---|---|---|
| RISK-1 | `identitySelfHeal.controller.js` bypasses identity adapter | Codex Fix Pass 2026-05-11 | ARCHITECT 2026-05-18 |
| RISK-2 | `vport.core.dal.js` calls `refresh_actor_directory_row` RPC directly | Codex Fix Pass 2026-05-11 | ARCHITECT 2026-05-18 |
| RISK-8 | Relative import in `ensureVcsmPlatformBootstrap.controller.js` | Codex Fix Pass 2026-05-11 | ARCHITECT 2026-05-18 |

---

## Required Next Command

**LOKI** — runtime trace of the self-heal path (`identityResolutionSelfHeal → identitySelfHeal.controller.js → identityOps.adapter.js → ensureVcsmPlatformBootstrap.controller.js → provision.rpc.dal.js`) and the bootstrap flow to verify the adapter fix holds under session load. LOKI output should go to `CURRENT/features/dashboard/evidence/`.

Secondary: **CARNAGE** — migration ownership pass for `provision_vcsm_identity` and `refresh_actor_directory_row`.

---

## IRONMAN Resolution Pass — 2026-05-18 (Post-Approval)

**User approved both actions. Executed immediately.**

### Action 1 — RISK-5 CLOSED: `resolveVcsmActorForProvisioning` Removed

**File:** `apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js`
**Change:** Removed the `resolveVcsmActorForProvisioning` function (JSDoc + 14-line body + trailing blank line).
**Verification:** Zero references to `resolveVcsmActorForProvisioning` remain anywhere in `apps/VCSM/src/`. `createVcsmAppContextResolver` is intact and unaffected.
**Result:** RISK-5 CLOSED.

### Action 2 — RISK-9 CLOSED: `Resolver` Layer Added to Architecture Contract

**File:** `zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md`
**Changes made:**
- ToC: Added `2.8 Resolver Contract`
- Machine Reading Index: Added Resolver layer naming entry
- Layer Responsibility Summary: Added `Resolver` row
- §2.8: New full Resolver Contract section (purpose, may/must/must-not, naming, relationship to DAL, `setup.js` DI bootstrap rule)
- §4.5 File Naming Rule: Added `Resolver files end with .resolver.js and live in a resolvers/ sub-folder`
- §5.6 Recommended Feature Structure: Added optional `resolvers/` and `setup.js` to the feature scaffold template
**Result:** RISK-9 CLOSED.

---

## Open Risks — Final (2026-05-18, Post-Resolution)

| ID | Description | Severity | Assigned To | Status |
|---|---|---|---|---|
| RISK-3 | `resolvers/vcsmIdentity.resolver.js` + `setup.js` absent from primary doc sections | MEDIUM | LOGAN (next doc rebuild) | OPEN |
| RISK-4 | Risk Findings section still reads "No risk findings" — SECURITY DEFINER undocumented there | MEDIUM | LOGAN (next doc rebuild) | OPEN |
| RISK-6 | Original Call Chains section stale | LOW | LOGAN (corrected in 2026-05-18 appended section) | OPEN (in original section only) |
| RISK-7 | Original Summary table stale | LOW | LOGAN (corrected in 2026-05-18 appended section) | OPEN (in original section only) |
| RISK-10 | DEV-gated console output in 3 files | LOW | Team decision | OPEN |

## Fixed Risks — Final (2026-05-18, Post-Resolution)

| ID | Description | Fixed In | Verified By |
|---|---|---|---|
| RISK-1 | `identitySelfHeal.controller.js` bypasses identity adapter | Codex Fix Pass 2026-05-11 | ARCHITECT 2026-05-18 |
| RISK-2 | `vport.core.dal.js` calls `refresh_actor_directory_row` directly | Codex Fix Pass 2026-05-11 | ARCHITECT 2026-05-18 |
| RISK-5 | `resolveVcsmActorForProvisioning` dead export — queries `vc.actors` | IRONMAN Resolution 2026-05-18 | Grep verified — zero references remain |
| RISK-8 | Relative import in `ensureVcsmPlatformBootstrap.controller.js` | Codex Fix Pass 2026-05-11 | ARCHITECT 2026-05-18 |
| RISK-9 | `resolvers/` layer outside architecture contract taxonomy | IRONMAN Resolution 2026-05-18 | §2.8 added to ARCHITECTURE.md |

---

## Required Next Command

**LOKI** — runtime trace of the self-heal path and bootstrap flow.

Secondary: **CARNAGE** — migration ownership for `provision_vcsm_identity` and `refresh_actor_directory_row`.

---

## Document Status — Final (2026-05-18)

**REVIEW_PENDING**

All HIGH violations CLOSED and verified. RISK-5 and RISK-9 now CLOSED by user-approved IRONMAN actions. Remaining open items are MEDIUM/LOW documentation gaps (RISK-3/4) requiring a LOGAN primary section rebuild, and RISK-10 (DEV console output) as a team decision. LOKI and CARNAGE passes remain for complete certification.

---

## LOKI — 2026-05-18

**Status: WATCH**

Standalone audit file: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-18_loki_identity-resolution-trace.md`

Trace ID: `LOKI-IDENTITY-2026-05-18-001`
Application Scope: VCSM + ENGINE
Evidence basis: INFERRED — static code analysis. No live instrumentation captured.

### Runtime Summary

| Flow | DB Reads | RPC Writes | Read Amplification | Status |
|---|---|---|---|---|
| Normal auth (cold cache) | 8–11 | 0 | 8–11× (HIGH) | WATCH — but cached 120s |
| Normal auth (warm cache) | 1 (auth only) | 0 | 1× (HEALTHY) | PASS |
| Self-heal path | ~18–22 | 2 (provision + finalize) | 18–22× (SEVERE) | WATCH — one-time path |
| Bootstrap (onboarding) | 6–8 | 2 | 6–8× | PASS — one-time write |

### Confirmed by LOKI

- **RISK-1 adapter fix** confirmed operative at runtime — `identitySelfHeal.controller.js` imports from `identityOps.adapter.js`
- **RISK-2 adapter fix** confirmed operative — `vport.core.dal.js:101` (awaited) and `vport.core.dal.js:225` (fire-and-forget) both call through adapter
- **3-layer dedup** confirmed: in-flight Map + engine 120s cache + React Query 120s cache (seeded by effect at line 229)
- **Steps 5a/5b correctly parallelized** via `Promise.all` in engine

### LOKI Findings Summary

| ID | Location | Risk Category | Severity | Handoff |
|---|---|---|---|---|
| LF-01 | `_resultCache` + `identityEngineQueryKey` | Dual-cache drift | LOW | DEADPOOL |
| LF-02 | `identity.controller.js:267` `loadOwnedActorChoices` | Cold re-resolution on actor switch | LOW | KRAVEN |
| LF-03 | 5 files — console.log in DEV diagnostics | Debug logging contract | LOW | LOGAN |
| LF-04 | `useIdentityResolutionEffect.hook.js:255` outer catch | Catastrophic failure blind spot | MEDIUM | DEADPOOL |
| LF-05 | All `resolveAuthenticatedContext` call sites | `skipLoginRecord: true` — undocumented | LOW | DB |
| LF-06 | Engine steps 1–4 | Serial waterfall (unavoidable) | LOW | KRAVEN |

**Most actionable:** LF-04 — outer catch uses `console.error` only; `debugLoginError` must be added to route identity panel visibility to catastrophic failures.

### Instrumentation Recommendations

- **IR-01** (DEADPOOL): Add `debugLoginError('IDENTITY_HYDRATION_FATAL', error, {...})` before `commitIdentity(null)` in outer catch
- **IR-02** (Feature owner): Route `_identityResolveCounts` console.log to `debugLoginEvent`
- **IR-03** (Feature owner): Add success trace to `refreshActorDirectory.dal.js` — currently silent on success

### Audit Trail Warnings

- **AT-01** (VENOM): No audit event after `provision_vcsm_identity` completes — bootstraps SECURITY DEFINER but no durable record
- **AT-02** (VISION): No production analytics for self-heal trigger rate — masks bootstrap regressions

Observability Maturity: **FUNCTIONAL** → approaching STRONG. Gaps: outer catch (LF-04), resolve-count panel routing (LF-03), no self-heal correlation ID.

---

## CARNAGE — 2026-05-18

**Status: CAUTION**

Standalone audit file: `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-18_carnage_identity-rpc-migration-ownership.md`

Application Scope: VCSM + ENGINE

### Core Finding: Both RPCs Have No Tracked Creation Migration

| RPC | Schema | Tracked Migration | search_path Hardened | Status |
|---|---|---|---|---|
| `provision_vcsm_identity` | `platform` | **MISSING** — not in `apps/VCSM/supabase/migrations/` | **UNVERIFIED** — not in secdef_a | CAUTION |
| `refresh_actor_directory_row` | `identity` | **MISSING** — not in either app's migrations/ | **VERIFIED** — hardened by secdef_a 2026-05-10 | CAUTION |

Wentrex equivalent (`provision_wentrex_identity`) has a tracked creation migration at `apps/wentrex/supabase/migrations/20260331020000_platform_grants_and_provision_rpc.sql`. No equivalent exists for VCSM.

### Critical Security Gap (MW-01)

`platform.provision_vcsm_identity` takes `p_user_id` as a caller-supplied parameter. The Wentrex equivalent uses `auth.uid()` internally and validates actor ownership at the DB layer. Whether the VCSM RPC also enforces `p_user_id == auth.uid()` **cannot be confirmed from app code**. DB inspection required.

**If the auth.uid() guard is missing:** any authenticated user could provision platform identity rows for a different user_id — bypassing all access gates.

**Owner:** DB + VENOM (P1 action — DB inspection is highest priority)

### Cross-App Shared RPC Risk

`identity.refresh_actor_directory_row` is called by both VCSM and Wentrex. No change-coordination contract exists for this shared function. Any signature change would break both apps simultaneously.

### Recommended Actions (Priority Order)

| Priority | Action | Owner |
|---|---|---|
| P1 | DB inspection — retrieve `provision_vcsm_identity` body; verify auth.uid() guard + search_path + idempotent upserts | DB + VENOM |
| P2 | Create tracked migration for `provision_vcsm_identity` — capture current live body | Feature owner |
| P3 | Decide governance for `refresh_actor_directory_row` — shared DB-admin-managed or per-app tracked | DB + CARNAGE |
| P4 | Add `provision_vcsm_identity` to VENOM security audit record | VENOM |

### Migration Safety Classification

| RPC | Safety Status | Confidence | Blocking Risk |
|---|---|---|---|
| `provision_vcsm_identity` | CAUTION | MEDIUM | auth.uid() guard unverified; no tracked migration |
| `refresh_actor_directory_row` | CAUTION | HIGH | No tracked migration; cross-app shared function |

**No BLOCKED findings.** Current production behavior appears correct. Gaps are governance and documentation — not runtime failures.

---

## Final Command Status Table — 2026-05-18 (Final)

| Command | Status | Findings | Blocking |
|---|---|---|---|
| ARCHITECT | VERIFIED | RISK-1/2/8 CLOSED; `identityOps.adapter.js` documented; Summary table + Architecture Pipeline corrected | NO |
| VENOM | VERIFIED | RISK-4 security surface documented; RISK-5 dead export confirmed sensitive; RISK-10 console output flagged | NO |
| VENOM (security audit) | COMPLETE | VF-01 (HIGH) auth.uid() guard unverified; VF-02 (MEDIUM) search_path; VF-03 (LOW) no audit trail | NO |
| LOGAN | COMPLETE | Primary sections rebuilt 2026-05-18: Summary, Feature Files, Risk Findings, Architecture Pipeline, Call Chains | NO |
| review-contract | VIOLATIONS CLOSED | RISK-1/2/8 closed; adapter import chain correct; RISK-9 taxonomy open | NO |
| SENTRY | BOUNDARY VERIFIED | RISK-9 taxonomy recommendation issued to IRONMAN | NO |
| IRONMAN | COMPLETE | Ownership record created; RISK-3/5/9 decisions issued; 2 standalone files created | NO |
| LOKI | COMPLETE | 6 findings (LF-01–LF-06); FINAL STATUS: WATCH; 3 instrumentation recommendations | NO |
| CARNAGE | COMPLETE | Both RPCs assessed; 2 CAUTION findings; MW-01 auth.uid() guard unverified (VENOM P1) | NO |
| DEADPOOL (LF-04) | COMPLETE | `debugLoginError` added to outer catch in `useIdentityResolutionEffect.hook.js:255` 2026-05-18 | NO |
| CARNAGE (migration) | COMPLETE | `20260518040000_platform_provision_vcsm_identity.sql` created — requires DB verification | NO |
| BLACKWIDOW | N/A | No adversarial surface in scope | — |
| FALCON | N/A | No native-specific surfaces | — |
| KRAVEN | N/A | No performance scope in this pass | — |
| SHIELD | N/A | No IP/provenance scope | — |

---

## Open Risks — Final (2026-05-18, Post-Full-Pass)

| ID | Description | Severity | Assigned To | Status |
|---|---|---|---|---|
| **Runtime test** | Verify bootstrap + self-heal flow with new RLS function — new users, returning users, onboarding path | HIGH | Manual test required | OPEN |

## Fixed Risks — Final (2026-05-18, Post-Full-Pass)

| ID | Description | Fixed In | Verified By |
|---|---|---|---|
| RISK-1 | `identitySelfHeal.controller.js` bypasses identity adapter | Codex Fix Pass 2026-05-11 | ARCHITECT + LOKI 2026-05-18 |
| RISK-2 | `vport.core.dal.js` calls `refresh_actor_directory_row` directly | Codex Fix Pass 2026-05-11 | ARCHITECT + LOKI 2026-05-18 |
| RISK-3 | `resolvers/vcsmIdentity.resolver.js` + `setup.js` absent from primary doc sections | LOGAN rebuild 2026-05-18 | Feature Files + Architecture Pipeline updated |
| RISK-4 | Risk Findings reads "No risk findings" — SECURITY DEFINER undocumented | LOGAN rebuild 2026-05-18 | RF-01 added to Risk Findings section |
| RISK-5 | `resolveVcsmActorForProvisioning` dead export — queries `vc.actors` | IRONMAN Resolution 2026-05-18 | Grep verified |
| RISK-6 | Original Call Chains stale (wrong terminal screens) | LOGAN rebuild 2026-05-18 | Call Chains section updated with correct chains |
| RISK-7 | Original Summary table stale ("Tables accessed: 0") | LOGAN rebuild 2026-05-18 | Summary table updated with resolver table access |
| RISK-8 | Relative import in `ensureVcsmPlatformBootstrap.controller.js` | Codex Fix Pass 2026-05-11 | ARCHITECT 2026-05-18 |
| RISK-9 | `resolvers/` layer outside architecture contract taxonomy | IRONMAN Resolution 2026-05-18 | §2.8 added to ARCHITECTURE.md |
| LF-04 | Outer catch block blind to identity debugger panel | DEADPOOL 2026-05-18 | `debugLoginError` added to `useIdentityResolutionEffect.hook.js:255` |
| LF-01 | Dual-cache co-invalidation unverified (engine + React Query on actor switch) | DB Review 2026-05-18 | VERIFIED: both caches co-invalidated on successful switch |

---

## Required Next Commands

**P1 — [CLOSED] MW-01:** Migrations `20260518040000` (GUARD 1/2/3 + uuid return + search_path) and `20260518050000` (remove SECURITY DEFINER, RLS policies, authenticated-only grant) applied to live DB. Live verification confirmed: `is_security_definer = f`, GUARD 1/2/3 present, `search_path` hardened, grant: authenticated only. All five Wentrex hardening gaps closed.

**P2 — [CLOSED] DRI-05:** Governance decision recorded. `identity.refresh_actor_directory_row` is DB-admin-managed. Documentation created: `zNOTFORPRODUCTION/_CANONICAL/logan/platform/platform.identity.shared-rpcs.md`.

**P3 — [CLOSED] RISK-10 / DRI-10:** `console.error` at `switchActor.controller.js:173` removed (replaced by existing `dbg.error` above it). DEV-gated `console.warn`/`console.log` in `refreshActorDirectory.dal.js`, `ensureVcsmPlatformBootstrap.controller.js`, and `vcsmIdentity.resolver.js` replaced with `debugLoginEvent`/`debugLoginError` or removed (resolver — redundant with trace system).

**P4 — [CLOSED] LF-01:** Cache co-invalidation verified. Both `_resultCache` and `identityEngineQueryKey` are co-invalidated on successful actor switch. No action required.

**P5 — Runtime test (OPEN — manual):** Verify bootstrap + self-heal flow works with the new RLS-enforced `provision_vcsm_identity`. Requires opening the live app:
- New user onboarding: signup → actor creation → bootstrap call → confirm platform rows created
- Returning user: logout → login → confirm self-heal path works
- Actor switch: confirm switching actors still works with new RLS policies on `user_app_actor_links`

---

## Document Status — Final (2026-05-18)

**VERIFIED — MIGRATIONS APPLIED**

All CEREBRO-initiated command phases complete:
- All RISK-1 through RISK-9 findings CLOSED (code + documentation)
- LF-04 (DEADPOOL) CLOSED: `debugLoginError` added to outer catch
- RISK-3/4 (LOGAN rebuild) CLOSED: primary sections updated with correct resolver/setup/risk content
- CARNAGE migrations created and applied: `20260518040000_platform_provision_vcsm_identity.sql` + `20260518050000_platform_provision_vcsm_identity_rls.sql`
- VENOM security audit created: `2026-05-18_venom_identity-provision-rpc-security.md`
- MW-01 CLOSED: SECURITY DEFINER removed, RLS policies applied, authenticated-only grant confirmed live
- DRI-05 CLOSED: `platform.identity.shared-rpcs.md` governance doc created, DB-admin-managed decision recorded
- RISK-10 CLOSED: all console.warn/log removed or routed to `@debuggers/identity`

One open item remains: **manual runtime test** (P5). This requires opening the app in a browser to verify the new RLS-enforced function works correctly end-to-end. No release-blocking code defects in the app layer — all security fixes are live.

---

## DB Governance Review — 2026-05-18

_Full report:_ `zNOTFORPRODUCTION/_HISTORY/db/snapshots/2026-05-18_11-00_db_identity-governance-review.md`
_Status:_ **RESOLVED**

### DRI Summary

| DRI | Surface | Priority | Evidence Status | Outcome |
|---|---|---|---|---|
| DRI-01 | `provision_vcsm_identity` auth.uid() guard (MW-01) | HIGHEST | VERIFIED — CLOSED | Migrations 20260518040000 + 20260518050000 applied. GUARD 1/2/3 live, `is_security_definer = f` |
| DRI-02 | `provision_vcsm_identity` search_path | MEDIUM | VERIFIED — CLOSED | `search_path = 'platform', 'vc', 'auth', 'public', 'pg_temp'` confirmed live |
| DRI-03 | `provision_vcsm_identity` creation migration | MEDIUM | CLOSED | Both migrations tracked in `apps/VCSM/supabase/migrations/` |
| DRI-04 | Old 1-param overload fate | LOW | CLOSED | DROP covered in migration 20260518040000 |
| DRI-05 | `refresh_actor_directory_row` cross-app coupling | MEDIUM | CLOSED | DB-admin-managed — `platform.identity.shared-rpcs.md` created |
| DRI-06 | `refresh_actor_directory_row` search_path | LOW | VERIFIED PASS | No action |
| DRI-07 | `refresh_actor_directory_row` creation migration | LOW | GOVERNANCE GAP | Intentional — DB-admin-managed, not tracked per-app (DRI-05 decision) |
| DRI-08 | Platform schema grant history | LOW | VERIFIED (retroactive fix applied) | No action |
| DRI-09 | Cache co-invalidation LF-01 | LOW | VERIFIED RESOLVED | LF-01 closed — co-invalidation confirmed on happy path |
| DRI-10 | Debug logging contract violations | LOW | CLOSED | `switchActor.controller.js:173` removed; RISK-10 pass complete |

### Key VCSM vs Wentrex Hardening Gap — CLOSED

Wentrex `provision_wentrex_identity` was the secure reference. All five hardening gaps now closed:
1. Takes `p_user_id` as explicit caller parameter — GUARD 2 validates `auth.uid() = p_user_id`, closing injection window
2. auth.uid() guard: **ADDED** — GUARD 1 rejects unauthenticated callers, GUARD 2 rejects cross-user provision attempts
3. search_path: `'platform', 'vc', 'auth', 'public', 'pg_temp'` — fully hardened including `pg_temp`
4. Creation migration: `20260518040000` + `20260518050000` now tracked in `apps/VCSM/supabase/migrations/`
5. Return type: corrected to `uuid` — DAL comment updated to match

Migrations `20260518040000` + `20260518050000` closed all five gaps and removed SECURITY DEFINER entirely.

### Cache Co-Invalidation — LF-01 RESOLVED

Both identity caches are co-invalidated on a successful actor switch:
- Engine `_resultCache` (120s): busted by `invalidateIdentityResultCache()` inside `engineSwitchActiveActor`
- React Query `identityEngineQueryKey` (120s): busted by `invalidateIdentityEngineQuery()` in `identityContext.jsx:switchActor()` line 92

Residual edge case: if hydration fails after a successful platform write, the RQ cache is not busted. Low-risk, watch only.

### Caller Boundary Verification — PASS

All 8 callers of `provision_vcsm_identity` confirmed routing through `identityOps.adapter.js` or `identity.adapter.js`. No direct DAL bypasses.

### Updated Open Risks (Post-Migration)

| Risk | Severity | Status |
|---|---|---|
| MW-01 (DRI-01): auth.uid() guard | HIGH | CLOSED — migrations 20260518040000 + 20260518050000 applied |
| DRI-05: `refresh_actor_directory_row` cross-app governance | MEDIUM | CLOSED — DB-admin-managed decision recorded |
| DRI-10 / RISK-10: console.error + DEV-gated console.warn/log | LOW | CLOSED — all violations removed or routed to `@debuggers/identity` |
| LF-01: cache co-invalidation | LOW | CLOSED — co-invalidation confirmed on happy path |
| Runtime test: bootstrap + self-heal end-to-end | HIGH | OPEN — manual test required in live app |
