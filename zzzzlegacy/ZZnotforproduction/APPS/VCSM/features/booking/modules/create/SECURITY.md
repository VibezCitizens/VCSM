---
title: Create Module — Security
status: STUB
feature: booking
module: create
source: venom+elektra+bw-derived
created: 2026-06-05
---

# booking / modules / create — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — CREATE-SEC-001, CREATE-SEC-002**

## Findings

### CREATE-SEC-001 — Caller-Supplied Status on Booking INSERT [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | CREATE-SEC-001 |
| Source Findings | VEN-BOOKING-004, ELEK-2026-06-04-004 |
| Severity | HIGH — THOR BLOCKER |
| Surface | createBooking.controller.js → insertBookingDAL |
| Description | createBookingController passes caller-supplied `status` directly to insertBookingDAL for all sources. No status allowlist is enforced. Any status including terminal values (cancelled, completed) can be inserted. A management-source caller can create a booking already in a terminal state. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### CREATE-SEC-002 — customerActorId Injection [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | CREATE-SEC-002 |
| Source Findings | VEN-BOOKING-007, ELEK-2026-06-04-008, BW-BOOK-003 |
| Severity | HIGH — THOR BLOCKER |
| Surface | createBooking.controller.js → customerActorId parameter |
| Description | createBookingController accepts caller-supplied customerActorId for all sources. An owner can attribute a booking to any actor without consent. requestActorId is trusted without session binding. BW-BOOK-003: direct API consumer can attribute booking to arbitrary Citizen. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### CREATE-SEC-003 — Raw UUID in Notification linkPath
| Field | Value |
|---|---|
| ID | CREATE-SEC-003 |
| Source Findings | VEN-BOOKING-009, ELEK-2026-06-04-011, BW-BOOK-015 |
| Severity | MEDIUM |
| Surface | createBooking.controller.js line 138 |
| Description | Raw owner_actor_id UUID in notification linkPath. cancel/confirm controllers were fixed (VEN-BOOKING-005 CLOSED); create controller was not updated. Violates platform no-raw-IDs-in-URLs policy. |
| Status | OPEN |
| THOR | Not blocked independently |

## Remediation

1. CREATE-SEC-001: enforce status allowlist — only `pending` may be set on INSERT
2. CREATE-SEC-002: derive customerActorId from authenticated session (not caller param)
3. Both resolved via TICKET-BOOKING-RPC-001 typed state-machine RPC
4. CREATE-SEC-003: replace raw UUID with slug from getVportSlugByActorId.dal.js
