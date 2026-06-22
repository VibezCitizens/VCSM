# VCSM Feature Behavior Contract — explore

Status: DRAFT
Authored By: LOGAN (source-derived for security triage — TICKET-EXPLORE-BUNDLE-SECURITY-PHASE-0001)
Authored Date: 2026-06-05
Requires Engineering Review: YES — must reach APPROVED before being used as release gate anchor
Promoted To APPROVED By: [PENDING]

---

## §1 Purpose

The explore feature is the platform-wide search and discovery surface for VCSM. It enables authenticated Citizens to search for other actors (users and VPORTs), posts, and platform features using free-text queries, hashtag-prefixed tag searches, and filter tabs.

Search is read-only. The explore module owns no write paths.

---

## §2 Scope

**In scope:**
- Free-text actor search (users and VPORTs) via `identity.search_actor_directory` RPC
- Post search via `vc.posts` direct SELECT (text ilike match)
- Hashtag post search via `vc.posts` tag array contains (# prefix activates this mode)
- Filter tabs: all, users, vports, posts (videos and groups are stubs returning empty)
- Feature injection: Wanders card when query matches "wander/wanders/@wander"
- Client-side result deduplication and 45s in-memory TTL cache
- Actor hydration (fire-and-forget via hydration engine) for display enrichment

**Out of scope:**
- Content creation, posting, or messaging
- Booking or service transactions
- Profile editing or account management
- Discovery feed (CitizensRow, VportsRow — disabled by hardcoded flag, stub data only)

---

## §3 Happy Paths

### BEH-EXPLORE-001 — Free-text actor search

1. Citizen types query into the search bar
2. 300ms debounce fires; `useSearchScreenController` dispatches to `ctrlSearchResults`
3. `ctrlSearchResults` calls `searchDal(query, filter, {})`
4. `searchDal` dispatches to `searchActors` for filter `all|users|vports`
5. `searchActors` calls `identity.search_actor_directory` RPC with `p_query`, `p_filter`, `p_limit=25`, `p_offset=0`, and `p_viewer_actor_id` (currently null — see SEC-001)
6. RPC returns actor rows; `normalizeActorRow` maps each row
7. Duplicate actors deduplicated by `actorDomain:actorId` key
8. Results stored in in-memory cache (45s TTL, max 120 entries)
9. `hydrateActorsByIds` called fire-and-forget for display enrichment
10. Normalized results rendered by `ResultList` → `FeaturedResultCard` (first) + `ActorSearchResultRow` (rest)
11. Actor navigation: `/profile/${username}` — username MUST be non-null

### BEH-EXPLORE-002 — Free-text post search

1. Citizen types query (not starting with #) into search bar
2. `searchDal` dispatches to `searchPosts` for filter `all|posts`
3. `searchPosts` runs two parallel Supabase queries against `vc.posts`:
   - `ilike('text', '%${query}%')` — text match
   - `contains('tags', [normalizedTag])` — tag match
4. Both apply: `deleted_at IS NULL` and `is_hidden IS NULL OR is_hidden = false`
5. Results merged, deduplicated by post.id, mapped by `normalizeResult`
6. Posts rendered as `PostCard` items; navigation: `/posts/${slug}` — slug MUST be used, never raw UUID

### BEH-EXPLORE-003 — Hashtag search (# prefix mode)

1. Citizen types `#tagname` in the search bar
2. `searchDal` detects `#` prefix — activates hashtag-only mode regardless of filter tab
3. Dispatches to `searchPostsByTag` only — no actor mixing
4. `searchPostsByTag` queries `vc.posts` with `contains('tags', [normalizedTag])`
5. Applies: `deleted_at IS NULL` and `is_hidden IS NULL OR is_hidden = false`
6. Results rendered as `PostCard` items only; `ResultList` strips all non-post items in hashtag mode

### BEH-EXPLORE-004 — Filter tab selection

1. Citizen taps a filter tab (all / users / vports / posts / videos / groups)
2. `setFilter` updates state; new filter persisted to `localStorage` key `search:lastFilter`
3. Previous filter restored on re-mount if it is a valid FILTERS enum value
4. videos and groups filters return empty arrays (stubs) — no results shown
5. Filter change clears cache hit for prior filter; new fetch dispatched on next debounce

### BEH-EXPLORE-005 — Wanders feature injection

1. Citizen types a query matching: `wander`, `wanders`, or prefix `@wander`
2. `ctrlSearchResults` `buildFeatureResults` returns a `result_type: 'feature'` item for Wanders
3. `ResultList` renders `WanderCardSearch` component for the Wanders feature item
4. Navigation: `/wanders/create` with optional `realmId` and `baseUrl` in location state
5. Feature injection only active when `filter === 'all'`

### BEH-EXPLORE-006 — Cache hit

1. Same `filter:query` key searched within 45 seconds of a prior fetch
2. `useSearchScreenController` reads from `searchResultCache` Map
3. If entry exists and `expiresAt > Date.now()`, returns cached results immediately
4. No DAL/RPC call made; `loading` state not set to true
5. Inflight dedup: concurrent requests for same key share a single in-flight Promise

### BEH-EXPLORE-007 — Empty query

1. Citizen clears the search bar (or query is only whitespace after trim)
2. Debounced value becomes empty string
3. Results cleared; error cleared; no DAL call made
4. Discovery feed area shown (currently returns null due to hardcoded flag)

---

## §4 Edge Cases

| Case | Behavior |
|---|---|
| Query starts with `@` | @ stripped before RPC call; remaining text used as needle |
| Query starts with `#` | Hashtag mode activated; only post tag search; `#` stripped before query |
| Query is only `@` or `#` | After strip, needle is empty → no search, results cleared |
| Actor with null username | Actor MUST be filtered out at model layer; UUID fallback PROHIBITED (see NEVER-001) |
| Post with no id | `normalizeResult` returns null; filtered by `.filter(Boolean)` |
| videos filter | DAL returns `Promise.resolve([])` — empty results, no error |
| groups filter | DAL returns `Promise.resolve([])` — empty results, no error |
| Identity RPC error | `searchActors` throws; `ctrlSearchResults` propagates; hook sets `error` state |
| vc.posts query error | Parallel query returns empty data; post results absent, no crash |
| Hydration failure | `hydrateActorsByIds` error silently swallowed via `.catch(() => {})` |
| Cache max capacity | Oldest key evicted when `searchResultCache.size > 120` |

---

## §5 Security Rules

### SEC-EXPLORE-001 — viewerActorId MUST come from authenticated session

The `p_viewer_actor_id` parameter sent to `identity.search_actor_directory` MUST be derived from the authenticated session (via `useIdentity()` or equivalent session hook), not from URL parameters, component props, or any client-supplied value.

- Anonymous search (null viewerActorId) is permitted only when the viewer is genuinely unauthenticated
- Authenticated Citizens MUST always have their actorId injected
- Current state: `ctrlSearchResults` passes `{}` for opts → viewerActorId is null for all authenticated users (VEN-EXPLORE-002 — HIGH — OPEN)

### SEC-EXPLORE-002 — Post results MUST respect visibility filters

All post queries against `vc.posts` MUST apply:
- `deleted_at IS NULL`
- `is_hidden IS NULL OR is_hidden = false`

RLS policy on `vc.posts` must provide defense-in-depth enforcement of these filters. App-layer filters are not sufficient alone.

### SEC-EXPLORE-003 — Actor privacy and block state MUST be enforced

Search results MUST NOT return:
- Actors the viewer has blocked
- Actors whose privacy settings exclude the viewer

Enforcement is delegated to `identity.search_actor_directory` server-side when `p_viewer_actor_id` is correctly provided. Without viewerActorId, block and privacy enforcement is not guaranteed.

### SEC-EXPLORE-004 — Navigation MUST use human-readable identifiers, never raw UUIDs

- Post navigation: `/posts/${slug}` — a human-readable post identifier. Raw `post.id` UUID MUST NOT be used.
- Actor navigation: `/profile/${username}` — username MUST be non-null. UUID fallback via `actor_id` is PROHIBITED.
- If username is null, the actor result MUST be filtered out of results, not rendered with a UUID fallback.
- Current state: PostCard, ActorSearchResultRow, and FeaturedResultCard all have UUID exposure (VEN-EXPLORE-003, VEN-EXPLORE-006 — HIGH — OPEN)

### SEC-EXPLORE-005 — Search cache MUST be scoped to authenticated viewer

- Cache key MUST include the authenticated viewer's `actorId` (e.g., `${actorId}:${filter}:${query}`)
- Cache MUST be invalidated or cleared on actor switch
- Module-level singleton cache MUST NOT persist results across different authenticated actors on the same device
- Current state: Cache is keyed by `filter:query` only — no actorId scoping (VEN-EXPLORE-004 — MEDIUM — OPEN)

### SEC-EXPLORE-006 — Legacy identity fields MUST be removed from model output

- `userId` and `ownerUserId` MUST NOT appear in normalized search result objects
- These are legacy fields that violate the VCSM identity contract
- Current state: `mapActorSearchResult` returns `userId`, `mapVportSearchResult` returns `ownerUserId` (VEN-EXPLORE-005 — LOW — OPEN)

---

## §6 Data Changes

**Explore is read-only. No write operations.**

| Operation | Schema | Object | Function | Notes |
|---|---|---|---|---|
| RPC (read) | identity | search_actor_directory | searchActors | Semantically a read; scanner classifies as write surface due to RPC op type |
| SELECT | vc | posts | searchPosts | Text + tag match; explicit column select |
| SELECT | vc | posts | searchPostsByTag | Tag-only match; explicit column select |

---

## §7 UI States

| State | Trigger | Component | Behavior |
|---|---|---|---|
| Loading | Query debounced, fetch in progress | useSearchScreenController | loading=true; SkeletonRow (4 rows) displayed |
| Empty | Fetch returns 0 results | ResultList → EmptyState | EmptyState.jsx: "No results" copy |
| Results | Fetch returns ≥1 results | ResultList | FeaturedResultCard (first) + rows |
| Error | Fetch throws | useSearchScreenController | error set; results cleared; no error UI defined (gap) |
| Idle (no query) | Empty search bar | SearchScreen.view | Discovery feed area (currently returns null) |
| Hashtag mode | Query starts with # | ResultList | Only PostCard items; no actors |
| Filter-stub | videos or groups tab | ResultList → EmptyState | Empty results — no data available |

---

## §8 Routes

| Path | Access Classification | Auth Enforcement | Status |
|---|---|---|---|
| /explore | CONFLICT — scanner=public, barrel=public:false | UNKNOWN — not verified in router | PENDING HAWKEYE (VEN-EXPLORE-007) |

---

## §9 Must Never Happen

### NEVER-EXPLORE-001 — Raw actor_id UUID in public navigation URL

**Invariant:** A raw `actor_id` UUID MUST NEVER appear in any public-facing navigation URL.

- Actor navigation MUST use `username`
- If `username` is null, the actor result is filtered out before rendering — UUID fallback is NEVER used
- Applies to: ActorSearchResultRow, FeaturedResultCard, and any future component rendering actor results from search

**Current state:** VIOLATED — both ActorSearchResultRow and FeaturedResultCard use `actor.username ?? actor.actor_id` (VEN-EXPLORE-003, VEN-EXPLORE-006)

**Guard required:** Model layer filter in `normalizeActorRow` / `normalizeResult` that returns null for actors with null username.

### NEVER-EXPLORE-002 — Raw post.id UUID in public navigation URL

**Invariant:** A raw `post.id` UUID MUST NEVER appear in any public-facing navigation URL.

- Post navigation MUST use a human-readable slug or identifier
- `post.id` from `vc.posts` is a raw DB UUID and MUST NOT be used in URLs

**Current state:** VIOLATED — PostCard navigates to `/posts/${post.id}` (VEN-EXPLORE-003)

### NEVER-EXPLORE-003 — viewerActorId from client-controlled input

**Invariant:** `viewerActorId` passed to the identity RPC MUST NEVER originate from URL parameters, component props passed from an untrusted caller, or any user-controlled value.

**Permitted source:** `useIdentity()` or authenticated session resolution only.

### NEVER-EXPLORE-004 — Blocked actor in search results for blocking viewer

**Invariant:** An actor that has been blocked by the viewer MUST NEVER appear in that viewer's search results.

**Enforcement:** `identity.search_actor_directory` server-side policy when `p_viewer_actor_id` is correctly injected. Requires SEC-EXPLORE-001 to be implemented.

### NEVER-EXPLORE-005 — Deleted post in search results

**Invariant:** A post with `deleted_at IS NOT NULL` MUST NEVER appear in search results.

**Enforcement:** DAL query filter (`is('deleted_at', null)`) + RLS policy defense-in-depth.

### NEVER-EXPLORE-006 — Search fetch on empty query

**Invariant:** A DAL call or RPC call MUST NEVER be made when the debounced query is empty or whitespace-only.

**Enforcement:** `if (!debounced)` guard in `useSearchScreenController` effectually blocks the fetch.

---

## §10 Performance Constraints

| Constraint | Value | Location |
|---|---|---|
| Debounce delay | 300ms | useSearchScreenController |
| Cache TTL | 45 seconds | useSearchScreenController (SEARCH_CACHE_TTL_MS) |
| Cache max entries | 120 | useSearchScreenController (SEARCH_CACHE_MAX_ENTRIES) |
| Default result limit | 25 | searchDal opts (limit default) |
| Search parallelism | Promise.all for post text + tag queries | searchPosts |
| Hydration | Fire-and-forget | ctrlSearchResults |

---

## §11 Engine Dependencies

| Engine | Boundary | Method | Direction |
|---|---|---|---|
| identity | Approved (RPC) | identity.search_actor_directory | explore → identity engine |
| hydration | Approved (import) | hydrateActorsByIds | explore → hydration engine |

---

## §12 Known Gaps (Open at Time of Authoring — 2026-06-05)

| Gap | Finding | Severity | Status |
|---|---|---|---|
| viewerActorId not injected from session | VEN-EXPLORE-002 | HIGH | OPEN |
| Raw UUID in PostCard + ActorSearchResultRow navigation | VEN-EXPLORE-003 | HIGH | OPEN |
| Raw UUID in FeaturedResultCard navigation | VEN-EXPLORE-006 | HIGH | OPEN |
| Cache not scoped to viewer identity | VEN-EXPLORE-004 | MEDIUM | OPEN |
| Route access classification conflict | VEN-EXPLORE-007 | MEDIUM | OPEN (needs HAWKEYE) |
| Legacy userId/ownerUserId in model output | VEN-EXPLORE-005 | LOW | OPEN |
| Zero test coverage | ARCHITECT finding | HIGH | OPEN |
| FilterTabs.jsx is dead code | ARCHITECT finding | MEDIUM | OPEN (delete candidate) |
| Discovery feed permanently disabled | ARCHITECT finding | MEDIUM | OPEN |
| videos and groups filters are stubs | ARCHITECT finding | LOW | OPEN |

---

## §13 Engine Dependencies (Machine-Readable)

```
engines:
  - name: identity
    method: search_actor_directory
    schema: identity
    type: rpc
    direction: read
  - name: hydration
    method: hydrateActorsByIds
    type: function-call
    direction: read
    mode: fire-and-forget
```

---

## Audit References

| Ref | Path | Date |
|---|---|---|
| ARCHITECT V2 | ZZnotforproduction/APPS/VCSM/features/explore/ARCHITECTURE.md | 2026-06-05 |
| VENOM V2 | ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/Venom/2026-06-05_venom_explore-security-review.md | 2026-06-05 |
| BLACKWIDOW | ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_explore-adversarial-review.md | 2026-06-04 |
| Evidence Bundle | ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/ARCHITECT/evidence-bundle.json | 2026-06-05 |

---

## Change Log

### 2026-06-05

Task: Security triage behavior contract authoring — TICKET-EXPLORE-BUNDLE-SECURITY-PHASE-0001
Authored By: LOGAN (source-derived from ARCHITECT V2 full source read)
Status Before: PLACEHOLDER (one-line stub)
Status After: DRAFT — full §1–§13 contract, security rules, §9 invariants
Trigger: VEN-EXPLORE-001 (HIGH) — BEHAVIOR.md absence flagged as security anchor gap
Next Action: Engineering review required to promote to APPROVED
Security / Runtime Notes: §5 SEC-EXPLORE-001 through SEC-EXPLORE-006 and §9 NEVER-EXPLORE-001 through NEVER-EXPLORE-006 drafted from VENOM findings; all 3 THOR-blocking findings (VEN-002, VEN-003, VEN-006) are anchored in §5 and §9
