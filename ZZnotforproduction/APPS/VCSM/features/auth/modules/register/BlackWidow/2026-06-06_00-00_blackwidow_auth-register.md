---
title: BLACKWIDOW — auth / modules / register
date: 2026-06-06
reviewer: BLACKWIDOW
scope: VCSM:auth:register
venom-run: 2026-06-06
architect-run: 2026-06-06
governance-status: DRAFT
recommendation: CAUTION
---

# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-06-06
**Scope:** VCSM:auth:register — /register
**Application Scope:** VCSM
**Reviewer:** BLACKWIDOW
**Environment:** Source simulation — non-destructive, ethical, sandboxed, repository-scoped
**Governance Status:** DRAFT

---

## BLACKWIDOW PREFLIGHT PASS

```
Upstream Report:
- VENOM: ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/06/Venom/2026-06-06_00-00_venom_auth-register.md
  Scope: VCSM:auth:register
  Date: 2026-06-06
  Status: COMPLETE (SUCCESS)
  Age: 0 days

ARCHITECT Evidence Bundle:
- ZZnotforproduction/APPS/VCSM/features/auth/modules/register/outputs/2026/06/06/ARCHITECT/evidence-bundle.json
  Run: 2026-06-06
  Status: COMPLETE
  Source Files: 19

Proceeding with BLACKWIDOW adversarial review.
```

---

## SOURCE READ SUMMARY

**Full Rediscovery Performed:** NO

ARCHITECT evidence bundle (2026-06-06) and VENOM report (2026-06-06) consumed. All call chains, trust boundaries, and security surfaces are FRESH (same session). Source provenance: SOURCE_VERIFIED across 19 files. BLACKWIDOW operates as the adversarial layer — extending VENOM by simulating hostile runtime behavior, not re-running static analysis.

---

## BEHAVIOR CONTRACT PREFLIGHT

```
Behavior Contract Attack Summary
=================================
BEHAVIOR.md exists: YES
BEHAVIOR.md status: CURRENT (source-verified 2026-06-06)
§4 Failure Paths formally declared: NO — no formal §4 section
§4 Paths attack-verified: N/A — implicit paths attacked
§4 Paths unhandled (FAILURE_PATH_UNHANDLED): NONE confirmed
§9 Must Never Happen formally declared: NO — no formal §9 section
§9 Invariants attacked: 5 IMPLICIT_INVARIANTs constructed and attacked
§9 Result — BLOCKED: IMPLICIT-002, IMPLICIT-004
§9 Result — BYPASSED: IMPLICIT-003 (PARTIAL — navState.from path forwarded without whitelist)
§9 Result — PARTIAL: IMPLICIT-005 (console.error disclosure confirmed)
§9 Result — NOT ATTACKED (gap): NONE
```

### IMPLICIT_INVARIANTs Constructed

| ID | Invariant | Source |
|---|---|---|
| IMPLICIT-001 | Registration must never associate a userId that does not match the registering user's email | auth.signUp response is server-issued — controller-derived |
| IMPLICIT-002 | A Wanders session mirror must never inject tokens belonging to a different user into the primary client | register.controller.js:maybeMirrorWandersSession |
| IMPLICIT-003 | navState.from must never redirect the user to an unwhitelisted path after registration/onboarding | useRegister.js:50-56 — VEN-REG-001 |
| IMPLICIT-004 | Already-authenticated users must never be permitted to re-register | AuthPublicRoute.jsx — user guard |
| IMPLICIT-005 | Internal system error details must never be exposed in the browser console in production | useRegister.js:146 — VEN-REG-004 |

**Governance note:** BEHAVIOR.md lacks formal §4/§9 sections — see BW-REG-008 (MEDIUM governance finding).

---

## ATTACK SURFACE SUMMARY

| Surface | Attack Type | Result |
|---|---|---|
| navState.from (useRegister.js:50-56) | State injection → redirect path forward | PARTIAL |
| maybeMirrorWandersSession (register.controller.js:29) | Session token injection with mismatched userId | BLOCKED |
| AuthPublicRoute.jsx | Authenticated user re-registration bypass | BLOCKED |
| handleRegister() (useRegister.js) | Double-submit race via rapid form submission | PARTIAL |
| console.error (useRegister.js:146) | Trigger consent failure, read browser console | BYPASSED |
| registerPasswordRules.model.js | Direct Supabase SDK call bypassing UI validation | PARTIAL |
| Supabase auth.signUp email normalization | Submit pre-normalized email variants for account confusion | BLOCKED |

---

## SIMULATED THREAT SCENARIOS

### Scenario A — navState.from Redirect Path Injection

**Attacker:** An actor within the running SPA who can trigger a navigate() call to /register with arbitrary state.from.

**Vector:** From within the SPA, any link or programmatic navigate() call can pass location.state to the target route. React Router navigation state is not URL-accessible — the attacker must be inside the running SPA. However, crafted deep links that open the SPA and drive initial navigation CAN set state on the first route transition.

**Harness simulation:**
```javascript
// Adversarial navigate() call from within SPA
navigate('/register', {
  state: { from: 'https://evil.example.com/phish' }
  // OR: state: { from: '/some-unwhitelisted-internal-path' }
});
// useRegister.js:50-56:
// const navState = { from: typeof state.from === 'string' ? state.from : null }
// → navState.from = 'https://evil.example.com/phish' — accepted, typeof is 'string'
// → isSafeAuthReturnPath() NOT called — no whitelist applied
// → navigate('/onboarding', { state: navState }) — injected path forwarded
```

**Evidence:** [SOURCE_VERIFIED] useRegister.js:50-56 — `typeof state.from === 'string'` is the only check. isSafeAuthReturnPath() defined in authInputValidation.model.js with correct whitelist — never called for navState.from.

**Result:** PARTIAL — injection lands in the hook without validation. Whether the post-onboarding redirect fires against this path depends on the onboarding controller — ELEKTRA must trace this downstream. Within the register module itself: the injected path is accepted and forwarded.

---

### Scenario B — Wanders Session Token Injection with Mismatched userId

**Attacker:** Navigate to /register with state.wandersFlow = true while a stale Wanders session (belonging to user-A) is present in the Wanders Supabase client, then complete registration as user-B.

**Vector:** isWandersFlow = Boolean(location.state.wandersFlow) — client-controlled. Force Wanders client path. If Wanders session userId ≠ newly registered userId, attempt session overwrite.

**Harness simulation:**
```javascript
// 1. Set state.wandersFlow = true in navigate() call
// 2. Registration completes → userId = 'user-B-uuid' (server-issued)
// 3. maybeMirrorWandersSession(wandersClient, 'user-B-uuid') called
// 4. reads Wanders session → session.user.id = 'user-A-uuid'
// 5. Guard: if (wandersSession.user.id !== expectedUserId) throw Error('...')
// → THROWS: 'user-A-uuid' !== 'user-B-uuid'
// → mirror aborted, no tokens injected
```

**Evidence:** [SOURCE_VERIFIED] register.controller.js — maybeMirrorWandersSession userId match guard confirmed. Guard position: before setSession() call.

**Result:** BLOCKED — userId match guard fires before any token injection occurs.

---

### Scenario C — Authenticated User Re-Registration Bypass

**Attacker:** Navigate directly to /register while holding an active Supabase session to attempt re-registration or session clobbering.

**Vector:** Direct URL navigation to /register with active session.

**Harness simulation:**
```javascript
// Authenticated user (user !== null) navigates to /register
// AuthPublicRoute.jsx:
// if (loading) return <Spinner />
// if (user) return <Navigate to="/feed" replace />
// → Redirect fires — RegisterScreen never renders
// → useRegister never mounts — form state never initializes
```

**Evidence:** [SOURCE_VERIFIED] AuthPublicRoute.jsx — authenticated redirect to /feed confirmed. Loading spinner handles the brief loading state (no blank-screen flash that could be exploited).

**Result:** BLOCKED — AuthPublicRoute fires before RegisterScreen renders.

---

### Scenario D — Double-Submit Race via Rapid Form Submission

**Attacker:** Submit the registration form twice before the `loading` state update propagates to disable the submit button.

**Vector:** Two rapid form submit events, or programmatic double-submission.

**Harness simulation:**
```javascript
// React event model: click events are sequential in the JS event queue
// handleRegister() is called → setLoading(true) (synchronous React setState call)
// BUT: React batches state updates — canSubmit re-evaluates only on next render
// Second submit via normal UI: BLOCKED (button type="submit" fires form.onSubmit once per event)
// Second submit via script: setLoading(true) is called immediately,
//   but the computed `!loading` in canSubmit still reflects old state
//   until the microtask queue flushes (React re-render)
// In practice: two simultaneous calls to handleRegister() before first re-render
//   would each pass the loading check — both would call ctrlRegisterAccount
//   → first signUp succeeds; second signUp gets "email already in use" error
//   → no privilege escalation; only UX confusion
```

**Evidence:** [SOURCE_VERIFIED] useRegister.js — setLoading called at top of handleRegister; canSubmit includes !loading; submit button disabled when loading. Normal double-submit is BLOCKED. Adversarial harness-level injection results in PARTIAL (second call errors on duplicate email — no security impact).

**Result:** PARTIAL — narrow race window under adversarial harness injection; second signUp call rejected by Supabase uniqueness constraint. No security impact — both calls belong to the attacker's own registration attempt.

---

### Scenario E — console.error Supabase Error Disclosure

**Attacker:** Trigger consent recording failure (e.g., by having network interruption during legal consent write, or if platform.user_consents is empty of active legal docs).

**Vector:** Open browser DevTools → trigger registration → interrupt consent recording → read console.

**Harness simulation:**
```javascript
// Registration succeeds → ctrlRegisterAccount returns userId
// recordSignupConsent called → dalGetActiveLegalDocuments fails (network error or empty result)
// OR dalRecordLegalAcceptance INSERT returns error (RLS rejection)
// catch block in useRegister.js:146:
//   console.error('[Register] Failed to record legal consent:', consentErr)
//   → consentErr = { message: 'relation "platform.user_consents" does not exist', code: '42P01', details: '...', hint: '...' }
//   → OR: { message: 'new row violates row-level security policy', code: '42501' }
// DevTools console: full error object visible, no DEV guard
```

**Evidence:** [SOURCE_VERIFIED] useRegister.js:146 — console.error fires unconditionally without `import.meta.env.DEV` guard. Error object passed directly to console.error contains raw Supabase error fields.

**Result:** BYPASSED — error details appear in browser console in production. Internal schema/policy names and Supabase error codes exposed. captureFrontendError() already handles server-side monitoring — console.error is purely redundant and insecure.

**VENOM Cross-Reference:** VEN-REG-004 (MEDIUM) — CONFIRMED by BLACKWIDOW.

---

### Scenario F — Password Complexity Bypass via Direct Supabase SDK Call

**Attacker:** Register using the Supabase client SDK directly, bypassing the VCSM UI entirely.

**Vector:** Direct call: `supabase.auth.signUp({ email: 'x@example.com', password: 'aaaaaa' })`

**Harness simulation:**
```javascript
// No VCSM UI involved — direct Supabase SDK usage
// supabase.auth.signUp({ email: 'test@example.com', password: 'aaa' })
// → Supabase checks: project-configured minimum password length (default: 6 chars in many projects)
// → If project minimum is 6: 'aaa' rejected by Supabase
// → If project minimum is 8: 'aaaaaaaa' accepted (complexity rules NOT enforced server-side)
// VCSM password rules (uppercase, lowercase, number) are UI-only — Supabase does not know them
// → Attacker registers with a password of 'aaaaaaaa' — meets Supabase minimum but violates VCSM rules
```

**Evidence:** [SOURCE_VERIFIED] registerPasswordRules.model.js — all 5 rules client-side; register.controller.js — validateEmail() called, no password complexity check; DAL passes password directly to auth.signUp.

**Result:** PARTIAL — password format bypass succeeds for the attacker's own account only. No privilege escalation. Blast radius: attacker's own account has weaker password than VCSM policy requires.

**VENOM Cross-Reference:** VEN-REG-006 (LOW) — CONFIRMED by BLACKWIDOW.

---

### Scenario H — Email Normalization Collision

**Attacker:** Attempt to register 'User@Example.COM' as a separate account from 'user@example.com'.

**Vector:** Submit email with mixed case or trailing whitespace.

**Harness simulation:**
```javascript
// register.controller.js validates email via validateEmail()
// authInputValidation.model.js: validateEmail → normalizeEmail(email)
// normalizeEmail: email.trim().toLowerCase()
// → 'User@Example.COM' → 'user@example.com' (normalized before Supabase call)
// Supabase also normalizes — duplicate email rejected at auth layer
```

**Evidence:** [SOURCE_VERIFIED] authInputValidation.model.js — normalizeEmail applies .trim().toLowerCase() before validation and before the DAL call. Email collision attack blocked at controller layer.

**Result:** BLOCKED — email normalization prevents account collision via case manipulation.

---

## OWNERSHIP BYPASS RESULTS

```
OWNERSHIP BYPASS ATTEMPT
Target: public.profiles upsert / platform.user_consents insert
Attack vector: Caller-provided userId from client vs. server-issued
Result: BLOCKED (at application layer — userId derives from auth.signUp response, not caller input)
Evidence: [SOURCE_VERIFIED] register.controller.js — userId = result.data.user.id (server-issued); no client path to inject foreign userId
Controller gate: PRESENT (application layer) | RLS: UNVERIFIED (DB layer — VEN-REG-002, VEN-REG-003)
Severity: MEDIUM (RLS unverified — application layer protection is correct but unverified at DB layer)
```

---

## SESSION MUTATION RESULTS

```
SESSION MUTATION ATTEMPT — Wanders Mirror
Target: dalMirrorWandersSessionToPrimary → supabase.auth.setSession
Attack vector: Force isWandersFlow=true with stale Wanders session (foreign userId)
Result: BLOCKED — userId match guard in maybeMirrorWandersSession throws before setSession()
Evidence: [SOURCE_VERIFIED] register.controller.js:29 — guard verified
Session binding: ENFORCED (userId match guard)
Severity: LOW (MITIGATED)

SESSION MUTATION ATTEMPT — Double-submit race
Target: handleRegister() → ctrlRegisterAccount
Attack vector: Two rapid submit events before loading state update
Result: PARTIAL — narrow adversarial harness window; second signUp rejects on duplicate email
Evidence: [SOURCE_VERIFIED] useRegister.js — setLoading called synchronously at top of handleRegister
Session binding: ENFORCED (Supabase uniqueness constraint backstop)
Severity: LOW
```

---

## RUNTIME ABUSE RESULTS

```
RUNTIME ABUSE ATTEMPT — AuthPublicRoute bypass
Target: /register — RegisterScreen render
Actor role used: Authenticated Citizen (user !== null)
Expected access: DENIED
Result: DENIED — AuthPublicRoute Navigate to /feed fires
Evidence: [SOURCE_VERIFIED] AuthPublicRoute.jsx — if (user) → Navigate to /feed replace
Privilege gate: PRESENT (AuthPublicRoute)
Severity: INFO

RUNTIME ABUSE ATTEMPT — console.error production disclosure
Target: useRegister.js:146 → browser console
Actor role used: Any user who triggers consent recording failure
Expected access: No internal details in production console
Result: ALLOWED — console.error fires unconditionally
Evidence: [SOURCE_VERIFIED] useRegister.js:146 — no DEV guard
Privilege gate: ABSENT
Severity: MEDIUM
```

---

## RLS VERIFICATION RESULTS

```
RLS VERIFICATION ATTEMPT — public.profiles UPSERT
Table: public.profiles
Attack vector: Application layer supplies server-issued userId — correct; RLS policy existence unverified
RLS status: ASSUMED — no DB audit performed
Result: BLOCKED at app layer; DB layer UNRESOLVED
Evidence: [SOURCE_VERIFIED] register.dal.js:48 — upsert with server-issued userId; RLS policy unconfirmed
Severity: MEDIUM (VEN-REG-002 confirmed — UNRESOLVED)

RLS VERIFICATION ATTEMPT — platform.user_consents INSERT
Table: platform.user_consents
Attack vector: user_id from server-issued userId — correct; RLS policy existence unverified
RLS status: ASSUMED — no DB audit performed
Result: BLOCKED at app layer; DB layer UNRESOLVED
Evidence: [SOURCE_VERIFIED] userConsents.write.dal.js:33 — insert with server-issued userId; RLS policy unconfirmed
Severity: MEDIUM (VEN-REG-003 confirmed — UNRESOLVED)
```

---

## VIEWER CONTEXT FUZZ RESULTS

```
VIEWER CONTEXT FUZZ ATTEMPT — null viewerActorId
Target: register flow — no actorId in scope at registration time
Injected context: N/A — registration creates identity, does not consume actorId
Expected result: N/A — registration is pre-actor; actorId not used
Actual result: CLEAN — no actorId in registration flow
Context validation: N/A — identity established during this flow
Severity: INFO
```

---

## MUTATION REPLAY RESULTS

---

## AUTH CALLBACK REPLAY RESULTS

```
AUTH CALLBACK REPLAY ATTEMPT — email confirmation link replay
Target: /verify-email → /auth/callback flow
Attack vector: Replay consumed email confirmation link
Code single-use: Enforced by Supabase (OTP/magic link codes are single-use)
Result: BLOCKED — Supabase enforces single-use codes at auth layer
Evidence: Supabase auth infrastructure — out of scope for this module; INFERRED from platform standard
Severity: INFO
```

---

## URL SURFACE RESULTS

```
URL SURFACE TEST — /register route
Route: /register?intent=&citizen_invite_code=
UUID exposure: ABSENT (citizen_invite_code is persisted to user_metadata, not exposed in public actor URLs — TICKET-INVITE-ATTRIBUTION-001 IMPLEMENTED)
Slug enforcement: N/A for registration route — no actor identity in URL
Severity: INFO

URL SURFACE TEST — post-registration navigation state
Route: navState.from (React Router location.state)
UUID exposure: ABSENT (path string, not UUID)
Slug enforcement: NOT ENFORCED (path whitelist absent — VEN-REG-001 / BW-REG-001)
Severity: HIGH
```

---

## SUCCESSFUL EXPLOIT CHAINS

### Chain 1 — navState.from State Injection → Unvalidated Redirect Forward (PARTIAL)

```
Vector: navigate('/register', { state: { from: '/unwhitelisted-path' } })
         ↓
useRegister.js:50-56 — typeof check only — navState.from = '/unwhitelisted-path'
         ↓
navigate('/onboarding', { state: navState }) — injected path forwarded
         ↓
Post-onboarding redirect fires against navState.from (ELEKTRA must confirm)
Exploit Chain Type: Injection exploit (client state parameter accepted as redirect authority)
Result: PARTIAL (register module confirmed; onboarding downstream UNRESOLVED)
Severity: HIGH
```

### Chain 2 — console.error Production Disclosure (BYPASSED)

```
Vector: Trigger consent recording failure (network drop, RLS rejection, empty legal_documents)
         ↓
useRegister.js:146 — console.error('[Register] Failed to record legal consent:', consentErr)
         ↓
Browser DevTools shows: Supabase error code, schema name, table name, constraint name
Exploit Chain Type: Single-step exploit (no gate present)
Result: BYPASSED
Severity: MEDIUM (info disclosure, not authentication bypass)
```

---

## FAILED EXPLOIT CHAINS (DEFENSES THAT HELD)

| Attack | Defense That Held | Verified |
|---|---|---|
| Wanders session userId mismatch → token injection | userId match guard in maybeMirrorWandersSession | [SOURCE_VERIFIED] |
| Authenticated user re-registration | AuthPublicRoute → Navigate to /feed | [SOURCE_VERIFIED] |
| Email case-variation account collision | normalizeEmail(.trim().toLowerCase()) in controller | [SOURCE_VERIFIED] |
| Double-submit via normal UI | submit button disabled on loading; form.onSubmit single-fire | [SOURCE_VERIFIED] |
| Anonymous upgrade userId foreign injection | userId derived from existing session (server-issued), not caller-supplied | [SOURCE_VERIFIED] |

---

## BLACKWIDOW FINDINGS

---

### BW-REG-001 — navState.from Injection — PARTIAL EXPLOIT

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-REG-001
Scenario: navState.from state injection → unvalidated redirect forwarding
Target: useRegister.js:50-56 → navState → navigate('/onboarding', state)
Application Scope: VCSM
Platform Surface: PWA
Attack Vector: Inject crafted location.state.from via in-SPA navigate() call or deep-link-driven initial navigation; accepted without whitelist check; forwarded to /onboarding via location state
Exploit Chain Type: Injection exploit (client state parameter accepted as redirect authority without whitelist validation)
Governance Status: DRAFT
Result: PARTIAL
Evidence: [SOURCE_VERIFIED] useRegister.js:50-56 — isSafeAuthReturnPath() defined in authInputValidation.model.js, NOT called on navState.from; injected path reaches navigate('/onboarding') unvalidated
Defense Gate: WEAK (typeof string check only — no path whitelist)
Blast Radius: Single actor (post-registration redirect affects only the registering user); potential phishing escalation if external URL accepted by onboarding
Severity: HIGH
VENOM Finding Cross-Reference: VEN-REG-001 (HIGH) — PARTIAL confirmed by BLACKWIDOW adversarial simulation
Recommended Fix: In useRegister.js — replace the navState.from derivation with: `const from = typeof state.from === 'string' && isSafeAuthReturnPath(state.from) ? state.from : null` — isSafeAuthReturnPath() already exists and has the correct whitelist
Layer to Fix: Hook (useRegister.js:50-56)
Required Follow-up Command: ELEKTRA (trace navState.from downstream through onboarding controller to confirm end-to-end exploitability and whether onboarding adds its own whitelist)
```

---

### BW-REG-002 — Wanders Session Mirror userId Guard — BLOCKED

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-REG-002
Scenario: Wanders session token injection with mismatched userId
Target: register.controller.js → maybeMirrorWandersSession → dalMirrorWandersSessionToPrimary
Application Scope: VCSM
Platform Surface: PWA — dual Supabase client boundary
Attack Vector: Force isWandersFlow=true via navigation state; Wanders client has stale foreign-user session; attempt session overwrite of primary client
Exploit Chain Type: Injection exploit (attempted) — guard prevents execution
Governance Status: DRAFT
Result: BLOCKED
Evidence: [SOURCE_VERIFIED] register.controller.js — userId match guard: if (wandersSession.user.id !== expectedUserId) throws before setSession() is called
Defense Gate: PRESENT (userId match guard — only active protection)
Blast Radius: NONE — guard fires before any token injection
Severity: LOW (MITIGATED)
VENOM Finding Cross-Reference: VEN-REG-005 (LOW — MITIGATED) — BLOCKED confirmed by BLACKWIDOW
Recommended Fix: Maintain guard at all costs; add regression test — see BW-REG-005-REGRESSION
Layer to Fix: Test coverage (guard is correct; regression test is missing)
Required Follow-up Command: SPIDER-MAN (regression test: Wanders userId mismatch must throw and abort mirror)
```

---

### BW-REG-003 — AuthPublicRoute Authenticated Bypass — BLOCKED

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-REG-003
Scenario: Authenticated user navigates directly to /register to re-register or clobber session
Target: AuthPublicRoute.jsx → /register route
Application Scope: VCSM
Platform Surface: PWA
Attack Vector: Direct navigation to /register while holding active Supabase session
Exploit Chain Type: Runtime abuse (attempted) — route guard prevents
Governance Status: DRAFT
Result: BLOCKED
Evidence: [SOURCE_VERIFIED] AuthPublicRoute.jsx — if (user) return <Navigate to="/feed" replace />; loading state shows spinner (no blank-screen race)
Defense Gate: PRESENT (AuthPublicRoute user guard)
Blast Radius: NONE
Severity: INFO
VENOM Finding Cross-Reference: None — BLOCKED at route guard
Recommended Fix: No action required. Defense confirmed operational.
Layer to Fix: N/A
Required Follow-up Command: None
```

---

### BW-REG-004 — Double-Submit Race Window — PARTIAL

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-REG-004
Scenario: Rapid double form submission before loading state propagation
Target: handleRegister() in useRegister.js → ctrlRegisterAccount → auth.signUp
Application Scope: VCSM
Platform Surface: PWA
Attack Vector: Two form submit events fire in rapid succession before React re-renders the submit button as disabled
Exploit Chain Type: Timing-dependent exploit (narrow race window in React state batch)
Governance Status: DRAFT
Result: PARTIAL
Evidence: [SOURCE_VERIFIED] useRegister.js — setLoading(true) called synchronously at handleRegister() top; but canSubmit (which includes !loading) is a computed value from React state that doesn't update until re-render completes. Submit button has disabled={!canSubmit} — prevents UI-level double-click. Adversarial harness injection (calling handleRegister() directly twice before re-render) results in both calls passing the pre-render loading check; second Supabase signUp call rejects on duplicate email.
Defense Gate: WEAK (UI-level button disable; no explicit ref-based guard on handleRegister itself)
Blast Radius: Single actor — second signUp call fails on duplicate email, producing only a transient error; no security impact
Severity: LOW (no privilege escalation; attacker's own registration attempt only)
VENOM Finding Cross-Reference: None — NEW FINDING from BLACKWIDOW adversarial simulation
Recommended Fix: Add a useRef guard inside handleRegister() to prevent concurrent calls: `const isSubmitting = useRef(false); if (isSubmitting.current) return; isSubmitting.current = true; try { ... } finally { isSubmitting.current = false; setLoading(false); }` — equivalent to BW-FP-001 from ForgotPassword module
Layer to Fix: Hook (useRegister.js)
Required Follow-up Command: ELEKTRA (LOW priority patch advisory)
```

---

### BW-REG-005 — console.error Production Supabase Error Disclosure — BYPASSED

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-REG-005
Scenario: Consent recording failure triggers unconditional console.error with raw Supabase error
Target: useRegister.js:146 → browser DevTools console
Application Scope: VCSM
Platform Surface: PWA
Attack Vector: Trigger consent recording failure (network drop during legal consent INSERT, RLS rejection on platform.user_consents, or empty platform.legal_documents result); open DevTools and read console.error output
Exploit Chain Type: Single-step exploit (no gate present — console.error fires without DEV guard)
Governance Status: DRAFT
Result: BYPASSED
Evidence: [SOURCE_VERIFIED] useRegister.js:146 — console.error('[Register] Failed to record legal consent:', consentErr) — no import.meta.env.DEV guard; consentErr = raw Supabase error object with code (e.g., '42501'), message (includes table/schema names), details, hint fields
Defense Gate: ABSENT (no DEV guard)
Blast Radius: Single actor (each user's own DevTools session); reconnaissance enabler for the registering user-attacker
Severity: MEDIUM
VENOM Finding Cross-Reference: VEN-REG-004 (MEDIUM) — BYPASSED confirmed by BLACKWIDOW adversarial simulation
Recommended Fix: Remove console.error at useRegister.js:146. captureFrontendError() fires on the same error path and provides server-side observability. Remove the console.error entirely — zero observability loss.
Layer to Fix: Hook (useRegister.js:146)
Required Follow-up Command: Wolverine (one-line fix — remove console.error line)
```

---

### BW-REG-006 — Password Complexity Client Bypass — PARTIAL

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-REG-006
Scenario: Direct Supabase SDK call bypasses VCSM UI password complexity rules
Target: Supabase auth.signUp — password field
Application Scope: VCSM
Platform Surface: PWA + Supabase Auth
Attack Vector: Call supabase.auth.signUp({ email, password: 'aaaaaaaa' }) directly via SDK (or browser console) — bypasses evaluateRegisterPasswordRules() entirely; Supabase accepts the password if it meets the project's configured minimum (typically 6 or 8 chars — no uppercase/lowercase/number enforcement at auth layer)
Exploit Chain Type: Runtime abuse — UI bypass via direct SDK access
Governance Status: DRAFT
Result: PARTIAL
Evidence: [SOURCE_VERIFIED] registerPasswordRules.model.js — all 5 rules client-only; register.controller.js — no password strength check; DAL passes password directly to auth.signUp
Defense Gate: WEAK (UI-level only — no server enforcement confirmed; Supabase default minimum exists but VCSM complexity rules are not enforced)
Blast Radius: Single actor — attacker registers their own account with a weak password; no cross-actor impact
Severity: LOW
VENOM Finding Cross-Reference: VEN-REG-006 (LOW) — PARTIAL confirmed by BLACKWIDOW
Recommended Fix: Configure Supabase project auth settings to enforce minimum 8-character passwords; consider an Edge Function signUp wrapper for full VCSM complexity enforcement
Layer to Fix: Supabase Auth Config / Edge Function
Required Follow-up Command: DB (verify Supabase project auth minimum password configuration)
```

---

### BW-REG-008 — BEHAVIOR.md Missing §4/§9 Invariant Sections — GOVERNANCE

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID: BW-REG-008
Scenario: BEHAVIOR.md exists but lacks formal §4 Failure Paths and §9 Must Never Happen sections
Target: ZZnotforproduction/APPS/VCSM/features/auth/modules/register/BEHAVIOR.md
Application Scope: VCSM
Platform Surface: Governance
Attack Vector: N/A — governance documentation gap
Exploit Chain Type: N/A — governance finding
Governance Status: DRAFT
Result: PARTIAL (BLACKWIDOW proceeded with IMPLICIT_INVARIANTs constructed from flow; 5 implicit invariants tested)
Evidence: [SOURCE_VERIFIED] BEHAVIOR.md — CURRENT status; sections present: Confirmed Behaviors, Form Validation, Navigation State, Loading/Error/Success, Guard Behavior; sections ABSENT: §4 Failure Paths, §9 Must Never Happen
Defense Gate: ABSENT (invariant contract not formally declared)
Blast Radius: Governance — BLACKWIDOW attack surface declaration is UNANCHORED without formal §9 invariants
Severity: MEDIUM
VENOM Finding Cross-Reference: None — new BLACKWIDOW governance finding
Recommended Fix: Add formal §4 Failure Paths section (declared failure conditions: email already in use, network error during signUp, consent recording failure, stale JWT recovery, Wanders userId mismatch rejection) and §9 Must Never Happen section (invariants: session must never carry foreign userId, redirect must never target unwhitelisted path, profile must never be upserted for a different user) to BEHAVIOR.md
Layer to Fix: Documentation — BEHAVIOR.md
Required Follow-up Command: Logan (documentation contract — BEHAVIOR.md §4/§9 backfill)
```

---

## §9 INVARIANT ATTACK MAP

| Attack Path | Attack Result | Implicit Invariant | IMPLICIT-ID | SPIDER-MAN Required |
|---|---|---|---|---|
| navState.from injection via navigate() state | PARTIAL — no whitelist check; path forwarded | navState.from must never redirect to unwhitelisted path | IMPLICIT-003 | TESTREQ-REG-003 |
| Wanders session userId mismatch → setSession() | BLOCKED — userId match guard throws | Wanders mirror must never inject foreign user tokens | IMPLICIT-002 | TESTREQ-REG-002 |
| Authenticated user navigates /register | BLOCKED — AuthPublicRoute redirect | Authenticated users must never reach RegisterScreen | IMPLICIT-004 | TESTREQ-REG-004 |
| console.error on consent failure | BYPASSED — no DEV guard | Internal error details must not reach production console | IMPLICIT-005 | TESTREQ-REG-005 |
| auth.signUp server-issued userId integrity | BLOCKED — server-issued, no client path | Registration must never associate a foreign userId | IMPLICIT-001 | TESTREQ-REG-001 |

---

## RECOMMENDED FIXES

| Finding | Severity | Fix | Priority | Layer |
|---|---|---|---|---|
| BW-REG-001 | HIGH | Add isSafeAuthReturnPath() call on navState.from in useRegister.js | P1 | Hook |
| BW-REG-005 | MEDIUM | Remove console.error at useRegister.js:146 | P1 | Hook |
| BW-REG-008 | MEDIUM | Add §4/§9 sections to register BEHAVIOR.md | P2 | Documentation |
| BW-REG-002 | LOW | Add regression test: Wanders userId mismatch must throw | P2 | Test |
| BW-REG-004 | LOW | Add useRef isSubmitting guard to handleRegister() | P2 | Hook |
| BW-REG-006 | LOW | Verify Supabase auth project minimum password length config | P2 | Config |
| BW-REG-003 | INFO | No action — defense confirmed | — | — |

---

## FINDING SUMMARY

| ID | Severity | Type | Result | THOR |
|---|---|---|---|---|
| BW-REG-001 | HIGH | Redirect path injection | PARTIAL | CAUTION |
| BW-REG-002 | LOW (MITIGATED) | Session token injection | BLOCKED | Not blocked |
| BW-REG-003 | INFO | Route bypass | BLOCKED | N/A |
| BW-REG-004 | LOW | Double-submit race | PARTIAL | Not blocked |
| BW-REG-005 | MEDIUM | Console disclosure | BYPASSED | Not blocked |
| BW-REG-006 | LOW | Password bypass | PARTIAL | Not blocked |
| BW-REG-008 | MEDIUM | Behavior contract gap | GOVERNANCE | Not blocked |

**Totals:** 0 CRITICAL | 1 HIGH | 2 MEDIUM | 3 LOW | 1 INFO

**Confirmed VENOM findings:** VEN-REG-001 (PARTIAL) | VEN-REG-004 (BYPASSED) | VEN-REG-005 (BLOCKED) | VEN-REG-006 (PARTIAL)

**New BLACKWIDOW findings not in VENOM:** BW-REG-004 (double-submit race) | BW-REG-008 (BEHAVIOR.md §4/§9 gap)

---

## BLACKWIDOW RECOMMENDATION

**CAUTION**

No CRITICAL or full-BYPASSED HIGH findings. The registration module's core identity chain (server-issued userId, Wanders userId guard, AuthPublicRoute gate) held under adversarial simulation.

Primary concern: **BW-REG-001 (HIGH — PARTIAL)** — navState.from injection is confirmed PARTIAL in this module. The injected path is accepted and forwarded without whitelist validation. Whether this becomes a full exploit depends on whether the onboarding controller uses navState.from as a redirect without its own whitelist — ELEKTRA must trace this. The fix is one line.

**BW-REG-005 (MEDIUM — BYPASSED)** is a confirmed bypass: console.error exposes Supabase internal error details in production DevTools. Fix is one-line: remove the console.error call.

**THOR Release Blocker:** NO — CAUTION pending:
1. ELEKTRA trace of BW-REG-001/VEN-REG-001 (navState.from downstream in onboarding)
2. DB audit of RLS on public.profiles and platform.user_consents (VEN-REG-002, VEN-REG-003)

---

## REQUIRED FOLLOW-UP COMMANDS

| Command | Priority | Reason |
|---|---|---|
| ELEKTRA | P1 | Trace BW-REG-001/VEN-REG-001 downstream: useRegister → navigate('/onboarding') → onboarding controller → redirect target. Determine if onboarding adds its own whitelist. Patch advisory for useRegister.js if it does not. |
| Wolverine | P1 | Remove console.error at useRegister.js:146 (BW-REG-005) |
| DB | P1 | Confirm RLS on public.profiles (UPSERT) and platform.user_consents (INSERT) |
| SPIDER-MAN | P2 | Regression tests: (a) Wanders userId mismatch must throw (BW-REG-002), (b) navState.from with unwhitelisted path must be rejected post-fix (BW-REG-001) |
| Logan | P2 | Add §4/§9 sections to register BEHAVIOR.md (BW-REG-008) |

---

## PENDING REVIEWS

| Command | Reason | Status |
|---|---|---|
| VENOM | Cross-reference complete — 5 findings confirmed | COMPLETE |
| ELEKTRA | Trace navState.from → onboarding → redirect end-to-end | PENDING |
| LOKI | Runtime telemetry validation for BW-REG-001 exploit path | PENDING |
| THOR | Evaluate release blocking status | PENDING — awaiting ELEKTRA + DB |
| SPIDER-MAN | Regression test requirements for BW-REG-001, BW-REG-002 | PENDING |
