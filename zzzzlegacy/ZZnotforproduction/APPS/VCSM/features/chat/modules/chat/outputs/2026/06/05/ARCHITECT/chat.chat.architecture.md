# ARCHITECT — chat / modules / chat

**Date:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-DASHBOARD-0001
**Scanner Version:** 1.1.0
**Architecture State:** SOURCE_VERIFIED

---

## MODULE ARCHITECTURE REPORT

Module: chat (root)
Application Scope: VCSM
Module Type: chat feature root — DI configuration + entry + UI store
Primary Root: apps/VCSM/src/features/chat/ (root-level files only)
Independence Status: FULLY INDEPENDENT
Completeness Status: COMPLETE

---

## CORRECTION — Source Path Discrepancy

The STUB ARCHITECTURE.md and INDEX.md recorded the source path as
`apps/VCSM/src/features/chat/chat/` — **this directory does not exist.**

The "chat" governance module corresponds to the chat feature root-level files:
- `apps/VCSM/src/features/chat/index.js`
- `apps/VCSM/src/features/chat/setup.js`
- `apps/VCSM/src/features/chat/store/chatUiStore.js`
- `apps/VCSM/src/features/chat/adapters/chat.adapter.js`
- `apps/VCSM/src/features/chat/styles/chat-modern.css`

Sub-directories (inbox, conversation, start, debug) are separate governance modules.

---

## PURPOSE

[SOURCE_VERIFIED] The chat feature root serves three distinct functions:

1. **Engine DI setup** (`setup.js`) — Wires VCSM-specific dependencies into the shared
   `@chat` engine via `configureChatEngine()`. Called once at startup from `main.jsx`.
2. **Feature entry barrel** (`index.js`) — Exports InboxScreen and ConversationScreen
   as the two navigable screens of the chat feature. Imports `chat-modern.css`.
3. **Client UI state** (`store/chatUiStore.js`) — Zustand store for ephemeral UI state
   (selected conversation, new chat modal open flag, composer drafts, active filter).
   Server data (inbox entries, messages, members) lives in React Query — never here.

---

## LAYER MAP

| File | Layer | Purpose |
|---|---|---|
| index.js | Entry barrel | Exports 2 screens: InboxScreen, ConversationScreen |
| setup.js | DI configuration | Wires VCSM DI into @chat engine; _configured guard |
| store/chatUiStore.js | Client UI state | Zustand: 4 state fields, 5 actions |
| adapters/chat.adapter.js | Adapter boundary | Exports useChatUnreadOps only |
| styles/chat-modern.css | CSS | Modern chat theme styles |

---

## ENTRY POINTS

| Export | Source | Consumers |
|---|---|---|
| InboxScreen | inbox/screens/InboxScreen.jsx | Main app router |
| ConversationScreen | conversation/screen/ConversationScreen.jsx | Main app router |
| setupVcsmChatEngine() | setup.js | apps/VCSM/src/main.jsx (startup, once) |
| useChatUnreadOps | adapters/chat.adapter.js | External feature consumers |
| useChatUiStore | store/chatUiStore.js | inbox/conversation/start modules |

---

## DI SURFACE MAP — setup.js

`setupVcsmChatEngine()` injects 9 dependencies into `@chat` engine:

| DI Key | Implementation | DB Access |
|---|---|---|
| supabaseClient | `@/services/supabase/supabaseClient` | N/A — the client itself |
| getActorSummariesByIds | wraps `hydrateAndReturnSummaries(@hydration)` | Via hydration engine (RPC) |
| resolveRealm | `@/shared/utils/resolveRealm` | None — pure function |
| defaultActorSource | `'vc'` literal | None |
| searchActors | Inline function → `identity.search_actor_directory` RPC | identity schema, READ |
| resolveActorRealmContext | Inline function → `vc.actors` SELECT | vc schema, READ |
| checkBlockRelation | Inline function → `moderation.blocks` SELECT | moderation schema, READ |
| normalizeHandleTerm | `@/services/supabase/postgrestSafe` | None |
| toContainsPattern | `@/services/supabase/postgrestSafe` | None |
| isUuid | `@/services/supabase/postgrestSafe` | None |

**_configured guard:** Present. `if (_configured) return` at top of `setupVcsmChatEngine()`.
Prevents double-initialization.

---

## DB ACCESS MAP (from setup.js DI adapters)

| Function | Schema | Table/RPC | Op | Columns |
|---|---|---|---|---|
| searchActors | identity | search_actor_directory | RPC | p_viewer_domain, p_viewer_actor_id, p_query, p_filter, p_limit, p_offset |
| resolveActorRealmContext | vc | actors | SELECT | id, is_void |
| checkBlockRelation | moderation | blocks | SELECT | blocker_actor_id, blocked_actor_id |

All 3 are READ-ONLY. No writes from setup.js.

`searchActors` result shape mapped to engine's DirectorySearchResultModel:
`{ actor_id, display_name, username, photo_url (← avatar_url), kind (← actor_kind) }`

`checkBlockRelation` uses bidirectional OR pattern:
```
.or(`and(blocker_actor_id.eq.${actorA},blocked_actor_id.eq.${actorB}),
     and(blocker_actor_id.eq.${actorB},blocked_actor_id.eq.${actorA})`)
```
Fails closed: any error returns `false`.

---

## CLIENT UI STORE — chatUiStore.js

| Field | Type | Purpose |
|---|---|---|
| selectedConversationId | string \| null | Active conversation |
| isNewChatModalOpen | boolean | Controls StartConversationModal visibility |
| composerDraftByConversationId | object (map) | Per-conversation draft text |
| activeChatFilter | string | Active inbox filter (default: 'all') |

Actions: setSelectedConversationId, setIsNewChatModalOpen, setComposerDraft, clearComposerDraft, setActiveChatFilter

**Scope:** Client UI state only. No server data. No persistence.

---

## ADAPTER BOUNDARY

`adapters/chat.adapter.js` exports:
- `useChatUnreadOps` (re-export from inbox/hooks/useChatUnreadOps)

**Note:** Only 1 hook exported. This is a thin adapter boundary. Consumers of unread badge ops
use this adapter instead of importing directly from inbox hooks.

---

## CALL GRAPH

```
main.jsx
  └── setupVcsmChatEngine() [ONCE at startup]
        └── configureChatEngine(@chat)
              ├── searchActors → identity.search_actor_directory RPC
              ├── resolveActorRealmContext → vc.actors SELECT
              └── checkBlockRelation → moderation.blocks SELECT

App router
  └── index.js exports
        ├── InboxScreen → chat/inbox/screens/InboxScreen.jsx
        └── ConversationScreen → chat/conversation/screen/ConversationScreen.jsx

useChatUiStore (Zustand)
  ├── chat/inbox (isNewChatModalOpen, activeChatFilter)
  ├── chat/start (isNewChatModalOpen)
  └── chat/conversation (composerDraft)
```

---

## ARCHITECTURE ANOMALIES

| ID | Severity | Summary | Evidence |
|---|---|---|---|
| ANOM-CHAT-ROOT-001 | INFO | chat.adapter.js exports only 1 hook — thin adapter surface | [SOURCE_VERIFIED] adapters/chat.adapter.js line 1 |
| ANOM-CHAT-ROOT-002 | INFO | resolveActorRealmContext reads vc.actors inline (no DAL layer) — intentional DI bridge pattern | [SOURCE_VERIFIED] setup.js lines 77-91 |

Both anomalies are INFO — not violations. ANOM-CHAT-ROOT-002 is a DI adapter function
designed to bridge app-level DB access into the engine's dependency. The no-DAL pattern
is intentional in DI setup files across the codebase (see booking, reviews setup files).

---

## INDEPENDENCE CLASSIFICATION

**FULLY INDEPENDENT**

- setup.js: imports @chat engine (DI target), @hydration (getActorSummariesByIds), and
  shared utilities. No cross-feature imports beyond adapter boundaries.
- chatUiStore.js: zero imports from other features
- index.js: barrel exports only; imports from inbox/ and conversation/ (sibling modules)
- adapters/chat.adapter.js: re-exports from inbox hooks (sibling module)

---

## COMPLETENESS CLASSIFICATION

**COMPLETE**

All 5 root-level files traced. No unresolved references.

---

## HANDOFF RECOMMENDATIONS

| Command | Reason | Priority |
|---|---|---|
| VENOM | searchActors viewer_actor_id injection from Zustand store — session boundary check | P2 |
| ELEKTRA | checkBlockRelation bidirectional OR pattern — injection risk | P2 |
| SPIDER-MAN | Zero tests for setup DI; chatUiStore is untested | P3 |
