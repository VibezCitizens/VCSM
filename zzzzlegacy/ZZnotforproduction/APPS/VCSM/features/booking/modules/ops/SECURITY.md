---
title: Ops Module — Security
status: STUB
feature: booking
module: ops
source: venom+elektra+bw-derived
created: 2026-06-05
---

# booking / modules / ops — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — OPS-SEC-001, OPS-SEC-002, OPS-SEC-003**

## Findings

### OPS-SEC-001 — Unscoped Booking UPDATE [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | OPS-SEC-001 |
| Source Findings | VEN-BOOKING-001, ELEK-2026-06-04-005 |
| Severity | CRITICAL — THOR BLOCKER |
| Surface | updateBookingStatus.dal.js |
| Description | UPDATE bookings WHERE id = bookingId — no owner_actor_id filter. RLS is the sole persistence-layer barrier. If RLS is misconfigured or bypassed, any bookingId can be status-mutated. All cancel and confirm operations rely on this unscoped DAL. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### OPS-SEC-002 — Missing Terminal-State Gate on Confirm [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | OPS-SEC-002 |
| Source Findings | ELEK-2026-06-04-003, BW-BOOK-012 |
| Severity | HIGH — THOR BLOCKER |
| Surface | confirmBooking.controller.js |
| Description | No terminal-state check before confirming. Cancelled or completed bookings can be re-confirmed. BW-BOOK-012 adversarially verified: BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### OPS-SEC-003 — Missing Terminal-State Gate on Cancel [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | OPS-SEC-003 |
| Source Findings | ELEK-2026-06-04-009, BW-BOOK-013 |
| Severity | MEDIUM — THOR BLOCKER |
| Surface | cancelBooking.controller.js |
| Description | No terminal-state guard before cancelling. Re-cancel of a cancelled booking mutates cancelled_at and internalNote. BW-BOOK-013 adversarially verified: BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### OPS-SEC-004 — profile_id Surfaced in Customer Booking Model
| Field | Value |
|---|---|
| ID | OPS-SEC-004 |
| Source Findings | VEN-BOOKING-010, ELEK-2026-06-04-012 |
| Severity | MEDIUM |
| Surface | listBookingsByCustomer.dal.js → booking.model.js → customerProfileId |
| Description | Internal DB profile_id selected and returned in DAL result. Surfaced as customerProfileId in booking.model.js. Violates architecture contract (no internal IDs in public model). |
| Status | OPEN |
| THOR | Not blocked independently |

## Remediation Priority

1. OPS-SEC-001: add `.eq('owner_actor_id', ownerId)` filter to updateBookingStatusDAL
2. OPS-SEC-002: read current booking status; reject if terminal before confirm
3. OPS-SEC-003: read current booking status; reject if already cancelled
4. OPS-SEC-004: remove profile_id from DAL SELECT
