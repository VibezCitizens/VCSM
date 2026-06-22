# App Architecture
## Platform Architecture Contract — App Structure, Routing, and Deployment (Locked)

> **Source:** [platformcontract.md](platformcontract.md)
> **Status:** Locked — no changes without explicit contract revision
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [04-engine-architecture.md](04-engine-architecture.md)
> **Reads Before:** [06-platform-principles.md](06-platform-principles.md)
> **Cross-Links:** [02-layer-responsibilities.md](02-layer-responsibilities.md), [04-engine-architecture.md](04-engine-architecture.md)

---

## App Architecture

Apps may contain:

```
src/
  routes/
  screens/
  features/
  providers/
  layouts/
  policy/
```

Apps assemble domain experiences using engines.

Apps must never implement engine responsibilities internally.

---

## Platform Routing Rule

Routing exists only in apps.

Engines must never define routes.

Apps mount engine screens or hooks inside their own routing structure.

Example:

```
apps/vibez-web
  /inbox
  /conversation/:id

apps/wentrex-web
  /messages
  /messages/:id
```

Both apps may use the same chat engine.

---

## Platform Deployment Rule

Each app deploys independently.

Examples:

```
vibez.com
wentrex.com
```

Engines are distributed as packages and consumed during app builds.

Engines themselves are not deployed as standalone applications.
