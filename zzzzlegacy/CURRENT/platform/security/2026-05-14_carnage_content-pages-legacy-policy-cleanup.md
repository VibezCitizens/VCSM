# CARNAGE MIGRATION REPORT
## Drop Legacy RLS Policies on `vport.content_pages`

**Date:** 2026-05-14
**Application Scope:** VCSM
**Mode:** READ-ONLY PLANNING — no modifications applied
**Migration Type:** RLS Policy Cleanup — DROP stale ownership policies
**Authored by:** CARNAGE — Database Migration Architect

---

## Migration Target

```
Object:          vport.content_pages — 4 legacy RLS policies
Application:     VCSM
Type:            RLS policy removal (destructive, but safety-confirmed)
Reason:          Legacy policies use profiles.owner_user_id = auth.uid() which
                 creates a stale-ownership attack surface after actor migration.
                 Modern actor_can_manage_profile() policies provide equivalent
                 coverage under the canonical actor ownership model.
```

---

## Schema Trust Classification

| Object | Classification | Reason |
|---|---|---|
| `vport.content_pages` | Ownership-sensitive + Identity-sensitive | Scoped to VPORT actor ownership; gates who can read/write content page data including unpublished drafts |
| `vport.profiles` | Ownership-sensitive + Identity-sensitive | Legacy policies join through profiles to resolve `owner_user_id` — this join is the attack surface being eliminated |
| `vport.actor_can_manage_profile(actor_id, profile_id)` | Identity-sensitive + Runtime-critical | The canonical ownership gate function used by all modern policies; any defect here is systemic |
| `vc.current_actor_id()` | Identity-sensitive + Runtime-critical | Session resolver; source of the actor identity used in modern policies |
| `actor_owners` | Ownership-sensitive | Underlying table that `actor_can_manage_profile()` reads to verify ownership — not queried directly by RLS but foundational to correctness |

---

## Current Structure — Both Policy Sets

### Legacy Set — TO BE DROPPED
These policies use `vport.profiles.owner_user_id = auth.uid()` which resolves ownership
from a non-canonical, potentially stale column rather than the actor ownership graph.

| Policy Name | Operation | Predicate Summary |
|---|---|---|
| `content_pages_owner_delete` | DELETE | `profiles.owner_user_id = auth.uid()` |
| `content_pages_owner_insert` | INSERT (WITH CHECK) | `profiles.owner_user_id = auth.uid()` AND `profiles.actor_id = content_pages.actor_id` |
| `content_pages_owner_read` | SELECT | `profiles.owner_user_id = auth.uid()` |
| `content_pages_owner_update` | UPDATE (USING + WITH CHECK) | `profiles.owner_user_id = auth.uid()` AND `profiles.actor_id = content_pages.actor_id` (with_check only) |

**Full legacy SQL (current live state — do not run):**

```sql
-- content_pages_owner_delete
DELETE USING (
  EXISTS (
    SELECT 1
    FROM vport.profiles vp
    WHERE vp.id = content_pages.profile_id
      AND vp.owner_user_id = auth.uid()
  )
)

-- content_pages_owner_insert
INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM vport.profiles vp
    WHERE vp.id = content_pages.profile_id
      AND vp.actor_id = content_pages.actor_id
      AND vp.owner_user_id = auth.uid()
  )
)

-- content_pages_owner_read
SELECT USING (
  EXISTS (
    SELECT 1
    FROM vport.profiles vp
    WHERE vp.id = content_pages.profile_id
      AND vp.owner_user_id = auth.uid()
  )
)

-- content_pages_owner_update
UPDATE USING (
  EXISTS (
    SELECT 1
    FROM vport.profiles vp
    WHERE vp.id = content_pages.profile_id
      AND vp.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM vport.profiles vp
    WHERE vp.id = content_pages.profile_id
      AND vp.actor_id = content_pages.actor_id
      AND vp.owner_user_id = auth.uid()
  )
)
```

---

### Modern Set — KEEP (unchanged)

| Policy Name | Operation | Predicate Summary |
|---|---|---|
| `content_pages_delete_owner` | DELETE | `actor_can_manage_profile(current_actor_id(), profile_id)` |
| `content_pages_insert_owner` | INSERT | `actor_can_manage_profile(current_actor_id(), profile_id)` |
| `content_pages_select_owner` | SELECT | `actor_can_manage_profile(current_actor_id(), profile_id)` |
| `content_pages_update_owner` | UPDATE (qual + with_check) | `actor_can_manage_profile(current_actor_id(), profile_id)` |

---

### Public Policies — UNCHANGED (neither set touches these)

| Policy Name | Operation | Roles | Predicate Summary |
|---|---|---|---|
| `content_pages_public_read` | SELECT | anon + authenticated | `is_published = true AND is_indexable = true` |
| `content_pages_select_public` | SELECT | authenticated | `is_published = true AND EXISTS(profiles where is_active AND NOT is_deleted)` |

---

## CRITICAL GAP ANALYSIS — actor_id Consistency Check

This is the most important pre-drop analysis in this migration.

### The Gap

The legacy INSERT policy includes an extra cross-field consistency guard that the modern INSERT policy does **not** include:

```sql
-- Legacy (present):
vp.actor_id = content_pages.actor_id

-- Modern (absent):
-- No equivalent check exists in content_pages_insert_owner
```

This check ensures that when a content page is inserted, its `actor_id` column matches the `actor_id` on the owning profile. Without this, a malicious or buggy client could insert a content page with a mismatched `actor_id` — attributing a page to the wrong actor while still satisfying the profile ownership check.

### Assessment

Before dropping the legacy INSERT policy, one of the following must be confirmed:

**Option A — Database-level enforcement (preferred)**
A trigger or CHECK constraint on `vport.content_pages` enforces `actor_id = (SELECT actor_id FROM vport.profiles WHERE id = profile_id)` at write time. If confirmed, the modern INSERT policy is safe without the extra guard.

**Option B — Application-layer enforcement**
The DAL responsible for inserting content pages always derives `actor_id` from the profile lookup and never accepts it as a raw client input. If the DAL enforces this invariant, database-level duplication may be acceptable — but is not preferred.

**Option C — Add the guard to the modern INSERT policy**
Add `actor_id = (SELECT actor_id FROM vport.profiles WHERE id = profile_id)` to the `WITH CHECK` clause of `content_pages_insert_owner`. This is the safest path if Options A and B cannot be confirmed.

### Recommendation

**BLOCKED on this specific check** until Option A, B, or C is confirmed. The main DROP sequence for DELETE / SELECT / UPDATE legacy policies is safe to proceed. Only the INSERT legacy policy drop requires this verification step.

---

## Migration Blast Radius

```
Affected systems:    vport.content_pages RLS layer
Runtime impact:     LOW — drops OR-branch from policy evaluation; net faster reads/writes
Release impact:     LOW — modern policies already active; no new coverage gap introduced
Rollback impact:    FULL — all 4 legacy policies can be recreated with exact SQL
Security impact:    HIGH POSITIVE — eliminates stale-ownership read/write/delete attack vector
```

**Systems with possible indirect impact:**

| System | Impact | Notes |
|---|---|---|
| VPORT content page DAL | None | DAL reads/writes pass through modern policies already |
| External VPORT API consumers (e.g. Tripoint) | None | External consumers use published content only (public read policies) |
| Content page indexing / SEO | None | `content_pages_public_read` and `content_pages_select_public` are unchanged |
| Admin / moderation tools | Low | Must verify admin access is not gated through these owner policies |

---

## RLS Impact Review

| Object | RLS Dependency | Risk | Follow-up Required |
|---|---|---|---|
| `vport.content_pages` | CRITICAL | Dropping 4 policies; permissive OR logic means legacy bypass is live today | VENOM review before execution |
| `vport.profiles` | DIRECT | Legacy policies join through profiles to resolve ownership | Confirm `owner_user_id` staleness surface is fully closed after drop |
| `vport.actor_can_manage_profile()` | CRITICAL | Modern policies fully depend on this function's correctness | DB to verify function definition and edge cases |
| `vc.current_actor_id()` | CRITICAL | Session resolver used by all modern policies | DB to confirm session claim integrity |
| `actor_owners` | INDIRECT | Underlying ownership table; not queried directly by RLS but authoritative | No direct action needed |

**CARNAGE recommends:**
- VENOM review of this migration before execution
- DB to inspect `actor_can_manage_profile()` function body and confirm it handles transferred VPORT ownership correctly
- THOR release gate: this migration must not ship without VENOM sign-off

---

## Runtime Impact Analysis

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| Content page SELECT (owner) | LOW | Removing one OR branch from PERMISSIVE policy set; reads become slightly faster | None needed |
| Content page INSERT | MODERATE | Must verify actor_id consistency check is enforced elsewhere before dropping | Resolve gap analysis before dropping INSERT policy |
| Content page UPDATE | LOW | Legacy UPDATE branch removed; no coverage gap | Verify with test actor after drop |
| Content page DELETE | LOW | Legacy DELETE branch removed; no coverage gap | Verify with test actor after drop |
| Supabase query planner | LOW | Policy simplification may improve plan quality; fewer subquery branches to evaluate | None needed |
| Realtime subscriptions on content_pages | LOW | RLS filters apply to realtime reads; simpler policy improves filter efficiency | None needed |

---

## Migration Dependency Graph

| Dependency Type | Affected Area | Risk |
|---|---|---|
| RLS dependency | `vport.content_pages` all owner-CRUD operations | HIGH — must confirm modern policies fully cover legacy intent before drop |
| Function dependency | `vport.actor_can_manage_profile()` | HIGH — this function is the sole gate after legacy policies are dropped |
| Function dependency | `vc.current_actor_id()` | HIGH — session claim must resolve correctly in all auth contexts |
| DAL dependency | VCSM content pages DAL | LOW — DAL behavior unchanged; only RLS enforcement path changes |
| Data integrity dependency | `actor_id` column on `vport.content_pages` | MODERATE — legacy INSERT enforced actor_id consistency; must confirm replacement enforcement |
| Ownership transfer dependency | `actor_owners` + `vport.profiles.owner_user_id` | HIGH — the entire reason this migration exists; staleness in profiles.owner_user_id is the attack surface |

---

## Data Integrity Review

| Integrity Area | Risk | Detection Method | Mitigation |
|---|---|---|---|
| `actor_id` mismatch on existing rows | MODERATE | Pre-migration verification query (see below) | Fix any mismatches before drop |
| Stale `owner_user_id` after VPORT transfer | HIGH | Cross-join `actor_owners` vs `profiles.owner_user_id` to find divergence | This migration closes the attack surface; fix stale rows as follow-up |
| Orphaned content pages (no matching profile) | LOW | Check for `profile_id` FKs with no matching profile | Run pre-migration query; clean up before drop |
| Duplicate content page `actor_id` misattribution | LOW | Impossible post-drop if Option C guard is added to INSERT policy | Add INSERT guard before drop |

---

## Pre-Migration Verification Queries

**TEXT ONLY — do not execute**

### Query 1 — Find content pages where actor_id does not match the owning profile's actor_id
This is the data integrity check for the INSERT gap. Any rows returned are integrity violations that must be resolved before the legacy INSERT policy is dropped.

```sql
SELECT
  cp.id            AS content_page_id,
  cp.profile_id,
  cp.actor_id      AS content_page_actor_id,
  vp.actor_id      AS profile_actor_id,
  cp.created_at
FROM vport.content_pages cp
JOIN vport.profiles vp ON vp.id = cp.profile_id
WHERE cp.actor_id != vp.actor_id
ORDER BY cp.created_at DESC;
```

If this returns 0 rows: the actor_id consistency invariant holds in existing data. Proceed to Phase 2.
If this returns rows: investigate the source of the mismatch before dropping any policies.

---

### Query 2 — Find VPORTs where profiles.owner_user_id no longer matches actor_owners

This identifies the stale-ownership accounts that currently have unintended access through the legacy policies. These are the exact accounts the migration is designed to close off.

```sql
SELECT
  vp.id            AS profile_id,
  vp.actor_id,
  vp.owner_user_id AS stale_owner_user_id,
  ao.user_id       AS current_actor_owner_user_id,
  ao.granted_at
FROM vport.profiles vp
LEFT JOIN vc.actor_owners ao
  ON ao.actor_id = vp.actor_id
WHERE vp.owner_user_id != ao.user_id
   OR ao.user_id IS NULL
ORDER BY vp.actor_id;
```

Any rows returned represent live stale-ownership exposure. These accounts can currently bypass the modern policy through the legacy path.

---

### Query 3 — Verify modern policies exist and are enabled before dropping legacy

Confirm the replacement policies are active before executing drops.

```sql
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'vport'
  AND tablename = 'content_pages'
  AND policyname IN (
    'content_pages_delete_owner',
    'content_pages_insert_owner',
    'content_pages_select_owner',
    'content_pages_update_owner'
  )
ORDER BY cmd;
```

All 4 modern policies must be confirmed present before executing any DROP.

---

### Query 4 — Confirm actor_can_manage_profile function exists

```sql
SELECT
  routine_schema,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'vport'
  AND routine_name = 'actor_can_manage_profile';
```

---

### Query 5 — Confirm vc.current_actor_id function exists

```sql
SELECT
  routine_schema,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'vc'
  AND routine_name = 'current_actor_id';
```

---

## Migration Execution Strategy

| Phase | Name | Strategy | Risk | Notes |
|---|---|---|---|---|
| 0 | Pre-flight | Run all 5 verification queries | LOW | Zero rows on Query 1 required to proceed; Query 3 must return all 4 modern policies |
| 1 | actor_id gap resolution | Confirm Option A (trigger/constraint), B (DAL invariant), or C (add guard to modern INSERT policy) | MODERATE | Do not skip this phase; it is a BLOCKED dependency |
| 2 | Drop legacy DELETE policy | Direct migration | LOW | `content_pages_owner_delete` — fully covered by `content_pages_delete_owner` |
| 3 | Drop legacy SELECT policy | Direct migration | LOW | `content_pages_owner_read` — fully covered by `content_pages_select_owner` |
| 4 | Drop legacy UPDATE policy | Direct migration | LOW | `content_pages_owner_update` — fully covered by `content_pages_update_owner` |
| 5 | Drop legacy INSERT policy | Direct migration | MODERATE | `content_pages_owner_insert` — safe only after Phase 1 resolves actor_id gap |
| 6 | Post-drop validation | Runtime verification with test actor | LOW | Confirm owner can still CRUD their own content pages; confirm former owner is blocked |
| 7 | Staleness remediation | Follow-up: audit profiles.owner_user_id vs actor_owners | LOW | Optional cleanup; attack surface already closed after drop |

---

## Migration SQL — Execution Proposals

**TEXT ONLY — do not execute**

### Phase 1-C (if chosen) — Add actor_id consistency guard to modern INSERT policy

```sql
-- Drop and recreate content_pages_insert_owner with actor_id consistency check added
DROP POLICY IF EXISTS content_pages_insert_owner ON vport.content_pages;

CREATE POLICY content_pages_insert_owner
ON vport.content_pages
FOR INSERT
TO authenticated
WITH CHECK (
  vport.actor_can_manage_profile(vc.current_actor_id(), profile_id)
  AND actor_id = (
    SELECT vp.actor_id
    FROM vport.profiles vp
    WHERE vp.id = profile_id
  )
);
```

---

### Phase 2 — Drop legacy DELETE policy

```sql
DROP POLICY IF EXISTS content_pages_owner_delete ON vport.content_pages;
```

---

### Phase 3 — Drop legacy SELECT policy

```sql
DROP POLICY IF EXISTS content_pages_owner_read ON vport.content_pages;
```

---

### Phase 4 — Drop legacy UPDATE policy

```sql
DROP POLICY IF EXISTS content_pages_owner_update ON vport.content_pages;
```

---

### Phase 5 — Drop legacy INSERT policy

```sql
DROP POLICY IF EXISTS content_pages_owner_insert ON vport.content_pages;
```

---

## Rollback SQL

**TEXT ONLY — do not execute**

If post-drop validation reveals unexpected access failure for legitimate owners, restore all 4 legacy policies. This restores the OR-branch coverage while the modern policy issue is investigated.

```sql
-- Rollback Phase 2: restore legacy DELETE
CREATE POLICY content_pages_owner_delete
ON vport.content_pages
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM vport.profiles vp
    WHERE vp.id = content_pages.profile_id
      AND vp.owner_user_id = auth.uid()
  )
);

-- Rollback Phase 3: restore legacy SELECT
CREATE POLICY content_pages_owner_read
ON vport.content_pages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM vport.profiles vp
    WHERE vp.id = content_pages.profile_id
      AND vp.owner_user_id = auth.uid()
  )
);

-- Rollback Phase 4: restore legacy UPDATE
CREATE POLICY content_pages_owner_update
ON vport.content_pages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM vport.profiles vp
    WHERE vp.id = content_pages.profile_id
      AND vp.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM vport.profiles vp
    WHERE vp.id = content_pages.profile_id
      AND vp.actor_id = content_pages.actor_id
      AND vp.owner_user_id = auth.uid()
  )
);

-- Rollback Phase 5: restore legacy INSERT
CREATE POLICY content_pages_owner_insert
ON vport.content_pages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM vport.profiles vp
    WHERE vp.id = content_pages.profile_id
      AND vp.actor_id = content_pages.actor_id
      AND vp.owner_user_id = auth.uid()
  )
);
```

**Rollback Survivability: FULL**
All 4 legacy policies are fully reversible. No data is modified. No schema is altered. The exact original SQL is preserved above.

---

## Rollback Survivability

```
Rollback status:              FULL
Data recovery risk:           NONE — this migration drops policies only; no data is touched
Compatibility rollback risk:  NONE — re-creating policies restores exact prior state
Operational complexity:       LOW — 4 CREATE POLICY statements; no downtime required
```

---

## Identity / Ownership Migration Warning

```
Object:             vport.content_pages — legacy INSERT, SELECT, UPDATE, DELETE policies
Current behavior:   PERMISSIVE policies OR-merge legacy + modern paths. Any user whose
                    profiles.owner_user_id matches auth.uid() has full CRUD access,
                    regardless of whether they are still listed in actor_owners. This
                    means former VPORT owners who were transferred out retain live
                    access through the legacy path if owner_user_id was not updated.
Migration risk:     After drop, all access is exclusively gated through
                    actor_can_manage_profile(). If that function has edge cases
                    (e.g. VPORT with no actor_owners row, or session claim race
                    during transfer), legitimate access may temporarily fail.
Potential impact:   Legitimate current owners locked out if actor_can_manage_profile()
                    returns false for their session. Former owners lose access (intended).
Recommended safeguards:
  1. Run Query 2 pre-migration to enumerate all stale-ownership accounts.
  2. Confirm actor_can_manage_profile() handles the case where actor_owners has 0 rows.
  3. Test with a known-good current VPORT owner before and after drop.
  4. Have rollback SQL queued in the migration console session.
```

---

## Boundary Migration Review

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `vport.content_pages` | VCSM | None — VCSM-only table | CLEAN |
| `vport.profiles` | VCSM | None — VCSM-only table | CLEAN |
| `vport.actor_can_manage_profile()` | VCSM | None — VCSM schema function | CLEAN |
| `vc.current_actor_id()` | VCSM (shared schema) | None — session resolver, not cross-app | CLEAN |
| `vc.actor_owners` | VCSM (shared schema) | None — actor ownership table, VCSM only | CLEAN |

No cross-root boundary violations. This migration is fully contained within VCSM database schema.

---

## Validation Checklist

| Validation Area | Status | Notes |
|---|---|---|
| Modern policies confirmed present (Query 3) | REQUIRED | Must return 4 rows before any DROP |
| `actor_can_manage_profile()` confirmed (Query 4) | REQUIRED | Must exist; review function body for ownership transfer edge cases |
| `vc.current_actor_id()` confirmed (Query 5) | REQUIRED | Must exist; confirm session claim source |
| actor_id consistency data check (Query 1) | REQUIRED | Must return 0 rows before dropping INSERT policy |
| Stale ownership enumeration (Query 2) | RECOMMENDED | Documents attack surface being closed |
| INSERT actor_id gap resolved (Phase 1) | REQUIRED | Option A, B, or C confirmed before Phase 5 |
| Post-drop owner CRUD test | REQUIRED | Verify legitimate owner can SELECT, INSERT, UPDATE, DELETE their own content pages |
| Post-drop former-owner lockout test | REQUIRED | Verify a transferred-out user cannot access the VPORT's content pages |
| Public read policies unaffected | REQUIRED | Confirm `content_pages_public_read` and `content_pages_select_public` still return published pages |
| Rollback SQL preserved | REQUIRED | Keep rollback SQL in migration console until post-drop validation passes |
| VENOM sign-off | REQUIRED | Security-sensitive ownership policy change requires VENOM review |
| THOR release gate | REQUIRED | Must not ship without VENOM sign-off and post-drop validation |
| LOGAN documentation update | RECOMMENDED | Update RLS policy docs after migration is confirmed stable |

---

## Recommended Handoffs

| Command | Purpose | Priority |
|---|---|---|
| **VENOM** | Review stale-ownership attack surface and confirm modern policy coverage closes all vectors | REQUIRED before execution |
| **DB** | Inspect `actor_can_manage_profile()` function body; confirm ownership transfer edge cases are handled | REQUIRED before execution |
| **DB** | Run all 5 pre-migration verification queries and return results | REQUIRED before execution |
| **THOR** | Release gate — this migration must not ship without VENOM + DB sign-off | REQUIRED |
| **KRAVEN** | Post-drop performance comparison — confirm policy simplification improves content page query plans | RECOMMENDED |
| **LOGAN** | Update RLS policy documentation for `vport.content_pages` after migration is confirmed stable | RECOMMENDED post-migration |

---

## Migration Safety Status

```
Migration Safety Status:    CAUTION
Confidence:                 HIGH
Blocking Risks:
  1. actor_id consistency check gap in modern INSERT policy (Phase 1 resolution required)
  2. actor_can_manage_profile() edge case behavior under ownership transfer not yet verified
  3. VENOM review not yet completed

Non-blocking (safe to sequence):
  - Legacy DELETE, SELECT, UPDATE drops are LOW risk and independently safe
  - Rollback is FULL survivability — exact SQL preserved
  - No data mutations; purely a policy cleanup
```

---

## Final Carnage Status

```
CAUTION

Rationale:
  The migration is architecturally correct and the modern policy set is the right
  ownership model. The legacy policies create a live stale-ownership attack surface
  that must be eliminated. However, execution is gated on two open items:

  1. The actor_id consistency check gap in the legacy INSERT policy must be resolved
     (Option A trigger confirmation, Option B DAL invariant confirmation, or
     Option C modern policy update) before dropping content_pages_owner_insert.

  2. actor_can_manage_profile() must be inspected for VPORT ownership transfer
     edge cases before all 4 drops proceed.

  The DROP sequence for DELETE, SELECT, and UPDATE legacy policies may proceed
  independently once Queries 3, 4, and 5 pass. The INSERT legacy policy drop
  requires Phase 1 resolution.

  VENOM must sign off. THOR must gate the release. DB must run verification queries.

  Once these gates clear, Final Carnage Status upgrades to SAFE.
```

---

*Report persisted to: `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-14_carnage_content-pages-legacy-policy-cleanup.md`*
*CARNAGE — Database Migration Architect — READ-ONLY PLANNING SESSION COMPLETE*
