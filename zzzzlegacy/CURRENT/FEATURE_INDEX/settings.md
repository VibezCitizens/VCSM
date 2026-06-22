# Feature Index: settings

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/settings`
Source Path: `apps/VCSM/src/features/settings/` + `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/`

## DR. STRANGE Read Order

1. [README.md](../features/settings/README.md)
2. [CURRENT_STATUS.md](../features/settings/CURRENT_STATUS.md)
3. [SECURITY.md](../features/settings/SECURITY.md)
4. [ARCHITECTURE.md](../features/settings/ARCHITECTURE.md)
5. OWNERSHIP.md — MISSING
6. TESTS.md — MISSING
7. PERFORMANCE.md — MISSING
8. BLOCKERS.md — MISSING
9. DEFERRED.md — MISSING
10. [HISTORY_INDEX.md](../features/settings/HISTORY_INDEX.md)

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

Coverage Score: 4 / 10

## Active Risks

- **ELEK-2026-05-28-002 (HIGH, DEFERRED)** — `ctrlSetActorPrivacy` accepts any `actorId` from caller with no server-side ownership verification. Actor privacy hijack possible.
- **ELEK-2026-05-28-004 (HIGH, DEFERRED)** — `dalSetActorPrivacy` has no `auth.getUser()` binding. RLS on `vc.actor_privacy_settings` not confirmed.
- **ELEK-2026-05-28-005 (OPEN)** — `dalDeleteOwnedVportById` deprecated DAL still exported and live. Uses legacy `owner_user_id`; omits cascade logic.
- **VENOM-SETTINGS-004 (P2, DEFERRED)** — `listMyVportsDAL` still uses `owner_user_id`. Approved `actor_owners` rewrite documented; no sprint assigned.
- **BW-SETTINGS-005 (OPEN)** — No optimistic locking on `upsertVportPublicDetailsDAL`. Replay attack post-session compromise possible.
- **TICKET-SUB-010-B (PENDING)** — `vc.actor_social_settings` owner-delegation RLS migration not yet applied. `ctrlUpdateVportSocialSettings` cannot be built until this migration lands.
- **Zero test coverage** — All settings flows (hooks, validation model, controller ownership gates) have no tests.

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- TICKET-SUB-010-B PENDING — migration not yet applied; social settings write path blocked.
- ELEK-002/004 privacy controller gaps — deferred to separate sprint.
- Full VENOM+ELEKTRA post-TICKET-0009 PENDING.
- SENTRY post-execution review PENDING.

## Deferred Items

DEFERRED.md — MISSING. Pending from CURRENT_STATUS:
- ELEK-002/004 (HIGH) — ctrlSetActorPrivacy / dalSetActorPrivacy hardening (separate sprint).
- VENOM-SETTINGS-004 (P2) — `listMyVportsDAL` `owner_user_id` rewrite.
- Zero test coverage (SPM-007 pending).

## Latest Ticket

TICKET-0009 (RESOLVED 2026-06-02), TICKET-SUB-010-B (PENDING)

## Audit Coverage

| Command | Status |
|---------|--------|
| ARCHITECT | PARTIAL — architecture maps present; formal output missing |
| VENOM | COMPLETE — 2026-05-27 (VENOM-SETTINGS-001 RESOLVED, others carry forward) |
| ELEKTRA | COMPLETE — 2026-05-28 (ELEK-001 RESOLVED; 002/004/005 OPEN or DEFERRED) |
| BLACKWIDOW | COMPLETE — 2026-05-27 (BW-SETTINGS-005 OPEN) |
| IRONMAN | COMPLETE — 2026-05-26 (ownership CLEAR for VPORT write paths) |
| SPIDER-MAN | PARTIAL — 2026-05-26 (zero test coverage confirmed) |
| WOLVERINE | COMPLETE — 2026-06-02 (TICKET-0009 RESOLVED) |
| SENTRY | RECOMMENDED NEXT (post-TICKET-0009) |
| CARNAGE | PARTIAL — migrations applied 2026-05-27 |
| THOR | PARTIAL — CAUTION release with privacy hardening sprint pending |
| KRAVEN | NOT RUN |

## Related Output Files

- `features/settings/SECURITY.md`
- `features/settings/ARCHITECTURE.md`
- `features/settings/vcsm.settings.architecture.md`
- `features/settings/vcsm.bottom-nav.settings.architecture.md`
- `platform/security/2026-05-27_16-30_venom_ticket-platform-rls-001.md`
- `platform/security/2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md`

## Recommended Next Command

SENTRY — post-execution review on TICKET-0009 changes (coordinator pattern, validation move). Then scoped VENOM+ELEKTRA on settings after TICKET-SUB-010-B migration is applied.

## Recommended Next Ticket

Apply TICKET-SUB-010-B migration (`actor_social_settings` owner-delegation RLS) — unblocks social settings write path. Then open dedicated sprint for ELEK-002/004 (privacy controller hardening).

## DR. STRANGE Entry
- File: CURRENT/features/settings/DR_STRANGE.md
- Created: 2026-06-02
- Ticket: TICKET-DRSTRANGE-BACKFILL-P0-0001
