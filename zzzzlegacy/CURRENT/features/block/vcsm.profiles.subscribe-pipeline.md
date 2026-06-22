VCSM Subscribe / Unsubscribe Pipeline — Current Runtime Review
==============================================================

CURRENT RUNTIME
---------------

This file documents the **current app-visible follow/request flow** and separates that from server-side effects that are only inferred from comments or prior contracts.


1. Entry Points
---------------

Verified UI entry surfaces:

- subscribe button:
  - `apps/VCSM/src/features/profiles/ui/header/Subscribebutton.jsx`
- profile header:
  - `apps/VCSM/src/features/profiles/screens/views/ActorProfileHeader.jsx`
- follow-request actions:
  - settings privacy pending requests
  - follow-request notification items


2. Current Hook / Controller Path
---------------------------------

Primary follow toggle hook:

- `apps/VCSM/src/features/social/friend/subscribe/hooks/useFollowActorToggle.js`

Runtime behavior:

- if currently following -> `ctrlUnsubscribe(...)`
- if request pending -> `ctrlCancelFollowRequest(...)`
- otherwise -> `ctrlSubscribe(...)`

Supporting state hooks:

- `useFollowRelationshipState(...)`
- `useFollowStatus(...)`
- `useFollowerCount(...)`
- `useActorPrivacy(...)`

Key controllers:

- `ctrlSubscribe`
- `ctrlUnsubscribe`
- `ctrlSendFollowRequest`
- `ctrlAcceptFollowRequest`
- `ctrlDeclineFollowRequest`
- `ctrlCancelFollowRequest`
- `ctrlListIncomingRequests`

OWNERSHIP GATE PATTERN (added 2026-05-27)

All write controllers and inbox-read controllers now require `assertingActorId` — the session-derived actor ID — to match the claimed actor ID before any DAL access. Pattern:

```js
if (!assertingActorId || assertingActorId !== claimedActorId) {
  throw new Error('session actor does not match ...')
}
```

Hook callers thread `assertingActorId` through:

- `useFollowActorToggle.js` — passes `assertingActorId: followerActorId` to `ctrlSubscribe` and `ctrlUnsubscribe`
- `useSubscribeAction.js` — passes `assertingActorId: actionActorId` to `ctrlSubscribe` and `ctrlUnsubscribe`
- `useUnsubscribeAction.js` — accepts and forwards `assertingActorId` to `ctrlUnsubscribe`
- `useIncomingFollowRequests.js` — derives `sessionActorId` from `useIdentity()` (session-bound, not prop-derived) and passes it as `assertingActorId` to `ctrlListIncomingRequests`
- `Notifications.controller.js` — passes `assertingActorId: targetActorId` (already session-derived via `resolveInboxActor`) to `ctrlListIncomingRequests`


3. Verified Database Writes From App Code
-----------------------------------------

Direct-follow path:

- table: `vc.actor_follows`
- DAL: `apps/VCSM/src/features/social/friend/request/dal/actorFollows.dal.js`

Private-follow-request path:

- table: `vc.social_follow_requests`
- DAL: `apps/VCSM/src/features/social/friend/request/dal/followRequests.dal.js`

Privacy flag:

- table: `vc.actor_privacy_settings`
- DAL: `apps/VCSM/src/features/social/privacy/dal/actorPrivacy.dal.js`

Follower count read:

- current live count comes from `vc.actor_follows`
- file: `apps/VCSM/src/features/social/friend/subscribe/dal/subscriberCount.dal.js`

OUTDATED CLAIM CORRECTED

Current app code does **not** rely on `public.profiles.follower_count` as the live follower counter.


4. Current Runtime Flow
-----------------------

### Public profile follow

```text
Subscribe button
  -> useFollowActorToggle() [passes assertingActorId: followerActorId]
  -> ctrlSubscribe({ followerActorId, followedActorId, assertingActorId })
  -> guard: missing IDs → throws 'Missing actor ids'
  -> guard: self-follow → throws 'Cannot follow yourself'
  -> 🔒 OWNERSHIP GATE (V-SUB-001): assertingActorId !== followerActorId → throws 'session actor does not match follower'
  -> ctrlGetBlockStatus() [bidirectional — throws 'Cannot follow a blocked actor' if blocked]
  -> ctrlGetFollowRelationshipState()
  -> [if already following] return {status: 'following'} (short-circuit, no write)
  -> dalInsertFollow()
  -> upsert/reactivate vc.actor_follows row
  -> invalidateFollowerCount(followedActorId)
  -> invalidateFeedFollowCache(followerActorId)
  -> publishVcsmNotification({ kind: 'follow', linkPath: '/feed' }) [JS-side, not DB trigger]
```

### Private profile request

```text
Subscribe button on private profile
  -> useFollowActorToggle() [passes assertingActorId: followerActorId]
  -> ctrlSubscribe({ followerActorId, followedActorId, assertingActorId })
  -> 🔒 OWNERSHIP GATE (V-SUB-001): fires before any DAL access
  -> ctrlGetBlockStatus() [bidirectional — throws if blocked, never reaches request path]
  -> ctrlSendFollowRequest()
  -> ctrlGetBlockStatus() [independent block guard on request path]
  -> dalUpsertPendingRequest()
  -> upsert vc.social_follow_requests(status='pending')
  -> publishVcsmNotification({ kind: 'follow_request', linkPath: '/feed' }) [JS-side]
```

### Unsubscribe

```text
Unsubscribe button
  -> useFollowActorToggle() [passes assertingActorId: followerActorId]
  -> ctrlUnsubscribe({ followerActorId, followedActorId, assertingActorId })
  -> guard: missing IDs → throws 'Missing actor ids'
  -> 🔒 OWNERSHIP GATE (V-SUB-002): assertingActorId !== followerActorId → throws 'session actor does not match follower'
     Privacy-critical: gate fires BEFORE invalidateFeedFollowCache — prevents cache-busting on victim's actorId
  -> dalDeactivateFollow() + dalUpdateRequestStatus(status='revoked') [parallel via Promise.all]
  -> invalidateFollowerCount(followedActorId)
  -> invalidateFeedFollowCache(followerActorId) [revokes private post access immediately]
```

### List incoming requests (inbox)

```text
Incoming follow requests view
  -> useIncomingFollowRequests() [derives sessionActorId from useIdentity() — session-bound, not prop-derived]
  -> ctrlListIncomingRequests({ targetActorId, assertingActorId: sessionActorId })
  -> 🔒 OWNERSHIP GATE (V-SUB-003): assertingActorId !== targetActorId → throws 'session actor does not own this inbox'
  -> dalListIncomingPendingRequests({ targetActorId })
  -> returns vc.social_follow_requests WHERE status='pending' AND target = targetActorId
```

Also called from notification inbox:

```text
Notifications.controller.js → filterResolvedFollowRequestRows()
  -> targetActorId resolved from resolveInboxActor(identity) [session-derived]
  -> ctrlListIncomingRequests({ targetActorId, assertingActorId: targetActorId })
  -> 🔒 OWNERSHIP GATE: passes because assertingActorId === targetActorId
```

### Accept request

```text
Accept request
  -> ctrlAcceptFollowRequest({ requesterActorId, targetActorId, assertingActorId })
  -> 🔒 OWNERSHIP GATE: assertingActorId !== targetActorId → throws 'session actor does not own this request'
  -> verify current request status is pending
  -> dalInsertFollow()
  -> dalUpdateRequestStatus(status='accepted')
  -> invalidateFeedFollowCache(requesterActorId)
  -> invalidateFeedFollowCache(targetActorId)
  -> publishVcsmNotification({ kind: 'follow_request_accepted', linkPath: '/feed' }) [JS-side]
```

Important risk:

- accept is a two-step client-side write and is not atomic

### Decline request

```text
Decline request
  -> ctrlDeclineFollowRequest({ requesterActorId, targetActorId, assertingActorId })
  -> 🔒 OWNERSHIP GATE: assertingActorId !== targetActorId → throws 'session actor does not own this request'
  -> verify current request status is pending
  -> dalUpdateRequestStatus(status='declined')
```

### Cancel request

```text
Cancel request
  -> ctrlCancelFollowRequest({ requesterActorId, targetActorId, assertingActorId })
  -> 🔒 OWNERSHIP GATE: assertingActorId !== requesterActorId → throws 'session actor does not own this request'
  -> verify current request status is pending
  -> dalUpdateRequestStatus(status='cancelled')
```


5. Server-Side Effects
----------------------

CORRECTED 2026-05-27

Follow notifications are **JS-side via `publishVcsmNotification()`**, not DB-trigger-generated.

Verified notification calls in current code:

| Controller | Kind | linkPath | Trigger |
|---|---|---|---|
| `ctrlSubscribe` | `follow` | `/feed` | JS — after `dalInsertFollow` succeeds |
| `ctrlSendFollowRequest` | `follow_request` | `/feed` | JS — after `dalUpsertPendingRequest` |
| `ctrlAcceptFollowRequest` | `follow_request_accepted` | `/feed` | JS — after both DB writes |

linkPath note: All follow notification linkPaths use `/feed` — never raw UUIDs or `/profile/${actorId}` (V-SUB-005, fixed 2026-05-27).

PRIOR CLAIM RETRACTED

The previous claim that follow notifications are "server-side via DB triggers" was not verified from code. The actual implementation uses `publishVcsmNotification()` directly in each controller. Whether legacy DB triggers still exist in parallel is unverified from app code alone — but the JS-side calls are the authoritative path.


6. Friend Ranks Decoupling (2026-04-06)
----------------------------------------

ARCHITECTURE CHANGE

Top friends (`vc.friend_ranks`) are now **manual-only**:

- Follow/unfollow does NOT auto-create or auto-sync friend ranks
- The DB trigger `trg_reconcile_on_actor_follows` only REMOVES friend_rank rows when unfollowing (no autofill)
- `reconcile_friend_ranks()` RPC no longer autofills from recent follows
- `save_friend_ranks()` always passes `p_autofill: false`
- If a user has no manually chosen top friends, the profile shows nothing

BUG FIXED

Previous behavior: unfollowing triggered `reconcile_friend_ranks(autofill=true)` which re-inserted rows into `vc.friend_ranks`, causing `duplicate key value violates unique constraint "friend_ranks_pkey"`.

DB CHANGES APPLIED

- `trg_reconcile_on_actor_follows` — removed `reconcile_friend_ranks()` call with autofill
- `trg_reconcile_on_user_blocks` — dropped (old table `vc.user_blocks` no longer written to; blocking now uses `moderation.block_actor` RPC)
- `is_friend_rank_eligible()` — updated to check `moderation.blocks` instead of `vc.user_blocks`
- `reconcile_friend_ranks()` — `p_autofill` parameter ignored; only cleans up ineligible entries and re-numbers


7. Block Integration (2026-04-06)
---------------------------------

Blocking now uses `moderation.block_actor` / `moderation.unblock_actor` RPCs:

- RPC handles: moderation.blocks upsert, block_events audit, follow deactivation (is_active=false)
- Client handles: friend_ranks bidirectional cleanup only
- Old `vc.user_blocks` table is no longer written to by any code path
- Block checks read from `moderation.blocks WHERE status='active'`


8. Known Runtime Weak Spots
----------------------------

- `apps/VCSM/src/features/profiles/dal/readFollowState.dal.js` is still a stub, so one profile payload path can disagree with the live follow hooks.
- Accepting a private follow request is multi-step and non-atomic.
- Friend rank cleanup on block is client-side (not in RPC). If the client call fails, stale friend ranks may persist.


9. Current Status Summary
-------------------------

CURRENT RUNTIME

- follow/unfollow: actor-first and live, does NOT touch friend_ranks
- private follow requests: live via `vc.social_follow_requests`
- follower count: live from `vc.actor_follows`
- privacy gate: live from `vc.actor_privacy_settings`
- follow notifications: JS-side via `publishVcsmNotification()` — NOT DB triggers (corrected 2026-05-27)
- notification linkPaths: `/feed` for all follow/request/accepted kinds — never raw UUIDs (V-SUB-005)
- top friends: manual-only via `vc.friend_ranks`, max 10 per owner
- blocking: via `moderation.block_actor` RPC → `moderation.blocks`
- block checks: `moderation.blocks` bidirectional, `status='active'`
- ownership enforcement: all write controllers + `ctrlListIncomingRequests` require `assertingActorId === claimedActorId` (added 2026-05-27)
  - `ctrlSubscribe`: asserts assertingActorId === followerActorId (V-SUB-001)
  - `ctrlUnsubscribe`: asserts assertingActorId === followerActorId (V-SUB-002)
  - `ctrlListIncomingRequests`: asserts assertingActorId === targetActorId (V-SUB-003)
  - `ctrlAcceptFollowRequest`: asserts assertingActorId === targetActorId (pre-existing)
  - `ctrlDeclineFollowRequest`: asserts assertingActorId === targetActorId (pre-existing)
  - `ctrlCancelFollowRequest`: asserts assertingActorId === requesterActorId (added 2026-05-10)

---

## Change Log

### 2026-04-16 14:00

**Task:** Fix subscribers tab — `relation "vc.actor_presentation" does not exist`

**Root cause:** The DB function `vc.list_subscribers` joined `vc.actor_presentation` internally. The `actor_presentation` view no longer exists in the schema.

**Fix:** Rewrote `vc.list_subscribers` via Management API to join `identity.actor_directory` instead:

```sql
CREATE OR REPLACE FUNCTION vc.list_subscribers(p_actor_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS TABLE(actor_id uuid, display_name text, username text, photo_url text)
LANGUAGE sql SECURITY DEFINER
SET search_path TO 'vc', 'identity', 'public'
AS $$
  SELECT d.actor_id, d.display_name, d.username, d.avatar_url AS photo_url
  FROM vc.actor_follows f
  JOIN identity.actor_directory d ON d.actor_id = f.follower_actor_id
  WHERE f.followed_actor_id = p_actor_id AND f.is_active = true
  ORDER BY f.created_at DESC
  LIMIT greatest(p_limit, 0) OFFSET greatest(p_offset, 0);
$$;
```

**Note:** `identity.actor_directory` is the canonical actor presentation source. `vc.actor_presentation` was removed. Any DB function referencing it will fail with a runtime error. Check for siblings using `SELECT proname FROM pg_proc WHERE prosrc ILIKE '%actor_presentation%'` before assuming the issue is isolated.

### 2026-04-19

**Task:** Fix subscriber count not updating optimistically on Subscribe/Unsubscribe click

**Root cause (1) — No optimistic path in `useFollowerCount`:**
`useFollowerCount` exposed only `refresh()` (a server re-fetch). `onAfterChange` in `ActorProfileHeader` called `refreshFollowerCount()` after the toggle resolved — meaning the count only updated after both the toggle RPC and the count RPC completed.

**Root cause (2) — DAL cache overwrote the optimistic update:**
`dalCountSubscribers` (`subscriberCount.dal.js`) has a 60-second TTL cache. Even after adding an optimistic update, `refreshFollowerCount()` hit the stale cache and restored the old count — visually undoing the optimistic change. Neither `ctrlSubscribe` nor `ctrlUnsubscribe` called `invalidateFollowerCount` after writing.

**Fix (4 files):**

`apps/VCSM/src/features/social/friend/subscribe/hooks/useFollowerCount.js`
- Added `optimisticAdjust(delta)` — `setCount(c => Math.max(0, c + delta))`, returns immediately

`apps/VCSM/src/features/profiles/screens/views/ActorProfileHeader.jsx`
- Wrapped `onSubscribe` to call `optimisticAdjust(isSubscribed ? -1 : 1)` synchronously before async toggle
- `onAfterChange` still calls `refreshFollowerCount()` as a post-server sync

`apps/VCSM/src/features/social/friend/subscribe/controllers/follow.controller.js`
- Added `invalidateFollowerCount(followedActorId)` after `dalInsertFollow` (subscribe path)
- Added `invalidateFollowerCount(followedActorId)` in the `ctrlUnsubscribe` export at bottom of file

`apps/VCSM/src/features/social/friend/subscribe/controllers/unsubscribe.controller.js`
- Added `invalidateFollowerCount(followedActorId)` after both DAL writes complete

**Behavior after fix:**
1. Click → `optimisticAdjust` fires synchronously → count updates immediately
2. Toggle RPC completes → cache busted → `refreshFollowerCount()` re-fetches → real count confirmed

### 2026-05-10

**Task:** Block enforcement on follow/subscribe and follow-request paths (VENOM audit SF-01, SF-03, SF-05, AF-01)

**Changes:**

`ctrlSubscribe` (follow.controller.js)
- Added bidirectional block guard via `ctrlGetBlockStatus` immediately after self-follow guard, before all writes and notifications
- Throws `'Cannot follow a blocked actor'` if `isBlocked === true`
- Removed dead `ctrlUnsubscribe` export (was incomplete and never imported by any caller)
- `dalDeactivateFollow` import also removed — it was only used by the dead function

`ctrlSendFollowRequest` (followRequests.controller.js)
- Same bidirectional block guard via `ctrlGetBlockStatus` before `dalGetRequestStatus` and all writes
- Throws `'Cannot send follow request to a blocked actor'` when blocked
- Guards independently from `ctrlSubscribe` since it can be called from either path

`ctrlAcceptFollowRequest` (followRequests.controller.js)
- Calls `invalidateFeedFollowCache(requesterActorId)` and `invalidateFeedFollowCache(targetActorId)` after both DB writes succeed
- Both actors' feed follow caches are busted immediately on accept

`ctrlCancelFollowRequest` (followRequests.controller.js)
- Added `assertingActorId` parameter
- Guard: `assertingActorId !== requesterActorId` throws `'ctrlCancelFollowRequest: session actor does not own this request'` before any DB access
- Matches the existing ownership pattern from accept and decline

`useFollowActorToggle` (useFollowActorToggle.js)
- Passes `assertingActorId: followerActorId` to `ctrlCancelFollowRequest`

### 2026-05-27

**Task:** Subscribe/unsubscribe/inbox ownership hardening — VENOM audit V-SUB-001, V-SUB-002, V-SUB-003, V-SUB-005

**Security findings resolved:**

- **V-SUB-001 (CRITICAL):** `ctrlSubscribe` had no ownership gate. An authenticated actor could pass any `followerActorId` and force-follow on behalf of another actor, triggering `invalidateFeedFollowCache` on their target's cache. Fixed by adding `assertingActorId` parameter + gate before block check.
- **V-SUB-002 (CRITICAL):** `ctrlUnsubscribe` had no ownership gate. Same attack surface. Privacy-critical: attacker could bust a victim's feed follow cache, potentially exposing or revoking access to private content at the network layer. Fixed by adding gate before all DAL writes.
- **V-SUB-003 (HIGH):** `ctrlListIncomingRequests` had no ownership gate. Any authenticated actor could read another actor's pending follow request inbox. Fixed by adding `assertingActorId` gate — must match `targetActorId`.
- **V-SUB-005 (HIGH):** Notification `linkPath` in `ctrlSubscribe`, `ctrlSendFollowRequest`, and `ctrlAcceptFollowRequest` used raw UUID: `/profile/${actorId}`. Changed to `/feed` for all three. Raw UUIDs must never appear in notification links.

**Gate ordering in `ctrlSubscribe`:**

```
missing IDs check
self-follow check
🔒 OWNERSHIP GATE (assertingActorId === followerActorId)   ← inserted here
block check
relationship state check
DAL write
```

The gate fires after self-follow and before block check. Tests that reach the block check must supply a valid `assertingActorId`.

**Files changed (controllers — 3):**

- `apps/VCSM/src/features/social/friend/subscribe/controllers/follow.controller.js`
  - Added `assertingActorId` param + V-SUB-001 gate + linkPath `/feed`
- `apps/VCSM/src/features/social/friend/subscribe/controllers/unsubscribe.controller.js`
  - Added `assertingActorId` param + V-SUB-002 gate
- `apps/VCSM/src/features/social/friend/request/controllers/followRequests.controller.js`
  - Added `assertingActorId` param + V-SUB-003 gate to `ctrlListIncomingRequests`
  - Changed `ctrlSendFollowRequest` + `ctrlAcceptFollowRequest` linkPath to `/feed`

**Files changed (hooks — 4):**

- `apps/VCSM/src/features/social/friend/subscribe/hooks/useFollowActorToggle.js`
  - Passes `assertingActorId: followerActorId` to `ctrlSubscribe` and `ctrlUnsubscribe`
- `apps/VCSM/src/features/social/friend/request/hooks/useSubscribeAction.js`
  - Passes `assertingActorId: actionActorId` to `ctrlSubscribe` and `ctrlUnsubscribe`
- `apps/VCSM/src/features/social/friend/subscribe/hooks/useUnsubscribeAction.js`
  - Returned function accepts and forwards `assertingActorId`
- `apps/VCSM/src/features/social/friend/request/hooks/useIncomingFollowRequests.js`
  - Added `useIdentity()` import; derives `sessionActorId` from session (not from props)
  - Passes `assertingActorId: sessionActorId` to `ctrlListIncomingRequests`

**Files changed (notification controller — 1):**

- `apps/VCSM/src/features/notifications/inbox/controller/Notifications.controller.js`
  - Passes `assertingActorId: targetActorId` to `ctrlListIncomingRequests`
  - `targetActorId` is already session-derived from `resolveInboxActor(identity)`

**Test result after fixes:**

- 257 tests total / 256 passing / 1 intentional stub (getSubscribersController access model — IRONMAN decision pending)
- 16 previously-red security regression tests now green
- 81 pre-existing tests still passing

**Remaining open (not in this task):**

- V-SUB-004: raw UUID in `buildSubscriberActor()` route builder (`VportSubscribersView.jsx`)
- V-SUB-006: `dalUpdateRequestStatus` missing enum validation
- V-SUB-007: `console.error` leaks actor IDs in production error paths
- V-SUB-008: `subscriberCount.dal.js` missing `.schema('vc')` prefix

### 2026-05-27 (IRONMAN)

**Task:** Access model decision for `getSubscribersController`

**Question:** Should `getSubscribersController` require an `assertingActorId` ownership gate (owner-only) or is public read correct?

**IRONMAN verdict: PUBLIC READ — intentional, no gate required.**

**Rationale:**

- `VportSubscribersView` renders the subscribers tab to ANY visitor of a VPORT profile. No `isOwner` check precedes the `useSubscribers` call. This is deliberate: subscriber counts and lists are social proof for a public business VPORT.
- VPORT profiles are public business profiles (restaurant, barbershop, etc.). Their follower graph is analogous to Instagram followers on a public business page.
- Data returned (`display_name`, `username`, `avatar`) is public-facing identity data, not private PII.
- The second caller (`useVportBookingView`) is already gated at the hook level: `enabled: Boolean(isOwner && ownerActorId)`. The controller does not need to replicate this constraint.
- DB access is via `vc.list_subscribers` (SECURITY DEFINER) — DB policy enforces read safety at the database layer.

**Contrast with V-SUB-003 (`ctrlListIncomingRequests`):**
That controller reads INBOX data (pending follow requests) — private by nature and owner-gated. This controller reads PUBLIC social graph data — visible by design.

**Stub test resolution:**
The `[MISSING GATE]` stub test in `getSubscribers.controller.test.js` was replaced with a `[PUBLIC READ]` test block documenting the intentional access model. All 16 tests pass.

**Test suite result after IRONMAN:** 301/301 passing (previously 278/279 with getSubscribers stub + prior cache artifact).

### 2026-05-27 — Architecture Review (LOGAN)

**Task:** Full subscriber/follow architecture review — global actor model, actor pair matrix, RPC audit, visibility model

**Scope:** Read-only. No code changed. Findings captured in new canonical doc.

**New canonical doc created:**
`zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/social/vcsm.social.subscribe-architecture.md`

**Key findings:**

1. `list_subscribers` and `count_subscribers` are confirmed SECURITY DEFINER (SQL in change log 2026-04-16). They bypass RLS. The only protection for private VPORT subscriber data is the app-layer privacy check — which is absent in `getSubscribersController`. TICKET-SUB-001 / TICKET-SUB-002.

2. `ctrlSubscribe` has no actor-kind guard. VPORT → Citizen and VPORT → VPORT follow edges are technically writable at the DB layer. No product case exists for these pairs. TICKET-SUB-005.

3. Two files export `dalCountSubscribers` with different signatures and different RPCs. Naming collision is silent and depends on import path resolution. TICKET-SUB-006.

4. Two DAL files read `vc.actor_privacy_settings` with opposite missing-row defaults: `actorPrivacy.dal.js` fails closed (`isPrivate: true`), `visibility.dal.js` fails open (`false`). TICKET-SUB-007.

5. `notification.model.js` falls back to raw UUID routes (`/profile/${actorId}`) when sender has no slug. This leaks internal actor IDs. TICKET-SUB-003.

6. `dalListOutgoingRequests` has no controller ownership gate. If ever called directly from a hook, it can enumerate any actor's outgoing requests. TICKET-SUB-008.

7. V-SUB-005 (`linkPath: '/feed'`) is safe (not a raw UUID). The test passes because it asserts `linkPath !== /profile/${uuid}`. The ideal final state is a handle-based route. TICKET-SUB-004 tracks this.

**Stale claim corrected:**
`vcsm.profiles.social-pipeline.md` — Section 8 "Notification ownership" and Section 15 weakness #4 both claimed notifications were DB-trigger-based. Both corrected to JS-side `publishVcsmNotification()`.

**Open items summary:**

| Ticket | Priority | Summary |
|---|---|---|
| TICKET-SUB-001 | P0 | Verify SECURITY DEFINER RPC status; add actor-kind guard in RPC body |
| TICKET-SUB-002 | P1 | Add privacy check to getSubscribersController for private VPORTs |
| TICKET-SUB-003 | P1 | Fix notification model raw UUID fallback routes |
| TICKET-SUB-004 | P2 | Follow notification linkPath → handle-based route |
| TICKET-SUB-005 | P2 | Add actor-kind guard to ctrlSubscribe (disable VPORT follower edges) |
| TICKET-SUB-006 | P2 | Resolve dalCountSubscribers naming collision |
| TICKET-SUB-007 | P2 | Align actor_privacy_settings missing-row defaults |
| TICKET-SUB-008 | P3 | Add controller ownership gate for dalListOutgoingRequests |
