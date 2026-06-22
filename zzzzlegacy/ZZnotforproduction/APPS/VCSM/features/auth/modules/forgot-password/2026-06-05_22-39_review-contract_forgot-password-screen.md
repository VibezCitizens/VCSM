# CONTRACT REVIEW REPORT

**Target:** Forgot Password Screen — full module chain
**Date:** 2026-06-05
**Command:** review-contract

---

## Review Metadata

| Field | Value |
|---|---|
| Target | `apps/VCSM/src/features/auth/screens/ForgotPasswordScreen.jsx` |
| Application Scope | VCSM |
| Contracts Reviewed | Architecture Rules (05-rules-verification), VCSM CLAUDE.md, SINGLE_SOURCE_ACTOR |
| Files Reviewed | 4 (screen, hook, controller, DAL) |

---

## Files Reviewed

| File | Lines | Role |
|---|---|---|
| `apps/VCSM/src/features/auth/screens/ForgotPasswordScreen.jsx` | 126 | View Screen |
| `apps/VCSM/src/features/auth/hooks/useResetPassword.js` | 64 | Hook |
| `apps/VCSM/src/features/auth/controllers/sendResetPassword.controller.js` | 11 | Controller |
| `apps/VCSM/src/features/auth/dal/resetPassword.dal.js` | 30 | DAL |

---

## Violation Summary

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 1 |
| MEDIUM | 3 |
| LOW | 0 |
| WARNING | 2 |

---

## Overall Status

**PARTIALLY COMPLIANT**

---

## HIGH Violations

---

### VIOLATION — H-001

**Rule:** Layer Responsibility — Models must be pure; Controllers/Models own business logic  
**Rule Source:** `05-rules-verification.md` — Layer responsibility rules  
**Severity:** HIGH

**File:** `apps/VCSM/src/features/auth/hooks/useResetPassword.js`  
**Line:** 7–9

**Issue:**  
The hook defines and owns `isValidEmailFormat()` — a pure email validation function:

```js
function isValidEmailFormat(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
}
```

This is domain validation logic (business rule) living in the hook layer.

**Why This Violates The Contract:**  
Hooks must orchestrate data for components. Business logic and pure validation rules belong in the Model layer. The hook layer must remain an orchestration surface, not a logic surface.

**Required Change:**  
1. Create `apps/VCSM/src/features/auth/model/resetPassword.model.js`
2. Move `isValidEmailFormat` into the model as an exported pure function
3. Import and call it from the hook: `import { isValidEmailFormat } from '@/features/auth/model/resetPassword.model'`

---

## MEDIUM Violations

---

### VIOLATION — M-001

**Rule:** Module Build Order — DAL → Model → Controller → Hooks → Screen  
**Rule Source:** `05-rules-verification.md` — Module build order rule; `apps/VCSM/CLAUDE.md`  
**Severity:** MEDIUM

**File:** `apps/VCSM/src/features/auth/` (module-level)  
**Line:** N/A — structural gap

**Issue:**  
The forgot-password module chain is:  
`resetPassword.dal.js` → `sendResetPassword.controller.js` → `useResetPassword.js` → `ForgotPasswordScreen.jsx`

There is no model layer. No `resetPassword.model.js` exists in `auth/model/`.

**Why This Violates The Contract:**  
The mandatory build order requires a Model layer between DAL and Controller. Skipping the model removes the pure transformation/validation surface and pushes that logic into hooks or controllers.

**Required Change:**  
Create `apps/VCSM/src/features/auth/model/resetPassword.model.js` containing at minimum:
- `isValidEmailFormat(value)` (moved from hook per H-001)
- Any future email normalization or validation constants

---

### VIOLATION — M-002

**Rule:** Single Responsibility Rule — each file should answer one focused question  
**Rule Source:** `05-rules-verification.md` — Single responsibility rule  
**Severity:** MEDIUM

**File:** `apps/VCSM/src/features/auth/dal/resetPassword.dal.js`  
**Line:** 1–30

**Issue:**  
`resetPassword.dal.js` contains five distinct DAL operations:

| Function | Responsibility |
|---|---|
| `dalSendResetPasswordEmail` | Initiate password reset |
| `dalExchangeRecoveryCode` | Exchange code for session |
| `dalUpdateUserPassword` | Set new password |
| `dalSignOutRecoverySession` | Sign out recovery session |
| `dalSubscribeToAuthStateChange` | Subscribe to auth state |

These cover at least three different concerns: reset initiation, password update, session management, and auth event subscription.

**Why This Violates The Contract:**  
A single-responsibility DAL file should answer one focused question (e.g., "how do I send a reset email?"). Mixing recovery flow, password update, and auth subscription in one file creates a god-DAL for the entire password-reset lifecycle.

**Required Change:**  
Split into purpose-scoped DAL files:
- `resetPassword.dal.js` — keep `dalSendResetPasswordEmail` only
- `setNewPassword.dal.js` (or extend existing) — `dalExchangeRecoveryCode`, `dalUpdateUserPassword`, `dalSignOutRecoverySession`
- `authSubscription.dal.js` — `dalSubscribeToAuthStateChange` (or move to `authSession` DAL)

---

### VIOLATION — M-003

**Rule:** Layer Responsibility — Hooks orchestrate data for components  
**Rule Source:** `05-rules-verification.md` — Layer responsibility rules  
**Severity:** MEDIUM

**File:** `apps/VCSM/src/features/auth/hooks/useResetPassword.js`  
**Line:** 42

**Issue:**  
The hook hardcodes a user-facing English success message:

```js
setSuccessMessage('If an account exists for that email, a reset link has been sent.')
```

This string bypasses the i18n system (`useTranslation`) that the screen itself uses for all other copy.

**Why This Violates The Contract:**  
Hooks must not own UI copy. This string is presentation-layer content, not orchestration logic. It also bypasses the translation system, breaking i18n consistency. The screen renders this string directly without translation.

**Required Change:**  
Two options (either resolves the violation):

**Option A — Hook returns a key, screen translates:**
```js
// hook
setSuccessMessage('auth.forgot.successMessage')  // return i18n key
// screen
{t(successMessage)}
```

**Option B — Hook returns a structured result, screen owns the message:**
```js
// hook
setSuccess(true)  // boolean flag
// screen
{success && <div>{t('auth.forgot.successMessage')}</div>}
```

Add to i18n: `auth.forgot.successMessage: "If an account exists for that email, a reset link has been sent."`

---

## Warnings

---

### WARNING — W-001

**Rule:** Import path rule — use `@/` imports only  
**File:** `apps/VCSM/src/features/auth/screens/ForgotPasswordScreen.jsx`  
**Line:** 5

**Observation:**  
```js
import { useTranslation } from '@i18n'
```

Uses `@i18n` — not the standard `@/` prefix convention.

**Why it may become a problem:**  
If `@i18n` is a Vite alias resolving to the i18n package, this is legitimate. If it is not declared in `vite.config.js` or `jsconfig.json`, it is a misconfigured import that may work in dev but fail in certain build configurations. The `@/` convention is the declared standard; deviations require explicit alias registration.

**Suggested Improvement:**  
Verify `@i18n` is declared in `vite.config.js` `resolve.alias`. If so, document the exception. If not, resolve to `@/i18n` or the correct package path.

---

### WARNING — W-002

**Rule:** Theme rule — colors via `--vc-*` CSS custom properties  
**Rule Source:** `apps/VCSM/CLAUDE.md` — Theme section  
**File:** `apps/VCSM/src/features/auth/screens/ForgotPasswordScreen.jsx`  
**Line:** 46, 47, 48, 67, 68, 79, 59, 106

**Observation:**  
Multiple hardcoded hex values are used directly in Tailwind classes:
- `text-[#9ca3af]`, `text-[#d1d5db]`, `text-[#86efac]`, `text-[#fecaca]`
- `border-[#22c55e]/30`, `bg-[#22c55e]/10`
- `border-[#ef4444]/30`, `bg-[#ef4444]/10`
- `bg-[#6C4DF6]`, `hover:bg-[#7657ff]`

Some colors are delegated correctly to `authTheme` (page/card background). Others are hardcoded inline.

**Why it may become a problem:**  
Hardcoded hex values bypass the `--vc-*` design token system. Theme updates (dark mode, brand refresh) must then be applied at every call site rather than in one token file. The existing `authTheme.js` object is the right pattern — color values should be centralized there, not scattered in JSX className strings.

**Suggested Improvement:**  
Move the status/feedback colors (`success`, `error`, `muted-text`) into `authTheme.js` as named tokens and consume them via `style={}` or move to `registerFormCard.css` as CSS custom properties.

---

## Compliant Areas

| Area | Status | Notes |
|---|---|---|
| Import path aliases (`@/`) | COMPLIANT | All cross-feature imports use `@/` |
| File sizes | COMPLIANT | All 4 files under 300 lines (max 126) |
| Controller fan-out | COMPLIANT | Controller calls 1 collaborator (DAL) |
| Hook fan-out | COMPLIANT | Hook calls 1 collaborator (controller) |
| DAL layer purity | COMPLIANT | No permission enforcement in DAL |
| Controller responsibility | COMPLIANT | Controller normalizes and delegates only |
| Dependency direction | COMPLIANT | apps → services, no reversed dependencies |
| Identity surface rule | COMPLIANT | Flow is unauthenticated — no identity surface used |
| Cross-feature imports | COMPLIANT | No cross-feature imports detected |
| Folder depth | COMPLIANT | All files at depth 1 within feature root |
| File naming conventions | COMPLIANT | `.dal.js`, `.controller.js`, `use*.js` patterns followed |
| Adapter boundary | COMPLIANT | Screen does not import from another feature's internals |
