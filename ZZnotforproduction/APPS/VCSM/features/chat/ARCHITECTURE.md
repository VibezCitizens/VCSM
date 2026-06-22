---
name: vcsm.chat.architecture
description: ARCHITECT V2 module architecture report for VCSM:chat
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** chat
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/chat
**Independence Status:** DEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The chat module implements VCSM's real-time direct and group messaging system, branded as "Vox." It provides an inbox (chat.inbox_entries) listing all conversations per actor, a full conversation thread view (chat.conversations / chat.messages), attachment upload with media asset writeback, and inbox management actions (archive, delete, mark spam, mark read). The module delegates all heavy conversation and message logic to the shared `@chat` engine via dependency injection, keeping the feature layer thin: routing guards, hook orchestration, and VCSM-specific setup (block checks, realm context, actor search injection).

## OWNERSHIP

Owned by the VCSM social feature domain. The chat engine (`engines/chat`) is the authority for all DB reads and realtime subscriptions. This feature layer owns the VCSM-specific adapter wiring (setup.js), the inbox UI state (Zustand chatUiStore), attachment media writeback (DAL + controller), and all screens/components. Identity resolution delegates to the identity engine; block status delegates to the block feature adapter.

## ENTRY POINTS

- `/inbox` — InboxScreen (primary entry, lists all inbox_entries for the active actor)
- `/chat/:conversationId` — ConversationScreen (individual conversation thread)
- `/chat/settings` — InboxSettingsScreen (settings navigation target from InboxScreen)
- `/chat/archived` — ArchivedInboxScreen
- `/chat/requests` — RequestsInboxScreen
- `/chat/spam` — SpamInboxScreen
- StartConversationModal — modal launched from InboxScreen to initiate a new Vox

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 2 | updateAttachmentMediaAsset.write.dal.js, inboxUnread.read.dal.js |
| Model | 3 | vexSettings.model.js (inbox filter model), InboxEntryModel (from @chat engine), normalizeConversation.js |
| Controller | 3 | recordChatAttachment.controller.js, chatUnread.controller.js, (engine controllers via @chat) |
| Service | N/A | No standalone service layer |
| Adapter | 3 | chat.adapter.js (exposes useChatUnreadOps), useStartConversation.adapter.js, inboxSearchAdapter.js |
| Hook | 37 | useInbox.js, useChatInbox.js, useConversation.js, useConversationMessages.js, useMarkChatRead.js, useSendMessageActions.js, useTypingChannel.js, useChatMessagePrefetch.js, useVexSettings.js, etc. |
| Component | 28 | ChatHeader, ChatInput, MessageBubble, MessageList, MessageGroup, MessageMedia, InboxList, CardInbox, InboxEmptyState, InboxListSkeleton, MessageActionsMenu, ConversationActionsMenu |
| Screen | 24 | InboxScreen, ConversationScreen, ConversationView, ArchivedInboxScreen, RequestsInboxScreen, SpamInboxScreen, InboxSettingsScreen, InboxChatSettingsScreen, StartConversationModal, BlockedUsersScreen, MessagePrivacyScreen |
| Barrel | 3 | index.js (exports InboxScreen + ConversationScreen), chat.adapter.js, adapters/start/hooks/useStartConversation.adapter.js |

Counts reflect callgraph scanner data (cg_layerCounts).

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Source is clear; BEHAVIOR.md is PLACEHOLDER | BEHAVIOR.md has no real contract — needs authoring |
| Owner defined | PARTIAL | Implicitly the VCSM social domain; no ownership record | OWNERSHIP.md absent |
| Entry points mapped | PASS | InboxScreen, ConversationScreen, settings screens visible in source | Route-map shows 0 routes (scanner limitation — routes are React Router paths, not file-level) |
| Controllers present/delegated | PASS | 3 controllers; engine delegation pattern confirmed | No controller for inbox archive/delete/spam (those are engine RPC calls via hooks directly) |
| DAL/repository present/delegated | PASS | 2 feature DAL files; majority of reads delegated to @chat engine | Low local DAL count is intentional — engine owns chat schema reads |
| Models/transformers present | PASS | vexSettings.model.js, normalizeConversation.js, resolvePartnerActor.js, InboxEntryModel (engine) | No local message model — engine owns message shape |
| Hooks/view models present | PASS | 37 hooks covering inbox, conversation, typing, scroll, attachment, prefetch, actions | Count is high; hook file count reflects deep sub-folder organization |
| Screens/components present | PASS | 24 screens + 28 components; full UI coverage observed | ConversationView is embedded inside conversation/screen/ — not in top-level screens/ |
| Services/adapters present | PASS | 3 adapters covering public API surface, search, and start-conversation | Adapter layer is thin by design |
| Database objects mapped | PASS | chat.message_attachments (update), chat.inbox_entries (read), identity.search_actor_directory (rpc) | Write surface scan found only attachment writeback; all other chat writes go through @chat engine |
| Authorization path mapped | PARTIAL | canReadConversation.js + isActorBlocked.js present; block status via useBlockStatus adapter | No auth middleware layer; guard logic lives in ConversationView inline |
| Cache/runtime behavior mapped | PASS | React Query with 30s polling; Zustand for UI state; realtime intentionally disabled for inbox | Realtime disabled is a deliberate decision (noted in useChatInbox comments) |
| Error/loading/empty states mapped | PASS | All three states confirmed in InboxScreen (skeleton, empty state, error retry) and ConversationView (spinner, error div) | |
| Documentation linked | FAIL | BEHAVIOR.md present but is a PLACEHOLDER with no real contract | Full behavior contract needs to be authored |
| Tests/validation noted | FAIL | 0 tests detected by scanner | No test coverage for inbox, conversation, attachment, or send flows |
| Native parity noted | N/A | | |
| Engine dependencies mapped | PASS | 8 engines declared: chat, directory, hydration, identity, media, menu, notification, review | setup.js confirms engine wiring; @chat is the primary dependency |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| @chat (engines/chat) | engine | inbound | YES — engine boundary | Primary dependency; owns conversation/message/inbox DB reads and realtime |
| @hydration (engines/hydration) | engine | inbound | YES | Actor summary hydration via hydrateAndReturnSummaries |
| @identity (engines/identity) | engine | inbound | YES | Actor resolution via useIdentity; identity.adapter |
| @directory (engines/directory) | engine | inbound | YES | Actor search injected into chat engine via setup.js |
| @media (engines/media) | engine | inbound | YES | createMediaAssetController for attachment writeback |
| @notification (engines/notification) | engine | inbound | YES | Declared; notification events for chat messages |
| @review (engines/review) | engine | inbound | YES | Declared; review data surfaced in chat context |
| @menu (engines/menu) | engine | inbound | YES | Declared; menu context within chat |
| features/moderation | feature (cross) | inbound | YES — via adapter | useReportFlow.adapter, useConversationCover.adapter, ReportModal.adapter, ChatSpamCover.adapter |
| features/block | feature (cross) | inbound | YES — via adapter | useBlockStatus.adapter used in ConversationView |
| features/identity | feature (cross) | inbound | YES — via adapter | identity.adapter used for actorId resolution in screens |
| features/media | feature (cross) | inbound | YES — via adapter | media.adapter used in recordChatAttachment.controller.js |
| chat.message_attachments | DB table (write) | outbound | YES | update — media_asset_id writeback after upload |
| chat.inbox_entries | DB table (read) | outbound | YES — via engine | engine reads; feature-level DAL reads unread_count column |
| identity.search_actor_directory | RPC (write-flagged) | outbound | YES | Actor search in setup.js — scanner classifies as write surface |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| chat.message_attachments | UPDATE (media_asset_id) | chat feature DAL | recordChatAttachment.controller.js | LOW — narrow update by message_id + storage_path |
| identity.search_actor_directory | RPC call | identity engine / DB | searchActors() in setup.js | LOW — read-only directory search |
| chat.inbox_entries | READ (unread_count) | chat feature DAL | chatUnread.controller.js | LOW — scoped to actor_id |
| chat.conversations | READ + realtime | @chat engine | useConversation hook | MANAGED — engine owns access |
| chat.messages | READ + realtime | @chat engine | useConversationMessages hook | MANAGED — engine owns access |
| chat.inbox_entries (full) | READ | @chat engine | useChatInbox via getInboxEntries | MANAGED — engine owns access |
| moderation.blocks | READ | features/block + setup.js | checkBlockRelation(), useBlockStatus | LOW — used for composer gate |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | READY | InboxScreen + ConversationScreen exported from index.js; router params used correctly | Route registration is in app/router (outside this module) |
| Loading state | READY | InboxListSkeleton (7 rows), Spinner in ConversationView, animate-pulse skeleton for messages | COMPLETE |
| Empty state | READY | InboxEmptyState component confirmed in InboxScreen | COMPLETE |
| Error state | READY | Error div + retry button in InboxScreen; "Failed to load" div in ConversationView | COMPLETE |
| Auth/owner gates | PARTIAL | Identity guard in ConversationScreen via useIdentity; canReadConversation.js + isActorBlocked.js present; block gate in ConversationView | No server-side ownership assertion in feature layer — relies on RLS via engine |
| Cache behavior | READY | React Query with 30s staleTime + refetchInterval; gcTime 10 min; Zustand for UI state | Realtime intentionally disabled; polling-based freshness |
| Runtime dependencies | READY | setup.js must be called before render (setupVcsmChatEngine); guards against double-configure with _configured flag | Risk: if setup.js not called at app boot, engine will be unconfigured |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/chat/BEHAVIOR.md | PRESENT (PLACEHOLDER — needs authoring) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a PLACEHOLDER | HIGH | No formal behavior contract exists. Auth rules, privacy settings, blocking behavior, and folder semantics are undocumented. | LOGAN |
| Zero test coverage | HIGH | 66 source files, 37 hooks, 24 screens — no tests. Send flow, inbox loading, attachment writeback, and block-gate logic have no regression coverage. | SPIDER-MAN |
| No ownership record | MEDIUM | Module responsibility is implicit, not declared. Security and governance reviews have no starting owner. | IRONMAN |
| ARCHITECTURE.md was missing | LOW | Now resolved by this run. | ARCHITECT |
| CURRENT_STATUS.md was missing | LOW | Now resolved by this run. | ARCHITECT |
| Realtime intentionally disabled — no doc | MEDIUM | useChatInbox comments note realtime is off; no governance document explains the decision or the plan to re-enable. | LOKI |
| No security audit on block gate | MEDIUM | The block-check-pending pattern in ConversationView is client-side only. Server-side enforcement path is unclear. | VENOM |
| setup.js boot ordering undocumented | MEDIUM | setupVcsmChatEngine() must be called before first render; if skipped the engine is unconfigured. No integration test or boot assertion covers this. | SENTRY |

---

## MODULE BOUNDARY WARNINGS

- `recordChatAttachment.controller.js` imports directly from `@/features/media/adapters/media.adapter` — this is an approved cross-feature import via adapter boundary. PASS.
- `ConversationView.jsx` imports from `@/features/moderation/adapters/` (hooks and components) — adapter boundary. PASS.
- `ConversationView.jsx` imports from `@/features/block/adapters/hooks/useBlockStatus.adapter` — adapter boundary. PASS.
- `ConversationScreen.jsx` imports from `@/features/identity/adapters/identity.adapter` — adapter boundary. PASS.
- `setup.js` imports from `@/services/supabase/supabaseClient` and `@/state/identity/identitySelection.store` — direct service and state imports, not adapter-mediated. These are internal VCSM infrastructure imports (not cross-feature), which is acceptable.
- `InboxScreen.jsx` imports `@i18n` — translation alias; acceptable infrastructure dependency.
- No violations of the adapter boundary rule detected. No direct cross-feature DAL imports found.

---

## SPAGHETTI SCORE

**Module:** chat
**Score:** WATCH
**Reasons:** Hook count is high (37 in callgraph) for a module that delegates most logic to an engine. The hook sub-folder tree under `conversation/hooks/conversation/` and `conversation/hooks/realtime/` is well-organized but adds navigation complexity. ConversationView.jsx is large (400+ lines) and orchestrates 15+ hooks — it is at risk of becoming a god view. The moderation cross-dependency (adapters used correctly but numerous: 4 moderation adapter imports in ConversationView) is a watch item. Setup.js dependency injection pattern is non-standard and boot-order-sensitive.
**Release risk:** MEDIUM

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — no real contract authored

**Check A (Source without behavior):** FAIL — source exists and is active; BEHAVIOR.md has no substance
**Check B (Behavior without source):** N/A — no declared happy paths to verify
**Check C (§13 engine consistency):** PARTIAL — scanner declares 8 engines; source confirms @chat, @hydration, @identity, @directory, @media usage. @menu and @review declared but not confirmed in scanned files (may be used in unread hooks or engine internals).
**Check D (§6 data change consistency):** PARTIAL — scanner write surfaces (chat.message_attachments update, identity.search_actor_directory rpc) match source; all other chat schema writes go through @chat engine and are not surfaced at the feature level.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Author BEHAVIOR.md — full behavior contract | PLACEHOLDER is blocking governance, security review, and native parity assessment | LOGAN |
| P2 | Add test coverage for send flow, inbox load, and block gate | Zero tests across 66 files is the highest quality risk | SPIDER-MAN |
| P3 | Security audit on block-gate (client-side vs. server-side enforcement) | Block check is client-gated only; server RLS path for message send is unverified | VENOM |
| P4 | Document realtime-disabled decision and restoration plan | Polling-based freshness is a runtime risk; no governance doc for the decision | LOKI |

## RECOMMENDED HANDOFFS
- LOGAN — BEHAVIOR.md needs full authoring
- SPIDER-MAN — zero test coverage
- VENOM — block gate security verification
- LOKI — realtime-disabled runtime decision documentation
- IRONMAN — ownership declaration
- SENTRY — setup.js boot order assertion

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
