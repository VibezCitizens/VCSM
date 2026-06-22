# Security Posture — profiles

Last Updated: 2026-06-04
Highest Open Severity: CRITICAL
THOR Release Blocker: YES — VEN-PROFILES-002, BW-PROF-001, BW-PROF-002, BW-PROF-003, BW-PROF-004, BW-PROF-010, BW-PROF-011

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

9 findings: 0 CRITICAL, 5 HIGH, 3 MEDIUM, 1 LOW

| Finding ID | Severity | Description |
|---|---|---|
| VEN-PROFILES-001 | HIGH | Missing behavior contract — BEHAVIOR.md is a stub with no §5 Security Rules or §9 Must Never Happen invariants |
| VEN-PROFILES-002 | HIGH | IDOR on friend rank writes — ownerActorId derived from URL param (useParams), not session identity |
| VEN-PROFILES-003 | HIGH | menu_categories DELETE has no ownership filter at DAL layer (no actor_id or profile_id scope) |
| VEN-PROFILES-004 | HIGH | menu_items DELETE has no ownership filter at DAL layer (no actor_id or profile_id scope) |
| VEN-PROFILES-005 | HIGH | locksmith_portfolio_details UPSERT has no actor_id scope in DB filter — relies on portfolio_item_id only |
| VEN-PROFILES-006 | MEDIUM | menu_item_media INSERT does not verify itemId is owned by resolving actor |
| VEN-PROFILES-007 | MEDIUM | list_vport_subscribers DAL callable without privacy gate — privacy enforced only in controller |
| VEN-PROFILES-008 | MEDIUM | locksmith_service_details UPSERT uses onConflict: 'service_id' only — actor_id not in conflict key |
| VEN-PROFILES-009 | LOW | console.error with internal identifiers in DEV guard path (upsertVportServices controller) |

Output file: ZZnotforproduction/APPS/VCSM/features/profiles/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_profiles-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

1 CRITICAL, 6 HIGH, 5 MEDIUM, 0 LOW, 0 INFO

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-PROF-001 | CRITICAL | IDOR on friend rank writes — ownerActorId has no session binding at controller layer; attacker can write ranks on behalf of any actor | BYPASSED | DRAFT — OPEN |
| BW-PROF-002 | HIGH | menu_categories CREATE has no assertActorOwnsVportActorController call — actorId taken from argument, not session-verified | BYPASSED | DRAFT — OPEN |
| BW-PROF-003 | HIGH | menu_items CREATE has no assertActorOwnsVportActorController call — actorId taken from argument, not session-verified | BYPASSED | DRAFT — OPEN |
| BW-PROF-004 | HIGH | useSaveTopFriendRanks hook accepts ownerActorId as external argument with no useIdentity() binding | BYPASSED | DRAFT — OPEN |
| BW-PROF-010 | HIGH | Raw UUID exposed in public-facing profile URL when slug resolution fails — buildActorCanonicalSlug.controller.js:89 falls back to bare actorId | BYPASSED | DRAFT — OPEN |
| BW-PROF-011 | HIGH | Raw postId (UUID) exposed in post share URLs — useActorProfileActions.js:31 constructs /post/{postId} | BYPASSED | DRAFT — OPEN |
| BW-PROF-005 | MEDIUM | menu category CREATE silently returns null for actors with no vport profile — no error surface indicates unauthorized access attempt | PARTIAL | DRAFT — OPEN |
| BW-PROF-006 | MEDIUM | menu_categories DELETE has no actor_id scope in DAL query — relies solely on controller ownership gate; RLS not confirmed | PARTIAL | DRAFT — OPEN |
| BW-PROF-007 | MEDIUM | menu_items DELETE has no actor_id scope in DAL query — relies solely on controller ownership gate; RLS not confirmed | PARTIAL | DRAFT — OPEN |
| BW-PROF-008 | MEDIUM | locksmith_portfolio_details UPSERT conflict key is portfolio_item_id only — actor_id excluded; cross-reference VEN-PROFILES-005 | PARTIAL | DRAFT — OPEN |
| BW-PROF-009 | MEDIUM | locksmith_service_details UPSERT conflict key is service_id only — actor_id excluded; cross-reference VEN-PROFILES-008 | PARTIAL | DRAFT — OPEN |
| BW-PROF-012 | MEDIUM | Post edit navigation URL uses raw postId UUID — useActorProfileActions.js:80 | BYPASSED | DRAFT — OPEN |

Output: ZZnotforproduction/APPS/VCSM/features/profiles/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_profiles-adversarial-review.md
