---
title: Recovery Module — Index
status: STUB
feature: auth
module: recovery
source: architect+venom+elektra+bw-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/auth/
scanner-version: 1.1.0
---

# auth / modules / recovery

Password reset and email verification flows. **THOR BLOCKER: VEN-AUTH-001 / ELEK-2026-06-04-001** — recovery provenance gate is client-side only; Supabase updateUser lacks server-side recovery session enforcement.

## Module Summary

| Field | Value |
|---|---|
| Module | recovery |
| Feature | auth |
| Source Path | apps/VCSM/src/features/auth/ |
| Screens | 3 (ForgotPasswordScreen, ResetPasswordScreen, VerifyEmailRequiredScreen) |
| Routes | /forgot-password, /reset-password, /verify-email |
| Write Surfaces | Supabase auth.resetPasswordForEmail, Supabase auth.updateUser (password), Supabase auth.resend |
| Controllers | 3 (sendResetPassword, setNewPassword, resendVerification) |
| DAL Files | 2 (resetPassword.dal, emailVerification.dal) |
| Hooks | 3 (useResetPassword, useSetNewPassword, useResendVerification) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| screens/ForgotPasswordScreen.jsx | Screen | Email input for reset link |
| screens/ResetPasswordScreen.jsx | Screen | New password input (after clicking reset link) |
| screens/VerifyEmailRequiredScreen.jsx | Screen | Resend verification email prompt |
| hooks/useResetPassword.js | Hook | Send reset email mutation |
| hooks/useSetNewPassword.js | Hook | Set new password mutation |
| hooks/useResendVerification.js | Hook | Resend verification email mutation |
| controllers/sendResetPassword.controller.js | Controller | auth.resetPasswordForEmail |
| controllers/setNewPassword.controller.js | Controller | auth.updateUser (password) + recovery session sign-out |
| controllers/resendVerification.controller.js | Controller | auth.resend |
| dal/resetPassword.dal.js | DAL | Supabase auth reset email |
| dal/emailVerification.dal.js | DAL | Supabase auth resend verification |
| model/emailVerification.model.js | Model | Verification state shape |

## Write Surface Map

| Operation | Surface | Guard |
|---|---|---|
| resetPasswordForEmail | Supabase auth | Email existence check (Supabase-managed) |
| updateUser (password) | Supabase auth | sessionStorage nonce gate (CLIENT-SIDE ONLY — VEN-AUTH-001) |
| resend verification | Supabase auth | Authenticated session required |
| dalSignOutRecoverySession | Supabase auth | After updateUser (silent failure risk — BW-AUTH-003) |

## Security Flags

- **THOR BLOCKER** HIGH: VEN-AUTH-001 / ELEK-2026-06-04-001 / BW-AUTH-004 — recovery provenance gate is sessionStorage nonce check (client-side only); supabase.auth.updateUser does not enforce server-side recovery session; authenticated user can manually set conforming nonce; Edge Function patch advisory provided by ELEKTRA
- MEDIUM: BW-AUTH-003 — dalSignOutRecoverySession failure silently swallowed in updatePasswordController; recovery session remains valid if sign-out fails transiently
- LOW: ELEK-2026-06-04-005 — getSession() (cached JWT) used for session checks in recovery flow; getUser() (server-verified) is stronger pattern

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Read ELEKTRA patch advisory for VEN-AUTH-001 — Edge Function solution proposed
- [ ] Confirm dalSignOutRecoverySession error handling in setNewPassword.controller.js
- [ ] Confirm sessionStorage nonce format — random token or boolean flag?
- [ ] Confirm whether Supabase PKCEflow is enabled (mitigates recovery session risk)
