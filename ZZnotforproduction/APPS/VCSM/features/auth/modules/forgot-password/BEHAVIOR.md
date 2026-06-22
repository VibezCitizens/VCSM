---
title: ForgotPassword Module — Behavior
status: STUB
feature: auth
module: forgot-password
source: architect+venom+bw-derived
created: 2026-06-06
---

# auth / modules / forgot-password — BEHAVIOR

## Status

STUB. Behaviors derived from ARCHITECT V2 (2026-06-05) and VENOM/BW findings.

---

## Confirmed Behaviors

### Entry Guard

- /forgot-password and /reset are guarded by AuthPublicRoute
- Authenticated users are redirected away before the screen renders
- Guard reads session via dalHydrateAuthSession (supabase.auth.getSession — cached JWT)

### Form Interaction

- ForgotPasswordScreen renders: email input, submit button, back-to-login link
- canSubmit computed: email non-empty AND isValidEmailFormat(email) passes (regex)
- Submit button disabled when canSubmit is false

### Submit Flow

1. User enters email and submits form
2. `handleReset(event)` fires: `event.preventDefault()`, clears error state, sets loading
3. `ctrlSendResetPasswordEmail(email)` called:
   - Normalizes email via `String(email || '').trim()`
   - Throws if empty after normalization
   - Calls `dalSendResetPasswordEmail({ email: normalizedEmail, redirectTo })`
4. DAL calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
5. Supabase sends reset email (server-side; client has no visibility into delivery)
6. On success: confirmation message shown to user; loading cleared
7. On failure: error message set; loading cleared

### Client-Side Cooldown

- In-memory state prevents re-submission for a short window after success
- Cooldown reset on page reload — bypassable (see SECURITY.md FP-SEC-003)
- Supabase server-side rate limiting is the true backstop

### Error Handling

- Network/Supabase errors surface as user-visible error messages
- DEV mode: `errorDescription` from URL params may be included in error object (text only; XSS blocked by JSX — see FP-SEC-004)
- No PII logged from this screen

---

## Critical Invariants

1. `redirectTo` MUST resolve to `/reset-password` on the same origin. Never user-controlled.
2. Email validation at controller level is the input trust boundary — DAL must not be called with unnormalized input.
3. Supabase is the authoritative email format and rate-limit enforcer — client validation is UX only.

---

## TODOs

- [ ] Confirm exact cooldown duration and state location (useResetPassword.js)
- [ ] Confirm all error message variants shown to user (network error vs. Supabase error)
- [ ] Confirm success state UI (confirmation message exact text)
