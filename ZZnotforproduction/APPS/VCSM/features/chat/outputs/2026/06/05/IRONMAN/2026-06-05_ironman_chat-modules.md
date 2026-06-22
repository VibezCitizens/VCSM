---
title: IRONMAN Ownership Report — Chat Feature Modules
scope: chat/modules/chat + chat/modules/start + chat/modules/debug
status: COMPLETE
date: 2026-06-05
ticket: TICKET-ARCHITECT-DASHBOARD-0001
---

# IRONMAN OWNERSHIP REPORT
**Scope:** VCSM — chat/modules/chat, chat/modules/start, chat/modules/debug
**Date:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-DASHBOARD-0001
**Findings Summary:** 0 CRITICAL | 2 HIGH | 3 MEDIUM | 2 LOW
**ARCHITECT Gate:** PASS — all 3 modules have ARCHITECT reports dated 2026-06-05 (0 days old)

---

## STEP 1 — ARTIFACT COMPLETENESS CHECK

| Module | ARCHITECTURE.md | SECURITY.md | BEHAVIOR.md | Status |
|---|---|---|---|---|
| chat/modules/chat | EXISTS (2026-06-05) | EXISTS (2026-06-05) | EXISTS — STUB | PARTIAL |
| chat/modules/start | EXISTS (2026-06-05) | EXISTS (2026-06-05) | EXISTS — STUB | PARTIAL |
| chat/modules/debug | EXISTS (2026-06-05) | EXISTS (2026-06-05) | EXISTS — STUB | PARTIAL |

**OWNERSHIP.md:** ABSENT across all 3 modules and feature root.

**Gap:** All BEHAVIOR.md files are STUBs — no MNH invariants defined, no TESTREQ items, no THOR gates.
This means BLACKWIDOW attacked §7 MNH using inferred invariants, not contract-sourced ones.

---

## STEP 2 — LAYER MAP EXTRACTION

### chat/modules/chat
Source root: `apps/VCSM/src/features/chat/` (root-level files, NOT chat/chat/)

| File | Layer | Purpose |
|---|---|---|
| index.js | Entry barrel | Exports InboxScreen + ConversationScreen |
| setup.js | DI config | setupVcsmChatEngine() — _configured guard — injects 9 DI deps |
| store/chatUiStore.js | Zustand UI state | selectedConversationId, isNewChatModalOpen, composerDraft, activeChatFilter |
| adapters/chat.adapter.js | Adapter | Exports useChatUnreadOps only (ANOM-CHAT-ROOT-001) |
| styles/chat-modern.css | CSS | Chat theme |

Layer counts: 0 DAL, 0 Controller, 0 Model, 1 Adapter, 0 Screen, 1 Store.
All DB reads delegated to @chat engine via DI.

### chat/modules/start
Source root: `apps/VCSM/src/features/chat/start/`

| File | Layer | Purpose |
|---|---|---|
| start/screens/StartConversationModal.jsx | Dumb UI | Actor search modal — all behavior prop-injected |
| start/hooks/useStartConversation.js | Hook | Identity guard + @chat engine delegate + navigate |
| adapters/start/hooks/useStartConversation.adapter.js | Adapter | Thin re-export barrel |

Layer counts: 0 DAL, 0 Controller, 0 Model, 1 Adapter, 1 Screen (modal), 1 Hook.
No direct DB access. Engine delegation via startDirectConversation().

### chat/modules/debug
Source root: `apps/VCSM/src/features/chat/debug/`

| File | Lines | Purpose |
|---|---|---|
| chatBadgeDebugger.js | 75 | Badge count pipeline tracer (timing + delta detection) |
| chatNavDebugger.js | 169 | Navigation state timeline recorder |

Layer counts: 0 DAL, 0 Controller, 0 Model, 0 Adapter, 0 Screen.
Pure JS utility objects. Zero imports. No DB. No React.

---

## STEP 3 — CALL GRAPH TRACING

### chat/modules/chat

```
App bootstrap
  └── setupVcsmChatEngine() [setup.js]
        ├── searchActors → identity.search_actor_directory RPC (READ)
        ├── resolveActorRealmContext → vc.actors SELECT (id, is_void) (READ)
        └── checkBlockRelation → moderation.blocks SELECT (bidirectional OR) (READ)

index.js
  └── exports InboxScreen + ConversationScreen (re-exports from sibling modules)

chatUiStore.js
  └── consumed by: InboxScreen, StartConversationModal, ConversationScreen
```

**DI Guard:** `if (_configured) return` — prevents double-setup.
**Stale risk (VEN-CHAT-007):** searchActors reads `viewerActorId` from Zustand `getState()` — snapshot at call time, not reactive.

### chat/modules/start

```
InboxScreen / useProfileHeaderMessaging
  └── chatUiStore.isNewChatModalOpen → StartConversationModal [dumb UI]
        └── onPick(picked) → useStartConversation.start(picked)
              ├── identity.actorId guard (throws if missing)
              └── startDirectConversation(@chat engine)
                    └── navigate('/chat/${conversationId}')
```

**Note:** StartConversationModal is NOT route-mounted. ARCHITECT source-verified as overlay
controlled by chatUiStore. Scanner report `/chat/new` → NewChatScreen is FALSE (ANOM-CHAT-START-003 + route-map correction).

**Unvalidated:** `picked` (actor search result) passes to engine without UUID validation at app layer.
Engine DI (resolveActorRealmContext, checkBlockRelation) is the effective trust boundary.

### chat/modules/debug

```
chatUnread.controller.js → chatBadgeDbg.startFetch() / endFetch()
ConversationView.jsx → chatNavDbg.setRoute() / push() / etc.
```

**Consumer relationship:** debug module is consumed by features it does not own.
chatBadgeDbg is consumed by chatUnread.controller.js (chat feature).
chatNavDbg is consumed by ConversationView.jsx (chat/modules/conversation).
No reverse dependency — debug utilities have no imports.

---

## STEP 4 — DATA OWNERSHIP REGISTRY

### Tables / Resources Owned by This Feature

| Table / Resource | Schema | Access Type | Owning Module | Notes |
|---|---|---|---|---|
| identity.search_actor_directory | identity | RPC READ (via DI) | chat/modules/chat | viewerActorId from Zustand getState() — stale risk (VEN-CHAT-007) |
| vc.actors | vc | SELECT id, is_void (READ, via DI) | chat/modules/chat | resolveActorRealmContext DI bridge |
| moderation.blocks | moderation | SELECT (bidirectional OR) READ (via DI) | chat/modules/chat | checkBlockRelation fails closed |
| chat.message_attachments | chat | UPDATE | chat feature (feature-level) | recordChatAttachment.controller.js — NOT in these 3 modules |
| chat.inbox_entries | chat | SELECT READ | chat feature (feature-level) | chatUnread.controller.js — NOT in these 3 modules |

**Note:** `chat.conversations`, `chat.messages`, and all other chat schema tables are owned by
`engines/chat` — NOT this feature layer. Ownership boundary is: engines/ owns chat schema reads
and subscriptions; feature layer owns VCSM-specific adapter wiring and attachment writeback.

### NOT Owned by This Feature

| Table / Resource | Schema | Real Owner |
|---|---|---|
| chat.conversations | chat | engines/chat |
| chat.messages | chat | engines/chat |
| chat.conversation_members | chat | engines/chat |
| chat.inbox_entries (reads via @chat hooks) | chat | engines/chat |

---

## STEP 5 — RULE OWNERSHIP REGISTRY

| Rule | Layer | Module | Enforcement | Status |
|---|---|---|---|---|
| @chat engine DI must be configured exactly once | DI Config | chat/modules/chat | setup.js _configured guard | ENFORCED |
| Actor identity (actorId) must be present before starting a conversation | Hook | chat/modules/start | identity.actorId check in useStartConversation | ENFORCED |
| Blocked actors must not be reachable via conversation initiation | Engine DI | chat/modules/chat | checkBlockRelation (bidirectional OR, fails closed) | ENFORCED |
| Debug utilities must not execute in production builds | Utility | chat/modules/debug | isEnabled() return gate | OPEN — build-time gate missing |
| searchActors must use current viewer identity (not stale snapshot) | DI Config | chat/modules/chat | NOT enforced — Zustand getState() is snapshot | OPEN (VEN-CHAT-007) |

---

## STEP 6 — BOUNDARY CLASSIFICATION

| Boundary | Owner | Consumes | Produces |
|---|---|---|---|
| @chat engine DI wiring | chat/modules/chat | identity search, vc.actors, moderation.blocks | engine-ready DI object |
| Conversation initiation UX | chat/modules/start | chatUiStore, @chat engine, identity adapter | new conversationId + navigation |
| Runtime debug instrumentation | chat/modules/debug | nothing (zero imports) | console timing/delta data |
| Entry barrel (InboxScreen + ConversationScreen) | chat/modules/chat | sibling modules | public screen exports |

**Cross-module consumer note:** chatNavDbg (debug module) is consumed by `chat/modules/conversation`
(ConversationView.jsx). This is a cross-module dependency from conversation → debug.
Debug module does not own conversation behavior — it is a passive utility.

---

## STEP 7 — FINDINGS

### OWN-CHT-001 — HIGH: No Feature Ownership Record

```
IRONMAN FINDING

- Finding ID:      OWN-CHT-001
- Severity:        HIGH
- Category:        Ownership Gap
- Scope:           chat feature (all 3 in-scope modules + feature root)
- Status:          OPEN

Summary:
  OWNERSHIP.md is absent at the feature root (chat/) and at all module levels.
  The feature ARCHITECTURE.md states ownership is "VCSM social domain" — this
  is not a governance record. No actor, team, or domain is formally accountable.

Impact:
  - No declared owner for the DI contract surface (setup.js)
  - Security findings (VEN-CHAT-004, VEN-CHAT-007, ELEK-2026-06-05-CD-001) have no
    assigned owner and no patch commitment chain
  - BEHAVIOR.md STUBs cannot be closed without an owner

Required Action:
  Create OWNERSHIP.md at chat/ with formal domain and module ownership declarations.

THOR Gate: CAUTION — No ownership record is a governance gap for release readiness.
```

---

### OWN-CHT-002 — HIGH: DI Contract Ownership Ambiguity

```
IRONMAN FINDING

- Finding ID:      OWN-CHT-002
- Severity:        HIGH
- Category:        Boundary Ambiguity
- Scope:           chat/modules/chat (setup.js)
- Status:          OPEN

Summary:
  setup.js owns the VCSM-specific DI bridge into @chat engine — 9 injected dependencies
  including searchActors, resolveActorRealmContext, and checkBlockRelation.
  The @chat engine is owned by engines/ domain. Neither side declares ownership of
  the DI contract interface.

Specific risk:
  VEN-CHAT-007 (LOW) — searchActors captures viewerActorId via Zustand getState()
  at DI wire-up time. This is a snapshot, not reactive. During identity switches
  (actor kind change), the injected function retains the old actorId. This is a
  VCSM-specific concern that lives in the DI shim owned by this module — but has
  no owner to close it.

Impact:
  - No actor is accountable for changes to DI-injected functions
  - Security findings in the DI surface are unowned
  - Future modifications to @chat engine injection API have no approval chain

Required Action:
  Declare chat/modules/chat as owner of the VCSM DI contract surface.
  Assign VEN-CHAT-007 patch to that owner.

THOR Gate: CAUTION — DI boundary ambiguity + unpatched stale-identity finding.
```

---

### OWN-CHT-003 — MEDIUM: All Three Module BEHAVIOR.md Files Are STUBs

```
IRONMAN FINDING

- Finding ID:      OWN-CHT-003
- Severity:        MEDIUM
- Category:        Governance Gap — Missing Contract
- Scope:           chat/modules/chat, chat/modules/start, chat/modules/debug
- Status:          OPEN

Summary:
  All three BEHAVIOR.md files are scanner-derived STUBs with no real behavioral contract.

  chat/modules/chat BEHAVIOR.md:
    - No behaviors attributed to this module
    - Scanner notes 40 total behaviors for chat feature; none are module-attributed

  chat/modules/start BEHAVIOR.md:
    - Contains stale scanner error: /chat/new → NewChatScreen (source-verified FALSE
      by ARCHITECT 2026-06-05 — StartConversationModal is not route-mounted)
    - Expected behaviors listed as "unverified"

  chat/modules/debug BEHAVIOR.md:
    - Known Constraints listed but aspirational (not source-verified)
    - No MNH invariants defined despite two MEDIUM security findings

Impact:
  - BLACKWIDOW cannot run §7 MNH attack suite from authoritative contract
  - No TESTREQ items → no regression coverage ownership
  - THOR gate analysis cannot reference behavior contract

Required Action:
  Author BEHAVIOR.md for each module from source. Minimum required sections:
  §4 Must Never Happen (MNH invariants), §5 TESTREQ items, §6 THOR gates.

THOR Gate: BLOCK — BEHAVIOR.md STUBs are release blockers for affected modules.
```

---

### OWN-CHT-004 — MEDIUM: Production Safety Rule Has No Owner

```
IRONMAN FINDING

- Finding ID:      OWN-CHT-004
- Severity:        MEDIUM
- Category:        Security Rule Ownership Gap
- Scope:           chat/modules/debug
- Status:          OPEN

Summary:
  chatBadgeDebugger.isEnabled() and chatNavDebugger.isEnabled() both default to
  return true when the window flag is not set — no build-time gate on production.

  Security findings all confirmed and open:
    VEN-CHAT-004 (MEDIUM)  — debuggers default enabled, no NODE_ENV gate
    BW-CHD-001 (LOW/PARTIAL) — runtime toggle bypass is client-side
    ELEK-2026-06-05-CD-001 (LOW) — full actorId UUID in console.log in production

  ELEKTRA patch recommendation (2026-06-05):
    Add `if (import.meta.env.PROD) return false` as first check in isEnabled().

  No OWNERSHIP.md means no actor is accountable for:
    - Applying the patch
    - Verifying the patch does not break dev tooling
    - Regression testing the production gate

Impact:
  - Open security finding with no owner closes it
  - actorId UUID exposed in production console with no accountability chain

Required Action:
  Assign patch ownership to a declared owner of chat/modules/debug.
  After patch: SPIDER-MAN regression test for production gate behavior.

THOR Gate: CAUTION — Security finding open with no patch owner.
```

---

### OWN-CHT-005 — MEDIUM: Zero Test Coverage — No Test Ownership Declared

```
IRONMAN FINDING

- Finding ID:      OWN-CHT-005
- Severity:        MEDIUM
- Category:        Test Coverage Gap
- Scope:           chat/modules/chat, chat/modules/start, chat/modules/debug
- Status:          OPEN

Summary:
  ARCHITECT reports 0 tests detected across the entire chat feature.
  No test ownership is declared for any of the three in-scope modules.

  Open TESTREQ items from security runs:
    BW-CHS-001 (LOW/UNRESOLVED) — picked actor ID validation — engine behavior unverified
    BW-CHD-001 (LOW/PARTIAL) — production debug active — runtime toggle bypass
    VEN-CHAT-007 (LOW, OPEN) — stale viewerActorId during identity switch

  No actor is accountable for authoring or maintaining tests.

Impact:
  - Regression risk is unmanaged for initiation flow and debug gate
  - Security TESTREQ items cannot be closed without test ownership

Required Action:
  Assign test ownership to a declared feature owner.
  Minimum test targets: identity guard in useStartConversation, production gate
  in chatBadgeDebugger/chatNavDebugger, block relation enforcement.

THOR Gate: CAUTION — 0 tests + unowned TESTREQ items.
```

---

### OWN-CHT-006 — LOW: Start Module Contains Stale Scanner Error in BEHAVIOR.md

```
IRONMAN FINDING

- Finding ID:      OWN-CHT-006
- Severity:        LOW
- Category:        Governance Drift
- Scope:           chat/modules/start
- Status:          OPEN

Summary:
  chat/modules/start BEHAVIOR.md references `/chat/new` → NewChatScreen with
  HIGH confidence from route-map scanner. ARCHITECT source-verified (2026-06-05)
  that StartConversationModal is a modal overlay — not route-mounted.
  HAWKEYE should audit for absence of /chat/new route registration.

Impact:
  Stale route claim may mislead future HAWKEYE, VENOM, or THOR reviewers.

Required Action:
  Update chat/modules/start BEHAVIOR.md to reflect source-verified modal pattern.
  Schedule HAWKEYE to confirm /chat/new route is not registered anywhere.
```

---

### OWN-CHT-007 — LOW: Adapter Re-exports Have No Documented Purpose

```
IRONMAN FINDING

- Finding ID:      OWN-CHT-007
- Severity:        LOW
- Category:        Boundary Clarity
- Scope:           chat/modules/chat (chat.adapter.js), chat/modules/start (useStartConversation.adapter.js)
- Status:          OPEN

Summary:
  Both adapter files are thin re-export barrels with no documented contract:
    chat.adapter.js — exports useChatUnreadOps only (ANOM-CHAT-ROOT-001)
    useStartConversation.adapter.js — re-exports useStartConversation.js

  No adapter contract documented. Unclear if these are stable public APIs or
  internal scaffolding. Future refactors may break consumers without awareness.

Impact:
  Low — no immediate security risk. Governance risk for future interface changes.

Required Action:
  Document adapter purpose and consumer list in OWNERSHIP.md adapter section.
```

---

## OWNERSHIP RECORD SUMMARY

| Finding ID | Severity | Category | Status |
|---|---|---|---|
| OWN-CHT-001 | HIGH | No OWNERSHIP.md | OPEN |
| OWN-CHT-002 | HIGH | DI contract ambiguity | OPEN |
| OWN-CHT-003 | MEDIUM | BEHAVIOR.md STUBs | OPEN |
| OWN-CHT-004 | MEDIUM | Production safety rule unowned | OPEN |
| OWN-CHT-005 | MEDIUM | 0 tests, no test owner | OPEN |
| OWN-CHT-006 | LOW | Stale route scanner error | OPEN |
| OWN-CHT-007 | LOW | Adapter re-export undocumented | OPEN |

**THOR Gate Status:** CAUTION for OWN-CHT-001, OWN-CHT-002 | BLOCK for OWN-CHT-003
(BEHAVIOR.md STUBs with no MNH contract = release blocker)

---

## REQUIRED FOLLOW-UP COMMANDS

| Command | Reason | Priority |
|---|---|---|
| Wolverine | Author BEHAVIOR.md for chat, start, debug modules from source | HIGH |
| Wolverine | Apply import.meta.env.PROD patch to chatBadgeDebugger + chatNavDebugger | HIGH |
| SPIDER-MAN | Test: identity guard, production gate, block enforcement | MEDIUM |
| HAWKEYE | Confirm /chat/new route is NOT registered anywhere in the app | LOW |
| THOR | Evaluate release readiness after BEHAVIOR.md authored + debug patch applied | POST-FIX |
