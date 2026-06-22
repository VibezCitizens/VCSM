---
title: UI Module — Index
status: STUB
feature: explore
module: ui
source: architect+venom+bw-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/explore/ui/
scanner-version: 1.1.0
---

# explore / modules / ui

Explore screen and search result display components. No write surfaces. **THOR BLOCKER: raw UUID post IDs in navigation URLs; raw actor_id in profile fallback URL — adversarially confirmed.**

## Module Summary

| Field | Value |
|---|---|
| Module | ui |
| Feature | explore |
| Source Path | apps/VCSM/src/features/explore/ui/, apps/VCSM/src/features/explore/screens/ |
| Screens | 2 (ExploreScreen, SearchScreen.view) |
| Routes | /explore |
| Write Surfaces | None |
| Components | 11 |
| Styles | 1 (explore-modern.css) |
| Barrel | 1 (ui/index.jsx — declares /explore route) |

## Known Source Files (ARCHITECT-verified)

### Screens
| File | Role |
|---|---|
| screens/ExploreScreen.jsx | Explore entry screen |
| ui/SearchScreen.view.jsx | Search results view |

### UI Components
| File | Role |
|---|---|
| ui/ActorSearchResultRow.jsx | Actor result row |
| ui/CitizensRow.jsx | Citizens (user actors) row |
| ui/EmptyState.jsx | Empty search state |
| ui/ExploreFeed.jsx | Explore feed composition |
| ui/FeatureSearchResultRow.jsx | Featured result row |
| ui/FeaturedResultCard.jsx | Featured result card |
| ui/FilterTabs.jsx | Search filter tab bar |
| ui/PostCard.jsx | Post result card |
| ui/ResultList.jsx | Generic result list |
| ui/VportsRow.jsx | VPORT result row |
| ui/features/WanderCardSearch.jsx | Wander result card |

### Config
| File | Role |
|---|---|
| ui/index.jsx | Route barrel — declares /explore; `public: false` flag (conflicts with scanner public classification) |
| styles/explore-modern.css | Explore UI styles |

## Route Classification Conflict

| Source | Classification |
|---|---|
| Scanner (route-map) | public |
| ui/index.jsx barrel | `public: false` |

Needs reconciliation — /explore access level is ambiguous.

## Security Flags

- **THOR BLOCKER** MEDIUM: VEN-EXPLORE-003 / BW-EXPLORE-005 — raw UUID post IDs exposed in /posts/{post.id} navigation; raw actor_id exposed in /profile/{actor_id} as fallback when username is null; adversarially confirmed BYPASSED; violates platform no-raw-IDs-in-URLs policy
- INFO: Route classification conflict — /explore declared `public: false` in barrel but scanner classifies as public; resolve before release

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Replace /posts/{post.id} with /posts/{post.slug} in all result navigation
- [ ] Replace /profile/{actor_id} fallback with slug or handle graceful error when username null
- [ ] Reconcile /explore route public:false vs scanner public classification
