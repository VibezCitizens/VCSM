# VCSM Performance Route Profiles

Maintained by: Logan
Last updated: 2026-04-12
Source: `logan/navigation/vcsm.navigation.audit.md`

---

## /feed (Central Feed)

- **Screen:** `CentralFeedScreen`
- **Feature:** `features/feed`
- **Navigation Source:** BottomNavBar Home icon (NavLink)
- **Query Profile:**
  - Feed pipeline (per page, parallel): `readFeedPostsPage`, `readPostMediaMap`, `readHiddenPostsForViewer`, `readActorsBundle`, `readFeedBlockRowsDAL`, `readFeedFollowRowsDAL` (6 queries)
  - Conditional: `fetchPostMentionRows` (if "@" in text)
- **Total Queries Per Load:** 6-7
- **Engines:** Identity (read, cached 120s TTL), Hydration (upsert + background hydrate)
- **Known Issues:** Feed hydration pressure (by design). Bootstrap duplication FIXED (viewer dead queries removed, identity cached).
- **Performance Notes:** 6 parallel DALs is by design. Viewer context queries (`readViewerActorIdentityDAL` + `readProfileAdultFlagDAL`) removed — identity engine provides this data via cache. Media preloading for first 3 posts. IntersectionObserver for pagination triggers full pipeline again. Background hydration is non-blocking.

---

## /profile/:actorId (Profile)

- **Screen:** `ActorProfileScreen` -> `ActorProfileViewScreen` (user) or `VportProfileKindScreen` (vport)
- **Feature:** `features/profiles`
- **Navigation Source:** BottomNavBar Citizen icon (NavLink)
- **Query Profile (user kind):**
  - Kind resolution: `readActorKindDAL` (1 query, skipped for "self")
  - Profile data: consolidated 6-slice read (1-2 queries after fix)
  - Privacy check: `vc.actor_privacy_settings` (1 query, cached)
- **Query Profile (vport kind):**
  - Kind resolution: `readActorKindDAL` (1 query)
  - Parallel: vport metadata + services + gallery + owner profile (4 queries in Promise.all)
- **Total Queries Per Load:** 3-5 (user), 5-6 (vport)
- **Engines:** Identity (read), Hydration (dev-only)
- **Known Issues:** Profile duplicate fetch (FIXED), privacy triple-read (FIXED), vport profile waterfall (FIXED)
- **Performance Notes:** All major bottlenecks resolved. Monitor for regression from new profile sub-features.

---

## /explore (Explore/Search)

- **Screen:** `ExploreScreen` -> `SearchScreen`
- **Feature:** `features/explore`
- **Navigation Source:** BottomNavBar Explore icon (NavLink)
- **Query Profile:**
  - Idle: No queries (shows onboarding cards)
  - Search (filter=all): parallel calls to actors, posts, videos, groups (4 queries)
  - Search (single filter): 1 query
- **Total Queries Per Load:** 0 (idle), 1-4 (searching)
- **Engines:** None
- **Known Issues:** None. Search has its own 45s TTL cache with inflight dedup.
- **Performance Notes:** 300ms debounce on input. Results cached in-memory. Lightest route in the app.

---

## /chat (Vox Inbox)

- **Screen:** `InboxScreen`
- **Feature:** `features/chat`
- **Navigation Source:** BottomNavBar Vox icon (NavLink)
- **Query Profile:**
  - Inbox load: delegated to `@chat` engine (`chat.inbox_entries`, 1-2 queries)
  - Preview building: local transform, no queries
- **Total Queries Per Load:** 1-2
- **Engines:** Chat (read + realtime), Identity (read)
- **Known Issues:** Background polling noise from `useUnreadBadge` (15s interval, runs globally) — mitigated by 10s TTL cache.
- **Performance Notes:** Realtime subscription handles live updates. `noti:refresh` event fires on route entry for immediate badge sync. `useUnreadBadge` now reads directly from `chat.inbox_entries` instead of routing through notification engine.

---

## /upload (Upload)

- **Screen:** `UploadScreen` -> `UploadScreenModern`
- **Feature:** `features/upload`
- **Navigation Source:** BottomNavBar Plus button (imperative navigate)
- **Query Profile:**
  - On mount: 0 queries (form only)
  - On submit: auth check + post insert + media insert + mentions (4-6 queries)
- **Total Queries Per Load:** 0 (mount), 4-6 (submit)
- **Engines:** Identity (read)
- **Known Issues:** None on the read path. Write path has rollback logic if media insert fails.
- **Performance Notes:** No performance concerns. Queries only fire on user action.

---

## /notifications (Notifications)

- **Screen:** `NotificationsScreen` -> `NotificationsScreenView`
- **Feature:** `features/notifications`
- **Navigation Source:** BottomNavBar Notifications icon (NavLink)
- **Query Profile:**
  - Inbox fetch: `getInboxNotifications` via `@notifications` engine (1-2 queries)
  - Block filter: `loadBlockSets` (1 query)
  - Sender resolution: `resolveSenders` (1 query)
  - Actor resolution: `resolveInboxActor` (1 query)
  - Unread count: `countUnread` via `@notifications` engine (1 query)
  - Follow request filter: `ctrlListIncomingRequests` (1 query)
- **Total Queries Per Load:** 5-7
- **Engines:** Notifications (read + realtime + autoMarkSeen), Identity (read, cached 120s TTL)
- **Known Issues:** Notification recipient duplication (FIXED — countUnread 5s TTL cache + dedup). Bootstrap duplication (FIXED — identity 120s cache).
- **Performance Notes:** `autoMarkSeen` fires on load. `noti:refresh` event triggers badge sync. Block filtering adds 1 query but prevents showing notifications from blocked users. `countUnread` cached with 5s TTL; inbox state mutations bust cache.

---

## /settings (Settings)

- **Screen:** `SettingsScreen`
- **Feature:** `features/settings`
- **Navigation Source:** BottomNavBar Settings icon (NavLink)
- **Query Profile:**
  - On mount: 0 queries (tabs are lazy-loaded)
  - Privacy tab: block lists + privacy settings + pending follow requests (2-3 queries)
  - Profile tab: profile data (1-2 queries)
  - Account tab: account data (1 query)
  - Vports tab: owned vports (1 query)
- **Total Queries Per Load:** 0 (mount), 1-3 (per tab activation)
- **Engines:** Identity (read)
- **Known Issues:** None after settings architecture fix
- **Performance Notes:** Lightest protected route. No polling, no realtime. Lazy tab loading means zero initial cost.

---

## Background Activity (Always Running)

- **Source:** `BottomNavBar` (always mounted, CSS-hidden on some routes)
- **Query Profile:**
  - `useNotiCount`: notification badge poll every 45s (1-2 queries per poll, 15s TTL cache, countUnread has 5s TTL + dedup)
  - `useUnreadBadge`: chat unread poll every 15s (1 query per poll, 10s TTL cache, reads `chat.inbox_entries` directly)
  - Realtime: 2 Supabase channels (`noti-badge-{actorId}`, `chat-badge-{actorId}`)
- **Total Queries Per Minute:** ~5-8 (polling) + event-driven realtime refreshes
- **Known Issues:** Background polling noise
- **Performance Notes:** Both hooks have TTL caches that prevent redundant fetches. Realtime subscriptions provide 2s debounced refresh. `noti:refresh` custom event provides on-demand sync.
