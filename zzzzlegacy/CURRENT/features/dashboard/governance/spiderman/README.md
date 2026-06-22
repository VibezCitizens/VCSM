# Governance: SPIDER-MAN — Test Coverage

**Command:** `/SPIDER-MAN`  
**Authority:** Regression safety and test coverage  
**Mode:** Read + write (creates test files)  
**Scope in VPORT governance:** Controllers and critical paths

---

## Responsibility

SPIDER-MAN builds and verifies the regression safety net for VPORT dashboard modules.

It covers:
- Controller unit tests (business rule validation)
- Ownership gate tests (actor-scoped access)
- Edge case coverage (missing actor, wrong kind, expired token)
- Integration path tests (DAL → controller → hook contract)
- Re-run safety on deferred items

## Coverage Standards

| Path Type | Coverage Target |
|---|---|
| Controllers | 100% of exported functions |
| Ownership gates | All actor-scoped paths |
| Error paths | All CRITICAL VENOM-identified paths |
| Public endpoints | All read paths |

## Output Location

`apps/VCSM/src/features/[feature]/controller/__tests__/` or  
`engines/[engine]/src/controller/__tests__/`  
Audit: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/YYYY-MM-DD_spiderman_[module].md`

## Notable Test Suites

- Booking: `engines/booking/src/controller/__tests__/` — 26 tests added 2026-05-27
- Exchange: `apps/VCSM/src/features/profiles/kinds/vport/controller/rates/__tests__/`

## Module Coverage

See `../vport-dashboard-governance-matrix.md` — SPIDER-MAN column.
