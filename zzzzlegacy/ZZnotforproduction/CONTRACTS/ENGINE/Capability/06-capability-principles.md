# Capability Principles
## Capability Contract — Registry Rule, Platform Principle, and Collaboration Map (Locked)

> **Source:** [../capabilitycontract.md](../capabilitycontract.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [05-capability-ownership.md](05-capability-ownership.md)

---

## Capability Registry Rule

Each engine should document its public capability surface in one place.

Example:

```
engines/chat/src/adapters/chat.adapter.ts
engines/notifications/src/adapters/notifications.adapter.ts
```

And optionally a capability summary file:

```
engines/chat/CAPABILITY.md
engines/notifications/CAPABILITY.md
```

This allows apps and other engines to understand what is safe to consume.

---

## Platform-Wide Principle

Engines collaborate through contracts, not assumptions.
Events decouple.
Adapters protect.
Ownership stays singular.

---

## Example Engine Collaboration Map

```
apps
  ├─ vibez-web → chat
  ├─ vibez-web → notifications
  ├─ wentrex-web → chat
  └─ wentrex-web → search

chat
  ├─ emits message.sent
  ├─ emits conversation.created
  └─ may consume moderation capability

notifications
  └─ listens to chat events

analytics
  └─ listens to chat + notifications + payments events

search
  └─ listens to chat and content events

No engine imports another engine's internals.
```
