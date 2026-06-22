# Final Architectural Principles
## VCSM Architecture Contract — §10 Final Architectural Principles (Locked)

> **Source:** [ARCHITECTURE.md](ARCHITECTURE.md) — Lines 1257–1271
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [14-styling-ownership-rule.md](14-styling-ownership-rule.md)
> **Cross-Links:** [01-core-principles.md](01-core-principles.md), [03-layer-contracts.md](03-layer-contracts.md), [08-dependency-rules.md](08-dependency-rules.md)

---

## §10 Final Architectural Principles (Locked)

- Security lives in RLS.
- Meaning lives in Controllers.
- Shape lives in Models.
- Timing lives in Hooks.
- Composition lives in Screens.
- Public feature boundaries live in Adapters.
- Shared remains domain-neutral.
- Data access stays dumb, explicit, and boring.
- Architecture must grow horizontally, not vertically.
- The role of a file should be obvious from its name.
- The role of a module should be obvious from its folder.
- A developer should understand the system by reading the filesystem without opening files.
