# Governance: HAWKEYE — Endpoint and API Contract Verification

**Command:** `/HAWKEYE`  
**Authority:** Precision endpoint and API contract verification  
**Mode:** Read-only verification + findings output  
**Scope in VPORT governance:** All modules with external endpoints, Edge Functions, or public APIs

---

## Responsibility

HAWKEYE verifies that VPORT dashboard endpoints and API contracts are correct, complete, and safe. It does not implement — it verifies and reports.

It covers:
- Edge Function endpoint audits — input shape, output shape, auth enforcement
- Public menu/QR endpoints — payload correctness, no internal ID leakage
- External site API contracts — what VCSM exposes to external domains via Edge Functions
- Request parameter validation — are inputs validated before use?
- Response payload hygiene — are only the intended fields returned?
- Error response shape — consistent error contracts across all endpoints
- CORS and header compliance — correct headers for public vs owner-only endpoints
- Contract drift — does the endpoint match the spec in Logan docs?

## Finding Severity Levels

| Level | Definition | Release Impact |
|---|---|---|
| CRITICAL | Auth missing on a protected endpoint, raw UUID in public response | Blocks release |
| HIGH | Incorrect input validation, response over-exposes fields | Blocks release |
| MEDIUM | Inconsistent error shape, missing CORS header on public endpoint | Address before THOR |
| LOW | Documentation gap, cosmetic naming inconsistency | Track, non-blocking |

## Output Location

`zNOTFORPRODUCTION/_ACTIVE/audits/endpoints/YYYY-MM-DD_hawkeye_[module].md`

## When to Run

Before any module with a public endpoint or Edge Function is released. After any change to a controller that feeds an API response. Always run on `external-site` and `tripoint` modules before THOR.

## Module Coverage

See `../vport-dashboard-governance-matrix.md` — HAWKEYE is highest priority for modules marked `PUBLIC` in the Public/Owner column.
