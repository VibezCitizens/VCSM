---
name: vcsm.block.architecture
description: ARCHITECT V2 module architecture report for VCSM:block
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** block
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/block
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The block module provides bidirectional actor-level blocking for the VCSM platform. It allows any authenticated actor to block or unblock another actor, enforcing visibility gates across profiles, feeds, and interactions. All blocking side-effects (follow deactivation, block event insertion) are delegated to server-side RPCs in the `moderation` schema, keeping the client layer thin and idempotent.

## OWNERSHIP

Owned by the VCSM social safety / moderation domain. The block module operates independently of the `moderation` feature (which handles reports, admin actions, and content hiding) but shares the `moderation` schema in the database. Primary platform responsibility is social safety and content isolation between actors.

## ENTRY POINTS

- No registered app routes — the block module is consumed as a composable system by other features (profiles, settings, feed).
- `BlockGate` component — wraps any UI surface to gate rendering based on block relationship.
- `useBlockActions` hook — entry point for block/unblock mutations from any consumer.
- `useBlockStatus` hook — entry point for reading block state between two actors.
- `index.js` — single barrel export for all public surfaces (controllers, hooks, UI components).
- The `settings` feature independently accesses `moderation.block_actor` / `moderation.unblock_actor` RPCs via its own DAL (`dalInsertBlock`, `dalDeleteBlockByTarget`) — a parallel write surface that does not flow through this module's controllers.

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 4 | block.check.dal.js, block.read.dal.js, block.write.dal.js |
| Model | 0 | N/A — no model/transformer files present |
| Controller | 5 | blockActor.controller.js, getBlockStatus.controller.js, getBlockedActorSet.controller.js |
| Service | N/A | — |
| Adapter | 1 | useBlockStatus.adapter.js, useBlockActorAction.adapter.js, BlockConfirmModal.adapter.js, ActorActionsMenu.jsx |
| Hook | 3 | useBlockActions.js, useBlockStatus.js, useBlockActorAction.js |
| Component | 4 | BlockButton.jsx, BlockConfirmModal.jsx, BlockedState.jsx, BlockGate.jsx |
| Screen | 0 | N/A — no dedicated screen; block is embedded in other feature screens |
| Barrel | 11 | index.js (primary barrel) + adapter re-exports |

Note: cg_layerCounts reflect 1 adapter, 11 barrels, 4 components, 5 controllers, 4 DAL, 3 hooks, 1 module. fm_layerCounts reflect 4 adapters, 3 controllers, 3 DAL, 2 modules, 3 hooks, 3 components.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Source code comments + BEHAVIOR.md present | BEHAVIOR.md is PLACEHOLDER — no detailed spec written |
| Owner defined | PARTIAL | Domain inferred from source; no OWNERSHIP.md | No formal ownership record |
| Entry points mapped | PASS | index.js barrel exports all public surfaces | No registered routes; entry is component/hook consumption |
| Controllers present/delegated | PASS | 5 controllers (blockActor, unblockActor, toggle, getBlockStatus, getBlockedActorSet) | friend_ranks cleanup noted as pending (batch4 migration) |
| DAL/repository present/delegated | PASS | 4 DAL files (check, read, write — split correctly) | No model layer — data returned raw from DAL |
| Models/transformers present | FAIL | 0 model files; raw Supabase rows passed to hooks | No data normalization layer; tight coupling to DB shape |
| Hooks/view models present | PASS | 3 hooks (useBlockActions, useBlockStatus, useBlockActorAction) | |
| Screens/components present | PASS | 4 UI files (BlockButton, BlockConfirmModal, BlockedState, BlockGate) | |
| Services/adapters present | PASS | 4 adapter files provide cross-feature access boundary | |
| Database objects mapped | PASS | moderation.blocks (read/write), moderation.block_events (server-side via RPC) | moderation.blocks is the only directly queried table |
| Authorization path mapped | PASS | blockActorController asserts assertingActorId === blockerActorId | Parallel write surface in settings feature bypasses this controller |
| Cache/runtime behavior mapped | PARTIAL | invalidateFeedBlockCache called post-block/unblock | No block status cache — every render re-fetches from DB |
| Error/loading/empty states mapped | PARTIAL | useBlockStatus has loading state; BlockGate renders null during load | No empty state documented; error state swallows and returns safe defaults |
| Documentation linked | PARTIAL | BEHAVIOR.md present but is a PLACEHOLDER with no content | Full behavior contract missing |
| Tests/validation noted | FAIL | 0 tests — no unit or integration coverage | Block/unblock controller logic is untested |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | hydration engine (feed cache invalidation), identity engine (useIdentity in hook) | |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/hydration | Engine | Inbound (block consumes) | Yes — via adapter | Used by useBlockActions to invalidate feed block cache |
| engines/identity | Engine | Inbound (block consumes) | Yes — via adapter | useIdentity() consumed in useBlockActions hook |
| features/feed | Cross-feature | Outbound (block calls feed adapter) | Partial — via adapter | invalidateFeedBlockCache imported from feed adapter — coupling to feed cache internal |
| features/identity | Cross-feature | Outbound (block calls identity adapter) | Yes — via adapter | identity.adapter used to get sessionActorId |
| moderation.blocks | DB table | Write + Read | Yes | Direct select in block.check.dal and block.read.dal |
| moderation.block_actor (RPC) | DB RPC | Write | Yes | block.write.dal |
| moderation.unblock_actor (RPC) | DB RPC | Write | Yes | block.write.dal |
| features/settings | Cross-feature parallel | Independent — settings has its own block DAL | Risk | settings feature calls block_actor/unblock_actor RPCs directly without going through this module's controllers |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| moderation.blocks | SELECT (check + bulk read) | DB / moderation schema | block.check.dal, block.read.dal | No caching — live per render |
| moderation.block_actor RPC | EXECUTE | DB / moderation schema | block.write.dal.blockActor | Idempotent; side effects server-side |
| moderation.unblock_actor RPC | EXECUTE | DB / moderation schema | block.write.dal.unblockActor | Does NOT restore follows or friend_ranks |
| moderation.blocks (status = 'active') | SELECT filter | DB | block.check.dal | Only active blocks are checked |
| feedBlockCache | Cache invalidation | feed engine | useBlockActions | Assumes feed adapter exposes invalidateFeedBlockCache — cross-feature coupling |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | N/A | No dedicated route; consumed as component system | Low — entry is hook/component |
| Loading state | PRESENT | useBlockStatus returns loading:true during fetch; BlockGate renders null while loading | Low |
| Empty state | PARTIAL | BlockGate renders fallback prop when blocked; BlockedState component exists | fallback can be null — caller must provide |
| Error state | PARTIAL | Errors caught in hooks; setIsBlocked(false) on error (safe default) | Silent failure — errors swallowed in useBlockStatus |
| Auth/owner gates | PRESENT | assertingActorId === blockerActorId enforced in all mutation controllers | Settings feature bypasses these gates with its own DAL |
| Cache behavior | WATCH | Feed block cache invalidated post-mutation; no block status caching | No SWR/React Query — block status re-fetched on every mount |
| Runtime dependencies | PRESENT | identity engine, hydration/feed engine cache | Dependency on feed adapter coupling is implicit |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/block/BEHAVIOR.md | PRESENT (PLACEHOLDER only) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a PLACEHOLDER | HIGH | No behavioral spec — happy paths, edge cases, error policies undocumented | LOGAN |
| Zero tests | HIGH | Block/unblock controller has auth assertions, idempotency logic, and self-block guards — none are regression-tested | SPIDER-MAN |
| No model layer | MEDIUM | Raw DB rows propagated directly to hooks without normalization; fragile to schema changes | IRONMAN |
| Parallel block write surface in settings feature | MEDIUM | settings calls block_actor/unblock_actor RPCs directly, bypassing blockActorController's assertingActorId ownership check | VENOM |
| friend_ranks cleanup deferred | LOW | blockActor.controller.js comment: "friend_ranks cleanup: pending batch4 migration deployment" — unresolved technical debt | CARNAGE |
| No block status caching | LOW | useBlockStatus re-fetches on every mount; profiles with many block checks will hit DB excessively | KRAVEN |
| ARCHITECTURE.md was missing | INFO | This run created it | ARCHITECT |
| CURRENT_STATUS.md was missing | INFO | This run created it | ARCHITECT |

---

## MODULE BOUNDARY WARNINGS

1. **Cross-feature feed coupling:** `useBlockActions` imports `invalidateFeedBlockCache` from `@/features/feed/adapters/feedCache.adapter`. This is a cross-feature import going through an adapter (acceptable per rules) but introduces runtime coupling — if the feed adapter changes its cache invalidation API, block breaks silently.

2. **Parallel write surface in settings:** The `settings` feature has `dalInsertBlock` and `dalDeleteBlockByTarget` which call `moderation.block_actor` and `moderation.unblock_actor` RPCs independently. These writes do not pass through `blockActorController` and therefore skip the `assertingActorId` ownership assertion. This is the same RPC so server-side RLS handles ultimate enforcement, but the client-side ownership check is missing for the settings path.

3. **No model layer isolation:** Data from `moderation.blocks` (raw Supabase row shapes) is propagated directly through controllers to hooks. If the DB schema changes column names, the breakage will surface at the hook/UI level with no intermediate transform layer to absorb it.

---

## SPAGHETTI SCORE

**Module:** block
**Score:** CLEAN
**Reasons:** Well-structured DAL split (check/read/write), clear controller ownership assertions, single barrel export, proper adapter boundaries. The only coupling concern is the feed cache adapter import and the parallel settings write surface — neither is spaghetti, but both are boundary risks.
**Release risk:** LOW

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no behavioral spec content; only a stub noting "Behavior contract pending source review."

**Check A (Source without behavior):** FAIL — source is present and functional but BEHAVIOR.md is a placeholder with no documented happy paths, error policies, or actor rules.
**Check B (Behavior without source):** N/A — no behavioral spec to compare against source.
**Check C (§13 engine consistency):** Scanner declares engines: [hydration, identity]. Source confirms: `useIdentity` from identity engine, `invalidateFeedBlockCache` from hydration/feed cache. Consistent.
**Check D (§6 data change consistency):** Scanner write surfaces: `moderation.block_actor` RPC and `moderation.unblock_actor` RPC. Source confirms both via `block.write.dal.js`. Consistent. Note: `moderation.blocks` direct SELECT in check/read DAL is not a write surface — correctly excluded by scanner.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write full BEHAVIOR.md behavioral spec | PLACEHOLDER only; blocks governance, audit, and test writing | LOGAN |
| P2 | Add controller and DAL unit tests | 0 tests; auth assertions and idempotency logic are regression risks | SPIDER-MAN |
| P3 | Audit settings feature parallel block write path | assertingActorId check bypassed in settings DAL path | VENOM |
| P4 | Add model/transformer layer | Raw DB rows leak through to hook layer; fragile to schema changes | IRONMAN |

## RECOMMENDED HANDOFFS

- **LOGAN** — write the BEHAVIOR.md behavioral spec (happy paths, error policies, actor rules)
- **SPIDER-MAN** — add unit tests for blockActorController, unblockActorController, toggleBlockActorController, and checkBlockStatus
- **VENOM** — audit parallel block write in settings feature (missing assertingActorId check)
- **IRONMAN** — evaluate model layer gap; determine if raw row propagation is acceptable risk
- **KRAVEN** — evaluate block status cache performance (no caching — re-fetches on every mount)

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
