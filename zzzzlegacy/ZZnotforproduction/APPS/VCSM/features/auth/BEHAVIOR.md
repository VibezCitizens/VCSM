---
name: vcsm.auth.behavior
description: Feature-level behavior contract for the VCSM auth feature — built from governance artifacts
metadata:
  type: behavior
  status: ACTIVE
  authored-by: LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
  date: 2026-06-05
  priority: P1
  evidence-standard: GOVERNANCE_ARTIFACTS_ONLY
---

# Feature Behavior Contract — auth
**Application:** VCSM
**Status:** ACTIVE — built from governance artifacts (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
**Evidence standard:** Governance artifacts only. No source code read. UNKNOWN = unproven.

---

## §1 Purpose

The auth module is the foundational identity bootstrap gate for VCSM. It governs the full Supabase-backed authentication lifecycle: registration (including anonymous user upgrade and Wanders-flow session mirroring), login, email verification, password reset, post-auth onboarding (display name, username generation, birthdate, sex capture), and actor + actor_owner creation.

No actor exists in the vc schema until this module's onboarding path completes. The module also exposes a CompleteProfileGate screen that blocks access to protected areas until profile completion requirements are satisfied.

**Owner:** VCSM platform team. Auth is foundational and cross-cutting — every other feature depends on a resolved actor identity that this module creates.
**Primary domain:** Supabase Auth + vc.profiles + vc.actors + vc.actor_owners.
**Architecture state:** STABLE. Independence status: MOSTLY INDEPENDENT. Spaghetti score: WATCH.

Sources: ARCHITECTURE.md (Purpose, Ownership, Module Missing Pieces), CURRENT_STATUS.md (Architecture state, Final module status).

---

## §2 Entry Points

The following entry points are documented by the ARCHITECT scanner:

| Route | Screen | Purpose |
|---|---|---|
| `/login` | LoginScreen | Email + password sign-in; iOS install prompt; email-confirmed and account-deleted states |
| `/register` | RegisterScreen | Email + password registration; anonymous upgrade; Wanders-flow dual-client |
| `/forgot-password` | ForgotPasswordScreen | Request password reset email |
| `/reset-password` | ResetPasswordScreen | Set new password after recovery token |
| `/auth/callback` | AuthCallbackScreen | PKCE code exchange and implicit hash token session resolution after email verification |
| `/onboarding` | Onboarding | Display name, username, birthdate, sex capture; actor creation |
| `/verify-email` | VerifyEmailRequiredScreen | Gate shown before email is confirmed |
| (wrapper) | CompleteProfileGate | Injected by adapter consumers to guard protected routes until profile is complete |

**Scanner note:** The route-map scanner shows 0 detected routes for auth because auth screens are registered in the app router layer (React Router), not within the feature source directory. The routes above are confirmed from source read by ARCHITECT.

Source: ARCHITECTURE.md (Entry Points), INDEX.md (Routes).

---

## §3 User Flows

The following flows are derivable from module BEHAVIOR.md stubs and ARCHITECT source-read evidence:

### 3.1 Standard Registration
- User visits `/register` — RegisterScreen: email, password, consent checkbox.
- useRegister hook calls ctrlRegisterAccount -> register.dal -> supabase.auth.signUp.
- On success: navigate to `/verify-email` (email confirmation required before access).

Source: modules/register/BEHAVIOR.md.

### 3.2 Actor Provisioning (post email confirmation, on callback)
- User arrives at `/auth/callback` after clicking the confirmation link in their email.
- AuthCallbackScreen renders a loading state immediately.
- useAuthCallback -> authCallback.controller -> authCallback.dal -> supabase.auth.exchangeCodeForSession.
- On success: session established; redirect to post-auth destination.
- createUserActor.controller -> actorCreate.dal -> vc.create_actor_for_user RPC (actor provisioned).
- actorOwnerCreate.dal -> vc.actor_owners upsert (ownership record created).
- Duplicate actor_owner insert (error 23505) is silently ignored — idempotent by design.

Source: modules/register/BEHAVIOR.md, modules/callback/BEHAVIOR.md, ARCHITECTURE.md (Module Data Contract).

### 3.3 Username Generation
- generate_username RPC is called during the registration or onboarding path.
- Server-side uniqueness is guaranteed.
- Exact trigger point (registration vs. onboarding) is UNKNOWN — REQUIRES IMPLEMENTATION REVIEW.

Source: modules/register/BEHAVIOR.md (UNKNOWN noted inline).

### 3.4 Wanders Mirror Path (conditional registration)
- If `isWandersFlow` flag is active: register.controller verifies that the Wanders session userId matches the registration userId before calling dalMirrorWandersSessionToPrimary.
- `isWandersFlow` is sourced from `location.state.wandersFlow` (client-supplied React Router navigation state).
- The Wanders session mirror guard (VENOM-AUTH-003) is the sole backstop against cross-user injection if isWandersFlow is spoofed.

Source: modules/register/BEHAVIOR.md, outputs/2026/06/04/BlackWidow (BW-AUTH-001, Section 5.2 Wanders session injection).

### 3.5 Login Flow
- User visits `/login` — LoginScreen: email + password form.
- useLogin -> login.controller -> login.dal -> supabase.auth.signInWithPassword.
- On failure: error displayed on form.
- On success: redirect to state.from if safe (OPEN REDIRECT RISK — see Section 6), or default to `/feed`.
- On email-confirmed state or account-deleted state: LoginScreen renders an appropriate message.

Source: modules/login/BEHAVIOR.md.

### 3.6 Logout Flow
- useAuthOps -> authOps.controller -> supabase.auth.signOut.
- clearAllIdentityStorage() fires BEFORE signOut (order is critical — see app/shell module).
- On success: redirect to `/login` or WelcomeScreen.

Source: modules/login/BEHAVIOR.md.

### 3.7 Onboarding Flow
- CompleteProfileGate renders on protected routes when the profile is incomplete.
- useCompleteProfileGate -> completeProfileGate.controller -> reads profile completion status.
- If complete: renders children. If incomplete: redirects to `/onboarding`.
- Onboarding.jsx: multi-step form (display name, username, avatar, discoverability).
- Step list is PARTIALLY UNKNOWN — REQUIRES IMPLEMENTATION REVIEW for exact step sequence.
- useAuthOnboarding -> onboarding.controller -> session-verified writes to profiles.
- On completion: upsertCompletedOnboardingProfileDAL marks the profile as complete; dalUpdateProfileDiscoverable sets discoverability preference.
- Session is verified before both writes.
- Post-onboarding redirect destination: UNKNOWN — REQUIRES IMPLEMENTATION REVIEW (state.from or hardcoded /feed).

Source: modules/onboarding/BEHAVIOR.md.

### 3.8 Profile Shell Creation (on registration)
- profileOnboarding.controller.js -> ensureProfileShell -> profile.dal -> profiles upsert.
- The current sole caller (evaluateCompleteProfileGateController) sources userId from supabase.auth.getUser() (server-verified round-trip).

Source: modules/onboarding/BEHAVIOR.md, outputs/2026/06/04/ELEKTRA (ELEK-2026-06-04-003).

### 3.9 Password Reset Flow (Forgot Password)
- User visits `/forgot-password` — ForgotPasswordScreen: email input form.
- useResetPassword -> sendResetPassword.controller -> resetPassword.dal -> supabase.auth.resetPasswordForEmail.
- On success: confirmation message shown; email sent by Supabase.

Source: modules/recovery/BEHAVIOR.md.

### 3.10 Set New Password Flow
- User arrives at `/reset-password` via email link.
- AuthCallbackScreen handles the token exchange first (PKCE code-based path — server-side, inherently secure).
- ResetPasswordScreen: new password input form.
- useSetNewPassword -> setNewPassword.controller.
- Fallback gate (no PKCE code): reads sessionStorage nonce — CLIENT-SIDE ONLY (VEN-AUTH-001 / THOR BLOCKER — see Section 6).
- After password update: dalSignOutRecoverySession signs out the recovery session.
- Note: dalSignOutRecoverySession failure is silently swallowed (BW-AUTH-003) — recovery session remains valid if sign-out fails transiently.

Source: modules/recovery/BEHAVIOR.md.

### 3.11 Resend Email Verification
- VerifyEmailRequiredScreen: button to resend confirmation email.
- useResendVerification -> resendVerification.controller -> emailVerification.dal -> supabase.auth.resend.
- Requires an authenticated session.

Source: modules/recovery/BEHAVIOR.md.

### 3.12 Post-Callback Routing
- Destination after successful /auth/callback is UNKNOWN — REQUIRES IMPLEMENTATION REVIEW (likely /onboarding for new users or /feed for returning users).

Source: modules/callback/BEHAVIOR.md (UNKNOWN noted inline).

---

## §4 Business Rules

1. **No actor without onboarding:** No actor row exists in the vc schema until the onboarding path completes. Actor creation is the terminal gate of the auth lifecycle.
   Source: ARCHITECTURE.md (Purpose).

2. **Email confirmation required:** Registration sends a confirmation email. Access to protected areas requires email verification. `/verify-email` is the holding gate.
   Source: modules/register/BEHAVIOR.md, ARCHITECTURE.md (Entry Points — VerifyEmailRequiredScreen).

3. **Username uniqueness is server-enforced:** generate_username RPC guarantees uniqueness at the database level. Client cannot supply a pre-confirmed username.
   Source: INDEX.md (Write Surface Map), ARCHITECTURE.md (Module Data Contract).

4. **Actor creation is idempotent:** createUserActorForProfile checks for an existing actor before creating a new one. Duplicate actor_owner inserts (error 23505) are silently ignored. A user can never have two actor rows.
   Source: outputs/2026/06/04/BlackWidow (Section 5.6 Mutation Replay — Actor creation).

5. **Anonymous users are blocked from onboarding writes:** isAnonymousUser(user) is checked in both completeOnboardingController and register.controller. Anonymous users are redirected to /register before any write path is executed.
   Source: outputs/2026/06/04/BlackWidow (Section 5.3 Runtime Abuse — Anonymous user path).

6. **Consent is captured at registration:** ConsentCheckbox is a required component on RegisterScreen. Legal consent write to platform.user_consents happens in the legal feature, not in the auth feature.
   Source: modules/register/BEHAVIOR.md, ARCHITECTURE.md (Module Completeness Matrix — Components present).

7. **Sex field accepts an allowlist only:** normalizeSexValueModel() enforces an explicit allowlist: { male: 'Male', female: 'Female' }. Any other value returns null. Sex is not a required field.
   Source: outputs/2026/06/04/ELEKTRA (False Positive Rejected — sex field allowlist).

8. **Birthdate validation is server-computed:** computeAgeFromBirthdateModel validates YYYY-MM-DD format, rejects invalid calendar dates, rejects future birthdates, and computes isAdult server-side. The client cannot supply is_adult directly.
   Source: outputs/2026/06/04/ELEKTRA (False Positive Rejected — birthdate field).

9. **Discoverable flag is set during onboarding:** dalUpdateProfileDiscoverable is called from onboarding completion. The feature also exposes dalUpdateProfileDiscoverable via profile.controller for post-onboarding updates.
   Source: ARCHITECTURE.md (Module Data Contract), INDEX.md (Write Surface Map).

10. **Wanders dual-client is a conditional registration path:** The register.controller resolves to either the primary Supabase client or the Wanders Supabase client based on the isWandersFlow flag. The Wanders session mirror is an optional post-registration step, not a primary auth mechanism.
    Source: ARCHITECTURE.md (Module Dependency Graph — features/wanders).

11. **Minimum password requirement:** registerPasswordRules.model enforces minimum 8 characters, uppercase, lowercase, and number. No special character requirement.
    Source: outputs/2026/06/04/Venom (Section 8 Source Verification Summary — registerPasswordRules.model.js).

12. **Consent checkbox enforcement at registration:** Whether the consent checkbox is technically enforced (i.e., registration cannot proceed without it checked) is UNKNOWN — REQUIRES IMPLEMENTATION REVIEW.
    Source: modules/register/BEHAVIOR.md (TODO item).

---

## §5 State Rules

The following state transitions are derivable from governance:

### Auth Lifecycle States

```
UNAUTHENTICATED
  -> (register + email confirm) -> EMAIL_PENDING_VERIFICATION
  -> (email confirmed, callback processed) -> AUTHENTICATED_NO_ACTOR
  -> (onboarding complete) -> AUTHENTICATED_WITH_ACTOR (FULLY_PROVISIONED)

UNAUTHENTICATED
  -> (login with unconfirmed email) -> EMAIL_PENDING_VERIFICATION (re-shown VerifyEmailRequiredScreen)
  -> (login with deleted account) -> ACCOUNT_DELETED (LoginScreen error state)

AUTHENTICATED_NO_ACTOR
  -> (CompleteProfileGate encountered) -> redirected to /onboarding
  -> (onboarding.controller session mismatch) -> LOGIN_REDIRECT (no write; returns {ok: false, action: 'login'})

ANONYMOUS_USER
  -> (register flow) -> EMAIL_PENDING_VERIFICATION (anonymous upgrade path)
  -> (CompleteProfileGate or onboarding write attempted) -> redirected to /register (anonymous blocked)

AUTHENTICATED_WITH_ACTOR (recovery path)
  -> (forgot-password request) -> RECOVERY_EMAIL_SENT
  -> (reset link clicked, PKCE exchange succeeds) -> RECOVERY_SESSION_ACTIVE
  -> (password updated, signOut succeeds) -> UNAUTHENTICATED
  -> (password updated, signOut silently fails [BW-AUTH-003]) -> RECOVERY_SESSION_STILL_VALID (replay window until token expiry)
```

**Session read pattern:**
- Most ownership-check controllers use dalGetAuthSession() -> supabase.auth.getSession() (cached JWT, not server-verified) — ELEK-2026-06-04-005.
- Only completeProfileGate.controller uses readCurrentAuthUserDAL() -> supabase.auth.getUser() (server-verified round-trip).

Source: modules/recovery/BEHAVIOR.md (recovery state transitions), modules/login/BEHAVIOR.md (login states), modules/onboarding/BEHAVIOR.md (gate redirect), outputs/2026/06/04/BlackWidow (Section 5.2 Null/stale session bypass — BLOCKED), outputs/2026/06/04/ELEKTRA (ELEK-2026-06-04-005).

---

## §6 Security Constraints

Each constraint is derived from a finding in VENOM, ELEKTRA, or BLACKWIDOW governance output.

---

**CONSTRAINT-1:** Password reset must not succeed based solely on a client-side sessionStorage nonce. The fallback recovery gate must be server-enforced.
Evidence: VEN-AUTH-001 (HIGH, THOR BLOCKER) — supabase.auth.updateUser({ password }) does not enforce that the session originated from a PASSWORD_RECOVERY event. The current fallback gate uses a client-forgeable UUID nonce + cached JWT (not server-verified). Self-exploitation confirmed by BW-AUTH-004.
Source: outputs/2026/06/04/Venom (VEN-AUTH-001), outputs/2026/06/04/BlackWidow (BW-AUTH-004), outputs/2026/06/04/ELEKTRA (ELEK-2026-06-04-001).

---

**CONSTRAINT-2:** Post-login and post-onboarding redirect destinations must be validated as same-origin relative paths before navigation.
Evidence: VEN-AUTH-002 (MEDIUM) / ELEK-2026-06-04-002 (MEDIUM) — useLogin.js uses a blocklist (not an allowlist) that does not block absolute URLs. useAuthOnboarding.js has no blocklist at all. Both sinks pass absolute URLs through to navigate().
Source: outputs/2026/06/04/Venom (VEN-AUTH-002), outputs/2026/06/04/ELEKTRA (ELEK-2026-06-04-002), outputs/2026/06/04/BlackWidow (BW-AUTH-006).

---

**CONSTRAINT-3:** All profile write operations must verify at the application layer that the active session userId matches the userId being written, regardless of RLS presence.
Evidence: VEN-AUTH-004 (MEDIUM) / ELEK-2026-06-04-003 (MEDIUM) — ensureProfileShell accepts a caller-supplied userId without an internal session cross-check. Current sole caller is safe (sources from getUser()), but the function itself has no ownership-vs-session guard.
Source: outputs/2026/06/04/Venom (VEN-AUTH-004), outputs/2026/06/04/ELEKTRA (ELEK-2026-06-04-003), outputs/2026/06/04/BlackWidow (BW-AUTH-005).

---

**CONSTRAINT-4:** Debug instrumentation that passes PII (userId, email) must be guarded by an explicit import.meta.env.DEV check, not solely by build-time alias substitution.
Evidence: VEN-AUTH-005 (LOW) / ELEK-2026-06-04-004 (LOW) — @debuggers/identity import in useLogin.js passes full session data including user.id and email to debugLoginSessionSnapshot(). Production safety depends solely on Vite alias substitution — a single build misconfiguration exposes PII.
Source: outputs/2026/06/04/Venom (VEN-AUTH-005), outputs/2026/06/04/ELEKTRA (ELEK-2026-06-04-004).

---

**CONSTRAINT-5:** Actor creation (create_actor_for_user) must only be called with profileId equal to userId sourced from the authenticated session. No caller may pass a profileId that differs from the session userId.
Evidence: VEN-AUTH-006 (LOW, VERIFIED SAFE) — createUserActorForProfile.controller enforces profileId !== userId guard explicitly and is documented as VENOM-AUTH-006 in source. Guard is verified present. Regression test does not yet exist.
Source: outputs/2026/06/04/Venom (VEN-AUTH-006).

---

**CONSTRAINT-6:** The Wanders session mirror must only execute if the Wanders session userId exactly matches the registering user's userId. A stale Wanders session for a different user must never overwrite the primary session.
Evidence: VEN-AUTH-003 (LOW, MITIGATED) — guard is present in register.controller.js; maybeMirrorWandersSession throws on user ID mismatch. Latent risk noted because isWandersFlow is client-controlled navigation state (BW-AUTH-001).
Source: outputs/2026/06/04/Venom (VEN-AUTH-003), outputs/2026/06/04/BlackWidow (BW-AUTH-001).

---

**CONSTRAINT-7:** Ownership-check controllers must not use getSession() (cached JWT) as the sole session verification for write-guarding purposes; getUser() (server-verified) is the stronger pattern.
Evidence: ELEK-2026-06-04-005 (LOW) — all write-guard controllers except completeProfileGate.controller use dalGetAuthSession() -> supabase.auth.getSession() (in-memory/localStorage cache) rather than supabase.auth.getUser() (server round-trip). Practical risk is bounded by Supabase's sink-level JWT revalidation, but defense-in-depth is degraded.
Source: outputs/2026/06/04/ELEKTRA (ELEK-2026-06-04-005).

---

**CONSTRAINT-8:** error_description values from Supabase auth callbacks must never be exposed in production UI. Fixed/sanitized messages must be used instead.
Evidence: authCallback.controller.js:43-46 and setNewPassword.controller.js:103-108 both sanitize error_description in production. hash.get('type') is intentionally excluded from callback resolution to prevent attacker-controlled recovery type injection.
Source: outputs/2026/06/04/BlackWidow (Section 5.9 URL Surface — CLEAN verdict, sanitization confirmed).

---

**CONSTRAINT-9:** The RLS policy on the profiles table must enforce auth.uid() = id for all INSERT and UPDATE paths (upsert x3, update x1) executed by the auth module. This DB-layer policy has not been confirmed audited.
Evidence: BW-AUTH-002 (MEDIUM, UNRESOLVED) — profiles upsert RLS not confirmed verified in any open VENOM or ELEKTRA finding. DB command has not been run to audit this path.
Source: outputs/2026/06/04/BlackWidow (BW-AUTH-002), outputs/2026/06/04/ELEKTRA (ELEK-2026-06-04-003 RLS note).

---

## §7 Error Handling

The following error states are documentable from governance:

| State | Screen / Controller | Behavior |
|---|---|---|
| Login failure | LoginScreen | Error message rendered in form error div; all controllers return structured {ok, error} result |
| Email not confirmed | LoginScreen | Email-confirmed state shown (distinct from generic login failure) |
| Account deleted | LoginScreen | Account-deleted state shown |
| Auth callback failure | AuthCallbackScreen | Error state returned; error_description sanitized in production (fixed message) |
| Onboarding session mismatch | onboarding.controller | Returns {ok: false, action: 'login'} — triggers login redirect, no write executed |
| bootstrapJoinOnboarding mismatch | onboarding.controller | Hard throw on session mismatch |
| Actor creation (null inputs) | createUserActor.controller | Throws: 'profileId and userId are required' |
| Actor creation (null profileId at DAL) | actorCreate.dal | Throws: 'profileId is required' |
| ensureProfileShell (null userId) | profileOnboarding.controller | Throws: 'userId is required' |
| Null email for resend verification | resendVerification.controller | Throws: 'Email is required' |
| Recovery nonce expired or absent | setNewPassword.controller (fallback path) | Returns {ok: false} — write blocked |
| Recovery sign-out failure | setNewPassword.controller | Failure silently swallowed (BW-AUTH-003) — recovery session remains valid |
| Actor already exists (duplicate) | createUserActor.controller | dalGetActorByProfile check prevents second creation; actor_owner insert (23505) silently ignored |

**Error handling for AuthCallbackScreen (exchange failure) redirect destination:** UNKNOWN — REQUIRES IMPLEMENTATION REVIEW.
Source: modules/callback/BEHAVIOR.md (UNKNOWN noted inline).

Sources: ARCHITECTURE.md (Module Completeness Matrix — Error/loading/empty states mapped PASS), outputs/2026/06/04/BlackWidow (Sections 5.2, 5.5 — null guard verification), modules/recovery/BEHAVIOR.md (recovery sign-out failure).

---

## §8 Cross-Feature Dependencies

| Dependency | Type | Direction | Boundary Status | Notes |
|---|---|---|---|---|
| engines/identity | Engine | Inbound (injected via ensureVcsmPlatformBootstrap callback) | APPROVED | Not a direct import — inversion of control pattern. If a caller forgets to inject, actor creation succeeds but identity directory row is never created. |
| engines/profile | Engine | Inbound (profile reads/writes via DAL) | APPROVED | profiles table is auth-owned in this phase. |
| features/wanders | Feature cross-dep | register.controller.js imports getWandersSupabase from wanders adapter | NEEDS REVIEW | Direct cross-feature import via adapter path — requires verification that wanders exposes this via its own public adapter barrel. Wanders client failure in the register path could abort registration silently. |
| supabase.auth | External service | Write | APPROVED | signUp, signIn, signOut, PKCE exchange, password reset — via supabaseClient service. |
| vc.actors (create_actor_for_user RPC) | DB | Write | APPROVED | Creates platform actor identity; owner-scoped at application layer (VEN-AUTH-006 guard). |
| vc.actor_owners | DB | Write (upsert) | APPROVED | Establishes ownership record; duplicate guard (23505) enforced. |
| profiles (public schema) | DB | Write (upsert x3, update x1) | APPROVED | Registration, onboarding, and discoverable flag writes. RLS not yet confirmed audited (BW-AUTH-002). |
| generate_username | DB RPC | Write | APPROVED | Username uniqueness enforced server-side. |
| onAuthStateChange / AuthProvider | Runtime | Implicit dependency | PARTIAL | Session state management is handled by Supabase onAuthStateChange in AuthProvider, which is outside this feature module. If AuthProvider fails to initialize, the auth module has no fallback. Location of AuthProvider not confirmed in this module's source. |

Sources: ARCHITECTURE.md (Module Dependency Graph, Module Runtime Readiness), INDEX.md (Engine Dependencies).

---

## §9 Must Never Happen — Security Invariants

| # | Invariant | Violated By | Status |
|---|---|---|---|
| INV-1 | A user must NEVER be able to update another user's profile during onboarding. completeOnboardingController must always reject if session.user.id !== userId. | BW adversarial test: BLOCKED (onboarding.controller.js:65-77). Regression test: MISSING. | HOLDS — no regression test |
| INV-2 | Actor creation must be owner-scoped. A user MUST NEVER create an actor row for another user's profile ID. profileId must always equal the authenticated session userId. | VEN-AUTH-006 guard: VERIFIED PRESENT (createUserActor.controller.js:26-29). Regression test: MISSING. | HOLDS — no regression test |
| INV-3 | Password update MUST NEVER succeed based on a client-forged sessionStorage nonce alone. Recovery must require a genuine server-verified recovery session origin. | VEN-AUTH-001 (HIGH, THOR BLOCKER) / ELEK-2026-06-04-001 / BW-AUTH-004 — CURRENTLY VIOLATED for the fallback path (self-exploitation confirmed, no cross-user path). | VIOLATED — THOR BLOCKER |
| INV-4 | Profile shell upsert MUST NEVER write to a profile row for a userId not derived from the authenticated session. | VEN-AUTH-004 / ELEK-2026-06-04-003 / BW-AUTH-005 — LATENT RISK. Current caller is safe (sources from getUser()). Internal function has no session cross-check. | LATENT RISK |
| INV-5 | Post-login and post-onboarding redirects MUST NEVER navigate to an external (non-same-origin) URL. | VEN-AUTH-002 / ELEK-2026-06-04-002 — PARTIALLY VIOLATED. useLogin.js has blocklist only; useAuthOnboarding.js has no blocklist. React Router implicit mitigation is not an explicit security assertion. | PARTIAL — no explicit guard |
| INV-6 | Wanders session mirror MUST NEVER inject a session for a different user into the primary Supabase client. | VEN-AUTH-003 (MITIGATED). Guard present at register.controller.js:28-31. BW-AUTH-001: isWandersFlow is client-controlled navigation state — guard is the only backstop. | HOLDS — guard present |
| INV-7 | PII (userId, email) MUST NEVER reach a live logger in production builds. | VEN-AUTH-005 / ELEK-2026-06-04-004 — PARTIALLY OPEN. Production safety depends solely on Vite build-time alias substitution (single point of failure). | PARTIAL — no runtime guard |
| INV-8 | error_description from Supabase auth callbacks MUST NEVER be exposed verbatim in production UI. | Fixed message pattern confirmed in authCallback.controller.js:43-46 and setNewPassword.controller.js:103-108. hash.get('type') intentionally excluded. | HOLDS |
| INV-9 | The recovery session MUST be invalidated after a successful password update. | BW-AUTH-003 — dalSignOutRecoverySession failure is silently swallowed. If sign-out fails, the recovery session token remains valid within its remaining lifetime. | PARTIAL — silent swallow |
| INV-10 | Actor creation MUST be idempotent. A user can never have two actor rows. | BW adversarial test: BLOCKED (createUserActor.controller.js:33-47; 23505 ignored). | HOLDS |
| INV-11 | Anonymous users MUST NEVER reach onboarding write operations (profile upsert, actor creation). | BW adversarial test: BLOCKED (onboarding.controller.js:28-35). | HOLDS |

Sources: outputs/2026/06/04/Venom (Section 10 THOR Impact, Section 7 all findings), outputs/2026/06/04/ELEKTRA (THOR Release Gate Assessment), outputs/2026/06/04/BlackWidow (Section 10 Invariant Attack Map, Section 12 THOR Impact).

---

## §10 Module Responsibilities

The following modules are documented in ARCHITECTURE.md (Layer Map) and INDEX.md. Module BEHAVIOR.md stubs exist for five of these; all stubs are STUB status (architect-derived, not fully authored).

| Module / Layer | Files | Responsibility | Behavior Stub Status |
|---|---|---|---|
| login | hooks/useLogin.js, controllers/login.controller.js, dal/login.dal.js, screens/LoginScreen.jsx | Email+password sign-in; state.from redirect (open redirect risk — see Section 6); iOS install prompt; email-confirmed + account-deleted states. Auth session hydration via ensureProfileDiscoverable on success. | STUB — modules/login/BEHAVIOR.md |
| register | hooks/useRegister.js, controllers/register.controller.js, dal/register.dal.js, screens/RegisterScreen.jsx | Email+password registration; anonymous upgrade; Wanders dual-client mirror path; consent capture. Profile shell upsert via dalUpsertRegisterProfile. | STUB — modules/register/BEHAVIOR.md |
| callback | hooks/useAuthCallback.js, controllers/authCallback.controller.js, dal/authCallback.dal.js, screens/AuthCallbackScreen.jsx | PKCE code exchange and implicit hash token session resolution. Post-callback routing (UNKNOWN — new vs returning user destination not confirmed). error_description sanitized in production. | STUB — modules/callback/BEHAVIOR.md |
| onboarding | hooks/useAuthOnboarding, useCompleteProfileGate, controllers/onboarding.controller.js, profileOnboarding.controller.js, completeProfileGate.controller.js, createUserActor.controller.js, screens/Onboarding.jsx, CompleteProfileGate.jsx | Profile completion gate; display name / username / birthdate / sex capture; actor + actor_owner creation; profile shell upsert; discoverable flag. Session-verified writes. All ownership guards present and source-verified. | STUB — modules/onboarding/BEHAVIOR.md |
| recovery | hooks/useResetPassword.js, useSetNewPassword.js, useResendVerification.js, controllers/sendResetPassword.controller.js, setNewPassword.controller.js, resendVerification.controller.js, dal/resetPassword.dal.js, emailVerification.dal.js, screens/ForgotPasswordScreen.jsx, ResetPasswordScreen.jsx, VerifyEmailRequiredScreen.jsx | Forgot-password email dispatch; set new password (PKCE code path is secure; fallback nonce path is THOR-blocked); resend email verification. Post-update session invalidation. | STUB — modules/recovery/BEHAVIOR.md |
| DAL layer | 31 DAL files | actorCreate, actorGetByProfile, actorOwnerCreate, authCallback, authSession.read, emailVerification, login, onboarding, profile, register, resetPassword (+ callgraph expansion). All write DALs are session-trusting (no session check inside DAL — controller layer is responsible). | No module BEHAVIOR.md — UNKNOWN for DAL-level specifics beyond ARCHITECT source read |
| Model layer | 12 model files | actor.model, emailVerification.model, onboarding.model, profile.model, registerPasswordRules.model. Validation: birthdate (YYYY-MM-DD, future dates rejected, isAdult computed), sex allowlist, password rules (8 char min + upper/lower/number). registerPasswordRules.model not confirmed in callgraph — may be dead or inlined (ARCHITECT). | No module BEHAVIOR.md |
| Adapter | auth.adapter.js | Exposes: useAuthOps, authTheme, CompleteProfileGate, VerifyEmailRequiredScreen, ConsentCheckbox, bootstrapJoinOnboardingController, isEmailVerifiedModel. Intentionally minimal. | No module BEHAVIOR.md |
| WelcomeScreen | screens/WelcomeScreen.jsx | Entry screen for unauthenticated users (/). CTAs: Login, Register. Purpose confirmed. | No dedicated module |

Sources: ARCHITECTURE.md (Layer Map, Module Completeness Matrix), INDEX.md (Source Inventory), all five module BEHAVIOR.md stubs.

---

## §11 Known Gaps

### UNKNOWN Items Requiring Implementation Review

1. **Section 3.3 — Username generation trigger:** generate_username RPC call timing (registration vs. onboarding) is not confirmed in governance artifacts.
2. **Section 3.7 — Onboarding step sequence:** Exact onboarding multi-step form field list is not fully confirmed (display name, username, avatar, discoverability — "UNVERIFIED step list" in module stub).
3. **Section 3.7 — Post-onboarding redirect destination:** state.from or hardcoded /feed — not confirmed in governance.
4. **Section 3.12 — Post-callback routing:** New vs. returning user discrimination logic and redirect destination after /auth/callback not confirmed.
5. **Section 3.1 / Section 4.12 — Consent checkbox enforcement:** Whether registration cannot proceed without the consent checkbox checked is not confirmed.
6. **Section 7 — AuthCallbackScreen exchange failure redirect:** Error redirect destination (to /auth/login or other) not confirmed.
7. **Section 8 — AuthProvider location:** Whether AuthProvider is inside or outside this module's source tree is not confirmed in governance.

### Missing Governance Documents

| Document | Status | Impact |
|---|---|---|
| OWNERSHIP.md | MISSING | No formal ownership record exists — ownership is implied only |
| TESTS.md | MISSING | No test governance document |
| Formal Security Audit doc (consolidated VENOM/BW/ELEKTRA) | MISSING | Findings exist only in specialist output reports |
| Runtime audit | MISSING | No runtime behavior audit document |
| Performance audit | MISSING | No performance audit document |
| Migration audit | MISSING | No migration audit document |

### Open Tickets and Blockers

| Finding | Status | Blocker Type |
|---|---|---|
| VEN-AUTH-001 / ELEK-2026-06-04-001 | OPEN | THOR BLOCKER — recovery provenance is client-side only |
| BW-AUTH-002 | UNRESOLVED | Profiles table upsert RLS not confirmed audited |
| VEN-AUTH-002 / ELEK-2026-06-04-002 | OPEN | Medium finding — open redirect dual-sink |
| VEN-AUTH-004 / ELEK-2026-06-04-003 | OPEN | Medium finding — ensureProfileShell no session cross-check |
| Wanders cross-feature import | NEEDS REVIEW | register.controller.js directly imports from features/wanders adapter |
| Route scanner gap | LOW | Auth routes not detected by route-map scanner (React Router app layer) |

### Placeholder Module Stubs

All five module BEHAVIOR.md files (login, register, callback, onboarding, recovery) are STUB status (architect-derived). None have been fully authored. Each contains open TODO items documented in Section 3 per module above.

### Test Coverage Gap

Only 1 test file exists for 56 source files: `controllers/__tests__/authCallback.controller.test.js`. Register, login, onboarding, createUserActor, and completeProfileGate are untested. This is a P1 risk for a P0-criticality module.

Sources: ARCHITECTURE.md (Module Missing Pieces, Module Build Priority), CURRENT_STATUS.md (Top gap), SECURITY.md (all open findings), all module BEHAVIOR.md stubs (TODO items), INDEX.md (Tests: 1).

---

## §12 Validation Sources

| File | Key Facts Extracted |
|---|---|
| ZZnotforproduction/APPS/VCSM/features/auth/CURRENT_STATUS.md | Architecture state STABLE; independence MOSTLY INDEPENDENT; top gap = BEHAVIOR.md is a placeholder stub; 1 test for 56 source files; recommended handoffs: LOGAN, SPIDER-MAN, VENOM, ELEKTRA, HAWKEYE |
| ZZnotforproduction/APPS/VCSM/features/auth/SECURITY.md | THOR BLOCKER: VEN-AUTH-001 / ELEK-2026-06-04-001; 7 VENOM findings (0 CRIT, 1 HIGH, 3 MED, 3 LOW); 5 ELEKTRA findings (0 CRIT, 1 HIGH, 2 MED, 2 LOW); 6 BW findings (0 CRIT, 1 HIGH, 3 MED, 2 LOW) |
| ZZnotforproduction/APPS/VCSM/features/auth/ARCHITECTURE.md | Full module architecture: purpose, ownership, 8 entry points, layer map (31 DAL, 30 controller, 15 hook, 12 model, 11 screen, 4 component, 1 adapter), module data contract (7 write surfaces), dependency graph, completeness matrix, boundary warnings, spaghetti score WATCH, recommended handoffs |
| ZZnotforproduction/APPS/VCSM/features/auth/INDEX.md | Source inventory (56 files), write surface map (7 operations), security-sensitive surfaces summary, engine dependencies, routes (0 detected by scanner; 7 known from source read), documentation links |
| ZZnotforproduction/APPS/VCSM/features/auth/modules/login/BEHAVIOR.md | Login flow, logout flow, session read pattern (getSession cached), state.from critical invariant, open redirect risk; status STUB |
| ZZnotforproduction/APPS/VCSM/features/auth/modules/register/BEHAVIOR.md | Standard registration, actor provisioning, username generation (trigger UNVERIFIED), Wanders mirror path, consent capture; status STUB |
| ZZnotforproduction/APPS/VCSM/features/auth/modules/callback/BEHAVIOR.md | Auth callback processing, post-callback routing (UNVERIFIED); status STUB |
| ZZnotforproduction/APPS/VCSM/features/auth/modules/onboarding/BEHAVIOR.md | Profile gate check, onboarding flow, profile shell upsert, onboarding completion, post-onboarding redirect (UNVERIFIED), two security gaps noted; status STUB |
| ZZnotforproduction/APPS/VCSM/features/auth/modules/recovery/BEHAVIOR.md | Forgot password, set new password, resend verification, critical security invariant (VIOLATED — THOR BLOCKER), dalSignOutRecoverySession silent swallow; status STUB |
| ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_auth-security-review.md | 7 findings with full source-verified evidence; THOR verdict BLOCKED; mitigation plan; CISSP domain coverage; source verification table for 23 files |
| ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/04/ELEKTRA/2026-06-04_23-10_elektra_auth-security-scan.md | 5 findings with full chain traces; Edge Function patch advisory for VEN-AUTH-001; open redirect dual-sink confirmation (Sink 2 in useAuthOnboarding has NO blocklist); THOR verdict BLOCKED; 5 false positives rejected with evidence |
| ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_auth-adversarial-review.md | 6 findings; adversarial path analysis for 9 attack categories; Section 9 invariant attack map; 13 SPIDER-MAN test requirements; source-verified BLOCKED findings for ownership bypass, null session, Wanders injection, actor idempotency, error_description sanitization |

---

## §13 THOR Release Status

**THOR Release Blocker:** YES

**Exact text from SECURITY.md:**
> THOR Release Blocker: YES — VEN-AUTH-001 / ELEK-2026-06-04-001

**Active THOR Blockers:**

| Blocker ID | Severity | Description | Status |
|---|---|---|---|
| VEN-AUTH-001 | HIGH | Client-side-only recovery provenance gate — supabase.auth.updateUser lacks server-side recovery session enforcement. A stolen-session attacker can silently rotate victim credentials without email notification. | OPEN |
| ELEK-2026-06-04-001 | HIGH | Same finding as VEN-AUTH-001 — full chain trace confirmation. Fallback gate uses client-forgeable UUID nonce + cached JWT (getSession, not getUser). PKCE code-based path IS secure. Recommended fix: Edge Function POST /functions/v1/reset-password using server-side exchangeCodeForSession + adminAuthClient.updateUserById. | OPEN |

**VENOM THOR verdict:** "BLOCKED — VEN-AUTH-001 must be resolved before THOR can clear auth."
**ELEKTRA THOR verdict:** "BLOCKED — ELEK-2026-06-04-001 (= VEN-AUTH-001) must be resolved before auth is THOR-eligible."
**BLACKWIDOW THOR verdict:** "No new CRITICAL or HIGH BYPASSED findings from BW pass. Existing THOR blocker (VEN-AUTH-001) confirmed open."

**Current THOR status:** BLOCKED. Auth feature is not THOR-eligible until server-side recovery provenance is implemented.

Sources: SECURITY.md (THOR Release Blocker field), outputs/2026/06/04/Venom (Section 10 THOR Impact), outputs/2026/06/04/ELEKTRA (THOR Release Gate Assessment), outputs/2026/06/04/BlackWidow (Section 12 THOR Impact).
