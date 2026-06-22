---
title: Search Module — Behavior
status: STUB
feature: explore
module: search
source: architect-derived
created: 2026-06-05
---

# explore / modules / search — BEHAVIOR

## Confirmed Behaviors

### Primary Search Flow
- User types query in ExploreScreen → useSearchScreenController (45s staleTime cache)
- ctrlSearchResults → search.usecase.js → search.dal.js dispatcher
- searchActors → identity.search_actor_directory RPC (p_viewer_actor_id: **null** — THOR BLOCKER)
- searchPosts → vc.posts SELECT (deleted_at IS NULL, is_hidden = false filters)
- searchPostsByTag → vc.posts SELECT by tag
- Results normalized via search.model.js → deduped by kind+id → returned to UI

### Tab Search Flow
- FilterTabs selection → useSearchTabsActor → ctrlSearchTabs
- viewerActorId passed from component props (not session-derived — PARTIAL)
- Same search.dal.js but scoped to actor tab

### Result Hydration
- ctrlSearchResults calls hydrateActorsByIds fire-and-forget after results returned
- Errors silenced — hydration store receives unvalidated data if RPC fails

### Cache Behavior
- useSearchScreenController: staleTime=45s, module-level cache
- Cache NOT scoped to viewerActorId — persists across actor switches and device sessions
- Cross-session leak: if same device is used by two actors, second actor sees first actor's cached results briefly

## Critical Invariant (CURRENTLY VIOLATED)

viewerActorId MUST be injected from the authenticated session into all search_actor_directory RPC calls. Null viewerActorId means:
1. Blocked actors are NOT suppressed in results
2. Private content personalization is NOT applied
3. Any blocked actor appears in search results to the blocking user

## TODO

- [ ] Confirm ctrlSearchResults — where is viewerActorId read from? Is it always null?
- [ ] Confirm cache key structure in useSearchScreenController
- [ ] Confirm hydrateActorsByIds error handling — does it throw or return null?
