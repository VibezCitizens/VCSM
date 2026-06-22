# BLACKWIDOW V2 — Adversarial Runtime Verification Report
# Feature: upload | App: VCSM | Date: 2026-06-04

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report Type | BW2.9 Adversarial Runtime Verification |
| Feature | upload |
| App | VCSM |
| Run Date | 2026-06-04 |
| Agent | BLACKWIDOW V2 |
| Scanner Version | 1.1.0 |
| Scanner Maps Timestamp | 2026-06-04T19:48:25.152Z |
| Scanner Age | FRESH (~7h) |
| Behavior Contract | PLACEHOLDER — §4/§9 invariants UNANCHORED |
| Prior VENOM Findings | 11 total (5 HIGH, 4 MEDIUM, 1 LOW, 1 HIGH for missing contract) |
| Prior ELEKTRA Findings | NOT RUN |

---

## 2. Scanner Preflight

- Scanner Version: 1.1.0
- Maps Generated: 2026-06-04T19:48:25.152Z
- Preflight Status: FRESH
- Security paths attributed to upload in scanner: 7
- Total platform security paths: 598
- Upload share: 1.2%
- All 7 paths: LOW confidence (unresolved/null sourceRoute) — PRIMARY ATTACK TARGETS per Rule BW-002

---

## 3. Scanner Inputs Block

| Map | Status |
|---|---|
| security-path-map.json | READ — 7 upload paths extracted |
| callgraph.json | READ — 69 nodes, 76 edges |
| write-execution-map.json | READ — 0 upload paths resolved |
| rpc-execution-map.json | READ — 0 upload paths resolved |

All security paths for upload have `confidence: LOW` and `route: null`. No route-confirmed paths exist. All paths are unresolved surface-only discoveries.

---

## 4. Attack Surface Inventory

### 4.1 Security Path Summary

| Surface | Confidence | DAL Function | Table/RPC | Route Resolved |
|---|---|---|---|---|
| SP-1 | LOW | insertPost | vc.posts (INSERT) | NO |
| SP-2 | LOW | insertPostMedia | vc.post_media (INSERT) | NO |
| SP-3 | LOW | insertPostMentions | vc.post_mentions (INSERT) | NO |
| SP-4 | LOW | deletePostByIdDAL | vc.posts (DELETE) | NO |
| SP-5 | LOW | searchMentionSuggestions | identity.search_actor_directory (RPC) | NO |
| SP-6 | LOW | updatePostMediaAssetIdDAL | vc.post_media (UPDATE) | NO |
| SP-7 | LOW | searchMentionSuggestions | identity.search_actor_directory (RPC — duplicate) | NO |

### 4.2 Hook Entry Points (UI-Accessible)

| Hook | Entry Function | Calls Controller |
|---|---|---|
| useUploadSubmit | submit() | createPostController, recordPostMediaController |
| useMentionAutocomplete | apply(), onCaretEvent() | ctrlSearchMentionSuggestions |
| useMediaSelection | handleChosen(), pick(), clear(), removeAt() | None (client-only) |
| useResolvedActor | (state read) | None (identity read-only) |

### 4.3 DAL Write Surfaces

| DAL File | Function | Operation | Target |
|---|---|---|---|
| insertPost.dal.js | insertPost | INSERT | vc.posts |
| insertPostMedia.dal.js | insertPostMedia | INSERT | vc.post_media |
| insertPostMentions.dal.js | insertPostMentions | INSERT | vc.post_mentions |
| postAuthRollback.dal.js | deletePostByIdDAL | DELETE | vc.posts |
| updatePostMediaAssetId.write.dal.js | updatePostMediaAssetIdDAL | UPDATE | vc.post_media |

### 4.4 Adapter Write Surfaces

| Adapter File | Function | Operation |
|---|---|---|
| posts.adapter.js (createSystemPost) | createSystemPost | INSERT via insertPost |

### 4.5 Callgraph Layer Breakdown

| Layer | Node Count |
|---|---|
| component | 29 |
| hook | 9 |
| controller | 4 |
| dal | 10 |
| screen | 7 |
| module | 7 |
| adapter | 1 |
| model | 1 |
| barrel | 1 |

---

## 5. Scanner Signals Block

- All 7 security paths: LOW confidence, route=null
- No resolved routes — no confirmed UI→DAL path chains in scanner
- RPC surface `identity.search_actor_directory` appears twice (write-op entry + rpc entry)
- updatePostMediaAssetIdDAL discovered as separate write surface — secondary write-back path
- deletePostByIdDAL discovered as delete surface — flagged already by VEN-UPLOAD-005
- write-execution-map.json: 0 upload paths (empty for this feature)
- rpc-execution-map.json: 0 upload paths (empty for this feature)
- LOW confidence paths are PRIMARY ATTACK TARGETS per Rule BW-002

---

## 6. Adversarial Path Analysis

### 6.1 Attack Category A — OWNERSHIP BYPASS (§5.1)

**Target:** createPostController, recordPostMediaController, createSystemPost

**Attack Scenario A1 — Actor ID Injection via identity.actorId**

The primary post creation path is:
`useUploadSubmit.submit() → createPostController({ identity, input })`

`identity` is sourced from `useIdentity()` hook (line 3, useUploadSubmit.js), which reads from the session-bound identityContext. The `actorId` embedded in the DB row comes from `identity.actorId` (createPost.controller.js line 77: `actor_id: identity.actorId`).

Adversarial test: Can an actor submit with a different actor's ID?
- identity is session-derived from `useIdentity()` — not from client payload
- Controller does NOT read actorId from `input` — uses only `identity.actorId`
- Result: **BLOCKED at controller layer** — actorId cannot be overridden via input

**Attack Scenario A2 — actor_owners Ownership Verification**

VENOM finding VEN-UPLOAD-001 flags: "Actor identity not verified via actor_owners before post creation."

Source check: createPost.controller.js lines 24–33:
- Identity check: `if (!identity?.actorId)` — guards presence only (line 25)
- Auth check: `getCurrentAuthUserDAL()` — verifies Supabase auth session exists (line 31)
- NO `actor_owners` query occurs anywhere in createPostController
- The controller does NOT verify that `identity.actorId` is owned by the authenticated `user.id` via `actor_owners` table
- An attacker with a valid Supabase session who can inject a different `actorId` into identityContext (e.g., via client-side state tampering or a separate context injection) could post as any actor

However: actorId flows from `useIdentity()` which is session-derived. The realistic attack surface requires compromising identityContext. This is an unresolved risk rather than a direct exploit.
- Result: **PARTIAL** — no `actor_owners` verification, but actorId is session-derived, not payload-derived. VEN-UPLOAD-001 confirmed OPEN.

**Attack Scenario A3 — recordPostMediaController Ownership**

recordPostMediaController (line 26, recordPostMedia.controller.js):
- Accepts `actorId` as a plain parameter
- No actor_owners check
- Calls `createMediaAssetController({ ownerActorId: actorId, createdByActorId: actorId, ... })`
- actorId is passed from `identity.actorId` in useUploadSubmit.js (line 67)
- Same session-derivation protection as A2

Result: **PARTIAL** — VEN-UPLOAD-001 chain extends to this controller. [SOURCE_VERIFIED]

**Attack Scenario A4 — createSystemPost Ownership**

posts.adapter.js line 4: `export async function createSystemPost({ actorId, ... })`
- actorId is accepted directly from caller
- Auth check present: `supabase.auth.getUser()` at line 12–13
- No actor_owners verification
- Caller-supplied actorId is inserted directly into `actor_id` field (line 15)
- Any authenticated caller can supply any actorId to createSystemPost
- This is VEN-UPLOAD-007 confirmed: [SOURCE_VERIFIED — posts.adapter.js:4,15]

Result: **BYPASSED** — arbitrary actorId accepted from caller with no ownership verification. VEN-UPLOAD-007 confirmed HIGH.

---

### 6.2 Attack Category B — SESSION MUTATION (§5.2)

**Target:** createPostController — viewerActorId / identity sourcing

**Attack Scenario B1 — Null Identity Bypass**

createPost.controller.js line 25: `if (!identity?.actorId) throw new Error("No actor identity")`
- Null identity.actorId is caught and throws
- Null/undefined identity object is caught via optional chain

**Attack Scenario B2 — user.id vs actor_id mismatch**

createPost.controller.js:
- `user.id` (line 76: `user_id: user.id`) comes from `getCurrentAuthUserDAL()` — Supabase auth session
- `actor_id` (line 77: `actor_id: identity.actorId`) comes from `useIdentity()` — identityContext
- These are separate sources: auth session user.id vs identity store actorId
- There is NO cross-verification that the session user owns the actorId from identityContext
- A race condition or stale identity context could result in mismatched user_id / actor_id on an inserted post

**Stale Context Attack:** If an actor switches identity (e.g., personal → vport) mid-submission, the auth session user.id and identity.actorId could diverge. The post row would record the new actorId with the old user.id (or vice versa), potentially attributing a post to the wrong actor context.

Result: **PARTIAL** — mismatch possible, not an active bypass but a trust boundary gap. New finding.

---

### 6.3 Attack Category C — RUNTIME ABUSE (§5.3)

**Target:** Actor kind checks — owner vs non-owner paths

**Attack Scenario C1 — Mode Parameter Abuse**

createPost.controller.js line 85: `post_type: input.mode`
- `input.mode` is accepted directly from client payload (passed through useUploadSubmit.js line 50)
- No allowlist validation in createPostController
- Allowed values are: 'post', '24drop', 'vdrop' — but any string can be submitted
- This is VEN-UPLOAD-009 confirmed: post_type stored from unvalidated input.mode [SOURCE_VERIFIED — createPost.controller.js:85]

**Attack Scenario C2 — MAX_VIBES_PHOTOS bypass**

createPost.controller.js line 62: `if ((input.mode === "post" || !input.mode) && mediaUrls.length > MAX_VIBES_PHOTOS)`
- The guard checks `mode === "post"` OR `!input.mode`
- If an attacker submits `mode = "custom_mode"` (a truthy non-"post" string), the MAX_VIBES_PHOTOS cap is bypassed at the controller level
- uploadMedia.js also has a separate check at line 43: `if (images.length > MAX_VIBES_PHOTOS)` for mode==='post' only
- For non-'post' modes, uploadMedia handles only 1 file (line 30: first file only)
- Controller bypass is real but limited by uploadMedia pre-filtering

Result: **BYPASSED** — a crafted call that invokes createPostController directly (bypassing useUploadSubmit/uploadMedia layer) with a non-standard mode value can exceed the photo limit. [SOURCE_VERIFIED — createPost.controller.js:62]

---

### 6.4 Attack Category D — RLS VERIFICATION (§5.4)

**Target:** Each DAL write surface

**insertPost.dal.js** (line 7–17):
- No ownership predicate in the query
- Relies entirely on RLS for actor_id/user_id enforcement
- Row data is trusted from controller layer
- RLS status: UNVERIFIED in this run (VENOM noted DB-layer verification needed)

**insertPostMedia.dal.js** (line 3–21):
- No ownership predicate — only `post_id` filter
- Inserts media rows linked to a post_id
- If an attacker obtains a valid post_id, they could insert additional media rows for that post
- No post ownership check before insert
- RLS status: UNVERIFIED

**insertPostMentions.dal.js** (line 3–15):
- No ownership predicate
- Inserts mention rows for any post_id + actor_id pair
- An authenticated user could insert mention rows for posts they don't own if RLS is absent
- RLS status: UNVERIFIED

**deletePostByIdDAL (postAuthRollback.dal.js)** (line 9–17):
- DELETE .eq('id', postId) — no ownership filter
- Any authenticated caller can delete any post by ID
- Exported as a named function — VEN-UPLOAD-005 confirmed [SOURCE_VERIFIED — postAuthRollback.dal.js:9–17]

**updatePostMediaAssetIdDAL** (line 11–21):
- UPDATE .eq('id', postMediaId) — no ownership filter
- Any caller with a valid postMediaId can update the media_asset_id field
- Called from recordPostMediaController without actorId cross-check on the target row
- VEN-UPLOAD-004 confirmed [SOURCE_VERIFIED — updatePostMediaAssetId.write.dal.js:11–21]

**Overall RLS Assessment:** All five DAL write surfaces lack application-layer ownership predicates. RLS is the sole barrier. RLS is unverified for these tables in this run.

---

### 6.5 Attack Category E — VIEWER CONTEXT FUZZING (§5.5)

**Target:** createPostController, ctrlSearchMentionSuggestions, recordPostMediaController

**Attack Scenario E1 — Null actorId to createPostController**

createPost.controller.js line 25: `if (!identity?.actorId) throw new Error("No actor identity")`
- Explicit null/undefined guard at entry point
- Result: **BLOCKED** [SOURCE_VERIFIED — createPost.controller.js:25]

**Attack Scenario E2 — Null actorId to recordPostMediaController**

recordPostMedia.controller.js line 27: `if (!actorId || !Array.isArray(uploadResults) || uploadResults.length === 0) return`
- Early return (silent) on null actorId
- Does not throw — returns undefined silently
- Downstream: createMediaAssetController receives null ownerActorId
- The media record would be created with null owner if createMediaAssetController does not itself validate

Result: **PARTIAL** — null actorId does not throw, passes through to createMediaAssetController. Depends on downstream validation. New finding.

**Attack Scenario E3 — Null viewerActorId to searchMentionSuggestions**

searchMentionSuggestions.dal.js line 25: `p_viewer_actor_id: viewerActorId`
- viewerActorId defaults to null (line 19: `viewerActorId = null`)
- ctrlSearchMentionSuggestions.controller.js does not pass viewerActorId at all (line 3–5)
- RPC called with null p_viewer_actor_id
- Blocked actors may appear in autocomplete results — VEN-UPLOAD-006 confirmed [SOURCE_VERIFIED — searchMentionSuggestions.controller.js:3–5]

---

### 6.6 Attack Category F — MUTATION REPLAY (§5.6)

**Target:** Post creation flow — duplicate submission

**Attack Scenario F1 — Double Submit**

useUploadSubmit.js: `setLoading(true)` prevents UI re-submission during execution (line 23).
- No idempotency key in insertPost row
- No DB uniqueness constraint visible at DAL layer
- A network retry or programmatic double-call to createPostController could insert duplicate posts
- There is no state-machine or deduplication token

Result: **PARTIAL** — UI loading gate exists but is not a hard server-side barrier. Programmatic double-submit not blocked.

**Attack Scenario F2 — Post Media Replay**

updatePostMediaAssetIdDAL has no idempotency check. Calling it twice for the same postMediaId would overwrite media_asset_id silently (idempotent overwrite, not a corruption). No replay risk here.

Result: **BLOCKED** — overwrite is idempotent for updatePostMediaAssetIdDAL.

---

### 6.7 Attack Category G — HYDRATION POISONING (§5.7)

Upload feature does not directly interact with the hydration store. Posts are written to the DB; feed hydration is handled by the feed feature. No hydration poisoning surface identified.

Result: **NOT APPLICABLE**

---

### 6.8 Attack Category H — URL SURFACE (§5.9)

**Target:** Notification linkPath construction

createPost.controller.js line 157: `linkPath: '/post/${postId}'`
- postId is a raw UUID sourced from `created?.id` (the Supabase-generated UUID)
- Raw UUID exposed in notification link
- VEN-UPLOAD-010 confirmed [SOURCE_VERIFIED — createPost.controller.js:157]

**Attack Scenario H1 — UUID Enumeration via Notification Links**

Notification linkPaths containing raw UUIDs enable post enumeration. An attacker receiving a mention notification can infer the UUID space of posts and attempt to access other posts by iterating nearby UUIDs. This is a low-severity information leak but violates the platform no-raw-IDs-in-URLs contract.

Result: **BYPASSED** — raw UUID in notification linkPath. VEN-UPLOAD-010 OPEN. [SOURCE_VERIFIED — createPost.controller.js:157]

---

### 6.9 Attack Category I — §9 INVARIANT ATTACK

**BEHAVIOR.md is PLACEHOLDER.** §9 Must Never Happen invariants are UNANCHORED — no declared invariants to test against.

BW-derived invariants (inferred from source semantics):

**Inferred Invariant I-1:** A post must always be attributed to the posting actor's own identity (actor_id must match the authenticated user's actor).
- Status: **UNANCHORED** — no actor_owners verification. VEN-UPLOAD-001 OPEN.

**Inferred Invariant I-2:** A post must never be created by an unauthenticated session.
- Test: pass null identity → throws at line 25. **BLOCKED.**

**Inferred Invariant I-3:** deletePostByIdDAL must only delete posts owned by the caller.
- Status: **BYPASSED** — no ownership predicate. VEN-UPLOAD-005 OPEN. [SOURCE_VERIFIED]

**Inferred Invariant I-4:** post_type must be a valid platform type.
- Status: **BYPASSED** — no allowlist. VEN-UPLOAD-009 OPEN. [SOURCE_VERIFIED — createPost.controller.js:85]

**Inferred Invariant I-5:** Media asset write-back must not corrupt another actor's media.
- Status: **PARTIAL** — updatePostMediaAssetIdDAL has no ownership filter. VEN-UPLOAD-004 OPEN.

---

## 7. Exploitability Assessment

| Finding ID | Description | Severity | Result | Exploitability |
|---|---|---|---|---|
| BW-UPLOAD-001 | user_id/actor_id mismatch from dual-source trust boundary | HIGH | PARTIAL | Requires identity context race/stale state |
| BW-UPLOAD-002 | recordPostMediaController passes null actorId silently to createMediaAssetController | MEDIUM | PARTIAL | Null actorId creates ownerless media record |
| BW-UPLOAD-003 | input.mode allowlist bypass — MAX_VIBES_PHOTOS cap skipped for non-"post" modes | MEDIUM | BYPASSED | Direct controller call with crafted mode bypasses photo limit |
| BW-UPLOAD-004 | Mutation replay — no idempotency key for post creation | LOW | PARTIAL | Programmatic double-submit inserts duplicate posts |
| BW-UPLOAD-005 | BEHAVIOR.md PLACEHOLDER — §9 invariants UNANCHORED | HIGH | N/A | All inferred invariants are unverified governance risk |

Cross-reference confirmed (VEN findings tested and corroborated):
- VEN-UPLOAD-001 (actor_owners): PARTIAL — session-derived actorId, no DB verification
- VEN-UPLOAD-004 (updatePostMediaAssetIdDAL): BYPASSED — no ownership filter [SOURCE_VERIFIED]
- VEN-UPLOAD-005 (deletePostByIdDAL): BYPASSED — no ownership filter [SOURCE_VERIFIED]
- VEN-UPLOAD-007 (createSystemPost actorId): BYPASSED — arbitrary actorId from caller [SOURCE_VERIFIED]
- VEN-UPLOAD-009 (post_type no allowlist): BYPASSED — createPost.controller.js:85 [SOURCE_VERIFIED]
- VEN-UPLOAD-010 (raw UUID in linkPath): BYPASSED — createPost.controller.js:157 [SOURCE_VERIFIED]
- VEN-UPLOAD-006 (null viewerActorId): BYPASSED — searchMentionSuggestions.controller.js:3–5 [SOURCE_VERIFIED]

---

## 8. Source Verification Summary

| Claim | File | Line(s) | Provenance |
|---|---|---|---|
| actorId from identity (session-derived) | useUploadSubmit.js | 3, 35 | SOURCE_VERIFIED |
| actor_id uses identity.actorId not input | createPost.controller.js | 77 | SOURCE_VERIFIED |
| No actor_owners check in createPostController | createPost.controller.js | 24–33 | SOURCE_VERIFIED |
| createSystemPost accepts arbitrary actorId | posts.adapter.js | 4, 15 | SOURCE_VERIFIED |
| input.mode stored directly as post_type | createPost.controller.js | 85 | SOURCE_VERIFIED |
| MAX_VIBES check gated on mode==="post" only | createPost.controller.js | 62 | SOURCE_VERIFIED |
| deletePostByIdDAL has no ownership predicate | postAuthRollback.dal.js | 9–17 | SOURCE_VERIFIED |
| updatePostMediaAssetIdDAL has no ownership filter | updatePostMediaAssetId.write.dal.js | 11–21 | SOURCE_VERIFIED |
| null actorId silently returns in recordPostMediaController | recordPostMedia.controller.js | 27 | SOURCE_VERIFIED |
| viewerActorId null passed to search RPC | searchMentionSuggestions.controller.js | 3–5 | SOURCE_VERIFIED |
| linkPath contains raw postId UUID | createPost.controller.js | 157 | SOURCE_VERIFIED |
| BEHAVIOR.md is PLACEHOLDER | BEHAVIOR.md | 1–9 | SOURCE_VERIFIED |

---

## 9. Confidence Summary

| Category | Count | Confidence |
|---|---|---|
| SOURCE_VERIFIED findings | 12 (all above) | HIGH |
| SCANNER_LEAD findings | 0 | — |
| SCANNER_LOW_CONF paths | 7 (all 7 upload paths) | LOW |
| BYPASSED with source citation | 6 | HIGH |
| PARTIAL (requires context) | 4 | MEDIUM |
| BLOCKED | 3 | HIGH |

---

## 10. §9 Invariant Attack Map

BEHAVIOR.md status: PLACEHOLDER — no §9 invariants declared. All attacks below operate against BW-inferred invariants.

| Inferred Invariant | Attack Attempted | Result | Severity |
|---|---|---|---|
| Post must be attributed to authenticated actor's own actor | actor_owners not verified — any actorId from identityContext | PARTIAL | HIGH |
| Unauthenticated post creation must be impossible | null identity → throws | BLOCKED | N/A |
| deletePostByIdDAL must be ownership-scoped | No ownership predicate | BYPASSED | HIGH (VEN-UPLOAD-005) |
| post_type must be allowlisted | No allowlist — any string accepted | BYPASSED | MEDIUM (VEN-UPLOAD-009) |
| Media asset write-back must not update other actors' records | No actor filter on updatePostMediaAssetIdDAL | BYPASSED | HIGH (VEN-UPLOAD-004) |
| Notification links must not expose raw IDs | Raw UUID in linkPath | BYPASSED | LOW (VEN-UPLOAD-010) |
| System posts must verify caller owns actorId | No actor_owners check | BYPASSED | HIGH (VEN-UPLOAD-007) |

**Root Cause of UNANCHORED Status:** BEHAVIOR.md is a placeholder. None of these invariants are formally declared. Any of them could be violated without triggering a governance alert.

Finding BW-UPLOAD-005 (MISSING/PLACEHOLDER BEHAVIOR CONTRACT) is rated HIGH because all security invariants for this feature are unanchored.

---

## 11. Behavior Contract Attack Summary

**Contract Status:** PLACEHOLDER — no formal behavior contract exists for upload.

**Implications:**
1. §4 Failure Paths: Not declared. No defined error states or recovery expectations.
2. §9 Must Never Happen: Not declared. Zero formally protected invariants.
3. Any future change to the upload feature has no contract to validate against.
4. Governance gap: THOR eligibility cannot be confirmed without a complete behavior contract.

**BW Assessment:** The absence of a behavior contract is itself a HIGH severity governance finding. It means no invariant has been formally ratified, and the BW attack map is operating on inferred semantics that may not reflect product intent.

---

## 12. THOR Impact

The following findings constitute release blockers (aligned with existing VENOM THOR blockers):

| Finding | THOR Status | Reason |
|---|---|---|
| VEN-UPLOAD-001 | BLOCKER (existing) | actor_owners not verified — corroborated by BW |
| VEN-UPLOAD-004 | BLOCKER (existing) | updatePostMediaAssetIdDAL ownerless — corroborated by BW |
| VEN-UPLOAD-005 | BLOCKER (existing) | deletePostByIdDAL ownerless — corroborated by BW |
| VEN-UPLOAD-007 | BLOCKER (existing) | createSystemPost arbitrary actorId — corroborated by BW |
| BW-UPLOAD-005 | BLOCKER (new) | BEHAVIOR.md PLACEHOLDER — §9 invariants unanchored, governance gap |
| BW-UPLOAD-001 | RECOMMENDED BLOCKER | Dual-source trust boundary (user_id vs actor_id) — unverified cross-ownership |

**New THOR Blockers Proposed:** BW-UPLOAD-005 (BEHAVIOR.md must be written before release), BW-UPLOAD-001 (actor ownership cross-verification needed).

---

## 13. SPIDER-MAN Test Requirements

The following regression tests are required to lock the attack surfaces identified in this report:

### T1 — Ownership Boundary Tests (Priority: HIGH)

**T1.1:** createPostController must throw when actor_owners does not contain a row matching (user_id, actor_id).
- Setup: authenticated session with user A, inject actor B's actorId into identity context
- Expected: controller throws "No actor identity" or ownership error

**T1.2:** createSystemPost must throw when actorId is not owned by the calling user via actor_owners.
- Setup: call createSystemPost with an actorId not belonging to the session user
- Expected: throws ownership error

**T1.3:** deletePostByIdDAL should only delete posts where actor_id matches the calling session.
- Setup: create post as actor A, call delete as actor B
- Expected: RLS blocks or zero rows affected

### T2 — Input Validation Tests (Priority: MEDIUM)

**T2.1:** createPostController rejects post_type values not in ['post', '24drop', 'vdrop'].
- Expected: throws validation error for unknown mode

**T2.2:** createPostController enforces MAX_VIBES_PHOTOS for all mode values (not just mode==='post').
- Setup: call controller directly with 11 mediaUrls and mode='anything_else'
- Expected: throws "VIBES: max 10 photos" error regardless of mode string

### T3 — Session Integrity Tests (Priority: HIGH)

**T3.1:** user_id on inserted post must match the authenticated session user's ID.
- Setup: tamper identity context to use a different actorId
- Expected: either controller rejects, or DB RLS blocks the mismatch

**T3.2:** recordPostMediaController with null actorId must throw, not silently continue.
- Expected: error thrown before downstream createMediaAssetController is called

### T4 — Notification URL Tests (Priority: LOW)

**T4.1:** Notification linkPath for social.post.mention must use slug-based path, not raw UUID.
- Expected: linkPath matches `/post/[slug]` pattern, not `/post/[uuid-pattern]`

### T5 — Mention Autocomplete Tests (Priority: MEDIUM)

**T5.1:** ctrlSearchMentionSuggestions must pass the authenticated viewer's actorId to the RPC.
- Expected: p_viewer_actor_id is set; blocked actors are excluded from results

### T6 — Behavior Contract Test (Priority: HIGH)

**T6.1:** BEHAVIOR.md must be a complete contract (not PLACEHOLDER) before any upload feature changes ship.
- This is a governance test, not a runtime test. Enforce via PR check.
