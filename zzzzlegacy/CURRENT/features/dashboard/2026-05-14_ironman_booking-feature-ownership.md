# IRONMAN Ownership Report — Booking Feature System

**Date:** 2026-05-14  
**Reviewer:** IRONMAN  
**Application Scope:** VCSM + ENGINE  
**Trigger:** Cerebro audit — confirm roadmap status for 12 dead feature DALs; resolve ownership conflicts in three-tier booking architecture  
**Mode:** Read-only analysis

---

## IRONMAN TARGET

```
Feature / Engine:  Booking — feature layer + engine layer + dashboard extension
Application Scope: VCSM + ENGINE
Reason:            12 feature DALs confirmed dead in production (Loki); 2 CRITICAL security gaps
                   in live paths require clear ownership to assign fixes; three-tier architecture
                   has no documented canonical migration plan
```

---

## RESPONSIBILITY CLASSIFICATION

| Responsibility Type | Owner | Confidence | Notes |
|---|---|:---:|---|
| Booking creation (customer) | `engines/booking` | HIGH | `useCreateBooking` → engine `createBooking` |
| Booking creation (owner/walk-in) | `dashboard/vport/controller` | HIGH | `createOwnerBookingController` |
| Cancel booking | `features/booking/controller` | HIGH | `cancelBookingController` — active, protected |
| Confirm booking | `features/booking/controller` | HIGH | `confirmBookingController` — active, protected |
| Actor ownership assertion | CONFLICTED | HIGH | Feature + engine both implement; feature version is the one used by app |
| Booking history (owner) | `dashboard/vport/controller` | HIGH | `listVportBookingHistoryController` — correct |
| Booking history (engine) | ENGINE (unprotected) | HIGH | `listBookingHistory` — no ownership gate — CRITICAL gap |
| Customer appointment list | `features/booking/controller` | HIGH | `listMyBookingsController` |
| Service catalog read | `features/booking/controller` | HIGH | `bookingServices.controller.js` |
| Availability rule management | CONFLICTED | HIGH | Dashboard owns production path; feature + engine have dead/superseded versions |
| Availability exception management | ENGINE (no UI) | MEDIUM | Engine has controller; no production UI exists yet |
| Resource management (owner) | ENGINE | HIGH | Engine owns `listOwnerBookingResources`, `ensureOwnerBookingResource` |
| Slot duration configuration | ENGINE | MEDIUM | Engine owns; feature version is dead diagnostics copy |
| Adapter public surface | `features/booking/adapters` | HIGH | `booking.adapter.js` is the single public boundary |
| DAL ownership (live 8) | `features/booking/dal` | HIGH | 8 active DALs confirmed |
| DAL ownership (dead 12) | DISPUTED | HIGH | Superseded by engine; awaiting removal decision |

---

## THREE-TIER OWNERSHIP MAP

### Production Active Paths and Their Owners

```
┌──────────────────────────────────────────────────────────────────┐
│                     BOOKING OWNERSHIP MAP                        │
├─────────────────┬────────────────────────────────────────────────┤
│ FLOW            │ OWNER TIER                                     │
├─────────────────┼────────────────────────────────────────────────┤
│ Customer books  │ ENGINE (createBooking, getResourceAvailability)│
│ Owner creates   │ DASHBOARD (createOwnerBookingController)        │
│ Cancel/Confirm  │ FEATURE (cancelBooking, confirmBooking)         │
│ Owner history   │ DASHBOARD (listVportBookingHistory)             │
│ Customer history│ FEATURE (listMyBookings → useBookingOps)        │
│ Public services │ FEATURE (bookingServices.controller.js)         │
│ Availability    │ DASHBOARD (manageVportAvailabilityRule)          │
│                 │  ← ENGINE also has; feature version is dead     │
│ Ownership check │ FEATURE (assertActorOwnsVportActor)             │
│                 │  ← ENGINE also has; feature version in use      │
│ Resources list  │ ENGINE (listOwnerBookingResources)              │
└─────────────────┴────────────────────────────────────────────────┘
```

---

## ROADMAP STATUS — 12 DEAD FEATURE DALs

Loki confirmed all 12 are dead in production. Ironman now classifies their roadmap status.

| DAL File | Engine Equivalent | Dashboard Equivalent | Roadmap Status | Decision |
|---|---|---|---|---|
| `insertBooking.dal.js` | `engines/booking/src/dal/booking.write.dal.js` | `insertVportBooking.write.dal.js` | SUPERSEDED | DELETE CANDIDATE |
| `insertBookingResource.dal.js` | `engines/booking/src/dal/resource.write.dal.js` | `vportResource.write.dal.js` | SUPERSEDED | DELETE CANDIDATE |
| `listAvailabilityExceptionsInRange.dal.js` | `engines/booking/src/dal/availability.read.dal.js` | — | SUPERSEDED | DELETE CANDIDATE |
| `listAvailabilityRulesByResourceId.dal.js` | `engines/booking/src/dal/availability.read.dal.js` | `vportAvailabilityRules.read.dal.js` | SUPERSEDED | DELETE CANDIDATE |
| `listBookingResourceServicesByResourceId.dal.js` | `engines/booking/src/dal/serviceProfile.read.dal.js` | — | SUPERSEDED | DELETE CANDIDATE |
| `listBookingResourcesByOwnerActorId.dal.js` | `engines/booking/src/dal/resource.read.dal.js` | `vportResource.read.dal.js` | SUPERSEDED | DELETE CANDIDATE |
| `listBookingsByResource.dal.js` | `engines/booking/src/dal/booking.read.dal.js` | `vportBookingHistory.read.dal.js` | SUPERSEDED | DELETE CANDIDATE |
| `listBookingsInRange.dal.js` | `engines/booking/src/dal/booking.read.dal.js` | `vportBookingsInRange.read.dal.js` | SUPERSEDED | DELETE CANDIDATE |
| `saveBookingServiceProfileDurationsByServiceIds.dal.js` | `engines/booking/src/dal/serviceProfile.write.dal.js` | — | SUPERSEDED | DELETE CANDIDATE |
| `upsertAvailabilityException.dal.js` | `engines/booking/src/dal/availability.write.dal.js` | — | SUPERSEDED — engine owns exceptions | DELETE CANDIDATE |
| `upsertAvailabilityRule.dal.js` | `engines/booking/src/dal/availability.write.dal.js` | `vportAvailabilityRules.write.dal.js` | SUPERSEDED | DELETE CANDIDATE |
| `upsertBookingResourceServices.dal.js` | `engines/booking/src/dal/resourceServiceOverride.write.dal.js` | — | SUPERSEDED | DELETE CANDIDATE |

**Ironman roadmap verdict: All 12 are DELETE CANDIDATES.**  
Every one has a confirmed engine or dashboard equivalent. None are on the product roadmap as feature-layer implementations — the engine is the canonical path for all these behaviors. The exception management UI (no screen exists yet) will be built using the engine, not the feature-layer DAL.

**Deletion safety conditions (per ARCHITECT §27.6):**
- ✅ No imports found in production screens/components (Loki confirmed)
- ✅ No route reference found
- ✅ No confirmed dynamic import reference
- ✅ No confirmed runtime call (Loki confirmed)
- ✅ Engine equivalent exists and covers same behavior
- ⚠️ Wolverine must stage removal as a batch — remove entire feature controller chain for each dead DAL together

---

## DEAD FEATURE CONTROLLERS — ROADMAP STATUS

| Controller | Engine Equivalent | Roadmap Status | Decision |
|---|---|---|---|
| `listBookingHistory.controller.js` | `engines/booking/src/controller/listBookingHistory.controller.js` | SUPERSEDED | DELETE CANDIDATE |
| `createBooking.controller.js` | `engines/booking/src/controller/createBooking.controller.js` | SUPERSEDED | DELETE CANDIDATE |
| `ensureOwnerBookingResource.controller.js` | `engines/booking/src/controller/ensureOwnerBookingResource.controller.js` | SUPERSEDED | DELETE CANDIDATE |
| `getResourceAvailability.controller.js` | `engines/booking/src/controller/getResourceAvailability.controller.js` | SUPERSEDED | DELETE CANDIDATE |
| `listOwnerBookingResources.controller.js` | `engines/booking/src/controller/listOwnerBookingResources.controller.js` | SUPERSEDED | DELETE CANDIDATE |
| `setAvailabilityException.controller.js` | `engines/booking/src/controller/setAvailabilityException.controller.js` | SUPERSEDED | DELETE CANDIDATE |
| `setAvailabilityRule.controller.js` | `engines/booking/src/controller/setAvailabilityRule.controller.js` | SUPERSEDED | DELETE CANDIDATE |
| `setResourceSlotDuration.controller.js` | `engines/booking/src/controller/setResourceSlotDuration.controller.js` | SUPERSEDED | DELETE CANDIDATE |

**8 feature controllers are DELETE CANDIDATES** — all superseded by engine equivalents.

---

## OWNERSHIP BOUNDARY RISK

| Area | Risk | Reason | Recommended Clarification |
|---|---|---|---|
| `assertActorOwnsVportActor` — two implementations | CRITICAL | Feature + engine both implement, may drift | Engine version should be the canonical one; feature version should be removed after migration complete |
| Availability rule production path | CRITICAL | Dashboard owns production write; no ownership gate in `manageVportAvailabilityRuleController` | Dashboard must own this explicitly AND add ownership assertion |
| Engine `listBookingHistory` — no ownership gate | CRITICAL | Engine exports a function that any caller can use without ownership context | Engine must be self-protecting; ownership gate required |
| Dead 12 DALs — unclear removal ownership | HIGH | No explicit owner assigned to remove them | Wolverine must own staged removal as a single ordered task |
| `getActorById.dal.js` duplicate | MEDIUM | Feature + engine implement same read identically | Remove feature copy; `assertActorOwnsVportActorController` should import from engine |

---

## DATA OWNERSHIP REGISTRY

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| `vport.bookings` | booking feature + engine | cancel/confirm, history, customer list, engine createBooking | feature (cancel/confirm status), engine (create), dashboard (insert walk-in) | DB/Carnage (unverified) | Carnage | Logan |
| `vport.resources` | engine | dashboard, engine | engine (insert), dashboard (vportResource.write.dal.js) | DB/Carnage (unverified) | Carnage | Logan |
| `vport.availability_rules` | engine + dashboard (CONFLICTED) | dashboard read DAL, engine DAL | dashboard (`upsertVportAvailabilityRuleDAL`) + engine | DB/Carnage (unverified — UPDATE safety gap) | Carnage | Logan |
| `vport.availability_exceptions` | engine | engine DAL | engine | DB/Carnage | Carnage | Logan |
| `vport.service_booking_profiles` | feature (via bookingServices controller) | feature DAL | engine (serviceProfile.write.dal.js) | DB/Carnage | Carnage | Logan |
| `vport.services` | vport/service feature | feature bookingServices.controller.js, engine | vport/service feature | DB/Carnage | Carnage | Logan |
| `vc.actors` | identity engine | feature getActorById.dal.js, engine actor.read.dal.js (DUPLICATE) | identity feature (create/update) | identity engine/DB | Carnage | Logan |
| `vc.actor_owners` | identity engine | feature readActorOwnerLink.dal.js, engine dalReadActorOwnerLink | identity feature | identity engine/DB | Carnage | Logan |

---

## RULE OWNERSHIP REGISTRY

| Rule | Owner | Enforcement Layer | Docs | Risk |
|---|---|---|---|---|
| Actor ownership (cancel/confirm) | `features/booking/controller/assertActorOwnsVportActor` | Controller (correct) | MISSING — no explicit rule doc | LOW — functioning but undocumented |
| Actor ownership (createOwnerBooking) | `features/booking/adapters/booking.adapter` → assertActorOwnsVportActorController | Controller via adapter (correct) | MISSING | LOW |
| Actor ownership (bookingHistory) | `dashboard/vport/controller/listVportBookingHistory` | Controller (correct — dashboard path) | WRONG status in vcsm.dal.booking.md | HIGH — doc says FIXED for all paths, only dashboard path fixed |
| Actor ownership (availability rules) | MISSING | UI-only string compare (VIOLATION) | MISSING | CRITICAL — no controller enforcement |
| Actor ownership (engine listBookingHistory) | MISSING | None (VIOLATION) | MISSING | CRITICAL |
| Service duration trusted from client | NOT VERIFIED | `createOwnerBookingController` accepts `durationMinutes` from client | MISSING | MEDIUM — client provides duration; no server-side minimum enforced |

---

## RUNTIME OWNERSHIP MAP

Based on Loki evidence:

| Runtime Flow | Entry Point | Owning Feature | Controllers | DALs | Hotspots |
|---|---|---|---|---|---|
| Customer books | `VportBookingView` | profiles/kinds/vport | engine createBooking | engine booking.write.dal.js | availability check (3+ reads) |
| Owner creates walk-in | `QuickBookingModal` | dashboard/vport | createOwnerBookingController | insertVportBooking.write.dal.js | profileId surface in service load |
| Cancel booking | `useBookingOps` | features/booking | cancelBookingController | getBookingById, getBookingResourceById, updateBookingStatus | 3 serial reads before write |
| Confirm booking | `useBookingOps` | features/booking | confirmBookingController | getBookingById, getBookingResourceById, updateBookingStatus | 3 serial reads before write |
| Owner views history | `useVportBookingHistory` | dashboard/vport | listVportBookingHistoryController | vportBookingHistory.read.dal.js | — |
| Customer appointments | `useMyAppointments` | notifications | listMyBookingsController | listBookingsByCustomerDAL | member_actor_id exposure |
| Availability rules | `WeeklyAvailabilityGrid` | dashboard/vport | manageVportAvailabilityRuleController | upsertVportAvailabilityRuleDAL | NO OWNERSHIP GATE — CRITICAL |

---

## CROSS-ROOT OWNERSHIP REVIEW

| Area | Claimed Owner | Actual Root | Boundary Status | Notes |
|---|---|---|---|---|
| `assertActorOwnsVportActor` | apps/VCSM (feature) + engines/booking | Both roots | CONFLICTED | Two implementations; engine version is canonical but feature version is the one used |
| Availability rule management | apps/VCSM (dashboard) + engines/booking | Both roots | CONFLICTED — same table, two write paths | Dashboard owns production; engine owns future/advanced path |
| `listBookingHistory` | engines/booking (public export) | engines | PARTIAL — engine exposes without ownership gate | Engine must self-protect |

---

## ENGINE OWNERSHIP REVIEW

| Engine | Owner | Consumers | Public Interfaces | Boundary Risk |
|---|---|---|---|---|
| `engines/booking` | Shared engine (no single app owner) | VCSM feature hooks (via @booking alias) | 45+ exported controllers and models | HIGH — `listBookingHistory` exported without ownership gate; `assertActorOwnsVportActor` duplicated in feature |

---

## OWNERSHIP BOUNDARY WARNINGS

**OWNERSHIP BOUNDARY WARNING — 1**  
**Location:** `engines/booking/src/controller/listBookingHistory.controller.js`  
**Current ambiguity:** Engine exports `listBookingHistory` publicly via adapter index. No caller ownership verification. Any consumer can call it with just `resourceId`.  
**Why it is risky:** CRITICAL security gap — engine function with no self-protection is exported as a public API and called by `useBookingHistory` (adapter export) which is also dead but still bundled.  
**Suggested ownership clarification:** Engine must own the fix. Add `callerActorId + ownerActorId` to signature and call `assertActorOwnsVportActor` before DAL access. Wolverine task with engine scope.

**OWNERSHIP BOUNDARY WARNING — 2**  
**Location:** `features/dashboard/vport/controller/manageVportAvailabilityRule.controller.js`  
**Current ambiguity:** Dashboard owns the production availability rule write path. No ownership assertion. UI-only gate in screen (`viewerActorId === actorId` string compare). Controller accepts `resourceId` with no caller verification.  
**Why it is risky:** CRITICAL — any authenticated actor with a known `resourceId` can modify availability rules for any VPORT.  
**Suggested ownership clarification:** Dashboard owns this controller and must fix it. Add `callerActorId` + `ownerActorId` parameters; call `assertActorOwnsVportActorController` (via booking adapter) before DAL write. Also: `upsertVportAvailabilityRuleDAL` UPDATE path must add `resource_id` filter.

**OWNERSHIP BOUNDARY WARNING — 3**  
**Location:** `features/booking/controller/assertActorOwnsVportActor.controller.js` + `engines/booking/src/controller/assertActorOwnsVportActor.controller.js`  
**Current ambiguity:** Two implementations of the same ownership assertion logic. Both are identical in behavior. Feature version is the one actually used by all app callers. Engine version is not imported from `engines/booking/index.js`... wait — checking the engine adapter again: line 29 shows `export { assertActorOwnsVportActor }` IS exported from the engine. But apps use the feature version.  
**Why it is risky:** Two implementations may drift. If engine version is updated, feature callers get stale logic.  
**Suggested ownership clarification:** Feature `assertActorOwnsVportActorController` should be removed; all callers should import `assertActorOwnsVportActor` from `@booking` (engine). The engine export already exists. This is a one-step migration.

---

## IRONMAN OWNERSHIP FINDING — SUMMARY

**Finding ID:** IRON-BOOK-01  
**Feature / Engine:** Booking — Three-tier system  
**Application Scope:** VCSM + ENGINE  
**Responsibility Type:** Feature ownership · Engine ownership · DAL ownership · Controller ownership · Security ownership  
**Ownership Clarity:** CONFLICTED  
**Boundary Risk:** CRITICAL  
**Severity:** CRITICAL  

**Primary code roots:**
- `apps/VCSM/src/features/booking/`
- `engines/booking/src/`
- `apps/VCSM/src/features/dashboard/vport/` (booking-relevant files)

**Core layers:** All three tiers have DAL + Model + Controller + Hook layers. No screens in feature layer.

**Engines used:** `engines/booking` (via `@booking` alias)

**Tables / Objects touched:** `vport.bookings`, `vport.resources`, `vport.availability_rules`, `vport.availability_exceptions`, `vport.service_booking_profiles`, `vport.services`, `vc.actors`, `vc.actor_owners`

**Rule ownership:**
- Ownership assertion: CONFLICTED (feature + engine duplicate)
- Availability write: MISSING in dashboard path (no controller gate)
- Booking history read: PARTIAL (dashboard protected; engine unprotected)

**Contracts touched:** Architecture Contract · Actor Ownership Contract · Booking Trust Contract · Boundary Isolation Contract

**Docs touched:** `vcsm.dal.booking.md` (stale) · `vcsm.booking.architecture.md` (updated this session)

**Current ambiguity:** Three tiers with no documented migration boundary. Two CRITICAL security gaps with no clear ownership assigned to fix them.

**Risk:** CRITICAL security gaps exist in live production paths. No single owner is accountable for the booking system as a whole.

**Recommended ownership clarification:**
1. **Engine owns:** `listBookingHistory` ownership gate fix, `assertActorOwnsVportActor` canonical implementation
2. **Dashboard owns:** `manageVportAvailabilityRuleController` ownership assertion fix, `upsertVportAvailabilityRuleDAL` UPDATE filter fix
3. **Feature owns:** adapter cleanup (remove `useBookingHistory`, remove dead controllers + DALs post-migration)
4. **Logan owns:** `vcsm.dal.booking.md` RISK-7 status correction

**Recommended handoff:** Wolverine (P0 fixes) · Logan (doc correction) · Carnage (RLS verification) · DB (schema verification)

---

## PERSISTENCE

**Ownership file proposed:** `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.booking.owner.md`  
**Status:** PENDING — Ironman recommends creating this file as a follow-up to document the final ownership settlement once P0 fixes are applied.  
**Current module architecture report:** `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/modules/vcsm.booking.architecture.md` (updated 2026-05-14) serves as interim ownership reference.

---

## ADDENDUM — ARCH-2 Dual Availability Write Paths: Canonical Ownership Declaration

**Date:** 2026-05-14 (post-RC-01 session)  
**Trigger:** User request: declare canonical ownership for dual `vport.availability_rules` write paths and add inline comments to both controller files.

---

### Status Update: OWNERSHIP BOUNDARY WARNING #2 — RESOLVED

The prior IRONMAN report flagged:
> "Dashboard owns production write; **no ownership assertion** in `manageVportAvailabilityRuleController`"

**RC-01 has been applied.** `manageVportAvailabilityRuleController` now calls `assertActorOwnsVportActorController` before every DAL write. The critical security gap is closed. Severity downgrades from **CRITICAL** to **LOW** (inline comment pending).

---

### ARCH-2 Canonical Path Declaration

Two paths write to `vport.availability_rules`. They are **complementary, not conflicting** — they serve structurally different use cases with different authorization scopes.

---

#### Path A — Dashboard-Local (CANONICAL for VPORT owner calendar self-management)

```
VportDashboardCalendarScreen
  → useVportManageAvailability
  → manageVportAvailabilityRuleController           ← apps/VCSM scope
      → assertActorOwnsVportActorController          ← actor_owners ownership check
      → upsertVportAvailabilityRuleDAL               ← apps/VCSM dashboard DAL
          → vport.availability_rules (write)
```

| Property | Value |
|---|---|
| Canonical owner | `apps/VCSM/src/features/dashboard/vport/` |
| Authorization model | `assertActorOwnsVportActorController` — VPORT actor owner only (via `vc.actor_owners`) |
| Use case | VPORT owner managing their own weekly working hours via the Calendar Settings screen |
| Scope | Single VPORT, direct ownership only |
| DAL | `dashboard/vport/dal/write/vportAvailabilityRules.write.dal.js` |
| Status | **ACTIVE — canonical path** |

---

#### Path B — Engine-Backed (CANONICAL for booking system resource management)

```
useVportBookingView (profiles/kinds/vport/screens/booking)
  → useManageAvailability (from @booking adapter)
  → engines/booking: setAvailabilityRule controller  ← ENGINE scope
      → assertActorCanManageResource                 ← multi-role ownership check
      → dalUpsertVportAvailabilityRule               ← engine DAL
          → vport.availability_rules (write)
```

| Property | Value |
|---|---|
| Canonical owner | `engines/booking/` |
| Authorization model | `assertActorCanManageResource` — direct owner, vport owner, org owner, org member, location member, staff |
| Use case | Booking system resource availability management for complex org/location/staff hierarchies |
| Scope | Multi-role: any authorized resource manager, not just the VPORT owner |
| DAL | `engines/booking/src/dal/vportAvailability.write.dal.js` |
| Status | **ACTIVE — canonical path for engine-managed resources** |

---

### Key Distinction

Path A uses `assertActorOwnsVportActorController` — VPORT actor owner check only.  
Path B uses `assertActorCanManageResource` — broader multi-role check covering org/location hierarchies.

These are NOT duplicate paths for the same scenario. They write to the same table because the table stores all availability rules regardless of resource management model. They are two legitimate ownership contexts serving two distinct user roles.

**Do not consolidate these paths.** Consolidation would require merging authorization models, which would either over-restrict Path B (org members can't edit) or under-restrict Path A (non-owners could edit VPORT calendar).

---

### Updated Data Ownership Registry Entry

| Object | Primary Owner | Write Owner | Authorization | Status |
|---|---|---|---|---|
| `vport.availability_rules` | **engine (canonical table owner)** | Path A: `dashboard/vport` (owner calendar) · Path B: `engines/booking` (resource management) | Path A: `actor_owners` check · Path B: multi-role `assertActorCanManageResource` | RESOLVED — dual write is intentional and scoped |

---

### Inline Comment Recommendations

**Path A controller** (`apps/VCSM/src/features/dashboard/vport/controller/manageVportAvailabilityRule.controller.js`):
- Applied in same session — see implementation below.
- Scope: `apps/VCSM` (no boundary approval needed).

**Path B engine controller** (`engines/booking/src/controller/setAvailabilityRule.controller.js`):
- **ENGINE SCOPE** — requires explicit approval before modification.
- Recommended comment to add once approved:
  ```
  // Path B: Engine availability write — canonical for org/location/staff resource management.
  // Uses assertActorCanManageResource (multi-role: direct owner, vport owner, org/location member, staff).
  // For simple VPORT owner calendar settings, use manageVportAvailabilityRuleController (dashboard-local).
  ```

---

### Updated Rule Ownership Registry Entry

| Rule | Owner | Enforcement Layer | Status |
|---|---|---|---|
| Actor ownership (availability rules — owner calendar) | `dashboard/vport/controller/manageVportAvailabilityRuleController` | Controller — `assertActorOwnsVportActorController` | **RESOLVED** — RC-01 applied |
| Actor ownership (availability rules — booking engine) | `engines/booking/setAvailabilityRule` | Controller — `assertActorCanManageResource` | ACTIVE — multi-role, correct |

---

### Open Items After ARCH-2 Resolution

| Item | Priority | Owner | Notes |
|---|---|---|---|
| Feature `setAvailabilityRule.controller.js` | HIGH | Wolverine | DELETE CANDIDATE — superseded by engine; should be removed in dead-DAL cleanup batch |
| Engine controller inline comment | MEDIUM | ENGINE scope approval required | Add Path B ownership comment to `engines/booking/src/controller/setAvailabilityRule.controller.js` |
| `vport.availability_rules` RLS (DB-BOOK-02) | HIGH | Carnage (plan written) / DB (apply) | UPDATE + INSERT policies planned; apply after app-layer fixes confirmed in staging |
