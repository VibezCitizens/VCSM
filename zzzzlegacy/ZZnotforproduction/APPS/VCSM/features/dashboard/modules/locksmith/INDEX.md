# INDEX — VCSM / dashboard / modules / locksmith

**Last ARCHITECT Run:** 2026-06-05
**Status:** SOURCE_VERIFIED
**Ticket:** TICKET-ARCHITECT-DASHBOARD-MODULE-WAVE-0001

---

## Source File Inventory

| File | Layer | Lines Read |
|---|---|---|
| VportDashboardLocksmithScreen.jsx | screen | 1-194 |
| components/locksmithScreenComponents.jsx | component | 1-163 |
| index.js | barrel | 1-2 |

## Module Counts (SOURCE_VERIFIED)

| Layer | Count |
|---|---|
| screen | 1 |
| component | 1 file (4 exports: AreaForm, AreaCard, ServiceDetailRow, GapServiceRow) |
| hook (consumed via adapter) | 3 |
| dal | 0 (delegated to profiles feature) |
| controller | 0 (delegated to profiles feature) |
| model | 0 |
| adapter (consumed) | 1 (profiles adapter) |
| tests | 0 |

## Routes

| Route | Access | Screen |
|---|---|---|
| /actor/:actorId/dashboard/locksmith | PROTECTED (OwnerOnlyDashboardGuard + isOwner check) | VportDashboardLocksmithScreen |

## Write Surfaces (delegated to profiles feature)

| Table | Operation | Owner |
|---|---|---|
| locksmith_service_areas | INSERT/UPDATE/DELETE | profiles feature (via useLocksmithOwner) |
| locksmith_service_details | READ | profiles feature (via useLocksmithProfile) |

## Independence / Completeness

| Field | Value |
|---|---|
| Independence | MOSTLY INDEPENDENT |
| Completeness | MOSTLY COMPLETE |
| BEHAVIOR.md | MISSING |
| Security audit | MISSING |
