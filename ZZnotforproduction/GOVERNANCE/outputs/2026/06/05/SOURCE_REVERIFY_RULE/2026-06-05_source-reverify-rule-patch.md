# SOURCE_REVERIFY_RULE — Rule Patch Report

**Date:** 2026-06-05
**Ticket:** TICKET-COMMAND-REVERIFY-SOURCE-TRUTH-0001
**Status:** COMPLETE
**Rule Added:** SOURCE_REVERIFY_RULE

──────────────────────────────────────────────────

## Summary

Added `SOURCE_REVERIFY_RULE` as a global post-patch re-verification contract across all verification commands. The rule enforces that any re-verify run after a PATCH phase must re-read current source code and ARCHITECT artifacts — previous reports may not be used as closure proof.

──────────────────────────────────────────────────

## Files Created (10)

| File | Purpose |
|---|---|
| `.claude/contracts/source-reverify-rule.md` | Global rule contract — full text, requirements, forbidden actions, required output, finding status values, command-specific enforcement |
| `.claude/commands/elektra/11-source-reverify-rule.md` | ELEKTRA-specific: source-to-sink chain re-verification |
| `.claude/commands/blackwidow/11-source-reverify-rule.md` | BLACKWIDOW-specific: adversarial bypass re-test from current code |
| `.claude/commands/venom/10-source-reverify-rule.md` | VENOM-specific: trust boundary state rebuild from current source |
| `.claude/commands/SPIDER-MAN/11-source-reverify-rule.md` | SPIDER-MAN-specific: test-to-behavior traceability re-verification |
| `.claude/commands/hawkeye/10-source-reverify-rule.md` | HAWKEYE-specific: route definition and endpoint contract re-read |
| `.claude/commands/Sentry/11-source-reverify-rule.md` | SENTRY-specific: layer boundary and ARCHITECT artifact re-verification |
| `.claude/commands/thor/11-source-reverify-rule.md` | THOR-specific: SOURCE REVERIFY GATE enforcement for release evaluation |
| `.claude/commands/wolverine/11-source-reverify-rule.md` | WOLVERINE-specific: post-patch plan must route to source reverify |
| `ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/SOURCE_REVERIFY_RULE/2026-06-05_source-reverify-rule-patch.md` | This report |

──────────────────────────────────────────────────

## Files Modified (9)

| File | Change |
|---|---|
| `.claude/commands/elektra/ELEKTRA.md` | Added contract loading reference + sub-file row 11 |
| `.claude/commands/blackwidow/BLACKWIDOW.md` | Added contract loading reference + sub-file row 11 |
| `.claude/commands/venom/VENOM.md` | Added contract loading reference + sub-file row 10 |
| `.claude/commands/SPIDER-MAN/SPIDER-MAN.md` | Added contract loading reference + sub-file row 11 |
| `.claude/commands/hawkeye/HAWKEYE.md` | Added contract loading reference + sub-file row 10 |
| `.claude/commands/Sentry/Sentry.md` | Added contract loading reference + sub-file row 11 |
| `.claude/commands/thor/THOR.md` | Added contract loading reference + sub-file row 11 |
| `.claude/commands/wolverine/wolverine.md` | Added contract loading reference + sub-file row 11 |
| `.claude/commands/architect/00-architect-mapping-gate.md` | Added Section 11: Re-Verify Mode Enforcement (ARCHITECT_PREDATES_PATCH block code) |

──────────────────────────────────────────────────

## Rule Summary

**Trigger:** Any verification command running as a post-patch re-verify pass.

**Core requirement:** Previous reports are historical context only. Every re-verify run must:
1. Load current ARCHITECT static artifacts for the same scope (post-patch artifacts)
2. Re-read the current source files named by ARCHITECT
3. Reconstruct the source-to-sink or behavior chain from the current code
4. Re-test the original exploit, bypass, or regression condition from code
5. Classify closure only from current source evidence

**Required output:** `## SOURCE REVERIFY CHECK` table with 5 checks (all must = PASS)

**Required finding status values:**
- CLOSED_SOURCE_VERIFIED
- STILL_OPEN_SOURCE_VERIFIED
- PARTIAL_SOURCE_VERIFIED
- NOT_VERIFIABLE_SOURCE_MISSING
- NOT_VERIFIABLE_ARCHITECT_MISSING

**THOR enforcement:** THOR must refuse any verification result that does not carry SOURCE REVERIFY CHECK = PASS for post-patch re-verify runs.

**ARCHITECT gate enforcement:** ARCHITECT report must postdate the patch commit for re-verify runs — block code ARCHITECT_PREDATES_PATCH.

──────────────────────────────────────────────────

## Command Coverage

| Command | Sub-File | Contract Reference | THOR Gate |
|---|---|---|---|
| ELEKTRA | `11-source-reverify-rule.md` | YES | BLOCKED if SOURCE REVERIFY CHECK absent/FAIL |
| BLACKWIDOW | `11-source-reverify-rule.md` | YES | BLOCKED if SOURCE REVERIFY CHECK absent/FAIL |
| VENOM | `10-source-reverify-rule.md` | YES | BLOCKED if SOURCE REVERIFY CHECK absent/FAIL |
| SPIDER-MAN | `11-source-reverify-rule.md` | YES | BLOCKED if SOURCE REVERIFY CHECK absent/FAIL |
| HAWKEYE | `10-source-reverify-rule.md` | YES | BLOCKED if SOURCE REVERIFY CHECK absent/FAIL |
| SENTRY | `11-source-reverify-rule.md` | YES | BLOCKED if SOURCE REVERIFY CHECK absent/FAIL |
| THOR | `11-source-reverify-rule.md` (gate enforcer) | YES | N/A — THOR is the enforcement point |
| WOLVERINE | `11-source-reverify-rule.md` | YES | Must confirm SOURCE REVERIFY CHECK = PASS before marking task complete |
| ARCHITECT gate | Section 11 added | N/A | ARCHITECT_PREDATES_PATCH block code added |
