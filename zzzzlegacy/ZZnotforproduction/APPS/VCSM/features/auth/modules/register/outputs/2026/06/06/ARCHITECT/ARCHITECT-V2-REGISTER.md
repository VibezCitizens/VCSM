---
title: ARCHITECT V2 — Register Module Audit Report
status: COMPLETE
feature: auth
module: register
run-date: 2026-06-06
source-authority: SOURCE_VERIFIED
scanner-version: V2
---

# ARCHITECT V2 — REGISTER MODULE AUDIT REPORT

**Module:** auth / modules / register
**Application:** VCSM
**Screen:** RegisterScreen.jsx
**Route:** /register
**Run Date:** 2026-06-06
**Final Status:** COMPLETE

---

## 1. PREFLIGHT

| Check | Result |
|---|---|
| Boundary contract loaded | YES |
| Application scope declared | VCSM |
| Prior reports consulted | NO — source-first run per mission directive |
| Source files read | 19 (see §2) |
| Code modified | NO |
| Evidence standard | [SOURCE_VERIFIED] for all primary chain claims |

**Scope:** RegisterScreen.jsx → useRegister.js → register.controller.js → register.dal.js → Supabase. Full cross-feature chain to legal adapter and monitoring service included.

---

## 2. SOURCE READ SUMMARY

| # | File | Layer | Evidence |
|---|---|---|---|
| 1 | apps/VCSM/src/features/auth/screens/RegisterScreen.jsx | SCREEN | [SOURCE_VERIFIED] |
| 2 | apps/VCSM/src/features/auth/hooks/useRegister.js | HOOK | [SOURCE_VERIFIED] |
| 3 | apps/VCSM/src/features/auth/controllers/register.controller.js | CONTROLLER | [SOURCE_VERIFIED] |
| 4 | apps/VCSM/src/features/auth/dal/register.dal.js | DAL | [SOURCE_VERIFIED] |
| 5 | apps/VCSM/src/features/auth/dal/login.dal.js | DAL | [SOURCE_VERIFIED] |
| 6 | apps/VCSM/src/features/auth/model/registerPasswordRules.model.js | MODEL | [SOURCE_VERIFIED] |
| 7 | apps/VCSM/src/features/auth/model/authInputValidation.model.js | MODEL | [SOURCE_VERIFIED] |
| 8 | apps/VCSM/src/features/auth/components/RegisterFormCard.jsx | COMPONENT | [SOURCE_VERIFIED] |
| 9 | apps/VCSM/src/features/auth/adapters/auth.adapter.js | ADAPTER | [SOURCE_VERIFIED] |
| 10 | apps/VCSM/src/app/routes/public/auth.routes.jsx | ROUTE | [SOURCE_VERIFIED] |
| 11 | apps/VCSM/src/app/routes/public/AuthPublicRoute.jsx | GUARD | [SOURCE_VERIFIED] |
| 12 | apps/VCSM/src/app/routes/index.jsx | ROUTE ROOT | [SOURCE_VERIFIED] |
| 13 | apps/VCSM/src/app/providers/AuthProvider.jsx | PROVIDER | [SOURCE_VERIFIED] |
| 14 | apps/VCSM/src/features/legal/adapters/legal.adapter.js | ADAPTER (cross-feature) | [SOURCE_VERIFIED] |
| 15 | apps/VCSM/src/features/legal/hooks/useSignupConsent.js | HOOK (cross-feature) | [SOURCE_VERIFIED] |
| 16 | apps/VCSM/src/features/legal/controllers/legalConsent.controller.js | CONTROLLER (cross-feature) | [SOURCE_VERIFIED] |
| 17 | apps/VCSM/src/features/legal/dal/userConsents.write.dal.js | DAL (cross-feature) | [SOURCE_VERIFIED] |
| 18 | apps/VCSM/src/services/monitoring/monitoringClient.js | SERVICE | [SOURCE_VERIFIED] |
| 19 | apps/VCSM/src/features/wanders/adapters/services/wandersSupabaseClient.adapter.js | ADAPTER (cross-feature) | [SOURCE_VERIFIED] |

---

## 3. ROUTE MAP

```
/register
  └── auth.routes.jsx → authPublicRoutes()
        └── <AuthPublicRoute>          ← Route guard
              └── <RegisterScreen />   ← Target screen

Route classification: PUBLIC (unauthenticated)
Guard behavior:       Authenticated users (user !== null) → Navigate to /feed (replace)
Guard source:         AuthPublicRoute.jsx:useAuth() → loading → user check
Loading state:        Spinner shown while auth hydration runs (not blank screen)

Post-registration branches:
  requiresEmailConfirm === true  → navigate('/verify-email', { replace: true, state: { email } })
  session active + userId        → navigate('/onboarding', { replace: true, state: navState })
```

---

## 4. LAYER MAP

```
GUARD         AuthPublicRoute.jsx             Route guard — blocks auth'd users from /register
SCREEN        RegisterScreen.jsx              Thin wrapper — renders RegisterFormCard, delegates to useRegister
COMPONENT     RegisterFormCard.jsx            Form UI — email, password, confirmPassword, consent, submit
COMPONENT     ConsentCheckbox.jsx             Legal consent checkbox (imported by RegisterFormCard)
HOOK          useRegister.js                  All form state + mutation orchestration
MODEL         registerPasswordRules.model.js  5 password rules + evaluateRegisterPasswordRules + evaluateConfirmPasswordState
MODEL         authInputValidation.model.js    validateEmail + isValidInviteCode + isSafeAuthReturnPath + mapLoginError
CONTROLLER    register.controller.js          ctrlRegisterAccount — signUp / anonymous upgrade / Wanders mirror / profile upsert
ADAPTER       wandersSupabaseClient.adapter.js Re-exports getWandersSupabase from services/wandersSupabaseClient.js
DAL           register.dal.js                 6 functions: getSession, signUp, updateUser, signOut, upsertProfile, mirrorWanders
SUPABASE      auth.getSession                 Session read (pre-signUp check)
SUPABASE      auth.signUp                     New account creation
SUPABASE      auth.updateUser                 Anonymous user upgrade path
SUPABASE      auth.signOut                    Stale JWT recovery + normal sign-out
SUPABASE      auth.setSession                 Wanders session mirror to primary client
SUPABASE      profiles.upsert                 Initial profile shell write (public schema)
CROSS-FEATURE useSignupConsent (legal)        Hook shim → recordSignupConsent (controller function)
CROSS-FEATURE legalConsent.controller.js      recordSignupConsent → getActiveLegalDocuments → recordLegalAcceptance
CROSS-FEATURE legalDocuments.read.dal.js      dalGetActiveLegalDocuments → platform.legal_documents SELECT
CROSS-FEATURE userConsents.write.dal.js       dalRecordLegalAcceptance → platform.user_consents INSERT
SERVICE       monitoringClient.js             captureFrontendError → supabase.functions.invoke('monitoring-ingest-error')
PROVIDER      AuthProvider.jsx                useAuth() → { user, loading } — session hydration source
```

---

## 5. DEPENDENCY GRAPH

```
RegisterScreen.jsx
  ├── react-router-dom (useNavigate)
  ├── @/features/auth/components/RegisterFormCard
  │     ├── lucide-react (Eye, EyeOff, CheckCircle2, XCircle)
  │     ├── react-router-dom (Link)
  │     ├── @i18n (useTranslation)
  │     └── @/features/auth/components/ConsentCheckbox
  └── @/features/auth/hooks/useRegister
        ├── react (useCallback, useMemo, useState)
        ├── react-router-dom (useLocation, useNavigate)
        ├── @/features/auth/controllers/register.controller [ctrlRegisterAccount]
        │     ├── @/features/auth/model/authInputValidation.model [validateEmail]
        │     ├── @/features/wanders/adapters/services/wandersSupabaseClient.adapter [getWandersSupabase]
        │     └── @/features/auth/dal/register.dal
        │           └── @/services/supabase/supabaseClient [supabase]
        ├── @/features/legal/adapters/legal.adapter [useSignupConsent]
        │     └── @/features/legal/hooks/useSignupConsent
        │           └── @/features/legal/controllers/legalConsent.controller [recordSignupConsent]
        │                 ├── @/features/legal/dal/legalDocuments.read.dal [dalGetActiveLegalDocuments]
        │                 │     └── @/services/supabase/supabaseClient [supabase] (platform schema)
        │                 └── @/features/legal/dal/userConsents.write.dal [dalRecordLegalAcceptance]
        │                       └── @/services/supabase/supabaseClient [supabase] (platform schema)
        ├── @/features/auth/model/registerPasswordRules.model [evaluateRegisterPasswordRules, evaluateConfirmPasswordState]
        ├── @/features/auth/model/authInputValidation.model [isValidInviteCode]
        └── @/services/monitoring/monitoringClient [captureFrontendError]
              └── @/services/supabase/supabaseClient [supabase] (functions.invoke)

AuthPublicRoute.jsx
  └── @/app/providers/AuthProvider [useAuth → { user, loading }]
        └── @/features/auth/dal/authSession.read.dal [dalHydrateAuthSession, dalSubscribeAuthStateChange]
              └── @/services/supabase/supabaseClient [supabase]

External boundary dependencies:
  supabase (primary client)     @/services/supabase/supabaseClient
  wandersSupabaseClient         @/features/wanders/services/wandersSupabaseClient
  react-router-dom
  @i18n
  lucide-react
```

---

## 6. OWNERSHIP REGISTRY

| Surface | Owner | Type | Notes |
|---|---|---|---|
| Email field value | useRegister.js (form.email) | Single | [SOURCE_VERIFIED] |
| Password field value | useRegister.js (form.password) | Single | [SOURCE_VERIFIED] |
| ConfirmPassword field value | useRegister.js (form.confirmPassword) | Single | [SOURCE_VERIFIED] |
| Consent checkbox state | useRegister.js (termsAccepted) | Single | [SOURCE_VERIFIED] |
| Consent error message | useRegister.js (consentError) | Single | [SOURCE_VERIFIED] |
| Terms link rendering | RegisterFormCard.jsx | Single (component) | Links to /legal/terms-of-service [SOURCE_VERIFIED] |
| Privacy link rendering | RegisterFormCard.jsx | Single (component) | Links to /legal/privacy-policy [SOURCE_VERIFIED] |
| Loading state | useRegister.js (loading) | Single | [SOURCE_VERIFIED] |
| Error message state | useRegister.js (errorMessage) | Single | [SOURCE_VERIFIED] |
| Success message state | useRegister.js (successMessage) | Single | Not currently set to a value in any success path — always empty [SOURCE_VERIFIED] |
| Redirect destination (post-reg) | useRegister.js (navState, intent) | Single | [SOURCE_VERIFIED] |
| Email verification branch | register.controller.js (requiresEmailConfirm) | Single (controller) | [SOURCE_VERIFIED] |
| Password rule evaluation | registerPasswordRules.model.js | Single (model) | [SOURCE_VERIFIED] |
| Confirm password evaluation | registerPasswordRules.model.js | Single (model) | [SOURCE_VERIFIED] |
| Email validation | authInputValidation.model.js → validateEmail() | Single (model) | Called in register.controller.js [SOURCE_VERIFIED] |
| invite_code validation | authInputValidation.model.js → isValidInviteCode() | Single (model) | [SOURCE_VERIFIED] |
| Wanders session mirror | register.controller.js → maybeMirrorWandersSession() | Single (controller) | [SOURCE_VERIFIED] |
| Legal consent recording | legalConsent.controller.js → recordSignupConsent() | Single (cross-feature controller) | [SOURCE_VERIFIED] |
| Monitoring emissions | useRegister.js → captureFrontendError() | Single per callsite | 2 callsites [SOURCE_VERIFIED] |
| canSubmit gate | useRegister.js | Single | Multi-condition: email + allValid + matches + termsAccepted + !loading [SOURCE_VERIFIED] |

---

## 7. DATA OWNERSHIP REGISTRY

| Field | Source | Trust Boundary | Validation Layer | Persistence Layer | Final Sink |
|---|---|---|---|---|---|
| email | User input (RegisterFormCard input[name=email]) | Untrusted client | validateEmail() in register.controller.js — normalizes, length check (max 254), format regex | dalSignUpRegisterUser → supabase.auth.signUp | auth.users.email (Supabase) |
| password | User input (RegisterFormCard input[name=password]) | Untrusted client | evaluateRegisterPasswordRules() in useRegister — CLIENT-ONLY: 8-72 chars, upper/lower/number. No controller-layer password strength check. | dalSignUpRegisterUser → supabase.auth.signUp | auth.users (hashed — Supabase) |
| confirmPassword | User input (RegisterFormCard input[name=confirmPassword]) | Untrusted client | evaluateConfirmPasswordState() — CLIENT-ONLY equality check | Never persisted | N/A |
| termsAccepted | Checkbox UI state | Client-controlled boolean | useRegister.handleRegister: if (!termsAccepted) block + consentError. NOT passed to server. | recordSignupConsent called after userId is server-confirmed | platform.user_consents (INSERT per legal doc) |
| intent | URL query param ?intent= | Client-controlled | useRegister: whitelist check (only 'profile' or 'vport' accepted; others null) | Navigation state (/welcome?intent=...) | navState.from destination |
| inviteCode | URL query param ?invite_code= | Client-controlled | isValidInviteCode() — UUID-format regex | DROPPED — never persisted [SOURCE_VERIFIED: TODO comment at useRegister.js:37] | Invite attribution NOT established |
| navState.from | location.state.from | Client-controlled (navigation state) | typeof === 'string' check only — isSafeAuthReturnPath() NOT called [FINDING-HIGH-001] | Passed via navigate('/onboarding', state) | Onboarding redirect destination |
| navState.wandersFlow | location.state.wandersFlow | Client-controlled (navigation state) | Boolean() cast only | Passed via navigate('/onboarding', state) | isWandersFlow → Wanders Supabase client selection |
| userId | Server-issued by Supabase post-signUp | Server-authoritative | Derived from authData.user.id (server) | Passed to recordSignupConsent | platform.user_consents.user_id |
| email (monitoring) | error.message string | Mixed — server error text | NOT stripped by stripPii() — raw error message sent | supabase.functions.invoke('monitoring-ingest-error') | monitoring-ingest-error Edge Function |

---

## 8. RULE OWNERSHIP REGISTRY

| Rule | Owner | Location | Enforcement Layer |
|---|---|---|---|
| Email format (regex) | authInputValidation.model.js | validateEmail() | Controller |
| Email max length 254 | authInputValidation.model.js | validateEmail() | Controller |
| Email required (non-empty) | authInputValidation.model.js | validateEmail() | Controller |
| Password min 8 chars | registerPasswordRules.model.js | PASSWORD_RULES[0] | Client-only |
| Password max 72 chars | registerPasswordRules.model.js | PASSWORD_RULES[1] | Client-only |
| Password requires lowercase | registerPasswordRules.model.js | PASSWORD_RULES[2] | Client-only |
| Password requires uppercase | registerPasswordRules.model.js | PASSWORD_RULES[3] | Client-only |
| Password requires number | registerPasswordRules.model.js | PASSWORD_RULES[4] | Client-only |
| Passwords must match | registerPasswordRules.model.js | evaluateConfirmPasswordState() | Client-only |
| Consent required before submit | useRegister.js | handleRegister() if (!termsAccepted) | Client-only |
| canSubmit multi-condition gate | useRegister.js | canSubmit computed | Client-only |
| invite_code UUID format | authInputValidation.model.js | isValidInviteCode() | Client |
| intent whitelist (profile/vport) | useRegister.js | intent useMemo | Client |
| navState.from string type check | useRegister.js | navState useMemo | Client-only (no path whitelist) |
| Wanders session userId match | register.controller.js | maybeMirrorWandersSession() | Controller |
| Stale JWT recovery | register.controller.js | isStaleJwtSubjectError() + retry | Controller |
| Anonymous user detection | register.controller.js | isAnonymousUser() | Controller |
| Monitoring self-reference guard | monitoringClient.js | isSelfReferential() | Service |
| Monitoring PII strip | monitoringClient.js | stripPii() on tags + context | Service (NOT applied to message field) |

---

## 9. MONITORING REGISTRY

| Event | Callsite | Owner | Payload Summary | PII in message? | PII in tags/context? |
|---|---|---|---|---|---|
| captureFrontendError — consentRecording | useRegister.js:150 | useRegister | feature: auth, module: useRegister, controller: register, route: /register, severity: error, is_handled: true, tags: {flow: register}, context: {stage: consentRecording}, breadcrumbs: [{type: auth, message: consent_recording_failed}] | POSSIBLE — consentErr.message is raw error; could contain internal Supabase text | NO — stripPii() applied to tags/context |
| captureFrontendError — registerSubmit | useRegister.js:169 | useRegister | feature: auth, module: useRegister, controller: register, route: /register, severity: error, is_handled: true, tags: {flow: register}, context: {stage: registerSubmit}, breadcrumbs: [{type: auth, message: register_submit_failed}] | POSSIBLE — error.message may contain Supabase server errors (e.g. email conflict text) | NO — stripPii() applied to tags/context |

**Assessment:**
- stripPii() strips: password, token, email, access_token, refresh_token, session_token, secret, credential, api_key, auth_token from object keys — applied to `tags` and `context` only [SOURCE_VERIFIED]
- `message` field is NOT passed through stripPii() — raw error.message text goes to Edge Function [FINDING-LOW-008]
- `stack` traces sent raw (no PII strip)
- Breadcrumbs sent raw — current use has no PII
- No debug/audit event bus, no Sentry SDK, no analytics events
- No password, token, or email appears in tag/context payloads [SOURCE_VERIFIED]

---

## 10. SECURITY SURFACE REGISTRY

| Surface | Auth Call Type | Client-Only | Server-Enforced | Supabase-Enforced |
|---|---|---|---|---|
| supabase.auth.signUp | Account creation | email + password inputs | Rate limiting (Supabase) | auth.users INSERT; email uniqueness |
| supabase.auth.getSession | Session read | — | Token validation | JWT verification |
| supabase.auth.updateUser | Anonymous upgrade | email + password | Requires existing session JWT | session ownership |
| supabase.auth.signOut | Session clear | scope: 'local' | — | Local session eviction |
| supabase.auth.setSession | Wanders token injection | access_token + refresh_token | userId match guard (controller) | JWT validation |
| supabase.auth.getSession (warm) | Post-mirror session warm | — | — | JWT validation |
| profiles.upsert | Profile shell write | userId, email, timestamps | NONE CONFIRMED [FINDING-MED-005] | RLS — UNVERIFIED |
| platform.user_consents.insert | Consent record write | userId (server-derived, not session-verified at DAL) | NONE CONFIRMED [FINDING-MED-004] | RLS — UNVERIFIED |
| supabase.functions.invoke monitoring-ingest-error | Error telemetry | Error payload | Edge Function validation unknown | — |
| navigate('/verify-email', state) | Redirect construction | email in location.state | — | — |
| navigate('/onboarding', state) | Post-reg redirect | navState.from (unwhitelisted path) [FINDING-HIGH-001] | — | — |

**What is client-only vs server-enforced:**
- Password strength rules (8-72 chars, complexity) → CLIENT ONLY — no server-side enforcement confirmed [FINDING-LOW-006]
- Consent requirement (termsAccepted boolean) → CLIENT ONLY gate — server records consent after session established
- navState.from redirect path → CLIENT ONLY — no isSafeAuthReturnPath() whitelist applied at register [FINDING-HIGH-001]
- isWandersFlow trigger → CLIENT ONLY (navigation state) — mitigated by controller userId match guard

---

## 11. DOCUMENTATION COVERAGE

**Module path:** ZZnotforproduction/APPS/VCSM/features/auth/modules/register/

| Document | Previous Status | New Status (this run) |
|---|---|---|
| ARCHITECTURE.md | STUB | UPDATED — full replacement |
| BEHAVIOR.md | STUB | UPDATED — full replacement |
| SECURITY.md | STUB | UPDATED — full replacement with new findings |
| INDEX.md | STUB | UPDATED — full replacement |
| CURRENT_STATUS.md | MISSING | CREATED |

---

## 12. FINDINGS

### FINDING-HIGH-001 — navState.from Not Whitelist-Validated (Open Redirect Risk)

| Field | Value |
|---|---|
| ID | FINDING-HIGH-001 |
| Severity | HIGH |
| Surface | useRegister.js:53 → navState.from → navigate('/onboarding', state) |
| Evidence | [SOURCE_VERIFIED] useRegister.js line 50-56: state.from checked only for typeof === 'string'; isSafeAuthReturnPath() defined in authInputValidation.model.js but NOT called in this hook |
| Description | navState.from is derived from location.state.from with only a string type check. The isSafeAuthReturnPath() whitelist function exists in authInputValidation.model.js but is not called here. navState is forwarded to /onboarding via navigate() location state. If the onboarding controller uses navState.from as a post-onboarding redirect destination without its own whitelist validation, an attacker who injects location.state.from can redirect the user to an arbitrary path after registration completes. |
| Attack Vector | Attacker crafts a navigation event to /register with state.from set to a malicious path. User completes registration. Onboarding redirects to attacker-controlled path. |
| Status | OPEN |
| THOR | CAUTION — requires downstream trace of onboarding redirect handling |

---

### FINDING-MED-002 — inviteCode Captured But Never Recorded

| Field | Value |
|---|---|
| ID | FINDING-MED-002 |
| Severity | MEDIUM |
| Surface | useRegister.js:40-43 → inviteCode state (never passed to controller) |
| Evidence | [SOURCE_VERIFIED] TODO comment at useRegister.js:37-43; inviteCode is not in ctrlRegisterAccount call at line 128 |
| Description | invite_code is validated (UUID-format check enforced) and stored in hook state but never passed to the controller, any DAL, or any server-side record. Invite attribution to the inviter actor is never established. The invite is silently discarded. |
| Status | OPEN — feature incomplete |
| THOR | Not blocked (feature gap, not a security regression) |

---

### FINDING-MED-003 — console.error Leaks Consent Error to Browser Console

| Field | Value |
|---|---|
| ID | FINDING-MED-003 |
| Severity | MEDIUM |
| Surface | useRegister.js:146 → console.error('[Register] Failed to record legal consent:', consentErr) |
| Evidence | [SOURCE_VERIFIED] useRegister.js line 146 — no DEV guard |
| Description | console.error is called unconditionally in production. consentErr may contain internal Supabase error details including table names, constraint names, or other infrastructure details. This violates the project's no-console.log rule and exposes internal error details in browser console in production. |
| Status | OPEN |
| THOR | Not blocked |

---

### FINDING-MED-004 — platform.user_consents userId Not Session-Verified at DAL

| Field | Value |
|---|---|
| ID | FINDING-MED-004 |
| Severity | MEDIUM |
| Surface | userConsents.write.dal.js:33 → platform.user_consents INSERT with client-supplied userId |
| Evidence | [SOURCE_VERIFIED] userConsents.write.dal.js:33 — userId is an INSERT column; RLS policy for platform.user_consents not confirmed in source reads |
| Description | The consent DAL inserts userId directly. userId is derived from result.userId (server-issued), but the DAL itself does not verify that userId === auth.uid() at insert time. If RLS on platform.user_consents is missing or misconfigured, a call with a forged userId could insert consent records for another user. Severity depends entirely on RLS — if RLS enforces user_id = auth.uid() the risk is low. |
| Status | OPEN — RLS unconfirmed |
| THOR | Not blocked pending DB audit |

---

### FINDING-MED-005 — profiles Table RLS for Upsert Unverified

| Field | Value |
|---|---|
| ID | FINDING-MED-005 |
| Severity | MEDIUM |
| Surface | register.dal.js:48 → supabase.from('profiles').upsert(payload) |
| Evidence | [SOURCE_VERIFIED] register.dal.js:48 — no confirmed RLS policy for INSERT/UPSERT on profiles table from any source read |
| Description | The register DAL upserts a profile shell with userId and email. If profiles table RLS INSERT/UPSERT policy is missing or misconfigured, a caller could upsert a profile shell for a foreign userId. This finding is inherited from BW-AUTH-002 (prior session STUB). |
| Status | OPEN — RLS unconfirmed (inherited BW-AUTH-002) |
| THOR | Not blocked pending DB audit |

---

### FINDING-LOW-006 — Password Rules Are Client-Side Only

| Field | Value |
|---|---|
| ID | FINDING-LOW-006 |
| Severity | LOW |
| Surface | registerPasswordRules.model.js — all 5 rules evaluated client-side; register.controller.js has no password strength check |
| Evidence | [SOURCE_VERIFIED] register.controller.js validates email via validateEmail() but passes password directly to dalSignUpRegisterUser — no controller-layer strength check |
| Description | Password complexity rules (8-72 chars, uppercase, lowercase, number) are enforced only in the UI. Supabase enforces its own minimum (typically 6 chars by default) but VCSM's rules are not enforced server-side. A client bypassing the form can submit a non-compliant password. |
| Status | OPEN — low risk (Supabase provides baseline) |
| THOR | Not blocked |

---

### FINDING-LOW-007 — isWandersFlow From Client-Controlled Navigation State

| Field | Value |
|---|---|
| ID | FINDING-LOW-007 |
| Severity | LOW (MITIGATED) |
| Surface | useRegister.js:59 → isWandersFlow = Boolean(navState.wandersFlow) → register.controller.js → Wanders client selection |
| Evidence | [SOURCE_VERIFIED] useRegister.js:59; register.controller.js:21-42 (userId match guard) |
| Description | isWandersFlow is derived from client-controlled location.state.wandersFlow. An attacker could inject this to force Wanders client selection during registration. The userId match guard in maybeMirrorWandersSession() mitigates the risk — if the Wanders session userId does not match the newly-registered userId, the mirror aborts with an error. MITIGATED — but guard must not regress. |
| Status | MITIGATED — regression coverage required |
| THOR | Not blocked |

---

### FINDING-LOW-008 — Monitoring message Field Not PII-Stripped

| Field | Value |
|---|---|
| ID | FINDING-LOW-008 |
| Severity | LOW |
| Surface | monitoringClient.js:43 → message field → monitoring-ingest-error Edge Function |
| Evidence | [SOURCE_VERIFIED] monitoringClient.js:43 — message derived from error.message, not passed through stripPii() |
| Description | stripPii() is applied to tags and context objects but not to the message field. Supabase error messages can in some error conditions include email addresses or other identifiers (e.g., "User with email X already exists"). The message is trimmed to 500 chars but not scrubbed. |
| Status | OPEN — low risk; depends on Supabase error verbosity |
| THOR | Not blocked |

---

### FINDING-INFO-009 — successMessage Never Populated in Register Flow

| Field | Value |
|---|---|
| ID | FINDING-INFO-009 |
| Severity | INFO |
| Surface | useRegister.js (successMessage state) + RegisterFormCard.jsx (successMessage display) |
| Evidence | [SOURCE_VERIFIED] useRegister.js — setSuccessMessage never called with a non-empty string in any success branch; handleRegister navigates on success |
| Description | successMessage state is initialized to '' and the RegisterFormCard renders a success div when it is truthy. However, no success path in handleRegister calls setSuccessMessage — on success, the hook immediately navigates. The successMessage surface is dead UI. |
| Status | INFO — dead state, not a bug |
| THOR | Not blocked |

---

### FINDING-INFO-010 — inviteCode UUID Validation Is Sound

| Field | Value |
|---|---|
| ID | FINDING-INFO-010 |
| Severity | INFO |
| Surface | authInputValidation.model.js → isValidInviteCode() |
| Evidence | [SOURCE_VERIFIED] UUID regex: /^[0-9a-f]{8}-[0-9a-f]{4}-...-[0-9a-f]{12}$/i |
| Description | Only UUID-format invite codes are accepted; all others become null. Validation is sound for the format check. The unresolved gap is attribution (FINDING-MED-002) — not validation. |
| Status | VERIFIED SAFE |
| THOR | N/A |

---

### FINDING-INFO-011 — Consent Deferred Correctly When Email Verification Required

| Field | Value |
|---|---|
| ID | FINDING-INFO-011 |
| Severity | INFO |
| Surface | useRegister.js:135-136 (requiresEmailConfirm path) → consent NOT recorded |
| Evidence | [SOURCE_VERIFIED] useRegister.js:135-163 — consent recording only happens when userId is server-confirmed and session is active |
| Description | When email confirmation is required (no session yet), consent is not recorded and the user is redirected to /verify-email. Consent recording after email confirmation is handled elsewhere (post-callback path — not verified in this scan). This deferral is architecturally correct — you cannot record consent for an unverified user. |
| Status | VERIFIED CORRECT — post-callback consent path not audited here |
| THOR | N/A |

---

### FINDING-INFO-012 — Stale JWT Recovery Pattern

| Field | Value |
|---|---|
| ID | FINDING-INFO-012 |
| Severity | INFO |
| Surface | register.controller.js:48-62 → isStaleJwtSubjectError() → signOut + retry |
| Evidence | [SOURCE_VERIFIED] register.controller.js:48-62 |
| Description | Controller handles "user from sub claim in JWT does not exist" by signing out the stale session and retrying signUp. This is a defensive pattern for Supabase edge cases. No security concern — the sign-out happens before re-attempting registration. |
| Status | VERIFIED SAFE |
| THOR | N/A |

---

## 13. GOVERNANCE CLASSIFICATION

| Finding | Severity | THOR Status | Next Command |
|---|---|---|---|
| FINDING-HIGH-001 — navState.from no whitelist | HIGH | CAUTION | ELEKTRA (redirect chain trace), BLACKWIDOW |
| FINDING-MED-002 — inviteCode dropped | MEDIUM | Not blocked | IRONMAN (feature ownership) |
| FINDING-MED-003 — console.error production | MEDIUM | Not blocked | WOLVERINE (quick fix) |
| FINDING-MED-004 — user_consents userId not session-verified | MEDIUM | Not blocked | DB (RLS audit) |
| FINDING-MED-005 — profiles RLS unverified | MEDIUM | Not blocked | DB (RLS audit) — inherited BW-AUTH-002 |
| FINDING-LOW-006 — password rules client-only | LOW | Not blocked | INFO |
| FINDING-LOW-007 — isWandersFlow client-controlled | LOW (MITIGATED) | Not blocked | SPIDER-MAN (regression test) |
| FINDING-LOW-008 — monitoring message not PII-stripped | LOW | Not blocked | ELEKTRA (PII scan) |
| FINDING-INFO-009 — successMessage dead state | INFO | N/A | — |
| FINDING-INFO-010 — inviteCode validation sound | INFO | N/A | — |
| FINDING-INFO-011 — consent deferred correctly | INFO | N/A | — |
| FINDING-INFO-012 — stale JWT recovery | INFO | N/A | — |

---

## 14. RUNTIME OWNERSHIP MAP

| Runtime Concern | Owner | Location |
|---|---|---|
| Session hydration | AuthProvider.jsx | Provider — outside register module |
| Auth state listener | AuthProvider.jsx | dalSubscribeAuthStateChange |
| Route guard (auth'd users) | AuthPublicRoute.jsx | useAuth().user check |
| Form state lifecycle | useRegister.js | useState hooks |
| Supabase client (primary) | supabaseClient.js | Singleton — shared across app |
| Supabase client (Wanders) | wandersSupabaseClient.js | Separate client — Wanders-scoped |
| Legal document cache | legalConsent.controller.js | 60s TTL cache (legalDocsCache) |
| Consent cache | legalConsent.controller.js | 90s TTL cache (consentCache) |
| Monitoring dispatch | monitoringClient.js | Fire-and-forget (never throws) |
| Post-registration navigation | useRegister.js → goOnboarding() | navigate('/onboarding', replace:true) |
| Email verification navigation | useRegister.js → handleRegister() | navigate('/verify-email', replace:true) |

---

## 15. OPEN QUESTIONS

| # | Question | Priority |
|---|---|---|
| Q1 | Does onboarding.controller.js apply isSafeAuthReturnPath() to navState.from before using it as a redirect destination? | HIGH — resolves FINDING-HIGH-001 severity |
| Q2 | What is the RLS policy on platform.user_consents for INSERT? Does it enforce user_id = auth.uid()? | HIGH — resolves FINDING-MED-004 |
| Q3 | What is the RLS policy on public.profiles for UPSERT? | HIGH — resolves FINDING-MED-005, BW-AUTH-002 |
| Q4 | Is consent recorded after email verification completes (callback path)? Which controller handles this? | MEDIUM — FINDING-INFO-011 partial |
| Q5 | Does Supabase enforce any password complexity beyond minimum length for this project? | LOW — resolves FINDING-LOW-006 |
| Q6 | What is the invite flow design? Is inviteCode recording planned? | LOW — FINDING-MED-002 |

---

## 16. CONFIDENCE SUMMARY

| Area | Confidence | Evidence |
|---|---|---|
| Screen → Hook call chain | VERY HIGH | All files source-read |
| Hook → Controller → DAL chain | VERY HIGH | All files source-read |
| Legal consent cross-feature chain | VERY HIGH | All files source-read |
| Monitoring chain | VERY HIGH | monitoringClient.js source-read |
| Route guard behavior | VERY HIGH | AuthPublicRoute.jsx + auth.routes.jsx source-read |
| profiles RLS policy | UNKNOWN | DB layer not audited in this scan |
| platform.user_consents RLS | UNKNOWN | DB layer not audited in this scan |
| Post-onboarding redirect handling | LOW | onboarding.controller.js not read |
| Post-callback consent recording | LOW | authCallback.controller.js not read in this scan |
| Supabase server-side password enforcement | UNKNOWN | Supabase config not reviewed |

**Overall confidence:** HIGH for the client-side chain; UNKNOWN for server-side enforcement (DB/RLS/Supabase config).

---

## 17. RECOMMENDED FOLLOW-UP COMMANDS

| Command | Scope | Priority | Reason |
|---|---|---|---|
| IRONMAN | inviteCode ownership; navState.from in onboarding | HIGH | Resolves FINDING-HIGH-001 (redirect chain) and FINDING-MED-002 (feature ownership) |
| VENOM | navState.from open redirect; user_consents userId trust; profiles RLS | HIGH | Trust boundary review for FINDING-HIGH-001, MED-004, MED-005 |
| BLACKWIDOW | navState.from injection end-to-end; Wanders isWandersFlow manipulation | HIGH | Adversarial runtime verification of FINDING-HIGH-001 and FINDING-LOW-007 |
| ELEKTRA | navState.from redirect chain; monitoring message PII; user_consents INSERT chain | HIGH | Precision patch analysis for FINDING-HIGH-001, LOW-008; profiles RLS source-to-sink |
| SPIDER-MAN | Wanders userId mismatch regression; navState.from whitelist regression | MEDIUM | Regression coverage for FINDING-LOW-007 (MITIGATED) and post-fix FINDING-HIGH-001 |
| LOKI | register flow request trace; monitoring-ingest-error Edge Function behavior | MEDIUM | Runtime observability — verify monitoring events reach Edge Function correctly |
| DB | profiles UPSERT RLS; platform.user_consents INSERT RLS | HIGH | Resolves FINDING-MED-004 and FINDING-MED-005 |

---

## FINAL STATUS

**COMPLETE**

Sources read: 19 files
Findings: 12 (1 HIGH, 4 MEDIUM, 3 LOW, 4 INFO)
Documentation updated: 5 files (ARCHITECTURE.md, BEHAVIOR.md, SECURITY.md, INDEX.md, CURRENT_STATUS.md)
Evidence bundle: evidence-bundle.json + evidence-bundle.md

ARCHITECT recommendation: **CAUTION** (FINDING-HIGH-001 requires downstream trace before this module can receive a clean release gate)
