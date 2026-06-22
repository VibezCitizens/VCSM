# SENTRY Compliance Report — Booking DAL System

**Date:** 2026-05-14  
**Reviewer:** SENTRY  
**Trigger:** Cerebro-routed audit of `vcsm.dal.booking.md` — RISK-1 (boundary fix verification), RISK-6 (mixed migration state), RISK-8 (layer violations), RISK-7 (documentation accuracy)  
**Application Scope:** VCSM + ENGINE  
**Status:** COMPLETE  
**Final Status:** CONTRACT VIOLATION

---

## BOUNDARY COMPLIANCE STATUS

| Protected Root | In Scope | Modified | Violation | Notes |
|---|:---:|:---:|:---:|---|
| apps/VCSM | YES | NO | NO | Read-only inspection |
| apps/wentrex | NO | NO | NO | Out of scope |
| apps/Traffic | NO | NO | NO | Out of scope |
| engines | YES | NO | NO | Read-only inspection — engine booking controller reviewed |

---

## ARCHITECTURE ALIGNMENT STATUS

| Area | Status | Drift Level | Notes |
|---|---|---|---|
| DAL layer discipline | PARTIAL | MODERATE DRIFT | updateBookingStatusDAL returns PII beyond operational need; all DALs use explicit selects |
| Controller layer | PARTIAL | MAJOR DRIFT | listVportServicesForProfileController is a no-op passthrough; listBookingHistory (engine) has no ownership gate |
| Hook layer | PARTIAL | MODERATE DRIFT | useBookingHistory exports dead adapter path; useQuickBookingModal uses profileId surface |
| Adapter boundary | ALIGNED | NONE | RISK-1 fix confirmed: all 7 dashboard controllers now go through booking.adapter.js |
| Engine isolation | VIOLATION | CONTRACT VIOLATION | Engine listBookingHistory has no caller verification — app hook calls it without ownership context |
| Feature/engine two-tier | WATCH | MINOR DRIFT | Mixed migration state documented; no single consistent boundary |

---

## ACTOR OWNERSHIP STATUS

| Flow | Status | Risk | Notes |
|---|---|---|---|
| cancelBookingController | ALIGNED | LOW | Calls assertActorOwnsVportActorController via internal import; customer self-cancel path correctly exempted |
| confirmBookingController | ALIGNED | LOW | Calls assertActorOwnsVportActorController; owner-only path |
| createOwnerBookingController | ALIGNED | LOW | Calls assertActorOwnsVportActorController through booking.adapter.js |
| listVportBookingHistoryController (dashboard) | ALIGNED | LOW | Requires actorId + callerActorId; ownership asserted before DAL call |
| listBookingHistory (engine) | VIOLATION | CRITICAL | No ownership assertion — accepts only resourceId; used by useBookingHistory hook |
| listBookingHistoryController (feature) | DEAD | LOW | No callers in production; feature controller exists but useBookingHistory.js imports from engine not this file |
| listVportServicesForProfileController | VIOLATION | MEDIUM | No ownership or caller check; passes profileId directly to DAL |

---

## IDENTITY SURFACE STATUS

| Surface | Status | Risk | Notes |
|---|---|---|---|
| actorId in ownership assertion | ALIGNED | LOW | assertActorOwnsVportActorController uses actorId correctly |
| profileId in useQuickBookingModal | VIOLATION | MEDIUM | profileId is a forbidden surface — passed as prop and forwarded to controller |
| profileId in listVportServicesForProfileController | VIOLATION | MEDIUM | profileId used as DAL lookup key — must be replaced with actorId-based lookup |
| owner_actor_id in notification linkPath | VIOLATION | HIGH | Raw UUID embedded in /actor/{uuid}/dashboard/booking-history notification link |
| actorId in cancelBooking/confirmBooking notifications | ALIGNED | LOW | Notification recipient uses actorId; link uses profile route |

---

## ENGINE ISOLATION STATUS

| Engine Area | Status | Drift | Notes |
|---|---|---|---|
| engines/booking — public API boundary | PARTIAL | MODERATE DRIFT | listBookingHistory exported without caller verification; app calls it without ownership context |
| engines/booking — no app imports | ALIGNED | NONE | Engine does not import app-specific feature logic |
| app → engine dependency direction | ALIGNED | NONE | VCSM imports from @booking only; no reverse dependency |
| Duplicate assertActorOwnsVportActor | WATCH | MINOR DRIFT | RISK-2 from doc: feature version is the one actually used; engine version not exported from index.js |

---

## NATIVE PARITY STATUS

| Native Area | Status | Drift | Notes |
|---|---|---|---|
| Not in scope | N/A | N/A | No native/Falcon scope for this review |

---

## SENTRY FINDINGS

---

### SENTRY FINDING — S-BOOK-01

**Finding ID:** S-BOOK-01  
**Location:** `engines/booking/src/controller/listBookingHistory.controller.js`  
**Drift Level:** CONTRACT VIOLATION  
**Severity:** CRITICAL  
**Contract Violated:** Actor Ownership Contract · Booking Architecture Contract  

**Current behavior:**  
Engine `listBookingHistory` accepts only `{ resourceId, statuses, limit, offset }`. No `callerActorId`, no `ownerActorId`, no ownership assertion. `useBookingHistory.js` calls this engine function with only `resourceId`.

**Expected behavior:**  
Engine controllers that return potentially-sensitive data (booking records tied to customer identity) must verify that the caller has ownership authority over the queried resource before returning data.

**Risk:**  
Any authenticated actor with a `resourceId` can read all bookings for that resource through the adapter export. The adapter export `useBookingHistory` is live even though no current external consumer is confirmed. Dead exports become live without architecture gates.

**Recommended correction:**  
1. Update engine `listBookingHistory` signature to `{ callerActorId, ownerActorId, resourceId, statuses, limit, offset }`.  
2. Add `assertActorOwnsVportActorController` (or equivalent engine-internal ownership check) before the DAL call.  
3. Update `useBookingHistory.js` to pass `callerActorId` and `ownerActorId` from session identity.  
4. Update `booking.adapter.js` to document that `useBookingHistory` requires ownership context.

**Architectural rationale:**  
Engine controllers are app-agnostic but not authorization-agnostic. A controller that returns actor-scoped data must enforce its own ownership boundary. The app layer cannot be trusted to always call the engine with correct context — the engine must self-protect.

---

### SENTRY FINDING — S-BOOK-02

**Finding ID:** S-BOOK-02  
**Location:** `features/dashboard/vport/hooks/useQuickBookingModal.js:6` · `features/dashboard/vport/controller/listVportServicesForProfile.controller.js`  
**Drift Level:** MAJOR DRIFT  
**Severity:** HIGH  
**Contract Violated:** Public Identity Surface Contract · Architecture Contract (controller layer responsibility)  

**Current behavior:**  
`QuickBookingModal.jsx` passes `profileId` to `useQuickBookingModal`. The hook forwards `profileId` to `listVportServicesForProfileController`, which passes it directly to `listVportServicesByProfileIdDAL`. `profileId` is a forbidden identity surface. The controller has no ownership check, no caller validation — it is a pure passthrough.

**Expected behavior:**  
Service lookup must be scoped by `actorId`, not `profileId`. The resource's `owner_actor_id` is already resolved inside `createOwnerBookingController` — the same resolution should be used for service loading. The controller must add at minimum an actor-scope gate.

**Risk:**  
Identity surface violation enables service enumeration across any VPORT by anyone with quick-booking-modal access. Controller provides zero enforcement, making the layer purely cosmetic.

**Recommended correction:**  
1. Remove `profileId` from `QuickBookingModal` props.  
2. Derive VPORT actor from `resourceId` in the hook (call a `getResourceOwnerActorId` helper or accept `ownerActorId` from the parent that has already resolved it).  
3. Replace `listVportServicesForProfileController({ profileId })` with an actor-scoped service controller that accepts `ownerActorId`.  
4. The controller must verify that `callerActorId` has a relationship to `ownerActorId` before returning services.

**Architectural rationale:**  
`profileId` is banned from public-facing hook and controller surfaces. Controllers must add value (ownership gate, data transformation, or scope enforcement) — they must not be passthrough relays.

---

### SENTRY FINDING — S-BOOK-03

**Finding ID:** S-BOOK-03  
**Location:** `vcsm.dal.booking.md` — RISK-7 status field  
**Drift Level:** MODERATE DRIFT  
**Severity:** HIGH  
**Contract Violated:** Documentation Accuracy Contract  

**Current behavior:**  
`vcsm.dal.booking.md` marks RISK-7 as **FIXED** with the note: "The controller now requires actorId and callerActorId, calls assertActorOwnsVportActorController through the booking adapter, and only then calls the dashboard DAL."

The code evidence shows:
- `listVportBookingHistoryController` (dashboard, `features/dashboard/vport/controller/`) → ✅ FIXED — has `actorId`, `callerActorId`, calls `assertActorOwnsVportActorController`
- `listBookingHistoryController` (feature-level, `features/booking/controller/`) → ❌ NOT FIXED — only accepts `resourceId`, no ownership check
- Engine `listBookingHistory` → ❌ NOT FIXED — no ownership check; used by the live `useBookingHistory` hook

The doc's FIXED status describes only the dashboard controller fix but incorrectly implies the entire booking history read path is secured.

**Expected behavior:**  
RISK-7 should reflect:
- PARTIAL FIX — dashboard path secured
- OPEN (elevated) — engine path and feature-level controller remain unprotected

**Risk:**  
Documentation inaccuracy causes future implementers to assume the risk is fully resolved. Cerebro's analysis and any future audits will inherit the false-positive status.

**Recommended correction:**  
Update `vcsm.dal.booking.md` RISK-7 status to `PARTIAL FIX` with explicit notation of what is fixed (dashboard path) and what remains open (engine path, feature controller).

**Architectural rationale:**  
Governance documentation must reflect ground truth. A "FIXED" status that doesn't match code is worse than an "OPEN" status — it creates false confidence.

---

### SENTRY FINDING — S-BOOK-04

**Finding ID:** S-BOOK-04  
**Location:** `features/booking/adapters/booking.adapter.js:7` (`export { default as useBookingHistory }`)  
**Drift Level:** MINOR DRIFT  
**Severity:** MEDIUM  
**Contract Violated:** Adapter Correctness Contract  

**Current behavior:**  
`useBookingHistory` is exported via `booking.adapter.js`. The hook calls an engine function that has no ownership gate. There are no confirmed external consumers, but the export creates a live surface any future caller can import and use without ownership context.

**Expected behavior:**  
Adapter exports must represent safe, production-ready surfaces. An export backed by an ownership-unprotected engine call must not be part of the public adapter API until the engine is fixed.

**Recommended correction:**  
Remove `useBookingHistory` from the adapter export until S-BOOK-01 is resolved and the engine function has an ownership gate. Document it as internal-only in the interim.

**Architectural rationale:**  
Adapters define the trust boundary of a feature. Exporting an unsafe surface through the adapter degrades the boundary for all callers.

---

### SENTRY FINDING — S-BOOK-05

**Finding ID:** S-BOOK-05  
**Location:** `features/booking/controller/listBookingHistory.controller.js` (feature-level)  
**Drift Level:** MINOR DRIFT  
**Severity:** LOW  
**Contract Violated:** Architecture Contract (dead code clarity)  

**Current behavior:**  
`listBookingHistory.controller.js` exists in the feature layer with no ownership check and no confirmed callers. `useBookingHistory.js` imports from `@booking` (engine), not this feature controller. This controller is confirmed dead.

**Expected behavior:**  
Dead controllers should be removed or clearly marked as superseded. A dead controller that lacks ownership checks creates confusion about whether it is "the safe one" or "the legacy one."

**Recommended correction:**  
Delete `features/booking/controller/listBookingHistory.controller.js`. Add a note to `vcsm.dal.booking.md` that this file was removed and the engine path is canonical.

**Architectural rationale:**  
Dead code that shadows a live path is a maintenance liability and a source of architectural confusion. Remove it to prevent accidental resurrection.

---

### SENTRY FINDING — S-BOOK-06

**Finding ID:** S-BOOK-06  
**Location:** `features/booking/dal/listBookingsByCustomer.dal.js:23` (join clause `resources!resource_id(owner_actor_id,member_actor_id,name)`)  
**Drift Level:** MODERATE DRIFT  
**Severity:** MEDIUM  
**Contract Violated:** Asset Security · Architecture Contract (DAL returns minimum required data)  

**Current behavior:**  
Customer-facing booking list DAL returns `member_actor_id` — a staff/team member internal actor ID. This field is not needed for customer-facing UI and violates data minimization.

**Expected behavior:**  
`member_actor_id` should be excluded from the customer read path. If the owner dashboard needs member data, it should be fetched through a separate owner-scoped DAL.

**Recommended correction:**  
Remove `member_actor_id` from the join clause in `BOOKING_SELECT` within `listBookingsByCustomerDAL`.

**Architectural rationale:**  
DALs must return only what their consumer requires. Cross-consumer DALs that return a superset of fields create unnecessary identity exposure.

---

## FINAL SENTRY STATUS: CONTRACT VIOLATION

**Reason:** Engine `listBookingHistory` controller has no ownership assertion (S-BOOK-01 — CRITICAL). `profileId` used as identity surface in controller and hook (S-BOOK-02 — HIGH). Documentation marks a partially-fixed risk as fully FIXED (S-BOOK-03 — HIGH).

---

## FOLLOW-UP REQUIRED: REQUIRED BEFORE RELEASE

| Finding | Action Required | Blocking Release? |
|---|---|---|
| S-BOOK-01 | Engine listBookingHistory must get ownership gate | YES |
| S-BOOK-02 | profileId surface must be replaced with actorId-based lookup | YES |
| S-BOOK-03 | Logan must update vcsm.dal.booking.md RISK-7 status | YES |
| S-BOOK-04 | Remove useBookingHistory from adapter until S-BOOK-01 fixed | YES |
| S-BOOK-05 | Delete dead feature listBookingHistory.controller.js | NO — housekeeping |
| S-BOOK-06 | Remove member_actor_id from listBookingsByCustomer join | NO — data minimization |

---

## RISK-1 FIX VERIFICATION (Doc Status: FIXED)

**Verification status: CONFIRMED ✅**  
All 7 dashboard controllers (`updateVportBooking`, `vportTeam`, `checkVportOwnership`, `vportTeamAccess`, `saveVportPublicDetailsByActorId`, `vportTeamInvite`, `createOwnerBooking`) now import `assertActorOwnsVportActorController` via `@/features/booking/adapters/booking.adapter`. Direct cross-feature imports are resolved.

## RISK-8 FIX VERIFICATION (Doc Status: OPEN)

**Verification status: PARTIALLY RESOLVED — doc is outdated**  
`QuickBookingModal.jsx` no longer directly imports DALs or controllers. The component-layer violation described in the doc (JSX calling DAL/controller directly) has been corrected. The modal now delegates entirely to `useQuickBookingModal` hook. However, the `profileId` identity surface violation described in S-BOOK-02 remains open through the hook. The doc's OPEN status is correct but the violation description should be updated to reflect the current state.
