# Scanner Trust Contract

**Ticket:** TICKET-SCANNER-COMMAND-PREFLIGHT-0001
**Status:** ACTIVE
**Version:** 1.0
**Created:** 2026-06-02
**Category Key:** platform-documentation

---

## Purpose

Defines what commands MAY and MAY NOT trust from scanner output without additional
source verification. Scanner maps report source reality only. They never assert
security posture, architecture compliance, exploitability, or release readiness.

---

## Core Principle

> Scanner confidence is extraction confidence — not architectural approval.

A write surface with `confidence: HIGH` means the scanner is confident it extracted
the mutation call correctly from the AST. It does NOT mean the mutation is safe,
authorized, or architecturally sound.

A security path with `confidence: LOW` means the scanner found a write surface
without a resolved caller chain. It does NOT mean the surface is unexploitable —
it means the caller chain was not traced, which may mean the surface is MORE dangerous,
not less.

---

## Confidence Levels Defined

| Level | Extraction Meaning | Security/Architecture Meaning |
|---|---|---|
| HIGH | Direct AST symbol or call evidence | No security or architecture implication |
| MEDIUM | AST evidence plus import/path traversal heuristic | No security or architecture implication |
| LOW | Discovered surface without resolved caller path | Surface may be MORE dangerous — missing caller chain warrants deeper inspection |
| BLOCKED | Map/source conflict detected | Do not use this entry without source inspection |

---

## What Commands MAY Trust From Scanner

The following facts are trusted directly from scanner maps. No additional source
verification required before including them in command output.

### Structural Facts (HIGH or MEDIUM confidence)

| Trusted Fact | Source Map | Notes |
|---|---|---|
| Feature exists with this name and path | feature-map | If scanner found it, it exists |
| Feature belongs to this app | feature-map | App classification is structural |
| Feature has this kind (feature/platform-area) | feature-map | Kind is structural |
| File X imports from file Y | dependency-map | Import is a source fact |
| Route `/path` exists at this access level | route-map | Route is declared in source |
| Write surface exists at file/function/table | write-surface-map | Mutation call is in source |
| RPC `name` is called from this file | rpc-map | RPC call is in source |
| Edge function `name` is invoked from this file | edge-function-map | Invocation is in source |
| Test file exists with test declarations | test-map | Test file is in source |
| Engine `name` is imported by feature `X` | engine-execution-map | Import is in source |
| Call edge from symbol A to symbol B | callgraph | Call relationship is in source |

### Inventory Facts (for scope discovery)

| Trusted Fact | Source Map |
|---|---|
| Total write surface count = N | write-surface-map root |
| Total route count = N | route-map root |
| Total RPC count = N | rpc-map root |
| Feature count = N | feature-map root |
| Test count = N | test-map root |

---

## What Commands MAY NOT Trust From Scanner

The following inferences MUST NOT be derived from scanner output alone. They require
source verification (reading the actual source files) before appearing in command output.

### Security Determinations

| Prohibited Inference | Why It Is Prohibited |
|---|---|
| "This write surface is unauthorized" | Scanner cannot evaluate auth guards or RLS policies |
| "This route is unauthenticated" | Route access = `unknown` or `public` is structural; auth enforcement is runtime |
| "This RPC bypasses authorization" | Scanner sees the call; it cannot see the guard that wraps it |
| "This surface is exploitable" | Exploitability requires understanding execution context, not just surface existence |
| "This is a critical vulnerability" | Severity requires human analysis of trust boundaries |
| "This path allows ownership bypass" | Ownership enforcement is in source, not in the call graph alone |
| "RLS is missing on this table" | Scanner does not read database policies |

### Architecture Determinations

| Prohibited Inference | Why It Is Prohibited |
|---|---|
| "This import is an architecture violation" | scanner.dependency-map shows imports; layer rules require interpretation |
| "This engine usage is unauthorized" | engine-execution-map shows usage; boundary contracts require interpretation |
| "This feature is dead code" | Zero callers in callgraph may mean lazy loading, not dead code |
| "This DAL is an N+1 query" | Call graph shows the chain; N+1 diagnosis requires semantic interpretation |

### Release and Compliance Determinations

| Prohibited Inference | Why It Is Prohibited |
|---|---|
| "This feature is release-ready" | Release readiness requires governance review, not just scan completeness |
| "No security issues found" | Scanner finds surfaces; absence of findings is not absence of issues |
| "Test coverage is sufficient" | test-traceability-map shows traceability; sufficiency is a governance judgment |
| "Behavior is compliant" | BEHAVIOR.md compliance requires cross-checking spec vs. source vs. tests |

---

## Confidence → Trust Mapping Per Command

### VENOM

| Scanner Signal | Trust Level | Action |
|---|---|---|
| Write surface at file/table (HIGH) | Trusted as surface existence | Must verify: is auth check present before this write? |
| Security path with access=protected (HIGH) | Trusted: route is declared protected | Must verify: is auth actually enforced at runtime? |
| Security path with access=unknown (LOW) | Treat as unresolved risk | Must inspect source to determine access control |
| RPC call exists (HIGH) | Trusted: RPC is called | Must verify: who can call this RPC? Is caller authorized? |

### BLACKWIDOW

| Scanner Signal | Trust Level | Action |
|---|---|---|
| Write surface without caller chain (LOW) | HIGH attack priority — unresolved chain | Must investigate: why is there no caller chain? |
| Security path (any confidence) | Use as attack target inventory | Attack result (BLOCKED/BYPASSED) requires source inspection |
| Callgraph call edge (HIGH) | Trusted as call relationship | Attack feasibility requires source inspection |

### SPIDER-MAN

| Scanner Signal | Trust Level | Action |
|---|---|---|
| Test file exists (HIGH) | Trusted as test presence | Must verify: does the test prove behavior, or is it scaffolding? |
| Test traceability path (MEDIUM) | Trusted as a connection candidate | Must verify: does the test actually assert the behavior? |
| Write surface without test (any) | Trusted as coverage gap indicator | Must verify: is coverage gap actual or is test in different file? |

### ARCHITECT

| Scanner Signal | Trust Level | Action |
|---|---|---|
| Feature exists with path (HIGH) | Trusted | No verification needed |
| Import from engine (HIGH) | Trusted as import existence | Must verify: is this import within allowed boundary? |
| Dead node (no callers in callgraph) | Candidate for dead code | Must verify: could be lazy-loaded or dynamically referenced |
| Cross-feature import (HIGH) | Trusted as import | Must verify: does it violate isolation contract? |

---

## LOW Confidence Signals — Special Rules

Scanner `confidence: LOW` means a surface was discovered without a resolved caller
chain. This does NOT mean the surface is safe. It means the scanner could not trace
who calls it.

**LOW confidence signals receive elevated scrutiny, not reduced:**

1. VENOM: LOW confidence security paths are the HIGHEST priority for manual source review.
2. BLACKWIDOW: LOW confidence call graph edges are primary attack scenario targets.
3. SPIDER-MAN: LOW confidence test traceability means the test-to-surface link is unverified.
4. ELEKTRA: LOW confidence source→sink chains must be fully source-verified before emitting findings.

A LOW confidence finding emitted as a HIGH severity finding without source verification
is a SPIDER-MAN Rule S9 violation (scaffolding-not-behavior equivalent for security commands).

---

## Trust Contract Enforcement Per Finding

Every finding emitted by a security or architecture command must include one of:

```
[SOURCE_VERIFIED] — The finding was confirmed by reading the source file at the cited path.
[SCANNER_SIGNAL_UNVERIFIED] — The finding is derived from scanner output. Source not read.
[MEDIUM_CONFIDENCE] — Derived from scanner with heuristic evidence. Should be verified.
```

A SCANNER_SIGNAL_UNVERIFIED finding:
- Must never be emitted at CRITICAL severity
- Must be explicitly labeled as requiring human confirmation
- Must not be included in THOR release gate evaluation

---

*Generated: 2026-06-02 | Ticket: TICKET-SCANNER-COMMAND-PREFLIGHT-0001*
