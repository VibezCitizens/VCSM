---
title: Panel Module — Architecture
status: STUB
feature: debug
module: panel
source: architect-derived
created: 2026-06-05
---

# debug / modules / panel — ARCHITECTURE

## Layer Stack

```
[App root — dev mount point]
  └── LoginDebugPanel.jsx
        ├── import.meta.env.DEV guard → return null in production
        ├── loginDebug.helpers.js (debug state helpers)
        ├── loginDebug.store.js (deprecated re-export shim)
        │     └── line 13: exports isIdentityDebugEnabled as setLoginDebugEnabled ← BROKEN
        └── @debuggers/identity (Vite alias)
              ├── [dev]  → zNOTFORPRODUCTION/_ACTIVE/debuggers/identity (live debug data)
              └── [prod] → apps/VCSM/src/debuggers-stub (no-op stub)
```

## Vite Alias Resolution

```
vite.config.js:
  '@debuggers' →
    [DEV]  zNOTFORPRODUCTION/_ACTIVE/debuggers/  ← BW-DEBUG-004: path may not exist
    [PROD] apps/VCSM/src/debuggers-stub/
```

## Production Bundle Isolation

- LoginDebugPanel.jsx: compile-time dead code (import.meta.env.DEV = false in prod build)
- @debuggers alias: Vite substitutes stub at build time
- loginDebug.store.js: included in bundle as a deprecated shim; misnamed export persists in prod bundle

## Cross-Feature Debug Code

The following debug-related code lives outside this module but was flagged in the debug security review:

| File | Location | Risk |
|---|---|---|
| ActorProfileScreen.jsx:53 | profiles feature | __vcsm_dbg localStorage activation |
| AuthProvider.jsx | app/shell | appendIOSProdDebugLog writes userId to sessionStorage |
| feed.read.debugPrivacyRows.dal.js | feed/pipeline | In production bundle, single-point guard |
| chatNavDebugger.js | chat feature | Statically imported, not tree-shaken |

## TODO

- [ ] Confirm BW-DEBUG-004: does zNOTFORPRODUCTION/_ACTIVE/debuggers/ path exist?
- [ ] Confirm loginDebug.store.js is needed at all — can it be removed?
- [ ] Trace loginDebug.helpers.js usage — is it imported anywhere outside this module?
