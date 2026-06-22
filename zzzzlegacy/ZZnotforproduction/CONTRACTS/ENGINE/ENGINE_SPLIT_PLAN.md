# Engine Contracts — Split Migration Plan
## Phase 5 — Final Migration Plan

> **Source Contracts:** enginecontract.md (295 lines), capabilitycontract.md (344 lines)
> **Goal:** Decompose into two modular contract libraries without changing architectural meaning
> **Constraint:** No rule may be lost. No architectural meaning may change. Source files preserved.

---

## Structural Decision: Two Subfolders

The two contracts govern distinct concerns. Subfolders make that visible in the filesystem.

| Subfolder | Source Contract | Concern |
|---|---|---|
| `Engine/` | enginecontract.md | How to BUILD an engine — internal architecture, layers, isolation |
| `Capability/` | capabilitycontract.md | How engines INTERACT — capability surfaces, E2E communication, events |

Both canonical god-files remain at `ENGINE/` root, unchanged.

---

## Files to Create

### Root Level

| File | Purpose |
|---|---|
| `INDEX.md` | Root navigation hub — links both contracts, reading order, machine reading index |
| `ENGINE_SECTION_MAP.md` | Phase 1 output |
| `ENGINE_VS_GOVERNANCE_REPORT.md` | Phase 4 output |
| `ENGINE_SPLIT_PLAN.md` | Phase 5 output (this file) |

### Engine/ Subfolder

| File | Sections Moved In | Source Lines |
|---|---|---|
| `Engine/INDEX.md` | Engine overview, example workspace, benefits (meta) | 1–21, 266–295 |
| `Engine/01-engine-definition.md` | Preamble, Engine Location Rule, Engine Must Be Headless | 1–21, 22–38, 84–95 |
| `Engine/02-engine-responsibilities.md` | Engine Dependency Direction, Engine Responsibilities, Engine Must Not Contain | 40–95 |
| `Engine/03-engine-layer-contracts.md` | Engine Folder Structure, DAL/Model/Controller/Hooks layer contracts | 97–175 |
| `Engine/04-engine-public-api.md` | Adapter Contract, Engine Public API | 176–218 |
| `Engine/05-engine-permissions-events.md` | Permission Contract, Event Contract | 220–249 |
| `Engine/06-engine-isolation-versioning.md` | Engine Versioning, Engine Isolation Rule, Core Principle | 251–286 |

### Capability/ Subfolder

| File | Sections Moved In | Source Lines |
|---|---|---|
| `Capability/INDEX.md` | Capability overview, core rule, collaboration map (meta) | 1–35, 323–344 |
| `Capability/01-capability-definition.md` | Purpose/Core Rule, Capability Definition, Location Rule, Import Rule | 1–79 |
| `Capability/02-engine-communication.md` | Engine-to-Engine Communication Rule, Preferred Rule | 80–118 |
| `Capability/03-capability-contracts.md` | Capability Output Rule, Capability Input Rule | 119–151 |
| `Capability/04-event-contract.md` | Event Contract Rule, Event Naming Rule, Capability Versioning Rule | 153–219 |
| `Capability/05-capability-ownership.md` | Anti-Corruption Rule, Examples, Capability Ownership Rule, Failure Rule | 221–301 |
| `Capability/06-capability-principles.md` | Capability Registry Rule, Platform-Wide Principle, Collaboration Map | 303–344 |

---

## Files Left Unchanged

| File | Reason |
|---|---|
| `enginecontract.md` | Canonical god-file — authoritative locked contract. Library files are derived views. |
| `capabilitycontract.md` | Canonical god-file — authoritative locked contract. Library files are derived views. |

**Note:** Both source files are plain text without markdown structure. The library files
apply proper markdown formatting (headings, code blocks) while preserving all wording
verbatim. The source files are intentionally left unformatted to signal their locked status
and to avoid any risk of meaning drift from formatting changes.

---

## Cross-Link Requirements

### Within Engine/

```
Engine/01-engine-definition.md
  ↔ Engine/02-engine-responsibilities.md  (definition establishes what engines are; responsibilities define what they own)
  ↔ Engine/03-engine-layer-contracts.md   (headless rule → layer contracts define domain-first structure)

Engine/02-engine-responsibilities.md
  ↔ Engine/03-engine-layer-contracts.md   (responsibilities define what engines own; layers implement it)
  ↔ Engine/06-engine-isolation-versioning.md (dependency direction enforces isolation rule)

Engine/03-engine-layer-contracts.md
  ↔ Engine/04-engine-public-api.md        (adapter is the last layer; public API is what adapters expose)

Engine/04-engine-public-api.md
  ↔ Capability/01-capability-definition.md (adapters = capability surface)

Engine/05-engine-permissions-events.md
  ↔ Capability/04-event-contract.md       (engine event contract → capability event contract rule)
```

### Within Capability/

```
Capability/01-capability-definition.md
  ↔ Engine/04-engine-public-api.md        (capability location = adapter location)
  ↔ Capability/02-engine-communication.md (import rule → communication pattern)

Capability/02-engine-communication.md
  ↔ Capability/04-event-contract.md       (domain events communication method → event contract)
  ↔ Capability/05-capability-ownership.md (direct calls → ownership + failure rules)

Capability/03-capability-contracts.md
  ↔ Capability/01-capability-definition.md (input/output rules apply to all capabilities)

Capability/04-event-contract.md
  ↔ Engine/05-engine-permissions-events.md (engine-level event contract)
  ↔ Capability/02-engine-communication.md  (events as preferred communication method)

Capability/05-capability-ownership.md
  ↔ Capability/02-engine-communication.md  (ownership rule defines why direct calls must be limited)
  ↔ Capability/04-event-contract.md        (anti-corruption rule applies especially to event payloads)
```

### Cross-Subfolder

```
Engine/04-engine-public-api.md  ↔  Capability/01-capability-definition.md
Engine/05-engine-permissions-events.md  ↔  Capability/04-event-contract.md
ENGINE/INDEX.md  ↔  Engine/INDEX.md
ENGINE/INDEX.md  ↔  Capability/INDEX.md
```

---

## Compatibility Strategy

### Canonical god-files are not modified

`enginecontract.md` and `capabilitycontract.md` remain the locked, authoritative contracts.
Library files are derived views. Any reader can use either:

- Source contracts — complete contracts in one read
- `INDEX.md` → subfolder library files — targeted, navigable access

### All wording preserved verbatim

No rule is reworded, shortened, or reinterpreted. Library files contain exact copies
of the sections they extract. Only navigation headers and cross-link sections are new.

---

## Reading Order

### For a new engine engineer

```
ENGINE/INDEX.md
  → Engine/INDEX.md
    → Engine/01-engine-definition.md
    → Engine/02-engine-responsibilities.md
    → Engine/03-engine-layer-contracts.md
    → Engine/04-engine-public-api.md
    → Engine/05-engine-permissions-events.md
    → Engine/06-engine-isolation-versioning.md
  → Capability/INDEX.md
    → Capability/01-capability-definition.md
    → Capability/02-engine-communication.md
    → Capability/03-capability-contracts.md
    → Capability/04-event-contract.md
    → Capability/05-capability-ownership.md
    → Capability/06-capability-principles.md
```

### For a targeted review (e.g. "can engine A call engine B's DAL?")

```
ENGINE/INDEX.md → Machine Reading Index → Capability/01-capability-definition.md (Core Rule)
```

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Source files remain plain text — reader confusion about canonical vs library files | Low | ENGINE/INDEX.md and each library file header explicitly state the source contract is canonical |
| Cross-subfolder links (Engine ↔ Capability) may confuse the reading boundary | Low | INDEX.md makes the boundary explicit; links are labelled with their direction |
| Event Contract appears in both Engine/05 and Capability/04 | None | They cover different scopes — engine-level (emitting) vs capability-level (envelope + naming + versioning); no duplication |

---

## Implementation Checklist

- [x] `ENGINE_SECTION_MAP.md` — Phase 1 complete
- [x] `ENGINE_VS_GOVERNANCE_REPORT.md` — Phase 4 complete
- [x] `ENGINE_SPLIT_PLAN.md` — Phase 5 complete (this file)
- [x] `ENGINE/INDEX.md` — root index complete
- [x] `Engine/INDEX.md` — subfolder index complete
- [x] `Engine/01-engine-definition.md` — created
- [x] `Engine/02-engine-responsibilities.md` — created
- [x] `Engine/03-engine-layer-contracts.md` — created
- [x] `Engine/04-engine-public-api.md` — created
- [x] `Engine/05-engine-permissions-events.md` — created
- [x] `Engine/06-engine-isolation-versioning.md` — created
- [x] `Capability/INDEX.md` — subfolder index complete
- [x] `Capability/01-capability-definition.md` — created
- [x] `Capability/02-engine-communication.md` — created
- [x] `Capability/03-capability-contracts.md` — created
- [x] `Capability/04-event-contract.md` — created
- [x] `Capability/05-capability-ownership.md` — created
- [x] `Capability/06-capability-principles.md` — created
- [ ] Verify: no rule in enginecontract.md is absent from Engine/ library
- [ ] Verify: no rule in capabilitycontract.md is absent from Capability/ library
- [ ] Verify: canonical source files are unchanged
