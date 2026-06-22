# Security Posture — monitoring (service)

Last Updated: 2026-06-07
Highest Open Severity: MEDIUM
THOR Release Blocker: NO — no CRITICAL or HIGH blockers

Note: monitoring is a service, not a feature. Source at apps/VCSM/src/services/monitoring/.
Two subsystems: Sentry adapter (monitoring.js) and Quicksilver ingest (vcsmMonitoring.js).

---

## VENOM STATUS
VENOM Last Run: 2026-06-07 (batch: legal/media/moderation/monitoring/notifications)
VENOM Status: COMPLETE

Summary: 2 findings — 0 CRITICAL, 0 HIGH, 1 MEDIUM, 1 LOW

| Finding ID | Severity | Status | Description |
|---|---|---|---|
| VEN-MONITORING-001 | MEDIUM | OPEN — SOURCE_VERIFIED 2026-06-07 | captureMonitoringError (monitoring.js line 54) passes raw context object to Sentry.captureException as `extra` field without forbidden-key sanitization — callers that pass actorId, userId, or token in context leak PII to external Sentry endpoint |
| VEN-MONITORING-002 | LOW | OPEN — SOURCE_VERIFIED 2026-06-07 | vcsmMonitoring.js captureVcsmError is well-designed (CONTEXT_ALLOWLIST, FORBIDDEN_KEYS, breadcrumb stripping) but captureMonitoringError bypasses all of it — two divergent paths; callers may migrate to wrong one without noticing |

DB AUDIT NOTES: None — monitoring service has no DB reads or writes.

Output: ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/VENOM/venom-report-legal-media-moderation-monitoring-notifications.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-07 (batch: legal/media/moderation/monitoring/notifications)
ELEKTRA Status: COMPLETE
ELEKTRA Recommendation: CAUTION

1 MEDIUM open

| Finding ID | Severity | Title | Chain | Status |
|---|---|---|---|---|
| ELEK-2026-06-07-MONITORING-001 | MEDIUM | captureMonitoringError passes actorId+callerActorId to Sentry without forbidden-key filtering — useOwnerQuickStats.js:15 confirmed live caller | SOURCE_VERIFIED | OPEN |

Patch suggestion: Strip forbidden keys in captureMonitoringError, or route callers to captureVcsmError.

Full Output: ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ELEKTRA/elek-batch-report-legal-media-moderation-monitoring-notifications.md

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-07 (batch: legal/media/moderation/monitoring/notifications)
BLACKWIDOW Status: COMPLETE

Summary: 1 finding — 0 CRITICAL, 0 HIGH, 1 MEDIUM, 0 LOW

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-MONITORING-001 | MEDIUM | captureMonitoringError passes raw context to Sentry.captureException without forbidden-key filtering — useOwnerQuickStats.js:15 confirmed live caller passing actorId+callerActorId to Sentry | BYPASSED | OPEN — SOURCE_VERIFIED 2026-06-07 |

Output: ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/BLACKWIDOW/bw-batch-report-legal-media-moderation-monitoring-notifications.md
