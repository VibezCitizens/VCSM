# CONTRACT REVIEW REPORT

**Target:** `vport-booking-feed-security-updates` branch — bookings and gasprices modules
**Application Scope:** VCSM — `apps/VCSM/src/features/dashboard/vport/`
**Date:** 2026-06-05
**Mode:** SECURITY_WARFARE_SIMULATION — Blue Team Step 8 (final)
**Reviewer:** CONTRACT REVIEWER

---

## Review Metadata

**Contracts Reviewed:**
- Architecture Contract: `ZZnotforproduction/CONTRACTS/Architecture/01-core-principles.md`
- Architecture Contract: `ZZnotforproduction/CONTRACTS/Architecture/02-identity-contract.md`
- Architecture Contract: `ZZnotforproduction/CONTRACTS/Architecture/03-layer-contracts.md`
- Architecture Contract: `ZZnotforproduction/CONTRACTS/Architecture/08-dependency-rules.md`
- Architecture Contract: `ZZnotforproduction/CONTRACTS/Architecture/10-structural-integrity.md`
- Architecture Contract: `ZZnotforproduction/CONTRACTS/Architecture/11-naming-conventions.md`

**Files Reviewed (production source, excluding tests):**
- `dashboard/vport/dashboard/cards/gasprices/dal/vportFuelPrices.read.dal.js`
- `dashboard/vport/dashboard/cards/gasprices/dal/vportFuelPriceReviews.write.dal.js`
- `dashboard/vport/dashboard/cards/gasprices/controller/reviewFuelPriceSuggestion.controller.js`
- `dashboard/vport/dashboard/cards/gasprices/controller/publishFuelPriceUpdateAsPost.controller.js`
- `dashboard/vport/dashboard/cards/gasprices/controller/submitOwnerFuelPriceUpdate.controller.js`
- `dashboard/vport/dashboard/cards/gasprices/controller/updateStationFuelUnit.controller.js`
- `dashboard/vport/dashboard/cards/gasprices/services/fuelPriceCache.service.js`
- `dashboard/vport/dashboard/cards/bookings/controller/vportPublicBooking.controller.js`
- `dashboard/vport/dashboard/cards/bookings/controller/updateVportBooking.controller.js`
- `dashboard/vport/dashboard/cards/bookings/controller/createOwnerBooking.controller.js`
- `dashboard/vport/dashboard/cards/bookings/dal/insertVportBooking.write.dal.js`
- `dashboard/vport/dal/read/vportProfile.read.dal.js` (partial — getVportActorIdByProfileIdDAL)

---

## Violations

### VIOLATION — CR-2026-06-05-001

**Rule:** §2.1 DAL Contract — DAL files must not apply business rules, infer actor intent, or infer ownership
**Rule Source:** `Architecture/03-layer-contracts.md` §2.1
**Severity:** HIGH

**File:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/dal/vportFuelPrices.read.dal.js`
**Line:** 12–20

**Issue:**
`resolveActorIdFromProfileId` is exported from a DAL file. This function performs identity resolution — mapping `profileId` to `actor_id`. Identity resolution is application-domain logic, not a raw database read. The comment on line 10 reads: "Exported so controllers can resolve actor_id from a profile_id" — confirming it is a cross-layer service utility masquerading as a DAL export.

**Why This Violates The Contract:**
DAL files answer one question only: *What does the database say?* They must not "infer actor intent, ownership, or permissions." Resolving actor identity from a profile identifier is ownership/identity logic. The function also returns a scalar value (`data?.actor_id ?? null`) rather than a raw database row, violating the "return raw database rows exactly as stored" mandate.

**Required Change:**
Move `resolveActorIdFromProfileId` to a utility or model layer. Controllers that need this translation should call the DAL directly and handle the scalar projection as a named utility, or use a model function that wraps the translation. The DAL file should export only `fetchVportFuelPricesDAL`.

---

### VIOLATION — CR-2026-06-05-002

**Rule:** §2.1 DAL Import Boundary Rule — DAL files may only import Supabase client helpers, schema/table constants, generic low-level query utilities
**Rule Source:** `Architecture/03-layer-contracts.md` §2.1
**Severity:** HIGH

**File:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/dal/vportFuelPrices.read.dal.js`
**Line:** 3

**Issue:**
```js
import { resolveVportProfileId } from "@/features/profiles/kinds/vport/dal/services/resolveVportProfileId.dal";
```
This DAL file imports another feature's DAL service: `resolveVportProfileId` from the `profiles` feature. This is a cross-feature DAL-to-DAL dependency — DAL files must only import Supabase client helpers and low-level query utilities. Importing from another feature's internal DAL path bypasses the adapter boundary and couples two features at the data access layer.

**Why This Violates The Contract:**
DAL Import Boundary Rule forbids importing models, controllers, hooks, components, screens, feature adapters, or domain services. A cross-feature DAL import is a prohibited feature adapter dependency at the wrong layer. This also violates §6.2 Feature Dependency Rule — features may not depend directly on other features unless through that feature's adapter boundary.

**Required Change:**
Remove the cross-feature DAL import. If `profileId → actorId` resolution is needed inside this DAL, either: (a) inline the direct Supabase query for `vport.profiles` where the lookup is needed, or (b) accept `profileId` as an explicit parameter resolved before the DAL is called (push resolution up to the controller layer where cross-feature adapters are permitted).

---

### VIOLATION — CR-2026-06-05-003

**Rule:** §2.1 DAL Contract — DAL files must be deterministic for a given input and reflect only database state
**Rule Source:** `Architecture/03-layer-contracts.md` §2.1
**Severity:** HIGH

**File:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/dal/vportFuelPrices.read.dal.js`
**Line:** 5, 25–28, 37–40, 44–46

**Issue:**
The DAL file maintains an application-level TTL cache (`fuelPriceCache`) and exports a cache invalidation function (`invalidateFuelPriceCache`). The `fetchVportFuelPricesDAL` function checks a cache before hitting the database, and the exported `invalidateFuelPriceCache` function is called by other modules to evict application state.

**Why This Violates The Contract:**
DAL files "must be deterministic for a given input" — a cached DAL is non-deterministic: two calls with identical inputs may return different results depending on cache state. Cache management is application-level logic, not database access. Exporting `invalidateFuelPriceCache` makes the DAL a cache manager, which is a business concern, not a data concern.

**Required Change:**
Move TTL cache management to a service layer or to the controller that owns the use-case. The DAL should always hit the database and return the raw result. Callers (controllers or service objects) own the caching decision.

Note: `FuelPriceCacheService` in `services/fuelPriceCache.service.js` already exists as a cache management object — the cache logic in `vportFuelPrices.read.dal.js` is a duplicate that should be consolidated.

---

### VIOLATION — CR-2026-06-05-004

**Rule:** §4.3 Controller Fan-Out Rule — a controller may call at most 5 external modules
**Rule Source:** `Architecture/10-structural-integrity.md` §4.3
**Severity:** MEDIUM

**File:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/controller/reviewFuelPriceSuggestion.controller.js`
**Line:** 1–14

**Issue:**
`reviewFuelPriceSuggestion.controller.js` imports 10 external collaborators:
1. `fetchFuelPriceSubmissionByIdDAL` (DAL)
2. `createFuelPriceSubmissionReviewDAL` (DAL)
3. `updateFuelPriceSubmissionStatusDAL` (DAL)
4. `upsertVportFuelPriceDAL` (DAL)
5. `resolveActorIdFromProfileId` (DAL — identity utility)
6. `createVportFuelPriceHistoryDAL` (DAL)
7. `checkVportOwnershipController` (via adapter)
8. `mapFuelPriceSubmissionRow` (Model)
9. `mapVportFuelPriceRow` (Model)
10. `FuelPriceCacheService` (Service)

10 collaborators vs. 5 allowed.

**Why This Violates The Contract:**
§4.3 exists to prevent controllers from becoming orchestration monsters. A controller with 10 collaborators owns too many concerns and becomes a god function. The approve and reject paths within this single controller are sufficiently complex to warrant separate controllers.

**Required Change:**
Decompose into at minimum `approveSubmission.controller.js` and `rejectSubmission.controller.js`. Each focused controller will have fewer collaborators. Cache management should move to a service call rather than be a direct collaborator of the controller.

---

### VIOLATION — CR-2026-06-05-005

**Rule:** §4.2 Single Responsibility File Rule — each file must represent one coherent responsibility
**Rule Source:** `Architecture/10-structural-integrity.md` §4.2
**Severity:** MEDIUM

**File:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/vportPublicBooking.controller.js`
**Line:** 13, 26, 35

**Issue:**
`vportPublicBooking.controller.js` exports three separate controllers:
- `getVportResourceAvailabilityController` — reads availability windows
- `listVportBookingResourcesController` — lists resources
- `createVportPublicBookingController` — creates a booking

These are three separate use-cases with different responsibilities, different inputs, and different side effects.

**Why This Violates The Contract:**
§4.2: "If multiple use-cases exist in a domain, they must be separate files." Each of these functions answers a different domain question: one reads availability, one lists resources, one creates a booking. They should not share a file.

**Required Change:**
Split into three files:
- `getVportResourceAvailability.controller.js`
- `listVportBookingResources.controller.js`
- `createVportPublicBooking.controller.js`

---

### VIOLATION — CR-2026-06-05-006

**Rule:** §4.5 File Naming Rule — files must follow defined naming conventions
**Rule Source:** `Architecture/11-naming-conventions.md` §4.5
**Severity:** MEDIUM

**File:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/services/fuelPriceCache.service.js`

**Issue:**
`fuelPriceCache.service.js` uses the `.service.js` extension. The architecture naming contract defines: `.dal.js`, `.model.js`, `.controller.js`, `use*.js`, `.adapter.js`, `.resolver.js`, `.view.jsx`, `Screen.jsx`. The `.service.js` convention is not a defined layer in the VCSM architecture. The `services/` sub-folder is also not a defined architectural layer.

**Why This Violates The Contract:**
The architecture defines specific file naming conventions so the role of every file is obvious from its name alone. An undefined `.service.js` layer creates ambiguity: is this a controller? A utility? A shared helper? Undefined layer names introduce architectural drift.

**Required Change:**
Evaluate whether this object is: (a) a controller utility — move to a utility helper co-located with the controllers; (b) a shared infrastructure concern — move to `shared/lib/` as a generic TTL cache helper. The `fuelPriceCache.service.js` content appears to be a domain-specific wrapper around a TTL cache, which belongs in controller utility space, not a separate `services/` layer.

---

## Warnings

### WARNING — CR-W-001 — Pre-existing folder depth

**Rule:** §4.4 Maximum Folder Depth — max 3 levels below feature root
**Severity:** LOW (pre-existing)

**Path:** `src/features/dashboard/vport/dashboard/cards/bookings/controller/`

The controller files sit 5 levels below `features/dashboard/` (feature root). This exceeds the 3-level maximum. This is a pre-existing structural pattern that predates this branch and affects the entire `vport/dashboard/cards/` sub-tree.

This is flagged as a WARNING rather than a VIOLATION because it was not introduced by this branch. However, it compounds the maintainability concerns raised by VIOLATION-004 and VIOLATION-005.

**Recommended Action:** Track a separate refactor ticket for feature root re-scoping (e.g., treat `features/dashboard/vport/` as the effective feature root, reducing perceived depth).

---

### WARNING — CR-W-002 — getVportActorIdByProfileIdDAL scalar return

**Rule:** §2.1 DAL must "return raw database rows exactly as stored"
**Severity:** LOW

**File:** `apps/VCSM/src/features/dashboard/vport/dal/read/vportProfile.read.dal.js`
**Line:** 30–40

`getVportActorIdByProfileIdDAL` returns `data?.actor_id ?? null` — a scalar field rather than a raw row. While this DAL does perform a legitimate direct DB query without cross-feature imports, the scalar return departs from the raw-row DAL contract. This is a minor contract drift rather than a structural violation at this time.

---

## COMPLIANT Items

| Area | Status | Notes |
|---|---|---|
| Import path rule (§1.1) | COMPLIANT | All imports use `@/` — zero `../` chains found across all reviewed files |
| Module build order (§1.2) | COMPLIANT | DAL → Model → Controller → Hook structure maintained throughout |
| Identity surface rule (§1.3) | COMPLIANT | actorId / kind used throughout; no profileId/vportId on identity surfaces |
| Owner meaning rule (§1.4) | COMPLIANT | Ownership verified through actor_owners via assertActorOwnsVportActorController |
| select('*') ban (§2.1) | COMPLIANT | All DAL files use explicit column projections |
| Cross-feature adapter usage | COMPLIANT | Cross-feature imports use adapters (`booking.adapter`, `ownership.adapter`, `notifications.adapter`, `posts.adapter`) |
| File size rule (§4.1) | COMPLIANT | All reviewed files under 300 lines (max 146 lines) |
| DAL files may not import models/controllers | COMPLIANT | No model or controller imports in DAL files |
| Controller must not import Supabase directly | COMPLIANT | No direct Supabase imports in any controller |
| Dependency direction (§6.1) | COMPLIANT | apps depend on engines/shared; no reversed dependencies |

---

## Summary Counts

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 3 |
| MEDIUM | 3 |
| LOW (warnings) | 2 |
| INFO | 0 |

---

## Overall Status: PARTIALLY COMPLIANT

**CAUTION for release.** No CRITICAL architecture breakage. Three HIGH violations exist in `vportFuelPrices.read.dal.js` — identity logic, cache management, and a cross-feature DAL import all embedded in a DAL file. Three MEDIUM violations cover controller fan-out, single-file multi-controller, and an undefined layer naming convention.

**Security warfare simulation note:** The HIGH violations in `vportFuelPrices.read.dal.js` are architectural quality concerns, not security exploits. They are distinct from the open security findings (VENOM-WS-001/002, ELEK-005, BW-NEW-001) already documented by VENOM/BLACKWIDOW/ELEKTRA. However, the cache-in-DAL pattern (CR-2026-06-05-003) creates non-deterministic reads that compound VENOM-WS-003 (TOCTOU) in the fuel price review flow — the DAL-level cache means that `status !== "pending"` checks in the controller may operate against stale cache state rather than live DB reads.

**CONTRACT REVIEWER does NOT emit THOR_RELEASE_ELIGIBLE. Release authority belongs exclusively to THOR.**

---

## Artifact Links

| Artifact | Path |
|---|---|
| ARCHITECT report | `ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/ARCHITECT/` |
| VENOM report | `ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/VENOM/venom-report.md` |
| BLACKWIDOW report | `ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/BLACKWIDOW/blackwidow-report.md` |
| ELEKTRA report | `ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/ELEKTRA/elektra-report.md` |
| HAWKEYE report | `ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/HAWKEYE/hawkeye-report.md` |
| LOKI report | `ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/LOKI/loki-report.md` |
| SPIDER-MAN report | `ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/SPIDER-MAN/spiderman-report.md` |
