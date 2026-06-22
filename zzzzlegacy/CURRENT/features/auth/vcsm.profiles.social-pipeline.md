# VCSM Profiles and Social Pipeline

## 1. Architecture Overview

Profiles and social behavior in VCSM is split across three layers:

- profile rendering and tabs under `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles`
- follow/privacy behavior under `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/social`
- block gating under `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/block`

The profile system is actor-first:

- every profile route resolves an `actorId`
- privacy, follow, follower count, friend ranks, and block state are all actor-scoped
- `public.profiles` backs user presentation, while `vc.vports` backs business presentation

## 2. Entry Screens and User Flows

Primary screens:

- actor profile route shell: `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/screens/ActorProfileScreen.jsx`
- generic profile view screen: `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/screens/views/ActorProfileViewScreen.jsx`
- VPORT profile screen: `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx`
- username redirect: `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/screens/UsernameProfileRedirect.jsx`

Core profile hooks:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/hooks/useProfileView.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/hooks/useProfileGate.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/hooks/useActorProfileActions.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/hooks/header/useProfileHeaderMessaging.js`

Core social hooks:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/social/friend/request/hooks/useSubscribeAction.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/social/friend/subscribe/hooks/useFollowStatus.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/social/friend/subscribe/hooks/useFollowerCount.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/social/privacy/hooks/useActorPrivacy.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/social/friend/request/hooks/useIncomingFollowRequests.js`

## 3. Database Schema Authority

### Actor and presentation

- `vc.actors`
  - canonical actor rows
- `public.profiles`
  - citizen/public profile data
- `vc.vports`
  - business presentation for VPORT actors
- RPC `vc.read_actor_profile`
  - main profile hydration read for actor pages

### Privacy and social graph

- `vc.actor_privacy_settings`
  - source of truth for whether an actor is private
- `vc.actor_follows`
  - accepted follow/subscription edges
- `vc.social_follow_requests`
  - pending and accepted/declined request history for private profiles
- `vc.friend_ranks`
  - top-friend ranking data

### Content embedded into profile views

- `vc.posts`
- `vc.post_reactions`
- `vc.post_rose_gifts`

### Visibility and safety overlays

- `moderation.blocks`
- `moderation.actions`

## 4. Main Domain Models

Profile/controller models:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/model/ProfileModel.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/model/PostModel.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/model/postCanonical.model.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/model/friends/friendGraph.model.js`

Social models:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/social/friend/request/models/followRequest.model.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/social/friend/subscribe/model/followRelationState.model.js`

## 5. Layer Stack

### Profile read path

```text
screen -> hook -> controller -> DAL -> RPC/table -> model -> UI
```

Concrete example:

```text
ActorProfileScreen
  -> useProfileGate()
  -> useProfileView()
  -> getProfileView.controller.js
  -> readActorProfileDAL / readActorPostsDAL / readPostReactionsDAL / readPostRoseCountsDAL
  -> ProfileModel / PostModel
```

### Social write path

```text
header/button -> hook -> controller -> DAL -> vc.actor_follows / vc.social_follow_requests
```

This layering is mostly respected. The biggest exception is that `getProfileView.controller.js` still uses a stubbed `readFollowStateDAL()` rather than the live social follow source.

## 6. Pipeline 1: Public Profile Load

### Route resolution

`ActorProfileScreen.jsx`:

- reads `routeActorId`
- resolves self routes
- redirects non-UUID values to username flow
- calls `useActorKind(actorId)` for valid UUIDs
- chooses a screen from `PROFILE_KIND_REGISTRY`

### Profile gate

`useProfileGate({ viewerActorId, targetActorId })`:

- reads actor privacy from `vc.actor_privacy_settings`
- reads follow status through social hooks
- reads block status via `useBlockStatus(viewerActorId, targetActorId)` from `@/features/block`
- `blockLoading` included in loading derivation — no content flash while block resolves
- allows view if: viewer is self (always) OR (not blocked in either direction AND (public OR following))
- returns `isBlocked` for UI to render a blocked-state component vs. private-profile notice

### Profile content load

`useProfileView()` calls `getProfileView()`:

```text
readActorProfileDAL(profileActorId)
  -> vc.read_actor_profile RPC
  -> vc.actor_privacy_settings lookup
readActorPostsDAL(profileActorId)
readPostReactionsDAL(postIds)
readPostRoseCountsDAL(postIds)
```

Files:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/controller/getProfileView.controller.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/dal/readActorProfile.dal.js`

### Important inconsistency

`getProfileView.controller.js` asks `readFollowStateDAL()`, but:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/dal/readFollowState.dal.js`

is a temporary stub returning `{ is_active: false }`.

So:

- `profile.isFollowing` inside the profile view payload is currently unreliable
- the header buttons use the real social hooks instead

## 7. Pipeline 2: Privacy Gating

Privacy source of truth:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/social/privacy/dal/actorPrivacy.dal.js`

Behavior:

- reads `vc.actor_privacy_settings.is_private`
- fails closed if the row is missing or unreadable

UI gate:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/ui/PrivateProfileGate.jsx`

Displayed message:

- profile is private
- viewer must subscribe/request access from the header
- messaging may still remain available

## 8. Pipeline 3: Subscribe / Unsubscribe / Follow Requests

### Header action

The public profile header uses:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/screens/views/ActorProfileHeader.jsx`

It binds:

- `useSubscribeAction()`
- `useFollowerCount()`
- `useProfileHeaderMessaging()`

### Subscribe decision logic

`useSubscribeAction()`:

- reads live follow status
- reads live follow-request status
- on click:
  - unsubscribes if already following
  - otherwise calls `ctrlSubscribe()`

### Controller rules

`ctrlSubscribe()` in:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/social/friend/subscribe/controllers/follow.controller.js`

Rules:

- cannot follow self
- bidirectional block check via `ctrlGetBlockStatus` — throws `'Cannot follow a blocked actor'` if blocked (checked before any DB access)
- if already following, returns no-op success
- if target is private:
  - calls `ctrlSendFollowRequest()`
  - `ctrlSendFollowRequest` also performs an independent block check before writing
  - writes/updates `vc.social_follow_requests`
- if target is public:
  - upserts `vc.actor_follows`

Notification ownership:

CORRECTED 2026-05-27 — see `vcsm.profiles.subscribe-pipeline.md` § Server-Side Effects

Follow notifications are JS-side via `publishVcsmNotification()`, NOT DB-trigger-generated.

| Controller | Kind | linkPath | Trigger |
|---|---|---|---|
| `ctrlSubscribe` | `follow` | `/feed` | JS — after `dalInsertFollow` succeeds |
| `ctrlSendFollowRequest` | `follow_request` | `/feed` | JS — after `dalUpsertPendingRequest` |
| `ctrlAcceptFollowRequest` | `follow_request_accepted` | `/feed` | JS — after both DB writes |

The previous claim that notifications were DB-trigger-based was not verified from code. Whether legacy DB triggers still exist in parallel is unverified from app code alone — the JS-side calls are the authoritative path.

### Unsubscribe

`ctrlUnsubscribe()`:

- deactivates `vc.actor_follows`
- does not hard-delete the edge

The canonical unsubscribe path is:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/social/friend/subscribe/controllers/unsubscribe.controller.js`

A dead `ctrlUnsubscribe` export that previously existed in `follow.controller.js` was removed in 2026-05-10 (it was never imported and was incomplete).

## 9. Pipeline 4: Accept / Decline Follow Requests

Settings privacy entry:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/settings/privacy/ui/PendingFollowRequests.jsx`

Actions:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/settings/privacy/hooks/usePendingFollowRequestActions.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/social/friend/request/hooks/useFollowRequestActions.js`

Accept path:

```text
acceptRequest()
  -> ctrlAcceptFollowRequest(assertingActorId)
  -> assert assertingActorId === targetActorId
  -> verify current request status is pending
  -> dalInsertFollow()
  -> dalUpdateRequestStatus(status='accepted')
  -> invalidateFeedFollowCache(requesterActorId)
  -> invalidateFeedFollowCache(targetActorId)
  -> window.dispatchEvent('noti:refresh')
```

Decline path:

- updates `vc.social_follow_requests.status='declined'`
- refreshes request stores and notification badge/header listeners

Cancel path:

```text
cancelRequest()
  -> ctrlCancelFollowRequest({ requesterActorId, targetActorId, assertingActorId })
  -> assert assertingActorId === requesterActorId [session binding]
  -> verify current request status is pending
  -> dalUpdateRequestStatus(status='cancelled')
```

## 10. Pipeline 5: Follower Count and Relationship State

Follower count:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/social/friend/subscribe/dal/subscriberCount.dal.js`
- counts active rows in `vc.actor_follows`

Relationship state:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/social/friend/subscribe/controllers/getFollowRelationshipState.controller.js`
- combines:
  - privacy state
  - follow state
  - request state

This is the more authoritative social state path than `readFollowStateDAL`.

## 11. Pipeline 6: Friends and Top Friend Ranks

Friend graph reads:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/dal/friends/friends.read.dal.js`

It loads:

- outgoing follow edges from `vc.actor_follows`
- incoming follow edges from `vc.actor_follows`

Then:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/model/friends/friendGraph.model.js`
  - derives following / followers / mutual friend buckets

Top friend rank writes:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/dal/friends/friendRanks.write.dal.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/dal/friends/friendRanks.reconcile.dal.js`

Block side effects also delete `friend_ranks`, so top-friend state is not isolated from safety actions.

## 12. Pipeline 7: Block Interaction with Profile/Social

Profile screens also consult block status:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/block/adapters/hooks/useBlockStatus.adapter.js`
- used in `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx`

Observed behavior:

- if block status says the viewer cannot view the profile, navigation redirects back to `/feed`

When an actor is blocked:

- `moderation.blocks` gets a row
- follow edges in `vc.actor_follows` are deleted both ways
- friend ranks in `vc.friend_ranks` are deleted both ways

That cleanup is orchestrated through:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/block/controllers/blockActor.controller.js`
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/block/helpers/applyBlockSideEffects.js`

## 13. Actor Identity Interaction

Profiles are rendered against:

- `viewerActorId`
- `profileActorId`

Effects of actor switching:

- a different active actor changes privacy outcome
- a different active actor changes follow state and available profile actions
- follower requests are actor-to-actor, so switching from citizen to VPORT changes which relationship row is queried/written

This is especially important because the app treats VPORT actors as fully separate social actors, not just presentation shells.

## 14. Key Files Reference

- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/screens/ActorProfileScreen.jsx` — route shell for actor profiles.
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/hooks/useProfileView.js` — profile content loader hook.
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/controller/getProfileView.controller.js` — main profile read orchestrator.
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/dal/readActorProfile.dal.js` — RPC-backed profile hydration.
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/hooks/useProfileGate.js` — privacy gate logic.
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/profiles/screens/views/ActorProfileHeader.jsx` — social actions in the header.
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/social/friend/subscribe/controllers/follow.controller.js` — subscribe/unsubscribe rules.
- `/Users/vcsm/Desktop/VCSM/apps/VCSM/src/features/social/friend/request/controllers/followRequests.controller.js` — request/accept/decline rules.

## 15. Weak Spots / Risks

1. `readFollowStateDAL()` is still a stub, so the profile payload and the live header relationship state can disagree.
2. ~~Subscribe/unsubscribe logic is duplicated across `follow.controller.js` and `unsubscribe.controller.js`.~~ FIXED 2026-05-10: dead `ctrlUnsubscribe` export removed from `follow.controller.js`. Canonical unsubscribe is `unsubscribe.controller.js` only.
3. Privacy fails closed, which is safer, but missing privacy rows can silently make profiles appear private.
4. ~~Notifications for follows and follow requests are expected from database triggers~~ — RETRACTED 2026-05-27. Follow notifications are JS-side via `publishVcsmNotification()`. See § Notification ownership above.
5. Profile/social has no strong realtime layer; most state refreshes are hook reloads or manual invalidation.

## 16. Final Judgment

Profiles and social are actor-first and mostly well-layered, but they are not fully clean:

- layered: mostly yes
- hybrid: yes
- tightly coupled: moderately, especially with block and profile view integration
- duplicated: yes in follow-state handling
- actor-pure: yes
- migration-ready: mostly, but not fully until relationship state is centralized

---

## Changes — 2026-05-10

### readFollowState.dal.js — Stub Replaced

`apps/VCSM/src/features/profiles/dal/readFollowState.dal.js` was a permanent stub returning `{ is_active: false }` for all inputs (labelled "Phase 1: FOLLOW STATE DISABLED"). 

Replaced with a real `vc.actor_follows` query:
- SELECT `is_active` WHERE `follower_actor_id = viewerActorId AND followed_actor_id = targetActorId`
- Uses `.maybeSingle()` — returns `{ is_active: false }` when no row
- Guards: both IDs must be valid UUIDs and must not be equal

Impact: `isFollowing` on profile cards now reflects actual follow state. Previously always `false`, which meant the follow button showed wrong state on private profile pages.

### Follow-Request Accept/Decline Session Binding

`ctrlAcceptFollowRequest` and `ctrlDeclineFollowRequest` now require `assertingActorId`. The controller asserts `assertingActorId === targetActorId` before proceeding.

`useFollowRequestActions.js` uses `useIdentity()` to get the session actorId and passes it as `assertingActorId`. This prevents a notification payload with a tampered `targetActorId` from triggering accept/decline on behalf of another actor.

### Profile Posts Prefetch Gate

`useActorPosts(actorId, canViewContent)` now has `enabled: !!actorId && canViewContent !== false`. Previously the hook fired even when the profile gate denied access, silently caching private posts in React Query.

`ActorProfileViewScreen` passes `canViewContent={gate.canView}` to `ActorProfilePostsView`, which forwards it to `useActorPosts`.

### Block Enforcement on Follow/Subscribe and Profile Gate (2026-05-10)

**Source:** VENOM audit `2026-05-10_00-00_venom_friend-subscribe-private-profile-review.md`

`useProfileGate` (profiles/hooks/useProfileGate.js)
- Now imports `useBlockStatus` from `@/features/block` (positional args: `viewerActorId`, `targetActorId`)
- `blockLoading` added to loading derivation — prevents content flash while block resolves
- `canView` rewritten: `isSelf || (!isBlocked && (!isPrivate || isFollowing))`
  - Self-view always passes
  - Any block in either direction → `canView = false` regardless of privacy/follow state
- `isBlocked` added to return object for UI to branch between `<BlockedState />` and `<PrivateProfileNotice />`

`ctrlSubscribe` (follow.controller.js)
- Bidirectional block check via `ctrlGetBlockStatus` added after self-follow guard, before all writes
- Throws `'Cannot follow a blocked actor'` if blocked
- Dead `ctrlUnsubscribe` export removed — was incomplete and never imported

`ctrlSendFollowRequest` (followRequests.controller.js)
- Same bidirectional block check before `dalGetRequestStatus` and all writes
- Independent from `ctrlSubscribe` — guards the request path directly

`ctrlCancelFollowRequest` (followRequests.controller.js)
- `assertingActorId` parameter added with ownership assertion before any DB access
- `useFollowActorToggle` updated to pass `assertingActorId: followerActorId`

`ctrlAcceptFollowRequest` (followRequests.controller.js)
- `invalidateFeedFollowCache` called for both requester and target after successful writes
