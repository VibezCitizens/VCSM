---
# Module Architecture Report — vcsm.auth
# ARCHITECT §26.11 Dated Immutable Report
# Generated: 2026-06-02
# Ticket: ARCHITECT-AUTH-0001
# Architecture State: EVOLVING
# Module Status: MOSTLY COMPLETE
# Security Tier: CRITICAL
---

## Feature Overview

The auth feature owns the complete VCSM session lifecycle: public auth routes (/auth/*), registration (including anonymous user upgrade and Wanders cross-app flow), email/password login, OAuth callback handling (PKCE and hash-based), password recovery, profile onboarding, actor provisioning, and session hydration. It integrates with Supabase Auth via a DAL boundary and provisions actors and actor_owners in the `vc` schema after session establishment. All public auth surfaces are in-feature; actor identity resolution is delegated to the identity feature after provisioning completes.

**Source Path:** apps/VCSM/src/features/auth/
**Engine Path:** None — feature-only (no engines/ import found)
**Adapter:** apps/VCSM/src/features/auth/adapters/auth.adapter.js

---

## Layer Presence

| Layer | Present | Path |
|---|---|---|
| Controllers | YES | apps/VCSM/src/features/auth/controllers/ |
| DALs | YES | apps/VCSM/src/features/auth/dal/ |
| Models | YES | apps/VCSM/src/features/auth/model/ |
| Hooks | YES | apps/VCSM/src/features/auth/hooks/ |
| Screens | YES | apps/VCSM/src/features/auth/screens/ |
| Components | YES | apps/VCSM/src/features/auth/components/ |
| Adapters | YES | apps/VCSM/src/features/auth/adapters/auth.adapter.js |
| Engine controllers | NO | None |
| Engine DALs | NO | None |

---

## Active Controllers (14)

| Controller | Purpose | Auth Gate |
|---|---|---|
| authCallback.controller.js | Resolves auth state from Supabase email verification redirect (PKCE and hash modes); isRecovery always false; attacker-controlled hash type is intentionally ignored (BW-LOGIN-002) | None — public callback surface |
| authOps.controller.js | Thin pass-through to readCurrentAuthUser | None — reads session only |
| authSession.controller.js | Hydrates Supabase auth session via DAL | None — read-only hydration |
| completeProfileGate.controller.js | Reads current auth user and evaluates whether onboarding is needed via profileOnboarding.controller | None — reads current session user |
| createUserActor.controller.js | Creates actor + actor_owner for authenticated user; enforces profileId === userId (VENOM-AUTH-006); uses RPC create_actor_for_user; idempotent via conflict ignore | Enforces profileId === userId — owner-scoped actor creation |
| login.controller.js | signInWithPassword, getAuthUser, signOut; returns minimal user shape (id + email only) | None — public login surface |
| onboarding.controller.js | getOnboardingBootstrapController (reads session + profile), completeOnboardingController (validates session match, upserts profile, creates actor, calls ensureVcsmPlatformBootstrap), bootstrapJoinOnboardingController (join/invite flow) | dalGetAuthSession() check; userId must equal session user id |
| profile.controller.js | ensureProfileDiscoverable — sets profiles.discoverable=true on login; verifies session user matches userId before update | dalGetAuthSession() ownership check |
| profileOnboarding.controller.js | ensureProfileShell — reads or creates a bare profiles row if missing | None — called from completeProfileGate |
| register.controller.js | ctrlRegisterAccount — handles anonymous user upgrade, stale JWT recovery, Wanders cross-app session mirror (VENOM-AUTH-003: Wanders session user must match registration user before token mirror) | Wanders session user equality check before setSession() |
| resendVerification.controller.js | Resends Supabase signup verification email | None — public |
| sendResetPassword.controller.js | Sends password reset email via Supabase; normalizes email input | None — public |
| setNewPassword.controller.js | resolveRecoverySessionController (PKCE exchange or nonce gate), watchPasswordRecoveryController (subscribes to PASSWORD_RECOVERY event), updatePasswordController (validates password rules, updates, then signs out recovery session); VENOM-AUTH-001: sessionStorage nonce is client-side mitigation only, no server-side recovery-provenance check | sessionStorage nonce (UUID + 30-min TTL) guards fallback path; PKCE code exchange is primary authority |

---

## Active DALs (11)

| DAL | Tables / RPCs | Notes |
|---|---|---|
| actorCreate.dal.js | vc.actors via RPC create_actor_for_user | Creates user actor; returns id, kind, profile_id, is_void |
| actorGetByProfile.dal.js | vc.actors SELECT id, kind, profile_id, is_void | Read-only idempotency check |
| actorOwnerCreate.dal.js | vc.actor_owners UPSERT actor_id, user_id | Idempotent via onConflict; no app-layer ownership validation |
| authCallback.dal.js | Supabase auth.exchangeCodeForSession | PKCE code exchange |
| authSession.read.dal.js | Supabase auth.getSession, auth.onAuthStateChange | Session read + subscription |
| emailVerification.dal.js | Supabase auth.resend (type: signup) | Resend verification email |
| login.dal.js | Supabase auth.signInWithPassword, auth.getUser, auth.signOut | Login / logout / user read |
| onboarding.dal.js | profiles SELECT (id, username, birthdate; id, display_name, username, birthdate, age, sex); profiles UPSERT; Supabase auth.getUser; RPC generate_username | Profile shell read/write; username generation |
| profile.dal.js | profiles SELECT id, discoverable; profiles UPDATE discoverable, updated_at | Login-phase discoverable flag |
| register.dal.js | profiles UPSERT (id, email, created_at, updated_at); Supabase auth.getSession, signUp, updateUser, signOut, setSession | Registration + Wanders session mirror |
| resetPassword.dal.js | Supabase auth.resetPasswordForEmail, exchangeCodeForSession, updateUser (password), signOut (local), onAuthStateChange | Full password recovery cycle |

---

## Active Hooks (9)

| Hook | Calls | Purpose |
|---|---|---|
| useAuthCallback.js | resolveAuthCallbackController | Auth callback screen logic |
| useAuthOnboarding.js | getOnboardingBootstrapController, completeOnboardingController; useIdentityOps (identity adapter) | Drives onboarding screen |
| useAuthOps.js | signInWithPassword, readCurrentAuthUser | Exposes auth ops via adapter |
| useCompleteProfileGate.js | evaluateCompleteProfileGateController | Profile completion gate evaluation |
| useLogin.js | signInWithPassword, ensureProfileDiscoverable, hydrateAuthSession; @debuggers/identity | Login form state + flow |
| useRegister.js | ctrlRegisterAccount, useSignupConsent (legal adapter), password rule evaluation | Registration form + consent |
| useResendVerification.js | resendVerificationEmailController | Resend verification email |
| useResetPassword.js | ctrlSendResetPasswordEmail | Forgot password form |
| useSetNewPassword.js | resolveRecoverySessionController, watchPasswordRecoveryController, updatePasswordController, clearRecoveryFlag | Password reset completion |

---

## Engine Dependencies

None — no import from engines/ found in any auth feature file.

---

## Cross-Feature Dependencies

| Feature | What Is Imported | Direction | Boundary |
|---|---|---|---|
| identity | useIdentityOps from @/features/identity/adapters/identity.adapter | auth → identity | Via adapter — COMPLIANT |
| legal | useSignupConsent from @/features/legal/adapters/legal.adapter | auth → legal | Via adapter — COMPLIANT |
| wanders | getWandersSupabase from @/features/wanders/adapters/services/wandersSupabaseClient.adapter | auth → wanders | Via adapter — COMPLIANT |
| debuggers | debugLoginEvent/Error/SessionSnapshot from @debuggers/identity | auth → debuggers | Dev-only debug output — non-production |

---

## Authorization Pattern

The auth feature uses a session-ownership pattern. Controllers that mutate profile or actor state first call `dalGetAuthSession()` to obtain the live Supabase session and then compare the session user ID against the supplied `userId` or `profileId`. If they do not match, the controller returns an error or throws. For actor creation, `createUserActor.controller.js` enforces `profileId === userId` as a hard invariant — actors can only be created for the currently authenticated user's own profile. The `profile.controller.js` checks `session.user.id === userId` before updating `profiles.discoverable`. Password recovery uses a sessionStorage nonce (UUID, 30-min TTL) as a client-side gate with an explicit documented caveat that no server-side recovery-provenance check exists (VENOM-AUTH-001).

---

## Module Independence Classification

MOSTLY INDEPENDENT

Reason: The auth feature owns its full controller-DAL-model-hook-screen stack and has no engine dependencies. Cross-feature imports are three: identity adapter (post-onboarding actor hydration), legal adapter (consent recording on register), and wanders adapter (cross-app session mirror). All three go through published adapters per architecture contract. The debugger import is dev-only and non-production.

---

## Architecture State

EVOLVING

Reason: The structural layer stack is complete and well-organized. However, actor provisioning carries documented security gaps (caller-supplied IDs with no server-side ownership validation, no DB RLS verification for vc.actors and vc.actor_owners), the password recovery nonce gate is client-side mitigation only, and three HIGH P0 findings remain open with no dedicated tickets. Architecture is not in a regressing state but is not stable until RLS verification and provenance closure are achieved.

---

## Known Structural Risks

1. VENOM-AUTH-001 — Password recovery gate (setNewPassword.controller.js) relies on sessionStorage nonce only. No server-side check that the session originated from a PASSWORD_RECOVERY event. Self-exploitation only; no cross-user path.
2. VENOM-AUTH-003 — Wanders session mirror depends on Wanders client returning a valid user.id; user equality guard is in place but depends on Wanders adapter reliability.
3. VENOM-AUTH-006 — actorOwnerCreate.dal.js has no internal ownership validation. The profileId === userId guard in createUserActor.controller.js is the only protection; a future caller that bypasses the controller can call the DAL directly.
4. actorOwnerCreate.dal.js — plain upsert to vc.actor_owners with DB RLS policy unverified.
5. AuthContext — raw Supabase session (access_token, refresh_token) exposed through React context via useAuth(). VENOM-2026-05-14-006 OPEN.
6. Three HIGH P0 findings open and untracked (booking source bypass, dev diagnostics write access, client-controlled booking data). Not directly in auth source but flagged as auth-surface risks.
7. usecases/index.js and ui/index.js are stub files — scaffolding not populated.

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Feature overview covers all auth domains | None |
| Owner defined | FAIL | OWNERSHIP.md missing; IRONMAN has not run | No formal owner on record |
| Entry points mapped | PASS | 9 screens mapped to /auth/* routes | None |
| Controllers present | PASS | 14 controllers covering full auth lifecycle | None |
| DAL/repository present | PASS | 11 DALs with explicit column selects; no select(*) violations found | vc.actor_owners / vc.actors RLS unverified |
| Models/transformers | PASS | 5 models: actor, profile, onboarding, emailVerification, registerPasswordRules | profileId exposed in ActorModel (identity contract risk) |
| Hooks/view models | PASS | 9 hooks covering all auth screens | None |
| Screens/components | PASS | 9 screens + 2 components | None |
| Authorization path mapped | PARTIAL | Session-ownership pattern documented; PKCE + nonce recovery gates documented | Recovery lacks server-side provenance; actorOwnerCreate DAL-level bypass possible |
| Engine dependencies mapped | N/A | No engine dependencies | N/A |
| Tests/validation noted | PARTIAL | 1 test file: authCallback.controller.test.js (BW-LOGIN-002 regression) | No tests for actor provisioning, onboarding session mismatch, recovery nonce path |

---

## Recommended Handoffs

- DB — Verify RLS on public.profiles (discoverable update), vc.actor_owners (insert policy), vc.actors (RPC security definer), vc.bookings (ownership enforcement). Highest-priority prerequisite.
- CARNAGE — Booking schema constraints; vc.bookings RLS enforcement (prerequisite for three P0 booking findings).
- SPIDER-MAN — Regression tests for createUserActorForProfile, completeOnboardingController session mismatch case, recovery nonce gate, Wanders session mirror.
- IRONMAN — Assign formal ownership; define governance for dev diagnostics screen.
- VENOM — Re-pass against setNewPassword.controller.js recovery nonce (VENOM-AUTH-001 server-side gap) and register.controller.js Wanders mirror guard.

---

## Final Module Status

MOSTLY COMPLETE

The structural stack is complete (all 7 layers present, adapter published, 14 controllers, 11 DALs, 9 hooks, 9 screens). The feature is operationally active and covers the full session lifecycle. Gaps are security-governance gaps (DB RLS unverified, P0 findings untracked, recovery server-side provenance missing, ownership unassigned) rather than structural incompleteness.

---

## ARCHITECT Run Record
- Date: 2026-06-02
- Ticket: ARCHITECT-AUTH-0001
- Source files scanned: 56
- Controllers found: 14
- DALs found: 11
- Hooks found: 9
- Models found: 5
- Screens found: 9
- Components found: 2
- Tests found: 1
- Engine deps: 0
- Cross-feature deps: 3 (all via adapters)
- Architecture State: EVOLVING
- Module Status: MOSTLY COMPLETE
