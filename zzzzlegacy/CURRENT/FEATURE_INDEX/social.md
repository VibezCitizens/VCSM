# Feature Index: social

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/social`
Source Path: `apps/VCSM/src/features/social/`

## DR. STRANGE Read Order

1. [README.md](../features/social/README.md)
2. [CURRENT_STATUS.md](../features/social/CURRENT_STATUS.md)
3. [SECURITY.md](../features/social/SECURITY.md)
4. ARCHITECTURE.md — MISSING
5. [OWNERSHIP.md](../features/social/OWNERSHIP.md) — note: listed as `ownership.md` (lowercase)
6. TESTS.md — MISSING
7. [PERFORMANCE.md](../features/social/PERFORMANCE.md) — note: listed as `performance.md` (lowercase)
8. BLOCKERS.md — MISSING
9. DEFERRED.md — MISSING
10. [HISTORY_INDEX.md](../features/social/HISTORY_INDEX.md)

## Documentation Coverage

| File | Status |
|--------|--------|
| README | YES |
| CURRENT_STATUS | YES |
| SECURITY | YES |
| ARCHITECTURE | MISSING |
| OWNERSHIP | YES |
| TESTS | MISSING |
| PERFORMANCE | YES |
| BLOCKERS | MISSING |
| DEFERRED | MISSING |
| HISTORY_INDEX | YES |

Coverage Score: 6 / 10

## Active Risks

- **ELEK-2026-05-27-002 (HIGH, OPEN)** — `ctrlSetActorPrivacy` — no `assertingActorId`; no ownership gate on privacy write. Found during TICKET-SUB-001.
- **Privacy DAL split (MAJOR DRIFT — SENTRY)** — Privacy DAL is in social feature but should be in a dedicated privacy module. HIGH naming collision and boundary confusion.
- **`vc.get_follower_count` security context (UNKNOWN)** — Neither `prosecdef` nor `proconfig` have been verified for this RPC.
- **`vc.actor_privacy_settings` RLS (UNKNOWN)** — RLS policies not verified.
- **`vc.social_follow_requests` RLS (UNKNOWN)** — RLS policies not verified.
- **FALCON BLOCKED** — No native app exists; PWA blueprint documented but no iOS implementation.
- **Phase 0 migration READY TO APPLY** — `20260527060000` (add vport.profiles guard to existing RPCs) — written, not yet applied.
- **V-SUB-001/002/003 (CI BLOCKED)** — 17 tests intentionally failing for subscriber ownership gates. Will go green when gates are added (tracked under vport feature).

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- Phase 0 migration `20260527060000` — WRITTEN, READY TO APPLY.
- ELEK-2026-05-27-002 — privacy write path unguarded.
- DB verification required before Phase 1 RPCs can be created (3 unknowns).
- BLACKWIDOW referenced as required follow-up; not yet run.

## Deferred Items

DEFERRED.md — MISSING. Pending from CURRENT_STATUS:
- Phase 1–3 migration pipeline (pending Phase 0 application and DB verifications).
- Privacy DAL split (MAJOR DRIFT — SENTRY finding, no sprint assigned).
- ARCHITECT — not started.

## Latest Ticket

TICKET-SUB-008, TICKET-SUB-006, TICKET-SEC-VERIFY-001

## Audit Coverage

| Command | Status |
|---------|--------|
| ELEKTRA | COMPLETE — 2026-05-27 (2 HIGH, 2 MEDIUM, 2 LOW) |
| SENTRY | COMPLETE — 2026-05-27 (MAJOR DRIFT — privacy DAL) |
| FALCON | COMPLETE — 2026-05-27 (BLOCKED — no native app) |
| VENOM | PARTIAL — referenced via ELEKTRA pass |
| DB | PARTIAL — 2026-05-27 (RPCs confirmed SECDEF; others UNKNOWN) |
| ARCHITECT | NOT RUN |
| KRAVEN | NOT RUN |
| SPIDER-MAN | NOT RUN |
| BLACKWIDOW | NOT RUN (required follow-up) |
| IRONMAN | NOT RUN (dedicated pass) |

## Related Output Files

- `features/social/SECURITY.md`
- `features/social/OWNERSHIP.md` (lowercase)
- `features/social/PERFORMANCE.md` (lowercase)
- `features/social/HISTORY_INDEX.md`
- `features/social/2026-05-27_00-00_elektra_subscriber-follow-architecture.md`
- `features/social/2026-05-27_00-00_sentry_subscriber-follow-architecture.md`
- `features/social/2026-05-27_vport-subscribers-full-audit.audit.md`

## Recommended Next Command

DB — verify `vc.get_follower_count` security context, `vc.actor_privacy_settings` RLS, `vc.social_follow_requests` RLS. These three DB unknowns are blocking Phase 1 RPC creation. After DB: apply Phase 0 migration `20260527060000`, then BLACKWIDOW for adversarial verification.

## Recommended Next Ticket

Apply Phase 0 migration (`20260527060000`) — unblocks Phase 1/2/3 RPC pipeline. Open dedicated sprint for privacy DAL split (MAJOR DRIFT from SENTRY) — this is a structural architecture issue that needs ARCHITECT + IRONMAN + WOLVERINE sequencing.

## DR. STRANGE Entry
- File: CURRENT/features/social/DR_STRANGE.md
- Created: 2026-06-02
- Ticket: TICKET-DRSTRANGE-BACKFILL-P1-0001
