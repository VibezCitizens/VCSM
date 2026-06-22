# VENOM — chat modules: chat (root), start, debug

**Date:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-DASHBOARD-0001
**Trigger:** User-requested security pass on 3 newly ARCHITECT-completed chat modules
**ARCHITECT evidence:** TICKET-ARCHITECT-DASHBOARD-0001 (2026-06-05)
**Prior security baseline:** 2026-06-04 VENOM/ELEKTRA/BLACKWIDOW run (VEN-CHAT-001 through VEN-CHAT-005 open)

---

## VENOM TARGET

Feature / Route / Engine: chat (feature root: setup.js, chatUiStore.js) / chat/start / chat/debug
Application Scope: VCSM
Reason for review: ARCHITECT completed 2026-06-05; queued security findings from ARCHITECT report
Primary trust boundary: Authenticated Citizen → @chat engine → DB

---

## REVIEW SCOPE

This pass covers ONLY the 3 newly traced modules:
- `apps/VCSM/src/features/chat/` root files (index.js, setup.js, chatUiStore.js, adapters/chat.adapter.js)
- `apps/VCSM/src/features/chat/start/` (useStartConversation.js, StartConversationModal.jsx)
- `apps/VCSM/src/features/chat/debug/` (chatBadgeDebugger.js, chatNavDebugger.js)

Prior findings VEN-CHAT-001 through VEN-CHAT-005 remain open. This run adds VEN-CHAT-006 and VEN-CHAT-007.

---

## SECURITY SURFACE

### chat/chat (feature root)

| Entry Point | Auth Source | Authorization Layer | Identity Surface | Sensitive Objects |
|---|---|---|---|---|
| setupVcsmChatEngine() — called from main.jsx | N/A — startup function | None — DI bridge only | activeActorId from Zustand (getState) | actorId fragments, vc.actors, moderation.blocks |
| chatUiStore.js | None | None | None — UI state only | isNewChatModalOpen, composerDraft |
| chat.adapter.js | None | None | None | useChatUnreadOps |

### chat/start

| Entry Point | Auth Source | Authorization Layer | Identity Surface | Sensitive Objects |
|---|---|---|---|---|
| StartConversationModal (via isNewChatModalOpen) | Prop-injected | None — UI only | None | Search query string |
| useStartConversation.start() | useIdentity() → identity.actorId | Identity guard (presence check only) | actorId, realmId | picked actor ID |

### chat/debug

| Entry Point | Auth Source | Authorization Layer | Identity Surface | Sensitive Objects |
|---|---|---|---|---|
| chatBadgeDbg (console logging) | None | window.__CHAT_BADGE_DEBUG flag | actorId slice in logs | badge count, timing |
| chatNavDbg (console logging) | None | window.__CHAT_NAV_DEBUG flag | conversationId, navigation state | run timeline data |

---

## TRUST BOUNDARY TRACE

### chat/start — pickDirect() path

```
User types query → presses Enter (no result selected)
  → StartConversationModal.pickDirect()
       id: query  ← RAW INPUT, not validated as UUID
  → onPick({ id: query, display_name: query, username: ... })
  → useStartConversation.start(picked)
  → startDirectConversation(@chat engine) ← engine receives picked.id as target actor ID
  → resolveActorRealmContext({ actorId: picked.id })  ← vc.actors SELECT .eq('id', actorId)
```

Validated at: NOT at app layer; engine/DB is last line of defense
Identity resolved at: Engine (startDirectConversation)
Authorization enforced at: Engine (block check via DI)

### chat/setup.js — searchActors viewer context

```
User types in StartConversationModal search box
  → onSearch(query) → searchActors(query) [from chat DI setup]
  → useIdentitySelectionStore.getState().activeActorId  ← Zustand getState() at call time
  → identity.search_actor_directory(p_viewer_actor_id: activeActorId, ...)
```

Identity resolved at: Zustand store getState() at call time (synchronous read)
Risk: During identity switch, getState() may return transitioning actorId

---

## SECURITY RISK FINDINGS

---

### VEN-CHAT-006

**VENOM SECURITY FINDING**

- **Finding ID:** VEN-CHAT-006
- **Location:** `apps/VCSM/src/features/chat/start/screens/StartConversationModal.jsx:54-61` — `pickDirect()` method
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Citizen input → engine actor resolution — no app-layer validation
- **Contract Violated:** Software Development Security — unvalidated user input passed to engine
- **Current behavior:**
  ```javascript
  const pickDirect = () => {
    if (!query) return
    onPick?.({
      id: query,            // ← raw input string — may not be a UUID
      display_name: query,
      username: query.startsWith('@') ? query.slice(1) : query.replace(/\s+/g, ''),
    })
    onClose?.()
  }
  ```
  When the user types a search term and presses Enter without selecting a result row,
  `pickDirect()` constructs a `picked` object using the raw `query` string as the actor ID.
  This unvalidated string is passed to `useStartConversation.start(picked)` → `startDirectConversation(@chat engine)`.
  The engine's DI adapter `resolveActorRealmContext({ actorId: query })` then issues:
  `.from('actors').select('id,is_void').eq('id', actorId)` with a non-UUID actorId.
  PostgREST/Supabase will throw an error on a malformed UUID in an eq() filter.
- **Risk:**
  1. Silent engine failure: startDirectConversation fails internally with a DB error on the resolveActorRealmContext call. The error propagates back to useStartConversation.start() as a thrown exception → toast.error displayed to user. No security breach, but undefined behavior.
  2. If the engine has any code path that inserts the raw actor ID into a DB record without UUID validation (e.g., as a participant in a conversation), database integrity could be violated.
  3. The `checkBlockRelation` DI function has explicit isUuid() validation — it will fail closed for non-UUID inputs. `resolveActorRealmContext` does NOT have this guard.
- **Severity:** MEDIUM
- **Exploitability:** LOW — attacker must be authenticated; must discover and use the Enter key path; impact is self-affecting (own session only); no cross-actor write risk identified.
- **Attack Preconditions:**
  - Authenticated Citizen account
  - Access to StartConversationModal (requires inbox access)
  - Knowledge that pressing Enter without selecting a result triggers `pickDirect()`
- **Blast Radius:** Single actor (attacker's own conversation creation attempt); no cross-actor impact
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE — a malformed UUID query would fail at DB before any RLS evaluation
- **Why it matters:** Defense in depth requires input validation at the app layer, not just relying on DB errors to catch malformed input. The engine's DI resolvers should not be the first validation layer for user-supplied strings.
- **Recommended mitigation:**
  ```javascript
  // In pickDirect() — add UUID format check before passing to engine
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const pickDirect = () => {
    if (!query) return
    // Only allow direct pick if query looks like a UUID (actor ID search)
    // Otherwise it's a display name / username — require a selected row
    if (!UUID_REGEX.test(query)) return
    onPick?.({ id: query, ... })
    onClose?.()
  }
  ```
  Alternatively: disable `pickDirect()` entirely and require actor row selection. This is the safer UX pattern — actors should be selected from search results, not typed by ID.
- **Rationale:** App-layer validation prevents relying on DB errors for control flow and makes the actor resolution contract explicit.
- **Follow-up command:** ELEKTRA (source→sink trace: query → pickDirect → engine DI resolvers)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Identity and Access Management

---

### VEN-CHAT-007

**VENOM SECURITY FINDING**

- **Finding ID:** VEN-CHAT-007
- **Location:** `apps/VCSM/src/features/chat/setup.js:45-50` — `searchActors` function
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase RPC
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Viewer identity context → RPC execution — stale identity during switch
- **Contract Violated:** Identity and Access Management — viewer context may not match session actor
- **Current behavior:**
  ```javascript
  async function searchActors(query, limit = 12) {
    const viewerActorId = useIdentitySelectionStore.getState().activeActorId ?? null
    // ...
    .rpc('search_actor_directory', {
      p_viewer_actor_id: viewerActorId,
      // ...
    })
  }
  ```
  `searchActors` reads `activeActorId` from Zustand store synchronously at call time.
  During an identity switch (e.g., switching from user actor to VPORT actor), the store
  may be in a transitional state where `activeActorId` does not match the actor whose
  session is enforced by the Supabase auth token.
- **Risk:**
  The `identity.search_actor_directory` RPC uses `p_viewer_actor_id` to filter results
  (e.g., excluding blocked actors from the viewer's perspective). If `viewerActorId` is
  stale or incorrect during identity transition, the search may return actors that should
  be hidden (blocked by the real session actor) or fail to return actors that should be
  visible. This is a viewer-context desynchronization risk — not an authorization bypass
  (the Supabase auth session still enforces the correct DB-level policies).
- **Severity:** LOW — affects search result accuracy during identity switch window only; no write authority, no persistent state damage
- **Exploitability:** LOW — requires deliberate identity switching concurrent with search execution; timing-dependent; self-affecting only
- **Attack Preconditions:**
  - Authenticated user with multiple actor identities (user actor + VPORT actor)
  - Active identity switch in progress
  - Concurrent search execution in StartConversationModal
- **Blast Radius:** Single actor (viewer's own search results for one query execution)
- **Identity Leak Type:** Actor correlation — normally-hidden actors (blocked) may briefly appear in search results
- **Cache Trust Type:** None
- **RLS Dependency:** NONE — RPC enforces its own visibility policy server-side; this is viewer-context contamination only
- **Why it matters:** The viewer actor context passed to search RPCs should be stable and match the active session. Stale identity context degrades privacy controls (block enforcement) during identity transition windows.
- **Recommended mitigation:**
  Pass `viewerActorId` as a parameter rather than reading from Zustand inside the DI function. The engine calls `searchActors(query)` — the call site does not provide actor context. The fix requires either:
  1. Thread `viewerActorId` through the engine's searchActors call signature, or
  2. At the engine call site, ensure identity switch is not in progress before calling search (a loading gate).
  As a minimal fix: the `_configured` flag means `setupVcsmChatEngine()` runs once at startup, so the entire `searchActors` closure is frozen — adding a `getState()` call at a stable post-mount moment (e.g., via a reactive subscription) would help. This is an architectural concern for the engine DI pattern.
- **Rationale:** Viewer context for privacy-sensitive RPCs (actor search, filtered feeds) should use a stable, verified identity, not a transitional Zustand snapshot.
- **Follow-up command:** SPIDER-MAN (test for identity-switch race condition in actor search)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering

---

## EXISTING FINDING RE-VERIFICATION

### VEN-CHAT-004 — debug module default-enabled (STILL OPEN)

Source-verified again by 2026-06-05 ARCHITECT run:
- `chatBadgeDebugger.js:18-20`: isEnabled() returns `true` when `window.__CHAT_BADGE_DEBUG` is not set
- `chatNavDebugger.js:43-46`: isEnabled() returns `true` when `window.__CHAT_NAV_DEBUG` is not set
- Neither checks `process.env.NODE_ENV`

Status: STILL_OPEN_SOURCE_VERIFIED. No fix applied since 2026-06-04.

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-CHAT-006 | pickDirect() unvalidated actor ID | UI (StartConversationModal) | P2 | App | ELEKTRA |
| VEN-CHAT-007 | searchActors stale viewerActorId | Engine DI / Shared | P3 | App | SPIDER-MAN |
| VEN-CHAT-004 (re-verified) | Debug utils default enabled in prod | UI / Documentation | P2 | App | (existing) |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 0 | — |
| Asset Security | 0 | — |
| Security Architecture and Engineering | 1 | VEN-CHAT-007 (secondary) |
| Communication and Network Security | 0 | — |
| Identity and Access Management | 2 | VEN-CHAT-006 (secondary), VEN-CHAT-007 (primary) |
| Security Assessment and Testing | 0 | — |
| Security Operations | 1 | VEN-CHAT-004 re-verified (debug exposure) |
| Software Development Security | 1 | VEN-CHAT-006 (primary) |

Uncovered domains for this module scope:
- Security and Risk Management — N/A: no policy/governance issues in these modules
- Asset Security — N/A: no sensitive data retention in these modules
- Communication and Network Security — N/A: no route/RPC exposure in these modules
- Security Assessment and Testing — noted: zero tests for useStartConversation; zero tests for debug utilities

---

## FINDINGS SUMMARY

| ID | Severity | Module | Status | Description |
|---|---|---|---|---|
| VEN-CHAT-006 | MEDIUM | chat/start | OPEN | pickDirect() passes raw query string as actor ID — no UUID validation |
| VEN-CHAT-007 | LOW | chat/chat (setup) | OPEN | searchActors reads stale viewerActorId from Zustand during identity switch |
| VEN-CHAT-004 | MEDIUM | chat/debug | STILL OPEN | Debug utils default enabled in prod — re-verified source |

**New findings this run: 2 (0 CRITICAL, 0 HIGH, 1 MEDIUM, 1 LOW)**
**Cumulative open findings (this run + 2026-06-04): 7 open findings, Highest: HIGH (VEN-CHAT-001, VEN-CHAT-002)**
**THOR Release Blocker: YES — VEN-CHAT-001, VEN-CHAT-002 (from 2026-06-04 run, still open)**
