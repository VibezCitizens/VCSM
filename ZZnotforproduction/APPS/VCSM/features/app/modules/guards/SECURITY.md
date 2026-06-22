---
title: Guards Module — Security
status: STUB
feature: app
module: guards
source: architect-derived
created: 2026-06-05
---

# app / modules / guards — SECURITY

## THOR Status

NO THOR BLOCKERS identified in static scan. Guards are the trust boundary — any gap here is critical by definition.

## Findings

### GUARDS-SEC-001 — Auth Guard Loading Flash (UNVERIFIED)
| Field | Value |
|---|---|
| ID | GUARDS-SEC-001 |
| Source Finding | ARCHITECT observation |
| Severity | MEDIUM |
| Surface | guards/ProtectedRoute.jsx |
| Description | If ProtectedRoute renders children before session check resolves, there is a brief flash of protected content for unauthenticated users. Loading state handling unconfirmed. |
| Status | OPEN — UNVERIFIED |
| THOR | Not blocked |

### GUARDS-SEC-002 — Profile Gate Signal Source (UNVERIFIED)
| Field | Value |
|---|---|
| ID | GUARDS-SEC-002 |
| Source Finding | ARCHITECT observation |
| Severity | MEDIUM |
| Surface | guards/ProfileGatedOutlet.jsx |
| Description | Profile completion signal source is unconfirmed. If sourced from a client-side flag (localStorage or Zustand) without server verification, an attacker could manipulate the flag to bypass the onboarding gate and access the full app with an incomplete profile. |
| Status | OPEN — UNVERIFIED |
| THOR | Not blocked |

### GUARDS-SEC-003 — Guard Coverage Completeness
| Field | Value |
|---|---|
| ID | GUARDS-SEC-003 |
| Source Finding | ARCHITECT observation |
| Severity | INFO |
| Surface | routes/index.jsx — route tree |
| Description | Must verify that all protected routes pass through ProtectedRoute. Any route registered outside the ProtectedRoute subtree is accessible to unauthenticated users. FROZEN feature routes (wanders, wanderex, learning) must be confirmed as either fully public or gated. |
| Status | OPEN — UNVERIFIED |
| THOR | Not blocked |

## TODO

- [ ] Confirm ProtectedRoute loading state — renders null, spinner, or children before session resolves?
- [ ] Confirm ProfileGatedOutlet profile signal source — client-only or server-verified?
- [ ] Audit route tree for any protected routes outside ProtectedRoute subtree
