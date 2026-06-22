# VENOM SECURITY REPORT — VCSM:auth ForgotPassword
**Date:** 2026-06-05
**Reviewer:** VENOM V2
**Scope:** VCSM:auth — ForgotPassword sub-module (Phase 1 + Phase 2 password reset flow)
**ARCHITECT Gate:** PASS — `ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/05/ARCHITECT/vcsm.auth.forgotpassword.architecture.md`
**Ticket:** TICKET-SEC-AUTH-FORGOT-001

---

## VENOM ARCHITECT GATE

```
VENOM ARCHITECT GATE PASS

Upstream Report:
- ARCHITECT: ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/05/ARCHITECT/vcsm.auth.forgotpassword.architecture.md
  Scope: VCSM:auth-forgotpassword
  Date: 2026-06-05
  Status: SUCCESS
  Age: 0 days

Proceeding with VENOM analysis.
```

---

## Source Read Summary

Full Rediscovery Performed: NO (consumed ARCHITECT evidence-bundle; targeted source reads for verification only)

Additional source reads performed for finding verification:
- `grep dalUpdateUserPassword` — confirmed 0 callers
- `grep isValidEmailFormat` — confirmed 2 definitions, 1 caller (useResetPassword)
- `grep dalSendResetPasswordEmail` — confirmed 1 caller (sendResetPassword.controller.js)
- `useSetNewPassword.js` — full read to verify password update path uses secure route

---

## Execution Chain Reconstructed

```
Phase 1 — Email Reset Request:
  ForgotPasswordScreen (routes: /forgot-password, /reset — wrapped in AuthPublicRoute)
    → useResetPassword.handleReset
      → canSubmit guard: isValidEmailFormat && !loading && !success && cooldown===0
        → ctrlSendResetPasswordEmail(email)
          → validateEmail(email)                [normalize + length + format]
            → dalSendResetPasswordEmail({ email, redirectTo })
              → supabase.auth.resetPasswordForEmail(email, { redirectTo })
                [redirectTo = window.location.origin + '/reset-password' — STATIC]

Phase 2 — Recovery Session Resolution (AuthProvider):
  Supabase PASSWORD_RECOVERY auth event
    → AuthProvider event handler
      → dalRegisterRecoveryPermit()
        → auth-register-recovery Edge Function (POST, JWT-authenticated)
          → platform.auth_recovery_permits INSERT
            → _setRecoveryFlag(permitId)  [sessionStorage: UX gate only]
              → navigate('/reset-password')

Phase 3 — Password Update:
  ResetPasswordScreen → useSetNewPassword.handleSubmit
    → updatePasswordController({ password })
      → evaluateRegisterPasswordRules(password)   [validation]
      → readRecoveryPermit()                      [sessionStorage UUID + issuedAt + TTL]
        → dalUpdatePasswordSecure({ permitId, password })
          → auth-reset-password-secure Edge Function (POST, JWT-authenticated)
            → validate: permitId vs DB (user_id match, used_at IS NULL, expires_at > now)
              → admin.updateUserById (password update)
                → dalSignOutRecoverySession()     [scope: 'local']
```

---

## FINDINGS

---

### VENOM-FP-001 — Orphaned export `dalUpdateUserPassword` bypasses server-side recovery permit

**VENOM SECURITY FINDING**
- **Finding ID:** VENOM-FP-001
- **Location:** `apps/VCSM/src/features/auth/dal/resetPassword.dal.js:16-20`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Auth API
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Recovery permit security model
- **Contract Violated:** Actor Ownership Contract (recovery permit bypass)
- **Current behavior:** `dalUpdateUserPassword` is exported from `resetPassword.dal.js` and calls `supabase.auth.updateUser({ password: newPassword })` directly. It has ZERO callers in the codebase (confirmed by grep). The secure flow uses `dalUpdatePasswordSecure` (via Edge Function) which validates a `platform.auth_recovery_permits` row before updating the password.
- **Risk:** Any future caller of `dalUpdateUserPassword` that does NOT first validate a recovery permit would bypass the server-side two-layer security model. A user with ANY authenticated session (not just PASSWORD_RECOVERY) calling this function could update their password without a recovery permit.
- **Severity:** MEDIUM
- **Exploitability:** LOW (requires a developer to add an unsecured caller; currently unexploited — zero callers confirmed)
- **Attack Preconditions:**
  - Authenticated session required
  - A developer must add a caller to `dalUpdateUserPassword` without the permit gate
- **Blast Radius:** Single actor (password changed for the authenticated user only)
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE (Supabase auth API, not DB tables)
- **Why it matters:** The two-layer recovery permit model (sessionStorage UX gate + DB permit server boundary) was specifically built (TICKET-AUTH-RESET-SECURITY-001) to close a sessionStorage forgery bypass. An unguarded call to `dalUpdateUserPassword` would reopen a weaker version of that bypass — a user with an active session (obtained via any means, including a stolen session) could change the account password without the recovery gate.
- **Recommended mitigation:** Remove `dalUpdateUserPassword` from `resetPassword.dal.js`. If a "change password while logged in" feature is needed in the future, it must be implemented through the Edge Function path with appropriate guards, not via direct `supabase.auth.updateUser`.
- **Rationale:** Dead exports in security-sensitive DAL files are latent vulnerabilities. The export has served no purpose since the secure flow was implemented. Its presence is misleading to future developers.
- **Follow-up command:** GREENGOBLIN (verify no undocumented callers exist in any branch); ELEKTRA (propose patch — safe removal)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering

---

### VENOM-FP-002 — `isValidEmailFormat` duplicated across two model files — regex drift risk

**VENOM SECURITY FINDING**
- **Finding ID:** VENOM-FP-002
- **Location:**
  - `apps/VCSM/src/features/auth/model/resetPassword.model.js:1-3`
  - `apps/VCSM/src/features/auth/model/authInputValidation.model.js:41-43`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Public Visitor
- **Boundary Violated:** None currently — same regex, same behavior
- **Contract Violated:** None currently
- **Current behavior:** `isValidEmailFormat` is implemented independently in both model files with identical regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. `useResetPassword` imports the thin version from `resetPassword.model.js` for form-submission gating (client-side `canSubmit`). The controller (`sendResetPassword.controller.js`) uses `validateEmail` from `authInputValidation.model.js`, which internally calls the same check as part of full validation.
- **Risk:** If the regex in one file is updated (e.g., to fix an edge case or tighten validation), the other file may not be updated. The form-gate and controller-gate would then apply different validation rules. An email passing the hook's check might fail the controller's check (or vice versa), causing confusing UX. If the controller's version is weakened while the hook's is not (or vice versa), a bypass path could emerge.
- **Severity:** LOW
- **Exploitability:** LOW (requires active code change to diverge; currently identical)
- **Attack Preconditions:** Developer updates one regex file without updating the other
- **Blast Radius:** Single actor (email validation only)
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Security-sensitive validation logic should have a single source of truth. Two implementations of the same predicate create maintenance risk.
- **Recommended mitigation:** Remove `isValidEmailFormat` from `resetPassword.model.js`. Update `useResetPassword.js` to import `isValidEmailFormat` from `authInputValidation.model.js` instead. Delete `resetPassword.model.js` after verifying no other consumers exist.
- **Rationale:** Single source of truth for email format validation. The controller already uses the comprehensive version; the hook should too.
- **Follow-up command:** ELEKTRA (patch advisory — safe consolidation); GREENGOBLIN (verify no other consumers of resetPassword.model.js)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security and Risk Management

---

### VENOM-FP-003 — Client-side 60-second cooldown bypassable via page reload

**VENOM SECURITY FINDING**
- **Finding ID:** VENOM-FP-003
- **Location:** `apps/VCSM/src/features/auth/hooks/useResetPassword.js:7,54`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Public Visitor
- **Boundary Violated:** None (intended as UX gate, not security boundary)
- **Contract Violated:** None
- **Current behavior:** `COOLDOWN_SECONDS = 60` is stored in React component state (`useState(0)`). It resets to 0 on page reload, new tab, or component unmount/remount. It applies in the `finally` block after every submission attempt (success or error).
- **Risk:** An attacker can bypass the 60-second cooldown by reloading the page between submissions. This allows rapid submission of password reset emails to any address at page-reload rate. The real rate limiting defense is Supabase server-side auth email rate limiting.
- **Severity:** LOW
- **Exploitability:** MEDIUM (trivially bypassed by page reload; no technical sophistication required)
- **Attack Preconditions:**
  - No account required (public route)
  - Known or guessed email address
- **Blast Radius:** Multi-actor (any email address can be targeted)
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** The cooldown is correctly documented as a UX-only guard, but BEHAVIOR.md lacks a documented statement of this boundary. Without clear documentation, a future developer might rely on the client cooldown as a security control. Also, if Supabase's server-side rate limit is ever raised or removed, the app would have no fallback defense.
- **Recommended mitigation:**
  1. Document in BEHAVIOR.md: "The 60-second cooldown is a UX-only gate. It is bypassable by page reload. Supabase server-side rate limiting is the authoritative security boundary for reset email frequency."
  2. Consider tracking the last submission timestamp in `sessionStorage` (persists across reloads within the same session) to provide a reload-resistant cooldown. This is UX hardening, not security-critical.
- **Rationale:** The control is correctly labeled UX-only in code comments, but there is no formal behavioral contract documenting this limitation.
- **Follow-up command:** SPIDER-MAN (add BEHAVIOR.md invariant for cooldown scope)
- **CISSP Domain:**
  - Primary: Security and Risk Management
  - Secondary: Software Development Security

---

### VENOM-FP-004 — DEV-mode attacker-controlled `error_description` URL param flows to error message state

**VENOM SECURITY FINDING**
- **Finding ID:** VENOM-FP-004
- **Location:** `apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js:107-110`
- **Application Scope:** VCSM
- **Platform Surface:** PWA (DEV environment only)
- **Trust Boundary:** Public Visitor
- **Boundary Violated:** Input sanitization in DEV mode
- **Contract Violated:** None (production is correctly guarded)
- **Current behavior:**
  ```js
  error: import.meta.env.DEV
    ? (errorDescription || 'Reset link is invalid.')
    : 'Reset link is invalid or has expired. Please request a new one.'
  ```
  `errorDescription` comes from `window.location.search → URLSearchParams.get('error_description')`. In DEV mode, this attacker-controlled value is returned as the error message. In PROD, a fixed safe string is returned.
- **Risk:** In DEV mode: crafting `/reset-password?error=any&error_description=<payload>` causes the attacker-controlled payload to flow into `errorMessage` state in `useSetNewPassword`. If `ResetPasswordScreen` renders `errorMessage` as text (JSX — auto-escaped), this is harmless. If rendered via `dangerouslySetInnerHTML`, it becomes a reflected XSS in DEV.
- **Severity:** LOW (DEV-only; PROD is correctly guarded)
- **Exploitability:** LOW (DEV mode only; no production impact)
- **Attack Preconditions:**
  - DEV environment required
  - Target must be a developer with a DEV build open in their browser
- **Blast Radius:** Single developer session
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** The risk is correctly noted in the source comment (`BW-LOGIN-003`). Production is safe. However, the DEV behavior could mislead a developer into thinking the error surface is safe when it includes external input. If `ResetPasswordScreen.jsx` ever adds `dangerouslySetInnerHTML` for the error message (even in DEV), this becomes reflected XSS.
- **Recommended mitigation:**
  1. In DEV mode, sanitize `errorDescription` to alphanumeric + basic punctuation before returning it. This preserves debug value without allowing HTML injection.
  2. Alternatively, always use the fixed safe string and log `errorDescription` to the console only in DEV.
- **Rationale:** Defense-in-depth — DEV builds are sometimes shared or demo'd. Keeping all error messages attacker-input-free is cleaner regardless of environment.
- **Follow-up command:** ELEKTRA (propose sanitization patch for DEV path); BLACKWIDOW (verify ResetPasswordScreen rendering path for errorMessage)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Communication and Network Security

---

### VENOM-FP-005 — No app-level observability for password reset attempts

**VENOM SECURITY FINDING**
- **Finding ID:** VENOM-FP-005
- **Location:** `apps/VCSM/src/features/auth/hooks/useResetPassword.js:40-56`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Public Visitor
- **Boundary Violated:** None
- **Contract Violated:** None
- **Current behavior:** Password reset attempts (success and error) produce no app-layer audit signal. The `try/catch` block in `handleReset` discards the error entirely. Supabase records auth events server-side, but the app has no visibility into reset attempt frequency, pattern, or outcome.
- **Risk:** If an attacker is enumerating emails or flooding the reset endpoint, the app team has no app-side signal. Detection depends entirely on Supabase dashboard monitoring.
- **Severity:** LOW
- **Exploitability:** N/A (this is an observability gap, not an exploitable vulnerability)
- **Attack Preconditions:** None — any public visitor can attempt resets
- **Blast Radius:** Multi-actor (all users can be targeted for reset spam)
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** The forgot-password path is a public unauthenticated endpoint that triggers email delivery. Without app-layer observability, the team cannot detect abuse patterns, investigate incidents, or satisfy compliance audit requirements for auth event logging.
- **Recommended mitigation:**
  1. Add a lightweight event signal on reset attempt (similar to existing `debugLoginEvent` pattern used in AuthProvider).
  2. Log: attempt timestamp, success/fail, hashed email (not plaintext). Route to LOKI for implementation guidance.
- **Rationale:** Security operations require visibility into auth-sensitive actions. The existing `debugLoginEvent` pattern in AuthProvider shows the capability already exists.
- **Follow-up command:** LOKI (runtime observability implementation); SPIDER-MAN (add observability check to BEHAVIOR.md)
- **CISSP Domain:**
  - Primary: Security Operations
  - Secondary: Security and Risk Management

---

### VENOM-FP-006 — No regression test coverage for ForgotPassword security behaviors

**VENOM SECURITY FINDING**
- **Finding ID:** VENOM-FP-006
- **Location:** `apps/VCSM/src/features/auth/` (no test files found for ForgotPassword path)
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Public Visitor / Authenticated Citizen
- **Boundary Violated:** Security Assessment and Testing
- **Contract Violated:** None
- **Current behavior:** No test files exist for `ForgotPasswordScreen`, `useResetPassword`, or `sendResetPassword.controller.js`. Security-sensitive behaviors are unprotected by regression coverage:
  - Email enumeration prevention (same success message regardless of email existence)
  - Cooldown reset behavior after every submission (success and error)
  - Email validation rejection of malformed inputs
  - `canSubmit` gate — disabled state when loading, success, or cooldown active
  - Controller validation bypass prevention (direct call without canSubmit gate)
- **Risk:** Any refactor, translation key change, or controller modification could inadvertently break email enumeration prevention or validation logic without a failing test surfacing the regression.
- **Severity:** MEDIUM (governance — no direct exploitability, but unprotected security-critical path)
- **Exploitability:** N/A
- **Attack Preconditions:** N/A
- **Blast Radius:** All users (if enumeration prevention regresses)
- **Identity Leak Type:** Resource enumeration (if success/error message distinction is reintroduced)
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** The email enumeration prevention in this screen is critical to user privacy. The current implementation is correct, but there is no test that would catch a regression (e.g., a future translation key change that accidentally shows "Email not found" on error).
- **Recommended mitigation:**
  1. Add unit tests for `useResetPassword`: success state → generic message, error state → generic message, cooldown behavior.
  2. Add unit tests for `sendResetPassword.controller.js`: email normalization, length rejection, format rejection.
  3. Add integration test: submit with non-existent email → verify response is same as valid email (no enumeration).
- **Rationale:** Security-critical paths without tests are release risks. The authCallback.controller.test.js exists for the callback flow; parity testing is needed for the reset flow.
- **Follow-up command:** SPIDER-MAN (test implementation); BLACKWIDOW (adversarial coverage of enumeration path)
- **CISSP Domain:**
  - Primary: Security Assessment and Testing
  - Secondary: Software Development Security

---

### VENOM-FP-007 — `/reset-password` intentionally unguarded by AuthPublicRoute (known, accepted design)

**VENOM SECURITY FINDING**
- **Finding ID:** VENOM-FP-007
- **Location:** `apps/VCSM/src/app/routes/public/auth.routes.jsx:46-63`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Public Visitor / Authenticated Citizen (PASSWORD_RECOVERY session)
- **Boundary Violated:** None — intentional design
- **Contract Violated:** None
- **Current behavior:** `/reset-password` is NOT wrapped in `AuthPublicRoute`. The comment in the route file (`// VENOM-AUTH-002`) explains: wrapping would redirect PASSWORD_RECOVERY users (who have a non-null `user`) to `/feed`, breaking the recovery flow. Access control is enforced by `setNewPassword.controller.js` via `readRecoveryPermit()` + server-side DB permit validation.
- **Risk:** A normal logged-in user navigating directly to `/reset-password` sees a 15-second loading spinner then an "invalid link" error. They cannot complete the form. This is correct UX. There is no security gap.
- **Severity:** INFO (acknowledged, no action needed)
- **Exploitability:** LOW (normal logged-in users cannot complete the form; recovery session is required for form submission)
- **Attack Preconditions:** Attacker would need a valid PASSWORD_RECOVERY session (which means they successfully clicked a Supabase-issued reset email for their account)
- **Blast Radius:** Single actor (own account only)
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Documents the intentional design for future VENOM re-reviews and THOR gate review.
- **Recommended mitigation:** None — design is correct. Ensure BEHAVIOR.md captures the invariant: "/reset-password is intentionally unguarded at the route level; security is enforced by controller permit validation."
- **Rationale:** VENOM-AUTH-002 was a prior finding that has been correctly resolved by design. This entry closes it formally.
- **Follow-up command:** SPIDER-MAN (add BEHAVIOR.md invariant)
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Identity and Access Management

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VENOM-FP-001 | Dead export bypasses secure permit model | DAL | P1 | App | ELEKTRA / GREENGOBLIN |
| VENOM-FP-002 | isValidEmailFormat regex drift risk | Model | P3 | App | ELEKTRA |
| VENOM-FP-003 | Cooldown bypassable via reload | Documentation | P2 | Documentation | SPIDER-MAN |
| VENOM-FP-004 | DEV-mode URL param in error object | Controller | P2 | App | ELEKTRA |
| VENOM-FP-005 | No app-layer reset attempt observability | Controller | P2 | App | LOKI |
| VENOM-FP-006 | No test coverage for security behaviors | Test Coverage | P1 | App | SPIDER-MAN |
| VENOM-FP-007 | Route intentionally unguarded (INFO) | Documentation | P3 | Documentation | SPIDER-MAN |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 2 | FP-002 (policy gap), FP-003 (cooldown scope) |
| Asset Security | 0 | No sensitive data exposure found |
| Security Architecture and Engineering | 2 | FP-001 (permit bypass), FP-007 (route design) |
| Communication and Network Security | 1 | FP-004 (URL param in DEV mode) |
| Identity and Access Management | 1 | FP-007 (route guard design) |
| Security Assessment and Testing | 1 | FP-006 (no regression tests) |
| Security Operations | 1 | FP-005 (no audit trail) |
| Software Development Security | 4 | FP-001, FP-002, FP-003, FP-004, FP-006 |

Uncovered CISSP Domains:
- **Asset Security** — No sensitive data overfetch or retention risk found in this flow. Email addresses are not persisted client-side. Out of scope for this sub-module.

---

## SECURITY POSTURE SUMMARY

| Metric | Value |
|---|---|
| Findings | 7 (0 CRITICAL, 0 HIGH security, 1 MEDIUM, 4 LOW, 2 INFO) |
| Highest Open Severity | MEDIUM (VENOM-FP-001) |
| THOR Release Blocker | NO |
| Email Enumeration Prevention | PASS — generic success/error messages confirmed |
| Input Validation | PASS — validateEmail covers normalize + length + format |
| Route Guard | PASS — /forgot-password and /reset wrapped in AuthPublicRoute |
| Recovery Permit Model | PASS — two-layer: sessionStorage (UX) + DB permit (server boundary) |
| Error Leakage | PASS — all error messages are generic; Supabase internals never exposed |
| Dead Export Risk | MEDIUM — dalUpdateUserPassword has 0 callers but is exported |
| Test Coverage | PARTIAL — no tests for ForgotPassword security behaviors |

---

## VENOM RECOMMENDATION

**CAUTION** — No CRITICAL or HIGH security vulnerabilities found. The ForgotPassword implementation is architecturally sound: email enumeration is prevented, input validation is layered (hook gate + controller validation), the recovery permit model is a well-designed two-layer system, and all error messages are generic.

One MEDIUM finding (`VENOM-FP-001`) requires attention before the next auth module refactor: the `dalUpdateUserPassword` dead export should be removed to prevent a future accidental bypass of the server-side security boundary.

Proceed to BLACKWIDOW for adversarial runtime verification.

---

VENOM REPORT COMPLETE
Status: SUCCESS
Findings: 7 total (0 CRITICAL | 0 HIGH security | 1 MEDIUM | 4 LOW | 2 INFO)
THOR Release Blocker: NO
Write 2 Status: SECURITY.md update below (VENOM STATUS section only)
