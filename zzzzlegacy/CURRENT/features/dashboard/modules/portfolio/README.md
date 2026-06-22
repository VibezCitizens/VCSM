# Module: Portfolio (Cross-Kind)

**VPORT Kinds:** ALL  
**Public/Owner:** BOTH  
**Route:** `/vport/portfolio`  
**Source:** `apps/VCSM/src/features/` (portfolio feature) + `engines/portfolio`  
**Governance status:** PARTIAL — implicit in kind audits only  
**Last audit:** Various (implicit, 2026-05-10)

---

## What This Module Does

Portfolio display across all VPORT kinds — work samples, before/after images, project showcases. Managed by owners, displayed publicly on the VPORT profile.

## Why a Dedicated Audit Is Needed

Portfolio has only been reviewed implicitly as part of kind-level audits (barber, restaurant, etc.). No dedicated VENOM or ARCHITECT pass has focused specifically on the portfolio engine's cross-kind data access patterns and write authorization.

## References

- `logan/marvel/architect/modules/vcsm.portfolio-card.architecture.md` (citizen-level — VPORT-level not yet mapped)
