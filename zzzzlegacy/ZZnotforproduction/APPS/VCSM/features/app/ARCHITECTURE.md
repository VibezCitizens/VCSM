---
name: vcsm.app.architecture
description: ARCHITECT V2 module architecture report for VCSM:app
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** app
**Application Scope:** VCSM
**Module Type:** platform-area
**Primary Root:** apps/VCSM/src/app
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The `app` platform-area is the VCSM application shell: it owns the router tree, authentication provider, route guards, iOS platform bootstrap, and the root layout that hosts navigation chrome (TopNav, BottomNavBar). It is the single composition root that assembles all feature screens under one React tree, enforces auth and consent gates, and enforces the scroll/layout contract across every route.

## OWNERSHIP

Platform infrastructure team / App shell domain. This module is responsible for application boot, session hydration, route access control, and cross-cutting layout. It does not own any domain feature logic — it delegates to feature adapters through route-level lazy imports.

## ENTRY POINTS

| Entry Point | Access | Description |
|---|---|---|
| `AppRoutes` (routes/index.jsx) | Public | Root router — assembles all public and protected route trees |
| `AuthProvider` (providers/AuthProvider.jsx) | Internal | React context — wraps the entire app, supplies `user`, `loading`, `logout` |
| `ProtectedRoute` (guards/ProtectedRoute.jsx) | Internal | Auth + consent gate — redirects unauthenticated and unverified users |
| `ProfileGatedOutlet` (guards/ProfileGatedOutlet.jsx) | Internal | Profile completeness gate — delegates to `CompleteProfileGate` adapter |
| `RootLayout` (layout/RootLayout.jsx) | Internal | Shell layout — TopNav, BottomNavBar, PageContainer, IOSDebugHUD |
| `useIOSPlatform` (platform/ios/useIOSPlatform.js) | Internal | iOS marker hook — adds `ios`, `ios-pwa`, `ios-safari` classes to `<html>` |

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 0 | N/A — no DAL files in this module |
| Model | 0 | N/A |
| Controller | 0 | N/A |
| Service | 0 | N/A |
| Adapter | 0 | N/A — consumes adapters from feature modules, does not own any |
| Hook | 6 | useIOSPlatform.js, useIOSKeyboard.js, useAuth() (from AuthProvider) |
| Component | 3 | IOSDebugHUD.jsx, IOSProdRouteDebugger.jsx, IosInstallPrompt.jsx |
| Screen | 0 | N/A — screens are owned by feature modules, lazy-imported here |
| Barrel | 9 | guards/index.js, layout/index.js, platform/index.js, platform/ios/index.js, app/index.js, etc. |
| Module | 47 | Route definition files, lazy import bundles, platform env, redirect components |

Note: cg_layerCounts from scanner — barrel: 9, component: 3, hook: 6, module: 47. No DAL, model, or controller layers exist in this module by design.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Source confirms: router, auth provider, guards, layout, iOS platform | BEHAVIOR.md is PLACEHOLDER — no formal spec written |
| Owner defined | PARTIAL | Implicitly owned by platform-area convention | No explicit ownership record |
| Entry points mapped | PASS | routes/index.jsx, AuthProvider, guards, RootLayout all confirmed | |
| Controllers present/delegated | PASS | No controllers needed — delegates to feature adapters | |
| DAL/repository present/delegated | PASS | No DAL in this module — correct for a shell layer | |
| Models/transformers present | PASS | No models — correct | |
| Hooks/view models present | PASS | 6 hooks confirmed (useIOSPlatform, useIOSKeyboard, useAuth, etc.) | |
| Screens/components present | PASS | 3 components (IOSDebugHUD, IosInstallPrompt, Modal) | Screens are feature-owned, lazy-imported |
| Services/adapters present | PASS | Consumes legal.adapter, auth.adapter, vport.adapter via adapters | |
| Database objects mapped | PASS | No write surfaces — correct for shell | |
| Authorization path mapped | PASS | ProtectedRoute: auth + email-verify + consent; ProfileGatedOutlet: profile gate | |
| Cache/runtime behavior mapped | PARTIAL | Auth session hydration and TOKEN_REFRESHED guard documented inline | No formal cache spec |
| Error/loading/empty states mapped | PARTIAL | loading=null guard in ProtectedRoute, RouteErrorBoundary wraps all routes | Empty state not formally documented |
| Documentation linked | FAIL | BEHAVIOR.md is PLACEHOLDER — no real behavior spec | Must be written |
| Tests/validation noted | FAIL | 0 tests confirmed by scanner | Auth provider, guards, and router untested |
| Native parity noted | N/A | iOS platform adaptation present in platform/ios/ | |
| Engine dependencies mapped | PASS | chat, identity, learning, menu, notification, profile engines consumed via adapters | |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/identity | engine | inbound | YES | useIdentity() consumed in RootLayout |
| features/legal (adapter) | feature-adapter | inbound | YES | useLegalConsent, ConsentGateScreen |
| features/auth (adapter) | feature-adapter | inbound | YES | isEmailVerifiedModel, VerifyEmailRequiredScreen, CompleteProfileGate |
| features/dashboard (adapter) | feature-adapter | inbound | YES | VportLeadsChip in RootLayout |
| shared/components | shared | inbound | YES | TopNav, BottomNavBar, PageContainer |
| shared/lib | shared | inbound | YES | hideLaunchSplash, iosProdDebugger, resolveRealm |
| shared/config | shared | inbound | YES | releaseFlags |
| state/identity | state | inbound | YES | identityContext, identityStorage, clearAllIdentityStorage |
| services/supabase | service | inbound | YES | supabaseClient used in AuthProvider |
| react-router-dom | external | inbound | YES | useRoutes, Navigate, Outlet, useLocation |
| All feature screens | feature | inbound (lazy) | YES | All screens lazy-imported via lazyApp.jsx and lazyPublic.jsx |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| Supabase session | read (hydration) | supabase auth | AuthProvider | Session state drives entire app gate |
| user (AuthContext) | read | AuthProvider | ProtectedRoute, all consumers of useAuth() | Stale session risk on TOKEN_REFRESHED |
| RECOVERY_FLAG_KEY (sessionStorage) | read/write | AuthProvider | setNewPassword.controller.js | Client-side only — VENOM-AUTH-001 documented inline |
| identityLoading (identityContext) | read | state/identity | RootLayout (launch splash gate) | |
| releaseFlags | read | shared/config | app.routes.jsx (feature gating) | |
| resolveRealm() | read | shared/utils | routes/index.jsx (Wanders realm) | |

No write surfaces detected by scanner — correct for a shell module.

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | READY | 50+ named routes mapped across public + protected trees | |
| Loading state | READY | ProtectedRoute returns null during auth loading; consentLoading returns null | Flash of null possible on slow networks |
| Empty state | PARTIAL | 404 wildcard redirects to /login or /feed | No dedicated 404 screen |
| Error state | READY | RouteErrorBoundary wraps entire route tree | |
| Auth/owner gates | READY | ProtectedRoute (auth+consent+email), ProfileGatedOutlet (profile), BlockedVportGuard, OwnerOnlyDashboardGuard | |
| Cache behavior | PARTIAL | TOKEN_REFRESHED guard prevents unnecessary re-renders; no service worker or route-level caching | |
| Runtime dependencies | READY | iOS platform hooks apply markers on mount, clean up on unmount | |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/app/BEHAVIOR.md | PRESENT (PLACEHOLDER — not a real spec) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING (VENOM-AUTH-001 noted inline in source but no formal audit) |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | iOS adaptation present in platform/ios/ but no Falcon audit |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a placeholder | HIGH | No formal behavior contract exists; guards, auth flow, and consent gate behavior are not specified anywhere | LOGAN |
| Zero tests | HIGH | AuthProvider, ProtectedRoute, ProfileGatedOutlet are untested; auth regressions cannot be caught automatically | SPIDER-MAN |
| No 404 / unmatched route screen | MEDIUM | Wildcard * redirects to /login; users hitting dead links get no feedback | IRONMAN |
| VENOM-AUTH-001 — recovery nonce is client-side only | MEDIUM | Documented inline but no formal security ticket or VENOM audit covering this finding | VENOM |
| Falcon (iOS parity) audit missing | LOW | iOS platform adaptation (useIOSPlatform, useIOSKeyboard, IosInstallPrompt) has no governance record | FALCON |
| No CURRENT_STATUS.md before this run | LOW | Status tracking gap | ARCHITECT |

---

## MODULE BOUNDARY WARNINGS

The `app` module imports directly from `features/legal/adapters/legal.adapter`, `features/auth/adapters/auth.adapter`, and `features/dashboard/vport/adapters/vport.adapter`. All three imports go through the adapter boundary — this is the approved cross-feature access pattern and is not a violation.

`state/identity/identityContext` and `state/identity/identityStorage` are consumed directly by `RootLayout` and `AuthProvider`. The `state/` layer is a platform-area sibling of `app/` — this is an approved intra-platform dependency.

No boundary violations detected in static scan.

---

## SPAGHETTI SCORE

**Module:** app
**Score:** CLEAN
**Reasons:** The module has clear responsibilities (router, auth provider, guards, layout, iOS bootstrap). All cross-feature access is through adapters. No DAL, model, or controller code exists here (correct for a shell). The route tree is well-organized into public/protected/learning sub-files. The recovery nonce inline comment is verbose but appropriate given the security nuance.
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER

**Check A (Source without behavior):** FAIL — source files exist and are substantial; BEHAVIOR.md contains no real spec. A full behavior contract must be written covering auth session hydration, recovery flow, consent gate, profile gate, route access control, and iOS bootstrap.

**Check B (Behavior without source):** N/A — BEHAVIOR.md is a placeholder with no declared happy paths.

**Check C (§13 engine consistency):** Scanner declares engines: chat, identity, learning, menu, notification, profile. Source confirms: identity (useIdentity in RootLayout), notification/chat/profile/menu via lazy-imported feature screens. No engine import detected for chat or notification directly in app/ source — these are consumed inside feature screens, not in the shell itself. This is correct architecture.

**Check D (§6 data change consistency):** Scanner reports 0 write surfaces. Source confirms: AuthProvider writes to sessionStorage (recovery flag, identity debug keys) and localStorage (actor_kind, actor_vport_id, actor_touch), but no Supabase DB writes. This is consistent — session and local storage mutations are not DB write surfaces.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write real BEHAVIOR.md | PLACEHOLDER has no spec — auth flow, guard chain, consent gate, iOS bootstrap all need documentation | LOGAN |
| P1 | Add auth provider + guard tests | AuthProvider and ProtectedRoute are zero-tested; any auth regression is invisible | SPIDER-MAN |
| P2 | Open formal VENOM ticket for VENOM-AUTH-001 | Recovery nonce documented inline but no tracking ticket or mitigation plan exists | VENOM |
| P3 | Falcon iOS parity audit | useIOSPlatform / useIOSKeyboard / IosInstallPrompt have no governance record | FALCON |

## RECOMMENDED HANDOFFS
- LOGAN — BEHAVIOR.md must be written from source
- SPIDER-MAN — Auth provider and guard test coverage
- VENOM — Formalize VENOM-AUTH-001 (recovery nonce client-side bypass)
- FALCON — iOS parity audit for platform/ios/ module

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
