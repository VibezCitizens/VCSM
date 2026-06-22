# DB Review — Platform Identity Security Review
_Date: 2026-05-19_
_Connection: Direct (non-pooler) — `db.nkdrjlmbtqbywhcthppm.supabase.co:5432`_
_DB Command mode: READ-ONLY ANALYSIS_
_Application Scope: VCSM_

---

## Context

Follow-up DB inspection after migration `20260518050000` removed SECURITY DEFINER from `platform.provision_vcsm_identity`. Full platform schema audit: RLS policies, SECURITY DEFINER function inventory, and identity-related function health.

---

## Live Connection Confirmed

- 28 schemas found
- Direct connection used — PgBouncer pooler blocked certain `pg_proc` queries involving `pg_get_functiondef` in WHERE clauses

---

## Summary of Key Observations

| Finding | Schema | Object | Severity | Status |
|---|---|---|---|---|
| DRI-A | platform | `ensure_vcsm_actor_link` | HIGH | CLOSED — DROPped (migration 20260519120000) |
| DRI-A2 | vc | `save_friend_ranks` — no auth guard | HIGH | CLOSED — SECURITY DEFINER removed + guard added (migration 20260519120000) |
| DRI-A3 | vc | `mark_read` — no auth guard | HIGH | CLOSED — guard added (migration 20260519120000); SECURITY DEFINER retained pending inbox/members RLS pass |
| DRI-B | platform | `provision_vcsm_identity` | CLOSED | Hardened — verified live |
| DRI-C | multiple | SECURITY DEFINER missing `pg_temp` | MEDIUM | OPEN — systemic gap |
| DRI-D | platform | Dead row accumulation | LOW | OPEN — dev artifact |
| DRI-E | learning | `is_platform_owner` empty search_path | MEDIUM | OPEN |
| DRI-F | reviews | `row_security=off` in SECURITY DEFINER | INFO | OPEN — verify intentional |
| DRI-G | vc | `inbox_entries` + `conversation_members` — no RLS | MEDIUM | OPEN — deferred; required to fully remove SECURITY DEFINER from `mark_read` |

---

## DATABASE REVIEW ITEM DRI-A

```
DATABASE REVIEW ITEM
- Object: platform.ensure_vcsm_actor_link(p_user_id uuid, p_actor_id uuid, p_actor_kind text)
- Application Scope: VCSM
- Current behavior:
    SECURITY DEFINER function. Takes p_user_id, p_actor_id, p_actor_kind. Calls
    platform.provision_vcsm_identity(p_user_id) — 1-parameter form — then inserts into
    platform.user_app_actor_links and updates vc.actors. Returns jsonb.
- Problem:
    1. BROKEN: Calls platform.provision_vcsm_identity(p_user_id) with 1 parameter. That
       overload was DROPPED by migration 20260518040000. The function will throw
       "function platform.provision_vcsm_identity(uuid) does not exist" if executed.
    2. No auth.uid() guard: accepts p_user_id as caller-supplied parameter without
       validating the caller IS that user. Same MW-01 identity injection pattern.
    3. pg_temp missing from search_path: search_path = 'platform, vc, public, auth' —
       pg_temp absent, violating the search_path hardening standard.
    4. DEAD CODE: No app code calls this function. No DB functions call it (prosrc scan
       confirmed). ACL: postgres-only — not exposed to authenticated users.
- Why it matters:
    The function is broken at the DB level. If any admin script or future code calls it,
    it will fail immediately. The SECURITY DEFINER + no auth guard pattern is the same
    vulnerability class that was fixed in provision_vcsm_identity (MW-01).
- Recommended improvement:
    DROP this function. It has been superseded by the two-parameter provision_vcsm_identity
    + direct user_app_actor_links management in vport.create_vport_for_actor. It serves
    no current purpose and is broken.
- Rationale:
    Dead broken SECURITY DEFINER functions with auth injection risk should be removed, not
    left on the DB. Even with postgres-only ACL today, ACL grants can change.
- Risk if unchanged:
    MEDIUM — currently unexploitable (postgres-only), but: (a) any future GRANT to
    authenticated would immediately expose an auth bypass; (b) the broken call creates a
    runtime error trap if admin scripts or future code invoke it.
- Example SQL proposal (text only, do not run):
    DROP FUNCTION IF EXISTS platform.ensure_vcsm_actor_link(uuid, uuid, text);
```

---

## DATABASE REVIEW ITEM DRI-B — CLOSED

```
DATABASE REVIEW ITEM
- Object: platform.provision_vcsm_identity(p_user_id uuid, p_actor_id uuid)
- Application Scope: VCSM
- Current behavior: VERIFIED SECURE
    - is_security_definer = f ✓
    - search_path = 'platform, vc, auth, public, pg_temp' ✓
    - GUARD 1: auth.uid() IS NULL → RAISE EXCEPTION ✓
    - GUARD 2: auth.uid() IS DISTINCT FROM p_user_id → RAISE EXCEPTION ✓
    - GUARD 3: actor ownership via vc.actor_owners + profile_id fallback ✓
    - RETURNS uuid ✓
    - Grant: authenticated only ✓
    - 6 RLS INSERT/UPDATE policies on all 5 downstream tables ✓
- Problem: NONE
- Status: CLOSED — migrations 20260518040000 + 20260518050000 applied and verified
```

---

## DATABASE REVIEW ITEM DRI-C

```
DATABASE REVIEW ITEM
- Object: Multiple SECURITY DEFINER functions — pg_temp hardening gap
- Application Scope: VCSM + ENGINE
- Current behavior:
    187 SECURITY DEFINER functions found across custom schemas. Many are missing pg_temp
    from their search_path. Examples:
    
    chat.can_current_actor_manage    — search_path=public, chat
    chat.send_message_atomic         — search_path=chat, public, auth
    moderation.block_actor           — search_path=moderation, vc, public, auth
    moderation.current_vc_actor_ids  — search_path=moderation, platform, vc, public, auth
    vc.create_actor_for_user         — search_path=vc, public
    vc.ensure_actor_ownership        — search_path=vc, public
    public.handle_new_user           — search_path=vc, public, auth
    
    By contrast, hardened functions include pg_temp:
    identity.refresh_actor_directory_row — search_path=identity, vc, learning, vport, public, pg_temp ✓
    platform.provision_vcsm_identity     — search_path=platform, vc, auth, public, pg_temp ✓
    notification.*                       — search_path includes pg_temp ✓

- Problem:
    pg_temp in search_path prevents a session from creating a temporary function that
    shadows a schema-qualified function. Without pg_temp at the END of search_path, a
    superuser or database role with temp-table creation rights could shadow calls inside
    SECURITY DEFINER functions. This is a defense-in-depth gap.
- Why it matters:
    While exploiting pg_temp function shadowing requires the attacker to already have DB
    access (not a remote/web exploit), it is a privilege escalation vector within the DB.
    The hardening standard was applied to identity/platform/notification schemas but not
    system-wide.
- Recommended improvement:
    Apply a systematic search_path hardening pass to all SECURITY DEFINER functions. The
    pattern is: current schemas + pg_temp last.
    
    Priority order:
    1. Functions with authenticated EXECUTE grants (highest risk)
    2. Functions in vc, vport, moderation, chat schemas
    3. Trigger functions in public schema
- Rationale:
    The identity/notification schemas already demonstrate the correct pattern. Extending
    it system-wide is consistent with the established standard.
- Risk if unchanged:
    LOW — requires existing DB access to exploit. Not a remote attack vector.
- Example SQL proposal (text only, do not run):
    -- For each affected function, ALTER FUNCTION ... SET search_path TO ..., pg_temp;
    -- Example:
    ALTER FUNCTION chat.can_current_actor_manage() SET search_path TO public, chat, pg_temp;
    ALTER FUNCTION moderation.block_actor(uuid) SET search_path TO moderation, vc, public, auth, pg_temp;
    -- Must be applied per-function after verifying the function body's schema references
```

---

## DATABASE REVIEW ITEM DRI-D

```
DATABASE REVIEW ITEM
- Object: platform.user_app_state, platform.user_app_preferences
- Application Scope: VCSM
- Current behavior:
    Live row counts vs dead row counts from pg_stat_user_tables:
    
    user_app_state:       8 live / 36 dead  (4.5x dead ratio)
    user_app_preferences: 8 live / 42 dead  (5.25x dead ratio)
    user_app_accounts:    8 live / 9 dead
    user_app_access:      8 live / 9 dead
    
    Last autovacuum on user_app_preferences: 2026-05-03
    Last autovacuum on user_app_state: 2026-03-31
    
- Problem:
    High dead row accumulation from repeated upserts during migration testing. Autovacuum
    has not run since the last migration session.
- Why it matters:
    Dead tuples bloat table pages, slow scans, and inflate index size. With only 8 live rows
    this is a dev-environment artifact — not a production concern at current scale.
- Recommended improvement:
    These will self-resolve via autovacuum. In a production environment with higher write
    volume, ensure autovacuum is appropriately tuned for upsert-heavy tables.
- Rationale:
    Platform tables are upsert-heavy (idempotent provision calls). Autovacuum should run
    more frequently on these tables in production.
- Risk if unchanged:
    LOW — dev environment only at current row counts.
- Example SQL proposal (text only, do not run):
    -- Manual VACUUM ANALYZE can be run if bloat is an issue:
    -- VACUUM ANALYZE platform.user_app_state;
    -- VACUUM ANALYZE platform.user_app_preferences;
    -- Production tuning (apply per-table):
    -- ALTER TABLE platform.user_app_state SET (autovacuum_vacuum_scale_factor = 0.01);
    -- ALTER TABLE platform.user_app_preferences SET (autovacuum_vacuum_scale_factor = 0.01);
```

---

## DATABASE REVIEW ITEM DRI-E

```
DATABASE REVIEW ITEM
- Object: learning.is_platform_owner
- Application Scope: WENTREX
- Current behavior:
    SECURITY DEFINER. search_path = "" (empty string).
- Problem:
    An empty search_path means all identifier references inside the function must be
    schema-qualified. PostgreSQL will resolve unqualified identifiers from pg_catalog only.
    This is unusual — all other SECURITY DEFINER functions in the system use explicit
    schema lists.
- Why it matters:
    If the function body contains any unqualified identifiers that are not pg_catalog
    built-ins, they will fail to resolve at runtime. The function may work today but could
    break if it calls any helper function or accesses a table without a schema prefix.
    Additionally, an empty search_path technically satisfies search_path hardening (no
    schema injection possible) but makes the function brittle.
- Recommended improvement:
    Read the function body. If all identifiers are schema-qualified, the function is safe
    as-is. If any unqualified identifiers exist, assign an explicit search_path.
- Rationale:
    Explicit search_path is clearer than empty search_path and prevents future maintainers
    from unknowingly breaking the function.
- Risk if unchanged:
    LOW — low if identifiers are all qualified. MEDIUM if unqualified identifiers exist.
- Example SQL proposal (text only, do not run):
    ALTER FUNCTION learning.is_platform_owner() SET search_path TO learning, platform, public, auth, pg_temp;
```

---

## DATABASE REVIEW ITEM DRI-F

```
DATABASE REVIEW ITEM
- Object: reviews.* — 12 SECURITY DEFINER functions with row_security=off
- Application Scope: VCSM
- Current behavior:
    Multiple functions in the reviews schema are SECURITY DEFINER with row_security=off
    in their config:
    
    reviews.enforce_rating_no_downgrade    — row_security=off
    reviews.get_review_author_card         — row_security=off
    reviews.get_target_overall_stats       — row_security=off
    reviews.hydrate_dimension_rating_snapshots — row_security=off
    reviews.hydrate_review_snapshots       — row_security=off
    reviews.recalc_review_overall_rating   — row_security=off
    reviews.resolve_target_subtype         — row_security=off
    reviews.upsert_neutral_review          — row_security=off
    reviews.validate_target_actor_is_active_vport — row_security=off
    reviews.write_review_revision          — row_security=off
    (+ 2 more)

- Problem:
    row_security=off disables RLS enforcement inside these functions. This is likely
    intentional for aggregation and hydration (calculating aggregate stats requires
    reading all rows regardless of who the current user is). However, it should be
    explicitly documented — any function with row_security=off that writes data is a
    potential trust bypass if its auth guards are insufficient.
- Why it matters:
    If any of these functions writes data (not just reads for aggregation), the missing
    RLS check means the write is not constrained by per-user policies.
- Recommended improvement:
    Audit each function to confirm row_security=off is intentional:
    - Read-only aggregation functions: intentional — acceptable
    - Write functions (write_review_revision, upsert_neutral_review): verify caller
      identity is validated before write
- Rationale:
    Explicit documentation of row_security=off intent prevents future maintainers from
    assuming RLS is enforced.
- Risk if unchanged:
    INFO — low if write functions have their own caller identity checks.
- Example SQL proposal (text only, do not run):
    N/A — requires code review before any change.
```

---

## VPORT Creation Flow — VERIFIED SECURE

The client-callable VPORT creation path is correctly secured:

```
Client → vport.create_vport(authenticated grant)
           └─ v_user_id := auth.uid()        ← derives from session, not parameter
           └─ validates actor via actor_ids_for_current_user()
           └─ calls vport.create_vport_for_actor(postgres-only) with validated user_id
                └─ inserts vport.profiles
                └─ inserts vc.actors (vport kind)
                └─ inserts vc.actor_owners
                └─ inserts platform.user_app_actor_links
                └─ updates vc.actors.vport_id
                └─ calls identity.refresh_actor_directory_row('vc', ...)
```

- `vport.create_vport`: `authenticated` callable, derives `auth.uid()` internally ✓
- `vport.create_vport_for_actor`: `postgres-only` — internal helper ✓
- `ensure_vcsm_actor_link`: NOT in this path — confirmed dead code

---

## RLS Coverage — Platform Tables

All 5 key platform tables have RLS enabled and complete policy coverage:

| Table | RLS | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| user_app_access | ✓ | own | own | own | blocked |
| user_app_accounts | ✓ | own | own | own | blocked |
| user_app_actor_links | ✓ | own | own | own | own |
| user_app_preferences | ✓ | own | own | own | blocked |
| user_app_state | ✓ | own | own | own | blocked |

All INSERT/UPDATE policies use `auth.uid()` for ownership validation. `{public}` INSERT/DELETE is blocked by PERMISSIVE `WITH CHECK = false` policies.

---

## Handoff Matrix

| Finding | Recommended Handoff | Reason |
|---|---|---|
| DRI-A: `ensure_vcsm_actor_link` DROP | DB admin | Requires DROP FUNCTION on live DB |
| DRI-C: pg_temp hardening gap | VENOM + DB admin | Security hardening — systematic pass required |
| DRI-D: dead row accumulation | DB admin | Low priority — VACUUM or autovacuum tuning |
| DRI-E: `is_platform_owner` empty search_path | DB admin + Wentrex team | Read function body then fix |
| DRI-F: reviews row_security=off | VENOM | Audit write functions for caller identity checks |

---

## DB Review Status

**DRI-A (HIGH):** `platform.ensure_vcsm_actor_link` — BROKEN dead SECURITY DEFINER function. Recommend DROP. Postgres-only ACL limits blast radius but the function should not remain on the DB.

**DRI-B (CLOSED):** `platform.provision_vcsm_identity` — fully hardened. No action required.

**DRI-C through DRI-F:** Medium/Low findings requiring DB admin coordination. Not release-blocking for VCSM identity flow.
