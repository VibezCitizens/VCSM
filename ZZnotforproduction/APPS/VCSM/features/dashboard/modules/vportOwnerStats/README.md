# VCSM / dashboard / modules / vportOwnerStats

Status: APPROVED
Security Tier: MEDIUM
THOR: CLEAR
Parent Feature: dashboard

Source: apps/VCSM/src/features/dashboard/vport/controller/vportOwnerStats.controller.js
Doc Path: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/vportOwnerStats/

---

## Module Summary

The vportOwnerStats module delivers a compact read-only operational summary to verified VPORT owners on a barbershop VPORT profile. It renders today's booking count, upcoming booking count, and active linked barber count in the owner band (`VportBarberShopOwnerBand`).

This module has no write surface, no RPC, and no edge function. It is a pure read aggregation behind controller-level ownership verification.

---

## Key Constraints

- `loadOwnerQuickStatsController({ actorId, callerActorId })` requires both actor IDs
- `assertActorOwnsVportActorController` fires before any profile, resource, staff, or booking read
- Cancelled and no-show bookings are excluded from all counts
- Staff/resource DAL failures throw and are monitored — never silently counted as zero
- UI owner-band checks are display gates only; the controller is the security boundary

---

## Security Summary

| Command | Status |
|---|---|
| VENOM | COMPLETE / PATCHED — VEN-DASH-001 |
| ELEKTRA | COMPLETE / PATCHED — ELEK-003 |
| BLACKWIDOW | COMPLETE / PATCHED — BLOCK-DASH-005 |
| SPIDER-MAN | COMPLETE — 8 focused controller/static tests passing |

THOR: CLEAR — no open findings. All THOR release gates: NO.

---

## Governance Files

| File | Status |
|---|---|
| BEHAVIOR.md | APPROVED |
| README.md | This file |
| INDEX.md | Present |
| SECURITY.md | MISSING — Write 2 pending |
| ARCHITECTURE.md | MISSING |
| CURRENT_STATUS.md | MISSING |
| OWNERSHIP.md | MISSING |
| TESTS.md | MISSING |
| PERFORMANCE.md | MISSING |
