# VCSM — Reviews Engine Integration
**Domain:** reviews  
**System:** engine-integration  
**Topic:** vcsm wire-up, ownership check, public surface  
**App:** apps/VCSM  
**Engine:** engines/reviews  
**Created:** 2026-05-23 (by LOGAN, triggered by CEREBRO gap detection)  
**Status:** DRAFT — BLOCKED (pending isActorOwner fix)

---

## Purpose

Documents how `apps/VCSM` wires the shared `@reviews` engine. VCSM contributes only ownership verification and engine configuration. All domain logic (create, list, respond, delete, stats) lives in the engine.

---

## File Map

| File | Role |
|---|---|
| `apps/VCSM/src/features/reviews/setup.js` | Engine wire-up (only file in VCSM reviews feature) |
| `engines/reviews/index.js` | Engine public surface (re-exports from `src/adapters/index.js`) |
| `engines/reviews/src/adapters/index.js` | Canonical public API |
| `engines/reviews/src/config.js` | DI configuration and dependency accessors |
| `engines/reviews/src/controller/` | Business logic (6 controllers) |
| `engines/reviews/src/dal/` | DB access (6 DAL files: read, write, rpc, dimensions, dimension ratings, authors) |
| `engines/reviews/src/model/` | Domain transforms (5 models) |
| `engines/reviews/src/services/` | Shared domain logic (3 services) |
| `engines/reviews/src/events.js` | Domain event bus |
| `engines/reviews/src/types/index.js` | JSDoc typedefs |

---

## Setup Call Order

`setupVcsmReviewsEngine()` is called in `apps/VCSM/src/main.jsx:22`, before `createRoot().render()` (line 106). Setup fires before any React component mounts.

```js
// main.jsx
setupVcsmReviewsEngine()   // ← line 22
// ...
createRoot(...).render(<App />) // ← line 106
```

---

## Dependency Injection Contract

| Dependency | Required | Current Implementation | Status |
|---|---|---|---|
| `supabaseClient` | YES | `supabase` singleton from `@/services/supabase/supabaseClient` | PASS |
| `isActorOwner(actorId)` | YES | Queries `vc.actors` for actor existence | ⚠️ BROKEN — see Known Issues |
| `resolveActorCard(actorId)` | NO (optional) | Not injected — engine falls back to snapshot data | ACCEPTABLE |
| `debugReporter` | NO (optional) | Not injected | ACCEPTABLE |

---

## Public Engine Surface (consumed by VCSM)

```js
import {
  configureReviewsEngine, // used in setup.js
  submitReview,
  deleteReview,
  listReviews,
  getMyActiveReview,
  getTargetStats,
  getReviewFormConfig,
  onReviewEvent,
  EVENTS,
} from '@reviews'
```

VCSM does NOT have its own reviews adapter. Engine adapters are consumed directly.

---

## Database Schema

All reviews operations use `.schema('reviews')`:

| Table | Operations |
|---|---|
| `reviews.reviews` | SELECT (list, by-id), INSERT (via RPC), UPDATE (body, soft-delete) |
| `reviews.review_dimensions` | SELECT (form config, active dimensions) |
| `reviews.review_dimension_ratings` | SELECT, UPSERT, DELETE |

RPCs (SECURITY DEFINER):
- `reviews.upsert_neutral_review(p_target_actor_id, p_author_actor_id, p_body)` → returns `review_id`
- `reviews.get_review_author_card(p_review_id)` → returns author card row
- `reviews.get_target_overall_stats(p_target_actor_id)` → returns aggregate stats

---

## Engine Events

| Event | When Emitted | Payload |
|---|---|---|
| `EVENTS.REVIEW_CREATED` | After successful submitReview | `{ reviewId, targetActorId, authorActorId, overallRating }` |
| `EVENTS.REVIEW_DELETED` | After successful deleteReview | `{ reviewId, targetActorId, authorActorId }` |
| `EVENTS.RATINGS_UPSERTED` | After dimension ratings upserted | `{ reviewId, ratingCount }` |
| `EVENTS.STATS_REQUESTED` | After getTargetStats | `{ targetActorId }` |

---

## Known Issues

### BLOCKING — isActorOwner Is Wrong

**Current implementation** (`setup.js:30-44`) queries `vc.actors` to confirm actor existence. This does NOT verify that the session user owns the actor.

**Required implementation:**
```js
isActorOwner: async (actorId) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.id) return false

  const { data, error } = await supabase
    .schema('vc')
    .from('actor_owners')
    .select('actor_id')
    .eq('actor_id', actorId)
    .eq('user_id', session.user.id)
    .limit(1)

  if (error || !data?.[0]) return false
  return true
},
```

**Contract reference:** ARCHITECTURE.md §1.4 — "Owner always means Actor Owner — verified through `actor_owners`."

### HIGH — DB Schema Provenance Gap

`reviews.reviews` grants (INSERT/UPDATE/DELETE) and `vc.is_actor_owner()` function definition are not in tracked migration files. Must be located in untracked baseline SQL and added to migration history.

### MEDIUM — N+1 in Author Card Batch

`dalGetAuthorCardsForReviews` makes one RPC per reviewId. See Kraven audit for fix options.

---

## Audit Trail

| Command | File | Status |
|---|---|---|
| VENOM | `CURRENT/features/dashboard/evidence/venom_reviews_module_2026-05-23.md` | BLOCKED |
| BLACKWIDOW | `CURRENT/features/dashboard/evidence/blackwidow_reviews_module_2026-05-23.md` | BLOCKED |
| LOKI | `CURRENT/features/dashboard/evidence/loki_reviews_module_2026-05-23.md` | REVIEW_PENDING |
| KRAVEN | `_ACTIVE/audits/performance/kraven_reviews_module_2026-05-23.md` | REVIEW_PENDING |
| SENTRY | `CURRENT/features/dashboard/evidence/sentry_reviews_module_2026-05-23.md` | BLOCKED |
| REVIEW-CONTRACT | `CURRENT/features/dashboard/evidence/review-contract_reviews_module_2026-05-23.md` | BLOCKED |
