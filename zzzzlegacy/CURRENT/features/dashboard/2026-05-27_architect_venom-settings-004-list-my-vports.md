# ARCHITECT — VENOM-SETTINGS-004: Canonical Ownership for "List My VPORTs"

**Date:** 2026-05-27
**Reviewer:** ARCHITECT
**Ticket:** TICKET-0004 — Settings P0
**Scope:** apps/VCSM — features/settings/vports/dal/vports.read.dal.js only
**Trigger:** VENOM-SETTINGS-004 — `listMyVportsDAL` and `readMyVports` query `vport.profiles` via `owner_user_id = auth.uid()`, violating §1.4 Owner Meaning Rule

---

## Objective

Determine the canonical ownership resolution pattern for "list the VPORTs this user owns"
and produce an approved DAL rewrite recommendation for VENOM-SETTINGS-004.

---

## Current State

### Files Under Review

| File | Function | Method |
|---|---|---|
| `features/settings/vports/dal/vports.read.dal.js` | `listMyVportsDAL` | `owner_user_id = auth.uid()` on `vport.profiles` |
| `features/settings/vports/dal/vports.read.dal.js` | `readMyVports` | `owner_user_id = auth.uid()` on `vport.profiles` |

### Callers

| Function | Caller | Surface |
|---|---|---|
| `listMyVportsDAL` | `listMyVportsController` → `useUserVports` → `VportsTabView` | **Production — Settings VPORTs tab** |
| `readMyVports` | `settingsFeature.group.js` (diagnostics only) | Dev diagnostics — not production |

### What the View Uses from the Payload

`VportsTabView` uses:
- `v.is_deleted` — splits active / deactivated section display
- `v.avatar_url`, `v.name`, `v.slug`, `v.id`, `v.is_active` — VPORT card display
- `v.business_card_published` — business card section
- `v.actor_id` — resolves vportActorId for switch/isActive checks

`VportsBusinessCardSection` uses:
- `v.is_deleted`, `v.is_active`, `v.business_card_published`, `v.slug`, `v.avatar_url`
- Does NOT use `directory_status`

---

## Architecture Contract Violation

§1.4 Owner Meaning Rule (locked):

> "In this system, Owner means Actor Owner. The authoritative ownership model is
> actor-based because all meaningful domain entities are tied to `vc.actors`.
> Ownership semantics must follow `actor_owners`."

`owner_user_id` on `vport.profiles` is a legacy field. Using it as an identity authority
in a DAL query is a direct violation.

---

## Question 1: Direct Owners or All Managers?

**Answer: Direct owners only.**

The Settings VPORTs tab is an identity management surface:
- Switch active identity to a VPORT
- Create new VPORT
- Recover (restore) a deleted VPORT
- Hard-delete a VPORT

All four operations require canonical ownership of the VPORT actor in `actor_owners`.
A team member who manages a VPORT via `profile_actor_access` does NOT own the VPORT actor —
they have a managed access row, not an `actor_owners` entry for that VPORT's actor.

Team members interact with a VPORT by switching to it (which requires owning a user-kind
actor linked to it, not the VPORT actor itself). After switching, they operate through the
VPORT Dashboard, not the Settings VPORTs tab.

**Conclusion:** The Settings VPORTs tab should only surface VPORTs where
`vc.actor_owners.user_id = auth.uid()` AND `vc.actors.kind = 'vport'`.
Team-managed VPORTs must not appear here.

---

## Question 2: Canonical Join Shape

### Ownership graph for "VPORTs I directly own"

```
auth.uid()
  → vc.actor_owners (user_id = auth.uid(), is_void = false)
    → vc.actors (kind = 'vport', is_void = false, is_deleted = false)
      → vport.profiles (actor_id = actors.id)
```

This is a two-hop join:
1. `actor_owners` scoped to the calling user's auth session → yields owned actor_ids
2. Those actor_ids filtered to kind='vport' → yields VPORT actor IDs
3. `vport.profiles` filtered by actor_id → yields the VPORT profile rows

### Contrast with `actor_can_manage_profile` (management path — NOT for Settings)

```
auth.uid()
  → vc.actor_owners (user_id = auth.uid(), is_void = false)
    → vport.profile_actor_access (paa.actor_id = ao.actor_id, status = 'active')
      → vport.profiles (profile_id = paa.profile_id)
```

This path is what `actor_can_manage_profile` uses. It covers both direct owners AND team
members who have been granted `profile_actor_access` rows. It is the correct path for
write authorization and dashboard access, but NOT for the Settings ownership list.

---

## Question 3: Can owner_user_id Be Fully Eliminated?

**Yes.**

Evidence from migration `20260523230000_remove_actor_can_manage_profile_legacy_branch.sql`:

> Pre-flight result: `stranded_owner_count = 0`
> Verdict: 'SAFE — owner_user_id branch can be removed'
> All profiles with owner_user_id set have canonical coverage via
> profile_actor_access → actor_owners.

Additionally, `actor_owners` is the authoritative ownership table. Its RLS
(`actor_owners_read_own` policy, enforced at DB via `user_id = auth.uid()`) means
querying `actor_owners` with the caller's session automatically scopes to their own
ownership entries — the DAL does not need an additional `owner_user_id` filter.

`owner_user_id` on `vport.profiles` must not be used as an identity authority in any
new DAL code per §1.4.

---

## Question 4: Migration Implications

**No schema migration required.**

This is a pure DAL code change. The join pattern uses existing tables and indexes:
- `vc.actor_owners` — existing, indexed on `user_id` and `actor_id`
- `vc.actors` — existing, indexed on `id`, `kind`
- `vport.profiles` — existing, indexed on `actor_id` (FK)

One runtime consideration: `vport.profiles` SELECT access. The current `listMyVportsDAL`
relies on `owner_user_id = auth.uid()` as both the data filter AND an implicit auth gate.
After the change, the SELECT gate moves to `actor_owners` (already RLS-protected), and
`vport.profiles` is read by `actor_id IN (owned vport actor IDs)`.

`vport.profiles` SELECT RLS — from migration tracking: only a partial UPDATE policy is
tracked. SELECT is currently open to authenticated users. The new query does not expose
any more data than the current one — both return only rows for profiles the user owns.
The `actor_owners` join provides the implicit ownership scope.

---

## Question 5: Backward Compatibility Risk

**Low.**

The pre-flight from `20260523230000` confirmed zero stranded owners — no VPORTs exist
where the canonical `actor_owners` chain is absent for any current owner. All existing
VPORT owners have both `owner_user_id` (legacy) and `actor_owners` (canonical) coverage.

The new query will return the same set of VPORTs as the current one for all existing users.

Edge case: a VPORT created via an unusual path that populates `owner_user_id` but does
NOT create an `actor_owners` row. This should not exist based on the provisioning path
(VPORT creation always goes through `actorOwnerCreate.dal.js`), but it is the only
scenario where the new query would return fewer results than the current one.

**Mitigation:** Validate with a live DB pre-flight query before applying.

---

## Question 6: Do Team-Managed VPORTs Appear in Settings?

**No — and they should not.**

A "team member" in VCSM has their own user actor and is linked to a VPORT via
`profile_actor_access`. They do NOT have an `actor_owners` row for the VPORT's actor.
The new query (`actor_owners WHERE user_id = auth.uid() AND actors.kind = 'vport'`)
will never return VPORTs that the user manages-but-does-not-own. This is the correct
behavior for the Settings identity management surface.

---

## Approved DAL Rewrite — `listMyVportsDAL`

### Pattern: Two-hop ownership query

```js
export async function listMyVportsDAL() {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = auth?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  // Hop 1: owned vport-kind actor IDs via actor_owners
  const { data: ownerships, error: ownerError } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id, actor:actors!inner(id, kind, is_void, is_deleted)")
    .eq("user_id", userId)
    .eq("is_void", false);

  if (ownerError) throw ownerError;

  const vportActorIds = (ownerships ?? [])
    .filter(o => o.actor?.kind === "vport" && !o.actor?.is_void && !o.actor?.is_deleted)
    .map(o => o.actor_id);

  if (vportActorIds.length === 0) return [];

  // Hop 2: vport profiles for those actor IDs
  const { data, error } = await vportSchema
    .from("profiles")
    .select("id,name,slug,avatar_url,banner_url,bio,is_active,is_deleted,business_card_published,directory_visible,created_at,actor_id")
    .in("actor_id", vportActorIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
```

**Key changes:**
1. `owner_user_id` filter removed
2. `actor_owners → actors(kind='vport')` join replaces it as the ownership gate
3. `directory_status` removed from SELECT — not used by any caller; internal state flag per VENOM-SETTINGS-004 observation
4. Short-circuit on empty `vportActorIds` avoids an `.in('actor_id', [])` query (Supabase returns an error or all rows on empty IN)

---

## Approved DAL Rewrite — `readMyVports`

`readMyVports` is used only by `settingsFeature.group.js` (dev diagnostics). It is not
in any production call path. Apply the same pattern for correctness:

```js
export async function readMyVports() {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const userId = auth?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data: ownerships, error: ownerError } = await supabase
    .schema("vc")
    .from("actor_owners")
    .select("actor_id, actor:actors!inner(id, kind, is_void, is_deleted)")
    .eq("user_id", userId)
    .eq("is_void", false);

  if (ownerError) throw ownerError;

  const vportActorIds = (ownerships ?? [])
    .filter(o => o.actor?.kind === "vport" && !o.actor?.is_void && !o.actor?.is_deleted)
    .map(o => o.actor_id);

  if (vportActorIds.length === 0) return [];

  const { data, error } = await vportSchema
    .from("profiles")
    .select("id,name,avatar_url,actor_id,created_at")
    .in("actor_id", vportActorIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
```

---

## Backward Compatibility Notes

| Concern | Status |
|---|---|
| Existing VPORT owners lose access | LOW RISK — pre-flight confirmed zero stranded owners |
| `is_deleted` retained | YES — VportsTabView splits active/deactivated by this field |
| `directory_status` removed | YES — not used by any Settings caller; VENOM correctly flagged it as unnecessary internal exposure |
| Team-managed VPORTs excluded | CORRECT BEHAVIOR — Settings is identity management, not team management |
| `readMyVports` (compact) | Updated same pattern; only caller is dev diagnostics |

---

## Live DB Verification (completed 2026-05-27)

### Pre-flight result: PASS

| Metric | Value |
|---|---|
| Total `vport.profiles` rows | 7 |
| Profiles with `owner_user_id` set | 7 |
| Legacy count (owner_user_id owner) | 7 |
| Canonical count (actor_owners owner) | 7 |
| Stranded owners (legacy only, no canonical) | **0** |

All 7 VPORTs confirmed with canonical `actor_owners` coverage. Safe to apply.

### Confirmed canonical VPORT ownership (7 / 7)

| actor_id | name | profile_id |
|---|---|---|
| 21aa839b | gas | 736bcb54 |
| 2c220384 | yanke Gas | d85907c8 |
| 766484aa | barbershop | 0b68fad3 |
| 1696f0f3 | Smart LockSmith | f33d3add |
| b6c09027 | Restaurant Vport | 819c9456 |
| 57f7812a | Old Money | 858e6824 |
| 6a5b7f9d | BAR-BER | 2d73e1f2 |

### `vport.profiles` RLS state (live)

RLS: ENABLED, not forced.

| Policy | Cmd | Roles | Gate | Notes |
|---|---|---|---|---|
| `Public can read listed VPORT profiles` | SELECT | anon, authenticated | `is_active AND is_deleted=false AND directory_visible=true AND directory_status='listed'` | Public directory |
| `profiles_select_viewer` | SELECT | authenticated | `is_active=true AND is_deleted=false` | General viewer |
| `profiles_select_by_owner_user` | SELECT | authenticated | `owner_user_id = auth.uid()` | **LEGACY — owner_user_id pattern** |
| `profiles_select_owner` | SELECT | authenticated | `actor_can_manage_profile(current_actor_id(), id)` | Canonical management SELECT |
| `profiles_update_by_actor_owner` | UPDATE | authenticated | `actor_owners.actor_id = profiles.actor_id AND actor_owners.user_id = auth.uid()` | Canonical write |
| `profiles_delete_owner` | DELETE | public | `actor_owners.actor_id = profiles.actor_id AND actor_owners.user_id = auth.uid()` | Canonical delete |
| `profiles_insert_service_role` | INSERT | public | `current_setting('role') = 'service_role'` | Service role only |

### Grants on `vport.profiles`

| Grantee | Privilege |
|---|---|
| anon | SELECT |
| authenticated | SELECT, UPDATE |
| postgres | ALL |

### Secondary Finding — `profiles_select_by_owner_user` is a legacy SELECT policy

The SELECT policy `profiles_select_by_owner_user` (`owner_user_id = auth.uid()`) mirrors
the DAL pattern being removed in this fix. Once `owner_user_id` is fully deprecated from
the system, this policy will also need to be cleaned up — replaced with a canonical
`actor_owners` SELECT policy similar to `profiles_update_by_actor_owner`.

Current state: both `profiles_select_by_owner_user` (legacy) and `profiles_select_owner`
(canonical via `actor_can_manage_profile`) exist and OR together. The new DAL query works
under both. The legacy policy cleanup is a **separate follow-up CARNAGE task** and does
NOT block this DAL rewrite.

**Confirmed RLS impact of the new DAL query:**
The new query filters `vport.profiles` by `actor_id IN [owned vport actor IDs]`. This
SELECT passes RLS via `profiles_select_by_owner_user` (all 7 current VPORTs have
`owner_user_id` set) AND via `profiles_select_owner` (canonical `actor_can_manage_profile`).
No RLS gap introduced by the DAL change.

### `vport.profiles` column list (confirmed from live DB)

`id, actor_id, owner_user_id, slug, name, bio, avatar_url, banner_url, is_active,
is_deleted, created_at, updated_at, meta, deleted_at, deleted_by_actor_id,
business_card_published, directory_visible, directory_status, business_card_settings,
avatar_media_asset_id, banner_media_asset_id`

`directory_status` confirmed present. Not used by any Settings caller. Safe to remove
from the DAL select list.

---

## Summary

| Question | Answer |
|---|---|
| Settings scope | Direct owners only — `actor_owners (user_id = auth.uid()) AND actors.kind = 'vport'` |
| Team-managed VPORTs in Settings | No — they are not direct owners and should not appear |
| Canonical join | `actor_owners → actors(kind='vport') → vport.profiles(actor_id)` |
| `owner_user_id` eliminated | Yes — fully |
| Migration needed | No — pure DAL code change |
| Backward compat risk | Low — pre-flight shows zero stranded owners |
| `directory_status` | Remove from SELECT — not used by any Settings caller |
| `is_deleted` | Keep — VportsTabView uses it to split active/deactivated display |

---

## Handoffs

| Command | Reason | Status |
|---|---|---|
| ELEKTRA | Apply the approved DAL rewrite to `vports.read.dal.js` | READY |
| VENOM | VENOM-SETTINGS-004 — architecture question resolved; DAL rewrite is safe | READY |
| CARNAGE | No migration required — read-only |
