# Governance: WATCHER — Session Change Provenance

**Command:** `/WATCHER`  
**Authority:** Session change provenance and audit trail  
**Mode:** Read-only + log output  
**Scope in VPORT governance:** All modules — end-of-session provenance record

---

## Responsibility

WATCHER records what changed in a session, why it changed, and who authorized it. It is the audit trail, not the audit.

It covers:
- Listing every file changed in the session with a one-line description of why
- Mapping each change to its ticket ID
- Recording the governance commands that ran and their final status
- Flagging any change made outside of a ticket (unauthorized scope)
- Confirming that deferred items were logged in `deferred-open-items.md`
- Verifying the session ended with a THOR status for any modules that were touched

## Change Record Format

```
WATCHER LOG — [YYYY-MM-DD] — Session [N]

Ticket: [TICKET-ID] — [title]

Files Changed:
  - [file path] — [what changed] — [ticket reference]
  - ...

Commands Run:
  - WOLVERINE: [status]
  - VENOM: [status / finding IDs]
  - ARCHITECT: [status]
  - KRAVEN: [status]
  - SENTRY: [status]
  - SPIDER-MAN: [status]
  - LOGAN: [status]
  - THOR: [status]

Deferred Items Logged: YES | NO
Unauthorized Scope Changes: [none | list]
```

## Output Location

`zNOTFORPRODUCTION/_ACTIVE/session-logs/YYYY-MM-DD_watcher_session_[N].md`

## When to Run

At the end of every session that modifies VPORT dashboard files. Always run before `/session-summary`.
