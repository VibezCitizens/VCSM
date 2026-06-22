# Feature Index: chat

## Location

CURRENT Folder: `zNOTFORPRODUCTION/CURRENT/features/chat`
Source Path: `apps/VCSM/src/features/chat/` + `engines/chat/`

## DR. STRANGE Read Order

1. [README.md](../features/chat/README.md)
2. [CURRENT_STATUS.md](../features/chat/CURRENT_STATUS.md)
3. SECURITY.md — MISSING ⚠️ CRITICAL GAP
4. ARCHITECTURE.md — MISSING
5. [OWNERSHIP.md](../features/chat/OWNERSHIP.md)
6. TESTS.md — MISSING
7. [PERFORMANCE.md](../features/chat/PERFORMANCE.md)
8. BLOCKERS.md — MISSING
9. DEFERRED.md — MISSING
10. [HISTORY_INDEX.md](../features/chat/HISTORY_INDEX.md)

## Documentation Coverage

| File | Status |
|--------|--------|
| README | YES |
| CURRENT_STATUS | YES |
| SECURITY | MISSING |
| ARCHITECTURE | MISSING |
| OWNERSHIP | YES |
| TESTS | MISSING |
| PERFORMANCE | YES |
| BLOCKERS | MISSING |
| DEFERRED | MISSING |
| HISTORY_INDEX | YES |

Coverage Score: 5 / 10

## Active Risks

- **SECURITY.md MISSING (P1 GAP)** — No formal security posture documented for a real-time messaging engine classified as HIGH security tier.
- **SF-01 (MODERATE DRIFT)** — `canReadConversation` called from `ConversationView.jsx` (View Screen) — must move to hook layer.
- **SF-02 (MODERATE DRIFT)** — `buildInboxPreview` called from 4 Final Screens — must move to hook layer.
- **SF-06 (MINOR DRIFT)** — `(R)` convention undocumented in `permissions/` folder.
- **KF-01 (UNVERIFIED)** — Index coverage for `chat.inbox_entries` badge query unverified. No explicit CREATE INDEX DDL found. CARNAGE handoff required.
- **FALCON DRIFT-01 (MEDIUM)** — Native iOS does not decode `canPost` gate — no permission parity with app/engine.
- **FALCON DRIFT-02 (LOW)** — Native membership read gate only partial vs app `canReadConversation`.
- **LF-03 (MODERATE)** — Dual invalidation cost (poll + mutation invalidation).
- **Silent error swallowing** — DB failure returns 0 with no production trace.
- **CARNAGE PARTIAL** — `chat.inbox_entries` CREATE TABLE DDL pre-dates local migrations. Index existence UNVERIFIED.

## Open Blockers

BLOCKERS.md — MISSING. Blockers inferred from CURRENT_STATUS:
- KF-01 — Index existence for badge query requires CARNAGE confirmation.
- FALCON DRIFT-01 — canPost native gate missing; WinterSoldier handoff not completed.
- THOR — NOT STARTED; no release gate report exists.

## Deferred Items

DEFERRED.md — MISSING. No formal deferred registry.

## Latest Ticket

TICKET-0007A

## Audit Coverage

| Command | Status |
|---------|--------|
| VENOM | COMPLETE — 2026-05-11 (inline, prior sprint) |
| SENTRY | COMPLETE — 2026-05-14 (SF-01, SF-02, SF-06 OPEN) |
| KRAVEN | COMPLETE — 2026-05-14 (KF-01 OPEN) |
| LOKI | COMPLETE — 2026-05-14 (LF-02, LF-03 OPEN) |
| IRONMAN | COMPLETE — 2026-05-14 |
| CARNAGE | PARTIAL — migration history for inbox_entries and message_attachments |
| ARCHITECT | COMPLETE — 2026-05-11 (inline) |
| FALCON | PARTIAL — DRIFT-01, DRIFT-02 assigned; WinterSoldier handoff generated |
| THOR | NOT RUN |
| BLACKWIDOW | NOT RUN |
| WINTERSOLDIER | NOT RUN (handoff exists, not completed) |
| DB | NOT RUN |
| SHIELD | NOT RUN |

## Related Output Files

- `features/chat/OWNERSHIP.md`
- `features/chat/PERFORMANCE.md`
- `features/chat/HISTORY_INDEX.md`
- `features/chat/vcsm.chat.architecture.md`
- `features/chat/vcsm.chat.notification-pipeline.md`
- `features/chat/2026-05-14_sentry_chat-dal-lib-permissions.md`
- `features/chat/2026-05-14_kraven_chat-badge-poll-performance.md`

## Recommended Next Command

CARNAGE — confirm `chat.inbox_entries` index existence (KF-01). Then THOR for release gate. SECURITY.md must be created (VENOM pass complete exists from 2026-05-11 inline; extract findings to SECURITY.md).

## Recommended Next Ticket

Open ticket to: (1) create SECURITY.md from existing 2026-05-11 VENOM inline findings, (2) resolve SF-01/SF-02 (move gate calls to hook layer), (3) CARNAGE index verification for badge query.
