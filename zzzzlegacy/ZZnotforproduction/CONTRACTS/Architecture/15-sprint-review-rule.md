# Architecture Review Rule

> **Source Contract:** [ARCHITECTURE_GOVERNANCE_CONTRACT.md](../ARCHITECTURE_GOVERNANCE_CONTRACT.md)
> **Section:** Regular Architecture Review Rule

---

## Rule

Every sprint or bi-weekly cycle must include an architecture review before merge.

---

## Scope

Review must cover:

- new feature folders
- changed feature boundaries
- cross-feature imports
- layer violations
- adapter exports
- file size violations
- module depth violations
- server-state patterns

---

## Merge Gate

A feature is not merge-ready if it violates locked contracts unless an explicit contract exception is documented.

---

## Enforcement Point

| Check | Violation Level |
|---|---|
| No architecture review run this sprint/cycle | HIGH |
| Feature merged with locked contract violation and no documented exception | MERGE_BLOCKED |
