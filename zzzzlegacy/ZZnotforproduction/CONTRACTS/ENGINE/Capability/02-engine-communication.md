# Engine-to-Engine Communication
## Capability Contract — Communication Patterns and Preferred Rule (Locked)

> **Source:** [../capabilitycontract.md](../capabilitycontract.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [01-capability-definition.md](01-capability-definition.md)
> **Reads Before:** [03-capability-contracts.md](03-capability-contracts.md)
> **Cross-Links:** [04-event-contract.md](04-event-contract.md) (domain events pattern), [05-capability-ownership.md](05-capability-ownership.md) (direct calls → ownership + failure rules)

---

## Engine-to-Engine Communication Rule

Engine-to-engine communication must happen in one of only two ways:

### 1. Capability Calls

One engine consumes another engine's public adapter.

Use this only for synchronous, direct, low-risk interactions.

Example:

```
moderation engine asks notifications engine to notify moderators
payments engine asks analytics engine to track purchase completion
```

### 2. Domain Events

One engine emits events and other engines subscribe.

Use this for decoupled, asynchronous, fan-out interactions.

Example:

```
chat emits message.sent
notifications listens and creates a user notification
analytics listens and records engagement
search listens and updates indexing
```

---

## Preferred Rule

Prefer events over direct engine-to-engine capability calls when more than one downstream consumer may exist.

Reason:
events reduce direct dependency chains.

Use direct capability calls only when:

- the interaction is required immediately
- the result is needed synchronously
- no fan-out is expected
- failure must be handled inline
