# Security Posture — portfolio

Last Updated: 2026-06-04
Highest Open Severity: HIGH
THOR Release Blocker: YES

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

7 findings: 0 CRITICAL, 3 HIGH, 3 MEDIUM, 1 LOW

- VEN-PORTFOLIO-001 — HIGH — manageTags controller omits callerProfileId when calling dalReplacePortfolioTags; tag management always throws, ownership chain broken
- VEN-PORTFOLIO-002 — MEDIUM — invalidatePortfolioCache uses wrong key format; compound cache keys (actorId:owner, actorId:public) never invalidated on mutation
- VEN-PORTFOLIO-003 — HIGH — getPortfolioItem returns deleted/private items without visibility or is_deleted filter; potential non-owner exposure of private content
- VEN-PORTFOLIO-004 — LOW — portfolioTrace.adapter.js always bundled in production; trace store and adapter exports present in all builds (DEV-gated at engine debugReporter level only)
- VEN-PORTFOLIO-005 — MEDIUM — PortfolioItemModel exposes profileId and createdByActorId in client-facing domain model; violates VCSM identity surface contract
- VEN-PORTFOLIO-006 — MEDIUM — dalDeletePortfolioMedia relies solely on ASSUMED RLS for ownership enforcement; no app-layer profile_id scoping on DELETE
- VEN-PORTFOLIO-007 — HIGH — BEHAVIOR.md is PLACEHOLDER; no §5 Security Rules or §9 Must Never Happen invariants declared; all findings are UNANCHORED

Output: ZZnotforproduction/APPS/VCSM/features/portfolio/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_portfolio-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

7 findings: 0 CRITICAL, 2 HIGH, 4 MEDIUM, 0 LOW, 1 INFO

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-PORT-001 | HIGH | BEHAVIOR.md is PLACEHOLDER; all §9 invariants UNANCHORED; BW tests ran against inferred invariants only | UNANCHORED | OPEN |
| BW-PORT-002 | MEDIUM | manageTags controller does not pass callerProfileId to dalReplacePortfolioTags; tag management always throws (functional breakage); confirms VEN-PORT-001 from adversarial angle | BYPASSED (functional) | OPEN |
| BW-PORT-003 | MEDIUM | invalidatePortfolioCache(actorId) deletes bare actorId key; cache stores under compound keys (actorId:owner, actorId:public); stale data served for up to 60s after mutations; confirms VEN-PORT-002 | PARTIAL | OPEN |
| BW-PORT-004 | MEDIUM | dalDeletePortfolioMedia scoped to .eq('id', mediaId) only; no app-layer profile_id guard at DAL level; RLS is sole ownership barrier; confirms VEN-PORT-006 | PARTIAL | OPEN |
| BW-PORT-005 | HIGH | getPortfolioItem / dalGetPortfolioItemById has no is_deleted or visibility filter; returns deleted and private items to any caller with item UUID; confirms VEN-PORT-003 from adversarial angle | BYPASSED | OPEN |
| BW-PORT-006 | MEDIUM | dalUpdatePortfolioItem has no is_deleted=false guard; real owner can mutate soft-deleted items; inferred invariant INV-2 violated | PARTIAL BYPASS | OPEN |
| BW-PORT-007 | INFO | No URL/notification surface found in portfolio controllers; no raw UUID exposure in linkPaths or share links | BLOCKED | CLOSED |

Output: ZZnotforproduction/APPS/VCSM/features/portfolio/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_portfolio-adversarial-review.md
