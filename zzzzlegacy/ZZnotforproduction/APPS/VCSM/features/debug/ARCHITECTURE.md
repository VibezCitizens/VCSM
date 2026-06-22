---
name: vcsm.debug.architecture
description: ARCHITECT V2 module architecture report for VCSM:debug
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** debug
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/debug
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The debug module provides a floating dev-only login debug panel that renders login step events, session snapshots, identity snapshots, and event history as a JSON dump overlay. All substantive debugger logic has been migrated to `@debuggers/identity` (resolved via the `@debuggers` Vite path alias to `zNOTFORPRODUCTION/_ACTIVE/debuggers`); this module's two non-component files are explicit DEPRECATED re-export shims that redirect consumers to the canonical debugger. The panel never renders in production (`import.meta.env.DEV` guard).

## OWNERSHIP

Dev tooling domain. Owned by the platform engineering team. This module is infrastructure support — it does not participate in any user-facing feature flow and must never ship to production. Its canonical debugger implementation lives outside the `apps/` directory in `zNOTFORPRODUCTION/_ACTIVE/debuggers/identity/`.

## ENTRY POINTS

- `apps/VCSM/src/features/debug/components/LoginDebugPanel.jsx` — exported default component; intended to be mounted at the app root in dev mode. No route entry points. No barrel/index export detected in static scan — callers import the component directly.

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 0 | N/A |
| Model | 0 | N/A |
| Controller | 0 | N/A |
| Service | 0 | N/A |
| Adapter | 0 | N/A |
| Hook | 0 | N/A |
| Component | 2 | LoginDebugPanel.jsx (rendereable), loginDebug.store.js (deprecated shim), loginDebug.helpers.js (deprecated shim) |
| Screen | 0 | N/A |
| Barrel | 0 | N/A |

Note: Scanner cg_layerCounts reports 2 components. The fm_layerCounts reports 1 component + 2 modules (the two deprecated shim files). No DAL, controller, hook, or screen layers exist — this is intentional for a dev-tooling module.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Source read confirms dev-only login debug panel | BEHAVIOR.md is a placeholder with no actual contract |
| Owner defined | PARTIAL | Implied dev tooling; no explicit ownership record | No OWNERSHIP.md or team claim |
| Entry points mapped | PASS | LoginDebugPanel.jsx is the sole entry point | Not mounted via any detected consumer (no import found in src/) |
| Controllers present/delegated | PASS | N/A — tooling module; no controllers needed | None |
| DAL/repository present/delegated | PASS | N/A — read-only display panel | None |
| Models/transformers present | PASS | N/A | None |
| Hooks/view models present | PARTIAL | State managed via subscribeLoginDebug (delegated to @debuggers/identity) | No dedicated hook file in this module |
| Screens/components present | PASS | LoginDebugPanel.jsx present | Not currently mounted at any call site in apps/VCSM/src/ |
| Services/adapters present | PASS | N/A | None needed |
| Database objects mapped | PASS | No write surfaces — dev tooling only | None |
| Authorization path mapped | PASS | import.meta.env.DEV guard prevents production render | No auth check needed |
| Cache/runtime behavior mapped | PARTIAL | State uses pub/sub store via @debuggers/identity | Store subscription pattern confirmed; no cache layer |
| Error/loading/empty states mapped | PASS | "Waiting for login events..." empty state present in component | No loading/error state needed |
| Documentation linked | FAIL | BEHAVIOR.md is a placeholder with no behavior contract | BEHAVIOR.md must be written |
| Tests/validation noted | FAIL | 0 tests in scanner | No tests — acceptable for dev tooling but worth noting |
| Native parity noted | N/A | Dev tooling — not applicable | N/A |
| Engine dependencies mapped | PASS | No engines used — delegate is @debuggers/identity path alias | @debuggers resolves outside engines/ — not an engine dependency |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| @debuggers/identity | path-alias (Vite) | inbound | YES — vite.config.js alias | Resolves to zNOTFORPRODUCTION/_ACTIVE/debuggers/identity in dev; stub in prod |
| loginDebug.store.js | intra-module | component → shim | YES | Deprecated shim; LoginDebugPanel imports from it |
| loginDebug.helpers.js | intra-module | (unused in component) | YES | Deprecated shim; no component imports this file |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| identity debug state | subscribe (read-only) | @debuggers/identity store | LoginDebugPanel | LOW — dev-only, no write surface |
| login event history | subscribe (read-only) | @debuggers/identity store | LoginDebugPanel | LOW |
| session snapshot | subscribe (read-only) | @debuggers/identity store | LoginDebugPanel | LOW |
| identity snapshot | subscribe (read-only) | @debuggers/identity store | LoginDebugPanel | LOW |

No write surfaces detected. No database objects accessed.

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | N/A | No routes — overlay component | No risk |
| Loading state | N/A | Overlay panel; no async data fetching | None |
| Empty state | PASS | "Waiting for login events..." fallback in component | Confirmed |
| Error state | N/A | No async operations to fail | None |
| Auth/owner gates | PASS | import.meta.env.DEV guard — returns null in production | Confirmed in source |
| Cache behavior | N/A | No caching — live pub/sub state | None |
| Runtime dependencies | WATCH | @debuggers/identity alias resolves to stub in production | Must verify stub exports are safe no-ops |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/debug/BEHAVIOR.md | PRESENT (placeholder only) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | N/A | N/A — dev tooling |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A — dev tooling |
| Engine audit | N/A | N/A — no engine dependencies |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a placeholder | MEDIUM | No behavior contract exists — any reviewer of this module has no declared intent to verify against | LOGAN |
| LoginDebugPanel not mounted anywhere | LOW | The component exists but no import site was found in apps/VCSM/src/ — it may be dead or mounted elsewhere (e.g. App.jsx via different path) | IRONMAN |
| loginDebug.helpers.js is orphaned | LOW | No file in apps/VCSM/src/ imports loginDebug.helpers.js — the deprecated shim has no known consumer | IRONMAN |
| @debuggers/identity stub not verified | MEDIUM | Production vite.config maps @debuggers to a stub; stub must export safe no-ops to prevent breakage | VENOM |
| No tests | LOW | Acceptable for dev tooling but if the debugger is exercised in CI there is no assertion coverage | SPIDER-MAN |

---

## MODULE BOUNDARY WARNINGS

The two shim files (`loginDebug.store.js`, `loginDebug.helpers.js`) re-export from `@debuggers/identity`, which is a Vite path alias resolving outside the `apps/` directory. This is an intentional architecture pattern (dev tooling lives in `zNOTFORPRODUCTION/_ACTIVE/debuggers`) and is not a boundary violation — the alias is registered in `vite.config.js`.

`loginDebug.helpers.js` has no detected import site — it is a dead export shim. This is not a boundary violation but is a dead-code risk.

No cross-feature DAL imports detected. No layer violations detected.

---

## SPAGHETTI SCORE

**Module:** debug
**Score:** CLEAN
**Reasons:** 3 files total. No DAL, no controller, no hook layer. Two files are explicit deprecated shim re-exports. One component with a clear dev guard. No circular dependencies. All external state delegated to a single alias. Module is intentionally thin by design.
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no behavior declared

**Check A (Source without behavior):** FAIL — source exists but BEHAVIOR.md has no contract content. The module has defined behavior (login debug panel, pub/sub state, dev-only guard) that is not documented.

**Check B (Behavior without source):** PASS — BEHAVIOR.md declares nothing, so there is no phantom behavior to verify.

**Check C (§13 engine consistency):** PASS — no engines declared in scanner data; none found in source imports.

**Check D (§6 data change consistency):** PASS — no write surfaces declared in scanner data; none found in source. Read-only pub/sub state only.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P3 | Write BEHAVIOR.md behavior contract | Placeholder has no content; governance gap | LOGAN |
| P3 | Verify @debuggers stub exports are safe no-ops | Production path maps to stub; unverified | VENOM |
| P3 | Confirm LoginDebugPanel mount point | No import site found in src/ — may be dead or mounted via different mechanism | IRONMAN |
| P3 | Delete or document loginDebug.helpers.js | Dead shim with no consumer — dead code risk | IRONMAN |

## RECOMMENDED HANDOFFS

- **LOGAN** — BEHAVIOR.md placeholder must be filled with actual behavior contract
- **IRONMAN** — Confirm whether LoginDebugPanel is mounted and loginDebug.helpers.js is reachable
- **VENOM** — Verify production stub at `apps/VCSM/src/debuggers-stub` exports safe no-ops for all aliased symbols

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
