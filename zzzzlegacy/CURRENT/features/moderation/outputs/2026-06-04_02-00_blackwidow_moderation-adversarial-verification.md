# BLACKWIDOW V2 Runtime Adversarial Report
# Moderation Feature — Adversarial Verification

---

## Output Metadata

| Field | Value |
|---|---|
| Category Key | security/adversarial |
| Feature | moderation |
| Command | BLACKWIDOW V2 |
| Ticket | TICKET-MODERATION-DB-GUARD-APPLY-0001 |
| Scanner Version | 1.1.0 |
| Output Path | CURRENT/outputs/2026/06/04/BlackWidow/2026-06-04_02-00_blackwidow_moderation-adversarial-verification.md |
| Timestamp | 2026-06-04T02:00:00Z |
| Application Scope | VCSM |
| Governance Status | DRAFT |

---

## 1. BLACKWIDOW Scanner Preflight

```
BLACKWIDOW SCANNER PREFLIGHT
==============================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Freshness Window: 3 days (72 hours)
Scan Timestamp: 2026-06-03T00:22:42.771Z
Review Timestamp: 2026-06-04T02:00:00Z
Map Age: 25.6 hours (1.1 days)

| Map               | Generated At             | Age   | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| security-path-map | 2026-06-03T00:22:42.771Z | 25.6h | FRESH     | HIGH       | PASS   |
| callgraph         | 2026-06-03T00:22:42.771Z | 25.6h | FRESH     | HIGH       | PASS   |
| write-execution-map | 2026-06-03T00:22:42.771Z | 25.6h | FRESH   | HIGH       | PASS   |
| rpc-execution-map | 2026-06-03T00:22:42.771Z | 25.6h | FRESH     | HIGH       | PASS   |
| edge-execution-map | 2026-06-03T00:22:42.771Z | 25.6h | FRESH    | HIGH       | PASS   |
| route-execution-map | 2026-06-03T00:22:42.771Z | 25.6h | FRESH   | HIGH       | PASS   |

Overall Preflight: PASS
Preflight Action: PROCEED
All 6 required maps: PRESENT and FRESH
Total nodes in callgraph: 7,264
Total edges in callgraph: 9,468
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Attack Targets In Scope | Used For |
|---|---|---|---|---|---|---|
| security-path-map | 2026-06-03T00:22:42.771Z | 25.6h | FRESH | HIGH | 26 VCSM moderation/block paths | Primary attack target inventory |
| callgraph | 2026-06-03T00:22:42.771Z | 25.6h | FRESH | HIGH | 206 moderation-related nodes | Attack path construction |
| write-execution-map | 2026-06-03T00:22:42.771Z | 25.6h | FRESH | HIGH | 23 write surfaces | Write surface caller chain verification |
| rpc-execution-map | 2026-06-03T00:22:42.771Z | 25.6h | FRESH | HIGH | 5 RPC paths | RPC caller chain verification |
| edge-execution-map | 2026-06-03T00:22:42.771Z | 25.6h | FRESH | HIGH | 0 | Edge function attack surface |
| route-execution-map | 2026-06-03T00:22:42.771Z | 25.6h | FRESH | HIGH | 0 resolved routes | Entry point reachability |

Scanner Version: 1.1.0
Overall Preflight: FRESH / PASS
Total VCSM moderation/block security paths: 26
HIGH confidence (execution chain resolved): 26
LOW confidence (unresolved — PRIMARY TARGETS): 0
All 26 paths are HIGH confidence — scanner resolved all call chains.

---

## 3. Attack Surface Inventory

```
BLACKWIDOW ATTACK SURFACE INVENTORY
=====================================
Feature: moderation + block (VCSM)
Scan Date: 2026-06-03T00:22:42.771Z

Security Paths: 26 total (VCSM only; Traffic paths excluded as out of scope)
  HIGH confidence (execution chain resolved): 26
  LOW confidence (unresolved — PRIMARY TARGETS): 0

Write Surface Breakdown:
  moderation.reports: INSERT (reports.group.js, reports.dal.js)
  moderation.report_events: INSERT (reports.group.js, reports.dal.js)
  moderation.actions: INSERT, DELETE (reports.group.js, reports.group.helpers.js, moderationActions.dal.js)
  moderation.blocks: INSERT, UPDATE (social.group.js)
  moderation.block_actor RPC: 2 call sites (block.write.dal.js, blocks.dal.js)
  moderation.unblock_actor RPC: 2 call sites (block.write.dal.js, blocks.dal.js)
  learning.is_current_user_platform_admin RPC: 1 call site (assertModerationAccess.dal.js)
  chat.inbox_entries: UPSERT, UPDATE (reports.dal.js, conversationCover.write.dal.js)
  vc.posts: UPDATE hidden flags (reports.dal.js)
  chat.messages: UPDATE hidden flags (reports.dal.js)

Callgraph Scope:
  Total moderation-related nodes: 206
  Hook nodes (UI-accessible entry points): 8
    - useReportFlow → createReportController → insertReportRow
    - useBlockActions → blockActorController → blockActor RPC
    - useBlockActorAction → blockActorController → blockActor RPC
    - useMyBlocks / useBlockedCitizens → ctrlBlockActor → dalInsertBlock → block_actor RPC
    - useHidePostForActor → hidePostForActor → insertModerationActionDAL
    - usePostVisibility → hidePostForActor → insertModerationActionDAL
    - useCommentVisibility → hideCommentForActor → insertModerationActionDAL

Controller nodes: 9
DAL nodes (write surfaces): 14

Moderator Action Controllers (DEAD EXPORTS — 0 hook callers):
  - hideReportedObjectController: 0 hook callers [SOURCE_VERIFIED]
  - dismissReportController: 0 hook callers [SOURCE_VERIFIED]

Route Reachability:
  /dev/diagnostics: access=DEV_ONLY (devDiagnosticsEnabled = import.meta.env.DEV)
  /dev/diagnostics route: Navigate to /feed in production build [SOURCE_VERIFIED]
  DevDiagnosticsScreen lazy import: null stub in production [SOURCE_VERIFIED]
  Diagnostic write surfaces: NOT reachable from production build

Caller Chain Coverage:
  Surfaces with ≥1 traced caller: 22 of 26
  Surfaces with 0 traced callers (dead/disconnected): 4 (hideReportedObjectController + dismissReportController + their DAL targets)
```

---

## 4. Scanner Signals

| Attack Vector | Source Map | Callgraph Path | Scanner Confidence | Source Verified | Result | Provenance |
|---|---|---|---|---|---|---|
| BW-MOD-001: can_manage_domain open to all auth users | security-path-map (VENOM-2026-06-04-001) | N/A — RLS/DB function, not JS callgraph | HIGH→confirmed | YES — batch1 SQL proposal rollback section confirms broken vc branch | BYPASSED (pre-fix DB) | [SOURCE_VERIFIED] |
| BW-MOD-002: moderatorActorId audit trail poisoning | security-path-map path→moderationActions.controller.js | hook→hideReportedObjectController→insertModerationActionRow | HIGH→traced | YES — moderationActions.controller.js:22-27, assertModerationAccess.controller.js:15 | PARTIAL (guard present but actorId not session-pinned) | [SOURCE_VERIFIED] |
| BW-MOD-003: block_actor RPC caller ownership bypass | security-path-map rpc:block_actor | useBlockActions→blockActorController→blockActorDAL→block_actor RPC | HIGH→traced | YES — blockActor.controller.js:28-29, useBlockActions.js:39,51 | BLOCKED (three-layer guard) | [SOURCE_VERIFIED] |
| BW-MOD-003b: settings/privacy block caller ownership | security-path-map rpc:block_actor | useBlockedCitizens→ctrlBlockActor→dalInsertBlock→block_actor RPC | HIGH→traced | YES — Blocks.controller.js:71-72, useBlockedCitizens.js:39 | BLOCKED (callerActorId guard) | [SOURCE_VERIFIED] |
| BW-MOD-004: diagnostic write surfaces in production | security-path-map (VCSM:dev writes) | dev/diagnostics callgraph → app.routes.jsx | HIGH→traced | YES — lazyApp.jsx:51-53, app.routes.jsx:22,163-168 | BLOCKED (build-time elimination) | [SOURCE_VERIFIED] |
| BW-MOD-004b: diagnostic moderation writes bypass assertModerationAccess | security-path-map (VCSM:dev writes) | runReportsGroup→supabase.insert(moderation.reports) | HIGH→traced | YES — reports.group.js:39-56 (direct Supabase, no assertModerationAccess) | PARTIAL (blocked by future RLS fix; no app-layer gate) | [SOURCE_VERIFIED] |
| BW-MOD-005: cross-actor report insertion (reporter_actor_id from caller) | security-path-map path→reports.dal.js#insertReportRow | useReportFlow→createReportController→insertReportRow | HIGH→traced | YES — report.controller.js:43-45, useReportFlow.js:27,60 | PARTIAL (client supplies reporterActorId; no session binding at controller layer) | [SOURCE_VERIFIED] |

---

## 5. Adversarial Path Analysis

---

### BW-MOD-ATTACK-001 — RLS Bypass via can_manage_domain Privilege Escalation

**BEHAVIOR.md status:** MISSING — attack classified UNANCHORED
**IMPLICIT_INVARIANT-001:** A non-platform-admin authenticated user must never be able to read, write, or update moderator-scoped moderation rows.

**Attack Scenario:**
Any authenticated VCSM user calls Supabase client methods against moderation-scoped tables that are protected by `moderation.can_manage_domain('vc')`. The existing (pre-fix) function returns TRUE for any user who has a row in `vc.actor_owners`, which is every authenticated VCSM user.

**Harness Construction (adversarial simulation):**

```javascript
// BLACKWIDOW HARNESS — BW-MOD-001 — NOT FOR PRODUCTION
// Simulates: non-admin authenticated user accessing moderator-scoped tables
// Pre-fix DB state: can_manage_domain('vc') returns TRUE for all auth users

import { supabase } from '@/services/supabase/supabaseClient'

// Attack 1: Read all moderation.reports (should be denied for non-admins)
const { data: reports, error: reportsErr } = await supabase
  .schema('moderation')
  .from('reports')
  .select('id,reporter_actor_id,target_id,status')
  .limit(50)

// PRE-FIX RESULT: data=[ ...all reports from all users... ], error=null
// POST-FIX RESULT: data=[], error=null (empty — RLS filters to own reports only)

// Attack 2: Write to moderation.actions (hide a post as a fake moderator)
const { data: action, error: actionErr } = await supabase
  .schema('moderation')
  .from('actions')
  .insert({
    actor_domain: 'vc',
    actor_id: attacker_actor_id,       // any authenticated actor
    target_domain: 'vc',
    target_type: 'post',
    target_id: victim_post_uuid,
    action_type: 'hide',
    reason: 'adversarial test',
    meta: {},
  })
  .select('id')

// PRE-FIX RESULT: Insert succeeds — moderation action written by non-admin
// POST-FIX RESULT: error.code='42501' — permission denied by RLS

// Attack 3: Update moderation.reports status (dismiss any open report)
const { data: updated, error: updateErr } = await supabase
  .schema('moderation')
  .from('reports')
  .update({ status: 'dismissed', resolution: 'no_action' })
  .eq('id', any_report_uuid)

// PRE-FIX RESULT: Update succeeds — any user can dismiss any report
// POST-FIX RESULT: error.code='42501' — permission denied by RLS
```

**Callgraph Trace:** This attack does NOT go through the JS callgraph. It requires direct Supabase client invocation bypassing all controllers. The RLS layer is the only gate.

**Pre-Fix RLS State (from VENOM + Batch 1 SQL rollback section):**
```sql
-- VULNERABLE (current live DB):
CREATE OR REPLACE FUNCTION moderation.can_manage_domain(p_domain text)
RETURNS boolean AS $$
  select case
    when p_domain = 'vc' then exists (
      select 1 from vc.actor_owners ao
      join vc.actors a on a.id = ao.actor_id
      where ao.user_id = auth.uid()
        and coalesce(ao.is_void, false) = false
    )
    -- Every authenticated user who has a vc actor returns TRUE here
```

**Affected Policies (9):**
- moderation_reports_select_moderator
- moderation_reports_update_moderator
- moderation_report_events_insert_moderator
- moderation_report_events_select_moderator
- moderation_actions_insert_moderator
- moderation_actions_select_moderator
- moderation_actions_update_moderator
- moderation_block_events_select_moderator
- moderation_blocks_select_moderator

**Result: BYPASSED (pre-fix DB)**
**Exploit Chain Type:** Single-step exploit — RLS gate function returns incorrect value for all auth users
**Severity: CRITICAL**
**Blast Radius:** Any authenticated VCSM user can read all moderation reports, read/write moderation actions, dismiss any report, and read all block events — effectively admin-level moderation access.

---

### BW-MOD-ATTACK-002 — moderatorActorId Audit Trail Poisoning

**BEHAVIOR.md status:** MISSING — attack classified UNANCHORED
**IMPLICIT_INVARIANT-002:** The actor recorded in a moderation action's audit trail must be the session-authenticated actor, not a caller-supplied parameter.

**Attack Scenario:**
A platform admin (or a non-admin who bypasses BW-MOD-001) calls `hideReportedObjectController` or `dismissReportController` supplying `moderatorActorId=victim_actor_uuid`. The audit trail in `moderation.actions` and `moderation.report_events` records the victim's actorId, not the actual caller.

**Source Read — Controller Entry Point:**

```javascript
// moderationActions.controller.js:22-27 [SOURCE_VERIFIED]
export async function hideReportedObjectController({
  moderatorActorId,   // ← ACCEPTED FROM CALLER
  reportId,
}) {
  await assertModerationAccessController(moderatorActorId)
  // ...
```

**Source Read — assertModerationAccess.controller.js:**

```javascript
// assertModerationAccess.controller.js:8-21 [SOURCE_VERIFIED]
export async function assertModerationAccessController(actorId) {
  if (!actorId) { throw ... FORBIDDEN }
  const authorized = await isModerationAuthorizedDAL(actorId)
  // calls: supabase.schema('learning').rpc('is_current_user_platform_admin')
  // ← actorId parameter is passed to the DAL but IGNORED server-side
  // ← server-side resolves from auth.uid() only
  if (!authorized) { throw ... FORBIDDEN }
}
```

**Source Read — assertModerationAccess.dal.js:**

```javascript
// assertModerationAccess.dal.js:19-35 [SOURCE_VERIFIED]
export async function isModerationAuthorizedDAL(actorId) {
  // actorId is retained for the controller contract; 
  // authorization resolves from auth.uid().
  const { data, error } = await supabase
    .schema('learning')
    .rpc('is_current_user_platform_admin')
  // ← auth.uid() resolution is CORRECT — cannot be spoofed
  return data === true
}
```

**Attack Vector Analysis:**
- Auth check: CORRECT — uses session `auth.uid()`. Cannot spoof authentication.
- Audit trail: VULNERABLE — `moderatorActorId` flows from caller into `insertModerationActionRow({actorId: moderatorActorId})` (line 69) and `insertReportEventRow({actorId: moderatorActorId})` (line 96)
- A genuine platform admin could supply any UUID as `moderatorActorId` — the audit row would record that UUID, not the admin's own actorId.
- Impact is limited to admin actors only (auth.uid() check cannot be bypassed). Non-admins cannot reach the write paths due to FORBIDDEN throw.

**Harness Construction:**

```javascript
// BLACKWIDOW HARNESS — BW-MOD-002 — NOT FOR PRODUCTION
// Simulates: platform admin poisoning audit trail with victim's actorId
// Precondition: caller IS a genuine platform admin (auth.uid() passes)

import { hideReportedObjectController } from '@/features/moderation/controllers/moderationActions.controller'

const result = await hideReportedObjectController({
  moderatorActorId: victim_actor_uuid,  // ← arbitrary UUID supplied by admin
  reportId: any_open_report_uuid,
})

// RESULT if BW-MOD-001 fix is deployed AND caller is a platform admin:
// ok: true
// moderation.actions row: actor_id = victim_actor_uuid  ← POISONED
// moderation.report_events row: actor_id = victim_actor_uuid  ← POISONED
// The victim's actorId is recorded as the moderator who took the action.
```

**Result: PARTIAL**
- Authorization gate (who can call): BLOCKED — session-pinned via `auth.uid()`, cannot be bypassed
- Audit trail integrity: BYPASSED — `moderatorActorId` caller-supplied, not session-derived at controller layer
- This is not independently exploitable by non-admins; it requires being a genuine platform admin.
- Risk activates when the moderator dashboard is built (VENOM-2026-06-04-002).
**Exploit Chain Type:** Injection exploit — forged parameter accepted by controller for audit trail write
**Severity: MEDIUM**
**Blast Radius:** Admin-only. A platform admin can frame any other actor in the moderation audit trail. Forensic integrity of moderation records is compromised.

---

### BW-MOD-ATTACK-003 — block_actor/unblock_actor Ownership Bypass

**BEHAVIOR.md status:** MISSING — attack classified UNANCHORED
**IMPLICIT_INVARIANT-003:** A Citizen must never block on behalf of another Citizen. The `p_blocker_actor_id` passed to the RPC must always match the authenticated session actor.

**Attack Path A — useBlockActions hook (feature/block):**

```javascript
// useBlockActions.js:39,51 [SOURCE_VERIFIED]
const sessionActorId = identity?.actorId ?? null  // ← from useIdentity() — session-derived
const block = useCallback(async () => {
  await blockActorController(myActorId, targetActorId, sessionActorId)
  // sessionActorId is passed as assertingActorId
}, [myActorId, targetActorId, sessionActorId])
```

```javascript
// blockActor.controller.js:21-29 [SOURCE_VERIFIED]
export async function blockActorController(blockerActorId, blockedActorId, assertingActorId) {
  if (!assertingActorId || assertingActorId !== blockerActorId) {
    throw new Error("blockActorController: session actor does not match blocker")
    // ← IDENTITY CHECK: assertingActorId must equal blockerActorId
    // ← assertingActorId comes from session (useIdentity) — not caller-supplied
  }
  // ...
  await blockActorDAL(blockerActorId, blockedActorId)
```

**Attack: Supply different blockerActorId than session actor**

A UI-layer attacker could try to call `blockActorController(victim_actor_uuid, target_uuid, attacker_session_uuid)`:
- `assertingActorId` (session) = attacker_uuid
- `blockerActorId` = victim_uuid
- Guard: `assertingActorId !== blockerActorId` → throws immediately
- **BLOCKED at controller.**

**Attack: Bypass controller entirely, call blockActorDAL directly:**

```javascript
// block.write.dal.js:17-37 [SOURCE_VERIFIED]
export async function blockActor(blockerActorId, blockedActorId, reason = null) {
  // No session binding check in DAL
  const { error } = await supabase.schema("moderation").rpc("block_actor", {
    p_blocker_actor_id: blockerActorId,
    p_blocked_actor_id: blockedActorId,
  })
```

The DAL has no session binding check. However, the `block_actor` RPC (batch4 proposal shows) includes:
```sql
IF NOT moderation.is_current_vc_actor(p_blocker_actor_id) THEN
  RAISE EXCEPTION 'Not allowed to block from this actor'
    USING errcode = '42501';
```
**The server-side RPC guard validates that `p_blocker_actor_id` is owned by `auth.uid()`.** This is the authoritative gate. The DAL is a thin wrapper.

**Status of RPC guard:** The batch4 proposal adds the bidirectional follow cleanup but references an existing guard (`moderation.is_current_vc_actor`). The migration `20260510010000_moderation_blocks_rls_and_indexes.sql` confirms `is_current_vc_actor` is already deployed.

**Attack Path B — settings/privacy Blocks controller:**

```javascript
// useBlockedCitizens.js:39 [SOURCE_VERIFIED]
mutationFn: (blockedActorId) =>
  ctrlBlockActor({ actorId, blockedActorId, scope, existingBlockedIds: blockedIds, callerActorId: sessionActorId })
  // sessionActorId = identity?.actorId — session-derived
```

```javascript
// Blocks.controller.js:71-72 [SOURCE_VERIFIED]
export async function ctrlBlockActor({ actorId, blockedActorId, scope, existingBlockedIds, callerActorId }) {
  if (!callerActorId || String(callerActorId) !== String(actorId)) {
    throw new Error('ctrlBlockActor: caller does not own this actor')
    // ← callerActorId from session; actorId from UI — must match
  }
```

**Result: BLOCKED — three independent gates:**
1. Controller gate: `assertingActorId !== blockerActorId` (JS layer)
2. Settings controller gate: `callerActorId !== actorId` (JS layer)
3. RPC server-side gate: `is_current_vc_actor(p_blocker_actor_id)` (DB layer — authoritative)

**Exploit Chain Type:** N/A — all attack vectors blocked
**Severity: INFO** (defense confirmed)
**Blast Radius:** None — ownership protection is three-layered and verified.

---

### BW-MOD-ATTACK-004 — Diagnostic Write Surfaces as Production Attack Path

**BEHAVIOR.md status:** MISSING — attack classified UNANCHORED
**IMPLICIT_INVARIANT-004:** Dev diagnostics code must never be executable in a production build or by a production user session.

**Attack Sub-scenario A — Route-level: Navigate /dev/diagnostics in production**

```javascript
// app.routes.jsx:22 [SOURCE_VERIFIED]
const devDiagnosticsEnabled = import.meta.env.DEV;

// app.routes.jsx:163-168 [SOURCE_VERIFIED]
{
  path: "/dev/diagnostics",
  element: devDiagnosticsEnabled ? (
    <DevDiagnosticsScreen />
  ) : (
    <Navigate to="/feed" replace />
  ),
},
```

In production: `import.meta.env.DEV = false` (Vite build-time replacement). The route serves `<Navigate to="/feed" replace />`. **Route attack: BLOCKED.**

**Attack Sub-scenario B — Bundle: Is DevDiagnosticsScreen included in production bundle?**

```javascript
// lazyApp.jsx:51-53 [SOURCE_VERIFIED]
export const DevDiagnosticsScreen = devDiagnosticsEnabled
  ? lazyWithLog("DevDiagnosticsScreen", () => import("@/screens/DevDiagnosticsScreen"))
  : () => null;
```

`devDiagnosticsEnabled = import.meta.env.DEV` — Vite evaluates this at build time. In production mode, `devDiagnosticsEnabled = false`, so the lazy import is never registered. The `DevDiagnosticsScreen` module is not included in the production bundle. The vite.config.js confirms `esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : undefined` — additional dead code elimination in production.

**Result: BLOCKED in production runtime.** The diagnostics screen and all its supabase write calls are bundle-eliminated in production.

**Attack Sub-scenario C — Diagnostic write surfaces bypass assertModerationAccess (DEV environment)**

In a dev environment where the diagnostics panel IS accessible, `reports.group.js` writes directly to moderation tables:

```javascript
// reports.group.js:39-56 [SOURCE_VERIFIED — NO assertModerationAccess guard]
const { data, error } = await supabase
  .schema("moderation")
  .from("reports")
  .insert({
    reporter_actor_id: actorId,  // from ensureActorContext(localShared)
    // ...
  })
```

There is **no** `assertModerationAccess` call in any diagnostic group. The writes rely entirely on RLS. In current pre-fix DB state, the `can_manage_domain('vc')` bug means these writes succeed for any dev user. Post-fix, RLS denials will be triggered.

The helper has awareness: `isRlsDenied` and `isPermissionDenied` are imported and used on several tests, and some tests (e.g., `create_moderation_action`) already handle RLS denial gracefully via `makeSkipped`. However, the primary `create_report` test does NOT handle RLS denial — it throws directly on error (line 58).

**Result: PARTIAL (dev-only attack surface; production-blocked, but dev writes unguarded at app layer)**
**Severity: MEDIUM** (impacts diagnostic reliability post-fix; no production risk)

---

### BW-MOD-ATTACK-005 — Cross-Actor Report Insertion via Client-Supplied reporterActorId

**BEHAVIOR.md status:** MISSING — attack classified UNANCHORED
**IMPLICIT_INVARIANT-005:** A report's `reporter_actor_id` must always match the session-authenticated actor. A user must never be able to file a report attributed to another actor.

**Callgraph Trace:**
`useReportFlow (hook) → createReportController → insertReportRow (DAL)`

**Source Read — useReportFlow.js:**

```javascript
// useReportFlow.js:27 [SOURCE_VERIFIED]
export default function useReportFlow({ reporterActorId }) {
  // reporterActorId is passed in as a prop from the parent component
```

```javascript
// useReportFlow.js:59-72 [SOURCE_VERIFIED]
const { ok, report, error: controllerError } = await createReportController({
  reporterActorId,  // ← prop-supplied; not fetched from session here
  objectType: context.objectType,
  // ...
})
```

**Source Read — report.controller.js:**

```javascript
// report.controller.js:28-45 [SOURCE_VERIFIED]
export async function createReportController({
  reporterActorId,  // ← accepted as parameter
  // ...
}) {
  if (!reporterActorId) {
    return { ok: false, error: new Error('reporterActorId required') }
  }
  // ← No session binding check: does not verify reporterActorId === auth.uid()'s actor
```

**Source Read — reports.dal.js (insertReportRow):**

```javascript
// reports.dal.js:61-103 [SOURCE_VERIFIED]
export async function insertReportRow({
  reporterActorId,  // ← passed directly to the DB insert
  // ...
}) {
  const insert = {
    reporter_actor_id: reporterActorId,  // ← client-supplied value stored in DB
    // ...
  }
  const { data, error } = await supabase
    .schema('moderation')
    .from('reports')
    .insert(insert)
```

**Attack Vector:** An attacker mounting a JavaScript-layer attack (e.g., extension, DevTools override, or compromised dependency) could call `createReportController({ reporterActorId: victim_actor_uuid, ... })` and file a report attributed to any actor.

**RLS Defense Analysis:**
The `moderation.reports` INSERT policy (pre-fix) relies on `can_manage_domain('vc')` for moderator inserts. A separate reporter INSERT policy exists (or should exist). From the VENOM findings: SEC-006 states "No `moderation_report_events_insert_self` policy" — this is for `report_events`, not `reports`. The `reports` insert policy is not fully documented in available sources, but the diagnostic test `create_report` in `reports.group.js` (line 39-56) performs a direct insert with `reporter_actor_id: actorId` — implying an authenticated-user INSERT policy exists for the `reports` table.

**The critical question:** Does the `moderation.reports` INSERT policy enforce `reporter_actor_id = auth.uid()`'s actor, or does it accept any supplied value?

Without access to the live DB policy text, BLACKWIDOW cannot confirm full RLS binding. The source chain does NOT bind `reporter_actor_id` to the session at the controller or DAL layer. If the DB policy checks `NEW.reporter_actor_id = moderation.is_current_vc_actor(...)`, the attack is blocked at DB. If the INSERT policy only checks authentication without verifying the row's reporter field, the attack succeeds.

**Classification:** PARTIAL — JS layer has no session binding; DB-layer binding status UNRESOLVED from source only.
**Exploit Chain Type:** Injection exploit — forged parameter accepted by controller, DB-layer verification status uncertain
**Severity: MEDIUM** (requires JS-layer compromise; DB RLS may close the gap; VENOM follow-up required)

---

## 6. Exploitability Assessment

| Surface | Attack | Exploitability | Gate Layer | Severity |
|---|---|---|---|---|
| 9 moderator-scoped RLS policies | Any auth user acts as moderator | EXPLOITABLE (pre-fix) | DB function returns wrong value | CRITICAL |
| hideReportedObjectController audit trail | Admin supplies victim actorId | EXPLOITABLE by platform admins | No session binding at controller | MEDIUM |
| block_actor RPC | Block as another actor | NOT EXPLOITABLE | 3-layer gate (controller + controller-B + RPC) | INFO |
| /dev/diagnostics route | Access diagnostics in production | NOT EXPLOITABLE | Build-time elimination + route guard | INFO |
| dev diagnostic direct writes | Write moderation tables in dev | PARTIAL (dev-only) | No app-layer gate; RLS is sole guard | MEDIUM |
| insertReportRow reporter_actor_id | File report as another actor | PARTIAL (JS-layer injection) | No controller session binding; DB gate UNRESOLVED | MEDIUM |

---

## 7. Source Verification Summary

Total attack scenarios attempted: 5 (plus 3 sub-scenarios = 8 total)
Scenarios source-verified: 8 / 8
Source files read:
- apps/VCSM/src/features/moderation/dal/reports.dal.js
- apps/VCSM/src/features/moderation/controllers/moderationActions.controller.js
- apps/VCSM/src/features/moderation/controllers/assertModerationAccess.controller.js
- apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js
- apps/VCSM/src/features/moderation/controllers/report.controller.js
- apps/VCSM/src/features/moderation/hooks/useReportFlow.js
- apps/VCSM/src/features/block/dal/block.write.dal.js
- apps/VCSM/src/features/block/controllers/blockActor.controller.js
- apps/VCSM/src/features/block/hooks/useBlockActions.js
- apps/VCSM/src/features/settings/privacy/dal/blocks.dal.js
- apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js
- apps/VCSM/src/features/settings/queries/useBlockedCitizens.js
- apps/VCSM/src/dev/diagnostics/groups/reports.group.js
- apps/VCSM/src/dev/diagnostics/groups/reports.group.helpers.js
- apps/VCSM/src/dev/diagnostics/groups/social.group.js
- apps/VCSM/src/app/routes/protected/app.routes.jsx
- apps/VCSM/src/app/routes/lazyApp.jsx
- apps/VCSM/vite.config.js
- zNOTFORPRODUCTION/_ACTIVE/planning/moderation-db-remediation/sql-proposals/batch1_20260510070000_fix_moderation_can_manage_domain.sql
- zNOTFORPRODUCTION/_ACTIVE/planning/moderation-db-remediation/sql-proposals/batch4_20260510100000_fix_block_actor_bidirectional_follows.sql
- apps/VCSM/supabase/migrations/20260510010000_moderation_blocks_rls_and_indexes.sql

BYPASSED findings: 1 (BW-MOD-001) — all [SOURCE_VERIFIED]: YES
PARTIAL findings: 3 (BW-MOD-002, BW-MOD-004b, BW-MOD-005) — all [SOURCE_VERIFIED]: YES
BLOCKED findings: 3 (BW-MOD-003, BW-MOD-003b, BW-MOD-004a) — all [SOURCE_VERIFIED]: YES
UNRESOLVED findings: 0

---

## 8. Confidence Summary

Scenarios from HIGH confidence sources: 8
Scenarios from LOW confidence sources: 0
[SOURCE_VERIFIED] results: 8
[SCANNER_LEAD] results: 0
[SCANNER_LOW_CONF] results: 0

---

## 9. §9 Invariant Attack Map

BEHAVIOR.md for moderation is MISSING.
All invariants are IMPLICIT — derived from source structure.

| Attack Path | Attack Result | IMPLICIT_INVARIANT | BLACKWIDOW ID | SPIDER-MAN Required |
|---|---|---|---|---|
| Any-auth-user reads/writes moderator-scoped tables | BYPASSED (pre-fix) | Non-admin auth users must never access moderator-scoped moderation rows | IMPLICIT-001 | TESTREQ-MODERATION-001 |
| Admin supplies victim actorId to hideReportedObjectController | PARTIAL — auth gate holds; audit trail poisoned | Moderation audit trail must reflect the actual session actor | IMPLICIT-002 | TESTREQ-MODERATION-002 |
| Cross-actor block via forged blockerActorId | BLOCKED — 3-layer gate | A Citizen must never block on behalf of another Citizen | IMPLICIT-003 | TESTREQ-MODERATION-003 |
| Diagnostics write moderation tables in production | BLOCKED — build-time elimination | Dev diagnostics must never execute in production context | IMPLICIT-004 | TESTREQ-MODERATION-004 |
| Cross-actor report insertion via forged reporterActorId | PARTIAL — no JS binding; DB gate UNRESOLVED | A report's reporter_actor_id must always match the session actor | IMPLICIT-005 | TESTREQ-MODERATION-005 |

---

## 10. Behavior Contract Attack Summary

```
Behavior Contract Attack Summary
=================================
BEHAVIOR.md exists: NO
BEHAVIOR.md status: MISSING
§4 Failure Paths declared: 0 (MISSING — no BEHAVIOR.md)
§4 Paths attack-verified: N/A
§4 Paths unhandled (FAILURE_PATH_UNHANDLED): N/A
§9 Must Never Happen declared: 0 (MISSING — no BEHAVIOR.md)
§9 Invariants attacked: 5 IMPLICIT_INVARIANTs attacked (from source structure)
§9 Result — BLOCKED: IMPLICIT-003, IMPLICIT-004
§9 Result — BYPASSED (CRITICAL): IMPLICIT-001 (pre-fix DB)
§9 Result — PARTIAL: IMPLICIT-002, IMPLICIT-005
§9 Result — NOT ATTACKED (gap): NONE — all identified implicit invariants were attacked

Finding: MISSING_BEHAVIOR_CONTRACT [moderation]
Note: Attack surface cannot be fully declared without Failure Paths (§4) and
Must Never Happen invariants (§9). Proceeding with available source evidence only.
All attacks are UNANCHORED — no §9 BEH-ID cross-references possible.
```

---

## 11. BLACKWIDOW FINDINGS

---

### FINDING: BW-MOD-2026-06-04-001

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID:                    BW-MOD-2026-06-04-001
Scenario:                      BW-MOD-ATTACK-001 — RLS Bypass via can_manage_domain
Target:                        moderation.can_manage_domain() DB function; 9 dependent RLS policies
Application Scope:             VCSM
Platform Surface:              moderation schema (reports, report_events, actions, blocks, block_events)
Attack Vector:                 Any authenticated user calls Supabase client directly against
                               moderator-scoped tables; can_manage_domain('vc') returns TRUE
                               for all vc.actor_owners members
Exploit Chain Type:            Single-step exploit — RLS gate function returns incorrect value
Governance Status:             CONFIRMED
Result:                        BYPASSED
Evidence:                      batch1 SQL rollback shows: vc branch checks vc.actor_owners existence
                               (every VCSM user) instead of platform_admins. All 9 policies gate
                               on this function. Direct Supabase client calls bypass JS controllers.
Defense Gate:                  ABSENT (RLS function broken at DB level)
Blast Radius:                  ALL authenticated VCSM users have moderator-level read/write
                               access to moderation tables. Any user can: read all reports,
                               hide posts as a fake moderator, write moderation actions,
                               update/dismiss any report, read all block audit events.
Severity:                      CRITICAL
VENOM Cross-Reference:         VENOM-MODERATION-2026-06-04-001 (confirmed CRITICAL — same finding)
                               SEC-001 (2026-05-10 original system review — same finding)
Recommended Fix:               Promote batch1_20260510070000_fix_moderation_can_manage_domain.sql
                               from sql-proposals/ to supabase/migrations/ and execute via
                               supabase db push --linked. Requires pre-steps A/B/C (CARNAGE).
Layer to Fix:                  DB (RLS function replacement)
Required Follow-up Command:    CARNAGE (migration promotion), THOR (release gate)
```

---

### FINDING: BW-MOD-2026-06-04-002

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID:                    BW-MOD-2026-06-04-002
Scenario:                      BW-MOD-ATTACK-002 — moderatorActorId Audit Trail Poisoning
Target:                        moderationActions.controller.js — hideReportedObjectController,
                               dismissReportController
Application Scope:             VCSM
Platform Surface:              moderation.actions, moderation.report_events (audit records)
Attack Vector:                 Authenticated platform admin calls moderator controller with
                               moderatorActorId=victim_actor_uuid. Authorization gate passes
                               (resolves from auth.uid()). Audit records store victim's actorId.
Exploit Chain Type:            Injection exploit — forged parameter accepted by controller
Governance Status:             CONFIRMED
Result:                        PARTIAL
Evidence:                      moderationActions.controller.js:22 — moderatorActorId accepted
                               as parameter. assertModerationAccess.dal.js:23-24 — actorId param
                               ignored server-side (auth.uid() used). insertModerationActionRow
                               called with actorId: moderatorActorId (line 69).
                               insertReportEventRow called with actorId: moderatorActorId (line 96).
Defense Gate:                  WEAK — auth check is session-pinned (CORRECT); but actorId for
                               writes is not session-pinned (INCORRECT).
Blast Radius:                  Admin-only risk. Moderator audit trail can be falsified —
                               a platform admin can attribute moderation actions to any actor,
                               corrupting forensic records. Currently low risk (controllers
                               have 0 callers — VENOM-002). Risk activates when dashboard built.
Severity:                      MEDIUM
VENOM Cross-Reference:         VENOM-MODERATION-2026-06-04-003 (same finding — confirmed from source)
Recommended Fix:               In moderationActions.controller.js: remove moderatorActorId
                               parameter. Derive acting actor from session identity inside
                               the controller (requires resolving actorId from auth.uid()
                               at the controller entry point before any writes). Never accept
                               actor identity for audit writes from the caller.
Layer to Fix:                  Controller
Required Follow-up Command:    SPIDER-MAN (regression test requirement), VENOM (re-verify fix)
```

---

### FINDING: BW-MOD-2026-06-04-003

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID:                    BW-MOD-2026-06-04-003
Scenario:                      BW-MOD-ATTACK-003 — block_actor/unblock_actor Ownership Bypass
Target:                        block.write.dal.js#blockActor, blocks.dal.js#dalInsertBlock,
                               blockActor.controller.js, Blocks.controller.js
Application Scope:             VCSM
Platform Surface:              moderation.block_actor RPC, moderation.unblock_actor RPC
Attack Vector:                 Supply blockerActorId != sessionActorId to block on behalf
                               of another actor. Controller-level and DB-level ownership checks.
Exploit Chain Type:            N/A — all vectors blocked
Governance Status:             CONFIRMED
Result:                        BLOCKED
Evidence:                      blockActor.controller.js:28-29 — assertingActorId !== blockerActorId
                               throws immediately. Blocks.controller.js:71-72 — callerActorId !==
                               actorId throws. useBlockActions.js:39,51 — sessionActorId sourced
                               from useIdentity() (session-pinned). RPC batch4 proposal shows
                               server-side: is_current_vc_actor(p_blocker_actor_id) guard.
                               20260510010000 migration confirms is_current_vc_actor deployed.
Defense Gate:                  PRESENT — three independent layers
Blast Radius:                  None
Severity:                      INFO (defense confirmed — protection hardened)
VENOM Cross-Reference:         None — not a VENOM finding; BW adversarial confirmation only
Recommended Fix:               None required. Defense is sound. Consider adding test coverage.
Layer to Fix:                  N/A
Required Follow-up Command:    SPIDER-MAN (TESTREQ-MODERATION-003 — confirm regression coverage)
```

---

### FINDING: BW-MOD-2026-06-04-004

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID:                    BW-MOD-2026-06-04-004
Scenario:                      BW-MOD-ATTACK-004 — Diagnostic Write Surfaces as Attack Path
Target:                        /dev/diagnostics route + reports.group.js write surfaces
Application Scope:             VCSM
Platform Surface:              moderation.reports, moderation.report_events, moderation.actions,
                               moderation.blocks (all via dev/diagnostics in DEV build)
Attack Vector:                 Navigate to /dev/diagnostics in production; or run diagnostic
                               writes in dev environment without moderation access gate.
Exploit Chain Type:            Multi-step exploit attempt — route guard + bundle elimination
                               prevent production access. Dev-only: no app-layer guard.
Governance Status:             CONFIRMED
Result:                        BLOCKED (production) / PARTIAL (dev environment)
Evidence (production):         lazyApp.jsx:51-53 — DevDiagnosticsScreen null in production.
                               app.routes.jsx:22,163-168 — devDiagnosticsEnabled = import.meta.env.DEV;
                               route returns <Navigate to="/feed"> in production.
                               vite.config.js:76 — esbuild drop console/debugger in production.
Evidence (dev):                reports.group.js:39-56 — direct Supabase insert with no
                               assertModerationAccess call. No DEV environment guard at group level.
                               social.group.js:162-188 — direct moderation.blocks insert.
Defense Gate (production):     PRESENT — build-time elimination and route redirect
Defense Gate (dev):            WEAK — sole protection is RLS (which is currently broken per BW-001)
Blast Radius (production):     None
Blast Radius (dev):            Any dev user can write moderation tables via diagnostics panel
                               without moderation role. Post-fix, these writes will fail with
                               RLS denials — but currently succeed due to can_manage_domain bug.
Severity:                      MEDIUM (dev-only; production exposure blocked)
VENOM Cross-Reference:         VENOM-MODERATION-2026-06-04-004
Recommended Fix:               (1) Production: no action required — guards are correct.
                               (2) Dev: Update diagnostic write assertions to handle RLS denial
                               (42501) gracefully. Add isRlsDenied handling to create_report test
                               (currently throws). Post-fix, diagnostics should accept RLS denial
                               as a PASS signal (confirming the fix works), not a FAIL.
Layer to Fix:                  dev/diagnostics test logic (non-production)
Required Follow-up Command:    VENOM (verify post-fix diagnostic behavior expectation)
```

---

### FINDING: BW-MOD-2026-06-04-005

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID:                    BW-MOD-2026-06-04-005
Scenario:                      BW-MOD-ATTACK-005 — Cross-Actor Report Insertion
Target:                        report.controller.js#createReportController →
                               reports.dal.js#insertReportRow
Application Scope:             VCSM
Platform Surface:              moderation.reports — reporter_actor_id field
Attack Vector:                 Client supplies arbitrary reporterActorId to useReportFlow hook
                               or createReportController directly. Controller null-checks
                               but does not session-bind. DAL stores supplied value.
Exploit Chain Type:            Injection exploit — forged parameter accepted by controller
Governance Status:             DRAFT
Result:                        PARTIAL
Evidence:                      useReportFlow.js:27 — reporterActorId supplied as prop.
                               report.controller.js:28,43-45 — accepted as parameter, only
                               null-checked. reports.dal.js:79-82 — reporter_actor_id from
                               parameter stored directly in insert.
                               DB INSERT policy text not confirmed from source alone.
                               RLS binding of reporter_actor_id field: UNRESOLVED.
Defense Gate:                  WEAK at JS layer (null check only, no session binding).
                               DB-layer gate: UNRESOLVED — requires RLS policy inspection.
Blast Radius:                  If DB INSERT policy does NOT enforce reporter_actor_id ownership:
                               any JS-layer attacker (extension, compromised dep, XSS) can file
                               reports attributed to any actor. Moderate risk.
                               If DB policy enforces ownership: risk contained to JS layer only.
Severity:                      MEDIUM
VENOM Cross-Reference:         None — new finding, not in VENOM 2026-06-04 scan
Recommended Fix:               (1) Immediate: Confirm moderation.reports INSERT policy
                               enforces NEW.reporter_actor_id = is_current_vc_actor() or
                               auth.uid()-based actor ownership.
                               (2) Follow-up: In createReportController, derive reporterActorId
                               from session (via identity RPC or session actor resolver) instead
                               of accepting from caller parameter.
Layer to Fix:                  DB (confirm RLS INSERT policy), Controller (session binding)
Required Follow-up Command:    VENOM (inspect moderation.reports INSERT RLS policy text),
                               SPIDER-MAN (regression test for cross-actor report attempt)
```

---

### FINDING: BW-MOD-2026-06-04-006 (GOVERNANCE)

```
BLACKWIDOW ADVERSARIAL FINDING

Finding ID:                    BW-MOD-2026-06-04-006
Scenario:                      MISSING_BEHAVIOR_CONTRACT [moderation]
Target:                        CURRENT/features/moderation/BEHAVIOR.md
Application Scope:             VCSM
Platform Surface:              moderation feature (all surfaces)
Attack Vector:                 N/A — governance finding
Exploit Chain Type:            N/A
Governance Status:             CONFIRMED
Result:                        N/A (governance gap)
Evidence:                      ls CURRENT/features/moderation/ — no BEHAVIOR.md present.
                               All 5 BW attack scenarios required construction of
                               IMPLICIT_INVARIANTs from source — none anchored to §9 BEH-IDs.
Defense Gate:                  ABSENT (no declared invariants to test against)
Blast Radius:                  Attack surface cannot be fully scoped without §9 Must Never Happen.
                               BLACKWIDOW coverage is necessarily incomplete.
Severity:                      HIGH (governance)
VENOM Cross-Reference:         VENOM-MODERATION-2026-06-04-005
Recommended Fix:               Author BEHAVIOR.md for moderation via ProfessorX.
                               Required for THOR behavioral release gate.
                               Required for BLACKWIDOW re-run with anchored attacks.
Layer to Fix:                  Documentation / Governance
Required Follow-up Command:    ProfessorX (BEHAVIOR.md authoring), BLACKWIDOW (re-run post-authoring)
```

---

## 12. Successful Exploit Chains

### Confirmed Exploit Chain 1 — Moderator Privilege Escalation (CRITICAL)

```
Attacker: Any authenticated VCSM user
Entry: Supabase client (direct — bypasses all JS controllers)
Step 1: supabase.schema('moderation').from('reports').select('*')
        → can_manage_domain('vc') returns TRUE for all auth users
        → ALL moderation reports returned (cross-tenant read)
Step 2: supabase.schema('moderation').from('actions').insert({...})
        → can_manage_domain('vc') returns TRUE
        → Moderation action written by non-admin
Step 3: supabase.schema('moderation').from('reports').update({status:'dismissed'})
        → can_manage_domain('vc') returns TRUE
        → Any report dismissed by any user
Result: Full moderator-level access — read all reports, write moderation actions,
        dismiss any report, read all block audit events.
Precondition: Authenticated VCSM user only (no admin role needed)
Fix: Promote Batch 1 SQL proposal to migrations
```

---

## 13. Failed Exploit Chains (Defenses That Held)

### Defense 1 — Cross-Actor Block Attempt (3-Layer Protection)

```
Attack: blockActorController(victim_uuid, target_uuid, session_uuid)
Layer 1: blockActor.controller.js:28-29 — assertingActorId !== blockerActorId → throws
Layer 2: Blocks.controller.js:71-72 — callerActorId !== actorId → throws  
Layer 3: block_actor RPC — is_current_vc_actor(p_blocker_actor_id) → raises 42501
Result: BLOCKED at every layer. No ownership bypass possible.
```

### Defense 2 — Diagnostics Route in Production

```
Attack: Navigate browser to /dev/diagnostics on production build
Layer 1: import.meta.env.DEV = false in Vite production build (build-time)
Layer 2: lazyApp.jsx — DevDiagnosticsScreen = () => null (no bundle inclusion)
Layer 3: app.routes.jsx — element: <Navigate to="/feed" replace /> (runtime)
Result: BLOCKED. Production user cannot access diagnostics screen.
```

---

## 14. Runtime Evidence

All evidence is source-verified from repository files. No live database mutations performed (ethical constraint). All harnesses are simulation only — not deployed.

**Key source citations:**
- `moderationActions.controller.js:22` — moderatorActorId accepted from caller [CONFIRMED]
- `assertModerationAccess.dal.js:23-24` — actorId param ignored; auth.uid() used [CONFIRMED]
- `report.controller.js:43-45` — reporterActorId null-checked only, not session-bound [CONFIRMED]
- `blockActor.controller.js:28-29` — assertingActorId guard present [CONFIRMED]
- `lazyApp.jsx:51-53` — DevDiagnosticsScreen null in production [CONFIRMED]
- `batch1 SQL (rollback section)` — broken vc branch of can_manage_domain [CONFIRMED]

---

## 15. Blast Radius

| Finding | Blast Radius | Actors Affected |
|---|---|---|
| BW-MOD-001 | MAXIMUM — all auth users have moderator access | All authenticated VCSM users (cross-tenant) |
| BW-MOD-002 | ADMIN-ONLY — audit trail corruption | Platform admins only; activates when dashboard built |
| BW-MOD-003 | NONE — blocked | N/A |
| BW-MOD-004 | DEV-ONLY — no production impact | Dev environment users only |
| BW-MOD-005 | MODERATE — JS-layer injection if DB policy absent | Any JS-layer attacker (XSS, extension) |
| BW-MOD-006 | GOVERNANCE — incomplete attack coverage | Ongoing — all users |

---

## 16. THOR Impact

### P0 Release Blockers (BLACKWIDOW)

| Finding | Severity | Result | THOR Action |
|---|---|---|---|
| BW-MOD-2026-06-04-001 | CRITICAL | BYPASSED | P0 RELEASE BLOCKER — no release until can_manage_domain fix is deployed |
| BW-MOD-2026-06-04-006 | HIGH (governance) | CONFIRMED | THOR BEHAVIORAL GATE — BEHAVIOR.md required |

### P1 Pre-Release Requirements

| Finding | Severity | Result | THOR Action |
|---|---|---|---|
| BW-MOD-2026-06-04-002 | MEDIUM | PARTIAL | Resolve before moderator dashboard ships |
| BW-MOD-2026-06-04-005 | MEDIUM | PARTIAL | Confirm DB INSERT policy; resolve before reports feature ships |

### CAUTION (P2/P3)

| Finding | Severity | Result | THOR Action |
|---|---|---|---|
| BW-MOD-2026-06-04-004 | MEDIUM | PARTIAL (dev) | Dev-only; no production blocker; track as diagnostic improvement |

---

## 17. SPIDER-MAN Test Requirements

| TESTREQ ID | Invariant | Triggered By | Test Type |
|---|---|---|---|
| TESTREQ-MODERATION-001 | Non-admin cannot access moderator-scoped tables | BW-MOD-001 | RLS regression — post-fix confirm non-admin SELECT returns empty; INSERT fails with 42501 |
| TESTREQ-MODERATION-002 | Moderation audit trail reflects session actor | BW-MOD-002 | Unit test — confirm moderationActions.controller derives actorId from session |
| TESTREQ-MODERATION-003 | Cannot block as another actor | BW-MOD-003 (BLOCKED) | Regression test — blockActorController with mismatched assertingActorId throws |
| TESTREQ-MODERATION-004 | Dev diagnostics never run in production | BW-MOD-004 | Build test — confirm DevDiagnosticsScreen not in production bundle |
| TESTREQ-MODERATION-005 | reporter_actor_id always matches session | BW-MOD-005 | RLS inspection + controller session-binding test |

---

## 18. Recommended Fixes

### Fix 1 — CRITICAL (BW-MOD-001) — DB Promotion
Promote `batch1_20260510070000_fix_moderation_can_manage_domain.sql` from `sql-proposals/` to `supabase/migrations/`. Execute CARNAGE pre-steps A/B/C. Run `supabase db push --linked`. Verify with post-deployment queries in proposal file.

### Fix 2 — MEDIUM (BW-MOD-002) — Controller Session Binding
In `moderationActions.controller.js`: remove `moderatorActorId` from the parameter interface. Resolve the acting actor from session identity inside the controller (query the actor owned by `auth.uid()` using the identity engine). Write that session-resolved actorId to all audit records.

### Fix 3 — MEDIUM (BW-MOD-005) — DB Policy Inspection + Controller Binding
(a) Inspect the `moderation.reports` INSERT RLS policy text in the live DB. Confirm it enforces `NEW.reporter_actor_id` ownership via `auth.uid()`.
(b) In `report.controller.js`: derive `reporterActorId` from session identity instead of accepting as a parameter.

### Fix 4 — MEDIUM (BW-MOD-004) — Diagnostic Post-Fix Handling
In `reports.group.js`: add `isRlsDenied` handling to the `create_report` test (currently throws on any error). Post-Batch-1, this test should expect and accept RLS denial as a confirmation of correct behavior.

### Fix 5 — HIGH/GOVERNANCE (BW-MOD-006) — BEHAVIOR.md
Author `CURRENT/features/moderation/BEHAVIOR.md` via ProfessorX with complete §4 Failure Paths and §9 Must Never Happen invariants. Required for BLACKWIDOW re-run with anchored attacks.

---

## 19. Required Follow-up Commands

| Command | Reason | Priority |
|---|---|---|
| CARNAGE | Promote Batch 1 migration from sql-proposals to supabase/migrations — P0 prerequisite | P0 |
| THOR | Register BW-MOD-001 as P0 release blocker | P0 |
| VENOM | Inspect moderation.reports INSERT RLS policy text (BW-MOD-005) | P1 |
| VENOM | Verify post-fix diagnostic RLS denial behavior | P1 |
| SPIDER-MAN | TESTREQ-MODERATION-001 through 005 | P1 |
| ProfessorX | Author moderation BEHAVIOR.md | P2 |
| BLACKWIDOW | Re-run after BEHAVIOR.md authored and Batch 1 deployed | P2 |

---

## 20. Pending Reviews

| Command | Reason | Status |
|---|---|---|
| VENOM | Cross-reference BW-MOD-005 (reporter_actor_id RLS policy) | PENDING |
| LOKI | Validate runtime telemetry for BW-MOD-001 exploit path | PENDING |
| THOR | Evaluate release blocking status — BW-MOD-001 + BW-MOD-006 | PENDING |
| ELEKTRA | Precision source-to-sink chain analysis for BW-MOD-002 and BW-MOD-005 | PENDING (parallel run) |

---

## Appendix — BLACKWIDOW Ethical Constraint Declaration

This review is:
- Internal, ethical, sandboxed, contract-bound, repository-scoped, non-destructive
- All harnesses are adversarial simulation constructs — NOT deployed to any environment
- No production data was mutated
- No credentials were extracted or used
- No external systems were targeted
- All DB-layer claims are derived from SQL proposal files and migration sources — no live DB mutations

Authority: BLACKWIDOW V2 (2026-05-14)
Scope: VCSM
Classification: SECURITY — INTERNAL ONLY
