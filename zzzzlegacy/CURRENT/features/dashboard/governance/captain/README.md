# Governance: CAPTAIN — Next-Session Order Capture

**Command:** `/CAPTAIN`  
**Authority:** Session boundary — captures ideas and deferred work for the next session  
**Mode:** Write (planning notes only — no code, no implementation)  
**Scope in VPORT governance:** End-of-session capture for all modules

---

## Responsibility

CAPTAIN captures ideas, deferred items, and follow-up decisions at the end of a session. It does not plan, implement, or audit — it records what was thought of but not acted on.

It covers:
- Capturing ideas raised during the session that are out of scope for the current ticket
- Recording decisions that need revisiting next session
- Flagging deferred items that must be logged in `deferred-open-items.md`
- Noting any modules that surfaced issues but were not the session focus

## Governance Role

CAPTAIN is the session memory bridge. Items captured here feed into the next WOLVERINE session plan. A CAPTAIN note is not a ticket — it becomes one when the next session opens.

## Output Format

```
CAPTAIN NOTE — [YYYY-MM-DD]

Module: [module name]
Item: [one-sentence description of the idea or deferred item]
Risk if ignored: [LOW / MEDIUM / HIGH]
Recommended next command: [VENOM / ARCHITECT / DEADPOOL / etc.]
Target ticket type: [ENG / BUG / TASK / SEC]
```

## Output Location

`zNOTFORPRODUCTION/_ACTIVE/planning/captain-notes/YYYY-MM-DD_captain.md`

Deferred blocking items must also be logged in:  
`zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/VPORT/DASHBOARD/deferred-open-items.md`

## When to Run

At session end, before `/session-summary`. Never in the middle of an active ticket.
