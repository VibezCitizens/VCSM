---
name: VCSM Auth-Login Runtime Map
scope: apps/VCSM
generatedAt: 2026-05-14
source: ARCHITECT
command: /ARCHITECT — Map full runtime architecture for auth-login screen
confidence: STATICALLY_TRACED
---

# MODULE ARCHITECTURE REPORT

Module: auth-login (Login Screen Runtime Map)
Application Scope: apps/VCSM
Module Type: feature module — auth entry surface
Primary Root: apps/VCSM/src/features/auth/
Independence Status: MOSTLY INDEPENDENT
Completeness Status: MOSTLY COMPLETE

---

## PURPOSE

The auth-login module is the primary unauthenticated entry point for the VCSM platform.
It handles email+password authentication, post-login session hydration, profile discoverability enforcement, and redirects the user into the authenticated app after a successful sign-in.

It is **not** responsible for identity resolution. Identity is resolved async in `IdentityProvider` after the redirect. The login screen is complete when `navigate('/feed')` fires.

---

## OWNERSHIP

| Role | Owner |
|---|---|
| Screen composition | `features/auth/screens/LoginScreen.jsx` |
| Hook orchestration | `features/auth/hooks/useLogin.js` |
| Auth business logic | `features/auth/controllers/login.controller.js` |
| Session business logic | `features/auth/controllers/authSession.controller.js` |
| Profile discoverability | `features/auth/controllers/profile.controller.js` |
| Supabase auth reads/writes | `features/auth/dal/login.dal.js` |
| Session DAL | `features/auth/dal/authSession.read.dal.js` |
| Profile DAL | `features/auth/dal/profile.dal.js` |
| Profile domain model | `features/auth/model/profile.model.js` |
| Public route guard | `app/routes/public/AuthPublicRoute.jsx` |
| Route registration | `app/routes/public/auth.routes.jsx` |
| Auth session context | `app/providers/AuthProvider.jsx` |

---

## ENTRY POINTS

| Entry | Path | Route | Guard |
|---|---|---|---|
| LoginScreen | `apps/VCSM/src/features/auth/screens/LoginScreen.jsx` | `/login` | `AuthPublicRoute` (redirects to `/feed` if already authenticated) |
| Route definition | `apps/VCSM/src/app/routes/public/auth.routes.jsx` | `/login` | Injected via `authPublicRoutes()` factory |
| Lazy import | `apps/VCSM/src/app/routes/lazyPublic.jsx` | — | Lazy-loaded via `React.lazy` |
| Global router | `apps/VCSM/src/app/routes/index.jsx` | — | Registered in top-level `AppRoutes` |
| Fallback | `apps/VCSM/src/app/routes/index.jsx:258` | `path: '*'` | Any unknown path → `/login` |

---

## LAYER MAP

**DAL:**
- `features/auth/dal/login.dal.js` — `dalSignInWithPassword`, `dalGetAuthUser`, `dalSignOut`
- `features/auth/dal/authSession.read.dal.js` — `dalHydrateAuthSession`, `dalGetAuthSession`
- `features/auth/dal/profile.dal.js` — `dalGetProfileDiscoverable`, `dalUpdateProfileDiscoverable`

**Model:**
- `features/auth/model/profile.model.js` — `ProfileModel(row)` — maps `{ id, discoverable }` to domain shape
- `features/auth/model/emailVerification.model.js` — `isEmailVerifiedModel(user)` — used post-login by `ProtectedRoute`

**Controller:**
- `features/auth/controllers/login.controller.js` — `signInWithPassword`, `getAuthUser`, `signOut`
- `features/auth/controllers/authSession.controller.js` — `hydrateAuthSession` (thin pass-through)
- `features/auth/controllers/profile.controller.js` — `ensureProfileDiscoverable(userId)`

**Hook:**
- `features/auth/hooks/useLogin.js` — Full login orchestration hook; owns form state, error state, loading state, and 3-step submit sequence

**Component:**
- `app/platform/ios/components/IosInstallPrompt.jsx` — iOS PWA install prompt rendered inside LoginScreen

**Screen:**
- `features/auth/screens/LoginScreen.jsx` — Composes `useLogin`, form markup, iOS install prompt, seasonal theme, i18n strings, error/success banners

**Services / Adapters:**
- `features/auth/adapters/auth.adapter.js` — Public barrel for cross-feature auth consumption (`CompleteProfileGate`, `VerifyEmailRequiredScreen`, `isEmailVerifiedModel`, `useAuthOps`, `authTheme`, `ConsentCheckbox`)
- `app/providers/AuthProvider.jsx` — React Context providing `{ user, loading, logout }` to the entire app via `useAuth()`

**Styles:**
- `features/auth/styles/authTheme.js` — Inline style tokens (mirrors `--vc-*` CSS vars)
- `features/auth/styles/authInputClasses.js` — Shared input class strings
- `features/auth/styles/registerFormCard.css` — Card CSS (register flow, not login)

---

## COMPLETE CALL GRAPH

### Screen → Hook → Controller → Model → DAL → DB

```
LoginScreen.jsx
  ├── useLogin(navigate, location)
  │     │
  │     ├── [STEP 1 — SIGN IN]
  │     │   signInWithPassword({ email, password })
  │     │     └── login.controller.js
  │     │           └── dalSignInWithPassword({ email, password })
  │     │                 └── login.dal.js
  │     │                       └── supabase.auth.signInWithPassword()
  │     │                             → WRITE: auth.users (Supabase managed)
  │     │                             → Stores session in localStorage (sb-auth-main)
  │     │
  │     ├── [STEP 2 — SESSION HYDRATE]
  │     │   hydrateAuthSession()
  │     │     └── authSession.controller.js
  │     │           └── dalHydrateAuthSession()
  │     │                 └── authSession.read.dal.js
  │     │                       └── supabase.auth.getSession()
  │     │                             → READ: Supabase session (client cache)
  │     │
  │     ├── [STEP 3 — PROFILE DISCOVERABLE]
  │     │   ensureProfileDiscoverable(data.user.id)
  │     │     └── profile.controller.js
  │     │           ├── dalGetAuthSession()
  │     │           │     └── authSession.read.dal.js → supabase.auth.getSession()
  │     │           ├── dalGetProfileDiscoverable(userId)
  │     │           │     └── profile.dal.js
  │     │           │           └── SELECT id, discoverable
  │     │           │               FROM profiles WHERE id = :userId
  │     │           │               → READ: public.profiles
  │     │           ├── ProfileModel(row)
  │     │           │     └── profile.model.js → { id, isDiscoverable }
  │     │           └── dalUpdateProfileDiscoverable({ profileId, discoverable, updatedAt })
  │     │                 └── profile.dal.js
  │     │                       └── UPDATE profiles
  │     │                           SET discoverable=true, updated_at=now()
  │     │                           WHERE id = :profileId
  │     │                           → WRITE: public.profiles
  │     │
  │     └── [STEP 4 — REDIRECT]
  │         navigate(dest, { replace: true })
  │           → dest = location.state.from OR '/feed'
  │           → Blocked destinations: /login, /register, /reset, /forgot-password
  │
  ├── [iOS DETECTION — useEffect, local only]
  │     navigator.userAgent → setCanShowInstall(true/false)
  │
  ├── authTheme.js (inline style tokens)
  ├── getActiveSeasonTheme() (@/season)
  ├── useTranslation() (@i18n)
  └── IosInstallPrompt (rendered as fragment sibling)
```

### AuthPublicRoute Guard (wraps LoginScreen at route level)

```
AuthPublicRoute.jsx
  └── useAuth()
        └── AuthProvider (React Context)
              ├── user → if truthy: <Navigate to="/feed" replace />
              └── loading → if true: return null (splash held)
```

### AuthProvider (concurrent with login, event-driven)

```
AuthProvider.jsx
  ├── [INIT] supabase.auth.getSession()         → READ: Supabase session
  ├── [LISTENER] supabase.auth.onAuthStateChange()
  │     └── SIGNED_IN event (fires after signInWithPassword)
  │           ├── setUser(nextSession.user)
  │           ├── setSession(nextSession)
  │           ├── setLoading(false)
  │           └── PASSWORD_RECOVERY event → navigate('/reset-password')
  └── [LOGOUT] supabase.auth.signOut({ scope: 'local' })
        ├── clearAllIdentityStorage()
        ├── localStorage.removeItem('actor_kind', 'actor_vport_id')
        └── localStorage.setItem('actor_touch', timestamp)
```

### Post-Redirect Identity Resolution (async, in background after navigate)

```
IdentityProvider (identityContext.jsx)
  └── useEffect([user?.id])
        └── loadDefaultIdentityForUser({ userId, savedActorId })
              └── identity.controller.js
                    └── resolveAuthenticatedContext({ appKey: 'vcsm' })
                          └── engines/identity/src/...
                                [14-phase engine resolution — see vcsm.identity.login-pipeline-trace.md]
```

---

## IDENTITY / SESSION DATA FLOW

| Phase | What | Who | Where |
|---|---|---|---|
| Pre-login | `user = null`, `loading = true` | `AuthProvider` | `AuthContext` |
| Login submit | `signInWithPassword()` fires | `useLogin` → `login.controller` → `login.dal` | Supabase Auth |
| Post sign-in | Session stored in client cache | Supabase JS client | `localStorage` (sb-auth-main) |
| Session hydrate | `getSession()` confirms session | `authSession.controller` | Supabase client |
| Redirect | `navigate('/feed')` fires | `useLogin` | React Router |
| SIGNED_IN event | `onAuthStateChange` delivers event | `AuthProvider` | `AuthContext` |
| User committed | `setUser(newUser)` | `AuthProvider` | `AuthContext` |
| Identity cleared | `setIdentity(null), setLoading(true)` | `IdentityProvider` | `identityContext` |
| Identity resolved | Engine resolves actor, hydrates | `identity.controller.js` + `engines/identity` | `identityContext` |
| Identity committed | `setIdentity(hydratedActor)` | `IdentityProvider` | `identityContext` |

**Critical gap:** There is a window between `navigate('/feed')` (T6) and `setIdentity()` (T35) where `/feed` renders with `identity=null, loading=true`. All downstream screens must handle this gracefully.

---

## DATABASE READ/WRITE MAP

### Reads

| Table / Surface | Operation | File | Phase |
|---|---|---|---|
| `auth.users` (Supabase managed) | `signInWithPassword` | `login.dal.js` | Login submit |
| Supabase session (client cache) | `getSession()` — called twice | `authSession.read.dal.js` | Session hydrate + profile controller |
| `public.profiles` | `SELECT id, discoverable WHERE id=userId` | `profile.dal.js` | ensureProfileDiscoverable |
| `platform.apps` | `SELECT ... WHERE key='vcsm'` | `engines/identity/.../app.read.dal.js` | Engine 2_APP |
| `platform.user_app_access` | `SELECT ... WHERE userId AND appId` | `engines/identity/.../access.read.dal.js` | Engine 3_ACCESS |
| `platform.v_user_app_context` | `SELECT ... WHERE userId AND appKey` | `engines/identity/.../account.read.dal.js` | Engine 4_ACCOUNT |
| `platform.user_app_state` | `SELECT ... WHERE userAppAccountId` | `engines/identity/.../state.read.dal.js` | Engine 5_STATE |
| `platform.user_app_preferences` | `SELECT ... WHERE userAppAccountId` | `engines/identity/.../preferences.read.dal.js` | Engine 5_PREFS |
| `platform.user_app_actor_links` | `SELECT ... WHERE userAppAccountId AND status='active'` | `engines/identity/.../actorLinks.read.dal.js` | Engine 6_LINKS |
| `vc.actors` | `SELECT id, kind, profile_id, vport_id, is_void WHERE id=actorId` | `state/identity/identity.read.dal.js` | Engine actor hydration |
| `public.profiles` | Profile hydration (citizen) | `engines/hydration/...` | Engine 9_HYDRATE |
| `vc.vports` | Vport hydration (business) | `engines/hydration/...` | Engine 9_HYDRATE (vport path) |

### Writes

| Table / Surface | Operation | File | Condition |
|---|---|---|---|
| `auth.users` | `signInWithPassword` (token write) | `login.dal.js` | Always on login |
| `public.profiles` | `UPDATE SET discoverable=true` | `profile.dal.js` | Only if not already discoverable |
| `platform.user_app_preferences` | `UPSERT active_actor_link_id` | `engines/identity/.../actorLinks.write.dal.js` | Self-heal finalization only |
| `platform.user_app_state` | `UPDATE onboarding_status, last_login_at` | `engines/identity/.../state.write.dal.js` | Self-heal finalization only |
| `platform.user_app_access` | Provision via RPC | `features/identity/dal/provision.rpc.dal.js` | Self-heal only (first-time bootstrap) |
| `platform.user_app_accounts` | Provision via RPC | same | Self-heal only |
| `platform.user_app_actor_links` | Provision via RPC | same | Self-heal only |

### localStorage Writes (logout only)

| Key | Value | Who |
|---|---|---|
| `actor_kind` | removed | `AuthProvider.logout()` |
| `actor_vport_id` | removed | `AuthProvider.logout()` |
| `actor_touch` | `Date.now()` | `AuthProvider.logout()` |

---

## EXTERNAL DEPENDENCIES

| Dependency | Type | Import | Purpose |
|---|---|---|---|
| `supabase` | Supabase client | `@/services/supabase/supabaseClient` | Auth API |
| `react-router-dom` | Navigation | `useNavigate`, `useLocation`, `Link`, `Navigate` | Routing |
| `lucide-react` | Icons | `ChevronRight`, `Smartphone`, `Sparkles` | iOS install prompt UI |
| `@/season` | Internal — `getActiveSeasonTheme` | `@/season` | Seasonal decorations (fog, hat) |
| `@i18n` | Internal — i18n hook | `useTranslation` | Localized strings |
| `engines/identity` | Engine | via `identity.controller.js` | Post-login identity resolution |
| `engines/hydration` | Engine | via `identity.controller.js` | Actor hydration |
| `@debuggers/identity` | Dev tool | `debugLoginEvent`, `debugLoginError`, `debugLoginSessionSnapshot` | Debug panel (dev only) |
| `@debuggers/cycle` | Dev tool | `debugUserChanged` | Dev only |
| `shared/lib/hideLaunchSplash` | Shared | `hideLaunchSplash()` | iOS launch splash control |
| `shared/lib/iosProdDebugger` | Shared | `appendIOSProdDebugLog` | iOS prod debug tracing |
| `state/identity/identityStorage` | Internal | `clearAllIdentityStorage` | Logout cleanup |

---

## NAVIGATION AFTER SUCCESS

| Source | Destination | Condition |
|---|---|---|
| `useLogin.handleLogin` | `location.state.from` | If `from` is a valid non-auth path |
| `useLogin.handleLogin` | `/feed` | Default (no `from`, or `from` is an auth route) |
| `AuthPublicRoute` | `/feed` | If `user` already exists when `/login` is visited |
| `AuthProvider` | `/reset-password` | If `PASSWORD_RECOVERY` auth event fires |
| `ProtectedRoute` | `/login` | If unauthenticated user reaches a protected route |
| `AppRoutes` fallback | `/login` | Any unknown path (`path: '*'`) |

---

## T6→T35 IDENTITY GAP — FULL ROUTE MAP

### Gap Definition

**What:** The window between `navigate('/feed')` (T6) and `setIdentity(hydratedActor)` (T35) where `identity=null` and `identity.loading=true`. Identity resolution is an async engine operation that starts only after `AuthProvider` fires `SIGNED_IN` — which itself fires after the redirect has already completed.

**Duration:** 200–1500ms normal path. 800–2000ms on self-heal (first-time user or broken platform rows).

**Three concurrent async operations during the gap:**

| # | Operation | Duration | Where Guarded |
|---|---|---|---|
| 1 | Auth session hydrate | ~50–200ms | `ProtectedRoute` (`if loading return null`) |
| 2 | Identity engine resolve | ~200–1500ms | **NOWHERE in route chain** |
| 3 | Profile gate check | ~200–500ms | `CompleteProfileGate` (its own `loading`, unrelated to identity) |

Operations 2 and 3 are **independent**. Profile gate can complete and pass the user through to `/feed` while identity is still null.

---

### Route Chain During the Gap

```
Browser hits /feed
  ↓
AppRoutes (index.jsx)
  ↓
ProtectedRoute (app/guards/ProtectedRoute.jsx)
  ├── if (authLoading) → return null                   ✅ AUTH GUARD
  ├── if (!user) → <Navigate to="/login" />            ✅ AUTH GUARD
  ├── if (!isEmailVerified) → <VerifyEmailRequired />  ✅ EMAIL GUARD
  ├── if (consentLoading) → return null                ✅ CONSENT GUARD
  ├── if (requiresConsent) → <ConsentGateScreen />     ✅ CONSENT GUARD
  └── <Outlet />
        ↓ NO IDENTITY.LOADING CHECK ❌
        ↓
ProfileGatedOutlet (app/guards/ProfileGatedOutlet.jsx)
  └── <CompleteProfileGate>
        ├── if (loading) → "Loading…"                  ⚠️ PROFILE GATE LOADING — NOT identity.loading
        ├── if (needsOnboarding) → /onboarding         ✅ ONBOARDING GATE
        └── <Outlet />
              ↓ NO IDENTITY.LOADING CHECK ❌
              ↓
RootLayout (app/layout/RootLayout.jsx)
  ├── Renders: TopNav, BottomNavBar, PageContainer     ❌ RENDERS WITH identity=null
  └── <Outlet />
        ↓ NO IDENTITY.LOADING CHECK ❌
        ↓
CentralFeedScreen (features/feed/screens/CentralFeedScreen.jsx)
  ├── const { identity } = useIdentity()
  │     identity = null during gap
  ├── actorId = identity?.actorId ?? null              → null
  ├── realmId = identity?.realmId ?? null              → null
  ├── useCentralFeed(actorId, realmId)
  │     enabled: Boolean(actorId)                     → false — query disabled ✅
  ├── firstBatchReady = false                          → skeleton shown ✅
  └── <FeedSkeletonList count={3} />                   ⚠️ IMPLICIT SAFETY — skeleton not an explicit gap guard
```

---

### Guard Status Per Layer

| Layer | File | Guards identity.loading? | What happens during gap |
|---|---|---|---|
| `ProtectedRoute` | `app/guards/ProtectedRoute.jsx` | ❌ NO | Passes through to Outlet after auth + consent checks |
| `ProfileGatedOutlet` | `app/guards/ProfileGatedOutlet.jsx` | ❌ NO | Passes through, no guard of any kind |
| `CompleteProfileGate` | `features/auth/screens/CompleteProfileGate.jsx` | ❌ NO | Has its own unrelated loading guard — profile check, not identity |
| `RootLayout` | `app/layout/RootLayout.jsx` | ❌ NO | Renders full UI chrome (TopNav, BottomNav) with identity=null |
| `CentralFeedScreen` | `features/feed/screens/CentralFeedScreen.jsx` | ❌ NO explicit | Safe implicitly — feed query disabled when actorId=null, skeleton shows |

---

### What the User Sees During the Gap

| UI Element | Rendered? | Safe? | Notes |
|---|---|---|---|
| TopNav | YES | ⚠️ PARTIAL | Rendered with identity=null — avatar, username, actor switcher all null |
| BottomNavBar | YES | ⚠️ PARTIAL | Rendered — nav items may check identity for active state |
| Feed area | YES — skeleton | ✅ SAFE | `FeedSkeletonList` shown while `firstBatchReady=false` |
| Feed posts | NO | ✅ SAFE | `useCentralFeed` disabled while `actorId=null` |
| WelcomeFeedCard | CONDITIONAL | ✅ SAFE | Uses actorId check — disabled when null |

**Visible to user:** A complete UI shell (nav bars rendered) with a skeleton feed. Not blank, not crashing — but identity-dependent UI elements in the nav will show empty/null states.

---

### Safety Classification

**Overall gap safety: IMPLICIT — not explicit**

The feed screen survives the gap because:
1. `useCentralFeed` has `enabled: Boolean(actorId)` — query does not fire when actorId is null
2. `firstBatchReady` starts false → skeleton renders immediately
3. No post data arrives → nothing renders with null identity

This is **accidental safety**. If `useCentralFeed`'s `enabled` guard were removed, or if a new screen were added to the `/feed` route group without the same pattern, the gap would be exposed.

---

### Where the Gap Closes

```
T35: IdentityProvider → setIdentity(hydratedActor)
  └── React re-render propagates to all useIdentity() consumers
        ├── CentralFeedScreen re-renders
        │     actorId = hydratedActor.actorId  (now valid)
        │     realmId = hydratedActor.realmId  (now valid)
        │     useCentralFeed query enabled → fires
        │     posts load → firstBatchReady → skeleton replaced with posts
        ├── TopNav re-renders → avatar, username, switcher visible
        └── BottomNavBar re-renders → active state resolved
```

---

### Risks Requiring LOKI Verification

| Risk | Location | Severity | Needs LOKI? |
|---|---|---|---|
| TopNav renders with `identity=null` | `app/layout/RootLayout.jsx` → TopNav | MEDIUM | YES — verify TopNav null-guards actor data |
| BottomNavBar renders with `identity=null` | `app/layout/RootLayout.jsx` → BottomNavBar | MEDIUM | YES — verify active state handles null |
| Any protected screen skips `enabled` guard on its primary query | Any screen in `protectedAppRoutes` | HIGH | YES — verify all hooks have null actorId guard |
| Profile gate finishes before identity resolves — user passed through | `CompleteProfileGate` | MEDIUM | YES — trace timing in real session |
| Self-heal path (800–2000ms gap) exposes more UI | `identityContext.jsx` | HIGH | YES — longer gap = more time in null state |

---

### Fix Options

**Option A — Gate at ProtectedRoute (recommended)**
Add identity loading check in `ProtectedRoute.jsx` after the consent gate. Block render of Outlet until `identity !== null || identityLoading === false`.

Risk: Delays all protected screens by identity resolution time (~200–1500ms). User sees blank/null during that window.

**Option B — Gate at RootLayout**
Add `if (identityLoading) return <AppLoadingScreen />` before rendering chrome. Prevents TopNav/BottomNav from rendering with null identity.

Risk: UI chrome flashes in after identity resolves.

**Option C — Accept implicit safety + harden all screen hooks**
Leave route chain as-is. Mandate that every hook consuming actorId has `enabled: Boolean(actorId)` and every screen renders a skeleton when `firstBatchReady === false` or `loading === true`.

Risk: Relies on per-screen discipline — new screens added without the pattern re-expose the gap.

**Recommended:** Option B + Option C together. Gate the layout chrome at `RootLayout`, and mandate `enabled: Boolean(actorId)` as a standard hook pattern. Document in CLAUDE.md.

---

## ERROR / LOADING / EMPTY STATES

| State | Where | How |
|---|---|---|
| Loading (auth init) | `AuthPublicRoute` | `if (loading) return null` — splash screen held via `hideLaunchSplash` |
| Loading (submit) | `LoginScreen` | `loading` boolean → button disabled + text changes to "Logging in…" |
| Email not confirmed | `useLogin` | Special-cased Supabase error message → `setError('Please verify your email…')` |
| Generic auth error | `useLogin` catch | `setError(err?.message \|\| 'Login failed')` |
| Error display | `LoginScreen` | Red banner `role="alert"` with `aria-live="polite"` |
| Email confirmed banner | `LoginScreen` | Green success banner from `location.state.emailConfirmed` |
| Account deleted banner | `LoginScreen` | Amber banner from `location.state.accountDeleted` |
| Empty state | N/A | Not applicable for login |

---

## STATE STORES / CONTEXT

| Store | Type | Scope | Touched During Login |
|---|---|---|---|
| `AuthContext` | React Context (`AuthProvider`) | App-wide | `user`, `loading`, `logout` — read by `AuthPublicRoute` |
| `identityContext` | React Context (`IdentityProvider`) | App-wide | Cleared and resolved post-redirect |
| `identitySelection.store.js` | Zustand | App-wide | Written during actor resolution (post-redirect) |
| `localStorage` | Browser | Persistent | Written only on logout (actor_kind, actor_vport_id, actor_touch) |
| `sessionStorage` | Browser | Session | Debug events only (`vcsm.debug.identity.*`) — cleared on logout |

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Clear entry surface for login | — |
| Owner defined | PASS | Feature folder, hook, controller clearly separated | — |
| Entry points mapped | PASS | `/login` route, `AuthPublicRoute` guard, lazy import | — |
| Controllers present/delegated | PASS | `login.controller.js`, `authSession.controller.js`, `profile.controller.js` | `authSession.controller.js` is a thin pass-through — zero logic added |
| DAL/repository present | PASS | `login.dal.js`, `authSession.read.dal.js`, `profile.dal.js` | — |
| Models/transformers present | PASS | `profile.model.js`, `emailVerification.model.js` | — |
| Hooks/view models present | PASS | `useLogin.js` — owns full submit sequence | — |
| Screens/components present | PASS | `LoginScreen.jsx` | Screen contains local logic that belongs in hook (see boundary warnings) |
| Services/adapters present | PASS | `auth.adapter.js` — correct cross-feature barrel | — |
| Database objects mapped | PASS | All tables traced (see DB map above) | Self-heal path touches engine tables — not owned by this feature |
| Authorization path mapped | PASS | `AuthPublicRoute` → `ProtectedRoute` → `ProfileGatedOutlet` chain | — |
| Cache/runtime behavior mapped | PASS | Supabase client session cache, no TTL cache used | `getSession()` called twice in login path — redundant |
| Error/loading/empty states mapped | PASS | Loading, error, email-not-confirmed, email-confirmed, account-deleted | No loading skeleton — `return null` in `AuthPublicRoute` holds splash |
| Documentation linked | PARTIAL | `vcsm.identity.login-pipeline-trace.md` exists and is comprehensive | This runtime map file is new |
| Tests/validation noted | FAIL | No tests found in `features/auth/` | Zero test coverage |
| Native parity noted | PARTIAL | No native parity file specific to login screen | General native transfer docs exist |
| Engine dependencies mapped | PASS | Identity engine + hydration engine consumed post-redirect | Clearly separated (login screen itself has no engine dependency) |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `supabase.auth` | external API | DAL → Supabase | YES — via DAL files | AuthProvider calls Supabase directly (bypass — see warnings) |
| `engines/identity` | engine | identity.controller → engine | YES — through controller | Post-redirect only |
| `engines/hydration` | engine | hydration (via identity engine) | YES | Consumed by identity engine, not directly |
| `features/legal` | cross-feature | `ProtectedRoute` → `legal.adapter` | YES — via adapter only | Consent gate in protected route |
| `shared/lib/hideLaunchSplash` | shared | Screen/Guard → shared | YES | Correct |
| `shared/lib/iosProdDebugger` | shared | AuthProvider → shared | YES | Correct |
| `state/identity/identityStorage` | internal state | AuthProvider → state | PARTIAL | AuthProvider reaches into `state/identity` — outside auth feature boundary |
| `@debuggers/identity` | dev tool | Hook → debugger | YES — dev only | Dev-only, mapped correctly |
| `@/season` | internal — seasonal | Screen → season module | UNVERIFIED | Not traced to its module boundary |
| `@i18n` | internal — i18n | Screen → i18n | UNVERIFIED | Import alias; boundary not reviewed |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| `auth.users` | write (signIn) | Supabase Auth | `login.dal.js` | LOW — managed by Supabase |
| `public.profiles` | read/write | auth feature | `profile.dal.js` | HIGH — uses `profileId` = `userId` (legacy identity, see warnings) |
| Supabase session | read (cached) | Supabase client | `authSession.read.dal.js` | LOW — standard session read |
| `AuthContext.user` | read | `AuthProvider` | `AuthPublicRoute`, `ProtectedRoute` | LOW — React Context, well-scoped |
| `AuthContext.logout` | invoke | `AuthProvider` | App-wide consumers via `useAuth()` | LOW |
| identity context | read/write | `IdentityProvider` | Entire protected app | MEDIUM — post-redirect identity gap must be handled by all screens |
| `localStorage.actor_*` | write (delete) | `AuthProvider.logout()` | — | LOW — cleanup only |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | `/login` route registered, lazy-loaded | — |
| Loading state | PASS | `AuthPublicRoute` holds splash, button disables on submit | No skeleton — just `null` return |
| Empty state | N/A | Not applicable | — |
| Error state | PASS | Error banner, email-not-confirmed special case | — |
| Auth gate | PASS | `AuthPublicRoute` redirects authenticated users | — |
| Owner gate | N/A | Login is unauthenticated | — |
| Cache behavior | PASS | Session cached by Supabase client | `getSession()` called twice — redundant network skip |
| Runtime dependencies | PASS | Supabase client, React Router | — |
| Hot paths | IDENTIFIED | `signInWithPassword` → `getSession` → `UPDATE profiles` → `navigate` | ~300-800ms normal path |
| Identity gap window | RISK | T6→T35 gap (~200–1500ms) | `/feed` must handle `identity=null, loading=true` |
| iOS install prompt | PASS | Gated behind UA detection, renders as fragment sibling | — |

---

## MODULE BOUNDARY WARNINGS

**WARNING 1 — `AuthProvider.jsx` bypasses DAL layer**

```
MODULE BOUNDARY WARNING
Location: apps/VCSM/src/app/providers/AuthProvider.jsx
Module: auth
Current dependency: AuthProvider calls supabase.auth.getSession() and supabase.auth.onAuthStateChange() directly
Expected boundary: All Supabase access must go through DAL files
Risk: MEDIUM — DAL for session reads exists (authSession.read.dal.js) but is not used here
Suggested correction: Route AuthProvider's getSession() and onAuthStateChange() through authSession.read.dal.js
```

**WARNING 2 — `LoginScreen.jsx` contains logic beyond pure composition**

```
MODULE BOUNDARY WARNING
Location: apps/VCSM/src/features/auth/screens/LoginScreen.jsx
Module: auth
Current dependency: Screen computes canSubmit, navState (useMemo), iOS UA detection (useEffect + useState)
Expected boundary: Screens are pure composition — no computation, no derived state, no effects
Risk: LOW — does not break runtime, but violates layer separation
Suggested correction: Move canSubmit, navState, iOS detection to useLogin hook
```

**WARNING 3 — `profile.controller.js` uses legacy `profileId` / raw `userId`**

```
MODULE BOUNDARY WARNING
Location: apps/VCSM/src/features/auth/controllers/profile.controller.js
Module: auth
Current dependency: ensureProfileDiscoverable(userId) reads/writes public.profiles using userId as profileId
Expected boundary: All domain access must be actor-based via actorId. profileId must not appear in controller or DAL surface.
Risk: HIGH — violates identity contract. Uses pre-actor identity model.
Suggested correction: If profile discoverability must be enforced on login, it should be resolved via actorId, not userId.
CARNAGE handoff: public.profiles.discoverable column — review whether this flag is still needed under the actor model.
```

**WARNING 4 — `authSession.controller.js` adds no value**

```
MODULE BOUNDARY WARNING
Location: apps/VCSM/src/features/auth/controllers/authSession.controller.js
Module: auth
Current dependency: hydrateAuthSession() is a 1-line pass-through to dalHydrateAuthSession() with zero logic
Expected boundary: Controllers own business rules. A controller that only proxies a DAL call is noise.
Risk: LOW — functional but architecturally meaningless. Adds indirection without governance.
Suggested correction: Either add real controller logic here (e.g., session validation, onboarding gate) or collapse into useLogin calling the DAL directly.
```

**WARNING 5 — `getSession()` called twice in login flow**

```
MODULE BOUNDARY WARNING
Location: useLogin.js → authSession.controller.js + profile.controller.js
Module: auth
Current dependency: dalHydrateAuthSession() and dalGetAuthSession() both call supabase.auth.getSession() separately
Expected boundary: A single session read should be shared or passed down, not repeated
Risk: LOW — Supabase client caches this, no extra network round-trip. But it's redundant.
Suggested correction: hydrateAuthSession() returns the session; profile.controller.js should receive it as a parameter rather than fetching it again.
```

**WARNING 6 — `state/identity/identityStorage.js` called from `AuthProvider`**

```
MODULE BOUNDARY WARNING
Location: apps/VCSM/src/app/providers/AuthProvider.jsx
Module: auth (provider layer)
Current dependency: clearAllIdentityStorage() imported from @/state/identity/identityStorage — auth provider reaching into identity state module
Expected boundary: Auth provider should not know the internals of identity state. This should be done via event or adapter.
Risk: LOW — correct behavior, but couples auth provider to identity state module.
Suggested correction: Emit a custom event (e.g. 'auth:signout') that identity state listens to and clears itself.
```

---

## DEAD / UNUSED FILES DISCOVERED

| File | Classification | Evidence | Risk | Action |
|---|---|---|---|---|
| `apps/VCSM/src/features/auth/usecases/index.js` | CONFIRMED DEAD | Contains only `// auto-generated`, no exports | LOW | DELETE CANDIDATE |
| `apps/VCSM/src/features/auth/ui/index.js` | CONFIRMED DEAD | File exists but is empty (0 content) | LOW | DELETE CANDIDATE |
| `apps/VCSM/src/features/auth/styles/registerFormCard.css` | POSSIBLY LEGACY | Referenced only by register flow, not login | LOW | VERIFY USAGE |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Tests / validation | HIGH | Zero test coverage for login submit, error handling, redirect logic | auth feature — unit tests for useLogin |
| Profile discoverability via actor model | HIGH | `profile.controller.js` uses `profileId` (legacy) — contract violation | CARNAGE + VENOM |
| `authSession.controller.js` meaningful logic | LOW | Currently a pass-through — should be consolidated or given real responsibility | IRONMAN |
| Session dedup in login flow | LOW | `getSession()` called twice — pass session down instead | auth feature |
| Loading skeleton for auth route guard | LOW | `AuthPublicRoute` returns null during loading — splash held, but no visual feedback if splash times out | auth feature |
| Native parity doc for login screen | MEDIUM | Login screen exists in PWA — native parity state unknown | FALCON |
| Logan doc for `auth.adapter.js` exports | LOW | Adapter surface not documented as a stable cross-feature contract | LOGAN |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc — login pipeline | `logan/vcsm/identity/vcsm.identity.login-pipeline-trace.md` | PRESENT — comprehensive |
| Logan doc — auth pipeline | `logan/vcsm/identity/vcsm.identity.auth-pipeline.md` | PRESENT |
| Logan doc — email flows | `logan/vcsm/identity/vcsm.identity.email-flows.md` | PRESENT |
| Logan doc — auth module architecture | `logan/marvel/architect/modules/vcsm.auth-login.architecture.md` | PRESENT |
| Logan doc — this runtime map | `logan/marvel/architect/modules/restoredMapvcsm.auth-login.runtime-map.md` | THIS FILE |
| Security audit | — | MISSING |
| Runtime audit (LOKI) | — | MISSING |
| Performance audit (KRAVEN) | — | MISSING |
| Native transfer audit (FALCON) | — | MISSING |
| Engine audit (identity) | `logan/engines/engines.identity.contract.md` | PRESENT — partial |

---

## FINAL MODULE STATUS

**MOSTLY COMPLETE**

The auth-login module has correct layering (DAL → Model → Controller → Hook → Screen), a complete route guard chain, error handling, and a well-documented post-login pipeline. The three blocking issues are: (1) `profile.controller.js` using legacy `profileId` identity instead of actor-based access, (2) `AuthProvider.jsx` bypassing the DAL for session reads, and (3) zero test coverage.

---

## RECOMMENDED HANDOFFS

| Command | Reason |
|---|---|
| **VENOM** | `profile.controller.js` uses raw `userId` as `profileId` — legacy identity trust boundary violation |
| **CARNAGE** | `public.profiles.discoverable` column — is this column still valid under the actor model? |
| **IRONMAN** | `authSession.controller.js` pass-through — assign ownership or collapse |
| **SENTRY** | `AuthProvider.jsx` bypassing DAL for session reads — boundary enforcement |
| **LOKI** | Runtime trace the T6→T35 identity gap — verify all protected screens handle `identity=null` |
| **FALCON** | Native parity audit for login screen (iOS install prompt, PWA-specific logic) |
| **LOGAN** | Document `auth.adapter.js` as stable cross-feature contract surface |

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Fix `profile.controller.js` to use actor-based identity | Contract violation — uses `profileId` = `userId` directly | VENOM + CARNAGE |
| P1 | Route `AuthProvider` session calls through `authSession.read.dal.js` | DAL bypass in provider layer | SENTRY |
| P1 | Add tests for `useLogin.js` and `login.controller.js` | Zero test coverage on login submit path | auth feature |
| P2 | Collapse `authSession.controller.js` or add real logic | Currently meaningless pass-through | IRONMAN |
| P2 | Pass session from `hydrateAuthSession` to `profile.controller` to avoid duplicate `getSession()` | Minor redundancy | auth feature |
| P2 | Move `canSubmit`, `navState`, iOS detection from `LoginScreen` into `useLogin` | Screen layer purity | auth feature |
| P3 | Delete `usecases/index.js` and `ui/index.js` (empty dead files) | Cleanliness | auth feature |
| P3 | Document `auth.adapter.js` in Logan | Missing governance | LOGAN |
