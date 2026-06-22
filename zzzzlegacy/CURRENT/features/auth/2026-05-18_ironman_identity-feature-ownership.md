# IRONMAN Ownership Audit — VCSM Identity Feature
_Date:_ 2026-05-18
_Triggered by:_ CEREBRO pass on `vcsm.dal.identity.md` — open items RISK-3, RISK-5, RISK-9
_Boundary contract enforced:_ `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`

---

## Step 1 — IRONMAN Target

```text
IRONMAN TARGET
Feature / Engine:    identity (VCSM feature + identity engine integration)
Application Scope:   VCSM + ENGINE
Reason:              Post-fix verification; RISK-3 (resolver/setup undocumented layer),
                     RISK-5 (dead export removal decision),
                     RISK-9 (resolvers/ taxonomy — SENTRY recommendation pending owner)
```

---

## Step 2 — Code Roots

```text
CODE ROOTS
Primary path:   apps/VCSM/src/features/identity/
Related paths:  apps/VCSM/src/state/identity/
                engines/identity/
Entry files:    features/identity/setup.js
                features/identity/adapters/identity.adapter.js
                features/identity/adapters/identityOps.adapter.js
```

---

## Step 3 — Layer Map

```text
LAYER MAP — features/identity/

DAL:
  features/identity/dal/provision.rpc.dal.js
  features/identity/dal/refreshActorDirectory.dal.js

Model:
  MISSING — no model files; RPC responses consumed raw

Controller:
  features/identity/controller/ensureVcsmPlatformBootstrap.controller.js  (real logic)
  features/identity/controller/refreshActorDirectory.controller.js         (hollow pass-through)

Adapter:
  features/identity/adapters/identity.adapter.js       (bundle adapter — React + ops)
  features/identity/adapters/identityOps.adapter.js    (ops-only adapter — non-React callers)

Hook:
  features/identity/hooks/useIdentityOps.js

Resolver (non-standard layer — RISK-9):
  features/identity/resolvers/vcsmIdentity.resolver.js

Setup (non-standard layer):
  features/identity/setup.js

Component:  MISSING (none — feature has no own UI)
Screen:     MISSING (none — pure ops provider, consumed cross-feature)
```

```text
COMPANION STATE LAYER — state/identity/
(Not part of the feature DAL chain; manages in-memory actor identity state)

Context / Provider:  state/identity/identityContext.jsx
Controllers:         state/identity/identity.controller.js
                     state/identity/identitySelfHeal.controller.js
                     state/identity/identity.controller.inflight.js
                     state/identity/controller/switchActor.controller.js
Hook:                state/identity/useIdentityResolutionEffect.hook.js
                     state/identity/useIdentitySync.js
Store:               state/identity/identitySelection.store.js
Selectors:           state/identity/identitySelectors.js
Model:               state/identity/identity.model.js
DAL:                 state/identity/identity.read.dal.js
Helper:              state/identity/identityResolutionSelfHeal.helper.js
Storage:             state/identity/identityStorage.js
UI:                  state/identity/identitySwitcher.jsx
                     state/identity/IdentityDebugger.jsx
Query:               state/identity/queries/identityEngineQuery.js
```

---

## Step 4 — External Dependencies

```text
DEPENDENCY OWNERSHIP
Engines used:
  engines/identity/  (alias: @identity)
  — configureIdentityEngine     → features/identity/setup.js
  — resolveAuthenticatedContext → state/identity/queries/identityEngineQuery.js
  — invalidateIdentityResultCache → state/identity/identityContext.jsx
  — switchActiveActor           → state/identity/controller/switchActor.controller.js
  — finalizeAccountState        → state/identity/identitySelfHeal.controller.js
  — (additional exports)        → state/identity/identity.controller.js

Shared modules:
  @/services/supabase/supabaseClient  — Supabase client singleton

External services:
  Supabase PostgreSQL — schemas: platform, vc, identity
  Supabase Auth — userId from auth.users
```

---

## Step 5 — Data Ownership

```text
DATA OWNERSHIP

Tables read (active):
  platform.user_app_actor_links
    — via vcsmIdentity.resolver.js (resolveAppContext — called at every auth resolution)
    — 12-column explicit select
    — filtered: actor_source='vc', status='active'

Tables read (dead-path only):
  vc.actors
    — via resolveVcsmActorForProvisioning (dead export — RISK-5, zero callers)

Tables written (via RPC — SECURITY DEFINER):
  platform.user_app_access          — provision_vcsm_identity
  platform.user_app_accounts        — provision_vcsm_identity
  platform.user_app_preferences     — provision_vcsm_identity
  platform.user_app_state           — provision_vcsm_identity
  platform.user_app_actor_links     — provision_vcsm_identity (actor_source='vc')
  vc.actors.user_app_account_id     — provision_vcsm_identity (bridge UPDATE)
  identity.actor_directory          — refresh_actor_directory_row

RPCs owned by this feature:
  platform.provision_vcsm_identity(p_user_id, p_actor_id) → uuid
    Trust level: SECURITY DEFINER — elevated privilege, bypasses RLS for 6 operations
    Idempotent: YES — safe on every login
    Guard: 2-layer (DAL throw + controller return-false)

  identity.refresh_actor_directory_row(p_actor_domain, p_actor_id) → void
    Trust level: RLS-governed (not SECURITY DEFINER)
    Idempotent: YES — refresh only
    Guard: null-check in DAL; graceful return on error

Identity surfaces:
  actor identity is consumed via state/identity/identityContext.jsx (useIdentity hook)
  actor ops are consumed via features/identity/adapters/identity.adapter.js (useIdentityOps)
  non-React callers use features/identity/adapters/identityOps.adapter.js directly

Caches:
  Identity result cache in engines/identity/ (invalidated via invalidateIdentityResultCache)
```

---

## Step 6 — Governance Ownership

```text
GOVERNANCE OWNERSHIP

Contracts touched:
  ARCHITECTURE.md                      — layer build order, adapter boundary rule
  PROJECT_BOUNDARY_ISOLATION_CONTRACT  — cross-feature adapter-only access

Logan docs:
  zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.identity.md  (primary, REVIEW_PENDING)

Engine audits:
  MISSING — no engine audit doc for engines/identity/ exists yet

Security audits:
  MISSING — provision_vcsm_identity SECURITY DEFINER surface undocumented in security audit path
  (CURRENT/features/dashboard/evidence/ has no identity file)

Compliance audits:
  MISSING — no sentry_ or review-contract_ file for identity in CURRENT/features/dashboard/evidence/

Architecture maps:
  MISSING — identity feature not yet in any ARCHITECT graph output
```

---

## Step 7 — IRONMAN Ownership Record

```text
IRONMAN OWNERSHIP RECORD
Feature:         identity
Application Scope: VCSM + ENGINE
Primary files:   features/identity/setup.js
                 features/identity/adapters/identity.adapter.js
                 features/identity/adapters/identityOps.adapter.js
                 features/identity/dal/provision.rpc.dal.js
                 features/identity/dal/refreshActorDirectory.dal.js
                 features/identity/controller/ensureVcsmPlatformBootstrap.controller.js
                 features/identity/controller/refreshActorDirectory.controller.js
                 features/identity/hooks/useIdentityOps.js
                 features/identity/resolvers/vcsmIdentity.resolver.js
Engines used:    engines/identity/ (@identity alias)
Tables touched:  platform.user_app_actor_links (R), platform.user_app_access (W via RPC),
                 platform.user_app_accounts (W via RPC), platform.user_app_preferences (W via RPC),
                 platform.user_app_state (W via RPC), platform.user_app_actor_links (W via RPC),
                 vc.actors.user_app_account_id (W via RPC), identity.actor_directory (W via RPC)
Contracts touched: ARCHITECTURE.md, PROJECT_BOUNDARY_ISOLATION_CONTRACT
Docs touched:    vcsm.dal.identity.md
Responsibilities: Platform identity provisioning (account bootstrap),
                  actor directory refresh (post-write cache invalidation),
                  DI wiring of identity engine at app startup,
                  ops adapter boundary for non-React callers
Boundary rules:  All cross-feature access must enter via identity.adapter.js or identityOps.adapter.js.
                 No feature may call identity RPCs directly.
                 No feature may import from features/identity/controller/ or dal/ directly.
```

---

## IRONMAN Ownership Finding — Primary

```text
IRONMAN OWNERSHIP FINDING
- Finding ID:              IRON-IDENTITY-001
- Feature / Engine:        identity (VCSM feature)
- Application Scope:       VCSM + ENGINE
- Responsibility Type:     Feature ownership, Engine ownership, DAL ownership,
                           Data ownership, Security ownership, Documentation ownership
- Ownership Clarity:       PARTIAL
- Boundary Risk:           MEDIUM
- Severity:                MEDIUM
- Primary code roots:      features/identity/, state/identity/
- Core layers:             DAL (2), Controller (2), Adapter (2), Hook (1),
                           Resolver (1 — non-standard), Setup (1)
- Engines used:            engines/identity/ (@identity)
- Tables / Objects touched: platform.user_app_actor_links (R/W via RPC),
                            6 platform.* tables (W via SECURITY DEFINER RPC),
                            identity.actor_directory (W via RPC)
- Rule ownership:          Platform bootstrap rule owned by ensureVcsmPlatformBootstrap.controller.js
                           Directory refresh rule owned by refreshActorDirectory.dal.js
                           Actor link resolution rule owned by vcsmIdentity.resolver.js
- Contracts touched:       ARCHITECTURE.md, PROJECT_BOUNDARY_ISOLATION_CONTRACT
- Docs touched:            vcsm.dal.identity.md (REVIEW_PENDING)
- Runtime ownership:       Inferred (LOKI not yet run)
                           Bootstrap: triggered at every auth session where platform identity missing
                           Refresh: triggered after profile/vport/visibility mutations
                           Resolution: triggered at every auth context load (app startup + re-auth)
- Current ambiguity:
    1. resolvers/ layer has no taxonomy entry in architecture contract (RISK-9)
    2. setup.js has no layer taxonomy entry (non-standard DI wiring layer)
    3. resolveVcsmActorForProvisioning dead export has no documented owner for removal decision (RISK-5)
    4. state/identity/ and features/identity/ are companion systems with no documented boundary
       between them — the state layer calls the ops layer via identityOps.adapter.js, but the
       companion relationship is undocumented
    5. SECURITY DEFINER surface for provision_vcsm_identity has no security audit owner
    6. refreshActorDirectory.controller.js is a hollow pass-through with no documented justification
       for remaining as a controller layer (Structural Finding #2 — open since 2026-05-11)
- Risk:
    MEDIUM — no BLOCKING runtime risk. All boundary violations from 2026-05-11 are closed.
    The unresolved items are architecture documentation and dead code decisions.
- Recommended ownership clarification:
    See OWNERSHIP BOUNDARY WARNINGS below.
- Recommended handoff:
    LOGAN — update vcsm.dal.identity.md primary sections (RISK-4, RISK-6/7)
    SENTRY — RISK-9 taxonomy addition
    VENOM — create security audit record for SECURITY DEFINER surface
    CARNAGE — confirm migration ownership for both RPCs
- Rationale:
    Identity is a foundational system — provisioning and actor resolution run on every
    auth session. The ownership gaps are documentation and taxonomy, not runtime violations.
    But undocumented layers create maintenance risk as the system grows.
```

---

## Ownership Boundary Warnings

```text
OWNERSHIP BOUNDARY WARNING #1
Location:       features/identity/resolvers/vcsmIdentity.resolver.js
Current ambiguity: Resolver layer sits outside the architecture contract taxonomy
                   (DAL → Model → Controller → Hook → Screen).
                   It does DAL-level Supabase queries, factory construction (controller-like),
                   and DI injection (service-like).
Why it is risky: Future developers may not know what rules apply to this layer —
                 can it be imported cross-feature? Can it have side effects? What tests govern it?
Suggested ownership clarification:
    SENTRY recommendation (2026-05-18): Formally add Resolver as a permitted layer:
    "DI factory layer — creates injectable closures for shared engine configure*() functions.
    May query Supabase directly (initialized-DAL pattern). Never called by components, hooks,
    or screens. Always injected at startup via setup.js."
    IRONMAN must own adding this to the architecture contract.
```

```text
OWNERSHIP BOUNDARY WARNING #2
Location:       features/identity/resolvers/vcsmIdentity.resolver.js:16
                export async function resolveVcsmActorForProvisioning(supabase, userId)
Current ambiguity: Dead export with no documented owner for removal decision.
                   Function queries vc.actors (sensitive identity data), is never called,
                   remains in the compiled bundle.
Why it is risky: Any future wiring of this function without review would expose sensitive
                 actor fields (kind, profile_id, vport_id, is_void) via a caller-supplied
                 supabase client — no RLS guarantee.
Suggested ownership clarification:
    Remove the export entirely. If a provisioning-path actor lookup is ever needed,
    it should go through the engine resolver (resolveAuthenticatedContext), not a
    standalone exported function.
    Owner for removal decision: IRONMAN / implementation owner.
```

```text
OWNERSHIP BOUNDARY WARNING #3
Location:       features/identity/controller/refreshActorDirectory.controller.js
Current ambiguity: 6-line hollow pass-through. Imports from DAL, re-exports unchanged.
                   No business logic, no ownership check, no error handling.
Why it is risky: Misleads developers expecting controller-layer logic.
                 If business rules around directory refresh are added, the correct location
                 is unclear. The controller layer's purpose is ambiguous for this function.
Suggested ownership clarification:
    Option A — Promote: Add error boundary or ownership guard (e.g. rate-limit check).
    Option B — Collapse: Have useIdentityOps.js import from the DAL directly and document
                         the exception ("direct DAL import approved for single-operation hooks").
    Owner for decision: IRONMAN / feature owner.
```

```text
OWNERSHIP BOUNDARY WARNING #4
Location:       state/identity/ ↔ features/identity/ boundary
Current ambiguity: The relationship between the state layer (state/identity/) and the
                   feature layer (features/identity/) is not documented. The state layer
                   calls into the feature layer via identityOps.adapter.js (correct). But
                   there is no written contract defining:
                   — which layer owns what responsibility
                   — what can state/identity/ import from features/identity/ (adapter only)
                   — what features/identity/ can import from state/identity/ (nothing — one-way)
Why it is risky: The companion system pattern is implicit. New developers may introduce
                 reverse dependencies (features/identity/ importing from state/identity/).
Suggested ownership clarification:
    Document the one-way dependency rule:
    state/identity/ → features/identity/adapters/ (allowed)
    features/identity/ → state/identity/ (FORBIDDEN — would create a circular dependency)
```

---

## Responsibility Classification

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---|---|
| Feature ownership | features/identity/ | HIGH | Clear primary owner |
| Engine ownership (consumer) | features/identity/setup.js | HIGH | Single DI wiring point |
| DAL ownership | features/identity/dal/ | HIGH | Both RPCs owned here |
| Controller ownership (bootstrap) | ensureVcsmPlatformBootstrap.controller.js | HIGH | Real logic present |
| Controller ownership (refresh) | refreshActorDirectory.controller.js | LOW | Hollow — RISK still open |
| Adapter boundary ownership | identity.adapter.js + identityOps.adapter.js | HIGH | Both adapters correct |
| Hook ownership | useIdentityOps.js | HIGH | Clear single-feature hook |
| Resolver ownership | vcsmIdentity.resolver.js | MEDIUM | Layer undocumented — RISK-9 |
| Setup / DI ownership | setup.js | HIGH | Called once from main.jsx |
| State layer ownership | state/identity/ | HIGH | Companion — well structured |
| Data ownership (read) | vcsmIdentity.resolver.js | HIGH | Only active table reader |
| Data ownership (write — RPC) | provision.rpc.dal.js | HIGH | SECURITY DEFINER, guarded |
| Data ownership (refresh — RPC) | refreshActorDirectory.dal.js | HIGH | Graceful, idempotent |
| Security audit ownership | MISSING | LOW | No security audit file for this feature |
| Documentation ownership | vcsm.dal.identity.md | MEDIUM | REVIEW_PENDING — needs LOGAN pass |
| Migration ownership | MISSING | LOW | CARNAGE not yet run for these RPCs |

---

## Ownership Boundary Risk

| Area | Risk | Reason | Recommended Clarification |
|---|---|---|---|
| `resolvers/` layer taxonomy | MEDIUM | No contract definition for this layer pattern | SENTRY recommendation: add Resolver layer to contract |
| Dead export `resolveVcsmActorForProvisioning` | MEDIUM | Queries sensitive `vc.actors` data; no removal owner | IRONMAN owns removal decision — remove function |
| `state/identity/` ↔ `features/identity/` boundary | MEDIUM | One-way dependency rule undocumented | Document rule in ownership file |
| Hollow controller `refreshActorDirectory.controller.js` | LOW | Adds no value; misleads developers | Promote or collapse per IRONMAN Option A/B |
| Security audit gap for SECURITY DEFINER RPC | LOW | No `CURRENT/features/dashboard/evidence/` file | Create security surface doc (VENOM task) |
| `vcsm.dal.identity.md` primary sections stale | LOW | RISK-4/6/7 still unpatched in original doc | LOGAN doc rebuild needed |

---

## Data Ownership Registry

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| `platform.user_app_actor_links` | identity feature | vcsmIdentity.resolver.js (active); resolveVcsmActorForProvisioning (dead) | provision_vcsm_identity RPC (SECURITY DEFINER) | platform schema RLS | MISSING (CARNAGE) | vcsm.dal.identity.md |
| `platform.user_app_access` | identity feature | unknown (not read by this feature) | provision_vcsm_identity RPC | platform schema RLS | MISSING (CARNAGE) | vcsm.dal.identity.md |
| `platform.user_app_accounts` | identity feature | state/identity/identity.read.dal.js | provision_vcsm_identity RPC | platform schema RLS | MISSING (CARNAGE) | vcsm.dal.identity.md |
| `platform.user_app_preferences` | identity feature | state/identity/ (inferred) | provision_vcsm_identity RPC | platform schema RLS | MISSING (CARNAGE) | vcsm.dal.identity.md |
| `platform.user_app_state` | identity feature | state/identity/ (inferred) | provision_vcsm_identity RPC | platform schema RLS | MISSING (CARNAGE) | vcsm.dal.identity.md |
| `vc.actors` (user_app_account_id column) | identity feature | multiple features via useIdentity | provision_vcsm_identity RPC (column update) | vc schema RLS | MISSING (CARNAGE) | vcsm.dal.identity.md |
| `identity.actor_directory` | identity feature | directory consumers (unknown) | refresh_actor_directory_row RPC | identity schema RLS | MISSING (CARNAGE) | vcsm.dal.identity.md |

---

## Rule Ownership Registry

| Rule | Owner | Enforcement Layer | Docs | Risk |
|---|---|---|---|---|
| Identity provisioning requires valid userId + actorId | ensureVcsmPlatformBootstrap.controller.js | Controller (2-layer: DAL throw + controller return) | vcsm.dal.identity.md | LOW — guarded |
| Directory refresh is non-fatal | refreshActorDirectory.dal.js | DAL (graceful return, never throws) | vcsm.dal.identity.md | LOW |
| Identity engine must be configured before use | setup.js (one-time DI) | Setup / DI | MISSING in ownership docs | MEDIUM — runtime failure if skipped |
| Cross-feature identity access must go through adapter | ARCHITECTURE.md | Enforced by SENTRY | architecture contract | LOW — verified clean |
| `provision_vcsm_identity` is the only platform bootstrap path | ensureVcsmPlatformBootstrap.controller.js | Controller | vcsm.dal.identity.md | LOW |
| `resolveVcsmActorForProvisioning` must not be wired | IRONMAN | No runtime enforcement | MISSING | MEDIUM — dead export still exported |

---

## Runtime Ownership Map

_Runtime ownership is inferred — LOKI not yet run for this feature._

| Runtime Flow | Entry Point | Owning Feature | Controllers | DALs | Hotspots |
|---|---|---|---|---|---|
| New user bootstrap | useAuthOnboarding.js or useJoinBarbershop.js | auth / join (consumers) → identity (ops) | ensureVcsmPlatformBootstrap.controller.js | provision.rpc.dal.js → platform.provision_vcsm_identity | SECURITY DEFINER RPC — high privilege, runs once per new user |
| Session self-heal (missing platform identity) | useIdentityResolutionEffect.hook.js | state/identity → identity ops | identitySelfHeal.controller.js → ensureVcsmPlatformBootstrap.controller.js | provision.rpc.dal.js | Triggered on every auth session where engine returns no platform identity |
| Actor directory refresh | useProfileController.js / useUpdateVportVisibility.js / vport.core.dal.js | settings, vport (consumers) → identity (ops) | refreshActorDirectory.controller.js (hollow) | refreshActorDirectory.dal.js → identity.refresh_actor_directory_row | Called post-write — fire-and-forget on update, awaited on create |
| Identity engine resolution | identityEngineQuery.js | state/identity | identity.controller.js | identity.read.dal.js + vcsmIdentity.resolver.js | Called on every auth context load; resolver queries platform.user_app_actor_links |

---

## Cross-Root Ownership Review

| Area | Claimed Owner | Actual Root | Boundary Status | Notes |
|---|---|---|---|---|
| identity engine | engines/identity/ | engines/ root | COMPLIANT — consumed via @identity alias only | Not directly imported from apps/ |
| vcsm identity feature | features/identity/ | apps/VCSM/ root | COMPLIANT — all cross-feature access via adapters | RISK-1/2 violations closed |
| state/identity/ | apps/VCSM/ root | apps/VCSM/ root | COMPLIANT — not shared with wentrex or Traffic | One-way dependency documented in this report |

---

## Engine Ownership Review

| Engine | Owner | Consumers in VCSM | Public Interfaces | Boundary Risk |
|---|---|---|---|---|
| engines/identity/ | Engine team / VCSM identity feature (DI wiring) | setup.js, state/identity/identity.controller.js, state/identity/identityContext.jsx, state/identity/identitySelfHeal.controller.js, state/identity/queries/identityEngineQuery.js, state/identity/controller/switchActor.controller.js | configureIdentityEngine, resolveAuthenticatedContext, invalidateIdentityResultCache, switchActiveActor, finalizeAccountState | LOW — all via @identity alias; no direct engine internals imported |

---

## Ownership Clarity Summary

**Ownership Clarity: PARTIAL**

Evidence:
- Primary owner clear: `features/identity/` owns all DAL, controller, adapter, and hook files
- Engine boundary clear: `engines/identity/` consumed via `@identity` alias only
- Adapter boundary clear: two adapters gate all cross-feature access
- Data ownership clear for active read path
- Gaps: resolver/setup layer taxonomy undocumented; dead export has no removal owner; state↔feature boundary rule undocumented; security audit file missing; migration ownership missing

Confidence: HIGH — the code is clean; the gaps are in documentation and governance, not in runtime architecture.

---

## IRONMAN Decisions — RISK-3, RISK-5, RISK-9

### RISK-3 — Resolver and Setup Layer Ownership Decision

**Decision:** Both `resolvers/vcsmIdentity.resolver.js` and `setup.js` are intentional, non-standard layers that serve the DI wiring pattern for the identity engine. They are **correctly placed** and should be formally documented.

**Taxonomy addition required (RISK-9 — see below).**

**Setup.js ownership:** `setup.js` is the **DI bootstrap file** — called once from `main.jsx` at app startup. It belongs to the identity feature and is the sole entry point for engine configuration. It should be listed in:
- The feature's ownership file
- The Architecture Pipeline section of `vcsm.dal.identity.md`
- A Logan doc that covers app startup wiring

**vcsmIdentity.resolver.js ownership:** Owned by the identity feature. Acts as the VCSM-specific implementation of the identity engine's `resolveAppContext` interface. It is not a DAL, controller, or hook — it is a **DI adapter** (injects VCSM-specific data access into the engine). Should be listed in all document sections that currently omit it.

### RISK-5 — Dead Export `resolveVcsmActorForProvisioning` — Removal Decision

**Decision: REMOVE.**

Rationale:
- Zero callers confirmed across all of `apps/VCSM/src/`
- Queries sensitive `vc.actors` fields (`kind`, `profile_id`, `vport_id`, `is_void`)
- Function signature accepts caller-supplied supabase client — trust-dependent
- The identity engine's `resolveAuthenticatedContext` already handles all active actor resolution needs
- No planned use case identified for this export
- Remaining in bundle increases attack surface for accidental future wiring

**Scope of removal:** Remove the `export async function resolveVcsmActorForProvisioning` block (lines 16–29 in `vcsmIdentity.resolver.js`). The `createVcsmAppContextResolver` function on the same file is active and must not be touched.

**Note:** IRONMAN does not modify code. This removal decision is issued for the implementation owner to act on. Per current append-only rule, no code change is made in this pass.

### RISK-9 — `resolvers/` Taxonomy — Architecture Contract Addition

**Decision: ADD `Resolver` layer to the architecture contract.**

SENTRY's 2026-05-18 recommendation is confirmed by IRONMAN.

Proposed taxonomy entry:

> **Resolver** — DI factory layer. Creates injectable closures that are passed to shared engine `configure*()` functions. May query Supabase directly (initialized-DAL pattern — the supabase client is captured at factory call time, not per-invocation). Never imported by components, hooks, or screens directly. Always wired at app startup via `setup.js`. May export multiple resolver factory functions for different engine configuration needs.

**Files this applies to currently:** `features/identity/resolvers/vcsmIdentity.resolver.js`

**Implementation:** IRONMAN recommends this be added to:
- `zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md` (locked contract — requires explicit user approval to modify)
- The Architecture Pipeline tables in all relevant Logan DAL docs

---

## Open Ownership Questions

| Question | Owner | Priority |
|---|---|---|
| Should `refreshActorDirectory.controller.js` be promoted (add logic) or collapsed (remove controller layer)? | IRONMAN + feature owner | LOW |
| What is the migration ownership for `provision_vcsm_identity` and `refresh_actor_directory_row` RPCs? | CARNAGE | LOW |
| Does `resolveVcsmActorForProvisioning` removal require a DB migration or just code removal? | CARNAGE (verify — likely code-only) | LOW |
| Who owns the security audit record for `provision_vcsm_identity` SECURITY DEFINER? | VENOM | MEDIUM |

---

## Summary

**Ownership Clarity: PARTIAL → moving toward CLEAR**

The identity feature's runtime architecture is clean and boundary-compliant. All HIGH violations are closed. The remaining gaps are:
1. Documentation taxonomy (RISK-9 — Resolver layer) — needs architecture contract addition
2. Dead code cleanup (RISK-5 — remove `resolveVcsmActorForProvisioning`) — code change needed
3. Documentation accuracy (RISK-3/4/6/7) — LOGAN pass on primary doc sections
4. Security + migration audit files — VENOM and CARNAGE tasks

No BLOCKING items. No release gate triggered.

**Required handoffs:**
- LOGAN — update primary sections of `vcsm.dal.identity.md`
- VENOM — create security audit record for SECURITY DEFINER surface
- CARNAGE — run migration ownership pass for both RPCs
- LOKI — runtime trace of bootstrap and self-heal paths (next scheduled verification)
