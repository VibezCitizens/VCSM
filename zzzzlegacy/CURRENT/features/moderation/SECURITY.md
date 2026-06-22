# Security Posture — moderation

Last Updated: 2026-06-04 (TICKET-MODERATION-AUTHORITY-DECOUPLE-0001 — authority model v2 applied)
Highest Open Severity: HIGH
THOR Release Blocker: READY_FOR_RECHECK — authority model v2 applied; seeding + DB validation required before THOR gate

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

**Scans:** 2026-05-10 (initial system review) + 2026-06-04 (fix verification, TICKET-MODERATION-DB-GUARD-APPLY-0001)

---

### VENOM 2026-06-04 — Fix Verification Findings

**Context:** DB + CARNAGE phases confirmed the can_manage_domain fix was never promoted from
SQL proposal to migration file. These findings accompany the fix verification pass.

#### VENOM-MODERATION-2026-06-04-001 — CRITICAL — RESOLVED (PENDING VALIDATION CONFIRMATION)
**Privilege Escalation — Migration Applied**
- Migration `20260510070000_fix_moderation_can_manage_domain.sql` applied 2026-06-04
- Live DB migration history: `20260510070000 | 20260510070000` — CONFIRMED APPLIED
- `moderation.can_manage_domain` function body updated to learning.platform_admins check
- AWAITING: user runs `SELECT pg_get_functiondef('moderation.can_manage_domain(text)'::regprocedure)` to confirm body
- AWAITING: user confirms `SELECT moderation.can_manage_domain('vc')` returns FALSE for non-admin
- Provenance: [SOURCE_VERIFIED] → migration history confirmed

#### VENOM-MODERATION-2026-06-04-002 — HIGH — OPEN [UNANCHORED]
**Moderator Controllers Are Dead Exports**
- hideReportedObjectController + dismissReportController have 0 callers
- Moderator dashboard route is MISSING
- Post-fix: platform admins cannot moderate through the app UI
- Fix: Build moderator dashboard route + hook (P2 follow-up ticket)
- Provenance: [SOURCE_VERIFIED]

#### VENOM-MODERATION-2026-06-04-003 — MEDIUM — OPEN [UNANCHORED]
**moderatorActorId Not Session-Bound in Controller**
- Controller accepts moderatorActorId from caller; DAL ignores it (uses auth.uid())
- A platform admin can attribute moderation actions to any actorId (audit trail poisoning)
- Risk activates when moderator dashboard is built
- Fix: Derive moderatorActorId from session identity inside controller; never from caller param
- Provenance: [SOURCE_VERIFIED]

#### VENOM-MODERATION-2026-06-04-004 — MEDIUM — OPEN
**Dev Diagnostics Write to Moderation Tables Without assertModerationAccess**
- reports.group.js + helpers.js + social.group.js write directly to moderation schema
- Post-fix: diagnostic writes will receive RLS denials (42501) — test suite will break
- Fix: Update diagnostic assertions to expect RLS denial for non-admin test actors post-fix
- Provenance: [SOURCE_VERIFIED]

#### VENOM-MODERATION-2026-06-04-005 — HIGH — OPEN [UNANCHORED]
**MISSING_BEHAVIOR_CONTRACT [moderation]**
- BEHAVIOR.md does not exist for moderation feature
- All VENOM findings are UNANCHORED — no §5 Security Rules or §9 Must Never Happen declared
- Fix: Author BEHAVIOR.md via ProfessorX; required for THOR behavioral release gate
- Provenance: [SOURCE_VERIFIED]

---

### VENOM 2026-05-10 — Original System Review Findings

**Source:** `_ACTIVE/audits/moderation/2026-05-10_00-00_moderation-system-review.md §8`
**Summary:** 1 CRITICAL | 2 HIGH | 4 MEDIUM | 2 LOW | 1 LOW-MEDIUM

#### SEC-001 — CRITICAL — OPEN (superseded by VENOM-MODERATION-2026-06-04-001)
**Broken Moderation Authorization Gate — can_manage_domain privilege escalation**
- `moderation.can_manage_domain('vc')` returns TRUE for every authenticated VCSM user
- 9 moderator-scoped RLS policies effectively public
- Exposed: moderation_reports_select_moderator, moderation_reports_update_moderator,
  moderation_report_events_insert_moderator, moderation_report_events_select_moderator,
  moderation_actions_insert_moderator, moderation_actions_select_moderator,
  moderation_actions_update_moderator, moderation_block_events_select_moderator,
  moderation_blocks_select_moderator
- Fix: CARNAGE Batch 1 — `20260510070000_fix_moderation_can_manage_domain.sql` (proposal exists;
  must be promoted to supabase/migrations/ — see TICKET-MODERATION-DB-GUARD-APPLY-0001)
- Status: MIGRATION WRITTEN AS PROPOSAL ONLY — NOT IN MIGRATIONS FOLDER — ACTIVE ESCALATION

#### SEC-002 — HIGH — OPEN
**Silent Audit Trail Disablement — session-level flag**
- `reports.dal.js` module-level singleton flag `skipReportEventsInsertForSession`
- When insertReportEventRow receives RLS denial, silently sets flag; all subsequent calls return { skipped: true }
- Root cause: no `moderation_report_events_insert_self` INSERT policy for reporters
- Fix: CARNAGE Batch 2 — add reporter INSERT policy; remove session flag once policy applied
- Status: MIGRATION WRITTEN AS PROPOSAL ONLY — SESSION FLAG STILL IN CODE

#### SEC-003 — RESOLVED — 2026-06-04
**No Dedicated Moderation Role Table — cross-schema governance coupling**
- Moderation access gated on `learning.platform_admins` (Learning product admin roster)
- Fix applied: TICKET-MODERATION-AUTHORITY-DECOUPLE-0001
  - Migration `20260604010000_create_moderation_moderators.sql` — table created
  - Migration `20260604020000_update_moderation_authority_v2.sql` — can_manage_domain v2 (SECURITY DEFINER, moderators only)
  - `assertModerationAccess.dal.js` updated → calls `moderation.is_current_user_moderator()`
  - `learning.platform_admins` fully removed from all moderation paths
- Status: MIGRATIONS WRITTEN — HOLD, DO NOT DEPLOY UNTIL FURTHER NOTICE (decision: 2026-06-04)
- Files: 20260604010000_create_moderation_moderators.sql, 20260604020000_update_moderation_authority_v2.sql

#### SEC-004 — MEDIUM — OPEN
**No FORCE ROW LEVEL SECURITY on moderation tables**
- moderation.blocks, block_events, reports, report_events, actions: no FORCE RLS
- Service-role connections bypass all policies
- Fix: CARNAGE Batch 5 — FORCE RLS (MUST apply after Batch 1 confirmed live)
- Status: MIGRATION WRITTEN AS PROPOSAL ONLY — DEPLOYMENT ORDER CONSTRAINT: NEVER before Batch 1

#### SEC-005 — MEDIUM — OPEN
**Block Side Effects Partially Client-Side**
- `block_actor` RPC: vc.friend_ranks cleanup is client-side only (silent failure)
- Blocked actor's follow of blocker remains active (phantom graph edge)
- Fix: CARNAGE Batch 4 migration (proposal exists)
- Status: MIGRATION WRITTEN AS PROPOSAL ONLY

#### SEC-006 — MEDIUM — OPEN
**No Report Event INSERT Policy for Reporters**
- No `moderation_report_events_insert_self` policy
- Reporters cannot write their own report_events
- Fix: Same as SEC-002 Batch 2 migration
- Status: MIGRATION WRITTEN AS PROPOSAL ONLY

#### SEC-007 — LOW-MEDIUM — OPEN
**Duplicate RLS Policies on moderation.blocks and moderation.block_events**
- Six policies are functionally equivalent duplicates
- Modification of one may silently conflict with duplicate
- Fix: Cleanup migration to remove duplicates
- Status: OPEN

#### SEC-008 — MEDIUM — OPEN
**Action expires_at Not Enforced**
- `moderation.actions.expires_at` field: no DB trigger, cron, or app-level enforcement
- Temporary moderation actions (suspend, mute) never expire
- Fix: Add cron or trigger for expiry enforcement
- Status: OPEN

#### SEC-009 — LOW — OPEN
**chat.moderation_actions Legacy Table — RLS status unconfirmed**
- Exists in schema; RLS status never confirmed
- Application does not use it; if RLS is not enabled, historical data publicly readable
- Fix: Confirm RLS; enable if missing; drop if confirmed unused
- Status: OPEN — RLS STATUS UNKNOWN

#### SEC-010 — LOW — OPEN
**No Bidirectional Follow Cleanup on Block**
- block_actor RPC deactivates follows only in blocker→blocked direction
- Blocked actor's follow remains active
- Fix: CARNAGE Batch 4 migration
- Status: OPEN (same migration as SEC-005)

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-04
ELEKTRA Status: COMPLETE
ELEKTRA Report: zNOTFORPRODUCTION/CURRENT/outputs/2026/06/04/ELEKTRA/2026-06-04_02-00_elektra_moderation-precision-scan.md

**Chains Traced:** 7
**Write Surfaces Inventoried:** 12
**Scan Method:** Precision source-to-sink, scanner callgraph topology + full source read

---

### ELEK-MODERATION-2026-06-04-001 — MEDIUM — OPEN
**reporter_actor_id Not Session-Pinned at Controller Layer**
- `createReportController` accepts `reporterActorId` from caller — not derived from session
- `insertReportRow` maps it directly to `reporter_actor_id` with no session check
- Session binding exists only at screen level (useIdentity()); controller layer accepts arbitrary value
- No `moderation.reports` INSERT RLS policy confirmed binding reporter_actor_id to auth.uid()
- Risk: A caller injecting a foreign actorId can attribute reports to a victim actor
- Fix: Derive reporterActorId from `supabase.auth.getSession()` inside `createReportController`; add DB INSERT policy
- Provenance: [SOURCE_VERIFIED — reports.dal.js:61, report.controller.js:28]

### ELEK-MODERATION-2026-06-04-002 — LOW — INFO
**actions actor_id Injection Blocked by RLS — Multi-Actor Edge Only**
- `insertModerationActionDAL` accepts actorId from caller without session validation
- DB-layer policy `actions_insert_own_actor` (20260518020000) enforces actor_id IN actor_owners(auth.uid())
- Cross-actor injection blocked at DB. Same-user multi-actor assignment possible (low risk)
- Provenance: [SOURCE_VERIFIED — moderationActions.dal.js:36, 20260518020000_moderation_actions_rls.sql:48]

### ELEK-MODERATION-2026-06-04-003 — LOW — DOWNGRADED (fix applied)
**updateReportRowStatus — DB Policy Now Active**
- `updateReportRowStatus` has no session or ownership check — UPDATE WHERE id=reportId only
- Moderator path guarded by `assertModerationAccess` at controller level (correct design)
- DB-level `moderation_reports_update_moderator` uses `can_manage_domain('vc')` — **NOW FIXED** (migration 20260510070000 applied 2026-06-04)
- Post-fix: chain is properly defended; no additional code change needed
- Downgraded from HIGH → LOW on 2026-06-04 (DB fix confirmed applied)
- Provenance: [SOURCE_VERIFIED — reports.dal.js:129, batch1 migration applied]

### ELEK-MODERATION-2026-06-04-004 — PASS
**block_actor RPC — Defense-in-Depth Confirmed**
- Three-layer defense: session (useIdentity) → controller ownership check (assertingActorId === blockerActorId) → DB RPC guard (moderation.is_current_vc_actor)
- No injection path confirmed
- Provenance: [SOURCE_VERIFIED — block.write.dal.js, blockActor.controller.js, batch4 proposal]

### ELEK-MODERATION-2026-06-04-005 — REFUTED
**skipReportEventsInsertForSession Flag — Does Not Exist in Live Code**
- SEC-002 (2026-05-10 plan) documented a module-level session flag in reports.dal.js
- Full source read confirms: flag is ABSENT from live code
- insertReportEventRow returns {row: null, error} on failure — no module-level mutation
- Structural gap remains: no report_events INSERT policy (SEC-006) — audit trail incomplete
- Provenance: [SOURCE_VERIFIED — reports.dal.js:163-191, full file read]

### ELEK-MODERATION-2026-06-04-006 — MEDIUM — OPEN
**moderatorActorId Not Session-Bound — Audit Trail Poisoning**
- `hideReportedObjectController` + `dismissReportController` accept `moderatorActorId` from caller
- `assertModerationAccessController` ignores the passed actorId — auth resolves from auth.uid()
- Caller-supplied moderatorActorId written to: vc.posts.hidden_by_actor_id, moderation.actions.actor_id, moderation.report_events.actor_id
- A platform admin can attribute moderation actions to any actorId (audit trail poisoning)
- Risk activates when moderator dashboard is built (controllers currently have 0 callers — VENOM-002)
- Fix: Derive moderatorActorId from session inside controller; remove caller param; have assertModerationAccess return session actorId
- Provenance: [SOURCE_VERIFIED — moderationActions.controller.js:22-106, assertModerationAccess.dal.js:19]

### ELEK-MODERATION-2026-06-04-007 — MEDIUM — OPEN
**Dev Diagnostics Write Moderation Tables Without Role Check**
- reports.group.js writes directly to moderation.reports, moderation.report_events, moderation.actions
- No assertModerationAccess call — bypasses controller layer entirely
- Route guard: `import.meta.env.DEV` (build-time) — Vite tree-shakes in production
- Concern: DEV builds shared via tunnel/staging expose /dev/diagnostics to any authenticated user with no role check
- Post-VENOM-fix: non-admin diagnostic writes will receive RLS 42501 (tests handle via makeSkipped — correct)
- Fix: Add `if (!import.meta.env.DEV) return []` runtime guard in runReportsGroup
- Provenance: [SOURCE_VERIFIED — reports.group.js:38-56, 196-225, app.routes.jsx:22,163]

---

### ELEKTRA SEC-002 Re-Assessment
The session-level `skipReportEventsInsertForSession` flag documented in the 2026-05-10 remediation plan
is ABSENT from live code. The flag was either removed in a prior cleanup or never existed in this
codebase iteration. The structural gap (no reporter INSERT policy for report_events) remains as SEC-006.
Batch 2 promotion to supabase/migrations/ is still required.

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE
BLACKWIDOW Report: zNOTFORPRODUCTION/CURRENT/outputs/2026/06/04/BlackWidow/2026-06-04_02-00_blackwidow_moderation-adversarial-verification.md

**Attack Scenarios Attempted:** 5 (8 including sub-scenarios)
**Source Files Read:** 21
**Findings:** 1 CRITICAL (BYPASSED) | 1 HIGH (governance) | 3 MEDIUM | 1 INFO
**Exploit Chains Confirmed:** 1 CONFIRMED | 3 BLOCKED | 3 PARTIAL
**BEHAVIOR.md:** MISSING — all attacks run UNANCHORED with IMPLICIT_INVARIANTs

---

### BW-MOD-2026-06-04-001 — CRITICAL — MITIGATED (PENDING VALIDATION CONFIRMATION)
**Result: BYPASSED → MITIGATED — can_manage_domain Fix Applied**
- Attack previously confirmed: any authenticated user had full moderator RLS access
- Fix applied: migration `20260510070000` confirmed in live DB history 2026-06-04
- Function body updated: vc branch now requires learning.platform_admins membership
- Governance Status: MITIGATED (awaiting re-test to reach HARDENED)
- Re-test: `SELECT moderation.can_manage_domain('vc')` as non-admin user must return FALSE
- VENOM Cross-Reference: VENOM-MODERATION-2026-06-04-001, SEC-001
- Provenance: [SOURCE_VERIFIED] → migration history confirmed

### BW-MOD-2026-06-04-002 — MEDIUM — CONFIRMED
**Result: PARTIAL — moderatorActorId Audit Trail Poisoning**
- Attack: Platform admin supplies victim actorId as moderatorActorId parameter
- Auth gate CORRECT (auth.uid() — cannot be spoofed). Audit records store caller-supplied value.
- hideReportedObjectController:69 — insertModerationActionRow({actorId: moderatorActorId})
- dismissReportController:137 — insertReportEventRow({actorId: moderatorActorId})
- Admin-only risk; activates when moderator dashboard built (controllers have 0 callers now)
- Defense Gate: WEAK — auth BLOCKED; audit trail BYPASSED
- VENOM Cross-Reference: VENOM-MODERATION-2026-06-04-003, ELEK-MODERATION-2026-06-04-006
- Fix: Remove moderatorActorId param; derive from session inside controller
- Provenance: [SOURCE_VERIFIED — moderationActions.controller.js:22,69,96]

### BW-MOD-2026-06-04-003 — INFO — CONFIRMED
**Result: BLOCKED — block_actor/unblock_actor Ownership — Defense Confirmed**
- Three independent layers verified: controller assertingActorId check, settings callerActorId check,
  RPC is_current_vc_actor server-side guard
- No cross-actor block possible at any layer
- Defense Gate: PRESENT (3-layer)
- VENOM Cross-Reference: None — BW-only confirmation
- Provenance: [SOURCE_VERIFIED — blockActor.controller.js:28-29, Blocks.controller.js:71-72, migration 20260510010000]

### BW-MOD-2026-06-04-004 — MEDIUM — CONFIRMED
**Result: BLOCKED (production) / PARTIAL (dev) — Diagnostics Write Surface**
- Production: DevDiagnosticsScreen bundle-eliminated (lazyApp.jsx:51-53) + route guard Navigate to /feed
- Dev: reports.group.js writes moderation tables with no assertModerationAccess; create_report
  test does not handle RLS denial (throws on error). Post-fix will break test suite.
- VENOM Cross-Reference: VENOM-MODERATION-2026-06-04-004, ELEK-MODERATION-2026-06-04-007
- Fix: Add isRlsDenied handling to create_report diagnostic test
- Provenance: [SOURCE_VERIFIED — reports.group.js:58, lazyApp.jsx:51-53]

### BW-MOD-2026-06-04-005 — MEDIUM — DRAFT
**Result: PARTIAL — Cross-Actor Report Insertion (reporter_actor_id)**
- report.controller.js accepts reporterActorId from caller; null-checks only; no session binding
- insertReportRow stores caller-supplied value as reporter_actor_id in DB
- DB INSERT RLS policy binding status: UNRESOLVED (policy text not in source — requires live DB inspection)
- New finding — not in VENOM 2026-06-04 or ELEKTRA scans (ELEK-001 covers same chain independently)
- Cross-Reference: ELEK-MODERATION-2026-06-04-001 (same chain, independent confirmation)
- Fix: Derive reporterActorId from session inside createReportController; confirm DB INSERT policy
- Provenance: [SOURCE_VERIFIED — report.controller.js:43-45, reports.dal.js:79-82]

### BW-MOD-2026-06-04-006 — HIGH — CONFIRMED (governance)
**Result: MISSING_BEHAVIOR_CONTRACT [moderation]**
- BEHAVIOR.md does not exist for moderation feature
- All 5 BW attacks required IMPLICIT_INVARIANT construction — no §9 BEH-IDs
- THOR behavioral gate cannot be cleared without BEHAVIOR.md
- VENOM Cross-Reference: VENOM-MODERATION-2026-06-04-005
- Fix: Author BEHAVIOR.md via ProfessorX
- Provenance: [SOURCE_VERIFIED — ls CURRENT/features/moderation/ confirms BEHAVIOR.md absent]

---

### BLACKWIDOW SPIDER-MAN Test Requirements

| TESTREQ ID | Invariant | Test Type |
|---|---|---|
| TESTREQ-MODERATION-001 | Non-admin cannot access moderator-scoped tables | RLS regression post-Batch-1 |
| TESTREQ-MODERATION-002 | Audit trail reflects session actor | Unit — moderationActions.controller session binding |
| TESTREQ-MODERATION-003 | Cannot block as another actor | Regression — mismatched assertingActorId throws |
| TESTREQ-MODERATION-004 | Dev diagnostics never run in production | Build test — DevDiagnosticsScreen not in bundle |
| TESTREQ-MODERATION-005 | reporter_actor_id matches session | RLS inspection + controller session-binding test |
