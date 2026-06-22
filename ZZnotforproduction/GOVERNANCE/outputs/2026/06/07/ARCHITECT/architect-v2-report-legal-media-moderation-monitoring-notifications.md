# ARCHITECT V2 REPORT
===================
Scope: VCSM — legal · media · moderation · monitoring · notifications
Date: 2026-06-07T14:00:00
Scanner Version: 1.1.0
Ticket: ARCH-MULTI-MODULE-001 (continuation — batch 16–20)
Command: ARCHITECT V2 (scanner-assisted)

---

## Output Metadata

| Field | Value |
|---|---|
| Category Key | arch-multi-module-001-b16-20 |
| Feature / Scope | VCSM:legal, VCSM:media, VCSM:moderation, VCSM:monitoring, VCSM:notifications |
| Command | ARCHITECT V2 |
| Ticket | ARCH-MULTI-MODULE-001 |
| Scanner Version | 1.1.0 |
| Security Surface | ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ARCHITECT/architect-security-surface.json |
| Timestamp | 2026-06-07T14:00:00 |

---

## 1. ARCHITECT Scanner Preflight

```
ARCHITECT SCANNER PREFLIGHT
============================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Freshness Window: 7 days

| Map               | Generated At              | Age   | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| feature-map       | 2026-06-07T08:11:08.925Z  | ~6h   | FRESH     | HIGH       | PASS   |
| dependency-map    | 2026-06-07T08:11:08.925Z  | ~6h   | FRESH     | HIGH       | PASS   |
| route-map         | 2026-06-07T08:11:08.925Z  | ~6h   | FRESH     | HIGH       | PASS   |
| graph             | 2026-06-07T08:11:08.925Z  | ~6h   | FRESH     | HIGH       | PASS   |
| callgraph         | 2026-06-07T08:11:08.925Z  | ~6h   | FRESH     | HIGH       | PASS   |
| engine-candidates | 2026-06-07T08:11:08.925Z  | ~6h   | FRESH     | MEDIUM     | PASS   |
| write-surface-map | 2026-06-07T08:11:08.925Z  | ~6h   | FRESH     | HIGH       | PASS   |
| rpc-map           | 2026-06-07T08:11:08.925Z  | ~6h   | FRESH     | HIGH       | PASS   |
| security-path-map | 2026-06-07T08:11:08.925Z  | ~6h   | FRESH     | HIGH       | PASS   |
| edge-function-map | 2026-06-07T08:11:08.925Z  | ~6h   | FRESH     | HIGH       | PASS   |
| route-execution   | 2026-06-07T08:11:08.925Z  | ~6h   | FRESH     | HIGH       | PASS   |
| write-execution   | 2026-06-07T08:11:08.925Z  | ~6h   | FRESH     | HIGH       | PASS   |
| rpc-execution     | 2026-06-07T08:11:08.925Z  | ~6h   | FRESH     | HIGH       | PASS   |
| edge-execution    | 2026-06-07T08:11:08.925Z  | ~6h   | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 2. Scanner Inputs

| Map | Used For |
|---|---|
| feature-map | Feature inventory, path discovery for all 5 features |
| callgraph | Layer counts per feature, call chain analysis |
| write-surface-map | Write surface enumeration (24 total across 5 features) |
| rpc-map | RPC enumeration (6 across moderation + notifications) |
| route-map | Route inventory (6 legal routes, 0 others) |
| security-path-map | Security path enumeration (30 total across 5 features) |
| db-policy-map | RLS status validation on 8 key tables |
| dependency-map | Engine consumption, cross-feature import graph |

---

## 3. Scope Summary

| Field | Value |
|---|---|
| Applications scanned | 1 (VCSM) |
| Features in scope | 5 |
| Feature paths confirmed | 5/5 |
| Total callgraph nodes (5 features) | 248 |
| Write surfaces in scope | 24 |
| RPC surfaces in scope | 6 |
| Routes in scope | 6 (legal only) |
| Security paths in scope | 30 |
| Source files validated | 22 |

**Note on monitoring:** `monitoring` is not a feature folder — it lives at
`apps/VCSM/src/services/monitoring/` (3 files) and `apps/VCSM/src/app/monitoring/` (2 files).
No callgraph nodes are owned by `VCSM:monitoring`. Scanned as a service, not a feature.

---

## 4. Module Completeness Matrix

| Feature | adapter | component | controller | dal | hook | model | screen | module | total | status |
|---|---|---|---|---|---|---|---|---|---|---|
| legal | 1 | 0 | 2 | 4 | 3 | 0 | 7+ | 6 | 51 | STABLE |
| media | 2 | 0 | 2 | 3 | 0 | 2 | 0 | 1 | 14 | STABLE |
| moderation | 9 | 7 | 7 | 7 | 5 | 2 | 0 | 0 | 58 | STABLE |
| monitoring | — | — | — | — | — | — | — | — | — | SERVICE |
| notifications | 1 | 1 | 8 | 25 | 7 | 4 | 39 | 26 | 113 | STABLE |

**Architecture Notes:**
- **legal**: Has `engine/legalCompliance.engine.js` — embedded engine, should be tracked in CARNAGE queue for possible extraction
- **media**: No hooks — controlled via other feature hooks (settings/profile). Adapter exposes controllers directly, which is a boundary concern.
- **moderation**: Heavy adapter layer (9 adapter files). Strong separation. `adapters/hooks/` and `adapters/components/` pattern is correct.
- **monitoring**: Service architecture — split across `services/monitoring/` and `app/monitoring/`. Two distinct subsystems: Sentry adapter (`monitoring.js`) and Quicksilver ingest adapter (`vcsmMonitoring.js`).
- **notifications**: Largest feature in scope (113 nodes). Complex sub-module structure (`inbox/`, `runtime/`, `screen/`, `types/`). `publish.js` is a standalone app-layer adapter.

---

## 5. Architecture Findings

### FINDING-ARCH-001 [SOURCE_VERIFIED] — legal: embedded engine candidate
- File: `apps/VCSM/src/features/legal/engine/legalCompliance.engine.js`
- Issue: Engine-tier logic (`buildConsentComplianceStatus`) embedded inside a feature folder, not in `engines/`
- Severity: INFO
- Route to: CARNAGE (extraction candidate)

### FINDING-ARCH-002 [SOURCE_VERIFIED] — media: adapter exposes controllers directly
- File: `apps/VCSM/src/features/media/adapters/media.adapter.js` line 1-3
- Issue: Adapter exports controller functions (`createMediaAssetController`, `softDeleteMediaAssetController`) — adapter contract only permits hooks, components, view screens
- Severity: MEDIUM
- Note: Callers in `settings/profile/hooks/useProfileUploads.js` import via adapter (correct), but the exposed surface violates adapter boundary rules

### FINDING-ARCH-003 [SOURCE_VERIFIED] — notifications: markSeen missing ownership check
- File: `apps/VCSM/src/features/notifications/runtime/index.js` line 271–275
- Issue: `export async function markSeen({ recipientIds })` — no ownership verification before `markNotificationRecipientsSeenDAL`. Contrast with `markRead`/`dismiss`/`archive` which all call `verifyRecipientOwnership`.
- Severity: HIGH → route to VENOM
- Call chain: External caller → markSeen(recipientIds) → markNotificationRecipientsSeenDAL(recipientIds, now) → UPDATE notification.inbox_items WHERE recipient_id IN (...)

### FINDING-ARCH-004 [SOURCE_VERIFIED] — moderation: undoConversationCover missing app-layer ownership check
- File: `apps/VCSM/src/features/moderation/controllers/undoConversationCover.controller.js` line 8
- Issue: Controller accepts `actorId` + `conversationId` with no ownership verification that `actorId` is the session user or owns the conversation. No `assertModerationAccessController` call. DB RLS on `chat.inbox_entries` provides last-resort enforcement.
- Severity: MEDIUM → route to VENOM

### FINDING-ARCH-005 [SOURCE_VERIFIED] — moderation: moderator actorId mismatch potential
- File: `apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js` line 19–36
- Issue: `isModerationAuthorizedDAL(actorId)` accepts `actorId` but authorization resolves from `auth.uid()`. If the `moderatorActorId` passed to `hideReportedObjectController` differs from the session actor, writes credit the wrong actor. Authorization passes (auth.uid() check), but the write audit trail (`hidden_by_actor_id`, `actor_id` in moderation.actions) reflects the passed-in `actorId`, not the verified session actor.
- Severity: MEDIUM → route to VENOM

### FINDING-ARCH-006 [SCANNER_LEAD] — all 5 features: security paths have access=unknown
- Scanner signal: security-path-map — all 30 security paths for these features have `access: unknown`
- Issue: Scanner could not classify route access type for any security path in these features. Moderation and notifications have no named routes — they're accessed via components embedded in other routes.
- Severity: INFO → route to HAWKEYE for route access classification

### FINDING-ARCH-007 [SOURCE_VERIFIED] — DB: platform.user_consents RLS is OFF
- Source: db-policy-map.json + supabase/migrations/20260510030000_user_consents_immutability_and_grant.sql
- Issue: RLS is NOT enabled on `platform.user_consents`. The migration creates RESTRICTIVE UPDATE/DELETE policies — but these are inert when RLS is disabled. Any authenticated user can INSERT consent for any `user_id`.
- Severity: HIGH → DB AUDIT NOTE (deferred to DB phase)
- Note: No `ALTER TABLE platform.user_consents ENABLE ROW LEVEL SECURITY` found in any migration

### FINDING-ARCH-008 [SOURCE_VERIFIED] — DB: vc.posts RLS is OFF
- Source: db-policy-map.json
- Issue: RLS is NOT enabled on `vc.posts`. `hidePostRow` in `reports.dal.js` performs an UPDATE on this table. The only protection is `assertModerationAccessController` at the app layer (which resolves from `auth.uid()`). No DB-level policy enforcement.
- Severity: HIGH → DB AUDIT NOTE (deferred to DB phase)

### FINDING-ARCH-009 [SOURCE_VERIFIED] — DB: platform.media_assets PUBLIC role UPDATE policy
- Source: `apps/VCSM/src/features/media/dal/mediaAssets.softDelete.dal.js` line 28–31
- Issue: DAL comments confirm `media_assets_vc_owner_update` ({public} role, unrestricted column UPDATE) coexists with the actor-ownership soft-delete policy. Phase 6 cleanup not yet applied.
- Severity: MEDIUM → DB AUDIT NOTE (deferred to DB phase)

### FINDING-ARCH-010 [SOURCE_VERIFIED] — monitoring: Sentry context not sanitized
- File: `apps/VCSM/src/services/monitoring/monitoring.js` line 54
- Issue: `captureMonitoringError(error, context)` passes `context` directly as Sentry extra data via `Sentry.captureException(error, { extra: context })`. No forbidden-key stripping applied. Callers could inadvertently leak actor IDs, tokens, or PII to Sentry.
- Severity: MEDIUM → route to VENOM

---

## 6. Source Verification Summary

| Feature | Files Read | Write Surfaces Spot-Checked | RPCs Verified | Call Chains Traced |
|---|---|---|---|---|
| legal | 4 | 1/1 | 0 | 1 (useLegalConsent → dalRecordLegalAcceptance) |
| media | 5 | 2/2 | 0 | 1 (useProfileUploads → createMediaAssetController → insertMediaAssetDAL) |
| moderation | 7 | 5/12 | 1/1 | 3 (useReportFlow, useConversationCover, moderationActions.controller) |
| monitoring | 3 | 0 | 0 | 1 (captureVcsmError → monitoring-ingest-error edge fn) |
| notifications | 6 | 4/9 | 5/5 | 3 (publish, getInboxNotifications, markRead/dismiss/archive) |

SOURCE_VERIFIED findings: 9
SCANNER_LEAD findings: 1

---

## 7. Confidence Summary

| Feature | Architecture Confidence | Security Surface Confidence |
|---|---|---|
| legal | HIGH | HIGH (1 write, clear chain) |
| media | HIGH | MEDIUM (no INSERT RLS verified; PUBLIC UPDATE policy noted) |
| moderation | HIGH | MEDIUM (RLS gaps on vc.posts; actorId mismatch risk) |
| monitoring | HIGH | MEDIUM (Sentry context sanitization gap) |
| notifications | HIGH | MEDIUM (markSeen ownership gap) |

---

## 8. DB Audit Notes (deferred — for DB phase only)

| # | Table | Risk | Suggested SQL Review |
|---|---|---|---|
| DB-001 | platform.user_consents | RLS OFF — no INSERT policy — any auth user can record consent for any user_id | Add INSERT RLS: `user_id = auth.uid()` OR `user_id IN (SELECT user_id FROM vc.actor_owners WHERE actor_id = auth.uid())` |
| DB-002 | vc.posts | RLS OFF — hidePostRow UPDATE unprotected at DB layer | Enable RLS; add moderator UPDATE policy via moderation.can_manage_domain() |
| DB-003 | platform.media_assets | {public} role UPDATE policy (media_assets_vc_owner_update) allows unrestricted column UPDATE | Phase 6 migration: revoke public UPDATE grant, restrict to actor-ownership policy only |
| DB-004 | notification.inbox_items | RLS status UNKNOWN (not found in db-policy-map) — markNotificationRecipientsSeenDAL bulk-updates without ownership check | Verify RLS enabled; add UPDATE policy: `recipient_id IN (SELECT id FROM notification.recipients WHERE recipient_actor_id = auth.uid())` |
| DB-005 | moderation.reports | RLS status UNKNOWN (not found in db-policy-map) — insertReportRow uses caller-provided reporter_actor_id | Verify RLS enabled; confirm INSERT policy enforces reporter_actor_id = auth.uid() via actor_owners |

---

## 9. Behavior Contract Consistency

| Feature | BEHAVIOR.md | ARCHITECTURE.md | INDEX.md | Status |
|---|---|---|---|---|
| legal | CHECK NEEDED | CHECK NEEDED | CHECK NEEDED | UNKNOWN |
| media | CHECK NEEDED | CHECK NEEDED | CHECK NEEDED | UNKNOWN |
| moderation | CHECK NEEDED | CHECK NEEDED | CHECK NEEDED | UNKNOWN |
| monitoring | N/A (service) | N/A | N/A | N/A |
| notifications | CHECK NEEDED | CHECK NEEDED | CHECK NEEDED | UNKNOWN |

Note: BEHAVIOR.md existence not verified in this pass. Route to WATCHER / LOGAN for documentation drift audit.

---

## 10. Handoff Recommendations

| Target | Scope | Priority |
|---|---|---|
| VENOM | FINDING-ARCH-003 (markSeen), FINDING-ARCH-004 (undoConversationCover), FINDING-ARCH-005 (actorId mismatch), FINDING-ARCH-010 (Sentry context) | HIGH |
| VENOM | FINDING-ARCH-007 (user_consents RLS OFF), FINDING-ARCH-008 (vc.posts RLS OFF) | HIGH — DB AUDIT |
| BLACKWIDOW | All HIGH findings — adversarial exploit chain analysis | HIGH |
| ELEKTRA | FINDING-ARCH-003 full source-to-sink trace; FINDING-ARCH-005 mismatch path | HIGH |
| CARNAGE | FINDING-ARCH-001 (legalCompliance.engine extraction) | LOW |
| HAWKEYE | FINDING-ARCH-006 (route access classification for all 5 features) | MEDIUM |
| LOGAN | Behavior contract docs missing for legal/media/moderation/notifications | MEDIUM |

---

## ARCHITECT Recommendation: CAUTION

Multiple HIGH-severity DB-layer gaps (RLS OFF on user_consents and vc.posts) plus
a source-verified app-layer ownership gap (markSeen) require VENOM → BLACKWIDOW → ELEKTRA
passes before this batch is release-eligible.

**Release authority: THOR only.**
