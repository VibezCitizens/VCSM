# VCSM Identity — Ownership Record

_Created:_ 2026-05-18
_IRONMAN pass:_ Initial ownership record — triggered by CEREBRO pass on `vcsm.dal.identity.md`
_Ownership Clarity:_ PARTIAL (boundary-compliant; gaps in documentation and taxonomy)

---

## 1. Purpose

The identity feature is the VCSM platform's **provisioning and ops layer** for actor-based identity. It is responsible for:

- Provisioning new users into the VCSM platform (bootstrap RPC chain)
- Refreshing the actor directory after any mutation that changes actor-visible data
- Wiring the VCSM-specific app context resolver into the shared identity engine at startup
- Providing a non-React adapter boundary for non-hook callers (vport DAL, self-heal controller)

The identity feature has **no own UI**. It is a pure operations provider consumed by auth, join, settings, and vport features, and by the `state/identity/` companion state layer.

---

## 2. Application Scope

**VCSM + ENGINE**

The identity feature (`features/identity/`) is a VCSM app-layer feature. It consumes `engines/identity/` via the `@identity` alias for shared engine logic (resolution, state finalization, actor switching). The two systems are distinct: `features/identity/` provides VCSM-specific provisioning operations; `engines/identity/` provides shared identity resolution and state management.

---

## 3. Code Roots

| Root | Role |
|---|---|
| `apps/VCSM/src/features/identity/` | Primary feature root — DAL, controller, adapter, hook, resolver, setup |
| `apps/VCSM/src/state/identity/` | Companion state layer — in-memory identity state, actor switching, self-heal |
| `engines/identity/` | Shared identity engine — consumed via `@identity` alias |

---

## 4. Core Layers

**DAL:**
- `features/identity/dal/provision.rpc.dal.js` — calls `platform.provision_vcsm_identity` (SECURITY DEFINER RPC)
- `features/identity/dal/refreshActorDirectory.dal.js` — calls `identity.refresh_actor_directory_row`

**Model:** MISSING — RPC responses consumed raw by controllers. No transformation layer.

**Controller:**
- `features/identity/controller/ensureVcsmPlatformBootstrap.controller.js` — real business logic (2-layer guard, idempotent bootstrap)
- `features/identity/controller/refreshActorDirectory.controller.js` — hollow pass-through (Structural Finding #2 — open since 2026-05-11)

**Adapter:**
- `features/identity/adapters/identity.adapter.js` — bundle adapter; re-exports `useIdentityOps`, `ensureVcsmPlatformBootstrap`, `refreshVcActorDirectory`, `useIdentity`, `IdentityProvider`
- `features/identity/adapters/identityOps.adapter.js` — ops-only adapter for non-React callers; re-exports `ensureVcsmPlatformBootstrap` and `refreshVcActorDirectory`

**Hook:**
- `features/identity/hooks/useIdentityOps.js` — wraps both ops functions into a single hook return

**Resolver (DI factory layer — see §15.Open Questions for taxonomy):**
- `features/identity/resolvers/vcsmIdentity.resolver.js` — VCSM-specific app context resolver injected into `engines/identity/` at startup via `configureIdentityEngine`. Queries `platform.user_app_actor_links`. Contains one dead export (`resolveVcsmActorForProvisioning` — removal decision: REMOVE, see §15).

**Setup (DI bootstrap layer):**
- `features/identity/setup.js` — called once from `main.jsx:19`; configures `engines/identity/` with supabase client and VCSM resolver; wires debug reporter

**Component:** MISSING — no UI in this feature

**Screen:** MISSING — feature is a pure ops provider; all consumers are in other features

---

## 5. Engines Used

| Engine | Alias | Imported Symbols | Importing File |
|---|---|---|---|
| `engines/identity/` | `@identity` | `configureIdentityEngine` | `features/identity/setup.js` |
| `engines/identity/` | `@identity` | `resolveAuthenticatedContext` | `state/identity/queries/identityEngineQuery.js` |
| `engines/identity/` | `@identity` | `invalidateIdentityResultCache` | `state/identity/identityContext.jsx` |
| `engines/identity/` | `@identity` | `switchActiveActor` | `state/identity/controller/switchActor.controller.js` |
| `engines/identity/` | `@identity` | `finalizeAccountState`, `switchActiveActor` | `state/identity/identitySelfHeal.controller.js` |
| `engines/identity/` | `@identity` | (additional exports) | `state/identity/identity.controller.js` |

---

## 6. Database / Schema Ownership

**Tables read (active):**
- `platform.user_app_actor_links` — read by `vcsmIdentity.resolver.js` at every auth context resolution (12-column explicit select; filtered: `actor_source='vc'`, `status='active'`)

**Tables read (dead-path only):**
- `vc.actors` — read by `resolveVcsmActorForProvisioning` (dead export; zero callers; REMOVAL DECISION issued)

**Tables written (via SECURITY DEFINER RPC — `platform.provision_vcsm_identity`):**
- `platform.user_app_access`
- `platform.user_app_accounts`
- `platform.user_app_preferences`
- `platform.user_app_state`
- `platform.user_app_actor_links` (actor_source='vc')
- `vc.actors` (user_app_account_id column bridge)

**Tables written (via RPC — `identity.refresh_actor_directory_row`):**
- `identity.actor_directory`

**RPCs owned:**

| RPC | Schema | Trust Level | Idempotent | Guard |
|---|---|---|---|---|
| `provision_vcsm_identity` | platform | SECURITY DEFINER — bypasses RLS for 6 operations | YES | 2-layer: DAL throw + controller return-false |
| `refresh_actor_directory_row` | identity | RLS-governed (not SECURITY DEFINER) | YES | null-check in DAL; graceful return on error |

**RLS policies:** Owned by `platform` and `identity` schema owners — not this feature's responsibility to define.

**Migration owner:** MISSING — CARNAGE not yet run for these RPCs.

---

## 7. Rule Ownership

| Rule | Enforcement Layer | Status |
|---|---|---|
| Platform bootstrap requires valid `userId` + `actorId` | Controller (return false) + DAL (throw) | ENFORCED — 2-layer guard |
| Directory refresh is non-fatal — never blocks primary operation | DAL (graceful return, never throws) | ENFORCED |
| Identity engine must be configured before any identity query | `setup.js` (one-time DI at app boot) | ENFORCED — `_configured` guard prevents double-init |
| Cross-feature access to identity ops must go through adapter | ARCHITECTURE.md + adapter boundary | ENFORCED — SENTRY verified 2026-05-18 |
| `provision_vcsm_identity` is the only platform bootstrap path | Controller layer (no alternate write path exists) | ENFORCED |
| `resolveVcsmActorForProvisioning` must not be wired | IRONMAN decision (removal) | NOT YET ENFORCED — dead export still present |
| `state/identity/` may import from `features/identity/adapters/` only | Enforced by adapter structure | ENFORCED — no reverse dependency found |
| `features/identity/` must not import from `state/identity/` | One-way dependency rule | DOCUMENTED HERE — no violations found |

---

## 8. Contracts Touched

- `ARCHITECTURE.md` — layer build order, adapter boundary rule, `@/` alias requirement
- `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md` — cross-feature adapter-only access rule
- `ARCHITECTURE.md` needs amendment to add `Resolver` layer definition (RISK-9 — IRONMAN decision issued)

---

## 9. Documentation Links

| Doc | Location | Status |
|---|---|---|
| Identity DAL doc (primary) | `_CANONICAL/logan/vcsm/dal/vcsm.dal.identity.md` | REVIEW_PENDING — original sections stale; 2026-05-18 pass appended |
| IRONMAN ownership audit | `CURRENT/features/dashboard/evidence/2026-05-18_ironman_identity-feature-ownership.md` | THIS FILE |
| Engine audit for `engines/identity/` | MISSING | Not yet created |
| Security audit (SECURITY DEFINER surface) | MISSING — `CURRENT/features/dashboard/evidence/` has no identity file | Required — VENOM task |
| Compliance audit | MISSING — `CURRENT/features/dashboard/evidence/` has no identity file | Required after next SENTRY pass |
| Migration audit | MISSING — CARNAGE not yet run for identity RPCs | Required |

---

## 10. Runtime Ownership

_Runtime ownership inferred — LOKI not yet run._

| Runtime Flow | Entry Point | Owning Feature | Key Files | Notes |
|---|---|---|---|---|
| New user bootstrap | `useAuthOnboarding.js` or `useJoinBarbershop.js` | auth/join → identity ops | `ensureVcsmPlatformBootstrap.controller.js` → `provision.rpc.dal.js` | SECURITY DEFINER RPC — highest privilege call in VCSM frontend |
| Session self-heal | `useIdentityResolutionEffect.hook.js` | state/identity → identity ops | `identitySelfHeal.controller.js` → `identityOps.adapter.js` → `ensureVcsmPlatformBootstrap.controller.js` | Triggered when engine returns no platform identity; runs on every qualifying auth session |
| Actor directory refresh | Multiple mutation callers | settings/vport/auth → identity ops | `refreshActorDirectory.dal.js` → `identity.refresh_actor_directory_row` | Post-write; always non-fatal; awaited on create, fire-and-forget on update |
| App context resolution | `identityEngineQuery.js` | state/identity → engine | `vcsmIdentity.resolver.js` → `platform.user_app_actor_links` | Runs at every auth context load; multi-actor supported |
| App startup DI wiring | `main.jsx:19` | app root → identity feature | `setup.js` → `configureIdentityEngine` | Runs once; `_configured` guard prevents double-init |

---

## 11. Responsibilities

The identity feature owns:
- The VCSM platform bootstrap RPC chain (provision + guard)
- The actor directory refresh operation after any actor-visible mutation
- The VCSM-specific app context resolver injected into the identity engine
- The DI wiring of the identity engine at app startup
- The adapter boundary for all cross-feature identity ops access

The identity feature does **not** own:
- In-memory actor identity state (owned by `state/identity/identityContext.jsx`)
- Actor switching logic (owned by `state/identity/controller/switchActor.controller.js`)
- Identity engine internals (owned by `engines/identity/`)
- Auth session management (owned by `features/auth/`)
- Actor profile rendering (owned by feature-specific screens/components)

---

## 12. Boundaries

| Boundary | Rule |
|---|---|
| Cross-feature access IN | Any feature needing identity ops must import from `identity.adapter.js` or `identityOps.adapter.js` — never from controllers or DAL directly |
| Cross-feature access OUT | `features/identity/` must never import from other feature internals |
| State layer dependency | `state/identity/` may import from `features/identity/adapters/` only — one-way |
| Engine dependency | `engines/identity/` consumed via `@identity` alias only — no direct engine internal imports |
| UI prohibition | This feature must never own screens, route components, or presentational components |
| Table writes | No client-side table writes — all writes go through owned RPCs |

---

## 13. Change Impact Rules

If any file in `features/identity/` changes:
- **DAL changes** → update `vcsm.dal.identity.md` · notify SENTRY (boundary check) · notify VENOM if RPC trust model changes
- **Controller changes** → update `vcsm.dal.identity.md` · check if adapter surface needs update
- **Adapter changes** → run review-contract (all cross-feature callers may be affected) · update this ownership file
- **Resolver changes** (`vcsmIdentity.resolver.js`) → LOKI trace required (runs on every auth load) · VENOM review if new table access added
- **Setup changes** (`setup.js`) → LOKI trace required · check `main.jsx` call site
- **RPC changes** (`provision_vcsm_identity` or `refresh_actor_directory_row`) → CARNAGE migration review required · update `vcsm.dal.identity.md` · check all 3 call sites for `refresh_actor_directory_row` (DAL + former bypass sites now via adapter)

---

## 14. Release Gate Notes

| Condition | Gate Triggered | Owner |
|---|---|---|
| `provision_vcsm_identity` RPC parameter contract changes | THOR gate — all callers must be updated | CARNAGE + IRONMAN |
| `refresh_actor_directory_row` RPC parameter contract changes | THOR gate — 3 consumer sites (DAL + 2 via identityOps.adapter.js) | CARNAGE + IRONMAN |
| `vcsmIdentity.resolver.js` changes | LOKI trace required before release | LOKI + VENOM |
| New cross-feature caller of identity ops | SENTRY review required | SENTRY |
| Dead export `resolveVcsmActorForProvisioning` removed | No release gate — code-only removal, zero callers | IRONMAN |

---

## 15. Open Ownership Questions

| ID | Question | Priority | Handoff |
|---|---|---|---|
| OQ-1 | ~~Should `resolvers/` layer be formally added to `ARCHITECTURE.md`?~~ | CLOSED | §2.8 added 2026-05-18 — user approved |
| OQ-2 | ~~Should `resolveVcsmActorForProvisioning` be removed?~~ | CLOSED | Removed 2026-05-18 — user approved |
| OQ-3 | Should `refreshActorDirectory.controller.js` be promoted (add logic) or collapsed? | LOW | IRONMAN + feature owner |
| OQ-4 | Who owns the migration history for `provision_vcsm_identity` and `refresh_actor_directory_row` RPCs? | LOW | CARNAGE |
| OQ-5 | Should `state/identity/` have its own ownership file separate from `features/identity/`? | LOW | IRONMAN (next pass) |
