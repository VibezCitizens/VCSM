---
title: Onboarding Module — Index
status: SOURCE_VERIFIED
feature: auth
module: onboarding
source: ARCHITECT V1 manual scan
created: 2026-06-05
last-architect-run: 2026-06-06
source-path: apps/VCSM/src/features/auth/
---

# auth / modules / onboarding

Profile completion onboarding flow. Writes display name, username, avatar, and discoverability. Gated by CompleteProfileGate. Profile shell upsert has ownership verification gap (OPEN FINDING).

## Module Summary

| Field | Value |
|---|---|
| Module | onboarding |
| Feature | auth |
| Source Path | apps/VCSM/src/features/auth/ |
| Screens | 2 (Onboarding, CompleteProfileGate) |
| Routes | /onboarding |
| Write Surfaces | profiles (upsert completed, update discoverable), generate_username RPC, profile shell upsert |
| Controllers | 4 (onboarding, profileOnboarding, completeProfileGate, profile) |
| DAL Files | 2 (onboarding.dal, profile.dal) |
| Hooks | 3 (useAuthOnboarding, useCompleteProfileGate, — ) |

## Known Source Files (SOURCE-VERIFIED 2026-06-06)

| File | Layer | Role | Source-Read |
|---|---|---|---|
| screens/Onboarding.jsx | Screen | Complete Your Profile form (display_name, username_base, birthdate, sex) | YES |
| screens/CompleteProfileGate.jsx | Screen | Gate screen — blocks protected routes until profile complete | NO |
| hooks/useAuthOnboarding.js | Hook | Bootstrap + save orchestration; redirect validation | YES |
| hooks/useJoinOnboarding.js | Hook | Thin wrapper — re-exports bootstrapJoinOnboardingController | YES |
| hooks/useCompleteProfileGate.js | Hook | Profile completion check for gate | NO |
| controllers/onboarding.controller.js | Controller | getOnboardingBootstrapController, completeOnboardingController, bootstrapJoinOnboardingController (session-verified) | YES |
| controllers/profileOnboarding.controller.js | Controller | ensureProfileShell — profile shell upsert (NO session cross-check — ONBOARDING-SEC-001) | YES |
| controllers/createUserActor.controller.js | Controller | createUserActorForProfile — actor + ownership creation (idempotent, owner-scoped guard) | YES |
| controllers/completeProfileGate.controller.js | Controller | Profile completion check logic | NO |
| controllers/profile.controller.js | Controller | Profile read/update | NO |
| dal/onboarding.dal.js | DAL | readProfileForOnboardingDAL, readProfileShellDAL, upsertProfileShellDAL, generateUsernameDAL (RPC), upsertCompletedOnboardingProfileDAL | YES |
| dal/authSession.read.dal.js | DAL | dalGetAuthSession → supabase.auth.getSession() | INFERRED |
| dal/actorCreate.dal.js | DAL | dalCreateUserActor → vc.create_actor_for_user RPC | YES |
| dal/actorOwnerCreate.dal.js | DAL | dalCreateActorOwner → vc.actor_owners upsert | YES |
| dal/actorGetByProfile.dal.js | DAL | dalGetActorByProfile → vc.actors | YES |
| dal/profile.dal.js | DAL | dalUpsertRegisterProfile, profile reads | NO |
| model/onboarding.model.js | Model | mapProfileOnboardingRowToFormModel, normalizeOnboardingFormModel, normalizeSexValueModel, computeAgeFromBirthdateModel, isProfileShellIncompleteModel | YES |
| model/actor.model.js | Model | ActorModel — strips profile_id from actor return | YES |
| model/authInputValidation.model.js | Model | isSafeAuthReturnPath — allowlist redirect validation | YES |
| model/profile.model.js | Model | Profile shape | NO |
| initiation/dal/vibeInvites.dal (cross-feature) | DAL | acceptVibeInviteByCodeDAL — BOUNDARY VIOLATION | INFERRED |

## Write Surface Map

| Operation | Schema | Table | Guard |
|---|---|---|---|
| upsertCompletedOnboardingProfileDAL | public | profiles | Session verified (onboarding.controller) |
| dalUpdateProfileDiscoverable | public | profiles | Session verified (onboarding.controller) |
| dalUpsertRegisterProfile | public | profiles | UNVERIFIED (VEN-AUTH-004) |
| ensureProfileShell (profileOnboarding.controller) | public | profiles | NO session cross-check (VEN-AUTH-004, ELEK-2026-06-04-003, BW-AUTH-005) |

## Write Surface Map (Source-Verified 2026-06-06)

| Operation | DAL | Schema | Table/RPC | Guard | Status |
|---|---|---|---|---|---|
| upsertCompletedOnboardingProfileDAL | onboarding.dal | public | profiles | Session verified (onboarding.controller:72 — userId===user.id) | PASS |
| generateUsernameDAL | onboarding.dal | public | generate_username RPC | Called after session verify | PASS |
| upsertProfileShellDAL | onboarding.dal | public | profiles | NO session cross-check (ONBOARDING-SEC-001) | OPEN |
| dalCreateUserActor | actorCreate.dal | vc | create_actor_for_user RPC | profileId===userId guard (createUserActor.controller:26) | PASS |
| dalCreateActorOwner | actorOwnerCreate.dal | vc | actor_owners | Idempotent; called post-session-verify | PASS |
| acceptVibeInviteByCodeDAL | initiation/dal (cross-feature) | vc | vibe_invites | Best-effort; .catch() — does not block | BOUNDARY VIOLATION |

## Security Flags (Updated 2026-06-06)

- MEDIUM: ONBOARDING-SEC-001 (VEN-AUTH-004, ELEK-2026-06-04-003, BW-AUTH-005) — ensureProfileShell accepts userId from caller; no session cross-check; upsert has no .eq('id', auth.uid()) filter — CONFIRMED source-read
- MEDIUM: ONBOARDING-SEC-002 (BW-AUTH-002) — profiles table RLS for INSERT/UPSERT unconfirmed — UNVERIFIED (DB audit needed)
- **RESOLVED**: ONBOARDING-SEC-003 (ELEK-2026-06-04-002) — isSafeAuthReturnPath confirmed present with allowlist prefix check + rejects `//` and absolute URLs (authInputValidation.model.js:56-64) — BLOCKED
- **NEW**: ARCH-ONBOARD-001 — onboarding.controller.js:13 imports initiation/dal/vibeInvites.dal directly — architecture boundary violation

## Governance Files (Updated 2026-06-06)

| File | Status |
|---|---|
| INDEX.md | SOURCE_VERIFIED |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | SOURCE_VERIFIED |
| SECURITY.md | STUB |

## Resolved TODOs (2026-06-06 source read)

- [x] ensureProfileShell userId sourced from caller — CONFIRMED (no session verification inside)
- [x] upsert filter — upsertProfileShellDAL has no .eq filter — CONFIRMED
- [x] profiles RLS — UNVERIFIED (still needs DB audit via CARNAGE)
- [x] redirect path — state.from validated via isSafeAuthReturnPath — CONFIRMED BLOCKED
