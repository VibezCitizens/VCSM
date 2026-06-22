# Security Status — Bookings Module

**Feature Path:** `apps/VCSM/src/features/dashboard/vport/` + `apps/VCSM/src/features/booking/`
**Scope:** VCSM + ENGINE

---

## VENOM STATUS

**Last Updated:** —
**Highest Open Severity:** —
**THOR Release Blocker:** UNKNOWN

*No VENOM scan recorded. Pending.*

---

## ELEKTRA STATUS

**Last Updated:** 2026-06-05 (warfare simulation — BLIND_REVERIFY_MODE)
**Highest Open Severity:** MEDIUM
**THOR Release Blocker:** CAUTION — MEDIUM findings open; THOR must evaluate in fresh session

### ELEKTRA Findings

| ID | Title | Severity | Status |
|---|---|---|---|
| ELEK-2026-06-05-001 | createBookingController: status enum from caller | MEDIUM | CLOSED_SOURCE_VERIFIED |
| ELEK-2026-06-05-002 | Notification linkPath UUID exposure | MEDIUM | CLOSED_SOURCE_VERIFIED |
| ELEK-2026-06-05-003 | updateBookingStatusDAL: no ownership anchor | LOW | CLOSED_SOURCE_VERIFIED |
| ELEK-2026-06-05-004 | serviceLabelSnapshot trusted from caller | INFO | FP_REJECTED |
| VENOM-WS-001 | Voided actor booking — readActorVportLinkDAL missing is_void | MEDIUM | STILL_OPEN_SOURCE_VERIFIED |
| BW-NEW-002 | createOwnerBooking: missing past-time guard | LOW | STILL_OPEN_SOURCE_VERIFIED |

**False Positives Rejected:** 7
**Scan Areas Covered:** Area 1 (IDOR), Area 2 (Controller Input Trust), Area 7 (URL/Redirect)
**Report:** `ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/ELEKTRA/elektra-report.md`

---

## BLACKWIDOW STATUS

**Last Updated:** —
**Highest Open Severity:** —
**THOR Release Blocker:** UNKNOWN

*No BLACKWIDOW scan recorded. Pending (ELEK-001 and ELEK-002 queued for runtime validation).*

---

## WANDA STATUS

WANDA Last Run: 2026-06-05
Status: COMPLETE_WITH_FINDINGS
WANDA_BLIND_MODE: CONFIRMED

Open WANDA Findings:
  CRITICAL: 0
  HIGH: 1
  MEDIUM: 1
  LOW: 0
  THOR Block Count: 2

Findings:
  WANDA-C-002 | NEW_FINDING_CREATED | MEDIUM | createOwnerBooking — staff self-authorization via resource.owner_actor_id
  WANDA-E-001 | REVIEW_SCOPE_GAP_FOUND | HIGH | createOwnerBooking controller modified, no test file

Coverage Note: booking engine internals (engines/booking/) excluded — adapter boundary reviewed only

---

## HULK STATUS

HULK Last Run: 2026-06-05
Status: COMPLETE_WITH_FINDINGS
HULK_BLIND_MODE: CONFIRMED

Open HULK Findings:
  CATASTROPHIC: 0
  CRITICAL: 0
  SEVERE: 1
  SIGNIFICANT: 0
  THOR Block Count: 1

Findings:
  HULK-2026-06-05-002 | CHAINED_EXPLOIT_FOUND + PRIVILEGE_ESCALATION_CHAIN_FOUND | SEVERE | createOwnerBooking staff self-authorization via resource.owner_actor_id + missing past-time guard enables confirmed past-time booking injection

MAXIMUM_IMPACT_PATH_FOUND: YES (included in Scenario 002 of HULK report)
CATASTROPHIC_FAILURE_FOUND: NO

Report: ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/HULK/2026-06-05_hulk_vport-booking-gasprices-security-branch.md

---

## MAGNETO STATUS

MAGNETO Last Run: 2026-06-05
Status: COMPLETE_WITH_FINDINGS
MAGNETO_BLIND_MODE: CONFIRMED

Open MAGNETO Findings (bookings-relevant):
  CRITICAL: 1 (MAG-003 — assertActorOwnsVportActorController cascade)
  HIGH: 2 (MAG-002 SPOF, MAG-006 gravity well)
  THOR Block Count: 2

Key Findings:
  MAG-002 | SINGLE_POINT_OF_FAILURE_FOUND | HIGH | assertActorOwnsVportActorController is the only ownership assertion; 13+ call sites; modified in this release; no alternative path
  MAG-003 | CASCADE_FAILURE_PATH_FOUND | CRITICAL | assertActorOwnsVportActorController silent failure cascades across settings, join, bookings, and gasprices simultaneously

Report: ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/05/MAGNETO/2026-06-05_magneto_vport-booking-gasprices-security-branch.md
