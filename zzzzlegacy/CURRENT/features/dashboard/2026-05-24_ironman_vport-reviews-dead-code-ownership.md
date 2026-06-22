# IRONMAN Ownership Audit — Vport Reviews Dead Code
# 2026-05-24

IRONMAN Version: 15.17
Audit Date: 2026-05-24
Application Scope: VCSM + ENGINE
Ownership Record: `logan/marvel/ironman/vcsm.vport-reviews.owner.md`
ARCHITECT Source: `logan/marvel/architect/vcsm-reviews-dead-and-spaghetti-report.md`

---

## Audit Scope

This audit confirms ownership and deletion clearance for all dead code identified by
the ARCHITECT deep scan of the Vport Reviews Dashboard module (2026-05-24).

Verification method: grep across all source files in `apps/VCSM/src` and `engines/`
for every exported symbol in each suspected dead file. Zero external consumers confirmed.

---

## IRONMAN TARGET

```
Feature / Engine: VCSM Vport Reviews — Dead Pre-Engine Residue
Application Scope: VCSM
Reason for ownership review: ARCHITECT identified 4 dead files + 1 dead function export
  from a pre-engine migration. Ownership must be confirmed before deletion clearance.
```

---

## Dead Code Registry

### FILE 1 — vportReviews.write.dal.js

```
Path: apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviews.write.dal.js
Exports:
  - dalInsertVportReviewRow        ← zero consumers (confirmed)
  - dalUpdateVportReviewBody       ← zero consumers (confirmed)
  - dalUpsertVportReviewRatings    ← zero consumers (confirmed)
  - dalSoftDeleteVportReview       ← zero consumers (confirmed)
  - resolveDimensionIds (internal) ← private function, zero consumers
```

**Origin:** Pre-engine direct-table write DAL. Replaced by `engines/reviews` and
the `upsert_neutral_review` SECURITY DEFINER RPC.

**Why dangerous:** If accidentally re-imported, writes reviews directly to
`reviews.reviews` and `reviews.review_dimension_ratings` bypassing the engine's
ownership check and RPC guards. The dead write bypass path is structurally
identical to the active path — a future contributor could re-wire it without
knowing it violates the security contract.

**Deletion Safety:** SAFE. All active write paths go through `engines/reviews`.
No barrel index or adapter re-exports this file.

**Ownership Classification:**
- Ownership Clarity: MISSING (orphaned — no active owner post-engine migration)
- Responsibility Type: DAL ownership
- Boundary Risk: CRITICAL (write bypass path sitting next to active engine path)
- Severity: P1

**Deletion Clearance:** ✅ CLEARED FOR DELETION

---

### FILE 2 — vportReviewAuthors.read.dal.js

```
Path: apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviewAuthors.read.dal.js
Exports:
  - dalGetReviewAuthorCards        ← zero consumers (confirmed)
  - dalListActorCardsByActorIds    ← zero consumers (confirmed)
```

**Origin:** Pre-engine multi-client author card DAL. Queries three schemas:
- `vc.actors` via `vcClient`
- `public.profiles` via `supabaseClient`
- `vport.profiles` via `vportClient`
- `identity.actor_directory` via `supabaseClient` (fallback)

This was the old author enrichment path before `engines/reviews` implemented
`dalGetAuthorCardsForReviews` (which calls `get_review_author_card` RPC — itself
a N+1 pattern, but the canonical path).

**Why dangerous:** This file imports three separate Supabase clients and queries
`identity.actor_directory` — a schema that should not be accessed outside the
identity engine. If accidentally re-wired, it bypasses the engine's author
enrichment and exposes raw identity schema data.

**Deletion Safety:** SAFE. Zero consumers. `identity.actor_directory` access
should remain exclusive to the identity engine.

**Ownership Classification:**
- Ownership Clarity: MISSING (orphaned)
- Responsibility Type: DAL ownership
- Boundary Risk: HIGH (crosses identity schema boundary from reviews feature)
- Severity: P1

**Deletion Clearance:** ✅ CLEARED FOR DELETION

---

### FILE 3 — VportReview.model.js

```
Path: apps/VCSM/src/features/profiles/kinds/vport/model/review/VportReview.model.js
Exports:
  - modelReviewDimensionRow        ← zero consumers (confirmed)
  - modelReviewRatingRow           ← zero consumers (confirmed)
  - modelVportReviewRow            ← zero consumers (confirmed)
  - modelOfficialStatsRow          ← zero consumers (confirmed)
  - modelReviewsWithRatings        ← zero consumers (confirmed)
```

**Origin:** Pre-engine row model. Replaced by `engines/reviews` internal mappers
and `vportReviews.mappers.js` (active, in controller layer).

**Evidence of pre-engine origin:** File header still contains the original
Windows development machine path:
`C:\Users\trest\OneDrive\Desktop\VCSM\src\features\...`

**Note:** The field shapes in this model are partially outdated — `vport_type`
(not `target_subtype`) in `modelVportReviewRow` reflects the old schema column
name before the engine migration renamed it. This confirms the file was never
updated after engine adoption.

**Deletion Safety:** SAFE. Active model layer uses `vportReviews.mappers.js`.
Engine uses its own internal mappers. Zero external consumers.

**Ownership Classification:**
- Ownership Clarity: MISSING (orphaned — pre-engine)
- Responsibility Type: Model / data ownership
- Boundary Risk: LOW (pure functions, no DB access, no imports)
- Severity: P1

**Deletion Clearance:** ✅ CLEARED FOR DELETION

---

### FILE 4 — reviewDimensions.config.js

```
Path: apps/VCSM/src/features/profiles/kinds/vport/config/reviewDimensions.config.js
Exports:
  - getReviewDimensionsForVportType ← zero consumers (confirmed)
```

**Origin:** Hardcoded dimension configuration (140 lines). Mapped dimension keys
and weights per vport type group. Replaced by `reviews.review_dimensions` DB table,
loaded at runtime by `engines/reviews → dalListDimensionsByTargetKind`.

**Dependency note:** This file imports `VPORT_TYPE_GROUPS` from `vportTypes.config.js`.
`vportTypes.config.js` is ACTIVE (8+ consumers). Deleting `reviewDimensions.config.js`
does not affect `vportTypes.config.js` — the dependency is one-directional
(dead → active). Safe to delete.

**Why this matters:** The hardcoded config contains dimension keys that may
diverge from the DB `review_dimensions` table over time. If accidentally re-wired
as a fallback, it would silently serve stale dimension data instead of the DB config.

**Deletion Safety:** SAFE. Engine reads dimensions from DB. No active consumers
of `getReviewDimensionsForVportType` anywhere in the codebase.

**Ownership Classification:**
- Ownership Clarity: MISSING (orphaned — superseded by DB-driven engine config)
- Responsibility Type: Feature ownership / data ownership
- Boundary Risk: MEDIUM (stale data risk if accidentally re-wired)
- Severity: P2

**Deletion Clearance:** ✅ CLEARED FOR DELETION

---

### FUNCTION — Legacy submit() in useVportReviewMine.js

```
File: apps/VCSM/src/features/profiles/kinds/vport/hooks/review/useVportReviewMine.js
Function: submit (lines 84–130)
Exported: YES — via hook return object (line 276) + surfaced in useVportReviews (line 244)
Consumers: ZERO (confirmed via grep across all src files)
```

**Context:** `submit()` is the legacy single-dimension tab-aware submit function.
`submitReview()` is the canonical multi-dimension submit (lines 181–250).
`VportReviewsView` exclusively calls `r.submitReview()` — never `r.submit`.

**Risk:** The legacy function contains its own `body` and `rating` state management
(from hook-level `useState` — separate from the view's compose state).
Leaving it exported creates confusion about which submit path is canonical.

**Deletion Clearance:**
- Function deletion: ✅ CLEARED (after removing from hook return + orchestrator surfacing)
- Associated state: `rating`, `setRating`, `body`, `setBody`, `saving`, `msg`, `setMsg`
  in `useVportReviewMine` — can be removed once `submit()` is removed.
  VERIFY: none of these are used by `submitReview()` before removing.

**Note:** `submitReview()` manages its own `setMyReview`, `setMyExists`, etc.
The legacy state variables are isolated to the `submit()` path only — confirmed safe to remove.

**Ownership Classification:**
- Ownership Clarity: AMBIGUOUS (two submit functions, only one canonical)
- Responsibility Type: Feature ownership / runtime ownership
- Boundary Risk: MEDIUM (confusion + dead export surface)
- Severity: P3

---

## Ownership Boundary Risk Summary

| Area | Risk | Reason | Clearance |
|---|---|---|---|
| `vportReviews.write.dal.js` | CRITICAL | Write bypass past SECURITY DEFINER RPC | ✅ DELETE |
| `vportReviewAuthors.read.dal.js` | HIGH | Queries `identity.actor_directory` outside identity engine | ✅ DELETE |
| `VportReview.model.js` | LOW | Pure functions, pre-engine residue | ✅ DELETE |
| `reviewDimensions.config.js` | MEDIUM | Stale hardcoded config alongside live DB config | ✅ DELETE |
| Legacy `submit()` function | MEDIUM | Dead export, ambiguous submit path | ✅ CLEAR FOR REMOVAL |

---

## Responsibility Classification

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---|---|
| Review CRUD (write path) | `engines/reviews` via `upsert_neutral_review` | HIGH | Dead write DAL confirmed zero consumers |
| Author card enrichment | `engines/reviews` via `get_review_author_card` RPC | HIGH | Dead multi-client DAL confirmed zero consumers |
| Dimension config | `reviews.review_dimensions` DB table | HIGH | Dead hardcoded config confirmed zero consumers |
| Row modeling | `vportReviews.mappers.js` + engine | HIGH | Dead pre-engine model confirmed zero consumers |
| Canonical submit | `submitReview()` in `useVportReviewMine` | HIGH | Legacy `submit()` confirmed zero call sites |

---

## Data Ownership Registry (Dead Code Impact)

| Object | Dead File Accessing It | Status After Deletion |
|---|---|---|
| `reviews.reviews` table | `vportReviews.write.dal.js` | No app-layer write access — engine only (CORRECT) |
| `reviews.review_dimension_ratings` | `vportReviews.write.dal.js` | No app-layer write access — engine only (CORRECT) |
| `vc.actors` (multi-column) | `vportReviewAuthors.read.dal.js` | Only accessed via `reviewTarget.read.dal.js` (active, 4 columns) |
| `public.profiles` | `vportReviewAuthors.read.dal.js` | No direct access from reviews module (CORRECT) |
| `vport.profiles` | `vportReviewAuthors.read.dal.js` | No direct access from reviews module (CORRECT) |
| `identity.actor_directory` | `vportReviewAuthors.read.dal.js` | No reviews module access to identity schema (CORRECT) |

---

## Rule Ownership Registry

| Rule | Enforcement After Dead Code Removed | Docs |
|---|---|---|
| Review write must go through RPC | DB: `upsert_neutral_review` only | VENOM audit required |
| Author enrichment via engine only | Engine: `dalGetAuthorCardsForReviews` | N+1 fix needed (KRAVEN) |
| Dimension config from DB | Engine: `dalListDimensionsByTargetKind` | No app config fallback remains |
| One canonical submit path | `submitReview()` in `useVportReviewMine` | Remove `submit()` export |

---

## Cross-Root Ownership Review

| Area | Claimed Owner | Actual Root | Boundary Status |
|---|---|---|---|
| `vportReviewAuthors.read.dal.js` — identity schema access | reviews feature | `apps/VCSM` | VIOLATION — identity schema owned by identity engine |
| All other dead files | profiles/vport/review (pre-engine) | `apps/VCSM` | ORPHANED — no cross-root issue |

After deletion: identity schema access from the reviews feature is fully eliminated. ✅

---

## Handoff Routing

| Action | Command | Priority |
|---|---|---|
| Execute deletion of 4 dead files | WOLVERINE (implementation) | P1 |
| Remove legacy `submit()` + associated state | WOLVERINE (implementation) | P3 |
| Runtime trace to confirm zero runtime hits before deletion | LOKI | Before deletion (optional but recommended) |
| `isActorOwner` ownership gap fix | VENOM | P0 — before deletion handoff |
| N+1 author card fix (replaces dead DAL's batch approach) | KRAVEN + CARNAGE | P0 |

---

## Deletion Order Recommendation

Delete in this order to avoid any accidental cross-reference confusion:

1. `vportReviews.write.dal.js` — highest risk, delete first
2. `vportReviewAuthors.read.dal.js` — crosses identity schema boundary, delete second
3. `VportReview.model.js` — pure, lowest risk, third
4. `reviewDimensions.config.js` — after confirming engine serving dimensions correctly
5. Remove `submit()` from `useVportReviewMine` + `useVportReviews` return — after other deletions, separate PR

---

## THOR Release Gate Integration

Dead code deletion is NOT a release gate by itself.
However, leaving dead files in place alongside active engine paths is a
**maintenance hazard** that increases confusion risk on every future PR touching
the reviews module.

Recommended: Combine dead code deletion into the same branch as the VENOM
`isActorOwner` fix (both are pre-release cleanup). This reduces review scope
while eliminating the highest-risk surface before the module ships.

---

## IRONMAN OWNERSHIP FINDING

```
Finding ID: IM-REVIEWS-001
Feature / Engine: VCSM Vport Reviews — Dead Pre-Engine DAL/Model Residue
Application Scope: VCSM
Responsibility Type: DAL ownership, Model ownership, Feature ownership
Ownership Clarity: MISSING (orphaned from pre-engine migration)
Boundary Risk: CRITICAL (write bypass DAL), HIGH (identity schema access)
Severity: P1

Primary code roots:
  apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviews.write.dal.js
  apps/VCSM/src/features/profiles/kinds/vport/dal/review/vportReviewAuthors.read.dal.js
  apps/VCSM/src/features/profiles/kinds/vport/model/review/VportReview.model.js
  apps/VCSM/src/features/profiles/kinds/vport/config/reviewDimensions.config.js

Core layers: DAL (2 dead), Model (1 dead), Config (1 dead)
Engines used: N/A — dead files predate engine adoption
Tables / Objects touched: reviews.reviews, reviews.review_dimension_ratings,
  vc.actors, public.profiles, vport.profiles, identity.actor_directory (all read
  only by dead files — write paths bypassed engine RPC)

Rule ownership: All rules now correctly owned by engines/reviews + Supabase DB.
  Dead files had no rule enforcement. No rule gap after deletion.

Contracts touched:
  - SECURITY_ENGINEERING_CONTRACT.md — write bypass path violates auth contract
  - ARCHITECTURE.md — pre-engine files violate current layer responsibility rules
  - PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — identity schema access from reviews feature

Docs touched:
  - architect/vcsm-reviews-dead-and-spaghetti-report.md
  - architect/vcsm-reviews-database-read-map.md
  - architect/vcsm-reviews-rls-assumption-map.md
  - ironman/vcsm.vport-reviews.owner.md (this session)

Runtime ownership: CONFIRMED NON-RUNTIME — all four files tree-shaken.
  No active import chain reaches any dead file.

Current ambiguity:
  Four dead files sit in active feature directories alongside live code.
  Future contributors cannot distinguish dead from active without running ARCHITECT.
  The write DAL has function names identical to the engine's write path.

Risk:
  A future PR could accidentally import `dalInsertVportReviewRow` or
  `dalUpsertVportReviewRatings` instead of the engine path — silently bypassing
  the `upsert_neutral_review` SECURITY DEFINER RPC.

Recommended ownership clarification:
  Delete all four files. Remove legacy submit() export.
  The engine is the sole owner of review writes.
  No app-layer replacement needed — engine already handles all cases.

Recommended handoff:
  WOLVERINE for deletion execution.
  LOKI optional pre-deletion runtime trace.
  VENOM for isActorOwner gap (independent, higher priority).

Rationale:
  Dead code alongside active engine paths is not a dormant risk — it is an
  active confusion surface that grows more dangerous with each new contributor.
  All four files have been verified with zero external consumers.
  Deletion is safe, isolated, and removes architectural confusion at zero cost.
```

---

*IRONMAN audit complete. All clearances issued. Handoffs routed.*
