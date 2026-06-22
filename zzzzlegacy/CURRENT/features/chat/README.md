# Feature: chat

**Status:** ACTIVE
**Security Tier:** HIGH
**Source:** `apps/VCSM/src/features/chat/` + `engines/chat/`
**Last audit sprint:** 2026-05-14

## What This Feature Does

The chat feature manages real-time messaging between Citizens and VPORTs, including inbox badge polling, conversation access enforcement, attachment media write-back, and a shared engine (engines/chat) that owns the canonical DAL, hooks, and permission rules. The app layer owns badge read, attachment write-back, and UI screens; the engine owns all conversation state, send, and guard logic.

## Governance Coverage

| Command | Status | Date | Report |
|---|---|---|---|
| SENTRY | COMPLETE — open findings SF-01, SF-02, SF-06 | 2026-05-14 | `CURRENT/features/dashboard/evidence/2026-05-14_sentry_chat-dal-lib-permissions.md` |
| KRAVEN | COMPLETE — open finding KF-01 (index unverified) | 2026-05-14 | `_ACTIVE/audits/performance/2026-05-14_kraven_chat-badge-poll-performance.md` |
| LOKI | COMPLETE — open finding LF-02, LF-03 | 2026-05-14 | `CURRENT/features/dashboard/evidence/2026-05-14_loki_chat-badge-bootstrap-trace.md` |
| IRONMAN | COMPLETE | 2026-05-14 | `CURRENT/features/dashboard/evidence/2026-05-14_ironman_chat-feature-ownership.md` |
| CARNAGE | PARTIAL — migration history for inbox_entries and message_attachments | 2026-05-14 | `_ACTIVE/audits/migrations/2026-05-14_carnage_chat-inbox-attachments-migration-history.md` |
| VENOM | COMPLETE (inline, prior sprint) | 2026-05-11 | Referenced in `vcsm.dal.chat.md` |
| FALCON | PARTIAL — DRIFT-01, DRIFT-02 assigned; WinterSoldier handoff generated | 2026-05-14 | `falcon_chat_dal_parity_2026-05-14.md` |
| ARCHITECT | COMPLETE (prior sprint) | 2026-05-11 | Inline in `vcsm.dal.chat.md` |
| THOR | NOT_STARTED | — | No release report found |
| BLACKWIDOW | NOT_STARTED | — | No report found |
| SHIELD | NOT_STARTED | — | No report found |
| DB | NOT_STARTED | — | No report found |
| WINTERSOLDIER | NOT_STARTED | — | No report found |
