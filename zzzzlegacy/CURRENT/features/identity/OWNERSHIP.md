# OWNERSHIP — identity

**Feature:** identity
**App:** VCSM
**IRONMAN audit date:** 2026-05-18
**Evidence basis:** First 80 lines of `2026-05-18_ironman_identity-feature-ownership.md`

Note: This file is based on the first 80 lines of the IRONMAN audit. The full report may contain additional ownership determinations not reflected here.

---

## Feature Ownership

**Primary path:** `apps/VCSM/src/features/identity/`
**Related paths:** `apps/VCSM/src/state/identity/`, `engines/identity/`
**Feature entry files:** `features/identity/setup.js`, `features/identity/adapters/identity.adapter.js`, `features/identity/adapters/identityOps.adapter.js`

**Feature owner:** UNKNOWN — IRONMAN audit does not name a specific owner in the first 80 lines.

---

## Layer Map (IRONMAN confirmed)

### `features/identity/` — Core provision and resolution

| Layer | File(s) | Owner | Status |
|-------|---------|-------|--------|
| DAL | `dal/provision.rpc.dal.js` | UNKNOWN | Present |
| DAL | `dal/refreshActorDirectory.dal.js` | UNKNOWN | Present |
| Model | MISSING | UNKNOWN | No model files — RPC responses consumed raw; identified as a gap |
| Controller | `controller/ensureVcsmPlatformBootstrap.controller.js` | UNKNOWN | Present — real business logic |
| Controller | `controller/refreshActorDirectory.controller.js` | UNKNOWN | Present — hollow pass-through (IRONMAN open item) |
| Adapter | `adapters/identity.adapter.js` | UNKNOWN | Present — bundle adapter (React + ops) |
| Adapter | `adapters/identityOps.adapter.js` | UNKNOWN | Present — ops-only adapter (non-React callers) |
| Hook | `hooks/useIdentityOps.js` | UNKNOWN | Present |
| Resolver | `resolvers/vcsmIdentity.resolver.js` | UNKNOWN | Present — non-standard layer (IRONMAN RISK-9) |
| Setup | `setup.js` | UNKNOWN | Present — non-standard layer (DI wiring) |
| Component | MISSING | UNKNOWN | Feature has no own UI |
| Screen | MISSING | UNKNOWN | Feature has no own UI |

### `state/identity/` — In-memory actor state (companion layer)

| File | Role |
|------|------|
| `identityContext.jsx` | IdentityProvider — mounts `useIdentityResolutionEffect` |
| `useIdentityResolutionEffect.hook.js` | Effect hook — orchestrates normal + self-heal resolve |
| `identity.controller.js` | `loadDefaultIdentityForUser` + inner |
| `identity.controller.inflight.js` | In-flight dedup Map + DEV resolve counter |
| `identitySelfHeal.controller.js` | Self-heal bootstrap + finalize |
| `identityResolutionSelfHeal.helper.js` | Finalizes state preference after self-heal |
| `identity.read.dal.js` | `readIdentityActorByIdDAL`, `readUserActorByProfileIdDAL`, realm reads |
| `queries/identityEngineQuery.js` | React Query wrapper for `resolveAuthenticatedContext` |
| `identitySelection.store.js` | UNKNOWN role — listed in IRONMAN layer map |
| `identitySelectors.js` | UNKNOWN role — listed in IRONMAN layer map |
| `useIdentitySync.js` | UNKNOWN role — listed in IRONMAN layer map |
| `controller/switchActor.controller.js` | Actor switching controller |

---

## Open Ownership Questions (IRONMAN)

From IRONMAN report (triggered by CEREBRO RISK-3, RISK-5, RISK-9):

| Item | Status |
|------|--------|
| RISK-3: `resolvers/` and `setup.js` are undocumented non-standard layers — architecture decision required | OPEN |
| RISK-5: Dead export removal decision (not detailed in first 80 lines) | OPEN |
| RISK-9: `resolvers/` taxonomy — SENTRY recommendation pending owner assignment | OPEN |
| OQ-4 (CARNAGE): Migration history for both RPCs unknown — audit required before release gating | OPEN (confirmed by CARNAGE) |

---

## Schema Objects — Ownership Classification

Per CARNAGE 2026-05-18:

| Object | Classification |
|--------|---------------|
| `platform.provision_vcsm_identity` | Identity-sensitive + Ownership-sensitive + Engine-critical |
| `platform.user_app_access` | Identity-sensitive + Runtime-critical |
| `platform.user_app_accounts` | Identity-sensitive + Runtime-critical |
| `platform.user_app_preferences` | Identity-sensitive |
| `platform.user_app_state` | Identity-sensitive + Runtime-critical |
| `platform.user_app_actor_links` | Identity-sensitive + Ownership-sensitive |
| `vc.actors.user_app_account_id` | Identity-sensitive + Ownership-sensitive |
| `identity.refresh_actor_directory_row` | Runtime-critical + Engine-critical (shared cross-app: VCSM + Wentrex) |
| `identity.actor_directory` | Runtime-critical |

---

## Cross-App Dependency

`identity.refresh_actor_directory_row` is a **shared cross-app RPC** used by both VCSM (`apps/VCSM/src/features/identity/dal/refreshActorDirectory.dal.js`) and Wentrex (`apps/wentrex/src/features/identity/dal/refreshActorDirectory.dal.js`). Changes to this RPC affect both apps.
