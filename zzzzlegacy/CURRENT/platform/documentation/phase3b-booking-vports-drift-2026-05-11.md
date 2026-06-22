# Logan Phase 3b — Booking + Vports Drift Report

**Date:** 2026-05-11
**Scope:**
- `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/booking/` — 1 doc
- `zNOTFORPRODUCTION/_CANONICAL/logan/vports/` — 18 docs (scan only — full code audit deferred)
- `apps/VCSM/src/features/dashboard/vport/` — new + modified files on `vport-booking-feed-security-updates` branch

**Code Files Inspected:**
- `apps/VCSM/src/features/dashboard/vport/controller/checkVportOwnership.controller.js` (NEW)
- `apps/VCSM/src/features/dashboard/vport/controller/createOwnerBooking.controller.js` (modified)
- `apps/VCSM/src/features/dashboard/vport/controller/updateVportBooking.controller.js` (modified)
- `apps/VCSM/src/features/dashboard/vport/controller/vportPublicBooking.controller.js` (modified)
- `apps/VCSM/src/features/dashboard/vport/dal/read/vportBookingById.read.dal.js` (NEW)
- `apps/VCSM/src/features/dashboard/vport/dal/read/vportBookingsInRange.read.dal.js`
- `apps/VCSM/src/features/dashboard/vport/dal/read/vportServices.read.dal.js` (modified)
- `apps/VCSM/src/features/dashboard/vport/hooks/useVportBookingActions.js` (modified)
- `apps/VCSM/src/features/dashboard/vport/hooks/useVportOwnership.js` (NEW)
- `apps/VCSM/src/services/supabase/vportClient.js`
- `apps/VCSM/src/services/supabase/vcClient.js`

---

## Booking Doc Status

| Doc | Last Updated | Status | Drift Severity |
|-----|-------------|--------|----------------|
| vcsm.booking.pipeline.md | May 10, 2026 | MINOR DRIFT | MEDIUM |

---

## Drift Findings — Booking

---

### F-3b-01 — Schema status contradicts code: `vport` schema usage not resolved

**Finding ID:** F-3b-01
**Doc:** `vcsm/booking/vcsm.booking.pipeline.md` — Section 1, Section 10, April 29 change log
**Code:** `apps/VCSM/src/services/supabase/vportClient.js`, all dashboard-local DAL files
**Drift Status:** CONTRADICTORY
**Drift Severity:** HIGH

**What the doc says:**
> "The `vport` schema does NOT exist in the database — confirmed against `full_schema.sql`." (Section 1, April 29)
> "Fixed all 5 dashboard-local DALs to use `vc` schema with correct table names." (April 29 change log)

**What the code shows:**

`vportClient.js` (as of this audit):
```js
export const vport = supabase.schema('vport')
export default vport
```

`vportBookingsInRange.read.dal.js` (as of this audit):
```js
import vportSchema from "@/services/supabase/vportClient";
// → still queries supabase.schema('vport').from('bookings')
```

All other dashboard-local DALs also import from `vportClient` — the same pattern.

**What this means:** Either:
- A) The April 29 fix was applied and then reverted (possibly by a later branch or merge)
- B) The `vport` schema actually exists in the live database (the April 29 doc was based on a stale `full_schema.sql` snapshot)
- C) The April 29 change log described the fix incorrectly — the actual fix was column names, not schema names

Option B is supported by the fact that booking features appear to work (May 10 change log describes working booking UX fixes). If `vport.bookings` didn't exist, the entire owner schedule and public booking flows would fail.

**Why this matters for the new `vportBookingById.read.dal.js`:**
This new file also uses `vportSchema`. If option A or C is true (vport schema = non-existent), this DAL is broken. If option B is true (vport schema = exists), the DAL is correct but the docs need updating.

**Required action: `/DB` verification** — the actual Supabase schema list must be queried live to establish whether `vport` schema exists. Until this is resolved, the booking pipeline doc's schema section is UNVERIFIED.

**Immediate doc fix:** Update Section 1 to acknowledge the unresolved contradiction:
> "Whether the `vport` schema exists in the live database requires verification against the live Supabase instance. The local `full_schema.sql` snapshot may be stale."

---

### F-3b-02 — New files missing from booking pipeline doc files map

**Finding ID:** F-3b-02
**Doc:** `vcsm/booking/vcsm.booking.pipeline.md` — Section 12 Files Map
**Code:** Branch `vport-booking-feed-security-updates` — 4 new files
**Drift Status:** DOC MISSING
**Drift Severity:** MEDIUM

**Files present in code but NOT in the doc:**

| File | Type | Imported By |
|---|---|---|
| `dal/read/vportBookingById.read.dal.js` | DAL (new) | `updateVportBooking.controller.js` (for both `updateBookingStatusController` and `rescheduleBookingController`) |
| `controller/createOwnerBooking.controller.js` | Controller (new) | `useVportOwnerSchedule.js` (likely) |
| `controller/checkVportOwnership.controller.js` | Controller (new) | `useVportOwnership.js` |
| `hooks/useVportOwnership.js` | Hook (new) | `VportDashboardScreen.jsx` (likely) |

**Doc impact:**
- Dashboard-Local DAL table (line 293) is missing `vportBookingById.read.dal.js`
- Dashboard-local controllers table (line 352) lists only 3 controllers; missing `createOwnerBooking.controller.js` and `checkVportOwnership.controller.js`
- App Hook Layer table has no entry for `useVportOwnership.js`

**Also:** `updateVportBooking.controller.js` now exports two controllers (`updateBookingStatusController` AND `rescheduleBookingController`), but the doc only describes it as "Status transitions (confirm/cancel/complete/no_show) + bidirectional notifications" without naming `rescheduleBookingController`.

---

### F-3b-03 — `createOwnerBooking.controller.js` ownership check undocumented

**Finding ID:** F-3b-03
**Doc:** `vcsm/booking/vcsm.booking.pipeline.md` — Section 5 (Write Flow owner create)
**Code:** `apps/VCSM/src/features/dashboard/vport/controller/createOwnerBooking.controller.js`
**Drift Status:** DOC MISSING
**Drift Severity:** MEDIUM

**Current doc (Write Flow owner create):**
```
VportDashboardScheduleScreen (create modal submit)
  → useVportOwnerSchedule.submitCreateBooking(form)
    → createOwnerBookingController({ actorId, resourceId, startsAt, endsAt, ... })
        → insertVportBookingDAL({ row: { source: 'owner', status: 'confirmed', ... } })  [vport.bookings]
```

**Actual code behavior:**
```js
// createOwnerBooking.controller.js
const resource = await getVportResourceByIdDAL({ resourceId })
const vportActorId = resource.owner_actor_id
    ?? await getVportActorIdByProfileIdDAL({ profileId: resource.profile_id })
await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: vportActorId })
// THEN insert
```

**Gap:** The doc shows a direct DAL insert. The actual controller:
1. Reads the resource to get `profile_id`
2. Resolves `vportActorId` from `owner_actor_id` or falls back to `getVportActorIdByProfileIdDAL`
3. **Calls `assertActorOwnsVportActorController` to verify ownership before inserting** — this is the security gate
4. Then inserts with `source: 'owner', status: 'confirmed'`

The ownership assertion is a security-critical step that is completely absent from the documented flow. The doc shows no validation between "receive request" and "insert row."

**Risk:** Anyone reading the doc to audit the booking write path would miss the ownership enforcement. This is also a `/Venom` review candidate — see Pending Reviews section.

---

### F-3b-04 — `updateVportBooking.controller.js` ownership check gap in doc

**Finding ID:** F-3b-04
**Doc:** `vcsm/booking/vcsm.booking.pipeline.md` — Section 5 (Status Transition Flows)
**Code:** `apps/VCSM/src/features/dashboard/vport/controller/updateVportBooking.controller.js`
**Drift Status:** MINOR DRIFT
**Drift Severity:** LOW

**Current doc (Status Transition Flows):**
```
confirm / cancel / complete / no_show:
  → useVportBookingActions.confirm|cancel|complete|noShow(bookingId)  [passes actorId = targetActorId]
    → updateBookingStatusController({ bookingId, status, actorId })
      → updateVportBookingDAL({ bookingId, updates: { status } })    [vport.bookings UPDATE]
      → [if confirmed or cancelled] notification routing
```

**Actual code behavior:**
The controller now:
1. Calls `getVportBookingByIdDAL` to fetch the full booking
2. Resolves `vportActorId` from `booking.profile_id`
3. Checks if caller is customer (`String(callerActorId) === String(customerActorId)`)
4. For owner actions: calls `assertActorOwnsVportActorController` to verify ownership
5. For customer cancel: skips ownership check (customer can cancel their own booking)
6. THEN updates status
7. THEN sends bidirectional notification

**Gap:** The doc omits steps 1-4 (booking fetch + ownership assertion). The key invariant — that owner status changes require `assertActorOwnsVportActorController` — is undocumented.

---

## Vports Doc Scan (18 docs — code audit deferred)

The `vports/` folder has 18 Logan docs. A full code-vs-doc audit requires reading the vport profile, menu, service catalog, review, delete lifecycle, and kinds architecture code. This is deferred to Phase 3c.

**Quick scan findings (doc read only, code NOT inspected):**

| Doc | Last Updated | Quick Assessment |
|---|---|---|
| vcsm.vport.kinds-architecture-map.md | May 10, 2026 | Very recent — likely current |
| vcsm.vport.tab-classification.md | May 10, 2026 | Very recent — likely current |
| vcsm.vport.business-pipeline.md | April 2026 | Has v2 — may be superseded |
| vcsm.vport.business-pipeline.v2.md | April 2026 | The v2 — likely more current |
| vcsm.vport.delete-lifecycle.md | April 20, 2026 | Referenced by citizen-soft-delete — likely current |
| vcsm.vport.service-catalog.md | April 2026 | Moved from profiles/ this session — contents not read |
| vcsm.vport.review-implementation-plan.md | April 2026 | Plan doc — may be stale if reviews shipped |
| vcsm.vport.review-pipeline-audit.md | April 2026 | Audit doc — needs code comparison |
| Others (9 profile specs) | April 2026 | Spec docs — relatively stable |

**Recommended Phase 3c scope:** `vcsm.vport.delete-lifecycle.md` (verify code matches doc), `vcsm.vport.business-pipeline.v2.md` (verify as canonical), `vcsm.vport.review-pipeline-audit.md` (verify review system state), `vcsm.vport.service-catalog.md` (read contents post-move).

---

## Pending Review by Other Commands

These findings require specialized command review before they can be closed. Each finding is flagged for the appropriate command.

| Finding | Required Command | Reason | Priority |
|---|---|---|---|
| F-3b-01: Schema status (`vport` vs `vc`) | `/DB` | Live schema verification — does `vport` schema exist? What tables does it contain? Is `vport.bookings` = `vc.bookings` aliased, or two separate tables? | HIGH |
| F-3b-03: `createOwnerBooking.controller.js` ownership gate | `/Venom` | Security-critical path: owner booking creation. Does `assertActorOwnsVportActorController` enforce correctly via `vc.actor_owners`? No CSRF or RLS bypass possible? | MEDIUM |
| F-3b-04: `updateBookingStatusController` ownership gate | `/Venom` | Customer-vs-owner status transition logic. Is `isCustomer` check bypassable (e.g., with a null `customer_actor_id`)? | MEDIUM |
| `useVportOwnership.js` security model | `/Venom` | Hook comment says "isOwner is UI convenience only — not the security boundary." This is correct design, but Venom should verify all call sites use controller-level checks and never gate mutations on the hook result alone. | MEDIUM |
| `rescheduleBookingController` overlap check | `/Venom` | Uses `listVportBookingsInRangeDAL` for conflict detection. Verify this check is not bypassable (e.g., race condition between check and insert). | LOW |
| Engine booking DAL vportClient usage | `/DB` + `/Sentry` | 14 engine DAL files reference non-existent `vportClient`. Sentry should flag these as engine boundary violations if `vport` schema is actually a different database object from `vc`. | HIGH |
| `vportTeam.controller.js` / team DALs (modified on branch) | `/Venom` | Team access/invite controllers modified — authorization model for team management not documented. | LOW |

---

## Immediate Documentation Updates (applies now)

### 1. Add `vportBookingById.read.dal.js` to files map

Add to the Dashboard-Local DAL Layer table in `vcsm.booking.pipeline.md`:

```
| `read/vportBookingById.read.dal.js` | vport (`bookings`, by `id`) | Used by updateVportBooking.controller.js |
```

### 2. Add `createOwnerBooking.controller.js` to controller table

Add to Dashboard-local controllers table:
```
| `apps/.../controller/createOwnerBooking.controller.js` | Owner booking create: resource lookup → vportActorId resolve → assertActorOwnsVportActor → insert confirmed booking |
```

### 3. Add `checkVportOwnership.controller.js` to controller table

```
| `apps/.../controller/checkVportOwnership.controller.js` | Boolean ownership check (try/catch wrapper over assertActorOwnsVportActor) — UI use only |
```

### 4. Add ownership assertion steps to Write Flow (owner create) in Section 5

Before the `insertVportBookingDAL` step, add:
```
→ getVportResourceByIdDAL({ resourceId })                            [vport.resources]
→ vportActorId = resource.owner_actor_id ?? getVportActorIdByProfileIdDAL(profile_id)
→ assertActorOwnsVportActorController({ callerActorId, vportActorId })  ← OWNERSHIP GATE
```

### 5. Add ownership assertion steps to Status Transition Flows in Section 5

Before `updateVportBookingDAL`, add:
```
→ getVportBookingByIdDAL({ bookingId })                              [vport.bookings]
→ vportActorId = resolveVportActorFromProfileId(booking.profile_id)
→ if isCustomer: only cancel allowed
→ if isOwner: assertActorOwnsVportActorController({ callerActorId, vportActorId })
```

### 6. Add schema contradiction note to Section 1

Replace the definitive "vport schema does NOT exist" statement with:
> "NOTE: The `vport` schema status is unresolved. The `full_schema.sql` snapshot from April 29 did not include a `vport` schema, but the live database state has not been re-verified. All dashboard-local DALs continue to use `vportClient` (`supabase.schema('vport')`). Run `/DB` to verify current live schema state."

---

## Action Items

| Priority | Action | Assignee |
|---|---|---|
| HIGH | Run `/DB` to verify live `vport` schema existence and table list | DB |
| HIGH | Update `vcsm.booking.pipeline.md` files map with 4 new files | Logan (now) |
| MEDIUM | Run `/Venom` on createOwnerBooking + updateBookingStatusController | Venom |
| MEDIUM | Update Section 5 write flows to document ownership assertion steps | Logan |
| MEDIUM | Update Section 1 schema note to reflect uncertainty | Logan |
| LOW | Phase 3c: audit `vports/` docs vs code (18 docs) | Logan next |
