# MODULE ARCHITECTURE REPORT

**Module:** engines/identity
**Application Scope:** VCSM + ENGINE (also consumed by WENTREX)
**Module Type:** Shared Domain Engine — Authentication & Identity Resolution
**Primary Root:** /Users/vcsm/Desktop/VCSM/engines/identity/
**ARCHITECT Run Date:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001

---

## PURPOSE

The identity engine is the authoritative resolver for the full authenticated user context. It is the single entry point for all authentication state across all platform apps.

Resolution pipeline (8 steps):
```
1. Session   → supabase.auth.getUser() (network-verified)
2. App       → platform.apps lookup by appKey
3. Access    → platform.user_app_access gate (granted/suspended/revoked)
4. Account   → platform.v_user_app_context (user_app_accounts view)
5. State + Preferences → parallel (platform.user_app_state, platform.user_app_preferences)
6. Actors + Roles + Capabilities → parallel platform queries OR app-injected resolver
7. Active Actor → priority selection (prefs → state → primary → first)
8. Context Build + Cache + Login Record + Event Emit
```

---

## OWNERSHIP

**Engine Owner:** Platform team
**App Scope:** VCSM + Wentrex (dual consumer — BOTH apps depend on this engine)
**DI configured by:**
- VCSM: `apps/VCSM/src/features/identity/setup.js`
- Wentrex: `apps/wentrex/src/features/identity/setup.js`

---

## ENTRY POINTS

**Public API:** `engines/identity/index.js` → `src/adapters/index.js`
**Alias:** `@identity` (inferred — apps import directly or via alias)

**Exported surface (15 symbols):**
- configureIdentityEngine
- resolveAuthenticatedContext, invalidateIdentityResultCache
- switchActiveActor
- logoutCleanup
- resolveSessionUser
- resolveUserAppAccess
- resolveUserAppAccount
- resolveAvailableActors, resolveActiveActor
- resolveRoleKeys
- resolveCapabilityKeys
- resolveDefaultDestination
- finalizeAccountState (re-export of dalFinalizeAccountState)
- onAuthStateChange (re-export of dalOnAuthStateChange)
- EVENTS, onIdentityEvent

---

## LAYER MAP

```
config.js             — DI (supabaseClient, debugReporter, enrichActorLinks, resolveAppContext)
events.js             — domain event emitter + constants
resolveTrace.js       — structured debug tracing utility
types/index.js        — JSDoc domain types (no runtime code)

dal/ (11 files):
  session.read.dal.js     — supabase.auth.getUser(), getSession(), signOut(), onAuthStateChange()
  app.read.dal.js         — platform.apps
  access.read.dal.js      — platform.user_app_access
  account.read.dal.js     — platform.user_app_accounts, platform.v_user_app_context
  actorLinks.read.dal.js  — platform.user_app_actor_links (read)
  actorLinks.write.dal.js — platform.user_app_actor_links, platform.user_app_preferences (write)
  roles.read.dal.js       — platform.app_roles, platform.user_app_account_roles, platform.role_capabilities
  capabilities.read.dal.js — platform.capabilities, platform.user_capabilities
  preferences.read.dal.js  — platform.user_app_preferences
  state.read.dal.js        — platform.user_app_state
  state.write.dal.js       — platform.user_app_state (login record, finalize, last destination)

model/ (6 files — pure row mappers):
  App.model.js
  Access.model.js
  Account.model.js
  ActorLink.model.js
  Preferences.model.js
  State.model.js

services/ (7 files — reusable domain logic):
  sessionService.js       — resolveSessionUser (wraps session.read.dal)
  accessService.js        — resolveUserAppAccess, isAccessGranted
  accountService.js       — resolveUserAppAccount
  actorService.js         — resolveAvailableActors (with app enrichment), resolveActiveActor
  roleService.js          — resolveRoleKeys
  capabilityService.js    — resolveCapabilityKeys (roles + direct overrides)
  destinationService.js   — resolveDefaultDestination

controller/ (3 files):
  resolveAuthenticatedContext.controller.js  — main 8-step orchestrator
  switchActiveActor.controller.js            — actor switch + cache bust
  logoutCleanup.controller.js               — signOut + cache bust + event

adapters/index.js         — public API surface
```

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|------|--------|----------|----------------|
| Purpose defined | PASS | CLAUDE.md + adapter header | — |
| Owner defined | PASS | DI config + CLAUDE.md | — |
| Entry points mapped | PASS | adapters/index.js, 15 symbols | — |
| Controllers present | PASS | 3 controllers cover all use cases | — |
| DAL/repository present | PASS | 11 DAL files, platform schema exclusively | — |
| Models/transformers present | PASS | 6 model files | — |
| Services present | PASS | 7 service files (clean layer) | — |
| Hooks/view models present | N/A | Framework-agnostic | hooks live in apps/ |
| Screens/components present | N/A | Framework-agnostic | — |
| Database objects mapped | PASS | 12 platform tables + 1 view + 2 RPCs (per CLAUDE.md) | — |
| Authorization path mapped | PASS | Access gate (step 3); actor ownership via actor_owners (booking engine handles, not this engine) | — |
| Cache/runtime behavior mapped | PASS | 2-minute in-memory cache keyed by userId:appKey | Process-scoped; not shared across instances |
| Error/loading/empty states mapped | PARTIAL | Throws with {code, message}; events emitted on failure | No retry logic |
| Documentation linked | PARTIAL | CLAUDE.md comprehensive; no BEHAVIOR.md or SECURITY.md governance artifacts | BEHAVIOR_CONTRACT_ABSENT |
| Tests/validation noted | PARTIAL | No test files found in engine directory | Full test gap |
| Native parity noted | N/A | Identity is platform-level | — |
| Engine dependencies mapped | N/A | This IS an engine | No cross-engine imports |

---

## DEPENDENCY INJECTION — APP CUSTOMIZATION POINTS

The identity engine supports 4 injection points:

| Injection Point | Required | Purpose |
|----------------|----------|---------|
| supabaseClient | REQUIRED | Supabase client for all platform schema queries |
| debugReporter | OPTIONAL | Structured debug sink (step/phase/status/payload/error) |
| enrichActorLinks | OPTIONAL | App-injected function to add live actor data (display_name, avatar_url from vc/learning schemas) |
| resolveAppContext | OPTIONAL | App-injected all-in-one resolver for actor + role + capability (replaces platform schema queries when app uses app-specific schemas) |

**No freeze guard:** Unlike the booking engine (`_frozen` guard), `configureIdentityEngine()` does not prevent repeated calls. The config is merged each time (`{ ..._config, ...config }`). A late/rogue call could swap the supabaseClient.

---

## DB SCHEMA: platform (exclusively)

All queries use `.schema('platform')` on the injected supabaseClient.
No vc, vport, or learning schema queries inside the engine itself.
App-specific schema queries are delegated to `enrichActorLinks` and `resolveAppContext` injectors.

### Tables Accessed

| Table | Access | DAL File |
|-------|--------|----------|
| platform.apps | READ | app.read.dal.js |
| platform.user_app_access | READ | access.read.dal.js |
| platform.user_app_accounts | READ | account.read.dal.js |
| platform.v_user_app_context | READ (view) | account.read.dal.js |
| platform.user_app_actor_links | READ/WRITE | actorLinks.read.dal.js, actorLinks.write.dal.js |
| platform.user_app_preferences | READ/WRITE | preferences.read.dal.js, actorLinks.write.dal.js |
| platform.app_roles | READ | roles.read.dal.js |
| platform.user_app_account_roles | READ | roles.read.dal.js |
| platform.role_capabilities | READ | roles.read.dal.js |
| platform.capabilities | READ | capabilities.read.dal.js |
| platform.user_capabilities | READ | capabilities.read.dal.js |
| platform.user_app_state | READ/WRITE | state.read.dal.js, state.write.dal.js |

### Supabase Auth (not schema-scoped)

| Method | DAL File | Purpose |
|--------|----------|---------|
| supabase.auth.getUser() | session.read.dal.js | Network-verified user identity |
| supabase.auth.getSession() | session.read.dal.js | Cached session (non-critical reads only) |
| supabase.auth.signOut() | session.read.dal.js | Logout |
| supabase.auth.onAuthStateChange() | session.read.dal.js | Auth event subscription |

---

## DATABASE READ MAP

| Table/View | Function | Filter | Pattern | Called From |
|------------|----------|--------|---------|-------------|
| platform.apps | dalGetAppByKey | eq(key), eq(is_active) | point lookup | resolveAuthenticatedContext (step 2) |
| platform.user_app_access | dalGetUserAppAccess | eq(user_id, app_id) | point lookup | accessService |
| platform.user_app_accounts | dalGetUserAppAccount | eq(user_id, app_id), limit(1) | limit-1 | accountService |
| platform.v_user_app_context | dalGetUserAppContextByKey | eq(user_id, app_key), limit(1) | view lookup | accountService |
| platform.user_app_actor_links | dalGetActorLinksForAccount | eq(user_app_account_id, status=active) | list | actorService |
| platform.user_app_actor_links | dalGetActorLinkById | eq(id) | maybeSingle | switchActiveActor |
| platform.app_roles | (via roles.read.dal) | — | list | roleService |
| platform.user_app_account_roles | (via roles.read.dal) | eq(user_app_account_id) | list | roleService |
| platform.role_capabilities | (via roles.read.dal) | in(role_id) | list | capabilityService |
| platform.capabilities | (via capabilities.read.dal) | — | list | capabilityService |
| platform.user_capabilities | (via capabilities.read.dal) | eq(user_app_account_id) | list | capabilityService |
| platform.user_app_preferences | dalGetPreferencesForAccount | eq(user_app_account_id) | maybeSingle | resolveAuthenticatedContext (step 5) |
| platform.user_app_state | dalGetStateForAccount | eq(user_app_account_id) | maybeSingle | resolveAuthenticatedContext (step 5) |

---

## CACHE BEHAVIOR

| Location | Type | TTL | Key | Invalidation |
|----------|------|-----|-----|-------------|
| resolveAuthenticatedContext | In-memory Map (process-scoped) | 2 minutes | userId:appKey | invalidateIdentityResultCache(userId) — also called by switchActiveActor and logoutCleanup |

**Performance note:** Steps 1-4 are sequential (session → app → access → account). Steps 5-6 use Promise.all for parallelism. The cache prevents the 8-step chain from re-running on rapid navigation.

**Risk:** Process-scoped — not shared across instances. Multi-instance deployments see independent caches. State changes (actor switches, access revocations) propagate via cache invalidation on the instance that processed the action only.

---

## DOMAIN EVENTS

| Event | Emitted When |
|-------|-------------|
| EVENTS.CONTEXT_RESOLVED | resolveAuthenticatedContext succeeds |
| EVENTS.ACTOR_SWITCHED | switchActiveActor succeeds |
| EVENTS.ACCESS_DENIED | Access gate fails (status not 'granted') |
| EVENTS.SESSION_MISSING | No authenticated session |
| EVENTS.ACCOUNT_SUSPENDED | account_status = 'suspended' OR resolver flags isSuspended |
| EVENTS.LOGGED_OUT | logoutCleanup completes |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|------------|------|-----------|-------------------|-------|
| @supabase/supabase-js | external | ENGINE ← DI | YES | injected via configureIdentityEngine |
| VCSM: apps/VCSM/src/state/identity/ | app consumer | APP → ENGINE | YES | identity.controller.js, switchActor, identityContext.jsx, identityEngineQuery.js, identitySelfHeal.controller.js |
| VCSM: apps/VCSM/src/features/identity/setup.js | app config | APP → ENGINE | YES | DI wiring |
| Wentrex: apps/wentrex/src/features/identity/ | app consumer | APP → ENGINE | YES | WentrexIdentityContext.jsx, provisionWentrexIdentity.controller.js, setup.js, useWentrexIdentity.js |
| engines/booking | cross-engine | NONE | N/A | booking engine imports vc.actors directly; identity engine is not called |
| engines/chat | cross-engine | NONE | N/A | — |
| engines/notifications | cross-engine | NONE | N/A | — |

**BOUNDARY OBSERVATION:** The identity engine does NOT call any other engine. It is the foundation layer — all auth state resolves here. Other engines (booking) verify actor ownership via their own DALs (vc.actors, vc.actor_owners) rather than delegating to the identity engine. This is by design — engines are independent.

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|--------|-------------|-------|----------|------|
| platform.user_app_state | read/write | identity engine | resolveAuthenticatedContext, finalizeAccountState | dalFinalizeAccountState makes 2 sequential writes to set first_login_at conditionally |
| platform.user_app_actor_links | read/write | identity engine | actorService, switchActiveActor | — |
| platform.user_app_preferences | read/write | identity engine | actorService, actorLinks.write | — |
| auth.uid() | read | Supabase auth | session DAL | network call on every resolve (bypasses local cache) |
| AuthenticatedContext | derived | identity engine | VCSM identityContext.jsx, Wentrex WentrexIdentityContext.jsx | The full context object is cached — sensitive data (userId, actorIds, capabilities) in process memory |

---

## N+1 RISK WARNINGS

| Location | Risk | Detail |
|----------|------|--------|
| dalFinalizeAccountState | LOW | 2 sequential writes to platform.user_app_state: general update + conditional first_login_at update. Could be one upsert or RPC. |
| resolveAuthenticatedContext (steps 1-4) | LOW | Steps 1-4 are inherently sequential (each depends on the prior). Not an N+1 but a 4-query waterfall before parallelism begins in step 5. |
| App-injected enrichActorLinks | UNKNOWN | The engine calls enricher with all actor rows — internal implementation is app-controlled. VCSM enricher may perform per-actor DB calls (N+1 risk outside engine boundary). |

---

## SECURITY SURFACE

| Surface | Risk | Note |
|---------|------|------|
| No DI freeze guard | MEDIUM | `configureIdentityEngine()` can be called multiple times; subsequent call overwrites supabaseClient. Booking engine has ELEK-007 freeze guard — identity does not. |
| In-memory cache carries sensitive data | LOW | AuthenticatedContext includes userId, actorIds, roleKeys, capabilityKeys. Cache is process-scoped and not serialized, but the data is present in memory for 2 minutes. |
| Session verification via getUser() | PASS | Network-verified — not cached. Prevents stale session issues during auth transitions. |
| Access gate enforced at step 3 | PASS | ACCESS_DENIED thrown + event emitted before any account data is returned. |
| Actor ownership in switchActiveActor | PASS | `row.user_app_account_id !== userAppAccountId` ownership check before switch. |
| App-injectable resolveAppContext | MEDIUM | App-provided resolver runs inside the engine's pipeline — a malicious/buggy resolver can return arbitrary roleKeys/capabilityKeys. No engine-level validation of resolver output. |

---

## BEHAVIOR CONSISTENCY CHECK — engines/identity

```
Behavior Consistency Check — engines/identity
===============================================
BEHAVIOR.md present: NO
Status: MISSING

Check A (Source without behavior): FINDING
  → Controllers, services, DAL, and models exist with no BEHAVIOR.md
  → Severity: P0 (foundation engine consumed by both VCSM and Wentrex)
  → Recommendation: BEHAVIOR.md required before Blue Team commands run

Check B (Behavior without source): SKIPPED — no BEHAVIOR.md
Check C (§13 engine consistency): SKIPPED — no BEHAVIOR.md
Check D (§6 data change consistency): SKIPPED — no BEHAVIOR.md
```

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|----------------|------|--------|
| ARCHITECTURE.md | ZZnotforproduction/ENGINES/identity/ARCHITECTURE.md | PRESENT (new) |
| BEHAVIOR.md | ZZnotforproduction/ENGINES/identity/BEHAVIOR.md | MISSING |
| SECURITY.md | ZZnotforproduction/ENGINES/identity/SECURITY.md | MISSING |
| CURRENT_STATUS.md | ZZnotforproduction/ENGINES/identity/CURRENT_STATUS.md | MISSING |
| Ownership record (IRONMAN) | — | MISSING |
| Security audit (VENOM/ELEKTRA) | — | BLOCKED (requires BEHAVIOR.md) |
| Runtime audit (LOKI) | — | BLOCKED |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---------------|----------|----------------|-----------------|
| BEHAVIOR.md | CRITICAL | Foundation engine for both VCSM + Wentrex — Blue Team blocked for both apps without it | WOLVERINE intake |
| SECURITY.md | CRITICAL | VENOM/ELEKTRA blocked; DI freeze guard gap, injectable resolver risk not documented | VENOM after BEHAVIOR |
| DI freeze guard (configureIdentityEngine) | HIGH | Can be called multiple times unlike booking engine; rogue call after startup could swap supabaseClient | WOLVERINE |
| App resolver output validation | MEDIUM | resolveAppContext injection returns unchecked roleKeys/capabilityKeys — no schema validation | WOLVERINE |
| Test coverage | HIGH | No test files found in engine directory; identity is the trust foundation for both apps | SPIDER-MAN |
| CURRENT_STATUS.md | LOW | Governance tracking | LOGAN |

---

## MODULE INDEPENDENCE STATUS

```
MODULE INDEPENDENCE STATUS
Module: engines/identity
Classification: INDEPENDENT
Reason: Clean DI boundary; no app imports; no cross-engine imports; platform schema exclusively.
  Services layer provides clean separation between DAL and controller.
  App customization via injectors (enrichActorLinks, resolveAppContext) is well-designed.
Blocking gaps:
  - No BEHAVIOR.md → Blue Team blocked for VCSM AND Wentrex
  - No SECURITY.md → VENOM/ELEKTRA blocked
  - No tests → runtime confidence gap on the trust foundation layer
```

---

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|----------|-------------|--------|---------------------|
| P0 | Write BEHAVIOR.md | Blue Team blocked for BOTH apps | WOLVERINE |
| P0 | Add DI freeze guard to configureIdentityEngine | Security parity with booking engine (ELEK-007 pattern) | WOLVERINE |
| P1 | Write SECURITY.md | VENOM/ELEKTRA blocked | VENOM (after BEHAVIOR) |
| P1 | Test coverage for all 3 controllers | Identity is the trust foundation — zero tests is critical gap | SPIDER-MAN |
| P2 | Add resolver output schema validation | App-injectable resolver returns unchecked capabilities | WOLVERINE |
| P2 | CURRENT_STATUS.md | Governance tracking | LOGAN |
| P2 | Evaluate dalFinalizeAccountState 2-write pattern | Could be single RPC | CARNAGE |

---

## RECOMMENDED HANDOFFS

- **WOLVERINE** — BEHAVIOR.md intake; DI freeze guard; resolver validation
- **VENOM** — Security review (after BEHAVIOR.md) — DI swap risk, injectable resolver, cache data exposure
- **ELEKTRA** — Patch advisor: DI freeze guard (ELEK-007 pattern already in booking engine)
- **SPIDER-MAN** — Full test coverage for 3 controllers + 7 services (zero current tests)
- **LOKI** — Runtime trace of 8-step resolution pipeline; cache behavior; event subscriber mapping
- **IRONMAN** — Ownership: identity engine is the only engine consumed by BOTH apps — dual-app ownership must be declared
- **LOGAN** — CURRENT_STATUS.md, BEHAVIOR.md, SECURITY.md governance artifacts
