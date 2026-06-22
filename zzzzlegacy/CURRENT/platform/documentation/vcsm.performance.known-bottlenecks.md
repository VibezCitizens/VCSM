# VCSM Performance Known Bottlenecks

Maintained by: Logan
Last updated: 2026-04-12

---

## Bootstrap Duplication

- **Category:** duplicate-query
- **Affected Routes:** /feed, /profile/:actorId, /notifications, /settings, /chat, /explore
- **Typical Query Signatures:**
  - `platform.user_app_actor_links`
  - `platform.user_app_state`
  - `platform.user_app_preferences`
  - `platform.v_user_app_context`
- **Likely Root Cause:** Identity and app-context resolution runs on every protected route mount. Multiple components independently call bootstrap DALs before the shared result is cached. The identity controller resolves platform state each time `useIdentity()` triggers a fresh context build.
- **Fix Status:** FIXED (multi-pass). Identity engine TTL raised to 120s. `vport.core.dal` DEV-only queries removed from production path. AuthProvider token refresh stabilized (no longer triggers cascading re-resolution). Feed viewer dead queries (`readViewerActorIdentityDAL` + `readProfileAdultFlagDAL`) removed from feed pipeline. Bootstrap overhead reduced to near-zero on cache hit.
- **Recommended Next Action:** Monitor for regression. Consider single bootstrap RPC if first-load query count remains a concern on cold start.

---

## Profile Duplicate Fetch

- **Category:** duplicate-query
- **Affected Routes:** /profile/:actorId
- **Typical Query Signatures:**
  - `public.profiles` (multiple reads for same actorId)
  - `vc.actors` (overlapping reads with profile resolution)
- **Likely Root Cause:** Profile screen resolves actor kind via `vc.actors`, then the profile view component independently fetches `public.profiles` for display data. The hydration engine may also fetch actor data in parallel, creating overlap between `public.profiles` and `vc.actors` reads for the same entity.
- **Fix Status:** Fixed with 6-slice profile architecture. Profile controller now issues a single consolidated read that covers both actor metadata and profile display fields.
- **Recommended Next Action:** Monitor for regression. Ensure new profile sub-features use the consolidated profile controller rather than direct DAL calls.

---

## Privacy Triple-Read

- **Category:** duplicate-query
- **Affected Routes:** /profile/:actorId, /feed (per-card privacy checks)
- **Typical Query Signatures:**
  - `vc.actor_privacy_settings` (3x reads for same actorId within one navigation)
- **Likely Root Cause:** Three independent code paths each read privacy settings: the profile visibility gate, the content visibility gate (`canViewContent`), and the follow-button privacy check. Each path called the DAL independently.
- **Fix Status:** FIXED. Privacy DAL now uses `createTTLCache()` from `shared/lib/ttlCache.js`. All three reads resolve from cache after the first fetch.
> **Fix Status (2026-05-10 update):** In-flight dedup added to `dalGetActorPrivacy` via a pending Promise Map — concurrent callers for the same actorId share one round-trip. Cache invalidation wired to privacy toggle write path. The per-session triple-read on profile load remains (three callers still exist) but they now share one in-flight request on cold cache.
- **Recommended Next Action:** None required. Cache invalidation is handled by write-path busting. Monitor if new privacy checks bypass the cached DAL.

---

## canViewContent Double-Fetch

- **Category:** duplicate-query
- **Affected Routes:** /profile/:actorId
- **Typical Query Signatures:**
  - `vc.actor_privacy_settings` (subset of privacy triple-read)
  - `vc.actor_follows` (follow-status check for gating)
- **Likely Root Cause:** The `canViewContent` gate ran as an independent async check alongside the profile data fetch, causing both to independently resolve privacy and follow status before either could share results.
- **Fix Status:** FIXED. Gate stabilization ensures `canViewContent` result is computed once and shared across the profile render tree.
- **Recommended Next Action:** None required. Covered by privacy cache and gate stabilization.

---

## Identity Re-Resolution

- **Category:** duplicate-query
- **Affected Routes:** All protected routes
- **Typical Query Signatures:**
  - `vc.actors` (identity lookup)
  - `platform.user_app_actor_links`
- **Likely Root Cause:** `useIdentity()` re-resolved the current actor on every component mount. Components deep in the tree that called `useIdentity()` triggered fresh DAL calls when the context was not yet populated.
- **Fix Status:** FIXED. Identity controller now caches resolved identity for 60s. Subsequent calls within the TTL return the cached result without DAL calls.
- **Recommended Next Action:** None required. Monitor if actor-switch flows properly invalidate the cache.

---

## Vport Profile Waterfall

- **Category:** waterfall
- **Affected Routes:** /profile/:actorId (vport kind)
- **Typical Query Signatures:**
  - `vc.actors` (kind resolution)
  - `vc.vports` (vport metadata)
  - `vc.vport_services` (service list)
  - `vc.vport_gallery` (gallery media)
  - `public.profiles` (owner profile)
- **Likely Root Cause:** Vport profile loaded data sequentially: first resolve kind, then fetch vport metadata, then fetch services and gallery. Each step waited for the previous to complete, creating a waterfall of 4-5 serial queries.
- **Fix Status:** FIXED. Parallel prefetch pattern now fires vport metadata, services, gallery, and owner profile in `Promise.all()` after kind resolution.
- **Recommended Next Action:** None required. The two-phase pattern (kind resolution then parallel data) is the optimal approach given the kind-dependent branching.

---

## Notification Recipient Duplication

- **Category:** duplicate-query
- **Affected Routes:** /notifications
- **Typical Query Signatures:**
  - `notification.recipients` (repeated reads for same recipient_actor_id)
- **Likely Root Cause:** The notification inbox controller fetches inbox items, then the badge controller independently reads recipients for unread count. The `resolveInboxActor` step also queries recipients to map actor IDs. Three independent reads of the same recipients table within one navigation event.
- **Fix Status:** FIXED. `countUnread` now has a 5s TTL cache with deduplication — concurrent calls within the window share a single result. Inbox state mutations (markSeen, markRead, dismiss, archive) bust the cache to ensure consistency. Badge polling (45s) hits cache on most cycles.
- **Recommended Next Action:** None required. Monitor cache hit rate. If polling interval is reduced below 5s in the future, TTL should be lowered to match.

---

## Feed Hydration Pressure

- **Category:** parallel-load
- **Affected Routes:** /feed
- **Typical Query Signatures:**
  - `vc.posts` (paginated)
  - `vc.post_media` (media map)
  - `moderation.actions` (hidden posts)
  - `vc.actors` + `public.profiles` + `vc.vports` + `vc.actor_privacy_settings` (actors bundle)
  - `moderation.blocks` (block rows)
  - `vc.actor_follows` (follow rows)
- **Likely Root Cause:** Feed pipeline intentionally runs 6+ DAL calls in parallel per page fetch via `Promise.all()`. This is architecturally correct but creates high concurrent query pressure on Supabase. Each pagination event triggers the full bundle again.
- **Fix Status:** By design. The parallel approach is faster than sequential. The actors bundle DAL consolidates what was previously 4 separate queries.
- **Recommended Next Action:** Monitor total query time per page. Consider caching the actors bundle result for actors already in the hydration store. Background hydration (`hydrateActorsByIds`) already handles stale actor refresh without blocking the render.

---

## Background Polling Noise

- **Category:** background-noise
- **Affected Routes:** All routes (runs from BottomNavBar, always mounted)
- **Typical Query Signatures:**
  - `notification.inbox_items` / `notification.recipients` (badge poll)
  - `chat.inbox_entries` (badge poll)
- **Likely Root Cause:** Two badge hooks previously ran continuously from `BottomNavBar`: `useNotiCount` (45s interval) and `useUnreadBadge` (15s interval). Both also had realtime subscriptions with 2s debounce — each maintaining independent subscriptions tied to BottomNavBar render lifecycle.
- **Fix Status:** FIXED. Centralized into `bootstrap/` architecture. `useBootstrapHydration(actorId)` owns a single set of realtime subscriptions and polling intervals (60s notification, 30s chat). BottomNavBar reads counts from `useNotificationUnread()` / `useChatUnread()` selectors backed by a shared Zustand store. Per-component subscriptions eliminated.
- **Recommended Next Action:** None required. Polling intervals are now longer than the previous 15s minimum. Realtime subscriptions in `bootstrap.hydrate.controller.js` handle near-instant badge updates. The `noti:refresh` event triggers immediate refresh of both counts from any write path.

---

## Follow Cache Page-Scope Miss

- **Category:** cache-design
- **Affected Routes:** /feed (on scroll)
- **Typical Query Signatures:** `vc.actor_follows` WHERE `follower_actor_id = ? AND followed_actor_id IN (page actor IDs)`
- **Root Cause:** The follow cache was keyed per viewer but the DB query scoped to the current page's actor IDs. On cache miss, a partial set was stored. Every new scroll page had different actor IDs → cache miss → new DB query.
- **Fix Status:** FIXED 2026-05-10. Cache now stores the full viewer follow graph. DB query removes the `.in("followed_actor_id", ...)` filter. First page fetches the entire graph once; all subsequent pages do in-memory Set lookups.
