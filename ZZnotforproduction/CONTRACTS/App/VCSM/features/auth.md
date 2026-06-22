# Feature Contract: auth

**Status:** CLEAN  
**Risk:** LOW  
**Files:** 56 (scanner 2026-06-05)  
**Inbound imports:** 9  
**Outbound imports:** 3  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`auth` owns the complete authentication lifecycle for the VCSM application:
- Login (email/password)
- Registration with consent capture
- Password reset and set-new-password flows
- Email verification / resend verification
- Onboarding and profile completion flow after registration
- Auth callback handling (OAuth or magic link)
- Session management

`auth` is a **platform primitive**. It does not implement business features — it provides the authentication foundation that all other features depend on.

---

## 2. Non-Goals

`auth` must not own:
- Identity resolution (which actor is the authenticated user) — that belongs to `identity/`
- Vport creation — that belongs to `vport/`
- Legal document rendering — that belongs to `legal/`
- Profile display — that belongs to `profiles/`
- Navigation post-authentication beyond the auth flow itself

---

## 3. Public API / Adapter Boundary

**Known adapter:**
- `apps/VCSM/src/features/auth/adapters/auth.adapter.js`

This adapter is the only approved entry point for other features to consume auth functionality. Direct imports into `auth/hooks/`, `auth/controllers/`, or `auth/dal/` from outside the auth feature are violations.

**Consumers confirmed by scanner:**
- `legal/` — 2 imports from `auth/adapters/auth.adapter` (ConsentGateScreen, LegalDocumentScreen)

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `auth/adapters/` | Public API boundary — `auth.adapter.js` |
| hooks | `auth/hooks/` | `useLogin`, `useRegister`, `useAuthCallback`, `useAuthOnboarding`, `useResendVerification`, `useResetPassword`, `useSetNewPassword` — confirmed by git status |
| controllers | `auth/controllers/` | `login.controller`, `register.controller`, `onboarding.controller`, `authCallback.controller`, `sendResetPassword.controller`, `setNewPassword.controller` — confirmed by git status |
| dal | `auth/dal/` | `login.dal`, `register.dal`, `resetPassword.dal` — confirmed by git status |
| model | `auth/model/` | `registerPasswordRules.model` — confirmed by git status |
| screens | `auth/screens/` | `LoginScreen`, `RegisterScreen`, `ForgotPasswordScreen` — confirmed by git status |
| components | `auth/components/` | `ConsentCheckbox`, `RegisterFormCard` — confirmed by git status |
| adapters/ui | `auth/adapters/ui/` | TODO: confirm if UI adapter subfolder exists |

---

## 5. Allowed Dependencies

| Feature | Reason |
|---|---|
| `legal` | Registration requires consent capture — `auth/hooks/useRegister.js` calls `legal/adapters/legal.adapter` |

Auth is a Layer 0 platform primitive. It must not import from Layer 1+ features. The `legal` exception is classified as LEGITIMATE BIDIR (Pair 2) — both sides at adapter boundary.

---

## 6. Prohibited Dependencies

Auth must not import from:
- `profiles/` — profile display is not auth's concern
- `identity/` — auth produces a session; identity consumes it to resolve an actor
- `feed/`, `post/`, `social/`, `notifications/` — all higher-layer features
- `dashboard/`, `settings/`, `vport/` — management features
- Any feature not listed in Section 5

---

## 7. DAL / Controller Rules

**DAL rules for `auth/dal/`:**
- May call Supabase `auth.signIn`, `auth.signUp`, `auth.signOut`, `auth.resetPasswordForEmail`, `auth.updateUser`
- Must not apply business rules or return derived flags
- Must not import from models, controllers, hooks, or other feature modules
- Must not check ownership or role — pure auth operations only

**Controller rules for `auth/controllers/`:**
- Own the complete lifecycle decision for each auth action (login, register, onboarding)
- Must call `legal/adapters/legal.adapter` for consent verification (not `legal/dal/` or `legal/controllers/`)
- Must not import Supabase directly — go through auth DAL
- `onboarding.controller` is >200 lines (flagged in architecture review) — acceptable for orchestration controllers; does not violate layer contract

---

## 8. Known Coupling

**Bidirectional pair:**
- `auth` ↔ `legal` — LEGITIMATE (Pair 2 in ARCH-BIDIR-001)
  - auth→legal: `useRegister.js` imports `legal/adapters/legal.adapter`
  - legal→auth: `ConsentGateScreen.jsx` and `LegalDocumentScreen.jsx` import `auth/adapters/auth.adapter`

No other cross-feature coupling confirmed.

---

## 9. Risk Notes

**LOW.** Auth is the best-structured feature in the codebase per the architecture review. Zero scanner violations. The bidirectional pair with legal is legitimate and through adapters.

Minor issues noted (not violations):
- `RegisterFormCard.jsx` >200 lines — form logic may be extractable to a hook (not a contract violation)
- `ui/` has 1 file — sparse layer (not a violation)
- `usecases/` folder has 1 file — evaluate whether to fold into controllers

---

## 10. Migration Notes

No pending split or migration for auth. Auth structure is considered stable.

The `usecases/` folder should be evaluated in ARCH-NAMING-001 — if it is a single file, fold into `controllers/`.

---

## 11. Unknowns

- TODO: Confirm whether `auth/adapters/ui/` exists as a subfolder
- TODO: Confirm full list of exports in `auth.adapter.js` (scanner shows 9 inbound imports from auth adapter)
- TODO: Confirm whether `usecases/` has more than 1 file
