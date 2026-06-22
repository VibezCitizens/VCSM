---
name: VCSM Auth + Login Landing Module Architecture
scope: apps/VCSM
generatedAt: 2026-05-11
source: ARCHITECT
command: /ARCHITECT login landing screen — map everything that is there
---

# MODULE ARCHITECTURE REPORT

Module: Auth + Login Landing
Application Scope: apps/VCSM
Module Type: feature module
Primary Root: apps/VCSM/src/features/auth/
Independence Status: MOSTLY INDEPENDENT
Completeness Status: MOSTLY COMPLETE

---

## PURPOSE

The auth module owns the full identity entry surface of the platform:

- Email+password login
- Email+password registration (with email verification)
- Forgot password / password reset
- Email verification callback (PKCE and implicit hash flows)
- Session hydration and change listening (AuthProvider)
- Post-registration welcome screen with intent routing
- Profile gate (CompleteProfileGate) — detects incomplete profiles and forces onboarding
- iOS PWA install prompt on login screen

The login screen is the cold-start entry point for all unauthenticated users. It is wrapped in AuthPublicRoute (which only hides the splash screen and does no auth guard).

---

## OWNERSHIP

Feature folder: apps/VCSM/src/features/auth/
Route wrapper: apps/VCSM/src/app/routes/public/auth.routes.jsx
Provider: apps/VCSM/src/app/providers/AuthProvider.jsx
Public adapter surface: apps/VCSM/src/features/auth/adapters/auth.adapter.js

---

## ENTRY POINTS

| Route | Guard | Screen | Alias |
|---|---|---|---|
| /login | AuthPublicRoute | LoginScreen | — |
| /register | AuthPublicRoute | RegisterScreen | — |
| /forgot-password | AuthPublicRoute | ForgotPasswordScreen | — |
| /reset | AuthPublicRoute | ForgotPasswordScreen | backward-compat alias |
| /reset-password | AuthPublicRoute | ResetPasswordScreen | — |
| /auth/callback | AuthPublicRoute | AuthCallbackScreen | Supabase redirect target |
| /verify-email | AuthPublicRoute | VerifyEmailRequiredScreen | — |
| /welcome | none (post-auth) | WelcomeScreen | intent query param |

AuthPublicRoute does NOT redirect authenticated users away — it only calls hideLaunchSplash() on mount. There is no redirect-if-authed guard on public routes.

---

## LAYER MAP

### DAL

| File | Methods | Tables / Services |
|---|---|---|
| dal/login.dal.js | dalSignInWithPassword, dalGetAuthUser, dalSignOut | supabase.auth |
| dal/authSession.read.dal.js | dalHydrateAuthSession | supabase.auth.getSession |
| dal/authCallback.dal.js | dalGetCurrentSession, dalExchangeCodeForSession | supabase.auth |
| dal/profile.dal.js | dalGetProfileDiscoverable, dalUpdateProfileDiscoverable | profiles |
| dal/onboarding.dal.js | readCurrentAuthUserDAL, readProfileShellDAL, upsertProfileShellDAL, upsertCompletedOnboardingProfileDAL, generateUsernameDAL | profiles, generate_username (RPC) |
| dal/register.dal.js | dalSignUpRegisterUser, dalUpsertRegisterProfile, dalUpdateRegisterUser, dalReadRegisterSession, dalSignOutRegisterSession, dalMirrorWandersSessionToPrimary | supabase.auth, profiles |
| dal/actorCreate.dal.js | dalCreateUserActor | vc.create_actor_for_user (RPC) |
| dal/actorGetByProfile.dal.js | dalGetActorByProfile | vc.actors |
| dal/actorOwnerCreate.dal.js | dalCreateActorOwner | vc.actor_owners |
| dal/emailVerification.dal.js | (email resend) | supabase.auth |

### Model

| File | Exports | Purpose |
|---|---|---|
| model/profile.model.js | ProfileModel | Row → {id, isDiscoverable} |
| model/actor.model.js | ActorModel | Row → {id, kind, profileId, isVoid} |
| model/onboarding.model.js | isProfileShellIncompleteModel, mapProfileOnboardingRowToFormModel, normalizeOnboardingFormModel, computeAgeFromBirthdateModel | Onboarding completeness checks + form normalization |
| model/registerPasswordRules.model.js | evaluateRegisterPasswordRules, evaluateConfirmPasswordState | Password validation rules |
| model/emailVerification.model.js | isEmailVerifiedModel | Email confirmed check |

### Controller

| File | Exports | Calls |
|---|---|---|
| controllers/login.controller.js | signInWithPassword, getAuthUser, signOut | login.dal |
| controllers/authSession.controller.js | hydrateAuthSession | authSession.read.dal |
| controllers/profile.controller.js | ensureProfileDiscoverable | profile.dal, profile.model |
| controllers/register.controller.js | ctrlRegisterAccount | register.dal (wanders-aware) |
| controllers/authCallback.controller.js | resolveAuthCallbackController | authCallback.dal |
| controllers/completeProfileGate.controller.js | evaluateCompleteProfileGateController | onboarding.dal, profileOnboarding.controller |
| controllers/profileOnboarding.controller.js | ensureProfileShell | onboarding.dal, onboarding.model |
| controllers/createUserActor.controller.js | createUserActorForProfile | actorCreate.dal, actorGetByProfile.dal, actorOwnerCreate.dal, actor.model |
| controllers/onboarding.controller.js | (onboarding form submit) | onboarding.dal, onboarding.model |
| controllers/resendVerification.controller.js | (resend email) | emailVerification.dal |
| controllers/sendResetPassword.controller.js | (send reset email) | resetPassword.dal |
| controllers/setNewPassword.controller.js | (set new password) | resetPassword.dal |
| controllers/authOps.controller.js | (auth operations) | login.dal |

### Hook

| File | Exports | Calls |
|---|---|---|
| hooks/useLogin.js | useLogin | signInWithPassword, hydrateAuthSession, ensureProfileDiscoverable (controllers) |
| hooks/useRegister.js | useRegister | ctrlRegisterAccount, useSignupConsent (legal), evaluateRegisterPasswordRules, evaluateConfirmPasswordState (models) |
| hooks/useAuthCallback.js | useAuthCallback | resolveAuthCallbackController |
| hooks/useCompleteProfileGate.js | useCompleteProfileGate | evaluateCompleteProfileGateController |
| hooks/useResendVerification.js | useResendVerification | resendVerification.controller |
| hooks/useResetPassword.js | useResetPassword | sendResetPassword.controller |
| hooks/useSetNewPassword.js | useSetNewPassword | setNewPassword.controller |
| hooks/useAuthOps.js | useAuthOps | authOps.controller |

### Component

| File | Used By |
|---|---|
| components/RegisterFormCard.jsx | RegisterScreen |
| components/ConsentCheckbox.jsx | RegisterFormCard |
| app/platform/ios/components/IosInstallPrompt.jsx | LoginScreen (iOS Safari only) |
| app/platform/ios/components/IosInstallSteps.jsx | IosInstallPrompt |

### Screen

| File | Route | Hook |
|---|---|---|
| screens/LoginScreen.jsx | /login | useLogin |
| screens/RegisterScreen.jsx | /register | useRegister |
| screens/ForgotPasswordScreen.jsx | /forgot-password, /reset | useResetPassword |
| screens/ResetPasswordScreen.jsx | /reset-password | useSetNewPassword |
| screens/AuthCallbackScreen.jsx | /auth/callback | useAuthCallback |
| screens/VerifyEmailRequiredScreen.jsx | /verify-email | useResendVerification |
| screens/WelcomeScreen.jsx | /welcome | none (pure nav links) |
| screens/CompleteProfileGate.jsx | wrapper (any protected route) | useCompleteProfileGate |

### Provider / Route Wrapper

| File | Wraps |
|---|---|
| app/providers/AuthProvider.jsx | Entire app — supabase.auth.onAuthStateChange listener |
| app/routes/public/AuthPublicRoute.jsx | All /auth/* public routes — only hides splash screen |

---

## KEY FLOWS

### Flow 1 — Login
```
LoginScreen
  → useLogin (form state, handleLogin)
    → signInWithPassword (login.controller)
      → dalSignInWithPassword (login.dal)
        → supabase.auth.signInWithPassword
    → hydrateAuthSession (authSession.controller)
      → dalHydrateAuthSession (authSession.read.dal)
        → supabase.auth.getSession
    → ensureProfileDiscoverable (profile.controller)
      → dalGetProfileDiscoverable (profile.dal)
        → profiles [id, discoverable]
      → dalUpdateProfileDiscoverable (profile.dal) — if not discoverable
        → profiles [discoverable=true]
  → navigate → /feed (or location.state.from)
```

### Flow 2 — Register
```
RegisterScreen
  → useRegister (form state, validation, intent/inviteCode from URL)
    → ctrlRegisterAccount (register.controller)
      → dalReadRegisterSession — check for anonymous session (Wanders flow)
      → dalSignUpRegisterUser (register.dal)
        → supabase.auth.signUp
      → dalUpsertRegisterProfile (register.dal)
        → profiles [id, email]
    → if requiresEmailConfirm → navigate /verify-email
    → else → recordSignupConsent (legal.adapter)
    → navigate /onboarding
```

### Flow 3 — Email Verification Callback
```
/auth/callback
  → AuthCallbackScreen
    → useAuthCallback
      → resolveAuthCallbackController (authCallback.controller)
        → parseCallbackParams (URL search + hash)
        → dalExchangeCodeForSession (PKCE flow) → supabase.auth.exchangeCodeForSession
        → dalGetCurrentSession (implicit hash flow) → supabase.auth.getSession
      → if isRecovery → navigate /reset-password
      → else → navigate /explore
```

### Flow 4 — Password Reset
```
ForgotPasswordScreen
  → useResetPassword → sendResetPassword.controller → supabase.auth.resetPasswordForEmail

Supabase email link → /auth/callback
  → resolveAuthCallbackController detects hashType=recovery
  → navigate /reset-password

AuthProvider onAuthStateChange:
  → PASSWORD_RECOVERY event → navigate /reset-password (safety net)

ResetPasswordScreen
  → useSetNewPassword → setNewPassword.controller → supabase.auth.updateUser
```

### Flow 5 — Profile Gate (post-auth protected routes)
```
CompleteProfileGate (wraps protected routes)
  → useCompleteProfileGate
    → evaluateCompleteProfileGateController
      → readCurrentAuthUserDAL → supabase.auth.getUser
      → ensureProfileShell (profileOnboarding.controller)
        → readProfileShellDAL → profiles [id, display_name, username, birthdate, age, sex]
        → if no row → upsertProfileShellDAL → profiles
        → isProfileShellIncompleteModel → returns needsOnboarding
  → if needsOnboarding → navigate /onboarding
```

### Flow 6 — Session Hydration (AuthProvider, app root)
```
AuthProvider (mounts once, app root)
  → supabase.auth.getSession() → initial hydration
  → supabase.auth.onAuthStateChange() → listens for:
      PASSWORD_RECOVERY → navigate /reset-password
      TOKEN_REFRESHED → skip re-render if userId unchanged
      SIGNED_OUT → clear state
  → Exposes: { user, session, loading, logout }

logout():
  → optimistic: setUser(null), setSession(null)
  → clearAllIdentityStorage()
  → clears localStorage: actor_kind, actor_vport_id, actor_touch
  → clears sessionStorage: debug.identity.*, debug.switch.*
  → dispatches CustomEvent 'actor:changed'
  → navigate /login
  → supabase.auth.signOut({ scope: 'local' })
  → supabase channel cleanup
```

### Flow 7 — Post-Auth Welcome Screen
```
/welcome?intent=profile|vport
  → WelcomeScreen
    → reads ?intent= from URL
    → renders option cards: Complete Profile / Create VPORT / Explore
    → intent-matched card floats to top with "Recommended" badge
    → link to /settings?tab=profile | /settings | /explore
```

---

## DATABASE READ MAP

| DAL Method | Table / Service | Columns | Operation |
|---|---|---|---|
| dalSignInWithPassword | supabase.auth | — | signInWithPassword |
| dalHydrateAuthSession | supabase.auth | — | getSession |
| dalGetCurrentSession | supabase.auth | — | getSession |
| dalExchangeCodeForSession | supabase.auth | — | exchangeCodeForSession |
| dalGetProfileDiscoverable | profiles | id, discoverable | SELECT .maybeSingle() |
| dalUpdateProfileDiscoverable | profiles | discoverable, updated_at | UPDATE |
| readCurrentAuthUserDAL | supabase.auth | — | getUser |
| readProfileShellDAL | profiles | id, display_name, username, birthdate, age, sex | SELECT .maybeSingle() |
| upsertProfileShellDAL | profiles | id, email, created_at, updated_at | UPSERT |
| dalGetActorByProfile | vc.actors | id, kind, profile_id, is_void | SELECT .maybeSingle() |
| dalCreateUserActor | vc schema | — | RPC create_actor_for_user |
| dalCreateActorOwner | vc.actor_owners | actor_id, user_id | UPSERT (ignoreDuplicates) |
| dalSignUpRegisterUser | supabase.auth | — | signUp |
| dalUpsertRegisterProfile | profiles | id, email, created_at, updated_at | UPSERT |
| generateUsernameDAL | public | — | RPC generate_username |

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Clear auth entry point with full CRUD on session | — |
| Owner defined | PASS | features/auth/ fully owned | — |
| Entry points mapped | PASS | 7 routes in auth.routes.jsx | — |
| Controllers present | PASS | 12 controllers | — |
| DAL present | PASS | 10 DAL files, explicit column selects | — |
| Models present | PASS | 5 model files | — |
| Hooks present | PASS | 8 hooks | — |
| Screens present | PASS | 8 screens | — |
| Services/adapters present | PARTIAL | auth.adapter.js thin (3 re-exports only) | adapter does not mediate cross-feature writes |
| Database objects mapped | PASS | profiles, vc.actors, vc.actor_owners, 2 RPCs | — |
| Authorization path mapped | PARTIAL | AuthPublicRoute has no redirect-if-authed | authenticated users can hit /login without redirect |
| Cache/runtime behavior mapped | PARTIAL | AuthProvider caches session via React state | no TTL cache; relies entirely on supabase client cache |
| Error/loading/empty states mapped | PASS | All screens have error + loading states | — |
| Documentation linked | FAIL | No Logan doc for auth module | needs vcsm.auth.system.md |
| Tests/validation noted | FAIL | No tests present | — |
| Native parity noted | PARTIAL | IosInstallPrompt present; no Android/PWA install | iOS only |
| Engine dependencies mapped | PASS | No engine dependency — auth is self-contained | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| supabase.auth | service | auth → supabase | YES — via DAL | core auth service |
| profiles table | database | auth → DB | YES — via DAL | user profile row |
| vc.actors | database | auth → DB | YES — via DAL | actor creation |
| vc.actor_owners | database | auth → DB | YES — via DAL | ownership record |
| legal feature | feature | register hook → legal.adapter | PARTIAL — via adapter | consent recording |
| wanders feature | feature | register.dal → wanders supabase client | WARNING — DAL imports cross-feature service | register.dal imports getWandersSupabase directly |
| season module | module | LoginScreen → /season | YES | decorative only |
| i18n engine | engine | LoginScreen, ForgotPasswordScreen → @i18n | YES | translation hook |
| ios platform | platform | LoginScreen → ios/components | YES — platform folder | IosInstallPrompt |
| debuggers | dev tool | useLogin → @debuggers/identity | YES — dev-only debug | debug events |
| hideLaunchSplash | shared lib | AuthPublicRoute → shared/lib | YES | splash hide |
| identityStorage | state lib | AuthProvider.logout → state/identity | YES — internal | session clear on logout |

---

## MODULE BOUNDARY WARNINGS

MODULE BOUNDARY WARNING
Location: apps/VCSM/src/features/auth/dal/register.dal.js
Module: auth
Current dependency: imports `getWandersSupabase` from `@/features/wanders/adapters/services/wandersSupabaseClient.adapter`
Expected boundary: DAL files must not import from other feature internals
Risk: HIGH — register.dal is tightly coupled to Wanders Supabase client. If Wanders changes its client path or auth model, register.dal breaks silently.
Suggested correction: Inject the Supabase client as a parameter to register.dal methods. Controller or adapter should resolve which client to pass.

---

MODULE BOUNDARY WARNING
Location: apps/VCSM/src/features/auth/controllers/profile.controller.js
Module: auth
Current dependency: `ensureProfileDiscoverable(profileId)` receives `data.user.id` (auth userId) as `profileId`
Expected boundary: actor-based identity — never use profileId in public surfaces
Risk: MEDIUM — parameter named profileId but receives userId. Works because profile.id === auth.user.id by convention, but the naming confusion could cause drift when the pattern is copied. Caller passes `data.user.id` directly.
Suggested correction: Rename parameter to `userId` in controller signature to match what callers actually pass.

---

MODULE BOUNDARY WARNING
Location: apps/VCSM/src/app/routes/public/AuthPublicRoute.jsx
Module: auth routing
Current dependency: AuthPublicRoute does not redirect authenticated users
Expected boundary: public auth routes should redirect logged-in users to /feed
Risk: LOW — authenticated users can navigate to /login. Currently AuthProvider holds state but public routes don't consume it to redirect. Non-breaking but creates odd UX.
Suggested correction: AuthPublicRoute should check auth context and redirect if session exists.

---

## DUPLICATE READ WARNINGS

DUPLICATE READ: supabase.auth.getSession
- dalHydrateAuthSession (called in useLogin after signIn)
- AuthProvider mount (called on app init)
- dalGetCurrentSession (called in authCallback flow)
- dalReadRegisterSession (called in register flow)

Four different DAL methods wrap the same supabase.auth.getSession call. This is intentional (each serves a different lifecycle moment) but creates maintenance risk — if session retrieval changes, all four must change. Consider a single canonical `getSessionDAL` that all four delegate to.

---

## UI VIOLATION

WelcomeScreen.jsx:124 uses `<ArrowRight size={16} ...>` from lucide-react.
Per platform rule: no arrow symbols in UI copy, buttons, or links.
VENOM and IRONMAN should review: the icon is rendered inside navigation link cards on the post-signup welcome screen.

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| profiles.discoverable | read/write | auth | login flow (post-signIn) | LOW — only sets discoverable=true |
| profiles.id, email | write | auth | register flow | LOW |
| profiles.display_name, username, birthdate, age, sex | read | auth | profile gate | LOW |
| vc.actors | read/write | auth | createUserActor controller | MEDIUM — actor creation is critical path |
| vc.actor_owners | write | auth | createUserActor controller | MEDIUM — ownership must be idempotent |
| supabase.auth session | read/write | auth | all flows | HIGH — central dependency |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | 7 routes registered | — |
| Loading state | PASS | All screens have loading indicators | — |
| Empty state | PASS | All screens have empty field handling | — |
| Error state | PASS | Login, register, forgot-password, reset all have error UI | — |
| Auth gate | PARTIAL | AuthPublicRoute does not redirect authed users | authenticated user UX gap |
| Cache behavior | PARTIAL | AuthProvider holds session in React state — no TTL | session can go stale without refresh trigger |
| Hot path | IDENTIFIED | Login → signIn → hydrateSession → ensureProfileDiscoverable → navigate is the critical login chain | — |
| iOS install | CONDITIONAL | IosInstallPrompt shown only on iOS Safari non-standalone | correct gating |
| Season theming | ACTIVE | getActiveSeasonTheme runs on LoginScreen mount | decorative only, safe |
| Wanders flow | CONDITIONAL | register.dal checks isWandersFlow to route to secondary supabase client | MEDIUM — dual client complexity |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | logan/vcsm/auth/ | MISSING |
| Ownership record | — | MISSING |
| Security audit | vcsm-security-report.md | PARTIAL |
| Runtime audit | — | MISSING |
| Performance audit | vcsm-performance-report.md | PARTIAL |
| Migration audit | — | MISSING |
| Native transfer audit | — | MISSING (iOS install prompt exists but no native auth spec) |
| Engine audit | N/A — auth is self-contained | N/A |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| AuthPublicRoute redirect-if-authed | HIGH | Authenticated users can navigate to /login without redirect | SENTRY |
| Logan doc for auth module | HIGH | No canonical doc — system operates undocumented | LOGAN |
| register.dal Wanders client injection | HIGH | Cross-feature DAL import is a boundary violation | SENTRY |
| Canonical getSessionDAL | MEDIUM | 4 separate wrappers around same supabase.auth.getSession | WOLVERINE |
| ensureProfileDiscoverable param rename | MEDIUM | profileId param receives userId — naming drift risk | WOLVERINE |
| WelcomeScreen ArrowRight icon removal | MEDIUM | Platform rule: no arrow symbols in UI | WOLVERINE |
| Auth module tests | MEDIUM | No test coverage on login/register flows | — |
| Native auth parity spec | LOW | iOS install exists but no native transfer plan | FALCON |
| Session TTL strategy | LOW | Auth state cached only in React state, no TTL | KRAVEN |

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Fix AuthPublicRoute redirect-if-authed | Authenticated users bypass login redirect | SENTRY |
| P1 | Fix register.dal Wanders cross-feature import | DAL boundary violation | SENTRY |
| P1 | Add Logan auth module doc | No canonical documentation | LOGAN |
| P2 | Consolidate getSession DAL calls | Maintenance risk from 4 wrapper DALs | WOLVERINE |
| P2 | Rename ensureProfileDiscoverable param | Naming inconsistency in critical login path | WOLVERINE |
| P2 | Remove WelcomeScreen ArrowRight icon | Platform UI rule violation | WOLVERINE |
| P3 | Auth module tests | Missing test coverage | — |
| P3 | Session TTL strategy | Long-lived React state could go stale | KRAVEN |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

RECOMMENDED HANDOFFS:
- SENTRY — AuthPublicRoute missing redirect gate + register.dal cross-feature import
- LOGAN — missing canonical auth module documentation
- WOLVERINE — consolidate getSession DALs, rename param, remove ArrowRight
- VENOM — review auth session trust boundaries and Wanders dual-client
- KRAVEN — session cache lifetime and cold-start performance of login chain
- FALCON — iOS native auth parity planning
