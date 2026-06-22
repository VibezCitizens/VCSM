# VENOM Security Audit — Post System Deep Review

**Date:** 2026-05-10  
**Scope:** Full post/reaction/comment/visibility pipeline  
**Application Scope:** VCSM  
**Reviewed by:** VENOM  

Documentation reviewed: `/zNOTFORPRODUCTION/_CANONICAL/logan/marvel/post-system/`  
Source paths inspected: `apps/VCSM/src/features/post/`, `apps/VCSM/src/features/feed/`, `apps/VCSM/src/features/profiles/`

---

## VENOM TARGET

```
Feature / Route / Engine: Post system — create, edit, delete, react, comment, feed pipeline
Application Scope: VCSM
Reason for review: Full post system audit after multi-file performance refactor (2026-05-10)
Primary trust boundary: actorId authorization on all write paths; client-supplied input into post mutations
```

---

## SECURITY SURFACE

```
Entry point: createPost, togglePostReaction, sendRose, createRootComment, createReplyComment, deleteComment, toggleCommentLike, editPost, deletePost
Auth source: useIdentity() → actorId (Supabase session)
Authorization layer: Controller-level (checkPostExistsDAL guard added 2026-05-10)
Identity surface: actorId — mostly correct; gaps on mention input and debug controller
Sensitive objects: post content, actor identity, mention actorIds, deletion metadata, debug panels
```

---

## TRUST BOUNDARY TRACE

```
Client input: post text, media URLs, resolved mention actorIds, reaction type, rose qty, comment text
Validated at: controllers (partially — no enum/length/URL validation on several fields)
Identity resolved at: controllers via actorId param (caller-supplied, but Supabase JWT enforced at session level)
Authorization enforced at: controller (owner gate on edit/delete post/comment; pre-write checkPostExistsDAL)
Data returned to: feed pipeline → React state → UI render
```

---

## FINDINGS

---

### FINDING-01

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/post/commentcard/dal/comments.dal.js (lines 92–105)
- Application Scope: VCSM
- Current behavior: Exports deleteComment(commentId) — a hard-delete function with no actorId parameter
  and no .eq("actor_id", ...) ownership gate. Anyone with DB access via PostgREST can call this directly
  without an actor check. The function is not imported by deleteComment.controller.js (which correctly
  uses softDeleteCommentDAL), but it IS exported — making it a reachable footgun for any future caller
  or accidental import.
- Risk: Ownerless hard comment delete. No actor ownership verification. If ever called, any authenticated
  actor can delete any comment. A future developer importing this instead of softDeleteCommentDAL would
  silently bypass all ownership enforcement.
- Severity: HIGH
- Why it matters: Owner verification is the only comment delete guard at the app layer. The DB RLS
  INSERT policies do not cover DELETE authorization on comments. This function would allow any
  authenticated user to delete any comment without being the owner.
- Recommended mitigation: Remove the deleteComment export entirely from comments.dal.js. It is not
  used by any controller. softDeleteCommentDAL (which requires actorId and applies .eq("actor_id", actorId))
  is the correct path. Keeping an ownerless delete export alongside an owner-gated soft-delete is a
  permanent footgun risk.
- Rationale: Dead exports that violate security invariants are not safe to keep. The function must be
  removed, not just documented.
- Follow-up command: BUGSBUNNY (confirm zero imports), then Wolverine to delete
```

---

### FINDING-02

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/post/postcard/controller/createPost.controller.js (lines 40–46)
- Application Scope: VCSM
- Current behavior: mentionedActorIdsFromUI is built directly from input.mentionsResolved[].actorId —
  a client-supplied array. These IDs are inserted into vc.post_mentions and used to trigger
  publishVcsmNotification() calls without any DB validation that these actorIds exist, are non-deleted,
  or correspond to real actors.
- Risk: Any authenticated user can supply arbitrary actorIds in mentionsResolved and force mention
  notifications to be sent to those IDs. Notification spam vector. Could also be used to probe
  for valid actorIds if notification delivery can be observed.
- Severity: HIGH
- Why it matters: Notifications (social.post.mention) are sent per resolved actorId. No validation
  means an attacker can enumerate or spam arbitrary actor IDs through the mention flow. The post
  mention row is also written to vc.post_mentions, persisting the fabricated mention.
- Recommended mitigation: After receiving input.mentionsResolved, validate each actorId via a
  batch DB lookup (e.g., SELECT id FROM vc.actors WHERE id IN (...) AND is_deleted = false).
  Only use the DB-confirmed set for insertion and notification dispatch. Discard any IDs not
  present in the DB.
- Rationale: Client-supplied identity values must never be trusted for write or notification paths.
  This is the core actor-based identity contract for VCSM.
- Follow-up command: Wolverine (add DB-side mention validation to createPost controller)
```

---

### FINDING-03

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js
- Application Scope: VCSM
- Current behavior: readFeedPostsPage selects deleted_by_actor_id as part of the feed post row shape.
  This field is sensitive deletion metadata — it records which actor performed the soft delete.
  It flows through the full feed pipeline (normalizeFeedRows → UI) as part of the returned row shape.
- Risk: Sensitive internal moderation/deletion metadata is transmitted to the client on every feed page
  load. deleted_by_actor_id may identify a moderator or admin who removed a post — exposing the
  identity of moderation actors to all feed viewers.
- Severity: MEDIUM
- Why it matters: Deletion actor identity is an internal platform field. Exposing it in the feed
  pipeline leaks who performed moderation actions. This is particularly sensitive if staff/admin actors
  perform the deletions.
- Recommended mitigation: Remove deleted_by_actor_id from the .select() column list in
  readFeedPostsPage. If this field is needed for any specific UI surface, it should be fetched
  on demand in a privileged context, not included in the public feed batch.
- Rationale: The principle of minimal data exposure — only select fields that are used by the client.
- Follow-up command: Wolverine (remove column from select list)
```

---

### FINDING-04

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/post/postcard/controller/getDebugPrivacyRows.controller.js
- Application Scope: VCSM
- Current behavior: Three separate issues in this controller:
  (1) readOwnedActorIdsByUserIdDAL(actorId) is called with an actorId (actor UUID) where the DAL
      expects a userId (user UUID). These are different identity types — passing actorId to a function
      that does WHERE user_id = $1 will silently return empty results or wrong rows.
  (2) isOwner is computed as actor?.profile_id === actorId — comparing a profile UUID to an actor UUID.
      These are different namespaces. This comparison always evaluates to false.
  (3) The controller returns profile_id and vport_id in its response payload. These are internal
      surrogate keys that must never be exposed through public hook/controller surfaces per the
      VCSM identity contract.
- Risk: (1) Broken authorization logic — isOwner is always false, meaning the ownership gate is
  non-functional. (2) Identity contract violation — profile_id and vport_id exposed in response.
  (3) Wrong ID type passed to DAL — silent failure masking a data access bug.
- Severity: MEDIUM
- Why it matters: Debug controllers often have weaker review scrutiny. A broken isOwner check here
  means any actor can call this controller and receive another actor's privacy rows. The exposed
  profile_id and vport_id violate the canonical identity surface contract.
- Recommended mitigation: (1) Resolve the correct userId from the actor before calling the DAL —
  do not pass actorId where userId is expected. (2) Fix isOwner to compare against the correct
  identity field. (3) Remove profile_id and vport_id from the response — return only actorId and kind.
  (4) Consider whether this debug controller should exist in production at all — scope it strictly
  to DEV mode with import.meta.env.DEV guard at the controller level, not just the UI.
- Rationale: Internal surrogate keys must never be exposed through controller surfaces. The debug
  label does not exempt a controller from identity contract compliance.
- Follow-up command: Wolverine (fix identity field types, fix isOwner, remove internal ID exposure)
```

---

### FINDING-05

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/post/postcard/controller/createPost.controller.js
- Application Scope: VCSM
- Current behavior: post_type is set from input.mode without any enum validation. Valid values
  are expected to be a fixed set (e.g., 'standard', 'photo', etc.) but no whitelist check exists.
  Any string value passed in input.mode is inserted directly into vc.posts.post_type.
- Risk: An authenticated user can insert arbitrary post_type values into vc.posts. If any downstream
  code branches on post_type, unexpected values could trigger unintended code paths or corrupt
  query assumptions.
- Severity: MEDIUM
- Why it matters: Enum fields should be validated before DB insertion. DB-level CHECK constraints
  may or may not exist — if they do not, arbitrary strings persist. Even if DB constraints catch it,
  the app should validate before throwing a DB error.
- Recommended mitigation: Define a VALID_POST_TYPES set (e.g., new Set(['standard', 'photo', 'video']))
  and throw early if input.mode is not in the set. Mirror whatever CHECK constraint exists or should
  exist at the DB level.
- Rationale: Input validation at the controller boundary prevents injection of unexpected enum values
  that could affect downstream branching, queries, or display logic.
- Follow-up command: Wolverine (add enum guard to createPost controller)
```

---

### FINDING-06

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/post/postcard/controller/createPost.controller.js (media_url handling)
- Application Scope: VCSM
- Current behavior: input.mediaUrls is mapped directly into vc.post_media rows without URL validation.
  There is no check that each URL is a known Supabase Storage URL or any trusted domain. Any string
  value that passes array iteration is stored as a media_url.
- Risk: Stored XSS vector if media URLs are rendered via <img src={media_url}> or similar without
  sanitization. SSRF vector if any server-side process fetches media_url for thumbnailing or processing.
  An attacker can also pollute the posts table with arbitrary external URLs.
- Severity: MEDIUM
- Why it matters: URLs from client input are never inherently trustworthy. If rendered in an img tag,
  a javascript: URL would execute. If used in a server-side fetch, an attacker could trigger SSRF.
  Supabase Storage URLs should follow a known prefix pattern that can be validated.
- Recommended mitigation: Validate each media URL against an allowlist of trusted URL prefixes
  (e.g., the Supabase project storage URL prefix). Reject any URL that does not match. This is a
  one-line guard: if (!url.startsWith(TRUSTED_STORAGE_BASE)) throw.
- Rationale: Storing unvalidated external URLs creates a persistent XSS/SSRF surface in all future
  renders and processing pipelines. Media URLs should always originate from the platform's own storage.
- Follow-up command: Wolverine (add URL prefix validation to createPost controller)
```

---

### FINDING-07

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/post/commentcard/controller/commentReactions.controller.js
  (toggleCommentLike function)
- Application Scope: VCSM
- Current behavior: toggleCommentLike({ commentId, actorId }) performs no check that the target
  comment exists or is not soft-deleted before inserting/deleting a like row. The pre-write
  checkPostExistsDAL guard was added to reaction/rose/comment creation controllers on 2026-05-10
  but toggleCommentLike was not updated.
- Risk: An actor can like a soft-deleted comment. The like row is inserted into vc.comment_likes
  referencing a deleted comment. Notification routing (readCommentActorAndPostIdDAL) runs against
  the deleted comment's owner, potentially triggering notifications for deleted content.
- Severity: MEDIUM
- Why it matters: Inconsistent soft-delete guards create a category of mutation paths that bypass
  the delete semantics. The DB-level INSERT policies on comment_likes do not include a deleted_at
  IS NULL guard on the parent comment.
- Recommended mitigation: Add a soft-delete existence check before likeComment — analogous to
  checkPostExistsDAL but for comments. A minimal checkCommentExistsDAL(commentId) that verifies
  deleted_at IS NULL should gate the write.
- Rationale: All write paths into deleted content must be uniformly blocked. Partial coverage
  creates exploitable edge cases.
- Follow-up command: Wolverine (add comment existence guard to toggleCommentLike)
```

---

### FINDING-08

```
VENOM SECURITY FINDING
- Location: post/postcard/dal/postReactions.write.dal.js, post/commentcard/dal/comments.dal.js,
  post/commentcard/controller/editComment.controller.js, post/postcard/controller/editPost.controller.js
- Application Scope: VCSM
- Current behavior: No content length validation exists on post text, comment text, or reaction
  content at the controller or DAL level. Input is passed directly to Supabase insert/update
  without a max-length check.
- Risk: Unbounded string writes to vc.posts.text and vc.post_comments.content. Very large payloads
  cause slow DB writes and large row sizes. If DB TEXT columns have no CHECK constraint or column
  length limit, multi-megabyte strings can be inserted. This also affects mention extraction —
  extractMentionHandles runs regex over the full text string, which is unbounded.
- Severity: LOW
- Why it matters: Content length limits are a standard input boundary. Their absence allows storage
  abuse and can cause unexpected behavior in text-processing functions downstream.
- Recommended mitigation: Add a MAX_POST_TEXT_LENGTH constant (e.g., 2000 chars) and MAX_COMMENT_LENGTH
  (e.g., 1000 chars). Throw before DB write if exceeded. Mirror with DB CHECK constraints (Carnage scope).
- Rationale: Input validation at system boundaries prevents storage abuse and protects text-processing
  pipelines from pathological inputs.
- Follow-up command: Wolverine (add length guards), Carnage (add DB CHECK constraints)
```

---

### FINDING-09

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/post/commentcard/dal/postComments.read.dal.js
- Application Scope: VCSM
- Current behavior: insertPostComment is a write function (INSERT into vc.post_comments) exported
  from a file named postComments.read.dal.js. The DAL naming contract separates read and write
  concerns into separate files. Having a write operation in a read DAL file violates layer
  responsibility and makes authorization auditing harder.
- Risk: LOW security risk but HIGH audit confusion risk. Security reviewers scanning *.read.dal.js
  files for write surfaces will miss this insert. It also creates a path where write logic could
  accumulate in the read DAL over time, obscuring the attack surface.
- Severity: LOW
- Why it matters: File naming is part of the security model — it determines which files an auditor
  scans for write surface risks. Misplaced writes undermine that model.
- Recommended mitigation: Move insertPostComment to a postComments.write.dal.js file. Create the
  file if it does not exist.
- Rationale: Write DAL functions must live in write DAL files. This is both an architecture contract
  requirement and a security audit requirement.
- Follow-up command: Wolverine (move write function to correct DAL file)
```

---

### FINDING-10

```
VENOM SECURITY FINDING
- Location: apps/VCSM/src/features/post/commentcard/dal/postComments.read.dal.js
  (readPostCommentActorIdDAL function — notification routing)
- Application Scope: VCSM
- Current behavior: readPostCommentActorIdDAL(commentId) fetches the actor_id of a comment for
  notification routing. The query does not include a .is("deleted_at", null) filter. If the
  comment has been soft-deleted, the query still returns the actor_id and notification dispatch
  proceeds against the owner of a deleted comment.
- Risk: Notifications (social.post.comment_like) are sent for interactions on deleted comments.
  The comment owner receives a notification about activity on content that no longer exists.
- Severity: LOW
- Why it matters: Sending notifications for deleted content is a UX and potentially a harassment
  vector — an actor who deleted their comment continues to receive engagement notifications on it.
- Recommended mitigation: Add .is("deleted_at", null) to the readPostCommentActorIdDAL query.
  Return null if deleted, and in the notification dispatch path (toggleCommentLike), skip notification
  if actor_id is null.
- Rationale: Notification routing should only target active, non-deleted content owners.
- Follow-up command: Wolverine (add deleted_at filter to readPostCommentActorIdDAL)
```

---

### DB-LAYER FINDING (Previously reported, tracking here)

```
VENOM SECURITY FINDING
- Location: DB — RLS INSERT policies on vc.post_comments, vc.post_reactions, vc.post_rose_gifts
- Application Scope: VCSM
- Current behavior: RLS INSERT policies on these tables do not include a deleted_at IS NULL guard
  on the parent vc.posts join. The JS controller guards (checkPostExistsDAL) block mutations on
  deleted posts at the app layer. However, a direct PostgREST call with a valid authenticated JWT
  can bypass the JS layer entirely and insert into these tables referencing a soft-deleted post.
- Risk: Authenticated users can write reactions, roses, and comments to soft-deleted posts by
  bypassing the JS controller via direct REST API calls. No DB-level enforcement blocks this.
- Severity: HIGH (DB layer)
- Why it matters: App-layer guards alone are insufficient when the DB REST API is directly accessible.
  PostgREST exposes all RLS-permitted tables. An authenticated user who knows a post_id can craft
  a direct API call that bypasses all JS controller logic.
- Recommended mitigation: Add a NOT EXISTS (SELECT 1 FROM vc.posts WHERE id = NEW.post_id AND deleted_at IS NOT NULL)
  check to INSERT policies on post_comments, post_reactions, and post_rose_gifts. This enforces
  the deleted post invariant at the DB layer regardless of how the write arrives.
- Rationale: The principle of defense in depth — DB-level constraints must not depend on app-layer
  enforcement being called. PostgREST is a direct API surface.
- Follow-up command: Carnage (DB migration to add deleted_at guard to INSERT policies)
```

---

### VPORT SELF-GHOSTING FINDING (FINDING-03 from prior VENOM)

```
VENOM SECURITY FINDING
- Location: DB — vport.profiles RLS policy (profiles_update_by_actor_owner)
- Application Scope: VCSM
- Current behavior: The profiles_update_by_actor_owner RLS policy grants UPDATE on ALL columns
  of vport.profiles, including is_active and is_deleted. A VPORT owner can directly PATCH
  is_deleted: true or is_active: false via the REST API (self-ghosting).
- Risk: VPORT owners can self-delete or deactivate their vport.profiles row directly via REST,
  bypassing any platform-controlled deactivation flow. If is_active and is_deleted are intended
  as administrative flags, this is an escalation path.
- Severity: MEDIUM
- Why it matters: Administrative flags on a profile should be controlled by service_role or
  moderation flows, not by the account owner directly. Self-ghosting bypasses any off-boarding
  logic the platform expects to run on deactivation.
- Recommended mitigation: Restrict UPDATE on is_active and is_deleted to service_role only via
  column-level RLS restriction. VPORT owners should only be able to update display fields
  (name, slug, avatar_url, etc.) via the owner policy.
- Rationale: Separation of owner-editable display fields from administrative state flags.
- Follow-up command: Carnage (column-level RLS restriction migration)
```

---

## MITIGATION PRIORITY SUMMARY

| Priority | Finding | Severity | Location |
|---|---|---|---|
| 1 | FINDING-01: ownerless deleteComment export | HIGH | comments.dal.js |
| 2 | DB-LAYER: RLS missing deleted_at guard on post writes | HIGH | DB migration |
| 3 | FINDING-02: client-trusted mention actorIds → notifications | HIGH | createPost.controller.js |
| 4 | FINDING-04: debug controller identity type bug + internal ID exposure | MEDIUM | getDebugPrivacyRows.controller.js |
| 5 | FINDING-03: deleted_by_actor_id in feed pipeline | MEDIUM | feed.read.posts.dal.js |
| 6 | FINDING-06: unvalidated media URLs stored | MEDIUM | createPost.controller.js |
| 7 | FINDING-07: no soft-delete guard on toggleCommentLike | MEDIUM | commentReactions.controller.js |
| 8 | FINDING-05: no post_type enum validation | MEDIUM | createPost.controller.js |
| 9 | VPORT-SELF-GHOST: vport.profiles UPDATE policy too broad | MEDIUM | DB migration |
| 10 | FINDING-08: no content length limits | LOW | controllers |
| 11 | FINDING-10: notification routing reads deleted comments | LOW | postComments.read.dal.js |
| 12 | FINDING-09: insertPostComment in read DAL file | LOW | postComments.read.dal.js |

---

## IDENTITY SURFACE WARNINGS

```
IDENTITY SURFACE WARNING
Location: getDebugPrivacyRows.controller.js — response payload
Current identity surface: returns profile_id and vport_id
Expected identity surface: actorId and kind only
Risk: Internal surrogate keys exposed through controller surface — violates VCSM identity contract
Suggested correction: Remove profile_id and vport_id from response shape
```

```
IDENTITY SURFACE WARNING
Location: getDebugPrivacyRows.controller.js — readOwnedActorIdsByUserIdDAL(actorId) call
Current identity surface: actorId passed where userId is expected
Expected identity surface: userId from Supabase session, not actorId
Risk: Silent wrong-identity query — ownership check always fails or returns wrong data
Suggested correction: Resolve userId from session before calling this DAL
```

---

## DEBUG LEAKAGE WARNINGS

```
DEBUG LEAKAGE WARNING
Location: apps/VCSM/src/features/post/postcard/ui/DebugPrivacyPanel.jsx
Current behavior: Renders profile_id and vport_id in the browser DOM. Gated by import.meta.env.DEV.
Leak risk: Dev build exposure of internal surrogate keys that the identity contract forbids on
  public controller surfaces. If dev builds are shared with QA, testers, or staging environments
  these values are visible.
Severity: LOW
Recommended mitigation: At minimum, replace profile_id and vport_id rendering with actorId and kind.
  The panel can still serve debugging purposes without violating the identity surface contract.
```

---

_VENOM audit complete — read-only. No files were modified during this audit._
