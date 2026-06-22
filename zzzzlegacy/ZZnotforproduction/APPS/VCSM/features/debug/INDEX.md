---
name: vcsm.debug.index
description: VCSM debug feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / debug

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 0 | None — dev tooling module; no controllers |
| DAL files | 0 | None — no database access |
| Hooks | 0 | None — state delegation goes through @debuggers/identity alias |
| Models | 0 | None |
| Screens | 0 | None — overlay panel, not a screen |
| Components | 2 | LoginDebugPanel.jsx (rendered component); loginDebug.store.js (deprecated re-export shim classified as module) |
| Adapters | 0 | None |
| Barrels | 0 | None — no index.js barrel found |
| Tests | 0 | No tests — dev tooling module |
| Routes | 0 | No routes in route-map for this feature |
| Total source files | 3 | loginDebug.helpers.js, loginDebug.store.js, components/LoginDebugPanel.jsx |

## Write Surface Map

No write surfaces detected by scanner. This module is a read-only dev tooling overlay — it subscribes to debug state and displays it. No database mutations occur.

## Security-Sensitive Surfaces

No high-sensitivity write surfaces in static scan.

Note: The module contains an `import.meta.env.DEV` production guard in `LoginDebugPanel.jsx` — the component returns null in production builds. The Vite config maps `@debuggers` to a production stub at `apps/VCSM/src/debuggers-stub` when not in dev mode. The stub's export safety has not been formally verified.

## Engine Dependencies

None detected. The module delegates to `@debuggers/identity` via a Vite path alias — this resolves to `zNOTFORPRODUCTION/_ACTIVE/debuggers/identity` in development and a stub in production. This is not a platform engine dependency.

## Routes

No routes in route-map for this feature. The debug panel is a floating overlay component intended to be mounted at the app root level, not navigated to via a route.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (placeholder — no behavior contract written) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
