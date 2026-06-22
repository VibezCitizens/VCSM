---
title: Input Validation Module — Index
status: STUB
feature: auth
module: input-validation
source: red-team-derived
created: 2026-06-06
source-path: apps/VCSM/src/features/auth/
ticket: TICKET-AUTH-INPUT-VALIDATION-001
---

# auth / modules / input-validation

Cross-cutting input validation posture across the full auth feature. Covers redirect safety, email/password validation, XSS resistance, injection resistance, and error handling. Not a standalone screen — a governance lens over all auth entry points.

## Scope

| Area | Files |
|---|---|
| Auth screens | features/auth/screens/* |
| Auth hooks | features/auth/hooks/* |
| Auth guards | app/guards/* |
| Auth provider | app/providers/AuthProvider.jsx |
| Public routes | app/routes/public/* |

## Risk Score (TICKET-AUTH-INPUT-VALIDATION-001)

| Dimension | Score | Notes |
|---|---|---|
| Input Validation | 5/10 | Missing length limits, email format enforcement, invite_code validation |
| Input Normalization | 6/10 | `trim()` only — no `toLowerCase` on email |
| XSS Resistance | 9/10 | JSX auto-escaping throughout; no `dangerouslySetInnerHTML` in auth screens |
| Injection Resistance | 8/10 | Supabase parameterized; no raw SQL |
| Error Handling | 6/10 | Raw `err.message` surfaces in login; DEV mode leakage |
| Auth Flow Hardening | 8/10 | User ID checks, nonce, email gate, consent gate |

**Overall Risk:** MEDIUM

## Security Summary

Highest severity: HIGH (IV-SEC-001 — open redirect, location.state.from blacklist-only)
THOR Release Blocker: NO (but HIGH finding, shared with LOGIN-SEC-001)

## Cross-References

- Full red team report: `outputs/2026/06/05/INPUT-VALIDATION/TICKET-AUTH-INPUT-VALIDATION-001.md`
- Open redirect (shared finding): `modules/login/SECURITY.md` (LOGIN-SEC-001)
- Open redirect (shared finding): `modules/onboarding/SECURITY.md` (ONBOARDING-SEC-003)
