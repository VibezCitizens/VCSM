---
title: Shell Module — Index
status: STUB
feature: app
module: shell
source: architect-derived
created: 2026-06-05
source-path: apps/VCSM/src/app/
scanner-version: 1.1.0
---

# app / modules / shell

Root app shell — layout mount, auth provider, query client, and Zustand store initialization. No screens, no DAL, no controllers. Entry point for all app state providers.

## Module Summary

| Field | Value |
|---|---|
| Module | shell |
| Feature | app |
| Source Path | apps/VCSM/src/app/, apps/VCSM/src/App.jsx, apps/VCSM/src/main.jsx |
| Screens | 0 |
| Routes | 0 |
| Write Surfaces | sessionStorage, localStorage (auth + identity hints) |
| Components | 1 (RootLayout.jsx) |
| Providers | 1 (AuthProvider.jsx) |
| Hooks | 0 (hooks live in platform module) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| App.jsx | Root | App root — mounts providers and router |
| main.jsx | Entry | Vite entry point |
| app/index.js | Barrel | App barrel |
| app/layout/RootLayout.jsx | Layout | Root layout — mounts identityContext, navigation shell |
| app/layout/index.js | Barrel | Layout barrel |
| app/providers/AuthProvider.jsx | Provider | Auth provider — manages Supabase session, recovery flow, identity cache |
| app/providers/index.js | Barrel | Providers barrel |

## Write Surface Map

| Surface | Kind | Details |
|---|---|---|
| sessionStorage: vc.auth.recovery | Recovery flag | Set during password recovery flow |
| localStorage: actor_kind | Identity hint | Cleared on logout |
| localStorage: actor_vport_id | Identity hint | Cleared on logout |
| localStorage: actor_touch | Identity hint | Cleared on logout |
| clearAllIdentityStorage() | Wipe function | Must fire before Supabase signOut (race risk) |

## Security Flags

- MEDIUM: VENOM-AUTH-001 — vc.auth.recovery nonce stored in sessionStorage; readable/writable by any JS on the page (self-exploitation only)
- MEDIUM: clearAllIdentityStorage() race — must fire before Supabase signOut; inverted order leaves stale identity in storage
- LOW: localStorage identity hints (actor_kind, actor_vport_id, actor_touch) — low risk, cleared on logout

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm App.jsx provider composition order (QueryClient, AuthProvider, Router, Zustand)
- [ ] Confirm RootLayout.jsx identity context injection (useIdentity from engines/identity?)
- [ ] Confirm clearAllIdentityStorage() call order relative to Supabase signOut
- [ ] Confirm whether AuthProvider handles token refresh or delegates to Supabase client
