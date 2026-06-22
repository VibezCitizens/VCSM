# Engine Layer Contracts
## Engine Architecture Contract — Folder Structure and Internal Layer Contracts (Locked)

> **Source:** [../enginecontract.md](../enginecontract.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [02-engine-responsibilities.md](02-engine-responsibilities.md)
> **Reads Before:** [04-engine-public-api.md](04-engine-public-api.md)
> **Cross-Links:** [10-structural-integrity](../../Architecture/10-structural-integrity.md) (same layer principles apply)

---

## Engine Folder Structure

Each engine must follow this internal structure:

```
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

---

## DAL Contract

Purpose:

DAL is responsible for retrieving and writing data.

DAL files must:

- access the database
- use explicit column projections
- return raw database rows

DAL must never:

- enforce permissions
- derive domain meaning
- call controllers
- import hooks or UI

---

## Model Contract

Models translate database rows into domain objects.

Models may:

- normalize fields
- rename snake_case → camelCase
- derive simple flags

Models must never:

- call the database
- enforce permissions
- contain business rules

---

## Controller Contract

Controllers own domain meaning.

Controllers must:

- enforce permissions
- enforce membership rules
- enforce idempotency
- coordinate DAL calls
- return domain objects

Controllers must never:

- import UI
- import routing
- depend on app features

---

## Hooks Contract

Hooks orchestrate runtime behavior.

Hooks may:

- call controllers
- manage loading state
- subscribe to realtime updates

Hooks must never:

- access the database directly
- enforce business rules
