# BLACKWIDOW Adversarial Review — Chat Modules: chat + start + debug

**Date:** 2026-06-05
**Reviewer:** BLACKWIDOW
**Scope:** VCSM — chat/modules/chat, chat/modules/start, chat/modules/debug
**VENOM Dependency Gate:** PASS — VEN-CHD-001, VEN-CHS-001, VEN-CHC-001 produced this session
**ARCHITECT Gate:** PASS — all three modules ARCHITECT COMPLETE 2026-06-05
**Status:** COMPLETE
**Findings Summary:** 0 CRITICAL | 0 HIGH | 0 MEDIUM | 1 LOW
**Adversarial Results:** 5 BLOCKED | 1 PARTIAL | 1 UNRESOLVED
**THOR Release Blocker:** NO — chat/debug PARTIAL is console-only

---

## FINDING: BW-CHD-001

```
Finding ID:     BW-CHD-001
Title:          Production Debug Active — Runtime Toggle Bypass
Severity:       LOW
Adversarial Result: PARTIAL
THOR Blocker:   NO
Status:         OPEN
VENOM Cross-Reference: VEN-CHD-001

Attack Scenario:
  1. Production user opens browser dev tools.
  2. chatBadgeDbg is active (default enabled — no NODE_ENV gate).
  3. User observes console output: own actorId (full UUID) in endFetch logs.
  4. User can enumerate badge count patterns and navigation timing.
  5. To suppress: window.__CHAT_BADGE_DEBUG = false (flag name visible in source).

Adversarial Result: PARTIAL
  Information disclosure is confirmed in production console.
  Attack is browser-local only — not network-accessible.
  An external attacker cannot read the console of another user's browser.
  The exposed data (actorId, badge counts) is the authenticated user's own data —
  no cross-actor information disclosure possible from this mechanism.

UNRESOLVED: Whether call-site guards in chatUnread.controller.js or ConversationView.jsx
  add NODE_ENV checks before calling chatBadgeDbg / chatNavDbg. Not source-verified in
  this pass.
```

---

## FINDING: BW-CHS-001

```
Finding ID:     BW-CHS-001
Title:          picked Actor Validation — Engine Chain Unverified
Severity:       LOW
Adversarial Result: UNRESOLVED
THOR Blocker:   NO
Status:         OPEN — requires engine source verification
VENOM Cross-Reference: VEN-CHS-001

Attack Scenario:
  1. Attacker intercepts or crafts a StartConversationModal selection.
  2. picked object contains a malformed or non-existent actor ID.
  3. useStartConversation passes picked to startDirectConversation without validation.
  4. Engine resolveActorRealmContext reads vc.actors WHERE id = picked.actorId
     → actor not found → behavior depends on engine null handling.

  IF engine raises not-found error: BLOCKED
  IF engine creates conversation with null/phantom participant: BYPASSED (phantom member)

Adversarial Result: UNRESOLVED
  Engine actor validation chain not source-verified.
  Engine DI (resolveActorRealmContext, checkBlockRelation) strongly suggests actor
  validation occurs before conversation INSERT, but this cannot be confirmed from
  app-layer source alone.
```

---

## BLOCKED Adversarial Scenarios

| Module | Scenario | Result | Evidence |
|---|---|---|---|
| chat/start | fromActorId spoofing (start conversation as other actor) | BLOCKED | identity.actorId from session hook, not user-injectable |
| chat/start | Conversation with blocked actor | BLOCKED | engine DI checkBlockRelation fails closed |
| chat/start | Unauthenticated conversation start | BLOCKED | identity?.actorId guard before engine call |
| chat/chat | Realm context spoofing via DI | BLOCKED | resolveActorRealmContext reads vc.actors server-side |
| chat/debug | Debug actorId of another user via console | BLOCKED | Browser console isolation — attacker can only see own console |

---

## Required Follow-up

| Command | Reason | Priority |
|---|---|---|
| Wolverine | Apply NODE_ENV guard to chatBadgeDebugger + chatNavDebugger | P1 |
| ELEKTRA | Verify @chat engine actor validation chain for picked input | P2 |
| SPIDER-MAN | Verify call-site guards on chatBadgeDbg / chatNavDbg in controller + view | P2 |

---

## SOURCE READ SUMMARY

Full Rediscovery Performed: YES — VENOM findings consumed as attack starting points
VENOM Report Consumed: 2026-06-05 (produced this session)
BEHAVIOR.md: chat/debug + chat/start have no BEHAVIOR.md — no §7 attack map required
