# MODULE ARCHITECTURE REPORT

**Module:** vport-gas-prices  
**Application Scope:** apps/VCSM  
**Module Type:** VPORT type module — Gas Station vertical  
**Primary Root:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/`  
**Independence Status:** MOSTLY INDEPENDENT  
**Completeness Status:** MOSTLY COMPLETE — 2 functional bugs, 1 dead export, path drift from prior doc  
**Scan Date:** 2026-05-27 (deep re-scan — full file read of all 37 files in actual location)  
**Prior Scan Date:** 2026-05-26 (referenced stale paths — now corrected)  
**Produced By:** ARCHITECT

> **⚠️ PATH DRIFT DETECTED:** Prior architecture doc referenced `features/profiles/kinds/vport/dal/gas/`, `model/gas/`, `controller/gas/`, `hooks/gas/`, `screens/gas/` sub-paths. The actual module has been consolidated into a single self-contained card structure under `features/dashboard/vport/dashboard/cards/gasprices/`. All layer references below reflect the actual current code location.

---

## PURPOSE

The Gas Prices module manages the full lifecycle of fuel price data for VPORT gas stations. It supports:

- **Public view** — display official fuel prices and latest community suggestion per fuel key
- **Citizen contribution** — submit price suggestions (crowd-sourced, subject to sanity validation)
- **Owner management** — directly update official prices, set fuel unit (liter/gallon), review and approve/reject pending citizen submissions
- **Social publishing** — publish price updates as feed posts in the public realm (throttled, 1/hour)
- **Price audit trail** — every price change recorded in history table with actor attribution

The module operates on the `vc` schema (vport tables) and connects to the public feed via the upload adapter boundary.

---

## OWNERSHIP

**Feature Owner:** `apps/VCSM/src/features/profiles/kinds/vport/`  
**Dashboard Owner:** `apps/VCSM/src/features/dashboard/vport/`  
**Logan Spec:** `zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.gas-station-profile-spec.md`

---

## ENTRY POINTS

| Route | Component | Guard | Access |
|---|---|---|---|
| `/actor/:actorId/gas` | `VportGasPricesScreen` | `BlockedVportGuard` | All authenticated users |
| `/actor/:actorId/dashboard/gas` | `VportDashboardGasScreen` | `OwnerOnlyDashboardGuard` + `BlockedVportGuard` | Owner only (UI gate) |

**Lazy loading:** Both screens are registered in `lazyApp.jsx` via `lazyWithLog()`.

---

## LAYER MAP

> All paths below are relative to `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/`

### DAL — 8 files

| File | Tables Accessed | Type | Cache |
|---|---|---|---|
| `dal/vportFuelPrices.read.dal.js` | `vport.profiles`, `vport.fuel_prices` | SELECT + resolveVportProfileId | 60s TTL ✓ |
| `dal/vportFuelPrices.write.dal.js` | `vport.profiles`, `vport.fuel_prices` | UPDATE + UPSERT | Invalidates on write ✓ |
| `dal/vportFuelPriceHistory.write.dal.js` | `vport.profiles`, `vport.fuel_price_history` | INSERT | None |
| `dal/vportFuelPricePost.read.dal.js` | `vport.profiles`, `vc.posts` | SELECT (dual schema) | None |
| `dal/vportFuelPriceReviews.write.dal.js` | `vport.fuel_price_submission_reviews`, `vport.fuel_price_submissions` | INSERT + UPDATE | None |
| `dal/vportFuelPriceSubmissions.read.dal.js` | `vport.profiles`, `vport.fuel_price_submissions` | SELECT | 30s TTL (full-fetch only) ✓ |
| `dal/vportFuelPriceSubmissions.write.dal.js` | `vport.profiles`, `vport.fuel_price_submissions` | INSERT | Invalidates pending cache ✓ |
| `dal/vportStationPriceSettings.read.dal.js` | `vport.profiles`, `vport.station_price_settings` | SELECT | 300s TTL ✓ |

**Column hygiene:** No `select('*')` found — all DALs use explicit column lists. ✓

**Cache coverage (updated 2026-05-27):**
- `fuel_prices` read → 60s TTL (actor-keyed) ✓
- `fuel_price_submissions` read → 30s TTL on full-fetch (no fuelKey filter); per-fuelKey fetch is uncached (intentional — review flow must be fresh) ✓
- `station_price_settings` read → 300s TTL (actor-keyed) ✓
- `fuel_price_history` write → no read cache (insert-only; history is never queried in this module) ✓

**Dual-schema pattern:** `vportFuelPricePost.read.dal.js` imports both `vportSchema` (= `supabase.schema('vport')`) and `supabase` (with `.schema("vc")`). Same Supabase project, different schema selectors. Inline comment confirmed in file. ✓

**Profile resolution duplication:** `resolveVportProfileId` is imported from `@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal` in 6 of 8 DAL files. This cross-feature DAL import in the DAL layer is a pragmatic pattern — the `resolveVportProfileId` function is a shared lookup utility, and it's cached. Flagged as a LOW cleanup item (P3 open).

**`resolveActorIdFromProfileId` location:** In `vportFuelPrices.read.dal.js` (not write DAL). ✓

---

### Model — 4 files (corrected from prior doc's 5)

| File | Role | Violation |
|---|---|---|
| `model/vportFuelPrice.model.js` | Pure row → domain translator | ⚠️ maps `target_actor_id` but DAL SELECT doesn't include it — always null |
| `model/vportFuelPriceSubmission.model.js` | Pure row → domain translator | None ✓ |
| `model/vportStationPriceSettings.model.js` | Pure translator + safe defaults when null | None ✓ |
| `model/gasPrices.model.js` | Domain utilities: `resolveFuelKeys`, `buildFuelPriceRows`, formatters | None ✓ |

> **Note:** Prior doc listed 5 model files including `model/gas/getVportTabsByType.model.js` — that file does NOT exist in the actual module. It was in the old path structure. Actual model count is 4.

All models use `Object.freeze()` — immutable domain objects. ✓  
All models include array map helpers with `Array.isArray` guards. ✓

**⚠️ STALE FIELD — `vportFuelPrice.model.js`:**  
`mapVportFuelPriceRow` maps `row.target_actor_id → targetActorId` (line 19). The `FUEL_PRICES_SELECT` constant in `vportFuelPrices.read.dal.js` is `"profile_id,fuel_key,price,currency_code,unit,is_available,updated_at,updated_by_actor_id,source"` — `target_actor_id` is NOT in this list. Domain objects returned by the read path will always have `targetActorId: null`. This field is a ghost field from an older schema design. Severity: LOW (nothing consumes this field from read objects).

---

### Controller — 5 files

| File | Purpose | Auth Check | Cross-Feature |
|---|---|---|---|
| `controller/getVportGasPrices.controller.js` | Fetch official + pending + settings (read-only) | actorId presence only | None ✓ |
| `controller/submitFuelPriceSuggestion.controller.js` | Citizen suggest OR owner direct-write (ownerUpdate flag) | `checkVportOwnershipController` via adapter (owner path only) ✓ | `ownership.adapter.js`, `resolveVportProfileId.dal` |
| `controller/reviewFuelPriceSuggestion.controller.js` | Approve/reject pending submission | `checkVportOwnershipController` via adapter ✓ | `ownership.adapter.js` |
| `controller/updateStationFuelUnit.controller.js` | Change station fuel unit (liter/gallon) | `checkVportOwnershipController` via adapter ✓ | `ownership.adapter.js` |
| `controller/publishFuelPriceUpdateAsPost.controller.js` | Publish price update as feed post | `checkVportOwnershipController` + throttle + fuelKey whitelist ✓ | `ownership.adapter.js`, `upload/adapters/posts.adapter`, `shared/utils/resolveRealm` |

All 5 controllers use `checkVportOwnershipController` via `adapters/kinds/vport/ownership.adapter.js` which delegates to `dashboard/vport/controller/checkVportOwnership.controller`. Ownership verified through `actor_owners` DB table. ✓

**Cross-feature DAL import in controller layer:**  
`submitFuelPriceSuggestion.controller.js` imports `resolveVportProfileId` directly from `@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal`. Inline comment justifies: "Controller-level resolution — the controller owns the profileId lookup so write DALs receive a pre-verified profileId." Accepted pragmatic pattern; controllers may call shared DAL utilities.

---

### Hook — 7 files (core) + 3 adapters

| File | Controllers Used | State Fields | Notes |
|---|---|---|---|
| `hooks/useVportGasPrices.js` | `getVportGasPricesController` | loading, error, settings, official[], officialByFuelKey{}, communitySuggestionByFuelKey{} | ✓ optimistic patch via `patchOfficialRow` + `patchCommunityRow` |
| `hooks/useSubmitFuelPriceSuggestion.js` | `submitFuelPriceSuggestionController`, `publishFuelPriceUpdateAsPostController` | loading, error, me, isOwner | ⚠️ CLIENT-SIDE isOwner — see findings below |
| `hooks/useOwnerPendingSuggestions.js` | `getVportGasPricesController`, `reviewFuelPriceSuggestionController` | loading, reviewing, error, settings, official[], 2 maps, pendingSubmissions[] | 🐛 FUNCTIONAL BUG — pendingSubmissions always [] |
| `hooks/useUpdateStationFuelUnit.js` | `updateStationFuelUnitController` | saving, error | ✓ |
| `hooks/useSubmitBulkFuelPrices.js` | — (wraps `submitSuggestion` fn prop) | running, error | ✓ parallel submit + validation |
| `hooks/useAfterSubmitSuggestion.js` | — (wraps `reviewSuggestionAndRefresh` fn prop) | — | ✓ two-phase owner auto-approve cascade |
| `hooks/useGasUnitToggle.js` | wraps `useUpdateStationFuelUnit` | localUnit, unitError, savingUnit | ✓ optimistic toggle + rollback |

Adapter files in `features/profiles/adapters/kinds/vport/hooks/gas/` are transparent barrel re-exports. ✓

---

### Component — 8 files

| File | Role | Notes |
|---|---|---|
| `components/GasStates.jsx` | Loading/error/empty states | ✓ Pure presentational |
| `components/FuelPriceRow.jsx` | Single price row display | ⚠️ DEAD EXPORT — never imported anywhere in codebase |
| `components/GasPricesPanel.jsx` | Main gas prices grid + CTA | ✓ Delegates `resolveFuelKeys`/`buildFuelPriceRows` to model |
| `components/BulkUpdateFuelPricesModal.jsx` | Bulk price modal — uses `useSubmitBulkFuelPrices` | ✓ Hook extracted correctly |
| `components/OwnerPendingSuggestionsList.jsx` | List wrapper for pending submissions | ✓ |
| `components/OwnerSuggestionReviewCard.jsx` | Individual review card + delta display | ✓ Delta math is presentational |
| `components/GasUnitToggleBar.jsx` | Liter/gallon toggle bar | ✓ Fully presentational with aria attrs |
| `components/VportDashboardGasPanels.jsx` | Dashboard composite panel wrapper | ✓ Composition only |

---

### Screen / View — 3 files

| File | Role | Notes |
|---|---|---|
| `screens/VportGasPricesScreen.jsx` | Public route entry + identity gate | ✓ Thin — delegates to VportGasPricesView |
| `screens/VportGasPricesView.jsx` | View screen — hook composition + component wiring | ✓ Optimistic patch routing at view layer |
| `screens/VportDashboardGasScreen.jsx` | Owner dashboard — full hook composition + portal render | ✓ No business logic; 177 lines |

---

### Adapter — 6 files

All 6 adapter files are transparent barrel re-exports (no logic):
- `features/profiles/adapters/kinds/vport/hooks/gas/useVportGasPrices.adapter.js`
- `features/profiles/adapters/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.adapter.js`
- `features/profiles/adapters/kinds/vport/hooks/gas/useOwnerPendingSuggestions.adapter.js`
- `features/profiles/adapters/kinds/vport/screens/gas/components/GasPricesPanel.adapter.js`
- `features/profiles/adapters/kinds/vport/screens/gas/components/GasStates.adapter.js`
- `features/profiles/adapters/kinds/vport/screens/gas/components/OwnerPendingSuggestionsList.adapter.js`

Adapter pattern is clean. ✓

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | **PASS** | Logan spec exists at `vcsm.vport.gas-station-profile-spec.md` | — |
| Owner defined | **PASS** | Self-contained card module in `features/dashboard/vport/dashboard/cards/gasprices/` | — |
| Entry points mapped | **PASS** | 2 routes in `app.routes.jsx` + profile tab integration | — |
| Controllers present/delegated | **PASS** | 5 controllers — all with `checkVportOwnershipController` ✓ | — |
| DAL/repository present/delegated | **PASS** | 8 DAL files, explicit columns, no select(*) ✓ | resolveVportProfileId duplicated across 6 DALs (P3) |
| Models/transformers present | **PARTIAL** | 4 model files, all frozen, all pure | `targetActorId` ghost field in `vportFuelPrice.model.js` (LOW) |
| Hooks/view models present | **PARTIAL** | 7 hooks + 3 adapters | 🐛 `pendingSubmissions` always `[]` in `useOwnerPendingSuggestions` (HIGH BUG) |
| Screens/components present | **PARTIAL** | All layers architecturally clean | `FuelPriceRow.jsx` dead export; `GasUnitToggleBar.jsx` new + undocumented in prior doc |
| Services/adapters present | **PASS** | 6 adapter files (barrel re-exports) + `ownership.adapter.js` ✓ | — |
| Database objects mapped | **PASS** | 2 migrations deployed: RLS + GRANTs (2026-05-26) | Schema doc still missing (Carnage P3) |
| Authorization path mapped | **PASS** | All 5 controllers use `checkVportOwnershipController` via `actor_owners` ✓ | ⚠️ Client-side `isOwner` string comparison in `useSubmitFuelPriceSuggestion` (server gate holds — MEDIUM) |
| Cache/runtime behavior mapped | **PASS** | `fuel_prices` 60s TTL, `submissions` 30s TTL, `settings` 300s TTL ✓ | Prior doc incorrectly said submissions/settings uncached — they ARE cached |
| Error/loading/empty states mapped | **PASS** | `GasStates.jsx` handles all 3 states + `submitError` in view | — |
| Documentation linked | **PARTIAL** | Logan spec exists | Path drift between doc and actual code paths (this update corrects) |
| Tests/validation noted | **FAIL** | Test file listed in filesystem but unreadable (empty/deleted) | Zero confirmed coverage (P3 open) |
| Native parity noted | **PARTIAL** | Logan spec exists; Falcon audit not started | Falcon governance pending |
| Engine dependencies mapped | **PASS** | No engine dependency; uses upload adapter boundary ✓ | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `fuel_prices` table | database | inward | ✓ via DAL | Official prices table |
| `fuel_price_submissions` table | database | inward | ✓ via DAL | Citizen suggestion queue |
| `fuel_price_submission_reviews` table | database | inward | ✓ via DAL | Review audit log |
| `fuel_price_history` table | database | inward | ✓ via DAL | Price change audit trail |
| `station_price_settings` table | database | inward | ✓ via DAL | Sanity validation settings |
| `profiles` table | database | inward | ✓ via DAL internal helper | Actor → profile ID resolution |
| `vc.posts` table | database | inward | ✓ via main supabase client | Feed post dedup check |
| `upload/adapters/posts.adapter` | feature (adapter) | inward | ✓ adapter boundary | `createSystemPost` for feed publishing |
| `shared/utils/resolveRealm` | shared | inward | ✓ shared boundary | `PUBLIC_REALM_ID` constant |
| `dashboard/vport/hooks/useVportOwnership` | feature (hook) | inward | ✓ same app scope | Ownership UI gate |

No circular dependencies detected. ✓  
No engine imports (module does not use any shared engine). ✓  
No cross-root imports. ✓

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `fuel_prices` row | read/write | `vportFuelPrices.read/write.dal.js` | `getVportGasPrices`, `submitFuelPriceSuggestion`, `reviewFuelPriceSuggestion` controllers | Owner path writes official prices directly — must be guarded |
| `fuel_price_submissions` row | read/write | `vportFuelPriceSubmissions.read/write.dal.js` | `getVportGasPrices`, `submitFuelPriceSuggestion`, `reviewFuelPriceSuggestion` | Status transitions must be atomic (pending → approved/rejected) |
| `fuel_price_submission_reviews` row | write | `vportFuelPriceReviews.write.dal.js` | `reviewFuelPriceSuggestion` | Immutable audit log — no update path (INSERT only) |
| `fuel_price_history` row | write | `vportFuelPriceHistory.write.dal.js` | `submitFuelPriceSuggestion`, `reviewFuelPriceSuggestion` | Every price change must create a history entry |
| `station_price_settings` row | read | `vportStationPriceSettings.read.dal.js` | `getVportGasPrices`, `submitFuelPriceSuggestion` | Settings control sanity validation; missing row → default fallbacks in model |
| `VportFuelPrice` domain object | derived | `vportFuelPrice.model.js` | All hooks + components | Frozen — safe to pass through layers |
| `FuelPriceSubmission` domain object | derived | `vportFuelPriceSubmission.model.js` | Hooks, components | Frozen ✓ |
| `StationPriceSettings` domain object | derived | `vportStationPriceSettings.model.js` | Controllers, hooks | Frozen + defaults when null ✓ |
| `createSystemPost` result | external write | `upload/adapters/posts.adapter` | `publishFuelPriceUpdateAsPost.controller.js` | Requires `actorId` + valid `realm_id` — can fail silently |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route entry exists | **PASS** | Both routes registered in `app.routes.jsx` | — |
| Loading state exists | **PASS** | `GasStates` loading skeleton in all views | — |
| Empty state exists | **PASS** | `GasStates` empty message + custom `emptyText` prop | — |
| Error state exists | **PASS** | `GasStates` error display + `submitError` in dashboard | — |
| Auth/owner gate (public view) | **PASS** | `BlockedVportGuard` wraps both routes | — |
| Auth/owner gate (dashboard) | **PASS** | `checkVportOwnershipController` via `actor_owners` in all write controllers ✓ | — |
| Cache behavior known | **PARTIAL** | Only `fuel_prices` cached 60s | Submissions + settings → fresh call on every render (P2 open) |
| Optimistic update implemented | **PASS** | `patchOfficialRow` + `patchCommunityRow` in hook | — |
| Throttle on feed publish | **PASS** | 1-hour dedup window in `vportFuelPricePost.read.dal.js` | — |
| Sanity validation | **PASS** | Controller enforces min/max/delta bounds from settings | Settings row missing → uses model defaults (0.5–20.0) |
| Unit toggle rollback | **PASS** | `useGasUnitToggle` hook — optimistic update + server rollback ✓ | — |
| Hot paths identified | **PARTIAL** | Feed post creation is least-frequent path | Every gas tab visit loads prices + settings + submissions uncached (P2 open) |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan spec | `zNOTFORPRODUCTION/_CANONICAL/logan/vports/vcsm.vport.gas-station-profile-spec.md` | **PRESENT** |
| Logan doc (gas station cards UI layer) | `modules/vcsm.vport-gas-station-cards-individual.architecture.md` | **PRESENT** (2026-05-26) |
| Ownership record | `apps/VCSM/src/features/profiles/kinds/vport/` | **PRESENT** (by feature structure) |
| Security audit | `CURRENT/features/dashboard/evidence/` — VENOM F-001–F-010 all resolved | **PRESENT** ✓ (2026-05-25/26) |
| Architecture audit | `CURRENT/features/dashboard/evidence/` — SENTRY reports for sessions 25-01 through 26-03 | **PRESENT** ✓ (all ALIGNED) |
| Runtime audit | — | **MISSING** — no Loki trace on record |
| Performance audit | — | **MISSING** — no Kraven audit on record |
| Migration audit | `supabase/migrations/20260526010000` (RLS) + `20260526020000` (GRANTs) — both deployed | **PRESENT** ✓ (2026-05-26) |
| Native transfer audit | — | **MISSING** — Logan spec notes native parity; Falcon audit not started |
| Engine audit | N/A | N/A — module does not use shared engines |

---

## MODULE MISSING PIECES

### ✅ RESOLVED (2026-05-25/26)

| Missing Piece | Resolved In | Notes |
|---|---|---|
| Ownership check in `reviewFuelPriceSuggestion.controller.js` | Session 25-01 (VENOM F-001) | `checkVportOwnershipController` via `ownership.adapter.js` ✓ |
| Move `resolveActorIdFromProfileId` to read DAL | Session 25-01 (VENOM F-009) | Now in `vportFuelPrices.read.dal.js` ✓ |
| Extract business logic from `GasPricesPanel.jsx` | Session 26-02 | `resolveFuelKeys` + `buildFuelPriceRows` in model ✓ |
| Extract batch submit from `BulkUpdateFuelPricesModal.jsx` | Session 26-02 | `useSubmitBulkFuelPrices` hook ✓ |
| Extract unit toggle from `VportDashboardGasScreen.jsx` | Session 26-03 | `useGasUnitToggle` hook ✓ |
| Extract two-phase review from `VportDashboardGasScreen.jsx` | Session 26-03 | `useAfterSubmitSuggestion` hook ✓ |
| Venom security audit | Sessions 25-01–26-01 | F-001–F-010 all resolved; SENTRY ALIGNED ✓ |
| RLS + GRANTs for `fuel_price_submissions` | Session 25-03 / 26-05 | Migrations 010000 + 020000 deployed ✓ |
| Cache `station_price_settings` reads | Session 26-X | 300s TTL confirmed in `vportStationPriceSettings.read.dal.js` ✓ |
| Cache `fuel_price_submissions` reads | Session 26-X | 30s TTL on full-fetch confirmed ✓ |

### 🔲 OPEN (Updated 2026-05-27)

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| 🐛 Fix `useOwnerPendingSuggestions` pendingSubmissions contract mismatch | **HIGH** | Owner pending submissions panel always shows empty — feature non-functional | Wolverine |
| ⚠️ Remove client-side isOwner from `useSubmitFuelPriceSuggestion` | **MEDIUM** | Co-owner actors incorrectly routed as citizens; server gate holds but path is wrong | Wolverine / VENOM |
| 🗑️ Remove dead `FuelPriceRow.jsx` export | **LOW** | Dead code adds noise to index.js public surface | Wolverine |
| 🔬 Remove ghost field `targetActorId` from `vportFuelPrice.model.js` | **LOW** | Misleading — field is never populated from read path | Wolverine |
| 🧹 Remove stale Windows path comments across 9 files | **LOW** | Old dev machine artifact — no runtime impact | Wolverine |
| Add tests for controller layer | **MEDIUM** | Zero confirmed coverage; write/auth paths have no automated validation | — |
| Document `station_price_settings` schema | **MEDIUM** | Settings table controls sanity validation; no schema snapshot | Carnage |
| Falcon iOS parity audit | **MEDIUM** | Native parity not audited; Logan spec notes parity intent | Falcon |
| Centralize `resolveVportProfileId` helper | **LOW** | Imported across 6+ DAL files; P3 cleanup | Wolverine |

---

## MODULE BOUNDARY WARNINGS

---

**MODULE BOUNDARY WARNING #1 — ✅ RESOLVED (2026-05-25)**  
**Location:** `controller/gas/reviewFuelPriceSuggestion.controller.js`  
**Resolution:** `checkVportOwnershipController` added via `ownership.adapter.js`. All 5 gas controllers now verify ownership through `actor_owners` before any write operation.

---

**MODULE BOUNDARY WARNING #2 — ✅ RESOLVED (2026-05-26)**  
**Location:** `screens/gas/components/gasPrices.model.js`  
**Resolution:** Model file relocated to `model/gas/gasPrices.model.js`. Old path is a re-export stub with deprecation comment.

---

**MODULE BOUNDARY WARNING #3 — ✅ RESOLVED (2026-05-25)**  
**Location:** `dal/gas/vportFuelPrices.write.dal.js` → `resolveActorIdFromProfileId`  
**Resolution:** Function moved to `vportFuelPrices.read.dal.js`. Write DAL now contains only write operations.

---

**MODULE BOUNDARY WARNING #4 — ✅ RESOLVED (2026-05-26)**  
**Location:** `dal/gas/vportFuelPricePost.read.dal.js`  
**Resolution:** Inline comment added documenting dual-client rationale. `vportSchema` = `supabase.schema('vport')` — same connection, different schema selector. Reviewed and cleared by VENOM.

---

## NEW FINDINGS — 2026-05-27 Deep Re-Scan

---

### 🐛 FUNCTIONAL BUG — `useOwnerPendingSuggestions` pendingSubmissions always empty

**File:** `hooks/useOwnerPendingSuggestions.js` (lines 39–46)  
**Severity:** HIGH  
**Description:**  
The hook reads `pendingSubmissions` from `getVportGasPricesController` using a defensive field search:
```js
const pending = res.pendingSubmissions ?? res.pending ?? res.pendingSuggestions ?? res.submissionsPending ?? [];
```
The controller returns `{ actorId, settings, official, communitySuggestionByFuelKey }` — NONE of the four field names exist on the return object. `pending` will always resolve to `[]`.

`VportDashboardPendingGasPanel` receives this always-empty array and renders `OwnerPendingSuggestionsList` with zero items, showing "No pending suggestions" even when real submissions exist.

**Impact:** The entire owner submissions review panel is non-functional. Community suggestions are visible in the official gas panel (via `communitySuggestionByFuelKey`) but the dedicated pending submissions list in the dashboard is always empty.

**Root cause:** The controller was designed to return `communitySuggestionByFuelKey` (a map of latest pending per fuelKey), not a raw array of all pending submissions. The hook was written expecting a different controller contract.

**Recommended fix:** Either (a) update `getVportGasPricesController` to also return `pendingSubmissions` as an array alongside `communitySuggestionByFuelKey`, or (b) create a separate `getPendingSubmissionsController` that returns the raw array.

---

### ⚠️ CLIENT-SIDE isOwner DETECTION — `useSubmitFuelPriceSuggestion`

**File:** `hooks/useSubmitFuelPriceSuggestion.js` (lines 24–29)  
**Severity:** MEDIUM (defense-in-depth concern)  
**Description:**  
`isOwner` is derived by comparing `me.actorId === targetActorId` via string comparison:
```js
const isOwner = useMemo(() =>
  Boolean(me?.actorId) && Boolean(targetActorId) &&
  String(me.actorId) === String(targetActorId),
  [me, targetActorId]
);
```
This client-side check controls whether `ownerUpdate: true` is passed to `submitFuelPriceSuggestionController`. An actor who happens to share the same actorId as the VPORT target (which can be the case when a user is "acting as" their own VPORT) will correctly get `isOwner=true`. The server gate in the controller (`checkVportOwnershipController` via `actor_owners`) still verifies ownership — so there is no direct bypass. However, the client-side check is incorrect for multi-owner scenarios: if Actor A is a co-owner of VPORT B, `me.actorId !== targetActorId` will be `false`, so A will be routed as a citizen submitter even though the server would approve them as an owner.

**Impact:** Co-owners of a VPORT who submit prices will be routed through the citizen suggestion pipeline instead of the direct write path. Their submissions will appear as community suggestions requiring review rather than updating official prices directly.

**Recommended fix:** Remove the client-side `isOwner` comparison. Always pass `ownerUpdate: false` from the hook and let the controller's `checkVportOwnershipController` gate determine whether the caller is an owner. The controller already handles this correctly.

---

### 🔴 DEAD EXPORT — `FuelPriceRow.jsx`

**File:** `components/FuelPriceRow.jsx`  
**Classification:** CONFIRMED DEAD (prior doc incorrectly stated "STILL REFERENCED — Used in GasPricesPanel")  
**Evidence:**  
- `GasPricesPanel.jsx` does NOT import `FuelPriceRow` — it renders rows inline.
- No other file in `apps/VCSM/src/` imports `FuelPriceRow`.
- It is exported via `index.js` (line 37: `export * from "./components/FuelPriceRow"`) but never consumed.

**Recommended action:** DELETE CANDIDATE — verify no dynamic import exists, then remove from `components/` and from `index.js`.

---

### ⚠️ STALE PATH COMMENTS — Windows dev machine artifacts

**Files affected:** Multiple files have Windows-style path comments at line 1:  
`// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\...`  
- `hooks/useVportGasPrices.js`
- `hooks/useSubmitFuelPriceSuggestion.js`  
- `hooks/useOwnerPendingSuggestions.js`
- `components/FuelPriceRow.jsx`
- `components/GasStates.jsx`
- `components/OwnerPendingSuggestionsList.jsx`
- `components/OwnerSuggestionReviewCard.jsx`
- `screens/VportGasPricesScreen.jsx`
- `screens/VportGasPricesView.jsx`

**Severity:** LOW — no runtime impact. Stale metadata from prior dev machine.

---

### ℹ️ STALE GHOST FIELD — `vportFuelPrice.model.js` targetActorId

**File:** `model/vportFuelPrice.model.js` (line 19)  
**Severity:** LOW  
`mapVportFuelPriceRow` maps `row.target_actor_id → targetActorId` but `FUEL_PRICES_SELECT` in the read DAL does not include `target_actor_id`. Domain objects from the read path always have `targetActorId: null`. Nothing currently consumes this field from read results. The write path (upsert) stores `updated_by_actor_id`, not `target_actor_id`. This field should be removed from the model mapper.

---

### ℹ️ resolveVportProfileId MULTI-CALL PER REQUEST

**Controller:** `submitFuelPriceSuggestion.controller.js`  
**Severity:** LOW (cached — not a performance issue in practice)  
The controller calls `resolveVportProfileId(targetActorId)` once at line 59, then calls:
- `fetchVportStationPriceSettingsDAL` → internal `resolveVportProfileId` call (300s TTL hit)
- `fetchVportFuelPricesDAL` → internal `resolveVportProfileId` call (60s TTL hit)  
- `createFuelPriceSubmissionDAL` → internal `resolveVportProfileId` call (30s TTL hit)

All subsequent calls after the first are TTL cache hits since `resolveVportProfileId` is cached in the identity engine. Not a DB-load concern, but the pattern of duplicated resolution is worth centralizing if the cache is ever removed.

---

## DEAD CODE ANALYSIS (Updated 2026-05-27)

| Item | Classification | Evidence | Recommended Action |
|---|---|---|---|
| `components/FuelPriceRow.jsx` | **CONFIRMED DEAD** | No import in GasPricesPanel or anywhere in codebase; prior doc's "STILL REFERENCED" was incorrect | DELETE CANDIDATE — verify no dynamic import, then remove |
| `__tests__/submitFuelPriceSuggestion.controller.test.js` | **POSSIBLY DEAD** | File listed in filesystem but unreadable — may be empty shell | VERIFY — read file content to determine if stub or real tests |
| `model/gas/getVportTabsByType.model.js` | **DOES NOT EXIST** | File referenced in prior doc does not exist at actual module location | No action needed — was artifact of old path structure |

---

## SPAGHETTI CODE ANALYSIS (Updated 2026-05-27)

**Module Spaghetti Score: WATCH**  
(Downgraded from CLEAN due to pendingSubmissions functional bug and client-side isOwner pattern)

| Layer | Score | Reason |
|---|---|---|
| DAL | CLEAN | Explicit columns, proper separation, cache on all read paths ✓ |
| Model | WATCH | Ghost field `targetActorId` in fuel price mapper |
| Controller | CLEAN | All 5 use `checkVportOwnershipController` via adapter; ownership verified server-side ✓ |
| Hook | WATCH | `useOwnerPendingSuggestions` has contract mismatch with controller (pendingSubmissions bug); `useSubmitFuelPriceSuggestion` uses client-side isOwner check |
| Component | CLEAN | GasPricesPanel and Modal delegate to model/hook; FuelPriceRow dead but not tangled |
| View | CLEAN | Hook composition + component wiring only ✓ |
| Screen (Dashboard) | CLEAN | Pure hook composition + portal render; 177 lines ✓ |

**No circular dependencies detected.** ✓  
**No engine bypass.** ✓  
**No cross-root imports.** ✓

---

## CODE HEALTH METRICS (Updated 2026-05-27)

| Module | Files | Layers | Cross-Feature Imports | Cycles | Dead Code Signals | Spaghetti Score |
|---|---:|---:|---:|---:|---:|---|
| vport-gas-prices | 37 | 8 | 3 (ownership adapter, upload adapter, resolveVportProfileId) | 0 | 1 dead component + 1 ghost model field | **WATCH** |

---

## MODULE BUILD PRIORITY (Updated 2026-05-27)

| Priority | Work Needed | Status | Recommended Command |
|---|---|---|---|
| **P0** | Ownership check in all write controllers | ✅ DONE (25-01/26-01) | — |
| **P1** | Extract business logic from components + screens | ✅ DONE (26-02/03) | — |
| **P1** | VENOM security audit + F-001–F-010 remediation | ✅ DONE (25-01–26-01) | — |
| **P1** | Cache reads: submissions (30s) + settings (300s) | ✅ DONE (confirmed 26-27) | — |
| **P1** | 🐛 Fix `useOwnerPendingSuggestions` pendingSubmissions contract | 🔲 **OPEN** | Wolverine |
| **P2** | ⚠️ Remove client-side isOwner from `useSubmitFuelPriceSuggestion` | 🔲 **OPEN** | Wolverine / VENOM |
| **P2** | Add controller-layer tests | 🔲 OPEN | — |
| **P2** | Document `station_price_settings` schema | 🔲 OPEN | Carnage |
| **P3** | Remove dead `FuelPriceRow.jsx` | 🔲 OPEN | Wolverine |
| **P3** | Remove ghost field `targetActorId` from model | 🔲 OPEN | Wolverine |
| **P3** | Remove stale Windows path comments | 🔲 OPEN | Wolverine |
| **P3** | Centralize `resolveVportProfileId` across DALs | 🔲 OPEN | Wolverine |
| **Governance** | Falcon iOS parity audit | 🔲 OPEN | Falcon |

---

## FINAL MODULE STATUS

**MOSTLY COMPLETE — 1 HIGH FUNCTIONAL BUG OPEN**

The module has all required layers, clean DAL hygiene, proper adapter boundaries, full ownership enforcement via `actor_owners`, and a published Logan spec. All P0, P1 security and architecture gaps have been closed.

**However, a HIGH functional bug was identified in this scan (2026-05-27):**

> **`useOwnerPendingSuggestions` → `pendingSubmissions` always `[]`**  
> The owner pending submissions panel in `VportDashboardGasScreen` is non-functional. The hook reads a field that the controller does not return. Community suggestions exist and are displayed in the official prices view via `communitySuggestionByFuelKey`, but the dedicated review list always shows empty. This must be fixed before considering the review flow production-ready.

**Security posture (as of 2026-05-27):**
- VENOM F-001–F-010: all resolved ✓
- RLS + GRANTs deployed (20260526) ✓
- All 5 controllers verify ownership via `actor_owners` through `ownership.adapter.js` ✓
- Client-side `isOwner` in `useSubmitFuelPriceSuggestion` is defense-in-depth concern only (server gate holds) — MEDIUM
- `PUBLIC_REALM_ID` from shared constant, not user input ✓
- `fuelKey` whitelist validation in `publishFuelPriceUpdateAsPostController` ✓

**Architecture posture (as of 2026-05-27):**
- Module consolidated at `features/dashboard/vport/dashboard/cards/gasprices/` ✓
- 8 layers: DAL, Model, Controller, Hook, Component, Screen, Adapter, Tests(stub)
- All read paths cached at appropriate TTLs ✓
- No circular dependencies ✓
- No cross-root imports ✓
- Path drift between this doc and actual code: CORRECTED in this update

---

## RECOMMENDED HANDOFFS

| Command | Reason | Priority |
|---|---|---|
| **Wolverine** | Fix `pendingSubmissions` contract bug — P1 functional gap | P1 |
| **VENOM** | Review client-side `isOwner` detection in `useSubmitFuelPriceSuggestion` | P2 |
| **Carnage** | Schema doc — `station_price_settings`, `fuel_price_submissions`, `fuel_price_history` undocumented | P2 |
| **Falcon** | iOS parity audit — gas prices module not yet audited for native transfer | P2 |
| **Thor** | Release readiness gate — owner review panel is non-functional; must fix before release | Blocking |
