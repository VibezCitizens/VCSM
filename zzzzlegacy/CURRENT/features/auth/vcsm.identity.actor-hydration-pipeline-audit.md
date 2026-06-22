# Actor Hydration Pipeline Audit

> **SUPERSEDED — 2026-05-11**
> This document describes an intermediate migration state from April 4, 2026.
> The DAL files referenced here (`platformIdentity.read.dal.js`, `dalEnsureVcActorLink`) no longer drive the pipeline.
> **Current architecture:** `vcsm.identity.actor-hydration-audit.md` and `vcsm.identity.login-pipeline-trace.md`

**Date:** 2026-04-04
**Scope:** apps/VCSM + apps/wentrex
**Source:** Real code inspection, all file paths verified

---

## VCSM Actor Hydration Pipeline

### 1. Bootstrap Entry

| Step | File | Function | Input |
|------|------|----------|-------|
| Auth session | `app/providers/AuthProvider.jsx` | `AuthProvider` | Supabase auth session |
| Identity load | `state/identity/identityContext.jsx` | `IdentityProvider` effect | `user.id` from AuthProvider |

**Trigger:** `useEffect` fires when `[authLoading, user?.id]` changes.

### 2. Identity Source Resolution (Platform-Only)

| Step | File | Function | Table |
|------|------|----------|-------|
| Get account | `features/identity/dal/platformIdentity.read.dal.js` | `dalGetVcsmAppAccount(userId)` | `platform.user_app_accounts` |
| List links | `features/identity/dal/platformIdentity.read.dal.js` | `dalListVcActorLinks(accountId)` | `platform.user_app_actor_links` WHERE `actor_source='vc'` |
| Get prefs | `features/identity/dal/platformIdentity.read.dal.js` | `dalGetVcsmPreferences(accountId)` | `platform.user_app_preferences` |

**Actor selection priority:**
1. `platform.user_app_preferences.active_actor_link_id`
2. `savedActorId` from localStorage (only if actor exists in platform links)
3. Link with `is_primary=true`
4. First active link

**No legacy fallback.** If no platform rows → self-heal → retry → null.

### 3. Self-Heal (Missing Platform Rows)

| Step | File | Function | Table |
|------|------|----------|-------|
| Find vc actor | `identityContext.jsx` (dynamic import) | inline query | `vc.actors` WHERE `profile_id=user.id, kind='user'` |
| Provision | `features/identity/controller/ensureVcsmPlatformBootstrap.controller.js` | `ensureVcsmPlatformBootstrap()` | RPC `platform.provision_vcsm_identity` |
| Create link | `features/identity/dal/actorLink.dal.js` | `dalEnsureVcActorLink()` | `platform.user_app_actor_links` |
| Bridge | `features/identity/dal/actorLink.dal.js` | `dalSetVcActorAppAccount()` | `vc.actors.user_app_account_id` |

### 4. Actor Base Read

| File | Function | Table | Columns |
|------|----------|-------|---------|
| `state/identity/identity.read.dal.js` | `readIdentityActorByIdDAL(actorId)` | `vc.actors` | `id, kind, profile_id, vport_id, is_void` |

### 5. Domain Enrichment (Branches by Actor Kind)

#### User Actor (`kind='user'`)
| File | Function | Table | Fields Added |
|------|----------|-------|-------------|
| `identity.read.dal.js` | `readProfileIdentityDAL(profile_id)` | `public.profiles` | displayName, username, email, avatar, banner, bio, birthdate, age, sex, isAdult, discoverable, publish, lastSeen |
| `identity.read.dal.js` | `readActorPrivacyDAL(actor_id)` | `vc.actor_privacy_settings` | private (is_private) |
| `identity.controller.js` | `resolveRealmId(actor)` | `vc.realms` | realmId |

#### Vport Actor (`kind='vport'`)
| File | Function | Table | Fields Added |
|------|----------|-------|-------------|
| `identity.read.dal.js` | `readVportIdentityDAL(vport_id)` | `vc.vports` | displayName(name), username(slug), avatar, banner, bio, isActive, vportType |
| `identity.read.dal.js` | `readActorPrivacyDAL(actor_id)` | `vc.actor_privacy_settings` | private |
| `identity.read.dal.js` | `readActorOwnerUserDAL(actor_id)` | `vc.actor_owners` | ownerActorId (domain ownership, NOT identity) |
| `identity.read.dal.js` | `readUserActorByProfileIdDAL(user_id)` | `vc.actors` | ownerActorId resolution |
| `identity.controller.js` | `resolveRealmId(actor)` | `vc.realms` | realmId |

### 6. Mapping Layer

| File | Function | Input | Output |
|------|----------|-------|--------|
| `identity.controller.js` | `mapProfileActor(actor, profile, realmId)` | raw DB rows | `{ actorId, kind:'user', realmId, isVoid, displayName, username, email, avatar, banner, bio, birthdate, age, sex, isAdult, discoverable, publish, lastSeen, createdAt, updatedAt }` |
| `identity.controller.js` | `mapVportActor(actor, vport, realmId)` | raw DB rows | `{ actorId, kind:'vport', realmId, isVoid, displayName, username, avatar, banner, bio, isActive, vportType, createdAt, updatedAt }` |
| `identity.controller.js` | `hydrateIdentityActor(actor)` | mapped actor + privacy | Adds `private: boolean` + `ownerActorId` (vport only) |

### 7. State Publish

| File | Function | Where stored |
|------|----------|-------------|
| `identityContext.jsx` | `setIdentity(nextIdentity)` | React context state |
| `identityStorage.js` | `saveIdentity(actorId)` | `localStorage['vc.identity.actorId']` (convenience only) |

### 8. Consumer Contract

```javascript
useIdentity() → {
  identity: {
    actorId, kind, realmId, isVoid,
    displayName, username, email, avatar, banner, bio,
    birthdate, age, sex, isAdult, discoverable, publish,
    lastSeen, createdAt, updatedAt,
    private,
    ownerActorId,  // vport only
    vportType,     // vport only
    isActive,      // vport only
  } | null,
  loading: boolean,
  identityLoading: boolean,
  setIdentity: function,
  switchActor: function,
}
```

---

## Table-Level Data Flow

| Table | Schema | Read By | Role in Hydration |
|-------|--------|---------|-------------------|
| `user_app_accounts` | platform | `dalGetVcsmAppAccount` | Maps userId → accountId |
| `user_app_actor_links` | platform | `dalListVcActorLinks` | Lists available actors for this account (actor_source='vc') |
| `user_app_preferences` | platform | `dalGetVcsmPreferences` | Provides active_actor_link_id (source of truth for actor selection) |
| `actors` | vc | `readIdentityActorByIdDAL` | Base actor record (id, kind, profile_id, vport_id, is_void) |
| `profiles` | public | `readProfileIdentityDAL` | User profile enrichment (name, email, avatar, bio, etc.) |
| `vports` | vc | `readVportIdentityDAL` | Vport enrichment (name, slug, avatar, bio, type) |
| `actor_privacy_settings` | vc | `readActorPrivacyDAL` | Privacy flag (is_private) |
| `realms` | vc | `readPreferredRealmByVoidStateDAL` | Realm routing (realmId) |
| `actor_owners` | vc | `readActorOwnerUserDAL` | Vport owner resolution (DOMAIN only, not identity) |

---

## Switch Actor Hydration

| Step | File | Function | Table |
|------|------|----------|-------|
| 1. Trigger | `identityContext.jsx` | `switchActor(actorId)` | — |
| 2. Hydrate actor | `identity.controller.js` | `loadIdentityForActorId(actorId)` | vc.actors → profiles/vports/privacy/realms |
| 3. Save localStorage | `identityStorage.js` | `saveIdentity(actorId)` | localStorage |
| 4. Update context | `identityContext.jsx` | `setIdentity(nextIdentity)` | React state |
| 5. Write platform pref | `platformIdentity.read.dal.js` | `dalSetActiveActorLink(accountId, linkId)` | `platform.user_app_preferences` |

Platform preference write is non-blocking. localStorage is secondary.

---

## Wentrex Actor Hydration Pipeline

### Bootstrap
| Step | File | Function | Trigger |
|------|------|----------|---------|
| Engine setup | `features/identity/setup.js` | `setupWentrexIdentityEngine()` | `main.jsx` before render |
| Auth listener | `features/identity/WentrexIdentityContext.jsx` | `onAuthStateChange` | INITIAL_SESSION / SIGNED_IN |

### Resolution
| Event | Action | File |
|-------|--------|------|
| INITIAL_SESSION + session | `resolveAuthenticatedContext({ appKey: 'wentrex', skipLoginRecord: true })` | Engine |
| SIGNED_IN | `provisionWentrexIdentity()` → `resolveAuthenticatedContext()` | Controller |
| Self-heal | If ACCOUNT_NOT_FOUND → `provisionWentrexIdentity()` → retry | Context |

### Engine Resolution Path
```
engines/identity/src/controller/resolveAuthenticatedContext.controller.js
  → resolveSessionUser() → userId
  → dalGetAppByKey('wentrex') → appId
  → dalGetUserAppAccess(userId, appId) → access check
  → dalGetUserAppContextByKey(userId, 'wentrex') → accountId
  → dalGetPreferencesForAccount(accountId) → preferences
  → dalGetStateForAccount(accountId) → state
  → resolveAppContext (Wentrex resolver) → actorLinks, roleKeys, isSuspended, defaultDestination
  → resolveActiveActor → chosen actor
  → Build AuthenticatedContext
```

### Wentrex Resolver (App-Specific Enrichment)
```
features/identity/resolvers/wentrexIdentity.resolver.js
  → platform.user_app_actor_links WHERE actor_source='learning'
  → learning.actor_access → check can_access_learning_center
  → learning.organization_memberships → org roles
  → learning.parent_student_links → parent flag
  → learning.course_memberships → student flag
  → Build roleKeys + defaultDestination
```

### Wentrex Consumer Contract
```javascript
useWentrexIdentity() → { loading, context, error }
useWentrexActorId() → { actorId, organizationId, roleKeys, isSuspended, loading }
```

---

## Cross-App Comparison

| Aspect | VCSM | Wentrex |
|--------|------|---------|
| **Identity source** | Platform-only (no legacy fallback) | Engine-backed (platform tables via engine) |
| **Actor selection** | `dalListVcActorLinks` + `dalGetVcsmPreferences` | Engine's `resolveActiveActor` + Wentrex resolver |
| **Actor base table** | `vc.actors` | `learning.actors` |
| **Profile enrichment** | `public.profiles` (user) / `vc.vports` (vport) | Engine snapshots + learning.actor_profiles |
| **Privacy** | `vc.actor_privacy_settings` | `learning.actor_access` (can_access_learning_center) |
| **Realm** | `vc.realms` (by void state) | Not used (realm from URL slug) |
| **Role derivation** | None (roleKeys=[]) | org_memberships + parent_links + course_memberships |
| **Actor source tag** | `'vc'` | `'learning'` |
| **Fallback** | Self-heal → null (no legacy) | Self-heal → provision → retry |
| **Switching** | Platform pref + localStorage | Platform pref (engine) |
| **Hook** | `useIdentity()` | `useWentrexIdentity()` + `useWentrexActorId()` |

### Shared Patterns (Belong in Engine)
- Platform account lookup by userId
- Actor link listing by accountId + actor_source
- Active actor selection by preference → primary → first
- Self-healing (provision + retry)

### App-Specific (Must Stay)
- VCSM: `mapProfileActor`, `mapVportActor`, `resolveRealmId`, privacy from `vc.actor_privacy_settings`
- Wentrex: Role derivation from learning.* tables, destination routing, suspension check

---

## Hydration File Map

### VCSM
| File | Role |
|------|------|
| `state/identity/identityContext.jsx` | Bootstrap coordinator + context provider + self-heal |
| `state/identity/identity.controller.js` | Actor selection + hydration orchestration |
| `state/identity/identity.read.dal.js` | vc.* schema queries for enrichment |
| `state/identity/identityStorage.js` | localStorage convenience cache |
| `state/identity/identitySelectors.js` | Pure selectors (getActorId, etc.) |
| `state/identity/identitySwitcher.jsx` | Actor switch UI |
| `features/identity/dal/platformIdentity.read.dal.js` | Platform account/links/prefs reads |
| `features/identity/dal/provision.rpc.dal.js` | Platform provisioning RPC |
| `features/identity/dal/actorLink.dal.js` | Actor link creation + vc bridge |
| `features/identity/controller/ensureVcsmPlatformBootstrap.controller.js` | Self-heal orchestrator |
| `features/identity/setup.js` | Engine configuration (not yet called) |
| `features/identity/resolvers/vcsmIdentity.resolver.js` | Engine resolver (not yet active) |

### Wentrex
| File | Role |
|------|------|
| `features/identity/WentrexIdentityContext.jsx` | Bootstrap coordinator + context provider + self-heal |
| `features/identity/setup.js` | Engine configuration (active) |
| `features/identity/resolvers/wentrexIdentity.resolver.js` | Role/access resolver for learning.* |
| `features/identity/controller/provisionWentrexIdentity.controller.js` | Self-heal provisioning |
| `features/identity/dal/provision.rpc.dal.js` | Platform provisioning RPC |
| `features/identity/wentrexAccess.js` | Role guards + destination routing |
| `features/identity/useWentrexIdentity.js` | Re-exports |

### Shared Engine
| File | Role |
|------|------|
| `engines/identity/src/controller/resolveAuthenticatedContext.controller.js` | Main engine orchestrator |
| `engines/identity/src/services/actorService.js` | Actor link resolution + active selection |
| `engines/identity/src/dal/actorLinks.read.dal.js` | Platform actor link reads |
| `engines/identity/src/dal/preferences.read.dal.js` | Platform preference reads |
| `engines/identity/src/dal/state.write.dal.js` | Login recording |
| `engines/identity/src/config.js` | Dependency injection |

---

## Weak Spots

| File | Issue | Risk |
|------|-------|------|
| `identityContext.jsx` self-heal | Dynamic imports (`import()`) in effect — could fail in edge cases | Medium |
| `identityContext.jsx` self-heal | Queries `vc.actors` directly (not through DAL) to find user actor for self-heal | Low — one-time bootstrap |
| `identity.controller.js` vport hydration | Still reads `vc.actor_owners` for owner resolution (domain, not identity) | Low — domain ownership, not identity |
| `dalGetVcsmAppAccount` | Queries without app_id filter — could return wrong app's account if user has multiple | Medium — should filter by app_id |
| `identityStorage.js` | localStorage key `vc.identity.actorId` could persist a stale/deleted actor — but platform preference takes priority | Low |
| `switchActor` | Platform preference write is fire-and-forget — if it fails, next load falls back to localStorage hint | Low |

---

## Executive Summary

- **VCSM primary source of truth:** `platform.user_app_accounts` + `platform.user_app_actor_links` + `platform.user_app_preferences` (no legacy fallback)
- **Wentrex primary source of truth:** Same platform tables, accessed through `engines/identity` (engine-backed)
- **Where actor hydration begins:** `identityContext.jsx` effect (VCSM) / `WentrexIdentityContext.jsx` auth listener (Wentrex)
- **Where final identity is published:** React context via `setIdentity()` (VCSM) / React context via `setState()` (Wentrex)
- **Fallback exists:** NO legacy fallback in VCSM. Self-heal creates platform rows then retries platform-only resolution.
- **switchActor:** Platform-backed (`dalSetActiveActorLink`) + localStorage secondary (VCSM). Engine-backed (Wentrex — not yet active for VCSM).

**Top 10 files to inspect first:**
1. `apps/VCSM/src/state/identity/identityContext.jsx`
2. `apps/VCSM/src/state/identity/identity.controller.js`
3. `apps/VCSM/src/features/identity/dal/platformIdentity.read.dal.js`
4. `apps/VCSM/src/state/identity/identity.read.dal.js`
5. `apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js`
6. `apps/VCSM/src/features/identity/dal/actorLink.dal.js`
7. `apps/wentrex/src/features/identity/WentrexIdentityContext.jsx`
8. `apps/wentrex/src/features/identity/resolvers/wentrexIdentity.resolver.js`
9. `engines/identity/src/controller/resolveAuthenticatedContext.controller.js`
10. `engines/identity/src/services/actorService.js`

**Top 5 files that should later move to engine:**
1. `dalGetVcsmAppAccount` → already in engine as `dalGetUserAppContextByKey`
2. `dalListVcActorLinks` → already in engine as `dalGetActorLinksForAccount`
3. `dalGetVcsmPreferences` → already in engine as `dalGetPreferencesForAccount`
4. Actor selection logic (preference → primary → first) → already in engine as `resolveActiveActor`
5. Self-heal pattern → already in engine pattern via `_canSelfHeal` in Wentrex

**Top 5 files that must stay app-specific:**
1. `mapProfileActor` — vc.* profile enrichment shape
2. `mapVportActor` — vc.* vport enrichment shape
3. `resolveRealmId` — vc.realms routing
4. `readActorPrivacyDAL` — vc.actor_privacy_settings
5. `readActorOwnerUserDAL` — vc.actor_owners domain ownership (vport only)

**Biggest hydration architecture problem:** VCSM duplicates platform account/link/preference reads that the identity engine already provides. The next step is to wire `setupVcsmIdentityEngine()` into `main.jsx` and call `resolveAuthenticatedContext({ appKey: 'vcsm' })` instead of the manual platform DAL calls. The enrichment layer (`hydrateIdentityActor`) would remain app-specific.

**Safest next cleanup step:** Call `setupVcsmIdentityEngine()` in `main.jsx` and use the engine for the platform resolution part, keeping `hydrateIdentityActor` as the vc-specific enricher. This mirrors exactly what Wentrex does.
