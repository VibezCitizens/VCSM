---
# Module Architecture Report — vcsm.actors
# ARCHITECT §26.11 — Dated Immutable Report
# Generated: 2026-06-02
# Ticket: ARCHITECT-ACTORS-0001
# Status: IMMUTABLE — do not edit; create a new dated report for revisions
# Architecture State: EVOLVING
# Module Status: MOSTLY COMPLETE
---

## Feature Identity

| Field | Value |
|---|---|
| Feature | actors |
| App | VCSM |
| Classification | PLATFORM (reclassified from FEATURE — TICKET-0006A, 2026-06-02) |
| Security Tier | CRITICAL |
| Feature Status | ACTIVE |
| Source Path | apps/VCSM/src/features/actors/ |
| CURRENT Path | CURRENT/features/actors/ |
| Engine Path | None — feature-only |

---

## Feature Overview

The actors feature is a headless, READ-ONLY platform service that provides cross-feature actor identity search and a public adapter boundary. It exposes a single controller (searchActors) backed by a Supabase RPC against the `identity` schema, normalizes results through a model layer, and publishes a single public adapter (`actors.adapter.js`). It has no routes, screens, hooks, or write paths. All actor creation and ownership write surfaces live in the auth/identity features.

A previous version of this feature included a hydration subsystem (hydrateActors.controller.js, getActorSummariesByIds.dal.js, extractActorIdsForHydration.model.js). As of the 2026-06-02 live source scan, none of these three files exist on disk. The hydration function appears to have migrated to `engines/hydration/src/useActorSummary.js`, but this is not formally confirmed. This drift is the primary architecture risk of this feature.

---

## Layer Presence

| Layer | Present | Path |
|---|---|---|
| Controllers | YES | apps/VCSM/src/features/actors/controllers/ |
| DALs | YES | apps/VCSM/src/features/actors/dal/ |
| Models | YES | apps/VCSM/src/features/actors/model/ |
| Adapters | YES | apps/VCSM/src/features/actors/adapters/ |
| Hooks | NO | — |
| Screens | NO | — |
| Components | NO | — |
| Engine controllers | NO | None |
| Engine DALs | NO | None |

---

## Active Controllers

| Controller | Purpose | Auth Gate |
|---|---|---|
| searchActors.controller.js | Actor search — calls searchActorsDAL, maps results through model | Implicit via RPC p_filter; no explicit session check |

**Previously Documented (NOT FOUND in source):**
- hydrateActors.controller.js — Drift ID: ARCH-ACTORS-DRIFT-001

---

## Active DALs

| DAL | Tables / RPCs | Notes |
|---|---|---|
| searchActors.dal.js | `identity.search_actor_directory` (RPC via `.schema('identity').rpc(...)`) | Applies p_filter:'public' for unauthenticated (viewerActorId=null); p_filter:'all' for authenticated. Sanitizes input: strips @/# prefix, trims whitespace, guards empty needle. |

**Previously Documented (NOT FOUND in source):**
- getActorSummariesByIds.dal.js — Drift ID: ARCH-ACTORS-DRIFT-002

---

## Active Models

| Model | Purpose |
|---|---|
| searchActors.model.js | Maps raw DB rows to { actorId, kind, displayName, username, avatarUrl }. Filters null/missing actor_id rows. |

**Previously Documented (NOT FOUND in source):**
- extractActorIdsForHydration.model.js — Drift ID: ARCH-ACTORS-DRIFT-003

---

## Active Adapters

| Adapter | Exports | Consumers |
|---|---|---|
| actors.adapter.js | searchActorsAdapter(params) | settings/privacy/Blocks.controller.js, dashboard/vport/team/vportTeamAccess.controller.js |

---

## Engine Dependencies

None. No imports from `engines/` in any actors source file. The `engines/hydration/src/useActorSummary.js` file references actors but is a parallel path, not imported by the actors feature.

---

## Cross-Feature Dependencies

| Feature | File | Import | Direction | Pattern |
|---|---|---|---|---|
| settings/privacy | Blocks.controller.js | searchActorsAdapter | INBOUND | Correct — via adapter |
| dashboard/vport/team | vportTeamAccess.controller.js | searchActorsAdapter | INBOUND | Correct — via adapter |

No outbound cross-feature dependencies.

---

## Authorization Pattern

READ-ONLY feature with no explicit session auth gate in controllers. Authorization is delegated to the RPC layer:

- `viewerActorId = null` → `p_filter: 'public'` enforced by DB function
- `viewerActorId` supplied → `p_filter: 'all'` allows broader results per DB function logic

Consumers (team, privacy) handle their own ownership assertions before invoking the adapter — actors itself does not re-verify caller identity.

Trust boundary chain (platform-level, from VENOM-FULL / ARCHITECT prior run):
```
Client URL
  → React Router
  → ProtectedRoute
  → ProfileGatedOutlet
  → BlockedVportGuard
  → OwnerOnlyDashboardGuard
  → Screen (isOwner — UI only)
  → Hook
  → Controller (assertActorOwnsVportActorController → vc.actor_owners)
  → actors.adapter.js → searchActors.controller.js → searchActors.dal.js
  → identity.search_actor_directory RPC (RLS enforced)
```

---

## Module Independence Classification

**INDEPENDENT** — No outbound cross-feature imports. Consumed only through its own adapter boundary by two features.

---

## Architecture State

**EVOLVING**

Three previously documented files are absent from live source. The surviving search surface is structurally clean. Documentation and source are out of sync — this must be formally reconciled before the module can be declared STABLE.

---

## Known Structural Risks

| Risk ID | Severity | Description |
|---|---|---|
| ARCH-ACTORS-DRIFT-001 | HIGH | hydrateActors.controller.js — documented present, NOT FOUND in source. Hydration path of unknown origin. |
| ARCH-ACTORS-DRIFT-002 | HIGH | getActorSummariesByIds.dal.js — documented present, NOT FOUND in source. |
| ARCH-ACTORS-DRIFT-003 | MEDIUM | extractActorIdsForHydration.model.js — documented present, NOT FOUND in source. |
| SENTRY-2026-01 | BLOCKING | checkVportOwnership.controller.js (booking feature) imports getActorByIdDAL directly from booking internal path, bypassing adapter boundary contract. |
| IRON-BOOK-WARN3 | HIGH | Dual assertActorOwnsVportActor: feature copy (features/booking/controller/) used by all app callers; engine copy (engines/booking/src/controller/) is canonical. Drift risk. |
| NO_TESTS | HIGH | Zero test files for all actors source files. SPIDER-MAN never run on feature. Branch BLOCKED. |

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Headless search + adapter boundary service | — |
| Owner defined | PARTIAL | OWNERSHIP.md exists; IRONMAN module-level only | 4 ownership gaps open |
| Entry points mapped | PASS | actors.adapter.js sole public entry; 2 consumers confirmed | — |
| Controllers present | PARTIAL | searchActors.controller.js confirmed | hydrateActors.controller.js absent — DRIFT-001 |
| DAL/repository present | PARTIAL | searchActors.dal.js confirmed | getActorSummariesByIds.dal.js absent — DRIFT-002 |
| Models/transformers | PARTIAL | searchActors.model.js confirmed | extractActorIdsForHydration.model.js absent — DRIFT-003 |
| Hooks/view models | N/A | Headless service | — |
| Screens/components | N/A | Headless service | — |
| Authorization path mapped | PASS | RPC p_filter pattern documented; READ-ONLY path verified | — |
| Engine dependencies mapped | PASS | No engine imports in source; hydration engine is parallel path | — |
| Tests/validation noted | FAIL | Zero test files; SPIDER-MAN never run on feature | Branch BLOCKED |

---

## Recommended Handoffs

| Command | Priority | Reason |
|---|---|---|
| IRONMAN | P0 | Confirm hydrateActors/hydration removal intent; close DRIFT-001/002/003; resolve 4 ownership gaps |
| SPIDER-MAN | P0 | Min 5 test files required before branch unblock; searchActors, DAL, adapter boundary all need coverage |
| VENOM | P1 | Dedicated identity trust boundary audit — deferred behind SENTRY-2026-01 resolution |
| SENTRY | P1 | Re-run after SENTRY-2026-01 fix to confirm adapter boundary is clean |
| CARNAGE | P2 | Assign migration ownership for identity.search_actor_directory and related identity RPCs |

---

## Final Module Status

**MOSTLY COMPLETE**

The surviving search-only surface is clean and correctly adapter-bounded. Three previously documented files are absent from source with no documented removal or migration record. Zero tests. SENTRY-2026-01 and IRON-BOOK-WARN3 remain open. The feature cannot be declared COMPLETE or STABLE until the documentation-source drift is reconciled and test coverage is established.

---

## ARCHITECT Run Record

- Date: 2026-06-02
- Ticket: ARCHITECT-ACTORS-0001
- Architecture State: EVOLVING
- Source Files Found: 4
- Source Files Previously Documented: 6 (3 absent — DRIFT-001/002/003)
- Controllers: 1 (confirmed) + 1 (absent)
- DALs: 1 (confirmed) + 1 (absent)
- Models: 1 (confirmed) + 1 (absent)
- Adapters: 1 (confirmed)
- Hooks: 0
- Screens: 0
- Tests: 0
- Engine deps: 0
- Consumers of adapter: 2
- Open blocking issues: SENTRY-2026-01, SPIDER-MAN branch block, DRIFT-001/002/003
- Recommended next: IRONMAN (drift resolution) then SPIDER-MAN (tests)
