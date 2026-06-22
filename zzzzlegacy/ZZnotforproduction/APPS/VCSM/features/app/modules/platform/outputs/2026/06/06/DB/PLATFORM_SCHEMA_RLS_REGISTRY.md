# Platform Schema — RLS Registry

**Scope:** `platform.*` tables — RLS posture and ownership documentation
**Owner:** Service operations / DB command
**Updated:** 2026-06-06
**Mode:** Append-only. Add a row per reviewed table. Never remove rows.

---

## Purpose

Records the intended RLS posture for every `platform` schema table.
Default-deny tables (RLS enabled, zero policies) must be documented here so
reviewers know whether the posture is intentional or a misconfiguration.

---

## Registry

| ID | Table | RLS Enabled | Policy Count | Posture | Intended Consumer | Risk | Status | Reviewed |
|---|---|---|---|---|---|---|---|---|
| PLATFORM-RLS-001 | `platform.failed_account_deletions` | YES | 0 | Default-deny | Service role only (internal audit log) | LOW | REVIEWED | 2026-06-06 |
| PLATFORM-RLS-002 | `platform.user_app_access` | YES | 4 | Own-row | Authenticated user (own row only) | LOW | REVIEWED | 2026-06-06 |
| PLATFORM-RLS-003 | `platform.user_app_accounts` | YES | 4 | Own-row | Authenticated user (own row only) | LOW | REVIEWED | 2026-06-06 |
| PLATFORM-RLS-004 | `platform.user_app_actor_links` | YES | 6 | Chained ownership | Authenticated user (via user_app_accounts) | LOW | REVIEWED | 2026-06-06 |
| PLATFORM-RLS-005 | `platform.user_app_preferences` | YES | 4 | Chained ownership | Authenticated user (via user_app_accounts) | LOW | REVIEWED | 2026-06-06 |
| PLATFORM-RLS-006 | `platform.user_app_state` | YES | 4 | Chained ownership | Authenticated user (via user_app_accounts) | LOW | REVIEWED | 2026-06-06 |

---

## Finding Detail

### PLATFORM-RLS-001 — `platform.failed_account_deletions`

| Field | Value |
|---|---|
| ID | PLATFORM-RLS-001 |
| Table | `platform.failed_account_deletions` |
| Schema | `platform` |
| RLS Enabled | YES |
| Policy Count | 0 |
| Effective Posture | **Default-deny** — authenticated clients cannot read, insert, update, or delete |
| Status | REVIEWED |
| Risk | LOW |
| Reviewed | 2026-06-06 |

**Assessment:**
RLS enabled with zero policies is a deliberate default-deny posture. This is the correct
configuration for an internal audit log table that should never be accessible to authenticated
client sessions. Only `service_role` (Supabase functions, server-side operations) can access
the table.

**Intended ownership:**
`platform.failed_account_deletions` is a service-only table. It exists to record account
deletion failures for internal audit purposes. Client-side code must never read from or
write to this table directly. All writes are expected to occur via server-side functions
or edge functions using the service role key.

**What would be wrong:**
- Any authenticated client SELECT policy added without explicit security review
- Any INSERT policy allowing browser clients to write failure records
- Any edge function writing to this table with the anon key

**No action required.** Posture is intentional and correct. This entry documents that
the zero-policy state is not a gap — it is the intended security model.

---

## How To Add Entries

When a new platform schema table is reviewed:

1. Add a row to the Registry table above.
2. Add a Finding Detail section below using the next sequential ID.
3. Record: table name, RLS status, policy count, intended consumer, risk, and reviewer decision.
4. If posture is NOT intentional (e.g., a table that should have policies but does not),
   escalate to a DB ticket immediately — do not record as REVIEWED.
