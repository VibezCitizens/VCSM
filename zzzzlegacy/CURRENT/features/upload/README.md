# upload — README.md
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Gap ID: GAP-012
# Status: CURRENT SOURCE OF TRUTH

| Field | Value |
|---|---|
| Feature | upload |
| Classification | PLATFORM |
| Auth Surface | OWNER |
| Priority | P2 |
| Risk Level | HIGH |
| Governance Status | BOOTSTRAPPED |
| Last Updated | 2026-06-02 |
| Ticket | TICKET-DOCS-CLEANUP-001 |
| Gap ID | GAP-012 |

## What This Feature Does

The upload feature is the primary post-creation surface in VCSM. It allows authenticated owners to pick media files (images/video), compress them client-side via FFmpeg WASM, upload them to Cloudflare R2 storage, and persist post rows plus associated media asset records to the database. The feature also supports @mention autocomplete during post composition and is consumed by the portfolio and media features as an upstream dependency. A separate profile upload pipeline (avatar/banner) and a VPORT creation avatar upload pipeline exist as sub-flows within the broader upload surface.

## Layer Summary

| Layer | Present |
|---|---|
| Controllers | YES — dual-folder anomaly: `upload/controller/` (singular) AND `upload/controllers/` (plural) both exist (GAP-039) |
| DAL | YES — `upload/dal/` or inline DAL files (insertPost, insertPostMedia, insertPostMentions, updatePostMediaAssetId, postAuthRollback, findActorsByHandles, searchMentionSuggestions) |
| Hooks | YES — useMediaSelection, useUploadSubmit, useMentionAutocomplete, useResolvedActor |
| Screens | YES — UploadScreenModern.jsx (ACTIVE); UploadScreen.jsx (LEGACY — status UNKNOWN, possibly dead code) |

## Known Issues

- **Dual controller anomaly:** `controller/` AND `controllers/` both present — canonical path unclear (GAP-039). This is a HIGH risk write surface boundary violation.
- **Legacy screen:** `UploadScreen.jsx` status unknown — LOKI runtime verification and IRONMAN audit pending.
- **Post-media atomicity gap:** Post row inserted before media upload completes; media failure leaves an orphaned post in `vc.posts`. `postAuthRollback.dal.js` exists but active usage is unclear.
- **R2 worker wildcard CORS:** `apps/WT/cloudflare-worker-upload/worker.js` has `Access-Control-Allow-Origin: *` with no JWT or origin validation — CRITICAL open finding.

## See Also

- [CURRENT_STATUS.md](CURRENT_STATUS.md)
- [SECURITY.md](SECURITY.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [BLOCKERS.md](BLOCKERS.md)
- [DEFERRED.md](DEFERRED.md)
- [OWNERSHIP.md](OWNERSHIP.md)
- [TESTS.md](TESTS.md)
- [PERFORMANCE.md](PERFORMANCE.md)
- [HISTORY_INDEX.md](HISTORY_INDEX.md)
