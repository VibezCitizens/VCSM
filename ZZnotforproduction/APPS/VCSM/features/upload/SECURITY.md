# Security Posture — upload

Last Updated: 2026-06-04
Highest Open Severity: HIGH
THOR Release Blocker: YES — VEN-UPLOAD-001, VEN-UPLOAD-004, VEN-UPLOAD-005, VEN-UPLOAD-007, BW-UPLOAD-005, BW-UPLOAD-001

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

Summary: 0 CRITICAL, 5 HIGH, 4 MEDIUM, 1 LOW (11 findings total)

| Finding ID | Severity | Description |
|---|---|---|
| VEN-UPLOAD-001 | HIGH | Actor identity not verified via actor_owners before post creation (createPostController) |
| VEN-UPLOAD-002 | HIGH | filterValidActorIdsDAL accepts inactive/blocked actors as mention targets |
| VEN-UPLOAD-003 | MEDIUM | media_type / media URL accepted from client input without server-side URL origin validation |
| VEN-UPLOAD-004 | HIGH | updatePostMediaAssetIdDAL updates vc.post_media by row ID without actor ownership filter |
| VEN-UPLOAD-005 | HIGH | deletePostByIdDAL (rollback path) has no ownership predicate — ownerless DELETE export |
| VEN-UPLOAD-006 | MEDIUM | searchMentionSuggestions passes viewerActorId as null — blocked actors may appear in autocomplete |
| VEN-UPLOAD-007 | HIGH | createSystemPost adapter accepts actorId from caller without actor_owners verification |
| VEN-UPLOAD-008 | MEDIUM | MIME type validation uses client-controlled file.type only — no server-side magic-byte inspection |
| VEN-UPLOAD-009 | MEDIUM | post_type stored directly from input.mode without allowlist validation |
| VEN-UPLOAD-010 | LOW | Notification linkPath contains raw postId UUID (violates no-raw-IDs-in-URLs contract) |
| VEN-UPLOAD-011 | HIGH | BEHAVIOR.md is a PLACEHOLDER — no §5 Security Rules or §9 Must Never Happen declared |

THOR Blockers: VEN-UPLOAD-001, VEN-UPLOAD-004, VEN-UPLOAD-005, VEN-UPLOAD-007

Output: ZZnotforproduction/APPS/VCSM/features/upload/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_upload-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

Summary: 0 CRITICAL, 2 HIGH, 2 MEDIUM, 1 LOW, 0 INFO (5 new BW findings)

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-UPLOAD-001 | HIGH | Dual-source trust boundary: user_id (auth session) and actor_id (identityContext) are never cross-verified against actor_owners | PARTIAL | OPEN |
| BW-UPLOAD-002 | MEDIUM | recordPostMediaController passes null actorId silently to createMediaAssetController — may create ownerless media records | PARTIAL | OPEN |
| BW-UPLOAD-003 | MEDIUM | input.mode allowlist bypass — MAX_VIBES_PHOTOS cap skipped for non-"post" mode values at controller layer | BYPASSED | OPEN |
| BW-UPLOAD-004 | LOW | Programmatic double-submit to createPostController inserts duplicate posts — no idempotency key or server-side deduplication | PARTIAL | OPEN |
| BW-UPLOAD-005 | HIGH | BEHAVIOR.md is a PLACEHOLDER — §9 Must Never Happen invariants are UNANCHORED; no formally protected invariants exist for this feature | N/A | OPEN |

VEN Findings Corroborated by BW (all remain OPEN per VENOM section):
- VEN-UPLOAD-001: PARTIAL — session-derived actorId, no actor_owners DB verification [SOURCE_VERIFIED]
- VEN-UPLOAD-004: BYPASSED — updatePostMediaAssetIdDAL has no ownership filter [SOURCE_VERIFIED]
- VEN-UPLOAD-005: BYPASSED — deletePostByIdDAL has no ownership predicate [SOURCE_VERIFIED]
- VEN-UPLOAD-007: BYPASSED — createSystemPost accepts arbitrary actorId from caller [SOURCE_VERIFIED]
- VEN-UPLOAD-009: BYPASSED — post_type set from unvalidated input.mode [SOURCE_VERIFIED]
- VEN-UPLOAD-010: BYPASSED — raw postId UUID in notification linkPath [SOURCE_VERIFIED]
- VEN-UPLOAD-006: BYPASSED — null viewerActorId passed to mention search RPC [SOURCE_VERIFIED]

THOR Blockers (BW): BW-UPLOAD-005, BW-UPLOAD-001

Output: ZZnotforproduction/APPS/VCSM/features/upload/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_upload-adversarial-review.md
