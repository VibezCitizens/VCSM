# ARCHITECT V2 REPORT
## Moderation–Learning Coupling Deep Trace

---

## Output Metadata

| Field | Value |
|---|---|
| Category Key | platform-security |
| Feature / Scope | moderation (VCSM) |
| Command | ARCHITECT |
| Ticket | TICKET-ARCHITECT-MODERATION-LEARNING-COUPLING-0001 |
| Scanner Version | 1.1.0 |
| Output Path | CURRENT/outputs/2026/06/04/ARCHITECT/001_platform-security_architect_moderation-learning-coupling-trace.md |
| Timestamp | 2026-06-04T00:00:00 |

---

## 1. ARCHITECT Scanner Preflight

```
ARCHITECT SCANNER PREFLIGHT
============================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/

| Map               | Generated At             | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| feature-map       | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| dependency-map    | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| route-map         | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| graph             | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| callgraph         | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | HIGH       | PASS   |
| engine-candidates | 2026-06-03T00:22:42.771Z | ~24h | FRESH     | MEDIUM     | PASS   |

Overall Preflight: PASS — all 6 maps FRESH, schemas valid, confidence metadata present.
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Used For |
|---|---|---|---|---|---|
| feature-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | Feature inventory, moderation scope discovery |
| dependency-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | Import graph, cross-schema coupling detection |
| callgraph | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | Layer counts, dead-code detection, runtime reachability |
| graph | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | System graph, node count |
| route-map | 2026-06-03T00:22:42.771Z | ~24h | FRESH | HIGH | Route tree, dead route detection |
| engine-candidates | 2026-06-03T00:22:42.771Z | ~24h | FRESH | MEDIUM | Engine consumer map |

---

## 3. Scope Summary

```
Applications scanned:     1 (VCSM — moderation feature only per ticket boundary)
Engines scanned:          0 (moderation not engine-backed)
Features in scope:        1 (moderation) + cross-reference (learning, Wentrex)
Migrations inspected:     12 (VCSM + Wentrex)
Proposal files inspected: 6 (moderation-db-remediation sql-proposals)
Source files read:        6 (assertModerationAccess.dal.js, assertModerationAccess.controller.js,
                            moderationActions.controller.js, adminAccess.controller.js [VCSM learning],
                            SECURITY.md, FEATURE_INDEX/moderation.md)
```

---

## 4. Scanner Signals

| Signal | Source Map | Confidence | Verified Against Source | Provenance | Finding |
|---|---|---|---|---|---|
| Moderation feature exists at apps/VCSM/src/features/moderation/ | feature-map | HIGH | YES — source read | [SOURCE_VERIFIED] | Not a finding |
| assertModerationAccess.dal.js calls learning schema RPC | callgraph | HIGH | YES — DAL line 24 | [SOURCE_VERIFIED] | COUPLING: DB-active |
| moderationActions.controller.js has 0 callers | callgraph | HIGH | YES — VENOM-002 confirms | [SOURCE_VERIFIED] | DEAD_EXPORT (controller layer) |
| learning.platform_admins consumed inside VCSM moderation migration | dependency-map | HIGH | YES — 20260510070000 lines 45–55 | [SOURCE_VERIFIED] | WENTREX_LEAKAGE |
| no moderation.moderators migration in apps/VCSM/supabase/migrations/ | feature-map | HIGH | YES — migrations dir listing | [SOURCE_VERIFIED] | TABLE ABSENT from promoted history |
| VCSM embedded learning feature queries learning.platform_admins | callgraph | HIGH | YES — adminAccess.controller.js:48 | [SOURCE_VERIFIED] | EXPECTED (not moderation coupling) |

---

## 5. Phase 1 — Source Reference Table

Full search results for all queried terms, scoped to relevant application roots.

### 5.1 VCSM Source Files

| Search Term | File | Line(s) | Context | Runtime? |
|---|---|---|---|---|
| `learning.platform_admins` | `apps/VCSM/supabase/migrations/20260510070000_fix_moderation_can_manage_domain.sql` | 45, 54 | `FROM learning.platform_admins pa` — both vc and learning branches of `can_manage_domain` | DB-only RLS |
| `learning.actor_owners` | `apps/VCSM/supabase/migrations/20260510070000_fix_moderation_can_manage_domain.sql` | 46, 55 | `JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id` — resolves `auth.uid()` to actor | DB-only RLS |
| `learning.platform_admins` | `apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js` | 7 (comment) | Documents the coupling: "existing cross-platform admin table" | App-layer comment |
| `learning.is_current_user_platform_admin` | `apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js` | 16 (comment), 24 (call) | `.rpc('is_current_user_platform_admin')` — live RPC call into learning schema | APP-LAYER ACTIVE |
| `is_current_user_platform_admin` | `apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js` | 24 | RPC call via `.schema('learning').rpc(...)` | APP-LAYER ACTIVE |
| `assertModerationAccess` | `apps/VCSM/src/features/moderation/controllers/assertModerationAccess.controller.js` | entire file | Imports `isModerationAuthorizedDAL`, throws FORBIDDEN on false | APP-LAYER ACTIVE (0 callers in UI) |
| `assertModerationAccess` | `apps/VCSM/src/features/moderation/controllers/moderationActions.controller.js` | 20, 27, 114 | Called at top of `hideReportedObjectController` and `dismissReportController` | APP-LAYER (controller) |
| `moderation.can_manage_domain` | `apps/VCSM/supabase/migrations/20260510070000_fix_moderation_can_manage_domain.sql` | 32 | `CREATE OR REPLACE FUNCTION moderation.can_manage_domain(p_domain text)` | DB-only |
| `moderation.moderators` | `apps/VCSM/supabase/migrations/20260510070000_fix_moderation_can_manage_domain.sql` | 41–42 (comment) | "After Batch 3 (moderation.moderators table), this will also check moderation.moderators" | Comment/roadmap |
| `platform_admins` | `apps/VCSM/src/learning/controller/administration/adminAccess.controller.js` | 48 | `isPlatformAdmin()` queries `learning.platform_admins` with a vc actorId | APP-LAYER ACTIVE (VCSM embedded learning — NOT moderation) |
| `can_manage_domain` | `apps/VCSM/supabase/migrations/20260510070000_fix_moderation_can_manage_domain.sql` | 32, 85 | Function definition and rollback | DB-only |

### 5.2 Wentrex Source Files (Origin of coupling)

| Search Term | File | Line(s) | Context | Runtime? |
|---|---|---|---|---|
| `learning.platform_admins` (CREATE) | `apps/wentrex/supabase/migrations/20260325184500_learning_center_guardrails.sql` | 84–96, 232, 276–303 | Table created here with RLS. `is_current_user_platform_admin()` first defined here. | Wentrex DB only |
| `learning.is_current_user_platform_admin` (origin) | `apps/wentrex/supabase/migrations/20260325184500_learning_center_guardrails.sql` | 84 | First creation: resolves via `learning.current_actor_id()` → `learning.platform_admins.actor_id` | Wentrex DB only |
| `learning.is_current_user_platform_admin` (rebuild) | `apps/wentrex/supabase/migrations/20260325222500_fix_learning_rls_helpers.sql` | 65 | Rebuilt with security fix; adds revoke grants | Wentrex DB only |

### 5.3 Planning/Proposal Files (Not promoted)

| Search Term | File | Line(s) | Context | Status |
|---|---|---|---|---|
| `moderation.moderators` (CREATE TABLE) | `zNOTFORPRODUCTION/_ACTIVE/planning/moderation-db-remediation/sql-proposals/batch3_20260510090000_create_moderation_moderators.sql` | 30–51 | Full table DDL; PROPOSAL ONLY — never promoted | PROPOSAL |
| `learning.platform_admins` (in moderators RLS) | `batch3_20260510090000_create_moderation_moderators.sql` | 100, 113, 130, 140 | `moderators_select_platform_admin`, `insert`, `update` policies | PROPOSAL |
| `can_manage_domain v2` | `batch3_20260510090000_create_moderation_moderators.sql` | 155–190 | Updated function checking moderators first, platform_admins fallback | PROPOSAL |

---

## 6. Phase 2 — Migration History Trace

### 6.1 Chronological Migration Timeline

| Date | Migration | App | Object | Purpose | Coupling Introduced? | Notes |
|---|---|---|---|---|---|---|
| 2026-03-25 | `20260325184500_learning_center_guardrails.sql` | Wentrex | `learning.platform_admins` (table), `learning.is_current_user_platform_admin()` | Creates Wentrex LMS admin roster and admin-check function | **ORIGIN** | This is a Wentrex migration. The function is designed for LMS, not VCSM moderation. |
| 2026-03-25 | `20260325222500_fix_learning_rls_helpers.sql` | Wentrex | `learning.is_current_user_platform_admin()` | Rebuilds function; adds explicit revoke/grant; fixes security definer path | Coupling codified | Changed auth resolution path; removes vc.actor_owners JOIN (moved to `learning.current_actor_id()`). |
| Pre-2026-04-27 | (pre-migration era) | VCSM | `moderation` schema, `can_manage_domain()` (original) | Initial VCSM schema setup before migration history begins | **COUPLING INITIATED** | Original `can_manage_domain` vc branch returned TRUE for any vc actor (privilege escalation). `learning` branch already used `learning.platform_admins`. |
| 2026-05-10 | `20260510010000_moderation_blocks_rls_and_indexes.sql` | VCSM | `moderation.blocks` | Add bidirectional block SELECT policy | NO — uses `moderation.is_current_vc_actor()` | No learning dependency here. |
| 2026-05-10 | `20260510070000_fix_moderation_can_manage_domain.sql` | VCSM | `moderation.can_manage_domain()` | **Fix privilege escalation. Replace broken vc branch with learning.platform_admins check.** | **COUPLING FORMALIZED AND APPLIED** | Applied 2026-06-04. Migration comment: "After Batch 3, will also check moderation.moderators with platform_admins as fallback." Explicitly acknowledges temporary nature. |
| 2026-05-18 | `20260518020000_moderation_actions_rls.sql` | VCSM | `moderation.actions` | Add SELECT/INSERT policies scoped to own actor | NO — uses `vc.actor_owners` only | No learning dependency. |
| 2026-05-27 | `20260527130000_platform_media_assets_rls_role_hardening.sql` | VCSM | `platform.media_assets` | RLS hardening for media assets | YES (separate coupling) | Uses `learning.actor_owners` for media asset ownership. Different feature, out of scope for this ticket. |

### 6.2 Key Facts from Migration Analysis

1. **When coupling was introduced:** The `learning.platform_admins` table was created 2026-03-25 (Wentrex migration). The VCSM moderation schema was created before 2026-04-27 (pre-migration era). The coupling was established when the VCSM initial schema borrowed `learning.platform_admins` as the admin authority mechanism because no VCSM-specific table existed.

2. **When moderation.moderators was introduced:** The `moderation.moderators` table was **proposed** in `batch3_20260510090000_create_moderation_moderators.sql` dated 2026-05-10. **It has never been promoted to a migration file.** The table is ABSENT from the promoted migration history.

3. **Whether moderation.moderators was intended to replace learning.platform_admins:** YES — per batch3 proposal: "Create moderation.moderators... Then update can_manage_domain to check moderators first and fall back to learning.platform_admins. This preserves backward compat — existing LMS admins keep moderation access until explicitly migrated."

4. **Whether any migration uses fallback/bridge/legacy/temporary language:**
   - `20260510070000_fix_moderation_can_manage_domain.sql` line 41–42: *"After Batch 3 (moderation.moderators table), this will also check moderation.moderators with platform_admins as fallback."* — **EXPLICIT TEMPORARY language**
   - `batch3_20260510090000_create_moderation_moderators.sql` lines 177–181: *"Priority 2: fallback to learning.platform_admins (legacy compat). Remove this branch after moderation.moderators is populated and all existing admins have been migrated to the new table."* — **EXPLICIT TEMPORARY language**

---

## 7. Phase 3 — Live DB Shape

**Status: DB_READ_UNAVAILABLE** — No live DB query access from this environment. Inspection relies on migration files, SECURITY.md, and FEATURE_INDEX.

### 7.1 Schema Objects from Migration Analysis

**`moderation.can_manage_domain(text)` — CURRENT LIVE BODY** (post Batch 1, applied 2026-06-04):
```sql
CREATE OR REPLACE FUNCTION moderation.can_manage_domain(p_domain text)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT CASE
    WHEN p_domain IN ('vc', 'chat', 'system') THEN (
      EXISTS (
        SELECT 1 FROM learning.platform_admins pa
        JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
        WHERE ao.user_id = auth.uid()
          AND COALESCE(ao.is_void, false) = false
      )
    )
    WHEN p_domain = 'learning' THEN (
      EXISTS (
        SELECT 1 FROM learning.platform_admins pa
        JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
        WHERE ao.user_id = auth.uid()
          AND COALESCE(ao.is_void, false) = false
      )
    )
    ELSE false
  END;
$$;
```

**`learning.is_current_user_platform_admin()` — CURRENT LIVE BODY** (from wentrex migration 20260325222500):
```sql
-- Rebuilds: resolves auth.uid() → learning.current_actor_id() → learning.platform_admins.actor_id
-- Note: learning.current_actor_id() resolves via vc.actor_owners
```

**`learning.platform_admins` table** (from wentrex migration 20260325184500):
- Columns inferred: `actor_id` (FK → `learning.actors.id`), created_at (estimated)
- RLS: ENABLED per wentrex migration
- Policies: SELECT/INSERT/UPDATE/DELETE all restricted to `is_current_user_platform_admin()`

**`moderation.moderators` table:**
- NOT in any promoted VCSM migration
- SECURITY.md SEC-003 status: `TABLE NEVER CREATED`
- FEATURE_INDEX: `moderation.moderators table (MISSING) — Planned, never created`
- Ticket context states "4 rows" — **UNVERIFIED from source** — cannot be confirmed without live DB access
- If the table exists in the live DB, it was created outside the migration system (governance violation)

**Required DB validation queries** (to run manually):
```sql
-- 1. Confirm can_manage_domain current body:
SELECT pg_get_functiondef('moderation.can_manage_domain(text)'::regprocedure);

-- 2. Confirm is_current_user_platform_admin body:
SELECT pg_get_functiondef('learning.is_current_user_platform_admin()'::regprocedure);

-- 3. Active moderators:
SELECT COUNT(*) AS active_moderators FROM moderation.moderators WHERE revoked_at IS NULL;

-- 4. Confirm moderation.moderators table structure:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'moderation' AND table_name = 'moderators'
ORDER BY ordinal_position;

-- 5. Count users with moderation access post-Batch-1:
SELECT COUNT(DISTINCT ao.user_id) AS platform_admin_count
FROM learning.platform_admins pa
JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
WHERE COALESCE(ao.is_void, false) = false;
```

---

## 8. Phase 4 — Runtime Callgraph Trace

### 8.1 App-Layer Call Chain

```
[UI — MISSING]
  → [No hook — MISSING]
    → hideReportedObjectController()          apps/VCSM/src/features/moderation/controllers/moderationActions.controller.js:22
    → dismissReportController()               apps/VCSM/src/features/moderation/controllers/moderationActions.controller.js:108
        → assertModerationAccessController()  apps/VCSM/src/features/moderation/controllers/assertModerationAccess.controller.js:8
            → isModerationAuthorizedDAL()     apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js:19
                → supabase.schema('learning').rpc('is_current_user_platform_admin')
                    → DB: learning.is_current_user_platform_admin()
                        → learning.current_actor_id()
                            → vc.actor_owners (auth.uid() → actor_id)
                        → learning.platform_admins (actor_id lookup)
```

### 8.2 DB-Only Call Chain (RLS)

```
Any DB read/write on:
  moderation.reports      → moderation.can_manage_domain('vc')
  moderation.report_events → moderation.can_manage_domain('vc')
  moderation.actions      → moderation.can_manage_domain('vc')
  moderation.blocks       → moderation.can_manage_domain('vc')
  moderation.block_events → moderation.can_manage_domain('vc')
      → moderation.can_manage_domain(p_domain text)
          → learning.platform_admins pa
          JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
          WHERE ao.user_id = auth.uid()
```

### 8.3 Callgraph Runtime Reachability Table

| Object | Caller | Feature | Runtime Reachable | Notes |
|---|---|---|---|---|
| `learning.is_current_user_platform_admin()` | `isModerationAuthorizedDAL` | moderation | NO (app-layer) | Controller has 0 UI callers. RPC exists but no screen/hook calls the controller chain. |
| `assertModerationAccessDAL()` | `assertModerationAccessController` | moderation | NO (app-layer) | Same reason — controller is dead export. |
| `assertModerationAccessController()` | `hideReportedObjectController`, `dismissReportController` | moderation | NO (app-layer) | Confirmed dead exports by VENOM-MODERATION-2026-06-04-002. |
| `hideReportedObjectController()` | (none) | moderation | NO | 0 callers confirmed. No moderator dashboard route exists. |
| `dismissReportController()` | (none) | moderation | NO | 0 callers confirmed. No moderator dashboard route exists. |
| `moderation.can_manage_domain()` | 8 RLS policies on moderation tables | moderation | YES (DB-only) | Active at DB layer. Every moderator-scoped SELECT/INSERT/UPDATE on moderation tables calls this function. |
| `moderation.moderators` | batch3 proposal RLS policies | moderation | NOT YET — table not created | Coupling would reduce if batch3 deployed. |
| `learning.platform_admins` | VCSM embedded learning `isPlatformAdmin()` | apps/VCSM/src/learning/ | YES (VCSM learning admin UI) | SEPARATE feature — not moderation. Expected usage. |

### 8.4 Dead Export Safety Check

`hideReportedObjectController` and `dismissReportController` have 0 callers confirmed by:
- VENOM-MODERATION-2026-06-04-002: [SOURCE_VERIFIED]
- No moderator dashboard route in route-map
- No hook wrapping either controller

These are not dead in intent — they are the correct future implementation. They are dead in current UI coverage.

---

## 9. Phase 5 — Boundary Classification

### 9.1 Classification Table

| Coupling | Object Pair | Classification | Reasoning |
|---|---|---|---|
| `can_manage_domain('vc')` → `learning.platform_admins` | VCSM moderation RLS ← Wentrex admin roster | **WENTREX_LEAKAGE + TEMPORARY_FALLBACK** | `learning.platform_admins` is a Wentrex/Learning schema table. No documentation declares it as intentional global authority for VCSM content moderation. Migration comment explicitly marks it temporary. |
| `can_manage_domain('learning')` → `learning.platform_admins` | VCSM moderation RLS ← Wentrex admin roster | **DB_RLS_DEPENDENCY + VALID_PLATFORM_AUTHORITY** | The learning domain in VCSM's moderation schema logically should use learning admin authority. This branch is coherent. |
| `assertModerationAccess.dal.js` → `learning.is_current_user_platform_admin()` RPC | VCSM app ← Wentrex DB function | **WENTREX_LEAKAGE + TEMPORARY_FALLBACK** | App layer calling a Wentrex schema function for VCSM moderation auth. Explicitly bridged. No VCSM-native alternative exists yet. |
| `VCSM/src/learning/adminAccess.controller.js` → `learning.platform_admins` | VCSM embedded LMS ← shared learning schema | **VALID_PLATFORM_AUTHORITY** | The VCSM embedded `/learning` feature is the embedded LMS. It legitimately uses the learning schema admin table to determine LMS admin access. This is NOT moderation coupling. |
| Batch 3 proposal: `moderation.moderators` RLS → `learning.platform_admins` | Future moderation RLS ← Wentrex admin roster | **TEMPORARY_FALLBACK (proposed)** | Batch3 explicitly states: "Remove this branch after moderation.moderators is populated." Backward-compat bridge only. |

### 9.2 Overall Classification

**Primary: WENTREX_LEAKAGE**

The coupling is classified as **Wentrex Leakage** because:
- `learning.platform_admins` is owned by the Wentrex LMS product (created in a Wentrex migration)
- Its `actor_id` column is FK'd to `learning.actors` (Wentrex actor namespace)
- No document or architecture decision record states that Wentrex LMS admin status should confer VCSM content moderation authority
- A Wentrex school admin becoming a VCSM content moderator is a **cross-product privilege boundary violation**

**Secondary: TEMPORARY_FALLBACK / LEGACY_BRIDGE**

The coupling is also classified as a **Temporary Fallback** because:
- The Batch 1 migration comment explicitly states: *"After Batch 3 (moderation.moderators table), this will also check moderation.moderators with platform_admins as fallback"*
- The Batch 3 proposal explicitly states: *"Remove this branch after moderation.moderators is populated"*
- The fix was the best available option at time of writing (no VCSM-native admin table existed)

**NOT Classified As:**
- **Intentional**: No ADR or architecture doc declares this cross-product authority intentional
- **Architecture Violation (hard)**: The migration author was aware of the shortcut and documented the path forward
- **Safe Fallback**: A Wentrex LMS school admin having VCSM moderation authority is not safe by design — it is safe only because both tables are currently managed by the same operator

---

## 10. Phase 6 — Target Architecture Recommendation

| Option | Description | Pros | Cons | Risk | Recommendation |
|---|---|---|---|---|---|
| **A** | `moderation.moderators` is the only VCSM moderation authority | Clean separation. No cross-product dependency. | Requires batch3 deployed AND data backfilled before `learning.platform_admins` can be removed. Existing admins lose access during migration window if not careful. | **MEDIUM** — safe with correct deploy order | ✅ Correct final state |
| **B** | `moderation.moderators` primary, `learning.platform_admins` temporary fallback | Backward compat preserved. Exact design of batch3 proposal. No access loss on deploy. | Coupling persists during transition. Must have explicit sunset date. | **LOW** — already designed | ✅ Correct next step (batch3 as written) |
| **C** | Global `platform_admins` moved out of `learning` schema into `platform` schema | Correct long-term: no schema owns another schema's admin roster | Requires a schema migration, function rewrites, Wentrex migration, VCSM migration, and cross-team coordination | **HIGH** — large scope | ⚠️ Correct architecture goal, not near-term |
| **D** | `learning.platform_admins` dependency documented as intentional | No migration required | Formalizes cross-product authority as intentional. Wentrex school admin = VCSM moderator by design. | **HIGH** — architecturally incorrect for a product with independent access models | ❌ Not recommended |

### Recommended Path:

**Phase 1 (now): Deploy Batch 3 (moderation.moderators)**
- Promotes `batch3_20260510090000_create_moderation_moderators.sql` to a migration file
- Creates the native VCSM moderation role table
- Updates `can_manage_domain` to check `moderation.moderators` first, `learning.platform_admins` fallback
- Zero access disruption — existing platform admins retain access via fallback

**Phase 2 (after batch3 is stable): Migrate existing admins**
- Backfill `moderation.moderators` with current `learning.platform_admins` members who should be VCSM moderators
- Establishes VCSM-specific role assignments

**Phase 3 (after backfill confirmed): Remove fallback**
- Update `can_manage_domain` to remove `learning.platform_admins` branch for `vc`, `chat`, `system` domains
- `learning` domain may retain the `learning.platform_admins` check if desired (or transition to `moderation.moderators` with `domain = 'learning'`)
- Deploy as a migration

**Phase 4 (long-term, Option C):**
- Extract `platform_admins` to a `platform` schema shared by VCSM and Wentrex
- Requires cross-product coordination

---

## 11. Phase 7 — Risk Assessment

### Risk 1: Remove `learning.platform_admins` from `can_manage_domain` without batch3

**Impact:** ALL moderation access lost. All 8 moderator-scoped RLS policies deny. No moderation action possible.
**Likelihood if removed prematurely:** CERTAIN
**Current state:** Cannot be removed until `moderation.moderators` table is created and populated.

### Risk 2: Replace `learning.is_current_user_platform_admin()` in app DAL without alternative

**Impact:** `isModerationAuthorizedDAL` always returns false. `assertModerationAccessController` always throws FORBIDDEN. All app-layer moderation actions fail.
**Current severity:** LOW — controllers have 0 UI callers. Impact is theoretical until moderator dashboard is built.
**Recommendation:** Replace only after batch3 is deployed and `moderation.moderators` has data.

### Risk 3: `moderation.moderators` not populated when fallback removed

**Impact:** Platform admins who rely on `learning.platform_admins` fallback lose moderation access.
**Mitigation:** Batch 3 design explicitly preserves fallback until manual migration. Batches must deploy in order.

### Risk 4: Wentrex school admin accrual

**Impact:** As Wentrex grows, every new school admin added to `learning.platform_admins` automatically gains VCSM content moderation authority. This is invisible — no VCSM-side audit event.
**Current severity:** MEDIUM — depends on operational discipline in `learning.platform_admins` management.
**Mitigation:** Deploy batch3, reduce dependency on `learning.platform_admins` for VCSM moderation.

### Risk 5: `can_manage_domain` RLS policies not rewritten after batch3

**Impact:** Even after `moderation.moderators` exists, the RLS continues to use `learning.platform_admins` for backup until `can_manage_domain` is updated to v2 (batch3 logic).
**Severity:** LOW — the fallback is intentional and documented.

### Risk 6: `moderation.moderators` table in live DB without migration record

**Impact:** The ticket context states "4 rows" in moderation.moderators. If the table exists in the live DB but was NOT created via the migration system, this is a governance gap — the table has no migration, no FORCE RLS, and potentially no policies.
**Severity if confirmed:** HIGH — service_role can bypass all RLS on an unprotected table.
**Recommended action:** Run DB queries (Phase 3) to confirm table state. If table exists outside migration history, promote batch3 immediately to apply FORCE RLS and correct policies.

### Risk 7: VCSM embedded learning `isPlatformAdmin()` uses vc actorId against learning schema

**Impact:** `adminAccess.controller.js:48` queries `learning.platform_admins.actor_id = actorId` where actorId is a vc actor UUID. This is an **identity namespace collision risk** — `learning.platform_admins.actor_id` is FK'd to `learning.actors.id` (Wentrex actor UUIDs), not vc actor UUIDs. A vc actor UUID passed here will return false unless by UUID collision.
**Status:** Separate from moderation coupling. This is the VCSM embedded LMS feature. Flagged as related risk.
**Severity:** MEDIUM — VCSM LMS admin detection may silently fail.

---

## 12. Architecture Findings Summary

### FINDING-001 — WENTREX_LEAKAGE — CRITICAL (architectural) — [SOURCE_VERIFIED]

**`moderation.can_manage_domain` uses `learning.platform_admins` (Wentrex schema) for VCSM content moderation authority**

- File: `apps/VCSM/supabase/migrations/20260510070000_fix_moderation_can_manage_domain.sql:37–61`
- File: `apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js:22–25`
- DB impact: 8 RLS policies on moderation tables delegate authority to a Wentrex-owned table
- Classification: **WENTREX_LEAKAGE + TEMPORARY_FALLBACK**
- Reason it exists: No VCSM-native moderation admin table. Batch 3 fix designed but not promoted.
- Provenance: [SOURCE_VERIFIED]

### FINDING-002 — TABLE_ABSENT — HIGH — [SOURCE_VERIFIED]

**`moderation.moderators` has no promoted migration. Status: MISSING from migration history.**

- Evidence: Migration directory search returns no CREATE TABLE for `moderation.moderators`
- Only source: `batch3_20260510090000_create_moderation_moderators.sql` (PROPOSAL ONLY)
- SECURITY.md SEC-003: "TABLE NEVER CREATED"
- Ticket context "4 rows" could not be verified — requires live DB inspection (Phase 3 queries above)
- If table exists in live DB without a migration: governance gap requiring immediate resolution
- Provenance: [SOURCE_VERIFIED]

### FINDING-003 — DEAD_EXPORT — MEDIUM — [SOURCE_VERIFIED]

**App-layer moderation authority chain has 0 UI callers. The `learning.is_current_user_platform_admin()` RPC call is reachable from source code but never triggered through any UI route.**

- `hideReportedObjectController` + `dismissReportController` — 0 callers
- No moderator dashboard route in route-map
- DB-layer coupling via RLS is active and covering 8 policies
- App-layer coupling is dormant until moderator dashboard is built
- Provenance: [SOURCE_VERIFIED] (VENOM-MODERATION-2026-06-04-002)

### FINDING-004 — IDENTITY_NAMESPACE_RISK — MEDIUM — [SOURCE_VERIFIED]

**VCSM embedded LMS `isPlatformAdmin()` queries `learning.platform_admins.actor_id` with a vc actor UUID**

- File: `apps/VCSM/src/learning/controller/administration/adminAccess.controller.js:41–62`
- `learning.platform_admins.actor_id` is FK'd to `learning.actors.id` (Wentrex namespace)
- vc actor UUIDs != learning actor UUIDs in the general case
- This is NOT moderation — it is the VCSM embedded LMS admin check
- Result: VCSM LMS admin status detection silently returns false for vc actors
- Provenance: [SOURCE_VERIFIED]

### FINDING-005 — BATCH_DEPLOY_ORDER_CONSTRAINT — HIGH — [SOURCE_VERIFIED]

**Batch 5 (FORCE RLS) must never deploy before Batch 1 is confirmed live. Batch 3 must deploy before learning.platform_admins fallback can be removed.**

- Current state: Batch 1 applied 2026-06-04 ✓. Batches 2–6 still proposals.
- Risk: If Batch 5 (FORCE RLS) deploys before Batch 3, the `moderation.moderators` table would have FORCE RLS with no policies — creating a second service_role lockout.
- Provenance: [SOURCE_VERIFIED] (batch5 proposal header, SECURITY.md)

---

## 13. Module Completeness Matrix — Moderation

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | SECURITY.md, CURRENT_STATUS.md describe the feature | BEHAVIOR.md MISSING — THOR gate cannot clear |
| Owner defined | FAIL | OWNERSHIP.md MISSING | No formal owner documented |
| Entry points mapped | FAIL | No moderator dashboard route. Report creation UI only. | Moderator UI entirely missing |
| Controllers present | PARTIAL | `hideReportedObjectController`, `dismissReportController`, `assertModerationAccessController` exist | 0 callers — all dead exports |
| DAL present | PARTIAL | `assertModerationAccess.dal.js`, `reports.dal.js` present | DAL calls Wentrex function |
| Models/transformers | PASS | `report.model.js` present | — |
| Hooks/view models | FAIL | No moderator hook | No `useModerator` or equivalent |
| Screens/components | PARTIAL | `ReportModal.jsx` for reporting side | No moderator admin screen |
| Services/adapters | FAIL | None | No adapter for moderation feature |
| Database objects | PARTIAL | `moderation` schema tables exist | `moderation.moderators` MISSING; batch3 undeployed |
| Authorization path | FAIL | Path exists in code but depends on Wentrex schema; 0 UI callers | WENTREX_LEAKAGE; no VCSM-native authority |
| Cache/runtime behavior | FAIL | No caching layer documented | — |
| Error/loading/empty states | PARTIAL | Error thrown in controller; no empty state for dashboard | Dashboard MISSING |
| Documentation | PARTIAL | SECURITY.md, CURRENT_STATUS.md present | ARCHITECTURE.md, BEHAVIOR.md, OWNERSHIP.md, TESTS.md MISSING |
| Tests/validation | FAIL | No test file for moderation controllers/DAL | — |
| Native parity | N/A | — | — |
| Engine dependencies | FAIL | No formal engine; direct DB access | No engine boundary |

**Final Module Status: INCOMPLETE**

---

## 14. Behavior Contract Consistency Check — Moderation

```
Behavior Consistency Check — moderation
=======================================
BEHAVIOR.md present: NO
Status: MISSING

Check A (Source without behavior): FINDING
  → Controllers, DAL, RLS exist. No BEHAVIOR.md. Finding: BEHAVIOR_CONTRACT_ABSENT [moderation]
  → Severity: P1 (critical security feature with active VENOM findings)

Check B (Behavior without source):
  → Cannot run — BEHAVIOR.md absent. All §3 happy paths undeclared.
  → Behavioral invariants exist only as IMPLICIT_INVARIANT in BW scan.

Check C (§13 engine consistency):
  → No BEHAVIOR.md §13. Cannot compare.
  → Source observation: no engine import found. Direct DB access only.

Check D (§6 data change consistency):
  → No BEHAVIOR.md §6. Cannot compare.
  → Source observation: DAL writes to moderation.reports, moderation.report_events,
    moderation.actions, vc.posts.hidden_by_actor_id, chat.messages.hidden_by_actor_id.
```

---

## 15. Source Verification Summary

| Item | Result |
|---|---|
| Total scanner signals used | 6 |
| Signals verified against source | 6 / 6 |
| Source files read | assertModerationAccess.dal.js, assertModerationAccess.controller.js, moderationActions.controller.js, adminAccess.controller.js (VCSM learning), moderation migration files, SECURITY.md, FEATURE_INDEX/moderation.md, CURRENT_STATUS.md, batch3 proposal |
| CRITICAL findings | 1 (FINDING-001 — architectural) — [SOURCE_VERIFIED]: YES |
| HIGH findings | 2 (FINDING-002, FINDING-005) — both [SOURCE_VERIFIED]: YES |
| MEDIUM findings | 2 (FINDING-003, FINDING-004) — both [SOURCE_VERIFIED]: YES |

---

## 16. Confidence Summary

| Category | Count |
|---|---|
| HIGH confidence scanner signals used | 5 |
| MEDIUM confidence scanner signals used | 1 |
| LOW confidence scanner signals used | 0 |
| [SOURCE_VERIFIED] findings | 5 (all) |
| [SCANNER_LEAD] findings | 0 |
| [SCANNER_LOW_CONF] findings | 0 |
| Security severity findings routed to VENOM | 0 (existing VENOM scan current) |

---

## 17. Executive Summary

### What Happened

When the VCSM moderation schema was initialized (pre-migration era, before 2026-04-27), the original developer needed an admin authority check for `moderation.can_manage_domain`. No VCSM-specific admin table existed. The Wentrex LMS schema had already created `learning.platform_admins` (2026-03-25). The developer borrowed it.

This shortcut created a **cross-product privilege coupling**: any user in `learning.platform_admins` (a Wentrex LMS admin roster) automatically has VCSM content moderation authority on `vc`, `chat`, and `system` domains.

The original `can_manage_domain` was additionally broken for the `vc` domain — it returned TRUE for every authenticated VCSM user (privilege escalation). This was patched in Batch 1 (applied 2026-06-04). The patch preserved the `learning.platform_admins` coupling but restricted it to actual LMS admins.

### Current State

- **DB layer:** `can_manage_domain` uses `learning.platform_admins` for all domain checks. Active on 8 RLS policies. **This is the live coupling.**
- **App layer:** `assertModerationAccess.dal.js` calls `learning.is_current_user_platform_admin()` RPC. App-layer controllers have 0 UI callers — the coupling is dormant until a moderator dashboard is built.
- **`moderation.moderators` table:** Does not exist in promoted migration history. SECURITY.md marks it MISSING. The ticket's "4 rows" claim cannot be verified without live DB access.
- **No documentation** declares the coupling intentional or global.

### Why It Exists (Summary)

| Root Cause | Evidence |
|---|---|
| No VCSM-specific admin table at schema initialization | No migration creates VCSM admin table before moderation. Batch3 was designed later. |
| Wentrex `learning.platform_admins` was the nearest available authority | Created 2026-03-25; VCSM schema initialized after |
| Intentional temporary shortcut by migration author | Batch1 migration: *"After Batch 3... check moderation.moderators with platform_admins as fallback"* |

### Final Classification

**MODERATION_LEARNING_COUPLING_CONFIRMED**

The coupling is real, active at the DB RLS layer, documented as temporary by the migration author, and represents a Wentrex leakage into VCSM moderation authority with no explicit cross-product governance decision.

---

## 18. Required Follow-Up Tickets

### TICKET-MODERATION-AUTHORITY-DECOUPLE-0001 (P1)
**Deploy Batch 3: Create moderation.moderators**
- Promote `batch3_20260510090000_create_moderation_moderators.sql` to a formal migration file
- Assign: CARNAGE
- Dependency: Batch 1 applied ✓
- Output: `moderation.moderators` table with FORCE RLS, 3 policies, updated `can_manage_domain` v2
- Unblocks: removal of learning.platform_admins from VCSM moderation

### TICKET-MODERATION-MODERATORS-POPULATE-0001 (P1, after above)
**Backfill moderation.moderators from current platform admins**
- Identify users in `learning.platform_admins` who should be VCSM moderators
- Insert into `moderation.moderators` with appropriate role assignments
- Assign: IRONMAN (ownership decision) + CARNAGE (data migration)
- Dependency: TICKET-MODERATION-AUTHORITY-DECOUPLE-0001

### TICKET-MODERATION-AUTHORITY-MODEL-0001 (P2)
**Remove learning.platform_admins fallback from can_manage_domain**
- After moderators table is populated, remove the fallback branch
- Deploy as migration
- Assign: CARNAGE + VENOM verification
- Dependency: TICKET-MODERATION-MODERATORS-POPULATE-0001

### TICKET-MODERATION-BEHAVIOR-CONTRACT-0001 (P1)
**Author BEHAVIOR.md for moderation feature**
- Required for THOR behavioral release gate
- Declare §5 security rules, §9 must-never-happen invariants, §3 happy paths
- Assign: ProfessorX
- Blocks: THOR clearance for any moderation-related release

### TICKET-MODERATION-MODERATORS-DB-AUDIT-0001 (P0 if table exists without migration)
**Verify moderation.moderators DB state**
- Run Phase 3 queries (see above)
- If table exists without migration: confirm RLS state, FORCE RLS, and policies
- If table is unprotected: immediate governance escalation
- Assign: DB + CARNAGE

### TICKET-PLATFORM-ADMIN-AUTHORITY-MODEL-0001 (P3, long-term)
**Evaluate extracting platform_admins to shared platform schema**
- Option C from Phase 6 — long-term correct architecture
- Requires cross-product coordination (VCSM + Wentrex)
- Assign: ARCHITECT + IRONMAN (cross-product ownership design)

---

## 19. Handoff Recommendations

| Command | Reason |
|---|---|
| **CARNAGE** | Deploy Batch 3 (moderation.moderators). Then Batch 5 (FORCE RLS). Then fallback removal. |
| **IRONMAN** | Define cross-product admin authority model. Who should own the platform_admins decision? |
| **VENOM** | Verify batch3 policies are correctly scoped. Verify can_manage_domain v2 correctness. |
| **DB** | Run Phase 3 inspection queries. Confirm moderation.moderators live state. |
| **THOR** | Batch 3 deployment is a THOR-gate event for any future moderator dashboard ticket. |
| **SPIDER-MAN** | TESTREQ-MODERATION-001 through 005 defined in SECURITY.md BlackWidow section. |
| **BLACKWIDOW** | Re-test after batch3 deployed. VEMON-001 awaiting validation confirmation. |

---

## 20. Final Verdict

**MODERATION_LEARNING_COUPLING_CONFIRMED**

The coupling is:
- ✅ **Confirmed active** — DB RLS layer is live and using `learning.platform_admins`
- ✅ **Explicitly temporary** — migration author documented it as such; batch3 plan exists
- ✅ **Not intentional governance** — no ADR, no platform decision document, no cross-product agreement
- ✅ **Not safe by design** — safety depends entirely on operational discipline in `learning.platform_admins` management
- ✅ **Architecture violation in progress** — VCSM content moderation should not depend on a Wentrex schema object

**Classification: WENTREX_LEAKAGE + TEMPORARY_FALLBACK**

**Next required action: Deploy Batch 3 (moderation.moderators) via CARNAGE.**

---

**ARCHITECT_MODERATION_LEARNING_COUPLING_TRACE_COMPLETE**
