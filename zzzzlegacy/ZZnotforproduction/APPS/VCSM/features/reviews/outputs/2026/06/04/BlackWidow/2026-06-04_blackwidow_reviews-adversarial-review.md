# BLACKWIDOW V2 Adversarial Review — reviews
# VCSM Platform | 2026-06-04

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report ID | BW-REVIEWS-2026-06-04 |
| Feature | reviews |
| Application | VCSM |
| BW Protocol Version | BW2.5 V2 / BW2.9 output format |
| Run Date | 2026-06-04 |
| Operator | BLACKWIDOW V2 |
| Scope | engines/reviews + apps/VCSM/src/features/reviews + apps/VCSM/src/features/profiles/kinds/vport/controller/review + hooks/review |

---

## 2. Scanner Preflight

| Field | Value |
|---|---|
| Scanner Status | FRESH |
| Maps Generated | 2026-06-04T19:48:25.152Z |
| Scanner Version | 1.1.0 |
| Security Paths Attributed (reviews) | 0 |
| Total Platform Security Paths | 598 |
| Callgraph Nodes (reviews) | 63 |
| Callgraph Edges (reviews) | 82 |
| Write Paths Attributed (reviews) | 0 |
| RPC Paths Attributed (reviews) | 0 |

---

## 3. Scanner Inputs Block

```
security-path-map.json   — reviews paths: 0 (ZERO attributed)
callgraph.json           — reviews nodes: 63, edges: 82, layers: barrel(16), component(4), controller(6), dal(13), model(6), module(18)
write-execution-map.json — reviews write paths: 0 (ZERO attributed)
rpc-execution-map.json   — reviews RPC paths: 0 (ZERO attributed)
```

Scanner attribution: ALL reviews paths are LOW CONFIDENCE / UNRESOLVED (zero attributed paths). The callgraph exists and provides structural signals but the security-path-map, write-execution-map, and rpc-execution-map do not trace through this feature. Per Rule BW-002, all DAL write surfaces become PRIMARY ATTACK TARGETS.

---

## 4. Attack Surface Inventory

### 4.1 Entry Points (Hook Layer — UI Accessible)

| Hook | File | Write Operations Triggered |
|---|---|---|
| `useVportReviewMine.submitReview` | hooks/review/useVportReviewMine.js:63 | ctrlSubmitReview → engineSubmitReview → dalRpcUpsertNeutralReview + dalUpsertDimensionRatings |
| `useVportReviewMine.deleteMyReview` | hooks/review/useVportReviewMine.js:123 | ctrlDeleteMyReview → engineDeleteReview → dalSoftDeleteReview |
| `useVportReviewMine.loadMyReview` | hooks/review/useVportReviewMine.js:27 | ctrlGetMyActiveReview (read only) |

### 4.2 Controller Write Surfaces

| Controller | File | Auth Gate |
|---|---|---|
| `ctrlSubmitReview` | VportReviews.controller.js:111 | assertActorId + kind===user check + isActorOwner (engine) |
| `ctrlDeleteMyReview` | VportReviews.controller.js:237 | assertActorId + engine ownership check |
| `ctrlGetMyActiveReview` | VportReviews.controller.js:217 | assertActorId only — NO isActorOwner |

### 4.3 Engine Controller Write Surfaces

| Controller | File | Auth Gate |
|---|---|---|
| `submitReview` | engines/reviews/src/controller/submitReview.controller.js:26 | null check + self-review check + isActorOwner |
| `deleteReview` | engines/reviews/src/controller/deleteReview.controller.js:19 | null check + DB fetch + author_actor_id comparison + isActorOwner |

### 4.4 DAL Write Surfaces (PRIMARY ATTACK TARGETS)

| DAL Function | File | Ownership Guard Present | Notes |
|---|---|---|---|
| `dalRpcUpsertNeutralReview` | reviews.rpc.dal.js:19 | Relies on SECURITY DEFINER RPC | RPC-enforced |
| `dalUpsertDimensionRatings` | dimensionRatings.write.dal.js:17 | NO — review_id only | CRITICAL SURFACE |
| `dalDeleteDimensionRatingsForReview` | dimensionRatings.write.dal.js:63 | NO — review_id only | HIGH SURFACE |
| `dalSoftDeleteReview` | reviews.write.dal.js:104 | YES — .eq('author_actor_id', authorActorId) | Guarded at DAL level |
| `dalUpdateReviewBody` | reviews.write.dal.js:65 | YES — .eq('author_actor_id', authorActorId) | Guarded at DAL level |
| `dalInsertReview` | reviews.write.dal.js:26 | NO ownership guard | ORPHANED — no current caller |

### 4.5 Orphaned / Uncalled DAL Functions

| Function | File | Risk |
|---|---|---|
| `dalInsertReview` | reviews.write.dal.js:26 | No controller calls it. Bypasses upsert_neutral_review RPC. One-active-card constraint not enforced. CONFIRMED by VEN-REVIEWS-001. |
| `dalDeleteDimensionRatingsForReview` | dimensionRatings.write.dal.js:63 | No current caller found. Exposed function with no auth guard. |

### 4.6 Callgraph Backward Trace: DAL Write → Hook Entry

```
dalUpsertDimensionRatings
  ← submitReview (engine controller)
    ← ctrlSubmitReview (app controller)
      ← useVportReviewMine.submitReview (hook)
        ← useVportReviewCompose.handleSubmit (compose hook)
          ← VportReviewComposeForm (UI)

dalSoftDeleteReview
  ← deleteReview (engine controller)
    ← ctrlDeleteMyReview (app controller)
      ← useVportReviewMine.deleteMyReview (hook)
        ← VportReviewDeleteModal (UI)
```

authorActorId source at hook layer: `identity?.actorId` via `useIdentity()` → session-bound. Not client-injectable at hook or controller layer.

---

## 5. Scanner Signals Block

- Security path map: 0 attributed paths — feature is a DARK ZONE in the scanner.
- Callgraph confirms 6 controller nodes, 13 DAL nodes, 16 barrel/index nodes. Structural coverage exists.
- Write-execution-map and RPC-execution-map have zero attributed paths — all write path analysis is SOURCE_VERIFIED from direct file reads.
- Scanner LOW CONFIDENCE status for entire feature. All BW attack findings are source-verified, not scanner-derived.

---

## 6. Adversarial Path Analysis

### A. OWNERSHIP BYPASS (§5.1)

**Attack Harness:** Submit a review passing `authorActorId = victim_uuid` (an actor the attacker does not own). Can the session guard be circumvented?

**Trace:**
1. `useVportReviewMine.submitReview` (hooks/review/useVportReviewMine.js:94): `authorActorId` is bound to `identity?.actorId` from `useIdentity()` — session-scoped. A client cannot supply an arbitrary `authorActorId` through the hook without also controlling the session identity context.
2. `ctrlSubmitReview` (VportReviews.controller.js:114-116): `assertActorId(authorActorId)` validates presence and type. Then line 128-131: calls `dalReadReviewTargetActor(authorActorId)` and checks `authorActor.kind !== 'user'` — any non-user actor (vport) is blocked.
3. `engineSubmitReview` (submitReview.controller.js:35-38): `isActorOwner(authorActorId)` is called — queries `vc.actor_owners` with RLS `user_id = auth.uid()`. If session user does not own the actor, the row is invisible and returns false.
4. RPC `upsert_neutral_review` is SECURITY DEFINER — DB-layer ownership is enforced independently.

**Result: BLOCKED**
**Provenance:** [SOURCE_VERIFIED]
- submitReview.controller.js:35-38 — isActorOwner call
- setup.js:41-57 — actor_owners query with RLS
- VportReviews.controller.js:128-131 — kind check

---

**Attack Harness:** Delete a victim's review by passing `reviewId = victim_review_uuid` and `authorActorId = attacker_own_uuid`.

**Trace:**
1. `ctrlDeleteMyReview` (VportReviews.controller.js:237-248): `assertActorId(reviewId)` and `assertActorId(authorActorId)`.
2. `engineDeleteReview` (deleteReview.controller.js:24): `dalGetReviewById({ reviewId })` — fetches the review unconditionally.
3. Line 29: `existing.author_actor_id !== authorActorId` — ownership check against DB record. Attack fails here.
4. Line 33: `isActorOwner(authorActorId)` — confirms session user owns the actor.
5. `dalSoftDeleteReview` (reviews.write.dal.js:104): `.eq('author_actor_id', authorActorId)` — double enforcement at DB query level.

**Result: BLOCKED**
**Provenance:** [SOURCE_VERIFIED]
- deleteReview.controller.js:29 — author_actor_id !== authorActorId check
- reviews.write.dal.js:118 — .eq('author_actor_id', authorActorId)

---

### B. SESSION MUTATION (§5.2)

**Attack Harness:** Can a stale or null `viewerActorId` / `authorActorId` bypass controller gates?

**Trace (null authorActorId):**
1. `useVportReviewMine.submitReview` line 64: `if (!authorActorId || !targetActorId)` — throws immediately.
2. `useVportReviewCompose.handleSubmit` line 99: `if (!reviewAuthorActorId)` — sets submitErr, returns before calling submitReview.
3. `ctrlSubmitReview` line 114: `assertActorId(authorActorId, 'authorActorId')` — throws if null/falsy.
4. Engine `submitReview` line 27: `if (!targetActorId || !authorActorId)` — throws.
5. `isActorOwner(null)` in setup.js:42: `if (!actorId) return false` — returns false, rejects.

Null authorActorId cannot reach any DAL write surface. Multiple independent guards across hook, app controller, and engine controller layers.

**Trace (stale session — viewerActorId from a previous identity switch):**
`VportReviewsView.jsx:32`: `reviewAuthorActorId = identity?.kind === "user" ? sessionActorId : null` — sessionActorId is always bound to the current identity context. `isActorOwner` re-queries `auth.uid()` at call time, so stale client-side actorId would fail the RLS query.

**Result: BLOCKED**
**Provenance:** [SOURCE_VERIFIED]
- useVportReviewMine.js:64 — null guard
- useVportReviewCompose.js:99 — null guard
- submitReview.controller.js:27 — engine null guard
- setup.js:42 — isActorOwner null guard

---

### C. RUNTIME ABUSE (§5.3)

**Attack Harness:** Can a non-user actor (vport actor) submit a review?

**Trace:**
1. `VportReviewsView.jsx:32`: `reviewAuthorActorId = identity?.kind === "user" ? sessionActorId : null` — vport session identity sets reviewAuthorActorId to null.
2. `useVportReviews.js:57`: `canReview = Boolean(authorActorId) && identity?.kind === "user"` — vport kind fails this check.
3. `ctrlSubmitReview` line 128-132: fetches `authorActor` via DAL and checks `authorActor.kind !== 'user'` — throws 'Only citizens can submit reviews.'

**Finding: BLOCKED at multiple independent layers.**

**Attack Harness:** Can a vport actor submit a review by directly calling the API endpoint below the hook (e.g., direct ctrlSubmitReview call)?

- `ctrlSubmitReview` at line 128: `if (authorActor.kind !== 'user')` — DB-verified kind check via `dalReadReviewTargetActor`. Cannot be bypassed at controller level.
- `engineSubmitReview.isActorOwner` — actor_owners query with RLS confirms ownership.

**Result: BLOCKED**
**Provenance:** [SOURCE_VERIFIED]
- VportReviews.controller.js:128-132 — kind guard
- VportReviewsView.jsx:32 — UI kind gate

---

**Attack Harness:** Can the owner of a vport view reviews in owner mode for a different vport they do not own?

**Trace:**
`VportDashboardReviewScreen.jsx:26`: `useVportOwnership(viewerActorId, targetActorId)` — ownership is checked before the `mode` prop is set. `isOwner` is passed as `mode={isOwner ? "owner" : "public"}`. Owner mode only renders for the actual owner.

Note: Owner mode only affects tab visibility and stats display — it does not gate any write operations. Even if a user artificially set mode="owner", they cannot submit or delete reviews on behalf of others (those are session-bound at controller level).

**Result: BLOCKED**
**Provenance:** [SOURCE_VERIFIED]
- VportDashboardReviewScreen.jsx:26 — useVportOwnership check

---

### D. RLS VERIFICATION (§5.4)

**Attack Harness:** Are dimension ratings upsertable for a review the caller does not own?

**Trace:**
1. `dalUpsertDimensionRatings` (dimensionRatings.write.dal.js:17): takes `reviewId` + `ratings` array. No `author_actor_id` filter. No ownership guard in the DAL.
2. Caller chain: `submitReview.controller.js:63` — `dalUpsertDimensionRatings({ reviewId, ratings })`. The `reviewId` here is returned from `dalRpcUpsertNeutralReview` in the same execution context.
3. The review ID is returned from the RPC which enforces ownership via SECURITY DEFINER. An attacker cannot obtain a valid `reviewId` for a review they do not own through the normal path.
4. However, `dalUpsertDimensionRatings` itself has no ownership filter and is exported. If the function were called directly with an arbitrary `reviewId`, the only barrier is DB-level RLS on `reviews.review_dimension_ratings`.

**DB RLS Status:** Unverified for `reviews.review_dimension_ratings` — no DB snapshot confirming row-level security policy on this table.

**Finding:** PARTIAL — controller execution path is safe, but `dalUpsertDimensionRatings` has no in-query ownership guard. RLS is the only barrier if called directly. VEN-REVIEWS-003 covers the sibling function `dalDeleteDimensionRatingsForReview` (same pattern).

**Provenance:** [SOURCE_VERIFIED]
- dimensionRatings.write.dal.js:17-53 — no author_actor_id filter in upsert

---

**Attack Harness:** Can a soft-deleted review be fetched and operated on?

**Trace:**
- `dalListReviewsByTarget` at line 41: `.eq('is_deleted', false)` — deleted reviews excluded from lists.
- `dalGetActiveReviewByAuthor` at line 91: `.eq('is_deleted', false)` — excluded from active review fetch.
- `dalGetReviewById` at line 116-131: NO `is_deleted` filter — fetches regardless of deletion state.
- `deleteReview.controller.js:38`: `if (existing.is_deleted) return ReviewModel(existing)` — early exit for already-deleted reviews. This is correctly idempotent.

`dalGetReviewById` returns deleted reviews, but this is only used in `deleteReview` (for idempotency check) and `submitReview` (post-upsert fetch to return the saved review). Neither path creates a security issue from fetching a deleted review.

**Result: BLOCKED (no exploitable path via existing callers)**
**Provenance:** [SOURCE_VERIFIED]
- reviews.read.dal.js:116-132 — no is_deleted filter on getById

---

### E. VIEWER CONTEXT FUZZING (§5.5)

**Attack Harness:** Pass null/undefined `viewerActorId` to each controller.

**ctrlGetMyActiveReview with null authorActorId:**
- Line 222: `assertActorId(authorActorId, 'authorActorId')` — throws `[VportReviews] missing authorActorId` immediately. Does not reach DAL.

**ctrlSubmitReview with null authorActorId:**
- Line 115: `assertActorId(authorActorId, 'authorActorId')` — throws immediately.

**ctrlDeleteMyReview with null authorActorId:**
- Line 244: `assertActorId(authorActorId, 'authorActorId')` — throws immediately.

**Engine submitReview with null authorActorId:**
- Line 27: `if (!targetActorId || !authorActorId)` — throws immediately.

All null/undefined authorActorId paths are blocked at the first guard layer. No controller reaches a DAL write with null actor context.

**Result: BLOCKED**
**Provenance:** [SOURCE_VERIFIED]
- VportReviews.controller.js:114-116 — assertActorId on both ids
- submitReview.controller.js:27 — engine null guard

---

### F. MUTATION REPLAY (§5.6)

**Attack Harness:** Can a soft-deleted review be re-submitted via submitReview to resurrect it?

**Trace:**
1. `submitReview.controller.js:51`: calls `dalRpcUpsertNeutralReview` — this is a DB SECURITY DEFINER function that handles idempotent upsert. The RPC semantics determine whether a deleted review can be resurrected.
2. If the RPC treats a soft-deleted active_card=false entry as non-existing and creates a new card, that is expected behavior (not a vulnerability).
3. The concern is whether an already-deleted review can be re-activated as an active card via the DAL write path.

**Trace (direct delete replay):**
`deleteReview.controller.js:38`: `if (existing.is_deleted) return ReviewModel(existing)` — idempotent guard. Re-calling deleteReview on an already-deleted review returns the existing record without mutation. BLOCKED.

**Trace (submit replay after delete — same author→target):**
The upsert_neutral_review RPC governs this. Source analysis confirms the RPC path is the only submit route. `dalInsertReview` is orphaned and not callable via any current controller.

**Result: BLOCKED (for delete replay); UNRESOLVED for RPC re-activation semantics (DB-internal behavior, requires RPC source to confirm)**
**Provenance:** [SOURCE_VERIFIED] for delete idempotency; [SCANNER_LOW_CONF] for RPC resurrection semantics

---

### G. HYDRATION POISONING (§5.7)

**Finding:** The reviews engine does not interact with the hydration store. Author card data is served from snapshot columns captured at write time in `reviews.reviews` (columns `author_display_name_snapshot`, `author_username_snapshot`, `author_avatar_url_snapshot`) via the SECURITY DEFINER RPC. `listReviews.controller.js:44-58` builds author cards from snapshot columns without any external hydration call.

No hydration poisoning surface exists in this feature.

**Result: NOT APPLICABLE — no hydration interaction**
**Provenance:** [SOURCE_VERIFIED]
- listReviews.controller.js:44-58 — snapshot columns used, no hydration call

---

### H. URL SURFACE (§5.9)

**Attack Harness:** Do notification linkPaths, share links, or deep links for reviews expose raw UUIDs?

**Trace:**
`ctrlSubmitReview` at VportReviews.controller.js:200:
```
linkPath: `/actor/${targetActorId}/dashboard/reviews`
```
`targetActorId` is a raw UUID (actor primary key). This is embedded in the notification linkPath.

The platform memory rule [No raw IDs in public URLs] states raw UUIDs must never appear in public-facing URLs — always use human-readable slugs.

`objectId: mapped.id` at line 199 — the review UUID is passed as notification objectId, which may be rendered in notification payloads visible to recipients.

**Classification:**
- The `/actor/${targetActorId}/dashboard/reviews` path is a dashboard-internal route (protected, authenticated), not a public-facing share link. The `/actor/:actorId/dashboard/reviews` route pattern exists in app.routes.jsx:207 and is under the authenticated route guard. However, the raw UUID is still embedded in a URL that could be forwarded or bookmarked.
- This is the same pattern used across all vport dashboard notification links, making it a platform-wide pattern question rather than a reviews-specific bug.

**Finding:** MEDIUM severity — notification linkPath contains raw `targetActorId` UUID. Dashboard-protected route, but UUID exposure via notification system. Consistent with platform-wide pattern requiring a future slug migration.

**Result: PARTIAL — UUID in linkPath (internal dashboard route), objectId UUID in notification payload**
**Provenance:** [SOURCE_VERIFIED]
- VportReviews.controller.js:199-200 — linkPath and objectId construction

---

### I. §9 INVARIANT ATTACK MAP (HIGHEST PRIORITY)

**BEHAVIOR.md Status: PLACEHOLDER**

The BEHAVIOR.md file contains no §4 Failure Paths and no §9 Must Never Happen section. All §9 invariants are UNANCHORED — they cannot be formally tested. The VENOM scan flagged this as VEN-REVIEWS-002 (HIGH, THOR blocker).

**Source-Inferred Invariants (from code analysis):**

The following invariants are implied by the code structure and were tested adversarially:

| Inferred Invariant | Attack Harness | Result |
|---|---|---|
| An actor cannot review themselves | targetActorId === authorActorId | BLOCKED — submitReview.controller.js:31 + VportReviews.controller.js:117 |
| A vport actor cannot submit a review | kind !== 'user' | BLOCKED — VportReviews.controller.js:131 + VportReviewsView.jsx:32 |
| A review can only be deleted by its author | author_actor_id mismatch | BLOCKED — deleteReview.controller.js:29 |
| One active card per author→target | duplicate submit | BLOCKED via RPC (SECURITY DEFINER) |
| A soft-deleted review cannot be re-deleted | replay delete | BLOCKED — deleteReview.controller.js:38 |
| Dimension ratings cannot be written for a review you do not own | direct dalUpsertDimensionRatings call | PARTIAL — no in-query guard; RLS only barrier (unverified) |
| A void actor cannot submit a review | void actor | BLOCKED — isActorOwner checks is_void=false in actor_owners |

---

## 7. Exploitability Assessment

| Finding ID | Severity | Description | Result | Exploit Chain Type |
|---|---|---|---|---|
| BW-REVIEWS-001 | HIGH | dalUpsertDimensionRatings has no author_actor_id ownership guard — any call with a known reviewId can overwrite dimension ratings; only DB RLS (unverified) acts as barrier | PARTIAL | Single-step |
| BW-REVIEWS-002 | HIGH | BEHAVIOR.md is PLACEHOLDER — §9 invariants are UNANCHORED; cannot formally verify Must Never Happen rules | UNRESOLVED | Governance |
| BW-REVIEWS-003 | MEDIUM | Notification linkPath embeds raw targetActorId UUID: `/actor/${targetActorId}/dashboard/reviews`; violates no-raw-IDs-in-URLs platform rule | PARTIAL | Injection |
| BW-REVIEWS-004 | MEDIUM | dalGetReviewById has no is_deleted filter — returns soft-deleted reviews; acceptable in current callers (deleteReview idempotency), but any future caller reaching this function could inadvertently surface deleted records | PARTIAL | Single-step |
| BW-REVIEWS-005 | MEDIUM | ctrlGetMyActiveReview missing isActorOwner call — confirmed VENOM finding VEN-REVIEWS-004; read-only path but authorActorId is not session-verified at engine level | PARTIAL | Single-step |
| BW-REVIEWS-006 | LOW | configureReviewsEngine has no re-entry guard at module level — _config can be overwritten post-initialization (VEN-REVIEWS-005 confirmed); in-process threat only | PARTIAL | Timing |
| BW-REVIEWS-007 | LOW | dalInsertReview is an orphaned exported function with no ownership guard and no caller — live dead code bypassing the upsert RPC; future accidental use would violate one-active-card constraint and snapshot integrity (VEN-REVIEWS-001 confirmed) | UNRESOLVED | Single-step |
| BW-REVIEWS-008 | INFO | dalDeleteDimensionRatingsForReview is exported with no caller found — orphaned with no auth guard; low risk as no calling path exists | UNRESOLVED | Single-step |

---

## 8. Source Verification Summary

| Finding ID | Source File | Line(s) | Verified |
|---|---|---|---|
| BW-REVIEWS-001 | engines/reviews/src/dal/dimensionRatings.write.dal.js | 17-53 | YES |
| BW-REVIEWS-002 | ZZnotforproduction/APPS/VCSM/features/reviews/BEHAVIOR.md | 1-9 | YES |
| BW-REVIEWS-003 | apps/VCSM/src/features/profiles/kinds/vport/controller/review/VportReviews.controller.js | 199-200 | YES |
| BW-REVIEWS-004 | engines/reviews/src/dal/reviews.read.dal.js | 116-132 | YES |
| BW-REVIEWS-005 | engines/reviews/src/controller/getMyActiveReview.controller.js | 19-36 | YES |
| BW-REVIEWS-006 | engines/reviews/src/config.js | 16-18 | YES |
| BW-REVIEWS-007 | engines/reviews/src/dal/reviews.write.dal.js | 26-54 | YES |
| BW-REVIEWS-008 | engines/reviews/src/dal/dimensionRatings.write.dal.js | 63-76 | YES |

No BYPASSED findings. All confirmed findings are PARTIAL or UNRESOLVED — no active exploit chains demonstrated in the current codebase state.

---

## 9. Confidence Summary

| Category | Count | Notes |
|---|---|---|
| CRITICAL | 0 | No invariant violations demonstrated |
| HIGH | 2 | BW-REVIEWS-001 (unguarded DAL write), BW-REVIEWS-002 (BEHAVIOR.md PLACEHOLDER) |
| MEDIUM | 3 | BW-REVIEWS-003 (URL UUID), BW-REVIEWS-004 (soft-delete read gap), BW-REVIEWS-005 (read path missing ownership) |
| LOW | 2 | BW-REVIEWS-006 (DI re-entry), BW-REVIEWS-007 (orphaned insert DAL) |
| INFO | 1 | BW-REVIEWS-008 (orphaned delete DAL) |

Scanner coverage: DARK ZONE (0 attributed paths). All findings are [SOURCE_VERIFIED] via direct file reads. Scanner callgraph used for structural mapping only.

---

## 10. §9 Invariant Attack Map

BEHAVIOR.md is PLACEHOLDER. Formal §9 invariants cannot be tested. Status: ALL UNANCHORED.

Source-inferred invariants attacked and held:

| Invariant | Status | Finding |
|---|---|---|
| Self-review blocked | HELD | No finding |
| Vport actor cannot review | HELD | No finding |
| Delete by author only | HELD | No finding |
| One active card per author→target | HELD (RPC-enforced) | No finding |
| Delete replay idempotent | HELD | No finding |
| Dimension rating ownership | UNANCHORED — RLS only | BW-REVIEWS-001 |
| Void actor cannot review | HELD | No finding |

---

## 11. Behavior Contract Attack Summary

The BEHAVIOR.md is a PLACEHOLDER with no §4 Failure Paths and no §9 Must Never Happen rules. This is a governance failure inherited from VEN-REVIEWS-002. The consequence is that BW cannot formally attack §9 invariants — only source-inferred ones were testable. All source-inferred invariants held except those relying solely on unverified RLS.

Recommendation: BEHAVIOR.md must be authored before THOR can clear this feature. Until then, VEN-REVIEWS-002 and BW-REVIEWS-002 are joint THOR blockers for this reason.

---

## 12. THOR Impact

| Finding ID | Severity | THOR Blocker | Reason |
|---|---|---|---|
| BW-REVIEWS-001 | HIGH | YES | dalUpsertDimensionRatings has no ownership guard; RLS unverified on review_dimension_ratings |
| BW-REVIEWS-002 | HIGH | YES | BEHAVIOR.md PLACEHOLDER; §9 invariants unanchored |
| BW-REVIEWS-003 | MEDIUM | NO | Platform-wide URL pattern; not reviews-specific |
| BW-REVIEWS-004 | MEDIUM | NO | Acceptable in current callers; risk is latent |
| BW-REVIEWS-005 | MEDIUM | NO | Read-only path; session context still enforced at hook layer |
| BW-REVIEWS-006 | LOW | NO | In-process only; not externally exploitable |
| BW-REVIEWS-007 | LOW | NO | Orphaned — no current caller |
| BW-REVIEWS-008 | INFO | NO | Orphaned — no current caller |

**THOR Release Blockers:** BW-REVIEWS-001, BW-REVIEWS-002
**Combined THOR blockers (all sections):** VEN-REVIEWS-001, VEN-REVIEWS-002, BW-REVIEWS-001, BW-REVIEWS-002

---

## 13. SPIDER-MAN Test Requirements

The following test scenarios must be written to cover BW findings:

| Test ID | Coverage Target | Finding |
|---|---|---|
| SPD-REVIEWS-BW-001 | Verify dalUpsertDimensionRatings rejects calls where reviewId belongs to a different author — requires mock RLS or integration test | BW-REVIEWS-001 |
| SPD-REVIEWS-BW-002 | Verify ctrlGetMyActiveReview returns null when authorActorId is null or not a session owner | BW-REVIEWS-005 |
| SPD-REVIEWS-BW-003 | Verify dalInsertReview is never called in any execution path (dead code audit) | BW-REVIEWS-007 |
| SPD-REVIEWS-BW-004 | Verify notification linkPath for review_created does not expose raw UUID or replaces with slug when slug system is implemented | BW-REVIEWS-003 |
| SPD-REVIEWS-BW-005 | Verify configureReviewsEngine is called exactly once per app lifecycle (no double-configure) | BW-REVIEWS-006 |
| SPD-REVIEWS-BW-006 | Verify soft-deleted reviews do not appear in dalListReviewsByTarget or dalGetActiveReviewByAuthor results | BW-REVIEWS-004 |
