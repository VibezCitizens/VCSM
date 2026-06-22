# Architecture Contract — Split Migration Plan
## Phase 5 — Final Migration Plan

> **Source Contract:** ARCHITECTURE.md (1271 lines, 42 sections)
> **Goal:** Decompose into a modular contract library without changing architectural meaning
> **Constraint:** No rule may be lost. No architectural meaning may change. ARCHITECTURE.md is preserved.

---

## Files to Create

| File | Sections Moved In | Lines Extracted | Rationale |
|---|---|---|---|
| `INDEX.md` | Agent Behavioral Rules, ToC, Machine Reading Index, document metadata | 1–8, 23–99 | Navigation hub; meta-sections that serve readers, not rules |
| `01-core-principles.md` | §1.1 Import Path Rule, §1.2 Module Build Order Rule, system design goals | 9–20, 119–153 | Foundational global rules required before reading any layer contract |
| `02-identity-contract.md` | §1.3 Identity Surface Rule, §1.4 Owner Meaning Rule | 156–190 | Identity is a cross-cutting concern; isolating it makes it auditable independently |
| `03-layer-contracts.md` | Layer Responsibility Summary, §2.1–2.7, §3 Shared Layer | 103–115, 194–558 | All standard layer definitions in one place; the largest single section |
| `04-resolver-contract.md` | §2.8 Resolver Contract | 459–513 | DI factory pattern is distinct from standard layer stack; needs independent discoverability |
| `05-feature-boundaries.md` | §5.1 Feature Containment, §5.2 Cross-Feature Boundary, §5.6 Recommended Feature Structure | 789–837, 922–952 | Feature isolation rules without adapter or module detail |
| `06-module-contract.md` | §5.7 Module Contract (all 8 sub-sections) | 954–1103 | Module contract is a complete sub-system; physically embedded in §5 but semantically independent |
| `07-adapter-contract.md` | §5.3 Adapter Contract, §5.4 Adapter Import Rule, §5.5 Screen-to-Feature Access Rule | 840–919 | Adapter rules form a coherent public-surface contract; separate from internal feature isolation |
| `08-dependency-rules.md` | §6.1–6.4 Dependency Rules | 1106–1177 | Dependency direction is the structural backbone; best read after feature and adapter boundaries |
| `09-ui-ownership.md` | §7 UI Ownership Rule | 1180–1255 | UI domain ownership is a specialized consequence of feature boundaries; needs its own section |
| `10-structural-integrity.md` | §4.1–4.4 Structural Integrity Rules | 560–762 | File size, single responsibility, fan-out, folder depth — quality enforcement rules grouped together |
| `11-naming-conventions.md` | §4.5 File Naming Rule | 764–784 | Naming conventions are independently scannable and searchable; isolating them aids tooling |
| `12-final-principles.md` | §8 Final Architectural Principles | 1257–1271 | System axioms; the closing statement of the contract; read last |

---

## Files to Leave Unchanged

| File | Reason |
|---|---|
| `ARCHITECTURE.md` | Preserved as the canonical god-file. It remains the authoritative locked contract. The library files are derived views, not replacements. |

---

## Sections to Move vs. Leave

### Sections moved to the library

All 42 classified sections are moved (extracted) into the library. No section is
discarded. Every rule that appears in ARCHITECTURE.md appears verbatim in exactly
one library file.

### Sections that appear in multiple files (cross-linked, not duplicated)

| Content | Primary File | Referenced In |
|---|---|---|
| Layer Responsibility Summary table | 03-layer-contracts.md | INDEX.md (linked) |
| Machine Reading Index | INDEX.md | Each library file header (back-link) |
| Resolver naming convention | 04-resolver-contract.md | 11-naming-conventions.md (cross-linked, not duplicated) |
| Decomposition must follow architectural layer boundaries | 10-structural-integrity.md | 03-layer-contracts.md (cross-linked) |
| Adapter as cross-feature access point | 07-adapter-contract.md | 05-feature-boundaries.md (cross-linked), 08-dependency-rules.md (cross-linked) |

---

## Cross-Link Requirements

The following cross-links must appear in the library files. These are navigation
pointers only — they do not duplicate rule content.

```
03-layer-contracts.md
  ↔ 05-feature-boundaries.md  (feature containment depends on layer ownership)
  ↔ 08-dependency-rules.md    (dependency direction enforces layer hierarchy)
  ↔ 10-structural-integrity.md (decomposition must follow layer boundaries)

05-feature-boundaries.md
  ↔ 06-module-contract.md     (modules are internal boundaries of features)
  ↔ 07-adapter-contract.md    (adapters are the public surface of features)
  ↔ 08-dependency-rules.md    (feature dependency rules follow from feature isolation)

06-module-contract.md
  ↔ 05-feature-boundaries.md  (modules live inside features)
  ↔ 08-dependency-rules.md    (module dependency rules follow DAG principle)

07-adapter-contract.md
  ↔ 05-feature-boundaries.md  (adapters enforce feature boundaries)
  ↔ 09-ui-ownership.md        (UI access across features must go through adapters)

08-dependency-rules.md
  ↔ 03-layer-contracts.md     (layer contracts define what may depend on what)
  ↔ 05-feature-boundaries.md  (cross-feature dependency uses adapters)
  ↔ 06-module-contract.md     (module dependency rules)

02-identity-contract.md
  ↔ 03-layer-contracts.md     (controller and hook layers consume identity)
  ↔ 04-resolver-contract.md   (resolver injects identity into engines)

04-resolver-contract.md
  ↔ 03-layer-contracts.md     (resolver is DAL-equivalent in privilege)
  ↔ 11-naming-conventions.md  (resolver naming conventions)

11-naming-conventions.md
  ↔ 03-layer-contracts.md     (naming encodes layer role)
  ↔ 04-resolver-contract.md   (resolver naming)
  ↔ 12-final-principles.md    (role of a file should be obvious from its name)

12-final-principles.md
  ↔ 01-core-principles.md     (foundational rules)
  ↔ 03-layer-contracts.md     (meaning lives in controllers, shape lives in models, etc.)
  ↔ 08-dependency-rules.md    (architecture grows horizontally, not vertically)
```

---

## Compatibility Strategy

### ARCHITECTURE.md is not deleted or modified

ARCHITECTURE.md remains the locked, authoritative contract. The library files are
derived views — modular slices of the same contract. Any reader can use either:

- `ARCHITECTURE.md` — for the complete contract in one read
- `INDEX.md` → individual library files — for targeted, navigable access

### Section numbers are preserved in library files

All original section numbers (§1.1, §2.3, §5.7, etc.) are preserved in the library
files exactly as they appear in ARCHITECTURE.md. This ensures:

- Existing enforcement points (e.g. `[§4.1]` references in code review comments) remain valid
- Machine Reading Index entries in INDEX.md continue to resolve

### Original wording is preserved verbatim

No rule is reworded, shortened, or reinterpreted. Library files contain exact copies
of the sections they extract. Only navigation headers and cross-link sections are new
content (clearly separated from rule content).

---

## Reading Order (Recommended)

For a new engineer reading the full contract:

```
01-core-principles.md
  → 02-identity-contract.md
  → 03-layer-contracts.md
    → 04-resolver-contract.md
  → 05-feature-boundaries.md
    → 06-module-contract.md
    → 07-adapter-contract.md
  → 08-dependency-rules.md
  → 09-ui-ownership.md
  → 10-structural-integrity.md
  → 11-naming-conventions.md
  → 12-final-principles.md
```

For a targeted review (e.g. reviewing a DAL file):

```
INDEX.md → Machine Reading Index → 03-layer-contracts.md §2.1
```

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Section reference drift (a code review comment cites `§4.1` but reader can't find it) | Low | Section numbers preserved verbatim; INDEX.md includes Machine Reading Index with links to library files |
| Duplication divergence (a rule is updated in one file but not the other) | Medium | ARCHITECTURE.md remains canonical; library files are derived. Any future contract revision updates ARCHITECTURE.md first, then the relevant library file |
| Reader confusion about which file is authoritative | Low | INDEX.md and each library file header explicitly state ARCHITECTURE.md is the locked source |
| §5.7 numbering looks wrong (Module Contract numbered §5.7 but lives in 06-module-contract.md) | Low | Section header preserved; INDEX.md notes extraction rationale; physical file order is reading-order-based, not numbering-based |
| Governance rules (§4.1–4.4) feel out of place in structural-integrity.md | None | These rules were always in the architecture contract; their placement is unchanged; only the file they live in changes |

---

## Implementation Checklist

- [x] ARCHITECTURE_SECTION_MAP.md — Phase 1 complete
- [x] ARCHITECTURE_VS_GOVERNANCE_REPORT.md — Phase 4 complete
- [x] ARCHITECTURE_SPLIT_PLAN.md — Phase 5 complete
- [x] INDEX.md — Phase 3 complete
- [x] 01-core-principles.md — library file created
- [x] 02-identity-contract.md — library file created
- [x] 03-layer-contracts.md — library file created
- [x] 04-resolver-contract.md — library file created
- [x] 05-feature-boundaries.md — library file created
- [x] 06-module-contract.md — library file created
- [x] 07-adapter-contract.md — library file created
- [x] 08-dependency-rules.md — library file created
- [x] 09-ui-ownership.md — library file created
- [x] 10-structural-integrity.md — library file created
- [x] 11-naming-conventions.md — library file created
- [x] 12-final-principles.md — library file created
- [ ] Verify: no rule present in ARCHITECTURE.md is absent from any library file
- [ ] Verify: no rule wording was altered during extraction
- [ ] Verify: ARCHITECTURE.md is unchanged
