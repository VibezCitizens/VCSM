# CARNAGE — Block Feature: friend_ranks RPC Scope Verification

_Date:_ 2026-05-11
_Command:_ CARNAGE
_Application Scope:_ VCSM
_Feature:_ Block / Moderation — `vc.friend_ranks` cleanup path
_Status:_ CAUTION — migration required before dead code can be cleaned

---

## Evidence Location

Full CARNAGE analysis is appended to the canonical Logan doc:

`zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.block.md`

See sections:
- **PHASE 3 — CARNAGE · friend_ranks RPC Scope Verification (RISK-8)**
- **DB — vc.friend_ranks RLS & moderation Schema Analysis · 2026-05-11**

---

## Key Finding

**Q: Does `moderation.block_actor` RPC currently handle `vc.friend_ranks` cleanup?**
**A: NO.** batch4 migration (`batch4_20260510100000_fix_block_actor_bidirectional_follows.sql`) is PROPOSAL ONLY — not applied as of 2026-05-11.

Every block action since platform launch has left stale `vc.friend_ranks` and `vc.actor_follows` (reverse direction) rows.

---

## Migration Deployment Steps

1. Verify `vc.friend_ranks` RLS permits SECURITY DEFINER DELETE → **CLEARED by DB review** (SECURITY DEFINER bypasses RLS)
2. Deploy batch4 `CREATE OR REPLACE FUNCTION moderation.block_actor(...)` in staging
3. Validate updated RPC body via `pg_get_functiondef`
4. Run backfill: orphaned `vc.actor_follows` (reverse direction)
5. Run backfill: orphaned `vc.friend_ranks`
6. After migration + backfill confirmed: delete `apps/VCSM/src/features/block/helpers/applyBlockSideEffects.js`

---

## DB Review Findings (2026-05-11)

| Item | Object | Finding | Risk |
|---|---|---|---|
| 1 | `vc.friend_ranks` RLS | `USING(true)` — globally visible to authenticated users | HIGH — step2 2D needed |
| 2 | `vc.friend_ranks` DELETE policy | None required — SECURITY DEFINER bypasses | NO ACTION |
| 3 | `moderation.blocks` RLS + indexes | CORRECTLY CONFIGURED | PASS |
| 4 | `block_actor` RPC auth guard | `is_current_vc_actor` guard present | PASS |
| 5 | `vc.actor_follows` reverse orphans | Blocked actors remain followers of their blockers | HIGH — batch4 fixes this |

---

## CARNAGE STATUS: CAUTION

Migration is designed, safe, has rollback plan. Blocked only by deployment workflow (staging → prod).
`applyBlockSideEffects.js` must NOT be deleted until batch4 deploys and is verified.
