# VENOM — Forgot-Password Screen Security Review
**Date:** 2026-06-05
**Reviewer:** VENOM
**Scope:** `/forgot-password` screen + full reset-password flow
**Trigger:** Manual — user-requested pass on forgot-password screen
**Prior Run:** 2026-06-04 (auth feature full pass)

---

## VENOM TARGET

```
Feature / Route / Engine: Auth — Forgot Password + Reset Password flow
Application Scope: VCSM
Reason for review: Security pass on the /forgot-password screen and reset flow
Primary trust boundary: Public Visitor → Unauthenticated reset trigger → PASSWORD_RECOVERY session → Authenticated password update
```

---

## SECURITY SURFACE

```
Entry point:        /forgot-password (AuthPublicRoute-gated)
Auth source:        None — public visitor; no session required
Authorization layer: Client-side email format validation + Supabase SDK rate limiting
Identity surface:   User-supplied email address (no actorId involved)
Sensitive objects:  User email, Supabase recovery token in reset link, recovery session JWT
```

---

## TRUST BOUNDARY TRACE

```
Client input:        Email address (free text)
Validated at:        Hook (isValidEmailFormat regex) + Supabase server (email format + account existence)
Identity resolved at: Supabase server on token exchange (dalExchangeRecoveryCode)
Authorization enforced at: Supabase token exchange (single-use code) + sessionStorage nonce (client-side only)
Data returned to:   Success/error message only — no account existence revealed
```

---

## STEP 4 — SECURITY RISK FINDINGS

### Confirmed Prior Findings Still In Scope

| Finding ID | Severity | Status | Notes |
|---|---|---|---|
| VEN-AUTH-001 | HIGH | STILL OPEN | Recovery session provenance check is client-side only — applies to /reset-password reached from this flow |
| VEN-AUTH-005 | LOW | STILL OPEN | appendIOSProdDebugLog in AuthProvider logs userId during PASSWORD_RECOVERY event (dev-only, gated by IS_PROD) |

### New Findings — Forgot-Password Screen Specific

---

## VENOM SECURITY FINDING — VEN-FP-001

- **Finding ID:** VEN-FP-001
- **Location:** [useResetPassword.js](apps/VCSM/src/features/auth/hooks/useResetPassword.js)
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Public Visitor
- **Boundary Violated:** None — public surface; risk is amplification of Supabase rate-limit reliance
- **Contract Violated:** None
- **Current behavior:** After a failed reset email attempt, `loading` returns to `false` and `canSubmit` becomes `true` immediately (as long as email is valid format). No cooldown, no attempt counter, no CAPTCHA. The only submission guard is the in-flight `loading` state — which only blocks double-clicks during the single in-flight request.
- **Risk:** An attacker or automated script can submit the forgot-password form in rapid succession for an arbitrary list of email addresses. The only protection is Supabase's server-side rate limiting on `resetPasswordForEmail`. If that limit is misconfigured (e.g., project quota set too high, or anon key leaks allow distributed submission), the app provides no client-side backstop against bulk account-probing or abuse.
- **Severity:** MEDIUM
- **Exploitability:** MEDIUM — requires no authentication; only a valid-format email string per request; fully scriptable from a browser or any HTTP client via the Supabase REST endpoint
- **Attack Preconditions:**
  - Unauthenticated visitor
  - Access to the app URL
  - List of email addresses to probe (or random spray)
- **Blast Radius:** Multi-actor — can probe the existence of any account's email at the Supabase rate-limit speed
- **Identity Leak Type:** None (success message is intentionally neutral — "If an account exists...")
- **Cache Trust Type:** None
- **RLS Dependency:** NONE — entirely app-layer and Supabase SDK
- **Why it matters:** Defense-in-depth requires that the UI layer not depend exclusively on server-side rate limiting. If Supabase rate limits are permissive (e.g., 100 req/hour per anon IP), an attacker can submit dozens of requests before triggering a block. Client-side throttle or CAPTCHA is the standard practice for public reset forms.
- **Recommended mitigation:**
  1. Add a per-session submission cooldown: after any submit (success or error), enforce a minimum 30–60 second wait before re-enabling the button. Track via `lastSubmitAt` timestamp in hook state.
  2. Optionally: cap attempts per session (e.g., max 3) before requiring page reload.
  3. Long-term: add CAPTCHA (hCaptcha or Cloudflare Turnstile) on the form for production.
- **Rationale:** Standard practice for forgot-password forms. Does not change UX for legitimate users (they submit once and wait for the email).
- **Follow-up command:** SPIDER-MAN (regression test for cooldown enforcement)
- **CISSP Domain:**
  - Primary: Security and Risk Management (missing defense-in-depth control)
  - Secondary: Software Development Security (no client-layer throttle implementation)

---

## VENOM SECURITY FINDING — VEN-FP-002

- **Finding ID:** VEN-FP-002
- **Location:** [supabaseClient.js](apps/VCSM/src/services/supabase/supabaseClient.js)
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Public Visitor
- **Boundary Violated:** None — affects security posture of recovery link format
- **Contract Violated:** None
- **Current behavior:** The Supabase client is initialized without an explicit `flowType`. The `auth` config block contains `persistSession`, `autoRefreshToken`, `detectSessionInUrl`, and `storageKey` — but NOT `flowType`. The `setNewPassword.controller.js` defensively reads BOTH `window.location.search` (PKCE `?code=`) AND `window.location.hash` (implicit `#access_token=`) in `parseRecoveryParams()`, suggesting the developer is hedging against both flow types.
- **Risk:** Without explicit `flowType: 'pkce'`, the flow type depends on the supabase-js v2 library default for the installed version (`^2.50.0`). If the default is `'implicit'` at this version, password recovery links will deliver the access token in the URL hash (`#access_token=...&type=recovery`). Hash fragments are:
  - Stored in browser history
  - Potentially captured by browser extensions
  - Included in Referrer headers in some configurations
  - Accessible to any JavaScript on the page (including injected analytics)
  PKCE (`flowType: 'pkce'`) is the more secure alternative — the recovery code is exchanged server-side for a session, and the code itself is single-use and valueless without the code verifier.
- **Severity:** LOW
- **Exploitability:** LOW — requires the attacker to have access to browser history, installed extensions, or analytics data of the victim; not directly exploitable from the outside
- **Attack Preconditions:**
  - Access to victim's browser history or extension logs
  - OR malicious extension installed on victim's browser
- **Blast Radius:** Single actor — affects one user's recovery session at a time
- **Identity Leak Type:** Internal UUID exposure (access token contains user ID claims)
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** PKCE is universally recommended over implicit flow for security-sensitive flows. Explicit configuration avoids dependence on library version defaults and makes the security posture clear and auditable.
- **Recommended mitigation:**
  ```js
  const client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-auth-main',
      flowType: 'pkce',   // ← add explicit PKCE
    },
  })
  ```
  This is a single-line addition with no behavioral change if the library already defaults to PKCE. The `setNewPassword.controller.js` already handles the `?code=` PKCE path correctly.
- **Rationale:** Aligns with OWASP recommendations for OAuth/PKCE flows in SPAs. Eliminates dependency on library version defaults.
- **Follow-up command:** ELEKTRA (source chain trace to confirm which flow type is active at runtime)
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering (defense-in-depth, secure defaults)
  - Secondary: Identity and Access Management (session token delivery channel)

---

## VENOM SECURITY FINDING — VEN-FP-003

- **Finding ID:** VEN-FP-003
- **Location:** [sendResetPassword.controller.js](apps/VCSM/src/features/auth/controllers/sendResetPassword.controller.js)
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Public Visitor
- **Boundary Violated:** None
- **Contract Violated:** None
- **Current behavior:** The `redirectTo` URL is constructed as:
  ```js
  redirectTo: `${window.location.origin}/reset-password`
  ```
  `window.location.origin` is the browser's current origin (e.g., `https://vibezcitizens.com`). No code validates that this origin matches an expected production domain before passing it to Supabase.
- **Risk:** Supabase's allowed redirect URLs list on the project dashboard is the authoritative gate. However, if the project's allowed list includes development origins (e.g., `http://localhost:5173/*`) alongside production, or uses a wildcard pattern, an attacker who can control the page's origin context (e.g., iframe in a controlled domain, webview in a malicious app) could influence where the recovery link redirects. In a standard browser deployment this cannot be manipulated.
- **Severity:** LOW
- **Exploitability:** LOW — requires the attacker to control the origin context; not possible in standard browser deployment
- **Attack Preconditions:**
  - Attacker must control the browser context's origin (e.g., through a malicious PWA install or webview)
  - Supabase project allowed URLs must be permissive enough to accept the manipulated origin
- **Blast Radius:** Single actor — one victim user at a time
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Hardcoding the production origin as a validated constant is cleaner than relying on `window.location.origin`, which can vary by deployment context. Defense-in-depth principle.
- **Recommended mitigation:**
  ```js
  // Option 1: Use env var for the explicit app URL
  const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin
  redirectTo: `${APP_URL}/reset-password`
  
  // Option 2: Add origin allowlist check
  const ALLOWED_ORIGINS = ['https://vibezcitizens.com']
  const origin = ALLOWED_ORIGINS.includes(window.location.origin)
    ? window.location.origin
    : ALLOWED_ORIGINS[0]
  redirectTo: `${origin}/reset-password`
  ```
- **Rationale:** Eliminates reliance on `window.location.origin` in security-sensitive redirect construction. `VITE_APP_URL` env var is a common pattern for PWA/Vite projects.
- **Follow-up command:** None
- **CISSP Domain:**
  - Primary: Software Development Security (secure coding pattern)
  - Secondary: Security Architecture and Engineering (defensive configuration)

---

## CONFIRMED CLEAN / POSITIVE SECURITY OBSERVATIONS

| Observation | Location | Notes |
|---|---|---|
| Neutral success message | useResetPassword.js:42 | "If an account exists..." — no email enumeration possible via success path |
| Neutral error message | useResetPassword.js:44 | Generic error — does not reveal account existence |
| errorDescription URL param sanitized in prod | setNewPassword.controller.js:104 | `import.meta.env.DEV` gate prevents attacker-controlled text in production error display (BW-LOGIN-003 already documented) |
| Recovery nonce structural validation | setNewPassword.controller.js:55-71 | `readRecoveryNonce()` checks nonce is string, issuedAt is number, and enforces 30-min TTL |
| Recovery flag cleared on all non-recovery auth transitions | AuthProvider.jsx:127-130 | SIGNED_IN, SIGNED_OUT, USER_UPDATED all clear the nonce |
| Form canSubmit blocks success-state resubmission | useResetPassword.js:27-30 | Once successMessage is set, canSubmit=false permanently for that session |
| appendIOSProdDebugLog production gated | iosProdDebugger.js:5,222 | `IS_PROD` build-time constant prevents any logging in production builds |
| /reset and /forgot-password both behind AuthPublicRoute | auth.routes.jsx:29-44 | Authenticated users redirected to /feed on both routes |
| noValidate + custom validation | ForgotPasswordScreen.jsx:75 | Custom validation (canSubmit) replaces native browser validation — server validates authoritatively |

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-FP-001 | No client-side rate limiting on form resubmission | UI / Controller | P2 | App | SPIDER-MAN |
| VEN-FP-002 | flowType not explicitly set — implicit vs PKCE ambiguity | Controller (supabaseClient.js config) | P2 | App | ELEKTRA |
| VEN-FP-003 | redirectTo uses window.location.origin without hardcoded validation | Controller | P3 | App | None |
| VEN-AUTH-001 | Client-side-only recovery provenance — no server-side enforcement | Edge Function (new) | P1 | Security | ELEKTRA |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---|---|
| Security and Risk Management | 1 | VEN-FP-001 — missing defense-in-depth layer |
| Asset Security | 0 | Email handled safely; no internal ID exposure on this screen |
| Security Architecture and Engineering | 2 | VEN-FP-002 (PKCE), VEN-FP-003 (redirectTo), VEN-AUTH-001 (provenance) |
| Communication and Network Security | 0 | No direct route or RPC exposure risks on this screen |
| Identity and Access Management | 1 | VEN-AUTH-001 — recovery session provenance gap (from prior run, still open) |
| Security Assessment and Testing | 0 | No specific coverage gaps surfaced in this pass |
| Security Operations | 0 | appendIOSProdDebugLog is production-gated; no operational leak |
| Software Development Security | 2 | VEN-FP-002, VEN-FP-003 — secure coding hardening items |

**Uncovered CISSP Domains:**
- Security Assessment and Testing — not applicable in this targeted UI pass (test coverage handled by SPIDER-MAN)
- Security Operations — covered by prior VENOM pass; no new operational risks on this screen

---

## SOURCE READ SUMMARY

Files read for this review:

| File | Purpose |
|---|---|
| ForgotPasswordScreen.jsx | UI surface — form rendering, success/error states |
| useResetPassword.js | Hook — email validation, canSubmit, handleReset, auto-redirect |
| sendResetPassword.controller.js | Controller — email normalization, redirectTo construction |
| resetPassword.dal.js | DAL — Supabase resetPasswordForEmail, exchangeCodeForSession, updateUser, signOut |
| setNewPassword.controller.js | Controller — recovery nonce, PKCE code exchange, password update |
| useSetNewPassword.js | Hook — recovery session resolution, form state, password update |
| ResetPasswordScreen.jsx | Reset form UI — status states, password rules |
| auth.routes.jsx | Route config — AuthPublicRoute gates, /reset-password intentional exclusion |
| AuthProvider.jsx | Auth context — PASSWORD_RECOVERY handler, nonce write, debug logging |
| supabaseClient.js | Supabase client config — flowType check |
| iosProdDebugger.js | Debug logger — IS_PROD gate verification |

Full Rediscovery Performed: NO (targeted pass on forgot-password scope; prior full-auth VENOM run: 2026-06-04 is the baseline)

---

## VENOM RECOMMENDATION

**CAUTION** — 3 new findings (0 CRITICAL, 1 MEDIUM, 2 LOW) plus VEN-AUTH-001 (HIGH) still open from prior run.

The `/forgot-password` screen is well-implemented at the UI/UX layer — neutral messaging, proper canSubmit guards, recovery nonce structurally validated. The new findings are hardening items. The blocking concern remains VEN-AUTH-001 (client-side recovery provenance only) which carries into the reset-password flow reached from this screen.

THOR eligibility blocked by VEN-AUTH-001 (HIGH, still open).

---

*VENOM is read-only. No files were modified. All findings are recommendations only.*
