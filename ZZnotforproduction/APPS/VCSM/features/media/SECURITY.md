# Security Posture — media

Last Updated: 2026-06-07
Highest Open Severity: HIGH
THOR Release Blocker: YES — BW-MEDIA-002, BW-MEDIA-007 (VEN-MEDIA-003/BW-MEDIA-001 CLOSED; VEN-MEDIA-006/BW-MEDIA-008 added LOW)

---

## VENOM STATUS
VENOM Last Run: 2026-06-07 (batch: legal/media/moderation/monitoring/notifications)
VENOM Status: COMPLETE

Summary: 6 findings — 0 CRITICAL, 2 HIGH, 3 MEDIUM, 1 LOW
2026-06-07: VEN-MEDIA-006 added (adapter boundary violation)

| Finding ID | Severity | Status | Description |
|---|---|---|---|
| VEN-MEDIA-001 | MEDIUM | OPEN | {public} role `media_assets_vc_owner_update` policy persists on live DB — unrestricted column UPDATE surface; deferred Phase 6 cleanup (TICKET-PLATFORM-RLS-001) |
| VEN-MEDIA-002 | MEDIUM | OPEN | INSERT path has no app-layer actorId session verification; owner_source-specific INSERT RLS policies incomplete (no vport/chat policies) |
| VEN-MEDIA-003 | HIGH | CLOSED_SOURCE_VERIFIED 2026-06-05 | `uploadFlyerImageCtrl` — requireOwnerActorAccess confirmed present before upload (per ELEKTRA 2026-06-05 reverification) |
| VEN-MEDIA-004 | MEDIUM | OPEN | wanders/core/controllers/cards.controller.js:228 passes `user.id` (auth.users UUID) as `ownerActorId` to `uploadMediaController` — identity namespace violation |
| VEN-MEDIA-005 | HIGH | OPEN | BEHAVIOR.md is a non-functional placeholder — no security rules, no invariants authored; governance gap for platform-critical infrastructure feature |
| VEN-MEDIA-006 | LOW | OPEN — SOURCE_VERIFIED 2026-06-07 | media.adapter.js exposes createMediaAssetController and softDeleteMediaAssetController directly — adapter boundary violation (adapters must expose only hooks/components/screens, never controllers) |

Output (2026-06-04): ZZnotforproduction/APPS/VCSM/features/media/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_media-security-review.md
Output (2026-06-07): ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/VENOM/venom-report-legal-media-moderation-monitoring-notifications.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-07 (batch delta — VEN-MEDIA-006 only)
ELEKTRA Status: COMPLETE (delta — full reverification was 2026-06-05)
ELEKTRA Recommendation: FAIL — 2 THOR blockers from 2026-06-05 still open + 1 new LOW added

Summary: 2 NEW MEDIUM | 2 NEW INFO | 7 upstream verifications

| Finding ID | Severity | Description | ELEKTRA Status |
|---|---|---|---|
| VEN-MEDIA-003 / BW-MEDIA-001 | HIGH | uploadFlyerImageCtrl R2 auth bypass | CLOSED_SOURCE_VERIFIED — requireOwnerActorAccess present before upload |
| BW-MEDIA-002 / VEN-MEDIA-004 | HIGH | Wanders upload uses auth.users.id as ownerActorId — THOR BLOCKER | STILL_OPEN_SOURCE_VERIFIED |
| BW-MEDIA-007 / VEN-MEDIA-005 | HIGH | BEHAVIOR.md placeholder — GOVERNANCE BLOCKER | STILL_OPEN_SOURCE_VERIFIED |
| BW-MEDIA-003 | MEDIUM | createMediaAssetController no session verification | STILL_OPEN_SOURCE_VERIFIED |
| BW-MEDIA-004 / VEN-MEDIA-002 | MEDIUM | INSERT no app-layer owner binding | STILL_OPEN_SOURCE_VERIFIED |
| BW-MEDIA-005 | MEDIUM | Actor UUID in public R2 CDN URL (storage key) | STILL_OPEN_SOURCE_VERIFIED |
| BW-MEDIA-006 | LOW | No uniqueness guard on storage_key | PARTIAL_SOURCE_VERIFIED |
| ELEK-2026-06-05-001 | MEDIUM | Wanders media_assets row: storage_key uses auth UUID, owner_actor_id uses actor UUID — namespace split | OPEN |
| ELEK-2026-06-05-002 | INFO | FlyerEditorPanel / uploadFlyerImageCtrl chain has no active callers — patch guards dead code | OPEN |
| ELEK-2026-06-05-003 | INFO | createMediaAssetController callers pass appId that is silently ignored | OPEN |
| ELEK-2026-06-07-MEDIA-001 | LOW | media.adapter.js exports controllers directly — adapter boundary violation; enables actorId injection path (confirms BW-MEDIA-008 / VEN-MEDIA-006) | OPEN — SOURCE_VERIFIED 2026-06-07 |

Output (2026-06-05): ZZnotforproduction/APPS/VCSM/features/media/outputs/2026/06/05/Elektra/2026-06-05_elektra_media-patch-verification.md
Output (2026-06-07 batch): ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ELEKTRA/elek-batch-report-legal-media-moderation-monitoring-notifications.md

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-07 (batch: legal/media/moderation/monitoring/notifications)
BLACKWIDOW Status: COMPLETE

Summary: 7 findings — 0 CRITICAL, 3 HIGH, 3 MEDIUM, 1 LOW, 0 INFO
2026-06-07: BW-MEDIA-001 CLOSED_SOURCE_VERIFIED; VEN-MEDIA-006 adapter violation confirmed PARTIAL

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-MEDIA-001 | HIGH | uploadFlyerImageCtrl uploads to R2 before calling requireOwnerActorAccess — any authenticated user can write to any VPORT's storage namespace (THOR BLOCKER — confirms VEN-MEDIA-003) | BYPASSED | CLOSED_SOURCE_VERIFIED 2026-06-05 — requireOwnerActorAccess present before upload |
| BW-MEDIA-002 | HIGH | Wanders publishWandersFromBuilder and cards.controller both pass auth.users.id (not vc.actors.id) as ownerActorId to uploadMediaController — identity namespace violation in R2 storage key (confirms VEN-MEDIA-004) | BYPASSED | OPEN |
| BW-MEDIA-003 | MEDIUM | createMediaAssetController accepts caller-supplied ownerActorId/createdByActorId with no session verification — DB RLS is the only ownership guard | PARTIAL | OPEN |
| BW-MEDIA-004 | MEDIUM | insertMediaAssetDAL has no app-layer owner filter on INSERT; INSERT RLS policies incomplete for vport/chat owner_source (reinforces VEN-MEDIA-002) | PARTIAL | OPEN |
| BW-MEDIA-005 | MEDIUM | Actor UUID (ownerActorId) embedded in public R2 CDN URLs via storage key format — violates no-raw-IDs-in-public-URLs rule | BYPASSED | OPEN |
| BW-MEDIA-006 | LOW | No uniqueness guard on storage_key in insertMediaAssetDAL — duplicate media_assets records possible for the same R2 object | PARTIAL | OPEN |
| BW-MEDIA-007 | HIGH | BEHAVIOR.md is PLACEHOLDER — no §9 invariants, no security rules, no governance anchor for platform-critical infrastructure feature (GOVERNANCE BLOCKER) | N/A | OPEN |
| BW-MEDIA-008 | LOW | media.adapter.js exports createMediaAssetController directly — adapter boundary violation; enables future callers to invoke controller with arbitrary ownerActorId without session binding (confirms VEN-MEDIA-006) | PARTIAL | OPEN — SOURCE_VERIFIED 2026-06-07 |

Output (2026-06-04): ZZnotforproduction/APPS/VCSM/features/media/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_media-adversarial-review.md
Output (2026-06-07 batch): ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/BLACKWIDOW/bw-batch-report-legal-media-moderation-monitoring-notifications.md
