# Feature Index: invite

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/invite`
Source Path: `apps/VCSM/src/features/invite/` + shared paths with `features/join/` and `features/dashboard/vport/`

## DR. STRANGE Read Order

1. [README.md](../features/invite/README.md)
2. [CURRENT_STATUS.md](../features/invite/CURRENT_STATUS.md)
3. [SECURITY.md](../features/invite/SECURITY.md)
4. [ARCHITECTURE.md](../features/invite/ARCHITECTURE.md)
5. [OWNERSHIP.md](../features/invite/OWNERSHIP.md) — note: listed as `ownership.md` (lowercase)
6. TESTS.md — MISSING
7. [PERFORMANCE.md](../features/invite/PERFORMANCE.md) — note: listed as `performance.md` (lowercase)
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

- **BLOCK-INVITE-001 (HIGH, THOR BLOCKER)** — `createBarberVportAndAccept` calls `acceptJoinResourceDAL` without ownership assertion after VPORT creation. `useExistingBarberVportAndAccept` is correctly gated; create path is not.
- **BLOCK-INVITE-002 (THOR BLOCKER)** — Standalone `features/invite/` module (issuance, `/invite` route) has NEVER received a security audit. Released to production with zero coverage.
- **BLOCK-INVITE-003 (DB-BLOCKED)** — `send-citizen-invite` edge function calls `adminClient.auth.admin.listUsers()` on every invite — O(n) full user table fetch, email enumeration oracle. Requires SECURITY DEFINER RPC.
- **BLOCK-INVITE-004 (OPEN)** — Wildcard CORS on `send-citizen-invite` and all 5 edge functions — any origin can trigger invite write surfaces.
- **BLOCK-INVITE-005 (ARCH VIOLATION)** — `findEligibleBarberActorIdsDAL` queries via banned `profiles.owner_user_id` legacy identity surface.
- **ELEK-2026-05-28-026 (OPEN)** — `autoResumeInviteOnboarding` — no ownership assertion, `callerActorId` unresolved.
- **ELEK-2026-05-27-005 (DB-BLOCKED)** — `send-citizen-invite` O(n) user table fetch; edge function rework required.

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- BLOCK-INVITE-001 — Missing ownership gate in `createBarberVportAndAccept`. THOR BLOCKED.
- BLOCK-INVITE-002 — Standalone module has zero audit coverage. THOR BLOCKED.
- BLOCK-INVITE-003 — DB-BLOCKED; SECURITY DEFINER RPC required before scale.
- BLOCK-INVITE-004 — Wildcard CORS on all 5 edge functions.

## Deferred Items

DEFERRED.md — MISSING. Pending from CURRENT_STATUS:
- BLOCK-INVITE-003 — deferred pending DB migration (DB-BLOCKED).
- BLOCK-INVITE-005 — architecture contract violation, ARCHITECT/IRONMAN handoff pending.

## Latest Ticket

ELEK-2026-05-28-025, ELEK-2026-05-28-026 (THOR BLOCKED). No formal TICKET-XXXX scoped to invite.

## Audit Coverage

| Command | Status |
|---------|--------|
| VENOM | NOT RUN (standalone `features/invite/` module) |
| ELEKTRA | PARTIAL — team/join paths audited; standalone NOT audited |
| BLACKWIDOW | NOT RUN on invite module |
| SENTRY | NOT RUN |
| SPIDER-MAN | NOT RUN |
| IRONMAN | PARTIAL — standalone NOT covered |
| THOR | BLOCKED |
| KRAVEN | PARTIAL — 2026-06-01 (classified low risk) |
| LOKI | COMPLETE — 2026-05-18 (barbershop-join route trace) |

## Related Output Files

- `features/invite/SECURITY.md`
- `features/invite/ARCHITECTURE.md`
- `features/invite/vcsm.invite.architecture.md`
- `features/invite/triad.md`
- `features/dashboard/evidence/2026-05-27_14-30_elektra_barbershop-vport.md`
- `features/dashboard/evidence/2026-05-28_elektra_barber.md`

## Recommended Next Command

VENOM + ELEKTRA — scoped to `apps/VCSM/src/features/invite/` standalone module. Mandatory before any THOR gate attempt. Prerequisite: resolve ELEK-2026-05-28-025 (add `assertActorOwnsVportActorController` to `createBarberVportAndAccept`).

## Recommended Next Ticket

Open formal TICKET-XXXX for invite security sprint: (1) run VENOM + ELEKTRA on standalone module, (2) resolve ELEK-025/026, (3) DB sprint for SECURITY DEFINER RPC for `send-citizen-invite` user lookup.

## DR. STRANGE Entry
- File: CURRENT/features/invite/DR_STRANGE.md
- Created: 2026-06-02
- Ticket: TICKET-DRSTRANGE-BACKFILL-P1-0001
