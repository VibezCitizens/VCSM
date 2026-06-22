---
name: vcsm.shared.architecture
description: ARCHITECT V2 module architecture report for VCSM:shared
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-06
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** shared
**Application Scope:** VCSM
**Module Type:** shared
**Primary Root:** apps/VCSM/src/shared
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The shared module is the VCSM-scoped utility and UI layer — a collection of cross-cutting primitives that are consumed by every feature without belonging to any single feature domain. It provides: platform-wide layout components (BottomNavBar, TopNav, PageContainer, PublicNavbar), shared React hooks (breakpoint detection, push notifications, geolocation), pure utility libraries (TTL cache, QR URL builders, timestamp formatting, image compression), realm resolution, and feature release flags. It sits below the feature layer and above the engines layer — it consumes identity and profile engines but exposes no domain logic of its own.

## OWNERSHIP

Owned by platform engineering (no single feature team). Shared primitives must be approved before new files are added. The BottomNavBar component is the primary lifecycle mount point — it owns OneSignal initialization and bootstrap hydration. The `config/releaseFlags.js` file is the canonical feature-flag source.

## ENTRY POINTS

- `BottomNavBar` — persistent shell component, mounts at app root, owns push notifications and hydration bootstrap
- `TopNav` — persistent header component, mounts at app root, owns Void toggle
- `PublicNavbar` / `PublicNavbarMobileMenu` — unauthenticated surface entry points
- `shared/lib/*` — exported as utility imports to any feature
- `shared/hooks/*` — exported as utility hooks to any feature
- `shared/config/releaseFlags.js` — imported by dashboard/vport card rendering to gate feature display
- `shared/utils/resolveRealm.js` — imported by features needing realm ID resolution (Void vs Public)

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 0 | N/A — no database access |
| Model | 0 | N/A |
| Controller | 0 | N/A |
| Service | 0 | N/A |
| Adapter | 0 | N/A |
| Hook | 9 | useOneSignalPush.js, useDesktopBreakpoint.js, useUserLocation.js, useIOSKeyboardLock.js |
| Component | 35 | BottomNavBar.jsx, TopNav.jsx, ActorLink.jsx, PublicNavbar.jsx, PageContainer.jsx, Skeleton.jsx, Spinner.jsx, Tabs.jsx, Toast.jsx, BackHeader.jsx |
| Screen | 0 | N/A |
| Barrel | 1 | shared/index.js (auto-generated, minimal) |

Note: cg_layerCounts reports 35 components, 9 hooks, 45 modules, 1 barrel. The module count (45) reflects re-exports and sub-module groupings. fm_layerCounts reports 18 components, 18 modules, 5 hooks, 1 style file. Total source files: 42.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Inferred from source — no BEHAVIOR.md description | BEHAVIOR.md is a stub (Status: PLACEHOLDER) |
| Owner defined | FAIL | No ownership record | No team or lead defined anywhere |
| Entry points mapped | PASS | BottomNavBar, TopNav, PublicNavbar confirmed in source | |
| Controllers present/delegated | N/A | Shared layer has no controllers by design | |
| DAL/repository present/delegated | N/A | Shared layer has no DAL by design | |
| Models/transformers present | N/A | Shared layer has no models by design | |
| Hooks/view models present | PASS | 9 hooks (cg count) — useOneSignalPush, useDesktopBreakpoint, useUserLocation, useIOSKeyboardLock confirmed | |
| Screens/components present | PASS | 35 components confirmed (cg count) | |
| Services/adapters present | N/A | No adapters in shared layer | |
| Database objects mapped | PASS | No write surfaces — correct for a shared utility layer | |
| Authorization path mapped | PARTIAL | useOneSignalPush consumes useAuth + useIdentity; no direct auth checks in components | Auth dependency via hook imports only |
| Cache/runtime behavior mapped | PASS | createTTLCache confirmed in lib/ttlCache.js; sessionStorage usage in useUserLocation confirmed | |
| Error/loading/empty states mapped | PARTIAL | Spinner.jsx and Skeleton.jsx present for loading states; error states not formally documented | |
| Documentation linked | FAIL | BEHAVIOR.md present but is a PLACEHOLDER stub — no content | |
| Tests/validation noted | FAIL | 0 tests (scanner confirmed) | No test coverage on any shared utility |
| Native parity noted | N/A | No native parity requirement for shared utilities | |
| Engine dependencies mapped | PASS | identity, menu, profile engines declared in scanner; useOneSignalPush imports identity adapter confirmed in source | |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/identity | engine | inbound | YES | useOneSignalPush imports identity adapter; BottomNavBar imports identity adapter |
| engines/profile | engine | inbound | YES | BottomNavBar imports getCachedActorCanonicalSlug from profiles controller |
| engines/menu | engine | inbound | YES | Scanner-declared; consumption pattern similar to identity |
| @/bootstrap | platform-area | inbound | YES | BottomNavBar imports useBootstrapHydration and bootstrap.selectors |
| @/services/onesignal | service | inbound | YES | useOneSignalPush wraps onesignalClient service |
| @/services/supabase | service | inbound | YES | useUserLocation calls readSupabaseAccessToken |
| @/app/providers/AuthProvider | platform-area | inbound | YES | useOneSignalPush consumes useAuth |
| features/profiles (controller) | feature | inbound | WATCH | BottomNavBar imports directly from profiles controller — not via adapter |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| PUBLIC_REALM_ID | read (env var) | shared/utils/resolveRealm.js | features needing realm resolution | LOW — env-var backed, fallback hardcoded |
| VOID_REALM_ID | read (env var) | shared/utils/resolveRealm.js | features needing void realm | LOW |
| releaseFlags | read (env var) | shared/config/releaseFlags.js | dashboard card rendering | MEDIUM — controls feature visibility; flag misconfiguration hides features |
| TTL cache instance | runtime (in-memory) | createTTLCache (lib) | any feature | LOW — stateless factory, no shared mutable state |
| sessionStorage (vc:lastLocationText) | read/write | useUserLocation | settings/profile screens | LOW |
| OneSignal SDK (external) | runtime | useOneSignalPush | BottomNavBar | MEDIUM — external SDK dependency, must init exactly once |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | N/A | Shared layer has no routes | |
| Loading state | PASS | Spinner.jsx, Skeleton.jsx present | |
| Empty state | PARTIAL | No dedicated empty state components — callers manage this | |
| Error state | PARTIAL | useUserLocation manages error state internally; no shared error boundary | |
| Auth/owner gates | PASS | useOneSignalPush gates on user + identity before OneSignal login | |
| Cache behavior | PASS | createTTLCache with configurable TTL; useUserLocation uses sessionStorage TTL | |
| Runtime dependencies | WATCH | BottomNavBar must mount exactly once (OneSignal init); useDesktopBreakpoint has SSR guard; useUserLocation requires geolocation API | |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/shared/BEHAVIOR.md | PRESENT (STUB) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | N/A | N/A — no database objects |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a placeholder stub | HIGH | Core governance doc missing — no declared behavior, happy paths, or security notes for the most widely consumed module in VCSM | LOGAN |
| Zero test coverage | HIGH | 0 tests on utility functions used by every feature; createTTLCache, qrUrlBuilders, resolveRealm, releaseFlags are all untested | SPIDER-MAN |
| BottomNavBar imports profiles controller directly | MEDIUM | BottomNavBar at shared/components imports getCachedActorCanonicalSlug from features/profiles/controller — bypasses adapter boundary | ARCHITECT / IRONMAN |
| No ownership record | MEDIUM | No team or DRI assigned; shared primitives can drift without clear ownership | IRONMAN |
| console.error calls in useUserLocation and useOneSignalPush | LOW | Production console output violates no-console rule (debug logging must be dev-only); not gated by DEV flag | ELEKTRA / VENOM |
| useIOSKeyboardLock not read in this scan | LOW | File exists but not read — may have additional dependencies or side effects not captured | ARCHITECT (future scan) |

---

## MODULE BOUNDARY WARNINGS

1. **BottomNavBar → profiles controller (direct import):** `BottomNavBar.jsx` imports `getCachedActorCanonicalSlug` directly from `@/features/profiles/controller/buildActorCanonicalSlug.controller`. This is a cross-feature controller import that bypasses the profiles adapter boundary. The correct path is to expose this utility through the profiles adapter.

2. **useUserLocation → console.error:** Two unconditioned `console.error` calls found in useUserLocation.js — these fire in production, violating the platform no-console rule.

3. **useOneSignalPush — mount-once requirement:** The hook must be mounted exactly once (in BottomNavBar). If mounted elsewhere concurrently, OneSignal may double-initialize. This constraint is documented in comments but not enforced by code.

---

## SPAGHETTI SCORE

**Module:** shared
**Score:** WATCH
**Reasons:** The shared layer itself is well-structured (pure components, pure hooks, pure lib utilities, no DAL/model/controller bloat). However, BottomNavBar has grown complex — it mounts hydration, OneSignal, badge counts, and slug navigation in one component. One confirmed adapter boundary violation (profiles controller direct import). No tests on any utility.
**Release risk:** LOW-MEDIUM

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no behavior defined

**Check A (Source without behavior):** FAIL — BEHAVIOR.md is a stub; source exists and is active but no behavior is documented
**Check B (Behavior without source):** N/A — BEHAVIOR.md has no §3 happy paths to check against source
**Check C (§13 engine consistency):** PARTIAL — scanner declares engines: identity, menu, profile. Source confirms identity and profile engine imports. Menu engine not directly confirmed in files read, but plausible from scanner dependency map.
**Check D (§6 data change consistency):** PASS — scanner reports zero write surfaces; source scan confirms no DAL files and no Supabase mutations in shared layer.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write real BEHAVIOR.md content | Most widely consumed module has no documented behavior contract | LOGAN |
| P2 | Fix BottomNavBar → profiles controller boundary violation | Direct cross-feature controller import bypasses adapter contract | IRONMAN |
| P2 | Add tests for createTTLCache, qrUrlBuilders, resolveRealm, releaseFlags | Zero test coverage on utilities consumed by 20+ features | SPIDER-MAN |
| P3 | Gate console.error calls in useUserLocation and useOneSignalPush to DEV only | Production console output violation | ELEKTRA |

## RECOMMENDED HANDOFFS

- **LOGAN** — write BEHAVIOR.md content from this architecture scan
- **IRONMAN** — assign ownership, resolve BottomNavBar adapter boundary violation
- **SPIDER-MAN** — add unit tests for shared lib utilities
- **ELEKTRA** — audit console.error calls in hooks for production safety
- **VENOM** — verify useUserLocation edge function call uses auth token correctly (no SSRF surface)

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

---

## Targeted Scan — Bottom Navigation Bar (2026-06-06)

Full targeted scan of BottomNavBar module. New findings vs 2026-06-04:

**FINDING-BOTNAV-003 (NEW):** RootLayout imports `useIdentity` directly from
`@/state/identity/identityContext` — bypasses `@/features/identity/adapters/identity.adapter`.
Severity: LOW-MEDIUM. Fix: update import path in RootLayout.jsx.

**FINDING-BOTNAV-004 (NEW):** `noti:refresh` DOM event string is untyped — no
named constant, no typed contract. Severity: LOW. Fix: extract to const in bootstrap module.

**FINDING-BOTNAV-001 (CLASSIFIED):** Dual responsibility (nav UI + platform bootstrap
host) documented as MEDIUM structural concern. Bootstrap concern should eventually
move to a dedicated `<PlatformBootstrapShell>` component.

**FINDING-BOTNAV-002 (CONFIRMED OPEN):** BottomNavBar → profiles controller direct
import remains unresolved. P2 priority. Ticket still open per 2026-06-04 run.

**i18n engine (NEW):** `@i18n` (engines/i18n) import confirmed in BottomNavBar — not
declared in prior scanner engine-candidates. LOGAN doc update needed.

Full module report:
`ZZnotforproduction/APPS/VCSM/features/shared/outputs/2026/06/06/ARCHITECT/vcsm.bottom-nav.architecture.md`
