# BOTTOM NAV — EXPLORE BUTTON ARCHITECTURE MAP

**Generated:** 2026-05-11
**Button:** Explore (Compass icon)
**Route:** `/explore`
**Feature:** explore

---

## Button Definition

```
<Tab to="/explore" label={t('nav.explore')} icon={<Compass size={18} />} />
```
- NavLink — standard React Router push
- No badge
- No custom click handler

---

## Screen Chain

```
/explore → ExploreScreen.jsx → SearchScreen.view.jsx (via Suspense)
```

**Screen:** `features/explore/screens/ExploreScreen.jsx`
**View:** `features/explore/ui/SearchScreen.view.jsx`

---

## Primary Hooks

| Hook | File | Purpose | Calls |
|---|---|---|---|
| `useSearchActor` | `explore/hooks/useSearchActor.js` | Re-exports `useSearchScreenController` | — |
| `useSearchScreenController` | `explore/hooks/useSearchScreenController.js` | Search state: query, debounce, filter, cache, results | `ctrlSearchResults` |

---

## Primary Controllers

| Controller | File | Purpose | Calls |
|---|---|---|---|
| `ctrlSearchResults` | `explore/controller/searchResults.controller.js` | Orchestrates multi-type search + feature results | `searchDal()` |

---

## Primary DAL Reads

| DAL Method | File | Tables / Views / RPCs | Condition |
|---|---|---|---|
| `searchActors` | `explore/dal/search.dal.js` | `identity.rpc('search_actor_directory')` | filter=users/vports/all |
| `searchPosts` (text) | `explore/dal/search.dal.js` | `vc.posts` (ilike text) | filter=posts or all |
| `searchPosts` (tag) | `explore/dal/search.dal.js` | `vc.posts` (contains tags) | filter=posts or all |
| `searchPostsByTag` | `explore/dal/search.dal.js` | `vc.posts` (contains tags) | # prefix queries |

---

## State Stores

| Store | File | Data Held |
|---|---|---|
| Search in-memory cache | `useSearchScreenController` (module-level Map) | Results keyed by `filter:query`, 45s TTL, max 120 entries |
| localStorage | `useSearchScreenController` | Last selected filter (`search:lastFilter`) |
| actorStore (via hydration) | `state/actors/actorStore.js` | Actor data hydrated after search results arrive |

---

## Data Flow

```
ExploreScreen mounts
  → SearchScreen.view renders
  → useSearchScreenController initializes
    → localStorage.getItem('search:lastFilter') → restores last filter tab
    → query='', results=[], loading=false

User types in search box
  → setQuery(value)
  → 300ms debounce → setDebounced(trimmed)
  → debounced changes → run() fires

run()
  → cacheKey = filter:query
  → readSearchCache(cacheKey) → cache hit? → setResults(cached), return
  → cache miss → setLoading(true)
  → ctrlSearchResults({ query: debounced, filter })
    → searchDal(query, filter) → returns array of Promises
    → Promise.all(promises)
      filter='all':
        → searchActors (identity.search_actor_directory RPC) [parallel]
        → searchPosts text search (vc.posts ilike) + tag search (vc.posts contains) [parallel within searchPosts]
        → Promise.resolve([]) × 2 (videos, groups — not implemented)
    → normalizeResult → dedupeByKindAndId → merged results
  → writeSearchCache(cacheKey, results)
  → setResults(merged)
  → hydrateActorsByIds(actorIds) [background, non-blocking]

Empty state (no query):
  → OnboardingCardsView (onboarding adapter)
  → ExploreFeed (component — file not traced, INFERRED: explore feed view)
```

---

## Security / Ownership Gates

- No explicit auth gate on ExploreScreen (INFERRED — may rely on RLS)
- `search_actor_directory` RPC — viewer actor ID passed as `p_viewer_actor_id` for block-aware search
- INFERRED: blocked actors excluded at DB/RLS level in RPC

---

## Loading / Error States

| State | Behavior |
|---|---|
| Loading results | Suspense fallback: "Loading..." text |
| Search loading | INFERRED: `loading` flag in useSearchScreenController — not observed in view |
| Search error | `setError(nextError)` — INFERRED: error state not observed rendered in SearchScreen.view |
| Empty results | INFERRED: ResultList renders empty list or empty state |
| No query | OnboardingCardsView + ExploreFeed |

---

## Spaghetti / Risk Flags

| Signal | Evidence | Risk | Handoff |
|---|---|---|---|
| `usecases/` folder exists but unused here | Controller path used correctly | LOW | — |
| `localStorage.setItem` in hook | Filter persisted to localStorage | LOW — acceptable UX persistence | — |
| `videos` and `groups` filters return `[]` | Dead filter tabs rendering silently | MEDIUM — dead UI paths | IRONMAN |
| No debounce abort on rapid typing | `cancelled` flag used but search inflight persists | LOW — deduped by inflight map | — |
| `ExploreFeed` — file not read | Content unknown | INFERRED — NEEDS LOKI VERIFICATION | — |

---

## Native Relevance

STATICALLY TRACED: No native-specific code detected in this flow.

---

## Missing Pieces

- No explicit auth gate — relies on RLS (NEEDS VENOM verification)
- No adapter boundary — `ctrlSearchResults` accessible outside explore without adapter
- `groups` and `videos` search returns `[]` — filter tabs display without results (dead feature)
- Error state not clearly rendered in `SearchScreen.view.jsx`
