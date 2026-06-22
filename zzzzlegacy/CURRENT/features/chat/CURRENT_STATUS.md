# Chat Feature — Current Status

**As of:** 2026-05-14 governance sprint
**Ticket:** TICKET-0007A

---

## Command Status Summary

| Command | Status | Key Findings |
|---|---|---|
| SENTRY | COMPLETE | SF-01 OPEN: `canReadConversation` called from View Screen (must move to hook). SF-02 OPEN: `buildInboxPreview` called from 4 Final Screens (must move to hook). SF-06 OPEN: `(R)` convention undocumented. Minor drift: `lib/` and `permissions/` sub-folder taxonomy. RISK-1 fix (canSendMessage sync) VERIFIED. |
| KRAVEN | COMPLETE | KF-01 OPEN: Index coverage for `chat.inbox_entries (actor_id, archived, archived_until_new)` UNVERIFIED — no explicit CREATE INDEX DDL found in local migrations. CARNAGE handoff required to confirm. Polling cadence 30s per session confirmed. |
| LOKI | COMPLETE | LF-02 OPEN: 30s polling × user count flagged for KRAVEN (resolved via KRAVEN). LF-03 OPEN: Dual invalidation cost (poll + mutation invalidation). Silent error swallowing identified — DB failure returns 0 with no production trace. Full execution flow traced and documented. |
| IRONMAN | COMPLETE | All 12 previously undocumented app-layer files assigned owners. Engine DAL (36 files) ownership confirmed. SF-01, SF-02 correction owners assigned as P2. Missing coverage gaps: LOKI, KRAVEN, CARNAGE noted as of audit date (all subsequently completed). |
| CARNAGE | PARTIAL | `chat.inbox_entries` CREATE TABLE DDL pre-dates local migrations (pre-2026-03-31). RLS rewritten 2026-04-30 to multi-actor model. `chat.message_attachments` history in progress. Index existence for badge query UNVERIFIED — CARNAGE must confirm. |
| VENOM | COMPLETE (2026-05-11) | Trust boundary reviewed inline in `vcsm.dal.chat.md`. |
| FALCON | PARTIAL | DRIFT-01: canPost gate missing in native. DRIFT-02: canReadConversation native partial only. WinterSoldier handoff generated. |
| ARCHITECT | COMPLETE (2026-05-11) | DAL selects explicit, no `select('*')`, engine boundary intact. |
| THOR | NOT_STARTED | No release gate report exists for chat. |
| BLACKWIDOW | NOT_STARTED | No adversarial runtime verification report exists. |
| DB | NOT_STARTED | No DB audit report exists. |
| SHIELD | NOT_STARTED | No IP/license review found. |
| WINTERSOLDIER | NOT_STARTED | Handoff generated from FALCON but no completion report. |

---

## Open Findings

| Finding ID | Severity | Description | Status |
|---|---|---|---|
| SF-01 | MODERATE DRIFT | `canReadConversation` called from `ConversationView.jsx` (View Screen) — must move to hook | OPEN |
| SF-02 | MODERATE DRIFT | `buildInboxPreview` called from 4 Final Screens — must move to hook | OPEN |
| SF-06 | MINOR DRIFT | `(R)` convention undocumented in `permissions/` folder | OPEN |
| KF-01 | UNVERIFIED | Index coverage for `chat.inbox_entries` badge query UNVERIFIED | OPEN |
| FALCON DRIFT-01 | MEDIUM | Native (iOS) does not decode `canPost` — no permission parity with app/engine | OPEN |
| FALCON DRIFT-02 | LOW | Native membership read gate only partial vs app `canReadConversation` | OPEN |
