# VCSM Friend / Subscribe / Private Profile Logic Review

**Date:** 2026-05-10  
**Reviewer:** VENOM / ARCHITECT / KRAVEN (read-only audit)  
**Scope:** `apps/VCSM/src/features/social/`, `features/feed/`, `features/block/`, `features/profiles/`, `supabase/migrations/`, `zNOTFORPRODUCTION/_HISTORY/db/snapshots/`

---

## 1. Scope and Read-Only Statement

This is a read-only audit. No code was modified. No migrations were created. No database commands were run. All SQL in this document is proposal text only. Where a fact could not be verified from source files or schema snapshots, it is marked **UNVERIFIED — DB live check required**.

Protected root inspected: `/Users/vcsm/Desktop/VCSM/apps/VCSM`

No cross-root scope was required. All findings are contained within the VCSM app boundary.

---

## 2. Architecture Map

```
useFollowActorToggle (hook)
  ├── ctrlSubscribe (follow.controller.js)
  │     ├── ctrlGetFollowRelationshipState
  │     │     ├── ctrlGetActorPrivacy → dalGetActorPrivacy [30s TTL cache]
  │     │     ├── ctrlGetFollowStatus → dalGetFollowStatus [8s TTL cache]
  │     │     └── ctrlGetFollowRequestStatus → dalGetRequestStatus
  │     ├── dalInsertFollow → vc.actor_follows (upsert)         [public path]
  │     └── ctrlSendFollowRequest                               [private path]
  │           └── dalUpsertPendingRequest → vc.social_follow_requests (upsert)
  │
  ├── ctrlUnsubscribe (unsubscribe.controller.js)               ← canonical
  │     ├── dalDeactivateFollow → vc.actor_follows (update is_active=false)
  │     └── dalUpdateRequestStatus('revoked') → vc.social_follow_requests (update)
  │
  └── ctrlCancelFollowRequest (followRequests.controller.js)
        └── dalUpdateRequestStatus('cancelled')

useFollowRequestActions (hook)
  ├── ctrlAcceptFollowRequest
  │     ├── dalInsertFollow → vc.actor_follows (upsert)
  │     └── dalUpdateRequestStatus('accepted') → vc.social_follow_requests
  └── ctrlDeclineFollowRequest
        └── dalUpdateRequestStatus('declined')

blockActorController
  ├── checkBlockStatus → moderation.blocks
  ├── blockActorDAL → moderation.block_actor RPC (server handles follows + events)
  └── invalidateFeedBlockCache

useProfileGate (hook)
  ├── useActorPrivacy → dalGetActorPrivacy [30s TTL cache]
  ├── useFollowStatus → dalGetFollowStatus [8s TTL cache]
  └── canView = !isPrivate || isSelf || isFollowing  [NO block check]

fetchFeedPagePipeline
  ├── readFeedPostsPage (vc.posts — RLS enforced + FORCE RLS)
  ├── readActorsBundle (vc.actors + profiles + vports + actor_privacy_settings)
  ├── readFeedBlockRowsDAL (moderation.blocks — 60s TTL cache, page-scoped)
  ├── readFeedFollowRowsDAL (vc.actor_follows — 60s TTL cache, FULL graph)
  ├── buildBlockedActorSetModel (app-layer filter)
  ├── buildFollowedActorSetModel
  └── normalizeFeedRows → resolveFeedRowVisibilityModel
        ├── isActorBlockedForViewerModel
        ├── canViewPrivateFeedActorModel
        └── (vport active check)
```

---

## 3. Flow Trace

### 3.1 Friend Request Sent

**Entry:** `useFollowActorToggle` → `ctrlSubscribe` (follow.controller.js)

When the target actor is private (`relation.isPrivate === true`), `ctrlSubscribe` delegates to `ctrlSendFollowRequest`.

`ctrlSendFollowRequest`:
1. Guards: missing ids, self-follow
2. Calls `dalGetRequestStatus` — returns the *active* status (IN `['pending', 'accepted']`) for this pair
3. If `'pending'` → returns early (idempotent)
4. If `'accepted'` → returns early (already following)
5. Otherwise → `dalUpsertPendingRequest` with `onConflict: 'requester_actor_id,target_actor_id'` → revives declined/cancelled rows
6. Publishes `follow_request` notification

**Request row states:** `pending | accepted | declined | cancelled | revoked`

**Pending requests table:** `vc.social_follow_requests`

**Fields:** `requester_actor_id, target_actor_id, status, created_at, updated_at`

**PROBLEM — No block check before request creation.** `ctrlSendFollowRequest` does not call `checkBlockStatus` or any block guard before inserting a pending request. A user blocked by the target can still create a request row. The `social_follow_requests_insert_requester` RLS policy also has no block exclusion clause. (See Security Finding SF-01.)

**Duplicate prevention:** `dalUpsertPendingRequest` uses upsert with unique constraint on `(requester_actor_id, target_actor_id)` → no duplicates. Old declined/cancelled rows are revived rather than duplicated.

**Notifications:** Created via `publishVcsmNotification` (app layer, not DB trigger). Raw `actorId` is embedded in `linkPath` as `/profile/${requesterActorId}`. (See Security Finding SF-06.)

**Blocked users:** Not prevented at app layer or DB layer.

---

### 3.2 Friend Request Accepted

**Entry:** `useFollowRequestActions.acceptRequest` → `ctrlAcceptFollowRequest`

1. Guards: missing ids, `assertingActorId !== targetActorId` (session ownership check ✅)
2. `dalGetRequestStatus` → must return `'pending'` to proceed
3. `dalInsertFollow` (upsert into `vc.actor_follows` — is_active: true)
4. `dalUpdateRequestStatus('accepted')`
5. Publishes `follow_request_accepted` notification with raw actorId linkPath

**DB trigger side effect:** `trg_sfr_apply_accept_to_actor_follows` (SECURITY DEFINER) fires AFTER the `status = 'accepted'` UPDATE and performs another upsert into `vc.actor_follows`. This is idempotent (upsert) but creates a double-write path. (See Architecture Finding AF-04.)

**Session-bound:** Yes — `assertingActorId !== targetActorId` throws at app layer before DB touch.

**Cache invalidation after accept:** `invalidateFeedFollowCache` is NOT called after accept. The requester's feed will not immediately show private posts from the accepted actor until the 60s follow cache expires. (See Security Finding SF-05.)

---

### 3.3 Friend Request Declined

**Entry:** `useFollowRequestActions.declineRequest` → `ctrlDeclineFollowRequest`

1. Guards: missing ids, `assertingActorId !== targetActorId` ✅
2. `dalGetRequestStatus` → must return `'pending'`
3. `dalUpdateRequestStatus('declined')`
4. No notification sent to requester on decline

**DB trigger:** `trg_sfr_apply_status_to_actor_follows` fires on status UPDATE → deactivates `vc.actor_follows` row if declining. Because no follow row exists at this point (request was only pending), the UPDATE matches 0 rows — idempotent.

---

### 3.4 Public Subscribe / Follow

**Entry:** `useFollowActorToggle` → `ctrlSubscribe`

When `relation.isPrivate === false` and state is NOT `FOLLOWING`:
1. `dalInsertFollow` (upsert vc.actor_follows, is_active: true)
2. `invalidateFollowerCount(followedActorId)`
3. `invalidateFeedFollowCache(followerActorId)` ✅
4. Publishes `follow` notification with raw actorId linkPath

**Block check:** None. `ctrlSubscribe` calls `ctrlGetFollowRelationshipState` which checks privacy, follow status, and request status — but NOT block status. A blocked actor or a user who has been blocked can freely follow a public actor. (See Security Finding SF-01.)

**Atomicity:** Single upsert — atomic at DB level.

**Cache invalidation:** Follow count and feed follow cache both invalidated ✅. Actor bundle cache NOT invalidated (30s TTL acceptable).

---

### 3.5 Private Subscribe Request

Covered in 3.1. Key difference from public subscribe:

- No immediate follow row is created
- `vc.social_follow_requests` row is created with status `'pending'`
- Notification sent to target actor
- The `dalGetRequestStatus` gate prevents sending duplicate requests to the same target while one is pending or accepted

---

### 3.6 Unsubscribe / Unfollow

**Entry:** `useFollowActorToggle` / `useUnsubscribeAction` → `ctrlUnsubscribe` (unsubscribe.controller.js)

Both hooks correctly import from `unsubscribe.controller.js`. The `ctrlUnsubscribe` in `follow.controller.js` (lines 101–123) is **dead code** — it is not imported by any hook. (See Architecture Finding AF-01.)

`ctrlUnsubscribe` (canonical, unsubscribe.controller.js):
1. Guards: missing ids, self-unfollow
2. `Promise.all([dalDeactivateFollow, dalUpdateRequestStatus('revoked')])` — parallel writes
3. `invalidateFollowerCount(followedActorId)` ✅
4. `invalidateFeedFollowCache(followerActorId)` ✅

**`dalUpdateRequestStatus('revoked')` behavior:** Updates all matching `(requester, target)` rows regardless of current status (no status filter in the UPDATE). The RLS policy `social_follow_requests_update_revoke_by_requester` requires current status = 'accepted', so for public follows with no request row, or with non-accepted request rows, the UPDATE matches 0 rows silently. For accepted-request follows, the revoke is applied. This is idempotent.

**DB trigger:** `trg_sfr_apply_status_to_actor_follows` fires but status = 'revoked' is not in `['declined','cancelled']`, so no follow deactivation is triggered by the trigger (the DAL already did it). Correct.

**`trg_reconcile_on_actor_follows`:** Fires on `is_active` → false UPDATE. Deletes from `vc.friend_ranks` where the unfollowed actor was ranked. ✅

**Private actor posts from feed:** Immediately removed because `invalidateFeedFollowCache` is called → next feed fetch excludes the unfollowed actor's private posts. ✅

**Idempotency:** `dalDeactivateFollow` sets `is_active = false` unconditionally — safe to call repeatedly.

---

### 3.7 Private Profile Gate

**Component:** `useProfileGate` (profiles/hooks/useProfileGate.js)

```javascript
const canView = !isPrivate || isSelf || isFollowing;
```

- Reads `isPrivate` from `dalGetActorPrivacy` (30s TTL cache, fail-closed → `isPrivate: true` if row missing or error)
- Reads `isFollowing` from `useFollowStatus` → `dalGetFollowStatus` (8s TTL cache)
- Correctly handles self-view

**PROBLEM — Block status is not checked.** If actor A blocks actor B (public or private), actor B can still navigate to A's profile page and the gate will grant `canView = true` (since A's profile may be public and B is not following → `canView = !false || false || false = true`). Profile header, bio, and meta remain visible. Posts may be filtered by DB-level RLS (vc.posts migration 20260510020000), but other profile data is not. (See Security Finding SF-02.)

**Direct URL access:** The gate logic runs in the hook, which is called from the View screen. No route-level guard enforces the gate for direct URL access — the gate is purely a React hook. A user who navigates directly to `/profile/<slug>` will run through the same hook. As long as the hook fires before content is shown, gate works. No evidence of prefetch bypassing the gate was found.

**`useActorPosts` privacy bypass:** `readActorPostsDAL` and `fetchPostsForActorDAL` do not apply a privacy filter. They load posts by `actorId` regardless of viewer relationship. Content visibility is entirely managed by `useProfileGate.canView` at the UI layer. If JS fails or race conditions occur on mount, posts could flash. DB-level RLS on vc.posts (migration 20260510020000) provides backstop — posts won't return from the DB for unauthorized viewers. ✅ for DB, ⚠️ for app-layer race window.

---

### 3.8 Feed Visibility

**Pipeline:** `fetchFeedPagePipeline` → `normalizeFeedRows` → `resolveFeedRowVisibilityModel`

Feed pipeline order:
1. DB fetch (`readFeedPostsPage`) — subject to `vc.posts` RLS (FORCE RLS ✅)
2. Actor bundle resolution (actors, profiles, vports, privacy settings)
3. App-layer block set + follow set construction
4. `normalizeFeedRows` filters and maps visible rows

**DB-layer block enforcement (vc.posts RLS):**
The `posts_select_actor_based` policy (migration 20260510020000) excludes posts where any active block exists in either direction between the viewer's actors and the post author. Requires migration 20260510010000 (`blocks_select_blocked`) for the "author blocked viewer" direction. Both migrations are present. ✅

**App-layer visibility logic (`resolveFeedRowVisibilityModel`):**
```
if blocked → hidden (reason: blocked_actor)
if actor missing → hidden (reason: missing_actor)
if vport → visible only if vport is active + not deleted
if user → visible only if public OR (isOwner OR isFollowing)
```

**Privacy toggle feed impact:** When an actor switches from public to private, their posts remain in the feed for viewers who have cached follow state (60s TTL). The `invalidateActorPrivacyCache` function exists in `actorPrivacy.dal.js` — UNVERIFIED whether the settings privacy toggle calls it. If not called, the 30s privacy cache means private posts remain visible for up to 30s to any viewer who loaded the actor bundle before the toggle.

**Post unfollowed private actor visibility:** `invalidateFeedFollowCache` is called on unsubscribe → next feed fetch excludes the actor's private posts. ✅

**Vport feed visibility gap:** No vc.posts RLS clause checks vport is_active. An inactive/deleted vport's posts are filtered at the app layer only (vportMap null check). If the actor bundle cache (30s TTL) has a stale vport entry, inactive vport posts could appear briefly.

---

### 3.9 Block Interaction

**Block path:** `useBlockActorAction` → `blockActorController` → `blockActorDAL` → `moderation.block_actor` RPC

The RPC (SECURITY DEFINER) handles server-side:
- Upsert into `moderation.blocks`
- Insert block event into `moderation.block_events`
- Deactivate `vc.actor_follows` in the blocked direction (UNVERIFIED exact SQL in RPC — comment in code states this is handled server-side)

The controller handles:
- `assertingActorId === blockerActorId` session ownership check ✅
- `invalidateFeedBlockCache(blockerActorId)` ✅

**Pending requests on block:** No cancellation of pending `social_follow_requests` rows occurs during block. If A had a pending request to B and B blocks A, the pending request row survives. (See Security Finding SF-01 and Database Finding DB-03.)

**Block prevents new follow requests:** NOT enforced at app layer or DB layer. (See Security Finding SF-01.)

**Can A follow B after blocking B?** Yes — no check prevents a blocker from following the blocked actor at either app or DB layer. This is an unusual but present gap.

**`vc.user_blocks` legacy table:** A trigger `trg_reconcile_on_user_blocks` on `vc.user_blocks` deletes from `vc.actor_follows` bidirectionally. The current block system uses `moderation.blocks`. The `vc.user_blocks` table appears to be a legacy artifact. (See Database Finding DB-04.)

**Block reversal (unblock):** Does NOT restore follows or friend ranks. Follows remain deactivated. User must manually re-follow. ✅ (expected behavior)

**Block cache invalidation:** Only the blocker's feed block cache is invalidated. The blocked actor's feed block cache is not explicitly busted — they will continue to see each other's posts in their feed until their cache expires (60s). DB-level RLS on vc.posts provides the definitive backstop. (Medium severity — acceptable with 60s window.)

---

## 4. Table and RLS Inventory

| Table | Schema | RLS Enabled | FORCE RLS | Notes |
|---|---|---|---|---|
| `actor_follows` | vc | ✅ | ❌ | No FORCE RLS — service_role can bypass |
| `social_follow_requests` | vc | ✅ | ❌ | No FORCE RLS |
| `actor_privacy_settings` | vc | ✅ | ❌ | No FORCE RLS |
| `posts` | vc | ✅ | ✅ | FORCE RLS active |
| `actor_owners` | vc | ✅ | ✅ | FORCE RLS active |
| `actors` | vc | ✅ | ✅ | FORCE RLS active |
| `blocks` | moderation | ✅ | UNVERIFIED | Policies: select_own, insert_own, update_own, select_blocked (new) |
| `block_events` | moderation | ✅ | UNVERIFIED | Policies: insert_own, select_own |
| `friend_ranks` | vc | UNVERIFIED | UNVERIFIED | Cleaned by DB trigger on unfollow |
| `user_blocks` | vc | UNVERIFIED | ❌ | Legacy table — may be orphaned |

### vc.actor_follows — RLS Policies

| Policy | Operation | Allows |
|---|---|---|
| `actor_follows.insert.self` | INSERT | follower_actor_id is owned by current user |
| `actor_follows.insert.self` duplicated by `actor_follows_insert_by_target_on_accept` | INSERT | followed_actor_id is owned by current user AND pending request exists |
| `actor_follows.select.self` | SELECT | follower OR followed is owned by current user |
| `actor_follows_select_public_subscriber_count` | SELECT | `is_active = true` — **NO actor restriction** |
| `actor_follows.update.self` | UPDATE | follower is owned by current user |
| `actor_follows_update_by_target_on_accept` | UPDATE | followed is owned by current user |

**`actor_follows_select_public_subscriber_count` is overly broad** — allows any authenticated user to enumerate any actor's complete follow graph. (See Security Finding SF-07.)

### vc.social_follow_requests — RLS Policies

| Policy | Operation | Allows |
|---|---|---|
| `social_follow_requests_insert_requester` | INSERT | requester_actor_id owned, status='pending', no self-follow |
| `social_follow_requests_select_participants` | SELECT | requester OR target is owned by current user |
| `social_follow_requests_update_by_target` | UPDATE | target owned, current status='pending', new status IN ('accepted','declined') |
| `social_follow_requests_update_cancel_by_requester` | UPDATE | requester owned, current status='pending', new status='cancelled' |
| `social_follow_requests_update_revive_by_requester` | UPDATE | requester owned, current status IN ('declined','cancelled'), new status='pending' |
| `social_follow_requests_update_revoke_by_requester` | UPDATE | requester owned, current status='accepted', new status='revoked' |
| `social_follow_requests_delete_safe` | DELETE | either participant is owned by current user |

**No block exclusion in `social_follow_requests_insert_requester`.** (See SF-01.)

### vc.actor_privacy_settings — RLS Policies

| Policy | Operation | Allows |
|---|---|---|
| `actor_privacy_settings_insert_owner` | INSERT | actor owned by current user |
| `actor_privacy_settings_select_owner_or_viewable` | SELECT | owner OR `vc.can_view_actor(actor_id)` |
| `actor_privacy_settings_update_owner` | UPDATE | actor owned by current user |

**No DELETE policy observed.** Orphan rows for deleted actors possible.

---

## 5. Cache and Invalidation Inventory

| Cache | Location | TTL | Key | Invalidation function | Called on write? |
|---|---|---|---|---|---|
| Privacy cache | `actorPrivacy.dal.js` | 30s | `actorId` | `invalidateActorPrivacyCache(actorId)` | UNVERIFIED on privacy toggle |
| Follow status (point) | `actorFollows.dal.js` | 8s | `follower:followed` | `followStatusCache.invalidate(key)` | ✅ after insert/deactivate |
| Feed follow graph | `feed.read.followRows.dal.js` | 60s | `viewerActorId` | `invalidateFeedFollowCache(viewerActorId)` | ✅ on follow/unfollow |
| Feed block rows | `feed.read.blockRows.dal.js` | 60s | `viewerActorId` | `invalidateFeedBlockCache(viewerActorId)` | ✅ on block/unblock |
| Follower count | `subscriberCount.dal.js` | UNVERIFIED | UNVERIFIED | `invalidateFollowerCount(actorId)` | ✅ on follow/unfollow |
| Actor bundle | `feed.read.actorsBundle.dal.js` | 30s | `actor:<actorId>` | `invalidateActorBundleEntry(actorId)` | Not called on privacy toggle |

**Cache invalidation gaps:**
1. `ctrlAcceptFollowRequest` does NOT call `invalidateFeedFollowCache` — requester's feed won't show accepted actor's private posts for up to 60s
2. Privacy toggle — `invalidateActorPrivacyCache` may not be called from the settings controller (UNVERIFIED)
3. Feed block cache populated with page-scoped data on cache miss, but used as global on cache hit — inconsistency (see KPF-03)

---

## 6. Security Findings

---

### SF-01 — Blocked actors can send follow requests and directly follow

**VENOM SECURITY FINDING**
- **Location:** `follow.controller.js:ctrlSubscribe`, `followRequests.controller.js:ctrlSendFollowRequest`, `followRequests.dal.js:social_follow_requests_insert_requester` RLS policy
- **Application Scope:** Public follow path and private follow request path
- **Current behavior:** `ctrlSubscribe` calls `ctrlGetFollowRelationshipState` to check privacy, follow status, and request status. No block check is performed at any point in the follow or request path. The DB `social_follow_requests_insert_requester` policy has no block exclusion.
- **Problem:** Actor A who has been blocked by actor B (or who has blocked B) can send B a follow request (private profile) or directly follow B (public profile). The block is semantically meaningless for the subscription relationship.
- **Why it matters:** A blocking user expects that the blocked actor cannot reach them via follow/notification. Block should prevent both directions of the follow relationship initiation.
- **Severity:** HIGH
- **Recommended mitigation:** In `ctrlSubscribe` and `ctrlSendFollowRequest`, call `checkBlockStatus(followerActorId, followedActorId)` before any write. If `isBlocked === true`, throw a user-facing error and abort. Add the same check to `social_follow_requests_insert_requester` RLS as a NOT EXISTS subquery on moderation.blocks.
- **Rationale:** Defense in depth requires both app-layer and DB-layer block enforcement on every write path.

---

### SF-02 — `useProfileGate` does not check block status

**VENOM SECURITY FINDING**
- **Location:** `profiles/hooks/useProfileGate.js:36`
- **Application Scope:** All profile page visits
- **Current behavior:** `canView = !isPrivate || isSelf || isFollowing`. Block status is never evaluated.
- **Problem:** If actor B blocks actor A and A's profile is public, A can visit B's profile page, see B's bio/header, and potentially see B's posts (until DB RLS filters them). Conversely, if A blocks B, navigating to B's public profile still shows their content.
- **Why it matters:** Block should produce a "blocked" screen for both directions, not just suppress the follow/message buttons.
- **Severity:** HIGH
- **Recommended mitigation:** Add `isBlocked` (from `useBlockStatus`) to `useProfileGate`. Set `canView = false` and return a `BlockedState` or generic "content unavailable" screen when either party has blocked the other.
- **Rationale:** Block must control profile-level access, not just feed-level filtering.

---

### SF-03 — `ctrlCancelFollowRequest` lacks session ownership assertion

**VENOM SECURITY FINDING**
- **Location:** `followRequests.controller.js:ctrlCancelFollowRequest` (line 136)
- **Application Scope:** Cancel outgoing follow request flow
- **Current behavior:** `ctrlCancelFollowRequest` takes `requesterActorId` and `targetActorId` but no `assertingActorId`. There is no app-layer check that the session user owns `requesterActorId`.
- **Problem:** Compare to `ctrlAcceptFollowRequest` and `ctrlDeclineFollowRequest` which both assert `assertingActorId === targetActorId`. Cancel has no equivalent guard. A malicious client could pass any `requesterActorId` and attempt to cancel someone else's request. DB RLS (`social_follow_requests_update_cancel_by_requester`) provides backup enforcement via actor_owners.
- **Why it matters:** App-layer ownership checks are defense-in-depth. Without them, any coding error in the hook layer (passing wrong actorId) could silently cancel another user's request.
- **Severity:** MEDIUM
- **Recommended mitigation:** Add `assertingActorId` parameter to `ctrlCancelFollowRequest`. Verify `assertingActorId === requesterActorId` before writing.
- **Rationale:** All request mutation controllers should assert session ownership at the app layer regardless of DB RLS.

---

### SF-04 — Pending follow request rows survive block

**VENOM SECURITY FINDING**
- **Location:** `block/controllers/blockActor.controller.js`, `block/dal/block.write.dal.js`
- **Application Scope:** Block flow
- **Current behavior:** `blockActorController` calls the `moderation.block_actor` RPC. The RPC deactivates `vc.actor_follows` (per code comment). However, no code cancels pending `vc.social_follow_requests` rows when a block is applied.
- **Problem:** If A sent a pending follow request to B, and B blocks A, the pending request row persists in `vc.social_follow_requests`. B may still see the pending request notification. When/if the block is removed, A's request is still pending and could be automatically accepted. This violates the expected semantics of a block.
- **Why it matters:** Stale pending request rows visible to the blocked actor constitute a privacy violation — the blocked actor can infer that they received a request from A.
- **Severity:** MEDIUM
- **Recommended mitigation:** In the `moderation.block_actor` RPC (or as a side-effect in the controller), UPDATE `vc.social_follow_requests` to set `status = 'cancelled'` WHERE `requester_actor_id = blocked_actor_id AND target_actor_id = blocker_actor_id AND status = 'pending'`. Also cancel requests in the reverse direction.
- **Rationale:** Block should be a complete relationship reset.

---

### SF-05 — `ctrlAcceptFollowRequest` does not invalidate feed follow cache

**VENOM SECURITY FINDING**
- **Location:** `followRequests.controller.js:ctrlAcceptFollowRequest` (lines 60–104)
- **Application Scope:** Follow request accept flow
- **Current behavior:** After inserting the follow row and updating the request status, no feed cache invalidation is performed.
- **Problem:** The requester's feed follow cache (60s TTL) does not know about the new follow relationship. For up to 60s, the requester's central feed will not show private posts from the newly accepted actor.
- **Why it matters:** From a UX standpoint, accepting a request and then immediately visiting the feed shows no new private content — misleading behavior. This is not a privacy violation (content is restricted, not leaked) but is a correctness gap.
- **Severity:** MEDIUM (UX correctness, not privacy-breaking)
- **Recommended mitigation:** Add `invalidateFeedFollowCache(requesterActorId)` and `invalidateFeedFollowCache(targetActorId)` after successful accept.
- **Rationale:** Accepting a follow should immediately propagate to feed visibility.

---

### SF-06 — Notification linkPaths use raw actor UUIDs

**VENOM SECURITY FINDING**
- **Location:** `follow.controller.js:79` (`/profile/${followerActorId}`), `followRequests.controller.js:53` (`/profile/${requesterActorId}`), `followRequests.controller.js:98` (`/profile/${targetActorId}`)
- **Application Scope:** Follow and follow-request notifications
- **Current behavior:** All three notification writers embed the raw actor UUID as the route parameter: `/profile/<uuid>`.
- **Problem:** The platform rule ("No raw IDs in public URLs") is violated. UUID-based profile URLs are less shareable, not human-readable, and leak internal identifiers.
- **Why it matters:** Platform consistency and the published no-raw-ids contract.
- **Severity:** LOW (no security impact; platform standards violation)
- **Recommended mitigation:** Resolve actor slug/username before publishing the notification. Use `buildActorCanonicalSlugController(actorId)` to get the human-readable slug and use `/profile/<slug>`.
- **Rationale:** All public-facing URL surfaces must use human-readable slugs.

---

### SF-07 — `actor_follows_select_public_subscriber_count` leaks full follow graph

**VENOM SECURITY FINDING**
- **Location:** `full_schema.sql:35638` — `CREATE POLICY actor_follows_select_public_subscriber_count ON vc.actor_follows FOR SELECT TO authenticated USING (is_active = true)`
- **Application Scope:** vc.actor_follows table
- **Current behavior:** Any authenticated user can SELECT any active follow row via this policy. There is no restriction on which actors' data can be read.
- **Problem:** A malicious authenticated user can enumerate the complete follow graph of any actor, including private actors. This reveals who follows whom even when those actors have private profiles.
- **Why it matters:** Private actor follow graphs are personal social data. A private actor's follower list should not be enumerable by strangers.
- **Severity:** MEDIUM
- **Recommended mitigation:** Drop `actor_follows_select_public_subscriber_count`. Instead of a broad SELECT, expose follower counts via a DB function or materialized view that returns only the count (not the actor IDs). If the UI only needs counts, a `count(*)` RPC would not expose individual follow edges.
- **Rationale:** The policy was likely added to support subscriber count queries, but it over-exposes individual follow relationship data.

---

## 7. Performance Findings

---

### KPF-01 — `ctrlGetFollowRelationshipState` makes 3 parallel DB calls on every render cycle

**KRAVEN PERFORMANCE FINDING**
- **Location:** `getFollowRelationshipState.controller.js` — called by `ctrlSubscribe` on every follow button interaction
- **Current behavior:** Three parallel promises (privacy, follow status, request status) each with their own cache. 8s follow status cache, 30s privacy cache, in-flight dedup on privacy.
- **Problem:** On first render with warm session but cold caches, every follow button triggers 3 DB round-trips.
- **Cost / impact:** Low for small follow graphs. Acceptable with cache warming. Primarily a concern for rapid sequential interactions.
- **Recommended mitigation:** Consider a single composite query that returns `{ is_private, is_following, request_status }` in one DB call. Cache the composite result with a shared key.

---

### KPF-02 — Feed follow graph fetches complete edge list on cache miss

**KRAVEN PERFORMANCE FINDING**
- **Location:** `feed.read.followRows.dal.js:readFeedFollowRowsDAL`
- **Current behavior:** On cache miss, fetches ALL rows from `vc.actor_follows` WHERE `follower_actor_id = viewerActorId AND is_active = true` — no actor ID filter. This is the correct behavior (per code comment) to avoid page-scoped cache misses.
- **Problem:** For power users with 5,000+ follows, this is a large payload on first load. The 60s TTL means it fires at most once per minute.
- **Cost / impact:** Medium for heavy users. Network + DB read cost on cold start.
- **Recommended mitigation:** Consider paginating the follow graph fetch or using a materialized set/count approach. Short-term: the 60s TTL is acceptable.

---

### KPF-03 — Feed block cache populated with page-scoped data, used as global

**KRAVEN PERFORMANCE FINDING**
- **Location:** `feed.read.blockRows.dal.js:readFeedBlockRowsDAL`
- **Current behavior:** On cache miss, the DAL fetches only blocks relevant to the current page's `actorIds`. It then stores the result in the cache keyed by `viewerActorId`. On subsequent pages, the cached data (page 1 actors) is filtered for page 2 actors — returning empty. The second page effectively has no app-layer block data. Follow DAL correctly fetches the full graph to avoid this.
- **Problem:** Inconsistency between follow cache (full graph) and block cache (page-scoped). Block filtering at the app layer is ineffective for actors not on the first page. DB-level RLS on vc.posts provides the safety backstop, but the app-layer `buildBlockedActorSetModel` will not catch these actors.
- **Cost / impact:** Minor — DB RLS compensates. Risk: if any UI path renders posts BEFORE the DB RLS filters them (e.g., optimistic update), blocked actors on page 2+ could briefly appear.
- **Recommended mitigation:** Align block cache with follow cache — on cache miss, fetch the full block graph (`WHERE blocker_actor_id = viewerActorId OR blocked_actor_id = viewerActorId AND status = 'active'`) and cache the complete set. Filter at read time from the complete cached set.

---

### KPF-04 — Double-write path on follow request accept (app + DB trigger)

**KRAVEN PERFORMANCE FINDING**
- **Location:** `followRequests.controller.js:ctrlAcceptFollowRequest` + `trg_sfr_apply_accept_to_actor_follows`
- **Current behavior:** `ctrlAcceptFollowRequest` writes to `vc.actor_follows` directly, then updates `social_follow_requests` status. The DB trigger `trg_sfr_apply_accept_to_actor_follows` fires on the status UPDATE and performs a second upsert into `vc.actor_follows`. Both writes are idempotent (upsert with onConflict).
- **Problem:** Two upserts to `vc.actor_follows` per accept operation. Negligible performance cost but indicates architectural ambiguity — is the write owned by the app or the trigger?
- **Cost / impact:** Low — one extra upsert. More a design concern than a perf bottleneck.
- **Recommended mitigation:** Choose one canonical write path. Option A: Remove `dalInsertFollow` from `ctrlAcceptFollowRequest` and rely entirely on the DB trigger. Option B: Remove the trigger and keep the app-layer write. Document the chosen path.

---

## 8. Architecture Findings

---

### AF-01 — Dead `ctrlUnsubscribe` in follow.controller.js

**ARCHITECTURE FINDING**
- **Location:** `social/friend/subscribe/controllers/follow.controller.js:101–123`
- **Boundary / layer:** Controller layer
- **Current behavior:** `follow.controller.js` exports a `ctrlUnsubscribe` function (lines 101–123). This function only calls `dalDeactivateFollow` — it does NOT call `dalUpdateRequestStatus`. Both `useFollowActorToggle` and `useUnsubscribeAction` import `ctrlUnsubscribe` from `unsubscribe.controller.js` instead.
- **Problem:** The `ctrlUnsubscribe` in `follow.controller.js` is unreachable dead code. It presents an incomplete implementation (missing `dalUpdateRequestStatus`) that could be accidentally imported in the future, leading to stale 'accepted' request rows.
- **Recommended mitigation:** Remove the `ctrlUnsubscribe` export from `follow.controller.js`. Redirect any future callers to `unsubscribe.controller.js`.

---

### AF-02 — `applyBlockSideEffects.js` is orphaned dead code

**ARCHITECTURE FINDING**
- **Location:** `block/helpers/applyBlockSideEffects.js`
- **Boundary / layer:** Helper layer
- **Current behavior:** Exports `deleteFriendRankRowsBetweenActors`. `blockActorController` does NOT call this function. The RPC-based block path handles follow deactivation server-side; the `trg_reconcile_on_actor_follows` trigger handles `friend_ranks` cleanup on follow deactivation.
- **Problem:** The file exists but is imported nowhere. Its presence implies client-side `friend_ranks` cleanup is needed, but the trigger handles it. Risk of future developers reinstating the client-side call and creating double cleanup.
- **Recommended mitigation:** Delete `applyBlockSideEffects.js` or add a comment that its logic is now handled by `trg_reconcile_on_actor_follows` and the `moderation.block_actor` RPC.

---

### AF-03 — Profile posts (`readActorPostsDAL`) bypasses privacy at the query level

**ARCHITECTURE FINDING**
- **Location:** `profiles/dal/readActorPosts.dal.js`
- **Boundary / layer:** DAL layer
- **Current behavior:** Fetches all posts for an `actorId` with no privacy, block, or follow filter. The query is guarded only by `useProfileGate.canView` at the hook/UI layer.
- **Problem:** The DAL violates the contract that "gates should be enforced as close to the data source as possible." An error in the hook gate allows raw post data to reach the UI. DB RLS on vc.posts provides the real backstop, but the app-layer gate is a single point of failure.
- **Recommended mitigation:** No DAL change required if DB RLS (vc.posts migration 20260510020000) is confirmed applied in production. Document that post privacy is enforced at the DB layer via RLS, not in this DAL.

---

### AF-04 — Dual accept write path (app + DB trigger) is architecturally ambiguous

**ARCHITECTURE FINDING**
- **Location:** `followRequests.controller.js:ctrlAcceptFollowRequest` + trigger `trg_sfr_apply_accept_to_actor_follows`
- **Boundary / layer:** Controller ↔ DB trigger boundary
- **Current behavior:** App writes to `vc.actor_follows` first, then updates `social_follow_requests`. The DB trigger then writes to `actor_follows` again on the status update. Both paths are idempotent.
- **Problem:** Architectural ambiguity — the controller relies on a specific ordering (write follow before updating status) that is not documented or enforced. A future refactor that reorders these calls could break the RLS policy dependency (`actor_follows_insert_by_target_on_accept` requires pending status at INSERT time).
- **Recommended mitigation:** Choose one path (see KPF-04). Add a code comment in `ctrlAcceptFollowRequest` explaining the ordering dependency.

---

### AF-05 — No block enforcement on `social_follow_requests` at DB layer

**ARCHITECTURE FINDING**
- **Location:** `social_follow_requests_insert_requester` RLS policy
- **Boundary / layer:** DB policy layer
- **Current behavior:** INSERT policy checks actor ownership, status='pending', and no self-follow. No block check.
- **Problem:** The DB is the last line of defense. If app-layer block checks are added (per SF-01), a future regression that removes the app check would allow blocked actors to create requests at the DB level.
- **Recommended mitigation:** Add a NOT EXISTS block check to `social_follow_requests_insert_requester`. See DB Review Item DB-01.

---

## 9. DB Review Items

---

### DB-01 — `social_follow_requests_insert_requester` missing block exclusion

**DATABASE REVIEW ITEM**
- **Object:** `vc.social_follow_requests` — `social_follow_requests_insert_requester` policy
- **Application Scope:** VCSM — follow request initiation
- **Current behavior:** Policy allows INSERT when requester owns the actor, status='pending', and no self-follow.
- **Problem:** Blocked actors can insert pending requests at the DB level.
- **Why it matters:** Block should be DB-enforced, not just app-enforced. Without DB enforcement, any regression in the app-layer block check allows blocked actors to flood targets with follow requests.
- **Recommended improvement:** Add a NOT EXISTS subquery checking `moderation.blocks`.
- **Rationale:** Defense in depth.
- **Risk if unchanged:** Blocked actors can circumvent app-layer block checks to spam follow requests.
- **Example SQL proposal (text only, do not run):**
```sql
DROP POLICY IF EXISTS social_follow_requests_insert_requester ON vc.social_follow_requests;

CREATE POLICY social_follow_requests_insert_requester
  ON vc.social_follow_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = social_follow_requests.requester_actor_id
        AND ao.user_id = auth.uid()
        AND ao.is_void = false
    )
    AND status = 'pending'
    AND requester_actor_id <> target_actor_id
    AND NOT EXISTS (
      SELECT 1 FROM moderation.blocks b
      WHERE b.status = 'active'
        AND b.blocker_domain = 'vc'
        AND b.blocked_domain = 'vc'
        AND (
          (b.blocker_actor_id = social_follow_requests.requester_actor_id
           AND b.blocked_actor_id = social_follow_requests.target_actor_id)
          OR
          (b.blocker_actor_id = social_follow_requests.target_actor_id
           AND b.blocked_actor_id = social_follow_requests.requester_actor_id)
        )
    )
  );
```

---

### DB-02 — `actor_follows_select_public_subscriber_count` leaks follow graph to all authenticated users

**DATABASE REVIEW ITEM**
- **Object:** `vc.actor_follows` — `actor_follows_select_public_subscriber_count` policy
- **Application Scope:** VCSM — follow count display, follow graph queries
- **Current behavior:** Any authenticated user can SELECT all active follow rows (no actor restriction).
- **Problem:** Individual follow relationships are private data. Private actors' follow edges should not be enumerable by strangers.
- **Why it matters:** GDPR and privacy expectations for private actors.
- **Recommended improvement:** Drop this policy. Create a DB function `vc.get_follower_count(p_actor_id uuid)` returning BIGINT that counts active follows. Grant EXECUTE to authenticated. Use this function for subscriber count display instead of a raw SELECT.
- **Rationale:** Counts are safe to expose; individual follow edges are not.
- **Risk if unchanged:** Follow graph enumeration for any actor by any authenticated user.
- **Example SQL proposal (text only, do not run):**
```sql
DROP POLICY IF EXISTS actor_follows_select_public_subscriber_count ON vc.actor_follows;

CREATE OR REPLACE FUNCTION vc.get_follower_count(p_actor_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT count(*)::bigint
  FROM vc.actor_follows
  WHERE followed_actor_id = p_actor_id
    AND is_active = true
$$;
```

---

### DB-03 — No cleanup of pending social_follow_requests on block

**DATABASE REVIEW ITEM**
- **Object:** `moderation.block_actor` RPC (UNVERIFIED exact SQL) + `vc.social_follow_requests`
- **Application Scope:** VCSM — block flow
- **Current behavior:** The block RPC deactivates `vc.actor_follows` but does not cancel pending `vc.social_follow_requests` rows.
- **Problem:** After a block, pending request rows survive. The blocked actor can see they had a pending request. If the block is lifted, the pending request immediately re-surfaces.
- **Why it matters:** Block must produce a complete relationship reset.
- **Recommended improvement:** In `moderation.block_actor` RPC, add an UPDATE to set `social_follow_requests.status = 'cancelled'` for any pending request in either direction between the two actors.
- **Rationale:** Clean block semantics.
- **Risk if unchanged:** Stale pending requests visible after block; requests re-surface on unblock without requester action.
- **Example SQL proposal (text only, do not run):**
```sql
-- Inside moderation.block_actor RPC body, add:
UPDATE vc.social_follow_requests
SET status = 'cancelled',
    updated_at = now()
WHERE status = 'pending'
  AND (
    (requester_actor_id = p_blocker_actor_id AND target_actor_id = p_blocked_actor_id)
    OR
    (requester_actor_id = p_blocked_actor_id AND target_actor_id = p_blocker_actor_id)
  );
```

---

### DB-04 — `vc.user_blocks` legacy table may be orphaned

**DATABASE REVIEW ITEM**
- **Object:** `vc.user_blocks` table + `trg_reconcile_on_user_blocks` trigger
- **Application Scope:** VCSM — block system
- **Current behavior:** `vc.user_blocks` has a trigger `trg_reconcile_on_user_blocks` that deletes from `vc.actor_follows` on INSERT. The current block system uses `moderation.blocks` via `moderation.block_actor` RPC. No app code appears to write to `vc.user_blocks`.
- **Problem:** If `vc.user_blocks` is orphaned, the trigger fires on inserts that never happen — dead code. If any code still writes to `vc.user_blocks`, it creates a parallel block system not covered by current block policies or the app's block status checks.
- **Why it matters:** A second block system creates inconsistency. A block recorded in `vc.user_blocks` would deactivate follows but not appear in `checkBlockStatus` (which reads `moderation.blocks`).
- **Recommended improvement:** Verify whether any code path writes to `vc.user_blocks`. If none, mark the table for deprecation. If some code does write to it, migrate those writes to `moderation.blocks`.
- **Rationale:** Single source of truth for the block system.
- **Risk if unchanged:** Parallel block tables, inconsistent block enforcement.
- **Example SQL proposal (text only, do not run):**
```sql
-- Verification query (read-only — do not run in production without review)
SELECT count(*) FROM vc.user_blocks;
-- If 0 and no app code writes to it, schedule deprecation:
-- DROP TRIGGER trg_reconcile_on_user_blocks ON vc.user_blocks;
-- DROP TABLE vc.user_blocks;
```

---

### DB-05 — `vc.actor_follows` and `vc.social_follow_requests` lack FORCE ROW LEVEL SECURITY

**DATABASE REVIEW ITEM**
- **Object:** `vc.actor_follows`, `vc.social_follow_requests`, `vc.actor_privacy_settings`
- **Application Scope:** VCSM — all social relationship tables
- **Current behavior:** RLS is ENABLED but not FORCED. Service role and postgres role bypass RLS.
- **Problem:** Any SECURITY DEFINER function that operates on these tables bypasses RLS, even if the function should enforce ownership. Triggers on actor_follows (which are SECURITY DEFINER) are an expected and necessary exemption — but any future function that inadvertently reads/writes these tables without explicit ownership checks would bypass all policies.
- **Why it matters:** FORCE RLS is a safety net that applies policies to all roles including superuser-equivalent roles in the Supabase context.
- **Recommended improvement:** Apply `FORCE ROW LEVEL SECURITY` to `vc.actor_follows`, `vc.social_follow_requests`, and `vc.actor_privacy_settings`. Verify existing SECURITY DEFINER triggers are not broken (triggers typically use SET ROLE or SET search_path to operate correctly under FORCE RLS).
- **Rationale:** Consistent with the pattern already applied to `vc.actor_owners` and `vc.posts`.
- **Risk if unchanged:** A future SECURITY DEFINER function or rogue server-side operation bypasses social relationship policies.
- **Example SQL proposal (text only, do not run):**
```sql
ALTER TABLE vc.actor_follows        FORCE ROW LEVEL SECURITY;
ALTER TABLE vc.social_follow_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE vc.actor_privacy_settings FORCE ROW LEVEL SECURITY;
```

---

### DB-06 — Privacy cache invalidation on settings write is UNVERIFIED

**DATABASE REVIEW ITEM**
- **Object:** `actorPrivacy.dal.js:invalidateActorPrivacyCache` + settings privacy write path
- **Application Scope:** VCSM — privacy toggle
- **Current behavior:** `dalGetActorPrivacy` caches privacy state for 30s. `invalidateActorPrivacyCache(actorId)` exists and must be called when a user toggles their profile from public to private or vice versa.
- **Problem:** It is not verified from this audit whether the settings privacy controller calls `invalidateActorPrivacyCache` after writing to `vc.actor_privacy_settings`. If it does not, visitors who had the old privacy state cached will see wrong visibility for up to 30s after the toggle.
- **Why it matters:** For a user switching from public to private, a 30s window where their profile appears public to other cached viewers is a privacy gap.
- **Recommended improvement:** Confirm that the settings privacy controller calls `invalidateActorPrivacyCache(actorId)` and also `invalidateActorBundleEntry(actorId)` (for the feed bundle cache which also reads privacy state) after any privacy setting write.
- **Rationale:** Cache invalidation must be wired at every write path.
- **Risk if unchanged:** 30s stale privacy state after toggle — private profile content briefly visible to previously-cached viewers.
- **Example SQL proposal:** N/A — app-layer issue.

---

## 10. Release Risk Summary

### CRITICAL
None identified (no path allows unauthorized data writes or privilege escalation at DB level; DB-level RLS on vc.posts is enforced).

### HIGH
| # | Finding | Location |
|---|---|---|
| SF-01 | Blocked actors can send follow requests and directly follow — no block check in subscribe/request paths | follow.controller.js, followRequests.controller.js, social_follow_requests RLS |
| SF-02 | Profile gate does not check block status — blocked users see blocked actor's profile content | useProfileGate.js |

### MEDIUM
| # | Finding | Location |
|---|---|---|
| SF-03 | `ctrlCancelFollowRequest` lacks app-layer session ownership assertion | followRequests.controller.js |
| SF-04 | Pending follow request rows survive block — not cancelled by block RPC | blockActor.controller.js, block_actor RPC |
| SF-05 | Accept follow request does not invalidate feed follow cache — 60s delay for requester to see private posts | followRequests.controller.js |
| SF-07 | `actor_follows_select_public_subscriber_count` leaks full follow graph to all authenticated users | vc.actor_follows RLS |
| KPF-03 | Feed block cache populated page-scoped, used as global — blocks for actors on pages 2+ miss app-layer filter | feed.read.blockRows.dal.js |
| AF-01 | Dead `ctrlUnsubscribe` in follow.controller.js — incomplete implementation risk | follow.controller.js |
| AF-05 | No block enforcement on `social_follow_requests` at DB layer | social_follow_requests RLS |
| DB-03 | No cleanup of pending social_follow_requests on block | moderation.block_actor RPC |
| DB-05 | actor_follows, social_follow_requests, actor_privacy_settings lack FORCE RLS | DB schema |
| DB-06 | Privacy cache invalidation on settings write UNVERIFIED | actorPrivacy.dal.js / settings controller |

### LOW
| # | Finding | Location |
|---|---|---|
| SF-06 | Notification linkPaths use raw actor UUIDs | follow.controller.js, followRequests.controller.js |
| KPF-01 | 3 parallel DB calls per follow button render on cold cache | getFollowRelationshipState.controller.js |
| KPF-02 | Feed follow graph fetches full edge list on cache miss | feed.read.followRows.dal.js |
| KPF-04 | Double-write path on accept (app + DB trigger) | followRequests.controller.js |
| AF-02 | `applyBlockSideEffects.js` orphaned dead code | block/helpers/ |
| AF-03 | Profile posts DAL bypasses privacy at query level (DB RLS compensates) | readActorPosts.dal.js |
| AF-04 | Accept dual write path architecturally ambiguous | followRequests.controller.js + DB trigger |
| DB-01 | social_follow_requests_insert_requester missing block exclusion | DB RLS |
| DB-02 | actor_follows_select_public_subscriber_count leaks follow graph | DB RLS |
| DB-04 | vc.user_blocks legacy table may be orphaned | DB schema |

---

## 11. Fix Plan

### Must Fix Before Release (HIGH findings)

1. **SF-01** — Add `checkBlockStatus(followerActorId, followedActorId)` to `ctrlSubscribe` and `ctrlSendFollowRequest`. Throw on `isBlocked === true`. Also add block exclusion to `social_follow_requests_insert_requester` RLS policy (see DB-01).

2. **SF-02** — Extend `useProfileGate` to include `useBlockStatus({ actorA: viewerActorId, actorB: targetActorId })`. Set `canView = false` when `isBlocked === true`. Render `<BlockedState />` or equivalent.

3. **AF-01** — Remove dead `ctrlUnsubscribe` from `follow.controller.js` to eliminate confusion risk before the codebase grows.

### Should Fix This Sprint (MEDIUM findings)

4. **SF-03** — Add `assertingActorId` parameter to `ctrlCancelFollowRequest` and verify session ownership.

5. **SF-04** + **DB-03** — Add pending request cancellation to the `moderation.block_actor` RPC (SQL proposal in DB-03).

6. **SF-05** — Add `invalidateFeedFollowCache(requesterActorId)` and `invalidateFeedFollowCache(targetActorId)` after successful `ctrlAcceptFollowRequest`.

7. **SF-07** + **DB-02** — Drop `actor_follows_select_public_subscriber_count` policy. Add `vc.get_follower_count(actor_id)` function (SQL proposal in DB-02).

8. **DB-05** — Apply `FORCE ROW LEVEL SECURITY` to `actor_follows`, `social_follow_requests`, `actor_privacy_settings`.

9. **DB-06** — Verify and wire `invalidateActorPrivacyCache` + `invalidateActorBundleEntry` in the settings privacy write controller.

10. **KPF-03** — Fix feed block cache to fetch full block graph (align with follow cache behavior).

### Can Defer (LOW findings)

11. **SF-06** — Resolve actor slug before embedding in notification linkPath.
12. **KPF-01/02** — Composite query for follow relationship state; follow graph pagination.
13. **KPF-04** / **AF-04** — Resolve app vs trigger write ownership for accept.
14. **AF-02** — Delete `applyBlockSideEffects.js`.
15. **AF-03** — Document that post privacy is enforced by DB RLS not the DAL.
16. **DB-04** — Verify and deprecate `vc.user_blocks` if orphaned.

---

## 12. Test Checklist

### Public Follow
- [ ] User A follows public user B → follow row created, A sees B's posts in feed immediately
- [ ] User A double-taps follow → idempotent, no duplicate rows
- [ ] Follow button shows "Unsubscribe" after follow
- [ ] Follower count increments

### Private Follow Request
- [ ] User A taps follow on private user B → request row created with status='pending', button shows "Requested"
- [ ] B sees incoming request in notifications / privacy settings
- [ ] A cannot re-send duplicate request while one is pending (returns early)
- [ ] After B declines → A's button resets to "Subscribe"
- [ ] After B's revive → A can re-request

### Accept Request
- [ ] B accepts A's request → follow row created, A's feed shows B's private posts (within 60s of cache expire)
- [ ] B cannot accept A's request using a different actor ID (assertingActorId check)
- [ ] Request row status = 'accepted'

### Decline Request
- [ ] B declines A's request → request row status = 'declined', no follow row created
- [ ] A can re-request after decline (revive path via upsert)

### Unfollow
- [ ] A unfollows B → `is_active = false` in actor_follows
- [ ] B's private posts disappear from A's feed on next load (feed follow cache busted)
- [ ] If B was private, request row status → 'revoked'
- [ ] Friend rank row for B removed from A's ranked list (via trigger)

### Block + Follow Interaction
- [ ] A blocks B → B's posts disappear from A's feed (DB RLS + app cache bust)
- [ ] A blocks B → follow rows deactivated in blocked direction (verify via DB query)
- [ ] A blocks B → B can no longer send A a follow request (currently FAILING per SF-01 — fix required)
- [ ] A blocks B → B sees A's profile as blocked, not just private (currently FAILING per SF-02 — fix required)
- [ ] A unblocks B → posts reappear after cache expire, follows not restored, B must re-request

### Private Profile Direct URL
- [ ] Unauthenticated user hits `/profile/<slug>` for private actor → gate denies, request to follow shown
- [ ] Authenticated non-follower hits private profile → gate denies content, profile header shown (fix per SF-02 if blocker)
- [ ] Authenticated follower hits private profile → content visible
- [ ] Owner visits own private profile → all content visible

### Feed Visibility After Privacy Toggle
- [ ] User A switches from public to private → within 30s, A's posts no longer visible to non-followers in their feed (requires privacy cache invalidation — verify DB-06)
- [ ] User A switches from private to public → A's posts appear in followers' feeds after cache expire

### Cache Invalidation After Writes
- [ ] Follow → `readFeedFollowRowsDAL` cache for viewer is busted
- [ ] Unfollow → same
- [ ] Block → `readFeedBlockRowsDAL` cache for blocker is busted
- [ ] Privacy toggle → `actorPrivacy.dal.js` cache for actor is busted (VERIFY DB-06)

---

## 13. Persistent Output Path

**Report written to:**
`zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_00-00_venom_friend-subscribe-private-profile-review.md`
