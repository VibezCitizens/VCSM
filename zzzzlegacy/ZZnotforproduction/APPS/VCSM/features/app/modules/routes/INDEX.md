---
title: Routes Module — Index
status: STUB
feature: app
module: routes
source: architect-derived
created: 2026-06-05
source-path: apps/VCSM/src/app/routes/
scanner-version: 1.1.0
---

# app / modules / routes

Route tree assembly module. Owns all route group definitions and lazy loading configuration. No business logic — pure route wiring. Routes are lazy-imported for code splitting.

## Module Summary

| Field | Value |
|---|---|
| Module | routes |
| Feature | app |
| Source Path | apps/VCSM/src/app/routes/ |
| Screens | 0 (screens are feature-owned; routes are lazy-imported) |
| Write Surfaces | None |
| Route Groups | 4 (public, protected, learning, lazy config) |
| Error Boundary | 1 (RouteErrorBoundary.jsx) |

## Known Source Files (ARCHITECT-verified)

### Root
| File | Role |
|---|---|
| routes/index.jsx | Root router assembly — combines all route groups |
| routes/RouteErrorBoundary.jsx | Global route error boundary |
| routes/lazyApp.jsx | Lazy import config for protected app screens |
| routes/lazyPublic.jsx | Lazy import config for public screens |
| routes/appRoutes.redirects.jsx | Redirect rule definitions |

### Public Routes
| File | Route Group |
|---|---|
| routes/public/AuthPublicRoute.jsx | Auth public guard (prevents authed users hitting /auth/*) |
| routes/public/about.routes.jsx | /about/* |
| routes/public/auth.routes.jsx | /auth/* |
| routes/public/contact.routes.jsx | /contact/* |
| routes/public/howto.routes.jsx | /how-to/* (SEO landing pages) |
| routes/public/join.routes.jsx | /join/* (QR / barbershop join flows) |
| routes/public/legal.routes.jsx | /legal/* |
| routes/public/vportMenu.routes.jsx | /m/* (public VPORT menu + reviews) |
| routes/public/wanderex.routes.jsx | /wanderex/* (FROZEN feature — still routed) |
| routes/public/wanders.routes.jsx | /wanders/* (FROZEN feature — still routed) |

### Protected Routes
| File | Route Group |
|---|---|
| routes/protected/app.routes.jsx | Full app routes (feed, chat, profiles, dashboard, settings, onboarding) |
| routes/protected/appRoutes.redirects.jsx | Protected redirects |

### Learning Routes
| File | Route Group |
|---|---|
| routes/learning/learning.routes.jsx | /learning/* (FROZEN feature — still routed) |

## Security Flags

- INFO: wanderex.routes.jsx + wanders.routes.jsx + learning.routes.jsx still present and active despite features being FROZEN — routes serve frozen/incomplete features
- INFO: lazyApp.jsx + lazyPublic.jsx own lazy import boundaries — code splitting surface; confirm no eager imports of heavy features
- LOW: RouteErrorBoundary.jsx — confirm error messages do not leak stack traces or internal paths to users in production

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm routes/index.jsx provider/guard wrapping order (ProtectedRoute wraps which groups?)
- [ ] Confirm AuthPublicRoute behavior — redirects authed users away from /auth/* to feed?
- [ ] Confirm whether wanderex/wanders/learning routes are gated or fully open
- [ ] Confirm RouteErrorBoundary error display in production (no stack trace leak)
