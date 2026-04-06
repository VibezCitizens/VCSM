# Wentrex Identity Adapter — Contract

**Status:** FROZEN (2026-03-31)
**Owner:** apps/wentrex
**Depends on:** engines/identity (public API only)

---

## Purpose

Translates the generic identity engine output into Wentrex-specific meaning: LMS roles, access semantics, provisioning, and route guards.

---

## Public Exports (from useWentrexIdentity.js)

### Hooks
- `useWentrexIdentity()` — `{ loading, context, error }` full identity state
- `useWentrexActorId()` — `{ actorId, organizationId, roleKeys, isSuspended, loading }`

### Access Helpers
- `wentrexCanAccess(allow, roleKeys)` — role-based guard
- `wentrexDestinationFromRoleKeys(roleKeys)` — post-login routing
- `logoutCleanup()` — re-exported engine utility

---

## Internal Files (not imported by screens directly)

- `setup.js` — engine configuration (called from main.jsx)
- `WentrexIdentityContext.jsx` — React context provider
- `controller/provisionWentrexIdentity.controller.js` — provisioning orchestration
- `dal/provision.rpc.dal.js` — RPC call to platform.provision_wentrex_identity
- `resolvers/wentrexIdentity.resolver.js` — learning.* schema resolver

---

## Allowed Imports

| From | Allowed? |
|------|----------|
| `@identity` | YES — only in setup.js, WentrexIdentityContext.jsx, controller/, useWentrexIdentity.js |
| `@/services/supabase` | YES — for direct learning.* queries in resolver/DAL |
| `@chat` | NO |
| `apps/VCSM` | NO |

---

## Forbidden

- Screens/components MUST NOT import from `@identity` directly
- Screens/components consume identity through `useWentrexIdentity.js` exports only
- No engine-internal imports (DAL, model, service files from engines/identity/src/)
- No vc.* schema queries
- No VCSM concepts
