# VENOM — Block Feature Security Audit

_Date:_ 2026-05-11
_Command:_ VENOM (focused re-run)
_Application Scope:_ VCSM
_Feature:_ Block / Moderation
_Result:_ 0 CRITICAL | 1 HIGH | 3 MEDIUM | 1 LOW

---

## Evidence Location

Full VENOM security findings are appended to the canonical Logan doc:

`zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.block.md`

See section: **PHASE 4 — VENOM · Block Feature Security Review (Focused Re-run)**

---

## Findings Summary

| Finding | Severity | Status |
|---|---|---|
| VF-01 — `vc.friend_ranks` not cleaned up after block | HIGH | OPEN — batch4 migration required |
| VF-02 — feed cache invalidation fire-and-forget in controller | MEDIUM | RESOLVED 2026-05-14 — moved to hook layer |
| VF-03 — `blockedActorSet.read.dal.js` duplicate DAL in profiles | MEDIUM | RESOLVED 2026-05-14 — file deleted |
| VF-04 — dead exports in block DAL (`isBlocked`, `toggleBlockActor`) | MEDIUM | RESOLVED 2026-05-14 — both deleted |
| VF-05 — console.error in DAL error paths | LOW | NO ACTION REQUIRED |

**Note on April 2026 report:** Prior VENOM report (`vcsm-security-report.md`, 2026-04-13) predates RISK-5/6/7 discovery. This focused re-run supersedes block-feature findings in that report.

---

## Open Item

**VF-01 remains OPEN.** Depends on batch4 migration deployment. This is a social graph integrity gap — blocked actors may surface in friend suggestions. Not a direct authorization bypass.

**Additional concern (DB Review Item 1):** `vc.friend_ranks` SELECT policy `USING(true)` leaks all social graph scores globally to authenticated users. The step2 section 2D fix is pending application.

---

## Trust Boundary Verdict

Block write path trust boundary is SOLID. Dual enforcement (app-layer assertingActorId check + RPC `is_current_vc_actor` guard). No CRITICAL findings.

**VENOM STATUS: CAUTION (VF-01 open pending batch4)**
