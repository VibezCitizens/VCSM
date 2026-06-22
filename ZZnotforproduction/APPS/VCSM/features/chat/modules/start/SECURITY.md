---
title: Start Module — Security
status: VENOM COMPLETE (2026-06-05)
feature: chat
module: start
source: VENOM
created: 2026-06-04
last-updated: 2026-06-05
source-path: apps/VCSM/src/features/chat/start/
ticket: TICKET-ARCHITECT-DASHBOARD-0001
---

# chat / modules / start — SECURITY

## Status

VENOM COMPLETE (2026-06-05). 1 new MEDIUM finding attributed to this module.
Prior feature-level findings from 2026-06-04 partially cover this module (VEN-CHAT-003, ELEK-2026-06-04-005, BW-CHAT-004 — privacy setting enforcement).

## Module-Attributed Findings

| Finding ID | Severity | Description |
|---|---|---|
| VEN-CHAT-006 | MEDIUM | StartConversationModal.pickDirect() passes raw query string as actor ID — no UUID validation at app layer; engine DI resolvers are last line of defense |
| VEN-CHAT-003 (attributed) | MEDIUM | whoCanMessage/allowNewMessageRequests localStorage-only — startDirectConversation (this module) does not read target privacy setting |
| ELEK-2026-06-04-005 (attributed) | MEDIUM | whoCanMessage localStorage-only — zero server enforcement in startDirectConversation |
| BW-CHAT-004 (attributed) | MEDIUM | whoCanMessage privacy setting BYPASSED — server does not enforce |

## Review Coverage

- 2026-06-05 VENOM (module-scoped): `../../../outputs/2026/06/05/Venom/2026-06-05_venom_chat-modules-chat-start-debug.md`
- 2026-06-04 VENOM (feature-level): `../../../outputs/2026/06/04/Venom/2026-06-04_19-48_venom_chat-security-review.md`

## Security Surface

| Surface | Risk | Status |
|---|---|---|
| pickDirect() raw actor ID | No UUID validation (VEN-CHAT-006) | OPEN |
| useStartConversation identity guard | identity.actorId presence check — adequate | ACCEPTABLE |
| startDirectConversation engine delegate | Block check via DI (checkBlockRelation) | ADEQUATE |
| Privacy settings enforcement | localStorage-only (VEN-CHAT-003, BW-CHAT-004) | OPEN |

---

## ELEKTRA STATUS

ELEKTRA Last Run: 2026-06-05
ELEKTRA Status: COMPLETE

0 findings | 1 False Positive Rejected | Highest Open Severity: NONE (this pass)

False Positive Rejected: picked actor ID IDOR — engine chain unverifiable from app scope, REJECTED.
(VEN-CHAT-006 and ELEK-2026-06-04-005 remain OPEN — attributed from prior session above.)

Cross-reference:
- VEN-CHAT-006 (MEDIUM): ELEKTRA cannot confirm sink chain from app-layer alone — engine source needed
- BW-CHAT-004 (MEDIUM/BYPASSED): whoCanMessage localStorage-only → THOR blocker from prior session

Output: `outputs/2026/06/05/ELEKTRA/2026-06-05_15-00_elektra_chat-modules-chat-start-debug.md`

---

## BLACKWIDOW STATUS

BLACKWIDOW Last Run: 2026-06-05
BLACKWIDOW Status: COMPLETE

0 CRITICAL | 0 HIGH | 1 LOW (UNRESOLVED) | 3 BLOCKED | 0 BYPASSED

| Finding ID | Severity | Result | Description |
|---|---|---|---|
| BW-CHS-001 | LOW | UNRESOLVED | picked actor ID validation — engine actor resolution not source-verified |

Confirmed BLOCKED:
- fromActorId spoofing: BLOCKED — session-derived
- Conversation with blocked actor: BLOCKED — engine DI checkBlockRelation fails closed
- Unauthenticated conversation start: BLOCKED — identity.actorId guard

Note: BW-CHAT-004 (BYPASSED, whoCanMessage) from prior session 2026-06-04 STANDS — not re-attacked here.
BW-CHAT-004 remains MEDIUM/BYPASSED and is a THOR release blocker for the start module.

Full report: `outputs/2026/06/05/BlackWidow/2026-06-05_15-00_blackwidow_chat-modules-chat-start-debug.md`
