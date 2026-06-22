---
title: Resources Module — Security
status: STUB
feature: booking
module: resources
source: venom+elektra+bw-derived
created: 2026-06-05
---

# booking / modules / resources — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — RESOURCES-SEC-001, RESOURCES-SEC-002**

## Findings

### RESOURCES-SEC-001 — Dead DAL: saveBookingServiceProfileDurations [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | RESOURCES-SEC-001 |
| Source Findings | VEN-BOOKING-002, ELEK-2026-06-04-006 |
| Severity | CRITICAL — THOR BLOCKER |
| Surface | dal/saveBookingServiceProfileDurationsByServiceIds.dal.js lines 38, 53, 79 |
| Description | References undefined `supabase` variable at 3 locations. All writes silently fail. Slot duration configuration is completely non-functional. Users see success UI but no data reaches the DB. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### RESOURCES-SEC-002 — Dead DAL: upsertBookingResourceServices [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | RESOURCES-SEC-002 |
| Source Findings | VEN-BOOKING-003, ELEK-2026-06-04-007 |
| Severity | CRITICAL — THOR BLOCKER |
| Surface | dal/upsertBookingResourceServices.dal.js line 24 |
| Description | References undefined `supabase` variable. All resource-service linking writes silently fail. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### RESOURCES-SEC-003 — listOwnerBookingResources No Auth Assertion
| Field | Value |
|---|---|
| ID | RESOURCES-SEC-003 |
| Source Findings | ELEK-2026-06-04-010, BW-BOOK-007 |
| Severity | MEDIUM |
| Surface | controller/listOwnerBookingResources.controller.js |
| Description | No caller auth assertion. Any authenticated actor can enumerate another actor's booking resources. BW-BOOK-007 adversarially verified: BYPASSED. |
| Status | OPEN |
| THOR | Not blocked independently |

## Remediation Priority

1. RESOURCES-SEC-001 + SEC-002: identify correct supabase client import, fix both DALs
2. RESOURCES-SEC-003: add ownership assertion to listOwnerBookingResources controller
