# Governance: ARCHITECT — Tab Architecture Reviews

**Authority:** ARCHITECT is the system cartographer and module independence auditor.
**Last Updated:** 2026-05-27

## Responsibility

ARCHITECT reviews VPORT tab architecture for:
- Tab registry completeness — are all tabs mapped, no orphans
- Layer separation — are views, controllers, hooks, DAL properly layered?
- Adapter boundary compliance — are cross-feature imports going through approved adapters?
- Duplicate component detection (e.g. two `VportReviewsView` paths)
- Dead tab routes — keys in registry with no view component
- Conditional tab injection — is the runtime injection pattern sound?
- Preset conflict detection — does the same type appear in conflicting presets?
- Type registry duplicate detection (DTAB-001: `vportTypeRegistry.js` vs `getVportTabsByType.model.js`)

## Priority Investigations

| Finding | ID | Priority |
|---|---|---|
| Duplicate tab type registry | DTAB-001 | P3 |
| Gas model redirect shim | DTAB-002 | P4 |
| Duplicate VportReviewsView | DTAB-003 | UNVERIFIED |
| Booking tab adapter boundary | DTAB-006 | P2 |
| Portfolio/menu/team/content adapter boundaries | DTAB-007 | P3 |

## Reports Location

`governance/architect/` — filename format: `YYYY-MM-DD_architect_vport-tab-<tab-key>.md`

## Completed Reports

| Tab | Date | Status |
|---|---|---|
| rates (module architecture) | 2026-05-27 | PARTIAL — `architect/modules/vcsm.vport-exchange-rate-dashboard.architecture.md` |
