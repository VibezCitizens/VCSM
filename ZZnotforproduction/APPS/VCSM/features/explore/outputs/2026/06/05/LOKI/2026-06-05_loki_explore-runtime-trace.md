# LOKI RUNTIME REPORT

**Application Scope:** VCSM:explore
**Observed flow:** /explore → ExploreScreen → SearchScreen.view → useSearchScreenController → ctrlSearchResults → searchDal → identity RPC + vc.posts
**Entry point:** ui/index.jsx → /explore route → ExploreScreen.jsx
**Environment:** Source analysis (INFERRED — no live runtime instrumentation)
**TypeScript output allowed:** NO

---

## ARCHITECT Gate

```
LOKI ARCHITECT GATE PASS

Upstream Report:
- ARCHITECT: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/ARCHITECT/evidence-bundle.md
  Scope: VCSM:explore
  Date: 2026-06-05
  Status: SUCCESS
  Age: 0 days
```

---

## LOKI TARGET

```
LOKI TARGET
Observed flow:      Explore search — query entry → debounce → controller → DAL → DB → results render
Application Scope:  VCSM
Entry point:        /explore → ExploreScreen → SearchScreen.view → useSearchScreenController
Reason:             Runtime observability audit — WANDA gate prerequisite
ARCHITECT feature-map loaded: ZZnotforproduction/APPS/VCSM/features/explore/ARCHITECTURE.md | 2026-06-05
ARCHITECT database-read-map loaded: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/ARCHITECT/evidence-bundle.md (DAL section) | 2026-06-05
TypeScript output allowed: NO
```

### ARCHITECT Artifact Completeness Check

| Artifact | Required Content | Status | Result |
|---|---|---|---|
| `feature-map.md` (ARCHITECTURE.md) | Module and layer inventory | COMPLETE — 6 layers, 22 files mapped | PASS |
| `database-read-map.md` (evidence-bundle + security surface) | DAL methods and read patterns | COMPLETE — 6 DAL functions, 2 DB surfaces documented | PASS |

---

## TRACE IDENTITY

```
TRACE IDENTITY
Trace ID:           LOKI-EXPLORE-2026-06-05-001
Route:              /explore
Screen:             ExploreScreen → SearchScreen.view
Entry point:        ui/index.jsx route barrel
Session state class: anonymous (null viewerActorId) and authenticated Citizen (non-null actorId)
Environment:        source (INFERRED)
Timestamp:          2026-06-05
```

---

## RUNTIME SUMMARY

```
RUNTIME SUMMARY
Total duration:             INFERRED ~400–900ms (300ms debounce + RPC latency + posts SELECT)
Primary records returned:   0–25 actors + 0–25 posts (filter-dependent)
Total DB reads (all filter): 3 (1 RPC + 2 SELECT via Promise.all)
Total DB reads (posts filter): 2 SELECT (ilike + contains)
Total DB reads (hashtag):   1 SELECT (contains)
Read Amplification Score:   3 reads / N results (HEALTHY — reads are constant, not per-result)
Worst bottleneck:           vc.posts ilike full table scan on short queries (filter='posts' or 'all')
Cache behavior summary:     45s in-memory LRU active on primary path; ABSENT on secondary path (useSearchTabsActor)
```

---

## EXECUTION FLOW MAP

**Primary Path (useSearchScreenController — ACTIVE)**

| Step | Operation | Caller | Mode | Notes |
|---|---|---|---|---|
| 1 | Route mount | ui/index.jsx:6 | — | /explore → ExploreScreen |
| 2 | i18n hook | ExploreScreen.jsx:8 | — | useTranslation |
| 3 | CSS import | ExploreScreen.jsx:3–4 | — | module-modern.css, explore-modern.css |
| 4 | Suspense + SearchScreen | ExploreScreen.jsx:16 | — | |
| 5 | useSearchScreenController init | useSearchScreenController.js:61 | SYNC | Filter read from localStorage |
| 6 | useIdentity() | useSearchScreenController.js:73 | SYNC | actorId resolved from platform |
| 7 | Keypress → setQuery | SearchScreen.view.jsx:43 | EVENT | |
| 8 | Debounce 300ms | useSearchScreenController.js:77 | TIMER | setDebounced after 300ms |
| 9 | Cache key build | useSearchScreenController.js:97 | SYNC | `${actorId}:${filter}:${query}` |
| 10 | Cache read | useSearchScreenController.js:99 | SYNC | readSearchCache → HIT or MISS |
| 11 | [HIT] → setResults | useSearchScreenController.js:103 | SYNC | skips steps 12–19 |
| 12 | [MISS] setLoading=true | useSearchScreenController.js:107 | — | |
| 13 | loadSearchCached | useSearchScreenController.js:111 | ASYNC | inflight dedup check |
| 14 | ctrlSearchResults | searchResults.controller.js:5 | ASYNC | |
| 15 | searchDal (filter='all') | search.dal.js:119 | PARALLEL | returns [searchActors, searchPosts, [], []] |
| 16a | searchActors | search.dal.js:9 | PARALLEL | identity.search_actor_directory RPC |
| 16b | searchPosts | search.dal.js:46 | PARALLEL | vc.posts byText + byTag (Promise.all internally) |
| 17 | Promise.all resolves | searchResults.controller.js:9 | PARALLEL | all 4 slots settled |
| 18 | hydrateActorsByIds | searchResults.controller.js:17 | FIRE_FORGET | .catch(() => {}) |
| 19 | normalizeResult (×N) | searchResults.controller.js:20–21 | SYNC | double normalization! |
| 20 | dedupeByKindAndId | searchResults.controller.js:27 | SYNC | |
| 21 | writeSearchCache | useSearchScreenController.js:31 | SYNC | 45s TTL |
| 22 | setResults | useSearchScreenController.js:113 | SYNC | re-render |
| 23 | ResultList renders | ResultList.jsx:9 | RENDER | actor/post split + FeaturedResultCard |

**Secondary Paths (NOT MOUNTED — runtime orphans)**

| Hook/Function | Called By | DB Operations | Status |
|---|---|---|---|
| `useSearchTabsActor` | NO IMPORT FOUND in active render tree | ctrlSearchTabs → searchDal → RPC + posts | ORPHANED |
| `ctrlSearchTabs` | `useSearchTabsActor` only | searchDal | ORPHANED |
| `searchUsecase` | NO CALL FOUND anywhere | searchDal | ORPHANED |

---

## DATABASE READ SUMMARY

| Table/View/RPC | Operation | Count (all filter) | Duplicate? | Notes |
|---|---|---:|---|---|
| `identity.search_actor_directory` | RPC | 1 | NO | viewerActorId from platform session |
| `vc.posts` (byText) | SELECT ilike | 1 | NO — different filter | parallel with byTag |
| `vc.posts` (byTag) | SELECT contains | 1 | NO — different filter | parallel with byText |
| Hydration engine | RPC/SELECT (batched) | 1 (FIRE_FORGET) | NO | result invisible to runtime |

**Per-filter read counts:**

| filter= | DB reads | Pattern |
|---|---|---|
| `all` | 3 (1 RPC + 2 SELECT) | PARALLEL |
| `users` | 1 (RPC) | SINGLE |
| `vports` | 1 (RPC) | SINGLE |
| `posts` | 2 SELECT | PARALLEL |
| `videos` | 0 | stub (returns []) |
| `groups` | 0 | stub (returns []) |
| `#hashtag` | 1 SELECT contains | SINGLE |

---

## DUPLICATE QUERY FINGERPRINTS

| Fingerprint | Count | Caller Chains | Impact |
|---|---:|---|---|
| `identity.search_actor_directory` per 300ms debounce | 1 per debounce cycle | useSearchScreenController → ctrlSearchResults → searchActors | NONE — cache prevents re-fire within 45s |
| `vc.posts ilike text + contains tags` | 2 per posts search | searchPosts → Promise.all([byText, byTag]) | BY DESIGN — two independent query strategies merged in memory |
| Duplicate normalization (actor rows) | N×2 per search | normalizeActorRow (DAL) → normalizeResult (controller) | DATA LOSS — second normalization strips actorKind, avatarUrl, bannerUrl, bio, rank |

No N+1 patterns found. All DB operations are batched. No per-result fetch loops.

---

## TIMING BUDGET STATUS

| Runtime Area | Observed (INFERRED) | Budget | Status |
|---|---:|---:|---|
| Route/screen load | ~50ms (layout only) | 1500ms | PASS |
| Controller orchestration | ~5ms (pure JS) | 300ms | PASS |
| DAL total | ~400–700ms (parallel RPC + SELECT) | 500ms | WARN (short-query ilike may exceed) |
| Single DB read — RPC | ~50–150ms | 150ms | PASS |
| Single DB read — ilike (long query) | ~50–200ms | 150ms | WARN (short query → full scan) |
| Debounce overhead | 300ms fixed | — | NOTE |
| Hydration/render | ~10ms (sync normalization) | 500ms | PASS |
| Fire-and-forget hydration | NOT MEASURED | — | INVISIBLE |

---

## CACHE OBSERVATIONS

| Cache | Caller | Status | Evidence | Impact |
|---|---|---|---|---|
| `searchResultCache` (in-memory LRU) | useSearchScreenController | PRESENT — PRIMARY PATH | useSearchScreenController.js:11, readSearchCache:18, writeSearchCache:30 | 45s TTL prevents repeated DB calls on same query |
| `searchInflight` (dedup map) | useSearchScreenController | PRESENT | useSearchScreenController.js:12, loadSearchCached:45–58 | Prevents concurrent identical requests |
| Cache on `useSearchTabsActor` path | ctrlSearchTabs | ABSENT | useSearchTabsActor.js has no cache integration | If activated, every filter/tab change fires full DB read |
| Cache eviction strategy | useSearchScreenController | INSERTION-ORDER (not true LRU) | writeSearchCache:36–39: deletes `searchResultCache.keys().next().value` — first inserted, not least-recently-used | Hot entries evicted before stale ones when cache is full (120 entries) |

---

## RENDER / HOOK CHURN

| Component/Hook | Render Count | Effect Count | Query Impact | Likely Trigger |
|---|---:|---:|---:|---|
| `useSearchScreenController` | 1 per state change | 3 effects (debounce, localStorage, search) | 0 extra queries (cache hit guard) | query/filter/actorId changes |
| `SearchScreen.view` | 1 per results change | 0 | 0 | results state update |
| `ResultList` | 1 per items change | 0 | 0 | pure render from props |
| `ExploreScreen` | 1 on mount | 0 | 0 | |
| `OnboardingCardsView` | Rendered only when NOT searching | unknown | unknown (cross-feature) | visible on idle state |

No render loop detected. No render-triggered DB reads.

---

## LOKI RUNTIME FINDINGS

---

### LOKI RUNTIME FINDING — LOKI-001

```
LOKI RUNTIME FINDING
- Finding ID:               LOKI-2026-06-05-001
- Location:                 controller/searchResults.controller.js:19–21 + model/search.model.js:97–119
- Application Scope:        VCSM:explore
- Runtime Risk Category:    Duplicate read (double normalization — data loss pattern)
- Evidence Type:            INFERRED
- Observation Source:       Source trace of ctrlSearchResults call chain
- Confidence:               HIGH

- Current runtime behavior:
  1. searchActors (dal/search.dal.js:32) calls normalizeActorRow(row) on each RPC result row
     Output shape: { resultType, result_type, actorDomain, actorId, actor_id, actorKind, displayName,
                     display_name, username, avatarUrl, photo_url, bannerUrl, bio, isPrivate, private, rank }
  2. ctrlSearchResults.js:20 then calls normalizeResult(item) on each normalizeActorRow output
     normalizeResult 'actor' case (model.js:157–165) maps: { result_type, actor_id, display_name, username, photo_url, private }
     All of these are DROPPED: actorDomain, actorKind/actorId (camelCase), avatarUrl, bannerUrl, bio, rank

- Runtime impact:           Actor results reaching ResultList/ActorSearchResultRow are missing:
                            actorKind (can't distinguish user vs vport)
                            bannerUrl (can't show banner in featured card)
                            bio (can't show bio in results)
                            rank (can't sort by relevance rank)
                            These fields are irreversibly lost before the UI renders.

- Read Amplification:       N/A (no extra reads — same data, two transforms)
- Timing impact:            Negligible (pure sync JS)
- Caller chain:             useSearchScreenController → ctrlSearchResults → [normalizeActorRow ×N] → [normalizeResult ×N]
- Cache status:             Data loss happens before cache write — cached results are already stripped
- Severity:                 HIGH
- Recommended handoff:      IRONMAN (consolidate normalization paths — one canonical transform)
- Rationale:                ARCHITECT flagged dual normalization paths. Source trace confirms data is lost in the second pass. ActorSearchResultRow uses actor.photo_url and actor.username — photo_url is preserved (snake_case alias in normalizeActorRow, then photo_url in normalizeResult). username is preserved. But actorKind, bannerUrl, bio, rank are silently dropped every search.
```

---

### LOKI RUNTIME FINDING — LOKI-002

```
LOKI RUNTIME FINDING
- Finding ID:               LOKI-2026-06-05-002
- Location:                 controller/searchResults.controller.js:17
- Application Scope:        VCSM:explore
- Runtime Risk Category:    Hydration bottleneck — silent failure
- Evidence Type:            INFERRED
- Observation Source:       Source trace of hydrateActorsByIds call
- Confidence:               HIGH

- Current runtime behavior:
  hydrateActorsByIds(actorIds).catch(() => {})
  Fire-and-forget: no await, no error surface, no Sentry capture.
  If hydration fails (network error, engine outage, invalid actorIds), the failure is completely invisible.

- Runtime impact:           Actor avatars and profile metadata may be stale or missing after hydration failure.
                            No retry. No user-visible signal. No operational alert.
                            Debugging a blank-avatar bug would require guessing hydration failed.

- Read Amplification:       1 hydration batch call per search (not per-result — GOOD; but invisible)
- Timing impact:            Non-blocking (fire-and-forget). Does not affect search latency.
- Caller chain:             useSearchScreenController → ctrlSearchResults:17 → hydrateActorsByIds().catch(() => {})
- Cache status:             Hydration engine has its own cache — cache bypass on failure is unobservable
- Severity:                 HIGH
- Recommended handoff:      LOKI → SENTRY (captureMonitoringError recommendation below)
- Rationale:                Hydration affects actor display quality. Silent failure means degraded UX with no ops signal.
```

---

### LOKI RUNTIME FINDING — LOKI-003

```
LOKI RUNTIME FINDING
- Finding ID:               LOKI-2026-06-05-003
- Location:                 hooks/useSearchScreenController.js:36–39
- Application Scope:        VCSM:explore
- Runtime Risk Category:    Cache bypass (premature eviction of hot entries)
- Evidence Type:            INFERRED
- Observation Source:       Source trace of writeSearchCache eviction logic
- Confidence:               HIGH

- Current runtime behavior:
  if (searchResultCache.size <= SEARCH_CACHE_MAX_ENTRIES) return  // 120 max
  const oldestKey = searchResultCache.keys().next().value         // first inserted key
  if (oldestKey) searchResultCache.delete(oldestKey)

  JavaScript Map iterates in insertion order. The first key is the OLDEST by insertion time, not the LEAST RECENTLY USED.
  An active user who searches for 'john' 100 times (fast-loading from cache each time) will eventually have 'john' 
  evicted when the 121st unique query is added — even though 'john' was just used moments ago.

- Runtime impact:           Users who repeatedly return to common searches (their own actor, a frequent contact)
                            experience cache misses and DB re-reads after 120 unique queries are cached in the session.
                            At 120 entries, the behavior degrades to insertion-order eviction rather than LRU.

- Read Amplification:       1 extra DB read per premature eviction (identity RPC + posts SELECT)
- Timing impact:            ~400–700ms latency per evicted search vs near-instant cache hit
- Caller chain:             writeSearchCache:30 → eviction:36–39
- Cache status:             Eviction policy is INSERTION_ORDER, not LRU
- Severity:                 MEDIUM
- Recommended handoff:      IRONMAN (fix eviction policy) or KRAVEN (performance audit)
- Rationale:                True LRU requires tracking access time, not just insertion order. The current eviction
                            is a simple FIFO. For 120 entries and typical user search behavior this is acceptable,
                            but it is documented as "LRU" and behaves differently.
```

---

### LOKI RUNTIME FINDING — LOKI-004

```
LOKI RUNTIME FINDING
- Finding ID:               LOKI-2026-06-05-004
- Location:                 hooks/useSearchScreenController.js (no caching), hooks/useSearchTabsActor.js (entire hook)
- Application Scope:        VCSM:explore
- Runtime Risk Category:    Duplicate read — secondary path bypasses cache
- Evidence Type:            INFERRED
- Observation Source:       Source trace of useSearchTabsActor + ctrlSearchTabs
- Confidence:               HIGH

- Current runtime behavior:
  Three controller-layer entry points exist for the same search DAL:
  A. ctrlSearchResults (via useSearchScreenController) → has 45s cache + inflight dedup — ACTIVE
  B. ctrlSearchTabs (via useSearchTabsActor) → NO cache, NO inflight dedup — ORPHANED
  C. searchUsecase → NO cache — NOT CALLED ANYWHERE

  If useSearchTabsActor were activated (e.g., imported by a future screen or tab component),
  it would fire a fresh Supabase RPC + posts SELECT on every query/filter change with no caching.
  ctrlSearchTabs and ctrlSearchResults would both run simultaneously, resulting in:
  - 2× DB reads for identical queries
  - No deduplication
  - Race conditions between the two result sets

- Runtime impact:           Currently ZERO (useSearchTabsActor is not mounted).
                            LATENT HIGH RISK if any future screen imports useSearchTabsActor without
                            connecting it to the existing cache infrastructure.

- Read Amplification:       2× reads if both paths activated simultaneously
- Timing impact:            Double latency at DB layer if both paths active
- Caller chain:             [not mounted] useSearchTabsActor → ctrlSearchTabs → searchDal (no cache)
- Cache status:             ABSENT on secondary path
- Severity:                 MEDIUM (latent — currently no runtime impact)
- Recommended handoff:      IRONMAN (consolidate to single controller path and delete orphaned hooks)
- Rationale:                Dead code with a cache bypass is a future incident waiting to happen.
                            ARCHITECT flagged usecase duplication. LOKI confirms cache gap on secondary path.
```

---

### LOKI RUNTIME FINDING — LOKI-005

```
LOKI RUNTIME FINDING
- Finding ID:               LOKI-2026-06-05-005
- Location:                 dal/search.dal.js:65–67, search.dal.js:100–101
- Application Scope:        VCSM:explore
- Runtime Risk Category:    Duplicate read (parallel vc.posts queries on 'posts' filter)
- Evidence Type:            INFERRED
- Observation Source:       Source trace of searchPosts function
- Confidence:               HIGH

- Current runtime behavior:
  searchPosts() always runs BOTH byText (ilike) AND byTag (contains) in parallel:
    const [byText, byTag] = await Promise.all([makeBase().ilike(...), makeBase().contains(...)])
  
  This is intentional for 'all' mode (a user might not know if they're searching text or tags).
  But for filter='posts' (explicit posts filter), both queries still run — even if the user typed a 
  non-hashtag term, the byTag query will always execute and return empty (no results match).
  
  For filter='posts' and query='hello':
  - byText: scans vc.posts text ilike '%hello%' → may return results
  - byTag: contains(['hello']) → almost certainly empty (tags are lowercase, system-controlled)
  The byTag query is wasted work for non-hashtag queries.

- Runtime impact:           1 extra vc.posts SELECT per non-hashtag 'posts' filter search.
                            At ~50–150ms per SELECT, this adds 50–150ms to posts-filtered searches unnecessarily.

- Read Amplification:       2 reads instead of 1 for non-hashtag posts searches
- Timing impact:            ~50–150ms overhead per search (parallel, so total time = max(byText, byTag))
                            If byTag is faster, overhead is minimal. If table is large, byTag still scans.
- Caller chain:             searchDal:filter='posts' → searchPosts → Promise.all([byText, byTag])
- Cache status:             Cached after both resolve — next identical search hits cache
- Severity:                 LOW (parallel execution masks the overhead; cached after first run)
- Recommended handoff:      KRAVEN (optimize posts search to skip byTag for non-hashtag queries)
- Rationale:                searchPostsByTag exists as a separate, single-query function for hashtag mode.
                            searchPosts could be optimized to run byTag only when query starts with '#'
                            (after stripping the '#' prefix). The current behavior always double-scans.
```

---

### LOKI RUNTIME FINDING — LOKI-006

```
LOKI RUNTIME FINDING
- Finding ID:               LOKI-2026-06-05-006
- Location:                 hooks/useSearchScreenController.js:87–130
- Application Scope:        VCSM:explore
- Runtime Risk Category:    Serial bottleneck — search fires on single-char queries
- Evidence Type:            INFERRED
- Observation Source:       Source trace of search effect trigger condition
- Confidence:               HIGH

- Current runtime behavior:
  The search fires when: debounced.length > 0 (any non-empty trimmed query)
  Minimum search trigger: 1 character after 300ms debounce
  
  Single-character queries against identity RPC and vc.posts ilike '%a%' are very expensive:
  - ilike '%a%' matches nearly all posts → large result set → high memory + network cost
  - identity RPC for 'a' matches many actors → large result set
  The 25-result limit caps the response size, but the DB still scans the full table.

- Runtime impact:           High DB scan cost on 1–2 character queries.
                            Users typing quickly (e.g., 'jo' for 'john') fire queries on 'j', then 'jo', then 'joh'.
                            Debounce reduces the rate but does not eliminate short queries.
                            The inflight dedup map prevents concurrent duplicates, but each new query character fires a new request.

- Read Amplification:       Not amplified by result count, but amplified by query selectivity (short = full scan)
- Timing impact:            ilike '%a%' may take 500ms+ on a large posts table (exceeds 500ms DAL budget)
- Caller chain:             useSearchScreenController:91 → if (!debounced) return [] else fire search
- Cache status:             Single-char queries ARE cached (45s TTL). Second search of 'a' hits cache.
- Severity:                 LOW (cache helps after first hit; debounce limits frequency)
- Recommended handoff:      KRAVEN (enforce minimum 3-char query before DAL call)
- Rationale:                Common practice is to require ≥2–3 characters before triggering search.
                            The platform should add a minimum query length guard in useSearchScreenController
                            or searchDal before firing network requests.
```

---

## HANDOFF MATRIX

| Finding | Recommended Handoff | Reason |
|---|---|---|
| LOKI-001 (double normalization + data loss) | IRONMAN | Consolidate normalizeActorRow + normalizeResult into single canonical transform |
| LOKI-002 (hydration silent failure) | SENTRY (see recommendation below) | Add captureMonitoringError to hydration catch |
| LOKI-003 (FIFO cache eviction) | IRONMAN | Fix writeSearchCache eviction to use Map delete-and-reinsert for true LRU |
| LOKI-004 (orphaned secondary path — cache bypass) | IRONMAN | Delete useSearchTabsActor + ctrlSearchTabs + searchUsecase |
| LOKI-005 (dual posts SELECT for non-hashtag) | KRAVEN | Optimize searchPosts to skip byTag for non-hashtag queries |
| LOKI-006 (1-char query trigger) | KRAVEN | Add minimum query length (≥2 chars) before DAL fire |

---

## SENTRY MONITORING GAP REVIEW

| Flow | Location | Current Behavior | Auto-Captured? | Missing Signal | Severity | Recommendation |
|---|---|---|---|---|---|---|
| Hydration failure | ctrlSearchResults.js:17 | `.catch(() => {})` — fully swallowed | NO | Hydration engine down is invisible | HIGH | `captureMonitoringError` in catch |
| Search controller error | useSearchScreenController.js:117 | `setError(nextError)` — local state only | NO | DB errors invisible to ops | MEDIUM | `captureMonitoringError` in catch |
| vc.posts ilike partial failure | search.dal.js:65–67 | Promise.all — if byText throws, entire search fails | NO | Which sub-query failed is unknown | LOW | Log failed sub-query fingerprint |
| identity RPC failure | search.dal.js:28 | `if (error) throw error` — propagates to controller | NO | RPC failure reason unknown to ops | MEDIUM | Capture at controller catch with fingerprint |

---

## SENTRY INSTRUMENTATION RECOMMENDATIONS

### Recommendation 1 — Hydration silent failure

```
SENTRY INSTRUMENTATION RECOMMENDATION
Location:      controller/searchResults.controller.js:17
Failure type:  Hydration engine failure (network, engine outage, invalid actorIds)
Current behavior: hydrateActorsByIds(actorIds).catch(() => {}) — swallowed
Why Sentry does not see it: handled error does not throw; fire-and-forget pattern
Recommended call:
  hydrateActorsByIds(actorIds).catch((err) => {
    if (process.env.NODE_ENV !== 'production') console.warn('[explore] hydration failed', err?.message)
    captureMonitoringError(err, {
      feature: 'explore',
      controller: 'ctrlSearchResults',
      operation: 'hydrateActors',
      actorCount: actorIds.length,
    })
  })
Production-safe: YES — no PII in payload; actorCount is aggregate
Noise risk: LOW — fires only on hydration engine failure
Payload: feature, controller, operation, actorCount (no raw IDs)
Owner: LOKI → SENTRY
```

### Recommendation 2 — Search controller failure

```
SENTRY INSTRUMENTATION RECOMMENDATION
Location:      hooks/useSearchScreenController.js:117 (catch block)
Failure type:  Supabase RPC or SELECT failure during search
Current behavior: setError(nextError) — displayed in UI but not sent to Sentry
Why Sentry does not see it: handled async error caught in hook; does not reach RouteErrorBoundary
Recommended call:
  catch (nextError) {
    if (cancelled) return
    captureMonitoringError(nextError, {
      feature: 'explore',
      hook: 'useSearchScreenController',
      operation: 'search',
      filter,
      queryLength: debounced.length,
      hasActorId: actorId !== null,
    })
    setError(nextError)
    setResults([])
  }
Production-safe: YES — no raw query text; queryLength is aggregate
Noise risk: MEDIUM — will fire on every Supabase outage; consider debounce or sampling
Payload: feature, hook, operation, filter, queryLength, hasActorId
Owner: LOKI → SENTRY
```

---

## OBSERVABILITY GOVERNANCE STATUS

| Area | Coverage | Missing Visibility | Risk |
|---|---|---|---|
| Search query execution | PARTIAL — error state set locally | No Sentry signal on DB failure | MEDIUM |
| Hydration | NONE — swallowed | Hydration engine health invisible | HIGH |
| Cache hit/miss | NONE | Cache performance unknown | LOW |
| Debounce timing | NONE | Not critical | INFO |
| Actor normalization | NONE | Data loss on double-normalize not detected | MEDIUM |
| Orphaned hooks | NONE | useSearchTabsActor + searchUsecase execute nothing at runtime but exist as dead code | LOW |

---

## OBSERVABILITY GAP REVIEW

| Flow | Current Visibility | Missing Signals | Severity | Recommended Instrumentation |
|---|---|---|---|---|
| Search → DB failure | Local error state only | Sentry event with filter + queryLength | MEDIUM | captureMonitoringError in hook catch |
| Hydration failure | None | Sentry event with actorCount | HIGH | captureMonitoringError in fire-and-forget catch |
| Cache eviction | None | Console log (dev-only) when eviction occurs | LOW | Dev-only console.warn('[explore:cache] evicting', key) |
| Short-query scan | None | Console timing log (dev-only) for queries <3 chars | LOW | Dev-only warning before DAL call |
| Double normalization data loss | None | Dev-only assertion check on normalizeResult output | MEDIUM | Dev-only: assert actorKind present after normalization |

---

## CORRELATION ID REVIEW

| Flow | Correlation Present | Risk | Recommendation |
|---|---|---|---|
| Search request → DB reads | NO | Ops cannot correlate UI search event with specific RPC call | Add searchId (UUID) generated per debounce cycle; thread through controller → DAL logs (dev-only) |
| Cache hit | NO | Cache effectiveness unknown | Log cacheKey on HIT/MISS (dev-only) |
| Hydration request | NO | Cannot correlate search with hydration batch | Pass searchId to hydrateActorsByIds for correlation |

---

## OBSERVABILITY MATURITY

**MINIMAL**

Rationale: No runtime instrumentation exists for the explore feature. Failures are either surfaced as local React error state (user-visible but not ops-visible) or swallowed entirely (hydration). No Sentry signals, no timing traces, no cache telemetry, no correlation IDs. The feature is effectively a black box to production operators.

---

## FINAL LOKI STATUS: WATCH

Runtime execution is structurally sound — PARALLEL DB execution, debounce, inflight dedup, and the 45s cache all work correctly. No N+1 patterns. No query storms. No runaway loops.

Two HIGH findings require attention:
1. **LOKI-001** (double normalization + data loss) — actor fields silently dropped before UI render; permanent cache write of stripped data
2. **LOKI-002** (hydration silent failure) — production operators have zero visibility into hydration engine health for explore

Medium findings (LOKI-003, LOKI-004) are latent risks manageable before next release.

THOR Block: NO (runtime behavior is functional; findings are quality and observability gaps, not blocking security or functional defects independent of HAWKEYE findings)
