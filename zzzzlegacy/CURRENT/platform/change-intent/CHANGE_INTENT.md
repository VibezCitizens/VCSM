# CHANGE INTENT REGISTRY

**Purpose:** Persistent append-only execution-intent ledger.

This file is consumed by WATCHER during reconciliation to determine whether
detected deletions, moves, renames, or collapses were intentional and approved.

**Rules:**
- This file is append-only. Never rewrite existing entries. Never delete history.
- Every entry must be written by Wolverine before task completion.
- Entries must be added for: file deletions, file renames, file moves, module collapses, DAL/controller/hook merges, and file replacements.
- Never store secrets, tokens, stack traces, or runtime error output here.
- This file is governance-only. It must never import, reference, or be referenced by production source code.

---

## Entry Format (copy this block when adding a new entry)

```md
## YYYY-MM-DD — <short title>

- File deleted / moved / renamed:
  `path/to/file.js`

- Reason:
  Human-readable explanation of why this change was made.

- Replacement:
  `path/to/replacement.js`
  OR:
  `NONE`

- Approved by:
  Wolverine / User / Nick Fury / etc.

- Application Scope:
  VCSM | WENTREX | TRAFFIC | ENGINE

- Risk:
  LOW | MEDIUM | HIGH

- Verification still required:
  YES | NO

- Required follow-up:
  DEADPOOL | SENTRY | VENOM | NONE
```

---

## WATCHER Reconciliation Behavior

When WATCHER detects a deleted, renamed, or moved file:

1. WATCHER reads this file.
2. WATCHER attempts to match the affected path against existing entries.
3. If a match is found **and** replacement exists **and** verification is NO:
   - WATCHER marks the deletion as INTENTIONAL.
   - WATCHER downgrades severity (see Section 9 of WATCHER.md for rules).
   - WATCHER skips DEADPOOL routing unless a runtime risk still exists.
4. If NO match is found:
   - WATCHER escalates normally.
   - DEADPOOL routing proceeds as per standard rules.

---

<!-- ═══════════════════════════════════════════════════════════════
     ENTRIES BEGIN BELOW — most recent at top, append only
     ═══════════════════════════════════════════════════════════════ -->
