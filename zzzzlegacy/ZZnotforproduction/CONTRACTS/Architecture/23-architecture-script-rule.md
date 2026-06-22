# Architecture Script Rule

> **Source Contract:** [AUTOMATED_ARCHITECTURE_ENFORCEMENT_CONTRACT.md](../AUTOMATED_ARCHITECTURE_ENFORCEMENT_CONTRACT.md)
> **Section:** Architecture Script Rule

---

## Rule

Use scripts where ESLint is insufficient.

Scripts are appropriate for checks that require file system traversal, line counting, or aggregate metric computation.

---

## Script Coverage

Architecture scripts must check:

| Check | Script Responsibility |
|---|---|
| File size | Lines over 250 (warning) and over 300 (error) |
| Folder depth | Levels below feature root exceeding 3 |
| Feature file counts | Per threshold in Feature Size Governance Contract |
| Layer naming compliance | Layer-encoded filename pattern enforcement |
| `.select('*')` usage | Grep across DAL and resolver files |
| React Query adoption metrics | Ratio of useQuery/useMutation vs manual useState+useEffect |
| TTL cache usage | Grep for deprecated cache patterns in DAL |
| Zustand store usage | Grep for store files; flag those with server-derived state |

---

## Execution

Scripts run in CI or as a pre-merge step.

Scripts produce actionable reports that link to the violated contract rule.

Script output follows the same severity matrix as ESLint rules.
