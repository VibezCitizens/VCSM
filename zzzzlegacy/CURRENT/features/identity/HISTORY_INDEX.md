# HISTORY INDEX — identity

**Feature:** identity
**App:** VCSM

This file lists all audit source files read to produce this governance anchor. Each entry shows the path, date, command type, and scope.

---

## Audit Files

| File | Date | Command | Type | Scope |
|------|------|---------|------|-------|
| `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-18_venom_identity-provision-rpc-security.md` | 2026-05-18 | VENOM | Security | `platform.provision_vcsm_identity` SECURITY DEFINER RPC — caller guard verification, search_path, live DB inspection; 3 findings (1 HIGH, 1 MEDIUM, 1 LOW) + 3 additional live findings (VLF-01/02/03); migration readiness confirmed |
| `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-18_loki_identity-resolution-trace.md` | 2026-05-18 | LOKI | Runtime | Identity resolution trace — normal auth, self-heal, context resolution, bootstrap; static analysis only; read Limit scan: 80 lines |
| `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-18_ironman_identity-feature-ownership.md` | 2026-05-18 | IRONMAN | Ownership | Feature ownership audit — layer map, open items RISK-3/RISK-5/RISK-9; partial read: 80 lines |
| `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-18_carnage_identity-rpc-migration-ownership.md` | 2026-05-18 | CARNAGE | Migrations | Migration ownership audit for `platform.provision_vcsm_identity` and `identity.refresh_actor_directory_row`; confirmed both RPCs lack tracked creation migrations; schema trust classification produced; partial read: 80 lines |

---

## Notes

- The VENOM report (`2026-05-18_venom_identity-provision-rpc-security.md`) was read in full. It includes embedded live DB verification results from a `pg_get_functiondef` query run against the production database on 2026-05-18.
- The LOKI, IRONMAN, and CARNAGE reports were each read to line 80 only. Their governance anchors reflect only what was visible in those first 80 lines. Full report detail may contain additional findings or decisions not captured here.
- No auth-specific SENTRY, SPIDER-MAN, or BLACKWIDOW audit files were found for the identity feature as of this governance creation date (2026-06-02).
- The VENOM report references a companion migration file: `apps/VCSM/supabase/migrations/20260518040000_platform_provision_vcsm_identity.sql` — this is a security fix migration, not a creation migration.
