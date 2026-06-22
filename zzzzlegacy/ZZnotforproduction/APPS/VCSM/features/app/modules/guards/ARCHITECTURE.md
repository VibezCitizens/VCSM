---
title: Guards Module — Architecture
status: STUB
feature: app
module: guards
source: architect-derived
created: 2026-06-05
---

# app / modules / guards — ARCHITECTURE

## Status

STUB. Layer stack seeded from ARCHITECT review.

## Layer Stack

```
routes/index.jsx
  └── ProtectedRoute.jsx (auth gate)
        └── ProfileGatedOutlet.jsx (profile completion gate)
              └── app.routes.jsx (protected feature routes)
```

## ProtectedRoute Internal Flow (UNVERIFIED)

```
ProtectedRoute
  ├── reads session from AuthProvider context
  ├── if loading → render loading spinner (UNVERIFIED)
  ├── if session absent → <Navigate to="/auth/login" replace />
  └── if session present → <Outlet />
```

## ProfileGatedOutlet Internal Flow (UNVERIFIED)

```
ProfileGatedOutlet
  ├── reads profile completion from Zustand/context (UNVERIFIED source)
  ├── if loading → render loading spinner (UNVERIFIED)
  ├── if profile incomplete → <Navigate to="/onboarding" replace />
  └── if profile complete → <Outlet />
```

## Module Boundaries

| Boundary | Status |
|---|---|
| Guards own no business logic | CORRECT |
| Guards own no DAL | CORRECT |
| ProtectedRoute is the sole auth gate for protected routes | CORRECT (must verify completeness) |
| ProfileGatedOutlet is the sole profile gate | CORRECT (must verify completeness) |

## TODO

- [ ] Confirm ProtectedRoute session source — AuthProvider context vs direct Supabase call
- [ ] Confirm ProfileGatedOutlet profile signal source (Zustand selector? context? hook?)
- [ ] Confirm loading state handling in both guards (prevent flash of protected content)
- [ ] Verify all protected routes pass through ProtectedRoute in route tree
