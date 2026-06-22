# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-06-05
**Scope:** VCSM — `/forgot-password` screen + full password reset chain (`/reset-password`)
**Reviewer:** BLACKWIDOW
**Environment:** Local runtime — source adversarial simulation
**Upstream VENOM Report:** `ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/05/Venom/2026-06-05_21-30_venom_forgot-password-screen.md`
**VENOM Gate Status:** PASS — Status: SUCCESS, Age: 0 days, Scope: VCSM auth forgot-password
**BLIND_REVERIFY_MODE:** ACTIVE — chains reconstructed from source before VENOM report was consulted
**Governance Status:** DRAFT

---

## BLIND REVERIFY CHECK

| Check | Status |
|---|---|
| Historical reports not loaded during reconstruction | PASS |
| Current ARCHITECT artifacts loaded | SKIP — no architectural ambiguity; source directly readable |
| Current source files re-read | PASS |
| Chain rebuilt from source | PASS |
| Exploitability assessed before report comparison | PASS |

---

## REVERIFY DISCOVERY CHECK

| Check | Status |
|---|---|
| Original finding re-tested | PASS — BW-AUTH-004 recovery nonce bypass re-verified |
| Adjacent flows reviewed | PASS — `AuthProvider.jsx`, `auth.routes.jsx`, `ResetPasswordScreen.jsx` |
| Alternate exploit paths searched | PASS — 8 attack surfaces simulated |
| Patch regressions searched | PASS — no regressions found in this scope |
| New findings assessment completed | PASS |

---

## Attack Surface Summary

The `/forgot-password` screen is a low-surface entry point. The screen itself accepts an email, calls Supabase `resetPasswordForEmail`, shows a neutral success message, and links back to login. The adversarial risk is almost entirely in the downstream reset chain — specifically the `/reset-password` form which uses a client-side nonce to gate access to `supabase.auth.updateUser`.

Surfaces tested:
1. Email form: rate limiting, enumeration, injection, success state bypass
2. Controller: redirectTo origin spoofing, email normalization
3. Recovery nonce gate: sessionStorage forgeability, authenticated bypass path
4. Reset-password route: auth guard bypass, replay of PKCE code
5. Error display: URL-param reflected content (DEV mode)
6. Post-submit state: session sign-out reliability

---

## Simulated Threat Scenarios

### Scenario 1 — Form Resubmission Burst on Error Path

**Hypothesis:** After a network error (catch block), `loading=false` and `successMessage=''` — `canSubmit` re-enables. Attacker can loop submissions to attempt to exceed Supabase server-side rate limit or cause excessive email delivery.

**Simulation:** Submitted form → catch branch fires → error message shown → canSubmit re-enabled → submit again → repeatable.

**Result:** PARTIAL — button-level guard prevents concurrent double-submission but no per-session attempt counter exists. Supabase server-side rate limit is the only floor.

---

### Scenario 2 — Recovery Nonce SessionStorage Forge (BW-AUTH-004 Reverification)

**Hypothesis:** An authenticated user who has read the source can manually write a conforming `vc.auth.recovery` nonce to sessionStorage and bypass the recovery gate on `/reset-password`, reaching `supabase.auth.updateUser` without a legitimate password recovery email.

**Simulation (source-level replay):**
```js
// Browser devtools on any VCSM page while logged in:
sessionStorage.setItem('vc.auth.recovery', JSON.stringify({
  nonce: crypto.randomUUID(),
  issuedAt: Date.now()
}))
// Navigate to /reset-password — no code in URL, no PASSWORD_RECOVERY event fired
```

Step-by-step chain from source:
1. `resolveRecoverySessionController()` called
2. `parseRecoveryParams()` → `{ code: null, error: null, errorDescription: null }`
3. No URL error → no PKCE code → falls to nonce gate
4. `readRecoveryNonce()` → finds forged JSON → `Date.now() - issuedAt` within 30min TTL → returns parsed nonce ✓
5. `dalGetAuthSession()` → returns the live authenticated session ✓
6. Returns `{ ok: true, session }` → `setStatus('ready')` → form renders
7. User submits password → `updatePasswordController` runs → validates rules → calls `dalUpdateUserPassword` → `supabase.auth.updateUser({ password })` with valid JWT
8. Password updated — no recovery email was ever sent

**Result:** EXPLOIT_REACHABLE — STILL_OPEN_SOURCE_VERIFIED
**Defense Gate:** WEAK (client-side sessionStorage nonce, structurally bypassable by source-code-aware user with authenticated session)
**Impact:** Self-exploitation only — no cross-user path; requires authenticated session on the device

---

### Scenario 3 — redirectTo Origin Manipulation

**Hypothesis:** `window.location.origin` used in `sendResetPassword.controller.js` could be manipulated to point the recovery link to an attacker-controlled domain.

**Simulation:** `window.location.origin` is a read-only browser property — cannot be overwritten by page JavaScript. Supabase also validates `redirectTo` against a configured allowlist in the Supabase dashboard.

**Result:** BLOCKED — browser security model + Supabase allowlist both gate this path.

---

### Scenario 4 — Account Enumeration via Response Differentiation

**Hypothesis:** Submit valid registered email vs. random non-existent email; compare success/error messages to determine account existence.

**Simulation:** Both paths show "If an account exists for that email, a reset link has been sent." Error path shows "Unable to send reset email. Please try again." (generic). No identity-revealing differentiation in either success or error output.

**Result:** BLOCKED — neutral messaging enforced at hook level.

---

### Scenario 5 — PKCE Code Replay

**Hypothesis:** Re-navigate to a recovery URL with an already-consumed `?code=` parameter to obtain a second session.

**Simulation chain from source:**
1. `dalExchangeRecoveryCode(code)` → Supabase rejects expired/used code → throws
2. Catch block falls through to `dalGetAuthSession()` → null (session already expired)
3. Returns `{ ok: false, error: null }` → form stays in loading state → 15s timeout → invalid-link card shown

**Result:** BLOCKED — Supabase single-use code enforcement + fallback nonce check handles both legs.

---

### Scenario 6 — DEV Mode URL-Injected Error Text (BW-LOGIN-003 Scope Confirmation)

**Hypothesis:** Crafting a URL like `http://localhost:5173/reset-password?error=any&error_description=<custom+text>` renders attacker-supplied text in the error card in DEV mode.

**Simulation chain from source:**
```
URL: /reset-password?error=access_denied&error_description=Security+team:+call+1-800-BAD
→ parseRecoveryParams() → { code: null, error: 'access_denied', errorDescription: 'Security team: call 1-800-BAD' }
→ import.meta.env.DEV branch → error = 'Security team: call 1-800-BAD'
→ resolveRecoverySessionController() returns { ok: false, error: 'Security team: call 1-800-BAD' }
→ useSetNewPassword: resolve(false, 'Security team: call 1-800-BAD')
→ setErrorMessage('Security team: call 1-800-BAD') → setStatus('invalid')
→ ResetPasswordScreen renders invalid card → <p>{errorMessage}</p>
```
React `{errorMessage}` renders text, escapes HTML. Script injection: ABSENT. Text injection: CONFIRMED.

**In PROD:** Fixed message returned — attacker-supplied `errorDescription` never reaches UI.

**Result:** PARTIAL — text injection confirmed in DEV; PROD properly guarded.

---

### Scenario 7 — Back-to-Login Link Open Redirect

**Hypothesis:** "Back to login" link or `goToLogin` callback accepts a redirect target that could be manipulated.

**Simulation:** Both paths use hardcoded destinations — `<Link to="/login">` and `navigate('/login', { replace: true })`. No external input accepted.

**Result:** BLOCKED.

---

### Scenario 8 — Email Input Injection / Oversized Payload

**Hypothesis:** Submit a specially crafted email string — extremely long, contains special characters, SQL-like patterns — to probe injection risk.

**Simulation:** `String(email || '').trim()` + basic format validation before Supabase call. Supabase handles server-side length and format enforcement. No application-layer SQL surface. React controlled input.

**Result:** BLOCKED — no injection surface at this layer.

---

## Ownership Bypass Results

Not applicable to this screen — forgot-password is a pre-auth flow with no actor ownership context.

---

## Session Mutation Results

**SESSION MUTATION ATTEMPT**
Target: `/reset-password` recovery gate
Attack vector: Manual sessionStorage nonce write while authenticated
Result: BYPASSED (self-exploit; see Scenario 2)
Session binding: ABSENT — no server-side recovery session type enforcement
Severity: MEDIUM

---

## Runtime Abuse Results

No privileged controller endpoints in this screen. Single public mutation: `supabase.auth.resetPasswordForEmail` → no actor context required.

---

## RLS Verification Results

**RLS VERIFICATION ATTEMPT**
Table / View / RPC: `auth.users` (Supabase managed)
Attack vector: `supabase.auth.updateUser({ password })` with valid JWT but no recovery provenance
RLS status: N/A — Supabase auth schema, not application RLS
Result: EXPOSED (self-only) — `updateUser` accepts any valid JWT regardless of session origin
Evidence: `dalUpdateUserPassword` calls `supabase.auth.updateUser({ password: newPassword })` at resetPassword.dal.js:17
Severity: MEDIUM (self-exploit only)

---

## Viewer Context Fuzz Results

Not applicable — pre-auth screen; no viewerActorId context.

---

## Mutation Replay Results

**MUTATION REPLAY ATTEMPT**
Target resource: PKCE recovery code
Resource state at time of replay: Already consumed by first load
Result: BLOCKED — Supabase rejects used codes; fallback nonce path handles gracefully
State check: PRESENT (Supabase server-side)

---

## Hydration Poisoning Results

Not applicable — pre-auth screen; no hydration store interaction.

---

## Cross-Feature Abuse Results

Not applicable — this screen only interacts with Supabase auth directly via DAL layer.

---

## URL Surface Results

**URL SURFACE TEST**
Route: `/forgot-password`, `/reset` (alias)
UUID exposure: ABSENT — email is user-typed, not in URL
Slug enforcement: N/A — no entity IDs in this route

**URL SURFACE TEST**
Route: `/reset-password?error=X&error_description=Y`
UUID exposure: ABSENT
Attacker-controlled parameter rendered in DEV: PRESENT (error_description)
PROD guard: ENFORCED

---

## Notification Abuse Results

Not applicable to this flow. Recovery email is issued by Supabase, not by VCSM notification system.

---

## Auth Callback Replay Results

**AUTH CALLBACK REPLAY ATTEMPT**
Target: PKCE code via `?code=` param on `/reset-password`
Attack vector: Re-navigate to recovery URL with consumed code
Code single-use: ENFORCED (Supabase server-side)
Result: BLOCKED — error path falls through to nonce check, returns `{ ok: false }`, timeout shows invalid card

---

## Search Abuse Results

Not applicable — no search surface on this screen.

---

## Successful Exploit Chains

### Chain 1 — Authenticated Self-Password-Reset Without Recovery Email
```
Attacker has authenticated session on target device
  → Open browser devtools
  → sessionStorage.setItem('vc.auth.recovery', JSON.stringify({nonce: crypto.randomUUID(), issuedAt: Date.now()}))
  → Navigate to /reset-password
  → readRecoveryNonce() finds valid-format nonce → returns parsed object
  → dalGetAuthSession() returns live session
  → resolveRecoverySessionController() → { ok: true, session }
  → Form renders in 'ready' state
  → Submit new password
  → updatePasswordController() validates rules, calls dalUpdateUserPassword()
  → supabase.auth.updateUser({ password: newPassword }) succeeds with valid JWT
  → Password changed — recovery email never sent — original owner locked out if on shared device
```
Type: Injection exploit (forged sessionStorage parameter accepted by controller)
Severity: MEDIUM
Finding: BW-FP-001 (adversarial confirmation of BW-AUTH-004 + VEN-AUTH-001)

---

## Failed Exploit Chains (Defenses That Held)

| Scenario | Defense | Result |
|---|---|---|
| Account enumeration via message differentiation | Neutral success message always shown | BLOCKED |
| PKCE code replay | Supabase single-use enforcement + fallback nonce check | BLOCKED |
| redirectTo origin spoofing | Browser read-only origin + Supabase allowlist | BLOCKED |
| Back-to-login open redirect | Hardcoded navigation targets | BLOCKED |
| Email input injection | Supabase server-side validation | BLOCKED |
| Success-state form bypass | canSubmit gated on !successMessage | BLOCKED |

---

## Runtime Evidence

- `sendResetPassword.controller.js:9` — `redirectTo: \`${window.location.origin}/reset-password\`` — non-spoofable in standard browser context
- `useResetPassword.js:42-43` — catch block returns generic message; Supabase error detail swallowed
- `useResetPassword.js:27-30` — `canSubmit` blocks on `!successMessage` post-success; does NOT block on repeated error retries
- `setNewPassword.controller.js:56-71` — `readRecoveryNonce()` reads from sessionStorage; structurally bypassable
- `setNewPassword.controller.js:104` — DEV branch renders `errorDescription` from URL directly
- `resetPassword.dal.js:17` — `supabase.auth.updateUser` accepts any valid JWT; no recovery provenance check at Supabase API level

---

## Blast Radius

### BW-FP-001 (MEDIUM — Recovery Nonce Bypass)
- Scope: Any user with an authenticated session on a device
- Impact: Password change without recovery email; locks out real owner on shared device
- Cross-user: ABSENT — self-exploit only; JWT is user-scoped
- No RLS boundary crossed; no other user's data accessible

### BW-FP-002 (LOW — Form Error Path Retry, no hard limit)
- Scope: Anyone with access to the forgot-password form
- Impact: Marginal — Supabase rate limit is the only floor; form technically allows burst on error
- No data exposure; no account compromise

### BW-FP-003 (LOW — DEV mode errorDescription text injection)
- Scope: Developers on localhost only
- Impact: Social engineering / phishing via crafted URL shared with a developer
- Production: protected by fixed-message guard

---

## BLACKWIDOW FINDINGS

---

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-FP-001
- Scenario: Authenticated Self-Password-Reset Without Recovery Email
- Target: setNewPassword.controller.js:readRecoveryNonce() + dalUpdateUserPassword()
- Application Scope: VCSM
- Platform Surface: /reset-password (entry via /forgot-password flow)
- Attack Vector: Authenticated user manually writes vc.auth.recovery JSON nonce to sessionStorage; navigates to /reset-password directly
- Exploit Chain Type: Injection exploit (forged sessionStorage parameter accepted by controller)
- Governance Status: DRAFT
- Result: BYPASSED (self-exploit only — no cross-user path)
- Evidence:
    readRecoveryNonce() at setNewPassword.controller.js:56 reads sessionStorage value
    Structurally validates JSON schema (nonce: string, issuedAt: number)
    Date.now() - parsed.issuedAt checked against 30min TTL
    No cryptographic binding to a server-issued token
    dalGetAuthSession() returns live session for any authenticated user
    supabase.auth.updateUser does not enforce recovery session provenance
- Defense Gate: WEAK (client-side sessionStorage nonce, structurally predictable)
- Blast Radius: Self-exploitation only; shared-device account takeover risk
- Severity: MEDIUM
- VENOM Finding Cross-Reference: VEN-AUTH-001 (2026-06-04), BW-AUTH-004 (2026-06-04)
- Status Cross-Reference: STILL_OPEN_SOURCE_VERIFIED — same exploit chain confirmed in current source
- Recommended Fix: Server-side Edge Function that accepts the Supabase session JWT and validates recovery_session_type before forwarding to updateUser. Only sessions where Supabase issued a PASSWORD_RECOVERY token should be permitted.
- Layer to Fix: Auth (Edge Function / server-side RPC)
- Required Follow-up Command: ELEKTRA — chain trace from dalUpdateUserPassword → updateUser → server-side closure options
```

---

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-FP-002
- Scenario: Forgot-Password Form Resubmission Burst on Error Retry Path
- Target: useResetPassword.js:canSubmit / handleReset error path
- Application Scope: VCSM
- Platform Surface: /forgot-password
- Attack Vector: Submit form → network error triggers catch → errorMessage set, loading=false, successMessage='' → canSubmit re-enables → submit again → repeat
- Exploit Chain Type: Single-step exploit (one client-side gate absent)
- Governance Status: DRAFT
- Result: PARTIAL — loading gate prevents concurrent double-submission; no per-session attempt counter prevents burst retries on error
- Evidence:
    useResetPassword.js:27 canSubmit = isValidEmailFormat(email) && !loading && !successMessage
    On catch: loading=false, successMessage='' → canSubmit re-enabled immediately
    No counter, no lockout after N failures, no setTimeout debounce
    Supabase rate limit (server-side) is the only floor
- Defense Gate: WEAK (single layer — server rate limit only)
- Blast Radius: No account compromise; potential email flooding for targeted addresses; Supabase rate limit mitigates practical impact
- Severity: LOW
- VENOM Finding Cross-Reference: VEN-FP-001 (2026-06-05)
- Recommended Fix: Add a per-session attempt counter (max 3–5) with a lockout period (e.g., 60s) on the error retry path. Reset on success.
- Layer to Fix: Hook (useResetPassword.js)
- Required Follow-up Command: None required; THOR evaluates gating
```

---

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-FP-003
- Scenario: DEV Mode URL-Injected Error Text in Reset-Password Error Card
- Target: setNewPassword.controller.js:104 + ResetPasswordScreen.jsx invalid card
- Application Scope: VCSM
- Platform Surface: /reset-password?error=X&error_description=<text>
- Attack Vector: Craft URL with attacker-supplied error_description parameter; share with developer; developer navigates; text appears in "Link expired" error card
- Exploit Chain Type: Injection exploit (URL parameter rendered in UI — text only, not script)
- Governance Status: DRAFT
- Result: PARTIAL — React escapes HTML (no XSS); text content injection confirmed in DEV; PROD uses fixed message
- Evidence:
    setNewPassword.controller.js:104: import.meta.env.DEV ? (errorDescription || ...) : 'fixed message'
    errorDescription = search.get('error_description') || hash.get('error_description') — attacker-controlled
    ResetPasswordScreen.jsx invalid card renders {errorMessage} — React-escaped
    Confirmed: script tags not executable; arbitrary text strings render
    Example: ?error=x&error_description=Call+support+immediately → renders "Call support immediately"
- Defense Gate: PRESENT in PROD (fixed message); ABSENT in DEV
- Blast Radius: DEV only; social engineering vector against developers; no production user impact
- Severity: LOW (DEV-only; documented as BW-LOGIN-003 in source comments)
- VENOM Finding Cross-Reference: Existing code comment BW-LOGIN-003
- Recommended Fix: No production action required. Optional: sanitize errorDescription in DEV too (display a generic [DEBUG: <text>] wrapper) to make intent explicit. Not a required fix before THOR.
- Layer to Fix: Controller (setNewPassword.controller.js DEV branch)
- Required Follow-up Command: None
```

---

## Recommended Fixes

### Priority 1 — BW-FP-001 (MEDIUM, THOR BLOCKER)
Server-side recovery provenance enforcement. Current sessionStorage nonce is a UX gate, not a security gate. Required: Edge Function that validates session origin is PASSWORD_RECOVERY before permitting `updateUser` call.

### Priority 2 — BW-FP-002 (LOW)
Add attempt counter + lockout to `useResetPassword.js` error retry path. Suggested: max 5 attempts per 5-minute window with a countdown timer shown in the error message.

### Priority 3 — BW-FP-003 (LOW, optional)
No production action required. DEV-mode improvement: wrap `errorDescription` in a debug-labeled container to clarify developer intent, preventing confusion if a developer shares a link.

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| ELEKTRA | Trace full chain from dalUpdateUserPassword → supabase.auth.updateUser → server-side closure advisory for BW-FP-001 | PENDING |
| LOKI | Validate runtime telemetry for PASSWORD_RECOVERY event and nonce write path | PENDING |
| THOR | BW-FP-001 is MEDIUM with self-exploit blast radius — evaluate release blocking status | PENDING |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| VENOM | VEN-AUTH-001 still open — source-verified by this run | STILL OPEN |
| LOKI | Validate runtime observability for recovery event path | PENDING |
| THOR | Release eligibility evaluation for auth forgot-password scope | PENDING |
