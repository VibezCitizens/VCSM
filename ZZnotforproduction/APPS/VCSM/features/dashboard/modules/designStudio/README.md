# VCSM / dashboard / modules / designStudio

Status: REVIEWED
Security Tier: LOW
Parent Feature: dashboard

Source: apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/
Doc Path: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/designStudio/

---

## Module Summary

The designStudio module is the canvas editor surface for VPORT flyer creation. A verified VPORT owner can create, edit, save, upload image assets for, preview, and queue PNG/PDF exports from a flyer design document associated with their own VPORT.

Access is gated behind the `vportFlyerEditor` release flag. When the flag is disabled the route redirects to `/feed` and the dashboard card is suppressed. The editor is desktop-only.

---

## Key Constraints

- Owner-only: `requireOwnerActorAccess` + `requireDesignDocumentOwnerAccess` on all controller paths
- Caller-supplied `documentId` is always bound to `ownerActorId` before any page, export, or refresh operation
- `vc.design_*` RLS is live-verified as ownership-scoped (2026-06-04)
- One page per document is the current enforced limit (`MAX_PAGES_PER_DOCUMENT = 1`)
- `is_void` filtering on `actor_owners` is open: ELEK-2026-06-02-003

---

## Security Summary

| Command | Status |
|---|---|
| VENOM | COMPLETE — VEN-DASH-003 patched |
| ELEKTRA | COMPLETE — ELEK-002 patched; ELEK-2026-06-02-003 open (LOW) |
| BLACKWIDOW | COMPLETE — RLS live-verified; broader SPIDER-MAN coverage open |

THOR: CAUTION
Open: ELEK-2026-06-02-003, DESIGNSTUDIO-FLAG-001, DESIGNSTUDIO-PAGE-LIMIT-001

---

## Governance Files

| File | Status |
|---|---|
| BEHAVIOR.md | REVIEWED |
| README.md | This file |
| INDEX.md | Present |
| SECURITY.md | MISSING — Write 2 pending |
| ARCHITECTURE.md | MISSING |
| CURRENT_STATUS.md | MISSING |
| OWNERSHIP.md | MISSING |
| TESTS.md | MISSING |
| PERFORMANCE.md | MISSING |
