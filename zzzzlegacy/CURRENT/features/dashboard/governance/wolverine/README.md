# Governance: WOLVERINE — Planning, Routing, and Orchestration

**Command:** `/Wolverine`  
**Authority:** Main planning orchestrator — routes tasks to the correct command and execution layer  
**Mode:** Read + orchestration (no direct code writes)  
**Scope in VPORT governance:** Session entry point for all VPORT module work

---

## Responsibility

WOLVERINE is the session orchestrator. Every VPORT dashboard task begins here. It determines which governance commands to invoke, in what order, and tracks the overall execution plan.

It covers:
- Opening and maintaining the persistent ticket for the session
- Routing to the correct command (VENOM, ARCHITECT, KRAVEN, etc.) based on the task type
- Enforcing the mandatory build order: DAL → Model → Controller → Hook → Component → View → Final Screen
- Confirming pre-conditions are met before each governance command is invoked
- Tracking open items and blocked states across commands
- Preventing scope creep — flagging adjacent issues rather than absorbing them

## Governance Role

WOLVERINE does not run audits directly. It sequences the audit commands and ensures no step is skipped. It owns the ticket and the plan; each specialist command owns its findings.

## Routing Logic

| Task Type | Command Sequence |
|---|---|
| New feature | ARCHITECT → VENOM → KRAVEN → SENTRY → SPIDER-MAN → LOGAN → THOR |
| Bug fix | DEADPOOL → SENTRY → SPIDER-MAN → LOGAN |
| Security patch | VENOM → BLACKWIDOW → ELEKTRA → SENTRY → SPIDER-MAN → THOR |
| DB migration | CARNAGE → VENOM → SENTRY → THOR |
| Performance issue | KRAVEN → LOKI → SENTRY |
| Endpoint change | HAWKEYE → VENOM → SENTRY → SPIDER-MAN |
| Release gate | THOR (requires all prerequisites VERIFIED or COMPLETE) |

## When to Run

At the start of every session that involves a VPORT dashboard module.

## Output Location

Ticket in conversation context. No file output — WOLVERINE's artifact is the ticket, not a report.
