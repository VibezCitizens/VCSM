# Governance: SENTRY — Architecture Contract Compliance

**Command:** `/Sentry`  
**Authority:** Post-execution architecture boundary compliance  
**Mode:** Read-only verification  
**Scope in VPORT governance:** All modules post-execution

---

## Responsibility

SENTRY verifies that changed files conform to the VCSM architecture contract after implementation.

It reviews:
- Layer boundary violations in modified files
- Screen role compliance (Final / View / Component boundaries)
- Hook responsibility compliance (no business rules in hooks)
- Controller responsibility compliance (no React, no UI)
- DAL compliance (raw Supabase only, explicit columns)
- Import path compliance

## Finding Severity Levels

| Level | Definition | Release Impact |
|---|---|---|
| CRITICAL | Layer contract broken (e.g. business logic in screen) | Blocks release |
| HIGH | Import boundary violation, wrong responsibility in layer | Blocks release |
| MINOR | Sub-optimal but contract-aligned pattern | Track, non-blocking |

## Output Location

`zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/YYYY-MM-DD_sentry_[module].md`

## Timing

SENTRY runs POST-EXECUTION — after code is written, before THOR.

## Module Coverage

See `../vport-dashboard-governance-matrix.md` — SENTRY column.
