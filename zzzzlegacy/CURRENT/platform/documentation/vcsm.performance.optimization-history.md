# VCSM Performance Optimization History

Maintained by: Logan
Last updated: 2026-05-10

---

## Session: 2026-05-10

### Post-System Quick Wins (KRAVEN Audit)

- **Problem:** Feed drain loop capped at 3 pipeline iterations on sparse feeds (worst case: ~33 serial DB ops on first load). Privacy query hit all actor IDs including cached ones on every page. Comment thread had no row limit. `sendRose` and `toggleCommentLike` ran post-write reads serially. Unused `deleted_by_actor_id` column fetched on every feed page load.
- **Solution:** Applied 6 targeted fixes: (1) `MAX_EMPTY_PAGES_PER_FETCH` 3→2; (2) Privacy `actor_privacy_settings` query scoped to `uncachedIds` only; (3) Removed `deleted_by_actor_id` from feed DAL SELECT + normalize output; (4) Added `.limit(50)` to `listPostComments`; (5) Parallelized `sendRose` post-insert reads with `Promise.all`; (6) Parallelized `toggleCommentLike` like-path reads with `Promise.all`.
- **Impact:** Worst-case first-load queries reduced from ~33 to ~22. Privacy query eliminated on pages with all-cached actors. Saves one round-trip per rose send and per comment like. Comment thread bounded at 50 rows.
- **Files Changed:** `fetchCentralFeedPage.js`, `feed.read.actorsBundle.dal.js`, `feed.read.posts.dal.js`, `normalizeFeedRows.model.js`, `postComments.read.dal.js`, `sendRose.controller.js`, `commentReactions.controller.js`.
- **Full execution log:** `logan/marvel/kraven/2026-05-10.post-system-quick-wins.md`

---

### Deleted Account Suppression (Wolverine)

- **Problem:** Posts from soft-deleted Citizen and Vport accounts remained visible in the feed. VPORT actors with no `vport.profiles` row defaulted to visible (fail-open). Navigating to a deleted VPORT profile route showed a broken/empty screen.
- **Solution:** Added `is_deleted = false` filters to `vc.actors` and `public.profiles` reads in the actor bundle DAL. Changed feed visibility model to fail-closed on missing VPORT profile rows (`reason: 'missing_vport_profile'`). Added `is_deleted` to the Vport public details DAL SELECT and model. Created `isDeletedProfileActor` pure model helper. Built `UnavailableProfileGate` UI component (rose-toned, matching `PrivateProfileGate` structure). Wired gate to `VportProfileViewScreen` for both null-profile and explicit-delete cases.
- **Impact:** Feed hides posts from all deleted accounts. VPORT profile routes show a clear gate instead of a broken state. Privacy query also scoped to uncached IDs as part of this session.
- **Files Changed:** `feed.read.actorsBundle.dal.js`, `feedRowVisibility.model.js`, `vportPublicDetails.read.dal.js`, `mapVportPublicDetails.model.js`, `resolveActorSlug.dal.js`, `VportProfileViewScreen.jsx`. New: `isDeletedProfileActor.model.js`, `UnavailableProfileGate.jsx`, `UnavailableProfileGate.adapter.js`. i18n: `en/profile.json`, `es/profile.json`.
- **Full execution log:** `logan/marvel/wolverine/2026-05-10.deleted-account-gate.md`

---

### Private-Profile, Block/Follow, Visibility Enforcement (Wolverine/VENOM/Carnage)

- **Problem:** All four feed cache invalidation functions (`invalidateFeedBlockCache`, `invalidateFeedFollowCache`, `invalidateActorPrivacyCache`, `invalidateActorBundleEntry`) were exported but had zero call sites — caches went stale until TTL. Follow cache was page-scoped, causing a full DB miss on every new scroll page. PostDetail bypassed all visibility gates. Profile posts prefetched behind privacy walls. `readFollowState.dal.js` was a permanent stub returning `{ is_active: false }`. `dalGetFollowStatus` had no cache.
- **Solution:** (1) Wired all four invalidation functions into their respective write paths (block/unblock, follow/unfollow/accept, privacy toggle). (2) Created `feedCache.adapter.js` cross-feature adapter for clean imports. (3) Fixed follow cache to store full viewer graph, filter in-memory. (4) Added PostDetail visibility gate (`postVisibility.dal.js` — parallel block+privacy, serial follow). (5) Added `canViewContent` gate to `useActorPosts` to prevent React Query caching private posts. (6) Fixed `readFollowState.dal.js` with real DB query. (7) Added 8s TTL cache to `dalGetFollowStatus`. (8) Added in-flight dedup to `actorPrivacy.dal.js`. (9) Added session binding (`assertingActorId`) to block and follow-request accept/decline controllers. (10) DB migrations: `blocks_select_blocked` policy on `moderation.blocks`; block exclusion added to `vc.posts SELECT` policy; two new indexes on `vc.posts`.
- **Impact:** Cache invalidation is now immediate on write. Follow cache: one DB fetch per viewer per session (not per page). PostDetail: private posts and blocked posts are gated server-side AND client-side. Profile posts: React Query never caches private content. `isFollowing` on profile cards now reflects real follow state. Block/follow-request controllers reject requests where the caller's session doesn't match the actor they're acting as.
- **Files Changed:** `blockActor.controller.js`, `useBlockActions.js`, `useBlockActorAction.js`, `follow.controller.js`, `unsubscribe.controller.js`, `followRequests.controller.js`, `useFollowRequestActions.js`, `actorPrivacy.controller.js` (settings), `feed.read.followRows.dal.js`, `feed.read.actorsBundle.dal.js`, `readFollowState.dal.js`, `actorFollows.dal.js`, `actorPrivacy.dal.js`, `useActorPosts.js`, `ActorProfilePostsView.jsx`, `ActorProfileViewScreen.jsx`, `getPostById.controller.js`, `usePostDetailPost.js`, `PostDetail.view.jsx`, `fetchPostsForActor.dal.js`. New: `postVisibility.dal.js`, `feedCache.adapter.js`, migration files, db_snapshot files.
- **Full execution log:** `logan/marvel/wolverine/2026-05-10.block-follow-privacy-enforcement.md`

---

## Session: 2026-04-12

### Profile 6-Slice Fix

- **Problem:** Profile screen made 6+ separate DAL calls that overlapped with each other and with the hydration engine. `public.profiles` and `vc.actors` were fetched independently by multiple components.
- **Solution:** Consolidated profile data loading into a 6-slice architecture where the profile controller issues a single coordinated read. Eliminated duplicate `public.profiles` reads.
- **Impact:** Reduced profile route queries from ~10 to ~5 on first load.
- **Files Changed:** Profile controller, profile DALs, profile view screens.

---

### Settings Architecture Fixes

- **Problem:** Settings screen had architectural issues with tab loading and redundant data fetching across tabs.
- **Solution:** Restructured settings into properly lazy-loaded tabs with isolated data fetching per tab. No DAL calls fire on initial settings route entry; data loads only when a tab is activated.
- **Impact:** Settings route now has zero queries on mount. Each tab loads independently.
- **Files Changed:** Settings screen, tab views, privacy tab, profile tab.

---

### Notification Migration

- **Problem:** Notification system read from both `vc.notifications` (legacy) and `notification.inbox_items` (new engine). Duplicate reads across schemas. Recipients table queried multiple times per navigation.
- **Solution:** Migrated notification reads to use the `@notifications` engine exclusively via `notification.inbox_items` and `notification.recipients`. Eliminated all `vc.notifications` reads.
- **Impact:** Removed an entire schema from the notification read path. Reduced total notification queries per navigation.
- **Files Changed:** Notification controllers, notification DALs, notification hooks.

---

### Identity Result Cache

- **Problem:** `useIdentity()` triggered fresh DAL calls on every component mount. Deep component trees caused identity re-resolution cascades, especially on routes with many identity-dependent components.
- **Solution:** Added 60s TTL result cache to the identity controller. Subsequent calls within the TTL window return the cached result without DAL calls.
- **Impact:** Eliminated repeated `vc.actors` and `platform.user_app_actor_links` reads within a session. Typical identity resolution dropped from 3-5 DAL calls per route to 0 on cache hit.
- **Files Changed:** Identity controller (`identity.controller.js`).

---

### Privacy DAL Cache

- **Problem:** `vc.actor_privacy_settings` was read 3 times per profile navigation: once for profile visibility, once for content gate, once for follow-button logic.
- **Solution:** Wrapped the privacy settings DAL with `createTTLCache()` from `shared/lib/ttlCache.js`. All reads for the same actorId within the TTL window share a single result.
- **Impact:** Reduced privacy reads from 3x to 1x per profile navigation. Write-path cache busting via `invalidate*()` ensures consistency when privacy settings are changed.
- **Files Changed:** Privacy DAL, shared TTL cache utility.

---

### Vport Profile Parallel Prefetch

- **Problem:** Vport profile data loaded in a waterfall: kind resolution -> vport metadata -> services -> gallery -> owner profile. 4-5 serial queries.
- **Solution:** After kind resolution (required for branching), all remaining vport data fetches run in `Promise.all()`. Two-phase pattern: resolve kind, then parallel fetch all dependent data.
- **Impact:** Reduced vport profile load time by ~60% (from sum of all queries to max of parallel queries + kind resolution).
- **Files Changed:** Vport profile controller, vport profile screen.

---

### canViewContent Gate Stabilization

- **Problem:** `canViewContent` gate ran as an independent async check alongside profile data fetch, causing double reads of privacy settings and follow status.
- **Solution:** Gate result is now computed once and shared across the profile render tree. Privacy data from the cached DAL feeds both the gate and the UI components.
- **Impact:** Eliminated 2 redundant queries per profile navigation.
- **Files Changed:** Profile gate logic, canViewContent controller.

---

### DB Optimization Pass — countUnread Cache + Identity TTL + N+1 Batch

- **Problem:** `countUnread` was called on every badge poll (45s) and every realtime event without caching, hitting `notification.recipients` + `notification.inbox_items` each time. Identity TTL at 60s caused unnecessary re-resolution on longer sessions. `loadOwnedActorChoices` had an N+1 query pattern fetching actor details one at a time.
- **Solution:** Added 5s TTL cache with inflight deduplication to `countUnread`. Raised identity controller TTL from 60s to 120s. Converted `loadOwnedActorChoices` from N+1 individual fetches to a single batch query.
- **Impact:** Reduced badge-related queries by ~80% on cache hit. Identity re-resolution dropped further on longer sessions. Actor choices load in 1 query instead of N.
- **Files Changed:** `countUnread.controller.js`, `identity.controller.js`, actor choices DAL.

---

### Chat Badge Fix — useUnreadBadge Rewired

- **Problem:** `useUnreadBadge` was routing through the notification engine (`countUnread`) to get chat badge counts, causing cross-schema queries against `notification.recipients` when the source of truth for chat unread is `chat.inbox_entries`.
- **Solution:** Rewired `useUnreadBadge` to read directly from `chat.inbox_entries` (sum of `unread_count`), bypassing the notification engine entirely for chat badge state.
- **Impact:** Eliminated cross-schema notification queries from chat badge path. Chat badge now reads from its true source of truth with lower latency.
- **Files Changed:** `useUnreadBadge.js`, `inboxUnread.controller.js`.

---

### Bootstrap Dedup — vport.core.dal Cleanup + Feed Viewer Dead Queries + AuthProvider Stabilization

- **Problem:** `vport.core.dal` contained DEV-only diagnostic queries that fired in production. Feed pipeline had two viewer context queries (`readViewerActorIdentityDAL` + `readProfileAdultFlagDAL`) that duplicated identity resolution already handled by the identity engine. AuthProvider token refresh triggered cascading identity re-resolution on every token renewal.
- **Solution:** Removed DEV queries from `vport.core.dal` production path. Removed viewer context queries from feed pipeline (identity engine provides this data). Stabilized AuthProvider token refresh to avoid triggering identity re-resolution cascades.
- **Impact:** Removed 2-4 redundant queries per feed load. Eliminated periodic re-resolution spikes from token refresh. Bootstrap overhead reduced to near-zero on cache hit.
- **Files Changed:** `vport.core.dal.js`, feed pipeline files, `AuthProvider` / auth setup, feed DALs.

---

### Notification Legacy Cleanup — 3 DALs Deleted + Dev Diagnostics Migrated

- **Problem:** After full migration to the notification engine, 3 orphaned legacy DALs remained: `notifications.dal.js`, `notifications.read.dal.js`, `notifications.count.dal.js`. These queried the deprecated `vc.notifications` table and were no longer called by any runtime code. Dev diagnostics still referenced legacy write DAL.
- **Solution:** Deleted the 3 orphaned legacy DALs. Migrated dev diagnostics to use the notification engine instead of legacy DALs.
- **Impact:** Removed dead code. Eliminated risk of accidental legacy table reads. Dev diagnostics now exercise the same path as production.
- **Files Changed:** 3 DALs deleted, dev diagnostics group updated.

---

### Settings Phase 1 — Supabase Bypass Extracted to DAL + Cross-Feature Import Fixed

- **Problem:** Settings feature had direct Supabase client calls scattered across controller and screen files instead of going through DAL layer. A cross-feature import violated the architecture layer order.
- **Solution:** Extracted all direct Supabase calls into proper DAL files. Fixed cross-feature import to use the correct dependency direction (controller calls DAL, not another feature's internal module).
- **Impact:** Settings feature now follows DAL -> Controller -> Hook -> Screen architecture consistently. No more direct DB access from UI or controller layers.
- **Files Changed:** Settings DALs (new), settings controllers, settings screens.

---

### Performance Dashboard — Known Issues Panel + Download Recommendations

- **Problem:** No centralized view of known performance issues or optimization recommendations for developers.
- **Solution:** Added a Known Issues panel to the performance dashboard debugger showing current bottleneck statuses. Added a Download Recommendations button that exports optimization guidance as a structured document.
- **Impact:** Developer experience improvement. Performance status visible at a glance during development.
- **Files Changed:** Performance dashboard debugger files.

---

### Bootstrap Store — Centralized Session Unread Architecture

- **Problem:** `BottomNavBar` ran two independent polling hooks (`useNotiCount` at 45s, `useUnreadBadge` at 15s), each maintaining separate realtime Supabase subscriptions tied to the component's render lifecycle. Any additional consumer of unread counts would have created a third set of subscriptions.
- **Solution:** Created `apps/VCSM/src/bootstrap/` layer: a Zustand store (`bootstrap.store.js`) holding `notificationUnread` and `chatUnread`, a hydration controller (`bootstrap.hydrate.controller.js`) that owns all polling and realtime subscriptions, typed selectors (`bootstrap.selectors.js`), and explicit invalidation helpers (`bootstrap.invalidate.js`). `BottomNavBar` now calls `useBootstrapHydration(actorId)` once and reads counts from selectors.
- **Impact:** Polling intervals lengthened (60s notification, 30s chat — realtime handles near-instant changes). Single subscription set per session instead of per-component. Unread counts are now globally available for any future consumer without new subscriptions.
- **Files Changed:** `bootstrap.store.js` (new), `bootstrap.hydrate.controller.js` (new), `bootstrap.selectors.js` (new), `bootstrap.invalidate.js` (new), `BottomNavBar.jsx`.
