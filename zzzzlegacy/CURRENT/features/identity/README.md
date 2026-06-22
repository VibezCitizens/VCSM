# Feature: identity

**Status:** ACTIVE
**Security Tier:** CRITICAL
**Source:** `apps/VCSM/src/features/identity/`
**Related paths:** `apps/VCSM/src/state/identity/`, `engines/identity/`
**Last audit sprint:** 2026-05-18

## What This Feature Does

The identity feature provisions and resolves the VCSM platform identity chain for authenticated Citizens. It wraps the `platform.provision_vcsm_identity` SECURITY DEFINER RPC (which bootstraps 6 platform objects: `user_app_access`, `user_app_accounts`, `user_app_preferences`, `user_app_state`, `user_app_actor_links`, and the `vc.actors.user_app_account_id` bridge column), and calls `identity.refresh_actor_directory_row` to keep the actor directory current. The companion `state/identity/` layer manages in-memory actor identity state via `IdentityProvider` and handles normal auth, self-heal, context resolution, and actor switching.

## Governance Coverage

| Command    | Status   | Date       | Report |
|------------|----------|------------|--------|
| VENOM      | COMPLETE | 2026-05-18 | `2026-05-18_venom_identity-provision-rpc-security.md` |
| LOKI       | COMPLETE | 2026-05-18 | `2026-05-18_loki_identity-resolution-trace.md` |
| IRONMAN    | COMPLETE | 2026-05-18 | `2026-05-18_ironman_identity-feature-ownership.md` |
| CARNAGE    | COMPLETE | 2026-05-18 | `2026-05-18_carnage_identity-rpc-migration-ownership.md` |
| DB         | COMPLETE | 2026-05-18 | DB verification performed within VENOM report (live `pg_get_functiondef` query) |
| SENTRY     | NOT_STARTED | —       | — |
| SPIDER-MAN | NOT_STARTED | —       | — |
| BLACKWIDOW | NOT_STARTED | —       | — |

## Open Items

**VENOM Findings — OPEN (not resolved in any source file):**
- VF-01 (HIGH): `platform.provision_vcsm_identity` has NO `auth.uid()` guard — any authenticated user can provision platform rows for any `user_id`. CONFIRMED by live DB inspection 2026-05-18. Migration `20260518040000_platform_provision_vcsm_identity.sql` is ready to apply but deployment status is UNKNOWN from source files.
- VF-02 (MEDIUM): `provision_vcsm_identity` search_path partially hardened — `pg_temp` missing. CONFIRMED PARTIAL by live DB inspection.
- VF-03 (LOW): No audit trail emitted after successful platform provisioning.

**Additional live DB findings (confirmed 2026-05-18 VENOM):**
- VLF-01: Return type is `RETURNS jsonb` in live DB (not `uuid` as DAL comments claim)
- VLF-02: `p_actor_id DEFAULT NULL::uuid` — parameter is optional in live body
- VLF-03: `service_role` does not have EXECUTE grant — only `authenticated`

**CARNAGE — Migration gaps (OPEN):**
- `platform.provision_vcsm_identity` has no tracked creation migration in `apps/VCSM/supabase/migrations/`
- `identity.refresh_actor_directory_row` has no tracked creation migration in `apps/VCSM/supabase/migrations/`

**IRONMAN — Open questions (from first 80 lines):**
- `refreshActorDirectory.controller.js` is a hollow pass-through (RISK-5 / OQ-4 equivalent — see source file)
- `resolvers/` layer is non-standard (RISK-9 per IRONMAN) — taxonomy decision pending
- No model files exist in `features/identity/` — RPC responses consumed raw
