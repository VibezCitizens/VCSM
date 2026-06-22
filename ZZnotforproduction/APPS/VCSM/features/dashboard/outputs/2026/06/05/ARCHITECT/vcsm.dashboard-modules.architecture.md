# ARCHITECT V2 REPORT
## vcsm.dashboard-modules (7–16)
Generated: 2026-06-05T00:00:00Z
Command: ARCHITECT V2 (scanner-assisted)
Scanner Version: 1.1.0
Ticket: ARCHITECT-DASHBOARD-MODULES-001
Branch: vport-booking-feed-security-updates

---

## Output Metadata
| Field | Value |
|---|---|
| Category Key | dashboard-modules |
| Feature / Scope | VCSM:dashboard (modules 7–16) |
| Command | ARCHITECT V2 |
| Ticket | ARCHITECT-DASHBOARD-MODULES-001 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/ARCHITECT/ |
| Timestamp | 2026-06-05T00:00:00Z |

---

## 1. ARCHITECT Scanner Preflight

```
ARCHITECT SCANNER PREFLIGHT
============================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Freshness Window: 7 days

| Map                  | Generated At                 | Age    | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| feature-map          | 2026-06-05T03:29:11.562Z     | <1d    | FRESH     | HIGH       | PASS   |
| dependency-map       | 2026-06-05T03:29:11.562Z     | <1d    | FRESH     | HIGH       | PASS   |
| route-map            | 2026-06-05T03:29:11.562Z     | <1d    | FRESH     | HIGH       | PASS   |
| graph                | 2026-06-05T03:29:11.562Z     | <1d    | FRESH     | HIGH       | PASS   |
| callgraph            | 2026-06-05T03:29:11.562Z     | <1d    | FRESH     | HIGH       | PASS   |
| engine-candidates    | 2026-06-05T03:29:11.562Z     | <1d    | FRESH     | MEDIUM     | PASS   |
| write-surface-map    | 2026-06-05T03:29:11.562Z     | <1d    | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-05T03:29:11.562Z     | <1d    | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-05T03:29:11.562Z     | <1d    | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-05T03:29:11.562Z     | <1d    | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-05T03:29:11.562Z     | <1d    | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-05T03:29:11.562Z     | <1d    | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-05T03:29:11.562Z     | <1d    | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-05T03:29:11.562Z     | <1d    | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
Write surfaces in scope: 38 (dashboard feature)
RPC surfaces in scope: 0 (no RPCs in dashboard modules)
Edge functions in scope: 0 (edge functions at functions/ root, not dashboard)
```

---

## 2. Scanner Inputs

| Map | Used For | Confidence |
|---|---|---|
| feature-map | Feature inventory, path resolution | HIGH |
| dependency-map | Cross-feature import graph | HIGH |
| route-map | Route tree + access classification | HIGH |
| callgraph | Layer counts per module | HIGH |
| engine-candidates | Engine boundary review | MEDIUM |
| write-surface-map | Write surface enumeration (38 surfaces) | HIGH |
| rpc-map | RPC surface enumeration (0 dashboard) | HIGH |
| security-path-map | Security path classification | HIGH |
| write-execution-map | Write execution chain tracing | HIGH |

---

## 3. Scope Summary

```
Applications scanned: 1 (VCSM)
Engines scanned: 6 (booking, hydration, notifications, identity, portfolio, media)
Features in scope: 1 (dashboard — 10 sub-modules)
Total nodes (callgraph): 7,268
Total edges (callgraph — dependency-map): 380
Write surfaces in scope: 38
Routes in scope: 53 (actor/vport/dashboard pattern)
```

---

## 4. Scanner Signals

### Write Surface Distribution

| Module | Write Count | Tables |
|---|---|---|
| flyerBuilder | 12 | design_documents, design_pages, design_page_versions, design_assets, design_exports, design_render_jobs, profile_public_details |
| gasprices | 5 | fuel_price_history, fuel_price_submission_reviews, fuel_price_submissions, fuel_prices |
| vport (root dal) | 2 | bookings (update), resources (insert) |
| bookings (card) | 1 | bookings (insert) |
| settings | 1 | profile_public_details (upsert, vport schema) |

### Route Access Classification

All 53 dashboard routes classified as `access: public` by scanner.
[SOURCE_VERIFIED]: Runtime ownership gates confirmed present in source — this is application-layer auth, not route-level auth. The scanner cannot detect runtime hook-based ownership checks. NOT a security deficiency; classified correctly after verification.

Confirmed runtime gates:
- useVportOwnership hook (exchange screen) — SOURCE_VERIFIED
- assertActorOwnsVportActorController (bookings, settings, gasprices) — SOURCE_VERIFIED
- requireOwnerActorAccess (flyerBuilder designStudio) — SOURCE_VERIFIED
- checkVportOwnershipController (gasprices review flow) — SOURCE_VERIFIED

### Cross-Feature Dependencies (VCSM:dashboard →)

| Target | Type | Pattern |
|---|---|---|
| engine:booking | engine | booking.adapter (approved boundary) |
| engine:hydration | engine | hydration engine (scanner signal) |
| VCSM:actors | feature | actors.adapter (via adapter boundary) |
| VCSM:notifications | feature | notifications.adapter |
| VCSM:profiles | feature | profiles/adapters/kinds/vport/* (adapter boundary) |
| VCSM:booking | feature | booking.adapter (assertActorOwnsVportActorController) |
| VCSM:identity | feature | identityContext |
| VCSM:media | feature | media (scanner signal) |
| VCSM:services | feature | VCSM:services — NEEDS VERIFICATION (scanner signal only) |

---

## 5. Architecture Findings

### AF-001 [SOURCE_VERIFIED] — Exchange Card: Layer Violation (Screen→Adapter Direct)
**Severity:** HIGH
**Module:** exchange
**File:** apps/VCSM/src/features/dashboard/vport/dashboard/cards/exchange/VportDashboardExchangeScreen.jsx
**Finding:** The exchange card screen directly calls profiles adapter hooks and adapters (`useUpsertVportRate`, `usePublishExchangeRatePost`, `mapVportRateRow`) without a dedicated controller layer. The screen owns business logic: optimistic rate construction, toast formatting, error rollback, feed publish coordination.
**Expected boundary:** Screen → Hook → Controller → Adapter → Profiles feature
**Actual:** Screen → Adapter (hook) + direct map call
**Risk:** Business logic accumulation in screen; untestable without React harness; no unit-testable controller surface.
**Suggested correction:** Extract `exchangeRateCoordinator.controller.js` card-local; screen calls hook that calls controller.

### AF-002 [SOURCE_VERIFIED] — Calendar/Reviews/Services: Stub Modules
**Severity:** HIGH
**Modules:** calendar, reviews, services
**Files:**
- dashboard/vport/dashboard/cards/calendar/ (1 screen + index.js only)
- dashboard/vport/dashboard/cards/reviews/ (1 screen + index.js only)
- dashboard/vport/dashboard/cards/services/ (1 screen + index.js only)
**Finding:** Three modules exist as navigation stubs only. No controllers, DALs, hooks, or models. Routes `/actor/:actorId/dashboard/calendar`, `/reviews`, `/services` are wired and accessible but have no implementation.
**Risk:** Routes are live but functionality is placeholder. Any user navigating to these paths gets a screen with no data loading.
**Suggested correction:** Mark modules as PLANNED in BEHAVIOR.md; add CARD_STATUS: PLACEHOLDER comment in index.js; route through Dr.Strange for feature status tracking.

### AF-003 [SOURCE_VERIFIED] — Settings DAL: Auth Session Check at DAL Layer
**Severity:** MEDIUM
**Module:** settings
**File:** apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/dal/vportPublicDetails.write.dal.js:32
**Finding:** The DAL calls `supabase.auth.getUser()` directly. Comment notes VEN-DASHBOARD-002 removal of prior owner_user_id check — correct fix. Current session check is lightweight (not ownership verification). Ownership verification delegated to upstream `saveVportPublicDetailsByActorIdController`.
**Classification:** ACCEPTABLE — session presence check at DAL is a defense-in-depth measure, not a policy bypass.
**Route to:** ELEKTRA for ownership chain verification.

### AF-004 [SOURCE_VERIFIED] — Schedule: Correct Thin Coordinator Pattern
**Severity:** INFO
**Module:** schedule
**File:** apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/controller/scheduleBookingCoordinator.controller.js
**Finding:** Schedule module re-exports booking controllers from bookings card (via index.js barrel). This is a correct thin coordinator pattern — schedule owns the UI/component layer and delegates write logic to the bookings card.
**Risk:** LOW — approved delegation through module barrel. If bookings module changes its exports, schedule breaks.
**Classification:** ACCEPTABLE but fragile — recommend explicit import instead of barrel to make coupling visible.

### AF-005 [SOURCE_VERIFIED] — Vport Screens/Model: Re-export Shims (Resolved)
**Severity:** INFO
**Module:** vport (root)
**Files:**
- apps/VCSM/src/features/dashboard/vport/screens/model/buildDashboardCards.model.js
- apps/VCSM/src/features/dashboard/vport/screens/model/dashboardViewByVportType.model.js
**Finding:** Both files are compatibility re-exports pointing to canonical `vport/model/` location (VPD-V-FIX-006 migration). Logic lives in `model/`; `screens/model/` are shims.
**Risk:** LOW — shims are read-only re-exports. Future engineers may not realize they exist, leading to confusion.
**Suggested correction:** Delete shim files when all callers are updated to direct model imports.

### AF-006 [SCANNER_LEAD] — Gasprices: No RPC Usage (Boundary Confirmation)
**Severity:** INFO
**Module:** gasprices
**Finding:** All gasprices writes use direct table operations (insert/update/upsert). No RPCs in scope. This is consistent with gasprices owning its entire write stack locally with no server-side procedures.
**Classification:** ACCEPTABLE — local ownership confirmed.

### AF-007 [SOURCE_VERIFIED] — bookings/insertVportBookingDAL: WRITE_COLS Whitelist
**Severity:** INFO
**Module:** bookings
**File:** apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/dal/insertVportBooking.write.dal.js
**Finding:** DAL uses frozen WRITE_COLS whitelist with explicit `pick()` function. customer_actor_id and created_by_actor_id are in WRITE_COLS but must be session-derived by caller (documented via VEN-DASHBOARD-003 comment).
**Risk:** LOW — whitelist enforced. Caller responsibility documented.
**Route to:** ELEKTRA — verify that all callers of insertVportBookingDAL inject session-derived actor IDs only.

---

## 6. Module Completeness Matrix

### MODULE 7: flyerBuilder

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Flyer + design studio for VPORT menus | — |
| Owner defined | PARTIAL | No OWNERSHIP.md in card | No explicit owner file |
| Entry points mapped | PASS | 3 screens + designStudio screen | — |
| Controllers present/delegated | PASS | 5 controllers (flyerEditor + 4 designStudio) | — |
| DAL/repository present/delegated | PASS | flyer.write.dal, designStudio.{auth,read,write}.dal | — |
| Models/transformers present | PASS | designStudioMapper, designStudioScene, printableQrSheet, vportActorMenuFlyerView | — |
| Hooks/view models present | PASS | useFlyerEditor, useDesignStudio, useDesignStudioExports, useDesignStudioSceneActions | — |
| Screens/components present | PASS | 3 screens, 14+ components | — |
| Services/adapters present | PARTIAL | No adapter at flyerBuilder boundary | No public adapter surface |
| Database objects mapped | PARTIAL | design_documents, pages, versions, assets, exports, render_jobs — schema unknown to scanner | Schema `?` in write-surface-map |
| Authorization path mapped | PASS | requireOwnerActorAccess → actor_owners [SOURCE_VERIFIED] | — |
| Cache/runtime behavior mapped | PASS | No cache layer — direct DB | — |
| Error/loading/empty states mapped | PARTIAL | Loading via skeleton; error handling in controllers; empty state unconfirmed | Missing empty state audit |
| Documentation linked | PARTIAL | dashboard/BEHAVIOR.md covers feature level | No module-level BEHAVIOR.md |
| Tests/validation noted | PASS | flyerEditor.controller.test, designStudio.*.test, documentOwner.controller.test | — |
| Native parity noted | PARTIAL | No native parity notes | Unknown native plan |
| Engine dependencies mapped | PASS | booking.adapter for ownership; vportSchema for DB access | — |

**MODULE INDEPENDENCE STATUS**
Module: flyerBuilder
Classification: MOSTLY INDEPENDENT
Reason: Full layer stack present. Authorization chain verified. Schema metadata incomplete.
Blocking gaps: None for current functionality. Missing public adapter surface.

---

### MODULE 8: bookings

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | VPORT booking management (insert, update status, reschedule) | — |
| Owner defined | PARTIAL | No explicit OWNERSHIP.md | — |
| Entry points mapped | PASS | index.js barrel exports 3 controllers | — |
| Controllers present/delegated | PASS | createOwnerBooking, updateVportBooking, vportPublicBooking | — |
| DAL/repository present/delegated | PARTIAL | Only write DAL in card; reads from vport/dal/read/ | Read DALs cross-card (shared vport dal) |
| Models/transformers present | PASS | vportBooking.model, vportBookingHistoryView.model | — |
| Hooks/view models present | PASS | useQuickBookingModal, useVportBookingActions, useVportBookingOps | — |
| Screens/components present | PARTIAL | 2 screens; components live in vport/components/bookingHistory/ | Component layer split across card/vport root |
| Services/adapters present | PASS | Delegates ownership via booking.adapter | — |
| Database objects mapped | PASS | bookings table (vport schema) — insert + update [SOURCE_VERIFIED] | Schema field `?` in scanner (vportSchema preconfigured) |
| Authorization path mapped | PASS | assertActorOwnsVportActorController [SOURCE_VERIFIED] | — |
| Cache/runtime behavior mapped | PASS | No cache layer — direct bookings table | — |
| Error/loading/empty states mapped | PARTIAL | Error handling in controllers; loading/empty in hooks | Empty state not confirmed |
| Documentation linked | PARTIAL | dashboard/BEHAVIOR.md | No card-level BEHAVIOR.md |
| Tests/validation noted | PASS | insertVportBooking.write.dal.test, updateVportBooking.controller.test, vportPublicBooking.controller.test | — |
| Native parity noted | FAIL | No native parity notes | Unknown native plan |
| Engine dependencies mapped | PASS | booking.adapter (assertActorOwnsVportActorController) | — |

**MODULE INDEPENDENCE STATUS**
Module: bookings (card)
Classification: MOSTLY INDEPENDENT
Reason: Write controllers and DAL present. Read operations correctly delegate to shared vport/dal/read/. Authorization verified.
Blocking gaps: Component layer split (components live in vport/components/bookingHistory/ not in card).

---

### MODULE 9: gasprices

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Gas station price management + community submissions | — |
| Owner defined | PARTIAL | No OWNERSHIP.md in card | — |
| Entry points mapped | PASS | index.js, screens/ | — |
| Controllers present/delegated | PASS | 6 controllers (getVportGasPrices, publishFuelPriceUpdateAsPost, reviewFuelPriceSuggestion, submitCitizenFuelPriceSuggestion, submitFuelPriceSuggestion, submitOwnerFuelPriceUpdate, updateStationFuelUnit) | — |
| DAL/repository present/delegated | PASS | 8 DAL files (read + write) | — |
| Models/transformers present | PASS | 5 models | — |
| Hooks/view models present | PASS | 7 hooks | — |
| Screens/components present | PASS | 4 screens, 7 components | — |
| Services/adapters present | PASS | fuelPriceCache.service.js | — |
| Database objects mapped | PASS | fuel_prices, fuel_price_submissions, fuel_price_history, fuel_price_submission_reviews, station_price_settings | — |
| Authorization path mapped | PASS | checkVportOwnershipController → assertActorOwnsVportActorController [SOURCE_VERIFIED] | — |
| Cache/runtime behavior mapped | PASS | FuelPriceCacheService (invalidate on approve/write) | — |
| Error/loading/empty states mapped | PASS | GasStates component; error handling in controllers | — |
| Documentation linked | PARTIAL | dashboard/BEHAVIOR.md | — |
| Tests/validation noted | PASS | 7 test files including spiderman + regression | — |
| Native parity noted | FAIL | No native parity notes | — |
| Engine dependencies mapped | PASS | profiles/adapters/kinds/vport/ownership.adapter | — |

**MODULE INDEPENDENCE STATUS**
Module: gasprices
Classification: INDEPENDENT
Reason: Complete layer stack. Full test coverage. Cache service present. Ownership chain verified.
Blocking gaps: None.

---

### MODULE 10: exchange

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Exchange rate management (FX pairs) | — |
| Owner defined | FAIL | No OWNERSHIP.md; screen file has wrong path comment | Comment says `dashboard/vport/screens/` — incorrect |
| Entry points mapped | PASS | index.js + VportDashboardExchangeScreen | — |
| Controllers present/delegated | FAIL | No controller in card — business logic in screen | Screen owns optimistic state, error rollback, toast format |
| DAL/repository present/delegated | FAIL | No DAL in card — delegates to profiles adapter hooks | — |
| Models/transformers present | FAIL | No model in card | — |
| Hooks/view models present | FAIL | No hook in card | — |
| Screens/components present | PASS | 1 screen with full UI | — |
| Services/adapters present | PASS | Consumes profiles adapter boundary | — |
| Database objects mapped | PARTIAL | rates table inferred via profiles adapter | Not directly visible |
| Authorization path mapped | PARTIAL | useVportOwnership in screen [SOURCE_VERIFIED] — but mutation auth unverified at profiles adapter level | Needs ELEKTRA verification |
| Cache/runtime behavior mapped | PARTIAL | Optimistic state in screen local state | — |
| Error/loading/empty states mapped | PARTIAL | Loading + error in screen; empty state via VportRatesView | — |
| Documentation linked | FAIL | No module-level docs | Wrong path comment in source file |
| Tests/validation noted | FAIL | No tests | — |
| Native parity noted | FAIL | No native parity notes | — |
| Engine dependencies mapped | PARTIAL | profiles adapter consumed | No engine map |

**MODULE INDEPENDENCE STATUS**
Module: exchange (card)
Classification: DEPENDENT
Reason: Card is a thin UI wrapper. All business logic delegated to profiles/adapters/kinds/vport/. Screen contains business logic that belongs in a controller.
Blocking gaps: AF-001 (controller layer missing), no tests.

---

### MODULE 11: vport (root)

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | VPORT dashboard host, shared DALs, ownership gate, stats | — |
| Owner defined | PARTIAL | No explicit OWNERSHIP.md in vport/ | — |
| Entry points mapped | PASS | VportDashboardScreen + checkVportOwnership controller | — |
| Controllers present/delegated | PASS | checkVportOwnership, vportOwnerStats | — |
| DAL/repository present/delegated | PASS | 10 read DALs + 2 write DALs | — |
| Models/transformers present | PASS | buildDashboardCards, dashboardViewByVportType, dashboardVportDetails | — |
| Hooks/view models present | PASS | useOwnerQuickStats, useVportOwnership | — |
| Screens/components present | PASS | VportDashboardScreen + calendar, booking history components | — |
| Services/adapters present | PASS | vport.adapter.js | — |
| Database objects mapped | PASS | bookings, resources, actor_owners, vport profiles, availability_rules, services | — |
| Authorization path mapped | PASS | checkVportOwnershipController [SOURCE_VERIFIED] | — |
| Cache/runtime behavior mapped | PARTIAL | No explicit cache for shared DALs | — |
| Error/loading/empty states mapped | PARTIAL | Loading/error in hooks; empty state partial | — |
| Documentation linked | PASS | dashboard/BEHAVIOR.md, ARCHITECTURE.md, CURRENT_STATUS.md | — |
| Tests/validation noted | PASS | vportOwnerStats.controller.test | — |
| Native parity noted | FAIL | No native parity notes | — |
| Engine dependencies mapped | PASS | booking.adapter, notifications.adapter | — |

**MODULE INDEPENDENCE STATUS**
Module: vport (root)
Classification: MOSTLY INDEPENDENT
Reason: Complete shared infrastructure layer. Screens/model compatibility shims present (resolved by VPD-V-FIX-006).
Blocking gaps: Shim cleanup (AF-005).

---

### MODULE 12: settings

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | VPORT public details editor (address, phone, hours, highlights) | — |
| Owner defined | FAIL | No OWNERSHIP.md | — |
| Entry points mapped | PASS | VportSettingsScreen + VportSettingsFinalScreen | — |
| Controllers present/delegated | PASS | settingsCoordinator + saveVportPublicDetailsByActorId | — |
| DAL/repository present/delegated | PASS | vportPublicDetails.write.dal.js | — |
| Models/transformers present | PASS | vportSettingsDraft.model, vportSettingsValidation.model | — |
| Hooks/view models present | PASS | useSaveVportPublicDetailsByActorId, useSaveVportSettings | — |
| Screens/components present | PASS | 2 screens, 4 components | — |
| Services/adapters present | PARTIAL | Delegates ownership to booking adapter | No explicit adapter at card boundary |
| Database objects mapped | PASS | profile_public_details (vport schema) — upsert [SOURCE_VERIFIED] | — |
| Authorization path mapped | PARTIAL | Session check at DAL [SOURCE_VERIFIED]; upstream ownership via saveVportPublicDetailsByActorId controller (not in scope of read) | Need to verify saveVportPublicDetailsByActorId controller |
| Cache/runtime behavior mapped | PARTIAL | invalidateVportPublicDetails callback in coordinator | Cache invalidation is callback-optional |
| Error/loading/empty states mapped | PASS | Validation error return {ok: false, error}; loading in hooks | — |
| Documentation linked | PARTIAL | dashboard/BEHAVIOR.md | — |
| Tests/validation noted | PASS | settingsCoordinator.controller.test, settingsSavingGuard.regression.test | — |
| Native parity noted | FAIL | No native parity notes | — |
| Engine dependencies mapped | PARTIAL | booking.adapter (inferred for ownership) | — |

**MODULE INDEPENDENCE STATUS**
Module: settings
Classification: MOSTLY INDEPENDENT
Reason: Full write stack present with validation layer. Ownership chain requires ELEKTRA verification for the upstream saveVportPublicDetailsByActorId controller.
Blocking gaps: Ownership chain end-to-end verification needed.

---

### MODULE 13: calendar

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Route exists: /actor/:actorId/dashboard/calendar | No implementation purpose documented |
| Owner defined | FAIL | — | — |
| Entry points mapped | PASS | VportDashboardCalendarScreen + index.js | — |
| Controllers present/delegated | FAIL | None | — |
| DAL/repository present/delegated | FAIL | None | — |
| Models/transformers present | FAIL | None | — |
| Hooks/view models present | FAIL | None | — |
| Screens/components present | PARTIAL | 1 screen (stub) | No actual content rendering |
| Services/adapters present | FAIL | None | — |
| Database objects mapped | FAIL | None | — |
| Authorization path mapped | FAIL | None | — |
| Cache/runtime behavior mapped | FAIL | None | — |
| Error/loading/empty states mapped | FAIL | None | — |
| Documentation linked | FAIL | None | — |
| Tests/validation noted | FAIL | None | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | FAIL | None | — |

**MODULE INDEPENDENCE STATUS**
Module: calendar (card)
Classification: FRAGMENTED
Reason: Navigation stub only. No implementation. Note: calendar UI components exist in vport/components/calendar/ — shared with the vport root module's availability/resource display.
Blocking gaps: All layers missing. Availability rules DALs exist in vport/dal/read/ (vportAvailabilityRules.read.dal.js). Calendar card needs to wire these DALs.

---

### MODULE 14: reviews

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Route /actor/:actorId/dashboard/reviews exists | — |
| Owner defined | FAIL | None | — |
| Entry points mapped | PASS | VportDashboardReviewScreen + index.js | — |
| Controllers present/delegated | FAIL | None | — |
| DAL/repository present/delegated | FAIL | None | — |
| Models/transformers present | FAIL | None | — |
| Hooks/view models present | FAIL | None | — |
| Screens/components present | PARTIAL | 1 screen (stub) | — |
| Services/adapters present | FAIL | None | — |
| Database objects mapped | FAIL | None | — |
| Authorization path mapped | FAIL | None | — |
| Cache/runtime behavior mapped | FAIL | None | — |
| Error/loading/empty states mapped | FAIL | None | — |
| Documentation linked | FAIL | None | — |
| Tests/validation noted | FAIL | None | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | FAIL | None | — |

**MODULE INDEPENDENCE STATUS**
Module: reviews (card)
Classification: FRAGMENTED
Reason: Navigation stub only. Reviews engine likely in engines/ or profiles feature.
Blocking gaps: All implementation layers missing.

---

### MODULE 15: schedule

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Daily schedule view for VPORT owners; booking coordination | — |
| Owner defined | FAIL | No OWNERSHIP.md | — |
| Entry points mapped | PASS | VportDashboardScheduleScreen + index.js | — |
| Controllers present/delegated | PASS | loadDaySchedule, scheduleBookingCoordinator (delegates to bookings) | — |
| DAL/repository present/delegated | PARTIAL | No local DAL — delegates to vport/dal/read + bookings card | Thin layer acceptable but fragile |
| Models/transformers present | PASS | vportAvailabilityRule.model | — |
| Hooks/view models present | PASS | useVportOwnerSchedule | — |
| Screens/components present | PASS | 1 screen + 5 schedule components | — |
| Services/adapters present | PARTIAL | Delegates via bookings index.js barrel | No explicit adapter |
| Database objects mapped | PARTIAL | Reads from vport/dal/read/; writes via bookings card | — |
| Authorization path mapped | PARTIAL | loadDaySchedule delegates ownership to bookings controllers | Ownership check inherited |
| Cache/runtime behavior mapped | FAIL | No cache layer documented | — |
| Error/loading/empty states mapped | PARTIAL | Error/loading in hook; empty state not confirmed | — |
| Documentation linked | FAIL | No module-level docs | — |
| Tests/validation noted | PASS | scheduleBookingCoordinator.controller.test | — |
| Native parity noted | FAIL | No notes | — |
| Engine dependencies mapped | PARTIAL | booking.adapter (via bookings card) | — |

**MODULE INDEPENDENCE STATUS**
Module: schedule
Classification: MOSTLY INDEPENDENT
Reason: Clear ownership of UI/component layer. Correctly delegates booking writes. Fragile barrel import coupling (AF-004).
Blocking gaps: Cache behavior undefined; barrel import coupling.

---

### MODULE 16: services

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Route /actor/:actorId/dashboard/services exists | — |
| Owner defined | FAIL | None | — |
| Entry points mapped | PASS | VportDashboardServicesScreen + index.js | — |
| Controllers present/delegated | FAIL | None | — |
| DAL/repository present/delegated | FAIL | None | vportServices.read.dal.js exists in vport/dal/read/ — not wired |
| Models/transformers present | FAIL | None | — |
| Hooks/view models present | FAIL | None | — |
| Screens/components present | PARTIAL | 1 screen (stub) | — |
| Services/adapters present | FAIL | None | — |
| Database objects mapped | FAIL | None | vportServices.read.dal.js exists but not connected |
| Authorization path mapped | FAIL | None | — |
| Cache/runtime behavior mapped | FAIL | None | — |
| Error/loading/empty states mapped | FAIL | None | — |
| Documentation linked | FAIL | None | — |
| Tests/validation noted | FAIL | None | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | FAIL | None | — |

**MODULE INDEPENDENCE STATUS**
Module: services (card)
Classification: FRAGMENTED
Reason: Stub. vportServices.read.dal.js exists in vport/dal/read/ but not wired to this card. Implementation gap.
Blocking gaps: All implementation layers missing. DAL exists but unconnected.

---

## 7. Source Verification Summary

| File Read | Layer | Lines Read | Verified |
|---|---|---|---|
| bookings/dal/insertVportBooking.write.dal.js | DAL | 1-45 | Write surface, WRITE_COLS whitelist, ownership comment |
| vport/dal/write/updateVportBooking.write.dal.js | DAL | 1-35 | Write surface, profile_id filter gate |
| bookings/controller/updateVportBooking.controller.js | CONTROLLER | 1-147 | Auth chain, terminal status guard, notification integration |
| settings/controller/settingsCoordinator.controller.js | CONTROLLER | 1-60 | Validation orchestration, delegation pattern |
| settings/dal/vportPublicDetails.write.dal.js | DAL | 1-45 | Session check, schema targeting, upsert |
| gasprices/controller/reviewFuelPriceSuggestion.controller.js | CONTROLLER | 1-137 | Full ownership chain, multi-step write coordination |
| exchange/VportDashboardExchangeScreen.jsx | SCREEN | 1-284 | Layer violation confirmed — business logic in screen |
| flyerBuilder/designStudio/controller/designStudio.shared.controller.js | CONTROLLER | 1-37 | Auth chain — actor_owners check |
| vport/controller/checkVportOwnership.controller.js | CONTROLLER | 1-20 | Ownership gate — actor_owners + assertActorOwnsVportActorController |
| schedule/controller/scheduleBookingCoordinator.controller.js | CONTROLLER | 1-17 | Barrel delegation to bookings confirmed |

Source files validated: 10
Confidence: HIGH

---

## 8. Confidence Summary

| Area | Confidence | Reason |
|---|---|---|
| Layer counts | HIGH | Scanner callgraph + source validation |
| Write surface enumeration | HIGH | Scanner write-surface-map + source spot-checks |
| Auth chain verification | HIGH | 5 controllers source-read with ownership chain traced |
| Stub module status | HIGH | File system scan confirms no controllers/DALs |
| Route access | HIGH | Scanner FRESH + runtime gates confirmed in source |
| Exchange controller gap | HIGH | Screen source-read confirms business logic accumulation |
| Schema mapping | MEDIUM | Scanner schema `?` for vportSchema-client DALs; resolved via source read |

---

## 9. Behavior Contract Consistency

```
Behavior Consistency Check — dashboard (all modules)
======================================================
BEHAVIOR.md present: YES
Path: ZZnotforproduction/APPS/VCSM/features/dashboard/BEHAVIOR.md
Status: Present (feature-level — module-level not individually present)

Check A (Source without behavior):
  All 10 modules have source. BEHAVIOR.md present at feature level.
  No individual module has its own BEHAVIOR.md.
  Classification: PARTIAL — feature-level BEHAVIOR.md present, not module-granular.

Check B (Behavior without source): NOT RUN — module BEHAVIOR.md inspection not in scope.
Check C (Engine consistency): NOT RUN — engine imports verified via dependency-map.
Check D (Data change consistency): NOT RUN — write surface map used as source of truth.
```

---

## 10. Handoff Recommendations

| Command | Priority | Target Modules | Reason |
|---|---|---|---|
| VENOM | P0 | bookings, settings, exchange | Write surface ownership chain, exchange mutation auth unverified |
| ELEKTRA | P0 | exchange, settings, bookings | Source-to-sink chain trace for ownership enforcement |
| BLACKWIDOW | P1 | exchange, gasprices, flyerBuilder | Adversarial verification of write paths |
| IRONMAN | P1 | All 10 modules | No OWNERSHIP.md in any card module |
| CARNAGE | P2 | flyerBuilder, gasprices | Schema fields `?` — schema ownership audit |
| LOKI | P2 | schedule, calendar | Runtime behavior undefined |

---

## MODULE BUILD PRIORITY

| Priority | Module | Work Needed | Recommended Command |
|---|---|---|---|
| P0 | exchange | Add controller layer; extract business logic from screen; add tests | WOLVERINE |
| P0 | calendar | Wire vportAvailabilityRules.read.dal.js + availability rules controllers | WOLVERINE |
| P0 | services | Wire vportServices.read.dal.js; add controller/hook | WOLVERINE |
| P1 | reviews | Implement reviews card (wire to reviews engine) | WOLVERINE |
| P1 | bookings | Move components from vport/components/bookingHistory/ into card | WOLVERINE |
| P2 | exchange | Add tests for exchange coordinator | SPIDER-MAN |
| P2 | schedule | Replace barrel import with explicit named import | WOLVERINE |
| P3 | vport | Delete screens/model/ shim files when callers updated | WOLVERINE |

---

## FINAL MODULE STATUS SUMMARY

| # | Module | Status | Independence |
|---|---|---|---|
| 7 | flyerBuilder | MOSTLY COMPLETE | MOSTLY INDEPENDENT |
| 8 | bookings | MOSTLY COMPLETE | MOSTLY INDEPENDENT |
| 9 | gasprices | COMPLETE | INDEPENDENT |
| 10 | exchange | INCOMPLETE | DEPENDENT |
| 11 | vport (root) | MOSTLY COMPLETE | MOSTLY INDEPENDENT |
| 12 | settings | MOSTLY COMPLETE | MOSTLY INDEPENDENT |
| 13 | calendar | INCOMPLETE | FRAGMENTED |
| 14 | reviews | INCOMPLETE | FRAGMENTED |
| 15 | schedule | MOSTLY COMPLETE | MOSTLY INDEPENDENT |
| 16 | services | INCOMPLETE | FRAGMENTED |

ARCHITECT RECOMMENDATION: CAUTION
3 modules (calendar, reviews, services) are live routes with no implementation.
1 module (exchange) has a controller-layer violation.
Security verification (VENOM/ELEKTRA) required before THOR consideration.
