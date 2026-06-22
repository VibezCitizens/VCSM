# ELEKTRA Precision Patch Advisory
**Scope:** VCSM:auth — ForgotPassword Screen
**Date:** 2026-06-05
**Command:** ELEKTRA v1
**Upstream Gates:** ARCHITECT ✓ | VENOM ✓ | BLACKWIDOW ✓

---

## Preflight Gate Status

| Gate | Report | Age | Status |
|---|---|---|---|
| ARCHITECT | `outputs/2026/06/05/ARCHITECT/vcsm.auth.forgotpassword.architecture.md` | 0 days | PASS |
| VENOM | `outputs/2026/06/05/Venom/2026-06-05_00-00_venom_auth-forgotpassword.md` | 0 days | PASS |
| BLACKWIDOW | `outputs/2026/06/05/BlackWidow/2026-06-05_00-00_blackwidow_auth-forgotpassword.md` | 0 days | PASS |

All three gates satisfied. ELEKTRA scan authorized.

---

## Scope

**Target findings (precision advisory — patches NOT applied):**
- BW-FP-004 / VENOM-FP-001: Remove `dalUpdateUserPassword` dead export
- BW-FP-001: Add `useRef` atomic double-submit guard in `useResetPassword.js`
- BW-FP-003 / VENOM-FP-004: Sanitize DEV-mode `errorDescription` in `setNewPassword.controller.js`
- VENOM-FP-002: Consolidate `isValidEmailFormat` to single canonical model

**Areas activated:** Area 2 (Controller Input Trust), Area 6 (Auth and Session)

---

## ELEK-FP-001 — Dead Export Bypass (BW-FP-004 / VENOM-FP-001)

**Severity:** MEDIUM
**Patch Type:** EXPORT_REMOVAL
**File:** `apps/VCSM/src/features/auth/dal/resetPassword.dal.js` lines 16-20

### Source → Trust Boundary → Sink Chain

```
Source:  resetPassword.dal.js (exported function dalUpdateUserPassword)
         |
         ↓ No permit check, no DB validation, no audit trail
Trust:   MISSING — calls supabase.auth.updateUser directly
         |
         ↓ Supabase session JWT is the only gate
Sink:    supabase.auth.updateUser({ password })
         |
         ↓ Password updated in auth.users without permit lifecycle
Impact:  Bypass of two-layer security model (sessionStorage + DB permit)
```

### Current Code (lines 16-20 of resetPassword.dal.js)

```js
export async function dalUpdateUserPassword({ password }) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}
```

### Evidence

- grep confirms: 0 callers in `apps/VCSM/src/` (only the definition itself)
- Secure path: `dalUpdatePasswordSecure` in `resetPasswordSecure.dal.js` → Edge Function → DB permit validation
- This export, if imported by any future caller, provides a single-gate bypass (session JWT only, no permit check)
- BLACKWIDOW verdict: BLOCKED (no current callers) / PARTIAL (latent bypass risk)

### Missing Defense

- No `permitId` validation against `platform.auth_recovery_permits`
- No `used_at IS NULL` + `expires_at > now()` + `user_id` match check
- No single-use enforcement
- No server-side audit trail on this path

### Suggested Patch (advisory — do not apply)

**Remove** the entire `dalUpdateUserPassword` function from `resetPassword.dal.js`.

```diff
- export async function dalUpdateUserPassword({ password }) {
-   const { error } = await supabase.auth.updateUser({ password })
-   if (error) throw error
- }
-
```

**Pre-removal verification step (run first):**
```bash
grep -rn "dalUpdateUserPassword" apps/VCSM/src/
# Must return exactly 1 result (the definition). If >1, locate all callers before deletion.
```

**Why removal over deprecation:** A dead export is invisible to callers right now, but a comment or JSDoc warning is also invisible at import time. Deletion is the only reliable guard. The secure path (`dalUpdatePasswordSecure`) is unaffected.

---

## ELEK-FP-002 — Double-Submit Race Condition (BW-FP-001)

**Severity:** LOW
**Patch Type:** ATOMIC_REF_GUARD
**File:** `apps/VCSM/src/features/auth/hooks/useResetPassword.js`

### Source → Trust Boundary → Sink Chain

```
Source:  User fires two rapid clicks on "Send Reset Email"
         |
         ↓ canSubmit evaluated synchronously (useMemo — truthy for both clicks)
Race:    setLoading(true) is async — state batch update not yet applied
         |
         ↓ Second click enters handleReset before setLoading re-render
Trust:   canSubmit check does NOT prevent concurrent entry
         |
         ↓ Both calls proceed to ctrlSendResetPasswordEmail
Sink:    dalSendResetPasswordEmail → supabase.auth.resetPasswordForEmail (x2)
         |
Impact:  User receives two reset emails; cooldown starts only in finally block
```

### Current Code Pattern (useResetPassword.js)

```js
const canSubmit = useMemo(
  () => isValidEmailFormat(email) && !loading && !success && cooldownSeconds === 0,
  [email, loading, success, cooldownSeconds]
);

async function handleReset() {
  if (!canSubmit) return;
  try {
    setLoading(true);               // ← async state update; does not block concurrent entry
    await ctrlSendResetPasswordEmail(email);
    setSuccess(true);
  } catch {
    setError(true);
  } finally {
    setLoading(false);
    setCooldownSeconds(COOLDOWN_SECONDS);
  }
}
```

### Race Window

Between `if (!canSubmit) return` and `setLoading(true)` completing its re-render cycle, `canSubmit` remains truthy because `loading` is still `false` in the previous render snapshot. A second synchronous click fires during this window and passes the guard.

### Backstop Verification

- Supabase server-side rate limiting is the authoritative backstop (confirmed by VENOM)
- Impact is UX-only: duplicate emails, not a security breach
- BLACKWIDOW verdict: BLOCKED (Supabase rate-limit), PARTIAL (UX regression, no server protection at the React layer)

### Missing Defense

No synchronous atomic guard before `setLoading(true)`. `useMemo`-computed `canSubmit` is render-cycle-dependent, not mutation-synchronous.

### Suggested Patch (advisory — do not apply)

Add a `useRef` flag as an atomic synchronous guard:

```js
import { useState, useMemo, useRef } from 'react';

// Inside hook body, add:
const submittingRef = useRef(false);

// Modify handleReset:
async function handleReset() {
  if (!canSubmit || submittingRef.current) return;
  submittingRef.current = true;                // ← synchronous, pre-render
  try {
    setLoading(true);
    await ctrlSendResetPasswordEmail(email);
    setSuccess(true);
  } catch {
    setError(true);
  } finally {
    submittingRef.current = false;             // ← released after async completes
    setLoading(false);
    setCooldownSeconds(COOLDOWN_SECONDS);
  }
}
```

**Why `useRef` works:** `useRef.current` mutation is synchronous and immediate — it does not wait for a React re-render cycle. The second click sees `submittingRef.current === true` and returns before reaching `setLoading`. No race window remains.

**Why not `useCallback` with `loading`:** `loading` state update is batched by React. Even with `useCallback`, the stale closure captures `loading = false` in the double-click window.

---

## ELEK-FP-003 — DEV-Mode URL Parameter Trust (BW-FP-003 / VENOM-FP-004)

**Severity:** LOW
**Patch Type:** INPUT_SANITIZE (branch removal)
**File:** `apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js` (~line 108)

### Source → Trust Boundary → Sink Chain

```
Source:  URL param: /reset-password?error_description=<value>
         |
         ↓ Supabase OAuth error redirect injects error_description into URL
Trust:   import.meta.env.DEV check (truthy in all development builds)
         |
         ↓ DEV branch: errorDescription passed directly as displayMessage
Sink:    displayMessage → hook state → ResetPasswordScreen JSX: {errorMessage}
         |
Impact (DEV): Attacker-controlled plain text rendered (not HTML — XSS BLOCKED by JSX)
Impact (PROD): BLOCKED — hardcoded string always returned
```

### Current Code (~line 108 of setNewPassword.controller.js)

```js
const displayMessage = import.meta.env.DEV
  ? (errorDescription || 'Reset link is invalid.')
  : 'Reset link is invalid or has expired.';
```

### XSS Status

- **CONFIRMED BLOCKED** — `ResetPasswordScreen.jsx` renders `{errorMessage}` as JSX text (not `dangerouslySetInnerHTML`)
- React auto-escaping prevents all HTML/script injection
- Remaining risk: plain text injection — misleading content, internal error code exposure in dev environments

### Impact Assessment

- Production: **BLOCKED** — hardcoded string; `errorDescription` never reaches the UI
- Development: URL-param content rendered verbatim as plain text
  - Attacker sharing a crafted link to a developer: confusing/misleading UI text
  - Supabase error descriptions can contain internal error codes (e.g., `"OTP has expired"`, `"Email rate limit exceeded"`) — information disclosure in dev
  - Not exploitable in production

### Missing Defense

DEV branch trusts `errorDescription` from URL without sanitization or truncation. The DEV/PROD branch distinction adds complexity with minimal debug benefit (Supabase dashboard is the authoritative error source).

### Suggested Patch — Option A: Remove DEV branch (Recommended)

```diff
- const displayMessage = import.meta.env.DEV
-   ? (errorDescription || 'Reset link is invalid.')
-   : 'Reset link is invalid or has expired.';
+ const displayMessage = 'Reset link is invalid or has expired.';
```

**Rationale:** The Supabase dashboard and browser network inspector provide the same debug information without surfacing it in the UI. Removing the branch eliminates the risk entirely and reduces cognitive complexity.

### Suggested Patch — Option B: Truncated DEV prefix (if debug value justified)

```diff
- const displayMessage = import.meta.env.DEV
-   ? (errorDescription || 'Reset link is invalid.')
-   : 'Reset link is invalid or has expired.';
+ const displayMessage = import.meta.env.DEV && typeof errorDescription === 'string'
+   ? `[DEV] ${errorDescription.slice(0, 80)}`
+   : 'Reset link is invalid or has expired.';
```

**Option A is recommended.** Option B reduces scope but retains the trust-of-URL-param pattern, which should be avoided even in dev environments.

---

## ELEK-FP-004 — Duplicate isValidEmailFormat (VENOM-FP-002)

**Severity:** LOW
**Patch Type:** CONSOLIDATE (model deduplication)
**Files:**
- `apps/VCSM/src/features/auth/model/resetPassword.model.js` (duplicate — to be deleted)
- `apps/VCSM/src/features/auth/model/authInputValidation.model.js` (canonical — to be kept)
- `apps/VCSM/src/features/auth/hooks/useResetPassword.js` (import to be updated)

### Source → Trust Boundary → Sink Chain

```
Source A: useResetPassword.js
          imports isValidEmailFormat from resetPassword.model.js (duplicate)
          → canSubmit = ... && isValidEmailFormat(email) && ...
          → UI button enable/disable gate

Source B: sendResetPassword.controller.js
          imports validateEmail from authInputValidation.model.js (canonical)
          → validateEmail = normalizeEmail + length check + isValidEmailFormat
          → Controller-layer email validation before DAL call
```

### Duplicate Evidence

**resetPassword.model.js (lines 1-3):**
```js
export function isValidEmailFormat(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim())
}
```

**authInputValidation.model.js:**
```js
export const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmailFormat(value) {
  return EMAIL_FORMAT_REGEX.test(String(value ?? '').trim())
}
```

**Both use identical regex** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` — currently in sync.

### Drift Risk

If `EMAIL_FORMAT_REGEX` is updated in `authInputValidation.model.js` (e.g., stricter RFC 5322 pattern), the hook's UI guard will not reflect the change. Result: UI enables "Send Reset" for emails that fail controller validation. This creates user confusion (form appears valid; error appears after submission) and is a correctness gap.

### Missing Defense

Single source of truth. The hook should import from the canonical model, not the thin duplicate.

### Suggested Patch (advisory — do not apply)

**Step 1 — Verify sole caller of resetPassword.model.js:**
```bash
grep -rn "resetPassword.model" apps/VCSM/src/
# Expected: only useResetPassword.js imports from it
```

**Step 2 — Update import in useResetPassword.js:**
```diff
- import { isValidEmailFormat } from '../model/resetPassword.model';
+ import { isValidEmailFormat } from '../model/authInputValidation.model';
```

**Step 3 — Delete resetPassword.model.js** (after Step 1 confirms it has no other callers):
```bash
# Confirm zero remaining imports before deletion:
grep -rn "from.*resetPassword.model" apps/VCSM/src/
# Should return 0 results after Step 2 is applied
```

**Why delete, not deprecate:** The file exports one function that is now imported from its canonical location. A deprecated file with a JSDoc warning can still be imported accidentally. Deletion prevents the import path from existing.

**No functional change:** Both implementations use identical regex and normalization logic. Consolidation is purely structural — no behavior change at runtime.

---

## Patch Queue Summary

| ID | Finding | File | Patch Type | Severity | LOC Impact |
|---|---|---|---|---|---|
| ELEK-FP-001 | BW-FP-004 / VENOM-FP-001 | `resetPassword.dal.js:16-20` | EXPORT_REMOVAL | MEDIUM | -5 lines |
| ELEK-FP-002 | BW-FP-001 | `useResetPassword.js` | ATOMIC_REF_GUARD | LOW | +5 lines |
| ELEK-FP-003 | BW-FP-003 / VENOM-FP-004 | `setNewPassword.controller.js:~108` | INPUT_SANITIZE | LOW | -3 lines |
| ELEK-FP-004 | VENOM-FP-002 | `resetPassword.model.js` + `useResetPassword.js:import` | CONSOLIDATE | LOW | -3 lines (file deletion) |

**Recommended application order:** ELEK-FP-004 first (import consolidation) → ELEK-FP-001 (export removal) → ELEK-FP-003 (branch removal) → ELEK-FP-002 (ref guard). This order avoids any transient broken-import state.

---

## Non-Findings (False Positives Rejected)

| Finding Candidate | Reason Rejected |
|---|---|
| `redirectTo` open redirect | Static: `window.location.origin + '/reset-password'` — no user input in suffix |
| `sessionStorage` permit as auth boundary | Design intent: DB permit is authoritative; sessionStorage is UX gate only |
| JSX errorMessage XSS | `{errorMessage}` is JSX text interpolation — React auto-escaping confirmed; `dangerouslySetInnerHTML` absent |
| PKCE code exchange CSRF | `dalExchangeRecoveryCode` uses Supabase PKCE; server validates code binding |

---

## Gate Status for THOR

| Check | Status | Note |
|---|---|---|
| All findings advisory-only | PASS | No patches applied |
| All BLACKWIDOW targets addressed | PASS | BW-FP-001, BW-FP-003, BW-FP-004 all have patch plans |
| All VENOM targets addressed | PASS | VENOM-FP-001, VENOM-FP-002, VENOM-FP-004 all have patch plans |
| No CRITICAL findings | PASS | Highest severity: MEDIUM (ELEK-FP-001) |
| Pre-patch verification steps documented | PASS | grep commands included for each removal |
| Patch order documented | PASS | Recommended sequence listed above |

---

## Provenance

| Input | Source | Status |
|---|---|---|
| ARCHITECT evidence-bundle.json | Session context | CONSUMED |
| VENOM report | Session context | CONSUMED |
| BLACKWIDOW report | Session context | CONSUMED |
| Area 2 sub-file | `.claude/commands/elektra/02-controller-input-trust.md` | READ |
| Area 6 sub-file | `.claude/commands/elektra/06-auth-session.md` | READ |
| Source files | Session context (read earlier this session) | CONSUMED |
