# Block Feature — Ownership

> **Note:** Primary source `vcsm.block.owner.md` did not exist at time of writing.
> All content below is derived from supplemental sources: ARCHITECTURE.md, SECURITY.md,
> and CURRENT_STATUS.md (confirmed inline). No ownership has been invented or inferred
> beyond what those documents state explicitly.

---

## Ownership Summary

The block feature is fully owned by the block feature module at
`apps/VCSM/src/features/block/`. Controller, DAL, hook, and adapter layers are all
internal to that module — no shared engine dependency exists. DB/migration ownership
belongs to CARNAGE; trust boundary enforcement is owned jointly by the app-layer
(`assertingActorId` check) and the RPC layer (`is_current_vc_actor`), with VENOM as
the security review authority. One HIGH ownership gap remains open: the moderation
pipeline has no explicitly named command owner in the block governance record, and the
`vc.friend_ranks` cleanup path (VF-01) is blocked pending batch4 migration deployment.

---

## Feature Ownership Matrix

| Area | Owner | Source |
|---|---|---|
| Feature module root (`apps/VCSM/src/features/block/`) | Block feature | confirmed in ARCHITECTURE.md |
| Controller layer (all four controllers) | Block feature | confirmed in ARCHITECTURE.md |
| DAL layer — canonical block read DALs | Block feature | confirmed in ARCHITECTURE.md |
| DAL layer — block write path (RPC-only) | Block feature (via RPC only) | confirmed in ARCHITECTURE.md |
| DAL layer — satellite DALs (settings/privacy, notifications/inbox, feed pipeline) | Not block feature — architectural drift violations; data read only | confirmed in ARCHITECTURE.md §7, §8 |
| DB schema — `moderation.blocks`, `moderation.block_actor`, `moderation.unblock_actor` | CARNAGE (migration) | confirmed in ARCHITECTURE.md §8 |
| `vc.actor_follows` deactivation on block | Block feature (via RPC) + CARNAGE (migration) | confirmed in ARCHITECTURE.md §5 |
| `vc.friend_ranks` cleanup on block | OPEN — batch4 migration required (VF-01); CARNAGE owns migration; runtime gap unresolved | confirmed in ARCHITECTURE.md §5, SECURITY.md |
| Trust boundary enforcement — write path | Block feature (app-layer) + RPC SECURITY DEFINER guard | confirmed in ARCHITECTURE.md §5 |
| Security review authority | VENOM | confirmed in SECURITY.md |
| Migration ownership | CARNAGE | confirmed in ARCHITECTURE.md §8 |
| Release gate | THOR | confirmed in ARCHITECTURE.md §8 |
| Native parity (iOS/Android) | FALCON | confirmed in ARCHITECTURE.md §8 |
| Documentation | Logan | confirmed in ARCHITECTURE.md §8 |
| Moderation pipeline integration ownership | NOT LISTED — gap in governance record | confirmed in ARCHITECTURE.md §6 |
| IRONMAN command execution | OPEN conflict — owner file dated 2026-05-14 with IF-01–IF-04 decisions, but CURRENT_STATUS.md shows IRONMAN NOT_STARTED; CURRENT_STATUS.md was not updated post-2026-05-14 session | confirmed in ARCHITECTURE.md §8, CURRENT_STATUS.md |

---

## Controller Ownership

| Controller File | Owner | Notes |
|---|---|---|
| `features/block/controllers/blockActor.controller.js` | Block feature | Exports `blockActorController`, `unblockActorController`, `toggleBlockActorController`; includes `assertingActorId === blockerActorId` session binding added 2026-05-10 (confirmed in ARCHITECTURE.md §3) |
| `features/block/controllers/getBlockStatus.controller.js` | Block feature | Exports `ctrlGetBlockStatus`; wrapper around `checkBlockStatus` (confirmed in ARCHITECTURE.md §2) |
| `features/block/controllers/getBlockedActorSet.controller.js` | Block feature | Exports `ctrlGetBlockedActorSet`; bulk blocked-actor resolution for ranking and feed filtering (confirmed in ARCHITECTURE.md §2) |

---

## DAL Ownership

| DAL File | Read / Write | Owner | Notes |
|---|---|---|---|
| `features/block/dal/block.check.dal.js` | Read | Block feature | `checkBlockStatus` — bidirectional reads from `moderation.blocks`; returns `{ isBlocked, blockedByMe, blockedMe }` (confirmed in ARCHITECTURE.md §2, §4) |
| `features/block/dal/block.read.dal.js` | Read | Block feature | `filterBlockedActors` — bulk reads, returns Set of blocked actorIds (confirmed in ARCHITECTURE.md §2, §4) |
| `features/block/dal/block.write.dal.js` | Write | Block feature (via RPC only) | `blockActor`, `unblockActor` — RPC-based mutations only; direct inserts bypassed by design (confirmed in ARCHITECTURE.md §4) |
| `dev/diagnostics/dal/block.diagnostics.dal.js` | Read | Block feature (dev-only) | `fetchActorsIBlocked`, `fetchActorsWhoBlockedMe`, `fetchBlockGraph` — DEV-ONLY; moved from production DAL per SF-02 resolved 2026-05-14 (confirmed in ARCHITECTURE.md §2) |
| `features/settings/privacy/dal/blocks.dal.js` | Read | Settings/privacy feature (drift violation) | Satellite DAL — not owned by block feature; flagged as architectural drift (confirmed in ARCHITECTURE.md §7) |
| `features/notifications/inbox/dal/blocks.read.dal.js` | Read | Notifications/inbox feature (drift violation) | Satellite DAL — not owned by block feature; flagged as architectural drift (confirmed in ARCHITECTURE.md §7) |
| `feed.read.blockRows.dal` | Read | Feed pipeline (drift violation) | Satellite DAL — not owned by block feature; own DAL used by `fetchFeedPage.pipeline.js` (confirmed in ARCHITECTURE.md §7) |

---

## Data Ownership

| Table / Column / Policy | Owner | Enforcement Point | Notes |
|---|---|---|---|
| `moderation.blocks` | CARNAGE (migration); block feature (runtime reads/writes) | RLS + SECURITY DEFINER RPCs | Migration `20260510010000`; `blocks_select_blocked` policy added 2026-05-10 to allow blocked actor to read rows where they are the target (confirmed in ARCHITECTURE.md §5) |
| `moderation.block_actor` (RPC) | CARNAGE (migration); block feature (caller) | SECURITY DEFINER — `search_path = moderation, vc, public, auth` | Verifies actor ownership via `moderation.is_current_vc_actor(p_actor_id)` before mutating; handles bidirectional follow deactivation + friend_ranks deletion atomically (confirmed in ARCHITECTURE.md §5) |
| `moderation.unblock_actor` (RPC) | CARNAGE (migration); block feature (caller) | SECURITY DEFINER — `search_path = moderation, vc, public, auth` | Verifies actor ownership via `moderation.is_current_vc_actor(p_actor_id)`; updates `moderation.blocks` SET status='released'; inserts `moderation.block_events` audit row (confirmed in ARCHITECTURE.md §6) |
| `moderation.block_events` (audit rows) | CARNAGE (migration); RPC (runtime insert) | SECURITY DEFINER RPCs | Inserted by both `block_actor` and `unblock_actor` RPCs (confirmed in ARCHITECTURE.md §6) |
| `vc.actor_follows` — deactivation on block | Block feature (via RPC); social/friend (data ownership) | `moderation.block_actor` RPC (SECURITY DEFINER) | Deactivated bidirectionally by RPC on block; NOT restored on unblock — asymmetric by design (confirmed in ARCHITECTURE.md §5, §6) |
| `vc.friend_ranks` — cleanup on block | OPEN — batch4 migration (CARNAGE) + runtime gap (VF-01) | `moderation.block_actor` RPC (batch4, not yet deployed) | HIGH severity gap — blocked actors may surface in friend suggestions; `vc.friend_ranks` SELECT policy `USING(true)` also leaks social graph scores globally (confirmed in SECURITY.md, ARCHITECTURE.md §5) |
| `vc.social_follow_requests` — pending rows on block | Not enforced | None | Pending follow request from blocked actor remains `pending` until manual decline — deferred, DB-only (confirmed in ARCHITECTURE.md §5) |
| `vc.actor_follows`, `vc.social_follow_requests`, `vc.actor_privacy_settings` — FORCE ROW LEVEL SECURITY | Not enforced | None | No `FORCE ROW LEVEL SECURITY` — service-role or superuser bypasses RLS — deferred, DB-only (confirmed in ARCHITECTURE.md §5) |

---

## Runtime Ownership

The block feature owns the full runtime hook and action layer:

| Hook / Action File | Owner | Purpose |
|---|---|---|
| `features/block/hooks/useBlockActions.js` | Block feature | Block and unblock lifecycle management; owns feed cache invalidation after SF-01 fix applied 2026-05-14 (confirmed in ARCHITECTURE.md §2, §3) |
| `features/block/hooks/useBlockActorAction.js` | Block feature | Single-action hook for blocking an actor (confirmed in ARCHITECTURE.md §2) |
| `features/block/hooks/useBlockStatus.js` | Block feature | Block status lifecycle — null-safe; calls `ctrlGetBlockStatus` (confirmed in ARCHITECTURE.md §2) |

Hooks supply `sessionActorId` as `assertingActorId` from `useIdentity()` — this is the app-layer session binding mechanism. (confirmed in ARCHITECTURE.md §5)

**Open runtime finding:** LF-02 — `invalidateFeedBlockCache` missing from `useBlockActorAction` path (inferred from cache behavior; OPEN as of 2026-05-14). (confirmed in CURRENT_STATUS.md)

**Adapter surface (approved cross-feature):**
- `features/block/adapters/hooks/useBlockActorAction.adapter.js` — approved cross-feature hook surface
- `features/block/adapters/hooks/useBlockStatus.adapter.js` — approved cross-feature status read surface
- `features/block/adapters/ui/ActorActionsMenu.jsx` — approved UI surface
- `features/block/adapters/ui/BlockConfirmModal.adapter.js` — approved confirm modal surface

**Dead code — HOLD:**
- `features/block/helpers/applyBlockSideEffects.js` — exports `deleteFriendRankRowsBetweenActors`; DEAD (zero callers); delete path: batch4 deploys → verify RPC cleanup → Wolverine deletes. (confirmed in ARCHITECTURE.md §2)

---

## Security Ownership

**Trust boundary enforcement authority:** VENOM
**Last VENOM audit:** 2026-05-11 (focused re-run)
**Trust boundary verdict:** SOLID — dual enforcement confirmed

| Gate | Owner | Enforcement Point | Status |
|---|---|---|---|
| `assertingActorId === blockerActorId` check | Block feature (app-layer) | `blockActorController`, `unblockActorController`, `toggleBlockActorController` | SOLID — added 2026-05-10 (confirmed in ARCHITECTURE.md §3, §5) |
| `is_current_vc_actor(p_actor_id)` check | RPC layer (SECURITY DEFINER) | `moderation.block_actor`, `moderation.unblock_actor` | SOLID (confirmed in ARCHITECTURE.md §5) |
| `checkBlockStatus()` pre-check guard before every write | Block feature (controller) | `blockActorController`, `unblockActorController` | SOLID (confirmed in ARCHITECTURE.md §3) |
| `blocks_select_blocked` RLS policy | CARNAGE (migration `20260510010000`) | `moderation.blocks` SELECT | Required for bidirectional block enforcement in `vc.posts` SELECT RLS and `postVisibility.dal.js` (confirmed in ARCHITECTURE.md §5) |
| `vc.friend_ranks` cleanup | OPEN — VF-01 HIGH severity | batch4 migration pending | Blocked actors may surface in friend suggestions; not an authorization bypass — social graph integrity gap (confirmed in SECURITY.md) |

**VENOM findings summary:**
- VF-01: HIGH — OPEN — `vc.friend_ranks` not cleaned up after block
- VF-02: MEDIUM — RESOLVED 2026-05-14 (moved to hook layer)
- VF-03: MEDIUM — RESOLVED 2026-05-14 (duplicate DAL deleted)
- VF-04: MEDIUM — RESOLVED 2026-05-14 (`isBlocked`, `toggleBlockActor` deleted)
- VF-05: LOW — NO ACTION REQUIRED

---

## Moderation Ownership

**Gap:** No named command or team is explicitly assigned ownership of the block feature's moderation pipeline integration in the governance record. The owner file covers individual adapters (chat, notifications, feed each use satellite DALs) but has no explicit moderation pipeline ownership row. This is a gap, not a conflict. (confirmed in ARCHITECTURE.md §6)

The moderation pipeline integration points that exist but have no named pipeline owner:

| Integration Point | Module | Mechanism |
|---|---|---|
| Chat block filtering | `features/chat/` | Consumes `useBlockStatus` adapter; DI `checkBlockRelation` in chat engine |
| Notifications block filter | `features/notifications/inbox/` | Own `notifications/inbox/dal/blocks.read.dal.js` (satellite DAL — drift) |
| Feed visibility filter | `features/feed/pipeline/fetchFeedPage.pipeline.js` | Own `feed.read.blockRows.dal` (satellite DAL — drift) |
| Profile gate | `features/profiles/hooks/useProfileGate.js` | `useBlockStatus` adapter |
| Follow gate | `follow.controller.js`, `followRequests.controller.js` | `ctrlGetBlockStatus` via barrel |
| Explore search | `identity.search_actor_directory` RPC | Filters blocked actors server-side via `moderation.blocks` |

VCSM separates moderation from blocking: `features/moderation/` owns reports, hide/unhide actions, and reported-content covers. `features/block/` owns actor-to-actor safety relationships and follow/friend_ranks cleanup side effects. (confirmed in ARCHITECTURE.md §1)

---

## Follow / Friend Ownership

| Layer | Owner | Status |
|---|---|---|
| `vc.actor_follows` data ownership | Social/friend feature | Ongoing |
| `vc.actor_follows` deactivation on block (runtime) | Block feature (via `moderation.block_actor` RPC) | SOLID — applied in Batch 4 (confirmed in ARCHITECTURE.md §6) |
| `vc.friend_ranks` data ownership | Social/friend feature | Ongoing |
| `vc.friend_ranks` cleanup on block (migration) | CARNAGE — batch4 pending deployment | OPEN — VF-01 (confirmed in SECURITY.md, ARCHITECTURE.md §5) |
| `vc.friend_ranks` cleanup at runtime (helper) | Block feature (`applyBlockSideEffects.js`) — DEAD, zero callers | HOLD pending batch4; to be deleted after migration verifies RPC handles cleanup |
| Follow gate — `ctrlSubscribe` blocks follow before block | `follow.controller.js` (social/friend) calls `ctrlGetBlockStatus` | SOLID — blocked actors cannot follow or re-follow (confirmed in ARCHITECTURE.md §6) |
| Follow request gate — `ctrlSendFollowRequest` | `followRequests.controller.js` (social/friend) calls `ctrlGetBlockStatus` | SOLID — blocked actors cannot send follow requests (confirmed in ARCHITECTURE.md §6) |
| Unblock — follow edges and friend ranks | NOT restored on unblock — asymmetric by design | By design (confirmed in ARCHITECTURE.md §6) |

---

## Open Ownership Questions

The following ownership questions are unresolved as of the last recorded governance state:

1. **Moderation pipeline ownership gap.** The moderation pipeline described in ARCHITECTURE.md §6 (chat, notifications, feed, follow, explore integration points) has no named command or team assigned as pipeline owner. Individual adapter modules each own their own satellite DALs, but no single owner governs the pipeline as a whole. (confirmed in ARCHITECTURE.md §6)

2. **IRONMAN execution status conflict.** ARCHITECTURE.md §8 explicitly states "IRONMAN: Ownership decisions made 2026-05-14 (IF-01 deleted, IF-02 deleted, IF-03 HOLD pending batch4, IF-04 deleted)." CURRENT_STATUS.md Command Coverage table shows IRONMAN as NOT_STARTED with no date. CURRENT_STATUS.md was not updated to reflect IRONMAN completion after the 2026-05-14 session. The owner file (this document's primary source) is dated 2026-05-14 — IRONMAN findings are considered resolved for the purposes of this ownership record, but the status discrepancy should be corrected in CURRENT_STATUS.md. (confirmed in ARCHITECTURE.md §8, CURRENT_STATUS.md)

3. **`vc.friend_ranks` runtime ownership gap.** The `batch4` migration is owned by CARNAGE and has not been deployed. Until it deploys, there is no runtime owner enforcing `vc.friend_ranks` cleanup on block. `applyBlockSideEffects.js` is dead (zero callers). VF-01 remains HIGH severity and OPEN. (confirmed in SECURITY.md, ARCHITECTURE.md §5)

4. **Native parity ownership — FALCON NOT STARTED.** FALCON owns iOS/Android native parity for the block feature. Three P0 items remain unresolved (NTB-03, NTB-02, NDF-01) and block native release. Android has not started. FALCON ownership is assigned but execution has not begun. (confirmed in ARCHITECTURE.md §8, CURRENT_STATUS.md)

5. **Logan documentation.** ARCHITECTURE.md §8 lists Logan documentation as a HIGH severity missing piece. The canonical doc path is `vcsm.dal.block.md` (confirmed in SECURITY.md). Logan is assigned but the documentation gap remains. (confirmed in ARCHITECTURE.md §8)

---

## History References

- Source: `vcsm.block.owner.md` (IRONMAN canonical ownership doc) — **FILE DID NOT EXIST AT TIME OF WRITING; all content sourced from supplemental files**
- Last IRONMAN run: 2026-05-14 (per ARCHITECTURE.md §8 — IF-01 through IF-04 decisions recorded that date)
- Last VENOM audit: 2026-05-11 (focused re-run; confirmed in SECURITY.md)
- Last CARNAGE run: 2026-05-11 (confirmed in CURRENT_STATUS.md)
- Last SENTRY run: 2026-05-11; all findings resolved 2026-05-14 (confirmed in CURRENT_STATUS.md)
- Last LOKI run: 2026-05-14; 2 OPEN findings (LF-01, LF-02) (confirmed in CURRENT_STATUS.md)
- Last THOR run: 2026-05-14; CAUTION (PWA) / BLOCKED (iOS Native) / BLOCKED (Android) (confirmed in CURRENT_STATUS.md)
- Related governance: ARCHITECTURE.md, SECURITY.md, CURRENT_STATUS.md, HISTORY_INDEX.md
- Audit evidence location: `zNOTFORPRODUCTION/CURRENT/features/block/`

---

*Source: /Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.block.owner.md*
*Created: 2026-06-02 — TICKET-BLOCK-OWNERSHIP-0001*
