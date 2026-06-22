# Feature Index: identity

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/identity`
Source Path: `apps/VCSM/src/features/identity/` + `apps/VCSM/src/state/identity/` + `engines/identity/`

## DR. STRANGE Read Order

1. [README.md](../features/identity/README.md)
2. [CURRENT_STATUS.md](../features/identity/CURRENT_STATUS.md)
3. [SECURITY.md](../features/identity/SECURITY.md)
4. ARCHITECTURE.md — MISSING
5. [OWNERSHIP.md](../features/identity/OWNERSHIP.md)
6. TESTS.md — MISSING
7. PERFORMANCE.md — MISSING
8. BLOCKERS.md — MISSING
9. DEFERRED.md — MISSING
10. [HISTORY_INDEX.md](../features/identity/HISTORY_INDEX.md)

## Documentation Coverage

| File | Status |
|--------|--------|
| README | YES |
| CURRENT_STATUS | YES |
| SECURITY | YES |
| ARCHITECTURE | MISSING |
| OWNERSHIP | YES |
| TESTS | MISSING |
| PERFORMANCE | MISSING |
| BLOCKERS | MISSING |
| DEFERRED | MISSING |
| HISTORY_INDEX | YES |

Coverage Score: 5 / 10

## Active Risks

- **VF-01 (HIGH, OPEN)** — `platform.provision_vcsm_identity` has NO `auth.uid()` guard. Any authenticated user can provision platform rows for any `user_id`. Confirmed by live DB inspection 2026-05-18. Migration `20260518040000` ready but deployment status UNKNOWN.
- **VF-02 (MEDIUM, OPEN)** — `provision_vcsm_identity` search_path partially hardened — `pg_temp` missing. Covered by same migration.
- **VLF-01 (OPEN)** — Live function returns `RETURNS jsonb` but DAL comments claim `uuid` — mismatch.
- **VLF-02 (OPEN)** — `p_actor_id DEFAULT NULL::uuid` — parameter optional in live body; may allow provisioning without actor link.
- **VLF-03 (OPEN)** — `service_role` lacks EXECUTE grant on `provision_vcsm_identity`; only `authenticated` has EXECUTE.
- **CARNAGE migration gap (OPEN)** — `platform.provision_vcsm_identity` has no tracked creation migration.
- **IRONMAN** — `refreshActorDirectory.controller.js` is a hollow pass-through; `resolvers/` layer non-standard taxonomy (RISK-9).

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- **Migration deployment UNKNOWN** — `20260518040000_platform_provision_vcsm_identity.sql` is written and verified safe but deployment status not confirmed in source files.
- **SENTRY/SPIDER-MAN/BLACKWIDOW** — NOT STARTED on identity feature.

## Deferred Items

DEFERRED.md — MISSING. Pending from CURRENT_STATUS:
- VF-03 (LOW) — Add audit trail after successful provisioning.
- IRONMAN open questions — hollow pass-through controller, `resolvers/` taxonomy decision.

## Latest Ticket

Not found in CURRENT docs. CARNAGE migration `20260518040000` is the most recent formal action.

## Audit Coverage

| Command | Status |
|---------|--------|
| VENOM | COMPLETE — 2026-05-18 (live DB verification) |
| LOKI | COMPLETE — 2026-05-18 (static analysis, no live instrumentation) |
| IRONMAN | COMPLETE — 2026-05-18 |
| CARNAGE | COMPLETE — 2026-05-18 (migration gaps confirmed) |
| DB | COMPLETE — 2026-05-18 (live `pg_get_functiondef` verification) |
| SENTRY | NOT RUN |
| SPIDER-MAN | NOT RUN |
| BLACKWIDOW | NOT RUN |
| ARCHITECT | NOT RUN |
| THOR | NOT RUN |

## Related Output Files

- `features/identity/SECURITY.md`
- `features/identity/OWNERSHIP.md`
- `features/identity/HISTORY_INDEX.md`
- `features/identity/platform.identity.shared-rpcs.md`
- `features/identity/post-identity-risks.md`
- `features/auth/2026-05-18_loki_identity-resolution-trace.md`
- `features/auth/2026-05-18_ironman_identity-feature-ownership.md`

## Recommended Next Command

DB — confirm deployment status of migration `20260518040000`. If deployed, VF-01 and VF-02 are resolved. If not, escalate as P0 deployment action. Then SENTRY for architecture contract compliance.

## Recommended Next Ticket

Open ticket to: (1) confirm + document migration `20260518040000` deployment status, (2) resolve VLF-01 (return type mismatch — DAL comments update), (3) IRONMAN decision on hollow controller and `resolvers/` taxonomy.

## DR. STRANGE Entry
- File: CURRENT/features/identity/DR_STRANGE.md
- Created: 2026-06-02
- Ticket: TICKET-DRSTRANGE-BACKFILL-P1-0001
