---
title: Guards Module — Index
status: STUB
feature: app
module: guards
source: architect-derived
created: 2026-06-05
source-path: apps/VCSM/src/app/guards/
scanner-version: 1.1.0
---

# app / modules / guards

Route access control layer. Two guards: ProtectedRoute (auth gate) and ProfileGatedOutlet (profile completion gate). No write surfaces — pure gate logic.

## Module Summary

| Field | Value |
|---|---|
| Module | guards |
| Feature | app |
| Source Path | apps/VCSM/src/app/guards/ |
| Screens | 0 |
| Routes | 0 |
| Write Surfaces | None |
| Components | 2 (ProtectedRoute.jsx, ProfileGatedOutlet.jsx) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| guards/ProtectedRoute.jsx | Guard | Auth gate — redirects unauthenticated to /auth/login |
| guards/ProfileGatedOutlet.jsx | Guard | Profile completion gate — redirects incomplete profiles to onboarding |
| guards/index.js | Barrel | Guards barrel |

## Gate Logic (UNVERIFIED — STUB)

| Guard | Passes When | Redirects To |
|---|---|---|
| ProtectedRoute | Supabase session exists | /auth/login (UNVERIFIED) |
| ProfileGatedOutlet | Profile complete flag set | /onboarding (UNVERIFIED) |

## Security Flags

- INFO: Guards are the trust boundary for all protected routes — any bypass here exposes all gated features
- TODO: Confirm ProtectedRoute checks Supabase session (not just presence of a token in storage)
- TODO: Confirm ProfileGatedOutlet cannot be bypassed via direct URL navigation

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm ProtectedRoute session check — uses Supabase onAuthStateChange or direct session read?
- [ ] Confirm ProfileGatedOutlet profile completion signal source (Zustand? context? direct API call?)
- [ ] Confirm redirect paths for both guards
- [ ] Confirm whether guards handle loading states (prevent flash of protected content)
