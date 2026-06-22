---
title: ForgotPassword Module — Architecture
status: STUB
feature: auth
module: forgot-password
source: architect-derived
created: 2026-06-06
---

# auth / modules / forgot-password — ARCHITECTURE

## Status

STUB. Layer stack derived from ARCHITECT V2 (2026-06-05). Source: `outputs/2026/06/05/ARCHITECT/vcsm.auth.forgotpassword.architecture.md`

## Phase 1 Layer Stack — Send Reset Email

```
AppRoutes (index.jsx)
  └── authPublicRoutes() (auth.routes.jsx)
        └── AuthPublicRoute (AuthPublicRoute.jsx)
              └── useAuth() → dalHydrateAuthSession → supabase.auth.getSession
              └── ForgotPasswordScreen.jsx [lazy]
                    └── useResetPassword.js
                          └── ctrlSendResetPasswordEmail (sendResetPassword.controller.js)
                                ├── String(email).trim()              [normalize]
                                ├── if (!normalizedEmail) throw       [empty guard]
                                └── dalSendResetPasswordEmail (resetPassword.dal.js)
                                      └── supabase.auth.resetPasswordForEmail(
                                            email,
                                            { redirectTo: `${window.location.origin}/reset-password` }
                                          )
                                            └── Supabase API → sends reset email to user
```

## Redirect Target Construction

`redirectTo` is constructed as `${window.location.origin}/reset-password` inside the DAL.
This is correct — routes the Supabase reset email link back to the same origin.
Not an open redirect; Supabase controls email delivery.

## Route Guard Stack

```
AuthPublicRoute
  └── useAuth() (AuthProvider.jsx)
        └── dalHydrateAuthSession (authSession.read.dal.js)
              └── supabase.auth.getSession
        └── dalSubscribeAuthStateChange (authSession.read.dal.js)
              └── supabase.auth.onAuthStateChange
```

## Input Validation Chain

```
useResetPassword.js
  ├── canSubmit: isValidEmailFormat(email)    ← client-side gate, regex only
  └── ctrlSendResetPasswordEmail(email)
        └── validateEmail(email)              ← controller-level: normalize + length + format
              └── dalSendResetPasswordEmail   ← only reached on valid input
```

## Style Dependencies

- authTheme.js
- registerFormCard.css
- useTranslation (@i18n)

## Note on Phase 2

Phase 2 (ResetPasswordScreen, setNewPassword, recovery session sign-out, THOR BLOCKER)
is owned by the `recovery` module. See `modules/recovery/ARCHITECTURE.md`.
