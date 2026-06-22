# Feature Index: legal

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/legal`
Source Path: `apps/VCSM/src/features/legal/`

## DR. STRANGE Read Order

1. [README.md](../features/legal/README.md)
2. [CURRENT_STATUS.md](../features/legal/CURRENT_STATUS.md)
3. [SECURITY.md](../features/legal/SECURITY.md)
4. ARCHITECTURE.md — MISSING
5. OWNERSHIP.md — MISSING
6. TESTS.md — MISSING
7. PERFORMANCE.md — MISSING
8. BLOCKERS.md — MISSING
9. DEFERRED.md — MISSING
10. [HISTORY_INDEX.md](../features/legal/HISTORY_INDEX.md)

## Documentation Coverage

| File | Status |
|--------|--------|
| README | YES |
| CURRENT_STATUS | YES |
| SECURITY | YES |
| ARCHITECTURE | MISSING |
| OWNERSHIP | MISSING |
| TESTS | MISSING |
| PERFORMANCE | MISSING |
| BLOCKERS | MISSING |
| DEFERRED | MISSING |
| HISTORY_INDEX | YES |

Coverage Score: 4 / 10

## Active Risks

- **F4 (MEDIUM, PARTIAL)** — `ip_address` safely omitted from consent writes; `locale` and `user_agent` still client-supplied. Server-side IP capture via Edge Function is an OPEN CARNAGE task.
- **F6 (LOW, DORMANT)** — Barbershop route still unregistered; all pre-fixes complete; risk reduced to LOW. Route dead — safe to wire when ready.
- **locale/user_agent client-supplied (LOW)** — Informational only; no evidentiary use claimed; no blocking concern.

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- Server-side IP capture CARNAGE task must ship before any regulatory audit or Edge Function activation.
- ELEKTRA, SPIDER-MAN, FALCON — NOT STARTED.

## Deferred Items

DEFERRED.md — MISSING. Pending from CURRENT_STATUS:
- Server-side IP capture via Edge Function (CARNAGE task, OPEN).
- Barbershop route registration (F6, DORMANT LOW risk).

## Latest Ticket

Not found in CURRENT docs.

## Audit Coverage

| Command | Status |
|---------|--------|
| VENOM | COMPLETE — 2026-05-10 (9 findings) + 2026-05-18 (resolution audit) |
| KRAVEN | COMPLETE — 2026-05-10 |
| SENTRY | COMPLETE — 2026-05-10 (scoped to VPORT system post realm hardening — ALIGNED) |
| ELEKTRA | NOT RUN |
| SPIDER-MAN | NOT RUN |
| FALCON | NOT RUN |
| ARCHITECT | UNKNOWN — referenced as input to reports, no standalone file |
| CARNAGE | NOT RUN (F4 server-side IP task pending) |
| DB | PARTIAL — migration `20260510030000` tracked; live application UNCONFIRMED statically |

## Related Output Files

- `features/legal/SECURITY.md`
- `features/legal/HISTORY_INDEX.md`
- `features/legal/vcsm.legal.consent-system.md`
- `features/legal/vcsm.legal.automation-scripts.md`
- `features/legal/2026-05-10_venom_terms-of-service-logic.md`
- `features/legal/2026-05-18_venom_legal-dal-finding-resolution.md`

## Recommended Next Command

CARNAGE — server-side IP capture Edge Function task (closes F4 OPEN item). Then ELEKTRA for a precision security scan, followed by SPIDER-MAN for regression tests on the consent gate (F1 resolution needs test lock).

## Recommended Next Ticket

Open ticket for: (1) CARNAGE server-side IP capture Edge Function, (2) confirm live deployment status of migration `20260510030000` (user_consents immutability and grant), (3) ELEKTRA precision scan on consent write path.
