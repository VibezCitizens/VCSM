---
title: Feed Module — Behavior Contract
status: ACTIVE
feature: feed
module: feed
source: code-derived
created: 2026-06-05
reviewed-by: LOGAN
source-path: apps/VCSM/src/features/feed/
---

# feed / modules / feed — BEHAVIOR CONTRACT

## Status

ACTIVE. All behaviors derived directly from source code. Zero unverified claims.
Previous STUB replaced 2026-06-05 by LOGAN pass.

---

## Hooks Overview

| Hook | Role | Implementation |
|---|---|---|
| useCentralFeed | Canonical feed state — React Query infinite query | CentralFeedScreen |
| useFeed | Legacy manual cursor pagination — same pipeline | Other consumers |
| useCentralFeedActions | All post-level user actions | CentralFeedScreen |
| useFeedInfiniteScroll | IntersectionObserver scroll trigger | CentralFeedScreen |
| useFeedConfirmToast | Confirm modal + toast manager | CentralFeedScreen |
| useFeedWelcomeCard | Welcome card visibility + dismiss | Mounted after firstBatchReady |

Both useCentralFeed and useFeed expose the identical public API:
`{ posts, viewerIsAdult, loading, hasMore, fetchPosts, setPosts, hiddenPostIds, filterDebugRows, firstBatchReady }`

useCentralFeed (React Query) is the implementation used by CentralFeedScreen.

---

## Workflow 1 — Feed Initial Load

**Entry:** CentralFeedScreen mounts with authenticated user.

1. `useAuth()` provides `user`. If `!user`, `<Navigate to="/login" replace />` is rendered immediately — feed never mounts.
2. `useIdentity()` provides `identity.actorId` and `identity.realmId`.
3. `useCentralFeed(actorId, realmId, { viewerIsAdult })` is called.
4. `viewerIsAdult` is derived from identity: `kind === 'vport' ? true : identity.isAdult ?? null`.
5. `useInfiniteQuery` fires with `enabled: Boolean(viewerActorId)`. If `actorId` is null, query does not fire.
6. `fetchCentralFeedPage({ actorId, realmId, pageParam: undefined })` is called for the first page.
7. The pipeline runs 9 DAL calls in parallel (see Pipeline section).
8. On response: actors are upserted to Zustand actorStore. Background canonical hydration fires for stale or missing actors. vport actors missing a vport_name trigger a force hydration call.
9. Image preload runs for the first 3 posts' first image URLs. Timeout: 2500ms per image. Preload runs only once per viewerActorId+realmId session.
10. `status` transitions: `pending` → `success` or `error`.
11. `firstBatchReady` transitions to `true` on either `success` or `error`.
12. On `firstBatchReady` = true: `hideLaunchSplash()` is called, skeleton is hidden, WelcomeFeedCard is shown.

**Loading indicator:** `FeedSkeletonList count={3}` renders while `!firstBatchReady`.

**Empty state:** "No Vibes found." renders when `!showInitialSkeleton && !loading && posts.length === 0`.

---

## Workflow 2 — Infinite Scroll Pagination

**Entry:** User scrolls toward bottom of feed list.

1. `useFeedInfiniteScroll` mounts an `IntersectionObserver` on a 1px sentinel `<div>` at the list bottom.
2. Observer root margin: `0px 0px 600px 0px` — fires 600px before sentinel reaches viewport.
3. Observer only activates after `firstBatchReady` is true (reconnects when `firstBatchReady` changes).
4. Observer fires only when: `isIntersecting && posts.length > 0 && hasMore && !loading && !locked`.
5. A `locked` flag prevents concurrent pagination calls during a fetch cycle.
6. `fetchPosts(false)` is called — triggers `fetchNextPage()` in React Query.
7. `getNextPageParam` returns `lastPage.nextCursor`. If `nextCursor` is null/undefined, `hasNextPage` = false.
8. New page posts are deduped by `id` using a `Map` across all pages.
9. **End-of-feed indicator:** "End of feed" renders when `!hasMore && !loading && posts.length > 0`.

**useFeed.js pagination guard:** `MAX_EMPTY_PAGES_PER_FETCH = 3`. If 3 consecutive pages produce zero visible posts after visibility filtering, `hasMore` is forced to false to prevent infinite drain.

---

## Workflow 3 — Pull-to-Refresh

**Entry:** User drags the feed container down past threshold.

1. `PullToRefresh` component wraps the feed list. `threshold=70`, `maxPull=120`.
2. On release: `handleRefresh()` is called.
3. `ptrRef.current.scrollTo({ top: 0, behavior: 'auto' })` — scroll to top immediately.
4. `fetchPosts(true)` — "fresh" fetch:
   - In useCentralFeed: calls `queryClient.resetQueries({ queryKey })`, which clears all pages back to page 1 and awaits refetch.
   - `firstBatchReady` is reset to `false` before the reset.
5. hiddenPostIds is cleared (fresh = true resets the set).
6. Skeleton is shown again during `!firstBatchReady`.

---

## Workflow 4 — Post Action Menu

**Entry:** User taps the actions button on any PostCard.

1. `openPostMenu({ postId, postActorId, anchorRect })` is called.
2. `postMenu` state is set: `{ postId, postActorId, isOwn: postActorId === actorId, anchorRect }`.
3. `isMenuActorFollowing` is resolved via `useFollowStatus`.
4. `PostActionsMenu` renders anchored to `anchorRect`.
5. Owner posts show: Edit, Delete.
6. Non-owner posts show: Subscribe/Unsubscribe, View Profile, Block, Report.
7. All actions close the menu via `closePostMenu()` before executing.

### Sub-action: Edit Post

1. `handleEditPost()` resolves post text from `posts` array.
2. Navigates to `/post/${postId}/edit` with `state: { initialText }`.

### Sub-action: Delete Post

1. Confirm modal fires: "Delete Vibe?" with danger tone.
2. If confirmed: `deletePost({ postId })` is called.
3. On failure: `window.alert(error.message)`.
4. On success: `fetchPosts(true)` — full refresh.

### Sub-action: Subscribe / Unsubscribe

1. `toggleFollow({ followerActorId, followedActorId, isFollowing })` is called.
2. On `result.mode === 'unfollow'` or `'cancel_request'`: toast "Unsubscribed".
3. On all other modes: toast "Subscribed".
4. On failure: `window.alert(error.message)`.

### Sub-action: Block Actor

1. Confirm modal fires: "Block actor?" with danger tone.
2. If confirmed: optimistic remove — `setPosts(prev => prev.filter(p => resolvePostActorId(p) !== blockedActorId))`.
3. Snapshot of pre-block posts is saved for rollback.
4. `blockActor({ blockerActorId, blockedActorId })` is called.
5. On success: `fetchPosts(true)` — full refresh (blocked actor posts excluded by pipeline).
6. On failure: snapshot is restored via `setPosts(snapshot)` and `window.alert` fires.

### Sub-action: Report Post

1. `reportFlow.start({ objectType: 'post', objectId: postId, dedupeKey, title, subtitle })` is called.
2. `closePostMenu()` fires.
3. `ReportModal` renders.
4. On submit: `handleReportSubmit(payload)` is called.
5. If `reportFlow.submit` returns `ok === false`, submission stops.
6. On success: `persistHideForMe(postId)` is called with `reason: 'user_reported'`.
7. `fetchPosts(true)` is called — full refresh (reported post now hidden for viewer).
8. `reportFlow.close()` is called.

### Sub-action: Share Post

1. `handleShare(postId)` constructs URL: `${window.location.origin}/post/${postId}`.
2. Post text truncated to 140 characters for share body.
3. `shareNative({ title: 'Spread', text, url })` is called (Web Share API).
4. If `!res.ok` (Web Share API unavailable or cancelled): `ShareModal` opens with the URL for manual copy.

---

## Workflow 5 — Welcome Card Lifecycle

**Entry:** CentralFeedScreen renders after `firstBatchReady = true`.

1. `WelcomeFeedCard` is mounted with `actorId` and `kind`.
2. `useFeedWelcomeCard({ actorId, kind })` runs.
3. If `kind !== 'user'` or `actorId` is null: `show = false`. Welcome card never shows for vport actors.
4. localStorage fast-path: key `vcsm_wfc_${actorId}`. If value is `'dismissed'`: `show = false`, no DB call.
5. If not in localStorage: `ctrlGetWelcomeCardVisible({ actorId })` is called.
6. Controller reads `vc.actor_onboarding_steps` (via `readWelcomeFeedCardStateDAL`).
7. `show = !row || row.status !== 'completed'`.
8. If `!shouldShow`: localStorage key is written as `'dismissed'` to cache the result.
9. **Dismiss:** User taps dismiss. `setShow(false)`, `localStorage.setItem(key, 'dismissed')`, `ctrlMarkWelcomeCardSeen({ actorId })` fires (non-blocking, error silenced).
10. Modal within card: `openModal()` / `closeModal()` toggle `modalOpen` state.

---

## Workflow 6 — Actor Identity Hydration (Per Page)

**Runs after every page fetch in both useCentralFeed and useFeed.**

1. Pipeline returns `{ actors, profileMap, vportMap }` per page.
2. Actors are immediately upserted to Zustand actorStore with display data from pipeline maps.
3. For each actor: `getMissingOrStale(actorIds)` checks Zustand store staleness.
4. Stale or missing actors: `hydrateActorsByIds(staleOrMissing)` is called (background, error silenced).
5. vport actors with `vportMap[id].name === null` and not in staleOrMissing: `hydrateActorsByIds(ids, { force: true })` — forces canonical RPC because `vport.profiles` has owner-only RLS.

---

## Workflow 7 — Mention Enrichment (Per Page)

**Conditional — only runs if any post text contains '@'.**

1. Pipeline scans `pageRows` for `row.text.includes('@')`.
2. If true: `fetchRawPostMentionEdgesDAL(pagePostIds)` fetches `vc.post_mentions` edges.
3. `mentionedActorIds` are extracted from edges.
4. `hydrateAndReturnSummaries({ actorIds: mentionedActorIds })` fetches actor summaries.
5. `enrichMentionRows(mentionEdges, presentations)` merges edge data with summaries.
6. `buildMentionMaps(enrichedMentionRows)` produces a `{ [postId]: { [handleKey]: payload } }` map.
7. `handleKey` = lowercased username (for user actors) or slug (for vport actors).
8. Actors without a username or slug are dropped from mention maps (no route can be built).
9. Route resolution:
   - `kind === 'user'` with username: `/u/${username}`
   - `kind === 'vport'` with vportId: `/vport/${vportId}`
   - fallback with actorId: `/profile/${actorId}`
   - last resort (no IDs): `/feed`
10. If no posts contain '@': `mentionEdges = []`, enrichment and hydration are skipped entirely.

---

## Workflow 8 — Confirm Modal / Toast

**Used by block and delete actions.**

1. `useFeedConfirmToast` maintains `confirmState` (open/title/message/labels/tone) and `toastState` (open/message).
2. `requestConfirm(options)` returns a Promise. Resolves `true` on confirm, `false` on cancel.
3. On unmount: pending confirm resolves `false` automatically (cleanup effect).
4. `showToast(message)` sets message then toggles `toastOpen` to `false` then `true` (via setTimeout 0) to re-trigger animation on repeat toasts.

---

## Pipeline — fetchFeedPagePipeline

**9 DAL calls run in parallel per page fetch:**

| # | DAL | Table |
|---|---|---|
| 1 | readFeedPostsPage | vc.posts |
| 2 | readPostMediaMap | vc.post_media |
| 3 | readHiddenPostsForViewer | moderation.actions |
| 4 | readActorsBundle | vc.actors + profiles + vports + privacy |
| 5 | readFeedBlockRowsDAL | moderation.blocks |
| 6 | readFeedFollowRowsDAL | vc.actor_follows |
| 7 | readCommentCountsBatch | vc.post_comments |
| 8 | readViewerReactionsBatch | vc.post_reactions |
| 9 | readReactionCountsBatch | vc.post_reactions + vc.post_rose_gifts |

Mention edges (vc.post_mentions) are fetched conditionally outside the parallel batch,
only when `hasPotentialMentions = pageRows.some(r => r.text?.includes('@'))`.

---

## Visibility Rules — Complete Model

### Step 1 — Block Check (feedBlockVisibility.model.js)

Block set is built from `moderation.blocks` rows. Block is bidirectional:

```
if (row.blocker_actor_id === viewerActorId) → add row.blocked_actor_id
if (row.blocked_actor_id === viewerActorId) → add row.blocker_actor_id
```

If the post's actor_id is in the blocked set: `visible = false, reason = 'blocked_actor'`.

### Step 2 — Actor Existence Check (feedRowVisibility.model.js)

If `actorMap[rowActorId]` is null: `visible = false, reason = 'missing_actor'`.

### Step 3a — vport Actor Path

If actor has `vport_id`:
- vportMap is keyed by `actor.id` (not `actor.vport_id`).
- If `vportMap[rowActorId]` is null: `visible = false, reason = 'missing_vport_profile'`.
- If vport entry exists: `isActive = vportEntry.is_active !== false && vportEntry.is_deleted !== true`.
- Result: `visible = isActive, reason = isActive ? 'visible_vport' : 'inactive_vport'`.

### Step 3b — User Actor Path

If actor has `profile_id`:
- If `profileMap[actor.profile_id]` is null: `visible = false, reason = 'missing_profile'`.
- `isFollowing = followedActorSet.has(actor.id)` (only is_active=true follows are in the set).
- `isOwner = actor.id === viewerActorId`.
- `isPrivate = Boolean(profile.private)`.
- Private gate: `canView = !isPrivate || isOwner || isFollowing`.
- Result: `visible = canView, reason = canView ? 'visible_user' : 'private_not_following'`.

### Visibility Reason Enum (8 values)

| Reason | visible |
|---|---|
| blocked_actor | false |
| missing_actor | false |
| missing_vport_profile | false |
| inactive_vport | false |
| missing_profile | false |
| private_not_following | false |
| visible_vport | true |
| visible_user | true |

---

## State Transitions

### useCentralFeed — React Query Status

```
[viewerActorId present]
         |
    enabled=true
         |
      pending
       /    \
  success   error
              |
    firstBatchReady = true (on both branches)
```

### Pagination State

```
success
   |
sentinel intersects (600px margin, has posts, hasMore, !loading)
   |
isFetchingNextPage = true
   |
nextPage resolves
   |
success (pages array grows)
   |
nextCursor = null → hasMore = false → "End of feed"
```

### firstBatchReady

```
Initial: false
On viewerActorId or realmId change: reset to false
On status === 'success' OR status === 'error': set to true
```

### hiddenPostIds (useFeed.js)

```
Fresh fetch: reset to new Set()
Per page: accumulate hiddenByMeSet additions
```

### postMenu

```
null → { postId, postActorId, isOwn, anchorRect } (on openPostMenu)
  → null (on closePostMenu, or after any action completes)
```

### toastOpen

```
false → true (showToast: setTimeout 0 flip for animation reset)
  → false (user dismisses or auto-dismiss)
```

---

## Invariants

1. Feed query does not fire if `viewerActorId` is null (`enabled: Boolean(viewerActorId)`).
2. unauthenticated users never reach the feed screen — `<Navigate to="/login">` fires before any hook runs.
3. Block exclusion is bidirectional — a viewer who blocked or was blocked by an actor will never see that actor's posts.
4. Private actor posts are never shown to non-followers unless viewer is the actor owner.
5. vport posts require an active, non-deleted vport profile. Missing or inactive vport profiles are always hidden.
6. Posts from actors absent from `actorMap` are always hidden, regardless of other conditions.
7. The concurrent fetch lock prevents double-pagination in useFeed.js. React Query deduplicates in useCentralFeed.
8. staleTime is 30 seconds — re-entering the feed within 30s of the last fetch serves from cache.
9. Image preload runs only once per actorId+realmId session, on the first page's first 3 image URLs, with a 2500ms per-image timeout.
10. Welcome card only shows for actor `kind === 'user'`. vport actors are explicitly excluded.
11. localStorage key `vcsm_wfc_${actorId}` short-circuits the DB welcome card read on repeat visits.
12. Mention enrichment is skipped entirely if no post text contains '@'.
13. Media type inference defaults to 'image' for any URL that does not match `mp4|webm|mov` (video) or `jpg|jpeg|png|webp|gif|avif` (explicit image).
14. Actor hydration from the pipeline always fires immediately (synchronous upsert). Background canonical hydration is a secondary pass for stale or missing entries only.
15. Snapshot rollback is applied on block failure — the optimistic filter is reversed by restoring the pre-block post array.

---

## Normalization Output Shape

Every normalized post object has the following fields (derived from normalizeFeedRows.model.js):

```
{
  id: string,
  text: string,
  title: string,
  created_at: timestamp,
  edited_at: timestamp | null,
  deleted_at: timestamp | null,
  post_type: string (default 'post'),
  actor_id: string,
  location_text: string | null,
  payload: object | null,
  is_hidden_for_viewer: boolean,
  actor: {
    id: string,
    kind: 'user' | 'vport',
    displayName: string | null,
    username: string | null,    -- slug for vport
    avatar: string | null,
    vport_name: string | null,
    vport_slug: string | null,
  },
  media: Array<{ type: 'image' | 'video', url: string }>,
  mentionMap: { [handleKey: string]: MentionPayload },
  commentCount: number,
  viewerReaction: string | null,
  reactionCounts: { like: number, dislike: number, rose: number },
}
```

Media resolution priority:
1. `vc.post_media` rows (multi-media, keyed by post id in `mediaMap`).
2. Legacy `row.media_url` + `row.media_type` (single attachment fallback).
3. If both are empty: `media = []`.

---

## Media Type Inference

`inferMediaType(url)` logic (applied when `media_type` is null in the DB row):

| URL Pattern | Result |
|---|---|
| `.mp4`, `.webm`, `.mov` (case insensitive) | `'video'` |
| `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif` (case insensitive) | `'image'` |
| No match | `'image'` (default) |
| null or empty | `'text'` |

After inference, normalizeFeedRows collapses: if `inferredType === 'video'` → `'video'`, else → `'image'`.

---

## Error Behavior

| Scenario | Behavior |
|---|---|
| Initial fetch fails (useFeed) | `hasMore = false`, `firstBatchReady = true` (still unblocks UI), `console.warn` |
| Initial fetch fails (useCentralFeed) | React Query `status = 'error'`, `firstBatchReady = true` (via effect) |
| Fetch timeout (useFeed) | `withTimeout` rejects at 15000ms, caught as fetch error above |
| Delete post fails | `window.alert(error.message)` |
| Block actor fails | Snapshot restored, `window.alert(error.message)` |
| Follow toggle fails | `window.alert(error.message)` |
| Report submit fails | `console.error`, no UI feedback (reportFlow.submit returns ok=false silently) |
| Hide post fails | `console.warn`, silenced — post may re-appear on next refresh |
| Welcome card DB fails | `setShow(false)` — card never shows on error |
| Actor hydration fails | error silenced via `.catch(() => {})` |
| Mention enrichment fails | pipeline throws, caught by caller |

---

## Ownership Rules

| Action | Who can perform |
|---|---|
| Edit post | Only `postActorId === actorId` (isOwn = true) |
| Delete post | Only `postActorId === actorId` (isOwn = true) |
| Subscribe/Unsubscribe | Any viewer except self (actorId !== postActorId) |
| Block actor | Any viewer except self (actorId !== postActorId) |
| Report post | Any viewer (actorId present, postMenu open) |
| Hide post (after report) | Any viewer (actorId present) |
| Share post | Any viewer |
| Dismiss welcome card | Only actor kind === 'user' (card only shown for users) |

---

## Debug Panel Access (DEV only)

Two debug overlays are available via query string:

| `?debug=` value | Panel shown |
|---|---|
| `privacy` | DebugPrivacyPanel — per-post actor privacy state |
| `filter` | DebugFeedFilterPanel — all visibility debug rows |
| `all` | Both panels |

These panels only render in `import.meta.env.DEV` environments.

Feed debug event emissions via `debugFeedEvent`:
- `FEED_SCREEN_MOUNT` — on CentralFeedScreen mount
- `FEED_REQUEST_START` — before each fetch
- `FEED_REQUEST_SKIPPED` — when actorId is null
- `FEED_REQUEST_SUCCESS` — after successful fetch

---

## Route Entry Points

CentralFeedScreen has no declared route of its own. It is mounted by the app shell
navigation layer. The screen uses `useNavigate` to push:
- `/post/:id` — on PostCard tap (if not covered)
- `/post/:id/edit` — on edit action
- `/profile/:actorId` — on "View Profile" menu action
- `/u/:username` — mention route for user actors
- `/vport/:vportId` — mention route for vport actors

---

## listActorPosts Controller (SSOT Note)

`listActorPosts.controller.js` is the SSOT for post listing in both:
- Profile domain (Posts tab, Photos tab via useProfileView)
- Feed domain (actor-scoped views)

The controller is LOCKED. Profile features must not introduce separate post queries.
The controller requires both `actorId` and `viewerActorId` — missing either throws.
RLS on `vc.posts` enforces visibility; the controller does not add additional filters.

---

## Open Items (Post-LOGAN)

None. All STUB TODOs resolved by this code read.

Previously open:
- staleTime/gcTime/refetchOnWindowFocus: CONFIRMED (30s / 10min / false from useCentralFeed.js line 87-88)
- firstBatchReady logic: CONFIRMED (set true on status==='success' OR status==='error')
- useCentralFeed vs useFeed: RESOLVED (useCentralFeed is canonical; useFeed operational for other consumers)
- Post-action flows: FULLY DOCUMENTED (see Workflows 4, 5, 8)
