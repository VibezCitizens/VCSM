# Feature Index: notifications

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/notifications`
Source Path: `apps/VCSM/src/features/notifications/` + `engines/@notifications`

## DR. STRANGE Read Order

1. [README.md](../features/notifications/README.md)
2. [CURRENT_STATUS.md](../features/notifications/CURRENT_STATUS.md)
3. [SECURITY.md](../features/notifications/SECURITY.md)
4. ARCHITECTURE.md — MISSING
5. OWNERSHIP.md — MISSING
6. TESTS.md — MISSING
7. [PERFORMANCE.md](../features/notifications/PERFORMANCE.md)
8. BLOCKERS.md — MISSING
9. DEFERRED.md — MISSING
10. [HISTORY_INDEX.md](../features/notifications/HISTORY_INDEX.md)

## Documentation Coverage

| File | Status |
|--------|--------|
| README | YES |
| CURRENT_STATUS | YES |
| SECURITY | YES |
| ARCHITECTURE | MISSING |
| OWNERSHIP | MISSING |
| TESTS | MISSING |
| PERFORMANCE | YES |
| BLOCKERS | MISSING |
| DEFERRED | MISSING |
| HISTORY_INDEX | YES |

Coverage Score: 5 / 10

## Active Risks

- **KF-1 (ELEVATED)** — `publishEvent()` serial delivery loop: 3 awaits × N recipients = O(N × 3 × RTT). For 50 recipients: 152 serial DB ops. Recommended fix: `Promise.allSettled`.
- **Publish ACL gap (MEDIUM)** — No documented rule controlling who can publish notifications. Any caller via `notifications.adapter.js` can publish.
- **RISK-9 (MEDIUM)** — `mapSummaryRowToSender()` in `lib/` instead of `model/` — domain transform misplacement.
- **RISK-6 (LOW)** — Dead code: `useMarkNotificationsRead.js` calls engine directly, bypassing controller. Zero consumers. Pattern must not be replicated.
- **LF-1 (LOW)** — Triple-invalidation on `notificationUnread` key (functionally harmless — React Query deduplicates).
- **LF-2 (LOW)** — 5 undocumented notification schema tables: preferences, delivery_attempts, templates, push_subscriptions, event_types.
- **Dead files (REVIEW_PENDING)** — 6 dead files pending deletion approval (see CURRENT_STATUS).
- **`notificationRuntime.dal.js` at 300-line contract limit** — Any additions will violate the limit. Split required before adding new functions.
- **UI layer ownership (UNASSIGNED)** — `inbox/ui/` views (3 files) and `types/` dispatch (13 files) have no documented owner.
- **Native parity (MISSING)** — No FALCON review; native ownership unassigned per IRONMAN.

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- 6 dead files pending deletion approval (SENTRY REVIEW_PENDING).
- CARNAGE and DB NOT STARTED — RLS ownership for notification.* tables undocumented.
- THOR NOT STARTED — no release gate.

## Deferred Items

DEFERRED.md — MISSING. Pending from CURRENT_STATUS:
- KF-1 serial publish loop fix (requires code change to `publishEvent()`).
- Publish ACL documentation and enforcement decision.
- `notificationRuntime.dal.js` split (before next function addition).

## Latest Ticket

Not found in CURRENT docs.

## Audit Coverage

| Command | Status |
|---------|--------|
| VENOM | COMPLETE — 2026-05-19 (RISK-6 OPEN) |
| LOKI | COMPLETE — 2026-05-19 (LF-1, LF-2 OPEN) |
| IRONMAN | COMPLETE — 2026-05-19 (ownership PARTIAL) |
| KRAVEN | COMPLETE — 2026-05-19 (KF-1 OPEN) |
| SENTRY | REVIEW_PENDING — 2026-05-19 (6 dead files, RISK-9 OPEN) |
| CEREBRO | COMPLETE — 2026-05-19 (triggered audit passes) |
| THOR | NOT RUN |
| BLACKWIDOW | NOT RUN |
| CARNAGE | NOT RUN |
| DB | NOT RUN |
| FALCON | MISSING |
| ARCHITECT | NOT RUN |

## Related Output Files

- `features/notifications/SECURITY.md`
- `features/notifications/PERFORMANCE.md`
- `features/notifications/HISTORY_INDEX.md`
- `features/notifications/vcsm.bottom-nav.notifications.architecture.md`
- `features/notifications/post-notification-flow.md`
- `features/notifications/sentry_notifications-dal_2026-05-19.md`
- `features/notifications/venom_notifications-dal_2026-05-19.md`

## Recommended Next Command

CARNAGE — RLS ownership for `notification.*` tables (5 undocumented tables per LF-2). Follow with DB audit. Then resolve KF-1 (serial publish loop) as a code fix sprint.

## Recommended Next Ticket

Open ticket for: (1) delete 6 dead files (SENTRY approval required), (2) CARNAGE RLS ownership for notification.* tables, (3) `publishEvent()` parallel delivery fix (KF-1 — P2 performance).
