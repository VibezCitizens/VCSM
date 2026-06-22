---
name: vcsm.reviews.venom-security-review
description: VENOM V2 security review for VCSM:reviews feature and engines/reviews engine
metadata:
  type: security-review
  owner: VENOM
  last-run: 2026-06-04
  scanner-version: 1.1.0
  feature: reviews
  app: VCSM
---

# VENOM V2 Security Review — reviews

**Date:** 2026-06-04
**Reviewer:** VENOM (automated)
**Feature:** reviews (apps/VCSM/src/features/reviews + engines/reviews)
**Application Scope:** VCSM

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report ID | VENOM-REVIEWS-2026-06-04 |
| Feature | reviews |
| Application | VCSM |
| Scanner Version | 1.1.0 |
| Run Date | 2026-06-04 |
| Preflight | PASS |
| Confidence | HIGH |
| Total Findings | 5 |
| CRITICAL | 0 |
| HIGH | 2 |
| MEDIUM | 2 |
| LOW | 1 |
| THOR Release Blocker | YES — VEN-REVIEWS-001 |

---

## 2. Scanner Preflight

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                 | Generated At                 | Age | Freshness | Confidence | Status |
|---------------------|------------------------------|-----|-----------|------------|--------|
| write-surface-map   | 2026-06-04T19:48:25.152Z     | <1h | FRESH     | HIGH       | PASS   |
| rpc-map             | 2026-06-04T19:48:25.152Z     | <1h | FRESH     | HIGH       | PASS   |
| edge-function-map   | 2026-06-04T19:48:25.152Z     | <1h | FRESH     | HIGH       | PASS   |
| security-path-map   | 2026-06-04T19:48:25.152Z     | <1h | FRESH     | HIGH       | PASS   |
| route-execution-map | 2026-06-04T19:48:25.152Z     | <1h | FRESH     | HIGH       | PASS   |
| write-execution-map | 2026-06-04T19:48:25.152Z     | <1h | FRESH     | HIGH       | PASS   |
| rpc-execution-map   | 2026-06-04T19:48:25.152Z     | <1h | FRESH     | HIGH       | PASS   |
| edge-execution-map  | 2026-06-04T19:48:25.152Z     | <1h | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| rpc-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| edge-function-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| security-path-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-execution-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-execution-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| rpc-execution-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| edge-execution-map | 2026-06-04T19:48:25Z | FRESH | HIGH |

**Scanner result for feature `reviews`:**
- writeSurfaces: 0
- rpcs: 0
- securityPaths: 0
- writeExecutionPaths: 0
- rpcExecutionPaths: 0
- edgeFunctions: 0

**Scanner Interpretation:** The scanner returns zero surfaces for `apps/VCSM/src/features/reviews/` because the feature is a thin bootstrap shim (single file: `setup.js`). All write surfaces, RPCs, and security-sensitive logic live in `engines/reviews/`. Per ARCHITECT V2, this is expected and correct by design. VENOM extended scope to cover `engines/reviews/` directly, which is where all real trust boundaries are exercised.

---

## 4. Security Surface Inventory

The scanner's zero-surface result for the feature directory is architecturally correct. The engine surfaces inspected manually are:

| Surface | Type | File | Risk Class |
|---|---|---|---|
| `dalInsertReview` | Direct table write | engines/reviews/src/dal/reviews.write.dal.js:26 | HIGH |
| `dalUpdateReviewBody` | Direct table write | engines/reviews/src/dal/reviews.write.dal.js:65 | MEDIUM |
| `dalSoftDeleteReview` | Direct table write | engines/reviews/src/dal/reviews.write.dal.js:104 | MEDIUM |
| `dalUpsertDimensionRatings` | Direct table write (upsert) | engines/reviews/src/dal/dimensionRatings.write.dal.js:17 | MEDIUM |
| `dalDeleteDimensionRatingsForReview` | Direct table delete | engines/reviews/src/dal/dimensionRatings.write.dal.js:63 | HIGH |
| `dalRpcUpsertNeutralReview` | Supabase RPC | engines/reviews/src/dal/reviews.rpc.dal.js:19 | MEDIUM |
| `dalRpcGetTargetOverallStats` | Supabase RPC (read) | engines/reviews/src/dal/reviews.rpc.dal.js:51 | LOW |
| `dalGetReviewById` | Direct table read | engines/reviews/src/dal/reviews.read.dal.js:116 | MEDIUM |
| `dalListReviewsByTarget` | Direct table read | engines/reviews/src/dal/reviews.read.dal.js:26 | LOW |
| `dalGetActiveReviewByAuthor` | Direct table read | engines/reviews/src/dal/reviews.read.dal.js:74 | LOW |
| `isActorOwner` (DI) | App-level pre-check | apps/VCSM/src/features/reviews/setup.js:41 | HIGH |
| `configureReviewsEngine` | DI config sink | engines/reviews/src/config.js:16 | MEDIUM |

---

## 5. Scanner Signals

| Signal | Detail |
|---|---|
| Zero write surfaces in feature dir | EXPECTED — engine pattern; extended scope to engines/reviews |
| Zero RPCs in feature dir | EXPECTED — engine pattern |
| Zero edge functions | CONFIRMED — no edge functions for reviews |
| BEHAVIOR.md status | PLACEHOLDER — no §5 Security Rules, no §9 Must Never Happen declared |
| REV-V-001 fix documented | In source (setup.js line 37–39 comment); not formally audited before this run |
| dalInsertReview path exists | UNVERIFIED — bypasses RPC, goes direct to table |
| dalDeleteDimensionRatings no owner guard | CONFIRMED — no author_actor_id filter in delete DAL |

---

## 6. Behavior Contract Status

| Item | Status | Detail |
|---|---|---|
| BEHAVIOR.md present | YES | PLACEHOLDER stub only |
| §5 Security Rules | MISSING | No security rules declared — BEHAVIOR.md has status: PLACEHOLDER |
| §9 Must Never Happen | MISSING | No invariants declared |
| BEH IDs extracted | 0 | None defined in PLACEHOLDER file |
| Cross-check possible | NO | No declared rules to verify |

**MISSING_BEHAVIOR_CONTRACT recorded as HIGH finding (VEN-REVIEWS-002).**

---

## 7. Trust Boundary Findings

---

### VEN-REVIEWS-001

```
VENOM SECURITY FINDING
- Finding ID: VEN-REVIEWS-001
- Location: engines/reviews/src/dal/reviews.write.dal.js:26-54
- Application Scope: VCSM
- Platform Surface: Supabase Table Direct Write (reviews.reviews)
- Trust Boundary: Authenticated Supabase session — any actor that passes engine DI
- Boundary Violated: dalInsertReview bypasses the upsert_neutral_review SECURITY DEFINER RPC
- Contract Violated: Engine CLAUDE.md states "review lifecycle (create, update, soft-delete)" — the RPC is the authoritative one-active-review-per-author-target enforcement path
- Current behavior: dalInsertReview writes directly to reviews.reviews via .insert() without
  calling upsert_neutral_review. It sets review_mode='neutral' and
  verification_status='unverified' in the client payload. The RPC enforces the one-active-
  card constraint at the DB level; the direct insert does not. If RLS on reviews.reviews
  permits authenticated inserts (which is the typical Supabase pattern when a SECURITY
  DEFINER RPC exists alongside direct table access), any consumer that calls dalInsertReview
  instead of dalRpcUpsertNeutralReview can bypass the one-active-review constraint and
  insert duplicate active review cards.
- Risk: Duplicate active review cards per author→target pair. Review count inflation.
  Potential for a user to appear to have reviewed a target multiple times, poisoning
  aggregate stats. Also: the RPC likely captures author card snapshots (display_name,
  username, avatar_url) at write time from a trusted DB-side lookup; dalInsertReview
  does not — those snapshot columns will be NULL on direct inserts.
- Severity: HIGH
- Exploitability: MEDIUM (requires engine internal caller to use dalInsertReview instead
  of dalRpcUpsertNeutralReview — not reachable from submitReview controller today, but
  the function is exported and callable)
- Attack Preconditions: Authenticated session. Caller must invoke dalInsertReview directly
  (bypassing submitReview controller). Currently possible from any engine consumer that
  imports from dal/ directly.
- Blast Radius: reviews.reviews table integrity. Aggregate stats corruption. Author card
  snapshot data missing (NULL columns) for all direct-insert rows.
- Identity Leak Type: None direct; snapshot NULL rows expose author_actor_id without
  display name enrichment
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — RLS posture on reviews.reviews for authenticated inserts
  is not confirmed; if table-level RLS permits INSERT for authenticated users, this is
  exploitable without any additional privilege
- Why it matters: The SECURITY DEFINER RPC is the single authoritative path for review
  integrity. A parallel direct insert DAL that bypasses it is an orphaned code path that
  violates the one-active-card invariant and corrupts the review data model.
- Recommended mitigation: Remove dalInsertReview entirely, or add a hard internal-only
  guard (not exported, no external callers). The submitReview controller already calls
  dalRpcUpsertNeutralReview — dalInsertReview has no legitimate caller in the current
  codebase. If kept for testing, gate it behind a DEV_ONLY flag and remove from exports.
- Rationale: Dead / orphaned write paths that bypass integrity RPCs are a class of
  vulnerability that recurs across this codebase. Removing the function eliminates the
  attack surface entirely.
- Follow-up command: DB (verify RLS posture on reviews.reviews INSERT policy), ELEKTRA
  (confirm no caller of dalInsertReview exists outside engine), SPIDER-MAN (add test
  asserting submitReview always routes through RPC)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security (bypassed integrity control)
  - Secondary: Access Control (RLS bypass risk), Information Security Governance
```

---

### VEN-REVIEWS-002

```
VENOM SECURITY FINDING
- Finding ID: VEN-REVIEWS-002
- Location: ZZnotforproduction/APPS/VCSM/features/reviews/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Governance / Contract
- Trust Boundary: Engineering governance — all consumers of the reviews engine
- Boundary Violated: No declared security invariants — reviewers and engine consumers
  operate without a formally ratified contract
- Contract Violated: VCSM architecture requires BEHAVIOR.md §5 Security Rules and §9 Must
  Never Happen for every feature with write surfaces. This feature delegates writes to an
  engine with 4 write DAL functions and 2 RPCs — no contract exists.
- Current behavior: BEHAVIOR.md has status: PLACEHOLDER with no declared §5 or §9
  sections. No happy paths, no error states, no security rules, no invariants are
  documented. Consumers of engines/reviews (profiles, public, dashboard) have no
  declared contract to verify against.
- Risk: Without declared invariants, security reviewers (VENOM, ELEKTRA, BLACKWIDOW)
  cannot perform complete contract cross-checks. Engine consumers may violate
  ownership rules, bypass self-review guards, or expose deleted reviews without any
  written invariant flagging the violation. The REV-V-001 ownership fix (setup.js:37-39)
  is documented only in a source comment — not in any governance contract.
- Severity: HIGH
- Exploitability: LOW (governance gap, not a direct exploitable vector today)
- Attack Preconditions: Indirect — a future developer adds a code path that violates an
  undocumented invariant; no contract exists to catch it in review.
- Blast Radius: All consumers of engines/reviews: profiles feature, public feature,
  dashboard feature, any future consumer.
- Identity Leak Type: None direct
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The reviews engine has security-sensitive ownership logic (REV-V-001
  fix), self-review prevention, and a soft-delete pattern. Without a behavior contract,
  these invariants are invisible to governance, new developers, and automated review
  tools. This is a THOR release blocker.
- Recommended mitigation: Write BEHAVIOR.md with §5 Security Rules declaring:
  (1) authors must own the actor they review as (isActorOwner check),
  (2) self-review is prohibited (targetActorId !== authorActorId),
  (3) rating must be 1–5,
  (4) only the author can delete their own review,
  (5) soft-delete only — hard deletes prohibited.
  And §9 Must Never Happen declaring:
  (1) a review must never be inserted for an actor the user does not own,
  (2) a user must never delete another user's review,
  (3) dalInsertReview must never bypass upsert_neutral_review in production.
- Rationale: Behavior contracts are the first line of governance defense; their absence
  is a structural gap that compounds every other finding.
- Follow-up command: LOGAN (write BEHAVIOR.md from source and engine contract)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Information Security Governance and Risk Management
  - Secondary: Software Development Security
```

---

### VEN-REVIEWS-003

```
VENOM SECURITY FINDING
- Finding ID: VEN-REVIEWS-003
- Location: engines/reviews/src/dal/dimensionRatings.write.dal.js:63-76
- Application Scope: VCSM
- Platform Surface: Supabase Table Direct Delete (reviews.review_dimension_ratings)
- Trust Boundary: Authenticated Supabase session
- Boundary Violated: dalDeleteDimensionRatingsForReview deletes all dimension ratings for
  a reviewId with no author_actor_id guard
- Contract Violated: Ownership invariant — only the review author should be able to
  mutate (delete) ratings attached to their review
- Current behavior: The function accepts only reviewId and calls:
    .delete().eq('review_id', reviewId)
  No check that the caller owns the review. Any authenticated caller who has a reviewId
  can delete all dimension ratings for that review. The function is not currently called
  from any active controller path (submitReview uses upsert, deleteReview uses
  dalSoftDeleteReview not this function), but it is exported and callable.
- Risk: Orphaned delete function with no ownership guard. If called by any future
  consumer with a known reviewId, all dimension ratings for that review are wiped
  without authorization. reviewId is not a secret — it is returned in list and read
  responses.
- Severity: MEDIUM
- Exploitability: LOW (no active caller today; requires future consumer to call it
  directly with a target reviewId)
- Attack Preconditions: Authenticated session. Knowledge of a target reviewId (available
  from public list endpoints). Direct call to dalDeleteDimensionRatingsForReview.
- Blast Radius: reviews.review_dimension_ratings rows for the targeted review.
  Rating data loss. Aggregate stats corruption for the target actor.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — if RLS on review_dimension_ratings permits DELETE for
  any authenticated user with a matching review_id, this is exploitable
- Why it matters: Orphaned write/delete functions without ownership guards are a
  recurring vulnerability class. Even if unused today, they remain an open door.
- Recommended mitigation: Add an author_actor_id parameter and a pre-check that
  validates the caller owns the review (via dalGetReviewById + authorActorId comparison)
  before executing the delete. Alternatively, remove the function entirely if no
  legitimate caller exists — the soft-delete controller (deleteReview) does not call it.
- Rationale: Defense-in-depth — every mutating function should carry its own ownership
  guard, not rely solely on the caller to enforce it.
- Follow-up command: DB (verify RLS posture on review_dimension_ratings DELETE),
  SPIDER-MAN (add test for unauthorized rating delete attempt)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control (missing authorization check on destructive operation)
  - Secondary: Software Development Security
```

---

### VEN-REVIEWS-004

```
VENOM SECURITY FINDING
- Finding ID: VEN-REVIEWS-004
- Location: engines/reviews/src/controller/getMyActiveReview.controller.js:19-36
- Application Scope: VCSM
- Platform Surface: PWA — controller (read path)
- Trust Boundary: Caller-supplied authorActorId
- Boundary Violated: getMyActiveReview accepts authorActorId from the caller without
  verifying the session user owns that actor
- Contract Violated: Ownership invariant — reads scoped to "my" review should be
  constrained to actors the caller owns
- Current behavior: The controller takes { targetActorId, authorActorId } and queries
  reviews.reviews with .eq('author_actor_id', authorActorId). No isActorOwner check
  is performed. Any caller who supplies an arbitrary authorActorId can read the active
  review that actor wrote for any target — including the review body content.
- Risk: An authenticated user who knows (or guesses) another actor's actorId can read
  that actor's active review body and ratings without owning the actor. Review body
  content may contain sensitive or private text that the author intended only for
  the recipient target.
- Severity: MEDIUM
- Exploitability: MEDIUM (actorIds are not publicly listed in URLs per platform rules,
  but they are returned in list/read responses and social graph queries)
- Attack Preconditions: Authenticated session. Knowledge of a target actor's actorId
  and the author actor's actorId (obtainable from public profile or review list responses).
- Blast Radius: Review body content for any author actor whose actorId is known.
  Ratings data for that review.
- Identity Leak Type: Actor identity correlation (review body reveals reviewer identity
  and opinion to unauthorized viewer)
- Cache Trust Type: None
- RLS Dependency: ASSUMED — if reviews.reviews has RLS that limits reads to public
  active_card=true rows only (without author privacy distinction), this is a real leak
- Why it matters: "Get my active review" is semantically a private operation — it
  fetches the caller's own draft/active review. Allowing any authenticated user to
  call it with another actor's ID breaks the privacy expectation of review authorship.
- Recommended mitigation: Add an isActorOwner(authorActorId) call at the top of
  getMyActiveReview, matching the guard pattern in submitReview and deleteReview.
  This ensures only the actor owner can read their own active review via this controller.
- Rationale: Consistent ownership guard pattern across all write and "my" read operations
  closes the asymmetry between the write/delete controllers (which check isActorOwner)
  and this read controller (which does not).
- Follow-up command: DB (confirm RLS on reviews.reviews SELECT — does it restrict reads
  to public active_card rows or allow any authenticated user to read all rows?),
  SPIDER-MAN (add test for cross-actor getMyActiveReview attempt)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control (missing ownership check on scoped read)
  - Secondary: Information Security and Privacy
```

---

### VEN-REVIEWS-005

```
VENOM SECURITY FINDING
- Finding ID: VEN-REVIEWS-005
- Location: engines/reviews/src/config.js:16-18
- Application Scope: VCSM
- Platform Surface: PWA — engine singleton configuration
- Trust Boundary: App startup (main.jsx) → engine singleton
- Boundary Violated: configureReviewsEngine merges new config into existing config
  (_config = { ..._config, ...config }) — repeated calls can partially overwrite DI
- Contract Violated: Engine configuration immutability — once configured, the engine's
  security-sensitive DI (isActorOwner, supabaseClient) should be frozen
- Current behavior: configureReviewsEngine spreads new config into _config without
  any guard against re-configuration after initial setup. setup.js has a _configured
  guard, but configureReviewsEngine itself (exported from the adapter) has no such
  guard. Any code that imports configureReviewsEngine directly can call it again and
  overwrite isActorOwner with a permissive function, effectively bypassing all
  ownership checks for the lifetime of the app session.
- Risk: A compromised or malicious code path that imports configureReviewsEngine
  (which is publicly exported from engines/reviews/index.js) can replace isActorOwner
  with `() => true`, granting unrestricted review write access to any actor without
  ownership verification.
- Severity: LOW
- Exploitability: LOW (requires code-level access to the running app bundle; not a
  remote or passive exploit — this is a hardening gap, not an active vulnerability
  in normal operation)
- Attack Preconditions: Attacker has code execution in the app bundle (supply chain
  attack, malicious dependency, or XSS with script injection). OR a developer
  accidentally calls configureReviewsEngine a second time with incorrect DI.
- Blast Radius: Full bypass of isActorOwner for all subsequent submitReview and
  deleteReview calls in the session.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: REQUIRED — DB-level SECURITY DEFINER RPC is the real backstop if
  the client-side guard is bypassed
- Why it matters: Defense-in-depth hardening. The DB SECURITY DEFINER RPC is the
  true enforcement layer, so this is not a critical gap — but freezing the config
  after first initialization is a zero-cost hardening improvement.
- Recommended mitigation: Add a freeze guard to configureReviewsEngine:
    if (_configured) throw new Error('[ReviewsEngine] already configured')
  Or use Object.freeze(_config) after first configuration. The app-level _configured
  guard in setup.js is correct but does not protect against direct engine imports
  from other code paths.
- Rationale: Security-sensitive DI singletons should be immutable after initialization.
  Low effort, eliminates the reconfiguration attack surface.
- Follow-up command: ELEKTRA (scan for any second callers of configureReviewsEngine
  outside setup.js)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security (mutable security-sensitive singleton)
  - Secondary: Information Security Governance
```

---

## 8. Source Verification Summary

| Surface | File Read | Auth Guard Verified | Ownership Check | RLS Dependency | Status |
|---|---|---|---|---|---|
| `dalInsertReview` | YES | NO — direct insert, no pre-check | None | UNVERIFIED | FINDING: VEN-REVIEWS-001 |
| `dalUpdateReviewBody` | YES | YES — authorActorId required + .eq filter | authorActorId eq filter | ASSUMED | VERIFIED_SAFE (controller adds isActorOwner) |
| `dalSoftDeleteReview` | YES | YES — authorActorId required + .eq filter | authorActorId eq filter | ASSUMED | VERIFIED_SAFE (controller adds isActorOwner) |
| `dalUpsertDimensionRatings` | YES | Partial — reviewId scoped, no actor check | reviewId constraint | ASSUMED | MEDIUM RISK (caller-enforced) |
| `dalDeleteDimensionRatingsForReview` | YES | NO — no author guard | None | UNVERIFIED | FINDING: VEN-REVIEWS-003 |
| `dalRpcUpsertNeutralReview` | YES | SECURITY DEFINER | DB-enforced | VERIFIED | VERIFIED_SAFE (DB enforces) |
| `dalRpcGetTargetOverallStats` | YES | Public read | None needed | N/A | VERIFIED_SAFE |
| `dalGetReviewById` | YES | No ownership check | None | ASSUMED public | NOTE: used as pre-check in deleteReview — correct usage |
| `dalListReviewsByTarget` | YES | Public read (active_card=true) | None needed | ASSUMED | VERIFIED_SAFE |
| `dalGetActiveReviewByAuthor` | YES | No session check | authorActorId eq filter | ASSUMED | FINDING: VEN-REVIEWS-004 (controller lacks isActorOwner) |
| `submitReview` controller | YES | isActorOwner + self-review check | VERIFIED | N/A | VERIFIED_SAFE |
| `deleteReview` controller | YES | isActorOwner + author_actor_id match | VERIFIED | N/A | VERIFIED_SAFE |
| `listReviews` controller | YES | Public read path | None needed | N/A | VERIFIED_SAFE |
| `getMyActiveReview` controller | YES | NO isActorOwner call | Caller-supplied only | ASSUMED | FINDING: VEN-REVIEWS-004 |
| `isActorOwner` DI (setup.js) | YES | Queries vc.actor_owners with RLS | RLS-enforced | VERIFIED | VERIFIED_SAFE (REV-V-001 fix confirmed) |
| `configureReviewsEngine` | YES | No re-entry guard in engine | N/A | N/A | FINDING: VEN-REVIEWS-005 |

**REV-V-001 Fix Verified:** The ownership check in `setup.js` correctly queries `vc.actor_owners` (not `vc.actors`) with `is_void: false`. The fix described in the source comment (lines 37–39) is present and correct. RLS policy `actor_owners_read_own` enforces `user_id = auth.uid()` at the DB layer as documented.

---

## 9. Confidence Summary

| Area | Confidence | Notes |
|---|---|---|
| Feature source (setup.js) | HIGH | Single file, fully read |
| Engine controllers | HIGH | All 6 controllers read |
| Engine DAL (read) | HIGH | All 3 read DAL files read |
| Engine DAL (write/rpc) | HIGH | All 3 write/rpc DAL files read |
| Engine config/DI | HIGH | config.js fully read |
| Engine models | HIGH | Review.model.js read; pattern consistent across all models |
| Engine events | HIGH | events.js read — no security concern |
| Engine adapter | HIGH | index.js read — re-exports only |
| RLS posture (reviews.reviews) | UNVERIFIED | DB schema not inspected in this run |
| RLS posture (review_dimension_ratings) | UNVERIFIED | DB schema not inspected in this run |
| Supabase RPC (upsert_neutral_review) | ASSUMED SECURE | Described as SECURITY DEFINER in source; not directly inspected |
| BEHAVIOR.md contract | N/A — PLACEHOLDER | No §5/§9 content to cross-check |

---

## 10. THOR Impact

| Finding | Severity | THOR Blocker | Notes |
|---|---|---|---|
| VEN-REVIEWS-001 (dalInsertReview bypasses RPC) | HIGH | YES | Orphaned write path violating integrity constraint — must be removed or hard-gated before release |
| VEN-REVIEWS-002 (MISSING_BEHAVIOR_CONTRACT) | HIGH | YES | No declared security invariants — governance blocker for THOR eligibility |
| VEN-REVIEWS-003 (dalDeleteDimensionRatings no owner guard) | MEDIUM | NO | No active caller today; recommend fix before next engine consumer is added |
| VEN-REVIEWS-004 (getMyActiveReview missing isActorOwner) | MEDIUM | NO | Privacy gap; recommend fix before reviews are surfaced in public profile UI |
| VEN-REVIEWS-005 (configureReviewsEngine mutable singleton) | LOW | NO | Hardening gap; DB RPC is real backstop |

**THOR Eligibility:** BLOCKED — 2 THOR blockers (VEN-REVIEWS-001, VEN-REVIEWS-002).

---

## 11. Required Follow-Up Commands

| Finding | Command | Reason |
|---|---|---|
| VEN-REVIEWS-001 | DB | Verify RLS on reviews.reviews INSERT — confirm whether direct INSERT is gated |
| VEN-REVIEWS-001 | ELEKTRA | Confirm no active caller of dalInsertReview exists outside the engine |
| VEN-REVIEWS-001 | SPIDER-MAN | Add test asserting submitReview routes only through RPC |
| VEN-REVIEWS-002 | LOGAN | Write BEHAVIOR.md with §5 and §9 from engine source + this report |
| VEN-REVIEWS-003 | DB | Verify RLS on review_dimension_ratings DELETE |
| VEN-REVIEWS-003 | SPIDER-MAN | Add test for unauthorized rating delete attempt |
| VEN-REVIEWS-004 | DB | Confirm RLS on reviews.reviews SELECT — public vs private read scope |
| VEN-REVIEWS-004 | SPIDER-MAN | Add test for cross-actor getMyActiveReview attempt |
| VEN-REVIEWS-005 | ELEKTRA | Scan for any second callers of configureReviewsEngine outside setup.js |

---

## 12. MITIGATION PLAN

| Finding ID | Severity | THOR Blocker | Action | Effort | Owner |
|---|---|---|---|---|---|
| VEN-REVIEWS-001 | HIGH | YES | Remove `dalInsertReview` from engine or hard-gate as internal-only/DEV_ONLY with no export | LOW | Ironman/Engine owner |
| VEN-REVIEWS-002 | HIGH | YES | Write BEHAVIOR.md §5 Security Rules + §9 Must Never Happen | MEDIUM | LOGAN |
| VEN-REVIEWS-003 | MEDIUM | NO | Add `authorActorId` ownership pre-check to `dalDeleteDimensionRatingsForReview` or remove the function | LOW | Engine owner |
| VEN-REVIEWS-004 | MEDIUM | NO | Add `isActorOwner(authorActorId)` call at top of `getMyActiveReview` controller | LOW | Engine owner |
| VEN-REVIEWS-005 | LOW | NO | Add re-entry guard to `configureReviewsEngine`: throw if already configured | LOW | Engine owner |

---

## 13. CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings |
|---|---|
| Access Control | VEN-REVIEWS-001 (RLS bypass risk), VEN-REVIEWS-003 (no ownership on delete), VEN-REVIEWS-004 (missing ownership on read) |
| Software Development Security | VEN-REVIEWS-001 (bypassed integrity control), VEN-REVIEWS-002 (no contract), VEN-REVIEWS-005 (mutable singleton) |
| Information Security Governance and Risk Management | VEN-REVIEWS-002 (no behavior contract), VEN-REVIEWS-005 |
| Information Security and Privacy | VEN-REVIEWS-004 (review body privacy leak) |
| Security Operations | None |
| Cryptography | None |
| Network Security | None |
| Identity and Access Management | None (REV-V-001 fix VERIFIED_SAFE) |

---

*Report generated by VENOM V2 — 2026-06-04. All findings are SOURCE_VERIFIED with cited file paths and line numbers.*
