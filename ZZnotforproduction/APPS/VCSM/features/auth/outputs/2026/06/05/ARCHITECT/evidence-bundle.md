# Evidence Bundle — VCSM:auth ForgotPassword Sub-Module
**ARCHITECT V2 | 2026-06-05 | Scanner v1.1.0**

---

## Scope
Feature: VCSM:auth
Module: forgotpassword
Primary root: `apps/VCSM/src/features/auth/`
Routes covered: `/forgot-password`, `/reset` (ForgotPassword), `/reset-password` (Phase 2)

---

## Source Files Read

| File | Layer | Lines |
|---|---|---|
| ForgotPasswordScreen.jsx | screen | 1-133 |
| useResetPassword.js | hook | 1-73 |
| sendResetPassword.controller.js | controller | 1-11 |
| setNewPassword.controller.js | controller | 1-188 |
| resetPassword.dal.js | dal | 1-30 |
| resetPasswordSecure.dal.js | dal | 1-31 |
| resetPassword.model.js | model | 1-3 |
| authInputValidation.model.js | model | 1-79 |
| auth.adapter.js | adapter | 1-8 |
| auth.routes.jsx | route | 1-82 |
| AuthPublicRoute.jsx | route-guard | 1-32 |
| AuthProvider.jsx | provider | 1-269 |

---

## Layer Counts (ForgotPassword sub-module)

| Layer | Count | Files |
|---|---|---|
| screen | 1 | ForgotPasswordScreen.jsx |
| hook | 1 | useResetPassword.js |
| controller | 2 | sendResetPassword.controller.js, setNewPassword.controller.js |
| dal | 2 | resetPassword.dal.js, resetPasswordSecure.dal.js |
| model | 2 | resetPassword.model.js, authInputValidation.model.js |
| adapter | 1 | auth.adapter.js |
| route | 1 | auth.routes.jsx |
| route-guard | 1 | AuthPublicRoute.jsx |

---

## Call Chains

**CHAIN-auth-fp-001 — Email Reset Request (ForgotPassword Phase 1)**
```
ForgotPasswordScreen
  → useResetPassword.handleReset
    → ctrlSendResetPasswordEmail(email)
      → validateEmail(email)            [normalize + length + format]
        → dalSendResetPasswordEmail({ email, redirectTo })
          → supabase.auth.resetPasswordForEmail(email, { redirectTo })
```
User-controlled params: `email`
Input validation: YES (`validateEmail` in controller before DAL call)
Auth required: NO (public route)

**CHAIN-auth-fp-002 — Recovery Permit Registration (AuthProvider)**
```
Supabase PASSWORD_RECOVERY event
  → AuthProvider event handler
    → dalRegisterRecoveryPermit()
      → auth-register-recovery (Edge Function)
        → platform.auth_recovery_permits INSERT
          → _setRecoveryFlag(permitId) → sessionStorage[vc.auth.recovery]
            → navigate('/reset-password')
```
User-controlled params: NONE (event-driven)
Auth: Supabase session JWT validated by Edge Function

**CHAIN-auth-fp-003 — Password Update (Phase 2)**
```
ResetPasswordScreen
  → useSetNewPassword
    → updatePasswordController({ password })
      → evaluateRegisterPasswordRules(password)
      → readRecoveryPermit()            [sessionStorage UUID + issuedAt + TTL]
        → dalUpdatePasswordSecure({ permitId, password })
          → auth-reset-password-secure (Edge Function)
            → validate permitId vs. platform.auth_recovery_permits
              → admin.updateUserById (password update)
                → dalSignOutRecoverySession()
```
User-controlled params: `password`, `permitId` (UUID from sessionStorage)
Two-layer security: sessionStorage (UX gate) + DB permit (authoritative boundary)

---

## Security-Sensitive Surfaces

| Surface | File | Risk | Priority |
|---|---|---|---|
| dalSendResetPasswordEmail | resetPassword.dal.js | Email is user input → Supabase auth API | MEDIUM |
| redirectTo construction | sendResetPassword.controller.js:8 | Static origin + suffix; no user input | LOW |
| dalUpdatePasswordSecure | resetPasswordSecure.dal.js | permitId + password → Edge Function (server-validated) | HIGH |
| readRecoveryPermit (sessionStorage) | setNewPassword.controller.js:55-74 | User-writable storage; DB is authoritative boundary | LOW |
| dalUpdateUserPassword (unused in secure flow) | resetPassword.dal.js:16-20 | Dead export — verify no undocumented callers exist | MEDIUM |

---

## Behavior IDs Referenced

No BEHAVIOR.md entries confirmed for ForgotPassword-specific invariants.
**MISSING:** ForgotPassword behavioral invariants (email enumeration, cooldown, redirectTo safety). Route to SPIDER-MAN.

---

## Provenance

Source maps consumed: feature-map, callgraph, dependency-map, route-map, edge-function-map, security-path-map, write-surface-map
Source files validated: 12
Overall confidence: HIGH
