# VCSM — Full Cache Discovery & Audit

**Generated:** 2026-04-12
**Scope:** Entire repository (apps/VCSM, apps/wentrex, engines/, debuggers/)

---

## Section 1 — Cache File Index

### 1.1 Shared TTL Cache Utility

| File | Purpose | Consumers |
|------|---------|-----------|
| `apps/VCSM/src/shared/lib/ttlCache.js` | Generic TTL cache factory (`createTTLCache(ttlMs)`) — Map-based with get/set/invalidate/has | 18 files |

### 1.2 DAL-Level TTL Caches

| File | What's Cached | TTL | Key | Invalidation |
|------|---------------|-----|-----|--------------|
| `profiles/dal/readActorKind.dal.js` | Actor kind (`user`/`vport`) | 10min | actorId | Manual |
| `profiles/dal/readVportType.dal.js` | Actor kind + vport_type | 10min | actorId | Manual |
| `profiles/dal/readActorProfile.dal.js` | Full actor profile + privacy | 30s | actorId | `invalidateActorProfileCache(actorId)` |
| `profiles/dal/tags/readActorVibeTags.dal.js` | Actor vibe tags + tag catalog | 2min / 5min | actorId / `__catalog` | `invalidateActorTagsCache(actorId)` |
| `profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js` | FX/exchange rates | 60s | `${actorId}:${rateType}` | `invalidateRatesCache()` (clears ALL) |
| `profiles/kinds/vport/dal/gas/vportFuelPrices.read.dal.js` | Gas pricing | 60s | actorId | `invalidateFuelPriceCache(actorId)` |
| `profiles/kinds/vport/dal/subscribersCount.dal.js` | Vport subscriber count (RPC) | 60s | actorId | `invalidateSubscriberCount(actorId)` |
| `profiles/kinds/vport/dal/review/vportReviews.read.dal.js` | Review stats + form config (2 caches) | 60s | actorId | `invalidateVportReviewCaches(actorId)` |
| `social/friend/subscribe/dal/subscriberCount.dal.js` | Actor follower count | 60s | actorId | `invalidateFollowerCount(actorId)` |

### 1.3 Controller-Level TTL Caches

| File | What's Cached | TTL | Key | Invalidation |
|------|---------------|-----|-----|--------------|
| `profiles/kinds/vport/controller/getVportPublicDetails.controller.js` | Vport public details | 60s | actorId | `invalidateVportPublicDetails(actorId)` |
| `profiles/kinds/vport/controller/menu/getVportActorMenu.controller.js` | Menu categories + items (viewer only) | 60s | actorId | `invalidateMenuCache(actorId)` |
| `profiles/kinds/vport/controller/services/getVportServices.controller.js` | Service catalog (viewer only) | 60s | `${actorId}:${vportType}` | `invalidateVportServices(actorId)` |
| `profiles/kinds/vport/controller/portfolio/VportPortfolio.controller.js` | Portfolio items (1st page) | 60s | actorId | `invalidatePortfolioCache(actorId)` |
| `booking/controller/getResourceAvailability.controller.js` | Availability grid | 5min | `${resourceId}:${start}:${end}` | `invalidateBookingAvailability()` |
| `legal/controllers/legalConsent.controller.js` | Active legal documents | 5min | `__vcsm_active_docs` | `invalidateLegalDocsCache()` |

### 1.4 Zustand Actor Cache

| File | What's Cached | TTL | Invalidation |
|------|---------------|-----|--------------|
| `engines/hydration/src/store.js` | Actor summaries (displayName, username, photoUrl, vportName, etc.) | 5min (staleness check) | `upsertActors()` overwrites, `isStale()`/`getMissingOrStale()` for freshness |

### 1.5 Hook-Level Caches (Module-Scoped Maps)

| File | What's Cached | TTL | Invalidation |
|------|---------------|-----|--------------|
| `notifications/inbox/hooks/useNotiCount.js` | Bell badge unread count | 15s | Realtime + poll 60s + `noti:refresh` event |
| `notifications/inbox/hooks/useUnreadBadge.js` | Chat badge unread count | 10s | Realtime + poll 20s + `noti:refresh` event |
| `explore/hooks/useSearchScreenController.js` | Search results by filter+query | 45s (max 120 entries) | Auto-expire + LRU eviction |

### 1.6 Service Worker Caches (Production)

| Bucket | Strategy | Max Entries | Max Age | Content |
|--------|----------|-------------|---------|---------|
| `vcsm-static-v1` | CacheFirst | 300 | 30 days | JS, CSS, workers |
| `vcsm-fonts-v1` | CacheFirst | 80 | 365 days | Fonts |
| `vcsm-images-v1` | CacheFirst | 500 | 60 days | Images (origin + Supabase storage) |
| `vcsm-data-v1` | StaleWhileRevalidate | 200 | 24 hours | Generic GET requests |
| `vcsm-pages-v1` | NetworkFirst (3s timeout) | 50 | 7 days | HTML documents |

### 1.7 Browser Storage (localStorage)

| File | Key | What | Scope |
|------|-----|------|-------|
| `state/identity/identityStorage.js` | `vc.identity.actorId.${userId}` | Current actor ID | Per-user |
| `features/wanders/lib/wandersClientKey.js` | `wanders_client_key` | Device UUID | Device |
| `features/chat/inbox/hooks/useVexSettings.js` | `vc.vex_settings:${actorId}` | Chat inbox prefs | Per-actor |
| `features/chat/inbox/hooks/useMessagePrivacySettings.js` | `vc.message_privacy_settings` | Privacy prefs | Global |
| `features/professional/core/storage/professionalAccess.storage.js` | `vc:professional-access:*` | Profession + workspace | Per-profession |
| `features/ads/dal/ad.storage.dal.js` | `vc.ads.pipeline.v1` | Ad drafts | Global |
| `features/explore/hooks/useSearchScreenController.js` | `search:lastFilter` | Last search filter | Global |
| `shared/hooks/useUserLocation.js` | `vc:lastLocationText` | Geolocation text (sessionStorage) | Session |

### 1.8 Debugger Session Caches (Dev Only)

| File | Key | TTL |
|------|-----|-----|
| `debuggers/identity/store.js` | `vcsm.debug.identity.events` | Session |
| `debuggers/feed/store.js` | `vcsm.debug.feed.events` | Session |
| `debuggers/global/store.js` | `vcsm.debug.global` | Session |
| `debuggers/actor-switch/store.js` | `vcsm.debug.actor-switch` | Session |
| `debuggers/performance/store.js` | `vcsm.debug.perf.events` | Session |

### 1.9 Not Present

| Technology | Status |
|-----------|--------|
| React Query / TanStack Query | NOT USED (package exists but unused) |
| SWR | NOT PRESENT |
| Redis | NOT PRESENT |
| Edge caching | NOT PRESENT |
| HTTP cache-control headers | NOT SET (service worker handles strategy) |
| ISR / route caching | NOT APPLICABLE (Vite SPA, not Next.js) |
| IndexedDB caching | NOT PRESENT |

---

## Section 2 — Cache Architecture Map

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER LAYER                             │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Service Worker (Workbox)                             │    │
│  │ 5 buckets: static, fonts, images, data, pages       │    │
│  │ CacheFirst / StaleWhileRevalidate / NetworkFirst    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ localStorage / sessionStorage                        │    │
│  │ Identity, chat prefs, search filter, debug stores    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Browser Image Cache                                  │    │
│  │ Feed media preload (first 3 posts via new Image())   │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                  APPLICATION LAYER                            │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Zustand Actor Store (5min staleness)                 │    │
│  │ Global actor summaries, shared across all features   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Hook-Level Maps (10-45s TTL)                         │    │
│  │ Badge counts, search results (module-scoped)         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Controller-Level TTL Caches (60s-5min)               │    │
│  │ Public details, menus, services, portfolio, booking  │    │
│  │ Owner mode bypasses cache (always fresh for editing) │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ DAL-Level TTL Caches (30s-10min)                     │    │
│  │ Actor kind, vport type, profile, rates, fuel, tags   │    │
│  │ Read-through: check cache → miss → query → set cache │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                  DATABASE LAYER                               │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Supabase PostgREST (no app-side query caching)       │    │
│  │ Auth session persisted via localStorage sb-auth-main  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Cache layers top to bottom:** Service Worker → Browser Storage → Actor Store → Hook Maps → Controller TTL → DAL TTL → Database (uncached)

---

## Section 3 — Feed Caching Analysis

### What IS cached in the feed path

| Component | Cached? | TTL | Details |
|-----------|---------|-----|---------|
| Actor summaries | YES | 5min | Zustand actor store, populated by pipeline upsert |
| **Actors bundle** | **YES** | **30s** | **Per-actor TTL cache in readActorsBundle — cross-page dedup (ADDED 2026-04-12)** |
| **Block rows** | **YES** | **60s** | **Per-viewer TTL cache in readFeedBlockRowsDAL (ADDED 2026-04-12)** |
| **Follow rows** | **YES** | **60s** | **Per-viewer TTL cache in readFeedFollowRowsDAL (ADDED 2026-04-12)** |
| **Post media metadata** | **YES** | **60s** | **Per-post TTL cache in readPostMediaMap (ADDED 2026-04-12)** |
| Media images | PARTIAL | — | Browser image cache via `new Image()` preload (first 3 posts only) |
| Service worker | YES | 60d | `vcsm-images-v1` bucket (CacheFirst) |

### What is NOT cached in the feed path (by design)

| Component | Cached? | Reason |
|-----------|---------|--------|
| Feed posts query | NO | Cursor-driven pagination — must be fresh |
| Hidden posts | NO | Moderation state — must be fresh |
| Mention rows | NO | Conditional, low frequency |

### Feed cache impact after optimization (2026-04-12)

**Before:** 7 DAL calls × ~10 tables × up to 3 pages = **~30 uncached reads per feed load**
**After:** ~12-15 reads on first page, ~5-8 on subsequent pages (**50-75% reduction**)

Actor store upsert still populates the Zustand store for cross-feature reuse (chat, profiles).

### Duplicate read in feed path — FIXED

`hydrateActorsByIds()` in useFeed now calls `getMissingOrStale()` first. If actors were just upserted by the pipeline (fresh `_hydratedAt`), hydration is **skipped entirely**. Only stale or missing actors trigger background hydration.

---

## Section 4 — Cache Consistency Problems

### 4.1 No Cross-Feature Cache Invalidation

Updating a profile does NOT automatically invalidate:
- Vport public details cache
- Vport services cache
- Vport menu cache
- Portfolio cache
- Subscriber count cache

Each cache has its own `invalidate*()` function, but there is no orchestrated invalidation. A profile edit in settings calls `invalidateActorProfileCache()` but not `invalidateVportPublicDetails()` or `invalidateVportServices()`.

### 4.2 Rates Cache Invalidates All

`invalidateRatesCache()` clears ALL rate entries (every actor), not just the edited actor. This is overly aggressive — editing one vport's rates clears the cache for all vports.

### 4.3 Feed Has No Cache, Profiles Have Aggressive Cache

The feed path (highest traffic) has zero caching. Profile pages (lower traffic) have 15+ TTL caches. This is inverted from a performance priority perspective.

### 4.4 Actor Data Fetched Three Ways

The same actor data (displayName, username, photoUrl) is fetched via:
1. `readActorsBundle()` in feed pipeline (fresh query)
2. `hydrateActorsByIds()` via hydration engine (fresh query)
3. `readActorProfile()` in profile pages (30s TTL cache)

Three independent fetch paths for the same data, with different caching strategies (none, store, TTL).

### 4.5 Notification Badge Caches Don't Coordinate

`useNotiCount` (15s TTL) and `useUnreadBadge` (10s TTL) have different TTLs and different polling intervals (60s vs 20s). Both listen to `noti:refresh` but have separate invalidation. Not a bug, but adds complexity.

### 4.6 Search Cache Has No Invalidation on Data Change

Search results are cached for 45s. If a user creates a new post or a new vport during that window, the search cache will return stale results. No event-driven invalidation exists.

---

## Section 5 — Performance Opportunities

### 5.1 Feed Pipeline — Add Actor Bundle Caching (HIGH)

`readActorsBundle()` fetches the same actors on every pagination page. If the same 5 actors appear across 3 pages, their profiles are read 3 times. Add a short TTL cache (15-30s) keyed by `actorId` set hash, or cross-page deduplication.

### 5.2 Feed Pipeline — Eliminate Duplicate Hydration (HIGH)

`hydrateActorsByIds()` at useFeed.js:210 re-fetches actors already loaded by `readActorsBundle()`. Skip hydration if actors are already in the store with fresh `_hydratedAt` timestamps.

### 5.3 Feed Pipeline — Cache Block/Follow State Per Session (MEDIUM)

`readFeedBlockRowsDAL()` and `readFeedFollowRowsDAL()` fire on every page. Block and follow state rarely changes within a session. A 60s TTL cache for `${viewerActorId}:blocks` and `${viewerActorId}:follows` would eliminate repeated reads.

### 5.4 Profile Reads — Share Cache With Feed (MEDIUM)

Feed's `readActorsBundle()` already fetches profile data that `readActorProfile()` would later cache at 30s TTL. If the feed pipeline populated the profile cache, subsequent profile page visits would hit cache instead of re-querying.

### 5.5 Media Metadata — Add TTL Cache (LOW)

`readPostMediaMap()` fetches media metadata from `vc.post_media` on every feed page. Post media rarely changes. A 60s TTL cache keyed by post IDs would reduce reads.

### 5.6 Legal Documents — Already Good (NO ACTION)

Legal documents cache at 5min TTL. Documents change extremely rarely. Current strategy is appropriate.

---

## Section 6 — Risk Assessment

### 6.1 Stale Profile Data (LOW RISK)

Profile cache is 30s. A user editing their profile may see stale data for up to 30s on other pages. Mitigated by owner-mode bypass (settings always fresh) and manual invalidation on save.

### 6.2 Stale Vport Data After Edit (MEDIUM RISK)

After editing vport services, menu, or details in the dashboard (which bypasses cache), other users viewing the profile may see stale data for up to 60s. No real-time invalidation for viewers.

### 6.3 Badge Count Drift (LOW RISK)

Notification badge uses 15s TTL + realtime. In worst case, badge is stale by 15s. Realtime subscription provides near-instant updates for new notifications. Acceptable.

### 6.4 Memory Growth (LOW RISK)

All TTL caches are Map-based with no entry limit (except search cache at 120 entries). For a normal session with ~50 unique actors and ~20 vports, memory usage is trivial. Long sessions with heavy browsing could accumulate entries, but TTL expiration prevents unbounded growth.

### 6.5 Cache Poisoning (NO RISK)

All caches are client-side, in-memory, scoped to the authenticated session. No shared cache between users. Service worker only caches static assets and validated responses (status 0 or 200).

### 6.6 Race Conditions on Actor Switch (LOW RISK)

Switching actors clears identity storage and triggers re-fetch. TTL caches may briefly return data for the previous actor if not explicitly invalidated. `invalidateActorProfileCache()` is called on switch, but not all caches are cleared.

---

## Section 7 — Recommended Improvements

### Priority 1 — Feed Performance (HIGH IMPACT)

1. **Eliminate duplicate actor hydration** — Check `isStale()` before calling `hydrateActorsByIds()` in useFeed. If actors were just fetched by `readActorsBundle()`, skip the background hydration.

2. **Cache actor bundles across pages** — Add a 30s TTL cache in `readActorsBundle()` keyed by actor ID. On pagination page 2, actors already fetched on page 1 hit cache instead of re-querying 4 tables.

3. **Cache block/follow state per session** — Add 60s TTL caches for `readFeedBlockRowsDAL()` and `readFeedFollowRowsDAL()`, keyed by `viewerActorId`. These change rarely within a session.

### Priority 2 — Cache Coordination (MEDIUM IMPACT)

4. **Cross-feature invalidation bus** — Create a lightweight event-based invalidation system. When `invalidateActorProfileCache(actorId)` fires, also invalidate related caches (public details, services, menu). Use a simple `window.dispatchEvent(new CustomEvent('cache:invalidate', { detail: { actorId } }))` pattern.

5. **Fix rates cache invalidation** — Change `invalidateRatesCache()` to accept `actorId` parameter instead of clearing all entries.

### Priority 3 — Feed-to-Profile Cache Bridge (MEDIUM IMPACT)

6. **Populate profile cache from feed pipeline** — After `readActorsBundle()` returns, write results into `readActorProfile()`'s TTL cache. Profile page visits for feed actors would then hit cache.

### Priority 4 — Monitoring (LOW IMPACT)

7. **Add cache hit/miss counters** — Extend `createTTLCache()` with optional hit/miss counting. Feed the counters into the performance debugger overlay for visibility into cache effectiveness.

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total cache mechanisms | 8 types |
| TTL cache instances (DAL + controller) | **22** (was 18, +4 feed DAL caches added 2026-04-12) |
| Zustand stores acting as cache | 1 (actor hydration) |
| Service worker buckets | 5 |
| localStorage keys | 9+ |
| sessionStorage keys | 6+ (debuggers) |
| Hook-level module caches | 3 |
| Feed pipeline DAL caches | **4** (actorsBundle 30s, blockRows 60s, followRows 60s, postMedia 60s) |
| React Query / SWR / Redis | 0 (not used) |
