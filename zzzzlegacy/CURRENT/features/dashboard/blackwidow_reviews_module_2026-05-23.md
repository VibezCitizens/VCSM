# BLACKWIDOW — Adversarial Runtime Verification
**Target Module:** reviews  
**Scope:** `apps/VCSM/src/features/reviews/` + `engines/reviews/`  
**Date:** 2026-05-23  
**Status:** BLOCKED — attack vectors confirmed  
**Upstream:** VENOM `venom_reviews_module_2026-05-23.md`

---

## Executive Summary

The broken `isActorOwner` check in `setup.js` creates two fully exploitable attack chains. Both are low-effort, low-noise, and survive the current controller-layer defenses. Neither attack requires elevated privilege.

---

## ATTACK CHAIN BW-01 — Cross-Actor Review Injection

**Threat Model:** Authenticated VCSM user wants to publish a positive review for a target under another actor's identity (e.g., a competitor's vport, or a verified provider actor they do not own).

**Pre-conditions:**
- Attacker is authenticated (any `session.user.id`)
- Attacker knows a valid, non-void `actorId` (trivially discovered via public actor list or URL)
- Attacker is NOT an owner of that actor

**Exploit Steps:**
1. Call `submitReview({ targetActorId: X, authorActorId: Y, body: '...' })` where Y is any valid public actor.
2. Engine calls `isActorOwner(Y)` → queries `vc.actors` → finds Y exists, not voided → returns `true`.
3. `submitReview` proceeds to call `dalRpcUpsertNeutralReview` with Y as author.
4. If DB-level RLS on `reviews.reviews` is permissive (not verified — see V-02), the review is written.
5. Review appears in target X's feed attributed to actor Y.

**Result:** Any authenticated user can write reviews attributed to any platform actor.

**Defense Gap:** `isActorOwner` does not query `vc.actor_owners`. No app-layer check bridges this. If DB RLS is also absent (unverified — V-02), there is zero enforcement.

---

## ATTACK CHAIN BW-02 — Cross-Actor Review Deletion

**Threat Model:** Authenticated VCSM user wants to delete a review written by another actor (e.g., a negative review targeting their vport, written by a legitimate user).

**Pre-conditions:**
- Attacker is authenticated
- Attacker can observe a review on a public profile (the review's `id` is returned in `listReviews`)
- The review's `author_actor_id` is visible in the review data (it IS returned in `REVIEW_COLUMNS`)

**Exploit Steps:**
1. Fetch `listReviews({ targetActorId: myVport })` — returns all reviews including `author_actor_id`.
2. For the unwanted review, extract `{ reviewId, authorActorId }` from the response.
3. Call `deleteReview({ reviewId, authorActorId })`.
4. Controller: `existing = await dalGetReviewById({ reviewId })` → found.
5. Controller: `existing.author_actor_id !== authorActorId` → `false` (they match — attacker passed the real author ID).
6. Controller: `isActorOwner(authorActorId)` → returns `true` (actor exists, not void).
7. `dalSoftDeleteReview` is called. Review is deleted.

**Result:** Any authenticated user can delete any review on the platform by knowing its ID and the author's actorId (both are public data in the review payload).

**Severity:** CRITICAL. This is a direct suppression attack on the review integrity of every VPORT on the platform.

---

## ATTACK CHAIN BW-03 — Dimension Rating Orphan Write

**Threat Model:** Attacker submits ratings for a reviewId they do not own.

**Observation:** `dalUpsertDimensionRatings` (`engines/reviews/src/dal/dimensionRatings.write.dal.js:17-53`) performs an upsert keyed on `(review_id, dimension_id)` with no ownership check at the DAL level. The controller (`submitReview`) performs the `isActorOwner` check before calling dimension ratings, so BW-01 applies first. However, if the endpoint is called directly (e.g., via a custom client or if a future controller skips the guard), ratings can be written for any review.

**Severity:** MEDIUM — dependent on BW-01 being exploited first.

---

## ATTACK CHAIN BW-04 — Review Author Reconnaissance via `dalGetReviewById`

**Observation:** `dalGetReviewById` has no `is_deleted` filter (`reviews.read.dal.js:116-132`). Soft-deleted reviews are retrievable by ID. The `REVIEW_COLUMNS` select includes `author_actor_id`, `author_username_snapshot`, `author_avatar_url_snapshot`.

**Risk:** Soft-deleted reviews continue to expose author identity data to any caller with a known `reviewId`. If IDs are sequential or guessable, this leaks deleted content permanently.

**Severity:** LOW — depends on ID guessability and whether client-layer hides deleted reviews.

---

## Verification Summary

| Chain | Vector | Confirmed Exploitable | Blocked By |
|---|---|---|---|
| BW-01 | Cross-actor review injection | YES — app layer | Nothing (DB RLS unverified) |
| BW-02 | Cross-actor review deletion | YES — app layer | Nothing (DB RLS unverified) |
| BW-03 | Rating orphan write | CONDITIONAL | Requires BW-01 first |
| BW-04 | Deleted review data leak | LOW RISK | Only if IDs guessable |

---

## Required Mitigations (in fix order)

1. **Fix `isActorOwner` in `setup.js`** → query `vc.actor_owners WHERE actor_id = actorId AND user_id = auth.uid()` (kills BW-01, BW-02, BW-03)
2. **Verify and track DB-level RLS on `reviews.reviews`** → second line of defense after app fix
3. **Add `.eq('author_actor_id', authorActorId)` to `dalSoftDeleteReview`** → defense-in-depth against BW-02
4. **Add `is_deleted = false` filter to `dalGetReviewById` for public-facing callers** → mitigates BW-04

---

**Status:** BLOCKED — BW-01 and BW-02 are release-blocking attack chains.
