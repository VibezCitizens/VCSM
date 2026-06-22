# Engine Permissions and Events
## Engine Architecture Contract — Permission Contract and Event Contract (Locked)

> **Source:** [../enginecontract.md](../enginecontract.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [04-engine-public-api.md](04-engine-public-api.md)
> **Reads Before:** [06-engine-isolation-versioning.md](06-engine-isolation-versioning.md)
> **Cross-Links:** [../../Capability/04-event-contract.md](../Capability/04-event-contract.md) (capability-level event envelope and naming)

---

## Permission Contract

Engines must return explicit permission snapshots.

Example:

```
PermissionSnapshot {
  canViewConversation
  canSendMessage
  canEditOwnMessage
  canDeleteOwnMessage
  canManageMembers
  canModerate
}
```

Apps must not compute permissions themselves.

---

## Event Contract

Engines must emit domain events.

Example:

```
conversation.created
message.sent
message.edited
message.deleted
conversation.read
```

Apps may subscribe to these events.
