# Runtime Feature Index: ads

## Metadata
| Field | Value |
|---|---|
| Feature | ads |
| CURRENT Folder | CURRENT/features/ads |
| Source Folder | apps/VCSM/src/features/ads |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |

## Source Inventory
| Layer | Count | Key Files |
|---:|---:|---|
| Controllers | 0 | No controller/ folder — use-cases fill this role |
| Use-Cases | 1 | adPipeline.usecase.js (7 exported functions) |
| DALs | 1 | ad.storage.dal.js |
| API Shim | 1 | ad.api.js (pass-through to DAL) |
| Hooks | 2 | useVportAds.js, useDesktopBreakpoint.js (re-export) |
| Models | 2 | ad.model.js, vportAdsSettingsShell.model.js |
| Screens | 2 | VportAdsSettingsScreen.jsx, adsScreens.js (barrel) |
| Components | 3 | ui/components.jsx (AdStatusPill, AdsEmptyState, AdsList, AdEditor), ui/adsPipeline.ui.js (re-export), ui/VportAdsBackButton.jsx |
| Adapters | 2 | adapters/hooks/useVportAds.adapter.js, adapters/widgets/OnemoredaysAd.adapter.js |
| Widgets | 1 | widgets/OnemoredaysAd.jsx |
| Lib / Validation | 1 | lib/ad.validation.js |
| Constants | 1 | constants.js |
| Feature Entry | 1 | ads.feature.js |
| Tests | 0 | No test files found |

## Route / Screen Map
| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| `/ads/vport/:actorId` | apps/VCSM/src/features/ads/screens/VportAdsSettingsScreen.jsx | Owner (actorId from params or identity fallback) | No server-side ownership verification; actorId trusted from route params |

## Mutation Surface Map
| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| `saveDraftUseCase` | usecases/adPipeline.usecase.js | localStorage upsert | NO | actorId not verified at write — trusted from caller |
| `publishAdUseCase` | usecases/adPipeline.usecase.js | localStorage upsert (status=active) | NO | actorId not verified at write |
| `pauseAdUseCase` | usecases/adPipeline.usecase.js | localStorage upsert (status=paused) | NO | actorId not verified at write |
| `archiveAdUseCase` | usecases/adPipeline.usecase.js | localStorage upsert (status=archived) | NO | actorId not verified at write |
| `deleteAdUseCase` | usecases/adPipeline.usecase.js | localStorage delete | NO | id not verified against actor ownership |
| `upsertAd` | dal/ad.storage.dal.js | localStorage write | NO | No ownership check in DAL |
| `removeAd` | dal/ad.storage.dal.js | localStorage delete | NO | No ownership check in DAL |

**Note:** All mutations are localStorage-only. Server-side risk is zero in current state. Risk materializes if/when migrated to Supabase without adding gates.

## Security-Sensitive Surface Map
| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| actorId trust from route params | screens/VportAdsSettingsScreen.jsx L19 | LOW (localStorage only) | `const actorId = actorIdParam \|\| identity?.actorId \|\| null` — no ownership assertion |
| URL navigation via `window.open` | widgets/OnemoredaysAd.jsx | LOW | `toSafeExternalUrl()` validates http/https protocol before opening — adequate for static widget |
| `destinationUrl` / `mediaUrl` user input | lib/ad.validation.js | LOW | `isValidHttpUrl()` validates protocol — no SSRF risk at localStorage level, but needs review if server-side rendering is added |

## Engine Dependencies
None.

## Cross-Feature Import Map
| Import Direction | Feature / Path | What | Risk |
|---|---|---|---|
| ads → identity | @/state/identity/identityContext | useIdentity() | Standard — no risk |
| ads → shared | @/shared/hooks/useDesktopBreakpoint | breakpoint hook | Standard — no risk |
| ads → settings (CSS) | @/features/settings/styles/settings-modern.css | Stylesheet | Soft coupling — should migrate to shared styles |
| settings → ads | @/features/ads/adapters/widgets/OnemoredaysAd.adapter | widget | Correct adapter boundary usage |
| dashboard → ads | @/features/ads/adapters/hooks/useVportAds.adapter | hook | Correct adapter boundary usage |
