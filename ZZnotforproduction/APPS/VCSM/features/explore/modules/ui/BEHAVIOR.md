---
title: UI Module — Behavior
status: STUB
feature: explore
module: ui
source: architect-derived
created: 2026-06-05
---

# explore / modules / ui — BEHAVIOR

## Confirmed Behaviors

### Explore Feed (default state)
- ExploreScreen renders ExploreFeed on load (no search query)
- Shows curated rows: CitizensRow, VportsRow, featured cards

### Search Results Display
- User types query → SearchScreen.view renders ResultList
- FilterTabs allow filtering by kind (actors, posts, vports)
- ActorSearchResultRow, PostCard, VportsRow, FeatureSearchResultRow render result kinds

### Result Navigation (SECURITY GAP)
- Post result tapped → navigate to /posts/{post.id} — raw UUID exposed in URL
- Actor result tapped → navigate to /profile/{actor.username} normally
- Actor result with null username → navigate to /profile/{actor.actor_id} — raw UUID fallback

### Wander Cards
- WanderCardSearch.jsx renders wander-type results (FROZEN feature cards)

### Empty State
- EmptyState.jsx renders when search returns 0 results

## Critical Invariant (CURRENTLY VIOLATED)

Navigation from search results must never use raw UUIDs:
- /posts/{post.id} → must use post slug
- /profile/{actor_id} → must not fall back to raw actor_id; handle null username gracefully

## TODO

- [ ] Confirm PostCard.jsx navigation target — post.id or post.slug?
- [ ] Confirm ActorSearchResultRow.jsx null username fallback behavior
- [ ] Confirm /explore route access level — is it behind ProtectedRoute?
