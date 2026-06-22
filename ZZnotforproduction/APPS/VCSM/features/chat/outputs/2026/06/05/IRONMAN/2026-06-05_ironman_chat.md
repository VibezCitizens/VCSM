# IRONMAN — chat Feature Ownership Report

**Date:** 2026-06-05
**Feature:** chat (Vox messaging system)
**Application Scope:** VCSM + ENGINE
**Ticket:** TICKET-ARCHITECT-DASHBOARD-0001

---

## ARCHITECT GATE

| Check | Result |
|---|---|
| ARCHITECT report present | PASS — ZZnotforproduction/APPS/VCSM/features/chat/ARCHITECTURE.md |
| Report status | PASS — MOSTLY COMPLETE (treated as SUCCESS) |
| Freshness | PASS — 2026-06-04, 1 day old (≤ 7 days) |
| Scope match | PASS — VCSM / chat feature |

Artifact completeness:

| Artifact | Status | Result |
|---|---|---|
| ARCHITECTURE.md | COMPLETE — purpose, layer map, ownership, dependency graph | PASS |
| feature-map | IMPLICIT_COMPLETE — embedded in ARCHITECTURE.md Layer Map section | PASS |
| dependency-map | IMPLICIT_COMPLETE — embedded in ARCHITECTURE.md Module Dependency Graph | PASS |

---

## STEP 1 — TARGET

```
IRONMAN TARGET
Feature / Engine: chat (Vox — VCSM real-time direct and group messaging)
Application Scope: VCSM + ENGINE
Reason for ownership review: OWNERSHIP.md absent; recommended by ARCHITECT; security reviews
  (VENOM + BLACKWIDOW + ELEKTRA) complete with open HIGH findings; no remediation owner assigned;
  BEHAVIOR.md is a PLACEHOLDER with no governance coverage.
```

---

## STEP 2 — CODE ROOTS

```
CODE ROOTS
Source: ARCHITECT ARCHITECTURE.md [ZZnotforproduction/APPS/VCSM/features/chat/ARCHITECTURE.md — 2026-06-04]

Primary path:  apps/VCSM/src/features/chat/
Related paths: engines/chat/  (NOT owned by this feature — engine authority)
Entry files:
  - apps/VCSM/src/features/chat/index.js        (screen barrel — exports InboxScreen, ConversationScreen)
  - apps/VCSM/src/features/chat/setup.js        (engine DI — configureChatEngine() wiring)
  - apps/VCSM/src/features/chat/store/chatUiStore.js  (Zustand UI state)
  - apps/VCSM/src/features/chat/adapters/chat.adapter.js  (public adapter surface)
```

---

## STEP 3 — LAYER MAP

```
LAYER MAP
Source: ARCHITECT ARCHITECTURE.md (Layer Map section) [2026-06-04]

DAL (2):
  - updateAttachmentMediaAsset.write.dal.js  — chat.message_attachments UPDATE (media_asset_id writeback)
  - inboxUnread.read.dal.js                  — chat.inbox_entries READ (unread_count)

Model (3):
  - vexSettings.model.js       — inbox filter model
  - normalizeConversation.js   — conversation shape transformer
  - InboxEntryModel             — from @chat engine

Controller (3):
  - recordChatAttachment.controller.js  — attachment writeback after media upload
  - chatUnread.controller.js            — unread count management
  - (engine controllers via @chat DI)   — conversation/message/inbox write logic

Service: N/A — no standalone service layer; engine delegation covers service concerns

Adapter (3):
  - chat.adapter.js                  — exports useChatUnreadOps (public API surface)
  - useStartConversation.adapter.js  — start new Vox adapter
  - inboxSearchAdapter.js            — actor search adapter for inbox

Hook (37):
  useInbox.js, useChatInbox.js, useConversation.js, useConversationMessages.js,
  useMarkChatRead.js, useSendMessageActions.js, useTypingChannel.js,
  useChatMessagePrefetch.js, useVexSettings.js, useStartConversation.js,
  useInboxActions.js, useMessageActions.js, useConversationActions.js,
  useConversationMembers.js, useMessagePrivacySettings.js (+ 22 more)

Component (28):
  ChatHeader, ChatInput, MessageBubble, MessageList, MessageGroup, MessageMedia,
  InboxList, CardInbox, InboxEmptyState, InboxListSkeleton, MessageActionsMenu,
  ConversationActionsMenu (+ 16 more)

Screen (24):
  InboxScreen, ConversationScreen, ConversationView, ArchivedInboxScreen,
  RequestsInboxScreen, SpamInboxScreen, InboxSettingsScreen, InboxChatSettingsScreen,
  StartConversationModal, BlockedUsersScreen, MessagePrivacyScreen (+ 13 more)
```

---

## STEP 4 — DEPENDENCY OWNERSHIP

```
DEPENDENCY OWNERSHIP
Source: ARCHITECT ARCHITECTURE.md (Module Dependency Graph + Module Data Contract) [2026-06-04]

Engines used (8):
  @chat (engines/chat)            — PRIMARY; owns chat schema reads, realtime, message/conversation writes
  @hydration (engines/hydration)  — actor summary hydration via hydrateAndReturnSummaries
  @identity (engines/identity)    — actor resolution; activeActorId session binding
  @directory (engines/directory)  — actor search; injected into @chat engine via setup.js
  @media (engines/media)          — attachment media asset creation
  @notification (engines/notification) — declared; chat message notification events
  @review (engines/review)        — declared; review data surfaced in chat context
  @menu (engines/menu)            — declared; menu context within chat

Cross-feature adapters (all via approved adapter boundary):
  features/moderation — useReportFlow.adapter, ConversationCover.adapter,
                        ReportModal.adapter, ChatSpamCover.adapter
  features/block      — useBlockStatus.adapter (composer gate in ConversationView)
  features/identity   — identity.adapter (actorId resolution in screens)
  features/media      — media.adapter (in recordChatAttachment.controller.js)

External services:
  supabase — @/services/supabase/supabaseClient (setup.js — direct infrastructure import; acceptable)
  identitySelection.store — @/state/identity/identitySelection.store (Zustand; setup.js DI)
```

---

## STEP 5 — DATA OWNERSHIP

```
DATA OWNERSHIP
Source: ARCHITECT ARCHITECTURE.md (Module Data Contract) [2026-06-04]

Tables read:
  chat.inbox_entries (unread_count)    — feature DAL (inboxUnread.read.dal.js)
  chat.conversations                   — @chat engine (useConversation)
  chat.messages                        — @chat engine (useConversationMessages)
  chat.inbox_entries (full)            — @chat engine (getInboxEntries)
  identity.search_actor_directory      — RPC read in setup.js (searchActors injected into engine)
  moderation.blocks                    — read in setup.js (checkBlockRelation injected into engine)

Tables written:
  chat.message_attachments             — feature DAL UPDATE (media_asset_id writeback only)
  All other chat schema writes         — delegated to @chat engine; NOT owned at feature layer

Identity surfaces:
  identity.search_actor_directory      — actor lookup; viewerActorId from Zustand (stale risk — VEN-CHAT-007)
  moderation.blocks                    — block check; bidirectional OR; UUID-validated input

Caches:
  React Query  — 30s staleTime, 10min gcTime; polling-based freshness (realtime intentionally disabled)
  Zustand chatUiStore — selectedConversationId, isNewChatModalOpen,
                        composerDraftByConversationId, activeChatFilter

IRONMAN_OWNERSHIP_CONFLICT: NONE
  All table accesses match ARCHITECT report. Feature-level DAL is correctly scoped to
  attachment write + inbox unread read. All other chat schema access delegated to @chat engine.
  Split is correct and intentional by design.
```

---

## STEP 6 — GOVERNANCE OWNERSHIP

```
GOVERNANCE OWNERSHIP

Contracts touched:
  Boundary Isolation Contract    — cross-feature adapter imports verified PASS by ARCHITECT
  Actor Ownership Contract       — block checks, actor resolution, session binding
  Architecture Contract          — engine dependency pattern via setup.js DI
  Engine Isolation Contract      — @chat is primary; feature owns DI wiring only

Logan docs:
  BEHAVIOR.md     — ZZnotforproduction/APPS/VCSM/features/chat/BEHAVIOR.md
                    STATUS: PLACEHOLDER — no real contract authored (P1 governance gap)
  ARCHITECTURE.md — ZZnotforproduction/APPS/VCSM/features/chat/ARCHITECTURE.md (COMPLETE, 2026-06-04)
  SECURITY.md     — ZZnotforproduction/APPS/VCSM/features/chat/SECURITY.md (COMPLETE, 2026-06-05)

Security audits (output paths):
  2026-06-04: VENOM, BLACKWIDOW, ELEKTRA — outputs/2026/06/04/
  2026-06-05: VENOM, BLACKWIDOW, ELEKTRA — outputs/2026/06/05/

Module-level audit coverage (TICKET-ARCHITECT-DASHBOARD-0001):
  modules/chat/   — ARCHITECT + VENOM + BLACKWIDOW + ELEKTRA complete
  modules/start/  — ARCHITECT + VENOM + BLACKWIDOW + ELEKTRA complete
  modules/debug/  — ARCHITECT + VENOM + BLACKWIDOW + ELEKTRA complete

Audit gaps:
  Runtime audit (LOKI):     MISSING
  Performance audit (KRAVEN): MISSING
  Test coverage (SPIDER-MAN): MISSING (0 tests across 66 source files)
  Migration audit (CARNAGE):  MISSING
```

---

## STEP 7 — OWNERSHIP RECORD

```
IRONMAN OWNERSHIP RECORD
Feature:            chat (Vox)
Application Scope:  VCSM + ENGINE
Primary files:      index.js, setup.js, store/chatUiStore.js, adapters/chat.adapter.js
Engines used:       @chat (primary), @hydration, @identity, @directory, @media,
                    @notification, @review, @menu
Tables touched:     chat.message_attachments (feature WRITE), chat.inbox_entries (feature READ),
                    chat.conversations/messages (engine READ/realtime),
                    identity.search_actor_directory (RPC), moderation.blocks (READ)
Contracts touched:  Boundary Isolation, Actor Ownership, Architecture, Engine Isolation
Docs touched:       BEHAVIOR.md (PLACEHOLDER), ARCHITECTURE.md, SECURITY.md
Responsibilities:   engine DI wiring, inbox/conversation UI, attachment writeback, inbox UI state
Boundary rules:     chat feature must not own chat.conversations or chat.messages writes;
                    all message DB writes go through @chat engine;
                    cross-feature imports must use adapter boundary (never direct DAL imports)
```

---

## OWNERSHIP CLARITY CLASSIFICATION

```
Ownership Clarity: PARTIAL

Evidence:
  CLEAR — feature ownership is explicit (VCSM social domain; code roots confirmed)
  CLEAR — engine ownership (@chat is authoritative for all DB reads and realtime)
  CLEAR — DAL ownership (2 local files, correctly scoped; engine handles the rest)
  CLEAR — UI ownership (24 screens, 28 components)
  CLEAR — adapter boundary enforcement (PASS from ARCHITECT)
  AMBIGUOUS — documentation ownership (BEHAVIOR.md PLACEHOLDER; no author assigned)
  AMBIGUOUS — security remediation ownership (open HIGH findings; no remediation owner)
  UNKNOWN — migration ownership (no audit performed)

Confidence: HIGH
```

---

## RESPONSIBILITY CLASSIFICATION

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---|---|
| Feature ownership | VCSM social domain | HIGH | Confirmed by ARCHITECT |
| Engine ownership | @chat engine | HIGH | engines/chat/ is NOT this feature |
| DAL ownership | chat feature | HIGH | 2 local DAL files; engine owns the rest |
| Controller ownership | chat feature | HIGH | 3 controllers; engine DI controllers via @chat |
| UI ownership | chat feature | HIGH | 24 screens, 28 components, 37 hooks |
| Runtime ownership | chat feature | MEDIUM | ConversationView.jsx god-view risk (400+ lines, 15+ hooks) |
| Data ownership | SPLIT — feature (attachment write) / @chat engine (all chat reads + writes) | HIGH | Correct by design; documented |
| Contract ownership | boundary contract | HIGH | Adapter boundary verified PASS |
| Documentation ownership | AMBIGUOUS | LOW | BEHAVIOR.md PLACEHOLDER; no author assigned |
| Security ownership | AMBIGUOUS | MEDIUM | Findings open; no remediation owner declared |
| Migration ownership | UNKNOWN | LOW | No migration audit performed |
| Native parity ownership | N/A | N/A | Not applicable |

---

## OWNERSHIP BOUNDARY RISK

| Area | Risk | Reason | Recommended Clarification |
|---|---|---|---|
| BEHAVIOR.md documentation | MEDIUM | PLACEHOLDER — no behavior contract; blocks governance, security, and native parity assessment | Assign to LOGAN; P1 priority |
| Security remediation | MEDIUM | Open HIGH findings (VEN-CHAT-001, VEN-CHAT-002, BW-CHAT-002, ELEK-2026-06-04-001) with no assigned remediation owner | Create engineering ticket; assign to VCSM social domain |
| pickDirect() visibility bypass | MEDIUM | BW-CHAT-009 — app-layer vs engine-layer boundary for actor resolution unresolved | Clarify: engine-layer fix or app-layer UUID gate? Open TICKET. |
| Debug module production posture | LOW | chatBadgeDebugger/chatNavDebugger default enabled in prod; BW-CHAT-005, ELEK-2026-06-05-CD-001 open | Small surgical fix; assign to VCSM social domain |
| ConversationView.jsx complexity | LOW | 400+ lines, 15+ hooks — god-view risk; no refactor owner | Assign to LOKI + KRAVEN for runtime audit |
| setup.js boot ordering | LOW | setupVcsmChatEngine() must be called at boot; no integration test covers this | Assign to SENTRY for boot-order assertion |

---

## IRONMAN FINDINGS

### IRONMAN-CHAT-001 — Documentation Ownership Absent

```
IRONMAN OWNERSHIP FINDING
Finding ID:           IRONMAN-CHAT-001
Feature / Engine:     chat
Application Scope:    VCSM
Responsibility Type:  Documentation ownership
Ownership Clarity:    AMBIGUOUS
Boundary Risk:        MEDIUM
Severity:             MEDIUM
Current ambiguity:    BEHAVIOR.md is a PLACEHOLDER with no real behavior contract authored;
                      OWNERSHIP.md was absent prior to this run
Risk:                 Security reviews, governance audits, and native parity assessments all
                      reference BEHAVIOR.md as the authoritative behavior contract. With it
                      empty, there is no formal record of auth rules, privacy settings, block
                      semantics, folder semantics, or §9 Must Never Happen invariants.
Recommended ownership clarification: Assign BEHAVIOR.md authorship to LOGAN command
Recommended handoff:  LOGAN — full BEHAVIOR.md contract authoring
Rationale:            ARCHITECT flagged this as P1 (2026-06-04). VENOM, BLACKWIDOW, and
                      ELEKTRA all noted the gap. Now 2 days old with no progress.
```

### IRONMAN-CHAT-002 — Security Remediation Owner Missing

```
IRONMAN OWNERSHIP FINDING
Finding ID:           IRONMAN-CHAT-002
Feature / Engine:     chat
Application Scope:    VCSM
Responsibility Type:  Security ownership
Ownership Clarity:    AMBIGUOUS
Boundary Risk:        MEDIUM
Severity:             MEDIUM
Current ambiguity:    VENOM/BLACKWIDOW/ELEKTRA have produced open HIGH findings with no
                      declared remediation owner:
                        VEN-CHAT-001 (HIGH): inbox membership check missing
                        VEN-CHAT-002 (HIGH): editMessage no sender_actor_id SQL filter
                        BW-CHAT-002 (HIGH): ensureConversationMembership re-activation bypass
                        ELEK-2026-06-04-001 (HIGH): same as BW-CHAT-002, chain confirmed
                      THOR release blockers are active. No engineering ticket exists for remediation.
Risk:                 Without an owner, these findings will remain OPEN indefinitely and
                      THOR will continue to block release.
Recommended ownership clarification: Assign to VCSM social domain engineering
Recommended handoff:  Open TICKET-CHAT-SEC-001 for remediation of HIGH findings
Rationale:            THOR release blockers must have a responsible owner or release is blocked
                      permanently.
```

### IRONMAN-CHAT-003 — Debug Module Remediation Owner Missing

```
IRONMAN OWNERSHIP FINDING
Finding ID:           IRONMAN-CHAT-003
Feature / Engine:     chat / modules / debug
Application Scope:    VCSM
Responsibility Type:  Security ownership
Ownership Clarity:    MISSING
Boundary Risk:        LOW
Severity:             LOW
Current ambiguity:    BW-CHAT-005 (MEDIUM/BYPASSED) and ELEK-2026-06-05-CD-001 (LOW) confirm
                      chatBadgeDebugger.js and chatNavDebugger.js are default-enabled in production.
                      Suggested fix: add `if (import.meta.env.PROD) return false` as first line
                      in both isEnabled() functions. No owner assigned. Two-line fix.
Risk:                 Production console.log of actorId UUIDs and navigation state; low severity
                      but trivially fixable.
Recommended ownership clarification: Assign to VCSM social domain engineering (quick fix)
Recommended handoff:  Any VCSM social domain engineer; 2 file edits
Rationale:            Low risk but zero cost to fix; leaving it open indefinitely is unnecessary.
```

### IRONMAN-CHAT-004 — ConversationView.jsx Runtime Complexity

```
IRONMAN OWNERSHIP FINDING
Finding ID:           IRONMAN-CHAT-004
Feature / Engine:     chat
Application Scope:    VCSM
Responsibility Type:  Runtime ownership
Ownership Clarity:    PARTIAL
Boundary Risk:        LOW
Severity:             LOW
Current ambiguity:    ConversationView.jsx is 400+ lines and orchestrates 15+ hooks including
                      cross-feature adapters (4 moderation, 1 block, 1 identity). ARCHITECT
                      classified it as a god-view risk with WATCH spaghetti score. No runtime
                      audit or refactor plan exists.
Risk:                 Runtime bugs in ConversationView are hard to isolate; hook extraction
                      without a runtime map risks regression.
Recommended ownership clarification: Assign to LOKI + KRAVEN for runtime and performance audit
Recommended handoff:  LOKI — runtime ownership map; KRAVEN — bottleneck identification
Rationale:            Refactoring a god-view without a runtime map is risky; audit first.
```

---

## CROSS-ROOT OWNERSHIP REVIEW

| Area | Claimed Owner | Actual Root | Boundary Status | Notes |
|---|---|---|---|---|
| @chat engine | @chat engine team | engines/chat/ | CLEAN — no feature-level files in engine root | Feature layer owns DI setup only; engine owns DB |
| moderation adapters | features/moderation | apps/VCSM/src/features/moderation/ | CLEAN — adapter boundary enforced | |
| block adapter | features/block | apps/VCSM/src/features/block/ | CLEAN — adapter boundary enforced | |
| identity adapter | features/identity | apps/VCSM/src/features/identity/ | CLEAN — adapter boundary enforced | |
| media adapter | features/media | apps/VCSM/src/features/media/ | CLEAN — adapter boundary enforced | |

No cross-root violations detected. All boundary crossings use approved adapter pattern.

---

## WRITE 2 STATUS

OWNERSHIP.md:
  Written: ZZnotforproduction/APPS/VCSM/features/chat/OWNERSHIP.md
  Status: CREATED (was MISSING per ARCHITECT)

CURRENT_STATUS.md:
  Status: BLOCKED — THOR_FORBIDDEN_ARTIFACT_READ on feature-level CURRENT_STATUS.md
  Action: THOR must append the IRONMAN section on its next fresh-session run
  IRONMAN section to append (for next THOR run):

    ## IRONMAN
    IRONMAN Last Run: 2026-06-05
    Ownership Clarity: PARTIAL
    Findings: 4 (0 CRITICAL, 0 HIGH, 2 MEDIUM, 2 LOW)
    THOR Blocker: NONE from this run (existing security blockers stand)
    Report: outputs/2026/06/05/IRONMAN/2026-06-05_ironman_chat.md

---

## HANDOFF SUMMARY

| Command | Priority | Reason |
|---|---|---|
| LOGAN | P1 | BEHAVIOR.md authoring — full behavior contract needed |
| Engineering | P1 | TICKET-CHAT-SEC-001 — HIGH security finding remediation |
| SPIDER-MAN | P2 | Zero test coverage across 66 source files |
| LOKI | P3 | Runtime ownership map for ConversationView.jsx |
| KRAVEN | P3 | Performance bottleneck identification |
| CARNAGE | P4 | Migration ownership audit |
| Engineering | P4 | Debug module two-line fix (IRONMAN-CHAT-003) |
| SENTRY | P5 | setup.js boot-order assertion |
