# MODULE ARCHITECTURE REPORT

**Module:** vport-gas-station-cards-individual
**Application Scope:** apps/VCSM
**Module Type:** VPORT type module — Gas Station Card UI Layer
**Primary Root:** `apps/VCSM/src/features/profiles/kinds/vport/screens/gas/` + `apps/VCSM/src/features/dashboard/vport/screens/`
**Independence Status:** DEPENDENT (relies on gas prices data layer, adapters, hooks)
**Completeness Status:** MOSTLY COMPLETE — card UI complete; owner review card has inline logic risk; unit toggle inline in screen
**Scan Date:** 2026-05-26
**Produced By:** ARCHITECT v26.14

---

## PURPOSE

This module covers the **individual card-level UI components** for the gas station domain inside VCSM. These are the rendered presentational surfaces for:

- The **official gas price panel** shown on the owner dashboard
- The **pending community suggestion cards** shown to the owner for approve/reject
- The **owner suggestion review card** (individual card per pending submission)
- The **bulk update modal** for batch official price entry
- The **unit toggle bar** (liter vs gallon) embedded in the dashboard screen

This is distinct from the gas prices data/controller layer, which is covered in `vcsm.vport-gas-prices.architecture.md`.

---

## OWNERSHIP

**Feature Owner:** `apps/VCSM/src/features/profiles/kinds/vport/`
**Dashboard Consumer:** `apps/VCSM/src/features/dashboard/vport/`
**Cross-feature access:** Via adapters only (`@/features/profiles/adapters/kinds/vport/`)
**No engine dependency** — gas station cards are app-local; no shared engine consumed.

---

## ENTRY POINTS

| Entry | File | Context |
|---|---|---|
| Owner dashboard gas screen | `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardGasScreen.jsx` | Route: `/actor/:actorId/dashboard/gas` |
| Official gas panel | `VportDashboardGasPanels.jsx → VportDashboardOfficialGasPanel` | Rendered inside dashboard gas screen |
| Pending suggestions panel | `VportDashboardGasPanels.jsx → VportDashboardPendingGasPanel` | Rendered inside dashboard gas screen |
| Public gas screen | `apps/VCSM/src/features/profiles/kinds/vport/screens/gas/screens/VportGasPricesScreen.jsx` | Public profile tab |

---

## LAYER MAP

### DAL
_(Not directly in card layer — delegated to gas price feature DAL via hooks)_

### Model
- `apps/VCSM/src/features/profiles/kinds/vport/model/gas/gasPrices.model.js`
  - `resolveFuelKeys()` — determines which fuel types are active for this station
  - `buildFuelPriceRows()` — assembles display rows (official + community delta)
  - `formatLastUpdatedAt()` — human timestamp
  - `prettyFuelLabel()` — fuel key to display name

### Controller
_(Not direct — cards receive props from hooks via dashboard screen)_

### Hook (consumed via adapter)
| Hook | Adapter Path | Purpose |
|---|---|---|
| `useVportGasPrices` | `@/features/profiles/adapters/kinds/vport/hooks/gas/useVportGasPrices.adapter` | Official prices + community suggestion map |
| `useSubmitFuelPriceSuggestion` | `@/features/profiles/adapters/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.adapter` | Citizen/owner price submission |
| `useOwnerPendingSuggestions` | `@/features/profiles/adapters/kinds/vport/hooks/gas/useOwnerPendingSuggestions.adapter` | Pending review queue |
| `useGasUnitToggle` | `@/features/dashboard/vport/hooks/gas/useGasUnitToggle` | Local unit state + owner toggle |
| `useAfterSubmitSuggestion` | `@/features/dashboard/vport/hooks/gas/useAfterSubmitSuggestion` | Post-submission workflow (approve + refresh) |

### Component
| Component | File | Purpose |
|---|---|---|
| `GasPricesPanel` (adapter) | `@/features/profiles/adapters/.../GasPricesPanel.adapter` | Price card grid w/ update CTA |
| `GasStates` (adapter) | `@/features/profiles/adapters/.../GasStates.adapter` | Loading/error/empty states |
| `OwnerPendingSuggestionsList` (adapter) | `@/features/profiles/adapters/.../OwnerPendingSuggestionsList.adapter` | Pending suggestions list |
| `OwnerSuggestionReviewCard` | `screens/gas/components/OwnerSuggestionReviewCard.jsx` | Single suggestion card (Approve/Reject) |
| `FuelPriceRow` | `screens/gas/components/FuelPriceRow.jsx` | One fuel row (price + delta + label) |
| `BulkUpdateFuelPricesModal` | `screens/gas/components/BulkUpdateFuelPricesModal.jsx` | Batch price update modal |

### Screen
| Screen | File | Role |
|---|---|---|
| `VportDashboardGasScreen` | `dashboard/vport/screens/VportDashboardGasScreen.jsx` | Combined Final+View Screen (owner-only, auth-gated) |
| `VportGasPricesScreen` | `profiles/kinds/vport/screens/gas/screens/VportGasPricesScreen.jsx` | Public screen wrapper |
| `VportGasPricesView` | `profiles/kinds/vport/screens/gas/view/VportGasPricesView.jsx` | Public view orchestrator |

### Panel Assemblies (Dashboard-Level)
| Export | File |
|---|---|
| `VportDashboardOfficialGasPanel` | `dashboard/vport/screens/components/VportDashboardGasPanels.jsx` |
| `VportDashboardPendingGasPanel` | `dashboard/vport/screens/components/VportDashboardGasPanels.jsx` |

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Clear separation: official panel vs pending panel | — |
| Owner defined | PASS | `apps/VCSM/src/features/profiles/kinds/vport/` | — |
| Entry points mapped | PASS | Dashboard screen + public screen | — |
| Controllers present/delegated | PASS | Delegated via hooks/adapters | — |
| DAL/repository present/delegated | PASS | Accessed through adapter boundary | — |
| Models/transformers present | PASS | `gasPrices.model.js` — pure, clean | — |
| Hooks/view models present | PASS | 5 hooks, all adapter-wrapped | — |
| Screens/components present | PASS | Panel assemblies + cards fully implemented | — |
| Services/adapters present | PASS | Adapters exist for all cross-feature consumers | — |
| Database objects mapped | PASS | `fuel_prices`, `fuel_price_submissions`, `station_price_settings` (in gas prices module) | — |
| Authorization path mapped | PARTIAL | Owner gate in screen via `useVportOwnership` | Unit toggle applies owner check, but panel assembly (`GasPricesPanel`) receives `allowOwnerUpdate` as prop — gate is prop-driven, not internally enforced |
| Cache/runtime behavior mapped | PASS | TTL cache 60s in gas prices DAL | No cache versioning; race condition risk on concurrent updates |
| Error/loading/empty states mapped | PASS | `GasStates` component handles all three states | `GasStates` receives `loading={identityLoading}` only, not gas loading — **⚠ identity load state mixed with data load state** |
| Documentation linked | PARTIAL | `vcsm.vport-gas-prices.architecture.md` covers data layer | This card-layer report is new |
| Tests/validation noted | FAIL | No tests found | No validation layer for card props |
| Native parity noted | FAIL | No iOS parity notes | Cards use `position:fixed` modal pattern via `createPortal` — iOS stacking context rule applies |
| Engine dependencies mapped | PASS | No engine dependency — app-local | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `useVportGasPrices.adapter` | adapter | inbound | YES — adapter pattern | Cross-feature gas prices hook |
| `useSubmitFuelPriceSuggestion.adapter` | adapter | inbound | YES | Write path |
| `useOwnerPendingSuggestions.adapter` | adapter | inbound | YES | Pending review queue |
| `useGasUnitToggle` | hook | local | YES — dashboard-local | Unit toggle state |
| `useAfterSubmitSuggestion` | hook | local | YES — dashboard-local | Post-submit orchestration |
| `GasPricesPanel.adapter` | adapter/component | inbound | YES | Price display |
| `GasStates.adapter` | adapter/component | inbound | YES | State display |
| `OwnerPendingSuggestionsList.adapter` | adapter/component | inbound | YES | List display |
| `useIdentity` | identity engine | inbound | YES — via identityContext | Viewer actor |
| `useVportOwnership` | feature hook | inbound | YES — dashboard-local hook | Owner gate |
| `createVportDashboardShellStyles` | UI utility | local | YES | Shell layout |
| `createPortal` (React DOM) | platform | local | YES | Desktop modal portaling |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `official[]` (fuel price rows) | read | gas prices DAL | GasPricesPanel, unit toggle | — |
| `officialByFuelKey{}` | read/derived | gas prices hook | panels, review cards | Stale on concurrent update |
| `communitySuggestionByFuelKey{}` | read/derived | gas prices hook | GasPricesPanel display | — |
| `pendingSubmissions[]` | read | pending suggestions hook | VportDashboardPendingGasPanel | Derived from `pendingByFuelKey` — filters in screen, not in hook |
| `settings` | read | gas prices DAL | GasPricesPanel | Sanity bounds, unit, display flags |
| `identity` | read | identityContext | submitSuggestion hook, panels | — |
| `actorId` | read | router params | all hooks | Sourced from `useParams` |
| `localUnit` | read/write | `useGasUnitToggle` | unit toggle bar in screen | Optimistic local state |
| `reviewing` (boolean) | read | pending suggestions hook | VportDashboardPendingGasPanel | Loading state for review action |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry exists | PASS | `/actor/:actorId/dashboard/gas` | — |
| Loading state exists | PARTIAL | Identity loading shows `SkeletonCardList`; gas loading delegates to `GasStates` | `GasStates` receives `loading={identityLoading}` (identity) not gas-specific loading — conflated |
| Empty state exists | PASS | `GasStates empty` + "No QR links yet" equivalent | — |
| Error state exists | PARTIAL | `GasStates error` exists | `pendingError` shown via `GasStates` but not styled consistently with official error |
| Auth/owner gate exists | PASS | `useVportOwnership` → renders "Sign in required" or "not your vport" | — |
| Cache behavior known | PASS | 60s TTL; invalidated on write | Race condition on concurrent updates — no version check |
| Runtime dependencies mapped | PASS | All hooks confirmed present | — |
| Hot paths identified | PARTIAL | Owner update → submit → refresh → pending refresh | Double refresh on review is `Promise.allSettled` — acceptable |
| LOKI/KRAVEN handoff recommended | YES | Unit toggle fire-and-forget; no error recovery if `handleUpdateUnit` throws after optimistic patch | LOKI |

---

## MODULE BOUNDARY WARNINGS

### ⚠ WARNING 1 — GasStates conflates identity loading with data loading

```
MODULE BOUNDARY WARNING
Location: VportDashboardGasScreen.jsx:36
Module: vport-gas-station-cards-individual
Current dependency: <GasStates loading={identityLoading} error={null} empty={false} />
Expected boundary: GasStates should receive gas-specific loading state
Risk: MEDIUM — Identity skeleton shows while gas data is already available; gas errors silently hidden during identity resolution
Suggested correction: Pass `loading={loading || identityLoading}` or split into two separate state renderers
```

### ⚠ WARNING 2 — pendingSubmissions filtering done in screen, not in hook

```
MODULE BOUNDARY WARNING
Location: VportDashboardGasScreen.jsx:82-88
Module: vport-gas-station-cards-individual
Current dependency: useMemo() filtering pendingByFuelKey values by status === 'pending' inside screen
Expected boundary: Filtering by status should happen in useOwnerPendingSuggestions hook or model layer
Risk: LOW — Presentation logic in screen; if status values change, screen update required
Suggested correction: Move status filter into useOwnerPendingSuggestions or model layer
```

### ⚠ WARNING 3 — Unit toggle buttons inline-styled in screen body

```
MODULE BOUNDARY WARNING
Location: VportDashboardGasScreen.jsx:152-170
Module: vport-gas-station-cards-individual
Current dependency: Two unit toggle <button> elements rendered inline in screen with inline styles
Expected boundary: Should be extracted to a UnitToggleBar component
Risk: LOW — Presentational drift; difficult to reuse for public gas screen or native transfer
Suggested correction: Extract to apps/VCSM/src/features/dashboard/vport/screens/components/GasUnitToggleBar.jsx
```

### ⚠ WARNING 4 — `allowOwnerUpdate` is a prop-gate, not an internal auth check

```
MODULE BOUNDARY WARNING
Location: VportDashboardOfficialGasPanel (GasPricesPanel.adapter)
Module: vport-gas-station-cards-individual
Current dependency: Panel renders edit controls based on allowOwnerUpdate={true} prop from screen
Expected boundary: GasPricesPanel should not be the auth surface — it relies on parent to set correctly
Risk: MEDIUM — If panel is reused in a non-owner context and parent forgets to pass allowOwnerUpdate={false}, edit controls leak to non-owners
Suggested correction: Pass `isOwner` from identity check into panel; panel asserts rather than trusting prop
```

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| `GasUnitToggleBar` component | LOW | Unit toggle inline in screen; not extractable for reuse or native transfer | Wolverine / component sprint |
| Test coverage | HIGH | No tests for card prop contracts; `allowOwnerUpdate` trust issue undetected by tests | SENTRY |
| iOS stacking context audit | MEDIUM | `createPortal` used for desktop; BulkUpdateFuelPricesModal must not render inside backdrop-filter parents | FALCON |
| Cache race condition guard | MEDIUM | Concurrent updates could serve stale price after invalidation | KRAVEN |
| Accessibility (a11y) | MEDIUM | Unit toggle buttons have no `aria-label`; FuelPriceRow has no SR context | SENTRY |
| Native parity plan | MEDIUM | Gas station card UI has no iOS native transfer notes | FALCON |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc (gas prices) | `vcsm.vport-gas-prices.architecture.md` | PRESENT |
| Logan doc (cards) | This file | PRESENT |
| Ownership record | Implicit via feature folder | PRESENT |
| Security audit | `vcsm-security-report.md` (partial) | PRESENT |
| Runtime audit | MISSING | MISSING |
| Performance audit | MISSING | MISSING |
| Migration audit | `vcsm-migration-risk-report.md` | PRESENT |
| Native transfer audit | MISSING | MISSING |
| Engine audit | N/A | N/A |

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P2 | Extract `GasUnitToggleBar` component from screen | Architecture cleanliness; reuse; native readiness | Wolverine |
| P2 | Move `pendingSubmissions` status filter from screen to hook/model | Layer responsibility compliance | Wolverine |
| P2 | Fix `GasStates` loading prop to use gas-specific loading, not identity loading | Incorrect UX state during identity resolution | Deadpool → Wolverine |
| P2 | Add `isOwner` internal assertion to GasPricesPanel adapter | Prevent edit control leak in reuse contexts | Venom |
| P3 | Add a11y attributes to unit toggle and fuel rows | Accessibility baseline | Wolverine |
| P3 | iOS stacking context audit on `BulkUpdateFuelPricesModal` | PWA correctness on iOS | Falcon |

---

## SPAGHETTI SCORE

**Module:** vport-gas-station-cards-individual
**Score:** WATCH
**Reasons:**
- Screen (`VportDashboardGasScreen`) is doing final screen + view screen work (hooks + composition in same file)
- Unit toggle is an inline component inside a screen that should be extracted
- `pendingSubmissions` filtering in screen is a minor layer leak
- Everything else follows correct DAL → Model → Controller → Hook → Adapter → Component → Screen flow

**Release Risk:** LOW — all critical paths work correctly; issues are organizational and a11y-level

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS

- **FALCON** — iOS stacking context audit on BulkUpdateFuelPricesModal; native parity plan
- **KRAVEN** — Cache race condition on concurrent price updates; double refresh cost on `reviewSuggestionAndRefresh`
- **VENOM** — `allowOwnerUpdate` prop trust issue; no internal auth assertion in GasPricesPanel
- **SENTRY** — Test coverage for card prop contracts; a11y baseline
- **LOGAN** — Link this report from the master gas prices architecture file
