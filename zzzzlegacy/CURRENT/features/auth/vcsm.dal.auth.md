# VCSM DAL — `auth`

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · `apps/VCSM/src/features/auth/dal/`  
_Confidence:_ STATICALLY\_TRACED  

---

## Summary

| Item | Count |
|---|---|
| DAL files | 11 |
| Exported functions | 29 |
| Tables accessed | 3 |
| RPCs called | 2 |
| Risk findings | 0 |

## DAL Files

### `actorCreate.dal.js`

**Path:** `features/auth/dal/actorCreate.dal.js`  
**Operations:** `rpc`  

**Exported functions:**

| `dalCreateUserActor` | `rpc` | —`create_actor_for_user` |

### `actorGetByProfile.dal.js`

**Path:** `features/auth/dal/actorGetByProfile.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `dalGetActorByProfile` | `read` | `actors` |

### `actorOwnerCreate.dal.js`

**Path:** `features/auth/dal/actorOwnerCreate.dal.js`  
**Operations:** `upsert`  

**Exported functions:**

| `dalCreateActorOwner` | `upsert` | `actor_owners` |

### `authCallback.dal.js`

**Path:** `features/auth/dal/authCallback.dal.js`  
**Operations:** `unknown`  

**Exported functions:**

| `dalExchangeCodeForSession` | `unknown` | — |

### `authSession.read.dal.js`

**Path:** `features/auth/dal/authSession.read.dal.js`  
**Operations:** `unknown`  

**Exported functions:**

| `dalGetAuthSession` | `unknown` | — |
| `dalHydrateAuthSession` | `unknown` | — |

### `emailVerification.dal.js`

**Path:** `features/auth/dal/emailVerification.dal.js`  
**Operations:** `unknown`  

**Exported functions:**

| `dalResendVerificationEmail` | `unknown` | — |

### `login.dal.js`

**Path:** `features/auth/dal/login.dal.js`  
**Operations:** `unknown`  

**Exported functions:**

| `dalGetAuthUser` | `unknown` | — |
| `dalSignInWithPassword` | `unknown` | — |
| `dalSignOut` | `unknown` | — |

### `onboarding.dal.js`

**Path:** `features/auth/dal/onboarding.dal.js`  
**Operations:** Auth API · SELECT · UPSERT · RPC  

**Exported functions:**

| Function | Operation | Table / RPC |
|---|---|---|
| `readCurrentAuthUserDAL` | Auth API `getUser` | — |
| `readProfileForOnboardingDAL` | SELECT | `profiles` |
| `readProfileShellDAL` | SELECT | `profiles` |
| `upsertProfileShellDAL` | UPSERT | `profiles` |
| `generateUsernameDAL` | RPC | `generate_username` |
| `upsertCompletedOnboardingProfileDAL` | UPSERT | `profiles` |

### `profile.dal.js`

**Path:** `features/auth/dal/profile.dal.js`  
**Operations:** `read` · `update`  

**Exported functions:**

| `dalGetProfileDiscoverable` | `read` · `update` | `profiles` |
| `dalUpdateProfileDiscoverable` | `read` · `update` | `profiles` |

### `register.dal.js`

**Path:** `features/auth/dal/register.dal.js`  
**Operations:** Auth API · UPSERT  

**Exported functions:**

| Function | Operation | Table |
|---|---|---|
| `dalReadRegisterSession` | Auth API `getSession` | — |
| `dalUpdateRegisterUser` | Auth API `updateUser` | — |
| `dalSignUpRegisterUser` | Auth API `signUp` | — |
| `dalSignOutRegisterSession` | Auth API `signOut` | — |
| `dalUpsertRegisterProfile` | UPSERT | `profiles` |
| `dalMirrorWandersSessionToPrimary` | Auth API `setSession` + `getSession` | — |

### `resetPassword.dal.js`

**Path:** `features/auth/dal/resetPassword.dal.js`  
**Operations:** `unknown`  

**Exported functions:**

| `dalExchangeRecoveryCode` | `unknown` | — |
| `dalSendResetPasswordEmail` | `unknown` | — |
| `dalSignOutRecoverySession` | `unknown` | — |
| `dalSubscribeToAuthStateChange` | `unknown` | — |
| `dalUpdateUserPassword` | `unknown` | — |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `actor_owners` | UPSERT | `dalCreateActorOwner` |
| `actors` | READ | `dalGetActorByProfile` |
| `profiles` | SELECT, UPDATE, UPSERT | `dalGetProfileDiscoverable`, `dalUpdateProfileDiscoverable`, `dalUpsertRegisterProfile`, `readProfileForOnboardingDAL`, `readProfileShellDAL`, `upsertCompletedOnboardingProfileDAL`, `upsertProfileShellDAL` |

## RPCs Called

| RPC | Via Functions |
|---|---|
| `create_actor_for_user` | `dalCreateUserActor` |
| `generate_username` | `generateUsernameDAL` |

---

## Risk Findings

No dead-code findings at DAL layer.

**Watch item:** `dalGetAuthSession` (`authSession.read.dal.js`) is consumed by 4 controllers — `authCallback`, `authSession`, `onboarding`, `profile`, and `setNewPassword`. It is the highest-fan-out read in this DAL layer. If session hydration shape changes, all 5 call chains are affected simultaneously. Any refactor of this function requires tracing all 5 consumers before shipping.

**Security improvement note:** `authCallback.controller.js` now sanitizes attacker-controllable auth callback error descriptions in production and verifies a valid session before treating hash recovery callbacks as password recovery. These are controller-layer improvements; no DAL code change is required.

**Trust boundary improvement note:** `register.dal.js` now accepts an injectable Supabase client override for Auth API/profile operations. Wanders client selection lives in `register.controller.js`; the DAL no longer imports the Wanders client adapter directly.

---

## Pending Reviews

No pending reviews — dead code audit completed 2026-05-11. All chains verified live.

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `actorCreate.dal.js`

**Direct callers:**

- `createUserActor.controller.js` _Controller_

**Full call chain to screen:**

```
`actorCreate.dal.js` → `createUserActor.controller.js` → `onboarding.controller.js` → `bootstrapJoinOnboardingController` → `auth.adapter.js` → `joinBarbershopAccount.controller.js` → `useJoinBarbershop.js` → `JoinBarbershopScreen.jsx`
```

### `actorGetByProfile.dal.js`

**Direct callers:**

- `createUserActor.controller.js` _Controller_

**Full call chain to screen:**

```
`actorGetByProfile.dal.js` → `createUserActor.controller.js` → `onboarding.controller.js` → `bootstrapJoinOnboardingController` → `auth.adapter.js` → `joinBarbershopAccount.controller.js` → `useJoinBarbershop.js` → `JoinBarbershopScreen.jsx`
```

### `actorOwnerCreate.dal.js`

**Direct callers:**

- `createUserActor.controller.js` _Controller_

**Full call chain to screen:**

```
`actorOwnerCreate.dal.js` → `createUserActor.controller.js` → `onboarding.controller.js` → `bootstrapJoinOnboardingController` → `auth.adapter.js` → `joinBarbershopAccount.controller.js` → `useJoinBarbershop.js` → `JoinBarbershopScreen.jsx`
```

### `authCallback.dal.js`

**Direct callers:**

- `authCallback.controller.js` _Controller_

**Full call chain to screen:**

```
`authCallback.dal.js` → `authCallback.controller.js` → `useAuthCallback.js` → `AuthCallbackScreen.jsx`
```

### `authSession.read.dal.js`

**Direct callers:**

- `authCallback.controller.js` _Controller_
- `authSession.controller.js` _Controller_
- `onboarding.controller.js` _Controller_
- `profile.controller.js` _Controller_
- `setNewPassword.controller.js` _Controller_

**Full call chain to screen:**

```
`authSession.read.dal.js` → `authCallback.controller.js` → `useAuthCallback.js` → `AuthCallbackScreen.jsx`
```
```
`authSession.read.dal.js` → `authSession.controller.js` → `useLogin.js` → `LoginScreen.jsx`
```
```
`authSession.read.dal.js` → `onboarding.controller.js` → `auth.adapter.js` → `locksmithScreenComponents.jsx`
```
```
`authSession.read.dal.js` → `onboarding.controller.js` → `auth.adapter.js` → `InviteView.styles.js`
```

### `emailVerification.dal.js`

**Direct callers:**

- `resendVerification.controller.js` _Controller_

**Full call chain to screen:**

```
`emailVerification.dal.js` → `resendVerification.controller.js` → `useResendVerification.js` → `VerifyEmailRequiredScreen.jsx`
```

### `login.dal.js`

**Direct callers:**

- `login.controller.js` _Controller_

**Full call chain to screen:**

```
`login.dal.js` → `login.controller.js` → `useLogin.js` → `LoginScreen.jsx`
```
```
`login.dal.js` → `login.controller.js` → `useAuthOps.js` → `auth.adapter.js` → `locksmithScreenComponents.jsx`
```
```
`login.dal.js` → `login.controller.js` → `useAuthOps.js` → `auth.adapter.js` → `InviteView.styles.js`
```
```
`login.dal.js` → `login.controller.js` → `useAuthOps.js` → `auth.adapter.js` → `ConsentGateScreen.jsx`
```

### `onboarding.dal.js`

**Direct callers:**

- `authOps.controller.js` _Controller_
- `completeProfileGate.controller.js` _Controller_
- `onboarding.controller.js` _Controller_
- `profileOnboarding.controller.js` _Controller_

**Full call chain to screen:**

```
`onboarding.dal.js` → `completeProfileGate.controller.js` → `useCompleteProfileGate.js` → `CompleteProfileGate.jsx`
```
```
`onboarding.dal.js` → `onboarding.controller.js` → `auth.adapter.js` → `locksmithScreenComponents.jsx`
```
```
`onboarding.dal.js` → `onboarding.controller.js` → `auth.adapter.js` → `InviteView.styles.js`
```
```
`onboarding.dal.js` → `onboarding.controller.js` → `auth.adapter.js` → `ConsentGateScreen.jsx`
```

### `profile.dal.js`

**Direct callers:**

- `profile.controller.js` _Controller_

**Full call chain to screen:**

```
`profile.dal.js` → `profile.controller.js` → `useLogin.js` → `LoginScreen.jsx`
```

### `register.dal.js`

**Direct callers:**

- `register.controller.js` _Controller_

**Full call chain to screen:**

```
`register.dal.js` → `register.controller.js` → `useRegister.js` → `RegisterScreen.jsx`
```

### `resetPassword.dal.js`

**Direct callers:**

- `sendResetPassword.controller.js` _Controller_
- `setNewPassword.controller.js` _Controller_

**Full call chain to screen:**

```
`resetPassword.dal.js` → `sendResetPassword.controller.js` → `useResetPassword.js` → `ForgotPasswordScreen.jsx`
```
```
`resetPassword.dal.js` → `setNewPassword.controller.js` → `useSetNewPassword.js` → `ResetPasswordScreen.jsx`
```

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✓ PRESENT | `actor.model.js`, `emailVerification.model.js`, `onboarding.model.js`, `profile.model.js`, `registerPasswordRules.model.js` |
| **Controller** | ✓ PRESENT | `authCallback.controller.js`, `authOps.controller.js`, `authSession.controller.js`, `completeProfileGate.controller.js`, `createUserActor.controller.js`, `login.controller.js` +7 more |
| **Adapter** | ✓ PRESENT | `auth.adapter.js` |
| **Service** | ✗ MISSING | — |
| **Hook** | ✓ PRESENT | `useAuthCallback.js`, `useAuthOnboarding.js`, `useAuthOps.js`, `useCompleteProfileGate.js`, `useLogin.js`, `useRegister.js` +3 more |
| **Component** | ✓ PRESENT | `ConsentCheckbox.jsx`, `RegisterFormCard.jsx` |
| **View Screen** | ✗ MISSING | — |
| **Final Screen** | ✓ PRESENT | `AuthCallbackScreen.jsx`, `CompleteProfileGate.jsx`, `ForgotPasswordScreen.jsx`, `LoginScreen.jsx`, `Onboarding.jsx`, `RegisterScreen.jsx`, `ResetPasswordScreen.jsx`, `VerifyEmailRequiredScreen.jsx`, `WelcomeScreen.jsx` |

### Model

_Pure transforms — no side effects, no DB access_

- `features/auth/model/actor.model.js`
- `features/auth/model/emailVerification.model.js`
- `features/auth/model/onboarding.model.js`
- `features/auth/model/profile.model.js`
- `features/auth/model/registerPasswordRules.model.js`

### Controller

_Business rules, ownership, permissions — no React_

- `features/auth/controllers/authCallback.controller.js`
- `features/auth/controllers/authOps.controller.js`
- `features/auth/controllers/authSession.controller.js`
- `features/auth/controllers/completeProfileGate.controller.js`
- `features/auth/controllers/createUserActor.controller.js`
- `features/auth/controllers/login.controller.js`
- `features/auth/controllers/onboarding.controller.js`
- `features/auth/controllers/profile.controller.js`
- `features/auth/controllers/profileOnboarding.controller.js`
- `features/auth/controllers/register.controller.js`
- `features/auth/controllers/resendVerification.controller.js`
- `features/auth/controllers/sendResetPassword.controller.js`
- `features/auth/controllers/setNewPassword.controller.js`

### Adapter

_Cross-feature boundary — only approved cross-feature access point_

- `features/auth/adapters/auth.adapter.js`

**Current public exports:**
- `useAuthOps`
- `authTheme`
- `isEmailVerifiedModel`
- `CompleteProfileGate`
- `VerifyEmailRequiredScreen`
- `ConsentCheckbox`
- `bootstrapJoinOnboardingController`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/auth/hooks/useAuthCallback.js`
- `features/auth/hooks/useAuthOnboarding.js`
- `features/auth/hooks/useAuthOps.js`
- `features/auth/hooks/useCompleteProfileGate.js`
- `features/auth/hooks/useLogin.js`
- `features/auth/hooks/useRegister.js`
- `features/auth/hooks/useResendVerification.js`
- `features/auth/hooks/useResetPassword.js`
- `features/auth/hooks/useSetNewPassword.js`

### Component

_Presentational only — no hooks, no data fetching_

- `features/auth/components/ConsentCheckbox.jsx`
- `features/auth/components/RegisterFormCard.jsx`

### Final Screen

_Route entry + identity gate only — no computation_

- `features/auth/screens/AuthCallbackScreen.jsx`
- `features/auth/screens/CompleteProfileGate.jsx`
- `features/auth/screens/ForgotPasswordScreen.jsx`
- `features/auth/screens/LoginScreen.jsx`
- `features/auth/screens/Onboarding.jsx`
- `features/auth/screens/RegisterScreen.jsx`
- `features/auth/screens/ResetPasswordScreen.jsx`
- `features/auth/screens/VerifyEmailRequiredScreen.jsx`
- `features/auth/screens/WelcomeScreen.jsx`

### Missing Layers

- 🟡 **Service** — not detected in static scan
- 🟡 **View Screen** — not detected in static scan

---

## Dead Code Audit

_Audit Date:_ 2026-05-11  
_Auditor:_ ARCHITECT static scan + live import grep  
_Scope:_ All 11 DAL files · All 29 exported functions  
_Method:_ Every exported function name grepped against `apps/VCSM/src/` for active imports. Each modified controller (per git status) manually verified for continued DAL import retention.

### Function Status Table

| Function | DAL File | Imported By | Status |
|---|---|---|---|
| `dalCreateUserActor` | `actorCreate.dal.js` | `createUserActor.controller.js` | LIVE |
| `dalGetActorByProfile` | `actorGetByProfile.dal.js` | `createUserActor.controller.js` | LIVE |
| `dalCreateActorOwner` | `actorOwnerCreate.dal.js` | `createUserActor.controller.js` | LIVE |
| `dalExchangeCodeForSession` | `authCallback.dal.js` | `authCallback.controller.js` | LIVE |
| `dalGetAuthSession` | `authSession.read.dal.js` | `authCallback.controller.js`, `authSession.controller.js`, `onboarding.controller.js`, `profile.controller.js`, `setNewPassword.controller.js` | LIVE — HIGH FAN-OUT |
| `dalHydrateAuthSession` | `authSession.read.dal.js` | `authSession.controller.js` | LIVE |
| `dalResendVerificationEmail` | `emailVerification.dal.js` | `resendVerification.controller.js` | LIVE |
| `dalGetAuthUser` | `login.dal.js` | `login.controller.js` | LIVE |
| `dalSignInWithPassword` | `login.dal.js` | `login.controller.js` | LIVE |
| `dalSignOut` | `login.dal.js` | `login.controller.js` | LIVE |
| `generateUsernameDAL` | `onboarding.dal.js` | `onboarding.controller.js`, `bootstrapJoinOnboardingController` | LIVE |
| `readCurrentAuthUserDAL` | `onboarding.dal.js` | `authOps.controller.js`, `completeProfileGate.controller.js` | LIVE |
| `readProfileForOnboardingDAL` | `onboarding.dal.js` | `onboarding.controller.js` | LIVE |
| `readProfileShellDAL` | `onboarding.dal.js` | `profileOnboarding.controller.js` | LIVE |
| `upsertCompletedOnboardingProfileDAL` | `onboarding.dal.js` | `onboarding.controller.js`, `bootstrapJoinOnboardingController` | LIVE |
| `upsertProfileShellDAL` | `onboarding.dal.js` | `profileOnboarding.controller.js` | LIVE |
| `dalGetProfileDiscoverable` | `profile.dal.js` | `profile.controller.js` | LIVE |
| `dalUpdateProfileDiscoverable` | `profile.dal.js` | `profile.controller.js` | LIVE |
| `dalMirrorWandersSessionToPrimary` | `register.dal.js` | `register.controller.js` | LIVE |
| `dalReadRegisterSession` | `register.dal.js` | `register.controller.js` | LIVE |
| `dalSignOutRegisterSession` | `register.dal.js` | `register.controller.js` | LIVE |
| `dalSignUpRegisterUser` | `register.dal.js` | `register.controller.js` | LIVE |
| `dalUpdateRegisterUser` | `register.dal.js` | `register.controller.js` | LIVE |
| `dalUpsertRegisterProfile` | `register.dal.js` | `register.controller.js` | LIVE |
| `dalExchangeRecoveryCode` | `resetPassword.dal.js` | `setNewPassword.controller.js` | LIVE |
| `dalSendResetPasswordEmail` | `resetPassword.dal.js` | `sendResetPassword.controller.js` | LIVE |
| `dalSignOutRecoverySession` | `resetPassword.dal.js` | `setNewPassword.controller.js` | LIVE |
| `dalSubscribeToAuthStateChange` | `resetPassword.dal.js` | `setNewPassword.controller.js` | LIVE |
| `dalUpdateUserPassword` | `resetPassword.dal.js` | `setNewPassword.controller.js` | LIVE |

### Modified Controllers Chain Verification

7 controllers were modified on this branch (`vport-booking-feed-security-updates`). All retain their documented DAL import chains.

| Controller | DAL Import Chain | Verdict |
|---|---|---|
| `authCallback.controller.js` | `dalExchangeCodeForSession`, `dalGetAuthSession` | CHAIN INTACT |
| `authOps.controller.js` | `readCurrentAuthUserDAL` | CHAIN INTACT |
| `login.controller.js` | `dalGetAuthUser`, `dalSignInWithPassword`, `dalSignOut` | CHAIN INTACT |
| `onboarding.controller.js` | `dalGetAuthSession`, `generateUsernameDAL`, `readProfileForOnboardingDAL`, `upsertCompletedOnboardingProfileDAL` | CHAIN INTACT |
| `profile.controller.js` | `dalGetAuthSession`, `dalGetProfileDiscoverable`, `dalUpdateProfileDiscoverable` | CHAIN INTACT |
| `register.controller.js` | All 6 `register.dal.js` functions | CHAIN INTACT |
| `setNewPassword.controller.js` | `dalExchangeRecoveryCode`, `dalSignOutRecoverySession`, `dalSubscribeToAuthStateChange`, `dalUpdateUserPassword`, `dalGetAuthSession` | CHAIN INTACT |

### Audit Verdict

- **Dead functions:** 0
- **Orphaned DAL files:** 0
- **Files on disk not in doc:** 0
- **Files in doc not on disk:** 0
- **Broken chains from recent edits:** 0
- **Overall DAL health:** CLEAN

---

## Native Parity Notes

Native Relevance: YES  
Falcon Review: REQUIRED  
Related Native Module: `auth` — session management, login, registration, onboarding, and password reset flows are all user-facing and must be verified for native parity.  
Native Transfer Status: PENDING FALCON  
Known Native Gaps: Not yet assessed — Falcon review has not been initiated for this DAL layer.  
Winter Soldier Handoff: Not yet initiated.

---

## Command Evidence Registry

| Command | Report Path | Relevance | Status |
|---|---|---|---|
| ARCHITECT | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.auth.md` (this doc) | Initial DAL map + dead code audit source | PRESENT |
| VENOM | — | Auth trust boundary review | MISSING |
| SENTRY | — | Architecture boundary compliance | MISSING |
| FALCON | — | Native parity for auth flows | MISSING |
| LOKI | — | Runtime trace for session reads | MISSING |
| KRAVEN | — | Performance review for `dalGetAuthSession` fan-out | MISSING |
| CARNAGE | — | DB migration history for `profiles`, `actors`, `actor_owners` | MISSING |

---

## Change Log

### 2026-05-11

**Task:** Dead code audit of auth DAL layer — verify all 11 DAL files and 29 exported functions are live  
**Application Scope:** VCSM  
**Prompt:** User requested ARCHITECT dead code detection on `vcsm.dal.auth.md`, then Logan update with all findings  
**Code Status Before:** No dead code section existed in this doc. Risk Findings and Pending Reviews sections were empty placeholders.  
**Code Status After:** No code changes — audit only. Documentation updated.  
**Files Changed:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.auth.md` (this file)  
**Command Evidence:** ARCHITECT static scan + live import grep across `apps/VCSM/src/`  
**Architecture Contracts Checked:** PROJECT_BOUNDARY_ISOLATION_CONTRACT.md  
**Security / Runtime / DB Notes:** `dalGetAuthSession` flagged as high fan-out risk — 5 controllers depend on it. No security findings raised; VENOM review recommended as next step.  
**Validation:** All 29 functions confirmed live. All 7 recently modified controllers verified to retain DAL import chains post-modification.  
**Documentation Truth Status:** VERIFIED  
**Native Documentation Verification:** PENDING FALCON

> Missing layers may exist but use naming patterns not detected by static scan, or may be delegated to engines.

---

## Avengers Assembly Report — 2026-05-11

**Run Summary**

| Field | Value |
|---|---|
| Date | 2026-05-11 |
| Triggered by | User — targeted single-doc AvengersAssemble pass |
| Application Scope | VCSM |
| Branch | `vport-booking-feed-security-updates` |
| Document Scope | `vcsm.dal.auth.md` — auth DAL layer only |
| Passes Completed | ARCHITECT · VENOM · LOGAN · review-contract · Session-Summary Structure |
| Read-Only | YES — no source code modified |

---

### ARCHITECT

**Status: DRIFT FOUND**

**Finding 1 — Screen layer incomplete (MODERATE)**

Two screens exist in `features/auth/screens/` that are not listed in the Architecture Pipeline → Final Screen section:

- `Onboarding.jsx` — full onboarding form screen, uses `useAuthOnboarding` hook. Exported from `auth.adapter.js`.
- `CompleteProfileGate.jsx` — route guard screen that redirects unauthenticated/incomplete profiles to `/onboarding`. Exported from `auth.adapter.js`.

Both are exported from `auth.adapter.js` and are part of the auth feature's public output surface. Doc lists 7 Final Screens; actual count is 9.

**Finding 2 — Call chain terminal endpoints incorrect (HIGH)**

The call chains for `actorCreate.dal.js`, `actorGetByProfile.dal.js`, and `actorOwnerCreate.dal.js` show terminal endpoints as:

- `locksmithScreenComponents.jsx` (in `features/dashboard/vport/screens/components/`)
- `InviteView.styles.js` (in `features/invite/screens/`)
- `ConsentGateScreen.jsx` (in `features/legal/screens/`)
- `LegalDocumentScreen.jsx` (in `features/legal/screens/`)

These files DO import from `auth.adapter.js`, but they only import `ConsentCheckbox` or `authTheme` — neither of which leads to `actorCreate.dal.js`.

The actual consumer of the `actorCreate.dal.js → createUserActor.controller.js → onboarding.controller.js → bootstrapJoinOnboardingController → auth.adapter.js` chain is:

```
features/join/controllers/joinBarbershopAccount.controller.js → useJoinBarbershop.js → join screen
```

`bootstrapJoinOnboardingController` was ADDED to `auth.adapter.js` on this branch. The call chains were built by conflating all adapter consumers regardless of which specific export they use.

**Finding 3 — `Onboarding.jsx` mixing screen layers (MINOR)**

`Onboarding.jsx` contains `inputClass()` and `selectClass()` helper functions inline. These are presentational helpers that belong in a View Screen or component, not a Final Screen. Final Screens per contract should be route entry + identity gate only — no computation.

---

### VENOM

**Status: ALIGNED (with security improvements undocumented)**

No new unmitigated trust boundary violations found. Three security improvements were made on this branch and are reflected in code comments but not in this document's security sections:

**Security Improvement 1 — `authCallback.controller.js` error message sanitization**

`resolveAuthCallbackController` now returns a fixed error string in production when the URL contains an `error` param:

- DEV: shows `errorDescription` from URL for debugging
- PROD: returns static `'Verification failed. Please try again or request a new link.'`

Rationale: `error_description` is attacker-controllable via URL params. Prior version reflected it directly.

**Security Improvement 2 — hashType verification before recovery redirect**

Previously, when `hashType === 'recovery'` was detected in the URL hash, the controller returned `{ ok: true, isRecovery: true }` without verifying a session existed. An attacker could craft a URL with `#type=recovery` to trigger a recovery redirect without a valid session.

Now: `dalGetAuthSession()` is called and must return a valid session before `isRecovery: true` is returned.

**Security Improvement 3 — `register.dal.js` trust boundary cleanup**

Previously: `register.dal.js` imported `getWandersSupabase` directly from `features/wanders/adapters/services/wandersSupabaseClient.adapter` — a cross-feature import inside the DAL layer.

Now: Client resolution moved to controller layer. DAL accepts injectable `client` override. DAL no longer holds cross-feature adapter dependency.

All three improvements are ALIGNED with security contract principles. Recommend adding security notes to Risk Findings section.

---

### LOGAN

**Status: DRIFT FOUND**

**Logan Finding 1 — `onboarding.dal.js` per-function operations metadata misleading (LOW)**

The DAL file table shows all 6 functions with operations `read · upsert · rpc` and tables `profiles`, `generate_username`. These are file-level aggregations incorrectly shown per row. Per-function reality:

| Function | Actual Operation | Table |
|---|---|---|
| `readCurrentAuthUserDAL` | Auth API (`getUser`) | None — no table access |
| `readProfileForOnboardingDAL` | SELECT | `profiles` |
| `readProfileShellDAL` | SELECT | `profiles` |
| `upsertProfileShellDAL` | UPSERT | `profiles` |
| `generateUsernameDAL` | RPC | `generate_username` |
| `upsertCompletedOnboardingProfileDAL` | UPSERT | `profiles` |

**Logan Finding 2 — `register.dal.js` per-function operations and tables incorrect (MODERATE)**

Doc shows all 6 register functions as operation `upsert` accessing `profiles`. Only `dalUpsertRegisterProfile` touches the `profiles` table. The other 5 functions are Supabase Auth API operations:

| Function | Actual Operation | Table |
|---|---|---|
| `dalReadRegisterSession` | Auth API (`getSession`) | None |
| `dalUpdateRegisterUser` | Auth API (`updateUser`) | None |
| `dalSignUpRegisterUser` | Auth API (`signUp`) | None |
| `dalSignOutRegisterSession` | Auth API (`signOut`) | None |
| `dalUpsertRegisterProfile` | UPSERT | `profiles` |
| `dalMirrorWandersSessionToPrimary` | Auth API (`setSession` + `getSession`) | None |

**Logan Finding 3 — Tables Accessed section maps incorrect consumers (MODERATE)**

The Tables Accessed section shows all 6 register functions under `profiles | UPDATE, UPSERT`. This is inaccurate. Only `dalUpsertRegisterProfile` writes to `profiles`. The table should list only that function.

Additionally, the `profiles` operations column should separate READ from UPSERT for the register functions vs. the onboarding functions.

**Logan Finding 4 — `auth.adapter.js` new export surface not enumerated (LOW)**

`bootstrapJoinOnboardingController` was added to `auth.adapter.js` on this branch. The Architecture Pipeline → Adapter section notes `auth.adapter.js` as PRESENT but does not enumerate its exports. The adapter now exposes 7 exports. This should be listed for downstream consumers to audit.

**Logan Finding 5 — `register.dal.js` client injection refactor not described (LOW)**

Before this branch: DAL resolved client internally based on `isWandersFlow` boolean flag; imported `getWandersSupabase` from cross-feature adapter.

After this branch: DAL accepts injectable `client` override parameter; `isWandersFlow` flag removed from all signatures; controller layer handles client resolution.

This is an architectural trust boundary improvement. The doc does not describe the client injection pattern.

---

### review-contract

**Status: ALIGNED with one minor note**

| Check | Result |
|---|---|
| No `select('*')` violations | PASS — all selects use explicit column lists |
| No TypeScript files | PASS |
| No relative `../../` import chains | PASS — all use `@/` aliases |
| Layer order DAL → Controller respected | PASS |
| Cross-feature access through adapter only | PASS — `bootstrapJoinOnboardingController` exposed via `auth.adapter.js` not via direct import |
| DAL files single responsibility | PASS |

**Minor Note — `Onboarding.jsx` screen layer purity**

`Onboarding.jsx` contains `inputClass()` and `selectClass()` helper functions defined inline in the screen file. Per contract, Final Screens should be pure composition — no computation. These helpers constitute presentation logic and should be in a component or View Screen. Not release-blocking, but a contract drift item.

---

### Session-Summary Structure

**Status: ISSUE FOUND**

| Check | Result |
|---|---|
| `2026-05` month folder exists | MISSING — no `session-summaries/2026-05/` folder |
| `2026-04` has month summary | PRESENT — `2026-04_month_summary.md` exists |
| Stray `.md` files at root of session-summaries | NONE — clean |
| CLAUDE.md command inventory matches `.claude/commands/` | DRIFT — see below |

**Command Inventory Drift:**

`.claude/commands/` contains 23 files. The CLAUDE.md command table lists 17 commands. Commands present in `.claude/commands/` but absent from the CLAUDE.md table:

- `AvengersAssemble.md`
- `Cerebro.md`
- `SHIELD.md`
- `Sentry.md`
- `WinterSoldier.md`
- `listofcomand.v2.md`

---

### Governance Evidence Registry

| Command | Status | Drift | Blocking |
|---|---|---|---|
| ARCHITECT | PRESENT | DRIFT FOUND | NO — doc drift only |
| VENOM | PRESENT (inline pass) | ALIGNED | NO |
| LOGAN | PRESENT (inline pass) | DRIFT FOUND | NO — doc drift only |
| review-contract | PRESENT (inline pass) | MINOR NOTE | NO |
| IRONMAN | MISSING | N/A | NO |
| SENTRY | MISSING | N/A | NO |
| LOKI | MISSING | N/A | NO |
| KRAVEN | MISSING | N/A | NO |
| CARNAGE | MISSING | N/A | NO |
| FALCON | MISSING | N/A | NO |
| WINTER SOLDIER | MISSING | N/A | NO |
| SHIELD | MISSING | N/A | NO |

---

### Cross-System Contradictions

| System A | System B | Contradiction | Severity | Resolution |
|---|---|---|---|---|
| ARCHITECT (call chains) | LOGAN (operations metadata) | Call chains show adapter consumers that don't use the DAL-linked export; metadata shows file-level ops per-function row | MODERATE | Correct call chains to trace `bootstrapJoinOnboardingController` through join feature; separate per-function operations from file-level aggregations |
| ARCHITECT (screen count: 7) | Filesystem (screen count: 9) | Two screens undocumented | LOW | Add `Onboarding.jsx` and `CompleteProfileGate.jsx` to Final Screen list |

---

### Documentation Truth Review

| Doc Section | Truth Status | Drift | Blocking |
|---|---|---|---|
| DAL Files (count: 11) | ALIGNED | None | NO |
| Exported Functions (count: 29) | ALIGNED | None | NO |
| Tables Accessed | DRIFT | register functions incorrectly mapped to `profiles` | NO |
| RPCs Called | ALIGNED | None | NO |
| Risk Findings | MINOR DRIFT | Security improvements on branch not reflected | NO |
| Call Chains | DRIFT | Terminal endpoints incorrect for actor* dal chains | NO |
| Architecture Pipeline — Final Screen | DRIFT | Missing Onboarding.jsx, CompleteProfileGate.jsx | NO |
| Dead Code Audit | ALIGNED | All 29 functions confirmed live | NO |
| Native Parity Notes | ALIGNED | PENDING FALCON correctly noted | NO |
| Command Evidence Registry | ALIGNED | VENOM/SENTRY/FALCON/LOKI/KRAVEN/CARNAGE correctly MISSING | NO |

---

### Overall Status

**DRIFT FOUND — not release-blocking**

All drift is documentation-only. No source code violations. No security vulnerabilities. No broken DAL chains. No dead code.

Drift is confined to:
- Per-function operations metadata (register and onboarding DAL tables)
- Call chain terminal endpoints (conflated adapter consumers)
- Missing screen entries (2 screens undocumented)
- Security improvements not reflected in doc risk notes
- Client injection refactor not described

---

### Recommended Next Steps

| Priority | Action | Command |
|---|---|---|
| HIGH | Correct register.dal.js per-function operations and Tables Accessed section | LOGAN doc update |
| HIGH | Fix call chains for actorCreate/actorGetByProfile/actorOwnerCreate — trace through `bootstrapJoinOnboardingController` → join feature | LOGAN doc update |
| MEDIUM | Add Onboarding.jsx and CompleteProfileGate.jsx to Final Screen list | LOGAN doc update |
| MEDIUM | Add security improvement notes to Risk Findings for authCallback security hardening and register DAL trust boundary cleanup | VENOM + LOGAN |
| MEDIUM | Create `session-summaries/2026-05/` folder and begin month tracking | Session hygiene |
| LOW | Add auth.adapter.js export enumeration to Adapter section | LOGAN doc update |
| LOW | Add register.dal.js client injection pattern description | LOGAN doc update |
| LOW | Add AvengersAssemble, Cerebro, SHIELD, Sentry, WinterSoldier to CLAUDE.md command table | CAPTAIN / CLAUDE.md update |
| LOW | Review Onboarding.jsx screen layer purity (inputClass helpers) | Wolverine refactor |

---

## LOGAN DRIFT CORRECTION APPEND — 2026-05-11

**Task:** Correct AvengersAssemble drift for `vcsm.dal.auth.md`.
**Application Scope:** VCSM.
**Documentation Scope:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.auth.md`.
**Change Type:** Documentation-only.

### Scope Enforcement

| Rule | Result |
|---|---|
| Source code modification | None |
| Database/schema/RLS modification | None |
| Engine modification | None |
| Documentation boundary | Stayed inside Logan VCSM DAL documentation |
| Contracts read | PROJECT_BOUNDARY_ISOLATION_CONTRACT.md and ARCHITECTURE.md |

### Corrections Applied

| Section | Correction |
|---|---|
| `onboarding.dal.js` DAL file entry | Replaced file-level aggregate operations shown on every function with per-function truth metadata. |
| `register.dal.js` DAL file entry | Replaced incorrect `upsert`/`profiles` metadata on Auth API functions with the correct Auth API operations and no-table entries. |
| Tables Accessed | Removed Auth API-only register functions and Auth API-only onboarding function from `profiles`; added SELECT to the `profiles` operation set. |
| RPCs Called | Narrowed `generate_username` to `generateUsernameDAL` only. |

### Onboarding Metadata Truth Applied

| Function | Correct Operation | Correct Table / RPC |
|---|---|---|
| `readCurrentAuthUserDAL` | Auth API `getUser` | No table |
| `readProfileForOnboardingDAL` | SELECT | `profiles` |
| `readProfileShellDAL` | SELECT | `profiles` |
| `upsertProfileShellDAL` | UPSERT | `profiles` |
| `generateUsernameDAL` | RPC | `generate_username` |
| `upsertCompletedOnboardingProfileDAL` | UPSERT | `profiles` |

### Register Metadata Truth Applied

| Function | Correct Operation | Correct Table |
|---|---|---|
| `dalReadRegisterSession` | Auth API `getSession` | No table |
| `dalUpdateRegisterUser` | Auth API `updateUser` | No table |
| `dalSignUpRegisterUser` | Auth API `signUp` | No table |
| `dalSignOutRegisterSession` | Auth API `signOut` | No table |
| `dalUpsertRegisterProfile` | UPSERT | `profiles` |
| `dalMirrorWandersSessionToPrimary` | Auth API `setSession` + `getSession` | No table |

### Status After Correction

| AvengersAssemble Finding | Status |
|---|---|
| Logan Finding 1 — `onboarding.dal.js` per-function operations metadata misleading | Corrected |
| Logan Finding 2 — `register.dal.js` per-function operations and tables incorrect | Corrected |
| Logan Finding 3 — Tables Accessed section maps incorrect consumers | Corrected for onboarding/register metadata requested in this pass |

### Remaining Drift Not Corrected In This Pass

| Item | Reason |
|---|---|
| Call chain terminal endpoint drift | Not requested in this correction pass. |
| Missing screen entries | Not requested in this correction pass. |
| Auth adapter export enumeration | Not requested in this correction pass. |
| Register client injection pattern description | Not requested in this correction pass. |
| CLAUDE.md command inventory drift | Outside this document scope. |

---

## Codex Fix Pass — 2026-05-11

### Files Changed

| File | Change |
|---|---|
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.auth.md` | Corrected current-state call chains, screen inventory, adapter export inventory, security improvement notes, and register DAL client-injection documentation. |

### Findings Addressed

| Finding | Status | Notes |
|---|---|---|
| Logan Finding 1 — `onboarding.dal.js` per-function operations metadata misleading | DONE | Already corrected in this document before this pass; re-verified against current doc state. |
| Logan Finding 2 — `register.dal.js` per-function operations and tables incorrect | DONE | Already corrected in this document before this pass; re-verified against current `register.dal.js`. |
| Logan Finding 3 — Tables Accessed maps incorrect consumers | DONE | Already corrected in this document before this pass; `profiles` no longer lists Auth API-only register functions. |
| ARCHITECT Finding 1 — missing `Onboarding.jsx` and `CompleteProfileGate.jsx` in Final Screen inventory | DONE | Architecture pipeline and Final Screen list now include both screens. |
| ARCHITECT Finding 2 — actor DAL call chain terminal endpoints conflated through auth adapter consumers | DONE | Actor create/get/owner call chains now trace through `bootstrapJoinOnboardingController` to the join barbershop flow. |
| LOGAN Finding 4 — `auth.adapter.js` export surface not enumerated | DONE | Adapter section now lists the current seven public exports. |
| LOGAN Finding 5 — `register.dal.js` client injection refactor not described | DONE | Risk/trust-boundary notes now document DAL client injection and controller-owned Wanders client resolution. |
| VENOM security improvements undocumented | DONE | Risk section now records production error sanitization, recovery session verification, and register DAL trust-boundary cleanup. |
| Minor note — `Onboarding.jsx` screen layer purity | BLOCKED | Live code still contains inline presentation helper functions. Refactor is outside DAL documentation scope and should be handled as a SENTRY/Wolverine UI-layer cleanup. |
| Session summary folder / CLAUDE command inventory drift | BLOCKED | Outside this target DAL documentation folder. |

### Verification

- Commands/searches run:
  - `find apps/VCSM/src/features/auth -maxdepth 3 -type f | sort`
  - `grep -rn "bootstrapJoinOnboardingController\\|Onboarding\\|CompleteProfileGate\\|inputClass\\|selectClass" apps/VCSM/src/features/auth apps/VCSM/src/features/join --include='*.js' --include='*.jsx'`
  - `grep -rn "getWandersSupabase\\|isWandersFlow\\|client.*=.*supabase\\|setSession\\|getSession\\|error_description\\|hashType.*recovery" apps/VCSM/src/features/auth apps/VCSM/src/features/wanders --include='*.js' --include='*.jsx'`
  - Inspected `apps/VCSM/src/features/auth/adapters/auth.adapter.js`
  - Inspected `apps/VCSM/src/features/auth/dal/register.dal.js`
  - Inspected `apps/VCSM/src/features/auth/controllers/register.controller.js`
  - Inspected `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js`
  - Inspected `apps/VCSM/src/features/join/hooks/useJoinBarbershop.js`
- Production callers checked:
  - `apps/VCSM/src/features/join/screens/JoinBarbershopScreen.jsx`
  - `apps/VCSM/src/features/join/hooks/useJoinBarbershop.js`
  - `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js`
  - `apps/VCSM/src/features/auth/adapters/auth.adapter.js`
  - `apps/VCSM/src/features/auth/controllers/register.controller.js`
- Remaining risks:
  - `dalGetAuthSession` remains high fan-out and should be traced before any session-shape refactor.
  - Native parity remains PENDING FALCON.
  - `Onboarding.jsx` screen-layer presentation helpers remain a minor architecture cleanup item.
  - Session summary / CLAUDE command inventory drift remains outside this doc scope.

### Status

PARTIAL

---

---

## PHASE 1 — VENOM FORMAL SECURITY AUDIT — 2026-05-11

**Trigger:** Cerebro phased verification run — formal VENOM standalone report. Prior inline AvengersAssemble pass recorded three security improvements; this report is the formal trust boundary audit.
**Application Scope:** VCSM
**Scope:** Auth DAL layer — 11 DAL files, 29 functions. Session management, registration, onboarding, password reset, and auth callback flows.
**Output Path:** `CURRENT/features/dashboard/evidence/venom_auth_dal_2026-05-11.md` _(pending creation)_

---

### Security Improvements on This Branch — Verified

**VENOM-SEC-01 — `authCallback.controller.js` production error message sanitization**
- Location: `apps/VCSM/src/features/auth/controllers/authCallback.controller.js:35–37`
- Before: `error_description` from URL params reflected directly to caller
- After: DEV returns `errorDescription`; PROD returns fixed string `'Verification failed. Please try again or request a new link.'`
- Trust boundary: `error_description` is attacker-controllable via URL query params and hash. Sanitization prevents reflected error injection (OWASP A03).
- Live verification: confirmed at lines 35–37. ✅

**VENOM-SEC-02 — `authCallback.controller.js` recovery session verification**
- Location: `apps/VCSM/src/features/auth/controllers/authCallback.controller.js:43–54`
- Before: `hashType === 'recovery'` check returned `{ ok: true, isRecovery: true }` without verifying a real session existed
- After: `dalGetAuthSession()` called at line 44; `isRecovery: true` returned only if session is present
- Trust boundary: `hashType` is attacker-controllable via URL hash. Prior version allowed arbitrary `#type=recovery` to trigger a recovery redirect without a valid session.
- Live verification: confirmed at lines 43–54. ✅

**VENOM-SEC-03 — `register.dal.js` trust boundary cleanup — injectable client**
- Location: `apps/VCSM/src/features/auth/dal/register.dal.js:3–5`
- Before: DAL imported `getWandersSupabase` directly from `features/wanders/adapters/` — cross-feature import at DAL layer
- After: `resolveClient(override)` pattern — DAL accepts optional `client` parameter. Client selection now lives in `register.controller.js`.
- Trust boundary: DAL no longer holds cross-feature adapter dependency. Controller layer owns Wanders client selection.
- Live verification: confirmed `resolveClient(override)` at line 3; `supabase` default; no Wanders import in DAL. ✅
- Note: `dalMirrorWandersSessionToPrimary` still uses `supabase` directly (not `resolveClient`) — this is intentional: the mirror operation always targets the primary client.

---

### Trust Boundary Map

| Surface | Trust Concern | Status |
|---|---|---|
| `authCallback` — `error_description` from URL | Attacker-controllable — sanitized in prod | ALIGNED (VENOM-SEC-01 closed) |
| `authCallback` — `hashType` recovery check | Attacker-controllable — session verified | ALIGNED (VENOM-SEC-02 closed) |
| `register.dal.js` — cross-feature client | Wanders client now injected at controller | ALIGNED (VENOM-SEC-03 closed) |
| `dalGetAuthSession` — 5+1 consumers | High fan-out read — shape change affects all 5 chains | WATCH ITEM |
| `profiles` table writes | Explicit column lists on all SELECTs; explicit payload on UPSERTs | ALIGNED |
| `actor_owners` upsert | `dalCreateActorOwner` — upserts ownership record | ALIGNED |
| `resetPassword.dal.js` — recovery code exchange | `dalExchangeRecoveryCode` handles Supabase token exchange | ALIGNED |
| `window.location` in `parseCallbackParams()` | Web-only API — read-only URL parsing, no mutation | WEB ONLY (see FALCON) |

---

### No New Trust Violations Found

| Check | Result |
|---|---|
| `select('*')` in auth DAL files | NONE — all selects use explicit column lists: `'id,username,birthdate'`, `'id,display_name,username,birthdate,age,sex'`, `'id, discoverable'`, `'id, kind, profile_id, is_void'` |
| TypeScript files | NONE |
| Raw UUID in public-facing URLs | NONE from auth DAL layer |
| Cross-feature DAL imports | NONE after VENOM-SEC-03 fix |

---

### VENOM Security Watch Item

**VENOM-W-01 — `dalGetAuthSession` is the single highest-risk read in the auth DAL (no new finding)**
- Location: `apps/VCSM/src/features/auth/dal/authSession.read.dal.js:7`
- Confirmed consumers: `authCallback.controller.js` (2 call sites), `onboarding.controller.js` (3 call sites), `profile.controller.js` (1 call site), `setNewPassword.controller.js` (1 call site), `authSession.controller.js` (via `dalHydrateAuthSession`)
- Risk: Any change to session shape, naming, or auth structure simultaneously affects 5 controllers and 7+ call sites. Not a security vulnerability — a structural fragility that amplifies the blast radius of any session refactor.
- Action: No change required. Flag for Loki and Kraven review. Document in CARNAGE as migration risk.

---

### VENOM FORMAL STATUS: ALIGNED

All three security improvements on this branch verified in source. No new trust violations detected. One watch item (dalGetAuthSession fan-out) documented for downstream command evidence.

---

---

## PHASE 2 — SENTRY ARCHITECTURE COMPLIANCE REPORT — 2026-05-11

**Trigger:** Cerebro phased verification run — architecture boundary compliance check.
**Application Scope:** VCSM
**Scope:** Auth feature files — DAL, Model, Controller, Hook, Component, Screen layers.
**Architecture Contract:** `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md`
**Output Path:** `CURRENT/features/dashboard/evidence/sentry_auth_dal_2026-05-11.md` _(pending creation)_

---

### Boundary Compliance Status

| Protected Root | In Scope | Modified | Violation |
|---|---|---|---|
| `apps/VCSM` | YES | NO (audit only) | NO |
| `apps/wentrex` | NO | NO | NO |
| `apps/Traffic` | NO | NO | NO |
| `engines/` | NO (read) | NO | NO |

---

### DAL Layer Compliance

| Check | Result |
|---|---|
| `select('*')` violations | NONE — all SELECTs use explicit column lists |
| Cross-feature DAL imports | NONE after VENOM-SEC-03 fix |
| Side effects in DAL files | NONE — all 11 DAL files do raw Supabase access only |
| Single responsibility | PASS — each DAL file owns one concern |

---

### Import Path Compliance

**SENTRY-F-01 — Relative import paths in `profile.controller.js`**
- Location: `apps/VCSM/src/features/auth/controllers/profile.controller.js:4–6`
- Violation: 3 relative `../` imports (`../dal/profile.dal`, `../dal/authSession.read.dal`, `../model/profile.model`)
- Contract: "All new cross-folder imports must use `@/...` path aliases — never relative `../../` chains."
- Severity: LOW (functionally correct; `../` within same feature folder — not cross-feature, but still violates the alias rule)
- Fix: Replace with `@/features/auth/dal/profile.dal`, `@/features/auth/dal/authSession.read.dal`, `@/features/auth/model/profile.model`

**SENTRY-F-02 — Relative import paths in `createUserActor.controller.js`**
- Location: `apps/VCSM/src/features/auth/controllers/createUserActor.controller.js:1–4`
- Violation: 4 relative `../` imports (`../dal/actorCreate.dal`, `../dal/actorOwnerCreate.dal`, `../dal/actorGetByProfile.dal`, `../model/actor.model`)
- Contract: Same alias rule as above.
- Severity: LOW
- Fix: Replace all with `@/features/auth/dal/...` and `@/features/auth/model/...`

---

### Screen Layer Compliance

**SENTRY-F-03 — `Onboarding.jsx` Final Screen contains inline presentation helpers**
- Location: `apps/VCSM/src/features/auth/screens/Onboarding.jsx:12–24`
- Violation: `inputClass(disabled)` and `selectClass(disabled)` defined inline in a Final Screen file
- Contract: "Final Screen — Route entry + identity gate only. What it must NOT do: No computation."
- Severity: LOW — previously flagged in AvengersAssemble and Codex Fix Pass as BLOCKED (outside DAL documentation scope). Now formally logged.
- Current behavior: `inputClass` returns a complex CSS class string. `selectClass` extends it. These are presentation helpers — they belong in a component or View Screen.
- Fix: Extract helpers to a `RegisterFormCard` component or a shared `authInputClasses.js` util. Or promote them into `features/auth/styles/` as CSS class constants.

---

### Layer Boundary Compliance

| Layer | Files Checked | Violations |
|---|---|---|
| DAL | 11 files | NONE — raw Supabase only, no business logic |
| Model | 5 files | NONE — pure transforms confirmed |
| Controller | 13 files | SENTRY-F-01 + SENTRY-F-02 (relative imports in 2 files) |
| Adapter | 1 file | NONE — `auth.adapter.js` correct boundary |
| Hook | 9 files | Not audited this pass |
| Component | 2 files | Not audited this pass |
| Final Screen | 9 files | SENTRY-F-03 (inline helpers in `Onboarding.jsx`) |

---

### SENTRY FINDINGS SUMMARY

| Finding | Severity | Status | Fix |
|---|---|---|---|
| SENTRY-F-01 — relative imports in `profile.controller.js` | LOW | OPEN | Replace with `@/` aliases |
| SENTRY-F-02 — relative imports in `createUserActor.controller.js` | LOW | OPEN | Replace with `@/` aliases |
| SENTRY-F-03 — inline helpers in `Onboarding.jsx` Final Screen | LOW | OPEN | Extract to component or util |

---

### SENTRY ARCHITECTURE STATUS: MINOR DRIFT

Three low-severity findings. No high or medium violations. The auth DAL layer is architecturally sound. Findings are import-convention drift and one screen-layer purity issue — both pre-existing and low effort to fix.

---

---

## PHASE 3 — FALCON NATIVE PARITY REPORT — 2026-05-11

**Trigger:** Cerebro phased verification run — auth DAL doc explicitly marks native review REQUIRED.
**Application Scope:** VCSM
**Scope:** All 9 user-facing auth flows — login, register, onboarding, password reset, session management, email verification, auth callback, profile discovery, and actor creation.
**Output Path:** `_ACTIVE/native/falcon_auth_dal_2026-05-11.md` _(pending creation)_

---

### Native Relevance Map

| Flow | DAL File | Native Relevance | Risk |
|---|---|---|---|
| Login / Sign-in | `login.dal.js` | HIGH — core native flow | LOW — standard Auth API |
| Registration | `register.dal.js` | HIGH — core native flow | MEDIUM — injectable client pattern must be honored in native |
| Onboarding | `onboarding.dal.js` | HIGH — first-run native flow | LOW — standard profile operations |
| Password reset | `resetPassword.dal.js` | HIGH — user-facing | HIGH — recovery callback relies on `window.location` (see FALCON-N-01) |
| Auth callback | `authCallback.dal.js` / `authCallback.controller.js` | HIGH — handles OAuth + email links | HIGH — `parseCallbackParams` uses `window.location` (see FALCON-N-01) |
| Session reads | `authSession.read.dal.js` | HIGH — used by 5 controllers | LOW — `supabase.auth.getSession()` works natively |
| Email verification | `emailVerification.dal.js` | MEDIUM — fallback flow | LOW — Auth API call |
| Profile discovery | `profile.dal.js` | MEDIUM — post-register | LOW — table read/update |
| Actor creation | `actorCreate.dal.js`, `actorOwnerCreate.dal.js` | HIGH — identity bootstrap | LOW — RPC + upsert |

---

### Native Contract Gaps

**FALCON-N-01 — `parseCallbackParams()` uses `window.location` — WEB ONLY**
- Location: `apps/VCSM/src/features/auth/controllers/authCallback.controller.js:4–13`
- Native gap: `window.location.search` and `window.location.hash` are browser-only APIs. On native (React Native / Capacitor), auth callbacks arrive via deep link, not browser URL params.
- Impact: `resolveAuthCallbackController()` cannot be called as-is on native. The PKCE code exchange path (`code` param) and the hash-based recovery path (`hashType`) both depend on `window.location`.
- Required before native transfer: The controller needs a platform-agnostic param resolver that can accept the callback URL from the native deep link handler rather than reading `window.location` directly. Pattern: pass `callbackUrl` as a parameter; controller parses it instead of reading `window.location`.
- Priority: HIGH — auth callback is the first post-authentication step after email verification and OAuth sign-in. Without a native-compatible controller, the entire email-link and OAuth flow cannot land on native.

**FALCON-N-02 — `dalSubscribeToAuthStateChange` — event listener pattern**
- Location: `apps/VCSM/src/features/auth/dal/resetPassword.dal.js` (`dalSubscribeToAuthStateChange`)
- Native gap: `supabase.auth.onAuthStateChange` returns a subscription that must be unsubscribed on component unmount. On native, lifecycle management differs from browser event listeners.
- Impact: LOW — the subscription pattern works natively via Supabase JS SDK. Risk is that the native component lifecycle must properly unsubscribe via the returned `data.subscription.unsubscribe()`.
- Required before native transfer: Verify that `useSetNewPassword.js` hook correctly unsubscribes in its cleanup. If it does, this is transfer-ready.

**FALCON-N-03 — `dalMirrorWandersSessionToPrimary` — cross-client session mirror**
- Location: `apps/VCSM/src/features/auth/dal/register.dal.js:53–65`
- Native gap: This function mirrors a Wanders client session to the primary Supabase client. On native, the Wanders client initialization and the session token shape may differ.
- Impact: LOW — the Wanders flow may not exist in native MVP. Flag for WinterSoldier if Wanders registration is in scope for native.

---

### Native Transfer Readiness

| Flow | Status | Blocker |
|---|---|---|
| Login / Sign-in | TRANSFER READY | None — standard Auth API |
| Registration (non-Wanders) | TRANSFER READY | None |
| Registration (Wanders flow) | CONDITIONAL | FALCON-N-03 — cross-client session mirror |
| Onboarding | TRANSFER READY | None |
| Session reads | TRANSFER READY | `supabase.auth.getSession()` works natively |
| Email verification (resend) | TRANSFER READY | None |
| Profile discovery | TRANSFER READY | None |
| Actor creation | TRANSFER READY | None |
| Auth callback (email link + OAuth) | NOT TRANSFER READY | FALCON-N-01 — `window.location` dependency |
| Password reset (full flow) | CONDITIONAL | FALCON-N-01 — recovery hash callback via `window.location` |
| Auth state subscription | CONDITIONAL | FALCON-N-02 — verify cleanup in hook |

---

### FALCON NATIVE STATUS: CONDITIONAL

Core auth flows (login, register, onboarding, session reads) are transfer-ready. The auth callback controller (`authCallback.controller.js`) is the primary blocker — its `parseCallbackParams()` function is hardwired to `window.location`. A platform-agnostic URL resolver must be introduced before the callback flow can be transferred to native.

**WinterSoldier handoff:** NOT REQUIRED now. Revisit Wanders session mirror (FALCON-N-03) when native Wanders integration is in scope.

---

---

## PHASE 4 — LOKI RUNTIME TRACE — 2026-05-11

**Trigger:** Cerebro phased verification run — no prior runtime trace for auth DAL layer.
**Application Scope:** VCSM
**Scope:** All 11 auth DAL files traced from screen to DB. Focus on `dalGetAuthSession` fan-out.
**Output Path:** `CURRENT/features/dashboard/evidence/loki_auth_dal_2026-05-11.md` _(pending creation)_

---

### Runtime Call Chain Map

**Chain 1 — Login Flow**
```
LoginScreen.jsx
  → useLogin.js
    → login.controller.js
      → dalSignInWithPassword({ email, password }) → supabase.auth.signInWithPassword
      → dalGetAuthUser()                            → supabase.auth.getUser
      → dalSignOut()                                → supabase.auth.signOut
    → authSession.controller.js → dalHydrateAuthSession() → supabase.auth.getSession
```
Status: ALIGNED.

**Chain 2 — Registration Flow**
```
RegisterScreen.jsx
  → useRegister.js
    → register.controller.js (injectable client from Wanders or primary)
      → dalSignUpRegisterUser({ email, password }) → c.auth.signUp
      → dalUpsertRegisterProfile(...)              → c.from('profiles').upsert
      → dalReadRegisterSession()                   → c.auth.getSession
      → dalMirrorWandersSessionToPrimary(...)      → supabase.auth.setSession + getSession
```
Status: ALIGNED.

**Chain 3 — Onboarding Flow**
```
Onboarding.jsx
  → useAuthOnboarding.js
    → onboarding.controller.js
      → dalGetAuthSession()                              → supabase.auth.getSession ← [CALL 1]
      → readProfileForOnboardingDAL(userId)             → profiles SELECT
      → generateUsernameDAL(seed)                       → generate_username RPC
      → upsertCompletedOnboardingProfileDAL(...)        → profiles UPSERT
      → createUserActorForProfile() → actorCreate DAL  → create_actor_for_user RPC
```
`dalGetAuthSession` called at lines 41, 65, 149 — **3 call sites within one controller**. ⚠️
Status: ALIGNED — but within `onboarding.controller.js`, `dalGetAuthSession()` is called up to 3 times depending on code path. If all three execute sequentially, that is 3 auth session reads for a single onboarding action.

**Chain 4 — Auth Callback Flow**
```
AuthCallbackScreen.jsx
  → useAuthCallback.js
    → resolveAuthCallbackController()
      → parseCallbackParams() → window.location.search + window.location.hash (WEB ONLY)
      → dalGetAuthSession()   → supabase.auth.getSession (if hashType=recovery or fallback)
      → dalExchangeCodeForSession(code) → supabase.auth.exchangeCodeForSession (if PKCE)
```
Status: PARTIAL — `window.location` dependency is a native gap (FALCON-N-01). `dalGetAuthSession` called at 2 sites within this controller.

**Chain 5 — Password Reset Flow**
```
ForgotPasswordScreen.jsx
  → useResetPassword.js → sendResetPassword.controller.js
    → dalSendResetPasswordEmail({ email }) → supabase.auth.resetPasswordForEmail

ResetPasswordScreen.jsx
  → useSetNewPassword.js → setNewPassword.controller.js
    → dalSubscribeToAuthStateChange() → supabase.auth.onAuthStateChange
    → dalGetAuthSession()             → supabase.auth.getSession
    → dalExchangeRecoveryCode(...)    → supabase.auth.exchangeCodeForSession
    → dalUpdateUserPassword(...)      → supabase.auth.updateUser
    → dalSignOutRecoverySession()     → supabase.auth.signOut
```
Status: ALIGNED.

**Chain 6 — Profile Discovery Flow**
```
LoginScreen.jsx (post-login)
  → useLogin.js → profile.controller.js
    → dalGetAuthSession()              → supabase.auth.getSession
    → dalGetProfileDiscoverable(...)   → profiles SELECT('id, discoverable')
    → dalUpdateProfileDiscoverable(..) → profiles UPDATE (if needed)
```
Status: ALIGNED — note relative imports in `profile.controller.js` (SENTRY-F-01).

---

### `dalGetAuthSession` Fan-Out Detail

| Consumer Controller | Call Sites | Trigger Context |
|---|---|---|
| `authCallback.controller.js` | 2 | Recovery hash check + fallback session read |
| `onboarding.controller.js` | 3 | Bootstrap, completeOnboarding, and intermediate checks |
| `profile.controller.js` | 1 | Post-login profile discovery |
| `setNewPassword.controller.js` | 1 | Recovery session verification |
| `authSession.controller.js` | via `dalHydrateAuthSession` | Session hydration (returns full promise, not just session) |

**Total call sites across codebase: 7 direct + 1 indirect = 8 `authSession.read.dal.js` usages.**

The Supabase JS client caches the active session in memory after first exchange — `getSession()` is effectively a memory read in most cases. This mitigates the fan-out performance concern. The structural risk remains: if the session object shape changes, all 5 controllers require simultaneous updates.

---

### Runtime Risk Summary

| Risk | Location | Severity | Notes |
|---|---|---|---|
| `onboarding.controller.js` — 3 `dalGetAuthSession` calls | lines 41, 65, 149 | LOW | Supabase caches session; likely no extra network calls. Structural redundancy. |
| `parseCallbackParams()` — `window.location` | `authCallback.controller.js:4–13` | HIGH (native) | Web-only API — FALCON-N-01 blocker |
| `profile.controller.js` relative imports | lines 4–6 | LOW | SENTRY-F-01 — convention violation only |

---

### LOKI RUNTIME STATUS: ALIGNED (with native and minor drift noted)

Auth DAL runtime chains are clean and correctly layered. No N+1 patterns, no side effects in DAL files, no engine calls at wrong layers. Primary runtime concern is the `window.location` dependency in the auth callback controller — native gap documented by FALCON. The `dalGetAuthSession` fan-out is a structural concern, not a performance concern, because Supabase caches the session.

---

---

## PHASE 5 — KRAVEN PERFORMANCE AUDIT — 2026-05-11

**Trigger:** Cerebro phased verification run — no performance envelope documented for auth DAL.
**Application Scope:** VCSM
**Scope:** Auth DAL layer DB call budget, session read overhead, fan-out analysis.
**Output Path:** `_ACTIVE/audits/performance/kraven_auth_dal_2026-05-11.md` _(pending creation)_

---

### Auth Flow DB Call Budget

| Flow | DB Calls (typical path) | Notes |
|---|---|---|
| Login | 2 | `signInWithPassword` + `getUser` |
| Register (non-Wanders) | 2 | `signUp` + `profiles.upsert` |
| Register (Wanders) | 4 | Wanders `signUp` + `profiles.upsert` + `setSession` + `getSession` |
| Onboarding | 4–5 | `getSession` (×3) + `profiles.select` + `generate_username` RPC + `profiles.upsert` + `create_actor_for_user` RPC |
| Auth Callback | 1–2 | PKCE: `exchangeCodeForSession`. Hash-recovery: `getSession`. Both: `getSession`. |
| Password Reset (send) | 1 | `resetPasswordForEmail` |
| Password Reset (set new) | 4 | `onAuthStateChange` + `getSession` + `exchangeCodeForSession` + `updateUser` |
| Profile Discovery | 2–3 | `getSession` + `profiles.select` + optionally `profiles.update` |

---

### Performance Findings

**KRAVEN-P-01 — `onboarding.controller.js` calls `dalGetAuthSession()` 3 times**
- Location: `onboarding.controller.js` lines 41, 65, 149
- Severity: LOW (Supabase client caches session — repeat calls are memory reads after first exchange)
- Impact: No extra network round-trips expected. Minor CPU overhead from repeated function calls.
- Recommendation: Consider extracting session into a shared variable passed down through the controller rather than calling `dalGetAuthSession()` at each entry point. Not a blocking concern.

**KRAVEN-P-02 — No caching layer for `profiles` reads during onboarding**
- Location: `readProfileForOnboardingDAL`, `readProfileShellDAL`
- Severity: LOW — onboarding is a one-time flow; profile reads happen once per step
- No caching needed: these reads are event-driven (not polling) and occur on a low-frequency user action path.

**KRAVEN-P-03 — Auth flows are low-frequency by design — no performance concerns**
- All auth operations are user-initiated, one-time or rare events (login, register, onboarding, password reset)
- No auth DAL function is called in a loop, on scroll, or on keystroke
- Supabase Auth API handles its own session caching internally

---

### KRAVEN PERFORMANCE STATUS: LOW RISK

Auth DAL is not a performance concern. All flows are low-frequency, user-initiated events. The only mild observation is `dalGetAuthSession` being called 3 times within `onboarding.controller.js` — not an issue in practice due to Supabase client-side session caching, but could be cleaned up as a code quality improvement.

---

---

## PHASE 6 — CARNAGE MIGRATION AUDIT — 2026-05-11

**Trigger:** Cerebro phased verification run — no DB migration history documented for auth DAL tables.
**Application Scope:** VCSM
**Scope:** Tables and RPCs touched by the auth DAL layer on current branch.
**Output Path:** `_ACTIVE/audits/migrations/carnage_auth_dal_2026-05-11.md` _(pending creation)_

---

### Tables and RPCs Accessed by Auth Feature

| Object | Schema | Operation | DAL Function(s) | Notes |
|---|---|---|---|---|
| `profiles` | `vc` | SELECT | `readProfileForOnboardingDAL`, `readProfileShellDAL`, `dalGetProfileDiscoverable` | Explicit column lists on all SELECTs |
| `profiles` | `vc` | UPSERT | `upsertProfileShellDAL`, `upsertCompletedOnboardingProfileDAL`, `dalUpsertRegisterProfile` | Explicit payload on all UPSERTs |
| `profiles` | `vc` | UPDATE | `dalUpdateProfileDiscoverable` | Targeted update, not full-row |
| `actors` | `vc` | READ | `dalGetActorByProfile` | `select('id, kind, profile_id, is_void')` — explicit columns |
| `actor_owners` | `vc` | UPSERT | `dalCreateActorOwner` | Auth feature owns this write |
| `create_actor_for_user` | RPC | EXECUTE | `dalCreateUserActor` | Auth feature is the canonical caller |
| `generate_username` | RPC | EXECUTE | `generateUsernameDAL` | Called during onboarding |
| Supabase Auth API | `auth.*` | Various | 18 Auth API functions across 7 DAL files | Not Postgres tables — Supabase auth schema |

---

### Migration Risk Assessment

**CARNAGE-M-01 — `profiles` table is the highest-migration-risk table in this DAL**
- 7 DAL functions read or write to `profiles`
- SELECT column lists: `id,username,birthdate` / `id,display_name,username,birthdate,age,sex` / `id, discoverable`
- Any rename of `username`, `birthdate`, `display_name`, `age`, `sex`, or `discoverable` columns requires updating 3–5 DAL files simultaneously
- The `upsertCompletedOnboardingProfileDAL` payload shape is the most complex — it writes multiple columns in one call

**CARNAGE-M-02 — `create_actor_for_user` RPC — auth-owned creation path**
- This RPC creates the actor record when a new user completes onboarding
- It is called by `dalCreateUserActor` → `createUserActor.controller.js` → `onboarding.controller.js`
- Any signature change to this RPC breaks the onboarding completion chain
- Auth feature is the canonical and only caller — migration is self-contained

**CARNAGE-M-03 — `generate_username` RPC — onboarding utility**
- Called by `generateUsernameDAL` during username suggestion step
- Relatively isolated — signature change only affects 1 DAL function and 1 controller

**CARNAGE-M-04 — No pending migrations on current branch**
- Branch `vport-booking-feed-security-updates` contains security hardening code changes only
- No Supabase migration files for `profiles`, `actors`, or `actor_owners` tables detected on this branch
- `register.dal.js` injectable client refactor is code-only — no schema change

---

### Migration Readiness

| Object | Status | Risk |
|---|---|---|
| `profiles` table | No pending migration | MEDIUM fragility — 7 DAL functions; column rename requires coordinated update |
| `actors` table (read) | No pending migration | LOW — read-only by auth feature |
| `actor_owners` table | No pending migration | LOW — upsert only; simple payload |
| `create_actor_for_user` RPC | No pending migration | LOW — auth feature is sole caller |
| `generate_username` RPC | No pending migration | LOW — isolated utility |
| Supabase Auth API | No pending migration | LOW — SDK-managed; Supabase handles schema |

---

### CARNAGE MIGRATION STATUS: LOW RISK

No active or pending migrations on this branch. The `profiles` table has moderate fragility (7 DAL functions across multiple operations). Auth feature is the write-owner of `actor_owners` and both RPCs — any migration to those objects is self-contained within the auth DAL.

---

---

## AVENGERS ASSEMBLY — PHASE CLOSE — 2026-05-11

**Run Summary**

| Field | Value |
|---|---|
| Date | 2026-05-11 |
| Triggered by | Cerebro phased verification — 6 commands confirmed MISSING |
| Application Scope | VCSM |
| Branch | `vport-booking-feed-security-updates` |
| Document Scope | `vcsm.dal.auth.md` — auth DAL full governance pass |
| Prior passes | ARCHITECT · VENOM (inline) · LOGAN · review-contract (all inline via AvengersAssemble) |
| This pass | VENOM (formal) · SENTRY · FALCON · LOKI · KRAVEN · CARNAGE |
| Read-Only | YES — no source code modified |

---

### Final Governance Evidence Registry

| Command | Status | Key Findings | Blocking |
|---|---|---|---|
| ARCHITECT | PRESENT (prior) | Screen drift corrected; call chains fixed | NO |
| VENOM | PRESENT (formal) | VENOM-SEC-01/02/03 verified closed · VENOM-W-01 (session fan-out watch) | NO |
| LOGAN | PRESENT (prior) | Metadata drift corrected; adapter exports enumerated; client injection documented | NO |
| review-contract | PRESENT (prior) | `Onboarding.jsx` screen purity minor note | NO |
| SENTRY | PRESENT | SENTRY-F-01/02 (relative imports) · SENTRY-F-03 (Onboarding.jsx helpers) | NO |
| FALCON | PRESENT | Auth callback NOT transfer-ready (FALCON-N-01) · core flows ready | YES (native) |
| LOKI | PRESENT | 8 `dalGetAuthSession` call sites confirmed · `window.location` chain confirmed | NO |
| KRAVEN | PRESENT | Low risk · `onboarding.controller.js` 3 redundant session reads | NO |
| CARNAGE | PRESENT | No pending migrations · `profiles` fragility documented | NO |
| IRONMAN | N/A | Auth feature has clear ownership — no ownership ambiguity |  NO |
| WINTER SOLDIER | N/A | Wanders native flow deferred (FALCON-N-03) | NO |
| SHIELD | N/A | No IP/provenance concerns | NO |

---

### Open Risk Summary (Final State)

| Item | Severity | Status | Release Blocking |
|---|---|---|---|
| SENTRY-F-01 — relative imports in `profile.controller.js` | LOW | OPEN | NO |
| SENTRY-F-02 — relative imports in `createUserActor.controller.js` | LOW | OPEN | NO |
| SENTRY-F-03 — `Onboarding.jsx` inline helpers | LOW | OPEN | NO |
| FALCON-N-01 — `window.location` in auth callback controller | HIGH | OPEN | YES (native only) |
| FALCON-N-02 — `dalSubscribeToAuthStateChange` cleanup | LOW | CONDITIONAL | NO |
| FALCON-N-03 — Wanders session mirror on native | LOW | DEFERRED | NO |
| VENOM-W-01 — `dalGetAuthSession` session fan-out | LOW (watch) | MONITOR | NO |
| `Onboarding.jsx` View Screen / Final Screen missing layers | LOW | PRE-EXISTING | NO |

---

### Release Blockers

**No web release blockers.** All auth DAL chains are architecturally sound. Security improvements on this branch are verified closed.

**Native release blockers:**
| Blocker | Location | Fix |
|---|---|---|
| FALCON-N-01 | `authCallback.controller.js:4–13` | Extract `parseCallbackParams` to accept platform-agnostic URL param; controller reads from param instead of `window.location` |

---

### Wolverine Execution Queue (Auth — Priority Order)

| # | Action | Priority |
|---|---|---|
| 1 | Replace relative imports in `profile.controller.js` with `@/` aliases | LOW — quick fix |
| 2 | Replace relative imports in `createUserActor.controller.js` with `@/` aliases | LOW — quick fix |
| 3 | Extract `inputClass` / `selectClass` from `Onboarding.jsx` to component or util | LOW |
| 4 | Refactor `parseCallbackParams()` to accept URL string param (not `window.location`) | HIGH — native prerequisite |

---

### Documentation Truth Status

| Section | Status |
|---|---|
| DAL Files (count: 11) | ALIGNED |
| Exported Functions (count: 29) | ALIGNED |
| Call Chains | ALIGNED (corrected in Codex Fix Pass) |
| Architecture Pipeline | ALIGNED (corrected in AvengersAssemble) |
| Risk Findings | ALIGNED |
| VENOM formal report | NOW PRESENT |
| SENTRY report | NOW PRESENT |
| FALCON report | NOW PRESENT |
| LOKI report | NOW PRESENT |
| KRAVEN report | NOW PRESENT |
| CARNAGE report | NOW PRESENT |
| Command Evidence Registry | STALE — update with this append |

---

### Overall Status: ALIGNED — no web release blockers

All governance passes complete. Auth DAL is clean, security improvements verified, chains correctly documented. One native transfer blocker (FALCON-N-01: `window.location` in auth callback controller). Three low-severity architecture convention fixes (SENTRY-F-01/02/03) available for a quick Wolverine cleanup pass.

---

### Change Log — 2026-05-11 (Cerebro Phase Close)

Task: Cerebro-directed phased verification — VENOM formal, SENTRY, FALCON, LOKI, KRAVEN, CARNAGE.
Application Scope: VCSM
Prompt: User — "run it in phase it / output append on current file vcsm.dal.auth.md"
Code Status Before: ARCHITECT + VENOM (inline) + LOGAN + review-contract done. SENTRY/FALCON/LOKI/KRAVEN/CARNAGE all MISSING.
Code Status After: All 6 missing phases now present. Full governance evidence registry complete. No web release blockers. One native blocker (FALCON-N-01).
Files Changed: `vcsm.dal.auth.md` — phases VENOM formal, SENTRY, FALCON, LOKI, KRAVEN, CARNAGE + AvengersAssemble close appended.
Command Evidence: All phases derived from live source inspection — `features/auth/controllers/`, `features/auth/dal/`, `features/auth/screens/`, `features/auth/adapters/`.
Architecture Contracts Checked: PROJECT_BOUNDARY_ISOLATION_CONTRACT.md — enforced. ARCHITECTURE.md — consulted.
Security / Runtime / DB Notes: No schema changes. No production code modified. VENOM-SEC-01/02/03 confirmed closed in source. SENTRY-F-01/02 (relative imports) confirmed live at `profile.controller.js:4–6` and `createUserActor.controller.js:1–4`.
Validation: All source files verified via live read.
Documentation Truth Status: FULL — all governance passes present. No pending Wolverine actions block documentation accuracy.

---

---

## WOLVERINE FIX QUEUE — 2026-05-11

**Source:** Cerebro phase close — confirmed fixes from SENTRY + FALCON passes.
**Scope:** Code changes only — no schema, no engine, no cross-feature modifications.
**Status:** PENDING EXECUTION

| # | Finding | File | Line(s) | Fix |
|---|---|---|---|---|
| 1 | SENTRY-F-01 | `features/auth/controllers/profile.controller.js` | 4–6 | Replace 3 relative `../` imports with `@/features/auth/...` aliases |
| 2 | SENTRY-F-02 | `features/auth/controllers/createUserActor.controller.js` | 1–4 | Replace 4 relative `../` imports with `@/features/auth/...` aliases |
| 3 | SENTRY-F-03 | `features/auth/screens/Onboarding.jsx` | 12–24 | Extract `inputClass` / `selectClass` helpers out of Final Screen into a util or component |
| 4 | FALCON-N-01 | `features/auth/controllers/authCallback.controller.js` | 4–13 | Replace `window.location.search` / `window.location.hash` reads with a platform-agnostic URL param — native transfer prerequisite |

**Priority:** Items 1–2 are zero-risk quick fixes. Item 3 is low-effort refactor. Item 4 is the native transfer prerequisite — requires care to preserve existing web behavior.

---

## WOLVERINE FIX EXECUTION — 2026-05-11

**Status:** COMPLETE
**Build:** PASS — `vite build --mode development` ✓ 5.30s
**SENTRY post-execution:** ALIGNED — all 5 files pass contract checks

| # | Finding | Status | Notes |
|---|---|---|---|
| 1 | SENTRY-F-01 | CLOSED | `profile.controller.js` — all 3 imports now `@/features/auth/...` |
| 2 | SENTRY-F-02 | CLOSED | `createUserActor.controller.js` — all 4 imports now `@/features/auth/...` |
| 3 | SENTRY-F-03 | CLOSED | Helpers extracted to `features/auth/styles/authInputClasses.js`; `Onboarding.jsx` is now pure composition |
| 4 | FALCON-N-01 | CLOSED | `parseCallbackParams(url?)` accepts optional URL string; `window` guard + `window.location.href` fallback for web; native callers pass deep-link URL directly; `resolveAuthCallbackController(callbackUrl?)` signature updated |

**New file created:** `apps/VCSM/src/features/auth/styles/authInputClasses.js`

**Auth DAL status after fixes:** No open release blockers (web or native).

---
