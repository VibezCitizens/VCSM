# Governance: DEADPOOL — Root Cause Debug

**Command:** `/Deadpool`  
**Authority:** Root cause analysis and bug isolation  
**Mode:** Read-only investigation + findings output  
**Scope in VPORT governance:** All modules with active bugs or regressions

---

## Responsibility

DEADPOOL investigates the root cause of bugs and regressions in VPORT dashboard modules. It traces the failure backward from the symptom to the origin without guessing.

It covers:
- Reproducing the failure with a precise execution trace (UI → Hook → Controller → Model → DAL → DB)
- Identifying the layer where the contract is violated
- Distinguishing proximate symptoms from root causes
- Ruling out adjacent causes with evidence (grep checks, file reads)
- Surfacing secondary bugs uncovered during investigation — without absorbing them into the current ticket

## Investigation Protocol

1. State the symptom exactly as observed
2. Identify the entry point (screen, hook, or controller)
3. Trace the call chain top-down
4. Isolate the first layer that returns incorrect state
5. Confirm the root cause with file path + line reference
6. Propose the minimal fix — do not implement it

## Finding Format

```
BUG-XXXX — Root Cause Confirmed

Symptom: [exact observed behavior]
Root Cause: [file:line] — [what is wrong and why]
Affected Layers: [layers broken]
Proposed Fix: [minimal patch description — not implementation]
Secondary Issues Found: [list or "none"]
```

## Output Location

`zNOTFORPRODUCTION/_ACTIVE/audits/bugs/YYYY-MM-DD_deadpool_[module].md`

## When to Run

When a VPORT module exhibits unexpected behavior. Always before SENTRY or SPIDER-MAN on a bug ticket.

## Module Coverage

See `../vport-dashboard-governance-matrix.md` for active bug states per module.
