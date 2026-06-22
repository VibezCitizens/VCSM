# SESSION EVIDENCE BUNDLE ENFORCEMENT REPORT

**Date:** 2026-06-05
**Scope:** Command Contracts — ARCHITECT, VENOM, BLACKWIDOW, ELEKTRA
**Status:** SUCCESS
**Behavior Change:** YES — downstream commands must consume ARCHITECT evidence bundle before reading source

---

## Commands Audited

| Command | Files Audited |
|---|---|
| ARCHITECT | `.claude/commands/architect/ARCHITECT.md`, `.claude/commands/architect/10-scanner-integration.md` |
| VENOM | `.claude/commands/venom/VENOM.md`, `.claude/commands/venom/09-scanner-integration.md` |
| BLACKWIDOW | `.claude/commands/blackwidow/BLACKWIDOW.md`, `.claude/commands/blackwidow/10-scanner-integration.md` |
| ELEKTRA | `.claude/commands/elektra/ELEKTRA.md`, `.claude/commands/elektra/10-scanner-integration.md` |

---

## Phase 1 — Source Read Behavior (Pre-Change)

| Command | Reads Source Directly | Reads ARCHITECT Output | Rebuilds Scope | Notes |
|---|---|---|---|---|
| ARCHITECT | YES (full authority) | N/A — produces output | YES (cartographer role) | V2: reads raw scanner maps + source for validation; produces architect-security-surface.json |
| VENOM | YES (targeted verification) | YES (architect-security-surface.json only) | NO in V2 | HYBRID: V2 consumed architect-security-surface.json but still re-read source for each finding surface; no pre-loaded call chain record |
| BLACKWIDOW | YES (targeted verification) | YES (architect-security-surface.json only) | NO in V2 | HYBRID: V2 consumed architect-security-surface.json + VENOM report, still re-traced call chains from source during attack scenario construction |
| ELEKTRA | YES (targeted verification) | YES (architect-security-surface.json only) | NO in V2 | HYBRID: V2 consumed architect-security-surface.json + VENOM + BLACKWIDOW, still re-read source to discover entry points and trace chains |

---

## Phase 2 — Classification (Pre-Change)

| Command | Classification | Reason |
|---|---|---|
| ARCHITECT | SOURCE_READER | Sole authority for raw scanner maps and source validation; cartographer role |
| VENOM | HYBRID | V2 consumed ARCHITECT security surface but lacked authoritative call chains; read source for each surface verification without pre-loaded architecture |
| BLACKWIDOW | HYBRID | V2 consumed ARCHITECT security surface and VENOM report but re-traced call chains from source during adversarial scenario construction |
| ELEKTRA | HYBRID | V2 consumed ARCHITECT security surface, VENOM, and BLACKWIDOW but re-read source to discover entry points and confirm chains not pre-traced |

**Root Gap:** `architect-security-surface.json` only contained security surface data (write surfaces, RPCs, edge functions, security paths, execution paths). It did NOT contain the full architecture picture: screens, hooks, controllers with file:line references, models, adapters, imports, dependency graph, behavior IDs, pre-traced call chains with user-controlled parameter labels. Each downstream command was therefore forced to re-read source to build the context it needed.

---

## Phase 3 — Evidence Bundle Contract Defined

### New ARCHITECT Output: evidence-bundle.json

**Primary output path:**
`ZZnotforproduction/APPS/VCSM/features/[feature]/outputs/[YYYY]/[MM]/[DD]/ARCHITECT/evidence-bundle.json`

**Module-scoped path:**
`ZZnotforproduction/APPS/VCSM/features/[feature]/modules/[module]/outputs/[YYYY]/[MM]/[DD]/ARCHITECT/evidence-bundle.json`

**Companion readable file:**
`evidence-bundle.md` — co-located with evidence-bundle.json

**Freshness window for downstream commands: 3 days**

### Bundle Contents

| Field | Description |
|---|---|
| version | Schema version |
| generatedAt | ISO timestamp |
| scope | VCSM:[feature] or ALL |
| feature | Feature name |
| module | Module name or null |
| architecture.sourceFilesRead | Every file ARCHITECT read, with layer and line range |
| architecture.routes | All routes with access type and ownerFile |
| architecture.screens | All screens with file path and route |
| architecture.hooks | All hooks with consumedBy reference |
| architecture.controllers | All controllers with file path, calledBy, calls, authCheck |
| architecture.dals | All DALs with file path, operation, table, schema |
| architecture.models | All models with file path |
| architecture.services | All services with file path |
| architecture.adapters | All adapters with file path and exposed surface |
| imports | Cross-file import graph |
| dependencies | featureDependencies, engineDependencies, sharedDependencies |
| engineUsage | Which engine, usedBy file, method called |
| databaseReads | DAL, function, table, schema, caller |
| databaseWrites | DAL, function, operation, table, schema, caller, ownershipCheck status |
| rpcs | RPC name, schema, file, caller |
| edgeFunctions | Function, file, callerResolved, caller |
| behaviorIds | §9 Must Never Happen IDs from BEHAVIOR.md |
| securitySensitiveSurfaces | Surface name, file, risk description, priority |
| callChains | Pre-traced chains: screen→hook→controller→dal with userControlledParams and ownershipChecked |
| provenance | sourceMaps consumed, sourceFilesValidated count, confidence rating |

---

## Phase 4 — Downstream Consumption Rule

### VENOM

**Consumes:**
- `evidence-bundle.json` (new — authoritative architecture record)
- `architect-security-surface.json` (security surface data)
- `ARCHITECTURE.md` (narrative and layer classification)
- `INDEX.md` (current source inventory)

**Must NOT rediscover:** routes, screens, controllers, DALs from source.

**May read source only for:** targeted verification of a specific finding (confirm ownership check absent/present at cited line).

**Evidence bundle gate added:** VENOM V2.1 now requires evidence-bundle.json freshness check before building surface inventory. MISSING or STALE → `VENOM BLOCKED: ARCHITECT evidence bundle required`.

### BLACKWIDOW

**Consumes:**
- `evidence-bundle.json` (new — authoritative call chains and attack target queue)
- `architect-security-surface.json` (security surface data)
- `VENOM report` (existing dependency gate)

**Must NOT rediscover:** architecture; call chains from source.

**May read source only for:** verifying exploitability of a specific adversarial bypass path.

**Evidence bundle gate added:** BLACKWIDOW V2 §1 now requires evidence-bundle.json freshness check before attack surface inventory construction. MISSING or STALE → `BLACKWIDOW BLOCKED: ARCHITECT evidence bundle required`.

### ELEKTRA

**Consumes:**
- `evidence-bundle.json` (new — authoritative call chain candidates and controller/DAL file references)
- `architect-security-surface.json` (security surface data)
- `VENOM report` (existing dependency gate)
- `BLACKWIDOW report` (existing dependency gate)

**Must NOT rediscover:** vulnerability surfaces; call chains already in evidence bundle.

**May read source only for:** precision confirmation of finding file:line; patch location verification.

**Evidence bundle gate added:** ELEKTRA V2 §3 now requires evidence-bundle.json freshness check before vulnerability surface inventory. MISSING or STALE → `ELEKTRA BLOCKED: ARCHITECT evidence bundle required`.

---

## Phase 5 — Source Read Budget

| Command | Full Source Read | Maximum Targeted Reads | Permitted Purpose |
|---|---|---|---|
| ARCHITECT | ALLOWED — full scope authority | Unlimited within declared feature scope | Discovery, validation, layer classification |
| VENOM | PROHIBITED for discovery | Only files in evidence-bundle.json architecture.* | Verify finding: ownership check present/absent at cited line |
| BLACKWIDOW | PROHIBITED for discovery | Only files in evidence-bundle.json architecture.* or callChains | Verify exploitability of specific bypass path |
| ELEKTRA | PROHIBITED for discovery | Only files in evidence-bundle.json architecture.sourceFilesRead or callChains | Confirm finding at exact file:line; verify patch location |

---

## Phase 6 — SOURCE READ SUMMARY Section

Every command report must now include a SOURCE READ SUMMARY section.

### VENOM
- Added to: `venom/09-scanner-integration.md` §V2.11
- Location in report: after §8 Confidence Summary (new §10 SOURCE READ SUMMARY)
- Format: table with Source Files Read count, Evidence Bundle Used path, Full Rediscovery Performed = NO

### BLACKWIDOW
- Added to: `blackwidow/10-scanner-integration.md` §11
- Location in report: §8.1 SOURCE READ SUMMARY (between Confidence Summary and §9 Invariant Attack Map)
- Format: table with Source Files Read count, Evidence Bundle Used path, Full Rediscovery Performed = NO

### ELEKTRA
- Added to: `elektra/10-scanner-integration.md` §14
- Location in report: §9.1 SOURCE READ SUMMARY (after Source Verification Summary)
- Format: table with Source Files Read count, Evidence Bundle Used path, Full Rediscovery Performed = NO

**Hard Rule:** Full Rediscovery Performed must be NO in all cases. If YES, the command must stop and route to ARCHITECT for a fresh evidence bundle before proceeding.

---

## Files Updated

| File | Change |
|---|---|
| `.claude/commands/architect/10-scanner-integration.md` | Added §1.4 evidence-bundle.json definition (schema, path, freshness, contents); added Step 10 EVIDENCE BUNDLE GENERATION to V2 runtime flow; renumbered OUTPUT GENERATION to Step 11 |
| `.claude/commands/architect/ARCHITECT.md` | Updated §5 Command Output to list evidence-bundle.json and evidence-bundle.md; updated §7 Completion Principle with Write 3 — Evidence Bundle requirement |
| `.claude/commands/venom/09-scanner-integration.md` | Updated §V2.1 to add evidence-bundle.json as required ARCHITECT output with Evidence Bundle Gate; updated §V2.5 workflow Step 1 and Step 2; added §V2.10 Source Read Budget; added §V2.11 SOURCE READ SUMMARY; added §10 to report format |
| `.claude/commands/venom/VENOM.md` | Updated §9 Completion Principle to add evidence-bundle consumption and SOURCE READ SUMMARY requirements |
| `.claude/commands/blackwidow/10-scanner-integration.md` | Updated §1 to add evidence-bundle.json as required ARCHITECT output with Evidence Bundle Gate; updated §5 workflow Steps 1 and 2; added §10 Source Read Budget; added §11 SOURCE READ SUMMARY; added §8.1 to report format |
| `.claude/commands/blackwidow/BLACKWIDOW.md` | Updated §7 Completion Principle to add Evidence Bundle section |
| `.claude/commands/elektra/10-scanner-integration.md` | Updated §3.1 to add evidence-bundle.json as required ARCHITECT output with Evidence Bundle Gate §3.1.1; updated §7 workflow Steps 1 and 2; added §13 Source Read Budget; added §14 SOURCE READ SUMMARY; added §9.1 to report format |
| `.claude/commands/elektra/ELEKTRA.md` | Updated §16 Completion Principle to add Evidence Bundle section |

---

## New Bundle Contract

```
ARCHITECT produces once:
  evidence-bundle.json          ← full architecture + call chains + security surfaces
  evidence-bundle.md            ← human-readable companion
  architect-security-surface.json ← security surface artifact (existing)

VENOM consumes:
  evidence-bundle.json          ← authoritative architecture; no source rediscovery
  architect-security-surface.json ← surface inventory
  ARCHITECTURE.md               ← narrative layer classification
  INDEX.md                      ← source inventory

BLACKWIDOW consumes:
  evidence-bundle.json          ← authoritative call chains; no source rediscovery
  architect-security-surface.json ← attack surface data
  VENOM report                  ← existing dependency gate

ELEKTRA consumes:
  evidence-bundle.json          ← authoritative chain candidates; no source rediscovery
  architect-security-surface.json ← sink inventory
  VENOM report                  ← existing dependency gate
  BLACKWIDOW report             ← existing dependency gate
```

---

## Behavior Change Check

| Dimension | Changed | Details |
|---|---|---|
| Command behavior | YES | Downstream commands must consume ARCHITECT evidence bundle before reading source. Evidence bundle gate added to VENOM, BLACKWIDOW, ELEKTRA. Source reads restricted to targeted finding verification only. |
| Analysis logic | NO | VENOM still performs trust boundary analysis. BLACKWIDOW still constructs adversarial scenarios. ELEKTRA still traces source-to-sink chains. The analysis methodology is unchanged; only the source discovery layer is replaced by bundle consumption. |
| Output format | YES | SOURCE READ SUMMARY section added to every V2 command report. Report section numbering updated in VENOM (§10, §11), BLACKWIDOW (§8.1), ELEKTRA (§9.1). |
| ARCHITECT scope | YES | ARCHITECT now produces evidence-bundle.json as Write 3 (required for V2 scanner-assisted runs). V2 runtime flow step 10 (EVIDENCE BUNDLE GENERATION) added; OUTPUT GENERATION renumbered to step 11. |
| Chain of trust | UNCHANGED | VENOM → BLACKWIDOW → ELEKTRA governance chain preserved. All existing dependency gates preserved. Evidence bundle is additive. |

---

## Summary

- 8 command contract files updated
- 1 new artifact type defined (evidence-bundle.json + evidence-bundle.md)
- 3 evidence bundle gates added (VENOM, BLACKWIDOW, ELEKTRA)
- 3 source read budget rules added
- 3 SOURCE READ SUMMARY sections added to report formats
- 3 completion principles updated
- 1 ARCHITECT Write 3 requirement added
- Full Rediscovery Performed = NO enforced across all downstream commands
