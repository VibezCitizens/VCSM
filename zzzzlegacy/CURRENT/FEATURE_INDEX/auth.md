# Feature Index: auth

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/auth`
Source Path: `apps/VCSM/src/features/auth/`

## DR. STRANGE Read Order

1. [README.md](../features/auth/README.md)
2. [CURRENT_STATUS.md](../features/auth/CURRENT_STATUS.md)
3. [SECURITY.md](../features/auth/SECURITY.md)
4. [ARCHITECTURE.md](../features/auth/ARCHITECTURE.md)
5. OWNERSHIP.md — MISSING
6. TESTS.md — MISSING
7. PERFORMANCE.md — MISSING
8. BLOCKERS.md — MISSING
9. DEFERRED.md — MISSING
10. [HISTORY_INDEX.md](../features/auth/HISTORY_INDEX.md)

## Documentation Coverage

| File | Status |
|--------|--------|
| README | YES |
| CURRENT_STATUS | YES |
| SECURITY | YES |
| ARCHITECTURE | YES |
| OWNERSHIP | MISSING |
| TESTS | MISSING |
| PERFORMANCE | MISSING |
| BLOCKERS | MISSING |
| DEFERRED | MISSING |
| HISTORY_INDEX | YES |

Coverage Score: 5 / 10

## Active Risks

- **Booking source bypass (HIGH, P0)** — Unknown `source` values skip all authorization in `createBookingController`.
- **Dev diagnostics screen accessible to all authenticated users (HIGH, P0)** — Real DB write capability exposed.
- **Client-controlled booking duration/label/note (HIGH, P0)** — `createBookingController` accepts client-supplied fields.
- **ActorModel exposes `profileId` (HIGH, P1)** — Public field on `actor.model.js:6`.
- **Raw session tokens in `AuthContext` (HIGH, P2)** — `access_token` / `refresh_token` exposed via React Context.
- **`assertActorOwnsVportActor` self-check bypass (MEDIUM, P1)** — Self-check short-circuits `actor_owners` lookup.
- **`AuthProvider` DAL bypass (MEDIUM, P1)** — Reads Supabase session directly, bypassing DAL.
- **T6→T35 identity gap (MEDIUM, P1)** — No explicit identity loading guard in route chain.
- **`window.__sb` Supabase client on global (MEDIUM, P1)** — Exposed when `VITE_EXPOSE_SB_CLIENT=1`.
- **`error_description` URL reflection (MEDIUM, P1)** — Phishing surface.
- **VENOM-AUTH-004, 005, 007, 008** — OPEN (lower priority, see SECURITY.md).

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- Multiple HIGH P0 findings (booking source bypass, dev diagnostics, client-controlled fields) not yet resolved.
- DB follow-ups not started: RLS on `public.profiles`, `vc.actor_owners`, `vc.actors`.

## Deferred Items

DEFERRED.md — MISSING. No formal deferred registry.

## Latest Ticket

ELEK-2026-05-28-026, ELEK-2026-05-28-027, ELEK-2026-05-28-028

## Audit Coverage

| Command | Status |
|---------|--------|
| VENOM | COMPLETE — 3 passes (2026-05-11, 2026-05-14, 2026-05-23) |
| SENTRY | COMPLETE — 2026-05-11 |
| BLACKWIDOW | PARTIAL — BW-LOGIN-001/002/003 remediated via VENOM 2026-05-23 |
| DB | NOT RUN |
| LOKI | NOT RUN |
| IRONMAN | NOT RUN |
| CARNAGE | NOT RUN |
| SPIDER-MAN | NOT RUN |
| ARCHITECT | COMPLETE — 2026-06-02 (TICKET-AUTH-ARCHITECT-0001) |
| ELEKTRA | PARTIAL — barber path findings 2026-05-28 |

## Related Output Files

- `features/auth/SECURITY.md`
- `features/auth/HISTORY_INDEX.md`
- `features/auth/2026-05-11_venom_auth-login-trust-boundaries.md`
- `features/auth/2026-05-14_venom_auth-login-full-surface.md`
- `features/auth/2026-05-23_14-00_venom_login-recovery-surface.md`
- `features/auth/2026-05-23_blackwidow_login-screen.md`
- `features/auth/vcsm.identity.login-pipeline-trace.md`
- `features/auth/vcsm.runtime.authority-matrix.md`

## Recommended Next Command

DB — verify RLS on `public.profiles` (discoverable write), `vc.actor_owners` (insert policy), `vc.actors` (read policy). Resolves V-FINDING pending CARNAGEs. Follow with CARNAGE for booking schema constraints and ARCHITECT to document legacy identity tables.

## Recommended Next Ticket

Open ticket for: (1) resolve booking source bypass in `createBookingController` (P0), (2) gate dev diagnostics screen to admin role only (P0), (3) client-controlled booking field hardening (P0). These three P0 findings have no dedicated ticket.

## DR. STRANGE Entry
- File: CURRENT/features/auth/DR_STRANGE.md
- Created: 2026-06-02
- Ticket: TICKET-DRSTRANGE-BACKFILL-P0-0001
