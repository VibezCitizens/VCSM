# Feature Index: join

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/join`
Source Path: `apps/VCSM/src/features/join/`

## DR. STRANGE Read Order

1. [README.md](../features/join/README.md)
2. [CURRENT_STATUS.md](../features/join/CURRENT_STATUS.md)
3. [SECURITY.md](../features/join/SECURITY.md)
4. [ARCHITECTURE.md](../features/join/ARCHITECTURE.md)
5. [OWNERSHIP.md](../features/join/OWNERSHIP.md) — note: listed as `ownership.md` (lowercase)
6. TESTS.md — MISSING
7. [PERFORMANCE.md](../features/join/PERFORMANCE.md) — note: listed as `performance.md` (lowercase)
8. BLOCKERS.md — MISSING
9. DEFERRED.md — MISSING
10. HISTORY_INDEX.md — MISSING

## Documentation Coverage

| File | Status |
|--------|--------|
| README | YES |
| CURRENT_STATUS | YES |
| SECURITY | YES |
| ARCHITECTURE | YES |
| OWNERSHIP | YES |
| TESTS | MISSING |
| PERFORMANCE | YES |
| BLOCKERS | MISSING |
| DEFERRED | MISSING |
| HISTORY_INDEX | MISSING |

Coverage Score: 6 / 10

## Active Risks

- **ELEK-2026-05-28-024 (HIGH)** — `createBarberVportAndAcceptQr` — no `assertActorOwnsVportActorController` before `acceptJoinResourceDAL`. QR join path unguarded post-VPORT creation.
- **ELEK-2026-05-28-025 (HIGH)** — `createBarberVportAndAccept` (invite path) — same ownership assertion gap. Invite path unguarded.
- **ELEK-2026-05-28-026 (MEDIUM)** — `autoResumeInviteOnboarding` calls `acceptJoinResourceDAL` without resolving `callerActorId`.
- **ELEK-2026-05-28-027 (MEDIUM)** — `fetchJoinResourceByIdDAL` no `resource_type` filter. Any resource UUID usable as join token — metadata leakage.
- **VENOM-TEAM-005 (MEDIUM)** — `findEligibleBarberActorIdsDAL` resolves via banned `profiles.owner_user_id` identity surface.
- **ELEK-2026-05-28-028 (LOW)** — QR expiry enforced only in hook/UI; no controller-layer expiry gate.
- **NEW-LEGAL-JOIN-001 (LOW)** — `recordSignupConsent` swallowed via `.catch(() => {})` — fully silent failures.
- **Migration blocker** — `legal_documents_document_type_check` constraint excludes `'age_verification'` — pre-production deployment blocker.
- **Public route** — `/join/barbershop/:token` sits outside ProtectedRoute. All trust boundaries must be at controller layer.

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- ELEK-024/025 (HIGH) — controller create paths unguarded. THOR BLOCKED.
- ELEK-027 (MEDIUM) — IDOR vulnerability on resource slot overwrite path.
- THOR BLOCKED — No completed security audit at module governance level.
- Migration blocker — age verification constraint pre-production blocker requires CARNAGE.

## Deferred Items

DEFERRED.md — MISSING. No formal deferred registry.

## Latest Ticket

ELEK-2026-05-28-024 through 028. No formal TICKET-XXXX assigned to join feature.

## Audit Coverage

| Command | Status |
|---------|--------|
| VENOM | PARTIAL — multi-feature sweeps only; no dedicated module pass |
| ELEKTRA | PARTIAL — barber/join paths (2026-05-27/28) |
| SENTRY | PARTIAL — route registration confirmed; iOS parity NOT audited |
| LOKI | COMPLETE — 2026-05-18 (barbershop-join route trace) |
| BLACKWIDOW | NOT RUN |
| SPIDER-MAN | NOT RUN |
| IRONMAN | NOT RUN |
| CARNAGE | NOT RUN (age verification constraint blocker) |
| THOR | BLOCKED |
| KRAVEN | NOT RUN |

## Related Output Files

- `features/join/SECURITY.md`
- `features/join/ARCHITECTURE.md`
- `features/join/vcsm.join.architecture.md`
- `features/join/triad.md`
- `features/dashboard/evidence/2026-05-28_elektra_barber.md`
- `features/auth/2026-05-18_loki_barbershop-join-route-trace.md`

## Recommended Next Command

VENOM + ELEKTRA — scoped full module pass on `apps/VCSM/src/features/join/`. Required before THOR can clear. Prioritize ELEK-024/025 (ownership assertion gaps on create paths) first.

## Recommended Next Ticket

Open formal TICKET-XXXX for join security sprint: (1) add `assertActorOwnsVportActorController` to `createBarberVportAndAcceptQr` and `createBarberVportAndAccept`, (2) CARNAGE for age verification constraint fix, (3) full VENOM + ELEKTRA module pass.

## DR. STRANGE Entry
- File: CURRENT/features/join/DR_STRANGE.md
- Created: 2026-06-02
- Ticket: TICKET-DRSTRANGE-BACKFILL-P1-0001
