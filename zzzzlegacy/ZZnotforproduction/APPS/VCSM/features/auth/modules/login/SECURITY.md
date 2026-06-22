---
title: Login Module — Security
status: STUB
feature: auth
module: login
source: venom+elektra+bw-derived
created: 2026-06-05
---

# auth / modules / login — SECURITY

## THOR Status

NO THOR BLOCKERS in this module. (THOR blocker is in recovery module.)

## Findings

### LOGIN-SEC-001 — Open Redirect After Login
| Field | Value |
|---|---|
| ID | LOGIN-SEC-001 |
| Source Findings | VEN-AUTH-002, ELEK-2026-06-04-002, BW-AUTH-006 |
| Severity | HIGH |
| Surface | useLogin.js → state.from redirect after successful login |
| Description | Post-login redirect uses state.from from React Router location state. useLogin.js has a blocklist (not allowlist). useAuthOnboarding.js (onboarding module) has no blocklist at all. Blocklist-only approach is insufficient — any unlisted external URL redirects successfully. |
| Status | OPEN |
| THOR | Not blocked |

### LOGIN-SEC-002 — Debug PII in Login Hook
| Field | Value |
|---|---|
| ID | LOGIN-SEC-002 |
| Source Findings | VEN-AUTH-005, ELEK-2026-06-04-004 |
| Severity | LOW |
| Surface | useLogin.js → @debuggers import → userId + email PII |
| Description | Debug instrumentation passes userId and email through a conditionally-live logging path. Production safety depends solely on build-time alias substitution stripping the @debuggers import. If the alias is misconfigured, PII is logged in production. |
| Status | OPEN |
| THOR | Not blocked |

### LOGIN-SEC-003 — getSession() Cached JWT for Ownership Checks
| Field | Value |
|---|---|
| ID | LOGIN-SEC-003 |
| Source Findings | ELEK-2026-06-04-005 |
| Severity | LOW |
| Surface | authSession.read.dal.js → supabase.auth.getSession() |
| Description | getSession() returns a cached JWT, not a server-verified token. getUser() performs a server round-trip and is the stronger pattern for write-guard ownership checks. All controllers using authSession.read.dal inherit this weaker verification. |
| Status | OPEN |
| THOR | Not blocked |

## TODO

- [ ] Replace blocklist with same-origin allowlist in useLogin.js redirect
- [ ] Add same-origin check to useAuthOnboarding.js redirect (ELEK-2026-06-04-002 second sink)
- [ ] Confirm @debuggers build-time alias substitution is verified in CI
