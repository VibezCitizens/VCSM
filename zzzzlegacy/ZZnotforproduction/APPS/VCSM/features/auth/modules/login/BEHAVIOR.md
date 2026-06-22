---
title: Login Module — Behavior
status: DRAFT
feature: auth
module: login
source: architect-derived + TICKET-AUTH-LOGIN-SECURITY-001
created: 2026-06-05
updated: 2026-06-06
---

# auth / modules / login — BEHAVIOR

## Status

DRAFT. Seeded from ARCHITECT review. Extended 2026-06-06 with security behaviors from TICKET-AUTH-LOGIN-SECURITY-001 Batch 1.

---

## §3 Happy Paths

### BEH-LOGIN-001 — Successful login navigates to safe destination
On `signInWithPassword` success, the user is navigated to `location.state.from` (if it passes `isSafeAuthReturnPath`) or `/feed` as fallback. Navigation uses `replace: true`.

### BEH-LOGIN-002 — Session hydrated after successful login
After `signInWithPassword` resolves, `hydrateAuthSession()` is called to warm the auth session state before navigation. A failure in hydration must not block navigation — the authenticated user must reach the app.

### BEH-LOGIN-003 — Profile discoverability set after login
After a successful login, `ensureProfileDiscoverable(userId)` is called as a non-fatal side effect. A failure here must not trap the authenticated user on `/login`.

### BEH-LOGIN-SEC-001 — Failed login applies tiered client-side cooldown
After each failed login attempt, a cooldown is applied based on the cumulative attempt count:
- Attempts 1–2: 0 seconds
- Attempts 3–4: 5 seconds
- Attempts 5+: 15 seconds

During cooldown, `canSubmit` is false and the submit button is disabled.

### BEH-LOGIN-SEC-003 — Successful login resets failure tracking
On a successful login, `failedAttemptsRef.current` is reset to 0 and `cooldownSeconds` is reset to 0. A prior cooldown must not persist across a successful authentication.

---

## §4 Failure Paths

### BEH-LOGIN-F-001 — Auth failure shows unified safe error
When `signInWithPassword` throws for any reason (wrong credentials, account not found, email unconfirmed, timeout, network failure), the UI displays exactly: `"Invalid credentials or email not verified."` No raw Supabase error messages are surfaced.

### BEH-LOGIN-F-002 — Login request timeout shows safe error
If the `signInWithPassword` call does not resolve within 15 seconds, it is aborted with a timeout error. The error is mapped to the generic safe message via the catch block.

### BEH-LOGIN-F-003 — Empty email or password prevents submit
`canSubmit` is false when `email.trim()` is empty or `password.trim()` is empty. The submit handler returns immediately if `canSubmit` is false.

### BEH-LOGIN-F-004 — Active cooldown prevents submit
`canSubmit` is false when `cooldownSeconds > 0`. The cooldown countdown decrements every second via `useEffect`.

---

## §5 Security Rules

### BEH-LOGIN-SEC-002 — No email enumeration via login error
Login must not distinguish between "account does not exist", "wrong password", or "email not confirmed" via the user-visible error message. All auth failures collapse to a single safe string: `"Invalid credentials or email not verified."` This prevents account existence enumeration (F-02 fix from red team review).

### BEH-LOGIN-SEC-004 — Double-submit guard via submittingRef
`submittingRef.current` is set to `true` at the start of `handleLogin` and reset to `false` in `finally`. While it is `true`, any concurrent call to `handleLogin` returns immediately without re-entering the async flow. This prevents duplicate inflight Supabase requests.

---

## §9 Must Never Happen

### LOGIN-MNH-001 — Token isolation
Login must never expose Supabase tokens, session JWTs, or raw credential data to the UI layer or React context. `login.controller.js` projects only `user.id` and `user.email` from the `signInWithPassword` response. `access_token`, `refresh_token`, and `session` fields must not appear in the controller return value.

### LOGIN-MNH-002 — Safe redirect enforcement
Login must never navigate to a URL that has not passed `isSafeAuthReturnPath()`. The destination is derived from `location.state.from` (React Router state — not a URL query param). Any path that fails the check falls back to `/feed`.

### LOGIN-MNH-003 — Profile write session guard
Login must never write `profiles.discoverable` unless `session.user.id` exactly matches the `userId` of the just-authenticated user. A mismatch returns early without a DB write.

### LOGIN-MNH-004 — Submit readiness owned by hook
`canSubmit` is computed inside `useLogin.js` and exposed via return value. `LoginScreen.jsx` must consume it from the hook — never recompute it locally.

### LOGIN-MNH-005 — iOS prompt ownership boundary
`LoginScreen.jsx` passes `open` and `onClose` to `IosInstallPrompt` only. It must not own or reimplement the prompt.

### LOGIN-MNH-006 — "Email not confirmed" must not produce a distinct UI branch
The `isEmailNotConfirmedError` check must not appear in `useLogin.js`. The catch block must apply `LOGIN_SAFE_ERROR` uniformly regardless of the Supabase error type. Distinguishing unverified accounts from non-existent accounts in login UI is forbidden.

---

## §10 Acceptance Criteria

### AC-LOGIN-001
Given a failed login attempt, the UI shows exactly `"Invalid credentials or email not verified."` — no other error string.

### AC-LOGIN-002
Given 3 failed login attempts, the submit button is disabled for 5 seconds.

### AC-LOGIN-003
Given 5 failed login attempts, the submit button is disabled for 15 seconds.

### AC-LOGIN-004
Given a successful login after prior failures, `cooldownSeconds` returns to 0 and the submit button is re-enabled.

### AC-LOGIN-005
Given a submit attempt while `loading` is true or `cooldownSeconds > 0`, `handleLogin` returns immediately without calling `signInWithPassword`.

### AC-LOGIN-006
Given two simultaneous calls to `handleLogin`, only the first enters the async flow; the second is blocked by `submittingRef`.

---

## §11 Test Requirements

### TESTREQ-LOGIN-001 (→ AC-LOGIN-001, AC-LOGIN-002, AC-LOGIN-003)
Test `resolveCooldown(n)` at attempt boundaries: 1→0, 2→0, 3→5, 4→5, 5→15, 10→15.

### TESTREQ-LOGIN-002 (→ AC-LOGIN-001, LOGIN-MNH-006)
Test that `LOGIN_SAFE_ERROR` equals `"Invalid credentials or email not verified."` and does not contain "email not confirmed" or "Please verify".

### TESTREQ-LOGIN-003 (→ AC-LOGIN-004)
Simulate 5 failed attempts (ref.current = 5), then simulate success (ref.current = 0); verify `resolveCooldown(0)` returns 0.

### TESTREQ-LOGIN-004 (→ AC-LOGIN-005)
Test `canSubmit` formula returns false when: loading=true, cooldownSeconds>0, email empty, email whitespace, password empty, password whitespace. Returns true when all conditions met.

### TESTREQ-LOGIN-005 (→ AC-LOGIN-006, BEH-LOGIN-SEC-004)
Test `submittingRef` double-submit guard: first call executes, concurrent calls are blocked, lock releases in finally.

### TESTREQ-LOGIN-006 (→ TESTREQ-LOGIN-001, BEH-LOGIN-SEC-001)
Test cumulative attempt accumulation: simulate 6 failures sequentially; verify cooldown sequence is [0, 0, 5, 5, 15, 15].

### TESTREQ-LOGIN-007 (→ LOGIN-MNH-001)
Test that `signInWithPassword` controller return value contains only `user.id` and `user.email` — no `access_token`, `refresh_token`, or `session`.
