# Governance: IRONMAN — Feature Ownership and System Responsibility

**Command:** `/Ironman`  
**Authority:** Feature ownership mapping and system responsibility assignment  
**Mode:** Read-only analysis + ownership output  
**Scope in VPORT governance:** All modules — ownership and responsibility audit

---

## Responsibility

IRONMAN maps which code owns which behavior, which team or ticket owns which feature, and whether ownership gaps exist in VPORT dashboard modules.

It covers:
- Feature ownership mapping — which controller, hook, and DAL are responsible for each behavior
- Responsibility boundary audit — confirming no feature is doing work that belongs to another layer or feature
- Orphan code detection — files that exist but are not consumed by any known caller
- Dead code surface — exported functions that are never imported
- Actor-kind responsibility — confirming the correct VPORT kind handles each feature path
- Engine consumer wiring — confirming that engine features are consumed through the correct adapter pattern
- Ticket ownership — confirming open findings from other commands (V-SUB, DEFER) are tracked to a named ticket

## Ownership Map Format

```
IRONMAN — Feature Ownership Map — [module] — [YYYY-MM-DD]

Feature: [module name]
Route: [route or N/A]
VPORT Kind(s): [ALL | EXCHANGE | GAS | RESTAURANT | etc.]

Layer Owners:
  DAL:        [file path] — [function names]
  Model:      [file path] — [function names]
  Controller: [file path] — [function names]
  Hook:       [file path] — [hook name]
  Component:  [list of component files]
  View:       [file path]
  Final:      [file path]

Engine Dependencies: [engine name → adapter path]

Open Ownership Gaps: [list or "none"]
Orphan Files: [list or "none"]
```

## Output Location

`zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/YYYY-MM-DD_ironman_[module].md`

## When to Run

When a module is being onboarded to the governance matrix. After a significant refactor that moves files. When ARCHITECT finds cross-feature violations (IRONMAN confirms who should own the disputed code).

## Module Coverage

See `../vport-dashboard-governance-matrix.md` — IRONMAN is prerequisite reading for ARCHITECT on new modules.
