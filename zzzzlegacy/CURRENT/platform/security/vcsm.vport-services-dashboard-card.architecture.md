# MODULE ARCHITECTURE REPORT

**Module:** vport-services-dashboard-card
**Application Scope:** VCSM
**Module Type:** Feature module — VPORT type sub-module
**Primary Root:** `apps/VCSM/src/features/`
**Scan Date:** 2026-05-23
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** INCOMPLETE

---

## PURPOSE

The Services card is the VPORT dashboard module responsible for:

- Displaying the enabled services catalog for a VPORT actor (viewer path)
- Allowing the VPORT owner to toggle which services are enabled (owner path)
- Merging a global service catalog (`service_catalog`) with per-actor overrides (`services`)
- Enriching locksmith-type VPORTs with operational metadata (ETA, pricing, emergency flags)
- Routing the save mutation through controller-layer ownership verification before writing to `vc`/`vport` schemas

Entry point for dashboard context: `VportDashboardServicesScreen.jsx`
Shared view also consumed via profile card stack: `VportServicesView.jsx`

---

## OWNERSHIP

**Primary Owner:** `apps/VCSM/src/features/profiles/kinds/vport/`
**Secondary Consumer:** `apps/VCSM/src/features/dashboard/vport/`
**Cross-Feature Dependency:** `apps/VCSM/src/features/booking/adapters/booking.adapter` (ownership assertion on write path)

---

## ENTRY POINTS

| Entry Point | File | Context |
|---|---|---|
| Dashboard route screen | `dashboard/vport/screens/VportDashboardServicesScreen.jsx` | Authenticated owner dashboard |
| Shared view (via adapter) | `profiles/adapters/kinds/vport/screens/services/view/VportServicesView.adapter.js` | Profile card stack, public + owner |

---

## LAYER MAP

```
DAL
  profiles/kinds/vport/dal/services/readVportTypeByActorId.dal.js
  profiles/kinds/vport/dal/services/readVportServicesByActor.dal.js
  profiles/kinds/vport/dal/services/readVportServiceCatalogByType.dal.js
  profiles/kinds/vport/dal/services/readVportServiceAddonsByActor.dal.js
  profiles/kinds/vport/dal/services/upsertVportServicesByActor.dal.js
  ── DUPLICATE (dashboard) ──
  dashboard/vport/dal/read/vportServices.read.dal.js

Model
  profiles/kinds/vport/model/services/vportService.model.js
  profiles/kinds/vport/model/services/vportServiceCatalogFallback.model.js
  ── MISPLACED (in screen folder) ──
  profiles/kinds/vport/screens/services/model/vportServicesEnabledMap.model.js

Controller
  profiles/kinds/vport/controller/services/getVportServices.controller.js        (read)
  profiles/kinds/vport/controller/services/upsertVportServices.controller.js     (write)
  ── DUPLICATE (dashboard) ──
  dashboard/vport/controller/listVportServicesForProfile.controller.js

Hook
  profiles/kinds/vport/hooks/services/useVportServices.js                        (read)
  profiles/kinds/vport/hooks/services/useUpsertVportServices.js                  (write)
  dashboard/vport/hooks/useVportOwnership.js                                     (ownership gate)

Adapter
  profiles/adapters/kinds/vport/screens/services/view/VportServicesView.adapter.js
  profiles/adapters/kinds/vport/hooks/services/useUpsertVportServices.adapter.js

Component
  profiles/kinds/vport/screens/services/components/VportServicesPanel.jsx
  profiles/kinds/vport/screens/services/components/VportServicesHeader.jsx
  profiles/kinds/vport/screens/services/components/VportServicesEmptyState.jsx
  profiles/kinds/vport/screens/services/components/VportServicesCategorySection.jsx
  profiles/kinds/vport/screens/services/components/VportServicesBadge.jsx
  profiles/kinds/vport/screens/services/components/VportServicesSkeleton.jsx
  profiles/kinds/vport/screens/services/components/owner/VportServicesOwnerPanel.jsx
  profiles/kinds/vport/screens/services/components/owner/VportServicesOwnerCategorySection.jsx
  profiles/kinds/vport/screens/services/components/owner/VportServicesOwnerToolbar.jsx

View Screen
  profiles/kinds/vport/screens/services/view/VportServicesView.jsx

Final Screen
  dashboard/vport/screens/VportDashboardServicesScreen.jsx
```

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Clear read/write dual-path | — |
| Owner defined | PARTIAL | profiles/kinds/vport owns, but dashboard has shadow controller | Duplicate ownership |
| Entry points mapped | PASS | Dashboard screen + shared adapter | — |
| Controllers present/delegated | PARTIAL | Two controller implementations for reads | `listVportServicesForProfile` is redundant |
| DAL/repository present/delegated | PARTIAL | Two DAL read paths exist | `vportServices.read.dal.js` duplicates core DAL |
| Models/transformers present | PARTIAL | Model file misplaced inside screen folder | `vportServicesEnabledMap.model.js` must move to `model/services/` |
| Hooks/view models present | PASS | useVportServices + useUpsertVportServices | — |
| Screens/components present | PASS | Full viewer + owner component stack | — |
| Services/adapters present | PARTIAL | Adapters are pure re-exports with no transformation logic | Low architectural value; document intent |
| Database objects mapped | PARTIAL | Tables known; schema boundary split (vc + vport) | RLS assumption gaps — see Venom |
| Authorization path mapped | PARTIAL | Write path has `assertActorOwnsVportActorController`; read `asOwner` flag is UI-trusted | Read path has no server-side ownership gate |
| Cache/runtime behavior mapped | PASS | 60s TTL cache in `getVportServicesController`; bypassed for owner mode | — |
| Error/loading/empty states mapped | PASS | Skeleton, empty state, error surfaces present | — |
| Documentation linked | FAIL | No Logan doc for this specific module | Needs `logan/vcsm/vport/vcsm.vport.services.md` |
| Tests/validation noted | FAIL | No test files found | — |
| Native parity noted | PARTIAL | No native parity doc | N/A for now |
| Engine dependencies mapped | PASS | No engine dependency — owns all layers directly | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `vportSchema` (vportClient) | database | DAL → DB | YES | vport schema client |
| `supabase` (vc schema) | database | DAL → DB | YES | vc.actors read in readVportTypeByActorId |
| `booking/adapters/booking.adapter` | feature | controller → adapter | PARTIAL | Cross-feature: profiles controller → booking adapter for ownership assert |
| `profiles/kinds/vport/model/` | model | controller → model | YES | — |
| `profiles/kinds/vport/dal/services/` | dal | controller → dal | YES | — |
| `shared/lib/ttlCache` | shared | controller → shared | YES | — |
| `state/identity/identityContext` | state | hook → context | YES | — |
| `dashboard/vport/controller/` | feature | dashboard controller → dashboard DAL | WARN | Shadow controller should delegate to canonical controller |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `vport.services` | read/write | vport schema | readVportServicesByActor, upsertVportServicesByActor, vportServices.read.dal | Scoped by profile_id (internal); exposed by actorId externally |
| `vport.service_catalog` | read | vport schema | readVportServiceCatalogByType | Public catalog; no owner filter needed |
| `vport.service_addons` | read | vport schema | readVportServiceAddonsByActor | Scoped by profile_id |
| `vport.profiles` | read | vport schema | 3 separate DAL resolveProfileId() calls | profileId resolved 3× independently per load |
| `vport.profile_categories` | read | vport schema | readVportTypeByActorId | Resolves vport_type for catalog matching |
| `vc.actors` | read | vc schema | readVportTypeByActorId, assertActorOwnsVportActorController | Cross-schema read |
| `vc.actor_owners` | read | vc schema | readActorOwnerLinkByActorAndUserProfile (in booking feature) | Ownership record |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | `VportDashboardServicesScreen` exists and handles `actorId` param | — |
| Loading state | PASS | `SkeletonCardList` while identity/ownership loading; `VportServicesSkeleton` while data loads | — |
| Empty state | PASS | `VportServicesEmptyState` component present | — |
| Error state | PASS | Error surfaces in panel and view | — |
| Auth/owner gate | PARTIAL | Dashboard screen checks `isOwner` (hook); write controller verifies independently | Read `asOwner` flag not server-verified |
| Cache behavior | PASS | 60s TTL, viewer only, bypassed for owner | — |
| Hot path identified | YES | 4–6 DB queries on first load (see N+1 warnings) | HIGH performance risk |
| LOKI/KRAVEN handoff | RECOMMENDED | Hot path not runtime-traced | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | `logan/vcsm/vport/vcsm.vport.services.md` | MISSING |
| Ownership record | `vcsm.vport-dashboard.architecture.md` (partial) | PARTIAL |
| Security audit | — | MISSING → run /Venom |
| Runtime audit | — | MISSING → run /Loki |
| Performance audit | — | MISSING → run /Kraven |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | N/A | No engine dependency |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Server-side ownership verification on read `asOwner` path | CRITICAL | `asOwner` is caller-provided from UI; controller trusts it without DB check; exposes disabled/inactive services to any caller claiming ownership | Venom + Controller layer |
| Eliminate duplicate read controller (`listVportServicesForProfile`) | HIGH | Two diverging implementations of the same read; dashboard controller does not merge catalog; returns raw DB rows without model transforms | Ironman + Wolverine |
| Move `vportServicesEnabledMap.model.js` out of screen folder | HIGH | Model living inside `screens/services/model/` violates layer responsibility contract | SENTRY |
| Centralize `resolveProfileId` to eliminate triple N+1 profile lookup | HIGH | Every services load fires 3 separate `profiles.select('id').eq('actor_id', actorId)` queries | Kraven |
| Remove `console.warn` from `VportServicesOwnerToolbar.jsx` | MEDIUM | Debug logging rule violation — must never reach production console | — |
| Move locksmith enrichment logic from `VportServicesView.jsx` to controller | MEDIUM | View screen is doing business logic (looping services, building meta strings, conditional type checks) | SENTRY |
| Move `isOwner` string comparison out of `VportServicesView.jsx` | MEDIUM | Ownership calculation is business logic; should be in controller, not view screen | SENTRY |
| Create Logan doc for this module | MEDIUM | No canonical documentation | Logan |
| Actor kind validation at dashboard screen entry | LOW | `actorId` from URL params not validated as vport kind before rendering | — |

---

## MODULE BOUNDARY WARNINGS

### WARNING 1 — Cross-Feature Direct Import

```
LOCATION:   apps/VCSM/src/features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js
MODULE:     vport-services / write controller
CURRENT:    import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter"
EXPECTED:   Either move assertActorOwnsVportActorController to a shared identity/actor utility or create a dedicated ownership adapter
RISK:       profiles feature controller directly depends on booking feature's adapter — introduces coupling; changes to booking.adapter can break services write path silently
SUGGESTED:  Extract assertActorOwnsVportActorController to engines/identity/src/services/ownershipService.js or a shared actors adapter
```

### WARNING 2 — Duplicate Controller Boundary

```
LOCATION:   apps/VCSM/src/features/dashboard/vport/controller/listVportServicesForProfile.controller.js
MODULE:     dashboard/vport (shadow controller)
CURRENT:    Independent read controller using profileId-based DAL, no catalog merge, no model transforms
EXPECTED:   Dashboard should consume canonical getVportServicesController from profiles/kinds/vport/controller/services/
RISK:       Diverging implementations; dashboard read path returns raw DB shape vs model-transformed shape from canonical controller
SUGGESTED:  Delete listVportServicesForProfile.controller.js; route through canonical controller
```

### WARNING 3 — Model File in Screen Layer

```
LOCATION:   apps/VCSM/src/features/profiles/kinds/vport/screens/services/model/vportServicesEnabledMap.model.js
MODULE:     vport-services
CURRENT:    Pure model functions (buildEnabledMap, applyEnabledMapToServices, mapsEqual) live inside screens/services/model/
EXPECTED:   All model files must live in model/ layer — profiles/kinds/vport/model/services/
RISK:       Other screens/features cannot reuse these transforms without importing from screen folder
SUGGESTED:  Move to profiles/kinds/vport/model/services/vportServicesEnabledMap.model.js
```

### WARNING 4 — Business Logic in View Screen

```
LOCATION:   apps/VCSM/src/features/profiles/kinds/vport/screens/services/view/VportServicesView.jsx
MODULE:     vport-services
CURRENT:    VportServicesView computes: isOwner (actorId string comparison), ownerUiEnabled, locksmith enrichment loop (build meta parts string), draft state (useEffect + useState), dirty tracking
EXPECTED:   View Screen = hooks + composition only; business rules belong in controller
RISK:       Screen layer owns business rules — violates layering contract; logic is not testable, not reusable
SUGGESTED:  Extract ownership, locksmith enrichment, and draft logic to controller/model layer
```

### WARNING 5 — console.warn in Production Component

```
LOCATION:   apps/VCSM/src/features/profiles/kinds/vport/screens/services/components/owner/VportServicesOwnerToolbar.jsx:24
MODULE:     vport-services owner UI
CURRENT:    console.warn("[VportServicesOwnerToolbar] Save blocked:", reasons, ...)
EXPECTED:   No console.log/warn/error in production; debug output must use dev-only screen render per project rules
RISK:       Debug information leaks to browser console in production
SUGGESTED:  Replace with dev-only guard (process.env.NODE_ENV !== 'production') or remove entirely
```

---

## N+1 QUERY WARNINGS

### N+1 — Triple Profile Resolution on Every Load

```
PATTERN:    Three independent DAL files each resolve profileId from actorId via a separate DB query
LOCATION 1: readVportServicesByActor.dal.js → resolveProfileId(actorId)
LOCATION 2: readVportServiceAddonsByActor.dal.js → resolveProfileId(actorId)
LOCATION 3: upsertVportServicesByActor.dal.js → resolveProfileId(actorId)

On a single getVportServicesController call, locations 1 + 2 fire in Promise.all → 2 parallel profileId lookups
On upsert, location 3 fires → 1 more profileId lookup

Total on first viewer load (no vportType cache): 6 DB round-trips
  1. vc.actors (readVportTypeByActorId step 1)
  2. vport.profile_categories (readVportTypeByActorId step 2)
  3. vport.service_catalog (parallel)
  4. vport.profiles (readVportServicesByActor.resolveProfileId — parallel)
  5. vport.profiles (readVportServiceAddonsByActor.resolveProfileId — parallel to #4)
  → Then: vport.services + vport.service_addons (after profileId resolves)

SUGGESTED:  Resolve profileId once in getVportServicesController and pass it to DAL methods;
            or create a JOIN-based view/RPC that returns services+addons by actor_id directly
HANDOFF:    /Kraven
```

---

## DEAD CODE SIGNALS

| File | Signal | Classification |
|---|---|---|
| `dashboard/vport/dal/read/vportServices.read.dal.js` | Only consumed by duplicate dashboard controller | LIKELY DEAD if dashboard controller is removed |
| `dashboard/vport/controller/listVportServicesForProfile.controller.js` | Parallel implementation of canonical controller; not consumed by dashboard screen | DUPLICATE — dashboard screen uses profiles adapter |
| Adapter files (VportServicesView.adapter.js, useUpsertVportServices.adapter.js) | Pure re-exports, no transformation | LOW VALUE — document or collapse |

---

## SPAGHETTI SCORE

```
MODULE:     vport-services-dashboard-card
SCORE:      WATCH
REASONS:
  - Duplicate controller and DAL paths (dashboard vs profiles feature)
  - Model file misplaced in screen layer
  - Business logic in view screen (ownership calculation, locksmith enrichment)
  - Cross-feature hard coupling (profiles controller → booking adapter)
  - Triple profileId resolution (N+1 pattern)
RELEASE RISK: LOW-MEDIUM — module functions but structural debt will compound if the dashboard shadow controller diverges further
```

---

## CODE HEALTH METRICS

| Module | Files | Layers | Cross-Feature Imports | N+1 Signals | Dead Code Signals | Spaghetti Score |
|---|---:|---:|---:|---:|---:|---|
| vport-services (canonical) | 18 | 7/7 present | 1 (booking adapter) | 3 (triple profileId) | 0 | WATCH |
| dashboard/vport services shadow | 3 | 2/7 (controller + DAL only) | 0 | 1 (profile then services) | 2 (controller + DAL likely dead) | WATCH |

---

## FINAL MODULE STATUS

**INCOMPLETE**

The module is functionally operational for viewer + owner paths but has:
- An unverified trust boundary on the read `asOwner` flag
- A duplicate shadow controller in the dashboard feature that diverges from canonical
- A misplaced model file
- Business logic embedded in the view screen layer
- A console.warn in a production component
- N+1 profile resolution pattern on every cold load

---

## RECOMMENDED HANDOFFS

| Command | Reason |
|---|---|
| **VENOM** | Read `asOwner` flag not server-verified; RLS assumption gaps; cross-feature ownership assertion chain |
| **KRAVEN** | N+1 triple profileId resolution; 6 DB round-trips on first load; hot path optimization |
| **SENTRY** | Model in screen folder; business logic in view screen; layer boundary violations |
| **IRONMAN** | Duplicate dashboard controller; ownership of shadow controller vs canonical |
| **LOGAN** | Missing Logan documentation for this module |

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P0 | Add server-side ownership gate to read `asOwner` path OR document RLS protection explicitly | Security trust boundary | VENOM → Wolverine |
| P1 | Delete/merge `listVportServicesForProfile.controller.js` into canonical controller | Duplicate diverging implementation | IRONMAN → Wolverine |
| P1 | Move `vportServicesEnabledMap.model.js` to `model/services/` | Layer contract violation | SENTRY |
| P1 | Extract locksmith enrichment + isOwner check from `VportServicesView.jsx` to controller | View screen doing business logic | SENTRY |
| P2 | Centralize profileId resolution to eliminate N+1 triple lookup | Performance | KRAVEN |
| P2 | Remove `console.warn` from `VportServicesOwnerToolbar.jsx` | Debug logging rule | — |
| P3 | Create Logan doc at `logan/vcsm/vport/vcsm.vport.services.md` | Documentation gap | LOGAN |
| P3 | Validate `actorId` URL param is a vport-kind actor at screen entry | Edge case correctness | — |
