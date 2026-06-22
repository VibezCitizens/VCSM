# DB — Barber Module RLS Backstop Verification

**Date:** 2026-05-27
**Time:** 05:42
**Reviewer:** DB
**Application Scope:** VCSM
**Trigger:** Post-patch RLS backstop verification — barber VPORT module (BLACKWIDOW/ELEKTRA audit cycle)
**Mode:** READ-ONLY ANALYSIS — no modifications applied
**Branch:** `vport-booking-feed-security-updates`
**Related Reports:**
- `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_05-42_blackwidow_barber-vport-adversarial.md`
- `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_05-42_elektra_barber-vport-patch-advisory.md`
- `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_05-42_blackwidow_barber-vport-retest.md`

---

## Scope

Verify whether the two tables implicated in THOR-blocked findings carry RLS policies that backstop the controller-layer patches applied by ELEKTRA:

| Table | THOR Findings | Concern |
|---|---|---|
| `vport.resources` | BW-BAR-01 (QR inject), BW-BAR-02 (Force accept) | UPDATE RLS — does DB block unauthorized acceptance? |
| `vc.posts` | BW-BAR-03 (Portfolio inject), BW-BAR-04 (Hours inject) | INSERT RLS — does DB block unauthorized system post creation? |

---

## Live Client Verification

### Supabase Client Used by DAL Layer

`apps/VCSM/src/services/supabase/vportClient.js`:
```js
import { supabase } from '@/services/supabase/supabaseClient'
export const vport = supabase.schema('vport')
export default vport
```

`apps/VCSM/src/services/supabase/supabaseClient.js`:
```js
const client = createClient(url, anon, { auth: { persistSession: true, ... } });
```

**Confirmed:** `vportClient` is the standard Supabase client initialized with `VITE_SUPABASE_ANON_KEY`. All DAL calls through `vportSchema` execute under the authenticated user's JWT session. **RLS is fully enforced.** No service role bypass path exists in the application layer.

---

## Table 1 — `vport.resources`

### Policy Source

Migration `20260515020000_vport_resources_actor_rls_rebuild.sql` rebuilt all 15 legacy overlapping policies into 5 clean actor-based policies:

| Policy Name | Operation | Ownership Check |
|---|---|---|
| `resources_select_public` | SELECT | `is_active = true` + active non-deleted profile exists |
| `resources_select_owner` | SELECT | `actor_owners WHERE actor_id = owner_actor_id AND user_id = auth.uid() AND NOT is_void` |
| `resources_insert_owner` | INSERT | `actor_owners WHERE actor_id = owner_actor_id AND user_id = auth.uid() AND NOT is_void` |
| `resources_update_owner` | UPDATE | `actor_owners WHERE actor_id = owner_actor_id AND user_id = auth.uid() AND NOT is_void` |
| `resources_delete_owner` | DELETE | `actor_owners WHERE actor_id = owner_actor_id AND user_id = auth.uid() AND NOT is_void` |

RLS enabled: YES. Forced: NO (standard).

### Attack Path Analysis — BW-BAR-01/02

**Attack scenario:** Attacker calls `acceptTeamRequestController` or `acceptJoinResourceDAL` with a victim's `resourceId` that they do not own.

**DB gate behavior:**
- Attacker's `auth.uid()` maps to their user account
- Target resource row: `owner_actor_id` = barbershop VPORT (not owned by attacker), `member_actor_id` = victim barber (not owned by attacker)
- `resources_update_owner` USING check: `actor_owners WHERE actor_id = owner_actor_id AND user_id = auth.uid()` → **FAILS** (attacker doesn't own barbershop)
- No other UPDATE policy exists
- **Result: UPDATE blocked at DB layer**

**DB security verdict for BW-BAR-01/02: HARDENED** — attack is blocked at DB layer. Controller gate (assertActorOwnsVportActorController) is the primary backstop; DB provides redundant enforcement.

### Functional Gap Analysis — Missing `resources_update_member` Policy

**Scenario:** Legitimate barber accepts their own team request or QR join.

**Caller profile:**
- Session user = barber
- `auth.uid()` = barber's user UUID
- `member_actor_id` = barber's VPORT actor (owned by barber via `actor_owners`)
- `owner_actor_id` = barbershop VPORT actor (**NOT owned by barber**)

**Affected DAL functions (all use `vportSchema`):**
- `acceptTeamRequestDAL(resourceId, meta)` — updates `is_active`, `meta.status`
- `acceptJoinResourceDAL(resourceId, barberVportActorId, extraMeta)` — updates `member_actor_id`, `is_active`, `meta.status`
- `declineTeamRequestDAL(resourceId, meta)` — updates `meta.status` (when barber declines)
- `acceptTeamInviteByActorDAL(token, barberVportActorId, meta)` — updates `member_actor_id`, `is_active`, `meta.status`

**DB gate behavior for all four:**
- `resources_update_owner` USING: `actor_owners WHERE actor_id = resources.owner_actor_id AND user_id = auth.uid()`
- Barber's `auth.uid()` does NOT match `owner_actor_id` (barbershop)
- **Result: UPDATE blocked at DB layer for legitimate barber acceptance**

**This is a functional gap, not a security gap.** The missing policy does not open an attack surface — it closes a legitimate operation path. The controller-level ownership gate is correct and working; the DB layer simply has no policy that authorizes the member actor to update their own acceptance record.

**Impact:** Barber team acceptance, QR join acceptance, and barber-initiated decline are non-functional against the live database. The feature is broken for end users.

**Verdict for `vport.resources`: PARTIAL**
- Security attack path: HARDENED (unauthorized UPDATE blocked at both controller + DB layers)
- Legitimate member acceptance path: BLOCKED (missing `resources_update_member` policy)
- Migration required before barber acceptance functionality works end-to-end

---

## Table 2 — `vc.posts`

### Policy Source

Migration `20260523010000_backfill_tracked_rls_coverage.sql` (re-created / confirmed live):

```sql
CREATE POLICY posts_insert_actor_owner ON vc.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM vc.actor_owners ao
      WHERE ao.actor_id = posts.actor_id
        AND ao.user_id  = auth.uid()
    )
  );
```

RLS enabled: YES. Forced (`relforcerowsecurity`): **YES — strongest setting.** Applies even to the table owner (postgres role).

### Attack Path Analysis — BW-BAR-03/04

**Attack scenario:** Attacker calls `publishBarbershopPortfolioUpdateAsPostController` or `publishBarbershopHoursUpdateAsPostController` with a victim's `actorId` to create a system post as the victim's barbershop.

**DB gate behavior:**
- Attacker's `auth.uid()` maps to their user account
- `posts.actor_id` = victim barbershop VPORT actor
- `posts_insert_actor_owner` WITH CHECK: `actor_owners WHERE actor_id = posts.actor_id AND user_id = auth.uid()` → **FAILS** (attacker doesn't own barbershop)
- Forced RLS (`relforcerowsecurity = t`) means even elevated roles cannot bypass
- **Result: INSERT blocked at DB layer**

**DB security verdict for BW-BAR-03/04: HARDENED** — attack is blocked at DB layer. Controller gate is primary; DB provides redundant enforcement. Forced RLS provides the strongest possible setting.

**Minor observation (INFO):** `posts_insert_actor_owner` does not include `AND NOT ao.is_void` — unlike the `vport.resources` policies. A void/deactivated actor entry in `actor_owners` could theoretically still satisfy the policy. This is a pre-existing condition unrelated to the barber patches; it applies platform-wide and warrants a separate audit pass.

**Verdict for `vc.posts`: HARDENED**

---

## DATABASE REVIEW ITEM — resources_update_member gap

```
DATABASE REVIEW ITEM
- Object:               vport.resources — missing resources_update_member UPDATE policy
- Application Scope:    VCSM
- Severity:             HIGH (functional gap) — MEDIUM (security impact: none)
- Security bypass detected: NO — attack is blocked; only legitimate operations are affected
- Current behavior:     Only the barbershop owner (owner_actor_id owner) can UPDATE
                        vport.resources rows. The barber (member_actor_id owner) has
                        no UPDATE policy and is blocked by RLS when calling:
                        acceptTeamRequestDAL, acceptJoinResourceDAL,
                        acceptTeamInviteByActorDAL, declineTeamRequestDAL.
- Problem:              Migration 20260515020000_vport_resources_actor_rls_rebuild.sql
                        built the policy set exclusively around the owner pattern.
                        The member acceptance path (barber updates status on their
                        own slot) was not accounted for. There is no
                        resources_update_member policy.
- Why it matters:       Barber team acceptance, QR join acceptance, and barber-initiated
                        decline are non-functional in production. The feature cannot
                        complete its core lifecycle (pending_acceptance → linked).
                        Users receive an RLS error from PostgREST when they attempt
                        to accept a team invite.
- Recommended improvement: Add resources_update_member policy allowing a session user
                        who owns member_actor_id (via actor_owners) to UPDATE the row.
                        Scope the USING clause to rows where member_actor_id IS NOT NULL
                        to avoid applying to unassigned resource slots.
- Rationale:            The barber's acceptance is a legitimate member-side write.
                        The controller already verifies ownership via
                        assertActorOwnsVportActorController before the DAL call.
                        The DB policy needs to authorize the same party the controller
                        already trusts.
- Risk if unchanged:    Barber acceptance feature is completely non-functional in
                        production. Security is not weakened — only legitimate
                        member writes are blocked. But core user flow is broken.
- Example SQL proposal (text only, do not run):

  -- Add UPDATE policy for member actor (barber accepting their slot)
  -- Required for: acceptTeamRequestDAL, acceptJoinResourceDAL,
  --               acceptTeamInviteByActorDAL, declineTeamRequestDAL (member path)
  CREATE POLICY resources_update_member ON vport.resources
    FOR UPDATE
    TO authenticated
    USING (
      member_actor_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM vc.actor_owners ao
        WHERE ao.actor_id = resources.member_actor_id
          AND ao.user_id  = auth.uid()
          AND NOT ao.is_void
      )
    )
    WITH CHECK (
      member_actor_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM vc.actor_owners ao
        WHERE ao.actor_id = member_actor_id
          AND ao.user_id  = auth.uid()
          AND NOT ao.is_void
      )
    );

  -- Note: WITH CHECK validates the NEW member_actor_id value (after update).
  -- This is correct for both acceptTeamRequestDAL (member_actor_id unchanged)
  -- and acceptJoinResourceDAL (member_actor_id set to caller's own actor).
  -- In both cases, the barber's session owns the member_actor_id.

  -- This policy should be bundled as a standalone migration file.
  -- Suggested name: 20260527020000_vport_resources_update_member_policy.sql
  -- Pre-flight: verify no existing resources_update_member policy is live.
  -- Rollback: DROP POLICY resources_update_member ON vport.resources;
```

---

## Final Verdicts

| Table | Security Verdict | Functional Verdict | BLACKWIDOW Findings |
|---|---|---|---|
| `vport.resources` | **HARDENED** — attack blocked at DB layer | **PARTIAL** — member acceptance blocked; migration required | BW-BAR-01, BW-BAR-02 |
| `vc.posts` | **HARDENED** — insert blocked at DB layer; forced RLS | **HARDENED** — no functional gap | BW-BAR-03, BW-BAR-04 |

---

## Impact on THOR Release Gate

| Finding | Controller Layer | DB Layer | Overall | THOR Status |
|---|---|---|---|---|
| BW-BAR-01 — QR inject | HARDENED | HARDENED (attack blocked) | **HARDENED** | Security cleared |
| BW-BAR-02 — Force accept | HARDENED | HARDENED (attack blocked) | **HARDENED** | Security cleared |
| BW-BAR-03 — Portfolio inject | HARDENED | HARDENED | **HARDENED** | Security cleared |
| BW-BAR-04 — Hours inject | HARDENED | HARDENED | **HARDENED** | Security cleared |

**Security gate: ALL 4 THOR blockers are HARDENED at both controller + DB layers.**

**Outstanding migration required:** `resources_update_member` policy is needed for member acceptance to function. This is not a security blocker but is a functional blocker for the barber acceptance feature. THOR should track this as a functional P1 migration to be applied before or immediately after release.

---

## Required Follow-up

| Step | Command | Status |
|---|---|---|
| Apply `resources_update_member` migration | Carnage | **APPLIED** — policy applied live 2026-05-27; migration file created at `20260527020000_vport_resources_update_member_policy.sql` |
| Update BLACKWIDOW re-verification with DB verdicts | BLACKWIDOW | **COMPLETE** |
| Update audit-status.md with final verdicts | LOGAN | **COMPLETE** |
| Evaluate THOR release gate | THOR | **READY** |

---

*DB command is read-only — no modifications applied. All SQL proposals are text-only and must not be executed automatically.*
