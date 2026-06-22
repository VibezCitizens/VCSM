# DB — Notifications Schema: RLS Audit

**Date:** 2026-05-19  
**Application Scope:** VCSM  
**Feature:** Notifications — `notification` schema core tables  
**Trigger:** CEREBRO verification pass on `vcsm.dal.notifications.md` — IF-3 (IRONMAN finding: RLS ownership unverified)  
**Analysis Mode:** READ-ONLY — static migration file analysis + architecture review  
**Live DB Query Status:** NOT EXECUTED — static analysis only

---

## Analysis Scope

Tables under review:

| Table | Schema | Write Owner |
|---|---|---|
| `recipients` | `notification` | `@notifications` engine |
| `inbox_items` | `notification` | `@notifications` engine |
| `events` | `notification` | `@notifications` engine |
| `rendered` | `notification` | `@notifications` engine |
| `event_categories` | `notification` | `@notifications` engine (reference data) |

---

## Migration Files Inspected

| File | Path | Notification Schema Coverage |
|---|---|---|
| `secdef_b_zero_policy_tables.sql` | `_ACTIVE/migrations/2026-05-10_secdef_b_zero_policy_tables.sql` | `notification.event_categories` ONLY — public-read reference table |
| `step2_rls_policy_repairs.sql` | `_ACTIVE/migrations/2026-05-10_step2_rls_policy_repairs.sql` | NO notification tables |
| `secdef_c_rls_disabled_tables.sql` | `_ACTIVE/migrations/2026-05-10_secdef_c_rls_disabled_tables.sql` | NO notification tables |

**Total notification schema RLS coverage in static migration files: 1 of 5 tables (event_categories only)**

---

## Findings

---

```
DATABASE REVIEW ITEM
- Object: notification.recipients
- Application Scope: VCSM
- Current behavior: Table is written by @notifications engine RPCs (insert_recipients,
  update_recipient_status). No RLS policy found in any of the three inspected migration
  files. RLS state unknown from static analysis.
- Problem: If RLS is disabled or absent on this table, any authenticated user could
  read recipient rows belonging to other actors. The engine DAL scopes reads by
  recipientActorId parameter, but this is application-level enforcement only —
  it does not prevent direct table reads or PostgREST access outside the engine path.
- Why it matters: notification.recipients maps notification events to recipient actorIds.
  Exposure would reveal who has received what notifications, which actors are in a given
  user's social graph, and volume/frequency signals. This is private metadata.
- Recommended improvement: Verify via live DB inspection (SELECT schemaname, tablename,
  policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname = 'notification'
  AND tablename = 'recipients'). If no policy exists, add read-restricting RLS:
  recipients visible only to the authenticated recipient actor.
- Rationale: Application-layer scoping (controller/DAL param) is insufficient without
  a corresponding DB-level RLS gate. Defense in depth requires both.
- Risk if unchanged: Any authenticated user who queries notification.recipients directly
  via PostgREST or service key can read all notification recipient mappings.
- Example SQL proposal (text only, do not run):
    CREATE POLICY "recipients_read_own" ON notification.recipients
      FOR SELECT USING (
        recipient_actor_id = (SELECT actor_id FROM vc.actors WHERE auth_id = auth.uid())
      );
```

---

```
DATABASE REVIEW ITEM
- Object: notification.inbox_items
- Application Scope: VCSM
- Current behavior: Table stores per-recipient inbox entries. Written by
  insertNotificationInboxItemDAL. No RLS policy found in any inspected migration file.
- Problem: inbox_items links recipient_id to notification data. Without RLS, a
  recipient_id from notification.recipients could be used to retrieve another actor's
  inbox rows directly.
- Why it matters: Inbox items represent a user's complete notification history —
  what content they've been notified about, from whom, and when. This is highly
  personal data.
- Recommended improvement: Add RLS joining through notification.recipients to
  constrain inbox_item reads to the authenticated actor.
- Rationale: Same defense-in-depth requirement as recipients.
- Risk if unchanged: Cross-actor inbox read is possible at DB level for any
  authenticated user.
- Example SQL proposal (text only, do not run):
    CREATE POLICY "inbox_items_read_own" ON notification.inbox_items
      FOR SELECT USING (
        recipient_id IN (
          SELECT id FROM notification.recipients
          WHERE recipient_actor_id = (
            SELECT actor_id FROM vc.actors WHERE auth_id = auth.uid()
          )
        )
      );
```

---

```
DATABASE REVIEW ITEM
- Object: notification.events
- Application Scope: VCSM
- Current behavior: Table stores notification event records. Written by
  insertNotificationEventDAL. Read by readNotificationEventsByIdsDAL (batched by
  event IDs resolved from recipient rows). No RLS policy found in static migration files.
- Problem: Events table contains the sender actorId, notification type, and payload data
  for every notification in the system. Without RLS, any authenticated user could read
  event records for notifications sent to other actors.
- Why it matters: Events expose sender identity and notification content (type, reference
  IDs, rendering data) across all actors. Cross-actor event reads would expose social
  graph activity globally.
- Recommended improvement: Events are accessed via IDs resolved from recipient rows.
  If recipients has correct RLS, event exposure is already constrained at application
  layer. However, DB-level RLS on events (restrict to events where a valid recipient
  row exists for the authenticated actor) provides defense in depth.
- Rationale: Defense in depth. Events should not be openly readable.
- Risk if unchanged: Direct PostgREST or service key queries on notification.events
  expose all notification content globally.
- Example SQL proposal (text only, do not run):
    CREATE POLICY "events_read_own_recipients" ON notification.events
      FOR SELECT USING (
        id IN (
          SELECT event_id FROM notification.recipients
          WHERE recipient_actor_id = (
            SELECT actor_id FROM vc.actors WHERE auth_id = auth.uid()
          )
        )
      );
```

---

```
DATABASE REVIEW ITEM
- Object: notification.rendered
- Application Scope: VCSM
- Current behavior: Table stores pre-rendered notification content keyed by recipient_id.
  Written by upsertNotificationRenderedDAL. Read by
  readNotificationRenderedByRecipientIdsDAL. No RLS policy found in static migration files.
- Problem: rendered table contains display-ready notification content per recipient.
  Without RLS, any authenticated user can read rendered notification content for
  other recipients.
- Why it matters: Rendered content may include display text, actor names, content
  previews, or other user-generated content references. Exposure violates recipient
  privacy and content access control.
- Recommended improvement: Constrain reads to the authenticated recipient actor,
  same pattern as inbox_items.
- Rationale: Defense in depth.
- Risk if unchanged: Cross-actor rendered notification content readable at DB level.
- Example SQL proposal (text only, do not run):
    CREATE POLICY "rendered_read_own" ON notification.rendered
      FOR SELECT USING (
        recipient_id IN (
          SELECT id FROM notification.recipients
          WHERE recipient_actor_id = (
            SELECT actor_id FROM vc.actors WHERE auth_id = auth.uid()
          )
        )
      );
```

---

```
DATABASE REVIEW ITEM
- Object: notification.event_categories (reference table — informational)
- Application Scope: VCSM
- Current behavior: Public-read RLS DOCUMENTED in secdef_b_zero_policy_tables.sql.
  This is a reference/lookup table with no PII.
- Problem: None — intentionally public-read.
- Why it matters: Confirms RLS framework is in place for notification schema; the
  absence of policies on the four core tables is therefore not a structural omission
  in the framework but a gap in coverage for PII-carrying tables.
- Recommended improvement: None for this table.
- Risk if unchanged: N/A — reference data, correctly public.
- Example SQL proposal: None required.
```

---

## RLS Coverage Summary

| Table | Schema | RLS Policy in Static Files | Risk |
|---|---|---|---|
| `recipients` | `notification` | NOT FOUND | HIGH |
| `inbox_items` | `notification` | NOT FOUND | HIGH |
| `events` | `notification` | NOT FOUND | HIGH |
| `rendered` | `notification` | NOT FOUND | HIGH |
| `event_categories` | `notification` | PRESENT (public read) | NONE |

---

## Required Action: Live DB Query

Static migration files do not confirm the absence of RLS — they may only capture policies added via migration. Policies may exist that were applied outside migration files (e.g., via Supabase dashboard, seeding scripts, or pre-migration setup).

**Live DB query required to determine authoritative RLS state:**

```sql
-- Text only — do not run automatically
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'notification'
ORDER BY tablename, policyname;
```

This query will reveal whether any RLS policies exist on the core notification tables, regardless of how they were created.

**Secondary check — whether RLS is even enabled on these tables:**

```sql
-- Text only — do not run automatically
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'notification'
ORDER BY tablename;
```

If `rowsecurity = false` for any core table, RLS is not enforced even if policies exist.

---

## Live DB Query Results (2026-05-19 — AUTHORITATIVE)

Live queries executed against linked Supabase project `nkdrjlmbtqbywhcthppm`.

### RLS Enabled Status

All `notification` schema tables have `rowsecurity = t`.

| Table | rowsecurity |
|---|---|
| `recipients` | **TRUE** |
| `inbox_items` | **TRUE** |
| `events` | **TRUE** |
| `rendered` | **TRUE** |
| `preferences` | TRUE |
| `event_categories` | TRUE |
| `event_types` | TRUE |
| `templates` | TRUE |
| `push_subscriptions` | TRUE |
| `delivery_attempts` | TRUE |

### Policies on Core Tables

**notification.recipients (2 policies)**

| Policy | CMD | Enforcement |
|---|---|---|
| `notification_recipients_select_own` | SELECT | `notification.can_access_recipient(...)` — multi-kind ownership check |
| `notification_recipients_no_direct_insert` | INSERT | `WITH CHECK = false` — all direct inserts blocked |

**notification.inbox_items (4 policies)**

| Policy | CMD | Enforcement |
|---|---|---|
| `notification_inbox_items_select_own` | SELECT | EXISTS (recipients → actor_owners WHERE user_id = auth.uid()) |
| `notification_inbox_items_update_own` | UPDATE | Same as SELECT, mirrored in WITH CHECK |
| `notification_inbox_items_no_direct_insert` | INSERT | WITH CHECK = false |
| `notification_inbox_items_no_direct_delete` | DELETE | qual = false — always denied |

**notification.events (2 policies)**

| Policy | CMD | Enforcement |
|---|---|---|
| `notification_events_select_own` | SELECT | source_actor_id = vc.current_actor_id() OR EXISTS (recipients WHERE can_access_recipient()) |
| `notification_events_no_direct_insert` | INSERT | WITH CHECK = false |

**notification.rendered (4 policies)**

| Policy | CMD | Enforcement |
|---|---|---|
| `notification_rendered_select_own` | SELECT | EXISTS (recipients WHERE can_access_recipient()) |
| `notification_rendered_no_direct_insert` | INSERT | WITH CHECK = false |
| `notification_rendered_no_direct_update` | UPDATE | qual = false — always denied |
| `notification_rendered_no_direct_delete` | DELETE | qual = false — always denied |

### `notification.can_access_recipient()` function

Multi-kind recipient ownership switch. Three branches:

```sql
CASE
  WHEN p_recipient_kind = 'app_account' AND p_recipient_user_app_account_id IS NOT NULL
    THEN platform.owns_user_app_account(p_recipient_user_app_account_id)

  WHEN p_recipient_kind = 'actor' AND p_recipient_actor_id IS NOT NULL
    THEN platform.owns_actor_via_app_link(p_recipient_actor_id)

  WHEN p_recipient_kind = 'user' AND p_recipient_user_id IS NOT NULL AND p_recipient_domain = 'platform'
    THEN p_recipient_user_id = auth.uid()

  ELSE false
END
```

Default branch is `false` — unrecognized recipient kinds are denied.

### Security Assessment

| Property | Status | Notes |
|---|---|---|
| RLS enabled | VERIFIED | All 10 tables have rowsecurity = t |
| Read scoping to own | VERIFIED | All four core tables SELECT-scoped to authenticated recipient |
| Direct write protection | VERIFIED | INSERT blocked via WITH CHECK = false on all core tables |
| Direct mutation protection | VERIFIED | UPDATE/DELETE blocked on rendered; DELETE blocked on inbox_items |
| Recipient ownership function | VERIFIED | can_access_recipient() covers app_account, actor, and user kinds; defaults false |
| Events sender read-own path | NOTE | Events policy also allows source_actor_id to read own sent events — by design, not a risk |
| Static migration gap | EXPLAINED | Policies exist but were not found in the three migration files searched — likely applied via a separate migration file or initialization script not in _ACTIVE/migrations/ |

---

## Revised DB Finding Severity Summary

| Finding | Original Severity | Revised Severity | Status |
|---|---|---|---|
| notification.recipients — RLS | HIGH | NONE | **CLOSED — fully implemented** |
| notification.inbox_items — RLS | HIGH | NONE | **CLOSED — fully implemented** |
| notification.events — RLS | HIGH | NONE | **CLOSED — fully implemented** |
| notification.rendered — RLS | HIGH | NONE | **CLOSED — fully implemented** |
| Static migration files missing policies | INFO | INFO | OPEN — migration files should be created for these policies for auditability |

**One minor finding remains:** The RLS policies for core `notification.*` tables are not documented in any static migration file in `_ACTIVE/migrations/`. They exist in the live DB but have no migration trail. CARNAGE should create a documentation migration (or retrospective migration script) to bring the policy definitions under version control.

---

## DB Analysis Status

**COMPLETE** — Live DB query executed. All four core notification tables have RLS enabled with correctly-scoped policies.

Evidence quality: OBSERVED (live DB query)  
Confidence: HIGH  
Blocking: NO — IF-3 is RESOLVED

**IF-3 (IRONMAN) resolution: CLOSED**

---

## Related Findings

- IRONMAN IF-3: `vcsm.notifications.owner.md` §6 — RLS owner listed as "notifications team (not verified in this pass — DB-level audit required)"
- VENOM pass: vportClient deescalated; block filter verified CLEAN; RLS gap flagged as requiring DB command
- SENTRY pass: No RLS violations in application code detected; gap is at DB level only
