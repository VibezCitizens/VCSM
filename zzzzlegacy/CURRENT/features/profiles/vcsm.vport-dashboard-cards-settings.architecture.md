# MODULE ARCHITECTURE REPORT

**Module:** VPORT Dashboard Cards — Individual Settings
**Application Scope:** VCSM
**Module Type:** Feature module — owner-gated dashboard with per-card individual settings
**Primary Root:** `apps/VCSM/src/features/dashboard/vport/`
**Secondary Root (settings infra):** `apps/VCSM/src/features/settings/vports/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

**Scan Date:** 2026-05-26
**Last Updated:** 2026-05-26 — All violations resolved. See FIX LOG below.
**ARCHITECT Scope Label:** VCSM

---

## PURPOSE

This module governs two tightly linked owner-only surfaces:

1. **VportDashboardScreen** — the landing screen for VPORT owners after clicking "Dashboard". Renders a type-aware grid of `DashboardCard` action tiles. Card set is computed from `vportType` and release flags. Each card navigates to a dedicated sub-screen or external route.

2. **VportSettingsScreen** — the individual card settings screen, reached via the "Settings" dashboard card. Controls:
   - Dashboard tab visibility preview (read-only label display)
   - TRAZE directory visibility toggle (show/hide in public directory)
   - Business card display toggles (identity, contact, action, section toggles per `vportType`)
   - Ads pipeline preview (feature-flagged, `vportAdsPipeline`)
   - Public VPORT details (name, address, phone, website, hours, highlights — via `VportAboutDetailsView`)

Both screens enforce actor-based ownership via `useVportOwnership` before rendering.

---

## OWNERSHIP

| Responsibility | Owner |
|---|---|
| Dashboard card grid | `VportDashboardScreen.jsx` |
| Card catalog definition | `buildDashboardCards.model.js` |
| Card set per vport type | `dashboardViewByVportType.model.js` |
| Settings screen orchestration | `VportSettingsScreen.jsx` |
| TRAZE visibility toggle | `VportSettingsTrazeCard.jsx` + `useVportDirectoryVisibility` |
| Business card display settings | `VportSettingsBusinessCard.jsx` + `useVportBusinessCardSettings` |
| Ads preview | `VportSettingsAdsPreview.jsx` (display only) |
| Settings persistence | `settings/vports/dal/vports.write.dal.js` |
| Default settings resolution | `public/vportBusinessCard/model/businessCardSettings.model.js` |
| Ownership gate | `useVportOwnership` → `checkVportOwnership.controller.js` → `actor_owners` |

---

## ENTRY POINTS

| Route | Final Screen | View Screen | Guard |
|---|---|---|---|
| `/actor/:actorId/dashboard` | `VportDashboardScreen` | *(combined — pending split)* | `useVportOwnership` + `useIdentity` |
| `/actor/:actorId/settings` | `VportSettingsFinalScreen` | `VportSettingsScreen` | `useVportOwnership` + `useIdentity` |

Both routes are lazy-loaded via `lazyApp.jsx` and registered in `routes/index.jsx`.
Settings route: `lazyApp.jsx` lazy-loads `VportSettingsFinalScreen` (gate), which
renders `VportSettingsScreen` (view) once ownership is confirmed.

---

## LAYER MAP

### DAL

| File | Methods | Tables |
|---|---|---|
| `settings/vports/dal/vports.read.dal.js` | `readVportBusinessCardSettingsDAL(vportId)` | `vport.profiles` → `id, business_card_settings` |
| `settings/vports/dal/vports.read.dal.js` | `readVportDirectoryStateDAL(vportId)` | `vport.profiles` → `id, directory_visible, directory_status` |
| `settings/vports/dal/vports.write.dal.js` | `setVportBusinessCardSettingsDAL(vportId, settings)` | `vport.profiles` → update `business_card_settings` |
| `settings/vports/dal/vports.write.dal.js` | `setVportDirectoryVisibleDAL(vportId, visible)` | `vport.profiles` → update `directory_visible`; `vport.profile_public_details` → sync `directory_visible` |

All read DALs enforce `owner_user_id = auth.uid()` in their WHERE clause.
All write DALs enforce `owner_user_id = auth.uid()` in their WHERE clause.

### Model

| File | Exports | Purpose |
|---|---|---|
| `dashboard/vport/screens/model/buildDashboardCards.model.js` | `CARD_CATALOG`, `getDashboardCardMetaByKey`, `buildDashboardCards` | Frozen card catalog (16 cards), card builder per type |
| `dashboard/vport/screens/model/dashboardViewByVportType.model.js` | `DASHBOARD_VIEW_PRESETS`, `normalizeVportType`, `resolveVportTypeGroup`, `getDashboardViewByVportType`, `getDashboardCardKeysByVportType` | 8 view presets, type→view resolution, release flag gating |
| `dashboard/vport/model/dashboardVportDetails.model.js` | `normalizeDashboardVportDetails` | Public details normalization (url, address, hours, socials) |
| `dashboard/vport/model/vportSettingsDraft.model.js` | `mapPublicDetailsToDraft` | Maps normalized details to editable draft shape |
| `dashboard/vport/screens/lib/vportSettingsValidation.js` | `normalizeAddress`, `hasCompleteAddress`, `getAddressValidationError`, `normalizePhoneDigits` | Form field validation — pure functions |
| `public/vportBusinessCard/model/businessCardSettings.model.js` | `DEFAULT_BUSINESS_CARD_SETTINGS`, `deepMergeSettings`, `getBusinessCardSettings`, `getSectionToggles` | Settings defaults, type overrides, deep merge logic |

> ⚠️ `vportSettingsValidation.js` is placed in `screens/lib/` — validation logic belongs in a model file, not inside `screens/`.

### Controller

| File | Exports | Auth Layer |
|---|---|---|
| `settings/vports/controller/vportBusinessCardSettings.controller.js` | `ctrlGetVportBusinessCardSettings`, `ctrlSetVportBusinessCardSettings` | DAL-level `owner_user_id` only |
| `settings/vports/controller/vportDirectoryVisibility.controller.js` | `ctrlGetVportDirectoryState`, `ctrlSetVportDirectoryVisible` | `assertActorOwnsVportActorController` (actor_owners check) + DAL `owner_user_id` |
| `settings/profile/controller/resolveVportIdByActorId.controller.js` | `ctrlResolveVportIdByActorId` | Cross-feature resolution (actorId → vportId) |
| `dashboard/vport/controller/checkVportOwnership.controller.js` | `checkVportOwnership` | Used by `useVportOwnership` |

### Service / Adapter

| File | Role |
|---|---|
| `settings/adapters/ui/Card.adapter` | UI Card wrapper consumed by settings cards |
| `settings/adapters/profile/ui/VportAboutDetails.view.adapter` | Public details form section |
| `profiles/adapters/kinds/vport/hooks/useVportPublicDetails.adapter` | Public details data adapter |
| `profiles/adapters/profiles.adapter` → `getVportTabsByType` | Tab config resolver used for calendar card injection |
| `wanders/core/adapters/wanders.adapter` → `useWandersBusinessCardOps` | Re-exports `getBusinessCardSettings` + `deepMergeSettings` from `public/vportBusinessCard/model` |
| `ads/adapters/hooks/useVportAds.adapter` | Ads list for preview card |

### Hook

| File | Consumes | Exposes |
|---|---|---|
| `settings/vports/hooks/useVportBusinessCardSettings.js` | `ctrlResolveVportIdByActorId`, `ctrlGetVportBusinessCardSettings`, `ctrlSetVportBusinessCardSettings`, `useWandersBusinessCardOps` | `{ settings, rawSettings, isLoading, isSaving, error, updateSettings }` |
| `settings/vports/hooks/useVportDirectoryVisibility.js` | `ctrlResolveVportIdByActorId`, `ctrlGetVportDirectoryState`, `ctrlSetVportDirectoryVisible`, `useIdentity` | `{ directoryVisible, directoryStatus, isLoading, isSaving, error, toggle }` |
| `dashboard/vport/hooks/useVportOwnership.js` | `checkVportOwnership.controller.js` | `{ isOwner, ownershipLoading }` |
| `dashboard/vport/hooks/useSaveVportPublicDetailsByActorId.js` | `saveVportPublicDetailsByActorId.controller.js` | `{ saveByActorId }` |
| `dashboard/vport/screens/useDesktopBreakpoint.js` | `window.matchMedia` | `isDesktop: boolean` |

### Component

| File | Role | Violations |
|---|---|---|
| `screens/components/VportDashboardParts.jsx` | `DashboardCard` + `VportBannerHeader` — pure presentational | None |
| `screens/components/CardSettingToggleRow.jsx` | Atomic toggle row with aria-label | None |
| `screens/components/VportSettingsBusinessCard.jsx` | Business card section toggles — calls `getSectionToggles(vportType)` | Imports from `public/vportBusinessCard/model` directly |
| `screens/components/VportSettingsTrazeCard.jsx` | TRAZE directory toggle card | None |
| `screens/components/VportSettingsAdsPreview.jsx` | Ads preview list (display-only, flag-gated) | None |
| `screens/components/VportBackButton.jsx` | Back navigation button | None |

### Screen

| File | Role | Layer Compliance |
|---|---|---|
| `screens/VportDashboardScreen.jsx` | Route entry + ownership gate + card grid view | PARTIAL — both Final Screen + View Screen combined |
| `screens/VportSettingsScreen.jsx` | Route entry + ownership gate + settings form | PARTIAL — Final + View combined, contains save logic |

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Clearly scoped to VPORT owner dashboard and per-card settings | — |
| Owner defined | PASS | Actor ownership enforced via `useVportOwnership` + `actor_owners` | — |
| Entry points mapped | PASS | Two lazy-loaded routes: `/actor/:actorId/dashboard`, `/actor/:actorId/settings` | — |
| Controllers present/delegated | PASS | `vportBusinessCardSettings.controller.js`, `vportDirectoryVisibility.controller.js` | `vportBusinessCardSettings` controller lacks actor_owners guard |
| DAL/repository present/delegated | PASS | Explicit column selects, `owner_user_id` enforcement in all DAL queries | `setVportDirectoryVisibleDAL` has secondary-table sync inside DAL (see violations) |
| Models/transformers present | PASS | 6 model files covering card catalog, view presets, details normalization, draft mapping, validation, settings defaults | `vportSettingsValidation.js` placed in wrong layer (`screens/lib/`) |
| Hooks/view models present | PASS | 5 hooks with clear responsibilities | Double vportId resolution (N+1 risk) |
| Screens/components present | PASS | 2 screens, 6 setting card components | Screen/Final Screen split missing |
| Services/adapters present | PASS | 5 adapters for cross-feature access | Wanders adapter wrapping public model is indirect (see violations) |
| Database objects mapped | PASS | `vport.profiles`, `vport.profile_public_details`, `vc.actor_owners` | `profile_public_details` sync in DAL — business logic in wrong layer |
| Authorization path mapped | PASS | `useIdentity` → `useVportOwnership` → `checkVportOwnership` → `actor_owners` | Business card settings controller bypasses actor_owners check |
| Cache/runtime behavior mapped | PARTIAL | No caching on settings reads — every mount fires 2 DB reads | Missing: shared vportId resolution hook to avoid duplicate resolution |
| Error/loading/empty states mapped | PASS | Loading skeletons, inline error display, Toast for save feedback | — |
| Documentation linked | PARTIAL | Existing `vcsm.vport-dashboard.architecture.md` covers dashboard broadly | No dedicated settings card doc until this report |
| Tests/validation noted | FAIL | No test files detected for settings flow | Validation logic untested |
| Native parity noted | N/A | PWA-first, no native transfer required at this time | — |
| Engine dependencies mapped | PASS | No engine imports — settings feature is self-contained within app layer | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `settings/vports/dal/*` | DAL | settings hooks → DAL | YES | Correct |
| `public/vportBusinessCard/model/businessCardSettings.model` | Model | component → model | WATCH | Direct cross-feature import from settings component to public feature model |
| `wanders/adapter` → `public/vportBusinessCard/model` | Adapter | settings hook → wanders adapter → public model | INDIRECT | Unnecessary routing through wanders; model should be importable directly |
| `settings/profile/controller/resolveVportIdByActorId` | Controller | settings hooks → settings/profile controller | CROSS-FEATURE | Two different hooks both import this; should be consolidated |
| `booking/adapter` → `assertActorOwnsVportActorController` | Adapter | directory controller → booking adapter | CROSS-FEATURE | Ownership assertion routed through booking adapter |
| `profiles/adapters/kinds/vport/hooks/useVportPublicDetails.adapter` | Adapter | settings screen → profiles adapter | YES | Correct cross-feature access via adapter |
| `profiles/adapters/profiles.adapter` → `getVportTabsByType` | Adapter | dashboard screen → profiles adapter | YES | Correct |
| `ads/adapters/hooks/useVportAds.adapter` | Adapter | settings screen → ads adapter | YES | Correct |
| `shared/config/releaseFlags` | Config | model → shared | YES | Correct |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `vport.profiles.business_card_settings` (JSONB) | read/write | `vportBusinessCardSettings.controller` | `useVportBusinessCardSettings` → `VportSettingsBusinessCard` | MEDIUM — no schema validation on JSONB structure |
| `vport.profiles.directory_visible` | read/write | `vportDirectoryVisibility.controller` | `useVportDirectoryVisibility` → `VportSettingsTrazeCard` | LOW — well guarded |
| `vport.profiles.directory_status` | read | admin-only writes | `useVportDirectoryVisibility` (read only) | LOW — never written by app |
| `vport.profile_public_details.directory_visible` | write (sync) | `setVportDirectoryVisibleDAL` | Background sync only | MEDIUM — sync is non-critical but live in DAL layer |
| `CARD_CATALOG` (frozen object) | derived | `buildDashboardCards.model.js` | `VportDashboardScreen`, `VportSettingsScreen` | LOW |
| `DASHBOARD_VIEW_PRESETS` (frozen object) | derived | `dashboardViewByVportType.model.js` | Both screens | LOW |
| `DEFAULT_BUSINESS_CARD_SETTINGS` | derived | `businessCardSettings.model.js` | `getBusinessCardSettings` → `useVportBusinessCardSettings` | LOW |
| Public details draft | read/write | `VportSettingsScreen` + `saveVportPublicDetailsByActorId.controller` | `VportAboutDetailsView` | LOW |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry exists | PASS | Both routes registered and lazy-loaded | — |
| Loading state exists | PASS | `SkeletonCardList` while ownership resolves; `"Loading…"` in toggle cards | — |
| Empty state exists | PASS | "No ads created yet." in ads preview; empty card set falls back to default preset | — |
| Error state exists | PASS | Inline error text in business card card and TRAZE card; Toast for save errors | — |
| Auth/owner gate exists | PASS | `useIdentity` + `useVportOwnership` before render | — |
| Cache behavior known | PARTIAL | No caching — every screen mount fires fresh reads | Medium risk under slow network — no stale-while-revalidate |
| Runtime dependencies mapped | PASS | Supabase auth, vport.profiles table, releaseFlags env vars | — |
| Hot paths identified | PARTIAL | vportId resolution × 2 on every settings mount is a hot path duplicate | N+1 pattern |
| LOKI/KRAVEN handoff recommended | YES | Double vportId resolution pattern; `setVportDirectoryVisibleDAL` secondary sync | KRAVEN for perf audit |

---

## BOUNDARY VIOLATIONS

---

### VIOLATION 1 — DAL Contains Business Logic (Secondary Table Sync)

```
MODULE BOUNDARY WARNING
Location:   settings/vports/dal/vports.write.dal.js :: setVportDirectoryVisibleDAL
Module:     VPORT Settings — Write DAL
Current dependency:
  DAL writes to vport.profiles (primary) then performs a try/catch UPDATE
  on vport.profile_public_details (secondary sync) inside the same DAL method.
Expected boundary:
  DAL = raw DB access only. Secondary sync is business orchestration
  and belongs in the controller layer.
Risk:
  Medium — sync failure is swallowed silently. If profile_public_details
  and profiles diverge, TRAZE directory index will show stale visibility.
Suggested correction:
  Move secondary sync to ctrlSetVportDirectoryVisible controller.
  DAL returns result; controller performs secondary sync via a separate
  DAL call. Failure should be logged, not silently ignored.
```

---

### VIOLATION 2 — Double vportId Resolution (N+1 Pattern)

```
MODULE BOUNDARY WARNING
Location:
  settings/vports/hooks/useVportBusinessCardSettings.js (line 28)
  settings/vports/hooks/useVportDirectoryVisibility.js (line 35)
Module:     VPORT Settings — Hook Layer
Current dependency:
  Both hooks independently call ctrlResolveVportIdByActorId(actorId)
  on mount when VportSettingsScreen renders. This fires two separate
  DB reads to resolve the same vportId from the same actorId.
Expected boundary:
  vportId should be resolved once — either by a shared parent hook
  or passed as a resolved prop. Both hooks consume the same actorId
  param and resolve the same vportId.
Risk:
  Low-Medium — redundant DB read on every settings screen mount.
  Network latency doubles for the resolution step.
Suggested correction:
  Create useResolvedVportId(actorId) hook that resolves once and caches.
  Both settings hooks consume it. Or resolve vportId in VportSettingsScreen
  and pass it as a prop to both hooks.
```

---

### VIOLATION 3 — Validation Logic in Wrong Layer

```
MODULE BOUNDARY WARNING
Location:   dashboard/vport/screens/lib/vportSettingsValidation.js
Module:     VPORT Settings — Layer Placement
Current dependency:
  Pure validation functions (normalizeAddress, getAddressValidationError,
  normalizePhoneDigits, etc.) live inside screens/lib/ — a sub-folder
  of the screen layer.
Expected boundary:
  Pure domain validation belongs in the model layer.
  Should live at: dashboard/vport/model/vportSettingsValidation.model.js
Risk:
  Low — logic is still pure and correct. Risk is discoverability
  and future imports from screens layer being treated as model exports.
Suggested correction:
  Move to dashboard/vport/model/vportSettingsValidation.model.js
  Update import in VportSettingsScreen.jsx.
```

---

### VIOLATION 4 — Model Files Inside screens/model/ Subfolder

```
MODULE BOUNDARY WARNING
Location:
  dashboard/vport/screens/model/buildDashboardCards.model.js
  dashboard/vport/screens/model/dashboardViewByVportType.model.js
  dashboard/vport/screens/model/vportBookingHistoryView.model.js
Module:     VPORT Dashboard — Layer Placement
Current dependency:
  Model files are nested inside screens/model/ instead of living at
  the feature model layer: dashboard/vport/model/
Expected boundary:
  All model files → dashboard/vport/model/
  screens/ should contain only screens and screen-specific components.
Risk:
  Low — logic is correct. Risk is architecture drift if other features
  add models inside their screen folders.
Suggested correction:
  Move to dashboard/vport/model/. Both screens/model/ files are already
  imported with @/ aliases so path updates are contained.
```

---

### VIOLATION 5 — businessCardSettings Controller Lacks Actor-Owners Gate

```
MODULE BOUNDARY WARNING
Location:   settings/vports/controller/vportBusinessCardSettings.controller.js
Module:     VPORT Settings — Controller Authorization
Current dependency:
  ctrlSetVportBusinessCardSettings delegates to the DAL without an
  actor_owners ownership check at the controller layer. Relies solely
  on DAL-level owner_user_id = auth.uid() guard.
Expected boundary:
  Controllers must verify ownership at the controller layer (actor_owners).
  ctrlSetVportDirectoryVisible already does this correctly via
  assertActorOwnsVportActorController — the business card controller does not.
Risk:
  Medium — if auth.uid() and actor_owners diverge (e.g. team member with
  auth access), the gate relies only on raw user ID match.
Suggested correction:
  Add assertActorOwnsVportActorController({ requestActorId: callerActorId,
  targetActorId: vportActorId }) to ctrlSetVportBusinessCardSettings.
  Requires passing callerActorId and vportActorId through the call chain.
```

---

### VIOLATION 6 — Screen Role: VportSettingsScreen as Combined Final + View Screen

```
MODULE BOUNDARY WARNING
Location:   dashboard/vport/screens/VportSettingsScreen.jsx
Module:     VPORT Settings — Screen Layer
Current dependency:
  VportSettingsScreen is mounted directly by the router (Final Screen role)
  AND manages hooks + state + save orchestration (View Screen role)
  AND contains a 50-line onSave useCallback with business validation
  and state management (Controller role).
Expected boundary:
  Final Screen → route entry + identity gate only.
  View Screen → hooks + component composition.
  Controller → save path business logic.
Risk:
  Medium — screen file is 277 lines and growing. Save orchestration
  (validation → setSaving → try/catch → toast) will attract more logic
  over time, violating the single-responsibility contract.
Suggested correction:
  Extract save logic to useSaveVportSettings hook or a controller.
  Split into VportSettingsFinalScreen.jsx (gate only) +
  VportSettingsScreen.jsx (view composition).
```

---

### VIOLATION 7 — Wanders Adapter as Unnecessary Indirection

```
MODULE BOUNDARY WARNING
Location:   settings/vports/hooks/useVportBusinessCardSettings.js → wanders.adapter.js
Module:     VPORT Settings — Adapter Boundary
Current dependency:
  useVportBusinessCardSettings imports useWandersBusinessCardOps from
  features/wanders/core/adapters/wanders.adapter to get getBusinessCardSettings
  and deepMergeSettings — both of which are pure functions in
  features/public/vportBusinessCard/model/businessCardSettings.model.js.
Expected boundary:
  Pure model functions should be importable directly from their feature's
  model layer via adapters, not routed through an unrelated feature (wanders).
  The wanders adapter exists for wanders-specific business card submission —
  not for settings to borrow model functions.
Risk:
  Low-Medium — coupling settings to wanders creates a hidden transitive
  dependency. If wanders adapter is refactored, settings breaks silently.
Suggested correction:
  Import getBusinessCardSettings and deepMergeSettings directly from
  features/public/vportBusinessCard/model/businessCardSettings.model.js
  (or expose them via a dedicated settings-side adapter).
  Remove useWandersBusinessCardOps from the settings hook.
```

---

## SPAGHETTI SCORE

```
SPAGHETTI SCORE (post-fix)
Module:   VPORT Dashboard Cards Individual Settings
Score:    CLEAN
Previous: WATCH (2026-05-26 initial audit)

Resolved:
  ✅ Double vportId resolution — eliminated via useResolvedVportId
  ✅ Wanders adapter coupling — removed; direct model import
  ✅ DAL secondary table sync — moved to controller layer
  ✅ Validation in screens/lib/ — moved to model/; lib file is re-export stub
  ✅ Model files in screens/model/ — moved to model/; old files are re-export stubs

Remaining (structural, non-functional):
  - Business save logic still in VportSettingsScreen (screen/controller split deferred)

Release risk: LOW
```

---

## DEAD CODE FINDINGS

```
DEAD CODE FINDING — RETRACTED
Location:   dashboard/vport/screens/components/PortfolioBugsBunnyPanel.jsx
Code Type:  Component
Classification: STILL REFERENCED
Evidence:   Actively imported and rendered in VportDashboardPortfolioScreen.jsx (line 142).
            Guards itself with `if (!import.meta.env.DEV) return null;` — DEV-only panel.
            Name is legacy (BugsBunny command was renamed to NickFury/Deadpool) but file
            should be renamed, not deleted.
Risk:       None — not dead code.
Recommended action: RENAME to PortfolioDevDiagnosticPanel.jsx (cosmetic, low priority)
Recommended handoff: LOGAN
```

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Actor-owners gate in business card settings controller | HIGH | ctrlSetVportBusinessCardSettings only relies on DAL-level user ID match, not actor_owners verification | VENOM |
| Shared vportId resolution hook | MEDIUM | Two hooks fire duplicate DB reads on every settings mount | KRAVEN |
| Secondary table sync moved out of DAL | MEDIUM | DAL must not contain business orchestration — sync belongs in controller | SENTRY |
| Validation moved from screens/lib/ to model/ | LOW | Layer placement drift | LOGAN |
| Model files moved from screens/model/ to model/ | LOW | Layer placement drift | LOGAN |
| Screen split: Final Screen + View Screen | MEDIUM | VportSettingsScreen exceeds its layer role with embedded save logic | SENTRY |
| Save logic extracted to hook/controller | MEDIUM | onSave in view screen contains controller-level business validation | SENTRY |
| Test coverage for settings flows | HIGH | No tests detected for toggle save, validation, TRAZE toggle, business card settings | IRONMAN |

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Add actor_owners gate to `ctrlSetVportBusinessCardSettings` | Authorization parity with directory visibility controller | VENOM + ELEKTRA |
| P1 | Move secondary sync from `setVportDirectoryVisibleDAL` into controller | DAL must not contain business logic | SENTRY |
| P1 | Create `useResolvedVportId(actorId)` hook — deduplicate vportId resolution | Eliminate N+1 DB read on every settings mount | KRAVEN |
| P2 | Extract `onSave` from `VportSettingsScreen` to `useSaveVportSettings` hook | Screen role compliance | SENTRY |
| P2 | Replace `useWandersBusinessCardOps` with direct model import in settings hook | Remove unrelated feature coupling | SENTRY |
| P3 | Move `vportSettingsValidation.js` to `model/vportSettingsValidation.model.js` | Layer compliance | LOGAN |
| P3 | Move `screens/model/*.model.js` to feature `model/` directory | Layer compliance | LOGAN |

---

## MODULE RUNTIME READINESS (SUMMARY)

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route entry | PASS | Both routes lazy-loaded and registered | — |
| Ownership gate | PASS | `useVportOwnership` on both screens before render | — |
| Loading states | PASS | Skeleton + loading text per card | — |
| Error states | PASS | Inline error + Toast | — |
| Settings persistence | PASS | Both controllers write to `vport.profiles` with auth guard | — |
| Release flag gating | PASS | `isDashboardCardEnabled` filters card keys; `vportAdsPipeline` gates ads preview | — |
| Desktop portal rendering | PASS | `createPortal(document.body)` on both screens when `isDesktop` | — |
| vportId resolution | PASS | Eliminated — useResolvedVportId resolves once in parent, passed to both hooks | — |
| TRAZE sync consistency | PASS | Sync extracted to controller; failure logged via console.warn, non-blocking | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc (dashboard broad) | `logan/marvel/architect/modules/vcsm.vport-dashboard.architecture.md` | PRESENT |
| Logan doc (settings card specific) | `logan/marvel/architect/modules/vcsm.vport-dashboard-cards-settings.architecture.md` | PRESENT (this file) |
| Security audit | — | MISSING — P1 |
| Runtime audit | — | MISSING — P2 |
| Performance audit | — | MISSING — double vportId resolution flagged |
| Migration audit | — | N/A — no schema changes pending |
| Native transfer audit | — | N/A |
| Engine audit | — | N/A — no engine dependency |

---

## FINAL MODULE STATUS

**MOSTLY COMPLETE** *(upgraded from initial audit — see FIX LOG below)*

Authorization parity, DAL responsibility, hook deduplication, wanders coupling, and layer placement have all been resolved. One structural item remains deferred:
- VportSettingsScreen screen/view role split (save logic embedded in view — non-functional risk)
- screen role boundary (combined Final + View + Controller in VportSettingsScreen)

---

## RECOMMENDED HANDOFFS

| Command | Reason |
|---|---|
| **VENOM** | ~~Audit actor_owners gap in `ctrlSetVportBusinessCardSettings`~~ ✅ RESOLVED |
| **ELEKTRA** | ~~Precision patch for the controller auth gap~~ ✅ RESOLVED |
| **SENTRY** | ~~DAL sync extraction~~ ✅ RESOLVED — Screen role split still open |
| **KRAVEN** | ~~Double vportId resolution hot path~~ ✅ RESOLVED |
| **LOGAN** | ~~Layer placement corrections~~ ✅ RESOLVED — stubs in place |
| **IRONMAN** | Test coverage ownership assignment — still open |

---

## FIX LOG

**Fixed:** 2026-05-26
**Build:** ✅ Clean — zero errors
**Lint:** ✅ Zero errors on all changed files

### FIX-001 — Actor-Owners Auth Parity (P1) ✅

`ctrlSetVportBusinessCardSettings` now calls `assertActorOwnsVportActorController`
before writing, matching the depth of `ctrlSetVportDirectoryVisible`.
`callerActorId` and `vportActorId` threaded through hook → controller.
DAL-level `owner_user_id` guard preserved as defense-in-depth.

Files changed:
- `settings/vports/controller/vportBusinessCardSettings.controller.js`
- `settings/vports/hooks/useVportBusinessCardSettings.js`

### FIX-002 — DAL Secondary Sync Extracted to Controller (P1) ✅

`setVportDirectoryVisibleDAL` is now raw DB access only.
New `syncDirectoryVisibleToPublicDetailsDAL` export added to the write DAL.
Controller orchestrates the sync in a non-blocking try/catch with `console.warn`
on failure — no silent swallow, drift is visible in monitoring.

Files changed:
- `settings/vports/dal/vports.write.dal.js`
- `settings/vports/controller/vportDirectoryVisibility.controller.js`

### FIX-003 — Deduplicated vportId Resolution (P1) ✅

Created `settings/vports/hooks/useResolvedVportId.js`.
`VportSettingsScreen` resolves `vportId` once and passes it to both hooks.
Both `useVportBusinessCardSettings` and `useVportDirectoryVisibility` accept
`vportId` as a third/second param respectively. Internal resolution removed.
DB reads reduced from 2 → 1 on every settings screen mount.

Files changed/created:
- `settings/vports/hooks/useResolvedVportId.js` (new)
- `settings/vports/hooks/useVportBusinessCardSettings.js`
- `settings/vports/hooks/useVportDirectoryVisibility.js`
- `dashboard/vport/screens/VportSettingsScreen.jsx`

### FIX-004 — Wanders Adapter Coupling Removed (P2) ✅

`useVportBusinessCardSettings` no longer imports via `useWandersBusinessCardOps`.
`getBusinessCardSettings` and `deepMergeSettings` now imported directly from
`public/vportBusinessCard/model/businessCardSettings.model`. Behavior identical.

Files changed:
- `settings/vports/hooks/useVportBusinessCardSettings.js`

### FIX-005 — Validation to Model Layer (P3) ✅

`vportSettingsValidation.model.js` created at `dashboard/vport/model/`.
`VportSettingsScreen` import updated to new path.
Old file at `screens/lib/vportSettingsValidation.js` converted to re-export stub.

Files changed/created:
- `dashboard/vport/model/vportSettingsValidation.model.js` (new)
- `dashboard/vport/screens/VportSettingsScreen.jsx`
- `dashboard/vport/screens/lib/vportSettingsValidation.js` → re-export stub

### FIX-006 — Screen Model Files to Feature Model Layer (P3) ✅

Three model files written at canonical `dashboard/vport/model/` location:
- `dashboard/vport/model/buildDashboardCards.model.js`
- `dashboard/vport/model/dashboardViewByVportType.model.js`
- `dashboard/vport/model/vportBookingHistoryView.model.js`

Internal import in `buildDashboardCards` updated to new path.
All consumer files updated:
- `VportDashboardScreen.jsx`
- `VportSettingsScreen.jsx`
- `VportDashboardBookingHistoryView.jsx`

Old `screens/model/` files converted to compatibility re-export stubs.
Single source of logic. No duplicate implementations.

### FIX-007 — Save Logic Extracted to Hook (P2) ✅

Created `dashboard/vport/hooks/useSaveVportSettings.js`.

Owns: draft state, draft initialisation from source data, `onChange` handler,
address/phone validation, save orchestration, toast lifecycle (success + validation errors).

`VportSettingsScreen` now imports only `useEffect` + `useMemo` from React.
Screen reduced from 285 → 205 lines. All business logic sits in the hook layer.

Also corrected ARCHITECT dead code finding: `PortfolioBugsBunnyPanel.jsx` is NOT dead —
actively rendered by `VportDashboardPortfolioScreen` with a DEV-only guard.

Files changed/created:
- `dashboard/vport/hooks/useSaveVportSettings.js` (new)
- `dashboard/vport/screens/VportSettingsScreen.jsx`

### FIX-008 — Final/View Screen Split (P3) ✅

Created `VportSettingsFinalScreen.jsx` as the route entry gate.

Route `/actor/:actorId/settings` now resolves into two distinct layers:

**Final Screen (`VportSettingsFinalScreen.jsx`):**
- Reads `actorId` from `useParams`
- Calls `useIdentity` + `useVportOwnership` for the gate
- Renders loading / unauthenticated / not-owner guards
- If all clear: renders `<VportSettingsScreen actorId={actorId} isOwner={isOwner} />`

**View Screen (`VportSettingsScreen.jsx`):**
- Accepts `{ actorId, isOwner }` as props
- Calls `useIdentity` only for `identity?.vportType` (vportType computation)
- No `useParams`, no `useVportOwnership`, no guard returns
- Pure hook wiring + component composition
- Reduced from 205 → 192 lines

`lazyApp.jsx` lazy import path updated to load `VportSettingsFinalScreen` at the
route boundary. Export name kept as `VportSettingsScreen` — no route-file change required.

Build: ✅ 0 errors. Lint: ✅ 0 errors, 0 new warnings.

Files changed/created:
- `dashboard/vport/screens/VportSettingsFinalScreen.jsx` (new)
- `dashboard/vport/screens/VportSettingsScreen.jsx`
- `app/routes/lazyApp.jsx`

### FIX-009 — PortfolioBugsBunnyPanel Rename ✅

Renamed `PortfolioBugsBunnyPanel` → `PortfolioDevDiagnosticPanel` for command-name
parity (BugsBunny was renamed to Deadpool on 2026-05-11).

- Created `PortfolioDevDiagnosticPanel.jsx` (canonical). Component name updated.
  DEV label changed from "BUGSBUNNY" → "DEADPOOL".
- Converted `PortfolioBugsBunnyPanel.jsx` to a compatibility re-export stub.
- Updated `VportDashboardPortfolioScreen.jsx` to import and render
  `PortfolioDevDiagnosticPanel` directly.

Build: ✅ 0 errors. Lint: ✅ 0 errors, 0 new warnings.

Files changed/created:
- `dashboard/vport/screens/components/PortfolioDevDiagnosticPanel.jsx` (new)
- `dashboard/vport/screens/components/PortfolioBugsBunnyPanel.jsx` (stub)
- `dashboard/vport/screens/VportDashboardPortfolioScreen.jsx`

### REMAINING OPEN

- **Test coverage** — assign to IRONMAN
