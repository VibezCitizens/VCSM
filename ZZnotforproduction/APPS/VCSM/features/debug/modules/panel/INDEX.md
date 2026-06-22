---
title: Panel Module — Index
status: STUB
feature: debug
module: panel
source: architect+venom+bw-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/debug/
scanner-version: 1.1.0
---

# debug / modules / panel

Dev-only login debug overlay panel. 3 source files. **THOR BLOCKERS: VEN-DEBUG-001 (broken setter export), VEN-DEBUG-002 (localStorage-activated debug key documented in source).** Production guard: `import.meta.env.DEV` in LoginDebugPanel.jsx.

## Module Summary

| Field | Value |
|---|---|
| Module | panel |
| Feature | debug |
| Source Path | apps/VCSM/src/features/debug/ |
| Screens | 0 (overlay component, not a screen) |
| Routes | 0 |
| Write Surfaces | None (read-only dev overlay) |
| Components | 1 (LoginDebugPanel.jsx) |
| Helpers | 1 (loginDebug.helpers.js) |
| Store | 1 (loginDebug.store.js — deprecated re-export shim) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role | Notes |
|---|---|---|---|
| components/LoginDebugPanel.jsx | Component | Floating debug overlay — dev-only | import.meta.env.DEV guard |
| loginDebug.helpers.js | Helpers | Debug state helpers | — |
| loginDebug.store.js | Store shim | Deprecated re-export; broken setter | VEN-DEBUG-001 |

## Production Gate

- `LoginDebugPanel.jsx`: returns null when `import.meta.env.DEV === false`
- `@debuggers` alias: Vite maps to `zNOTFORPRODUCTION/_ACTIVE/debuggers` in dev; to `apps/VCSM/src/debuggers-stub` in production
- **UNVERIFIED**: debuggers-stub export safety not formally verified

## Security Flags

- **THOR BLOCKER** HIGH: VEN-DEBUG-001 / BW-DEBUG-005 — loginDebug.store.js:13 exports `isIdentityDebugEnabled` (getter) as `setLoginDebugEnabled` (setter name); broken setter contract; any caller expecting to set debug state receives the getter; no-op in production but misnamed export persists
- **THOR BLOCKER** HIGH: VEN-DEBUG-002 — dead-code `__vcsm_dbg` localStorage key name documented in source code; activates debug panel on non-prod builds; identity state exposed to anyone who knows the key
- MEDIUM: VEN-DEBUG-003 — auth telemetry (userId, event type) written to sessionStorage via `appendIOSProdDebugLog` in AuthProvider.jsx without DEV-only guard (separate from this module — in app/shell)
- MEDIUM: BW-DEBUG-001 — `getDebugPrivacyRowsController` has no ownership assertion (separate module — feed feature); single call-site DEV guard is sole protection
- MEDIUM: BW-DEBUG-003 — `feed.read.debugPrivacyRows.dal.js` and controller in production bundle; single-point enforcement at hook call site only

## Cross-Feature Security Flags

These findings were raised in the debug security review but the code lives in other features:

| Finding | Surface | Feature |
|---|---|---|
| VEN-DEBUG-002 | ActorProfileScreen.jsx:53 | profiles |
| VEN-DEBUG-003 / BW-DEBUG-002 | AuthProvider.jsx | app/shell |
| BW-DEBUG-003 | feed.read.debugPrivacyRows.dal.js | feed/pipeline |
| BW-DEBUG-006 | chatNavDebugger.js in ConversationView | chat |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm @debuggers production stub exports — are they all safe no-ops?
- [ ] Confirm __vcsm_dbg localStorage key removal from source (VEN-DEBUG-002)
- [ ] Confirm loginDebug.store.js:13 — fix setter name to match actual function
- [ ] Confirm BW-DEBUG-004: zNOTFORPRODUCTION/_ACTIVE/debuggers path exists in dev
