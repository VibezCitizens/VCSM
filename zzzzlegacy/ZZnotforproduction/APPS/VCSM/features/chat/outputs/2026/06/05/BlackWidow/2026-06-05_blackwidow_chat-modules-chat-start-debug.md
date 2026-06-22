# BLACKWIDOW Runtime Adversarial Report

Date: 2026-06-05
Scope: VCSM
Reviewer: BLACKWIDOW
Modules: chat/modules/chat (root), chat/modules/start, chat/modules/debug
Ticket: TICKET-ARCHITECT-DASHBOARD-0001
Governance Status: DRAFT

---

## BLACKWIDOW PREFLIGHT PASS

Upstream Report:
- VENOM: ZZnotforproduction/APPS/VCSM/features/chat/outputs/2026/06/05/Venom/2026-06-05_venom_chat-modules-chat-start-debug.md
  Scope: VCSM — chat modules (root, start, debug)
  Date: 2026-06-05
  Status: SUCCESS
  Age: 0 days

Proceeding with BLACKWIDOW adversarial review.

---

## Attack Surface Summary

| Surface | Module | Type | VENOM Ref |
|---|---|---|---|
| StartConversationModal.pickDirect() — raw string actor ID | start | Input validation bypass | VEN-CHAT-006 |
| searchActors() — viewerActorId from Zustand getState() | chat-root | Session race | VEN-CHAT-007 |
| chatBadgeDebugger.isEnabled() / chatNavDebugger.isEnabled() | debug | Debug exposure | VEN-CHAT-004 |

---

## Simulated Threat Scenarios

### Scenario A — SQL/Parameter Injection via pickDirect()

Attack: Type a SQL injection payload (`'; DROP TABLE actors; --`) into StartConversationModal search field → press Enter without selecting a result → `pickDirect()` passes raw string as actor ID to engine

Chain traced:
```
query = "'; DROP TABLE actors; --"
→ pickDirect(): { id: query, ... }
→ onPick(picked) → useStartConversation.start(picked)
→ startDirectConversation({ fromActorId, realmId, picked })
→ resolveActorRealmContext({ actorId: "'; DROP TABLE actors; --" })
→ supabase.from('actors').select('id,is_void').eq('id', actorId)
  → PostgREST filter parameter: URL-encoded → parameterized query
  → PostgreSQL rejects malformed UUID with type error
  → Error thrown → startDirectConversation fails
→ useStartConversation catch → toast.error('Failed to open chat')
```

**Result: BLOCKED**

Evidence: PostgREST `.eq()` generates parameterized query parameters via the REST API; the value is URL-encoded and passed as a filter value, not interpolated into SQL. PostgreSQL's UUID column type enforcement rejects the malformed input at the DB layer. No SQL injection path exists.

However: The app-layer has no UUID validation guard. Defense is entirely DB-layer. Undefined error behavior at app layer (toast.error) is the only user-visible outcome.

---

### Scenario B — Search Visibility Bypass via Direct UUID Addressing

Attack: Attacker (authenticated Citizen) knows the UUID of an actor that `identity.search_actor_directory` would not return in search results (e.g., a deactivated, private, or RPC-filtered actor). Attacker types UUID directly into StartConversationModal search field → presses Enter → `pickDirect()` constructs `{ id: uuid, ... }` bypassing the search RPC entirely.

Chain traced:
```
query = "550e8400-e29b-41d4-a716-446655440000"  // known target UUID
→ pickDirect(): { id: "550e8400-...", display_name: "550e8400-...", username: "550e8400..." }
→ useStartConversation.start(picked)
→ startDirectConversation({ fromActorId, realmId, picked: { id: "550e8400-..." } })
→ checkBlockRelation(fromActorId, "550e8400-...") → isUuid("550e8400-...") = true
   → queries moderation.blocks → IF block exists: returns true → engine rejects
   → IF no block: returns false → engine continues
→ resolveActorRealmContext({ actorId: "550e8400-..." }) → valid UUID → vc.actors lookup
→ IF actor exists: realm resolved → conversation get-or-created
→ navigate('/chat/${conversationId}')
```

**Result: BYPASSED (for actors with no block relationship)**

Evidence:
- `checkBlockRelation` validates UUID format AND checks `moderation.blocks` — this defense HOLDS
- BUT: `checkBlockRelation` only checks block relationships. Actors that are excluded from `identity.search_actor_directory` results for OTHER reasons (deactivated, private realm, RPC-filtered) would pass the block check and proceed to conversation creation.
- `resolveActorRealmContext` returns `data ?? null` — if actor does not exist, returns null → engine must handle null realm gracefully
- If target actor is deactivated but still exists in DB, realm resolves, conversation created

**Critical gap:** The search RPC filters actors by viewer context (blocked actors, potentially private/deactivated). `pickDirect()` bypasses the search RPC entirely. Any actor that passes `checkBlockRelation` (not mutually blocked) AND exists in `vc.actors` can receive a conversation initiation — regardless of their visibility in search results.

Exploitation requires knowing the target UUID. UUID discoverability in VCSM depends on other surfaces (conversation URLs at `/chat/[UUID]` per BW-CHAT-003, API responses, etc.).

---

### Scenario C — Identity-Switch Race: Stale viewerActorId in searchActors

Attack: Authenticated user has two actors: Actor A (has blocked Actor B) and Actor C (VPORT, has NOT blocked Actor B). User is currently Actor A. User opens StartConversationModal and begins typing Actor B's name. Simultaneously, user triggers identity switch to Actor C.

Race window:
```
[t=0] User is Actor A, types query "B..."
[t=50ms] Identity switch initiated → identityStore begins updating
[t=75ms] searchActors(query) called → getState().activeActorId = Actor C (new, if switch is fast)
[t=100ms] identity.search_actor_directory(p_viewer_actor_id: Actor C, ...) → Actor B appears
[t=125ms] User sees Actor B in results (Actor A's block not applied)
[t=150ms] User clicks Actor B → useStartConversation.start(picked)
[t=175ms] identity = useIdentity() → now returns Actor C (switch complete)
→ startDirectConversation({ fromActorId: Actor C, ... })
→ checkBlockRelation(Actor C, Actor B) → no block → PASSES
→ Conversation created between Actor C and Actor B (valid from Actor C perspective)
```

**Result: PARTIAL**

Evidence:
- Race condition is timing-dependent — requires identity switch AND search to overlap in milliseconds
- Search result leak (Actor B visible under Actor A's session): BYPASSED for the brief window
- Conversation creation: VALID from Actor C perspective (Actor C has not blocked Actor B)
- The final state is not an unauthorized write — Actor C CAN message Actor B
- The "attack" achieves: brief visibility of a blocked actor's name in search results, followed by a valid conversation creation from the switched identity
- No persistent authorization bypass; no cross-actor ownership violation

Severity: LOW — timing-dependent, limited to own session, results in valid (not unauthorized) conversation

---

### Scenario D — Debug Utilities Production Activation Re-Verification

Attack: Verify that `chatBadgeDebugger` and `chatNavDebugger` default to enabled in production and expose actorId fragments via console output.

Chain verified from ARCHITECT source (2026-06-05):
```
// chatBadgeDebugger.js:18-20 — SOURCE_VERIFIED
function isEnabled() {
  if (typeof window === 'undefined') return false
  if (typeof window.__CHAT_BADGE_DEBUG === 'boolean') return window.__CHAT_BADGE_DEBUG
  return true  // ← DEFAULT ON: no NODE_ENV check
}

// chatNavDebugger.js:43-46 — SOURCE_VERIFIED  
function isEnabled() {
  if (typeof window === 'undefined') return true  // SSR: ALSO true
  if (typeof window.__CHAT_NAV_DEBUG === 'boolean') return window.__CHAT_NAV_DEBUG
  return true  // ← DEFAULT ON: no NODE_ENV check
}
```

Call sites that confirm production activation:
- `chatUnread.controller.js` → `chatBadgeDbg.startFetch(actorId)` / `endFetch(token, count)`
- `bootstrap.invalidate.js` → `chatBadgeDbg.invalidate(reason)`  
- `ConversationView.jsx` → `chatNavDbg.startRun(...)` / `mark(...)` / `endRun(...)`

The ELEK-2026-06-04-009 classified this as INFO noting "call sites are currently guarded." This conflicts with BW-CHAT-005 (BYPASSED). BLACKWIDOW re-verification confirms: the MODULE-LEVEL `isEnabled()` is unguarded. Whether each CALL SITE has its own `import.meta.env.DEV` guard is outside the debug module's scope but is the key safety question.

**Result: STILL_OPEN_SOURCE_VERIFIED** — module-level guard is confirmed absent; call-site guards require separate ELEKTRA trace

---

## Ownership Bypass Results

**OWNERSHIP BYPASS ATTEMPT**
Target: StartConversationModal.pickDirect() → engine conversation creation
Attack vector: Direct UUID of another actor (no block) → bypass search visibility gate
Result: BYPASSED — actors excluded from search for non-block reasons (deactivated, private) can be directly addressed
Controller gate: WEAK — checkBlockRelation is present (good) but only checks block; search visibility policy not enforced at controller
Severity: MEDIUM

---

## Session Mutation Results

**SESSION MUTATION ATTEMPT**
Target: searchActors() viewerActorId sourcing
Attack vector: Identity switch during active search query
Result: PARTIAL — brief viewer context mismatch; resulting conversation is valid from new actor
Session binding: WEAK — Zustand getState() at call time; not re-validated against Supabase auth token
Severity: LOW

---

## Runtime Abuse Results

No privileged mutation paths in these 3 modules (no admin/moderation/owner-only writes).
chat/start delegates all writes to @chat engine. Module-level runtime abuse: N/A.

---

## Viewer Context Fuzz Results

**VIEWER CONTEXT FUZZ ATTEMPT**
Target: resolveActorRealmContext({ actorId }) in setup.js
Injected context: Non-UUID string (from pickDirect() raw query)
Expected result: ERROR
Actual result: DB error (PostgreSQL rejects non-UUID value in UUID-typed eq filter) → null return
Context validation: ABSENT at app layer — DB-layer error handling is the only protection
Severity: MEDIUM (per VEN-CHAT-006)

---

## Search Abuse Results

**SEARCH ABUSE ATTEMPT (Scenario B)**
Target: identity.search_actor_directory via searchActors() + pickDirect() bypass
Attack vector: Type known UUID directly into StartConversationModal → press Enter
Visibility gate: ENFORCED for actors returned by search RPC; BYPASSED via pickDirect() direct UUID path
Result: BYPASSED — actors not returned by search RPC can be addressed directly if UUID known
Evidence: pickDirect() constructs picked object from raw input; no search-result validation
Severity: MEDIUM

---

## Successful Exploit Chains

### BW-CHAT-009 — Search Visibility Bypass via Direct UUID

```
Attacker knows target UUID (from conversation URL, API response, etc.)
→ Types UUID into StartConversationModal search field
→ No search results returned (actor filtered by RPC)
→ Presses Enter → pickDirect() fires
→ Engine receives picked.id = valid UUID
→ checkBlockRelation: passes (no mutual block)
→ resolveActorRealmContext: actor exists → realm resolved
→ Conversation created → attacker messaged actor they couldn't "find"
```

Chain type: Single-step exploit (one visibility gate missing — pickDirect allows direct UUID)
Severity: MEDIUM
Status: DRAFT

---

## Failed Exploit Chains (Defenses That Held)

### SQL Injection via pickDirect() — BLOCKED

PostgREST parameterized query generation blocks all SQL injection through `.eq()` filters.
UUID-typed PostgreSQL columns reject malformed values at the DB layer.
Engine error handling catches and propagates DB errors gracefully.

### Identity Switch Full Bypass — PARTIAL ONLY

The identity-switch race (Scenario C) produces a valid conversation from the switched identity.
No unauthorized write demonstrated. No persistent authorization bypass.
The brief search visibility leak is the only adverse outcome.

---

## BLACKWIDOW FINDINGS

---

### BW-CHAT-009

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-CHAT-009
- **Scenario:** Search visibility bypass via direct UUID addressing in pickDirect()
- **Target:** `apps/VCSM/src/features/chat/start/screens/StartConversationModal.jsx:54-61` — `pickDirect()` + `identity.search_actor_directory` bypass
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Attack Vector:** Type valid UUID directly into search field → Enter without selecting row → engine receives UUID bypassing search RPC filters
- **Exploit Chain Type:** Single-step exploit (one visibility gate missing)
- **Governance Status:** DRAFT
- **Result:** BYPASSED
- **Evidence:**
  ```javascript
  // pickDirect() — no search-result gate, no RPC validation
  const pickDirect = () => {
    if (!query) return
    onPick?.({
      id: query,       // ← can be any valid UUID
      ...
    })
    onClose?.()
  }
  ```
  Engine path: `checkBlockRelation` enforces block check (HOLDS) but does NOT enforce `identity.search_actor_directory` visibility filters. An actor excluded from search for reasons other than mutual block (e.g., deactivated account, private realm, RPC visibility policy) passes the block check and proceeds to conversation creation.
- **Defense Gate:** PARTIAL — block check PRESENT; search visibility enforcement ABSENT at engine
- **Blast Radius:** Single actor (attacker's own conversation); target receives unexpected message from actor that "found" them despite being hidden in search
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** VEN-CHAT-006 (pickDirect raw actor ID)
- **Recommended Fix:** One of:
  1. Remove `pickDirect()` entirely — require selecting a result row. This is the safest approach.
  2. Enforce UUID format validation AND require the UUID to have appeared in the search results set (not just any UUID).
  3. Add an actor existence + visibility check at the engine layer before conversation creation (e.g., verify actor is reachable from viewer's context via same RPC).
- **Layer to Fix:** UI (StartConversationModal — remove pickDirect), Engine (add actor reachability check)
- **Required Follow-up Command:** ELEKTRA (trace pickDirect → engine path; verify actor existence gate in startDirectConversation)

---

### BW-CHAT-010

**BLACKWIDOW ADVERSARIAL FINDING**

- **Finding ID:** BW-CHAT-010
- **Scenario:** pickDirect() malformed UUID — DB error behavior under non-UUID input
- **Target:** `apps/VCSM/src/features/chat/start/screens/StartConversationModal.jsx:54-61` + engine DI resolvers
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Attack Vector:** Type non-UUID string (or SQL injection payload) into search field → Enter → engine DI resolver receives malformed actor ID
- **Exploit Chain Type:** Injection exploit (malformed parameter accepted by app layer, rejected at DB layer)
- **Governance Status:** DRAFT
- **Result:** PARTIAL — SQL injection BLOCKED by parameterized queries; DB-layer error terminates chain; no exploit achieved; undefined error behavior exposed
- **Evidence:**
  - SQL injection: BLOCKED — PostgREST parameterized query prevents interpolation
  - Malformed UUID: DB rejects → engine error → `toast.error('Failed to open chat')` — no security breach
  - App-layer validation: ABSENT — no UUID format check in pickDirect() or useStartConversation
  - DB-layer is the effective validation boundary — acceptable for error containment, not ideal for defense in depth
- **Defense Gate:** PRESENT (DB-layer) — WEAK (app-layer absent)
- **Blast Radius:** Single actor (attacker's own session — failed conversation creation attempt)
- **Severity:** LOW — no exploit achieved; SQL injection fully blocked; behavior is degraded UX, not a security breach
- **VENOM Finding Cross-Reference:** VEN-CHAT-006 (pickDirect raw actor ID)
- **Recommended Fix:** Add UUID format validation in `pickDirect()` before constructing the picked object:
  ```javascript
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const pickDirect = () => {
    if (!query || !UUID_REGEX.test(query)) return
    onPick?.({ id: query, ... })
  }
  ```
  Or: remove `pickDirect()` (preferred — see BW-CHAT-009 recommendation).
- **Layer to Fix:** UI (StartConversationModal)
- **Required Follow-up Command:** ELEKTRA (confirm no secondary injection path via username/display_name fields in picked object)

---

### BW-CHAT-005 Re-verification (VEN-CHAT-004)

**Finding:** chatBadgeDebugger / chatNavDebugger isEnabled() defaults to true — no NODE_ENV guard
**Re-verification Result:** STILL_OPEN_SOURCE_VERIFIED
**Source Evidence:** chatBadgeDebugger.js:19-20, chatNavDebugger.js:44-45 — confirmed from ARCHITECT pass (2026-06-05)
**ELEK conflict:** ELEK-2026-06-04-009 classified as INFO noting call sites are "currently guarded." BLACKWIDOW cannot confirm call-site guards from this module's scope — this requires ELEKTRA to trace each call site.
**Status:** OPEN — module-level default is unguarded; call-site verification delegated to ELEKTRA

---

## Recommended Fixes

| Finding | Fix | Layer | Priority |
|---|---|---|---|
| BW-CHAT-009 | Remove pickDirect() or add actor reachability check at engine layer | UI / Engine | P2 |
| BW-CHAT-010 | Add UUID regex validation in pickDirect() (or remove entirely) | UI | P2 |
| BW-CHAT-005 (re-verify) | Add NODE_ENV guard to isEnabled() in both debuggers | Debug module | P2 |

---

## Required Follow-up Commands

| Command | Reason | Priority |
|---|---|---|
| ELEKTRA | Trace pickDirect() → engine actor existence gate; confirm call-site DEV guards for debuggers | P1 |
| VENOM | BW-CHAT-009 is a new finding — add to VENOM findings as cross-reference | P2 |
| SPIDER-MAN | No test for pickDirect() behavior; no test for searchActors viewerActorId race | P3 |
| HAWKEYE | Confirm identity.search_actor_directory RPC visibility policy (deactivated, private realm actors) | P3 |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| ELEKTRA | Source→sink trace: pickDirect → engine; debugger call-site guards | PENDING (next in chain) |
| THOR | BW-CHAT-009 is MEDIUM — not a THOR blocker given BW-CHAT-001/002 are higher priority | PENDING |

---

## Summary

**New findings this run: 2 (BW-CHAT-009, BW-CHAT-010)**
- 0 CRITICAL
- 0 HIGH
- 1 MEDIUM (BYPASSED — search visibility bypass)
- 1 LOW (PARTIAL — SQL injection blocked, undefined error behavior)

**Re-verified: 1 (BW-CHAT-005 — STILL_OPEN_SOURCE_VERIFIED)**

**THOR Release Blocker:** NO new THOR blockers from this run.
Existing blockers BW-CHAT-001 (HIGH), BW-CHAT-002 (HIGH) from 2026-06-04 remain in force.
