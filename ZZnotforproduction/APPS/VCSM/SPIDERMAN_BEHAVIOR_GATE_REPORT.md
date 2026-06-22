# SPIDERMAN BEHAVIOR GATE REPORT

Date: 2026-06-05
Author: SPIDER-MAN governance update
Command File: `.claude/commands/SPIDER-MAN.md`

---

## Files Updated

| File | Change |
|---|---|
| `.claude/commands/SPIDER-MAN.md` | Added §0 Behavior Dependency Gate |
| `.claude/commands/SPIDER-MAN.md` | Updated §17 Completion Criteria — gate check added as first item |
| `.claude/commands/SPIDER-MAN.md` | Updated S7 — P2/P3 relaxation retired; gate is now absolute |

---

## Gate Summary

### Behavior Dependency Gate Added

**Section:** §0 Behavior Dependency Gate
**Position:** Inserted before §1 Mission — runs as the first preflight check on every SPIDER-MAN invocation.

Gate enforces:
- BEHAVIOR.md must exist at feature scope or module scope (module takes precedence)
- File must not be empty
- File must not be a stub (fewer than 5 meaningful entries, placeholder text, TODO markers, headers-only, bootstrap content)
- File must be fresh (≤ 30 days)
- File scope must match the SPIDER-MAN target scope

If any check fails: SPIDER-MAN stops completely. No partial analysis. No findings emitted.

---

### Stub Detection Added

SPIDER-MAN treats BEHAVIOR.md as STUB if it:
- Contains placeholder text
- Contains TODO markers
- Contains only headers with no content
- Contains fewer than 5 meaningful behavior entries
- Contains only folder bootstrap generated content

---

### Freshness Rule Added

BEHAVIOR.md must be ≤ 30 days old.
Files older than 30 days trigger: `SPIDERMAN_PREFLIGHT_BLOCK: BEHAVIOR_STALE`

---

### Scope Resolution Added

```
Feature scope:  ZZnotforproduction/APPS/VCSM/features/[feature]/BEHAVIOR.md
Module scope:   ZZnotforproduction/APPS/VCSM/features/[feature]/modules/[module]/BEHAVIOR.md
```

Module scope takes precedence when a module is the target.

---

### Behavior Source Enforcement Added

§0 makes BEHAVIOR.md the mandatory source of truth for:
- Expected workflows
- Actor actions
- Permissions
- State transitions
- Validation rules
- Business rules
- Edge cases
- Failure states

SPIDER-MAN compares expected (BEHAVIOR.md) vs implemented (source). No BEHAVIOR.md = no comparison possible = gate blocks.

---

### Output Contract Preserved

Blocked output format (§0.5):
```
SPIDERMAN BLOCKED

Reason: [BLOCK_REASON]
Required Behavior Document: [path]
Next Action: Populate BEHAVIOR.md for this scope before running SPIDERMAN.
```

Success output format (§0.6):
```
SPIDERMAN PREFLIGHT PASS

Behavior Source: [path]
Proceeding with behavior validation.
```

These formats are new additions. Existing report sections (§15, §26) and output contract are unchanged.

---

### S7 P2/P3 Relaxation Retired

Previous S7 allowed P2/P3 features to proceed without BEHAVIOR.md under a `BEHAVIOR_CONTRACT_ABSENT` warning with `[UNANCHORED]` prefixed recommendations.

That mode is retired. §0 overrides S7. The gate is absolute for all feature priority levels.

S7 updated to reflect: "§0 Behavior Dependency Gate supersedes this rule."

---

### §17 Completion Criteria Updated

Added as the first completion criterion:

> passed the Behavior Dependency Gate (§0) — BEHAVIOR.md located, verified present, populated, non-stub, and fresh

This ensures the gate appears in SPIDER-MAN's own self-assessment checklist, not just as a preflight block.

---

## Behavior-Change Check

```
SPIDERMAN behavior changed: YES — cannot run without a populated BEHAVIOR.md for any feature priority level.
S7 P2/P3 WARN mode: RETIRED.
Validation logic changed: NO — existing §3–§26 validation logic is unchanged.
Scanner integration (§18–§26): UNCHANGED.
BW/ELEKTRA linkage (§21): UNCHANGED.
PROFESSOR X linkage (§22): UNCHANGED.
Invariant coverage (§23): UNCHANGED.
```

---

## Blocking Conditions Reference

| Condition | Block Code |
|---|---|
| BEHAVIOR.md not found | `SPIDERMAN_PREFLIGHT_BLOCK: BEHAVIOR_REQUIRED` |
| File exists but empty | `SPIDERMAN_PREFLIGHT_BLOCK: BEHAVIOR_EMPTY` |
| File is a stub | `SPIDERMAN_PREFLIGHT_BLOCK: BEHAVIOR_STUB` |
| File older than 30 days | `SPIDERMAN_PREFLIGHT_BLOCK: BEHAVIOR_STALE` |
| File scope mismatch | `SPIDERMAN_PREFLIGHT_BLOCK: BEHAVIOR_SCOPE_MISMATCH` |
