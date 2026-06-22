# Governance: SESSION-SUMMARY — End-of-Session Audit Log

**Command:** `/session-summary`  
**Authority:** End-of-session audit log — permanent session record  
**Mode:** Write (log output only — no code changes)  
**Scope in VPORT governance:** All sessions that touch VPORT dashboard modules

---

## Responsibility

SESSION-SUMMARY produces the permanent audit log for a session. It runs after WATCHER and CAPTAIN, before the session closes. It is the non-repudiable record of what happened.

It covers:
- Ticket summary — which tickets were opened, progressed, or closed
- Files changed — full list with ticket references
- Governance commands run — each command, its status, and any open findings
- Deferred items logged — confirmation that all deferred work is in `deferred-open-items.md`
- Blocked states — any modules still BLOCKED and why
- THOR decisions — which modules advanced to THOR COMPLETE, DEFERRED, or remain BLOCKED
- Next session prerequisites — what must be done before the next session can proceed on each module

## Output Format

```
SESSION SUMMARY — [YYYY-MM-DD] — Session [N]

Tickets Active This Session:
  - [TICKET-ID]: [title] — [OPEN / COMPLETE / BLOCKED]

Modules Touched:
  - [module]: [previous THOR status] → [current THOR status]

Governance Commands Run:
  - [command]: [module] → [VERIFIED / COMPLETE / BLOCKED / DEFERRED]

Files Changed: [count] — see WATCHER log for full list

Deferred Items Logged: YES | NO — [item IDs]

Blocked Modules: [list or "none"]

Next Session Must:
  1. [specific prerequisite]
  2. ...
```

## Output Location

`session-summaries/YYYY-MM-DD_session_[N]_summary.md`

## When to Run

At the end of every session. Always after WATCHER. Always after CAPTAIN. Never skipped.
