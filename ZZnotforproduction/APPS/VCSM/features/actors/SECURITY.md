# Security Posture — actors

Last Updated: 2026-06-07
Highest Open Severity: HIGH
THOR Release Blocker: YES — VEN-ACTORS-001, VEN-ACTORS-002, ELEK-2026-06-07-001, ELEK-2026-06-07-002, BW-2026-06-07-001, BW-2026-06-07-002, BW-2026-06-07-003

---

## VENOM STATUS
VENOM Last Run: 2026-06-07
VENOM Status: COMPLETE

Summary: 0 CRITICAL, 2 HIGH, 2 MEDIUM, 0 LOW

| Finding ID | Severity | Description | Status |
|---|---|---|---|
| VEN-ACTORS-001 | HIGH | Blocks controller does not pass viewerActorId to actor search — private profiles excluded from victim's block search, undermining safety feature | OPEN — unpatched |
| VEN-ACTORS-002 | HIGH | searchMentionSuggestions (upload) hardcodes p_filter='all' with no null-viewer guard, bypassing canonical protection | OPEN — unpatched |
| VEN-ACTORS-003 | MEDIUM | 3 bypass callsites for identity.search_actor_directory outside actors module — fragmented patch surface; chat/setup.js partially improved (viewerActorId now from Zustand) but filter logic still broken | OPEN — partial improvement in chat, not closed |
| VEN-ACTORS-004 | MEDIUM | BEHAVIOR.md is a placeholder stub — zero §5 Security Rules and zero §9 Must Never Happen invariants defined | OPEN — unpatched |

Output: ZZnotforproduction/APPS/VCSM/features/actors/outputs/2026/06/07/Venom/2026-06-07_venom_actors-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-07
ELEKTRA Status: COMPLETE

Summary: 0 CRITICAL, 2 HIGH, 1 MEDIUM, 1 LOW | 3 False Positives Rejected

| Finding ID | Severity | Description | Status |
|---|---|---|---|
| ELEK-2026-06-07-001 | HIGH | viewerActorId dropped in ctrlSearchActors (Blocks) — safety bypass; private harassers cannot be blocked via search | OPEN — THOR BLOCKER |
| ELEK-2026-06-07-002 | HIGH | searchMentionSuggestions hardcodes p_filter='all' — null-viewer bypass; canonical null-viewer guard absent | OPEN — THOR BLOCKER |
| ELEK-2026-06-07-003 | MEDIUM | chat/setup.js p_filter hardcoded 'all'; viewerActorId now read from Zustand (partial improvement since 2026-06-04) but filter derivation logic still absent | OPEN — PARTIAL IMPROVEMENT |
| ELEK-2026-06-07-004 | LOW | searchActorsDAL truthy-only viewerActorId check — no UUID validation; structural filter escalation risk | OPEN |
| ELEK-2026-06-04-001 | HIGH | HTML injection in m/[actorId] edge function — NOT RE-VERIFIED this run (edge function out of actors module scope) | UNVERIFIED — separate edge function audit required |

Output: ZZnotforproduction/APPS/VCSM/features/actors/outputs/2026/06/07/ELEKTRA/2026-06-07_elektra_actors-security-scan.md

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-07
BLACKWIDOW Status: COMPLETE

Summary: 0 CRITICAL, 3 HIGH, 2 MEDIUM, 2 LOW, 0 INFO

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-2026-06-07-001 | HIGH | ctrlSearchActors (Blocks) drops viewerActorId entirely — authenticated callers receive public-only filter; private harassers unblockable via search | BYPASSED | OPEN — THOR BLOCKER |
| BW-2026-06-07-002 | HIGH | searchMentionSuggestions.dal.js hardcodes p_filter='all' — null viewerActorId bypasses canonical protection; private actors returned to unauthenticated callers | BYPASSED | OPEN — THOR BLOCKER |
| BW-2026-06-07-003 | HIGH | assertActorId(null/""/non-UUID) passes silently — condition `actor &&` makes null/empty falsy-pass; callers using as null guard or UUID validator are unprotected | BYPASSED | OPEN — THOR BLOCKER |
| BW-2026-06-07-004 | MEDIUM | chat/setup.js p_filter hardcoded 'all'; viewerActorId now from Zustand (improvement) but filter derivation absent; hydration race window leaks private actors | PARTIAL | OPEN |
| BW-2026-06-07-005 | MEDIUM | explore/dal/search.dal.js mapFilter returns 'all' regardless of viewerActorId; null viewer + filter='all' sends p_filter='all' to RPC; canonical null-viewer guard absent | PARTIAL | OPEN |
| BW-2026-06-07-006 | LOW | searchActorsDAL truthy-only viewerActorId check — non-UUID truthy string (e.g. "x") elevates to filter='all'; no UUID format validation; no session binding | BYPASSED (low blast radius) | OPEN |
| BW-2026-06-07-007 | LOW | vportTeamAccess searchTeamCandidatesController accepts viewerActorId from caller params without session binding; forged UUID produces filter='all' | PARTIAL | OPEN |

Prior Run Re-verification (2026-06-04):
| Prior ID | Re-verification Status |
|---|---|
| BW-ACTORS-001 | STILL_OPEN_SOURCE_VERIFIED → superseded by BW-2026-06-07-006 |
| BW-ACTORS-002 | STILL_OPEN_SOURCE_VERIFIED → superseded by BW-2026-06-07-003 |
| BW-ACTORS-003 | PARTIAL_SOURCE_VERIFIED — original mechanism (empty opts) PATCHED; residual gap in explore DAL → BW-2026-06-07-005 |
| BW-ACTORS-004 | STILL_OPEN — architecture unchanged |
| BW-ACTORS-005 | STILL_OPEN — BEHAVIOR.md still PLACEHOLDER |

Output: ZZnotforproduction/APPS/VCSM/features/actors/outputs/2026/06/07/BlackWidow/2026-06-07_blackwidow_actors-adversarial-review.md
