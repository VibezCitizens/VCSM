# OUTPUT MINIMIZATION CONTRACT (Locked)

> **Status:** Locked
> **Type:** Behavioral — command output discipline
> **Library:** [Agent/11-output-minimization.md](Agent/11-output-minimization.md)
> **Applies To:** All commands and agents that generate reports, maps, audits, or large artifacts

---

## Purpose

Commands must write full reports to disk and return only a minimal completion summary to chat.

The chat is not the report.

The report file is the report.

This rule exists to:

- reduce token consumption
- prevent context pollution
- keep command output concise
- allow large audits without filling conversation history
- separate persistent artifacts from chat responses

---

## Core Rule

Commands must never print the full generated report into chat by default.

Commands must:

1. Generate the full report
2. Write the report to the required output path
3. Return only a completion summary

---

## Required Output Format

After successful execution, commands must output only:

```
REPORT GENERATED

Path:
[path-to-report]

Status:
SUCCESS

Summary:
- HIGH: [count]
- MEDIUM: [count]
- LOW: [count]

Open the generated report for full details.
```

---

## Maximum Chat Output

Default output must remain under:

- 300 tokens preferred
- 500 tokens hard limit

Anything larger must be written to disk instead.

---

## Forbidden Behavior

Commands must never print to chat:

- entire reports
- entire findings tables
- entire architecture maps
- full migration plans
- full dependency trees
- full route maps
- full scanner output
- full graph output
- complete audit documents

These belong in generated files only.

---

## Allowed Chat Content

Commands may output to chat:

- report path (clickable when environment supports it)
- report filename
- status (SUCCESS / BLOCKED / PARTIAL)
- severity counts
- blocker counts
- completion summary
- file write confirmation
- generated artifact list

---

## Detail Escalation Rule

Detailed content must only be shown when explicitly requested by the user.

Trigger phrases that unlock detail output:

- `show findings`
- `show summary`
- `show blockers`
- `show report`
- `print report`
- `open report`

Only on these triggers may the command display additional sections.

---

## Link-First Rule

When the environment supports it, commands must return clickable file paths instead of report contents.

Preferred:
```
Report:
ZZnotforproduction/APPS/VCSM/features/booking/2026-06-04_elektra_booking-scan.md
```

Not preferred:
```
[pages of report content reprinted in chat]
```

---

## Execution Order

Commands must follow this order:

1. Analyze
2. Generate report content
3. Write report to disk
4. Confirm write success
5. Print minimal summary

Never reverse this order. Never print before writing.

---

## Platform-Wide Principle

Reports belong on disk.

Chat contains navigation.

Not duplication.
