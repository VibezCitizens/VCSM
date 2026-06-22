# Booking — Findings Log

## Resolved Findings

| ID | Severity | Finding | Resolution | Date |
|---|---|---|---|---|
| V-BOOK-01 | CRITICAL | Raw UUID in booking QR public URL | Replaced with opaque token | 2026-05-26 |
| V-BOOK-02 | HIGH | Missing actor ownership gate on cancel path | `assertActorCanManageResource` added | 2026-05-26 |
| RC-01 through RC-06 | P0 | Six P0 release-blocking security issues | All resolved | 2026-05-14 |

| LOKI-DASH-007 | LOW (performance) | `createBooking` locationId mode called `dalListVportResourcesByLocationId` then `dalGetVportResourceById` for the same record — redundant second read. | Fixed: selected resource row cached from list result; `dalGetVportResourceById` skipped when locationId was used. | 2026-05-28 |
| LOKI-DASH-010 | LOW (reliability) | Both notification dispatch blocks in `createBooking` used fire-and-forget `getNotifyFn()?.({...})` without `await` or `try/catch` — unhandled rejections could surface as booking errors. | Fixed: both blocks now `await getNotifyFn()?.({...})` inside `try/catch`; notification failures are swallowed and cannot abort a completed booking. | 2026-05-28 |

## Deferred / Open Findings

| ID | Severity | Finding | Deferred To | Reference |
|---|---|---|---|---|
| DEFER-001 | P1 | `bookings_insert_owner` legacy RLS policy | CARNAGE Migration Sprint | `deferred-open-items.md` |
| K-BOOK-01 | P2 | 5-op serial chain in owner availability mutation (~310ms) | Cache optimization | — |
| DEFER-003 | P3-C | BookingQrLinksPanel adapter not built | Booking Adapter Sprint | `deferred-open-items.md` |
