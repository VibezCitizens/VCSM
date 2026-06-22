---
title: chat — Ownership Record
status: ACTIVE
owner: IRONMAN
last-updated: 2026-06-05
source: IRONMAN run — 2026-06-05 (TICKET-ARCHITECT-DASHBOARD-0001)
ownership-clarity: PARTIAL
---

# chat (Vox) — Ownership Record

**Feature:** chat (Vox — VCSM direct and group messaging)
**Application:** VCSM + ENGINE
**IRONMAN Run Date:** 2026-06-05
**Ownership Clarity:** PARTIAL
**Ticket:** TICKET-ARCHITECT-DASHBOARD-0001

---

## 1. Purpose

The chat feature implements VCSM's real-time direct and group messaging system, branded as "Vox." It provides an inbox listing all conversations per actor, a full conversation thread view, attachment upload with media asset writeback, and inbox management actions (archive, delete, mark spam, mark read, folder organization).

The feature layer is intentionally thin: it owns VCSM-specific adapter wiring, inbox UI state, attachment media writeback, and all screens/components. All heavy conversation and message logic is delegated to the shared `@chat` engine via dependency injection.

---

## 2. Application Scope

VCSM + ENGINE

Primary code: `apps/VCSM/src/features/chat/`
Engine dependency: `engines/chat/` — NOT owned by this feature; @chat engine is authoritative for all DB reads, realtime subscriptions, and message/conversation writes.

---

## 3. Code Roots

Primary root: `apps/VCSM/src/features/chat/`

Entry files:
- `apps/VCSM/src/features/chat/index.js` — screen barrel; exports InboxScreen, ConversationScreen
- `apps/VCSM/src/features/chat/setup.js` — engine DI; wires VCSM dependencies into @chat via configureChatEngine(); _configured guard prevents double-init
- `apps/VCSM/src/features/chat/store/chatUiStore.js` — Zustand; ephemeral UI state only
- `apps/VCSM/src/features/chat/adapters/chat.adapter.js` — public adapter surface; exports useChatUnreadOps

Module sub-roots and ownership:

| Module | Source Root | Role | Independence |
|---|---|---|---|
| chat/modules/chat | apps/VCSM/src/features/chat/ (root) | DI wiring + entry barrel + UI state | FULLY INDEPENDENT |
| chat/modules/start | apps/VCSM/src/features/chat/start/ | New conversation initiation (StartConversationModal) | MOSTLY INDEPENDENT |
| chat/modules/debug | apps/VCSM/src/features/chat/debug/ | Runtime observability utilities | FULLY INDEPENDENT |
| chat/modules/inbox | apps/VCSM/src/features/chat/inbox/ | Inbox list and management | (outside TICKET-ARCHITECT-DASHBOARD-0001 scope) |
| chat/modules/conversation | apps/VCSM/src/features/chat/conversation/ | Conversation thread view | (outside TICKET-ARCHITECT-DASHBOARD-0001 scope) |

NOT owned by this feature:
- `engines/chat/` — @chat engine; owns chat schema DB reads, realtime, message/conversation writes

---

## 4. Core Layers

DAL (2):
- `updateAttachmentMediaAsset.write.dal.js` — chat.message_attachments UPDATE (media_asset_id writeback only)
- `inboxUnread.read.dal.js` — chat.inbox_entries READ (unread_count scoped to actor_id)

Model (3):
- `vexSettings.model.js` — inbox filter model
- `normalizeConversation.js` — conversation shape transformer
- `InboxEntryModel` — from @chat engine (not feature-owned)

Controller (3):
- `recordChatAttachment.controller.js` — attachment writeback after media upload
- `chatUnread.controller.js` — unread count management
- Engine controllers via @chat DI — conversation/message/inbox write logic (NOT feature-owned)

Service: None — engine delegation covers service concerns

Adapter (3):
- `chat.adapter.js` — exports useChatUnreadOps (stable public API surface)
- `useStartConversation.adapter.js` — start new Vox adapter (PUBLIC — changes require notice)
- `inboxSearchAdapter.js` — actor search adapter for inbox

Layer detail by module:

### chat/modules/chat

| File | Layer | Owner | Notes |
|---|---|---|---|
| index.js | Entry barrel | chat/modules/chat | Public surface — InboxScreen + ConversationScreen |
| setup.js | DI Config | chat/modules/chat | VCSM adapter wiring into @chat engine — _configured guard |
| store/chatUiStore.js | UI State | chat/modules/chat | Zustand — selectedConversationId, isNewChatModalOpen, composerDraft, activeChatFilter |
| adapters/chat.adapter.js | Adapter | chat/modules/chat | Exposes useChatUnreadOps — stable public API |

### chat/modules/start

| File | Layer | Owner | Notes |
|---|---|---|---|
| start/screens/StartConversationModal.jsx | Dumb UI | chat/modules/start | All behavior prop-injected |
| start/hooks/useStartConversation.js | Hook | chat/modules/start | Identity guard + engine delegate |
| adapters/start/hooks/useStartConversation.adapter.js | Adapter | chat/modules/start | Thin re-export — stable public API |

### chat/modules/debug

| File | Layer | Owner | Notes |
|---|---|---|---|
| chatBadgeDebugger.js | Debug Utility | chat/modules/debug | Consumed by chatUnread.controller.js |
| chatNavDebugger.js | Debug Utility | chat/modules/debug | Consumed by ConversationView.jsx |

Hook (37): useInbox.js, useChatInbox.js, useConversation.js, useConversationMessages.js, useMarkChatRead.js, useSendMessageActions.js, useTypingChannel.js, useChatMessagePrefetch.js, useVexSettings.js, useStartConversation.js, useInboxActions.js, useMessageActions.js, useConversationActions.js, useConversationMembers.js, useMessagePrivacySettings.js (+ 22 more)

Component (28): ChatHeader, ChatInput, MessageBubble, MessageList, MessageGroup, MessageMedia, InboxList, CardInbox, InboxEmptyState, InboxListSkeleton, MessageActionsMenu, ConversationActionsMenu (+ 16 more)

Screen (24): InboxScreen, ConversationScreen, ConversationView, ArchivedInboxScreen, RequestsInboxScreen, SpamInboxScreen, InboxSettingsScreen, InboxChatSettingsScreen, StartConversationModal, BlockedUsersScreen, MessagePrivacyScreen (+ 13 more)

---

## 5. Engines Used

| Engine | Role | Boundary |
|---|---|---|
| @chat (engines/chat) | PRIMARY — owns chat.conversations, chat.messages, chat.inbox_entries (full), realtime | configureChatEngine() DI in setup.js |
| @hydration (engines/hydration) | Actor summary hydration via hydrateAndReturnSummaries | Engine boundary |
| @identity (engines/identity) | Actor resolution; activeActorId session binding | Engine boundary via identity.adapter |
| @directory (engines/directory) | Actor search; injected into @chat via setup.js | Engine boundary |
| @media (engines/media) | Attachment media asset creation | Engine boundary via media.adapter |
| @notification (engines/notification) | Chat message notification events (declared) | Engine boundary |
| @review (engines/review) | Review data in chat context (declared) | Engine boundary |
| @menu (engines/menu) | Menu context within chat (declared) | Engine boundary |

---

## 6. Database / Schema Ownership

Tables read:

| Table | Schema | Access | Owner | Notes |
|---|---|---|---|---|
| chat.inbox_entries (unread_count) | chat | SELECT | chat feature DAL | inboxUnread.read.dal.js |
| chat.conversations | chat | SELECT + realtime | @chat engine | NOT feature-owned |
| chat.messages | chat | SELECT + realtime | @chat engine | NOT feature-owned |
| chat.inbox_entries (full) | chat | SELECT | @chat engine | NOT feature-owned |
| identity.search_actor_directory | identity | RPC READ | chat feature (via DI) | viewerActorId from Zustand — stale risk (VEN-CHAT-007) |
| vc.actors | vc | SELECT id, is_void | chat feature (via DI) | resolveActorRealmContext DI bridge in setup.js |
| moderation.blocks | moderation | SELECT bidirectional OR | chat feature (via DI) | checkBlockRelation; UUID-validated; fails closed |

Tables written:

| Table | Schema | Access | Owner | Notes |
|---|---|---|---|---|
| chat.message_attachments | chat | UPDATE (media_asset_id only) | chat feature DAL | updateAttachmentMediaAsset.write.dal.js |
| chat.conversations | chat | INSERT/UPDATE | @chat engine | NOT feature-owned |
| chat.messages | chat | INSERT/UPDATE | @chat engine | NOT feature-owned |

Views: None at feature layer

RPCs:
- `identity.search_actor_directory` — actor search lookup (READ-classified by ARCHITECT)

RLS policies: Enforced at @chat engine layer; feature layer relies on engine RLS
Migration owner: UNKNOWN — no migration audit performed; CARNAGE audit needed

---

## 7. Rule Ownership

| Rule | Layer | Module | Enforcement | Status |
|---|---|---|---|---|
| @chat engine DI configured exactly once | DI Config | chat/modules/chat | _configured guard in setup.js | ENFORCED |
| Actor identity (actorId) must be present before starting a conversation | Hook | chat/modules/start | useStartConversation identity guard | ENFORCED |
| Blocked actors must not be reachable via conversation initiation | Engine DI | chat/modules/chat | checkBlockRelation bidirectional OR, fails closed | ENFORCED |
| searchActors must use current viewer identity | DI Config | chat/modules/chat | NOT enforced — Zustand getState() is snapshot; stale during identity switch | OPEN (VEN-CHAT-007) |
| Debug utilities must not execute in production builds | Utility | chat/modules/debug | isEnabled() gate — build-time guard MISSING | OPEN (ELEK-2026-06-05-CD-001) |
| Actor search must respect visibility filters (deactivated, private realm) | App layer | chat/modules/start | NOT enforced at app layer; pickDirect() bypasses search RPC | OPEN (BW-CHAT-009) |
| whoCanMessage / allowNewMessageRequests must be server-enforced | Engine | engines/chat | localStorage-only — no server enforcement | OPEN (BW-CHAT-004, ELEK-2026-06-04-005) |

Actor ownership: @identity engine (session binding); feature layer reads actorId from identity.adapter — never from client payload
Lifecycle: @chat engine owns conversation/message lifecycle; feature owns attachment lifecycle
Authorization: Block check via checkBlockRelation (injected in setup.js); canReadConversation.js + isActorBlocked.js at feature layer (client-side gate; server RLS via engine)
Booking: N/A
Feed publishing: N/A
Media access: @media engine via media.adapter; recordChatAttachment.controller.js owns attachment writeback
Moderation: features/moderation via adapter boundary (report, spam cover, conversation cover)
SEO / indexing: N/A
External API: N/A
Native parity: N/A

---

## 8. Contracts Touched

| Contract | Status | Notes |
|---|---|---|
| Boundary Isolation Contract | PASS | All cross-feature imports verified via adapter boundary (ARCHITECT 2026-06-04) |
| Actor Ownership Contract | ACTIVE | Block checks, actor resolution, session binding |
| Architecture Contract | ACTIVE | Engine dependency pattern via setup.js DI |
| Engine Isolation Contract | ACTIVE | @chat is primary; feature owns DI wiring only |

---

## 9. Documentation Links

Logan docs:
- `ZZnotforproduction/APPS/VCSM/features/chat/BEHAVIOR.md` — PLACEHOLDER (P1 — needs full authoring; blocks THOR)
- `ZZnotforproduction/APPS/VCSM/features/chat/ARCHITECTURE.md` — COMPLETE (2026-06-04)
- `ZZnotforproduction/APPS/VCSM/features/chat/SECURITY.md` — COMPLETE (2026-06-05; VENOM + BW + ELEKTRA)
- `ZZnotforproduction/APPS/VCSM/features/chat/OWNERSHIP.md` — this file (2026-06-05)

Security audits:
- 2026-06-04: VENOM, BLACKWIDOW, ELEKTRA — `outputs/2026/06/04/`
- 2026-06-05: VENOM, BLACKWIDOW, ELEKTRA — `outputs/2026/06/05/`

Ownership audit:
- 2026-06-05 IRONMAN: `outputs/2026/06/05/IRONMAN/2026-06-05_ironman_chat.md`

Audit gaps:
- Runtime audits: MISSING — LOKI not yet run
- Performance audits: MISSING — KRAVEN not yet run
- Test coverage: MISSING — SPIDER-MAN not yet run (0 tests across 66 source files)
- Migration audits: MISSING — CARNAGE not yet run

---

## 10. Runtime Ownership

Entry points:
- `/inbox` → InboxScreen
- `/chat/:conversationId` → ConversationScreen
- `/chat/settings` → InboxSettingsScreen
- `/chat/archived`, `/chat/requests`, `/chat/spam` → filtered inbox screens
- StartConversationModal → overlay (UI-controlled; no dedicated route — chatUiStore.isNewChatModalOpen)

Controllers:
- `recordChatAttachment.controller.js` — attachment writeback hot path
- `chatUnread.controller.js` — unread count updates

DALs:
- `updateAttachmentMediaAsset.write.dal.js` — attachment write
- `inboxUnread.read.dal.js` — inbox read

Hot paths:
- InboxScreen → useChatInbox → @chat engine getInboxEntries (polling, 30s staleTime)
- ConversationScreen → useConversationMessages → @chat engine (polling, 30s)
- Send message → useSendMessageActions → @chat engine sendMessage RPC

Known bottlenecks:
- ConversationView.jsx — 400+ lines, 15+ hooks, 4 moderation adapter imports; god-view risk (ARCHITECT spaghetti score: WATCH)
- 37 hooks total — high count for engine-delegating feature; hook extraction candidate

---

## 11. Responsibilities

The chat feature owns:
1. Engine DI wiring — `setup.js` calls `configureChatEngine()` with VCSM-specific dependencies at startup
2. Inbox and conversation UI — all screens, components, and hooks for rendering the Vox experience
3. Attachment media writeback — `recordChatAttachment.controller.js` + DAL (chat.message_attachments UPDATE only)
4. Inbox UI state — Zustand chatUiStore (ephemeral: selectedConversationId, isNewChatModalOpen, composerDraftByConversationId, activeChatFilter)
5. Block gate (client-side) — `canReadConversation.js`, `isActorBlocked.js` in ConversationView
6. Start conversation flow — StartConversationModal + useStartConversation hook
7. Debug utilities — chatBadgeDebugger.js, chatNavDebugger.js (currently default-enabled in production — open finding)

The chat feature does NOT own:
- chat.conversations or chat.messages DB writes (all delegated to @chat engine)
- Chat schema reads beyond unread_count (all delegated to @chat engine)
- Realtime subscriptions (all delegated to @chat engine)
- Actor ownership validation (delegated to @identity engine + identity.adapter)
- Server-side block enforcement (delegated to moderation.blocks via engine DI)

---

## 12. Boundaries

This feature must not:
- Import directly from another feature's DAL (must use adapter boundary)
- Write to chat.conversations or chat.messages directly (engine owns these)
- Accept actorId from client payload (must derive from identity.adapter / session)
- Resolve actor realm context without DI injection (must go through setup.js configuration)
- Read CURRENT_STATUS.md (THOR-guarded artifact)

Approved cross-feature imports (adapter boundary only):
- `features/moderation` — via useReportFlow.adapter, ConversationCover.adapter, ReportModal.adapter, ChatSpamCover.adapter
- `features/block` — via useBlockStatus.adapter only
- `features/identity` — via identity.adapter only
- `features/media` — via media.adapter only

Infrastructure imports (approved without adapter — setup.js only):
- `@/services/supabase/supabaseClient`
- `@/state/identity/identitySelection.store`

---

## 13. Change Impact Rules

If chat feature changes:

| Changed Area | Must Update |
|---|---|
| setup.js DI wiring | ARCHITECTURE.md, BEHAVIOR.md, engine consumer map |
| DAL (write surface) | SECURITY.md (VENOM section), ARCHITECT write-surface-map |
| Controllers | SECURITY.md (VENOM), ARCHITECT layer map |
| Screens or hooks | BEHAVIOR.md (if behavior contract changes), ARCHITECT layer map |
| Cross-feature adapter imports | Boundary contract review required |
| chatUiStore fields | ARCHITECTURE.md (module data contract) |
| Debug utilities | SECURITY.md (ELEKTRA section), ARCHITECT anomaly log |

If @chat engine changes:

| Changed Area | Must Update |
|---|---|
| Engine DI contract | setup.js, ARCHITECTURE.md (engine dependency section) |
| chat schema tables | SECURITY.md (VENOM section), ARCHITECT data contract |
| Engine-exposed hooks API | All feature hooks consuming @chat engine |

---

## 14. Release Gate Notes

THOR Release Blockers (active as of 2026-06-05):

| Finding | Severity | Source | Description |
|---|---|---|---|
| VEN-CHAT-001 | HIGH | VENOM | inboxActions has no membership check before chat.inbox_entries mutations |
| VEN-CHAT-002 | HIGH | VENOM | editMessage DAL has no sender_actor_id SQL filter |
| BW-CHAT-002 | HIGH | BLACKWIDOW | ensureConversationMembership silently re-activates 'left' membership |
| ELEK-2026-06-04-001 | HIGH | ELEKTRA | Same as BW-CHAT-002 — source chain confirmed |
| BW-CHAT-004 | MEDIUM | BLACKWIDOW | whoCanMessage privacy setting BYPASSED — localStorage-only |

THOR CAUTION (PARTIAL — not blocking):
- BEHAVIOR.md PLACEHOLDER (documentation gap — no MNH invariants documented)
- Zero test coverage (quality gap — 0 tests, 66 source files)
- Migration ownership UNKNOWN

IRONMAN Release Gate Posture: PARTIAL
- Implementation owner: CLEAR (VCSM social domain)
- Security remediation owner: AMBIGUOUS (IRONMAN-CHAT-002 — no assigned engineer)
- Documentation owner: AMBIGUOUS (IRONMAN-CHAT-001 — BEHAVIOR.md unassigned)
- THOR must not run until security remediation ownership is assigned and HIGH findings are resolved

---

## 15. Open Ownership Questions

### IRONMAN Findings from this run

| Finding ID | Severity | Category | Status |
|---|---|---|---|
| IRONMAN-CHAT-001 | MEDIUM | Documentation ownership absent — BEHAVIOR.md PLACEHOLDER, no author assigned | OPEN |
| IRONMAN-CHAT-002 | MEDIUM | Security remediation owner missing — HIGH findings with no assigned engineer | OPEN |
| IRONMAN-CHAT-003 | LOW | Debug module production-enabled — no remediation owner for 2-line fix | OPEN |
| IRONMAN-CHAT-004 | LOW | ConversationView.jsx runtime complexity — no refactor audit owner | OPEN |

### Prior IRONMAN Findings (from module-scoped pass, 2026-06-05)

| Finding ID | Severity | Category | Status |
|---|---|---|---|
| OWN-CHT-001 | HIGH | No OWNERSHIP.md — now resolved by this file | RESOLVED |
| OWN-CHT-002 | HIGH | DI contract ownership ambiguity — no formal engine consumer contract | OPEN |
| OWN-CHT-003 | MEDIUM | BEHAVIOR.md STUBs — no MNH invariants documented | OPEN |
| OWN-CHT-004 | MEDIUM | Production safety rule unowned (debug default-enabled) | OPEN |
| OWN-CHT-005 | MEDIUM | 0 tests, no test owner assigned | OPEN |
| OWN-CHT-006 | LOW | Stale route scanner error in start module BEHAVIOR.md | OPEN |
| OWN-CHT-007 | LOW | Adapter re-exports undocumented — useStartConversation.adapter stability unclear | OPEN |

### Open Questions

| Question | Priority | Who Should Resolve |
|---|---|---|
| Who is the assigned author for BEHAVIOR.md? | P1 | LOGAN + VCSM social domain |
| Who owns remediation of VEN-CHAT-001, VEN-CHAT-002, BW-CHAT-002, ELEK-2026-06-04-001? | P1 | VCSM social domain engineering |
| Is pickDirect() visibility bypass (BW-CHAT-009) fixed at app layer or engine layer? | P2 | Architecture decision needed |
| Is realtime intentionally permanently disabled, or temporary? Who documents the decision? | P3 | LOKI + VCSM social domain |
| What is the migration history for chat schema? Who owns future migrations? | P4 | CARNAGE |
| Does ConversationView.jsx need to be split? Who owns the refactor plan? | P4 | LOKI + KRAVEN |

### Required Follow-Up

| Command | Action | Priority |
|---|---|---|
| LOGAN | Author BEHAVIOR.md for chat feature — full behavior contract with MNH invariants | P1 |
| Engineering | TICKET-CHAT-SEC-001 — remediate VEN-CHAT-001, VEN-CHAT-002, BW-CHAT-002, ELEK-2026-06-04-001 | P1 |
| Engineering | Apply import.meta.env.PROD patch to chatBadgeDebugger.js + chatNavDebugger.js | P2 |
| SPIDER-MAN | Test: identity guard, production gate, block enforcement, stale viewerActorId | P2 |
| LOKI | Runtime ownership map for ConversationView.jsx | P3 |
| KRAVEN | Bottleneck identification for inbox hot paths | P3 |
| HAWKEYE | Confirm /chat/new route is NOT registered (StartConversationModal is UI-only) | P4 |
| CARNAGE | Migration ownership audit for chat schema | P4 |
| THOR | Release readiness gate — after HIGH findings resolved + BEHAVIOR.md authored | POST-FIX |
