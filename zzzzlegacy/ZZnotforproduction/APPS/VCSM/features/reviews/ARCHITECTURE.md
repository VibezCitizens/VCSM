---
name: vcsm.reviews.architecture
description: ARCHITECT V2 module architecture report for VCSM:reviews
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** reviews
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/reviews
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** INCOMPLETE

---

## PURPOSE

The reviews feature is a thin app-level setup shim that configures and injects the shared `engines/reviews` engine for use within the VCSM application. It wires the Supabase client singleton and a VCSM-specific actor ownership checker into the engine before any component renders. All review lifecycle logic — submitting, listing, deleting, dimensions, stats — lives entirely inside `engines/reviews`, not in this feature directory.

## OWNERSHIP

Platform team. The feature has no UI of its own. It is a bootstrap concern owned by whoever manages `main.jsx` initialization. The review engine (`engines/reviews`) is the real domain owner and houses controllers, DAL, models, and services.

## ENTRY POINTS

- `setupVcsmReviewsEngine()` — exported from `apps/VCSM/src/features/reviews/setup.js`. Called once at app startup in `main.jsx` before any component renders. This is the sole entry point into this feature.
- The engine's public API (`engines/reviews/index.js`) is the downstream entry point for all actual review operations (submitReview, listReviews, deleteReview, getMyActiveReview, getTargetStats, getReviewFormConfig).

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 0 | N/A — all DAL lives in engines/reviews/src/dal/ |
| Model | 0 | N/A — all models live in engines/reviews/src/model/ |
| Controller | 0 | N/A — all controllers live in engines/reviews/src/controller/ |
| Service | 0 | N/A — all services live in engines/reviews/src/services/ |
| Adapter | 0 | N/A — public surface is engines/reviews/src/adapters/index.js |
| Hook | 0 | N/A — React hooks are app-consumer responsibility |
| Component | 0 | N/A — no UI components in this feature |
| Screen | 0 | N/A — no screens in this feature |
| Barrel | 0 | N/A |
| Module | 1 | setup.js (app startup bootstrap) |

Note: Scanner cg_layerCounts reports 1 module file, matching the single source file found.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | setup.js header comment | BEHAVIOR.md is PLACEHOLDER — no formal contract |
| Owner defined | FAIL | No ownership record | No team or domain owner documented |
| Entry points mapped | PASS | setupVcsmReviewsEngine() is clear | No route — bootstrap only |
| Controllers present/delegated | PASS | Delegated to engines/reviews | 6 controllers in engine |
| DAL/repository present/delegated | PASS | Delegated to engines/reviews | 6 DAL files in engine |
| Models/transformers present | PASS | Delegated to engines/reviews | 6 models in engine |
| Hooks/view models present | FAIL | No hooks in feature or engine | App consumers must build hooks themselves |
| Screens/components present | FAIL | No UI in this feature | Review UI must be embedded in profiles, public, dashboard features |
| Services/adapters present | PASS | Delegated to engines/reviews | 3 services + 1 adapter in engine |
| Database objects mapped | PARTIAL | Engine owns reviews.* schema | No write surfaces in feature; engine writes reviews.reviews, reviews.review_dimension_ratings |
| Authorization path mapped | PASS | isActorOwner DI — checks vc.actor_owners | REV-V-001 fix documented in setup.js; DB enforces via SECURITY DEFINER RPC |
| Cache/runtime behavior mapped | FAIL | No cache strategy documented | Engine is stateless; no cache layer |
| Error/loading/empty states mapped | FAIL | No UI to map states in | Risk: consumers may not handle engine throws consistently |
| Documentation linked | FAIL | BEHAVIOR.md present but PLACEHOLDER | Full behavior contract missing |
| Tests/validation noted | FAIL | 0 tests | No unit or integration tests for setup or ownership injection |
| Native parity noted | N/A | No native screens | N/A |
| Engine dependencies mapped | PASS | engines/review confirmed | Single engine dependency; correctly declared |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/reviews | engine | feature → engine | YES | Configured via configureReviewsEngine() DI |
| apps/VCSM/src/services/supabase/supabaseClient | service | feature → service | YES | Supabase singleton injected into engine |
| vc.actor_owners | DB table (read) | feature → DB | YES | Used in isActorOwner DI check; RLS-enforced |
| reviews.reviews | DB table (write via engine) | engine → DB | YES | Engine owns all writes via RPC |
| reviews.review_dimension_ratings | DB table (write via engine) | engine → DB | YES | Engine owns via dalUpsertDimensionRatings |
| reviews.review_dimensions | DB table (read via engine) | engine → DB | YES | Engine reads dimension config |
| reviews.review_revisions | DB table (read via engine) | engine → DB | YES | Engine reads revision history |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| reviews.reviews | RPC upsert + read | engines/reviews | profiles, public, dashboard, chat, notifications | Engine enforces one-active-review-per-author-target constraint |
| reviews.review_dimension_ratings | upsert + read | engines/reviews | profiles, dashboard | Rating 1–5 validated in controller before write |
| reviews.review_dimensions | read | engines/reviews | profiles, public | Dimension config; no write from feature |
| reviews.review_revisions | read | engines/reviews | profiles | Revision history; no write from feature |
| vc.actor_owners | read | vc schema / app | reviews feature (DI) | RLS policy actor_owners_read_own enforces user_id = auth.uid() |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | N/A | No routes — bootstrap only | Reviews are rendered inside other features (profiles, public, dashboard) |
| Loading state | NOT APPLICABLE | No UI in feature | Risk: consuming features must implement loading states |
| Empty state | NOT APPLICABLE | No UI in feature | Risk: consuming features must handle empty review lists |
| Error state | NOT APPLICABLE | No UI in feature | Engine throws on error; consuming features must catch |
| Auth/owner gates | PASS | DI check + DB SECURITY DEFINER | Defense-in-depth: app pre-check + DB enforcement |
| Cache behavior | MISSING | No cache strategy | Engine is stateless; no TTL, no invalidation |
| Runtime dependencies | PASS | supabase singleton available at startup | setupVcsmReviewsEngine() called before any component renders |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/reviews/BEHAVIOR.md | PLACEHOLDER |
| Ownership record | — | MISSING |
| Security audit | — | MISSING (REV-V-001 fix in source, not formally audited) |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | engines/reviews/CLAUDE.md | PRESENT (scope rules only) |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is PLACEHOLDER | HIGH | No formal behavior contract; reviewers and consumers have no declared invariants, happy paths, error states, or security rules | LOGAN |
| No React hooks layer | HIGH | App consumers (profiles, public, dashboard) must build their own review hooks with no shared pattern; likely leads to divergent implementations | IRONMAN |
| No tests | HIGH | The isActorOwner DI function is a security-sensitive ownership check with zero test coverage | SPIDER-MAN |
| CURRENT_STATUS.md missing | MEDIUM | No running status record for this feature | ARCHITECT (this run) |
| No engine write surfaces in feature scanner | LOW | Scanner shows 0 write surfaces for this feature; all writes go through engine — this is correct but makes the feature invisible to the write-surface audit | VENOM |
| No explicit null-session guard unit test | MEDIUM | setup.js isActorOwner checks session, but no test verifies the null-session early return path | SPIDER-MAN |

---

## MODULE BOUNDARY WARNINGS

The feature imports `@reviews` (the engine) and `@/services/supabase/supabaseClient`. Both are approved boundaries per the VCSM architecture contract. The feature does not import from any other feature directory.

The engine's CLAUDE.md explicitly prohibits importing from `apps/VCSM/` — this boundary is respected: the DI pattern inverts the dependency.

No boundary violations detected in static scan.

---

## SPAGHETTI SCORE

**Module:** reviews
**Score:** CLEAN
**Reasons:** Single file, single responsibility (engine bootstrap). No cross-feature imports. No business logic. Dependency inversion is correct. Security concern (ownership check) is explicitly documented with REV-V-001 fix note.
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER

**Check A (Source without behavior):** FAIL — source exists (setup.js) but BEHAVIOR.md is a placeholder stub with no declared behavior
**Check B (Behavior without source):** N/A — no behavior declared in BEHAVIOR.md to verify against source
**Check C (§13 engine consistency):** PASS — engine dependency `review` declared in scanner data; `@reviews` import confirmed in setup.js
**Check D (§6 data change consistency):** N/A — no write surfaces declared in BEHAVIOR.md; feature has 0 direct write surfaces (all writes through engine)

---

## FINAL MODULE STATUS

INCOMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write BEHAVIOR.md contract | PLACEHOLDER with no declared happy paths, security rules, or error states | LOGAN |
| P1 | Add tests for isActorOwner DI path | Security-sensitive ownership check has zero coverage | SPIDER-MAN |
| P2 | Build shared React hook layer (useReviews, useReviewForm, useReviewStats) | All consuming features need this; without it implementations diverge | IRONMAN |
| P3 | Security audit of REV-V-001 fix and engine RPC trust boundary | Fix is documented in source; needs formal VENOM pass to close the finding | VENOM |

## RECOMMENDED HANDOFFS

- **LOGAN** — Write BEHAVIOR.md from source and engine contract
- **SPIDER-MAN** — Add unit tests for isActorOwner DI, null-session path, self-review guard
- **IRONMAN** — Build shared React hook layer for review consumption
- **VENOM** — Formal security audit of REV-V-001 fix and engine RPC ownership enforcement

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
