# Security Posture — moderation

Last Updated: 2026-06-07
Highest Open Severity: CRITICAL
THOR Release Blocker: YES — VEN-MODERATION-001, VEN-MODERATION-002, VEN-MODERATION-007, BW-MOD-001, BW-MOD-003, BW-MOD-009, BW-MOD-010
VEN-MODERATION-005 CLOSED_SOURCE_VERIFIED 2026-06-07 (TICKET-MODERATION-REPORTER-CLEANUP-001); BW-MOD-002 CLOSED_SOURCE_VERIFIED 2026-06-07

---

## VENOM STATUS
VENOM Last Run: 2026-06-07 (batch: legal/media/moderation/monitoring/notifications)
VENOM Status: COMPLETE

10 findings total: 0 CRITICAL, 4 HIGH, 4 MEDIUM, 2 LOW
2026-06-07: VEN-MODERATION-005 CLOSED_SOURCE_VERIFIED; VEN-MODERATION-009 and VEN-MODERATION-010 added

| Finding ID | Severity | Status | Description |
|---|---|---|---|
| VEN-MODERATION-001 | HIGH | OPEN | Reporter identity (reporter_actor_id) is caller-supplied with no session binding — depends on moderation.reports INSERT RLS (UNVERIFIED) |
| VEN-MODERATION-002 | HIGH | OPEN | Actor identity (actor_id) in personal hide/unhide actions is caller-supplied — depends on moderation.actions INSERT RLS (UNVERIFIED) |
| VEN-MODERATION-003 | HIGH | OPEN | hidePostRow and hideMessageRow are exported DAL functions with no own auth guard — moderator gating is controller-only (insufficient defense-in-depth) |
| VEN-MODERATION-004 | HIGH | OPEN | updateReportRowStatus is an exported DAL function with no auth guard and no status allowlist — depends on moderation.reports UPDATE RLS (UNVERIFIED) |
| VEN-MODERATION-005 | MEDIUM | CLOSED_SOURCE_VERIFIED 2026-06-07 | reporterActorId prop removed from useReportFlow and all 6 callers — reporter now always derived from useIdentity() per TICKET-MODERATION-REPORTER-CLEANUP-001 |
| VEN-MODERATION-006 | LOW | OPEN | Ungated console.warn in report.controller.js:113 leaks internal state to production browser consoles |
| VEN-MODERATION-007 | MEDIUM | OPEN | BEHAVIOR.md is PLACEHOLDER — no §5 Security Rules or §9 Must Never Happen invariants defined; THOR blocker |
| VEN-MODERATION-008 | LOW | OPEN | dalDeleteConversationHideAction final DELETE query missing .eq('actor_id', actorId) ownership re-check (TOCTOU hardening) |
| VEN-MODERATION-009 | MEDIUM | OPEN — SOURCE_VERIFIED 2026-06-07 | undoConversationCover controller has no app-layer ownership check — actorId accepted from caller without session verification; relies entirely on DB RLS (chat.inbox_entries chat_inbox_update_own policy) |
| VEN-MODERATION-010 | MEDIUM | OPEN — SOURCE_VERIFIED 2026-06-07 | assertModerationAccessController authorizes via auth.uid() server-side (isModerationAuthorizedDAL ignores actorId param) but write operations use caller-supplied moderatorActorId — audit trail mismatch if actorId diverges from session actor |

Output (2026-06-04): ZZnotforproduction/APPS/VCSM/features/moderation/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_moderation-security-review.md
Output (2026-06-07): ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/VENOM/venom-report-legal-media-moderation-monitoring-notifications.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-07 (Blue Team batch: ARCHITECT→VENOM→BLACKWIDOW→ELEKTRA, branch vport-booking-feed-security-updates)
ELEKTRA Status: COMPLETE (scope-limited to VENOM/BW surfaces confirmed this session)

0 direct ELEKTRA findings raised (moderation-specific chains not in ELEK-001 through ELEK-007 scope this pass).
Pre-existing VENOM + BLACKWIDOW findings remain open — no app-layer code patches applied to moderation this pass per patching phase protocol.

Chain Coverage:
- BW-MOD-001 / VEN-MODERATION-001 (reporter_actor_id IDOR): confirmed via BW pass; app-layer patch not proposed in ELEKTRA scope this pass (DB-dependent — moderation.reports RLS required as pre-condition)
- BW-MOD-010 / VEN-MODERATION-003 (hidePostRow exported DAL, no guard): confirmed chain; patch requires moderator gating at DAL layer

DB Audit Notes from ELEKTRA session (moderation-adjacent, deferred):
- DB-ELEK-MODERATION-001: moderation.reports — enable RLS; INSERT WITH CHECK (reporter_actor_id = authenticated actor); UPDATE policy (moderator role required)
- DB-ELEK-MODERATION-002: moderation.actions — enable RLS; INSERT WITH CHECK (actor_id = auth.uid())

THOR Blockers (unchanged from BLACKWIDOW pass):
BW-MOD-001, BW-MOD-003, BW-MOD-009, BW-MOD-010 — still OPEN

Full Output: ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ELEKTRA/ELEK-V1-SESSION-MASTER.md

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

10 findings total: 1 CRITICAL, 4 HIGH, 3 MEDIUM, 2 LOW

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-MOD-001 | CRITICAL | reporter_actor_id and actor_id are fully caller-supplied with no session binding — reporter attribution and personal hide-action actor can be forged | BYPASSED | OPEN |
| BW-MOD-002 | HIGH | useReportFlow accepts reporterActorId from component prop with no session enforcement — stale or wrong actorId propagates silently to write path | BYPASSED | CLOSED_SOURCE_VERIFIED 2026-06-07 — prop removed per TICKET-MODERATION-REPORTER-CLEANUP-001 |
| BW-MOD-003 | HIGH | updateReportRowStatus has no ownership filter (only .eq('id', reportId)) — any report can be status-updated if RLS passes; moderator gating is controller-only | PARTIAL | OPEN |
| BW-MOD-009 | HIGH | BEHAVIOR.md is PLACEHOLDER — no §9 invariants; all security properties unanchored (cross-ref VEN-MODERATION-007) | UNRESOLVED | OPEN |
| BW-MOD-010 | HIGH | hidePostRow and hideMessageRow are exported DAL functions with no auth guard — direct callers can globally hide any content bypassing moderator gate (cross-ref VEN-MODERATION-003) | BYPASSED | OPEN |
| BW-MOD-004 | MEDIUM | reasonCode is not validated against REPORT_REASONS allowlist in controller or DAL — arbitrary strings can be written to moderation.reports | BYPASSED | OPEN |
| BW-MOD-005 | MEDIUM | Personal hide/unhide paths have no actor kind check — vport actors can write hide actions to moderation.actions | BYPASSED | OPEN |
| BW-MOD-006 | MEDIUM | hideReportedObjectController does not guard against re-actioning a dismissed report — dismissed terminal state can be overridden by any moderator | BYPASSED | OPEN |
| BW-MOD-007 | LOW | assertModerationAccessController accepts actorId parameter but isModerationAuthorizedDAL ignores it — semantic gap creates misleading authorization API | INFO | OPEN |
| BW-MOD-008 | LOW | Report deduplication is opt-in (caller must supply dedupeKey) — no server-side rate limit or server-enforced duplicate detection | PARTIAL | OPEN |

Output: ZZnotforproduction/APPS/VCSM/features/moderation/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_moderation-adversarial-review.md
