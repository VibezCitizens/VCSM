# Runtime Feature Index: auth

## Metadata
| Field | Value |
|---|---|
| Feature | auth |
| CURRENT Folder | CURRENT/features/auth |
| Source Folder | apps/VCSM/src/features/auth |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |

## Source Inventory
| Layer | Count | Key Files |
|---|---:|---|
| Controllers | 14 | authCallback.controller.js, authOps.controller.js, authSession.controller.js, completeProfileGate.controller.js, createUserActor.controller.js, login.controller.js, onboarding.controller.js, profile.controller.js, profileOnboarding.controller.js, register.controller.js, resendVerification.controller.js, sendResetPassword.controller.js, setNewPassword.controller.js |
| DALs | 11 | actorCreate.dal.js, actorGetByProfile.dal.js, actorOwnerCreate.dal.js, authCallback.dal.js, authSession.read.dal.js, emailVerification.dal.js, login.dal.js, onboarding.dal.js, profile.dal.js, register.dal.js, resetPassword.dal.js |
| Hooks | 9 | useAuthCallback.js, useAuthOnboarding.js, useAuthOps.js, useCompleteProfileGate.js, useLogin.js, useRegister.js, useResendVerification.js, useResetPassword.js, useSetNewPassword.js |
| Models | 5 | actor.model.js, emailVerification.model.js, onboarding.model.js, profile.model.js, registerPasswordRules.model.js |
| Screens | 9 | AuthCallbackScreen.jsx, CompleteProfileGate.jsx, ForgotPasswordScreen.jsx, LoginScreen.jsx, Onboarding.jsx, RegisterScreen.jsx, ResetPasswordScreen.jsx, VerifyEmailRequiredScreen.jsx, WelcomeScreen.jsx |
| Components | 2 | ConsentCheckbox.jsx, RegisterFormCard.jsx |
| Routes | 1 | /auth/* — public + AUTH route group |
| Tests | 1 | controllers/__tests__/authCallback.controller.test.js |

## Route / Screen Map
| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| /auth/callback | AuthCallbackScreen.jsx | PUBLIC | PKCE + hash OAuth/email verification callback; isRecovery always false; BW-LOGIN-002 guard enforced |
| /auth/login | LoginScreen.jsx | PUBLIC | Email + password login; post-login discoverable flag update |
| /auth/register | RegisterScreen.jsx | PUBLIC | New account creation; anonymous user upgrade path; Wanders cross-app flow |
| /auth/forgot-password | ForgotPasswordScreen.jsx | PUBLIC | Password reset initiation; sends Supabase resetPasswordForEmail |
| /auth/reset-password | ResetPasswordScreen.jsx | PUBLIC | Password reset completion; PKCE exchange + sessionStorage nonce gate |
| /auth/verify-email | VerifyEmailRequiredScreen.jsx | PUBLIC | Email verification pending gate; resend verification available |
| /auth/onboarding | Onboarding.jsx | AUTH | Post-registration onboarding; profile completion + actor provisioning |
| /auth/complete-profile | CompleteProfileGate.jsx | AUTH | Profile completion gate for existing users with incomplete profile shell |
| /welcome | WelcomeScreen.jsx | AUTH | Post-registration welcome; intent-based (profile / vport) |

## Mutation Surface Map
| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| register.controller.js (ctrlRegisterAccount) | auth/controllers/ | INSERT/UPSERT profiles; Supabase auth.signUp / auth.updateUser | N/A — new account creation | CRITICAL |
| register.controller.js (maybeMirrorWandersSession) | auth/controllers/ | supabase.auth.setSession — overwrites primary client session | YES — user equality checked before mirror (VENOM-AUTH-003) | HIGH |
| onboarding.controller.js (completeOnboardingController) | auth/controllers/ | UPSERT profiles; actor + actor_owner creation | YES — session user.id equality enforced | HIGH |
| onboarding.controller.js (bootstrapJoinOnboardingController) | auth/controllers/ | UPSERT profiles; actor + actor_owner creation | YES — session authedId === userId enforced | HIGH |
| createUserActor.controller.js | auth/controllers/ | INSERT vc.actors (RPC), INSERT vc.actor_owners | PARTIAL — profileId === userId enforced in controller; no server-side RLS verification done | CRITICAL |
| actorOwnerCreate.dal.js | auth/dal/ | UPSERT vc.actor_owners | NO — no app-layer gate; relies on DB RLS (unverified) | HIGH |
| actorCreate.dal.js | auth/dal/ | INSERT via RPC create_actor_for_user | NO — caller-controlled; RLS enforcement unverified | HIGH |
| profile.controller.js (ensureProfileDiscoverable) | auth/controllers/ | UPDATE profiles.discoverable | YES — dalGetAuthSession() + userId equality check | MEDIUM |
| profileOnboarding.controller.js (ensureProfileShell) | auth/controllers/ | UPSERT profiles (bare shell) | NO — called from completeProfileGate with trusted auth user | MEDIUM |
| onboarding.dal.js (upsertCompletedOnboardingProfileDAL) | auth/dal/ | UPSERT profiles (full: display_name, username, birthdate, age, is_adult, sex, publish, discoverable) | NO — caller responsible for session ownership | HIGH |
| resetPassword.dal.js (dalUpdateUserPassword) | auth/dal/ | Supabase auth.updateUser (password) | PARTIAL — client-side nonce gate only; no server-side recovery-provenance check (VENOM-AUTH-001) | HIGH |

## Security-Sensitive Surface Map
| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| AuthContext / AuthProvider.jsx | auth/context/ (referenced, not source-scanned) | AUTH — raw session tokens exposed | Raw access_token + refresh_token in React context via useAuth(); VENOM-2026-05-14-006 OPEN |
| actorOwnerCreate.dal.js | auth/dal/ | OWNERSHIP — caller-supplied actor_id + user_id with no app-layer validation | VENOM-2026-05-11 finding 5; DB RLS unverified |
| authCallback.controller.js | auth/controllers/ | AUTH — attacker-controllable URL hash | hash.get('type') intentionally excluded; BW-LOGIN-002 guard in place; test coverage exists |
| setNewPassword.controller.js (RECOVERY_NONCE_KEY) | auth/controllers/ | AUTH — client-side recovery gate only | sessionStorage nonce; VENOM-AUTH-001 documented gap: no server-side provenance check |
| register.controller.js (maybeMirrorWandersSession) | auth/controllers/ | AUTH — cross-app session injection | Wanders user equality enforced (VENOM-AUTH-003); access_token/refresh_token injected into primary Supabase client |
| onboarding.dal.js (upsertCompletedOnboardingProfileDAL) | auth/dal/ | PROFILE WRITE — sets publish=true, discoverable=true | No DAL-level ownership gate; controller must enforce session ownership before call |
| createUserActor.controller.js | auth/controllers/ | IDENTITY PROVISIONING | profileId === userId enforced; VENOM-AUTH-006 documented |
| window.__sb (Supabase global) | auth/ (via supabaseClient) | AUTH — Supabase client on global object | VENOM-2026-05-14-008 OPEN |

## Audit / Ticket Evidence From CURRENT

| Item | Status | Source CURRENT File |
|---|---|---|
| VENOM-2026-05-11: 10 findings (2 HIGH, 6 MEDIUM, 2 LOW) | PARTIAL — 4 OPEN carry-forward | features/auth/2026-05-11_venom_auth-login-trust-boundaries.md |
| VENOM-2026-05-14: 10 findings | PARTIAL — 14 OPEN carry-forward | features/auth/2026-05-14_venom_auth-login-full-surface.md |
| VENOM-2026-05-23: recovery surface findings (VENOM-AUTH-004/005/007/008) | PARTIAL — 4 OPEN | features/auth/2026-05-23_14-00_venom_login-recovery-surface.md |
| SENTRY 2026-05-11: 5 RESOLVED | COMPLETE | features/auth/2026-05-11_sentry_auth-login-wolverine-fixes.md |
| BLACKWIDOW BW-LOGIN-001/002/003 | HARDENED — PARTIAL | features/auth/2026-05-23_blackwidow_login-screen.md |
| ELEKTRA 2026-05-28 | PARTIAL | features/auth/2026-05-28_elektra_barber.md |
| ARCHITECT 2026-06-02 audit | COMPLETE | features/auth/ARCHITECTURE.md |
| Booking source bypass HIGH P0 | OPEN — no dedicated ticket | DR_STRANGE.md, SECURITY.md |
| Dev diagnostics screen write access HIGH P0 | OPEN — no dedicated ticket | DR_STRANGE.md, SECURITY.md |
| Client-controlled booking data HIGH P0 | OPEN — no dedicated ticket | DR_STRANGE.md, SECURITY.md |
| DB RLS: public.profiles, vc.actor_owners, vc.actors | NOT STARTED | DR_STRANGE.md |
| IRONMAN ownership assignment | NOT STARTED | DR_STRANGE.md |
| SPIDER-MAN test coverage | NOT STARTED | DR_STRANGE.md |

## Runtime Risk Summary

Auth is the platform's highest-security feature (CRITICAL tier). The structural layer stack is complete across all 7 layers (14 controllers, 11 DALs, 9 hooks, 9 screens). The complete session lifecycle is implemented: registration (including anonymous upgrade + Wanders cross-app mirror), login, OAuth callback, password recovery, onboarding, and actor provisioning. Actor provisioning is the highest-risk surface: `createUserActorForProfile` enforces `profileId === userId` in the controller but `actorOwnerCreate.dal.js` has no app-layer gate and DB RLS on vc.actor_owners has never been verified. The sessionStorage nonce gate on password recovery is client-side mitigation only (documented, no fix path yet). Three HIGH P0 findings remain open with no dedicated tickets (booking source bypass, dev diagnostics write access, client-controlled booking fields). Raw Supabase session tokens remain exposed in AuthContext.

## Recommended Next Command

DB — Verify RLS on public.profiles (discoverable update), vc.actor_owners (insert policy), vc.actors (RPC security definer), vc.bookings (ownership enforcement). This unblocks closing the three P0 findings and the actorOwnerCreate ownership gap.

## Recommended Next Ticket

TICKET-AUTH-P0-001 — Open P0 ticket covering: (1) booking source bypass in createBookingController, (2) gate dev diagnostics screen to admin/dev role, (3) harden client-controlled booking fields. These are the only P0 findings on the platform without a dedicated ticket.
