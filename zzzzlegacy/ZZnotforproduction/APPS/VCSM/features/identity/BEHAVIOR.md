---
name: vcsm.identity.behavior
description: Feature-level behavior contract for the VCSM identity feature — built from governance artifacts
metadata:
  type: behavior
  status: ACTIVE
  authored-by: LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
  date: 2026-06-05
  priority: P1
  evidence-standard: GOVERNANCE_ARTIFACTS_ONLY
---

# Feature Behavior Contract — identity
**Application:** VCSM
**Status:** ACTIVE — built from governance artifacts (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001)
**Evidence standard:** Governance artifacts only. No source code read. UNKNOWN = unproven.

---

## §1 Purpose

The identity feature is the VCSM platform bootstrap and actor-directory sync layer. It serves two primary responsibilities:

1. **Platform Identity Provisioning** — Provisions the full platform identity record for a user+actor pair via a single idempotent RPC (`platform.provision_vcsm_identity`). This RPC is SECURITY DEFINER and atomically creates or ensures the existence of 6 platform identity rows on every login. The operation is designed to be called on every login; it no-ops if the rows already exist.

2. **Actor Directory Sync** — Provides reusable helpers to refresh the `identity.actor_directory` materialized view after any source-of-truth mutation elsewhere in the platform (e.g. profile or VPORT mutations).

Additionally, this feature owns the configuration of the shared identity engine with a VCSM-specific app-context resolver that reads multi-actor links from `platform.user_app_actor_links`.

**Ownership:** Platform / Identity domain. This feature is the single VCSM-side owner of engine configuration (`setupVcsmIdentityEngine`) and platform provisioning. It is consumed by the auth feature at login/registration and by all features that need post-mutation directory refresh. Primary responsibility sits with the platform team.

**There is no UI.** Identity is a platform-layer feature with no screens, routes, or components.

Sources: ARCHITECTURE.md §PURPOSE, §OWNERSHIP; INDEX.md §Source Inventory; modules/identity/INDEX.md §Module Summary

---

## §2 Entry Points

This feature has no screen or route entry points. All entry points are programmatic.

| Entry Point | Type | Description |
|---|---|---|
| `setup.js` | App initialization | Called once at app startup (`main.jsx`) to configure the identity engine before any component renders |
| `adapters/identity.adapter.js` | Public adapter | Primary public surface. Exposes `useIdentityOps`, `ensureVcsmPlatformBootstrap`, `refreshVcActorDirectory`, `useIdentity`, and `IdentityProvider` to other features |
| `adapters/identityOps.adapter.js` | Secondary adapter | Re-exports the two controller operations (`ensureVcsmPlatformBootstrap`, `refreshActorDirectory`) for cross-feature use |

**Security note:** `adapters/identityOps.adapter.js` exposes `ensureVcsmPlatformBootstrap` directly to UI callers with no ownership guard at the adapter layer. This is THOR BLOCKER BW-IDENT-001 — any component can call it with an arbitrary actorId. See §6 and §9.

Sources: ARCHITECTURE.md §ENTRY POINTS; modules/identity/ARCHITECTURE.md §Layer Stack; modules/identity/INDEX.md §Known Source Files

---

## §3 User Flows

### Flow 1 — Login Bootstrap (Happy Path)

1. App auth hook or login handler calls `ensureVcsmPlatformBootstrap({ userId, actorId })` via `identity.adapter.js` (public surface)
2. Controller validates that both `userId` and `actorId` are present; returns `{ ok: false, error: 'Missing userId or actorId' }` if either is absent
3. Controller calls `dalProvisionVcsmIdentity({ userId, actorId })`
4. DAL invokes `platform.provision_vcsm_identity` SECURITY DEFINER RPC with `userId` and `actorId`
5. RPC atomically creates or ensures the following 6 platform identity rows (no-op on conflict):
   - `platform.user_app_access`
   - `platform.user_app_accounts`
   - `platform.user_app_preferences`
   - `platform.user_app_state`
   - `platform.user_app_actor_links`
   - `vc.actors` (bridge row)
6. RPC returns `user_app_account_id`; controller returns `{ ok: true, userAppAccountId }`

Sources: modules/identity/ARCHITECTURE.md §Login Bootstrap Flow; modules/identity/INDEX.md §Write Surfaces; modules/identity/BEHAVIOR.md §BEH-IDENT-IDENT-001, BEH-IDENT-IDENT-002; outputs/2026/06/04/BlackWidow §4.5 Callgraph

### Flow 2 — Self-Heal Bootstrap (SECURITY CONCERN — open THOR BLOCKER)

This flow is triggered when `resolveAuthenticatedContext` returns `ACCESS_DENIED`, which causes `loadDefaultIdentityForUser` to return null, which then triggers self-heal.

1. Identity engine raises `ACCESS_DENIED` on resolution for a user whose platform rows are absent or whose access gate fails
2. The error is caught and returns null (no identity committed)
3. `findSelfHealActorForUser(user.id)` queries `vc.actors` by `profile_id = userId` to find the user's actor
4. `bootstrapIdentitySelfHeal` is called with the found actor — this calls `ensureVcsmPlatformBootstrap` again
5. If the RPC does not check `platform.user_app_access.status` before upserting rows, a revoked user receives fresh provisioned access

**WARNING:** This path is an OPEN THOR BLOCKER (VEN-IDENTITY-002 / BW-IDENT-006). Revoked users may be re-provisioned through this path. Whether the DB RPC blocks revoked users cannot be confirmed from governance artifacts alone.

Sources: modules/identity/BEHAVIOR.md §BEH-IDENT-IDENT-003; modules/identity/ARCHITECTURE.md §Revoked User Self-Heal Path; outputs/2026/06/04/BlackWidow §6.F

### Flow 3 — Actor Directory Refresh (Happy Path)

1. A cross-feature mutation handler (profile or VPORT mutation) calls `refreshActorDirectory` via `identityOps.adapter.js`
2. `refreshActorDirectory.controller.js` (thin re-export) delegates to `refreshActorDirectory.dal.js`
3. DAL invokes `identity.refresh_actor_directory_row RPC` with `actorDomain` and `actorId`
4. RPC updates the actor's row in the `identity.actor_directory` materialized view
5. **The call is fire-and-forget. Failures are silent — no retry, no rollback of the triggering mutation.**

Sources: modules/identity/ARCHITECTURE.md §Actor Directory Refresh Flow; modules/identity/BEHAVIOR.md §BEH-IDENT-IDENT-004; ARCHITECTURE.md §MODULE DATA CONTRACT

### Flow 4 — UI Ops Refresh

1. A UI component calls `refreshVcActorDirectory(actorId)` via `useIdentityOps()` hook
2. Hook delegates to `identityOps.adapter.js` → `refreshActorDirectory.controller.js` → DAL → RPC
3. No ownership check is performed at the hook or adapter layer — any component can trigger refresh for any actorId

**WARNING:** BW-IDENT-007 — no ownership guard at hook or adapter layer. See §9 INVARIANT-7.

Sources: modules/identity/ARCHITECTURE.md §UI Ops Surface; modules/identity/BEHAVIOR.md §BEH-IDENT-IDENT-007

### Flow 5 — Actor Switch

1. A UI component triggers actor switch via `switchActorController({ actorId, ctx })`
2. The target actor must be present in `ctx.availableActors` — actors resolved from the authenticated engine context for the current account
3. Engine validates that the link `row.is_switchable` is true and `row.status === 'active'`
4. Engine validates `row.user_app_account_id` matches the current `userAppAccountId`
5. Engine calls `dalSetActiveActorLink` to update `platform.user_app_preferences`
6. Identity result cache is cleared (full cache clear, not per-user) via `invalidateIdentityResultCache()`

**Non-fatal edge case:** If `actorId` is null, a TypeError is thrown at `actorId.slice(0,8)` before the ctx validation guard. The error is caught; `{ success: false }` is returned. No identity commit occurs. (BW-IDENT-005)

Sources: outputs/2026/06/04/BlackWidow §6.C, §6.E, §6.F; outputs/2026/06/04/Venom §8 Source Verification Summary

---

## §4 Business Rules

**RULE-1 (Idempotency):** `ensureVcsmPlatformBootstrap` is idempotent — safe to call on every login. Calling it for a user+actor pair that already has platform rows performs a no-op (ON CONFLICT behavior enforced at the RPC level). Evidence: modules/identity/BEHAVIOR.md §BEH-IDENT-IDENT-001; outputs/2026/06/04/BlackWidow §6.F

**RULE-2 (Platform Layer Only — No UI):** The identity feature has zero screens, zero routes, and zero UI components. All behavioral interaction is through programmatic entry points (adapters, hooks). Evidence: ARCHITECTURE.md §LAYER MAP; INDEX.md §Routes

**RULE-3 (Engine Configured Once):** `setup.js` configures the identity engine once at app startup via a `_configured` singleton flag. Double-initialization is guarded. Evidence: ARCHITECTURE.md §MODULE RUNTIME READINESS (Cache behavior row); modules/identity/BEHAVIOR.md §BEH-IDENT-IDENT-006

**RULE-4 (Adapter Boundary — Only Approved Surface):** Other features must import identity operations exclusively through `identity.adapter.js` or `identityOps.adapter.js`. Direct imports of controllers or DAL by other features are not approved. Evidence: modules/identity/ARCHITECTURE.md §Module Boundaries

**RULE-5 (Resolver Module is Read-Only):** The `resolvers/` sub-directory (`vcsmIdentity.resolver.js`) performs only reads. It does not mutate identity state. Evidence: modules/resolvers/INDEX.md §Write Surfaces ("None"); modules/resolvers/ARCHITECTURE.md §Module Boundaries

**RULE-6 (Multi-Actor Support):** The VCSM-specific app-context resolver reads all active `vc`-source actor links from `platform.user_app_actor_links` for the authenticated account. This supports multi-actor identities within a single user account. Evidence: ARCHITECTURE.md §PURPOSE; outputs/2026/06/04/Venom §Scanner Signals Block (Multi-actor identity switching)

**RULE-7 (Directory Refresh is Fire-and-Forget):** The `identity.refresh_actor_directory_row` RPC call is explicitly fire-and-forget. If it fails, the actor's directory row may be stale with no alert or retry. The triggering mutation is not rolled back. Evidence: ARCHITECTURE.md §MODULE DATA CONTRACT; modules/identity/BEHAVIOR.md §BEH-IDENT-IDENT-004

**RULE-8 (SPA-Only Cache Assumption):** The identity engine 120s result cache is designed for SPA (browser) contexts only. In an SPA, process death on tab close eliminates cross-session risk. This assumption is NOT safe if the engine is ever deployed in an SSR context. Evidence: outputs/2026/06/04/Venom §VEN-IDENTITY-004; modules/identity/INDEX.md §Security Flags

**RULE-9 (Actor Switch Ownership Gate):** An actor switch only succeeds when the target actor is in the current account's `availableActors` list AND the engine validates `user_app_account_id` ownership. Cross-account actor switches are blocked. Evidence: outputs/2026/06/04/BlackWidow §6.C, §Invariant I-3

**RULE-10 (Public Identity Surface — No Raw IDs):** `toPublicIdentity()` returns only `actorId`, `kind`, and `ownerActorId` — no `profileId`, `vportId`, or raw `userId`. `getProfilePath()` returns `/profile/self` — no actorId embedded in the URL path. Evidence: outputs/2026/06/04/BlackWidow §6.H (BW-IDENT-008 — BLOCKED / CLOSED)

---

## §5 State Rules

The identity feature does not implement a named state machine. However, the following state transitions are implied by governance artifacts:

| State | Condition | Next State | Notes |
|---|---|---|---|
| UNPROVISIONED | User has no platform identity rows | PROVISIONING | Bootstrap RPC called on login |
| PROVISIONING | RPC in flight | PROVISIONED (ok) or UNPROVISIONED (error) | Idempotent — re-calling is safe |
| PROVISIONED | Platform rows exist, access granted | ACTIVE | Normal operational state |
| REVOKED | `platform.user_app_access.status = 'revoked'` | REVOKED (should be terminal) | Self-heal bypass risk — VEN-IDENTITY-002 / BW-IDENT-006 may re-provision revoked users |
| SELF_HEAL_TRIGGERED | `resolveAuthenticatedContext` returns null | PROVISIONING (re-bootstrap) | THOR BLOCKER: revoked users may re-enter PROVISIONING |
| ACTOR_SWITCHED | `switchActiveActor` succeeds | ACTIVE (new actor) | Identity result cache cleared on switch |

**Engine configuration state:**
| State | Condition |
|---|---|
| UNCONFIGURED | Before `setup.js` runs |
| CONFIGURED | After `setup.js` sets `_configured` flag — permanent for process lifetime |

**Cache state:**
| State | Condition | TTL |
|---|---|---|
| CACHED | Identity resolved within 120s | 120s from resolution |
| CACHE_INVALIDATED | Actor switch, logout cleanup, or explicit invalidation | N/A — cleared immediately |

Sources: ARCHITECTURE.md §MODULE RUNTIME READINESS; outputs/2026/06/04/BlackWidow §6.F; modules/identity/BEHAVIOR.md §Critical Invariants; outputs/2026/06/04/Venom §VEN-IDENTITY-004

---

## §6 Security Constraints

Derived from VENOM and BlackWidow findings. Each finding implies a constraint that must hold.

**CONSTRAINT-1:** `ensureVcsmPlatformBootstrap` must never provision a platform identity for an actorId not owned by the calling user. — Evidence: VEN-IDENTITY-002 (HIGH, THOR BLOCKER): self-heal path bypasses platform access gate; BW-IDENT-001 (HIGH, THOR BLOCKER): controller accepts arbitrary actorId without pre-check ownership verification before RPC call

**CONSTRAINT-2:** A revoked user must never be re-provisioned with platform access via the self-heal path. — Evidence: VEN-IDENTITY-002 (HIGH, THOR BLOCKER): ACCESS_DENIED from engine triggers self-heal bootstrap which calls provision RPC; BW-IDENT-006 (HIGH, THOR BLOCKER): adversarial confirmation of revoked-user replay chain

**CONSTRAINT-3:** The cross-user identity commit guard must never be silently bypassed. An identity with a null `_engineMeta.userId` must be rejected, not committed. — Evidence: VEN-IDENTITY-003 (MEDIUM): conditional guard `if (identityUserId && identityUserId !== user.id)` evaluates to falsy when `identityUserId` is null, silently skipping the check; BW-IDENT-002 (HIGH, THOR BLOCKER): adversarial confirmation of null bypass path

**CONSTRAINT-4:** The identity engine result cache (120s TTL) must only be used in single-user SPA contexts. It must not be used in SSR, edge function, or any multi-user server context. — Evidence: VEN-IDENTITY-004 (MEDIUM): cache keyed by `userId:appKey` in module-level singleton — cross-session leakage possible in SSR contexts

**CONSTRAINT-5:** `refreshActorDirectoryRow` must not allow any authenticated caller to trigger a directory refresh for an arbitrary actorId they do not own. — Evidence: BW-IDENT-004 (MEDIUM): DAL passes actorId to RPC with no client-side ownership check; ownership enforcement deferred entirely to the DB RPC

**CONSTRAINT-6:** `refreshVcActorDirectory` exposed via `useIdentityOps` must enforce actor ownership before triggering a directory refresh. — Evidence: BW-IDENT-007 (LOW): no ownership guard at hook or adapter layer

**CONSTRAINT-7:** No raw userId, profileId, or vportId must appear in any public URL surface generated by the identity feature. — Evidence: BW-IDENT-008 (INFO — CLOSED/BLOCKED): `getProfilePath` returns `/profile/self`; no linkPath or UUID construction found in identity controllers

**CONSTRAINT-8:** Actor-kind eligibility gates (e.g. `canCitizenBook`) must be enforced at the controller level, not only at the selector level, in consuming features. — Evidence: BW-IDENT-003 (MEDIUM): `canCitizenBook` is selector-only; no controller-level kind gate enforcement found in identity or consuming controllers

---

## §7 Error Handling

The following error states are documented in governance artifacts:

| Scenario | Behavior | Source |
|---|---|---|
| `ensureVcsmPlatformBootstrap` called with null/missing `userId` or `actorId` | Returns `{ ok: false, error: 'Missing userId or actorId' }` immediately — no DB call | ARCHITECTURE.md §MODULE RUNTIME READINESS (Auth/owner gates); outputs/2026/06/04/BlackWidow §6.E |
| `ensureVcsmPlatformBootstrap` RPC call fails | Controller catches error; returns `{ ok: false, error }` | ARCHITECTURE.md §MODULE RUNTIME READINESS (Error state) |
| `refreshActorDirectory` RPC fails | Failure is silent — fire-and-forget; no retry, no rollback of caller's mutation | ARCHITECTURE.md §MODULE DATA CONTRACT; modules/identity/BEHAVIOR.md §BEH-IDENT-IDENT-004 |
| `resolveAuthenticatedContext` raises `ACCESS_DENIED` | Error is caught; null is returned; self-heal bootstrap is triggered (SECURITY RISK — BW-IDENT-006) | outputs/2026/06/04/BlackWidow §6.F; modules/identity/ARCHITECTURE.md §Revoked User Self-Heal Path |
| `resolveAuthenticatedContext` called with null `appKey` | Queries `platform.apps` with null key; throws `APP_NOT_FOUND`; BLOCKED | outputs/2026/06/04/BlackWidow §6.E |
| `switchActorController` called with null `actorId` | TypeError thrown at `actorId.slice(0,8)` before guard; caught; returns `{ success: false }`; non-fatal; no identity committed | outputs/2026/06/04/BlackWidow §6.E (BW-IDENT-005 — LOW) |
| Identity loaded via non-engine hydration path where `_engineMeta` is absent | Cross-user ownership check is silently skipped; identity committed without verification (OPEN — VEN-IDENTITY-003) | outputs/2026/06/04/Venom §VEN-IDENTITY-003 |

**Loading state:** The engine is configured synchronously at app start via `_configured` flag. There is no async loading state for setup.js. Evidence: ARCHITECTURE.md §MODULE RUNTIME READINESS (Loading state row)

**Empty/ZERO_ROWS state:** The resolver returns an empty `actorLinks` array with safe defaults when no actor links are found. Evidence: ARCHITECTURE.md §MODULE RUNTIME READINESS (Empty state row)

**Retry contract for `refreshActorDirectory`:** UNKNOWN — REQUIRES IMPLEMENTATION REVIEW. No retry contract is documented in any governance artifact. Governance artifacts confirm fire-and-forget behavior only.

**Observability for refresh failure:** UNKNOWN — REQUIRES IMPLEMENTATION REVIEW. Governance artifacts flag this as a gap (modules/identity/BEHAVIOR.md §TODO: "Confirm whether fire-and-forget failure in refreshActorDirectory has any observability (Sentry, log)")

---

## §8 Cross-Feature Dependencies

**Independence status:** MOSTLY INDEPENDENT (Source: CURRENT_STATUS.md §ARCHITECT)

| Dependency | Direction | Boundary | Notes |
|---|---|---|---|
| `engines/identity` | INBOUND + OUTBOUND | Approved | `setup.js` calls `configureIdentityEngine`; feature both configures and consumes the engine |
| `engines/directory` | OUTBOUND | Approved | Consumed via adapters; `identity.actor_directory` is the target of refresh operations |
| `engines/hydration` | OUTBOUND | Approved | Listed by scanner; hydration engine is a dependency |
| `@/state/identity/identityContext` | OUTBOUND | Approved | `useIdentity` and `IdentityProvider` re-exported through `identity.adapter.js`; callers of the adapter reach into state layer indirectly |
| `@/services/supabase/supabaseClient` | OUTBOUND | Approved | Used in both DAL files |
| `@debuggers/identity` | OUTBOUND | Dev-only | Used in controller and DAL; production-safe if debug guard is in place |
| `platform.user_app_actor_links` | DB READ | Approved | Resolver reads actor links from platform schema |
| `platform.provision_vcsm_identity` | DB WRITE (RPC) | Approved | SECURITY DEFINER RPC; creates 6 platform rows |
| `identity.refresh_actor_directory_row` | DB WRITE (RPC) | Approved | Refreshes materialized directory row |
| **auth feature** | CONSUMER | Inbound | Auth feature calls `ensureVcsmPlatformBootstrap` at login/registration |
| **profile/vport mutations (cross-feature)** | CONSUMER | Inbound | Features with profile/vport mutations call `refreshActorDirectory` after write |

**No direct cross-feature DAL imports detected.** All cross-boundary access is through adapters. Evidence: ARCHITECTURE.md §MODULE BOUNDARY WARNINGS, §MODULE DEPENDENCY GRAPH

---

## §9 Must Never Happen — Security Invariants

These invariants are derived from VENOM and BlackWidow findings. They represent what the identity feature must guarantee for the platform to be safe. Finding IDs indicate where each invariant was found to be at risk.

**INVARIANT-1:** A platform identity must never be provisioned for an actorId that is not owned by the requesting user's auth session. — Violated by: BW-IDENT-001 (THOR BLOCKER): `ensureVcsmPlatformBootstrap` exposed via adapter with no ownership pre-check; DB RPC is the only backstop and its enforcement cannot be confirmed from governance artifacts alone

**INVARIANT-2:** A revoked user must never have their platform access re-provisioned through the self-heal bootstrap path. — Violated by: VEN-IDENTITY-002 (HIGH, THOR BLOCKER), BW-IDENT-006 (HIGH, THOR BLOCKER): `ACCESS_DENIED` from engine triggers self-heal without checking `platform.user_app_access.status` before calling bootstrap

**INVARIANT-3:** An identity belonging to a different user than the active session must never be committed to the identity context. When `_engineMeta.userId` is null, the identity commit must be rejected, not silently accepted. — Violated by: VEN-IDENTITY-003 (MEDIUM), BW-IDENT-002 (HIGH, THOR BLOCKER): conditional guard `if (identityUserId && ...)` evaluates falsy when userId is null

**INVARIANT-4:** An actor switch must never succeed for an actor that does not belong to the current authenticated account. — Status: BLOCKED. Evidence: outputs/2026/06/04/BlackWidow §Invariant I-3 — blocked at `switchActor.controller.js:84` (availableActors check) and `switchActiveActor.controller.js:31` (user_app_account_id ownership check)

**INVARIANT-5:** The identity engine 120s result cache must never be used in an SSR or multi-user server context. — Violated by: VEN-IDENTITY-004 (MEDIUM): no enforcement of SPA-only assumption; cache is SPA-safe but could be deployed in unsafe context without warning

**INVARIANT-6:** The public identity surface (`useIdentity()`, `toPublicIdentity()`) must never expose raw `profileId`, `vportId`, or `userId` to consumers. — Status: BLOCKED. Evidence: outputs/2026/06/04/BlackWidow §Invariant I-4 — `toPublicIdentity` returns only `actorId`, `kind`, `ownerActorId`; `getProfilePath` returns `/profile/self`

**INVARIANT-7:** `refreshVcActorDirectory` must never be callable with an arbitrary actorId by any UI component without ownership verification. — Violated by: BW-IDENT-007 (LOW): `useIdentityOps` exposes the function with no ownership guard at the hook or adapter layer

**INVARIANT-8:** Actor-kind eligibility gates must never be enforced only at the selector layer in consuming features; controller-level enforcement is required. — Violated by: BW-IDENT-003 (MEDIUM): `canCitizenBook` (and similar checks) are selector-only; no controller-level kind gate found

---

## §10 Module Responsibilities

The identity feature has two documented modules:

### Module: identity
**Source path:** `apps/VCSM/src/features/identity/`
**Responsibility:** Bootstrap and operations layer. Owns the authentication bootstrap lifecycle, actor directory refresh, engine configuration (`setup.js`), and the public adapter surface consumed by the rest of the platform. Called on every login — auth-critical path.

**Key operations documented in governance:**
- `ensureVcsmPlatformBootstrap` — idempotent platform provisioning on every login (OPEN THOR BLOCKERS: BW-IDENT-001, BW-IDENT-006)
- `refreshActorDirectory` — fire-and-forget actor directory row refresh after source mutations
- Engine configuration via `setup.js` (runs once at app startup)
- `useIdentityOps` hook — exposes both operations to UI components (BW-IDENT-007: no ownership guard on refresh)

**Module BEHAVIOR.md status:** STUB — all behaviors are UNVERIFIED / ARCHITECT-derived. No behavior contract existed prior to this LOGAN pass. Evidence: modules/identity/BEHAVIOR.md §Status

### Module: resolvers
**Source path:** `apps/VCSM/src/features/identity/resolvers/`
**Responsibility:** Identity resolution layer. Provides the injectable resolver pattern (`vcsmIdentity.resolver.js`) consumed by other features to perform actor identity lookups without direct engine coupling. This module is read-only — it resolves existing identity state and does not create or mutate it.

**Key operations documented in governance:**
- Resolver accepts a context and returns identity object (actorId, actorKind, roleKeys, capabilityKeys, isSuspended, defaultDestination) for the current actor
- Resolver is injected into consuming features (feed, booking, profiles, dashboard — per architectural implication; actual consumer list is UNKNOWN — REQUIRES IMPLEMENTATION REVIEW)
- Returns actorKind used by consuming features to gate eligibility (e.g. `canCitizenBook`)
- Identity engine caches resolution result for 120s (SPA-safe; SSR risk documented in VEN-IDENTITY-004)

**Module BEHAVIOR.md status:** STUB — all behaviors are UNVERIFIED / ARCHITECT-derived. Evidence: modules/resolvers/BEHAVIOR.md §Status

---

## §11 Known Gaps

### Sections with UNKNOWN content

1. **§7 Error Handling — Retry contract:** No retry contract is documented for `refreshActorDirectory` fire-and-forget failures.
2. **§7 Error Handling — Observability:** Whether refresh failures are logged to Sentry or any observability tool is undocumented.
3. **§3 Flow 2 — Self-Heal DB Enforcement:** Whether `platform.provision_vcsm_identity` RPC checks `user_app_access.status` before upserting rows cannot be confirmed from governance artifacts alone (THOR BLOCKER open).
4. **§10 — Resolver Consumers:** The full list of cross-feature consumers of `vcsmIdentity.resolver.js` is not documented. Architectural implication identifies feed, booking, profiles, and dashboard as likely consumers — not confirmed.
5. **§3 — Bootstrap Entry Point:** Which specific auth hook or component is the upstream caller of `ensureVcsmPlatformBootstrap` in the login flow is not confirmed in governance artifacts.
6. **§5 — Exact 6 Rows in Provisioning:** The exact 6 rows provisioned by `platform.provision_vcsm_identity` are listed in the modules/identity/ARCHITECTURE.md (governance artifact — ARCHITECT-derived, UNVERIFIED). Verification against the DB migration is not available from governance artifacts.

### Missing Governance Files

- **OWNERSHIP.md** — Not present. Formal ownership record is absent. Feature is attributed to the platform team by ARCHITECTURE.md, but no OWNERSHIP.md file exists.
- **TESTS.md** — Not present. Zero test coverage on an auth-critical bootstrap path. SPIDER-MAN has been recommended but not run.
- **ELEKTRA report** — ELEKTRA has never been run on this feature. The SECURITY DEFINER provisioning RPC path and cache invalidation paths have not been reviewed by ELEKTRA.

### Open THOR Blockers (see §13)

All 6 THOR blockers remain open as of 2026-06-04.

### Placeholder Modules

Both `modules/identity/` and `modules/resolvers/` governance files are STUBs — all behaviors are ARCHITECT-derived and UNVERIFIED. Module-level BEHAVIOR.md, ARCHITECTURE.md, SECURITY.md, and INDEX.md files exist for both modules but carry STUB status.

---

## §12 Validation Sources

All governance files read during this LOGAN pass:

| File | Status | Key Facts Extracted |
|---|---|---|
| `ZZnotforproduction/APPS/VCSM/features/identity/CURRENT_STATUS.md` | READ | Architecture state: STABLE; Independence: MOSTLY INDEPENDENT; Spaghetti: CLEAN; Top gap: BEHAVIOR.md placeholder; Recommended handoffs: LOGAN, SPIDER-MAN, IRONMAN, VENOM, SENTRY |
| `ZZnotforproduction/APPS/VCSM/features/identity/SECURITY.md` | READ | THOR Release Blocker: YES — VEN-IDENTITY-001, VEN-IDENTITY-002, BW-IDENT-001, BW-IDENT-002, BW-IDENT-006, BW-IDENT-009; Highest severity: HIGH; ELEKTRA: NEVER RUN |
| `ZZnotforproduction/APPS/VCSM/features/identity/ARCHITECTURE.md` | READ | Module purpose, layer map, dependency graph, data contract, runtime readiness, module completeness matrix, spaghetti score, behavior consistency check |
| `ZZnotforproduction/APPS/VCSM/features/identity/INDEX.md` | READ | Source inventory (9 files), write surface map, security-sensitive surfaces, engine dependencies |
| `ZZnotforproduction/APPS/VCSM/features/identity/modules/identity/BEHAVIOR.md` | READ | 7 ARCHITECT-derived, UNVERIFIED behaviors; 4 critical invariants (inferred); STUB status |
| `ZZnotforproduction/APPS/VCSM/features/identity/modules/identity/ARCHITECTURE.md` | READ | Layer stack diagrams for bootstrap, self-heal, directory refresh, and UI ops flows; source file map; write surfaces; module boundaries |
| `ZZnotforproduction/APPS/VCSM/features/identity/modules/identity/INDEX.md` | READ | Module summary; known source files; THOR blockers (4); security flags |
| `ZZnotforproduction/APPS/VCSM/features/identity/modules/identity/SECURITY.md` | READ | 6 open findings: 3 THOR blockers, 2 MEDIUM, 1 LOW; ELEKTRA: NEVER RUN |
| `ZZnotforproduction/APPS/VCSM/features/identity/modules/resolvers/BEHAVIOR.md` | READ | 4 ARCHITECT-derived, UNVERIFIED behaviors; STUB status |
| `ZZnotforproduction/APPS/VCSM/features/identity/modules/resolvers/ARCHITECTURE.md` | READ | Injectable resolver pattern layer stack; read-only module; 120s cache architecture; module boundaries |
| `ZZnotforproduction/APPS/VCSM/features/identity/modules/resolvers/INDEX.md` | READ | Single-file read-only module; 4 security flags (all MEDIUM); all STUB governance files |
| `ZZnotforproduction/APPS/VCSM/features/identity/modules/resolvers/SECURITY.md` | READ | 4 open findings attributed to resolver layer (all MEDIUM); ELEKTRA: NEVER RUN |
| `ZZnotforproduction/APPS/VCSM/features/identity/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_identity-security-review.md` | READ | 5 findings (0 CRIT, 2 HIGH, 2 MEDIUM, 1 LOW); THOR blockers: VEN-IDENTITY-001, VEN-IDENTITY-002; full source verification summary; mitigation plan |
| `ZZnotforproduction/APPS/VCSM/features/identity/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_identity-adversarial-review.md` | READ | 9 findings (0 CRIT, 4 HIGH, 2 MEDIUM, 2 LOW, 1 INFO); THOR blockers: BW-IDENT-001, BW-IDENT-002, BW-IDENT-006, BW-IDENT-009; full callgraph backwards trace; adversarial attack path analysis; §9 invariant attack map |

**Not found (secondary files):**
- `OWNERSHIP.md` — does not exist
- `TESTS.md` — does not exist

---

## §13 THOR Release Status

**Exact text from SECURITY.md THOR Release Blocker field:**
> THOR Release Blocker: YES — VEN-IDENTITY-001, VEN-IDENTITY-002, BW-IDENT-001, BW-IDENT-002, BW-IDENT-006, BW-IDENT-009

**Current THOR Status: BLOCKED**

| Blocker ID | Source | Severity | Description |
|---|---|---|---|
| VEN-IDENTITY-001 | VENOM 2026-06-04 | HIGH | BEHAVIOR.md was a placeholder — zero security rules, zero must-never-happen invariants. This BEHAVIOR.md (authored by LOGAN) partially resolves the governance gap. SPIDER-MAN regression tests and SECURITY.md update required to fully close. |
| VEN-IDENTITY-002 | VENOM 2026-06-04 | HIGH | Self-heal path bypasses platform access gate — revoked users may re-provision via `ensureVcsmPlatformBootstrap`. Requires code change: add access gate check in `identitySelfHeal.controller.js` before calling bootstrap |
| BW-IDENT-001 | BlackWidow 2026-06-04 | HIGH | Bootstrap RPC ownership pre-check absent — `ensureVcsmPlatformBootstrap` accepts arbitrary actorId without verifying ownership before calling `provision_vcsm_identity`. DB RPC may block; client has no guard |
| BW-IDENT-002 | BlackWidow 2026-06-04 | HIGH | Null `engineMeta.userId` silently skips cross-user ownership guard — identity can be committed for wrong session user if engine returns null userId in context |
| BW-IDENT-006 | BlackWidow 2026-06-04 | HIGH | Self-heal replay path for revoked users (adversarial cross-confirmation of VEN-IDENTITY-002) — ACCESS_DENIED caught, returns null, re-triggers bootstrap for revoked users |
| BW-IDENT-009 | BlackWidow 2026-06-04 | HIGH | BEHAVIOR.md was PLACEHOLDER — zero §9 invariants anchored; all adversarial probes operated without formal contract. This BEHAVIOR.md authors the §9 invariants. SPIDER-MAN regression tests required to fully anchor them. |

**Note on VEN-IDENTITY-001 and BW-IDENT-009:** This BEHAVIOR.md file directly addresses both blockers by authoring the missing behavior contract and §9 invariants. To formally close these blockers:
1. Update SECURITY.md to reflect this BEHAVIOR.md as ACTIVE
2. SPIDER-MAN must write regression tests anchored to §9 invariants
3. THOR gate must be re-evaluated with the new contract in place

**VEN-IDENTITY-002, BW-IDENT-001, BW-IDENT-002, BW-IDENT-006** require code changes and/or DB verification — they cannot be closed by documentation alone.
