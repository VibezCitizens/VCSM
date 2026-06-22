# Session Summary: Chat Engine Stabilization

**Date:** 2026-03-31
**Focus:** Debug and stabilize shared chat engine against real database schema

---

## What was worked on

- Diagnosed and fixed HTTP 400 on Wentrex `/messages` inbox load — traced from browser error to exact DAL query construction
- Removed `actor:actor_presentation(...)` embed from two DAL files (view doesn't exist in `chat` schema)
- Removed all `actor_source` / `sender_actor_source` / `created_by_actor_source` column references from 15 DAL files (columns were never added to real database)
- Fixed FK hint mismatch (`inbox_entries_last_message_id_fkey` → `chat_inbox_entries_last_message_fk`)
- Ran full chat engine architecture audit (38 DAL files, all models, services, controllers)
- Fixed all 3 confirmed P0 blockers: `is_group`/`is_active` writes, `vc_get_or_create_one_to_one` RPC, `increment_inbox_unread` missing schema
- Completed stabilization pass: replaced 3 non-existent RPCs with direct DAL queries, deleted dead `reports.write.dal.js`, added `dedupe_key` uniqueness migration
- Built 5 global project contracts (Senior Developer, Security, Anti-Hallucination, Strategic Debrief, Real-World Ops)

## Decisions made

- **actor_source columns removed from all code** — the Phase 2 migration was never applied to the database. Code must match real schema, not planned schema. Columns can be re-added when migration is actually run.
- **`vc_get_or_create_one_to_one` RPC replaced** with standard DAL calls using `dedupe_key` on `chat.conversations` for idempotent direct-conversation creation. No VC dependency.
- **3 non-existent RPCs replaced** (`increment_inbox_unread`, `open_conversation`, `next_message_seq`) — all replaced with direct SELECT/UPDATE queries against real tables.
- **`chat.reports` table confirmed non-existent** — DAL deleted, controller updated to remove dead import.
- **Model drift classified as harmless** — models read non-existent columns but get `undefined`/`null` via `??` fallbacks. DAL queries don't SELECT those columns so no query breaks.

## Files changed

**engines/chat/src/dal/ (15+ files modified, 1 deleted):**
- `inbox.read.dal.js` — removed actor_source, actor_presentation embed, fixed FK hint
- `conversationMembers.read.dal.js` — removed actor_source, actor_presentation embed
- `conversationMembers.partner.read.dal.js` — removed actor_source
- `conversationMembership.read.dal.js` — removed actor_source
- `conversationMembership.write.dal.js` — removed actor_source from inserts
- `conversations.write.dal.js` — removed is_group, is_active, created_by_actor_source
- `messages.write.dal.js` — removed sender_actor_source, replaced next_message_seq RPC
- `messages.timeline.read.dal.js` — removed sender_actor_source
- `messageForEdit.read.dal.js` — removed sender_actor_source
- `editMessage.write.dal.js` — removed sender_actor_source
- `messageReceipts.write.dal.js` — removed actor_source
- `moderationActions.write.dal.js` — removed actor_source
- `inbox.write.dal.js` — removed actor_source, replaced increment_inbox_unread RPC
- `inbox.entry.read.dal.js` — removed actor_source
- `inbox_entries.write.dal.js` — removed actor_source
- `openConversation.rpc.js` — removed open_conversation RPC, removed actor_source
- `getOrCreateDirectConversation.rpc.js` — full rewrite: dedupe_key based, no VC RPC
- `reports.write.dal.js` — **DELETED** (table doesn't exist)

**engines/chat/src/controller/:**
- `markConversationSpam.controller.js` — removed dead createReportDAL import/call

**engines/chat/docs/:**
- `CHAT_ENGINE_AUDIT.md` — full architecture audit document

**apps/wentrex/supabase/migrations/:**
- `20260331060000_chat_dedupe_key_unique.sql` — partial unique index on dedupe_key

**Project root contracts (new files):**
- `SENIOR_DEVELOPER_CONTRACT.md`
- `SECURITY_ENGINEERING_CONTRACT.md`
- `ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md`
- `STRATEGIC_REALITY_DEBRIEF_CONTRACT.md`
- `REAL_WORLD_ENGINEERING_OPS_CONTRACT.md`
- `CLAUDE.md` — updated with pointers to all contracts
- `.claude/commands/listofcomand` — quick reference for all contracts

## Problems solved

- **Root cause of inbox 400:** DAL embedded `actor:actor_presentation(...)` — a VC-schema view that doesn't exist in `chat` schema. Removed.
- **Root cause of continued 400 after first fix:** `actor_source` columns in SELECT projections don't exist in real database. Removed from all 15 DAL files.
- **Direct conversation creation broken:** `vc_get_or_create_one_to_one` RPC is VC-specific. Replaced with dedupe_key-based idempotent creation using standard DAL calls.
- **3 missing RPCs:** `increment_inbox_unread`, `open_conversation`, `next_message_seq` don't exist in chat schema. All replaced with direct queries.
- **Dead table reference:** `chat.reports` doesn't exist. DAL deleted, controller cleaned.

## Open items

- **Model drift (P1):** 4 models still read non-existent columns (`is_stealth`, `is_announcement`, `created_by_actor_source`, `sender_actor_source`, `actor_source`). Harmless but misleading — should be cleaned up.
- **VC-coupled DAL files (P2):** `searchActors.dal.js`, `actorRealm.read.dal.js`, `blockRelations.read.dal.js` still query `vc` schema directly. Should be made injectable.
- **Channel name prefixes (P2):** Realtime channels still use `vc-inbox-`, `vc-conversation-`, `vc-typing-` prefixes.
- **dedupe_key migration:** Written but not applied to database. Needs to be run for direct conversation idempotency to be race-safe.
- **actorSource plumbing in services/controllers:** 12+ files still accept/pass actorSource parameters that go nowhere. Misleading but not broken.
- **Wentrex dead code (from architecture review):** 12 confirmed dead files in learning/ (duplicate routes, models, DALs). 26 controllers with broken import paths.

## Context for next session

The chat engine is now stabilized against the real `chat.*` schema. All DAL queries match actual table columns — no phantom columns, no missing RPCs, no VC-specific dependencies in the critical path. The inbox should load, conversations should open, and messages should send. The main remaining work is P1 model cleanup (harmless drift) and P2 VC-coupling extraction (searchActors, blockRelations, actorRealm). The `dedupe_key` unique index migration needs to be applied to the database for direct conversation creation to be race-safe.
