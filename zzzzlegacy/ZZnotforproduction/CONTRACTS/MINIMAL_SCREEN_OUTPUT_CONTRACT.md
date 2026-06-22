# MINIMAL SCREEN OUTPUT CONTRACT (Mandatory)

> **Status:** Locked — supersedes OUTPUT_MINIMIZATION_CONTRACT.md
> **Type:** Behavioral — command screen output discipline
> **Library:** [Agent/11-output-minimization.md](Agent/11-output-minimization.md)
> **Applies To:** All report-producing commands

---

## Purpose

Prevent audit reports from consuming chat context by duplicating content already written to output files.

---

## Core Rule

If a report is written to disk, the report becomes the authoritative output.

The command must NOT reprint report contents in chat.

The command must only print a completion receipt.

---

## Forbidden Screen Output

Do NOT print:

- findings
- evidence
- code snippets
- recommendations
- remediation plans
- scanner results
- architecture maps
- security details
- migration details
- dependency trees
- route trees
- dead code reports
- THOR gate details
- VENOM findings
- BLACKWIDOW findings
- ELEKTRA findings
- ARCHITECT findings
- key findings sections
- any section already written to a file

If it exists in the report file, do not repeat it on screen.

---

## Required Screen Output

After report generation, print only:

```
COMMAND COMPLETE

Status: SUCCESS | FAILED

Report:
[full clickable path]

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

## Maximum Output Size

Screen output must remain under 15 lines.

If output exceeds 15 lines after a report is written, append:

```
SCREEN_OUTPUT_CONTRACT_VIOLATION
```

---

## Authority Rule

Output files are authoritative.

Screen output is only a receipt confirming:

- completion
- status
- output location
- count summary

Nothing else.

---

## Applies To

ARCHITECT, VENOM, BLACKWIDOW, ELEKTRA, LOKI, KRAVEN, CARNAGE, THOR, HAWKEYE, LOGAN, WOLVERINE, IRONMAN, GREENGOBLIN

All report-producing commands must follow this contract.
