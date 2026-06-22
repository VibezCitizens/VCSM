# Capability Contract — Index

> **Source Contract:** [../capabilitycontract.md](../capabilitycontract.md) — Locked. All rules authoritative there.
> **Status:** Locked
> **Index:** [../INDEX.md](../INDEX.md)

This contract defines how reusable engines expose capabilities and how other engines or apps may consume them.

A capability is a stable domain service provided by an engine.

Examples:

- chat
- notifications
- search
- analytics
- payments
- moderation

The goal of this contract is to ensure that engines can collaborate without depending on each other's internals.

---

## Reading Order

| Order | File | What It Covers |
|---|---|---|
| 1 | [01-capability-definition.md](01-capability-definition.md) | What a capability is; core rule; location rule; import rule |
| 2 | [02-engine-communication.md](02-engine-communication.md) | Engine-to-engine communication patterns; preferred rule |
| 3 | [03-capability-contracts.md](03-capability-contracts.md) | Capability output rule; capability input rule |
| 4 | [04-event-contract.md](04-event-contract.md) | Event envelope; event naming; capability versioning |
| 5 | [05-capability-ownership.md](05-capability-ownership.md) | Anti-corruption rule; examples; ownership rule; failure rule |
| 6 | [06-capability-principles.md](06-capability-principles.md) | Registry rule; platform-wide principle; collaboration map |

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
