# Module: Reviews (Cross-Kind)

**VPORT Kinds:** ALL  
**Public/Owner:** BOTH  
**Route:** `/vport/reviews` + QR review link  
**Source:** `apps/VCSM/src/features/` (reviews feature) + `engines/reviews`  
**Governance status:** COMPLETE (THOR deferred — DEFER-002)  
**Last audit:** 2026-05-26

---

## What This Module Does

Review collection, display, and QR-gated submission across all VPORT kinds. Includes the QR review landing page, review engine, and dashboard review management.

## Deferred Items

- **DEFER-002:** `service_id` FK in `@reviews` engine schema — CARNAGE migration pending

## References

- `logan/marvel/architect/modules/vcsm.vport-reviews-dashboard.architecture.md`
- `logan/marvel/architect/modules/vcsm.vport-reviews-qr.architecture.md`
- `logan/vports/vcsm.vport.review-pipeline-audit.md`
- `logan/vports/vcsm.vport.review-implementation-plan.md`
