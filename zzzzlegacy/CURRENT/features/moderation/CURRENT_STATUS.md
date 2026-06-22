# CURRENT_STATUS — moderation

**As of:** 2026-06-02
**Source sprint:** 2026-05-10 (moderation system review + DB remediation plan)

---

## Command Coverage

| Command | Status | Date | Notes |
|---|---|---|---|
| ARCHITECT | COMPLETED | 2026-05-10 | Full system map; schema, flow, controller/DAL inventory |
| VENOM | COMPLETED | 2026-05-10 | 10 findings (1 CRITICAL, 2 HIGH, 4 MEDIUM, 2 LOW + 1 LOW-MEDIUM) |
| KRAVEN | COMPLETED | 2026-05-10 | Performance findings (see moderation-system-review.md §9) |
| DB | COMPLETED | 2026-05-10 | Full RLS inventory; all moderation tables documented |
| CARNAGE | PLAN WRITTEN | 2026-05-10 | 6-batch migration plan written; NOT YET APPLIED |
| ELEKTRA | NOT_STARTED | — | Not evidenced in source files |
| SENTRY | NOT_STARTED | — | Not evidenced in source files |
| SPIDER-MAN | NOT_STARTED | — | Not evidenced in source files |
| FALCON | NOT_STARTED | — | Not evidenced in source files |

---

## Moderation Capability Status (as of 2026-05-10 audit)

| Capability | Status | Notes |
|---|---|---|
| Report actor/post/comment/message/conversation | IMPLEMENTED | Functional |
| Report deduplication | IMPLEMENTED | Controller-level dedupe_key |
| Actor-scoped post/comment hide | IMPLEMENTED | Functional |
| Conversation spam cover + undo | IMPLEMENTED | Two paths (report modal + chat engine) |
| Block / unblock actor | IMPLEMENTED | RPC-backed, atomic |
| View own blocks list | IMPLEMENTED | Settings privacy |
| Feed block filter | IMPLEMENTED | Client cache + DB RLS dual enforcement |
| Chat block filter (direct only) | IMPLEMENTED | RLS on chat.messages; group chats NOT covered |
| Post RLS block exclusion | IMPLEMENTED | Both directions |
| Moderator hide content globally | IMPLEMENTED | Admin-only, no dashboard |
| Moderator dismiss report | IMPLEMENTED | Admin-only, no dashboard |
| Block audit trail | IMPLEMENTED | moderation.block_events |
| Report audit trail | BROKEN | Reporter INSERT RLS policy missing; session-level flag disables all audit writes (SEC-002) |
| Admin-only report queue | MISSING | No dashboard route |
| moderation.moderators table | MISSING | Planned, never created |
| Report priority triage UI | MISSING | Field exists, no UI |
| Report assignment flow | MISSING | Fields exist, no flow |
| Content expiry enforcement | MISSING | expires_at field exists, no trigger |
| Group chat block enforcement | PARTIAL | Direct chats only |

---

## DB Migration Status (CARNAGE plan — 2026-05-10, audited 2026-06-04)

**Status as of 2026-06-04 DB + CARNAGE audit (TICKET-MODERATION-DB-GUARD-APPLY-0001)**

| Migration | Batch | Description | Status |
|---|---|---|---|
| `20260510070000_fix_moderation_can_manage_domain.sql` | Batch 1 | Fix broken `can_manage_domain` vc branch | **SQL PROPOSAL ONLY — FILE NEVER CREATED IN supabase/migrations/** |
| `20260510060000_reporter_insert_policy.sql` | Batch 2 | Add reporter INSERT policy on report_events | SQL PROPOSAL ONLY — FILE NOT IN MIGRATIONS |
| `20260510080000_fix_block_actor_rpc.sql` | Batch 4 | Fix block_actor RPC bidirectional follow cleanup | SQL PROPOSAL ONLY — FILE NOT IN MIGRATIONS |
| `20260510090000_moderation_indexes.sql` | Batch 6 | Add indexes | SQL PROPOSAL ONLY — FILE NOT IN MIGRATIONS |
| Batch 3 | — | Create moderation.moderators table | PLANNED, NOT WRITTEN |
| Batch 5 | — | FORCE RLS on moderation tables | SQL PROPOSAL ONLY — must deploy AFTER Batch 1 is verified |

**CRITICAL — Previous "WRITTEN, NOT APPLIED" status was incorrect.**
All Batch 1-6 SQL exists only as proposals in:
`zNOTFORPRODUCTION/_ACTIVE/planning/moderation-db-remediation/sql-proposals/`
None have been promoted to `apps/VCSM/supabase/migrations/`.

**Deployment order constraint:** Batch 5 (FORCE RLS) must NEVER apply before Batch 1 (fix can_manage_domain). Applying FORCE RLS to broken policies locks out service_role without fixing the privilege escalation.

---

## App-Layer Status (updated 2026-06-04)

**RESOLVED — `assertModerationAccess.dal.js` has been fixed.**

The previously documented "Critical App-Layer Bug" (vc UUID queried against learning actor IDs)
has been corrected. The DAL now calls `learning.is_current_user_platform_admin()` via RPC,
which resolves from `auth.uid()` server-side.

**Remaining risk:** `learning.is_current_user_platform_admin()` existence in the live DB
has not been confirmed via direct SQL query. Must be verified before Batch 1 push (Pre-Step C
of CARNAGE plan).

---

## CARNAGE Migration Status (2026-06-04)

Migration Safety Status: CAUTION
Blast radius: VCSM — moderation schema (9 policies) + 15 additional security migrations
Rollback survivability: FULL
Pre-steps required before push: 3 (see BLOCKERS.md)
Last run: 2026-06-04
CARNAGE report: CURRENT/outputs/2026/06/04/Carnage/2026-06-04_00-30_carnage_moderation-can-manage-domain-migration-plan.md

---

## THOR Gate (2026-06-04)

Date: 2026-06-04
FINAL DECISION: READY_FOR_RECHECK
Ticket: TICKET-MODERATION-MIGRATION-PROMOTION-0002

Previous decision: BLOCKED (TICKET-MODERATION-DB-GUARD-APPLY-0001)

What changed:
- BLOCKER-MOD-001: CLOSED — migration file created and applied (20260510070000 confirmed in live history)
- BLOCKER-MOD-002: CLOSED — duplicate timestamp resolved (20260527130000 in place)
- VENOM-2026-06-04-001: PENDING VALIDATION — migration applied; awaiting user validation queries
- BW-MOD-001: PENDING VALIDATION — same as above

New blocker discovered during push:
- BLOCKER-MOD-004: Migration 20260527080000 failed (policy already exists) — 8 migrations still pending (see BLOCKERS.md)

Remaining to reach READY:
- User confirms validation queries (pg_get_functiondef + can_manage_domain('vc') returns FALSE)
- BLOCKER-MOD-004 resolved (new CARNAGE ticket for migration idempotency)

THOR report: CURRENT/outputs/2026/06/04/Thor/2026-06-04_01-30_thor_moderation-db-push-release-gate.md
