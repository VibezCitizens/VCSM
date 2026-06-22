# CARNAGE Migration Readiness Update — Booking RLS

**Date:** 2026-05-18  
**Reviewer:** CARNAGE  
**Trigger:** AvengersAssemble 2026-05-18 confirmed Phase 2 app-layer prerequisites resolved on branch `vport-booking-feed-security-updates`  
**Predecessor:** `2026-05-14_carnage_booking-rls-policies.md` (design report — migration SQL defined there)  
**Application Scope:** VCSM  
**Mode:** GOVERNANCE UPDATE — phase status re-classification only; no new SQL added

---

## PURPOSE

The 2026-05-14 CARNAGE report designed two RLS migrations for `vport.bookings` and `vport.availability_rules` but blocked their execution on Phase 2 app-layer prerequisites:

| Prerequisite | 2026-05-14 Status | 2026-05-18 Status |
|---|---|---|
| RC-01 — `manageVportAvailabilityRuleController` ownership assertion missing | BLOCKING | **RESOLVED — controller deleted; responsibility migrated to engine** |
| RC-03 — `engines/booking listBookingHistory` no ownership gate | BLOCKING | **RESOLVED — `assertActorOwnsVportActor` gate confirmed in engine controller** |
| V-AVAIL-04 — error handling swallows 42501 silently | OPEN (MEDIUM) | **RESOLVED — controller deleted; no longer a live path** |

All three Phase 2 blockers are cleared. The CARNAGE migration sequence can now advance to Phase 3 and beyond.

---

## PHASE STATUS UPDATE

| Phase | Description | Previous Status | Current Status | Notes |
|---|---|---|---|---|
| Phase 0 — Verify | Run pre-migration DB verification queries | PENDING | PENDING | Must run before Phase 1 |
| Phase 1 — Indexes | CREATE CONCURRENTLY on join columns | PENDING | PENDING | Depends on Phase 0 results |
| Phase 2 — App-layer fixes | RC-01 controller fix + V-AVAIL-04 error handling | BLOCKED | **RESOLVED** | Branch work confirmed by AvengersAssemble 2026-05-18 |
| Phase 3 — availability_rules policies | Apply UPDATE + INSERT RLS policies | BLOCKED (pending Phase 2) | **UNBLOCKED** | Apply after Phase 0+1 verification |
| Phase 4 — bookings policy (staging) | Apply SELECT RLS policy on `vport.bookings` in staging | BLOCKED (pending RC-03) | **UNBLOCKED** | Apply after Phase 3 verified in staging |
| Phase 5 — bookings policy (production) | Apply SELECT RLS policy in production | BLOCKED | **UNBLOCKED** | Only after Phase 4 staging verification passes |

---

## RC-01 RESOLUTION DETAILS

**Controller deleted:** `apps/VCSM/src/features/dashboard/vport/controller/manageVportAvailabilityRule.controller.js`

The controller that owned the availability rule write path (with missing ownership assertion) has been deleted. The write path for availability rules is now exclusively managed through `engines/booking` via the `useManageAvailability` hook → `setAvailabilityRule` engine controller. The engine enforces ownership internally.

**Impact on Phase 3 migration:**
- The `upsertVportAvailabilityRuleDAL` (app-feature DAL) is no longer called by any live controller
- The only active write path for `vport.availability_rules` is through the engine
- The RLS UPDATE policy (`availability_rules_update_owner_only`) will protect the table at the DB layer as defense-in-depth against any future DAL misuse
- V-AVAIL-04 (error handling concern) is moot — the swallowing catch block was in the deleted controller

---

## RC-03 RESOLUTION DETAILS

**Engine controller secured:** `engines/booking/src/controller/listBookingHistory.controller.js`

Confirmed code as of 2026-05-18 branch:

```js
export async function listBookingHistory({ callerActorId, ownerActorId, resourceId, statuses = null, limit = 50, offset = 0 } = {}) {
  if (!callerActorId) throw new Error('[BookingEngine] callerActorId is required')
  if (!ownerActorId)  throw new Error('[BookingEngine] ownerActorId is required')
  if (!resourceId)    throw new Error('[BookingEngine] resourceId is required')
  await assertActorOwnsVportActor({ requestActorId: callerActorId, targetActorId: ownerActorId })
  // ... DB call
}
```

**Impact on Phase 4/5 migration:**
- The critical compatibility risk flagged in 2026-05-14 CARNAGE report ("`dalListBookingsByResource` called without ownership context → silent 0 rows after policy applies") is now resolved
- The engine controller rejects unauthorized callers at the app layer before reaching the DB
- The bookings SELECT RLS policy can be applied without the silent-failure risk on the engine path

---

## REMAINING EXECUTION PREREQUISITES (Phase 0+1)

Before Phase 3 or 4 can be applied, the following DB verification must run:

### Phase 0 — Run in Supabase SQL Editor (read-only)

Copy verification queries from `2026-05-14_carnage_booking-rls-policies.md` §Pre-Migration Verification Query sections. Specifically:

**For availability_rules (Phase 3):**
1. Verify `relrowsecurity` state on `vport.availability_rules`
2. List existing policies — confirm no conflicting UPDATE policy
3. Verify `idx_vport_availability_rules_resource_id` index exists

**For bookings (Phase 4):**
1. Verify `relrowsecurity` state on `vport.bookings`
2. List existing policies — confirm no conflicting SELECT policy
3. Verify all 4 join-column indexes exist (`customer_actor_id`, `resource_id`, `resources.owner_actor_id`, `actor_owners.user_id`)
4. Run DB-BOOK-04 owner identity invariant check

### Phase 1 — Index creation (if Phase 0 shows missing indexes)

Run `CREATE INDEX CONCURRENTLY IF NOT EXISTS` statements from the 2026-05-14 report. Each must run **outside a transaction block** and **separately**.

---

## MIGRATION SQL REFERENCE

All migration SQL (RLS policies, index statements, rollback SQL) is in:

```
zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-14_carnage_booking-rls-policies.md
```

No new SQL is added in this file. This file is a phase-status governance update only.

---

## DEPLOYMENT SAFETY REMINDER

| Risk | Status | Mitigation |
|---|---|---|
| Brief RLS-enable window (all rows blocked) | STILL APPLIES | Enable RLS in a separate step before policy creation; test in staging first |
| Silent empty-result failure (bookings SELECT) | **REDUCED** — RC-03 resolved at app layer | Engine path now rejects unauthorized callers before DB; RLS is defense-in-depth |
| Orphaned bookings (no resource) | STILL APPLIES | Run DB-BOOK-04 orphan check before Phase 4 |
| RLS subquery performance | STILL APPLIES | Phase 1 indexes must be confirmed before Phase 3/4 |

---

## UPDATED VALIDATION CHECKLIST

| Validation Area | 2026-05-14 Status | 2026-05-18 Status |
|---|---|---|
| Schema compatibility (bookings) | PENDING | PENDING — Phase 0 required |
| Schema compatibility (availability_rules) | PENDING | PENDING — Phase 0 required |
| DAL compatibility — all bookings reads | PENDING | PENDING — staging test required |
| DAL compatibility — availability_rules reads | PENDING | PENDING — staging test required |
| Engine compatibility — `listBookingHistory` | BLOCKED — RC-03 | **CLEARED** |
| Error handling compatibility (V-AVAIL-04) | PENDING | **CLEARED** — controller deleted |
| Performance — subquery timing | PENDING | PENDING — Phase 1 indexes required |
| Rollback validation | READY | READY |
| Owner identity invariant (DB-BOOK-04) | PENDING | PENDING — run before Phase 4 |

---

## RECOMMENDED NEXT ACTIONS

| Priority | Action | Who |
|---|---|---|
| 1 | Run Phase 0 verification queries in Supabase SQL editor | User / DB admin |
| 2 | Create CONCURRENTLY indexes if Phase 0 shows missing (Phase 1) | User / DB admin |
| 3 | Apply `availability_rules` UPDATE + INSERT RLS policies in staging (Phase 3) | User / DB admin |
| 4 | Verify availability rules still work for owners in staging | User |
| 5 | Apply `vport.bookings` SELECT RLS policy in staging (Phase 4) | User / DB admin |
| 6 | Run full booking flow test (customer + owner + team member) in staging | User |
| 7 | Apply both policies to production after staging passes (Phase 5) | User / DB admin |
| 8 | Notify THOR — CARNAGE RLS migration complete | THOR |

---

## CARNAGE STATUS: READY FOR DB EXECUTION

**Phase 2 prerequisites:** RESOLVED  
**Migration SQL:** Complete in 2026-05-14 report  
**Blocking technical risk:** NONE remaining (pending Phase 0 verification)  
**Next required action:** Phase 0 DB verification queries — must be run by user in Supabase dashboard
