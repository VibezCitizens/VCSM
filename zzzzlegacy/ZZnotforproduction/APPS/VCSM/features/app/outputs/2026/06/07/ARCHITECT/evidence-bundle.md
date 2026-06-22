---
name: vcsm.app.evidence-bundle
description: ARCHITECT V2 evidence bundle — VCSM:app — 2026-06-07
metadata:
  type: evidence-bundle
  owner: ARCHITECT
  generated: 2026-06-07T10:00:00Z
  scanner-version: 1.1.0
---

# ARCHITECT Evidence Bundle — VCSM:app
**Generated:** 2026-06-07T10:00:00Z
**Scanner Version:** 1.1.0
**Scope:** VCSM:app
**Confidence:** HIGH (security surfaces)

---

## Source Files Read

| Path | Layer | Lines |
|---|---|---|
| apps/VCSM/src/app/providers/AuthProvider.jsx | component | 1-272 |
| apps/VCSM/src/app/guards/ProtectedRoute.jsx | component | 1-69 |
| apps/VCSM/src/app/guards/ProfileGatedOutlet.jsx | component | 1-10 |
| apps/VCSM/src/app/routes/index.jsx | module | 1-280 |
| apps/VCSM/src/features/auth/adapters/auth.adapter.js | adapter | 1-19 |

**Total source files validated:** 5 of 38

---

## Layer Counts (VCSM:app module)

| Layer | Count | Files |
|---|---|---|
| module | 32 | route files, platform, index files |
| component | 3 | AuthProvider, ProtectedRoute, ProfileGatedOutlet |
| hook | 3 | useAuth (from AuthProvider), others |
| controller | 0 | platform area — no feature controllers |
| dal | 0 | delegates to auth.adapter |

---

## Routes Map (top-level)

| Route Category | Protection | Notes |
|---|---|---|
| /login, /register, /forgot-password, /reset-password, /auth/callback | Public | authPublicRoutes |
| /about, /contact, /how-to/* | Public | aboutPublicRoutes, contactPublicRoutes, howToPublicRoutes |
| /join/*, /legal/* | Public | joinPublicRoutes, legalPublicRoutes |
| /wanders/*, /w/*, /m/*, /menu/*, /reviews/* | Public | wandersPublicRoutes, vportMenuPublicRoutes |
| /onboarding, /welcome | ProtectedRoute only | Auth + email verified + consent |
| All app routes (feed, explore, chat, etc.) | ProtectedRoute + ProfileGatedOutlet | Full auth + profile completion gate |

---

## Security-Sensitive Surfaces

| Surface | File | Risk | Priority |
|---|---|---|---|
| AuthProvider (PASSWORD_RECOVERY) | app/providers/AuthProvider.jsx:116-129 | Edge Function call failure silently swallowed; navigation proceeds without permit | MEDIUM |
| logout() | app/providers/AuthProvider.jsx:206 | scope:'local' — other sessions remain valid; by design (LOKI AD-01/AD-02) | LOW |

---

## Call Chains Summary

| Chain | Path | Ownership Checked | Confidence |
|---|---|---|---|
| CHAIN-app-001 | AuthProvider → PASSWORD_RECOVERY event → dalRegisterRecoveryPermit → auth-register-recovery Edge Function → sessionStorage.setItem → navigate('/reset-password') | YES (session JWT required) | HIGH |
| CHAIN-app-002 | ProtectedRoute → useAuth().user → useEmailVerified() → useLegalConsent() → Outlet | YES (session-gated) | HIGH |
| CHAIN-app-003 | ProfileGatedOutlet → CompleteProfileGate → Outlet | YES (profile completion gate) | HIGH |

---

## Behavior IDs
None — BEHAVIOR.md is PLACEHOLDER.

---

## Architecture State

- Platform shell area (kind: platform-area in scanner)
- ProtectedRoute correctly chains: auth loading → user presence → email verified → consent loading → consent required → render
- AuthProvider is the single source of truth for auth state across the app
- logout() uses local scope intentionally (documented LOKI AD-01/AD-02)
- PASSWORD_RECOVERY permit registration fires async inside IIFE — failure silently navigates without permit
- Route access classification: `unknown` for all 5 features in security-path-map (scanner limitation)
- 0 tests
- Scanner maps FRESH: generated 2026-06-07T08:11:09Z
