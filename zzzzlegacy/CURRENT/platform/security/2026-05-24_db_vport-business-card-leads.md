# DB Report — vport.business_card_leads
**Date:** 2026-05-24  
**Application Scope:** VCSM  
**Source:** Live database — `db.nkdrjlmbtqbywhcthppm.supabase.co`  
**Mode:** Read-only analysis  
**Triggered by:** VENOM findings VL-001 through VL-005  

---

## LIVE SCHEMA — vport.business_card_leads

```
column_name       | data_type                | is_nullable | column_default
------------------+--------------------------+-------------+----------------------
id                | uuid                     | NO          | gen_random_uuid()
vport_profile_id  | uuid                     | NO          | (none)
actor_id          | uuid                     | YES         | (none)
name              | text                     | NO          | (none)
phone             | text                     | YES         | (none)
email             | text                     | YES         | (none)
message           | text                     | NO          | (none)
source            | text                     | NO          | 'business_card'::text
user_agent        | text                     | YES         | (none)
ip_address        | inet                     | YES         | (none)
created_at        | timestamptz              | NO          | now()
```

**RLS enabled:** YES (`relrowsecurity = true`)  
**RLS forced:** NO (`relforcerowsecurity = false`) — `postgres` role bypasses RLS (standard Supabase)

---

## LIVE RLS POLICIES

| Policy Name | CMD | Roles | USING | WITH CHECK |
|---|---|---|---|---|
| `business_card_leads_insert_anon` | INSERT | `{anon}` | — | `vport_profile_id IS NOT NULL AND length(btrim(name)) > 0 AND length(btrim(message)) > 0` |
| `business_card_leads_insert_authenticated` | INSERT | `{authenticated}` | — | `vport_profile_id IS NOT NULL AND length(btrim(name)) > 0 AND length(btrim(message)) > 0` |
| `business_card_leads_owner_delete` | DELETE | `{authenticated}` | owner check via `vport.profiles + vc.actor_owners + auth.uid()` | — |
| `business_card_leads_owner_select` | SELECT | `{authenticated}` | owner check via `vport.profiles + vc.actor_owners + auth.uid()` | — |
| `business_card_leads_owner_update` | UPDATE | `{authenticated}` | owner check (same) | owner check (same) |

---

## LIVE TABLE GRANTS

| Grantee | Privilege | Is Grantable |
|---|---|---|
| `anon` | INSERT | NO |
| `authenticated` | DELETE | NO |
| `authenticated` | INSERT | NO |
| `authenticated` | SELECT | NO |
| `authenticated` | UPDATE | NO |
| `postgres` | ALL | YES |

---

## LIVE CONSTRAINTS

| Constraint | Type | Definition |
|---|---|---|
| `business_card_leads_pkey` | PRIMARY KEY | `(id)` |
| `business_card_leads_vport_profile_id_fkey` | FOREIGN KEY | `vport_profile_id → vport.profiles(id) ON DELETE CASCADE` |
| `business_card_leads_actor_id_fkey` | FOREIGN KEY | `actor_id → vc.actors(id) ON DELETE SET NULL` |
| `business_card_leads_contact_required` | CHECK | `phone IS NOT NULL OR email IS NOT NULL (after trim)` |

**No CHECK constraint on `source` column** — any text value is accepted.

---

## LIVE INDEXES

| Index | Definition |
|---|---|
| `business_card_leads_pkey` | `UNIQUE btree (id)` |
| `business_card_leads_profile_created_idx` | `btree (vport_profile_id, created_at DESC)` |
| `business_card_leads_actor_created_idx` | `btree (actor_id, created_at DESC)` |

---

## LIVE RPC — submit_business_card_lead (TWO OVERLOADS)

### Overload 1 — LEGACY (p_vport_profile_id)

```
Signature: submit_business_card_lead(
  p_vport_profile_id uuid,
  p_name text,
  p_message text,
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_source text DEFAULT 'traze_provider_lead'
)
security_type: DEFINER
search_path: vport, public, vc
EXECUTE grantees: PUBLIC, anon, authenticated, postgres
```

**Body:**
```sql
INSERT INTO vport.business_card_leads (vport_profile_id, actor_id, name, phone, email, message, source)
VALUES (
  p_vport_profile_id,
  null,                                                    -- actor_id always NULL
  btrim(p_name),
  nullif(btrim(coalesce(p_phone, '')), ''),
  nullif(btrim(coalesce(p_email, '')), ''),
  btrim(p_message),
  coalesce(nullif(btrim(p_source), ''), 'traze_provider_lead')
)
RETURNING business_card_leads.id;
```

**⚠ NO availability guard.** No `business_card_published`, `is_active`, or `is_deleted` check. Accepts raw profile UUID directly.

---

### Overload 2 — CURRENT (p_slug)

```
Signature: submit_business_card_lead(
  p_slug text,
  p_name text,
  p_phone text,
  p_email text,
  p_message text,
  p_source text DEFAULT 'business_card',
  p_user_agent text DEFAULT NULL,
  p_ip inet DEFAULT NULL
)
security_type: DEFINER
search_path: public, vport, vc
EXECUTE grantees: PUBLIC, anon, authenticated, postgres
```

**Key steps:**
1. Validates slug, name, message not empty
2. Validates phone or email present
3. Resolves slug → `vport.profiles` WHERE `business_card_published = true AND is_active = true AND !is_deleted`
4. Returns `CARD_UNAVAILABLE` if profile not found
5. Inserts with `actor_id = v_actor_id` (VPORT's actor_id from profile)
6. Returns `jsonb { ok, lead_id, profile_id, actor_id }`

---

## LIVE DATA SNAPSHOT

```
total_leads: 8
null_ip:     8 (100%)
actor_id:    all SET (VPORT's actor_id from slug lookup)
pre_contacted in source field: 8 (all leads already marked contacted)
vports_with_leads: 3
```

**Source value distribution:**
```
directory_contacted      | 6
business_card_contacted  | 2
```

All 8 leads are in contacted state. No clean/new leads currently in table.

---

---

## DATABASE REVIEW ITEMS

---

### DB-001 — CRITICAL — Direct INSERT Bypasses Slug Lookup and Availability Guard

```
DATABASE REVIEW ITEM
- Object: vport.business_card_leads + policies business_card_leads_insert_anon / business_card_leads_insert_authenticated
- Application Scope: VCSM
- Severity: CRITICAL
- Security bypass detected: YES — permissive INSERT policy
```

**Current behavior:**  
The `business_card_leads_insert_anon` and `business_card_leads_insert_authenticated` RLS policies allow direct INSERT into `vport.business_card_leads` with only three conditions: `vport_profile_id IS NOT NULL`, `length(btrim(name)) > 0`, `length(btrim(message)) > 0`. The anon role also has a table-level `GRANT INSERT`. A caller knowing any valid `vport_profile_id` UUID can insert a lead record without going through the `submit_business_card_lead` RPC at all.

**Problem:**  
The original design intent (documented in migration `20260427060000`) was "RPC-only, blocking RLS." The live database does not implement this. The current INSERT policies are permissive, not blocking. A direct insert bypasses:
- `business_card_published` check
- `is_active` check
- `is_deleted` check
- slug resolution (attacker needs profile UUID, not slug)
- source field defaulting/coercion in the RPC

**Why it matters:**  
Any client holding a valid `vport_profile_id` — obtainable via other public Supabase reads or through the business card read API — can flood inactive, deleted, or unpublished VPORTs with leads. The RPC availability guard is completely bypassed.

**Who can do this:** `anon` (unauthenticated) users.

**Risk if unchanged:**  
Silent bypass of all RPC-layer protection. Spam/flooding attacks do not require the RPC at all. Availability guards are security theater.

**Recommended improvement:**  
Replace both INSERT policies with blocking policies:

```sql
-- Text-only proposal — do not execute automatically

DROP POLICY IF EXISTS business_card_leads_insert_anon ON vport.business_card_leads;
DROP POLICY IF EXISTS business_card_leads_insert_authenticated ON vport.business_card_leads;

-- Block all direct inserts — RPC is the only allowed path
CREATE POLICY business_card_leads_no_direct_insert ON vport.business_card_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);
```

**Rationale:**  
SECURITY DEFINER RPCs exist specifically to be the controlled write path. Permissive INSERT policies make that control meaningless.

**Follow-up command:** Carnage (migration), Wolverine (test)

---

### DB-002 — HIGH — Legacy RPC Overload Bypasses Availability Guard

```
DATABASE REVIEW ITEM
- Object: vport.submit_business_card_lead(p_vport_profile_id uuid, ...)
- Application Scope: VCSM
- Severity: HIGH
- Security bypass detected: YES — SECURITY DEFINER without availability guard
```

**Current behavior:**  
Two overloads of `submit_business_card_lead` exist on the live database. The legacy overload takes `p_vport_profile_id uuid` directly and performs NO availability check. It inserts into any profile by UUID regardless of `business_card_published`, `is_active`, or `is_deleted`. It also hardcodes `actor_id = NULL` and defaults `source = 'traze_provider_lead'`.

**Problem:**  
The legacy overload is callable by `anon` via `GRANT EXECUTE TO PUBLIC`. Any caller who can infer or enumerate a `vport_profile_id` UUID can submit leads to deleted, inactive, or unpublished VPORTs. This overload has no validation beyond what the table constraints enforce.

**Why it matters:**  
The slug-based overload protects the submission path with an availability gate. The legacy overload removes that gate entirely. As long as both exist, the security of the slug overload is a conditional guarantee, not an enforced one.

**Risk if unchanged:**  
Leads can be silently submitted to inactive or deleted VPORTs. Lead data can accumulate on profiles the owner no longer manages. Targeted spam bypass of the availability guard.

**Recommended improvement:**  

Option A — Revoke EXECUTE from anon/authenticated:
```sql
-- Text-only proposal — do not execute automatically

REVOKE EXECUTE ON FUNCTION vport.submit_business_card_lead(
  uuid, text, text, text, text, text
) FROM anon, authenticated, PUBLIC;
```

Option B — Drop the legacy overload entirely if no active callers:
```sql
-- Text-only proposal — do not execute automatically

DROP FUNCTION IF EXISTS vport.submit_business_card_lead(
  p_vport_profile_id uuid,
  p_name text,
  p_message text,
  p_phone text,
  p_email text,
  p_source text
);
```

**Rationale:**  
The legacy overload served the original Traffic/Traze ingestion path. If that path has been replaced by the slug-based overload, the legacy function is dead surface that should be revoked or dropped. Verify callers before dropping.

**Follow-up command:** ARCHITECT (confirm active callers), Carnage (migration)

---

### DB-003 — HIGH — No source CHECK Constraint — VL-002 Confirmed

```
DATABASE REVIEW ITEM
- Object: vport.business_card_leads.source (column)
- Application Scope: VCSM
- Severity: HIGH
- Security bypass detected: YES — missing constraint enables integrity attack
```

**Current behavior:**  
The `source` column is `TEXT NOT NULL` with default `'business_card'`. No CHECK constraint exists. Both RPC overloads pass `p_source` through `COALESCE(v_source, default)` — any non-empty source value is stored verbatim. A submitter passing `p_source = 'vport_card_contacted'` causes `isContacted: true` in the owner dashboard immediately on receipt.

**Live data confirms:** All 8 existing leads have `source` values of `directory_contacted` or `business_card_contacted` — these are legitimate (owner-applied contacted mutations). No pre-poisoning detected in current data. But the attack vector is unguarded.

**Problem:**  
`isContacted` is derived entirely from `source.includes("contacted")` in the app layer. Since `source` is submitter-controlled with no DB-level allowlist, any lead can be pre-marked as contacted at submission time.

**Why it matters:**  
This is a data integrity attack against the owner's CRM. Pre-poisoned leads are invisible in the badge count (`readNewLeadsCountByProfileDAL` correctly filters out `%contacted%`) but show as green "Contacted" cards in the dashboard, degrading owner trust in the feature.

**Recommended improvement:**

Option A — Add CHECK constraint (immediate, no app-layer change needed):
```sql
-- Text-only proposal — do not execute automatically

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

Option B — Separate contacted state (stronger, requires app + schema change — recommended):
```sql
-- Text-only proposal — do not execute automatically

ALTER TABLE vport.business_card_leads
  ADD COLUMN contacted_at TIMESTAMPTZ NULL,
  ADD COLUMN contacted_by_actor_id UUID NULL REFERENCES vc.actors(id) ON DELETE SET NULL;

-- Strip source of contacted suffix obligation
-- Update UPDATE grant to cover contacted_at instead of just source
GRANT UPDATE (contacted_at, contacted_by_actor_id) ON vport.business_card_leads TO authenticated;
```

**Rationale:**  
Option B is architecturally correct — the `source` field should be immutable after submission. Owner-controlled state belongs in a separate column. Option A is a faster mitigation. Both should be considered.

**Follow-up command:** Carnage (migration), Wolverine (app-layer update for option B)

---

### DB-004 — MEDIUM — IP Address Always NULL — No Abuse Forensics

```
DATABASE REVIEW ITEM
- Object: vport.business_card_leads.ip_address (column)
- Application Scope: VCSM
- Severity: MEDIUM
- Security bypass detected: NO — design gap
```

**Current behavior:**  
Live data confirms: 8/8 leads have `ip_address = NULL`. The column exists (`inet` type, nullable) and the slug-based RPC accepts `p_ip inet DEFAULT NULL`. The DAL hardcodes `p_ip: null`.

**Problem:**  
100% null IP address across all existing leads. The forensic infrastructure exists but is deliberately not populated. This removes:
- Ability to detect flood attacks post-hoc
- Ability to implement per-IP rate limiting at the RPC layer
- Ability to block specific abusive sources

**Risk if unchanged:**  
Amplifies VL-001. A flood attack leaves no trace. Post-incident investigation has no forensic baseline.

**Recommended improvement:**

```sql
-- Text-only proposal — do not execute automatically
-- Add a rate-limiting check inside the slug overload using IP:

-- Step 1: No schema change needed — ip_address column exists
-- Step 2: App DAL change — pass actual IP from edge context:
--   In send-lead-confirmation or a new submit edge function:
--   const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
--   pass as p_ip
-- Step 3: Add rate limit check in RPC:

CREATE OR REPLACE FUNCTION vport.submit_business_card_lead(
  p_slug text, p_name text, p_phone text, p_email text, p_message text,
  p_source text DEFAULT 'business_card',
  p_user_agent text DEFAULT NULL,
  p_ip inet DEFAULT NULL
)
-- ... existing body + add before INSERT:
/*
  IF p_ip IS NOT NULL THEN
    IF (
      SELECT COUNT(*) FROM vport.business_card_leads
      WHERE ip_address = p_ip
        AND created_at > NOW() - INTERVAL '1 hour'
    ) >= 10 THEN
      RAISE EXCEPTION 'RATE_LIMITED: too many submissions from this IP';
    END IF;
  END IF;
*/
```

**Follow-up command:** Carnage (RPC update), Wolverine (DAL update to pass IP)

---

### DB-005 — MEDIUM — No Soft Delete / Audit Trail on Lead Deletion

```
DATABASE REVIEW ITEM
- Object: vport.business_card_leads (table — missing column)
- Application Scope: VCSM
- Severity: MEDIUM
- Security bypass detected: NO — compliance and operations gap
```

**Current behavior:**  
No `deleted_at`, `deleted_by_actor_id`, or equivalent column exists on the live table. The `deleteVportBusinessCardLeadDAL` performs a hard DELETE. The owner_delete RLS policy enforces ownership but records nothing.

**Problem:**  
Lead data (name, phone, email, message) is PII. Its deletion leaves no trace. No audit path exists to verify whether a lead was ever received, when it was deleted, or who deleted it.

**Risk if unchanged:**  
Compliance exposure under privacy regulations requiring data deletion records. Operational risk if a VPORT owner disputes received lead history. Security risk if a compromised account silently deletes evidence.

**Recommended improvement:**

```sql
-- Text-only proposal — do not execute automatically

ALTER TABLE vport.business_card_leads
  ADD COLUMN deleted_at TIMESTAMPTZ NULL,
  ADD COLUMN deleted_by_actor_id UUID NULL REFERENCES vc.actors(id) ON DELETE SET NULL;

CREATE INDEX business_card_leads_deleted_idx
  ON vport.business_card_leads (vport_profile_id, deleted_at)
  WHERE deleted_at IS NULL;
```

All read queries would then add `.is("deleted_at", null)` and the "delete" operation in the DAL becomes:
```sql
UPDATE vport.business_card_leads
SET deleted_at = NOW(), deleted_by_actor_id = <actorId>
WHERE id = <leadId> AND vport_profile_id = <profileId>;
```

Physical deletion can run on a scheduled job after 90 days to satisfy data minimization.

**Follow-up command:** Carnage (schema change), Wolverine (app-layer update)

---

### DB-006 — HIGH — GRANT UPDATE Covers Entire Row — All 11 Columns — Not Column-Scoped

```
DATABASE REVIEW ITEM
- Object: vport.business_card_leads table grant — authenticated UPDATE
- Application Scope: VCSM
- Severity: HIGH  (upgraded from MEDIUM — full-row confirmed)
- Security bypass detected: YES — full-row UPDATE grant allows PII mutation by owner
```

**Current behavior:**  
Live column-level grant query (`information_schema.role_column_grants`) confirmed:

```
authenticated | actor_id         | UPDATE
authenticated | created_at       | UPDATE
authenticated | email            | UPDATE
authenticated | id               | UPDATE
authenticated | ip_address       | UPDATE
authenticated | message          | UPDATE
authenticated | name             | UPDATE
authenticated | phone            | UPDATE
authenticated | source           | UPDATE
authenticated | user_agent       | UPDATE
authenticated | vport_profile_id | UPDATE
```

All 11 columns have `UPDATE` granted to `authenticated`. This is a **full-row grant**. Migration `20260427080000` intended to grant only `GRANT UPDATE (source)` — a column-scoped restriction. That migration either did not execute as intended or was subsequently overridden by a broader grant.

**Problem:**  
The `business_card_leads_owner_update` RLS policy gates UPDATE on ownership (via `vport.profiles + vc.actor_owners + auth.uid()`). However, within that policy, the `authenticated` role may update any column — including submitter PII:

- `name` — submitter's name
- `phone` — submitter's phone number
- `email` — submitter's email address
- `message` — submitter's original message
- `actor_id` — the owning VPORT actor reference
- `vport_profile_id` — the lead's profile association
- `created_at` — creation timestamp
- `id` — primary key UUID

A VPORT owner with access to the dashboard can mutate any PII field on any lead they own. This enables:
- Falsifying lead content (change submitter's name, phone, message)
- Moving a lead to a different profile (`vport_profile_id`)
- Replacing the actor_id reference

**Why it matters:**  
Lead data is submitter PII. The intent is that the owner can only toggle `source` (to track contacted state). Full-row UPDATE access turns an audit/CRM record into a mutable document — owners can falsify or destroy the integrity of incoming leads.

**Risk if unchanged:**  
- Owners can alter PII fields on leads (legal/compliance exposure)
- Lead data cannot be trusted as a faithful record of what was submitted
- Any dispute about a received lead (e.g., "I never sent that message") has no verifiable source

**Recommended improvement:**
```sql
-- Text-only proposal — do not execute automatically

REVOKE UPDATE ON vport.business_card_leads FROM authenticated;
GRANT UPDATE (source) ON vport.business_card_leads TO authenticated;
```

This restores migration `20260427080000`'s original intent. The `business_card_leads_owner_update` RLS policy remains unchanged — it still gates which rows can be updated.

**Follow-up command:** Carnage (migration to revoke + re-grant column-scoped)

---

### DB-007 — INFO — source Field Contains Only _contacted Suffix Values in Production

```
DATABASE REVIEW ITEM
- Object: vport.business_card_leads.source (data observation)
- Application Scope: VCSM
- Severity: INFO
- Security bypass detected: NO
```

**Observation:**  
All 8 leads in the live database have source values of `directory_contacted` (6) and `business_card_contacted` (2). No clean/new leads are present. This means:
1. All 3 vports with leads have 0 new (uncontacted) leads — badge count would be 0
2. The `_contacted` suffix mutation is working correctly on the owner side
3. The original source values were `directory` and `business_card` before marking
4. No pre-poisoning attack has been performed against any existing lead

**Note on actor_id:**  
All 8 leads have `actor_id` SET (non-null). This confirms the slug-based overload (Overload 2) was used for all submissions — it populates `actor_id` with the VPORT's actor_id from the profile lookup. The legacy overload (Overload 1) always stores NULL.

---

## VENOM FINDINGS VERIFICATION SUMMARY

| VENOM Finding | Live DB Verdict | Additional DB Finding |
|---|---|---|
| VL-001 — No rate limiting | ✅ CONFIRMED — no throttle in RPC body or DB layer | DB-001: Direct INSERT also bypasses RPC entirely |
| VL-002 — Source pre-poisoning | ✅ CONFIRMED — no CHECK constraint on source column | DB-003: Proposed allowlist or contacted_at column |
| VL-003 — Edge function CORS | ⚪ N/A — not a DB concern | — |
| VL-004 — Null IP | ✅ CONFIRMED — 8/8 leads have null ip_address | DB-004: Column exists, infrastructure ready, just not populated |
| VL-005 — No audit trail | ✅ CONFIRMED — no deleted_at column in live schema | DB-005: Soft delete proposal documented |

**New findings from live DB not in VENOM report:**
- **DB-001 CRITICAL** — Direct INSERT bypasses RPC availability guard (permissive INSERT policies)
- **DB-002 HIGH** — Legacy RPC overload (p_vport_profile_id) has no availability guard, callable by anon
- **DB-006 HIGH** — Full-row UPDATE grant on all 11 columns confirmed via `role_column_grants` — migration `20260427080000` intent not applied; owners can mutate submitter PII

---

## PRIORITY ORDER FOR CARNAGE

| Priority | Finding | Severity | Migration Type | Status |
|---|---|---|---|---|
| P0 | DB-001 — Block direct INSERT (replace permissive policies with `WITH CHECK (false)`) | CRITICAL | Policy replacement | ✅ DEPLOYED 2026-05-24 |
| P0 | DB-002 — Revoke/drop legacy RPC overload | HIGH | DROP FUNCTION | ✅ DEPLOYED 2026-05-24 |
| P1 | DB-003 — Add source CHECK constraint (allowlist) | HIGH | ALTER TABLE ADD CONSTRAINT | ✅ DEPLOYED 2026-05-24 |
| P1 | DB-006 — Fix full-row UPDATE grant — REVOKE all, re-grant `(source)` only | HIGH | REVOKE + column GRANT | ✅ DEPLOYED 2026-05-24 |
| P2 | DB-004 — Add IP rate-limit logic to RPC + populate ip_address | MEDIUM | CREATE OR REPLACE FUNCTION | Open — deferred |
| P2 | DB-005 — Add deleted_at + deleted_by_actor_id columns (soft delete) | MEDIUM | ALTER TABLE | Open — deferred |

**Post-deployment verification (2026-05-24):**

| Check | Result |
|---|---|
| INSERT policy | `business_card_leads_no_direct_insert` — `WITH CHECK = false` — roles `{anon, authenticated}` ✅ |
| Permissive INSERT policies | Both dropped — no longer present ✅ |
| Legacy RPC overload | Dropped — only slug-based overload remains ✅ |
| Source CHECK constraint | `business_card_leads_source_allowlist` — full allowlist confirmed ✅ |
| UPDATE column grant | `authenticated | source | UPDATE` only — PII columns locked ✅ |

**DB-006 confirmation note (2026-05-24):**  
`role_column_grants` query returned UPDATE on all 11 columns for `authenticated` role. Migration `20260427080000` column-scoped intent was not applied on live database. Corrected by `20260524020000_business_card_leads_p1_hardening.sql`.

**Release block status:** DB-001 and DB-002 RESOLVED. P0 release block on `vport-booking-feed-security-updates` cleared.

---

*All SQL in this report is text-only proposals. None has been executed.*
