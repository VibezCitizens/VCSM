# Security Posture — block

Last Updated: 2026-06-07
Highest Open Severity: HIGH
THOR Release Blocker: YES — ELEK-BLOCK-2026-001 (session guard missing: ctrlGetBlockStatus), ELEK-BLOCK-2026-002 (session guard missing: ctrlGetBlockedActorSet), ELEK-BLOCK-2026-003 (fail-open: useBlockStatus must fail-closed)

---

## VENOM STATUS
VENOM Last Run: 2026-06-07
VENOM Status: COMPLETE

Findings: 0 CRITICAL, 2 HIGH, 2 MEDIUM, 1 LOW

| Finding ID | Severity | Description | Status |
|---|---|---|---|
| VEN-BLOCK-2026-001 | HIGH | ctrlGetBlockStatus — no session assertion; any caller can query block status between any two actors | OPEN — THOR BLOCKER |
| VEN-BLOCK-2026-002 | HIGH | ctrlGetBlockedActorSet — no session assertion; complete block list for any actorId enumerable | OPEN — THOR BLOCKER |
| VEN-BLOCK-2026-003 | MEDIUM | filterBlockedActors — no candidateActorIds array length cap; unbounded PostgREST .or() clause (DoS vector) | OPEN |
| VEN-BLOCK-2026-004 | MEDIUM | console.error in all 3 DALs (block.write:34,51; block.check:34; block.read:36) leaks actor IDs to production console | OPEN |
| VEN-BLOCK-2026-005 | LOW | BEHAVIOR.md is PLACEHOLDER — safety-critical feature has no §9 Must Never Happen invariants; all findings UNANCHORED | OPEN |

Verified Safe (write path guards confirmed [SOURCE_VERIFIED]):
- assertingActorId === blockerActorId (blockActor.controller:28) HOLDS
- assertingActorId === blockerActorId (unblockActor.controller:49) HOLDS
- blockedByMe pre-check (unblockActor.controller:55) HOLDS
- sessionActorId from useIdentity() (hooks/useBlockActorAction.js:7) HOLDS
- isUuid() validation (block.check.dal.js:14) HOLDS
- cannot block self (block.write.dal.js:22) HOLDS

Output: ZZnotforproduction/APPS/VCSM/features/block/outputs/2026/06/07/Venom/2026-06-07_venom_block-security-review.md
Prior run (2026-06-04): ZZnotforproduction/APPS/VCSM/features/block/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_block-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-07
ELEKTRA Status: COMPLETE

0 CRITICAL | 3 HIGH | 2 MEDIUM | 0 LOW
2 False Positives Rejected | 3 DB Audit Notes
THOR Release Blocker: YES — 3 HIGH (ELEK-BLOCK-2026-001, 002, 003)

| Finding ID | Severity | Description | Patch Type | Status |
|---|---|---|---|---|
| ELEK-BLOCK-2026-001 | HIGH | ctrlGetBlockStatus: no session guard — accepts any actorId pair; add assertingActorId ownership check | SESSION_GUARD (controller) | OPEN — THOR BLOCKER |
| ELEK-BLOCK-2026-002 | HIGH | ctrlGetBlockedActorSet: no session guard — any actorId's full block list queryable | SESSION_GUARD (controller) | OPEN — THOR BLOCKER |
| ELEK-BLOCK-2026-003 | HIGH | useBlockStatus fails open on DB error — setIsBlocked(false); change to setIsBlocked(true) (fail-closed) | FAIL_CLOSED (hook) | OPEN — THOR BLOCKER |
| ELEK-BLOCK-2026-004 | MEDIUM | filterBlockedActors: no candidateActorIds.length cap; add MAX_CANDIDATES=500 guard | INPUT_VALIDATION (DAL) | OPEN |
| ELEK-BLOCK-2026-005 | MEDIUM | console.error in 4 locations (block.write:34,51; block.check:34; block.read:36) → replace with captureVcsmError | REMOVE + captureVcsmError | OPEN |

False Positives Rejected: FP-BLOCK-001 (write path IDOR — VERIFIED SAFE), FP-BLOCK-002 (isUuid() insufficient — valid sanitation)
DB Audit Notes: moderation.blocks SELECT RLS, block_actor RPC ownership, unblock_actor RPC ownership
Output: ZZnotforproduction/APPS/VCSM/features/block/outputs/2026/06/07/ELEKTRA/2026-06-07_elektra_block-security-scan.md

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-07
BLACKWIDOW Status: COMPLETE

Summary (2026-06-07): 3 HIGH BYPASSED, 1 MEDIUM PARTIAL, 2 NEW findings

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-BLOCK-2026-001 | HIGH | ctrlGetBlockStatus session bypass — any actor pair's block status queryable by any authenticated Citizen | BYPASSED | OPEN — THOR BLOCKER |
| BW-BLOCK-2026-002 | HIGH | ctrlGetBlockedActorSet enumeration — complete block list for any actorId fully enumerable | BYPASSED | OPEN — THOR BLOCKER |
| BW-BLOCK-2026-003 | MEDIUM | filterBlockedActors unbounded array — PostgREST .or() with 10,000+ conditions possible | PARTIAL | OPEN |
| BW-BLOCK-2026-004 | MEDIUM | console.error actor ID leak — confirmed fires in production DevTools | BYPASSED | OPEN |
| BW-BLOCK-2026-005 | N/A | Write path ownership guards | BLOCKED | SAFE |
| BW-BLOCK-2026-006 | N/A | Cannot block self | BLOCKED | SAFE |
| BW-BLOCK-2026-007 | HIGH | useBlockStatus fails open on DB error — blocked actor gains canViewProfile=true during transient failures | BYPASSED | OPEN — THOR BLOCKER |
| BW-BLOCK-2026-008 | MEDIUM | No actor kind validation — cross-kind blocks unvalidated | UNRESOLVED | OPEN |

Prior run (2026-06-04): BW-BLOCK-001 to BW-BLOCK-007 — all still OPEN
Output: ZZnotforproduction/APPS/VCSM/features/block/outputs/2026/06/07/BlackWidow/2026-06-07_blackwidow_block-adversarial-review.md
