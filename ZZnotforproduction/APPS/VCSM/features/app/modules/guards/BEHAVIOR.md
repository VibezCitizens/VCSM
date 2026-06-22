---
title: Guards Module — Behavior
status: STUB
feature: app
module: guards
source: architect-derived
created: 2026-06-05
---

# app / modules / guards — BEHAVIOR

## Status

STUB. Behaviors seeded from ARCHITECT review.

## Confirmed Behaviors

### ProtectedRoute — Auth Gate
- Wraps protected route groups in routes/protected/app.routes.jsx
- Checks for active Supabase session
- If session absent: redirects to /auth/login (redirect path UNVERIFIED)
- If session present: renders children (Outlet)
- Loading state: UNVERIFIED — may flash protected content briefly if no loading guard

### ProfileGatedOutlet — Profile Completion Gate
- Wraps routes that require a complete profile
- Checks profile completion signal (source: Zustand store? context? UNVERIFIED)
- If profile incomplete: redirects to /onboarding (redirect path UNVERIFIED)
- If profile complete: renders children (Outlet)

## Gate Composition (UNVERIFIED)

```
ProtectedRoute       ← auth gate
  └── ProfileGatedOutlet   ← profile gate
        └── App routes (feed, chat, dashboard, etc.)
```

## TODO

- [ ] Confirm ProtectedRoute session check source — onAuthStateChange listener or direct session.getSession() call?
- [ ] Confirm redirect paths for both guards
- [ ] Confirm loading/pending states to prevent content flash
- [ ] Confirm ProfileGatedOutlet profile signal — which field marks profile as complete?
