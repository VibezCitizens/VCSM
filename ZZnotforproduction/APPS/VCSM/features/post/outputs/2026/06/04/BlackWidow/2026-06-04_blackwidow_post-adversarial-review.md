# BLACKWIDOW V2 Adversarial Review — post
# Feature: post | App: VCSM | Date: 2026-06-04

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report Version | BW2.5 V2 |
| Reviewer | BLACKWIDOW (automated adversarial agent) |
| Feature | post |
| App | VCSM |
| Date | 2026-06-04 |
| Scanner Version | 1.1.0 |
| Scanner Map Age | FRESH — generated 2026-06-04T19:48:25.152Z (~7h old) |
| Behavior Contract | PLACEHOLDER — all §9 invariants UNANCHORED |
| Source Files Read | 20 |
| Findings Issued | 9 (1 CRITICAL, 3 HIGH, 3 MEDIUM, 2 LOW) |

---

## 2. Scanner Preflight

| Field | Value |
|---|---|
| Status | FRESH |
| Generated | 2026-06-04T19:48:25.152Z |
| Scanner Version | 1.1.0 |
| Total Platform Security Paths | 598 |
| Post Security Paths (scanner) | 16 |
| All paths confidence | LOW — zero paths have resolved sourceRoute |

Scanner signal quality: ALL 16 post security paths carry LOW confidence (unresolved sourceRoute, null controller, access: "unknown"). This is the PRIMARY attack target profile per BW Rule BW-002: LOW confidence paths represent confirmed write surfaces with no verified call-chain protection.

---

## 3. Scanner Inputs Block

Security path map: apps/scanner/maps/security-path-map.json
Callgraph map: apps/scanner/maps/callgraph.json
Write execution map: apps/scanner/maps/write-execution-map.json
RPC execution map: apps/scanner/maps/rpc-execution-map.json

Post nodes in callgraph: 189 total (22 controllers, 23 hooks, 39 DALs, 38 components, 22 models, 19 barrels, 14 screens, 11 modules, 1 adapter)
Post edges in callgraph: 236

Write surfaces discovered:
- vc.comment_likes (INSERT/DELETE) — commentLikes.dal.js
- vc.post_comments (INSERT x2, UPDATE x2) — comments.dal.js + postComments.read.dal.js
- vc.post_mentions (DELETE, INSERT) — post.write.dal.js + postMentions.write.dal.js
- vc.posts (UPDATE x2) — post.write.dal.js
- vc.post_reactions (INSERT, UPDATE, DELETE) — postReactions.write.dal.js
- vc.post_rose_gifts (INSERT) — roseGifts.actor.dal.js
- vc.post_reactions (RPC: post_reactors_summary_one) — postReactions.read.dal.js

RPC paths for post: NONE resolved (rpc-execution-map returns empty for post)

---

## 4. Attack Surface Inventory

### HIGH Confidence Write Surfaces (source-verified ownership gates)

| DAL Function | Table | Owner Gate | Method |
|---|---|---|---|
| updatePostTextDAL | vc.posts | .eq("actor_id", actorId) | DAL-level filter |
| softDeletePostDAL | vc.posts | .eq("actor_id", actorId) | DAL-level filter |
| updateCommentContentDAL | vc.post_comments | .eq("actor_id", actorId) | DAL-level filter |
| softDeleteCommentDAL | vc.post_comments | .eq("actor_id", actorId) | DAL-level filter |

### LOW Confidence Write Surfaces (no route-confirmed path — PRIMARY ATTACK TARGETS)

| DAL Function | Table | Owner Gate | Risk Level |
|---|---|---|---|
| insertPostComment (postComments.read.dal.js) | vc.post_comments | NONE in DAL | CRITICAL — orphaned |
| createComment (comments.dal.js) | vc.post_comments | None in DAL | HIGH — actorId injected by caller |
| likeComment / unlikeComment | vc.comment_likes | None — composite PK only | MEDIUM — actor can self-like |
| insertReactionDAL / updateReactionDAL / deleteReactionDAL | vc.post_reactions | actorId in .eq() for update/delete only | MEDIUM |
| insertRoseGiftDAL | vc.post_rose_gifts | None — no self-gifting guard | HIGH — confirmed VEN-POST-004 |
| replacePostMentions DELETE | vc.post_mentions | None — postId only, no actor gate | HIGH |

### Hook Entry Points (UI-Accessible)

| Hook | Write Operations Reached |
|---|---|
| useCommentThread.addComment | createRootComment → createComment (comments.dal.js) |
| useCommentThread.addReply | createReplyComment → createComment (comments.dal.js) |
| useEditPost.editPost | editPostController → updatePostTextDAL |
| useDeletePostAction | softDeletePostController → softDeletePostDAL |
| usePostReactionOps.toggleReaction | togglePostReactionController → insertReactionDAL/updateReactionDAL/deleteReactionDAL |
| usePostReactionOps.sendRose | sendRoseController → insertRoseGiftDAL |
| useCommentCard (via commentReactions.controller) | toggleCommentLike → likeComment/unlikeComment |
| useEditCommentAction | editCommentController → updateCommentContentDAL |

### Orphaned Write Surface

insertPostComment in postComments.read.dal.js (line 40-65): Export lives in a .read.dal file with no controller ownership. Confirmed VEN-POST-001 outstanding.

---

## 5. Scanner Signals Block

All 16 post security paths: confidence=LOW, route=null, controller=null, access=unknown.

This means the scanner has discovered write surfaces by AST traversal but cannot trace them back to protected routes. The entire post write surface is operating on implicit RLS trust at the DB layer with no scanner-verified route authorization.

Key signal: zero post paths appear in rpc-execution-map.json — the RPC post_reactors_summary_one is read-only and carries no auth risk.

Callgraph backwards trace for primary write DALs:
- insertReactionDAL ← togglePostReactionController ← usePostReactionOps ← (components)
- insertRoseGiftDAL ← sendRoseController ← usePostReactionOps ← (components)
- createComment ← createRootComment/createReplyComment ← useCommentThread ← (components)
- updatePostTextDAL ← editPostController ← useEditPost ← usePostDetailEditing
- softDeletePostDAL ← softDeletePostController ← useDeletePostAction
- insertPostComment ← NO CONTROLLER FOUND (orphaned)

---

## 6. Adversarial Path Analysis

### A. OWNERSHIP BYPASS (§5.1)

**A.1 — Post Edit Ownership Bypass**
Attack: Attacker calls editPostController({ actorId: ATTACKER_ID, postId: VICTIM_POST_ID, text: "pwned" })

Source trace:
- editPost.controller.js line 4: validates actorId + postId present
- editPost.controller.js line 11: calls updatePostTextDAL({ actorId, postId, text: trimmed })
- post.write.dal.js line 84: .eq("actor_id", actorId) — ownership filter in UPDATE query

Result: BLOCKED
Provenance: [SOURCE_VERIFIED] — post.write.dal.js:84
Exploit Chain Type: Single-step

**A.2 — Post Delete Ownership Bypass**
Attack: Attacker calls softDeletePostController({ actorId: ATTACKER_ID, postId: VICTIM_POST_ID })

Source trace:
- deletePost.controller.js line 9: calls softDeletePostDAL({ actorId, postId })
- post.write.dal.js line 119: .eq("actor_id", actorId) — ownership filter in UPDATE

Result: BLOCKED
Provenance: [SOURCE_VERIFIED] — post.write.dal.js:119
Exploit Chain Type: Single-step

**A.3 — Comment Edit Ownership Bypass**
Attack: Attacker calls editCommentController({ actorId: ATTACKER_ID, commentId: VICTIM_COMMENT_ID, text: "..." })

Source trace:
- editComment.controller.js line 12: calls updateCommentContentDAL({ actorId, commentId, content: trimmed })
- comments.dal.js line 50: .eq("actor_id", actorId) — ownership filter

Result: BLOCKED
Provenance: [SOURCE_VERIFIED] — comments.dal.js:50
Exploit Chain Type: Single-step

**A.4 — Comment Delete Ownership Bypass**
Attack: Attacker calls softDeleteCommentController({ actorId: ATTACKER_ID, commentId: VICTIM_COMMENT_ID })

Source trace:
- deleteComment.controller.js line 8: calls softDeleteCommentDAL({ actorId, commentId })
- comments.dal.js line 70: .eq("actor_id", actorId) — ownership filter

Result: BLOCKED
Provenance: [SOURCE_VERIFIED] — comments.dal.js:70
Exploit Chain Type: Single-step

**A.5 — replacePostMentions DELETE No Ownership Gate**
Attack: Via editPost flow, attacker triggers replacePostMentions(postId, []) on any post they can pass postId for. The DELETE step in replacePostMentions has no actor_id filter.

Source trace:
- post.write.dal.js line 56-61: DELETE from post_mentions WHERE post_id = postId — NO actor_id check at delete boundary
- However: the caller updatePostTextDAL (line 72) has .eq("actor_id", actorId) on the posts UPDATE (line 84), and replacePostMentions is only called after a successful UPDATE (line 93-94)
- If the UPDATE returns null data (post not owned), updatePostTextDAL returns { data: null, error: null } at line 101 — BUT the mentions replacement runs in a try/catch AFTER the return at line 101, meaning the try/catch block (lines 91-99) runs BEFORE the return

CRITICAL FINDING: The execution order is:
1. UPDATE posts (line 79-86) — sets `data`
2. try/catch block (line 91-99) executes BEFORE the return on line 101
3. If data is null (ownership check failed), replacePostMentions is STILL CALLED because the ownership check result is only evaluated after replacePostMentions has been called

Wait — re-reading carefully: lines 79-86 do the UPDATE. Line 88 says `if (error) throw error`. Line 101 says `return { data, error: null }`. The try/catch block for mentions is lines 91-99, which runs BEFORE line 101. So YES: even if data is null (actorId mismatch, post not owned), the replacePostMentions call executes. However, replacePostMentions deletes mentions WHERE post_id = postId — there is no actor ownership check here. An attacker who controls postId can erase post_mentions rows for any post.

BUT: The outer controller editPostController (line 11) passes actorId from session context, and the UI hook useEditPost passes actorId from the hook argument. The attacker would need to supply a valid postId they don't own — and the UPDATE will return null data, but the mentions delete still fires.

Result: PARTIAL — mentions erasure fires on non-owned posts when postId is valid but actor_id doesn't match. Ownership failure is silent (data=null), not an error throw.
Provenance: [SOURCE_VERIFIED] — post.write.dal.js:52-66, 79-99
Exploit Chain Type: Multi-step
Severity: HIGH
Finding ID: BW-POST-001

---

### B. SESSION MUTATION (§5.2)

**B.1 — viewerActorId Source Verification**
useCommentThread.js: actorId sourced from useIdentity() line 35: `const actorId = identity?.actorId ?? null`
useDeletePostAction.js: actorId passed as parameter from parent (hook arg), not from payload.
useEditPost.js: actorId passed as parameter from caller (editPost({ actorId, postId, text })) — caller must supply it.

Finding: useEditPost and useDeletePostAction receive actorId as parameter from the caller. If a UI component passes actorId from a non-session source (e.g., from URL params or post.actor_id), an attacker could inject an arbitrary actorId. The hook itself does not enforce session-sourced actorId.

Source trace:
- useEditPost.js line 8: `async function editPost({ actorId, postId, text })` — actorId comes from caller arg, no internal session binding
- useDeletePostAction.js line 4: `export function useDeletePostAction({ actorId })` — actorId is a prop/arg, not session-resolved inside hook

The DAL-level ownership filter (actor_id = actorId) means an attacker passing a wrong actorId just gets data=null (no mutation), so the practical exploit is limited to privilege escalation attempts that naturally fail at DB. However, the hook architecture allows any UI component to pass any actorId — including the victim's actorId — if the component has access to it from a feed/post object.

Result: PARTIAL — DAL ownership gate blocks the actual mutation, but the hook layer has no session enforcement, creating a structural weakness.
Finding ID: BW-POST-002
Severity: MEDIUM
Provenance: [SOURCE_VERIFIED] — useEditPost.js:8, useDeletePostAction.js:4
Exploit Chain Type: Single-step (blocked at DAL), Injection (hook layer)

**B.2 — togglePostReaction actorId Session Source**
togglePostReaction.controller.js line 44: `actorId` comes from caller parameter.
usePostReactionOps.js line 5-7: Hook returns the controller functions directly — no session binding in hook.
The caller must supply actorId. If a UI component passes post.actor_id instead of viewer's actorId, the reaction would be attributed to the post owner.

Result: PARTIAL — same structural weakness as B.1. DB composite key (post_id, actor_id) provides implicit protection, but hook layer is architecturally unsound.
Finding ID: BW-POST-003 (merged with B.1 pattern)
Severity: MEDIUM
Provenance: [SOURCE_VERIFIED] — usePostReactionOps.js:1-9, togglePostReaction.controller.js:44
Exploit Chain Type: Injection

---

### C. RUNTIME ABUSE (§5.3)

**C.1 — Self-Reaction (No Self-Reaction Guard)**
Attack: Actor reacts to their own post.

Source trace:
- togglePostReaction.controller.js lines 43-54: Validates postId, actorId, reaction type
- No check comparing actorId against post.actor_id (post owner)
- Line 58: checkPostExistsDAL confirms post not deleted
- Lines 64-86: Proceeds to insert/update/delete reaction with no self-reaction check

Result: BYPASSED — actor CAN react to their own post. No self-reaction guard exists at any layer (controller, DAL, DB-level check visible in source).
Finding ID: BW-POST-004 (re-confirms VEN-POST-003)
Severity: HIGH
Provenance: [SOURCE_VERIFIED] — togglePostReaction.controller.js:43-86 (entire function, no self-check present)
Exploit Chain Type: Single-step

**C.2 — Self-Rose-Gift (No Self-Gifting Guard)**
Attack: Actor sends roses to their own post.

Source trace:
- sendRose.controller.js lines 38-40: Validates postId, actorId, qty > 0
- Lines 47-48: checkPostExistsDAL check
- No check comparing actorId to post.actor_id before insertRoseGiftDAL
- Lines 53-57: insertRoseGiftDAL called with no self-gift prevention

Result: BYPASSED — actor CAN rose-gift their own post. No upper bound on qty per insert either (qty validated > 0 only, arbitrary large values allowed).
Finding ID: BW-POST-005 (re-confirms VEN-POST-004)
Severity: HIGH
Provenance: [SOURCE_VERIFIED] — sendRose.controller.js:30-101 (entire function, no self-check and no qty upper bound)
Exploit Chain Type: Single-step

**C.3 — Self-Comment-Like (No Self-Like Guard)**
Attack: Actor likes their own comment.

Source trace:
- commentReactions.controller.js lines 10-13: Validates commentId + actorId present
- No check comparing actorId to comment.actor_id
- likeComment called with no self-like prevention

Result: BYPASSED — actor CAN like their own comment. Self-like generates a self-notification (social.post.comment_like to self).
Finding ID: BW-POST-006
Severity: MEDIUM
Provenance: [SOURCE_VERIFIED] — commentReactions.controller.js:10-46 (entire function, no self-check)
Exploit Chain Type: Single-step

---

### D. RLS VERIFICATION (§5.4)

**D.1 — post_reactions RLS Reliance**
The postReactions.write.dal.js uses .eq("actor_id", actorId) in updateReactionDAL and deleteReactionDAL (lines 34-35, 45-46). insertReactionDAL (lines 12-21) has NO actor ownership check — it inserts with caller-supplied actor_id field directly.

Source trace:
- postReactions.write.dal.js line 12-21: INSERT into post_reactions with actor_id from parameter — no ownership verification at DAL level
- Mitigation: RLS on vc.post_reactions table assumed to enforce actor_id = auth.uid() for INSERT
- RLS verification status: UNVERIFIED in source (no DB snapshot checked here)

Result: UNRESOLVED — relies on unverified RLS.
Finding ID: BW-POST-007
Severity: MEDIUM
Provenance: [SOURCE_VERIFIED] — postReactions.write.dal.js:12-21
Exploit Chain Type: Single-step (if RLS absent or misconfigured)

**D.2 — comment_likes RLS Reliance**
likeComment (commentLikes.dal.js line 25-37) inserts with caller-supplied actor_id — no DAL-level ownership assertion.
unlikeComment (line 39-50) has .eq("actor_id", actorId) in DELETE — identity-scoped.

Result: UNRESOLVED — likeComment relies on RLS for actor_id enforcement.
Finding ID: BW-POST-007 (covers both surfaces — same risk category)
Provenance: [SOURCE_VERIFIED] — commentLikes.dal.js:25-37

---

### E. VIEWER CONTEXT FUZZING (§5.5)

**E.1 — Null actorId to togglePostReactionController**
Attack: Pass null actorId.

Source trace:
- togglePostReaction.controller.js line 50: `if (!actorId) throw new Error("togglePostReaction: actorId required");`

Result: BLOCKED — throws synchronously before any DB call.
Provenance: [SOURCE_VERIFIED] — togglePostReaction.controller.js:50
Exploit Chain Type: Single-step

**E.2 — Null actorId to sendRoseController**
Source trace:
- sendRose.controller.js line 39: `if (!actorId) throw new Error("sendRose: actorId required");`

Result: BLOCKED
Provenance: [SOURCE_VERIFIED] — sendRose.controller.js:39

**E.3 — Null actorId to createRootComment**
Source trace:
- postComments.controller.js line 50: `createRootComment({ postId, actorId, content })` — no null check on actorId inside this function
- postComments.controller.js line 51: checkPostExistsDAL(postId) executes first
- If actorId is null, createComment (comments.dal.js line 4) is called with null actorId
- comments.dal.js line 12-18: INSERT sets actor_id to null — no null guard in DAL
- DB constraint on vc.post_comments.actor_id NOT NULL would reject this, but no application-layer guard

Result: PARTIAL — no application-layer null guard in createRootComment. Relies on DB constraint.
Finding ID: BW-POST-008
Severity: LOW
Provenance: [SOURCE_VERIFIED] — postComments.controller.js:50-58, comments.dal.js:4-32
Exploit Chain Type: Single-step

**E.4 — Null actorId to softDeleteCommentController**
Source trace:
- deleteComment.controller.js line 4: `if (!actorId) return { ok: false, error: new Error("actorId required") };`

Result: BLOCKED — early return with error.
Provenance: [SOURCE_VERIFIED] — deleteComment.controller.js:4

---

### F. MUTATION REPLAY (§5.6)

**F.1 — Soft-Delete Already-Deleted Post**
Attack: Call softDeletePostController on a post where deleted_at is already set.

Source trace:
- deletePost.controller.js: No check for existing deleted_at
- softDeletePostDAL: UPDATE posts SET deleted_at=now() WHERE id=postId AND actor_id=actorId — if row already has deleted_at set, the UPDATE still fires and updates deleted_at again (harmless but no state machine)
- editPostController: No check for deleted_at — allows "editing" a soft-deleted post

Result: PARTIAL — double-delete is harmless (timestamp overwrite), but editing a deleted post is a gap. editPost.controller.js has no deleted_at pre-check.
Finding ID: BW-POST-009
Severity: LOW
Provenance: [SOURCE_VERIFIED] — editPost.controller.js:4-17 (no deleted_at check), post.write.dal.js:72-102
Exploit Chain Type: Replay

**F.2 — Rose Gift Replay (Unlimited Re-Send)**
Attack: Actor calls sendRoseController multiple times for the same post.

Source trace:
- sendRose.controller.js: No check for previous rose gifts — insertRoseGiftDAL called unconditionally on each invocation
- roseGifts.actor.dal.js line 32-43: Pure INSERT — no uniqueness constraint visible in source

Result: BYPASSED — actor can send unlimited rose gifts to the same post via repeated calls. Each call inserts a new row in post_rose_gifts. Combined with uncapped qty (VEN-POST-004 / BW-POST-005), the rose count for any post can be artificially inflated without limit.
Finding ID: BW-POST-005 (severity escalated — confirmed multi-vector)
Severity: HIGH (confirmed BYPASSED)
Provenance: [SOURCE_VERIFIED] — sendRose.controller.js:30-101, roseGifts.actor.dal.js:31-43
Exploit Chain Type: Replay + Single-step

---

### G. HYDRATION POISONING (§5.7)

**G.1 — Hydration Store Interaction**
useCommentThread.js line 55: `hydrateActorsFromRows(flat)` — hydrates actor summaries from comment rows.
Actor summaries are sourced from DB-fetched rows, not from user-supplied content.

Potential vector: if actor_id in a comment row can be spoofed (e.g., comments.dal.js inserts actor_id from caller), a malicious actor could insert a comment with another actor's actor_id (if RLS does not prevent it), causing that actor's summary to hydrate under a different association.

Result: PARTIAL — depends on RLS enforcement for actor_id in post_comments INSERT. Source-level: createComment has no actor_id ownership assertion; actorId is caller-supplied.
Finding ID: BW-POST-007 (hydration angle of same RLS risk)
Provenance: [SOURCE_VERIFIED] — useCommentThread.js:55, comments.dal.js:12-18

---

### H. URL SURFACE (§5.9)

**H.1 — Notification linkPath Contains Raw postId (UUID)**
Attack: Inspect notification linkPaths constructed in post controllers.

Source trace:
- togglePostReaction.controller.js line 99: `linkPath: '/post/${postId}'` — postId is a raw UUID
- sendRose.controller.js line 73: `linkPath: '/post/${postId}'` — postId is a raw UUID
- postComments.controller.js line 70: `linkPath: '/post/${postId}'` — postId is a raw UUID
- postComments.controller.js line 112: `linkPath: '/post/${postId}'` — postId is a raw UUID
- commentReactions.controller.js line 39-40: `linkPath: comment.post_id ? '/post/${comment.post_id}' : null` — post_id is raw UUID

All post notification linkPaths expose raw UUIDs in violation of platform rule "No raw IDs in public URLs."

Result: BYPASSED — 5 notification linkPath construction sites use raw UUID postId in /post/:id paths.
Finding ID: BW-POST-010
Severity: HIGH
Provenance: [SOURCE_VERIFIED] — togglePostReaction.controller.js:99, sendRose.controller.js:73, postComments.controller.js:70+112, commentReactions.controller.js:40
Exploit Chain Type: Injection (URL enumeration / UUID exposure)

**H.2 — makeActorRoute Fallback Exposes raw actorId**
Source trace:
- getPostMentionMap.controller.js line 9: `if (actorId) return '/profile/${actorId}'` — fallback route uses raw actorId UUID when kind/username not resolvable

Result: PARTIAL — fallback only fires when username lookup fails, but it produces a raw UUID URL.
Finding ID: BW-POST-010 (same category — URL surface)
Provenance: [SOURCE_VERIFIED] — getPostMentionMap.controller.js:9

---

### I. §9 INVARIANT ATTACK (HIGHEST PRIORITY)

BEHAVIOR.md is a PLACEHOLDER. No §9 Must Never Happen invariants have been authored. All invariant attacks in this section are source-inferred from VCSM platform rules.

**I.1 — Platform Rule: Actor must not react to their own post**
Inferred invariant: An actor must never be the recipient of their own reaction notification, and reaction counts must not be self-inflated.
Attack: togglePostReactionController({ postId, actorId: POST_OWNER_ID, reaction: "like" })
Result: BYPASSED — no self-reaction guard. Post owner can like their own post and receive a self-notification. (BW-POST-004)

**I.2 — Platform Rule: No raw UUIDs in public-facing URLs**
Inferred invariant: linkPath values in notifications must use slug-based routes, not raw UUIDs.
Attack: Trigger any reaction/comment notification — observe linkPath.
Result: BYPASSED — all 5 notification sites use raw UUID paths. (BW-POST-010)

**I.3 — Platform Rule: Write mutations must be actor-owned**
Inferred invariant: Only the owning actor may edit or delete their content.
Attack: Supply mismatched actorId to edit/delete controllers.
Result: BLOCKED at DAL layer by .eq("actor_id", actorId) filter.

**I.4 — Platform Rule: Rose gift must not be self-sent**
Inferred invariant: An actor must not send roses to their own post (metric gaming).
Attack: sendRoseController({ postId: OWN_POST_ID, actorId: SELF_ID, qty: 999 })
Result: BYPASSED — no self-gifting check, no qty upper bound. (BW-POST-005)

**I.5 — Platform Rule: Deleted posts must not accept new interactions**
Inferred invariant: Soft-deleted posts must reject reactions, comments, and roses.
Attack: togglePostReactionController on a deleted post (deleted_at set).
Result: BLOCKED — checkPostExistsDAL (togglePostReaction.controller.js:58, sendRose.controller.js:47-48, postComments.controller.js:51-52) guards against deleted posts. However: editPostController (editPost.controller.js:4-17) has NO checkPostExistsDAL call — an actor can edit a post after it has been soft-deleted if they own the actor_id.
Finding: editPost allows editing of soft-deleted posts. (BW-POST-009)

---

## 7. Exploitability Assessment

| Finding ID | Severity | Confidence | Exploitability | Attack Vector |
|---|---|---|---|---|
| BW-POST-001 | HIGH | HIGH | High — requires knowledge of victim postId | Multi-step: edit own post ID → mentions of victim post erased |
| BW-POST-002 | MEDIUM | HIGH | Low — DAL blocks actual mutation | Hook layer structural weakness; actorId not session-bound |
| BW-POST-003 | MEDIUM | HIGH | Low — DAL blocks actual mutation | Same as BW-POST-002 for reactions |
| BW-POST-004 | HIGH | HIGH | High — trivially exploitable | Single call with own actorId + own postId |
| BW-POST-005 | HIGH | HIGH | High — unlimited replay, arbitrary qty | Repeat API calls |
| BW-POST-006 | MEDIUM | HIGH | Medium — self-like inflates metrics | Single call with own actorId + own commentId |
| BW-POST-007 | MEDIUM | MEDIUM | Medium — depends on RLS | Unverified RLS on post_reactions + comment_likes INSERT |
| BW-POST-008 | LOW | HIGH | Low — DB NOT NULL constraint blocks | Null actorId to createRootComment |
| BW-POST-009 | LOW | HIGH | Low — benign or requires deleted post | Edit of soft-deleted post |
| BW-POST-010 | HIGH | HIGH | High — enumeration/UUID exposure | All post notification linkPaths |

---

## 8. Source Verification Summary

All BYPASSED findings carry [SOURCE_VERIFIED] with file:line citations.
All BLOCKED findings carry [SOURCE_VERIFIED] with file:line citations.
No finding relies solely on scanner signals.

Files read and verified:
- togglePostReaction.controller.js — full read
- editPost.controller.js — full read
- deletePost.controller.js — full read
- sendRose.controller.js — full read
- postComments.controller.js — full read
- deleteComment.controller.js — full read
- editComment.controller.js — full read
- commentReactions.controller.js — full read
- post.write.dal.js — full read
- comments.dal.js — full read
- postComments.read.dal.js — full read
- commentLikes.dal.js — full read
- postReactions.write.dal.js — full read
- roseGifts.actor.dal.js — full read
- postMentions.write.dal.js — full read
- useCommentThread.js — full read
- useEditPost.js — full read
- useDeletePostAction.js — full read
- usePostReactionOps.js — full read
- getPostMentionMap.controller.js — full read

---

## 9. Confidence Summary

| Category | Count | Notes |
|---|---|---|
| CRITICAL | 0 | No single-shot unauthorized mutation of another actor's data confirmed |
| HIGH | 4 | BW-POST-001, BW-POST-004, BW-POST-005, BW-POST-010 — all source-verified bypasses |
| MEDIUM | 3 | BW-POST-002, BW-POST-003, BW-POST-006, BW-POST-007 |
| LOW | 2 | BW-POST-008, BW-POST-009 |
| INFO | 0 | — |

All BYPASSED findings: SOURCE_VERIFIED.
UNRESOLVED findings (BW-POST-007): depend on unverified RLS state.

---

## 10. §9 Invariant Attack Map

| Invariant (Inferred) | Attack Attempted | Result | Finding |
|---|---|---|---|
| Actor must not react to own post | togglePostReactionController with self actorId | BYPASSED | BW-POST-004 |
| Actor must not self-gift roses | sendRoseController with self actorId + own postId | BYPASSED | BW-POST-005 |
| No raw UUIDs in public URLs | Inspect all notification linkPath constructions | BYPASSED | BW-POST-010 |
| Write mutations are actor-owned | Edit/delete with mismatched actorId | BLOCKED | — |
| Deleted posts reject all interactions | Toggle reaction/send rose on deleted post | BLOCKED (edit: PARTIAL) | BW-POST-009 |
| Comment create requires valid actorId | Null actorId to createRootComment | PARTIAL | BW-POST-008 |
| Mentions delete is ownership-gated | replacePostMentions with non-owned postId via editPost | PARTIAL | BW-POST-001 |

Note: All invariants are UNANCHORED (BEHAVIOR.md is PLACEHOLDER). These invariants are inferred from platform rules and source behavior. Formal §9 contract authoring is required before these can be treated as canonical.

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md status: PLACEHOLDER
All §9 invariants: UNANCHORED

This means:
1. There is no formal specification of what the post feature MUST NEVER do.
2. All attack invariants in this review are inferred from VCSM platform rules and source behavior.
3. The BEHAVIOR.md must be authored as a prerequisite for a full formal BW audit.
4. VEN-POST-007 (LOW) documents this gap — it remains OPEN.

Impact of PLACEHOLDER status: moderate. The source code contains meaningful DAL-level guards. The absence of a formal contract does not create new exploit surfaces, but it prevents authoritative invariant testing and blocks formal THOR sign-off on post security completeness.

---

## 12. THOR Impact

### Release Blockers (BYPASSED HIGH findings)

| Finding ID | Severity | Description | THOR Impact |
|---|---|---|---|
| BW-POST-001 | HIGH | replacePostMentions fires on non-owned posts — mentions erasure without ownership | RELEASE BLOCKER |
| BW-POST-004 | HIGH | Self-reaction allowed — actor can like/dislike own post, self-notify, inflate counts | RELEASE BLOCKER |
| BW-POST-005 | HIGH | Self-rose-gift allowed — unlimited qty per insert, unlimited replay, metric inflation | RELEASE BLOCKER |
| BW-POST-010 | HIGH | Raw UUID postIds in all post notification linkPaths — platform URL rule violation | RELEASE BLOCKER |

### Non-Blocking (MEDIUM/LOW)

| Finding ID | Severity | THOR Status |
|---|---|---|
| BW-POST-002 | MEDIUM | Non-blocking — DAL gate prevents actual exploit |
| BW-POST-003 | MEDIUM | Non-blocking — DAL gate prevents actual exploit |
| BW-POST-006 | MEDIUM | Non-blocking — metric integrity concern, not a security breach |
| BW-POST-007 | MEDIUM | Non-blocking pending RLS verification |
| BW-POST-008 | LOW | Non-blocking — DB constraint provides backstop |
| BW-POST-009 | LOW | Non-blocking — low impact |

Cross-reference with existing VENOM blockers:
- VEN-POST-001 (HIGH): insertPostComment orphaned — still OPEN, unaddressed
- VEN-POST-002 (HIGH): replacePostMentions race — BW-POST-001 confirms and extends this finding
- VEN-POST-003 (HIGH): self-reaction — BW-POST-004 confirms BYPASSED
- VEN-POST-004 (MEDIUM): sendRose no self-gifting/no qty cap — BW-POST-005 confirms and escalates

THOR gate is BLOCKED on all three VEN-POST-001/002/003 + now also BW-POST-010.

---

## 13. SPIDER-MAN Test Requirements

The following tests are required to guard the confirmed bypass findings:

### BW-POST-001 — Mentions Erasure Without Ownership
```
Test: editPost_doesNotEraseVictimPostMentions
- Call editPostController with actorId=ACTOR_A, postId=POST_OWNED_BY_ACTOR_B (where ACTOR_B != ACTOR_A)
- Assert: post_mentions rows for POST_OWNED_BY_ACTOR_B are unchanged
- Assert: data returned is null (post not found or not owned)
- Note: currently the mentions DELETE fires despite null data return — this test will FAIL
```

### BW-POST-004 — Self-Reaction Guard
```
Test: togglePostReaction_blocksSelfReaction
- Call togglePostReactionController({ postId, actorId: POST_OWNER_ID, reaction: "like" })
  where postId is owned by POST_OWNER_ID
- Assert: throws error or returns { ok: false } with "cannot react to own post"
- Note: currently will succeed — test will FAIL until guard added
```

### BW-POST-005 — Self-Rose-Gift Guard + Qty Cap
```
Test: sendRose_blocksSelfGift
- Call sendRoseController({ postId: OWN_POST_ID, actorId: SELF_ID, qty: 1 })
- Assert: throws error "cannot gift roses to own post"

Test: sendRose_enforcesQtyCap
- Call sendRoseController({ postId, actorId, qty: 9999 })
- Assert: throws error "qty exceeds maximum"

Test: sendRose_blocksUnlimitedReplay
- Call sendRoseController twice for same (postId, actorId)
- Assert: second call is rejected or rate-limited
```

### BW-POST-010 — Notification linkPath UUID Exposure
```
Test: postNotifications_useSlugBasedLinkPath
- Trigger reaction, rose, comment, comment_reply, comment_like notifications
- Assert: linkPath does not match /post/[uuid-pattern]/
- Assert: linkPath uses human-readable slug format
```

### BW-POST-006 — Self-Comment-Like Guard
```
Test: toggleCommentLike_blocksSelfLike
- Call toggleCommentLike({ commentId: COMMENT_OWNED_BY_ACTOR, actorId: ACTOR })
- Assert: returns { ok: false } or throws "cannot like own comment"
```

### BW-POST-007 — RLS Verification
```
Test: postReactions_insertRejectsWrongActorId (integration test)
- Attempt to INSERT into vc.post_reactions with actor_id != auth.uid()
- Assert: Supabase returns 403 / RLS violation
```

### BW-POST-008 — Null actorId to createRootComment
```
Test: createRootComment_withNullActorId_throws
- Call createRootComment({ postId: VALID_ID, actorId: null, content: "test" })
- Assert: throws error before DB call
```

### BW-POST-009 — Edit Deleted Post Prevention
```
Test: editPost_rejectsDeletedPost
- Soft-delete a post (set deleted_at)
- Call editPostController on same post with owner's actorId
- Assert: returns { ok: false, error: "Post is no longer available" }
```

---

Output: ZZnotforproduction/APPS/VCSM/features/post/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_post-adversarial-review.md
