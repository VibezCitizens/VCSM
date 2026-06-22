# CARNAGE Migration Report — vport.business_card_leads Security Hardening
**Date:** 2026-05-24  
**Application Scope:** VCSM  
**Triggered by:** VENOM findings VL-001–VL-005 + DB findings DB-001, DB-002, DB-003, DB-006  
**Source report:** `zNOTFORPRODUCTION/_HISTORY/db/snapshots/2026-05-24_db_vport-business-card-leads.md`  
**Mode:** Read-only — migration plans only, no execution

---

## CARNAGE TARGET

```
Object being changed:  vport.business_card_leads (table, policies, grants, RPC)
Application Scope:     VCSM
Type of change:        Security hardening — policy replacement, grant correction, constraint addition, RPC surface reduction
Reason:                Live DB state diverged from tracked migration intent (20260427060000, 20260427080000).
                       Two untracked out-of-band changes applied via SQL editor:
                       (1) Permissive INSERT policies created after migration 20260427060000 declared them blocking
                       (2) Full-row UPDATE grant overrode the column-scoped GRANT UPDATE (source) in 20260427080000
                       Combined with legacy RPC overload and missing source constraint, live surface has 4 open security gaps.
```

---

## CURRENT STRUCTURE

```
Table:      vport.business_card_leads
Schema:     vport
Columns:    id (uuid PK), vport_profile_id (FK → vport.profiles), actor_id (FK → vc.actors nullable),
            name (text NN), phone (text), email (text), message (text NN), source (text NN, DEFAULT 'business_card'),
            user_agent (text), ip_address (inet), created_at (timestamptz NN DEFAULT now())
RLS:        ENABLED (not forced — postgres bypasses)

Policies (live):
  business_card_leads_insert_anon          INSERT  anon          WITH CHECK (profile IS NOT NULL AND name > 0 AND message > 0)  ← PERMISSIVE (should be false)
  business_card_leads_insert_authenticated INSERT  authenticated WITH CHECK (same)                                               ← PERMISSIVE (should be false)
  business_card_leads_owner_select         SELECT  authenticated USING (owner subquery via vport.profiles + vc.actor_owners)
  business_card_leads_owner_update         UPDATE  authenticated USING + WITH CHECK (owner subquery)
  business_card_leads_owner_delete         DELETE  authenticated USING (owner subquery)

Grants (live):
  anon          | INSERT  (table-level, all columns)
  authenticated | INSERT  (table-level, all columns)
  authenticated | SELECT  (all columns)
  authenticated | UPDATE  (all columns) ← FULL-ROW — should be UPDATE (source) only
  authenticated | DELETE

RPC (live — two overloads):
  Overload 1 (LEGACY): submit_business_card_lead(p_vport_profile_id uuid, p_name, p_message, p_phone, p_email, p_source)
    SECURITY DEFINER | GRANT EXECUTE TO PUBLIC, anon, authenticated | NO availability guard | actor_id = NULL hardcoded
  Overload 2 (CURRENT): submit_business_card_lead(p_slug text, p_name, p_phone, p_email, p_message, p_source, p_user_agent, p_ip)
    SECURITY DEFINER | GRANT EXECUTE TO PUBLIC, anon, authenticated | Availability guard (business_card_published + is_active + !is_deleted)

Constraints:
  PK: id
  FK: vport_profile_id → vport.profiles(id) ON DELETE CASCADE
  FK: actor_id → vc.actors(id) ON DELETE SET NULL
  CHECK: phone IS NOT NULL OR email IS NOT NULL
  MISSING: CHECK on source column (no allowlist)

Indexes:
  business_card_leads_pkey: UNIQUE btree (id)
  business_card_leads_profile_created_idx: btree (vport_profile_id, created_at DESC)
  business_card_leads_actor_created_idx: btree (actor_id, created_at DESC)

Live data:
  8 rows total | 0 rows with ip_address | all rows source = *_contacted | 3 VPORTs have leads
  Pre-flight: 0 rows violate proposed source allowlist
```

---

## SCHEMA TRUST CLASSIFICATION

| Object | Classification | Reason |
|---|---|---|
| `vport.business_card_leads` | Ownership-sensitive + External-API-sensitive | PII (name, phone, email, message) from external submitters; owner-controlled CRM state; exposed via public RPC to Traffic/TRAZE callers |
| `vport.submit_business_card_lead` (legacy) | External-API-sensitive | Callable by anon/PUBLIC with no availability guard; dead caller surface |
| `vport.submit_business_card_lead` (current) | External-API-sensitive | Primary public write path; availability-gated; relied on by VCSM PWA + Traffic |
| INSERT policies | Ownership-sensitive | Govern whether direct bypass of SECURITY DEFINER path is possible |
| UPDATE grant | Ownership-sensitive | Determines which columns owner can mutate on received PII lead records |

---

## MIGRATION BLAST RADIUS

```
Affected systems:  VCSM (dashboard leads module), Traffic (submitProviderLeadRow DAL)
Runtime impact:    Low — no active paths broken; blocking policies and column-scoped grant match current app behavior
Release impact:    BLOCKS release of vport-booking-feed-security-updates branch until P0 items resolved
Rollback impact:   Each migration is independently reversible; see per-migration rollback plans
```

---

## RLS IMPACT REVIEW

| Object | RLS Dependency | Risk | Follow-up Required |
|---|---|---|---|
| INSERT policies | CRITICAL — these ARE the RLS INSERT gate | Permissive policies currently allow direct table bypass | M-001 replaces them |
| UPDATE grant scope | DIRECT — owner_update policy row-gates UPDATE | Full-row grant allows owner to mutate PII columns without any additional check | M-004 corrects grant |
| DELETE policy | LOW — owner_delete is correct and unchanged | None | None |
| SELECT policy | LOW — owner_select is correct and unchanged | None | None |
| Legacy RPC | DIRECT — SECURITY DEFINER bypasses RLS | No availability guard in legacy overload | M-002 drops it |

---

## RUNTIME IMPACT ANALYSIS

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| `createVportBusinessCardLeadDAL` (VCSM PWA) | NONE | Uses slug-based RPC overload; unaffected by all 4 migrations | N/A |
| `submitProviderLeadRow` (Traffic) | NONE | Uses slug-based RPC overload (`p_slug`); legacy overload not called | Verified in code |
| `markVportBusinessCardLeadContactedDAL` | NONE | Updates only `source` column; column-scoped grant matches current behavior | N/A |
| `deleteVportBusinessCardLeadDAL` | NONE | Hard DELETE; no schema changes to DELETE path | N/A |
| `readVportBusinessCardLeadsByProfileDAL` | NONE | SELECT only; SELECT grant and policy unchanged | N/A |
| `readNewLeadsCountByProfileDAL` | NONE | COUNT with .not("source","ilike","%contacted%"); filters unaffected | N/A |
| 60s poll `useVportNewLeadsCount` | NONE | No schema surface touched | N/A |
| `submit_business_card_lead` (legacy — Overload 1) | REMOVED | No active callers; DROP eliminates dead attack surface | Caller audit confirmed |
| Source CHECK constraint (M-003) | LOW | All 8 existing rows in allowlist (0 violations confirmed live) | Pre-flight done |

---

## MIGRATION DEPENDENCY GRAPH

| Dependency Type | Affected Area | Risk |
|---|---|---|
| RLS dependency | M-001 depends on no app code doing direct INSERT | Verified — zero direct INSERTs in codebase |
| RPC dependency | M-002 depends on no active callers of legacy overload | Verified — Traffic + VCSM both use slug-based overload |
| Data dependency | M-003 depends on no live source values outside allowlist | Verified — 0 of 8 rows violate allowlist |
| Grant dependency | M-004 depends on DAL only using source column in UPDATE | Verified — write DAL updates `.update({ source: nextSource })` only |
| Sequencing | M-001 and M-002 are independent of each other — P0 | Can deploy in same migration file |
| Sequencing | M-003 and M-004 are independent of each other — P1 | Can deploy in same migration file |
| Sequencing | P1 (M-003, M-004) may deploy after P0 (M-001, M-002) | No inter-dependency between P0 and P1 |

---

## DATA INTEGRITY REVIEW

| Integrity Area | Risk | Detection Method | Mitigation |
|---|---|---|---|
| source allowlist constraint (M-003) | NONE — 0 rows violate | Live pre-flight query confirmed | Constraint safe to apply immediately |
| Column-scoped UPDATE revert (M-004) | NONE — DAL only touches source | Code audit of write DAL | Full-row UPDATE grant not used by any DAL method |
| Legacy RPC DROP (M-002) | NONE — no active callers | ARCHITECT caller audit | DROP is safe; actor_id = NULL rows from legacy path already present (none found) |
| Direct INSERT block (M-001) | NONE — no direct inserts in codebase | Code audit of all DAL files | Blocking policy has no app-layer impact |

---

## IDENTITY / OWNERSHIP MIGRATION WARNING

```
Object: vport.business_card_leads — actor_id column
Current behavior: actor_id is set by the slug-based RPC (Overload 2) to the VPORT's actor_id from the profile lookup. 
                  actor_id in lead records identifies which VPORT actor received the lead.
Migration risk: M-004 does NOT change actor_id writability for the app — UPDATE (source) grant means 
                only source can be updated by authenticated role.
                However: current full-row UPDATE grant technically allows owner to rewrite actor_id.
Potential impact: With M-004 in place, actor_id becomes immutable post-INSERT for authenticated role — 
                  this is the CORRECT behavior (actor association locked at submit time).
Recommended safeguards: No additional safeguards needed beyond M-004.
```

---

## BOUNDARY MIGRATION REVIEW

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `vport.business_card_leads` | VCSM | None | VCSM-only table — no cross-root concern |
| `vport.submit_business_card_lead` | VCSM | Traffic calls slug-based overload | Traffic boundary safe — Traffic uses anon RPC, no schema ownership |
| `vport.profiles` (referenced in policies) | VCSM | None | Read-only reference in RLS subquery; policy changes don't touch profiles |
| `vc.actor_owners` (referenced in policies) | ENGINE | None | Read-only reference in RLS subquery; ownership policies unchanged |

---

---

## MIGRATION EXECUTION STRATEGY

| Phase | Strategy | Risk | Notes |
|---|---|---|---|
| P0 | Direct migration — policy replacement | SAFE | No app breakage; all insert paths via RPC |
| P0 | Direct migration — DROP FUNCTION (legacy overload) | SAFE | Zero active callers confirmed |
| P1 | Direct migration — ADD CONSTRAINT | SAFE | 0 rows violate live; constraint is additive |
| P1 | Direct migration — REVOKE + column GRANT | SAFE | DAL only touches source; column behavior unchanged |

**Recommended deployment order:**
1. Deploy P0 migration file (`...business_card_leads_p0_security.sql`) — contains M-001 + M-002
2. Verify: lead submission still works in staging (Traffic + VCSM PWA)
3. Deploy P1 migration file (`...business_card_leads_p1_hardening.sql`) — contains M-003 + M-004
4. Verify: source mutation (mark contacted) still works in staging

---

---

## MIGRATION PLANS

---

### M-001 — P0 CRITICAL — Block Direct INSERT (Replace Permissive Policies)

```
CARNAGE MIGRATION PLAN
- Object: vport.business_card_leads INSERT policies
- Application Scope: VCSM
- Current structure: Permissive INSERT policies for anon + authenticated (WITH CHECK validates name/message/profile only)
- Proposed change: Replace both INSERT policies with blocking policies (WITH CHECK (false))
                   Optionally also REVOKE table-level INSERT grants from anon + authenticated
- Risks detected: NONE for app — RPC is SECURITY DEFINER (runs as postgres, bypasses RLS)
- Migration safety: SAFE
- Rollback plan: Recreate permissive INSERT policies (revert DROP/CREATE)
- Expected benefit: Direct table INSERT bypass eliminated; RPC is the enforced write path
```

**Drift note:** Migration `20260427060000` explicitly excluded `business_card_leads` from INSERT grants, stating "RPC-only, blocking RLS (WITH CHECK false)". The live DB does not reflect this. The permissive INSERT policies were applied out-of-band via SQL editor.

**Example SQL proposal (text only — do not execute):**

```sql
-- ============================================================
-- Migration: business_card_leads_p0_block_direct_insert
-- Part of: vport.business_card_leads security hardening (P0)
-- ============================================================

-- Step 1: Replace permissive INSERT policies with blocking ones.
-- SECURITY DEFINER RPC runs as postgres and bypasses RLS — unaffected.

DROP POLICY IF EXISTS business_card_leads_insert_anon          ON vport.business_card_leads;
DROP POLICY IF EXISTS business_card_leads_insert_authenticated ON vport.business_card_leads;

CREATE POLICY business_card_leads_no_direct_insert ON vport.business_card_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

-- Step 2 (recommended): Revoke unnecessary INSERT table grants.
-- RPC path does not need these — SECURITY DEFINER uses postgres privileges.
-- Defense-in-depth: removes table privilege so the blocked INSERT never reaches RLS.

REVOKE INSERT ON vport.business_card_leads FROM anon;
REVOKE INSERT ON vport.business_card_leads FROM authenticated;
```

**Rollback (text only):**
```sql
DROP POLICY IF EXISTS business_card_leads_no_direct_insert ON vport.business_card_leads;

GRANT INSERT ON vport.business_card_leads TO anon;
GRANT INSERT ON vport.business_card_leads TO authenticated;

CREATE POLICY business_card_leads_insert_anon ON vport.business_card_leads
  FOR INSERT TO anon
  WITH CHECK (
    vport_profile_id IS NOT NULL
    AND length(btrim(name)) > 0
    AND length(btrim(message)) > 0
  );

CREATE POLICY business_card_leads_insert_authenticated ON vport.business_card_leads
  FOR INSERT TO authenticated
  WITH CHECK (
    vport_profile_id IS NOT NULL
    AND length(btrim(name)) > 0
    AND length(btrim(message)) > 0
  );
```

---

### M-002 — P0 HIGH — Drop Legacy RPC Overload

```
CARNAGE MIGRATION PLAN
- Object: vport.submit_business_card_lead(p_vport_profile_id uuid, ...)
- Application Scope: VCSM
- Current structure: Two overloads of submit_business_card_lead; legacy overload callable by PUBLIC with no availability guard
- Proposed change: DROP the legacy overload (p_vport_profile_id uuid signature)
- Risks detected: NONE — zero active callers confirmed in VCSM app and Traffic app
- Migration safety: SAFE
- Rollback plan: Recreate function body from DB report snapshot
- Expected benefit: Dead attack surface removed; only slug-based availability-gated overload survives
```

**Caller audit result:**
- `apps/VCSM/src/features/public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js` → uses `p_slug` (Overload 2)
- `apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js` → uses `p_slug` (Overload 2)
- No caller passes `p_vport_profile_id` — legacy overload is dead surface

**Example SQL proposal (text only — do not execute):**

```sql
-- ============================================================
-- Migration: business_card_leads_p0_drop_legacy_rpc
-- Part of: vport.business_card_leads security hardening (P0)
-- ============================================================

-- Drop legacy RPC overload. No active callers in VCSM app or Traffic app.
-- Caller audit performed 2026-05-24 — both DAL files use p_slug signature.

DROP FUNCTION IF EXISTS vport.submit_business_card_lead(
  p_vport_profile_id uuid,
  p_name             text,
  p_message          text,
  p_phone            text,
  p_email            text,
  p_source           text
);
```

**Rollback (text only — recreate from snapshot if needed):**
```sql
-- Restore legacy overload body from DB snapshot:
-- zNOTFORPRODUCTION/_HISTORY/db/snapshots/2026-05-24_db_vport-business-card-leads.md
-- Section: LIVE RPC — Overload 1 — LEGACY (p_vport_profile_id)
-- Note: if restoring, GRANT EXECUTE TO PUBLIC must also be re-applied.
-- Rollback should only be needed if a caller outside the audited scope is discovered.
```

---

### M-003 — P1 HIGH — Add source CHECK Constraint (Allowlist)

```
CARNAGE MIGRATION PLAN
- Object: vport.business_card_leads.source (column constraint)
- Application Scope: VCSM
- Current structure: source is TEXT NOT NULL with no allowlist; any value accepted verbatim
- Proposed change: ADD CONSTRAINT with allowed source value set
- Risks detected: NONE — live pre-flight confirms 0 of 8 rows violate allowlist
- Migration safety: SAFE (additive constraint; compatible with all live data)
- Rollback plan: DROP CONSTRAINT
- Expected benefit: Prevents source field pre-poisoning attack (isContacted = true via source.includes("contacted") at submit time)
```

**Pre-flight result (live DB, 2026-05-24):** `total=8, would_violate=0`

**Allowlist values:**
- Submission-time: `business_card`, `vport_card`, `directory`, `traze`, `traze_provider_lead`
- Post-contact (owner mutation): `business_card_contacted`, `vport_card_contacted`, `directory_contacted`, `traze_contacted`

**Example SQL proposal (text only — do not execute):**

```sql
-- ============================================================
-- Migration: business_card_leads_p1_source_allowlist
-- Part of: vport.business_card_leads security hardening (P1)
-- Pre-flight: 0 rows violate allowlist (confirmed 2026-05-24 live)
-- ============================================================

ALTER TABLE vport.business_card_leads
  ADD CONSTRAINT business_card_leads_source_allowlist
  CHECK (
    source IN (
      'business_card',
      'vport_card',
      'directory',
      'traze',
      'traze_provider_lead',
      'business_card_contacted',
      'vport_card_contacted',
      'directory_contacted',
      'traze_contacted'
    )
  );
```

**Rollback (text only):**
```sql
ALTER TABLE vport.business_card_leads
  DROP CONSTRAINT IF EXISTS business_card_leads_source_allowlist;
```

**Note on new source values:** If future source variants are introduced (e.g., a new acquisition channel), the RPC's `p_source` default and this constraint must be updated together. A new channel should be listed before the migration goes live. Constraint prevents untracked source variants from silently entering the system.

---

### M-004 — P1 HIGH — Fix Full-Row UPDATE Grant → Column-Scoped (source only)

```
CARNAGE MIGRATION PLAN
- Object: vport.business_card_leads — authenticated UPDATE grant
- Application Scope: VCSM
- Current structure: GRANT UPDATE on all 11 columns to authenticated (full-row)
- Proposed change: REVOKE full-row UPDATE; GRANT UPDATE (source) column-scoped
- Risks detected: NONE — write DAL only uses .update({ source: nextSource }); no other column updated by app
- Migration safety: SAFE
- Rollback plan: REVOKE column UPDATE; GRANT full-row UPDATE
- Expected benefit: Enforces immutability of PII columns (name, phone, email, message) post-INSERT; matches original migration 20260427080000 intent
```

**DAL audit:**
- `markVportBusinessCardLeadContactedDAL` → `.update({ source: nextSource })` — only `source` touched ✓
- No other DAL method performs UPDATE on this table ✓

**Drift note:** Migration `20260427080000` issued `GRANT UPDATE (source) ON vport.business_card_leads TO authenticated`. The live DB column grants show UPDATE on all 11 columns. The column-scoped grant was overridden by an out-of-band `GRANT UPDATE ON vport.business_card_leads TO authenticated` applied via SQL editor.

**Example SQL proposal (text only — do not execute):**

```sql
-- ============================================================
-- Migration: business_card_leads_p1_column_scoped_update_grant
-- Part of: vport.business_card_leads security hardening (P1)
-- Restores intent of migration 20260427080000 which was overridden
-- by out-of-band SQL editor grant.
-- ============================================================

-- Step 1: Revoke current full-row UPDATE privilege
REVOKE UPDATE ON vport.business_card_leads FROM authenticated;

-- Step 2: Re-grant column-scoped UPDATE to source only
-- This matches the intent of migration 20260427080000 and the actual
-- DAL behavior (markVportBusinessCardLeadContactedDAL updates source only).
GRANT UPDATE (source) ON vport.business_card_leads TO authenticated;

-- Note: business_card_leads_owner_update RLS policy is UNCHANGED.
-- The policy gates WHICH ROWS can be updated (owner check via actor_owners).
-- The column grant gates WHICH COLUMNS can be updated.
-- Both must pass for a write to succeed.
```

**Rollback (text only):**
```sql
REVOKE UPDATE ON vport.business_card_leads FROM authenticated;
GRANT UPDATE ON vport.business_card_leads TO authenticated;
```

---

---

## ROLLBACK SURVIVABILITY

```
Rollback status:             FULL — all 4 migrations are independently reversible
Data recovery risk:          NONE — no data deleted or transformed by any migration
Compatibility rollback risk: LOW — rollback restores prior grant/policy state; app behavior unchanged either way
Operational complexity:      LOW — policy DROP/CREATE and GRANT/REVOKE are instantaneous; no table rewrite, no index build
```

---

## VALIDATION CHECKLIST

| Validation Area | Status | Notes |
|---|---|---|
| Schema compatibility | ✅ PASS | Constraint pre-flight: 0 violations in live data |
| DAL compatibility — INSERT | ✅ PASS | No DAL performs direct INSERT; RPC path unaffected |
| DAL compatibility — UPDATE | ✅ PASS | `markVportBusinessCardLeadContactedDAL` updates only `source` |
| DAL compatibility — DELETE | ✅ PASS | DELETE policy unchanged |
| DAL compatibility — SELECT | ✅ PASS | SELECT grant and policy unchanged |
| RPC compatibility (VCSM) | ✅ PASS | `createVportBusinessCardLeadDAL` uses slug-based overload |
| RPC compatibility (Traffic) | ✅ PASS | `submitProviderLeadRow` uses slug-based overload (`p_slug`) |
| Legacy RPC callers | ✅ PASS | Zero callers found in VCSM + Traffic + engines |
| RLS validation | ✅ PASS | Blocking INSERT policy leaves owner_select/update/delete intact |
| Runtime performance validation | ✅ PASS | No index changes; constraint evaluated at INSERT time only |
| Rollback validation | ✅ PASS | Each migration has explicit reversible SQL |
| Native compatibility | N/A | No native iOS/Android surfaces for lead submission |

---

## RECOMMENDED HANDOFFS

| Command | Reason |
|---|---|
| **Wolverine** | Create the two migration SQL files and write them to `supabase/migrations/` with correct timestamps |
| **THOR** | DB-001 and DB-002 are release blockers — THOR must gate `vport-booking-feed-security-updates` branch until P0 migrations are confirmed applied on live |
| **VENOM** | Post-migration re-scan recommended to confirm INSERT bypass surface is closed and legacy RPC gone |
| **Logan** | Schema documentation for `vport.business_card_leads` does not exist — create after migrations are confirmed |
| **DB** | Post-migration verification run to confirm policies, grants, and constraint reflect expected state |

---

## FINAL CARNAGE STATUS

```
Migration Safety Status: SAFE
Confidence: HIGH

Blocking Risks:
  NONE — all 4 migrations are safe to apply to live database.
  No app-layer breakage.
  No table rewrites.
  No data loss.
  All pre-flight checks passed.
  All caller audits completed.

P0 items (M-001, M-002) must be applied before release.
P1 items (M-003, M-004) should be applied in the same release window.
```

---

*All SQL in this report is text-only proposals. None has been executed. Execution requires Wolverine plan + explicit approval.*
