# Security Posture — settings

Last Updated: 2026-06-04
Highest Open Severity: HIGH
THOR Release Blocker: YES (BW-SETTINGS-001, BW-SETTINGS-006, BW-SETTINGS-012)

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

4 HIGH, 3 MEDIUM, 0 CRITICAL, 0 LOW

- VEN-SETTINGS-001 | HIGH | ctrlSoftDeleteVport and ctrlRestoreVport have no app-layer ownership gate
- VEN-SETTINGS-002 | HIGH | dalDeleteCitizenAccountFull invokes Edge Function without app-layer session pre-check
- VEN-SETTINGS-003 | MEDIUM | useAccountController calls ctrlHardDeleteVport without callerActorId — hard delete broken in Account tab
- VEN-SETTINGS-004 | HIGH | blocks.dal.js passes client-supplied actorId as p_blocker_actor_id to moderation RPC
- VEN-SETTINGS-005 | MEDIUM | dalSetActorPrivacy has no session bind at DAL layer — relies entirely on controller and RLS
- VEN-SETTINGS-006 | MEDIUM | profile.write.dal.js user-mode update has no session bind — subjectId caller-supplied
- VEN-SETTINGS-007 | HIGH | settings BEHAVIOR.md is PLACEHOLDER — no §5 Security Rules or §9 invariants declared

Output: ZZnotforproduction/APPS/VCSM/features/settings/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_settings-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

0 CRITICAL, 3 HIGH, 4 MEDIUM, 2 LOW, 1 INFO

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-SETTINGS-001 | HIGH | ctrlSoftDeleteVport and ctrlRestoreVport have no app-layer ownership gate — DAL RPCs reached unchecked | BYPASSED | OPEN — THOR BLOCKER |
| BW-SETTINGS-002 | MEDIUM | ctrlBlockActor/ctrlUnblockActor use string-equality callerActorId check, not assertActorOwnsVportActorController | PARTIAL | OPEN |
| BW-SETTINGS-003 | HIGH | profile.write.dal.js user-mode update has no session bind — subjectId caller-supplied; RLS sole backstop | PARTIAL | OPEN |
| BW-SETTINGS-004 | MEDIUM | ctrlDeleteAccount / dalDeleteCitizenAccountFull invokes Edge Function with no app-layer session pre-check | PARTIAL | OPEN |
| BW-SETTINGS-005 | MEDIUM | dalSetActorPrivacy has no session bind at DAL — upsert with caller-supplied actor_id | PARTIAL | OPEN |
| BW-SETTINGS-006 | HIGH | useVportsController.restoreVport calls ctrlRestoreVport with no callerActorId — no ownership gate on Vports tab path | BYPASSED | OPEN — THOR BLOCKER |
| BW-SETTINGS-007 | MEDIUM | moderation.block_actor / unblock_actor RPC auth.uid() binding unverifiable from source | UNRESOLVED | OPEN |
| BW-SETTINGS-008 | LOW | All major entry points have null guard for callerActorId; soft/restore vport null catch at DAL layer only | BLOCKED | CLOSED |
| BW-SETTINGS-009 | LOW | Block/unblock idempotency checks conditional on existingBlockedIds; RPC must handle duplicates independently | PARTIAL | OPEN |
| BW-SETTINGS-010 | MEDIUM | Hydration store force-mutation in saveProfileCore downstream of profile write; second-order risk if RLS fails | PARTIAL | OPEN |
| BW-SETTINGS-011 | INFO | No notification linkPath or share link constructs in settings feature — no URL surface | BLOCKED | CLOSED |
| BW-SETTINGS-012 | HIGH | BEHAVIOR.md PLACEHOLDER — 3 source-inferred §9 invariants UNRESOLVED (soft-delete isolation, profile write isolation, account delete session) | UNRESOLVED | OPEN — THOR BLOCKER |

Output: ZZnotforproduction/APPS/VCSM/features/settings/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_settings-adversarial-review.md
