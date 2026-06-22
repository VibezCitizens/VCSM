# Identity Architecture Review

**Date:** 2026-06-06
**Type:** Read-only senior architecture audit
**Scope:** Full identity stack — engine / state / adapter / consumers / DAL / RLS
**Source evidence:** Direct source grep + file reads. No assumptions. Unknowns flagged explicitly.

---

## ARCHITECTURE VERDICT

```
PASS WITH RISKS — SYSTEMIC
```

The intended three-layer model (engine → state → adapter → consumers) is the correct design.
The engine governance layer is clean. But the feature adapter is being bypassed at scale across
50+ import sites in feature code. The scanner reports "0 violations" — that result is accurate
per the scanner's contract, but the scanner contract does not cover state-layer bypasses.
This is the single most important architectural finding in this review.

---

## CRITICAL FINDING — Scanner Blind Spot

**The scanner enforces the INTERNAL adapter boundary** (no feature code may import
`features/identity/dal/`, `features/identity/controller/`, etc. without going through the adapter).
It does NOT enforce that feature code must use the adapter instead of reaching into
`@/state/identity/identityContext` directly.

**Effect:** 50+ direct `@/state/identity/identityContext` imports across feature code are invisible
to the scanner. The "0 violations" verdict is true within the scanner's scope and false
within the intended architecture's scope.

**This review is the first complete mapping of the real bypass surface.**

---

## PART 1 — Source of Truth Audit

### The Actual Source of Truth Is Distributed Across Four Layers

No single file IS the source of truth. The system uses a chain of authorities:

| Authority | Layer | File | Responsibility |
|---|---|---|---|
| **Persistence authority** | Database | Supabase (`vc.actors`, `vc.actor_owners`, `platform.user_app_actor_links`) | What actor exists; what user owns what actor; what actor is active |
| **Resolution authority** | Engine | `engines/identity/` via `@identity` | Converts session → user → account → actor links → active actor |
| **Runtime authority** | State layer | `state/identity/identityContext.jsx` | Holds live React context; provides `useIdentity()` to all consumers |
| **Public contract authority** | Feature adapter | `features/identity/adapters/identity.adapter.js` | Governed surface — what consumers are allowed to access |

### If Forced To Choose ONE Source of Truth

```
state/identity/identityContext.jsx
```

This file is the runtime authority. It is what every consumer actually depends on — whether
they go through the adapter or bypass it. The engine resolves identity once per session; the
context holds and serves that resolved identity to 50+ consumers. If this file breaks,
everything breaks. If the adapter breaks, all 41 scanner-tracked consumers break. But 50+
additional sites reach `identityContext` directly, which means: **the real blast radius of
identityContext.jsx is larger than the blast radius of the adapter.**

### Layer Authority Summary

```
engines/identity/    — Resolution authority: converts session to active actor
state/identity/      — Runtime authority: holds identity; serves it; handles transitions
features/identity/   — Public contract authority: governed surface over state layer
Database             — Persistence authority: ground truth at rest
```

Who should consume each:
- Engine: only `state/identity/` internals (4 confirmed engine import sites — all correct)
- State layer: only via feature adapter by feature code — VIOLATED in 50+ sites
- Feature adapter: all 41 scanner-tracked consumers — PLUS the 50+ bypasses that should also use it
- Database: only via DAL layer — NOT directly from hooks or components

---

## PART 2 — Layer Ownership Matrix

### engines/identity/ (not read directly — accessed via @identity alias)

Not read directly in this review. Engine exports confirmed from import sites:

| Export | Consumed by | Classification |
|---|---|---|
| `configureIdentityEngine` | `features/identity/setup.js` | Infrastructure — setup only |
| `resolveAuthenticatedContext` | `state/identity/identity.controller.js`, `state/identity/queries/identityEngineQuery.js` | Infrastructure — resolution |
| `invalidateIdentityResultCache` | `state/identity/identityContext.jsx` | Infrastructure — cache |
| `switchActiveActor` | `state/identity/controller/switchActor.controller.js` | Infrastructure — actor preference write |

Engine classification: **Pure Infrastructure — cross-app, not VCSM-specific**

---

### state/identity/ — Ownership Matrix

| File | Classification | Role |
|---|---|---|
| `identityContext.jsx` | **Runtime Orchestrator** | Holds live identity state; provides React context; manages actor switching; handles auth lifecycle |
| `identitySelection.store.js` | **Infrastructure — Shared State** | Zustand store for active actor; accessible outside React via `.getState()` |
| `identity.controller.js` | **Controller** | Orchestrates engine call → DAL reads → hydration pipeline → returns identity |
| `identity.read.dal.js` | **DAL** | All identity DB reads; scoped queries only; no ownership decisions |
| `identity.model.js` | **Model** | Shape transformations: `toPublicIdentity`, `mapProfileActor`, `mapVportActor`, `isBlockedVportIdentity` |
| `identityStorage.js` | **Storage** | LocalStorage persistence for actor selection across sessions |
| `identitySelectors.js` | **Model / Selectors** | Identity predicates: `isUserActor`, `isVportActor`, `canCitizenBook`, `getActorId` |
| `identityResolutionSelfHeal.helper.js` | **Infrastructure** | Self-heal helper — resolution failure recovery |
| `identitySelfHeal.controller.js` | **Controller** | Self-heal controller — uses `@identity` engine |
| `identitySwitcher.jsx` | **UI Component** | Actor switcher — internal UI only |
| `IdentityDebugger.jsx` | **Dev Tooling** | Dev-only debugger — never ships to production |
| `useIdentityResolutionEffect.hook.js` | **Orchestration Hook** | Resolution side-effect logic extracted from identityContext |
| `useIdentitySync.js` | **Sync Hook** | Actor sync hook |
| `identity.controller.inflight.js` | **Infrastructure** | In-flight dedup + resolve count tracking |
| `queries/identityEngineQuery.js` | **Infrastructure** | React Query wrapper for engine resolution |
| `controller/switchActor.controller.js` | **Controller** | Actor switch logic — decoupled from React; writes platform preference |

### features/identity/ — Ownership Matrix

| File | Classification | Role |
|---|---|---|
| `adapters/identity.adapter.js` | **Public Contract** | Governed entry point — re-exports from state layer; THIS is what consumers should use |
| `adapters/identityOps.adapter.js` | **Public Contract** | Operations surface — re-exports bootstrap and directory refresh |
| `hooks/useIdentityOps.js` | **Hook** | Thin hook returning both ops controller functions |
| `controller/ensureVcsmPlatformBootstrap.controller.js` | **Controller** | Calls provision RPC; handles bootstrap errors |
| `controller/refreshActorDirectory.controller.js` | **Controller** | Calls directory refresh DAL; thin pass-through |
| `dal/provision.rpc.dal.js` | **DAL** | Calls `platform.provision_vcsm_identity` RPC |
| `dal/refreshActorDirectory.dal.js` | **DAL** | Calls `identity.refresh_actor_directory_row` RPC |
| `resolvers/vcsmIdentity.resolver.js` | **Resolver / Infrastructure** | VCSM-specific app context resolver injected into engine |
| `setup.js` | **Infrastructure — Setup** | Engine configuration at app startup; called once from `main.jsx` |

### features/hydration/ — Special Classification

`features/hydration/vcsmActorHydrator.js` imports directly from THREE state/identity internals:
- `@/state/identity/identity.read.dal` — 6 DAL functions
- `@/state/identity/identity.model` — 2 model functions
- `@/state/identity/identity.controller` — `resolveRealmId`

**Classification: Infrastructure Bridge — justified but ungoverned**

The hydration feature sits between the identity engine and the state controller. It is called by
`identity.controller.js` via `@hydration` → `hydrateActor()`. This means the dependency graph is:

```
state/identity/identity.controller.js
  → @hydration (engines/hydration/)
    → features/hydration/vcsmActorHydrator.js
      → @/state/identity/identity.read.dal  ← DAL access
      → @/state/identity/identity.model     ← Model access
      → @/state/identity/identity.controller ← Controller access (resolveRealmId)
```

This creates a structural coupling that is architecturally awkward but functionally correct.
The hydration feature is not a normal consumer — it is part of the identity resolution pipeline.
Its state/identity imports are more justified than a UI feature's bypass, but they are still
ungoverned by any adapter contract.

---

## PART 3 — Blast Radius Analysis

### Top 10 Highest-Risk Files

| Rank | File | Layer | Risk | Why |
|---|---|---|---|---|
| 1 | `state/identity/identityContext.jsx` | State | **CRITICAL** | 50+ direct imports (bypasses) + 41 adapter-mediated imports = entire app depends on this file's exports and internal behavior |
| 2 | `features/identity/adapters/identity.adapter.js` | Adapter | **CRITICAL** | All 41 scanner-tracked consumers fail if adapter changes; also the governance boundary for the platform |
| 3 | `state/identity/identity.read.dal.js` | DAL | **CRITICAL** | All identity reads go through here; RLS on `vc.actors` + `vc.actor_privacy_settings` failures cause PGRST116 at login |
| 4 | `features/identity/setup.js` | Setup | **CRITICAL** | If engine does not configure, ALL identity resolution fails before first render |
| 5 | `state/identity/identity.controller.js` | Controller | **HIGH** | Every login runs `loadDefaultIdentityForUser` through this controller; failure = null identity on login |
| 6 | `state/identity/identitySelection.store.js` | Store | **HIGH** | Shape change (`activeActorId` renamed) silently breaks `chat/setup.js` actor search; no compile error |
| 7 | `features/identity/dal/provision.rpc.dal.js` | DAL | **HIGH** | Platform bootstrap on every login; failure = user has no actor link = identity resolution returns null |
| 8 | `state/identity/identity.model.js` | Model | **HIGH** | `toPublicIdentity` defines the shape of `useIdentity().identity` — consumed by all 50+ bypass sites AND 41 adapter sites; shape change breaks everything |
| 9 | `state/identity/controller/switchActor.controller.js` | Controller | **HIGH** | Actor switching; if platform write fails, actor switch fails silently and user stays on wrong actor |
| 10 | `features/hydration/vcsmActorHydrator.js` | Infrastructure | **HIGH** | Every identity hydration call on login runs through here; reads from DAL and model directly; if model or DAL changes, hydration breaks |

### Full Blast Radius Detail

**`identityContext.jsx` — CRITICAL**
- Direct consumers: 50+ feature files importing `useIdentity` directly
- Adapter-mediated consumers: 41 features
- Runtime surfaces: every screen that reads actor identity; chat inbox; settings; notifications; profiles; dashboard; post; booking; upload; ads; block
- **If rewritten:** All 91+ consumer sites must be re-validated. ANY export shape change (e.g. removing `availableActors` from context value) silently breaks features that destructure it.

**`identity.adapter.js` — CRITICAL**
- Direct consumers: 41 (scanner-tracked)
- **If rewritten:** 41 consumers fail at compile. But: the 50+ bypass sites would be UNAFFECTED — they do not use the adapter. This reveals that the adapter is not actually protecting against identity breakage at scale.

**`identity.read.dal.js` — CRITICAL**
- Direct consumers: `identity.controller.js`, `features/hydration/vcsmActorHydrator.js`
- Indirect consumers: all 91+ identity consumers via the resolution pipeline
- **RLS risk:** A missing `actor_privacy_settings` row causes PGRST116 on `vc.actors` read via `.single()`. Identity load returns null. User appears logged out despite valid auth session.
- **If rewritten:** Every identity read changes behavior. RLS audit required before any change.

---

## PART 4 — Consumer Dependency Map

### Compliance Classification System

| Class | Definition |
|---|---|
| COMPLIANT | Imports from `@/features/identity/adapters/identity.adapter` |
| STATE_BYPASS | Imports `useIdentity` or other exports from `@/state/identity/identityContext` directly |
| STORE_BYPASS | Imports `useIdentitySelectionStore` from `@/state/identity/identitySelection.store` directly |
| DAL_BYPASS | Imports functions from `@/state/identity/identity.read.dal` directly |
| MODEL_BYPASS | Imports functions from `@/state/identity/identity.model` directly |
| CONTROLLER_BYPASS | Imports functions from `@/state/identity/identity.controller` directly |
| SELECTOR_BYPASS | Imports from `@/state/identity/identitySelectors` directly |
| DEPRECATED_BYPASS | Imports deprecated exports from `@/state/identity/identityContext` directly |

### Confirmed Bypass Sites — Source Evidence

**ads**
| File | Import Path | Symbol | Class | Risk |
|---|---|---|---|---|
| `ads/screens/VportAdsSettingsScreen.jsx:12` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |

**block**
| File | Import Path | Symbol | Class | Risk |
|---|---|---|---|---|
| `block/ui/BlockButton.jsx:19` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |

**chat**
| File | Import Path | Symbol | Class | Risk |
|---|---|---|---|---|
| `chat/inbox/hooks/useVexSettings.js:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `chat/setup.js:16` | `@/state/identity/identitySelection.store` | `useIdentitySelectionStore` | STORE_BYPASS | LOW-MEDIUM |

**dashboard**
| File | Import Path | Symbol | Class | Risk |
|---|---|---|---|---|
| `dashboard/vport/screens/VportDashboardScreen.jsx:6` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/settings/VportSettingsFinalScreen.jsx:3` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/settings/hooks/useSaveVportPublicDetailsByActorId.js:4` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/settings/hooks/useSaveVportSettings.js:5` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/bookings/VportDashboardBookingHistoryScreen.jsx:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/bookings/hooks/useQuickBookingModal.js:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/bookings/hooks/useVportBookingActions.js:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/calendar/hooks/useCalendarDashboard.js:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/exchange/VportDashboardExchangeScreen.jsx:6` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/gasprices/screens/VportDashboardGasScreen.jsx:6` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/gasprices/screens/VportGasPricesScreen.jsx:6` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/leads/VportDashboardLeadsFinalScreen.jsx:4` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/leads/hooks/useVportLeads.js:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/locksmith/VportDashboardLocksmithScreen.jsx:6` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/portfolio/VportDashboardPortfolioScreen.jsx:6` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/portfolio/hooks/usePortfolioItemSubmit.js:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/reviews/hooks/useVportReviews.js:1` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/schedule/hooks/useVportOwnerSchedule.js:3` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/vport/dashboard/cards/services/hooks/useVportServices.js:1` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/flyerBuilder/screens/VportActorMenuFlyerEditorScreen.jsx:5` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `dashboard/flyerBuilder/screens/VportActorMenuFlyerScreen.jsx:6` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |

**hydration** (Infrastructure bridge — different classification)
| File | Import Path | Symbol | Class | Risk |
|---|---|---|---|---|
| `hydration/vcsmActorHydrator.js:8` | `@/state/identity/identity.read.dal` | `readActorOwnerUserDAL`, `readActorPrivacyDAL`, `readIdentityActorByIdDAL`, `readProfileIdentityDAL`, `readUserActorByProfileIdDAL`, `readVportIdentityDAL` | DAL_BYPASS | **MEDIUM** — DAL dependency, not context |
| `hydration/vcsmActorHydrator.js:12` | `@/state/identity/identity.model` | `mapProfileActor`, `mapVportActor` | MODEL_BYPASS | **MEDIUM** — model dependency |
| `hydration/vcsmActorHydrator.js:15` | `@/state/identity/identity.controller` | `resolveRealmId` | CONTROLLER_BYPASS | **MEDIUM** — controller dependency |

**notifications**
| File | Import Path | Symbol | Class | Risk |
|---|---|---|---|---|
| `notifications/screen/views/NotificationsScreenView.jsx:3` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |

**post**
| File | Import Path | Symbol | Class | Risk |
|---|---|---|---|---|
| `post/postcard/ui/PostCard.view.jsx:16` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `post/postcard/ui/EditPost.jsx:7` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `post/postcard/hooks/usePostReactions.js:9` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `post/screens/PostFeed.screen.jsx:6` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `post/commentcard/ui/CommentCard.view.jsx:10` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `post/commentcard/ui/EditComment.jsx:7` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `post/commentcard/hooks/useCommentCard.js:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `post/commentcard/hooks/useCommentThread.js:4` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |

**profiles**
| File | Import Path | Symbol | Class | Risk |
|---|---|---|---|---|
| `profiles/kinds/vport/hooks/barbershop/usePublishBarbershopHoursPost.js:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `profiles/kinds/vport/hooks/barbershop/usePublishBarbershopPortfolioPost.js:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `profiles/kinds/vport/hooks/exchange/usePublishExchangeRatePost.js:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `profiles/kinds/vport/hooks/locksmith/useLocksmithOwner.js:6` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `profiles/kinds/vport/hooks/locksmith/usePublishLocksmithPost.js:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `profiles/kinds/vport/hooks/menu/usePublishMenuPost.js:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `profiles/kinds/vport/hooks/menu/useVportActorMenuCategoriesMutations.js:7` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `profiles/kinds/vport/hooks/menu/useVportActorMenuItemsMutations.js:7` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `profiles/kinds/vport/hooks/rates/useUpsertVportRate.js:3` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `profiles/kinds/vport/hooks/review/useVportReviews.js:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `profiles/kinds/vport/hooks/services/useUpsertVportServices.js:5` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.js:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `profiles/kinds/vport/screens/booking/hooks/useVportBookingView.js:33` | `@/state/identity/identitySelectors` | `canCitizenBook` | SELECTOR_BYPASS | LOW |
| `profiles/kinds/vport/screens/menu/VportMenuView.jsx:5` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `profiles/screens/views/ActorProfileFriendsView.jsx:14` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |

**settings**
| File | Import Path | Symbol | Class | Risk |
|---|---|---|---|---|
| `settings/privacy/hooks/useActorPrivacy.js:3` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `settings/account/hooks/useAccountController.js:5` | `@/state/identity/identityContext` | `useIdentityDisplayDeprecated` | DEPRECATED_BYPASS | **MEDIUM** — uses deprecated export |
| `settings/vports/hooks/useVportsController.js:5` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `settings/vports/hooks/useVportDirectoryVisibility.js:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `settings/vports/hooks/useVportBusinessCardSettings.js:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |

**upload**
| File | Import Path | Symbol | Class | Risk |
|---|---|---|---|---|
| `upload/hooks/useResolvedActor.js:2` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `upload/hooks/useUploadSubmit.js:3` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |
| `upload/ui/ActorPill.jsx:1` | `@/state/identity/identityContext` | `useIdentity` | STATE_BYPASS | LOW |

### Bypass Count Summary

| Bypass Type | Count | Risk |
|---|---|---|
| STATE_BYPASS (`useIdentity` via identityContext) | ~48 | LOW each — MEDIUM systemic |
| STORE_BYPASS (`useIdentitySelectionStore`) | 1 | LOW-MEDIUM |
| DAL_BYPASS (`identity.read.dal` in hydration) | 1 file, 6 functions | MEDIUM |
| MODEL_BYPASS (`identity.model` in hydration) | 1 file, 2 functions | MEDIUM |
| CONTROLLER_BYPASS (`identity.controller` in hydration) | 1 file, 1 function | MEDIUM |
| SELECTOR_BYPASS (`identitySelectors` direct) | 1 | LOW |
| DEPRECATED_BYPASS (`useIdentityDisplayDeprecated`) | 1 | MEDIUM |
| **Total** | **~55 bypass sites** | — |

### Scanner-Compliant Consumers (41 confirmed by scanner)

Chat 8 confirmed compliant from IDENTITY-005. Other compliant sites:
settings, notifications, profiles, auth lifecycle, initiation, shell, vport, professional,
dashboard, upload, post, join, feed — all scanner-confirmed 0 violations, file-level detail
UNKNOWN for most (IDENTITY-006 through IDENTITY-008 pending).

**Note:** Many features appear in BOTH columns — they have some files using the adapter
(scanner counts) and other files bypassing it directly. The scanner count and bypass count
are not mutually exclusive.

---

## PART 5 — Engine Governance Audit

### All `@identity` Engine Imports — Complete Source Inventory

| File | Export imported | Justified? | Should move? |
|---|---|---|---|
| `features/identity/setup.js` | `configureIdentityEngine` | **YES** — engine configuration is setup-only | No |
| `state/identity/identity.controller.js` | `resolveAuthenticatedContext` | **YES** — engine resolution is correct at controller level | No |
| `state/identity/identityContext.jsx` | `invalidateIdentityResultCache` | **YES** — cache invalidation on actor refresh is correct at context level | No |
| `state/identity/identitySelfHeal.controller.js` | UNKNOWN exact export | **LIKELY YES** — self-heal uses engine for re-resolution | Needs review |
| `state/identity/queries/identityEngineQuery.js` | `resolveAuthenticatedContext` | **YES** — React Query wrapper for engine resolution; duplicates controller but via React Query | No — different use case (React Query vs imperative) |
| `state/identity/controller/switchActor.controller.js` | `switchActiveActor` | **YES** — actor preference write goes through engine | No |

**Engine governance verdict: CLEAN**

All 6 `@identity` engine imports are in expected locations (state/identity/ internals + features/identity/setup.js). Zero engine alias imports exist in any feature code beyond `features/identity/`. The prior FEATURES_ARCHITECTURE_REVIEW.md claim of "16 @identity engine imports in chat" remains REFUTED by source (IDENTITY-005 confirmed 0 in chat).

**Answer: No feature code should import the engine directly.** The engine is an infrastructure
dependency of `state/identity/` only. The state layer is the only correct consumer of the engine.

---

## PART 6 — State Layer Audit

### Which files are canonical, implementation detail, or public runtime state

| File | Classification | Public? |
|---|---|---|
| `identityContext.jsx` | **CANONICAL RUNTIME** — the public identity surface | YES — but currently accessed directly by 50+ bypass sites |
| `identitySelection.store.js` | **Implementation detail** — store should be internal | NO — but accessed directly by `chat/setup.js` |
| `identity.controller.js` | **Implementation detail** — orchestration internal | NO — but accessed directly by `features/hydration/vcsmActorHydrator.js` |
| `identity.read.dal.js` | **Implementation detail** — DB access internal | NO — but accessed directly by `features/hydration/vcsmActorHydrator.js` |
| `identity.model.js` | **Implementation detail** — shape transformation internal | NO — but accessed directly by `features/hydration/vcsmActorHydrator.js` |
| `identityStorage.js` | **Implementation detail** — persistence internal | NO |
| `identitySelectors.js` | **Implementation detail** — predicates internal | NO — but accessed by `features/profiles/.../useVportBookingView.js` |
| All other files | **Implementation detail** | NO |

### Can state/identity/ be treated as internal infrastructure?

**Architecturally: YES. Practically: NO — not while 50+ feature files import from it directly.**

`state/identity/` SHOULD be internal infrastructure accessible only via `features/identity/adapters/`.
But the current codebase treats it as a public module. Every file in `state/identity/` is effectively
public because features reference it directly.

### Should feature code be allowed to import directly from state/identity/?

**No — with one exception.**

For `useIdentity` specifically: because `features/identity/adapters/identity.adapter.js` is a thin
re-export of `state/identity/identityContext`, a direct import today is functionally identical to
using the adapter. The risk is governance, not runtime. If the adapter ever adds middleware,
interceptors, or changes the re-export path, the bypass sites will not benefit.

For everything else in state/identity/ (DAL, model, controller, store, selectors): direct imports
by feature code are ungoverned and create invisible coupling. The hydration feature is a justified
exception due to its structural role in the resolution pipeline — but it should be documented as
an explicitly allowed bridge, not treated as a normal feature import.

---

## PART 7 — Adapter Boundary Audit

### What the adapter exposes

From source (identity.adapter.js):
```js
export { useIdentityOps } from '@/features/identity/hooks/useIdentityOps'
export { ensureVcsmPlatformBootstrap, refreshVcActorDirectory } from '@/features/identity/adapters/identityOps.adapter'
export { useIdentity, IdentityProvider } from '@/state/identity/identityContext'
```

The adapter re-exports five things:
1. `useIdentity` — from `state/identity/identityContext` (state layer)
2. `IdentityProvider` — from `state/identity/identityContext` (state layer)
3. `useIdentityOps` — from `features/identity/hooks/useIdentityOps`
4. `ensureVcsmPlatformBootstrap` — via ops adapter → controller → DAL
5. `refreshVcActorDirectory` — via ops adapter → controller → DAL

**Not exposed by adapter:**
- `useIdentitySelectionStore` (Zustand store)
- `identitySelectors` exports
- `useIdentityDisplayDeprecated` (deprecated)
- Any DAL function
- Any model function
- Any internal controller function

### Is the adapter a real boundary or a re-export layer?

**It is a re-export layer today. It is designed to be a real boundary.**

A re-export layer BECOMES a real boundary when:
1. It adds middleware, logging, or error handling between consumer and implementation
2. It changes what it re-exports without the consumer needing to know
3. It adds validation, access control, or type narrowing

Currently the adapter does none of these. `useIdentity` from the adapter is byte-for-byte
identical to `useIdentity` from `identityContext` directly.

**What value does the boundary provide today?**

1. **Discoverability** — a developer looking for identity APIs finds one file
2. **Future-proofing** — if `identityContext` is ever refactored, the adapter can maintain the same export surface
3. **Scanner enforcement** — the scanner CAN flag any feature code that imports `features/identity/dal/` directly (it cannot currently flag `state/identity/identityContext` imports)
4. **Intent signal** — importing from the adapter communicates "this is a consumer of the identity feature" — importing from the state layer directly communicates nothing

The adapter is a governance contract, not a runtime contract. Its value is proportional to
how consistently it is used. At 50+ bypass sites, the contract is not consistently enforced.

---

## PART 8 — Store Governance Audit

### Store File: `state/identity/identitySelection.store.js`

```js
export const useIdentitySelectionStore = create((set) => ({
  activeActorId: null,
  activeActorKind: null,
  activeActorLinkId: null,
  setActiveActor: ({ actorId, actorKind, actorLinkId }) =>
    set({ activeActorId: actorId, activeActorKind: actorKind, activeActorLinkId: actorLinkId }),
  clearActiveActor: () =>
    set({ activeActorId: null, activeActorKind: null, activeActorLinkId: null }),
}));
```

### Every confirmed consumer

| File | Usage pattern | Context |
|---|---|---|
| `chat/setup.js:16` | `useIdentitySelectionStore.getState().activeActorId` | Non-React async function (`searchActors`) called by chat engine configuration |
| `state/identity/identityContext.jsx` | UNKNOWN — likely accessed internally for sync | Internal state layer use |
| Other state/identity files | LIKELY — the store is the Zustand backing for the context | Internal |

**Confirmed external consumer:** 1 (`chat/setup.js`)

### Evaluation of Options

**Option A — Expose `getActiveActorId()` from adapter:**
```js
// In identity.adapter.js:
export function getActiveActorId() {
  return useIdentitySelectionStore.getState().activeActorId ?? null
}
```
Pros: Governs the surface. `chat/setup.js` gets a named API instead of depending on store shape.
If `activeActorId` is renamed in the store, only the adapter wrapper needs updating.
Cons: Expands the adapter surface with a non-React function. Changes the adapter's character
from "hooks and providers" to "hooks, providers, and utility functions."

**Option B — Document direct store access as allowed in setup files:**
Pros: Zero code change. Acknowledges the legitimate use case.
Cons: Creates a two-tier governance system (some files allowed to bypass, others not).
Future developers may cargo-cult the pattern into non-setup files.

**Option C — Leave as-is:**
Pros: No change.
Cons: The store shape is an implicit contract that can silently break `chat/setup.js` with no compile error. This is already the case.

### Recommendation: **Option A**

**Reason:** The store is an implementation detail that should not leak into feature code.
`getActiveActorId()` is a legitimate, named, stable API that communicates intent clearly.
The adapter already exports non-React controller functions (`ensureVcsmPlatformBootstrap`,
`refreshVcActorDirectory`) — adding a synchronous accessor is consistent with that pattern.
If the store field is renamed, the fix is in one place (the adapter wrapper) rather than
every setup file that reads it.

**Condition:** Before adding to adapter, confirm `getActiveActorId()` is the only non-React
identity accessor needed by setup files. Do not expand the pattern beyond proven need.

---

## PART 9 — DAL + Database Audit

### `state/identity/identity.read.dal.js`

| Function | Table | Schema | Filter | Ownership decision? |
|---|---|---|---|---|
| `readIdentityActorByIdDAL(actorId)` | `actors` | `vc` | `.eq('id', actorId)` | NO — reads only |
| `readIdentityActorsByIdsDAL(actorIds)` | `actors` | `vc` | `.in('id', actorIds)` | NO — reads only |
| `readProfileIdentityDAL(profileId)` | `profiles` | `public` (supabase default) | `.eq('id', profileId)` | NO — reads only |
| `readVportIdentityDAL(vportId)` | `profiles`, `profile_categories` | `vport` | `.eq('id', vportId)`, `.eq('profile_id', vportId)` | NO — reads only |
| `readActorOwnerUserDAL(actorId)` | `actor_owners` | `vc` | `.eq('actor_id', actorId)` | NO — reads only |
| `readActorPrivacyDAL(actorId)` | `actor_privacy_settings` | `vc` | `.eq('actor_id', actorId)` | NO — reads only |
| `readActorPrivacyDiagnosticDAL(actorId)` | `actor_privacy_settings` | `vc` | `.eq('actor_id', actorId)` | NO — dev diagnostic only |
| `readPreferredRealmByVoidStateDAL(isVoid)` | `realms` | `vc` | `.eq('is_void', isVoid)` | NO — reads only |
| `readFallbackRealmDAL()` | `realms` | `vc` | none — oldest realm | NO — reads only |
| `readUserActorByProfileIdDAL(profileId)` | `actors` | `vc` | `.eq('profile_id', profileId)`, `.eq('kind', 'user')` | NO — reads only |

**DAL compliance: CLEAN**
All functions take `actorId` or `profileId` as filter only. No ownership decisions. No user-scoped writes.
All guarded with `if (!actorId) return null` early exit.
All return `data ?? null` or `data ?? []` — no raw errors propagate to callers.

**`select('*')` usage: NONE confirmed** — all queries use explicit column lists.

### `features/identity/dal/provision.rpc.dal.js`

| Function | RPC | Schema | Parameters | Ownership decision? |
|---|---|---|---|---|
| `dalProvisionVcsmIdentity({ userId, actorId })` | `provision_vcsm_identity(p_user_id, p_actor_id)` | `platform` | userId + actorId | NO — ownership enforced inside RPC (GUARD 3) |

**DAL compliance: CLEAN**
Passes both params to RPC. Guards with `if (!userId) throw` and `if (!actorId) throw` before call.
Ownership is GUARD 3 inside the RPC — DAL does not make ownership decisions.

### `features/identity/dal/refreshActorDirectory.dal.js`

| Function | RPC | Schema | Parameters | Ownership decision? |
|---|---|---|---|---|
| `refreshActorDirectoryRow(actorDomain, actorId)` | `refresh_actor_directory_row(p_actor_domain, p_actor_id)` | `identity` | actorDomain + actorId | NO — assumed inside RPC |
| `refreshVcActorDirectory(actorId)` | via `refreshActorDirectoryRow` | `identity` | `'vc'` + actorId | NO |

**DAL compliance: CLEAN**
Guards: `if (!actorDomain \|\| !actorId) return { ok: false, error }` early exit.
Returns `{ ok: boolean, error? }` pattern — errors surface to caller without throwing.
No ownership decision made at DAL level.

**OPEN:** Whether the RPC itself enforces authentication and actor ownership — NO tracked
migration found. This is the highest-priority unknown in the RLS audit.

---

## PART 10 — RLS Audit Planning

### `vc.actors`

| Policy | Status | Evidence |
|---|---|---|
| SELECT (read) | **LIKELY YES** | `identity.controller.js:196` error path references `PGRST116` when `actor_privacy_settings` row is missing — implies RLS is active and filters via `can_view_actor()` function |
| INSERT | **UNKNOWN** | Auth onboarding creates actor rows. No tracked INSERT policy confirmed. |
| UPDATE | **PARTIAL** | `provision_vcsm_identity` RPC UPDATE runs as SECURITY DEFINER (now removed) and updates `user_app_account_id`. Direct UPDATE policy unknown. |
| DELETE | **UNKNOWN** | Soft-delete pattern used (`is_deleted = true`). Whether a DELETE policy or function exists is unknown. |
| Ownership enforcement | **YES for reads** via `can_view_actor()` | `actor_privacy_settings` row is a prerequisite — missing row causes RLS to block |
| DB audit needed | **YES** | Confirm `can_view_actor()` function definition; confirm INSERT/DELETE policy |

### `vc.actor_owners`

| Policy | Status | Evidence |
|---|---|---|
| SELECT (read) | **UNKNOWN** | Used inside `provision_vcsm_identity` GUARD 3 (reads all actor owners for ownership check). Whether authenticated clients can read directly is unknown. |
| INSERT | **UNKNOWN** | Auth onboarding creates actor owner rows. Policy not confirmed. |
| UPDATE | **UNKNOWN** | Not confirmed. |
| DELETE | **UNKNOWN** | Not confirmed. |
| Ownership enforcement | **YES inside RPC** only | RPC reads `WHERE user_id = v_caller_id` |
| DB audit needed | **YES — CRITICAL** | This table is the ownership model root — all ownership assertions derive from it |

### `vc.actor_privacy_settings`

| Policy | Status | Evidence |
|---|---|---|
| SELECT (read) | **LIKELY YES** | `readActorPrivacyDAL` reads it via authenticated client without service role |
| INSERT | **UNKNOWN** | New actors need a privacy settings row to pass `can_view_actor()`. Who creates it and under what policy is unknown. |
| UPDATE | **UNKNOWN** | `useActorPrivacy.js` in settings presumably updates this. Policy not confirmed. |
| DELETE | **UNKNOWN** | Not confirmed. |
| Ownership enforcement | **UNKNOWN** | |
| DB audit needed | **YES — HIGH PRIORITY** | A missing row causes identity resolution to fail with PGRST116. The INSERT path must be confirmed. |

### `platform.user_app_actor_links`

| Policy | Status | Evidence |
|---|---|---|
| SELECT (read) | **LIKELY YES** | `vcsmIdentity.resolver.js` reads this as the calling user (no SECURITY DEFINER). Read succeeds on login — implies SELECT policy exists. |
| INSERT | **INSIDE RPC** | Provisioning RPC handles INSERT. Direct client INSERT policy: UNKNOWN. |
| UPDATE | **UNKNOWN** | `switchActiveActor` (engine call) writes platform preference. Whether `user_app_actor_links` UPDATE has its own policy: UNKNOWN. |
| DELETE | **UNKNOWN** | Not confirmed. |
| Ownership enforcement | **PARTIAL** — RPC GUARD 3 + resolver scoped by `user_app_account_id` | |
| DB audit needed | **YES** | Confirm SELECT + UPDATE policies |

### `platform.user_app_accounts` + `platform.user_app_access` + `platform.user_app_preferences` + `platform.user_app_state`

| Table | INSERT | UPDATE | Evidence |
|---|---|---|---|
| `user_app_access` | `platform_user_app_access_insert_own` (migration 20260518050000) | `platform_user_app_access_update_own` (same) | Confirmed |
| `user_app_accounts` | `platform_user_app_accounts_insert_own` | `platform_user_app_accounts_update_own` | Confirmed |
| `user_app_preferences` | `platform_user_app_preferences_insert_own` | Pre-existing UPDATE policy (referenced in migration) | INSERT confirmed |
| `user_app_state` | `platform_user_app_state_insert_own` | Pre-existing UPDATE policy (referenced in migration) | INSERT confirmed |

**Platform tables verdict: PARTIALLY CONFIRMED** — INSERT + UPDATE policies for 4 tables confirmed
via `20260518050000`. SELECT policy existence: UNKNOWN for all four.

### `identity.actor_directory`

| Policy | Status | Evidence |
|---|---|---|
| All operations | **UNKNOWN** | No tracked migration found for this schema or table. `refresh_actor_directory_row` RPC writes to it — no authentication/ownership guard confirmed. |
| DB audit needed | **YES — HIGH PRIORITY** | No tracked migration. RPC governance unknown. |

### RPC Governance Summary

| RPC | Auth guard | Caller guard | Ownership guard | SECURITY DEFINER | search_path | Tracked migration |
|---|---|---|---|---|---|---|
| `platform.provision_vcsm_identity` | YES (GUARD 1) | YES (GUARD 2: p_user_id = auth.uid()) | YES (GUARD 3: actor_owners check) | **NO** (removed in 20260518050000) | YES (SET search_path) | YES — 20260518040000 + 20260518050000 |
| `identity.refresh_actor_directory_row` | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **NOT FOUND** |

---

## PART 11 — Single Orchestrator Evaluation

### Does identity benefit from a permanent orchestrator?

**YES — unconditionally.**

The findings in this review demonstrate exactly why:
1. The scanner reports "0 violations" while 55 bypass sites exist — without an orchestrator,
   this contradiction would never be discovered
2. The blast radius of `identityContext.jsx` is larger than the blast radius of the adapter —
   this is only visible when all consumers are mapped in one place
3. The hydration bridge is an ungoverned DAL/controller bypass that has legitimate justification —
   but without documentation, it looks like a bug to any future developer
4. The RLS audit has 4 UNKNOWN tables and 1 completely missing RPC migration — without a registry,
   these gaps stay invisible

### What must always be updated after every identity change?

1. **Blast radius matrix** — which files changed, what their consumers are
2. **Consumer dependency map** — new bypass sites added or existing ones patched
3. **DAL registry** — new tables or RPCs touched
4. **RLS checklist** — new policies required or existing ones changed
5. **Fix queue** — implementation status of known bypasses

### Can future identity work be safely performed without the orchestrator?

**No.** Without the orchestrator:
- A developer changing `identityContext.jsx` would test the 8 chat sites (via scanner) but miss
  the 50+ dashboard/post/profiles sites that bypass the adapter
- A developer adding `useIdentityDisplayDeprecated` to the adapter surface would not know
  that `settings/account/hooks/useAccountController.js` already uses the deprecated version
- A developer renaming `activeActorId` in the Zustand store would have no way to know that
  `chat/setup.js:16` silently depends on that field name

---

## PART 6 — Policy Decisions

### 1. Engine Access Policy (DECIDED)

```
@identity is ALLOWED only in:
  - features/identity/setup.js
  - state/identity/identity.controller.js
  - state/identity/identityContext.jsx
  - state/identity/identitySelfHeal.controller.js
  - state/identity/queries/identityEngineQuery.js
  - state/identity/controller/switchActor.controller.js

BANNED in all feature code outside features/identity/setup.js.
BANNED in all state/identity/ files not listed above.
```

Rationale: Engine governance is currently clean. All 6 confirmed import sites are correct.
The allow-list is the source of truth for future scanner rule updates.

### 2. State Layer Access Policy (DECISION NEEDED)

**Proposed policy:**
```
@/state/identity/identityContext — ALLOWED VIA ADAPTER ONLY
  Exception: hydration/vcsmActorHydrator.js (documented infrastructure bridge)

@/state/identity/identitySelection.store — ALLOWED VIA ADAPTER ONLY
  Exception: chat/setup.js pending IDENTITY-FIX-003 (after IDENTITY-FIX-002 decision)

@/state/identity/identity.read.dal — ALLOWED IN hydration/vcsmActorHydrator.js ONLY
  All other feature code: BANNED

@/state/identity/identity.model — ALLOWED IN hydration/vcsmActorHydrator.js ONLY
  All other feature code: BANNED

@/state/identity/identity.controller — ALLOWED IN hydration/vcsmActorHydrator.js ONLY
  All other feature code: BANNED

@/state/identity/identitySelectors — ALLOWED VIA ADAPTER ONLY (add selectors to adapter surface)
@/state/identity/identityContext (deprecated exports) — BANNED in all feature code
```

**Implementation:** This policy requires adding `canCitizenBook` from `identitySelectors` to
the adapter surface, and patching 50+ bypass sites from `@/state/identity/identityContext` to
`@/features/identity/adapters/identity.adapter`. All are 1-line changes per site with zero
behavior change.

### 3. Store Access Policy (DECISION NEEDED)

**Recommended: Option A** (expose `getActiveActorId()` from adapter)
See PART 8 for full justification.

### 4. Adapter Policy (DECIDED)

The adapter must remain the single governed entry point. Its current surface is:
`useIdentity`, `IdentityProvider`, `useIdentityOps`, `ensureVcsmPlatformBootstrap`, `refreshVcActorDirectory`

Additions that should be considered:
- `getActiveActorId()` — if Option A chosen (non-React store accessor)
- `canCitizenBook`, `isUserActor`, `isVportActor` — selectors needed by features
- Remove `useIdentityDisplayDeprecated` from being accessible anywhere

### 5. RLS Audit Policy (IMMEDIATE)

Priority order:
1. `identity.refresh_actor_directory_row` — NO tracked migration, unknown guards
2. `vc.actor_owners` — ownership model root, all policies UNKNOWN
3. `vc.actor_privacy_settings` — INSERT path unknown; missing row breaks identity resolution
4. `vc.actors` — INSERT/DELETE policy unknown
5. `platform.user_app_actor_links` — SELECT/UPDATE policy unknown

---

## PART 7 — Future-Proofing Verdict

### If the identity engine (`@identity`) changes drastically:

**What survives:**
- `features/identity/setup.js` breaks (configureIdentityEngine call changes)
- `state/identity/identity.controller.js` breaks (resolveAuthenticatedContext call changes)
- `state/identity/queries/identityEngineQuery.js` breaks (resolveAuthenticatedContext call changes)
- `state/identity/identityContext.jsx` breaks (invalidateIdentityResultCache changes)
- `state/identity/controller/switchActor.controller.js` breaks (switchActiveActor changes)
- All 91+ consumer features would be affected if resolution stops working

**What survives:** The DAL layer (DB reads), the model layer (shape functions), LocalStorage persistence, the provisioning RPC, and the directory refresh RPC — none of these depend on the engine directly.

**Containment:** Engine changes are contained to 6 files in state/identity/ + features/identity/setup.js. The adapter surface and consumer features do not import the engine.

### If `state/identity/` changes drastically:

**What breaks:**
- All 50+ STATE_BYPASS sites that import directly from state/identity/
- All 41 adapter-tracked consumers (via adapter re-export)
- The hydration bridge (DAL + model + controller imports)
- Total: 91+ consumer sites affected

**What survives:** The engine layer (unaffected), the RPC-based DAL (unaffected), LocalStorage API (unaffected)

**Containment:** POOR. Because the adapter re-exports from state/identity/, any state/identity/ change propagates to all consumers — both bypasses AND adapter-mediated consumers. The adapter provides zero insulation against state layer changes.

**Lesson:** The adapter's governance value is about import path uniformity and future extensibility — not about protecting against drastic state layer changes. Both paths (adapter and bypass) collapse when state/identity/ changes.

### If `features/identity/adapters/identity.adapter.js` changes drastically:

**What breaks:**
- All 41 scanner-tracked consumers (compile failures if exports are removed)

**What survives:**
- All 50+ bypass sites that import from `@/state/identity/identityContext` directly — they are UNAFFECTED by adapter changes

**Lesson:** The adapter does not protect the codebase from identity breakage. It only governs the import path for 41 sites. The other 50+ bypass sites are not governed by it.

### Where should future developers make changes first?

```
1. Read this orchestrator document before any identity change.
2. Modify the DATABASE LAYER (migrations) first — DB changes cascade up.
3. Then modify the DAL layer — match DB changes.
4. Then modify the STATE LAYER (identity.controller.js, identity.model.js) — match DAL changes.
5. Then update identityContext.jsx — all 91+ consumers depend on this file's exports.
6. Then update the feature adapter — ensure governed surface is updated to match.
7. Last: update consumer features — only after all lower layers are stable.

Never start from a consumer and work backwards.
The build order is: DB → DAL → Model → Controller → Context → Adapter → Consumers.
```

---

## Summary Tables

### Architecture Verdict by Layer

| Layer | Governance | Compliance | Risk |
|---|---|---|---|
| Engine (`@identity`) | Clean — 6 imports, all correct | COMPLIANT | LOW |
| State layer (`state/identity/`) | Intended to be internal — accessed by 50+ bypasses | **SYSTEMIC BYPASS** | HIGH |
| Feature adapter (`features/identity/adapters/`) | Correctly designed — thin re-export | RE-EXPORT ONLY — not a runtime boundary | MEDIUM |
| DAL layer | Clean — scoped queries, no ownership decisions | COMPLIANT | LOW |
| RLS layer | 5+ tables/RPCs with unknown policies | **AUDIT REQUIRED** | HIGH |
| Scanner contract | Enforces internal adapter boundary | DOES NOT detect state-layer bypasses | HIGH — silent gap |

### Overall Ratings

| Dimension | Rating | Finding |
|---|---|---|
| Single source of truth | DISTRIBUTED | 4 layers share authority; identityContext is the runtime root |
| Engine governance | PASS | 6 engine imports — all correct files |
| Adapter enforcement | FAIL | 50+ bypass sites; scanner does not detect state-layer bypasses |
| DAL compliance | PASS | All DALs scoped; no ownership decisions |
| RLS coverage | UNKNOWN | 5+ AUDIT REQUIRED items; 1 RPC has no tracked migration |
| Blast radius documentation | COMPLETE | 10 critical files ranked |
| Future-proofing | FRAGILE | State layer changes affect all 91+ consumers via two paths |
