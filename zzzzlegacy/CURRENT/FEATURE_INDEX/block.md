# Feature Index: block

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/block`
Source Path: `apps/VCSM/src/features/block/`

## DR. STRANGE Read Order

1. [README.md](../features/block/README.md)
2. [CURRENT_STATUS.md](../features/block/CURRENT_STATUS.md)
3. [SECURITY.md](../features/block/SECURITY.md)
4. [ARCHITECTURE.md](../features/block/ARCHITECTURE.md)
5. [OWNERSHIP.md](../features/block/OWNERSHIP.md)
6. [TESTS.md](../features/block/TESTS.md)
7. [PERFORMANCE.md](../features/block/PERFORMANCE.md)
8. [BLOCKERS.md](../features/block/BLOCKERS.md)
9. [DEFERRED.md](../features/block/DEFERRED.md)
10. [HISTORY_INDEX.md](../features/block/HISTORY_INDEX.md)

## Documentation Coverage

| File | Status |
|--------|--------|
| README | YES |
| CURRENT_STATUS | YES |
| SECURITY | YES |
| ARCHITECTURE | YES |
| OWNERSHIP | YES |
| TESTS | YES |
| PERFORMANCE | YES |
| BLOCKERS | YES |
| DEFERRED | YES |
| HISTORY_INDEX | YES |

Coverage Score: 10 / 10

## Active Risks

- **VF-01 (HIGH, OPEN)** — `vc.friend_ranks` not cleaned up after block. Blocked actors may surface in friend suggestions. Requires batch4 migration.
- **VF-01 (addendum)** — `vc.friend_ranks` SELECT policy `USING(true)` leaks all social graph scores globally to authenticated users (step2 section 2D fix pending).
- **LF-01 (MODERATE)** — Duplicate uncached `checkBlockStatus` reads on profile screen load. `useBlockStatus` called twice in parallel; both hit Supabase with no cache (read amplification 2.0).
- **LF-02 (MODERATE, inferred)** — `invalidateFeedBlockCache` missing from `useBlockActorAction` path.
- **FALCON DRIFT-01 (MEDIUM)** — Native iOS does not decode `canPost` gate — no permission parity with app/engine.
- **FALCON DRIFT-02 (LOW)** — Native membership read gate only partial vs app `canReadConversation`.

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- **batch4 migration** (`20260510100000_fix_block_actor_bidirectional_follows.sql`) — staging to production required to close VF-01.
- **iOS Native BLOCKED** — 3 FALCON P0 gaps: chat compose disable, fail-closed behavior, native follow gate unowned.
- **Android BLOCKED** — NOT STARTED.

## Deferred Items

DEFERRED.md — MISSING. Pending items from CURRENT_STATUS:
- batch4 migration + historical orphan backfill (`actor_follows` + `friend_ranks`)
- step2 section 2D — `vc.friend_ranks` SELECT policy fix
- Delete `applyBlockSideEffects.js` after batch4 deploys

## Latest Ticket

SF-BOOK-001, SF-BOOK-002, VENOM-BOOK-002

## Audit Coverage

| Command | Status |
|---------|--------|
| VENOM | COMPLETE — 2026-05-11 (1 OPEN VF-01, 4 RESOLVED) |
| SENTRY | COMPLETE — 2026-05-11 (ALL RESOLVED) |
| LOKI | COMPLETE — 2026-05-14 (2 OPEN findings) |
| THOR | COMPLETE — CAUTION (PWA) / BLOCKED (iOS, Android) |
| KRAVEN | NOT RUN |
| IRONMAN | NOT RUN |
| CARNAGE | NOT RUN |
| BLACKWIDOW | NOT RUN |
| ELEKTRA | NOT RUN |
| SPIDER-MAN | NOT RUN |
| ARCHITECT | COMPLETE — 2026-06-02 (TICKET-BLOCK-ARCHITECT-0001) |

## Related Output Files

- `features/block/SECURITY.md`
- `features/block/HISTORY_INDEX.md`
- `features/block/2026-05-11_venom_block-feature.md`
- `features/block/2026-05-11_sentry_block-dal.md`
- `features/block/2026-05-14_thor_block-feature-governance.md`
- `features/block/vcsm.block.architecture.md`

## Recommended Next Command

CARNAGE — apply batch4 migration to close VF-01 (friend_ranks cleanup after block). Follow with step2 section 2D policy fix. After batch4 lands, run VENOM re-verification pass.

## Recommended Next Ticket

Open ticket for: (1) batch4 migration deployment + backfill, (2) `vc.friend_ranks` SELECT policy fix. These are confirmed DB-level changes with no assigned ticket.
