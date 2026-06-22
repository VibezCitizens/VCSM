# VENOM — Security & Trust Boundary Audit
**Target Module:** reviews  
**Scope:** `apps/VCSM/src/features/reviews/` + `engines/reviews/`  
**Date:** 2026-05-23  
**Status:** BLOCKED  
**Triggered by:** CEREBRO run on `vcsm.reviews.architecture.md`

---

## Executive Summary

Two BLOCKING security findings identified. The client-side actor ownership pre-check is provably wrong — any authenticated user can submit or delete a review as any actor on the platform. The DB-level enforcement claimed in the code comment is unverified due to schema provenance gaps.

---

## FINDING V-01 — isActorOwner Does Not Verify Ownership  
**Severity:** CRITICAL — BLOCKING  
**File:** `apps/VCSM/src/features/reviews/setup.js:30-44`

### What It Claims
The `isActorOwner` resolver is documented as a "client-side actor ownership pre-check" with a note that "real enforcement is DB-level: `vc.is_actor_owner()` in RLS policies and inside `reviews.upsert_neutral_review()` SECURITY DEFINER."

### What It Actually Does
```js
isActorOwner: async (actorId) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.id) return false

  const { data, error } = await supabase
    .schema('vc')
    .from('actors')
    .select('id')
    .eq('id', actorId)
    .eq('is_void', false)
    .limit(1)

  if (error || !data?.[0]) return false
  return true
},
```

This checks that `actorId` **exists** in `vc.actors` and **is not voided**.  
It does **NOT** verify that `session.user.id` has ownership of that actor.

### The Correct Check (Per Contract)
```js
// Contract §1.4 — Owner always means Actor Owner, verified through actor_owners
const { data } = await supabase
  .schema('vc')
  .from('actor_owners')
  .select('actor_id')
  .eq('actor_id', actorId)
  .eq('user_id', session.user.id)
  .limit(1)
```

### Impact
- Any authenticated user (any `session.user.id`) can call `submitReview()` using any existing, non-void actor as `authorActorId`.
- Any authenticated user can call `deleteReview()` using any actor as `authorActorId` as long as the review's stored `author_actor_id` matches — bypassing the ownership check entirely.
- The check at `submitReview.controller.js:35` calls `isActorOwner(authorActorId)` which returns `true` for any valid actor.
- The check at `deleteReview.controller.js:33` has the same vulnerability.

### Attack Vector
1. Authenticated user identifies a review authored by VPORT actor `A`.
2. Calls `deleteReview({ reviewId, authorActorId: A })` — the controller verifies `existing.author_actor_id === authorActorId` (passes, since the review IS authored by A) then calls `isActorOwner(A)` which returns `true` because actor A is non-void.
3. Review is soft-deleted. The attacker does not own actor A.

---

## FINDING V-02 — reviews.reviews Table Grants & RLS Not in Tracked Migrations  
**Severity:** HIGH — BLOCKING  
**Files:** `apps/VCSM/supabase/migrations/` (all tracked files)

### Evidence
- `20260503040334_fix_public_profile_rls_policies.sql` grants `USAGE ON SCHEMA reviews` and `SELECT ON reviews.review_dimensions TO authenticated`.
- No tracked migration grants `INSERT`, `UPDATE`, `DELETE` on `reviews.reviews` to any role.
- No tracked migration defines RLS policies on `reviews.reviews`.
- `vc.is_actor_owner()` DB function is called by `vc.save_friend_ranks` and `vc.mark_read` (hardening migration) but its `CREATE FUNCTION` definition is **not in any tracked migration file**.
- `reviews.upsert_neutral_review()` SECURITY DEFINER RPC is called by `dalRpcUpsertNeutralReview` but its SQL definition is **not in any tracked migration file**.

### Risk
- The entire write-path security model for reviews rests on untracked baseline SQL.
- On a fresh DB deployment from tracked migrations alone, `reviews.reviews` would have no authenticated write grants — all INSERTs would fail.
- If `vc.is_actor_owner()` is not deployed (e.g., on a fresh or cloned environment), any RPC calling it would throw a runtime exception, not a proper auth error.

---

## FINDING V-03 — DAL Write Operations Have No Author Guard  
**Severity:** MEDIUM  
**Files:** `engines/reviews/src/dal/reviews.write.dal.js:65-127`

`dalUpdateReviewBody` and `dalSoftDeleteReview` perform `UPDATE` without a `.eq('author_actor_id', ...)` predicate. Ownership enforcement is entirely controller-layer. If ownership check is bypassed or not called, DAL will update/delete any row by ID.

The `deleteReview` controller does verify `existing.author_actor_id !== authorActorId` (line 29) before calling the DAL, which partially mitigates this, but the defense relies on a broken `isActorOwner` call that always passes.

---

## FINDING V-04 — SECURITY DEFINER RPCs: Unreviewed Body  
**Severity:** LOW  
**Files:** `engines/reviews/src/dal/authors.read.dal.js:31`, `engines/reviews/src/dal/reviews.rpc.dal.js:28,55,84`

Three RPCs use SECURITY DEFINER (`get_review_author_card`, `upsert_neutral_review`, `get_target_overall_stats`). Their SQL bodies are not in tracked migrations and cannot be reviewed for injection or privilege escalation. This is an audit gap, not a confirmed vulnerability.

---

## Required Fixes

| ID | Fix | Priority |
|---|---|---|
| V-01 | Rewrite `isActorOwner` in `setup.js` to query `vc.actor_owners` JOIN `auth.uid()` | BLOCKING — fix before any review write is user-accessible |
| V-02 | Locate, track, and audit untracked baseline SQL for `reviews` schema writes, RLS, and `vc.is_actor_owner()` definition | BLOCKING — migration provenance gap |
| V-03 | Add `.eq('author_actor_id', authorActorId)` to `dalUpdateReviewBody` and `dalSoftDeleteReview` as defense-in-depth | MEDIUM — after V-01 fix |
| V-04 | Add SQL definitions for all `reviews.*` RPCs to tracked migrations | LOW — audit completeness |

---

## Downstream Requirements
- **BlackWidow** — adversarial verification of V-01 attack vector
- **Carnage** — migration tracking for V-02 (untracked schema objects)
- **DB** — confirm RLS policy existence on `reviews.reviews` via live schema inspection

**Status:** BLOCKED — V-01 and V-02 are release-blocking findings.
