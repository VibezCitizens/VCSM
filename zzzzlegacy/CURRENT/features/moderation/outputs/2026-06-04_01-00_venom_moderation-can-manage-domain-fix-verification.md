# VENOM V2 SECURITY REVIEW
**Ticket:** TICKET-MODERATION-DB-GUARD-APPLY-0001
**Date:** 2026-06-04
**Feature:** moderation
**Application Scope:** VCSM
**Mode:** Fix verification — `moderation.can_manage_domain` privilege escalation closure

---

## Output Metadata

| Field | Value |
|---|---|
| Feature | moderation |
| Command | VENOM V2 |
| Ticket | TICKET-MODERATION-DB-GUARD-APPLY-0001 |
| Scanner Version | 1.1.0 |
| Output Path | CURRENT/outputs/2026/06/04/Venom/2026-06-04_01-00_venom_moderation-can-manage-domain-fix-verification.md |
| Timestamp | 2026-06-04T01:00:00 |
| Prior Phase | DB (2026-06-04_00-15) + CARNAGE (2026-06-04_00-30) |

---

## 1. VENOM Scanner Preflight

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Freshness Window: 3 days

| Map               | Generated At             | Age | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map | 2026-06-03T00:22:42.771Z | 24h | FRESH     | HIGH       | PASS   |
| rpc-map           | 2026-06-03T00:22:42.771Z | 24h | FRESH     | HIGH       | PASS   |
| edge-function-map | 2026-06-03T00:22:42.771Z | 24h | FRESH     | HIGH       | PASS   |
| security-path-map | 2026-06-03T00:22:42.771Z | 24h | FRESH     | HIGH       | PASS   |
| route-execution-map | 2026-06-03T00:22:42.771Z | 24h | FRESH   | HIGH       | PASS   |
| write-execution-map | 2026-06-03T00:22:42.771Z | 24h | FRESH   | HIGH       | PASS   |
| rpc-execution-map | 2026-06-03T00:22:42.771Z | 24h | FRESH     | HIGH       | PASS   |
| edge-execution-map | 2026-06-03T00:22:42.771Z | 24h | FRESH    | HIGH       | PASS   |

Overall Preflight: PASS
Write surfaces in scope: 14 (moderation schema table writes)
RPC surfaces in scope: 3 (block_actor ×2, is_current_user_platform_admin ×1, unblock_actor ×2 — 5 total)
Edge function surfaces in scope: 0
Security paths in scope: 32
HIGH confidence paths (resolved): 0
LOW confidence paths (unresolved): 32
```

All 32 moderation security paths have LOW confidence (no route resolved). This is expected — the moderation controller functions `hideReportedObjectController` and `dismissReportController` are dead exports with no hook or screen callers in the current app. LOW confidence paths were reviewed using the LOW Confidence Review Protocol (§V2.4). See Finding VENOM-MODERATION-2026-06-04-002.

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Surfaces In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-03T00:22:42.771Z | 24h | FRESH | HIGH | 14 (moderation table) | Primary attack surface inventory |
| rpc-map | 2026-06-03T00:22:42.771Z | 24h | FRESH | HIGH | 5 RPCs | RPC surface inventory |
| edge-function-map | 2026-06-03T00:22:42.771Z | 24h | FRESH | HIGH | 0 | Edge function surface inventory (none in scope) |
| security-path-map | 2026-06-03T00:22:42.771Z | 24h | FRESH | HIGH | 32 | Security path inventory |
| write-execution-map | 2026-06-03T00:22:42.771Z | 24h | FRESH | HIGH | 14 | Write surface caller chain resolution |
| rpc-execution-map | 2026-06-03T00:22:42.771Z | 24h | FRESH | HIGH | 5 | RPC caller chain resolution |

---

## 3. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: moderation
Scan Date: 2026-06-03T00:22:42.771Z

Write Surfaces: 14 (moderation schema only; excludes cross-schema chat/vc writes from controllers)
  INSERT: 7 | UPDATE: 2 | DELETE: 3 | UPSERT: 0 | RPC: 2 (moderation.null — block_actor/unblock_actor)
  Tables affected: moderation.reports, moderation.report_events, moderation.actions, moderation.blocks

RPC Calls: 3 in VCSM scope
  Schema: moderation:block_actor (from block + settings features)
  Schema: moderation:unblock_actor (from block + settings features)
  Schema: learning:is_current_user_platform_admin (from moderation feature only)

Edge Functions: 0 (no edge functions touch moderation schema)

Security Paths: 32
  HIGH confidence (caller chain resolved): 0
  LOW confidence (caller chain unresolved): 32
  Access=protected: 0 (no route resolved)
  Access=public: 0
  Access=unknown: 32

Execution Paths Resolved: 0 / 32 (all LOW confidence — moderation controllers are dead exports)
```

---

## 4. Scanner Signals

| Signal | Source Map | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|
| DELETE moderation.reports at reports.group.helpers.js | write-surface-map | HIGH | YES — dev/diagnostics group, no assertModerationAccess, no DEV guard on write | [SOURCE_VERIFIED] | VENOM-MODERATION-2026-06-04-004 |
| INSERT moderation.reports at reports.group.js | write-surface-map | HIGH | YES — dev/diagnostics group, no assertModerationAccess check on insert path | [SOURCE_VERIFIED] | VENOM-MODERATION-2026-06-04-004 |
| RPC learning:is_current_user_platform_admin at assertModerationAccess.dal.js | rpc-map | HIGH | YES — confirmed at line 24; auth.uid() resolved server-side; correct pattern | [SOURCE_VERIFIED] | CLEAR (no finding) |
| RPC moderation:block_actor at block.write.dal.js | rpc-map | HIGH | YES — confirmed; block feature, not moderator escalation path | [SOURCE_VERIFIED] | CLEAR (separate concern) |
| 32 security paths with access=unknown | security-path-map | LOW | YES — traced: hideReportedObjectController + dismissReportController have 0 callers | [SOURCE_VERIFIED] | VENOM-MODERATION-2026-06-04-002 |
| moderatorActorId caller-supplied in controller | N/A (source read) | N/A | YES — line 22, 108; moderatorActorId from param, not session | [SOURCE_VERIFIED] | VENOM-MODERATION-2026-06-04-003 |

---

## 5. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: CURRENT/features/moderation/BEHAVIOR.md
BEHAVIOR.md exists: NO
BEHAVIOR.md status: MISSING
§5 Security Rules declared: 0 (file absent)
§5 Rules verified in source: N/A
§5 Rules unenforced: UNKNOWN — no contract exists
§9 Must Never Happen declared: 0 (file absent)
§9 Invariants protected in source: N/A
§9 Invariants unprotected: UNKNOWN

Finding: MISSING_BEHAVIOR_CONTRACT [moderation]
Severity: HIGH — per VENOM behavior contract integration rules
Note: Security posture cannot be fully evaluated without declared Security Rules (§5) and
      Must Never Happen invariants (§9). WOLVERINE intake required.
      All VENOM findings below are marked UNANCHORED where behavior contract would provide closure.
```

---

## 6. Trust Boundary Findings

---

### VENOM-MODERATION-2026-06-04-000 — FIX VERIFICATION POSITIVE
**[SOURCE_VERIFIED]**

```
VENOM SECURITY FINDING
- Finding ID: VENOM-MODERATION-2026-06-04-000
- Location: zNOTFORPRODUCTION/_ACTIVE/planning/moderation-db-remediation/sql-proposals/
             batch1_20260510070000_fix_moderation_can_manage_domain.sql
- Application Scope: VCSM
- Platform Surface: Supabase RLS / DB function
- Trust Boundary: Moderator
- Boundary Violated: N/A (this is a POSITIVE finding — fix is structurally correct)
- Contract Violated: None (fix closes violation)
- Current behavior: moderation.can_manage_domain('vc') returns TRUE for all vc.actor_owners
- After fix: returns TRUE only for learning.platform_admins members (via learning.actor_owners)
- Risk: NONE introduced by the fix
- Severity: N/A (positive finding)
- Exploitability: N/A
- Attack Preconditions: N/A
- Blast Radius: Security-wide (closes privilege escalation across 9 RLS policies simultaneously)
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: DIRECT — function is the sole gate on all 9 moderator-scoped policies
- Why it matters:
    Fix SQL is structurally correct. The replacement body uses the IDENTICAL EXISTS pattern
    as the already-correct 'learning' branch. The `COALESCE(ao.is_void, false) = false` guard
    is preserved. The collapse of 'chat' and 'system' into the same branch as 'vc' is correct
    (they were both previously hardcoded to FALSE — now they share the admin-only check).
    No unintended scope changes.
- Recommended mitigation: PROCEED with migration (after Pre-Steps A/B/C from CARNAGE)
- Rationale: Confirmed via source read of the proposal file and cross-check against original
    ROLLBACK SQL (which shows the original broken implementation). Fix is safe and minimal.
- Follow-up command: THOR (release gate)
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Assessment and Testing
```

---

### VENOM-MODERATION-2026-06-04-001 — CRITICAL — Privilege Escalation STILL LIVE
**[SOURCE_VERIFIED]**

```
VENOM SECURITY FINDING
- Finding ID: VENOM-MODERATION-2026-06-04-001
- Location: moderation.can_manage_domain (live DB function — not in migrations/)
- Application Scope: VCSM
- Platform Surface: Supabase Table/View — RLS (9 policies)
- Trust Boundary: Authenticated Citizen (current — all users as moderators)
- Boundary Violated: Authenticated Citizen → Moderator
- Contract Violated: Actor Ownership Contract; Boundary Isolation Contract
- Current behavior:
    can_manage_domain('vc') returns TRUE for every authenticated user who has any actor in
    vc.actor_owners (= every onboarded user on the platform). The 9 moderation moderator-scoped
    RLS policies are open to all authenticated users. Any user can read all reports, update any
    report status, insert audit events, and read/write all moderation actions and block events
    via direct Supabase JS client.
- Risk: Full moderation system accessible to all authenticated users via direct API
- Severity: CRITICAL
- Exploitability: HIGH
- Attack Preconditions:
    - Authenticated VCSM account (any user)
    - Supabase JS client or REST API call
    - Knowledge of Supabase URL and anon key (publicly distributed in app bundle)
    - No other conditions
- Blast Radius: Admin/moderation (all moderation data for all users)
- Identity Leak Type: Moderation-state leakage (reporter identities, report content, all block events)
- Cache Trust Type: Moderation-sensitive
- RLS Dependency: DIRECT — fix is entirely at the DB function layer
- Why it matters:
    Every authenticated user can read the full report queue, identify who reported whom,
    suppress active reports, inject false audit events, and read all block relationships.
    Behavioral PII of every user who has ever filed a report or been blocked is exposed.
    This has been live since at least 2026-05-10 (25+ days).
- Recommended mitigation:
    Execute the three CARNAGE pre-steps; then run supabase db push --linked.
    The fix is authored and verified. The only action needed is file creation + push.
- Rationale: DB phase confirmed function fix was never promoted from proposal to migration file.
    CARNAGE confirmed migration is safe (CAUTION status, FULL rollback). No code changes required.
- Follow-up command: THOR (release gate post-apply)
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Operations, Asset Security
```

---

### VENOM-MODERATION-2026-06-04-002 — HIGH — Moderator Controllers Are Dead Exports
**[SOURCE_VERIFIED] [UNANCHORED — no BEHAVIOR.md]**

```
VENOM SECURITY FINDING
- Finding ID: VENOM-MODERATION-2026-06-04-002
- Location: apps/VCSM/src/features/moderation/controllers/moderationActions.controller.js
- Application Scope: VCSM
- Platform Surface: PWA (no active route)
- Trust Boundary: Moderator
- Boundary Violated: None (controllers are unreachable — this is a governance gap, not an escalation)
- Contract Violated: None
- Current behavior:
    hideReportedObjectController and dismissReportController are exported but have
    ZERO callers in the codebase. No hook, screen, or route invokes these controllers.
    The moderation admin dashboard route is MISSING. All moderator actions (hide content,
    dismiss reports) are unreachable through the application layer.
- Risk:
    1. After DB fix is applied and can_manage_domain starts returning FALSE for non-admins:
       legitimate platform admins cannot moderate through the app because there is no UI.
    2. Any future developer who adds a hook or screen connecting to these controllers
       may inherit the moderatorActorId attribution issue (Finding -003 below).
    3. The diagnostic group test files will break post-fix (they relied on open policies
       to succeed their writes). This is a test infrastructure risk.
- Severity: HIGH (post-fix: moderators are locked out of the app layer; pre-fix: no impact)
- Exploitability: LOW (controllers are unreachable — no exploit path exists)
- Attack Preconditions: N/A — unreachable
- Blast Radius: Admin/moderation
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE (controllers not reachable)
- Why it matters:
    The DB fix closes the privilege escalation but simultaneously creates a state where
    platform admins cannot perform moderation via the app. The moderator dashboard has
    been missing since the feature was written. This is a functional gap that must be
    addressed in a follow-up ticket.
- Recommended mitigation:
    Do NOT block the DB fix for this. The security fix takes priority.
    Create a follow-up ticket: build the moderator dashboard route + hook that
    wires to hideReportedObjectController and dismissReportController.
    Resolve Finding -003 (session binding) before the dashboard ships.
- Follow-up command: Wolverine (feature ticket for moderator dashboard)
- CISSP Domain:
  - Primary: Security Operations
  - Secondary: Software Development Security
```

---

### VENOM-MODERATION-2026-06-04-003 — MEDIUM — moderatorActorId Not Session-Bound
**[SOURCE_VERIFIED] [UNANCHORED — no BEHAVIOR.md]**

```
VENOM SECURITY FINDING
- Finding ID: VENOM-MODERATION-2026-06-04-003
- Location: apps/VCSM/src/features/moderation/controllers/moderationActions.controller.js:22,108
- Application Scope: VCSM
- Platform Surface: PWA (currently unreachable — risk activates when dashboard is built)
- Trust Boundary: Moderator
- Boundary Violated: Moderator → Moderator (audit trail poisoning)
- Contract Violated: Actor Ownership Contract (moderatorActorId not verified = session actor)
- Current behavior:
    hideReportedObjectController({ moderatorActorId, reportId }) accepts moderatorActorId
    from the caller. assertModerationAccessController(moderatorActorId) is called but the
    DAL completely ignores the actorId parameter — authorization resolves from auth.uid()
    via learning.is_current_user_platform_admin() (server-side RPC).
    The moderatorActorId is then written into moderation.actions.actor_id and used in
    report audit events (actor_id field) — but never verified to equal the session actor.
- Risk:
    A legitimate platform admin can attribute moderation actions to any actorId, including
    actors they do not own. The audit trail (moderation.actions, report_events) can be
    poisoned with false actor attribution. A moderator could frame another actor as having
    taken a moderation action.
    Note: This risk is theoretical at present because the controllers have no callers.
    It becomes real the moment a moderator dashboard is built.
- Severity: MEDIUM
- Exploitability: LOW (controllers unreachable; exploitability becomes HIGH when dashboard ships)
- Attack Preconditions:
    - Must be a legitimate platform admin (learning.platform_admins)
    - Moderator dashboard must exist (currently MISSING)
    - Must supply a victim actorId in place of their own
- Blast Radius: Admin/moderation (audit trail integrity)
- Identity Leak Type: Actor correlation (false attribution in audit trail)
- Cache Trust Type: Moderation-sensitive
- RLS Dependency: REQUIRED — RLS does not check actor_id against auth.uid() for moderator policies
- Why it matters:
    Moderation audit trails are legal/compliance records. False attribution corrupts the
    evidentiary chain for any moderation action taken. Must be fixed before the dashboard ships.
- Recommended mitigation:
    Derive moderatorActorId from the session identity inside the controller:
    1. Call useIdentity() (hook) or resolve actorId from the session at the hook layer
    2. Never accept moderatorActorId as a parameter from the caller
    3. The controller should call assertModerationAccessController(sessionActorId)
       where sessionActorId is derived from the app's identity context, not a parameter
    Alternatively: add a cross-check that verifies the passed actorId is owned by auth.uid()
    before use (e.g., via actor_owners query).
- Follow-up command: SPIDER-MAN (add regression test when dashboard is built)
- CISSP Domain:
  - Primary: Security Operations
  - Secondary: Identity and Access Management, Software Development Security
```

---

### VENOM-MODERATION-2026-06-04-004 — MEDIUM — Dev Diagnostics Write to Moderation Tables Without Guard
**[SOURCE_VERIFIED]**

```
VENOM SECURITY FINDING
- Finding ID: VENOM-MODERATION-2026-06-04-004
- Location:
    apps/VCSM/src/dev/diagnostics/groups/reports.group.js
    apps/VCSM/src/dev/diagnostics/groups/reports.group.helpers.js
    apps/VCSM/src/dev/diagnostics/groups/social.group.js
- Application Scope: VCSM
- Platform Surface: PWA (dev diagnostics panel)
- Trust Boundary: Authenticated Citizen (current — open policies allow it)
- Boundary Violated: Authenticated Citizen → Moderation data (via open can_manage_domain)
- Contract Violated: None (these are dev tools; the issue is post-fix impact)
- Current behavior:
    Three diagnostic group files write directly to moderation schema tables:
      reports.group.js: INSERT → moderation.reports, report_events, actions
      reports.group.helpers.js: DELETE → moderation.reports, actions
      social.group.js: INSERT/UPDATE → moderation.blocks
    These writes succeed today ONLY because can_manage_domain('vc') returns TRUE for all users.
    None of these files call assertModerationAccessController.
- Risk:
    POST-FIX: After can_manage_domain is fixed, these diagnostic writes will receive
    RLS denials (42501). The diagnostics panel test suite for moderation will break.
    INSERT/DELETE on moderator-scoped tables will fail for non-admin test users.
    PRE-FIX: The diagnostics are successfully testing that moderation write paths work
    for any authenticated user — which is the bug the fix closes. These diagnostics
    inadvertently demonstrate the escalation.
- Severity: MEDIUM (post-fix impact on diagnostics; no production security risk from dev tooling itself)
- Exploitability: LOW (these are test utilities; should not be accessible in production builds)
- Attack Preconditions:
    - Diagnostics panel must be accessible (should be dev-only but this has not been source-verified)
    - User must be authenticated
- Blast Radius: Single actor (diagnostics tests fail; no data exposure from the diagnostics themselves)
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: DIRECT — these writes currently succeed only because of open policies
- Why it matters:
    After the DB fix, the diagnostic suite for moderation will need to be updated.
    The tests that currently pass by exploiting the open policy will either need
    separate moderator-scoped test accounts (learning.platform_admins entries)
    or must be redesigned to test the expected DENIED behavior instead.
    Recommendation: treat diagnostic RLS denials as PASS (expected behavior post-fix).
- Recommended mitigation:
    1. DO NOT block the DB fix for this.
    2. After fix is applied, update reports.group.js + helpers to expect RLS denial
       on moderator-scoped writes for non-admin test actors (change assertion from
       "expect success" to "expect denied/isRlsDenied").
    3. Create a platform-admin-scoped test account in learning.platform_admins if
       full moderator write flow diagnostics are needed.
- Follow-up command: SPIDER-MAN (update diagnostic assertions post-fix)
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Assessment and Testing
```

---

### VENOM-MODERATION-2026-06-04-005 — HIGH — MISSING_BEHAVIOR_CONTRACT [moderation]
**[SOURCE_VERIFIED]**

```
VENOM SECURITY FINDING
- Finding ID: VENOM-MODERATION-2026-06-04-005 (UNANCHORED)
- Location: CURRENT/features/moderation/BEHAVIOR.md — MISSING
- Application Scope: VCSM
- Platform Surface: Supabase Table/View, PWA (moderation system broadly)
- Trust Boundary: Moderator / Authenticated Citizen
- Boundary Violated: None (governance gap, not an active escalation)
- Contract Violated: Boundary Isolation Contract (governance completeness)
- Current behavior:
    No BEHAVIOR.md exists for the moderation feature. VENOM cannot cross-check §5 Security
    Rules or §9 Must Never Happen invariants. All findings in this report are UNANCHORED.
- Risk:
    Without declared invariants:
      - No formal "Must Never Happen" exists to prevent regression of this privilege escalation
      - After the DB fix is applied, future schema changes could silently re-open the vulnerability
      - THOR cannot formally close this finding as a release gate item
      - SPIDER-MAN cannot anchor regression tests to behavioral requirements
- Severity: HIGH
- Exploitability: LOW (governance gap — not directly exploitable)
- Attack Preconditions: N/A
- Blast Radius: Governance-wide (moderation security posture unanchored)
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED
- Why it matters:
    The DB fix closes today's vulnerability. Without a BEHAVIOR.md contract that declares
    "can_manage_domain MUST return FALSE for non-platform-admins" as a §9 invariant,
    the same class of bug can silently re-appear in a future migration.
- Recommended mitigation:
    Author BEHAVIOR.md for moderation as a P1 follow-up.
    §9 Must Never Happen must include:
      BEH-MOD-001: A non-platform-admin user MUST NEVER receive a truthy result from
        moderation.can_manage_domain for any domain value
      BEH-MOD-002: A non-moderator actor MUST NEVER be able to update a report status
        via direct DB client
      BEH-MOD-003: Moderation audit events (report_events) MUST be attributed to the
        actual session actor — never to a caller-supplied actorId
- Follow-up command: ProfessorX (BEHAVIOR.md authoring)
- CISSP Domain:
  - Primary: Security Assessment and Testing
  - Secondary: Security and Risk Management
```

---

## 7. Source Verification Summary

| Surface | File | Source Read | Finding |
|---|---|---|---|
| can_manage_domain fix SQL | batch1_20260510070000_fix_moderation_can_manage_domain.sql | YES | POSITIVE — fix is correct |
| assertModerationAccess.dal.js | src/features/moderation/dal/assertModerationAccess.dal.js | YES | CLEAR — correct RPC pattern |
| assertModerationAccess.controller.js | src/features/moderation/controllers/assertModerationAccess.controller.js | YES | -003 (moderatorActorId not session-bound) |
| moderationActions.controller.js | src/features/moderation/controllers/moderationActions.controller.js | YES | -002 (dead exports), -003 |
| reports.group.js | src/dev/diagnostics/groups/reports.group.js | YES | -004 (no guard, post-fix breakage) |
| Edge functions | apps/VCSM/supabase/functions/* | YES (5 functions, none moderation) | CLEAR |
| can_manage_domain callsites | supabase/migrations/* + src/* | YES (grep) | CLEAR — no app-layer callsites; DB-only function |

Total surfaces in scope: 7
Surfaces source-verified: 7 / 7
CRITICAL findings: 1 — all [SOURCE_VERIFIED]: YES ✓

---

## 8. Confidence Summary

| Metric | Value |
|---|---|
| HIGH confidence surfaces | 14 write + 5 RPC |
| LOW confidence surfaces | 32 security paths (all — moderation controllers dead) |
| [SOURCE_VERIFIED] findings | 5 (including 1 positive) |
| [SCANNER_LEAD] findings | 0 |
| [SCANNER_LOW_CONF] findings | 0 |

**LOW confidence security paths resolved via manual trace:** All 32 paths traced to `hideReportedObjectController` and `dismissReportController` — both confirmed dead exports with 0 callers. Finding VENOM-MODERATION-2026-06-04-002.

---

## 9. THOR Impact

```
THOR Release Blockers:
  VEN-MODERATION-2026-06-04-001 — CRITICAL: can_manage_domain privilege escalation still live
    → Blocks release until DB fix is applied and validated
  VEN-MODERATION-2026-06-04-005 — HIGH: MISSING_BEHAVIOR_CONTRACT [moderation]
    → Per THOR behavioral release gate: BEHAVIOR.md must exist before THOR clearance

Highest Open Severity: CRITICAL
THOR Recommendation: BLOCKED pending CARNAGE pre-steps (A, B, C) + supabase db push + post-apply validation
```

---

## 10. Required Follow-Up Commands

| Command | Reason | Priority |
|---|---|---|
| THOR | Release gate — clear after CARNAGE pre-steps + push + post-apply validation | P0 |
| ProfessorX | Author BEHAVIOR.md for moderation (required for THOR behavioral gate) | P0 |
| SPIDER-MAN | Update diagnostic assertions post-fix; anchor regression tests to BEH IDs once authored | P1 |
| Wolverine | Create ticket for moderator dashboard route + hook (Finding -002) | P2 |

---

## 11. Mitigation Plan

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VENOM-2026-06-04-001 | Privilege escalation live | RLS (DB function) | P0 | DB | THOR post-apply |
| VENOM-2026-06-04-002 | Moderator controllers unreachable | Controller + Router | P2 | App | Wolverine |
| VENOM-2026-06-04-003 | moderatorActorId not session-bound | Controller | P1 | App | SPIDER-MAN |
| VENOM-2026-06-04-004 | Diagnostic assertions will break post-fix | Test Coverage | P1 | App | SPIDER-MAN |
| VENOM-2026-06-04-005 | BEHAVIOR.md missing | Documentation | P0 (THOR gate) | Security | ProfessorX |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | Finding -005 (governance gap — no behavioral contract) |
| Asset Security | 1 | Finding -001 (moderation PII exposed to all authenticated users) |
| Security Architecture and Engineering | 1 | Finding -001 (can_manage_domain gate insufficiency) |
| Communication and Network Security | 0 | Not applicable — no edge function or external API surface |
| Identity and Access Management | 3 | Findings -000, -001, -003 (authorization gate, privilege escalation, session binding) |
| Security Assessment and Testing | 2 | Findings -004, -005 (diagnostic breakage, missing behavioral contract) |
| Security Operations | 2 | Findings -002, -003 (dead controllers, audit trail poisoning) |
| Software Development Security | 2 | Findings -003, -004 (session binding gap, diagnostic code pattern) |

**Uncovered domains:** Communication and Network Security — out of scope (no network surface in the moderation fix).

---

*VENOM V2 complete — 2026-06-04 | TICKET-MODERATION-DB-GUARD-APPLY-0001*
*Persisted to: CURRENT/outputs/2026/06/04/Venom/2026-06-04_01-00_venom_moderation-can-manage-domain-fix-verification.md*
