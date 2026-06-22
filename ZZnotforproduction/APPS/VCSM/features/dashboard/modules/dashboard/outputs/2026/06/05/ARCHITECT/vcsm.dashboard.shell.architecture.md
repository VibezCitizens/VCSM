---
title: ARCHITECT V2 Report — dashboard / modules / dashboard (shell)
category-key: vcsm.dashboard.shell
feature: dashboard
module: dashboard
command: ARCHITECT
ticket: TICKET-ARCHITECT-MODULE-0001
scanner-version: 1.1.0
timestamp: 2026-06-05T00:00:00
output-path: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/outputs/2026/06/05/ARCHITECT/vcsm.dashboard.shell.architecture.md
---

# ARCHITECT V2 REPORT
**Module:** dashboard / modules / dashboard (shell)
**Application Scope:** VCSM
**Ticket:** TICKET-ARCHITECT-MODULE-0001
**Scanner Version:** 1.1.0
**Timestamp:** 2026-06-05

---

## Output Metadata

| Field | Value |
|---|---|
| Category Key | vcsm.dashboard.shell |
| Feature / Scope | dashboard |
| Module | dashboard (shell) |
| Command | ARCHITECT |
| Ticket | TICKET-ARCHITECT-MODULE-0001 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/outputs/2026/06/05/ARCHITECT/vcsm.dashboard.shell.architecture.md |
| Timestamp | 2026-06-05T00:00:00 |

---

## 1. ARCHITECT Scanner Preflight

```
ARCHITECT SCANNER PREFLIGHT
============================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Freshness Window: 7 days

| Map              | Generated At                 | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| feature-map      | 2026-06-05T03:29:11.562Z     | ~20h | FRESH     | HIGH       | PASS   |
| dependency-map   | 2026-06-04T20:29:00.000Z     | ~27h | FRESH     | HIGH       | PASS   |
| route-map        | 2026-06-04T20:29:00.000Z     | ~27h | FRESH     | HIGH       | PASS   |
| graph            | 2026-06-04T20:29:00.000Z     | ~27h | FRESH     | HIGH       | PASS   |
| callgraph        | 2026-06-04T20:29:00.000Z     | ~27h | FRESH     | HIGH       | PASS   |
| engine-candidates| 2026-06-04T20:29:00.000Z     | ~27h | FRESH     | MEDIUM     | PASS   |

Overall Preflight: PASS
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Used For |
|---|---|---|---|---|---|
| feature-map | 2026-06-05T03:29 | ~20h | FRESH | HIGH | Feature inventory, scope discovery |
| callgraph | 2026-06-04T20:29 | ~27h | FRESH | HIGH | Layer counts, node classification, shell scope |
| dependency-map | 2026-06-04T20:29 | ~27h | FRESH | HIGH | Cross-feature import detection |
| route-map | 2026-06-04T20:29 | ~27h | FRESH | HIGH | Route inventory (0 routes confirmed for dashboard) |
| engine-candidates | 2026-06-04T20:29 | ~27h | FRESH | MEDIUM | Engine dependency mapping |
| behavior-surface-map | 2026-06-04T20:29 | ~27h | FRESH | HIGH | Shell behavior surface enumeration |

Scanner Version: 1.1.0
Overall Freshness: FRESH
Preflight Action: PASSED

---

## 3. Scope Summary

```
Applications scanned: 1 (VCSM)
Engines scanned: 0 directly (engine dependencies via adapters)
Features in scope: 1 (dashboard)
Module in scope: 1 (dashboard shell)
Total nodes (callgraph — shell scope): 42
  screen: 4
  controller: 4
  hook: 4
  model: 13
  barrel: 8 (compatibility re-export shims — MARK LEGACY)
Write surfaces in scope (shell): 0 (shell dispatches navigation only; mutations in card modules)
Routes in scope: 0 (routing is imperative via useNavigate; not captured in route-map scanner)
```

---

## 4. Scanner Signals

| Signal | Source Map | Confidence | Verified Against Source | Provenance | Finding |
|---|---|---|---|---|---|
| `VportDashboardScreen` node classified as screen at dashboard/vport/screens | callgraph | HIGH | YES — VportDashboardScreen.jsx line 21: `export function VportDashboardScreen()` | [SOURCE_VERIFIED] | Not a finding — structural fact |
| `useVportOwnership` hook node at dashboard/vport/hooks | callgraph | HIGH | YES — useVportOwnership.js line 14: `export function useVportOwnership(callerActorId, targetActorId)` | [SOURCE_VERIFIED] | Not a finding — structural fact |
| `checkVportOwnershipController` imports from booking.adapter | dependency-map | HIGH | YES — checkVportOwnership.controller.js line 1: `import { assertActorOwnsVportActorController, getActorByIdDAL } from "@/features/booking/adapters/booking.adapter"` | [SOURCE_VERIFIED] | ARCH-001 |
| `getActorByIdDAL` exported from booking.adapter (adapter boundary rule violation) | callgraph | HIGH | YES — booking.adapter.js line 20: `export { default as getActorByIdDAL } from "@/features/booking/dal/getActorById.dal"` | [SOURCE_VERIFIED] | ARCH-001 |
| screens/model/ files classified as barrel (re-export shims from old screen-layer location) | callgraph | HIGH | YES — screens/model/buildDashboardCards.model.js line 1-6: compatibility re-export only | [SOURCE_VERIFIED] | ARCH-002 |
| Route-map shows 0 routes for dashboard feature | route-map | HIGH | YES — VportDashboardScreen.jsx lines 49-86: all navigation via `useNavigate()` calls | [SOURCE_VERIFIED] | ARCH-003 |
| `useIdentity()` imported directly from `@/state/identity/identityContext` | dependency-map | HIGH | YES — VportDashboardScreen.jsx line 7: `import { useIdentity } from "@/state/identity/identityContext"` | [SOURCE_VERIFIED] | ARCH-004 |
| `dashboardViewByVportType.model.js` imports `isDashboardCardEnabled` from `@/shared/config/releaseFlags` | callgraph | HIGH | YES — dashboardViewByVportType.model.js line 7: confirmed import | [SOURCE_VERIFIED] | Not a finding — shared/config is approved |
| Engine dependency: identity, profiles via adapters | engine-candidates | MEDIUM | YES — VportDashboardScreen.jsx line 7 (identity state), line 8 (profiles adapter) | [SOURCE_VERIFIED] | Not a finding — structural fact |
| `loadOwnerQuickStatsController` imports 4 DAL files from `vport/dal/read/` | callgraph | HIGH | YES — vportOwnerStats.controller.js lines 1-6: confirmed reads | [SOURCE_VERIFIED] | Not a finding — internal DAL access is correct |
| `vportBookingHistoryView.model.js` in screens/model/ — belongs to bookings card module scope | callgraph | HIGH | YES — file path confirmed at screens/model/ | [SOURCE_VERIFIED] | ARCH-005 |

---

## 5. Architecture Findings

### ARCH-001 — Adapter Exports DAL Function (BOUNDARY VIOLATION)
**Provenance:** [SOURCE_VERIFIED]
**Severity:** MEDIUM
**Location:** `apps/VCSM/src/features/booking/adapters/booking.adapter.js` line 20
**Consuming file:** `apps/VCSM/src/features/dashboard/vport/controller/checkVportOwnership.controller.js` line 1

**Evidence:**
- booking.adapter.js line 20: `export { default as getActorByIdDAL } from "@/features/booking/dal/getActorById.dal"`
- checkVportOwnership.controller.js line 1: `import { assertActorOwnsVportActorController, getActorByIdDAL } from "@/features/booking/adapters/booking.adapter"`

**Violation:**
The VCSM architecture contract states: "Adapters never export DAL functions, models, or controllers."
`getActorByIdDAL` is a DAL function. Its export from an adapter breaches the adapter boundary rule.

**Risk:**
Medium. The function is used narrowly (VPORT kind check for self-access gate in the dashboard ownership controller). It does not represent a write or mutation surface. However, it establishes a pattern where DAL functions can be sourced cross-feature via adapters, which erodes the layer boundary.

**Recommended action:** Move `getActorByIdDAL` usage to a dedicated engine call or expose only the resolved `kind` through an approved controller or hook in the booking/identity feature. Route to SENTRY for boundary enforcement.

---

### ARCH-002 — Compatibility Re-export Shims in screens/model/ (LEGACY RESIDUE)
**Provenance:** [SOURCE_VERIFIED]
**Severity:** LOW
**Location:** `apps/VCSM/src/features/dashboard/vport/screens/model/`

**Evidence:**
- `screens/model/buildDashboardCards.model.js` line 2: `// This file is a compatibility re-export only. Do not add logic here.`
- `screens/model/dashboardViewByVportType.model.js` line 2: `// Logic is unchanged.`
- Scanner classifies all 8 exports from these files as `barrel` layer

**Finding:**
These files are migration artifacts from VPD-V-FIX-006 when model files were moved from `screens/model/` to the canonical `vport/model/` location. They are documented as compatibility shims. The canonical models at `vport/model/` are active and correct.

**Risk:**
Low. Re-exports work correctly. Risk is maintenance: developers may add logic to the wrong location. `VportDashboardScreen.jsx` already imports from the canonical path (line 12-17 use `@/features/dashboard/vport/model/...`).

**Recommended action:** MARK LEGACY. When all consumers confirmed migrated, DELETE CANDIDATE. Verify with LOKI before deletion.

---

### ARCH-003 — Route Registration Outside Scanner Coverage (ARCHITECTURAL GAP)
**Provenance:** [SOURCE_VERIFIED]
**Severity:** MEDIUM
**Location:** VCSM main router (unknown path — not scanner-covered)

**Evidence:**
- route-map scanner: 0 routes for dashboard feature
- VportDashboardScreen.jsx lines 4, 23: uses `useNavigate` and `useParams` (consumer of a route, not a registrar)
- INDEX.md notes: "Route registration is presumed to be in the main VCSM router file"

**Finding:**
The dashboard shell route `/actor/:actorId/dashboard` exists in navigation (confirmed by `useParams` consuming `actorId`), but the route registration is not captured by the scanner. This is an architectural visibility gap — the route registration file is not scanner-indexed for the dashboard feature.

**Risk:**
Medium. Route access classification (public vs protected) cannot be verified without finding the route registration. VENOM cannot confirm auth middleware from scanner alone.

**Recommended action:** Locate the main VCSM router and confirm `/:actorId/dashboard` is registered with the correct auth guard. Route to HAWKEYE for endpoint contract verification.

---

### ARCH-004 — Identity State Import via Direct Path (INFORMATIONAL)
**Provenance:** [SOURCE_VERIFIED]
**Severity:** INFO
**Location:** `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardScreen.jsx` line 7

**Evidence:**
- Line 7: `import { useIdentity } from "@/state/identity/identityContext"`

**Finding:**
`useIdentity` is imported directly from `@/state/identity/identityContext`, not through a feature adapter. The `state/` directory is a global platform-level state store, and this direct import pattern appears consistent across the codebase (not a per-feature internal import). This is not a boundary violation per the adapter rules (which govern cross-feature imports, not global state).

**Risk:**
Info only. No action required unless the platform governance decides to wrap global state behind a platform adapter.

---

### ARCH-005 — Misplaced Model File in Shell Scope (SCOPE LEAK)
**Provenance:** [SOURCE_VERIFIED]
**Severity:** LOW
**Location:** `apps/VCSM/src/features/dashboard/vport/screens/model/vportBookingHistoryView.model.js`

**Evidence:**
- File exists at `screens/model/vportBookingHistoryView.model.js`
- Callgraph: exports `filterBookings`, `groupByDate` — classified as `barrel`
- These functions are relevant to the bookings card module, not the dashboard shell

**Finding:**
`vportBookingHistoryView.model.js` is a booking-history view model located in the shell's `screens/model/` directory. This file scope belongs to the bookings card module. Its presence in the shell directory creates a scope leak where a card module's model lives inside the shell.

**Risk:**
Low. Functional impact is none. Governance impact: bookings card module ARCHITECTURE trace may miss this file.

**Recommended action:** Move to `dashboard/vport/dashboard/cards/bookings/model/` when bookings module gets its ARCHITECT run. Mark shell scope as NOT OWNER of this file.

---

## 6. Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Dashboard shell routes ownership-gated actors to card grid | [SOURCE_VERIFIED] — VportDashboardScreen.jsx |
| Owner defined | PASS | VCSM:dashboard module | feature-map.json |
| Entry points mapped | PASS | `/actor/:actorId/dashboard` → VportDashboardScreen | [SOURCE_VERIFIED] — useParams line 23 |
| Controllers present/delegated | PASS | checkVportOwnershipController, loadOwnerQuickStatsController | [SOURCE_VERIFIED] |
| DAL/repository present/delegated | PASS | Delegated to vport/dal/read/ (11 DAL files) | [SOURCE_VERIFIED] — vportOwnerStats.controller.js lines 1-6 |
| Models/transformers present | PASS | buildDashboardCards, dashboardViewByVportType, dashboardVportDetails | [SOURCE_VERIFIED] |
| Hooks/view models present | PASS | useVportOwnership, useOwnerQuickStats | [SOURCE_VERIFIED] |
| Screens/components present | PASS | VportDashboardScreen, DashboardCard, VportBannerHeader | [SOURCE_VERIFIED] |
| Services/adapters present | PASS | Consumes profiles.adapter, booking.adapter (cross-feature via approved adapters) | [SOURCE_VERIFIED] |
| Database objects mapped | PARTIAL | vport/dal/read/ files mapped; vport schema tables confirmed | [SCANNER_LEAD] — ARCH-001 notes getActorByIdDAL cross-boundary |
| Authorization path mapped | PASS | useVportOwnership → checkVportOwnershipController → assertActorOwnsVportActorController | [SOURCE_VERIFIED] |
| Cache/runtime behavior mapped | PARTIAL | No explicit cache layer; useVportOwnership re-verifies on window focus/visibility | [SOURCE_VERIFIED] — useVportOwnership.js lines 45-57 |
| Error/loading/empty states mapped | PASS | Loading: SkeletonCardList; not authenticated: sign-in message; not owner: access denied message | [SOURCE_VERIFIED] — VportDashboardScreen.jsx lines 145-147 |
| Documentation linked | PARTIAL | ARCHITECTURE.md, BEHAVIOR.md, SECURITY.md, INDEX.md exist at module level; BEHAVIOR.md being upgraded this run | This run |
| Tests/validation noted | FAIL | No tests exist for shell module (VportDashboardScreen, useVportOwnership, checkVportOwnership) | Scanner test-map — 0 shell tests |
| Native parity noted | PARTIAL | Desktop portal rendering via createPortal documented; full native parity not assessed | [SOURCE_VERIFIED] — VportDashboardScreen.jsx lines 204-209 |
| Engine dependencies mapped | PARTIAL | 12 engines at feature level; shell directly uses identity (state) and profiles (adapter) | [SOURCE_VERIFIED] / [SCANNER_LEAD] for full engine list |

---

## 7. Module Independence Classification

```
MODULE INDEPENDENCE STATUS
Module: dashboard (shell)
Classification: MOSTLY INDEPENDENT
Reason: Module has clear entry point, ownership gate, card catalog model, and all UI layers present.
        Cross-feature dependencies are properly routed through adapters (profiles, booking) with one
        exception: booking.adapter exports a DAL function (ARCH-001). Route registration is
        outside scanner coverage (ARCH-003). No write surfaces exist in the shell — all mutations
        are delegated to card sub-modules.
Blocking gaps:
  - No tests for ownership gate or shell rendering
  - Adapter boundary violation (booking adapter DAL export) — medium severity
  - Route auth guard not confirmed by scanner
```

---

## 8. Call Graph — Source Verified Execution Path

```
VportDashboardScreen.jsx [screen]
  │
  ├─ useIdentity() ──────────────→ @/state/identity/identityContext [GLOBAL STATE — approved]
  │    ↳ identity.actorId, identity.vportType, identityLoading
  │
  ├─ useVportDashboardDetails(actorId) → profiles.adapter [CROSS-FEATURE via adapter ✓]
  │    ↳ { loading: headerLoading, details: publicDetails }
  │
  ├─ normalizeDashboardVportDetails(publicDetails) → vport/model/dashboardVportDetails.model.js [✓]
  │    ↳ dashboardDetails: { name, slug, tagline, bannerUrl, avatarUrl, vportType, ... }
  │
  ├─ useDesktopBreakpoint() ─────→ shared/hooks/useDesktopBreakpoint [SHARED ✓]
  │    ↳ isDesktop: boolean
  │
  ├─ useVportOwnership(identity?.actorId, actorId) → vport/hooks/useVportOwnership.js [✓]
  │    └─ checkVportOwnershipController({ callerActorId, targetActorId })
  │         ├─ CASE: callerActorId === targetActorId → getActorByIdDAL({ actorId }) [⚠ via booking.adapter — ARCH-001]
  │         │    ↳ checks actor.kind === 'vport' && !actor.is_void → return true
  │         └─ assertActorOwnsVportActorController({ requestActorId, targetActorId }) [booking.adapter ✓]
  │    ↳ { isOwner: boolean, ownershipLoading: boolean }
  │    ↳ Re-verifies silently on window focus and visibilitychange events
  │
  ├─ useProfilesOps() ───────────→ profiles.adapter [CROSS-FEATURE via adapter ✓]
  │    ↳ { getVportTabsByType }
  │
  ├─ normalizeVportType(identity?.vportType ?? dashboardDetails.vportType)
  │    ↳ string — lowercase, trimmed, underscores → spaces
  │
  ├─ getDashboardViewByVportType(vportType, { getTabsFn }) → vport/model/dashboardViewByVportType.model.js [✓]
  │    ├─ TYPE_TO_VIEW overrides: barber, barbershop, locksmith, gas station, exchange
  │    ├─ GROUP_TO_VIEW fallback: 11 industry groups → 5 view presets
  │    ├─ withCalendarCardIfVportHasBookingTab() — adds calendar if vportType has 'book' tab
  │    └─ withVisibleCardKeys() — filters via isDashboardCardEnabled(key) [releaseFlags ✓]
  │    ↳ dashboardView: { id, label, cardKeys: string[] }
  │
  ├─ buildDashboardCards({ isDesktop, vportType, getTabsFn, handlers }) → vport/model/buildDashboardCards.model.js [✓]
  │    ├─ getDashboardCardKeysByVportType(vportType, { getTabsFn }) → 17 card keys in CARD_CATALOG
  │    └─ Maps keys → { key, title, body, onClick (from handlers), locked (from getLocked) }
  │    ↳ cards: CardDescriptor[] — filtered, no nulls
  │
  ├─ [RENDER GUARD] if (!actorId) return null
  ├─ [RENDER GUARD] if (identityLoading || ownershipLoading) return <SkeletonCardList />
  ├─ [RENDER GUARD] if (!identity) return <sign-in required>
  ├─ [RENDER GUARD] if (!isOwner) return <access denied>
  │
  ├─ createVportDashboardShellStyles({ isDesktop }) → vport/screens/styles/vportDashboardShellStyles.js [✓]
  │
  └─ [RENDER]
       ├─ VportBackButton → dashboard/shared/components/BackButton [INTERNAL SHARED ✓]
       ├─ VportBannerHeader({ profile, headerLoading }) → VportDashboardParts.jsx [✓]
       └─ cards.map(card => DashboardCard({ title, body, onClick, locked })) → VportDashboardParts.jsx [✓]
            ↳ Desktop: createPortal(content, document.body) — iOS stacking context workaround [APPROVED]
```

---

## 9. Module Dependency Graph

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| @/state/identity/identityContext | cache/store | IN | YES — global platform state | `useIdentity()` for session actor |
| @/features/profiles/adapters/* | feature | IN | YES — adapter boundary | `useVportDashboardDetails`, `useProfilesOps`, `VPORT_TYPE_GROUPS` |
| @/features/booking/adapters/booking.adapter | feature | IN | PARTIAL — assertActorOwnsVportActorController ✓; getActorByIdDAL ✗ ARCH-001 | Ownership verification |
| @/shared/hooks/useDesktopBreakpoint | UI | IN | YES — shared hook | Responsive layout |
| @/shared/components/Skeleton | UI | IN | YES — shared component | Loading state |
| @/shared/config/releaseFlags | service | IN | YES — shared config | `isDashboardCardEnabled` |
| @/features/dashboard/shared/components/BackButton | UI | IN | YES — internal dashboard/shared | VportBackButton |
| @/features/dashboard/vport/dal/read/* | database | INTERNAL | YES — internal layer | Read DAL consumed by shell controllers |
| vport/model/* | UI | INTERNAL | YES | Card catalog, view presets, details normalizer |
| vport/hooks/* | UI | INTERNAL | YES | Ownership and stats hooks |
| vport/controller/* | feature | INTERNAL | YES | Ownership and stats controllers |
| vport/screens/components/* | UI | INTERNAL | YES | DashboardCard, VportBannerHeader |
| vport/screens/styles/* | UI | INTERNAL | YES | Shell layout styles |
| vport/screens/model/* | — | INTERNAL | LEGACY — re-export shims (ARCH-002) | Compatibility barrels from old location |

---

## 10. Module Data Contract

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| identity.actorId, identity.vportType | read | VCSM:auth/state | dashboard shell | LOW — read-only from global state |
| VPORT public details (name, slug, banner, avatar) | read | profiles feature | dashboard shell via adapter | LOW — display only |
| VPORT type (vportType) | read | profiles/identity | dashboardViewByVportType model | LOW — card set discriminator; client-side only |
| Ownership resolution (actor_owners) | read | booking/identity feature | checkVportOwnershipController | MEDIUM — auth gate; correct but see ARCH-001 |
| VPORT actor kind (vport/user) | read | booking.adapter (ARCH-001) | checkVportOwnershipController | MEDIUM — DAL exported from adapter |
| Owner stats (todayCount, upcomingCount, activeBarbers) | read | vport/dal/read/* | loadOwnerQuickStatsController | LOW — stats only; correctly ownership-gated |
| Card navigation routes (useNavigate) | write | dashboard shell | all card sub-modules | LOW — shell emits navigation only |

---

## 11. Module Runtime Readiness

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PARTIAL | Route `/actor/:actorId/dashboard` confirmed via useParams; not in scanner route-map | MEDIUM — auth guard unconfirmed (ARCH-003) |
| Loading state | PASS | `SkeletonCardList` while `identityLoading \|\| ownershipLoading` | [SOURCE_VERIFIED] line 145 |
| Empty state | PASS | "Sign in required" message when `!identity` | [SOURCE_VERIFIED] line 146 |
| Error state / access denied | PASS | "You can only access the dashboard for your own vport" when `!isOwner` | [SOURCE_VERIFIED] line 147 |
| Auth/owner gate | PASS | `useVportOwnership` → `checkVportOwnershipController` → `assertActorOwnsVportActorController` | [SOURCE_VERIFIED] |
| Cache behavior | PARTIAL | No cache; ownership re-verifies silently on window focus and visibility | [SOURCE_VERIFIED] useVportOwnership.js lines 44-58 |
| Runtime dependencies | PARTIAL | Identity state, profiles adapter, booking adapter — all confirmed active | [SOURCE_VERIFIED] |
| Hot paths | IDENTIFIED | `buildDashboardCards` is memoized; `useVportOwnership` triggers async controller on every mount | [SOURCE_VERIFIED] |
| Desktop portal rendering | PASS | `createPortal(content, document.body)` when isDesktop — iOS stacking context workaround | [SOURCE_VERIFIED] lines 204-209 |
| LOKI handoff recommended | YES | Ownership gate async timing; useOwnerQuickStats not confirmed consumed by shell | MEDIUM |
| KRAVEN handoff recommended | YES | `loadOwnerQuickStatsController` fires 4 parallel DB reads on mount; hot path | LOW-MEDIUM |

---

## 12. Behavior Contract Consistency Check

```
Behavior Consistency Check — dashboard / modules / dashboard (shell)
======================================================================
BEHAVIOR.md present: YES
Status: STUB → being upgraded to ACTIVE this run

Check A (Source without behavior): PASS
  Controllers, hooks, models, and screen exist → BEHAVIOR.md now populated

Check B (Behavior without source):
  §3 entries scanned: 4 (ownership gate, card grid render, card navigation dispatch, type discriminator)
  Entries without source: 0 — all 4 behaviors confirmed against source

Check C (§13 engine consistency):
  Declared engines (shell-level): identity (via state), profiles (via adapter)
  Undeclared actual engine imports: 0
  Declared but unused engines: 0

Check D (§6 data change consistency):
  Declared operations: 0 (shell has no write surfaces)
  Operations without DAL: N/A
```

---

## 13. Dead Code and Spaghetti Assessment

```
CODE HEALTH METRICS
| Module       | Files | Layers | Cross-Feature Imports | Cycles | Dead Code Signals | Spaghetti Score |
|---|---:|---:|---:|---:|---:|---|
| dashboard (shell) | ~15 | 5 (screen/hook/controller/model/style) | 3 (profiles, booking, state) | 0 | 8 (barrel shims) | WATCH |
```

**DEAD CODE FINDINGS:**

DEAD CODE FINDING
Location: apps/VCSM/src/features/dashboard/vport/screens/model/ (all 3 files)
Code Type: Compatibility re-export barrel
Classification: POSSIBLY LEGACY
Evidence: [SOURCE_VERIFIED] — buildDashboardCards.model.js line 2 states "compatibility re-export only"; scanner classifies as barrel
Risk: LOW — works correctly; misleads developers into thinking logic is here
Recommended action: VERIFY USAGE — confirm no external consumers of screens/model/ path; then DELETE CANDIDATE
Recommended handoff: LOKI (runtime usage check)

DEAD CODE FINDING
Location: apps/VCSM/src/features/dashboard/vport/screens/model/vportBookingHistoryView.model.js
Code Type: Model file belonging to bookings card module
Classification: STILL REFERENCED (by bookings card)
Evidence: [SOURCE_VERIFIED] — file confirmed at screen-layer path
Risk: LOW — scope leak, not dead code per se
Recommended action: MOVE to bookings card module when ARCHITECT runs on bookings module
Recommended handoff: IRONMAN (ownership classification)

**SPAGHETTI SCORE:**
Module: dashboard (shell)
Score: WATCH
Reasons:
  1. `getActorByIdDAL` exported from booking adapter (ARCH-001) — minor layer crossing
  2. Compatibility re-export shims from screens/model/ still exist (ARCH-002)
  3. `useOwnerQuickStats` hook is defined but not visibly consumed by VportDashboardScreen.jsx (may be consumed by vportOwnerStats module — needs verification)
Release risk: LOW — no critical spaghetti patterns; existing violations are contained

---

## 14. Module Governance Links

| Governance Type | Path | Status |
|---|---|---|
| ARCHITECTURE.md | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/ARCHITECTURE.md | PRESENT — upgraded to ACTIVE this run |
| INDEX.md | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/INDEX.md | PRESENT — rebuilt this run |
| BEHAVIOR.md | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/BEHAVIOR.md | PRESENT — upgraded to ACTIVE this run |
| SECURITY.md | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/SECURITY.md | PRESENT — STUB; route to VENOM/ELEKTRA |
| Feature ARCHITECTURE.md | ZZnotforproduction/APPS/VCSM/features/dashboard/ARCHITECTURE.md | PRESENT — ARCHITECT 2026-06-04 |
| Feature VENOM review | ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/04/Venom/ | PRESENT |
| Feature BlackWidow review | ZZnotforproduction/APPS/VCSM/features/dashboard/outputs/2026/06/04/BlackWidow/ | PRESENT |
| Engine audit | N/A at module level | N/A |
| Native transfer audit | N/A | N/A |
| Tests | MISSING — no shell module tests | MISSING |

---

## 15. Module Missing Pieces

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Tests for dashboard shell (VportDashboardScreen, useVportOwnership, checkVportOwnership) | HIGH | Ownership gate is the primary access control; zero test coverage is a regression risk | SPIDER-MAN |
| SECURITY.md upgrade (route auth guard verification) | HIGH | Route `/actor/:actorId/dashboard` auth guard not confirmed by scanner | VENOM / ELEKTRA |
| Adapter boundary fix (booking.adapter DAL export) | MEDIUM | booking.adapter exports getActorByIdDAL, violating adapter contract | SENTRY |
| HAWKEYE endpoint contract for `/actor/:actorId/dashboard` | MEDIUM | Route registration not in scanner — auth middleware classification unknown | HAWKEYE |
| useOwnerQuickStats consumption audit | LOW | Hook exists at shell level but not consumed by VportDashboardScreen — unclear if it belongs to shell or vportOwnerStats module | IRONMAN |
| Compatibility shim cleanup (screens/model/) | LOW | 8 barrel re-exports are legacy residue — should be removed after usage verified | LOKI → cleanup |

---

## 16. Module Build Priority

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Tests for ownership gate | No test coverage on the primary auth boundary | SPIDER-MAN |
| P1 | Route auth guard verification | Auth enforcement not confirmed | VENOM + HAWKEYE |
| P2 | Fix booking.adapter DAL export | Violates adapter boundary contract | SENTRY |
| P2 | SECURITY.md upgrade | Route-level security not formally reviewed at module scope | VENOM / ELEKTRA |
| P3 | Cleanup screens/model/ re-export shims | Legacy residue; low risk | LOKI → verify, then cleanup |
| P3 | Move vportBookingHistoryView.model.js to bookings module | Scope hygiene | IRONMAN |

---

## 17. Source Verification Summary

```
Total scanner signals used: 11
Signals verified against source: 11 / 11
Source files read: 10
  - VportDashboardScreen.jsx
  - useVportOwnership.js
  - checkVportOwnership.controller.js
  - vportOwnerStats.controller.js
  - buildDashboardCards.model.js (canonical + compat shim)
  - dashboardViewByVportType.model.js (canonical + compat shim)
  - dashboardVportDetails.model.js
  - VportDashboardParts.jsx
  - vportDashboardShellStyles.js
  - booking.adapter.js (boundary verification)
  - useOwnerQuickStats.js
CRITICAL findings: 0
```

---

## 18. Confidence Summary

```
HIGH confidence signals used: 11
MEDIUM confidence signals used: 0
LOW confidence signals used: 0
[SOURCE_VERIFIED] findings: 5 (ARCH-001 through ARCH-005)
[SCANNER_LEAD] findings: 0
[SCANNER_LOW_CONF] findings: 0
[SCANNER_STALE] findings: 0
```

---

## 19. Final Module Status

```
FINAL MODULE STATUS: MOSTLY COMPLETE

Architecture is well-structured. Shell pattern is clean: ownership gate → card catalog
dispatch → card navigation. No write surfaces in the shell. Error/loading/empty states
are all present.

Gaps:
  - Zero test coverage (P1)
  - Route auth guard unconfirmed (P1)
  - Adapter boundary violation — booking.adapter exports DAL (P2)
  - SECURITY.md stub (P2)
```

---

## 20. Handoff Recommendations

| Command | Reason | Priority |
|---|---|---|
| SPIDER-MAN | Write shell tests: ownership gate, card dispatch, loading/error states | P1 |
| HAWKEYE | Verify `/actor/:actorId/dashboard` route registration and auth guard | P1 |
| VENOM | Upgrade SECURITY.md; verify route access classification | P2 |
| SENTRY | Enforce adapter boundary — booking.adapter must not export DAL functions | P2 |
| IRONMAN | Classify useOwnerQuickStats ownership; classify vportBookingHistoryView.model.js scope | P3 |
| LOKI | Runtime verification for screens/model/ re-export usage before deletion | P3 |

---

*ARCHITECT V2 — dashboard shell module — TICKET-ARCHITECT-MODULE-0001 — 2026-06-05*
