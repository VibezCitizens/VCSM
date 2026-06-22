# Feature Index: public

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/public`
Source Path: `apps/VCSM/src/features/public/` (vportMenu + vportBusinessCard sub-modules)

## DR. STRANGE Read Order

1. [README.md](../features/public/README.md)
2. [CURRENT_STATUS.md](../features/public/CURRENT_STATUS.md)
3. [SECURITY.md](../features/public/SECURITY.md)
4. [ARCHITECTURE.md](../features/public/ARCHITECTURE.md)
5. [OWNERSHIP.md](../features/public/OWNERSHIP.md)
6. TESTS.md — MISSING
7. PERFORMANCE.md — MISSING
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
| PERFORMANCE | MISSING |
| BLOCKERS | MISSING |
| DEFERRED | MISSING |
| HISTORY_INDEX | MISSING |

Coverage Score: 5 / 10

## Active Risks

- **ELEK-2026-05-28-007 (HIGH)** — `deleteVportActorMenuCategoryController` missing ownership gate. Menu category IDs returned by public QR read surface — cross-actor menu destruction possible.
- **ELEK-2026-05-28-008 (HIGH)** — `deleteVportActorMenuItemController` missing ownership gate. Entire menu destroyable with no audit trail.
- **ELEK-2026-05-27-001 (HIGH)** — Wildcard CORS on all 5 edge functions including public lead submit path.
- **VL-001 through VL-005 (HIGH)** — Legacy RPC `submit_business_card_lead` has GRANT EXECUTE TO PUBLIC, no availability guard, `actor_id = NULL` hardcoded. Permissive INSERT policies, full-row UPDATE grant, missing source constraint. Migration plan authored, NOT executed.
- **ELEK-2026-05-27-004 (MEDIUM)** — `send-lead-confirmation` accepts anon key as auth — triggers SES email delivery to arbitrary addresses.
- **VENOM-CONTENT-005 (MEDIUM, DB-BLOCKED)** — `is_indexable` filter inconsistency between DAL and public RLS policies.
- **VENOM-DELETE-004 (MEDIUM)** — Cache invalidation dead code never called on delete; stale public content served up to 10 minutes post-deletion.
- **Duplicate VportActorMenuPublicView** — Route `/actor/:actorId/menu` exposes raw UUID in back navigation. Divergent duplicate hook.
- **ZERO security audit** — vportMenu and vportBusinessCard NEVER audited by VENOM, ELEKTRA, or BLACKWIDOW. Both are released and serving traffic.

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- THOR BLOCKED for both sub-modules — no VENOM or ELEKTRA run on record.
- business_card_leads migration (VL-001 through VL-005) — plan authored, not executed.
- ELEK-007/008 — menu delete ownership gates missing (cross-VPORT destructive attack vector).
- SPIDER-MAN test coverage MISSING.

## Deferred Items

DEFERRED.md — MISSING. Pending from CURRENT_STATUS:
- Bookings {public} role cleanup — 4 UPDATE + 1 SELECT policies (separate CARNAGE migration).
- VENOM-CONTENT-005 (DB-BLOCKED).
- Write-review CTA dead (no review submission screen post-auth).

## Latest Ticket

VENOM-CONTENT-005, VENOM-DELETE-004, ELEK-2026-05-27-002 (RESOLVED)

## Audit Coverage

| Command | Status |
|---------|--------|
| VENOM | NOT RUN (scoped to features/public/) |
| ELEKTRA | PARTIAL — edge functions (2026-05-27), delete lifecycle (2026-05-28) |
| BLACKWIDOW | NOT RUN |
| SENTRY | NOT RUN |
| IRONMAN | NOT RUN |
| SPIDER-MAN | NOT RUN |
| KRAVEN | NOT RUN |
| LOKI | PARTIAL — 2026-05-27 (vport-menu QR path traced) |
| THOR | BLOCKED — all checklist items NOT_STARTED for both sub-modules |
| CARNAGE | PARTIAL — migration plan authored, not executed |

## Related Output Files

- `features/public/SECURITY.md`
- `features/public/ARCHITECTURE.md`
- `features/public/OWNERSHIP.md`
- `_NEEDS_TRIAGE/2026-05-27_18-30_venom_content-pages.md`
- `_NEEDS_TRIAGE/2026-05-28_elektra_delete-lifecycle.md`
- `_NEEDS_TRIAGE/2026-05-27_19-00_blackwidow_content-pages-delete-lifecycle.md`

## Recommended Next Command

VENOM + ELEKTRA — scoped to `apps/VCSM/src/features/public/`. Both sub-modules are unauthenticated, released, and have zero security audit coverage. Prioritize ELEK-007/008 (menu delete ownership gates) and VL-001–005 migration execution BEFORE the full VENOM run.

## Recommended Next Ticket

Open ticket for: (1) ELEK-007/008 — add ownership gates to menu delete controllers (P0 patch), (2) execute business_card_leads migration (VL-001–005), (3) full VENOM + ELEKTRA pass on features/public/. These three actions unblock THOR for both sub-modules.

## DR. STRANGE Entry
- File: CURRENT/features/public/DR_STRANGE.md
- Created: 2026-06-02
- Ticket: TICKET-DRSTRANGE-BACKFILL-P0-0001
