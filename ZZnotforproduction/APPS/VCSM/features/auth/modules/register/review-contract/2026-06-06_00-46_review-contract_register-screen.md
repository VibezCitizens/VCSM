# CONTRACT REVIEW REPORT

**Target:** Register screen — `/register` route, Join Vibez Citizens form
**Application Scope:** `apps/VCSM/src/features/auth/` — registration slice
**Contracts Reviewed:** Architecture contract §5 (rules), §8 (UI purity), §9 (styling ownership); VCSM CLAUDE.md adapter boundary, identity surface, build order
**Date:** 2026-06-06

---

## Files Reviewed

| File | Lines |
|---|---|
| `apps/VCSM/src/features/auth/screens/RegisterScreen.jsx` | 54 |
| `apps/VCSM/src/features/auth/components/RegisterFormCard.jsx` | 274 |
| `apps/VCSM/src/features/auth/components/ConsentCheckbox.jsx` | 71 |
| `apps/VCSM/src/features/auth/hooks/useRegister.js` | 213 |
| `apps/VCSM/src/features/auth/controllers/register.controller.js` | 131 |
| `apps/VCSM/src/features/auth/dal/register.dal.js` | 65 |
| `apps/VCSM/src/features/auth/model/registerPasswordRules.model.js` | 68 |
| `apps/VCSM/src/features/auth/adapters/auth.adapter.js` | 8 |

---

## Critical Violations

None.

---

## High Violations

### H-001 — Styling rule §9: Hardcoded hex colors throughout `RegisterFormCard.jsx`

**File:** `apps/VCSM/src/features/auth/components/RegisterFormCard.jsx`
**Rule:** §9 Styling ownership — "raw hex values in `style={}`, Tailwind arbitrary values (e.g. `text-[#6C4DF6]`, `bg-[#ef4444]`) are forbidden. All colors must use `--vc-*` CSS custom properties."

**Evidence (non-exhaustive):**
- Line 8: `placeholder:text-[#9ca3af]`
- Line 9: `focus:border-[#6C4DF6]/80 focus:ring-[#6C4DF6]/40`
- Line 17: `text-[#9ca3af]`
- Line 19: `text-[#22c55e]`
- Line 26: `text-[#9ca3af]/80`
- Lines 61–63: `style={{ background: 'radial-gradient(... rgba(108,77,246,0.15) ... rgba(59,130,246,0.10) ...) #0b0b0f' }}`
- Lines 68–73: `style={{ background: 'linear-gradient(...)', boxShadow: '...' }}`
- Lines 86–96: `border-[#22c55e]/30 bg-[#22c55e]/10 text-[#a7f3d0]`
- Lines 94–100: `border-[#ef4444]/30 bg-[#ef4444]/10 text-[#fecaca]`
- Line 192: `text-[#22c55e]` / `text-[#ef4444]`
- Lines 244–246: `bg-[#6C4DF6]` / `hover:bg-[#7657ff]`
- Line 257: `text-[#c4b5fd]` / `decoration-[#c4b5fd]/40`

Every instance must be replaced with `var(--vc-*)` tokens. A brand color change currently requires editing this file in 15+ places.

**Severity:** HIGH

---

### H-002 — Styling rule §9: Hardcoded hex colors in `ConsentCheckbox.jsx`

**File:** `apps/VCSM/src/features/auth/components/ConsentCheckbox.jsx`
**Rule:** §9 — "shared UI components must never hardcode colors"

**Evidence:**
- Line 47: `border-[#8b5cf6] bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] shadow-[0_0_10px_rgba(139,92,246,0.4)]`
- Line 48: `border-white/40 bg-white/8 hover:border-white/55 hover:bg-white/12`
- Line 66: `text-[#d1d5db]`

`ConsentCheckbox` is a shared component (exported via `auth.adapter.js`). Hardcoded colors here prevent theming entirely.

**Severity:** HIGH

---

## Medium Violations

### M-001 — Adapter rule: `auth.adapter.js` exports a model

**File:** `apps/VCSM/src/features/auth/adapters/auth.adapter.js`
**Rule:** "Adapters must not export DAL, models, or controllers. Adapters expose only: hooks, components, view screens."

**Evidence:**
- Line 4: `export { isEmailVerifiedModel } from '@/features/auth/model/emailVerification.model'`

`isEmailVerifiedModel` is a model function. Exposing it through the adapter collapses the model layer boundary. Consumers of the adapter are now directly coupled to a model — violating the layer contract.

**Fix:** Remove model export from adapter. Any consumer needing email verification logic should call through a hook or the controller, not reference the raw model.

**Severity:** MEDIUM

---

### M-002 — Layer responsibility leak: business logic in `useRegister` hook

**File:** `apps/VCSM/src/features/auth/hooks/useRegister.js`
**Rule:** "Controllers own business logic. Hooks orchestrate data for components."

**Evidence (lines 141–163):**
```
const userId = result?.userId ?? null
if (userId) {
  try {
    await recordSignupConsent({ userId })
  } catch (consentErr) {
    // error state management + captureFrontendError
  }
}
```

The post-registration consent recording step — including the branch on `userId`, error state management, and monitoring capture — is multi-step business orchestration. This belongs in `ctrlRegisterAccount` (or a dedicated `ctrlRecordPostSignupConsent` controller), not in the hook.

The hook should receive a single settled result from the controller and act on it; it should not coordinate two independent service calls with separate failure modes.

**Severity:** MEDIUM

---

### M-003 — Internal hook state exposed in return surface

**File:** `apps/VCSM/src/features/auth/hooks/useRegister.js`
**Rule:** Single responsibility — each file answers one focused question; hooks expose the contract their components need.

**Evidence (line 209):**
```
handleRegister,  // returned alongside handleSubmit
```

`handleRegister` is the private implementation that `handleSubmit` wraps. Both are returned from the hook, exposing an internal implementation detail as a public hook surface. Callers can bypass the `preventDefault` wrapper and invoke `handleRegister` directly. Only `handleSubmit` should be on the public surface.

**Severity:** MEDIUM

---

## Warnings

### W-001 — `RegisterFormCard.jsx` approaching 300-line limit

**File:** `apps/VCSM/src/features/auth/components/RegisterFormCard.jsx`
**Current:** 274 lines
**Limit:** 300 lines
**Buffer:** 26 lines remaining

The file will breach the limit upon the next feature addition (password strength meter, OAuth button, etc.). Pre-emptive split: extract `PasswordRuleList` + `PasswordRuleItem` into `registerPasswordRules.component.jsx` and the confirm-password block into `confirmPassword.component.jsx`.

**Severity:** LOW (approaching limit)

---

### W-002 — `console.error` in production hook

**File:** `apps/VCSM/src/features/auth/hooks/useRegister.js`
**Line:** 146
**Rule (memory):** No `console.log` / `console.error` in production code — errors must render on-screen or go to the monitoring client.

The `captureFrontendError` call on line 150 already sends the error to monitoring. The `console.error` on line 146 is redundant and leaks implementation detail to the browser console in production.

**Fix:** Remove the `console.error` line. The monitoring capture + `setConsentError` user-facing message is sufficient.

**Severity:** LOW

---

## Passing Checks

| Rule | Status |
|---|---|
| Import path rule (`@/` only, no `../../`) | PASS — zero relative imports found |
| Module build order (DAL → Model → Controller → Hook → Component → Screen) | PASS |
| File size (all files under 300 lines) | PASS (RegisterFormCard at 274, see W-001) |
| File naming conventions | PASS |
| Folder depth (≤ 3 levels below feature root) | PASS |
| Cross-feature access via adapters | PASS — `legal.adapter` and `wanders/adapters/services/*.adapter` |
| Controller fan-out (≤ 5 collaborators) | PASS — 3 import sources |
| DAL scope (no permission enforcement) | PASS |
| Identity surface rule (`actorId`/`kind` only, no `profileId`/`vportId`) | PASS |
| UI purity rule §8 (no business logic, DB queries, or domain validation in screen/component) | PASS |
| Dependency direction (app → engine → shared) | PASS |
| RegisterScreen purity | PASS — pure delegation to hook + component |

---

## Overall Status

**PARTIALLY COMPLIANT**

The registration flow's layering, import discipline, and identity surface are all correct. Two HIGH violations exist entirely within the styling system — both `RegisterFormCard.jsx` and `ConsentCheckbox.jsx` are pervasively non-compliant with the `--vc-*` token requirement. Three MEDIUM violations (adapter model export, business logic in hook, internal handle leak) are addressable without structural changes. No CRITICAL violations.

---

## Recommended Resolution Order

1. **H-001 / H-002** — Replace all `[#hex]` arbitrary Tailwind values and inline `style` rgba values with `var(--vc-*)` tokens in both components. Coordinate with `src/styles/citizens-theme.css` to add any missing tokens first.
2. **M-001** — Remove `isEmailVerifiedModel` from `auth.adapter.js`. Find consumers and route them through a hook or controller.
3. **M-002** — Move post-registration consent orchestration into `ctrlRegisterAccount` or a new `ctrlRecordPostSignupConsent`. Return a richer result object so the hook only reacts.
4. **M-003** — Remove `handleRegister` from the hook's public return.
5. **W-001** — Pre-split `RegisterFormCard.jsx` before adding any new UI.
6. **W-002** — Delete `console.error` at line 146.
