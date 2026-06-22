# Platform — Shared Identity RPCs
_Last updated: 2026-05-18_
_Governance decision recorded by: DB command (DRI-05 resolution)_

---

## Overview

This document covers RPCs that live in the `identity` schema and are called by more than one application. They are owned at the **platform / DB-admin level** — not by any individual app.

---

## identity.refresh_actor_directory_row

### Ownership

| Property | Value |
|---|---|
| Schema | `identity` |
| Owner | DB-admin — platform-level utility |
| Callers | VCSM, Wentrex |
| Change coordination | DB admin must notify both app teams before any signature or behavior change |

### Purpose

Refreshes a single actor's row in `identity.actor_directory` after a source-of-truth mutation (profile edit, vport edit, actor creation, etc.). Called after successful writes — non-fatal if it fails.

### Signature

```sql
identity.refresh_actor_directory_row(p_actor_domain text, p_actor_id uuid)
RETURNS identity.actor_directory
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'identity', 'vc', 'learning', 'vport', 'public', 'pg_temp'
```

### Security

- SECURITY DEFINER — writes to `identity.actor_directory`
- `search_path` fully hardened including `pg_temp` (applied by `secdef_a_search_path_hardening.sql` 2026-05-10)
- No caller-supplied user_id — no identity injection risk
- Domain parameter is validated: only `'vc'` and `'learning'` are accepted

### Callers

| App | File | Domain | Call pattern |
|---|---|---|---|
| VCSM | `apps/VCSM/src/features/identity/dal/refreshActorDirectory.dal.js` | `'vc'` | Awaited on create; fire-and-forget on update |
| Wentrex | `apps/wentrex/src/features/identity/dal/refreshActorDirectory.dal.js` | `'learning'` | Post-write refresh |

### Migration tracking

This function is **DB-admin-managed**. It is not tracked in either app's `supabase/migrations/` directory. This is intentional — tracking it in one app would imply incorrect ownership.

Any schema or behavior changes must be:
1. Coordinated with both app teams
2. Applied directly by the DB admin
3. Documented here

### Governance decision (DRI-05 — 2026-05-18)

**Decision: DB-admin-managed (Option A)**

Rationale:
- Lives in `identity` schema, not in `platform`, `vc`, or `learning`
- The `p_actor_domain` parameter was designed explicitly for multi-app use
- Tracking in `apps/VCSM/supabase/migrations/` or `apps/wentrex/supabase/migrations/` would imply app ownership that does not exist
- No runtime security gap — `search_path` is hardened, no caller identity concern

Cross-reference: `zNOTFORPRODUCTION/_HISTORY/db/snapshots/2026-05-18_11-00_db_identity-governance-review.md` DRI-05
