---
title: Panel Module — Behavior
status: STUB
feature: debug
module: panel
source: architect-derived
created: 2026-06-05
---

# debug / modules / panel — BEHAVIOR

## Status

STUB. Behaviors seeded from ARCHITECT review.

## Confirmed Behaviors

### Dev Panel Render
- LoginDebugPanel.jsx renders a floating overlay in dev mode only
- `import.meta.env.DEV` guard: returns null in production builds
- Displays identity debug state from `@debuggers/identity` (Vite alias)
- In production: `@debuggers` alias resolves to `apps/VCSM/src/debuggers-stub` (safe no-op)

### Debug State Toggle
- loginDebug.store.js:13 exports `isIdentityDebugEnabled` (a getter) under the name `setLoginDebugEnabled`
- SECURITY GAP: callers expecting a setter receive the getter — broken contract
- Debug state cannot be set via this export; any attempt silently does nothing

### localStorage-Activated Panel (Dead Code)
- `__vcsm_dbg` localStorage key activates a debug panel variant on non-prod builds
- Key name is documented in source — creates known activation vector for identity state exposure
- This code path is dead but the key and its effect are documented in VEN-DEBUG-002

## Must Never Happen

- LoginDebugPanel must never render in production (`import.meta.env.DEV` guard must hold)
- `@debuggers` production stub must never expose real debug data
- `__vcsm_dbg` key activation path must be removed from source

## TODO

- [ ] Confirm LoginDebugPanel.jsx production guard placement — top of component or conditional render?
- [ ] Confirm debuggers-stub exports are all no-ops
- [ ] Confirm __vcsm_dbg code path is removed (not just unreachable)
