# Output Minimization
## Minimal Screen Output Contract — Write to Disk, Return Receipt Only (Locked)

> **Source:** [../MINIMAL_SCREEN_OUTPUT_CONTRACT.md](../MINIMAL_SCREEN_OUTPUT_CONTRACT.md)
> **Supersedes:** [../OUTPUT_MINIMIZATION_CONTRACT.md](../OUTPUT_MINIMIZATION_CONTRACT.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Applies To:** All commands that generate reports, maps, audits, or large artifacts

---

## Core Rule

If a report is written to disk, the report is the authoritative output.

Commands must NOT reprint report contents in chat.

Commands must only print a completion receipt.

---

## Required Chat Output (max 15 lines)

```
COMMAND COMPLETE

Status: SUCCESS | FAILED

Report:
[full path]

Additional Files Updated:
[file paths]

Summary Counts:
CRITICAL: X
HIGH: X
MEDIUM: X
LOW: X
INFO: X

Open report for full details.
```

---

## Hard Line Limit

Screen output must remain under 15 lines.

If exceeded after a report is written, append: `SCREEN_OUTPUT_CONTRACT_VIOLATION`

---

## Forbidden in Chat — No Exceptions

- findings
- evidence
- code snippets
- recommendations
- key findings sections
- architecture maps
- dependency trees
- route trees
- scanner results
- remediation plans
- THOR gate details
- any content already written to a file

---

## Allowed in Chat

- command name
- status
- report path
- additional file paths updated
- severity counts

Nothing else.

---

## Detail Escalation

Show detailed content only when the user explicitly requests it:

- `show findings`
- `show report`
- `print report`
- `open report`

---

## Execution Order

1. Analyze
2. Generate report content
3. Write report to disk
4. Confirm write success
5. Print receipt only

Never reverse. Never print before writing.
