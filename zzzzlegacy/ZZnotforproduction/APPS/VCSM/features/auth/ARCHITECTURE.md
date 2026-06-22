---
name: vcsm.auth.architecture
description: ARCHITECT V2 module architecture report for VCSM:auth
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-05
  scanner-version: 1.1.0
  freshness: FRESH
  deep-security-run: TICKET-AUTH-ARCH-001
---

# MODULE ARCHITECTURE REPORT

**Module:** auth
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/auth
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The auth module governs the full Supabase-backed authentication lifecycle for VCSM: registration (including anonymous user upgrade and Wanders-flow mirroring), login, email verification, password reset, post-auth onboarding (display name, username generation, birthdate), and actor + actor_owner creation. It is the platform's identity bootstrap gate — no actor exists in the vc schema until this module's onboarding path completes. It also exposes a CompleteProfileGate screen that blocks access to protected areas until profile completion requirements are satisfied.

## OWNERSHIP

Owned by the VCSM platform team. Auth is a foundational, cross-cutting feature — every other feature depends on a resolved actor identity that this module creates. Primary domain: Supabase Auth + vc.profiles + vc.actors + vc.actor_owners.

## ENTRY POINTS

- `/login` — LoginScreen (email + password sign-in; iOS install prompt; email-confirmed and account-deleted states)
- `/register` — RegisterScreen (email + password registration; anonymous upgrade; Wanders-flow dual-client)
- `/forgot-password` — ForgotPasswordScreen (request password reset email)
- `/reset-password` — ResetPasswordScreen (set new password after recovery token)
- `/auth/callback` — AuthCallbackScreen (handles PKCE code exchange and implicit hash token session resolution after email verification)
- `/onboarding` — Onboarding screen (display name, username, birthdate, sex capture; actor creation)
- `/verify-email` — VerifyEmailRequiredScreen (gate shown before email is confirmed)
- CompleteProfileGate — injected as a wrapper by adapter consumers to guard protected routes until profile is complete

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 31 | actorCreate.dal.js, actorOwnerCreate.dal.js, onboarding.dal.js, profile.dal.js, register.dal.js, login.dal.js, authCallback.dal.js, authSession.read.dal.js, resetPassword.dal.js, emailVerification.dal.js |
| Model | 12 | actor.model.js, onboarding.model.js, profile.model.js, emailVerification.model.js, registerPasswordRules.model.js |
| Controller | 30 | authCallback.controller.js, register.controller.js, login.controller.js, onboarding.controller.js, createUserActor.controller.js, completeProfileGate.controller.js, authOps.controller.js, authSession.controller.js, profileOnboarding.controller.js, profile.controller.js, resendVerification.controller.js, sendResetPassword.controller.js, setNewPassword.controller.js |
| Service | N/A | — |
| Adapter | 1 | auth.adapter.js |
| Hook | 15 | useAuthCallback.js, useLogin.js, useRegister.js, useAuthOnboarding.js, useAuthOps.js, useCompleteProfileGate.js, useResendVerification.js, useResetPassword.js, useSetNewPassword.js |
| Component | 4 | ConsentCheckbox.jsx, RegisterFormCard.jsx |
| Screen | 11 | LoginScreen.jsx, RegisterScreen.jsx, AuthCallbackScreen.jsx, Onboarding.jsx, CompleteProfileGate.jsx, ForgotPasswordScreen.jsx, ResetPasswordScreen.jsx, VerifyEmailRequiredScreen.jsx, WelcomeScreen.jsx |
| Barrel | 7 | index.js (root), ui/index.js, usecases/index.js |

Counts sourced from cg_layerCounts. Style layer: 2 files (authInputClasses.js, authTheme.js, registerFormCard.css).

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Source read + BEHAVIOR.md present (placeholder) | BEHAVIOR.md is a stub — no behavioral spec written |
| Owner defined | PARTIAL | Implied by domain (platform auth team) | No formal ownership record |
| Entry points mapped | PASS | 8 screens mapped — login, register, callback, onboarding, verify-email, forgot-password, reset-password, CompleteProfileGate | Route map shows 0 routes for auth — routes not registered in route-map scanner |
| Controllers present/delegated | PASS | 30 controllers (cg) covering full auth lifecycle | profileOnboarding.controller.js may overlap with onboarding.controller.js |
| DAL/repository present/delegated | PASS | 31 DAL nodes covering actors, profiles, auth session, register, callback, email, reset | profile.dal.js uses userId-scoped SELECT — correct for auth phase pre-actor |
| Models/transformers present | PASS | 12 model nodes — actor, onboarding, profile, emailVerification, passwordRules | registerPasswordRules.model.js not seen in callgraph — may be dead or inlined |
| Hooks/view models present | PASS | 15 hooks covering all screens | — |
| Screens/components present | PASS | 11 screens + 4 components | WelcomeScreen purpose not confirmed in source read |
| Services/adapters present | PASS | auth.adapter.js exposes useAuthOps, authTheme, CompleteProfileGate, VerifyEmailRequiredScreen, ConsentCheckbox, bootstrapJoinOnboardingController, isEmailVerifiedModel | Adapter intentionally minimal — correct pattern |
| Database objects mapped | PASS | vc.actors (create_actor_for_user RPC), vc.actor_owners (upsert), profiles (upsert/update ×4), generate_username RPC | All 7 write surfaces accounted for in scanner |
| Authorization path mapped | PASS | VENOM-AUTH-006 guard: profileId === userId enforced in createUserActor.controller.js; session verified before every onboarding write; Wanders session mirror has userId cross-check | — |
| Cache/runtime behavior mapped | PARTIAL | onAuthStateChange managed in AuthProvider (outside this module); no local cache layer seen in source | AuthProvider location not confirmed in this module's source — dependency is implicit |
| Error/loading/empty states mapped | PASS | LoginScreen: error, loading, emailConfirmed, accountDeleted all handled; useAuthCallback: error state; all controllers return structured {ok, error} objects | — |
| Documentation linked | PARTIAL | BEHAVIOR.md present but is a placeholder stub — no behavioral spec content | BEHAVIOR.md needs full authoring by LOGAN |
| Tests/validation noted | PARTIAL | 1 test: controllers/__tests__/authCallback.controller.test.js | Coverage is very thin for a module this critical — login, register, onboarding, createUserActor all untested |
| Native parity noted | N/A | Web-only PWA; iOS addressed via IosInstallPrompt component on LoginScreen | — |
| Engine dependencies mapped | PASS | identity engine (dalProvisionVcsmIdentity called from ensureVcsmPlatformBootstrap passed into onboarding), profile engine (profile reads/writes) | Engine calls are injected via callback pattern — correct boundary |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/identity | Engine | inbound (injected via ensureVcsmPlatformBootstrap callback) | YES | Not imported directly; caller injects bootstrap fn |
| engines/profile | Engine | inbound (profile reads via DAL) | YES | profiles table is auth-owned in this phase |
| features/wanders (adapter) | Feature cross-dep | register.controller.js imports getWandersSupabase from wanders adapter | NEEDS REVIEW | Direct cross-feature import via adapter — requires verification that wanders exposes this via its own adapter |
| vc.actors | DB table | write | YES | create_actor_for_user RPC |
| vc.actor_owners | DB table | write | YES | upsert |
| profiles (public schema) | DB table | write (upsert/update ×4) | YES | registration, onboarding, discoverable flag |
| generate_username | DB RPC | write | YES | username uniqueness enforced at DB level |
| supabase auth API | External | write (signUp, signIn, signOut, PKCE exchange, password reset) | YES | via supabaseClient service |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| vc.actors | INSERT via RPC create_actor_for_user | auth module | all actor-scoped features | HIGH — idempotent guard in createUserActor.controller.js required; verified present |
| vc.actor_owners | UPSERT | auth module | identity, social, booking, all ownership checks | HIGH — duplicate guard (23505) present in createUserActor.controller.js |
| profiles | UPSERT (registration shell + onboarding complete) | auth module | settings, profiles feature, engines/profile | HIGH — upsert profile shell on register; full upsert on onboarding complete |
| profiles.discoverable | UPDATE | auth module | explore, directory engine | MEDIUM — dalUpdateProfileDiscoverable; called from profile.controller |
| profiles (upsertRegisterProfile) | UPSERT | auth module | registration path | HIGH — called for both new users and anonymous upgrade path |
| generate_username RPC | READ+WRITE | DB (owned by platform) | auth module only | MEDIUM — called during onboarding; uniqueness enforced server-side |
| supabase.auth session | READ | auth module | all authenticated features via AuthProvider | CRITICAL — session is the root trust boundary |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | READY | LoginScreen, RegisterScreen, Onboarding, AuthCallbackScreen all present and have backing hooks | Route-map scanner shows 0 registered routes — scanner may not detect React Router routes defined outside this module |
| Loading state | READY | useLogin, useRegister, useAuthOnboarding all expose loading state; LoginScreen renders conditional button text | — |
| Empty state | READY | No list views in auth — N/A for most screens; VerifyEmailRequiredScreen is the empty-gate pattern | — |
| Error state | READY | LoginScreen renders error div; all controllers return {ok, error} structured result; authCallback controller returns fixed production error strings (BW-LOGIN-002 compliant) | — |
| Auth/owner gates | READY | VENOM-AUTH-006 enforced: profileId === userId in createUserActor; session cross-check in onboarding and bootstrapJoinOnboarding; Wanders session userId cross-check before token mirror | — |
| Cache behavior | PARTIAL | Session managed by Supabase onAuthStateChange in AuthProvider — outside this module; no local cache in auth module | If AuthProvider fails to initialize, auth module has no fallback |
| Runtime dependencies | PARTIAL | Wanders dual-client dependency in register path; ensureVcsmPlatformBootstrap injected from outside | Wanders client failure in register path could abort registration silently |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/auth/BEHAVIOR.md | PRESENT (placeholder stub) |
| Ownership record | — | MISSING |
| Security audit | Inline (VENOM-AUTH-003, VENOM-AUTH-006, BW-LOGIN-002 referenced in source) | PARTIAL — inline comments only, no formal audit doc |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a placeholder stub | HIGH | Auth is a critical trust boundary — behavioral spec should document happy paths, error flows, session states, and security invariants | LOGAN |
| Test coverage: only 1 test file | HIGH | register, login, createUserActor, onboarding, completeProfileGate — all untested; auth failures are P0 incidents | SPIDER-MAN |
| CURRENT_STATUS.md | LOW | Governance gap — being created this run | ARCHITECT |
| Wanders cross-feature import review | MEDIUM | register.controller.js imports getWandersSupabase directly from features/wanders — needs adapter boundary verification | VENOM / HAWKEYE |
| Route registration not detected by scanner | LOW | Scanner shows 0 routes for auth — React Router routes likely defined in app/router layer, not in feature; should be confirmed and documented | IRONMAN |
| Security audit doc | MEDIUM | Inline VENOM/BW finding references in source but no consolidated security audit document for the module | VENOM / ELEKTRA |

---

## MODULE BOUNDARY WARNINGS

1. **Wanders cross-feature import:** `register.controller.js` imports `getWandersSupabase` from `@/features/wanders/adapters/services/wandersSupabaseClient.adapter`. This is a cross-feature DAL-adjacent dependency. It references the wanders adapter path directly rather than going through a public wanders adapter barrel. This boundary needs verification — wanders adapter must expose this function publicly, and the import must not bypass adapter isolation rules.

2. **ensureVcsmPlatformBootstrap injected as callback:** The identity engine bootstrap is passed as a callback function into `onboarding.controller.js` and `bootstrapJoinOnboardingController`. This is an approved inversion-of-control pattern (avoids direct engine import) but requires callers to always inject it — if a caller forgets, actor creation succeeds but identity directory row is never created.

---

## SPAGHETTI SCORE

**Module:** auth
**Score:** WATCH
**Reasons:** 56 source files with 30 controllers and 31 DAL nodes is large for a feature module; the Wanders dual-client path in register.controller.js introduces cross-feature coupling; callgraph shows significant expansion (cg vs fm counts) suggesting re-export chains or barrel inflation. Core architecture is clean — DAL → Controller → Hook → Screen layers are consistently respected. Security guards are present and correct.
**Release risk:** MEDIUM — thin test coverage on a P0-criticality module is the primary risk.

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no behavioral spec written; stub only

**Check A (Source without behavior):** PASS — source exists; BEHAVIOR.md exists (stub)
**Check B (Behavior without source):** INCONCLUSIVE — BEHAVIOR.md has no happy paths documented to compare against source
**Check C (§13 engine consistency):** Scanner declares engines: [identity, profile]. Source confirms: identity bootstrap injected via callback in onboarding.controller.js; profile engine via profiles table DAL writes. Consistent.
**Check D (§6 data change consistency):** Scanner write surfaces (7): create_actor_for_user RPC, vc.actor_owners upsert, generate_username RPC, profiles upsert ×2, profiles update (discoverable), profiles upsert (register). All confirmed present in source reads. Consistent.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Author BEHAVIOR.md behavioral spec | Auth is the trust root — the spec stub is a governance gap for a security-sensitive module | LOGAN |
| P1 | Add test coverage for register, login, onboarding, createUserActor | 1 test for 56-file module is dangerously thin; auth failures are P0 | SPIDER-MAN |
| P2 | Verify Wanders cross-feature import boundary | register.controller.js direct wanders adapter import may violate isolation rules | VENOM / HAWKEYE |
| P3 | Write security audit doc (consolidate VENOM/BW inline findings) | VENOM-AUTH-003, VENOM-AUTH-006, BW-LOGIN-002 are inline only — no formal audit doc | ELEKTRA |

## SESSION SECURITY — TICKET-AUTH-ARCH-001 (2026-06-05)

Deep security audit completed. Three findings requiring remediation:

| Finding | Severity | File | Fix |
|---|---|---|---|
| `globalThis.__SB_CLIENT__` exposes primary Supabase client to XSS | CRITICAL | `services/supabase/supabaseClient.js` | Replace with module-scoped `let _client = null` pattern (same as Wanders client) |
| `signOut()` called AFTER `navigate('/login')` — failure leaves `sb-auth-main` in localStorage | HIGH | `app/providers/AuthProvider.jsx` | Add `localStorage.removeItem('sb-auth-main')` to signOut catch block |
| Dead `globalThis?.__WANDERS_SB__` reference in upload path | MEDIUM | `services/cloudflare/uploadToCloudflare.js` | Remove dead branch — Wanders client is never on globalThis |

Full report: `outputs/2026/06/05/ARCHITECT/ARCHITECT-AUTH-DEEP-001.md`

---

## RECOMMENDED HANDOFFS

- **LOGAN** — Author BEHAVIOR.md (currently a placeholder stub for a trust-critical module)
- **SPIDER-MAN** — Add test coverage: register flow, login flow, onboarding controller, createUserActor controller
- **VENOM** — Review Wanders dual-client cross-feature import in register.controller.js
- **ELEKTRA** — Consolidate inline security finding references into a formal module security audit doc
- **HAWKEYE** — Confirm route registration for auth screens in the app router layer (scanner shows 0 routes)

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
