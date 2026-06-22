# Governance: AVENGERSASSEMBLE — Full Governance Stack Invocation

**Command:** `/AvengersAssemble`  
**Authority:** Full governance stack — runs all required commands in sequence for a module  
**Mode:** Orchestration (delegates to each command in the correct order)  
**Scope in VPORT governance:** New modules, full re-audits, or pre-release full sweeps

---

## Responsibility

AVENGERSASSEMBLE invokes the complete governance stack for a VPORT dashboard module in the correct order. It is the single command that triggers the entire audit pipeline.

It covers:
- Full module audit from architecture through release gate
- Coordinating the mandatory command sequence
- Aggregating findings from all commands into a single module status
- Updating the governance matrix with results from all commands
- Producing a single summary of the module's release readiness

## Command Sequence

```
1. WOLVERINE     — Open ticket and plan
2. ARCHITECT     — Module structure review
3. DB            — Database layer review
4. VENOM         — Security and trust boundary review
5. BLACKWIDOW    — Adversarial verification of VENOM findings
6. ELEKTRA       — Targeted scan for any identified vulnerability classes
7. HAWKEYE       — Endpoint and API contract verification (if applicable)
8. KRAVEN        — Performance bottleneck analysis
9. LOKI          — Runtime trace (if runtime issues surfaced)
10. SENTRY       — Post-execution architecture compliance
11. IRONMAN      — Feature ownership map
12. SPIDER-MAN   — Test coverage and regression safety
13. FALCON       — iOS parity (if Mobile: YES)
14. VISION       — Analytics coverage (if applicable)
15. LOGAN        — Documentation sync
16. WATCHER      — Session change provenance
17. CAPTAIN      — Deferred item capture
18. THOR         — Release gate
```

## Skipping Commands

A command may be skipped only when:
1. Its scope does not apply to the module (e.g., HAWKEYE skipped for owner-only, non-API modules)
2. It was already run in the same session and returned VERIFIED or COMPLETE
3. The skip is explicitly noted in the THOR output

## Output Location

Summary: `zNOTFORPRODUCTION/_ACTIVE/audits/full-sweeps/YYYY-MM-DD_assemble_[module].md`  
Individual command reports: their respective audit subdirectories

## When to Run

When onboarding a new VPORT dashboard module to the governance matrix, or when a module needs a full re-audit before a major release.
