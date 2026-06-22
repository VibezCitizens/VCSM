# Governance: ARCHITECT — Module Architecture

**Command:** `/ARCHITECT`  
**Authority:** Repository structure mapping and architecture compliance  
**Mode:** Read-only + documentation output  
**Scope in VPORT governance:** All modules

---

## Responsibility

ARCHITECT maps the structure of each VPORT dashboard module to confirm it conforms to the VCSM architecture contract.

It reviews:
- Layer compliance: DAL → Model → Controller → Hook → Component → View → Final Screen
- Import path correctness: `@/...` aliases, no `../../` chains
- File length limits (300 line cap)
- Cross-feature boundary violations
- DAL select hygiene (no `select('*')`)
- Engine consumer wiring

## Output Location

`logan/marvel/architect/modules/vcsm.vport-[module].architecture.md`

## When to Run

Before a module is considered release-ready. After any significant refactor.

## Module Coverage

See `../vport-dashboard-governance-matrix.md` — ARCHITECT column.
