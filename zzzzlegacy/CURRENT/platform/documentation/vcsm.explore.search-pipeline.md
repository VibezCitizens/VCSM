VCSM Explore Search Pipeline
==============================
Last updated: 2026-05-03
Status: Current implementation

This document reflects the search pipeline as built and deployed as of May 2026.
The prior document described a legacy architecture (search.data.js, search_directory RPC,
supplemental profiles queries) that no longer matches the implementation.


1. Layout Architecture
-----------------------

  File: apps/VCSM/src/features/explore/screens/ExploreScreen.jsx

  ExploreScreen is a fixed-height scroll container:
    height: calc(100dvh - 48px - env(safe-area-inset-top, 0px))
    overflow: hidden
    flex flex-col

  This anchors the Explore screen to the visible viewport (below TopNav),
  regardless of content height. Scrolling is handled inside SearchScreen,
  not by the document.

  ExploreScreen > inner wrapper (flex flex-col flex-1 min-h-0)
    > Suspense
      > SearchScreen

  File: apps/VCSM/src/features/explore/ui/SearchScreen.view.jsx

  SearchScreen is split into two flex regions:
    1. Sticky header (flex-shrink-0)
       - Search input
       - Filter tabs: All | Citizens | Vports | Vibes | Districts
    2. Scrollable body (flex-1 min-h-0 overflow-y-auto)
       - Bottom padding: calc(--vc-bottom-nav-total-height + 0.75rem)
       - Contains: ResultList when searching, OnboardingCardsView + ExploreFeed when idle

  Result: all search content scrolls within the viewport. The bottom nav
  never overlaps content at the end of the list.


2. Hook Chain
--------------

  SearchScreen.view.jsx
    → useSearchActor()
      → useSearchScreenController()

  useSearchScreenController manages:
    - query (raw input, immediate)
    - debounced (300ms delay)
    - filter (persisted to localStorage 'search:lastFilter')
    - 45s TTL cache keyed by filter:query (module-level Map)
    - in-flight deduplication (searchInflight Map)
    - calls ctrlSearchResults() — NOTE: its results state is never consumed by the view
      (duplicate fetch — see Known Issues §11)

  ResultList.jsx
    → useSearchTabsActor({ query, filter, viewerActorId })
      - Calls ctrlSearchTabs()
      - Injects Wanders feature card when query matches 'wander*'
      - Returns { items, loading }
      - No cache — every render = fresh network call

  Files:
    features/explore/hooks/useSearchActor.js
    features/explore/hooks/useSearchScreenController.js
    features/explore/hooks/useSearchTabsActor.js


3. Controller Chain
--------------------

  ctrlSearchTabs({ query, filter, limit, offset, viewerActorId })
    File: features/explore/controller/searchTabs.controller.js

    Pipeline:
      1. calls searchDal(query, filter, opts)
      2. Promise.all() on returned array of promises
      3. responses.flat() → single merged array
      4. returns to useSearchTabsActor

    No normalization. No deduplication. Raw result shapes returned as-is.

  ctrlSearchResults (legacy, parallel fetch — results discarded)
    File: features/explore/controller/searchResults.controller.js
    Called by useSearchScreenController but result is never rendered.
    See Known Issues §11.


4. DAL Layer
-------------

  File: features/explore/dal/search.dal.js

  searchDal(query, filter, opts)
  --------------------------------

  HASHTAG DETECTION (evaluated before filter switch):
    If query.trim().startsWith('#'):
      tag = query.slice(1).toLowerCase().trim()
      returns [searchPostsByTag(tag, opts)]
      — ignores the filter tab entirely —

  Filter dispatch (non-hashtag queries):
    'users'  → [searchActors(query, { filter: 'users' })]
    'vports' → [searchActors(query, { filter: 'vports' })]
    'posts'  → [searchPosts(query, opts)]
    'videos' → [Promise.resolve([])]   ← stub
    'groups' → [Promise.resolve([])]   ← stub
    'all'    → [searchActors(query, { filter: 'all' }),
                searchPosts(query, opts),
                Promise.resolve([]),
                Promise.resolve([])]

  searchActors(rawQuery, opts)
  -----------------------------
    DB: supabase.schema('identity').rpc('search_actor_directory', {
          p_viewer_domain: 'vc',
          p_viewer_actor_id: viewerActorId,
          p_query: needle,           ← @ and # prefixes stripped before call
          p_filter: 'all'|'users'|'vports',
          p_limit, p_offset
        })

    Post-processing:
      - normalizeActorRow() maps each row to domain shape
      - deduplication by actorDomain:actorId (Set)
      - hydrateActorsByIds() called async (fire-and-forget) for cache warming

    Returns: array of actor result objects

  searchPosts(rawQuery, opts)
  ----------------------------
    Used for: Vibes tab, All tab (general text search)
    Filters: only posts WITH tags (tags IS NOT NULL AND tags != '{}')

    Two parallel queries:
      byText: .ilike('text', '%query%')
      byTag:  .contains('tags', [normalizedTag])

    Both filtered by:
      .is('deleted_at', null)
      .or('is_hidden.is.null,is_hidden.eq.false')
      .not('tags', 'is', null)
      .not('tags', 'eq', '{}')

    Deduped by id (Map). Returns posts with result_type: 'post'.

    DEV logs: [explore:search:posts:start], [explore:search:posts:result],
              [explore:search:posts:empty], [explore:search:posts:error:text/tag]

  searchPostsByTag(tag, opts)
  ----------------------------
    Used for: hashtag mode (#query)
    Single query: .contains('tags', [tag]) only — no text ilike

    Filtered by:
      .is('deleted_at', null)
      .or('is_hidden.is.null,is_hidden.eq.false')

    Returns posts with result_type: 'post'.

    DEV logs: [explore:search:posts:tag-only], [explore:search:posts:tag-only:result],
              [explore:search:posts:tag-only:empty], [explore:search:posts:tag-only:error]


5. Result Shapes
-----------------

  Actor result (from searchActors):
    {
      result_type: 'actor',
      actor_id: uuid,
      actorId: uuid,          ← normalized alias
      actorDomain: 'vc',
      display_name: string,
      username: string,
      photo_url: string,
      kind: 'user' | 'vport'
    }

  Post result (from searchPosts / searchPostsByTag):
    {
      result_type: 'post',
      id: uuid,
      actor_id: uuid,
      text: string | null,
      title: string | null,
      tags: string[],         ← always non-null, non-empty (filtered at query level)
      created_at: timestamptz
    }

  Feature result (injected by useSearchTabsActor):
    {
      result_type: 'feature',
      id: 'wanders',
      title: string,
      subtitle: string,
      route: string
    }


6. Database Tables
-------------------

  Table / RPC                           | Used By             | Purpose
  --------------------------------------|---------------------|---------------------------
  identity.search_actor_directory (RPC) | searchActors()      | Actor + vport search
  vc.posts                              | searchPosts()       | Post text + tag search
                                        | searchPostsByTag()  | Hashtag tag-only search
  onboarding tables                     | getOnboardingCards  | Landing cards (idle state)

  Posts query columns selected:
    id, actor_id, text, title, tags, created_at

  NOTE: vc.posts.tags is TEXT[] — PostgreSQL array of lowercase tag strings
  (e.g. ["california", "lockout"]).


7. Search Modes
----------------

  MODE: HASHTAG
    Trigger: query starts with '#'
    Example: "#california", "#lockout"
    DAL: searchPostsByTag(tag) — tag-contains only
    Rendering: only PostCard list, no featured actor card, no actors mixed in
    Note: hashtag mode overrides the active filter tab

  MODE: GENERAL
    Trigger: query does NOT start with '#'
    Example: "california", "ar", "barber"
    DAL: searchActors() + searchPosts() for 'all' tab
         searchActors() only for 'users'/'vports' tabs
         searchPosts() only for 'posts' tab
    Rendering: featured actor card + actor rows + "VIBES" section + PostCards


8. Rendering Architecture
--------------------------

  File: features/explore/ui/ResultList.jsx

  Determines mode from query prop (isHashtagSearch = query.startsWith('#'))

  HASHTAG MODE:
    - Filter items to result_type === 'post' only
    - Render as flat list of PostCard components

  GENERAL MODE:
    - Split: actorItems = actors + features
    - Split: postItems = posts
    - [featured, ...restActors] = actorItems
    - Render:
        FeaturedResultCard(featured)       ← 16:9 hero, actor only
        ActorSearchResultRow(each actor)   ← with PROFILE pill
        WanderCardSearch (if feature.id === 'wanders')
        [section label "VIBES" if both actors and posts present]
        PostCard(each post)

  File: features/explore/ui/FeaturedResultCard.jsx
    Handles: result_type === 'actor' (16:9 hero with photo)
             result_type === 'feature' (gradient card with icon)
    Does NOT handle posts (posts never reach this component).

  File: features/explore/ui/PostCard.jsx
    Used for all post results in both modes.
    Shows: text preview (3-line clamp), tag pills (accent purple).
    Navigates to: /posts/:id

  File: features/explore/ui/ActorSearchResultRow.jsx
    Shows: avatar, display_name, @username, "PROFILE" pill.
    Navigates to: /profile/:username or /profile/:actor_id


9. Navigation Mapping
----------------------

  ActorSearchResultRow:
    → navigate('/profile/{actor.username ?? actor.actor_id}')

  FeaturedResultCard (actor):
    → navigate('/profile/{item.username ?? item.actor_id}')

  FeaturedResultCard (feature):
    → navigate(item.route)

  PostCard:
    → navigate('/posts/{post.id}')

  WanderCardSearch:
    → navigate('/wanders/create', { state: ... })


10. Tag Normalization
----------------------

  Both searchPosts and searchPostsByTag normalize the query:
    - Strip leading '#' if present
    - .toLowerCase().trim()

  The byTag query uses .contains('tags', [normalizedTag]) — exact lowercase match.
  The byText query uses .ilike('text', '%rawQuery%') — case-insensitive text match.

  Tags in vc.posts are stored lowercase without '#' (e.g. "california", not "#California").
  The normalization in the DAL handles user input with or without the '#' prefix.


11. Known Issues
-----------------

  ISSUE 1 — DUPLICATE FETCH (P1 — performance)
    useSearchScreenController fires ctrlSearchResults on every debounced query.
    ResultList independently fires ctrlSearchTabs via useSearchTabsActor.
    Both call searchDal with the same query and filter.
    The results from useSearchScreenController are cached but NEVER rendered.
    Impact: 2x RPC calls per search, 2x on tab switch.
    Fix: Remove ctrlSearchResults call from useSearchScreenController.
    Files: hooks/useSearchScreenController.js, controller/searchResults.controller.js

  ISSUE 2 — NO CACHE IN useSearchTabsActor (P1 — UX)
    Every search / tab switch / return to Explore = fresh network call.
    The 45s cache in useSearchScreenController is orphaned (results unused).
    Fix: Add React Query useQuery to useSearchTabsActor.
    File: hooks/useSearchTabsActor.js

  ISSUE 3 — BLANK EXPLORE BODY FOR ONBOARDED USERS (P0 — UX)
    SHOW_EXPLORE_DISCOVERY_BLOCKS = false in ExploreFeed.jsx.
    ExploreFeed always returns null.
    OnboardingCardsView returns null when allCompleted === true.
    Result: every fully onboarded user sees a blank Explore screen when idle.
    Fix: Enable ExploreFeed with real data, or add a fallback landing state.
    File: features/explore/ui/ExploreFeed.jsx

  ISSUE 4 — VIBES/DISTRICTS TABS ALWAYS EMPTY (P3 — UX)
    'videos' and 'groups' cases return Promise.resolve([]) (stubs, never implemented).
    EmptyState shown to user with no indication the tabs are unimplemented.
    Fix: Implement or hide these tabs.
    File: dal/search.dal.js

  ISSUE 5 — VOID ACTORS IN search_actor_directory (P2 — correctness)
    The identity.search_actor_directory RPC may not filter is_void actors.
    Void/shadow-banned actors could appear in results.
    Fix: Add is_void=false filter inside the RPC or in searchActors() post-processing.

  ISSUE 6 — NO REACT QUERY (P2 — UX)
    No useQuery, no staleTime, no keepPreviousData anywhere in the Explore pipeline.
    Tab switch causes full skeleton flash.
    Return to Explore always cold (no cached results).
    Fix: Replace useSearchTabsActor bare useEffect with useQuery.


12. CSS / Styles
-----------------

  File: features/explore/styles/explore-modern.css

  Key classes:
    .explore-modern              — token scope (--explore-* vars)
    .explore-search-shell        — input + filter wrapper with gradient bg
    .explore-search-input-wrap   — input container
    .explore-filter-grid         — 5-column tab row
    .explore-results-stack       — gap: 0.45rem grid for results
    .explore-featured-card       — 16:9 hero card (actor/feature only)
    .explore-result-row          — compact actor row
    .explore-result-avatar       — 2.7rem square avatar
    .explore-result-pill         — uppercase pill label (PROFILE, VIBE)
    .explore-post-card           — post card (padding, rounded, border)
    .explore-post-card-text      — 3-line clamped post preview
    .explore-post-tags           — flex row of tag pills
    .explore-post-tag            — accent purple tag pill
    .explore-section-label       — "VIBES" section divider label
    .explore-empty-state         — empty results card


13. Full Pipeline Map
----------------------

  User types in search bar
    |
    v
  SearchScreen.view.jsx (sticky header)
    setQuery → useSearchScreenController
    |
    v
  Debounced query (300ms) → useSearchTabsActor
    |
    v
  ctrlSearchTabs(query, filter)
    |
    v
  searchDal(query, filter)
    |
    +-- query starts with '#'?
    |     YES → searchPostsByTag(tag) → vc.posts contains query
    |
    +-- filter='all' (no '#'):
    |     searchActors(query, 'all') → identity.search_actor_directory RPC
    |     searchPosts(query)         → vc.posts ilike + contains (tagged only)
    |
    +-- filter='users'/'vports' (no '#'):
    |     searchActors(query, filter) → identity.search_actor_directory RPC
    |
    +-- filter='posts' (no '#'):
    |     searchPosts(query) → vc.posts ilike + contains (tagged only)
    |
    +-- filter='videos'/'groups':
          Promise.resolve([]) ← stubs
    |
    v
  Promise.all() → flat() → items[]
    |
    v
  ResultList.jsx
    |
    +-- isHashtagSearch (#)?
    |     → flat PostCard list
    |
    +-- general mode:
          FeaturedResultCard (first actor)
          ActorSearchResultRow (rest of actors)
          [VIBES section label]
          PostCard (all posts)
    |
    v
  Navigation:
    actor → /profile/:username
    post  → /posts/:id
    wanders feature → /wanders/create


14. Change Log
---------------

  2026-05-03 — Hashtag search + Explore refactor (this session)
    - Replaced identity.search_actor_directory actor search path (now confirmed active)
    - Added searchPosts() for general post search (text ilike + tag contains)
    - Added searchPostsByTag() for hashtag-mode search (tag contains only)
    - Added hashtag mode detection in searchDal() — '#' prefix bypasses filter tab
    - Posts limited to tagged-only (tags IS NOT NULL AND tags != '{}')
    - Added PostCard.jsx — proper post card with text preview + tag pills
    - Removed PostSearchResultRow.jsx (replaced by PostCard)
    - ResultList refactored: mode-aware (hashtag vs general), actors/posts split
    - FeaturedResultCard: removed post block (posts never reach featured slot)
    - ExploreScreen: fixed-height scroll container (height: 100dvh - topnav)
    - SearchScreen: sticky header + scrollable body flex architecture
    - CSS: added explore-post-card, explore-post-tag, explore-section-label classes
