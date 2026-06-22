# Security Posture — vport

Last Updated: 2026-06-07 (branch re-verify — vport-booking-feed-security-updates; no vport code changes on branch; all findings unchanged)
Highest Open Severity: HIGH
THOR Release Blocker: YES (conditional — BW-VPORT-001 + BW-VPORT-002 become hard blockers if DB confirms vport.profiles RLS UPDATE policy is absent; VEN-VPORT-002 same condition)

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

8 findings: 0 CRITICAL, 2 HIGH, 4 MEDIUM, 2 LOW

| Finding ID | Severity | Description |
|---|---|---|
| VEN-VPORT-001 | LOW | Client-side slug generation — squatting risk and collision UX failure |
| VEN-VPORT-002 | HIGH | updateVport has no app-layer ownership check (.eq id only, no owner_user_id guard) |
| VEN-VPORT-003 | HIGH | ctrlSoftDeleteVport and ctrlRestoreVport have no app-layer ownership check (inconsistent with ctrlHardDeleteVport) |
| VEN-VPORT-004 | MEDIUM | updateVportAvatarMediaAssetIdDAL and updateVportBannerMediaAssetIdDAL have no session auth guard — SOURCE_VERIFIED 2026-06-07: `.eq('actor_id', actorId)` filter confirmed; no session assertion at DAL layer |
| VEN-VPORT-005 | MEDIUM | Migration barrel vport.public.js exports ownership-unsafe updateVport with no removal deadline |
| VEN-VPORT-006 | MEDIUM | owner_user_id (Supabase auth UUID) included in getVportById and getVportBySlug SELECT columns |
| VEN-VPORT-007 | MEDIUM | vportCoreOps.controller.js is a zero-logic DAL bridge — controller layer violation |
| VEN-VPORT-008 | HIGH | BEHAVIOR.md is a PLACEHOLDER — no §5 Security Rules or §9 Must Never Happen declared for a lifecycle-critical feature |

Output (2026-06-07 re-verify): ZZnotforproduction/APPS/VCSM/features/booking/outputs/2026/06/07/Venom/2026-06-07_venom_v2_branch-security-review.md
Output (2026-06-04): ZZnotforproduction/APPS/VCSM/features/vport/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_vport-security-review.md

Priority follow-up: DB command must verify vport.profiles RLS UPDATE policy and soft_delete_vport / restore_vport RPC ownership enforcement before next vport lifecycle release.

---

## ELEKTRA STATUS
ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-07 (branch: vport-booking-feed-security-updates — re-verify pass)
BLACKWIDOW Status: COMPLETE

4 findings: 0 CRITICAL, 2 HIGH, 1 MEDIUM, 1 LOW, 0 INFO — all carry-forward from 2026-06-04; SOURCE_VERIFIED this pass

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-VPORT-001 | HIGH | updateVport (vport.core.dal.js) UPDATE has no app-layer owner_user_id filter — RLS sole barrier for vport.profiles write bypass [CONFIRMED SOURCE_VERIFIED 2026-06-07] | BYPASSED (app layer) | OPEN |
| BW-VPORT-002 | HIGH | updateVportAvatarMediaAssetIdDAL / updateVportBannerMediaAssetIdDAL have no session auth guard — no requireUser() at DAL or controller [CONFIRMED SOURCE_VERIFIED 2026-06-07: vport.write.profileMedia.dal.js lines 1-24] | BYPASSED (app layer) | OPEN |
| BW-VPORT-003 | MEDIUM | createFuelPriceSubmissionDAL has no Supabase session check at controller or DAL layer — unauthenticated call possible if RLS absent | PARTIAL | OPEN |
| BW-VPORT-004 | LOW | Booking notification objectId carries raw booking UUID — linkPath is now null (TICKET-BOOKING-RPC-001 DONE); objectId UUID exposure residual | PARTIAL | OPEN |

Output (2026-06-07): ZZnotforproduction/APPS/VCSM/features/vport/outputs/2026/06/07/BlackWidow/2026-06-07_blackwidow_vport-source-confirm.md
Output (2026-06-04): ZZnotforproduction/APPS/VCSM/features/vport/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_vport-adversarial-review.md

THOR Gate: BW-VPORT-001 and BW-VPORT-002 remain CONDITIONAL release blockers. DB RLS verification required before THOR clearance. Attack scenarios for updateVport and profileMedia DAL both confirmed adversarially bypassed at app layer [SOURCE_VERIFIED 2026-06-07].
