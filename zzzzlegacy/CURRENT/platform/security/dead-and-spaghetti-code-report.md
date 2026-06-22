# DEAD AND SPAGHETTI CODE REPORT

**Application Scope:** VCSM + ENGINE  
**Scan Date:** 2026-05-14  
**Roots Scanned:**
- `apps/VCSM/src/features/booking/`
- `apps/VCSM/src/features/dashboard/vport/` (booking + availability subsystems)
- `engines/booking/src/`

**Scan Context:** Post Cerebro P0 audit (RC-01 through RC-06) on branch `vport-booking-feed-security-updates`

---

## CODE HEALTH METRICS

| Module | Files | Layers | Cross-Feature Imports | Cycles | Dead Code Signals | Spaghetti Score |
|---|---:|---:|---:|---:|---:|---|
| vcsm.booking | 57 (app) + 62 (engine) | 7 (DAL/Model/Controller/Adapter/Hook/Component/Screen) | 2 (notifications adapter, hydration engine) | 0 | 3 | WATCH |
| vcsm.vport-availability | ~25 (app) + 8 (engine) | 6 (DAL/Model/Controller/Hook/Component/Screen) | 1 (booking.adapter.js) | 0 | 3 | WATCH |

---

## DEAD CODE FINDINGS

---

DEAD CODE FINDING

**Location:** `apps/VCSM/src/features/booking/screens/.gitkeep`  
**Code Type:** Placeholder directory  
**Classification:** LIKELY DEAD  
**Evidence:** The `screens/` directory under `features/booking/` contains only a `.gitkeep` file. No screens exist here. All booking-related screens are in `dashboard/vport/screens/` and the public profiles feature. The placeholder was likely created as part of initial feature scaffolding and never populated.  
**Risk:** LOW — No code, no imports. Dead placeholder only.  
**Recommended action:** VERIFY USAGE — If no screens are ever planned for `features/booking/screens/`, remove the placeholder. If screens are planned, document the intended route.  
**Recommended handoff:** IRONMAN

---

DEAD CODE FINDING

**Location:** `apps/VCSM/src/features/booking/components/.gitkeep`  
**Code Type:** Placeholder directory  
**Classification:** LIKELY DEAD  
**Evidence:** The `components/` directory under `features/booking/` contains only a `.gitkeep` file. All booking components live in `dashboard/vport/components/bookingHistory/` and `dashboard/vport/components/calendar/`.  
**Risk:** LOW — No code, no imports.  
**Recommended action:** VERIFY USAGE — If no components are planned for `features/booking/components/`, remove the placeholder.  
**Recommended handoff:** IRONMAN

---

DEAD CODE FINDING

**Location:** `apps/VCSM/src/features/booking/dal/listBookingsByCustomer.dal.js`  
**Code Type:** DAL method  
**Classification:** POSSIBLY LEGACY  
**Evidence:** This DAL exists in the `features/booking/dal/` layer but all active booking history paths use either `dashboard/vport/dal/read/vportBookingHistory.read.dal.js` (owner history) or engine DAL (`dalListVportBookingsByResource`). No hook or controller in the active codebase was found importing `listBookingsByCustomer.dal.js`. The customer booking history for the user-facing surface has not been traced to an active consumer.  
**Risk:** MEDIUM — If this is the intended DAL for the "my bookings" customer view, it should be wired. If it has been superseded by the engine DAL, it is dead weight.  
**Recommended action:** VERIFY USAGE — Search all consumer imports. If no active controller calls this DAL, mark LEGACY.  
**Recommended handoff:** LOKI

---

DEAD CODE FINDING

**Location:** `apps/VCSM/src/features/booking/dal/saveBookingServiceProfileDurationsByServiceIds.dal.js`  
**Code Type:** DAL method  
**Classification:** POSSIBLY LEGACY  
**Evidence:** No active hook or controller in the scanned codebase was found importing this DAL. The service profile management path appears to be handled by the engine (`serviceProfile.write.dal.js`). This may be a legacy app-layer implementation superseded by the engine.  
**Risk:** MEDIUM — If dead, it represents an incomplete write path for service profile durations.  
**Recommended action:** VERIFY USAGE  
**Recommended handoff:** LOKI

---

DEAD CODE FINDING

**Location:** `apps/VCSM/src/features/booking/dal/listBookingServiceProfilesByServiceIds.dal.js`  
**Code Type:** DAL method  
**Classification:** POSSIBLY LEGACY  
**Evidence:** The engine equivalent (`serviceProfile.read.dal.js`) exists and is the active path via `getBookingServiceProfiles` engine controller. The app-layer DAL appears to be an older implementation.  
**Risk:** LOW — Read-only DAL. If truly dead, no functional impact.  
**Recommended action:** VERIFY USAGE  
**Recommended handoff:** LOKI

---

DEAD CODE FINDING

**Location:** `apps/VCSM/src/features/booking/dal/upsertBookingResourceServices.dal.js`  
**Code Type:** DAL method  
**Classification:** POSSIBLY LEGACY  
**Evidence:** Resource service overrides are managed via the engine controller (`upsertResourceServiceOverride`) and engine DAL (`resourceServiceOverride.write.dal.js`). The app-layer DAL may be a legacy pre-engine implementation.  
**Risk:** LOW — If dead, no functional impact.  
**Recommended action:** VERIFY USAGE  
**Recommended handoff:** LOKI

---

## SPAGHETTI CODE FINDINGS

---

SPAGHETTI CODE FINDING

**Location:** `apps/VCSM/src/features/dashboard/vport/dal/read/vportTeam.read.dal.js`  
**Pattern:** Business orchestration inside DAL layer  
**Classification:** HIGH  
**Evidence:**
- `findEligibleBarbersDAL` performs 4-step actor graph resolution: follows query → actor kind split → owner resolution → barber profile category join → hydration engine call
- Calls `hydrateAndReturnSummaries` from the hydration engine directly inside a DAL file
- Crosses three schema boundaries: `vc.actor_follows`, `vc.actors`, `vc.actor_owners`, `vport.profile_categories`, `vport.profiles`
- Returns a fully assembled domain object (with `actorId`, `name`, `avatar`) — not raw DB rows

**Architectural risk:** HIGH — DAL files must perform raw Supabase queries only. Orchestration, hydration engine calls, and multi-step actor resolution belong in a controller. If this function grows or is reused, it will import yet more engine dependencies into the DAL layer, creating hidden cross-layer coupling.

**Suggested untangling direction:**
1. Split into two DALs: `listActorFollowersByActorIdDAL` + `listBarberProfilesByUserIdsDAL`
2. Move orchestration into `vportTeam.controller.js` or a new `findEligibleBarbersController`
3. Call hydration engine from the controller, not the DAL

**Recommended handoff:** SENTRY

---

SPAGHETTI CODE FINDING

**Location:** `apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js` AND `engines/booking/src/controller/assertActorOwnsVportActor.controller.js`  
**Pattern:** Duplicate business rule implementation  
**Classification:** MODERATE  
**Evidence:**
- Both files implement identical ownership assertion logic: actor lookup → kind === "user" check → profile_id extraction → actor_owners join → is_void check
- App-layer version: `getActorByIdDAL` + `readActorOwnerLinkByActorAndUserProfileDAL` (uses direct supabase client)
- Engine version: `dalGetActorById` + `dalReadActorOwnerLink` (uses injected DI client via `getSupabaseClient()`)
- Logic is functionally equivalent; error messages are slightly different prefixes

**Architectural risk:** MEDIUM — If the ownership logic needs updating (e.g., adding team-member bypass, adding audit logging, handling new actor kinds), both implementations must be updated in sync. Drift risk is real.

**Suggested untangling direction:** Accept the duplication as structurally necessary (engine DI isolation prevents importing from apps). Document explicitly that the engine version is authoritative; the app-layer version must mirror it. Consider adding a comment block to both files cross-referencing the other.

**Recommended handoff:** IRONMAN (ownership declaration)

---

SPAGHETTI CODE FINDING

**Location:** `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardBookingHistoryScreen.jsx`  
**Pattern:** Business logic inside screen layer  
**Classification:** LOW  
**Evidence:**
- `filterBookings(bookings, tab)` — status-based filtering with date logic
- `groupByDate(bookings)` — booking grouping into date-keyed Map

These functions are defined inline in the screen file. They contain domain-aware logic (booking status constants, date math) that belongs in a model file, not a screen.

**Architectural risk:** LOW — Pure functions, no side effects. Not a runtime risk, but violates screen responsibility boundary.

**Suggested untangling direction:** Move `filterBookings` and `groupByDate` to `dashboard/vport/model/vportBooking.model.js` or a new `vportBookingView.model.js`.

**Recommended handoff:** SENTRY

---

SPAGHETTI CODE FINDING

**Location:** Two parallel availability write paths active simultaneously  
**Pattern:** Duplicate implementation of the same behavior  
**Classification:** MODERATE  
**Evidence:**

**Path A — Dashboard-native:**
`useVportManageAvailability` → `manageVportAvailabilityRuleController` → `upsertVportAvailabilityRuleDAL` → `vport.availability_rules`

**Path B — Engine-backed:**
`useManageAvailability` (in `features/booking/hooks/`) → `setAvailabilityRule` (engine) → `dalUpsertVportAvailabilityRule` → `vport.availability_rules`

Both paths write to the same table. Path B supports additional fields (`validFrom`, `validUntil`) that Path A does not. Both are exported from adapters and available to consumers.

**Architectural risk:** MEDIUM — No declared canonical path. Feature teams may use either hook. If Path A evolves to add `validFrom/validUntil` support separately from Path B, the field contracts diverge at the DB level while appearing equivalent to UI consumers.

**Suggested untangling direction:** Declare one path canonical via IRONMAN. If Path B (engine) is canonical, migrate `manageVportAvailabilityRuleController` to delegate to the engine `setAvailabilityRule`. If Path A is canonical, deprecate `useManageAvailability` for vport availability writes.

**Recommended handoff:** IRONMAN

---

## DUPLICATE IMPLEMENTATION FINDINGS

---

DUPLICATE IMPLEMENTATION FINDING

**Behavior:** Actor ownership assertion (verify caller owns a vport actor)  
**Locations:**
- `apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js`
- `engines/booking/src/controller/assertActorOwnsVportActor.controller.js`

**Active paths:**
- App-layer version: used by `manageVportAvailabilityRuleController`, `listVportBookingHistoryController`, `createOwnerBookingController`, `updateBookingStatusController`, `rescheduleBookingController` (all via `booking.adapter.js`)
- Engine version: used by engine controllers (`listBookingHistory`, `setAvailabilityRule`, `cancelBooking`, `confirmBooking`, etc.)

**Risk:** MEDIUM — Both are active. Logic is currently identical. Drift risk on future changes.

**Canonical owner:** Engine version is architecturally canonical (DI-injected, framework-agnostic). App-layer version is a necessary bridge until dashboard controllers migrate to engine calls.

**Recommended consolidation path:** Long-term, migrate dashboard controllers to use engine controllers directly (via `@booking` alias), eliminating the need for the app-layer ownership controller. Short-term, add cross-reference comments to both files.

---

DUPLICATE IMPLEMENTATION FINDING

**Behavior:** Vport availability rules write (`vport.availability_rules` upsert)  
**Locations:**
- `apps/VCSM/src/features/dashboard/vport/dal/write/vportAvailabilityRules.write.dal.js` (app-layer)
- `engines/booking/src/dal/vportAvailability.write.dal.js` (engine)

**Active paths:**
- App-layer: called by `manageVportAvailabilityRuleController`
- Engine: called by `setAvailabilityRule` engine controller

**Risk:** MEDIUM — Both write to `vport.availability_rules`. Field support differs (app-layer omits `valid_from`/`valid_until` in the upsert body). Schema drift possible.

**Canonical owner:** Engine DAL is canonical (richer field support, DI-injected).

**Recommended consolidation path:** Migrate `manageVportAvailabilityRuleController` to call the engine `setAvailabilityRule` controller, eliminating the app-layer write DAL for availability rules.

---

DUPLICATE IMPLEMENTATION FINDING

**Behavior:** Booking history read (`vport.bookings` ordered by `starts_at DESC`)  
**Locations:**
- `apps/VCSM/src/features/dashboard/vport/dal/read/vportBookingHistory.read.dal.js`
- `engines/booking/src/dal/vportBooking.read.dal.js::dalListVportBookingsByResource`
- `apps/VCSM/src/features/booking/dal/listBookingsByResource.dal.js`

**Active paths:**
- Dashboard DAL: called by `listVportBookingHistoryController` (active — owner booking history screen)
- Engine DAL: called by `listBookingHistory` engine controller (active — engine history endpoint)
- App-layer booking DAL: no confirmed active consumer found in current scan

**Risk:** LOW — Dashboard and engine DALs serve different controller surfaces (dashboard vs engine). App-layer booking DAL status unconfirmed.

**Canonical owner:** Dashboard DAL for owner history (dashboard/vport surface); engine DAL for engine consumers.

**Recommended consolidation path:** Verify `listBookingsByResource.dal.js` consumer. If dead, mark for deletion. The dashboard and engine DALs may remain as separate surfaces.

---

## DELETION CANDIDATE SAFETY CHECK

| Candidate | Imports Clear | Routes Clear | Dynamic Refs Clear | Runtime Clear | Owner Clear | Status |
|---|:---:|:---:|:---:|:---:|:---:|---|
| `features/booking/screens/.gitkeep` | YES | YES | YES | N/A | UNKNOWN | VERIFY USAGE |
| `features/booking/components/.gitkeep` | YES | YES | YES | N/A | UNKNOWN | VERIFY USAGE |
| `features/booking/dal/listBookingsByCustomer.dal.js` | UNKNOWN | YES | UNKNOWN | NEEDS LOKI | UNKNOWN | VERIFY USAGE |
| `features/booking/dal/saveBookingServiceProfileDurationsByServiceIds.dal.js` | UNKNOWN | YES | UNKNOWN | NEEDS LOKI | UNKNOWN | VERIFY USAGE |
| `features/booking/dal/listBookingServiceProfilesByServiceIds.dal.js` | UNKNOWN | YES | UNKNOWN | NEEDS LOKI | UNKNOWN | VERIFY USAGE |
| `features/booking/dal/upsertBookingResourceServices.dal.js` | UNKNOWN | YES | UNKNOWN | NEEDS LOKI | UNKNOWN | VERIFY USAGE |

All deletion candidates require LOKI runtime verification before any removal action is taken.

---

## FINAL CODE HEALTH STATUS

**WATCH**

The booking and availability write paths are structurally sound after the RC-01 through RC-06 security fixes. All P0 ownership assertions are in place. The codebase is not spaghetti — layers are respected in most cases, dependencies flow correctly, and there are no circular dependencies detected.

Remaining concerns are:
1. A genuine DAL layer violation in `findEligibleBarbersDAL` (HIGH — controller logic inside DAL)
2. Two parallel write paths for availability rules with no declared canonical
3. Duplicate ownership assertion implementations (structurally necessary but drift risk)
4. Several app-layer DAL files with unconfirmed consumers (LOKI verification needed)
5. Business filtering logic inline in booking history screen (LOW)

None of these are release blockers. All should be addressed in the next hardening sprint.

---

*Report generated by ARCHITECT on 2026-05-14. Scope: VCSM + ENGINE. Roots scanned: booking feature, dashboard/vport booking+availability subsystems, engines/booking. Read-only scan — no code modified.*
