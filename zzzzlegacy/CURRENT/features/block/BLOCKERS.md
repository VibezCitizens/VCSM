# Block Feature — Blockers

Sources: THOR 2026-05-14, CARNAGE 2026-05-11, LOKI 2026-05-14
Last reviewed: 2026-05-14

---

## THOR Release Blockers — iOS Native (NTB-03, NTB-02, NDF-01)

### NTB-03

| Field | Value |
|---|---|
| Blocker ID | NTB-03 |
| Description | Chat compose disable at controller level not verified on iOS native |
| Severity | FALCON P0 |
| Status | BLOCKED |
| Owner | FALCON |
| Blocking | iOS Native release of block feature |
| Next action | FALCON must verify chat compose is disabled at the controller layer on all native surfaces and provide runtime evidence |

---

### NTB-02

| Field | Value |
|---|---|
| Blocker ID | NTB-02 |
| Description | Fail-closed behavior not runtime-tested on all four surfaces (iOS native) |
| Severity | FALCON P0 |
| Status | BLOCKED |
| Owner | FALCON |
| Blocking | iOS Native release of block feature |
| Next action | FALCON must runtime-test fail-closed behavior across all four native surfaces and document results |

---

### NDF-01

| Field | Value |
|---|---|
| Blocker ID | NDF-01 |
| Description | Native follow/friend gate has no owner and no transfer evidence |
| Severity | FALCON P0 |
| Status | BLOCKED |
| Owner | FALCON |
| Blocking | iOS Native release of block feature |
| Next action | FALCON must assign an owner to the native follow/friend gate and produce transfer evidence confirming the gate is implemented |

---

## CARNAGE — batch4 Migration Deployment Blocker

| Field | Value |
|---|---|
| Blocker ID | CARNAGE-BATCH4 |
| Description | batch4 migration (`20260510100000_fix_block_actor_bidirectional_follows.sql`) is PROPOSAL ONLY — not applied as of 2026-05-11. Every block action since platform launch has left stale `vc.friend_ranks` and `vc.actor_follows` (reverse direction) rows. |
| Severity | CAUTION — migration required before dead code can be cleaned |
| Status | CAUTION — pending deployment (staging to production) |
| Owner | CARNAGE |
| Blocking | (1) Deletion of `apps/VCSM/src/features/block/helpers/applyBlockSideEffects.js` — must NOT be deleted until batch4 deploys and is verified. (2) Historical orphan backfill for `vc.actor_follows` and `vc.friend_ranks`. (3) step2 section 2D — `vc.friend_ranks` SELECT policy fix. |
| Next action | Deploy batch4 migration to staging, validate updated RPC body via `pg_get_functiondef`, run both orphan backfills, then confirm before deleting `applyBlockSideEffects.js` |

---

## LOKI Runtime Findings — Open (LF-01, LF-02)

### LF-01

| Field | Value |
|---|---|
| Blocker ID | LF-01 |
| Description | Duplicate `checkBlockStatus` reads on every profile screen load. `VportProfileViewScreen` and `ActorProfileViewScreen` both call `useBlockStatus` directly AND call `useProfileGate` which calls `useBlockStatus` internally, firing two identical `moderation.blocks` SELECT queries for the same actor pair on every profile open. Neither call path has a TTL or Zustand cache. |
| Severity | HIGH |
| Status | OPEN |
| Owner | LOKI (handoff: KRAVEN for perf quantification, SENTRY for architecture drift) |
| Blocking | Efficient profile screen load; recommended fix required before SENTRY architecture sign-off |
| Next action | Remove the direct `useBlockStatus` call from `VportProfileViewScreen.jsx` and `ActorProfileViewScreen.jsx`; derive `canViewProfile` and `blockLoading` from the `gate` object returned by `useProfileGate` instead |

---

### LF-02

| Field | Value |
|---|---|
| Blocker ID | LF-02 |
| Description | `useBlockActorAction.js` (feed surface block hook) does not call `invalidateFeedBlockCache` after `blockActorController` resolves. The sibling hook `useBlockActions.js` correctly calls `invalidateFeedBlockCache` at lines 52 and 73. When a user blocks an actor via the feed action adapter, the `readFeedBlockRowsDAL` TTL cache is not invalidated and the blocked actor remains visible in the feed for up to 60 seconds. |
| Severity | HIGH |
| Status | OPEN |
| Owner | LOKI (handoff: SENTRY for architectural parity decision, VENOM for safety) |
| Blocking | Block safety contract — "block and they disappear" is violated for up to 60s on the feed surface; VENOM sign-off on feed safety |
| Next action | Add `invalidateFeedBlockCache(blockerActorId)` call to `apps/VCSM/src/features/block/hooks/useBlockActorAction.js` after `blockActorController` resolves. Pattern is already established in `useBlockActions.js`. |
