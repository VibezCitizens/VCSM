# BOTTOM NAVIGATION RUNTIME MAP

**Generated:** 2026-05-11
**Scope:** apps/VCSM — `shared/components/BottomNavBar.jsx` and all button routes
**Method:** Static code trace (STATICALLY TRACED unless marked INFERRED)
**ARCHITECT Note:** No application code was modified. All uncertainty is marked.

---

## PHASE 1 — EXISTING DOCS READ

| Document | Found | Relevant Content |
|---|---|---|
| `route-tree.md` | YES | Full VCSM route tree including /feed, /explore, /chat, /notifications, /profile, /settings |
| `event-flow-map.md` | YES | Feed load, send message, booking, notification flows already partially mapped |
| `state-store-map.md` | YES | actorStore, identitySelection, chatUiStore, bootstrap.store, followRequestsStore |
| `feature-map.md` | YES | Feature inventory with layer lists |
| `vcsm-module-architecture-summary.md` | YES | All 34 module status reports |
| `modules/vcsm.feed.architecture.md` | YES | Feed module: dual controller folder flag, pipeline |
| `modules/vcsm.chat.architecture.md` | YES | Chat module: inbox structure, block DAL duplication |
| `modules/vcsm.notifications.architecture.md` | YES | Notifications: duplicate screen, hook in screen/ |
| `modules/vcsm.profiles.architecture.md` | YES | Profiles: adapter naming violations |
| `modules/vcsm.explore.architecture.md` | YES | Explore: usecases/ violation, no adapter |
| `modules/vcsm.settings.architecture.md` | YES | Settings: model in UI folder, queries/ folder |
| `modules/vcsm.upload.architecture.md` | YES | Upload: dual controller folder, legacy screen |
| `database-read-map.md` | YES | General database read patterns |

**Missing from existing docs:** No bottom-navigation-specific runtime map existed before this run.

---

## PHASE 2 — BOTTOM NAVIGATION INVENTORY

**Component:** `apps/VCSM/src/shared/components/BottomNavBar.jsx`
**Mounted by:** `apps/VCSM/src/app/layout/RootLayout.jsx`
**Mount behavior:** ALWAYS MOUNTED — CSS `display:none` when hidden (never unmounted)
**Hidden on:** Chat sub-screens, auth routes, learning routes, dev/performance routes

| # | Button | Label (i18n key) | Route / Action | Component | Feature Owner | Badge | Navigation Method |
|---|---|---|---|---|---|---|---|
| 1 | Home | `nav.home` | `/feed` | `<Tab to="/feed" end />` | feed | None | NavLink |
| 2 | Explore | `nav.explore` | `/explore` | `<Tab to="/explore" />` | explore | None | NavLink |
| 3 | Vox (Chat) | `nav.vox` / `nav.voxWithCount` | `/chat` | `<Tab to="/chat" />` | chat | chatUnread (30s poll) | NavLink |
| 4 | Create (Upload) | `nav.newUpload` | `/upload` | `<button onClick={navigate('/upload')} />` | upload | None | programmatic navigate |
| 5 | Notifications | `nav.notifications` / `nav.notificationsWithCount` | `/notifications` | `<Tab to="/notifications" />` | notifications | notiCount (60s poll) | NavLink |
| 6 | Profile (Citizen) | `nav.citizen` | `/profile/{slug}` or `/profile/self` | `<ProfileNavTab />` | profiles + identity | None | programmatic navigate (cached slug) |
| 7 | Settings | `nav.settings` | `/settings` | `<Tab to="/settings" />` | settings | None | NavLink |

**Special behavior: Create button** — styled as gradient pill (not tab) — `navigate()` not NavLink — no active state

---

## PHASE 3 — TAP EVENT FLOWS

### 3.1 Home (/feed)

```
Tap Home (NavLink to="/feed")
  → React Router history.push('/feed')
  → RootLayout: Outlet renders CentralFeedScreen
  → CentralFeedScreen mounts
  → useAuth() gate → useIdentity() → actorId + realmId
  → useCentralFeed(actorId, realmId) → React Query → fetchCentralFeedPage
  → fetchFeedPagePipeline: 1 serial + 9 parallel Supabase reads
  → normalizeFeedRows → post array
  → posts.map → PostCard (post.adapter)
  → useFeedInfiniteScroll → IntersectionObserver for pagination
```

### 3.2 Explore (/explore)

```
Tap Explore (NavLink to="/explore")
  → React Router history.push('/explore')
  → ExploreScreen mounts → SearchScreen.view (Suspense)
  → useSearchScreenController initializes (query='', results=[])
  → localStorage → restores last selected filter
  → User types → 300ms debounce → ctrlSearchResults
    → identity.rpc('search_actor_directory') + vc.posts search [parallel]
  → Results rendered in ResultList
  → Empty state: OnboardingCardsView + ExploreFeed
```

### 3.3 Vox / Chat (/chat)

```
Tap Vox (NavLink to="/chat")
  → React Router history.push('/chat')
  → InboxScreen mounts
  → useChatInbox(actorId) → React Query → @chat engine → getInboxEntries
  → InboxList renders CardInbox per conversation
  → Badge: useChatUnread 30s poll always running
```

### 3.4 Create Upload (/upload)

```
Tap + (button onClick)
  → navigate('/upload')
  → UploadScreenModern mounts
  → useMediaSelection() → empty file array
  → User picks files → compressIfNeeded (FFmpeg WASM)
  → User submits → @media engine → Cloudflare R2 upload
  → createPost.controller → vc.posts INSERT
  → insertPostMedia → vc.post_media INSERT
  → insertPostMentions → vc.post_mentions INSERT
  → recordPostMedia → platform.media_assets INSERT
  → Feed cache invalidated → navigate('/feed')
```

### 3.5 Notifications (/notifications)

```
Tap Bell (NavLink to="/notifications")
  → BottomNavBar useEffect: window.dispatchEvent('noti:refresh')
    → React Query invalidates notificationUnread + chatUnread keys
  → React Router history.push('/notifications')
  → NotificationsScreen mounts → NotificationsScreenView
  → useNotificationInbox() → React Query → getNotifications()
  → @notifications engine → DB reads
  → On success: autoMarkSeen (DB) → badge invalidated immediately
  → NotificationsView renders notification cards
  → isCitizen + ?view=appointments → MyAppointmentsView
```

### 3.6 Profile (/profile)

```
Tap Citizen (ProfileNavTab)
  → getCachedActorCanonicalSlug(actorId) synchronous cache check
  
  FAST PATH (cache hit):
    → navigate('/profile/{cachedSlug}')
    → ActorProfileScreen: routeParam === canonicalSlug → renders
    → PROFILE_KIND_REGISTRY[kind] → kind-specific screen

  FALLBACK (cache miss):
    → navigate('/profile/self')
    → ActorProfileScreen: isSelf=true
    → useActorCanonicalSlug(actorId) → buildActorCanonicalSlugController
      → readActorSeoViewDAL → vport.public_actor_seo_v
      → ActorSeoModel → canonicalSlug
      → controllerCache.set (10min TTL)
    → useActorSlugRedirect: navigate('/profile/{slug}', { replace: true })
    → PROFILE_KIND_REGISTRY[kind] → kind-specific screen
```

### 3.7 Settings (/settings)

```
Tap Settings (NavLink to="/settings")
  → React Router history.push('/settings')
  → SettingsScreen mounts
  → Tab views lazy-loaded (Suspense): profile, account, privacy, vports
  → Each tab: hooks → controllers → DAL reads for settings data
```

---

## PHASE 4 — HOME CENTRAL FEED DEEP MAP

See full report: `architect/home-central-feed-runtime-map.md`

**Summary:**
- 1 serial read (vc.posts) + 9 parallel reads per page
- Tables: vc.posts, vc.post_media, vc.post_mentions, moderation.actions, vc.actors, profiles, vc.actor_privacy_settings, vport.profiles, moderation.blocks, vc.actor_follows, vc.post_comments, vc.post_reactions, post_rose_gifts
- React Query: staleTime 30s, gcTime 10min — cache hit on back-navigation
- actorStore upserted per page; background hydration via @hydration
- Image preload: first 3 posts (2.5s timeout)

---

## PHASE 6 — CROSS-BUTTON SHARED DEPENDENCY MAP

| Shared Dependency | Used By Buttons | File(s) | Risk |
|---|---|---|---|
| `useIdentity()` | ALL (auth gate) | `identity/adapters/identity.adapter` | CRITICAL — all features depend on this |
| `useBootstrapHydration(actorId)` | ALL (BottomNavBar level) | `bootstrap/bootstrap.hydrate.controller.js` | Activates all badge polling |
| `useNotificationUnread()` | BottomNavBar + Notifications | `bootstrap/bootstrap.selectors.js` | 60s React Query poll |
| `useChatUnread()` | BottomNavBar + Chat | `bootstrap/bootstrap.selectors.js` | 30s React Query poll |
| `useOneSignalPush()` | ALL (BottomNavBar level) | `hooks/useOneSignalPush.js` | OneSignal init — once per identity |
| `actorStore` (Zustand) | Home, Chat, Notifications, Profile | `state/actors/actorStore.js` | Central actor cache — 5min TTL |
| `identitySelection.store` | ALL | `state/identity/identitySelection.store.js` | Active actorId source of truth |
| `bootstrap.store` | BottomNavBar, Notifications, Chat | `bootstrap/bootstrap.store.js` | hydratedForActorId gates badge queries |
| `queryClient` (React Query) | Home, Chat, Notifications, Profile | `queries/queryClient.js` | Shared cache across all features |
| `getCachedActorCanonicalSlug` | Profile tab only | `profiles/controller/buildActorCanonicalSlug.controller.js` | 10min TTL — slug cache for fast nav |
| `VportLeadsChip` | ALL (when BottomNavBar visible) | `dashboard/vport/components/VportLeadsChip.jsx` | Mounted alongside BottomNavBar always |
| `noti:refresh` window event | Notifications, Chat | BottomNavBar useEffect | Invalidation trigger on route enter |

---

## PHASE 7 — DATABASE READ MAP PER BUTTON

| Button | DAL Method | Table / View / RPC | Read Type | Duplicate/N+1 Risk |
|---|---|---|---|---|
| Home | `readFeedPostsPage` | `vc.posts` | Cursor paginated SELECT | — |
| Home | `readPostMediaMap` | `vc.post_media` | Batch by postIds | — |
| Home | `readHiddenPostsForViewer` | `moderation.actions` | Viewer + postIds | — |
| Home | `readActorsBundle` | `vc.actors` → `profiles` → `vc.actor_privacy_settings` → `vport.profiles` | Batch + 3 sub-queries | DUPLICATE: actors bundle re-fetched if 30s cache expired |
| Home | `readFeedBlockRowsDAL` | `moderation.blocks` | Viewer + actorIds | DUPLICATE: block reads also in chat, notifications, settings |
| Home | `readFeedFollowRowsDAL` | `vc.actor_follows` | Viewer + actorIds | — |
| Home | `fetchPostMentionRows` | `vc.post_mentions` + `identity.actor_directory` | Batch by postIds | Conditional — skipped if no @ |
| Home | `readCommentCountsBatch` | `vc.post_comments` | Batch by postIds | — |
| Home | `readViewerReactionsBatch` | `vc.post_reactions` | Viewer + postIds | DUPLICATE: reactions table read twice per page |
| Home | `readReactionCountsBatch` | `vc.post_reactions` + `post_rose_gifts` | Batch by postIds | DUPLICATE: reactions table read twice per page |
| Explore | `searchActors` | `identity.search_actor_directory` (RPC) | Full-text RPC | — |
| Explore | `searchPosts` (text) | `vc.posts` (ilike text) | Full-text LIKE | N+1: double query (text + tag) per search |
| Explore | `searchPosts` (tag) | `vc.posts` (contains tags) | Array contains | N+1: double query (text + tag) per search |
| Chat | `inboxUnread.read.dal.js` | `chat` schema (unread count) | Aggregate | — |
| Chat | `getInboxEntries` (engine) | `chat.inbox_entries` + `chat.conversations` | Batch | INFERRED |
| Notifications | `getNotifications` (engine) | `notifications.*` schema | Batch | INFERRED |
| Profile | `readActorSeoViewDAL` | `vport.public_actor_seo_v` | Single row | Cache miss only (10min TTL) |
| Profile | INFERRED: `useResolveActorBySlug` | `identity.actor_directory` | Single row | On non-self slug only |
| Profile | INFERRED: `useActorKind` | `vc.actors` | Single row | Only when kind unknown |
| Settings | INFERRED: profile/privacy/account DALs | `vc.actors`, `profiles`, `vport.profiles`, privacy settings | Various | INFERRED |
| Badge (always) | `getUnreadNotificationCount` | `notifications` schema | Aggregate | 60s poll — always running |
| Badge (always) | `getUnreadBadgeCount` | `chat` schema | Aggregate | 30s poll — always running |

---

## PHASE 8 — DEAD CODE / SPAGHETTI SIGNALS

| Signal | Location | Evidence | Risk | Recommended Handoff |
|---|---|---|---|---|
| Legacy `UploadScreen.jsx` alongside `UploadScreenModern.jsx` | `upload/screens/` | Two Upload screens, unclear canonical | HIGH | IRONMAN |
| `videos` and `groups` filter tabs return `[]` | `explore/dal/search.dal.js` | `case 'videos': return [Promise.resolve([])]` | MEDIUM — dead filter tabs in UI | IRONMAN |
| Dual `controller/` + `controllers/` folders in feed + upload | `feed/` and `upload/` | Architecture contract requires one `controllers/` folder | HIGH | SENTRY |
| Block DAL duplicated in 3 features | `chat/inbox/dal/`, `notifications/inbox/dal/`, `settings/privacy/dal/` | Each has own blocks.read.dal — should use `block.adapter` | HIGH | SENTRY |
| DUPLICATE `NotiViewPostScreen` | `notifications/screen/NotiViewPostScreen.jsx` + `screen/views/NotiViewPostScreen.jsx` | Two files same name, different paths | HIGH | IRONMAN |
| `useMyAppointments` hook in `screen/hooks/` | `notifications/screen/hooks/useMyAppointments.js` | Hook inside screen folder | HIGH | SENTRY |
| `MyAppointmentsView` in notifications screen | `notifications/screen/views/MyAppointmentsView.jsx` | Appointment view owned by wrong feature | MEDIUM | IRONMAN |
| `ProfileNavTab.isActive` uses `/profile` prefix | `BottomNavBar.jsx:100` | Profile at `/u/:username` or `/v/:slug` will NOT activate tab | MEDIUM | IRONMAN |
| `useIdentity` from `identityContext` in notifications | `NotificationsScreenView.jsx:4` | `import { useIdentity } from "@/state/identity/identityContext"` — bypasses adapter | MEDIUM | SENTRY |
| `explore/usecases/` layer (architecture violation) | `explore/usecases/search.usecase.js` | `usecases/` is not a defined architecture layer | HIGH | SENTRY |
| `queries/` folder in feed | `feed/queries/fetchCentralFeedPage.js` | Non-standard layer — exists because it's a React Query queryFn | LOW — acceptable pattern for RQ |
| Profile tab navigates to `/profile/` not `/u/` or `/v/` | `BottomNavBar.jsx:113-114` | Route tree shows `/u/:username` and `/v/:slug` as canonical but bottom nav uses `/profile/` | MEDIUM — routing ambiguity | NEEDS LOKI |

---

## PHASE 9 — OUTPUT FILES

| File | Status |
|---|---|
| `architect/bottom-navigation-runtime-map.md` | THIS FILE |
| `architect/home-central-feed-runtime-map.md` | CREATED |
| `architect/bottom-navigation/vcsm.bottom-nav.explore.architecture.md` | CREATED |
| `architect/bottom-navigation/vcsm.bottom-nav.vox-chat.architecture.md` | CREATED |
| `architect/bottom-navigation/vcsm.bottom-nav.upload.architecture.md` | CREATED |
| `architect/bottom-navigation/vcsm.bottom-nav.notifications.architecture.md` | CREATED |
| `architect/bottom-navigation/vcsm.bottom-nav.profile.architecture.md` | CREATED |
| `architect/bottom-navigation/vcsm.bottom-nav.settings.architecture.md` | CREATED |

Home button has no separate file — see `home-central-feed-runtime-map.md` for the deep report.

---

## PHASE 10 — FINAL SUMMARY

### Existing Docs Read
- route-tree.md, event-flow-map.md, state-store-map.md, feature-map.md, vcsm-module-architecture-summary.md, and relevant module reports — all read in Phase 1.

### Bottom Nav Buttons Discovered
**7 buttons:** Home, Explore, Vox (Chat), Create (+), Notifications, Profile (Citizen), Settings

**Special cases:**
- Create button is a `<button>` not a `<Tab>` — programmatic `navigate()`, gradient styling
- Profile button is `<ProfileNavTab>` not a `<Tab>` — uses cached slug for zero-DB fast navigation
- BottomNavBar is ALWAYS MOUNTED — badge polling never stops between routes

### Home / Central Feed Full Flow
- Entry: `CentralFeedScreen.jsx` via `useCentralFeed` → React Query `useInfiniteQuery`
- Pipeline: `fetchFeedPagePipeline` — 1 serial (vc.posts) + 9 parallel Supabase reads
- 13 tables touched per page across 4 schemas (vc, vport, moderation, identity)
- Actor data: `actorStore` upserted per page + background `@hydration` engine fill
- Caching: React Query 30s stale, 10min gc; actorBundle 30s TTL; canonical slug 10min TTL

### Reports Created
8 files: 1 main map, 1 home deep map, 6 per-button files

### Missing Architecture Pieces
1. Settings sub-views not traced (lazy-loaded, DAL chains unknown — NEEDS LOKI)
2. `PROFILE_KIND_REGISTRY` not read — full kind map unknown
3. Profile tab route family ambiguity: `/profile/` vs `/u/` vs `/v/` canonical paths
4. `@notifications` engine DAL chain not traced from app side — engine-internal

### Duplicate Read / N+1 Suspicions
| Risk | Evidence |
|---|---|
| `vc.post_reactions` read TWICE per feed page | `readViewerReactionsBatch` + `readReactionCountsBatch` both hit `vc.post_reactions` |
| Explore search: 2 parallel queries per text search | `searchPosts` fires `byText` + `byTag` always — even when no `#` prefix |
| Feed pipeline may run twice | `fetchCentralFeedPage` loops up to 2× if first DB page yields <3 visible posts |
| Block rows fetched per feed page | `readFeedBlockRowsDAL` on every page — same blocks, not cached across pages |

### Dead Code / Spaghetti Suspicions
| Risk | Confidence |
|---|---|
| Legacy `UploadScreen.jsx` | HIGH — likely dead, superseded by UploadScreenModern |
| `videos` + `groups` filter tabs | CONFIRMED — explicitly returns `[]` |
| Duplicate `NotiViewPostScreen` | CONFIRMED — two files, same name |
| `explore/usecases/search.usecase.js` | CONFIRMED — architecture layer violation |
| Block DAL duplicated in 3 features | CONFIRMED — chat/inbox, notifications/inbox, settings/privacy all own their own block reads |
| Profile tab `isActive` on `/profile` prefix | STATICALLY TRACED — `/u/:username` taps won't activate profile tab |

### Recommended Next Commands
- **LOKI** — Runtime verification needed for: settings sub-views DAL chain, profile route family (/profile vs /u /v), feed pipeline double-loop frequency in production
- **KRAVEN** — Performance: 10+ DB reads per feed page, double reaction reads, explore double-query, feed pipeline retry loop
- **VENOM** — Trust boundary: realm-scoped feed with null realmId, client-side block filter, void screen auth gap
- **SENTRY** — Architecture drift: block DAL in 3 features, dual controller folders in feed+upload, useIdentity bypassing adapter in notifications, explore usecases layer
- **IRONMAN** — Ownership: legacy UploadScreen, duplicate NotiViewPostScreen, MyAppointmentsView in wrong feature, profile tab isActive mismatch, dead filter tabs
- **CYBORG** — Analytics: bottom nav tap events — are they tracked? Conversion from tap → screen load → engagement?

---

*ARCHITECT report complete. No application code was modified.*

---

## PHASE 11 — SHIELD VISUALIZER GRAPH DATA (2026-05-11 UPDATE)

**Governance Status:** `REVIEW_PENDING`
**Visualizer:** `zNOTFORPRODUCTION/_ACTIVE/tools/shield-visualizer`
**Canonical Graph Data:** `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/graph-data/`

### Visualizer Graph Files Created

| Graph File | Type | Nodes | Confidence |
|---|---|---|---|
| `graph-data/bottom-navigation.graph.json` | Combined full map (all 7 buttons) | 36 | STATICALLY_TRACED |
| `graph-data/bottom-navigation/home-feed.graph.json` | Per-screen: Home / Feed | 24 | STATICALLY_TRACED |
| `graph-data/bottom-navigation/explore.graph.json` | Per-screen: Explore / Search | 13 | Mixed — DAL paths INFERRED |
| `graph-data/bottom-navigation/messages.graph.json` | Per-screen: Vox / Chat | 17 | Mixed — engine internals INFERRED |
| `graph-data/bottom-navigation/notifications.graph.json` | Per-screen: Notifications | 17 | Mixed — DAL paths INFERRED |
| `graph-data/bottom-navigation/profile.graph.json` | Per-screen: Citizen / Profile | 20 | Mixed — kind sub-screens INFERRED |
| `graph-data/bottom-navigation/upload.graph.json` | Per-screen: Upload / Create | 13 | NEEDS_LOKI_VERIFICATION |
| `graph-data/bottom-navigation/settings.graph.json` | Per-screen: Settings | 22 | NEEDS_LOKI_VERIFICATION |

All files mirrored to `tools/shield-visualizer/src/data/bottom-navigation/`.

### Visualizer Changes

**`src/data/graph.js`** — Added new node types: `nav`, `button`, `view`, `component`, `model`, `adapter`, `engine`, `store`, `cache`. Added edge types: `renders`, `writes`. Updated review config: `FALCON` (replaces `ROBIN`), `LOGAN` added.

**`src/components/ArchitectureGraph.jsx`** — Updated to accept `nodes` and `edges` as props for dynamic graph switching. Backward compatible with existing `graphType` prop.

**`src/lib/loadAllGraphs.js`** — New file. Loads all 8 bottom-nav graph JSON files, processes nodes/edges with ReactFlow styling, exports `BOTTOM_NAV_GRAPHS` array and `getGraphById(id)`.

**`src/App.jsx`** — Added BOTTOM NAV mode tab. Added 32px subheader bar with per-screen graph selector (appears only in BOTTOM NAV mode). Shows confidence badge next to graph title. Compact node/edge legends.

### SHIELD Visualizer Navigation

**Mode 1 — COMMANDS:** Command governance graph (unchanged)
**Mode 2 — BOTTOM NAV:** Sub-selector with 8 graphs:
- `◉ Full Bottom Nav Map` — all 7 columns side-by-side
- `· Home / Feed` — full 9-DAL chain
- `· Explore / Search` — search controller + cache
- `· Vox / Chat` — inbox hooks + engine boundary
- `· Notifications` — polling chain + layer violations
- `· Citizen / Profile` — slug resolution + kind registry
- `· Upload / Create` — atomicity risk chain
- `· Settings` — 4 lazy tab views

### Pending Reviews (from Graph Scan)

| Command | Reason | Status |
|---|---|---|
| **LOKI** | Upload chain (NEEDS_LOKI_VERIFICATION), settings tab chains, engine DAL paths, slug cache invalidation, notification double-mark-seen | PENDING |
| **KRAVEN** | `vc.post_reactions` ×2 per page, chat 30 concurrent prefetches, 9 parallel feed reads at scale, FFmpeg cold-start | PENDING |
| **VENOM** | Block DAL outside block.adapter, search RLS, upload ownership gate, account auth boundary, privacy mutation ownership | PENDING |
| **SENTRY** | Block DAL boundary violation in chat, `useMyAppointments` wrong layer, `NotiViewPostScreen` duplicate, model in UI folder, controller/ naming | PENDING |
| **FALCON** | ProfileNavTab `isActive` broken for `/u/:username`, iOS safe-area, FFmpeg WASM Safari | PENDING |
| **IRONMAN** | `useMyAppointments` ownership, upload feature boundaries | PENDING |
| **LOGAN** | Dead code: legacy UploadScreen, dead explore filters, NotiViewPostScreen duplicate, 6 dead hooks in settings/queries | PENDING |
