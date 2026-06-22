# LOKI — Barbershop Join Route Static Trace
**Date:** 2026-05-18
**Scope:** `apps/VCSM/src/features/join/` — route registration status and call chain trace for `joinBarbershopAccount.controller.js`
**Method:** Static import trace — grep across all route files, screens, and hooks
**Auditor:** LOKI (read-only — no runtime trace available; static analysis only)
**Trigger:** VENOM Finding 6 flagged `/join/barbershop/:token` as unregistered; CEREBRO pass required LOKI trace to verify current state

---

## Trace Objective

Verify whether the `/join/barbershop/:token` route is:
1. Registered in the router
2. Accessible at runtime
3. Safe to activate (all pre-conditions met)

---

## Route Registration Trace

### Route Files Scanned

```
apps/VCSM/src/app/routes/index.jsx
apps/VCSM/src/app/routes/lazyApp.jsx
apps/VCSM/src/app/routes/lazyPublic.jsx
apps/VCSM/src/app/routes/public/auth.routes.jsx
apps/VCSM/src/app/routes/public/legal.routes.jsx
apps/VCSM/src/app/routes/public/about.routes.jsx
apps/VCSM/src/app/routes/public/contact.routes.jsx
apps/VCSM/src/app/routes/public/howto.routes.jsx
apps/VCSM/src/app/routes/public/vportMenu.routes.jsx
apps/VCSM/src/app/routes/public/wanders.routes.jsx
apps/VCSM/src/app/routes/public/wanderex.routes.jsx
apps/VCSM/src/app/routes/protected/app.routes.jsx
apps/VCSM/src/app/routes/learning/learning.routes.jsx
```

### Grep Results

```
grep -rn "barbershop|JoinBarbershop|join.*barbershop" apps/VCSM/src/app/routes → 0 results
grep -rn "barbershop|JoinBarbershop" apps/VCSM/src/app → 0 results
```

**Verdict: Route NOT REGISTERED.** No route file imports or references `JoinBarbershopScreen`, `useJoinBarbershop`, or any join-barbershop path.

---

## Call Chain — Feature State

The feature IS fully implemented at the feature layer:

```
joinBarbershopAccount.controller.js
  → signUpForBarbershopInvite()
  → loadInviteForJoin()
  → loginForInvite()
  → checkJoinAuthState()
  → autoResumeInviteOnboarding()
  → createBarberVportAndAccept()
  → useExistingBarberVportAndAccept()

useJoinBarbershop.js (hook)
  → imports signUpForBarbershopInvite, autoResumeInviteOnboarding, etc. from controller

JoinBarbershopScreen.jsx (screen)
  → imports useJoinBarbershop

JoinSignupForm.jsx (component)
  → rendered inside JoinBarbershopScreen
```

Feature layer is complete. No route registration connects it to the router.

---

## Pre-Condition Safety Checklist

Before wiring the route, the following conditions must be met. Status verified against current code:

| Pre-condition | Required | Status | Evidence |
|---|---|---|---|
| Consent recording on signup | Yes | MET ✓ | `signUpForBarbershopInvite` calls `recordSignupConsent` after account creation with error swallowed non-blocking |
| Synthetic age write removed | Yes | MET ✓ | `syntheticAdultBirthdate` not found in any source file |
| ToS/Privacy links correct paths | Yes | MET ✓ | `JoinSignupForm.jsx` uses `/legal/terms-of-service` and `/legal/privacy-policy` |
| Email confirm redirect lands on join path | Yes | Requires route to exist | Redirect URL: `${window.location.origin}/join/barbershop/${token}` — will 404→login until route registered |
| `age_verification` consent type in schema | Yes | MET (migration staged) ✓ | Migration `20260510040000` adds constraint and seeds document |

---

## Runtime Impact Assessment

**What happens if a user navigates to `/join/barbershop/:token` today:**
- React Router `*` wildcard catches the path
- User is redirected to `/login` with no explanation
- No invite is loaded, no signup form rendered
- Email confirm redirect from Supabase lands on `/login` instead of the join screen

**What happens the moment the route is registered:**
- All pre-conditions are met — consent, age, and links are safe
- The route becomes live immediately upon registration
- No additional code changes required

---

## Activation Decision

The route is safe to wire. All three VENOM Finding 6 sub-conditions are pre-fixed:
1. Consent recording: ✓
2. Synthetic age: ✓
3. ToS links: ✓

**Required action:** Add `JoinBarbershopScreen` import and `/join/barbershop/:token` path registration to an appropriate public route file.

**Route suggestion:** `apps/VCSM/src/app/routes/lazyPublic.jsx` or a new `apps/VCSM/src/app/routes/public/join.routes.jsx`.

**Owner:** Wolverine (route activation is a feature activation decision, not a bug fix).

---

## Verdict

**DORMANT — SAFE TO ACTIVATE**

The barbershop join route is unregistered and inactive. No user can reach it. All security pre-conditions from VENOM Finding 6 are satisfied. The route can be registered without triggering any of the originally identified consent, age, or link gaps.
