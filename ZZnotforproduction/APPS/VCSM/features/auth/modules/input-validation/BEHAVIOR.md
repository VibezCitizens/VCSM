---
title: Input Validation Module — Behavior
status: STUB
feature: auth
module: input-validation
source: red-team-derived
created: 2026-06-06
---

# auth / modules / input-validation — BEHAVIOR

## Status

STUB. Derived from TICKET-AUTH-INPUT-VALIDATION-001 (2026-06-05).

---

## Confirmed Behaviors

### Redirect Handling (all post-auth navigations)

- Post-login: useLogin.js reads `location.state.from` and navigates if not in blocklist
- Post-register: useRegister.js reads `location.state.from` and navigates if not in blocklist
- Post-onboarding: useAuthOnboarding.js redirects with NO blocklist
- Blocklist approach (not allowlist) means any unlisted external URL can be navigated to

### Email Input Handling

- All auth forms use `type="email"` inputs — browser-native format check
- sendResetPassword.controller.js performs the strongest client-side email validation: normalize → length check → format check
- login and register rely on Supabase as the email format authority (no controller-level validate)
- Emails are `trim()`-ed but NOT `toLowerCase()`-ed — case-sensitive mismatch risk

### Password Input Handling

- Registration: password rules enforced by registerPasswordRules.model.js (exact rules UNVERIFIED)
- Recovery: set-new-password enforced server-side by Supabase; no client-side strength check confirmed
- Password fields use `type="password"` — not logged or echoed

### Error Message Handling

- Login errors: raw `err.message` from Supabase surfaced to user (leaks Supabase error codes)
- Reset password: custom error message formatting (UNVERIFIED)
- All error display via React state → JSX rendering — XSS-safe

### XSS Resistance

- JSX auto-escaping eliminates XSS from all user-controlled string rendering
- No `dangerouslySetInnerHTML` used in auth screens (verified)
- DEV-only exception: errorDescription URL param → text injection in error object (not production risk)

---

## Critical Invariants

1. Post-auth redirects MUST use a same-origin allowlist — current blocklist-only approach is insufficient
2. Email inputs MUST normalize to lowercase before server submission — `toLowerCase()` missing
3. `dangerouslySetInnerHTML` MUST NOT be introduced in any auth screen
4. Raw `err.message` surfacing MUST be replaced with user-safe error messages in login
