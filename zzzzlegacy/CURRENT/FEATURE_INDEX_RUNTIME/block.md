# Runtime Feature Index: block

## Metadata

| Field | Value |
|---|---|
| Feature | block |
| CURRENT Folder | CURRENT/features/block |
| Source Folder | apps/VCSM/src/features/block |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |

## Source Inventory

| Layer | Count | Key Files |
|---|---:|---|
| Controllers | 3 | blockActor.controller.js, getBlockStatus.controller.js, getBlockedActorSet.controller.js |
| DALs | 3 | block.check.dal.js, block.read.dal.js, block.write.dal.js |
| Hooks | 3 | useBlockActions.js, useBlockActorAction.js, useBlockStatus.js |
| Adapter Hooks | 2 | useBlockActorAction.adapter.js, useBlockStatus.adapter.js |
| Models | 0 | NONE FOUND |
| Screens | 0 | NONE FOUND — block surfaces embedded in profiles/settings/chat consumers |
| Components | 3 | BlockButton.jsx, BlockConfirmModal.jsx, BlockedState.jsx |
| Guards | 1 | BlockGate.jsx |
| Adapter UI | 2 | ActorActionsMenu.jsx, BlockConfirmModal.adapter.js |
| Barrel | 1 | index.js |
| Routes | 0 | NONE — no dedicated route; settings privacy tab hosts block list via settings feature |
| Tests | 0 | NONE FOUND |

## Route / Screen Map

| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| NONE dedicated | — | — | No dedicated route or screen owned by block feature |
| /settings (privacy tab) | features/settings/privacy/ | AUTH | Block list view rendered by settings feature — consumes block barrel |
| Profile views (embedded) | features/profiles/screens/ | AUTH | `BlockGate` and `ActorActionsMenu` adapter embedded in profile header |
| Chat conversation (embedded) | features/chat/conversation/screen/ | AUTH | `useBlockStatus` adapter consumed in `ConversationView.jsx` |

## Mutation Surface Map

| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| `blockActorController` | block/controllers/blockActor.controller.js | RPC call (moderation.block_actor) | YES — dual: assertingActorId === blockerActorId + RPC is_current_vc_actor | HIGH |
| `unblockActorController` | block/controllers/blockActor.controller.js | RPC call (moderation.unblock_actor) | YES — dual: assertingActorId check + blockedByMe pre-check + RPC guard | HIGH |
| `toggleBlockActorController` | block/controllers/blockActor.controller.js | RPC delegation (block or unblock) | YES — same dual enforcement as block/unblock | HIGH |
| `blockActor` DAL | block/dal/block.write.dal.js | RPC: moderation.block_actor | PARTIAL — enforced by RPC; app-layer asserts before calling DAL | HIGH |
| `unblockActor` DAL | block/dal/block.write.dal.js | RPC: moderation.unblock_actor | PARTIAL — enforced by RPC; app-layer asserts before calling DAL | HIGH |

## Security-Sensitive Surface Map

| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| `blockActorController` | block/controllers/blockActor.controller.js | OWNERSHIP | Dual enforcement: assertingActorId app check + RPC is_current_vc_actor — SOLID per VENOM 2026-05-11 |
| `unblockActorController` | block/controllers/blockActor.controller.js | OWNERSHIP | `blockedByMe` pre-check before unblock RPC — prevents unauthorized unblock of another actor's block edge |
| `block.write.dal.js` | block/dal/block.write.dal.js | DB_RPC | RPC-only write path — direct INSERT bypass would skip follow deactivation and friend_ranks cleanup |
| `vc.friend_ranks` post-block | DB | DB_RLS | VF-01 OPEN: friend_ranks NOT cleaned after block — blocked actors may surface in friend suggestions; batch4 migration required |
| `vc.friend_ranks SELECT USING(true)` | DB | DB_RLS | Global policy leaks all social graph scores to authenticated users — step2 section 2D fix pending |
| `useBlockStatus` (uncached) | block/hooks/useBlockStatus.js | PERF/READ | LF-01 OPEN: duplicate uncached calls on profile load — read amplification 2.0x |
| `useBlockActorAction` missing cache invalidation | block/hooks/useBlockActorAction.js | CACHE | LF-02 OPEN: `invalidateFeedBlockCache` absent from `useBlockActorAction.js`; present in `useBlockActions.js` only |
| `BlockButton.jsx` non-adapter identity import | block/ui/BlockButton.jsx | BOUNDARY | Imports `useIdentity` from `@/state/identity/identityContext` — should use `@/features/identity/adapters/identity.adapter` |

## Audit / Ticket Evidence From CURRENT

| Item | Status | Source CURRENT File |
|---|---|---|
| VF-01 (HIGH) — vc.friend_ranks not cleaned after block | OPEN — batch4 required | features/block/CURRENT_STATUS.md |
| vc.friend_ranks SELECT USING(true) global leak | OPEN — step2 section 2D pending | features/block/CURRENT_STATUS.md |
| LF-01 — duplicate uncached checkBlockStatus (read amplification 2.0x) | OPEN | features/block/CURRENT_STATUS.md |
| LF-02 — invalidateFeedBlockCache missing from useBlockActorAction | OPEN | features/block/CURRENT_STATUS.md |
| FALCON P0-1/2/3 — iOS native parity gaps (NTB-03, NTB-02, NDF-01) | OPEN — THOR BLOCKED for iOS/Android | features/block/CURRENT_STATUS.md |
| batch4 migration (20260510100000_fix_block_actor_bidirectional_follows.sql) | STAGING PENDING | features/block/CURRENT_STATUS.md |
| VF-02/03/04/05 — ALL RESOLVED | RESOLVED 2026-05-14 | features/block/CURRENT_STATUS.md |
| SENTRY SF-01/02/03 — ALL RESOLVED | RESOLVED 2026-05-14 | features/block/CURRENT_STATUS.md |
| THOR: PWA CAUTION / iOS BLOCKED / Android NOT STARTED | PARTIAL | features/block/CURRENT_STATUS.md |
| TICKET-BLOCK-ARCHITECT-0001 | COMPLETE / PROPAGATED | features/block/HISTORY_INDEX.md |
| ARCHITECT-BLOCK-0001 (this run) | COMPLETE | CURRENT/features/block/ARCHITECTURE.md |

## Cross-Feature Dependency Map

| Direction | Feature | Import Path | Surface |
|---|---|---|---|
| Block → Identity | features/identity | @/features/identity/adapters/identity.adapter | useIdentity (session actor) |
| Block → Feed | features/feed | @/features/feed/adapters/feedCache.adapter | invalidateFeedBlockCache (post-mutation) |
| Block → Hydration Engine | engines/hydration | @hydration alias | useActorSummary in BlockedState.jsx (display only) |
| profiles → Block | features/block | @/features/block (barrel) + adapters | useBlockStatus, ctrlGetBlockedActorSet, BlockGate, ActorActionsMenu |
| chat → Block | features/block | @/features/block/adapters/hooks/useBlockStatus.adapter | useBlockStatus |
| feed → Block | features/block | @/features/block/adapters/hooks/useBlockActorAction.adapter | useBlockActorAction |
| social/friend → Block | features/block | @/features/block (barrel) | ctrlGetBlockStatus, ctrlGetBlockedActorSet |
| settings/privacy → Block | features/block | @/features/block (barrel) | ctrlUnblockActor |
| upload → Block | features/block | @/features/block (barrel) | ctrlGetBlockedActorSet |

## Runtime Risk Summary

Block is a compact, well-governed feature (18 files, 3 controllers, 3 DALs, 3 hooks) with no dedicated routes or screens — entirely consumed by other features via adapters and the barrel export. Architecture state is STABLE. Trust boundary is SOLID per VENOM (dual enforcement: app-layer assertingActorId + RPC is_current_vc_actor). The primary open risk is DB-level: VF-01 (friend_ranks not cleaned after block) requires batch4 migration deployment. A secondary DB risk is the `vc.friend_ranks SELECT USING(true)` global policy leak. Read amplification (LF-01) and missing feed cache invalidation on `useBlockActorAction` (LF-02) are open performance/cache findings. THOR is blocked for iOS native and Android due to 3 FALCON P0 gaps. Zero automated test coverage.

## Recommended Next Command

SPIDER-MAN

## Recommended Next Ticket

TICKET-BLOCK-SPIDERMAN-001 — Run SPIDER-MAN regression audit on block feature. No automated test coverage confirmed for controller auth gates, idempotency paths, or bulk filter logic. HIGH security tier feature with zero tests is the primary governance gap.
