# Identity Orchestrator

**Ticket:** IDENTITY-010
**Status:** Complete — Planning Artifact
**Generated:** 2026-06-06
**Source reads:** IDENTITY_DEPENDENCY_SUMMARY.md · IDENTITY-005-chat-identity-dependency.md · IDENTITY_RISK_REGISTER.md · IDENTITY_TICKET_INDEX.md · all identity source files (features/identity + state/identity) · provision_vcsm_identity migration files
**Rule:** Every future identity change must update Section 9 of this document.

---

## 1. Purpose

This is the single source of truth for the VCSM identity architecture. Before any
implementation ticket modifies an identity file, the author must:

1. Read this document in full.
2. Locate the affected file in Section 5 (Blast Radius Matrix).
3. Confirm the required validation steps in Section 11.
4. Add a row to Section 9 (Orchestrator Update Rule) after the change ships.

This document tracks:
- All three identity layers and their files
- Every known consumer feature and its compliance status
- Blast radius per identity file
- Every DAL, what tables/RPCs it touches, and whether RLS covers it
- Open questions that require a policy decision before implementation

This document does NOT authorize changes. It documents what exists and what will break.

---

## 2. Identity Layers

The identity system has three distinct layers. Each layer has a different scope,
governance level, and allowed consumer set. The layers must not be collapsed.

---

### Layer 1 — Engine

| Property | Value |
|---|---|
| Path | `engines/identity/` |
| Alias | `@identity` |
| Purpose | Raw cross-app identity engine shared by VCSM, Wentrex, and any future app. Provides session resolution, actor link resolution, active actor switching, and identity cache invalidation. |
| Governance | Cross-app infrastructure — not VCSM-owned. Changes require engine-level review. |

**Confirmed engine exports used inside VCSM:**

| Export | Imported by | File |
|---|---|---|
| `configureIdentityEngine` | features/identity/setup.js | Engine setup — app startup only |
| `resolveAuthenticatedContext` | state/identity/identity.controller.js | Controller — resolves session → active actor |
| `invalidateIdentityResultCache` | state/identity/identityContext.jsx | Context — cache invalidation on refresh |
| `switchActiveActor` | state/identity/controller/switchActor.controller.js | Controller — writes platform preference on switch |

**Allowed consumers of `@identity`:**
- `apps/VCSM/src/features/identity/setup.js` — engine setup at app startup (configuration only)
- `apps/VCSM/src/state/identity/identity.controller.js` — resolves session through engine
- `apps/VCSM/src/state/identity/identityContext.jsx` — cache invalidation
- `apps/VCSM/src/state/identity/controller/switchActor.controller.js` — writes active actor preference

**Feature code (outside state/identity and features/identity/setup.js) must NOT import `@identity` directly.**
Zero `@identity` engine alias imports were found in `features/chat/` (IDENTITY-005 confirmed).
IDENTITY-004 must audit remaining features for any ENGINE_ALIAS sites.

**Risk if engine changed drastically:** All four allowed import sites above break. Identity
resolution fails on login. Actor switching fails. Cache invalidation fails on actor refresh.
All 41 consumer features stop receiving identity context.

---

### Layer 2 — App State

| Property | Value |
|---|---|
| Path | `apps/VCSM/src/state/identity/` |
| Purpose | VCSM-specific implementation: React context, Zustand store, identity controller, identity DAL, identity model, storage, selectors. This is the canonical implementation layer — the feature adapter re-exports from here. |
| Governance | App-internal infrastructure. The feature adapter is a governed entry point over this layer. |

**Files in this layer:**

| File | Role | Exports |
|---|---|---|
| `identityContext.jsx` | React context + provider + `useIdentity()` + `switchActor()` | `useIdentity`, `IdentityProvider`, `useIdentityDetailsDeprecated`, `useIdentityDisplayDeprecated` |
| `identitySelection.store.js` | Zustand store: active actor state | `useIdentitySelectionStore` — shape: `{ activeActorId, activeActorKind, activeActorLinkId, setActiveActor, clearActiveActor }` |
| `identity.controller.js` | Identity resolution controller — engine → hydration pipeline | `loadDefaultIdentityForUser`, `loadOwnedActorChoices`, `loadIdentityForActorId`, `hydrateIdentityActor`, `resolveRealmId`, `DELETED_ACCOUNT_SENTINEL` |
| `identity.read.dal.js` | All identity-related DB reads | `readIdentityActorByIdDAL`, `readIdentityActorsByIdsDAL`, `readProfileIdentityDAL`, `readVportIdentityDAL`, `readActorOwnerUserDAL`, `readActorPrivacyDAL`, `readActorPrivacyDiagnosticDAL`, `readPreferredRealmByVoidStateDAL`, `readFallbackRealmDAL`, `readUserActorByProfileIdDAL` |
| `identity.model.js` | Identity shape transformations | `toPublicIdentity`, `getIdentityEngineContext`, `isBlockedVportIdentity`, `mapProfileActor`, `mapVportActor` |
| `identityStorage.js` | LocalStorage persistence for actor selection | `saveIdentity`, `loadIdentity`, `clearIdentity`, `clearAllIdentityStorage` |
| `identitySelectors.js` | Zustand selectors and identity predicates | `isUserActor`, `isVportActor`, `canCitizenBook`, `getActorId`, `getRealmId`, `getDisplayName`, `getUsername`, `getAvatar`, `getBanner`, `getProfilePath` |
| `identityResolutionSelfHeal.helper.js` | Self-heal helper for resolution failures | Internal use only |
| `identitySelfHeal.controller.js` | Self-heal controller | Internal use only |
| `identitySwitcher.jsx` | Actor switcher UI component | Internal UI only |
| `IdentityDebugger.jsx` | Dev-only debugger component | Dev only |
| `useIdentityResolutionEffect.hook.js` | Resolution effect hook (extracted from identityContext) | Internal use only |
| `useIdentitySync.js` | Sync hook | Internal use only |
| `identity.controller.inflight.js` | In-flight dedup map + resolve count logger | `_identityInflight`, `_identityResolveCounts`, `logIdentityResolveCount` |
| `queries/identityEngineQuery.js` | React Query wrapper for engine query | `useIdentityEngineQuery`, `invalidateIdentityEngineQuery` |
| `controller/switchActor.controller.js` | Actor switch controller (decoupled from React) | `switchActorController` |

**Feature code should NOT import directly from `@/state/identity/*`** unless:
- The file is itself within `state/identity/` (internal use)
- It is an explicit exception documented in Section 3 of this orchestrator

**Risk if state layer changed drastically:** All 41 consumer features that depend on
`useIdentity()` lose their identity context. Actor switching stops working. Onboarding
identity load fails. Chat inbox scoping breaks. The feature adapter passes through to this
layer, so the adapter provides no protection against drastic state layer changes.

---

### Layer 3 — Feature Adapter

| Property | Value |
|---|---|
| Path | `apps/VCSM/src/features/identity/adapters/` |
| Purpose | Public governed boundary. All feature code reads identity through this surface. The adapter is a thin re-export layer — it does not implement logic, it re-exports from state/identity/ and features/identity/. |
| Governance | This is the enforced import target for all 41 consumer features. |

**Files in this layer:**

| File | Exports | Source |
|---|---|---|
| `identity.adapter.js` | `useIdentity`, `IdentityProvider`, `useIdentityOps`, `ensureVcsmPlatformBootstrap`, `refreshVcActorDirectory` | Re-exports from: `state/identity/identityContext`, `features/identity/hooks/useIdentityOps`, `features/identity/adapters/identityOps.adapter` |
| `identityOps.adapter.js` | `ensureVcsmPlatformBootstrap`, `refreshVcActorDirectory` | Re-exports from: `controller/ensureVcsmPlatformBootstrap.controller.js`, `controller/refreshActorDirectory.controller.js` |

**Not in adapter surface (confirmed):**
- `useIdentitySelectionStore` — the Zustand store is not re-exported by the feature adapter

**Full features/identity/ module files (not just adapters):**

| File | Role |
|---|---|
| `setup.js` | `setupVcsmIdentityEngine()` — called from `main.jsx` at app startup |
| `resolvers/vcsmIdentity.resolver.js` | VCSM app context resolver — injected into engine at setup |
| `hooks/useIdentityOps.js` | Thin hook returning `{ refreshVcActorDirectory, ensureVcsmPlatformBootstrap }` |
| `controller/ensureVcsmPlatformBootstrap.controller.js` | Calls `dalProvisionVcsmIdentity` — platform bootstrap |
| `controller/refreshActorDirectory.controller.js` | Calls `refreshVcActorDirectory` from DAL — thin pass-through |
| `dal/provision.rpc.dal.js` | Calls `platform.provision_vcsm_identity` RPC |
| `dal/refreshActorDirectory.dal.js` | Calls `identity.refresh_actor_directory_row` RPC |

**Risk if feature adapter changed drastically:** All 41 consumers fail at import time.
Every screen or hook using `useIdentity` stops compiling. This is the highest blast radius
file in the identity system.

---

## 3. Canonical Access Policy

The following access policy applies to all feature code in `apps/VCSM/src/features/`.

### Rule 1 — React components, screens, hooks

**Must import from:**
```js
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import { IdentityProvider } from '@/features/identity/adapters/identity.adapter'
import { useIdentityOps } from '@/features/identity/adapters/identity.adapter'
import { ensureVcsmPlatformBootstrap } from '@/features/identity/adapters/identity.adapter'
import { refreshVcActorDirectory } from '@/features/identity/adapters/identity.adapter'
```

**Must NOT import from:**
```js
// BANNED in feature code:
import { ... } from '@/state/identity/identityContext'     // bypass — RISK-004 Sub-risk A
import { ... } from '@/state/identity/identitySelection.store'  // ungoverned — RISK-004 Sub-risk B
import { ... } from '@identity'                             // engine alias — ENGINE_ALIAS violation
```

### Rule 2 — Non-React setup files requiring synchronous actor reads (OPEN QUESTION)

`chat/setup.js` uses `useIdentitySelectionStore.getState().activeActorId` to read the active
actor synchronously inside a non-React async function. This is the ONLY confirmed case.

**Current status:** Ungoverned. `useIdentitySelectionStore` is not in the feature adapter surface.

**Policy options (decision required — IDENTITY-FIX-002):**
- **Option A:** Expose `getActiveActorId()` from the feature adapter wrapping `useIdentitySelectionStore.getState()`.
  Setup files use this. Governs the surface formally.
- **Option B:** Document direct `identitySelection.store` access as explicitly allowed in setup files.
  Add a required comment format for any such access.
- **Option C:** Leave as-is. Accept the ungoverned surface — lowest friction, highest silent-break risk.

**Until this decision is made:** direct `identitySelection.store` access in `chat/setup.js`
is an ALLOWED EXCEPTION documented here. Do not expand this pattern.

### Rule 3 — Engine alias `@identity`

Allowed only in:
- `features/identity/setup.js` (configureIdentityEngine at startup)
- `state/identity/identity.controller.js` (resolveAuthenticatedContext)
- `state/identity/identityContext.jsx` (invalidateIdentityResultCache)
- `state/identity/controller/switchActor.controller.js` (switchActiveActor)

All other files are ENGINE_ALIAS violations. IDENTITY-004 must confirm no other sites exist.

### Rule 4 — state/identity/ as internal infrastructure

`state/identity/` is treated as internal app infrastructure. Feature code must not import
from it directly. Only the feature adapter and the state layer's own files may read from it.

**Explicit exception:** `useVexSettings.js` currently imports `useIdentity` from
`@/state/identity/identityContext` directly. This is a LOW-risk policy violation
(IDENTITY-FIX-001 patches it with a 1-line change). Until patched, it is a known bypass.

---

## 4. Current Consumer Map

Scanner-confirmed total: **41 inbound consumers**. All 41 pass through the feature adapter
(0 violations per scanner). Two STATE_LAYER exceptions confirmed in chat (IDENTITY-005).

### chat (10 import sites — IDENTITY-005 COMPLETE)

| File | Import path | Symbol | Layer | Status | Risk | Fix needed |
|---|---|---|---|---|---|---|
| `chat/conversation/screen/ConversationScreen.jsx:11` | `@/features/identity/adapters/identity.adapter` | `useIdentity` | Feature adapter | COMPLIANT | NONE | No |
| `chat/conversation/screen/ConversationView.jsx:4` | `@/features/identity/adapters/identity.adapter` | `useIdentity` | Feature adapter | COMPLIANT | NONE | No |
| `chat/inbox/screens/ArchivedInboxScreen.jsx:5` | `@/features/identity/adapters/identity.adapter` | `useIdentity` | Feature adapter | COMPLIANT | NONE | No |
| `chat/inbox/screens/InboxScreen.jsx:5` | `@/features/identity/adapters/identity.adapter` | `useIdentity` | Feature adapter | COMPLIANT | NONE | No |
| `chat/inbox/screens/RequestsInboxScreen.jsx:5` | `@/features/identity/adapters/identity.adapter` | `useIdentity` | Feature adapter | COMPLIANT | NONE | No |
| `chat/inbox/screens/SpamInboxScreen.jsx:5` | `@/features/identity/adapters/identity.adapter` | `useIdentity` | Feature adapter | COMPLIANT | NONE | No |
| `chat/inbox/screens/settings/BlockedUsersScreen.jsx:14` | `@/features/identity/adapters/identity.adapter` | `useIdentity` | Feature adapter | COMPLIANT | NONE | No |
| `chat/start/hooks/useStartConversation.js:19` | `@/features/identity/adapters/identity.adapter` | `useIdentity` | Feature adapter | COMPLIANT | NONE | No |
| `chat/inbox/hooks/useVexSettings.js:2` | `@/features/identity/adapters/identity.adapter` | `useIdentity` | Feature adapter | **COMPLETE** — IDENTITY-FIX-001 shipped 2026-06-06 | NONE | No |
| `chat/setup.js:16` | `@/state/identity/identitySelection.store` | `useIdentitySelectionStore` | State store | **STATE_STORE** | LOW-MEDIUM — store shape not governed | YES — IDENTITY-FIX-003 pending IDENTITY-FIX-002 decision |

### settings (8 import sites — IDENTITY-006 pending)

| Feature | Import path | Status | Risk | Fix needed |
|---|---|---|---|---|
| settings (all 8 sites) | `@/features/identity/adapters/identity.adapter` | COMPLIANT (scanner 0 violations) | LOW — read-only actor display | No |
| Subsystems: account, privacy, profile, vport | UNKNOWN exact files — IDENTITY-006 traces them | UNKNOWN exact | UNKNOWN | IDENTITY-006 |

**Note:** settings has 87 total cross-feature outbound imports. Its 8 identity imports
span 4 subsystems. Change-impact amplifier: any adapter surface change requires reviewing
all 8 sites.

### notifications (4 import sites — IDENTITY-007 pending)

| Feature | Import path | Status | Risk | Fix needed |
|---|---|---|---|---|
| notifications (4 sites) | `@/features/identity/adapters/identity.adapter` | COMPLIANT (scanner 0 violations) | LOW | No |
| Exact files | UNKNOWN — IDENTITY-007 traces them | — | — | IDENTITY-007 |

### profiles (UNKNOWN exact count — IDENTITY-008 pending)

| Feature | Import path | Status | Risk | Fix needed |
|---|---|---|---|---|
| profiles (374 files) | `@/features/identity/adapters/identity.adapter` | COMPLIANT (scanner 0 violations) | MEDIUM — profiles is large; exact sites unknown | IDENTITY-008 |

### auth (lifecycle writer — no feature adapter import)

| Feature | Import path | Status | Risk | Fix needed |
|---|---|---|---|---|
| auth | No import from features/identity | N/A — auth is the LIFECYCLE CREATOR of identity rows | MEDIUM — if auth onboarding changes, actor creation fails silently | IDENTITY-009 audits this |

auth creates actor rows via `createUserActorForProfile → dalCreateUserActor → dalCreateActorOwner`.
It writes to `vc.actors` and `vc.actor_owners`. It does not import from `features/identity/`.

### initiation (2 import sites — confirmed)

| Feature | Import path | Status | Risk | Fix needed |
|---|---|---|---|---|
| initiation (2 sites) | `@/features/identity/adapters/identity.adapter` | COMPLIANT | LOW | No |

### shell (1 import site — confirmed)

| Feature | Import path | Status | Risk | Fix needed |
|---|---|---|---|---|
| shell (1 site) | `@/features/identity/adapters/identity.adapter` | COMPLIANT | LOW — also has separate shell→profiles coupling (RISK-006) | No for identity; RISK-006 tracked |

### vport (1 import site — confirmed)

| Feature | Import path | Status | Risk | Fix needed |
|---|---|---|---|---|
| vport (1 site) | `@/features/identity/adapters/identity.adapter` | COMPLIANT | LOW | No |

### professional (UNKNOWN — IDENTITY-004 pending)

| Feature | Import path | Status | Risk | Fix needed |
|---|---|---|---|---|
| professional | UNKNOWN | COMPLIANT (scanner 0 violations) | UNKNOWN | IDENTITY-004 |

### dashboard (UNKNOWN exact — confirmed compliant)

| Feature | Import path | Status | Risk | Fix needed |
|---|---|---|---|---|
| dashboard (258-file feature) | `@/features/identity/adapters/identity.adapter` | COMPLIANT (scanner 0 violations) | LOW — read-only actor display in dashboard | No |
| Exact files | UNKNOWN — IDENTITY-004 traces them | — | — | IDENTITY-004 |

### upload (UNKNOWN exact — confirmed compliant)

| Feature | Import path | Status | Risk | Fix needed |
|---|---|---|---|---|
| upload | `@/features/identity/adapters/identity.adapter` | COMPLIANT (scanner 0 violations) | LOW | No |
| Exact files | UNKNOWN | — | — | IDENTITY-004 |

### post (UNKNOWN exact — confirmed compliant)

| Feature | Import path | Status | Risk | Fix needed |
|---|---|---|---|---|
| post | `@/features/identity/adapters/identity.adapter` | COMPLIANT (scanner 0 violations) | LOW | No |
| Exact files | UNKNOWN | — | — | IDENTITY-004 |

### join (UNKNOWN — IDENTITY-004 pending)

| Feature | Import path | Status | Risk | Fix needed |
|---|---|---|---|---|
| join | UNKNOWN | UNKNOWN — scanner shows 0 violations | UNKNOWN | IDENTITY-004 |

### feed (UNKNOWN exact — confirmed compliant)

| Feature | Import path | Status | Risk | Fix needed |
|---|---|---|---|---|
| feed | `@/features/identity/adapters/identity.adapter` | COMPLIANT (scanner 0 violations) | LOW | No |
| Exact files | UNKNOWN | — | — | IDENTITY-004 |

---

## 5. Blast Radius Matrix

If any file in this matrix is changed drastically, the following breaks.

| Identity file | Layer | Direct consumers | Indirect consumers | Runtime surface affected | Risk | Required validation |
|---|---|---|---|---|---|---|
| `state/identity/identityContext.jsx` | State | `identity.adapter.js` (re-export), `state/identity/` internal files | All 41 feature consumers via adapter | Auth login, actor switching, identity loading, onboarding, chat inbox scoping, ALL screens using `useIdentity` | **CRITICAL** | Actor switching works; active actor persists; onboarding identity loads; all 41 consumers compile; chat scoped inbox works |
| `state/identity/identitySelection.store.js` | State | `identityContext.jsx` (internal), `chat/setup.js` (direct — bypass) | Anything depending on Zustand store shape | Chat actor search in `searchActors()`, actor switch flow, localStorage persistence | **HIGH** | Chat setup actor search works; actor switch works; `activeActorId` field name unchanged |
| `state/identity/identity.controller.js` | State | `identityContext.jsx` (internal) | All 41 consumers via context | Identity resolution pipeline on every login | **HIGH** | `loadDefaultIdentityForUser` returns hydrated identity; onboarding actor provisioning tested; self-heal not triggered on normal login |
| `state/identity/identity.read.dal.js` | State / DAL | `identity.controller.js` | Identity resolution pipeline | Any identity read: actors, profiles, vports, realms, privacy | **HIGH** | RLS audit required; all reads return expected shapes; no `.single()` throwing on missing rows |
| `features/identity/adapters/identity.adapter.js` | Feature adapter | All 41 feature consumers (direct import) | Everything that uses identity | ALL screens compiling, ALL identity reads | **CRITICAL** | All 41 consumers compile; chat inbox loads; settings loads; notifications loads; profile loads; actor switching loads |
| `features/identity/adapters/identityOps.adapter.js` | Feature adapter | `identity.adapter.js` | All consumers of `ensureVcsmPlatformBootstrap`, `refreshVcActorDirectory` | Platform bootstrap on login, actor directory refresh | **MEDIUM** | Platform bootstrap completes on login; actor directory refresh completes after VPORT creation |
| `features/identity/hooks/useIdentityOps.js` | Feature hook | `identityOps.adapter.js` | All consumers of `useIdentityOps` | Bootstrap and directory refresh operations | **MEDIUM** | `useIdentityOps()` returns both functions; callers can invoke them |
| `features/identity/dal/provision.rpc.dal.js` | DAL | `ensureVcsmPlatformBootstrap.controller.js` | Platform bootstrap on login | `platform.provision_vcsm_identity` RPC — creates 5 platform rows atomically | **HIGH** | RLS audit required; RPC called with correct `userId` + `actorId`; all 5 platform rows created |
| `features/identity/dal/refreshActorDirectory.dal.js` | DAL | `refreshActorDirectory.controller.js` | Any call to `refreshVcActorDirectory` | `identity.refresh_actor_directory_row` RPC — updates actor's display snapshot in identity.actor_directory | **MEDIUM** | RPC called after VPORT mutations; failure does not roll back primary operation; returns `{ ok, error }` |
| `features/identity/setup.js` | Setup | `main.jsx` (app startup) | Everything — engine is not configured if this fails | Engine configuration at app startup — ALL identity resolution fails if engine not configured | **CRITICAL** | Engine configures before first render; no double-configure; `_configured` guard works |
| `features/identity/resolvers/vcsmIdentity.resolver.js` | Resolver | `features/identity/setup.js` | Engine actor link resolution | `platform.user_app_actor_links` read — resolves which actors belong to this account | **HIGH** | Active VCSM actor links returned; multi-actor support intact; zero links case returns empty gracefully |
| `state/identity/identity.model.js` | Model | `identity.controller.js` | Identity shape consumed by all 41 features | `toPublicIdentity` shape — what `useIdentity()` returns | **HIGH** | `{ actorId, kind, ownerActorId, realmId }` shape unchanged; `isBlockedVportIdentity` still detects blocked vports |
| `state/identity/identityStorage.js` | Storage | `identityContext.jsx` | Actor persistence across sessions | Actor selection persists across page reloads | **LOW-MEDIUM** | `saveIdentity` / `loadIdentity` / `clearIdentity` / `clearAllIdentityStorage` work; key format unchanged |
| `state/identity/identitySelectors.js` | Selectors | Any direct consumer (NOT through adapter) | Downstream UI logic that uses selectors | `canCitizenBook`, `isUserActor`, `isVportActor`, `getActorId` | **LOW** | Selector predicates unchanged; booking eligibility guard unchanged |
| `state/identity/controller/switchActor.controller.js` | Controller | `identityContext.jsx` | Actor switching across the app | Actor switch writes platform preference, hydrates new actor | **HIGH** | Actor switch writes to platform; hydration returns valid identity; version guard prevents stale commits |

---

## 6. DAL Touchpoint Map

### `apps/VCSM/src/state/identity/identity.read.dal.js`

| Property | Detail |
|---|---|
| Purpose | All identity-related DB reads — actors, profiles, vports, realms, privacy |
| Functions exported | `readIdentityActorByIdDAL`, `readIdentityActorsByIdsDAL`, `readProfileIdentityDAL`, `readVportIdentityDAL`, `readActorOwnerUserDAL`, `readActorPrivacyDAL`, `readActorPrivacyDiagnosticDAL`, `readPreferredRealmByVoidStateDAL`, `readFallbackRealmDAL`, `readUserActorByProfileIdDAL` |
| Tables touched | `vc.actors`, `vc.actor_owners`, `vc.actor_privacy_settings`, `vc.realms`, `profiles` (public schema via `supabase`), `vport.profiles`, `vport.profile_categories` |
| RPCs called | None |
| Filters used | `.eq('id', actorId)`, `.eq('profile_id', profileId)`, `.eq('kind', 'user')`, `.eq('is_void', isVoid)`, `.eq('actor_id', actorId)`, `.in('id', actorIds)` |
| actorId / userId usage | actorId used as read filter — no ownership decision made in DAL |
| Makes ownership decisions? | **NO** — DAL only executes scoped reads; ownership decisions belong in controllers |
| Only executes scoped queries? | **YES** — all reads filtered by actorId or profileId |
| RLS required? | **YES** — reads from `vc.actors`, `vc.actor_privacy_settings`, `vport.profiles` — all need RLS to prevent cross-actor reads |
| RLS policy files / migrations | `vc.actors`: RLS verified via `can_view_actor()` function (referenced in identity.controller.js error hint at line 196); `vc.actor_privacy_settings`: required for `can_view_actor` to return non-NULL; `vport.profiles`: UNKNOWN — needs DB audit |
| Needs DB audit? | **YES** — especially `vc.actor_privacy_settings` (missing row causes PGRST116 on `vc.actors` read) |

### `apps/VCSM/src/features/identity/dal/provision.rpc.dal.js`

| Property | Detail |
|---|---|
| Purpose | Call `platform.provision_vcsm_identity(p_user_id, p_actor_id)` — atomic platform bootstrap |
| Functions exported | `dalProvisionVcsmIdentity({ userId, actorId })` |
| Tables touched | NONE directly — all table writes are inside the RPC (`platform.user_app_access`, `platform.user_app_accounts`, `platform.user_app_actor_links`, `platform.user_app_preferences`, `platform.user_app_state`, `vc.actors.user_app_account_id`) |
| RPCs called | `platform.provision_vcsm_identity(p_user_id uuid, p_actor_id uuid) → uuid` |
| Filters used | N/A — RPC parameters are `userId` and `actorId` |
| actorId / userId usage | Both passed to RPC as `p_user_id` and `p_actor_id`. RPC enforces GUARD 1 (auth.uid() not null), GUARD 2 (p_user_id = auth.uid()), GUARD 3 (caller owns p_actor_id via vc.actor_owners or vc.actors.profile_id) |
| Makes ownership decisions? | **NO** — DAL passes params to RPC; ownership decision is inside the RPC (`GUARD 3`) |
| Only executes scoped queries? | **YES** — single RPC call with required userId + actorId params |
| RLS required? | **YES** — RPC runs without SECURITY DEFINER (migration 20260518050000 removed it); individual platform tables enforce INSERT/UPDATE policies via `user_id = auth.uid()` |
| RLS policy files / migrations | `20260518040000_platform_provision_vcsm_identity.sql` (original SECURITY DEFINER version), `20260518050000_platform_provision_vcsm_identity_rls.sql` (removes SECURITY DEFINER, adds RLS per table) |
| Needs DB audit? | **YES** — confirm live RPC body matches tracked migration; confirm SECURITY DEFINER is removed |

### `apps/VCSM/src/features/identity/dal/refreshActorDirectory.dal.js`

| Property | Detail |
|---|---|
| Purpose | Refresh a single actor's row in `identity.actor_directory` after source-of-truth mutations |
| Functions exported | `refreshActorDirectoryRow(actorDomain, actorId)`, `refreshVcActorDirectory(actorId)` — convenience wrapper for `'vc'` domain |
| Tables touched | NONE directly — writes via RPC to `identity.actor_directory` |
| RPCs called | `identity.refresh_actor_directory_row(p_actor_domain text, p_actor_id uuid)` |
| Filters used | N/A — RPC parameters are actorDomain and actorId |
| actorId / userId usage | actorId passed to RPC; no userId used |
| Makes ownership decisions? | **NO** — DAL passes params; any ownership gate is inside the RPC |
| Only executes scoped queries? | **YES** — single scoped RPC call |
| RLS required? | **YES** — refresh RPC must verify caller owns the actor; this has NOT been confirmed in tracked migrations |
| RLS policy files / migrations | No tracked migration found for `identity.refresh_actor_directory_row`. **NEEDS DB AUDIT** (IDENTITY-FIX-004) |
| Needs DB audit? | **YES — HIGH PRIORITY** — no tracked migration found for the RPC; ownership guard status unknown |

---

## 7. Database / RLS Checklist

### `vc.actors` — ✅ REVIEWED 2026-06-06 (IDRLS-003)

| Check | Status | Notes |
|---|---|---|
| Read policy exists? | **YES** | Two SELECT policies: `actors_select_viewable` via `vc.can_view_actor(id)` + `actors_public_read_active_vport` for public VPORT browsing |
| Insert policy exists? | **NO** — intentional | Default-deny for authenticated clients. Actor creation is service-role only (edge function / trigger at onboarding) |
| Update policy exists? | **YES** | `actors_update_owner` — `vc.is_actor_owner(id)` |
| Delete policy exists? | **NO** — intentional | Soft-delete pattern. No client-side DELETE |
| Ownership rule enforced? | **YES** | UPDATE gated on `vc.is_actor_owner(id)` |
| Needs DB audit? | **NO** — REVIEWED | |

### `vc.actor_owners` — ✅ REVIEWED 2026-06-06 (IDRLS-002, IDRLS-005)

| Check | Status | Notes |
|---|---|---|
| Read policy exists? | **YES** | `actor_owners_read_own` — `user_id = auth.uid()` — own rows only |
| Insert policy exists? | **YES — GAP (IDRLS-002 OPEN)** | `actor_owners_insert_self` — only checks `user_id = auth.uid()`, NOT actor_id ownership. Any authenticated user can claim any actor. Migration written, NOT APPROVED. |
| Update policy exists? | **NO** — intentional | Write-once ownership. Updates via service_role only |
| Delete policy exists? | **NO** — intentional | Deletions via service_role only |
| `vc.is_actor_owner` function | **CONFIRMED simple table lookup** | `EXISTS (SELECT 1 FROM vc.actor_owners WHERE actor_id = p_actor_id AND user_id = auth.uid() AND is_void = false)` — no additional guards. IDRLS-002 blast radius is real. |
| Needs DB audit? | **NO** — REVIEWED (IDRLS-002 open for fix) | |

### `platform.user_app_actor_links` — ✅ REVIEWED 2026-06-06 (IDRLS-006)

| Check | Status | Notes |
|---|---|---|
| Read policy exists? | **YES** | `platform_user_app_actor_links_select_own` — chained via `user_app_accounts.user_id = auth.uid()` |
| Insert policy exists? | **YES** | `platform_user_app_actor_links_insert_own` — same chain + `{public}` deny |
| Update policy exists? | **YES** | `platform_user_app_actor_links_update_own` — same chain |
| Delete policy exists? | **YES** | `platform_user_app_actor_links_delete_own` — same chain + `{public}` deny |
| Ownership rule enforced? | **YES** — chained through `user_app_accounts` | |
| Needs DB audit? | **NO** — REVIEWED | |

### `platform.provision_vcsm_identity` RPC — ✅ REVIEWED 2026-06-06

| Check | Status | Notes |
|---|---|---|
| Authentication guard? | **YES** — GUARD 1: `auth.uid() IS NULL → RAISE EXCEPTION` | Confirmed in live function body |
| Caller identity guard? | **YES** — GUARD 2: `p_user_id = auth.uid()` | Confirmed |
| Actor ownership guard? | **YES** — GUARD 3: `vc.actor_owners` + `vc.actors.profile_id` fallback | Confirmed |
| SECURITY DEFINER? | **NO** — SECURITY INVOKER | Confirmed |
| search_path set? | **YES** | `SET search_path = 'platform', 'vc', 'auth', 'public', 'pg_temp'` |
| Idempotent? | **YES** — all INSERTs use `ON CONFLICT DO UPDATE` | |
| Needs DB audit? | **NO** — REVIEWED | |

### `identity.refresh_actor_directory_row` RPC — ✅ REVIEWED 2026-06-06 (IDRLS-001 CLOSED)

| Check | Status | Notes |
|---|---|---|
| Authentication guard? | **YES** — `v_caller_id := auth.uid(); IF null → RAISE EXCEPTION` | Confirmed in live `pg_get_functiondef` |
| Caller identity guard? | **YES** — ownership check before upsert | vc: `actor_owners` + `actors.profile_id` fallback; learning: `learning.actor_owners` |
| Actor ownership guard? | **YES** | Both domains verified |
| SECURITY DEFINER? | **YES** | search_path set; guards run before any data access |
| Anon execute grant? | **REVOKED** — confirmed by live privilege query | Previously present, now removed |
| Idempotent? | **YES** — UPSERT with `ON CONFLICT DO UPDATE` | |
| Needs DB audit? | **NO** — REVIEWED | |

---

## 8. Known Findings From IDENTITY-005

The following findings are confirmed by source audit (IDENTITY-005, completed 2026-06-06).
They must be treated as authoritative over any prior planning document claims.

**Finding 1 — Zero `@identity` engine alias imports in chat:**
`grep -rn "@identity" apps/VCSM/src/features/chat/` returned 0 results.
The `FEATURES_ARCHITECTURE_REVIEW.md` claim of "16 `@identity` engine alias imports in chat"
is **REFUTED**. It was written against an older codebase state or conflated
`@/state/identity/` (app state path alias) with `@identity` (engine alias).

**Finding 2 — Prior RISK-004 claim was wrong:**
RISK-004 originally flagged "engine alias vs feature adapter inconsistency in chat" as the
main concern. This concern is not supported by the current source. RISK-004 is revised:
the actual risk is state-layer bypass (LOW) and store access governance gap (LOW-MEDIUM).

**Finding 3 — 8 compliant feature adapter imports in chat:**
All 8 sites use `@/features/identity/adapters/identity.adapter` and import `useIdentity`.
All 8 are inbox/conversation screen reads scoping the UI to the active actor. Correct use.

**Finding 4 — 1 state layer bypass: `chat/inbox/hooks/useVexSettings.js:2`**
```js
import { useIdentity } from "@/state/identity/identityContext";  // BYPASS
```
Functionally identical to the adapter path today. LOW risk. Policy compliance issue.
Fix: IDENTITY-FIX-001 — change import to `@/features/identity/adapters/identity.adapter`.
1-line change, zero behavior change.

**Finding 5 — 1 Zustand store direct access: `chat/setup.js:16`**
```js
import { useIdentitySelectionStore } from '@/state/identity/identitySelection.store'
// Used as: useIdentitySelectionStore.getState().activeActorId
```
Zustand `.getState()` is the correct pattern for non-React async functions.
`useIdentitySelectionStore` is NOT in the feature adapter surface.
LOW-MEDIUM risk: store shape changes (e.g. `activeActorId` renamed) silently break
chat's actor search function without any compile error.

**Finding 6 — Third identity layer confirmed:**
`features/identity/adapters/identity.adapter.js` is a thin re-export.
The canonical implementation is in `state/identity/identityContext.jsx`.
A bypass of the feature adapter is FUNCTIONALLY EQUIVALENT today — but it skips
the governance boundary.

**Finding 7 — IDENTITY-010 scope change:**
This ticket was originally scoped to "engine alias policy" (ban `@identity` in features?).
With 0 engine alias imports found in chat, the original scope has no evidence base in chat.

**Revised IDENTITY-010 scope (this document):**
1. State layer access policy — when is direct `@/state/identity/` access acceptable?
2. Store access gap — should `useIdentitySelectionStore` be in the feature adapter surface?
3. Document the canonical access policy for all 41 consumer features.

---

## 9. Orchestrator Update Rule

Every future identity change must add a row here before the PR is merged.

| Ticket | Files changed | DALs touched | Tables / RPCs touched | RLS review needed | Consumer blast radius | Validation performed |
|---|---|---|---|---|---|---|
| IDENTITY-010 (this) | None — read-only planning | None | None | None | None — no implementation | Source audit completed; consumer map written; blast radius documented |
| IDENTITY-FIX-001 | `apps/VCSM/src/features/chat/inbox/hooks/useVexSettings.js:2` | None | None | NO | 0 consumers affected — 1-line import swap, zero behavior change | Import path changed; verified adapter re-exports same function |

**Template for future rows:**
```
| TICKET-ID | path/to/changed/file.js | dal/touched.dal.js (or NONE) | table.name or rpc.name (or NONE) | YES / NO | N consumers affected — list features | Test steps run |
```

---

## 10. Fix Queue

The following fixes are identified but NOT implemented. Each requires a separate
implementation ticket after the relevant policy decision is made.

### IDENTITY-FIX-001 — Replace useVexSettings state layer bypass — ✅ COMPLETE 2026-06-06

**File:** `apps/VCSM/src/features/chat/inbox/hooks/useVexSettings.js:2`
**Change:**
```diff
- import { useIdentity } from "@/state/identity/identityContext";
+ import { useIdentity } from "@/features/identity/adapters/identity.adapter";
```
**Behavior change:** None — both paths return the same `useIdentity` function.
**Risk:** ZERO.
**Result:** SHIPPED. File is now compliant.

### IDENTITY-FIX-002 — Decide getActiveActorId() adapter exposure

**Decision required:** Should `identity.adapter.js` expose a non-React
`getActiveActorId()` function for setup files and non-React contexts?

**Option A — Add to adapter:**
```js
// In identity.adapter.js:
export function getActiveActorId() {
  return useIdentitySelectionStore.getState().activeActorId ?? null
}
```
**Option B — Document direct store access as allowed exception in this orchestrator**
**Option C — Leave as-is (current state)**

**Blocker:** Policy decision. IDENTITY-010 owner decides.
**Impact:** If Option A chosen → IDENTITY-FIX-003 becomes available.

### IDENTITY-FIX-003 — Update chat/setup.js to use governed accessor

**Prerequisite:** IDENTITY-FIX-002 must choose Option A.
**File:** `apps/VCSM/src/features/chat/setup.js:16`
**Change:**
```diff
- import { useIdentitySelectionStore } from '@/state/identity/identitySelection.store'
+ import { getActiveActorId } from '@/features/identity/adapters/identity.adapter'

// In searchActors():
- const viewerActorId = useIdentitySelectionStore.getState().activeActorId ?? null
+ const viewerActorId = getActiveActorId()
```
**Behavior change:** None if Option A is implemented correctly.
**Risk:** LOW. Must verify chat actor search still works.
**Blocker:** IDENTITY-FIX-002 decision.

### IDENTITY-FIX-004 — DB/RLS audit for identity DALs and RPCs — ✅ COMPLETE 2026-06-06

**Full report:** `ZZnotforproduction/APPS/VCSM/ARCHITECTURETICKETING/Identity/IDENTITY_RLS_AUDIT_2026-06-06.md`

**Findings summary:**

| ID | Target | Severity | Status |
|---|---|---|---|
| IDRLS-001 | `identity.refresh_actor_directory_row` | — | CLOSED — function already patched (auth guard + ownership check); anon execute grant already revoked |
| IDRLS-002 | `vc.actor_owners` INSERT policy | HIGH | OPEN — INSERT only checks `user_id = auth.uid()`, no actor_id ownership verification; migration written but NOT APPROVED |
| IDRLS-003 | `vc.actors` INSERT/DELETE | INTENTIONAL | REVIEWED — service-role only creation path |
| IDRLS-004 | `vc.actor_privacy_settings` DELETE | INTENTIONAL | REVIEWED — permanent per-actor row |
| IDRLS-005 | `vc.actor_owners` UPDATE/DELETE | INTENTIONAL | REVIEWED — write-once ownership model |
| IDRLS-006 | `platform.user_app_actor_links` | CLEAN | REVIEWED |
| IDRLS-007 | `identity.actor_directory` | CLEAN | REVIEWED |
| IDRLS-008 | `platform.*` (5 tables) | CLEAN | REVIEWED |

**Pending (IDRLS-002):** Migration `supabase/migrations/20260606000001_vc_actor_owners_insert_policy_and_rpc_grant_hygiene.sql` written. NOT APPROVED. Owner must: (1) grep `apps/VCSM/src` for browser-side `actor_owners` INSERT to choose Option A vs B; (2) approve and deploy. This finding belongs in a dedicated SEC ticket, not the IDENTITY queue.

---

## 11. Validation Matrix

These are the required validation steps for each identity layer touched by a change.
Run ALL steps for the affected layer before marking the ticket complete.

### If `features/identity/adapters/identity.adapter.js` changes:

- [ ] All 41 identity consumers compile without import errors
- [ ] Chat inbox loads and displays actor-scoped messages
- [ ] Settings loads and displays actor data in all 4 subsystems
- [ ] Notifications loads and resolves actor names
- [ ] Profile loads with correct actor identity
- [ ] `useIdentityOps` hook returns both `refreshVcActorDirectory` and `ensureVcsmPlatformBootstrap`
- [ ] `IdentityProvider` wraps the app tree without errors

### If `state/identity/identityContext.jsx` changes:

- [ ] Actor switching works: switch from user to vport actor and back
- [ ] Active actor persists across page refresh (localStorage persistence)
- [ ] Onboarding identity loads on first login
- [ ] Chat scoped inbox shows correct actor's conversations
- [ ] `useIdentity()` returns `{ identity, loading, switchActor, availableActors, refreshAvailableActors, blockedVport }`
- [ ] Blocked vport auto-switches to user actor
- [ ] Chat purge is triggered on actor switch (purgeChatMessageCache + purgeNotificationCache)

### If `state/identity/identitySelection.store.js` changes:

- [ ] Chat setup actor search works (`searchActors()` in `chat/setup.js` returns results)
- [ ] Actor switch succeeds and `activeActorId` in store updates
- [ ] localStorage persistence survives page reload
- [ ] `setActiveActor` and `clearActiveActor` actions work correctly
- [ ] **Store shape field names unchanged** (if renamed: IDENTITY-FIX-003 required before merge)

### If any identity DAL changes (`identity.read.dal.js`, `provision.rpc.dal.js`, `refreshActorDirectory.dal.js`):

- [ ] RLS audit required before PR opens (use IDENTITY-FIX-004 scope)
- [ ] Onboarding actor provisioning tested: new user can complete onboarding and identity loads
- [ ] Refresh actor directory tested: VPORT edit triggers refresh and identity.actor_directory updates
- [ ] No DAL ownership decisions added (DAL executes scoped queries only — controller decides ownership)
- [ ] Explicit column lists used in all queries (`select('*')` is banned)
- [ ] actorId guard at function entry (`if (!actorId) return null`)

---

## 12. Open Questions

These questions require a decision before any implementation ticket can proceed.
Each question maps to a specific fix or policy in this orchestrator.

**Q1 — Should setup files be allowed to import Zustand stores directly?**
The current `chat/setup.js` uses `useIdentitySelectionStore.getState()` in a non-React
async function. This is the correct Zustand pattern. But it bypasses the feature adapter.
Decision needed: Option A (expose via adapter), Option B (document as allowed), or Option C (leave as-is).
→ Blocks: IDENTITY-FIX-002, IDENTITY-FIX-003.

**Q2 — Should the identity adapter expose non-React functions?**
If Q1 → Option A: `identity.adapter.js` would export a non-hook function (`getActiveActorId()`).
The adapter currently exports only React hooks and controller functions. A non-React function
export is a surface expansion. Does this violate the adapter's contract?
→ Blocks: IDENTITY-FIX-002 (Option A).

**Q3 — Should `state/identity/` be treated as internal app infrastructure (not imported by features)?**
Today, features can import from `state/identity/` (2 confirmed bypass sites in chat).
The feature adapter is a thin re-export with no meaningful additional governance.
Is there value in enforcing the adapter boundary when the adapter is purely a re-export?
If the adapter were to add middleware (logging, error boundaries), enforcement would matter.
→ Influences: how strictly IDENTITY-FIX-001 is prioritized.

**Q4 — Should `@identity` engine alias be banned in features but allowed in state/identity/ and setup files?**
Current policy (documented in Section 3): `@identity` is allowed in 4 specific files:
`features/identity/setup.js`, `state/identity/identity.controller.js`,
`state/identity/identityContext.jsx`, `state/identity/controller/switchActor.controller.js`.
Is this the correct allow-list? Are there other files that should be on it?
→ IDENTITY-010 scanner rule must encode this decision.

**Q5 — Which RLS policies cover `identity.refresh_actor_directory_row`?** ✅ ANSWERED 2026-06-06
Function confirmed: auth guard (`auth.uid() IS NULL → exception`), actor ownership checks for both vc and learning domains, anon execute grant revoked. IDRLS-001 CLOSED. No action needed.

**Q6 — Does `vc.actor_owners` have direct authenticated SELECT/INSERT/UPDATE policies?** ✅ ANSWERED 2026-06-06
SELECT: own-row only (`user_id = auth.uid()`). INSERT: vulnerable — only checks `user_id = auth.uid()`, no actor_id ownership verification (IDRLS-002 OPEN). UPDATE/DELETE: none — intentional write-once model. `vc.is_actor_owner` confirmed as simple table lookup with no additional guards.

**Q7 — Does `toPublicIdentity()` comply with §1.3 Identity Surface Rule?** 🔴 OPEN 2026-06-06
Contract §1.3 allows only `actorId` and `kind`. Current `toPublicIdentity()` returns `{ actorId, kind, ownerActorId, realmId }`.
- `ownerActorId`: never set by any model function (mapProfileActor/mapVportActor) — always null. Dead field. 2 consumers read it (`probeVportPortfolio.controller.js:21`, `resolveInboxActor.js:32,48`) but always receive null — those consumers are silently broken.
- `realmId`: actively used by 6 production files (useStartConversation, CentralFeedScreen, PostFeed.screen, LearningLayout, switchActor.controller, identitySelectors). Cannot remove without a plan.
Decision needed: add `realmId` to §1.3 allowed list (contract revision), OR remove it from `toPublicIdentity()` and introduce `useRealmId()` hook.

**Q8 — Does `setIdentity` on the `useIdentity()` surface violate the contract?** 🔴 OPEN 2026-06-06
`useIdentity()` exposes `setIdentity` — a raw state setter that writes directly to `identityDetails`. Used by 5 calls in `settings/profile` for optimistic avatar/banner/profile updates after upload. Contract says the identity surface is actor-first read surface, not a write surface. These callers should use a dedicated display-refresh hook instead of a raw setter.
→ Blocks: removing `setIdentity` from adapter surface requires settings/profile alternative first.

---

## Summary

| Dimension | Count / Status |
|---|---|
| Identity files mapped (features/identity + state/identity) | 24 files total (9 in features/identity + 15 in state/identity) |
| DALs mapped | 3 primary DALs: `identity.read.dal.js`, `provision.rpc.dal.js`, `refreshActorDirectory.dal.js` |
| RLS checks required | 0 remaining — all 5 entities audited (IDENTITY-FIX-004 COMPLETE) |
| RLS open findings | 1 — IDRLS-002: `vc.actor_owners` INSERT policy (HIGH, migration written NOT APPROVED) |
| Blast radius risks | CRITICAL: `identity.adapter.js`, `identityContext.jsx`, `features/identity/setup.js`; HIGH: `identitySelection.store.js`, `identity.controller.js`, `identity.read.dal.js`, `provision.rpc.dal.js`, `switchActor.controller.js`, `identity.model.js` |
| Known bypass sites | 1 remaining: `chat/setup.js` (STATE_STORE access — LOW-MEDIUM). `useVexSettings.js` FIXED (IDENTITY-FIX-001 complete). |
| Total confirmed consumers | 41 (scanner-verified, 0 violations) |
| Consumers with UNKNOWN file-level detail | settings (8), notifications (4), profiles (count unknown), professional (unknown), dashboard (unknown), upload (unknown), post (unknown), join (unknown), feed (unknown) — all confirmed compliant |
| §1.3 surface open questions | Q7 (`realmId` / `ownerActorId` in toPublicIdentity), Q8 (`setIdentity` raw setter on public surface) |
| Recommended next action | **Q7 decision** (keep `realmId` in contract or introduce `useRealmId()`) unblocks `toPublicIdentity()` cleanup. **Q8** (remove `setIdentity`) requires settings/profile alternative first. **IDRLS-002** (actor_owners INSERT) requires owner grep + approval before migration deploys. |
