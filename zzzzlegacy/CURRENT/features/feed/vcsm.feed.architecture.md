# MODULE ARCHITECTURE REPORT

**Module:** feed
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Social Feed Engine
**Primary Root:** `apps/VCSM/src/features/feed/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Owns the central social feed: fetching posts, applying visibility filters (follow graph, block graph, privacy settings), pagination, mention resolution, and feed pipeline assembly. The central feed is the primary surface of the VCSM social experience.

---

## OWNERSHIP

Feed owns: central feed assembly, feed pagination, feed visibility rules (follow, block, private), mention map building, viewer context computation, and the welcome card UX. Post rendering is delegated to `post` feature. Actor hydration is delegated to `@hydration` engine.

---

## ENTRY POINTS

- `/` (home feed) → `CentralFeedScreen.jsx`
- Debug routes → `DebugPrivacyPanel.jsx`, `DebugFeedFilterPanel.jsx`

---

## LAYER MAP

**DAL:**
- `feed.posts.dal.js` — main post list query
- `feed.mentions.dal.js` — mentions data
- `feed.read.actorsBundle.dal.js` — actor batch read for feed
- `feed.read.blockRows.dal.js` — block graph rows
- `feed.read.commentCounts.dal.js` — comment count batch
- `feed.read.debugPrivacyRows.dal.js` — debug privacy state
- `feed.read.followRows.dal.js` — follow graph rows
- `feed.read.hiddenPosts.dal.js` — hidden post IDs
- `feed.read.media.dal.js` — media assets for posts
- `feed.read.posts.dal.js` — post data read
- `feed.read.reactionCounts.dal.js` — reaction count batch
- `feed.read.viewerContext.dal.js` — viewer-specific context
- `feed.read.viewerReactions.dal.js` — viewer reaction states
- `feedWelcomeCard.dal.js` — welcome card state
- `listActorPostsByActor.dal.js` — actor-specific post list
- `resolvePublicRealm.dal.js` — resolves public realm ID

**Model:**
- `buildMentionMaps.model.js` — builds actorId → mention map
- `feedBlockVisibility.model.js` — block-based visibility rules
- `feedFollowVisibility.model.js` — follow-based visibility rules
- `feedPrivateVisibility.model.js` — private profile visibility
- `feedRowVisibility.model.js` — combined row visibility decision
- `inferMediaType.model.js` — classifies media type
- `normalizeFeedRows.model.js` — normalizes raw rows to domain feed items

**Controller:**
- `listActorPosts.controller.js` — builds paginated post list
- `getFeedViewerContext.controller.js` — viewer context assembly
- `getDebugPrivacyRows.controller.js` — debug data
- `feedWelcomeCard.controller.js` — welcome card visibility (in `controller/` — singular folder)

**STRUCTURAL NOTE:** Two controller folders exist: `controller/` (singular, 1 file) and `controllers/` (plural, 3 files). This is a file naming contract violation.

**Hook:**
- `useCentralFeed.js` — main feed lifecycle
- `useCentralFeedActions.js` — feed action handlers
- `useDebugPrivacyRows.js` — debug hook
- `useFeed.js` — core feed hook
- `useFeed.utils.js` — utility helpers for feed hook (naming violation: not a hook)
- `useFeedConfirmToast.js` — toast feedback
- `useFeedInfiniteScroll.js` — infinite scroll pagination
- `useFeedWelcomeCard.js` — welcome card state

**Component:**
- `FeedSkeletonList.jsx` — loading skeleton
- `WelcomeFeedCard.jsx` — welcome card UI

**Screen:**
- `CentralFeedScreen.jsx` — main feed entry
- `DebugFeedFilterPanel.jsx` — dev debug tool
- `DebugPrivacyPanel.jsx` — dev debug tool
- `FeedConfirmModal.jsx` — confirm modal (naming: not a screen)

**Pipeline:**
- `fetchFeedPage.pipeline.js` — standalone pipeline function

**API:**
- `api/index.js` — wraps feed queries (purpose unclear vs pipeline)

**Store:** No Zustand store (uses TTL cache via adapter)

**Engine Consumers:**
- `@hydration` (actor data hydrated in feed rows)

**Adapter:**
- `feedCache.adapter.js` — TTL cache adapter
- `adapters/hooks/useFeed.adapter.js` — hook re-export
- `adapters/index.js`

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Clear feed ownership | — |
| Owner defined | PARTIAL | No IRONMAN record | — |
| Entry points mapped | PASS | CentralFeedScreen | — |
| Controllers present/delegated | PARTIAL | 4 controllers across 2 folders | Dual folder naming violation |
| DAL/repository present/delegated | PASS | 16 DAL files | — |
| Models/transformers present | PASS | 7 model files | — |
| Hooks/view models present | PASS | 8 hooks | — |
| Screens/components present | PASS | 4 screens, 2 components | — |
| Services/adapters present | PASS | adapter + cache adapter | — |
| Database objects mapped | PARTIAL | vc.posts, vc.post_media, vc.follows, vc.blocks | Realm table not documented |
| Authorization path mapped | PARTIAL | Visibility models filter rows | No auth gate at feed entry |
| Cache/runtime behavior mapped | PARTIAL | feedCache.adapter.js present | Cache invalidation path unclear |
| Error/loading/empty states mapped | PARTIAL | Skeleton present | Empty feed state unclear |
| Documentation linked | FAIL | No Logan doc | — |
| Tests/validation noted | FAIL | No tests | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PARTIAL | @hydration used | Hydration call chain not documented |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `@hydration` engine | engine | feed → hydration | YES | Actor data resolution |
| `post` feature | feature | feed renders post cards | YES | Must go via post.adapter |
| `vc.posts` | database | feed reads | YES | Core post table |
| `vc.follows` | database | feed reads | YES | Follow graph for visibility |
| `vc.blocks` | database | feed reads | YES | Block graph for filtering |
| `vc.post_media` | database | feed reads | YES | Media assets |
| `resolvePublicRealm.dal.js` | database | feed reads | YES | Realm resolution per void rules |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| Feed page (posts + context) | derived | feed | CentralFeedScreen | — |
| Viewer context | derived | feed | feed hooks | — |
| Block graph | cached | feed (reads from block DAL) | visibility models | Stale blocks = content leak |
| Follow graph | cached | feed | visibility models | — |
| Mention maps | derived | feed | post components | — |
| Public realm ID | cached | feed (resolvePublicRealm) | feed DAL | Must use system realm, not viewer realm |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | CentralFeedScreen routed | — |
| Loading state | PASS | FeedSkeletonList present | — |
| Empty state | PARTIAL | WelcomeFeedCard for new users | No empty state for active users with no posts |
| Error state | FAIL | Not confirmed | Feed errors silently empty |
| Auth/owner gates | PARTIAL | Identity consumed in hooks | No explicit feed auth gate |
| Cache behavior | PARTIAL | feedCache adapter exists | Invalidation after post create unclear |
| Runtime dependencies | PASS | Hydration engine active | — |
| Hot paths | HIGH | Every app open hits feed | Must be fast |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| Dual controller folders | `controller/` (1 file) AND `controllers/` (3 files) | HIGH — naming contract violation | SENTRY |
| `api/index.js` purpose unclear | Exists alongside `pipeline/` and `queries/` | MEDIUM — layering confusion | SENTRY |
| `queries/fetchCentralFeedPage.js` | Separate from pipeline — duplicate purpose? | MEDIUM | SENTRY |
| `lib/index.js` empty | Folder with only empty index | LOW | IRONMAN |
| `usecases/index.js` empty | Empty folder | LOW | IRONMAN |
| `useFeed.utils.js` named as hook | Contains utilities, not a hook — naming violation | MEDIUM | LOGAN |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | — | MISSING |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | @hydration | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Consolidate `controller/` and `controllers/` | HIGH | Contract violation — breaks discoverability | SENTRY |
| Clarify api/ vs pipeline/ vs queries/ | HIGH | Three overlapping patterns — unclear canonical path | SENTRY |
| Cache invalidation on post create | HIGH | Feed won't update after new post | KRAVEN |
| Error state for failed feed load | HIGH | Silent failure = blank screen | IRONMAN |
| Feed empty state for active users | MEDIUM | UX gap for users with no posts in range | IRONMAN |
| Logan documentation | HIGH | No canonical feed architecture documented | LOGAN |

---

## MODULE BOUNDARY WARNINGS

**MODULE BOUNDARY WARNING**
Location: `feed/controller/feedWelcomeCard.controller.js` (singular folder)
Module: feed
Current dependency: 1 controller in `controller/`, 3 in `controllers/`
Expected boundary: All controllers in single `controllers/` folder
Risk: HIGH — breaks contract file naming rule
Suggested correction: Move `controller/` file to `controllers/` folder, delete `controller/`

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- SENTRY (boundary: dual controller folders, api/pipeline/query overlap)
- KRAVEN (performance: feed cache invalidation, hot path audit)
- LOGAN (documentation)
- IRONMAN (ownership: empty state, error state)
- LOKI (runtime: feed load trace)
