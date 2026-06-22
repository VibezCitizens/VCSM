# VENOM Security Report — Book Tab
**Date:** 2026-05-27
**Reviewer:** VENOM
**Application Scope:** VCSM
**Trigger:** Highest-risk unaudited tab — booking write path, public booking flow

---

## Scope

Public booking flow visible on all VPORT types with a `book` tab. Accessed by any visitor (signed-in citizen or guest). Reviews the full trust chain from UI hook to database insert.

---

## Trace Chain

```
VportPublicBookingFlow.jsx
  ↓
useVportPublicBooking({ profile })
  → citizenActorId resolved from identity (kind:"user" only)
  → handleSubmit → await createBooking({ resourceId, serviceId, startsAt, endsAt, ... })
  ↓
useVportBookingOps() → createVportPublicBookingController
  (apps/VCSM/src/features/dashboard/vport/controller/vportPublicBooking.controller.js)
  ↓
  1. Validates resourceId, startsAt, endsAt, timezone (all required)
  2. getVportResourceByIdDAL({ resourceId }) → resolves resource (is_active check)
  3. readActorVportLinkDAL({ actorId: requestActorId }) → validates kind = "user"
  4. Past-time slot rejection
  5. getVportServiceByIdDAL({ serviceId }) → resolves service label from DB
  6. insertVportBookingDAL({ row: { profile_id: resource.profile_id, ... } })
  7. getVportActorIdByProfileIdDAL → notification routing
  8. publishVcsmNotificationBatch (fire-and-forget, linkPath: null)
```

---

## Security Checklist

| Check | Result | Evidence |
|---|---|---|
| `customer_actor_id` forced from server-resolved requestActor | ✅ PASS | Line 84: `customer_actor_id: requestActorId ?? null` — VPD-V-019 comment |
| `profile_id` sourced from DB resource, not caller-supplied | ✅ PASS | Line 79: `profile_id: resource.profile_id` |
| Service label resolved from DB catalog | ✅ PASS | Lines 68-74: `getVportServiceByIdDAL` — client-supplied `serviceLabelSnapshot` ignored |
| Past-time slot rejected | ✅ PASS | Line 63: `new Date(startsAt).getTime() <= Date.now()` throws |
| Non-user actor type rejected | ✅ PASS | Lines 58-61: `actor.kind !== "user"` → "Switch to your citizen profile to book." |
| Inactive resource rejected | ✅ PASS | Line 52: `resource.is_active !== true` throws |
| Notification does not include VPORT UUID in linkPath | ✅ PASS | Line 116: `linkPath: null` — VPD-V-020 comment |
| VPORT ownership check NOT required on this path | ✅ CORRECT | Public booking is BY citizen, not for VPORT owner — no ownership gate needed |
| Guest booking (null requestActorId) is intentional | ✅ DESIGN | Lines 54-61 comment explains guest/walk-in booking rationale |
| `customerActorId` override attack prevented | ✅ PASS | Hook passes `requestActorId: citizenActorId` — controller ignores client-supplied customerActorId field entirely |

---

## VENOM Findings

### VENOM-BOOK-001 — Slot Collision Race Condition
**Severity:** MEDIUM
**Evidence Type:** INFERRED
**Confidence:** HIGH

**Current behavior:**
`createVportPublicBookingController` does not check whether the selected time slot is still free before calling `insertVportBookingDAL`. Two simultaneous submissions for the same slot will both attempt insert.

**Risk:**
- Double booking of the same slot is possible under concurrent load
- No SELECT FOR UPDATE or equivalent locking mechanism
- DB unique constraint on `(resource_id, starts_at)` may or may not exist — not confirmed in DAL review

**Recommended mitigation:**
Option A: Add a DB unique constraint on `vport.bookings(resource_id, starts_at)` where `status NOT IN ('cancelled', 'rejected')` — DB-level enforcement is most reliable.
Option B: Add an availability re-check in the controller before insert (advisory, not atomic).

**Release impact:** LOW for current traffic; escalates under high concurrent load.

---

### VENOM-BOOK-002 — No Regression Test for Kind Gate
**Severity:** MEDIUM
**Evidence Type:** OBSERVED
**Confidence:** HIGH

**Current behavior:**
The kind check (`actor.kind !== "user"`) is in the controller but has no test verifying it. If the condition were accidentally reversed or the check removed, a VPORT actor could create bookings attributed to a VPORT identity.

**Recommended mitigation:**
Add test: `createVportPublicBookingController` with `requestActorId` belonging to a `kind: "vport"` actor should throw "Switch to your citizen profile to book."

**Handoff:** SPIDER-MAN for test ownership

---

### VENOM-BOOK-003 — Unsanitized customerName / customerNote
**Severity:** LOW
**Evidence Type:** OBSERVED
**Confidence:** HIGH

**Current behavior:**
`customerName` and `customerNote` are stored from caller-supplied values with no sanitization beyond a `.trim()` in the hook. These fields are stored in `vport.bookings` and displayed to VPORT owners in their booking management dashboard.

**Risk:** Low in closed authenticated system. No SQL injection risk (parameterized queries via Supabase client). XSS risk exists if the dashboard renders these fields without escaping (not reviewed in this audit).

**Recommendation:** Verify booking management UI escapes these fields before rendering. Add max-length validation at controller level.

---

## VENOM Status

**PARTIAL — Book tab has solid foundational security (VPD-V-019/020 mitigations applied). MEDIUM gaps exist — not release-blocking but should have regression test coverage before book tab ships to new VPORT types.**

| Finding | Severity | Status |
|---|---|---|
| VENOM-BOOK-001 — Slot collision race | MEDIUM | OPEN — requires DB constraint decision |
| VENOM-BOOK-002 — No kind-gate test | MEDIUM | OPEN — SPIDER-MAN should write test |
| VENOM-BOOK-003 — Unsanitized text fields | LOW | OPEN — verify UI escaping |

**THOR Release Gate Assessment:** CAUTION — book tab may release with understood MEDIUM gaps documented; CRITICAL findings: NONE
