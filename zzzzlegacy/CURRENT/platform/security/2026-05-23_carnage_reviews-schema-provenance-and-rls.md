# CARNAGE MIGRATION REPORT
**Topic:** reviews schema provenance gap + write-path RLS  
**Date:** 2026-05-23  
**Application Scope:** VCSM  
**Triggered by:** CEREBRO run → Venom V-01/V-02 → BlackWidow BW-01/BW-02  
**Migration reason:** Reviews write operations (UPDATE body, soft-delete, dimension rating upsert) have no tracked grants or RLS policies. `vc.is_actor_owner()` DB function has no tracked CREATE definition. All reviews RPCs are untracked. This is the same pattern as `20260523010000_backfill_tracked_rls_coverage.sql`.  
**Migration type:** Backfill provenance tracking (idempotent, additive) + new write-path RLS  
**Migration Safety Status:** CAUTION  
**Confidence:** HIGH (pattern proven by three prior backfill migrations)

---

## SCHEMA TRUST CLASSIFICATION

| Object | Classification | Reason |
|---|---|---|
| `reviews.reviews` | Ownership-sensitive + Public | User-authored content; wrong ownership = impersonation, suppression |
| `reviews.review_dimension_ratings` | Ownership-sensitive | Linked to review authorship; write grants actor identity |
| `vc.is_actor_owner(uuid)` | Identity-sensitive + Ownership-sensitive | Core ownership predicate used across security-critical functions |
| `reviews.upsert_neutral_review` | Ownership-sensitive + Engine-critical | SECURITY DEFINER write path; must enforce author ownership |
| `reviews.get_review_author_card` | Public + Engine-critical | Author enrichment RPC; SECURITY DEFINER bypasses RLS for private actors |
| `reviews.get_target_overall_stats` | Public | Aggregate stats; read-only |
| `reviews.public_vport_review_summary_v` | Public | Read-model view used by business card RPCs |

---

## CURRENT STRUCTURE

| Object | Tracked Status | Tracked In | Gap |
|---|---|---|---|
| `GRANT USAGE ON SCHEMA reviews TO authenticated` | ✅ TRACKED | `20260503040334`, `20260503052543` | None |
| `GRANT SELECT ON reviews.reviews TO authenticated` | ✅ TRACKED | `20260503052543:62` | None |
| `GRANT SELECT ON reviews.review_dimension_ratings TO authenticated` | ✅ TRACKED | `20260503052543:63` | None |
| `GRANT SELECT ON reviews.review_dimensions TO authenticated` | ✅ TRACKED | `20260503040334:102`, `20260503052543:459` | None |
| `reviews.review_dimensions` RLS SELECT policy | ✅ TRACKED | `20260503040334:110`, `20260503052543:461` | None |
| `GRANT INSERT/UPDATE/DELETE ON reviews.reviews` | ❌ NOT TRACKED | — | Schema provenance gap |
| `GRANT INSERT/UPDATE/DELETE ON reviews.review_dimension_ratings` | ❌ NOT TRACKED | — | Schema provenance gap |
| `ALTER TABLE reviews.reviews ENABLE ROW LEVEL SECURITY` | ❌ NOT TRACKED | — | Schema provenance gap |
| `ALTER TABLE reviews.review_dimension_ratings ENABLE ROW LEVEL SECURITY` | ❌ NOT TRACKED | — | Schema provenance gap |
| `reviews.reviews` SELECT RLS policy | ❌ NOT TRACKED | — | Schema provenance gap |
| `reviews.reviews` UPDATE RLS policy (body edit + soft-delete) | ❌ NOT TRACKED | — | **Security gap — write enforcement missing** |
| `reviews.review_dimension_ratings` INSERT/UPDATE RLS | ❌ NOT TRACKED | — | **Security gap** |
| `reviews.review_dimension_ratings` DELETE RLS | ❌ NOT TRACKED | — | **Security gap** |
| `vc.is_actor_owner(uuid)` CREATE FUNCTION | ❌ NOT TRACKED | — | **Schema provenance gap — referenced by 3+ tracked functions** |
| `reviews.upsert_neutral_review(uuid,uuid,text)` CREATE FUNCTION | ❌ NOT TRACKED | — | Schema provenance gap |
| `reviews.get_review_author_card(uuid)` CREATE FUNCTION | ❌ NOT TRACKED | — | Schema provenance gap |
| `reviews.get_target_overall_stats(uuid)` CREATE FUNCTION | ❌ NOT TRACKED | — | Schema provenance gap |
| `reviews.public_vport_review_summary_v` CREATE VIEW | ❌ NOT TRACKED | — | Schema provenance gap |

---

## MIGRATION BLAST RADIUS

**Affected systems:**  
- `engines/reviews/src/dal/reviews.write.dal.js` — UPDATE operations (`dalUpdateReviewBody`, `dalSoftDeleteReview`)  
- `engines/reviews/src/dal/dimensionRatings.write.dal.js` — UPSERT + DELETE operations  
- `engines/reviews/src/dal/reviews.rpc.dal.js` — three RPCs  
- `apps/VCSM/src/features/reviews/setup.js` — `isActorOwner` (app code fix, parallel — NOT a DB migration)  
- All VPORT profiles with reviews (public trust — review data integrity)  

**Runtime impact:** None on happy path — migration is additive and idempotent on live DB.  
**Release impact:** Must deploy before reviews write path is user-accessible.  
**Rollback impact:** PARTIAL — GRANTs can be revoked; policies can be dropped; function can be dropped. RLS state change on live DB requires care if reviews are already being written.

---

## RLS IMPACT REVIEW

| Object | RLS Dependency | Risk | Follow-up Required |
|---|---|---|---|
| `reviews.reviews` UPDATE | CRITICAL — ownership | Without policy, any authenticated user can update any review body or soft-delete | Venom re-run after migration |
| `reviews.reviews` SELECT | DIRECT — visibility | Without policy, all reviews visible including deleted/inactive | Low — deleted reviews are filtered app-layer |
| `reviews.review_dimension_ratings` INSERT/UPDATE | CRITICAL — ownership | Without policy, any user can write ratings for any review | Venom re-run after migration |
| `vc.is_actor_owner(uuid)` | CRITICAL — predicate | Used in all ownership checks across RLS policies and SECURITY DEFINER functions | Must be idempotent CREATE OR REPLACE |

---

## RUNTIME IMPACT ANALYSIS

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| `dalUpdateReviewBody` live path | HIGH pre-fix | If live DB has no UPDATE grant, writes silently fail | Backfill adds grants idempotently |
| `dalSoftDeleteReview` live path | HIGH pre-fix | Same | Same |
| `dalUpsertDimensionRatings` live path | HIGH pre-fix | Upsert fails without INSERT/UPDATE grant | Same |
| `reviews.reviews` RLS enforcement | NONE post-fix | Policy is additive, does not change what readable/writable | N/A |
| `vc.is_actor_owner()` function | NONE — already live | CREATE OR REPLACE is safe — function already running | Use CREATE OR REPLACE |
| RPCs (SECURITY DEFINER) | NONE — already live | Tracking only — no body change | Use CREATE OR REPLACE |

---

## MIGRATION DEPENDENCY GRAPH

| Dependency Type | Affected Area | Risk |
|---|---|---|
| DAL dependency | `dalUpdateReviewBody`, `dalSoftDeleteReview` depend on UPDATE grant + RLS passing | HIGH — write path broken without grant |
| DAL dependency | `dalUpsertDimensionRatings`, `dalDeleteDimensionRatingsForReview` depend on INSERT/DELETE grants | HIGH |
| RPC dependency | `dalRpcUpsertNeutralReview` depends on `reviews.upsert_neutral_review` RPC existing | LIVE — already deployed, tracking only |
| RLS dependency | All UPDATE policies on `reviews.reviews` depend on `vc.is_actor_owner()` or `vc.actor_owners` | CRITICAL — must track function first |
| Engine dependency | `engines/reviews` ownership model depends on `vc.actor_owners` pattern | Must align with ARCHITECTURE.md §1.4 |
| App code dependency | `setup.js` `isActorOwner` must be fixed in parallel with DB migration | Not a DB migration — Wolverine task |

---

## DATA INTEGRITY REVIEW

| Integrity Area | Risk | Detection Method | Mitigation |
|---|---|---|---|
| Reviews authored by wrong actor | CRITICAL if BW-01 exploited before fix | Query `reviews.reviews` for `author_actor_id` rows where no `actor_owners` match `user_id` | Fix `isActorOwner` immediately; query live DB after fix |
| Reviews deleted by wrong actor | CRITICAL if BW-02 exploited before fix | Query `reviews.reviews WHERE is_deleted = true AND deleted_at > first_review_date` for anomalous patterns | Audit `deleted_at` timestamps against `actor_owners` |
| Orphaned dimension ratings | MEDIUM — ratings with no matching review | `review_dimension_ratings` LEFT JOIN `reviews.reviews WHERE id IS NULL` | Constraint check on deploy |
| Reviews soft-deleted but recoverable | LOW | `is_deleted = true` rows retain all data | By design — soft-delete pattern |

---

## MIGRATION EXECUTION STRATEGY

| Phase | Migration | Strategy | Risk | Notes |
|---|---|---|---|---|
| A | `vc.is_actor_owner()` — track function definition | Direct — CREATE OR REPLACE | LOW | Idempotent — if function already exists, replaces with identical body |
| B | `reviews.reviews` — track write grants + RLS | Backfill tracking — additive | LOW–MEDIUM | All DROP IF EXISTS + CREATE. Idempotent on live DB |
| C | `reviews.review_dimension_ratings` — track write grants + RLS | Backfill tracking — additive | LOW | Same pattern as B |
| D | Reviews RPCs — track definitions | Direct — CREATE OR REPLACE | LOW | Body must match what's currently live |
| E | App code — fix `isActorOwner` in `setup.js` | Parallel code change | NONE (no DB impact) | Wolverine task — not a DB migration |

**Deploy order:** A → B → C → (D can run any order) → E (app deploy)  
**A must precede B and C** because the RLS policies in B and C reference `vc.actor_owners` pattern (same as `is_actor_owner`).  
**D is independent** — RPC definitions tracking only, no behavioral change.  
**E is an app code deploy** — must ship simultaneously with or after A+B+C.

---

## ROLLBACK SURVIVABILITY

**Rollback status:** PARTIAL  
**Data recovery risk:** LOW — migration is additive; rollback removes grants and policies but does not delete data  
**Compatibility rollback risk:** MEDIUM — removing the RLS UPDATE policy on reviews.reviews would re-open write access to all authenticated users (reverts to pre-fix state)  
**Operational complexity:** LOW — all DROP POLICY IF EXISTS + REVOKE can be scripted identically  

**Rollback plan:**
```sql
-- Undo Migration B:
REVOKE INSERT, UPDATE, DELETE ON reviews.reviews FROM authenticated;
DROP POLICY IF EXISTS reviews_select_public  ON reviews.reviews;
DROP POLICY IF EXISTS reviews_update_author  ON reviews.reviews;

-- Undo Migration C:
REVOKE INSERT, UPDATE, DELETE ON reviews.review_dimension_ratings FROM authenticated;
DROP POLICY IF EXISTS ratings_select_public   ON reviews.review_dimension_ratings;
DROP POLICY IF EXISTS ratings_upsert_author   ON reviews.review_dimension_ratings;
DROP POLICY IF EXISTS ratings_delete_author   ON reviews.review_dimension_ratings;

-- Undo Migration A (only if no other functions depend on it):
-- DO NOT DROP vc.is_actor_owner() — it is called by vc.save_friend_ranks and vc.mark_read
```

> ⚠️ `vc.is_actor_owner()` CANNOT be safely dropped as a rollback step — it is a live dependency of `vc.save_friend_ranks` and `vc.mark_read` (both in tracked, deployed migrations).

---

## VALIDATION CHECKLIST

| Validation Area | Status | Notes |
|---|---|---|
| Schema compatibility | ✅ SAFE | Additive — no column changes, no type changes |
| DAL compatibility | ✅ SAFE | GRANTs enable what DAL already attempts; no DAL changes needed |
| Controller compatibility | ✅ SAFE | RLS aligns with controller-layer ownership intent |
| Engine compatibility | ✅ SAFE | Engine DAL patterns unchanged |
| RLS validation | ⚠️ REQUIRED | Run `SELECT * FROM pg_policies WHERE schemaname = 'reviews'` after deploy to confirm |
| Runtime performance validation | ✅ LOW RISK | New RLS policies join `vc.actor_owners` — small table, indexed on `(actor_id, user_id)` expected |
| Rollback validation | ✅ PARTIAL | GRANTs + policies reversible; `vc.is_actor_owner()` not droppable |
| Native compatibility | ✅ N/A | No native-specific DB concerns |

---

## IDENTITY / OWNERSHIP MIGRATION WARNING

**Object:** `reviews.reviews` UPDATE RLS policy  
**Current behavior (pre-migration):** No RLS policy tracked — live DB state UNKNOWN. If archive migration created one, it may or may not enforce actor ownership correctly.  
**Migration risk:** If the live DB has a permissive or missing UPDATE policy, adding a correct actor-ownership policy is a security tightening — it is the right change but may surface cases where app code was relying on the broken `isActorOwner` pre-check.  
**Potential impact:** After adding correct DB RLS, the broken `isActorOwner` in setup.js will be the ONLY remaining gap. Any `submitReview` or `deleteReview` call from an actor the user doesn't own will now fail at the DB layer (UPDATE policy denial) even if the app-layer check incorrectly passes.  
**Recommended safeguards:** Deploy DB migration (A+B+C) before or simultaneously with the app code fix for `isActorOwner`. Do NOT deploy the DB tightening alone without the app fix — the app fix eliminates the confusion gap.

---

## BOUNDARY MIGRATION REVIEW

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `vc.is_actor_owner(uuid)` | VCSM DB | None — vc schema is VCSM-only | Safe |
| `reviews.*` | VCSM DB | None — reviews schema is VCSM-only | Safe |
| `engines/reviews` source code | ENGINE boundary | DB migration does not touch engine code | Safe |
| `apps/VCSM/src/features/reviews/setup.js` | VCSM APP boundary | App code fix is separate from DB migration | Safe |

---

## SQL PROPOSAL FILES

Two SQL proposals produced in:  
`zNOTFORPRODUCTION/_ACTIVE/planning/carnage_migrations/reviews/`

| File | Contents |
|---|---|
| `A_track_vc_is_actor_owner.sql` | Migration A — `vc.is_actor_owner()` function tracking |
| `B_track_reviews_write_rls.sql` | Migration B+C — `reviews.reviews` and `reviews.review_dimension_ratings` write grants + RLS |

> **Note on RPCs (Migration D):** SQL bodies for `reviews.upsert_neutral_review`, `reviews.get_review_author_card`, and `reviews.get_target_overall_stats` cannot be reconstructed from source code alone — they must be extracted from the live DB using `pg_get_functiondef()`. This is a DB inspector task. Carnage does not reconstruct them here. These must be retrieved via `pg_dump --schema=reviews` or Supabase dashboard and placed in a separate tracking migration.

---

## RECOMMENDED HANDOFFS

- **Venom** — re-run after migrations A+B+C deploy to verify V-01 and V-02 are closed
- **DB** — extract live `pg_get_functiondef()` for all four untracked reviews RPCs + `vc.is_actor_owner()` to confirm bodies match SQL proposals
- **Wolverine** — app code fix for `setup.js` isActorOwner (parallel to DB migration, not a DB task)
- **Sentry** — re-run compliance check after all migrations + app fix land
- **Logan** — update `vcsm.reviews.engine-integration.md` Known Issues section once fixes are deployed

---

## FINAL CARNAGE STATUS: CAUTION

Migration is safe to design and deploy — all changes are additive and idempotent. However:

1. RPC body tracking (Migration D) **requires live DB access** to extract `pg_get_functiondef()` — cannot be designed from source code alone.
2. The `vc.is_actor_owner()` body in the SQL proposal is a **reconstruction** from behavioral evidence. Must be confirmed against the live function body before committing to migrations.
3. Both DB migrations AND the `setup.js` app code fix must deploy together to close the full vulnerability chain.

**CARNAGE does not run migrations. All SQL below is proposal-only. User confirms and deploys.**
