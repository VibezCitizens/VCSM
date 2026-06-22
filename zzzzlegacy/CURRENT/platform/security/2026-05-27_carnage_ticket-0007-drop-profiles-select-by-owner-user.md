# CARNAGE MIGRATION REPORT — TICKET-0007: Drop legacy profiles_select_by_owner_user

**Date:** 2026-05-27
**Reviewer:** CARNAGE
**Ticket:** TICKET-0007 — Drop legacy `vport.profiles` SELECT policy `profiles_select_by_owner_user`
**Application Scope:** VCSM
**Mode:** READ-ONLY INVESTIGATION + migration proposal

---

## Application Scope

VCSM

---

## Migration Reason

`profiles_select_by_owner_user` is a legacy SELECT RLS policy on `vport.profiles` that gates
access via `owner_user_id = auth.uid()`. This is the legacy ownership pattern. The canonical
replacement policy `profiles_select_owner` (`actor_can_manage_profile(current_actor_id(), id)`)
already exists and is active on the live DB. Both policies OR together, meaning the legacy
policy is now redundant. It should be dropped to remove the `owner_user_id` path from the
DB-level access gate, consistent with the `owner_user_id` deprecation strategy.

---

## Migration Type

DROP POLICY — no schema change, no data change, no function change.

---

## Migration Safety Status

**CAUTION**

**Confidence:** HIGH
**Blocking Risks:** None on existing data (stranded_owner_count = 0, confirmed 2026-05-23).
One conditional risk in the join flow (see Identity/Ownership Warning below).

---

## SCHEMA TRUST CLASSIFICATION

| Object | Classification | Reason |
|---|---|---|
| `vport.profiles` | Identity-sensitive + Ownership-sensitive | Core VPORT identity; gates dashboard, settings, services |
| `profiles_select_by_owner_user` (drop target) | Ownership-sensitive | Legacy owner SELECT gate — `owner_user_id = auth.uid()` |
| `profiles_select_owner` (survivor) | Ownership-sensitive | Canonical management SELECT via `actor_can_manage_profile` |
| `profiles_select_viewer` (untouched) | Public | Active + non-deleted viewer path |

---

## CURRENT STRUCTURE

### Live DB policies on `vport.profiles` (confirmed 2026-05-27)

| Policy | Cmd | Roles | USING clause |
|---|---|---|---|
| `Public can read listed VPORT profiles` | SELECT | anon, authenticated | `is_active AND is_deleted=false AND directory_visible=true AND directory_status='listed'` |
| `profiles_select_viewer` | SELECT | authenticated | `is_active=true AND is_deleted=false` |
| `profiles_select_by_owner_user` | SELECT | authenticated | `owner_user_id = auth.uid()` |
| `profiles_select_owner` | SELECT | authenticated | `vport.actor_can_manage_profile(vc.current_actor_id(), id)` |
| `profiles_update_by_actor_owner` | UPDATE | authenticated | `actor_owners.actor_id = profiles.actor_id AND actor_owners.user_id = auth.uid()` |
| `profiles_delete_owner` | DELETE | public | `actor_owners.actor_id = profiles.actor_id AND actor_owners.user_id = auth.uid()` |
| `profiles_insert_service_role` | INSERT | public | `current_setting('role') = 'service_role'` |

### `actor_can_manage_profile` function (after 20260523230000)

Single-arg overload (canonical — used by `profiles_select_owner`):
```sql
SELECT EXISTS (
  SELECT 1
  FROM vport.profile_actor_access paa
  JOIN vc.actor_owners ao ON ao.actor_id = paa.actor_id
  WHERE paa.profile_id = p_profile_id
    AND ao.user_id     = auth.uid()
    AND paa.status     = 'active'
    AND COALESCE(ao.is_void, false) = false
);
```

Two-arg overload (compatibility shim): delegates to single-arg, ignores `p_actor_id`.

Both overloads are SECURITY DEFINER. `auth.uid()` is used directly — NOT `current_actor_id()`.

### App code using `profiles_select_by_owner_user` as its RLS gate

Files that query `vport.profiles` with `owner_user_id` in the WHERE clause:

| File | Function | Pattern |
|---|---|---|
| `src/features/vport/dal/vport.core.dal.js` | `listMyVports()` | `.eq("owner_user_id", user.id)` |
| `src/features/vport/dal/vport.read.vportRecords.dal.js` | `listMyVports()` | `.eq("owner_user_id", user.id)` |
| `src/features/settings/vports/dal/vports.read.dal.js` | `readVportBusinessCardSettingsDAL()` | `.eq("owner_user_id", userId)` |
| `src/features/settings/vports/dal/vports.read.dal.js` | `readVportDirectoryStateDAL()` | `.eq("owner_user_id", userId)` |
| `src/features/join/dal/barberVport.read.dal.js` | `readBarberVportByOwnerUserIdDAL()` | `.eq("owner_user_id", userId)` |
| `src/features/join/dal/barberVport.read.dal.js` | `findBarberVportForUserDAL()` | `eq("profile.owner_user_id", userId)` |

**Note:** `account.write.dal.js` line 102 uses `.eq('owner_user_id', userId)` on an UPDATE query — UPDATE is governed by `profiles_update_by_actor_owner`, not `profiles_select_by_owner_user`. Not affected by this drop.

---

## MIGRATION BLAST RADIUS

**Affected systems:** `vport.profiles` SELECT access path for owner queries  
**Runtime impact:** LOW — canonical path (`profiles_select_owner`) already active and covering same rows  
**Release impact:** LOW — no schema/data change; no function change  
**Rollback impact:** FULL — `CREATE POLICY ... USING (owner_user_id = auth.uid())` is the complete rollback

---

## RLS IMPACT REVIEW

| Object | RLS Dependency | Risk | Follow-up Required |
|---|---|---|---|
| `vport.profiles` | DIRECT — drop target is a SELECT policy | LOW — canonical policy already active | None if pre-flight passes |
| `profile_actor_access` | INDIRECT — checked inside `actor_can_manage_profile` | NONE — read path only | None |
| `actor_owners` | INDIRECT — checked inside `actor_can_manage_profile` | NONE — read path only | None |

---

## RUNTIME IMPACT ANALYSIS

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| Dashboard / Settings SELECT | LOW | No change — `profiles_select_owner` already passes | stranded_owner_count = 0 confirmed |
| Join flow: `readBarberVportByOwnerUserIdDAL` | LOW | See join flow analysis below | Pre-flight check recommended |
| `listMyVports()` (legacy DAL) | LOW | No change for fully provisioned VPORTs | stranded_owner_count = 0 confirmed |
| Public VPORT display | NONE | Unaffected — governed by other policies | — |

### Join flow analysis

`readBarberVportByOwnerUserIdDAL` and `findBarberVportForUserDAL` are called from:
- `joinBarbershopAccount.controller.js:getExistingBarberVport()` — called from `checkJoinAuthState` ONLY when the user is logged in AND has no `pending_invite_token` in their metadata (i.e., they have completed a prior join attempt)
- `joinBarbershopQr.controller.js` — scans for an existing barber VPORT via `owner_user_id`

In both cases, the VPORT being queried was created in a completed prior session. A completed VPORT creation flow provisions `profile_actor_access` + `actor_owners` atomically via `createVport`. Therefore, `profiles_select_owner` (via `actor_can_manage_profile`) covers these rows.

**Edge case:** A VPORT created in a partially failed prior session (profile created, actor provisioning incomplete) would be invisible after the drop. The join flow would then proceed to create a new VPORT rather than detecting the orphaned one. This edge case requires a partially failed create operation AND a lack of `pending_invite_token` cleanup — unlikely in practice.

---

## MIGRATION DEPENDENCY GRAPH

| Dependency Type | Affected Area | Risk |
|---|---|---|
| DAL dependency | `vport.core.dal.js`, `vport.read.vportRecords.dal.js`, `vports.read.dal.js`, `barberVport.read.dal.js` | LOW — RLS shifts to `profiles_select_owner` for same rows |
| RLS dependency | `profiles_select_owner` must exist before drop | NONE — already active |
| Engine dependency | None | — |
| External API dependency | None | — |

---

## DATA INTEGRITY REVIEW

| Integrity Area | Risk | Detection Method | Mitigation |
|---|---|---|---|
| Owner access continuity | LOW | `stranded_owner_count` pre-flight | Run pre-flight below before applying |
| Join flow orphan detection | LOW | Code review of `checkJoinAuthState` flow | Confirmed: `pending_invite_token` guard prevents race |

---

## MIGRATION EXECUTION STRATEGY

| Phase | Strategy | Risk | Notes |
|---|---|---|---|
| Phase 0 (done) | Code trace — identify all callers relying on `profiles_select_by_owner_user` | NONE | 6 DAL call sites identified |
| Phase 1 | Pre-flight: confirm `stranded_owner_count = 0` against CURRENT live DB | NONE — read only | Run pre-flight SQL below |
| Phase 2 | Apply `DROP POLICY IF EXISTS profiles_select_by_owner_user ON vport.profiles` | LOW | Single-statement migration |
| Phase 3 | Verify: VPORT settings, dashboard, join flow work after apply | NONE — live test | Smoke test key owner paths |

### Pre-flight SQL (run BEFORE applying migration, read-only):

```sql
-- Verify stranded owner coverage: profiles with owner_user_id set but
-- no profile_actor_access + actor_owners canonical chain.
SELECT COUNT(*) AS stranded_owner_count
FROM vport.profiles p
WHERE p.owner_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM vport.profile_actor_access paa
    JOIN vc.actor_owners ao ON ao.actor_id = paa.actor_id
    WHERE paa.profile_id = p.id
      AND ao.user_id     = p.owner_user_id
      AND paa.status     = 'active'
      AND COALESCE(ao.is_void, false) = false
  );
-- Expected: 0
-- If > 0: do NOT apply. Investigate stranded profiles first.
```

---

## ROLLBACK SURVIVABILITY

**Rollback status:** FULL  
**Data recovery risk:** NONE — policy-only change, no data modified  
**Compatibility rollback risk:** NONE — re-creating the policy restores prior behavior exactly  
**Operational complexity:** TRIVIAL — one `CREATE POLICY` statement

**Rollback SQL:**
```sql
CREATE POLICY profiles_select_by_owner_user ON vport.profiles
  FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
```

---

## VALIDATION CHECKLIST

| Validation Area | Status | Notes |
|---|---|---|
| Schema compatibility | ✓ SAFE | `profiles_select_owner` already active |
| DAL compatibility | ✓ SAFE | All 6 affected DAL sites rely on rows with canonical coverage |
| Controller compatibility | ✓ SAFE | No controller reads policy name directly |
| Engine compatibility | ✓ SAFE | No engine dependency on this policy |
| RLS validation | ✓ SAFE | `profiles_select_owner` covers same rows (stranded = 0, confirmed 2026-05-23) |
| Runtime performance | ✓ SAFE | DROP does not affect query plans on `profiles_select_owner` |
| Rollback validation | ✓ FULL | Single `CREATE POLICY` statement restores prior state |

---

## IDENTITY / OWNERSHIP MIGRATION WARNING

**Object:** `vport.profiles` — `profiles_select_by_owner_user`  
**Current behavior:** Owners can read their profiles via `owner_user_id = auth.uid()` OR via `actor_can_manage_profile` (canonical). Both OR together.  
**Migration risk:** After drop, `owner_user_id = auth.uid()` path removed. Access survives only via `actor_can_manage_profile`.  
**Potential impact:** Profiles with `owner_user_id` set but no `profile_actor_access → actor_owners` chain become inaccessible to the owner. Pre-flight confirms this is zero for current data.  
**Recommended safeguards:**
1. Run pre-flight SQL above — abort if result > 0
2. Verify VPORT creation path populates `profile_actor_access` atomically before returning
3. Smoke test VPORT Settings tab and dashboard after apply

---

## BOUNDARY MIGRATION REVIEW

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `vport.profiles` | VCSM | NONE — VCSM-only table | Within boundary |
| `vport.profile_actor_access` | VCSM | NONE | Within boundary |
| `vc.actor_owners` | VCSM (engine contract) | NONE | Architecture contract §1.4 |

---

## RELATED TICKETS

| Ticket | Topic | Dependency | Status |
|---|---|---|---|
| TICKET-0005 | Track `bookings_select_actor_owner` | None | CLOSED |
| TICKET-0006 | Harden `subscribers` RPC visibility | None | Migration written |
| TICKET-0007 | Drop `profiles_select_by_owner_user` | After TICKET-0006 migration window | This ticket |

---

## RECOMMENDED HANDOFFS

| Command | Reason | Status |
|---|---|---|
| DB | Run pre-flight `stranded_owner_count` query on live DB | PENDING |
| VENOM | Confirm dropping legacy `owner_user_id` SELECT gate aligns with trust boundary design | INFORM |
| THOR | MEDIUM priority — does not block release | INFORM |

---

## FINAL CARNAGE STATUS: CAUTION

**Correct to drop.** `profiles_select_owner` is the canonical policy and covers all current VPORTs.
**Pre-flight required.** Run `stranded_owner_count` query before applying. Abort if result > 0.
**Join flow is safe.** `getExistingBarberVport` is called only when `pending_invite_token` is absent (i.e., post-completion), so queried VPORTs are fully provisioned.
**Remaining legacy DAL files** (`vport.core.dal.js`, `vport.read.vportRecords.dal.js`, `barberVport.read.dal.js`) continue to work after the drop — the `owner_user_id` WHERE predicates they use are query filters, not RLS gates. RLS now passes via `profiles_select_owner` instead.

---

*Report generated by CARNAGE — READ ONLY — 2026-05-27*
*Application scope: VCSM*
*No database changes were made during this analysis.*
