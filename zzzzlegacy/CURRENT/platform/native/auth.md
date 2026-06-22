# Module: Auth callback / PKCE / session restore

## PWA Source of Truth

**Routes:** `/login`, `/register`, `/reset`, `/auth/callback`, `/verify-email`, `/welcome`

**Screens/components:**
- `apps/VCSM/src/features/auth/screens/WelcomeScreen.jsx`
- `apps/VCSM/src/app/providers/AuthProvider.jsx`
- `apps/VCSM/src/features/legal/screens/*`

**Services/DAL:**
- `apps/VCSM/src/features/auth/*`
- `apps/VCSM/src/features/legal/dal/*`
- `apps/VCSM/src/features/legal/engine/legalCompliance.engine.js`

**Supabase schema/tables/RPCs:**
- `auth session`
- `platform.legal_documents`
- `platform.user_consents`
- `platform.apps`

**RLS expectations:** Authenticated session must be restored before protected routes; legal consent reads/writes must stay RLS-compatible and must not fail open.

**Current PWA status:** Complete — includes dedicated WelcomeScreen, full PKCE auth callback, and legal consent flow.

---

## Native Transfer Status

**Status:** `Risky`

---

## Transferred Native Files

- `VCSMNativeApp/Features/Auth/LoginView.swift`
- `VCSMNativeApp/Features/Auth/RegisterView.swift`
- `VCSMNativeApp/Features/Auth/ResetPasswordView.swift`
- `VCSMNativeApp/Features/Auth/VerifyEmailScreen.swift`
- `VCSMNativeApp/Features/Auth/WelcomeScreen.swift`
- `VCSMNativeApp/Services/Auth/LiveAuthService.swift`
- `VCSMNativeApp/Session/SessionStore.swift`
- `VCSMNativeApp/VCSMNativeApp.entitlements`
- `VCSMNativeApp/Navigation/AppRouteParser.swift`

---

## Native Behavior Currently Present

- Login/register/reset/verify screens exist.
- SessionStore persists and restores session state.
- Associated domains present for `vibezcitizens.com` and `www.vibezcitizens.com`.
- Legal document metadata and `user_consents` handled through `platform` schema.
- Reset/recovery now generates a native PKCE verifier, stores it locally, sends `code_challenge` / `s256`, and reuses the stored verifier during callback exchange.
- Legal gate resolution errors now return to signed-out state with retry messaging instead of entering signed-in runtime state.

---

## Native Gaps

- No `ASWebAuthenticationSession` usage was found.
- PKCE verifier persistence is build-verified for reset/recovery callbacks, but device/runtime callback regression is not yet tested.
- Legal gate now fails signed-out on gate errors; live policy outage/session restore regression is not yet tested.

---

## Risk Notes

- `LiveAuthService.swift:82-99` generates and persists a PKCE verifier before reset/recovery; `:433-440` exchanges with URL or stored verifier and clears the stored value after exchange.
- `SessionStore.swift:365-390` signs out with retry messaging when legal gate resolution throws.
- `AppRouteParser.swift:65-67` documents `/welcome` mapping into onboarding.

---

## Pending Transfer Checklist

- [x] Persist native PKCE verifier locally before auth/reset callback exchange.
- [ ] Add or wire `ASWebAuthenticationSession` / deep-link callback handling for production auth.
- [x] Dedicated native Welcome screen implemented (`WelcomeScreen.swift`). Auto-shown after onboarding via `showsWelcomeAfterOnboarding` flag.
- [x] Change legal gate error behavior from fail-open to explicit retry/block state.
- [ ] Regression test: login, register, reset deep link, verify email, kill/relaunch session restore.

---

## PWA → Native Transfer Log

### 2026-05-03 — P0 native transfer start

- Date: 2026-05-03
- Change type: Fix
- PWA files changed: none — transfer from existing PWA source of truth
- Routes affected: `/auth/callback`, `/reset`, `/reset-confirm`, protected app bootstrap
- Screens/components changed: none planned
- Services/DAL changed: `LiveAuthService.swift`, `SessionStore.swift`, Supabase auth request models
- Behavior change: persist PKCE verifier for recovery callback exchange and fail closed when legal gate resolution errors
- Supabase schema/RPC change: Supabase Auth recovery/exchange; `platform.legal_documents`; `platform.user_consents`; `platform.apps`
- RLS expectations changed: no
- Affected native modules: Auth, platform schema
- Priority: P0
- Native status: Risky — build verified
- Testing notes: `swift build --package-path native/VCSMNativeCore` passed; `xcodebuild -project native/VCSMNativeApp/VCSMNativeApp.xcodeproj -scheme VCSMNativeApp -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build` passed. Runtime auth/deep-link regression not yet run.
- Notes: Build-verified implementation does not bypass legal consent or admit signed-in runtime state when legal gate cannot be resolved.

### 2026-05-03 — Welcome screen implemented

- Date: 2026-05-03
- Change type: Feature / UI
- PWA files changed: none
- Routes affected: `/welcome`
- Screens/components changed: `WelcomeScreen.swift` (new), `AppNavigationView.swift` (destination + auto-push), `AppRouteParser.swift` (`/welcome` → `.welcome`), `SessionStore.swift` (`showsWelcomeAfterOnboarding` flag)
- Services/DAL changed: none
- Behavior change: `/welcome` now routes to a dedicated welcome screen with three action cards (complete profile, create VPORT, explore). Auto-shown on feed tab after onboarding completes.
- Supabase schema/RPC change: none
- RLS expectations changed: no
- Affected native modules: Auth
- Priority: P1
- Native status: Risky — welcome screen implemented, runtime onboarding→welcome flow testing pending
- Testing notes: Xcode diagnostics zero issues. Runtime test needed for post-onboarding auto-show.
- Notes: Matches PWA WelcomeScreen.jsx three-card layout. `NativeAppRoute.welcome` added.

---

## Transfer History

- Last synced date: 2026-05-03
- Native files updated: `LiveAuthService.swift`, `SessionStore.swift`, `SupabaseClient.swift`, `WelcomeScreen.swift` (new), `AppNavigationView.swift`, `AppRouteParser.swift`
- Delta status: Risky — PKCE persistence, legal gate fail-closed, and welcome screen are build-verified; production callback handling and auth regression testing remain open
- Notes: P0 batch build-verified May 3. Welcome screen added as P1 feature same day.

---

## Archived Notes

No archived notes yet.
