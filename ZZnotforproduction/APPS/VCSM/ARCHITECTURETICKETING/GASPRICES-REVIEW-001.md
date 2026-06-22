# GASPRICES-REVIEW-001 — Gas Prices Architecture Review

**Role:** ARCHITECT + SCANNER AUDITOR  
**Type:** Read-Only Analysis  
**Date:** 2026-06-06  
**Status:** COMPLETE — No source files modified

---

## Executive Summary

Gas prices is a **fully self-contained business domain** living inside `dashboard/vport/dashboard/cards/gasprices/`. The business logic (DAL, controllers, models, hooks, components) is correctly centralized. Six adapter files exist in `profiles/adapters/kinds/vport/` to expose the domain to the profiles feature — but they are **never actually consumed**. The actual consumer (`VportProfileTabContent.jsx`) imports directly from the dashboard internals, bypassing the adapter boundary. This is the primary confirmed violation.

The post module (`post/postcard/postModules/fuelPrices/`) is a **read-only display layer** with zero dependency on the dashboard gas prices domain — it only parses post `text` and `payload` fields. It is self-contained.

The domain spans two Supabase schemas: `vport.*` (prices, submissions, history, settings) and `vc.*` (posts, for dedup checking). This dual-schema pattern is correct by design but must be preserved in any future extraction.

**Migration required: YES** — one boundary violation to fix before ARCH-VPORTPROFILE-001 can proceed safely.

---

## 1. Inventory

### Feature: `dashboard/vport/dashboard/cards/gasprices/`
**Total: 47 files (tests included), 40 production files**

| File | Category |
|---|---|
| `index.js` | barrel |
| `__tests__/gasErrorMessages.model.test.js` | test |
| `__tests__/gasprices.index.rule9.test.js` | test |
| `__tests__/gasprices.spiderman.test.js` | test |
| `__tests__/getVportGasPrices.controller.test.js` | test |
| `__tests__/submitFuelPriceSuggestion.controller.test.js` | test |
| `__tests__/vportFuelPriceSubmissions.read.dal.test.js` | test |
| `__tests__/vportFuelPriceSubmissions.write.dal.test.js` | test |
| `components/BulkUpdateFuelPricesModal.jsx` | component |
| `components/FuelPriceRow.jsx` | component |
| `components/GasPricesPanel.jsx` | component |
| `components/GasStates.jsx` | component |
| `components/GasUnitToggleBar.jsx` | component |
| `components/OwnerPendingSuggestionsList.jsx` | component |
| `components/OwnerSuggestionReviewCard.jsx` | component |
| `components/VportDashboardGasPanels.jsx` | component |
| `controller/getVportGasPrices.controller.js` | controller |
| `controller/publishFuelPriceUpdateAsPost.controller.js` | controller |
| `controller/reviewFuelPriceSuggestion.controller.js` | controller |
| `controller/submitCitizenFuelPriceSuggestion.controller.js` | controller |
| `controller/submitFuelPriceSuggestion.controller.js` | controller (router) |
| `controller/submitOwnerFuelPriceUpdate.controller.js` | controller |
| `controller/updateStationFuelUnit.controller.js` | controller |
| `dal/vportFuelPriceHistory.write.dal.js` | dal |
| `dal/vportFuelPricePost.read.dal.js` | dal |
| `dal/vportFuelPriceReviews.write.dal.js` | dal |
| `dal/vportFuelPriceSubmissions.read.dal.js` | dal |
| `dal/vportFuelPriceSubmissions.write.dal.js` | dal |
| `dal/vportFuelPrices.read.dal.js` | dal |
| `dal/vportFuelPrices.write.dal.js` | dal |
| `dal/vportStationPriceSettings.read.dal.js` | dal |
| `hooks/useAfterSubmitSuggestion.js` | hook |
| `hooks/useGasUnitToggle.js` | hook |
| `hooks/useOwnerPendingSuggestions.js` | hook |
| `hooks/useSubmitBulkFuelPrices.js` | hook |
| `hooks/useSubmitFuelPriceSuggestion.js` | hook |
| `hooks/useUpdateStationFuelUnit.js` | hook |
| `hooks/useVportGasPrices.js` | hook |
| `model/gasErrorMessages.js` | model |
| `model/gasPrices.model.js` | model |
| `model/vportFuelPrice.model.js` | model |
| `model/vportFuelPriceSubmission.model.js` | model |
| `model/vportStationPriceSettings.model.js` | model |
| `screens/VportDashboardGasScreen.jsx` | screen (final) |
| `screens/VportDashboardGasView.jsx` | screen (view) |
| `screens/VportGasPricesScreen.jsx` | screen (final) |
| `screens/VportGasPricesView.jsx` | screen (view) |
| `services/fuelPriceCache.service.js` | utility/service |

---

### Feature: `post/postcard/postModules/fuelPrices/`
**Total: 5 files**

| File | Category |
|---|---|
| `FuelGradeColumn.jsx` | component |
| `FuelPricesPostModule.jsx` | component |
| `fuelPricesPostModule.css` | config/styles |
| `fuelPricesPostModule.model.js` | model (parser) |
| `index.js` | barrel |

---

### Feature: `profiles/adapters/kinds/vport/` — gas adapters
**Total: 6 adapter files**

| File | Category |
|---|---|
| `hooks/gas/useOwnerPendingSuggestions.adapter.js` | adapter |
| `hooks/gas/useSubmitFuelPriceSuggestion.adapter.js` | adapter |
| `hooks/gas/useVportGasPrices.adapter.js` | adapter |
| `screens/gas/components/GasPricesPanel.adapter.js` | adapter |
| `screens/gas/components/GasStates.adapter.js` | adapter |
| `screens/gas/components/OwnerPendingSuggestionsList.adapter.js` | adapter |

---

### Auxiliary Files (gas-aware, not gas-owned)

| File | Feature | Category | Note |
|---|---|---|---|
| `profiles/adapters/kinds/vport/ownership.adapter.js` | profiles | adapter | Exposes `checkVportOwnershipController` from dashboard to gas controllers |
| `profiles/kinds/vport/dal/services/resolveVportProfileId.dal.js` | profiles | dal | Used by all gas DALs for actor→profile resolution |
| `profiles/config/profileTabs.config.js` | profiles | config | Defines `VPORT_GAS_TABS` — `gas` tab in gas station profile |
| `profiles/kinds/vport/model/getVportTabsByType.model.js` | profiles | model | Routes `gas station` vport type to `VPORT_GAS_TABS` |
| `profiles/kinds/vport/screens/components/VportProfileTabContent.jsx` | profiles | screen | Renders `VportGasPricesView` when `tab === "gas"` — VIOLATION |
| `dashboard/vport/model/dashboardViewByVportType.model.js` | dashboard | model | Routes `gas station` vport type to `"gas"` dashboard preset |
| `dashboard/vport/model/buildDashboardCards.model.js` | dashboard | model | Defines `gas` card key in the dashboard card catalog |
| `public/vportBusinessCard/model/businessCardSettings.model.js` | public | model | Defines `show_fuel_prices` flag for gas station business card |
| `public/vportBusinessCard/view/businessCardExtraSection.jsx` | public | component | Renders `FuelPricesSection` — prop-driven, no gas domain import |
| `post/postcard/ui/PostCard.view.jsx` | post | screen | Statically imports `FuelPricesPostModule` from `post/postModules/fuelPrices/` |
| `app/routes/protected/app.routes.jsx` | app | config | Routes `/actor/:actorId/gas` and `/actor/:actorId/dashboard/gas` |
| `app/routes/lazyApp.jsx` | app | config | Lazy-loads both gas screens |
| `dev/diagnostics/groups/profilesKindsFeature.group.js` | dev | utility | Dev-only import of `getVportGasPricesController` — not production |

**Grand total: ~63 files across all features**

---

## 2. Ownership Analysis

### Fuel Price Submission (citizen suggestion)

**Current Owner:** `dashboard/vport/dashboard/cards/gasprices/`  
**Consumer Features:** `profiles` (via `VportGasPricesView`), `app/routes`  
**Recommended Owner:** `dashboard/vport/dashboard/cards/gasprices/` — KEEP  
**Confidence:** HIGH  

*Evidence:* `submitCitizenFuelPriceSuggestionController` in `dashboard/gasprices/controller/`. Complete controller chain with sanity checks, dedup, cache invalidation. No reason to move.

---

### Fuel Price Display (read)

**Current Owner:** `dashboard/vport/dashboard/cards/gasprices/`  
**Consumer Features:** `profiles` (via `VportGasPricesView`), `post` (read from post payload)  
**Recommended Owner:** `dashboard/vport/dashboard/cards/gasprices/` — KEEP  
**Confidence:** HIGH  

*Evidence:* `getVportGasPricesController` and `useVportGasPrices` hook. Post feature reads from post payload — zero dependency on gas DAL.

---

### Fuel Price Moderation (owner reviews citizen suggestions)

**Current Owner:** `dashboard/vport/dashboard/cards/gasprices/`  
**Consumer Features:** dashboard (VportDashboardGasView exclusively)  
**Recommended Owner:** `dashboard/vport/dashboard/cards/gasprices/` — KEEP  
**Confidence:** HIGH  

*Evidence:* `reviewFuelPriceSuggestionController` — owner-only operation. Only shown in `VportDashboardGasView` (dashboard context). Profile tab does not expose suggestion review.

---

### Fuel Price Storage (write)

**Current Owner:** `dashboard/vport/dashboard/cards/gasprices/`  
**Consumer Features:** Internal only  
**Recommended Owner:** `dashboard/vport/dashboard/cards/gasprices/` — KEEP  
**Confidence:** HIGH  

*Evidence:* `vportFuelPrices.write.dal.js`, `vportFuelPriceSubmissions.write.dal.js`, `vportFuelPriceHistory.write.dal.js`, `vportFuelPriceReviews.write.dal.js` — all internal DAL files.

---

### Fuel Price Retrieval (read from DB)

**Current Owner:** `dashboard/vport/dashboard/cards/gasprices/`  
**Consumer Features:** Internal only (accessed via hooks/controllers)  
**Recommended Owner:** `dashboard/vport/dashboard/cards/gasprices/` — KEEP  
**Confidence:** HIGH  

*Evidence:* `vportFuelPrices.read.dal.js`, `vportFuelPriceSubmissions.read.dal.js`, `vportStationPriceSettings.read.dal.js` — all internal.

---

### Fuel Price Suggestions (citizen community prices)

**Current Owner:** `dashboard/vport/dashboard/cards/gasprices/`  
**Consumer Features:** `dashboard` (owner review panel), `profiles` (public gas tab)  
**Recommended Owner:** `dashboard/vport/dashboard/cards/gasprices/` — KEEP  
**Confidence:** HIGH  

*Evidence:* `submitFuelPriceSuggestion.controller.js` routes between citizen and owner paths. `useSubmitFuelPriceSuggestion` hook handles both.

---

### Fuel Station Profile Rendering (gas tab on vport profile)

**Current Owner:** `profiles/kinds/vport/screens/components/VportProfileTabContent.jsx` rendering `VportGasPricesView`  
**Consumer Features:** profiles (tab routing)  
**Recommended Owner:** `profiles` renders the tab; gas domain provides `VportGasPricesView` via adapter  
**Confidence:** HIGH  

*Evidence:* `VportProfileTabContent.jsx` line 15 imports `VportGasPricesView` directly from `dashboard/gasprices/screens/` — bypasses the adapter. The adapter files in `profiles/adapters/kinds/vport/screens/gas/` exist but are NOT used by any production file.

---

### Dashboard Card Rendering (gas card in owner dashboard)

**Current Owner:** `dashboard/vport/dashboard/cards/gasprices/` via `VportDashboardGasScreen`  
**Consumer Features:** `dashboard` (card catalog, buildDashboardCards, VportDashboardScreen)  
**Recommended Owner:** `dashboard` — CORRECT  
**Confidence:** HIGH  

*Evidence:* `buildDashboardCards.model.js` routes `openGasPrices` handler to `VportDashboardGasScreen`. Only gas station vport type shows this card (`dashboardViewByVportType.model.js` line 63: `gas: { cardKeys: ["gas", ...]}`).

---

### Post Rendering (fuel price post in feed)

**Current Owner:** `post/postcard/postModules/fuelPrices/`  
**Consumer Features:** `post` (`PostCard.view.jsx` line 6 imports `FuelPricesPostModule`)  
**Recommended Owner:** `post` — CORRECT. This is not a gas domain file. It is a post display module.  
**Confidence:** HIGH  

*Evidence:* `FuelPricesPostModule` only parses `text` and `payload` from the post record. It never imports from gas domain. It is completely self-contained. `publishFuelPriceUpdateAsPostController` in gas domain writes the post; `FuelPricesPostModule` in post domain renders it — these are separate concerns.

---

## 3. Import Analysis

### Gas domain outbound imports (what dashboard/gasprices imports from other features)

| File | Imports From | Symbol | Boundary Status |
|---|---|---|---|
| `vportFuelPrices.read.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal.js` | `resolveVportProfileId` | CROSS-FEATURE DAL — VIOLATION per `NO_CROSS_FEATURE_DAL` rule, but functionally unavoidable. See Section 7. |
| `vportFuelPrices.write.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal.js` | `resolveVportProfileId` | Same |
| `vportFuelPriceSubmissions.read.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal.js` | `resolveVportProfileId` | Same |
| `vportFuelPriceSubmissions.write.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal.js` | `resolveVportProfileId` | Same |
| `vportStationPriceSettings.read.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal.js` | `resolveVportProfileId` | Same |
| `vportFuelPriceHistory.write.dal.js` | `profiles/kinds/vport/dal/services/resolveVportProfileId.dal.js` | `resolveVportProfileId` | Same |
| `submitFuelPriceSuggestion.controller.js` | `dashboard/vport/dal/read/vportProfile.read.dal` | `getVportProfileIdByActorDAL` | Internal to dashboard — CLEAN |
| `submitOwnerFuelPriceUpdate.controller.js` | `profiles/adapters/kinds/vport/ownership.adapter` | `checkVportOwnershipController` | Via adapter — CLEAN |
| `reviewFuelPriceSuggestion.controller.js` | `profiles/adapters/kinds/vport/ownership.adapter` | `checkVportOwnershipController` | Via adapter — CLEAN |
| `updateStationFuelUnit.controller.js` | `profiles/adapters/kinds/vport/ownership.adapter` | `checkVportOwnershipController` | Via adapter — CLEAN |
| `publishFuelPriceUpdateAsPost.controller.js` | `profiles/adapters/kinds/vport/ownership.adapter` | `checkVportOwnershipController` | Via adapter — CLEAN |
| `publishFuelPriceUpdateAsPost.controller.js` | `upload/adapters/posts.adapter` | `createSystemPost` | Via adapter — CLEAN |
| `publishFuelPriceUpdateAsPost.controller.js` | `shared/utils/resolveRealm` | `PUBLIC_REALM_ID` | Via shared — CLEAN |
| `useSubmitFuelPriceSuggestion.js` | `identity/adapters/identity.adapter` | `useIdentity` | Via adapter — CLEAN |

**Note on resolveVportProfileId:** Six gas DALs import directly from `profiles/kinds/vport/dal/services/resolveVportProfileId.dal.js` — a cross-feature DAL import. This violates `NO_CROSS_FEATURE_DAL`. However, `resolveVportProfileId` is a data resolution utility, not a business DAL — it resolves an actor→profileId mapping needed by all vport-scoped DALs across features. The correct fix per ARCH-DASH-001 is to move this utility to `shared/lib/` or extract it as a standalone DAL utility consumed by both dashboard and profiles.

---

### Gas domain inbound imports (what imports FROM dashboard/gasprices)

| Consumer File | Imported Path | Symbol | Via Adapter? |
|---|---|---|---|
| `profiles/kinds/vport/screens/components/VportProfileTabContent.jsx` | `dashboard/.../gasprices/screens/VportGasPricesView` | `VportGasPricesView` | **NO — VIOLATION** |
| `profiles/adapters/kinds/vport/hooks/gas/useVportGasPrices.adapter.js` | `dashboard/.../gasprices/hooks/useVportGasPrices` | `useVportGasPrices` | Adapter re-export — correct |
| `profiles/adapters/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.adapter.js` | `dashboard/.../gasprices/hooks/useSubmitFuelPriceSuggestion` | `useSubmitFuelPriceSuggestion` | Adapter re-export — correct |
| `profiles/adapters/kinds/vport/hooks/gas/useOwnerPendingSuggestions.adapter.js` | `dashboard/.../gasprices/hooks/useOwnerPendingSuggestions` | `useOwnerPendingSuggestions` | Adapter re-export — correct |
| `profiles/adapters/kinds/vport/screens/gas/components/GasPricesPanel.adapter.js` | `dashboard/.../gasprices/components/GasPricesPanel` | `GasPricesPanel` | Adapter re-export — correct |
| `profiles/adapters/kinds/vport/screens/gas/components/GasStates.adapter.js` | `dashboard/.../gasprices/components/GasStates` | `GasStates` | Adapter re-export — correct |
| `profiles/adapters/kinds/vport/screens/gas/components/OwnerPendingSuggestionsList.adapter.js` | `dashboard/.../gasprices/components/OwnerPendingSuggestionsList` | `OwnerPendingSuggestionsList` | Adapter re-export — correct |
| `app/routes/lazyApp.jsx` | `dashboard/.../gasprices/screens/VportDashboardGasScreen` | lazy import | App routing — CLEAN |
| `app/routes/lazyApp.jsx` | `dashboard/.../gasprices/screens/VportGasPricesScreen` | lazy import | App routing — CLEAN |
| `dev/diagnostics/groups/profilesKindsFeature.group.js` | `dashboard/.../gasprices/controller/getVportGasPrices.controller` | `getVportGasPricesController` | Dev-only — NOT PRODUCTION |

**Critical finding:** The 6 adapter files in `profiles/adapters/kinds/vport/` (gas hooks + gas components) are **correct re-exports** but they are **never consumed by any production file**. The actual consumer (`VportProfileTabContent.jsx`) bypasses them entirely.

---

## 4. Feature Boundary Review

**Verdict: Option D + E (Post Module + Shared Business Domain)**

Gas prices is a **shared business domain** (Option E) — it is consumed as a profile tab AND as a dashboard management screen. The domain lives in one owner (`dashboard/gasprices/`) and should be exposed to other features exclusively via adapter files.

The post module (`post/postModules/fuelPrices/`) is correctly classified as Option D — a self-contained post rendering module with zero dependency on the gas domain.

**Evidence for E (Shared Business Domain):**

1. `VportGasPricesView` is rendered both in the public profile tab (`VportProfileTabContent.jsx`) and as a standalone screen (`VportGasPricesScreen` → `/actor/:actorId/gas`)
2. `VportDashboardGasView` is the owner-exclusive management surface — different component, same underlying hooks/controllers
3. The 6 adapter files in `profiles/adapters/` demonstrate intent to expose the domain correctly — implementation just hasn't been wired up
4. Profile tab config (`profileTabs.config.js`) references `GAS` tab as a first-class tab type — not a dashboard feature

**Evidence against B (Dashboard Module Only):**

The `gas` tab appears on the public-facing vport profile for `gas station` type. Citizens (non-owners) see it and can submit suggestions from it. Dashboard is owner-only. Gas prices is a public feature.

**Evidence against C (Vport Profile Module):**

All business logic (DAL, controllers, models, hooks) lives in `dashboard/gasprices/`. Profile only renders the view — it does not own the domain.

---

## 5. Consumer Map

| Consumer Feature | Consumer File | Imported Symbol | Import Path | Purpose |
|---|---|---|---|---|
| `profiles` | `VportProfileTabContent.jsx` | `VportGasPricesView` | `dashboard/.../gasprices/screens/VportGasPricesView` | Gas tab on vport profile — **VIOLATION** |
| `post` | `PostCard.view.jsx` | `FuelPricesPostModule` | `post/postcard/postModules/fuelPrices` | Feed post rendering — CLEAN (internal to post) |
| `app/routes` | `app.routes.jsx` | `VportGasPricesScreen` | `dashboard/.../gasprices/screens/VportGasPricesScreen` | Public gas station screen route |
| `app/routes` | `app.routes.jsx` | `VportDashboardGasScreen` | `dashboard/.../gasprices/screens/VportDashboardGasScreen` | Dashboard gas management route |
| `dashboard` | `buildDashboardCards.model.js` | `"gas"` card key | Internal model | Dashboard card presence for gas station vport type |
| `dashboard` | `dashboardViewByVportType.model.js` | `"gas"` preset | Internal model | Routes gas station type to gas dashboard card set |
| `public` | `businessCardSettings.model.js` | `show_fuel_prices` flag | Internal model | Feature flag for fuel prices on business card |
| `public` | `VportBusinessCardPublic.view.jsx` | `FuelPricesSection` | `public/vportBusinessCard/view/businessCardExtraSection` | Business card fuel prices section (prop-driven) |
| `dev` | `profilesKindsFeature.group.js` | `getVportGasPricesController` | `dashboard/.../gasprices/controller/...` | Dev diagnostic only — not production |

**Not confirmed as consumers:** feed, explore, settings, notifications, social — no gas price imports found in any of these features.

---

## 6. Data Flow

### Fuel Price Submission (Citizen)

```
VportGasPricesView (profiles/VportProfileTabContent or /actor/:id/gas route)
  → GasPricesPanel → [Update prices button]
  → BulkUpdateFuelPricesModal (components/BulkUpdateFuelPricesModal.jsx)
  → useSubmitFuelPriceSuggestion (hooks/useSubmitFuelPriceSuggestion.js)
    → resolves submitterActorId (uses useIdentity + availableActors for kind-switch)
    → submitFuelPriceSuggestionController (controller/submitFuelPriceSuggestion.controller.js)
      → getVportProfileIdByActorDAL (dashboard/vport/dal/read/vportProfile.read.dal)
      [ownerUpdate = false → citizen path]
      → submitCitizenFuelPriceSuggestionController
        → fetchVportStationPriceSettingsDAL → vport.station_price_settings
        → fetchVportFuelPricesDAL → vport.fuel_prices (for sanity delta check)
        → fetchPendingFuelPriceSubmissionsDAL → vport.fuel_price_submissions
        → createFuelPriceSubmissionDAL → INSERT vport.fuel_price_submissions
        → FuelPriceCacheService.invalidatePendingSubmissions(actorId)
      → returns { ok: true, submission }
  → patchCommunityRow (optimistic UI update)
```

### Fuel Price Update (Owner)

```
VportDashboardGasView (dashboard management screen)
  → BulkUpdateFuelPricesModal → [Save button]
  → useSubmitFuelPriceSuggestion (isOwner = true)
    → submitFuelPriceSuggestionController (ownerUpdate = true)
      → getVportProfileIdByActorDAL → profileId
      → submitOwnerFuelPriceUpdateController
        → fetchVportStationPriceSettingsDAL → vport.station_price_settings
        → checkVportOwnershipController (via profiles/adapters/kinds/vport/ownership.adapter)
          → checkVportOwnership.controller (dashboard/vport/controller)
            → actor_owners table
        → upsertVportFuelPriceDAL → UPSERT vport.fuel_prices
        → createVportFuelPriceHistoryDAL → INSERT vport.fuel_price_history
        → FuelPriceCacheService.invalidateOfficialPrices(actorId)
      → returns { ok: true, official }
  → patchOfficialRow (optimistic UI update)
  → optional: publishFuelPriceUpdateAsPostController
      → hasRecentFuelPricePostDAL → SELECT vc.posts (dedup, 1h window)
      → checkVportOwnershipController (security gate for createSystemPost)
      → resolveVportStationNameDAL → SELECT vport.profiles (station name)
      → createSystemPost (upload/adapters/posts.adapter)
        → INSERT vc.posts with post_type = "fuel_price_update"
```

### Fuel Price Retrieval (Read)

```
useVportGasPrices({ actorId, fuelKey })
  → getVportGasPricesController({ actorId, fuelKey })
    → [parallel]
      → fetchVportStationPriceSettingsDAL
          → resolveVportProfileId → SELECT vport.profiles (actor→profile)
          → SELECT vport.station_price_settings WHERE profile_id = profileId
      → fetchVportFuelPricesDAL
          → resolveVportProfileId (cached, 30s TTL)
          → SELECT vport.fuel_prices WHERE profile_id = profileId
      → fetchPendingFuelPriceSubmissionsDAL
          → resolveVportProfileId (cached)
          → SELECT vport.fuel_price_submissions WHERE status = 'pending'
    → mapVportStationPriceSettingsRow, mapVportFuelPriceRows, mapFuelPriceSubmissionRows
    → filters latestPendingByFuelKey if showCommunitySuggestion = true
  → returns { actorId, settings, official, communitySuggestionByFuelKey, pendingSubmissions }
```

### Owner Suggestion Review

```
VportDashboardGasView → OwnerPendingSuggestionsList → [Approve/Reject]
  → useOwnerPendingSuggestions.reviewSuggestion
    → reviewFuelPriceSuggestionController({ submissionId, decision, decidedByActorId })
      → fetchFuelPriceSubmissionByIdDAL → SELECT vport.fuel_price_submissions
      → resolveActorIdFromProfileId → SELECT vport.profiles (profile→actor reverse lookup)
      → checkVportOwnershipController → vc.actor_owners
      → updateFuelPriceSubmissionStatusDAL → UPDATE vport.fuel_price_submissions
      → FuelPriceCacheService.invalidatePendingSubmissions
      [if approved]
        → upsertVportFuelPriceDAL → UPSERT vport.fuel_prices
        → createVportFuelPriceHistoryDAL → INSERT vport.fuel_price_history
        → FuelPriceCacheService.invalidateOfficialPrices
      → createFuelPriceSubmissionReviewDAL → INSERT vport.fuel_price_submission_reviews
  → onRefresh() → refetches useVportGasPrices
```

### Post Display Flow (separate from submission)

```
Feed renders a post with post_type = "fuel_price_update"
PostCard.view.jsx → FuelPricesPostModule({ text, payload, stationRoute })
  → parseFuelPricesPostModule(text, payload)
    [payload path: reads payload.fuels array — structured data]
    [legacy path: parses text lines — backward compat]
  → renders FuelGradeColumn per fuel entry
  → PostModuleCta links to stationRoute (e.g. /actor/:id/gas)
```
No DB access. No gas domain import.

---

## 7. Database Analysis

### Tables Used

| Table | Schema | Purpose | Access Layer |
|---|---|---|---|
| `fuel_prices` | `vport` | Official current price per fuel type per station | read: `vportFuelPrices.read.dal.js` / write: `vportFuelPrices.write.dal.js` |
| `fuel_price_submissions` | `vport` | Citizen and owner suggestion queue | read: `vportFuelPriceSubmissions.read.dal.js` / write: `vportFuelPriceSubmissions.write.dal.js` |
| `fuel_price_submission_reviews` | `vport` | Audit log of approve/reject decisions | write: `vportFuelPriceReviews.write.dal.js` |
| `fuel_price_history` | `vport` | Price change history (all writes logged) | write: `vportFuelPriceHistory.write.dal.js` |
| `station_price_settings` | `vport` | Per-station config: sanity ranges, community opt-in | read: `vportStationPriceSettings.read.dal.js` |
| `profiles` | `vport` | Actor→profileId resolution (also station name lookup) | `resolveVportProfileId.dal.js` / `vportFuelPricePost.read.dal.js` |
| `posts` | `vc` | Dedup check for recent fuel price post | `vportFuelPricePost.read.dal.js` (`hasRecentFuelPricePostDAL`) |

### RPCs Used
None confirmed. All reads/writes use direct Supabase table queries (no stored procedures).

### Views Used
None confirmed.

### Ownership Table
`vc.actor_owners` — accessed via `checkVportOwnershipController` (through `profiles/adapters/kinds/vport/ownership.adapter`). Not queried directly by any gas DAL — correctly delegated to the ownership controller.

### Key DB Architecture Notes

1. **Profile ID as join key**: All gas tables use `profile_id` (from `vport.profiles`) as the primary join key — not `actor_id`. Actor ID → Profile ID resolution is a required step before all reads and writes.

2. **Dual-schema design**: Gas prices operates across two Supabase schemas:
   - `vportSchema` (vport client): `fuel_prices`, `fuel_price_submissions`, `fuel_price_submission_reviews`, `fuel_price_history`, `station_price_settings`, `profiles`
   - `supabase` (vc client): `posts` (for dedup only)
   This is intentional. The fuel price domain is a vport-schema concept; the post dedup check is a vc-schema check. Must be preserved in any future extraction.

3. **Unit normalization at DAL boundary**: `vportFuelPriceHistory.write.dal.js` normalizes `"gallon" → "gal"` because `fuel_price_history` has a DB CHECK constraint that only accepts `"gal"`, while `fuel_prices` accepts `"gallon"`. This is a known schema inconsistency — documented in the DAL comment.

4. **Cache strategy**: Three TTL caches with different TTLs:
   - `fuel_prices`: 60s — official prices change infrequently
   - `fuel_price_submissions`: 30s — pending submissions change per citizen submit
   - `station_price_settings`: 300s (5min) — settings change rarely

---

## 8. Post Integration

### Files
`post/postcard/postModules/fuelPrices/` — 5 files

### Dependencies
**Zero imports from the gas domain.** The post module is completely isolated.

Inbound imports only from post-internal shared components:
- `PostModuleCta` from `post/postcard/postModules/shared/components/`
- `PostModuleFrame` from same
- `PostModuleHeader` from same

### Data Contract

`FuelPricesPostModule` accepts:
```js
{ text: string, payload: object|null, stationRoute: string }
```

`parseFuelPricesPostModule(text, payload)`:
- **New path** (payload has `payload.fuels`): reads `fuels[].fuelKey`, `fuels[].price`, `fuels[].currencyCode`, `fuels[].unit` from structured payload
- **Legacy path** (no payload): parses `text` string with regex — `"Fuel prices updated at {name}\n\nunit:{unit}\n{FuelKey}: {currency} {price} / {unit}"` format

The `publishFuelPriceUpdateAsPostController` in gas domain writes both `text` and `payload` when creating the post. The post module reads whichever is available. This is a **clean publisher/subscriber split**.

### Coupling to Dashboard
**None.** Post module never imports from `dashboard/gasprices/`.

### Coupling to Profiles
**None.** Post module never imports from `profiles/`.

---

## 9. Vport Profile Integration

### Gas Adapters in Profiles (exist, unused)

```
profiles/adapters/kinds/vport/
├── hooks/gas/
│   ├── useOwnerPendingSuggestions.adapter.js  → re-exports from dashboard/gasprices/hooks/
│   ├── useSubmitFuelPriceSuggestion.adapter.js → re-exports from dashboard/gasprices/hooks/
│   └── useVportGasPrices.adapter.js           → re-exports from dashboard/gasprices/hooks/
└── screens/gas/components/
    ├── GasPricesPanel.adapter.js              → re-exports from dashboard/gasprices/components/
    ├── GasStates.adapter.js                   → re-exports from dashboard/gasprices/components/
    └── OwnerPendingSuggestionsList.adapter.js → re-exports from dashboard/gasprices/components/
```

All 6 adapter files are correctly structured thin re-exports. **None are consumed by any production file.**

### The Violation

`profiles/kinds/vport/screens/components/VportProfileTabContent.jsx:15`:
```js
import { VportGasPricesView } from "@/features/dashboard/vport/dashboard/cards/gasprices/screens/VportGasPricesView";
```

This is a **direct screen import from a foreign feature's internal path**, bypassing the adapter boundary. `VportGasPricesView` is exported from `gasprices/screens/` — not a controller, DAL, or model — so this is a screen-level violation, not a DAL violation. It is classified as `NO_INTERNAL_WITHOUT_ADAPTER`.

### Fix Required

Create:
```
profiles/adapters/kinds/vport/screens/gas/VportGasPricesView.adapter.js
```
Content:
```js
export { VportGasPricesView } from "@/features/dashboard/vport/dashboard/cards/gasprices/screens/VportGasPricesView";
```

Update `VportProfileTabContent.jsx:15`:
```js
// FROM:
import { VportGasPricesView } from "@/features/dashboard/vport/dashboard/cards/gasprices/screens/VportGasPricesView";
// TO:
import { VportGasPricesView } from "@/features/profiles/adapters/kinds/vport/screens/gas/VportGasPricesView.adapter";
```

### What Moves with ARCH-VPORTPROFILE-001

When `profiles/kinds/vport` is extracted into its own feature (after ARCH-DASH-001), these files travel with it:
- `profiles/kinds/vport/model/getVportTabsByType.model.js` — tab routing for `gas station` type
- `profiles/config/profileTabs.config.js` — `VPORT_GAS_TABS` definition
- `VportProfileTabContent.jsx` — renders the gas tab
- The 6 gas adapter files in `profiles/adapters/kinds/vport/` — must move to the new vportProfile feature adapter boundary

### What Stays

- All of `dashboard/vport/dashboard/cards/gasprices/` — stays with dashboard (gas prices domain owner)
- `dashboard/vport/model/dashboardViewByVportType.model.js` — stays with dashboard (card routing)
- `dashboard/vport/model/buildDashboardCards.model.js` — stays with dashboard (card catalog)

---

## 10. Dashboard Integration

### Dashboard Card vs. Business Logic

The `dashboard` feature contains both:
1. **Dashboard card routing** (business logic) — `buildDashboardCards.model.js` and `dashboardViewByVportType.model.js` determine WHICH cards show for which vport type. Gas card key `"gas"` only appears for `gas station` type.
2. **Full gas prices domain** (business logic) — `dashboard/vport/dashboard/cards/gasprices/` — all DAL, controllers, models, hooks, components, screens.

This is NOT just a dashboard card. The gas domain contains:
- 7 controllers including citizen submission, owner update, moderation, unit toggle, post publishing
- 8 DAL files
- 5 models
- 7 hooks
- 8 components
- 4 screens

### Is dashboard ownership correct?

YES — for now. Gas prices is a vport management domain. It is natural to house it under `dashboard/` because:
1. The management UI (`VportDashboardGasView`) is dashboard-exclusive
2. The ownership check pattern (`checkVportOwnershipController`) is a dashboard-level concern
3. All write operations are mediated by owner verification

However: the `VportGasPricesView` (public read view) is also part of this domain and is used in the public profile tab — creating the cross-feature dependency to `profiles`. This is the root cause of the adapter boundary issue. The domain is in `dashboard` but serves a public profile surface.

### ARCH-DASH-001 Impact

ARCH-DASH-001 (SCOPE_EXPANDED) must decide whether to:
- A. Keep gas prices in `dashboard/gasprices/` and enforce the adapter boundary to profiles (minimal change — fix 1 import)
- B. Extract gas prices into its own top-level feature `features/gasprices/` (major extraction — 47 files, 2 routes, adapter updates)

**This review's recommendation: Option A.** See Section 11.

---

## 11. Recommendation

### Current Architecture (as-built)

```
dashboard/vport/dashboard/cards/gasprices/
├── [ALL business logic — 40 production files]
├── controller/ [7 controllers]
├── dal/ [8 DALs] ← imports resolveVportProfileId from profiles/kinds/vport/dal/ [VIOLATION]
├── model/ [5 models]
├── hooks/ [7 hooks] ← imports from identity/adapters/ [CLEAN]
├── components/ [8 components]
├── screens/ [4 screens]
└── services/ [1 cache service]

profiles/
├── adapters/kinds/vport/
│   ├── hooks/gas/ [3 adapters] ← EXIST BUT UNUSED
│   ├── screens/gas/components/ [3 adapters] ← EXIST BUT UNUSED
│   └── ownership.adapter.js ← USED by gas controllers [CLEAN]
└── kinds/vport/screens/components/VportProfileTabContent.jsx
    → imports VportGasPricesView DIRECTLY from dashboard/gasprices/screens/ [VIOLATION]

post/postcard/postModules/fuelPrices/ [5 files — fully isolated]
```

```
CONFIRMED VIOLATIONS:
VIO-001: profiles → dashboard (direct screen import, NO_INTERNAL_WITHOUT_ADAPTER)
VIO-002: dashboard/gasprices/DALs → profiles/kinds/vport/dal/services/ (NO_CROSS_FEATURE_DAL)
VIO-003 (dev only): dev/diagnostics → dashboard/gasprices/controller/ (dev-only, not production)
```

### Recommended Architecture

```
dashboard/vport/dashboard/cards/gasprices/
├── [ALL business logic — unchanged]
└── dal/ [7 DALs] ← each uses resolveVportProfileId [shared via shared/lib/]

shared/lib/
└── resolveVportProfileId.js  ← MOVED from profiles/kinds/vport/dal/services/
                                  [eliminates VIO-002]

profiles/
├── adapters/kinds/vport/
│   ├── hooks/gas/ [3 adapters] ← NOW USED by profiles consumers
│   ├── screens/gas/
│   │   ├── components/ [3 adapters] ← NOW USED
│   │   └── VportGasPricesView.adapter.js ← NEW: exposes view screen [fixes VIO-001]
│   └── ownership.adapter.js ← unchanged
└── kinds/vport/screens/components/VportProfileTabContent.jsx
    → imports VportGasPricesView via profiles/adapters/kinds/vport/screens/gas/VportGasPricesView.adapter [CLEAN]
```

### Ownership Matrix

| Domain | Current Owner | Recommended Owner | Change Required |
|---|---|---|---|
| Fuel price DAL | `dashboard/gasprices/dal/` | No change | No |
| Fuel price controllers | `dashboard/gasprices/controller/` | No change | No |
| Fuel price models | `dashboard/gasprices/model/` | No change | No |
| Fuel price hooks | `dashboard/gasprices/hooks/` | No change | No |
| Fuel price components | `dashboard/gasprices/components/` | No change | No |
| Fuel price screens | `dashboard/gasprices/screens/` | No change | No |
| Profile tab rendering | `profiles/VportProfileTabContent.jsx` | No change (but fix import) | Fix 1 import |
| Actor→profile ID resolver | `profiles/kinds/vport/dal/services/` | `shared/lib/` | Move file, update 6 importers |
| Post display | `post/postModules/fuelPrices/` | No change | No |
| Business card flag | `public/vportBusinessCard/model/` | No change | No |

### Migration Required: YES

**Fix 1 (Priority: HIGH before ARCH-VPORTPROFILE-001):**
- Create `profiles/adapters/kinds/vport/screens/gas/VportGasPricesView.adapter.js`
- Update `VportProfileTabContent.jsx:15` to import via adapter
- 2 files changed, 0 behavior change

**Fix 2 (Priority: MEDIUM, linked to ARCH-DASH-001):**
- Move `resolveVportProfileId.dal.js` from `profiles/kinds/vport/dal/services/` to `shared/lib/resolveVportProfileId.js`
- Update 6 import paths in gas DALs
- Update import path in `profiles/kinds/vport/dal/services/` (or delete if no other consumers)
- 7-8 files changed, 0 behavior change

**Fix 3 (Priority: LOW):**
- Delete or clean up `dev/diagnostics/groups/profilesKindsFeature.group.js:17` (dev diagnostic controller import)

### Reasoning

1. **Gas prices domain is correctly sized.** 40 production files is large for a sub-domain but appropriate — it spans owner management, citizen crowdsourcing, post publishing, and moderation. Splitting it would create coordination overhead without benefit.

2. **Dashboard is the correct home.** Gas prices requires ownership verification (actor_owners), unit management, and post publishing — all dashboard-level operations. The public profile tab is a read-mostly surface that consumes the same domain via adapter.

3. **The adapter files were the right decision.** Six adapter files were created in `profiles/adapters/kinds/vport/`. They are correctly structured. The only failure is that the consumer (`VportProfileTabContent.jsx`) was not updated to use them. Fix is trivial (1 file, 1 import).

4. **resolveVportProfileId belongs in shared.** It is a stateless actor→profileId lookup used by 6+ DAL files across the codebase. It is not business logic — it is a data resolution utility. Moving it to `shared/lib/` eliminates the cross-feature DAL boundary violation cleanly.

---

## 12. Risk Assessment

| Risk | Severity | Description | Mitigation |
|---|---|---|---|
| VIO-001: VportProfileTabContent bypass | HIGH | Direct import from dashboard internals will break if dashboard restructures gas screens path | Create `VportGasPricesView.adapter.js`, update 1 import |
| VIO-002: resolveVportProfileId cross-feature | MEDIUM | 6 gas DALs import from profiles/kinds/vport/dal/ — no behavioral risk today but creates coupling | Move to shared/lib/ per Fix 2 |
| Unit normalization discrepancy | LOW | `fuel_price_history` CHECK accepts `"gal"`, `fuel_prices` accepts `"gallon"` — DAL normalizes at write time | Document, preserve the normalization in `vportFuelPriceHistory.write.dal.js` |
| Unused adapter files | LOW | 6 adapter files exist but are never consumed — misleading for future developers | Fix VIO-001 will activate 3 of them; VportGasPricesView.adapter.js activates the last gap |
| Dual-schema gas domain | LOW | Gas prices spans `vport.*` and `vc.*` (for posts dedup) — extraction must preserve both connections | Any future feature extraction must retain both schema clients |
| dev diagnostic controller import | INFO | `profilesKindsFeature.group.js` imports a controller directly — dev-only, not production risk | Cleanup task, no urgency |
| ARCH-DASH-001 blocking ARCH-VPORTPROFILE-001 | INFO | Gas prices split decision is BLOCKED on ARCH-DASH-001 (Option A vs B) | This review resolves the question: recommend Option A (stay in dashboard, fix adapter) |
