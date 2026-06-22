---
title: Routes Module — Architecture
status: STUB
feature: app
module: routes
source: architect-derived
created: 2026-06-05
---

# app / modules / routes — ARCHITECTURE

## Status

STUB. Layer stack seeded from ARCHITECT review.

## Route Tree Assembly

```
routes/index.jsx
  ├── Public routes (no guard)
  │     ├── AuthPublicRoute → /auth/* (auth.routes.jsx)
  │     ├── /about/* (about.routes.jsx)
  │     ├── /contact/* (contact.routes.jsx)
  │     ├── /legal/* (legal.routes.jsx)
  │     ├── /how-to/* (howto.routes.jsx)
  │     ├── /join/* (join.routes.jsx)
  │     ├── /m/* (vportMenu.routes.jsx)
  │     ├── /wanders/* (wanders.routes.jsx — FROZEN)
  │     └── /wanderex/* (wanderex.routes.jsx — FROZEN)
  │
  ├── ProtectedRoute
  │     ├── /onboarding (no profile gate)
  │     └── ProfileGatedOutlet
  │           ├── Full app routes (app.routes.jsx — feed, chat, profiles, dashboard, etc.)
  │           └── /learning/* (learning.routes.jsx — FROZEN)
  │
  └── RouteErrorBoundary (wraps all routes)
```

## Lazy Loading

```
lazyApp.jsx     → dynamic imports for all protected feature screens
lazyPublic.jsx  → dynamic imports for all public feature screens
```

Code splitting: public and protected screen bundles are separate chunks. Learning screens are FROZEN but still lazy-imported.

## Key Dependencies

| Dependency | Source |
|---|---|
| guards/ProtectedRoute | app/guards/ProtectedRoute.jsx |
| guards/ProfileGatedOutlet | app/guards/ProfileGatedOutlet.jsx |
| Feature screens (lazy) | lazyApp.jsx, lazyPublic.jsx |

## TODO

- [ ] Confirm exact route tree nesting in routes/index.jsx (especially guard wrapping)
- [ ] Confirm appRoutes.redirects.jsx redirect list
- [ ] Confirm FROZEN feature routes status — 404? empty screen? active but incomplete?
- [ ] Confirm RouteErrorBoundary scope — wraps entire tree or per-route?
