# Naming Conventions
## VCSM Architecture Contract — §4.5 File Naming Rule (Locked)

> **Source:** [ARCHITECTURE.md](ARCHITECTURE.md) — Lines 764–784
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [10-structural-integrity.md](10-structural-integrity.md)
> **Reads Before:** [12-final-principles.md](12-final-principles.md)
> **Cross-Links:** [03-layer-contracts.md](03-layer-contracts.md) (naming encodes layer role), [04-resolver-contract.md](04-resolver-contract.md) (resolver naming), [12-final-principles.md](12-final-principles.md) (the role of a file should be obvious from its name)

---

### 4.5 File Naming Rule

> **Purpose:** Keep the filesystem readable and role-driven.

**Rule**

Files must follow these naming conventions:

- DAL files end with `.dal.js`
- Model files end with `.model.js`
- Controller files end with `.controller.js`
- Hook files begin with `use`
- Adapter files end with `.adapter.js`
- Resolver files end with `.resolver.js` and live in a `resolvers/` sub-folder
- View screens end with `.view.jsx` or `ViewScreen.jsx`
- Final screens end with `Screen.jsx`

The role of a file should be obvious from its name alone.
