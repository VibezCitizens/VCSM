---
name: vcsm.auth.verify-email.architecture
description: ARCHITECT module architecture report for VCSM auth/verify-email — 2026-06-06
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-06
  freshness: FRESH
  scan-type: targeted (Area 3 + Area 6 + Area 9)
  parent-feature: auth
---

# MODULE ARCHITECTURE REPORT

**Module:** verify-email
**Application Scope:** VCSM
**Module Type:** feature sub-module (auth)
**Primary Root:** apps/VCSM/src/features/auth
**Independence Status:** DEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The verify-email module handles the post-registration email confirmation gate for VCSM. It serves two distinct rendering contexts:

**Context A — Public route (`/verify-email`):**
User has just registered but not yet confirmed their email. No active session. Email address sourced from `location.state.email` (navigation state from RegisterScreen). A 4-second countdown auto-redirects to `/login`. User may resend the confirmation email if an email is available.

**Context B — ProtectedRoute inline gate:**
User IS authenticated (session exists) but `user.email_confirmed_at` is null or empty. ProtectedRoute renders `VerifyEmailRequiredScreen` inline as a blocking gate instead of allowing access to the protected app shell. Email sourced from `user.email` prop passed by ProtectedRoute.

The `isEmailVerifiedModel` function is also consumed externally by ProtectedRoute to determine when to show the gate.

---

## OWNERSHIP

Sub-module of auth feature. Owned by VCSM platform team. Cross-cutting dependency: ProtectedRoute consumes `useEmailVerified` and `VerifyEmailRequiredScreen` from `auth.adapter.js`.

---

## ENTRY POINTS

| Route / Context | Screen | Access | Notes |
|---|---|---|---|
| `/verify-email` | VerifyEmailRequiredScreen | public (AuthPublicRoute) | No session — email from location.state |
| ProtectedRoute gate (no route) | VerifyEmailRequiredScreen | authenticated-unverified | Session exists — email from user.email prop |

**Route classification note:** `/verify-email` is wrapped in `AuthPublicRoute`, which redirects `user !== null` to `/feed`. An authenticated user who navigates directly to `/verify-email` will be sent to `/feed`, where ProtectedRoute picks up the unverified state and renders the screen inline. This is circular but non-looping — functionally correct.

---

## LAYER MAP

| Layer | Files | Notes |
|---|---|---|
| Screen | screens/VerifyEmailRequiredScreen.jsx | Shared across both rendering contexts; email input is prop or location.state |
| Hook (resend) | hooks/useResendVerification.js | Manages resend flow: loading / sent / error state |
| Hook (gate check) | hooks/useEmailVerified.js | Thin wrapper over isEmailVerifiedModel — consumed by ProtectedRoute |
| Controller | controllers/resendVerification.controller.js | Validates email presence, delegates to DAL |
| DAL | dal/emailVerification.dal.js | supabase.auth.resend({ type: 'signup', email }) — no session required |
| Model | model/emailVerification.model.js | isEmailVerifiedModel(user) → Boolean(user.email_confirmed_at) |
| Adapter exports | adapters/auth.adapter.js | Exports VerifyEmailRequiredScreen + useEmailVerified |

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Source read — dual context confirmed | — |
| Owner defined | PARTIAL | Implied (platform auth team) | No formal OWNERSHIP.md entry |
| Entry points mapped | PASS | /verify-email (public route) + ProtectedRoute inline | Dual-context render not documented in module-level BEHAVIOR.md |
| Controllers present/delegated | PASS | resendVerification.controller.js — email presence validation + DAL delegation | — |
| DAL/repository present/delegated | PASS | emailVerification.dal.js — unauthenticated resend call | — |
| Models/transformers present | PASS | emailVerification.model.js — reads email_confirmed_at | — |
| Hooks/view models present | PASS | useResendVerification (resend flow), useEmailVerified (gate check) | — |
| Screens/components present | PASS | VerifyEmailRequiredScreen.jsx confirmed | — |
| Services/adapters present | PASS | auth.adapter.js exports both public surfaces | — |
| Database objects mapped | PASS | No direct DB reads or writes — supabase.auth.resend is auth API only | — |
| Authorization path mapped | PASS | resend DAL requires no session (correct for Context A); isEmailVerifiedModel reads from AuthProvider-managed user object | — |
| Cache/runtime behavior mapped | PARTIAL | user.email_confirmed_at is read from AuthProvider's in-memory user state; no live DB query on this screen | If AuthProvider hydration is stale, email_confirmed_at may lag reality |
| Error/loading/empty states mapped | PASS | useResendVerification: loading/sent/error states; screen renders conditionally per state | Countdown redirect fires regardless of loading state — see FINDING-002 |
| Documentation linked | FAIL | No BEHAVIOR.md exists for this module | Module BEHAVIOR.md being created this run — stub only |
| Tests/validation noted | FAIL | No tests for useResendVerification, resendVerification.controller.js, emailVerification.dal.js, isEmailVerifiedModel | Critical auth path with 0 test coverage |
| Native parity noted | N/A | Web PWA only | — |
| Engine dependencies mapped | N/A | No engine dependencies | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| supabase.auth (resend) | External API | outbound | YES | No session required; rate-limited by Supabase |
| AuthProvider (user object) | Runtime | inbound (via useAuth context) | YES | isEmailVerifiedModel reads user.email_confirmed_at from AuthProvider state |
| auth.adapter.js | Adapter | outbound (consumer) | YES | ProtectedRoute imports VerifyEmailRequiredScreen + useEmailVerified via adapter |
| ProtectedRoute (consumer) | Guard | inbound | YES | Not an import — adapter consumer; correct boundary |
| features/monitoring | Service | outbound | YES | captureFrontendError in useResendVerification |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| user.email_confirmed_at | read (in-memory) | Supabase Auth (via AuthProvider) | isEmailVerifiedModel | LOW — read-only, sourced from AuthProvider; no forgery risk in gate check |
| email (location.state) | read (navigation state) | RegisterScreen (caller) | VerifyEmailRequiredScreen | LOW — used for display and resend only; no session dependency |
| email (user.email prop) | read (prop) | ProtectedRoute (injected from user object) | VerifyEmailRequiredScreen | LOW — read-only display + resend |
| supabase.auth.resend | write (auth API) | Supabase Auth | emailVerification.dal.js | MEDIUM — unauthenticated endpoint; email enumeration risk |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | READY | /verify-email registered in auth.routes.jsx wrapped in AuthPublicRoute | — |
| Loading state | READY | useResendVerification exposes loading; button disabled during loading | — |
| Empty state | READY | When email is null: no display block, no resend button, only countdown | Low — user can only wait 4s to redirect to login |
| Error state | READY | useResendVerification error state renders alert div | — |
| Auth/owner gates | READY | No auth required for resend (correct); isEmailVerifiedModel gate in ProtectedRoute | — |
| Cache behavior | PARTIAL | email_confirmed_at from AuthProvider memory — no live DB poll on screen | MEDIUM — post-verification state change requires new auth event to propagate (AuthProvider onAuthStateChange fires after callback redirect; not relevant on this screen) |
| Countdown behavior | RISK | 4-second countdown fires navigate('/login') on mount regardless of resend state | MEDIUM — user clicking resend gets redirected 4s after mount; see FINDING-002 |

---

## ARCHITECTURAL FINDINGS

### FINDING-001 — DUAL_CONTEXT_UNDOCUMENTED [MEDIUM / GOVERNANCE]

**Location:** screens/VerifyEmailRequiredScreen.jsx + app/guards/ProtectedRoute.jsx
**Issue:** VerifyEmailRequiredScreen renders in two functionally distinct contexts that are not documented anywhere at the module level. Context A (public route, no session, email from navigation state) and Context B (ProtectedRoute gate, session exists, email from prop) have meaningfully different email availability guarantees and session states.
**Risk:** Future modifications to the screen may optimize for one context and break the other. The BEHAVIOR.md stub at modules/recovery/ covers only §3.11 (resend flow) — it does not model Context B or the interaction between the two.
**Suggested correction:** Author a dedicated BEHAVIOR.md for this module that explicitly models both contexts. Route ProtectedRoute inline context to BEHAVIOR §3 as a distinct user flow.
**Recommended command:** LOGAN

---

### FINDING-002 — COUNTDOWN_INTERRUPT_RISK [LOW / UX]

**Location:** screens/VerifyEmailRequiredScreen.jsx:17-29
**Issue:** The 4-second countdown (`REDIRECT_SECONDS = 4`) starts on component mount and fires `navigate('/login', { replace: true })` unconditionally after 4 ticks — regardless of whether a resend operation is in progress or just completed. A user who clicks "Resend confirmation email" at T≥1s will be navigated away before they can see the success confirmation banner (`sent` state).

**Evidence (source-verified):**
```js
const [countdown, setCountdown] = useState(REDIRECT_SECONDS)
useEffect(() => {
  const interval = setInterval(() => {
    setCountdown((prev) => {
      if (prev <= 1) {
        clearInterval(interval)
        navigate('/login', { replace: true })  // ← fires at T+4s regardless
        return 0
      }
      return prev - 1
    })
  }, 1000)
  return () => clearInterval(interval)
}, [navigate])
```

The button is disabled during `loading` but the countdown runs in a separate effect with no dependency on `loading` or `sent`.
**Risk:** Poor UX — user doesn't know if resend succeeded. The success confirmation renders at ~T+1.5s but redirects fire at T+4s.
**Suggested correction:** Pause the countdown when `loading` is true; reset the countdown to `REDIRECT_SECONDS` when `sent` transitions to true, giving the user 4 more seconds to see the success banner.
**Recommended command:** WOLVERINE (implementation ticket)

---

### FINDING-003 — EMAIL_STATE_LOSS_DEGRADED [LOW / UX]

**Location:** screens/VerifyEmailRequiredScreen.jsx:13
**Issue:** In Context A (public route), if the user navigates directly to `/verify-email` without `location.state.email` (e.g., bookmark, browser back after state flush), `email` is `null`. The resend button is conditionally hidden (`{email ? (<button.../>)`). The only available action is waiting out the 4-second countdown.
**Risk:** Low — safe degradation. User is redirected to login where they can log in or re-register. No error state shown.
**Status:** ACCEPTABLE DEGRADATION — not a bug, but not clearly communicated. The screen shows only the countdown text without explanation of why resend is unavailable.
**Suggested correction:** When `email` is null, render a brief message: "Return to login to resend your confirmation email." — this makes the degraded path clearer.
**Recommended command:** WOLVERINE (low-priority UX ticket)

---

### FINDING-004 — VERIFY_EMAIL_MISCLASSIFIED_IN_RECOVERY [INFO / GOVERNANCE]

**Location:** ZZnotforproduction/APPS/VCSM/features/auth/modules/recovery/BEHAVIOR.md §3.11
**Issue:** The verify-email screen and flow is categorized as part of the `recovery` module stub. However, the primary use case is post-registration confirmation (not recovery). The screen also serves as a ProtectedRoute gate — a role that is architectural, not recovery-related.
**Risk:** Low — governance only. Future recovery documentation work may miss the screen's dual-context architecture.
**Suggested correction:** This module directory (`modules/verify-email/`) is being created this run. The recovery BEHAVIOR.md §3.11 entry should be updated to cross-reference the dedicated module.
**Recommended command:** LOGAN

---

## MODULE INDEPENDENCE STATUS

**Module:** verify-email
**Classification:** DEPENDENT
**Reason:** The `isEmailVerifiedModel` function is consumed externally by ProtectedRoute via `auth.adapter.js`. The screen itself is rendered both as a route and as an inline gate. The module cannot be removed or changed without coordinating with ProtectedRoute and the broader auth guard system.
**Blocking gaps:**
- No BEHAVIOR.md for this module (created this run — stub only)
- No test coverage for any layer

---

## Behavior Consistency Check — verify-email
```
BEHAVIOR.md present: NO (at module level — creating stub this run)
Status: MISSING → STUB (new)

Check A (Source without behavior): FINDING — BEHAVIOR_CONTRACT_ABSENT [verify-email]
  Severity: P2 (P1 feature priority for auth sub-module)
  Recommendation: Author BEHAVIOR.md before next implementation ticket on this screen

Check B (Behavior without source): N/A — no BEHAVIOR.md existed prior to this run

Check C (§13 engine consistency):
  Declared engines: 0
  Undeclared actual engine imports: 0 — NONE
  Declared but unused engines: 0 — NONE

Check D (§6 data change consistency):
  Declared operations: 0 (no direct DB writes — supabase.auth.resend is auth API)
  Operations without DAL: 0 — NONE
```

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc / BEHAVIOR.md | modules/verify-email/BEHAVIOR.md | PRESENT (new stub — this run) |
| INDEX.md | modules/verify-email/INDEX.md | PRESENT (new — this run) |
| Security audit | modules/verify-email/SECURITY.md | PRESENT (new — this run) |
| Ownership record | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | N/A (no DB writes) |
| Native transfer audit | — | N/A |
| Engine audit | — | N/A |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Tests: 0 for all layers | HIGH | useResendVerification, resendVerification.controller.js, emailVerification.dal.js, isEmailVerifiedModel are all untested — email verification is a trust boundary | SPIDER-MAN |
| BEHAVIOR.md (dual-context) | HIGH | Both rendering contexts must be modeled; recovery module stub §3.11 does not capture Context B (ProtectedRoute gate) | LOGAN |
| Countdown interrupt fix | LOW | 4s redirect fires regardless of resend state — user can't confirm success | WOLVERINE |
| Email-null degraded state UX | LOW | Degraded path (no email in state) shows no explanation | WOLVERINE |

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Author BEHAVIOR.md (both rendering contexts) | Auth is trust-critical; dual-context screen has no behavioral spec | LOGAN |
| P1 | Test coverage: useResendVerification, controller, DAL, model | 0 tests on an email-confirmation critical path | SPIDER-MAN |
| P3 | Countdown pause during loading/post-send | UX improvement — low risk | WOLVERINE |
| P3 | Email-null degraded state messaging | Low-priority UX clarity | WOLVERINE |

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## RECOMMENDED HANDOFFS

- **LOGAN** — Author BEHAVIOR.md covering both rendering contexts and email-null degraded state
- **SPIDER-MAN** — Add tests: useResendVerification (loading/sent/error), resendVerification.controller (email validation), emailVerification.dal (supabase.auth.resend error path), isEmailVerifiedModel (null user, unconfirmed user, confirmed user)
- **WOLVERINE** — Implementation ticket for countdown interrupt fix (P3)
