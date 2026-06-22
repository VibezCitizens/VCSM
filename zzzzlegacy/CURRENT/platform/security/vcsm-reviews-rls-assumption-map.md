# VCSM Reviews Dashboard — RLS Assumption Map

Scope: VCSM + ENGINE (reviews)
Scan Date: 2026-05-24
ARCHITECT Version: 26.14

All findings require VENOM audit to confirm DB-level policy states.

---

## Trust Boundary Overview

The reviews module operates across three trust zones:

```
Zone 1: Client-side pre-guards (in app code)
Zone 2: App-level DB read guards (RLS on vc.actors, vport.profiles)
Zone 3: Engine-level DB write guards (SECURITY DEFINER RPCs — real enforcement)
```

**Zone 3 is the authoritative trust boundary.**
Zones 1 and 2 are defense-in-depth — they can fail without exposing write paths
because Zone 3 RPCs enforce ownership at DB level.

---

## RLS ASSUMPTION MAP

---

### Table: reviews.reviews (read — listReviews)

```
DAL Method: dalListReviewsByTarget (engines/reviews/src/dal/reviews.read.dal.js)
Tables Accessed: reviews.reviews
Assumed Protection Layer: RLS on reviews.reviews (SELECT policy)
App-Layer Auth Checks: NONE — controller calls directly after targetActorId validation
Client Used: getSupabaseClient() — authenticated Supabase client (session-aware)
Risk: MEDIUM
Notes:
  - Query filters by active_card=true AND is_deleted=false
  - If RLS policy on reviews.reviews allows anon SELECT (e.g., for public profiles),
    any actor could read any vport's reviews without authentication
  - Assumption: reviews.reviews has a SELECT policy allowing all authenticated users
    to read reviews for any target (reviews are public information)
  - VENOM must confirm SELECT policy intent: is it open, or restricted by viewer?
```

---

### Table: reviews.reviews (read — getMyActiveReview)

```
DAL Method: dalGetActiveReviewByAuthor (engines/reviews/src/dal/reviews.read.dal.js)
Tables Accessed: reviews.reviews
Assumed Protection Layer: RLS on reviews.reviews (SELECT policy)
App-Layer Auth Checks: NONE beyond authorActorId parameter presence
Client Used: getSupabaseClient() — authenticated client
Risk: MEDIUM
Notes:
  - Query filters by author_actor_id AND target_actor_id AND active_card=true
  - If SELECT policy is open, a user who guesses a reviewId can read any draft review body
  - The app doesn't enforce "viewer = author" at the DAL level — relies on RLS
  - VENOM must confirm: does reviews.reviews SELECT policy restrict author_actor_id
    to only the session user's actors?
```

---

### Table: reviews.reviews (write — upsert_neutral_review RPC)

```
DAL Method: dalRpcUpsertNeutralReview (engines/reviews/src/dal/reviews.rpc.dal.js)
Tables Accessed: reviews.reviews (via SECURITY DEFINER RPC)
Assumed Protection Layer: SECURITY DEFINER RPC enforces author_actor_id ownership
App-Layer Auth Checks:
  1. ctrlSubmitReview: targetActorId !== authorActorId (self-review guard)
  2. ctrlSubmitReview: dalReadReviewTargetActor → kind='user' (citizen-only guard)
  3. isActorOwner(authorActorId) — ⚠️ SEE WARNING BELOW
Client Used: getSupabaseClient()
Risk: LOW (DB RPC is authoritative) — but app-layer isActorOwner is WEAK
```

**⚠️ SECURITY WARNING — isActorOwner Implementation Gap:**

```
Location: apps/VCSM/src/features/reviews/setup.js
Issue: The injected isActorOwner(actorId) function:
  1. Checks session exists → if (!session?.user?.id) return false  ✓
  2. Queries vc.actors WHERE id=actorId AND is_void=false → returns true if found  ✗

What it DOES NOT check:
  - Whether session.user.id maps to an owner of actorId via actor_owners
  - Any ownership join or RLS policy verification

Result: isActorOwner returns true for ANY authenticated user + ANY existing active actor.
  An authenticated user could call submitReview with another user's authorActorId
  and pass the app-layer isActorOwner check.

Real protection: upsert_neutral_review is SECURITY DEFINER and must enforce
  that the DB session user (via auth.uid()) owns author_actor_id.

Risk Assessment:
  - IF upsert_neutral_review RPC enforces auth.uid() ownership → risk is CONTAINED AT DB
  - IF upsert_neutral_review RPC trusts p_author_actor_id as passed → risk is HIGH
  VENOM must audit the upsert_neutral_review function body.

Recommended fix: Add actor_owners lookup to isActorOwner:
  SELECT 1 FROM vc.actor_owners
  WHERE actor_id=actorId AND user_id=session.user.id LIMIT 1
```

---

### Table: reviews.review_dimension_ratings (write — upsert)

```
DAL Method: dalUpsertDimensionRatings (engines/reviews/src/dal/dimensionRatings.write.dal.js)
Tables Accessed: reviews.review_dimension_ratings
Assumed Protection Layer: RLS on review_dimension_ratings OR SECURITY DEFINER scope
App-Layer Auth Checks: Called only inside submitReview after upsert_neutral_review succeeds
Client Used: getSupabaseClient()
Risk: MEDIUM
Notes:
  - If review_dimension_ratings has open INSERT/UPSERT policy, a client could upsert
    ratings for any review_id (not just their own)
  - Depends on whether RLS links review_id back to author ownership
  - VENOM must confirm: does review_dimension_ratings have a policy that enforces
    review_id.author_actor_id = session user's actor?
```

---

### Table: reviews.reviews (write — soft delete)

```
DAL Method: dalSoftDeleteReview (engines/reviews/src/dal/reviews.write.dal.js)
Tables Accessed: reviews.reviews
Assumed Protection Layer: App-layer check + RLS
App-Layer Auth Checks:
  1. deleteReview controller: existing.author_actor_id === authorActorId (explicit check)
  2. isActorOwner(authorActorId) — same weak check as submit
Client Used: getSupabaseClient()
Risk: LOW-MEDIUM
Notes:
  - App-layer check verifies author matches — stronger than submit path
  - RLS must prevent UPDATE on reviews.reviews where author_actor_id ≠ session actor
```

---

### Table: vc.actors (read — reviewTarget validation)

```
DAL Method: dalReadReviewTargetActor (apps/.../dal/review/reviewTarget.read.dal.js)
Tables Accessed: vc.actors
Assumed Protection Layer: RLS on vc.actors (SELECT policy, vcClient)
App-Layer Auth Checks: Checks kind='vport', is_void=false
Client Used: vcClient (vc schema)
Risk: LOW — public vport actor IDs are not sensitive
```

---

### RPC: get_review_author_card (SECURITY DEFINER)

```
DAL Method: dalGetAuthorCardsForReviews (engines/reviews/src/dal/authors.read.dal.js)
RPC: reviews.get_review_author_card(p_review_id UUID)
Assumed Protection Layer: SECURITY DEFINER — bypasses RLS for private actors
App-Layer Auth Checks: NONE — any authenticated caller can get any review's author card
Client Used: getSupabaseClient()
Risk: LOW-MEDIUM
Notes:
  - Returns display_name, username, avatar_url — not private data
  - But SECURITY DEFINER on RPC means it can read vc.actors even for private accounts
  - Confirm: RPC only returns snapshot/public fields, not raw UUIDs or sensitive data
  - VENOM must audit: what does get_review_author_card actually SELECT and return?
```

---

### Public View: reviews.public_vport_reviews_v (read — public path)

```
DAL Method: readPublicVportReviewsDAL (apps/.../public/vportMenu/dal/readPublicVportReviews.dal.js)
Tables Accessed: reviews.public_vport_reviews_v
Assumed Protection Layer: View definition strips private data; supabase anon client
App-Layer Auth Checks: NONE — public route, unauthenticated access expected
Client Used: supabase (main client, potentially anon)
Risk: LOW — view is designed for public consumption
Notes:
  - Returns: review_id, target_actor_id, author_actor_id, verification_status,
              overall_rating, body, author_*_snapshot, review_activity_at, created_at
  - author_actor_id is exposed in public view — VENOM confirm if this is intentional
    (actor IDs are UUIDs, not human-readable — generally acceptable)
  - body is exposed — confirm no moderation filter on view for deleted/flagged reviews
```

---

### Public View: reviews.public_vport_review_summary_v (read — public path, cached)

```
DAL Method: readPublicVportReviewSummaryDAL (TTL cache 60s)
Tables Accessed: reviews.public_vport_review_summary_v
Client Used: supabase (main client)
Risk: LOW — aggregate only (count, avg, timestamps)
```

---

## MISSING AUTH PATHS

| Location | Missing Auth | Risk |
|---|---|---|
| isActorOwner(authorActorId) in setup.js | Does not verify session → actor ownership | HIGH — DB RPC must enforce |
| dalGetActiveReviewByAuthor | No app-layer verification that caller is the author | MEDIUM — DB RLS must enforce |
| dalListReviewsByTarget | No auth check — open read | LOW if reviews are intentionally public |
| dalUpsertDimensionRatings | No app-layer review ownership check before upsert | MEDIUM — DB RLS must enforce |

---

## VENOM AUDIT CHECKLIST

1. Confirm upsert_neutral_review RPC enforces auth.uid() → actor ownership at DB level
2. Confirm get_review_author_card RPC returns only safe public fields (no raw IDs beyond actor_id)
3. Confirm reviews.reviews SELECT policy intent: open public read or restricted?
4. Confirm reviews.review_dimension_ratings INSERT/UPSERT policy scopes to author's reviews
5. Confirm reviews.reviews UPDATE policy scopes soft-delete to author only
6. Confirm public_vport_reviews_v view has no deleted/flagged reviews in output
7. Evaluate whether author_actor_id exposure in public view is acceptable
8. Recommend whether isActorOwner should be strengthened with actor_owners lookup
