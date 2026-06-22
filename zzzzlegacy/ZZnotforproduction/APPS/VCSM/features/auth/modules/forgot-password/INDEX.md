---
title: ForgotPassword Module — Index
status: STUB
feature: auth
module: forgot-password
source: architect+venom+bw+elektra-derived
created: 2026-06-06
source-path: apps/VCSM/src/features/auth/
scanner-version: 1.1.0
---

# auth / modules / forgot-password

Phase 1 of the password reset flow. Accepts an email address and sends a Supabase reset link. Phase 2 (ResetPasswordScreen, set new password, recovery session) is owned by the `recovery` module.

## Module Summary

| Field | Value |
|---|---|
| Module | forgot-password |
| Feature | auth |
| Source Path | apps/VCSM/src/features/auth/ |
| Screens | 1 (ForgotPasswordScreen) |
| Routes | /forgot-password, /reset (alias) |
| Write Surfaces | Supabase auth.resetPasswordForEmail |
| Controllers | 1 (sendResetPassword.controller.js) |
| DAL Files | 1 (resetPassword.dal.js) |
| Hooks | 1 (useResetPassword.js) |
| Models | 2 (resetPassword.model.js, authInputValidation.model.js) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| screens/ForgotPasswordScreen.jsx | Screen | Email input form + success/error/cooldown states |
| hooks/useResetPassword.js | Hook | Form state, submit handler, cooldown, error |
| controllers/sendResetPassword.controller.js | Controller | Normalize email → validate → DAL call |
| dal/resetPassword.dal.js | DAL | supabase.auth.resetPasswordForEmail |
| model/resetPassword.model.js | Model | Email format validation (isValidEmailFormat) |
| model/authInputValidation.model.js | Model | Shared auth input validation (DUPLICATE RISK — see SECURITY.md) |

## Route Guard

| Route | Guard | Notes |
|---|---|---|
| /forgot-password | AuthPublicRoute | Redirects already-authenticated users away |
| /reset | AuthPublicRoute | Alias for /forgot-password |

## Security Summary

Highest severity: MEDIUM (FP-SEC-001 — dead export bypass risk)
THOR Release Blocker: NO

Full findings: [SECURITY.md](SECURITY.md)

## Cross-References

- Phase 2 (set new password / THOR BLOCKER): `modules/recovery/`
- ARCHITECT architecture report: `outputs/2026/06/05/ARCHITECT/vcsm.auth.forgotpassword.architecture.md`
- ARCHITECT screen boundary audit: `outputs/ARCHITECT/ARCHITECT_FORGOT_PASSWORD_2026-06-05.md`
- Full call chain evidence: `outputs/2026/06/05/ARCHITECT/evidence-bundle.md`
- VENOM findings: `outputs/2026/06/05/Venom/2026-06-05_00-00_venom_auth-forgotpassword.md`
- BLACKWIDOW findings: `outputs/2026/06/05/BlackWidow/2026-06-05_00-00_blackwidow_auth-forgotpassword.md`
- ELEKTRA patch advisory: `outputs/2026/06/05/ELEKTRA/2026-06-05_00-00_elektra_auth-forgotpassword.md`
- Contract review: `outputs/2026/06/05/review-contract/2026-06-05_22-39_review-contract_forgot-password-screen.md`
