# ARCHITECTURE — engines/chat

**Last ARCHITECT Run:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001
**Status:** COMPLETE — anomalies found
**Independence:** PARTIALLY INDEPENDENT

---

## Engine Purpose

Shared domain engine for real-time messaging. Owns conversation lifecycle, message send/edit/delete, inbox projection, typing state, reactions, attachments, pins, saved messages, moderation, and outbox event publishing. Framework-agnostic by design — cross-app concerns delegated via 10 DI injection points.

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/chat/`

## Public API Alias

`@chat` — consumed by VCSM app only (no Wentrex consumer confirmed).

## DI Configuration

`apps/VCSM/src/features/chat/setup.js` wires 10 injection points:
- `supabaseClient` — chat schema queries
- `getActorSummariesByIds` — → @hydration engine
- `resolveRealm` — VCSM realm resolution
- `searchActors` — identity.search_actor_directory RPC
- `resolveActorRealmContext` — vc.actors is_void lookup
- `checkBlockRelation` — moderation.blocks lookup (fails CLOSED if absent)
- `normalizeHandleTerm`, `toContainsPattern`, `isUuid` — string utilities
- `defaultActorSource: 'vc'`

## Layer Structure

```
config.js       — DI (10 points, no freeze guard)
events.js       — event bus (Set-per-event Map) + 16 EVENTS
types/index.js  — JSDoc typedefs
dal/            — 31 DAL files, chat schema exclusively + 3 RPCs + 2 Realtime subscriptions
model/          — 13 files + constants + permissions
services/       — 10 services
hooks/          — 9 React hooks (ANOMALY: scope boundary violation — see ANOM-CHAT-001)
controller/     — 21 controllers
rules/          — 2 rule files
utils/          — 4 utilities
adapters/       — public surface (90+ exported symbols)
```

## DB Access

chat schema exclusively inside engine. Cross-schema queries (vc.actors, moderation.blocks, identity.search_actor_directory) are delegated to DI injectors in VCSM setup.js.

| Table | Access |
|-------|--------|
| chat.conversations | READ/WRITE |
| chat.conversation_members | READ/WRITE |
| chat.messages + message_attachments | READ/WRITE |
| chat.message_receipts | WRITE |
| chat.inbox_entries | READ/WRITE |
| chat.moderation_actions | WRITE |
| chat.message_reactions | WRITE |
| chat.typing_states | READ/WRITE |
| chat.saved_messages | WRITE |
| chat.conversation_pins | WRITE |
| chat.outbox_events | READ/WRITE |
| chat.audit_log | WRITE (via RPC only) |
| chat.legacy_mappings | READ/WRITE |
| chat.message_visibility | READ |
| chat.conversation_keys | UNRESOLVED — in CLAUDE.md, no DAL |
| chat.participant_snapshots | UNRESOLVED — in CLAUDE.md, no DAL |

## Critical Atomic Operations

| RPC | Guarantees |
|-----|-----------|
| send_message_atomic | 6 operations: message + attachments + conv update + inbox fan-out + audit_log + outbox event |
| get_or_create_direct_conversation | Atomic create-or-return |
| open_conversation | Membership + inbox state atomically |

## Architecture Anomalies

| ID | Anomaly | Severity |
|----|---------|----------|
| ANOM-CHAT-001 | 9 React hooks in engine (CLAUDE.md: "DO NOT implement UI logic") | HIGH |
| ANOM-CHAT-002 | `note` file at engine root — planning doc in production code | MEDIUM |
| ANOM-CHAT-003 | conversation_keys + participant_snapshots tables in CLAUDE.md but no DAL | MEDIUM |
| ANOM-CHAT-004 | No DI freeze guard | MEDIUM |
| ANOM-CHAT-005 | console.warn in blockRelations DAL (no-console rule violation) | LOW |

## Known Gaps

- BEHAVIOR.md: MISSING — Blue Team blocked
- SECURITY.md: MISSING — VENOM/ELEKTRA blocked
- Zero tests — no test files in engine
- `note` planning file at engine root must be removed
- React hooks scope boundary violation (ANOM-CHAT-001) — pending governance decision

## Full Report

`ZZnotforproduction/ENGINES/chat/outputs/2026/06/05/ARCHITECT/engine.chat.architecture.md`
