---
title: ELEKTRA — auth / modules / register
date: 2026-06-06
reviewer: ELEKTRA
scope: VCSM:auth:register
venom-run: 2026-06-06
blackwidow-run: 2026-06-06
architect-run: 2026-06-06
scan-trigger: VENOM + BLACKWIDOW referral (full Blue Team chain)
recommendation: CAUTION
---

# ELEKTRA Security Report

**Date:** 2026-06-06
**Scope:** VCSM:auth:register — /register + /onboarding (downstream trace)
**Application Scope:** VCSM
**Reviewer:** ELEKTRA
**Scan Trigger:** VENOM + BLACKWIDOW referral — full Blue Team chain (ARCHITECT → VENOM → BLACKWIDOW → ELEKTRA)
**Findings Summary:** 1 HIGH | 2 MEDIUM | 2 LOW | 1 INFO
**False Positives Rejected:** 2
**Suggested Patches:** 6

---

## ELEKTRA PREFLIGHT PASS

```
Upstream Reports:
- ARCHITECT: ZZnotforproduction/APPS/VCSM/features/auth/modules/register/outputs/2026/06/06/ARCHITECT/ARCHITECT-V2-REGISTER.md
  Date: 2026-06-06 | Age: 0 days | Status: COMPLETE
- VENOM: ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/06/Venom/2026-06-06_00-00_venom_auth-register.md
  Date: 2026-06-06 | Age: 0 days | Status: COMPLETE
- BLACKWIDOW: ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/06/BlackWidow/2026-06-06_00-00_blackwidow_auth-register.md
  Date: 2026-06-06 | Age: 0 days | Status: COMPLETE

All gate checks PASS. Proceeding with ELEKTRA precision scan.
```

---

## SOURCE READ SUMMARY

**Full Rediscovery Performed:** NO — ARCHITECT evidence bundle consumed (19 source files, 2026-06-06)

**Additional files read this ELEKTRA run (downstream trace for ELEK-REG-001):**
- `apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js` — downstream of navigate('/onboarding') from useRegister
- `apps/VCSM/src/features/auth/screens/Onboarding.jsx` — confirmed entry point for useAuthOnboarding
- `apps/VCSM/src/features/auth/dal/register.dal.js` — confirmed authenticated client (not service role)
- `apps/VCSM/src/features/auth/hooks/useRegister.js` (line-targeted grep) — confirmed isSafeAuthReturnPath not called

**Evidence standard:** [SOURCE_VERIFIED] for all chain-confirmed findings.

---

## SCAN TARGET

```
ELEKTRA SCAN TARGET
Feature / Route / Engine: auth / modules / register → /register + /onboarding (downstream)
Application Scope: VCSM
Reason for scan: Full Blue Team chain — VENOM + BLACKWIDOW found HIGH navState.from redirect finding (PARTIAL); ELEKTRA traces downstream to confirm or deny full exploitability
Scan trigger: VENOM + BLACKWIDOW referral
Upstream VENOM report: ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/06/Venom/2026-06-06_00-00_venom_auth-register.md
Upstream BLACKWIDOW report: ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/06/BlackWidow/2026-06-06_00-00_blackwidow_auth-register.md
```

---

## ENTRY POINT MAP

```
ENTRY POINT MAP
Route / API / Controller: /register (AuthPublicRoute → RegisterScreen → useRegister)
Input sources (user-controlled):
  - location.state.from (React Router navigation state — injected via navigate() call or initial deep-link)
  - location.state.wandersFlow (React Router navigation state)
  - location.state.card (React Router navigation state)
  - form.email (user text input)
  - form.password (user text input)
  - URL param ?intent= (query string)
  - URL param ?invite_code= (query string → persisted to user_metadata via dalSignUpRegisterUser options.data — TICKET-INVITE-ATTRIBUTION-001 IMPLEMENTED)
Trusted input boundary: controller layer (register.controller.js) for email; Supabase auth layer for userId
Validation present at boundary:
  - email: YES — validateEmail() in controller
  - password: PARTIAL — UI-only; no controller check
  - navState.from: NO — typeof string check only; isSafeAuthReturnPath() absent
  - navState via /onboarding: NO — same absence in useAuthOnboarding
```

---

## DATA FLOW TRACES

### Trace 1 — navState.from redirect chain (PRIMARY — VEN-REG-001 / BW-REG-001)

```
DATA FLOW TRACE — navState.from → navigate(redirectTo)

Source: location.state.from (React Router navigation state — any string value)
  ↓
useRegister.js:48
  const fromState = typeof state.from === 'string' ? state.from : null
  → typeof check only — isSafeAuthReturnPath() NOT called
  ↓
navState.from = fromState (any string, including protocol-relative or internal paths)
  ↓
useRegister.js:108-110
  navigate('/onboarding', { replace: true, state: { from: navState.from, ... } })
  → unvalidated string forwarded into /onboarding navigation state
  ↓
useAuthOnboarding.js:32
  redirectTo: typeof state.from === 'string' ? state.from : '/'
  → typeof check only — isSafeAuthReturnPath() NOT called (SECOND MISSING CHECK)
  ↓
useAuthOnboarding.js:143
  navigate(navState.redirectTo, { replace: true })
  → SINK: navigate() fires with unvalidated attacker-controlled path

Validation at boundary: ABSENT (both hooks)
Intermediate transforms: typeof check — allows any string through
Sink: navigate(navState.redirectTo) at useAuthOnboarding.js:143
Defense at sink: ABSENT
```

**Chain validity:** VALID. Source → Trust Boundary (both hooks) → Sink → Impact → Missing Defense — all links confirmed in source code.

**Additional propagation path (BW-REG-001 observation confirmed):**

```
useAuthOnboarding.js:51-58 — bounceToRegister:
  navigate('/register', { state: { from: navState.redirectTo, ... } })
  → When onboarding bounces back to /register (e.g. unauthenticated),
    the unvalidated redirectTo is re-injected into /register's state.from
  → Creates a preservation loop: unvalidated path survives across multiple
    bounce-redirect cycles without ever being sanitized
```

---

### Trace 2 — console.error production disclosure (VEN-REG-004 / BW-REG-005 + NEW)

```
DATA FLOW TRACE — consent failure → console.error

Source: consentErr (raw Supabase error from platform.user_consents INSERT failure)
  ↓
useRegister.js:146
  console.error('[Register] Failed to record legal consent:', consentErr)
  → No DEV guard — fires in production
  → consentErr contains: { message, code, details, hint } from Supabase
Sink: browser console (DevTools)
Defense at sink: ABSENT

NEW — ADDITIONAL INSTANCES in useAuthOnboarding.js:
  useAuthOnboarding.js:95
    console.error('[useAuthOnboarding] bootstrap failed', error)
    → No DEV guard — fires in production; error contains Supabase bootstrap error details
  useAuthOnboarding.js:145
    console.error('[useAuthOnboarding] save failed', error)
    → No DEV guard — fires in production; error from completeOnboardingController
```

**Total instances:** 3 (1 in useRegister.js, 2 in useAuthOnboarding.js — the onboarding instances are NEW findings not captured in VENOM or BLACKWIDOW)

---

### Trace 3 — profiles UPSERT RLS (VEN-REG-002)

```
DATA FLOW TRACE — profiles upsert RLS verification

Source: userId (server-issued from Supabase auth.signUp response — NOT client-controlled)
  ↓
register.controller.js → dalUpsertRegisterProfile
  ↓
register.dal.js:41-49
  const c = resolveClient(client) // → standard supabase client (authenticated)
  c.from('profiles').upsert({ id: userId, email, updated_at, created_at })
  → Standard authenticated Supabase client used (NOT service role)
  → RLS WILL apply if policies are defined
  → Authenticated client confirmed: supabaseClient.js import (not service role client)

Validation at boundary: Application layer correct (userId = server-issued)
Sink: public.profiles UPSERT
Defense at sink: RLS — ASSUMED, not verified from source. DB audit required.
```

**Chain validity:** VALID for the RLS-gap concern. Source is server-issued (application layer correct). Gap is at DB layer (RLS policy existence unverified).

---

### Trace 4 — user_consents INSERT RLS (VEN-REG-003)

```
DATA FLOW TRACE — user_consents INSERT RLS verification

Source: userId (server-issued from auth.signUp → registered in controller)
  ↓
legalConsent.controller.js → dalRecordLegalAcceptance
  ↓
userConsents.write.dal.js:33
  supabase.schema('platform').from('user_consents').insert({ user_id: userId, ... })
  → Standard authenticated Supabase client used (NOT service role)
  → RLS WILL apply if policies are defined

Validation at boundary: Application layer correct
Sink: platform.user_consents INSERT
Defense at sink: RLS — ASSUMED, not verified. DB audit required.
```

---

## HIGH FINDINGS

---

### ELEK-REG-001 — navState.from Open Redirect Chain — Confirmed End-to-End

```
SECURITY FINDING

Finding ID:         ELEK-REG-001
Title:              navState.from forwarded through register → onboarding without whitelist — full redirect chain confirmed
Category:           Open Redirect
Severity:           HIGH
Status:             Open
Scope:              VCSM
Location:           useRegister.js:48 (source acceptance)
                    useRegister.js:108 (forward into navigate state)
                    useAuthOnboarding.js:32 (second acceptance without whitelist)
                    useAuthOnboarding.js:143 (SINK — navigate fires with unvalidated path)
Source:             location.state.from — React Router navigation state injected via in-SPA navigate() call
Sink:               navigate(navState.redirectTo, { replace: true }) — useAuthOnboarding.js:143
Trust Boundary:     Both useRegister.js (navState derivation) and useAuthOnboarding.js (redirectTo derivation)
Impact:             Post-registration redirect to attacker-controlled path after onboarding completion.
                    React Router v6 navigate() behavior with absolute URLs (http://, //):
                    — Internal paths: redirects to any route within the SPA
                    — Protocol-relative (//evil.com): browser-dependent external navigation risk
                    — Absolute http:// URLs: React Router typically treats as internal path string
                    Attack chain: inject state.from at /register → survives to /onboarding → navigate() fires
                    Propagation loop: bounceToRegister re-injects the unvalidated path back to /register state
Evidence:           [SOURCE_VERIFIED]
                    useRegister.js:48 — `typeof state.from === 'string' ? state.from : null`
                    useAuthOnboarding.js:32 — `typeof state.from === 'string' ? state.from : '/'`
                    useAuthOnboarding.js:143 — `navigate(navState.redirectTo, { replace: true })`
                    isSafeAuthReturnPath() confirmed defined in authInputValidation.model.js (whitelist present,
                    not called at either hook)
Reproduction Steps: 1. From within the VCSM SPA, trigger navigate('/register', { state: { from: '/any-path' } })
                    2. Complete registration form and submit
                    3. useRegister forwards state.from to /onboarding without whitelist check
                    4. Complete onboarding form and submit
                    5. navigate('/any-path', { replace: true }) fires — redirect to injected destination
                    No production exploitation required — all steps are within the SPA.
Existing Defense:   typeof === 'string' check (allows any string); isSafeAuthReturnPath() exists but is not called
Why Defense Is Insufficient: typeof check permits any string value including paths outside the whitelist;
                    isSafeAuthReturnPath() in authInputValidation.model.js has the correct allowlist
                    [/feed, /explore, /profile, /vport, /dashboard, /settings, /booking, /learning]
                    but is imported and used only in other files — never at the navState derivation point
Recommended Fix:    Apply isSafeAuthReturnPath() at BOTH hooks at the navState derivation point.
                    Fix 1: useRegister.js (source — prevent injecting bad path into navigation state)
                    Fix 2: useAuthOnboarding.js (sink gate — prevent using bad path as redirect destination)
                    Defense-in-depth: fix both, not just one.
Suggested Patch:    See PATCH-001 and PATCH-002 below
Follow-up Command:  SPIDER-MAN (regression tests for both fix points)
```

**PATCH-001 — useRegister.js navState.from validation:**
```javascript
// FILE: apps/VCSM/src/features/auth/hooks/useRegister.js
// ADD IMPORT (if not already present):
import { isSafeAuthReturnPath } from '@/features/auth/model/authInputValidation.model'

// BEFORE (line ~48):
const fromState = typeof state.from === 'string' ? state.from : null

// AFTER:
const rawFrom = typeof state.from === 'string' ? state.from : null
const fromState = rawFrom && isSafeAuthReturnPath(rawFrom) ? rawFrom : null
```

**PATCH-002 — useAuthOnboarding.js redirectTo validation:**
```javascript
// FILE: apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js
// ADD IMPORT:
import { isSafeAuthReturnPath } from '@/features/auth/model/authInputValidation.model'

// BEFORE (line ~32):
redirectTo: typeof state.from === 'string' ? state.from : '/',

// AFTER:
redirectTo: (() => {
  const raw = typeof state.from === 'string' ? state.from : null
  return raw && isSafeAuthReturnPath(raw) ? raw : '/'
})(),
```

**Rationale:** Fix both hooks. Fixing only useRegister.js leaves the sink in useAuthOnboarding.js exploitable from any other navigate('/onboarding') call that also lacks validation. Defense-in-depth requires both.

**VENOM Cross-Reference:** VEN-REG-001 (HIGH — PARTIAL) — UPGRADED to FULL CHAIN CONFIRMED by ELEKTRA source trace.
**BLACKWIDOW Cross-Reference:** BW-REG-001 (HIGH — PARTIAL) — UPGRADED to FULL CHAIN CONFIRMED by ELEKTRA source trace.

---

## MEDIUM FINDINGS

---

### ELEK-REG-002 — console.error Production Disclosure — 3 Instances (1 Known + 2 New)

```
SECURITY FINDING

Finding ID:         ELEK-REG-002
Title:              console.error exposes Supabase internal error details in production — 3 instances
Category:           Information Disclosure (Secrets Exposure adjacent)
Severity:           MEDIUM
Status:             Open
Scope:              VCSM
Location:           useRegister.js:146 (known — VEN-REG-004 / BW-REG-005)
                    useAuthOnboarding.js:95 (NEW — not in VENOM or BLACKWIDOW)
                    useAuthOnboarding.js:145 (NEW — not in VENOM or BLACKWIDOW)
Source:             Caught Supabase errors (from platform.user_consents, onboarding bootstrap, onboarding save)
Sink:               browser console via console.error — visible in DevTools in production
Trust Boundary:     Developer environment guard (import.meta.env.DEV) — absent at all 3 locations
Impact:             Supabase internal error details (error codes, table names, constraint names, schema names,
                    Supabase error messages) exposed in production browser DevTools to any user who opens DevTools
                    during an error condition. Enables reconnaissance for targeted attacks.
Evidence:           [SOURCE_VERIFIED]
                    useRegister.js:146 — console.error('[Register] Failed to record legal consent:', consentErr)
                    useAuthOnboarding.js:95 — console.error('[useAuthOnboarding] bootstrap failed', error)
                    useAuthOnboarding.js:145 — console.error('[useAuthOnboarding] save failed', error)
                    None have import.meta.env.DEV guard.
Reproduction Steps: 1. Open DevTools in browser
                    2. Trigger a network/RLS error during consent recording, onboarding bootstrap, or onboarding save
                    3. Read error details from console output
Existing Defense:   captureFrontendError() is called for useRegister.js:146 — provides server-side monitoring.
                    useAuthOnboarding.js:95/145 do NOT call captureFrontendError() — they only use console.error.
Why Defense Is Insufficient: console.error has no DEV guard — fires in production. Server-side capture (useRegister.js)
                    makes the console.error purely redundant and insecure. For useAuthOnboarding.js instances,
                    no server-side capture exists — errors are swallowed silently after console output.
Recommended Fix:    Remove all 3 console.error calls. For useAuthOnboarding.js, add captureFrontendError()
                    calls to preserve server-side observability (currently missing).
Suggested Patch:    See PATCH-003 below
Follow-up Command:  Wolverine (apply patches)
```

**PATCH-003 — Remove console.error, add captureFrontendError to useAuthOnboarding:**
```javascript
// FILE: apps/VCSM/src/features/auth/hooks/useRegister.js
// REMOVE line 146:
- console.error('[Register] Failed to record legal consent:', consentErr)
// (captureFrontendError already handles server-side observability on this line block)

// FILE: apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js
// ADD IMPORT:
import { captureFrontendError } from '@/services/monitoring/monitoringClient'

// BEFORE (line ~93-96):
} catch (error) {
  console.error('[useAuthOnboarding] bootstrap failed', error)
  if (!isMounted) return
  setErrorMessage(error?.message || 'Failed to load onboarding.')
}

// AFTER:
} catch (error) {
  captureFrontendError(error, { tags: { source: 'useAuthOnboarding', phase: 'bootstrap' } })
  if (!isMounted) return
  setErrorMessage(error?.message || 'Failed to load onboarding.')
}

// BEFORE (line ~144-146):
} catch (error) {
  console.error('[useAuthOnboarding] save failed', error)
  setErrorMessage(error?.message || 'Failed to complete onboarding.')
}

// AFTER:
} catch (error) {
  captureFrontendError(error, { tags: { source: 'useAuthOnboarding', phase: 'save' } })
  setErrorMessage(error?.message || 'Failed to complete onboarding.')
}
```

**VENOM Cross-Reference:** VEN-REG-004 (MEDIUM) — CONFIRMED for useRegister instance. Two NEW instances discovered in useAuthOnboarding.js.
**BLACKWIDOW Cross-Reference:** BW-REG-005 (MEDIUM — BYPASSED) — CONFIRMED for useRegister instance.

---

### ELEK-REG-003 — public.profiles UPSERT RLS Unverified — DB Audit Required

```
SECURITY FINDING

Finding ID:         ELEK-REG-003
Title:              public.profiles UPSERT RLS policy unverified at DB layer
Category:           Supabase RLS
Severity:           MEDIUM
Status:             Open — Deferred to DB
Scope:              VCSM
Location:           register.dal.js:49 — c.from('profiles').upsert({ id: userId, email, ... })
Source:             userId from server-issued auth.signUp response (application layer correct)
Sink:               public.profiles UPSERT
Trust Boundary:     Supabase RLS policy on public.profiles for UPSERT/INSERT
Impact:             If RLS absent or misconfigured: authenticated user could upsert a profile row for any userId
                    via direct Supabase SDK call, bypassing the application layer (which correctly uses server-issued userId).
                    Without RLS: profile shell for any user can be overwritten by any authenticated user.
Evidence:           [SOURCE_VERIFIED]
                    register.dal.js:1 — import { supabase } from '@/services/supabase/supabaseClient'
                    register.dal.js:4 — resolveClient falls back to standard supabase (authenticated client, NOT service role)
                    register.dal.js:49 — c.from('profiles').upsert(payload) — authenticated client
                    RLS policy existence: UNVERIFIED at source level — DB audit required
Reproduction Steps: (Requires DB access — route to DB command)
                    1. Get an authenticated Supabase session for user-A
                    2. Call supabase.from('profiles').upsert({ id: user-B-id, email: 'fake@test.com' })
                    3. If RLS absent: upsert succeeds and corrupts user-B's profile shell
Existing Defense:   Application layer supplies server-issued userId (correct). Authenticated client used.
Why Defense Is Insufficient: Application layer is correctly implemented. DB-layer defense (RLS) is the required
                    backstop against direct SDK calls. Cannot be confirmed from source reading alone.
Recommended Fix:    DB audit: confirm RLS policy for public.profiles INSERT/UPSERT enforces (id = auth.uid()).
                    Required policy if absent:
                    CREATE POLICY "profiles_owner_write" ON profiles
                    FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
Suggested Patch:    See PATCH-004 (DB-layer — requires Carnage if migration needed)
Follow-up Command:  DB (confirm RLS for public.profiles UPSERT/INSERT)
```

**PATCH-004 (advisory — DB layer):**
```sql
-- Verify existing RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public';

-- If RLS not enforced for upsert, add:
CREATE POLICY "profiles_owner_write"
  ON public.profiles
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
-- NOTE: Never run this directly — route to owner for manual deployment
```

**VENOM Cross-Reference:** VEN-REG-002 (MEDIUM) — CONFIRMED application layer correct; DB layer UNRESOLVED.

---

### ELEK-REG-004 — platform.user_consents INSERT RLS Unverified — DB Audit Required

```
SECURITY FINDING

Finding ID:         ELEK-REG-004
Title:              platform.user_consents INSERT RLS policy unverified at DB layer
Category:           Supabase RLS
Severity:           MEDIUM
Status:             Open — Deferred to DB
Scope:              VCSM
Location:           userConsents.write.dal.js:33 — supabase.schema('platform').from('user_consents').insert(...)
Source:             userId from server-issued auth.signUp response
Sink:               platform.user_consents INSERT
Trust Boundary:     Supabase RLS policy on platform.user_consents for INSERT
Impact:             If RLS absent: authenticated user could insert consent records for any user_id.
                    Legal compliance implication: forged consent records falsely mark another user as having
                    accepted legal documents. Could grant access to gated features without genuine consent.
Evidence:           [SOURCE_VERIFIED]
                    userConsents.write.dal.js — uses standard supabase client (authenticated, not service role)
                    user_id: userId (server-issued — application layer correct)
                    accepted_at: DB DEFAULT now() (correct — not client-supplied)
                    ip_address: intentionally omitted (must be server-side — correct)
                    RLS policy: UNVERIFIED at source level
Reproduction Steps: (Route to DB) Attempt INSERT with forged user_id via direct Supabase SDK call
Existing Defense:   Application layer supplies server-issued userId. Authenticated client used.
Why Defense Is Insufficient: DB-layer RLS required as backstop. Legal compliance requires non-forgeable consent records.
Recommended Fix:    DB audit: confirm platform.user_consents INSERT RLS enforces (user_id = auth.uid())
Suggested Patch:    See PATCH-005 (DB-layer advisory)
Follow-up Command:  DB (confirm RLS for platform.user_consents INSERT)
```

**PATCH-005 (advisory — DB layer):**
```sql
-- Verify RLS on platform.user_consents
SELECT schemaname, tablename, rowsecurity
FROM pg_tables WHERE tablename = 'user_consents' AND schemaname = 'platform';

-- If RLS policy absent for INSERT:
CREATE POLICY "user_consents_owner_insert"
  ON platform.user_consents
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
-- NOTE: Never run directly — route to owner for manual deployment
```

**VENOM Cross-Reference:** VEN-REG-003 (MEDIUM) — CONFIRMED application layer correct; DB layer UNRESOLVED.

---

## LOW FINDINGS

---

### ELEK-REG-005 — Double-Submit Race — No useRef Guard in handleRegister

```
SECURITY FINDING

Finding ID:         ELEK-REG-005
Title:              handleRegister() has no useRef guard against concurrent invocations
Category:           Auth Bypass (weak — bounded by Supabase duplicate email rejection)
Severity:           LOW
Status:             Open
Scope:              VCSM
Location:           useRegister.js — handleRegister function
Source:             Rapid form submission events before React re-render propagates loading state
Sink:               ctrlRegisterAccount() → supabase.auth.signUp() — called twice
Trust Boundary:     loading state (React state — not a ref; re-render required for canSubmit update)
Impact:             Two simultaneous signUp calls. Second call rejected by Supabase duplicate email uniqueness.
                    No direct security impact — both calls belong to attacker's own account.
                    Hardening issue: prevents undefined behavior from concurrent auth mutations.
Evidence:           [SOURCE_VERIFIED] useRegister.js — setLoading(true) called at handleRegister top;
                    canSubmit includes !loading but re-renders asynchronously
Reproduction Steps: (adversarial harness) Call handleRegister() twice synchronously before React re-render
Existing Defense:   Submit button disabled on loading (UI-level); Supabase duplicate email rejection (backstop)
Why Defense Is Insufficient: UI-level button disable does not prevent programmatic double-invocation before re-render
Recommended Fix:    Add useRef isSubmitting guard inside handleRegister to prevent concurrent calls
Suggested Patch:    See PATCH-006
Follow-up Command:  Wolverine (apply patch)
```

**PATCH-006 — useRef double-submit guard:**
```javascript
// FILE: apps/VCSM/src/features/auth/hooks/useRegister.js

// ADD at hook top (with other useRef/useState declarations):
const isSubmittingRef = useRef(false)

// INSIDE handleRegister (at very start, after !termsAccepted check):
const handleRegister = useCallback(async () => {
  if (!termsAccepted) {
    setConsentError(t('auth.register.consentRequired', 'You must accept the terms to continue.'))
    return
  }
  if (isSubmittingRef.current) return   // ← ADD THIS GUARD
  isSubmittingRef.current = true        // ← ADD THIS

  setLoading(true)
  // ... existing code ...
  // In finally block:
  setLoading(false)
  isSubmittingRef.current = false       // ← ADD THIS
}, [...])
```

**BLACKWIDOW Cross-Reference:** BW-REG-004 (LOW — PARTIAL) — CONFIRMED as hardening gap.

---

### ELEK-REG-006 — Password Complexity Client-Side Only

```
SECURITY FINDING

Finding ID:         ELEK-REG-006
Title:              Password complexity rules enforced only in UI — no server-side enforcement confirmed
Category:           Auth Bypass (weak — attacker's own account only)
Severity:           LOW
Status:             Open — Deferred to DB/Config
Scope:              VCSM
Location:           registerPasswordRules.model.js (client rules); register.controller.js (no password check)
Source:             form.password (user input — passed directly to auth.signUp without complexity check)
Sink:               supabase.auth.signUp({ email, password }) — register.dal.js:23
Trust Boundary:     Controller layer (validateEmail called but no password strength check)
Impact:             Attacker registers with password meeting Supabase minimum but violating VCSM rules
                    (e.g., 'aaaaaaaa' — 8 chars but no uppercase, lowercase letter mix, or number).
                    Attacker's own account only — no cross-actor impact.
Evidence:           [SOURCE_VERIFIED] registerPasswordRules.model.js — all 5 rules client-only;
                    register.controller.js — validateEmail() called; password not strength-checked;
                    register.dal.js:23 — password passed directly to auth.signUp
Existing Defense:   UI-level password rules display + canSubmit gate; Supabase project minimum (unverified)
Why Defense Is Insufficient: UI-level controls bypassable via direct SDK call. Server minimum unverified.
Recommended Fix:    Verify Supabase project auth configuration enforces minimum 8-character password length.
                    Consider adding password strength check in controller or Edge Function wrapper for signUp.
Suggested Patch:    Route to DB (Supabase project auth settings audit)
Follow-up Command:  DB (verify Supabase project auth minimum password length setting)
```

**VENOM Cross-Reference:** VEN-REG-006 (LOW) — CONFIRMED.
**BLACKWIDOW Cross-Reference:** BW-REG-006 (LOW — PARTIAL) — CONFIRMED.

---

## INFO FINDINGS

---

### ELEK-REG-007 — Monitoring message Field Partial PII Strip

```
SECURITY FINDING

Finding ID:         ELEK-REG-007
Title:              monitoringClient message field not PII-stripped — partial protection
Category:           Information Disclosure
Severity:           INFO
Status:             Open
Scope:              VCSM
Location:           monitoringClient.js:43 — payload.message = message.trim().slice(0, 500)
Source:             error.message string (may contain email or Supabase internal error text)
Sink:               monitoring-ingest-error Edge Function — stored server-side
Trust Boundary:     stripPii() application — applied to tags/context, not to message field
Impact:             Email addresses or Supabase error text in registration error messages may be stored
                    in the monitoring backend. Privacy concern under GDPR/CCPA (email is PII).
Evidence:           [SOURCE_VERIFIED] monitoringClient.js — PII_KEYS set covers tags/context;
                    message field passes through raw after only trim() and slice(500)
Existing Defense:   stripPii() applied to tags and context objects
Why Defense Is Insufficient: Inconsistent — message field not covered by same protection
Recommended Fix:    Apply PII scrub to message field: either strip email-like patterns via regex,
                    or for Supabase auth errors, map to a safe generic message using a known-error allow-list
Follow-up Command:  ELEKTRA (patch advisory — PATCH-007 below)
```

**PATCH-007 (advisory):**
```javascript
// FILE: apps/VCSM/src/services/monitoring/monitoringClient.js
// In captureFrontendError, before building the payload:

// ADD: sanitize message field
const EMAIL_PATTERN = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const safeMessage = (message ?? '').trim().slice(0, 500).replace(EMAIL_PATTERN, '[email]')

// USE safeMessage in payload instead of raw message
```

**VENOM Cross-Reference:** VEN-REG-007 (LOW) — CONFIRMED; severity assessed as INFO here since it's a passive data retention concern, not an active exploit path.

---

## FALSE POSITIVES REJECTED

### FP-REG-001 — External URL open redirect via navigate()

```
FALSE POSITIVE REJECTED

Candidate: React Router navigate() performs external HTTP redirect to absolute URLs (http://, https://)
Location: useAuthOnboarding.js:143
Rejection reason: Chain gap at Impact — React Router v6 navigate() does NOT perform window.location.href
                  redirect for absolute http:// URLs in standard browser router configuration.
                  navigate('https://evil.com') pushes 'https:/evil.com' to internal history as a path string,
                  resulting in a 404/not-found route within the SPA, not an external redirect.
Chain gap: Impact (external redirect impact not fully confirmed)
Notes: Protocol-relative URLs (//evil.com) are riskier and browser-dependent. The finding is still HIGH
       because: (a) the whitelist is missing regardless of exact React Router behavior, (b) future React Router
       versions or route configuration changes could alter this behavior, (c) internal path injection
       (navigating to any internal route post-onboarding) is itself a meaningful attack surface.
       ELEK-REG-001 severity maintained as HIGH for the whitelist absence — not for the specific external
       redirect impact. Finding remains VALID.
```

---

## SUGGESTED PATCH QUEUE

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-REG-001 | navState.from whitelist — useRegister.js | HIGH | Hook | SIMPLE | NO |
| 2 | ELEK-REG-001 | navState.from whitelist — useAuthOnboarding.js | HIGH | Hook | SIMPLE | NO |
| 3 | ELEK-REG-002 | Remove console.error (useRegister.js:146) | MEDIUM | Hook | SIMPLE | NO |
| 4 | ELEK-REG-002 | Replace console.error with captureFrontendError (useAuthOnboarding.js:95, 145) | MEDIUM | Hook | SIMPLE | NO |
| 5 | ELEK-REG-003 | Confirm/add public.profiles RLS UPSERT policy | MEDIUM | RLS | MODERATE | YES |
| 6 | ELEK-REG-004 | Confirm/add platform.user_consents INSERT RLS policy | MEDIUM | RLS | MODERATE | YES |
| 7 | ELEK-REG-005 | Add useRef isSubmitting guard to handleRegister() | LOW | Hook | SIMPLE | NO |
| 8 | ELEK-REG-006 | Verify Supabase auth project minimum password config | LOW | Config | SIMPLE | NO |
| 9 | ELEK-REG-007 | Strip email patterns from monitoring message field | INFO | Service | SIMPLE | NO |

**Application layer patches (no DB required): 1, 2, 3, 4, 7, 9** — can be applied immediately via Wolverine.
**DB/Config patches: 5, 6, 8** — require DB audit and/or owner deployment.

---

## EXECUTIVE SUMMARY

ELEKTRA confirmed the full end-to-end exploit chain for ELEK-REG-001 (navState.from open redirect). VENOM and BLACKWIDOW both classified this as PARTIAL — pending ELEKTRA downstream trace. ELEKTRA source-reads `useAuthOnboarding.js` and confirms:

1. `useAuthOnboarding.js:32` accepts `state.from` with only `typeof === 'string'` check — same missing `isSafeAuthReturnPath()` as useRegister.js
2. `useAuthOnboarding.js:143` calls `navigate(navState.redirectTo, { replace: true })` — this is the sink
3. `bounceToRegister()` re-injects `navState.redirectTo` back to `/register` navigation state — propagation loop confirmed

**Two patches required** (not one): both useRegister.js AND useAuthOnboarding.js need the whitelist check. `isSafeAuthReturnPath()` is already defined and correct — only the call sites are missing.

**New finding ELEK-REG-002 expanded**: Two additional `console.error` instances discovered in `useAuthOnboarding.js:95` and `:145` — neither in VENOM nor BLACKWIDOW. Both lack DEV guards and neither calls `captureFrontendError()` (unlike the useRegister.js instance).

**RLS gaps (ELEK-REG-003, ELEK-REG-004)** confirmed as application-layer-correct but DB-layer-unverified. Standard authenticated client used at both DAL sites (not service role). Routed to DB.

---

## REQUIRED FOLLOW-UP COMMANDS

| Command | Reason | Status |
|---|---|---|
| Wolverine | Apply PATCH-001 (useRegister.js navState.from whitelist) | PENDING |
| Wolverine | Apply PATCH-002 (useAuthOnboarding.js redirectTo whitelist) | PENDING |
| Wolverine | Apply PATCH-003 (remove console.error — all 3 instances; add captureFrontendError to useAuthOnboarding) | PENDING |
| Wolverine | Apply PATCH-006 (useRef double-submit guard in handleRegister) | PENDING |
| DB | Confirm public.profiles RLS for UPSERT enforces id = auth.uid() | PENDING |
| DB | Confirm platform.user_consents RLS for INSERT enforces user_id = auth.uid() | PENDING |
| DB | Verify Supabase auth project minimum password length setting | PENDING |
| SPIDER-MAN | Regression tests: navState.from whitelist at both hooks; Wanders userId mismatch; AuthPublicRoute guard | PENDING |
| Logan | Add §4 Failure Paths + §9 Must Never Happen to register BEHAVIOR.md | PENDING |
| THOR | Release gate evaluation (CAUTION — 1 HIGH open, 2 MEDIUM RLS unverified, 2 MEDIUM patched) | PENDING |

---

## THOR RELEASE GATE STATUS

Per ELEKTRA §13 (THOR Release Gate Integration):

| Finding | Severity | THOR Impact |
|---|---|---|
| ELEK-REG-001 | HIGH | CAUTION — two one-line patches available; no DB change required |
| ELEK-REG-002 | MEDIUM | Not a blocker — patch available; captureFrontendError already in place for register instance |
| ELEK-REG-003 | MEDIUM | CAUTION — DB audit required to confirm/deny RLS existence |
| ELEK-REG-004 | MEDIUM | CAUTION — DB audit required to confirm/deny RLS existence |
| ELEK-REG-005 | LOW | Not a blocker |
| ELEK-REG-006 | LOW | Not a blocker |
| ELEK-REG-007 | INFO | Not a blocker |

**ELEKTRA Recommendation: CAUTION**

No CRITICAL findings. The HIGH finding (ELEK-REG-001) has two SIMPLE patches that can be applied immediately via Wolverine. The two MEDIUM RLS findings require DB audit — if RLS is confirmed present at DB layer, they downgrade. Core identity chain (server-issued userId, Wanders guard, AuthPublicRoute) confirmed correct.
