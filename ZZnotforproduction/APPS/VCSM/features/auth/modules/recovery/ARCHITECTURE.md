---
title: Recovery Module — Architecture
status: STUB
feature: auth
module: recovery
source: architect-derived
created: 2026-06-05
---

# auth / modules / recovery — ARCHITECTURE

## Status

STUB. Layer stack seeded from ARCHITECT review.

## Send Reset Email Layer Stack

```
ForgotPasswordScreen.jsx
  └── useResetPassword.js
        └── sendResetPassword.controller.js
              └── resetPassword.dal.js → supabase.auth.resetPasswordForEmail(email)
```

## Set New Password Layer Stack (THOR BLOCKER)

```
ResetPasswordScreen.jsx
  └── useSetNewPassword.js
        └── setNewPassword.controller.js (updatePasswordController)
              ├── [sessionStorage nonce check — CLIENT-SIDE ONLY]
              │     ← THOR BLOCKER: not server-enforced (VEN-AUTH-001)
              ├── supabase.auth.updateUser({ password: newPassword })
              └── dalSignOutRecoverySession()
                    ← silent failure risk (BW-AUTH-003)
```

## Resend Verification Layer Stack

```
VerifyEmailRequiredScreen.jsx
  └── useResendVerification.js
        └── resendVerification.controller.js
              └── emailVerification.dal.js → supabase.auth.resend
```

## ELEKTRA Patch Advisory Summary

ELEKTRA proposed an Edge Function to enforce recovery session server-side. Full advisory in:
`ZZnotforproduction/APPS/VCSM/features/auth/outputs/2026/06/04/ELEKTRA/2026-06-04_23-10_elektra_auth-security-scan.md`

## TODO

- [ ] Read ELEKTRA patch advisory — implement Edge Function gate before next release
- [ ] Confirm dalSignOutRecoverySession implementation — what session does it invalidate?
- [ ] Confirm whether PKCE is enabled (Supabase project config)
