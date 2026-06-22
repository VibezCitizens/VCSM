# Governance: KRAVEN — Performance

**Command:** `/Kraven`  
**Authority:** Performance bottleneck analysis  
**Mode:** Read-only + findings output  
**Scope in VPORT governance:** All modules

---

## Responsibility

KRAVEN hunts performance bottlenecks in VPORT dashboard modules.

It reviews:
- DB read cost on component mount (query count, select width)
- Cache hit/miss rates — uncached reads that should be cached
- Query amplification patterns (N+1 queries, fan-out reads)
- Render cycle cost — unnecessary re-renders, stale closures
- Bundle size impact of new imports
- Latency on write paths (serial vs parallel operations)

## Finding Severity Levels

| Level | Definition | Release Impact |
|---|---|---|
| HIGH | Query amplification, serial chain >500ms, uncached hot path | Blocks release |
| MEDIUM | Suboptimal cache TTL, minor render waste | Address before THOR |
| LOW | Cosmetic optimization, future improvement | Track, non-blocking |

## Output Location

`zNOTFORPRODUCTION/_ACTIVE/audits/performance/YYYY-MM-DD_kraven_[module].md`

## When to Run

After ARCHITECT confirms module structure. Before THOR gate.

## Open Performance Items

- K-BOOK-01: Booking serial chain (~310ms) — deferred P2
- K-GAS-01: Fuel price cache (3× DB hits per tab) — deferred P3

## Module Coverage

See `../vport-dashboard-governance-matrix.md` — KRAVEN column.
