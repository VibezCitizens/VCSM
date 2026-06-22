---
name: vcsm.auth.verify-email.behavior
description: Behavior contract stub for VCSM auth/verify-email module — created by ARCHITECT 2026-06-06
metadata:
  type: behavior
  status: STUB
  authored-by: ARCHITECT (2026-06-06)
  priority: P1
  evidence-standard: SOURCE_READ
---

# Module Behavior Contract — verify-email
**Application:** VCSM
**Status:** STUB — source-read derived; needs authoring by LOGAN
**Parent feature:** auth

---

## §1 Purpose

The verify-email module is the post-registration email confirmation gate. It blocks access to protected areas until the user confirms their email address. It serves two rendering contexts with different session states.

---

## §2 Entry Points

| Context | Path | Access | Email Source |
|---|---|---|---|
| Post-registration public gate | /verify-email | public (AuthPublicRoute) | location.state.email (from RegisterScreen) |
| ProtectedRoute inline gate | (no path) | authenticated-unverified | user.email prop (from ProtectedRoute) |

---

## §3 User Flows

### 3.1 Post-Registration Verify Gate (Context A)
- User registers successfully → RegisterScreen navigates to `/verify-email` with `{ state: { email } }`.
- No session exists yet (email not confirmed; Supabase has not issued a session).
- Screen shows: "Check your email" heading, email address, "Resend confirmation email" button, 4-second countdown.
- Countdown starts on mount; after 4 seconds navigates to `/login` with `{ replace: true }`.
- If user clicks resend: useResendVerification → resendVerification.controller → emailVerification.dal → supabase.auth.resend({ type: 'signup', email }).
- On resend success: `sent` state renders success banner; button disabled.
- After confirming email: user clicks the confirmation link in their email → `/auth/callback` → session established → navigates to /explore.

### 3.2 ProtectedRoute Unverified Gate (Context B)
- Authenticated user (session exists, email not confirmed) attempts to access any protected route.
- ProtectedRoute checks `useEmailVerified(user)` → `isEmailVerifiedModel(user)` → `Boolean(user.email_confirmed_at)` → false.
- ProtectedRoute renders `VerifyEmailRequiredScreen` inline with `email={user.email ?? ''}`.
- User can resend confirmation from this gate.
- After email confirmation: Supabase fires `onAuthStateChange` → `USER_UPDATED` → AuthProvider updates user object → email_confirmed_at populated → ProtectedRoute re-renders → gate lifted → Outlet renders.

### 3.3 Direct Navigation (Degraded — no email in state)
- User navigates directly to `/verify-email` without `location.state.email` (bookmark, back button after state flush).
- `email` is null → no email display, no resend button.
- Only countdown visible → redirects to /login after 4 seconds.
- No error shown; safe degradation.

---

## §4 Business Rules

1. Email resend does not require an authenticated session — `supabase.auth.resend` is called with only the email address.
2. The resend button is only rendered when `email` is available. When email is null, the action is hidden (not blocked with an error).
3. The countdown fires unconditionally 4 seconds after mount regardless of resend state.
4. `isEmailVerifiedModel` reads `user.email_confirmed_at` from the Supabase user object — it does not perform a live DB query.
5. In Context B, the gate lifts automatically when AuthProvider receives a `USER_UPDATED` event with a confirmed email (no page reload required).

---

## §5 Known Issues / TODOs

- **TODO:** Countdown should pause while `loading` is true and reset when `sent` transitions to true (FINDING-002 — countdown interrupt risk). Route to WOLVERINE.
- **TODO:** When email is null, render a clarifying message pointing the user to login. Currently shows only the countdown (FINDING-003).
- **TODO:** Full behavioral spec for both contexts authored by LOGAN. This stub is ARCHITECT-derived from source read.
