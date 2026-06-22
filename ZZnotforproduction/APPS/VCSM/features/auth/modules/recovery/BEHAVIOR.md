---
title: Recovery Module — Behavior
status: STUB
feature: auth
module: recovery
source: architect-derived
created: 2026-06-05
---

# auth / modules / recovery — BEHAVIOR

## Status

STUB. Behaviors seeded from ARCHITECT review.

## Confirmed Behaviors

### Forgot Password (send reset link)
- ForgotPasswordScreen: email input form
- useResetPassword → sendResetPassword.controller → resetPassword.dal → supabase.auth.resetPasswordForEmail
- On success: confirmation message shown; email sent by Supabase

### Set New Password (after clicking reset link)
- User arrives at /reset-password via email link (auth callback handles token exchange)
- ResetPasswordScreen: new password input
- useSetNewPassword → setNewPassword.controller → supabase.auth.updateUser({ password })
- SECURITY GAP: nonce gate is sessionStorage check only — client-side, not server-enforced (VEN-AUTH-001 / THOR BLOCKER)
- After password update: dalSignOutRecoverySession → signs out recovery session
- SECURITY GAP: dalSignOutRecoverySession failure is silently swallowed (BW-AUTH-003)

### Resend Email Verification
- VerifyEmailRequiredScreen: button to resend
- useResendVerification → resendVerification.controller → emailVerification.dal → supabase.auth.resend
- Requires authenticated session

## Critical Security Invariant (VIOLATED — THOR BLOCKER)

The current implementation gates password update on a sessionStorage nonce. This nonce is:
1. Stored client-side (sessionStorage)
2. Readable and writable by any JS on the page
3. Not enforced server-side by Supabase auth.updateUser

Any authenticated user can manually set a conforming sessionStorage nonce and reach setNewPassword without going through the reset link flow (BW-AUTH-004 — self-exploit verified).

## TODO

- [ ] Read ELEKTRA Edge Function patch advisory for full remediation path
- [ ] Confirm dalSignOutRecoverySession error handling — is failure logged anywhere?
- [ ] Confirm whether PKCE flow is enabled (would partially mitigate)
