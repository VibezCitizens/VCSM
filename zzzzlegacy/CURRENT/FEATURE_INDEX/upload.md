# Feature Index: upload

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/upload`
Source Path: `apps/VCSM/src/features/upload/`

## DR. STRANGE Read Order

1. [README.md](../features/upload/README.md)
2. [CURRENT_STATUS.md](../features/upload/CURRENT_STATUS.md)
3. [SECURITY.md](../features/upload/SECURITY.md)
4. [ARCHITECTURE.md](../features/upload/ARCHITECTURE.md)
5. OWNERSHIP.md — MISSING
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
| OWNERSHIP | MISSING |
| TESTS | MISSING |
| PERFORMANCE | MISSING |
| BLOCKERS | MISSING |
| DEFERRED | MISSING |
| HISTORY_INDEX | MISSING |

Coverage Score: 4 / 10

## Active Risks

- **R2 worker wildcard CORS (CRITICAL)** — `apps/WT/cloudflare-worker-upload/worker.js` has `Access-Control-Allow-Origin: *` with no Supabase JWT verification or origin allowlist. Any origin can write to the post-media R2 bucket. No remediation applied.
- **ELEK-2026-05-28-040 (MEDIUM)** — `ctrlSavePortfolioDetail` missing `assertActorOwnsVportActorController`. Authenticated user knowing another VPORT's actorId + portfolioItemId can corrupt that item's data.
- **ELEK-2026-05-28-041 (LOW)** — `updatePortfolioMediaAssetIdDAL` silently drops ownership filter if `callerProfileId` is null/undefined.
- **Post-media atomicity gap (HIGH risk)** — Post row inserted before media upload completes. Media failure leaves orphaned post in `vc.posts`. `postAuthRollback.dal.js` exists but active usage unclear.
- **Dual controller folder (ARCHITECTURE VIOLATION)** — `upload/controller/` and `upload/controllers/` both exist. Canonical path unclear (GAP-039).
- **Legacy `UploadScreen.jsx` (UNKNOWN)** — Route mount status unknown. LOKI verification and IRONMAN audit pending.
- **SPIDER-MAN BLOCKED (2026-05-26)** — 4 CRITICAL + 3 HIGH findings; zero upload test coverage.
- **TICKET-PLATFORM-RLS-001 (OPEN)** — `platform.media_assets` {public} policy cleanup.

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- R2 worker wildcard CORS (CRITICAL) — no remediation found.
- ELEK-040 — portfolio detail ownership gate missing; patch proposed but not applied.
- SPIDER-MAN BLOCKED — zero test coverage.
- IRONMAN and SENTRY NOT RUN on upload post-creation flow.

## Deferred Items

DEFERRED.md — MISSING. Pending from CURRENT_STATUS:
- Post-media atomicity gap resolution (confirm `postAuthRollback.dal.js` usage).
- Dual controller folder consolidation (GAP-039).
- Legacy `UploadScreen.jsx` status determination.
- TICKET-PLATFORM-RLS-001 execution.

## Latest Ticket

ELEK-2026-05-28-042, ELEK-2026-05-28-043, ELEK-2026-05-28-044, TICKET-PLATFORM-RLS-001

## Audit Coverage

| Command | Status |
|---------|--------|
| VENOM | PARTIAL — vport-create-avatar-upload (2026-05-10), media-dal-trust-boundary (2026-05-19); post-creation flow NOT audited |
| ELEKTRA | PARTIAL — portfolio path (2026-05-28) |
| THOR | PARTIAL — media DAL READY (2026-05-19); vport avatar CAUTION (2026-05-10) |
| SPIDER-MAN | BLOCKED — 2026-05-26 (zero upload test coverage) |
| IRONMAN | NOT RUN (upload post-creation flow) |
| SENTRY | NOT RUN |
| BLACKWIDOW | NOT RUN |
| KRAVEN | NOT RUN (FFmpeg WASM review requested, not confirmed completed) |
| LOKI | NOT RUN (upload post-creation flow) |
| CARNAGE | NOT RUN |

## Related Output Files

- `features/upload/SECURITY.md`
- `features/upload/ARCHITECTURE.md`
- `features/media/2026-05-10_thor_vport-create-avatar-upload.md`
- `features/media/2026-05-19_venom_media-dal-trust-boundary.md`
- `platform/security/2026-05-19_13-30_thor_media-dal-release-gate.md`

## Recommended Next Command

VENOM + ELEKTRA — scoped to upload post-creation flow (`upload/controllers/createPost.controller.js` and `upload/controller/recordPostMedia.controller.js`). This flow has never been audited as a standalone target. Before running: resolve ELEK-040 (portfolio detail ownership gate) and confirm canonical controller folder.

## Recommended Next Ticket

Open ticket for: (1) R2 worker CORS hardening (CRITICAL — add Supabase JWT verification or origin allowlist), (2) ELEK-040 patch (`ctrlSavePortfolioDetail` ownership gate), (3) consolidate `upload/controller/` vs `upload/controllers/` naming (GAP-039).

## DR. STRANGE Entry
- File: CURRENT/features/upload/DR_STRANGE.md
- Created: 2026-06-02
- Ticket: TICKET-DRSTRANGE-BACKFILL-P1-0001
