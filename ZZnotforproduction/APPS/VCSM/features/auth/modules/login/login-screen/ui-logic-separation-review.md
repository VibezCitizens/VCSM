# UI / Logic / Business Separation Review

**Ticket:** TICKET-UI-ARCH-REVIEW-0001
**Project:** `/Users/vcsm/Desktop/VCSM/apps/VCSM`
**Mode:** READ ONLY — no code was modified
**Date:** 2026-06-05
**Reviewer:** Senior Frontend Architecture Audit

---

## Executive Summary

**Overall Rating: MOSTLY CLEAN**

The auth feature has a correct, consistently-enforced 4-layer stack across all auth
screens. No Supabase calls exist in any `.jsx` component file anywhere in the auth
feature tree. The DAL boundary holds. The login screen is clean with one low-severity
structural note. Three isolated violations exist in adjacent files.

---

## Architecture Map

```
LoginScreen.jsx            ← UI Screen (rendering only)
  │
  └─ useLogin(navigate, location)   ← Hook (state + orchestration)
        │
        ├─ signInWithPassword()     ← Controller (business rules, error shaping)
        │     └─ dalSignInWithPassword()   ← DAL (supabase.auth.signInWithPassword)
        │
        ├─ hydrateAuthSession()     ← Controller (thin pass-through)
        │     └─ dalHydrateAuthSession()   ← DAL (supabase.auth.getSession)
        │
        └─ ensureProfileDiscoverable()   ← Controller (profile business rule)
              ├─ dalGetProfileDiscoverable()
              └─ dalUpdateProfileDiscoverable()

AuthProvider.jsx           ← Context Provider (session hydration + state)
  │
  ├─ dalHydrateAuthSession()        ← DAL (correct)
  ├─ dalSubscribeAuthStateChange()  ← DAL (correct)
  └─ supabase.auth.signOut()        ← DIRECT CALL (violation — see F-01)

ProtectedRoute.jsx         ← Route Guard (reads AuthContext only, no DAL)
AuthPublicRoute.jsx        ← Route Guard (reads AuthContext only, no DAL)
ProfileGatedOutlet.jsx     ← Route Guard (adapter pattern, clean)
```

---

## Login Screen Review

| Layer | File | Notes |
|---|---|---|
| Route | `/login` via `auth.routes.jsx` | Wrapped in `AuthPublicRoute` — redirects to `/feed` if already authed |
| Page/Screen | `screens/LoginScreen.jsx` | Renders form, reads hook state, no logic |
| Form | Inline in `LoginScreen.jsx` | No separate form component — acceptable at this screen size |
| Hook | `hooks/useLogin.js` | Owns all form state, orchestration, nav decision |
| Controller | `controllers/login.controller.js` | `signInWithPassword` — shapes/throws errors, strips tokens |
| Controller | `controllers/authSession.controller.js` | `hydrateAuthSession` — thin pass-through |
| Controller | `controllers/profile.controller.js` | `ensureProfileDiscoverable` — post-auth profile rule |
| DAL | `dal/login.dal.js` | `dalSignInWithPassword`, `dalGetAuthUser`, `dalSignOut` |
| DAL | `dal/authSession.read.dal.js` | `dalHydrateAuthSession`, `dalGetAuthSession`, `dalSubscribeAuthStateChange` |
| DAL | `dal/profile.dal.js` | `dalGetProfileDiscoverable`, `dalUpdateProfileDiscoverable` |

### Submit Flow

```
User submits form
  → onSubmit(e) in LoginScreen [UI — just calls hook]
  → handleLogin(e) in useLogin [Hook]
      → e.preventDefault() + loading state
      → Promise.race(signInWithPassword, 15s timeout) [Controller]
          → dalSignInWithPassword() [DAL → supabase.auth.signInWithPassword]
      → hydrateAuthSession() [Controller → DAL]
      → ensureProfileDiscoverable(userId) [Controller → DAL]
      → resolve destination from location.state.from
      → navigate(dest, { replace: true })
  ← success: user lands on /feed (or original destination)
  ← error: setError(message) — rendered by LoginScreen
```

### Error Handling Flow

- All errors thrown by controllers — hook catches in `catch(err)`
- `isEmailNotConfirmedError(err)` check at hook level — maps to user-facing message
- Generic fallback: `err?.message || 'Login failed'`
- UI renders `error` string — no error logic in JSX

### Navigation Flow

- Destination resolved in `useLogin` (not in screen) — clean
- `navigate` function passed in from screen as parameter — see F-04 (info)
- Blocked destinations (`/login`, `/register`, `/reset`, `/forgot-password`) filtered in hook

---

## Findings

### [MEDIUM] F-01 — AuthProvider calls supabase directly in logout()

**File:** `src/app/providers/AuthProvider.jsx:202,213`

**Evidence:**
```js
await supabase.auth.signOut({ scope: 'local' })           // line 202
supabase.getChannels?.().forEach((ch) => supabase.removeChannel(ch))  // line 213
```

**Why it matters:** The provider imports `supabase` directly and calls it without going
through a DAL. The `dalSignOut()` function already exists in `dal/login.dal.js` but
wraps `supabase.auth.signOut()` with no `scope` parameter, so the provider bypasses it
to pass `{ scope: 'local' }`. The channel cleanup has no DAL wrapper at all.

The `logout()` function is otherwise well-structured (optimistic state clear, storage
eviction, channel cleanup, fallback key removal). The violation is shallow — one call
depth away from being clean.

**Recommended fix:**
1. Add `scope` param to `dalSignOut` in `login.dal.js`:
   `export async function dalSignOut(scope = 'global') { return supabase.auth.signOut({ scope }) }`
2. Replace line 202 with `await dalSignOut('local')`
3. Add `dalRemoveAllChannels()` to a new `dal/channels.dal.js` or the supabase client module
4. Remove `import { supabase }` from `AuthProvider.jsx`

**Refactor risk:** Low. One-line change per call. No behavior change.

---

### [LOW] F-02 — iOS install detection logic embedded in LoginScreen

**File:** `src/features/auth/screens/LoginScreen.jsx:58-82`

**Evidence:**
```js
const [canShowInstall, setCanShowInstall] = useState(false)
const [showInstall, setShowInstall] = useState(false)

useEffect(() => {
  try {
    const ua = (navigator.userAgent || '').toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(ua)
    const isSafari = isIOS && ua.includes('safari') && ...
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ...
    if (isIOS && isSafari && !isStandalone) setCanShowInstall(true)
  } catch {}
}, [])
```

**Why it matters:** Platform detection — `navigator.userAgent`, `window.matchMedia`,
`navigator.standalone` — is business/platform logic embedded inside a screen component.
The screen now owns both rendering and the platform detection decision. This logic is
not reusable across other screens without copy-paste.

A hook `useIOSInstallPromptVisibility()` already partially exists at
`src/app/platform/ios/useIOSPlatform.js` — the detection may duplicate that hook's work.

**Recommended fix:**
1. Extract into `src/app/platform/ios/useIOSInstallVisibility.js`
2. Return `{ canShow, show, dismiss }` 
3. Import in `LoginScreen` — reduces screen to 3 lines for this feature

**Refactor risk:** Low. Pure extraction with no logic change.

---

### [LOW] F-03 — sessionStorage writes inside public-facing screen components

**Files:**
- `src/features/legal/screens/HowToCreateProfileScreen.jsx:30`
- `src/features/legal/screens/VportCategoryLandingScreen.jsx:66`

**Evidence:**
```js
// HowToCreateProfileScreen.jsx
try { sessionStorage.setItem("vcsm_funnel_source", "how_to_profile"); } catch { }

// VportCategoryLandingScreen.jsx
try { sessionStorage.setItem('vcsm_funnel_source', `vport_${content.type}`) } catch { }
```

**Why it matters:** Screens should not own storage side-effects. The funnel tracking key
`vcsm_funnel_source` is written directly in JSX screen components, which means the
tracking logic is invisible to any centralized telemetry or analytics layer, and cannot
be tested without rendering the full component.

**Recommended fix:**
1. Create `src/features/analytics/funnelSource.js` (or add to existing analytics layer)
2. Export `setFunnelSource(key)` — wraps the sessionStorage write
3. Call from a `useEffect` in a custom hook, or from an existing analytics hook

**Refactor risk:** Low. Pure extraction.

---

### [INFO] F-04 — useLogin receives navigate and location as parameters

**Files:** `src/features/auth/screens/LoginScreen.jsx:33`, `src/features/auth/hooks/useLogin.js:14,84`

**Evidence:**
```js
// LoginScreen.jsx
const navigate = useNavigate()
const { handleLogin } = useLogin(navigate, location)

// useLogin.js
export function useLogin(navigate, location) {
  ...
  navigate(dest, { replace: true })
}
```

**Why it matters:** The hook is routing-aware by design — it makes the navigation
decision (resolving `dest`, filtering blocked routes). Passing `navigate` as a parameter
instead of calling `useNavigate()` inside the hook is a valid architectural choice: it
makes the navigation dependency explicit and injectable (testable without a router).
However, it means the screen component owns the `navigate` reference and the hook's
routing behavior is invisible from the screen side.

This is a style/testability preference, not a logic-in-UI violation. The routing
*decision* is correctly in the hook.

**Options:**
- Keep as-is (explicit injection — easier to mock in unit tests)
- Call `useNavigate()` inside `useLogin` directly (hook is self-contained)

Either is acceptable. No change required.

---

## Layer Violation Table

| File | Current Role | Violation | Recommended Layer | Severity |
|---|---|---|---|---|
| `app/providers/AuthProvider.jsx` | Provider | Direct `supabase.auth.signOut()` call in `logout()` | Route through DAL | Medium |
| `app/providers/AuthProvider.jsx` | Provider | Direct `supabase.getChannels()` in `logout()` | Route through DAL | Medium |
| `features/legal/screens/HowToCreateProfileScreen.jsx` | UI Screen | `sessionStorage.setItem()` inline | Analytics hook or service | Low |
| `features/legal/screens/VportCategoryLandingScreen.jsx` | UI Screen | `sessionStorage.setItem()` inline | Analytics hook or service | Low |
| `features/auth/screens/LoginScreen.jsx` | UI Screen | iOS platform detection `useEffect` with UA/matchMedia | Platform hook | Low |
| `features/profiles/screens/ActorProfileScreen.jsx` | UI Screen | `localStorage.getItem("__vcsm_dbg")` | Dev utility hook | Info |

---

## Good Patterns Found

| File | Why It's Correct |
|---|---|
| `screens/LoginScreen.jsx` | Zero supabase, zero business logic, delegates entirely to `useLogin` |
| `screens/RegisterScreen.jsx` | Screen is a wiring file — hook + form component, nothing else |
| `screens/ForgotPasswordScreen.jsx` | Clean delegation to `useResetPassword` hook |
| `screens/AuthCallbackScreen.jsx` | 43 lines total — screen, hook call, render. Perfect |
| `screens/WelcomeScreen.jsx` | Pure presentation — `useMemo`, `Link`, no side effects |
| `screens/CompleteProfileGate.jsx` | Delegates gate logic to hook, renders result |
| `hooks/useLogin.js` | Orchestrates auth flow, never touches supabase directly |
| `hooks/useCompleteProfileGate.js` | Hook calls controller — correct layer boundary |
| `controllers/login.controller.js` | Shapes data, throws errors, calls DAL only |
| `controllers/setNewPassword.controller.js` | Handles sessionStorage at controller level, not UI |
| `dal/login.dal.js` | Single responsibility — supabase.auth calls only |
| `dal/authSession.read.dal.js` | Correct DAL — supabase session calls isolated here |
| `controllers/profile.controller.js` | Post-auth profile business rule in controller, not hook |
| `app/guards/ProtectedRoute.jsx` | Reads context only — no DAL, no supabase |
| `app/guards/AuthPublicRoute.jsx` | Reads context only — no DAL, no supabase |
| `app/guards/ProfileGatedOutlet.jsx` | Uses adapter pattern to import `CompleteProfileGate` |
| `adapters/auth.adapter.js` | Exposes only hooks, screens, and models — never DAL or controllers |

---

## Risk Areas

**1. AuthProvider growth** — `AuthProvider.jsx` is 232 lines and handles session
hydration, auth state subscription, recovery flag management, logout orchestration,
storage cleanup, and channel teardown. It will continue to grow. As it grows it will
absorb more direct supabase calls unless the DAL boundary is enforced here.

**2. Funnel/analytics tracking** — The two `sessionStorage.setItem` calls in legal
screens suggest there is no centralized analytics write layer. More tracking writes will
appear inline in other screens over time. Establish `setFunnelSource()` now before this
pattern spreads.

**3. useLogin routing awareness** — If the login flow needs to handle more post-auth
destinations (e.g., deep-link recovery, app scheme routing), the routing logic in
`useLogin` will grow. At that point it may warrant a dedicated `resolveLoginDestination`
controller function to keep the hook slim.

**4. iOS platform detection** — `LoginScreen` has UA/matchMedia detection. If this
pattern is repeated in other screens (e.g., install prompt on `/register` or `/feed`),
there will be duplicated platform detection code. The existing
`src/app/platform/ios/useIOSPlatform.js` should be the single source of truth.

---

## Recommended Refactor Plan

### Phase 1 — Enforce DAL boundary in AuthProvider (Medium finding)

1. Update `dal/login.dal.js` — add `scope` param to `dalSignOut`
2. Add channel cleanup to `services/supabase/supabaseClient.js` or a new `channels.dal.js`
3. Remove direct `supabase` import from `AuthProvider.jsx`
4. Route through DAL only

Estimated scope: 2 files changed, ~6 lines total.

### Phase 2 — Extract iOS detection out of LoginScreen (Low finding)

1. Create `src/app/platform/ios/useIOSInstallVisibility.js`
2. Consolidate with existing `useIOSPlatform.js` if overlap exists
3. Import in `LoginScreen` — replaces 25-line `useEffect` block

Estimated scope: 1 new file, 1 file changed.

### Phase 3 — Centralize funnel source writes (Low finding)

1. Create `src/features/analytics/funnelSource.js` — exports `setFunnelSource(key)`
2. Update `HowToCreateProfileScreen` and `VportCategoryLandingScreen`

Estimated scope: 1 new file, 2 files changed.

### Phase 4 — (Optional) Extract login destination logic to controller

Only if routing logic in `useLogin` grows beyond current scope.
Move `resolveLoginDestination(location)` → `login.controller.js`.

### Phase 5 — Add controller-level tests

Controllers and DAL are now isolated enough to test without rendering:
- `signInWithPassword` — test error shaping, token stripping
- `ensureProfileDiscoverable` — test conditional update logic
- `resolveRecoverySessionController` — test code/nonce/TTL paths (already well-structured)

---

## Final Recommendation

| Question | Answer |
|---|---|
| Are UI components separated from logic? | **Yes.** All screens delegate to hooks. No business logic in JSX. |
| Are business rules separated? | **Yes.** Controllers hold rules — error shaping, profile discovery, recovery nonce validation. |
| Are Supabase calls isolated to DAL? | **Mostly.** 2 direct calls remain in `AuthProvider.logout()` — the only exception in the entire auth feature. |
| Is the login screen clean? | **Yes.** The login screen is among the cleanest in the codebase. |
| What should be fixed first? | **F-01** — remove the 2 direct supabase calls from `AuthProvider.logout()`. All other findings are low/info. |

The architecture enforces the build order `DAL → Model → Controller → Hook → Screen`
correctly across all auth screens. The pattern is consistent and repeatable. The three
findings above are surgical — none require structural changes.
