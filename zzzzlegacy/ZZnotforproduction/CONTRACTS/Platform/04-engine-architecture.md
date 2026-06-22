# Engine Architecture
## Platform Architecture Contract — Engine Internal Architecture (Locked)

> **Source:** [platformcontract.md](platformcontract.md)
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [03-dependency-rules.md](03-dependency-rules.md)
> **Reads Before:** [05-app-architecture.md](05-app-architecture.md)
> **Cross-Links:** [02-layer-responsibilities.md](02-layer-responsibilities.md), [03-dependency-rules.md](03-dependency-rules.md)
> **See Also:** `enginecontract.md` — full engine layer contract

---

## Engine Internal Architecture

Every engine must follow the layered architecture defined in `enginecontract.md`.

Example structure:

```
engines/chat/
  src/
    adapters/
    dal/
    model/
    controller/
    hooks/
    types/
```

Layer order is mandatory:

```
DAL → Model → Controller → Hooks → Adapters
```

Adapters define the public surface.

Apps must consume engines only through adapters.
