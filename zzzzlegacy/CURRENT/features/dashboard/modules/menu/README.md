# Module: Restaurant Menu / QR

**VPORT Kinds:** RESTAURANT  
**Public/Owner:** BOTH  
**Route:** `/vport/dashboard/menu` (owner) + public QR route  
**Source:** `apps/VCSM/src/features/public/vportMenu/` + dashboard menu card  
**Governance status:** COMPLETE  
**Last audit:** 2026-05-27

---

## What This Module Does

Manages menu creation and publishing for RESTAURANT-kind VPORTs. Generates QR codes that route to a public menu view. No auth required for public menu access.

## Deferred Items

- **DEFER-005:** iOS clipboard API audit for QR copy-link (FALCON, P3, non-blocking)

## References

- `logan/marvel/architect/modules/vcsm.vport-public-menu.architecture.md`
- `logan/marvel/architect/modules/vcsm.vport-restaurant-dashboard-menu-qr.architecture.md`
- `logan/vports/vcsm.vport.menu-pipeline.md`
