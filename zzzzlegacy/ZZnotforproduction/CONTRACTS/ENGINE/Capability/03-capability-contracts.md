# Capability Contracts
## Capability Contract — Output Rule and Input Rule (Locked)

> **Source:** [../capabilitycontract.md](../capabilitycontract.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [02-engine-communication.md](02-engine-communication.md)
> **Reads Before:** [04-event-contract.md](04-event-contract.md)
> **Cross-Links:** [01-capability-definition.md](01-capability-definition.md) (input/output rules apply to all capabilities)

---

## Capability Output Rule

Capabilities must return domain-safe outputs.

Capabilities must never return:

- raw DB rows
- DAL objects
- internal model artifacts
- engine-private flags

Capabilities may return:

- domain objects
- result envelopes
- permission snapshots
- event confirmations

---

## Capability Input Rule

Capabilities must accept stable domain inputs.

Capabilities must not require:

- UI objects
- route objects
- framework-specific screen props
- engine-internal database row types

Capabilities should accept:

- actorId
- entityId
- typed input payloads
- domain command objects
