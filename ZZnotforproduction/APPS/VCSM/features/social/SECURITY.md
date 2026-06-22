# Security Posture — social

Last Updated: 2026-06-04
Highest Open Severity: HIGH
THOR Release Blocker: YES — VEN-SOCIAL-001, VEN-SOCIAL-002, VEN-SOCIAL-003, BW-SOCIAL-001, BW-SOCIAL-005, BW-SOCIAL-006, MISSING_BEHAVIOR_CONTRACT

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

Summary: 0 CRITICAL, 3 HIGH, 1 MEDIUM, 1 LOW. Behavior contract absent (placeholder only).

| Finding ID | Severity | Description |
|---|---|---|
| VEN-SOCIAL-001 | HIGH | ctrlListIncomingRequests V-SUB-003 status unclear — regression tests marked WILL FAIL; RLS on social_follow_requests unverified. THOR BLOCKER. |
| VEN-SOCIAL-002 | HIGH | ctrlSendFollowRequest has no assertingActorId ownership gate — any actor can send follow requests impersonating another actor. THOR BLOCKER. |
| VEN-SOCIAL-003 | HIGH | dalUpdateActorSocialSettings accepts open patch with no column allowlist at DAL layer — comment documents a constraint not enforced in code. |
| VEN-SOCIAL-004 | MEDIUM | Notification linkPath UUID regression risk — V-SUB-005 test exists but CI enforcement not confirmed. Current state safe. |
| VEN-SOCIAL-005 | LOW | Unguarded console.error in dalInsertFollow (line 56) and useSubscribeAction (line 172) logs actor IDs to browser console in production. |
| MISSING_BEHAVIOR_CONTRACT | HIGH (governance) | BEHAVIOR.md is a 9-line placeholder — no §5 Security Rules or §9 Must Never Happen defined. |

Output: ZZnotforproduction/APPS/VCSM/features/social/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_social-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

Summary: 0 CRITICAL, 3 HIGH, 2 MEDIUM, 2 LOW, 3 INFO. BEHAVIOR.md is a placeholder — all §9 invariants UNANCHORED. 2 exploit chains confirmed BYPASSED (BW-SOCIAL-001: spoofed follow request; BW-SOCIAL-005: DAL-layer settings patch bypass). 2 UNRESOLVED chains pending DB RLS audit.

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-SOCIAL-001 | HIGH | ctrlSendFollowRequest has no assertingActorId gate — any caller can spoof requesterActorId and send follow requests as another actor. Confirms and escalates VEN-SOCIAL-002. THOR BLOCKER. | BYPASSED | DRAFT |
| BW-SOCIAL-002 | MEDIUM | useFollowActorToggle self-signs assertingActorId from caller-supplied followerActorId — ownership gate is caller-trust-dependent, not session-bound. | PARTIAL | DRAFT |
| BW-SOCIAL-003 | LOW | useSubscribeAction binds viewerActorId from prop, not session — UI disabled guard is not a security invariant. | PARTIAL | DRAFT |
| BW-SOCIAL-004 | INFO | No actor kind restriction on ctrlSendFollowRequest — by design; no security gap. | BLOCKED | DRAFT |
| BW-SOCIAL-005 | HIGH | dalUpdateActorSocialSettings has no DAL-layer column allowlist — arbitrary patch keys accepted at DAL. Controller-layer allowlist in ctrlUpdateVportSocialSettings is not enforced at DAL layer. Confirms and escalates VEN-SOCIAL-003. THOR BLOCKER. | BYPASSED | DRAFT |
| BW-SOCIAL-006 | HIGH | RLS on vc.actor_follows unverified — if misconfigured, controller ownership gates are the only barrier for dalInsertFollow and dalDeactivateFollow. DB audit required. THOR BLOCKER. | UNRESOLVED | DRAFT |
| BW-SOCIAL-007 | MEDIUM | RLS on vc.actor_social_settings relies on undocumented claim (DAL comment only) — not verified from DB. | UNRESOLVED | DRAFT |
| BW-SOCIAL-008 | LOW | dalDeactivateFollow has no precondition on is_active state — replay unsubscribe causes unnecessary cache invalidations. | PARTIAL | DRAFT |
| BW-SOCIAL-009 | INFO | hydrateActorsFromRows in useIncomingFollowRequests uses DB-sourced actor IDs — no hydration poisoning vector. | BLOCKED | DRAFT |
| BW-SOCIAL-010 | INFO | All follow/follow_request/follow_request_accepted notifications use linkPath: /feed — no raw UUID exposure. | BLOCKED | DRAFT |

Output: ZZnotforproduction/APPS/VCSM/features/social/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_social-adversarial-review.md
