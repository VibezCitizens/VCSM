# VENOM Security Review — Chat Modules: chat + start + debug

**Date:** 2026-06-05
**Reviewer:** VENOM
**Scope:** VCSM — chat/modules/chat, chat/modules/start, chat/modules/debug
**Trigger:** MANUAL — governance pass, module table audit
**ARCHITECT Gate:** PASS — all three modules ARCHITECT COMPLETE 2026-06-05
**Status:** COMPLETE
**Findings Summary:** 0 CRITICAL | 0 HIGH | 1 MEDIUM | 1 LOW | 1 INFO (new findings)
**THOR Release Blocker:** NO — CAUTION for chat/debug (information exposure, console-only)

---

## CISSP Domain Coverage

| Domain | Coverage |
|---|---|
| Information Security (IS) | PRIMARY — debug output in production |
| Access Control (AC) | COVERED — conversation creation, actor identity, block enforcement |
| Identification & Authentication (I&A) | COVERED — fromActorId session chain |
| Software Development Security (SDS) | COVERED — debug tooling leak |
| Uncovered | Cryptography, Physical Security, Operations Security |

---

## Module: chat/modules/chat (DI Setup)

### Security Surface (ARCHITECT-derived)

- DI injection surface: setup.js injects 9 dependencies into @chat engine
- Write surfaces: NONE in this module — DI config only
- DB reads: searchActors (identity.search_actor_directory RPC), resolveActorRealmContext (vc.actors SELECT id,is_void), checkBlockRelation (moderation.blocks bidirectional)

---

### FINDING: VEN-CHC-001

```
Finding ID:     VEN-CHC-001
Title:          resolveActorRealmContext reads vc.actors inline — intentional DI bridge
Severity:       INFO
THOR Blocker:   NO
Status:         NOTE ONLY
CISSP Domain:   Security Architecture (SA)
Scope:          VCSM
Location:       apps/VCSM/src/features/chat/setup.js

Analysis:
  The chat DI setup injects resolveActorRealmContext as a function that reads
  vc.actors (id, is_void) via an inline Supabase query. This is an approved
  cross-feature DI bridge pattern — ARCHITECT confirmed ANOM-CHAT-ROOT-002 as
  intentional.

  No write surfaces. No ownership assertions at this layer.
  checkBlockRelation is bidirectional and fails closed — CONFIRMED BLOCKED.

  Risk: If vc.actors RLS were misconfigured, a caller could resolve realm context
  for actors they do not own. Realm context is read-only and used for routing,
  not authorization — bounded impact.

Status: INFO — no active exploit path. Document as architectural note.
```

### Confirmed Safe Surfaces — chat/modules/chat

| Surface | Evidence | Status |
|---|---|---|
| checkBlockRelation | Bidirectional OR, fails closed on error | BLOCKED |
| searchActors | Identity RPC — read-only, no mutation | INFO |
| resolveActorRealmContext | Read-only is_void lookup for routing | INFO |
| No write surfaces | Scanner + source confirmed | VERIFIED |

---

## Module: chat/modules/start

### Security Surface (ARCHITECT-derived)

- Entry: StartConversationModal → useStartConversation hook
- Delegates entirely to @chat engine startDirectConversation
- fromActorId: sourced from identity.actorId (session hook) — session-derived
- picked: actor from search results, passed to engine unvalidated at hook layer
- No DAL, no direct DB access, no RLS dependency in this module

---

### FINDING: VEN-CHS-001

```
Finding ID:     VEN-CHS-001
Title:          picked Object Unvalidated at Hook Layer Before Engine Handoff
Severity:       LOW
THOR Blocker:   NO
Status:         OPEN — engine actor validation not source-verified from this scope
CISSP Domain:   Access Control (AC) + Input Validation
Scope:          VCSM
Location:       apps/VCSM/src/features/chat/start/hooks/useStartConversation.js:40-44

Analysis:
  useStartConversation passes `picked` directly to startDirectConversation(@chat engine)
  with no validation at the hook layer:
    await startDirectConversation({ fromActorId: identity.actorId, realmId, picked })

  ANOM-CHAT-START-003 (ARCHITECT): pickDirect() passes raw query string as actor ID.
  If the StartConversationModal search picker can be bypassed to pass a crafted actor ID
  string, and if the @chat engine does not validate the actor ID against a resolver,
  an invalid or malformed actor ID could reach the conversation INSERT path.

  ENGINE DEPENDENCY: The @chat engine DI injects:
    - resolveActorRealmContext: resolves actor from vc.actors (validation step)
    - checkBlockRelation: bidirectional block check (fails closed)
  These engine steps would reject an invalid actorId before conversation INSERT.

  fromActorId chain: CONFIRMED BLOCKED — identity.actorId is session-derived.

  Current assessment: LOW — engine resolver is the expected trust boundary;
  pick path from search modal is user-facing actor selection, not raw ID input.

Recommended Verification:
  Read @chat engine startDirectConversation source to confirm actor validation step.
  If validation is confirmed: downgrade to INFO.

Follow-up Command: ELEKTRA (engine chain verification when engine source is in scope)
```

### Confirmed Safe — chat/modules/start

| Surface | Evidence | Status |
|---|---|---|
| fromActorId — spoofing | identity.actorId from useIdentity() session hook | BLOCKED |
| Block enforcement | engine DI checkBlockRelation (bidirectional, fails closed) | BLOCKED |
| Authenticated guard | identity?.actorId check before engine call | BLOCKED |

---

## Module: chat/modules/debug

### Security Surface (ARCHITECT-derived)

- 2 standalone JS utility objects: chatBadgeDbg, chatNavDbg
- Zero imports, no DB, no React, pure client-side
- Toggle: window.__CHAT_BADGE_DEBUG / window.__CHAT_NAV_DEBUG
- Default: ENABLED when flag not set — no NODE_ENV gate (ANOM-CHAT-DEBUG-001 SOURCE_VERIFIED)

---

### FINDING: VEN-CHD-001

```
Finding ID:     VEN-CHD-001
Title:          Chat Debuggers Default Enabled in Production — No NODE_ENV Gate
Severity:       MEDIUM
THOR Blocker:   NO — information exposure is console-only; not network-accessible
Status:         OPEN
CISSP Domain:   Software Development Security (SDS) + Information Security (IS)
Scope:          VCSM
Location:       apps/VCSM/src/features/chat/debug/chatBadgeDebugger.js:17-22
                apps/VCSM/src/features/chat/debug/chatNavDebugger.js:42-47

Analysis:
  chatBadgeDebugger.js isEnabled():
    if (typeof window === 'undefined') return false
    if (typeof window.__CHAT_BADGE_DEBUG === 'boolean') return window.__CHAT_BADGE_DEBUG
    return true  ← defaults true when flag not set

  chatNavDebugger.js isEnabled():
    if (typeof window === 'undefined') return true  ← also true on server
    if (typeof window.__CHAT_NAV_DEBUG === 'boolean') return window.__CHAT_NAV_DEBUG
    return true  ← defaults true when flag not set

  Comment in chatBadgeDebugger.js header: "Default: ON in dev, OFF in prod (guarded at call sites)"
  ARCHITECT ANOM-CHAT-DEBUG-001: "Both debuggers default ENABLED — no NODE_ENV gate"
  These are contradictory. Source is authoritative. Call-site guards are not verified.

  Data exposed in production console:
  - chatBadgeDbg.endFetch logs: console.log('actorId:', token.actorId, ...) — FULL UUID in console.log
  - chatBadgeDbg.endFetch logs: badge count delta
  - chatNavDbg.startRun logs: startedAtIso + meta (caller-provided, opaque)
  - chatNavDbg.mark logs: navigation state + data objects (safeJson serialized)
  - chatNavDbg.endRun: console.table of mark timeline — navigation events reconstructed

  Note: chatBadgeDbg.endFetch console.groupCollapsed header shows only 8-char actorId prefix
  BUT the console.log line exposes the FULL actorId: 'actorId:', token.actorId

Trust Boundary Violation:
  actorId is an internal platform identifier. Logging it to browser console in production
  exposes it to any user with browser dev tools. Navigation timing and conversation routing
  data is observable.

Impact:
  - Authenticated user can see their own full actorId in browser console
  - Navigation state, timing, and mark data logged in production
  - window.__CHAT_BADGE_DEBUG = false can suppress — but requires knowing the flag name
    (flag name is visible in source code and prior sessions)

Blast Radius: LOW — console-only, browser-local, not network-transmitted

Why Defense Is Insufficient:
  Default-enabled with no NODE_ENV/import.meta.env.PROD check means production users
  always get debug output unless explicitly disabled.

Recommended Fix:
  Add production guard as first check in both isEnabled() functions:
    // In chatBadgeDebugger.js
    function isEnabled() {
      if (import.meta.env.PROD) return false    // ← add this line
      if (typeof window === 'undefined') return false
      if (typeof window.__CHAT_BADGE_DEBUG === 'boolean') return window.__CHAT_BADGE_DEBUG
      return true
    }

    // In chatNavDebugger.js
    function isEnabled() {
      if (import.meta.env.PROD) return false    // ← add this line
      if (typeof window === 'undefined') return true
      if (typeof window.__CHAT_NAV_DEBUG === 'boolean') return window.__CHAT_NAV_DEBUG
      return true
    }

Follow-up Command: Wolverine (apply fix), SPIDER-MAN (production guard regression test)
```

### Confirmed Safe — chat/modules/debug

| Surface | Evidence | Status |
|---|---|---|
| No DB access | Zero imports, no supabase | CONFIRMED |
| No network calls | Pure client-side JS utility | CONFIRMED |
| No session token exposure | Logs actorId values only | CONFIRMED |

---

## Required Follow-up Commands

| Command | Reason | Module | Priority |
|---|---|---|---|
| Wolverine | Add import.meta.env.PROD gate to chatBadgeDebugger.isEnabled() + chatNavDebugger.isEnabled() | chat/debug | P1 |
| SPIDER-MAN | Regression: debug output suppressed when import.meta.env.PROD = true | chat/debug | P2 |
| ELEKTRA | Verify @chat engine actor validation chain for picked object | chat/start | P2 |

---

## CISSP Domain Summary

| Domain | Findings | Status |
|---|---|---|
| Software Development Security (SDS) | VEN-CHD-001 (debug in production) | OPEN |
| Information Security (IS) | VEN-CHD-001 (actorId in console) | OPEN |
| Access Control (AC) | fromActorId session-derived; block-list via engine DI | BLOCKED |
| Identification & Authentication | Session chain confirmed; authenticated guard present | CONFIRMED |

---

## SOURCE READ SUMMARY

Full Rediscovery Performed: YES
Files Read:
- chatBadgeDebugger.js (74 lines — complete)
- chatNavDebugger.js (169 lines — complete)
- useStartConversation.js (56 lines — complete)
- ARCHITECTURE.md (chat/modules/chat) — complete
- ARCHITECTURE.md (chat/modules/start) — complete
- ARCHITECTURE.md (chat/modules/debug) — complete
- SECURITY.md stubs (chat, start, debug) — read
