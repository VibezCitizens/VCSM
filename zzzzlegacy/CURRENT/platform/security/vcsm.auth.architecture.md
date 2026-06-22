# MODULE ARCHITECTURE REPORT

**Module:** auth
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Authentication & Identity Bootstrap
**Primary Root:** `apps/VCSM/src/features/auth/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Owns all authentication flows for VCSM: registration, login, password reset, email verification, OAuth callback, actor creation, and profile completion gating. Auth is the entry point for all new users and the guard layer for the entire app. It wires Supabase Auth to the VCSM actor model.

---

## OWNERSHIP

Auth owns: registration, login, logout, password reset, email verification, OAuth callback, actor row creation, actor owner record creation, and profile completion gate. The identity engine consumes auth session output but does not own auth flows.

---

## ENTRY POINTS

- `/login` → `LoginScreen.jsx`
- `/register` → `RegisterScreen.jsx`
- `/forgot-password` → `ForgotPasswordScreen.jsx`
- `/reset-password` → `ResetPasswordScreen.jsx`
- `/verify-email` → `VerifyEmailRequiredScreen.jsx`
- `/auth/callback` → `AuthCallbackScreen.jsx`
- `/onboarding` → `Onboarding.jsx`
- `/welcome` → `WelcomeScreen.jsx`
- `CompleteProfileGate.jsx` — wraps authenticated app routes

---

## LAYER MAP

**DAL:**
- `actorCreate.dal.js` — inserts into `vc.actors`
- `actorGetByProfile.dal.js` — reads actor row by profile id
- `actorOwnerCreate.dal.js` — inserts into `vc.actor_owners`
- `authCallback.dal.js` — exchanges OAuth code for session
- `authSession.read.dal.js` — reads current Supabase session
- `emailVerification.dal.js` — resend verification email
- `login.dal.js` — Supabase signInWithPassword
- `onboarding.dal.js` — reads onboarding state
- `profile.dal.js` — reads/writes user profile record
- `register.dal.js` — Supabase signUp
- `resetPassword.dal.js` — sends reset email + updates password

**Model:**
- `actor.model.js` — shapes raw actor DB row to domain actor
- `emailVerification.model.js` — shapes verification state
- `onboarding.model.js` — shapes onboarding step state
- `profile.model.js` — shapes raw profile to domain profile
- `registerPasswordRules.model.js` — derives password validation rules

**Controller:**
- `authCallback.controller.js` — handles OAuth callback session exchange
- `authOps.controller.js` — wraps login/logout ops
- `authSession.controller.js` — reads and resolves current session
- `completeProfileGate.controller.js` — checks profile completion state
- `createUserActor.controller.js` — creates actor + actor_owner row sequence
- `login.controller.js` — orchestrates login flow
- `onboarding.controller.js` — checks onboarding status
- `profile.controller.js` — reads/writes profile
- `profileOnboarding.controller.js` — combined profile+onboarding check
- `register.controller.js` — orchestrates register + actor creation
- `resendVerification.controller.js` — triggers resend flow
- `sendResetPassword.controller.js` — sends reset email
- `setNewPassword.controller.js` — updates password

**Hook:**
- `useAuthCallback.js` — OAuth callback lifecycle
- `useAuthOnboarding.js` — onboarding check lifecycle
- `useAuthOps.js` — login/logout operations
- `useCompleteProfileGate.js` — profile completion gating
- `useLogin.js` — login form lifecycle
- `useRegister.js` — registration form lifecycle
- `useResendVerification.js` — verification resend lifecycle
- `useResetPassword.js` — reset password lifecycle
- `useSetNewPassword.js` — new password set lifecycle

**Component:**
- `ConsentCheckbox.jsx` — consent toggle UI
- `RegisterFormCard.jsx` — registration form card

**Screen:**
- `AuthCallbackScreen.jsx` — OAuth callback handler
- `CompleteProfileGate.jsx` — profile completion guard
- `ForgotPasswordScreen.jsx` — forgot password entry
- `LoginScreen.jsx` — login form
- `Onboarding.jsx` — onboarding flow
- `RegisterScreen.jsx` — registration form
- `ResetPasswordScreen.jsx` — password reset confirmation
- `VerifyEmailRequiredScreen.jsx` — email verification wall
- `WelcomeScreen.jsx` — post-registration welcome

**Store:** None (reads from identity context, writes via Supabase Auth)

**Engine Consumers:** @identity (session passed upward), @hydration (actor hydrated after creation)

**Adapter:** `auth.adapter.js` — exposes CompleteProfileGate, useAuthOps

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Clear auth ownership | — |
| Owner defined | PASS | Feature isolation confirmed | — |
| Entry points mapped | PASS | 9 screens, all routed | — |
| Controllers present/delegated | PASS | 13 controllers | — |
| DAL/repository present/delegated | PASS | 11 DAL files | — |
| Models/transformers present | PASS | 5 model files | — |
| Hooks/view models present | PASS | 9 hooks | — |
| Screens/components present | PASS | 9 screens + 2 components | — |
| Services/adapters present | PASS | adapter present | — |
| Database objects mapped | PARTIAL | `vc.actors`, `vc.actor_owners`, `public.profiles` touched | RLS assumptions not documented |
| Authorization path mapped | PASS | CompleteProfileGate + session-based | — |
| Cache/runtime behavior mapped | PARTIAL | identityStorage.js in state/ handles caching | Cache bust on logout unclear |
| Error/loading/empty states mapped | PARTIAL | Screens have loading states | Error boundaries not confirmed |
| Documentation linked | FAIL | No Logan doc for auth | — |
| Tests/validation noted | FAIL | No tests present | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | @identity consumed downstream | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `@identity` engine | engine | auth → identity | YES | identity reads auth session |
| `@hydration` engine | engine | auth → hydration (indirect) | YES | actor created, hydrated later |
| `vc.actors` | database | auth writes | YES | createUserActor.controller |
| `vc.actor_owners` | database | auth writes | YES | createUserActor.controller |
| `public.profiles` | database | auth reads/writes | YES | Supabase Auth profiles table |
| `legal` feature | feature | auth → legal (consent gate) | PARTIAL | ConsentCheckbox imported — should be via adapter |
| `state/identity` | state | auth reads session state | PARTIAL | identity context cross-boundary |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| Supabase session | read | Supabase Auth | auth, identity | session token exposure |
| `vc.actors` row | write | auth (creation) | all features | creation without actor_owner = orphaned actor |
| `vc.actor_owners` row | write | auth | ownership checks | must be atomic with actor creation |
| Profile record | read/write | auth | settings, identity | drift if profile/actor desync |
| Actor ID | derived | auth → controller | identity context | must match actor_owners record |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | 9 screens routed | — |
| Loading state | PASS | Screens show loading UI | — |
| Empty state | PASS | N/A for auth flows | — |
| Error state | PARTIAL | Form-level errors present | Global error boundary not confirmed |
| Auth/owner gates | PASS | CompleteProfileGate wraps app | — |
| Cache behavior | PARTIAL | identityStorage in state/ | Logout cache flush path unclear |
| Runtime dependencies | PASS | Supabase, identity engine | — |
| Hot paths | HIGH | Login, register, callback are entry paths | Any latency = blocked users |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| `ui/index.js` empty export | present but empty | LOW | IRONMAN |
| `usecases/index.js` empty | present but empty | LOW | IRONMAN |
| `styles/` folder with authTheme.js | theme object, not CSS — naming inconsistency | LOW | LOGAN |
| `authOps.controller.js` vs `login.controller.js` | overlap unclear | MEDIUM | SENTRY |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | `logan/vcsm/auth/` | MISSING |
| Ownership record | IRONMAN | MISSING |
| Security audit | VENOM | MISSING |
| Runtime audit | LOKI | MISSING |
| Performance audit | KRAVEN | MISSING |
| Migration audit | CARNAGE | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | @identity | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Logan documentation | HIGH | No canonical auth flow docs | LOGAN |
| Security audit of actor creation sequence | HIGH | Actor + actor_owner must be atomic — partial create = ghost account | VENOM |
| Cache flush on logout | HIGH | stale identity cache after logout = security leakage | VENOM |
| Error boundary coverage | MEDIUM | Auth is the entry point — unhandled errors block all users | SENTRY |
| `authOps` vs `login` controller overlap review | MEDIUM | Unclear which owns what | SENTRY |
| Empty `ui/` and `usecases/` folders cleanup | LOW | Folder noise | IRONMAN |

---

## MODULE BOUNDARY WARNINGS

**MODULE BOUNDARY WARNING**
Location: `auth/components/ConsentCheckbox.jsx`
Module: auth
Current dependency: Legal content possibly inline in auth components
Expected boundary: Legal content should come via `legal.adapter.js`
Risk: Medium — if legal consent changes, both modules need updating
Suggested correction: Import consent definitions from legal adapter

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- VENOM (security: actor creation atomicity, logout cache flush)
- LOGAN (documentation: auth flow docs)
- SENTRY (boundary: authOps vs login controller clarification)
- LOKI (runtime: login/register hot path trace)
