# Governance: DB — Database Review and Analysis

**Command:** `/DB`  
**Authority:** Database reviewer and data shape analyst  
**Mode:** Read-only + findings output  
**Scope in VPORT governance:** All modules with DB reads, writes, or schema dependencies

---

## Responsibility

DB reviews the database layer of VPORT dashboard modules. It does not migrate or alter schema — that belongs to CARNAGE. DB reads the current state and reports what it sees.

It covers:
- Table and column shape review for modules under audit
- DAL select hygiene — confirming explicit column lists, no `select('*')`
- RLS policy surface review (policy names and existence — deep migration is CARNAGE)
- Join patterns — confirming joins are intentional and correctly scoped
- Index usage — identifying missing indexes on high-read paths
- Data minimization compliance — no over-fetching into UI layers
- Orphan record risk — FK relationships and cascade behavior

## Finding Severity Levels

| Level | Definition | Release Impact |
|---|---|---|
| CRITICAL | RLS missing on a sensitive table | Blocks release |
| HIGH | `select('*')` in production DAL, missing FK | Blocks release |
| MEDIUM | Over-fetching, missing index on hot path | Address before THOR |
| LOW | Cosmetic schema naming, future improvement | Track, non-blocking |

## Output Location

`zNOTFORPRODUCTION/_ACTIVE/audits/database/YYYY-MM-DD_db_[module].md`

## When to Run

When a module is being audited and its DB layer has not been reviewed. Always before CARNAGE if a migration is being considered.

## Module Coverage

See `../vport-dashboard-governance-matrix.md` for DB review status per module.
