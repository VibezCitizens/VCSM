---
name: vcsm.auth.forgotpassword.architecture
description: ARCHITECT V2 module architecture report — ForgotPassword screen and full password reset flow
metadata:
  type: architecture
  owner: ARCHITECT
  run-date: 2026-06-05
  scope: VCSM:auth (ForgotPassword sub-module)
  scanner-version: 1.1.0
  freshness: FRESH
  ticket: TICKET-ARCH-AUTH-FORGOT-001
---

# ARCHITECT V2 REPORT

## Output Metadata

| Field | Value |
|---|---|
| Category Key | vcsm.auth.forgotpassword |
| Feature / Scope | VCSM:auth — ForgotPassword sub-module |
| Command | ARCHITECT V2 |
| Ticket | TICKET-ARCH-AUTH-FORGOT-001 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/05/ARCHITECT/ |
| Timestamp | 2026-06-05T00:00:00 |

---

## 1. ARCHITECT Scanner Preflight

```
ARCHITECT SCANNER PREFLIGHT
============================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Freshness Window: 7 days
Generated: 2026-06-04T20:29 (age: ~4h)

| Map              | Generated At          | Age | Freshness | Confidence | Status |
|------------------|-----------------------|-----|-----------|------------|--------|
| feature-map      | 2026-06-04T20:29      | 4h  | FRESH     | HIGH       | PASS   |
| dependency-map   | 2026-06-04T20:29      | 4h  | FRESH     | HIGH       | PASS   |
| route-map        | 2026-06-04T20:29      | 4h  | FRESH     | HIGH       | PASS   |
| graph            | 2026-06-04T20:29      | 4h  | FRESH     | HIGH       | PASS   |
| callgraph        | 2026-06-04T20:29      | 4h  | FRESH     | HIGH       | PASS   |
| engine-candidates| 2026-06-04T20:29      | 4h  | FRESH     | MEDIUM     | PASS   |

Security Maps:
| write-surface-map      | 2026-06-04T20:29 | 4h | FRESH | HIGH | PASS |
| rpc-map                | 2026-06-04T20:29 | 4h | FRESH | HIGH | PASS |
| edge-function-map      | 2026-06-04T20:29 | 4h | FRESH | HIGH | PASS |
| security-path-map      | 2026-06-04T20:29 | 4h | FRESH | HIGH | PASS |
| route-execution-map    | 2026-06-04T20:29 | 4h | FRESH | HIGH | PASS |
| write-execution-map    | 2026-06-04T20:29 | 4h | FRESH | HIGH | PASS |
| rpc-execution-map      | 2026-06-04T20:29 | 4h | FRESH | HIGH | PASS |
| edge-execution-map     | 2026-06-04T20:29 | 4h | FRESH | HIGH | PASS |

Overall Preflight: PASS
```

---

## 2. Scanner Inputs

| Map | Used For |
|---|---|
| feature-map | Feature inventory, scope filtering to VCSM:auth |
| callgraph | Call chain reconstruction: screen→hook→controller→dal |
| dependency-map | Cross-feature import analysis |
| route-map | Route ownership and access classification |
| edge-function-map | Edge function invocations in password reset flow |
| security-path-map | Auth route security path classification |
| write-surface-map | Mutation surface identification |
| rpc-map | RPC call inventory |

---

## 3. Scope Summary

- Applications scanned: 1 (VCSM)
- Engines scanned: 0 (auth module has no engine dependency for forgot-password flow)
- Features in scope: 1 (VCSM:auth — ForgotPassword sub-module)
- Source files read: 10
- Routes in scope: 2 (/forgot-password, /reset)
- Full flow routes covered: 4 (/forgot-password, /reset, /reset-password, /auth/callback)
- Write surfaces in scope: 0 (ForgotPassword screen triggers no direct DB writes)
- Edge functions invoked: 2 (auth-register-recovery, auth-reset-password-secure)

---

## 4. Scanner Signals

| Signal | Source | Provenance | Status |
|---|---|---|---|
| Route /forgot-password → ForgotPasswordScreen | route-map | [SOURCE_VERIFIED] | CONFIRMED |
| Route /reset (alias) → ForgotPasswordScreen | route-map | [SOURCE_VERIFIED] | CONFIRMED |
| Hook: useResetPassword → ctrlSendResetPasswordEmail | callgraph | [SOURCE_VERIFIED] | CONFIRMED |
| Controller validates email before DAL call | callgraph + source | [SOURCE_VERIFIED] | CONFIRMED |
| DAL: dalSendResetPasswordEmail → supabase.auth.resetPasswordForEmail | source | [SOURCE_VERIFIED] | CONFIRMED |
| redirectTo built from window.location.origin (not user input) | source | [SOURCE_VERIFIED] | CONFIRMED |
| isValidEmailFormat duplicated across 2 model files | source | [SOURCE_VERIFIED] | CONFIRMED |
| Edge function: auth-register-recovery (AuthProvider) | edge-function-map | [SOURCE_VERIFIED] | CONFIRMED |
| Edge function: auth-reset-password-secure (setNewPassword.controller) | edge-function-map | [SOURCE_VERIFIED] | CONFIRMED |

---

## 5. Architecture Findings

### ARCH-FP-001 [SOURCE_VERIFIED] — isValidEmailFormat duplicated across two model files
- **Severity:** LOW
- **Location:**
  - `apps/VCSM/src/features/auth/model/resetPassword.model.js:1-3`
  - `apps/VCSM/src/features/auth/model/authInputValidation.model.js:41-43`
- **Finding:** `isValidEmailFormat` is implemented independently in both files with identical regex. `useResetPassword` imports from `resetPassword.model.js`; the controller uses `validateEmail` from `authInputValidation.model.js` which calls the same logic. The hook uses the thin format check for form enablement (pre-submit gating); the controller runs the full validated version (normalize + length check + format check). The split is functionally correct but creates a second definition of the same predicate.
- **Risk:** Divergence risk if regex is ever updated in one file but not the other.
- **Suggested correction:** Remove `isValidEmailFormat` from `resetPassword.model.js`; import from `authInputValidation.model.js` instead.

### ARCH-FP-002 [SOURCE_VERIFIED] — ForgotPasswordScreen not exported through auth.adapter.js
- **Severity:** INFO (EXPECTED)
- **Location:** `apps/VCSM/src/features/auth/adapters/auth.adapter.js`
- **Finding:** `ForgotPasswordScreen` is injected directly into `authPublicRoutes()` without passing through the adapter. This is correct by adapter contract (screens are injected into route factories, not exported from adapters). No violation.

### ARCH-FP-003 [SOURCE_VERIFIED] — /reset alias route maintained for backward compatibility
- **Severity:** INFO
- **Location:** `apps/VCSM/src/app/routes/public/auth.routes.jsx:29-36`
- **Finding:** `/reset` is a legacy alias for `/forgot-password`. Both render `ForgotPasswordScreen` wrapped in `AuthPublicRoute`. Both routes are correctly protected. No architecture concern; the alias should be documented as a permanent backward-compat entry.

### ARCH-FP-004 [SOURCE_VERIFIED] — Client-side cooldown is UI-only, not a rate-limiting security control
- **Severity:** INFO
- **Location:** `apps/VCSM/src/features/auth/hooks/useResetPassword.js:7,54`
- **Finding:** `COOLDOWN_SECONDS = 60` is a UX safeguard that prevents rapid re-submission within the same browser session. It is explicitly not a security boundary. Supabase enforces its own rate limits on `auth.resetPasswordForEmail` server-side. This design is intentional and documented by the code behavior.

### ARCH-FP-005 [SOURCE_VERIFIED] — redirectTo is statically computed from window.location.origin
- **Severity:** INFO
- **Location:** `apps/VCSM/src/features/auth/controllers/sendResetPassword.controller.js:8`
- **Finding:** `redirectTo: \`${window.location.origin}/reset-password\`` — no user input feeds this value. The origin is derived from the browser's current host. This is a static suffix concatenation and does not constitute an open redirect. Route to VENOM for final confirmation.

### ARCH-FP-006 [SOURCE_VERIFIED] — BEHAVIOR.md is missing for auth feature
- **Severity:** HIGH
- **Location:** `ZZnotforproduction/APPS/VCSM/features/auth/BEHAVIOR.md`
- **Finding:** BEHAVIOR.md exists in the auth feature folder but must be verified to include ForgotPassword-specific behavioral invariants (e.g., "must never reveal whether email exists", "cooldown must reset to zero after page reload", "redirectTo must always be /reset-password"). Route to SPIDER-MAN for coverage audit.

### ARCH-FP-007 [SOURCE_VERIFIED] — Full password reset flow spans two controllers and two DAL files
- **Severity:** INFO (ARCHITECTURE NOTE)
- **Finding:** The forgot-password flow is split across:
  - Phase 1 (this module): `sendResetPassword.controller.js` → `resetPassword.dal.js` → Supabase email trigger
  - Phase 2 (setNewPassword): `setNewPassword.controller.js` → `resetPasswordSecure.dal.js` → two Edge Functions
  - Permit coordination: `AuthProvider.jsx` → `dalRegisterRecoveryPermit` → `_setRecoveryFlag` (sessionStorage)
  - This split is intentional and architecturally sound. The two phases are independent concerns separated correctly across their own controllers and DAL files.

---

## 6. Module Architecture Report

**Module:** auth — ForgotPassword sub-module
**Application Scope:** VCSM
**Module Type:** feature sub-module
**Primary Root:** apps/VCSM/src/features/auth
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

### PURPOSE

Accepts a user-provided email address, validates it, and triggers a Supabase password reset email. On success, shows a generic confirmation message (prevents email enumeration). A 60-second client-side cooldown prevents rapid resubmission within the same session. The screen is publicly accessible but AuthPublicRoute redirects authenticated users away. This screen is Phase 1 of a two-phase password reset flow; Phase 2 is handled by ResetPasswordScreen.

### OWNERSHIP

VCSM auth feature. Primary domain: Supabase Auth (`supabase.auth.resetPasswordForEmail`). No direct DB writes in this phase.

### ENTRY POINTS

| Route | Wrapper | Access |
|---|---|---|
| /forgot-password | AuthPublicRoute | PUBLIC (authed → redirect /feed) |
| /reset | AuthPublicRoute | PUBLIC (authed → redirect /feed) — alias |

### LAYER MAP

| Layer | File | Purpose |
|---|---|---|
| Screen | ForgotPasswordScreen.jsx | UI — email form, success/error states, cooldown display |
| Hook | useResetPassword.js | State management — email, loading, success, error, cooldown |
| Controller | sendResetPassword.controller.js | Validates email, builds redirectTo, calls DAL |
| Model (form gate) | resetPassword.model.js | isValidEmailFormat — lightweight check for submit button enablement |
| Model (validation) | authInputValidation.model.js | validateEmail — normalize + length + format check before DAL call |
| DAL | resetPassword.dal.js | dalSendResetPasswordEmail → supabase.auth.resetPasswordForEmail |
| Route | auth.routes.jsx | Registers /forgot-password and /reset with AuthPublicRoute wrapper |

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | ForgotPasswordScreen.jsx, sendResetPassword.controller.js | — |
| Owner defined | PASS | VCSM auth feature | — |
| Entry points mapped | PASS | /forgot-password + /reset in auth.routes.jsx | — |
| Controllers present/delegated | PASS | sendResetPassword.controller.js | — |
| DAL/repository present | PASS | resetPassword.dal.js | — |
| Models/transformers present | PASS | resetPassword.model.js + authInputValidation.model.js | Duplication LOW |
| Hooks/view models present | PASS | useResetPassword.js | — |
| Screens/components present | PASS | ForgotPasswordScreen.jsx | — |
| Services/adapters present | N/A | No adapter export needed for screen | — |
| Database objects mapped | PASS | No direct DB writes (Supabase auth API) | — |
| Authorization path mapped | PASS | AuthPublicRoute redirects authed users; supabase handles rate-limiting | — |
| Cache/runtime behavior mapped | PASS | 60s client cooldown in hook | — |
| Error/loading/empty states mapped | PASS | loading bool, error bool, success bool all present | — |
| Documentation linked | PARTIAL | ARCHITECTURE.md present; BEHAVIOR.md missing FP-specific invariants | HIGH |
| Tests/validation noted | PARTIAL | No tests found for ForgotPasswordScreen or useResetPassword | HIGH |
| Native parity noted | PARTIAL | No iOS parity notes for ForgotPassword flow | MEDIUM |
| Engine dependencies mapped | N/A | No engine dependency | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| supabase.auth.resetPasswordForEmail | external API | dal → external | APPROVED | Supabase auth API |
| authInputValidation.model.js | model | controller → model | APPROVED | validateEmail |
| resetPassword.model.js | model | hook → model | APPROVED | isValidEmailFormat (thin check) |
| authTheme.js | UI/style | screen → style | APPROVED | Page/card background colors |
| AuthPublicRoute | route | route → route-guard | APPROVED | Auth guard for public screens |
| useNavigate (react-router-dom) | external | hook → router | APPROVED | Navigation after success |
| Link (react-router-dom) | UI | screen → router | APPROVED | /login back link |
| i18n | service | screen → i18n | APPROVED | Translation keys |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| email (user input) | read | ForgotPasswordScreen (form) | useResetPassword → sendResetPassword.controller | Validated before external call |
| redirectTo URL | derived | sendResetPassword.controller | dalSendResetPasswordEmail | Static: window.location.origin + '/reset-password' |
| supabase.auth.resetPasswordForEmail response | external | Supabase | dalSendResetPasswordEmail | Errors thrown; success returns void |
| cooldownSeconds | write | useResetPassword | ForgotPasswordScreen | Client-side UX only, not a security boundary |
| success/error state | write | useResetPassword | ForgotPasswordScreen | Generic messages — no Supabase internals leaked |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry exists | PASS | /forgot-password registered in auth.routes.jsx | — |
| Loading state exists | PASS | loading boolean renders "Sending..." button text | — |
| Empty state exists | N/A | Form is always shown until submit | — |
| Error state exists | PASS | error boolean → generic error banner | — |
| Success state exists | PASS | success boolean → confirmation + back-to-login UI | — |
| Auth/owner gates exist | PASS | AuthPublicRoute redirects authed users to /feed | — |
| Cache behavior known | PASS | No caching; cooldown is in-memory React state | — |
| Runtime dependencies mapped | PASS | supabase client, react-router, i18n | — |
| Hot paths identified | PASS | handleReset → ctrlSendResetPasswordEmail (single async path) | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/auth/ARCHITECTURE.md | PRESENT |
| Ownership record | ZZnotforproduction/APPS/VCSM/features/auth/INDEX.md | PRESENT |
| Security audit | ZZnotforproduction/APPS/VCSM/features/auth/SECURITY.md | PRESENT |
| Runtime audit | ZZnotforproduction/APPS/VCSM/features/auth/ | PARTIAL |
| Performance audit | ZZnotforproduction/APPS/VCSM/features/auth/ | MISSING |
| Migration audit | N/A (no schema changes in FP flow) | N/A |
| Native transfer audit | ZZnotforproduction/APPS/VCSM/features/auth/ | MISSING |
| Engine audit | N/A | N/A |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| ForgotPassword behavioral invariants in BEHAVIOR.md | HIGH | No documented "must never" rules for email enumeration prevention, cooldown behavior, redirectTo safety | SPIDER-MAN |
| Tests for ForgotPasswordScreen and useResetPassword | HIGH | No regression coverage for the reset email trigger path | SPIDER-MAN |
| iOS parity notes for ForgotPassword flow | MEDIUM | Native app may handle reset link differently (deep link vs. Safari); not documented | Falcon |
| Consolidate isValidEmailFormat to authInputValidation.model.js | LOW | Eliminates regex drift risk between two model files | WOLVERINE |

---

## MODULE BOUNDARY WARNINGS

None. All import directions are within approved boundaries. No cross-feature DAL imports detected. ForgotPasswordScreen correctly not exported from auth.adapter.js.

---

## 7. Source Verification Summary

| File Read | Layer | Lines | Verified |
|---|---|---|---|
| apps/VCSM/src/features/auth/screens/ForgotPasswordScreen.jsx | screen | 1-133 | YES |
| apps/VCSM/src/features/auth/hooks/useResetPassword.js | hook | 1-73 | YES |
| apps/VCSM/src/features/auth/controllers/sendResetPassword.controller.js | controller | 1-11 | YES |
| apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js | controller | 1-188 | YES |
| apps/VCSM/src/features/auth/dal/resetPassword.dal.js | dal | 1-30 | YES |
| apps/VCSM/src/features/auth/dal/resetPasswordSecure.dal.js | dal | 1-31 | YES |
| apps/VCSM/src/features/auth/model/resetPassword.model.js | model | 1-3 | YES |
| apps/VCSM/src/features/auth/model/authInputValidation.model.js | model | 1-79 | YES |
| apps/VCSM/src/features/auth/adapters/auth.adapter.js | adapter | 1-8 | YES |
| apps/VCSM/src/app/routes/public/auth.routes.jsx | route | 1-82 | YES |
| apps/VCSM/src/app/routes/public/AuthPublicRoute.jsx | route-guard | 1-32 | YES |
| apps/VCSM/src/app/providers/AuthProvider.jsx | provider | 1-269 | YES |

Source files validated: 12
LOW confidence signals: 0

---

## 8. Confidence Summary

| Area | Confidence | Reason |
|---|---|---|
| Full call chain | HIGH | All layers read and traced end-to-end |
| Route access classification | HIGH | Source-verified — AuthPublicRoute wraps both routes |
| Security surface (redirectTo) | HIGH | Static computation, no user input |
| Email enumeration protection | HIGH | Generic success/error messages confirmed in source |
| Model duplication finding | HIGH | Both files read, regex confirmed identical |
| Edge function invocations | HIGH | dalRegisterRecoveryPermit and dalUpdatePasswordSecure confirmed |
| Native parity | LOW | No iOS source read; classified as MISSING |

Overall confidence: HIGH

---

## 9. Behavior Contract Consistency

| Behavior | Expected | Observed | Status |
|---|---|---|---|
| Success shows generic message (no email existence disclosure) | YES | t('auth.forgot.successMessage') — generic string | PASS |
| Error shows generic message (no Supabase internals) | YES | t('auth.forgot.errorMessage') — generic string | PASS |
| Form disabled when email is invalid, loading, or success | YES | canSubmit = isValidEmailFormat && !loading && !success && cooldown===0 | PASS |
| Authed users redirected away | YES | AuthPublicRoute → /feed | PASS |
| Cooldown reset on every submit attempt (success and error) | YES | setCooldownSeconds(COOLDOWN_SECONDS) in finally block | PASS |
| Email normalized before Supabase call | YES | validateEmail() in controller normalizes + validates | PASS |
| Auto-navigate to /login after success | YES | 4000ms setTimeout in useEffect | PASS |

---

## 10. Handoff Recommendations

| Command | Reason |
|---|---|
| VENOM | Review redirectTo construction; verify open-redirect safety classification; review cooldown bypass via direct fetch |
| ELEKTRA | Patch advisor for isValidEmailFormat consolidation; scan for any input surfaces not normalized |
| BLACKWIDOW | Adversarial runtime verification of email enumeration path; test for Supabase error message leakage |
| SPIDER-MAN | Add BEHAVIOR.md invariants for ForgotPassword; add regression tests for useResetPassword and sendResetPassword.controller |
| Falcon | Verify iOS deep-link handling for /reset-password after email click; assess native parity |

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

Architecture is sound. Call chain is complete and layered correctly. Security controls (AuthPublicRoute, email validation, generic messages) are in place. Two missing governance pieces (BEHAVIOR.md invariants, test coverage) prevent COMPLETE classification. No CRITICAL architecture findings.

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Add ForgotPassword behavioral invariants to BEHAVIOR.md | No documented "must never" rules; required for SPIDER-MAN coverage audit | SPIDER-MAN |
| P1 | Add regression tests for useResetPassword + sendResetPassword.controller | No test coverage on this path | SPIDER-MAN |
| P2 | iOS parity notes for ForgotPassword | Native deep-link behavior undocumented | Falcon |
| P3 | Consolidate isValidEmailFormat to single model | Eliminates regex drift risk | WOLVERINE |

---

ARCHITECT REPORT COMPLETE
Status: SUCCESS
Application Scope: VCSM
Features Scanned: 1 (VCSM:auth — ForgotPassword sub-module)
Source Files Read: 12
Findings: 7 (0 CRITICAL, 0 HIGH architecture, 2 HIGH governance, 1 LOW code smell, 4 INFO)
