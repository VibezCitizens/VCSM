# Chat Feature — Ownership

**Source:** `2026-05-14_ironman_chat-feature-ownership.md`
**Canonical ownership file:** `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.chat.owner.md`

---

## Responsibility Classification

| Responsibility Type | Owner | Confidence |
|---|---|---|
| Feature ownership (app layer) | `features/chat/` | HIGH |
| Engine ownership | `engines/chat/` | HIGH |
| DAL ownership (app-level) | `features/chat` | HIGH — 2 files: badge read + attachment write-back |
| DAL ownership (engine) | `engines/chat` | HIGH — 36 files confirmed |
| Controller ownership | `features/chat` | HIGH — chatUnread, recordChatAttachment |
| UI ownership | `features/chat` | HIGH |
| Runtime ownership (badge pipeline) | Bootstrap + chat | MEDIUM — Bootstrap owns scheduler; chat adapter owns data |
| Data ownership (`chat.inbox_entries`) | `engines/chat` (primary), `features/chat` (badge read) | HIGH |
| Data ownership (`chat.message_attachments`) | `engines/chat` (create), `features/chat` (media_asset write-back) | HIGH |
| Data ownership (`platform.media_assets`) | `features/chat` (via controller) | MEDIUM — cross-schema write |
| Rule ownership (canSendMessage) | `engines/chat` | HIGH — engine enforces; app copy is dead |
| Rule ownership (canReadConversation) | `features/chat` | MEDIUM — app-only, called from wrong layer (SF-01 pending) |
| Documentation ownership | Logan/chat DAL doc | HIGH — `vcsm.dal.chat.md` |
| Native parity ownership | Falcon (iOS) | HIGH — DRIFT-01, DRIFT-02 assigned; WinterSoldier handoff generated |
| LOKI runtime ownership | COMPLETED 2026-05-14 | — |
| KRAVEN performance ownership | COMPLETED 2026-05-14 | — |
| CARNAGE migration ownership | PARTIAL 2026-05-14 | — |
| Security ownership | VENOM (completed 2026-05-11) | HIGH |

---

## Ownership Boundary Risks

| Area | Risk | Status |
|---|---|---|
| `canSendMessage` app copy | LOW — dead code, no importers | OPEN (P2: delete or wire) |
| `buildInboxPreview` in 4 Final Screens | MEDIUM — domain transform in Final Screen (SF-02) | OPEN (P2 correction) |
| `canReadConversation` in View Screen | MEDIUM — permission in wrong layer (SF-01) | OPEN (P2 correction) |
| `bootstrap.selectors.js` badge path | LOW — ownership split documented and intentional | NONE |
| `(R)` convention undocumented | LOW — SF-06 | OPEN |

---

## Data Ownership Registry

| Object | Primary Owner | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|
| `chat.inbox_entries` | `engines/chat` | `engines/chat` (full), `send_message_atomic` RPC | DB/Supabase | Carnage | Logan (`vcsm.dal.chat.md`) |
| `chat.message_attachments` | `engines/chat` | `engines/chat` (create), `features/chat` (media_asset_id update) | DB/Supabase | Carnage | Logan (`vcsm.dal.chat.md`) |
| `chat.messages` | `engines/chat` | `engines/chat` via `send_message_atomic` RPC | DB/Supabase | Carnage | Logan |
| `chat.conversations` | `engines/chat` | `engines/chat` | DB/Supabase | Carnage | Logan |
| `chat.conversation_members` | `engines/chat` | `engines/chat` | DB/Supabase | Carnage | Logan |
| `platform.media_assets` | `features/media` (primary) | `features/chat` (via `recordChatAttachment.controller.js`) | DB/Supabase | Carnage | Logan |
