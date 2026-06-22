---
title: Routes Module — Security
status: STUB
feature: app
module: routes
source: architect-derived
created: 2026-06-05
---

# app / modules / routes — SECURITY

## THOR Status

NO THOR BLOCKERS identified in static scan.

## Findings

### ROUTES-SEC-001 — FROZEN Feature Routes Still Active
| Field | Value |
|---|---|
| ID | ROUTES-SEC-001 |
| Source Finding | ARCHITECT observation |
| Severity | MEDIUM |
| Surface | routes/public/wanders.routes.jsx, routes/public/wanderex.routes.jsx, routes/learning/learning.routes.jsx |
| Description | wanders, wanderex, and learning are FROZEN features but their routes remain active in the router. Users navigating to these routes reach incomplete/broken feature screens. If these screens have any write surfaces or auth-sensitive views, those are still reachable. |
| Status | OPEN |
| THOR | Not blocked |

### ROUTES-SEC-002 — RouteErrorBoundary Stack Trace Leak Risk
| Field | Value |
|---|---|
| ID | ROUTES-SEC-002 |
| Source Finding | ARCHITECT observation |
| Severity | LOW |
| Surface | routes/RouteErrorBoundary.jsx |
| Description | RouteErrorBoundary must render a generic error message in production. If it renders the error.message or stack in any environment, internal file paths and component names are exposed to users. |
| Status | OPEN — UNVERIFIED |
| THOR | Not blocked |

### ROUTES-SEC-003 — AuthPublicRoute Redirect Target (UNVERIFIED)
| Field | Value |
|---|---|
| ID | ROUTES-SEC-003 |
| Source Finding | ARCHITECT observation |
| Severity | LOW |
| Surface | routes/public/AuthPublicRoute.jsx |
| Description | AuthPublicRoute redirects authenticated users away from /auth/* routes. Redirect destination is unconfirmed. If the redirect target is user-influenced (query param, state), open redirect risk exists. |
| Status | OPEN — UNVERIFIED |
| THOR | Not blocked |

## TODO

- [ ] Audit FROZEN feature routes — should they 404 or redirect?
- [ ] Confirm RouteErrorBoundary production rendering (error.message hidden in production?)
- [ ] Confirm AuthPublicRoute redirect destination is hardcoded, not user-influenced
