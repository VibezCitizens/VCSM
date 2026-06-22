# DB Audit — Reviews Schema Deep Audit
**Date:** 2026-05-25  
**Command:** /DB  
**Scope:** `reviews.*` (all tables, views, functions, triggers, indexes, RLS policies)  
**Connection:** Live Supabase — `db.nkdrjlmbtqbywhcthppm.supabase.co` (Vibez Citizens SM)  
**Trigger:** ARCHITECT P0 finding — `upsert_neutral_review` SECURITY DEFINER ownership chain audit

---

## Audit Context

This audit was triggered by the ARCHITECT deep review of the VCSM Vport Reviews Dashboard module.  
The primary P0 finding was: verify that `upsert_neutral_review` (SECURITY DEFINER) correctly enforces actor ownership — specifically whether the DB-level `vc.is_actor_owner()` function it calls queries `actor_owners` (proves ownership) vs `actors` (proves existence only).

This session also completed the N+1 elimination in `listReviews.controller.js`, the `isActorOwner` app-level fix in `features/reviews/setup.js`, and dead code deletion across 5 files.

---

## Schema Inventory (Live)

### Base Tables — 4

| Table | RLS Enabled | RLS Forced | Policies |
|---|---|---|---|
| `reviews.reviews` | ✅ YES | ✅ YES | 5 |
| `reviews.review_dimension_ratings` | ✅ YES | ✅ YES | 5 |
| `reviews.review_dimensions` | ✅ YES | ✅ YES | 2 |
| `reviews.review_revisions` | ✅ YES | ✅ YES | 1 |

All 4 base tables have RLS enabled AND forced. No table is unprotected.

### Views — 4 (confirmed from previous audit)
- `reviews.public_active_reviews_v`
- `reviews.vport_review_stats_v`
- `reviews.review_dimension_stats_v`
- `reviews.my_active_reviews_v`

### Functions — 12 SECURITY DEFINER + 1 SECURITY INVOKER

| Function | Security | search_path | row_security | Notes |
|---|---|---|---|---|
| `upsert_neutral_review` | DEFINER | reviews, vc, public | OFF | Primary write RPC |
| `hydrate_review_snapshots` | DEFINER | reviews, vc, vport, public, **identity** | OFF | BEFORE INSERT/UPDATE trigger |
| `validate_target_actor_is_active_vport` | DEFINER | reviews, vc, vport, public | OFF | Called by upsert |
| `require_authenticated` | DEFINER | public, auth | (not set) | Session gate |
| `get_review_author_card` | DEFINER | reviews, public | OFF | **ORPHANED** — app no longer calls |
| `get_target_overall_stats` | DEFINER | reviews, public | OFF | Stats aggregation |
| `enforce_rating_no_downgrade` | DEFINER | reviews, public | OFF | BEFORE UPDATE trigger |
| `hydrate_dimension_rating_snapshots` | DEFINER | reviews, public | OFF | BEFORE INSERT trigger |
| `recalc_review_overall_rating` | DEFINER | reviews, public | OFF | Called by trigger |
| `trg_recalc_review_overall_rating` | DEFINER | reviews, public | OFF | AFTER DML trigger wrapper |
| `resolve_target_subtype` | DEFINER | vc, vport, public | OFF | Helper called by trigger |
| `write_review_revision` | DEFINER | reviews, public | OFF | AFTER INSERT/UPDATE trigger |
| `touch_updated_at` | INVOKER | — | — | Only SECURITY INVOKER |

---

## Security Chain Audit — `upsert_neutral_review`

### Chain Trace

```
upsert_neutral_review(p_target_actor_id, p_author_actor_id, p_body)
│
├── reviews.require_authenticated()
│     └── auth.uid() — raises if null
│
├── vc.is_actor_owner(p_author_actor_id)
│     └── SELECT 1 FROM vc.actor_owners ao
│           WHERE ao.actor_id = p_author_actor_id
│             AND ao.user_id = auth.uid()       ← correct ownership check
│             AND ao.is_void = false
│
├── reviews.validate_target_actor_is_active_vport(p_target_actor_id)
│     └── EXISTS (
│           FROM vc.actors a
│           JOIN vport.profiles vp ON vp.actor_id = a.id
│           WHERE a.id = p_target_actor_id
│             AND a.kind = 'vport'
│             AND a.is_void = false
│             AND vp.is_active = true
│             AND vp.is_deleted = false
│         )
│
└── upsert logic — 24h edit window check → INSERT or UPDATE
```

### Verdict: ✅ PASS — Chain is correct

`vc.is_actor_owner()` queries `vc.actor_owners` (ownership table) with `user_id = auth.uid()`. This is the correct ownership proof — a row in `actor_owners` means this session user owns this actor. It does NOT just check `vc.actors` (existence).

The three-layer defense is:
1. **Authenticated** — session has a valid JWT
2. **Owned** — the author actor belongs to this session user
3. **Valid target** — the target is an active vport

All three layers are enforced at the DB level before any write.

---

## `vc.is_actor_owner()` Full Definition

```sql
CREATE OR REPLACE FUNCTION vc.is_actor_owner(p_actor_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'vc', 'public'
  SET row_security TO 'off'
AS $function$
  select exists (
    select 1
    from vc.actor_owners ao
    where ao.actor_id = p_actor_id
      and ao.user_id = (select auth.uid())
      and ao.is_void = false
  );
$function$
```

**Assessment:** ✅ Correct. Queries `actor_owners`, enforces `user_id = auth.uid()`, filters void records. Has `SET search_path` and `SET row_security TO 'off'` (needed for SECURITY DEFINER reading across schema boundary).

---

## RLS Policy Audit — reviews.reviews

| Policy | Command | Roles | Condition |
|---|---|---|---|
| `reviews_public_vport_select` | SELECT | anon + authenticated | `target_kind = 'vport' AND active_card = true AND is_deleted = false` |
| `reviews_select_authenticated` | SELECT | authenticated | `active_card = true AND is_deleted = false` |
| `reviews_insert_authenticated` | INSERT | authenticated | `vc.is_actor_owner(author_actor_id) AND author <> target AND target_kind = 'vport' AND review_mode IN (...) AND verification_status IN (...)` |
| `reviews_update_author_owned` | UPDATE | authenticated | USING: `vc.is_actor_owner(author_actor_id)` / WITH CHECK: `vc.is_actor_owner(author_actor_id)` |
| `reviews_delete_author_owned` | DELETE | authenticated | `vc.is_actor_owner(author_actor_id)` |

All write operations (INSERT/UPDATE/DELETE) require `vc.is_actor_owner()` to return true.  
`vc.is_actor_owner()` itself queries `actor_owners` with `auth.uid()` enforcement.

**Assessment:** ✅ Complete coverage. All four DML operations are protected.

---

## RLS Policy Audit — review_dimension_ratings

| Policy | Command | Notes |
|---|---|---|
| `review_dimension_ratings_public_select` | SELECT (anon+auth) | via parent review: active_card=true, is_deleted=false, target_kind='vport' |
| `review_dimension_ratings_select_authenticated` | SELECT (auth) | via parent review: active_card=true, is_deleted=false |
| `review_dimension_ratings_insert_author_owned` | INSERT | via parent review: `vc.is_actor_owner(r.author_actor_id)` |
| `review_dimension_ratings_update_author_owned` | UPDATE | USING + WITH CHECK: via parent review ownership |
| `review_dimension_ratings_delete_author_owned` | DELETE | via parent review ownership |

**Assessment:** ✅ Correct. Ownership enforced by traversing to parent review.

---

## RLS Policy Audit — review_dimensions (Admin Table)

| Policy | Command | Notes |
|---|---|---|
| `review_dimensions_public_select` | SELECT (anon+auth) | `is_active = true` only |
| `review_dimensions_select_public` | SELECT (auth) | `is_active = true` only |
| *No INSERT/UPDATE/DELETE policies* | — | RLS deny-by-default for write |

**Assessment:** ✅ Intentional. This is an admin-managed table. No user writes expected or permitted. RLS enabled + forced means missing policies = deny. All writes must go through privileged DB access.

---

## RLS Policy Audit — review_revisions (Append-Only via Trigger)

| Policy | Command | Notes |
|---|---|---|
| `review_revisions_select_authenticated` | SELECT | via parent review: not deleted + active_card |
| *No INSERT/UPDATE/DELETE policies* | — | RLS deny-by-default |

**Assessment:** ✅ Intentional. All revision writes are done by the `write_review_revision()` SECURITY DEFINER trigger. No direct user writes. The trigger runs as the function owner (`postgres`) with `SET row_security TO 'off'`, bypassing the RLS deny correctly.

---

## Check Constraints — reviews.reviews

| Constraint | Definition |
|---|---|
| `reviews_check` | `author_actor_id <> target_actor_id` — DB-level self-review prevention |
| `reviews_check1` | `(is_deleted = false AND deleted_at IS NULL) OR (is_deleted = true AND deleted_at IS NOT NULL)` — soft-delete integrity |
| `reviews_overall_rating_check` | `overall_rating IS NULL OR (overall_rating >= 0 AND overall_rating <= 5)` |
| `reviews_rating_scale_check` | `rating_scale = 5` — fixed scale enforcement |
| `reviews_review_mode_check` | `review_mode IN ('neutral', 'transactional')` |
| `reviews_target_kind_check` | `target_kind = 'vport'` — scope lock |
| `reviews_verification_status_check` | status IN ('unverified', 'pending', 'verified', 'rejected') |

**Assessment:** ✅ Well-constrained. Both the self-review prevention and soft-delete integrity are enforced at DB level (not just app layer).

---

## Index Analysis — reviews Schema

### reviews.reviews Indexes

| Index | Columns | Type | Purpose |
|---|---|---|---|
| `reviews_pkey` | `id` | UNIQUE | PK |
| `idx_reviews_target_feed` | `(target_actor_id, active_card, is_deleted, review_activity_at DESC)` | BTREE | List query — maps exactly to `dalListReviewsByTarget` filter |
| `idx_reviews_author_target` | `(author_actor_id, target_actor_id, review_mode)` | BTREE | Lookup for "my active review" check |
| `idx_reviews_mode_status` | `(review_mode, verification_status, is_deleted)` | BTREE | Mode/status filtering |
| `uq_reviews_active_card` | `(author_actor_id, target_actor_id, review_mode) WHERE active_card=true AND is_deleted=false` | PARTIAL UNIQUE | Enforces one active review per author-target-mode |

**Assessment:** ✅ Strong index coverage. The `idx_reviews_target_feed` exactly matches the `dalListReviewsByTarget` query pattern. The partial unique index `uq_reviews_active_card` enforces the business rule at DB level.

### review_dimensions Duplicate Index — IDENTIFIED ISSUE

```
review_dimensions_target_kind_target_subtype_key_key  — from UNIQUE CONSTRAINT
review_dimensions_type_key_uidx                        — manually created
```

Both are: `CREATE UNIQUE INDEX ... ON reviews.review_dimensions USING btree (target_kind, target_subtype, key)`

**These are exact duplicates.** PostgreSQL maintains both independently, doubling write overhead for dimension upserts and wasting storage.

---

## Trigger Audit — reviews Schema

| Trigger | Table | Timing | Event | Function |
|---|---|---|---|---|
| `trg_reviews_hydrate_snapshots` | reviews | BEFORE | INSERT, UPDATE | `hydrate_review_snapshots()` |
| `trg_reviews_touch_updated_at` | reviews | BEFORE | UPDATE | `touch_updated_at()` |
| `trg_reviews_write_revision_insert` | reviews | AFTER | INSERT | `write_review_revision()` |
| `trg_reviews_write_revision_update` | reviews | AFTER | UPDATE | `write_review_revision()` |
| `trg_review_dimension_ratings_hydrate_snapshots` | review_dimension_ratings | BEFORE | INSERT | `hydrate_dimension_rating_snapshots()` |
| `trg_review_dimension_ratings_no_downgrade` | review_dimension_ratings | BEFORE | UPDATE | `enforce_rating_no_downgrade()` |
| `trg_review_dimension_ratings_recalc` | review_dimension_ratings | AFTER | INSERT, UPDATE, DELETE | `trg_recalc_review_overall_rating()` |
| `trg_review_dimension_ratings_touch_updated_at` | review_dimension_ratings | BEFORE | UPDATE | `touch_updated_at()` |
| `trg_review_dimensions_touch_updated_at` | review_dimensions | BEFORE | UPDATE | `touch_updated_at()` |

**Key observation:** `hydrate_review_snapshots` fires on BOTH INSERT and UPDATE. This means snapshot columns are refreshed whenever a review row is touched — ensuring display names, usernames, and avatar URLs stay current if they change. This is the correct behavior.

---

## Findings

---

```
DATABASE REVIEW ITEM
- Object: reviews.get_review_author_card (FUNCTION)
- Application Scope: ENGINE (reviews engine)
- Severity: LOW
- Security bypass detected: NO
- Current behavior: SECURITY DEFINER function that reads author snapshot columns from reviews.reviews for a given review_id. Returns (actor_id, display_name, username, avatar_url).
- Problem: This function is now ORPHANED. The listReviews.controller.js engine update (this session) eliminated the N+1 pattern that required this function. Author cards are now built inline from snapshot columns already present in each review row. The function exists in the DB but is no longer called by any application code.
- Why it matters: Orphaned SECURITY DEFINER functions increase the attack surface unnecessarily. Any future code that rediscovers this function could reintroduce the N+1 pattern. It also creates maintenance confusion — engineers must determine whether removing the function would break anything.
- Recommended improvement: Drop the function in a future schema migration once confirmed no external consumers exist.
- Rationale: The snapshot data it reads (author_display_name_snapshot, author_username_snapshot, author_avatar_url_snapshot) is the same data now read directly from the row in listReviews.controller.js. The function is functionally redundant.
- Risk if unchanged: Low. The function is harmless. Risk is confusion and unnecessary surface area, not an active security issue.
- Example SQL proposal (text only, do not run):
  DROP FUNCTION IF EXISTS reviews.get_review_author_card(uuid);
```

---

```
DATABASE REVIEW ITEM
- Object: review_dimensions_type_key_uidx (INDEX)
- Application Scope: ENGINE (reviews engine)
- Severity: MEDIUM
- Security bypass detected: NO
- Current behavior: Two unique indexes on reviews.review_dimensions enforcing identical uniqueness on (target_kind, target_subtype, key):
  1. review_dimensions_target_kind_target_subtype_key_key — generated by UNIQUE CONSTRAINT
  2. review_dimensions_type_key_uidx — manually created index, exact duplicate
- Problem: PostgreSQL maintains both indexes independently on every INSERT/UPDATE/DELETE to review_dimensions. This doubles write overhead for dimension management and wastes storage with zero benefit — both indexes enforce the same constraint on the same columns in the same order.
- Why it matters: While review_dimensions is a low-write table (admin-managed), maintaining duplicate indexes is wasteful and confusing. Engineers inspecting indexes cannot determine which one is authoritative.
- Recommended improvement: Drop the manually created duplicate index. The UNIQUE CONSTRAINT index (review_dimensions_target_kind_target_subtype_key_key) is authoritative since it enforces the constraint.
- Rationale: Unique constraint indexes and manual duplicate indexes are fully redundant — PostgreSQL uses one to enforce both uniqueness and fast lookup.
- Risk if unchanged: Low write overhead and storage waste. No correctness risk.
- Example SQL proposal (text only, do not run):
  DROP INDEX IF EXISTS reviews.review_dimensions_type_key_uidx;
  -- The constraint review_dimensions_target_kind_target_subtype_key_key remains and continues to enforce uniqueness.
```

---

```
DATABASE REVIEW ITEM
- Object: reviews.hydrate_review_snapshots (FUNCTION/TRIGGER)
- Application Scope: ENGINE (reviews engine)
- Severity: INFO
- Security bypass detected: NO
- Current behavior: BEFORE INSERT/UPDATE trigger on reviews.reviews. Uses SET search_path TO 'reviews', 'vc', 'vport', 'public', 'identity'. Reads from identity.actor_directory (a view in the identity schema) to resolve author display name and username for user-kind authors.
- Problem: The search_path includes the 'identity' schema. For SECURITY DEFINER functions, a broader search_path means a malicious function in any listed schema could shadow a built-in. However, the identity schema is a trusted platform schema controlled by the application team, not a public extension.
- Why it matters: The 'identity' schema is legitimately needed — the function JOINs identity.actor_directory to resolve user author display names. The inclusion is intentional and correct.
- Recommended improvement: None required. Document the intentional identity schema inclusion in the function comment.
- Rationale: All schemas in the search_path are trusted platform-owned schemas. The function correctly requires identity.actor_directory to hydrate user-kind author snapshots. Restricting the search_path would break author snapshot hydration for user actors.
- Risk if unchanged: No active risk.
- Example SQL proposal (text only, do not run):
  -- No change recommended. The search_path is correct.
  -- Consider adding an inline comment documenting why identity is included:
  -- SET search_path TO 'reviews', 'vc', 'vport', 'public', 'identity'
  -- ^ identity included: required for identity.actor_directory (user author snapshots)
```

---

```
DATABASE REVIEW ITEM
- Object: vc.is_actor_owner (FUNCTION) — P0 RESOLUTION
- Application Scope: VCSM + ENGINE
- Severity: INFO (P0 confirmed RESOLVED)
- Security bypass detected: NO
- Current behavior: SELECT EXISTS from vc.actor_owners WHERE actor_id = p_actor_id AND user_id = auth.uid() AND is_void = false.
- Problem: NONE. This is the correct implementation. The function proves actor ownership by checking the actor_owners table (not just existence in actors), enforces session-bound lookup via auth.uid(), and filters void records.
- Why it matters: This function is the cornerstone of the reviews security model — called by all 5 write policies on reviews.reviews and review_dimension_ratings, and called explicitly inside upsert_neutral_review. Its correctness is critical.
- Recommended improvement: No change needed.
- Rationale: The implementation matches the required ownership proof contract: a row in actor_owners with user_id = auth.uid() means the session user owns the actor. The app-level isActorOwner check in features/reviews/setup.js was also corrected this session to match this pattern (was querying vc.actors, now queries vc.actor_owners).
- Risk if unchanged: No risk — implementation is correct.
- Example SQL proposal: N/A
```

---

```
DATABASE REVIEW ITEM
- Object: upsert_neutral_review security chain (COMPLETE AUDIT)
- Application Scope: ENGINE (reviews engine)
- Severity: INFO (chain verified as PASS)
- Security bypass detected: NO — SET row_security TO 'off' is intentional for SECURITY DEFINER upsert, not a bypass
- Current behavior: Three-layer security chain before any write:
  1. reviews.require_authenticated() — verifies auth.uid() is not null, raises if unauthenticated
  2. vc.is_actor_owner(p_author_actor_id) — queries actor_owners with auth.uid(), raises if not owner
  3. reviews.validate_target_actor_is_active_vport(p_target_actor_id) — JOINs vc.actors + vport.profiles, raises if target is not an active vport
  Then: upsert with 24h edit window enforcement.
- Problem: NONE. The chain is correct and complete.
- Why it matters: SET row_security TO 'off' inside a SECURITY DEFINER function is necessary for the function to perform the upsert as the function owner. The three guards before the upsert ensure that only an authenticated session owner of the author actor can write a review targeting a valid active vport.
- Recommended improvement: Consider adding author_actor_id <> target_actor_id check inside the function body as a defense-in-depth layer (the DB CHECK constraint already enforces this, but explicit raises are friendlier).
- Risk if unchanged: No active risk.
- Example SQL proposal (text only, do not run):
  -- Optional defense-in-depth addition inside upsert_neutral_review:
  IF p_author_actor_id = p_target_actor_id THEN
    RAISE EXCEPTION 'cannot review self';
  END IF;
  -- This mirrors the existing CHECK constraint but returns a clearer error message.
```

---

## Summary Assessment

| Area | Status | Notes |
|---|---|---|
| RLS coverage — all 4 tables | ✅ PASS | Enabled AND forced. All tables have policies. |
| Write policy coverage | ✅ PASS | All write operations on reviews + ratings require ownership proof |
| SECURITY DEFINER search_path | ✅ PASS | All 12 SECURITY DEFINER functions have explicit SET search_path |
| `vc.is_actor_owner()` implementation | ✅ PASS | Correctly queries actor_owners with auth.uid() — P0 confirmed resolved |
| `upsert_neutral_review` security chain | ✅ PASS | Three-layer defense: auth + ownership + target validation |
| Orphaned function | ⚠️ LOW | `get_review_author_card` — app code no longer calls it; drop in next migration |
| Duplicate index | ⚠️ MEDIUM | `review_dimensions_type_key_uidx` duplicates the constraint index — drop it |
| `reviews_check` (self-review) | ✅ PASS | `author_actor_id <> target_actor_id` enforced at DB level |
| Soft-delete integrity | ✅ PASS | `reviews_check1` enforces consistent is_deleted + deleted_at state |
| Index coverage for list query | ✅ PASS | `idx_reviews_target_feed` exactly matches dalListReviewsByTarget pattern |
| Snapshot hydration | ✅ PASS | Trigger fires on INSERT + UPDATE, keeps snapshots fresh |

### Overall Security Verdict: ✅ CLEAN

The reviews schema is well-designed. The only actionable items are housekeeping:
- Drop the orphaned `get_review_author_card` function (LOW)
- Drop the duplicate `review_dimensions_type_key_uidx` index (MEDIUM, housekeeping)

No active security vulnerabilities detected. The ARCHITECT P0 finding (verify `vc.is_actor_owner()` correctly enforces ownership) is confirmed RESOLVED at both the DB level and app level.

---

## Related App-Level Changes This Session

| Fix | File | Status |
|---|---|---|
| `isActorOwner` corrected to query `actor_owners` | `apps/VCSM/src/features/reviews/setup.js` | ✅ Applied |
| N+1 author card eliminated | `engines/reviews/src/controller/listReviews.controller.js` | ✅ Applied |
| `engines/reviews/src/dal/authors.read.dal.js` deleted | — | ✅ Deleted |
| Dead write DAL deleted | `apps/VCSM/src/features/profiles/.../vportReviews.write.dal.js` | ✅ Deleted |
| `ctrlSubmitReview` duplicate reads eliminated | `VportReviews.controller.js` | ✅ Applied |
| `useVportReviewCompose` extracted from view | New hook | ✅ Created |
