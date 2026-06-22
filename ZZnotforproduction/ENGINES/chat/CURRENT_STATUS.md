# CURRENT STATUS — engines/chat

## ARCHITECT

Last Run: 2026-06-05
Ticket: TICKET-ARCHITECT-MISSING-0001
Architecture State: COMPLETE — anomalies found
Independence: PARTIALLY INDEPENDENT

Artifacts:
- ARCHITECTURE.md: PRESENT (2026-06-05)
- BEHAVIOR.md: MISSING
- SECURITY.md: MISSING
- Full report: outputs/2026/06/05/ARCHITECT/engine.chat.architecture.md

Re-run triggers:
- BEHAVIOR.md authored → run ARCHITECT behavior consistency check
- React hooks moved out of engine → re-run scope boundary check
- `note` file removed → re-run anomaly scan
- conversation_keys + participant_snapshots DAL gap resolved → re-run DB read audit
- DI freeze guard added → re-run boundary check

## VENOM

Last Run: NEVER — BLOCKED (requires BEHAVIOR.md)
Pre-identified risks: membership gating on read paths; block check completeness; actor authorization in getConversationMessages

## ELEKTRA

Last Run: NEVER — BLOCKED (requires BEHAVIOR.md)
Known gaps: No DI freeze guard; console.warn in blockRelations DAL; React hooks in engine scope

## SPIDER-MAN

Last Run: NEVER
Test coverage: ZERO — no test files found in engine directory
Priority: HIGH — real-time messaging critical path with atomic RPCs and zero test coverage

## LOKI

Last Run: NEVER — BLOCKED (requires ARCHITECT)
Hot paths: send_message_atomic RPC; Realtime subscription lifecycle; outbox event flow; inbox fan-out

## KRAVEN

Last Run: NEVER — BLOCKED (requires ARCHITECT)

## CARNAGE

Last Run: NEVER
Pending: conversation_keys + participant_snapshots table audit; audit_log write path (only via RPC)

## IRONMAN

Last Run: NEVER
Decisions needed: React hooks in engine (ANOM-CHAT-001) — move to apps/ or document exception; VCSM-only vs multi-app scope declaration

## LOGAN

Pending: Remove engines/chat/note file; BEHAVIOR.md, SECURITY.md governance artifacts
