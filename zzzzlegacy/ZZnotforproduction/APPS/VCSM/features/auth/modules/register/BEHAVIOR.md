---
title: Register Module — Behavior
status: CURRENT
feature: auth
module: register
source: ARCHITECT-V2-source-verified
last-architect-run: 2026-06-06
---

# auth / modules / register — BEHAVIOR

## Status

CURRENT. Source-verified — 2026-06-06 ARCHITECT V2 run.

## Confirmed Behaviors

### Standard Registration (Email Confirmation Required)

1. User fills email, password, confirmPassword, checks consent checkbox
2. canSubmit gate: email non-empty AND password allValid AND passwords match AND termsAccepted AND !loading
3. handleSubmit → handleRegister()
4. Consent check: if (!termsAccepted) → set consentError, return false
5. ctrlRegisterAccount({ email, password, isWandersFlow })
6. dalReadRegisterSession → no existing session or non-anonymous user
7. dalSignUpRegisterUser → supabase.auth.signUp
8. result: no session returned (email confirmation required)
9. navigate('/verify-email', { replace: true, state: { email } })
10. Consent NOT recorded yet — deferred to post-confirmation path

### Standard Registration (Session Returned — No Email Confirmation)

1-7 same as above
8. result: session + userId returned
9. dalUpsertRegisterProfile → public.profiles upsert (id, email, created_at, updated_at)
10. recordSignupConsent({ userId }) → fetch active legal docs → insert into platform.user_consents
11. goOnboarding() → navigate('/onboarding', { replace: true, state: navState })

### Anonymous User Upgrade Path

1. dalReadRegisterSession → existing session detected
2. isAnonymousUser(session.user) === true → canUpgradeExistingSession
3. dalUpdateRegisterUser → supabase.auth.updateUser({ email, password })
4. dalUpsertRegisterProfile → public.profiles upsert
5. maybeMirrorWandersSession (if isWandersFlow)
6. return { requiresEmailConfirm: false, userId: existingUserId }
7. recordSignupConsent → navigate('/onboarding')

### Stale JWT Recovery Path

1. dalSignUpRegisterUser throws "user from sub claim in JWT does not exist"
2. isStaleJwtSubjectError(error) === true
3. dalSignOutRegisterSession (clear stale session)
4. dalSignUpRegisterUser (retry)

### Wanders Session Mirror (conditional)

- Triggered only when isWandersFlow === true (from location.state.wandersFlow)
- Uses Wanders Supabase client (separate from primary)
- maybeMirrorWandersSession: reads Wanders session, verifies session.user.id === registrationUserId
- If userId mismatch → throws Error (abort mirror)
- If match: dalMirrorWandersSessionToPrimary → supabase.auth.setSession + getSession warm
- Guard: userId match is the only safety backstop; isWandersFlow trigger is client-controlled

### Consent Recording Behavior

- Consent checkbox (termsAccepted) is a client-side UI gate only
- Server-side consent: recordSignupConsent → getActiveLegalDocuments → insert into platform.user_consents per active doc
- Consent is NOT recorded when email confirmation is required (requiresEmailConfirm === true)
- Consent is recorded immediately after session establishment (when session is returned by signUp)
- Post-email-confirm consent path: NOT audited in this scan (handled by callback flow)

### Form Validation Behavior

| Field | Client Validation | Server Validation |
|---|---|---|
| email | Non-empty, format regex, max 254 chars (validateEmail in controller) | Supabase uniqueness |
| password | 5 rules: min 8, max 72, lower, upper, number (client-only) | Supabase min (unconfirmed) |
| confirmPassword | Must match password (client-only) | Never persisted |
| termsAccepted | Must be true (handleRegister guard) | Not verified server-side |

### Navigation State Behavior

- intent query param: ?intent=profile|vport → navState.from = /welcome?intent={intent}
- invite_code query param: UUID-validated, stored as inviteCode but NEVER persisted (TODO in source)
- location.state.from: forwarded to navState.from if string, else intent-based default
- navState is passed to /onboarding → /welcome for post-onboarding redirect
- WARNING: navState.from has no path whitelist check (FINDING-HIGH-001)

### Loading / Error / Success States

- loading: true during ctrlRegisterAccount; reset in finally block
- errorMessage: set from error.message on catch; cleared on any input change
- successMessage: initialized empty; NEVER populated in register flow — dead state (FINDING-INFO-009)
- consentError: set on consent recording failure or if consent checkbox not checked; cleared on input change or checkbox toggle

### Guard Behavior (AuthPublicRoute)

- Authenticated users (user !== null) are redirected to /feed immediately
- Loading state shows spinner (not blank screen)
- Unauthenticated users see RegisterScreen
