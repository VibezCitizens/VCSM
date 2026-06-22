# ELEKTRA V2 — Precision Source-to-Sink Security Report
# Moderation Feature — VCSM

**Ticket:** TICKET-MODERATION-DB-GUARD-APPLY-0001
**Scan Date:** 2026-06-04
**Scanner:** ELEKTRA V2
**Scan Type:** Precision source-to-sink vulnerability scan
**Working Directory:** apps/VCSM/src/features/moderation/
**Ethical Constraint:** Read-only. All patches are advisory proposals. No source files modified.

---

## Preflight — Scanner Map Availability

| Map | Status |
|---|---|
| callgraph.json | LOADED — 68 VCSM moderation nodes identified |
| dead-export-map.json | LOADED — 0 dead moderation exports flagged (scanner gap noted) |
| write-surface-map.json | LOADED |
| write-execution-map.json | LOADED |
| security-path-map.json | LOADED — 0 moderation entries (coverage gap) |
| dependency-map.json | LOADED |
| feature-map.json | LOADED |

**Scanner Signal:** callgraph confirmed dead controllers via node presence without edge connections to UI layer. Dead export map shows 0 entries for moderation — this is a scanner gap, not a clean bill. VENOM-2026-06-04-002 is confirmed through direct callgraph topology inspection, not scanner flag.

---

## Vulnerability Surface Inventory

**Moderation write surfaces (identified from callgraph + source read):**

| Surface | File | Schema | Write Type |
|---|---|---|---|
| moderation.reports INSERT | reports.dal.js:insertReportRow | moderation | Direct INSERT |
| moderation.report_events INSERT | reports.dal.js:insertReportEventRow | moderation | Direct INSERT |
| moderation.actions INSERT | reports.dal.js:insertModerationActionRow | moderation | Direct INSERT |
| moderation.actions INSERT | moderationActions.dal.js:insertModerationActionDAL | moderation | Direct INSERT |
| vc.posts UPDATE (is_hidden) | reports.dal.js:hidePostRow | vc | Direct UPDATE |
| chat.messages UPDATE (is_hidden) | reports.dal.js:hideMessageRow | chat | Direct UPDATE |
| moderation.blocks (via RPC) | block.write.dal.js:blockActor | moderation | RPC |
| moderation.blocks (via RPC) | block.write.dal.js:unblockActor | moderation | RPC |
| moderation.actions INSERT (diag) | reports.group.js:create_moderation_action | moderation | Direct INSERT (dev) |
| moderation.reports INSERT (diag) | reports.group.js:create_report | moderation | Direct INSERT (dev) |
| moderation.report_events INSERT (diag) | reports.group.js:create_report_event | moderation | Direct INSERT (dev) |
| chat.inbox_entries UPSERT | reports.dal.js:upsertInboxEntryFolder | chat | Direct UPSERT |

---

## ELEKTRA Chains — Full Analysis

---

### CHAIN 1 — reporter_actor_id Injection on INSERT moderation.reports

**Severity: MEDIUM**
**Status: CONFIRMED FINDING**
**ELEKTRA ID: ELEK-MODERATION-2026-06-04-001**

#### Source-to-Sink Chain

```
UI Component (e.g., PostFeed.screen.jsx)
  → useIdentity() → identity.actorId           [SESSION BOUND — correct]
  → useReportFlow({ reporterActorId: actorId })
  → reportFlow.submit({ reasonCode, reasonText })
  → createReportController({ reporterActorId, objectType, objectId, ... })
      [TRUST BOUNDARY — controller accepts reporterActorId as parameter]
  → insertReportRow({ reporterActorId, ... })
      [SINK — INSERT moderation.reports SET reporter_actor_id = reporterActorId]
```

#### Evidence

- `useReportFlow` (reports.dal.js:27): `{ reporterActorId }` accepted as prop. Hook does not call `useIdentity()` internally.
- `usePostDetailReporting.js:8`: `useReportFlow({ reporterActorId: actorId })` — actorId comes from props, not re-derived from session inside the hook.
- `PostFeed.screen.jsx:25-27`: `identity.actorId` from `useIdentity()` — session-bound at this call site.
- `createReportController` (report.controller.js:28): accepts `reporterActorId` parameter, validates presence but does NOT re-derive from session.
- `insertReportRow` (reports.dal.js:61): maps `reporterActorId` directly to `reporter_actor_id` column — no session check.

#### Trust Boundary Assessment

The identity binding is established at the SCREEN level (`useIdentity()`). This is correct for the two known callers (PostFeed.screen.jsx, useCentralFeedActions.js). However:

1. The controller layer accepts an arbitrary `reporterActorId` — any caller that passes a fabricated actorId bypasses the screen-level binding.
2. The DAL layer performs no session pinning.
3. No RLS policy confirmed for `moderation.reports INSERT` that enforces `reporter_actor_id IN (actor_owners WHERE user_id = auth.uid())`.

**The live `moderation.reports` table has no INSERT RLS policy visible in any migration in `apps/VCSM/supabase/migrations/`.** The SEC-001 CARNAGE remediation plan notes that reporter_actor_id binding on INSERT is absent at the DB layer.

#### Impact

Any authenticated caller that invokes `createReportController` with a foreign actorId can attribute a report to a victim actor. The victim actor would have a report trail they did not create.

#### Missing Defense

- No session pinning of `reporterActorId` in controller layer
- No `moderation.reports` INSERT RLS policy binding `reporter_actor_id` to `auth.uid()` actor_owners

#### Proposed Patch (Advisory Only — Do Not Apply)

**App-side: session bind in controller**
```js
// report.controller.js — proposed
import { supabase } from '@/services/supabase/supabaseClient'

export async function createReportController({ objectType, objectId, reasonCode, ... }) {
  // SESSION_BIND: derive reporterActorId from session, not caller
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.id) return { ok: false, error: new Error('Not authenticated') }
  const { data: ownerRow } = await supabase
    .schema('vc').from('actor_owners').select('actor_id')
    .eq('user_id', session.user.id).maybeSingle()
  const reporterActorId = ownerRow?.actor_id
  if (!reporterActorId) return { ok: false, error: new Error('No actor for session') }
  // ... rest of controller unchanged
}
```

**DB-side (proposal SQL only — do not execute):**
```sql
DROP POLICY IF EXISTS "reports_insert_self" ON moderation.reports;
CREATE POLICY "reports_insert_self"
  ON moderation.reports FOR INSERT TO authenticated
  WITH CHECK (
    reporter_domain = 'vc'
    AND reporter_actor_id IN (
      SELECT ao.actor_id FROM vc.actor_owners ao WHERE ao.user_id = auth.uid()
    )
  );
```

---

### CHAIN 2 — actor_id Injection on INSERT moderation.actions (moderationActions.dal.js)

**Severity: LOW (Partially Mitigated)**
**Status: CONDITIONAL FINDING — RLS blocks cross-actor injection; audit trail poisoning possible in same-user multi-actor case**
**ELEKTRA ID: ELEK-MODERATION-2026-06-04-002**

#### Source-to-Sink Chain

```
hidePostForActor({ actorId, postId })         [actorId from controller param]
  → insertModerationActionDAL({ actorId, ... })
      [SINK — INSERT moderation.actions SET actor_id = actorId]
```

OR via moderator path:
```
hideReportedObjectController({ moderatorActorId, reportId })
  → insertModerationActionRow({ actorId: moderatorActorId, ... })
      [SINK — INSERT moderation.reports.actions SET actor_id = moderatorActorId]
```

#### Evidence

- `moderationActions.dal.js:36-76`: `insertModerationActionDAL` accepts `actorId` parameter. Validates presence, validates `actionType` allowlist. Does NOT compare `actorId` to session.
- `20260518020000_moderation_actions_rls.sql:48-60`: `actions_insert_own_actor` policy — WITH CHECK `actor_id IN (SELECT ao.actor_id FROM vc.actor_owners ao WHERE ao.user_id = auth.uid())`. **This is a strong DB-layer defense.**

#### Trust Boundary Assessment

The `actions_insert_own_actor` RLS policy enforces that `actor_id` must belong to the current session user's actor_owners. A caller cannot inject a foreign actorId — the DB will reject it. This is the correct pattern.

**However:** A user with multiple actors (profile + vport) can insert a moderation action attributed to their vport actor while operating as their personal actor. The RLS policy allows this because both actors are owned by the same `auth.uid()`. This is a LOW risk: the UI prevents it, but there is no controller-layer enforcement.

#### Missing Defense

- Controller layer does not verify `actorId` matches the current active identity — only the DB layer does.
- For the moderator path (`hideReportedObjectController`), `moderatorActorId` is accepted from caller (see CHAIN 6 for full moderator analysis).

#### Proposed Patch (Advisory Only)

No critical patch needed given the RLS policy. For defense-in-depth, the `insertModerationActionDAL` could optionally enforce same-session validation, but this would require the DAL to call `supabase.auth.getSession()`, which crosses DAL purity rules. The correct location is the controller layer.

**Risk rating degraded to LOW** because the DB-layer policy is the correct enforcement point and is confirmed deployed.

---

### CHAIN 3 — updateReportRowStatus — No Ownership or Actor Check

**Severity: HIGH (conditional on VENOM-2026-06-04-001 not being fixed)**
**Status: CONFIRMED FINDING**
**ELEKTRA ID: ELEK-MODERATION-2026-06-04-003**

#### Source-to-Sink Chain

```
hideReportedObjectController({ moderatorActorId, reportId })
  → assertModerationAccessController(moderatorActorId)    [AUTH CHECK — correct]
  → updateReportRowStatus({ reportId, status: 'actioned', ... })
      [SINK — UPDATE moderation.reports SET status='actioned' WHERE id=reportId]
```

OR:

```
dismissReportController({ moderatorActorId, reportId })
  → assertModerationAccessController(moderatorActorId)    [AUTH CHECK — correct]
  → updateReportRowStatus({ reportId, status: 'dismissed', ... })
      [SINK — UPDATE moderation.reports SET status='dismissed' WHERE id=reportId]
```

#### Evidence

- `reports.dal.js:129-157`: `updateReportRowStatus` accepts `reportId` and `status`. No ownership check, no session check. `.update(patch).eq('id', reportId)` — any reportId is accepted.
- `moderationActions.controller.js:82-90`: calls `updateReportRowStatus` after `assertModerationAccess`. Auth check is present.
- **CRITICAL gap:** `assertModerationAccessController` calls `isModerationAuthorizedDAL` which calls `learning.is_current_user_platform_admin()`. Due to VENOM-2026-06-04-001, this RPC resolves via `auth.uid()` correctly — BUT the DB-level `moderation_reports_update_moderator` policy uses `moderation.can_manage_domain('vc')` which returns TRUE for ALL authenticated users.

#### Impact

Until VENOM-2026-06-04-001 is fixed (can_manage_domain repaired), any authenticated user can call `updateReportRowStatus` with any `reportId`. The update will succeed because:
1. No caller-side guard at the DAL
2. The DB UPDATE policy (`moderation_reports_update_moderator`) is effectively open

Post-fix, this chain is adequately defended. The severity is HIGH pre-fix, LOW post-fix.

#### Missing Defense

- `updateReportRowStatus` has no policy binding UPDATE to moderator actors — it relies entirely on the caller having gone through `assertModerationAccessController`. The DB policy is the correct backstop but it is currently broken.

#### Proposed Patch (Advisory Only)

**DB-side (dependent on VENOM-2026-06-04-001 Batch 1 fix landing first):**

No additional DB-side patch needed if Batch 1 lands — the UPDATE policy will then require `can_manage_domain('vc')` to return TRUE only for platform admins.

**App-side:** After Batch 1, the chain is properly defended. The DAL correctly relies on the DB policy as the authoritative guard, which is the right pattern.

---

### CHAIN 4 — block_actor RPC — blockerActorId Session Binding

**Severity: LOW (Well-Defended)**
**Status: PASS — Defense-in-Depth Confirmed**
**ELEKTRA ID: ELEK-MODERATION-2026-06-04-004**

#### Source-to-Sink Chain

```
useBlockActorAction()
  → identity.actorId from useIdentity()              [SESSION BOUND]
  → blockActorController(blockerActorId, blockedActorId, sessionActorId)
      [OWNERSHIP CHECK: assertingActorId !== blockerActorId → throws]
  → blockActorDAL(blockerActorId, blockedActorId)
  → supabase.rpc('block_actor', { p_blocker_actor_id, p_blocked_actor_id })
      [RPC DB GUARD: moderation.is_current_vc_actor(p_blocker_actor_id) → throws 42501 if mismatch]
```

#### Evidence

- `useBlockActorAction.js:7-8`: `sessionActorId = identity?.actorId ?? null` — from `useIdentity()`, session-bound.
- `useBlockActorAction.js:18`: passes `sessionActorId` as `assertingActorId` to controller.
- `blockActor.controller.js:28-30`: `if (!assertingActorId || assertingActorId !== blockerActorId) throw`. Ownership check at controller layer.
- `block.write.dal.js:25-32`: `supabase.rpc('block_actor', { p_blocker_actor_id })`. No client-side actor validation.
- **DB-layer (confirmed from proposal + CARNAGE docs):** `moderation.block_actor` RPC is `SECURITY DEFINER` with `moderation.is_current_vc_actor(p_blocker_actor_id)` guard. This function verifies the passed actor_id belongs to `auth.uid()` via actor_owners.

#### Assessment

Three-layer defense: session → controller ownership check → DB RPC ownership guard. The caller-supplied `blockerActorId` is validated at controller layer (matches session) and re-validated at DB layer (is_current_vc_actor). This chain is well-defended.

**Note:** The Batch 4 proposal (bidirectional follow cleanup in block_actor) is still a proposal — the live block_actor RPC does not clean up friend_ranks. This is a functional gap (SEC-005/SEC-010) but not an injection vulnerability. The ownership guard itself is solid.

#### Missing Defense

None for ownership. SEC-005/SEC-010 (friend_ranks cleanup, follow deactivation) are functional gaps, not security vulnerabilities in the injection sense.

---

### CHAIN 5 — skipReportEventsInsertForSession Flag

**Severity: N/A (Finding REFUTED)**
**Status: FLAG DOES NOT EXIST IN LIVE CODE**
**ELEKTRA ID: ELEK-MODERATION-2026-06-04-005**

#### Investigation

The VCSM 2026-05-10 remediation plan (§ Batch 2) documented a module-level singleton flag `skipReportEventsInsertForSession` that was described as existing in `reports.dal.js`. This flag would suppress all subsequent `report_events` inserts after the first RLS denial, creating a DoS-style audit trail blackout.

#### Evidence

- Full read of `apps/VCSM/src/features/moderation/dal/reports.dal.js` (274 lines): **no such flag exists**.
- `insertReportEventRow` (line 163-191): returns `{ row: null, error }` on failure — no module-level state mutation.
- `report.controller.js:98`: destructures `{ error: reportEventError, skipped: reportEventSkipped }` — `skipped` will always be `undefined` (falsy) because the DAL never sets it. This is dead destructuring.
- Grep across all moderation files: zero matches for `skipReport`, `skipInsert`, `singleton`, or equivalent patterns.

#### Conclusion

The flag was either removed as part of a prior cleanup or was never present in this codebase iteration. The REMEDIATION PLAN's description of the flag documents the architectural risk but the live code is clean.

**Residual concern:** The structural gap (no `moderation_report_events_insert_self` RLS policy) still exists. The Batch 2 proposal to add that policy has not been applied. As a result:

- Any `report_events` INSERT by a non-admin user will fail with RLS denial (42501)
- The controller logs a warning but does not fail the overall report creation
- The audit trail for self-created reports is silently missing

This is SEC-006 territory and is a confirmed structural gap, but not a code-level DoS injection path.

---

### CHAIN 6 — hidePostRow / hideMessageRow — moderatorActorId Not Session-Bound

**Severity: MEDIUM (activates when moderator dashboard is built)**
**Status: CONFIRMED FINDING — matches VENOM-2026-06-04-003**
**ELEKTRA ID: ELEK-MODERATION-2026-06-04-006**

#### Source-to-Sink Chain

```
[FUTURE] moderatorDashboard → hideReportedObjectController({ moderatorActorId, reportId })
    [PARAMETER — moderatorActorId from caller, NOT session]
  → assertModerationAccessController(moderatorActorId)
      [CHECK: calls isModerationAuthorizedDAL(actorId) → is_current_user_platform_admin()]
      [NOTE: actorId param is IGNORED — auth resolves from auth.uid()]
  → hidePostRow({ moderatorActorId, postId, hiddenAt })
      [SINK A — UPDATE vc.posts SET hidden_by_actor_id = moderatorActorId]
  → insertModerationActionRow({ actorId: moderatorActorId, ... })
      [SINK B — INSERT moderation.actions SET actor_id = moderatorActorId]
  → insertReportEventRow({ actorId: moderatorActorId, eventType: 'content_hidden' })
      [SINK C — INSERT moderation.report_events SET actor_id = moderatorActorId]
```

#### Evidence

- `moderationActions.controller.js:22-26`: `hideReportedObjectController({ moderatorActorId, reportId })` — caller supplies `moderatorActorId`.
- `assertModerationAccess.controller.js:8`: `async function assertModerationAccessController(actorId)` — receives actorId but does not use it for authorization. Authorization comes from `auth.uid()` at the DB.
- `assertModerationAccess.dal.js:19`: `isModerationAuthorizedDAL(actorId)` — comment explicitly notes "actorId is retained for the controller contract; authorization resolves from auth.uid()." The passed actorId is NOT used for authorization.
- `reports.dal.js:237-252`: `hidePostRow({ moderatorActorId, postId, hiddenAt })` — writes `hidden_by_actor_id: moderatorActorId` with no session derivation.
- `moderationActions.controller.js:68-79`: `insertModerationActionRow({ actorId: moderatorActorId })` — writes audit record with caller-supplied actorId.

#### Impact

A platform admin who calls `hideReportedObjectController({ moderatorActorId: victimActorId, reportId })` will:
1. Pass the `assertModerationAccess` check (correct — auth.uid() determines admin status)
2. Write `vc.posts.hidden_by_actor_id = victimActorId` (incorrect — victim's actorId as moderator)
3. Write `moderation.actions.actor_id = victimActorId` (audit trail poisoning)
4. Write `moderation.report_events.actor_id = victimActorId` (audit trail poisoning)

This is an audit trail integrity failure. The system will record the wrong actor as having performed moderation actions.

**Risk is latent** — because `hideReportedObjectController` and `dismissReportController` currently have zero callers (VENOM-2026-06-04-002), this attack path requires building the moderator UI first.

#### Missing Defense

- No session derivation of `moderatorActorId` anywhere in the call chain
- `assertModerationAccess` correctly verifies authorization but does not return the session's canonical actorId for use in subsequent writes

#### Proposed Patch (Advisory Only — Do Not Apply)

**Approach: derive moderatorActorId inside the controller from session, discard caller param**

```js
// moderationActions.controller.js — proposed
import { supabase } from '@/services/supabase/supabaseClient'

async function getSessionActorId() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.id) return null
  const { data } = await supabase
    .schema('vc').from('actor_owners').select('actor_id')
    .eq('user_id', session.user.id).maybeSingle()
  return data?.actor_id ?? null
}

export async function hideReportedObjectController({ reportId }) {
  // SESSION_BIND: derive moderatorActorId from session — caller param removed
  const moderatorActorId = await getSessionActorId()
  if (!moderatorActorId) {
    const err = new Error('Not authenticated')
    err.code = 'FORBIDDEN'
    throw err
  }
  await assertModerationAccessController(moderatorActorId)
  // ... rest unchanged, moderatorActorId is now session-bound
}
```

**Alternatively:** `assertModerationAccess.controller.js` could be modified to return the session's canonical actorId:

```js
export async function assertModerationAccessController() {
  // Resolve actorId from session internally
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { const e = new Error('Not authenticated'); e.code = 'FORBIDDEN'; throw e }
  const authorized = await isModerationAuthorizedDAL()
  if (!authorized) { const e = new Error('Forbidden'); e.code = 'FORBIDDEN'; throw e }
  // Return session actorId for callers to use
  const { data } = await supabase.schema('vc').from('actor_owners')
    .select('actor_id').eq('user_id', session.user.id).maybeSingle()
  if (!data?.actor_id) { const e = new Error('No actor'); e.code = 'FORBIDDEN'; throw e }
  return { moderatorActorId: data.actor_id }
}
```

---

### CHAIN 7 — Dev Diagnostics Write Surface

**Severity: MEDIUM**
**Status: CONFIRMED FINDING — Conditional Production Exposure**
**ELEKTRA ID: ELEK-MODERATION-2026-06-04-007**

#### Source-to-Sink Chain

```
Route: /dev/diagnostics
  → devDiagnosticsEnabled = import.meta.env.DEV    [BUILD-TIME GUARD]
  → DevDiagnosticsScreen
  → runReportsGroup()
  → reports.group.js tests: create_report, create_report_event, create_moderation_action
      [SINKS — direct supabase.schema('moderation').from('reports').insert() calls]
      [NO assertModerationAccess — raw Supabase client calls bypassing controller]
```

#### Evidence

- `app.routes.jsx:22`: `const devDiagnosticsEnabled = import.meta.env.DEV` — build-time flag.
- `app.routes.jsx:163-168`: Route guarded by `devDiagnosticsEnabled ? <DevDiagnosticsScreen /> : <Navigate to="/feed" replace />`.
- `reports.group.js:38-56`: Direct INSERT to `moderation.reports` using `supabase.schema('moderation').from('reports').insert(...)`. No `assertModerationAccess`.
- `reports.group.js:196-225`: Direct INSERT to `moderation.actions` with `actor_id: actorId`. No `assertModerationAccess`.
- `reports.group.js:80-113`: Direct INSERT to `moderation.report_events`. No `assertModerationAccess`.

#### Trust Boundary Assessment

**Build-time guard (`import.meta.env.DEV`) is the primary protection.** Vite tree-shakes `import.meta.env.DEV === false` branches in production builds — the route resolves to `<Navigate to="/feed" replace />` and the diagnostics code is excluded from the production bundle.

**However, three concerns remain:**

1. **`assertModerationAccess` bypass:** The diagnostic writes use the raw Supabase client, not the application's controller layer. After VENOM-2026-06-04-001 is fixed (can_manage_domain repaired), the diagnostic's `create_moderation_action` test will hit RLS denial for non-admin test actors. The test handles this with `isRlsDenied` → `makeSkipped`, which is acceptable. But the design means that during the current window (can_manage_domain broken), any authenticated user running diagnostics in DEV mode can write to `moderation.actions` without moderation authorization.

2. **Dev build sharing:** If a developer shares a DEV build URL (e.g., local tunnel / staging without NODE_ENV=production), `/dev/diagnostics` is accessible to any authenticated user who reaches it. There is no role-based protection at the route or screen level — only the build-time flag.

3. **Session actorId dependency:** `ensureActorContext` resolves actorId from the active session. The write is always attributed to the session's own actor. This is correctly session-bound. The concern is the absence of a moderation role check, not identity spoofing.

#### Missing Defense

- No role-based guard (`assertModerationAccess` or equivalent) on the diagnostics route or screen
- No runtime `import.meta.env.DEV` check at the point of each diagnostic test run (only at route render)
- Post-VENOM-fix: diagnostic test assertions need to expect RLS denial for non-admin test users (VENOM-2026-06-04-004 gap)

#### Proposed Patch (Advisory Only — Do Not Apply)

**Runtime guard in `runReportsGroup`:**
```js
// reports.group.js — add at top of runReportsGroup function
if (!import.meta.env.DEV) {
  return [] // Never execute in production
}
```

**Post-fix diagnostic assertion update (VENOM-2026-06-04-004 scope, not ELEKTRA):**
The `create_moderation_action` test already has `isRlsDenied → makeSkipped`. This is correct. No code change needed there once Batch 1 lands.

---

## ELEKTRA Finding Summary

| ID | Severity | Status | Title |
|---|---|---|---|
| ELEK-MODERATION-2026-06-04-001 | MEDIUM | OPEN | reporter_actor_id not session-pinned at controller layer |
| ELEK-MODERATION-2026-06-04-002 | LOW | INFO | actions actor_id injection blocked by RLS — multi-actor edge case only |
| ELEK-MODERATION-2026-06-04-003 | HIGH (pre-fix) / LOW (post-fix) | OPEN | updateReportRowStatus — no actor ownership check; DB policy currently broken |
| ELEK-MODERATION-2026-06-04-004 | — | PASS | block_actor RPC — defense-in-depth confirmed |
| ELEK-MODERATION-2026-06-04-005 | — | REFUTED | skipReportEventsInsertForSession flag does not exist in live code |
| ELEK-MODERATION-2026-06-04-006 | MEDIUM | OPEN | moderatorActorId not session-bound — audit trail poisoning path |
| ELEK-MODERATION-2026-06-04-007 | MEDIUM | OPEN | Dev diagnostics write moderation tables without role check |

---

## VENOM Cross-Reference

| VENOM Finding | ELEKTRA Chain | ELEKTRA Verdict |
|---|---|---|
| VENOM-2026-06-04-001 (CRITICAL — can_manage_domain) | Chain 3, Chain 7 | AMPLIFIES — updateReportRowStatus is open to all until fixed; diag writes also unguarded |
| VENOM-2026-06-04-002 (HIGH — dead controllers) | Chain 6 | EXTENDS — confirms moderatorActorId injection risk is latent but real |
| VENOM-2026-06-04-003 (MEDIUM — moderatorActorId) | Chain 6 | INDEPENDENTLY CONFIRMED — full source-to-sink traced |
| VENOM-2026-06-04-004 (MEDIUM — diag write no assert) | Chain 7 | CONFIRMED + NUANCED — build-time guard exists; post-fix RLS will reject |
| VENOM-2026-06-04-005 (HIGH — BEHAVIOR.md missing) | All chains | No behavioral contract to anchor Must Never Happen invariants |

---

## SEC-002 Re-Assessment

**Finding:** The VENOM 2026-05-10 review (SEC-002) and the remediation plan documented a `skipReportEventsInsertForSession` module-level flag that permanently silences `report_events` inserts after one RLS denial.

**ELEKTRA Verdict:** This flag is ABSENT from the live code. The live `insertReportEventRow` returns `{ row: null, error }` on failure — no module-level state mutation. The controller destructures `skipped` from the return value but this field is never set, making the destructuring dead code.

**Residual structural gap:** No `moderation_report_events_insert_self` INSERT RLS policy exists. Any reporter's `report_events` INSERT fails silently (42501 caught, non-fatal). The audit trail is incomplete for all reports. This is SEC-006 and is confirmed active. The Batch 2 SQL proposal must be promoted.

---

## Highest New ELEKTRA Severity

**MEDIUM** — Two independent MEDIUM findings (ELEK-001: reporter_actor_id injection; ELEK-006: moderatorActorId audit trail poisoning). ELEK-003 is HIGH pre-VENOM-fix but does not introduce a new CRITICAL that supersedes VENOM-2026-06-04-001.

**THOR Release Blocker:** No new ELEKTRA CRITICAL findings. Existing VENOM-2026-06-04-001 CRITICAL remains the THOR blocker. ELEK-003 (HIGH, pre-fix) confirms that the VENOM-001 THOR block is correct — the severity extends to report status manipulation, not just data visibility.

---

## Suggested Fix Priority

1. **P0 (THOR BLOCKER):** Deploy Batch 1 (can_manage_domain fix) — resolves VENOM-001, ELEK-003
2. **P1 (Pre-moderator-dashboard):** Session-bind moderatorActorId in moderationActions.controller.js — resolves ELEK-006
3. **P1:** Session-bind reporterActorId in createReportController — resolves ELEK-001
4. **P2:** Deploy Batch 2 (report_events insert self policy) — resolves SEC-006
5. **P2:** Add runtime DEV guard in runReportsGroup — hardens ELEK-007
6. **P3:** Author BEHAVIOR.md — prerequisite for BLACKWIDOW runtime verification (VENOM-005)

---

*ELEKTRA V2 — Precision scan complete. Read-only. No source files modified.*
*Scan scope: VCSM moderation feature, 7 chains, 12 write surfaces.*
*Provenance: All findings derived from direct source read + scanner callgraph topology.*
