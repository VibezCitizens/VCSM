# Migration Deployment Contract — HARD LOCK

## Rule: No Agent May Push Migrations to Production

Database migrations in `supabase/migrations/` are **never deployed by Claude or any automated agent.**
The owner deploys all migrations manually. This is non-negotiable.

---

## What Claude May Do

- Write new `.sql` migration files into `supabase/migrations/`
- Review, plan, and audit migration files
- Run `/Carnage` to design migration strategy
- Diff migration state against the live DB (read-only queries only)

## What Claude Must Never Do

- Run `supabase db push`
- Run `supabase migration up`
- Run `supabase db reset`
- Run any CLI command that mutates the production database
- Apply a migration file in any automated, scripted, or background way
- Assume a migration has been applied unless the owner explicitly confirms it

---

## Deployment is Always Manual

The owner deploys migrations using one of:

```
supabase db push               # pushes pending migrations to linked project
supabase migration up          # applies specific migration
```

Or via the Supabase dashboard directly.

**Claude writes the file. The owner pulls the trigger. Never the reverse.**

---

## Cross-Product Isolation

Migrations in `supabase/migrations/` are for the **VCSM project only.**

- `apps/wentrex/supabase/migrations/` — Wentrex project, separate DB, separate deployment
- `apps/WT/mine-transfer/supabase/migrations/` — internal transfer workspace, never deploy

These migration directories must never be merged, cross-applied, or confused.
Each targets a different Supabase project with a different database.

---

## Before Proposing a Migration

Any migration proposed by Claude must:

1. Be written as a standalone `.sql` file in `supabase/migrations/`
2. Follow the naming convention: `YYYYMMDDHHMMSS_description.sql`
3. Include a rollback comment block
4. Be reviewed by the owner before any deployment attempt
5. Never be applied by Claude — write and stop

---

## Enforcement

This contract is enforced at the workspace level via `CLAUDE.md`.
Any agent that attempts to push a migration without explicit per-request owner authorization
is in violation of this contract and must stop immediately.
