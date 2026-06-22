# Block Feature — Security

**Last VENOM audit:** 2026-05-11 (focused re-run)
**Report:** `CURRENT/features/dashboard/evidence/2026-05-11_venom_block-feature.md`
**Full findings location:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.block.md` (PHASE 4)
**Scope:** Block / Moderation feature — VCSM
**Audit result:** 0 CRITICAL | 1 HIGH | 3 MEDIUM | 1 LOW
**VENOM STATUS:** CAUTION (VF-01 open pending batch4)

**Note:** Prior VENOM report (`vcsm-security-report.md`, 2026-04-13) predates RISK-5/6/7 discovery. This focused re-run supersedes block-feature findings in that report.

---

## Trust Boundary Verdict

Block write path trust boundary is SOLID. Dual enforcement:
1. App-layer `assertingActorId` check
2. RPC `is_current_vc_actor` guard

No CRITICAL findings. No authorization bypass confirmed.

---

## VF-01 — `vc.friend_ranks` Not Cleaned Up After Block

**Severity:** HIGH
**Status:** OPEN — batch4 migration required

When a block occurs, the `vc.friend_ranks` table is not cleaned up. Blocked actors may surface in friend suggestions because their social graph score data persists after the block relationship is established.

This is a social graph integrity gap — not a direct authorization bypass. The risk is that a blocked actor appears in friend ranking surfaces.

**Fix:** `batch4` migration (`20260510100000_fix_block_actor_bidirectional_follows.sql`) must be deployed to staging then production. Historical orphan backfill required after migration. `applyBlockSideEffects.js` to be deleted after batch4 deploys.

---

## VF-02 — Feed Cache Invalidation Fire-and-Forget in Controller

**Severity:** MEDIUM
**Status:** RESOLVED 2026-05-14 — moved to hook layer (`useBlockActions.js`)

---

## VF-03 — `blockedActorSet.read.dal.js` Duplicate DAL in Profiles

**Severity:** MEDIUM
**Status:** RESOLVED 2026-05-14 — file deleted

---

## VF-04 — Dead Exports in Block DAL

**Severity:** MEDIUM
**Status:** RESOLVED 2026-05-14 — `isBlocked` and `toggleBlockActor` both deleted

---

## VF-05 — `console.error` in DAL Error Paths

**Severity:** LOW
**Status:** NO ACTION REQUIRED

---

## Additional Open DB Concern

**`vc.friend_ranks` SELECT policy `USING(true)`:** Leaks all social graph scores globally to all authenticated users. The step2 section 2D fix is pending application. Not tracked as a VF finding — flagged as a DB concern in the VENOM report.
