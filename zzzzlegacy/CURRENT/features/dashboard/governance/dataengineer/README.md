# Governance: DATAENGINEER — Data Pipeline and Transformation Audit

**Command:** `/DataEngineer`  
**Authority:** Data pipeline, transformation logic, and feed payload audit  
**Mode:** Read-only analysis + findings output  
**Scope in VPORT governance:** All modules that produce, transform, or consume structured data payloads

---

## Responsibility

DATAENGINEER audits the data transformation and pipeline layer of VPORT dashboard modules. It focuses on how data moves from the database through models, into feed payloads, and out to consumers.

It covers:
- Feed payload shape compliance — structured payloads vs. text parsing, backward compatibility
- Model transformation correctness — are fields renamed, derived booleans, or normalized nullable values correct?
- Publish controller result shape — `{ published, status, reason, postId }` contract on all publish paths
- Exchange rate validation — numeric format, bounds, and validation before any publish
- Feed post backward compatibility — old consumers must handle both old and new payload shapes
- Data minimization in payloads — no over-inclusion of fields consumers don't need
- Null handling — what happens when optional fields are absent, and is the behavior documented?
- Realtime payload shape — do Supabase Realtime events carry the correct fields?

## Finding Severity Levels

| Level | Definition | Release Impact |
|---|---|---|
| CRITICAL | Publish controller returns raw DB row, breaking all consumers | Blocks release |
| HIGH | Exchange rate published without bounds validation, backward compat broken | Blocks release |
| MEDIUM | Nullable field not normalized in model, legacy text parsing only | Address before THOR |
| LOW | Field naming drift, cosmetic payload improvement | Track, non-blocking |

## Output Location

`zNOTFORPRODUCTION/_ACTIVE/audits/data/YYYY-MM-DD_dataengineer_[module].md`

## When to Run

When a module produces system posts, publishes to the VPORT feed, or transforms data for external consumers. Always run on `gas`, `exchange`, `menu`, and `booking` modules before THOR.

## Module Coverage

See `../vport-dashboard-governance-matrix.md` — DATAENGINEER is most relevant for modules marked `BOTH` in the Public/Owner column (both public and owner paths exist).
