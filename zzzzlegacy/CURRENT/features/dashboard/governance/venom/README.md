# Governance: VENOM — Security / Trust Boundaries

**Command:** `/Venom`  
**Authority:** Security review and trust boundary enforcement  
**Mode:** Read-only + findings output  
**Scope in VPORT governance:** All modules

---

## Responsibility

VENOM is the security sheriff for all VPORT dashboard modules.

It reviews:
- Actor ownership validation on all read/write paths
- Exposed internal IDs (raw UUIDs in public URLs, QR codes, API responses)
- Input sanitization and mutation trust boundaries
- Auth flow correctness — who can read what, who can write what
- RLS policy alignment (surface-level only — deep migration is CARNAGE)
- Cross-kind data access isolation

## Finding Severity Levels

| Level | Definition | Release Impact |
|---|---|---|
| CRITICAL | Auth bypass, ownership bypass, raw UUID exposure | Blocks release immediately |
| HIGH | Improper trust boundary, unvalidated input on write path | Blocks release |
| MEDIUM | Sub-optimal pattern, potential escalation path | Must be addressed before THOR |
| LOW | Informational, cosmetic, documentation gap | Track but non-blocking |

## Output Location

`zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/YYYY-MM-DD_venom_[module].md`

## When to Run

Before any module is released. Re-run after any security-adjacent code change (auth, ownership, QR links, public APIs, booking flows).

## Module Coverage

See `../vport-dashboard-governance-matrix.md` — VENOM column.
