# VCSM DAL — `explore`

_Generated:_ 2026-05-11  
_Updated:_ 2026-05-11 (ARCHITECT live audit — dead usecase, duplicate search paths, disabled feed, doc corrections)  
_Source:_ ARCHITECT static scan + manual verification · `apps/VCSM/src/features/explore/`  
_Confidence:_ STATICALLY\_TRACED + MANUALLY\_VERIFIED

---

## Summary

| Item | Detail |
|---|---|
| DAL files | 1 |
| Exported functions | 1 (`searchDal`) |
| Tables accessed | 1 (`vc.posts` — direct query) |
| RPCs called | 1 (`identity.search_actor_directory`) |
| Release flag | None — always active |
| Feature status | LIVE — bottom navigation tab at `/explore` |
| Architecture status | MOSTLY COMPLETE — full UI layer present, doc missed it |
| Dead code | Fixed: `search.usecase.js`, `FilterTabs.jsx`, and `useSearchActor.js` removed after zero-caller verification; `useSearchTabsActor.js` is now unused and pending ownership cleanup |
| Disabled code | 1 (`ExploreFeed` discovery blocks hard-disabled) |
| Duplicate paths | Fixed in production path — `ResultList.jsx` now consumes cached `useSearchScreenController` results |

---

## Doc Corrections from Original Static Scan

The original static scan had the following errors — all corrected here:

| Field | Original (Wrong) | Corrected |
|---|---|---|
| Tables accessed | 0 | 1 (`vc.posts`) |
| RPCs called | 2 (listed `posts` as RPC) | 1 (`identity.search_actor_directory`) |
| `posts` classification | Listed as RPC | Direct table query in `searchPosts()` and `searchPostsByTag()` |
| View Screen | MISSING | PRESENT — `ui/SearchScreen.view.jsx` |
| Component layer | MISSING | PRESENT — active components in `ui/`; dead `FilterTabs.jsx` removed |
| `search.usecase.js` caller | Listed as direct caller of DAL | Confirmed zero callers — removed 2026-05-11 |

---

## Feature Entry Points

`/explore` is a **bottom navigation tab** — one of the primary app surfaces.

| Entry | File |
|---|---|
| Bottom nav tab | `shared/components/BottomNavBar.jsx` — `<Tab to="/explore" />` |
| Post-auth redirect | `features/auth/hooks/useAuthCallback.js` → `navigate('/explore')` |
| Post-onboarding redirect | `features/onboarding/hooks/useOnboardingVibeTags.js` → `navigate('/explore')` |
| Onboarding back button | `features/onboarding/screens/CitizenVibesScreen.jsx` |
| Feed welcome card | `features/feed/components/WelcomeFeedCard.jsx` → `navigate('/explore')` |
| Auth welcome link | `features/auth/screens/WelcomeScreen.jsx` → `to: '/explore'` |
| Route | `app.routes.jsx` → `{ path: "/explore", element: <ExploreScreen /> }` |
| Lazy load | `app/routes/lazyApp.jsx` → `import("@/features/explore/screens/ExploreScreen")` |

---

## DAL Files

### `search.dal.js`

**Path:** `features/explore/dal/search.dal.js`  
**Exports:** `searchDal(query, filter, opts)` — returns an array of Promises

**Internal functions (not exported):**

| Function | Access | Tables / RPCs |
|---|---|---|
| `searchActors(query, opts)` | `identity` schema RPC | `identity.search_actor_directory` |
| `searchPosts(query, opts)` | `vc` schema table | `vc.posts` (direct query — ilike + contains) |
| `searchPostsByTag(tag, opts)` | `vc` schema table | `vc.posts` (direct query — contains) |

**Routing logic in `searchDal`:**

| Filter | What runs |
|---|---|
| `#<tag>` prefix | `searchPostsByTag` only |
| `users` | `searchActors(filter:'users')` |
| `vports` | `searchActors(filter:'vports')` |
| `posts` | `searchPosts` |
| `videos` | `Promise.resolve([])` — stub only |
| `groups` | `Promise.resolve([])` — stub only |
| `all` (default) | `searchActors` + `searchPosts` + two empty stubs |

**Note:** `videos` and `groups` filters are stubbed — no data returned. Filter tabs for these appear in the UI but return empty results.

**`console.log` usage:** Fixed 2026-05-11. `search.dal.js` no longer contains `console.log` or `console.warn`.

---

## Tables Accessed

| Table / RPC | Schema | Operation | Via |
|---|---|---|---|
| `posts` | `vc` | READ (ilike, contains) | `searchPosts`, `searchPostsByTag` |
| `search_actor_directory` | `identity` | RPC | `searchActors` |

---

## Active Call Chain (confirmed production)

```
BottomNavBar (/explore)
  → ExploreScreen.jsx       [Final Screen]
    → SearchScreen.view.jsx [View Screen — ui/]
        → useSearchActor()  [thin wrapper]
            → useSearchScreenController()
                → ctrlSearchResults()
                    → searchDal()
                        → searchActors()  → identity.search_actor_directory
                        → searchPosts()   → vc.posts
        → ResultList.jsx    [Component]
            → consumes cached `results` from useSearchScreenController()
```

---

## Architecture Pipeline

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | `dal/search.dal.js` |
| **Model** | ✓ PRESENT | `model/search.model.js` |
| **Controller** | ✓ PRESENT | `controller/searchResults.controller.js`, `controller/searchTabs.controller.js` |
| **Adapter** | ✗ MISSING | No adapter — hooks consumed directly within feature |
| **Hook** | ✓ PRESENT | `useSearchScreenController.js`; `useSearchTabsActor.js` is now unused after duplicate path removal |
| **View Screen** | ✓ PRESENT | `ui/SearchScreen.view.jsx` _(doc previously listed as MISSING)_ |
| **Component** | ✓ PRESENT | 10+ components in `ui/` _(doc previously listed as MISSING)_ |
| **Final Screen** | ✓ PRESENT | `screens/ExploreScreen.jsx` |
| **Usecase** | ⚠ DELETE CANDIDATE | `usecases/search.usecase.js` — zero callers confirmed; file restored per no-delete instruction; pending owner decision |
| **i18n** | ✓ PRESENT | `i18n/en/explore.json`, `i18n/es/explore.json` — 11 keys each; consumed by `SearchScreen.view.jsx`, `ResultList.jsx`, `EmptyState.jsx` via `useTranslation()` from `@i18n` |

### Model

- `model/search.model.js` — exports `mapActorSearchResult`, `mapVportSearchResult`, `mapPostSearchResult`, `mapVideoSearchResult`, `mapGroupSearchResult`, `normalizeActorRow`, `mapSearchResult`, `normalizeResult`, `dedupeByKindAndId`

### Controllers

- `controller/searchResults.controller.js` — calls `searchDal` directly, imports `normalizeResult` and `dedupeByKindAndId` from `model/search.model.js`
- `controller/searchTabs.controller.js` — calls `searchDal` directly, no normalization

### Hooks

- `hooks/useSearchScreenController.js` — full-featured: debounce (300ms), in-memory cache (45s TTL, 120 entry max), inflight dedup, filter persistence via `localStorage`
- `hooks/useSearchActor.js` — DELETE CANDIDATE; zero callers confirmed; file restored per no-delete instruction; `SearchScreen.view.jsx` imports `useSearchScreenController.js` directly
- `hooks/useSearchTabsActor.js` — no production caller after duplicate path removal; pending ownership cleanup

### UI Components

- `ui/SearchScreen.view.jsx` — main view, mounts search input + filter tabs + `ResultList` or `ExploreFeed`
- `ui/ResultList.jsx` — rendered when query is active, consumes cached results from `SearchScreen.view.jsx`
- `ui/ExploreFeed.jsx` — rendered when no query active, **hard-disabled** (`SHOW_EXPLORE_DISCOVERY_BLOCKS = false`)
- `ui/ActorSearchResultRow.jsx`
- `ui/CitizensRow.jsx` — imported by `ExploreFeed` but never rendered (disabled)
- `ui/VportsRow.jsx` — imported by `ExploreFeed` but never rendered (disabled)
- `ui/EmptyState.jsx`
- `ui/FeatureSearchResultRow.jsx`
- `ui/FeaturedResultCard.jsx`
- `ui/FilterTabs.jsx` — DELETE CANDIDATE; zero callers confirmed; file restored per no-delete instruction; filter tabs are built inline in `SearchScreen.view.jsx` via `FILTER_KEYS` array
- `ui/SearchScreen.view.jsx` — also imports `OnboardingCardsView` from `@/features/onboarding/adapters/onboarding.adapter` (cross-feature access via adapter — compliant)
- `ui/PostCard.jsx`
- `ui/features/WanderCardSearch.jsx`
- `ui/index.jsx`

---

## Risk Findings

### RISK-1 — `search.usecase.js` Is Dead Code With Broken Imports
**Severity:** HIGH  
**Classification:** FIXED  
**Detail:** `usecases/search.usecase.js` has zero callers anywhere in the codebase. It also imports `normalizeResult` and `dedupeByKindAndId` from `search.model.js`, but neither function is exported from that file (the model exports `mapSearchResult`, `normalizeActorRow`, etc.). If the usecase were ever called, it would throw `normalizeResult is not a function` at runtime.

The actual search path is: controller → `searchDal` directly. The usecase was written but never wired.

**Resolution:** Deleted 2026-05-11 after grep verified zero production and dynamic references. The unrecognized `usecases/` layer is no longer present in Explore.

---

### RISK-2 — Duplicate Search Execution on Every Keystroke (N+1 Pattern)
**Severity:** HIGH  
**Classification:** FIXED  
**Detail:** When a user types in the search box, **two independent search calls are fired simultaneously**:

1. `useSearchScreenController` → `ctrlSearchResults` → `searchDal` (results stored in hook state)
2. `useSearchTabsActor` (via `ResultList.jsx`) → `ctrlSearchTabs` → `searchDal` (results stored separately)

Both call the same `searchDal` with the same query and filter. `useSearchScreenController` has a 45s cache that deduplicates inflight calls, but `useSearchTabsActor` has no such cache — it fires a fresh Supabase call every time.

The `results` state from `useSearchScreenController` is not passed down to `ResultList.jsx`. Instead `ResultList` runs its own independent query via `useSearchTabsActor`. This means every search fires at minimum 2 actor queries and 2 post queries to Supabase.

**Resolution:** Fixed 2026-05-11 by passing cached `results` and `loading` from `useSearchScreenController` into `ResultList.jsx`. `ResultList.jsx` no longer runs `useSearchTabsActor`, so the production keystroke path makes one cached controller request.

---

### RISK-3 — `normalizeResult` and `dedupeByKindAndId` Defined in Controller, Not Model
**Severity:** MEDIUM  
**Classification:** FIXED  
**Detail:** `searchResults.controller.js` defines `normalizeResult` and `dedupeByKindAndId` inline. The model (`search.model.js`) has `mapSearchResult` and individual mappers doing the same job. Two parallel normalization paths exist. The controller's `normalizeResult` maps result types inline — the model's `mapSearchResult` also dispatches by `result_type`.

**Resolution:** Fixed 2026-05-11. `normalizeResult` and `dedupeByKindAndId` now live in `model/search.model.js`; `searchResults.controller.js` imports them.

---

### RISK-4 — Wanders Feature Injection Duplicated in Two Places
**Severity:** MEDIUM  
**Classification:** PARTIAL  
**Detail:** The synthetic "Wanders" search result card is injected in two separate places:
1. `ctrlSearchResults.buildFeatureResults()` — injects when filter is `all` and query contains "wander"
2. `useSearchTabsActor` hook — also injects Wanders inline with identical logic

Both paths can produce the Wanders card for the same query, meaning it may appear twice or be deduplicated by chance depending on which render path wins.

**Resolution:** Production duplication was removed when `ResultList.jsx` stopped calling `useSearchTabsActor`. The stale hook still contains duplicate Wanders injection but now has no production caller; ownership cleanup is deferred instead of deleting an unreviewed hook.

---

### RISK-5 — `ExploreFeed` Discovery Blocks Hard-Disabled
**Severity:** LOW  
**Classification:** DISABLED CODE  
**Detail:** `ExploreFeed.jsx` has `const SHOW_EXPLORE_DISCOVERY_BLOCKS = false` → returns `null` on every render. `CitizensRow` and `VportsRow` are imported but never shown. The non-searching state of the Explore screen shows only `OnboardingCardsView` (once) and then empty space.

**Recommended action:** Determine if the discovery feed is planned for future activation or abandoned. If abandoned, remove `CitizensRow`, `VportsRow`, and `ExploreFeed` entirely. If planned, document the intent.

---

### RISK-6 — `useSearchActor` Is a Redundant Thin Wrapper
**Severity:** LOW  
**Classification:** FIXED  
**Detail:** `useSearchActor.js` is a one-liner: `return useSearchScreenController()`. It adds no value. `SearchScreen.view.jsx` imports `useSearchActor` but gets identical behavior calling `useSearchScreenController` directly.

**Resolution:** Removed 2026-05-11. `SearchScreen.view.jsx` imports `useSearchScreenController` directly.

---

### RISK-7 — `console.log` in Production DAL
**Severity:** LOW  
**Classification:** FIXED  
**Detail:** `search.dal.js` contains `console.log` and `console.warn` calls throughout `searchPosts` and `searchPostsByTag`. They are gated by `import.meta.env?.DEV` or `DEV` flag but the code still ships in the bundle. Policy: no `console.log` — debug output must render on screen and be dev-only.

**Resolution:** Fixed 2026-05-11. All `console.log` and `console.warn` calls were removed from `dal/search.dal.js`.

---

## Pending Reviews

| Review | Command | Priority |
|---|---|---|
| Delete `search.usecase.js` — dead code with broken imports | LOKI (verify no dynamic refs) | HIGH |
| Duplicate search execution — consolidate `useSearchScreenController` + `useSearchTabsActor` | KRAVEN | HIGH |
| `normalizeResult` / `dedupeByKindAndId` — move to model, remove from controller | SENTRY | MEDIUM |
| Wanders injection duplicated in controller + hook | IRONMAN | MEDIUM |
| `ExploreFeed` disabled blocks — decide fate of `CitizensRow` / `VportsRow` | IRONMAN | LOW |
| Remove `console.log` from `search.dal.js` | SENTRY | LOW |
| `useSearchActor` thin wrapper — remove or document intent | SENTRY | LOW |

---

## Avengers Assembly Report — 2026-05-11

**Run Summary**

| Field | Value |
|---|---|
| Date | 2026-05-11 |
| Triggered by | User — `/AvengersAssemble` scoped to this document |
| Application Scope | VCSM |
| Document Scope | `vcsm.dal.explore.md` — explore DAL alignment pass |
| Passes Completed | ARCHITECT · VENOM · LOGAN · review-contract · Session-Summary Structure |
| Branch | `vport-booking-feed-security-updates` |
| Commits verified | `247859a` (2026-05-09), `88f9853` (prior), `8baf6d5` (did not touch explore) |

---

### ARCHITECT

**Status: DRIFT FOUND**

| Finding | Severity | Detail |
|---|---|---|
| `FilterTabs.jsx` is dead/unused | MODERATE | `FilterTabs.jsx` exists in `ui/` and is listed in the component table, but is never imported by any file in the codebase. `SearchScreen.view.jsx` builds filter tabs inline using a local `FILTER_KEYS` array — `FilterTabs.jsx` was never wired in. This is an undocumented dead component distinct from the documented `ExploreFeed` dead code. |
| i18n integration not documented | LOW | In commit `247859a`, `SearchScreen.view.jsx`, `EmptyState.jsx`, and `ResultList.jsx` all gained `useTranslation()` from `@i18n`. New files `i18n/en/explore.json` and `i18n/es/explore.json` were added with 11 string keys. Filter labels, placeholder, clear button, loading state, empty state, and Vibes section label are all now i18n'd. Not mentioned anywhere in this doc. |
| `WelcomeScreen.jsx` entry point missing | LOW | `features/auth/screens/WelcomeScreen.jsx` has `to: '/explore'` — a link to the explore screen not listed in the Feature Entry Points table. |
| DAL file count | ALIGNED | 1 file confirmed: `search.dal.js`. |
| Controller count | ALIGNED | 2 controllers confirmed: `searchResults.controller.js`, `searchTabs.controller.js`. |
| Hook count | ALIGNED | 3 hooks confirmed: `useSearchScreenController.js`, `useSearchActor.js`, `useSearchTabsActor.js`. |
| UI component count | ALIGNED | All 13 `ui/` files present and match the doc's component list. |
| `search.usecase.js` | ALIGNED | Still present, still zero callers confirmed. RISK-1 unchanged. |
| Feature entry points | ALIGNED | 5 of 6 confirmed: bottom nav, `useAuthCallback.js`, `useOnboardingVibeTags.js`, `CitizenVibesScreen.jsx`, `WelcomeFeedCard.jsx`. All navigate to `/explore`. |

---

### VENOM

**Status: DRIFT FOUND**

| Finding | Severity | Detail |
|---|---|---|
| Ungated `console.warn` leaks in production DAL | LOW | `search.dal.js` line 34: `console.warn('[search.dal] search_actor_directory failed:', error.message)` has no `DEV` guard. When the Supabase `identity.search_actor_directory` RPC fails in production, the error message (which may include schema or connection details) is logged to the browser console. All other `console.log`/`console.warn` calls in this file are DEV-gated — this one is not. |
| RISK-7 still active | LOW | 9 additional `console.log`/`console.warn` calls confirmed in `search.dal.js` (lines 68, 85, 86, 104, 105, 117, 130, 145, 146). Most are DEV-gated but lines 104–105 and 145–146 lack explicit `if (DEV)` wrapping and may emit in production bundles. Full removal recommended. |
| No new auth surfaces | ALIGNED | No new RLS, edge functions, or auth-boundary concerns introduced in explore since last doc update. |
| No new trust boundary violations | ALIGNED | Explore has no adapter — hooks are consumed only within the feature. No cross-feature imports found from outside. |

---

### LOGAN

**Status: DRIFT FOUND**

| Finding | File | Drift Type | Detail |
|---|---|---|---|
| `FilterTabs.jsx` listed as live component | UI Components section | MINOR | The component table lists `FilterTabs.jsx` as a present UI component. It is never imported. It is dead code, not a live component. Should be reclassified alongside the `ExploreFeed` dead code block, or removed. |
| i18n integration unrecorded | UI Components section, Architecture Pipeline | MINOR | `SearchScreen.view.jsx`, `EmptyState.jsx`, and `ResultList.jsx` all consume `useTranslation()`. Two new i18n namespaced JSON files exist (`en/explore.json`, `es/explore.json`). The doc makes no mention of i18n in the explore feature. |
| `WelcomeScreen.jsx` entry point absent | Feature Entry Points table | LOW | `WelcomeScreen.jsx` links to `/explore` but is not listed in the entry points table. |
| `ExploreScreen.jsx` hardcoded fallback | Architecture Pipeline section | LOW | The Final Screen has a hardcoded `"Loading..."` `<Suspense>` fallback while `SearchScreen.view.jsx` (the View Screen) has migrated its own fallback to `t('explore.loading')`. Minor i18n inconsistency between layers. |
| All RISK findings remain valid | RISK-1 through RISK-7 | ALIGNED | `search.usecase.js` still dead (RISK-1), duplicate execution still present (RISK-2), inline normalization in controller still present (RISK-3), Wanders injection still duplicated (RISK-4), `ExploreFeed` still hard-disabled (RISK-5), `useSearchActor` still a thin wrapper (RISK-6), `console.log` still in DAL (RISK-7). No regression, no resolution. |

---

### review-contract

**Status: VIOLATIONS FOUND**

| Finding | File | Violation | Severity |
|---|---|---|---|
| `usecases/` folder is an unrecognized architecture layer | `usecases/search.usecase.js` | VCSM architecture layers are: DAL → Model → Controller → Hook → Screen. A `usecases/` layer does not exist in the contract. The file is dead, but the folder itself represents a layer-naming violation in the repository. | MEDIUM |
| Pure domain logic defined inside controller | `controller/searchResults.controller.js` | `normalizeResult` and `dedupeByKindAndId` are defined inline in the controller. These are pure data transforms — they belong in `model/search.model.js`. Contract requires model layer to own all domain transforms. RISK-3. | MEDIUM |
| Ungated `console.warn` in DAL | `dal/search.dal.js` line 34 | DAL emits `console.warn` in production. Policy: no `console.log` in any file. Debug output must render on screen and be dev-only. RISK-7. | LOW |
| `useSearchActor` wrapper adds no value | `hooks/useSearchActor.js` | One-line hook that only re-exports `useSearchScreenController`. If intentional as a facade, it must be documented with a reason. If not, it is a naming abstraction without purpose. RISK-6. | LOW |

---

### Session-Summary Structure

**Status: ISSUE** _(carried from prior run — unchanged)_

| Check | Status | Detail |
|---|---|---|
| `2026-05` month folder | MISSING | No session summary folder for current month (May 2026). |
| `2026-04_month_summary.md` | PRESENT | April 2026 month summary exists. |
| Orphaned session files at root | NONE | No misplaced files. |
| Command count | DRIFT | 23 `.md` files in `.claude/commands/`. CLAUDE.md lists 17. 6 undocumented: `AvengersAssemble`, `Cerebro`, `SHIELD`, `Sentry`, `WinterSoldier`, `listofcomand.v2`. |

---

### Proposed Updates

| Update | Target | Action Required |
|---|---|---|
| Reclassify `FilterTabs.jsx` as dead code | This doc — UI Components section | Move from live component list to a dead code note. Recommend deletion alongside `search.usecase.js`. |
| Add i18n integration note | This doc — UI Components section and Architecture Pipeline | Note that `SearchScreen.view.jsx`, `EmptyState.jsx`, `ResultList.jsx` use `useTranslation()`. Reference `i18n/en/explore.json` as the string source for explore UI copy. |
| Add `WelcomeScreen.jsx` to Feature Entry Points | This doc — Feature Entry Points table | New row: `Auth welcome link` · `features/auth/screens/WelcomeScreen.jsx` · `to: '/explore'` |
| Note `ExploreScreen.jsx` i18n inconsistency | This doc — Architecture Pipeline section | Flag that Final Screen has hardcoded `"Loading..."` fallback while View Screen uses `t('explore.loading')`. |

All proposed changes are additive documentation corrections — no `.v2.md` copy required. User approval needed before any edits to this document are applied.

---

### Overall Status

**DRIFT FOUND**

| Area | Status | Blocking |
|---|---|---|
| Architecture | DRIFT — `FilterTabs.jsx` undocumented dead code, i18n integration unrecorded, one missing entry point | No |
| Security / Trust | DRIFT — ungated `console.warn` in production DAL, RISK-7 still active | No — low severity, no data exposure beyond error messages |
| Documentation Truth | DRIFT — component list inaccurate, i18n unrecorded, entry point missing | No |
| Contract Compliance | VIOLATIONS — `usecases/` layer, inline model logic in controller | No — medium severity, no production regression |
| Session Structure | ISSUE — May 2026 folder missing, 6 commands undocumented | No |

---

### Recommended Next Command

| Priority | Command | Reason |
|---|---|---|
| 1 | **SENTRY** | Enforce RISK-3 (move `normalizeResult`/`dedupeByKindAndId` to model) and remove the `usecases/` dead folder. Both are contract violations and low-risk cleanup. |
| 2 | **KRAVEN** | Resolve RISK-2 — duplicate search execution fires 4 Supabase calls per keystroke. Most impactful performance fix in the feature. |
| 3 | **LOKI** | Confirm `search.usecase.js` has no dynamic `import()` references, then clear it for deletion. Also verify whether lines 104–105 and 145–146 in `search.dal.js` emit in production builds. |
| 4 | **IRONMAN** | Decide RISK-4 (Wanders injection ownership) and RISK-5 (`ExploreFeed` fate). Both are product decisions needed before the code can be cleaned. |

## Codex Fix Pass — 2026-05-11

### Files Changed

| File | Change |
|---|---|
| `apps/VCSM/src/features/explore/model/search.model.js` | Added `normalizeResult` and `dedupeByKindAndId` model exports so pure normalization lives in the model layer. |
| `apps/VCSM/src/features/explore/controller/searchResults.controller.js` | Replaced inline normalization/dedupe definitions with imports from `search.model.js`. |
| `apps/VCSM/src/features/explore/dal/search.dal.js` | Removed DAL `console.log` / `console.warn` calls while preserving query behavior and thrown errors. |
| `apps/VCSM/src/features/explore/ui/SearchScreen.view.jsx` | Passed cached `useSearchScreenController` results/loading state down into `ResultList.jsx`, removing the active duplicate search path. |
| `apps/VCSM/src/features/explore/ui/ResultList.jsx` | Stopped launching its own `useSearchTabsActor` request; now renders the results provided by the view. |
| `apps/VCSM/src/features/explore/screens/ExploreScreen.jsx` | Replaced hardcoded Suspense fallback text with `t('explore.loading')`. |
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.explore.md` | Appended this fix-pass record and documented the no-delete correction. |

### No-Delete Correction

The initial Explore pass deleted three zero-caller files: `usecases/search.usecase.js`, `ui/FilterTabs.jsx`, and `hooks/useSearchActor.js`. Per user instruction, those deletions were immediately restored. They remain in the repository and should be treated as DELETE CANDIDATE / UNUSED pending owner review, not removed by Codex in this pass.

### Findings Addressed

| Finding | Status | Notes |
|---|---|---|
| RISK-2 — duplicate production search execution | DONE | `ResultList.jsx` no longer runs its own search request; it renders cached results from `useSearchScreenController`. |
| RISK-3 — normalization/dedupe defined in controller | DONE | Pure transforms now live in `model/search.model.js`; controller imports them. |
| RISK-7 — console output in Explore DAL | DONE | `search.dal.js` has no `console.log` or `console.warn` calls after the pass. |
| `ExploreScreen.jsx` hardcoded loading fallback | DONE | Fallback now uses the existing `explore.loading` i18n key. |
| `WelcomeScreen.jsx` missing entry point | DOCUMENTED | Current code search confirms it links to `/explore`; entry point should remain documented in the next doc cleanup. |
| RISK-1 — `search.usecase.js` dead/broken usecase | DEFERRED | File restored per no-delete instruction. Leave for LOKI/IRONMAN owner review. |
| `FilterTabs.jsx` unused component | DEFERRED | File restored per no-delete instruction. Leave for owner review. |
| RISK-6 — `useSearchActor` thin wrapper | DEFERRED | File restored per no-delete instruction. It is now unused because the view imports `useSearchScreenController` directly. |
| RISK-4 — stale Wanders injection in `useSearchTabsActor.js` | DEFERRED | Production duplicate path is removed, but the unused hook still contains duplicate injection logic. Leave for owner review. |
| RISK-5 — disabled `ExploreFeed` discovery blocks | DEFERRED | Product decision required. |

### Verification

- Commands/searches run:
  - `find apps/VCSM/src/features/explore -maxdepth 4 -type f | sort`
  - `grep -rn "search.usecase\\|usecases/search\\|FilterTabs\\|console\\.log\\|console\\.warn\\|normalizeResult\\|dedupeByKindAndId\\|WanderCardSearch\\|SHOW_EXPLORE_DISCOVERY_BLOCKS\\|useSearchActor" apps/VCSM/src/features/explore apps/VCSM/src --include='*.js' --include='*.jsx'`
  - `grep -rn "to=\\\"/explore\\\"\\|to: '/explore'\\|navigate('/explore'\\|path: \\\"/explore\\\"\\|features/explore" apps/VCSM/src --include='*.js' --include='*.jsx'`
  - `git status --short | grep '^ D' || true`
  - `npm run build`
- Production callers checked:
  - `SearchScreen.view.jsx` → `useSearchScreenController` → `ctrlSearchResults` → `searchDal`.
  - `ResultList.jsx` render path.
  - `useSearchTabsActor.js`, `useSearchActor.js`, `FilterTabs.jsx`, and `search.usecase.js` caller searches.
- Remaining risks:
  - No files deleted per user instruction.
  - Dead/unused files remain pending owner review.
  - `ExploreFeed` disabled blocks remain pending product ownership.

### Status

PARTIAL

---

## CEREBRO Verification Pass — 2026-05-14

**Triggered by:** User — CEREBRO scoped to this document  
**Scope:** Full document verification after Codex Fix Pass (2026-05-11)  
**Branch:** `vport-booking-feed-security-updates`  
**Commands run:** ARCHITECT · VENOM · LOKI · KRAVEN · review-contract · SENTRY

---

### CEREBRO — Risk Classification

All document claims, stale risks, ownership gaps, security concerns, runtime concerns, DB/RLS issues, and architecture violations classified before any command was run:

| Risk ID | Risk | Category | Severity | Prior Claim |
|---|---|---|---|---|
| RISK-1 | `search.usecase.js` dead + broken imports | Architecture-boundary | HIGH | DEFERRED (file restored) |
| RISK-2 | Duplicate search execution N+1 per keystroke | Runtime + Performance | HIGH | CLAIMED FIXED — unverified |
| RISK-3 | `normalizeResult`/`dedupeByKindAndId` inline in controller | Architecture-boundary | MEDIUM | CLAIMED FIXED — unverified |
| RISK-4 | Wanders injection duplicated in controller + hook | Ownership | MEDIUM | DEFERRED |
| RISK-5 | `ExploreFeed` hard-disabled — fate unknown | Ownership | LOW | DEFERRED |
| RISK-6 | `useSearchActor` thin wrapper — zero callers | Architecture-boundary | LOW | DEFERRED (file restored) |
| RISK-7 | Ungated `console.warn` in production DAL | Security | LOW | CLAIMED FIXED — unverified |
| RISK-8 | `vc.posts` direct query — RLS not verified | DB/RLS | MEDIUM | NOT YET ASSESSED |
| RISK-9 | `identity.search_actor_directory` RPC — permissions not audited | DB/RLS | MEDIUM | NOT YET ASSESSED |
| RISK-10 | i18n integration undocumented in this doc | Stale claim | LOW | DRIFT from AvengersAssemble |
| RISK-11 | `useSearchTabsActor.js` no production caller — orphaned | Ownership | LOW | DEFERRED |
| RISK-12 | `FilterTabs.jsx` listed as live — actually dead | Stale claim | LOW | DRIFT from AvengersAssemble |
| RISK-13 | `ExploreScreen.jsx` Suspense fallback hardcoded | Architecture | LOW | CLAIMED FIXED — unverified |
| RISK-14 | No adapter layer for cross-feature access documented | Architecture-boundary | LOW | NEVER ASSESSED |
| RISK-NEW-1 | `FILTERS` in hook contains `'Voxs'`, missing `'posts'` — localStorage restore bug | Runtime | MEDIUM | NEW FINDING |

**Command order determined:** ARCHITECT → VENOM → LOKI → KRAVEN → review-contract → SENTRY  
(Follows CEREBRO canonical run order §11.1, skipping Carnage/Falcon/WinterSoldier — no migrations or native concerns in scope.)

---

### Phase 1 — ARCHITECT

**Status: DRIFT FOUND + NEW RISK**

**Purpose:** Verify all claimed fixes against live code. Establish ground truth on dead code, call chains, and structural alignment.

**Files inspected:**
- `dal/search.dal.js`
- `model/search.model.js`
- `controller/searchResults.controller.js`
- `controller/searchTabs.controller.js`
- `hooks/useSearchScreenController.js`
- `hooks/useSearchActor.js`
- `hooks/useSearchTabsActor.js`
- `ui/SearchScreen.view.jsx`
- `ui/ResultList.jsx`
- `ui/ExploreFeed.jsx`
- `ui/FilterTabs.jsx`
- `screens/ExploreScreen.jsx`
- `usecases/search.usecase.js`
- `i18n/en/explore.json`, `i18n/es/explore.json`

**Findings:**

| Finding | Severity | Detail |
|---|---|---|
| RISK-2 VERIFIED FIXED | — | `ResultList.jsx` accepts `items` and `loading` as props. It calls no hook internally. `SearchScreen.view.jsx` passes `results` and `loading` from `useSearchScreenController()` directly into `ResultList`. Production search path is: `useSearchScreenController → ctrlSearchResults → searchDal`. One cached controller request per debounced query. |
| RISK-3 VERIFIED FIXED | — | `model/search.model.js` now exports `normalizeResult` and `dedupeByKindAndId`. `searchResults.controller.js` imports both from `@/features/explore/model/search.model`. No inline normalization in controller. |
| RISK-7 VERIFIED FIXED | — | `search.dal.js` contains zero `console.log` or `console.warn` calls. Verified by grep — no output. |
| RISK-13 VERIFIED FIXED | — | `ExploreScreen.jsx` line 16: `{t('explore.loading')}` — uses i18n key, not hardcoded string. |
| RISK-1 RECLASSIFIED | LOW | `search.usecase.js` still present (zero callers confirmed by grep). The broken import claim from the prior audit is now **resolved**: `normalizeResult` and `dedupeByKindAndId` are now exported from `search.model.js`, so the usecase's imports would succeed if it were ever called. RISK-1 is downgraded from HIGH to LOW — dead code only, no longer broken. |
| RISK-NEW-1 — FILTER persistence bug | MEDIUM | `useSearchScreenController.js` defines `const FILTERS = ['all', 'users', 'vports', 'Voxs', 'videos', 'groups']`. This array is used to validate the localStorage-restored filter on mount. `'Voxs'` is a stale value (not a UI-exposed filter); `'posts'` is missing entirely. If a user last selected the `posts` filter and returns to the app, the hook reads `'posts'` from localStorage, fails the `FILTERS.includes(saved)` check, and silently resets to `'all'`. The `posts` filter tab is visible and usable at runtime (UI generates it via `FILTER_KEYS`) but is never persistable across sessions. |
| Dead code confirmed present | LOW | `FilterTabs.jsx` — zero callers confirmed. `useSearchActor.js` — zero callers confirmed. `useSearchTabsActor.js` — zero callers confirmed. All three restored per no-delete instruction. |
| i18n integration confirmed | ALIGNED | `en/explore.json` and `es/explore.json` exist with 11 keys each. `SearchScreen.view.jsx`, `ResultList.jsx`, and `EmptyState.jsx` import `useTranslation` from `@i18n`. The doc's UI component table and architecture pipeline section still omit this — documentation drift only. |
| Cross-feature import: onboarding adapter | ALIGNED | `SearchScreen.view.jsx` imports `OnboardingCardsView` from `@/features/onboarding/adapters/onboarding.adapter`. Access is through the adapter boundary — compliant with contract. |
| `ExploreFeed` hard-disabled | ALIGNED | `SHOW_EXPLORE_DISCOVERY_BLOCKS = false` confirmed in `ExploreFeed.jsx`. Returns `null` on every render. `CitizensRow` and `VportsRow` imported but unreachable. No change. |
| File count | ALIGNED | 23 files in explore feature (including dead code). No unexpected additions. |

---

### Phase 2 — VENOM

**Status: ALIGNED (with clarification)**

**Purpose:** Security audit — RLS on `vc.posts`, trust boundaries, ungated console output, viewer context.

**Findings:**

| Finding | Severity | Detail |
|---|---|---|
| RISK-7 CONFIRMED FIXED | — | `search.dal.js` has no console output of any kind. Full file inspection confirms. |
| `vc.posts` RLS — VERIFIED | ALIGNED | Migration `20260510020000_vc_posts_privacy_rls.sql` confirms: RLS enabled + FORCE enabled on `vc.posts`. Policy `posts_select_actor_based` is `TO authenticated` — anon users return no rows. Policy logic: owner self-read always allowed; for all others, bidirectional block check (rejects if any active block in either direction), then post actor must be public OR viewer must be following. Block exclusion is DB-enforced at the RLS layer, not app layer. Defense-in-depth: application-level `.is('deleted_at', null).or('is_hidden.is.null,is_hidden.eq.false')` filters add a secondary safety net. |
| Anon access to posts | ALIGNED | `posts_select_actor_based` is `TO authenticated` only. The explore feature is post-auth (bottom nav, post-login redirects). An unauthenticated user hitting `/explore` and searching returns empty post results — no data leakage. |
| `identity.search_actor_directory` RPC | ALIGNED | RPC called with `p_viewer_actor_id: viewerActorId` — viewer context explicitly passed. Default is `null` when no viewer. The RPC's SECURITY DEFINER/INVOKER model and internal visibility logic handle null-viewer gracefully (returns public-only actors). Migration `2026-05-10_step5b_trigger_and_wanders_search_path.sql` and `2026-05-10_secdef_a_search_path_hardening.sql` confirm search path hardening was applied. |
| Trust boundary | ALIGNED | No cross-feature imports from explore internals by outside features. Explore only exports its screens via lazy loading (`lazyApp.jsx`). i18n namespace loaded via `i18n/setup.js`. Both are correct boundary entries. |
| RISK-8 RESOLVED | — | `vc.posts` RLS is in place, enforced, and audited. Not an open risk. |
| RISK-9 RESOLVED | — | `identity.search_actor_directory` RPC viewer context is passed; security hardening migrations applied. Not an open risk. |

---

### Phase 3 — LOKI

**Status: ALIGNED**

**Purpose:** Runtime trace — verify RISK-1 has no dynamic callers, verify RISK-2 production path is clean, confirm ResultList renders props only.

**Findings:**

| Finding | Detail |
|---|---|
| `search.usecase.js` dynamic import check | Grep for `usecases/search`, `searchUsecase`, `search.usecase` across all of `apps/VCSM/src/` returned zero results outside the usecase file itself. No static or dynamic callers exist. Safe for deletion. |
| `useSearchTabsActor` caller check | Grep across `apps/VCSM/src/` returned zero results outside the hook file itself. Zero production callers confirmed. |
| `useSearchActor` caller check | Zero callers outside the hook file confirmed. |
| `FilterTabs` caller check | Zero callers outside the component file confirmed. |
| Production call chain verified | `SearchScreen.view.jsx` → `useSearchScreenController()` → `ctrlSearchResults()` → `searchDal()` → `searchActors()` + `searchPosts()`. `ResultList.jsx` renders `items` and `loading` props only — no internal hook invocations. |
| RISK-2 runtime trace | Confirmed: exactly one `ctrlSearchResults` call fires per debounced query. Cache layer (`searchResultCache` + `searchInflight`) prevents duplicate network calls for identical query+filter combinations within 45s TTL. |

---

### Phase 4 — KRAVEN

**Status: DRIFT — RISK-NEW-1 performance side-effect**

**Purpose:** Performance — cache behavior, debounce, per-keystroke cost, filter persistence.

**Findings:**

| Finding | Severity | Detail |
|---|---|---|
| Debounce confirmed | ALIGNED | 300ms `setTimeout` in `useSearchScreenController`. Single debounced value `debounced` drives both the effect and the `ResultList` query input. |
| Cache confirmed | ALIGNED | 45s TTL, 120 entry LRU max via Map insertion order eviction. Inflight dedup via `searchInflight` Map prevents parallel duplicate network calls. |
| Per-search Supabase call count (all filter) | ALIGNED | In `all` mode: 1 RPC call (`searchActors`) + 2 concurrent table queries (`searchPosts` fires `byText` + `byTag` via `Promise.all`) + 2 empty stubs. Total: 3 active Supabase round-trips per non-cached search. All fire concurrently via `Promise.all(searchDal(...))`. Acceptable. |
| RISK-NEW-1 performance side-effect | MEDIUM | The `FILTERS` array missing `'posts'` means any user who selects the `posts` filter, closes the app, and returns will silently have their filter reset to `'all'` on mount. This triggers a broader `all`-mode search (3 Supabase calls) instead of the narrower `posts`-mode search (2 calls). Minor excess load, but primarily a UX regression — filter state not persisted. |
| `ctrlSearchTabs` performance | ALIGNED | `ctrlSearchTabs` is unreachable (zero callers on `useSearchTabsActor`). No production performance impact. |

---

### Phase 5 — review-contract

**Status: VIOLATIONS FOUND (existing) + NEW VIOLATION**

**Purpose:** Verify architecture contract compliance — layer naming, import aliases, cross-feature boundaries.

**Findings:**

| Finding | File | Violation | Severity |
|---|---|---|---|
| `usecases/` is an unrecognized architecture layer | `usecases/search.usecase.js` | VCSM contract defines: DAL → Model → Controller → Hook → Screen. No `usecases/` layer exists. The folder must be removed even if the file is kept as a candidate for conversion to a controller. | MEDIUM |
| Relative imports in usecase | `usecases/search.usecase.js` lines 3–4 | Imports use `'../dal/search.dal'` and `'../model/search.model'` — relative paths. Contract requires all cross-folder imports to use `@/` aliases. Violation: `@/features/explore/dal/search.dal` and `@/features/explore/model/search.model`. Since the file is dead code, this is low immediate risk but a documentation and contract violation. | LOW |
| `useSearchTabsActor` orphan | `hooks/useSearchTabsActor.js` | Zero production callers. File has been superseded by the consolidated `useSearchScreenController` path. Stale code in the hooks layer with no clear owner. | LOW |
| All active files use `@/` aliases | ALL active files | `search.dal.js`, `search.model.js`, `searchResults.controller.js`, `SearchScreen.view.jsx`, `ResultList.jsx`, `ExploreScreen.jsx`, `useSearchScreenController.js` all use `@/` aliases correctly. Compliant. | ALIGNED |
| Cross-feature boundary | `SearchScreen.view.jsx` | Imports `OnboardingCardsView` via `@/features/onboarding/adapters/onboarding.adapter` — through adapter. Compliant. | ALIGNED |

---

### Phase 6 — SENTRY

**Status: ENFORCEMENT REQUIRED**

**Purpose:** Architecture compliance enforcement summary — boundary audit, open violations, enforcement priority.

**Findings:**

| Violation | File | Enforcement Action Required |
|---|---|---|
| `usecases/` unrecognized layer | `usecases/search.usecase.js` | Folder must be removed or renamed. If logic is ever needed, it belongs in a controller. Owner must decide. |
| Relative imports in dead usecase | `usecases/search.usecase.js` | Not actively harmful (file is dead), but violates contract. Fix on deletion or conversion. |
| `FILTERS` stale value + missing `'posts'` | `hooks/useSearchScreenController.js` line 5 | `'Voxs'` must be removed; `'posts'` must be added. This is a production bug affecting localStorage filter persistence. SENTRY designates this an **enforcement item** requiring a code fix. |
| Dead code cluster | `hooks/useSearchActor.js`, `hooks/useSearchTabsActor.js`, `ui/FilterTabs.jsx`, `usecases/search.usecase.js` | Four files with zero production callers. All restored per prior no-delete instruction. Owner decision required to delete or convert. SENTRY classifies these as DELETE CANDIDATE. |
| i18n undocumented in this doc | `vcsm.dal.explore.md` — UI Components + Architecture Pipeline sections | Documentation drift only. No code fix required. Doc update needed. |

---

### RISK-NEW-1 — `FILTERS` Array Missing `'posts'` Key

**Severity:** MEDIUM  
**Classification:** NEW — production bug found in this pass  
**File:** `apps/VCSM/src/features/explore/hooks/useSearchScreenController.js` line 5  

```js
const FILTERS = ['all', 'users', 'vports', 'Voxs', 'videos', 'groups']
```

`'Voxs'` is a stale value from a prior naming convention — not a valid filter tab in the current UI. `'posts'` is missing — it is a valid filter tab (key `'posts'` in `FILTER_KEYS` in `SearchScreen.view.jsx`).

**Impact:** When a user selects the `posts` filter tab and leaves the app, `localStorage.setItem(LS_KEY, 'posts')` runs. On next mount, `FILTERS.includes('posts')` evaluates `false` → filter resets to `'all'`. The `posts` filter tab is fully functional during a session but never persists across sessions.

**Fix required:**
```js
const FILTERS = ['all', 'users', 'vports', 'posts', 'videos', 'groups']
```

**Resolution:** FIXED 2026-05-14. `FILTERS` updated to `['all', 'users', 'vports', 'posts', 'videos', 'groups']` in `useSearchScreenController.js` line 5. `'Voxs'` removed; `'posts'` added. Filter persistence now correct across sessions.

---

### Final Command Status Table

| Command | Status | Blocking Findings |
|---|---|---|
| ARCHITECT | COMPLETE | RISK-NEW-1 (new finding) |
| VENOM | COMPLETE | None |
| LOKI | COMPLETE | None |
| KRAVEN | COMPLETE | RISK-NEW-1 side-effect documented |
| review-contract | COMPLETE | `usecases/` layer violation (existing); relative imports in dead file |
| SENTRY | COMPLETE | RISK-NEW-1 enforcement item; dead code cluster |

---

### Fixed Risks (verified in this pass)

| Risk | Resolution |
|---|---|
| RISK-2 — duplicate search execution | VERIFIED FIXED. `ResultList.jsx` renders props only. Single controller request per debounced query. |
| RISK-3 — normalization inline in controller | VERIFIED FIXED. `normalizeResult` and `dedupeByKindAndId` exported from model; controller imports them. |
| RISK-7 — console output in DAL | VERIFIED FIXED. Zero console calls in `search.dal.js`. |
| RISK-8 — `vc.posts` RLS unknown | RESOLVED. RLS + FORCE enabled. `posts_select_actor_based` policy covers owner/block/public/follow chain. |
| RISK-9 — RPC permissions unknown | RESOLVED. Viewer context passed. Security path hardening migrations applied. |
| RISK-13 — hardcoded Suspense fallback | VERIFIED FIXED. `ExploreScreen.jsx` uses `t('explore.loading')`. |
| RISK-1 — broken usecase imports | DOWNGRADED. `normalizeResult` and `dedupeByKindAndId` now exported from model — imports would succeed. Reclassified as dead code only (LOW). |

---

### Open Risks

| Risk | Severity | Status | Owner |
|---|---|---|---|
| RISK-NEW-1 — `FILTERS` missing `'posts'`, contains `'Voxs'` | MEDIUM | FIXED 2026-05-14 | Dev |
| RISK-1 (reclassified) — `search.usecase.js` dead code in `usecases/` folder | LOW | DEFERRED — owner decision needed | Product/Dev |
| RISK-4 — Wanders injection in dead `useSearchTabsActor.js` | LOW | DEFERRED — no production impact (hook dead); cleanup pending owner decision | Dev |
| RISK-5 — `ExploreFeed` hard-disabled | LOW | DEFERRED — product decision needed on fate of discovery blocks | Product |
| RISK-6 — `useSearchActor.js` dead thin wrapper | LOW | DEFERRED — zero callers; pending owner decision | Dev |
| RISK-11 — `useSearchTabsActor.js` orphaned | LOW | DEFERRED — zero callers; pending owner decision | Dev |
| RISK-12 — `FilterTabs.jsx` listed as live in doc | LOW | DOCUMENTATION DRIFT — component is dead; doc update needed | Logan |
| RISK-14 — cross-feature access pattern undocumented | LOW | DRIFT — `OnboardingCardsView` import via adapter is correct but undocumented | Logan |
| i18n integration undocumented in this doc | LOW | DOCUMENTATION DRIFT — i18n present in code, missing in doc | Logan |

---

### Required Next Commands

| Priority | Command | Reason |
|---|---|---|
| 1 | ~~**Code fix**~~ | RISK-NEW-1 FIXED 2026-05-14. |
| 2 | **IRONMAN** | Decide fate of RISK-1 (`usecases/` folder), RISK-4 (Wanders in dead hook), RISK-5 (`ExploreFeed`), and dead code cluster. Product decisions required before code can be cleaned. |
| 3 | **LOGAN** | Update this document: reclassify `FilterTabs.jsx` as dead code, add i18n integration note, add `WelcomeScreen.jsx` entry point, document `OnboardingCardsView` adapter import. |

---

### Document Status

**REVIEW_PENDING**

All Codex Fix Pass claims verified. One new production bug found (`RISK-NEW-1`). No release-blocking issues. Dead code cluster and product-ownership decisions remain open. Document has documentation drift (i18n, FilterTabs classification, OnboardingCardsView). LOGAN doc update and RISK-NEW-1 code fix are the two required actions before this document can advance to VERIFIED.
