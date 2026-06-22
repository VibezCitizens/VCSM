# Module: Gas Station / Gas Prices

**VPORT Kinds:** GAS  
**Public/Owner:** BOTH  
**Route:** `/vport/dashboard/gas` + public gas cards  
**Source:** `apps/VCSM/src/features/dashboard/vport/screens/`  
**Governance status:** SOURCE COMPLETE / THOR CAUTION — live DB RLS verification pending  
**Last audit:** 2026-06-04

---

## What This Module Does

Manages gas price submission, station settings, and individual station cards for GAS-kind VPORTs. Includes public gas price display with QR integration.

Citizen fuel price suggestions are private pending review records, not public community posts. The submitter can read their own suggestion, the station owner can review station suggestions, and unrelated users cannot read those pending rows. Suggestions become public price information only when an owner applies them to official prices. Citizen suggestion submission does not publish a feed post.

## Deferred Items

- **DEFER-004:** RESOLVED — `VportDashboardGasScreen.jsx` is final route/identity/ownership gate; `VportDashboardGasView.jsx` owns hooks/composition.
- **DEFER-006 / GAS-CACHE-001:** RESOLVED — `FuelPriceCacheService` owns official/pending/settings cache invalidation.
- **GAS-RLS-001:** OPEN — live DB RLS/check/unique constraint verification still required before THOR CLEAR.

## References

- `logan/marvel/architect/modules/vcsm.vport-gas-prices.architecture.md`
- `logan/marvel/architect/modules/vcsm.vport-gas-station-cards-individual.architecture.md`
- `logan/vports/vcsm.vport.gas-station-profile-spec.md`
