# VCSM Auth and Identity Pipeline

Last updated: April 25, 2026

## 1. Architecture Overview

VCSM auth and identity is a layered but mixed system:

- Authentication is owned by Supabase Auth and surfaced through `apps/VCSM/src/app/providers/AuthProvider.jsx`.
- App identity is owned by `apps/VCSM/src/state/identity/identityContext.jsx`.
- Platform account resolution is delegated to the shared identity engine through `@identity`.
- Actor hydration is delegated to the shared hydration engine through `@hydration`, but the actual VCSM actor hydrator stays inside the app at `apps/VCSM/src/features/hydration/vcsmActorHydrator.js`.
- Domain-specific actor data still comes from `vc.*` and `public.profiles`, not from the shared engines.

Current runtime shape:

```text
Supabase auth.users/session
  -> AuthProvider
  -> IdentityProvider
  -> resolveAuthenticatedContext(appKey='vcsm')
  -> hydrateActor(appKey='vcsm', actorSource='vc')
  -> hydrateVcsmActor()
  -> useIdentity()
```

The public `useIdentity()` contract remains:

```js
{
  identity,
  loading,
  identityLoading,
  setIdentity,
  switchActor
}
```

## 2. Entry Screens and User Flows

Primary entry points:

- Login: `apps/VCSM/src/features/auth/screens/LoginScreen.jsx`
- Register: `apps/VCSM/src/features/auth/screens/RegisterScreen.jsx`
- Forgot password (send reset link): `apps/VCSM/src/features/auth/screens/ForgotPasswordScreen.jsx`
- Reset password (set new password after recovery link): `apps/VCSM/src/features/auth/screens/ResetPasswordScreen.jsx`
- Auth callback (handles Supabase email verification redirects): `apps/VCSM/src/features/auth/screens/AuthCallbackScreen.jsx`
- Verify email required (post-register navigation target + blocking gate for unverified users): `apps/VCSM/src/features/auth/screens/VerifyEmailRequiredScreen.jsx`
- Onboarding: `apps/VCSM/src/features/auth/screens/Onboarding.jsx`
- Public auth routes: `apps/VCSM/src/app/routes/public/auth.routes.jsx`
- Global auth provider: `apps/VCSM/src/app/providers/AuthProvider.jsx`
- Global identity provider: `apps/VCSM/src/state/identity/identityContext.jsx`
- App boot: `apps/VCSM/src/main.jsx`

`CompleteProfileGate` is now wired via `ProfileGatedOutlet` (`apps/VCSM/src/app/guards/ProfileGatedOutlet.jsx`), which wraps all protected app routes except `/onboarding`. It checks `display_name`, `username`, `birthdate`, `age`, and `sex` — any missing field redirects to `/onboarding`.

### Login screen public footer

`LoginScreen.jsx` renders a `<nav>` below the login card with four public trust/legal links:

| Label | Route |
|---|---|
| About | `/about` |
| Contact | `/contact` |
| Privacy | `/legal/privacy-policy` |
| Terms | `/legal/terms-of-service` |

**Styling:** `text-[#c4b5fd]` / `hover:text-[#ddd6fe]` — identical to the Forgot password and Create account link colors. Separator `·` uses `mx-2`. `mt-8` top margin from card edge.

**Rule:** This nav is display-only. It must never touch login form state, validation, `handleLogin`, or navigation for the primary auth flow.

## 3. Database Schema Authority

### Authentication and session

- `auth.users`
  - Supabase Auth source of truth for account identity.
  - Accessed through `supabase.auth.*`, not table queries.

### Profile shell and public user data

- `public.profiles`
  - User profile shell for onboarding and discoverability.
  - Used during register, login-side discoverability repair, onboarding, and VCSM actor hydration for `kind='user'`.

### VCSM domain identity

- `vc.actors`
  - Canonical VCSM actor rows.
  - Used to resolve actor kind, profile ownership, VPORT linkage, and app hydration input.
- `vc.actor_owners`
  - Links actors to owning users.
  - Used when creating user actors and when hydrating VPORT owner context.
- `vc.actor_privacy_settings`
  - Canonical privacy state for actor-scoped identity.
- `vc.vports`
  - Used when hydrating a VPORT actor.
- `vc.realms`
  - Used during VCSM hydration to resolve `realmId`.

### Platform identity layer

- `platform.user_app_access`
- `platform.user_app_accounts`
- `platform.user_app_preferences`
- `platform.user_app_state`
- `platform.user_app_actor_links` (created by: vc.create_vport for vport actors; self-heal finalization for citizen resolve; provision_vcsm_identity creates account shell only)

These are not read directly by VCSM screens. They are resolved by the shared identity engine. Actor links are created by vc.create_vport (for vports) and by self-heal finalization (for citizens after first resolve).

### RPCs

- `generate_username`
  - Called during onboarding.
- `vc.create_actor_for_user`
  - Called when completing onboarding if a user actor does not already exist.
- `platform.provision_vcsm_identity`
  - Called to bootstrap/repair platform identity for a VCSM user+actor pair.

## 4. Main Contracts and Models

### Auth contract

`apps/VCSM/src/app/providers/AuthProvider.jsx`

`useAuth()` returns `{ user, session, loading, logout }`
- `logout()` is optimistic in the client and then calls `supabase.auth.signOut({ scope: 'local' })`
- `onAuthStateChange` now handles `PASSWORD_RECOVERY` event explicitly: navigates to `/reset-password`. This is the safety net ensuring password reset links always land on the correct screen regardless of which route Supabase redirects to.

### Identity contract

`apps/VCSM/src/state/identity/identityContext.jsx`

- `identity` is the hydrated actor object returned from the VCSM hydrator
- actor storage cache key is userId-scoped: `vc.identity.actorId.{userId}` via `apps/VCSM/src/state/identity/identityStorage.js` — different auth users never share cached actorIds
- identity React state is cleared synchronously on auth user change (useEffect on user?.id sets identity=null, loading=true before async resolution runs)
- identity debug panel at `debuggers/identity/` — dev-only, persists events to sessionStorage
- actor switch debug panel at `debuggers/actor-switch/` — dev-only, tracks full switch pipeline

### Hydrated actor shape

Produced by:

- `apps/VCSM/src/features/hydration/vcsmActorHydrator.js`

Core fields observed in runtime:

- `actorId`
- `kind`
- `realmId`
- `displayName`
- `username`
- `avatar`
- `banner`
- `bio`
- `private`
- for VPORT actors: `ownerActorId`

## 5. Layer Stack

### Auth flow

```text
screen -> hook -> controller -> DAL -> Supabase Auth / public.profiles
```

Examples:

- `LoginScreen.jsx` -> `useLogin.js` -> `login.controller.js` + `authSession.controller.js` + `profile.controller.js` -> auth/profile DAL
- `RegisterScreen.jsx` -> `useRegister.js` -> `register.controller.js` -> `register.dal.js`

### Identity flow

```text
IdentityProvider -> identity.controller.js
  -> @identity engine (platform only)
  -> @hydration engine (dispatcher only)
  -> VCSM hydrator adapter
  -> VCSM DAL (`vc.*`, `public.profiles`)
```

This layering is mostly respected after the hydration-engine integration. The remaining hybrid part is that VCSM identity still depends on legacy/domain tables for actor hydration.

## 6. Pipeline 1: Login and Session Restore

### Session restore on app boot

```text
main.jsx
  -> AuthProvider mounts
  -> supabase.auth.getSession()
  -> user/session state restored
  -> IdentityProvider sees authenticated user
  -> loadDefaultIdentityForUser(...)
```

Key files:

- `apps/VCSM/src/main.jsx`
- `apps/VCSM/src/app/providers/AuthProvider.jsx`
- `apps/VCSM/src/state/identity/identityContext.jsx`

### Login submit path

```text
LoginScreen.jsx
  -> useLogin.handleLogin()
  -> signInWithPassword({ email, password })
  -> hydrateAuthSession()
  -> ensureProfileDiscoverable(user.id)
  -> navigate('/feed' or return route)
```

Files:

- `apps/VCSM/src/features/auth/hooks/useLogin.js`
- `apps/VCSM/src/features/auth/controllers/login.controller.js`
- `apps/VCSM/src/features/auth/dal/login.dal.js`
- `apps/VCSM/src/features/auth/controllers/authSession.controller.js`
- `apps/VCSM/src/features/auth/dal/authSession.read.dal.js`
- `apps/VCSM/src/features/auth/controllers/profile.controller.js`
- `apps/VCSM/src/features/auth/dal/profile.dal.js`

Notable behavior:

- Login repairs `public.profiles.discoverable` through `ensureProfileDiscoverable(user.id)`.
- Identity hydration is not done directly in the login hook. It happens when `AuthProvider` changes the user/session state and `IdentityProvider` reacts.

## 7. Pipeline 2: Register, Onboarding, Profile Shell, Actor Creation

### Register

```text
RegisterScreen.jsx
  -> useRegister.handleRegister()
  -> ctrlRegisterAccount(...)
  -> register.dal.js
      - auth.getSession()
      - auth.updateUser() for anonymous upgrade path
      - auth.signUp() for normal path
      - profiles.upsert()
      - optional Wanders session mirror
  -> if requiresEmailConfirm: navigate('/verify-email', { state: { email } })
  -> if session active: recordSignupConsent() -> navigate('/onboarding')
```

`/verify-email` — public route, `VerifyEmailRequiredScreen`:
- Reads email from `location.state.email`
- 4-second countdown auto-redirect to `/login`
- Resend button via `useResendVerification`

After email confirmation link is clicked → `/auth/callback` → `useAuthCallback` → `navigate('/explore')` on success.

Key files:

- `apps/VCSM/src/features/auth/hooks/useRegister.js`
- `apps/VCSM/src/features/auth/controllers/register.controller.js`
- `apps/VCSM/src/features/auth/dal/register.dal.js`
- `apps/VCSM/src/features/auth/screens/VerifyEmailRequiredScreen.jsx`
- `apps/VCSM/src/app/routes/public/auth.routes.jsx`

### Onboarding bootstrap

`getOnboardingBootstrapController()`:

- gets current session user
- redirects anonymous users to register
- redirects missing sessions to login
- reads `public.profiles` onboarding data

### Onboarding completion

```text
Onboarding.jsx
  -> useAuthOnboarding()
  -> completeOnboardingController({ userId, form })
  -> generate_username RPC
  -> upsert profile
  -> createUserActorForProfile()
      -> read vc.actors by profile_id
      -> vc.create_actor_for_user RPC if missing
      -> ensure vc.actor_owners row
  -> ensureVcsmPlatformBootstrap({ userId, actorId })
```

Key files:

- `apps/VCSM/src/features/auth/hooks/useAuthOnboarding.js`
- `apps/VCSM/src/features/auth/controllers/onboarding.controller.js`
- `apps/VCSM/src/features/auth/dal/onboarding.dal.js`
- `apps/VCSM/src/features/auth/controllers/createUserActor.controller.js`
- `apps/VCSM/src/features/auth/dal/actorCreate.dal.js`
- `apps/VCSM/src/features/auth/dal/actorGetByProfile.dal.js`
- `apps/VCSM/src/features/auth/dal/actorOwnerCreate.dal.js`
- `apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js`

## 8. Pipeline 3: Forgot Password and Set New Password

### Forgot password (send reset email)

```text
ForgotPasswordScreen.jsx
  -> useResetPassword.handleReset()
  -> ctrlSendResetPasswordEmail(email)
  -> supabase.auth.resetPasswordForEmail(email, {
       redirectTo: `${window.location.origin}/reset-password`
     })
```

On success: 4-second auto-redirect to `/login` via useEffect timer. User can also click "Back to login" button immediately.

Files:

- `apps/VCSM/src/features/auth/screens/ForgotPasswordScreen.jsx`
- `apps/VCSM/src/features/auth/hooks/useResetPassword.js`
- `apps/VCSM/src/features/auth/controllers/sendResetPassword.controller.js`
- `apps/VCSM/src/features/auth/dal/resetPassword.dal.js`

### Set new password (after clicking recovery link)

```text
Email link -> /reset-password?code=... (PKCE) or /reset-password#...type=recovery (implicit)

Two-path session detection in useSetNewPassword:
  Path A: supabase.auth.onAuthStateChange(PASSWORD_RECOVERY) -> status='ready'
  Path B (fallback): resolveRecoverySessionController() -> getSession() -> status='ready'
  Timeout at 15s -> status='invalid' (link expired / already used)

On submit:
  -> updatePasswordController({ password })
  -> validatePassword (evaluateRegisterPasswordRules)
  -> dalUpdateUserPassword (supabase.auth.updateUser({ password }))
  -> dalSignOutRecoverySession (supabase.auth.signOut({ scope: 'local' }))
  -> navigate('/login', { replace: true, state: { passwordReset: true } })

Safety net (AuthProvider):
  onAuthStateChange(PASSWORD_RECOVERY) -> navigate('/reset-password', { replace: true })
  Fires regardless of which route the recovery link lands on.

Auth callback safety net (if link somehow lands on /auth/callback):
  resolveAuthCallbackController detects type=recovery in hash
  -> returns { isRecovery: true }
  -> useAuthCallback navigates to /reset-password
```

Files:

- `apps/VCSM/src/features/auth/screens/ResetPasswordScreen.jsx`
- `apps/VCSM/src/features/auth/hooks/useSetNewPassword.js`
- `apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js`
- `apps/VCSM/src/features/auth/dal/resetPassword.dal.js` — `dalSendResetPasswordEmail`, `dalGetRecoverySession`, `dalExchangeRecoveryCode`, `dalUpdateUserPassword`, `dalSignOutRecoverySession`

### Logout

```text
useAuth().logout()
  -> optimistic local user/session clear
  -> clear local actor keys
  -> dispatch window 'actor:changed'
  -> navigate('/login')
  -> supabase.auth.signOut({ scope: 'local' })
  -> remove Supabase channels
```

This is owned by `apps/VCSM/src/app/providers/AuthProvider.jsx`.

## 9. Pipeline 4: Default Identity Resolution

### Main controller

`loadDefaultIdentityForUser({ userId, savedActorId })` in:

- `apps/VCSM/src/state/identity/identity.controller.js`

Runtime flow:

```text
IdentityProvider
  -> loadDefaultIdentityForUser({ userId, savedActorId })
  -> resolveAuthenticatedContext({ appKey:'vcsm', skipLoginRecord:true })
  -> engine returns:
      - userAppAccountId
      - activeActor
      - availableActors
      - preferences/state
  -> readIdentityActorByIdDAL(activeActor.actorId)
  -> hydrateIdentityActor(actor)
  -> attach _engineMeta
```

Shared engine entry:

- `engines/identity/src/controller/resolveAuthenticatedContext.controller.js`

VCSM setup:

- `apps/VCSM/src/features/identity/setup.js`
- `apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js`

## 10. Pipeline 5: Self-Heal / Platform Bootstrap

If `loadDefaultIdentityForUser()` returns no platform-backed identity, `IdentityProvider` performs a self-heal pass:

```text
IdentityProvider
  -> query vc.actors where profile_id = user.id and kind='user'
  -> ensureVcsmPlatformBootstrap({ userId, actorId })
  -> retry loadDefaultIdentityForUser(...)
```

Provisioning RPC:

- `apps/VCSM/src/features/identity/dal/provision.rpc.dal.js`
- RPC `platform.provision_vcsm_identity`

The provisioning layer is responsible for ensuring:

- `platform.user_app_access`
- `platform.user_app_accounts`
- `platform.user_app_preferences`
- `platform.user_app_state`
- `platform.user_app_actor_links`
- `vc.actors.user_app_account_id`

## 11. Pipeline 6: Hydration Through the Shared Hydration Engine

Current flow after the new integration:

```text
loadIdentityForActorId(actorId)
  -> hydrateActor({ appKey:'vcsm', actorSource:'vc', actorId })
  -> hydration engine dispatcher
  -> hydrateVcsmActor()
      -> readIdentityActorByIdDAL()
      -> if kind=user:
           readProfileIdentityDAL()
           readActorPrivacyDAL()
           mapProfileActor()
        if kind=vport:
           readVportIdentityDAL()
           readActorPrivacyDAL()
           readActorOwnerUserDAL()
           mapVportActor()
      -> resolveRealmId()
```

Files:

- `apps/VCSM/src/features/hydration/setup.js`
- `apps/VCSM/src/features/hydration/vcsmActorHydrator.js`
- `engines/hydration/src/controller/hydrateActor.controller.js`
- `apps/VCSM/src/state/identity/identity.read.dal.js`
- `apps/VCSM/src/state/identity/identity.controller.js`

Boundary rule confirmed:

- shared hydration engine does not query `vc.*`
- VCSM hydrator adapter owns `vc.*` and `public.profiles`

## 12. Pipeline 7: Actor Switch

Main entry:

- `apps/VCSM/src/state/identity/identityContext.jsx`

Runtime flow:

```text
switchActor(actorId)
  -> resolveAuthenticatedContext(appKey='vcsm', skipLoginRecord=true)
  -> find actorLink in availableActors
  -> engineSwitchActiveActor({ userAppAccountId, actorLinkId })
  -> loadIdentityForActorId(actorId)
  -> saveIdentity(actorId) to localStorage
  -> setIdentity(nextIdentity)
```

Important details:

- platform preference write is authoritative
- localStorage is treated as a cache only
- hydration continues even if platform write fails, to preserve UX continuity
- switch debug tooling is present in development builds

Owned actor choices:

- `loadOwnedActorChoices()` in `apps/VCSM/src/state/identity/identity.controller.js`

## 13. Platform vs VCSM Schema Boundary

### Shared identity engine owns

- platform app resolution
- platform account lookup
- active actor preference/state
- available actor links

### VCSM app owns

- actor lookup from `vc.actors`
- actor privacy from `vc.actor_privacy_settings`
- user profile hydration from `public.profiles`
- VPORT hydration from `vc.vports`
- VPORT owner linkage from `vc.actor_owners`
- realm resolution from `vc.realms`

### Practical result

The system is platform-first for active-account orchestration, but still VCSM-domain-first for actual actor presentation.

## 14. Key Files Reference

- `apps/VCSM/src/main.jsx` — boots identity, hydration, and chat engine setup before React render.
- `apps/VCSM/src/app/providers/AuthProvider.jsx` — Supabase auth/session owner; handles PASSWORD_RECOVERY navigation.
- `apps/VCSM/src/state/identity/identityContext.jsx` — runtime identity state and actor switching.
- `apps/VCSM/src/state/identity/identity.controller.js` — app identity orchestration layer.
- `apps/VCSM/src/state/identity/identity.read.dal.js` — VCSM domain identity reads.
- `apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js` — VCSM adapter into the shared identity engine.
- `apps/VCSM/src/features/hydration/vcsmActorHydrator.js` — VCSM hydration adapter into the shared hydration engine.
- `apps/VCSM/src/features/auth/controllers/onboarding.controller.js` — onboarding completion and actor/bootstrap creation.
- `apps/VCSM/src/app/guards/ProfileGatedOutlet.jsx` — wraps protected app routes with CompleteProfileGate.
- `apps/VCSM/src/app/guards/ProtectedRoute.jsx` — auth + email verification + consent gate chain.

## 15. Weak Spots / Risks

1. Identity is still mixed between platform rows and legacy/domain hydration rows.
2. Login mutates `public.profiles.discoverable`, which is an unexpected side effect for a sign-in flow.
3. Self-heal currently reaches into `vc.actors` from `IdentityProvider`, so the provider still contains recovery logic instead of staying orchestration-only.
4. Actor switch has dual persistence paths: platform preference plus localStorage cache. That is intentional, but it increases debugging complexity.
5. VPORT hydration depends on owner linkage via `vc.actor_owners`; if that row drifts, business identities partially hydrate.

## 16. Final Judgment

The auth and identity system is now more structured than before:

- authentication is cleanly layered
- platform identity resolution is centralized in the shared engine
- hydration dispatch is centralized in the shared hydration engine
- VCSM domain hydration remains app-owned, which is the correct boundary
- CompleteProfileGate is wired and enforced via ProfileGatedOutlet

Final judgment:

- layered: mostly yes
- hybrid: yes
- tightly coupled: moderately, at the VCSM hydration boundary
- duplicated: limited
- platform-first: partially
- migration-ready: mostly for VCSM, but not fully until self-heal and remaining legacy hydration dependencies are simplified
