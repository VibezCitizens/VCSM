# Security Posture — Traffic:answers

Last Updated: 2026-06-07
Highest Open Severity: HIGH
THOR Release Blocker: YES (conditional — VEN-TRAFFIC-001 blocks TRAZE_ANSWERS_SCHEMA_READY activation; does not block VCSM THOR directly)

---

## VENOM STATUS
VENOM Last Run: 2026-06-07
VENOM Status: COMPLETE (first pass — branch vport-booking-feed-security-updates)

3 findings: 0 CRITICAL, 1 HIGH, 2 MEDIUM

| Finding ID | Severity | Description | Status |
|---|---|---|---|
| VEN-TRAFFIC-001 | HIGH | `/api/answers/questions` POST has no auth guard — when TRAZE_ANSWERS_SCHEMA_READY=true, any HTTP client can INSERT rows into answers.questions (no session, no captcha, no rate limit) | OPEN |
| VEN-TRAFFIC-002 | MEDIUM | moderation API routes use static shared bearer token — no user identity, no expiry, no audit trail per caller | OPEN |
| VEN-TRAFFIC-003 | MEDIUM | `submit_business_card_lead` RPC in Traffic conversion DAL has no env gate — auth model of RPC unverified | OPEN [SCANNER_LEAD] |

Output: ZZnotforproduction/APPS/VCSM/features/booking/outputs/2026/06/07/Venom/2026-06-07_venom_v2_branch-security-review.md

DB AUDIT NOTES:
- answers.questions INSERT RLS policy (anon key permission) — review required before flag activation
- submit_business_card_lead SECURITY DEFINER status + caller grants — review required

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-07 (branch: vport-booking-feed-security-updates)
ELEKTRA Status: COMPLETE (first pass)
Highest Open Severity: MEDIUM
THOR Release Blocker: YES (conditional — ELEK-2026-06-07-001 blocks TRAZE_ANSWERS_SCHEMA_READY activation)

0 HIGH | 3 MEDIUM | 0 LOW | 0 INFO | 1 false positive rejected

| Finding ID | Severity | Description | Status |
|---|---|---|---|
| ELEK-2026-06-07-001 | MEDIUM (HIGH when flag=true) | POST /api/answers/questions has no auth gate — when flag enabled, unauthenticated INSERT to answers.questions possible | OPEN |
| ELEK-2026-06-07-003 | MEDIUM | Moderation static token — no identity, no expiry, no audit trail | OPEN |
| ELEK-2026-06-07-B002 | MEDIUM | Moderation state machine: no terminal-state guard in moderateAnswer/moderateQuestion — chain traced SOURCE_VERIFIED 2026-06-07: { id, action } → valuesByAction lookup → .update(values).eq("id", id) with no prior-state check; published answers can be re-rejected | VEN-TRAFFIC-004 / BW-TRAFFIC-004 | OPEN |

Output (prior pass): ZZnotforproduction/APPS/Traffic/features/answers/outputs/2026/06/07/Elektra/2026-06-07_elektra_branch-security-scan.md
Output (branch full): ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ELEKTRA/2026-06-07_elektra_branch-security-scan.md

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-07 (branch: vport-booking-feed-security-updates)
BLACKWIDOW Status: COMPLETE (first pass)

2 findings adversarially confirmed, 1 extension finding added:

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-TRAFFIC-001 | HIGH | VEN-TRAFFIC-001 adversarially confirmed — POST /api/answers/questions: no auth, BYPASSED when flag=true | BYPASSED (flag=true) | OPEN |
| BW-TRAFFIC-002 | MEDIUM | VEN-TRAFFIC-001 extension — question flood: no rate limit at application layer, unbounded inserts when flag=true | ALLOWED | OPEN |
| BW-TRAFFIC-003 | MEDIUM | VEN-TRAFFIC-002 adversarially confirmed — static token provides no attribution; any token holder has full moderation authority | PARTIAL | OPEN |
| BW-TRAFFIC-004 | MEDIUM | VEN-TRAFFIC-004 adversarially confirmed — bearer token holder calls moderateAnswer with action="reject" on already-published answer; UPDATE fires unconditionally; published_at overwritten; content silently unpublished | APPLIED | OPEN |

Output (2026-06-07 governance): ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/BLACKWIDOW/2026-06-07_blackwidow_branch-adversarial-review.md
Output (prior): ZZnotforproduction/APPS/VCSM/features/booking/outputs/2026/06/07/BlackWidow/2026-06-07_blackwidow_branch-adversarial-review.md
