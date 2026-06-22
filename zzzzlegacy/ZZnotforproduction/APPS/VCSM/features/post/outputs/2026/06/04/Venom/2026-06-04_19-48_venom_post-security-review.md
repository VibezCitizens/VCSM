# VENOM V2 Security Review — post
## Output Metadata

| Field | Value |
|---|---|
| Report Date | 2026-06-04 |
| Run Time | 19:48 UTC |
| Feature | post |
| Application | VCSM |
| Reviewer | VENOM V2 |
| Scanner Version | 1.1.0 |
| Source Root | apps/VCSM/src/features/post/ |
| Doc Root | ZZnotforproduction/APPS/VCSM/features/post/ |
| Finding Count | 7 |
| Severity Breakdown | 0 CRITICAL, 3 HIGH, 3 MEDIUM, 1 LOW |
| THOR Release Blocker | YES — VEN-POST-001, VEN-POST-002, VEN-POST-003 |

---

## Scanner Preflight Block

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                  | Generated At                 | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## Scanner Inputs Block

| Input Type | Count |
|---|---|
| Write Surfaces | 15 |
| RPCs | 1 |
| Security Paths | 16 |
| Write Execution Paths | 15 |
| RPC Execution Paths | 1 |
| Edge Functions | 0 |

All 16 security paths were flagged as `confidence: LOW` by the scanner — routes could not be resolved for any write surface. This is expected for a PWA feature where routes are not statically traceable via the scanner's AST walk. All write surfaces were verified by direct source inspection.

---

## Security Surface Inventory

| # | Table / RPC | Operation | DAL File | Controller | Auth Layer |
|---|---|---|---|---|---|
| 1 | `vc.comment_likes` | INSERT | commentLikes.dal.js | commentReactions.controller.js | actorId from useIdentity |
| 2 | `vc.comment_likes` | DELETE | commentLikes.dal.js | commentReactions.controller.js | actorId from useIdentity |
| 3 | `vc.post_comments` | INSERT | comments.dal.js | postComments.controller.js | actorId from useIdentity |
| 4 | `vc.post_comments` | UPDATE (edit) | comments.dal.js | editComment.controller.js | actorId owner gate .eq("actor_id", actorId) |
| 5 | `vc.post_comments` | UPDATE (soft-delete) | comments.dal.js | deleteComment.controller.js | actorId owner gate .eq("actor_id", actorId) |
| 6 | `vc.post_comments` | INSERT | postComments.read.dal.js (insertPostComment) | NONE — orphaned export | NONE |
| 7 | `vc.post_mentions` | DELETE | post.write.dal.js (replacePostMentions) | editPost.controller.js (indirect) | Scoped only by post_id — no ownership check |
| 8 | `vc.post_mentions` | INSERT | postMentions.write.dal.js | post.write.dal.js (replacePostMentions) | Called inside updatePostTextDAL; post ownership checked at posts table level |
| 9 | `vc.posts` | UPDATE (edit) | post.write.dal.js | editPost.controller.js | actorId owner gate .eq("actor_id", actorId) |
| 10 | `vc.posts` | UPDATE (soft-delete) | post.write.dal.js | deletePost.controller.js | actorId owner gate .eq("actor_id", actorId) |
| 11 | `vc.post_reactions` | INSERT | postReactions.write.dal.js | togglePostReaction.controller.js | actorId from useIdentity; no self-reaction check |
| 12 | `vc.post_reactions` | UPDATE | postReactions.write.dal.js | togglePostReaction.controller.js | actorId owner gate .eq("actor_id", actorId) |
| 13 | `vc.post_reactions` | DELETE | postReactions.write.dal.js | togglePostReaction.controller.js | actorId owner gate .eq("actor_id", actorId) |
| 14 | `vc.post_rose_gifts` | INSERT | roseGifts.actor.dal.js | sendRose.controller.js | actorId required; qty > 0; no upper bound |
| 15 | `vc.post_reactors_summary_one` | RPC (read) | postReactions.read.dal.js | getPostReactions.controller.js | None required (read-only summary) |

---

## Scanner Signals Block

- All 15 write surfaces confirmed as HIGH confidence in scanner (AST-extracted).
- 0 edge functions. No external API surfaces discovered.
- 1 RPC (`post_reactors_summary_one`) — read-only aggregation, no ownership required.
- All security paths flagged `confidence: LOW` because the scanner could not trace routes — this is expected for a React Router PWA; source-level verification substitutes.
- Notable: `insertPostComment` in `postComments.read.dal.js` is an INSERT export in a `.read.dal` file — anomalous naming. Scanner correctly flagged it as a write surface.

---

## Behavior Contract Status Block

| Item | Status |
|---|---|
| BEHAVIOR.md exists | YES — but PLACEHOLDER |
| §5 Security Rules | NOT PRESENT — placeholder only |
| §9 Must Never Happen | NOT PRESENT — placeholder only |
| BEH IDs extracted | NONE (contract not authored) |

**BEHAVIOR CONTRACT: MISSING_SECURITY_RULES**

The BEHAVIOR.md file at `ZZnotforproduction/APPS/VCSM/features/post/BEHAVIOR.md` exists but contains only:
```
Status: PLACEHOLDER
Notes: Behavior contract pending source review.
```

No §5 Security Rules and no §9 Must Never Happen invariants have been authored. This means:
- There is no contract to cross-check against.
- VENOM cannot formally verify contract enforcement.
- The security rules identified in this report are derived entirely from source inspection.

This is recorded as finding **VEN-POST-007** (LOW severity — missing documentation does not itself create an exploitable vulnerability, but removes the governance safety net).

---

## Trust Boundary Findings

---

### VEN-POST-001

```
VENOM SECURITY FINDING
- Finding ID: VEN-POST-001
- Location: apps/VCSM/src/features/post/commentcard/dal/postComments.read.dal.js:40-65
- Application Scope: VCSM
- Platform Surface: Supabase Table (vc.post_comments)
- Trust Boundary: Authenticated actor (client-supplied actorId)
- Boundary Violated: Write operation exposed in a .read.dal file with no owning controller
- Contract Violated: DAL layer naming contract (ARCHITECTURE.md); Adapter boundary rule
- Current behavior: insertPostComment() is exported from a .read.dal file alongside pure read
  functions. It accepts postId, actorId, content without any existence check, content length
  validation, or auth guard. No controller wires to it — it is an orphaned write export that
  any caller in the codebase could invoke directly, passing arbitrary actorId.
- Risk: An actor can insert a comment on behalf of any actorId by calling this DAL directly
  if any caller bypasses the controller layer. The client-supplied actorId is written directly
  to post_comments.actor_id with no server-side session binding. If RLS does not enforce
  auth.uid() = actor_id on INSERT, this is a comment spoofing vector.
- Severity: HIGH
- Exploitability: MEDIUM (requires RLS misconfiguration or a second DAL call path being added)
- Attack Preconditions: Authenticated session; direct import of DAL bypassing controller;
  RLS policy permissive on INSERT to post_comments.
- Blast Radius: Comment author identity can be spoofed; arbitrary comments attributed to
  other actors; notification spam to post owners.
- Identity Leak Type: Actor identity spoofing (comment attribution)
- Cache Trust Type: None
- RLS Dependency: REQUIRED — if vc.post_comments INSERT RLS enforces auth.uid() = actor_id,
  this is mitigated at DB level. Status: UNVERIFIED from source alone.
- Why it matters: Comments attributed to wrong actors breaks trust in the platform's social
  layer. Notification system would fire to post owners from a spoofed actor.
- Recommended mitigation: (1) Move insertPostComment() out of postComments.read.dal.js —
  it must live in comments.dal.js or a dedicated write DAL. (2) Wire it to a controller that
  validates the actorId matches the session identity. (3) Verify RLS INSERT policy on
  vc.post_comments enforces auth.uid() = actor_id. (4) Add DB ticket to verify and record
  RLS status.
- Rationale: Naming convention violation creates a false read-only signal for this file.
  Orphaned exports are a latent call-path risk. Defense-in-depth requires controller layer
  to bind actorId to session.
- Follow-up command: DB (verify RLS INSERT on vc.post_comments), SPIDER-MAN (regression test
  for comment insertion path)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Access Control, Identity and Access Management
```

---

### VEN-POST-002

```
VENOM SECURITY FINDING
- Finding ID: VEN-POST-002
- Location: apps/VCSM/src/features/post/postcard/dal/post.write.dal.js:52-66
- Application Scope: VCSM
- Platform Surface: Supabase Table (vc.post_mentions)
- Trust Boundary: Authenticated actor (write triggered by editPost flow)
- Boundary Violated: Scoped DELETE with no ownership verification at the delete step
- Contract Violated: Ownership verification contract; least-privilege principle
- Current behavior: replacePostMentions(postId, actorIds) is a private function called inside
  updatePostTextDAL. The DELETE step at line 57-61 deletes ALL rows from vc.post_mentions
  WHERE post_id = postId. The ownership gate (.eq("actor_id", actorId)) is applied at the
  vc.posts UPDATE step, but if the posts UPDATE returns no data (race or RLS denial), the
  function still proceeds to mention processing in a best-effort try/catch block (lines 91-99).
  If the posts update silently fails (returns {data: null, error: null}), the caller returns
  ok: false but mention deletion may have already executed.
- Risk: If the posts UPDATE fails silently after the row is deleted from post_mentions
  (race condition or RLS timing), the mention edges for a post may be wiped even though
  the edit was rejected. More critically: the DELETE of post_mentions is scoped only by
  post_id — if replacePostMentions were ever called directly (not through updatePostTextDAL),
  any actor could wipe another post's mention edges without an ownership check at that step.
- Severity: HIGH
- Exploitability: LOW (currently only reachable via updatePostTextDAL which does own the
  post ownership gate; direct call requires developer error)
- Attack Preconditions: Either a race condition causing posts UPDATE to fail after returning
  or a future developer calling replacePostMentions directly with an arbitrary postId.
- Blast Radius: Mention notifications cleared for a post owned by another actor;
  @ mention links broken in post content.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: ASSUMED — post_mentions DELETE likely has RLS, but the function itself
  does not verify ownership before deleting. Status: UNVERIFIED.
- Why it matters: Mention edges drive notification delivery. Clearing them for a post you
  do not own silently breaks the notification graph.
- Recommended mitigation: (1) Add .eq("actor_id", actorId) to the replacePostMentions
  DELETE step (add actorId as a parameter to the function). (2) Move mention replacement
  inside the transaction boundary of the posts UPDATE, or check `data != null` before
  proceeding to mention logic. (3) Verify RLS on vc.post_mentions DELETE.
- Rationale: The ownership guard is at the wrong layer — it must be co-located with the
  DELETE, not only at the parent UPDATE.
- Follow-up command: DB (verify RLS on vc.post_mentions DELETE), ELEKTRA (trace full
  mention replacement path for race window)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Access Control
```

---

### VEN-POST-003

```
VENOM SECURITY FINDING
- Finding ID: VEN-POST-003
- Location: apps/VCSM/src/features/post/postcard/dal/postReactions.write.dal.js:12-48
            apps/VCSM/src/features/post/postcard/controller/togglePostReaction.controller.js:43-87
- Application Scope: VCSM
- Platform Surface: Supabase Table (vc.post_reactions)
- Trust Boundary: Authenticated actor (actorId from useIdentity)
- Boundary Violated: No prevention of actor reacting to their own post
- Contract Violated: Social integrity contract (self-amplification prevention)
- Current behavior: togglePostReactionController() validates postId, actorId, and reaction
  type. It checks the post exists. It does NOT check whether actorId === post.actor_id
  (the post owner). An actor can react to their own post (like/dislike), incrementing their
  own reaction counts and triggering a notification to themselves.
  - controller: apps/VCSM/src/features/post/postcard/controller/togglePostReaction.controller.js lines 43-87
  - The notification (line 93-101) fires when `created === true`, sending a social.post.like
    event back to the post owner — which is the actor themselves in the self-reaction case.
- Risk: Actors can inflate their own like/dislike counts by reacting to their own posts.
  Self-reaction also sends a notification event to the post owner (self-notification).
  In aggregate this allows manipulation of social proof metrics.
- Severity: HIGH
- Exploitability: HIGH (zero preconditions beyond being authenticated; UI does not block it)
- Attack Preconditions: Authenticated session. Actor views their own post and submits a
  like/dislike reaction.
- Blast Radius: Social proof inflation; misleading engagement metrics; self-notification spam.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE — this is a business logic gap, not an RLS boundary issue.
- Why it matters: Self-reactions undermine the integrity of the engagement metric system.
  If VCSM surfaces reaction counts in ranking/discovery algorithms, self-inflation directly
  distorts content ranking.
- Recommended mitigation: Add a guard in togglePostReactionController before the write:
  `if (actorId === post.actor_id) throw new Error("Cannot react to your own post");`
  This requires fetching post.actor_id before the mutation — checkPostExistsDAL returns a
  boolean; either extend it to return the actor_id or use the fetchPostByIdDAL result.
  Alternatively enforce via DB constraint or RLS CHECK on vc.post_reactions INSERT.
- Rationale: Standard social platform security invariant — self-reactions are universally
  disallowed. The notification path amplifies the problem by spamming the actor with
  their own action.
- Follow-up command: SPIDER-MAN (regression test: self-reaction must be rejected),
  DB (add CHECK constraint or RLS CHECK on post_reactions INSERT)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering
```

---

### VEN-POST-004

```
VENOM SECURITY FINDING
- Finding ID: VEN-POST-004
- Location: apps/VCSM/src/features/post/postcard/controller/sendRose.controller.js:30-42
            apps/VCSM/src/features/post/postcard/dal/roseGifts.actor.dal.js:31-44
- Application Scope: VCSM
- Platform Surface: Supabase Table (vc.post_rose_gifts)
- Trust Boundary: Authenticated actor (actorId from useIdentity)
- Boundary Violated: No upper bound on qty per insert; no per-actor rate limiting;
  no self-gifting prevention
- Contract Violated: Input validation contract; social integrity contract
- Current behavior: sendRoseController validates qty > 0 but imposes no maximum value.
  An actor can pass qty = 999999 in a single call. The hook (usePostReactions) calls
  sendRose(qty = 1) by default, but qty is passed from the caller and the DAL/controller
  do not cap it. Additionally, there is no check preventing an actor from sending roses to
  their own post (analogous to VEN-POST-003). Multiple sequential calls with default qty=1
  are also unthrottled.
- Risk: Metric manipulation: an actor can send an arbitrarily large qty of roses in a
  single request, or send roses to their own post. Rose counts feed into the
  post_reactors_summary_one RPC aggregation and are displayed in the ReactionBar component.
  This inflates rose counts on the actor's own posts and can corrupt the aggregated metrics
  served to all viewers.
- Severity: MEDIUM
- Exploitability: MEDIUM (requires client-side modification to set qty > 1; self-gifting
  requires no modification)
- Attack Preconditions: Authenticated session; for unbounded qty: client must call
  sendRoseController with a custom qty value (API call is client-initiated).
- Blast Radius: Rose count inflation on posts; misleading social proof displayed to all
  viewers; notification spam to the post owner.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE — business logic gap.
- Why it matters: Rose counts are a visible social proof indicator in the ReactionBar.
  Unbounded qty allows a single DB row to skew the metric significantly.
- Recommended mitigation: (1) Add MAX_QTY constant (e.g. 50) in sendRoseController and
  throw if qty > MAX_QTY. (2) Add self-gifting guard: fetch post.actor_id and reject if
  actorId === post.actor_id. (3) Consider a DB-level CHECK constraint: qty > 0 AND qty <= 50.
- Rationale: Defense in depth — the controller is the right layer to enforce business
  invariants before they reach the DB.
- Follow-up command: DB (add CHECK on post_rose_gifts.qty), SPIDER-MAN (test self-rose
  and qty > max cases)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering
```

---

### VEN-POST-005

```
VENOM SECURITY FINDING
- Finding ID: VEN-POST-005
- Location: apps/VCSM/src/features/post/postcard/hooks/usePostReactions.js:55,85,110
            apps/VCSM/src/features/post/commentcard/hooks/useCommentThread.js:67,102,142
            apps/VCSM/src/features/post/postcard/hooks/usePostDetailEditing.js:64
            apps/VCSM/src/features/post/postcard/hooks/usePostDetailReporting.js:76,96,103
            apps/VCSM/src/features/post/commentcard/hooks/useCommentCard.js:50
            apps/VCSM/src/features/post/commentcard/hooks/usePostCommentCount.js:19
- Application Scope: VCSM
- Platform Surface: PWA (browser console)
- Trust Boundary: Browser runtime / any viewer with DevTools open
- Boundary Violated: Debug output exposed to production users
- Contract Violated: VCSM Debug Logging Rules (memory: feedback_debug_logging.md)
  — "No console.log; debug output must render on screen and be dev-only (never production)"
- Current behavior: Multiple hooks emit console.error() and console.warn() without
  import.meta.env.DEV guards. Examples:
    - usePostReactions.js:55: console.error("[usePostReactions] load failed:", err)
    - usePostReactions.js:85: console.error("[usePostReactions] toggle failed:", err)
    - usePostReactions.js:110: console.error("[usePostReactions] sendRose failed:", err)
    - useCommentThread.js:67,102,142: console.error on load/addComment/addReply failures
    - usePostDetailEditing.js:64: console.error on delete comment failure
    - useCommentCard.js:50: console.error on toggleLike failure
  By contrast, usePostDetailPost.js:51 is correctly DEV-gated:
    `if (import.meta.env.DEV) console.error("[PostDetail] load post failed:", err)`
- Risk: Error messages emitted to console in production may leak internal state, DB error
  text (including schema names, column names, RLS policy names, constraint violations),
  and stack traces to any user with browser DevTools open. DB errors from Supabase often
  include schema names (e.g. "vc"), table names, and constraint names.
- Severity: MEDIUM
- Exploitability: LOW (requires DevTools access; no server-side exposure)
- Attack Preconditions: Authenticated user; browser DevTools access.
- Blast Radius: Schema reconnaissance — schema names, table names, column names, constraint
  names visible to any authenticated user who opens DevTools.
- Identity Leak Type: None (no PII leaked, but schema topology exposed)
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Console output in production violates the platform's debug logging contract
  and provides reconnaissance data for more targeted attacks.
- Recommended mitigation: Wrap all console.error/console.warn calls in these hooks with
  `if (import.meta.env?.DEV) { ... }` guards, following the pattern already established in
  usePostDetailPost.js.
- Rationale: Consistent with the platform's established pattern and the CLAUDE memory rule.
- Follow-up command: SPIDER-MAN (verify no regression in error surface after gating)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Operations
```

---

### VEN-POST-006

```
VENOM SECURITY FINDING
- Finding ID: VEN-POST-006
- Location: apps/VCSM/src/features/post/commentcard/dal/comments.dal.js:4-31
            apps/VCSM/src/features/post/commentcard/controller/postComments.controller.js:50-79
- Application Scope: VCSM
- Platform Surface: Supabase Table (vc.post_comments)
- Trust Boundary: Authenticated actor (actorId from useIdentity)
- Boundary Violated: No server-side content length limit on comment content
- Contract Violated: Input validation contract
- Current behavior: createComment() in comments.dal.js inserts content directly with no
  length validation. The controller (postComments.controller.js) does not check content
  length. The hook (useCommentThread.js:88) calls content.trim() but imposes no character
  limit. An actor can POST arbitrarily long comment content to vc.post_comments.content.
  No MAX_CONTENT_LENGTH constant or DB-level CHECK constraint is visible in source.
- Risk: Unbounded comment content allows storage amplification attacks — large payloads
  consume DB storage beyond intent, degrade query performance for comment thread loading,
  and potentially affect the UI (very long strings in text rendering).
- Severity: MEDIUM
- Exploitability: MEDIUM (requires client to bypass default UI limit; API is directly
  callable from the browser with modified request)
- Attack Preconditions: Authenticated actor; ability to call createComment via the PWA
  with a large content payload.
- Blast Radius: DB storage amplification; degraded comment thread load performance;
  potentially all viewers of the post's comment thread.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE — input validation gap.
- Why it matters: Content length limits are standard input validation. Without them,
  a single actor can degrade the experience for all viewers of a post.
- Recommended mitigation: (1) Add content length check in postComments.controller.js:
  `if (content.length > 2000) throw new Error("Comment exceeds maximum length")`.
  (2) Add DB-level CHECK: content IS NOT NULL AND length(content) <= 2000.
- Rationale: Defense in depth — controller enforces the business limit; DB enforces the
  hard cap.
- Follow-up command: DB (add CHECK constraint on post_comments.content length)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering
```

---

### VEN-POST-007

```
VENOM SECURITY FINDING
- Finding ID: VEN-POST-007
- Location: ZZnotforproduction/APPS/VCSM/features/post/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Documentation / Governance
- Trust Boundary: Engineering governance layer
- Boundary Violated: BEHAVIOR.md is a PLACEHOLDER — §5 Security Rules and §9 Must Never
  Happen invariants are absent
- Contract Violated: VCSM contributor contract; BEHAVIOR.md governance contract
- Current behavior: BEHAVIOR.md file contains only "Status: PLACEHOLDER / Notes: Behavior
  contract pending source review." No security rules, no must-never-happen invariants.
- Risk: Without a security contract, future engineers have no authoritative reference for
  what the post feature is prohibited from doing. Security invariants discovered in this VENOM
  pass (e.g. no self-reactions, no unbounded rose qty, comment ownership gates) are not
  codified. SPIDER-MAN and ELEKTRA have no BEH IDs to test against.
- Severity: LOW
- Exploitability: LOW (documentation gap, not a runtime exploitable bug)
- Attack Preconditions: N/A — governance finding.
- Blast Radius: Future regressions go undetected; security invariants can be eroded in
  subsequent PRs without a contract to enforce against.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The BEHAVIOR.md contract is the authoritative source of security rules for
  the feature. Its absence means VENOM, SPIDER-MAN, and ELEKTRA all operate without a
  formal baseline to test against.
- Recommended mitigation: Author BEHAVIOR.md §5 Security Rules and §9 Must Never Happen
  for the post feature. Minimum invariants to codify:
    - BEH-POST-SEC-001: Actor may not react to their own post
    - BEH-POST-SEC-002: Actor may not send roses to their own post
    - BEH-POST-SEC-003: Comment actorId must match the authenticated session actor
    - BEH-POST-SEC-004: Rose qty must be > 0 and <= MAX_QTY
    - BEH-POST-SEC-005: Post and comment edits/deletes must be owner-only
- Rationale: Governance gap must be closed before this feature can be considered THOR-ready.
- Follow-up command: CAPTAIN (capture BEHAVIOR.md authoring as next-session task)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Software Development Security
```

---

## Source Verification Summary

| Surface | File Read | Controller Read | Auth Layer | Verdict |
|---|---|---|---|---|
| comment_likes INSERT (likeComment) | YES | commentReactions.controller.js | actorId from identity — no session binding | SCANNER_LEAD: RLS assumed |
| comment_likes DELETE (unlikeComment) | YES | commentReactions.controller.js | actorId + commentId match gate | VERIFIED_SAFE |
| post_comments INSERT (createComment) | YES | postComments.controller.js | actorId from identity; postExists checked | VERIFIED_SAFE (controller path) |
| post_comments INSERT (insertPostComment) | YES | NONE — orphaned | NONE | FINDING: VEN-POST-001 |
| post_comments UPDATE (updateCommentContentDAL) | YES | editComment.controller.js | .eq("actor_id", actorId) owner gate | VERIFIED_SAFE |
| post_comments UPDATE (softDeleteCommentDAL) | YES | deleteComment.controller.js | .eq("actor_id", actorId) owner gate | VERIFIED_SAFE |
| post_mentions DELETE (replacePostMentions) | YES | editPost.controller.js (indirect) | No ownership at delete step | FINDING: VEN-POST-002 |
| post_mentions INSERT (insertPostMentionsDAL) | YES | post.write.dal.js | Called via replacePostMentions only | VERIFIED_SAFE (chained) |
| posts UPDATE (updatePostTextDAL) | YES | editPost.controller.js | .eq("actor_id", actorId) owner gate | VERIFIED_SAFE |
| posts UPDATE (softDeletePostDAL) | YES | deletePost.controller.js | .eq("actor_id", actorId) owner gate | VERIFIED_SAFE |
| post_reactions INSERT (insertReactionDAL) | YES | togglePostReaction.controller.js | actorId required; no self-check | FINDING: VEN-POST-003 |
| post_reactions UPDATE (updateReactionDAL) | YES | togglePostReaction.controller.js | .eq("actor_id", actorId) | VERIFIED_SAFE |
| post_reactions DELETE (deleteReactionDAL) | YES | togglePostReaction.controller.js | .eq("actor_id", actorId) | VERIFIED_SAFE |
| post_rose_gifts INSERT (insertRoseGiftDAL) | YES | sendRose.controller.js | actorId required; qty > 0; no max/self-check | FINDING: VEN-POST-004 |
| post_reactors_summary_one RPC | YES | getPostReactions.controller.js | Read-only; postId required | VERIFIED_SAFE |

---

## Confidence Summary

| Category | Assessment |
|---|---|
| Source Coverage | HIGH — all 15 write surfaces and 1 RPC DAL files read in full |
| Controller Coverage | HIGH — all associated controllers read in full |
| Hook Coverage | HIGH — key hooks (usePostReactions, useCommentThread, usePostDetailEditing) read |
| Screen Coverage | MEDIUM — PostDetail.view.jsx and EditPost.jsx read; PostFeed.screen.jsx partially |
| RLS Verification | LOW — no DB-level RLS policy files read; RLS status is UNVERIFIED or ASSUMED for all surfaces |
| Route Tracing | MEDIUM — routes not statically traceable by scanner; confirmed via hook→controller→DAL call chains |
| Overall Confidence | HIGH for application-layer findings; MEDIUM for DB-layer (RLS) claims |

---

## THOR Impact

| Finding | Severity | THOR Blocker? | Reason |
|---|---|---|---|
| VEN-POST-001 | HIGH | YES | Orphaned INSERT in read DAL; no controller path; potential comment spoofing |
| VEN-POST-002 | HIGH | YES | Ownership-unguarded DELETE on post_mentions; race window in edit flow |
| VEN-POST-003 | HIGH | YES | No self-reaction prevention; metric integrity violation; self-notification |
| VEN-POST-004 | MEDIUM | NO | Unbounded rose qty; self-gifting; hardening required but not blocking |
| VEN-POST-005 | MEDIUM | NO | Console.error not DEV-gated; schema reconnaissance risk; polish before release |
| VEN-POST-006 | MEDIUM | NO | No comment content length limit; storage amplification risk |
| VEN-POST-007 | LOW | NO | BEHAVIOR.md placeholder; governance gap |

**THOR Release Blocker: YES — VEN-POST-001, VEN-POST-002, VEN-POST-003 must be resolved before this feature ships.**

---

## Required Follow-Up Commands

| Command | Scope | Reason |
|---|---|---|
| DB | Verify RLS INSERT policy on vc.post_comments (VEN-POST-001) | Confirm auth.uid() = actor_id enforced at DB |
| DB | Verify RLS DELETE policy on vc.post_mentions (VEN-POST-002) | Confirm ownership enforced at DB level |
| DB | Add CHECK constraint vc.post_reactions: no self-reaction (VEN-POST-003) | Enforce business invariant at DB layer |
| DB | Add CHECK vc.post_rose_gifts.qty <= 50 (VEN-POST-004) | Hard cap on rose qty per insert |
| DB | Add CHECK vc.post_comments.content length <= 2000 (VEN-POST-006) | Input validation at DB layer |
| SPIDER-MAN | Regression test: insertPostComment orphaned path never called directly | VEN-POST-001 |
| SPIDER-MAN | Regression test: self-reaction rejected (actorId === postActorId) | VEN-POST-003 |
| SPIDER-MAN | Regression test: rose qty > MAX_QTY rejected; self-rose rejected | VEN-POST-004 |
| ELEKTRA | Trace full mention replacement flow for race condition window | VEN-POST-002 |
| CAPTAIN | Capture BEHAVIOR.md authoring as next-session task | VEN-POST-007 |

---

## MITIGATION PLAN

| Finding ID | Severity | THOR Blocker | File(s) to Change | Mitigation Action | Effort |
|---|---|---|---|---|---|
| VEN-POST-001 | HIGH | YES | postComments.read.dal.js | Move insertPostComment to comments.dal.js or a dedicated write DAL; remove from read file | Low |
| VEN-POST-001 | HIGH | YES | postComments.controller.js | Wire insertPostComment through a controller with session-bound actorId validation | Medium |
| VEN-POST-002 | HIGH | YES | post.write.dal.js:52-66 | Add actorId parameter to replacePostMentions; add .eq("actor_id", actorId) to the DELETE | Low |
| VEN-POST-002 | HIGH | YES | post.write.dal.js:72-102 | Move mention replacement inside the success branch (check data != null before proceeding) | Low |
| VEN-POST-003 | HIGH | YES | togglePostReaction.controller.js | Add guard: if actorId === post.actor_id throw — fetch actor_id from checkPostExistsDAL or post read | Low |
| VEN-POST-004 | MEDIUM | NO | sendRose.controller.js | Add MAX_QTY = 50 constant; throw if qty > MAX_QTY; add self-gifting guard | Low |
| VEN-POST-004 | MEDIUM | NO | roseGifts.actor.dal.js | Accept MAX_QTY validation from controller; no change needed at DAL level | None |
| VEN-POST-005 | MEDIUM | NO | usePostReactions.js, useCommentThread.js, usePostDetailEditing.js, useCommentCard.js | Wrap all console.error/warn in `if (import.meta.env?.DEV)` guards | Low |
| VEN-POST-006 | MEDIUM | NO | postComments.controller.js | Add content.length > 2000 check before calling createComment | Low |
| VEN-POST-007 | LOW | NO | BEHAVIOR.md | Author §5 Security Rules and §9 Must Never Happen with the invariants discovered in this review | Medium |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings |
|---|---|
| Software Development Security | VEN-POST-001, VEN-POST-002, VEN-POST-003, VEN-POST-004, VEN-POST-005, VEN-POST-006, VEN-POST-007 |
| Access Control | VEN-POST-001, VEN-POST-002 |
| Identity and Access Management | VEN-POST-001 |
| Security Architecture and Engineering | VEN-POST-003, VEN-POST-004, VEN-POST-006 |
| Security Operations | VEN-POST-005 |
| Security and Risk Management | VEN-POST-007 |

**Primary domain: Software Development Security (all 7 findings). No cryptographic, network, or asset security findings. All findings are application-layer input validation, authorization logic, or governance gaps.**
