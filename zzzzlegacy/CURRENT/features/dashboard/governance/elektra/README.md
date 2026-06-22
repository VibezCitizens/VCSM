# Governance: ELEKTRA — Precision Security Scanner and Patch Advisor

**Command:** `/ELEKTRA`  
**Authority:** Targeted vulnerability class scanning — source→sink chain tracing  
**Mode:** Read-only scan + patch proposal (never applies patches)  
**Scope in VPORT governance:** Targeted modules with specific known vulnerability classes

---

## Responsibility

ELEKTRA is surgical. It does not do broad security sweeps (that is VENOM). It targets a specific vulnerability class, traces every source→sink chain for that class, and proposes the minimal patch for each finding.

It covers:
- Source→sink tracing for a named vulnerability class (e.g., raw UUID exposure, unvalidated write input, missing ownership gate)
- Confirming the full execution path from data entry to data output
- Identifying every instance of the vulnerability class in a module
- Proposing the exact patch for each finding — file path, line, and replacement
- Confirming what MUST NOT change in the surrounding code when applying each patch

## ELEKTRA Protocol

1. Receive the vulnerability class to scan (from VENOM finding or direct user instruction)
2. Identify all sources (entry points where tainted data enters)
3. Trace all sinks (where tainted data is written, returned, or rendered)
4. For each confirmed source→sink chain: classify severity, propose minimal patch
5. Output findings — do not apply patches

## Finding Format

```
ELEKTRA-[MODULE]-[NNN]

Vulnerability Class: [class name]
Severity: CRITICAL | HIGH | MEDIUM | LOW
Source: [file:line] — [where tainted data enters]
Sink: [file:line] — [where tainted data is exposed or written]
Confirmed Chain: YES | LIKELY | UNCERTAIN
Proposed Patch:
  File: [path]
  Line: [line number]
  Before: [current code]
  After: [proposed replacement]
Must Not Change: [constraints on the surrounding code]
```

## Output Location

`zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/YYYY-MM-DD_elektra_[module]_[class].md`

## When to Run

When VENOM or BLACKWIDOW identifies a specific vulnerability class that needs deep tracing. When a targeted security patch is needed for a known issue.

## Module Coverage

ELEKTRA findings are tracked as sub-items under the VENOM column in `../vport-dashboard-governance-matrix.md`.
