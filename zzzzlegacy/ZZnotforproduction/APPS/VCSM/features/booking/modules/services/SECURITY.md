---
title: Services Module — Security
status: STUB
feature: booking
module: services
source: venom+elektra+bw-derived
created: 2026-06-05
---

# booking / modules / services — SECURITY

## THOR Status

NO THOR BLOCKERS in this module.

## Findings

### SERVICES-SEC-001 — Service Read Scope Unconfirmed
| Field | Value |
|---|---|
| ID | SERVICES-SEC-001 |
| Source Finding | ARCHITECT observation |
| Severity | LOW |
| Surface | readVportServicesByActor.dal.js |
| Description | DAL reads services by actorId. Confirm actorId filter is enforced and does not allow cross-VPORT service enumeration. A missing filter would expose competitor services to unauthorized callers. |
| Status | OPEN — UNVERIFIED |
| THOR | Not blocked |

### SERVICES-SEC-002 — Service Profile IDs Not Validated Against Actor
| Field | Value |
|---|---|
| ID | SERVICES-SEC-002 |
| Source Finding | ARCHITECT observation |
| Severity | LOW |
| Surface | listBookingServiceProfilesByServiceIds.dal.js |
| Description | Service profile reads are keyed by serviceIds passed from the caller. If serviceIds are not validated against the requesting actor's VPORT, foreign service profiles can be read. |
| Status | OPEN — UNVERIFIED |
| THOR | Not blocked |

## TODO

- [ ] Confirm readVportServicesByActor.dal.js actorId filter is enforced
- [ ] Confirm listBookingServiceProfilesByServiceIds.dal.js — are serviceIds scoped to requesting actor?
