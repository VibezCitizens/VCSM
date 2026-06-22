# Event Contract
## Capability Contract — Event Envelope, Naming, and Versioning (Locked)

> **Source:** [../capabilitycontract.md](../capabilitycontract.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [03-capability-contracts.md](03-capability-contracts.md)
> **Reads Before:** [05-capability-ownership.md](05-capability-ownership.md)
> **Cross-Links:** [../Engine/05-engine-permissions-events.md](../Engine/05-engine-permissions-events.md) (engine-level event contract), [02-engine-communication.md](02-engine-communication.md) (events as preferred communication method)

---

## Event Contract Rule

Every event emitted by an engine must have:

- event name
- version
- timestamp
- source engine
- payload

Standard event envelope:

```
{
  eventName,
  version,
  occurredAt,
  source,
  payload
}
```

Example:

```
{
  eventName: "message.sent",
  version: 1,
  occurredAt: "...",
  source: "chat",
  payload: {
    conversationId,
    messageId,
    senderActorId
  }
}
```

---

## Event Naming Rule

Events must use stable domain language.

Format:

```
<noun>.<past-tense-action>
```

Examples:

```
conversation.created
message.sent
message.edited
message.deleted
notification.created
report.submitted
payment.completed
```

Avoid vague names like:

```
chat.updated
message.changed
data.saved
```

---

## Capability Versioning Rule

Public capability surfaces must be version-safe.

Breaking changes require:

- a version bump
- migration notes
- explicit update path

Engines must not break consuming apps silently.
