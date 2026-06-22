# BLIND_REVERIFY_MODE — explore
Date: 2026-06-05
Trigger: User-requested re-verify
Protocol: BLIND_REVERIFY_MODE — contracts loaded first, source read before any report, reports compared after independent chain reconstruction
Mode: Full source read → independent reconstruction → compare against docs

---

## Scope

Target docs: ZZnotforproduction/APPS/VCSM/features/explore/
Source read: apps/VCSM/src/features/explore/ (all 22 files)

Files read independently (before any report):
- dal/search.dal.js
- model/search.model.js
- controller/searchResults.controller.js
- controller/searchTabs.controller.js
- usecases/search.usecase.js
- hooks/useSearchScreenController.js
- hooks/useSearchActor.js
- hooks/useSearchTabsActor.js
- ui/PostCard.jsx
- ui/ActorSearchResultRow.jsx
- ui/FeaturedResultCard.jsx
- ui/ExploreFeed.jsx
- ui/FilterTabs.jsx
- ui/index.jsx (barrel)
- ui/SearchScreen.view.jsx
- ui/ResultList.jsx
- screens/ExploreScreen.jsx

---

## SECTION 1 — PATCH VERIFICATION (P0 Security Sprint)

All 5 patched items confirmed in live source. Status: CONFIRMED_SOURCE_VERIFIED.

### ELEK-001 / VEN-002 — viewerActorId injection
**CONFIRMED ✓**
- hooks/useSearchScreenController.js: `const identity = useIdentity()` at line 73; `const actorId = identity?.actorId ?? null` at line 74
- ctrlSearchResults called with `viewerActorId: actorId` at line 112
- Cache key: `getSearchCacheKey` builds `${actorId ?? 'anon'}:${filter}:${query}` at line 15-16
- ELEK-003/VEN-004 (cache actor scoping) resolved as side effect — CONFIRMED ✓

### ELEK-002 / VEN-003 (post) — PostCard UUID removed
**CONFIRMED ✓**
- ui/PostCard.jsx line 13: `onClick={post.slug ? () => navigate(`/posts/${post.slug}`) : undefined}`
- No raw `post.id` in navigation URL — CONFIRMED

### ELEK-002 / VEN-003 (actor) — ActorSearchResultRow UUID fallback removed
**CONFIRMED ✓**
- model/search.model.js line 99: `if (!row.username) return null` — actors without username filtered at model layer
- ui/ActorSearchResultRow.jsx line 22: `onClick={() => actor.username && navigate(`/profile/${actor.username}`)}`
- No `actor_id` fallback — CONFIRMED

### ELEK-005 / VEN-006 — FeaturedResultCard UUID fallback removed
**CONFIRMED ✓**
- ui/FeaturedResultCard.jsx line 13: `onClick={() => item.username && navigate(`/profile/${item.username}`)}`
- No UUID fallback — CONFIRMED
- Actor guard at line 9: `if (item.result_type === 'actor' && item.actor_id)` — requires actor_id but navigates by username only

---

## SECTION 2 — OPEN FINDING VERIFICATION

### ELEK-006 / VEN-007 — /explore route access conflict
**STILL OPEN — CONFIRMED**
- ui/index.jsx line 6: `{ path: '/explore', element: <ExploreScreen />, public: false }` — barrel marks `public: false`
- ARCHITECTURE.md flags scanner classifies route as public — conflict still present
- HAWKEYE verification still required

### ELEK-007 — vc.posts RLS private actor post coverage
**STILL OPEN — CONFIRMED**
- searchPosts and searchPostsByTag apply app-layer filters: `deleted_at IS NULL` and `is_hidden IS NULL OR is_hidden = false`
- No viewer actor filter on posts queries (only actor searches are viewer-scoped via RPC)
- DB-side RLS verification still required for private actor post coverage

### ELEK-004 / VEN-005 — Legacy userId/ownerUserId in model output
**STILL OPEN — CONFIRMED**
- model/search.model.js line 30-31: `mapActorSearchResult` returns `userId: row.user_id ?? null`
- model/search.model.js line 48: `mapVportSearchResult` returns `ownerUserId: row.owner_user_id ?? null`
- Note: these functions are not in the active code path (see Section 3 below)

---

## SECTION 3 — CORRECTIONS TO ARCHITECTURE.MD (V2 PRE-PATCH)

The ARCHITECTURE.md is confirmed STALE (pre-patch state). Beyond staleness, several factual claims are incorrect regardless of patch timing.

### CORRECTION-1: ARCHITECTURE.md high — Raw UUID in PostCard navigation
**Claim:** "PostCard navigates to `/posts/${post.id}` using raw DB UUID"
**Actual:** PostCard navigates via `post.slug` with no UUID exposure. Pre-patch and post-patch, the code always used the slug field — `post.id` was never the navigation expression. The finding was a misread of the pre-patch code. ARCHITECTURE.md finding is INCORRECT.
**Evidence:** ui/PostCard.jsx line 13

### CORRECTION-2: ARCHITECTURE.md high — ActorSearchResultRow UUID fallback
**Claim:** "`navigate('/profile/${actor.username ?? actor.actor_id}')` falls back to raw UUID"
**Actual:** Pre-patch code had this fallback; post-patch it does not. The ARCHITECTURE.md finding was VALID for the pre-patch state but is now resolved. ARCHITECTURE.md is STALE on this point.
**Evidence:** ui/ActorSearchResultRow.jsx line 22

### CORRECTION-3: vc.posts schema qualifier
**Claim (ARCHITECTURE.md):** "Direct posts read without explicit column schema qualifier may be policy-inconsistent"
**Actual:** INCORRECT. Both searchPosts (line 56-57) and searchPostsByTag (line 94-95) use `.schema('vc').from('posts')`. Schema qualifier IS present.
**Evidence:** dal/search.dal.js lines 56-57, 94-95

### CORRECTION-4: 'videos' filter tab in active UI
**Claim (ARCHITECTURE.md):** "videos and groups filter stubs render as active options leading to confusing UX"
**Actual:** PARTIALLY INCORRECT. 'videos' is NOT in the active filter tab list. SearchScreen.view.jsx FILTER_KEYS defines only 5 tabs: `['all', 'users', 'vports', 'posts', 'groups']`. The 'videos' filter exists in the DAL but has no corresponding UI tab. Only 'groups' (rendered as "Districts" via i18n) is an active stub tab.
**Evidence:** ui/SearchScreen.view.jsx lines 10-16

### CORRECTION-5: Hook count
**Claim (ARCHITECTURE.md):** "9 hooks (including shims)"
**Actual:** 3 hook files: useSearchScreenController.js, useSearchActor.js (shim), useSearchTabsActor.js. The "9" count likely conflates the 6 cache helper functions inside useSearchScreenController with hook count. Only 3 exported hook functions exist.

---

## SECTION 4 — NEW FINDINGS (not in any existing doc)

### NEW-001 — PostCard post navigation is BROKEN (MEDIUM)
**Source:** dal/search.dal.js searchPosts SELECT list (line 59): `'id, actor_id, text, title, tags, created_at'`
**Finding:** `slug` is NOT selected from vc.posts. PostCard navigates via `post.slug` — but since slug is never populated by the DAL, `post.slug` is always `undefined`. The `onClick` handler is always `undefined`. Post cards render as visually interactive buttons but are never clickable. Post navigation is silently broken.
**Severity:** MEDIUM — functional regression; post cards are a dead click surface post-patch.
**Impact:** Every post card rendered by ResultList is non-navigable. Users see post results but cannot navigate to them.
**Fix needed:** Add `slug` to SELECT list in searchPosts and searchPostsByTag. Also add to normalizeResult/post mapping.

### NEW-002 — mapActorSearchResult and mapVportSearchResult are DEAD CODE (LOW)
**Source:** model/search.model.js lines 19-50; no import found in any active code path
**Finding:** `mapActorSearchResult` and `mapVportSearchResult` are defined and exported but never called in the active code path. The active path uses `normalizeActorRow` (for DAL-to-controller) and `normalizeResult` (for controller-to-view). `mapActorSearchResult`/`mapVportSearchResult` are only referenced by the `mapSearchResult` dispatcher, which is itself also dead code.
**Severity:** LOW — dead code; does not affect behavior but creates confusion (ELEK-004/VEN-005 finding about legacy fields in these functions is a LOW-priority dead code cleanup, not an active exposure)

### NEW-003 — normalizeResult has dead type handlers (INFO)
**Source:** model/search.model.js lines 161-212
**Finding:** `normalizeResult` handles types 'comment', 'message', 'conversation' — none of which are produced by any active DAL path. Only 'actor', 'feature', 'vport', 'post' are live types. 'comment', 'message', 'conversation' branches are dead.

### NEW-004 — useSearchTabsActor path returns un-normalized rows (INFO)
**Source:** controller/searchTabs.controller.js lines 3-13; hooks/useSearchTabsActor.js
**Finding:** `ctrlSearchTabs` returns flat raw DAL results without calling `normalizeResult`. `useSearchTabsActor` adds an actor_id guard but does not fully normalize. This secondary hook is not currently consumed by any view component (SearchScreen.view.jsx uses `useSearchScreenController` only). If this path is ever activated in a view, it will expose differently shaped objects than the primary path.

### NEW-005 — Wanders feature injection duplicated across two paths (INFO)
**Source:** controller/searchResults.controller.js lines 30-52 (buildFeatureResults); hooks/useSearchTabsActor.js lines 62-78
**Finding:** Both the active path (ctrlSearchResults → buildFeatureResults) and the inactive path (useSearchTabsActor) independently implement Wanders feature injection. BEHAVIOR.md §3 BEH-EXPLORE-005 only documents the ctrlSearchResults path. The useSearchTabsActor path does not match the single-character 'w' trigger that ctrlSearchResults uses — it requires the full substring 'wander' or starts-with '@wander'. Minor behavioral inconsistency between the two paths.

### NEW-006 — BEHAVIOR.md §5 and §9 "current state" notes are stale (DOCS-DRIFT)
**Source:** BEHAVIOR.md §5 SEC-EXPLORE-005 and §9 NEVER-EXPLORE-001
**Finding:**
- SEC-EXPLORE-005 says "Current state: Cache is keyed by `filter:query` only — no actorId scoping" — INCORRECT post-patch; cache is now scoped to actorId.
- NEVER-EXPLORE-001 says "Current state: VIOLATED — both ActorSearchResultRow and FeaturedResultCard use `actor.username ?? actor.actor_id`" — INCORRECT post-patch; both components use username-only guard with no UUID fallback.
- NEVER-EXPLORE-002 says "Current state: VIOLATED — PostCard navigates to `/posts/${post.id}`" — INCORRECT; PostCard uses slug, never post.id.
**Severity:** DOCS-DRIFT — security sections should reflect current (patched) state with note that patch was applied.

---

## SECTION 5 — DOCS STATUS SUMMARY

| Document | Status | Assessment |
|---|---|---|
| ARCHITECTURE.md | STALE (pre-patch) | Requires V3 re-run; 3 factual corrections needed (schema qualifier, PostCard claim, videos filter tab count) |
| BEHAVIOR.md | DRAFT — engineering review pending | Mostly accurate post-patch; §5 SEC-005 + §9 NEVER-001/002 "current state" language is stale — needs update to reflect patched state; §12 Known Gaps list needs promotion of VEN-002/003/004/006 to CLOSED |
| SECURITY.md | ACCURATE — governance state correct | Correctly reflects PARTIAL_SOURCE_VERIFIED for patched items; correctly shows ELEKTRA V3 pending; accurately documents open items |

---

## SECTION 6 — THOR GATE IMPACT

Pre-patch THOR blockers (VEN-002, VEN-003, VEN-006):
- **CONFIRMED PATCHED in live source** — all 3 blocking patterns removed
- THOR blocker count from live source: **0 HIGH open** (per patched source)
- Remaining: 2 MEDIUM open (ELEK-006 route conflict + ELEK-007 RLS) — CAUTION classification per SECURITY.md is CONFIRMED CORRECT

NEW blocker candidate: NEW-001 (PostCard navigation silently broken) — MEDIUM severity. Post cards render but are never navigable due to missing `slug` in DAL SELECT. Does not expose UUIDs; functional regression only. THOR CAUTION classification stands.

---

## SECTION 7 — REQUIRED ACTIONS

| Priority | Action | Owner |
|---|---|---|
| P1 | Add `slug` to searchPosts + searchPostsByTag SELECT; add to normalizeResult post mapping | WOLVERINE/ENG |
| P2 | ARCHITECT V3 re-run (SECURITY.md requires for CLOSED_SOURCE_VERIFIED promotion) | ARCHITECT |
| P3 | Update BEHAVIOR.md §5 SEC-005 + §9 NEVER-001/002/003 "current state" language to reflect patched state | LOGAN |
| P3 | Update BEHAVIOR.md §12 Known Gaps — promote VEN-002/003/004/006 to CLOSED | LOGAN |
| P4 | HAWKEYE verification of /explore route auth boundary | HAWKEYE |
| P4 | DB verify vc.posts RLS private actor post coverage | DB |
| LOW | Delete FilterTabs.jsx (dead code) | IRONMAN |
| LOW | Delete dead model functions (mapActorSearchResult, mapVportSearchResult, mapSearchResult, dead normalizeResult branches) | IRONMAN |

---

## VERIFICATION MATRIX

| Claim | Source | Verdict |
|---|---|---|
| viewerActorId injected via useIdentity() | useSearchScreenController.js:73-74 | CONFIRMED |
| Cache key includes actorId prefix | useSearchScreenController.js:15 | CONFIRMED |
| PostCard navigates by slug, not UUID | PostCard.jsx:13 | CONFIRMED |
| normalizeActorRow filters null-username actors | search.model.js:99 | CONFIRMED |
| ActorSearchResultRow: no UUID fallback | ActorSearchResultRow.jsx:22 | CONFIRMED |
| FeaturedResultCard: no UUID fallback | FeaturedResultCard.jsx:13 | CONFIRMED |
| ExploreFeed: SHOW_EXPLORE_DISCOVERY_BLOCKS = false | ExploreFeed.jsx:4 | CONFIRMED |
| FilterTabs.jsx not imported anywhere | grep across src/ | CONFIRMED DEAD |
| 45s TTL cache in useSearchScreenController | useSearchScreenController.js:8 | CONFIRMED |
| searchInflight dedup Map | useSearchScreenController.js:12 | CONFIRMED |
| localStorage key 'search:lastFilter' | useSearchScreenController.js:7 | CONFIRMED |
| barrel imports @/features/explore/screen/ExploreScreen | ui/index.jsx:1 | CONFIRMED (path typo) |
| vc.posts schema qualifier present | search.dal.js:57, 95 | CONFIRMED (CORRECTION to ARCH) |
| 'videos' tab NOT in active filter UI | SearchScreen.view.jsx:10-16 | CONFIRMED (CORRECTION to ARCH) |
| PostCard post.slug never populated by DAL | search.dal.js:59 | CONFIRMED — NEW finding |
| mapActorSearchResult not in active path | grep across controllers | CONFIRMED DEAD CODE |
| usecases/ uses relative import | search.usecase.js:3 | CONFIRMED violation |
| searchUsecase uses Promise.allSettled (not Promise.all) | search.usecase.js:9 | CONFIRMED |
| ctrlSearchTabs returns un-normalized rows | searchTabs.controller.js:11-12 | CONFIRMED |
