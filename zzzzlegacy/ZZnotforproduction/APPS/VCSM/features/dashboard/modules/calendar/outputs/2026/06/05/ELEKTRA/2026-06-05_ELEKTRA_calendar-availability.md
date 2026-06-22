# ELEKTRA Security Report

**Date:** 2026-06-05
**Scope:** VCSM
**Reviewer:** ELEKTRA
**Scan Trigger:** MANUAL — module-level DR_STRANGE row was NOT_RUN; CALENDAR-RLS-001 required verification
**Findings Summary:** 0 HIGH | 1 MEDIUM | 3 LOW | 1 INFO
**False Positives Rejected:** 5
**Suggested Patches:** 4
**THOR Release Blocker:** NO — no HIGH findings; MEDIUM finding has RLS backstop confirmed

---

## ELEKTRA SCAN TARGET

```
Feature / Route / Engine:  VCSM / dashboard / modules / calendar
Application Scope:         VCSM
Reason for scan:           Module-level ELEKTRA first run; CALENDAR-RLS-001 NEEDS_VERIFICATION; confirm
                           IDOR surface on setAvailabilityRuleController ruleId param
Scan trigger:              MANUAL
Areas covered:             01-actor-ownership-idor, 02-controller-input-trust,
                           03-supabase-rls, 04-feed-system-posts
```

---

## Entry Point Map

```
ENTRY POINT MAP
Route:                    /actor/:actorId/dashboard/calendar
Input sources:
  - actorId               URL param → used as ownerActorId / targetActorId (not caller identity)
  - viewerActorId         identity?.actorId from useIdentity() — session-derived
  - resourceId            local state, sourced from owner booking resource list (conditioned on isOwner)
  - ruleId                prop from loaded availability rules; also accepted as DAL param on write
  - ruleType              default "weekly" in controller; no allowlist validation
  - weekday               integer, null-checked only
  - startTime / endTime   strings, presence-checked only
  - blocks (feed publish) array from WeeklyAvailabilityGrid save output

Trusted input boundary:   setAvailabilityRuleController (booking engine)
Validation present:       PARTIAL — ownership present; field-level validation incomplete
```

---

## Executive Summary

The calendar module has a well-constructed ownership chain for its primary write path. `viewerActorId` is consistently session-derived, `isOwner` gating is enforced at the screen level, and `setAvailabilityRuleController` verifies resource ownership via `assertActorOwnsVportActorController` before any write. The feed publish paths hard-code `post_type` and use `PUBLIC_REALM_ID` — no injection surface exists there.

**CALENDAR-RLS-001 is now VERIFIED.** Migration evidence confirms `vport.availability_rules` has RLS enabled with `_actor_owner` policies (actor-based ownership chain via `vc.actor_owners`) and `_manager` policies (SECURITY DEFINER `current_actor_can_manage_resource`). The pre-existing CARNAGE ticket about the legacy `owner_user_id` branch in `current_actor_can_manage_resource` is out of scope for this scan but remains open.

The one MEDIUM finding is a controller-layer defense-in-depth gap: `setAvailabilityRuleController` does not verify that a provided `ruleId` actually belongs to the supplied `resourceId`. The DB-layer RLS UPDATE USING policy provides the primary defense, but the upsert+RLS interaction with RLS-hidden rows has edge cases that should be closed at the controller layer.

Three LOW findings are field-level input validation gaps (no allowlist on `ruleType`, no range check on `weekday`, no format check on `startTime`/`endTime`). None have an ownership escape path; they affect data integrity only.

---

## Medium Findings

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-001
- Title:              setAvailabilityRuleController — ruleId cross-resource injection; missing controller-layer ownership bind
- Category:           IDOR/BOLA
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/controller/setAvailabilityRule.controller.js:6–61
                      apps/VCSM/src/features/booking/dal/upsertAvailabilityRule.dal.js:36–63
- Source:             ruleId parameter in setAvailabilityRuleController — accepted from caller; not
                      verified against resourceId ownership before DAL call
- Sink:               upsertAvailabilityRuleDAL — upsert with onConflict: "id" (line 57)
- Trust Boundary:     setAvailabilityRuleController — verifies resourceId ownership; does not verify
                      that ruleId (when provided) belongs to resourceId
- Impact:             An authenticated actor who owns resource A and knows the UUID of a rule
                      belonging to resource B (owned by another actor) could call
                      setAvailabilityRule({ requestActorId: self, resourceId: A_id, ruleId: B_rule_id, ... }).
                      Controller ownership check passes (they own A). DAL upsert fires with
                      { id: B_rule_id, resource_id: A_id }.
                      DB-layer RLS UPDATE USING filters the existing B_rule row (attacker doesn't own B) —
                      the UPDATE is silently skipped. However, the upsert INSERT path proceeds under the
                      B_rule_id UUID with resource_id = A_id, creating a row that inherits the targeted UUID.
                      Real-world impact: no cross-ownership data mutation is possible (RLS blocks UPDATE).
                      Edge case: depending on PostgreSQL upsert+RLS interaction (INSERT fallback when UPDATE
                      is hidden), attacker could create a rule under A_id using a crafted UUID that collides
                      with another actor's UUID — functionally harmless but architecturally unsound.

- Evidence:
    // controller — ownership verified for resourceId only, not ruleId
    const resource = await getBookingResourceByIdDAL({ resourceId });       // line 34
    await assertActorOwnsVportActorController({                             // line 39
      requestActorId,
      targetActorId: resource.owner_actor_id,
    });
    const saved = await upsertAvailabilityRuleDAL({ row: { id: ruleId ?? undefined, ... } }); // line 44

    // dal — upsert on id with no prior ownership bind of ruleId
    .upsert(payload, { onConflict: "id" })                                  // dal:57

- Reproduction Steps:
    1. Actor A owns resource A_id and knows UUID B_rule_id (from public booking flow exposure or
       side-channel enumeration)
    2. Actor A calls booking adapter setAvailabilityRule({
         requestActorId: A_user_id,
         resourceId:     A_resource_id,
         ruleId:         B_rule_id,    // foreign rule UUID
         ruleType:       "weekly", weekday: 1,
         startTime:      "09:00:00", endTime: "17:00:00",
       })
    3. Controller ownership check passes (A owns A_resource_id)
    4. DAL fires upsert({ id: B_rule_id, resource_id: A_resource_id, ... })
    5. RLS USING on UPDATE filters B's rule → UPDATE skipped → INSERT may proceed

- Existing Defense:   RLS availability_rules_update_actor_owner USING clause scopes UPDATE to
                      rows whose resource_id is owned by auth.uid(). INSERT WITH CHECK scopes
                      to resource_id owned by auth.uid(). Provides DB-layer backstop.

- Why Defense Is Insufficient:
    Controller does not bind ruleId to resourceId before calling the DAL. Defense-in-depth
    principle requires that the controller close the gap before the DB layer handles it.
    The upsert + RLS interaction (INSERT fallback when UPDATE is hidden) is a PostgreSQL
    implementation detail that should not be relied on as the sole trust boundary.

- Recommended Fix:    In setAvailabilityRuleController, when ruleId is provided, load the rule
                      by ID before the upsert and verify rule.resource_id === resourceId. Throw
                      if mismatch. This closes the gap at the controller layer.

- Suggested Patch:
    // In setAvailabilityRule.controller.js, after line 33 (resourceId guard) and before line 34:

    if (ruleId) {
      const existingRule = await listAvailabilityRulesByResourceIdDAL({ resourceId });
      const ruleIsOwned = (Array.isArray(existingRule) ? existingRule : [])
        .some(r => String(r.id) === String(ruleId));
      if (!ruleIsOwned) {
        throw new Error("setAvailabilityRuleController: ruleId does not belong to the specified resourceId");
      }
    }

    // Alternative — simpler using a direct DAL call if a getAvailabilityRuleByIdDAL exists:
    if (ruleId) {
      const rule = await getAvailabilityRuleByIdDAL({ ruleId });
      if (!rule) throw new Error("setAvailabilityRuleController: ruleId not found");
      if (String(rule.resource_id) !== String(resourceId)) {
        throw new Error("setAvailabilityRuleController: ruleId does not belong to resourceId");
      }
    }

- Follow-up Command:  BLACKWIDOW — runtime replay of ruleId injection attack to confirm RLS UPDATE
                      filter behavior in live DB; DB — confirm upsert INSERT fallback behavior when
                      UPDATE is hidden by RLS
```

---

## Low Findings

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-002
- Title:              setAvailabilityRuleController — ruleType enum accepted without allowlist validation
- Category:           Controller Input Trust
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/controller/setAvailabilityRule.controller.js:10
- Source:             ruleType parameter (default "weekly", no allowlist)
- Sink:               upsertAvailabilityRuleDAL rule_type column (dal:line 53 pickDefined → payload)
- Trust Boundary:     setAvailabilityRuleController
- Impact:             An actor can insert availability rules with arbitrary rule_type values
                      (e.g., "exception", "override", "custom") into their own resource's
                      availability_rules table. Booking slot calculation logic that branches on
                      rule_type could behave unexpectedly for unsupported values. No ownership bypass.
- Evidence:
    export async function setAvailabilityRuleController({
      ruleType = "weekly",   // line 10 — no allowlist
      ...
    }) {
      ...
      const saved = await upsertAvailabilityRuleDAL({ row: { rule_type: ruleType, ... } });

- Existing Defense:   Default value of "weekly". No server-side allowlist.
- Why Defense Is Insufficient:  Default only applies to missing values. A caller can supply any string.
- Recommended Fix:    Add allowlist validation:
- Suggested Patch:
    const VALID_RULE_TYPES = Object.freeze(["weekly", "exception"]);
    if (!VALID_RULE_TYPES.includes(ruleType)) {
      throw new Error(`setAvailabilityRuleController: invalid ruleType "${ruleType}"`);
    }

- Follow-up Command:  None required — no ownership breach path.
```

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-003
- Title:              setAvailabilityRuleController — weekday integer not range-validated [0–6]
- Category:           Controller Input Trust
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/controller/setAvailabilityRule.controller.js:24–26
- Source:             weekday parameter — null-checked only
- Sink:               upsertAvailabilityRuleDAL weekday column
- Trust Boundary:     setAvailabilityRuleController
- Impact:             An actor can insert rules with weekday values outside [0–6] (e.g., 7, -1, 99),
                      corrupting their own availability grid. Booking slot calculation code that
                      iterates weekday 0–6 would silently ignore out-of-range rows without error.
- Evidence:
    if (weekday == null) {
      throw new Error("setAvailabilityRuleController: weekday is required");  // null only
    }
    // no range check — weekday=99 passes

- Existing Defense:   Null check only.
- Why Defense Is Insufficient:  Non-null out-of-range integer passes through to the DB.
- Recommended Fix:    Add range guard after null check.
- Suggested Patch:
    const wd = Number(weekday);
    if (!Number.isInteger(wd) || wd < 0 || wd > 6) {
      throw new Error("setAvailabilityRuleController: weekday must be an integer 0–6");
    }

- Follow-up Command:  None required.
```

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-004
- Title:              setAvailabilityRuleController — startTime and endTime not format-validated
- Category:           Controller Input Trust
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/controller/setAvailabilityRule.controller.js:27–34
- Source:             startTime, endTime string parameters — presence-checked only
- Sink:               upsertAvailabilityRuleDAL start_time/end_time columns
- Trust Boundary:     setAvailabilityRuleController
- Impact:             An actor can insert rules with malformed time strings (e.g., "25:99:99",
                      "not-a-time"). SQL injection is not possible (parameterized queries via
                      supabase-js). Effect is data corruption in the actor's own availability_rules,
                      which could cause slot calculation failures for their VPORT.
- Evidence:
    if (!startTime) throw new Error("startTime is required");   // presence only
    if (!endTime)   throw new Error("endTime is required");     // presence only
    // format "HH:MM:SS" or "HH:MM" not validated

- Existing Defense:   Presence check only.
- Why Defense Is Insufficient:  Any truthy string passes to the DB.
- Recommended Fix:    Validate HH:MM or HH:MM:SS format before DAL call.
- Suggested Patch:
    const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
    if (!TIME_RE.test(startTime)) {
      throw new Error("setAvailabilityRuleController: startTime must be HH:MM or HH:MM:SS");
    }
    if (!TIME_RE.test(endTime)) {
      throw new Error("setAvailabilityRuleController: endTime must be HH:MM or HH:MM:SS");
    }

- Follow-up Command:  None required.
```

---

## Info Findings

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-005
- Title:              Post-save availability refresh reads from stale 5-minute TTL cache
- Category:           Controller Input Trust
- Severity:           INFO
- Status:             Open (pre-existing CALENDAR-CACHE-001)
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/controller/getResourceAvailability.controller.js:10
                      apps/VCSM/src/features/dashboard/vport/components/calendar/WeeklyAvailabilityGrid.jsx:131
- Source:             availabilityRefresh() call after save — not preceded by invalidateBookingAvailability()
- Sink:               TTL cache in getResourceAvailabilityController — returns stale data after write
- Trust Boundary:     N/A (no ownership or integrity impact)
- Impact:             After a successful availability save, the follow-up refresh reads from the
                      5-minute TTL cache and may return pre-save data. The grid shows "Saved." but
                      reflects stale rules until cache expiry or route remount. No security impact.
- Evidence:
    const availabilityCache = createTTLCache(300_000);   // 5 min, controller:10
    ...
    // WeeklyAvailabilityGrid.jsx:131 — after all setAvailabilityRule calls succeed:
    await availabilityRefresh();                          // refresh without cache invalidation
    // invalidateBookingAvailability() is exported but not called here

- Existing Defense:   TTL expires after 5 minutes.
- Recommended Fix:    Call invalidateBookingAvailability() in the save path before availabilityRefresh(),
                      or expose a cache-bypassing refresh variant.
- Suggested Patch:
    // In WeeklyAvailabilityGrid.jsx save(), before the availabilityRefresh() call:
    // Import: import { invalidateBookingAvailability } from "@/features/booking/controller/getResourceAvailability.controller";
    invalidateBookingAvailability();
    await availabilityRefresh();

- Follow-up Command:  None — CALENDAR-CACHE-001 tracks this.
```

---

## False Positives Rejected

```
FALSE POSITIVE REJECTED

- Candidate:       Feed post_type injection via barbershop/locksmith hours publish
- Location:        apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopHoursUpdateAsPost.controller.js
                   apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/publishLocksmithHoursUpdateAsPost.controller.js
- Rejection reason: Source link broken — post_type is hardcoded server-side ("barbershop_hours_update",
                   "locksmith_hours_update"); never sourced from client payload
- Chain gap:        Source (client-controlled post_type) — does not exist
- Notes:           sanitizeBlocks() validates block data server-side; realm_id uses PUBLIC_REALM_ID constant
```

```
FALSE POSITIVE REJECTED

- Candidate:       actorId for post attribution — caller identity impersonation
- Location:        apps/VCSM/src/features/profiles/kinds/vport/hooks/barbershop/usePublishBarbershopHoursPost.js
                   apps/VCSM/src/features/profiles/kinds/vport/hooks/locksmith/usePublishLocksmithPost.js
- Rejection reason: callerActorId/identityActorId sourced from identity?.actorId via useIdentity() —
                   session-derived; assertActorOwnsVportActorController verifies the post actorId is
                   owned by the session actor before any write
- Chain gap:        Source (client-controlled actorId) — does not exist; caller identity is from session
```

```
FALSE POSITIVE REJECTED

- Candidate:       viewerActorId from props — session binding concern
- Location:        apps/VCSM/src/features/dashboard/vport/dashboard/cards/calendar/VportDashboardCalendarScreen.jsx:27
- Rejection reason: viewerActorId = identity?.actorId ?? null — sourced from useIdentity()
                   (session context), not from URL params or props
- Chain gap:        Source (client-controlled viewerActorId) — does not exist
```

```
FALSE POSITIVE REJECTED

- Candidate:       Null bypass on ownership check in setAvailabilityRuleController
- Location:        apps/VCSM/src/features/booking/controller/setAvailabilityRule.controller.js:18–23
- Rejection reason: requestActorId null → throws immediately (line 18); resourceId null → throws
                   immediately (line 21); null cannot bypass assertActorOwnsVportActorController
- Chain gap:        Impact (null bypasses ownership) — not present; throws on null before ownership check
```

```
FALSE POSITIVE REJECTED

- Candidate:       resourceId IDOR — non-owner loads foreign resource, bypasses ownership
- Location:        apps/VCSM/src/features/dashboard/vport/dashboard/cards/calendar/VportDashboardCalendarScreen.jsx:32
- Rejection reason: useOwnerBookingResources is conditioned on enabled: isOwner && Boolean(actorId).
                   Even if a foreign resourceId were injected at UI level, setAvailabilityRuleController
                   re-fetches the resource and verifies resource.owner_actor_id against requestActorId —
                   a complete server-side ownership re-verification
- Chain gap:        Sink (write proceeds with unowned resource) — blocked at controller re-verification
```

---

## CALENDAR-RLS-001 Verification

**Prior status:** NEEDS_VERIFICATION / DELEGATED
**New status after migration evidence review:** VERIFIED

Evidence:
- Migration `20260515010000_vport_booking_resource_rls_policies.sql`: `ALTER TABLE vport.availability_rules ENABLE ROW LEVEL SECURITY` confirmed.
- Migration `20260527080000_drop_public_role_policies_phase_a.sql`: Canonical `_manager` policies created using `vport.current_actor_can_manage_resource(resource_id)` for INSERT/UPDATE/DELETE/SELECT.
- Migration `20260527090000` header confirms `_actor_owner` policy family is the survivor of legacy `owner_user_id` policies. These use the canonical `vc.actor_owners` join pattern.
- Both policy families scope all write operations (INSERT WITH CHECK, UPDATE USING + WITH CHECK) to the authenticated user's actor ownership chain.

Active policies on `vport.availability_rules` (from migration chain):
| Policy | Operation | Ownership Pattern |
|---|---|---|
| availability_rules_select_public | SELECT | active resource + active profile |
| availability_rules_select_actor_owner | SELECT | actor_owners join |
| availability_rules_select_manager | SELECT | current_actor_can_view_resource() |
| availability_rules_insert_actor_owner | INSERT | actor_owners join |
| availability_rules_insert_manager | INSERT | current_actor_can_manage_resource() |
| availability_rules_update_actor_owner | UPDATE | actor_owners join (USING + WITH CHECK) |
| availability_rules_update_manager | UPDATE | current_actor_can_manage_resource() |
| availability_rules_delete_actor_owner | DELETE | actor_owners join |
| availability_rules_delete_manager | DELETE | current_actor_can_manage_resource() |

Open concern (pre-existing, out of scope): The CARNAGE comment in `assertActorOwnsVportActor.controller.js` flags a legacy `owner_user_id` branch inside `actor_can_manage_profile` and `actor_can_view_profile` DB functions (ref: migration 20260522020000). `current_actor_can_manage_resource` may invoke `actor_can_manage_profile` internally — this legacy branch should be audited. Cross-referenced to TICKET-BOOKING-RPC-001.

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-05-001 | ruleId cross-resource injection — bind ruleId to resourceId before upsert | MEDIUM | Controller | SIMPLE | NO |
| 2 | ELEK-2026-06-05-002 | ruleType enum allowlist | LOW | Controller | SIMPLE | NO |
| 3 | ELEK-2026-06-05-003 | weekday range validation [0–6] | LOW | Controller | SIMPLE | NO |
| 4 | ELEK-2026-06-05-004 | startTime/endTime format validation HH:MM | LOW | Controller | SIMPLE | NO |

---

## THOR Release Gate Assessment

| Gate | Status | Blocking? |
|---|---|---|
| HIGH findings open | NONE | NO |
| IDOR confirmed exploit path | NO (ELEK-001 — RLS backstop present, no confirmed exploit) | NO |
| Secrets exposure | NONE | NO |
| RLS gap on actor-scoped write path | RESOLVED (CALENDAR-RLS-001 verified) | NO |
| MEDIUM finding (ELEK-001) | OPEN with DB backstop confirmed | CAUTION only |

**THOR Verdict:** No release blockers from this scan. CAUTION maintained for ELEK-2026-06-05-001 until BLACKWIDOW confirms the upsert+RLS interaction edge case is safe.

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| BLACKWIDOW | Runtime replay of ruleId injection: confirm RLS UPDATE filter behavior + upsert INSERT fallback in live DB | PENDING |
| DB | Verify `current_actor_can_manage_resource` does not contain legacy owner_user_id path (CARNAGE cross-ref) | PENDING |
| SPIDER-MAN | Write missing TESTREQ-DASH-calendar-002 (ruleId ownership bind) and TESTREQ-DASH-calendar-006 (RLS bypass) | PENDING |
