---
name: vcsm.app.index
description: VCSM app feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / app

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 0 | No controllers — shell delegates to feature adapters |
| DAL files | 0 | No DAL — shell has no DB access |
| Hooks | 6 | useIOSPlatform, useIOSKeyboard, useAuth (from AuthProvider), plus callgraph-resolved hooks |
| Models | 0 | No models |
| Screens | 0 | Screens are feature-owned; lazy-imported via lazyApp.jsx / lazyPublic.jsx |
| Components | 3 | IOSDebugHUD.jsx, IOSProdRouteDebugger.jsx, IosInstallPrompt.jsx (+ IosInstallSteps, Modal) |
| Adapters | 0 | None owned — consumes adapters from legal, auth, dashboard features |
| Barrels | 9 | guards/index.js, layout/index.js, platform/index.js, platform/ios/index.js, app/index.js, etc. |
| Tests | 0 | No tests found by scanner |
| Routes | 0 | No external route-map entries (routes are defined inline, not registered as public entry points) |
| Total source files | 35 | From scanner sourceFileCount |

## Write Surface Map

No write surfaces detected by scanner.

The `AuthProvider` writes to `sessionStorage` (recovery flag: `vc.auth.recovery`) and `localStorage` (actor_kind, actor_vport_id, actor_touch) during logout and password recovery flows. These are browser storage mutations, not Supabase DB write surfaces.

## Security-Sensitive Surfaces

The following client-side storage writes in `AuthProvider` are security-adjacent:

| Surface | Kind | Risk |
|---|---|---|
| `sessionStorage: vc.auth.recovery` | Client-side flag | VENOM-AUTH-001 — recovery nonce is readable/writable by any JS on the page; self-exploitation only |
| `localStorage: actor_kind, actor_vport_id, actor_touch` | Identity hint cache | Cleared on logout — low risk |
| `clearAllIdentityStorage()` | Wipe on logout | Must fire before Supabase signOut to prevent race |

No high-sensitivity Supabase write surfaces in static scan.

## Engine Dependencies

| Engine | Used By |
|---|---|
| chat | Lazy-imported chat feature screens; chat.adapter consumed inside chat feature |
| identity | useIdentity() in RootLayout.jsx (identityContext) |
| learning | Lazy-imported learning feature screens |
| menu | Lazy-imported menu/public route screens |
| notification | Lazy-imported notification feature screens |
| profile | Auth adapter (CompleteProfileGate), legal adapter (consent gate) |

## Routes

No entries in route-map scanner output for this platform-area. The `app` module owns and assembles the entire route tree but does not register individual public routes in the scanner's route-map.

Key route groups assembled in `routes/index.jsx`:

| Group | Access | File |
|---|---|---|
| Auth routes | Public | routes/public/auth.routes.jsx |
| About / Contact / Legal | Public | routes/public/about.routes.jsx, contact.routes.jsx, legal.routes.jsx |
| How-to (SEO landing) | Public | routes/public/howto.routes.jsx |
| Join (QR / barbershop) | Public | routes/public/join.routes.jsx |
| Wanders | Public | routes/public/wanders.routes.jsx |
| Vport menu / reviews (public) | Public | routes/public/vportMenu.routes.jsx |
| Onboarding / Welcome | Protected (no profile gate) | routes/protected/app.routes.jsx |
| Full app (feed, chat, profiles, dashboard, settings, etc.) | Protected + profile-gated | routes/protected/app.routes.jsx |
| Learning (/learning/*) | Protected + profile-gated | routes/learning/learning.routes.jsx |

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (PLACEHOLDER — no real spec written) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
