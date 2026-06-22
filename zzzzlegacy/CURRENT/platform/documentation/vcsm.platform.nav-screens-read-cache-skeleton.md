# VCSM Platform — Bottom Nav Screens: Read Patterns, Cache & Skeleton Status

**Last updated:** April 10, 2026

## 1. Screen Map

The bottom nav has 7 tabs. Each maps to a screen with different DB read behavior.

| # | Tab | Route | Screen File |
|---|---|---|---|
| 1 | Home | `/feed` | `features/feed/screens/CentralFeedScreen.jsx` |
| 2 | Explore | `/explore` | `features/explore/screens/ExploreScreen.jsx` |
| 3 | Vox (Chat) | `/chat` | `features/chat/inbox/screens/InboxScreen.jsx` |
| 4 | Upload (+) | `/upload` | `features/upload/screens/UploadScreen.jsx` |
| 5 | Notifications | `/notifications` | `features/notifications/screen/NotificationsScreen.jsx` |
| 6 | Citizen | `/profile/{actorId}` | `features/profiles/screens/ActorProfileScreen.jsx` |
| 7 | Settings | `/settings` | `features/settings/screen/SettingsScreen.jsx` |

---

## 2. Per-Screen Read Pattern

### Screen 1 — Feed (`/feed`)

**Mount reads:**
1. `useFeed()` → `fetchFeedPage.pipeline.js` → `vc.posts` (10+1 rows, cursor pagination)
2. **6 parallel reads:** post_media, post_mentions, hidden_posts, actors_bundle, block_rows, follow_rows
3. Background: `hydrateActorsByIds` → RPC `get_actor_summaries`

**Tables:** vc.posts, vc.post_media, vc.post_mentions, vc.actors, public.profiles, vc.vports, vc.actor_privacy_settings, moderation.blocks, moderation.actions, vc.actor_follows

**Skeleton:** YES — 3-card purple shimmer skeleton
**Cache:** Actor store (Zustand 5min TTL). Feed posts NOT cached.
**Time to content:** ~1-2.5s (media preload adds latency)

**Gap:** Feed pages themselves have no cache. Pull-to-refresh is the only freshness mechanism.

---

### Screen 2 — Explore (`/explore`)

**Mount reads:** NONE — explore only reads when user types a search query.

**On search:**
1. `useSearchTabsActor()` → `vc.actor_presentation` or `identity.search_actor_directory` RPC
2. Block filtering → `moderation.blocks`

**Tables (on search):** vc.actor_presentation, moderation.blocks

**Skeleton:** NO — shows "Loading..." text during search
**Cache:** 45s per-query client cache in hook
**Time to content:** Instant (no mount read). Search results ~300ms.

**Gap:** No skeleton for search results. Should use `SkeletonRow` during search loading.

---

### Screen 3 — Chat Inbox (`/chat`)

**Mount reads:**
1. `useInbox()` → `ctrlGetInboxEntries()` → `chat.inbox_entries` with nested joins
2. Hidden messages → `chat.message_receipts`
3. Actor hydration → `hydrateAndReturnSummaries` (shared store)

**Tables:** chat.inbox_entries, chat.conversations, chat.conversation_members, chat.messages, chat.message_receipts

**Skeleton:** YES — 7-row inbox skeleton
**Cache:** Actor summaries via shared hydration store (5min). Inbox list NOT cached.
**Realtime:** YES — `subscribeToInbox` listens to inbox_entries changes.
**Time to content:** <500ms (optimized nested join)

**Gap:** Inbox list refetches fully on every mount and every realtime event. No incremental update.

---

### Screen 4 — Upload (`/upload`)

**Mount reads:** NONE — form-only screen. No DB reads on mount.

**Tables:** None until submit.

**Skeleton:** N/A — instant render
**Cache:** N/A
**Time to content:** Instant

**Gap:** ActorPill reads identity from context (already loaded). No DB read needed.

---

### Screen 5 — Notifications (`/notifications`)

**Mount reads:**
1. `useNotifications()` → `getNotifications()` → `vc.notifications` (20 rows)
2. Parallel: `loadBlockSets()` → `moderation.blocks` (both directions)
3. Sender resolution → `hydrateAndReturnSummaries` (shared store, was 3-tier)
4. Auto mark-seen → UPDATE `vc.notifications` (fire-and-forget)

**Header reads:**
5. `useNotificationsHeader` → COUNT on `vc.notifications` (is_seen=false)

**Tables:** vc.notifications, moderation.blocks, vc.actors (via hydration store)

**Skeleton:** YES — 6-row purple shimmer skeleton
**Cache:** Badge count (15s TTL). Actor summaries via shared store (5min). List NOT cached.
**Realtime:** YES — badge subscription on vc.notifications + chat.inbox_entries
**Time to content:** ~500ms-1s

**Gap:** Notification list refetches on every mount. Block sets loaded every time (could cache per session).

---

### Screen 6 — Profile (`/profile/{actorId}`)

**Mount reads:**
1. `useActorKind()` → `vc.actors` SELECT kind (blocks screen render)
2. **3 parallel after kind resolves:**
   - `useProfileView` → RPC `vc.read_actor_profile` + `vc.actor_privacy_settings`
   - `useProfileGate` → `vc.actor_privacy_settings` + `vc.actor_follows`
   - `useBlockStatus` → `moderation.blocks`
3. If canView: `readActorPostsDAL` → `vc.posts` + `vc.post_media` + `vc.post_mentions`
4. VPORT only: `useVportPublicDetails` → `vc.vport_public_details` (CACHED 60s)
5. Header: `useFollowerCount` → `vc.actor_follows` COUNT

**Tables:** vc.actors, public.profiles, vc.vports, vc.vport_public_details, vc.actor_privacy_settings, vc.actor_follows, vc.posts, vc.post_media, vc.post_mentions, moderation.blocks

**Skeleton:** YES — SkeletonCardList (2 cards)
**Cache:** VPORT public details (60s TTL). Actor summary upserted to shared store. Posts NOT cached.
**Time to content:** ~300ms (kind check) + ~500ms (profile data)

**Gap:** Kind resolution is sequential (blocks render). Privacy check duplicated. Follower count is separate query (could embed in RPC).

---

### Screen 7 — Settings (`/settings`)

**Mount reads:** Deferred — settings uses Suspense + lazy tabs.

**On Privacy tab (default):**
1. `useActorPrivacy` → `vc.actor_privacy_settings`
2. Block list → `moderation.blocks` (via blocks.dal.js)

**On Profile tab:**
3. Profile data → `public.profiles`

**On Account tab:**
4. Account data → `platform.user_app_accounts` + `platform.user_app_state`

**On Vports tab:**
5. Vport list → `vc.vports` + `vc.actors`

**Tables (varies by tab):** vc.actor_privacy_settings, moderation.blocks, public.profiles, platform.user_app_accounts, vc.vports, vc.actors

**Skeleton:** NO — uses Suspense fallback ("Loading...")
**Cache:** None
**Time to content:** ~500ms per tab switch

**Gap:** No skeleton states. Each tab re-reads on mount. Settings data rarely changes — good candidate for session-level cache.

---

## 3. Status Matrix

| Screen | Skeleton | TTL Cache | Shared Actor Store | Realtime | Mount Read |
|---|---|---|---|---|---|
| Feed | YES | Posts: NO, Actors: YES (5min) | YES | NO | Heavy (multi-query pipeline) |
| Explore | NO | Query: YES (45s) | NO | NO | None (search-driven) |
| Chat Inbox | YES | List: NO, Actors: YES (5min) | YES | YES | Medium (nested join) |
| Upload | N/A | N/A | N/A | N/A | None |
| Notifications | YES | Badge: YES (15s), List: NO, Actors: YES (5min) | YES | YES (badge) | Medium |
| Profile | YES | VPORT details: YES (60s), Actors: YES (5min) | YES | NO | Heavy (kind → profile → posts) |
| Settings | NO | NO | NO | NO | Light (per-tab lazy) |

## 4. Skeleton Gaps (Need Work)

| Screen | Current State | Needed |
|---|---|---|
| Explore search results | "Loading..." text | `SkeletonRow` × 4 during search |
| Settings (all tabs) | Suspense "Loading..." | `SkeletonCardList` per tab |

## 5. Cache Gaps (Need Work)

| Screen | Data | Recommendation | TTL |
|---|---|---|---|
| Feed post pages | Post list per page | Stale-while-revalidate | 15s |
| Inbox conversation list | Inbox entries | Short TTL or incremental update | 10s |
| Notification list | Notification rows | Short TTL | 10s |
| Profile posts | Actor posts | Per-actor TTL | 15s |
| Settings privacy | Privacy settings | Session-level | Until edit |
| Settings account | Account data | Session-level | Until edit |
| Block sets | Active blocks both directions | Session-level | Until block/unblock |

## 6. Already Cached (Implemented This Session)

| Data | TTL | File |
|---|---|---|
| Actor summaries | 5min | `engines/hydration/src/store.js` (Zustand) |
| VPORT public details | 60s | `getVportPublicDetails.controller.js` |
| VPORT services | 60s | `getVportServices.controller.js` |
| VPORT review stats + config | 60s | `vportReviews.read.dal.js` |
| Portfolio first page | 60s | `VportPortfolio.controller.js` |
| Legal active docs | 5min | `legalConsent.controller.js` |
| Booking availability | 5min | `getResourceAvailability.controller.js` |
| Notification badge count | 15s | `useNotiCount.js` |
| Chat inbox badge count | 10s | `useUnreadBadge.js` |
| Explore search results | 45s | `useSearchTabsActor` hook |

## 7. Bottom Nav Bar Reads

The nav bar itself triggers 2 persistent reads:
1. `useNotiCount` → COUNT on `vc.notifications` (15s cache + 45s poll + realtime)
2. `useUnreadBadge` → SUM `chat.inbox_entries.unread_count` (10s cache + 15s poll + realtime)

These run globally regardless of which screen is active.

## 8. Change Log

### 2026-04-10 08:30 AM
- Task: Map all bottom nav screen read patterns + cache/skeleton status
- Summary: Documented the initial DB read pattern for all 7 bottom nav screens. Mapped which have skeletons, which have TTL caches, which use the shared actor store, and which use realtime. Identified 2 skeleton gaps and 7 cache gaps. Listed all 10 caches already implemented this session.
