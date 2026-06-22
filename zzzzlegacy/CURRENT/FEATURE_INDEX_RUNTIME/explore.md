# Runtime Feature Index: explore

## Metadata
| Field | Value |
|---|---|
| Feature | explore |
| CURRENT Folder | CURRENT/features/explore |
| Source Folder | apps/VCSM/src/features/explore |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |

## Source Inventory
| Layer | Count | Key Files |
|---:|---:|---|
| Controllers | 2 | `searchResults.controller.js`, `searchTabs.controller.js` |
| DALs | 1 | `search.dal.js` |
| Hooks | 3 | `useSearchScreenController.js`, `useSearchActor.js`, `useSearchTabsActor.js` |
| Models | 1 | `search.model.js` |
| Screens | 1 | `screens/ExploreScreen.jsx` |
| Components | 11 | `SearchScreen.view.jsx`, `ResultList.jsx`, `ExploreFeed.jsx`, `ActorSearchResultRow.jsx`, `PostCard.jsx`, `FeaturedResultCard.jsx`, `FilterTabs.jsx`, `CitizensRow.jsx`, `VportsRow.jsx`, `EmptyState.jsx`, `WanderCardSearch.jsx` |
| Use Cases | 1 | `usecases/search.usecase.js` (DEAD — not consumed) |
| Adapters | 0 | None |
| Routes | 1 | `/explore` (auth-required; exported from `ui/index.jsx`) |
| Tests | 0 | None found |

## Route / Screen Map
| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| `/explore` | `apps/VCSM/src/features/explore/screens/ExploreScreen.jsx` | Auth | `public: false` in `ui/index.jsx`; no controller-level auth gate |
| `SearchScreen` (view) | `apps/VCSM/src/features/explore/ui/SearchScreen.view.jsx` | Auth (inherited) | Active search UI; renders `ResultList` when searching, `OnboardingCardsView` + `ExploreFeed` when idle |
| `ExploreFeed` (view) | `apps/VCSM/src/features/explore/ui/ExploreFeed.jsx` | Auth (inherited) | Discovery feed — permanently disabled via `SHOW_EXPLORE_DISCOVERY_BLOCKS = false` |

## Mutation Surface Map
| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| `hydrateActorsByIds` (fire-and-forget) | `apps/VCSM/src/features/explore/controller/searchResults.controller.js` | Engine cache warm (write to hydration cache) | N/A — no ownership scope | LOW — cache warm only, failure silently swallowed |

**Note:** The explore feature is primarily read-only. The only write-adjacent operation
is a fire-and-forget hydration cache warm in `searchResults.controller.js`. No direct
DB mutations occur within this feature.

## Security-Sensitive Surface Map
| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| `identity.search_actor_directory` RPC call | `apps/VCSM/src/features/explore/dal/search.dal.js` | MEDIUM | Passes `p_viewer_actor_id` — server applies visibility rules; private profiles may be filtered by RPC, not by client |
| `vc.posts` text search (`ilike`) | `apps/VCSM/src/features/explore/dal/search.dal.js` | LOW | Filters `deleted_at IS NULL` and `is_hidden = false`; no viewer-scoped filter — any authenticated user can query all non-hidden posts |
| `/explore` route auth boundary | `apps/VCSM/src/features/explore/ui/index.jsx` | MEDIUM | Route guard is the only auth enforcement; broken import path (`screen/` vs `screens/`) in barrel could silently drop route registration |
| `localStorage` filter persistence | `apps/VCSM/src/features/explore/hooks/useSearchScreenController.js` | LOW | Saves/reads active filter tab to `localStorage` key `search:lastFilter`; no PII stored |
