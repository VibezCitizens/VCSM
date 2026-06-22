# CARNAGE MIGRATION REPORT
**Date:** 2026-05-28
**Ticket:** TICKET-SUB-010-B
**Analyst:** CARNAGE
**Boundary Contract:** Loaded and enforced — `/zNOTFORPRODUCTION/_CANONICAL/zcontract/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`

---

## Target

```
CARNAGE TARGET
Object being changed:  vc.actor_social_settings — RLS policies (additive)
Application Scope:     VCSM
Type of change:        RLS policy addition (owner-delegation SELECT + UPDATE)
Reason for migration:  Enable VPORT owners to read and write their VPORT actor's
                       social settings via the controller-verified actor_owners
                       delegation path. Current RLS (actor_id = auth.uid()) blocks
                       all VPORT actor writes because a VPORT actor_id ≠ auth.uid().
                       ctrlUpdateVportSocialSettings cannot be built without this.
```

---

## Migration Safety Status

**Migration Safety Status:** SAFE
**Confidence:** HIGH
**Blocking Risks:** NONE

Rationale: additive RLS policies only. No table structure change, no data change,
no column modification. The EXISTS → actor_owners pattern is established and
well-tested across the codebase (business_card_leads, vc.posts, bookings).
DROP POLICY provides instant rollback with zero data loss.

---

## Schema Trust Classification

| Object | Classification | Reason |
|---|---|---|
| `vc.actor_social_settings` | Identity-sensitive + Ownership-sensitive | Controls follow_policy, account_visibility, signal visibility — directly shapes actor discoverability and follow routing |
| `vc.actor_owners` | Identity-sensitive + Ownership-sensitive | Source-of-truth for VPORT ownership verification — used as the delegation authority |

---

## Current Structure

```
CURRENT STRUCTURE
Table: vc.actor_social_settings
Columns:
  actor_id                   uuid NOT NULL PRIMARY KEY
  account_visibility         text NOT NULL DEFAULT 'public'
  follow_policy              text NOT NULL DEFAULT 'approval_required'
  follower_count_visibility  text NOT NULL DEFAULT 'owner'
  follower_list_visibility   text NOT NULL DEFAULT 'owner'
  following_list_visibility  text NOT NULL DEFAULT 'owner'
  allow_business_followers   boolean NOT NULL DEFAULT true
  allow_follow_notifications boolean NOT NULL DEFAULT true
  created_at                 timestamptz NOT NULL DEFAULT now()
  updated_at                 timestamptz NOT NULL DEFAULT now()

Constraints:
  PK: actor_social_settings_pkey (actor_id)
  FK: actor_social_settings_actor_id_fkey → vc.actors(id) ON DELETE CASCADE
  CHECK: account_visibility IN ('public','private','unlisted')
  CHECK: follow_policy IN ('open','approval_required','closed')
  CHECK: follower_count_visibility IN ('public','followers','owner','hidden')
  CHECK: follower_list_visibility IN ('public','followers','owner','hidden')
  CHECK: following_list_visibility IN ('public','followers','owner','hidden')

Trigger:
  trg_actor_social_settings_updated_at → BEFORE UPDATE → vc.tg_set_updated_at()

Current RLS Policies (3):
  social_settings_select_own   FOR SELECT USING (actor_id = auth.uid())
  social_settings_insert_own   FOR INSERT WITH CHECK (actor_id = auth.uid())
  social_settings_update_own   FOR UPDATE USING/WITH CHECK (actor_id = auth.uid())

Indexes: none declared in migration (actor_id is PK — implicit unique index)

Dependent DAL:
  actorSocialSettings.dal.js   — owner read/write (citizen path, actor_id = auth.uid())
  actorSocialPublicPolicy.dal.js — public read via RPC (SECURITY DEFINER, no RLS)
  actorSignalVisibility.dal.js — signal visibility via RPC (SECURITY DEFINER, no RLS)

Dependent Controllers:
  ctrlUpdateVportSocialSettings — DOES NOT EXIST YET (blocked by this migration)
  getFollowRelationshipState.controller.js — reads via RPC (unaffected)
  follow.controller.js — reads via RPC (unaffected)
```

---

## Proposed Change

Add two additive RLS policies to `vc.actor_social_settings`:

1. **`social_settings_select_owner_delegate`** — allows authenticated users who
   own a VPORT (via `vc.actor_owners`) to SELECT that VPORT's full settings row.
   Required for: settings management UI displaying current VPORT settings.

2. **`social_settings_update_owner_delegate`** — allows authenticated users who
   own a VPORT (via `vc.actor_owners`) to UPDATE that VPORT's settings row.
   Required for: `ctrlUpdateVportSocialSettings` write path.

**No INSERT delegation**: VPORT rows are seeded by the TICKET-SUB-009 migration.
VPORT settings are never created from the UI — only updated.

**No DELETE delegation**: Deletion is handled by the `ON DELETE CASCADE` from
`vc.actors`. A VPORT owner has no legitimate reason to DELETE a settings row
directly — the settings row is tied to the actor's lifecycle.

---

## Migration Blast Radius

```
MIGRATION BLAST RADIUS
Affected systems:  vc.actor_social_settings RLS only
Runtime impact:    EXISTS subquery added to UPDATE (and SELECT) auth evaluations
                   for VPORT actors — applies only when auth.uid() IS NOT the
                   actor_id (i.e., VPORT write path only, not citizen path)
Release impact:    LOW — no existing feature depends on VPORT social settings write.
                   ctrlUpdateVportSocialSettings does not exist yet. No UI regression.
Rollback impact:   DROP POLICY is instant and non-destructive. No data at risk.
```

---

## RLS Impact Review

| Object | RLS Dependency | Risk | Follow-up Required |
|---|---|---|---|
| `vc.actor_social_settings` | DIRECT | LOW — additive policy expands access for VPORT owners only | VENOM review recommended — new delegation surface |
| `vc.actor_owners` | INDIRECT | LOW — EXISTS subquery reads actor_owners under auth.uid() session context. Consistent with existing patterns. If actor_owners has RLS filtering `user_id = auth.uid()`, the subquery self-constrains. | DB — verify actor_owners has no FORCE RLS surprise |
| `get_actor_social_public_policy` RPC | NONE | No change — SECURITY DEFINER bypasses table RLS entirely | None |
| `can_view_actor_signal` RPC | NONE | No change | None |

---

## Runtime Impact Analysis

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| UPDATE auth eval on `actor_social_settings` | LOW | EXISTS subquery against `actor_owners` on every UPDATE — table is tiny (1 row per actor), actor_owners is small | Verify `actor_owners(actor_id, user_id)` composite index exists — already used by booking, posts, chat RLS patterns |
| SELECT auth eval on `actor_social_settings` | LOW | Same EXISTS subquery — affects only reads where actor_id ≠ auth.uid() (VPORT owner reads) | Same index dependency |
| Citizen own-settings read/write | NONE | `actor_id = auth.uid()` path is evaluated first when the session matches — VPORT delegation path never fires | None |
| RPC-based reads (policy + signal RPCs) | NONE | SECURITY DEFINER bypasses table RLS — unaffected | None |
| Feed/follow routing | NONE | Reads via `get_actor_social_public_policy` RPC only | None |

**Index dependency note:** No migration declares an explicit index on
`vc.actor_owners(actor_id, user_id)`. The existing RLS patterns (business_card_leads,
vc.posts, bookings) all use the same EXISTS → actor_owners pattern. If those policies
perform acceptably in production, this migration carries the same index baseline.
CARNAGE recommends DB confirm index presence before marking this SAFE for production.

---

## Migration Dependency Graph

| Dependency Type | Affected Area | Risk |
|---|---|---|
| RLS dependency | `vc.actor_owners` — EXISTS subquery authority source | LOW — well-established pattern |
| DAL dependency | `actorSocialSettings.dal.js` — `dalUpdateActorSocialSettings` will succeed for VPORT actors after this migration | LOW — DAL already written, blocked only by RLS |
| Controller dependency | `ctrlUpdateVportSocialSettings` — cannot be built without this migration | MEDIUM — blocks feature entirely until migration applied |
| Cache dependency | `actorSocialSettings.dal.js` 30s TTL cache — VPORT settings writes will set the cache keyed by vportActorId | LOW — cache is actor-scoped, no collision risk |
| RPC dependency | `get_actor_social_public_policy` — unaffected; SECURITY DEFINER reads `actor_social_settings` regardless of RLS | NONE |

---

## Data Integrity Review

| Integrity Area | Risk | Detection Method | Mitigation |
|---|---|---|---|
| VPORT settings orphan risk | NONE | `ON DELETE CASCADE` from `vc.actors` guarantees cleanup | No action needed |
| Unauthorized write via stale actor_owners link | LOW | `COALESCE(ao.is_void, false) = false` in policy USING clause excludes voided ownership | Already in SQL proposal |
| Citizen accidental access to VPORT settings | NONE | Policy requires `ao.actor_id = actor_social_settings.actor_id` AND `ao.user_id = auth.uid()` — both must match | None |
| VPORT owner writing invalid enum value | LOW | CHECK constraints on all enum columns enforce domain — invalid patch will throw constraint violation | No additional mitigation needed |
| Multiple owners writing same VPORT settings concurrently | LOW | Last-write-wins at row level. `updated_at` trigger tracks last mutation. No VPORT currently has multiple owners in dev. | Acceptable for current scale |

---

## Migration Execution Strategy

| Phase | Strategy | Risk | Notes |
|---|---|---|---|
| 1 — Apply RLS policies | Direct migration | LOW | ADD POLICY only — no table rewrite, no lock beyond ShareRowExclusiveLock on catalog (milliseconds) |
| 2 — Reload schema | `NOTIFY pgrst, 'reload schema'` | NONE | PostgREST picks up new policy immediately |
| 3 — Build `ctrlUpdateVportSocialSettings` | Controller implementation | LOW | Can proceed immediately after migration is applied and verified |
| 4 — VENOM review | Security review of new delegation surface | NONE | Recommended before TICKET-SUB-013 (settings UI) ships |

No staged rollout required. Additive RLS is online-safe and takes effect
immediately without downtime.

---

## Rollback Survivability

```
ROLLBACK SURVIVABILITY
Rollback status:            FULL
Data recovery risk:         NONE — RLS policies carry no data
Compatibility rollback risk: NONE — ctrlUpdateVportSocialSettings does not exist
                             yet; rolling back leaves the feature simply unbuilt
Operational complexity:     DROP POLICY is instant DDL; zero operational burden
```

---

## Validation Checklist

| Validation Area | Status | Notes |
|---|---|---|
| Schema compatibility | READY | Additive only — no breaking changes |
| DAL compatibility | READY | `dalUpdateActorSocialSettings` already written with correct column list |
| Controller compatibility | BLOCKED → UNBLOCKED | `ctrlUpdateVportSocialSettings` cannot be written until this migration is applied |
| Engine compatibility | N/A | No engine touches `vc.actor_social_settings` |
| RLS validation | PENDING | DB must confirm: (a) actor_owners composite index present, (b) actor_owners RLS does not unexpectedly block the EXISTS subquery, (c) 3 existing policies intact after addition |
| Runtime performance validation | PENDING | Confirm actor_owners EXISTS query does not degrade under authenticated writes |
| Rollback validation | READY | DROP POLICY scripts provided |
| Native compatibility | N/A | No native app surface yet |

---

## Identity / Ownership Migration Warning

```
IDENTITY / OWNERSHIP MIGRATION WARNING
Object:          vc.actor_social_settings
Current behavior: Only the actor themselves (actor_id = auth.uid()) can read or
                  update their settings. VPORT actors cannot be written by anyone
                  from the client because VPORT actor_id ≠ auth.uid().
Migration risk:   LOW — the delegation is constrained to active, non-void actor_owners
                  rows. The EXISTS subquery triple-binds: actor_id match + user_id
                  match + is_void = false. A dismissed/voided owner cannot write.
Potential impact: A VPORT owner gains UPDATE access to follow_policy,
                  account_visibility, signal visibility, allow_business_followers,
                  allow_follow_notifications. These are privacy/discoverability
                  fields — not identity fields (name, handle, kind, lifecycle state).
                  No ownership structure, no actor registration, no booking data
                  is affected.
Recommended safeguards:
  1. ctrlUpdateVportSocialSettings must validate patch against an explicit allowlist
     of permitted columns before calling dalUpdateActorSocialSettings — no wildcard
     patch passthrough.
  2. VENOM review of ctrlUpdateVportSocialSettings when built — verify no path exists
     to write actor_id itself (FK protected by DB but should be excluded from patch).
  3. follow_policy changes should invalidate dalGetActorSocialPublicPolicy cache for
     the VPORT actor immediately after write.
```

---

## Boundary Migration Review

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `vc.actor_social_settings` | VCSM | NONE — `vc` schema is VCSM-only | CLEAN |
| `vc.actor_owners` | VCSM | NONE — used only as EXISTS authority, not modified | CLEAN |
| Migration file location | `apps/VCSM/supabase/migrations/` | NONE | CLEAN |

---

## Example SQL Proposal (text only — do not run)

```sql
-- TICKET-SUB-010-B
-- Extends vc.actor_social_settings RLS to allow VPORT actor owners to SELECT
-- (management read) and UPDATE (settings write) their VPORT's social settings
-- via the actor_owners delegation gate.
--
-- Citizen actors continue to use the existing actor_id = auth.uid() policies.
-- VPORT actors were previously write-blocked (actor_id ≠ auth.uid()).
-- No INSERT delegation — VPORT rows seeded by TICKET-SUB-009 migration.
-- No DELETE delegation — handled by vc.actors ON DELETE CASCADE.

-- ─────────────────────────────────────────────
-- 1. SELECT delegation — VPORT owner management read
-- ─────────────────────────────────────────────

CREATE POLICY social_settings_select_owner_delegate
  ON vc.actor_social_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = actor_social_settings.actor_id
        AND ao.user_id  = auth.uid()
        AND COALESCE(ao.is_void, false) = false
    )
  );

-- ─────────────────────────────────────────────
-- 2. UPDATE delegation — VPORT owner settings write
-- ─────────────────────────────────────────────

CREATE POLICY social_settings_update_owner_delegate
  ON vc.actor_social_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = actor_social_settings.actor_id
        AND ao.user_id  = auth.uid()
        AND COALESCE(ao.is_void, false) = false
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = actor_social_settings.actor_id
        AND ao.user_id  = auth.uid()
        AND COALESCE(ao.is_void, false) = false
    )
  );

-- ─────────────────────────────────────────────
-- 3. Schema reload
-- ─────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
```

---

## Rollback SQL (text only — do not run)

```sql
DROP POLICY IF EXISTS social_settings_select_owner_delegate ON vc.actor_social_settings;
DROP POLICY IF EXISTS social_settings_update_owner_delegate ON vc.actor_social_settings;
NOTIFY pgrst, 'reload schema';
```

---

## Recommended Handoffs

| Command | Reason | Status |
|---|---|---|
| **DB** | Verify `vc.actor_owners` has composite index on `(actor_id, user_id)`. Confirm 5 total policies on `actor_social_settings` after migration applied. | REQUIRED before production |
| **VENOM** | Review new owner-delegation surface on `actor_social_settings`. Verify no bypass exists via stale actor_owners rows or void-state edge cases. | RECOMMENDED before TICKET-SUB-013 ships |
| **THOR** | Release gate evaluation — this migration unblocks `ctrlUpdateVportSocialSettings` and TICKET-SUB-013 (settings UI). | STANDARD |
| **LOGAN** | Architecture doc `vcsm.social.universal-graph-architecture.md` still reads "No `vc.actor_social_settings` exists" — needs update to reflect TICKET-SUB-009 completion and this RLS extension. | REQUIRED |
| BLACKWIDOW | Runtime verification that a voided `actor_owners` row cannot be used to write VPORT settings | OPTIONAL — low priority |
| KRAVEN | Performance validation of EXISTS → actor_owners pattern under authenticated write load | OPTIONAL — only if index concern raised |

---

## Final CARNAGE Status

```
FINAL CARNAGE STATUS: SAFE

Justification:
- Additive RLS only — no structural change, no data mutation
- EXISTS → actor_owners is the established VCSM ownership delegation pattern
  (used across bookings, posts, chat, business_card_leads)
- Rollback is DROP POLICY — instant, zero data risk
- No feature currently depends on this migration (ctrlUpdateVportSocialSettings
  does not exist); no regression possible
- One pending verification: DB must confirm actor_owners composite index before
  production — if missing, the SAFE rating holds but the index migration should
  be bundled or precede this one
```
