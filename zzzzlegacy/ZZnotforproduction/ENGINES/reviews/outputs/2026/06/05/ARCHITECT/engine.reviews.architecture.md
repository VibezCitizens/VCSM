# MODULE ARCHITECTURE REPORT

**Module:** engines/reviews
**Application Scope:** VCSM + ENGINE
**Module Type:** Shared Domain Engine — Actor Reviews
**Primary Root:** /Users/vcsm/Desktop/VCSM/engines/reviews/
**ARCHITECT Run Date:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001

---

## PURPOSE

The reviews engine owns the full lifecycle of actor reviews: submit (create or update), list, delete, dimension rating management, and aggregate stats retrieval. It operates exclusively in the `reviews` schema.

The engine uses an **active card** model: one review may be active per author→target pair at any time. The `upsert_neutral_review` RPC enforces this constraint atomically at the DB layer (SECURITY DEFINER).

Write pipeline (submitReview):
```
1. Guard: targetActorId ≠ authorActorId (no self-review)
2. isActorOwner(authorActorId) — DI ownership pre-check
3. Validate ratings input (1–5 range, dimensionId required)
4. dalRpcUpsertNeutralReview — SECURITY DEFINER RPC: create or update active card
5. dalUpsertDimensionRatings — upsert ratings if provided
6. dalGetReviewById — fetch fresh review row after upsert
7. emit REVIEW_CREATED + RATINGS_UPSERTED events
```

Read pipeline (listReviews):
```
1. dalListReviewsByTarget — cursor paginated (review_activity_at cursor)
2. dalListDimensionRatingsByReviewIds — batch fetch ratings for all review IDs
3. AuthorCardModel from snapshot columns (no secondary RPC)
4. Return {reviews, nextCursor}
```

---

## OWNERSHIP

**Engine Owner:** Platform team
**App Scope:** VCSM (confirmed: `apps/VCSM/src/features/reviews/setup.js`, 2 consumer files)
**CLAUDE.md:** PRESENT — explicit scope rules documented; reviews schema exclusively
**Infrastructure:** reviews schema (Supabase) — 4 tables, 2 RPCs

---

## ENTRY POINTS

**Primary:** `engines/reviews/index.js` → `src/adapters/index.js`
**Alias:** `@reviews` (used in VCSM setup.js and consumers)

**Exported surface (14 symbols):**
- `configureReviewsEngine` (DI config)
- `EVENTS`, `onReviewEvent`, `emit` (domain event bus)
- `getReviewFormConfig` (dimension list for UI form)
- `submitReview` (create or update review via RPC)
- `deleteReview` (soft-delete, author-only)
- `listReviews` (paginated list for target)
- `getMyActiveReview` (author's active review for a target)
- `getTargetStats` (aggregate stats via RPC)
- `ReviewModel`, `DimensionModel`, `DimensionRatingModel`, `AuthorCardModel`, `TargetStatsModel` (model transforms)

**Note:** `ReviewRevisionModel` is NOT exported via adapters despite existing in src/model/ (ANOM-REV-002).

---

## LAYER MAP

```
engines/reviews/
├── CLAUDE.md                          — scope rules (PRESENT; reviews schema only)
├── index.js                           — entry point → src/adapters/index.js
└── src/
    ├── adapters/index.js              — 14 exported symbols (public API)
    ├── config.js                      — DI (supabaseClient req, isActorOwner req, resolveActorCard opt, debugReporter opt; no freeze guard)
    ├── events.js                      — 5 domain events
    ├── types/index.js                 — JSDoc typedefs
    ├── controller/                    — 6 orchestration controllers
    │   ├── submitReview.controller.js
    │   ├── deleteReview.controller.js
    │   ├── listReviews.controller.js
    │   ├── getMyActiveReview.controller.js
    │   ├── getReviewFormConfig.controller.js
    │   └── getReviewStats.controller.js
    ├── dal/                           — 6 DAL files (no tests)
    │   ├── reviews.read.dal.js        — 3 read queries (list, get by id, get active by author)
    │   ├── reviews.write.dal.js       — 3 write ops (insert [UNUSED?], update body, soft-delete)
    │   ├── reviews.rpc.dal.js         — 2 RPCs (upsert_neutral_review, get_target_overall_stats)
    │   ├── dimensions.read.dal.js     — list review_dimensions
    │   ├── dimensionRatings.read.dal.js  — list ratings by review ids
    │   └── dimensionRatings.write.dal.js — upsert + delete ratings
    ├── model/                         — 6 pure row→domain transforms
    │   ├── Review.model.js
    │   ├── ReviewRevision.model.js    — ANOM-REV-002: no read DAL, no export
    │   ├── Dimension.model.js
    │   ├── DimensionRating.model.js
    │   ├── AuthorCard.model.js
    │   └── TargetStats.model.js
    └── services/
        ├── dimensionService.js        — dimension resolution helpers
        ├── reviewService.js           — review fetch/model helpers
        └── statsService.js            — resolveTargetStats (wraps RPC + model)
```

Total: 27 files

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|------|--------|----------|----------------|
| Purpose defined | PASS | CLAUDE.md present; scope rules documented | — |
| Owner defined | PASS | setup.js + consumer files | — |
| Entry points mapped | PASS | adapters/index.js, 14 exports | — |
| Controllers present | PASS | 6 controllers covering CRUD + stats + form config | — |
| DAL/repository present | PASS | 6 DAL files; explicit column selects; 2 RPCs | dalInsertReview potentially dead code (ANOM-REV-001) |
| Models/transformers present | PARTIAL | 6 models; ReviewRevision exists but unused (ANOM-REV-002) | — |
| DB access | reviews schema only | 4 tables declared; 3 active, 1 unimplemented (review_revisions) | — |
| Hooks/view models | NONE | No framework code — clean | — |
| Security controls | PASS | isActorOwner DI pre-check; SECURITY DEFINER RPC as DB layer | — |
| Documentation linked | PARTIAL | CLAUDE.md PRESENT; BEHAVIOR.md, SECURITY.md MISSING | — |
| Tests | NONE | Zero test files | — |

---

## DEPENDENCY INJECTION

| Point | Required | VCSM Value | Fail Behavior |
|-------|----------|------------|--------------|
| supabaseClient | REQUIRED | VCSM supabase client | Throws on first DAL call |
| isActorOwner | REQUIRED | vc.actor_owners RLS-scoped query | Throws if not configured |
| resolveActorCard | optional | NOT injected in VCSM setup.js | Returns null; listReviews uses snapshot data instead |
| debugReporter | optional | NOT injected | No-op |

**No engine-level freeze guard** — configureReviewsEngine() merges config on every call.
**App-level guard:** `apps/VCSM/src/features/reviews/setup.js` has `_configured` flag.

**isActorOwner implementation (VCSM):**
- Queries `vc.actor_owners` WHERE `actor_id = actorId AND is_void = false` (RLS auto-scopes by auth.uid())
- REV-V-001 (prior known fix): old version queried `vc.actors` (existence check); fixed to query `vc.actor_owners` (ownership check)
- SECURITY DEFINER RPC (`upsert_neutral_review`) provides second ownership layer — setup.js comment explicitly notes this

**resolveActorCard:** Configured as optional; NOT wired in VCSM setup. `listReviews` uses author snapshot columns instead — no N+1 RPC. resolveActorCard DI is present but unused (ANOM-REV-005).

---

## DB ACCESS MAP

| Table | Schema | Operations | Notes |
|-------|--------|-----------|-------|
| reviews | reviews | READ (list by target w/cursor, get by id, get active by author) | active_card=true + is_deleted=false filters on reads |
| reviews | reviews | WRITE (insert [UNUSED], update body+activity_at, soft-delete) | UPDATE/DELETE filter by id + author_actor_id |
| review_dimensions | reviews | READ (list all for form config) | — |
| review_dimension_ratings | reviews | READ (batch list by review_ids) | — |
| review_dimension_ratings | reviews | WRITE (upsert by review_id+dimension_id, delete all for review) | — |
| review_revisions | reviews | NONE | DECLARED in CLAUDE.md; ReviewRevision model exists; no DAL (ANOM-REV-002) |

**RPCs:**
| RPC | Schema | Type | Purpose |
|-----|--------|------|---------|
| upsert_neutral_review | reviews | SECURITY DEFINER | Idempotent create-or-update of active review card; returns review ID |
| get_target_overall_stats | reviews | — | Aggregate rating stats for a target actor |

---

## DOMAIN EVENTS

| Event | Trigger |
|-------|---------|
| REVIEW_CREATED | submitReview success (used for both create and update) |
| REVIEW_UPDATED | (defined; not emitted by any controller — REVIEW_CREATED covers upsert) |
| REVIEW_DELETED | deleteReview success |
| RATINGS_UPSERTED | submitReview with ratings success |
| STATS_REQUESTED | (defined; not observed emitted — may be advisory/future) |

---

## SECURITY SURFACE

| Control | Mechanism | Risk |
|---------|-----------|------|
| Write authorization (pre-check) | isActorOwner DI called in submitReview + deleteReview | PASS |
| Self-review guard | targetActorId === authorActorId → throw (submitReview) | PASS |
| DB-layer ownership (second gate) | upsert_neutral_review is SECURITY DEFINER | PASS |
| Rating range validation | submitReview validates 1–5 before RPC call | PASS |
| Soft-delete double guard | deleteReview checks author_actor_id match + isActorOwner | PASS |
| UPDATE/DELETE app-level guard | dalUpdateReviewBody + dalSoftDeleteReview filter by author_actor_id | PASS |
| isActorOwner RLS reliance | actor_owners_read_own policy; REV-V-001 fix applied | NOTE (acknowledged) |
| No SECURITY.md | VENOM/ELEKTRA blocked | MISSING |

---

## ARCHITECTURE ANOMALIES

### ANOM-REV-001: dalInsertReview May Be Dead Code

**Location:** `engines/reviews/src/dal/reviews.write.dal.js`
**Finding:** `dalInsertReview` (direct INSERT into reviews.reviews) exists but `submitReview` controller uses `dalRpcUpsertNeutralReview` (RPC) instead. No controller is observed calling `dalInsertReview`. If the RPC is the canonical write path, `dalInsertReview` is dead code that bypasses the SECURITY DEFINER upsert logic (no active_card management, no snapshot capture, no idempotency).
**Risk:** MEDIUM — dead code that if called directly would bypass idempotency and snapshot enforcement.

### ANOM-REV-002: ReviewRevision Model Has No Read DAL

**Finding:** `ReviewRevision.model.js` exists in model/. `reviews.review_revisions` is declared in CLAUDE.md schema. No `reviewRevisions.read.dal.js` exists. The model is not exported via adapters/index.js. Revision history read is declared as an engine responsibility in CLAUDE.md ("Revision history reads") but is not implemented.
**Risk:** LOW (no defect if revisions are not yet surfaced in UI) — but creates false scope declaration in CLAUDE.md.

### ANOM-REV-003: No DI Freeze Guard at Engine Config Level

**Finding:** `configureReviewsEngine()` has no internal freeze guard. App-level `_configured` prevents repeat calls from VCSM. Engine itself does not guard. Inconsistent with ELEK-007 booking engine pattern.
**Risk:** LOW — mitigated by app-level guard.

### ANOM-REV-004: REVIEW_UPDATED and STATS_REQUESTED Events Defined but Not Emitted

**Finding:** EVENTS object defines REVIEW_UPDATED and STATS_REQUESTED. Neither is emitted by any controller. submitReview emits REVIEW_CREATED for both creates and updates (RPC is idempotent — can't distinguish intent). STATS_REQUESTED has no emission site.
**Risk:** LOW — unused event constants; consumers listening for REVIEW_UPDATED will never fire.

### ANOM-REV-005: resolveActorCard DI Is Wired but Unused

**Finding:** `resolveActorCard` is a named DI injection point in config.js. VCSM setup.js does NOT inject it. `listReviews` uses author snapshot columns (not the DI resolver) — intentional N+1 elimination. The DI point appears vestigial.
**Risk:** LOW — dead configuration surface; future consumers could inject it, but current implementation doesn't call it.

---

## APP CONSUMERS (VCSM)

| File | Symbols Used |
|------|--------------|
| features/reviews/setup.js | configureReviewsEngine |
| features/profiles/kinds/vport/controller/review/VportReviews.controller.js | submitReview, deleteReview, listReviews, getMyActiveReview, getTargetStats, getReviewFormConfig |

---

## BEHAVIOR CONSISTENCY CHECK — engines/reviews

```
Behavior Consistency Check — engines/reviews
=============================================
BEHAVIOR.md present: NO
Status: MISSING

Check A (Source without behavior): FINDING
  → 27 files: 6 controllers, 6 DAL files, 6 models, 3 services
  → CLAUDE.md present; scope rules documented
  → No BEHAVIOR.md — undocumented: active card semantics, upsert vs insert path,
    snapshot capture timing, revision write path
  → Severity: P2 (reviews are operationally stable; BEHAVIOR.md is documentation gap)

Check B, C, D: SKIPPED — no BEHAVIOR.md
```

---

## MODULE INDEPENDENCE STATUS

```
MODULE INDEPENDENCE STATUS
Module: engines/reviews
Classification: MOSTLY INDEPENDENT
Reason: Pure reviews schema access. Two SECURITY DEFINER RPCs handle idempotency
  and DB-layer ownership. DI for all app-specific resolution (isActorOwner).
  Snapshot pattern eliminates N+1 for author enrichment.
  No React or framework code (cleanest engine in sprint).
Blocking anomalies:
  - dalInsertReview dead code bypasses active_card/snapshot logic (ANOM-REV-001)
  - review_revisions declared but unimplemented (ANOM-REV-002)
  - REVIEW_UPDATED + STATS_REQUESTED events never emitted (ANOM-REV-004)
  - resolveActorCard DI vestigial (ANOM-REV-005)
  - No DI freeze guard (ANOM-REV-003)
  - No BEHAVIOR.md → VENOM blocked
  - No SECURITY.md → VENOM/ELEKTRA blocked
  - Zero tests
```

---

## RECOMMENDED HANDOFFS

- **VENOM** — isActorOwner RLS reliance (acknowledge REV-V-001 fix; verify actor_owners_read_own policy still present); dalInsertReview dead code risk (ANOM-REV-001); write SECURITY.md
- **ELEKTRA** — DI freeze guard (ANOM-REV-003); dalInsertReview removal or access restriction
- **SPIDER-MAN** — submitReview unit tests (self-review guard, rating validation, RPC mock); deleteReview double guard; listReviews cursor pagination
- **WOLVERINE** — review_revisions implementation decision (ANOM-REV-002); REVIEW_UPDATED event semantics (ANOM-REV-004)
- **LOGAN** — Write BEHAVIOR.md, SECURITY.md governance artifacts
