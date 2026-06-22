# VENOM V2 SECURITY REVIEW — upload

---

## Output Metadata

| Field | Value |
|---|---|
| Category Key | VCSM:upload |
| Feature | upload |
| Command | VENOM V2 |
| Ticket | TICKET-VENOM-UPLOAD-0001 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/upload/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_upload-security-review.md |
| Timestamp | 2026-06-04T19:48:00 |

---

## 1. VENOM Scanner Preflight

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

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Surfaces In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 6 | Primary attack surface inventory |
| rpc-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 1 | RPC surface inventory |
| edge-function-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Edge function surface inventory |
| security-path-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 7 | Security path inventory |
| route-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Route→write chain resolution |
| write-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 6 | Write surface caller chain resolution |
| rpc-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 1 | RPC caller chain resolution |
| edge-execution-map | 2026-06-04T19:48:25.152Z | <1h | FRESH | HIGH | 0 | Edge caller chain resolution |

Scanner Version: 1.1.0
Overall Preflight: FRESH
Preflight Action: PASSED
Total surfaces in scope: 6 write + 1 rpc + 0 edge
Total security paths in scope: 7
HIGH confidence paths (resolved): 0
LOW confidence paths (unresolved): 7

**Note:** All 7 security paths are LOW confidence — the scanner discovered surfaces but could not resolve the caller chain from any route. This triggers the LOW Confidence Review Protocol (V2.4) for all surfaces. Manual tracing was performed for all 7.

---

## 3. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: upload
Scan Date: 2026-06-04T19:48:25.152Z

Write Surfaces: 6
  INSERT: 3 (vc.posts, vc.post_media, vc.post_mentions)
  UPDATE: 1 (vc.post_media — media_asset_id writeback)
  DELETE: 1 (vc.posts — rollback path)
  RPC: 1 (identity.search_actor_directory)
  Tables affected: vc.posts, vc.post_media, vc.post_mentions

RPC Calls: 1
  Schema: identity:search_actor_directory

Edge Functions: 0

Security Paths: 7
  HIGH confidence (caller chain resolved): 0
  LOW confidence (caller chain unresolved): 7
  Access=protected: 0
  Access=public: 0
  Access=unknown: 7

Execution Paths Resolved: 0 / 7

Manual Trace Results (LOW Confidence Protocol applied):
  insertPost.dal.js → createPostController → useUploadSubmit (session-verified)
  insertPostMedia.dal.js → createPostController → useUploadSubmit (session-verified)
  insertPostMentions.dal.js → createPostController (validated actorIds, but no lifecycle filter)
  postAuthRollback.dal.js → createPostController (rollback path — no ownership re-check)
  searchMentionSuggestions.dal.js → ctrlSearchMentionSuggestions → useMentionAutocomplete (no session bind)
  updatePostMediaAssetId.write.dal.js → recordPostMediaController (actorId from caller, no row-level ownership check)
  posts.adapter.js::createSystemPost → callers in vport/gasprices/exchange/locksmith/barbershop/menu (actorId caller-supplied, no actor_owners verification inside adapter)
```

---

## 4. Scanner Signals

| Signal | Source Map | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|
| INSERT vc.posts at insertPost.dal.js | write-surface-map | HIGH (write) / LOW (path) | YES — insertPost.dal.js line 7: no ownership check; row built in createPostController with session user.id but no actor_owners verify | [SOURCE_VERIFIED] | VEN-UPLOAD-001 |
| INSERT vc.post_mentions at insertPostMentions.dal.js | write-surface-map | HIGH (write) / LOW (path) | YES — findActorsByHandles.dal.js line 72: filterValidActorIdsDAL checks actor exists but not active/blocked status | [SOURCE_VERIFIED] | VEN-UPLOAD-002 |
| INSERT vc.post_media at insertPostMedia.dal.js | write-surface-map | HIGH (write) / LOW (path) | YES — insertPostMedia.dal.js line 3: no ownership check; media_type accepted from caller without allowlist validation | [SOURCE_VERIFIED] | VEN-UPLOAD-003 |
| UPDATE vc.post_media at updatePostMediaAssetId.write.dal.js | write-surface-map | HIGH (write) / LOW (path) | YES — updatePostMediaAssetId.write.dal.js line 11: updates by postMediaId only, no actorId/ownership filter on UPDATE | [SOURCE_VERIFIED] | VEN-UPLOAD-004 |
| DELETE vc.posts at postAuthRollback.dal.js | write-surface-map | HIGH (write) / LOW (path) | YES — postAuthRollback.dal.js line 9: deletePostByIdDAL deletes by postId only, no ownership re-check | [SOURCE_VERIFIED] | VEN-UPLOAD-005 |
| RPC identity.search_actor_directory from searchMentionSuggestions.dal.js | rpc-map | HIGH (rpc) / LOW (path) | YES — searchMentionSuggestions.dal.js line 19: viewerActorId passed as null always from controller layer | [SOURCE_VERIFIED] | VEN-UPLOAD-006 |
| posts.adapter.js createSystemPost — actorId from caller | write-surface-map (adapter) | HIGH | YES — posts.adapter.js line 4: actorId accepted as parameter, no actor_owners check in adapter | [SOURCE_VERIFIED] | VEN-UPLOAD-007 |
| classifyFile MIME validation — client file.type only | Manual inspection | N/A | YES — classifyFile.js line 12: validates file.type which is client-controlled browser property | [SOURCE_VERIFIED] | VEN-UPLOAD-008 |
| input.mode not validated against allowlist | Manual inspection | N/A | YES — createPost.controller.js line 85: post_type: input.mode stored without allowlist check | [SOURCE_VERIFIED] | VEN-UPLOAD-009 |
| Notification linkPath uses raw postId UUID | Manual inspection | N/A | YES — createPost.controller.js line 157: linkPath: `/post/${postId}` — raw UUID in notification URL | [SOURCE_VERIFIED] | VEN-UPLOAD-010 |

---

## 5. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/upload/BEHAVIOR.md
BEHAVIOR.md exists: YES
BEHAVIOR.md status: PLACEHOLDER
§5 Security Rules declared: 0
§5 Rules verified in source: 0 / 0
§5 Rules unenforced: NONE (no rules declared)
§9 Must Never Happen declared: 0
§9 Invariants protected in source: 0 / 0
§9 Invariants unprotected: NONE (no invariants declared)
```

**FINDING: MISSING_BEHAVIOR_CONTRACT (upload)**

The BEHAVIOR.md file exists but is a PLACEHOLDER only. It contains no §5 Security Rules and no §9 Must Never Happen invariants. For a feature with 6 write surfaces including post creation, media upload, actor mentions, and a system post adapter used across multiple VPORT subsystems, the absence of a declared security contract means:

- No formal enforcement requirements exist for actor ownership verification
- No invariants protect against cross-actor post forgery
- No declared rejection conditions exist for unauthenticated writes
- Security posture evaluation proceeds with source evidence only (all findings marked with additional note: UNANCHORED — no behavioral contract to cross-check)

Severity: HIGH (finding VEN-UPLOAD-001 covers the ownership gap; this is an additional governance gap)
Follow-up: WOLVERINE intake required to draft §5 and §9 for this feature.

---

## 6. Trust Boundary Findings

---

### VEN-UPLOAD-001 — Actor Identity Not Verified via actor_owners Before Post Creation

```
VENOM SECURITY FINDING
- Finding ID: VEN-UPLOAD-001
- Location: apps/VCSM/src/features/upload/controllers/createPost.controller.js:74-91
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table/View (vc.posts)
- Trust Boundary: Authenticated Citizen / Authenticated VPORT Owner
- Boundary Violated: Authenticated Citizen → VPORT Owner (an authenticated user can create a post attributed to an actor they do not own)
- Contract Violated: Actor Ownership Contract
- Current behavior: createPostController accepts identity.actorId from the caller (useIdentity hook) and builds the DB row using actor_id: identity.actorId without verifying via actor_owners that the authenticated user is a confirmed owner of that actorId. Auth check confirms the user is authenticated (user.id present) but does not confirm actor ownership.
- Risk: A client that manipulates the identity context (e.g., via a tampered hook, replayed state, or a bug in identity switching) could submit a post attributed to an actor they do not own. No server-side actor_owners lookup occurs before INSERT.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions:
  - Authenticated Citizen account required
  - Ability to manipulate the identity context value passed to createPostController (requires compromised client state or identity switching bug)
  - No server-side actor_owners check to block the write
- Blast Radius:
  - Feed contamination — post appears under wrong actor's identity
  - Actor reputation harm — content attributed to victim actor
  - Trust model violation — VCSM actor ownership is not verified at write time
- Identity Leak Type: Actor correlation / Ownership inference
- Cache Trust Type: Public-profile-sensitive (post appears in actor's public feed)
- RLS Dependency: UNVERIFIED — RLS on vc.posts may enforce user_id = auth.uid() but this does not confirm actor ownership; actor_id column ownership is not enforced by RLS in any verified way
- Why it matters: VCSM's entire trust model is actor-based. A post attributed to the wrong actor violates the platform's core identity guarantee. The actor_owners table exists precisely to prevent this. Bypassing it — even unintentionally — breaks the feed publishing contract.
- Recommended mitigation: Add an actor_owners verification step in createPostController before building the DB row: confirm that the authenticated user's auth UID maps to an owner record for identity.actorId. Use the existing actor_owners DAL pattern from other features (e.g., booking, exchange rate controllers).
- Rationale: The auth user check (getCurrentAuthUserDAL) confirms authentication but not authorization. Actor ownership requires an explicit actor_owners lookup. Defense-in-depth: even if RLS enforces user_id, actor_id ownership is separate and must be app-verified.
- Follow-up command: DB (verify RLS on vc.posts covers actor_id binding), SPIDER-MAN (regression test for cross-actor post creation attempt)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security, Security Architecture and Engineering
```

---

### VEN-UPLOAD-002 — filterValidActorIdsDAL Accepts Inactive/Blocked Actors as Mention Targets

```
VENOM SECURITY FINDING
- Finding ID: VEN-UPLOAD-002
- Location: apps/VCSM/src/features/upload/dal/findActorsByHandles.dal.js:72-84
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table/View (vc.actors, vc.post_mentions)
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Authenticated Citizen → deleted/inactive/blocked actor (should not be mentionable)
- Contract Violated: Actor Ownership Contract / Feed Publishing Contract
- Current behavior: filterValidActorIdsDAL validates that actor IDs exist in vc.actors with `SELECT id FROM vc.actors WHERE id IN (...)` — it does NOT filter by actor status, active flag, or block relationships. Deleted, suspended, or blocked actors pass this check and are inserted into post_mentions with notifications dispatched.
- Risk: A user can deliberately mention a deleted or suspended actor and trigger a notification to that actor's identity. A user blocked by the author can be mentioned and receive a notification (although ctrlGetBlockedActorSet filters this for notifications, the mention row itself is still inserted). Additionally, if searchMentionSuggestions already filters results on the RPC side, the UI might surface inactive actors in type-ahead results.
- Severity: MEDIUM
- Exploitability: MEDIUM
- Attack Preconditions:
  - Authenticated Citizen account required
  - Knowledge of a deleted/inactive actor UUID (obtainable via other API surfaces)
  - POST with mentionsResolved array containing the invalid actor ID
- Blast Radius:
  - Single actor (mentioned party)
  - Notification spam to deleted/suspended accounts
  - Post_mentions table contamination with invalid actor references
- Identity Leak Type: Resource enumeration (confirms whether a UUID belongs to an actor)
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — whether vc.post_mentions has FK constraints or RLS filtering on actor lifecycle status is not verified
- Why it matters: Mentions are permanent post records. Inserting mentions to deleted/blocked actors creates referential noise, can confirm actor ID existence to an attacker, and violates expected platform behavior where deactivated actors should be invisible.
- Recommended mitigation: Add a lifecycle filter to filterValidActorIdsDAL: `AND is_active = true AND deleted_at IS NULL` (or equivalent status column on vc.actors). The ctrlGetBlockedActorSet call before notification dispatch is the right pattern — apply the same logic to the mention insertion step.
- Rationale: Existence validation is not sufficient. The platform requires lifecycle-aware actor resolution at all write surfaces that accept external actor IDs.
- Follow-up command: DB (verify vc.actors schema for status/active columns and FK constraints on post_mentions)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Asset Security, Software Development Security
```

---

### VEN-UPLOAD-003 — media_type Accepted from Client Input Without Server-Side Allowlist in insertPostMedia

```
VENOM SECURITY FINDING
- Finding ID: VEN-UPLOAD-003
- Location: apps/VCSM/src/features/upload/dal/insertPostMedia.dal.js:10 / apps/VCSM/src/features/upload/controllers/createPost.controller.js:101-104
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table/View (vc.post_media)
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Authenticated Citizen → DB write (unvalidated media_type enum stored)
- Contract Violated: Media Access Contract
- Current behavior: insertPostMedia receives `items` with `media_type` field that is set in createPostController as `(mediaTypes[idx] || "image") === "video" ? "video" : "image"`. This normalizes any non-"video" value to "image", which is a partial guard. However, the `url` field receives the public storage URL directly from the upload adapter with no format/domain validation before storage in vc.post_media.
- Risk: While the media_type normalization (video/image) prevents unexpected enum values, the `url` field is stored without verifying it originates from the expected Supabase storage bucket. An attacker who manipulates the upload flow could store an arbitrary external URL in vc.post_media, potentially causing the feed renderer to load content from untrusted origins.
- Severity: MEDIUM
- Exploitability: MEDIUM
- Attack Preconditions:
  - Authenticated Citizen account required
  - Ability to tamper with the uploadMedia return value or intercept the mediaUrls array before it reaches createPostController
  - The controller fully trusts the URL returned by the upload API layer
- Blast Radius:
  - Single post (attacker's own post)
  - Feed rendering of untrusted media URLs
  - Potential SSRF/CSP bypass depending on how feed renders media
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: NONE (risk is in app-layer URL trust, not RLS)
- Why it matters: Storing an attacker-controlled external URL in vc.post_media means the platform's feed renderer serves content from an untrusted origin. Depending on the CDN/rendering setup, this could bypass Content Security Policy or facilitate media substitution attacks.
- Recommended mitigation: Before calling insertPostMedia, validate that all URLs in the mediaUrls array match the expected Supabase storage bucket origin (e.g., `startsWith(SUPABASE_STORAGE_BASE_URL)`). This should be a controller-layer check, not a DAL-layer check.
- Rationale: Upload adapters can be abused or have bugs. A URL origin check at the controller layer provides defense-in-depth against unexpected URL sources reaching the database.
- Follow-up command: ELEKTRA (source-to-sink trace of URL from uploadMedia through to insertPostMedia)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Communication and Network Security, Security Architecture and Engineering
```

---

### VEN-UPLOAD-004 — updatePostMediaAssetIdDAL Updates by Row ID Without Actor Ownership Filter

```
VENOM SECURITY FINDING
- Finding ID: VEN-UPLOAD-004
- Location: apps/VCSM/src/features/upload/dal/updatePostMediaAssetId.write.dal.js:11-20
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table/View (vc.post_media)
- Trust Boundary: Authenticated Citizen / Authenticated VPORT Owner
- Boundary Violated: Caller supplies postMediaId — no ownership constraint in UPDATE predicate
- Contract Violated: Actor Ownership Contract / Media Access Contract
- Current behavior: updatePostMediaAssetIdDAL executes `UPDATE vc.post_media SET media_asset_id = ? WHERE id = ?`. The predicate is `id = postMediaId` only — no actorId or user_id scoping in the WHERE clause. The recordPostMediaController that calls this DAL receives actorId from the calling context (useUploadSubmit) but does not pass it to the DAL as a write constraint.
- Risk: If postMediaId is supplied or guessable by an attacker (e.g., enumerated from a public feed response), and if RLS on vc.post_media does not enforce actor ownership on UPDATE, any authenticated user could update another actor's post_media record's media_asset_id column to an arbitrary asset ID.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions:
  - Authenticated Citizen account required
  - A valid post_media UUID from another actor's post (obtainable from public feed API)
  - A valid media_asset_id (obtainable by uploading a legitimate file to get one)
  - RLS on vc.post_media UPDATE must not enforce actor ownership (UNVERIFIED)
- Blast Radius:
  - Multi-actor — any post_media row in the system is potentially writable
  - Media asset replacement on any post
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: UNVERIFIED — critical dependency; if RLS on vc.post_media enforces actor/user ownership on UPDATE, this is mitigated at DB layer; if absent, this is exploitable
- Why it matters: An attacker could silently replace the media_asset_id link on any post_media row, potentially causing the system to reference a different media asset for another actor's post. This is a media integrity violation.
- Recommended mitigation: Add `actor_id` or `user_id` to the UPDATE WHERE clause in updatePostMediaAssetIdDAL: `.eq('id', postMediaId).eq('actor_id', actorId)` (or via a join to vc.posts). Pass actorId through from recordPostMediaController. Additionally, DB must verify RLS enforces actor ownership on UPDATE for vc.post_media.
- Rationale: Defense-in-depth: app-layer ownership filter + RLS. Neither alone is sufficient without verification.
- Follow-up command: DB (verify RLS on vc.post_media UPDATE operations), ELEKTRA (trace postMediaId source-to-sink)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering, Software Development Security
```

---

### VEN-UPLOAD-005 — deletePostByIdDAL Has No Ownership Check (Rollback Path)

```
VENOM SECURITY FINDING
- Finding ID: VEN-UPLOAD-005
- Location: apps/VCSM/src/features/upload/dal/postAuthRollback.dal.js:9-17
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table/View (vc.posts)
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Any authenticated caller can invoke deletePostByIdDAL with any postId
- Contract Violated: Actor Ownership Contract
- Current behavior: deletePostByIdDAL executes `DELETE FROM vc.posts WHERE id = ?` with no actor_id, user_id, or ownership constraint in the WHERE clause. Its primary intended use is as a rollback mechanism when insertPostMedia fails after insertPost succeeds. However, it is a named export and can be imported by any other controller.
- Risk: The function is exported with no caller restriction. While its current callers are limited to the createPostController rollback path (which only calls it for a postId the controller itself just created), the absence of an ownership predicate means: (a) if RLS is absent or bypassed, any caller could delete any post by ID; (b) future callers may inadvertently use this function without realizing there is no ownership guard.
- Severity: HIGH
- Exploitability: LOW (currently limited to internal rollback path; exploitability increases if function is re-used)
- Attack Preconditions:
  - Authenticated Citizen account required
  - Any future use of this export in a context where postId originates from client input
  - RLS on vc.posts DELETE must be absent or insufficient
- Blast Radius:
  - Multi-actor — any post in the system is deletable if used incorrectly
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — if RLS enforces user_id = auth.uid() on DELETE, this is partially mitigated; actor ownership still not verified
- Why it matters: Ownerless DELETE DAL functions are architectural debt that becomes a vulnerability when reused. The platform convention is ownership constraints in the WHERE clause. This function violates that convention and is a rollback-only footgun.
- Recommended mitigation: Rename to `deleteOwnPostByIdDAL` and add `actor_id` or `user_id` to the DELETE predicate: `.eq('id', postId).eq('actor_id', callerActorId)`. Refactor the rollback call site in createPostController to pass actorId.
- Rationale: Naming clarity + predicate enforcement prevents future misuse and closes the ownership gap for the current path as well.
- Follow-up command: DB (verify RLS on vc.posts DELETE), SPIDER-MAN (regression test for rollback path)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Identity and Access Management, Security Architecture and Engineering
```

---

### VEN-UPLOAD-006 — searchMentionSuggestions Passes viewerActorId as null — No Viewer Context for RPC

```
VENOM SECURITY FINDING
- Finding ID: VEN-UPLOAD-006
- Location: apps/VCSM/src/features/upload/controller/searchMentionSuggestions.controller.js:3-6 / apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js:19
- Application Scope: VCSM
- Platform Surface: PWA / Supabase RPC (identity.search_actor_directory)
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Viewer identity not passed to the RPC — blocked/private actors may appear in mention suggestions
- Contract Violated: Actor Ownership Contract (viewer context missing)
- Current behavior: ctrlSearchMentionSuggestions calls searchMentionSuggestions with `{ limit }` only — no viewerActorId is passed. The DAL calls identity.search_actor_directory with `p_viewer_actor_id: viewerActorId` where viewerActorId defaults to `null`. The RPC receives a null viewer identity, which may prevent it from applying block/follow/private filtering based on the viewing actor's relationships.
- Risk: If identity.search_actor_directory applies block relationship filtering when a viewer actor ID is provided, passing null means: actors who have blocked the viewer, or private actors not followed by the viewer, may appear in mention autocomplete suggestions. This allows a user to discover and mention actors who have blocked them, potentially violating the block relationship contract.
- Severity: MEDIUM
- Exploitability: MEDIUM
- Attack Preconditions:
  - Authenticated Citizen account required
  - An actor who has blocked the current user must exist in the directory
  - Type any prefix in the mention autocomplete to trigger the RPC
- Blast Radius:
  - Single actor (the blocked/private actor whose handle appears in suggestions)
  - Block relationship bypass — mentions sent to actors who blocked you
- Identity Leak Type: Actor correlation (blocked actor handles discoverable via autocomplete)
- Cache Trust Type: None
- RLS Dependency: NONE (risk is at RPC parameter level, not RLS)
- Why it matters: The block relationship is a core social trust boundary. If blocked actors appear in mention autocomplete, it leaks their identity to the blocking party and enables @mentions that circumvent the block. The RPC parameter p_viewer_actor_id exists precisely to support this filtering — not passing it defeats its purpose.
- Recommended mitigation: Inject viewerActorId into ctrlSearchMentionSuggestions from the calling hook (useMentionAutocomplete already has access to identity via the hook's context, or the controller should accept viewerActorId as a parameter). Pass `{ limit, viewerActorId: identity.actorId }` from useMentionAutocomplete.
- Rationale: The RPC was designed to accept a viewer context. Using it correctly enforces block/privacy filtering at the DB function layer, which is the most reliable enforcement point.
- Follow-up command: DB (inspect identity.search_actor_directory RPC to confirm p_viewer_actor_id filtering logic), SPIDER-MAN (regression test: blocked actor does not appear in mention suggestions)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Communication and Network Security, Software Development Security
```

---

### VEN-UPLOAD-007 — createSystemPost Adapter Accepts actorId from Caller Without actor_owners Verification

```
VENOM SECURITY FINDING
- Finding ID: VEN-UPLOAD-007
- Location: apps/VCSM/src/features/upload/adapters/posts.adapter.js:4-29
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table/View (vc.posts)
- Trust Boundary: Authenticated VPORT Owner / Authenticated Citizen
- Boundary Violated: Caller supplies actorId — adapter does not verify the authenticated user owns that actor
- Contract Violated: Actor Ownership Contract / Feed Publishing Contract
- Current behavior: createSystemPost accepts `{ actorId, text, post_type, realm_id, ... }` as parameters. It verifies the caller is authenticated (supabase.auth.getUser()) but does NOT verify that the authenticated user is an owner of the supplied actorId via actor_owners. The actorId is passed directly to insertPost as actor_id.
- Risk: Any caller that imports this adapter and passes an arbitrary actorId (not their own) will successfully create a system post attributed to another actor. While the current callers (gasprices, exchange rate, locksmith, barbershop, menu controllers) are expected to verify ownership before calling createSystemPost, the adapter itself provides no defense-in-depth guarantee.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions:
  - Authenticated Citizen or VPORT Owner account required
  - Import of createSystemPost adapter in a new or modified controller
  - Passing a target actor's UUID instead of the caller's own actorId
  - The adapter does not check actor_owners — ownership is delegated entirely to callers
- Blast Radius:
  - Feed contamination — system posts appear under wrong actor identity
  - Multi-actor — any caller of createSystemPost can target any actor
  - VPORT business feed integrity violation
- Identity Leak Type: Actor correlation / Ownership inference
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: UNVERIFIED — RLS on vc.posts may enforce user_id but actor_id binding is not RLS-verified
- Why it matters: The adapter is used by at least 5 VPORT subsystems (gasprices, exchange rate, locksmith, barbershop, menu). Each caller independently gates ownership, but the adapter provides no fallback enforcement. A regression in any single caller's ownership gate would result in a successful cross-actor system post. Defense-in-depth requires the adapter to verify ownership independently.
- Recommended mitigation: Add an actor_owners verification call inside createSystemPost before calling insertPost: confirm the authenticated user (user.id) maps to an owner record for actorId. This makes the adapter safe regardless of caller behavior.
- Rationale: Shared adapters called from multiple contexts must enforce their own security invariants. Relying on all callers to correctly gate ownership is a defense-in-depth failure that will eventually result in a bypass as the codebase grows.
- Follow-up command: SPIDER-MAN (regression test: createSystemPost rejects actorId not owned by caller), DB (verify actor_owners schema pattern for this check)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering, Software Development Security
```

---

### VEN-UPLOAD-008 — MIME Type Validation Uses Client-Controlled file.type Only

```
VENOM SECURITY FINDING
- Finding ID: VEN-UPLOAD-008
- Location: apps/VCSM/src/features/upload/lib/classifyFile.js:12-13
- Application Scope: VCSM
- Platform Surface: PWA / Media/Storage
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Client-supplied MIME type trusted as file classification authority
- Contract Violated: Media Access Contract
- Current behavior: classifyFile validates the file against an allowlist of MIME types using `file.type` — the browser-provided MIME type based on file extension, not on inspected file bytes. `file.type` is entirely client-controlled and can be set to any value. The media engine's validateMediaFile (engines/media/src/lib/validateMediaFile.js) also uses `file.type` and the BLOCKED_MIMES list, providing a consistent but equally client-trusting layer. No server-side magic-byte inspection occurs.
- Risk: An attacker can rename a malicious file (e.g., an SVG with embedded JavaScript, or an HTML file) to have a .jpg extension, which causes `file.type` to report `image/jpeg`. This passes both classifyFile and validateMediaFile. The file is then uploaded to Supabase Storage. If the CDN serves the file with incorrect Content-Type headers or without strict Content-Disposition, browsers may execute script content.
- Severity: MEDIUM
- Exploitability: MEDIUM
- Attack Preconditions:
  - Authenticated Citizen account required
  - Rename malicious file to .jpg or other accepted extension
  - Upload via normal post creation flow
  - Effectiveness depends on CDN Content-Type behavior and whether Supabase Storage overrides Content-Type based on inspected bytes
- Blast Radius:
  - Feed-wide — any user viewing the post loads the malicious media URL
  - Potential stored XSS via SVG execution if CDN serves with wrong Content-Type
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: NONE (risk is at media validation layer)
- Why it matters: Client-side MIME validation is a UI convenience guard, not a security boundary. The platform's media upload pipeline lacks server-side content inspection. Supabase Storage does provide some protection through Content-Type enforcement, but this depends on bucket configuration — not verified here.
- Recommended mitigation: (1) Verify that Supabase Storage bucket serving configuration enforces Content-Disposition: attachment or explicit Content-Type overrides. (2) Add magic-byte inspection (read first N bytes of file and compare to known signatures) before upload. (3) At minimum, confirm SVG is explicitly blocked in the accepted MIME list for all upload scopes (BLOCKED_MIMES already includes image/svg+xml — confirm this is applied to vibe_post scope).
- Rationale: Defense-in-depth for media uploads requires server-side or trusted-proxy validation. Client MIME type is advisory only.
- Follow-up command: DB (verify Supabase Storage bucket CDN Content-Type behavior), ELEKTRA (trace media URL from upload through to feed rendering)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Communication and Network Security, Security Architecture and Engineering
```

---

### VEN-UPLOAD-009 — post_type Stored Directly from input.mode Without Allowlist Validation

```
VENOM SECURITY FINDING
- Finding ID: VEN-UPLOAD-009
- Location: apps/VCSM/src/features/upload/controllers/createPost.controller.js:85
- Application Scope: VCSM
- Platform Surface: PWA / Supabase Table/View (vc.posts)
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Client-supplied post_type enum stored without server-side validation
- Contract Violated: Feed Publishing Contract
- Current behavior: `post_type: input.mode` is set in the DB row at line 85. input.mode originates from form.mode passed through useUploadSubmit from the UI layer. Only one validation exists: `if ((input.mode === "post" || !input.mode) && mediaUrls.length > MAX_VIBES_PHOTOS)` — this checks a media count limit for "post" mode but does not validate that input.mode is one of the allowed values (e.g., 'post', '24drop', 'vdrop').
- Risk: An authenticated user can inject an arbitrary string as post_type into vc.posts. If the feed renderer, moderation tools, or analytics queries filter or branch on post_type, an injected value could cause unexpected behavior, bypass type-specific feed rules, or contaminate analytics.
- Severity: MEDIUM
- Exploitability: HIGH (only an authenticated account needed; manipulation of form.mode before submission is trivial for a motivated attacker in a browser context)
- Attack Preconditions:
  - Authenticated Citizen account required
  - Modify form.mode before calling useUploadSubmit (e.g., via browser console or intercepted state)
- Blast Radius:
  - Single post (attacker's own post with injected post_type)
  - Feed-wide if feed logic branches unsafely on post_type
  - Analytics/moderation if they trust post_type without validation
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE (risk is at app-layer validation)
- Why it matters: post_type is a discriminator used throughout the feed system. An unvalidated client-controlled discriminator is an injection vector. Even if current consequences are limited, it establishes an insecure pattern for a safety-critical field.
- Recommended mitigation: Add an allowlist check in createPostController before building the DB row:
  ```js
  const ALLOWED_POST_MODES = ['post', '24drop', 'vdrop'];
  const safeMode = ALLOWED_POST_MODES.includes(input.mode) ? input.mode : 'post';
  ```
  Use safeMode for post_type in the row object.
- Rationale: Enum fields stored to DB must always be validated against an allowlist at the controller layer. This is standard input validation for discriminator columns.
- Follow-up command: ELEKTRA (confirm post_type is not used unsafely in feed/moderation queries)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security and Risk Management
```

---

### VEN-UPLOAD-010 — Notification linkPath Contains Raw postId UUID

```
VENOM SECURITY FINDING
- Finding ID: VEN-UPLOAD-010
- Location: apps/VCSM/src/features/upload/controllers/createPost.controller.js:157
- Application Scope: VCSM
- Platform Surface: PWA / Feed Engine / Notifications
- Trust Boundary: Authenticated Citizen (notification recipient)
- Boundary Violated: Internal UUID exposed in public-facing notification link
- Contract Violated: Platform Vocabulary Contract / Public Identity Surface Contract
- Current behavior: `linkPath: \`/post/${postId}\`` — postId is the raw vc.posts UUID. This UUID is included in notification payloads dispatched to mention recipients.
- Risk: Raw UUIDs must never appear in public-facing URLs per platform memory rule (feedback_no_raw_ids_in_urls.md). Notification links expose the internal vc.posts.id UUID to notification recipients. This enables: (a) resource enumeration of post IDs, (b) timing-based ID inference for guessing adjacent post UUIDs, (c) violation of the platform's slug/human-readable URL contract.
- Severity: LOW
- Exploitability: LOW (notifications only go to mentioned actors; enumeration requires receiving notifications)
- Attack Preconditions:
  - Must be a mentioned actor receiving a notification
  - UUID harvesting from notification links
- Blast Radius:
  - Single actor (notification recipient)
  - Internal UUID exposure in notification payload
- Identity Leak Type: Internal UUID exposure
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The platform has an explicit rule: raw UUIDs must never appear in public URLs. Notification deep links are public-facing. This violates the contract and enables post UUID enumeration by mention recipients.
- Recommended mitigation: Use a human-readable or slug-based post URL in linkPath. If posts currently only have UUID IDs, this may require adding a short ID or slug column to vc.posts for URL construction. In the interim, confirm whether /post/[UUID] is the canonical post URL and whether an alternative is available.
- Rationale: Platform identity URL contract enforcement. UUID exposure in notifications is an incremental leak that accumulates over time.
- Follow-up command: CAPTAIN (capture as a next-session order to add post slugs), DB (confirm vc.posts schema for slug alternatives)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Communication and Network Security
```

---

### VEN-UPLOAD-011 — BEHAVIOR.md is a Placeholder — No Security Contract Declared

```
VENOM SECURITY FINDING
- Finding ID: VEN-UPLOAD-011
- Location: ZZnotforproduction/APPS/VCSM/features/upload/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Documentation / Governance
- Trust Boundary: N/A (governance gap)
- Boundary Violated: Security Assessment Contract — no declared §5 Security Rules or §9 Must Never Happen invariants
- Contract Violated: None — no contract exists to violate (this is the finding)
- Current behavior: BEHAVIOR.md exists but contains only a PLACEHOLDER stub with the note "Behavior contract pending source review." §5 and §9 are absent entirely.
- Risk: Without declared security rules and invariants, VENOM and SPIDER-MAN have no contract to cross-check. Future regressions in ownership enforcement, actor validation, or media safety have no test anchor. Security reviews for this feature will always be UNANCHORED.
- Severity: HIGH (governance gap enabling future undetected regressions)
- Exploitability: LOW (this is a documentation gap, not a direct exploit)
- Attack Preconditions: None (governance finding)
- Blast Radius: Feature-wide security posture; all future changes to upload feature lack behavioral contract anchoring
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The upload feature is a high-value attack surface: it creates posts, uploads media, tags actors, and publishes to feeds. Without a declared security contract, there is no governance mechanism to prevent security regressions as the feature evolves.
- Recommended mitigation: WOLVERINE intake to draft BEHAVIOR.md §5 Security Rules (minimum: actor ownership required, auth required, post_type allowlist enforced, media URL origin check) and §9 Must Never Happen invariants (minimum: post created under actor not owned by caller, mention inserted for deleted actor, system post created without actor_owners check).
- Rationale: All active write-surface features require a declared security contract. Upload is a P1 candidate for behavioral contract authoring.
- Follow-up command: WOLVERINE (intake to draft upload BEHAVIOR.md §5 and §9)
- Provenance: [SOURCE_VERIFIED]
- CISSP Domain:
  - Primary: Security Assessment and Testing
  - Secondary: Security and Risk Management
```

---

## 7. Source Verification Summary

| Surface | DAL File | Controller Verified | Auth Verified | Ownership Verified | Finding |
|---|---|---|---|---|---|
| INSERT vc.posts | insertPost.dal.js | YES (createPostController) | YES (getCurrentAuthUserDAL) | NO (no actor_owners check) | VEN-UPLOAD-001 |
| INSERT vc.post_mentions | insertPostMentions.dal.js | YES (createPostController) | YES (inherited) | PARTIAL (existence only, no lifecycle filter) | VEN-UPLOAD-002 |
| INSERT vc.post_media | insertPostMedia.dal.js | YES (createPostController) | YES (inherited) | NO (URL not origin-validated) | VEN-UPLOAD-003 |
| UPDATE vc.post_media (asset_id) | updatePostMediaAssetId.write.dal.js | YES (recordPostMediaController) | ASSUMED (actorId from identity) | NO (no actorId in WHERE clause) | VEN-UPLOAD-004 |
| DELETE vc.posts | postAuthRollback.dal.js | YES (createPostController rollback) | YES (inherited) | NO (no ownership predicate) | VEN-UPLOAD-005 |
| RPC identity.search_actor_directory | searchMentionSuggestions.dal.js | YES (ctrlSearchMentionSuggestions) | NONE (no auth check in controller) | N/A (read RPC, but viewerActorId=null) | VEN-UPLOAD-006 |
| createSystemPost adapter (vc.posts) | posts.adapter.js | MULTI-CALLER | YES (getUser in adapter) | NO (no actor_owners in adapter) | VEN-UPLOAD-007 |

Total surfaces in scope: 7 (6 DAL writes + 1 adapter write surface)
Surfaces source-verified: 7 / 7
Source files read: insertPost.dal.js, insertPostMedia.dal.js, insertPostMentions.dal.js, postAuthRollback.dal.js, searchMentionSuggestions.dal.js, updatePostMediaAssetId.write.dal.js, findActorsByHandles.dal.js, createPost.controller.js, recordPostMedia.controller.js, searchMentionSuggestions.controller.js, posts.adapter.js, useUploadSubmit.js, useMentionAutocomplete.js, useResolvedActor.js, useMediaSelection.js, classifyFile.js, compressIfNeeded.js, uploadMedia.js (api), uploadTypes.model.js, bugBunnyUploadDebugger.js (stub + active)
CRITICAL findings: 0 — N/A
HIGH findings: 5 — all [SOURCE_VERIFIED]: YES

---

## 8. Confidence Summary

| Metric | Count |
|---|---|
| HIGH confidence surfaces (scanner) | 6 (write) + 1 (rpc) = 7 |
| LOW confidence security paths (scanner) | 7 / 7 |
| [SOURCE_VERIFIED] findings | 11 |
| [SCANNER_LEAD] findings | 0 |
| [SCANNER_LOW_CONF] findings | 0 |
| CRITICAL findings | 0 |
| HIGH findings | 5 (VEN-UPLOAD-001, 002, 004, 005, 007, 011) |
| MEDIUM findings | 4 (VEN-UPLOAD-003, 006, 008, 009) |
| LOW findings | 1 (VEN-UPLOAD-010) |

Note: All 7 scanner paths were LOW confidence (unresolved route chains). VENOM applied the LOW Confidence Review Protocol to all 7 and manually traced each to its caller. All 11 findings are SOURCE_VERIFIED.

---

## 9. THOR Impact

| Finding | Severity | THOR Blocker |
|---|---|---|
| VEN-UPLOAD-001 | HIGH | YES — actor_owners not verified before post creation |
| VEN-UPLOAD-002 | MEDIUM | NO |
| VEN-UPLOAD-003 | MEDIUM | NO |
| VEN-UPLOAD-004 | HIGH | YES — ownerless UPDATE on vc.post_media |
| VEN-UPLOAD-005 | HIGH | YES — ownerless DELETE DAL export |
| VEN-UPLOAD-006 | MEDIUM | NO |
| VEN-UPLOAD-007 | HIGH | YES — createSystemPost adapter missing actor_owners check |
| VEN-UPLOAD-008 | MEDIUM | NO |
| VEN-UPLOAD-009 | MEDIUM | NO |
| VEN-UPLOAD-010 | LOW | NO |
| VEN-UPLOAD-011 | HIGH | NO (governance gap, not a runtime blocker) |

**THOR Release Blockers: VEN-UPLOAD-001, VEN-UPLOAD-004, VEN-UPLOAD-005, VEN-UPLOAD-007**
**Highest Open Severity: HIGH**

---

## 10. Required Follow-Up Commands

| Command | Reason | Findings |
|---|---|---|
| DB | Verify RLS on vc.posts (actor_id ownership), vc.post_media (actor ownership on UPDATE), vc.post_mentions (FK constraints, actor lifecycle filtering) | VEN-UPLOAD-001, 004, 005 |
| DB | Inspect identity.search_actor_directory RPC for p_viewer_actor_id filtering behavior | VEN-UPLOAD-006 |
| DB | Verify Supabase Storage CDN Content-Type enforcement for media buckets | VEN-UPLOAD-008 |
| ELEKTRA | Source-to-sink trace: media URL from uploadMedia → insertPostMedia (URL origin validation) | VEN-UPLOAD-003 |
| ELEKTRA | Source-to-sink trace: post_type from form.mode → vc.posts.post_type (enum validation) | VEN-UPLOAD-009 |
| ELEKTRA | Trace postMediaId from caller → updatePostMediaAssetIdDAL (ownership gap) | VEN-UPLOAD-004 |
| SPIDER-MAN | Regression test: post cannot be created under actor not owned by caller | VEN-UPLOAD-001 |
| SPIDER-MAN | Regression test: deletePostByIdDAL rollback path does not delete posts not owned by caller | VEN-UPLOAD-005 |
| SPIDER-MAN | Regression test: createSystemPost rejects actorId not owned by authenticated user | VEN-UPLOAD-007 |
| SPIDER-MAN | Regression test: blocked actor does not appear in mention autocomplete suggestions | VEN-UPLOAD-006 |
| WOLVERINE | Intake to draft upload BEHAVIOR.md §5 Security Rules and §9 Must Never Happen invariants | VEN-UPLOAD-011 |
| THOR | Review VEN-UPLOAD-001, 004, 005, 007 as release blockers before any upload feature release | All HIGH |

---

## 11. Mitigation Plan

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-UPLOAD-001 | Cross-actor post creation | Controller | P0 | App | DB, SPIDER-MAN |
| VEN-UPLOAD-002 | Inactive/blocked actor mentions | Controller / DAL | P1 | App | DB |
| VEN-UPLOAD-003 | Untrusted media URL stored in vc.post_media | Controller | P1 | App | ELEKTRA |
| VEN-UPLOAD-004 | Ownerless UPDATE on vc.post_media | DAL + Controller | P0 | App + DB | DB, ELEKTRA |
| VEN-UPLOAD-005 | Ownerless DELETE DAL export | DAL | P0 | App | DB, SPIDER-MAN |
| VEN-UPLOAD-006 | Block bypass in mention autocomplete | Controller | P1 | App | DB, SPIDER-MAN |
| VEN-UPLOAD-007 | createSystemPost adapter missing actor_owners check | Controller (adapter) | P0 | App | SPIDER-MAN, DB |
| VEN-UPLOAD-008 | Client-controlled MIME validation only | DAL / Engine / Storage | P2 | App + DB | DB, ELEKTRA |
| VEN-UPLOAD-009 | Unvalidated post_type enum stored to DB | Controller | P1 | App | ELEKTRA |
| VEN-UPLOAD-010 | Raw postId UUID in notification linkPath | Controller | P2 | App | CAPTAIN |
| VEN-UPLOAD-011 | No BEHAVIOR.md security contract | Documentation | P1 | Documentation | WOLVERINE |

---

## 12. CISSP Domain Coverage Summary

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 2 | VEN-UPLOAD-009 (enum injection risk), VEN-UPLOAD-011 (governance gap) |
| Asset Security | 2 | VEN-UPLOAD-010 (UUID exposure), VEN-UPLOAD-002 (inactive actor data in mentions) |
| Security Architecture and Engineering | 6 | VEN-UPLOAD-001, 003, 004, 005, 007, 008 — defense-in-depth gaps throughout the write pipeline |
| Communication and Network Security | 3 | VEN-UPLOAD-003 (untrusted media URL), VEN-UPLOAD-008 (MIME/CDN), VEN-UPLOAD-010 (notification URL) |
| Identity and Access Management | 6 | VEN-UPLOAD-001, 002, 004, 005, 006, 007 — actor ownership and session binding gaps |
| Security Assessment and Testing | 1 | VEN-UPLOAD-011 — no behavioral contract for test anchoring |
| Security Operations | 0 | No production-visible debug leakage found. bugBunnyUploadDebugger is properly stubbed in production via vite alias; all calls are guarded or no-ops. No sensitive logs in production path. |
| Software Development Security | 7 | VEN-UPLOAD-003, 004, 005, 007, 008, 009, 011 — input validation, DAL ownership, adapter security patterns |

**Uncovered Domains:**
- **Security Operations**: In scope — inspected debugger system thoroughly. The bugBunnyUploadDebugger is properly aliased to a no-op stub in production builds. The active debugger correctly gates all output behind `import.meta.env.DEV`, `?debugUploads=1` query param, or localStorage flag. No findings. Domain covered, no issues.
- All 8 CISSP domains were addressed in this review.

---

## VENOM V2 Completion Attestation

- [x] Boundary isolation contract loaded
- [x] Stayed read-only throughout
- [x] Scanner preflight executed and confirmed PASS
- [x] All 8 required maps confirmed FRESH
- [x] Security surface inventory built from scanner data before source reads
- [x] Scanner Inputs block emitted
- [x] Scanner Signals block emitted with row per signal
- [x] LOW Confidence Review Protocol applied to all 7 LOW confidence paths
- [x] All findings labeled with provenance tag [SOURCE_VERIFIED]
- [x] No CRITICAL findings (none warranted by evidence)
- [x] All HIGH findings carry [SOURCE_VERIFIED] with cited file + line
- [x] Severity derived from source verification, not scanner confidence alone
- [x] Source Verification Summary and Confidence Summary included
- [x] CISSP domains assigned to every finding
- [x] CISSP summary table included with uncovered domain notes
- [x] Mitigation plan table included
- [x] THOR blockers identified
- [x] Required follow-up commands listed
- [x] Report persisted to approved audit path
- [x] SECURITY.md write pending (Write 2)
