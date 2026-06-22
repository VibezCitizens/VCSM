# Security Patch Plan — Batch 16–20 Extension
# legal / media / moderation / monitoring / notifications

**Date:** 2026-06-07
**Source:** ARCHITECT → VENOM → BLACKWIDOW → ELEKTRA pipeline (features 16–20)
**Prior Plan:** 2026-06-07_security-patch-plan.md (booking/notifications/Traffic/vport waves 1–8)
**Scope:** App-layer only. DB phase is separate. THOR runs in a fresh session.

---

## Execution Order (this batch — appends to prior plan)

```
TICKET-LEGAL-PATCH-001    (Wave 9  — HIGH legal patches)
TICKET-MODERATION-PATCH-001  (Wave 10 — MEDIUM moderation patches)
TICKET-MONITORING-PATCH-001  (Wave 11 — MEDIUM monitoring patch)
TICKET-MEDIA-PATCH-001    (Wave 12 — LOW media adapter patch)
DB PHASE ADDITIONS        (deferred — extends prior DB phase)
```

---

## TICKET-LEGAL-PATCH-001

**Priority:** P0–P1
**App:** VCSM
**Type:** SEC
**Upstream:** ELEK-2026-06-06-001 through 007; VEN-LEGAL-001 (DB deferred)

---

### Wave 9A — HIGH: Open Redirect + Tabnapping (Link target="_blank")
**Findings:** ELEK-2026-06-06-002 / BW-LEGAL-002 / BW-LEGAL-007

**Files to read first:**
- `apps/VCSM/src/features/legal/components/ConsentGateScreen.jsx` (all Link elements)
- `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js:getDocRoute()` (content_url handling)

**Issue A — target="_blank" without rel:** All Link elements in the consent screen use
`target="_blank"` without `rel="noopener noreferrer"` — tabnapping precondition.

**Fix A:** Add `rel="noopener noreferrer"` to every `target="_blank"` Link in ConsentGateScreen.

**Issue B — DB-controlled content_url unvalidated:** `getDocRoute()` returns `doc.content_url`
directly and it flows into a Link `to=` prop. A compromised DB row can redirect to any URL.

**Fix B:** Validate content_url in `getDocRoute()` before returning:
```js
function getDocRoute(doc) {
  const url = doc?.content_url
  if (!url) return null
  // Only allow relative paths or known safe domains
  if (url.startsWith('/') || url.startsWith('https://vibezcitizens.com')) return url
  return null // reject external or unknown URLs
}
```
Adjust the allowed domain to match production. Add a fallback route for null case in the component.

---

### Wave 9B — HIGH: Consent Record Flooding DoS
**Finding:** ELEK-2026-06-06-003 / BW-LEGAL-009

**File:** `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js`

**Issue:** `resolveLegalGateForSession` queries user's consents with `.limit(20)` and no type-scope filter.
An attacker can flood `platform.user_consents` with fake `consent_type` rows, pushing real required
consent types past the 20-row limit → victim permanently blocked at consent gate.

**Fix (app-layer only — DB patch is the real fix but this adds defense):**
1. In the consent query, add a `.in('consent_type', KNOWN_CONSENT_TYPES)` filter
   to ignore unrecognized types — attacker-injected rows don't count toward the limit.
2. KNOWN_CONSENT_TYPES should be a constant in the controller (or model):
```js
const KNOWN_CONSENT_TYPES = ['terms_of_service', 'privacy_policy', 'community_guidelines', 'age_verification']
```
Read the actual type values from the existing codebase before hardcoding.

**Pre-read required:** Read `legalConsent.controller.js` full `resolveLegalGateForSession` function.

---

### Wave 9C — MEDIUM: Consent + Legal Docs Cache Not Invalidated on Logout
**Finding:** ELEK-2026-06-06-004 / BW-LEGAL-005 / VEN-LEGAL-005

**File:** `apps/VCSM/src/features/legal/controllers/legalConsent.controller.js`

**Issue:** `legalDocsCache` (60s TTL) and `consentCache` (90s TTL) are never cleared on logout.
If a user's consent is revoked or a new legal doc version is published, the old cached gate state
persists for up to 90 seconds.

**Fix:** Export `invalidateLegalDocsCache()` and `invalidateConsentCache(userId)` (they already exist
but are not called on logout). Wire to the auth logout event:

Read the auth controller/hook that handles logout and call both invalidations there.
```js
// In auth logout handler:
invalidateLegalDocsCache()
invalidateConsentCache(userId)
```

**Pre-read required:** Read the auth feature's logout controller/hook to find the right injection point.

---

### Wave 9D — MEDIUM: Duplicate Consent Rows (No ON CONFLICT guard)
**Finding:** ELEK-2026-06-06-005 / BW-LEGAL-003

**File:** `apps/VCSM/src/features/legal/dal/userConsents.write.dal.js`

**Issue:** `dalRecordLegalAcceptance` uses INSERT without `.onConflict()`. Concurrent API calls
(or retry on double-click) produce duplicate consent rows for the same user+document+version.

**Fix:** Add `.onConflict('user_id, legal_document_id, consent_version').ignoreDuplicates()` or
`.upsert()` with conflict target. Read the actual column names before applying:
```js
const { data, error } = await supabase
  .schema('platform')
  .from('user_consents')
  .insert(row)
  .onConflict('user_id, legal_document_id, consent_version')
  .ignoreDuplicates()
  .select()
  .maybeSingle()
```

**Pre-read required:** Read `userConsents.write.dal.js` (already read in pipeline — confirm exact column names).

---

## TICKET-MODERATION-PATCH-001

**Priority:** P1–P2
**App:** VCSM
**Type:** SEC
**Upstream:** VEN-MODERATION-009/010, BW-MOD-004/006/007, VEN-MODERATION-006/008

---

### Wave 10A — MEDIUM: undoConversationCover No Ownership Check
**Finding:** VENOM-004 / VEN-MODERATION-009 / BW-SIM-MODERATION-002

**File:** `apps/VCSM/src/features/moderation/controllers/undoConversationCover.controller.js`

**Issue:** `undoConversationCover({ actorId, conversationId })` takes actorId from caller with no
session verification. The hook (`useConversationCover`) also takes actorId as a prop (not from useIdentity).
DB RLS on `chat.inbox_entries` (chat_inbox_update_own) partially mitigates — but app layer has zero guard.

**Fix — two parts:**

Part A: Add session verification to the controller:
```js
import { getCurrentAuthUserDAL } from '@/features/auth/dal/getCurrentAuthUser.dal'

export async function undoConversationCover({ actorId, conversationId } = {}) {
  if (!actorId || !conversationId) throw new Error('undoConversationCover: actorId and conversationId required')

  // Verify actorId is owned by session user
  const user = await getCurrentAuthUserDAL()
  if (!user) throw new Error('undoConversationCover: not authenticated')
  // (ownership cross-check: actorId must be owned by user — read actor_owners or pass through)
  // Minimal: if actorId is always the user's own actor, bind it from session instead of accepting param
  // ...existing logic...
}
```

Part B: In `useConversationCover.js`, derive actorId from `useIdentity()` instead of accepting it as prop:
```js
const { actorId } = useIdentity() ?? {}
// Remove actorId from hook params
```

**Pre-read required:** Read both files fully before patching. Confirm `getCurrentAuthUserDAL` import path.

---

### Wave 10B — MEDIUM: moderatorActorId Audit Trail Mismatch
**Finding:** VENOM-005 / VEN-MODERATION-010 / BW-SIM-MODERATION-001 (upgrade of BW-MOD-007)

**File:** `apps/VCSM/src/features/moderation/controllers/moderationActions.controller.js`

**Issue:** `assertModerationAccessController(actorId)` confirms the session actor is a moderator
(using `auth.uid()` server-side — ignoring the actorId param). But `insertModerationActionRow`
and `updateReportRowStatus` use the passed `moderatorActorId` — which can differ from the session actor.
A moderator can attribute moderation actions to a different actor's UUID.

**Fix:** After `assertModerationAccessController`, derive the actual session actor ID and verify
it matches `moderatorActorId`, OR replace `moderatorActorId` with the session-derived actor:
```js
// In hideReportedObjectController / dismissReportController:
await assertModerationAccessController(moderatorActorId)

// Additionally: verify moderatorActorId == session actor
// (derive session actor from the same path isModerationAuthorizedDAL uses internally)
// Option: add a return value to assertModerationAccessController that includes the resolved actorId
// then use that for all writes instead of the passed param
```

**Pre-read required:** Read `assertModerationAccess.controller.js` + `assertModerationAccess.dal.js` fully.
Design decision: does `isModerationAuthorizedDAL` return the resolved actorId? If not, add it.

---

### Wave 10C — MEDIUM: reasonCode Not Validated Against Allowlist
**Finding:** BW-MOD-004

**File:** `apps/VCSM/src/features/moderation/controllers/report.controller.js`

**Issue:** `reasonCode` flows from the hook to `insertReportRow` with no allowlist check.
Arbitrary strings can be written to `moderation.reports.reason_code`.

**Fix:** Add allowlist validation before `insertReportRow`:
```js
const REPORT_REASONS = new Set(['spam', 'harassment', 'inappropriate', 'hate_speech', 'violence', 'other'])

if (reasonCode && !REPORT_REASONS.has(reasonCode)) {
  throw new Error(`createReportController: invalid reasonCode "${reasonCode}"`)
}
```

Read the actual REPORT_REASONS values from the existing model or UI before hardcoding.

---

### Wave 10D — LOW: Remove Ungated console.warn in Report Controller
**Finding:** VEN-MODERATION-006

**File:** `apps/VCSM/src/features/moderation/controllers/report.controller.js:113`

**Fix:** Wrap in `if (import.meta.env.DEV)` guard or remove the console.warn entirely.

---

### Wave 10E — LOW: TOCTOU Hardening on dalDeleteConversationHideAction
**Finding:** VEN-MODERATION-008

**File:** Wherever `dalDeleteConversationHideAction` is defined.

**Fix:** Add `.eq('actor_id', actorId)` to the final DELETE query as defense-in-depth.
Read the file before applying.

---

## TICKET-MONITORING-PATCH-001

**Priority:** P1
**App:** VCSM
**Type:** SEC
**Upstream:** VEN-MONITORING-001 / BW-MONITORING-001 / ELEK-2026-06-07-MONITORING-001

---

### Wave 11 — MEDIUM: captureMonitoringError PII Leak to Sentry
**Finding:** VEN-MONITORING-001 / BW-MONITORING-001 / ELEK-2026-06-07-MONITORING-001

**Confirmed live caller:** `useOwnerQuickStats.js:15` passes `actorId` + `callerActorId` to Sentry.

**Files to patch:**
1. `apps/VCSM/src/services/monitoring/monitoring.js`
2. `apps/VCSM/src/features/vportDashboard/hooks/useOwnerQuickStats.js`

**Option A (minimal fix — sanitize captureMonitoringError):**
```js
// monitoring.js — add before captureMonitoringError:
const _SENTRY_FORBIDDEN = new Set([
  'userId','user_id','actorId','actor_id','email','token','callerActorId',
  'sessionId','session_id','authToken','auth_token','accessToken','access_token',
])

function _stripForbiddenSentry(obj) {
  if (!obj || typeof obj !== 'object') return {}
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !_SENTRY_FORBIDDEN.has(k)))
}

export function captureMonitoringError(error, context) {
  if (!import.meta.env.VITE_SENTRY_DSN) return
  Sentry.captureException(error, { extra: _stripForbiddenSentry(context) })
}
```

**Option B (preferred — route caller to captureVcsmError):**
Update `useOwnerQuickStats.js` to use `captureVcsmError` instead:
```js
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring'
// ...
.catch((err) => captureVcsmError({ error: err, context: { feature: 'vportDashboard.useOwnerQuickStats' } }))
```

**Recommendation:** Do BOTH. Apply Option A as a safety net (in case other callers exist),
AND migrate useOwnerQuickStats to Option B (the well-designed monitoring path).

**Pre-read required:** Read `monitoring.js` (already read in pipeline). Grep `captureMonitoringError`
to find all callers — there may be others besides useOwnerQuickStats and RouteErrorBoundary.
Read each caller before deciding Option A vs B per caller.

---

## TICKET-MEDIA-PATCH-001

**Priority:** P3
**App:** VCSM
**Type:** ENG
**Upstream:** VEN-MEDIA-006 / BW-MEDIA-008 / ELEK-2026-06-07-MEDIA-001

---

### Wave 12 — LOW: media.adapter.js — Remove Direct Controller Exports
**Finding:** VEN-MEDIA-006 / BW-MEDIA-008 / ELEK-2026-06-07-MEDIA-001

**File:** `apps/VCSM/src/features/media/adapters/media.adapter.js`

**Issue:** Adapter exports `createMediaAssetController` and `softDeleteMediaAssetController` directly,
violating the adapter boundary contract (adapters must expose only hooks/components/screens).

**Fix:**
1. Remove the controller exports from `media.adapter.js`
2. Create/expose hook wrappers if needed, e.g. `useCreateMediaAsset` or `useDeleteMediaAsset`
   that internally call the controller with session-bound actorId from `useIdentity()`
3. Update any callers of the adapter-exported controllers to use the hook wrappers

**Pre-read required:** Read `media.adapter.js`. Grep `createMediaAssetController` and
`softDeleteMediaAssetController` to find all import sites before removing the exports.

---

## DB PHASE ADDITIONS (Batch 16–20 — Deferred)

These DB items are discovered in this batch. They must NOT be patched during code patch waves.
Owner deploys all DB changes.

**Adds to prior DB PHASE table:**

| DB Audit ID | Object | Risk | Suggested SQL |
|---|---|---|---|
| DB-LEGAL-001 | `platform.user_consents` | RLS OFF — VENOM-002 confirmed SOURCE_VERIFIED; INSERT/UPDATE unprotected | `ALTER TABLE platform.user_consents ENABLE ROW LEVEL SECURITY;` + INSERT WITH CHECK (user_id = auth.uid()) + DELETE DENY policy |
| DB-LEGAL-002 | `platform.user_consents` | No UNIQUE constraint on (user_id, legal_document_id, consent_version) — enables flooding DoS | `ALTER TABLE platform.user_consents ADD CONSTRAINT user_consents_unique_per_version UNIQUE (user_id, legal_document_id, consent_version);` |
| DB-POSTS-001 | `vc.posts` | RLS OFF — VENOM-003 confirmed; 8 inert policies defined but not enabled | `ALTER TABLE vc.posts ENABLE ROW LEVEL SECURITY;` (policies already present — just needs enablement) |
| DB-MEDIA-001 | `platform.media_assets` | {public} role UPDATE policy (`media_assets_vc_owner_update`) unrestricted column UPDATE — Phase 6 pending | Drop or restrict `media_assets_vc_owner_update` policy; verify Phase 6 migration path |
| DB-MODERATION-001 | `moderation.reports` | INSERT RLS UNVERIFIED — reporter_actor_id not bound to auth.uid() | `INSERT WITH CHECK (reporter_actor_id = auth.uid()::text)` or similar |
| DB-MODERATION-002 | `moderation.actions` | INSERT RLS UNVERIFIED — actor_id not bound to session | `INSERT WITH CHECK (actor_id = auth.uid()::text)` |

---

## Full Batch Summary — Priority Order

| Wave | Ticket | Severity | Findings | File(s) |
|---|---|---|---|---|
| 9A | LEGAL | HIGH | ELEK-002, BW-007 | ConsentGateScreen.jsx, legalConsent.controller.js |
| 9B | LEGAL | HIGH | ELEK-003, BW-009 | legalConsent.controller.js |
| 9C | LEGAL | MEDIUM | ELEK-004, BW-005 | legalConsent.controller.js + auth logout hook |
| 9D | LEGAL | MEDIUM | ELEK-005, BW-003 | userConsents.write.dal.js |
| 10A | MODERATION | MEDIUM | VENOM-004, VEN-MOD-009 | undoConversationCover.controller.js + useConversationCover.js |
| 10B | MODERATION | MEDIUM | VENOM-005, VEN-MOD-010 | moderationActions.controller.js |
| 10C | MODERATION | MEDIUM | BW-MOD-004 | report.controller.js |
| 10D | MODERATION | LOW | VEN-MOD-006 | report.controller.js |
| 10E | MODERATION | LOW | VEN-MOD-008 | dalDeleteConversationHideAction |
| 11 | MONITORING | MEDIUM | VEN-MON-001, BW-MON-001, ELEK-MON-001 | monitoring.js + useOwnerQuickStats.js |
| 12 | MEDIA | LOW | VEN-MEDIA-006, BW-MEDIA-008 | media.adapter.js |

Combined with prior plan (booking/notifications/Traffic/vport waves 1–8).

---

## Pre-Patch Checklist (Batch 16–20 additions)

Before starting any wave in this batch:

- [ ] grep `captureMonitoringError` — find ALL callers beyond useOwnerQuickStats + RouteErrorBoundary
- [ ] grep `createMediaAssetController` + `softDeleteMediaAssetController` — find all import sites
- [ ] Read `legalConsent.controller.js` resolveLegalGateForSession — confirm consent_type column name
- [ ] Read auth logout handler — find injection point for cache invalidation (Wave 9C)
- [ ] Read `undoConversationCover.controller.js` + `useConversationCover.js` fully (Wave 10A)
- [ ] Read `assertModerationAccess.dal.js` — confirm return value for actor resolution (Wave 10B)
- [ ] Read `report.controller.js` — confirm REPORT_REASONS constant exists or find source of truth

---

## THOR Gate

THOR runs in a fresh isolated session after ALL waves (1–12) are applied and verified.
THOR is blocked by all open HIGH findings.
THOR requires DB phase results before evaluating DB-dependent findings.
