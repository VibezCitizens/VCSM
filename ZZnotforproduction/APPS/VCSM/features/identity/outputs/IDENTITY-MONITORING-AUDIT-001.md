# IDENTITY-MONITORING-AUDIT-001
## Production-Grade Identity Monitoring Audit — VCSM

> **Date:** 2026-06-07
> **Scope:** Full identity lifecycle — Engine → Resolver → Hydrator → Controller → Context → useIdentity() → Feature Consumers
> **Evidence:** Source code only. No assumptions.
> **Status:** OPEN — recommendations not yet implemented

---

## EXECUTIVE FINDING

**Current production monitoring coverage for the identity system: ZERO.**

All existing diagnostic calls (`debugLoginEvent`, `debugLoginError`, `console.log`, `console.warn`) are gated behind `import.meta.env.DEV` or `IS_DEV`. They do not fire in production. The monitoring ingest edge function (`quicksilver/src/ingest/monitoring-ingest-error`) exists and is functional, but no identity code calls it. A production `TypeError: Cannot read properties of undefined (reading 'actorId')` would generate zero Quicksilver records.

---

## 1. IDENTITY FLOW MAP

Complete lifecycle with file citations.

```
[AUTH LAYER]
  AuthProvider (@/app/providers/AuthProvider.jsx)
    → provides { user, loading: authLoading, logout }

[CONTEXT LAYER]
  IdentityProvider (state/identity/identityContext.jsx:25)
    → state: identity (public), identityDetails (full), loading, availableActors
    → useIdentityResolutionEffect (state/identity/useIdentityResolutionEffect.hook.js:23)
       ↓

[CONTROLLER LAYER — LOAD]
  loadDefaultIdentityForUser (state/identity/identity.controller.js:80)
    → in-flight dedup (identity.controller.inflight.js:3)
    → resolveAuthenticatedContext (engines/identity/src/controller/resolveAuthenticatedContext.controller.js:72)
       ↓ 8 steps:
       1. resolveSessionUser (engines/.../services/sessionService.js)
       2. dalGetAppByKey (engines/.../dal/app.read.dal.js)
       3. resolveUserAppAccess (engines/.../services/accessService.js)
       4. resolveUserAppAccount (engines/.../services/accountService.js)
       5. dalGetStateForAccount + dalGetPreferencesForAccount (parallel)
       6. createVcsmAppContextResolver (features/identity/resolvers/vcsmIdentity.resolver.js:22)
          → SELECT platform.user_app_actor_links WHERE actor_source='vc' AND status='active'
       7. resolveActiveActor (engines/.../services/actorService.js:43)
          priority: prefs.active_actor_link_id → state.last_actor_link_id → isPrimary → first
       8. context assembly → 120s result cache
    → readIdentityActorByIdDAL (state/identity/identity.read.dal.js:50)
       → SELECT vc.actors WHERE id = actorId (.single() — throws PGRST116 on RLS block)
    → hydrateIdentityActor (state/identity/identity.controller.js:49)
       → hydrateActor (engines/hydration/src/controller/hydrateActor.controller.js:11)
          → VCSM hydrator (app-injected) reads public.profiles + vport.profiles
    → hydratedIdentity._engineMeta attached
    → return hydratedIdentity

[SELF-HEAL PATH] (triggered when loadDefaultIdentityForUser returns null)
  findSelfHealActorForUser (state/identity/identitySelfHeal.controller.js:8)
    → readUserActorByProfileIdDAL (state/identity/identity.read.dal.js:157)
       → SELECT vc.actors WHERE profile_id=userId AND kind='user'
  bootstrapIdentitySelfHeal → ensureVcsmPlatformBootstrap (features/identity/controller/ensureVcsmPlatformBootstrap.controller.js:31)
    → dalProvisionVcsmIdentity → platform.provision_vcsm_identity RPC
  retry loadDefaultIdentityForUser (resolveAttempt='retry_after_self_heal')
  finalizeSelfHealedIdentity → engineSwitchActiveActor + finalizeAccountState

[MODEL LAYER]
  toPublicIdentity (state/identity/identity.model.js:1)
    → { actorId, kind, ownerActorId, realmId }
    → returns null if actorId or kind missing
  mapProfileActor / mapVportActor (state/identity/identity.model.js:39,63)
    → shape identity object from actor + profile/vport rows

[COMMIT LAYER]
  commitIdentity (state/identity/identityContext.jsx:40)
    → setIdentityDetails, setPublicIdentity(toPublicIdentity(...))
    → useActorStore.getState().upsertActors (silent catch)

[STORAGE LAYER]
  identityStorage.js (state/identity/identityStorage.js)
    → saveIdentity / loadIdentity / clearIdentity / clearAllIdentityStorage
    → all localStorage ops wrapped in try/catch — silent on failure

[SWITCH ACTOR PATH]
  identityContext.switchActor (state/identity/identityContext.jsx:68)
    → switchActorController (state/identity/controller/switchActor.controller.js:19)
       1. validate ctx (userAppAccountId + availableActors)
       2. find actor link in ctx.availableActors
       3. engineSwitchActiveActor (engines/.../controller/switchActiveActor.controller.js:24)
          → dalGetActorLinkById, ownership check, status check, dalSetActiveActorLink
          → invalidateIdentityResultCache
       4. loadIdentityForActorId → hydrateActor
    → version guard → saveIdentity → commitIdentity → invalidateEngineQuery → purge caches

[PUBLIC SURFACE]
  useIdentity() → { identity: { actorId, kind }, loading, switchActor, availableActors }
  identitySelectors.js → isUserActor, isVportActor, canCitizenBook, getActorId, getRealmId
  useIdentityDetailsDeprecated() → full identityDetails (internal use only)
```

---

## 2. FAILURE POINT INVENTORY

Evidence-based. File + function + failure mode + severity + current monitoring status.

| # | File | Function | Failure Mode | Severity | Monitoring Exists? |
|---|------|----------|--------------|----------|--------------------|
| F-01 | `useIdentityResolutionEffect.hook.js:35` | `run()` | `authLoading` never flips false → identity stuck in loading forever | HIGH | NO |
| F-02 | `useIdentityResolutionEffect.hook.js:45` | `run()` | `user?.id` is null but `authLoading` is false → identity committed as null → silent empty session | MEDIUM | NO (DEV only) |
| F-03 | `identity.controller.js:88` | `loadDefaultIdentityForUser` | in-flight key `userId:resolveAttempt` never deduped across page navigations if `resolveAttempt` differs | LOW | NO |
| F-04 | `resolveAuthenticatedContext.controller.js:89` | Step 1 SESSION | `resolveSessionUser()` throws (Supabase auth error) → thrown up to useEffect → IDENTITY_HYDRATION_FATAL | HIGH | NO |
| F-05 | `resolveAuthenticatedContext.controller.js:119` | Step 2 APP | `dalGetAppByKey` returns null → APP_NOT_FOUND thrown → no active identity | CRITICAL | NO |
| F-06 | `resolveAuthenticatedContext.controller.js:138` | Step 3 ACCESS | ACCESS_DENIED thrown → user locked out silently | HIGH | NO |
| F-07 | `resolveAuthenticatedContext.controller.js:154` | Step 4 ACCOUNT | ACCOUNT_NOT_FOUND thrown → triggers self-heal path | HIGH | NO |
| F-08 | `resolveAuthenticatedContext.controller.js:167` | Step 5 STATE+PREFS | `Promise.all` throws on first failure — state OR prefs error kills entire resolve | HIGH | NO |
| F-09 | `vcsmIdentity.resolver.js:37` | `resolveAppContext` | `linkError` — RLS, network, or schema error on platform.user_app_actor_links | CRITICAL | NO (trace only) |
| F-10 | `vcsmIdentity.resolver.js:80` | `resolveAppContext` | Zero rows returned → empty actorLinks → no active actor → null identity | HIGH | NO |
| F-11 | `actorService.js:56` | `resolveActiveActor` | No available actors → returns null → loadDefaultIdentityForUser returns null → self-heal | HIGH | NO |
| F-12 | `identity.read.dal.js:50` | `readIdentityActorByIdDAL` | `.single()` throws PGRST116 — RLS blocks vc.actors read (missing actor_privacy_settings row) | CRITICAL | DEV only |
| F-13 | `identity.controller.js:203` | `_loadDefaultIdentityForUserInner` | `actorRow` is null after read — actor deleted from DB but link exists | HIGH | DEV only |
| F-14 | `identity.controller.js:212` | `_loadDefaultIdentityForUserInner` | `actorRow.is_deleted` — returns DELETED_ACCOUNT_SENTINEL, triggers logout | MEDIUM | DEV only |
| F-15 | `hydrateActor.controller.js:23` | `hydrateActor` | No hydrator configured for `appKey`+`actorSource` → throws Error | CRITICAL | NO |
| F-16 | `hydrateActor.controller.js:30` | `hydrateActor` | Hydrator (VCSM adapter) returns null — profile/vport DB read failed | HIGH | DEV only |
| F-17 | `identity.model.js:2` | `toPublicIdentity` | `source.actorId` or `source.kind` missing → returns null → identity committed as null | CRITICAL | NO |
| F-18 | `identityContext.jsx:44` | `commitIdentity` | `useActorStore.upsertActors` throws — silently swallowed, actor store out of sync | LOW | NO |
| F-19 | `identitySelfHeal.controller.js:8` | `findSelfHealActorForUser` | `readUserActorByProfileIdDAL` queries `profile_id = userId` — userId is auth.users.id, not profile.id — this lookup returns null for all users | CRITICAL | NO |
| F-20 | `ensureVcsmPlatformBootstrap.controller.js:37` | `ensureVcsmPlatformBootstrap` | RPC `provision_vcsm_identity` fails — network/permission — returns `{ok: false}` but `bootstrapIdentitySelfHeal` propagates the result without checking `ok` | HIGH | DEV only |
| F-21 | `switchActor.controller.js:48` | `switchActorController` | ctx null or `availableActors` empty — returns SWITCH_ABORT_MISSING_ACCOUNT_CONTEXT | HIGH | DEV only |
| F-22 | `switchActor.controller.js:86` | `switchActorController` | Actor link not found in ctx — SWITCH_ABORT_LINK_NOT_FOUND — sets `linkNotFound=true` → `explicitSwitchAbortedRef=true` → blocks subsequent background resolve | HIGH | DEV only |
| F-23 | `switchActor.controller.js:127` | `switchActorController` | Platform write succeeds but hydration returns null → SWITCH_STATE_UNCHANGED — platform preference written, identity state unchanged (diverged) | CRITICAL | DEV only |
| F-24 | `identityContext.jsx:152` | `commitIdentity` (stale check) | Version mismatch → stale resolve rejected → identity may remain stale if no newer resolve fires | MEDIUM | DEV only |
| F-25 | `identityContext.jsx:152` | ownership mismatch check | Identity userId ≠ session userId — rejects identity, commits null — user sees loading forever if no retry | HIGH | DEV only |
| F-26 | `identityStorage.js:11` | `saveIdentity` | localStorage.setItem throws (QuotaExceededError, private mode) → silently swallowed | LOW | NO |
| F-27 | `resolveRealmId` (identity.controller.js:26) | `resolveRealmId` | Both preferred and fallback realm queries fail → returns null → realmId missing from identity | MEDIUM | DEV only |
| F-28 | `identityEngineQuery.js:24` | `useIdentityEngineQuery` | React Query refetch fails after switchActor → engine cache stale with wrong active actor | MEDIUM | NO |

---

## 3. RECOMMENDED INSTRUMENTATION POINTS

For each function: Monitor? | Severity | Why | Evidence

| Function | File | Monitor? | Severity | Why |
|----------|------|----------|----------|-----|
| `loadDefaultIdentityForUser` | `identity.controller.js:80` | YES | `error` | Entry point for all identity resolution. Null return means failed session. No production signal today. |
| `resolveAuthenticatedContext` — Step 1 SESSION | `resolveAuthenticatedContext.controller.js:86` | YES | `fatal` | Session failure means complete auth breakdown. Must know in production. |
| `resolveAuthenticatedContext` — Step 2 APP | `resolveAuthenticatedContext.controller.js:110` | YES | `fatal` | APP_NOT_FOUND means 'vcsm' row missing from platform.apps — all users locked out. |
| `resolveAuthenticatedContext` — Step 3 ACCESS | `resolveAuthenticatedContext.controller.js:130` | YES | `error` | ACCESS_DENIED is the failure mode for newly-registered users who lack an access row. |
| `resolveAuthenticatedContext` — Step 4 ACCOUNT | `resolveAuthenticatedContext.controller.js:148` | YES | `error` | ACCOUNT_NOT_FOUND triggers self-heal. Elevated count signals provisioning failures. |
| `resolveAuthenticatedContext` — Step 6 LINKS | `vcsmIdentity.resolver.js:37` | YES | `error` | Actor link read failure means no available actors for any resolution path. |
| `resolveActiveActor` — no links | `actorService.js:56` | YES | `error` | Empty link set means identity will always be null without self-heal. |
| `readIdentityActorByIdDAL` — PGRST116 | `identity.read.dal.js:50` | YES | `error` | RLS block on vc.actors is a known production failure mode. Needs its own behavior_id. |
| `hydrateActor` — no hydrator | `hydrateActor.controller.js:23` | YES | `fatal` | Missing hydrator config is an app initialization error — every identity resolve fails. |
| `hydrateActor` — null return | `hydrateActor.controller.js:30` | YES | `error` | Hydrator returned null means profile/vport data missing — identity object cannot be built. |
| `toPublicIdentity` — null return | `identity.model.js:2` | YES | `error` | Contract violation — hydrated object missing actorId or kind. |
| `findSelfHealActorForUser` — null result | `identitySelfHeal.controller.js:8` | YES | `warning` | Self-heal actor not found means user has no vc.actors row at all. |
| `bootstrapIdentitySelfHeal` — failure | `identitySelfHeal.controller.js:13` | YES | `error` | Provision RPC failed during self-heal — user will have no identity. |
| `switchActorController` — MISSING_ACCOUNT_CONTEXT | `switchActor.controller.js:48` | YES | `warning` | Indicates engine cache miss or race condition on switch. |
| `switchActorController` — LINK_NOT_FOUND | `switchActor.controller.js:86` | YES | `error` | Actor link missing from platform data despite UI showing actor choice. |
| `switchActorController` — platform write success + hydration null | `switchActor.controller.js:151` | YES | `fatal` | Platform preference written but identity diverged — inconsistent state. |
| `commitIdentity` — ownership mismatch | `useIdentityResolutionEffect.hook.js:153` | YES | `error` | Cross-user identity contamination detected. |
| `resolveRealmId` — both queries fail | `identity.controller.js:26` | YES | `warning` | realmId will be null — feed/realm scoping broken. |
| `loadDefaultIdentityForUser` — IDENTITY_HYDRATION_FATAL catch | `useIdentityResolutionEffect.hook.js:256` | YES | `fatal` | Unhandled throw in the full resolution chain. |
| `identityStorage.saveIdentity` | `identityStorage.js:11` | NO | — | Silent failure is intentional. localStorage is a cache hint, not authoritative. |
| `useIdentitySync` | `useIdentitySync.js:8` | NO | — | Side-effect of storage write. Same rationale as above. |

---

## 4. behavior_id REGISTRY

Full taxonomy for the identity subsystem. Every `behavior_id` maps to exactly one subsystem concern.

```
behavior.identity.resolve_actor
  → loadDefaultIdentityForUser success/failure
  → module: identity.controller
  → covers: F-02, F-03

behavior.identity.engine_context
  → resolveAuthenticatedContext — all 8 steps
  → module: resolveAuthenticatedContext.controller
  → covers: F-04, F-05, F-06, F-07, F-08, F-09, F-10, F-11

behavior.identity.actor_link_read
  → vcsmIdentity.resolver — platform.user_app_actor_links query
  → module: vcsmIdentity.resolver
  → covers: F-09, F-10

behavior.identity.actor_row_read
  → readIdentityActorByIdDAL — vc.actors read
  → module: identity.read.dal
  → covers: F-12, F-13, F-14

behavior.identity.hydrate_actor
  → hydrateActor engine dispatch + VCSM hydrator execution
  → module: hydration.controller
  → covers: F-15, F-16

behavior.identity.public_identity
  → toPublicIdentity contract validation
  → module: identity.model
  → covers: F-17

behavior.identity.commit_actor
  → commitIdentity, actor store upsert, ownership mismatch
  → module: identityContext
  → covers: F-18, F-25

behavior.identity.self_heal
  → findSelfHealActorForUser + bootstrapIdentitySelfHeal + finalizeSelfHealedIdentity
  → module: identitySelfHeal.controller
  → covers: F-19, F-20

behavior.identity.switch_actor
  → switchActorController — all switch phases
  → module: switchActor.controller
  → covers: F-21, F-22, F-23

behavior.identity.realm_resolution
  → resolveRealmId — preferred + fallback realm queries
  → module: identity.controller
  → covers: F-27

behavior.identity.storage
  → identityStorage read/write/clear operations
  → module: identityStorage
  → covers: F-26

behavior.identity.stale_resolve
  → version mismatch rejection, explicit-switch abort
  → module: identityContext
  → covers: F-24
```

Full behavior_id → feature/module mapping:

| behavior_id | feature | module | controller |
|-------------|---------|--------|------------|
| `behavior.identity.resolve_actor` | `identity` | `identity.controller` | `loadDefaultIdentityForUser` |
| `behavior.identity.engine_context` | `identity` | `resolveAuthenticatedContext.controller` | `resolveAuthenticatedContext` |
| `behavior.identity.actor_link_read` | `identity` | `vcsmIdentity.resolver` | `resolveAppContext` |
| `behavior.identity.actor_row_read` | `identity` | `identity.read.dal` | `readIdentityActorByIdDAL` |
| `behavior.identity.hydrate_actor` | `identity` | `hydrateActor.controller` | `hydrateActor` |
| `behavior.identity.public_identity` | `identity` | `identity.model` | `toPublicIdentity` |
| `behavior.identity.commit_actor` | `identity` | `identityContext` | `commitIdentity` |
| `behavior.identity.self_heal` | `identity` | `identitySelfHeal.controller` | `bootstrapIdentitySelfHeal` |
| `behavior.identity.switch_actor` | `identity` | `switchActor.controller` | `switchActorController` |
| `behavior.identity.realm_resolution` | `identity` | `identity.controller` | `resolveRealmId` |
| `behavior.identity.storage` | `identity` | `identityStorage` | `saveIdentity` |
| `behavior.identity.stale_resolve` | `identity` | `identityContext` | `commitIdentity` |

---

## 5. SAFE CONTEXT SCHEMA

What to put in `context` vs `tags` vs `breadcrumbs` for each event group.

### Permitted Fields (never send raw PII)

```
ALLOWED:
  hasUser          boolean
  hasIdentity      boolean
  hasActorId       boolean
  identityKind     "user" | "vport" | null
  actorCount       number
  activeActorKind  "user" | "vport" | null
  phase            string (engine step name)
  resolveAttempt   "initial" | "retry_after_self_heal"
  selfHealUsed     boolean
  engineResolved   boolean
  selectionReason  "PREFS_ACTIVE" | "STATE_LAST" | "PRIMARY_FALLBACK" | "FIRST_FALLBACK" | null
  errorCode        string (database error code, not message)
  operation        string (DAL function name)
  resolveVersion   number (monotonic counter from ref)
  switchVersion    number
  linkNotFound     boolean
  platformWriteAttempted boolean
  platformWriteSucceeded boolean
  hydrationSucceeded boolean
  hasRealmId       boolean
  hasSelfHealActor boolean
  dbErrorCode      string (e.g. "PGRST116", "23505")

FORBIDDEN in context/tags/breadcrumbs:
  userId          (raw auth.users.id — hash before sending as user_actor_id)
  actorId         (raw vc.actors.id — safe to hash, do not send raw)
  profileId
  vportId
  email
  username
  displayName
  any URL containing slugs or identifiers
```

### Per-behavior context shape

**behavior.identity.resolve_actor**
```js
context: {
  hasUser: true,
  resolveAttempt: "initial",
  selfHealUsed: false,
  engineResolved: true,
  hasIdentity: true,
  identityKind: "vport",
  resolveVersion: 1,
}
tags: {
  phase: "controller",
  resolveAttempt: "initial",
}
```

**behavior.identity.engine_context**
```js
context: {
  phase: "6_LINKS",             // step that failed
  hasActorId: false,
  actorCount: 0,
  selectionReason: null,
  errorCode: "PGRST116",        // DB error code only
  operation: "resolveAppContext",
}
tags: {
  step: "6_LINKS",
  failureType: "THROWN_ERROR",
}
breadcrumbs: [
  { step: "1_SESSION", status: "OK" },
  { step: "2_APP",     status: "OK" },
  { step: "3_ACCESS",  status: "OK" },
  { step: "4_ACCOUNT", status: "OK" },
  { step: "5_STATE_PREFS", status: "OK" },
  { step: "6_LINKS",   status: "ERROR", errorCode: "PGRST116" },
]
```

**behavior.identity.actor_row_read**
```js
context: {
  dbErrorCode: "PGRST116",
  hasPrivacyRow: false,          // boolean only — no IDs
  isDeleted: false,
  operation: "readIdentityActorByIdDAL",
}
tags: {
  dbCode: "PGRST116",
}
```

**behavior.identity.hydrate_actor**
```js
context: {
  hasHydrator: false,            // if false → fatal misconfiguration
  hydratorReturned: null,        // "null" | "object"
  identityKind: "vport",
}
tags: {
  appKey: "vcsm",
  actorSource: "vc",
}
```

**behavior.identity.switch_actor**
```js
context: {
  hasAccountContext: true,
  actorCount: 2,
  linkNotFound: false,
  platformWriteAttempted: true,
  platformWriteSucceeded: true,
  hydrationSucceeded: false,     // CRITICAL when true+true+false
  activeActorKind: "vport",
}
tags: {
  entryPoint: "identitySwitcher",
  switchCode: "SWITCH_STATE_UNCHANGED",
}
breadcrumbs: [
  { event: "ENGINE_CONTEXT_RESOLVE", status: "success" },
  { event: "LINK_MATCH", status: "success" },
  { event: "PLATFORM_WRITE", status: "success" },
  { event: "HYDRATION", status: "error" },
]
```

**behavior.identity.self_heal**
```js
context: {
  hasSelfHealActor: false,
  bootstrapOk: false,
  bootstrapError: "RPC returned no account ID",  // sanitized message only
  finalizeSkipped: true,
  hasUserAppAccountId: false,
}
tags: {
  healPhase: "bootstrap",
}
```

**behavior.identity.commit_actor**
```js
context: {
  hasIdentity: true,
  identityKind: "user",
  ownershipMismatch: false,      // if true → CRITICAL
  hasActorId: true,
  hasKind: true,
}
tags: {
  phase: "commit",
}
```

---

## 6. ALERT RECOMMENDATIONS

Recommended alert rules for `monitoring.alert_rules`.

| Alert Name | behavior_id | Condition | Severity | Reason |
|------------|-------------|-----------|----------|--------|
| `identity.fatal.no_hydrator` | `behavior.identity.hydrate_actor` | any event with `context->>'hasHydrator' = 'false'` | FATAL | App misconfiguration — all users affected |
| `identity.fatal.app_not_found` | `behavior.identity.engine_context` | any event with `operation='resolveAuthenticatedContext'` AND `error_name='APP_NOT_FOUND'` | FATAL | Platform 'vcsm' app row missing — 100% lockout |
| `identity.critical.rls_block` | `behavior.identity.actor_row_read` | `context->>'dbErrorCode' = 'PGRST116'` rate > 0/hr | ERROR | Missing actor_privacy_settings row — affects specific actors |
| `identity.critical.switch_diverged` | `behavior.identity.switch_actor` | `context->>'platformWriteSucceeded' = 'true'` AND `context->>'hydrationSucceeded' = 'false'` | FATAL | Platform preference written but identity state diverged |
| `identity.error.zero_actor_links` | `behavior.identity.actor_link_read` | `context->>'actorCount' = '0'` rate > 5/hr | ERROR | Many users with no actor links — provisioning failure |
| `identity.error.self_heal_spike` | `behavior.identity.self_heal` | event count > 10/hr | WARNING | Elevated self-heal indicates account provisioning issues |
| `identity.error.access_denied` | `behavior.identity.engine_context` | `error_name='ACCESS_DENIED'` rate > 10/hr | ERROR | Spike in access denials — access gate failure or misconfiguration |
| `identity.error.ownership_mismatch` | `behavior.identity.commit_actor` | `context->>'ownershipMismatch' = 'true'` | FATAL | Cross-user identity leak — immediate investigation |
| `identity.warning.realm_null` | `behavior.identity.realm_resolution` | any event | WARNING | Realm resolution failure — feed/realm scoping broken |

---

## 7. PRODUCTION DEBUGGING READINESS

### Scenario: `TypeError: Cannot read properties of undefined (reading 'actorId')`

**Root cause candidates from the actual source:**

1. `toPublicIdentity(source)` at `identity.model.js:2` — if `source` is undefined (hydrator returned undefined, not null)
2. `commitIdentity(nextDetails)` at `identityContext.jsx:40` — if `nextDetails?.actorId` access on undefined
3. Feature consumers calling `identity.actorId` when `useIdentity()` returns `{ identity: null }`

**Would proposed monitoring resolve this in a single dashboard view?**

With ZERO current production monitoring: **NO.**

With proposed instrumentation: **YES, if** the following chain is captured:

```
Query: WHERE behavior_id IN (
  'behavior.identity.hydrate_actor',
  'behavior.identity.public_identity',
  'behavior.identity.commit_actor'
) AND user_actor_id_hash = <hash of affected user>
ORDER BY occurred_at DESC
```

The breadcrumbs on `behavior.identity.engine_context` would show exactly which of the 8 engine steps completed before failure. The `context.identityKind = null` on `behavior.identity.public_identity` would confirm that `toPublicIdentity` returned null due to missing `kind`. The `behavior.identity.hydrate_actor` event with `context.hydratorReturned = null` would pinpoint the hydration failure that produced the undefined source.

**Missing fields that would prevent single-dashboard diagnosis:**

| Missing | Impact |
|---------|--------|
| No breadcrumb chain from engine step to context commit | Cannot distinguish F-12 (RLS block) from F-16 (hydrator null) from F-17 (model null) |
| No `correlation_id` threading loadDefaultIdentityForUser → hydrateActor | Cannot correlate engine call with hydration call in the same identity load |
| No `session_id` hash on engine context events | Cannot group all events from a single identity load sequence |
| `toPublicIdentity` returning null is not emitted at all | The actual failure point (model layer) is invisible |

---

## 8. MISSING MONITORING GAPS — RANKED P0–P3

### P0 — System-down impact, no signal at all

| Gap | File | Function | What's Missing |
|-----|------|----------|----------------|
| P0-01 | `resolveAuthenticatedContext.controller.js:119` | Step 2 APP | APP_NOT_FOUND thrown — 100% of users locked out, zero Quicksilver records |
| P0-02 | `hydrateActor.controller.js:23` | `hydrateActor` | No hydrator configured — every identity resolve throws, zero records |
| P0-03 | `useIdentityResolutionEffect.hook.js:256` | IDENTITY_HYDRATION_FATAL catch | Unhandled throw kills identity for that user — no record |
| P0-04 | `identity.model.js:2` | `toPublicIdentity` | Returns null — the silent failure that generates `actorId` TypeError in consumers |

### P1 — Affects individual users, silent in production

| Gap | File | Function | What's Missing |
|-----|------|----------|----------------|
| P1-01 | `identity.read.dal.js:50` | `readIdentityActorByIdDAL` | PGRST116 — RLS block on vc.actors — DEV log exists, zero production records |
| P1-02 | `switchActor.controller.js:127` | `switchActorController` | Platform write + hydration null divergence — DEV only, no production record |
| P1-03 | `identitySelfHeal.controller.js:8` | `findSelfHealActorForUser` | Profile_id lookup returns null — may silently fail for all users due to wrong join field |
| P1-04 | `useIdentityResolutionEffect.hook.js:153` | ownership mismatch | Cross-user identity rejection — DEV log exists, no production record |
| P1-05 | `resolveAuthenticatedContext.controller.js:130` | Step 3 ACCESS | ACCESS_DENIED — DEV log only |
| P1-06 | `vcsmIdentity.resolver.js:80` | `resolveAppContext` | Zero actor links — DEV trace only |

### P2 — Degrades session quality, no current signal

| Gap | File | Function | What's Missing |
|-----|------|----------|----------------|
| P2-01 | `identity.controller.js:26` | `resolveRealmId` | Both realm queries fail — realmId null, feed broken, DEV warn only |
| P2-02 | `resolveAuthenticatedContext.controller.js:167` | Step 5 STATE+PREFS | Either state or prefs query throws and kills full resolve — no production signal |
| P2-03 | `ensureVcsmPlatformBootstrap.controller.js:37` | `ensureVcsmPlatformBootstrap` | RPC fails — DEV log, no production record |
| P2-04 | `actorService.js:43` | `resolveActiveActor` | Selection reason not captured anywhere — cannot audit why PRIMARY_FALLBACK fires repeatedly |

### P3 — Observable anomalies, useful for diagnosis

| Gap | File | Function | What's Missing |
|-----|------|----------|----------------|
| P3-01 | `identity.controller.inflight.js:3` | `_identityInflight` | In-flight dedup hit rate — only DEV console.log |
| P3-02 | `resolveAuthenticatedContext.controller.js:37` | result cache | Cache hit/miss rate — no signal in production |
| P3-03 | `identityContext.jsx:126` | stale resolve rejection | IDENTITY_COMMIT_REJECTED_STALE — DEV only |
| P3-04 | `switchActor.controller.js:86` | SWITCH_ABORT_LINK_NOT_FOUND | Actor link churn — user sees switch fail without knowing why |

---

## 9. IMPLEMENTATION NOTE

All monitoring calls from VCSM must go through:

```
apps/VCSM/src/services/monitoring/  (VCSM client adapter)
  → POST /functions/v1/monitoring-ingest-error
    → apps/quicksilver/src/ingest/monitoring-ingest-error/index.ts
      → public.monitoring_ingest_error_event RPC
        → monitoring.error_events + monitoring.error_groups
```

Per the Quicksilver ownership contract (`ZZnotforproduction/CONTRACTS/Architecture/Quicksilver/01-monitoring-ownership.md`):
- VCSM must not implement fingerprint generation, error grouping, or aggregation
- All of that is Quicksilver's responsibility
- VCSM emits events only

The VCSM monitoring adapter does not yet exist. Creating it is the prerequisite for all instrumentation points above.

A VCSM monitoring adapter must:
1. Accept `{ feature, module, behavior_id, severity, message, error_name?, stack?, context, tags, breadcrumbs, user_actor_id?, session_id? }`
2. Hash `user_actor_id` and `session_id` client-side before forwarding (defense in depth — edge function hashes again)
3. Strip any fields that may contain PII (sanitize `context` keys against allowlist)
4. Forward to the edge function via `fetch`
5. Never throw — monitoring failures must not crash the identity system

---

## COVERAGE SUMMARY

| Subsystem | Files | Failure Points | Monitored (production) | Gap |
|-----------|-------|----------------|------------------------|-----|
| Engine (resolveAuthenticatedContext) | 1 controller, 7 services, 10 DALs | 8 | 0 | 100% |
| VCSM Resolver (vcsmIdentity.resolver) | 1 | 2 | 0 | 100% |
| Identity Controller | 1 | 5 | 0 | 100% |
| Identity DAL | 1 | 4 | 0 | 100% |
| Hydration Engine | 1 controller | 2 | 0 | 100% |
| Identity Model | 1 | 1 | 0 | 100% |
| Identity Context (commit/switch) | 2 | 5 | 0 | 100% |
| Self-heal | 2 | 3 | 0 | 100% |
| Storage | 1 | 1 | 0 | 100% |
| **TOTAL** | **11 core files** | **31 failure points** | **0** | **100%** |

**All 31 identified failure points have zero production monitoring.**

Open report for full details.
