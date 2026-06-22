---
title: Input Validation Module — Architecture
status: STUB
feature: auth
module: input-validation
source: red-team-derived
created: 2026-06-06
---

# auth / modules / input-validation — ARCHITECTURE

## Status

STUB. Derived from TICKET-AUTH-INPUT-VALIDATION-001 (2026-06-05).
Source: `outputs/2026/06/05/INPUT-VALIDATION/TICKET-AUTH-INPUT-VALIDATION-001.md`

---

## Validation Layer Map

### Redirect Safety

```
useLogin.js
  └── post-login redirect: state.from
        ├── blocklist check: ['/login', '/register', '/reset', '/forgot-password']
        └── navigate(dest)    ← OPEN REDIRECT if dest not in blocklist (IV-SEC-001)

useRegister.js
  └── post-register redirect: state.from
        └── same blocklist pattern (IV-SEC-001 shared)

useAuthOnboarding.js
  └── post-onboarding redirect
        └── NO blocklist at all (ONBOARDING-SEC-003)
```

### Email Validation

```
sendResetPassword.controller.js
  └── validateEmail(email)     ← normalize + length + format check (STRONGEST)

useResetPassword.js
  └── isValidEmailFormat(email)   ← regex gate (canSubmit)

useLogin.js, useRegister.js
  └── No explicit email format validation — browser type=email + Supabase are relied on
```

### Password Validation

```
RegisterScreen.jsx
  └── registerPasswordRules.model.js   ← password rule set (unknown if length-enforced)

useSetNewPassword.js
  └── Supabase server-side enforcement (no client-side length pre-check confirmed)
```

### Error Surface Map

```
useLogin.js
  └── setError(err.message)   ← raw Supabase error message surfaced (IV-SEC-003)

useRegister.js, useResetPassword.js
  └── error handling pattern — UNVERIFIED (needs source review)
```

### XSS Resistance

All auth screens use JSX rendering — no `dangerouslySetInnerHTML` found.
JSX auto-escaping blocks reflected XSS from any user-controlled string.
Exception: DEV-mode errorDescription URL param (FP-SEC-004, text injection PARTIAL).
