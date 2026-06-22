---
title: Callback Module — Security
status: STUB
feature: auth
module: callback
source: venom+elektra-derived
created: 2026-06-05
---

# auth / modules / callback — SECURITY

## THOR Status

NO THOR BLOCKERS in this module. (THOR blocker is in recovery module.)

## Findings

### CALLBACK-SEC-001 — Post-Callback Redirect Target Unverified
| Field | Value |
|---|---|
| ID | CALLBACK-SEC-001 |
| Source Finding | ARCHITECT observation |
| Severity | MEDIUM |
| Surface | useAuthCallback.js → post-exchange redirect |
| Description | Post-callback redirect destination is unconfirmed. If the destination is derived from URL state (relay_state, redirect_to param, or similar), an open redirect is possible via crafted callback URLs. Must be confirmed as hardcoded or validated against same-origin allowlist. |
| Status | OPEN — UNVERIFIED |
| THOR | Not blocked |

### CALLBACK-SEC-002 — getSession() After Code Exchange
| Field | Value |
|---|---|
| ID | CALLBACK-SEC-002 |
| Source Findings | ELEK-2026-06-04-005 |
| Severity | LOW |
| Surface | authCallback.controller.js → post-exchange session check |
| Description | If post-exchange session verification uses getSession() (cached JWT) rather than getUser() (server-verified), the session confirmation after code exchange may use a stale token rather than the freshly-issued one. |
| Status | OPEN — UNVERIFIED |
| THOR | Not blocked |

## TODO

- [ ] Confirm post-callback redirect destination is hardcoded (not URL-param-driven)
- [ ] Confirm authCallback.controller uses getUser() after exchangeCodeForSession (not getSession())
