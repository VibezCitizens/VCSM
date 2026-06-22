# ARCHITECTURE — Dashboard Module: gasprices

**Last ARCHITECT Run:** 2026-06-05
**Architecture State:** SOURCE_VERIFIED
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001
**Scanner Version:** 1.1.0

---

## MODULE ARCHITECTURE REPORT

Module: gasprices
Application Scope: VCSM
Module Type: dashboard card module (VPORT type-specific — gas station VPORTs)
Primary Root: apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/
Independence Status: MOSTLY INDEPENDENT
Completeness Status: MOSTLY COMPLETE

---

## PURPOSE

[SOURCE_VERIFIED] Manages gas station fuel price lifecycle for gas-station-type VPORTs. Provides two distinct write paths: (1) citizen fuel price suggestion flow — any authenticated actor can suggest a price update for a gas station VPORT; (2) owner direct update — VPORT owner bypasses suggestion pipeline and upserts official prices directly. Includes suggestion review workflow, bulk update modal, fuel unit toggle (liter/gallon), and station price settings. Feed post publication on price change is integrated via `publishFuelPriceUpdateAsPost.controller.js`.

---

## OWNERSHIP

[SOURCE_VERIFIED] Owner: VCSM:dashboard
Write authority: controller layer — submitFuelPriceSuggestionController, submitOwnerFuelPriceUpdateController, reviewFuelPriceSuggestionController
Ownership enforcement: `resolveVportProfileId` + ownership gate inferred from actorId → profileId resolution. Direct ownership check not visible in submitFuelPriceSuggestion.controller.js — **[SCANNER_LEAD] ownership verification for owner path needs explicit audit**

---

## ENTRY POINTS

[SOURCE_VERIFIED]
- Route: `/actor/:actorId/dashboard/gas` → VportDashboardGasScreen.jsx
- Exported via: `index.js`
- Additional screens: VportGasPricesScreen.jsx, VportDashboardGasView.jsx, VportGasPricesView.jsx

---

## LAYER MAP

DAL:
- `dal/vportFuelPriceHistory.write.dal.js` — INSERT fuel_price_history [SOURCE_VERIFIED]
- `dal/vportFuelPricePost.read.dal.js` — READ fuel price feed post [SOURCE_VERIFIED]
- `dal/vportFuelPriceReviews.write.dal.js` — INSERT/UPDATE fuel_price_submission_reviews + UPDATE fuel_price_submissions [SOURCE_VERIFIED]
- `dal/vportFuelPriceSubmissions.read.dal.js` — READ fuel_price_submissions [SOURCE_VERIFIED]
- `dal/vportFuelPriceSubmissions.write.dal.js` — INSERT fuel_price_submissions [SOURCE_VERIFIED]
- `dal/vportFuelPrices.read.dal.js` — READ fuel_prices [SOURCE_VERIFIED]
- `dal/vportFuelPrices.write.dal.js` — UPDATE + UPSERT fuel_prices [SOURCE_VERIFIED]
- `dal/vportStationPriceSettings.read.dal.js` — READ station settings [SOURCE_VERIFIED]

Model:
- `model/gasErrorMessages.js` — error constants [SOURCE_VERIFIED]
- `model/gasPrices.model.js` — ALLOWED_FUEL_KEYS constants [SOURCE_VERIFIED]
- `model/vportFuelPrice.model.js` [SOURCE_VERIFIED]
- `model/vportFuelPriceSubmission.model.js` [SOURCE_VERIFIED]
- `model/vportStationPriceSettings.model.js` [SOURCE_VERIFIED]

Controller:
- `controller/getVportGasPrices.controller.js` — fetch prices [SOURCE_VERIFIED]
- `controller/publishFuelPriceUpdateAsPost.controller.js` — post creation on price update [SOURCE_VERIFIED]
- `controller/reviewFuelPriceSuggestion.controller.js` — owner reviews citizen suggestion [SOURCE_VERIFIED]
- `controller/submitCitizenFuelPriceSuggestion.controller.js` — citizen submission path [SOURCE_VERIFIED]
- `controller/submitFuelPriceSuggestion.controller.js` — routing coordinator (citizen vs owner) [SOURCE_VERIFIED]
- `controller/submitOwnerFuelPriceUpdate.controller.js` — owner direct upsert path [SOURCE_VERIFIED]
- `controller/updateStationFuelUnit.controller.js` — liter/gallon toggle [SOURCE_VERIFIED]

Hook:
- `hooks/useAfterSubmitSuggestion.js` [SOURCE_VERIFIED]
- `hooks/useGasUnitToggle.js` [SOURCE_VERIFIED]
- `hooks/useOwnerPendingSuggestions.js` [SOURCE_VERIFIED]
- `hooks/useSubmitBulkFuelPrices.js` [SOURCE_VERIFIED]
- `hooks/useSubmitFuelPriceSuggestion.js` [SOURCE_VERIFIED]
- `hooks/useUpdateStationFuelUnit.js` [SOURCE_VERIFIED]
- `hooks/useVportGasPrices.js` [SOURCE_VERIFIED]

Component:
- `components/BulkUpdateFuelPricesModal.jsx` [SOURCE_VERIFIED]
- `components/FuelPriceRow.jsx` [SOURCE_VERIFIED]
- `components/GasPricesPanel.jsx` [SOURCE_VERIFIED]
- `components/GasStates.jsx` — loading/empty/error states [SOURCE_VERIFIED]
- `components/GasUnitToggleBar.jsx` [SOURCE_VERIFIED]
- `components/OwnerPendingSuggestionsList.jsx` [SOURCE_VERIFIED]
- `components/OwnerSuggestionReviewCard.jsx` [SOURCE_VERIFIED]
- `components/VportDashboardGasPanels.jsx` [SOURCE_VERIFIED]

Screen:
- `screens/VportDashboardGasScreen.jsx` [SOURCE_VERIFIED]
- `screens/VportDashboardGasView.jsx` [SOURCE_VERIFIED]
- `screens/VportGasPricesScreen.jsx` [SOURCE_VERIFIED]
- `screens/VportGasPricesView.jsx` [SOURCE_VERIFIED]

Service:
- `services/fuelPriceCache.service.js` — client-side fuel price cache [SOURCE_VERIFIED]

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Two write paths clearly scoped in submitFuelPriceSuggestion.controller.js | — |
| Owner defined | PASS | VCSM:dashboard, controller-owned writes | — |
| Entry points mapped | PASS | /actor/:actorId/dashboard/gas confirmed | — |
| Controllers present/delegated | PASS | 7 controllers covering get/submit/review/publish/toggle | — |
| DAL/repository present/delegated | PASS | 8 DAL files — read and write paths present | — |
| Models/transformers present | PASS | 5 models + error messages | — |
| Hooks/view models present | PASS | 7 hooks | — |
| Screens/components present | PASS | 4 screens + 8 components including GasStates | — |
| Services/adapters present | PASS | fuelPriceCache.service.js | — |
| Database objects mapped | PASS | fuel_prices, fuel_price_history, fuel_price_submissions, fuel_price_submission_reviews, station settings | — |
| Authorization path mapped | PARTIAL | Citizen path: actorId resolved; owner path: resolveVportProfileId used but explicit ownership assert not verified in source | Security gap risk |
| Cache/runtime behavior mapped | PARTIAL | fuelPriceCache.service.js exists; cache invalidation strategy undocumented | — |
| Error/loading/empty states mapped | PASS | GasStates.jsx handles states | — |
| Documentation linked | FAIL | No BEHAVIOR.md | MISSING |
| Tests/validation noted | PASS | 7 test files in __tests__/ | — |
| Native parity noted | FAIL | No notes | — |
| Engine dependencies mapped | PARTIAL | No engine dependency visible; feed post creation may use feed engine | SCANNER_LEAD |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| profiles/kinds/vport/dal/services/resolveVportProfileId.dal | feature-DAL | gasprices → profiles | RISK — direct import across feature boundaries | Should use profiles adapter |
| ALLOWED_FUEL_KEYS | model | internal | YES | gasPrices.model.js |
| feed/notifications (publishFuelPriceUpdateAsPost) | feature | gasprices → feed | SCANNER_LEAD — import path not verified | Post creation on price change |
| fuelPriceCache.service | service | internal | YES | Client-side cache service |
| OwnerOnlyDashboardGuard | route | route wrapper | YES | Route-level auth |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| fuel_prices | read/write | VCSM:dashboard/gasprices | hooks/controllers | UPDATE + UPSERT confirmed |
| fuel_price_history | write | VCSM:dashboard/gasprices | submitOwnerFuelPriceUpdate | INSERT confirmed |
| fuel_price_submissions | read/write | VCSM:dashboard/gasprices | submitCitizenFuelPriceSuggestion + review | Citizen suggestion pipeline |
| fuel_price_submission_reviews | write | VCSM:dashboard/gasprices | reviewFuelPriceSuggestion | Owner review result |
| profile_id | read | profiles feature | controllers | Resolved from actorId server-side |
| ALLOWED_FUEL_KEYS | derived | gasPrices.model.js | controllers | Validates fuel key inputs |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | /actor/:actorId/dashboard/gas | — |
| Loading state | PASS | GasStates.jsx | — |
| Empty state | PASS | GasStates.jsx | — |
| Error state | PASS | GasStates.jsx + gasErrorMessages.js | — |
| Auth/owner gates | PARTIAL | Route guard present; owner path ownership assert unverified | MEDIUM |
| Cache behavior | PARTIAL | fuelPriceCache.service.js present; invalidation undocumented | — |
| Runtime dependencies | PARTIAL | resolveVportProfileId imported directly from profiles feature | MEDIUM |
| Hot paths | PARTIAL | submitFuelPriceSuggestion is most-called; citizen vs owner branch is hot | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | — | MISSING |
| Ownership record | — | MISSING |
| Security audit | Prior (vport exchange publish) | PARTIAL — see Dashboard Security Sprint 2026-05-29 |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | — | MISSING |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Owner path explicit ownership assert verification | HIGH | Owner direct update may not have explicit actor_owners check | VENOM |
| Cross-feature DAL import from profiles | HIGH | Direct import violates adapter boundary rule | SENTRY |
| BEHAVIOR.md | HIGH | Citizen vs owner routing logic undocumented | LOGAN |
| Cache invalidation strategy | MEDIUM | fuelPriceCache.service.js exists without docs | LOKI |
| Feed post creation dependency path | MEDIUM | publishFuelPriceUpdateAsPost import path unverified | IRONMAN |

---

## MODULE BOUNDARY WARNINGS

**MODULE BOUNDARY WARNING**
Location: apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/controller/submitFuelPriceSuggestion.controller.js
Module: gasprices
Current dependency: `import { resolveVportProfileId } from "@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal"`
Expected boundary: Access profiles feature via profiles adapter only
Risk: HIGH — direct DAL import from profiles feature; adapter boundary violation
Suggested correction: Expose `resolveVportProfileId` through profiles adapter

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Audit owner update ownership assert | Security risk — explicit ownership check unverified | VENOM |
| P1 | Fix profiles feature DAL import | Architecture boundary violation | SENTRY |
| P1 | Add BEHAVIOR.md | Citizen vs owner routing logic undocumented | LOGAN |
| P2 | Document cache invalidation | fuelPriceCache missing strategy docs | LOKI |
| P3 | Native parity notes | Not documented | Falcon |

## RECOMMENDED HANDOFFS: VENOM, SENTRY, LOGAN, LOKI
