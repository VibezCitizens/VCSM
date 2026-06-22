# Platform Structure
## Platform Architecture Contract — Root Structure and Guarantees (Locked)

> **Source:** [platformcontract.md](platformcontract.md)
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads Before:** [02-layer-responsibilities.md](02-layer-responsibilities.md), [03-dependency-rules.md](03-dependency-rules.md)

---

This contract defines the structural rules for the entire platform workspace.

The platform is composed of three primary layers:

- Apps
- Engines
- Shared

Each layer has a strict responsibility and dependency direction.

The purpose of this contract is to guarantee:

- modular architecture
- cross-app reuse
- safe multi-product development
- deterministic dependency flow
- compatibility across web and mobile platforms

---

## Platform Structure

All code must live within the following root structure.

```
VC/
  apps/
  engines/
  shared/
  contract/
```

No code may exist outside these boundaries.
