---
name: vcsm.auth.index
description: VCSM auth feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / auth

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 30 | authCallback, authOps, authSession, completeProfileGate, createUserActor, login, onboarding, profile, profileOnboarding, register, resendVerification, sendResetPassword, setNewPassword (+ callgraph expansion from re-exports) |
| DAL files | 31 | actorCreate, actorGetByProfile, actorOwnerCreate, authCallback, authSession.read, emailVerification, login, onboarding, profile, register, resetPassword (+ callgraph expansion) |
| Hooks | 15 | useAuthCallback, useAuthOnboarding, useAuthOps, useCompleteProfileGate, useLogin, useRegister, useResendVerification, useResetPassword, useSetNewPassword |
| Models | 12 | actor.model, emailVerification.model, onboarding.model, profile.model, registerPasswordRules.model |
| Screens | 11 | AuthCallbackScreen, CompleteProfileGate, ForgotPasswordScreen, LoginScreen, Onboarding, RegisterScreen, ResetPasswordScreen, VerifyEmailRequiredScreen, WelcomeScreen |
| Components | 4 | ConsentCheckbox, RegisterFormCard |
| Adapters | 1 | auth.adapter.js |
| Barrels | 7 | index.js (root), ui/index.js, usecases/index.js |
| Styles | 2 | authInputClasses.js, authTheme.js (+ registerFormCard.css) |
| Tests | 1 | controllers/__tests__/authCallback.controller.test.js |
| Routes | 0 | No routes registered in route-map scanner; auth routes are defined in the app router layer (React Router) |
| Total source files | 56 | From feature-map scanner |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| rpc | vc | — | dalCreateUserActor → create_actor_for_user |
| upsert | vc | actor_owners | dalCreateActorOwner |
| rpc | (platform) | — | generateUsernameDAL → generate_username |
| upsert | (public) | profiles | upsertProfileShellDAL |
| upsert | (public) | profiles | upsertCompletedOnboardingProfileDAL |
| update | (public) | profiles | dalUpdateProfileDiscoverable |
| upsert | (public) | profiles | dalUpsertRegisterProfile |

## Security-Sensitive Surfaces

All write surfaces in this module are high-sensitivity:

- **vc.actors (create_actor_for_user RPC):** Creates the platform actor identity. Gated by VENOM-AUTH-006: profileId must equal authenticated userId. Owner-scoped by design.
- **vc.actor_owners (upsert):** Establishes ownership record. Duplicate guard (23505) enforced in createUserActor.controller.js.
- **profiles (upsert x2, update x1):** Registration and onboarding writes. Session is verified before every write in onboarding.controller.js.
- **generate_username RPC:** Username uniqueness enforced server-side. Auth module calls this during onboarding only.
- **Wanders session mirror (register path):** register.controller.js verifies Wanders session userId === registration userId before calling dalMirrorWandersSessionToPrimary (VENOM-AUTH-003).

## Engine Dependencies

- **identity** — platform bootstrap injected via ensureVcsmPlatformBootstrap callback (not a direct import — inversion of control)
- **profile** — profiles table reads and writes throughout registration and onboarding DAL

## Routes

No routes detected in route-map scanner for this feature. Auth screens are registered in the app router layer (React Router), not within the feature source directory. Known routes based on source read:

- `/login` — LoginScreen
- `/register` — RegisterScreen
- `/forgot-password` — ForgotPasswordScreen
- `/reset-password` — ResetPasswordScreen
- `/auth/callback` — AuthCallbackScreen
- `/onboarding` — Onboarding
- `/verify-email` — VerifyEmailRequiredScreen

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (placeholder stub — behavioral spec not yet authored) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
| SCREENS.md | PRESENT (pre-existing) |
