# CentralFeed Deep Audit Report
Generated: 2026-06-08
Auditor: Blind review — current source only
Contracts read from: /Users/vcsm/Desktop/VCSM/ZZnotforproduction/CONTRACTS/

---

## A. Executive Summary

- Overall: FAIL
- Rename verification: PASS — no stale `features/feed` paths remain
- Modularization score: 6/10
- Contract compliance score: 5/10
- Highest-risk issue: `feedCache.adapter.js` re-exports three DAL cache-invalidation functions to external consumers, violating the adapter contract ("adapters must never export DAL") and spreading TTL cache coupling across features.

---

## B. Folder Map

```
features/CentralFeed/                            (depth 0)
  adapters/                                      (depth 1)
    feedCache.adapter.js       ~3 lines          [ADAPTER — DAL EXPORT VIOLATION]
    hooks/                                       (depth 2)
      useFeed.adapter.js       ~2 lines          [ADAPTER — missing stamp, no @adapter JSDoc]
  components/                                    (depth 1)
    FeedConfirmModal.jsx       ~69 lines         [COMPONENT — feed-scoped confirm modal]
    FeedSkeletonList.jsx       ~27 lines         [COMPONENT — loading skeleton]
    WelcomeFeedCard.jsx        ~141 lines        [COMPONENT — uses relative import violation]
    welcomeFeedCard.styles.js  ~190 lines        [COMPONENT — styles object]
  controllers/                                   (depth 1)
    feedWelcomeCard.controller.js   ~14 lines    [CONTROLLER — welcome card state]
    getDebugPrivacyRows.controller.js  ~85 lines [CONTROLLER — DEBUG/DIAGNOSTIC — in production folder]
    getFeedViewerContext.controller.js ~20 lines  [CONTROLLER — viewer adult flag]
    listActorPosts.controller.js   ~37 lines     [CONTROLLER — cross-domain (profile + feed SSOT)]
  dal/                                           (depth 1)
    feed.mentions.dal.js       ~21 lines         [DAL — post mention edges]
    feed.posts.dal.js          ~54 lines         [DAL — LEGACY / DEV-ONLY guard — production folder]
    feed.read.actorsBundle.dal.js  ~162 lines    [DAL — actor bundle hydration with TTL cache]
    feed.read.blockRows.dal.js     ~48 lines     [DAL — block rows with TTL cache]
    feed.read.commentCounts.dal.js ~36 lines     [DAL — comment counts batch]
    feed.read.debugPrivacyRows.dal.js  ~72 lines [DAL — DEBUG DAL — in production dal folder]
    feed.read.followRows.dal.js    ~45 lines     [DAL — follow rows with TTL cache]
    feed.read.hiddenPosts.dal.js   ~41 lines     [DAL — hidden posts for viewer]
    feed.read.media.dal.js         ~66 lines     [DAL — post media with TTL cache]
    feed.read.posts.dal.js         ~54 lines     [DAL — main feed posts page read]
    feed.read.reactionCounts.dal.js ~62 lines    [DAL — reaction counts batch]
    feed.read.viewerContext.dal.js  ~28 lines    [DAL — viewer identity resolution]
    feed.read.viewerReactions.dal.js ~34 lines   [DAL — viewer reactions batch]
    feedWelcomeCard.dal.js     ~43 lines         [DAL — welcome card onboarding step]
    listActorPostsByActor.dal.js   ~26 lines     [DAL — actor posts list]
  hooks/                                         (depth 1)
    useCentralFeed.js          ~292 lines        [HOOK — React Query feed — PRIMARY]
    useCentralFeedActions.js   ~280 lines        [HOOK — feed action orchestration]
    useDebugPrivacyRows.js     ~32 lines         [HOOK — DEBUG — in production hooks folder]
    useFeed.js                 ~278 lines        [HOOK — manual server-state — LEGACY, active]
    useFeed.utils.js           ~68 lines         [HOOK UTIL — timeout + media preload]
    useFeedConfirmToast.js     ~62 lines         [HOOK — confirm + toast UI state]
    useFeedInfiniteScroll.js   ~48 lines         [HOOK — IntersectionObserver infinite scroll]
    useFeedWelcomeCard.js      ~58 lines         [HOOK — welcome card state]
  model/                                         (depth 1)
    buildMentionMaps.model.js  ~72 lines         [MODEL — mention map builder]
    enrichMentionRows.model.js ~23 lines         [MODEL — mention row enrichment]
    feedBlockVisibility.model.js  ~32 lines      [MODEL — block visibility set]
    feedFollowVisibility.model.js ~23 lines      [MODEL — follow visibility set]
    feedPrivateVisibility.model.js ~11 lines     [MODEL — private visibility rule]
    feedRowVisibility.model.js ~116 lines        [MODEL — composite visibility resolver]
    inferMediaType.model.js    ~7 lines          [MODEL — media type inference]
    normalizeFeedRows.model.js ~104 lines        [MODEL — post normalization]
  pipeline/                                      (depth 1)
    fetchFeedPage.pipeline.js  ~171 lines        [PIPELINE — multi-DAL fan-out, 11 DAL collaborators]
  queries/                                       (depth 1)
    fetchCentralFeedPage.js    ~108 lines        [QUERY FN — React Query queryFn, while-loop drain]
  screens/                                       (depth 1)
    CentralFeedScreen.jsx      ~245 lines        [SCREEN — main feed screen]
    DebugFeedFilterPanel.jsx   ~58 lines         [SCREEN — DEBUG PANEL — in production screens/]
    DebugPrivacyPanel.jsx      ~71 lines         [SCREEN — DEBUG PANEL — in production screens/]
```

**Module Map:**

| Module | Files |
|---|---|
| Feed Page Fetch | `feed.read.posts.dal.js`, `fetchFeedPage.pipeline.js`, `fetchCentralFeedPage.js`, `useCentralFeed.js`, `useFeed.js` |
| Feed Normalization | `normalizeFeedRows.model.js`, `inferMediaType.model.js`, `feedRowVisibility.model.js`, `feedPrivateVisibility.model.js` |
| Actor Bundle Hydration | `feed.read.actorsBundle.dal.js`, `feed.read.viewerContext.dal.js` |
| Block/Follow Visibility | `feed.read.blockRows.dal.js`, `feed.read.followRows.dal.js`, `feedBlockVisibility.model.js`, `feedFollowVisibility.model.js` |
| Reactions | `feed.read.reactionCounts.dal.js`, `feed.read.viewerReactions.dal.js` |
| Comments | `feed.read.commentCounts.dal.js` |
| Mentions | `feed.mentions.dal.js`, `enrichMentionRows.model.js`, `buildMentionMaps.model.js` |
| Hidden Posts | `feed.read.hiddenPosts.dal.js` |
| Media | `feed.read.media.dal.js` |
| Cache Invalidation | `feedCache.adapter.js` |
| Feed Actions | `useCentralFeedActions.js` |
| Welcome Card | `feedWelcomeCard.dal.js`, `feedWelcomeCard.controller.js`, `useFeedWelcomeCard.js`, `WelcomeFeedCard.jsx`, `welcomeFeedCard.styles.js` |
| Feed Screen | `CentralFeedScreen.jsx`, `FeedSkeletonList.jsx`, `FeedConfirmModal.jsx`, `useFeedConfirmToast.js`, `useFeedInfiniteScroll.js` |
| Actor Posts (Cross-domain) | `listActorPostsByActor.dal.js`, `listActorPosts.controller.js` |
| Debug/Diagnostics (production folder) | `feed.posts.dal.js`, `feed.read.debugPrivacyRows.dal.js`, `getDebugPrivacyRows.controller.js`, `useDebugPrivacyRows.js`, `DebugFeedFilterPanel.jsx`, `DebugPrivacyPanel.jsx` |

**Total file count: 46**
**Status per FEATURE_SIZE_GOVERNANCE_CONTRACT: Healthy (0–50 files = None required)**

---

## C. Files That Do Not Belong

### C-1: Debug/Diagnostic Files in Production Folders

**File:** `apps/VCSM/src/features/CentralFeed/dal/feed.posts.dal.js`
- **Why it does not belong:** Self-described as "legacy — used by dev diagnostics only." Has `if (!import.meta.env.DEV) return []` early-return guard, making it a dev-only file living in a production DAL folder. It imports from `@hydration` and performs field normalization inside a DAL function (DAL contract violation — DAL must return raw rows; this file maps and derives display fields).
- **Contract violated:** `Architecture/03-layer-contracts.md` §2.1 (DAL must return raw rows, not mapped/derived data); `Architecture/11-naming-conventions.md` (file role is misleading — named as a DAL but functions as a legacy diagnostic helper)
- **Recommended destination:** `src/dev/diagnostics/helpers/feedLegacyDal.js` — gated to `import.meta.env.DEV`

**File:** `apps/VCSM/src/features/CentralFeed/dal/feed.read.debugPrivacyRows.dal.js`
- **Why it does not belong:** Named "debug" explicitly. Serves `getDebugPrivacyRows.controller.js` which is itself a debug-only controller. Lives in the production `dal/` folder.
- **Contract violated:** `Architecture/05-feature-boundaries.md` §5.1 (dev/diagnostic logic does not belong in production feature folders)
- **Recommended destination:** `src/dev/diagnostics/helpers/feedDebugPrivacy.dal.js`

**File:** `apps/VCSM/src/features/CentralFeed/controllers/getDebugPrivacyRows.controller.js`
- **Why it does not belong:** Purely a debug diagnostic controller. Has no production caller. Used only by `useDebugPrivacyRows.js` which is also debug-only. Also passes `actorId` to `readOwnedActorIdsByUserIdDAL(actorId)` — the DAL function parameter is named `userId` which implies identity confusion (see Section F).
- **Contract violated:** `Architecture/05-feature-boundaries.md` §5.1; debug/production separation
- **Recommended destination:** `src/dev/diagnostics/helpers/feedDebugPrivacy.controller.js`

**File:** `apps/VCSM/src/features/CentralFeed/hooks/useDebugPrivacyRows.js`
- **Why it does not belong:** Debug-only hook. Uses `useState + useEffect` for server fetching. No production caller.
- **Contract violated:** `Architecture/05-feature-boundaries.md` §5.1; `ARCHITECTURE_GOVERNANCE_CONTRACT.md` (manual useState+useEffect server-fetch pattern)
- **Recommended destination:** `src/dev/diagnostics/hooks/useDebugPrivacyRows.js`

**File:** `apps/VCSM/src/features/CentralFeed/screens/DebugFeedFilterPanel.jsx`
- **Why it does not belong:** Dev-panel screen, rendered only behind `import.meta.env.DEV` flag. Not a production screen.
- **Contract violated:** `Architecture/05-feature-boundaries.md` §5.1
- **Recommended destination:** `src/dev/diagnostics/panels/DebugFeedFilterPanel.jsx`

**File:** `apps/VCSM/src/features/CentralFeed/screens/DebugPrivacyPanel.jsx`
- **Why it does not belong:** Dev-panel screen, same reasoning. Imports from `useDebugPrivacyRows.js` which calls the debug controller.
- **Contract violated:** `Architecture/05-feature-boundaries.md` §5.1
- **Recommended destination:** `src/dev/diagnostics/panels/DebugPrivacyPanel.jsx`

### C-2: Cross-Domain Controller

**File:** `apps/VCSM/src/features/CentralFeed/controllers/listActorPosts.controller.js`
- **Why it does not belong:** The file header explicitly states it is the SSOT for Profile Posts tab AND Photos tab, in addition to the central feed. This is a cross-domain controller owned by two features (CentralFeed and profiles). Its location inside CentralFeed makes profiles depend on CentralFeed internals.
- **Contract violated:** `Architecture/05-feature-boundaries.md` §5.1 (feature must contain own logic; shared logic belongs in `engines/` or `shared/`)
- **Recommended destination:** `engines/posts/controllers/listActorPosts.controller.js` or `src/features/post/controllers/listActorPosts.controller.js` with adapter re-export

---

## D. Stale Import Report

### D-1: Old Feed Path References

Result: **PASS** — zero stale `@/features/feed/`, `features/feed`, `../feed`, `../../feed` references found in `apps/VCSM/src/`.

### D-2: Stale File-Header Comments (Windows Paths)

Two model files contain stale Windows path comments referencing the old `features/feed` folder:

- `apps/VCSM/src/features/CentralFeed/model/normalizeFeedRows.model.js` line 1: `// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\feed\model\normalizeFeedRows.js`
- `apps/VCSM/src/features/CentralFeed/model/buildMentionMaps.model.js` line 1: `// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\feed\model\buildMentionMaps.js`

These are dead comments referencing the old feature path and a developer's local machine path. They should be removed.

### D-3: CentralFeed Internal Import Violations

**feedFeature.group.js** (`src/dev/diagnostics/groups/feedFeature.group.js`) imports the following CentralFeed **internal** files directly (bypassing any adapter):
- `@/features/CentralFeed/hooks/useFeed` (internal hook)
- `@/features/CentralFeed/pipeline/fetchFeedPage.pipeline` (internal pipeline)
- `@/features/CentralFeed/controllers/getFeedViewerContext.controller` (internal controller)
- `@/features/CentralFeed/controllers/listActorPosts.controller` (internal controller)
- `@/features/CentralFeed/dal/feed.posts.dal` (internal DAL)
- `@/features/CentralFeed/model/inferMediaType.model` (internal model)
- `@/features/CentralFeed/model/buildMentionMaps.model` (internal model)
- `@/features/CentralFeed/model/feedBlockVisibility.model` (internal model)
- `@/features/CentralFeed/model/feedFollowVisibility.model` (internal model)
- `@/features/CentralFeed/model/feedPrivateVisibility.model` (internal model)
- `@/features/CentralFeed/model/feedRowVisibility.model` (internal model)
- `@/features/CentralFeed/model/normalizeFeedRows.model` (internal model)
- `@/features/CentralFeed/screens/CentralFeedScreen` (bypassing adapter for screen)
- `@/features/CentralFeed/screens/DebugFeedFilterPanel` (bypassing adapter for screen)
- `@/features/CentralFeed/screens/DebugPrivacyPanel` (bypassing adapter for screen)

This is a diagnostic file at `src/dev/diagnostics/` — not a production feature. However, it violates the adapter boundary by importing internal CentralFeed symbols not exposed through any adapter. Contract severity: HIGH per `Architecture/05-feature-boundaries.md` §5.2.

**Note:** If dev/diagnostics files are intentionally exempt from the adapter contract (which would need explicit documentation), this is still an undocumented exception.

### D-4: External Consumer Violations (Importing Internals Instead of Through Adapters)

- `src/features/settings/privacy/controller/actorPrivacy.controller.js` — imports `invalidateActorBundleEntry` from `feedCache.adapter.js` ✓ (correct — through adapter)
- `src/features/post/postcard/screens/PostFeed.screen.jsx` — imports `useFeed` from `adapters/hooks/useFeed.adapter.js` ✓ (correct — through adapter)
- `src/features/social/*/controllers/*.js` — import `invalidateFeedFollowCache` from `feedCache.adapter.js` ✓ (correct — through adapter)
- `src/features/block/hooks/useBlockActorAction.js` — imports `invalidateFeedBlockCache` from `feedCache.adapter.js` ✓ (correct — through adapter)
- `src/app/routes/lazyApp.jsx` — imports `CentralFeedScreen` **directly** from `@/features/CentralFeed/screens/CentralFeedScreen` ⚠ (route-layer direct screen import — consistent with platform pattern but no primary adapter exists for this feature's screen surface)

---

## E. Adapter Report

### E-1: `adapters/feedCache.adapter.js`

- **Stamp status:** MISSING — no `@adapter` JSDoc present
- **Blast radius:** MISSING — not declared; actual blast radius is HIGH (5 external consumers: settings, social/follow x3, block)
- **Last reviewed:** MISSING
- **Public surface:** `invalidateFeedBlockCache`, `invalidateFeedFollowCache`, `invalidateActorBundleEntry`
- **Violations:**
  1. **Missing revision stamp** — HIGH per `ADAPTER_REVISION_STAMP_CONTRACT.md`
  2. **Exports DAL functions** — all three exports are re-exported directly from DAL files (`feed.read.blockRows.dal`, `feed.read.followRows.dal`, `feed.read.actorsBundle.dal`). The adapter contract states: "Adapters must never export: DAL, models, controllers." (`Architecture/07-adapter-contract.md` §5.3)
  3. **Exposes TTL cache invalidation functions as public API** — makes external features dependent on CentralFeed's internal caching strategy, coupling cache lifecycle to cross-feature call sites

### E-2: `adapters/hooks/useFeed.adapter.js`

- **Stamp status:** MISSING — no `@adapter` JSDoc present
- **Blast radius:** MISSING; actual blast radius is LOW (1 consumer: PostFeed.screen.jsx)
- **Last reviewed:** MISSING
- **Public surface:** Re-exports everything from `hooks/useFeed` via `export *`
- **Violations:**
  1. **Missing revision stamp** — HIGH per `ADAPTER_REVISION_STAMP_CONTRACT.md`
  2. **`export *` wildcard** — exports the entire hook module indiscriminately rather than explicitly named public symbols; hides what the public surface actually is
  3. **Exposes legacy/manual-server-state hook** — `useFeed.js` uses `useState + useEffect` server-fetch pattern, which is a contract violation (ARCHITECTURE_GOVERNANCE_CONTRACT.md). Promoting this through an adapter legitimizes the legacy pattern externally.

### E-3: Missing Primary Feature Adapter

CentralFeed has **no primary feature adapter** (e.g., `centralFeed.adapter.js`) that exports the screen or primary hook for consumption by the routing layer.

- `lazyApp.jsx` imports `CentralFeedScreen` directly from the screen file path
- No adapter exports the screen as its public surface
- The explore feature, by contrast, has `explore.adapter.js` that exports `ExploreScreen`

This means there is no single declared public surface for CentralFeed — violating `Architecture/07-adapter-contract.md` §5.4 ("any code outside a feature must import the feature through its adapter").

---

## F. Layer Violation Report

### F-1: DAL Exports Business Logic (feed.posts.dal.js)

- **File:** `apps/VCSM/src/features/CentralFeed/dal/feed.posts.dal.js`
- **Layer:** DAL
- **Violation:** The `listFeedPosts` function performs field mapping and renaming inside a DAL function. It renames `actor_id` → `id`, maps `photo_url` → `avatar`, derives `displayName`, `username` from actor rows. The DAL contract states: "DAL files must not normalize, rename, or map fields; derive flags or meaning." This is model-layer work embedded in the DAL. Additionally it imports from `@hydration` (an engine) — DAL files may only import Supabase client helpers, schema constants, and generic query utilities.
- **Contract:** `Architecture/03-layer-contracts.md` §2.1 DAL Contract
- **Severity:** HIGH

### F-2: Pipeline Layer — Fan-Out Exceeds Controller Limit

- **File:** `apps/VCSM/src/features/CentralFeed/pipeline/fetchFeedPage.pipeline.js`
- **Layer:** Pipeline (non-standard layer)
- **Violation:** The pipeline calls 10 DAL functions + 1 hydration engine + 3 models = 14 collaborators. The `Architecture/10-structural-integrity.md` §4.3 Controller Fan-Out Rule states: "A controller may call at most 5 external modules." While this is labeled a "pipeline" rather than a controller, it performs controller-level orchestration (decides which DALs to call, processes results). The fan-out rule applies. At 14 collaborators this is 280% over the limit.
- **Contract:** `Architecture/10-structural-integrity.md` §4.3
- **Severity:** HIGH

### F-3: Adapter Exports DAL Functions (feedCache.adapter.js)

- **File:** `apps/VCSM/src/features/CentralFeed/adapters/feedCache.adapter.js`
- **Layer:** Adapter
- **Violation:** All three exports are directly re-exported from DAL files. The adapter contract explicitly states: "Adapters must never export: DAL, models, controllers." Cache invalidation functions are DAL-layer operations.
- **Contract:** `Architecture/07-adapter-contract.md` §5.3
- **Severity:** HIGH

### F-4: Debug Controller Passes actorId to a DAL Function Named userId

- **File:** `apps/VCSM/src/features/CentralFeed/controllers/getDebugPrivacyRows.controller.js`
- **Layer:** Controller
- **Violation:** The controller calls `readOwnedActorIdsByUserIdDAL(actorId)` — passing an `actorId` to a DAL function whose parameter is named `userId`. The DAL (`feed.read.debugPrivacyRows.dal.js`) then does `.eq("user_id", userId)`. This conflates `actorId` with `user_id` — querying `vc.actor_owners` with the wrong identifier type. `actorId` is `vc.actors.id`; `user_id` in `actor_owners` is `auth.users.id`. These are different values. This is an identity contract violation.
- **Contract:** `Architecture/02-identity-contract.md` — "actorId refers exclusively to `vc.actors.id`"; passing actorId where userId is expected confuses identity layers
- **Severity:** CRITICAL — may produce wrong ownership results in debug panels

### F-5: useFeed.js — Manual Server-State Pattern (Legacy)

- **File:** `apps/VCSM/src/features/CentralFeed/hooks/useFeed.js`
- **Layer:** Hook
- **Violation:** Uses `useState + useEffect` for all server data (posts, loading, hasMore, hiddenPostIds, filterDebugRows, firstBatchReady). This is an explicitly deprecated pattern. The React Query standard is `useCentralFeed.js` — but `useFeed.js` is still active, still exported through the adapter, and still consumed by `PostFeed.screen.jsx`. The dual-hook system means two different server-state mechanisms for the same feed capability. `ARCHITECTURE_GOVERNANCE_CONTRACT.md` states: "Forbidden: Do not introduce new manual useState + useEffect server-fetch patterns. Existing manual patterns must be migrated progressively."
- **Contract:** `ARCHITECTURE_GOVERNANCE_CONTRACT.md` Part 2 React Query Server-State Rule
- **Severity:** MEDIUM (existing pattern, not newly introduced — but migration is overdue)

### F-6: WelcomeFeedCard.jsx — Relative Import

- **File:** `apps/VCSM/src/features/CentralFeed/components/WelcomeFeedCard.jsx` line 6
- **Violation:** `import { useFeedWelcomeCard } from '../hooks/useFeedWelcomeCard'` — uses a relative `../` import chain. The `Architecture/08-dependency-rules.md` §6.5 states: "All other imports must use `@/` path aliases. Relative `../../` chains are forbidden." While this is `../` not `../../`, the contract specifies all cross-folder imports must use `@/` aliases, not relative paths.
- **Contract:** `Architecture/08-dependency-rules.md` §6.5
- **Severity:** LOW

### F-7: Both useFeed.js and useCentralFeed.js Consume actorStore (Zustand) for Server Actor Data

- **Files:** `hooks/useFeed.js`, `hooks/useCentralFeed.js`
- **Layer:** Hook
- **Violation:** Both hooks call `useActorStore((s) => s.upsertActors)` to push actor data (display_name, username, photo_url, vport data) into the Zustand actor store after each page fetch. `ARCHITECTURE_GOVERNANCE_CONTRACT.md` Zustand Scope Rule states: "Forbidden Zustand state: server data, profile data, feed data." Upserted actor display data (server truth) stored in Zustand is a scope violation.
- **Contract:** `ARCHITECTURE_GOVERNANCE_CONTRACT.md` Part 2 Zustand Scope Rule
- **Severity:** HIGH

### F-8: Debug Diagnostics Group Imports CentralFeed Internals Directly

- **File:** `src/dev/diagnostics/groups/feedFeature.group.js`
- **Violation:** Imports hooks, controllers, DAL functions, models, and screens directly from CentralFeed internal paths — bypassing the adapter boundary. 15 internal imports total (listed in Section D-3).
- **Contract:** `Architecture/05-feature-boundaries.md` §5.2 Cross-Feature Boundary Rule; `Architecture/07-adapter-contract.md` §5.4
- **Severity:** HIGH (would be MERGE_BLOCKED in a standard feature; dev-only files may have documented exception — none found)

### F-9: Pipeline Imports @debuggers Unconditionally

- **File:** `apps/VCSM/src/features/CentralFeed/pipeline/fetchFeedPage.pipeline.js` line 22
- **Violation:** `import { wrapDAL, recordStep } from "@debuggers/feed/feedProfiler"` — this is a top-level import of a dev-only debugger module in a production file. The file then conditionally wraps DALs with profiler instrumentation only when `import.meta.env.DEV` — but the import itself is unconditional. Tree-shaking may handle this in production builds, but the import is structurally present in production code. The `@debuggers` alias is documented as "dev-only debug utilities — stripped in production" (`Architecture/08-dependency-rules.md` §6.5 approved alias table).
- **Contract:** `Architecture/08-dependency-rules.md` §6.5 — `@debuggers` is a dev-only alias; its unconditional presence in a production import is a structural concern
- **Severity:** MEDIUM

---

## G. State / Cache Report

### React Query Usage

- **useCentralFeed.js** — correct. Uses `useInfiniteQuery` with `queryKey = queryKeys.centralFeed(actorId, realmId)`. Query key correctly includes `actorId` per System/05-actor-ten-rules.md. `staleTime: 30_000`, `gcTime: 10 * 60 * 1000`. React Query owns all server state for this hook. PASS.
- **fetchCentralFeedPage.js** — correct. Pure async queryFn consumed by `useInfiniteQuery`. No state. PASS.

### Manual Server-State Patterns Found

1. **useFeed.js** — entire server-state lifecycle managed manually:
   - `useState` for `posts`, `loading`, `hasMore`, `firstBatchReady`, `hiddenPostIds`, `filterDebugRows`
   - `useEffect` triggers initial fetch
   - Pagination managed via `useRef(null)` cursor
   - Request versioning via `useRef(0)`
   - This is a MEDIUM violation (existing legacy pattern, not new)

2. **useDebugPrivacyRows.js** — uses `useState + useEffect` for server fetch of debug rows.
   - MEDIUM violation (debug-only hook, but pattern is still prohibited)

3. **useFeedWelcomeCard.js** — uses `useState + useEffect` for welcome card server state.
   - MEDIUM violation (welcome card is a simple one-shot read — this is a candidate for React Query migration)

### TTL Cache Usage

Four DAL files maintain their own TTL in-memory caches:

| File | TTL | Cache Key | Purpose |
|---|---|---|---|
| `feed.read.actorsBundle.dal.js` | 30s | `actor:{actorId}` | Actor bundle data |
| `feed.read.blockRows.dal.js` | 60s | viewerActorId | Block relationships |
| `feed.read.followRows.dal.js` | 60s | viewerActorId | Follow graph |
| `feed.read.media.dal.js` | 60s | postId | Post media assets |

All four are in violation of the TTL Cache Deprecation Rule: "Do not add new DAL-level TTL caches unless explicitly approved. Existing TTL caches must be migrated to React Query or centralized cache ownership over time." (`ARCHITECTURE_GOVERNANCE_CONTRACT.md`)

**Severity:** MEDIUM (4 violations — these are existing caches, not new additions, but they are uncoordinated with React Query's cache lifecycle).

### Zustand Usage

Both `useFeed.js` and `useCentralFeed.js` upsert server actor data (display names, avatars, vport names) into `useActorStore` (a Zustand store sourced from `@hydration`). This is server data being written to a Zustand store — a violation of the Zustand Scope Rule.

The store provides `upsertActors` and `getMissingOrStale` functions, indicating it holds server-derived actor presentation data. This violates: "Forbidden Zustand state: server data, profile data."

**Severity:** HIGH — this is a platform-level concern (the actor store is a shared Zustand store receiving server data from the feed hooks on every page load).

**Note:** This may be an approved architectural exception (the actorStore may be a deliberate cross-cutting cache). If so, the exception needs to be documented in the governance contracts. Currently it has no documented exception.

### Cache Invalidation Coordination

The `feedCache.adapter.js` exposes three cache invalidation functions that external features (social, block, settings) call when they mutate related state. This creates tight coupling:

- Social follow/unfollow → calls `invalidateFeedFollowCache`
- Block actor → calls `invalidateFeedBlockCache`
- Privacy settings change → calls `invalidateActorBundleEntry`

These TTL caches are **uncoordinated** with React Query. When `useCentralFeed.js` (React Query) is the active hook, its cache is not invalidated by these external calls — only the legacy TTL caches are invalidated. This means the React Query cache can serve stale feed data after a block, follow, or privacy change when using `useCentralFeed.js`.

**Severity:** HIGH — functional regression risk when `useCentralFeed` is the active hook.

---

## H. Module Completeness Report

### H-1: Feed Page Fetch
- **Purpose:** Fetch and serve paginated feed posts to the UI
- **Files owned:** `feed.read.posts.dal.js`, `fetchFeedPage.pipeline.js`, `fetchCentralFeedPage.js`, `useCentralFeed.js`, `useFeed.js`
- **Layer coverage:** DAL ✓, Model (via pipeline), Controller (none — pipeline acts as controller), Hook ✓, Screen (consumer)
- **Recommendation:** KEEP — but migrate `useFeed.js` to use `useCentralFeed.js` and remove the legacy hook. The pipeline needs controller fan-out addressed.

### H-2: Feed Normalization
- **Purpose:** Transform raw DB rows into normalized post objects with visibility rules applied
- **Files owned:** `normalizeFeedRows.model.js`, `inferMediaType.model.js`, `feedRowVisibility.model.js`, `feedPrivateVisibility.model.js`
- **Layer coverage:** Model ✓ (pure functions)
- **Recommendation:** KEEP — well-structured, pure models, correct layer.

### H-3: Actor Bundle Hydration
- **Purpose:** Batch-hydrate actor display data (profile + vport) for feed rows
- **Files owned:** `feed.read.actorsBundle.dal.js`, `feed.read.viewerContext.dal.js`
- **Layer coverage:** DAL ✓
- **Recommendation:** CONSIDER EXTRACT — `readActorsBundle` is a complex multi-table join with a 30s TTL cache. This belongs in the hydration engine (`@hydration`), not in the feed feature DAL. The feed should request actor summaries from the hydration engine, not own the hydration logic.

### H-4: Block/Follow Visibility
- **Purpose:** Determine which actors are blocked or followed for feed filtering
- **Files owned:** `feed.read.blockRows.dal.js`, `feed.read.followRows.dal.js`, `feedBlockVisibility.model.js`, `feedFollowVisibility.model.js`
- **Layer coverage:** DAL ✓, Model ✓
- **Recommendation:** KEEP internally. The TTL caches should migrate to React Query.

### H-5: Reactions
- **Purpose:** Batch load reaction counts and viewer reactions per page
- **Files owned:** `feed.read.reactionCounts.dal.js`, `feed.read.viewerReactions.dal.js`
- **Layer coverage:** DAL ✓
- **Recommendation:** KEEP — these are feed-specific read queries.

### H-6: Comments (Counts)
- **Purpose:** Batch load comment counts per post page
- **Files owned:** `feed.read.commentCounts.dal.js`
- **Layer coverage:** DAL ✓
- **Recommendation:** KEEP — feed-scoped count read.

### H-7: Mentions
- **Purpose:** Enrich @-mention edges in post text with actor presentation data
- **Files owned:** `feed.mentions.dal.js`, `enrichMentionRows.model.js`, `buildMentionMaps.model.js`
- **Layer coverage:** DAL ✓, Model ✓
- **Recommendation:** KEEP — mention enrichment is feed-specific.

### H-8: Hidden Posts
- **Purpose:** Track which posts the viewer has hidden (moderation action)
- **Files owned:** `feed.read.hiddenPosts.dal.js`
- **Layer coverage:** DAL ✓
- **Recommendation:** KEEP — but consider whether this belongs in the moderation feature.

### H-9: Media
- **Purpose:** Load post media assets with TTL cache per post
- **Files owned:** `feed.read.media.dal.js`
- **Layer coverage:** DAL ✓
- **Recommendation:** KEEP — TTL cache should migrate to React Query.

### H-10: Welcome Card
- **Purpose:** Show onboarding welcome card to new citizen actors
- **Files owned:** `feedWelcomeCard.dal.js`, `feedWelcomeCard.controller.js`, `useFeedWelcomeCard.js`, `WelcomeFeedCard.jsx`, `welcomeFeedCard.styles.js`
- **Layer coverage:** DAL ✓, Controller ✓, Hook ✓, Component ✓
- **Recommendation:** CONSIDER EXTRACT — this module is self-contained (own DAL/controller/hook/component stack) and belongs to the onboarding domain, not the feed domain. Its presence in CentralFeed is opportunistic. It should be a feature in `features/onboarding/` or `features/welcomeCard/`.

### H-11: Feed Actions (Cross-feature Orchestration)
- **Purpose:** Handle post delete, block, follow, report, hide, share from feed context
- **Files owned:** `useCentralFeedActions.js`
- **Layer coverage:** Hook ✓
- **Recommendation:** KEEP — feed-specific orchestration hook. It correctly uses adapters to consume other features (post, social, block, moderation).

### H-12: Feed Screen
- **Purpose:** Compose the main feed screen
- **Files owned:** `CentralFeedScreen.jsx`, `FeedSkeletonList.jsx`, `FeedConfirmModal.jsx`, `useFeedConfirmToast.js`, `useFeedInfiniteScroll.js`
- **Layer coverage:** Screen ✓, Component ✓, Hook (UI-state) ✓
- **Recommendation:** KEEP — well-separated into UI components and state hooks.

### H-13: Actor Posts (Cross-domain SSOT)
- **Purpose:** List posts by a specific actor (shared between feed and profiles)
- **Files owned:** `listActorPostsByActor.dal.js`, `listActorPosts.controller.js`
- **Layer coverage:** DAL ✓, Controller ✓
- **Recommendation:** EXTRACT — this is explicitly documented as cross-domain. Should live in a shared posts engine or `features/post/` with its own adapter.

### H-14: Debug/Diagnostics
- **Purpose:** Dev-only panels and tooling for feed debugging
- **Files owned:** `feed.posts.dal.js`, `feed.read.debugPrivacyRows.dal.js`, `getDebugPrivacyRows.controller.js`, `useDebugPrivacyRows.js`, `DebugFeedFilterPanel.jsx`, `DebugPrivacyPanel.jsx`
- **Layer coverage:** All layers
- **Recommendation:** MOVE to `src/dev/diagnostics/` — all six files are dev-only and do not belong in production feature folders.

---

## I. Priority Fix List

---

### CRITICAL

#### CRITICAL-1: Identity Confusion in Debug Controller — actorId Passed as userId

**File:** `apps/VCSM/src/features/CentralFeed/controllers/getDebugPrivacyRows.controller.js` line 42
**Contract violated:** `Architecture/02-identity-contract.md` — "actorId refers exclusively to `vc.actors.id`"; `vc.actor_owners.user_id` is `auth.users.id`
**What is wrong:** `readOwnedActorIdsByUserIdDAL(actorId)` passes an `actorId` (vc.actors.id) to a DAL function whose parameter is `userId` and whose SQL is `.eq("user_id", userId)`. The `user_id` column in `vc.actor_owners` is `auth.users.id`, not `vc.actors.id`. These are different UUID namespaces. The query will return no rows or wrong rows for any actor, silently producing incorrect ownership data in the debug panel.
**Why it matters:** While this is a debug-only controller, it uses production DB data and will display incorrect ownership/visibility information to developers diagnosing feed visibility issues. Incorrect debug panels lead to wrong conclusions about production behavior.
**Exact recommended fix:** The controller should receive a `userId` (auth user ID) separately and pass it to the DAL, OR the DAL function should be rewritten to accept `actorId` and join through `vc.actors` to get the user_id. The controller signature and DAL signature are mismatched.
**Code-only:** This is an application-layer fix. The DB query itself (querying actor_owners by user_id) is correct SQL; the error is in what value is being passed.

---

### HIGH

#### HIGH-1: feedCache.adapter.js Exports DAL Functions — Adapter Contract Violation

**File:** `apps/VCSM/src/features/CentralFeed/adapters/feedCache.adapter.js`
**Contract violated:** `Architecture/07-adapter-contract.md` §5.3 — "Adapters must never export: DAL, models, controllers"
**What is wrong:** All three exports are direct re-exports from DAL files (`dal/feed.read.blockRows.dal.js`, `dal/feed.read.followRows.dal.js`, `dal/feed.read.actorsBundle.dal.js`). The adapter is being used as a DAL re-export surface.
**Why it matters:** External features (social, block, settings) now depend on CentralFeed's internal DAL caching implementation. This couples the feed's TTL cache strategy to 5 external call sites. When the TTL caches are migrated to React Query, all these external call sites will need updating. The adapter should expose a domain-level cache invalidation service, not raw DAL functions.
**Exact recommended fix:** Create `controllers/feedCacheInvalidation.controller.js` that owns cache invalidation logic (including any coordinated React Query invalidation). The adapter should export from that controller. Remove DAL re-exports from the adapter.
**Code-only.**

#### HIGH-2: Both Feed Hooks Push Server Data Into Zustand actorStore

**Files:** `hooks/useFeed.js`, `hooks/useCentralFeed.js`
**Contract violated:** `ARCHITECTURE_GOVERNANCE_CONTRACT.md` Zustand Scope Rule — "Forbidden Zustand state: server data, profile data"
**What is wrong:** Both hooks call `upsertActors()` to write actor presentation data (display_name, username, photo_url, vport_name, vport_slug) from server responses into the Zustand actor store after each page fetch. This is server data stored in Zustand.
**Why it matters:** Zustand is UI-only ephemeral state per contract. Using it as a cross-feature actor cache creates invisible coupling between the feed and any component that reads from the actor store. If this is an intentional approved pattern, it needs documented exception in contracts.
**Exact recommended fix:** Evaluate whether `actorStore` via `@hydration` has an approved exception (it appears to be a platform-level identity cache). If so, document the exception explicitly in the governance contracts. If not, actor hydration should flow through React Query query data.
**Code-only.**

#### HIGH-3: React Query Cache Not Invalidated by External Cache Invalidation Calls

**Files:** `hooks/useCentralFeed.js`, `adapters/feedCache.adapter.js`
**Contract violated:** `ARCHITECTURE_GOVERNANCE_CONTRACT.md` — server state belongs in React Query; cache invalidation must be coordinated
**What is wrong:** When `useCentralFeed.js` (React Query) is the active feed hook, external features calling `invalidateFeedFollowCache` or `invalidateFeedBlockCache` only clear TTL caches. The React Query cache for `queryKeys.centralFeed(actorId, realmId)` is NOT invalidated. This means the feed served by `useCentralFeed` will show stale follow/block state until `staleTime` (30s) expires.
**Why it matters:** User blocks an actor → calls `invalidateFeedBlockCache` → TTL cache cleared → but React Query cache still has the old page data → feed still shows blocked actor's posts for up to 30 seconds.
**Exact recommended fix:** The cache invalidation controller (see HIGH-1) should also call `queryClient.invalidateQueries({ queryKey: ['feed', 'central'] })` when TTL caches are invalidated. This requires access to the query client — which means the invalidation should be done from inside the feed's hook layer (via a callback or exported query invalidation helper), not from external features calling adapter functions.
**Code-only.**

#### HIGH-4: Pipeline Fan-Out Exceeds 5-Collaborator Limit

**File:** `pipeline/fetchFeedPage.pipeline.js`
**Contract violated:** `Architecture/10-structural-integrity.md` §4.3 Controller Fan-Out Rule — "A controller may call at most 5 external modules"
**What is wrong:** The pipeline calls 11 DAL functions + 1 hydration engine function + 3 model functions = 15 collaborator calls. This is 300% over the limit. The pipeline also orchestrates conditional logic (mention hydration only if `hasPotentialMentions`) — this is controller-level responsibility, not a passive data fan-out.
**Why it matters:** God functions accumulate responsibilities until they cannot be tested or reasoned about independently. This pipeline is already complex enough to require a debug profiler wrapper for each collaborator.
**Exact recommended fix:** Extract sub-controllers: `fetchFeedMediaAndCounts.controller.js` (media, reactions, comments), `fetchFeedVisibility.controller.js` (blocks, follows, hidden posts), `fetchFeedMentions.controller.js` (mention edges + hydration). The pipeline becomes a coordinator calling 3–4 controllers instead of 15 DALs.
**Code-only.**

#### HIGH-5: Missing Revision Stamps on All Adapter Files

**Files:** `adapters/feedCache.adapter.js`, `adapters/hooks/useFeed.adapter.js`
**Contract violated:** `ADAPTER_REVISION_STAMP_CONTRACT.md` — "Every feature adapter file must include an architecture revision stamp"
**What is wrong:** Neither adapter file has an `@adapter` JSDoc stamp with `@feature`, `@lastReviewed`, `@blastRadius`, `@publicSurface`, `@requiresDeepReview` fields.
**Why it matters:** Without stamps, blast radius is invisible, last-review date is unknown, and the platform cannot enforce deep-review gates for high-blast-radius changes.
**Exact recommended fix:** Add the required `@adapter` JSDoc block to both files before the first import statement. For `feedCache.adapter.js`, declare `@blastRadius high` (5 external consumers), `@requiresDeepReview true`. For `useFeed.adapter.js`, declare `@blastRadius low` (1 consumer), `@requiresDeepReview false`.
**Code-only.**

#### HIGH-6: Dev Diagnostics Group Bypasses CentralFeed Adapter Boundary

**File:** `src/dev/diagnostics/groups/feedFeature.group.js`
**Contract violated:** `Architecture/05-feature-boundaries.md` §5.2; `Architecture/07-adapter-contract.md` §5.4
**What is wrong:** 15 direct internal imports from CentralFeed (hooks, models, DAL, controllers, screens) without going through any adapter.
**Why it matters:** Dev diagnostic files are imported by the diagnostics runtime in DEV builds. Even if tree-shaken in production, the boundary violation means any refactor of CentralFeed internals can silently break the diagnostics runner. Additionally, the group imports `listFeedPosts` from the legacy DAL directly — creating an external consumer of a file that is supposed to be dev-only.
**Exact recommended fix:** Either (a) expose the needed symbols through a dedicated `CentralFeed.diagnostics.adapter.js` (dev-only adapter), or (b) document a formal exception that `src/dev/diagnostics/**` is exempt from the adapter boundary rule.
**Code-only.**

#### HIGH-7: No Primary CentralFeed Screen Adapter

**Context:** Route system at `lazyApp.jsx` imports `CentralFeedScreen` directly from `@/features/CentralFeed/screens/CentralFeedScreen`
**Contract violated:** `Architecture/07-adapter-contract.md` §5.4 — "any code outside a feature must import the feature through its adapter"
**What is wrong:** There is no `centralFeed.adapter.js` (or equivalent) that exports the screen as a declared public surface. The explore feature has `explore.adapter.js` with `ExploreScreen` exported. CentralFeed has no equivalent.
**Why it matters:** Without a primary adapter, there is no declared public surface for the feature. The screen can be imported from anywhere in the codebase by its full internal path, without any boundary enforcement.
**Exact recommended fix:** Create `adapters/centralFeed.adapter.js` with `@adapter` stamp and `export { default as CentralFeedScreen } from '../screens/CentralFeedScreen'`. Update `lazyApp.jsx` to import from the adapter.
**Code-only.**

---

### MEDIUM

#### MEDIUM-1: useFeed.js — Active Legacy Manual Server-State Hook

**File:** `hooks/useFeed.js`
**Contract violated:** `ARCHITECTURE_GOVERNANCE_CONTRACT.md` React Query Server-State Rule — "Existing manual patterns must be migrated progressively"
**What is wrong:** `useFeed.js` uses `useState + useEffect` for all server state. `useCentralFeed.js` (React Query) was written as its replacement but `useFeed.js` is still active and exported through the adapter.
**Why it matters:** Two competing server-state systems for the same data source. React Query cache and TTL caches are uncoordinated between the two hook implementations. `PostFeed.screen.jsx` uses the legacy hook through the adapter.
**Exact recommended fix:** Migrate `PostFeed.screen.jsx` to use `useCentralFeed`. Remove `useFeed.adapter.js` and `useFeed.js` once no consumers remain. Mark `useFeed.js` as deprecated in the interim.
**Code-only.**

#### MEDIUM-2: Four TTL Caches in DAL Files — Uncoordinated with React Query

**Files:** `dal/feed.read.actorsBundle.dal.js`, `dal/feed.read.blockRows.dal.js`, `dal/feed.read.followRows.dal.js`, `dal/feed.read.media.dal.js`
**Contract violated:** `ARCHITECTURE_GOVERNANCE_CONTRACT.md` TTL Cache Deprecation Rule
**What is wrong:** Four separate DAL-level TTL caches with no coordination with React Query. They may serve stale data while React Query shows fresh data, or vice versa.
**Why it matters:** Uncoordinated caches cause consistency issues. Block a user → invalidate TTL block cache → React Query still has old page data → stale feed display. This is the root cause of HIGH-3.
**Exact recommended fix:** Migrate cache ownership to React Query. Block and follow state should use `useQuery` with appropriate staleTime and invalidation via `queryClient.invalidateQueries`. Actor bundle and media data can be React Query query data or eliminated if the pipeline is restructured.
**Code-only.**

#### MEDIUM-3: Debug Files in Production Feature Folders (6 files)

**Files:** `dal/feed.posts.dal.js`, `dal/feed.read.debugPrivacyRows.dal.js`, `controllers/getDebugPrivacyRows.controller.js`, `hooks/useDebugPrivacyRows.js`, `screens/DebugFeedFilterPanel.jsx`, `screens/DebugPrivacyPanel.jsx`
**Contract violated:** `Architecture/05-feature-boundaries.md` §5.1 — dev/diagnostic logic does not belong in production feature folders
**What is wrong:** 6 of 46 files (13%) are debug-only, living in production-indexed folders.
**Why it matters:** Creates confusion about feature size and responsibility. Increases audit surface. The production DAL has a file (`feed.posts.dal.js`) that is completely inactive in production (returns `[]`).
**Exact recommended fix:** Move all 6 files to `src/dev/diagnostics/`. Update all consumers (feedFeature.group.js, CentralFeedScreen.jsx debug blocks, useDebugPrivacyRows.js).
**Code-only.**

#### MEDIUM-4: Pipeline Imports @debuggers Unconditionally

**File:** `pipeline/fetchFeedPage.pipeline.js` line 22
**Contract violated:** `Architecture/08-dependency-rules.md` §6.5 — `@debuggers` is a dev-only alias, documented as "stripped in production"
**What is wrong:** `import { wrapDAL, recordStep } from "@debuggers/feed/feedProfiler"` is an unconditional top-level import. While the alias is documented as stripped in production builds, having an unconditional production import of a dev-only alias is structurally incorrect.
**Why it matters:** If the `@debuggers` alias ever fails to resolve in a production build (misconfiguration, CI environment), the entire pipeline will fail to load.
**Exact recommended fix:** Wrap the debug import with a dynamic conditional: `const { wrapDAL, recordStep } = import.meta.env.DEV ? await import('@debuggers/feed/feedProfiler') : { wrapDAL: (_, __, fn) => fn, recordStep: () => {} }` — or extract profiler wrapping into a separate dev-only file that is tree-shaken.
**Code-only.**

#### MEDIUM-5: useFeedWelcomeCard.js — Manual Server-State Pattern

**File:** `hooks/useFeedWelcomeCard.js`
**Contract violated:** `ARCHITECTURE_GOVERNANCE_CONTRACT.md` React Query Server-State Rule
**What is wrong:** Uses `useState + useEffect` for server-side onboarding state fetch.
**Why it matters:** Should use React Query for the initial read with `enabled: actorId && kind === 'user'`. The mutation (mark seen) is appropriate as a direct call.
**Exact recommended fix:** Migrate `ctrlGetWelcomeCardVisible` call to `useQuery`. Preserve localStorage fast-path logic.
**Code-only.**

#### MEDIUM-6: WelcomeFeedCard.jsx Relative Import

**File:** `components/WelcomeFeedCard.jsx` line 6
**Contract violated:** `Architecture/08-dependency-rules.md` §6.5
**What is wrong:** `import { useFeedWelcomeCard } from '../hooks/useFeedWelcomeCard'` uses relative path.
**Why it matters:** Minor — relative imports within a feature are not forbidden, only cross-directory `../../` chains. However, all imports should use `@/` aliases for consistency per the stated rule.
**Exact recommended fix:** Change to `import { useFeedWelcomeCard } from '@/features/CentralFeed/hooks/useFeedWelcomeCard'`.
**Code-only.**

#### MEDIUM-7: useFeed.adapter.js Wildcard Re-Export Hides Public Surface

**File:** `adapters/hooks/useFeed.adapter.js`
**Contract violated:** `Architecture/07-adapter-contract.md` — adapters must "expose only intentionally public APIs"
**What is wrong:** `export * from "@/features/CentralFeed/hooks/useFeed"` exports every symbol in the hook module, including any internal helper symbols. The adapter cannot enforce selectivity.
**Why it matters:** Any symbol added to `useFeed.js` becomes part of the external public surface without review.
**Exact recommended fix:** Replace with explicit named export: `export { useFeed } from '@/features/CentralFeed/hooks/useFeed'`.
**Code-only.**

---

### LOW

#### LOW-1: Stale Windows Path Comments in Two Model Files

**Files:** `model/normalizeFeedRows.model.js` line 1, `model/buildMentionMaps.model.js` line 1
**Issue:** Comments reference `C:\Users\trest\OneDrive\Desktop\VCSM\src\features\feed\model\...` — developer machine path from old feature location.
**Why it matters:** Misleading provenance; references wrong feature path.
**Exact recommended fix:** Remove line 1 comment from both files.
**Code-only.**

#### LOW-2: listActorPosts.controller.js Cross-Domain SSOT Lives in Wrong Feature

**File:** `controllers/listActorPosts.controller.js`
**Issue:** Header documents this as SSOT for profile posts AND feed posts. It belongs in a shared location.
**Why it matters:** Profiles depending on CentralFeed's internal controller is a boundary violation risk.
**Exact recommended fix:** Extract to `engines/posts/controllers/listActorPosts.controller.js` or `features/post/controllers/listActorPosts.controller.js` with adapter re-export. Update all consumers.
**Code-only.**

#### LOW-3: WelcomeFeedCard Module Should Be Extracted to Onboarding Feature

**Files:** `dal/feedWelcomeCard.dal.js`, `controllers/feedWelcomeCard.controller.js`, `hooks/useFeedWelcomeCard.js`, `components/WelcomeFeedCard.jsx`, `components/welcomeFeedCard.styles.js`
**Issue:** This is a self-contained onboarding module living inside the feed feature for opportunistic reasons.
**Why it matters:** As CentralFeed grows, modules that don't belong to the feed domain increase the god-folder risk. This module has no dependency on feed-specific state or logic.
**Exact recommended fix:** Extract to `features/onboarding/` or `features/welcomeCard/` with its own adapter. CentralFeedScreen imports through the new adapter.
**Code-only.**

#### LOW-4: feed.read.actorsBundle.dal.js invalidateActorsBundleCache Never Exported

**File:** `dal/feed.read.actorsBundle.dal.js`
**Issue:** `invalidateActorsBundleCache()` (invalidate all entries) is defined but never exported or consumed anywhere. Only `invalidateActorBundleEntry(actorId)` (single entry) is exported via the adapter.
**Why it matters:** Dead export pollutes the DAL file surface.
**Exact recommended fix:** Remove `invalidateActorsBundleCache` or export it if needed.
**Code-only.**

---

## Summary Counts

| Severity | Count |
|---|---|
| CRITICAL | 1 |
| HIGH | 7 |
| MEDIUM | 7 |
| LOW | 4 |
| INFO | 0 |
| **Total** | **19** |
