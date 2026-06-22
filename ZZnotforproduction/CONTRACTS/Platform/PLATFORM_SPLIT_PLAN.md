# Platform Architecture Contract — Split Migration Plan
## Phase 5 — Final Migration Plan

> **Source Contract:** platformcontract.md (PlatformArchitectureContract.md, 294 lines)
> **Goal:** Decompose into a modular contract library without changing architectural meaning
> **Constraint:** No rule may be lost. No architectural meaning may change. platformcontract.md is preserved.

---

## Source File Rename

| Old Name | New Name | Status |
|---|---|---|
| `PlatformArchitectureContract.md` | `platformcontract.md` | `platformcontract.md` created — `PlatformArchitectureContract.md` should be deleted after verification |

The original file `PlatformArchitectureContract.md` was plain text with no markdown
structure. `platformcontract.md` is the properly formatted canonical version with
identical wording and markdown headers/code blocks applied.

---

## Files Created

| File | Sections Moved In | Rationale |
|---|---|---|
| `INDEX.md` | Platform purpose, guarantees, section ownership, cross-links, Machine Reading Index | Navigation hub — meta-sections that serve readers, not rules |
| `01-platform-structure.md` | Platform purpose / guarantees, Platform Structure (root dirs) | Foundational — defines the workspace boundary and three-layer model |
| `02-layer-responsibilities.md` | Apps Layer, Engines Layer, Shared Layer (all definitions) | Layer identity — what each layer owns, where it lives, what it must not do |
| `03-dependency-rules.md` | Dependency Direction Rule, App/Engine/Shared Isolation Rules | Structural backbone — how layers relate and what breaks the contract |
| `04-engine-architecture.md` | Engine Internal Architecture | Engine-specific detail; consumed by engineers working on engines |
| `05-app-architecture.md` | App Architecture, Platform Routing Rule, Platform Deployment Rule | App-specific detail; co-located because all three govern app behavior |
| `06-platform-principles.md` | Platform Event Model, Ownership Model, Scaling Model, Enforcement Rule, Platform Principle | Closing contract section — axioms, intent, and enforcement expectations |
| `PLATFORM_SECTION_MAP.md` | Phase 1 output | Classification inventory |
| `PLATFORM_VS_GOVERNANCE_REPORT.md` | Phase 4 output | Architecture vs governance classification |
| `PLATFORM_SPLIT_PLAN.md` | Phase 5 output | This file |

---

## Files Left Unchanged

| File | Reason |
|---|---|
| `platformcontract.md` | Preserved as the canonical god-file. Authoritative locked contract. Library files are derived views. |
| `PlatformArchitectureContract.md` | Not deleted — manual deletion after verification confirms equivalence |

---

## Cross-Link Requirements

```
01-platform-structure.md
  ↔ 02-layer-responsibilities.md  (structure defines where layers live; responsibilities define what they do)
  ↔ 03-dependency-rules.md        (structure defines the three layers; rules govern how they interact)

02-layer-responsibilities.md
  ↔ 03-dependency-rules.md        (layer constraints inform isolation rules)
  ↔ 04-engine-architecture.md     (engine layer definition + engine internal architecture)
  ↔ 05-app-architecture.md        (app layer definition + app internal structure)

03-dependency-rules.md
  ↔ 02-layer-responsibilities.md  (isolation rules derive from layer responsibility definitions)
  ↔ 04-engine-architecture.md     (engine isolation + engine adapter surface)
  ↔ 06-platform-principles.md     (DAG principle restated in platform principles)

04-engine-architecture.md
  ↔ 02-layer-responsibilities.md  (engine layer definition)
  ↔ 05-app-architecture.md        (apps consume engines through adapters)

05-app-architecture.md
  ↔ 02-layer-responsibilities.md  (app layer definition)
  ↔ 04-engine-architecture.md     (apps consume engines only through adapters)
  ↔ 06-platform-principles.md     (deployment is part of the platform ownership + scaling model)

06-platform-principles.md
  ↔ 01-platform-structure.md      (scaling model references root structure)
  ↔ 03-dependency-rules.md        (DAG principle)
  ↔ 04-engine-architecture.md     (event model — engines emit, apps subscribe)
```

---

## Compatibility Strategy

### platformcontract.md is not deleted or modified

`platformcontract.md` remains the locked, authoritative contract. The library files are
derived views — modular slices of the same contract. Any reader can use either:

- `platformcontract.md` — for the complete contract in one read
- `INDEX.md` → individual library files — for targeted, navigable access

### Original wording is preserved verbatim

No rule is reworded, shortened, or reinterpreted. Library files contain exact copies
of the sections they extract. Only navigation headers and cross-link sections are new
content (clearly separated from rule content).

### Formatting improvement

The original `PlatformArchitectureContract.md` was plain text with no markdown structure.
`platformcontract.md` and all library files apply proper markdown formatting (headings,
code blocks). All wording is identical to the original — only structure was added.

---

## Reading Order

```
01-platform-structure.md
  → 02-layer-responsibilities.md
    → 03-dependency-rules.md
      → 04-engine-architecture.md
        → 05-app-architecture.md
          → 06-platform-principles.md
```

For a targeted review (e.g. verifying engine isolation):

```
INDEX.md → Machine Reading Index → 03-dependency-rules.md (Engine Isolation Rule)
```

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Two files with same content exist during transition (`PlatformArchitectureContract.md` + `platformcontract.md`) | Low | Note to delete `PlatformArchitectureContract.md` after verification |
| Platform Scaling Model grouped with principles may seem misplaced | Low | Its placement is justified — scaling guidance reinforces the ownership model directly above it |
| Event Model grouped with principles rather than given its own file | None | Section is 10 lines; extracting it would create an unbalanced micro-file |

---

## Implementation Checklist

- [x] `platformcontract.md` created — properly formatted canonical god-file
- [x] `PLATFORM_SECTION_MAP.md` — Phase 1 complete
- [x] `PLATFORM_VS_GOVERNANCE_REPORT.md` — Phase 4 complete
- [x] `PLATFORM_SPLIT_PLAN.md` — Phase 5 complete
- [x] `INDEX.md` — Phase 3 complete
- [x] `01-platform-structure.md` — library file created
- [x] `02-layer-responsibilities.md` — library file created
- [x] `03-dependency-rules.md` — library file created
- [x] `04-engine-architecture.md` — library file created
- [x] `05-app-architecture.md` — library file created
- [x] `06-platform-principles.md` — library file created
- [ ] Delete `PlatformArchitectureContract.md` after verifying `platformcontract.md` is equivalent
- [ ] Verify: no rule present in `PlatformArchitectureContract.md` is absent from any library file
- [ ] Verify: no rule wording was altered during extraction
