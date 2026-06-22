# PATCH LOG — Register Screen

**Ticket:** SEC-REG-BATCH-1 + Contract Review P1–P5
**Date:** 2026-06-06
**Status:** COMPLETE

---

## Source

Contract review findings on the `/register` route full module chain.
See: `ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/06/review-contract/2026-06-06_review-contract_register-screen.md`

---

## P1 — Replace hardcoded hex colors with `--vc-*` tokens

**Finding:** H-001  
**Files changed:**

### `apps/VCSM/src/styles/citizens-theme.css`

New tokens added to support ConsentCheckbox colors not yet in the system:
- `--vc-accent-primary-deep: #7c3aed` — deeper purple for gradients and checkbox fill
- `--vc-accent-glow-sm: 0 0 10px rgba(139, 92, 246, 0.40)` — tight accent glow for checkbox

Added in `/* ── Accents ── */` section (after `--vc-accent-primary-hover`) and `/* ── Card shadows ── */` section (after `--vc-shadow-glow`).

### `apps/VCSM/src/features/auth/components/RegisterFormCard.jsx`

26 hardcoded hex values replaced with `--vc-*` tokens. Key mappings:

| Before | After |
|---|---|
| `bg-[#6C4DF6]` | `bg-[var(--vc-cta)]` |
| `hover:bg-[#7657ff]` | `hover:bg-[var(--vc-cta-hover)]` |
| `focus:border-[#6C4DF6]/80` | `focus:border-[var(--vc-cta-border)]` |
| `focus:ring-[#6C4DF6]/40` | `focus:ring-[var(--vc-cta-ring)]` |
| `shadow-[0_10px_30px_rgba(108,77,246,0.35)]` | `shadow-[var(--vc-cta-shadow)]` |
| `text-[#9ca3af]` / `text-[#9892a6]` | `text-[var(--vc-text-muted)]` |
| `text-[#d1d5db]` | `text-[var(--vc-text-soft)]` |
| `text-[#22c55e]` | `text-[var(--vc-success)]` |
| `text-[#ef4444]` | `text-[var(--vc-error)]` |
| `text-[#c4b5fd]` | `text-[var(--vc-link)]` |
| `text-[#ddd6fe]` | `text-[var(--vc-link-hover)]` |
| Radial gradient hex values | `var(--vc-gradient-a)`, `var(--vc-gradient-b)`, `var(--vc-bg-0)` |
| Card background `linear-gradient(...)` | `var(--vc-card-bg)` |

Note: Tailwind `/opacity` modifiers on CSS var arbitrary values dropped where unreliable (hex-format tokens). Used `opacity-80` utility class or dropped the modifier instead.

### `apps/VCSM/src/features/auth/components/ConsentCheckbox.jsx`

2 hardcoded hex values replaced:

| Before | After |
|---|---|
| `border-[#8b5cf6] bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] shadow-[0_0_10px_rgba(139,92,246,0.4)]` | `border-[var(--vc-accent-primary)] bg-gradient-to-br from-[var(--vc-accent-primary)] to-[var(--vc-accent-primary-deep)] shadow-[var(--vc-accent-glow-sm)]` |
| `text-[#d1d5db]` | `text-[var(--vc-text-soft)]` |

---

## P2 — Remove model export from adapter; expose via hook

**Finding:** H-002

### `apps/VCSM/src/features/auth/hooks/useEmailVerified.js` — CREATED

```js
import { isEmailVerifiedModel } from '@/features/auth/model/emailVerification.model'

export function useEmailVerified(user) {
  return isEmailVerifiedModel(user)
}
```

### `apps/VCSM/src/features/auth/adapters/auth.adapter.js`

- Removed: `export { isEmailVerifiedModel } from '@/features/auth/model/emailVerification.model'`
- Added: `export { useEmailVerified } from '@/features/auth/hooks/useEmailVerified'`

### `apps/VCSM/src/app/guards/ProtectedRoute.jsx`

Only consumer of the removed model export. Updated:
- Import: `isEmailVerifiedModel` → `useEmailVerified`
- Usage: `if (!isEmailVerifiedModel(user))` → `const isEmailVerified = useEmailVerified(user)` + `if (!isEmailVerified)`

---

## P3 — Move consent orchestration from hook to controller

**Finding:** M-001

### `apps/VCSM/src/features/auth/controllers/register.controller.js`

New export added:
```js
export async function ctrlRecordSignupConsent({ recordConsentFn, userId }) {
  try {
    await recordConsentFn({ userId })
    return { ok: true, error: null }
  } catch (error) {
    captureFrontendError(error, { feature: 'auth', module: 'register', ... })
    return { ok: false, error: 'Your account was created but we could not record your legal consent...' }
  }
}
```

Architecture note: `recordConsentFn` injected as parameter because `recordSignupConsent` comes from a hook (`useSignupConsent`). Controller owns try/catch, monitoring, and error message; hook owns call sequencing and state updates.

### `apps/VCSM/src/features/auth/hooks/useRegister.js`

10-line consent try/catch block replaced with:
```js
const consentResult = await ctrlRecordSignupConsent({
  recordConsentFn: recordSignupConsent,
  userId,
})
if (!consentResult.ok) {
  setConsentError(consentResult.error)
  return false
}
```

---

## P4 — Remove `handleRegister` from hook public return

**Finding:** M-002

`handleRegister` removed from the `return {}` object in `useRegister.js`. Function still exists internally — called by `handleSubmit`. Only the public exposure was removed.

---

## P5 — Remove `console.error` from registration flow

**Finding:** M-003

Removed as part of P3 block replacement. The `console.error` at the consent catch block no longer exists.

---

## SEC-REG-BATCH-1 — Security Hardening

**Task 1 (console.error removal):** Already complete via P5.

---

### Task 2 — Validate `navState.from` in `useRegister.js`

**Finding:** W-002

**File:** `apps/VCSM/src/features/auth/hooks/useRegister.js`

- Added `isSafeAuthReturnPath` to import from `@/features/auth/model/authInputValidation.model`
- Line 48 changed:

```js
// Before
const fromState = typeof state.from === 'string' ? state.from : null

// After
const fromState = typeof state.from === 'string' && isSafeAuthReturnPath(state.from) ? state.from : null
```

Unsafe paths (external URLs, protocol-relative `//evil.com`, unknown prefixes) now become `null` and fall through to the intent-based fallback (`/welcome?intent=...` or `/welcome`).

---

### Task 3 — Validate `navState.from` in onboarding redirect flow

**Finding:** W-002 (downstream)

**File:** `apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js`

- Added new import: `import { isSafeAuthReturnPath } from '@/features/auth/model/authInputValidation.model'`
- Line 33 changed:

```js
// Before
redirectTo: typeof state.from === 'string' ? state.from : '/',

// After
redirectTo: typeof state.from === 'string' && isSafeAuthReturnPath(state.from) ? state.from : '/',
```

Closes the open-redirect at `navigate(navState.redirectTo, { replace: true })` (line 144). Unsafe values fall to `'/'`.

---

### Task 4 — `useRef`-based double-submit protection

**File:** `apps/VCSM/src/features/auth/hooks/useRegister.js`

Pattern matched from `useResetPassword.js` existing implementation.

- Added `useRef` to React import
- Added `const submittingRef = useRef(false)` before `handleRegister`
- Guard added at submission entry:

```js
if (!canSubmit || submittingRef.current) return false
submittingRef.current = true
```

- Reset in `finally`:

```js
finally {
  submittingRef.current = false
  setLoading(false)
}
```

Concurrent or rapid-double-tap calls to `handleRegister` are blocked until the current submission fully exits (success, failure, or thrown error).

---

## Grep Verification

| Check | Result |
|---|---|
| Hex colors in `RegisterFormCard.jsx` | CLEAN — 0 remaining |
| Hex colors in `ConsentCheckbox.jsx` | CLEAN — 0 remaining |
| `isEmailVerifiedModel` in `auth.adapter.js` | CLEAN — removed |
| `isSafeAuthReturnPath` in `useRegister.js` | CONFIRMED — L10 import, L48 usage |
| `isSafeAuthReturnPath` in `useAuthOnboarding.js` | CONFIRMED — L8 import, L33 usage |
| `submittingRef` in `useRegister.js` | CONFIRMED — declaration L115, guard L122, set L123, reset L173 |
| `console.error` in `useRegister.js` | CLEAN — 0 remaining |
