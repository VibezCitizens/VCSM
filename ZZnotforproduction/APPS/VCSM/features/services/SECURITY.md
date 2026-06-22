# Security Posture — services

Last Updated: 2026-06-04
Highest Open Severity: CRITICAL
THOR Release Blocker: YES — VEN-SERVICES-001, VEN-SERVICES-002, VEN-SERVICES-003, BW-SERV-001, BW-SERV-009, BW-SERV-002, BW-SERV-003

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

Summary: 6 findings — 0 CRITICAL, 3 HIGH, 2 MEDIUM, 1 LOW

| Finding ID | Severity | Description |
|---|---|---|
| VEN-SERVICES-001 | HIGH | resetStudentPassword called from ResetPasswordModal with no org-ownership check — arbitrary student password reset |
| VEN-SERVICES-002 | HIGH | canParentReset hardcoded true in ParentStudentScreen — unlinked parent can reset any student password |
| VEN-SERVICES-003 | HIGH | Temporary auth credential rendered in clear text in browser DOM after parent password reset |
| VEN-SERVICES-004 | MEDIUM | uploadToCloudflare falls back to VCSM cross-product global (__WANDERS_SB__) for auth token |
| VEN-SERVICES-005 | MEDIUM | RegisterStudentModal invokes createStudent with no caller org-membership verification |
| VEN-SERVICES-006 | LOW | supabaseClient debug mode activatable in production via localStorage flag |

Output: ZZnotforproduction/APPS/VCSM/features/services/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_services-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

Summary: 9 findings — 1 CRITICAL, 3 HIGH, 3 MEDIUM, 2 LOW

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-SERV-001 | CRITICAL | useDeleteVportServiceAddon never passes callerActorId to controller — ownership chain structurally broken at hook layer; delete addon always throws from UI path | PARTIAL | DRAFT |
| BW-SERV-002 | HIGH | createOrUpdateVportServiceAddonController has no controller-layer ownership check — relies solely on unverified RLS | PARTIAL | DRAFT |
| BW-SERV-003 | HIGH | reorderVportServiceAddonController has no controller-layer ownership check — relies solely on unverified RLS | PARTIAL | DRAFT |
| BW-SERV-009 | HIGH | Three DAL files imported by controllers do not exist on disk (createVportServiceAddon.dal, updateVportServiceAddon.dal, reorderVportServiceAddon.dal) — runtime import crash on first invocation | BYPASSED | DRAFT |
| BW-SERV-006 | MEDIUM | locksmith_service_details upsert conflict key is service_id alone — actor_id not in conflict key, enabling row overwrite if controller ownership gap exploited | PARTIAL | DRAFT |
| BW-SERV-007 | MEDIUM | RLS posture on vport.services unverified — no CARNAGE audit documented | UNRESOLVED | DRAFT |
| BW-SERV-008 | MEDIUM | RLS posture on vport.service_addons unverified — no CARNAGE audit documented | UNRESOLVED | DRAFT |
| BW-SERV-004 | LOW | invalidateVportServices exported but never called — viewer cache stale up to 60s after mutation | PARTIAL | DRAFT |
| BW-SERV-005 | LOW | Dashboard services route exposes raw actorId UUID in URL path — authenticated-only route, no share link | PARTIAL | DRAFT |

Output: ZZnotforproduction/APPS/VCSM/features/services/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_services-adversarial-review.md
