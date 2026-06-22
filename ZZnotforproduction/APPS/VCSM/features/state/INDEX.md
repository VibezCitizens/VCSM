---
name: vcsm.state.index
description: VCSM state feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / state

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 1 | identity.controller.js (+ switchActor.controller.js in sub-folder) |
| DAL files | 10 | identity.read.dal.js (reads vc.actors, vc.realms, vc.actor_privacy_settings, vc.actor_owners, public.profiles, vport.profiles) |
| Hooks | 3 | useIdentityResolutionEffect.hook.js, useIdentitySync.js, useActorSummary.js |
| Models | 5 | identity.model.js (toPublicIdentity, mapProfileActor, mapVportActor, getIdentityEngineContext, isBlockedVportIdentity) |
| Screens | 0 | None — state module has no product screens |
| Components | 0 | IdentityDebugger.jsx and identitySwitcher.jsx are dev-only; not production components |
| Adapters | 0 | No adapters — state delegates directly to engines |
| Barrels | 4 | state/index.js + sub-folder re-export files |
| Tests | 0 | No test files detected by scanner |
| Routes | 0 | No routes in route-map for this module |
| Total source files | 23 | fm sourceFileCount from scanner |

## Write Surface Map

No write surfaces detected by scanner. The state module is read-only — all DAL functions perform SELECT queries only. No INSERT, UPDATE, DELETE, or RPC mutations exist in this module.

## Security-Sensitive Surfaces

No write surfaces. However, the following read surfaces are security-relevant:

- `readActorPrivacyDiagnosticDAL` — reads `vc.actor_privacy_settings` to diagnose RLS state. Gated behind `VITE_DEBUG_RLS_DIAGNOSTIC=1` env flag; never called in production by default.
- `readIdentityActorByIdDAL` — reads `vc.actors` using `.single()`. RLS will throw PGRST116 if `actor_privacy_settings` row is missing for the actor. The controller handles this with a specific error branch and logged diagnostic hint.
- `DELETED_ACCOUNT_SENTINEL` — a frozen sentinel object returned when a resolved actor's account is soft-deleted. Callers must detect this and force-logout rather than treating it as a missing identity. Failure to handle this sentinel would leave a deleted user in an authenticated state.

## Engine Dependencies

- `identity` — `resolveAuthenticatedContext`, `invalidateIdentityResultCache` (engine handles session → app → access → account → actor links → active actor)
- `hydration` — `hydrateActor`, `useActorStore` (VCSM domain hydration and actor cache)

## Routes

No routes in route-map for this feature. The state module is a provider/store layer — it has no navigable routes.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (PLACEHOLDER — no real contract written) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
