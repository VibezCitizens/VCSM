# Architecture Map: Private Profile & Block/Follow Enforcement
**Date:** 2026-05-10
**Scope:** apps/VCSM — block system, follow system, privacy enforcement, feed visibility
**Mode:** Read-only audit. No files were modified.

---

## 1. File Inventory

### Block System

| File | Layer | Role |
|------|-------|------|
| `features/block/dal/block.check.dal.js` | DAL | Point-in-time status check on `moderation.blocks` |
| `features/block/dal/block.read.dal.js` | DAL | Set-based reads from `moderation.blocks` (`fetchActorsIBlocked`, `fetchActorsWhoBlockedMe`, `fetchBlockGraph`, `filterBlockedActors`) |
| `features/block/dal/block.write.dal.js` | DAL | RPC calls: `moderation.block_actor`, `moderation.unblock_actor`, `toggleBlockActor` |
| `features/block/helpers/applyBlockSideEffects.js` | Helper | Client-side `vc.friend_ranks` cleanup (only side effect not in RPC) |
| `features/block/controllers/blockActor.controller.js` | Controller | Block/unblock/toggle with idempotency check, calls side effects |
| `features/block/controllers/getBlockStatus.controller.js` | Controller | Thin wrapper: delegates to `checkBlockStatus` DAL |
| `features/block/controllers/getBlockedActorSet.controller.js` | Controller | Thin wrapper: delegates to `filterBlockedActors` DAL |
| `features/block/hooks/useBlockActions.js` | Hook | `block` / `unblock` UI actions |
| `features/block/hooks/useBlockActorAction.js` | Hook | Single-action hook wrapping `blockActorController` |
| `features/block/hooks/useBlockStatus.js` | Hook | Loads block status; derives `canViewProfile` + `canInteract` |
| `features/block/guards/BlockGate.jsx` | Component | Render gate — shows fallback when `canViewProfile` is false |
| `features/block/ui/BlockButton.jsx` | Component | UI trigger |
| `features/block/ui/BlockConfirmModal.jsx` | Component | Confirmation dialog |
| `features/block/ui/BlockedState.jsx` | Component | Blocked state display |
| `features/block/index.js` | Index | Public export surface for the block subsystem |
| `features/block/adapters/hooks/useBlockActorAction.adapter.js` | Adapter | Re-export of `useBlockActorAction` |
| `features/block/adapters/hooks/useBlockStatus.adapter.js` | Adapter | Re-export of `useBlockStatus` |
| `features/block/adapters/ui/BlockConfirmModal.adapter.js` | Adapter | Re-export of `BlockConfirmModal` |
| `features/block/adapters/ui/ActorActionsMenu.jsx` | Adapter | Cross-feature menu entry point |
| `features/moderation/dal/moderationActions.dal.js` | DAL | `moderation.actions` writes + reads (hide, unhide, conversation cover) |
| `features/moderation/dal/reports.dal.js` | DAL | `moderation.reports` and `moderation.report_events` writes |
| `features/moderation/dal/reports.read.dal.js` | DAL | `moderation.reports` reads |
| `features/moderation/dal/assertModerationAccess.dal.js` | DAL | Authorization check for moderator role |
| `features/moderation/controllers/moderationActions.controller.js` | Controller | Admin hide/dismiss report flows |
| `features/moderation/controllers/postVisibility.controller.js` | Controller | User-level "hide post for me" + "unhide post for me" |
| `features/settings/privacy/dal/blocks.dal.js` | DAL | Settings-scoped `moderation.blocks` reads/writes (via same RPCs) |
| `features/settings/privacy/controller/Blocks.controller.js` | Controller | Settings UI: list/block/unblock actors |
| `features/settings/privacy/models/blocks.model.js` | Model | Domain translation of raw block rows |
| `features/notifications/inbox/dal/blocks.read.dal.js` | DAL | Notification feed block filtering reads |
| `features/notifications/inbox/lib/blockFilter.js` | Lib | Filter utility: removes blocked actors from notification rows |

### Follow System

| File | Layer | Role |
|------|-------|------|
| `features/social/friend/request/dal/actorFollows.dal.js` | DAL | `vc.actor_follows` insert, deactivate, status read (SSOT for follow writes) |
| `features/social/friend/request/dal/followRequests.dal.js` | DAL | `vc.social_follow_requests` upsert, status read, list |
| `features/social/friend/subscribe/dal/subscriberCount.dal.js` | DAL | Follower count read + `invalidateFollowerCount()` |
| `features/social/friend/subscribe/controllers/follow.controller.js` | Controller | `ctrlSubscribe` — privacy-aware follow: public direct insert OR send request; `ctrlUnsubscribe` |
| `features/social/friend/subscribe/controllers/unsubscribe.controller.js` | Controller | Unsubscribe wrapper |
| `features/social/friend/subscribe/controllers/getFollowStatus.controller.js` | Controller | Thin wrapper: `dalGetFollowStatus` |
| `features/social/friend/subscribe/controllers/getFollowRelationshipState.controller.js` | Controller | Composite: privacy + follow status + request status → relation state |
| `features/social/friend/subscribe/controllers/getFollowerCount.controller.js` | Controller | Follower count |
| `features/social/friend/request/controllers/followRequests.controller.js` | Controller | Send/accept/decline/cancel follow requests |
| `features/social/friend/subscribe/model/followRelationState.model.js` | Model | `FOLLOW_RELATION_STATES` enum + resolvers |
| `features/social/friend/request/models/followRequest.model.js` | Model | Follow request domain shape |
| `features/social/friend/subscribe/hooks/useFollowStatus.js` | Hook | Reads `vc.actor_follows` via controller |
| `features/social/friend/subscribe/hooks/useFollowActorToggle.js` | Hook | Toggle follow/unfollow/cancel-request |
| `features/social/friend/subscribe/hooks/useUnsubscribeAction.js` | Hook | Unsubscribe action |
| `features/social/friend/subscribe/hooks/useFollowerCount.js` | Hook | Follower count |
| `features/social/friend/request/hooks/useFollowRequestStatus.js` | Hook | Request status polling |
| `features/social/friend/request/hooks/useSubscribeAction.js` | Hook | Full subscribe/unsubscribe with gate invalidation |
| `features/social/friend/request/hooks/useSendFollowRequest.js` | Hook | Thin factory hook |
| `features/social/friend/request/hooks/useFollowRequestActions.js` | Hook | Accept/decline incoming requests |
| `features/social/friend/request/hooks/useIncomingFollowRequests.js` | Hook | List incoming pending requests |
| `features/social/friend/request/hooks/useSocialFollowRequestOps.js` | Hook | Higher-level ops |
| `features/social/adapters/friend/subscribe/hooks/useFollowStatus.adapter.js` | Adapter | Re-export |
| `features/social/adapters/friend/subscribe/hooks/useFollowActorToggle.adapter.js` | Adapter | Re-export |
| `features/social/adapters/friend/request/hooks/useSendFollowRequest.adapter.js` | Adapter | Re-export |
| `features/social/adapters/friend/request/hooks/useSubscribeAction.adapter.js` | Adapter | Re-export |

### Privacy System

| File | Layer | Role |
|------|-------|------|
| `features/social/privacy/dal/actorPrivacy.dal.js` | DAL | `vc.actor_privacy_settings` read; 30s TTL cache; `invalidateActorPrivacyCache()` |
| `features/social/privacy/controllers/getActorPrivacy.controller.js` | Controller | Thin delegation wrapper |
| `features/social/privacy/hooks/useActorPrivacy.js` | Hook | Effect-based privacy loading |
| `features/social/adapters/privacy/hooks/useActorPrivacy.adapter.js` | Adapter | Re-export |
| `features/settings/privacy/dal/visibility.dal.js` | DAL | Privacy settings writes (toggle `vc.actor_privacy_settings`) |

### Feed Visibility

| File | Layer | Role |
|------|-------|------|
| `features/feed/dal/feed.read.blockRows.dal.js` | DAL | `moderation.blocks` batch read for feed; 60s TTL cache; `invalidateFeedBlockCache()` |
| `features/feed/dal/feed.read.followRows.dal.js` | DAL | `vc.actor_follows` batch read for feed; 60s TTL cache; `invalidateFeedFollowCache()` |
| `features/feed/dal/feed.read.actorsBundle.dal.js` | DAL | `vc.actors` + `profiles` + `vc.actor_privacy_settings` + `vport.profiles` batch read; 30s per-actor TTL cache |
| `features/feed/dal/feed.read.posts.dal.js` | DAL | `vc.posts` paginated read |
| `features/feed/dal/feed.read.hiddenPosts.dal.js` | DAL | `moderation.actions` hidden post set for viewer |
| `features/feed/model/feedBlockVisibility.model.js` | Model | `buildBlockedActorSetModel` + `isActorBlockedForViewerModel` |
| `features/feed/model/feedFollowVisibility.model.js` | Model | `buildFollowedActorSetModel` + `isActorFollowedByViewerModel` |
| `features/feed/model/feedPrivateVisibility.model.js` | Model | `canViewPrivateFeedActorModel` — 3-condition gate |
| `features/feed/model/feedRowVisibility.model.js` | Model | Orchestrates all 5 visibility checks (see Section 3) |
| `features/feed/model/normalizeFeedRows.model.js` | Model | Filters invisible rows via `resolveFeedRowVisibilityModel` then normalizes shapes |
| `features/feed/pipeline/fetchFeedPage.pipeline.js` | Pipeline | Parallel DAL fan-out; feeds all data into `normalizeFeedRows` |
| `features/feed/hooks/useCentralFeed.js` | Hook | Central feed state management |
| `features/feed/hooks/useCentralFeedActions.js` | Hook | Feed action handlers (block, follow, report, hide, delete) |
| `features/feed/screens/CentralFeedScreen.jsx` | Screen | Feed entry point |

### Profile Screen

| File | Layer | Role |
|------|-------|------|
| `features/profiles/hooks/useProfileGate.js` | Hook | Combines `useActorPrivacy` + `useFollowStatus` → `canView` |
| `features/profiles/hooks/useProfileView.js` | Hook | React Query loader for profile data |
| `features/profiles/dal/readActorProfile.dal.js` | DAL | `vc.read_actor_profile` RPC + `vc.actor_privacy_settings`; 30s TTL cache |
| `features/profiles/dal/readFollowState.dal.js` | DAL | **STUB — always returns `{ is_active: false }`** |
| `features/profiles/controller/getProfileView.controller.js` | Controller | Loads actor profile + follow state (stub) |
| `features/profiles/screens/views/ActorProfileViewScreen.jsx` | Screen | Profile view; runs `useProfileGate` + `useBlockStatus`; navigates to `/feed` if blocked |

---

## 2. Dependency Trace: Block Write → Feed Visibility

```
User taps "Block" on a post menu
  → useCentralFeedActions.handleBlockActor
    → useBlockActorAction (adapter re-export)
      → blockActorController (features/block/controllers/blockActor.controller.js)
        → checkBlockStatus (block.check.dal.js)         -- idempotency guard
        → blockActorDAL (block.write.dal.js)
          → supabase.rpc("moderation.block_actor")      -- server: inserts moderation.blocks,
                                                        -- deactivates vc.actor_follows (both directions),
                                                        -- inserts block_event
        → deleteFriendRankRowsBetweenActors             -- client: deletes vc.friend_ranks rows

  After block completes:
  → useCentralFeedActions.setPosts(optimistic filter)   -- immediate: removes posts from UI
  → useCentralFeedActions.fetchPosts(true)              -- re-fetches feed page

  On next feed fetch:
  → fetchFeedPagePipeline
    → readFeedBlockRowsDAL({ viewerActorId, actorIds }) -- reads moderation.blocks (60s TTL)
      → buildBlockedActorSetModel                       -- builds Set<actorId>
      → normalizeFeedRows
        → resolveFeedRowVisibilityModel (per row)
          → isActorBlockedForViewerModel                -- blockedActorSet.has(rowActorId)
          → returns { visible: false, reason: "blocked_actor" } for blocked actors
        → filter(visibility.visible)                    -- blocked posts removed
```

**Cache invalidation gap:** `invalidateFeedBlockCache()` is exported from `feed.read.blockRows.dal.js` but **is never called** after a block action. The feed relies on the 60s TTL expiring naturally. Blocks take up to 60s to propagate to future feed pages if the viewer scrolls to page 2+ without a full refetch.

---

## 3. Feed Visibility Model — 5-Step Chain

`resolveFeedRowVisibilityModel` in `feedRowVisibility.model.js`:

**Step 1 — Block check (bidirectional)**
```
isActorBlockedForViewerModel({ actorId: rowActorId, blockedActorSet })
→ returns { visible: false, reason: "blocked_actor" } if blocked
```

**Step 2 — Actor existence check**
```
actorMap[rowActorId]
→ returns { visible: false, reason: "missing_actor" } if not in bundle
```

**Step 3 — Vport path (bypasses privacy)**
```
if actor.vport_id → vportMap[rowActorId]
  → { visible: false, reason: "missing_vport_profile" } if not in vport map
  → { visible: isActive, reason: "visible_vport" | "inactive_vport" } based on is_active/is_deleted
  (NOTE: vports are never subject to follow-gated privacy)
```

**Step 4 — User profile existence check**
```
profileMap[actor.profile_id]
→ returns { visible: false, reason: "missing_profile" } if not in bundle
```

**Step 5 — Privacy gate**
```
isActorFollowedByViewerModel({ actorId, followedActorSet })
isOwner = actor.id === viewerActorId
isPrivate = Boolean(profile.private)   ← sourced from vc.actor_privacy_settings via actorsBundle

canViewPrivateFeedActorModel({ isPrivate, isOwner, isFollowing })
  → if !isPrivate → true
  → if isOwner    → true
  → if isFollowing → true
  → else          → false

→ returns { visible: canView, reason: "visible_user" | "private_not_following" }
```

---

## 4. Dependency Trace: Privacy Setting → Feed Visibility

```
vc.actor_privacy_settings
  ↓ read by feed.read.actorsBundle.dal.js
    supabase.schema('vc').from('actor_privacy_settings').select('actor_id, is_private')
      → merged into profileMap[profile_id].private = actorPrivacyMap.get(actor.id)
      → cached per-actor at 30s TTL in bundleCache

  ↓ consumed by normalizeFeedRows
    → resolveFeedRowVisibilityModel
      → isPrivate = Boolean(profile.private)
      → canViewPrivateFeedActorModel({ isPrivate, isOwner, isFollowing })

  ↓ also read (separately) by features/social/privacy/dal/actorPrivacy.dal.js
    → dalGetActorPrivacy → ctrlGetActorPrivacy → useActorPrivacy → useProfileGate
    → this is the profile screen enforcement path, independent from feed
```

**Two separate reads of actor_privacy_settings exist:**
1. `feed.read.actorsBundle.dal.js` — batch read for feed, per-actor 30s TTL
2. `social/privacy/dal/actorPrivacy.dal.js` — per-actor read for profile gate, 30s TTL

These caches are separate and not shared. A privacy toggle will stale both independently within their TTL windows.

---

## 5. Dependency Trace: Follow Action → Feed Visibility

```
User taps Subscribe on profile header
  → useSubscribeAction.onClick
    → ctrlSubscribe (follow.controller.js)
      → ctrlGetFollowRelationshipState        -- checks privacy + current follow + request status
        → ctrlGetActorPrivacy                 -- reads vc.actor_privacy_settings (30s TTL cache)
        → ctrlGetFollowStatus                 -- reads vc.actor_follows
        → ctrlGetFollowRequestStatus          -- reads vc.social_follow_requests

      if isPrivate:
        → ctrlSendFollowRequest               -- upserts vc.social_follow_requests (status: pending)
        → publishVcsmNotification (follow_request)
        → returns { mode: 'request', status: 'pending' }
        (feed visibility unchanged until request accepted)

      if !isPrivate:
        → dalInsertFollow                     -- upserts vc.actor_follows (is_active: true)
        → invalidateFollowerCount             -- busts subscriber count cache
        → publishVcsmNotification (follow)
        → returns { mode: 'follow', status: 'following' }

After public follow:
  → useSubscribeAction triggers onAfterChange
  → useProfileGate re-evaluates (canView becomes true for private profile)
  → Feed: next page fetch reads vc.actor_follows via readFeedFollowRowsDAL
    → followedActorSet now contains the new followedActorId
    → canViewPrivateFeedActorModel → true → posts now visible

NOTE: invalidateFeedFollowCache() is never called after follow. Feed follow state
      takes up to 60s (TTL) to reflect on page 2+ of an open feed session.
```

---

## 6. Dependency Trace: Follow Request Accept → Feed Visibility

```
Private actor receives follow request notification
  → useFollowRequestActions.acceptRequest
    → ctrlAcceptFollowRequest (followRequests.controller.js)
      → dalGetRequestStatus                   -- guard: must be 'pending'
      → dalInsertFollow                       -- inserts vc.actor_follows (is_active: true)
      → dalUpdateRequestStatus (status: 'accepted')
      → publishVcsmNotification (follow_request_accepted)

After acceptance:
  → requester's feed: next page fetch reads updated vc.actor_follows
  → feedFollowVisibility includes requester in followedActorSet
  → private poster's posts become visible in requester's feed
  → profile gate: useFollowStatus returns true → canView = true
```

---

## 7. Cross-Feature Boundary Analysis

### Compliant (via adapters)

| Consumer | Import Path | Notes |
|----------|-------------|-------|
| `feed/hooks/useCentralFeedActions.js` | `@/features/block/adapters/hooks/useBlockActorAction.adapter` | Correct adapter path |
| `feed/hooks/useCentralFeedActions.js` | `@/features/social/adapters/friend/subscribe/hooks/useFollowActorToggle.adapter` | Correct |
| `feed/hooks/useCentralFeedActions.js` | `@/features/moderation/adapters/hooks/useHidePostForActor.adapter` | Correct |
| `profiles/screens/views/ActorProfileViewScreen.jsx` | `@/features/profiles/adapters/ui/actorProfileScreenDependencies.adapter` | Correct aggregation adapter |
| `profiles/hooks/useProfileGate.js` | `@/features/social/adapters/friend/subscribe/hooks/useFollowStatus.adapter` | Correct |
| `profiles/hooks/useProfileGate.js` | `@/features/social/adapters/privacy/hooks/useActorPrivacy.adapter` | Correct |

### Violations (direct cross-feature imports bypassing adapters)

| File | Import | Severity |
|------|--------|----------|
| `features/profiles/controller/friends/getTopFriendActorIds.controller.js` | `import { ctrlGetBlockedActorSet } from "@/features/block"` | MINOR — imports from feature index (public export surface), not internals. Acceptable per contract if `index.js` is the official boundary. |
| `features/profiles/controller/friends/getTopFriendCandidates.controller.js` | `import { ctrlGetBlockedActorSet } from '@/features/block'` | Same as above. |
| `feed/screens/CentralFeedScreen.jsx` | `import '@/features/profiles/styles/profiles-modern.css'` | STYLE BOUNDARY LEAK — CSS imported across feature boundary into a screen, not via adapter. |

The two `@/features/block` imports go through the published `index.js` which is an intentional public surface. This is acceptable if `index.js` is treated as the adapter boundary. However, the contract requires cross-feature access through adapters specifically in `adapters/` folders — the `index.js` shortcut is a soft violation.

The CSS import in `CentralFeedScreen.jsx` is a harder violation: a screen in the `feed` feature directly consumes a styles file from the `profiles` feature, coupling the CSS layers across features.

---

## 8. State Management: Block/Follow Cache Map

| Cache | Location | TTL | Invalidation Function | Called After Write |
|-------|----------|-----|-----------------------|--------------------|
| `blockCache` | `feed.read.blockRows.dal.js` | 60s | `invalidateFeedBlockCache(viewerActorId)` | **NEVER CALLED** |
| `followCache` | `feed.read.followRows.dal.js` | 60s | `invalidateFeedFollowCache(viewerActorId)` | **NEVER CALLED** |
| `bundleCache` (actors+privacy) | `feed.read.actorsBundle.dal.js` | 30s per-actor | `invalidateActorsBundleCache()` | **NEVER CALLED** |
| `privacyCache` | `social/privacy/dal/actorPrivacy.dal.js` | 30s | `invalidateActorPrivacyCache(actorId)` | **NEVER CALLED** |
| `profileCache` | `profiles/dal/readActorProfile.dal.js` | 30s | `invalidateActorProfileCache(actorId)` | Not audited in this scope |
| `profileGateStore` | `state/actors/profileGateStore.js` | Zustand signal | `invalidateGate()` | Called in `useSubscribeAction` on unsubscribe |
| `followRequestsStore` | `state/social/followRequestsStore.js` | Zustand signal | `invalidate()` | Called in `useSubscribeAction` on send request |

**Critical gap:** All four TTL cache invalidation functions (`invalidateFeedBlockCache`, `invalidateFeedFollowCache`, `invalidateActorsBundleCache`, `invalidateActorPrivacyCache`) are exported but never imported or called anywhere in the codebase. They are dead exports.

This means:
- After a block action, the feed will show blocked content for up to 60s on subsequent page fetches.
- After a privacy toggle (public → private), the feed will show private posts for up to 30s.
- After a follow action, the feed will not reflect the new follow state for up to 60s on page 2+.
- After an unfollow, private posts remain visible in feed for up to 60s.

The `useCentralFeedActions.handleBlockActor` does call `fetchPosts(true)` after a block, which triggers a full feed refetch — but this re-fetch hits the still-warm 60s `blockCache` unless the TTL has expired.

---

## 9. Dead Code / Orphaned Files

| File | Status | Reason |
|------|--------|--------|
| `features/profiles/dal/readFollowState.dal.js` | DEAD STUB | Returns hardcoded `{ is_active: false }`. Used only by `getProfileView.controller.js`. The `isFollowing` value in `ProfileModel` is always false via this path. The real follow status is loaded separately by `useProfileGate` → `useFollowStatus` → `ctrlGetFollowStatus` → `dalGetFollowStatus`. |
| `features/feed/controllers/getDebugPrivacyRows.controller.js` | DEV-ONLY | Debug panel controller, not part of production path |
| `features/feed/screens/DebugFeedFilterPanel.jsx` | DEV-ONLY | Dev-only debug screen |
| `features/feed/screens/DebugPrivacyPanel.jsx` | DEV-ONLY | Dev-only debug screen |
| `features/feed/hooks/useDebugPrivacyRows.js` | DEV-ONLY | Dev-only hook |
| `features/feed/dal/feed.read.debugPrivacyRows.dal.js` | DEV-ONLY | Dev-only DAL |

The stub `readFollowState.dal.js` creates a latent bug: `getProfileView.controller.js` loads `isFollowing` and passes it to `ProfileModel`, but it will always be `false` regardless of actual follow state. The profile screen compensates by using `useProfileGate` → `useFollowStatus` for gate decisions, so the gate works correctly. However the `profile.isFollowing` field returned by the controller is permanently incorrect.

---

## 10. Enforcement Gaps

### Gap 1: No cache invalidation on write paths

**Severity: High**
All feed-layer caches (`blockCache`, `followCache`, `bundleCache`, `privacyCache`) have exported invalidation functions that are never called. After any write (block, follow, privacy toggle), the feed will serve stale data until TTL expires.

Expected: `blockActorController` should call `invalidateFeedBlockCache(blockerActorId)` after a successful block.  
Expected: `ctrlSubscribe`/`ctrlUnsubscribe` should call `invalidateFeedFollowCache(followerActorId)` after follow mutations.  
Expected: Privacy settings write path should call `invalidateActorPrivacyCache(actorId)` and `invalidateActorsBundleCache()`.

### Gap 2: readFollowState.dal.js stub

**Severity: Medium**
`features/profiles/dal/readFollowState.dal.js` is a permanently stubbed DAL that returns `{ is_active: false }`. This means the `isFollowing` field on the profile object returned by `getProfileView.controller.js` is always `false`. The profile header subscribe button is wired through `useSubscribeAction` / `useFollowStatus` which reads live from DB, so the button works. But any code that reads `profile.isFollowing` from the controller result gets incorrect data.

### Gap 3: Block does not invalidate warm cache before re-fetch

**Severity: Medium**
`useCentralFeedActions.handleBlockActor`:
1. Optimistically removes posts from local state (correct)
2. Calls `blockActorController` (correct, writes DB)
3. Calls `fetchPosts(true)` to re-fetch

But step 3 hits `readFeedBlockRowsDAL` which returns the cached result (up to 60s TTL) from before the block. The first re-fetch after blocking may still include the blocked actor's posts if the per-viewer block cache has not expired.

### Gap 4: Vports bypass privacy entirely

**Severity: By design, but undocumented**
In `resolveFeedRowVisibilityModel`, if `actor.vport_id` is set, the code takes the vport path and **skips all privacy/follow checks**. Vport posts are visible to all if `is_active=true`. This is correct product behavior (business profiles are public), but there is no comment documenting this decision in the model.

### Gap 5: CSS cross-feature import

**Severity: Low**
`CentralFeedScreen.jsx` imports `@/features/profiles/styles/profiles-modern.css`. This is a style coupling — the feed screen depends on profiles CSS. Should be extracted to `shared/` or the CSS token consumed via the theme system.

---

## 11. Summary Dependency Graph

```
BLOCK WRITE PATH
blockActorController
  └─ checkBlockStatus ─────────────────── moderation.blocks (read)
  └─ blockActorDAL ────────────────────── moderation.block_actor (RPC write)
                                           └─ server: moderation.blocks, vc.actor_follows
  └─ deleteFriendRankRowsBetweenActors ── vc.friend_ranks (delete)

BLOCK READ → FEED
readFeedBlockRowsDAL ─────────────────── moderation.blocks (batch read, 60s TTL)
  └─ buildBlockedActorSetModel ────────── Set<actorId>
  └─ isActorBlockedForViewerModel
  └─ feedRowVisibility → visible:false (reason: blocked_actor)

PRIVACY READ → FEED
feed.read.actorsBundle.dal.js ─────────── vc.actor_privacy_settings (batch, 30s TTL)
  └─ profile.private = is_private
  └─ canViewPrivateFeedActorModel
  └─ feedRowVisibility → visible:false (reason: private_not_following)

PRIVACY READ → PROFILE GATE (separate path)
dalGetActorPrivacy ────────────────────── vc.actor_privacy_settings (per-actor, 30s TTL)
  └─ ctrlGetActorPrivacy
  └─ useActorPrivacy → isPrivate
  └─ useProfileGate → canView = !isPrivate || isSelf || isFollowing

FOLLOW WRITE PATH
ctrlSubscribe
  └─ ctrlGetFollowRelationshipState ───── vc.actor_follows + vc.social_follow_requests + vc.actor_privacy_settings
  └─ dalInsertFollow ──────────────────── vc.actor_follows (upsert, is_active:true)
  └─ invalidateFollowerCount (count cache busted, but not follow/feed caches)

FOLLOW READ → FEED
readFeedFollowRowsDAL ─────────────────── vc.actor_follows (batch, 60s TTL)
  └─ buildFollowedActorSetModel ────────── Set<actorId>
  └─ isActorFollowedByViewerModel
  └─ canViewPrivateFeedActorModel → true (private actor, viewer is following)
  └─ feedRowVisibility → visible:true (reason: visible_user)

FOLLOW READ → PROFILE GATE
dalGetFollowStatus ────────────────────── vc.actor_follows (per-edge, no cache)
  └─ ctrlGetFollowStatus
  └─ useFollowStatus → isFollowing
  └─ useProfileGate → canView = true
```

---

## 12. Tables Touched by This Subsystem

| Table | Schema | Operations | Used By |
|-------|--------|------------|---------|
| `blocks` | `moderation` | SELECT, RPC `block_actor`, RPC `unblock_actor` | block DALs, feed blockRows DAL, notifications blockFilter DAL, profiles blockedActorSet DAL, settings blocks DAL |
| `actor_follows` | `vc` | SELECT (is_active), UPSERT (is_active:true), UPDATE (is_active:false) | actorFollows DAL, feed followRows DAL |
| `actor_privacy_settings` | `vc` | SELECT (is_private) | actorPrivacy DAL, feed actorsBundle DAL, settings visibility DAL |
| `social_follow_requests` | `vc` | SELECT, UPSERT, UPDATE | followRequests DAL |
| `friend_ranks` | `vc` | DELETE | applyBlockSideEffects helper |
| `actions` | `moderation` | SELECT, INSERT | moderationActions DAL, feed hiddenPosts DAL |
| `actors` | `vc` | SELECT (id, kind, profile_id, vport_id) | actorsBundle DAL, block check DAL, settings blocks DAL |
| `profiles` | (public) | SELECT (display_name, username, photo_url) | actorsBundle DAL, readActorProfile DAL |
| `actor_owners` | `vc` | SELECT (actor_id) | debugPrivacy DAL |
