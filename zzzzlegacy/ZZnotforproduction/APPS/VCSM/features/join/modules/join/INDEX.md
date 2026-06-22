---
title: Join Module — Index
status: STUB
feature: join
module: join
source: architect+venom+bw-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/join/
scanner-version: 1.1.0
---

# join / modules / join

Barbershop staff join flow via QR token. Two paths: new signup and existing account. Atomic write guard (ELEK-001) on acceptJoinResourceDAL. No THOR blockers. Highest severity: MEDIUM.

## Module Summary

| Field | Value |
|---|---|
| Module | join |
| Feature | join |
| Source Path | apps/VCSM/src/features/join/ |
| Screens | 1 (JoinBarbershopScreen — multi-view state machine) |
| Routes | /join/barbershop/:token (public — confirmed in app router UNVERIFIED) |
| Write Surfaces | vport.resources UPDATE (acceptJoinResourceDAL) |
| Controllers | 2 (joinBarbershopQr, joinBarbershopAccount) |
| DAL Files | 3 (joinInvite, barberVport.read, joinAuth) |
| Hooks | 1 (useJoinBarbershop) |
| Tests | 1 (joinBarbershopQr.controller.test.js — 10 regression cases) |
| No Adapter | Missing — no public boundary |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| controllers/joinBarbershopQr.controller.js | Controller | QR path — token validate → ownership assert → ELEK-001 state check → createBarberVport → accept |
| controllers/joinBarbershopAccount.controller.js | Controller | Account path — existing user, autoResumeInviteOnboarding, useExistingBarberVportAndAccept |
| dal/joinInvite.dal.js | DAL | acceptJoinResourceDAL (UPDATE vport.resources), signUpForInviteDAL (auth.signUp with metadata) |
| dal/barberVport.read.dal.js | DAL | Resource + barbershop data reads for QR token validation |
| dal/joinAuth.dal.js | DAL | signUp and login helpers |
| hooks/useJoinBarbershop.js | Hook | Join flow state machine |
| screens/JoinBarbershopScreen.jsx | Screen | Multi-view join screen (token check, signup/login forms, success) |
| screens/components/JoinSignupForm.jsx | Component | Signup form |
| screens/components/JoinLoginForm.jsx | Component | Login form |
| screens/components/JoinPrimitives.jsx | Component | Shared primitives |
| screens/components/joinStyles.js | Styles | Join UI styles |
| controllers/__tests__/joinBarbershopQr.controller.test.js | Test | 10 ELEK-001 regression assertions |

## Write Surface Map

| Operation | Schema | Table | Guard | Status |
|---|---|---|---|---|
| UPDATE | vport | resources | ELEK-001: meta.status='pending_onboarding' AND member_actor_id IS NULL (controller + DAL double guard) | ACTIVE |
| signUp with metadata | auth | users | Client-controlled metadata embedded in JWT (VEN-JOIN-003) | MEDIUM RISK |

## Engine / Cross-Feature Dependencies

| Dependency | Used For |
|---|---|
| booking/assertActorOwnsVportActorController | Ownership assertion before acceptJoinResourceDAL |
| identity (useIdentity, useIdentityOps, refreshVcActorDirectory) | Actor context |
| features/auth (useAuthOps, bootstrapJoinOnboardingController) | Auth ops during join |
| features/vport (useVportCoreOps → createVport) | VPORT creation in QR path |
| features/legal (recordSignupConsent) | Consent capture during signup |

## Security Flags

- NO THOR BLOCKERS
- MEDIUM: VEN-JOIN-001 — pre-auth token validity oracle via unauthenticated resource fetch; token is implicitly validated/revealed before auth is established
- MEDIUM: VEN-JOIN-002 — autoResumeInviteOnboarding creates side-effects before verifying invite resource state
- MEDIUM: VEN-JOIN-003 — client-controlled metadata (pending_invite_token, vport_name, category_key) embedded in auth JWT via signUpForInviteDAL without server-side length/character validation
- MEDIUM: BW-JOIN-003 — invite-path controllers (createBarberVportAndAccept, useExistingBarberVportAndAccept, autoResumeInviteOnboarding) lack controller-layer resource state pre-check; only QR path has ELEK-001 defense-in-depth
- MEDIUM: BW-JOIN-001 — acceptJoinResourceDAL UPDATE has no caller-identity ownership filter in SQL; ownership enforced only at controller layer; RLS on vport.resources unverified
- MEDIUM: BW-JOIN-004 — raw resource UUID in /join/barbershop/{uuid} URL and email redirect; violates platform no-raw-IDs policy
- LOW: BW-JOIN-002 — autoResumeInviteOnboarding uses optional chaining on injected DAL; duck-typed rather than type-safe

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm route registration in app router — is /join/barbershop/:token protected or public?
- [ ] Confirm vport.resources RLS — does it enforce caller ownership?
- [ ] Confirm signUpForInviteDAL metadata fields — are they validated server-side?
- [ ] Add resource state pre-check to invite-path controllers (BW-JOIN-003)
- [ ] Replace raw resource UUID in join URL with token/slug
