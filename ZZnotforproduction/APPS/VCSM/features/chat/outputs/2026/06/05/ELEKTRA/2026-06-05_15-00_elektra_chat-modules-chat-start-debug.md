# ELEKTRA Security Report — Chat Modules: chat + start + debug

**Date:** 2026-06-05
**Scope:** VCSM — chat/modules/chat, chat/modules/start, chat/modules/debug
**Reviewer:** ELEKTRA
**Scan Trigger:** MANUAL — governance pass, module table audit
**Findings Summary:** 0 CRITICAL | 0 HIGH | 0 MEDIUM | 1 LOW | 0 INFO
**False Positives Rejected:** 2
**Suggested Patches:** 1

Upstream Reports:
- VENOM: ZZnotforproduction/APPS/VCSM/features/chat/outputs/2026/06/05/Venom/2026-06-05_15-00_venom_chat-modules-chat-start-debug.md (this session)
- BLACKWIDOW: ZZnotforproduction/APPS/VCSM/features/chat/outputs/2026/06/05/BlackWidow/2026-06-05_15-00_blackwidow_chat-modules-chat-start-debug.md (this session)

**ELEKTRA PREFLIGHT PASS**

---

## ELEKTRA SCAN TARGET

```
Feature / Route / Engine: chat/modules/chat (DI), chat/modules/start, chat/modules/debug
Application Scope: VCSM
Reason for scan: First-time module-scoped ELEKTRA scan (STUB → ACTIVE)
Scan trigger: MANUAL
```

---

## HIGH FINDINGS

None.

---

## MEDIUM FINDINGS

None.

VEN-CHD-001 (VENOM MEDIUM — debug enabled in production) is downgraded to LOW in ELEKTRA precision chain:
- Source: browser console (client-side only)
- Sink: console.log (not network)
- Impact: authenticated user can see own actorId — no cross-actor disclosure

---

## LOW FINDINGS

### ELEK-2026-06-05-CD-001

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-CD-001
- Title:              actorId Exposure via Production Console Logging — chatBadgeDebugger
- Category:           Secrets Exposure (weak — internal identifier, console-only)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/chat/debug/chatBadgeDebugger.js:49-52
- Source:             actorId (from identity hook, passed to chatBadgeDbg.startFetch/endFetch)
- Sink:               console.log('actorId:', token.actorId, ...) — browser console
- Trust Boundary:     isEnabled() should return false in production (NODE_ENV gate)
- Impact:             Full actorId UUID logged to browser console in production.
                      Authenticated user can observe their own actorId. No cross-actor disclosure.
- Evidence:
    chatBadgeDebugger.js:49-52:
      console.log('actorId:', token.actorId, '| elapsed:', elapsed + 'ms', '| count:', count)
    isEnabled() defaults to true when window.__CHAT_BADGE_DEBUG is not set.
    No NODE_ENV or import.meta.env.PROD guard present.

- Existing Defense:   Runtime toggle (window.__CHAT_BADGE_DEBUG = false) — requires manual activation
- Why Defense Is Insufficient: Default-enabled in production with no build-time gate
- Recommended Fix:    Add import.meta.env.PROD guard as first check in isEnabled()
- Suggested Patch:
    // chatBadgeDebugger.js — isEnabled()
    function isEnabled() {
      if (typeof import !== 'undefined' && import.meta?.env?.PROD) return false
      if (typeof window === 'undefined') return false
      if (typeof window.__CHAT_BADGE_DEBUG === 'boolean') return window.__CHAT_BADGE_DEBUG
      return true
    }

    // chatNavDebugger.js — isEnabled()
    function isEnabled() {
      if (typeof import !== 'undefined' && import.meta?.env?.PROD) return false
      if (typeof window === 'undefined') return true
      if (typeof window.__CHAT_NAV_DEBUG === 'boolean') return window.__CHAT_NAV_DEBUG
      return true
    }

- Follow-up Command:  Wolverine (apply patch), SPIDER-MAN (production guard regression)

BLACKWIDOW Cross-Reference: BW-CHD-001 — PARTIAL (console-only, same-user data only)
VENOM Cross-Reference: VEN-CHD-001 — MEDIUM (downgraded to LOW in ELEKTRA precision chain)
```

---

## False Positives Rejected

```
FALSE POSITIVE REJECTED

- Candidate:       picked actor ID IDOR — raw actor ID passed to @chat engine (VEN-CHS-001)
- Location:        apps/VCSM/src/features/chat/start/hooks/useStartConversation.js
- Rejection reason: Chain link SINK cannot be confirmed from app-layer source alone.
    The @chat engine is a separate module (engines/) with its own DI injection points.
    resolveActorRealmContext DI reads vc.actors — actor resolution step is the trust boundary.
    Without engine source: Impact link cannot be grounded → REJECT.
    If engine accepts invalid actorId and creates phantom conversation → MEDIUM (requires engine audit).
- Chain gap:       Sink / Impact — engine behavior unverifiable from chat module scope
- Notes:           Route to ELEKTRA engine-scoped scan or engine code review when in scope.
```

```
FALSE POSITIVE REJECTED

- Candidate:       resolveActorRealmContext inline vc.actors read — realm spoofing (VEN-CHC-001)
- Location:        apps/VCSM/src/features/chat/setup.js
- Rejection reason: resolveActorRealmContext is server-side read via Supabase.
    vc.actors RLS is enforced at DB layer. Realm is_void is read-only and used for routing,
    not for authorization decisions. No write sink reachable from this path alone.
- Chain gap:       Sink — no write surface reachable from realm context spoofing path
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-05-CD-001 | actorId exposure in production console | LOW | Debug Utility | SIMPLE | NO |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| Wolverine | Apply import.meta.env.PROD guard to chatBadgeDebugger + chatNavDebugger | PENDING |
| SPIDER-MAN | Add test: chatBadgeDbg suppressed when import.meta.env.PROD = true | PENDING |
| ELEKTRA (engine scope) | Verify @chat engine actor validation for picked input | PENDING |
| Thor | No HARD release blocker from this scan; CAUTION for VEN-CHD-001 | INFORMATIONAL |
