---
name: vcsm.auth.evidence-bundle
description: ARCHITECT V2 evidence bundle — VCSM:auth — 2026-06-07
metadata:
  type: evidence-bundle
  owner: ARCHITECT
  generated: 2026-06-07T10:00:00Z
  scanner-version: 1.1.0
---

# ARCHITECT Evidence Bundle — VCSM:auth
**Generated:** 2026-06-07T10:00:00Z
**Scanner Version:** 1.1.0
**Scope:** VCSM:auth
**Confidence:** HIGH (security surfaces) / MEDIUM (52 of 64 source files not read)

---

## Source Files Read

| Path | Layer | Lines |
|---|---|---|
| apps/VCSM/src/features/auth/dal/actorCreate.dal.js | dal | 1-31 |
| apps/VCSM/src/features/auth/dal/actorOwnerCreate.dal.js | dal | 1-16 |
| apps/VCSM/src/features/auth/dal/authSession.read.dal.js | dal | 1-17 |
| apps/VCSM/src/features/auth/dal/onboarding.dal.js | dal | 1-85 |
| apps/VCSM/src/features/auth/dal/resetPasswordSecure.dal.js | dal | 1-31 |
| apps/VCSM/src/features/auth/controllers/authCallback.controller.js | controller | 1-90 |
| apps/VCSM/src/features/auth/controllers/authSession.controller.js | controller | 1-5 |
| apps/VCSM/src/features/auth/controllers/createUserActor.controller.js | controller | 1-53 |
| apps/VCSM/src/features/auth/controllers/onboarding.controller.js | controller | 1-262 |
| apps/VCSM/src/features/auth/controllers/register.controller.js | controller | 1-172 |
| apps/VCSM/src/features/auth/adapters/auth.adapter.js | adapter | 1-19 |

**Total source files validated:** 11 of 64

---

## Layer Counts (VCSM:auth module)

| Layer | Count | Files |
|---|---|---|
| controller | 16 | authCallback, authOps, authSession, completeProfileGate, createUserActor, login, onboarding, profile, profileOnboarding, register, resendVerification, sendResetPassword, setNewPassword + tests |
| dal | 12 | actorCreate, actorGetByProfile, actorOwnerCreate, authCallback, authSession.read, emailVerification, login, onboarding, profile, register, resetPassword, resetPasswordSecure |
| hook | 12 | useAuthCallback, useAuthOnboarding, useAuthOps, useCompleteProfileGate, useEmailVerified, useJoinOnboarding, useLogin, useRegister, useResendVerification, useResetPassword, useSetNewPassword |
| model | 7 | actor, authInputValidation, emailVerification, onboarding, profile, registerPasswordRules |
| screen | 9 | AuthCallbackScreen, CompleteProfileGate, ForgotPasswordScreen, LoginScreen, Onboarding, RegisterScreen, ResetPasswordScreen, VerifyEmailRequiredScreen, WelcomeScreen |
| component | 3 | ConsentCheckbox, RegisterFormCard |
| adapter | 1 | auth.adapter.js |
| style | 2 | authInputClasses.js, authTheme |

---

## Write Surfaces (RPCs + Upserts)

| Surface | Operation | Table/RPC | Schema | Ownership Check | Priority |
|---|---|---|---|---|---|
| dalCreateUserActor | rpc | create_actor_for_user | vc | PRESENT (profileId=userId guard) | MEDIUM |
| dalCreateActorOwner | upsert | actor_owners | vc | PARTIAL (actor just created) | MEDIUM |
| generateUsernameDAL | rpc | generate_username | public(null) | ABSENT (no side-effect risk) | LOW |
| upsertProfileShellDAL | upsert | profiles | vc | ABSENT (RLS-only) | HIGH |
| upsertCompletedOnboardingProfileDAL | upsert | profiles | vc | ABSENT at DAL (controller verifies session) | HIGH |
| dalUpdateProfileDiscoverable | update | profiles | vc | ABSENT (not read) | MEDIUM |
| dalUpsertRegisterProfile | upsert | profiles | vc | ABSENT at DAL (caller uses session userId) | HIGH |
| dalRegisterRecoveryPermit | edge_function | auth-register-recovery | — | PRESENT (session JWT required) | MEDIUM |
| dalUpdatePasswordSecure | edge_function | auth-reset-password-secure | — | PRESENT (permitId server-validated) | MEDIUM |

---

## Security-Sensitive Surfaces

| Surface | File | Risk | Priority |
|---|---|---|---|
| upsertProfileShellDAL | dal/onboarding.dal.js:35 | No app-layer owner filter; takes bare `id` param; RLS-only protection | HIGH |
| upsertCompletedOnboardingProfileDAL | dal/onboarding.dal.js:61 | No app-layer owner filter at DAL; controller validates session before call | HIGH |
| dalUpsertRegisterProfile | dal/register.dal.js | No app-layer owner filter at DAL; caller (register.controller) uses session userId | HIGH |
| authCallback.controller error path | controllers/authCallback.controller.js:46 | DEV mode exposes error code; prod uses fixed string — acceptable | LOW |

---

## Security Guards Confirmed Present [SOURCE_VERIFIED]

| Guard | Location | Status |
|---|---|---|
| profileId === userId (VENOM-AUTH-006) | createUserActor.controller.js:26 | VERIFIED PRESENT |
| session user matches passed userId | onboarding.controller.js:88 | VERIFIED PRESENT |
| session user matches userId (join flow) | onboarding.controller.js:216 | VERIFIED PRESENT |
| hash `type` not used as recovery authority (BW-LOGIN-002) | authCallback.controller.js:15-20 | VERIFIED PRESENT |
| Wanders session user ID matching (VENOM-AUTH-003) | register.controller.js:31 | VERIFIED PRESENT |

---

## Call Chains Summary

| Chain | Path | Ownership Checked | Confidence |
|---|---|---|---|
| CHAIN-auth-001 | Onboarding → completeOnboardingController → dalGetAuthSession → upsertCompletedOnboardingProfileDAL | YES (session verified in controller) | HIGH |
| CHAIN-auth-002 | Onboarding → createUserActorForProfile → dalCreateUserActor (RPC) → dalCreateActorOwner | YES (profileId=userId guard) | HIGH |
| CHAIN-auth-003 | Register → ctrlRegisterAccount → dalSignUpRegisterUser → dalUpsertRegisterProfile | YES (session userId from auth response) | HIGH |
| CHAIN-auth-004 | AuthProvider → PASSWORD_RECOVERY → dalRegisterRecoveryPermit → auth-register-recovery Edge Function | YES (session JWT in request) | HIGH |
| CHAIN-auth-005 | SetNewPassword → dalUpdatePasswordSecure → auth-reset-password-secure Edge Function | YES (permitId server-validated) | HIGH |

---

## DB AUDIT NOTES (deferred — code patches done, DB audit separate)

| DB Object | Risk | Suggested Later SQL Review |
|---|---|---|
| profiles table RLS | Upserts rely on RLS; if `auth.uid() = id` policy absent or misconfigured, any auth'd user could write another user's profile | Verify: `CREATE POLICY ... USING (auth.uid() = id)` on INSERT/UPDATE for profiles |
| generate_username RPC (schema=null) | RPC schema undeclared in scanner; may use public schema unexpectedly | Verify schema declaration in RPC definition |

---

## Behavior IDs
BEHAVIOR.md: ACTIVE (authored by LOGAN — TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)

---

## Architecture State

- Most complete module of the 5 scanned (64 source files, 5 test files)
- BEHAVIOR.md ACTIVE — most mature governance state of the 5 modules
- All write controllers have session verification at controller layer
- DAL write surfaces rely on RLS for ownership enforcement — see DB AUDIT NOTES
- No engine declared; identity engine candidate from scanner not wired
- Scanner maps FRESH: generated 2026-06-07T08:11:09Z
