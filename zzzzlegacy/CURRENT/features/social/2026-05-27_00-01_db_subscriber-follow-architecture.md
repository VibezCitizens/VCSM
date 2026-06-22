# DB Command Report — Subscriber / Follow Architecture

**Date:** 2026-05-27
**Scope:** VCSM
**Reviewer:** DB
**Trigger:** Logan COMMAND EVIDENCE REGISTRY — MISSING (subscriber/follow architecture review session)
**Status:** BLOCKED — NO LIVE CONNECTION

---

## Connection Failure Report

```
DB COMMAND STATUS: BLOCKED — NO LIVE CONNECTION

Supabase Project: nkdrjlmbtqbywhcthppm / "Vibez Citizens SM" / East US (North Virginia)
Supabase CLI version: v2.75.0
Linked: YES (confirmed via supabase status)

Connection attempts made:
1. supabase db query       — FAILED: not a valid CLI subcommand in v2.75.0
2. supabase db dump        — FAILED: Docker not running (required dependency)
3. psql via DATABASE_URL   — FAILED: no DATABASE_URL in .env or .env.local (client-side keys only)
4. psql via DIRECT_URL     — FAILED: no DIRECT_URL found in any env file
5. Supabase MCP tool       — NOT AVAILABLE in this session

Per DB command rule:
"If no live connection can be established, the DB command must stop and report
the connection failure — it must not fall back to repo files."

DB command is halted. No analysis was performed from repo files.
```

---

## What Was Blocked

The DB command was targeting these live-database verifications in support of ELEKTRA findings ELEK-2026-05-27-001 and ELEK-2026-05-27-002:

### Target 1 — SECURITY DEFINER status verification
Planned query:
```sql
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'vc'
  AND routine_name IN ('list_subscribers', 'count_subscribers', 'get_follower_count')
  AND security_type = 'DEFINER';
```
Purpose: Confirm whether `list_subscribers` and `count_subscribers` are SECURITY DEFINER
as recorded in the Logan change log entry for 2026-04-16.

### Target 2 — RLS policy audit on follow/privacy tables
Planned query:
```sql
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'vc'
  AND tablename IN ('actor_follows', 'social_follow_requests', 'actor_privacy_settings')
ORDER BY tablename, policyname;
```
Purpose: Verify that write paths on `vc.actor_follows` and `vc.social_follow_requests`
are protected by RLS policies and not relying solely on SECURITY DEFINER RPCs.

### Target 3 — Tables without RLS
Planned query:
```sql
SELECT relname AS table_name, relrowsecurity
FROM pg_class
WHERE relnamespace = 'vc'::regnamespace
  AND relkind = 'r'
  AND relrowsecurity = false;
```
Purpose: Identify any vc-schema tables with RLS disabled that contain actor-scoped data.

### Target 4 — Migration history verification
Planned query:
```sql
SELECT version, name, inserted_at
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 20;
```
Purpose: Confirm that migrations covering `actor_follows`, `actor_privacy_settings`,
and the subscribe RPCs are applied to the live database.

---

## How to Unblock

Option A — Start Docker Desktop, then run:
```bash
supabase db dump --linked --schema vc > /tmp/vc_schema_dump.sql
```

Option B — Provide psql direct connection string:
```bash
# Add to .env.local:
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.nkdrjlmbtqbywhcthppm.supabase.co:5432/postgres
# Then run DB command again
```

Option C — Enable Supabase MCP tool in Claude Code settings
This would allow direct RPC execution via MCP.

---

## MIGRATION GOVERNANCE STATUS: BLOCKED — NO LIVE CONNECTION

All live verification was blocked. No drift classification can be made.
Re-run DB command after restoring database access.

---

## Related Reports

| Report | Path | Status |
|---|---|---|
| ELEKTRA | `audits/security/2026-05-27_00-00_elektra_subscriber-follow-architecture.md` | PRESENT |
| SENTRY | `audits/compliance/2026-05-27_00-00_sentry_subscriber-follow-architecture.md` | PRESENT |
| FALCON | `audits/compliance/2026-05-27_00-00_falcon_subscriber-follow-architecture.md` | PRESENT |
| Logan canonical doc | `logan/vcsm/social/vcsm.social.subscribe-architecture.md` | PRESENT |
