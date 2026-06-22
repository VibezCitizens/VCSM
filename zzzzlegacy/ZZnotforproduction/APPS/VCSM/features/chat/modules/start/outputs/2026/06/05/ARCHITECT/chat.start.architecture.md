# ARCHITECT — chat / modules / start

**Date:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-DASHBOARD-0001
**Scanner Version:** 1.1.0
**Architecture State:** SOURCE_VERIFIED

---

## MODULE ARCHITECTURE REPORT

Module: start
Application Scope: VCSM
Module Type: chat feature sub-module — new conversation initiation
Primary Root: apps/VCSM/src/features/chat/start/
Independence Status: MOSTLY INDEPENDENT
Completeness Status: COMPLETE

---

## PURPOSE

[SOURCE_VERIFIED] The start module handles the "new conversation" flow from the owner's
perspective. A user opens a modal, searches for another actor by handle or display name,
picks one from results, and is navigated to the conversation screen.

Three files:
- `start/hooks/useStartConversation.js` — business logic hook
- `start/screens/StartConversationModal.jsx` — dumb UI modal component
- `adapters/start/hooks/useStartConversation.adapter.js` — re-export barrel

No DAL, no controller, no DB access. Fully delegates to `@chat` engine.

---

## LAYER MAP

| File | Layer | Purpose |
|---|---|---|
| start/screens/StartConversationModal.jsx | Component (dumb) | Search UI + actor list; prop-injected onSearch/onPick/onClose |
| start/hooks/useStartConversation.js | Hook | Identity resolution + engine delegation + navigation |
| adapters/start/hooks/useStartConversation.adapter.js | Adapter re-export | `export * from '...useStartConversation'` |

---

## CALL GRAPH (Source Verified)

```
InboxScreen.jsx / useProfileHeaderMessaging.js / moderation/ReportModal.jsx
  └── isNewChatModalOpen (chatUiStore) → controls modal visibility
  └── StartConversationModal [DUMB UI]
        Props: open, onClose, onPick, onSearch
        ├── onSearch(query) → wired from outside (InboxScreen provides searchActors from chat setup DI)
        │     → identity.search_actor_directory RPC (via engine DI)
        └── onPick(picked) → useStartConversation.start(picked)
              └── useStartConversation.start(picked)
                    ├── useIdentity() → identity.actorId, realmId, isVoid
                    ├── resolveRealm(isVoid) → public realm fallback
                    └── startDirectConversation(@chat engine)
                          ├── resolve target actor
                          ├── realm resolution (DI: resolveRealm + resolveActorRealmContext)
                          ├── block check (DI: checkBlockRelation → moderation.blocks)
                          ├── get-or-create direct conversation (chat.* RPC)
                          └── open conversation + ensure membership
                    └── navigate(`/chat/${conversationId}`)
```

---

## StartConversationModal — Architecture Detail

**Classification:** DUMB UI COMPONENT

- All state is local: `q` (search input), `loading`, `rows` (result list)
- `onSearch`, `onPick`, `onClose` are prop-injected — no coupling to hooks
- Actor search runs on `useEffect` keyed on `[open, query, onSearch]`
- Cancelled flag pattern prevents stale async state
- Actor kind badges: Citizen | Vport | raw kind string
- `pickDirect()` — if user presses Enter with no search results, passes raw query
  string as `{ id: query, ... }` to `onPick`. Engine must validate.
- Uses `@i18n` for copy: vox.start.title, vox.start.searchPlaceholder,
  vox.start.searching, vox.start.noResults
- Desktop portal rendering: NOT present (modal uses `fixed inset-0` — standalone overlay)

**Accessibility:** `role="dialog"`, `aria-modal="true"`, `aria-label="New Vox"`.

---

## useStartConversation — Architecture Detail

**Classification:** THIN HOOK — delegates to engine

| Step | Action |
|---|---|
| 1 | Identity guard: `!identity?.actorId` → toast.error + return |
| 2 | `resolveRealm(Boolean(identity.isVoid))` for effectiveRealmId |
| 3 | `startDirectConversation({ fromActorId, realmId, picked })` |
| 4 | `navigate('/chat/${conversationId}')` |
| Error | `console.error('[useStartConversation]', err)` + `toast.error('Failed to open chat')` |

No retry logic. No optimistic state. Simple happy-path delegate.

---

## DB ACCESS MAP

No direct DB access from this module.

`startDirectConversation` (@chat engine) performs all DB operations via engine's RPC.
Block check (`checkBlockRelation`) and realm resolution are injected DI adapters from setup.js.

---

## CONSUMER MAP

| Consumer | Import Path | Usage |
|---|---|---|
| InboxScreen.jsx | chat.adapter / chatUiStore | Opens modal via isNewChatModalOpen; wires onSearch |
| useChatInbox.js | chatUiStore | Reads isNewChatModalOpen |
| profiles/hooks/useProfileHeaderMessaging.js | chat.adapter or direct | Starts conversation from profile header |
| moderation/ReportModal.jsx | direct | Likely reads from chatUiStore to detect modal state |

---

## ROUTE MAP

| Route | Element | Confidence |
|---|---|---|
| /chat/new | StartConversationModal | UNCONFIRMED — scanner reported LOW confidence |

[SOURCE_VERIFIED] StartConversationModal is rendered as an overlay (fixed inset-0, z-[70]),
NOT as a route-mounted screen. It is controlled by `isNewChatModalOpen` in chatUiStore.
The `/chat/new` route evidence from the scanner is likely stale or refers to a removed route.
HAWKEYE verification required to confirm no `/chat/new` route registration.

---

## ARCHITECTURE ANOMALIES

| ID | Severity | Summary | Evidence |
|---|---|---|---|
| ANOM-CHAT-START-001 | LOW | console.error in useStartConversation — not DEV-gated | [SOURCE_VERIFIED] useStartConversation.js line 48 |
| ANOM-CHAT-START-002 | INFO | @RefactorBatch 2025-11 legacy annotation block in StartConversationModal | [SOURCE_VERIFIED] StartConversationModal.jsx lines 1-6 |
| ANOM-CHAT-START-003 | MEDIUM | pickDirect() passes raw query string as actor ID — no UUID validation before engine | [SOURCE_VERIFIED] StartConversationModal.jsx lines 54-61 |

**ANOM-CHAT-START-003 detail:**
```javascript
const pickDirect = () => {
  if (!query) return
  onPick?.({
    id: query,  // ← raw string, could be any value
    display_name: query,
    username: query.startsWith('@') ? query.slice(1) : query.replace(/\s+/g, ''),
  })
  onClose?.()
}
```
If user types a username string (not a UUID) and hits Enter, this is passed to the engine's
`startDirectConversation`. The engine's actor resolution step should handle invalid actor IDs,
but no defensive guard exists at this layer. VENOM should verify engine validation.

---

## INDEPENDENCE CLASSIFICATION

**MOSTLY INDEPENDENT**

Direct dependency: `@chat` engine (startDirectConversation), `@/state/identity` (useIdentity),
`@/shared/utils/resolveRealm`, `@i18n`. All go through proper boundaries.
Cross-feature dependency: `useIdentity` via identity.adapter (correct).

---

## HANDOFF RECOMMENDATIONS

| Command | Reason | Priority |
|---|---|---|
| VENOM | ANOM-CHAT-START-003: pickDirect raw-ID path — engine validation surface | P2 |
| SPIDER-MAN | Zero tests for useStartConversation; StartConversationModal untested | P3 |
| HAWKEYE | Confirm /chat/new route is not registered (StartConversationModal is UI-controlled, not route-mounted) | P3 |
