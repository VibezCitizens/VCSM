# Governance: CEREBRO — Cross-Module Intelligence and Pattern Detection

**Command:** `/Cerebro`  
**Authority:** Cross-module pattern detection and systemic risk identification  
**Mode:** Read-only analysis + findings output  
**Scope in VPORT governance:** All modules — systemic or cross-cutting concerns

---

## Responsibility

CEREBRO scans across all VPORT dashboard modules simultaneously to detect systemic patterns, shared vulnerabilities, and architectural drift that no single module audit would surface.

It covers:
- Repeated violations across modules — if the same bug pattern appears in 5 modules, CEREBRO sees it
- Shared DAL functions that are called incorrectly from multiple callers
- Cross-module import graph analysis — detecting forbidden cross-feature imports
- Drift from the architecture contract at scale — patterns that diverged over multiple sessions
- Actor-kind isolation failures that span multiple modules
- Duplicate logic that should be in `engines/` but was copy-pasted across features
- Security pattern spread — if one module has a UUID exposure pattern, CEREBRO finds all instances across the repo

## Finding Format

```
CEREBRO — Systemic Finding — [YYYY-MM-DD]

Pattern: [name of the detected pattern]
Severity: CRITICAL | HIGH | MEDIUM | LOW
Affected Modules: [list]
Root Cause: [shared origin of the pattern]
Recommended Fix Strategy: [fix once in engine / fix per module / architectural change]
Tickets to Open: [one per affected module or one systemic ticket]
```

## Output Location

`zNOTFORPRODUCTION/_ACTIVE/audits/systemic/YYYY-MM-DD_cerebro_[scope].md`

## When to Run

After a full AVENGERSASSEMBLE sweep reveals a pattern across multiple modules. When a single module audit (VENOM, ARCHITECT) surfaces a finding and the question is: "Is this everywhere?"

## Module Coverage

CEREBRO does not track per-module status in the governance matrix — it tracks systemic patterns that cut across the entire matrix.
