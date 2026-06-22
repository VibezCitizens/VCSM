# ELEKTRA Security Report — auth

**Date:** 2026-06-04
**Time:** 23:10
**Scope:** VCSM
**Reviewer:** ELEKTRA
**Scan Trigger:** MANUAL — first ELEKTRA pass on auth; VENOM requested ELEKTRA chain trace for VEN-AUTH-001
**Areas Covered:** 1 (Actor Ownership/IDOR), 2 (Controller Input Trust), 6 (Auth and Session), 7 (URL and Redirect)
**Findings Summary:** 1 HIGH | 2 MEDIUM | 2 LOW | 0 INFO
**False Positives Rejected:** 5
**Suggested Patches:** 5

---

## Executive Summary

The auth module is VCSM's foundational trust boundary — every actor identity passes through it. This ELEKTRA pass covered all controllers, hooks, DAL files, and models across the four highest-risk scan areas for auth. VENOM (7 findings) and BLACKWIDOW (6 findings) had already mapped the trust-boundary design and adversarial runtime paths; ELEKTRA's role here is precise code-level chain verification, Edge Function patch advisory for VEN-AUTH-001, and identification of two findings not previously classified at the code level.

**Key additions over VENOM/BW:**
- Full source→sink chain trace for VEN-AUTH-001 (ELEK-001), confirming `dalGetAuthSession()` uses a cached client-side JWT (not server-verified) as the fallback gate — adds depth to the existing HIGH finding
- Open redirect dual-sink trace: VENOM flagged `useLogin.js` only; ELEKTRA confirms a SECOND sink in `useAuthOnboarding.js` with NO blocklist at all (ELEK-002, upgraded concern)
- `ensureProfileShell` — full DAL-level trace to the upsert sink confirming no `.eq('id', auth.uid())` filter and RLS dependency (ELEK-003)
- New finding: `getSession()` vs `getUser()` discrepancy across all write controllers — only `completeProfileGate.controller.js` uses server-round-trip verification; all write-guarding controllers use cached JWT (ELEK-005)
- Edge Function patch advisory for VEN-AUTH-001

**THOR Status:** BLOCKED — ELEK-001 (HIGH, carries VEN-AUTH-001 THOR block) remains OPEN.

---

## ELEKTRA SCAN TARGET

```
ELEKTRA SCAN TARGET
Feature / Route / Engine:    auth — full module (DAL + Controller + Hook + Model)
Application Scope:           VCSM
Reason for scan:             First ELEKTRA pass; VENOM referral (VEN-AUTH-001 chain trace + Edge Function advisory)
Scan trigger:                MANUAL | VENOM cross-reference
```

---

## ENTRY POINT MAP

```
ENTRY POINT MAP
Route / API / Controller:    8 routes (login, register, forgot-password, reset-password, auth/callback,
                             onboarding, verify-email, CompleteProfileGate wrapper)
Input sources (user-controlled):
  - Login form: email, password (useLogin)
  - Register form: email, password (useRegister)
  - Onboarding form: display_name, username_base, birthdate, sex (useAuthOnboarding)
  - URL query params: code, error, error_description (authCallback, resetPassword)
  - URL hash params: error, error_description (authCallback, resetPassword)
  - sessionStorage: vc.auth.recovery nonce (setNewPassword)
  - React Router state: state.from, state.wandersFlow, state.card (useLogin, useAuthOnboarding, useRegister)
Trusted input boundary:      Controller layer (DAL must not be called with unvalidated input)
Validation present at boundary: PARTIAL — form fields validated by model; URL params sanitized in production;
                                sessionStorage nonce has TTL but is client-forgeable
```

---

## High Findings

---

### ELEK-2026-06-04-001 — Server-Side Recovery Provenance Gap (Full Chain Trace)

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-001
- Title:              Password Reset Provenance — Client-Side Nonce Gate + Cached Session Check
- Category:           Weak JWT/Session
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js:55-149
- Source:             sessionStorage.getItem('vc.auth.recovery') — client-writable; no server origin proof
- Sink:               dalUpdateUserPassword(password) → supabase.auth.updateUser({ password: newPassword })
                      apps/VCSM/src/features/auth/dal/resetPassword.dal.js:16-19
- Trust Boundary:     Authenticated session holder with recovery session provenance
- Impact:             Attacker with a valid Supabase JWT in localStorage + ability to write to
                      sessionStorage can call updatePasswordController and reset password without
                      receiving a recovery email. In a stolen-session scenario (e.g., via XSS),
                      attacker locks out victim by rotating password silently.

- Evidence:
  setNewPassword.controller.js:138-149 — fallback gate (no code in URL):
    if (!readRecoveryNonce()) return { ok: false, ... }   // client-forgeable UUID JSON
    const session = await dalGetAuthSession()             // ← cached JWT, NOT server-verified
    if (!session) return { ok: false, ... }
    return { ok: true, session }

  authSession.read.dal.js:7-10:
    export async function dalGetAuthSession() {
      const { data, error } = await supabase.auth.getSession()  // ← localStorage/memory cache
      return data?.session ?? null
    }

  ELEKTRA precision: supabase.auth.getSession() reads from the in-memory / localStorage
  client cache. It does NOT make a server round-trip. Compare with supabase.auth.getUser()
  used in completeProfileGate.controller.js — which IS a server-verified call.
  The fallback gate at line 145 is therefore: (1) client-forgeable nonce AND
  (2) client-cached session — neither element requires a server round-trip.
  supabase.auth.updateUser() DOES validate the JWT server-side, so this ultimately
  requires a valid Supabase-issued JWT. But the app-layer gate provides no
  recovery-provenance proof beyond "a JWT exists in localStorage."

  setNewPassword.controller.js:31-44 explicitly documents the limitation:
    "supabase.auth.updateUser({ password }) requires a valid authenticated JWT but
     does NOT enforce that the session originated from a PASSWORD_RECOVERY event."

- Reproduction Steps:
  1. Authenticate normally (email/password login) — obtain a valid Supabase JWT
  2. Navigate to /reset-password
  3. Set sessionStorage['vc.auth.recovery'] = JSON.stringify({ nonce: crypto.randomUUID(), issuedAt: Date.now() })
  4. Submit a new password via the reset form
  5. Password updates without any recovery email sent
  (Self-exploitation only — no cross-user path. Requires valid authenticated session.)

- Existing Defense:
  sessionStorage nonce with UUID and 30-minute TTL (setNewPassword.controller.js:60-70);
  PKCE code-based path (lines 110-122) is inherently secure — code exchange is server-side and single-use;
  Post-update dalSignOutRecoverySession() (setNewPassword.controller.js:173) invalidates session after use

- Why Defense Is Insufficient:
  The nonce is a UUID stored in client-controlled sessionStorage — any JavaScript execution context
  can write to it. The fallback gate session check uses a cached JWT (getSession), not a live
  server-round-trip (getUser). Neither element provides server-side recovery-provenance proof.
  The protection is documentation-only ("raises the barrier to source-code-aware users") —
  not a cryptographic or server-enforced boundary.

- Recommended Fix:
  Implement a server-side Edge Function (POST /functions/v1/reset-password) that:
  (1) Accepts the PKCE recovery code and new password in the request body
  (2) Calls supabase.auth.exchangeCodeForSession(code) server-side — validates the code is genuine,
      single-use, and issued for a PASSWORD_RECOVERY flow
  (3) Calls adminAuthClient.updateUserById(user.id, { password: newPassword }) on the service-role client
  (4) Returns success — client never needs to hold the recovery session
  This removes the sessionStorage nonce entirely and grounds recovery in a server-side code exchange.

- Suggested Patch:
  // NEW: supabase/functions/reset-password/index.ts (Edge Function)
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

  Deno.serve(async (req) => {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

    const { code, password } = await req.json()
    if (!code || !password) return new Response('Missing code or password', { status: 400 })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    )

    // Exchange code for session — validates the code is genuine and single-use
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError || !sessionData?.user?.id) {
      return new Response(JSON.stringify({ error: 'Invalid or expired recovery code' }), { status: 401 })
    }

    // Update password via admin client — operates on confirmed recovery identity
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      sessionData.user.id,
      { password }
    )
    if (updateError) return new Response(JSON.stringify({ error: 'Password update failed' }), { status: 400 })

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  })

  // Client: updatePasswordController becomes a POST to /functions/v1/reset-password
  // { code: recoveryCode, password } — no sessionStorage nonce needed

- VENOM Cross-Reference:  VEN-AUTH-001 (same finding — ELEKTRA adds chain precision)
- BLACKWIDOW Cross-Reference: BW-AUTH-004 (adversarial confirmation of bypass)
- Follow-up Command:       Carnage (if recovery audit log table required), SPIDER-MAN (regression test)
```

---

## Medium Findings

---

### ELEK-2026-06-04-002 — Open Redirect Dual-Sink (useLogin + useAuthOnboarding)

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-002
- Title:              Open Redirect via state.from — Two Sinks, Second Sink Has No Blocklist
- Category:           Open Redirect
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/auth/hooks/useLogin.js:56-71
                      apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js:29-36 (+ line 143)
- Source:             location.state.from — React Router navigation state (client-controlled)
- Sink:               navigate(dest, { replace: true }) — useLogin.js:71
                      navigate(navState.redirectTo, { replace: true }) — useAuthOnboarding.js:143
- Trust Boundary:     Post-authentication redirect destination
- Impact:             An attacker who can inject location.state.from via a crafted deep link or
                      PWA navigation can redirect a freshly authenticated user to an attacker-
                      controlled page. In a PWA/Capacitor context, universal links can carry
                      navigation state. Phishing vector: user logs in legitimately and lands on
                      attacker page mimicking VCSM.

- Evidence:
  SINK 1 — useLogin.js:56-71:
    const rawFrom = location?.state?.from
    const from = typeof rawFrom === 'string' ? rawFrom : (rawFrom?.pathname ?? null)
    const dest = from && !['/login','/register','/reset','/forgot-password'].includes(from)
      ? from
      : '/feed'
    navigate(dest, { replace: true })
    // Gap: 'https://evil.com' is not in the blocklist — dest = 'https://evil.com'

  SINK 2 — useAuthOnboarding.js:29-32 + 143:
    redirectTo: typeof state.from === 'string' ? state.from : '/'
    // No blocklist. No origin check. ANY string passes through.
    navigate(navState.redirectTo, { replace: true })
    // Worse than Sink 1 — no blocklist at all.

  ELEKTRA note: BW-AUTH-006 documented Sink 1 only with React Router implicit mitigation.
  Sink 2 in useAuthOnboarding.js has NO blocklist and was not separately called out.
  React Router v6 navigate() with an absolute URL (https://...) does NOT guarantee same-origin
  enforcement in all render environments — in Capacitor/webview wrappers, navigate() may
  trigger actual external navigation. The implicit mitigation is a behavioral coincidence,
  not an explicit security assertion.

- Reproduction Steps:
  1. In a dev environment, navigate to /onboarding with state = { from: 'https://attacker.example.com' }
  2. Complete onboarding
  3. navigate() is called with 'https://attacker.example.com' as destination
  (In a Capacitor/webview context, this may produce actual cross-origin navigation)

- Existing Defense:
  Sink 1: blocklist for '/login', '/register', '/reset', '/forgot-password' — does not block
  absolute URLs
  Sink 2: none

- Why Defense Is Insufficient:
  A blocklist of specific relative paths does not guard against absolute URLs.
  A regex allowlist enforcing relative paths (startsWith('/') && !startsWith('//')) is required.

- Recommended Fix:
  Add a safe-redirect helper used at both sinks.

- Suggested Patch:
  // Add to a shared auth utility (or inline at both call sites):
  function isSafeRedirectPath(dest) {
    return typeof dest === 'string' && dest.startsWith('/') && !dest.startsWith('//')
  }

  // useLogin.js — replace lines 64-67:
  const dest = isSafeRedirectPath(from) ? from : '/feed'

  // useAuthOnboarding.js — replace line 32:
  const rawFrom = typeof state.from === 'string' ? state.from : null
  const redirectTo = isSafeRedirectPath(rawFrom) ? rawFrom : '/'

- VENOM Cross-Reference:  VEN-AUTH-002 (Sink 1 only)
- BLACKWIDOW Cross-Reference: BW-AUTH-006 (Sink 1, partial mitigation noted)
- Follow-up Command:      SPIDER-MAN (regression test for both redirect guard paths)
```

---

### ELEK-2026-06-04-003 — ensureProfileShell: No Internal Session Cross-Check Before Profile Write

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-003
- Title:              ensureProfileShell Accepts Arbitrary userId Without Internal Session Verification
- Category:           Actor Ownership / IDOR
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/auth/controllers/profileOnboarding.controller.js:7-25
                      apps/VCSM/src/features/auth/dal/onboarding.dal.js:35-49
- Source:             userId parameter to ensureProfileShell({ userId, email }) — caller-supplied
- Sink:               supabase.from('profiles').upsert({ id: userId, email, ... })
                      apps/VCSM/src/features/auth/dal/onboarding.dal.js:41-48
- Trust Boundary:     Authenticated session (ownership of userId must equal auth.uid())
- Impact:             If a new caller passes an arbitrary userId (not sourced from getUser()),
                      a profile shell can be written for any profile ID — overwriting the email
                      column of an existing user's row if RLS permits it.

- Evidence:
  profileOnboarding.controller.js:7-25 — no session call:
    export async function ensureProfileShell({ userId, email }) {
      if (!userId) throw new Error('userId is required')        // null guard only
      const row = await readProfileShellDAL(userId)
      if (!row) {
        await upsertProfileShellDAL({ id: userId, email, ... }) // no auth.uid() check
      }
      return { needsOnboarding: isProfileShellIncompleteModel(row) }
    }

  onboarding.dal.js:41-48 — no ownership filter in query:
    await supabase.from('profiles').upsert({
      id,          // = userId — accepts whatever caller passed
      email,
      created_at: createdAt,
      updated_at: updatedAt,
    })
    // No .eq('id', supabase.auth.getUser().id) because upsert operates on PK directly

  Current caller (completeProfileGate.controller.js:4-14):
    const user = await readCurrentAuthUserDAL()   // supabase.auth.getUser() — server-verified
    return ensureProfileShell({ userId: user.id, email: user.email })
    // SAFE in this caller — userId is server-derived

  Risk: ensureProfileShell is exported and called only by one controller today.
  Any future caller that passes an arbitrary userId (e.g., from a stale state, a
  refactored hook, or a different controller) bypasses the server-derived source
  without any internal safeguard in ensureProfileShell itself.

- Reproduction Steps:
  (Internal, not directly user-exploitable at present)
  1. Call ensureProfileShell({ userId: victimId, email: 'attacker@example.com' })
     from any context that bypasses evaluateCompleteProfileGateController
  2. If profiles table RLS allows the upsert, victim's profile email is overwritten

- Existing Defense:
  Current sole caller (evaluateCompleteProfileGateController) sources userId from
  supabase.auth.getUser() — this is correct and safe for the current call path.
  profiles table RLS is the DB-layer backstop (see BW-AUTH-002 — not confirmed audited).

- Why Defense Is Insufficient:
  The safety is entirely caller-dependent. ensureProfileShell has no internal guarantee
  that the userId it writes matches the authenticated session. Defense-in-depth requires
  the function to self-verify, not rely on all future callers to do so.
  RLS is a necessary but unconfirmed backstop — see ELEK-003-RLS note below.

- Recommended Fix:
  Add internal session verification inside ensureProfileShell before the upsert.

- Suggested Patch:
  // profileOnboarding.controller.js — add session check before write:
  import { dalGetAuthUser } from '@/features/auth/dal/onboarding.dal'
  // or: import { readCurrentAuthUserDAL } from '@/features/auth/dal/onboarding.dal'

  export async function ensureProfileShell({ userId, email }) {
    if (!userId) throw new Error('userId is required')

    // ELEK-2026-06-04-003: Verify the caller's session owns this userId before writing.
    const user = await readCurrentAuthUserDAL()
    if (!user || user.id !== userId) {
      throw new Error('Session does not match userId. Profile shell write rejected.')
    }

    const row = await readProfileShellDAL(userId)
    if (!row) {
      const now = new Date().toISOString()
      await upsertProfileShellDAL({ id: userId, email: email ?? null, createdAt: now, updatedAt: now })
      return { needsOnboarding: true }
    }
    return { needsOnboarding: isProfileShellIncompleteModel(row) }
  }

- ELEK-003-RLS Note:
  The profiles table INSERT + UPDATE RLS policy must enforce auth.uid() = id for all
  upsert paths. This is required regardless of the app-layer fix above. Delegate
  verification to DB command.

- VENOM Cross-Reference:  VEN-AUTH-004
- BLACKWIDOW Cross-Reference: BW-AUTH-005
- Follow-up Command:      DB (confirm profiles table INSERT RLS enforces auth.uid() = id)
```

---

## Low Findings

---

### ELEK-2026-06-04-004 — @debuggers Import Passes PII Through Conditionally-Live Logging Path

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-004
- Title:              PII (userId, email) Passed Into @debuggers Alias — Production Safety Depends
                      Solely on Build-Time Alias Substitution
- Category:           Secrets Exposure
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/auth/hooks/useLogin.js:5, 22-54
- Source:             data.user.id and data.user.email from signInWithPassword() response
- Sink:               debugLoginSessionSnapshot(data) — line 54; debugLoginEvent(..., { payload: { userId, email } }) — line 40
- Trust Boundary:     Production build boundary (Vite mode=production alias substitution)
- Impact:             In production: no-op stub — data does not reach a logger. In dev or
                      misconfigured build: full session response (userId, email) logged.
                      Full session object passed to debugLoginSessionSnapshot includes user.id
                      and user.email — PII under GDPR/CCPA.

- Evidence:
  useLogin.js:5:
    import { debugLoginEvent, debugLoginError, debugLoginSessionSnapshot } from '@debuggers/identity'

  useLogin.js:39-44 — explicit PII in debug payload:
    debugLoginEvent('SUPABASE_SIGNIN_SUCCESS', {
      payload: { userId: data?.user?.id, email: data?.user?.email },
    })

  useLogin.js:54 — full session object:
    debugLoginSessionSnapshot(data)   // data = { user: { id, email } }

  Production safety: vite.config.js resolves @debuggers → debuggers-stub/identity/index.js
  (no-ops confirmed). Non-production: resolves to zNOTFORPRODUCTION/_ACTIVE/debuggers
  (path absent in current scan — live logger status unknown).

- Existing Defense:
  Build-time alias substitution to no-op stub in production builds.

- Why Defense Is Insufficient:
  A single build configuration error or misconfigured CI pipeline produces a build where
  real PII reaches whatever the live @debuggers module logs to. The defense is a single
  point of failure — no runtime guard.

- Recommended Fix:
  Wrap ALL debug calls in explicit import.meta.env.DEV guards. This adds a runtime guard
  that is independent of the alias resolution.

- Suggested Patch:
  // useLogin.js — wrap every debugger call:
  if (import.meta.env.DEV) {
    debugLoginEvent('LOGIN_SUBMIT', { phase: 'login', ... })
  }
  // ... apply same pattern to all debugLoginEvent, debugLoginError, debugLoginSessionSnapshot calls

  // This ensures the calls are dead code in production regardless of alias resolution.

- VENOM Cross-Reference:  VEN-AUTH-005
- Follow-up Command:      VENOM (audit all @debuggers imports across VCSM for same pattern)
```

---

### ELEK-2026-06-04-005 — getSession() (Cached) Used for All Write-Guard Ownership Checks Except One

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-005
- Title:              Ownership Gates Use Cached JWT (getSession) — Not Server-Round-Trip (getUser)
                      Except completeProfileGate
- Category:           Weak JWT/Session
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/auth/dal/authSession.read.dal.js:7-11 (dalGetAuthSession)
                      apps/VCSM/src/features/auth/controllers/onboarding.controller.js:65 (completeOnboarding)
                      apps/VCSM/src/features/auth/controllers/onboarding.controller.js:149 (bootstrapJoinOnboarding)
                      apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js:145 (fallback gate)
- Source:             localStorage / in-memory Supabase client session cache
- Sink:               upsertCompletedOnboardingProfileDAL, upsertProfileShellDAL, dalUpdateUserPassword
- Trust Boundary:     Authenticated session with live server-verified identity
- Impact:             Controllers using dalGetAuthSession() (getSession — cached) rather than
                      readCurrentAuthUserDAL() (getUser — server-verified) may accept a locally
                      cached JWT that has been server-side revoked but not yet expired. The JWT
                      is cryptographically signed (cannot be forged without Supabase's private key)
                      and Supabase's own write APIs re-validate the JWT server-side at the sink —
                      so the practical risk is bounded. The concern is defense-in-depth: ownership
                      gates that use getSession() provide weaker assurance than those using getUser().

- Evidence:
  authSession.read.dal.js:7-11:
    export async function dalGetAuthSession() {
      const { data, error } = await supabase.auth.getSession()   // ← in-memory/localStorage cache
      return data?.session ?? null
    }

  vs. onboarding.dal.js:3-7:
    export async function readCurrentAuthUserDAL() {
      const { data, error } = await supabase.auth.getUser()      // ← server round-trip
      return data?.user ?? null
    }

  Controllers using cached getSession() for ownership gate:
    completeOnboardingController:line 65
    bootstrapJoinOnboardingController:line 149
    profile.controller.js (per VENOM source verification)
    setNewPassword.controller.js:145 (fallback gate)

  Only controller using server-verified getUser():
    completeProfileGate.controller.js:5 → readCurrentAuthUserDAL()

- Existing Defense:
  Supabase JWT is cryptographically signed — cannot be forged.
  Supabase write APIs (upsert, updateUser) re-validate the JWT in the Authorization header
  server-side at the sink, so operations on truly revoked tokens would still fail.

- Why Defense Is Insufficient:
  Ownership gate at the controller layer should use server-verified identity for security-
  sensitive write paths. A Supabase recommendation (their docs) is to prefer getUser() over
  getSession() for auth checks. Using getSession() means a revoked token that hasn't yet
  expired can pass the app-layer ownership gate (though it would fail at the sink).

- Recommended Fix:
  For security-sensitive write controllers, replace dalGetAuthSession() → getSession() with
  readCurrentAuthUserDAL() → getUser() as the primary session check. This is consistent with
  completeProfileGate.controller.js which already uses the correct pattern.

- Suggested Patch:
  // Example — completeOnboardingController (onboarding.controller.js:65):
  // Replace:
  const session = await dalGetAuthSession()
  const user = session?.user ?? null

  // With:
  const user = await readCurrentAuthUserDAL()  // getUser() — server-verified

  // Then update downstream: user?.id instead of session?.user?.id
  // Apply same replacement to bootstrapJoinOnboardingController and profile.controller.js

  // Note: dalGetAuthSession() is still needed for the PKCE code-exchange path in
  // setNewPassword.controller.js (lines 143-149) where it reads the post-exchange
  // session — that use is acceptable because the code exchange itself is the proof.

- Follow-up Command:  SPIDER-MAN (regression test confirming ownership gates still hold
                     after replacing getSession with getUser)
```

---

## False Positives Rejected

```
FALSE POSITIVE REJECTED

- Candidate:        email/password passed to signInWithPassword without explicit sanitization
- Location:         apps/VCSM/src/features/auth/controllers/login.controller.js:8
- Rejection reason: Supabase Auth API validates and sanitizes credentials server-side.
                    No SQL injection path via the Auth REST API.
- Chain gap:        Sink (Supabase Auth API is not a raw SQL sink — input is parameterized)
- Notes:            None
```

```
FALSE POSITIVE REJECTED

- Candidate:        display_name, username_base form fields from onboarding form — XSS via stored values
- Location:         apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js, model/onboarding.model.js
- Rejection reason: React renders stored string values as escaped text. XSS via stored values
                    requires a render-layer vulnerability, not an auth-layer one. normalizeOnboardingFormModel
                    applies .trim() but does not sanitize HTML — this is correct; sanitization belongs
                    in the render layer.
- Chain gap:        Sink (React render engine escapes output — no XSS sink in auth module itself)
- Notes:            If any component renders display_name via dangerouslySetInnerHTML, that is a
                    separate render-layer finding outside auth scope.
```

```
FALSE POSITIVE REJECTED

- Candidate:        PKCE code parameter in authCallback passed to exchangeCodeForSession without validation
- Location:         apps/VCSM/src/features/auth/controllers/authCallback.controller.js:52
- Rejection reason: Supabase's exchangeCodeForSession validates the code server-side — codes are
                    single-use, cryptographically bound tokens. No injection path via the code value.
- Chain gap:        Sink (code exchange endpoint validates input; no SQL/command injection via code value)
- Notes:            None
```

```
FALSE POSITIVE REJECTED

- Candidate:        sex field accepted from onboarding form without allowlist
- Location:         apps/VCSM/src/features/auth/model/onboarding.model.js:34-38
- Rejection reason: normalizeSexValueModel() implements an explicit allowlist:
                    SEX_VALUES = { male: 'Male', female: 'Female' } — any other value returns null.
                    The allowlist is server-side and correct.
- Chain gap:        Defense at trust boundary (allowlist confirmed present and exhaustive)
- Notes:            null sex value is accepted (not required) — this is intentional per the model.
```

```
FALSE POSITIVE REJECTED

- Candidate:        Birthdate field from onboarding — date injection or age manipulation
- Location:         apps/VCSM/src/features/auth/model/onboarding.model.js:40-88
- Rejection reason: computeAgeFromBirthdateModel validates YYYY-MM-DD regex, rejects invalid
                    calendar dates (e.g., 2000-02-31), rejects future birthdates, and computes
                    isAdult server-side from the validated birthdate — client cannot supply
                    is_adult directly. The chain from client birthdate to is_adult is fully model-
                    mediated.
- Chain gap:        Defense at trust boundary (validation confirmed exhaustive for calendar rules)
- Notes:            No minimum age enforcement (e.g., age >= 13 for COPPA). Not a security
                    vulnerability in the auth module context — platform policy decision.
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-04-001 | Recovery provenance — Edge Function | HIGH | Edge Function / Worker | COMPLEX | YES — optional audit log (Carnage) |
| 2 | ELEK-2026-06-04-002 | Open redirect — isSafeRedirectPath helper | MEDIUM | Controller (Hook) | SIMPLE | NO |
| 3 | ELEK-2026-06-04-003 | ensureProfileShell — internal session check | MEDIUM | Controller | SIMPLE | NO |
| 3a | ELEK-2026-06-04-003-RLS | profiles INSERT RLS confirmation | MEDIUM | RLS | MODERATE | YES — DB policy audit |
| 4 | ELEK-2026-06-04-004 | @debuggers — import.meta.env.DEV guard | LOW | Controller (Hook) | SIMPLE | NO |
| 5 | ELEK-2026-06-04-005 | getSession → getUser in write controllers | LOW | Controller | SIMPLE | NO |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| VENOM | Cross-reference ELEK-001 (Edge Function architecture for recovery provenance); audit @debuggers pattern platform-wide (VEN-AUTH-005 extension) | PENDING |
| BLACKWIDOW | Runtime validation: verify ELEK-002 Sink 2 (useAuthOnboarding) — confirm whether React Router navigate() actually crosses origin in Capacitor context | PENDING |
| DB | Confirm profiles table INSERT + UPDATE RLS enforces auth.uid() = id (ELEK-003-RLS; BW-AUTH-002); confirm vc.actor_owners upsert RLS | PENDING |
| Carnage | Optional: DB audit log table for password reset events (if Edge Function for ELEK-001 is implemented) | PENDING |
| SPIDER-MAN | Regression tests: (1) isSafeRedirectPath both sinks, (2) ensureProfileShell session mismatch throws, (3) ownership gates hold with getUser() replacement | PENDING |
| Thor | ELEK-001 (HIGH) carries VEN-AUTH-001 THOR block — auth is not THOR-eligible until recovery provenance is resolved | PENDING |

---

## DATA FLOW TRACES (Summary)

### VEN-AUTH-001 / ELEK-001 Full Chain

```
DATA FLOW TRACE
Source:                 URL — no ?code param → window.location.search (no PKCE path)
                        sessionStorage.getItem('vc.auth.recovery') — client-writable JSON
Validation at boundary: readRecoveryNonce() — validates JSON structure + TTL; client-forgeable
Intermediate transforms: TTL check (Date.now() - issuedAt > 30min)
Intermediate call:      dalGetAuthSession() → supabase.auth.getSession() → CACHED JWT (localStorage)
Sink:                   dalUpdateUserPassword(password) → supabase.auth.updateUser({ password })
                        apps/VCSM/src/features/auth/dal/resetPassword.dal.js:16-19
Defense at sink:        WEAK — Supabase validates JWT at Auth API level, but does not enforce recovery origin
```

### Open Redirect / ELEK-002 Full Chain

```
DATA FLOW TRACE (Sink 2 — useAuthOnboarding)
Source:                 location.state.from — React Router navigation state (client-controlled)
Validation at boundary: typeof state.from === 'string' check only — no origin validation, no blocklist
Intermediate transforms: navState.redirectTo = rawFrom ?? '/'
Sink:                   navigate(navState.redirectTo, { replace: true }) — line 143
Defense at sink:        ABSENT — no same-origin check, no regex allowlist, no blocklist
```

### ensureProfileShell / ELEK-003 Full Chain

```
DATA FLOW TRACE
Source:                 userId parameter to ensureProfileShell() — caller-supplied
Validation at boundary: !userId null guard only; no session cross-check
Intermediate transforms: readProfileShellDAL(userId) — read, no write yet
Sink:                   supabase.from('profiles').upsert({ id: userId, email, ... })
                        apps/VCSM/src/features/auth/dal/onboarding.dal.js:41-48
Defense at sink:        ABSENT (app layer) — relies on profiles RLS at DB layer (unconfirmed)
```

---

## THOR Release Gate Assessment

| Finding | Severity | THOR Blocker | Reason |
|---|---|---|---|
| ELEK-2026-06-04-001 | HIGH | YES | Recovery provenance is client-side only. Stolen-session attacker can rotate victim credentials silently. Carries VEN-AUTH-001 block. |
| ELEK-2026-06-04-002 | MEDIUM | RECOMMENDED | Two sinks. Sink 2 (useAuthOnboarding) has NO blocklist — worse than Sink 1. One-line fix. Should be resolved before any major auth-adjacent release. |
| ELEK-2026-06-04-003 | MEDIUM | NO | Defense-in-depth gap; current caller is safe. RLS is backstop (pending DB confirmation). |
| ELEK-2026-06-04-004 | LOW | NO | Production safety holds via alias substitution. Hardening only. |
| ELEK-2026-06-04-005 | LOW | NO | Practical risk bounded by Supabase JWT expiry + sink-level JWT validation. Defense-in-depth improvement only. |

**THOR Verdict: BLOCKED — ELEK-2026-06-04-001 (= VEN-AUTH-001) must be resolved before auth is THOR-eligible.**

---

## Confidence Summary

| Finding ID | Severity | Confidence | Provenance |
|---|---|---|---|
| ELEK-2026-06-04-001 | HIGH | HIGH | SOURCE_VERIFIED — setNewPassword.controller.js:138-149; authSession.read.dal.js:7-11; resetPassword.dal.js:16-19 |
| ELEK-2026-06-04-002 | MEDIUM | HIGH | SOURCE_VERIFIED — useLogin.js:56-71; useAuthOnboarding.js:29-36, 143 |
| ELEK-2026-06-04-003 | MEDIUM | HIGH | SOURCE_VERIFIED — profileOnboarding.controller.js:7-25; onboarding.dal.js:35-49; completeProfileGate.controller.js:4-14 |
| ELEK-2026-06-04-004 | LOW | HIGH | SOURCE_VERIFIED — useLogin.js:5, 39-44, 54 |
| ELEK-2026-06-04-005 | LOW | HIGH | SOURCE_VERIFIED — authSession.read.dal.js:7-11; onboarding.dal.js:3-7; onboarding.controller.js:65, 149 |

Overall Confidence: HIGH — all five findings are source-verified with cited file and line numbers.

---

*Report generated by ELEKTRA — 2026-06-04 23:10*
*Source root: apps/VCSM/src/features/auth/*
*Areas covered: 01 (Actor Ownership/IDOR), 02 (Controller Input Trust), 06 (Auth and Session), 07 (URL and Redirect)*
*Read-only scan. No source files modified. No production endpoints tested.*
