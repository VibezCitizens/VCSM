# Governance: NICKFURY — Parallel Build Orchestrator

**Command:** `/NickFury`  
**Authority:** Parallel mission orchestrator — isolated side-missions that run independently  
**Mode:** Orchestration only (launches isolated sub-agents — no direct code writes)  
**Scope in VPORT governance:** Multi-module sessions or parallel audit tracks

---

## Responsibility

NICKFURY runs isolated work streams in parallel when a session requires multiple independent tasks that must not interfere with each other. Each side-mission is fully scoped and bounded before launch.

It covers:
- Splitting a session into parallel tracks when two or more independent modules need simultaneous work
- Defining the boundary contract for each track (which files, which module, which governance commands)
- Ensuring each track operates on its own ticket — no cross-contamination of findings
- Aggregating results from parallel tracks when they complete
- Preventing merge conflicts by confirming track isolation before launch

## When to Use vs. WOLVERINE

| Scenario | Use |
|---|---|
| Single module, sequential commands | WOLVERINE |
| Two independent modules in one session | NICKFURY |
| One module, one command chain | WOLVERINE |
| Security audit + documentation update on different modules | NICKFURY |

## Track Isolation Rules

- Each track must have its own ticket ID
- Tracks must not share file-write targets
- Tracks must not depend on each other's output during execution
- Results are aggregated only after all tracks confirm completion

## Output Location

`zNOTFORPRODUCTION/_ACTIVE/planning/nickfury/YYYY-MM-DD_nickfury_[session].md`

## When to Run

When a session legitimately requires two or more independent governance audit tracks running simultaneously. Not a substitute for WOLVERINE on single-module work.
