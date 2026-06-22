# BLACKWIDOW Adversarial Report — Batch: legal / media / moderation / monitoring / notifications

Date: 2026-06-07
Command: BLACKWIDOW V3 (Blue Team — Ethical Red Team)
Scope: VCSM
Batch: Features 16–20 (legal, media, moderation, monitoring, notifications)
Mode: Adversarial source simulation (manual — SPA)
Upstream VENOM: ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/VENOM/venom-report-legal-media-moderation-monitoring-notifications.md
BW Session Master: ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/BLACKWIDOW/BW-V3-SESSION-MASTER.md
Governance Status: DRAFT

---

## BLACKWIDOW PREFLIGHT

```
ARCHITECT Output: FRESH (0h) — ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ARCHITECT/
VENOM Output:     FRESH (0h) — ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/VENOM/
VENOM Scope:      VCSM (features 16–20) — MATCH
Overall:          PASS
```

---

## Application Scope

VCSM — features: legal, media, moderation, monitoring, notifications

---

## Coverage Map

| Feature | Attack Scenarios Run | Prior BW Coverage | New This Batch |
|---|---|---|---|
| legal | 2 (BW-SIM-002 in session master + BW-SIM-LEGAL-001 below) | BW-SIM-002 in BW-V3-SESSION-MASTER.md | VEN-LEGAL-001 SOURCE_VERIFIED — no new attack paths |
| media | 1 (BW-SIM-MEDIA-001) | None for VEN-MEDIA-006 | VEN-MEDIA-006 adapter violation — NEW |
| moderation | 2 (BW-SIM-003, BW-SIM-004 in session master) | Both covered | VEN-MODERATION-009/010 traced below |
| monitoring | 1 (BW-SIM-MONITORING-001) | None | VEN-MONITORING-001 confirmed BYPASSED |
| notifications | 2 (BW-SIM-001, BW-SIM-010 in session master) | Both covered | VEN-NOTIFICATIONS-001 PARTIAL confirmed |

---

## Attack Scenarios

### BW-SIM-LEGAL-001 — OWNERSHIP BYPASS: user_consents userId forging [FROM SESSION MASTER]

```
OWNERSHIP BYPASS ATTEMPT — REFERENCE
Target: legal/controllers/legalConsent.controller.js — recordLegalAcceptance({ userId })
Result: BYPASSED [SOURCE_VERIFIED]
Full scenario: BW-V3-SESSION-MASTER.md BW-SIM-002
VENOM Cross-Ref: VENOM-002 / VEN-LEGAL-001 (RLS OFF — now SOURCE_VERIFIED)
```

No new attack path found. BW-SIM-002 fully covers this surface.

---

### BW-SIM-MEDIA-001 — ARCHITECTURE VIOLATION: media.adapter.js direct controller export

```
BOUNDARY VIOLATION ATTEMPT
Target: apps/VCSM/src/features/media/adapters/media.adapter.js
Attack vector: External feature imports createMediaAssetController directly from the adapter.
  Because the adapter exports the controller function, callers can invoke the controller
  with arbitrary ownerActorId and createdByActorId without going through any session-aware wrapper.
Expected: Adapter should expose only hooks/components — not controllers
Actual: createMediaAssetController and softDeleteMediaAssetController exported directly

Attack chain:
  External feature → media.adapter.js (exports createMediaAssetController)
                   → createMediaAssetController({ ownerActorId: forged_id, ... })
                   → insertMediaAssetDAL → INSERT platform.media_assets

Defense gate at adapter layer: ABSENT (no wrapper, no session binding)
Defense gate at controller layer: ABSENT (ownerActorId required but not session-verified)
Defense gate at DB layer: INSERT RLS present, but PUBLIC role UPDATE coexists (Phase 6 pending)

Result: PARTIAL
Evidence:
  - media.adapter.js: export { createMediaAssetController, softDeleteMediaAssetController }
  - Controller does NOT call useIdentity() or verify actorId against session
  - Current callers (useProfileUploads) bind actorId from useIdentity() at hook layer — safe
  - But adapter boundary violation means any future caller bypasses this convention silently
  - No linting or type enforcement prevents direct actorId injection via adapter import

Severity: LOW (practical risk low due to current caller binding; structural risk MEDIUM)
VENOM Cross-Ref: VEN-MEDIA-006 (OPEN)
Pre-existing BW findings: BW-MEDIA-003 (createMediaAssetController no session verify — PARTIAL OPEN)
New finding: NO — confirms BW-MEDIA-003; adds adapter violation vector
```

---

### BW-SIM-MONITORING-001 — PII EXFILTRATION: captureMonitoringError Sentry context leak

```
DATA EXFILTRATION ATTEMPT
Target: apps/VCSM/src/services/monitoring/monitoring.js:52 — captureMonitoringError
Attack vector: Any caller passes actor identifiers in the context object.
  captureMonitoringError(error, { actorId, callerActorId, ... }) → Sentry.captureException
  passes context as `extra` field with NO forbidden-key sanitization.

Confirmed live caller [SOURCE_VERIFIED]:
  apps/VCSM/src/features/vportDashboard/hooks/useOwnerQuickStats.js:15
    captureMonitoringError(err, { context: "useOwnerQuickStats", actorId, callerActorId })
  Both `actorId` and `callerActorId` are actor UUIDs — sent directly to external Sentry endpoint.

Defense at captureMonitoringError: ABSENT (no allowlist, no forbidden-key strip)
Defense at captureVcsmError (vcsmMonitoring.js): PRESENT (CONTEXT_ALLOWLIST + FORBIDDEN_KEYS)
  — but captureMonitoringError is a different, non-sanitized export that callers use instead

Result: BYPASSED
Evidence:
  Source:          useOwnerQuickStats.js:15 — actorId, callerActorId in context param
  Trust boundary:  captureMonitoringError should strip forbidden keys before forwarding
  Sink:            Sentry.captureException(error, { extra: context }) — line 54 of monitoring.js
  Impact:          Actor UUIDs in Sentry error logs; any Sentry user can enumerate actor IDs
  Missing defense: No call to FORBIDDEN_KEYS.has() or equivalent before forwarding to Sentry
  Compound risk:   monitoring.js and vcsmMonitoring.js diverge — developers may default to wrong one

Severity: MEDIUM (actor UUIDs in Sentry; exploitable by Sentry admin or compromised account)
VENOM Cross-Ref: VEN-MONITORING-001 (OPEN)
Pre-existing: NO — NEW finding via BW adversarial source verification
Recommended fix: Add forbidden-key sanitization to captureMonitoringError, OR deprecate it
  in favor of captureVcsmError (which already implements CONTEXT_ALLOWLIST + FORBIDDEN_KEYS)
```

---

### BW-SIM-MODERATION-001 — AUDIT TRAIL MISMATCH: moderatorActorId vs session actor

```
VIEWER CONTEXT FUZZ ATTEMPT
Target: moderation/controllers/moderationActions.controller.js — hideReportedObjectController
Attack vector: Moderator M1 calls hideReportedObjectController with moderatorActorId = M2's actorId.
  isModerationAuthorizedDAL resolves from auth.uid() (session — M1 authorized)
  but all writes (insertModerationActionRow, updateReportRowStatus) use moderatorActorId = M2.
Expected: Session actor must match moderatorActorId in all writes
Actual: Authorization check passes for M1 (via auth.uid()); writes attribute action to M2

Result: PARTIAL
Evidence:
  - isModerationAuthorizedDAL ignores actorId param — resolves from auth.uid() server-side
  - moderationActions.controller.js inserts moderation.actions with moderatorActorId param (caller-supplied)
  - An authenticated moderator can attribute their actions to any other actorId
  - Risk: Audit trail forgery (M1 attributes moderation action to M2's actor)
  - DB defense: moderation.actions INSERT RLS UNVERIFIED — if RLS enforces actor, this is blocked
  - Without RLS: This is exploitable by any moderator account

Severity: MEDIUM (moderator-only; audit trail integrity; no direct content access)
VENOM Cross-Ref: VENOM-005 / VEN-MODERATION-010 (OPEN)
Pre-existing: BW-MOD-007 (LOW — semantic gap) — UPGRADED to MEDIUM via this adversarial simulation
```

---

### BW-SIM-MODERATION-002 — PROP INJECTION: undoConversationCover actorId [FROM SESSION MASTER]

```
OWNERSHIP BYPASS ATTEMPT — REFERENCE
Target: moderation/hooks/useConversationCover.js — actorId prop
Result: PARTIAL [SOURCE_VERIFIED]
Full scenario: BW-V3-SESSION-MASTER.md BW-SIM-004
VENOM Cross-Ref: VENOM-004 / VEN-MODERATION-009
DB defense: chat.inbox_entries chat_inbox_update_own RLS mitigates
```

---

### BW-SIM-NOTIFICATIONS-001 — markSeen bulk ownership bypass [FROM SESSION MASTER]

```
OWNERSHIP BYPASS ATTEMPT — REFERENCE
Target: notifications/runtime/index.js:271 — markSeen({ recipientIds })
Result: PARTIAL [SOURCE_VERIFIED]
Full scenario: BW-V3-SESSION-MASTER.md BW-SIM-001
Update: No current external callers found — practical risk remains MEDIUM (potential HIGH)
VENOM Cross-Ref: VENOM-001 / VEN-NOTIFICATIONS-001
```

---

## Summary of Adversarial Results (Batch 16–20)

| Scenario | Feature | Result | Severity | New? |
|---|---|---|---|---|
| BW-SIM-LEGAL-001 | legal / user_consents RLS bypass | BYPASSED (ref) | HIGH | NO — BW-SIM-002 |
| BW-SIM-MEDIA-001 | media / adapter controller export | PARTIAL | LOW | YES |
| BW-SIM-MONITORING-001 | monitoring / Sentry actor UUID leak | BYPASSED | MEDIUM | YES |
| BW-SIM-MODERATION-001 | moderation / audit trail mismatch | PARTIAL | MEDIUM | YES (upgrade of BW-MOD-007) |
| BW-SIM-MODERATION-002 | moderation / undoConversationCover prop | PARTIAL (ref) | MEDIUM | NO — BW-SIM-004 |
| BW-SIM-NOTIFICATIONS-001 | notifications / markSeen no ownership | PARTIAL (ref) | HIGH | NO — BW-SIM-001 |

---

## New Findings This Batch

### BW-MONITORING-001 (NEW)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID:           BW-MONITORING-001
- Scenario:             BW-SIM-MONITORING-001 — Sentry actor UUID leak via captureMonitoringError
- Target:               apps/VCSM/src/services/monitoring/monitoring.js:54
- Application Scope:    VCSM
- Platform Surface:     Monitoring service — Sentry adapter
- Attack Vector:        Caller passes actorId/callerActorId in context object; forwarded to Sentry unfiltered
- Exploit Chain Type:   Data exfiltration — PII to external endpoint
- Governance Status:    OPEN
- Result:               BYPASSED
- Evidence:             useOwnerQuickStats.js:15 — captureMonitoringError(err, { actorId, callerActorId })
                        Both UUIDs forwarded to Sentry.captureException extra without stripping
- Defense Gate:         ABSENT — no forbidden-key filtering in captureMonitoringError
- Blast Radius:         Actor UUIDs in Sentry logs; any Sentry admin can extract actor identifiers
- Severity:             MEDIUM
- VENOM Cross-Reference: VEN-MONITORING-001
- Recommended Fix:      Strip forbidden keys in captureMonitoringError, or route all callers to captureVcsmError
- Layer to Fix:         Service (monitoring.js)
- Required Follow-up:   ELEKTRA (source-to-sink trace), DB (no DB change needed)
```

---

## THOR Release Blockers (this batch)

| Blocker | Feature | Severity | Evidence |
|---|---|---|---|
| VENOM-001 / VEN-NOTIFICATIONS-001 / BW-NOTI-001 | notifications | HIGH | markSeen no ownership — PARTIAL |
| VENOM-002 / VEN-LEGAL-001 / BW-LEGAL-001 | legal | HIGH | user_consents RLS OFF — BYPASSED |
| VENOM-003 / BW-MOD-010 | moderation | HIGH | vc.posts RLS OFF — EXPOSED |
| BW-NOTI-004 | notifications | HIGH | notification.inbox_items RLS UNVERIFIED |

MEDIUM blockers (CAUTION status for THOR): BW-MONITORING-001, BW-MOD-007 (upgrade), VEN-MODERATION-009

---

## DB Audit Notes (Batch 16–20)

| Table | Attack | Status | Reference |
|---|---|---|---|
| platform.user_consents | Cross-user INSERT — BYPASSED | DB phase required | VENOM-002 / BW-LEGAL-001 |
| vc.posts | Unrestricted UPDATE — RLS OFF | DB phase required | VENOM-003 / BW-MOD-010 |
| notification.inbox_items | RLS status UNVERIFIED | DB phase required | BW-NOTI-004 |
| moderation.actions | INSERT — moderatorActorId not session-verified | DB phase required | BW-MOD-007 / VENOM-005 |

---

## Defenses Confirmed Hardened

| Attack | Defense | Status |
|---|---|---|
| markRead/dismiss/archive inbox bypass | verifyRecipientOwnership at lines 279/292/305 | CLOSED_SOURCE_VERIFIED |
| reporterActorId prop injection | Prop removed; useIdentity() used (TICKET-MODERATION-REPORTER-CLEANUP-001) | CLOSED_SOURCE_VERIFIED |
| notification.events source_actor_id spoofing | DB trigger 20260607000001 enforces ownership | HARDENED (DB layer) |

---

## Source Read Summary

Full Rediscovery Performed: NO (consumed evidence-bundle.json + VENOM reports)
Source files validated this BLACKWIDOW batch:
- apps/VCSM/src/features/media/adapters/media.adapter.js — adapter export verification
- apps/VCSM/src/services/monitoring/monitoring.js — captureMonitoringError sink
- apps/VCSM/src/features/vportDashboard/hooks/useOwnerQuickStats.js — confirmed live PII caller

---

## BLACKWIDOW Recommendation: CAUTION — DO NOT RELEASE

Three HIGH blockers confirmed across batch (notifications, legal, moderation).
monitoring has a confirmed BYPASSED MEDIUM with live production callers sending actor UUIDs to Sentry.
All HIGH findings require DB-layer remediation before THOR gate can pass.
