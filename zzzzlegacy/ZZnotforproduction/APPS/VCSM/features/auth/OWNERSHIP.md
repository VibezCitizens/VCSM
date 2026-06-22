---
name: vcsm.auth.ownership
description: IRONMAN ownership record for VCSM:auth feature — full module ownership map
metadata:
  type: ownership
  owner: IRONMAN
  last-ironman-run: 2026-06-06
  architect-source: ARCHITECTURE.md (2026-06-05, FRESH)
  ownership-clarity: PARTIAL
---

# VCSM:auth — Ownership Record

IRONMAN sole owner. Full replacement on each IRONMAN run.

Last updated: 2026-06-06
Last IRONMAN run scope: auth:register module (sub-scope)
Ownership clarity: OWNERSHIP_PARTIAL

---

## 1. Purpose

The auth module governs the full Supabase-backed authentication lifecycle for VCSM:
registration (including anonymous user upgrade and Wanders-flow session mirroring),
login, email verification, password reset, post-auth onboarding (display name, username
generation, birthdate, sex capture), and actor + actor_owner creation. It is the platform's
identity bootstrap gate — no actor exists in the vc schema until this module's onboarding
path completes.

---

## 2. Application Scope

VCSM

---

## 3. Code Roots

```
Primary:  apps/VCSM/src/features/auth/
Adapter:  apps/VCSM/src/features/auth/adapters/auth.adapter.js
Services: apps/VCSM/src/services/supabase/supabaseClient.js
          apps/VCSM/src/services/monitoring/monitoringClient.js
```

---

## 4. Core Layers

```
DAL:        31 files (actorCreate.dal.js, actorOwnerCreate.dal.js, onboarding.dal.js,
            profile.dal.js, register.dal.js, login.dal.js, authCallback.dal.js,
            authSession.read.dal.js, resetPassword.dal.js, emailVerification.dal.js + 21 more)
Model:      12 files (actor.model.js, onboarding.model.js, profile.model.js,
            emailVerification.model.js, registerPasswordRules.model.js,
            authInputValidation.model.js + 6 more)
Controller: 30 files (authCallback.controller.js, register.controller.js, login.controller.js,
            onboarding.controller.js, createUserActor.controller.js,
            completeProfileGate.controller.js, authOps.controller.js,
            authSession.controller.js, profileOnboarding.controller.js,
            profile.controller.js + 20 more)
Service:    N/A — auth module uses service layer (supabase, monitoring) but does not own services
Adapter:    auth.adapter.js — exposes: useAuthOps, authTheme, CompleteProfileGate,
            VerifyEmailRequiredScreen, ConsentCheckbox, bootstrapJoinOnboardingController,
            isEmailVerifiedModel
Hook:       15 files (useAuthCallback.js, useLogin.js, useRegister.js, useAuthOnboarding.js,
            useAuthOps.js, useCompleteProfileGate.js, useResendVerification.js,
            useResetPassword.js, useSetNewPassword.js + 6 more)
Component:  4 files (ConsentCheckbox.jsx, RegisterFormCard.jsx + 2 more)
Screen:     11 files (LoginScreen.jsx, RegisterScreen.jsx, AuthCallbackScreen.jsx,
            Onboarding.jsx, CompleteProfileGate.jsx, ForgotPasswordScreen.jsx,
            ResetPasswordScreen.jsx, VerifyEmailRequiredScreen.jsx, WelcomeScreen.jsx + 2 more)
```

---

## 5. Engines Used

| Engine | Direction | Approved Boundary | Notes |
|---|---|---|---|
| engines/identity | Inbound (injected via ensureVcsmPlatformBootstrap callback) | YES | Not imported directly — IoC pattern |
| engines/profile | Inbound (profiles table reads/writes via DAL) | YES | profiles table is auth-owned during registration |

---

## 6. Database / Schema Ownership

### Tables Read

| Table | Schema | Consuming Layer | Notes |
|---|---|---|---|
| auth.users (session) | Supabase Auth | DAL (dalReadRegisterSession, dalReadLoginSession) | Internal Supabase — read only via getSession() |
| profiles | public | DAL (various read DALs) | Post-onboarding reads go through engines/profile |
| platform.user_consents | platform | features/legal DAL | Cross-feature read via legal.adapter |
| platform.legal_documents | platform | features/legal DAL | Cross-feature read via legal.adapter |

### Tables Written

| Table | Schema | Write Owner | DAL | Notes |
|---|---|---|---|---|
| auth.users | Supabase Auth | auth:register, auth:login, auth:reset | dalSignUpRegisterUser, dalUpdateRegisterUser, dalSignOutRegisterSession, dalMirrorWandersSessionToPrimary | signUp, updateUser, signOut, setSession |
| profiles | public | auth:register (shell), auth:onboarding (complete), auth:profile (discoverable flag) | dalUpsertRegisterProfile, dalUpsertProfile, dalUpdateProfileDiscoverable | Shell: id + email + timestamps. Complete: display_name + username + birthdate + sex |
| vc.actors | vc | auth:onboarding (via createUserActor controller) | actorCreate.dal.js (create_actor_for_user RPC) | RPC — idempotent guard required |
| vc.actor_owners | vc | auth:onboarding (via createUserActor controller) | actorOwnerCreate.dal.js (upsert) | Duplicate guard (23505) present in controller |
| platform.user_consents | platform | features/legal (trigger: auth:register) | dalRecordLegalAcceptance | INSERT only — UPDATE/DELETE denied by RLS |

### Views / RPCs

| Object | Schema | Owner | Notes |
|---|---|---|---|
| create_actor_for_user RPC | vc | auth:onboarding | Called from createUserActor.controller.js |
| generate_username RPC | public | DB (platform) | Called during onboarding; uniqueness enforced server-side |

### RLS Policies (Confirmed)

| Table | Policy | Status |
|---|---|---|
| platform.user_consents | INSERT grant to authenticated | CONFIRMED (migration 20260510030000) |
| platform.user_consents | DENY UPDATE (user_consents_deny_update) | CONFIRMED (migration 20260510030000) |
| platform.user_consents | DENY DELETE (user_consents_deny_delete) | CONFIRMED (migration 20260510030000) |
| platform.user_consents | SELECT policy | UNCONFIRMED — not in reviewed migrations |
| profiles | Supabase Auth implicit (id = auth.uid()) | INFERRED — standard pattern, not formally documented |

### Migration Owner

auth module owns all auth-related migrations. features/legal owns platform.user_consents migrations.

---

## 7. Rule Ownership

| Rule | Owner | Enforcement Layer | Status |
|---|---|---|---|
| Profile shell created before onboarding | auth:register | Controller (ctrlRegisterAccount) | OWNED |
| Wanders session must match expected userId before mirror | auth:register | Controller (maybeMirrorWandersSession) | OWNED — VENOM-AUTH-003 guard confirmed |
| profileId === userId in actor creation | auth:onboarding | Controller (createUserActor.controller.js) | OWNED — VENOM-AUTH-006 guard confirmed |
| Only UUID-format invite codes forwarded | auth:register | Model (isValidInviteCode) | OWNED |
| navState.from must pass safe-path whitelist | auth:register (definition), auth:onboarding (ENFORCEMENT GAP) | Model (isSafeAuthReturnPath defined, NOT called at consume site) | PARTIAL — IM-REG-001 |
| Consent recorded only when session is active | auth:register (orchestration) | Hook (userId check in useRegister.handleRegister) | PARTIAL — no explicit session re-verify |
| PII stripped before monitoring emission | services/monitoring | Service (monitoringClient.stripPii) | OWNED |
| inviteCode attributed to inviter actor at signup | UNOWNED | MISSING — no write path exists | CONFLICT — IM-REG-002 |

---

## 8. Contracts Touched

- Actor Ownership Contract — vc.actors, vc.actor_owners creation chain
- Public Identity Surface Contract — profiles.id = auth.users.id
- Boundary Isolation Contract — legal and wanders accessed via adapters
- Architecture Contract — DAL → Controller → Hook → Screen layer order

---

## 9. Documentation Links

| Type | Path | Status |
|---|---|---|
| Architecture | ZZnotforproduction/APPS/VCSM/features/auth/ARCHITECTURE.md | FRESH (2026-06-05) |
| Behavior | ZZnotforproduction/APPS/VCSM/features/auth/BEHAVIOR.md | STUB — no behavioral spec |
| Security | ZZnotforproduction/APPS/VCSM/features/auth/SECURITY.md | PARTIAL — inline findings only |
| Ownership | ZZnotforproduction/APPS/VCSM/features/auth/OWNERSHIP.md | THIS FILE |
| IRONMAN report (register) | ZZnotforproduction/APPS/VCSM/features/auth/modules/register/2026-06-06_IRONMAN_register-ownership.md | CURRENT |
| Engine audit | MISSING | — |
| Runtime audit | MISSING | — |
| Performance audit | MISSING | — |
| Migration audit | MISSING | — |

---

## 10. Runtime Ownership

| Flow | Entry Point | Owner | Controllers | DALs |
|---|---|---|---|---|
| Email/password registration | RegisterScreen → useRegister | auth:register | ctrlRegisterAccount | dalSignUpRegisterUser, dalUpsertRegisterProfile |
| Anonymous upgrade | ctrlRegisterAccount (branch) | auth:register | ctrlRegisterAccount | dalUpdateRegisterUser, dalUpsertRegisterProfile |
| Wanders session mirror | ctrlRegisterAccount → maybeMirrorWandersSession | auth:register | maybeMirrorWandersSession | dalReadRegisterSession, dalMirrorWandersSessionToPrimary |
| Onboarding | Onboarding.jsx → useAuthOnboarding | auth:onboarding | completeOnboardingController, getOnboardingBootstrapController | onboarding.dal.js, profile.dal.js, actorCreate.dal.js, actorOwnerCreate.dal.js |
| Login | LoginScreen → useLogin | auth:login | ctrlLogin | dalLoginUser, dalReadLoginSession |
| Auth callback | AuthCallbackScreen → useAuthCallback | auth:callback | authCallback.controller.js | authCallback.dal.js |
| Password reset | ForgotPasswordScreen / ResetPasswordScreen | auth:reset | sendResetPassword.controller.js, setNewPassword.controller.js | resetPassword.dal.js |
| Consent recording | useRegister → recordSignupConsent | features/legal (trigger: auth:register) | legalConsent.controller.js | dalRecordLegalAcceptance |

---

## 11. Responsibilities

auth module must own:
- Supabase Auth lifecycle (signUp, signIn, signOut, updateUser, password reset, PKCE callback)
- Profile shell creation (id, email, timestamps) at registration
- Actor and actor_owner creation at onboarding completion
- Username generation (via DB RPC) during onboarding
- Wanders session mirror (userId cross-check guard required)
- navState.from computation at register entry (validation must be enforced at use site)
- Consent recording trigger (execution delegated to features/legal via adapter)
- Monitoring emission for auth failures (execution delegated to services/monitoring)

---

## 12. Boundaries

auth module must NOT:
- Own vc.vibe_invites attribution write until CARNAGE designs the boundary (currently UNOWNED)
- Call legal DAL directly — must always use legal.adapter.js
- Import from features other than wanders (via adapter) and legal (via adapter)
- Write to tables owned by other features post-onboarding
- Validate navState.from at source only — validation must also happen at the consume site (useAuthOnboarding)
- Include userId, email, or tokens in monitoring payloads

---

## 13. Change Impact Rules

If auth module files change, update:
1. ARCHITECTURE.md — re-run ARCHITECT to reflect new layer counts and data contract
2. BEHAVIOR.md — document any behavioral change to happy path, error path, or session state
3. SECURITY.md — update any changed auth guard or trust boundary
4. OWNERSHIP.md (this file) — update tables, rules, and responsibilities
5. Downstream features — if navState state shape changes, LoginScreen and other Register entry points must be updated in sync

---

## 14. Release Gate Notes

THOR blockers from IRONMAN:
- IM-REG-001 (HIGH): navState.from validation gap in useAuthOnboarding.js — isSafeAuthReturnPath not called before navigate
- IM-REG-002 (HIGH): inviteCode attribution UNOWNED — vc.vibe_invites never written at registration

THOR caution (non-blocking):
- IM-REG-004 (MEDIUM): platform.user_consents SELECT RLS policy unconfirmed
- BEHAVIOR.md is a placeholder stub for a trust-critical module (ARCHITECT finding)
- Test coverage: 1 test file for 56-file module (ARCHITECT finding)

---

## 15. Open Ownership Questions

| ID | Question | Severity | Recommended Owner |
|---|---|---|---|
| IM-REG-001 | Who validates navState.from before navigate in useAuthOnboarding? | HIGH | ELEKTRA (patch useAuthOnboarding.js) |
| IM-REG-002 | Who writes vc.vibe_invites accepted_actor_id at registration? | HIGH | CARNAGE (design) → ELEKTRA (patch) |
| IM-REG-004 | Does platform.user_consents have a SELECT RLS policy? | MEDIUM | DB / CARNAGE |
| ARCH-BW | Does wanders adapter expose getWandersSupabase publicly? | MEDIUM | VENOM / HAWKEYE |
| LOGAN | Who authors BEHAVIOR.md behavioral spec for auth? | HIGH | LOGAN |
| SPIDER-MAN | Who adds test coverage for register, login, onboarding, createUserActor? | HIGH | SPIDER-MAN |
