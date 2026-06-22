# Governance: CARNAGE — Database Migration Architect

**Command:** `/Carnage`  
**Authority:** Schema change architect — all DB migrations, RLS policies, indexes, table creation  
**Mode:** Read + write (migration files only — never direct SQL execution)  
**Scope in VPORT governance:** All modules requiring schema changes

---

## Responsibility

CARNAGE architects all database schema changes for VPORT dashboard modules. Nothing touches the schema without a CARNAGE migration plan.

It covers:
- Table creation — column definitions, constraints, FK relationships, cascade behavior
- RLS policy authoring — read policies, write policies, service-role overrides
- Index design — covering indexes for high-read paths, composite indexes for filtered queries
- Migration file generation — up/down scripts, rollback safety
- FK dependency mapping — confirming no orphan records or broken cascades after migration
- Supabase edge case handling — Realtime requirements, Auth table constraints
- Post-migration verification steps — what to confirm after applying the migration

## Migration Safety Rules

- Every migration must have a rollback path documented before execution
- RLS policies must be verified with test queries before the migration is marked complete
- FK additions to existing tables require a gap analysis for existing orphan rows
- Index additions on large tables must specify `CONCURRENTLY` to avoid table locks
- Migrations that add `NOT NULL` columns to existing tables must include a default or backfill step

## Finding Severity Levels

| Level | Definition | Release Impact |
|---|---|---|
| CRITICAL | Migration destroys data, breaks RLS, or removes a FK without cascade | Blocks release |
| HIGH | Missing rollback, missing index on high-traffic FK | Blocks release |
| MEDIUM | Suboptimal index type, policy gap on edge case | Address before THOR |
| LOW | Naming convention drift, cosmetic column ordering | Track, non-blocking |

## Open Migration Items

- DEFER-001: `bookings_insert_owner` — owner booking insert RLS pending — blocking THOR for booking module
- DEFER-002: `service_id` FK on reviews table — non-blocking, P2

## Output Location

Migration files: `supabase/migrations/YYYYMMDDHHMMSS_[description].sql`  
Audit: `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/YYYY-MM-DD_carnage_[module].md`

## When to Run

Any time a VPORT module requires a schema change, RLS update, or index addition. CARNAGE output must be reviewed by DB before execution.
