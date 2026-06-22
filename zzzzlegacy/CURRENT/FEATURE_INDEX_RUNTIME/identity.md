# Runtime Feature Index: identity

## Metadata
| Field | Value |
|---|---|
| Feature | identity |
| CURRENT Folder | CURRENT/features/identity |
| Source Folder | apps/VCSM/src/features/identity |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |
| Last ARCHITECT Run | 2026-06-02 (ARCHITECT-IDENTITY-0001) |

---

## Source Inventory

| Layer | Count | Key Files |
|---|---:|---|
| Controllers | 2 | ensureVcsmPlatformBootstrap.controller.js, refreshActorDirectory.controller.js |
| DALs | 2 | provision.rpc.dal.js, refreshActorDirectory.dal.js |
| Hooks | 1 | useIdentityOps.js |
| Models | 0 | NONE — RPC responses consumed raw (identified gap) |
| Screens | 0 | NONE — feature has no UI surface |
| Components | 0 | NONE |
| Adapters | 2 | identity.adapter.js, identityOps.adapter.js |
| Resolvers (non-standard) | 1 | resolvers/vcsmIdentity.resolver.js |
| Setup (non-standard) | 1 | setup.js |
| Routes | 0 | NONE — consumed during auth bootstrap, no standalone route |
| Tests | 0 | NONE — SPIDER-MAN never run |

### Engine Layer (engines/identity/src/)
| Layer | Count | Notes |
|---|---:|---|
| Engine controllers | 3 | resolveAuthenticatedContext, switchActiveActor, logoutCleanup |
| Engine DALs | 11 | session, app, access, account, actorLinks (r/w), roles, capabilities, preferences, state (r/w) |
| Engine models | 6 | App, Access, Account, ActorLink, Preferences, State |
| Engine services | 7 | session, access, account, actor, role, capability, destination |

### Companion State Layer (apps/VCSM/src/state/identity/)
| File | Purpose |
|---|---|
| identityContext.jsx | IdentityProvider + useIdentity() hook |
| identity.controller.js | App-level identity resolution orchestrator |
| identity.controller.inflight.js | In-flight dedup guard |
| identitySelfHeal.controller.js | Self-heal path for missing platform rows |
| identityResolutionSelfHeal.helper.js | Self-heal helpers |
| controller/switchActor.controller.js | Actor switch at state layer |
| identity.model.js | State-layer identity model |
| identity.read.dal.js | State-layer DAL reads |
| identitySelection.store.js | Active actor selection store |
| identitySelectors.js | Selectors from identity state |
| identityStorage.js | Local storage persistence |
| identitySwitcher.jsx | Actor switcher UI component |
| IdentityDebugger.jsx | Debug panel (dev-only) |
| queries/identityEngineQuery.js | Engine query wrapper |
| useIdentityResolutionEffect.hook.js | Resolution effect hook |
| useIdentitySync.js | Auth sync hook |

---

## Route / Screen Map

| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| NONE DEDICATED | — | — | Bootstrapped during auth onboarding; no standalone route; IdentityProvider wraps app via app/providers/index.js |

---

## Mutation Surface Map

| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| ensureVcsmPlatformBootstrap.controller.js | features/identity/controller/ | RPC CALL: platform.provision_vcsm_identity — provisions 6 platform objects atomically | NO — VF-01 OPEN: no auth.uid() guard confirmed live DB | CRITICAL |
| provision.rpc.dal.js | features/identity/dal/ | RPC WRITE: user_app_access, user_app_accounts, user_app_preferences, user_app_state, user_app_actor_links, vc.actors.user_app_account_id | NO — live DB has no ownership guard; migration 20260518040000 ready, deployment UNKNOWN | CRITICAL |
| refreshActorDirectory.controller.js | features/identity/controller/ | RPC CALL: identity.refresh_actor_directory_row | UNKNOWN — hollow pass-through, no gate at controller layer | MEDIUM |
| refreshActorDirectory.dal.js | features/identity/dal/ | RPC WRITE: identity.actor_directory row refresh | UNKNOWN — no tracked creation migration | MEDIUM |
| state.write.dal.js (engine) | engines/identity/src/dal/ | UPDATE: platform.user_app_state (login timestamp, destination) | Session-scoped (platform.current_user_app_account_id) | LOW |
| actorLinks.write.dal.js (engine) | engines/identity/src/dal/ | UPDATE/INSERT: platform.user_app_actor_links, platform.user_app_preferences | Session-scoped | LOW |

---

## Security-Sensitive Surface Map

| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| platform.provision_vcsm_identity (live RPC) | DB — platform schema | CRITICAL: IDENTITY POISONING | VF-01: NO auth.uid() guard — any authenticated user can provision for any userId. Confirmed live DB 2026-05-18. Migration 20260518040000 ready, deployment UNKNOWN. |
| provision.rpc.dal.js | features/identity/dal/ | HIGH | VLF-01: return type jsonb (comments say uuid); VLF-02: p_actor_id DEFAULT NULL — optional in live body |
| identity.refresh_actor_directory_row (live RPC) | DB — identity schema | MEDIUM | No tracked creation migration. VLF-03: service_role lacks EXECUTE grant. |
| vcsmIdentity.resolver.js | features/identity/resolvers/ | MEDIUM | Injectable resolver — reads platform.user_app_actor_links filtered by userAppAccountId. Injection risk from app context resolver pattern (not validated by VENOM/BLACKWIDOW yet). |
| IdentityProvider / identityContext.jsx | state/identity/ | HIGH | In-memory actor state; manages auth, self-heal, actor switching. useIdentityDisplayDeprecated exported — bypasses adapter boundary. |
| useIdentity() direct import sites | ~105 consumer sites across features | MEDIUM | Some consumers import from state/identity/identityContext directly rather than through identity.adapter — bypasses adapter boundary governance. |

---

## Cross-Feature Consumer Map

| Consumer Feature | Import Path Used | Notes |
|---|---|---|
| settings (privacy, profile, account) | @/features/identity/adapters/identity.adapter | Correct — via adapter |
| settings (vports) | @/state/identity/identityContext | Direct import — bypasses adapter |
| post (postcard, screens) | @/state/identity/identityContext | Direct import — bypasses adapter |
| chat (inbox screens) | @/features/identity/adapters/identity.adapter | Correct — via adapter |
| professional/briefings | @/features/identity/adapters/identity.adapter | Correct — via adapter |
| ads | @/state/identity/identityContext | Direct import — bypasses adapter |
| app/providers | @/features/identity/adapters/identity.adapter | Correct — IdentityProvider re-exported |
| app/layout, app/routes | @/state/identity/identityContext | Direct import — acceptable (app shell layer) |

**Total consumer sites:** 105 cross-feature import sites confirmed by source scan.

---

## Open Security Findings

| ID | Severity | Status | Finding |
|---|---|---|---|
| VF-01 | HIGH | OPEN | platform.provision_vcsm_identity — NO auth.uid() guard. Migration 20260518040000 ready, deployment UNKNOWN. |
| VF-02 | MEDIUM | OPEN | pg_temp missing from search_path in live function. Covered by same migration. |
| VF-03 | LOW | OPEN | No audit trail after successful provisioning. |
| VLF-01 | LOW | OPEN | Return type mismatch — jsonb vs uuid in DAL comments. |
| VLF-02 | MEDIUM | OPEN | p_actor_id is optional (DEFAULT NULL) in live RPC body. |
| VLF-03 | LOW | OPEN | service_role lacks EXECUTE grant on provision_vcsm_identity. |

---

## Architecture State

**EVOLVING** — core provisioning path is functional but VF-01 is an unresolved live DB security finding. Model layer absent. Hollow controller. Zero test coverage. Mixed adapter boundaries at 105 consumer sites.

## Module Status

**MOSTLY COMPLETE** — provisioning, directory refresh, and engine integration are present and working. Missing: model layer, named owner, test coverage, VF-01 resolution, hollow controller decision.

---

## Recommended Next Command

**DB** — Confirm deployment status of migration `20260518040000_platform_provision_vcsm_identity.sql`. If undeployed, this is P0: cross-user identity poisoning is live on production.

## Recommended Next Ticket

TICKET-IDENTITY-RUNTIME-001 — Confirm and document migration 20260518040000 deployment status, resolve VLF-01 DAL comment mismatch, IRONMAN decision on hollow refreshActorDirectory controller and resolvers/ taxonomy, run SPIDER-MAN for first test coverage audit.

---

*identity.md regenerated: 2026-06-02 | ARCHITECT-IDENTITY-0001 | Full-replacement write*
