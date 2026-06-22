# Plans — Index

> **Concern:** Project state documents — migration records, not enforcement contracts
> **Note:** Files in this folder are historical records and current project state. They contain no rules to enforce.
> Source files remain at CONTRACTS/ root, untouched.

---

## Contents

| File | Source | Status | Description |
|---|---|---|---|
| [01-chat-migration.md](01-chat-migration.md) | [CHAT_MIGRATION_PLAN.md](../CHAT_MIGRATION_PLAN.md) | See document | Shared chat migration phases, current state, future extraction boundaries |

---

## CHAT_MIGRATION_PLAN.md — Status Summary

| Phase | Status |
|---|---|
| Phase 1 — Wentrex on engine (chat.* schema) | **COMPLETE** |
| Phase 2 — Explicit actor_source columns | **COMPLETE** |
| Phase 3 — Freeze Wentrex on shared model | **COMPLETE** |
| Phase 4 — VC migration | **NOT STARTED** |

---

## Architecture Decisions Embedded in This Plan

> **Warning:** The following 4 architectural decisions currently live only in this plan document. They should be extracted to a dedicated `engines/chat/ARCHITECTURE.md` when that contract is authored.

| Decision | Location |
|---|---|
| Chat engine owns all chat schema | [01-chat-migration.md §Non-Negotiables](01-chat-migration.md) |
| No shared message tables across tenants | [01-chat-migration.md §Non-Negotiables](01-chat-migration.md) |
| No multi-tenant message tables | [01-chat-migration.md §Non-Negotiables](01-chat-migration.md) |
| Outbox + realtime are future extraction boundaries | [01-chat-migration.md §Future Extraction Boundaries](01-chat-migration.md) |
