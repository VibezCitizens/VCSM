# CONTRACT REVIEW REPORT

**Target:** Register Screen — full module chain
**Date:** 2026-06-06
**Command:** review-contract

---

## Review Metadata

| Field | Value |
|---|---|
| Target | `apps/VCSM/src/features/auth/screens/RegisterScreen.jsx` |
| Application Scope | VCSM |
| Contracts Reviewed | Architecture Rules (05-rules-verification), VCSM CLAUDE.md, Adapter Boundaries, Styling Ownership |
| Files Reviewed | 8 (screen, component x2, hook, controller, DAL, model x2, adapter) |

---

## Files Reviewed

| File | Lines | Role |
|---|---|---|
| `apps/VCSM/src/features/auth/screens/RegisterScreen.jsx` | 54 | View Screen |
| `apps/VCSM/src/features/auth/components/RegisterFormCard.jsx` | 274 | Component |
| `apps/VCSM/src/features/auth/components/ConsentCheckbox.jsx` | 71 | Shared UI Component |
| `apps/VCSM/src/features/auth/hooks/useRegister.js` | ~200 | Hook |
| `apps/VCSM/src/features/auth/controllers/register.controller.js` | ~155 | Controller |
| `apps/VCSM/src/features/auth/dal/register.dal.js` | 65 | DAL |
| `apps/VCSM/src/features/auth/model/registerPasswordRules.model.js` | 68 | Model |
| `apps/VCSM/src/features/auth/adapters/auth.adapter.js` | 7 | Adapter |

---

## Violation Summary

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 2 |
| MEDIUM | 3 |
| LOW | 0 |
| WARNING | 2 |

---

## Overall Status

**PARTIALLY COMPLIANT** — patched same session, see patch log

---

## HIGH Violations

---

### VIOLATION — H-001

**Rule:** Styling Ownership §9 — All colors via `--vc-*` CSS custom properties; no hardcoded hex values  
**Rule Source:** `apps/VCSM/CLAUDE.md` — Theme section  
**Severity:** HIGH

**File:** `apps/VCSM/src/features/auth/components/RegisterFormCard.jsx`  
**Evidence:** 24 hardcoded hex color values across inline styles, Tailwind arbitrary values, and `style={}` attributes (e.g. `bg-[#6C4DF6]`, `text-[#9ca3af]`, `rgba(108,77,246,0.15)` in radial gradients)

**File:** `apps/VCSM/src/features/auth/components/ConsentCheckbox.jsx`  
**Evidence:** 3 hardcoded hex values in checked-state classes and label color

**Status:** PATCHED — P1

---

### VIOLATION — H-002

**Rule:** Adapter Boundaries — Adapters expose only hooks, components, view screens; never models, DALs, or controllers  
**Rule Source:** `apps/VCSM/CLAUDE.md` — Adapter Boundaries section  
**Severity:** HIGH

**File:** `apps/VCSM/src/features/auth/adapters/auth.adapter.js`  
**Evidence:** `isEmailVerifiedModel` exported directly from the model layer through the adapter. Models must not be exposed through adapters.

**Status:** PATCHED — P2 (wrapped in `useEmailVerified` hook, `ProtectedRoute.jsx` updated)

---

## MEDIUM Violations

---

### VIOLATION — M-001

**Rule:** Layer Responsibility — Business logic belongs in controllers, not hooks  
**Rule Source:** `05-rules-verification.md`  
**Severity:** MEDIUM

**File:** `apps/VCSM/src/features/auth/hooks/useRegister.js`  
**Evidence:** Post-registration consent orchestration (try/catch, `captureFrontendError`, error message construction) owned entirely by the hook instead of a controller function.

**Status:** PATCHED — P3 (`ctrlRecordSignupConsent` added to `register.controller.js`)

---

### VIOLATION — M-002

**Rule:** Hook Public Surface — Hooks must not expose internal implementation details  
**Rule Source:** Architecture contract — hook layer rules  
**Severity:** MEDIUM

**File:** `apps/VCSM/src/features/auth/hooks/useRegister.js`  
**Evidence:** `handleRegister` exported in the hook return object. This is an internal async function called only by `handleSubmit`; exposing it allows callers to bypass the submit event wrapper and call raw registration logic directly.

**Status:** PATCHED — P4 (`handleRegister` removed from public return)

---

### VIOLATION — M-003

**Rule:** No production `console.*` calls  
**Rule Source:** Architecture contract — observability  
**Severity:** MEDIUM

**File:** `apps/VCSM/src/features/auth/hooks/useRegister.js`  
**Evidence:** `console.error('[Register] Failed to record legal consent:', consentErr)` at consent catch block.

**Status:** PATCHED — P5 (removed as part of P3 block replacement)

---

## WARNING Violations

---

### WARNING — W-001

**Rule:** File Length — Files over 300 lines must be split before adding more code  
**Rule Source:** `apps/VCSM/CLAUDE.md` — Engineering Rules  
**Severity:** WARNING

**File:** `apps/VCSM/src/features/auth/components/RegisterFormCard.jsx`  
**Evidence:** 274 lines — 26 lines under the 300-line ceiling. Approaching limit; future additions require a split first.

**Status:** OPEN — monitor before next addition

---

### WARNING — W-002

**Rule:** Open-redirect exposure — `state.from` used as navigation destination without path validation  
**Rule Source:** Security posture — auth redirect flows  
**Severity:** WARNING

**File:** `apps/VCSM/src/features/auth/hooks/useRegister.js`  
**Evidence:** `const fromState = typeof state.from === 'string' ? state.from : null` — trusts any string from navigation state without calling `isSafeAuthReturnPath()`.

**File:** `apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js`  
**Evidence:** Same pattern at `redirectTo` derivation; value flows directly into `navigate(navState.redirectTo)`.

**Status:** PATCHED — SEC-REG-BATCH-1 Tasks 2 & 3

---

## Passed Checks

| File | Result |
|---|---|
| `RegisterScreen.jsx` | PASS — clean delegating screen, no business logic |
| `register.dal.js` | PASS — explicit column selects, no `select('*')`, DAL-only ops |
| `registerPasswordRules.model.js` | PASS — pure functions, no side effects |
| `register.controller.js` (pre-patch) | PASS — fan-out count 4 (under limit of 5) |
| Cross-feature wanders import | PASS — imports through `wandersSupabaseClient.adapter`, not internal files |

---

## Patch Cross-Reference

See: `ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/06/patches/2026-06-06_patches_register-screen.md`
