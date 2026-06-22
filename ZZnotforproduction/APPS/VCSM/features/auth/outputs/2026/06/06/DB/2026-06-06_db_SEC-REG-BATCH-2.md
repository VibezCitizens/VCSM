# DB SECURITY REVIEW — SEC-REG-BATCH-2

**Ticket:** SEC-REG-BATCH-2
**Date:** 2026-06-06
**Scope:** Registration DB security boundaries — profiles RLS, user_consents RLS, password policy
**Mode:** READ ONLY — live database — no changes applied
**Live Project:** nkdrjlmbtqbywhcthppm (Vibez Citizens SM, East US)
**Application Scope:** VCSM

---

## SQL Queries Executed

All queries were read-only SELECT statements against the live database.

```sql
-- 1. RLS enabled status
SELECT n.nspname AS schema, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND ((n.nspname = 'public' AND c.relname = 'profiles')
    OR (n.nspname = 'platform' AND c.relname = 'user_consents'))
ORDER BY n.nspname, c.relname;

-- 2. All RLS policies on both tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE (schemaname = 'public' AND tablename = 'profiles')
   OR (schemaname = 'platform' AND tablename = 'user_consents')
ORDER BY schemaname, tablename, policyname;

-- 3. user_consents column structure
SELECT a.attname, pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
       a.attnotnull, pg_catalog.pg_get_expr(d.adbin, d.adrelid) AS column_default
FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
WHERE n.nspname = 'platform' AND c.relname = 'user_consents'
  AND a.attnum > 0 AND NOT a.attisdropped ORDER BY a.attnum;

-- 4. Triggers on user_consents
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'platform' AND event_object_table = 'user_consents'
ORDER BY trigger_name;

-- 5. SECURITY DEFINER functions in public + platform
SELECT n.nspname AS schema, p.proname AS function_name, p.prosecdef,
       pg_get_function_arguments(p.oid) AS args
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'platform') AND p.prosecdef = true
ORDER BY n.nspname, p.proname;

-- 6. handle_new_user function definition
SELECT pg_get_functiondef(oid) FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 7. PostgreSQL password policy settings
SELECT name, setting, unit, short_desc FROM pg_settings
WHERE name ILIKE '%password%' ORDER BY name;
```

---

## Section 1 — public.profiles RLS

### RLS Status

| Schema | Table | RLS Enabled | RLS Forced |
|---|---|---|---|
| public | profiles | **TRUE** | FALSE |

RLS forced = FALSE means the `postgres`/service role superuser bypasses RLS. This is standard Supabase behavior — only the GoTrue trigger functions and admin operations use the superuser path.

### Policies Found (live)

| Policy Name | Type | Roles | Command | USING | WITH CHECK |
|---|---|---|---|---|---|
| `profiles_discoverable_read` | PERMISSIVE | {public} | SELECT | `publish = true AND COALESCE(discoverable, false) = true` | — |
| `profiles_insert_self` | PERMISSIVE | {authenticated} | INSERT | — | `id = auth.uid()` |
| `profiles_select_via_actor` | PERMISSIVE | {public} | SELECT | via `vc.actor_owners` where `ao.user_id = auth.uid()` | — |
| `profiles_self_read` | PERMISSIVE | {authenticated} | SELECT | `id = auth.uid()` | — |
| `profiles_update_self` | PERMISSIVE | {authenticated} | UPDATE | `id = auth.uid()` | `id = auth.uid()` |
| `profiles_update_via_actor` | PERMISSIVE | **{public}** | UPDATE | via `vc.actor_owners` where `ao.user_id = auth.uid()` | via `vc.actor_owners` |

### Security Requirement Verdicts

| Requirement | Status | Evidence |
|---|---|---|
| RLS enabled on `public.profiles` | **PASS** | `relrowsecurity = true` |
| INSERT enforces `id = auth.uid()` | **PASS** | `profiles_insert_self` WITH CHECK `(id = auth.uid())` |
| INSERT blocked for anon | **PASS** | Only `{authenticated}` role has INSERT policy |
| UPDATE enforces own row only | **PASS** | `profiles_update_self` USING + WITH CHECK `(id = auth.uid())` |
| UPDATE via actor enforces ownership | **PASS** | Both USING and WITH CHECK verify `ao.user_id = auth.uid()` |
| Authenticated user cannot write another user's profile | **PASS** | No INSERT/UPDATE policy permits `id ≠ auth.uid()` |
| DELETE blocked | **PASS** | No DELETE policy exists — default deny under RLS |

### Note — LOW Severity

`profiles_update_via_actor` targets `{public}` (includes anon role). For anonymous users, `auth.uid()` returns NULL, and the actor_owners JOIN condition `ao.user_id = auth.uid()` becomes `ao.user_id = NULL` which evaluates FALSE in SQL — no rows match. Anon UPDATE is effectively blocked. However, targeting `{public}` is architecturally imprecise when `{authenticated}` is the intent.

This is cosmetic risk, not an exploitable gap, but worth tightening in a future migration.

---

## Section 2 — platform.user_consents RLS

### RLS Status

| Schema | Table | RLS Enabled | RLS Forced |
|---|---|---|---|
| platform | user_consents | **TRUE** | FALSE |

### Policies Found (live)

| Policy Name | Type | Roles | Command | USING | WITH CHECK |
|---|---|---|---|---|---|
| `user_consents_insert_own` | PERMISSIVE | {authenticated} | INSERT | — | `user_id = auth.uid()` |
| `user_consents_select_own` | PERMISSIVE | {authenticated} | SELECT | `user_id = auth.uid()` | — |
| `user_consents_deny_delete` | **RESTRICTIVE** | {authenticated} | DELETE | `false` | — |
| `user_consents_deny_update` | **RESTRICTIVE** | {authenticated} | UPDATE | `false` | — |

### Triggers Found (live)

| Trigger | Event | Timing | Function |
|---|---|---|---|
| `trg_enforce_server_accepted_at` | INSERT | BEFORE | `platform.enforce_server_accepted_at()` |
| `trg_platform_user_consents_updated_at` | UPDATE | BEFORE | `platform.set_updated_at()` |
| `trg_prevent_consent_audit_mutation` | UPDATE | BEFORE | `platform.prevent_consent_audit_mutation()` |

### `accepted_at` Column

| Column | Type | NOT NULL | Default |
|---|---|---|---|
| `accepted_at` | `timestamp with time zone` | TRUE | `now()` |

The column has a DB default of `now()`. Critically, `trg_enforce_server_accepted_at` fires **BEFORE INSERT** and overwrites any client-supplied value with the server timestamp. A client cannot inject a falsified `accepted_at` — the trigger owns it unconditionally.

`trg_prevent_consent_audit_mutation` fires BEFORE UPDATE and blocks mutation of audit-critical fields, providing defense-in-depth alongside the RESTRICTIVE UPDATE policy.

### Security Requirement Verdicts

| Requirement | Status | Evidence |
|---|---|---|
| RLS enabled on `platform.user_consents` | **PASS** | `relrowsecurity = true` |
| INSERT enforces `user_id = auth.uid()` | **PASS** | `user_consents_insert_own` WITH CHECK |
| Authenticated user cannot insert for another user | **PASS** | WITH CHECK `(user_id = auth.uid())` — strict equality |
| Anon users cannot insert consent records | **PASS** | INSERT policy targets `{authenticated}` only |
| UPDATE denied | **PASS** | RESTRICTIVE policy USING `false` + trigger `trg_prevent_consent_audit_mutation` |
| DELETE denied | **PASS** | RESTRICTIVE policy USING `false` |
| `accepted_at` is DB-owned / server default | **PASS** | `trg_enforce_server_accepted_at` BEFORE INSERT overwrites any client value |

---

## Section 3 — handle_new_user (SECURITY DEFINER — registration trigger)

This function fires on every `auth.users` INSERT (new registration) and bootstraps `public.profiles` and `vc.actors`.

### Function Properties

| Property | Value | Assessment |
|---|---|---|
| SECURITY DEFINER | YES | JUSTIFIED — trigger on `auth.users` runs before user session exists; must bypass RLS to write initial profile |
| `SET search_path TO 'vc', 'public', 'auth'` | PRESENT | **PASS** — explicit search path prevents injection |
| Inserts to `profiles` with `id = new.id` | YES | Correct — ties profile to `auth.users.id` |
| Anonymous skip (`email IS NULL`) | YES | Correct — anonymous sessions are excluded |
| Guest skip (`is_guest = 'true'`) | YES | Correct — guest sessions are excluded |
| `ON CONFLICT (id) DO NOTHING` | YES | Safe — idempotent, cannot overwrite an existing profile |
| Creates `vc.actors` with `kind = 'user'` | YES | Correct — actor bootstrapping |
| `ON CONFLICT (kind, profile_id) DO NOTHING` | YES | Safe — idempotent |

**Verdict:** LEGITIMATE use of SECURITY DEFINER. Has explicit `SET search_path` (injection-protected). Does not substitute for RLS — it runs only at the moment `auth.users` is created, before any session exists, which is the only window where RLS bypass is architecturally necessary.

---

## Section 4 — Supabase Password Policy

### PostgreSQL Layer

| Setting | Value | Meaning |
|---|---|---|
| `password_encryption` | `scram-sha-256` | Hashing algorithm — not a strength policy |
| `pgtle.enable_password_check` | `off` | pg_tle password complexity extension is **disabled** |

### Assessment

**No server-side password complexity enforcement exists at the PostgreSQL layer.**

The PostgreSQL database enforces only that passwords are hashed with scram-sha-256. Minimum length, character complexity, and strength requirements are managed exclusively at:

1. **Supabase GoTrue auth service** — configured in the Supabase Dashboard under Auth → Providers → Email → Password Requirements. This setting cannot be verified via SQL. Manual verification required.
2. **Application layer** — `apps/VCSM/src/features/auth/model/registerPasswordRules.model.js` enforces complexity client-side. This can be bypassed by calling the Supabase signUp API directly.

**Gap:** If a user calls `supabase.auth.signUp()` directly (API client, not the app UI), they bypass `registerPasswordRules.model.js`. Only the Supabase dashboard password minimum length setting would enforce a floor at that point.

**Required manual verification:** Log into the Supabase Dashboard → Authentication → Providers → Email → confirm `Minimum password length` is set and `Password strength` is configured.

---

## DATABASE REVIEW ITEMS

---

### ITEM 1

```
DATABASE REVIEW ITEM
- Object:               profiles_update_via_actor (policy on public.profiles)
- Object Type:          SOURCE TABLE policy
- Application Scope:    VCSM
- Severity:             LOW
- Security bypass:      NO
- Current behavior:     UPDATE policy targets {public} role (anon + authenticated). Anon blocked in practice because auth.uid() = NULL fails the actor_owners check.
- Problem:              Policy targets {public} when {authenticated} is the intent. Implicit reliance on NULL uid behavior rather than explicit role restriction.
- Why it matters:       Future schema changes to actor_owners (e.g., allowing null user_id for system actors) could inadvertently open this path for anon.
- Recommended improvement: Change roles from {public} to {authenticated}.
- Rationale:            Explicit is safer than implicit. Anon should be denied by policy, not by NULL arithmetic.
- Risk if unchanged:    LOW — currently unexploitable. Theoretical risk under schema evolution.
- Example SQL proposal (text only, do not run):
    DROP POLICY profiles_update_via_actor ON public.profiles;
    CREATE POLICY profiles_update_via_actor ON public.profiles
      AS PERMISSIVE FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM vc.actors a
          JOIN vc.actor_owners ao ON ao.actor_id = a.id
          WHERE a.profile_id = profiles.id AND ao.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM vc.actors a
          JOIN vc.actor_owners ao ON ao.actor_id = a.id
          WHERE a.profile_id = profiles.id AND ao.user_id = auth.uid()
        )
      );
```

---

### ITEM 2

```
DATABASE REVIEW ITEM
- Object:               Supabase password policy (GoTrue layer)
- Object Type:          AUTH CONFIG
- Application Scope:    VCSM
- Severity:             MEDIUM
- Security bypass:      NO (gap in enforcement surface, not a bypass)
- Current behavior:     No password complexity enforcement at the PostgreSQL layer. pgtle.enable_password_check = off. Client-side enforcement only via registerPasswordRules.model.js.
- Problem:              A user calling supabase.auth.signUp() directly bypasses all client-side password validation. Only the Supabase dashboard password minimum length setting stands between them and a weak password account.
- Why it matters:       Weak passwords increase brute-force and credential-stuffing exposure. If the dashboard setting is not configured, any password length is accepted.
- Recommended improvement: 1) Verify Supabase Dashboard → Auth → Providers → Email → Password Requirements is set to minimum 8 characters. 2) Document the confirmed setting in governance. 3) Optionally enable pgtle password check for belt-and-suspenders.
- Rationale:            Application-layer validation is defense for UI flows only. Auth API is publicly accessible.
- Risk if unchanged:    MEDIUM if dashboard setting is unconfigured. LOW if dashboard minimum length is already set (unverified — cannot query via SQL).
- Example SQL proposal (text only, do not run):
    -- Not a SQL fix. Owner must verify and configure in Supabase Dashboard.
    -- If pgtle password complexity is desired in future:
    -- CREATE EXTENSION IF NOT EXISTS pgtle;
    -- UPDATE pg_settings SET setting = 'on' WHERE name = 'pgtle.enable_password_check';
    -- (Requires a custom password check function — out of scope for this ticket)
```

---

## Final Verdict

| Area | Verdict |
|---|---|
| `public.profiles` RLS enabled | PASS |
| `public.profiles` INSERT enforces `id = auth.uid()` | PASS |
| `public.profiles` anon INSERT blocked | PASS |
| `public.profiles` cross-user write blocked | PASS |
| `public.profiles` DELETE blocked | PASS |
| `platform.user_consents` RLS enabled | PASS |
| `platform.user_consents` INSERT enforces `user_id = auth.uid()` | PASS |
| `platform.user_consents` anon INSERT blocked | PASS |
| `platform.user_consents` UPDATE denied | PASS |
| `platform.user_consents` DELETE denied | PASS |
| `platform.user_consents` `accepted_at` server-owned | PASS |
| `handle_new_user` SECURITY DEFINER justified + search_path set | PASS |
| Password policy — PostgreSQL layer | NO ENFORCEMENT (MEDIUM — verify dashboard) |
| Password policy — application layer | PASS (registerPasswordRules.model.js) |

---

## OVERALL VERDICT

**PASS WITH NOTES**

```
CRITICAL:  0
HIGH:      0
MEDIUM:    1  (password policy unverifiable via SQL — manual dashboard check required)
LOW:       1  (profiles_update_via_actor targets {public} instead of {authenticated})
INFO:      0
```

No blocking security failures found. Both tables have RLS correctly enabled and enforced. `accepted_at` is trigger-protected. `handle_new_user` is a justified SECURITY DEFINER with explicit search path.

**Required owner action before closing ticket:**
- **STATUS: OPEN / PENDING VERIFICATION**
- Supabase Dashboard password policy setting could not be located during review (2026-06-06).
- Known location: Authentication → Configuration → Policies (left sidebar). If not present on the FREE tier, the setting may not be exposed — confirm tier availability.
- Until verified, password minimum length enforcement at the GoTrue layer is UNCONFIRMED.

---

## Recommended Patch — Not Applied

**Patch A (LOW priority):** Tighten `profiles_update_via_actor` role from `{public}` to `{authenticated}`.
See ITEM 1 SQL proposal above.

**Patch B (MEDIUM priority — owner action) — PENDING:** Verify Supabase dashboard password minimum length setting.
No SQL migration needed — dashboard configuration only. Setting not located during 2026-06-06 review session. Check Authentication → Configuration → Policies. May not be available on FREE tier.
