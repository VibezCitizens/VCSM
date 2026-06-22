# Security Posture — professional

Last Updated: 2026-06-04
Highest Open Severity: HIGH
THOR Release Blocker: YES — VEN-PROFESSIONAL-002, VEN-PROFESSIONAL-003, BW-PROF-002, BW-PROF-003, BW-PROF-008

---

## VENOM STATUS

VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

Summary: 7 findings total — 0 CRITICAL, 3 HIGH, 2 MEDIUM, 2 LOW

- VEN-PROFESSIONAL-001 | HIGH | BEHAVIOR.md is a placeholder — no §5 Security Rules or §9 Must Never Happen exist; feature has DB write surface with no codified invariants
- VEN-PROFESSIONAL-002 | HIGH | THOR BLOCKER — `dalMarkProfessionalBriefingsSeen` uses client-supplied actorId as UPDATE filter on `vc.notifications`; RLS ownership enforcement unverified
- VEN-PROFESSIONAL-003 | HIGH | THOR BLOCKER — `dalListProfessionalBriefings` uses client-supplied actorId for SELECT on `vc.notifications`; cross-actor notification content (including compliance domain) readable if RLS SELECT policy absent
- VEN-PROFESSIONAL-004 | MEDIUM | Unsanitized `link_path` from DB used directly in `navigate(item.linkPath)` — open redirect / JS protocol injection risk
- VEN-PROFESSIONAL-005 | MEDIUM | Profession verification gate missing — `ProfessionalAccessScreen` passes hardcoded `profession="nurse"` to `NurseHomeScreen`; any authenticated user reaches the workspace despite "verified nurses only" copy
- VEN-PROFESSIONAL-006 | LOW | Profession key read from localStorage — client-controlled value; no DB validation; risk escalates if used for DB-scoped queries
- VEN-PROFESSIONAL-007 | LOW | Housing and facility note forms carry no actorId on submission payload; `authorLabel` hardcoded; design-time risk before DB DAL is added

Output: outputs/2026/06/04/Venom/2026-06-04_19-48_venom_professional-security-review.md

---

## ELEKTRA STATUS

ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS

BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

Summary: 8 findings total — 0 CRITICAL, 3 HIGH, 3 MEDIUM, 2 LOW

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-PROF-001 | MEDIUM | Controller-layer ownership assertion absent on mark-seen path; DAL double-filter is sole ownership barrier | PARTIAL | OPEN |
| BW-PROF-002 | HIGH | Profession verification gate non-functional — ProfessionalAccessScreen hardcodes profession="nurse", any authenticated user reaches nurse workspace | BYPASSED | OPEN — THOR BLOCKER |
| BW-PROF-003 | HIGH | vc.notifications SELECT and UPDATE have no confirmed RLS; application-layer filters are sole isolation barrier; compliance-domain content (HIPAA) may be cross-actor accessible | UNRESOLVED | OPEN — THOR BLOCKER |
| BW-PROF-004 | LOW | ctrlMarkProfessionalBriefingsSeen silently returns on null actorId (no throw) while ctrlListProfessionalBriefings throws — inconsistent null error contract | BLOCKED | OPEN — INFO |
| BW-PROF-005 | LOW | Mark-seen has no idempotency guard at controller/DAL layer; hook-layer filter is sole replay barrier; no harmful outcome for this boolean operation | BLOCKED | OPEN — INFO |
| BW-PROF-006 | MEDIUM | linkPath from vc.notifications passed unsanitized to navigate(); open-redirect to external origin plausible; javascript: execution blocked by React Router | PARTIAL | OPEN |
| BW-PROF-007 | MEDIUM | §9 invariants entirely unanchored — BEHAVIOR.md is PLACEHOLDER; inferred invariant 3 (profession gate) confirmed bypassed | BYPASSED | OPEN |
| BW-PROF-008 | HIGH | BEHAVIOR.md is PLACEHOLDER — live DB write surface (vc.notifications UPDATE) and compliance-domain read surface exist with no codified security invariants | N/A | OPEN — THOR BLOCKER |

Output: outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_professional-adversarial-review.md
