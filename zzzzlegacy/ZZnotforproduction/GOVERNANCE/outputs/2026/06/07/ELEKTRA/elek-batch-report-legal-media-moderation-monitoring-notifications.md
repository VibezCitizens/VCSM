# ELEKTRA Security Report — Batch: legal / media / moderation / monitoring / notifications

**Date:** 2026-06-07
**Scope:** VCSM — features 16–20 (legal, media, moderation, monitoring, notifications)
**Reviewer:** ELEKTRA
**Scan Trigger:** Blue Team batch pipeline — ARCHITECT→VENOM→BLACKWIDOW→ELEKTRA
**Findings Summary:** 2 MEDIUM | 1 LOW | 0 HIGH | 1 INFO
**False Positives Rejected:** 1
**Suggested Patches:** 2

Upstream VENOM: ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/VENOM/venom-report-legal-media-moderation-monitoring-notifications.md
Upstream BLACKWIDOW: ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/BLACKWIDOW/bw-batch-report-legal-media-moderation-monitoring-notifications.md

---

## ELEKTRA PREFLIGHT

```
ARCHITECT Output: FRESH (2026-06-07) — PASS
VENOM Output:     FRESH (2026-06-07) — PASS
BLACKWIDOW Output: FRESH (2026-06-07) — PASS
Scope Match:      VCSM features 16–20 — MATCH
Overall:          PASS — PROCEEDING
```

---

## Coverage Decisions

| Feature | Prior ELEKTRA | Action | Reason |
|---|---|---|---|
| legal | COMPLETE 2026-06-06 — 7 findings, 3 HIGH | REFERENCE ONLY | No new code changes; VEN-LEGAL-001 is DB-layer (RLS) — handled by prior ELEKTRA |
| media | COMPLETE 2026-06-05 — reverification | DELTA ONLY | VEN-MEDIA-006 (adapter violation, LOW) — new finding this batch |
| moderation | COMPLETE 2026-06-07 per SECURITY.md | REFERENCE ONLY | Chains confirmed in prior session master |
| monitoring | NOT RUN | FULL TRACE | New feature this batch — VEN-MONITORING-001 / BW-MONITORING-001 |
| notifications | COMPLETE 2026-06-07 per SECURITY.md | REFERENCE ONLY | Chains confirmed in prior session (ELEK-2026-06-07-001 and -B003) |

---

## Executive Summary

Two new ELEKTRA findings from this batch:

1. **ELEK-2026-06-07-MONITORING-001 (MEDIUM)** — Confirmed source-to-sink chain: `useOwnerQuickStats` passes actor UUIDs through `captureMonitoringError` directly into Sentry external endpoint with no forbidden-key stripping. Live production caller confirmed with SOURCE_VERIFIED evidence.

2. **ELEK-2026-06-07-MEDIA-001 (LOW)** — `media.adapter.js` exports controllers directly. Source-to-sink chain traced but current callers all session-bound. Architectural risk — no immediate exploit.

One false positive rejected: VEN-MONITORING-001 candidate for HIGH escalation — rejected because impact is limited to Sentry admin access (not user-facing) and no evidence of auth token leak (only actor UUIDs).

---

## ELEKTRA SCAN TARGET

```
ELEKTRA SCAN TARGET
Feature / Route: monitoring (service), media (adapter delta)
Application Scope: VCSM
Reason for scan: New findings from 2026-06-07 batch — VEN-MONITORING-001, VEN-MEDIA-006
Scan trigger: BLACKWIDOW referral (BW-MONITORING-001, BW-MEDIA-008)
Upstream VENOM report: ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/VENOM/venom-report-legal-media-moderation-monitoring-notifications.md
Upstream BLACKWIDOW report: ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/BLACKWIDOW/bw-batch-report-legal-media-moderation-monitoring-notifications.md
```

---

## Medium Findings

### ELEK-2026-06-07-MONITORING-001

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-07-MONITORING-001
- Title:              Actor UUID exfiltration via captureMonitoringError unsanitized Sentry context
- Category:           Secrets Exposure (PII to external endpoint)
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/services/monitoring/monitoring.js:52-56
                      apps/VCSM/src/features/vportDashboard/hooks/useOwnerQuickStats.js:15

- Source:             useOwnerQuickStats(actorId, callerActorId) — caller-supplied actor UUIDs
                      passed as context object to captureMonitoringError on catch

- Sink:               Sentry.captureException(error, { extra: context })
                      — external Sentry endpoint (monitoring.js:54)

- Trust Boundary:     captureMonitoringError should strip PII keys from context before forwarding
                      to external endpoint. This boundary is present in captureVcsmError
                      (FORBIDDEN_KEYS set in vcsmMonitoring.js) but ABSENT in captureMonitoringError.

- Impact:             Actor UUIDs (actorId, callerActorId) written to Sentry error logs.
                      Any Sentry project admin or compromised Sentry account can read actor identifiers.
                      Violates platform FORBIDDEN_KEYS contract already established in vcsmMonitoring.js.

- Evidence:           useOwnerQuickStats.js:15 [SOURCE_VERIFIED]:
                        captureMonitoringError(err, { context: "useOwnerQuickStats", actorId, callerActorId })
                      monitoring.js:54 [SOURCE_VERIFIED]:
                        Sentry.captureException(error, { extra: context })
                      vcsmMonitoring.js FORBIDDEN_KEYS [SOURCE_VERIFIED]:
                        contains 'actorId', 'actor_id', 'callerActorId' (20+ keys) — never applied to monitoring.js path

- Reproduction Steps:
  1. Load any screen that calls useOwnerQuickStats with a valid actorId
  2. Trigger an error in loadOwnerQuickStatsController
  3. captureMonitoringError fires with { actorId, callerActorId } in context
  4. Sentry receives actorId in the extra field — visible in Sentry issue detail panel

- Existing Defense:   VITE_SENTRY_DSN guard (no-op if env var absent — dev safety only)
- Why Defense Is Insufficient: Does nothing about context sanitization; Sentry IS active in production

- Recommended Fix:    Option A: Add forbidden-key stripping to captureMonitoringError
                      Option B: Deprecate captureMonitoringError; route all callers to captureVcsmError

- Suggested Patch:    Option A (minimal change):
```javascript
// monitoring.js
const _SENTRY_FORBIDDEN = new Set([
  'userId','user_id','actorId','actor_id','email','token','callerActorId',
  'sessionId','session_id','authToken','auth_token','accessToken','access_token'
]);

function _stripForbiddenSentry(obj) {
  if (!obj || typeof obj !== 'object') return {};
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !_SENTRY_FORBIDDEN.has(k)));
}

export function captureMonitoringError(error, context) {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  Sentry.captureException(error, { extra: _stripForbiddenSentry(context) });
}
```
                      Option B (preferred): Replace call site in useOwnerQuickStats.js:
```javascript
// useOwnerQuickStats.js — use captureVcsmError instead:
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring';
// ...
.catch((err) => captureVcsmError({ error: err, context: { feature: "vportDashboard.useOwnerQuickStats" } }))
```

- Follow-up Command:  DB (no DB changes required); THOR (MEDIUM — CAUTION status)
```

---

## Low Findings

### ELEK-2026-06-07-MEDIA-001

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-07-MEDIA-001
- Title:              media.adapter.js exports controllers — adapter boundary violation enables actorId injection
- Category:           IDOR/BOLA (architectural precondition)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/media/adapters/media.adapter.js

- Source:             Any external VCSM feature importing createMediaAssetController from media.adapter.js
                      and calling it with arbitrary ownerActorId without session binding

- Sink:               insertMediaAssetDAL → INSERT platform.media_assets (owner_actor_id = forged value)

- Trust Boundary:     Adapter layer should not expose controllers directly; consumers should
                      only access session-bound hooks that internally call the controller

- Impact:             Future caller could insert media_assets with forged owner_actor_id.
                      Current RLS INSERT policy would constrain this, but PUBLIC role UPDATE
                      policy (Phase 6 pending) weakens the DB defense.

- Evidence:           media.adapter.js [SOURCE_VERIFIED]:
                        export { createMediaAssetController, resolveVcsmAppId, softDeleteMediaAssetController }
                      createMediaAsset.controller.js [SOURCE_VERIFIED]:
                        validates ownerActorId !== null/undefined but does NOT verify against session

- Existing Defense:   Current callers (useProfileUploads.js) session-bind actorId via useIdentity()
- Why Defense Is Insufficient: The adapter export itself has no enforcement — convention not contract

- Reproduction Steps:
  1. In a new component, import createMediaAssetController from the media adapter
  2. Call with ownerActorId = any other actor's UUID (not session actor)
  3. Insert succeeds (no app-layer session check; current DB RLS may restrict but PUBLIC policy risk)

- Recommended Fix:    Remove controller exports from media.adapter.js; export only hooks/components
- Suggested Patch:
```javascript
// media.adapter.js — replace controller exports with hook wrapper:
export { useMediaUpload } from '../hooks/useMediaUpload'; // wrap controller internally
export { resolveVcsmAppId } from './mediaAppId.adapter';
// Remove: createMediaAssetController, softDeleteMediaAssetController
```

- Follow-up Command:  VENOM (confirm adapter contract compliance), BW-MEDIA-003 still open
```

---

## Info Findings

### ELEK-2026-06-07-MONITORING-INFO-001

```
INFO

- Title:          Two divergent monitoring paths — captureMonitoringError vs captureVcsmError
- Location:       apps/VCSM/src/services/monitoring/monitoring.js
                  apps/VCSM/src/services/monitoring/vcsmMonitoring.js
- Notes:          vcsmMonitoring.js has the correct sanitization model (CONTEXT_ALLOWLIST,
                  FORBIDDEN_KEYS, breadcrumb stripping). monitoring.js (Sentry adapter) is a
                  legacy lower-quality path. The divergence creates risk of callers defaulting
                  to the wrong function. Long-term: consolidate or deprecate monitoring.js.
- Action:         No immediate fix required; informational for tech debt tracking
```

---

## False Positives Rejected

```
FALSE POSITIVE REJECTED

- Candidate:        VEN-MONITORING-001 escalation to HIGH
- Location:         monitoring.js:54 / useOwnerQuickStats.js:15
- Rejection reason: Impact limited to Sentry admin access (not user-facing exploit path)
                    Actor UUIDs are not auth credentials; no evidence of session tokens in context
- Chain gap:        Impact link — external Sentry access requires Sentry admin privileges
- Notes:            Retained as MEDIUM; escalation to HIGH would require evidence of token/credential leak
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-07-MONITORING-001 | captureMonitoringError forbidden-key stripping | MEDIUM | Service (monitoring.js) | SIMPLE | NO |
| 2 | ELEK-2026-06-07-MEDIA-001 | Remove controller exports from media.adapter.js | LOW | Adapter | SIMPLE | NO |

---

## Prior Session References (features with ELEKTRA already complete)

| Feature | ELEKTRA Run | Finding IDs | Status |
|---|---|---|---|
| legal | 2026-06-06 | ELEK-2026-06-06-001 through 007 | 3 HIGH OPEN — THOR blocked |
| media | 2026-06-05 | ELEK-2026-06-05-001 through 003 (+ 7 verifications) | 2 THOR blockers open |
| moderation | 2026-06-07 (session) | Per SECURITY.md | BW-MOD-001, BW-MOD-003 OPEN |
| notifications | 2026-06-07 (session) | ELEK-2026-06-07-001, -B003 | 1 HIGH OPEN |

---

## THOR Release Blockers (ELEKTRA perspective, this batch)

| Blocker | Feature | Severity | Confirmed |
|---|---|---|---|
| ELEK-2026-06-07-MONITORING-001 | monitoring | MEDIUM (CAUTION) | SOURCE_VERIFIED |
| ELEK-2026-06-07-MEDIA-001 | media | LOW (no block) | SOURCE_VERIFIED |
| ELEK-2026-06-06-001/002/003 | legal | HIGH (BLOCKER) | Prior session |
| BW-MEDIA-002, BW-MEDIA-007 | media | HIGH (BLOCKER) | Prior session |
| VEN-NOTIFICATIONS-001 → ELEK-2026-06-07-001 | notifications | HIGH (BLOCKER) | Prior session |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| DB / Carnage | platform.user_consents ENABLE ROW LEVEL SECURITY (VENOM-002) | DB AUDIT DEFERRED |
| DB / Carnage | vc.posts ENABLE ROW LEVEL SECURITY (VENOM-003) | DB AUDIT DEFERRED |
| DB | notification.inbox_items RLS verify (BW-NOTI-004) | DB AUDIT DEFERRED |
| DB | moderation.actions INSERT WITH CHECK moderatorActorId (VENOM-005/VEN-MODERATION-010) | DB AUDIT DEFERRED |
| THOR | Release gate evaluation — multiple HIGH blockers open | PENDING |
| SPIDER-MAN | Regression coverage for markSeen patch when applied | PENDING |
