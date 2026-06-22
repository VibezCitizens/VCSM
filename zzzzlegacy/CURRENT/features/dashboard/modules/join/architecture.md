# Join — Architecture

**ARCHITECT status:** NOT_STARTED

Architecture report will be generated after the ARCHITECT command runs.

---

## Known Source Paths

- `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js`
- `apps/VCSM/src/features/join/controllers/joinBarbershopQr.controller.js`
- `apps/VCSM/src/features/join/dal/joinInvite.dal.js`
- `apps/VCSM/src/features/join/hooks/useJoinBarbershop.js`
- `apps/VCSM/src/features/join/screens/`

## Known Cross-Feature Dependency

Shares `joinInvite.dal.js` with `features/invite/`. ARCHITECT must determine whether this DAL belongs in `join/dal/` or should be extracted to a shared boundary.

## Note: barber module has complete ARCHITECT output

The barber ARCHITECT pass (2026-06-01) documented the full join flow from the barber perspective. This join module folder tracks the join feature itself as a standalone governance unit, independent of the barber kind.
